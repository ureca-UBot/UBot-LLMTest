'use strict';
// 1단계: 후보 모델 호출 -> raw/<run_id>/generation.jsonl (케이스마다 즉시 append)
//
// 재개 가능: 이미 기록된 케이스 ID는 건너뛴다. 같은 run_id로 다른 설정(모델·조건·
// 프롬프트·데이터셋)을 이어 쓰려 하면 run_info.json과 비교해 멈춘다 — 서로 다른
// 조건의 답변이 한 파일에 섞이는 것을 막는다.
//
// Usage:
//   node scripts/run/run_generation.js <run_id> <model_tag> [--condition t0_nothink]
//     [--size 50|100|150|200] [--items SF,CE] [--difficulty Easy] [--limit N] [--test v4] [--try try1]

const fs = require('fs');
const crypto = require('crypto');
const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { buildMessages, systemPromptFor } = require('../lib/prompts');
const { checkFormatSuccess } = require('../lib/metrics');
const ollama = require('../lib/ollama');
const { readExistingIds, makeAppender } = require('../lib/jsonl');
const { envTag } = require('../lib/platform');
const { sampleVramMiB } = require('../lib/vram');
const { loadCases, selectCases } = require('../lib/dataset');
const { parseRunArgs } = require('../lib/args');

const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');

