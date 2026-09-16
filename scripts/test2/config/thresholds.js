'use strict';
// Decision thresholds seeded from the 16+8 case KLUE-NLI calibration probe
// (scratchpad, 2026-09-16 — see CLAUDE.md for a pointer). Revisit once the
// full pipeline has run on real model output: recompute these against a
// larger, model-generated sample rather than the hand-built calibration set.

module.exports = {
  // 항목1(답변정확도): BGE-M3 cosine similarity pass/fail line. Calibration
  // showed correct/incorrect NLI calls cluster far from any boundary (>99%
  // vs flatly wrong), but BGE-M3 itself hasn't been calibrated yet — this is
  // a placeholder pending a real run; treat the "borderline band" below as
  // the escalation trigger rather than trusting this exact number.
  bgeM3SimilarityPass: 0.75,
  bgeM3BorderlineBand: 0.05, // |sim - pass threshold| <= this => escalate

  // 2026-09-17 추가: BGE-M3 유사도는 문장 전체를 하나로 뭉개서 비교하므로,
  // 필수 사실 하나가 통째로 빠져도(누락형 오류) 나머지 문장이 비슷하면
  // 유사도가 여전히 높게 나올 수 있음(사용자 지적으로 발견 — 키워드
  // 커버리지가 계산만 되고 실제 판정엔 안 쓰이고 있었음). 항목1 통과 조건에
  // 커버리지도 같이 요구해서 "유사도는 높은데 필수 사실은 빠짐"을 잡음.
  keywordCoveragePass: 0.6,
  // 커버리지가 이보다 낮으면(유사도 통과 여부와 무관하게) 누락 의심으로
  // 무조건 에스컬레이션.
  keywordCoverageOmissionFloor: 0.4,

  // 항목2(RAG충실도): NLI margin between top-1 and top-2 class probability
  // below which the classifier's own call is considered "unsure" and should
  // escalate rather than be trusted outright.
  nliConfidenceMargin: 0.15,

  // 항목1/2 공통: escalate when independent deterministic signals disagree
  // with each other (see scripts/lib/escalation.js for the concrete rules).

  // status 불일치인데 내용은 맞는 것 같은 케이스를 escalate할지 판단하는
  // 키워드커버리지 최소선. (예전엔 escalation.js에 하드코딩돼 있었음 —
  // 다른 임계값들처럼 여기로 이동.)
  statusMismatchKeywordCoverageFloor: 0.7,
};
