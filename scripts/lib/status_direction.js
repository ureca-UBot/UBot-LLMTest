'use strict';
// 상태 방향 판정: 응답이 기대보다 더 확정했는가(과대), 덜 확정했는가(과소), 같은 수준의
// 다른 상태인가(교차). 라벨(status)과 본문(Judge의 content_stance)에 똑같이 적용한다.
//
// 확정 수준 서열(v4, 2026-10-02): ANSWER 3 > PARTIAL 2 > ABSTAIN·OUT_OF_SCOPE·CONFLICT 1.
// CLARIFY는 v4 출력 계약·content_stance에 없다 — v2·v3 데이터(재채점 포함) 호환용으로만 수준 1에 남겨 둔다.
// CONFLICT는 수준 1의 정식 v4 상태다(ABSTAIN에 합쳤다가 같은 날 다시 분리 — "FAQ끼리 모순"과 "자료 없음"을
// 구분할 실익이 있다고 판단).
//   - 수준 1끼리의 차이(ABSTAIN↔OUT_OF_SCOPE↔CONFLICT, 레거시 데이터는 ↔CLARIFY도) → 교차(상태 정의의 경계 문제)
//   - ANSWER↔PARTIAL 간 차이 → 과대/과소
// "교차·과대/과소지만 설계상 동등하게 볼 수 있는 조합을 정답으로도 집계"하는 건 이 모듈이 아니라
// judge_report.js의 데이터 정리 로직(FORGIVABLE_STATUS_PAIRS)이 맡는다 — 여기 direction()은
// 진단용 방향 분류만 하고 바꾸지 않는다.

const RANK = { ANSWER: 3, PARTIAL: 2, CLARIFY: 1, ABSTAIN: 1, OUT_OF_SCOPE: 1, CONFLICT: 1 };
const DIRECTIONS = ['MATCH', 'OVER', 'UNDER', 'CROSS', 'NONE'];

function direction(expected, actual) {
  if (!actual || !(actual in RANK)) return 'NONE';
  if (actual === expected) return 'MATCH';
  const e = RANK[expected], a = RANK[actual];
  if (a > e) return 'OVER';
  if (a < e) return 'UNDER';
  return 'CROSS';
}

module.exports = { RANK, DIRECTIONS, direction };
