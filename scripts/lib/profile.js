'use strict';
// 테스트 프로필 — 공통 엔진이 "지금 어느 테스트를 돌리는가"를 아는 유일한 곳.
//
//   model_test_vN/test.config.js   <- 버전마다 바뀌는 것(데이터·항목·모델·조건·
//                                     프롬프트·Judge)은 전부 여기
//   scripts/                        <- 버전과 무관한 엔진 (이 폴더)
//
// 어떤 테스트·try를 쓸지는 환경변수로 고른다. 진입 스크립트는 --test/--try 인자를
// 받아 applyCliSelectors()로 환경변수에 옮기고, 하위 프로세스는 그 값을 물려받는다.
//
//   LLM_TEST=v4 (또는 model_test_v4)   미설정 시 test.config.js가 있는 가장 높은 버전
//   LLM_TEST_TRY=try1                  미설정 시 config.defaultTry
//
// 모든 결과 경로는 README 4-2절 구조를 따른다.
//   model_test_vN/tryM/results/{raw/<run_id>, raw/scored/<run_id>, report, llm_judge, summary}

const fs = require('fs');
const path = require('path');
const { envTag } = require('./platform');

const ROOT = path.join(__dirname, '..', '..');
const SAFE_RE = /^[A-Za-z0-9_-]+$/;
const CONFIG_NAME = 'test.config.js';

function assertSafe(label, value) {
  if (!SAFE_RE.test(value)) throw new Error(`${label} 값이 올바르지 않습니다: ${JSON.stringify(value)} (영문/숫자/-/_ 만 허용)`);
  return value;
}

function versionDirs() {
  return fs.readdirSync(ROOT)
    .filter((name) => /^model_test_v\d+$/.test(name) && fs.existsSync(path.join(ROOT, name, CONFIG_NAME)))
    .sort((a, b) => Number(a.slice(12)) - Number(b.slice(12)));
}

function resolveVersionDir() {
  const requested = process.env.LLM_TEST;
  if (requested) {
    const name = requested.startsWith('model_test_') ? requested : `model_test_${requested}`;
    assertSafe('LLM_TEST', name);
    if (!fs.existsSync(path.join(ROOT, name, CONFIG_NAME))) {
      throw new Error(`${name}/${CONFIG_NAME}이 없습니다. 공통 엔진은 test.config.js가 있는 버전(v4~)만 실행합니다.`);
    }
    return name;
  }
  const dirs = versionDirs();
  if (!dirs.length) throw new Error(`${CONFIG_NAME}이 있는 model_test_vN 폴더가 없습니다.`);
  return dirs[dirs.length - 1];
}

// --test / --try 를 argv에서 떼어 환경변수로 옮긴다. 남은 인자를 돌려준다.
function applyCliSelectors(argv) {
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--test') process.env.LLM_TEST = argv[++i];
    else if (argv[i] === '--try') process.env.LLM_TEST_TRY = argv[++i];
    else rest.push(argv[i]);
  }
  return rest;
}

let cached = null;

