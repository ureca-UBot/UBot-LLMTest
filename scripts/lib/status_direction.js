'use strict';
// 상태 방향 판정: 응답이 기대보다 더 확정했는가(과대), 덜 확정했는가(과소), 같은 수준의
// 다른 상태인가(교차). 라벨(status)과 본문(Judge의 content_stance)에 똑같이 적용한다.
//
// 확정 수준 서열: ANSWER 3 > PARTIAL 2 > ABSTAIN·OUT_OF_SCOPE·CONFLICT 1 (CLARIFY는 v4에 없음 — v2·v3 데이터 호환용으로 수준 1에 남겨 둠)
//   - CONFLICT가 기대인데 한쪽을 골라 확정(ANSWER·PARTIAL) → 과대
//   - 가릴 수 있는 차이인데(기대 ANSWER·PARTIAL) CONFLICT로 고지 → 과소
//   - 수준 1끼리의 차이(ABSTAIN↔OUT_OF_SCOPE↔CONFLICT) → 교차(상태 정의의 경계 문제)

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
