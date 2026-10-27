# pipeline_test_v4 · try2 — 전체 요약 (all_summary): sub vs slot 390건 (2026-10-23)

> **출력 구조 비교 — sub(공통 본문 + 하위 statuses) vs slot(하위 질문마다 answer → status, ANSWER 칸만 사용자에게)** · 생성 2026-10-22~23(이 PC, try1 119건 재사용 + 271건 추가) · LLM Judge `pv4-try2` 692건
> 이전: [try1 119건 스모크](../../try1/results/all_summary.md) · [pipeline_test_v3](../../../pipeline_test_v3/try1/results/all_summary.md)(2단계 코드 — 이 백엔드에 포함) · [pipeline_test_v1](../../../pipeline_test_v1/try1/results/all_summary.md)(single·sub). 다음: [pipeline_test_v5](../../../pipeline_test_v5/try1/results/all_summary.md)(feat/277 전체 파이프라인).

[SETUP](../SETUP.md) · [FAQ 경로 분석(매장·API 제외)](analysis_no_store_api.md) · [매장·사용자 정보 분석](analysis_store_api.md) · [single → sub → slot 환각 변화와 제어 지점](review/hallucination_progression.md) · [환각 케이스 원장](review/hallucination_cases.md) · [오답 케이스와 원인](review/failure_cases.md) · [비교 집계 JSON](summary/comparison.json)

**한 줄 결론: slot은 모델 고지(Judge 70 → 8)·이중 고지(67 → 1)·과잉 보류(빈 본문 120 → 97)·도구 경로 실행 오류(LLM-005 12 → 0)를 구조적으로 줄였고 정답도 오르는 방향이다(공통 339건 259 → 272, p=0.06). 하지만 환각은 줄지 않고(30 → 36) "자료에 없음 → 없다·안 된다" 단정이 ANSWER 칸 안으로 들어왔다(SB 환각 1 → 7). 방향은 slot을 채택하고, ANSWER 칸 안의 단정을 따로 막아야 한다.**

