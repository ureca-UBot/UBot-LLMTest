<!--
status → evidence_ids → answer 순서용(2026-10-14, v5_i4s2). output_order_i4의 순서 설명을 실제 키 순서에 맞췄다.
스모크(v5_i4s)에서는 본문이 "먼저 evidence_ids, 다음으로 status"인데 생성 문법은 status를 먼저 쓰게 했다.
status 판정 근거는 "고른 문서" 대신 제공된 FAQ 문서로 바꾸고(status_rules_i4s와 같이), evidence_ids는 status를 정할 때
쓴 문서로 정의했다. 나머지 문구는 output_order_i4 그대로다. 이 주석 블록은 모델에 보내지 않는다(lib/prompt_files.js가 제거).
-->
출력 순서:
JSON 키를 status, evidence_ids, answer 순서로 씁니다. 먼저 근거(제공된 FAQ 문서와 사용자 정보/API 결과·대화 이력)로 질문을 얼마나 확정할 수 있는지 보고 status를 정합니다. 근거의 값으로 계산·비교해 구할 수 있는 답은 확정할 수 있는 것으로 봅니다. 다음으로 status를 정할 때 쓴 문서, 곧 질문의 답이나 계산·판단의 기준을 담은 문서의 ID를 evidence_ids에 고릅니다. 질문의 일부에만 답하는 문서도 적고, 관련은 있어도 답이나 기준을 담지 않은 문서는 적지 않습니다. 마지막으로 answer를 씁니다. answer는 answer 작성 방식을 따릅니다. answer의 사실은 근거에서만 가져옵니다.
