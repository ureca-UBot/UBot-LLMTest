'use strict';
// 배치 매니페스트 생성 — LLM Judge 연결의 첫 단계.
//
// prepare_llm_judge_inputs.js는 매니페스트를 **입력으로 받는다**(만들지 않는다).
// test2가 쓴 results/reports/test2/rerun-20260918-1328.json은 어떤 스크립트도
// 생성하지 않은 수작업 파일이었고, 그래서 test3에서는 넘길 파일 자체가 없었다.
// 이 스크립트가 그 빈자리를 메운다.
//
// 완료된 run_id들을 스캔해 prepare_llm_judge_inputs.js:88-120이 요구하는 필드를
// 채운다: batch_id / status / runs[{run_id, model, status}] / source_commit.
//
// run_round.js가 끝날 때 자동 호출하지 않는다 — 라운드가 중간에 실패하면
// 불완전한 매니페스트가 만들어지고, 그걸로 채점을 돌리면 일부 모델만 평가된
// 결과가 "완료"로 남는다. 완료를 확인한 뒤 사람이 실행한다.
//
// Usage:
//   node scripts/test3/build_batch_manifest.js [--condition t0_think]
//                                              [--batch <id>] [--dry-run]

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const models = require('./config/models');
const { ROOT, sanitizeTag } = require('./lib/runner');

const SUITE = models.suite;
const RAW_DIR = path.join(ROOT, 'results', 'raw', SUITE);
const SCORED_DIR = path.join(ROOT, 'results', 'scored', SUITE);
const REPORTS_DIR = path.join(ROOT, 'results', 'reports', SUITE);
const CASES_PATH = path.join(ROOT, 'data', 'eval_sets', 'test_set2', 'cases.csv');
// prepare_llm_judge_inputs.js와 동일한 제약 — 경로 조작 방지.
const SAFE_ID = /^[A-Za-z0-9_-]+$/;

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

function parseArgs(argv) {
  const opts = { condition: 't0_think', batch: null, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--condition') opts.condition = argv[++i];
    else if (argv[i] === '--batch') opts.batch = argv[++i];
    else if (argv[i] === '--dry-run') opts.dryRun = true;
  }
  return opts;
}

