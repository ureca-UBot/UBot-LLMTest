'use strict';
// 이미 채점한 배치의 판정을 새 배치로 옮긴다 — Judge를 다시 호출하지 않는다(외부 전송 없음).
// import_run_subset.js --keep-records로 가져온 서브셋 run을 원래 run의 판정으로 다시 집계할 때 쓴다
// (2026-10-08 v4 try1 두 모델을 v5와 같은 항목당 100건으로 재집계하려고 추가).
//
// 옮기는 조건(판정 행마다): 새 배치 입력의 작업과 user_text_sha256 · source_record_sha256이 같고,
// 루브릭 SHA·Judge 모델이 새 배치 매니페스트와 같은 성공 판정. 즉 "같은 입력을 같은 루브릭·모델로 채점한 결과"만
// 옮긴다. 원래 배치에서 끝내 채점되지 못한 작업은 옮길 것이 없어 미채점으로 남는다. 판정 행은 run_id·batch_id만
// 새 값으로 바꾸고 reused_from(원래 배치·run)을 붙인다. judge_run.js의 재개 검사도 그대로 통과한다.
//
// Usage:
//   node scripts/judge/reuse_judgments.js --batch <새 배치> --from-batch <원래 배치> [--test v4] [--try try1] [--dry-run]
//   (먼저 build_batch_manifest.js → judge_prepare.js로 새 배치 입력을 만든다)

const fs = require('fs');
const path = require('path');
const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { parseRunArgs } = require('../lib/args');
const { readAll } = require('../lib/jsonl');
const { buildPlan } = require('./judge_prepare');

function main() {
  const { opts } = parseRunArgs(argv);
  if (!opts.batch || !opts.fromBatch) throw new Error('usage: reuse_judgments.js --batch <새 배치> --from-batch <원래 배치>');
  profile.assertSafe('batch', opts.batch);
  profile.assertSafe('from-batch', opts.fromBatch);
  const { paths, repoRel, label } = profile.load();

  // 새 배치 입력이 현재 코드·데이터로 다시 만든 것과 같은지(judge_run.js와 같은 검사)
  const onDisk = JSON.parse(fs.readFileSync(path.join(paths.judgeInputsDir(opts.batch), 'manifest.json'), 'utf8'));
  const { manifest, jobs } = buildPlan(opts.batch);
  if (JSON.stringify(onDisk) !== JSON.stringify(manifest)) throw new Error('준비된 입력과 현재 코드·데이터가 다릅니다. judge_prepare.js를 먼저 실행하세요.');
  const from = JSON.parse(fs.readFileSync(path.join(paths.judgeInputsDir(opts.fromBatch), 'manifest.json'), 'utf8'));
  for (const k of ['provider', 'model', 'reasoning_effort']) {
    if (from.judge[k] !== manifest.judge[k]) throw new Error(`Judge 설정이 다릅니다: ${k} ${from.judge[k]} ≠ ${manifest.judge[k]}`);
  }
  if (from.rubric_version !== manifest.rubric_version || from.schema_version !== manifest.schema_version) {
    throw new Error(`루브릭·스키마 버전이 다릅니다: ${from.rubric_version}/${from.schema_version} ≠ ${manifest.rubric_version}/${manifest.schema_version}`);
  }

  // 새 배치 run -> 원래 run (import_run_subset.js가 run_info.imported_from에 남긴 값)
  const sourceRun = new Map(manifest.runs.map((r) => {
    const info = JSON.parse(fs.readFileSync(paths.runInfoPath(r.run_id), 'utf8'));
    const imp = info.imported_from;
    if (!imp || imp.test !== profile.load().versionDirName || imp.try !== profile.load().tryTag) {
      throw new Error(`${r.run_id}: 같은 테스트·try에서 가져온 run이 아닙니다(imported_from 확인). 판정은 같은 try 안에서만 옮긴다.`);
    }
    if (!from.runs.some((x) => x.run_id === imp.run_id)) throw new Error(`${r.run_id}: 원래 run ${imp.run_id}이 배치 ${opts.fromBatch}에 없습니다.`);
    return [r.run_id, imp.run_id];
  }));

  const plan = [];
  console.log(`[${label}] ${opts.fromBatch} -> ${opts.batch}`);
  for (const [kind, all] of Object.entries(jobs)) {
    const rubric = manifest.kinds[kind].system_prompt_sha256;
    if (from.kinds[kind]?.system_prompt_sha256 !== rubric) throw new Error(`${kind} 루브릭 SHA가 원래 배치와 다릅니다.`);
    for (const run of manifest.runs) {
      const src = sourceRun.get(run.run_id);
      const ok = new Map();
      for (const row of readAll(paths.judgeResultPath(src, opts.fromBatch, kind))) if (!row.error) ok.set(row.id, row);
      const rows = [];
      let mismatch = 0, missing = 0, unscorable = 0;
      for (const job of all.filter((j) => j.run_id === run.run_id)) {
        if (job.unscored_reason) { unscorable++; continue; }
        const row = ok.get(job.id);
        if (!row) { missing++; continue; }
        if (row.user_text_sha256 !== job.user_text_sha256 || row.source_record_sha256 !== job.source_record_sha256
          || row.rubric_sha256 !== rubric || row.judge_model !== manifest.judge.model) { mismatch++; continue; }
        rows.push({ ...row, run_id: run.run_id, batch_id: opts.batch, reused_from: { batch: opts.fromBatch, run_id: src } });
      }
      if (mismatch) throw new Error(`${kind} ${run.run_id}: 입력 해시가 다른 판정 ${mismatch}건 — 같은 입력이 아니므로 옮기지 않는다(--keep-records로 가져왔는지 확인).`);
      console.log(`  ${kind} ${run.model}: 옮김 ${rows.length} · 원래 배치에서 미채점 ${missing} · 채점 불가 ${unscorable}`);
      plan.push({ out: paths.judgeResultPath(run.run_id, opts.batch, kind), rows });
    }
  }
  if (opts.dryRun) { console.log('[--dry-run] 파일을 쓰지 않고 종료합니다.'); return; }
  for (const { out } of plan) if (fs.existsSync(out)) throw new Error(`이미 판정 파일이 있습니다(덮어쓰지 않음): ${repoRel(out)}`);
  for (const { out, rows } of plan) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''), 'utf8');
  }
  console.log(`완료. 다음: node scripts/docgen/judge_report.js --test ${profile.load().versionDirName} --batch ${opts.batch}`);
}

try { main(); } catch (e) { console.error(e.message || e); process.exit(1); }
