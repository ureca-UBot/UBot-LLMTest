'use strict';
// 기대 상태 판단: 응답 status와 데이터셋 기대 상태를 비교한다. 완전 결정론.
// 포맷 실패·생성 오류로 status가 없으면 predicted=null(불일치)로 분모에 남긴다.
//
//   raw/scored/<run_id>/status.jsonl
//   raw/scored/<run_id>/status_summary.json
//     - 기대 상태 일치율(독립 표본 · 항목별 · 난이도별)
//     - 혼동 행렬, 기대 상태별 재현율, 응답 상태별 정밀도
//     - FAQ 부재 판단(ABSTAIN 양성) Precision / Recall / F1
//
// Usage: node scripts/score/score_status.js <run_id> [--test v4] [--try try1]

const path = require('path');
const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { loadRun, summarizeScopes, headlineScope, writeJson, writeJsonl, runIdArg } = require('../lib/run_data');
const { OUTPUT_STATUSES } = require('../lib/prompts');
const { rate, groupBy, pct, num } = require('../lib/stats');
const { isRepeatCase } = require('../lib/dataset');
const { DIRECTIONS, direction } = require('../lib/status_direction');

function statusStats(rs) {
  const confusion = {};
  for (const r of rs) {
    const e = r.expected_status, p = r.predicted_status || 'NONE';
    confusion[e] = confusion[e] || {};
    confusion[e][p] = (confusion[e][p] || 0) + 1;
  }
  const expectedSet = [...new Set(rs.map((r) => r.expected_status))];
  const recall = Object.fromEntries(expectedSet.map((s) => {
    const sub = rs.filter((r) => r.expected_status === s);
    return [s, { n: sub.length, match: sub.filter((r) => r.status_match).length, rate: rate(sub.filter((r) => r.status_match).length, sub.length) }];
  }));
  const precision = Object.fromEntries([...OUTPUT_STATUSES, 'NONE'].map((s) => {
    const sub = rs.filter((r) => (r.predicted_status || 'NONE') === s);
    return [s, { n: sub.length, match: sub.filter((r) => r.status_match).length, rate: rate(sub.filter((r) => r.status_match).length, sub.length) }];
  }).filter(([, v]) => v.n > 0));

  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (const r of rs) {
    const e = r.expected_status === 'ABSTAIN', p = r.predicted_status === 'ABSTAIN';
    if (e && p) tp++; else if (!e && p) fp++; else if (e && !p) fn++; else tn++;
  }
  const P = tp + fp ? tp / (tp + fp) : null;
  const R = tp + fn ? tp / (tp + fn) : null;
  const F1 = P !== null && R !== null && P + R > 0 ? (2 * P * R) / (P + R) : null;

  return {
    n: rs.length,
    status_match_rate: rate(rs.filter((r) => r.status_match).length, rs.length),
    // 라벨 기준 방향. 본문 기준 방향(과대·과소 판단의 주 지표)은 Judge의 content_stance로
    // judge_report.js가 계산하고, 두 기준이 얼마나 일치하는지도 거기서 본다.
    label_direction_counts: Object.fromEntries(DIRECTIONS.map((d) => [d, rs.filter((r) => r.label_direction === d).length])),
    missing_status_count: rs.filter((r) => !r.predicted_status).length,
    recall_by_expected: recall,
    precision_by_predicted: precision,
    confusion,
    abstain_detection: { tp, fp, fn, tn, precision: P, recall: R, f1: F1 },
  };
}

function main() {
  const runId = runIdArg(argv);
  const { rows, scoredDir } = loadRun(runId);
  const scored = rows.map(({ g, c }) => {
    const predicted = g.parsed && typeof g.parsed.status === 'string' ? g.parsed.status : null;
    return {
      id: g.id, run_id: runId, model_tag: g.model_tag, item: c.item, difficulty: c.difficulty,
      expected_status: c.expectedStatus, predicted_status: predicted,
      status_match: predicted === c.expectedStatus,
      label_direction: direction(c.expectedStatus, predicted),
    };
  });
  const byId = new Map(rows.map(({ c }) => [c.id, c]));
  const caseOf = (r) => byId.get(r.id);

  const scoped = summarizeScopes(scored, caseOf, statusStats);
  const byDifficulty = Object.fromEntries([...groupBy(scored.filter((r) => !isRepeatCase(caseOf(r))), (r) => r.difficulty)]
    .map(([d, rs]) => [d, { n: rs.length, status_match_rate: rate(rs.filter((r) => r.status_match).length, rs.length) }]));
  const summary = { run_id: runId, ...scoped, independent_by_difficulty: byDifficulty };

  writeJsonl(path.join(scoredDir, 'status.jsonl'), scored);
  writeJson(path.join(scoredDir, 'status_summary.json'), summary);
  const { label, s } = headlineScope(summary);
  console.log(`기대 상태 일치 ${pct(s.status_match_rate)} (${label} ${s.n}행) · 부재 판단 F1 ${num(s.abstain_detection.f1, 3)}`);
}

try { main(); } catch (e) { console.error(e.message); process.exit(1); }
