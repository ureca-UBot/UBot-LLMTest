'use strict';
// prompts_test_v5 — 상담봇 프롬프트 튜닝 5차(Instruct 2차). 대상은 qwen3:4b-instruct(Q4_K_M) 하나, 이 PC(로컬)에서 생성한다.
// prompts_test_v4와 다른 점: 데이터셋이 test_set4r(사람 검토 반영 수정본 — AR·UI 조회 결과 문장화, FAQ 3건·정답 예시 정리,
// AR·UI 질문 다시 쓰기, CF 문서 A/B 제거)이다. 비교 방식은 prompts_test_v4와 같다 — 새 안(v5_i2)만 생성하고 기준선은
// v5 try1의 v4_base(test_set4)를 --base-from으로 가져온다. 데이터가 달라 짝 비교가 온전한 문항은 일부다(SETUP 4절).
// 실행할 때는 --test prompts_test_v5 를 준다. 계획·실행 순서는 SETUP.md 참고.

const base = require('../model_test_v5/test.config.js');

module.exports = {
  ...base,
  version: 'pv5',
  title: '프롬프트 튜닝 5차 — qwen3:4b-instruct Q4_K_M, test_set4r, v5_i2 (로컬) · 기준 v5 try1 v4_base',
  defaultTry: 'try1',
  dataset: {
    ...base.dataset,
    name: 'test_set4r',
    // xlsx에서 만들지 않는다 — prepare_dataset.js는 derivedBy가 있으면 멈춘다.
    derivedBy: 'scripts/run/build_test_set4r.js',
    casesPath: 'data/eval_sets/test_set4r/cases_fixed.csv',
    faqPath: 'data/eval_sets/test_set4r/faq_master.csv',
  },
  prompt: { variant: 'v4_base' },
  // digest 0edcdef34593 = qwen3:4b-instruct-2507-q4_K_M (prompts_test_v4와 같음).
  models: [{ tag: 'qwen3:4b-instruct', thinkCapable: false, runByDefault: true }],
  pipeline: { ...base.pipeline, skip: ['score_answer_similarity', 'score_rag_grounding', 'score_repeat_consistency'] },
};
