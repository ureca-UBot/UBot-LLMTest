'use strict';
// 반복 항목(config.repeatItem) 일관성: 같은 입력을 N회 독립 실행한 답변이 흔들리는지.
// 원본 질문 ID로 묶고 회차로 정렬한다. 표현(패러프레이즈) 차이는 일관성 판단에 쓰지
// 않고 유사도로만 기록한다. 같은 오답을 반복한 경우를 구분하려고 기대 상태 일치 비율을
// 따로 남긴다(정확도와 일관성 분리).
//
//   raw/scored/<run_id>/repeat_consistency.jsonl        (원본 질문 1개당 1행)
//   raw/scored/<run_id>/repeat_consistency_summary.json
//
// Usage: node scripts/score/score_repeat_consistency.js <run_id> [--test v4] [--try try1]

const path = require('path');
const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { loadRun, writeJson, writeJsonl, runIdArg } = require('../lib/run_data');
const { isRepeatCase } = require('../lib/dataset');
const { extractNumbers } = require('../lib/regex_checks');
const { cosineSimilarity } = require('../lib/vectors');
const { avg, rate, groupBy } = require('../lib/stats');
const ollama = require('../lib/ollama');

const CHUNK = 32;

function setKey(values) {
  return JSON.stringify([...new Set(values)].sort());
}

function modalShare(values) {
  const counts = {};
  for (const v of values) counts[v] = (counts[v] || 0) + 1;
  const [mode, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [null, 0];
  return { mode, share: values.length ? count / values.length : null, distinct: Object.keys(counts).length };
}

async function main() {
  const runId = runIdArg(argv);
  const { config } = profile.load();
  const { rows, scoredDir } = loadRun(runId);
  const repeatRows = rows.filter(({ c }) => isRepeatCase(c));
  const summaryPath = path.join(scoredDir, 'repeat_consistency_summary.json');
  if (!repeatRows.length) {
    writeJson(summaryPath, { run_id: runId, n_groups: 0, note: `이 run에 ${config.repeatItem} 행이 없습니다.` });
    console.log(`반복 일관성: 이 run에 ${config.repeatItem} 행이 없어 건너뜁니다.`);
    return;
  }

  const groups = groupBy(repeatRows, ({ c }) => c.originalId);
  const withAnswer = repeatRows.filter(({ g }) => g.parsed && typeof g.parsed.answer === 'string' && g.parsed.answer.trim());
  const vecById = {};
  for (let i = 0; i < withAnswer.length; i += CHUNK) {
    const chunk = withAnswer.slice(i, i + CHUNK);
    const vecs = await ollama.withRetry(() => ollama.embed(config.embeddingModel, chunk.map(({ g }) => g.parsed.answer)),
      { label: `embed repeat ${i}` });
    chunk.forEach(({ g }, j) => { vecById[g.id] = vecs[j]; });
  }

  const scored = [];
  for (const [originalId, members] of groups) {
    const sorted = [...members].sort((a, b) => a.c.round - b.c.round);
    const expectedTotal = sorted[0].c.repeatTotal;
    const perRun = sorted.map(({ g, c }) => ({
      case_id: g.id,
      round: c.round,
      status: g.parsed?.status ?? null,
      numbers: g.parsed && typeof g.parsed.answer === 'string' ? extractNumbers(g.parsed.answer) : [],
      evidence_ids: Array.isArray(g.parsed?.evidence_ids) ? g.parsed.evidence_ids : [],
    }));
    const statuses = perRun.map((r) => r.status || 'NONE');
    const status = modalShare(statuses);
    const numbers = modalShare(perRun.map((r) => setKey(r.numbers)));
    const evidence = modalShare(perRun.map((r) => setKey(r.evidence_ids)));
    const sims = [];
    for (let i = 0; i < perRun.length; i++) {
      for (let j = i + 1; j < perRun.length; j++) {
        const a = vecById[perRun[i].case_id], b = vecById[perRun[j].case_id];
        if (a && b) sims.push(cosineSimilarity(a, b));
      }
    }
    const expected = sorted[0].c.expectedStatus;
    scored.push({
      original_id: originalId,
      run_id: runId,
      difficulty: sorted[0].c.difficulty,
      expected_status: expected,
      n_runs: perRun.length,
      n_expected_runs: expectedTotal,
      complete: perRun.length === expectedTotal,
      status_consistent: status.distinct === 1,
      status_mode: status.mode,
      status_mode_share: status.share,
      status_distinct: status.distinct,
      expected_status_share: rate(statuses.filter((s) => s === expected).length, statuses.length),
      numbers_consistent: numbers.distinct === 1,
      numbers_mode_share: numbers.share,
      evidence_consistent: evidence.distinct === 1,
      evidence_mode_share: evidence.share,
      fact_consistent: status.distinct === 1 && numbers.distinct === 1,
      paraphrase_similarity_avg: avg(sims),
      per_run: perRun,
    });
  }

  const complete = scored.filter((r) => r.complete);
  const summary = {
    run_id: runId,
    n_groups: scored.length,
    n_complete_groups: complete.length,
    denominator: '회차가 모두 생성된 원본 질문',
    status_consistency_rate: rate(complete.filter((r) => r.status_consistent).length, complete.length),
    numbers_consistency_rate: rate(complete.filter((r) => r.numbers_consistent).length, complete.length),
    evidence_consistency_rate: rate(complete.filter((r) => r.evidence_consistent).length, complete.length),
    fact_consistency_rate: rate(complete.filter((r) => r.fact_consistent).length, complete.length),
    status_mode_share_avg: avg(complete.map((r) => r.status_mode_share)),
    expected_status_share_avg: avg(complete.map((r) => r.expected_status_share)),
    consistent_but_wrong_groups: complete.filter((r) => r.status_consistent && r.status_mode !== r.expected_status).length,
    paraphrase_similarity_avg: avg(complete.map((r) => r.paraphrase_similarity_avg)),
  };
  writeJsonl(path.join(scoredDir, 'repeat_consistency.jsonl'), scored);
  writeJson(summaryPath, summary);
  console.log(`반복 일관성(상태+숫자) ${summary.fact_consistency_rate === null ? 'N/A' : (summary.fact_consistency_rate * 100).toFixed(1) + '%'} · 상태 ${summary.status_consistency_rate === null ? 'N/A' : (summary.status_consistency_rate * 100).toFixed(1) + '%'} (원본 질문 ${complete.length}/${scored.length}개 완료)`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
