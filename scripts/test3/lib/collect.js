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

// 한 run_id의 지표를 모은다. 없는 파일은 null.
function collectRun(suite, runId, primaryIds) {
  const dir = scoredDir(suite, runId);
  if (!fs.existsSync(dir)) return null;

  const gen = readJsonl(generationPath(suite, runId));
  const repeat = readJson(path.join(dir, 'repeat_consistency_summary.json'));
  const perf = readJson(path.join(dir, 'performance_summary.json'));
  const absence = readJson(path.join(dir, 'absence_detection_summary.json'));
  const llm = readJson(path.join(dir, 'accuracy_hallucination_llm_summary.json'));

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
