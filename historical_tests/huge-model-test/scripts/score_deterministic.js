'use strict';

// Reads results/raw/faq_<round>.jsonl, looks up the gold FAQ answer(s) referenced in
// contextBlock, computes deterministic auxiliary metrics (README 8-1), and writes an
// enriched file results/raw/faq_<round>.scored.jsonl (one JSON object per line).
//
// Usage: node scripts/score_deterministic.js easy

const fs = require('fs');
const path = require('path');
const { parseCsvObjects } = require('./lib/csv');
const { keywordCoverage, rougeL, numberVerification } = require('./lib/metrics');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const RAW_DIR = path.join(ROOT, 'results', 'raw');

function loadFaqMap() {
  const text = fs.readFileSync(path.join(DATA_DIR, 'faq.csv'), 'utf8');
  const rows = parseCsvObjects(text);
  const map = new Map();
  for (const r of rows) map.set(r['FAQ ID'], r['FAQ 답변']);
  return map;
}

// contextBlock lines look like "FAQ-028: 카테고리 - Q: ... A: ...". Extract FAQ ID(s)
// referenced and concatenate their gold answers as the reference text for scoring.
function goldAnswerFromContext(contextBlock, faqMap) {
  const ids = Array.from(contextBlock.matchAll(/FAQ-\d+/g)).map((m) => m[0]);
  const unique = Array.from(new Set(ids));
  return unique.map((id) => faqMap.get(id) || '').join(' ');
}

function scoreFile(roundName) {
  const faqMap = loadFaqMap();
  const inPath = path.join(RAW_DIR, `faq_${roundName}.jsonl`);
  const outPath = path.join(RAW_DIR, `faq_${roundName}.scored.jsonl`);
  const lines = fs.readFileSync(inPath, 'utf8').split('\n').filter(Boolean);

  const outStream = fs.createWriteStream(outPath, { flags: 'w' });
  let scored = 0;

  for (const line of lines) {
    const rec = JSON.parse(line);
    if (!rec.ok || !rec.formatValid || !rec.parsed || typeof rec.parsed.answer !== 'string') {
      outStream.write(JSON.stringify({ ...rec, det: null }) + '\n');
      continue;
    }
    const gold = goldAnswerFromContext(rec.contextBlock, faqMap);
    const answer = rec.parsed.answer;

    const det = {
      keywordCoverage: keywordCoverage(gold, answer),
      rougeL: rougeL(gold, answer),
      numberVerification: numberVerification(rec.contextBlock, answer),
    };
    outStream.write(JSON.stringify({ ...rec, det }) + '\n');
    scored += 1;
  }
  outStream.end();
  console.log(`[${roundName}] scored ${scored}/${lines.length} records -> ${outPath}`);
}

const roundName = process.argv[2];
if (!roundName) {
  console.error('Usage: node scripts/score_deterministic.js <easy|medium|hard>');
  process.exit(1);
}
scoreFile(roundName);
