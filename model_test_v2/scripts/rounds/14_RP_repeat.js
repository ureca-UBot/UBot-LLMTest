'use strict';
// 반복 라운드 — 반복 평가 대상 40문항 × 3회차(120행). 반복 일관성 채점까지 돈다.
//   node model_test_v2/scripts/rounds/14_RP_repeat.js <run_id> <model_tag> [--dry-run]
require('./_run_item').runItem({ code: 'RP', label: '반복 일관성', repeatOnly: true, cases: '40문항×3회차 120행' });
