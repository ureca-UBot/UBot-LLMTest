'use strict';
// LLM Judge 1단계: 채점할 run들을 고정하는 배치 매니페스트 -> report/<batch>.json
// 생성이 끝난 run만 넣는다(선택된 케이스가 전부 generation.jsonl에 있어야 함). 원본 응답
// 파일의 sha256을 기록해 이후 단계가 "같은 답변"을 채점하는지 검증한다.
//
// Usage:
//   node scripts/judge/build_batch_manifest.js --batch <id> [--condition C] [--size N] [--runs id1,id2]
//     [--dry-run] [--test v4] [--try try1]
//   --runs를 안 주면 이 try에서 조건·규모가 맞고 항목 제한이 없는 run을 전부 넣는다.

const fs = require('fs');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { parseRunArgs } = require('../lib/args');
const { readAll } = require('../lib/jsonl');
const { listRuns } = require('../lib/run_summary');
const { loadCases } = require('../lib/dataset');

const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');

function main() {
  const { opts } = parseRunArgs(argv);
  if (!opts.batch) throw new Error('--batch <id>가 필요합니다. 예) --batch v4-try1-n200');
  profile.assertSafe('batch', opts.batch);
  const { config, paths, repoRel, label } = profile.load();
  const cond = profile.condition(opts.condition);
  const size = opts.size || config.dataset.defaultSize;

  const candidates = opts.runs || listRuns().filter((runId) => {
    const info = JSON.parse(fs.readFileSync(paths.runInfoPath(runId), 'utf8'));
    return info.condition === cond.name && info.selection.size === size && !info.selection.items
      && !info.selection.difficulty && !info.selection.limit && info.context_mode === config.contextMode;
  });
  if (!candidates.length) throw new Error(`조건(${cond.name}, n${size})에 맞는 run이 없습니다.`);

  const { sha256: casesSha } = loadCases();
  const runs = candidates.map((runId) => {
    const info = JSON.parse(fs.readFileSync(paths.runInfoPath(runId), 'utf8'));
    const genPath = paths.generationPath(runId);
    const bytes = fs.readFileSync(genPath);
    const rows = readAll(genPath);
    const got = new Set(rows.map((r) => r.id));
    const missing = info.case_ids.filter((id) => !got.has(id));
    if (info.cases_sha256 !== casesSha) throw new Error(`${runId}: 생성 당시와 데이터셋이 다릅니다.`);
    return {
      run_id: runId,
      model: info.model_tag,
      condition: info.condition,
      gen_params: info.gen_params,
      prompt_variant: info.prompt_variant,
      selection: info.selection,
      status: missing.length ? 'incomplete' : 'completed',
      missing_cases: missing.length,
      generation_errors: rows.filter((r) => r.error).length,
      source_path: repoRel(genPath),
      source_sha256: sha256(bytes),
    };
  });

  const commit = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: paths.root, encoding: 'utf8' });
  const manifest = {
    batch_id: opts.batch,
    test: profile.load().versionDirName,
    try: profile.load().tryTag,
    status: runs.every((r) => r.status === 'completed') ? 'completed' : 'incomplete',
    condition: cond.name,
    size,
    context_mode: config.contextMode,
    dataset: config.dataset.name,
    cases_sha256: casesSha,
    source_commit: commit.status === 0 ? commit.stdout.trim() : null,
    created_at: new Date().toISOString(),
    runs,
  };

  console.log(`[${label}] 배치 ${opts.batch}: ${runs.length}개 run`);
  for (const r of runs) console.log(`  ${r.status === 'completed' ? 'OK  ' : 'MISS'} ${r.model} ${r.run_id}${r.missing_cases ? ` (누락 ${r.missing_cases})` : ''}${r.generation_errors ? ` (생성 오류 ${r.generation_errors})` : ''}`);
  if (opts.dryRun) { console.log('[--dry-run] 파일을 쓰지 않았습니다.'); return; }
  if (manifest.status !== 'completed') throw new Error('완료되지 않은 run이 있습니다. 생성을 마친 뒤 다시 만드세요.');

  const outPath = paths.batchManifestPath(opts.batch);
  if (fs.existsSync(outPath)) throw new Error(`이미 있는 배치입니다: ${repoRel(outPath)} — 새 배치 ID를 쓰세요.`);
  fs.mkdirSync(paths.reportDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx', encoding: 'utf8' });
  console.log(`매니페스트 -> ${repoRel(outPath)}`);
  console.log(`다음: node scripts/judge/judge_prepare.js --batch ${opts.batch}`);
}

try { main(); } catch (e) { console.error(e.message); process.exit(1); }
