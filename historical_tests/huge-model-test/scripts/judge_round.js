'use strict';

// Reads results/raw/faq_<round>.scored.jsonl, calls the headless Claude Code Judge
// (claude -p) for every valid record, and writes results/raw/faq_<round>.judged.jsonl.
//
// Usage: node scripts/judge_round.js easy

const fs = require('fs');
const path = require('path');
const { parseCsvObjects } = require('./lib/csv');
const { judgeAnswer } = require('./lib/judge');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const RAW_DIR = path.join(ROOT, 'results', 'raw');

function loadFaqMap() {
  const text = fs.readFileSync(path.join(DATA_DIR, 'faq.csv'), 'utf8');
  const rows = parseCsvObjects(text);
  const map = new Map();
  for (const r of rows) map.set(r['FAQ ID'], { question: r['FAQ 질문'], answer: r['FAQ 답변'] });
  return map;
}

function goldFromContext(contextBlock, faqMap) {
  const ids = Array.from(new Set(Array.from(contextBlock.matchAll(/FAQ-\d+/g)).map((m) => m[0])));
  const qs = [];
  const as = [];
  for (const id of ids) {
    const f = faqMap.get(id);
    if (f) {
      qs.push(f.question);
      as.push(f.answer);
    }
  }
  return { question: qs.join(' / '), answer: as.join(' ') };
}

async function main() {
  const roundName = process.argv[2];
  if (!roundName) {
    console.error('Usage: node scripts/judge_round.js <easy|medium|hard>');
    process.exit(1);
  }

  const faqMap = loadFaqMap();
  const inPath = path.join(RAW_DIR, `faq_${roundName}.scored.jsonl`);
  const outPath = path.join(RAW_DIR, `faq_${roundName}.judged.jsonl`);
  const lines = fs.readFileSync(inPath, 'utf8').split('\n').filter(Boolean);
  const outStream = fs.createWriteStream(outPath, { flags: 'w' });

  let done = 0;
  for (const line of lines) {
    const rec = JSON.parse(line);
    if (!rec.ok || !rec.formatValid || !rec.parsed || typeof rec.parsed.answer !== 'string') {
      outStream.write(JSON.stringify({ ...rec, judge: null }) + '\n');
      done += 1;
      continue;
    }
    const gold = goldFromContext(rec.contextBlock, faqMap);
    process.stdout.write(`  [${done + 1}/${lines.length}] ${rec.id} x ${rec.model} ... `);
    const judge = await judgeAnswer({
      faqQuestion: gold.question,
      faqAnswer: gold.answer,
      userQuery: rec.query,
      answer: rec.parsed.answer,
    });
    outStream.write(JSON.stringify({ ...rec, judge }) + '\n');
    console.log(judge.ok ? `ok (${judge.latencyMs}ms) acc=${judge.scores.answer_accuracy} faithful=${judge.scores.faithful} expr=${judge.scores.expression_quality}` : `FAILED: ${judge.error}`);
    done += 1;
  }
  outStream.end();
  console.log(`[${roundName}] judged ${done} records -> ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
