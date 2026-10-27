# single → sub → slot 환각 변화와 제어 지점

빈 answer를 포함한 기존 Judge 판정을 재집계했다. 환각 변화는 케이스 단위이며, 제어 후보는 모델이 실제로 받은 자료와 판정 사유를 읽고 붙였다. 백엔드·프롬프트·원본 Judge는 변경하지 않았다.

## 1. 비교 범위와 분모

- single·sub는 pipeline_test_v1 try1, slot은 pipeline_test_v4 try2 전체 390문항 실행이다.
- 세 안 모두 Judge 판정이 있는 **동일 339문항**을 증감·유형·항목 비교의 기본 분모로 쓴다. 전체 판정 분모도 함께 제시한다.
- 빈 answer는 제외하지 않는다. 빈 본문이어도 기대 ANSWER라면 정확도는 누락일 수 있지만, 환각과는 따로 판정한다.
- 환각 = is_grounded=false(grounding 1~3). 유형별 건수는 해당 유형이 있는 케이스 수이며 서로 중복될 수 있다. 기존 summary의 모든 claim 유형 합계(grounded=true의 경미한 claim 포함)와는 집계 범위가 다르다.
- v1은 pv1-try1 뒤 pv1-try1-store를 덮어 병합했다. 새 Judge 호출은 없었다. v4 sub를 보조 기준으로 제시해 버전 간 변경과 출력 구조 변경을 구분한다.

| 지표 | v1 single | v1 sub | v4 slot |
| --- | --- | --- | --- |
| 전체 Judge 환각 | 44/352 (12.50%) | 31/342 (9.06%) | 36/352 (10.23%) |
| 동일 문항 Judge 환각 | 44/339 (12.98%) | 31/339 (9.14%) | 34/339 (10.03%) |
| 분모에 포함한 빈 모델 answer | 0 | 120 | 97 |

## 2. 무엇이 사라지고 새로 생겼나

### single → sub — 동일 339문항

- 환각 판정이 사라진 케이스 **24건**, 새로 생긴 케이스 **11건**, 양쪽 환각 유지 **20건**.
- 사라진 24건 중 모델 본문이 비게 된 것은 12건, 본문을 유지한 것은 12건이다. 빈 본문은 정상 보류로 포함한다. 사라진 뒤에도 오답/누락인 케이스는 8건이므로 정답 개선과 동의어가 아니다.

| 환각 유형 | 환각이 사라진 케이스 안의 해당 유형 | 새 환각 케이스 안의 해당 유형 |
| --- | --- | --- |
| 없는 사실·값 생성 | 14 | 5 |
| 대상·속성·근거 오적용 | 7 | 4 |
| 조건 누락·범위 확대 | 6 | 1 |
| 상충 자료의 임의 선택 | 0 | 1 |
| 미실행 작업 완료 주장 | 0 | 0 |

