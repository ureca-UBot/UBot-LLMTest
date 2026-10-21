# 출력 가드 후단 RedHat 분류 프롬프트 — 보관용 실험 원문

답변 생성 프롬프트가 아닙니다. 제품이나 공통 프롬프트 선택 설정에 등록하지 않은 테스트 원문입니다. 원본 바이트와 SHA-256을 보존하기 위해 파일 앞에 설명 주석을 덧붙이지 않았습니다.

| 파일 | 변경 | 실행 및 결과 |
|---|---|---|
| [v1](redhat4b_output_guard_20261021_v1.txt) | 답변 본문·실제 FAQ·위험/정보 부족 구분 | 기준선44건, 실제 문제15건 중 올바른 탐지7 |
| [v2](redhat4b_output_guard_20261022_v2.txt) | 주장별 실제 구절과 근거, 대상·조건·범위·인용 검사 순서 | 60건 완료, 기존 문제15건 탐지9. 새 정상 거절 오차단·형식 오류가 남음 |
| [v3](redhat4b_output_guard_20261022_v3.txt) | 답변 문장 ID 선택·간결 판정 | 문장 ID 입력·JSON schema도 함께 적용. 과도한 보류·500토큰 잘림으로34/60건에서 중단 |

모델은 `RedHatAI/Qwen3-4B-Instruct-2507-quantized.w4a16`입니다. v3의 문구뿐 아니라 입력 표현과 출력 제약도 바뀌었으므로 결과 차이를 프롬프트 단독 효과로 해석하지 않습니다. 어느 버전도 이번 게시로 제품에 연결하지 않았습니다.

[전체 결과](../../model_test_v7/try5/results/all_summary.md) · [해결 질문 원문](../../model_test_v7/try5/results/report/solved_questions.md) · [모든 질문별 기록](../../model_test_v7/try5/results/report/question_results.md)

실제 모델에는 v1/v2 frozen 자료의 `comparison_data`, v3의 `input`만 전달했습니다. `review_only`·기대 라벨·검토 메모는 전달하지 않았습니다. [요청 조건](../../model_test_v7/try5/results/summary/request_contract.json)

## 같은v2의 교체 비교 — v7 try6

[저장 답변448건 LLM 단독 결과](../../model_test_v7/try6/results/all_summary.md). v2 원문을 변경하지 않고 재사용했습니다. try5는 코드 필터 후 답변, try6는 필터 전 답변을 검사하므로 두 결과를 섞지 않습니다. 기존23건 중 유효 차단10에는 정상 오차단1이 포함되며 실제 문제를 올바르게 짚은 차단은8건입니다.
