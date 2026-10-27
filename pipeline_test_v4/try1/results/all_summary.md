# pipeline_test_v4 try1 — sub vs slot (2026-10-23)

## 대상과 평가 기준

- 같은 119개 표적 스모크를 sub와 slot으로 새로 생성했다. 전체 390건의 대표 표본은 아니므로 전체 성능으로 일반화하지 않는다.
- sub는 공통 본문과 하위 statuses를 출력한다. slot은 하위 질문마다 answer → status를 출력하고, 코드가 ANSWER 칸의 본문만 남긴다. 코드 고정 안내는 별도로 붙인다.
- 두 run은 같은 백엔드 소스·모델·FAQ 스냅숏을 사용한다. 세부 설정과 프롬프트 사본은 [SETUP](../../SETUP.md)에 있다.
- Judge는 pipeline-judge-2 / gpt-6-sol / medium. 사용자에게 노출되는 모델 본문만 평가한다. 버린 칸은 Judge의 정답·환각 평가 대상이 아니다.
- 정확도 CORRECT와 근거 충실성은 별개다. 실질적 환각은 grounding 1~3점이며, CORRECT라도 부가 설명에 환각이 있을 수 있다.

## 전체 결과 — Judge 우선

### sub

- Judge 정답: **67/119 (56.3%)**. 정답이면서 실질적 환각 없음: 66건.
- 실질적 환각: **13/119 (10.92%)**.
- 하위 판정: {"CORRECT_ANSWER":85,"MISSING_ANSWER":42,"WRONG_ANSWER":5,"CORRECT_DECLINE":69,"UNSUPPORTED_ANSWER":8}.
- 모델 고지: 패턴 59건 / Judge 57건. 고지·되묻기 합계(패턴): 59건.
- 실행 경로: {"LLM":119}. 실행 오류 0건. trace 누락 0건.
- 최종 status 일치: 74/119 (62.18%). 엄격 75.63%, 부분 답변 라벨 62.18%.
- 검색 적중: 87.44%. 평균 요청 시간: 4463ms.
- 통과(실행 오류 없음 + status 일치 + Judge 정답): 64/119. 실패 원인: {"RETRIEVAL_MISS":9,"STATUS_MISMATCH":32,"ANSWER_INCORRECT":10,"QUERY_VARIANT_MISS":4}.

### slot

- Judge 정답: **78/118 (66.1%)**. 정답이면서 실질적 환각 없음: 76건.
- 실질적 환각: **14/118 (11.86%)**.
- 하위 판정: {"CORRECT_ANSWER":96,"WRONG_ANSWER":7,"MISSING_ANSWER":28,"CORRECT_DECLINE":70,"UNSUPPORTED_ANSWER":6}.
- 모델 고지: 패턴 5건 / Judge 2건. 고지·되묻기 합계(패턴): 5건.
- 실행 경로: {"LLM":118,"CHAT-021":1}. 실행 오류 1건. trace 누락 0건.
- 최종 status 일치: 83/119 (69.75%). 엄격 78.15%, 부분 답변 라벨 67.23%.
- 검색 적중: 84.42%. 평균 요청 시간: 5088ms.
- 통과(실행 오류 없음 + status 일치 + Judge 정답): 75/119. 실패 원인: {"RETRIEVAL_MISS":9,"STATUS_MISMATCH":24,"ANSWER_INCORRECT":6,"EXEC_ERROR":1,"QUERY_VARIANT_MISS":4}.

## 해석

