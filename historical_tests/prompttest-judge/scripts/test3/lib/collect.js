'use strict';
// 라운드별 채점 결과를 읽어 비교 가능한 형태로 모은다.
// 아직 안 돌린 라운드는 조용히 null로 남기고, 무엇이 비었는지 호출측이
// 보고할 수 있게 한다 — 부분 실행 상태에서도 집계가 죽지 않아야 한다.

const fs = require('fs');
const path = require('path');
const { ROOT, sanitizeTag } = require('./runner');

const readJsonl = (p) => !fs.existsSync(p) ? null
  : fs.readFileSync(p, 'utf8').split(/\r?\n/).filter((s) => s.trim()).map((s) => JSON.parse(s));
const readJson = (p) => !fs.existsSync(p) ? null : JSON.parse(fs.readFileSync(p, 'utf8'));

const 기대상태_ENUM = {
  '답변': 'ANSWER', '부분 답변': 'PARTIAL', '확인 요청': 'CLARIFY',
  '답변 보류': 'ABSTAIN', '충돌 고지': 'CONFLICT', '범위 안내': 'OUT_OF_SCOPE',
};

// 결정론 RAG 근거율 계산용 보조 정보.
// score_rag_faithfulness.js는 NLI premise에 '제공 Context'만 넣고 '사용자 정보 /
// API 결과'·'대화 이력'을 빼므로, 그 두 입력을 쓰는 문항은 구조적으로 불리하다.
// 그래서 (a) 전체 (b) premise가 완전한 문항만 두 가지로 나눠서 낸다. 두 값의
// 모델 순위가 같으면 이 지표를 순위 비교용으로는 쓸 수 있다는 근거가 된다.
let premiseCompleteCache = null;
function loadPremiseCompleteIds() {
  if (premiseCompleteCache) return premiseCompleteCache;
  const { parseCsvObjects } = require('../../test2/lib/csv');
  const csvPath = path.join(ROOT, 'data', 'eval_sets', 'test_set2', 'cases.csv');
  const rows = parseCsvObjects(fs.readFileSync(csvPath, 'utf8'));
  premiseCompleteCache = new Set(rows
    .filter((r) => (r['사용자 정보 / API 결과'] || '없음') === '없음' && (r['대화 이력'] || '없음') === '없음')
    .map((r) => r['ID']));
  return premiseCompleteCache;
}

function scoredDir(suite, runId) {
  return path.join(ROOT, 'results', 'scored', suite, runId);
}
function generationPath(suite, runId) {
  return path.join(ROOT, 'results', 'raw', suite, runId, 'generation.jsonl');
}

// 한 run_id의 지표를 모은다. 없는 파일은 null.
function collectRun(suite, runId, primaryIds) {
  const dir = scoredDir(suite, runId);
  if (!fs.existsSync(dir)) return null;

  const gen = readJsonl(generationPath(suite, runId));
  const repeat = readJson(path.join(dir, 'repeat_consistency_summary.json'));
  const perf = readJson(path.join(dir, 'performance_summary.json'));
  const absence = readJson(path.join(dir, 'absence_detection_summary.json'));
  const llm = readJson(path.join(dir, 'accuracy_hallucination_llm_summary.json')) || judgeReviewMetrics(suite, runId);
  const ragRows = readJsonl(path.join(dir, 'rag_faithfulness.jsonl'));

  // 기대 응답 상태 일치율 — 고유문항(회차1) 기준.
  let statusMatch = null;
  let genParams = null;
  let avgEvalCount = null;
  if (gen && primaryIds) {
    const primary = gen.filter((r) => primaryIds.has(r.id));
    const matched = primary.filter((r) => r.parsed
      && r.parsed.status === 기대상태_ENUM[primaryIds.get(r.id)]);
    statusMatch = primary.length ? matched.length / primary.length : null;
    const withParams = gen.find((r) => r.gen_params);
    genParams = withParams ? withParams.gen_params : null;
    const counts = gen.map((r) => r.timing && r.timing.eval_count).filter((n) => typeof n === 'number');
    avgEvalCount = counts.length ? counts.reduce((a, b) => a + b, 0) / counts.length : null;
  }

  // 결정론 RAG 근거율. ABSTAIN/CLARIFY/OUT_OF_SCOPE로 답해 채점을 건너뛴 건
  // (status_based_skip)은 분모에서 빠지므로, 보류를 많이 한 모델은 분모가 작다.
  // 그 점을 읽는 쪽이 알 수 있게 분모도 함께 낸다.
  let ragRule = null;
  if (ragRows && primaryIds) {
    const complete = loadPremiseCompleteIds();
    const scored = ragRows.filter((r) => primaryIds.has(r.id) && !r.status_based_skip);
    const clean = scored.filter((r) => complete.has(r.id));
    const rate = (a) => (a.length ? a.filter((r) => r.faithful).length / a.length : null);
    ragRule = {
      rate: rate(scored),
      n_scored: scored.length,
      n_skipped: ragRows.filter((r) => primaryIds.has(r.id) && r.status_based_skip).length,
      rate_premise_complete: rate(clean),
      n_premise_complete: clean.length,
    };
  }

  return {
    suite, run_id: runId, gen_params: genParams,
    rag_rule: ragRule,
    n_generation: gen ? gen.length : null,
    status_match: statusMatch,
    avg_eval_count: avgEvalCount,
    format_success_rate: perf ? perf.format_success_rate : null,
    latency_avg_ms: perf ? perf.latency_ms.avg : null,
    latency_p95_ms: perf ? perf.latency_ms.p95 : null,
    tps_avg: perf ? perf.tps.avg : null,
    vram_mib: perf && perf.vram_mib ? perf.vram_mib : null,
    repeat: repeat ? {
      overall: repeat.overall_consistency_rate,
      status: repeat.status_consistency_rate,
      numbers: repeat.numbers_consistency_rate,
      evidence: repeat.evidence_consistency_rate,
      paraphrase_similarity: repeat.avg_paraphrase_similarity,
    } : null,
    absence_f1: absence ? absence.f1 : null,
    llm_judge: llm ? {
      n_scored: llm.n_scored,
      correct_rate: llm.accuracy_verdict_counts && llm.n_scored
        ? (llm.accuracy_verdict_counts.CORRECT || 0) / llm.n_scored : null,
      is_grounded_rate: llm.is_grounded_rate,
      grounding_score_avg: llm.grounding_score_avg,
      expression_quality_avg: llm.expression_quality_avg,
    } : null,
  };
}

