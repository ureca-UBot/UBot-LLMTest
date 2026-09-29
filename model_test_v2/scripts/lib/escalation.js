'use strict';
// "LLM 재판단 필요 여부" — decides, from already-computed deterministic
// signals alone (no model call), whether a case's automated score is
// trustworthy or should be escalated to a human/LLM review pass. This is
// what keeps LLM Judge usage down to a small, genuinely-ambiguous subset
// instead of running it over all 1000 cases.
//
// Input `signals` shape (all optional — a stage that hasn't run yet just
// won't contribute its triggers):
// {
//   statusMatch: boolean,               // parsed.status === 기대 응답 상태 매핑
//   keywordCoverage: number|null,       // 0..1
//   numericCheckPass: boolean|null,     // regex_checks.verifyGrounded().pass
//   nliLabel: 'ENTAILMENT'|'NEUTRAL'|'CONTRADICTION'|null,
//   nliProbs: {ENTAILMENT,NEUTRAL,CONTRADICTION}|null,
//   bgeM3Similarity: number|null,       // 0..1
//   caseType: string,                   // 유형 (e.g. 'FAQ 충돌·시행일')
//   evidenceIdsMatchExpected: boolean|null,
//   answerMentionsExactlyOneConflictingNumber: boolean|null, // CF-specific
//   hasWrongSourceNumber: boolean|null, // 인용 안 한 블록의 숫자를 씀
// }

const thresholds = require('../config/thresholds');

function nliConfidenceMargin(probs) {
  if (!probs) return null;
  const sorted = Object.values(probs).sort((a, b) => b - a);
  return sorted[0] - (sorted[1] ?? 0);
}

function evaluateEscalation(signals) {
  const reasons = [];

  // 1) status mismatch but the substantive content checks out -> likely a
  //    wording/labeling difference, not a real failure.
  if (signals.statusMatch === false
    && (signals.keywordCoverage ?? 0) >= thresholds.statusMismatchKeywordCoverageFloor
    && signals.numericCheckPass !== false) {
    reasons.push('status는 불일치하지만 키워드커버리지·숫자검증은 통과 — 표현 차이 가능성');
  }

  // 2) NLI vs regex numeric check disagree.
  if (signals.nliLabel === 'ENTAILMENT' && signals.numericCheckPass === false) {
    reasons.push('NLI는 함의로 보는데 숫자검증은 실패 — 신호 불일치');
  }
  if (signals.nliLabel === 'CONTRADICTION' && signals.numericCheckPass === true) {
    reasons.push('NLI는 모순으로 보는데 숫자검증은 통과 — 신호 불일치');
  }

  // 3) BGE-M3 similarity in the borderline band around the pass line.
  if (typeof signals.bgeM3Similarity === 'number') {
    const dist = Math.abs(signals.bgeM3Similarity - thresholds.bgeM3SimilarityPass);
    if (dist <= thresholds.bgeM3BorderlineBand) {
      reasons.push(`BGE-M3 유사도가 임계값 근처 (${signals.bgeM3Similarity.toFixed(3)})`);
    }
  }

  // 4) NLI's own confidence margin is thin.
  const margin = nliConfidenceMargin(signals.nliProbs);
  if (margin !== null && margin < thresholds.nliConfidenceMargin) {
    reasons.push(`NLI 1등/2등 확률차가 작음 (margin=${margin.toFixed(3)})`);
  }

  // 5) 필수 사실 커버리지가 낮음(누락 의심) — status/숫자검증이 전부
  //    통과해도, 답변이 필수 사실 상당수를 빼먹었으면 그 자체로 문제.
  //    2026-09-17 추가: BGE-M3 유사도는 문장을 통째로 비교해서 부분 누락에
  //    둔감하므로, 커버리지가 낮으면 다른 신호와 무관하게 항상 escalate.
  if (typeof signals.keywordCoverage === 'number'
    && signals.keywordCoverage < thresholds.keywordCoverageOmissionFloor) {
    reasons.push(`필수 사실 커버리지가 낮음(${(signals.keywordCoverage * 100).toFixed(0)}%) — 누락 의심`);
  }

  // 6) "숫자는 진짜인데 출처가 틀림" — 2026-09-17 실측으로 확인된 구멍.
  //    답변이 인용한(evidence_ids) 블록엔 없고 다른 블록에만 있는 숫자를
  //    썼다면, 사람이 봐도 숫자 자체는 진짜라 놓치기 쉬운 유형이라 항상
  //    재확인 큐에 올림(faithful 판정에도 이미 반영되지만 별도로도 표시).
  if (signals.hasWrongSourceNumber === true) {
    reasons.push('답변의 숫자가 인용한 근거가 아닌 다른 FAQ/정책에서 온 것으로 보임 — 출처 오매칭 의심');
  }

  // 7) CF(충돌) specific: evidence_ids references both conflicting sources,
  //    but the answer text commits to exactly one number — suspected silent
  //    resolution of an unresolvable conflict.
  if (signals.caseType === 'FAQ 충돌·시행일'
    && signals.evidenceIdsMatchExpected === true
    && signals.answerMentionsExactlyOneConflictingNumber === true) {
    reasons.push('evidence_ids는 양쪽 근거 다 포함하는데 답변은 숫자 하나만 확정 — 몰래 선택했을 가능성');
  }

  return { needsReview: reasons.length > 0, reasons };
}

module.exports = { evaluateEscalation, nliConfidenceMargin };
