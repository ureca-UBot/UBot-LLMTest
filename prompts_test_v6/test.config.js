'use strict';
// prompts_test_v6 — 상담봇 프롬프트 튜닝 6차(Instruct 3차). 대상은 qwen3:4b-instruct(Q4_K_M) 하나, 이 PC(로컬)에서 생성한다.
// 데이터·모델·생성 환경은 prompts_test_v5 try2와 같다(test_set4r, Ollama 0.40.2). 새 안 v5_i3만 7항목 × 100건 생성하고,
// 기준선은 prompts_test_v5 try2의 v4_base·v5_i2(배치 pv5-try2)를 --base-from으로 가져온다(SETUP 4절).
// 실행할 때는 --test prompts_test_v6 을 준다. 계획·실행 순서는 SETUP.md 참고.

const base = require('../prompts_test_v5/test.config.js');

module.exports = {
  ...base,
  version: 'pv6',
  title: '프롬프트 튜닝 6차 — qwen3:4b-instruct Q4_K_M, test_set4r, v5_i3 (기준선 pv5-try2)',
  defaultTry: 'try1',
  // 기준 안 이름은 v5와 같이 v4_base로 두고, 생성은 --variant v5_i3로 한다(run_id에 안 이름이 들어가게).
};
