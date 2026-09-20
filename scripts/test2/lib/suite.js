'use strict';
// 결과 디렉터리의 라운드(suite) 세그먼트를 한 곳에서 해석한다.
//
// test2와 test3는 평가 데이터셋(data/eval_sets/test_set2/cases.csv 380행)이
// 동일하고 실행 환경·생성 파라미터만 다르다. 그래서 채점 스크립트는 그대로
// 공유하고, 결과가 쌓이는 경로만 갈라준다.
//
//   LLM_TEST_SUITE 미설정 -> 'test2' (기존 명령의 동작은 전혀 바뀌지 않음)
//   LLM_TEST_SUITE=test3  -> results/{raw,scored,reports}/test3/...
//
// 예전엔 각 스크립트가 path.join(ROOT, 'results', 'raw', 'test2', runId)처럼
// 리터럴을 직접 박아뒀다(9개 파일 23곳). 라운드가 하나 늘 때마다 그 전부를
// 고쳐야 했으므로 여기로 모았다.

const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
// 디렉터리명으로 그대로 쓰이므로 경로 조작 문자를 막는다.
const SUITE_RE = /^[A-Za-z0-9_-]+$/;

function suiteTag() {
  const tag = process.env.LLM_TEST_SUITE || 'test2';
  if (!SUITE_RE.test(tag)) {
    throw new Error(`LLM_TEST_SUITE 값이 올바르지 않습니다: ${JSON.stringify(tag)} (영문/숫자/-/_ 만 허용)`);
  }
  return tag;
}

// results/raw/<suite>/<runId>
function rawDir(runId) {
  return path.join(ROOT, 'results', 'raw', suiteTag(), runId);
}

// results/raw/<suite>/<runId>/generation.jsonl
function generationPath(runId) {
  return path.join(rawDir(runId), 'generation.jsonl');
}

// results/scored/<suite>/<runId>
function scoredDir(runId) {
  return path.join(ROOT, 'results', 'scored', suiteTag(), runId);
}

// results/reports/<suite>
function reportsDir() {
  return path.join(ROOT, 'results', 'reports', suiteTag());
}

// results/<suite> (사람이 읽는 집계 문서)
function docsDir() {
  return path.join(ROOT, 'results', suiteTag());
}

module.exports = { ROOT, suiteTag, rawDir, generationPath, scoredDir, reportsDir, docsDir };
