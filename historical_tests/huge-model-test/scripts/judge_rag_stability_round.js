'use strict';

// Reads results/raw/rag_stability_<tier>.scored.jsonl and calls the headless Claude
// Judge (Pass/Fail rubric per case's 기대 행동/실패 조건) for every valid record,
// writing results/raw/rag_stability_<tier>.judged.jsonl.
//
// Usage: node scripts/judge_rag_stability_round.js small

const fs = require('fs');
const path = require('path');
const { judgeRagStability } = require('./lib/judge');

const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'results', 'raw');

async function main() {
  const tier = process.argv[2];
  if (!tier) {
    console.error('Usage: node scripts/judge_rag_stability_round.js <small|medium|large>');
    process.exit(1);
  }

  const inPath = path.join(RAW_DIR, `rag_stability_${tier}.scored.jsonl`);
  const outPath = path.join(RAW_DIR, `rag_stability_${tier}.judged.jsonl`);
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
    process.stdout.write(`  [${done + 1}/${lines.length}] ${rec.id} x ${rec.model} ... `);
    const judge = await judgeRagStability({
      userQuery: rec.query,
      contextBlock: rec.contextBlock,
      answer: rec.parsed.answer,
      expectedBehavior: rec.expectedBehavior,
      failureCondition: rec.failureCondition,
    });
    outStream.write(JSON.stringify({ ...rec, judge }) + '\n');
    console.log(judge.ok ? `ok (${judge.latencyMs}ms) pass=${judge.scores.pass} expr=${judge.scores.expression_quality}` : `FAILED: ${judge.error}`);
    done += 1;
  }
  outStream.end();
  console.log(`[rag_stability_${tier}] judged ${done} records -> ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
