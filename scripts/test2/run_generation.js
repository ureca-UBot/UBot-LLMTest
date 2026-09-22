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
//     [--primary-only]
//
// --prompt: lib/prompts.js의 SYSTEM_PROMPTS 키 (기본 v0_baseline = 현행 프롬프트).
//   프롬프트 비교 테스트(scripts/test3/run_prompt_test.js)가 쓴다. 레코드에
//   prompt_variant로 남으므로 결과 파일만 보고 어떤 안인지 알 수 있다.
// --primary-only: 고유 문항(실행 회차 1, 300행)만 생성 — --repeat-only의 반대쪽.
//   프롬프트 비교는 반복 회차가 필요 없으므로 이걸 쓴다.
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
const { isPrimaryRound } = require('./lib/rounds');
const { envTag } = require('./lib/platform');
const { sampleVramMiB } = require('./lib/vram');
const suitePaths = require('./lib/suite');

const ROOT = path.join(__dirname, '..', '..');
const CASES_PATH = path.join(ROOT, 'data', 'eval_sets', 'test_set2', 'cases.csv');

// --repeat-only: 반복 평가 대상(40문항 x 3회차 = 120행)만 남긴다. test3의
// temperature 대조군 라운드가 반복 일관성만 재기 위해 쓴다.
function parseArgs(argv) {
  const positional = [];
  const opts = {
    limit: null, type: null, difficulty: null, runId: null,
    temperature: null, seed: null, think: undefined, repeatOnly: false,
    primaryOnly: false, prompt: 'v0_baseline',
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--limit') opts.limit = parseInt(argv[++i], 10);
    else if (a === '--type') opts.type = argv[++i];
    else if (a === '--difficulty') opts.difficulty = argv[++i];
    else if (a === '--run-id') opts.runId = argv[++i];
    else if (a === '--temperature') opts.temperature = Number(argv[++i]);
    else if (a === '--seed') opts.seed = parseInt(argv[++i], 10);
    else if (a === '--think') opts.think = parseThink(argv[++i]);
    else if (a === '--repeat-only') opts.repeatOnly = true;
    else if (a === '--primary-only') opts.primaryOnly = true;
    else if (a === '--prompt') opts.prompt = argv[++i];
    else positional.push(a);
  }
  if (opts.temperature !== null && !Number.isFinite(opts.temperature)) {
    throw new Error('--temperature 값이 숫자가 아닙니다.');
  }
  if (opts.seed !== null && !Number.isInteger(opts.seed)) {
    throw new Error('--seed 값이 정수가 아닙니다.');
  }
  if (opts.repeatOnly && opts.primaryOnly) {
    throw new Error('--repeat-only와 --primary-only는 함께 쓸 수 없습니다.');
  }
  if (!SYSTEM_PROMPTS[opts.prompt]) {
    throw new Error('알 수 없는 --prompt ' + JSON.stringify(opts.prompt)
      + ' (가능: ' + Object.keys(SYSTEM_PROMPTS).join(', ') + ')');
  }
  return { positional, opts };
}

function parseThink(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`--think 값은 true 또는 false여야 합니다 (받은 값: ${JSON.stringify(value)})`);
}

