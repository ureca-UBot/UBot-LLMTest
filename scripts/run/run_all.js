'use strict';
// 전체 라운드: test.config.js의 모델(runByDefault=true) × 전체 항목.
//
// Usage:
//   node scripts/run/run_all.js [--models qwen3:4b,gemma3:4b] [--condition C] [--size 50|100|150|200]
//     [--date YYYYMMDD] [--dry-run] [--skip-model-check] [--test v4] [--try try1]

const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { parseRunArgs } = require('../lib/args');
const { runRound } = require('../lib/round');

try {
  const { opts } = parseRunArgs(argv);
  const models = opts.models || profile.load().config.models.filter((m) => m.runByDefault).map((m) => m.tag);
  runRound({ label: '전체 라운드 (모든 모델 × 모든 항목)', models, opts });
} catch (e) { console.error(e.message); process.exit(1); }
