'use strict';
// Stage 1 (공통, local/EC2 동일): calls the candidate model over the 1000
// cases and writes raw output incrementally to
//   results/raw/test2/<run_id>/generation.jsonl
// Resumable: already-completed case IDs are skipped on re-run, so a crash
// or timeout partway through a 1000-case sweep doesn't lose progress.
//
// Usage:
//   node scripts/run_generation.js <run_id> <model_tag> [--limit N]
//     [--type "단일 FAQ 답변"] [--difficulty Easy] [--prompt v0_baseline]
//     [--temperature 0] [--think true|false] [--primary-only]
//
// --prompt: lib/prompts.js의 SYSTEM_PROMPTS 키 (기본 v0_baseline)
// --temperature / --think: 명시적 기본값 0 / false. 아무것도 안 넘기면 Ollama
//   기본값(temperature 0.8, Qwen3 추론 ON)으로 돌아가 결과가 흔들리고 지연
//   시간이 부풀었던 문제를 막기 위함. think는 thinking 지원 모델에만 보냄.
// --primary-only: 실행 회차 1(고유 300문항)만 생성. 반복 회차(R2/R3)를
//   건너뛰므로 반복 일관성 채점은 의미가 없어짐(--skip-repeat과 같이 씀).
//
// 같은 run_id에 이미 다른 prompt/temperature/think 설정의 결과가 있으면
// 섞이지 않도록 중단함.
//
// run_id convention: <env>_<model>_<date>, e.g. local-win_gemma3-4b_20260916
// (scripts/lib/platform.js#envTag supplies <env>; pass --run-id explicitly
// to override).

const fs = require('fs');
const path = require('path');
const { parseCsvObjects } = require('./lib/csv');
const { buildMessages, SYSTEM_PROMPTS } = require('./lib/prompts');
const { checkFormatSuccess } = require('./lib/metrics');
const ollama = require('./lib/ollama');
const { readExistingIds, readAll, makeAppender } = require('./lib/jsonl');
const { envTag } = require('./lib/platform');
const { isPrimaryRound } = require('./lib/rounds');

const SEED = 42;
const USAGE = 'usage: node scripts/run_generation.js <run_id> <model_tag> [--prompt V] [--limit N] [--type T] [--difficulty D] [--temperature T] [--think true|false] [--primary-only]';

const ROOT = path.join(__dirname, '..', '..');
const CASES_PATH = path.join(ROOT, 'data', 'eval_sets', 'test_set2', 'cases.csv');

function parseArgs(argv) {
  const positional = [];
  const opts = {
    limit: null, type: null, difficulty: null, runId: null,
    prompt: 'v0_baseline', temperature: 0, think: false, primaryOnly: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--limit') opts.limit = parseInt(argv[++i], 10);
    else if (a === '--type') opts.type = argv[++i];
    else if (a === '--difficulty') opts.difficulty = argv[++i];
    else if (a === '--run-id') opts.runId = argv[++i];
    else if (a === '--prompt') opts.prompt = argv[++i];
    else if (a === '--temperature') opts.temperature = parseFloat(argv[++i]);
    else if (a === '--think') opts.think = argv[++i] === 'true';
    else if (a === '--primary-only') opts.primaryOnly = true;
    else positional.push(a);
  }
  return { positional, opts };
}

