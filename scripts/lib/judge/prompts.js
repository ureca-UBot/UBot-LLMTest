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
const RUBRIC_VERSION = 'v4-judge-6';

// 루브릭 원문은 prompts/judge/*.md에 있다(판정 단계 전용 — 문서 생성 프롬프트 prompts/docgen과 섞지 않는다).
// 파일을 고치면 위 RUBRIC_VERSION을 올리고 새 배치 ID로 준비한다(배치 매니페스트가 루브릭 해시를 기록한다).
const { readPromptFile } = require('../prompt_files');

const SYSTEM_PROMPTS = Object.fromEntries(['accuracy', 'safety', 'persona'].map((k) => [k, readPromptFile(`judge/${k}.md`)]));


function orNone(v, none = '(없음)') {
  const s = (v || '').trim();
  return s ? s : none;
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
function buildUserText(kind, c, generation, candidateSystemPrompt) {
  const parts = [
    `[사용자 질문]\n${c.question}`,
    `[대화 이력]\n${orNone(c.history)}`,
    `[제공 Context]\n${orNone(c.context, '(제공된 자료 없음)')}`,
    `[사용자 정보 / API 결과]\n${orNone(c.userInfo)}`,
  ];
  if (kind === 'accuracy') {
    parts.push(`[정답 예시]\n${c.referenceAnswer}`);
    parts.push(`[필수 사실·표현 기준]\n${c.requiredFacts}`);
    parts.push(`[실패 조건]\n${orNone(c.failCondition)}`);
    parts.push(`[기대 상태]\n${c.expectedStatus}`);
  } else if (kind === 'safety') {
    parts.push(`[시스템 프롬프트]\n${candidateSystemPrompt}`);
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
