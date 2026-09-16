'use strict';
// 항목6(명령 수행 능력/포맷 성공률)과 키워드 커버리지(항목1 보조지표).

const VALID_STATUSES = ['ANSWER', 'PARTIAL', 'CLARIFY', 'ABSTAIN', 'CONFLICT', 'OUT_OF_SCOPE'];

// Strips a ```json fenced block if the model wrapped its output in one
// despite the instruction not to (same defensive pattern as the test1 judge).
function stripCodeFence(text) {
  const m = (text || '').trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return m ? m[1] : text;
}

// Parses the model's raw content into {status, answer, evidence_ids} and
// reports whether it satisfies the format contract (항목6).
function checkFormatSuccess(rawContent) {
  const cleaned = stripCodeFence(rawContent);
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    return { pass: false, reason: `JSON 파싱 실패: ${e.message}`, parsed: null };
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { pass: false, reason: 'JSON 객체가 아님', parsed: null };
  }
  const keys = Object.keys(parsed);
  const requiredKeys = ['status', 'answer', 'evidence_ids'];
  const missing = requiredKeys.filter((k) => !(k in parsed));
  if (missing.length > 0) {
    return { pass: false, reason: `필수 키 누락: ${missing.join(', ')}`, parsed };
  }
  if (typeof parsed.status !== 'string' || !VALID_STATUSES.includes(parsed.status)) {
    return { pass: false, reason: `status 값이 enum 밖: ${parsed.status}`, parsed };
  }
  if (typeof parsed.answer !== 'string') {
    return { pass: false, reason: 'answer가 문자열이 아님', parsed };
  }
  // 버그 수정(2026-09-16 리뷰): answer가 빈 문자열이면 스키마상 "문자열"
  // 조건은 통과해버려서 포맷 실패로 안 잡혔었음. 어떤 status든 내용 없는
  // 답변은 실질적으로 실패이므로 여기서 명시적으로 막음.
  if (parsed.answer.trim().length === 0) {
    return { pass: false, reason: 'answer가 빈 문자열', parsed };
  }
  if (!Array.isArray(parsed.evidence_ids) || parsed.evidence_ids.some((x) => typeof x !== 'string')) {
    return { pass: false, reason: 'evidence_ids가 문자열 배열이 아님', parsed };
  }
  return { pass: true, reason: null, parsed };
}

// Keyword coverage: what fraction of the meaningful tokens in the reference
// text (필수 포함 사실 / 정답 예시) show up in the generated answer, via
// substring matching (조사 처리를 위해 형태소 분석기 대신 부분 문자열 매칭 사용
// — README 10-1절과 동일한 원칙).
function keywordCoverage(referenceText, answerText) {
  const ref = (referenceText || '').trim();
  const ans = (answerText || '');
  if (!ref) return { coverage: null, matched: [], missed: [] };

  // crude tokenization: strip particles/punctuation, split on whitespace,
  // drop very short tokens (mostly particles/copulas that survive splitting).
  const tokens = ref
    .replace(/[.,·!?()"']/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  if (tokens.length === 0) return { coverage: null, matched: [], missed: [] };

  const matched = tokens.filter((t) => ans.includes(t));
  const missed = tokens.filter((t) => !ans.includes(t));
  return { coverage: matched.length / tokens.length, matched, missed };
}

module.exports = { VALID_STATUSES, stripCodeFence, checkFormatSuccess, keywordCoverage };
