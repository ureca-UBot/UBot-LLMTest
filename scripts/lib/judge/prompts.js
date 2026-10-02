'use strict';
// LLM Judge 루브릭(시스템 프롬프트)과 채점 입력 조립.
//   accuracy  정확도 · 근거(할루시네이션) · 본문 행동·출처 — 전 행
//   safety    적대적 입력 대응 — config.safetyItems 행
//   persona   페르소나 준수 — 추가 페르소나 지시가 있는 행
// 기반: model_test_v3 LLM Judge 루브릭(test3-saved-v1, try1/results/llm_judge/evaluator).
// 바뀐 점: 데이터셋 실행 안내의 기대 상태 정의·실패 조건·시행일 규칙을 채점 기준으로 넣고,
// 페르소나 표현 기준은 정확도가 아니라 persona 채점으로 분리했다.
// 루브릭 문구를 바꾸면 RUBRIC_VERSION을 올린다(이전 배치 결과와 섞이지 않게).

// v4-judge-2: 본문 행동(content_stance)과 본문 실제 출처(content_sources) 판정 추가.
// v4-judge-3: 정확도 Judge는 answer 본문만 본다(status·evidence_ids를 입력에서 뺌). 상태 적절성·
//             라벨-본문 일치·인용 유효성 필드를 없애고, 라벨과의 비교는 judge_report.js가 코드로 한다.
// v4-judge-4: CLARIFY를 본문 행동에서 빼고(되묻기는 ABSTAIN/PARTIAL), 되묻기 여부(asks_user)를 따로 판정.
// v4-judge-5: 상태 정의·평가 축 중복을 통합하고 상황별 지침을 압축. reasoning은 한국어 1~2문장 요약.
//             판정 기준·출력 필드는 유지하며 상세 누락·모순·환각은 각 배열에 모두 기록한다.
// v4-judge-6: 전수 accuracy Judge의 표현 품질 채점을 제외. 표현 규칙·별도 persona 판정은 유지.
// v4-judge-7: safety 판정의 [시스템 프롬프트] 참고 자료를 상담봇 프롬프트 전체(base+status_rules+
//             output_order) 대신 base.md만 준다. status_rules·output_order는 상태 판정 절차·출력
//             순서 설명이라 안전성(주입 순응·내부정보 유출·조작된 완료·타인 PII·과잉 거부) 판정과
//             무관하다 — 실제 위반 기준은 모두 base.md에 있다.
// v4-judge-8: safety.md의 NOT_APPLICABLE·null 조건 설명 3문장을 1문장으로 합쳤다(판정 기준·출력
//             필드는 그대로). common_guard.md 재사용은 시도했으나 날짜 교정 금지 등 safety와
//             무관한 문구가 섞여 더 길어져서 보류 — safety 전용 가드 문단을 그대로 둔다.
// v4-judge-9: content_stance에서 CONFLICT를 빼고 ABSTAIN 정의에 합쳤다(2026-10-02, schema.js v4-schema-6과
//             짝). test3 재채점 전 확인: status가 정확도 판정에 섞여 있던 test3에서, "핵심 답을 확정하지
//             않는다"는 점에서 같은 수준인 상태끼리(ABSTAIN·CLARIFY·CONFLICT·OUT_OF_SCOPE) 라벨만 다르고
//             내용은 맞는 경우가 대거 오답으로 잡혔다. v4는 애초에 라벨을 Judge에 안 주니 이 문제가
//             재발하지 않지만, 상태 가짓수 자체를 모델이 실제로 구분해 행동할 수 있는 수준으로 줄인다.
//             라벨 기준 "정답+상태" 집계에서 ANSWER↔PARTIAL, ABSTAIN↔OUT_OF_SCOPE 교차를 정답으로 보되
//             건수는 따로 집계하는 건 Judge 루브릭이 아니라 judge_report.js의 데이터 정리 로직이다.
// v4-judge-10: CONFLICT를 같은 날 다시 넣었다(schema.js v4-schema-7과 짝) — test3에서 모델이 CONFLICT를
//              출력한 55건의 정밀도 47%·재현율 51%를 확인했지만, "FAQ끼리 모순"과 "자료 없음"을 구분할
//              실익이 있다고 판단해 정의를 좁혀(시행일·우선순위로 해결되면 ANSWER) 유지한다. 라벨 기준
//              "정답+상태" 집계에서 기대 OUT_OF_SCOPE·CONFLICT인데 ABSTAIN으로 덜 확정한 경우만 정답으로
//              보고(반대 방향은 아님), 건수는 judge_report.js가 조합별로 따로 집계한다.
// v4-judge-11: accuracy 입력에서 [필수 사실·표현 기준]을 뺐다(prompts.js buildUserText). test_set3를
//              확인해보니 PS(페르소나 지시 있는 200행)를 빼면 이 필드는 정답 예시에 번호만 붙인
//              것과 글자 그대로 같았다(2,597/2,600행). 같은 내용을 번호 매긴 체크리스트로 한 번 더
//              주니 Judge가 "항목 하나하나 다 있어야 CORRECT"로 기울기 쉬웠다(복합 문항에서 특히).
//              정확도는 이제 [정답 예시]와 의미를 비교해서만 판단한다. 표현 기준(PS 톤 지시)은
//              accuracy와 무관하므로 persona 입력에만 남긴다. missing_required_facts·contradicted_facts
//              필드명은 그대로 두되(스키마 변경 없음), 비교 대상이 체크리스트가 아니라 정답 예시 전체다.
// v4-judge-12: 환각을 5종으로 분류했다(schema.js v4-schema-8과 짝) — FABRICATION(순수 창작)·
//              FALSE_COMPLETION(완료 조작)·MISATTRIBUTION(대상·시점 오귀속)·UNSUPPORTED_GENERALIZATION
//              (근거 없는 일반화)·SILENT_CONFLICT_PICK(조용한 충돌 해소, 기존 별도 불리언을 흡수).
//              grounding_score(심각도)는 그대로 두고 type(종류)을 각 claim에 추가해 자유 텍스트 reason에
//              묻혀 있던 것을 집계 가능하게 했다. FALSE_COMPLETION은 persona violations에서도 뺐다 —
//              페르소나 지시 있는 행(PS 200건)에서만 보던 걸 전 행(accuracy Judge)에서 보게 해 AR 등
//              나머지 2,800건의 사각지대를 없앴다.
const RUBRIC_VERSION = 'v4-judge-12';

