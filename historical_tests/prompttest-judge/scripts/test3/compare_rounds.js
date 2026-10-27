'use strict';
// test2(temp 0.8, local-win) <-> test3(temp 0, ec2-linux) 비교 집계.
//
// 비교 대상은 선별 5개뿐이다. gemma3:12b / qwen3:14b는 로컬에서 돌린 적이
// 없어 test2 쪽 값이 없으므로 test3 단독 값만 싣는다.
//
// 속도(지연/TPS)는 비교하지 않는다 — 하드웨어가 같이 바뀌어 교란된다.
// temperature 효과만 깨끗하게 보려면 같은 EC2 위의 대조군(t08_think)과
// 비교해야 하고, 그 비교도 여기서 같이 만든다.
//
// Usage: node scripts/test3/compare_rounds.js

const fs = require('fs');
const path = require('path');
const models = require('./config/models');
const { ROOT } = require('./lib/runner');
const { collectRun, loadPrimaryCases, findRunId, findTest2RunId } = require('./lib/collect');

const OUT_PATH = path.join(ROOT, 'results', 'scored', models.suite, 'round_comparison.json');

function main() {
  const primary = loadPrimaryCases();
  const missing = [];

  const rows = models.all.map((m) => {
    const t3Id = findRunId(models.suite, m.tag, 't0_think');
    const t3NoThinkId = m.thinkCapable ? findRunId(models.suite, m.tag, 't0_nothink') : null;
    const t3CtrlId = findRunId(models.suite, m.tag, 't08_think');
    const t2Id = m.tier === 'selected' ? findTest2RunId(m.tag) : null;

    if (!t3Id) missing.push(`${m.tag}: test3 본 라운드(t0_think)`);
    if (m.thinkCapable && !t3NoThinkId) missing.push(`${m.tag}: 추론 off 라운드(t0_nothink)`);
    if (!t3CtrlId) missing.push(`${m.tag}: temperature 대조군(t08_think)`);

    return {
      model_tag: m.tag,
      tier: m.tier,
      think_capable: m.thinkCapable,
      test2: t2Id ? collectRun('test2', t2Id, primary) : null,
      test3_think: t3Id ? collectRun(models.suite, t3Id, primary) : null,
      test3_nothink: t3NoThinkId ? collectRun(models.suite, t3NoThinkId, primary) : null,
      test3_temp_control: t3CtrlId ? collectRun(models.suite, t3CtrlId, primary) : null,
    };
  });

  const out = {
    suite: models.suite,
    generated_at: new Date().toISOString(),
    comparison_notes: [
      'test2는 local-win(RTX 4070 Ti, temperature 0.8 = Ollama 기본값), test3은 ec2-linux(temperature 0)이다.',
      '하드웨어가 함께 바뀌었으므로 두 라운드 간 속도(지연/TPS) 비교는 하지 않는다.',
      'temperature 효과만 보려면 같은 EC2 위의 대조군(t08_think, 반복 40문항)과 비교한다.',
      'gemma3:12b / qwen3:14b는 test2에 데이터가 없어 test3 단독 값만 싣는다.',
      'temp=0에서 반복 일관성이 100%에 가까운 것은 개선이 아니라 샘플링을 끈 결과다.',
    ],
    missing_rounds: missing,
    models: rows,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + '\n', 'utf8');

  // 콘솔 요약
  const pct = (v) => v === null || v === undefined ? '-' : (v * 100).toFixed(1) + '%';
  console.log('\n===== 반복 일관성: test2(temp 0.8) vs test3(temp 0) =====');
  console.log(`${'모델'.padEnd(18)}${'test2'.padStart(9)}${'test3'.padStart(9)}${'EC2 대조군'.padStart(12)}`);
  for (const r of rows) {
    console.log(r.model_tag.padEnd(18)
      + pct(r.test2 && r.test2.repeat && r.test2.repeat.overall).padStart(9)
      + pct(r.test3_think && r.test3_think.repeat && r.test3_think.repeat.overall).padStart(9)
      + pct(r.test3_temp_control && r.test3_temp_control.repeat && r.test3_temp_control.repeat.overall).padStart(12));
  }
  console.log('\n===== 추론 on/off (Qwen3 계열) =====');
  console.log(`${'모델'.padEnd(18)}${'on 토큰'.padStart(10)}${'off 토큰'.padStart(10)}${'on 지연'.padStart(10)}${'off 지연'.padStart(10)}`);
  for (const r of rows.filter((x) => x.think_capable)) {
    const on = r.test3_think, off = r.test3_nothink;
    const n = (v, u) => v === null || v === undefined ? '-' : Math.round(v) + u;
    console.log(r.model_tag.padEnd(18)
      + n(on && on.avg_eval_count, '').padStart(10)
      + n(off && off.avg_eval_count, '').padStart(10)
      + n(on && on.latency_avg_ms, 'ms').padStart(10)
      + n(off && off.latency_avg_ms, 'ms').padStart(10));
  }
  if (missing.length) {
    console.log(`\n[아직 안 돌린 라운드 ${missing.length}건]`);
    for (const m of missing) console.log('  - ' + m);
  }
  console.log(`\n-> ${path.relative(ROOT, OUT_PATH)}`);
}

main();
