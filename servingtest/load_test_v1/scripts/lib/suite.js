'use strict';
// 결과 디렉터리 경로를 한 곳에서 해석한다 (model_test_v3/scripts/lib/suite.js와 같은 규칙).
//
//   load_test_v1/scripts/                          <- 이 스크립트들
//   load_test_v1/tryM/results/raw/<runId>/         <- 요청별 기록·모니터 기록·단계 요약
//   load_test_v1/tryM/results/raw/logs/            <- 실행 로그, Ollama 서버 로그
//   load_test_v1/tryM/results/summary/             <- 사람이 읽는 요약·표·그래프
//   load_test_v1/tryM/results/all_summary.md       <- 회차 요약 (시작점)
//
// try는 LLM_TEST_TRY 환경변수로 고른다 (미설정이면 try1).

const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const VERSION_DIR = path.join(__dirname, '..', '..');
const VERSION = path.basename(VERSION_DIR);
const DEFAULT_TRY = 'try1';
const SAFE_RE = /^[A-Za-z0-9_-]+$/;

function tryTag() {
  const tag = process.env.LLM_TEST_TRY || DEFAULT_TRY;
  if (!SAFE_RE.test(tag)) {
    throw new Error(`LLM_TEST_TRY 값이 올바르지 않습니다: ${JSON.stringify(tag)} (영문/숫자/-/_ 만 허용)`);
  }
  return tag;
}

function suiteTag() {
  return `${VERSION}/${tryTag()}`;
}

function resultsDir() {
  return path.join(VERSION_DIR, tryTag(), 'results');
}

function rawDir(runId) {
  if (!SAFE_RE.test(runId)) throw new Error(`run_id 형식이 올바르지 않습니다: ${runId}`);
  return path.join(resultsDir(), 'raw', runId);
}

function logsDir() {
  return path.join(resultsDir(), 'raw', 'logs');
}

function summaryDir() {
  return path.join(resultsDir(), 'summary');
}

function allSummaryPath() {
  return path.join(resultsDir(), 'all_summary.md');
}

// 기본 입력은 항목 비율을 유지한 300건 JSONL. 다른 JSONL·기존 CSV는 명시적으로 지정한다.
function casesPath() {
  return process.env.LOADTEST_PROMPTS ? path.resolve(process.env.LOADTEST_PROMPTS)
    : path.join(VERSION_DIR, 'data', 'benchmark_prompts.jsonl');
}

function repoRel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

module.exports = {
  ROOT, VERSION, DEFAULT_TRY, tryTag, suiteTag, resultsDir, rawDir, logsDir, summaryDir,
  allSummaryPath, casesPath, repoRel,
};
