'use strict';
// 결과 디렉터리 경로를 한 곳에서 해석한다.
//
// 저장소 구조 (2026-09-28 개편):
//   model_test_vN/scripts/                     <- 이 스크립트들 (버전 단위, try끼리 공유)
//   model_test_vN/tryM/results/raw/<runId>/    <- 모델 원본 응답 (generation.jsonl)
//   model_test_vN/tryM/results/raw/scored/<runId>/  <- 채점 JSONL·CSV
//   model_test_vN/tryM/results/report/         <- run별 자동 보고서·배치 매니페스트
//   model_test_vN/tryM/results/llm_judge/      <- LLM Judge 보고서 (inputs/, runs/ 포함)
//   model_test_vN/tryM/results/summary/        <- 사람이 읽는 요약·비교 문서
//
// 버전은 이 파일의 위치(model_test_vN/scripts/lib)로 정해지고, try는
// LLM_TEST_TRY 환경변수로 고른다.
//
//   LLM_TEST_TRY 미설정 -> DEFAULT_TRY (이 버전의 최신 try)
//   LLM_TEST_TRY=try1   -> model_test_vN/try1/results/...
//
// 예전의 LLM_TEST_SUITE(test2/test3)는 버전 폴더가 분리되면서 없어졌다.

const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const VERSION_DIR = path.join(__dirname, '..', '..');
const VERSION = path.basename(VERSION_DIR);
const DEFAULT_TRY = 'try2';
// 디렉터리명으로 그대로 쓰이므로 경로 조작 문자를 막는다.
const SAFE_RE = /^[A-Za-z0-9_-]+$/;

function tryTag() {
  const tag = process.env.LLM_TEST_TRY || DEFAULT_TRY;
  if (!SAFE_RE.test(tag)) {
    throw new Error(`LLM_TEST_TRY 값이 올바르지 않습니다: ${JSON.stringify(tag)} (영문/숫자/-/_ 만 허용)`);
  }
  return tag;
}

// 사람이 읽는 로그·문서에 찍는 라벨 (예: model_test_v2/try2)
function suiteTag() {
  return `${VERSION}/${tryTag()}`;
}

// model_test_vN/tryM/results — 다른 버전 결과를 읽을 때는 version/try를 넘긴다.
function resultsDir(version = VERSION, tryName = tryTag()) {
  return path.join(ROOT, version, tryName, 'results');
}

// results/raw/<runId>
function rawDir(runId) {
  return path.join(resultsDir(), 'raw', runId);
}

// results/raw/<runId>/generation.jsonl
function generationPath(runId) {
  return path.join(rawDir(runId), 'generation.jsonl');
}

// results/raw/scored/<runId>
function scoredDir(runId) {
  return path.join(resultsDir(), 'raw', 'scored', runId);
}

// results/report
function reportsDir() {
  return path.join(resultsDir(), 'report');
}

// results/summary (사람이 읽는 집계 문서)
function docsDir() {
  return path.join(resultsDir(), 'summary');
}

// results/llm_judge (LLM Judge 보고서)
function llmJudgeDir() {
  return path.join(resultsDir(), 'llm_judge');
}


// --- LLM Judge 배치 ---------------------------------------------------
// 채점 배치도 라운드마다 다르다. 예전엔 러너와 V2 보고서 스크립트 5개가
// 'rerun-20260918-1328' 문자열을 각자 박아두고 있어서, 배치를 하나 바꾸려면
// 다섯 군데를 동시에 고쳐야 했다(그리고 실제로 test3에서 막혔다).
//
//   LLM_JUDGE_BATCH 미설정 -> DEFAULT_JUDGE_BATCH

const DEFAULT_JUDGE_BATCH = 'rerun-20260918-1328';

function judgeBatch() {
  const batch = process.env.LLM_JUDGE_BATCH || DEFAULT_JUDGE_BATCH;
  if (!SAFE_RE.test(batch)) {
    throw new Error(`LLM_JUDGE_BATCH 값이 올바르지 않습니다: ${JSON.stringify(batch)} (영문/숫자/-/_ 만 허용)`);
  }
  return batch;
}

// results/llm_judge/inputs/<batch> — 채점 입력(프롬프트·jobs·manifest)
function judgeInputsDir(batch = judgeBatch()) {
  return path.join(llmJudgeDir(), 'inputs', batch);
}

// results/llm_judge/runs/<batch> — 채점 진행 상태와 호출 로그
function judgeOutputDir(batch = judgeBatch()) {
  return path.join(llmJudgeDir(), 'runs', batch);
}

// results/report/<batch>.json — 생성 라운드의 배치 매니페스트
function batchManifestPath(batch = judgeBatch()) {
  return path.join(reportsDir(), batch + '.json');
}

// V2 보고서 묶음 — 예전 results/test2/V2. 이제 summary 폴더에 바로 둔다.
function v2Dir() {
  return docsDir();
}

// 저장소 루트 기준 상대 경로 (문서에 경로를 적을 때)
function repoRel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

module.exports = {
  ROOT, VERSION, DEFAULT_TRY, tryTag, suiteTag, resultsDir, rawDir, generationPath, scoredDir,
  reportsDir, docsDir, llmJudgeDir,
  DEFAULT_JUDGE_BATCH, judgeBatch, judgeInputsDir, judgeOutputDir, batchManifestPath, v2Dir, repoRel,
};