// LLM Judge 채점 결과의 두 번째 출처.
// 파이프라인 안에서 채점하면 scored/<run>/accuracy_hallucination_llm_summary.json이
// 생기지만, test3 본 라운드는 별도 배치로 채점해 결과가
// results/<suite>/llm_judge_review/metrics.json에 모여 있다. 둘 다 없으면 null.
// 이 폴백이 없으면 문서를 다시 생성할 때 AI 채점 컬럼이 통째로 '-'가 된다.
let judgeReviewCache;
function judgeReviewMetrics(suite, runId) {
  if (judgeReviewCache === undefined) {
    judgeReviewCache = readJson(path.join(ROOT, 'results', suite, 'llm_judge_review', 'metrics.json'));
  }
  if (!judgeReviewCache || !Array.isArray(judgeReviewCache.runs)) return null;
  const run = judgeReviewCache.runs.find((r) => r.run_id === runId);
  if (!run || !run.metrics || !run.metrics.n) return null;
  const m = run.metrics;
  return {
    n_scored: m.n,
    // 내용 정확도 = CORRECT 판정 비율, 근거율 = 실질적 환각이 없는 답변 비율(1 - 환각률).
    accuracy_verdict_counts: { CORRECT: m.correct },
    is_grounded_rate: 1 - m.hallucinated / m.n,
    grounding_score_avg: m.grounding,
    expression_quality_avg: m.expression,
  };
}

// cases.csv에서 고유문항(회차1) ID -> 기대 응답 상태 맵.
function loadPrimaryCases() {
  const { parseCsvObjects } = require('../../test2/lib/csv');
  const csvPath = path.join(ROOT, 'data', 'eval_sets', 'test_set2', 'cases.csv');
  const rows = parseCsvObjects(fs.readFileSync(csvPath, 'utf8'));
  const map = new Map();
  for (const r of rows) if (r['실행 회차'] === '1') map.set(r['ID'], r['기대 응답 상태']);
  return map;
}

// 조건(condition)별로 해당 모델의 run_id를 찾는다. 날짜를 모르므로 디렉터리를 훑는다.
function findRunId(suite, modelTag, condition) {
  const base = path.join(ROOT, 'results', 'scored', suite);
  if (!fs.existsSync(base)) return null;
  const slug = sanitizeTag(modelTag);
  // ..._<slug>_<condition>_<날짜> 형태. 같은 조건이 여러 날짜에 있으면 최신 것.
  const matches = fs.readdirSync(base)
    .filter((d) => d.includes(`_${slug}_${condition}_`))
    .sort();
  return matches.length ? matches[matches.length - 1] : null;
}

// test2 기준 run_id — LLM Judge가 붙어 있는 2026-09-18 재실행 배치를 쓴다.
function findTest2RunId(modelTag) {
  const base = path.join(ROOT, 'results', 'scored', 'test2');
  if (!fs.existsSync(base)) return null;
  const slug = sanitizeTag(modelTag);
  const rerun = fs.readdirSync(base).filter((d) => d.includes(`_${slug}_`) && d.includes('rerun'));
  if (rerun.length) return rerun.sort()[rerun.length - 1];
  const any = fs.readdirSync(base).filter((d) => d.includes(`_${slug}_`));
  return any.length ? any.sort()[any.length - 1] : null;
}

module.exports = { collectRun, loadPrimaryCases, findRunId, findTest2RunId, readJson, readJsonl, scoredDir };
