'use strict';
// 사람이 읽는 통합 파일: 케이스 1행에 질문·정답·응답·모든 결과론적 값을 모은다.
//
//   raw/scored/<run_id>/review.csv
//
// Usage: node scripts/docgen/build_review_export.js <run_id> [--test v4] [--try try1]

const fs = require('fs');
const path = require('path');
const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { loadRun, runIdArg } = require('../lib/run_data');
const { readAll } = require('../lib/jsonl');
const { toCsv } = require('../lib/csv');

const HEADER = [
  'id', 'item', 'difficulty', 'round', 'original_id', 'question', 'expected_status', 'predicted_status', 'status_match',
  'answer', 'evidence_ids', 'gold_evidence_ids', 'evidence_category', 'reference_answer', 'required_facts',
  'similarity', 'keyword_coverage', 'nli_support_rate', 'unverified_numbers',
  'expression_score', 'expression_disqualify', 'format_pass', 'format_fail_reason', 'generation_error',
  'latency_ms', 'output_tokens',
];

function indexBy(file) {
  return new Map(readAll(file).map((r) => [r.id, r]));
}

function main() {
  const runId = runIdArg(argv);
  const { rows, scoredDir } = loadRun(runId);
  const f = (name) => indexBy(path.join(scoredDir, name));
  const status = f('status.jsonl');
  const sim = f('answer_similarity.jsonl');
  const rag = f('rag_grounding.jsonl');
  const expr = f('expression_rules.jsonl');
  const perf = f('format_performance.jsonl');
  const evid = f('evidence.jsonl');

  const out = rows.map(({ g, c }) => {
    const s = status.get(g.id), a = sim.get(g.id), r = rag.get(g.id), e = expr.get(g.id), p = perf.get(g.id), v = evid.get(g.id);
    return {
      id: g.id, item: c.item, difficulty: c.difficulty, round: c.round, original_id: c.originalId,
      question: c.question, expected_status: c.expectedStatus,
      predicted_status: s ? s.predicted_status ?? '' : g.parsed?.status ?? '',
      status_match: s ? s.status_match : '',
      answer: g.parsed?.answer ?? g.raw_content ?? '',
      evidence_ids: Array.isArray(g.parsed?.evidence_ids) ? g.parsed.evidence_ids.join(' ') : '',
      gold_evidence_ids: v ? v.gold_ids.join(' ') : '',
      evidence_category: v ? (v.applicable ? v.category : 'N/A') : '',
      reference_answer: c.referenceAnswer, required_facts: c.requiredFacts,
      similarity: a && a.similarity !== null ? a.similarity.toFixed(4) : '',
      keyword_coverage: a && a.keyword_coverage !== null ? a.keyword_coverage.toFixed(3) : '',
      nli_support_rate: r && !r.skipped && r.nli_support_rate !== null ? r.nli_support_rate.toFixed(3) : (r?.skipped || ''),
      unverified_numbers: r && !r.skipped ? r.unverified_numbers.join(' ') : '',
      expression_score: e ? e.score : '', expression_disqualify: e?.disqualifyReason || '',
      format_pass: g.format_pass, format_fail_reason: g.format_fail_reason || '', generation_error: g.error || '',
      latency_ms: p?.latency_ms ?? '', output_tokens: p?.output_tokens ?? '',
    };
  });
  const outPath = path.join(scoredDir, 'review.csv');
  fs.mkdirSync(scoredDir, { recursive: true });
  // Excel에서 한글이 깨지지 않도록 BOM을 붙인다(엔진의 CSV 파서는 BOM을 제거한다).
  fs.writeFileSync(outPath, '﻿' + toCsv(out, HEADER), 'utf8');
  console.log(`review.csv ${out.length}행 -> ${profile.load().repoRel(outPath)}`);
}

try { main(); } catch (e) { console.error(e.message); process.exit(1); }
