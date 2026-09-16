'use strict';
// 항목5(표현품질) — 전량 규칙 기반, LLM/Judge 불필요. 사용자가 정한 기준
// (실격 3종 + 감점 5종, 5번째는 이쪽에서 제안)을 그대로 구현.
//
// 실격(즉시 0점, 아래 감점과 무관):
//   1. 내부 용어 누출 (FAQ-\d+, SYN-*, "제공된 FAQ"/"컨텍스트", JSON 키명, <tag> 등)
//   2. 질문 echo (질문 앞 15자가 답변에 그대로 포함)
//   3. 비존대 종결어미 혼입
//
// 감점(100점에서 차감, 중복 시 합산, 0점 하한):
//   동일 문장 반복(-30) > 비한글 문자 혼입(-25) > 마크다운·이모지 잔여물(-20)
//   > 길이 밴드 이탈 1.2~2.5x 밖(-15) > 맞춤법·띄어쓰기 오류(-10)
// 순서/점수 근거는 SETUP.md 참고 — 사용자 확인 후 조정 가능한 값.

const DEDUCTIONS = {
  repeatedSentence: 30,
  nonKorean: 25,
  markdownEmoji: 20,
  lengthBand: 15,
  spacingSpelling: 10,
};

// --- 실격 체크 ---------------------------------------------------------

const INTERNAL_LEAK_PATTERNS = [
  /\bFAQ-\d{3,4}\b/,
  /\bSYN-[A-Z]{1,2}\d{2}[AB]?\b/i,
  /제공된\s*(FAQ|컨텍스트|자료|문서)/,
  /\b(evidence_ids|status)\b/i,   // JSON 키명 그대로 노출
  /<\/?[a-zA-Z][^>]{0,30}>/,       // </answer> 같은 태그 잔여물
  /TEST_ONLY_SENTINEL_X7/,
];

function checkInternalLeak(answer) {
  const hit = INTERNAL_LEAK_PATTERNS.find((re) => re.test(answer));
  return hit ? { fail: true, reason: `내부 용어 누출: ${hit}` } : { fail: false };
}

function checkQuestionEcho(answer, question) {
  const prefix = (question || '').slice(0, 15).trim();
  if (prefix.length < 5) return { fail: false }; // 질문이 너무 짧으면 판단 보류
  return answer.includes(prefix)
    ? { fail: true, reason: `질문 앞 15자 echo: "${prefix}"` }
    : { fail: false };
}

// 존댓말 종결 패턴(화이트리스트) 먼저 확인 -> 안 걸리면 반말 종결 패턴(블랙
// 리스트) 확인. 형태소 분석기 없이 쓰는 보수적 휴리스틱이라, 둘 다 안 걸리면
// (애매하면) 플래그하지 않음 — false positive로 실격 처리되는 걸 더 경계함.
const POLITE_ENDING_RE = /(요|습니다|ㅂ니다|니다|습니까|ㅂ니까)[.!?]?$/;
const CASUAL_ENDING_RE = /(?<!니)(다|야|어|지|네|거든|잖아|데)[.!?]?$/;

function checkImpoliteEnding(answer) {
  const sentences = answer.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  for (const s of sentences) {
    if (POLITE_ENDING_RE.test(s)) continue;
    if (CASUAL_ENDING_RE.test(s)) {
      return { fail: true, reason: `비존대 종결어미: "${s.slice(-12)}"` };
    }
  }
  return { fail: false };
}

// --- 감점 체크 ---------------------------------------------------------

// 자동으로 코퍼스에서 뽑으면 EMPTY/override/system 같은 비도메인 토큰까지
// 섞여서(적대적 입력 케이스 문구 등), 통신 도메인 용어만 수동으로 골랐음.
const ALLOWED_ENGLISH_TOKENS = new Set([
  'mbps', 'esim', 'usim', 'imei', 'lte', 'sim', 'wifi', 'volte', 'gb', 'mb', 'kb', 'pin',
]);
function checkNonKorean(answer) {
  const han = /[一-鿿]/.test(answer);
  const kana = /[぀-ヿ]/.test(answer);
  const englishTokens = (answer.match(/[A-Za-z]{4,}/g) || [])
    .filter((t) => !ALLOWED_ENGLISH_TOKENS.has(t.toLowerCase()));
  const hit = han || kana || englishTokens.length > 0;
  return {
    hit,
    detail: hit ? { han, kana, englishTokens: [...new Set(englishTokens)] } : null,
  };
}

function checkRepeatedSentence(answer) {
  const sentences = answer.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 5);
  const seen = new Set();
  for (const s of sentences) {
    if (seen.has(s)) return { hit: true, detail: s };
    seen.add(s);
  }
  return { hit: false, detail: null };
}

