'use strict';
// LLM Judge 2단계: 배치 매니페스트의 저장 답변 -> 채점 입력(외부 호출 없음).
//
//   llm_judge/inputs/<batch>/manifest.json
//   llm_judge/inputs/<batch>/<kind>_system_prompt.txt
//   llm_judge/inputs/<batch>/<kind>_jobs.jsonl      kind = accuracy | safety | persona
//
// 같은 배치로 다시 실행하면 내용이 같을 때만 통과하고, 다르면 덮어쓰지 않고 멈춘다.
//
// Usage: node scripts/judge/judge_prepare.js --batch <id> [--test v4] [--try try1]

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { parseRunArgs } = require('../lib/args');
const { readAll } = require('../lib/jsonl');
const { loadCases, isRepeatCase } = require('../lib/dataset');
const { OUTPUT_STATUSES } = require('../lib/prompts');
const { splitContextBlocks } = require('../lib/context_blocks');
const { RUBRIC_VERSION, SYSTEM_PROMPTS, buildUserText } = require('../lib/judge/prompts');
const { SCHEMA_VERSION, SCHEMAS } = require('../lib/judge/schema');
const { judgeSettings } = require('../lib/judge/providers');

const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');

function unscoredReason(g) {
  if (g.error_type === 'TIMEOUT') return 'TIMEOUT';
  if (g.error) return 'GENERATION_ERROR';
  const answer = g.parsed?.answer;
  const hasRaw = typeof g.raw_content === 'string' && g.raw_content.trim();
  const hasAnswer = typeof answer === 'string' && answer.trim();
  if (!hasRaw && !hasAnswer) return 'NO_RESPONSE';
  return null;
}

function selectFor(kind, c, config) {
  if (kind === 'accuracy') return config.judge.includeRepeats || !isRepeatCase(c) || c.round === 1;
  if (kind === 'safety') return config.safetyItems.includes(c.item);
  if (kind === 'persona') return !!(c.persona || '').trim();
  throw new Error(`알 수 없는 Judge 종류: ${kind}`);
}

function buildPlan(batchId) {
  const { config, paths, repoRel } = profile.load();
  const manifestPath = paths.batchManifestPath(batchId);
  if (!fs.existsSync(manifestPath)) throw new Error(`배치 매니페스트가 없습니다: ${repoRel(manifestPath)} (build_batch_manifest.js 먼저)`);
  const batchBytes = fs.readFileSync(manifestPath);
  const batch = JSON.parse(batchBytes.toString('utf8'));
  if (batch.status !== 'completed') throw new Error('완료된 배치만 채점 입력을 만들 수 있습니다.');
  const { byId, sha256: casesSha } = loadCases();
  if (batch.cases_sha256 !== casesSha) throw new Error('배치 이후 데이터셋이 바뀌었습니다.');

  const kinds = config.judge.kinds;
  const jobs = Object.fromEntries(kinds.map((k) => [k, []]));
  for (const run of batch.runs) {
    const bytes = fs.readFileSync(path.join(paths.root, run.source_path));
    if (sha256(bytes) !== run.source_sha256) throw new Error(`배치 이후 저장 답변이 바뀌었습니다: ${run.run_id}`);
    const generations = readAll(path.join(paths.root, run.source_path));
    for (const g of generations) {
      const c = byId.get(g.id);
      for (const kind of kinds) {
        if (!selectFor(kind, c, config)) continue;
        const userText = buildUserText(kind, c, g);
        jobs[kind].push({
          kind, id: c.id, run_id: run.run_id, model_tag: run.model, item: c.item, difficulty: c.difficulty,
          round: c.round, original_id: c.originalId, expected_status: c.expectedStatus,
          persona_sub: c.personaSub || null, repeat: isRepeatCase(c),
          // 판정 교차 검증용: 응답 라벨(content_stance와 비교)과 content_sources에 쓸 수 있는 ID
          response_status: OUTPUT_STATUSES.includes(g.parsed?.status) ? g.parsed.status : null,
          allowed_sources: [
            ...splitContextBlocks(c.context).map((b) => b.id).filter(Boolean),
            ...((c.userInfo || '').trim() ? ['USER_INFO_API'] : []),
            ...((c.history || '').trim() ? ['HISTORY'] : []),
          ],
          unscored_reason: unscoredReason(g),
          source_record_sha256: sha256(JSON.stringify(g)),
          user_text: userText, user_text_sha256: sha256(userText),
        });
      }
    }
  }

  const manifest = {
    status: 'inputs_prepared_not_scored',
    batch_id: batchId,
    test: profile.load().versionDirName,
    try: profile.load().tryTag,
    rubric_version: RUBRIC_VERSION,
    schema_version: SCHEMA_VERSION,
    // 판정 설정을 배치에 고정한다(바뀌면 judge_run.js가 멈추고 새 배치가 필요하다).
    judge: judgeSettings(config.judge),
    batch_manifest_sha256: sha256(batchBytes),
    cases_sha256: casesSha,
    include_repeats: !!config.judge.includeRepeats,
    runs: batch.runs.map((r) => ({ run_id: r.run_id, model: r.model, source_sha256: r.source_sha256,
      ...Object.fromEntries(kinds.map((k) => [`${k}_jobs`, jobs[k].filter((j) => j.run_id === r.run_id).length])) })),
    kinds: Object.fromEntries(kinds.map((k) => [k, {
      planned_jobs: jobs[k].length,
      unscorable_jobs: jobs[k].filter((j) => j.unscored_reason).length,
      system_prompt_sha256: sha256(SYSTEM_PROMPTS[k]),
      schema_sha256: sha256(JSON.stringify(SCHEMAS[k])),
      jobs_sha256: sha256(JSON.stringify(jobs[k])),
    }])),
  };
  return { manifest, jobs };
}

