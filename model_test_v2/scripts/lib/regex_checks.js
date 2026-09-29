'use strict';
// Deterministic, rule-based checks. These are the primary judge for numeric/
// condition accuracy (항목2 RAG충실도의 핵심) — calibration showed KLUE-NLI
// alone misses digit-swap hallucinations when a sentence bundles several
// numbers together, so this stays authoritative for numbers; NLI covers
// broader semantic grounding.

// 버그 수정(2026-09-16 리뷰): 예전엔 \d+(?:[.,]\d+)? 하나만 썼는데, 이러면
// "2026-01-01"이 "2026"/"01"/"01" 세 토큰으로 쪼개지고(하이픈 미포함이라
// 날짜를 못 통으로 못 잡음), "19,000원"과 "19000원"이 서로 다른 문자열로
// 취급돼서 표기만 다르고 값이 같은 숫자를 환각으로 오탐했음. 날짜 패턴을
// 먼저 통째로 잡고, 천단위 콤마는 정규화(제거)해서 비교하도록 고침.
const DATE_RE = /\d{4}-\d{1,2}-\d{1,2}/g;
const COMMA_NUMBER_RE = /\d{1,3}(?:,\d{3})+(?:\.\d+)?/g;
const PLAIN_NUMBER_RE = /\d+(?:\.\d+)?/g;
// 순서 중요: 날짜(하이픈 포함) -> 콤마 숫자 -> 일반 숫자. 앞에서 소비한
// 구간은 뒤 패턴이 다시 안 건드리도록 alternation 하나로 묶어서 스캔.
const NUMBER_RE = new RegExp(
  `${DATE_RE.source}|${COMMA_NUMBER_RE.source}|${PLAIN_NUMBER_RE.source}`,
  'g'
);
// Compound nouns like "새봄 요금제", "가람점", "데이터 쿠폰" — a light heuristic
// for the "고유명사" half of the original 숫자/고유명사 검증 지표. Approximate
// by design (see README note): catches named-entity-style hallucinations
// without a real NER model.
const PROPER_NOUN_RE = /[가-힣A-Za-z]+(?:요금제|정책|쿠폰|혜택|멤버십|매장|점)\b/g;

function normalizeNumberToken(token) {
  // 날짜(하이픈 포함)는 그대로, 나머진 천단위 콤마만 제거해서 "19,000"과
  // "19000"이 같은 값으로 비교되게 함.
  return token.includes('-') ? token : token.replace(/,/g, '');
}
function extractNumbers(text) {
  return Array.from((text || '').matchAll(NUMBER_RE)).map((m) => normalizeNumberToken(m[0]));
}
function extractProperNouns(text) {
  return Array.from((text || '').matchAll(PROPER_NOUN_RE)).map((m) => m[0]);
}

// Flags numbers/proper nouns present in `answerText` but absent from
// `sourceText` (the full "제공 Context" + "사용자 정보 / API 결과" the model
// was actually given) as hallucination candidates.
function verifyGrounded(answerText, sourceText) {
  const sourceNumbers = new Set(extractNumbers(sourceText));
  const sourceNouns = new Set(extractProperNouns(sourceText));

  const unverifiedNumbers = extractNumbers(answerText).filter((n) => !sourceNumbers.has(n));
  const unverifiedNouns = extractProperNouns(answerText).filter((n) => !sourceNouns.has(n));

  return {
    pass: unverifiedNumbers.length === 0 && unverifiedNouns.length === 0,
    unverifiedNumbers: [...new Set(unverifiedNumbers)],
    unverifiedNouns: [...new Set(unverifiedNouns)],
  };
}

