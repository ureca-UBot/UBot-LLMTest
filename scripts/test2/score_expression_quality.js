'use strict';
// Stage 2f (항목5 표현품질): 완전 규칙 기반(실격 3종 + 감점 5종) — LLM/Judge
// 불필요. 기준은 scripts/lib/expression_quality.js 참고.
//
//   results/scored/test2/<run_id>/expression_quality.jsonl
//
// Usage: node scripts/score_expression_quality.js <run_id>

const fs = require('fs');
const path = require('path');
const { parseCsvObjects } = require('./lib/csv');
const { readAll, makeAppender } = require('./lib/jsonl');
const { scoreExpressionQuality } = require('./lib/expression_quality');
const { isPrimaryRound } = require('./lib/rounds');
const suitePaths = require('./lib/suite');

const ROOT = path.join(__dirname, '..', '..');
const CASES_PATH = path.join(ROOT, 'data', 'eval_sets', 'test_set2', 'cases.csv');

function main() {
  const runId = process.argv[2];
  if (!runId) {
    console.error('usage: node scripts/score_expression_quality.js <run_id>');
    process.exit(1);
  }
  const cases = parseCsvObjects(fs.readFileSync(CASES_PATH, 'utf8'));
  const casesById = Object.fromEntries(cases.map((c) => [c['ID'], c]));

  const genPath = suitePaths.generationPath(runId);
  const rows = readAll(genPath).filter((r) => r.parsed && typeof r.parsed.answer === 'string' && r.parsed.answer.length > 0);

  const outPath = path.join(suitePaths.scoredDir(runId), 'expression_quality.jsonl');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, '');
  const appender = makeAppender(outPath);

  let sum = 0, disqualifiedCount = 0, primaryCount = 0;
  for (const r of rows) {
    const c = casesById[r.id];
    if (!c) continue;
    const result = scoreExpressionQuality(r.parsed.answer, {
      question: c['User Question'],
      referenceText: c['정답 예시'],
    });
    // 집계는 고유 문항(실행 회차=1)만 — 반복 대상 40문항 편향 방지.
    if (isPrimaryRound(c)) {
      primaryCount++;
      sum += result.score;
      if (result.disqualified) disqualifiedCount++;
    }
    appender.append({ id: r.id, run_id: runId, model_tag: r.model_tag, env: r.env, ...result });
  }
  appender.close();

  const avg = primaryCount ? sum / primaryCount : null;
  console.log(`항목5(표현품질): 고유문항(회차1) 기준 ${primaryCount}건, 평균 ${avg?.toFixed(1)}점, 실격 ${disqualifiedCount}건 (${((disqualifiedCount / (primaryCount || 1)) * 100).toFixed(1)}%) -> ${outPath}`);
}

main();
