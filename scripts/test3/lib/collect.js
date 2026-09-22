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

function scoredDir(suite, runId) {
  return path.join(ROOT, 'results', 'scored', suite, runId);
}
function generationPath(suite, runId) {
  return path.join(ROOT, 'results', 'raw', suite, runId, 'generation.jsonl');
}

// llm_judge_review/metrics.json은 라운드 전체가 한 파일이라 suite당 한 번만 읽는다.
const reviewMetricsCache = new Map();
function reviewMetrics(suite) {
  if (!reviewMetricsCache.has(suite)) {
    reviewMetricsCache.set(suite, readJson(
      path.join(ROOT, 'results', suite, 'llm_judge_review', 'metrics.json')));
  }
  return reviewMetricsCache.get(suite);
}

// run별 accuracy_hallucination_llm_summary.json이 없을 때의 폴백.
// test3 판정은 run별 summary 대신 전체를 metrics.json 하나에 썼다 — 필드 이름만
// 다르고 내용은 같으므로, 기존 summary와 "같은 모양"으로 되돌려준다(호출측 불변).
function judgeFromReviewMetrics(suite, runId) {
  const review = reviewMetrics(suite);
  if (!review || !Array.isArray(review.runs)) return null;
  const run = review.runs.find((r) => r.run_id === runId);
  if (!run || !run.metrics || !run.metrics.n) return null;
  const x = run.metrics;
  const rate = (a) => !a ? null : a.map((t) => ({
    key: t.type || t.difficulty, n: t.n, correct: t.correct,
    rate: t.n ? t.correct / t.n : null,
  }));
  return {
    n_scored: x.n,
    accuracy_verdict_counts: { CORRECT: x.correct, INCORRECT: x.incorrect },
    is_grounded_rate: 1 - x.hallucinated / x.n,   // 근거율 = 1 − 환각률
    grounding_score_avg: x.grounding,
    expression_quality_avg: x.expression,
    // 유형·난이도별 정답률 — 평균이 가리는 구멍을 보려면 이게 필요하다.
    by_type: rate(run.by_type),
    by_difficulty: rate(run.by_difficulty),
  };
}

// 부재판단 F1: TP=0이면 precision·recall이 0이라 score_absence_detection.js가
// 0/0을 null로 내보낸다. 관례상 이 경우 F1은 0이다(채점 원본은 건드리지 않는다).
function absenceF1(absence) {
  if (!absence) return null;
  if (absence.f1 !== null && absence.f1 !== undefined) return absence.f1;
  return absence.precision === 0 && absence.recall === 0 ? 0 : null;
}

// 한 run_id의 지표를 모은다. 없는 파일은 null.
function collectRun(suite, runId, primaryIds) {
  const dir = scoredDir(suite, runId);
  if (!fs.existsSync(dir)) return null;

  const gen = readJsonl(generationPath(suite, runId));
  const repeat = readJson(path.join(dir, 'repeat_consistency_summary.json'));
  const perf = readJson(path.join(dir, 'performance_summary.json'));
  const absence = readJson(path.join(dir, 'absence_detection_summary.json'));
  // 기존 경로를 우선하고, 없을 때만 llm_judge_review/metrics.json에서 폴백한다.
  const llm = readJson(path.join(dir, 'accuracy_hallucination_llm_summary.json'))
    || judgeFromReviewMetrics(suite, runId);

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

  return {
    suite, run_id: runId, gen_params: genParams,
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
    absence_f1: absenceF1(absence),
    llm_judge: llm ? {
      n_scored: llm.n_scored,
      correct_rate: llm.accuracy_verdict_counts && llm.n_scored
        ? (llm.accuracy_verdict_counts.CORRECT || 0) / llm.n_scored : null,
      is_grounded_rate: llm.is_grounded_rate,
      grounding_score_avg: llm.grounding_score_avg,
      expression_quality_avg: llm.expression_quality_avg,
      // 폴백 경로에서만 채워진다(test2의 run별 summary에는 없는 필드).
      by_type: llm.by_type || null,
      by_difficulty: llm.by_difficulty || null,
    } : null,
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

// 추론 ON/OFF 짝비교 — 두 조건 모두 채점된 "동일 문항"만 짝지은 값이다.
// 전체 run 값과 다르다(qwen3:14b 전체 70.7% vs 짝 기준 70.6%). 문서는 짝 기준을 쓴다.
const pairedSide = (b) => !b || !b.n ? null : {
  n: b.n,
  correct_rate: b.correct / b.n,
  is_grounded_rate: 1 - b.hallucinated / b.n,
  grounding_score_avg: b.grounding,
  expression_quality_avg: b.expression,
};

function loadPairedThinking(suite) {
  const review = reviewMetrics(suite);
  if (!review || !review.comparisons || !Array.isArray(review.comparisons.thinking)) return null;
  return review.comparisons.thinking.map((c) => ({
    model_tag: c.model,
    n_paired: c.n,
    on: pairedSide(c.before),
    off: pairedSide(c.after),
  }));
}

module.exports = {
  collectRun, loadPrimaryCases, findRunId, findTest2RunId,
  loadPairedThinking, readJson, readJsonl, scoredDir,
};