- 이번 표적 119건에서는 slot의 정답이 67 → 78건으로 늘었다. 양쪽 모두 Judge가 있는 118건에서는 slot만 정답 17건, sub만 정답 5건으로 순증 12건이다(p=0.0169). sub에만 판정이 있는 MT-017은 정답 1건이었으므로 전체 건수 차이는 +11건이다.
- 모델의 답변 불가 고지는 Judge 기준 57 → 2건으로 크게 줄었다. 비ANSWER 칸 94개의 본문이 코드에서 제거됐고, 그중 80칸에 고지 패턴이 있었다. 이 94칸 전체를 환각·오답으로 해석해서는 안 된다.
- 실질적 환각은 13 → 14건으로 줄지 않았다. 칸을 제거해도 ANSWER로 잘못 분류한 내용과 다른 하위 질문의 정보가 섞인 ANSWER 칸은 남는다. 예를 들어 MP-058은 유심 판매 불가를 ANSWER로 단정했고, MT-016의 ANSWER 칸에는 변상금 관련 내용과 고지가 섞였다.
- 고지 패턴 5건에는 MA-014·MA-015의 정상 FAQ 사실 문장도 포함된다. 패턴 건수와 Judge 고지 건수를 구분한다.
- 누락(MISSING_ANSWER)은 42 → 28개로 줄었지만, 이 비교에는 검색·질문 분리 차이도 있다. 현재 결과는 전체 390건의 성능이나 다른 실행에서의 재현성을 확정하는 자료가 아니다.
- slot의 MT-017은 하위 질문 수 제한 CHAT-021로 실패했다. 이를 재실행해 지우지 않고 실행 오류로 보존했다. 나머지 118건의 status 배열은 모두 유효했다.

## 같은 문항의 짝 비교

- correct: 공통 118건, slot만 충족 17건, sub만 충족 5건, 순증 12건. McNemar 양측 정확 p=0.0169.
  - slot 개선: CQ-012, CQ-022, CQ-029, IN-001, IN-002, IN-003, MN-003, MP-009, MP-011, MP-035, MP-045, MT-019, OS-022, OS-026, UD-004, UD-024, UD-026
  - slot 악화: MA-016, MP-001, MP-006, MP-014, MP-047
- grounded: 공통 118건, slot만 충족 8건, sub만 충족 9건, 순증 -1건. McNemar 양측 정확 p=1.0000.
  - slot 개선: MA-027, MN-003, MP-005, MP-011, MP-035, MP-045, MT-019, MT-029
  - slot 악화: CQ-010, MP-006, MP-012, MP-014, MP-019, MP-047, MP-058, MT-016, OS-016
- correct_and_grounded: 공통 118건, slot만 충족 18건, sub만 충족 7건, 순증 11건. McNemar 양측 정확 p=0.0433.
  - slot 개선: CQ-012, CQ-022, CQ-029, IN-001, IN-002, IN-003, MN-003, MP-005, MP-009, MP-011, MP-035, MP-045, MT-019, OS-022, OS-026, UD-004, UD-024, UD-026
  - slot 악화: MA-016, MP-001, MP-006, MP-012, MP-014, MP-047, MT-016
- notice_free: 공통 118건, slot만 충족 55건, sub만 충족 2건, 순증 53건. McNemar 양측 정확 p=0.0000.
  - slot 개선: MA-016, MA-027, MN-004, MN-014, MP-002, MP-003, MP-004, MP-006, MP-007, MP-008, MP-010, MP-011, MP-012, MP-013, MP-014, MP-016, MP-018, MP-020, MP-021, MP-024, MP-025, MP-026, MP-027, MP-028, MP-030, MP-037, MP-038, MP-039, MP-041, MP-042, MP-046, MP-047, MP-048, MP-050, MP-051, MP-052, MP-053, MP-054, MP-055, MP-057, MP-060, MT-019, MT-029, OS-017, OS-019, OS-020, OS-021, OS-024, OS-027, ST-018, ST-023, ST-026, UD-027, UD-028, UD-030
  - slot 악화: MP-019, MP-058

## 칸 제거와 남은 고지

- 칸 원본이 있는 케이스 118건 / 총 207칸. ANSWER 113칸.
- 제거된 비ANSWER 칸의 비어 있지 않은 본문 94칸. 그중 고지 패턴이 있는 칸 80칸.
- 사용자 본문에 남는 ANSWER 칸의 고지: 5칸 / 5케이스.
- ANSWER 칸 되묻기: 0칸.
- status 배열 부적합: 없음. ANSWER인데 본문 없음: 없음.