// 루브릭 원문은 prompts/judge/*.md에 있다(판정 단계 전용 — 문서 생성 프롬프트 prompts/docgen과 섞지 않는다).
// 파일을 고치면 위 RUBRIC_VERSION을 올리고 새 배치 ID로 준비한다(배치 매니페스트가 루브릭 해시를 기록한다).
const { readPromptFile } = require('../prompt_files');
// safety 판정용 상담봇 규칙 참고 자료 — 상담봇이 실제로 받는 전체 프롬프트(lib/prompts.js의
// SYSTEM_PROMPT, variant 조합과 무관하게 base.md만)가 아니라 안전성 관련 규칙만 담은 base.md다.
const { SYSTEM_PROMPT: CANDIDATE_BASE_PROMPT } = require('../prompts');

const SYSTEM_PROMPTS = Object.fromEntries(['accuracy', 'safety', 'persona'].map((k) => [k, readPromptFile(`judge/${k}.md`)]));


function orNone(v, none = '(없음)') {
  const s = (v || '').trim();
  return s ? s : none;
}

// 대화 이력·사용자 정보는 데이터셋에 들여쓰기된 JSON으로 저장돼 있다. 의미는 같으니
// Judge에 보내기 전에 공백을 접어 토큰을 줄인다(파싱 실패 시 원문 그대로 둔다).
function minifyJson(v) {
  const s = (v || '').trim();
  if (!s) return v;
  try { return JSON.stringify(JSON.parse(s)); } catch { return v; }
}

function responseBlock(generation) {
  if (generation.parsed && typeof generation.parsed.answer === 'string') {
    return '[상담봇 응답]\n' + JSON.stringify({
      status: generation.parsed.status ?? null,
      answer: generation.parsed.answer,
      evidence_ids: generation.parsed.evidence_ids ?? null,
    });
  }
  // 파싱 불가·누락 응답도 분모와 입력에 남긴다(시험하지 않은 것처럼 빼지 않는다).
  return '[상담봇 응답 — 파싱 불가 또는 답변 누락]\n' + JSON.stringify({
    parsed: generation.parsed ?? null,
    raw_content: generation.raw_content ?? '',
    generation_error: generation.error ?? null,
    format_fail_reason: generation.format_fail_reason ?? null,
  });
}

// c: 정규화 케이스(lib/dataset.js), generation: generation.jsonl 레코드
function buildUserText(kind, c, generation) {
  const parts = [
    `[사용자 질문]\n${c.question}`,
    `[대화 이력]\n${orNone(minifyJson(c.history))}`,
    `[제공 Context]\n${orNone(c.context, '(제공된 자료 없음)')}`,
    `[사용자 정보 / API 결과]\n${orNone(minifyJson(c.userInfo))}`,
  ];
  if (kind === 'accuracy') {
    // 필수 사실·표현 기준은 안 보낸다(2026-10-02) — 일반 항목(PS 제외)에서 정답 예시를 숫자만 붙여
    // 그대로 복사한 체크리스트라 정보가 겹치고, 번호 매긴 형태가 Judge를 "항목 하나하나 다 있어야
    // CORRECT"로 유도하는 경향이 있었다. 정확도는 정답 예시(의미 비교)만으로 판단한다. 표현 기준
    // (PS의 톤 지시)은 persona Judge 전용이라 그쪽 입력에만 남긴다.
    parts.push(`[정답 예시]\n${c.referenceAnswer}`);
    parts.push(`[실패 조건]\n${orNone(c.failCondition)}`);
    parts.push(`[기대 상태]\n${c.expectedStatus}`);
  } else if (kind === 'safety') {
    parts.push(`[시스템 프롬프트]\n${CANDIDATE_BASE_PROMPT}`);
  } else if (kind === 'persona') {
    parts.push(`[추가 페르소나 지시]\n${orNone(c.persona)}`);
    parts.push(`[페르소나 하위 항목]\n${orNone(c.personaSub)}`);
    parts.push(`[필수 사실·표현 기준]\n${c.requiredFacts}`);
    parts.push(`[실패 조건]\n${orNone(c.failCondition)}`);
  } else {
    throw new Error(`알 수 없는 Judge 종류: ${kind}`);
  }
  parts.push(kind === 'accuracy' ? answerOnlyBlock(generation) : responseBlock(generation));
  return parts.join('\n\n');
}

// 정확도 Judge용: 라벨(status·evidence_ids) 없이 본문만. 형식이 깨져 본문을 분리할 수 없을 때만
// 원본 출력을 준다(루브릭이 라벨을 판정에 쓰지 말라고 지시).
function answerOnlyBlock(generation) {
  if (generation.parsed && typeof generation.parsed.answer === 'string') {
    return `[상담봇 답변 본문]\n${generation.parsed.answer}`;
  }
  return '[상담봇 원본 출력 — 형식 오류로 본문 분리 불가]\n' + JSON.stringify({
    raw_content: generation.raw_content ?? '',
    generation_error: generation.error ?? null,
  });
}

module.exports = { RUBRIC_VERSION, SYSTEM_PROMPTS, buildUserText };
