'use strict';
// 프롬프트 비교 원커맨드 실행 (test3 라운드).
//
// 모델 하나를 고정하고 lib/prompts.js에 등록된 프롬프트 안만 바꿔가며 같은
// 문항으로 돌린 뒤, 비교 문서 1개를 만든다. 생성·채점은 test3 러너(lib/runner.js)와
// test2 파이프라인을 그대로 쓴다 — 채점 로직을 복제하지 않는다.
//
// 실행 조건은 test3 추론 off 라운드(t0_nothink)와 같다:
//   temperature 0 · think false · seed 미고정 · 고유 300문항(--primary-only)
// 이렇게 두면 v0_baseline을 새로 돌리지 않고 기존 t0_nothink run을 대조군으로
// 쓸 수 있다. 근거: results/test3/think_ablation_results.md — qwen3:14b는 추론을
// 켜면 P95 28.49초로 실시간 상담에 못 쓰고, 끄면 8.11초다.
//
// Usage:
//   node scripts/test3/run_prompt_test.js qwen3:14b
//   node scripts/test3/run_prompt_test.js qwen3:14b --variants v1_status_rules
//   node scripts/test3/run_prompt_test.js qwen3:14b --limit 5 --dry-run
//
// 옵션:
//   --variants a,b   실행할 안 (기본: v0 외 전부). v0_baseline은 기본적으로
//                    생성하지 않는다 — 기존 t0_nothink run을 대조군으로 쓴다.
//   --with-baseline  v0_baseline도 새로 생성한다(기존 run과 조건이 다를 때만).
//   --limit N        앞에서부터 N문항만 (파이프라인 점검용)
//   --date / --dry-run / --skip-model-check   lib/runner.js와 동일

const path = require('path');
const { spawnSync } = require('child_process');
const models = require('./config/models');
const { ROOT, SUITE, runRound, parseCommonArgs, sanitizeTag, envTag, makeRunId } = require('./lib/runner');
const { SYSTEM_PROMPTS } = require('../test2/lib/prompts');

// 프롬프트 비교는 추론 off·온도 0 조건에서 한다. run_id의 조건 부분은
// <안>_<이 접미사>가 되므로, 기존 t0_nothink run과 디렉터리가 겹치지 않는다.
const CONDITION_SUFFIX = 't0_nothink';
const BASELINE = 'v0_baseline';

function parseArgs(argv) {
  const common = parseCommonArgs(argv);
  const opts = { ...common, variants: null, withBaseline: false, model: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--variants') opts.variants = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--with-baseline') opts.withBaseline = true;
    else if (a === '--date' || a === '--limit') i++; // parseCommonArgs가 이미 읽음
    else if (!a.startsWith('--') && !opts.model) opts.model = a;
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.model) {
    console.error('usage: node scripts/test3/run_prompt_test.js <model_tag> [--variants a,b] [--with-baseline]'
      + '\n  [--limit N] [--date YYYYMMDD] [--dry-run] [--skip-model-check]');
    process.exit(1);
  }

  const known = Object.keys(SYSTEM_PROMPTS);
  let variants = opts.variants || known.filter((v) => v !== BASELINE);
  const unknown = variants.filter((v) => !SYSTEM_PROMPTS[v]);
  if (unknown.length) {
    console.error(`[중단] 알 수 없는 프롬프트 안: ${unknown.join(', ')}`);
    console.error(`       가능한 값: ${known.join(', ')}`);
    process.exit(1);
  }
  if (opts.withBaseline && !variants.includes(BASELINE)) variants = [BASELINE, ...variants];

  const model = { tag: opts.model, thinkCapable: opts.model.startsWith('qwen3') };
  const configured = models.all.find((m) => m.tag === opts.model);
  if (configured) model.thinkCapable = configured.thinkCapable;

  console.log(`\n프롬프트 비교 — model=${opts.model} suite=${SUITE} env=${envTag()} date=${opts.date}`);
  console.log(`대상 안 ${variants.length}개: ${variants.join(', ')}`);
  if (!variants.includes(BASELINE)) {
    console.log(`대조군(${BASELINE})은 새로 생성하지 않고 기존 ${CONDITION_SUFFIX} run을 쓴다.`);
  }
  if (!model.thinkCapable) {
    console.log('이 모델은 추론 모드가 없어 think 값을 보내지 않는다(조건 이름은 그대로 유지).');
  }

  const results = [];
  for (const variant of variants) {
    const condition = `${variant}_${CONDITION_SUFFIX}`;
    const r = runRound({
      label: `프롬프트 ${variant} (${opts.model}, temp=0, think off)`,
      models: [model],
      condition,
      params: {
        temperature: models.operatingTemperature, // 0
        think: false,
        seed: null,                // test3 방침: 온도 0은 greedy라 고정하지 않는다
        primaryOnly: true,         // 고유 300문항만 — 반복 회차는 프롬프트 비교에 불필요
        skipRepeat: true,          // 반복 일관성 채점 건너뜀(생성 자체를 안 하므로)
        prompt: variant,
        limit: opts.limit,
      },
      date: opts.date,
      dryRun: opts.dryRun,
      skipModelCheck: opts.skipModelCheck,
    });
    results.push({ variant, runId: makeRunId(opts.model, condition, opts.date), ...(r[0] || { ok: opts.dryRun }) });
  }

  if (opts.dryRun) {
    console.log('\n[--dry-run] 비교 문서는 만들지 않았습니다.');
    return;
  }

  // 비교 문서 생성 — 실패한 안이 있어도 성공한 것들로 만든다.
  const args = [path.join(__dirname, 'compare_prompts.js'), '--model', opts.model, '--date', opts.date];
  if (opts.limit) args.push('--limit-tag', String(opts.limit));
  const failed = results.filter((r) => !r.ok);
  if (failed.length) args.push('--failed', failed.map((r) => `${r.variant}:exit ${r.status}`).join(';'));
  console.log('\n=== 비교 문서 생성 ===');
  const cmp = spawnSync(process.execPath, args, { stdio: 'inherit', env: { ...process.env, LLM_TEST_SUITE: SUITE } });

  console.log('\n========== 프롬프트 비교 요약 ==========');
  for (const r of results) console.log(`  ${r.ok ? 'OK  ' : 'FAIL'} ${r.variant} (run_id=${r.runId})`);
  if (failed.length) {
    console.error(`\n${failed.length}개 안 실패. 같은 명령을 다시 실행하면 끝난 문항은 건너뛰고 이어서 진행합니다.`);
    process.exit(1);
  }
  if (cmp.status !== 0) process.exit(cmp.status || 1);
  console.log(`\n결과 문서는 results/${SUITE}/ 아래에 있습니다. ROOT=${path.relative(process.cwd(), ROOT) || '.'}`);
}

main();
