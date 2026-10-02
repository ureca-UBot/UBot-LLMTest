'use strict';
// 모델 하나 × 항목 하나(쉼표로 여러 개 가능). 결과는 전체 라운드와 섞이지 않도록
// run_id 끝에 항목 코드가 붙는다(예: ..._n50_20261001_CE).
//
// Usage:
//   node scripts/run/run_item.js <model_tag> <item_code[,item_code]> [--condition C] [--size N]
//     [--difficulty D] [--limit N] [--date YYYYMMDD] [--dry-run] [--test v4] [--try try1]
// 예) node scripts/run/run_item.js gemma3:4b CE --size 50

const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { parseRunArgs } = require('../lib/args');
const { runRound } = require('../lib/round');

try {
  const { positional, opts } = parseRunArgs(argv);
  const [model, itemArg] = positional;
  if (!model || !itemArg) {
    const { config } = profile.load();
    console.error('usage: node scripts/run/run_item.js <model_tag> <item_code[,item_code]> [--size N] [--dry-run]');
    console.error(`모델: ${config.models.map((m) => m.tag).join(', ')}`);
    console.error(`항목: ${config.items.map((i) => `${i.code}(${i.name})`).join(' ')}`);
    process.exit(1);
  }
  const items = itemArg.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
  runRound({ label: `항목 라운드 (${model} × ${items.join(',')})`, models: [model], items, opts });
} catch (e) { console.error(e.message); process.exit(1); }
