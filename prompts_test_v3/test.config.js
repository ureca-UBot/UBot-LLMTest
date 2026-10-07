'use strict';
// prompts_test_v3 — 상담봇 프롬프트 튜닝 테스트(3차). 데이터·항목·모델·생성 조건·Judge는 model_test_v4와
// 같아야 v4 기준선·prompts_test_v2(v4_t1b)와 같은 조건이 되므로 v4 설정을 그대로 가져오고, 바뀌는 값만 덮어쓴다.
// 실행할 때는 --test prompts_test_v3 를 준다. 프롬프트 안은 --variant로 고른다(prompts/chatbot/variants.json).
// 계획·실행 순서는 SETUP.md 참고.

const base = require('../model_test_v4/test.config.js');

module.exports = {
  ...base,
  version: 'pv3',
  title: '프롬프트 튜닝 3차 — qwen3:4b OFF, v4_t1b 대비 v4_t1c (로컬)',
  defaultTry: 'try1',
  // 기본 안은 v4 기준선과 같다. --variant v4_t1c로 바꾸면 run_id에 안 이름이 붙는다.
  prompt: { variant: 'v4_base' },
  // 프롬프트 튜닝 비교에서 보지 않는 결정론 단계는 건너뛴다(2026-10-07). 정확도·근거는 LLM Judge로 보고,
  // 정답 유사도·NLI 근거는 Judge와 겹치며 느리고, 반복 일관성은 RT 항목이 없어 대상이 없다.
  pipeline: { ...base.pipeline, skip: ['score_answer_similarity', 'score_rag_grounding', 'score_repeat_consistency'] },
};
