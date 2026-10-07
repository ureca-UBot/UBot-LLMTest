'use strict';
// run_all.js / run_model.js / run_item.js 공통 실행기. 세 진입점은 "어떤 모델 × 어떤
// 항목"만 정하고, run_id 생성·모델 사전 확인·파이프라인 호출은 전부 여기서 한다.

const path = require('path');
const { spawnSync } = require('child_process');
const profile = require('./profile');
const { toArgs } = require('./args');
const { selectCases, readIdsFile } = require('./dataset');

const PIPELINE = path.join(__dirname, '..', 'run', 'run_pipeline.js');

function installedModels() {
  const res = spawnSync('ollama', ['list'], { encoding: 'utf8' });
  if (res.error || res.status !== 0) return null;
  return res.stdout.split('\n').slice(1).map((l) => l.trim().split(/\s+/)[0]).filter(Boolean);
}

function checkModels(tags) {
  const installed = installedModels();
  if (!installed) {
    console.warn('[사전확인] `ollama list` 실패 — 모델 확인을 건너뜁니다.');
    return;
  }
  const has = (tag) => installed.includes(tag) || installed.includes(`${tag}:latest`);
  const missing = [...tags, profile.load().config.embeddingModel].filter((t) => !has(t));
  if (missing.length) {
    console.error(`[사전확인] Ollama에 없는 모델: ${missing.join(', ')}`);
    for (const t of missing) console.error(`  ollama pull ${t}`);
    process.exit(1);
  }
}

// models: 모델 태그 배열, items: 항목 코드 배열(null = 전체), opts: 공통 인자
function runRound({ label, models, items = null, opts = {} }) {
  const { config, label: suite } = profile.load();
  if (!models.length) { console.error(`[${label}] 대상 모델이 없습니다.`); process.exit(1); }
  const cond = profile.condition(opts.condition);
  const size = opts.size || config.dataset.defaultSize;
  const date = opts.date || profile.todayStamp();
  const idsSel = opts.idsFile ? readIdsFile(opts.idsFile) : null;
  const nCases = selectCases({ size, items, difficulty: opts.difficulty, limit: opts.limit, ids: idsSel?.ids }).length;
  if (idsSel && nCases !== idsSel.ids.length) {
    console.error(`[${label}] --ids-file의 ${idsSel.ids.length}건 중 ${nCases}건만 선택됩니다 — --size·항목 범위 밖 ID가 있습니다(--size 200으로 실행하세요).`);
    process.exit(1);
  }
  require('./prompts').systemPromptFor(profile.load().promptVariant); // 없는 안이면 모델 호출 전에 멈춘다

  const plan = models.map((tag) => {
    profile.modelEntry(tag);
    return { tag, runId: profile.makeRunId({ model: tag, conditionName: cond.name, size, date, items, idsTag: idsSel?.tag }) };
  });

  console.log(`\n===== ${label} [${suite}] =====`);
  console.log(`조건 ${cond.name} · 프롬프트 ${profile.load().promptVariant} · 컨텍스트 ${config.contextMode} · 항목당 ${size}건 · ${items ? '항목 ' + items.join(',') : '전체 항목'} · 모델당 ${nCases}행`);
  const showParams = (gp) => JSON.stringify({ ...gp, format: typeof gp.format === 'object' ? `schema(${Object.keys(gp.format.properties).join('>')})` : gp.format });
  for (const p of plan) console.log(`  - ${p.tag} ${showParams(profile.generationParams(p.tag, cond.name))} -> ${p.runId}`);
  if (opts.dryRun) { console.log('\n[--dry-run] 모델 호출 없이 종료합니다.'); return []; }
  if (!opts.skipModelCheck) checkModels(plan.map((p) => p.tag));

  const env = { ...process.env, LLM_TEST: profile.load().versionDirName, LLM_TEST_TRY: profile.load().tryTag };
  const passthrough = toArgs({ ...opts, condition: cond.name, size, items }, ['condition', 'size', 'items', 'difficulty', 'limit', 'idsFile']);
  const results = [];
  const started = Date.now();
  for (const [i, p] of plan.entries()) {
    console.log(`\n########## [${i + 1}/${plan.length}] ${p.tag} (${p.runId}) ##########`);
    const res = spawnSync(process.execPath, [PIPELINE, p.runId, p.tag, ...passthrough], { stdio: 'inherit', env });
    results.push({ ...p, ok: res.status === 0 });
    if (res.status !== 0) console.error(`[${label}] ${p.tag} 실패 — 다음 모델로 계속합니다.`);
  }
  console.log(`\n===== ${label} 요약 (${((Date.now() - started) / 60000).toFixed(1)}분) =====`);
  for (const r of results) console.log(`  ${r.ok ? 'OK  ' : 'FAIL'} ${r.tag} (${r.runId})`);
  if (results.some((r) => !r.ok)) {
    console.error('실패한 모델은 같은 명령을 다시 실행하면 완료된 케이스를 건너뛰고 이어서 진행합니다.');
    process.exitCode = 1;
  }
  return results;
}

module.exports = { runRound };