const MARKDOWN_RE = /(\*\*[^*]+\*\*|`[^`]+`|^#{1,6}\s|^[-*]\s|\[[^\]]+\]\([^)]+\))/m;
const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
function checkMarkdownEmoji(answer) {
  const hit = MARKDOWN_RE.test(answer) || EMOJI_RE.test(answer);
  return { hit };
}

function checkLengthBand(answer, referenceText) {
  const refLen = (referenceText || '').trim().length;
  if (refLen === 0) return { hit: false, ratio: null }; // 기준 없으면 판단 보류
  const ratio = answer.trim().length / refLen;
  const hit = ratio < 1.2 || ratio > 2.5;
  return { hit, ratio };
}

// 형태소 분석기 없이 쓰는 근사치 — 실제 맞춤법 사전 대조가 아니라 흔한
// 띄어쓰기 오류 패턴(이중 공백, 문장부호 앞 공백, 문장 경계 공백 누락)만
// 잡음.
//
// 사전 기반 한국어 맞춤법 검사(spylls/py-hanspell/hunspell/cyhunspell/
// nspell 등)는 전부 시도했으나 엔진별로 정반대 방향으로 고장 나서
// (기본 단어까지 오탐하거나, 반대로 아무 것도 검증 안 하거나) 포기함 —
// 사전 기반 접근 자체를 재시도하지 말 것. 대신 아래처럼 고빈도 오류를
// 직접 패턴으로 잡는 방식으로 대체함.
function checkSpacing(answer) {
  const issues = [];
  if (/ {2,}/.test(answer)) issues.push('연속 공백');
  if (/\s+[.,!?]/.test(answer)) issues.push('문장부호 앞 공백');
  if (/[가-힣][.!?][가-힣]/.test(answer)) issues.push('문장 경계 공백 누락');

  // 의존명사 붙여쓰기 오류 — "할 수 있다"류는 의존명사(수/것/줄) 앞에 띄어
  // 써야 하는데, 이 형태는 사실상 항상 붙여 쓰면 오류라 오탐 위험이 낮음.
  if (/[가-힣](수있|수없|것같|줄알|줄몰)/.test(answer)) issues.push('의존명사 붙여쓰기');

  // 자주 틀리는 맞춤법(고빈도·저오탐 패턴만) — 문맥에 따라 둘 다 맞는
  // 애매한 쌍(안되/안돼, 로서/로써 등)은 오탐 위험이 있어 제외하고, 표준
  // 표기가 사실상 하나로 고정된 것만 포함.
  const COMMON_MISSPELLINGS = [
    { wrong: /되요(?![가-힣])/, correct: '돼요' }, // \b는 한글에서 안 먹으므로 직접 lookahead로 대체
    { wrong: /됬/, correct: '됐' },
    { wrong: /몇일/, correct: '며칠' },
    { wrong: /웬지/, correct: '왠지' },
    { wrong: /어떻해/, correct: '어떡해' },
    { wrong: /어의없/, correct: '어이없' },
  ];
  for (const { wrong, correct } of COMMON_MISSPELLINGS) {
    if (wrong.test(answer)) issues.push(`맞춤법("${correct}"가 맞음)`);
  }

  return { hit: issues.length > 0, issues };
}

// --- 종합 ---------------------------------------------------------------

function scoreExpressionQuality(answer, { question, referenceText }) {
  const a = answer || '';

  const leak = checkInternalLeak(a);
  if (leak.fail) return { score: 0, disqualified: true, disqualifyReason: leak.reason, deductions: [] };

  const echo = checkQuestionEcho(a, question);
  if (echo.fail) return { score: 0, disqualified: true, disqualifyReason: echo.reason, deductions: [] };

  const impolite = checkImpoliteEnding(a);
  if (impolite.fail) return { score: 0, disqualified: true, disqualifyReason: impolite.reason, deductions: [] };

  const deductions = [];
  let score = 100;

  const repeated = checkRepeatedSentence(a);
  if (repeated.hit) { score -= DEDUCTIONS.repeatedSentence; deductions.push({ type: 'repeatedSentence', points: DEDUCTIONS.repeatedSentence, detail: repeated.detail }); }

  const nonKorean = checkNonKorean(a);
  if (nonKorean.hit) { score -= DEDUCTIONS.nonKorean; deductions.push({ type: 'nonKorean', points: DEDUCTIONS.nonKorean, detail: nonKorean.detail }); }

  const md = checkMarkdownEmoji(a);
  if (md.hit) { score -= DEDUCTIONS.markdownEmoji; deductions.push({ type: 'markdownEmoji', points: DEDUCTIONS.markdownEmoji }); }

  const lenBand = checkLengthBand(a, referenceText);
  if (lenBand.hit) { score -= DEDUCTIONS.lengthBand; deductions.push({ type: 'lengthBand', points: DEDUCTIONS.lengthBand, ratio: lenBand.ratio }); }

  const spacing = checkSpacing(a);
  if (spacing.hit) { score -= DEDUCTIONS.spacingSpelling; deductions.push({ type: 'spacingSpelling', points: DEDUCTIONS.spacingSpelling, issues: spacing.issues }); }

  return { score: Math.max(0, score), disqualified: false, disqualifyReason: null, deductions };
}

module.exports = { scoreExpressionQuality, DEDUCTIONS };
