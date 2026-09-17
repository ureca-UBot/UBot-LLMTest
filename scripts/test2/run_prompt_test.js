'use strict';
// 프롬프트 비교 원커맨드 실행. 모델 하나를 지정하면 lib/prompts.js에 등록된
// 프롬프트 안 전체를 같은 문항으로 실행·채점하고, 마지막에 비교 문서 1개를
// 만든다. 사용 설명서: scripts/test2/PROMPT_TEST.md
//
// Usage:
//   node scripts/test2/run_prompt_test.js <model_tag> [--variants v0_baseline,v2_decision_tree]
//     [--limit N] [--date YYYYMMDD] [--temperature T] [--think true|false]
//
// 안마다 run_pipeline.js를 --prompt <안> --primary-only --skip-repeat으로 호출함
// (로직 중복 없음). 모델 호출은 안끼리 차례로 실행함 — 로컬 Ollama는 GPU
// 하나에서 요청을 줄 세워 처리하므로 동시에 보내도 빨라지지 않고, 안끼리
// 지연 시간 측정이 서로 섞이기 때문.
//
// run_id: <env>_<model>_<variant>_<date>[_limit<N>]. --limit을 주면 run_id가
// 달라져서 빠른 확인용 결과가 전체 실행 결과와 섞이지 않음.
// 도중에 멈춰도 같은 명령을 다시 실행하면 끝난 문항은 건너뛰고 이어서 함.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { SYSTEM_PROMPTS } = require('./lib/prompts');
const { envTag } = require('./lib/platform');
const ollama = require('./lib/ollama');
const models = require('./config/models');
const { buildMarkdown } = require('./compare_prompts');

const ROOT = path.join(__dirname, '..', '..');
const USAGE = 'usage: node scripts/test2/run_prompt_test.js <model_tag> [--variants a,b,...] [--limit N] [--date YYYYMMDD] [--temperature T] [--think true|false]';

function todayStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function sanitizeTag(tag) {
  return tag.replace(/[:.]/g, '-');
}

function parseArgs(argv) {
  const positional = [];
  const opts = { variants: null, limit: null, date: todayStamp(), temperature: null, think: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--variants') opts.variants = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--limit') opts.limit = argv[++i];
    else if (a === '--date') opts.date = argv[++i];
    else if (a === '--temperature') opts.temperature = argv[++i];
    else if (a === '--think') opts.think = argv[++i];
    else positional.push(a);
  }
  return { positional, opts };
}

async function preflight(modelTag) {
  try {
    const hasModel = await ollama.ensureModelAvailable(modelTag);
    const hasEmbed = await ollama.ensureModelAvailable(models.embeddingModel);
    const missing = [];
    if (!hasModel) missing.push(modelTag);
    if (!hasEmbed) missing.push(models.embeddingModel);
    if (missing.length) {
      console.error(`[중단] Ollama에 모델이 없습니다: ${missing.join(', ')}`);
      console.error(`       설치: ${missing.map((m) => `ollama pull ${m}`).join(' && ')}`);
      process.exit(1);
    }
  } catch (e) {
    console.error(`[중단] Ollama에 연결할 수 없습니다 (${ollama.OLLAMA_HOST}): ${e.message}`);
    console.error('       Ollama를 실행한 뒤 다시 시도하세요.');
    process.exit(1);
  }
}

async function main() {
  const { positional, opts } = parseArgs(process.argv.slice(2));
  const [modelTag] = positional;
  if (!modelTag) {
    console.error(USAGE);
    process.exit(1);
  }

  const allVariants = Object.keys(SYSTEM_PROMPTS);
  let variants = opts.variants || allVariants;
  const unknown = variants.filter((v) => !SYSTEM_PROMPTS[v]);
  if (unknown.length) {
    console.error(`[중단] 알 수 없는 프롬프트 안: ${unknown.join(', ')} (가능: ${allVariants.join(', ')})`);
    process.exit(1);
  }
  // 대조군은 항상 포함, 맨 앞에서 실행.
  variants = ['v0_baseline', ...variants.filter((v) => v !== 'v0_baseline')];

  await preflight(modelTag);

  const suffix = opts.limit ? `_limit${opts.limit}` : '';
  const passthrough = ['--primary-only', '--skip-repeat'];
  if (opts.limit) passthrough.push('--limit', opts.limit);
  if (opts.temperature !== null) passthrough.push('--temperature', opts.temperature);
  if (opts.think !== null) passthrough.push('--think', opts.think);

  const startedAt = Date.now();
  console.log(`프롬프트 비교 시작: model=${modelTag} env=${envTag()} date=${opts.date}`);
  console.log(`대상 안 ${variants.length}개: ${variants.join(', ')}${opts.limit ? ` (문항 ${opts.limit}건만)` : ''}`);

  const results = [];
  for (const [idx, variant] of variants.entries()) {
    const runId = `${envTag()}_${sanitizeTag(modelTag)}_${variant}_${opts.date}${suffix}`;
    console.log(`\n\n########## [${idx + 1}/${variants.length}] ${variant} (run_id=${runId}) ##########`);
    const t0 = Date.now();
    const result = spawnSync(
      process.execPath,
      [path.join(__dirname, 'run_pipeline.js'), runId, modelTag, '--prompt', variant, ...passthrough],
      { stdio: 'inherit' }
    );
    const ok = result.status === 0;
    results.push({ variant, runId, ok, status: result.status, minutes: (Date.now() - t0) / 60000 });
    if (!ok) console.error(`\n[run_prompt_test] ${variant} 실패(exit ${result.status}) — 다음 안으로 계속 진행합니다.`);
  }

  const failed = results.filter((r) => !r.ok);
  const outPath = path.join(ROOT, 'results', 'reports', 'test2', `prompt_test_${sanitizeTag(modelTag)}_${opts.date}${suffix}.md`);
  const md = buildMarkdown(results.map((r) => r.runId), {
    outPath,
    title: `프롬프트 비교 — ${modelTag} (${opts.date}${opts.limit ? `, 문항 ${opts.limit}건` : ''})`,
    failed: failed.map((r) => `${r.variant} (\`${r.runId}\`): 파이프라인 exit ${r.status}. 같은 명령을 다시 실행하면 이어서 진행합니다. 아래 표에 이 안이 있다면 중간 단계까지의 결과입니다.`),
  });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, md, 'utf8');

  const totalMin = ((Date.now() - startedAt) / 60000).toFixed(1);
  console.log('\n\n========== 프롬프트 비교 요약 ==========');
  for (const r of results) console.log(`  ${r.ok ? '✅' : '❌'} ${r.variant} (${r.minutes.toFixed(1)}분, run_id=${r.runId})`);
  console.log(`총 ${totalMin}분`);
  console.log(`비교 문서 -> ${outPath}`);
  if (failed.length) {
    console.error(`\n${failed.length}개 안 실패. 같은 명령을 다시 실행하면 끝난 문항은 건너뛰고 이어서 진행합니다.`);
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