async function main() {
  const { positional, opts } = parseArgs(process.argv.slice(2));
  const [runIdArg, modelTag] = positional;
  if (!modelTag) {
    console.error('usage: node scripts/run_generation.js <run_id> <model_tag> [--limit N] [--type T]\n  [--difficulty D] [--repeat-only] [--primary-only] [--prompt V] [--temperature N] [--seed N] [--think true|false]');
    process.exit(1);
  }
  const runId = opts.runId || runIdArg;

  let cases = parseCsvObjects(fs.readFileSync(CASES_PATH, 'utf8'));
  if (opts.repeatOnly) cases = cases.filter((c) => c['반복 평가 대상'] === 'Y');
  if (opts.primaryOnly) cases = cases.filter(isPrimaryRound);
  if (opts.type) cases = cases.filter((c) => c['유형'] === opts.type);
  if (opts.difficulty) cases = cases.filter((c) => c['난이도'] === opts.difficulty);
  if (opts.limit) cases = cases.slice(0, opts.limit);

  // Ollama에 넘길 생성 파라미터. 아무것도 지정 안 하면 options={} + think 미전달
  // 이라 test2와 완전히 같은 동작(= Ollama 기본값)이다.
  const genOptions = {};
  if (opts.temperature !== null) genOptions.temperature = opts.temperature;
  if (opts.seed !== null) genOptions.seed = opts.seed;
  // 어떤 조건으로 돌린 결과인지 레코드마다 남긴다. test2 레코드에는 이 필드가
  // 없으므로 파일만 보고 라운드를 구분할 수 있다.
  const genParams = {
    temperature: opts.temperature,
    seed: opts.seed,
    think: opts.think === undefined ? null : opts.think,
    format: 'json',
  };
  console.log(`생성 파라미터: ${JSON.stringify(genParams)} prompt=${opts.prompt}`);

  const outPath = suitePaths.generationPath(runId);
  const alreadyDone = readExistingIds(outPath, 'id');

  // 설정 충돌 가드 — 한 run_id 안에 다른 프롬프트/파라미터의 결과가 섞이면
  // 비교가 성립하지 않는다. 같은 설정으로 이어서 돌리는 경우는 그대로 통과한다.
  const conflict = readAll(outPath).find((r) => (r.prompt_variant || 'v0_baseline') !== opts.prompt
    || (r.gen_params && JSON.stringify(r.gen_params) !== JSON.stringify(genParams)));
  if (conflict) {
    console.error(`[중단] run_id "${runId}"에 이미 다른 설정으로 만든 결과가 있습니다.`);
    console.error(`       기존: prompt=${conflict.prompt_variant || 'v0_baseline(미기록)'} gen_params=${JSON.stringify(conflict.gen_params || null)}`);
    console.error(`       요청: prompt=${opts.prompt} gen_params=${JSON.stringify(genParams)}`);
    console.error('       run_id를 다르게 지정하세요(예: --date를 바꿔서).');
    process.exit(1);
  }

  const todo = cases.filter((c) => !alreadyDone.has(c['ID']));

  console.log(`run_id=${runId} model=${modelTag} env=${envTag()}`);
  console.log(`총 ${cases.length}건, 이미 완료 ${alreadyDone.size}건, 이번에 처리할 건수 ${todo.length}건`);
  console.log(`출력: ${outPath}`);

  const appender = makeAppender(outPath);
  let ok = 0, fail = 0;
  const startedAt = Date.now();

  for (const [i, row] of todo.entries()) {
    const messages = buildMessages(row, opts.prompt);
    let record;
    try {
      // 일시적 오류(타임아웃 등)는 최대 2회 재시도 후에도 안 되면 그 케이스만
      // error로 기록하고 다음 케이스로 넘어감 (전체 run은 안 죽음).
      const res = await ollama.withRetry(
        () => ollama.chat(modelTag, messages, { format: 'json', options: genOptions, think: opts.think }),
        { retries: 2, label: `generate ${row['ID']}` }
      );
      const fmt = checkFormatSuccess(res.content);
      // 항목8(실측 리소스) 보조: 응답을 받은 직후(모델이 실제로 활성화된
      // 시점) VRAM을 샘플링. GPU/드라이버가 없으면 null — 그래도 이 케이스
      // 자체는 정상 처리됨(항목8은 항상 항목1~7과 독립적으로 채점 가능해야 함).
      const vramUsedMib = sampleVramMiB();
      record = {
        id: row['ID'],
        run_id: runId,
        model_tag: modelTag,
        env: envTag(),
        prompt_variant: opts.prompt,
        유형: row['유형'],
        난이도: row['난이도'],
        raw_content: res.content,
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
        vram_used_mib: vramUsedMib,
        gen_params: genParams,
        error: null,
        generated_at: new Date().toISOString(),
      };
      ok++;
    } catch (e) {
      record = {
        id: row['ID'], run_id: runId, model_tag: modelTag, env: envTag(),
        prompt_variant: opts.prompt,
        유형: row['유형'], 난이도: row['난이도'],
        raw_content: null, parsed: null, format_pass: false, format_fail_reason: null,
        timing: null, vram_used_mib: null, gen_params: genParams,
        error: String(e.message || e), generated_at: new Date().toISOString(),
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
