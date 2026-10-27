'use strict';

// Preserve failed/invalid source records that a batch Judge cannot evaluate.
const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, '..', 'results', 'raw');
for (const prefix of ['faq_medium', 'faq_hard', 'rag_stability_small', 'rag_stability_medium', 'rag_stability_large']) {
  const read = (suffix) => fs.readFileSync(path.join(RAW_DIR, `${prefix}.${suffix}.jsonl`), 'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
  const source = read('scored');
  const judged = read('judged');
  const byKey = new Map(judged.map((r) => [`${r.id}|${r.model}`, r]));
  const merged = source.map((r) => byKey.get(`${r.id}|${r.model}`) || { ...r, judge: null });
  fs.writeFileSync(path.join(RAW_DIR, `${prefix}.judged.jsonl`), merged.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');
  console.log(`${prefix}: ${merged.length} records preserved`);
}