고지 패턴은 FAQ 원문 인용을 제외하는 기존 공통 채점기를 칸별로 적용했다. 모델이 쓰지 않은 코드 안내는 누출에 넣지 않는다. 고지 감소와 정답·환각 변화는 따로 판단해야 한다.

## 유형별 결과

- **CQ (6건)**: 정답 1/6 → 4/6; 환각 0 → 1; 고지(패턴) 0 → 0; status 일치 1 → 6; 검색 적중 50% → 50%.
- **IN (15건)**: 정답 0/15 → 3/15; 환각 0 → 0; 고지(패턴) 0 → 0; status 일치 0 → 3; 검색 적중 80% → 80%.
- **MA (8건)**: 정답 5/8 → 4/8; 환각 2 → 1; 고지(패턴) 4 → 2; status 일치 5 → 5; 검색 적중 87.5% → 87.5%.
- **MN (3건)**: 정답 1/3 → 2/3; 환각 2 → 1; 고지(패턴) 2 → 0; status 일치 1 → 0; 검색 적중 100% → 100%.
- **MP (47건)**: 정답 36/47 → 36/47; 환각 7 → 9; 고지(패턴) 37 → 2; status 일치 41 → 39; 검색 적중 94.95% → 94.95%.
- **MT (5건)**: 정답 2/5 → 2/4; 환각 2 → 1; 고지(패턴) 4 → 1; status 일치 4 → 2; 검색 적중 88.89% → 22.22%.
- **OS (10건)**: 정답 7/10 → 9/10; 환각 0 → 1; 고지(패턴) 6 → 0; status 일치 7 → 10; 검색 적중 100% → 100%.
- **SA (10건)**: 정답 10/10 → 10/10; 환각 0 → 0; 고지(패턴) 0 → 0; status 일치 10 → 10; 검색 적중 100% → 100%.
- **ST (5건)**: 정답 2/5 → 2/5; 환각 0 → 0; 고지(패턴) 3 → 0; status 일치 2 → 2; 검색 적중 70% → 70%.
- **UD (10건)**: 정답 3/10 → 6/10; 환각 0 → 0; 고지(패턴) 3 → 0; status 일치 3 → 6; 검색 적중 55.56% → 55.56%.

## 비교 해석의 제한

- 실제 전달 FAQ ID가 달라진 문항: 7건 (MN-014, MP-013, MP-053, MT-016, MT-017, MT-019, MT-029).
- 판정 LLM 검색어가 달라진 문항: 18건. 실제 프롬프트 하위 질문·FAQ 배치 차이: 11건.
- 멀티턴은 이전 답변 변화가 다음 검색에 영향을 줄 수 있다. 검색·질문 분리 차이가 있는 문항의 성능 차이를 출력 형식 하나의 효과로 단정하지 않는다.
- v1·v2·v3와 실행 시점·환경·선정 문항이 달라 이번 두 run의 같은 문항 짝 비교를 우선한다.

## 증거 경로

- 생성 119 + 119건, Judge 119 + 118건 모두 완료했다. Judge 검증 실패 1회는 자동 재시도 후 성공했으며 미판정 LLM 답변은 없다. 평가용 백엔드는 실행 전 sub 모드로 복원했다.
- [비교 집계 JSON](summary/comparison.json): 모든 수치, 개선·악화 ID, 칸별 제거·고지 진단.
- sub: [응답·trace](raw/local-win_qwen3-4b-instruct_t0_pv4_sub_n119_20261023/results.jsonl) · [run 설정](raw/local-win_qwen3-4b-instruct_t0_pv4_sub_n119_20261023/run_info.json) · [채점](raw/scored/local-win_qwen3-4b-instruct_t0_pv4_sub_n119_20261023/summary.json) · [Judge](llm_judge/pv4-try1/local-win_qwen3-4b-instruct_t0_pv4_sub_n119_20261023.judgments.jsonl).
- slot: [응답·trace](raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n119_20261023/results.jsonl) · [run 설정](raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n119_20261023/run_info.json) · [채점](raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n119_20261023/summary.json) · [Judge](llm_judge/pv4-try1/local-win_qwen3-4b-instruct_t0_pv4_slot_n119_20261023.judgments.jsonl).
