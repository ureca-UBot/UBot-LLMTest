'use strict';
// prompts_test_v9 — 상담봇 프롬프트 튜닝 9차(Instruct 5차). 대상은 qwen3:4b-instruct(Q4_K_M) 하나, 이 PC(로컬)에서 생성한다.
// 데이터·모델·키 순서(answer 먼저, 접두어 없음)는 prompts_test_v7 try1과 같다. 새 안 v5_i5
// (answer 작성 방식 2를 모두/일부/하나도 세 경우로 나누고 "답할 수 없다는 말은 한 번만", status 정의에 경우 연결,
// OUT_OF_SCOPE의 answer 문장 삭제)를 잰다. 목표는 불가 문장 이중화 줄이기. 기준선은 pv7-try1 v5_i4(--base-from).
// 실행할 때는 --test prompts_test_v9 를 준다.

const base = require('../prompts_test_v7/test.config.js');

module.exports = {
  ...base,
  version: 'pv9',
  title: '프롬프트 튜닝 9차 — qwen3:4b-instruct Q4_K_M, test_set4r, v5_i5 (기준선 pv7-try1 v5_i4)',
  defaultTry: 'try1',
};
