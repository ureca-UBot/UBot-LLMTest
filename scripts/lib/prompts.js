'use strict';
// 상담봇(후보 LLM) 시스템 프롬프트 + 메시지 조립 — 공통 엔진(scripts/) 전용. v1~v3 스크립트는 각자
// 복사본을 갖고 있으므로 여기를 고쳐도 영향이 없다.
//
// 프롬프트 원문은 prompts/chatbot/*.md에 있고, 안(조합)은 prompts/chatbot/variants.json이 정한다.
// test.config.js의 prompt.variant로 안을 고른다. 쓰지 않는 안은 두지 않는다(과거 안은 git 이력과
// origin/prompttest-judge 브랜치에 있다).
//
// v4_base = base.md(공통 문단: v0 + test_set3 데이터셋 공통 프롬프트 통합) + status_rules.md(판정 기준:
// 고른 근거가 질문을 얼마나 덮는가) + output_order.md(evidence_ids → status → answer). 각 파일 머리의
// 설명 블록에 출처와 바꾼 이유가 있다.

const fs = require('fs');
const path = require('path');
const { PROMPTS_ROOT, readPromptFile } = require('./prompt_files');

const VARIANTS = JSON.parse(fs.readFileSync(path.join(PROMPTS_ROOT, 'chatbot', 'variants.json'), 'utf8'));

const SYSTEM_PROMPTS = Object.fromEntries(Object.entries(VARIANTS)
  .filter(([name]) => !name.startsWith('_'))
  .map(([name, files]) => [name, files.map((f) => readPromptFile(`chatbot/${f}`)).join('\n\n')]));

// variant를 지정하지 않을 때 쓰는 기준 프롬프트.
const DEFAULT_VARIANT = 'v4_base';

// 보고서에 실리는 안별 한 줄 설명.
const PROMPT_NOTES = {
  v4_base: { changed: '공통 문단(v0 + 데이터셋 공통 프롬프트) + 판정 기준(근거 기준) + 출력 순서 evidence_ids → status → answer', target: 'v4 기준선' },
};

// 공통 문단 — 이름으로 참조할 때 쓴다.
const SYSTEM_PROMPT = readPromptFile('chatbot/base.md');

const EMPTY_MARKERS = new Set(['', 'EMPTY', '없음']);

// 대화 이력 -> Ollama chat messages. 두 형식을 받는다.
//   - JSON 배열 [{role:'user'|'assistant', content}] (test_set3~)
//   - 줄 단위 텍스트 "사용자: ...\n상담봇: ..." (test_set2)
function parseHistoryTurns(historyText) {
  const text = (historyText || '').trim();
  if (EMPTY_MARKERS.has(text)) return [];
  if (text.startsWith('[')) {
    const turns = JSON.parse(text);
    if (!Array.isArray(turns)) throw new Error('대화 이력 JSON이 배열이 아닙니다.');
    return turns.map((t, i) => {
      if (!['user', 'assistant'].includes(t.role) || typeof t.content !== 'string') {
        throw new Error(`대화 이력 ${i + 1}번째 턴 형식 오류: ${JSON.stringify(t).slice(0, 80)}`);
      }
      return { role: t.role, content: t.content };
    });
  }
  const turns = [];
  for (const line of text.split('\n')) {
    const m = line.trim().match(/^(사용자|상담봇):\s*(.*)$/);
    if (m) turns.push({ role: m[1] === '사용자' ? 'user' : 'assistant', content: m[2] });
  }
  return turns;
}

function systemPromptFor(variant) {
  const systemPrompt = SYSTEM_PROMPTS[variant];
  if (!systemPrompt) {
    throw new Error('알 수 없는 prompt variant: ' + JSON.stringify(variant)
      + ' (가능: ' + Object.keys(SYSTEM_PROMPTS).join(', ') + ')');
  }
  return systemPrompt;
}

// testCase: lib/dataset.js의 정규화 객체 { question, context, history, userInfo, persona, ... }
// 페르소나 지시는 데이터셋 실행 안내대로 시스템 영역에 둔다(공통 프롬프트 뒤).
// 매 케이스가 새 대화로 시작한다 — 이전 케이스의 답변을 이력에 넣지 않는다.
function buildMessages(testCase, variant = DEFAULT_VARIANT) {
  let systemContent = systemPromptFor(variant);
  const persona = (testCase.persona || '').trim();
  if (persona) systemContent += `\n\n[추가 페르소나 지시]\n${persona}`;

  const messages = [{ role: 'system', content: systemContent }];
  messages.push(...parseHistoryTurns(testCase.history));

  const context = EMPTY_MARKERS.has((testCase.context || '').trim()) ? '(제공된 자료 없음)' : testCase.context;
  const userInfo = EMPTY_MARKERS.has((testCase.userInfo || '').trim()) ? '(없음)' : testCase.userInfo;

  const finalUser = [
    '[참고 자료]',
    context,
    '',
    '[사용자 정보 / API 결과]',
    userInfo,
    '',
    '[사용자 질문]',
    testCase.question,
  ].join('\n');

  messages.push({ role: 'user', content: finalUser });
  return messages;
}

// 상담봇 출력 계약의 status 목록 — 포맷 채점(lib/metrics.js)이 이걸 쓴다.
// CLARIFY는 v4에서 뺐다(데이터셋에 CLARIFY 기대가 없음 — 되묻기는 ABSTAIN/PARTIAL 안에서, Judge가 따로 센다).
const OUTPUT_STATUSES = ['ANSWER', 'PARTIAL', 'ABSTAIN', 'CONFLICT', 'OUT_OF_SCOPE'];

// Ollama 구조화 출력(format에 JSON 스키마)용 스키마. 생성 문법이 properties에 적은 순서대로 키를
// 강제한다 — 프롬프트 지시만으로는 gemma3:4b가 순서를 거의 지키지 않았다(스모크 20건 중 2건).
function outputSchema(keyOrder) {
  const props = {
    evidence_ids: { type: 'array', items: { type: 'string' } },
    status: { type: 'string', enum: OUTPUT_STATUSES },
    answer: { type: 'string' },
  };
  return { type: 'object', properties: Object.fromEntries(keyOrder.map((k) => [k, props[k]])), required: keyOrder };
}

module.exports = {
  SYSTEM_PROMPT, SYSTEM_PROMPTS, DEFAULT_VARIANT, PROMPT_NOTES, OUTPUT_STATUSES, outputSchema,
  buildMessages, parseHistoryTurns, systemPromptFor,
};
