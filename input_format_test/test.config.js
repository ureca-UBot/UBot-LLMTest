'use strict';
// input_format_test — 조회 결과(사용자 정보·API) 입력 형식 비교. 모델·프롬프트(v4_base)·문항은 prompts_test_v5 try2와 같고
// "사용자 정보·API" 칸의 형식만 다르다. try 이름이 데이터셋을 고른다(SETUP 2절).
//   json  -> test_set4r_json  (옛 test_set4 JSON 그대로)
//   jsonr -> test_set4r_jsonr (JSON 구조·영어 키 그대로, 값만 풀어 씀)
// 지금 형식("라벨 = 값", test_set4r)은 prompts_test_v5 try2의 v4_base run을 그대로 쓴다.
// 실행할 때는 --test input_format_test --try json|jsonr 을 준다.

const base = require('../prompts_test_v5/test.config.js');

const DATASETS = { json: 'test_set4r_json', jsonr: 'test_set4r_jsonr' };
const tryTag = process.env.LLM_TEST_TRY || 'json';
const name = DATASETS[tryTag];
if (!name) throw new Error(`input_format_test: --try는 ${Object.keys(DATASETS).join('|')} 중 하나입니다: ${tryTag}`);

module.exports = {
  ...base,
  version: 'ifmt',
  title: `입력 형식 비교 — qwen3:4b-instruct Q4_K_M, v4_base, ${name}`,
  defaultTry: 'json',
  dataset: {
    ...base.dataset,
    name,
    derivedBy: 'scripts/run/build_test_set4r.js',
    casesPath: `data/eval_sets/${name}/cases_fixed.csv`,
    faqPath: `data/eval_sets/${name}/faq_master.csv`,
  },
};
