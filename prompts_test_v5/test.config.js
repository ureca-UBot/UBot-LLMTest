'use strict';
// prompts_test_v5 — 상담봇 프롬프트 튜닝 5차(Instruct 2차). 대상은 qwen3:4b-instruct(Q4_K_M) 하나, 이 PC(로컬)에서 생성한다.
// prompts_test_v4와 다른 점: 데이터셋이 test_set4r(사람 검토 반영 수정본 — AR·UI 조회 결과 문장화, FAQ 3건·정답 예시 정리,
// AR·UI 질문 다시 쓰기, CF 문서 A/B 제거)이다. try2에서는 v4_base와 수정한 v5_i2를 같은 모델·같은 데이터·같은 PC로
// 각각 1,100건 생성하고 두 run을 배치 pv5-try2로 묶어 Judge한다(SETUP 4·6절).
// 실행할 때는 --test prompts_test_v5 를 준다. 계획·실행 순서는 SETUP.md 참고.

const base = require('../model_test_v5/test.config.js');

module.exports = {
  ...base,
  version: 'pv5',
  title: '프롬프트 튜닝 5차 — qwen3:4b-instruct Q4_K_M, test_set4r, v4_base·v5_i2 (같은 로컬)',
  defaultTry: 'try2',
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
