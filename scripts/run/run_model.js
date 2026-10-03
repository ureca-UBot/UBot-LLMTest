'use strict';
// 모델 하나 × 전체 항목.
//
// Usage:
//   node scripts/run/run_model.js <model_tag> [--condition C] [--size 50|100|150|200]
//     [--date YYYYMMDD] [--dry-run] [--skip-model-check] [--test v4] [--try try1]
// 예) node scripts/run/run_model.js qwen3:4b --size 50

const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { parseRunArgs } = require('../lib/args');
const { runRound } = require('../lib/round');

try {
  const { positional, opts } = parseRunArgs(argv);
  const [model] = positional;
  if (!model) {
    console.error('usage: node scripts/run/run_model.js <model_tag> [--condition C] [--size N] [--dry-run]');
    console.error(`모델: ${profile.load().config.models.map((m) => m.tag).join(', ')}`);
    process.exit(1);
  }
  runRound({ label: `모델 라운드 (${model} × 모든 항목)`, models: [model], opts });
} catch (e) { console.error(e.message); process.exit(1); }