function load() {
  if (cached) return cached;
  const versionDirName = resolveVersionDir();
  const versionDir = path.join(ROOT, versionDirName);
  const config = require(path.join(versionDir, CONFIG_NAME));
  const tryTag = assertSafe('LLM_TEST_TRY', process.env.LLM_TEST_TRY || config.defaultTry || 'try1');
  const resultsDir = path.join(versionDir, tryTag, 'results');
  const fromRoot = (p) => path.join(ROOT, p);

  const paths = {
    root: ROOT,
    versionDir,
    resultsDir,
    casesPath: fromRoot(config.dataset.casesPath),
    faqPath: config.dataset.faqPath ? fromRoot(config.dataset.faqPath) : null,
    datasetManifestPath: fromRoot(path.join(path.dirname(config.dataset.casesPath), 'dataset_manifest.json')),
    rawDir: (runId) => path.join(resultsDir, 'raw', assertSafe('run_id', runId)),
    generationPath: (runId) => path.join(resultsDir, 'raw', assertSafe('run_id', runId), 'generation.jsonl'),
    runInfoPath: (runId) => path.join(resultsDir, 'raw', assertSafe('run_id', runId), 'run_info.json'),
    scoredDir: (runId) => path.join(resultsDir, 'raw', 'scored', assertSafe('run_id', runId)),
    logsDir: path.join(resultsDir, 'raw', 'logs'),
    reportDir: path.join(resultsDir, 'report'),
    summaryDir: path.join(resultsDir, 'summary'),
    llmJudgeDir: path.join(resultsDir, 'llm_judge'),
    batchManifestPath: (batch) => path.join(resultsDir, 'report', assertSafe('batch', batch) + '.json'),
    judgeInputsDir: (batch) => path.join(resultsDir, 'llm_judge', 'inputs', assertSafe('batch', batch)),
    judgeRunsDir: (batch) => path.join(resultsDir, 'llm_judge', 'runs', assertSafe('batch', batch)),
    judgeResultPath: (runId, batch, kind) => path.join(resultsDir, 'raw', 'scored', assertSafe('run_id', runId),
      'llm_judge', assertSafe('batch', batch), assertSafe('kind', kind) + '.jsonl'),
  };

  cached = {
    version: config.version,
    versionDirName,
    tryTag,
    label: `${versionDirName}/${tryTag}`,
    config,
    paths,
    repoRel: (p) => path.relative(ROOT, p).split(path.sep).join('/'),
  };
  return cached;
}

// --- 모델·조건 -----------------------------------------------------------

function modelEntry(tag) {
  const entry = load().config.models.find((m) => m.tag === tag);
  if (!entry) throw new Error(`test.config.js models에 없는 모델입니다: ${tag}`);
  return entry;
}

function condition(name) {
  const { config } = load();
  const key = name || config.defaultCondition;
  const cond = config.conditions[key];
  if (!cond) throw new Error(`알 수 없는 조건: ${key} (가능: ${Object.keys(config.conditions).join(', ')})`);
  return { name: assertSafe('condition', key), ...cond };
}

// 조건을 모델에 적용한 실제 생성 파라미터. 추론 모드가 없는 모델(gemma3 등)에는
// think를 보내지 않는다(Ollama 400 방지) — think=null로 기록한다.
// format: 'json'(JSON 모드) 또는 'schema'(구조화 출력 — config.output.keyOrder 순서로 키 강제).
// 스키마 객체 자체를 넘겨 run_info·generation 기록에 무엇으로 강제했는지 남긴다.
function generationParams(modelTag, conditionName) {
  const { config } = load();
  const cond = condition(conditionName);
  const model = modelEntry(modelTag);
  const mode = config.generation.format || 'json';
  let format = mode;
  if (mode === 'schema') {
    if (!config.output || !config.output.keyOrder) throw new Error("generation.format='schema'이면 output.keyOrder가 필요합니다.");
    format = require('./prompts').outputSchema(config.output.keyOrder);
  }
  return {
    temperature: cond.temperature ?? null,
    seed: cond.seed ?? null,
    think: model.thinkCapable ? (cond.think ?? null) : null,
    format,
  };
}

// --- run_id ----------------------------------------------------------------
// <env>_<모델>_<조건>_<컨텍스트 방식>_n<항목당 건수>_<날짜>[_<항목 코드>]
//   예) local-win_qwen3-4b_t0_nothink_fixed_n200_20261001
//       local-win_gemma3-4b_t0_nothink_fixed_n50_20261001_CE-MT
function sanitizeTag(tag) {
  return tag.replace(/[:.]/g, '-');
}

function todayStamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function makeRunId({ model, conditionName, size, date = todayStamp(), items = null, env = envTag() }) {
  const { config } = load();
  const parts = [env, sanitizeTag(model), condition(conditionName).name, config.contextMode, `n${size}`, date];
  if (items && items.length) parts.push(items.join('-'));
  return assertSafe('run_id', parts.join('_'));
}

module.exports = {
  ROOT, SAFE_RE, load, applyCliSelectors, modelEntry, condition, generationParams,
  makeRunId, sanitizeTag, todayStamp, assertSafe, versionDirs,
};
