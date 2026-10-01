'use strict';
// run 하나의 채점 요약(JSON)들을 한 객체로 모은다. run 보고서와 run 간 비교가 같이 쓴다.
// LLM Judge 요약은 배치별 폴더(raw/scored/<run_id>/llm_judge/<batch>/)에 있으면 붙인다.

const fs = require('fs');
const path = require('path');
const profile = require('./profile');

const FILES = {
  format: 'format_performance_summary.json',
  status: 'status_summary.json',
  evidence: 'evidence_summary.json',
  similarity: 'answer_similarity_summary.json',
  grounding: 'rag_grounding_summary.json',
  expression: 'expression_rules_summary.json',
  repeat: 'repeat_consistency_summary.json',
};

function readJson(p) {
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
}

function judgeSummaries(scoredDir) {
  const dir = path.join(scoredDir, 'llm_judge');
  if (!fs.existsSync(dir)) return {};
  const out = {};
  for (const batch of fs.readdirSync(dir)) {
    const s = readJson(path.join(dir, batch, 'summary.json'));
    if (s) out[batch] = s;
  }
  return out;
}

function loadRunSummary(runId) {
  const { paths } = profile.load();
  const scoredDir = paths.scoredDir(runId);
  const out = { run_id: runId, run_info: readJson(paths.runInfoPath(runId)) };
  for (const [key, file] of Object.entries(FILES)) out[key] = readJson(path.join(scoredDir, file));
  out.judge = judgeSummaries(scoredDir);
  return out;
}

// results/raw 아래의 run_id 목록(run_info.json이 있는 것만).
function listRuns() {
  const { paths } = profile.load();
  const rawRoot = path.join(paths.resultsDir, 'raw');
  if (!fs.existsSync(rawRoot)) return [];
  return fs.readdirSync(rawRoot)
    .filter((name) => fs.existsSync(path.join(rawRoot, name, 'run_info.json')))
    .sort();
}

module.exports = { loadRunSummary, listRuns };