function gitCommit() {
  const r = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

// generation.jsonl을 읽어 모델 태그와 건수를 확인한다. 레코드마다 run_id/
// model_tag가 박혀 있으므로 디렉터리 이름을 믿지 않고 내용으로 검증한다.
function inspectRun(runId) {
  const genPath = path.join(RAW_DIR, runId, 'generation.jsonl');
  if (!fs.existsSync(genPath)) return { ok: false, reason: 'generation.jsonl 없음' };
  const rows = fs.readFileSync(genPath, 'utf8').split(/\r?\n/).filter((l) => l.trim()).map((l, i) => {
    try { return JSON.parse(l); } catch { throw new Error(`${runId}: ${i + 1}번째 줄 JSON 파싱 실패`); }
  });
  if (!rows.length) return { ok: false, reason: '레코드 0건' };

  const tags = new Set(rows.map((r) => r.model_tag));
  if (tags.size !== 1) return { ok: false, reason: `model_tag가 섞여 있음 (${[...tags].join(', ')})` };
  const runIds = new Set(rows.map((r) => r.run_id));
  if (runIds.size !== 1 || !runIds.has(runId)) {
    return { ok: false, reason: `레코드의 run_id가 디렉터리와 다름 (${[...runIds].join(', ')})` };
  }
  const ids = new Set(rows.map((r) => r.id));
  if (ids.size !== rows.length) return { ok: false, reason: 'ID 중복' };

  // 채점까지 끝났는지 — 채점 산출물이 없으면 라운드가 안 끝난 것이다.
  const perfSummary = path.join(SCORED_DIR, runId, 'performance_summary.json');
  if (!fs.existsSync(perfSummary)) return { ok: false, reason: '채점 미완료 (performance_summary.json 없음)' };

  const genParams = (rows.find((r) => r.gen_params) || {}).gen_params || null;
  const errors = rows.filter((r) => r.error).length;
  return {
    ok: true,
    model: [...tags][0],
    records: rows.length,
    error_records: errors,
    gen_params: genParams,
    source_path: path.relative(ROOT, genPath).split(path.sep).join('/'),
    source_sha256: sha256(fs.readFileSync(genPath)),
  };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const batchId = opts.batch || `${SUITE}-${opts.condition}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  if (!SAFE_ID.test(batchId)) {
    console.error(`배치 ID에 쓸 수 없는 문자가 있습니다: ${batchId} (영문/숫자/-/_ 만 허용)`);
    process.exit(1);
  }
  if (!fs.existsSync(RAW_DIR)) {
    console.error(`${path.relative(ROOT, RAW_DIR)} 가 없습니다. 먼저 라운드를 실행하세요.`);
    process.exit(1);
  }

  console.log(`배치 매니페스트 생성 — suite=${SUITE} condition=${opts.condition} batch_id=${batchId}`);

  const runs = [];
  const skipped = [];
  for (const m of models.all) {
    const slug = sanitizeTag(m.tag);
    const matches = fs.readdirSync(RAW_DIR)
      .filter((d) => d.includes(`_${slug}_${opts.condition}_`))
      .sort();
    if (!matches.length) { skipped.push({ model: m.tag, reason: '해당 조건의 run 없음' }); continue; }
    const runId = matches[matches.length - 1]; // 같은 조건이 여러 날짜면 최신
    const info = inspectRun(runId);
    if (!info.ok) { skipped.push({ model: m.tag, run_id: runId, reason: info.reason }); continue; }
    if (info.model !== m.tag) {
      skipped.push({ model: m.tag, run_id: runId, reason: `레코드의 모델이 다름 (${info.model})` });
      continue;
    }
    runs.push({
      run_id: runId, model: m.tag, status: 'completed', tier: m.tier,
      source_path: info.source_path, source_sha256: info.source_sha256,
      generation_records: info.records, error_records: info.error_records,
      gen_params: info.gen_params,
    });
    console.log(`  OK   ${m.tag.padEnd(16)} ${runId} (${info.records}건, 오류 ${info.error_records}건)`);
  }
  for (const s of skipped) console.log(`  SKIP ${s.model.padEnd(16)} ${s.reason}`);

  if (!runs.length) {
    console.error('\n완료된 run이 하나도 없습니다. 매니페스트를 만들지 않았습니다.');
    process.exit(1);
  }
  if (skipped.length) {
    // 빠진 모델이 있는데도 status를 completed로 쓰면, 일부만 평가된 결과가
    // "전체 완료"로 남는다. 명시적으로 확인하게 한다.
    console.error(`\n[경고] ${skipped.length}개 모델이 빠졌습니다. 의도한 게 맞는지 확인하세요.`);
  }

  const casesBytes = fs.readFileSync(CASES_PATH);
  const manifest = {
    batch_id: batchId,
    status: 'completed',
    suite: SUITE,
    condition: opts.condition,
    created_at: new Date().toISOString(),
    source_commit: gitCommit(),
    repository: 'ureca-UBot/UBot-LLMTest',
    models_expected: models.all.length,
    models_included: runs.length,
    models_skipped: skipped,
    cases_sha256: sha256(casesBytes),
    // CRLF/LF 차이로 해시가 어긋나는 환경(Windows 체크아웃)을 위한 보조 해시.
    // llm_judge_runner.js의 verifyInputs가 둘 중 하나만 맞아도 통과시킨다.
    cases_lf_sha256: sha256(Buffer.from(casesBytes.toString('utf8').replace(/\r\n/g, '\n'), 'utf8')),
    runs,
  };

  const outPath = path.join(REPORTS_DIR, batchId + '.json');
  if (opts.dryRun) {
    console.log(`\n[--dry-run] 아래 내용을 ${path.relative(ROOT, outPath)} 에 쓸 예정입니다.`);
    console.log(JSON.stringify({ ...manifest, runs: runs.map((r) => ({ run_id: r.run_id, model: r.model })) }, null, 2));
    return;
  }
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`\n-> ${path.relative(ROOT, outPath)}`);
  console.log('\n다음 단계:');
  console.log(`  LLM_TEST_SUITE=${SUITE} node scripts/test2/prepare_llm_judge_inputs.js ${path.relative(ROOT, outPath)}`);
  console.log(`  LLM_TEST_SUITE=${SUITE} LLM_JUDGE_BATCH=${batchId} node scripts/test2/run_saved_llm_judge.js --concurrency 8`);
}

main();
