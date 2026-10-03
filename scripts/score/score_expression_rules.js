'use strict';
// 표현 규칙 점수(/100): 실격 3종(내부 용어 누출·질문 echo·비존대) + 감점 5종 규칙.
// 기준은 lib/expression_quality.js. v4는 전수 Judge 표현 점수를 제외하며 이 규칙 점수가 자연스러움 판정을 대체하지는 않는다.
//
//   raw/scored/<run_id>/expression_rules.jsonl
//   raw/scored/<run_id>/expression_rules_summary.json
//
// Usage: node scripts/score/score_expression_rules.js <run_id> [--test v4] [--try try1]

const path = require('path');
const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { loadRun, summarizeScopes, headlineScope, writeJson, writeJsonl, runIdArg } = require('../lib/run_data');
const { scoreExpressionQuality, DEDUCTIONS } = require('../lib/expression_quality');
const { avg, rate, pct, num } = require('../lib/stats');

function main() {
  const runId = runIdArg(argv);
  const { rows, scoredDir } = loadRun(runId);
  const scored = rows
    .filter(({ g }) => g.parsed && typeof g.parsed.answer === 'string' && g.parsed.answer.trim())
    .map(({ g, c }) => ({
      id: g.id, run_id: runId, model_tag: g.model_tag,
      ...scoreExpressionQuality(g.parsed.answer, { question: c.question, referenceText: c.referenceAnswer }),
    }));

  const byId = new Map(rows.map(({ c }) => [c.id, c]));
  const caseOf = (r) => byId.get(r.id);
  const fn = (rs) => ({
    n: rs.length,
    score_avg: avg(rs.map((r) => r.score)),
    disqualified_rate: rate(rs.filter((r) => r.disqualified).length, rs.length),
    deduction_rates: Object.fromEntries(Object.keys(DEDUCTIONS).map((k) => [k,
      rate(rs.filter((r) => r.deductions.some((d) => d.type === k)).length, rs.length)])),
  });
  const summary = { run_id: runId, ...summarizeScopes(scored, caseOf, fn) };
  writeJsonl(path.join(scoredDir, 'expression_rules.jsonl'), scored);
  writeJson(path.join(scoredDir, 'expression_rules_summary.json'), summary);
  const { label, s } = headlineScope(summary);
  console.log(`표현 규칙 점수 평균 ${num(s.score_avg, 1)} · 실격 ${pct(s.disqualified_rate)} (${label} ${s.n}행)`);
}

try { main(); } catch (e) { console.error(e.message); process.exit(1); }
