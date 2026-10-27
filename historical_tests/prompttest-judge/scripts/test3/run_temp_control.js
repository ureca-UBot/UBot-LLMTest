'use strict';
// test3 temperature 대조군 — 반복 40문항만 temperature=0.8로 재실행.
//
// 이 라운드가 없으면 "temperature=0이 반복 일관성을 개선했다"는 주장이 성립하지
// 않는다. test2는 local-win(RTX 4070 Ti), test3는 EC2라 **하드웨어가 같이
// 바뀌었기 때문**에 두 라운드의 차이를 temperature 효과로만 귀속할 수 없다.
// 같은 EC2 위에서 temp 0 vs 0.8을 비교해야 교란 요인이 제거된다.
//
// 그리고 temp=0에서 반복 일관성이 100%에 가깝게 나오는 것 자체는 "개선"이
// 아니라 샘플링을 끈 당연한 결과다. 그 사실을 보이려면 대조군이 있어야 한다.
//
// 반복 평가 대상 40문항 x 3회차 = 120행만 돌리므로 비용이 작다.
//
// Usage:
//   node scripts/test3/run_temp_control.js [--dry-run] [--date YYYYMMDD]

const models = require('./config/models');
const { runRound, parseCommonArgs } = require('./lib/runner');

const opts = parseCommonArgs(process.argv.slice(2));

runRound({
  label: `test3 temperature 대조군 (temp=${models.baselineTemperature}, 반복 40문항)`,
  models: models.all,
  condition: 't08_think',
  params: {
    temperature: models.baselineTemperature, // 0.8 = test2가 돌아간 Ollama 기본값
    think: true,
    seed: null,
    repeatOnly: true, // 반복 평가 대상(Y) 40문항 x 3회차만
    limit: opts.limit,
  },
  date: opts.date,
  dryRun: opts.dryRun,
  skipModelCheck: opts.skipModelCheck,
});