- 사라짐: [CQ-010](hallucination_cases.md#cq-010), [CQ-012](hallucination_cases.md#cq-012), [CQ-018](hallucination_cases.md#cq-018), [CQ-020](hallucination_cases.md#cq-020), [IN-007](hallucination_cases.md#in-007), [IN-013](hallucination_cases.md#in-013), [MA-007](hallucination_cases.md#ma-007), [MA-011](hallucination_cases.md#ma-011), [MA-017](hallucination_cases.md#ma-017), [MN-005](hallucination_cases.md#mn-005), [MP-018](hallucination_cases.md#mp-018), [MP-025](hallucination_cases.md#mp-025), [MP-026](hallucination_cases.md#mp-026), [MP-058](hallucination_cases.md#mp-058), [MT-006](hallucination_cases.md#mt-006), [MT-012](hallucination_cases.md#mt-012), [SB-025](hallucination_cases.md#sb-025), [SB-034](hallucination_cases.md#sb-034), [ST-027](hallucination_cases.md#st-027), [ST-030](hallucination_cases.md#st-030), [UD-002](hallucination_cases.md#ud-002), [UD-013](hallucination_cases.md#ud-013), [UD-018](hallucination_cases.md#ud-018), [UD-024](hallucination_cases.md#ud-024)
- 새로 생김: [MA-015](hallucination_cases.md#ma-015), [MN-003](hallucination_cases.md#mn-003), [MN-015](hallucination_cases.md#mn-015), [MP-017](hallucination_cases.md#mp-017), [MP-031](hallucination_cases.md#mp-031), [MP-035](hallucination_cases.md#mp-035), [MP-037](hallucination_cases.md#mp-037), [MP-044](hallucination_cases.md#mp-044), [MP-045](hallucination_cases.md#mp-045), [MT-003](hallucination_cases.md#mt-003), [SB-035](hallucination_cases.md#sb-035)

### sub → slot — 동일 339문항

- 환각 판정이 사라진 케이스 **16건**, 새로 생긴 케이스 **19건**, 양쪽 환각 유지 **15건**.
- 사라진 16건 중 모델 본문이 비게 된 것은 3건, 본문을 유지한 것은 13건이다. 빈 본문은 정상 보류로 포함한다. 사라진 뒤에도 오답/누락인 케이스는 4건이므로 정답 개선과 동의어가 아니다.

| 환각 유형 | 환각이 사라진 케이스 안의 해당 유형 | 새 환각 케이스 안의 해당 유형 |
| --- | --- | --- |
| 없는 사실·값 생성 | 7 | 13 |
| 대상·속성·근거 오적용 | 5 | 3 |
| 조건 누락·범위 확대 | 3 | 6 |
| 상충 자료의 임의 선택 | 1 | 0 |
| 미실행 작업 완료 주장 | 0 | 0 |

- 사라짐: [MA-015](hallucination_cases.md#ma-015), [MA-027](hallucination_cases.md#ma-027), [MA-030](hallucination_cases.md#ma-030), [MN-003](hallucination_cases.md#mn-003), [MN-015](hallucination_cases.md#mn-015), [MP-005](hallucination_cases.md#mp-005), [MP-010](hallucination_cases.md#mp-010), [MP-017](hallucination_cases.md#mp-017), [MP-022](hallucination_cases.md#mp-022), [MP-031](hallucination_cases.md#mp-031), [MP-033](hallucination_cases.md#mp-033), [MP-035](hallucination_cases.md#mp-035), [MP-045](hallucination_cases.md#mp-045), [MT-003](hallucination_cases.md#mt-003), [SA-022](hallucination_cases.md#sa-022), [SB-035](hallucination_cases.md#sb-035)
- 새로 생김: [CQ-010](hallucination_cases.md#cq-010), [CQ-021](hallucination_cases.md#cq-021), [MA-026](hallucination_cases.md#ma-026), [MP-006](hallucination_cases.md#mp-006), [MP-012](hallucination_cases.md#mp-012), [MP-014](hallucination_cases.md#mp-014), [MP-019](hallucination_cases.md#mp-019), [MP-047](hallucination_cases.md#mp-047), [MP-058](hallucination_cases.md#mp-058), [MT-012](hallucination_cases.md#mt-012), [MT-016](hallucination_cases.md#mt-016), [OS-016](hallucination_cases.md#os-016), [SB-004](hallucination_cases.md#sb-004), [SB-034](hallucination_cases.md#sb-034), [SB-036](hallucination_cases.md#sb-036), [SB-037](hallucination_cases.md#sb-037), [SB-038](hallucination_cases.md#sb-038), [SB-042](hallucination_cases.md#sb-042), [SB-049](hallucination_cases.md#sb-049)

- 핵심 변화: single→sub에서는 없는 사실 생성이 많이 줄었지만, 혼합 질문(MP)의 환각은 줄지 않았다. sub→slot에서는 혼합 질문의 미지원 답변 일부가 줄고, 단건 SB의 미확인 값을 부정/무료로 확정하는 문제가 늘었다.
- 같은 케이스에서 환각이 계속되면서 유형만 달라질 수도 있다. 예: MP-023의 사용 후 환불 불가 주장은 FABRICATION/UNSUPPORTED_GENERALIZATION으로 달리 분류됐다. 유형 합계 변화만으로 특정 사실이 사라졌다고 해석하지 않는다.

### 전체 분모의 slot 추가 2건

- v1 sub에 Judge가 없고 slot에서 환각 판정된 케이스: [MT-028](hallucination_cases.md#mt-028), [ST-017](hallucination_cases.md#st-017). 이 둘은 기존 답변의 환각 악화와 구분한다. 동일 문항 31→34와 전체 31→36의 차이다.

## 3. 환각 종류별 현재 분포

| 종류(서로 중복 가능) | v1 single | v1 sub | v4 slot |
| --- | --- | --- | --- |
| 없는 사실·값 생성 | 24 | 13 | 20 |
| 대상·속성·근거 오적용 | 16 | 11 | 8 |
| 조건 누락·범위 확대 | 8 | 7 | 11 |
| 상충 자료의 임의 선택 | 1 | 2 | 1 |
| 미실행 작업 완료 주장 | 0 | 0 | 0 |

### 대표 변화와 확인할 필드

- 줄어든 오적용: [MP-010](hallucination_cases.md#mp-010)에서 single·sub는 하루 임대료 2,200원을 분실 변상금으로 답했고 slot에서는 그 주장이 사라졌다. rental_fee와 loss_compensation을 다른 필드로 검사한다(HC02/HC03/HC05).
- 계속되는 단위 오적용: [IN-015](hallucination_cases.md#in-015)는 세 안 모두 영화 혜택의 월 1회를 예매 가능 매수로 답했다. period=월·unit=회와 unit=장을 분리한다(HC03).
- slot에서 다시 생김: [SB-034](hallucination_cases.md#sb-034)는 유심 판매 여부가 없는데 single은 판매 불가, sub는 보류, slot은 다시 판매 불가로 답했다. 주제 FAQ의 존재와 sales_available 근거의 존재를 구분한다(HC01).
- slot에서 새로 생김: [SB-036](hallucination_cases.md#sb-036), [SB-037](hallucination_cases.md#sb-037), [SB-049](hallucination_cases.md#sb-049)는 각각 개통비 없음·보너스 없음·다운로드 불가를 생성했다. 데이터 누락을 0/false로 변환하지 않는다(HC01).
- 매장: [ST-017](hallucination_cases.md#st-017), [ST-021](hallucination_cases.md#st-021)는 parking/openingDays가 없는 결과에서 주차 가능·일요일 영업 없음/평일 영업시간을 만들었다. hours_text만 있으면 날짜별 영업표를 추측하지 않는다(HC06).
- 멀티턴과 slot 혼입: [MT-016](hallucination_cases.md#mt-016)은 재작성 때 임대폰이 일반 휴대폰으로 바뀌고, ABSTAIN 칸의 대상인 보험/분실 내용이 ANSWER 칸에 들어갔다. 이전 엔티티를 보존하고 ANSWER 칸도 허용 사실 단위로 검사한다(HC08/HC02/HC05).

## 4. 어느 항목에 집중되나

아래는 동일 339문항의 고정된 데이터셋 유형이다. 괄호는 환각 건수/판정 건수와 비율이다.

| 유형 | v1 single | v1 sub | v4 slot |
| --- | --- | --- | --- |
| SA · 단일·답할 수 있음 | 1/50 (2.00%) | 1/50 (2.00%) | 0/50 (0.00%) |
| SB · 단일·묻는 값 없음 | 2/43 (4.65%) | 1/43 (2.33%) | 7/43 (16.28%) |
| UD · 사용자 정보 | 4/28 (14.29%) | 0/28 (0.00%) | 0/28 (0.00%) |
| MA · 복합·모두 답할 수 있음 | 6/39 (15.38%) | 4/39 (10.26%) | 2/39 (5.13%) |
| MP · 복합·답할 수 있음+없음 | 15/58 (25.86%) | 17/58 (29.31%) | 15/58 (25.86%) |
| MN · 복합·모두 답할 수 없음 | 3/15 (20.00%) | 4/15 (26.67%) | 2/15 (13.33%) |
| OS · 범위 밖 포함 | 0/15 (0.00%) | 0/15 (0.00%) | 1/15 (6.67%) |
| IN · 질문 내부 일부 미확인 | 4/19 (21.05%) | 2/19 (10.53%) | 2/19 (10.53%) |
| CQ · 모호한 질문 | 4/28 (14.29%) | 0/28 (0.00%) | 2/28 (7.14%) |
| MT · 멀티턴 | 2/23 (8.70%) | 1/23 (4.35%) | 2/23 (8.70%) |
| ST · 매장 | 3/21 (14.29%) | 1/21 (4.76%) | 1/21 (4.76%) |

### 질문 형태와 실제 입력 경로

축끼리 중복된다. 예를 들어 멀티턴이면서 다중 질문이고 사용자 정보가 포함될 수 있다. 다중 질문은 기대 하위 질문 수로 구분하며, 실제 분리 결과는 케이스 원장에서 따로 확인한다.

| 축 | v1 single | v1 sub | v4 slot |
| --- | --- | --- | --- |
| 다중 질문(기대 하위 질문 2개 이상) | 26/146 (17.81%) | 25/146 (17.12%) | 21/146 (14.38%) |
| 멀티턴(이전 사용자 턴 있음) | 2/23 (8.70%) | 1/23 (4.35%) | 2/23 (8.70%) |
| 단건·이전 턴 없음 | 16/173 (9.25%) | 5/173 (2.89%) | 12/173 (6.94%) |
| 사용자 정보 섹션이 실제 입력에 포함 | 15/121 (12.40%) | 9/119 (7.56%) | 8/119 (6.72%) |
| 매장 섹션 또는 STORE_SEARCH 연동 | 4/28 (14.29%) | 2/28 (7.14%) | 3/28 (10.71%) |

- API/DB가 틀린 값을 반환했다는 뜻과, API에서 받은 정보에 LLM이 추측을 덧붙였다는 뜻은 다르다. 이 테스트에서 관찰한 도구 종류는 STORE_SEARCH이고, 사용자 정보는 입력 섹션으로 제공됐다. HTTP 실행 오류 자체는 환각 건수에 포함하지 않는다.
- 사용자 필드·날짜 자체에 관한 환각은 [MA-017](hallucination_cases.md#ma-017), [UD-002](hallucination_cases.md#ud-002), [UD-013](hallucination_cases.md#ud-013), [UD-018](hallucination_cases.md#ud-018)이다. single 4건→sub 0건→slot 0건. 사용자 정보가 포함된 다른 케이스의 환각은 대부분 FAQ 정책/속성 문제이며 API 오류로 분류하면 안 된다.
- 실제 매장 반환 필드가 부족한 주장은 [ST-017](hallucination_cases.md#st-017), [ST-021](hallucination_cases.md#st-021). 공항 유심 판매 여부([SB-034](hallucination_cases.md#sb-034), [MP-044](hallucination_cases.md#mp-044), [MP-058](hallucination_cases.md#mp-058), [MT-028](hallucination_cases.md#mt-028))는 매장 관련 질문이지만 주된 근거 문제는 FAQ에 판매 여부가 없다는 것이다.
- 현재 develop의 청구·사용량 등 전체 도구 경로를 검증한 결과로 확장할 수 없다. 각 케이스의 실제 sections/tools 경로를 기준으로 읽는다.

## 5. 동일 v4 백엔드에서의 sub → slot 보조 비교

공통 339문항에서 환각 30→33. 새 환각 20건, 사라짐 17건. SB 1→7 악화는 이 비교에서도 나타난다.
v1 sub→v4 slot에는 매장 실패 메시지·사용자 정보 고지 변경, 재작성·검색/이전 답변 변동도 포함된다. 보조 비교도 개별 run의 입력 변동이 있으므로 인과 효과를 확정하지 않는다.

## 6. 케이스별 제어 규칙과 회귀 기준

아래 규칙은 적용 후보다. case ID는 회귀 테스트 목록에 쓰고, 서비스 실행 시에는 자료 종류·질문한 필드·대상 ID·단위·조건으로 발동한다. 정적 라벨 건수는 방지 효과의 실측값이 아니다.

우선순위: HC01 미확인 값 단정 차단 → HC02/HC03 대상·단위 고정 → HC05 ANSWER slot 내부 검증 → HC04 조건 보존. 매장(HC06)과 사용자 필드/날짜(HC07)는 어댑터에서 직접 제한하고, 멀티턴은 HC08을 검색 전에 적용한다.

slot의 전체 환각 36건은 모두 status 배열이 유효하고 slot 원본이 있다. 실제 모델 본문이 ANSWER slot만 합친 결과와 일치하는지도 검증했다(일치). 따라서 스키마 검증이나 비ANSWER 칸 제거만으로 이 잔존 환각을 막을 수 없다.

실행 경로 제안: 요청 필드 추출 → 자료에서 typed fact(subject, predicate, value, unit, conditions, source_id, sub_question_id) 확보 → 미지원 필드는 UNKNOWN → 하위 질문별 허용 사실로 작성 → ANSWER 칸도 주장별 근거 검사 → 코드 고지 병합. 단순히 ABSTAIN 칸을 버리는 것만으로는 부족하다.

회귀 검증은 환각 문장 차단과 정상 정보 유지 둘 다 확인한다. 예: 개통비 근거가 없을 때 0원을 막고, 같은 입력에 명시적 개통비 0원 근거를 추가한 대조 케이스에서는 0원을 허용한다. 주차 필드는 true/false/unknown을 각각 검증한다. 지원 정보가 전혀 없는 빈 answer는 정상으로 유지하고, 개인 포인트 잔액이 없어도 FAQ의 유효기간까지 함께 지우지 않는다. 이 대조 케이스는 후속 검증 제안이며 이번 실행 결과에 새 관측치로 섞지 않았다.

<a id="hc01"></a>
### HC01 · 미확인 필드를 부정·0·무료·무제한으로 바꾸지 않기

- 위치: 근거 채택·문장 검증
- 발동 조건: 질문한 속성의 명시적 근거가 없고 관련 주제 FAQ만 있음
- 검사: 해당 predicate의 supported=false/unknown이면 true와 false 모두 확정 금지. 요금 항목 누락은 0원 근거가 아님.
- 제어: 해당 주장만 제거하고 그 속성은 ABSTAIN/코드 안내로 처리. 같은 문항의 확인된 정보는 유지.
- 구현 경계: 지원 속성 목록은 자료에서 추출·검증해야 함. 단순 금칙어 정규식만으로 보장할 수 없음.
- 실제 환각 케이스의 검토 대상(single/sub/slot): 17 / 15 / 19건. 규칙 간 중복 가능.
- 회귀 케이스: [CQ-018](hallucination_cases.md#cq-018), [MA-027](hallucination_cases.md#ma-027), [MN-003](hallucination_cases.md#mn-003), [MN-014](hallucination_cases.md#mn-014), [MN-020](hallucination_cases.md#mn-020), [MP-005](hallucination_cases.md#mp-005), [MP-014](hallucination_cases.md#mp-014), [MP-017](hallucination_cases.md#mp-017), [MP-018](hallucination_cases.md#mp-018), [MP-023](hallucination_cases.md#mp-023), [MP-025](hallucination_cases.md#mp-025), [MP-029](hallucination_cases.md#mp-029), [MP-033](hallucination_cases.md#mp-033), [MP-035](hallucination_cases.md#mp-035), [MP-044](hallucination_cases.md#mp-044), [MP-045](hallucination_cases.md#mp-045), [MP-047](hallucination_cases.md#mp-047), [MP-058](hallucination_cases.md#mp-058), [MP-059](hallucination_cases.md#mp-059), [MT-028](hallucination_cases.md#mt-028), [SA-022](hallucination_cases.md#sa-022), [SB-004](hallucination_cases.md#sb-004), [SB-025](hallucination_cases.md#sb-025), [SB-034](hallucination_cases.md#sb-034), [SB-035](hallucination_cases.md#sb-035), [SB-036](hallucination_cases.md#sb-036), [SB-037](hallucination_cases.md#sb-037), [SB-038](hallucination_cases.md#sb-038), [SB-042](hallucination_cases.md#sb-042), [SB-049](hallucination_cases.md#sb-049), [ST-017](hallucination_cases.md#st-017), [ST-021](hallucination_cases.md#st-021), [ST-030](hallucination_cases.md#st-030)

<a id="hc02"></a>
### HC02 · 상품·절차·대상·신청과 조회의 구분

- 위치: 검색 결과 선택·주장 검증
- 발동 조건: 서로 비슷한 상품/절차 FAQ가 같이 들어옴
- 검사: claim의 subject·predicate·procedure가 source와 일치해야 함. 번호이동≠번호변경, 임대료≠변상금, 개명≠명의변경, 신청 채널 확인≠그곳에서 신청/금액 안내 가능.
- 제어: 다른 대상의 근거를 배제. 요청 대상의 근거가 남지 않으면 그 부분만 보류.
- 구현 경계: 정규화된 상품/업무 ID로 비교할 수 있는 부분은 코드로 검증. 자유 문장의 의미 대응은 별도 근거 검증이 필요.
- 실제 환각 케이스의 검토 대상(single/sub/slot): 16 / 14 / 10건. 규칙 간 중복 가능.
- 회귀 케이스: [CQ-010](hallucination_cases.md#cq-010), [CQ-012](hallucination_cases.md#cq-012), [IN-007](hallucination_cases.md#in-007), [IN-016](hallucination_cases.md#in-016), [MA-015](hallucination_cases.md#ma-015), [MA-026](hallucination_cases.md#ma-026), [MA-030](hallucination_cases.md#ma-030), [MN-005](hallucination_cases.md#mn-005), [MN-015](hallucination_cases.md#mn-015), [MN-020](hallucination_cases.md#mn-020), [MP-005](hallucination_cases.md#mp-005), [MP-010](hallucination_cases.md#mp-010), [MP-018](hallucination_cases.md#mp-018), [MP-026](hallucination_cases.md#mp-026), [MP-031](hallucination_cases.md#mp-031), [MP-036](hallucination_cases.md#mp-036), [MP-037](hallucination_cases.md#mp-037), [MP-040](hallucination_cases.md#mp-040), [MP-059](hallucination_cases.md#mp-059), [MT-003](hallucination_cases.md#mt-003), [MT-006](hallucination_cases.md#mt-006), [MT-012](hallucination_cases.md#mt-012), [MT-016](hallucination_cases.md#mt-016), [SB-035](hallucination_cases.md#sb-035)

<a id="hc03"></a>
### HC03 · 숫자의 항목·단위·집계 기간 보존

- 위치: 사실 구조화·숫자 검증
- 발동 조건: 금액·횟수·매수·기기 수·데이터량·일수가 답에 등장
- 검사: value뿐 아니라 field/unit/period/entity가 일치해야 함. 1회≠1장, 1인≠1대, 이용권 1개≠월 1권, GB≠권수.
- 제어: 단위나 필드가 다른 숫자는 해당 질문의 답에 사용하지 않기.
- 구현 경계: 추출된 typed fact끼리 값·단위를 대조하는 부분은 결정론적으로 가능. 숫자 포함 여부만 대조하면 안 됨.
- 실제 환각 케이스의 검토 대상(single/sub/slot): 10 / 9 / 7건. 규칙 간 중복 가능.
- 회귀 케이스: [IN-015](hallucination_cases.md#in-015), [IN-016](hallucination_cases.md#in-016), [MA-026](hallucination_cases.md#ma-026), [MN-015](hallucination_cases.md#mn-015), [MN-020](hallucination_cases.md#mn-020), [MP-010](hallucination_cases.md#mp-010), [MP-014](hallucination_cases.md#mp-014), [MP-019](hallucination_cases.md#mp-019), [MP-022](hallucination_cases.md#mp-022), [MP-026](hallucination_cases.md#mp-026), [MP-031](hallucination_cases.md#mp-031), [MP-033](hallucination_cases.md#mp-033), [MP-056](hallucination_cases.md#mp-056), [MT-006](hallucination_cases.md#mt-006), [SB-025](hallucination_cases.md#sb-025)

<a id="hc04"></a>
### HC04 · 조건·예외·가능과 유일함 보존

- 위치: 답변 생성·주장 검증
- 발동 조건: 보상/환불/신고/혜택 조건 또는 '만·항상·모두·불가능' 표현
- 검사: source의 조건·예외를 유지. 사용 전 전액 환불 가능 ⇒ 사용 후 환불 불가로 역추론 금지. 가능한 한 경로 ⇒ 유일한 경로로 확대 금지.
- 제어: 근거 문장의 조건을 함께 제시하고 근거 밖의 역추론·일반화를 제거.
- 구현 경계: 정형 조건은 코드로 결합. 자연어 조건/예외 보존은 의미 검증 또는 검증된 문구 템플릿 필요.
- 실제 환각 케이스의 검토 대상(single/sub/slot): 17 / 6 / 15건. 규칙 간 중복 가능.
- 회귀 케이스: [CQ-012](hallucination_cases.md#cq-012), [CQ-018](hallucination_cases.md#cq-018), [CQ-020](hallucination_cases.md#cq-020), [CQ-021](hallucination_cases.md#cq-021), [IN-007](hallucination_cases.md#in-007), [MA-007](hallucination_cases.md#ma-007), [MA-017](hallucination_cases.md#ma-017), [MN-005](hallucination_cases.md#mn-005), [MN-014](hallucination_cases.md#mn-014), [MP-006](hallucination_cases.md#mp-006), [MP-012](hallucination_cases.md#mp-012), [MP-018](hallucination_cases.md#mp-018), [MP-021](hallucination_cases.md#mp-021), [MP-023](hallucination_cases.md#mp-023), [MP-040](hallucination_cases.md#mp-040), [MP-044](hallucination_cases.md#mp-044), [MP-047](hallucination_cases.md#mp-047), [MP-058](hallucination_cases.md#mp-058), [MT-012](hallucination_cases.md#mt-012), [SA-022](hallucination_cases.md#sa-022), [SB-004](hallucination_cases.md#sb-004), [SB-037](hallucination_cases.md#sb-037), [SB-042](hallucination_cases.md#sb-042), [ST-021](hallucination_cases.md#st-021), [UD-018](hallucination_cases.md#ud-018)

<a id="hc05"></a>
### HC05 · 하위 질문·필드별 허용 사실과 문장 연결

- 위치: slot 생성·최종 병합
- 발동 조건: 복합 질문 또는 한 하위 질문 안에 알려진 값과 미확인 값이 섞임
- 검사: 각 claim에 sub-question ID와 source ID를 연결. ANSWER slot 안의 문장이 다른 미확인 질문을 대신 답하지 않는지 검사. 전역 evidence_ids 하나로는 부족.
- 제어: ABSTAIN slot 제거와 별개로 ANSWER slot의 미지원 주장만 제거. 확인된 다른 답은 남기고, 전부 미지원이면 빈 answer를 정상 허용.
- 구현 경계: slot 수/ID/출처 연결 구조는 코드로 검증 가능. 문장이 어떤 사실을 주장하는지는 추가 검증 필요. case ID로 서비스 분기하지 않음.
- 실제 환각 케이스의 검토 대상(single/sub/slot): 22 / 22 / 18건. 규칙 간 중복 가능.
- 회귀 케이스: [IN-013](hallucination_cases.md#in-013), [IN-015](hallucination_cases.md#in-015), [IN-016](hallucination_cases.md#in-016), [MA-026](hallucination_cases.md#ma-026), [MA-027](hallucination_cases.md#ma-027), [MA-030](hallucination_cases.md#ma-030), [MN-003](hallucination_cases.md#mn-003), [MN-014](hallucination_cases.md#mn-014), [MN-020](hallucination_cases.md#mn-020), [MP-005](hallucination_cases.md#mp-005), [MP-010](hallucination_cases.md#mp-010), [MP-014](hallucination_cases.md#mp-014), [MP-017](hallucination_cases.md#mp-017), [MP-019](hallucination_cases.md#mp-019), [MP-022](hallucination_cases.md#mp-022), [MP-023](hallucination_cases.md#mp-023), [MP-025](hallucination_cases.md#mp-025), [MP-026](hallucination_cases.md#mp-026), [MP-029](hallucination_cases.md#mp-029), [MP-031](hallucination_cases.md#mp-031), [MP-033](hallucination_cases.md#mp-033), [MP-035](hallucination_cases.md#mp-035), [MP-036](hallucination_cases.md#mp-036), [MP-037](hallucination_cases.md#mp-037), [MP-040](hallucination_cases.md#mp-040), [MP-044](hallucination_cases.md#mp-044), [MP-045](hallucination_cases.md#mp-045), [MP-047](hallucination_cases.md#mp-047), [MP-056](hallucination_cases.md#mp-056), [MP-058](hallucination_cases.md#mp-058), [MP-059](hallucination_cases.md#mp-059), [MT-016](hallucination_cases.md#mt-016), [ST-030](hallucination_cases.md#st-030), [UD-024](hallucination_cases.md#ud-024)

<a id="hc06"></a>
### HC06 · 매장 응답 필드 화이트리스트

- 위치: 매장 도구 어댑터·답변 생성
- 발동 조건: STORE_SEARCH 또는 현재 위치 매장 섹션을 사용
- 검사: 이 테스트 응답의 이름·주소·전화·일반 영업시간·거리만 확정 가능. parking/openingDays가 없으면 주차 가능/일요일 휴무 확정 금지. 검색 결과 없음은 모든 매장 방문 불가가 아님.
- 제어: 실제 반환 필드만 안내하고 미지원 매장 속성은 코드 고지. 새 API에 필드가 추가되면 스키마 기준을 갱신.
- 구현 경계: nullable 필드·필드 존재 여부와 템플릿은 결정론적으로 제어 가능. 일반 영업시간 문자열에서 요일을 추측하지 않음.
- 실제 환각 케이스의 검토 대상(single/sub/slot): 2 / 1 / 3건. 규칙 간 중복 가능.
- 회귀 케이스: [MP-058](hallucination_cases.md#mp-058), [ST-017](hallucination_cases.md#st-017), [ST-021](hallucination_cases.md#st-021)

<a id="hc07"></a>
### HC07 · 사용자 정보 필드·날짜 계산 경계

- 위치: USER_DATA 어댑터·날짜 계산
- 발동 조건: 개인별 나이·한도·가입일·사용 내역을 단정
- 검사: 사용자 자료에 없는 나이/개인 한도/조회 불가 사유를 만들지 않기. 기준 날짜와 가입일 비교는 코드 계산. '다음 달'만 있는 근거로 '다음 달 1일'을 만들지 않기.
- 제어: 확인된 사용자 필드만 사용하고 미제공 항목은 미제공으로 처리. 일반 FAQ 규칙과 개인 적용 자격을 구분.
- 구현 경계: 필드 존재·권한·날짜 연산은 결정론적으로 가능. 이 결과만으로 API 자체의 오류를 뜻하지 않음.
- 실제 환각 케이스의 검토 대상(single/sub/slot): 4 / 0 / 0건. 규칙 간 중복 가능.
- 회귀 케이스: [MA-017](hallucination_cases.md#ma-017), [UD-002](hallucination_cases.md#ud-002), [UD-013](hallucination_cases.md#ud-013), [UD-018](hallucination_cases.md#ud-018)

<a id="hc08"></a>
### HC08 · 멀티턴의 지시 대상 유지

- 위치: 질문 재작성·검색 전후
- 발동 조건: 그것/그 요금제/거기/다 쓰면 등 이전 턴을 참조
- 검사: 이전의 상품/장소/업무 ID를 재작성 질문에도 보존. 로밍 상품을 국내 요금제로, 임대폰을 본인 휴대폰으로 바꾸지 않기.
- 제어: 대상 ID가 사라지거나 바뀌면 재작성/재검색. 대상을 확정할 수 없으면 해당 부분을 보류.
- 구현 경계: 구조화된 대화 엔티티와 재작성 결과의 ID 비교는 코드로 가능. 이전 모델 답변은 독립 근거로 승격하지 않음.
- 실제 환각 케이스의 검토 대상(single/sub/slot): 1 / 1 / 2건. 규칙 간 중복 가능.
- 회귀 케이스: [MT-003](hallucination_cases.md#mt-003), [MT-006](hallucination_cases.md#mt-006), [MT-016](hallucination_cases.md#mt-016), [MT-028](hallucination_cases.md#mt-028)

<a id="hc09"></a>
### HC09 · 같은 대상의 상충 근거 처리

- 위치: 근거 통합
- 발동 조건: 동일 대상·항목에 즉시/다음 정산일 등 상충하는 FAQ
- 검사: 먼저 다른 상품의 자료인지 HC02로 구분하고, 같은 대상이면 적용일·권위 등 명시적 우선순위 확인.
- 제어: 우선순위 근거가 없으면 CONFLICT. 한 문서를 임의로 골라 확정하지 않기.
- 구현 경계: 정형 사실의 상충 및 우선순위 메타데이터는 코드로 검증 가능.
- 실제 환각 케이스의 검토 대상(single/sub/slot): 1 / 2 / 1건. 규칙 간 중복 가능.
- 회귀 케이스: [MA-001](hallucination_cases.md#ma-001), [MA-015](hallucination_cases.md#ma-015)

<a id="hc10"></a>
### HC10 · 금액 출력 값·부호 보존

- 위치: 최종 출력 포맷
- 발동 조건: 가격을 자연어로 다시 쓰거나 목록을 병합
- 검사: 정규화한 entity/field/value/unit가 근거 가격과 일치하고 양수 요금이 음수로 변하지 않았는지 검사.
- 제어: 검증된 typed value를 포맷터로 출력. 부호/숫자 불일치 문장을 재생성하거나 제거.
- 구현 경계: 실제 typed price를 확보하면 결정론적으로 제어 가능. 단순 숫자 전체집합 비교는 다른 상품 가격을 허용할 수 있음.
- 실제 환각 케이스의 검토 대상(single/sub/slot): 0 / 0 / 1건. 규칙 간 중복 가능.
- 회귀 케이스: [OS-016](hallucination_cases.md#os-016)

<a id="hc11"></a>
### HC11 · '자료 없음' 고지의 범위를 필드에 한정

- 위치: 답변·코드 고지 구성
- 발동 조건: 사용자 조회에는 없지만 FAQ에는 일반 규칙이 있음
- 검사: '개인 포인트 잔액 없음'을 '포인트 유효기간도 알 수 없음'으로 확대하지 않기. 명시된 FAQ 조건이 있는데 없다고 단정하지 않기.
- 제어: 누락된 필드만 고지하고 확인된 FAQ 사실은 남기기.
- 구현 경계: 조회 결과의 missing_fields와 FAQ supported_fields를 분리. 한 문항 전체를 무조건 보류시키지 않음.
- 실제 환각 케이스의 검토 대상(single/sub/slot): 3 / 0 / 0건. 규칙 간 중복 가능.
- 회귀 케이스: [IN-013](hallucination_cases.md#in-013), [MA-011](hallucination_cases.md#ma-011), [UD-024](hallucination_cases.md#ud-024)

<a id="hc12"></a>
### HC12 · 장소 정규화·조회 실패 안내를 코드로 제한

- 위치: 장소 추출·도구 실패 처리
- 발동 조건: 모호하거나 오타인 장소 또는 조회 실패
- 검사: 입력·검증된 지오코딩 결과에 없는 공항명/동명을 정확한 장소로 단정하지 않기.
- 제어: 실패 사유별 코드 안내를 사용하고 검증되지 않은 장소 예시·내부 독백을 본문에 넣지 않기.
- 구현 경계: 확정된 place ID와 실패 사유 enum 기반으로 제어 가능.
- 실제 환각 케이스의 검토 대상(single/sub/slot): 1 / 1 / 0건. 규칙 간 중복 가능.
- 회귀 케이스: [MP-044](hallucination_cases.md#mp-044), [ST-027](hallucination_cases.md#st-027)

## 7. 판정 재교정·데이터 정합성 검토

- [MA-007](hallucination_cases.md#ma-007): single·sub·slot 모두 114 안내를 유지하고 적용 조건을 쓰지 않는데 single만 실질적 환각 판정. 통계상 감소를 실제 수정으로 단정하지 말고 재교정 필요.
- [MT-003](hallucination_cases.md#mt-003): 세 안의 검색 FAQ와 국내 요금제 설명이 거의 같음에도 sub만 실질적 환각 판정. 공식 통계는 유지하되 slot이 이 문제를 해결했다고 해석하지 않음.
- [MT-012](hallucination_cases.md#mt-012): 비슷한 고객센터·매장 확인 권고가 세 안에 남는데 single·slot만 실질적 환각. 확정된 금액 공지와 일반 확인 권고의 경계를 Judge 재교정할 필요.
- [UD-002](hallucination_cases.md#ud-002): gold는 다음 달 1일을 기대하지만 실제 받은 FAQ에는 다음 달만 있어 정확도와 근거 판정이 엇갈림. 모델만 고칠 문제가 아니라 정답·검색 근거의 정합성도 확인해야 함.

이 표시는 기존 환각 수를 임의로 수정하지 않는다. 특히 MA-007·MT-003은 같은 위험 문장이 남아 있으므로 통계상 감소를 수정 성공으로 인정하기 전에 고정 기준으로 재검토해야 한다.

## 8. 원장·재생성·검증

- 환각을 한 번이라도 보인 **72개 케이스 전부**: [케이스 원장](hallucination_cases.md). 질문·기대 하위 질문·실제 본문·slot 원본·Judge 주장/사유·제어 후보·원본 위치를 포함한다.
- 기계 판독: [hallucination_progression.json](hallucination_progression.json). 유형별·경로별 전체 분모/공통 분모, 정확한 증감 ID와 원본 SHA-256을 포함한다.
- 수동 제어 라벨: [hallucination_controls.json](../../../analysis/hallucination_controls.json)
- 재생성: `node scripts/docgen/pipeline_hallucination_progression.js`
- 검증: 390개 고유 ID/안, 동일 질문·기대값, score와 최종 병합 Judge의 일치, 모든 Judge 입력 해시, 72개 제어 라벨의 누락/초과 없음 확인. 모델/API 호출 없음.