async function main() {
  const { positional, opts } = parseArgs(process.argv.slice(2));
  const [runIdArg, modelTag] = positional;
  if (!modelTag) {
    console.error(USAGE);
    process.exit(1);
  }
  const runId = opts.runId || runIdArg;
  const variant = opts.prompt;
  if (!SYSTEM_PROMPTS[variant]) {
    console.error(`알 수 없는 --prompt "${variant}" (가능: ${Object.keys(SYSTEM_PROMPTS).join(', ')})`);
    process.exit(1);
  }
  if (Number.isNaN(opts.temperature)) {
    console.error('--temperature 값이 숫자가 아닙니다.');
    process.exit(1);
  }

  // think는 thinking을 지원하는 모델에만 보냄. Ollama가 capabilities를 안
  // 알려주는 구버전이면 모델 이름(qwen3)으로 판단.
  let thinkSupported = await ollama.supportsThinking(modelTag);
  if (thinkSupported === null) thinkSupported = modelTag.startsWith('qwen3');
  const inference = {
    temperature: opts.temperature,
    seed: SEED,
    think: thinkSupported ? opts.think : null,
  };

  let cases = parseCsvObjects(fs.readFileSync(CASES_PATH, 'utf8'));
  if (opts.type) cases = cases.filter((c) => c['유형'] === opts.type);
  if (opts.difficulty) cases = cases.filter((c) => c['난이도'] === opts.difficulty);
  if (opts.primaryOnly) cases = cases.filter(isPrimaryRound);
  if (opts.limit) cases = cases.slice(0, opts.limit);

  const outPath = path.join(ROOT, 'results', 'raw', 'test2', runId, 'generation.jsonl');
  const alreadyDone = readExistingIds(outPath, 'id');

  // 설정 충돌 가드: 같은 run_id에 다른 설정의 결과가 섞이면 비교가 무의미해짐.
  const existing = readAll(outPath);
  const sameInference = (a, b) => a && b && a.temperature === b.temperature && a.seed === b.seed && a.think === b.think;
  const conflict = existing.find((r) => (r.prompt_variant || 'v0_baseline') !== variant
    || (r.inference && !sameInference(r.inference, inference)));
  if (conflict) {
    console.error(`[중단] run_id "${runId}"에 이미 다른 설정으로 만든 결과가 있습니다.`);
    console.error(`       기존: prompt=${conflict.prompt_variant || '(미기록)'} inference=${JSON.stringify(conflict.inference || null)}`);
    console.error(`       요청: prompt=${variant} inference=${JSON.stringify(inference)}`);
    console.error('       run_id를 다르게 지정하세요.');
    process.exit(1);
  }
  if (existing.length > 0 && existing.some((r) => !r.inference)) {
    console.warn(`[주의] run_id "${runId}"에 추론 설정이 기록되지 않은 예전 결과가 있습니다. 설정이 같은지 확인할 수 없습니다.`);
  }
  const todo = cases.filter((c) => !alreadyDone.has(c['ID']));

  console.log(`run_id=${runId} model=${modelTag} env=${envTag()} prompt=${variant} inference=${JSON.stringify(inference)}`);
  console.log(`총 ${cases.length}건, 이미 완료 ${alreadyDone.size}건, 이번에 처리할 건수 ${todo.length}건`);
  console.log(`출력: ${outPath}`);

  const appender = makeAppender(outPath);
  let ok = 0, fail = 0;
  const startedAt = Date.now();

  for (const [i, row] of todo.entries()) {
    const messages = buildMessages(row, variant);
    let record;
    try {
      // 일시적 오류(타임아웃 등)는 최대 2회 재시도 후에도 안 되면 그 케이스만
      // error로 기록하고 다음 케이스로 넘어감 (전체 run은 안 죽음).
      const res = await ollama.withRetry(
        () => ollama.chat(modelTag, messages, {
          format: 'json',
          options: { temperature: inference.temperature, seed: inference.seed },
          think: inference.think === null ? undefined : inference.think,
        }),
        { retries: 2, label: `generate ${row['ID']}` }
      );
      const fmt = checkFormatSuccess(res.content);
      record = {
        id: row['ID'],
        run_id: runId,
        model_tag: modelTag,
        env: envTag(),
        prompt_variant: variant,
        inference,
        유형: row['유형'],
        난이도: row['난이도'],
        raw_content: res.content,
        thinking: res.thinking,
        parsed: fmt.parsed,
        format_pass: fmt.pass,
        format_fail_reason: fmt.reason,
        timing: {
          wall_ms: res.wallMs,
          total_duration_ns: res.totalDurationNs,
          load_duration_ns: res.loadDurationNs,
          prompt_eval_count: res.promptEvalCount,
          eval_count: res.evalCount,
          eval_duration_ns: res.evalDurationNs,
        },
        error: null,
        generated_at: new Date().toISOString(),
      };
      ok++;
    } catch (e) {
      record = {
        id: row['ID'], run_id: runId, model_tag: modelTag, env: envTag(),
        prompt_variant: variant, inference,
        유형: row['유형'], 난이도: row['난이도'],
        raw_content: null, parsed: null, format_pass: false, format_fail_reason: null,
        timing: null, error: String(e.message || e), generated_at: new Date().toISOString(),
      };
      fail++;
    }
    appender.append(record);
    if ((i + 1) % 25 === 0 || i === todo.length - 1) {
      const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(0);
      console.log(`  ${i + 1}/${todo.length} (성공 ${ok}, 실패 ${fail}, 경과 ${elapsedSec}s)`);
    }
  }
  appender.close();
  console.log(`완료. 성공 ${ok}, 실패 ${fail}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
