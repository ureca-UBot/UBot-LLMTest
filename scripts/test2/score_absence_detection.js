'use strict';
// Stage 2b (항목3 FAQ 부재 판단): 완전 결정론적 — status=ABSTAIN을 양성
// 클래스로 놓고 Precision/Recall/F1을 계산. LLM/NLI 불필요.
//
//   results/scored/test2/<run_id>/absence_detection.jsonl   (건별)
//   results/scored/test2/<run_id>/absence_detection_summary.json (P/R/F1)
//
// Usage: node scripts/score_absence_detection.js <run_id>

const fs = require('fs');
const path = require('path');
const { parseCsvObjects } = require('./lib/csv');
const { readAll, makeAppender } = require('./lib/jsonl');
const { expectedStatusEnum } = require('./lib/status_map');
const { isPrimaryRound } = require('./lib/rounds');
const suitePaths = require('./lib/suite');

const ROOT = path.join(__dirname, '..', '..');
const CASES_PATH = path.join(ROOT, 'data', 'eval_sets', 'test_set2', 'cases.csv');

function main() {
  const runId = process.argv[2];
  if (!runId) {
    console.error('usage: node scripts/score_absence_detection.js <run_id>');
    process.exit(1);
  }
  const cases = parseCsvObjects(fs.readFileSync(CASES_PATH, 'utf8'));
  const casesById = Object.fromEntries(cases.map((c) => [c['ID'], c]));

  const genPath = suitePaths.generationPath(runId);
  const rows = readAll(genPath);

  const outPath = path.join(suitePaths.scoredDir(runId), 'absence_detection.jsonl');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, '');
  const appender = makeAppender(outPath);

  let tp = 0, fp = 0, fn = 0, tn = 0, skipped = 0;
  for (const r of rows) {
    const c = casesById[r.id];
    if (!c) { skipped++; continue; }
    const expected = expectedStatusEnum(c['기대 응답 상태']);
    const predicted = r.parsed ? r.parsed.status : null;
    if (!expected || predicted === null) { skipped++; continue; }

    const expectedAbstain = expected === 'ABSTAIN';
    const predictedAbstain = predicted === 'ABSTAIN';
    // 집계(P/R/F1)는 고유 문항(실행 회차=1)만 — 반복 대상 40문항이 3배로
    // 잡혀서 혼동행렬이 편향되지 않도록. 건별 상세는 380행 전부 기록.
    if (isPrimaryRound(c)) {
      if (expectedAbstain && predictedAbstain) tp++;
      else if (!expectedAbstain && predictedAbstain) fp++;
      else if (expectedAbstain && !predictedAbstain) fn++;
      else tn++;
    }

    appender.append({
      id: r.id, run_id: runId, model_tag: r.model_tag, env: r.env,
      expected_status: expected, predicted_status: predicted,
      expected_abstain: expectedAbstain, predicted_abstain: predictedAbstain,
      correct_abstain_call: expectedAbstain === predictedAbstain,
    });
  }
  appender.close();

  const precision = tp + fp > 0 ? tp / (tp + fp) : null;
  const recall = tp + fn > 0 ? tp / (tp + fn) : null;
  const f1 = precision && recall && (precision + recall) > 0
    ? (2 * precision * recall) / (precision + recall) : null;

  const summary = {
    run_id: runId, n: rows.length, skipped,
    confusion: { tp, fp, fn, tn },
    precision, recall, f1,
  };
  fs.writeFileSync(
    path.join(suitePaths.scoredDir(runId), 'absence_detection_summary.json'),
    JSON.stringify(summary, null, 2), 'utf8'
  );

  console.log(`항목3(FAQ부재판단): P=${precision?.toFixed(3)} R=${recall?.toFixed(3)} F1=${f1?.toFixed(3)} (skipped=${skipped}) -> ${outPath}`);
}

main();
