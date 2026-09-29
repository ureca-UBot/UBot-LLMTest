'use strict';
// v1(test1) 경로를 한 곳에서 해석한다.
//
//   data/                                  <- 저장소 공통 데이터 (faq.csv, eval_sets/test_set1/)
//   model_test_v1/try1/results/raw/        <- 모델 응답(.jsonl)과 결정론 채점(.scored.jsonl)
//   model_test_v1/try1/results/llm_judge/  <- Judge 채점 결과(.judged.jsonl)
//   model_test_v1/try1/results/report/     <- 라운드별 결과 문서
//   model_test_v1/try1/results/summary/    <- 전체 요약 문서
//
// try는 LLM_TEST_TRY 환경변수로 고른다(기본 try1).

const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const TRY = process.env.LLM_TEST_TRY || 'try1';
if (!/^[A-Za-z0-9_-]+$/.test(TRY)) throw new Error(`LLM_TEST_TRY 값이 올바르지 않습니다: ${JSON.stringify(TRY)}`);
const RESULTS_DIR = path.join(ROOT, 'model_test_v1', TRY, 'results');

module.exports = {
  ROOT,
  DATA_DIR: path.join(ROOT, 'data'),
  EVAL_DIR: path.join(ROOT, 'data', 'eval_sets', 'test_set1'),
  RESULTS_DIR,
  RAW_DIR: path.join(RESULTS_DIR, 'raw'),
  JUDGE_DIR: path.join(RESULTS_DIR, 'llm_judge'),
  REPORT_DIR: path.join(RESULTS_DIR, 'report'),
  SUMMARY_DIR: path.join(RESULTS_DIR, 'summary'),
};