목차: [대상과 평가 기준](#대상과-평가-기준) · [전체 결과](#전체-결과--judge-우선) · [해석과 남은 문제](#해석과-남은-문제) · [짝 비교](#같은-문항의-짝-비교) · [환각](#환각) · [실패 원인](#실패-원인) · [칸 제거와 남은 고지](#칸-제거와-남은-고지) · [유형별 결과](#유형별-결과) · [판단과 다음](#판단과-다음) · [비교 해석의 제한](#비교-해석의-제한) · [증거 경로](#증거-경로)

## 대상과 평가 기준

- 전체 390개 케이스를 sub와 slot으로 비교했다. 각 모드의 try1 완료 응답 119건을 보존하고 271건씩 추가 실행했다. 기존 원본은 수정하지 않았으며 각 케이스를 한 번만 집계한다.
- sub는 공통 본문과 하위 statuses를 출력한다. slot은 하위 질문마다 answer → status를 출력하고, 코드가 ANSWER 칸의 본문만 남긴다. 코드 고정 안내는 별도로 붙인다.
- 두 run은 같은 백엔드 소스·모델·FAQ 스냅숏을 사용한다. 세부 설정과 프롬프트 사본은 [SETUP](../../SETUP.md)에 있다.
- Judge는 pipeline-judge-2 / gpt-6-sol / medium. 사용자에게 노출되는 모델 본문만 평가한다. 버린 칸은 Judge의 정답·환각 평가 대상이 아니다.
- 정확도 CORRECT와 근거 충실성은 별개다. 실질적 환각은 grounding 1~3점이며, CORRECT라도 부가 설명에 환각이 있을 수 있다.

## 전체 결과 — Judge 우선

### sub

- Judge 정답: **260/340 (76.47%)**. 정답이면서 실질적 환각 없음: 258건.
- 실질적 환각: **30/340 (8.82%)**.
- 하위 판정: {"CORRECT_ANSWER":235,"MISSING_ANSWER":52,"WRONG_ANSWER":13,"CORRECT_DECLINE":170,"UNSUPPORTED_ANSWER":21}.
- 모델 고지: 패턴 73건 / Judge 70건. 고지·되묻기 합계(패턴): 73건.
- 실행 경로: {"LLM":340,"CHAT-013":38,"LLM-005":12}. 실행 오류 12건. trace 누락 0건.
- 최종 status 일치: 302/390 (77.44%). 엄격 81.54%, 부분 답변 라벨 76.67%.
- 검색 적중: 84.23%. 최종 질문 API 대기 시간 평균: 3671ms.
- 통과(실행 오류 없음 + status 일치 + Judge 정답): 282/390. 실패 원인: {"RETRIEVAL_MISS":21,"STATUS_MISMATCH":52,"ANSWER_INCORRECT":17,"QUERY_VARIANT_MISS":6,"EXEC_ERROR":12}.

- sub 코드 안내 197건, 모델 고지와 코드 안내 중복 67건, 빈 모델 본문 120건.

### slot

- Judge 정답: **280/352 (79.55%)**. 정답이면서 실질적 환각 없음: 275건.
- 실질적 환각: **36/352 (10.23%)**.
- 하위 판정: {"CORRECT_ANSWER":256,"WRONG_ANSWER":18,"MISSING_ANSWER":36,"CORRECT_DECLINE":173,"UNSUPPORTED_ANSWER":20}.
- 모델 고지: 패턴 12건 / Judge 8건. 고지·되묻기 합계(패턴): 12건.
- 실행 경로: {"LLM":352,"CHAT-021":1,"CHAT-013":37}. 실행 오류 1건. trace 누락 0건.
- 최종 status 일치: 310/390 (79.49%). 엄격 81.54%, 부분 답변 라벨 77.44%.
- 검색 적중: 83.08%. 최종 질문 API 대기 시간 평균: 4186ms.
- 통과(실행 오류 없음 + status 일치 + Judge 정답): 289/390. 실패 원인: {"RETRIEVAL_MISS":21,"STATUS_MISMATCH":56,"ANSWER_INCORRECT":17,"EXEC_ERROR":1,"QUERY_VARIANT_MISS":6}.

- slot 코드 안내 170건, 모델 고지와 코드 안내 중복 1건, 빈 모델 본문 97건.

## 해석과 남은 문제

- **고지와 실행 오류는 줄었다.** 모델 고지는 Judge 기준 70 → 8건, 모델·코드의 이중 고지는 67 → 1건이다. 실행 오류는 sub의 LLM-005 12건에서 slot의 CHAT-021 1건으로 줄었다.
- **정답 증가 20건을 전부 출력 형식의 효과로 해석하면 안 된다.** 공통 Judge 문항 339건에서는 259 → 272건으로 순증 13건이다(slot만 정답 27, sub만 정답 14, p=0.0596). 한쪽에만 Judge가 있는 문항에서는 sub 정답 1건, slot 정답 8건으로 차이 7건이 더해졌다.
- 공통 문항의 정답 비교 p값 0.0596은 0.05보다 크다. 통상적인 5% 유의수준에서 정답 개선이 확인됐다고 보기보다는 고지·오류 개선과 정답 증가 경향을 구분해서 읽어야 한다.
- **환각은 개선되지 않았다.** 전체 실질적 환각은 30 → 36건(8.82% → 10.23%)이고, 공통 문항에서도 30 → 33건이다. ANSWER로 잘못 분류한 주장이나 ANSWER 칸에 섞인 다른 질문의 내용은 제거되지 않는다.
- 특히 **SB(주제 FAQ는 있지만 묻는 값이 없음)**는 정답 42/43 → 37/43, 환각 1 → 7건으로 악화됐다. SB-034는 FAQ에 없는 공항 유심 판매 여부를 판매 불가로, SB-037은 보너스 제공 여부를 미제공으로 단정했다. 자료에 없다는 것과 실제로 제공하지 않는다는 것은 다르다.
- slot에서는 실제 질문보다 많은 칸을 출력한 status 배열 오류 6건(CQ-007·MA-019·ST-004·ST-005·ST-009·ST-011)이 남았다. 이때 최종 status가 null이며 코드 안내도 붙지 않는다. 답변 생성 성공과 구조 정합을 별도로 확인해야 한다.
- try1은 어려운 항목을 모은 119건 스모크였고 이번에는 전체 390건이다. 두 범위의 전체 정답률을 직접 비교해 성능 개선으로 해석하지 않는다. 여기서는 같은 390건의 sub와 slot을 비교한다.

## 같은 문항의 짝 비교

- correct: 공통 339건에서 sub 259건, slot 272건. slot만 충족 27건, sub만 충족 14건, 순증 13건. McNemar 양측 정확 p=0.0596.
  - slot 개선: CQ-012, CQ-022, CQ-029, IN-001, IN-002, IN-003, MN-003, MP-009, MP-011, MP-035, MP-045, MT-019, OS-022, OS-026, UD-004, UD-024, UD-026, CQ-016, MA-019, MA-024, MN-015, MP-017, MP-022, MP-033, OS-023, OS-025, SB-035
  - slot 악화: MA-016, MP-001, MP-006, MP-014, MP-047, CQ-021, IN-008, MA-011, SB-034, SB-036, SB-037, SB-038, SB-042, SB-049
- grounded: 공통 339건에서 sub 309건, slot 306건. slot만 충족 17건, sub만 충족 20건, 순증 -3건. McNemar 양측 정확 p=0.7428.
  - slot 개선: MA-027, MN-003, MP-005, MP-011, MP-035, MP-045, MT-019, MT-029, MA-030, MN-015, MP-017, MP-022, MP-031, MP-033, MT-003, SA-022, SB-035
  - slot 악화: CQ-010, MP-006, MP-012, MP-014, MP-019, MP-047, MP-058, MT-016, OS-016, CQ-021, IN-016, MA-026, MT-012, SB-004, SB-034, SB-036, SB-037, SB-038, SB-042, SB-049
- correct_and_grounded: 공통 339건에서 sub 257건, slot 267건. slot만 충족 29건, sub만 충족 19건, 순증 10건. McNemar 양측 정확 p=0.1934.
  - slot 개선: CQ-012, CQ-022, CQ-029, IN-001, IN-002, IN-003, MN-003, MP-005, MP-009, MP-011, MP-035, MP-045, MT-019, OS-022, OS-026, UD-004, UD-024, UD-026, CQ-016, MA-019, MA-024, MN-015, MP-017, MP-022, MP-033, OS-023, OS-025, SA-022, SB-035
  - slot 악화: MA-016, MP-001, MP-006, MP-012, MP-014, MP-047, MT-016, CQ-021, IN-008, MA-011, MA-026, MT-012, SB-004, SB-034, SB-036, SB-037, SB-038, SB-042, SB-049
- notice_free: 공통 339건에서 sub 267건, slot 328건. slot만 충족 66건, sub만 충족 5건, 순증 61건. McNemar 양측 정확 p=1.190e-14.
  - slot 개선: MA-016, MA-027, MN-004, MN-014, MP-002, MP-003, MP-004, MP-006, MP-007, MP-008, MP-010, MP-011, MP-012, MP-013, MP-014, MP-016, MP-018, MP-020, MP-021, MP-024, MP-025, MP-026, MP-027, MP-028, MP-030, MP-037, MP-038, MP-039, MP-041, MP-042, MP-046, MP-047, MP-048, MP-050, MP-051, MP-052, MP-053, MP-054, MP-055, MP-057, MP-060, MT-019, MT-029, OS-017, OS-019, OS-020, OS-021, OS-024, OS-027, ST-018, ST-023, ST-026, UD-027, UD-028, UD-030, IN-008, MA-017, MA-033, MN-015, MN-016, MP-031, MT-009, MT-011, SB-035, SB-036, ST-019
  - slot 악화: MP-019, MP-058, MP-056, SB-037, UD-009
- sub에만 Judge가 있는 문항: 1건, 그중 정답 1건 (MT-017).
- slot에만 Judge가 있는 문항: 13건, 그중 정답 8건 (MP-044, MT-013, MT-028, ST-004, ST-005, ST-006, ST-009, ST-010, ST-011, ST-012, ST-017, ST-020, ST-029).

## 환각

케이스별 원장(질문·답변·Judge 주장·사유·제어 후보)은 [review/hallucination_cases.md](review/hallucination_cases.md), single → sub → slot 변화와 제어 규칙(HC01~HC08)은 [review/hallucination_progression.md](review/hallucination_progression.md).

| 종류 (해당 종류가 나온 케이스 수, 중복) | sub | slot |
|---|---|---|
| 실질적 환각 케이스 | 30 / 340 | 36 / 352 |
| 없는 사실·값 생성 (FABRICATION) | 20 | 22 |
| 대상·속성·근거 오적용 (MISATTRIBUTION) | 9 | 8 |
| 조건 누락·범위 확대 (UNSUPPORTED_GENERALIZATION) | 2 | **11** |
| 상충 자료의 임의 선택 | 1 | 1 |
| 미실행 작업 완료 주장 | 0 | 0 |

- 공통 339건: 환각 30 → 33, 사라짐 17 · 새로 생김 20(p=0.74). slot 전체 36건은 모두 status 배열이 유효하고 ANSWER 칸 원본과 사용자 본문이 일치한다 — **비ANSWER 칸 제거나 스키마 검증만으로는 남은 환각을 막을 수 없다.**
- **환각은 위치만 옮겨 갔다.** sub에서는 섞인 경우의 고지·끌어오기였고, slot에서는 "모두 ANSWER" 안의 단정이다(모두 ANSWER 환각 8 → 19, [analysis_no_store_api](analysis_no_store_api.md) 5절).
- 반복 패턴 세 가지:
  1. **예/아니오 질문에서 "자료에 없다"를 "안 된다·없다"로 단정하고 ANSWER** — SB 환각 1 → 7. SB-034 "공항 로밍센터에서는 유심을 판매하거나 구매할 수는 없습니다." · SB-037 "보너스 금액이 붙지 않습니다." · SB-038 "자동 갱신 없이 한 달만 살 수는 없습니다." · SB-042 "출국한 뒤 앱으로 신청할 수 없습니다." · SB-049 · MP-047. sub는 같은 문항에서 ABSTAIN + 빈 본문으로 정답이었다.
  2. **칸 끝 "따라서 …" 결론 문장이 묻지 않은 결론으로 건너뜀** — MP-036 "따라서 수수료가 있습니다." · MP-059 "따라서 번호 변경 수수료는 없으며"(정반대 결론) · MP-040 "따라서 해외에서 산 휴대폰으로도 Ubot 휴대폰 보험을 들 수 있습니다."
  3. **근거 없는 일반화·지어낸 값**(일반화 2 → 11 케이스) — MP-019·056 "비디오패스는 1대에서만" · MP-014 "1분에 1,000원입니다."(완전히 지어낸 값, sub는 ABSTAIN) · CQ-010 "번호이동은 휴대폰 번호를 변경하는 것".
- 원인(추정): answer를 먼저 쓰고 그 문장을 보고 ANSWER를 붙인다 + status 기준의 "'불가하다'로 확정되는 경우도 ANSWER" 문장이 단정을 정당화한다 + slot은 빈 칸으로 빠질 선택지가 없다(과잉 보류 감소와 맞바꾸는 관계).
- 매장·사용자 정보: 공항 유심 부정 단정 3건(MP-044·058·MT-028), "조회 결과에 없음" → "미납 없음"(UD-009, [analysis_store_api](analysis_store_api.md) 2-6절)이 같은 모양이다.

## 실패 원인

오답 케이스 전체(원인 분류·Judge 하위 판정 사유)는 [review/failure_cases.md](review/failure_cases.md).

| 원인 (Judge 오답, 기계 분류) | sub | slot |
|---|---|---|
| 답할 수 있는 하위 질문을 보류 + 본문 빔 | **38** | 24 |
| 답할 수 있는 하위 질문을 보류, 본문은 씀 | 6 | 6 |
| 답할 수 없는 하위 질문을 ANSWER로 두고 답함 | 12 | **20** |
| 하위 질문 수 불일치(질문 분리) | 5 | 3 |
| statuses 배열 잘못 | 1 | 0 |
| status는 맞음, 본문 오류·누락 | 18 | 19 |
| 합계 | 80 | 72 |

- **과잉 보류 38 → 24와 지어냄 12 → 20이 맞바뀌었다.** 빈 본문으로 빠지던 문항이 ANSWER로 옮겨 가면서 맞힌 것(CQ·IN·UD·OS 회복)과 지어낸 것(SB·MP)이 함께 늘었다.
- IN은 여전히 약하다(정답 2/19 → 4/19). 하위 질문 하나 안에 답할 수 있는 부분과 없는 부분이 섞이면 통째로 보류한다(v1부터 같음).
- 매장 경로: slot은 LLM-005 12 → 0으로 판정 대상이 27 → 39건이 됐다. 오답 분류는 [analysis_store_api](analysis_store_api.md) 1-3절.
- 채점 실패 원인(STATUS 52 → 56)은 SB 라벨 악화(50 → 41)가 대부분이다. 라벨은 "자료에 없음 = ABSTAIN" 기준이다.

## 칸 제거와 남은 고지

- 칸 원본이 있는 케이스 352건 / 총 506칸. ANSWER 314칸.
- 제거된 비ANSWER 칸의 비어 있지 않은 본문 191칸. 그중 고지 패턴이 있는 칸 152칸.
- 사용자 본문에 남는 ANSWER 칸의 고지: 12칸 / 12케이스.
- ANSWER 칸 되묻기: 0칸.
- status 배열 부적합: CQ-007, MA-019, ST-004, ST-005, ST-009, ST-011. ANSWER인데 본문 없음: 없음.

고지 패턴은 FAQ 원문 인용을 제외하는 기존 공통 채점기를 칸별로 적용했다. 모델이 쓰지 않은 코드 안내는 누출에 넣지 않는다. 고지 감소와 정답·환각 변화는 따로 판단해야 한다.

## 유형별 결과

- **CQ (30건)**: 정답 21/28 → 24/28; 환각 0 → 2; 고지(패턴) 0 → 0; status 일치 21 → 27; 검색 적중 80% → 80%.
- **IN (20건)**: 정답 2/19 → 4/19; 환각 1 → 2; 고지(패턴) 1 → 0; status 일치 2 → 6; 검색 적중 80% → 80%.
- **MA (40건)**: 정답 31/39 → 31/39; 환각 3 → 2; 고지(패턴) 6 → 2; status 일치 34 → 33; 검색 적중 91.25% → 91.25%.
- **MN (20건)**: 정답 11/15 → 13/15; 환각 4 → 2; 고지(패턴) 5 → 1; status 일치 16 → 13; 검색 적중 67.5% → 67.5%.
- **MP (60건)**: 정답 37/57 → 40/58; 환각 16 → 15; 고지(패턴) 39 → 5; status 일치 41 → 42; 검색 적중 90.4% → 90.4%.
- **MT (30건)**: 정답 21/26 → 22/27; 환각 3 → 3; 고지(패턴) 6 → 1; status 일치 26 → 24; 검색 적중 79.41% → 61.76%.
- **OS (30건)**: 정답 10/15 → 14/15; 환각 0 → 1; 고지(패턴) 6 → 0; status 일치 25 → 29; 검색 적중 93.33% → 93.33%.
- **SA (50건)**: 정답 50/50 → 50/50; 환각 1 → 0; 고지(패턴) 0 → 0; status 일치 50 → 50; 검색 적중 100% → 100%.
- **ST (30건)**: 정답 15/20 → 22/30; 환각 1 → 2; 고지(패턴) 5 → 1; status 일치 16 → 22; 검색 적중 92.11% → 92.11%.
- **UD (30건)**: 정답 20/28 → 23/28; 환각 0 → 0; 고지(패턴) 3 → 1; status 일치 21 → 23; 검색 적중 71.05% → 71.05%.
- **SB (50건)**: 정답 42/43 → 37/43; 환각 1 → 7; 고지(패턴) 2 → 1; status 일치 50 → 41; 검색 적중 64% → 64%.

## 판단과 다음

- **방향은 slot을 채택한다.** 목표였던 "ABSTAIN 안내는 코드가 붙이고, 모델 고지와 이중 고지는 없앰"을 구조적으로 달성했고(Judge 고지 70 → 8, 이중 고지 67 → 1, notice_free 짝 66 / 5), 도구 경로 실행 오류가 사라졌다. 정답은 오르는 방향이지만 유의하지 않다(p=0.06).
- **환각은 그대로라 ANSWER 칸 안을 따로 다뤄야 한다.** 다음 후보(효과는 다시 재야 한다):
  1. status 기준의 "'불가하다'로 확정되는 경우도 ANSWER"를 좁힌다 — 자료에 "불가"라고 쓰여 있을 때만 ANSWER(SB-034·037·038·042·049, MP-047). SB·IN·CQ 과잉 보류가 다시 늘지 않는지 함께 본다.
  2. ANSWER 칸 끝의 "따라서 …" 결론 문장을 코드로 검사한다(MP-036·040·059). 답 자체가 "따라서" 문장인 경우(MA-032)가 있어 그냥 지우면 안 된다.
  3. 칸 수 불일치 처리(CQ-007·MA-019·ST-004·005·009·011 — 최종 status null, 안내 누락).
  4. 제어 규칙 HC01(미확인 필드를 부정·0·무료로 바꾸지 않기)부터 — [hallucination_progression](review/hallucination_progression.md) 6절.
- slot 출력 형식은 feat/277 브랜치에 들어가 [pipeline_test_v5](../../../pipeline_test_v5/try1/results/all_summary.md)에서 가드·실제 도구와 함께 다시 쟀다.

## 비교 해석의 제한

- 실제 전달 FAQ ID가 달라진 문항: 9건 (MN-014, MP-013, MP-053, MT-016, MT-017, MT-019, MT-029, MT-013, MT-028).
- 판정 LLM 검색어가 달라진 문항: 21건. 실제 프롬프트 하위 질문·FAQ 배치 차이: 14건.
- 멀티턴은 이전 답변 변화가 다음 검색에 영향을 줄 수 있다. 검색·질문 분리 차이가 있는 문항의 성능 차이를 출력 형식 하나의 효과로 단정하지 않는다.
- v1·v2·v3와 실행 시점·환경이 달라 이번 두 run의 같은 문항 짝 비교를 우선한다.

## 증거 경로

- 전체 390건씩 생성·병합 완료. trace 누락 0건. LLM 답변의 Judge는 sub 340건·slot 352건(합계 692건) 모두 완료했다. 평가용 백엔드는 실행 전 sub 모드로 복원했다.
- [비교 집계 JSON](summary/comparison.json): 모든 수치, 개선·악화 ID, 칸별 제거·고지 진단.
- [원본 재사용 증거](source_provenance.json): 응답·판정 원본 해시와 재사용 ID. 판정마다 원본 파일·행·레코드 해시도 남겼다.
- sub: [응답·trace](raw/local-win_qwen3-4b-instruct_t0_pv4_sub_n390_20261023/results.jsonl) · [run 설정](raw/local-win_qwen3-4b-instruct_t0_pv4_sub_n390_20261023/run_info.json) · [채점](raw/scored/local-win_qwen3-4b-instruct_t0_pv4_sub_n390_20261023/summary.json) · [Judge](llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_sub_n390_20261023.judgments.jsonl).
- slot: [응답·trace](raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [run 설정](raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/run_info.json) · [채점](raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/summary.json) · [Judge](llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl).