async function main() {
  const { positional, opts } = parseRunArgs(argv);
  const [runId, modelTag] = positional;
  if (!runId || !modelTag) {
    console.error('usage: node scripts/run/run_generation.js <run_id> <model_tag> [--condition C] [--size N] [--items A,B] [--difficulty D] [--limit N]');
    process.exit(1);
  }
  const { config, paths, repoRel, label } = profile.load();
  profile.assertSafe('run_id', runId);
  const cond = profile.condition(opts.condition);
  const genParams = profile.generationParams(modelTag, cond.name);
  const variant = config.prompt.variant;
  const size = opts.size || config.dataset.defaultSize;
  const cases = selectCases({ size, items: opts.items, difficulty: opts.difficulty, limit: opts.limit });
  const { sha256: casesSha } = loadCases();

  // 이 run의 정체 — 재개 시 같은 설정인지 대조한다.
  const runInfo = {
    run_id: runId,
    test: profile.load().versionDirName,
    try: profile.load().tryTag,
    model_tag: modelTag,
    env: envTag(),
    condition: cond.name,
    gen_params: genParams,
    context_mode: config.contextMode,
    prompt_variant: variant,
    system_prompt_sha256: sha256(systemPromptFor(variant)),
    dataset: config.dataset.name,
    cases_sha256: casesSha,
    selection: { size, items: opts.items || null, difficulty: opts.difficulty || null, limit: opts.limit || null },
    case_ids: cases.map((c) => c.id),
  };
  const infoPath = paths.runInfoPath(runId);
  if (fs.existsSync(infoPath)) {
    const prev = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
    const keys = ['model_tag', 'condition', 'gen_params', 'context_mode', 'prompt_variant', 'system_prompt_sha256', 'cases_sha256', 'selection'];
    const diff = keys.filter((k) => JSON.stringify(prev[k]) !== JSON.stringify(runInfo[k]));
    if (diff.length) {
      throw new Error(`같은 run_id(${runId})가 다른 설정으로 이미 있습니다: ${diff.join(', ')}\n새 run_id를 쓰거나 기존 폴더를 확인하세요: ${repoRel(paths.rawDir(runId))}`);
    }
  } else {
    fs.mkdirSync(paths.rawDir(runId), { recursive: true });
    fs.writeFileSync(infoPath, JSON.stringify({ ...runInfo, created_at: new Date().toISOString() }, null, 2) + '\n', 'utf8');
  }

  const outPath = paths.generationPath(runId);
  const alreadyDone = readExistingIds(outPath, 'id');
  const todo = cases.filter((c) => !alreadyDone.has(c.id));

  console.log(`[${label}] run_id=${runId} model=${modelTag} env=${envTag()}`);
  const fmtLabel = typeof genParams.format === 'object' ? `schema(${Object.keys(genParams.format.properties).join('>')})` : genParams.format;
  console.log(`조건 ${cond.name} ${JSON.stringify({ ...genParams, format: fmtLabel })} · 프롬프트 ${variant} · n${size}`);
  console.log(`총 ${cases.length}건, 이미 완료 ${alreadyDone.size}건, 이번에 처리 ${todo.length}건 -> ${repoRel(outPath)}`);

  const options = {};
  if (genParams.temperature !== null) options.temperature = genParams.temperature;
  if (genParams.seed !== null) options.seed = genParams.seed;

  // 워밍업: 모델 적재 시간이 첫 케이스 지연에 섞이지 않도록 기록하지 않는 호출을 한 번 한다.
  // 적재는 응답 시간 상한과 무관하므로 넉넉한 제한(5분)을 따로 준다.
  if (todo.length) {
    try {
      await ollama.chat(modelTag, [{ role: 'user', content: '{"ping":true}' }], {
        format: genParams.format, options: { ...options, num_predict: 1 }, think: genParams.think, timeoutMs: 300000,
      });
    } catch (e) {
      console.warn(`  [워밍업 실패 — 계속 진행] ${e.message}`);
    }
  }

  const appender = makeAppender(outPath);
  let ok = 0, fail = 0;
  const startedAt = Date.now();
  for (const [i, c] of todo.entries()) {
    const base = {
      id: c.id, run_id: runId, model_tag: modelTag, env: envTag(),
      item: c.item, difficulty: c.difficulty, original_id: c.originalId, round: c.round,
      condition: cond.name, prompt_variant: variant, gen_params: genParams,
    };
    let record;
    const caseStarted = Date.now();
    try {
      const messages = buildMessages(c, variant);
      const res = await ollama.withRetry(
        () => ollama.chat(modelTag, messages, {
          format: genParams.format, options, think: genParams.think, timeoutMs: config.generation.timeoutMs,
        }),
        { retries: config.generation.retries, label: `generate ${c.id}`, shouldRetry: (e) => !ollama.isTimeout(e) }
      );
      const fmt = checkFormatSuccess(res.content);
      record = {
        ...base,
        raw_content: res.content,
        parsed: fmt.parsed,
        format_pass: fmt.pass,
        format_fail_reason: fmt.reason,
        timing: {
          wall_ms: res.wallMs,
          total_duration_ns: res.totalDurationNs,
          load_duration_ns: res.loadDurationNs,
          prompt_eval_count: res.promptEvalCount,
          prompt_eval_duration_ns: res.promptEvalDurationNs,
          eval_count: res.evalCount,
          eval_duration_ns: res.evalDurationNs,
        },
        vram_used_mib: sampleVramMiB(),
        error: null,
        error_type: null,
        generated_at: new Date().toISOString(),
      };
      ok++;
    } catch (e) {
      // 타임아웃은 응답 시간 상한 초과로 인한 실패다. 재시도하지 않고 그대로 오류로 남긴다
      // (재실행해도 이미 기록된 케이스라 건너뛴다).
      const timedOut = ollama.isTimeout(e);
      record = {
        ...base, raw_content: null, parsed: null, format_pass: false, format_fail_reason: null,
        timing: null, vram_used_mib: null,
        error: timedOut ? `TIMEOUT: ${config.generation.timeoutMs}ms 초과` : String(e.message || e),
        error_type: timedOut ? 'TIMEOUT' : 'ERROR',
        elapsed_ms: Date.now() - caseStarted,
        generated_at: new Date().toISOString(),
      };
      fail++;
      if (timedOut) console.warn(`  [TIMEOUT] ${c.id} — ${config.generation.timeoutMs / 1000}s 초과, 오류로 기록`);
    }
    appender.append(record);
    if ((i + 1) % 25 === 0 || i === todo.length - 1) {
      const sec = ((Date.now() - startedAt) / 1000).toFixed(0);
      console.log(`  ${i + 1}/${todo.length} (성공 ${ok}, 실패 ${fail}, 경과 ${sec}s)`);
    }
  }
  appender.close();
  console.log(`완료. 성공 ${ok}, 실패 ${fail}`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
