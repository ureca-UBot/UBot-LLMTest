'use strict';
// Stage 2e (에스컬레이션 판정): joins the other scored files by case id and
// applies the rule-based "LLM 재판단 필요 여부" logic (scripts/lib/escalation.js)
// — no model call here, purely combining already-computed signals.
//
//   results/scored/test2/<run_id>/escalation.jsonl
//
// The (small, hopefully) subset flagged needs_review=true here is what
// should actually go to an LLM Judge pass, instead of running Judge over
// all 1000 cases.
//
// Usage: node scripts/score_escalation.js <run_id>

const fs = require('fs');
const path = require('path');
const { parseCsvObjects } = require('./lib/csv');
const { readAll, makeAppender } = require('./lib/jsonl');
const { expectedStatusEnum } = require('./lib/status_map');
const { extractNumbers } = require('./lib/regex_checks');
const { evaluateEscalation } = require('./lib/escalation');
const { splitContextBlocks, findBlocksByIds } = require('./lib/context_blocks');

const ROOT = path.join(__dirname, '..', '..');
const CASES_PATH = path.join(ROOT, 'data', 'eval_sets', 'test_set2', 'cases.csv');

function byId(rows) { return Object.fromEntries(rows.map((r) => [r.id, r])); }

// For a CF-type case: numbers that appear in exactly one of the two
// *actually conflicting* context blocks (i.e. the real point of
// disagreement) — used to detect whether the model's answer silently
// committed to one side. 버그 수정(2026-09-16 리뷰): 예전엔 컨텍스트를 직접
// split(/\n\s*\n+/)로 재구현하면서 blocks[0]/[1]이 충돌 쌍이라고 가정했음
// (context_blocks.js와 로직이 분리돼 있었고, Medium/Hard처럼 무관 FAQ가
// 섞이면 틀린 블록을 비교하게 됨). 이제 splitContextBlocks를 재사용하고,
// `정답/관련 FAQ` 컬럼의 ID로 정확한 두 블록만 골라서 비교함.
function conflictingNumbers(contextText, expectedIds) {
  const blocks = findBlocksByIds(splitContextBlocks(contextText), expectedIds);
  if (blocks.length < 2) return [];
  const numsA = new Set(extractNumbers(blocks[0].raw));
  const numsB = new Set(extractNumbers(blocks[1].raw));
  const onlyInOne = [...numsA].filter((n) => !numsB.has(n))
    .concat([...numsB].filter((n) => !numsA.has(n)));
  return [...new Set(onlyInOne)];
}

function main() {
  const runId = process.argv[2];
  if (!runId) {
    console.error('usage: node scripts/score_escalation.js <run_id>');
    process.exit(1);
  }
  const scoredDir = path.join(ROOT, 'results', 'scored', 'test2', runId);
  const cases = parseCsvObjects(fs.readFileSync(CASES_PATH, 'utf8'));
  const casesById = Object.fromEntries(cases.map((c) => [c['ID'], c]));

  const generation = byId(readAll(path.join(ROOT, 'results', 'raw', 'test2', runId, 'generation.jsonl')));
  const answerAcc = byId(readAll(path.join(scoredDir, 'answer_accuracy.jsonl')));
  const faithfulness = byId(readAll(path.join(scoredDir, 'rag_faithfulness.jsonl')));

  const outPath = path.join(scoredDir, 'escalation.jsonl');
  fs.writeFileSync(outPath, '');
  const appender = makeAppender(outPath);

  let flaggedCount = 0, total = 0;
  for (const id of Object.keys(generation)) {
    const g = generation[id];
    const c = casesById[id];
    if (!c || !g.parsed) continue;
    total++;

    const acc = answerAcc[id];
    const faith = faithfulness[id];

    const expected = expectedStatusEnum(c['기대 응답 상태']);
    const statusMatch = expected ? expected === g.parsed.status : null;

    // representative NLI signal = the fact unit with the weakest support
    // (lowest max-entailment across candidate blocks) — the "weakest link".
    let nliLabel = null, nliProbs = null;
    if (faith && Array.isArray(faith.fact_units) && faith.fact_units.length > 0) {
      const weakest = faith.fact_units.reduce((a, b) => {
        const pa = a && a.probs ? a.probs.ENTAILMENT : 2; // missing -> treat as strongest so it's not picked
        const pb = b && b.probs ? b.probs.ENTAILMENT : 2;
        return pb < pa ? b : a;
      }, faith.fact_units[0]);
      nliLabel = weakest.predicted;
      nliProbs = weakest.probs;
    }

    let evidenceIdsMatchExpected = null;
    let answerMentionsExactlyOneConflictingNumber = null;
    if (c['유형'] === 'FAQ 충돌·시행일') {
      const expectedIds = (c['정답/관련 FAQ'] || '').split(',').map((s) => s.trim()).filter(Boolean);
      const gotIds = Array.isArray(g.parsed.evidence_ids) ? g.parsed.evidence_ids : [];
      evidenceIdsMatchExpected = expectedIds.length > 0
        && expectedIds.every((e) => gotIds.includes(e));

      const candidates = conflictingNumbers(c['제공 Context'], expectedIds);
      if (candidates.length > 0) {
        const mentioned = candidates.filter((n) => (g.parsed.answer || '').includes(n));
        answerMentionsExactlyOneConflictingNumber = mentioned.length === 1;
      }
    }

    const signals = {
      statusMatch,
      keywordCoverage: acc ? acc.keyword_coverage : null,
      numericCheckPass: faith ? faith.regex_pass : null,
      nliLabel,
      nliProbs,
      bgeM3Similarity: acc ? acc.bge_m3_similarity : null,
      caseType: c['유형'],
      evidenceIdsMatchExpected,
      answerMentionsExactlyOneConflictingNumber,
      hasWrongSourceNumber: faith && Array.isArray(faith.numbers_from_wrong_source)
        ? faith.numbers_from_wrong_source.length > 0 : null,
    };

    const { needsReview, reasons } = evaluateEscalation(signals);
    if (needsReview) flaggedCount++;

    appender.append({
      id, run_id: runId, model_tag: g.model_tag, env: g.env,
      needs_review: needsReview, reasons, signals,
    });
  }
  appender.close();

  console.log(`에스컬레이션: ${total}건 중 ${flaggedCount}건 재판단 필요로 플래그 (${((flaggedCount / (total || 1)) * 100).toFixed(1)}%) -> ${outPath}`);
}

main();
