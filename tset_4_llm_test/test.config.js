'use strict';
// tset_4_llm_test — LLM Judge 성능을 사람이 직접 평가하기 위한 소규모 실행(2026-10-06).
// test4(model_test_v4/test.config.js) 설정을 그대로 상속한다 — 항목·모델·조건·프롬프트·생성 설정·
// 평가 기준·Judge(provider·model·reasoning effort)는 v4와 같다. 바꾸는 것은 아래 세 가지뿐이다.
//   1. 항목당 10건 서브셋을 추가한다. v4 데이터셋(test_set4/cases_fixed.csv)을 건드리지 않도록 같은 원본을
//      이 폴더의 dataset/에 따로 준비한다. seed·층이 v4와 같아서 10건 서브셋은 v4의 50건 서브셋에 포함된다.
//   2. 대상 모델은 qwen3:4b(추론 OFF) 하나뿐이다(사용자 지시) — 다른 모델은 목록에서 빼서 실행 자체를 막는다.
//   3. 결과는 tset_4_llm_test/<try>/results/ 아래에 쌓인다(엔진 공통 구조).
//
// 실행: 모든 스크립트에 --test tset_4_llm_test 를 붙인다. 순서는 README.md 참고.

const v4 = require('../model_test_v4/test.config.js');

module.exports = {
  ...v4,
  title: 'tset_4_llm_test — LLM Judge 사람 평가용 (test4 · 항목당 10건)',
  defaultTry: 'try1',
  models: v4.models.filter((m) => m.tag === 'qwen3:4b').map((m) => ({ ...m, runByDefault: true })),
  dataset: {
    ...v4.dataset,
    casesPath: 'tset_4_llm_test/dataset/cases_fixed.csv',
    faqPath: 'tset_4_llm_test/dataset/faq_master.csv',
    subset: { ...v4.dataset.subset, sizes: [10, ...v4.dataset.subset.sizes] },
    defaultSize: 10,
  },
};
