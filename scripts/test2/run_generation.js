'use strict';
// Stage 1 (공통, local/EC2 동일): calls the candidate model over the 1000
// cases and writes raw output incrementally to
//   results/raw/test2/<run_id>/generation.jsonl
// Resumable: already-completed case IDs are skipped on re-run, so a crash
// or timeout partway through a 1000-case sweep doesn't lose progress.
//
// Usage:
//   node scripts/run_generation.js <run_id> <model_tag> [--limit N]
//     [--type "단일 FAQ 답변"] [--difficulty Easy]
//
// run_id convention: <env>_<model>_<date>, e.g. local-win_gemma3-4b_20260916
// (scripts/lib/platform.js#envTag supplies <env>; pass --run-id explicitly
// to override).

const fs = require('fs');
const path = require('path');
const { parseCsvObjects } = require('./lib/csv');
const { buildMessages } = require('./lib/prompts');
const { checkFormatSuccess } = require('./lib/metrics');
const ollama = require('./lib/ollama');
const { readExistingIds, makeAppender } = require('./lib/jsonl');
const { envTag } = require('./lib/platform');

const ROOT = path.join(__dirname, '..', '..');
const CASES_PATH = path.join(ROOT, 'data', 'eval_sets', 'test_set2', 'cases.csv');

function parseArgs(argv) {
  const positional = [];
  const opts = { limit: null, type: null, difficulty: null, runId: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--limit') opts.limit = parseInt(argv[++i], 10);
    else if (a === '--type') opts.type = argv[++i];
    else if (a === '--difficulty') opts.difficulty = argv[++i];
    else if (a === '--run-id') opts.runId = argv[++i];
    else positional.push(a);
  }
  return { positional, opts };
}

async function main() {
  const { positional, opts } = parseArgs(process.argv.slice(2));
  const [runIdArg, modelTag] = positional;
  if (!modelTag) {
    console.error('usage: node scripts/run_generation.js <run_id> <model_tag> [--limit N] [--type T] [--difficulty D]');
    process.exit(1);
  }
  const runId = opts.runId || runIdArg;

  let cases = parseCsvObjects(fs.readFileSync(CASES_PATH, 'utf8'));
  if (opts.type) cases = cases.filter((c) => c['유형'] === opts.type);
  if (opts.difficulty) cases = cases.filter((c) => c['난이도'] === opts.difficulty);
  if (opts.limit) cases = cases.slice(0, opts.limit);

  const outPath = path.join(ROOT, 'results', 'raw', 'test2', runId, 'generation.jsonl');
  const alreadyDone = readExistingIds(outPath, 'id');
  const todo = cases.filter((c) => !alreadyDone.has(c['ID']));

  console.log(`run_id=${runId} model=${modelTag} env=${envTag()}`);
  console.log(`총 ${cases.length}건, 이미 완료 ${alreadyDone.size}건, 이번에 처리할 건수 ${todo.length}건`);
  console.log(`출력: ${outPath}`);

  const appender = makeAppender(outPath);
  let ok = 0, fail = 0;
  const startedAt = Date.now();

  for (const [i, row] of todo.entries()) {
    const messages = buildMessages(row);
    let record;
    try {
      // 일시적 오류(타임아웃 등)는 최대 2회 재시도 후에도 안 되면 그 케이스만
      // error로 기록하고 다음 케이스로 넘어감 (전체 run은 안 죽음).
      const res = await ollama.withRetry(
        () => ollama.chat(modelTag, messages, { format: 'json' }),
        { retries: 2, label: `generate ${row['ID']}` }
      );
      const fmt = checkFormatSuccess(res.content);
      record = {
        id: row['ID'],
        run_id: runId,
        model_tag: modelTag,
        env: envTag(),
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
        error: null,
        generated_at: new Date().toISOString(),
      };
      ok++;
    } catch (e) {
      record = {
        id: row['ID'], run_id: runId, model_tag: modelTag, env: envTag(),
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
