'use strict';

// Reads results/raw/rag_stability_<tier>.jsonl and computes the one deterministic
// auxiliary metric that applies here: number/proper-noun verification against the
// provided context (README 10-1절). Keyword coverage / ROUGE-L don't apply — there's
// no single gold answer text to compare against, only expected behavior/failure conditions.
//
// Usage: node scripts/score_rag_stability.js small

const fs = require('fs');
const path = require('path');
const { numberVerification } = require('./lib/metrics');

const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'results', 'raw');

function scoreTier(tier) {
  const inPath = path.join(RAW_DIR, `rag_stability_${tier}.jsonl`);
  const outPath = path.join(RAW_DIR, `rag_stability_${tier}.scored.jsonl`);
  const lines = fs.readFileSync(inPath, 'utf8').split('\n').filter(Boolean);

  const outStream = fs.createWriteStream(outPath, { flags: 'w' });
  let scored = 0;

  for (const line of lines) {
    const rec = JSON.parse(line);
    if (!rec.ok || !rec.formatValid || !rec.parsed || typeof rec.parsed.answer !== 'string') {
      outStream.write(JSON.stringify({ ...rec, det: null }) + '\n');
      continue;
    }
    const det = { numberVerification: numberVerification(rec.contextBlock, rec.parsed.answer) };
    outStream.write(JSON.stringify({ ...rec, det }) + '\n');
    scored += 1;
  }
  outStream.end();
  console.log(`[rag_stability_${tier}] scored ${scored}/${lines.length} records -> ${outPath}`);
}

const tier = process.argv[2];
if (!tier) {
  console.error('Usage: node scripts/score_rag_stability.js <small|medium|large>');
  process.exit(1);
}
scoreTier(tier);
