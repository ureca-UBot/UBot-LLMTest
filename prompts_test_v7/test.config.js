'use strict';
// prompts_test_v7 — 상담봇 프롬프트 튜닝 7차(Instruct 4차). 대상은 qwen3:4b-instruct(Q4_K_M) 하나, 이 PC(로컬)에서 생성한다.
// 데이터·모델·생성 환경은 prompts_test_v5 try2·prompts_test_v6 try1과 같다(test_set4r, Ollama 0.40.2). 새 안 v5_i4
// (답할 수 없는 부분을 "[그 부분]은 답할 수 없습니다." 한 문장으로 고정, 같은 지시를 status_rules·output_order에서 제거)를 잰다.
// 실행할 때는 --test prompts_test_v7 을 준다.

const base = require('../prompts_test_v5/test.config.js');

module.exports = {
  ...base,
  version: 'pv7',
  title: '프롬프트 튜닝 7차 — qwen3:4b-instruct Q4_K_M, test_set4r, v5_i4 (기준선 pv5-try2 · pv6-try1)',
  defaultTry: 'try1',
  // 기준 안 이름은 v5와 같이 v4_base로 두고, 생성은 --variant v5_i4로 한다(run_id에 안 이름이 들어가게).
};
