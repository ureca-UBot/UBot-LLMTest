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


// --- LLM Judge 배치 ---------------------------------------------------
// 채점 배치도 라운드마다 다르다. 예전엔 러너와 V2 보고서 스크립트 5개가
// 'rerun-20260918-1328' 문자열을 각자 박아두고 있어서, 배치를 하나 바꾸려면
// 다섯 군데를 동시에 고쳐야 했다(그리고 실제로 test3에서 막혔다).
//
//   LLM_JUDGE_BATCH 미설정 -> 2026-09-18 test2 배치 (기존 동작 유지)

const DEFAULT_JUDGE_BATCH = 'rerun-20260918-1328';

function judgeBatch() {
  const batch = process.env.LLM_JUDGE_BATCH || DEFAULT_JUDGE_BATCH;
  if (!SUITE_RE.test(batch)) {
    throw new Error(`LLM_JUDGE_BATCH 값이 올바르지 않습니다: ${JSON.stringify(batch)} (영문/숫자/-/_ 만 허용)`);
  }
  return batch;
}

// results/judge_inputs/<suite>/<batch> — 채점 입력(프롬프트·jobs·manifest)
function judgeInputsDir(batch = judgeBatch()) {
  return path.join(ROOT, 'results', 'judge_inputs', suiteTag(), batch);
}

// results/llm_judge/<suite>/<batch> — 채점 진행 상태와 호출 로그
function judgeOutputDir(batch = judgeBatch()) {
  return path.join(ROOT, 'results', 'llm_judge', suiteTag(), batch);
}

// results/reports/<suite>/<batch>.json — 생성 라운드의 배치 매니페스트
// (scripts/test3/build_batch_manifest.js가 만든다)
function batchManifestPath(batch = judgeBatch()) {
  return path.join(reportsDir(), batch + '.json');
}

// results/<suite>/V2 — 사람이 읽는 V2 보고서 묶음
function v2Dir() {
  return path.join(docsDir(), 'V2');
}

module.exports = {
  ROOT, suiteTag, rawDir, generationPath, scoredDir, reportsDir, docsDir,
  DEFAULT_JUDGE_BATCH, judgeBatch, judgeInputsDir, judgeOutputDir, batchManifestPath, v2Dir,
};
