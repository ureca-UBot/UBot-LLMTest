'use strict';
// test3 추론 모드 비교 — Qwen3 계열만 think=false로 재실행.
//
// 왜 필요한가: qwen3:4b는 test2에서 평균 1,171토큰 / 9.52초, P95 21.67초였다
// (gemma3:4b는 77토큰 / 1.84초). 실시간 채팅에 쓰기 어려운 수치인데, test1과
// test2 모두 추론을 켠 채로만 돌려서 끈 조건은 한 번도 측정된 적이 없다.
// 그냥 끄면 되는 문제가 아니다 — qwen3:4b가 내용 정확도 1위(72.0%)인 것이
// 추론 덕분일 수 있어서, 확인 없이 끄면 모델 선정 근거가 무너진다.
// 그래서 on/off를 둘 다 재고 정확도-지연 트레이드오프를 표로 만든다.
//
// gemma3·exaone3.5는 추론 모드 자체가 없으므로 대상에서 제외된다.
//
// Usage:
//   node scripts/test3/run_think_ablation.js [--dry-run] [--date YYYYMMDD] [--limit N]

const models = require('./config/models');
const { runRound, parseCommonArgs } = require('./lib/runner');

const opts = parseCommonArgs(process.argv.slice(2));
const targets = models.thinkCapable;

console.log('추론 모드 비교 대상 (Qwen3 계열만):', targets.map((m) => m.tag).join(', '));
const excluded = models.all.filter((m) => !m.thinkCapable).map((m) => m.tag);
console.log('제외 (추론 모드 없음):', excluded.join(', '));

runRound({
  label: 'test3 추론 off 라운드 (temp=0, think off, Qwen3 계열)',
  models: targets,
  condition: 't0_nothink',
  params: {
    temperature: models.operatingTemperature, // 0 — 본 라운드와 동일하게 두어 추론 변수만 남긴다
    think: false,
    seed: null,
    limit: opts.limit,
  },
  date: opts.date,
  dryRun: opts.dryRun,
  skipModelCheck: opts.skipModelCheck,
});