function main() {
  const { opts } = parseRunArgs(argv);
  if (!opts.batch) throw new Error('--batch <id>가 필요합니다.');
  const { paths, repoRel, label } = profile.load();
  const { manifest, jobs } = buildPlan(opts.batch);
  const dir = paths.judgeInputsDir(opts.batch);
  const files = { 'manifest.json': JSON.stringify(manifest, null, 2) + '\n' };
  for (const kind of Object.keys(jobs)) {
    files[`${kind}_system_prompt.txt`] = SYSTEM_PROMPTS[kind];
    files[`${kind}_jobs.jsonl`] = jobs[kind].map((j) => JSON.stringify(j)).join('\n') + (jobs[kind].length ? '\n' : '');
  }
  for (const [name, content] of Object.entries(files)) {
    const p = path.join(dir, name);
    if (fs.existsSync(p) && fs.readFileSync(p, 'utf8') !== content) {
      throw new Error(`다른 내용의 입력이 이미 있습니다(덮어쓰지 않음): ${repoRel(p)} — 새 배치 ID를 쓰세요.`);
    }
  }
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    const p = path.join(dir, name);
    if (!fs.existsSync(p)) fs.writeFileSync(p, content, { flag: 'wx', encoding: 'utf8' });
  }
  console.log(`[${label}] 채점 입력 -> ${repoRel(dir)} · Judge ${manifest.judge.provider}/${manifest.judge.model || '(모델 미정)'}`);
  if (!manifest.judge.model) {
    console.warn('  [주의] judge.model이 정해지지 않아 이 배치로는 채점(judge_run.js)할 수 없습니다. 모델을 정한 뒤 새 배치 ID로 다시 준비하세요.');
  }
  for (const [k, v] of Object.entries(manifest.kinds)) console.log(`  ${k}: ${v.planned_jobs}건 (미채점 대상 ${v.unscorable_jobs})`);
  console.log(`\n다음(외부 전송 — 승인 후): node scripts/judge/judge_run.js --batch ${opts.batch} --confirm-external [--concurrency 8]`);
}

if (require.main === module) {
  try { main(); } catch (e) { console.error(e.message); process.exit(1); }
}

module.exports = { buildPlan };
