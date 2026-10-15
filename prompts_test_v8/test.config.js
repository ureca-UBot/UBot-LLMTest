'use strict';
// prompts_test_v8 — 출력 키 순서 고정 테스트. 대상은 qwen3:4b-instruct(Q4_K_M) 하나, 이 PC(로컬)에서 생성한다.
// 프롬프트·데이터·모델·생성 환경은 prompts_test_v7 try1(v5_i4)과 같고, 출력 키 이름만 바꿔
// evidence_ids → status → answer 순서를 실제로 강제한다. 이 모델은 Ollama가 키를 알파벳순(answer → evidence_ids → status)으로
// 내보내 스키마 순서를 무시하지만, 키 이름에 a_·b_·c_를 붙이면 그 순서를 따른다(2026-10-13 확인).
// 파싱할 때 lib/metrics.js가 표준 키로 되돌리므로 채점·Judge는 그대로다.
// 안 이름 v5_i4k는 v5_i4와 같은 프롬프트 파일이다 — 짝 비교(compare_variants)가 안 이름으로 run을 가르므로 이름만 다르게 둔다.
// 실행할 때는 --test prompts_test_v8 을 준다. 계획·실행 순서는 SETUP.md 참고.
// 2026-10-14 스모크 뒤 본 테스트(try1)는 calc → evidence_ids → status → answer로 바꿨다(안 v5_i4ck · v5_i4ck2).
// smoke/의 evidence_ids → status → answer 결과(v5_i4k)는 바꾸기 전 설정으로 만든 것이다(gen_params.format에 기록).
// 다른 순서의 스모크(v5_i4s·v5_i4ek·v5_i4cs 등)도 smoke/에 모았다 — 다시 돌리려면 output을 SETUP 3절 표의 순서로 바꾼다.

const base = require('../prompts_test_v7/test.config.js');

module.exports = {
  ...base,
  version: 'pv8',
  title: '출력 키 순서 고정 — qwen3:4b-instruct Q4_K_M, test_set4r, v5_i4ck · v5_i4ck2 (calc → evidence_ids → status → answer 강제, 기준선 pv7-try1)',
  defaultTry: 'try1',
  output: {
    ...base.output,
    keyOrder: ['calc', 'evidence_ids', 'status', 'answer'],
    keyNames: { calc: 'a_calc', evidence_ids: 'b_evidence_ids', status: 'c_status', answer: 'd_answer' },
  },
};
