'use strict';
// 전체 모델 일괄 실행 (체크리스트 5번). config/models.js에 정의된 모델
// 목록을 순서대로 돌며 run_pipeline.js(항목 전체 원커맨드 실행)를 호출함.
// 모델 하나만 따로 돌리고 싶으면 run_pipeline.js를 직접 쓰면 됨(개별
// 실행 스크립트는 그대로 존재).
//
// Usage:
//   node scripts/run_all_models.js [local|ec2|all] [--limit N] [--type T]
//     [--difficulty D] [--skip-repeat] [--date YYYYMMDD] [--prompt V]
//     [--temperature T] [--think true|false] [--primary-only]
//
// 기본값: tier 생략 시 현재 OS로 자동 판단(Windows->local, Linux->ec2).
// run_id는 <env>_<model-tag>_<date> 컨벤션으로 자동 생성. --prompt가
// v0_baseline이 아니면 끝에 _<variant>를 붙여 기본 프롬프트 결과와 섞이지 않게 함.

const path = require('path');
const { spawnSync } = require('child_process');
const models = require('./config/models');
const { envTag, IS_WINDOWS } = require('./lib/platform');

function todayStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function sanitizeTag(tag) {
  return tag.replace(/[:.]/g, '-');
}

function parseArgs(argv) {
  let tier = IS_WINDOWS ? 'local' : 'ec2';
  const passthrough = [];
  let date = todayStamp();
  const positional = [];
  let prompt = 'v0_baseline';
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (['local', 'ec2', 'all'].includes(a)) { tier = a; continue; }
    if (a === '--date') { date = argv[++i]; continue; }
    if (a === '--prompt') { prompt = argv[++i]; passthrough.push(a, prompt); continue; }
    if (['--limit', '--type', '--difficulty', '--temperature', '--think'].includes(a)) { passthrough.push(a, argv[++i]); continue; }
    if (a === '--skip-repeat' || a === '--primary-only') { passthrough.push(a); continue; }
    positional.push(a);
  }
  return { tier, passthrough, date, prompt };
}

function main() {
  const { tier, passthrough, date, prompt } = parseArgs(process.argv.slice(2));
  const modelList = tier === 'all' ? [...models.local, ...models.ec2] : models[tier];
  if (!modelList || modelList.length === 0) {
    console.error(`config/models.js에 "${tier}" 목록이 비어있습니다.`);
    process.exit(1);
  }

  console.log(`일괄 실행: tier=${tier}, 모델 ${modelList.length}개, env=${envTag()}`);
  console.log(modelList.map((m) => `  - ${m.tag}`).join('\n'));

  const results = [];
  for (const [idx, m] of modelList.entries()) {
    const suffix = prompt === 'v0_baseline' ? '' : `_${prompt}`;
    const runId = `${envTag()}_${sanitizeTag(m.tag)}_${date}${suffix}`;
    console.log(`\n\n########## [${idx + 1}/${modelList.length}] ${m.tag} (run_id=${runId}) ##########`);
    const result = spawnSync(process.execPath, [path.join(__dirname, 'run_pipeline.js'), runId, m.tag, ...passthrough], {
      stdio: 'inherit',
    });
    results.push({ tag: m.tag, runId, ok: result.status === 0, status: result.status });
    if (result.status !== 0) {
      console.error(`\n[run_all_models] ${m.tag} 실패(exit ${result.status}) — 다음 모델로 계속 진행합니다.`);
    }
  }

  console.log('\n\n========== 일괄 실행 요약 ==========');
  for (const r of results) {
    console.log(`  ${r.ok ? '✅' : '❌'} ${r.tag} (run_id=${r.runId})`);
  }
  const failedN = results.filter((r) => !r.ok).length;
  if (failedN > 0) {
    console.error(`\n${failedN}개 모델 실패. 위 run_id로 run_pipeline.js를 다시 실행하면 (재개 가능한 단계는) 이어서 진행됩니다.`);
    process.exit(1);
  }
}

main();
