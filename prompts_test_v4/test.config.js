'use strict';
// prompts_test_v4 — 상담봇 프롬프트 튜닝 4차(Instruct 1차). 데이터·항목 정의·생성 조건·Judge는 model_test_v5와 같고,
// 대상 모델을 qwen3:4b-instruct(Q4_K_M) 하나로 두고 이 PC(로컬)에서 v4_base와 v5_i1을 같은 문항으로 생성한다.
// 실행할 때는 --test prompts_test_v4 를 준다. 프롬프트 안은 --variant로 고른다(prompts/chatbot/variants.json).
// 계획·실행 순서는 SETUP.md 참고.

const base = require('../model_test_v5/test.config.js');

module.exports = {
  ...base,
  version: 'pv4',
  title: '프롬프트 튜닝 4차 — qwen3:4b-instruct Q4_K_M, v4_base 대비 v5_i1 (로컬)',
  defaultTry: 'try1',
  // 기본 안은 v4 기준선과 같다. --variant v5_i1로 바꾸면 run_id에 안 이름이 붙는다.
  prompt: { variant: 'v4_base' },
  // v5에서는 Q4_K_M을 가져온 run으로만 썼기 때문에 runByDefault=false였다. 여기서는 이 모델만 생성한다.
  // digest 0edcdef34593 = qwen3:4b-instruct-2507-q4_K_M (2026-10-12 이 PC에서 ollama pull로 확인, EC2와 같음).
  models: [{ tag: 'qwen3:4b-instruct', thinkCapable: false, runByDefault: true }],
  // prompts_test_v1~v3와 같은 이유로 건너뛴다 — 정확도·근거는 Judge로 보고, NLI는 느리며 Judge 환각과 겹치고,
  // 반복 일관성은 RT 항목이 없어 대상이 없다.
  pipeline: { ...base.pipeline, skip: ['score_answer_similarity', 'score_rag_grounding', 'score_repeat_consistency'] },
};
