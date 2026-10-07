'use strict';
// 포맷 계약 검사와 키워드 커버리지. 둘 다 결정론적 계산이며 통과 임계값은 두지
// 않는다(README 4-9절) — 포맷은 계약 위반 여부 자체가 측정값이다.

const { OUTPUT_STATUSES } = require('./prompts');

// Strips a ```json fenced block if the model wrapped its output in one
// despite the instruction not to.
function stripCodeFence(text) {
  const m = (text || '').trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return m ? m[1] : text;
}

// Parses the model's raw content into {status, answer, evidence_ids} and
// reports whether it satisfies the output contract.
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
  const missing = ['status', 'answer', 'evidence_ids'].filter((k) => !(k in parsed));
  if (missing.length > 0) {
    return { pass: false, reason: `필수 키 누락: ${missing.join(', ')}`, parsed };
  }
  if (typeof parsed.status !== 'string' || !OUTPUT_STATUSES.includes(parsed.status)) {
    return { pass: false, reason: `status 값이 enum 밖: ${parsed.status}`, parsed };
  }
  if (typeof parsed.answer !== 'string') {
    return { pass: false, reason: 'answer가 문자열이 아님', parsed };
  }
  if (parsed.answer.trim().length === 0) {
    return { pass: false, reason: 'answer가 빈 문자열', parsed };
  }
  if (!Array.isArray(parsed.evidence_ids) || parsed.evidence_ids.some((x) => typeof x !== 'string')) {
    return { pass: false, reason: 'evidence_ids가 문자열 배열이 아님', parsed };
  }
  return { pass: true, reason: null, parsed };
}

// 원본 출력에서 최상위 키가 나온 순서. JSON.parse는 순서를 보존하지만 중첩 객체와 섞이지 않도록
// 파싱된 최상위 키만 원문 위치 순으로 정렬한다.
function topLevelKeyOrder(rawContent, parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  const text = stripCodeFence(rawContent || '');
  return Object.keys(parsed)
    .map((k) => ({ k, at: text.indexOf(JSON.stringify(k)) }))
    .filter((x) => x.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map((x) => x.k);
}

// 필수 사실 목록에서 번호("1. 사실 문장")와 줄 머리 꼬리표를 떼어낸다. test_set4는 번호 대신
// "참고 사실·조건 (체크리스트 강제 채점 아님): …"·"표현 기준: …" 꼬리표를 붙인다 — 꼬리표 단어가
// 키워드로 잡혀 포함률이 낮아지지 않도록 뺀다.
const FACT_LABEL_RE = /^\s*(?:참고 사실·조건\s*(?:\([^)]*\))?|표현 기준)\s*:\s*/;
function stripEnumeration(text) {
  return (text || '').split('\n')
    .map((line) => line.replace(/^\s*\d+[.)]\s*/, '').replace(FACT_LABEL_RE, ''))
    .join('\n');
}

// 필수 사실의 의미 있는 토큰(2자 이상) 중 답변에 부분 문자열로 들어 있는 비율.
// 형태소 분석기 없이 조사까지 붙은 토큰을 그대로 매칭하므로 패러프레이즈는 놓친다 —
// 정확도 판단은 LLM Judge 몫이고 이 값은 참고 측정값이다.
function keywordCoverage(referenceText, answerText) {
  const ref = stripEnumeration(referenceText).trim();
  const ans = answerText || '';
  if (!ref) return { coverage: null, matched: [], missed: [] };
  const tokens = ref
    .replace(/[.,·!?()"'~:;]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  if (tokens.length === 0) return { coverage: null, matched: [], missed: [] };
  const matched = tokens.filter((t) => ans.includes(t));
  const missed = tokens.filter((t) => !ans.includes(t));
  return { coverage: matched.length / tokens.length, matched, missed };
}

module.exports = { stripCodeFence, checkFormatSuccess, keywordCoverage, stripEnumeration, topLevelKeyOrder };
