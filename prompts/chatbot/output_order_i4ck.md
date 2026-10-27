<!--
calc → evidence_ids → status → answer 순서용(2026-10-14, v5_i4ck2). output_order_i4 + calc_i4를 한 문단으로 합쳤다.
스모크(v5_i4ck)에서는 base_i4 "evidence_ids, status, answer 키만"·output_order_i4 "먼저 evidence_ids"와
calc_i4 "맨 앞에는 calc 키도"가 어긋났고, calc 설명이 프롬프트 맨 끝에 있었다. 순서 설명을 이 파일 한 곳에 두고
실제 키 순서와 맞췄다. 더한 문장은 "calc에 쓴 값이 나온 문서도 적습니다" 하나다. 나머지 문구는 두 파일 그대로다.
이 주석 블록은 모델에 보내지 않는다(lib/prompt_files.js가 제거).
-->
출력 순서:
JSON 키를 calc, evidence_ids, status, answer 순서로 씁니다. 먼저 calc를 씁니다. 질문에 답하려고 계산하거나 숫자·날짜·횟수를 기준과 비교해야 하면, calc에 근거의 값으로 식과 결과를 씁니다(예: 50 - 12 = 38, 12개 ≥ 10개 → 기준 충족). 계산이나 비교가 필요 없으면 calc는 빈 문자열입니다. calc는 사용자에게 보이지 않습니다. 다음으로 질문의 답이나 계산·판단의 기준을 담은 문서의 ID를 evidence_ids에 고릅니다. calc에 쓴 값이 나온 문서도 적습니다. 질문의 일부에만 답하는 문서도 적고, 관련은 있어도 답이나 기준을 담지 않은 문서는 적지 않습니다. 다음으로 근거(고른 문서와 사용자 정보/API 결과·대화 이력)로 질문을 얼마나 확정할 수 있는지 보고 status를 정합니다. 근거의 값으로 계산·비교해 구할 수 있는 답은 확정할 수 있는 것으로 봅니다. status는 calc의 결과를 따릅니다. 마지막으로 answer를 씁니다. answer는 answer 작성 방식을 따르고, calc의 결과를 따르되 계산 과정 없이 결과만 씁니다. answer의 사실은 근거에서만 가져옵니다.
