'use strict';
// test3 라운드 공통 실행기. 세 진입점(run_round / run_think_ablation /
// run_temp_control)이 모델 목록과 생성 파라미터만 바꿔서 이걸 호출한다.
//
// 채점은 v2와 같은 파이프라인(이 폴더의 run_pipeline.js — model_test_v2/scripts의
// 복사본)을 쓰고, 결과는 LLM_TEST_TRY로 고른 model_test_v3/<try>/results/ 에 쌓인다.
// v2 채점 스크립트를 고치면 이 폴더의 복사본에도 같이 반영해야 한다.

const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..', '..');
const PIPELINE = path.join(__dirname, '..', 'run_pipeline.js');
const suitePaths = require('./suite');
const SUITE = suitePaths.suiteTag();

function todayStamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

// run_all_models.js와 같은 규칙: ':'와 '.'을 '-'로.
function sanitizeTag(tag) {
  return tag.replace(/[:.]/g, '-');
}

function envTag() {
  return process.env.LLM_TEST_ENV || (process.platform === 'win32' ? 'local-win' : 'ec2-linux');
}

// run_id: <env>_<model>_<조건>_<날짜>
//   조건 예) t0_think · t0_nothink · t08_think
// 조건을 run_id에 박아두는 이유 — 같은 모델을 파라미터만 바꿔 여러 번 돌리므로
// 디렉터리 이름만 보고 어떤 조건인지 알 수 있어야 한다.
function makeRunId(modelTag, condition, date) {
  return `${envTag()}_${sanitizeTag(modelTag)}_${condition}_${date}`;
}

// Ollama에 모델이 실제로 있는지 미리 확인한다. 7개 중 하나가 빠진 채로
// 3~6시간짜리 라운드를 시작했다가 중간에 죽는 걸 막는다.
function checkModelsAvailable(models, embeddingModel) {
  const res = spawnSync('ollama', ['list'], { encoding: 'utf8' });
  if (res.error || res.status !== 0) {
    console.warn('  [사전확인] `ollama list` 실패 — 모델 존재 확인을 건너뜁니다.');
    return { ok: true, missing: [] };
  }
  const installed = res.stdout.split('\n').slice(1)
    .map((line) => line.trim().split(/\s+/)[0]).filter(Boolean);
  const has = (tag) => installed.includes(tag)
    || installed.some((n) => n === tag + ':latest' || n.startsWith(tag.split(':')[0] + ':') && n === tag);
  const wanted = [...models.map((m) => m.tag), embeddingModel];
  const missing = wanted.filter((tag) => !installed.includes(tag) && !has(tag));
  return { ok: missing.length === 0, missing, installed };
}

function buildArgs(runId, modelTag, params) {
  const args = [PIPELINE, runId, modelTag];
  if (params.temperature !== undefined && params.temperature !== null) {
    args.push('--temperature', String(params.temperature));
  }
  if (params.think !== undefined && params.think !== null) {
    args.push('--think', String(params.think));
  }
  if (params.seed !== undefined && params.seed !== null) {
    args.push('--seed', String(params.seed));
  }
  if (params.repeatOnly) args.push('--repeat-only');
  if (params.skipRepeat) args.push('--skip-repeat');
  if (params.limit) args.push('--limit', String(params.limit));
  return args;
}

// models: [{tag, ...}], params: {temperature, think, seed, repeatOnly, skipRepeat, limit}
function runRound({ label, models, condition, params, date = todayStamp(), dryRun = false, skipModelCheck = false }) {
  if (!models.length) {
    console.error(`[${label}] 대상 모델이 없습니다.`);
    process.exit(1);
  }

  console.log(`\n===== ${label} =====`);
  console.log(`suite=${SUITE} env=${envTag()} date=${date} 모델 ${models.length}개`);
  console.log(`생성 파라미터: ${JSON.stringify(params)}`);
  for (const m of models) {
    console.log(`  - ${m.tag}  ->  ${makeRunId(m.tag, condition, date)}`);
  }

  if (dryRun) {
    console.log('\n[--dry-run] 여기까지. 모델 호출은 하지 않았습니다.');
    return [];
  }

  if (!skipModelCheck) {
    const check = checkModelsAvailable(models, require('../config/models').embeddingModel);
    if (!check.ok) {
      console.error(`\n[사전확인] Ollama에 없는 모델이 있습니다: ${check.missing.join(', ')}`);
      console.error('다음 명령으로 받은 뒤 다시 실행하세요:');
      for (const tag of check.missing) console.error(`  ollama pull ${tag}`);
      process.exit(1);
    }
    console.log('[사전확인] 대상 모델 + 임베딩 모델 전부 확인됨.');
  }

  const results = [];
  const startedAt = Date.now();
  for (const [idx, m] of models.entries()) {
    const runId = makeRunId(m.tag, condition, date);
    console.log(`\n\n########## [${idx + 1}/${models.length}] ${m.tag} (run_id=${runId}) ##########`);
    const res = spawnSync(process.execPath, buildArgs(runId, m.tag, m.thinkCapable ? params : { ...params, think: null }), {
      stdio: 'inherit',
      env: { ...process.env, LLM_TEST_TRY: suitePaths.tryTag() },
    });
    results.push({ tag: m.tag, runId, ok: res.status === 0, status: res.status });
    if (res.status !== 0) {
      // test2 run_all_models.js와 같은 방침: 한 모델이 실패해도 나머지는 계속.
      console.error(`\n[${label}] ${m.tag} 실패(exit ${res.status}) — 다음 모델로 계속 진행합니다.`);
    }
  }

  const elapsedMin = ((Date.now() - startedAt) / 60000).toFixed(1);
  console.log(`\n\n========== ${label} 요약 (${elapsedMin}분) ==========`);
  for (const r of results) console.log(`  ${r.ok ? 'OK  ' : 'FAIL'} ${r.tag} (run_id=${r.runId})`);
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.error(`\n${failed.length}개 실패. 같은 run_id로 다시 실행하면 완료된 케이스는 건너뛰고 이어서 진행됩니다.`);
  }
  return results;
}

function parseCommonArgs(argv) {
  const opts = { dryRun: false, date: todayStamp(), limit: null, skipModelCheck: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dry-run') opts.dryRun = true;
    else if (argv[i] === '--date') opts.date = argv[++i];
    else if (argv[i] === '--limit') opts.limit = parseInt(argv[++i], 10);
    else if (argv[i] === '--skip-model-check') opts.skipModelCheck = true;
  }
  return opts;
}

module.exports = { ROOT, SUITE, todayStamp, sanitizeTag, envTag, makeRunId, runRound, parseCommonArgs, checkModelsAvailable };
