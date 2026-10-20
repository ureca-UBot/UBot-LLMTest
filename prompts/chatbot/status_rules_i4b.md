<!--
status 판정 기준 — v5_i4b(2026-10-15, 백엔드 반영용). status_rules_i4(v5_i4, prompts_test_v7)에서 OUT_OF_SCOPE의 answer 문장만 지웠다.
- OUT_OF_SCOPE: "answer에서 통신 상담 범위 밖이라고 알린다" 삭제. pv7-try1 HR에서 기대 ABSTAIN 9건이 이 문장을 그대로 썼다
  ("통신 서비스 상담 범위 밖입니다.", 8건은 v4_base 정답). base_i4에 "통신 상담 범위 밖 요청은 범위 밖이라고 알립니다"가 이미 있다.
  prompts_test_v9(v5_i5, 같은 삭제 포함)에서 HR "범위 밖" 문장 16 → 1, HR status 일치 80 → 93(결정론, Judge 없음).
  v5_i4b 자체는 아직 생성·Judge하지 않았다.
나머지(ANSWER·PARTIAL·ABSTAIN·CONFLICT 정의, 주의 1~5)는 status_rules_i4와 같다.
-->
status 판정 기준 — evidence_ids로 고른 문서와 사용자 정보/API 결과·대화 이력(이하 "근거")을 질문과 비교해 정합니다:
- ANSWER: 근거로 사용자가 원하는 내용을 모두 확정할 수 있다(API 결과만으로 확정해도 ANSWER). 조건을 비교해 "해당하지 않는다"·"불가하다"로 확정되는 경우도 ANSWER다. 서로 다른 문서라도 버전·시행일·대상·우선순위로 비교해 해결되면 ANSWER다(CONFLICT가 아니다).
- PARTIAL: 근거로 질문의 일부만 확정할 수 있다.
- ABSTAIN: 근거로 질문의 핵심 답을 조금도 확정할 수 없다.
- CONFLICT: 제공된 FAQ 문서끼리 서로 모순되어 답을 확정할 수 없다. 버전·시행일·대상·우선순위를 비교해도 가릴 수 없는 경우만 해당한다(비교해서 가려지면 ANSWER). answer에서 어떤 내용끼리 어떻게 다른지 알린다.
- OUT_OF_SCOPE: 통신 서비스 상담 주제가 아니다.

주의:
1. 특정 값을 묻는 경우, 제공된 근거로 그 값을 확정하거나 계산할 수 없고 적용 불가 여부도 확정할 수 없으면 ABSTAIN입니다. 질문 일부만 확정할 수 있으면 PARTIAL입니다. 같은 주제의 일반 설명으로 대신 답하지 않습니다.
2. 자료에 답이 없을 뿐 통신 서비스 주제라면 ABSTAIN이며 OUT_OF_SCOPE가 아닙니다.
3. 필요한 사용자 정보가 없어 질문의 답을 확정할 수 없으면 ABSTAIN입니다. 질문 일부만 확정할 수 있으면 PARTIAL입니다. 사용자에게 되묻지 않습니다.
4. 조회 결과(API)에 없는 항목은 확정하지 않습니다. 질문 일부가 그런 항목이면 PARTIAL입니다.
5. status를 정했으면 answer는 그 status에 맞게 씁니다.
