'use strict';
// test3 본 라운드 — 7개 모델 x temperature=0 x 추론(think) 켬.
//
// test2의 run_all_models.js는 tier가 local(9개)/ec2(2개)/all(11개) 세 조합으로
// 고정돼 있어 "선별 5개 + EC2 전용 2개 = 7개"를 돌릴 수 없다. 그래서 test3
// 전용 러너를 따로 둔다. 채점 파이프라인 자체는 test2 것을 그대로 쓴다.
//
// 추론은 test1·test2와 동일하게 켠 상태로 먼저 측정한다(비교 가능성 유지).
// 끈 조건은 run_think_ablation.js가 이어서 잰다.
//
// Usage:
//   node scripts/test3/run_round.js [--dry-run] [--date YYYYMMDD] [--limit N]
//                                   [--skip-model-check]

const models = require('./config/models');
const { runRound, parseCommonArgs } = require('./lib/runner');

const opts = parseCommonArgs(process.argv.slice(2));

runRound({
  label: 'test3 본 라운드 (temp=0, think on, 7개 모델)',
  models: models.all,
  condition: 't0_think',
  params: {
    temperature: models.operatingTemperature, // 0
    think: true,
    // seed는 고정하지 않는다(사용자 결정). temperature=0은 greedy decoding이라
    // seed를 쓰지 않으므로 본 측정에는 영향이 없다.
    seed: null,
    limit: opts.limit,
  },
  date: opts.date,
  dryRun: opts.dryRun,
  skipModelCheck: opts.skipModelCheck,
});