// --- "숫자는 진짜인데 출처가 틀림" 탐지 (2026-09-17 추가) ------------------
// verifyGrounded()는 답변의 숫자가 "제공된 컨텍스트 전체 어딘가에" 있으면
// 통과시킨다. 근데 컨텍스트에 유사한 FAQ/요금제가 여러 개 같이 제공되는
// 경우(유사 FAQ 구분·노이즈 유형 등), 모델이 A 요금제를 물었는데 B
// 요금제의 진짜 숫자를 갖다붙여도 "그 숫자가 컨텍스트 어딘가엔 있으니"
// 통과해버린다 — 완전히 지어낸 숫자보다 더 위험함(숫자 자체는 진짜라 사람
// 눈으로도 놓치기 쉬움). 실측 확인: 새봄(19000원) 질문에 다온(31000원)
// 가격을 답하면 verifyGrounded는 pass:true를 줌.
//
// evidence_ids로 실제 인용한 블록만 골라서, "그 블록들에는 없지만 다른
// 블록에는 있는" 숫자를 답변이 썼는지 따로 잡는다. NLI 없이 순수 집합
// 연산이라 결정론적이고 빠름 — evidence_ids가 비어있으면(약한 모델이 잘
//안 채움) 판단 보류(scoped: null).
function verifyScopedToEvidence(answerText, citedBlocks, allBlocks) {
  if (!citedBlocks || citedBlocks.length === 0) {
    return { scoped: false, numbersFromWrongSource: [] };
  }
  const citedNumbers = new Set(citedBlocks.flatMap((b) => extractNumbers(b.raw)));
  const otherBlocks = allBlocks.filter((b) => !citedBlocks.includes(b));
  const otherNumbers = new Set(otherBlocks.flatMap((b) => extractNumbers(b.raw)));

  const answerNumbers = extractNumbers(answerText);
  // 인용 블록엔 없는데, 다른(인용 안 한) 블록에는 있는 숫자 — "숫자는
  // 진짜인데 엉뚱한 출처에서 가져온" 강력한 신호.
  const numbersFromWrongSource = answerNumbers.filter(
    (n) => !citedNumbers.has(n) && otherNumbers.has(n)
  );
  return { scoped: true, numbersFromWrongSource: [...new Set(numbersFromWrongSource)] };
}

// --- CF(FAQ 충돌·시행일) scoping rule -------------------------------------
// This dataset's synthetic conflict blocks use fixed phrasing:
//   - true conflict:  "적용 기간·버전·우선순위는 제공되지 않았습니다"
//   - date-scoped:    "적용 기간은 YYYY-MM-DD부터 YYYY-MM-DD까지입니다"
//   - target-scoped:  "적용 대상은 XXX만입니다" (vs. "개인 고객 전체" etc.)
// NLI, left to itself, calls all three CONTRADICTION (it can't reason about
// date/target scoping) — see calibration probe on SYN-D00A/B and
// SYN-T00A/B. This rule must run BEFORE trusting an NLI CONTRADICTION
// verdict on a CF-type case.

const NO_SCOPE_MARKER = '적용 기간·버전·우선순위는 제공되지 않았습니다';
const DATE_RANGE_RE = /적용 기간은\s*([\d-]+)\s*부터\s*([\d-]+)\s*까지/;
const TARGET_RE = /적용 대상은\s*([^.]+?)(?:만)?입니다/;

function classifyScopeConflict(blockAText, blockBText) {
  const aNoScope = blockAText.includes(NO_SCOPE_MARKER);
  const bNoScope = blockBText.includes(NO_SCOPE_MARKER);
  if (aNoScope && bNoScope) {
    return { resolvable: false, reason: '양쪽 다 시행일/대상 정보 없음 — 진짜 충돌' };
  }

  const aDate = blockAText.match(DATE_RANGE_RE);
  const bDate = blockBText.match(DATE_RANGE_RE);
  if (aDate && bDate && (aDate[1] !== bDate[1] || aDate[2] !== bDate[2])) {
    return { resolvable: true, reason: `시행일로 구분됨 (${aDate[1]}~${aDate[2]} vs ${bDate[1]}~${bDate[2]})` };
  }

  const aTarget = blockAText.match(TARGET_RE);
  const bTarget = blockBText.match(TARGET_RE);
  if (aTarget && bTarget && aTarget[1].trim() !== bTarget[1].trim()) {
    return { resolvable: true, reason: `적용 대상으로 구분됨 (${aTarget[1].trim()} vs ${bTarget[1].trim()})` };
  }

  // Couldn't confidently classify — fall back to NLI's verdict.
  return { resolvable: null, reason: '규칙으로 판별 불가 — NLI 판정에 위임' };
}

module.exports = {
  extractNumbers,
  extractProperNouns,
  verifyGrounded,
  verifyScopedToEvidence,
  classifyScopeConflict,
};
