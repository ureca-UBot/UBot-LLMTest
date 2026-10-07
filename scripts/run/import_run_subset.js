'use strict';
// 다른 테스트(예: v4)에서 이미 생성한 run을 현재 테스트로 가져온다 — 같은 모델을 다시 생성하지 않고
// 작은 서브셋(예: 항목당 100건)만 골라 이 테스트의 run으로 만든다. 2026-10-07 v5에서 v4 T4의
// qwen3:4b-instruct n200 run을 n100으로 가져오려고 추가했다.
//
// 가져오는 조건(하나라도 다르면 멈춘다): 원본 run이 서브셋 제한 없이 생성됐고(항목·난이도·limit·ids 없음)
// 규모가 목표 이상이며, 모델이 현재 config.models에 있고, 조건·생성 파라미터·컨텍스트 방식·프롬프트 안·
// 시스템 프롬프트 SHA·데이터셋 SHA가 현재 테스트가 같은 모델로 생성했을 값과 같다. 목표 서브셋의 케이스가
// 원본에 하나씩 모두 있어야 한다(오류·타임아웃 행도 그대로 가져온다 — 원본 run의 결과이므로).
//
// 결과: raw/<새 run_id>/generation.jsonl(원본 행에서 run_id만 새 값으로 바꾸고 source_run_id를 붙임)과
// run_info.json(원본 정보 + selection·case_ids를 서브셋으로, imported_from에 원본 경로·SHA-256). 새 run_id는
// 원본의 환경·날짜를 유지한 같은 규칙의 이름이라 이후 채점(run_pipeline.js — 생성은 이미 끝난 케이스라
// 건너뛴다)·Judge 배치(build_batch_manifest --size)·집계가 일반 run과 똑같이 잡는다.
//
// Usage:
//   node scripts/run/import_run_subset.js <원본 run_id> --from-test v4 [--from-try try1] [--size 100] [--test v5] [--try try1] [--dry-run]

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { parseRunArgs } = require('../lib/args');
const { loadCases, selectCases } = require('../lib/dataset');
const { systemPromptFor } = require('../lib/prompts');
const { readAll } = require('../lib/jsonl');

const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function sourceDir(fromTest, fromTry, runId) {
  const name = fs.existsSync(path.join(profile.ROOT, fromTest)) || fromTest.startsWith('model_test_') ? fromTest : `model_test_${fromTest}`;
  profile.assertSafe('--from-test', name);
  profile.assertSafe('--from-try', fromTry);
  return { name, dir: path.join(profile.ROOT, name, fromTry, 'results', 'raw', profile.assertSafe('run_id', runId)) };
}

function main() {
  const { positional, opts } = parseRunArgs(argv);
  const [srcRunId] = positional;
  if (!srcRunId || !opts.fromTest) {
    console.error('usage: node scripts/run/import_run_subset.js <원본 run_id> --from-test v4 [--from-try try1] [--size 100] [--test v5] [--dry-run]');
    process.exit(1);
  }
  const { config, paths, repoRel, label, promptVariant, versionDirName, tryTag } = profile.load();
  const fromTry = opts.fromTry || 'try1';
  const size = opts.size || config.dataset.defaultSize;
  const src = sourceDir(opts.fromTest, fromTry, srcRunId);
  const srcInfoPath = path.join(src.dir, 'run_info.json');
  const srcGenPath = path.join(src.dir, 'generation.jsonl');
  for (const p of [srcInfoPath, srcGenPath]) if (!fs.existsSync(p)) throw new Error(`원본 파일이 없습니다: ${repoRel(p)}`);
  const srcInfoBytes = fs.readFileSync(srcInfoPath);
  const srcGenBytes = fs.readFileSync(srcGenPath);
  const info = JSON.parse(srcInfoBytes.toString('utf8'));

  // 1) 원본이 이 테스트에서 같은 모델로 생성했을 run과 같은 조건인지
  const problems = [];
  const sel = info.selection || {};
  if (sel.items || sel.difficulty || sel.limit || sel.ids_file) problems.push(`원본이 부분 선택 run입니다(selection ${JSON.stringify(sel)})`);
  if (!(sel.size >= size)) problems.push(`원본 규모 ${sel.size} < 목표 ${size}`);
  if (!config.dataset.subset.sizes.includes(size)) problems.push(`지원하지 않는 규모: ${size}`);
  let expectedGen = null;
  try { expectedGen = profile.generationParams(info.model_tag, info.condition); } catch (e) { problems.push(e.message); }
  if (expectedGen && !same(info.gen_params, expectedGen)) problems.push('gen_params가 현재 config로 만든 값과 다릅니다');
  if (info.context_mode !== config.contextMode) problems.push(`context_mode ${info.context_mode} ≠ ${config.contextMode}`);
  if (info.prompt_variant !== promptVariant) problems.push(`prompt_variant ${info.prompt_variant} ≠ ${promptVariant}`);
  if (info.system_prompt_sha256 !== sha256(systemPromptFor(promptVariant))) problems.push('시스템 프롬프트 SHA가 다릅니다(프롬프트 파일이 바뀜)');
  if (info.dataset !== config.dataset.name) problems.push(`dataset ${info.dataset} ≠ ${config.dataset.name}`);
  if (info.cases_sha256 !== loadCases().sha256) problems.push('cases CSV SHA가 다릅니다(데이터셋이 바뀜)');

  // 2) 목표 서브셋 케이스가 원본에 하나씩 모두 있는지
  const cases = selectCases({ size });
  const byId = new Map();
  const dup = new Set();
  for (const g of readAll(srcGenPath)) { if (byId.has(g.id)) dup.add(g.id); byId.set(g.id, g); }
  const missing = cases.filter((c) => !byId.has(c.id)).map((c) => c.id);
  if (dup.size) problems.push(`원본에 중복 케이스: ${[...dup].slice(0, 5).join(', ')}`);
  if (missing.length) problems.push(`원본에 없는 케이스 ${missing.length}건: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ' …' : ''}`);
  if (problems.length) {
    console.error(`[import] 가져올 수 없습니다 — ${repoRel(src.dir)}`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  const date = (srcRunId.match(/_n\d+_(\d{8})/) || [])[1];
  if (!date) throw new Error(`원본 run_id에서 날짜를 찾지 못했습니다: ${srcRunId}`);
  const runId = profile.makeRunId({ model: info.model_tag, conditionName: info.condition, size, date, env: info.env });
  const rows = cases.map((c) => ({ ...byId.get(c.id), run_id: runId, source_run_id: srcRunId }));
  const errors = rows.filter((r) => r.error_type);

  console.log(`[import ${label}] ${src.name}/${fromTry}/${srcRunId}`);
  console.log(`  -> ${runId} (항목당 ${size}건, ${rows.length}/${byId.size}행${errors.length ? `, 오류 행 ${errors.length}건 포함` : ''})`);
  if (opts.dryRun) { console.log('[--dry-run] 파일을 쓰지 않고 종료합니다.'); return; }
  if (fs.existsSync(paths.rawDir(runId))) throw new Error(`이미 있습니다: ${repoRel(paths.rawDir(runId))} — 지우고 다시 하거나 그대로 쓰세요.`);

  // run_generation.js가 재개 때 대조하는 키(selection 등)는 같은 순서·모양으로 써야 생성 단계가 "모두 완료"로 통과한다.
  const runInfo = {
    ...info,
    run_id: runId,
    test: versionDirName,
    try: tryTag,
    selection: { size, items: null, difficulty: null, limit: null },
    case_ids: cases.map((c) => c.id),
    imported_from: {
      test: src.name,
      try: fromTry,
      run_id: srcRunId,
      size: sel.size,
      rows_total: byId.size,
      rows_imported: rows.length,
      run_info_sha256: sha256(srcInfoBytes),
      generation_sha256: sha256(srcGenBytes),
      note: '원본 행에서 run_id만 새 값으로 바꾸고 source_run_id를 붙였다. 나머지 필드는 원본 그대로.',
      imported_at: new Date().toISOString(),
    },
  };
  fs.mkdirSync(paths.rawDir(runId), { recursive: true });
  fs.writeFileSync(paths.runInfoPath(runId), JSON.stringify(runInfo, null, 2) + '\n', 'utf8');
  fs.writeFileSync(paths.generationPath(runId), rows.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');
  console.log(`완료. 다음 — 결정론 채점·보고서(생성 단계는 끝난 케이스라 건너뜀, 모델이 Ollama에 없어도 됨):`);
  console.log(`  node scripts/run/run_pipeline.js ${runId} ${info.model_tag} --test ${versionDirName} --try ${tryTag} --size ${size}`);
}

try { main(); } catch (e) { console.error(e.message || e); process.exit(1); }
