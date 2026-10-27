# pipeline_test_v5 · try1 — 전체 요약 (all_summary): feat/277 전체 파이프라인 390건 (2026-10-23)

> **로컬 BE `feat/277-sub-answer`를 그대로 실행한 전체 파이프라인 평가(입력·하위 질문·출력 가드, 실제 조회 도구, 코드 고지, 미응답 수집, DB 저장까지)** · 생성 2026-10-23(이 PC, 실행 사본·복제 DB) · LLM Judge `pv5-feat277-try1` 356건
> 이전: [pipeline_test_v4 · try2](../../../pipeline_test_v4/try2/results/all_summary.md)(slot, 같은 390건 — 이 문서의 비교 기준) · 다음: [pipeline_test_v6](../../../pipeline_test_v6/try1/results/all_summary.md)(평가 계정에 회선 데이터 추가)

[SETUP](../../SETUP.md) · [환각 케이스](review/hallucination_cases.md) · [오답 케이스와 원인](review/failure_cases.md) · [비교 JSON](summary/comparison.json) · [공통 집계 JSON](summary/report_data.json) · [검증 JSON](summary/verification.json)

**한 줄 결론: 실제 브랜치 흐름 전체를 켜자 정답이 v4 slot보다 유의하게 떨어졌다(공통 350건 279 → 250, 짝 17 / 46, p<0.001). 가장 큰 원인은 평가 계정의 사용자 정보 섹션 "이용 중인 회선이 없습니다"다 — 모델이 이를 "요금·미납·사용량·약정이 없다"로 읽어 환각 46건 중 19건(UD 10)을 만들었고, 일반 질문(SA·CQ·MA)까지 번졌다. 그래서 다음 회차(v6)는 회선 데이터를 넣고 다시 쟀다.**

목차: [범위와 기준](#테스트-범위와-기준) · [전체 결과](#전체-결과--judge-우선) · [짝 비교](#같은-문항끼리-비교) · [가드·도구 증거](#가드-및-실제-도구-실행-증거) · [항목별](#항목별-결과) · [환각 종류](#환각-종류별-비교) · [환각 패턴](#환각-패턴--회선-없음을-값-없음으로-읽음) · [실패 원인](#실패-원인) · [고지](#고지누출) · [판단과 다음](#판단과-다음) · [환각 케이스](#현재-환각-케이스와-판정-사유) · [전체 판정 목록](#전체-문항-판정-목록) · [검증·보관](#검증보관-위치)

## 테스트 범위와 기준

- 대상: 로컬 BE `feat/277-sub-answer@012ad604997c6286ea7c17261a39045e4af8ac31` + 2026-10-23T14:03:02.6365658+09:00 미커밋 소스. 원본 소스를 외부 실행 사본으로 복사해 고정했다.
- 실행 중 원본 BE가 `f7e6f50ca03081777dbabab100493f9f887d383e`으로 커밋됐다. 987개 원본 파일을 대조한 결과 22개는 줄바꿈만 달랐고, 내용 차이는 프롬프트 README 한 파일뿐이다. 실제 실행 코드·프롬프트 내용은 해당 커밋과 동일하다. 관측 훅을 역변환한 소스 해시도 모두 확인했다.
- 실제 HTTP 접수·Worker·입력 가드·질문 분리/가드·검색/문장 필터·intent별 자료·실제 조회 도구·답변 생성·출력 가드·코드 고지·최종 저장·미응답 수집을 현재 브랜치 로직으로 실행했다.
- 관측 코드만 외부 사본에 추가했다. 가드 호출이나 판정은 바꾸지 않았다. ABSTAIN 칸의 출력 가드 생략은 현재 브랜치의 정상 동작이다.
- pipeline_v4와 동일한 390개 케이스·FAQ 1,688건(원문 차이 0건). 모델 qwen3:4b-instruct-2507-q4_K_M, temperature 0 및 bge-m3:567m 임베딩 digest도 v4와 같다.
- 별도 DB ubot_feat277_eval_20261023 / Redis DB 14 / HTTP 8082. 신규 브랜치 마이그레이션은 복제 DB에만 적용했다. 생성 동시성 1, Judge 동시성 4.
- Judge: pipeline-judge-2 / Codex gpt-6-sol / medium. 가드 후 사용자에게 실제 전달된 본문·코드 안내를 평가했다. 신규 trace는 실제 문장 필터 후 FAQ 원문과 실제 도구 반환값을 근거로 제공한다. v4의 기존 판정은 당시 저장된 자료 구성 그대로 사용한다.
- 환각 = grounding 1~3(is_grounded=false). 빈 모델 본문도 정상 보류로 분모에 포함한다. 검색 단계 보류와 실행 실패·전체 가드 차단은 별도 집계하며 환각 없음으로 대체하지 않는다.

## 전체 결과 — Judge 우선

| 지표 | pipeline_v4 slot | feat/277 |
| --- | --- | --- |
| 전체 문항 | 390 | 390 |
| Judge 판정 수 | 352 | 356 |
| 정답 | 280/352 (79.55%) | 254/356 (71.35%) |
| 실질적 환각 | 36/352 (10.23%) | 46/356 (12.92%) |
| 최종 status 일치 | 310/390 (79.49%) | 274/390 (70.26%) |
| Judge의 고지 검출 | 8 | 13 |
| 실행 실패·전체 가드 차단 | 1 | 1 |
| 검색 통과 FAQ 적중률 | 83.08% | 84.62% |
| 최종 질문 API 평균 대기 | 4186ms | 4668ms |

- 정답이면서 실질적 환각 없음: 248/356. 정확도와 환각은 별도 기준이다.
- 경로별 문항 수: {"LLM":356,"CHAT-013":33,"CHAT-021":1}.
- 검색 단계 보류: 33건. 실행 실패·전체 가드 차단 세부: {"CHAT-021":1}. LLM-006은 출력 가드의 전체 차단이다.
- Judge 분모에 포함한 빈 모델 본문: 116건.

## 같은 문항끼리 비교

- 양쪽 Judge가 있는 공통 350문항. 정답 279→250, 환각 35→46건.
- 새 정답 17건 / 정답 상실 46건. 환각 사라짐 20건 / 새 환각 31건.
- 새 기능·가드·사용자 정보 수집·검색 입력이 함께 바뀐 버전 비교다. 차이를 slot 출력 형식 하나의 효과로 해석하지 않는다.

| 지표 (McNemar 정확 검정) | 공통 | v4 slot | feat/277 | feat/277만 / v4만 | p |
| --- | --- | --- | --- | --- | --- |
| Judge 정답 | 350 | 279 | 250 | 17 / 46 | **<0.001** |
| 환각 없음 | 350 | 315 | 304 | 20 / 31 | 0.161 |
| 정답 + 환각 없음 | 350 | 274 | 244 | 18 / 48 | **<0.001** |
| 모델 고지 없음(Judge) | 350 | 342 | 338 | 8 / 12 | 0.503 |
| 최종 status 일치 | 390 | 310 | 274 | 27 / 63 | **<0.001** |
| 통과 | 390 | 289 | 254 | 29 / 64 | **<0.001** |

- feat/277만 정답(17): CQ-021, IN-011, MN-020, MP-001, MP-006, MP-014, MP-023, MP-040, MP-047, MP-058, MP-059, OS-016, SB-036, SB-037, SB-042, SB-049, ST-003 — v4 slot의 "자료에 없음 → 안 된다" 단정(SB-037·042·049, MP-047·058)이 출력 가드·새 프롬프트로 빠진 경우가 많다.
- v4 slot만 정답(46): CQ-005·008·011·012·018·022·027·028, IN-007, MA-005·014·015·020·024·034, MP-009·012·016·017·018·028·046, MT-004·007·016·021·026, OS-022·023·026, SA-004·022·024·041, SB-011·027, ST-029, UD-004·007·009·011·012·013·017·024·030 — **19건은 출력 가드가 칸을 ABSTAIN으로 바꾼 문항**(CQ-005·011·018, IN-007, MA-005·014·015·020·024·034, MT-004·007·016·026, OS-022·026, SA-004·024·041)이고, UD·CQ·SA의 나머지는 대부분 회선 없음 추론(아래 환각 패턴)이다. 가드 전 답변은 Judge하지 않아 가드 오탐 여부는 확정하지 않지만, 정답 상실의 약 40%가 가드 개입 문항이다.

## 가드 및 실제 도구 실행 증거

| 관측 지표 | 최종 390문항 기준 |
| --- | --- |
| 입력 가드 호출/완료 문항 | 390 / 390 |
| 하위 질문 가드 호출 문항 | 214 |
| 출력 가드 호출 문항 / 칸 검사 수 | 261 / 319 |
| 출력 가드가 내용 제거·거부한 문항 | 33 |
| 출력 가드로 ABSTAIN이 된 칸 | 34 |
| 전체 출력 차단(LLM-006) | 0 |
| LLM 답변 후 미응답 수집 단계 완료 문항 | 356 |
| 수집된 미응답 후보 수(중복 정리 전) | 227 |
| 도구 경로에서 칸을 합친 문항 | 24 |
| 가드 후 답변과 최종 HTTP 답변 일치 | 356 / 356 |
| DB 최종 작업 상태 일치 | 390 / 390 |
| DB 저장 답변과 HTTP 답변 일치 | 356 / 356 |

- 실제 도구 호출 수: {"getBillingByMonth":79,"getUsageByMonth":80,"findNearbyStores":38}.
- 가드 개입 33문항의 최종 결과: 판정 33, 정답 6, 환각 2건. 가드 전 답변은 Judge로 따로 판정하지 않았으므로 이 수치를 가드 오탐·탐지 성능으로 해석하지 않는다.
- DB 미응답 저장 결과(source·reason별): [{"source":"LLM_MODEL","reason":"LLM_ABSTAIN","count":111},{"source":"OUTPUT_GUARD","reason":"INSUFFICIENT_FAQ","count":31},{"source":"RETRIEVAL","reason":"INSUFFICIENT_FAQ","count":85}]. 미처리 미응답 outbox 0건. 후보 수와 저장 수는 중복·반려 처리로 다를 수 있다.
- 검색 단계에서 종료된 문항은 답변 생성·출력 가드까지 가지 않고, 답하지 않는 칸은 현재 브랜치가 출력 가드를 호출하지 않는다. 그 경로 구분을 유지했다.
- 실행 경로 전체를 켠 평가이며, 모든 조건 분기의 전수 커버리지를 뜻하지 않는다. 390문항에 없는 공격·금칙어 조건은 별도로 기존 가드 회귀 테스트에서 확인했다.

| 출력 가드 사유 | 검사 수 | 해당 문항 수 |
| --- | --- | --- |
| ANSWER_ERROR | 33 | 32 |
| FALSE_EXECUTION | 1 | 1 |
| FAQ_SHORTAGE_SUSPECTED | 43 | 41 |
| UNCLASSIFIED | 11 | 10 |

## 항목별 결과

| 항목 | 판정 수 | v4 정답 | feat/277 정답 | v4 환각 | feat/277 환각 | feat/277 실패·전체 차단 |
| --- | --- | --- | --- | --- | --- | --- |
| CQ 모호한 질문 | 29 | 24/28 | 18/29 | 2 | 7 | 0 |
| IN 한 질문 내부 일부 미확인 | 20 | 4/19 | 4/20 | 2 | 2 | 0 |
| MA 복합·모두 답할 수 있음 | 39 | 31/39 | 25/39 | 2 | 8 | 0 |
| MN 복합·모두 답할 수 없음 | 15 | 13/15 | 14/15 | 2 | 1 | 0 |
| MP 복합·답할 수 있음+없음 | 58 | 40/58 | 41/58 | 15 | 7 | 0 |
| MT 멀티턴 | 27 | 22/27 | 17/27 | 3 | 1 | 1 |
| OS 범위 밖 포함 | 15 | 14/15 | 12/15 | 1 | 0 | 0 |
| SA 단일·답할 수 있음 | 50 | 50/50 | 46/50 | 0 | 2 | 0 |
| SB 단일·묻는 값 없음 | 43 | 37/43 | 39/43 | 7 | 4 | 0 |
| ST 매장 | 30 | 22/30 | 22/30 | 2 | 4 | 0 |
| UD 사용자 정보 | 30 | 23/28 | 16/30 | 0 | 10 | 0 |

### MP — 답할 수 있는 내용과 없는 내용이 섞인 복합 질문

- v4: 정답 40/58, 환각 15/58. feat/277: 정답 41/58, 환각 7/58.
- 가드가 칸을 ABSTAIN으로 바꾼 MP 문항: MP-019, MP-029, MP-037, MP-043, MP-058, MP-059.
- MP 하위 판정: {"CORRECT_ANSWER":51,"CORRECT_DECLINE":52,"MISSING_ANSWER":11,"UNSUPPORTED_ANSWER":6,"WRONG_ANSWER":1}.

## 환각 종류별 비교

- 실질적 환각(grounding 1~3) 문항 안에서 해당 종류가 나온 문항 수다. 한 문항에 여러 종류가 겹칠 수 있다.

| 종류 | v4 전체 판정 | feat/277 전체 판정 | 공통 문항 v4 | 공통 문항 feat/277 |
| --- | --- | --- | --- | --- |
| FABRICATION | 22 | 17 | 21 | 17 |
| MISATTRIBUTION | 8 | 13 | 8 | 13 |
| UNSUPPORTED_GENERALIZATION | 11 | 21 | 11 | 21 |
| SILENT_CONFLICT_PICK | 1 | 1 | 1 | 1 |
| FALSE_COMPLETION | 0 | 0 | 0 | 0 |

## 환각 패턴 — "회선 없음"을 "값 없음"으로 읽음

- 평가 계정은 회선이 없어 사용자 정보 섹션에 **"이용 중인 회선이 없습니다."**가 들어간다. 모델은 이를 조회 결과로 읽고 **요금·미납·사용량·약정·할부·포인트가 "없다", 요금이 "발생하지 않는다"로 단정**했다. Judge 사유에 회선이 나오는 환각이 **46건 중 19건**(UD 10 · CQ 3 · SA 2 · MA 2 · IN 1 · SB 1)이다.
  - UD-009 "밀린 요금이 없습니다." · UD-007 "이용 중인 회선이 없으므로 데이터 사용량이 없습니다." · UD-024 "포인트를 적립하거나 보유하고 있지 않으며, 잔액은 0점입니다." · UD-029 "할부가 남아 있지 않습니다. 중도 완납이 불가능합니다."
  - 일반 질문에도 번진다: SA-019 "현재 이용 중인 회선이 없기 때문에 요금이 청구되지 않았습니다." · SA-022 "로밍 패스는 이용 중인 회선이 있어야 신청 및 취소가 가능합니다 … 따라서 환불이 불가능한 상황입니다." · CQ-022 "요금을 납부하지 못한 상황이나 미납 상태는 발생할 수 없습니다."(사용자는 요금을 내지 못했다고 함) · MA-011 · SB-011.
  - v4 slot은 같은 계정이었지만 사용자 정보 섹션 문구가 달라 이 유형이 거의 없었다(UD 환각 0). feat/277의 새 섹션은 "이 자료에는 사용량·청구서 기록이 없습니다. … 도구를 호출해 조회하세요" 문장과 함께 들어가고, 회선이 없어 도구도 빈 결과를 돌려준다.
- **나머지는 v1부터 반복되는 패턴이다.** 자료에 없음 → 없다·안 된다(MP-029 "개통비는 따로 없습니다." · MP-044 "거기에서 유심을 판매할 수는 없습니다." · MP-046 "음악을 오프라인으로 저장할 수는 없습니다." · ST-021 "근처 매장 중에 일요일에 운영하는 곳은 없습니다."), 비슷한 FAQ 오적용(CQ-010 번호 변경 → 번호이동, CQ-027 납부일 변경 → 계좌 변경, MA-023 번호이동 개통 시간 → 인증 재시도, SB-011 임대료 → 분실 변상금), 조건 생략(MP-021 추천 포인트).
- **매장 도구 결과 오독**: ST-006 가장 가까운 매장을 0.4km 매장으로(조회 결과 0.1km 매장이 있음) · ST-017 주차 가능 여부를 조회 결과에 없는데 "가능"으로 · ST-029 서울 영등포 타임스퀘어점을 뉴욕 타임스퀘어 근처로(도구가 장소를 잘못 찾은 것을 그대로 안내).
- 환각 종류: 조건 누락·범위 확대가 11 → 21 케이스로 가장 많이 늘었다 — 회선 없음 추론 대부분이 이 종류(UNSUPPORTED_GENERALIZATION)다.

## 실패 원인

오답 케이스 전체(원인 분류·Judge 하위 판정 사유)는 [review/failure_cases.md](review/failure_cases.md).

| 원인 (Judge 오답, 기계 분류) | v4 slot | feat/277 |
| --- | --- | --- |
| 답할 수 있는 하위 질문을 보류 + 본문 빔 | 24 | **44** |
| 답할 수 있는 하위 질문을 보류, 본문은 씀 | 6 | 11 |
| 답할 수 없는 하위 질문을 ANSWER로 두고 답함 | 20 | 19 |
| 하위 질문 수 불일치(질문 분리) | 3 | 7 |
| statuses 배열 잘못 | 0 | 2 |
| status는 맞음, 본문 오류·누락 | 19 | 18 |
| 그 밖 | 0 | 1 |
| 합계 | 72 | 102 |

- **과잉 보류가 24 → 44로 다시 늘었다.** 빈 모델 본문 97 → 116, Judge 하위 판정 누락 36 → 68. 두 경로가 겹친다.
  1. **출력 가드가 ANSWER 칸을 ABSTAIN으로 바꿈** — 가드 개입 33문항(34칸) 중 최종 정답 6. 사유는 ANSWER_ERROR 33 · FAQ_SHORTAGE_SUSPECTED 43 · UNCLASSIFIED 11 · FALSE_EXECUTION 1(검사 수 기준). 정답 상실 46건 중 19건이 가드 개입 문항이다.
  2. **모델이 회선 없음을 근거로 보류하거나 단정** — UD status 일치 23 → 14, UD 정답 23/28 → 16/30.
- 지어냄(19)과 본문 오류(18)는 v4 slot과 거의 같다 — 출력 구조가 같으니 ANSWER 칸 안의 단정은 그대로다.
- 하위 질문 수 불일치 3 → 7: 하위 질문 가드(214문항)가 질문 분리 결과를 바꾼 경우가 섞여 있다.
- 채점 실패 원인 STATUS_MISMATCH 56 → 94는 위 두 경로의 status 변화(SA 50 → 41, MT 24 → 15, UD 23 → 14)다.

## 고지·누출

- 모델 고지는 v4 slot 수준을 유지했다(패턴 12 → 11, Judge 8 → 13, 이중 고지 1 → 4). slot 구조에서 비ANSWER 칸 본문은 사용자에게 나가지 않는다.
- 코드 안내 170 → 201 — 가드가 칸을 ABSTAIN으로 바꾼 문항에도 코드 안내가 붙어 늘었다. 사용자에게는 "문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다."가 더 자주 나간다.
- 되묻기 0 · 0.

## 판단과 다음

- **feat/277 브랜치 그대로는 v4 slot보다 정답이 낮다**(짝 17 / 46, p<0.001). 출력 구조 문제가 아니라 그 위에 얹힌 두 가지 때문이다.
  1. 평가 계정의 "이용 중인 회선이 없습니다" → 값 없음 단정(환각 19건, UD 정답 하락). 실제 사용자는 회선이 있으므로 **평가 데이터가 현실과 다른 문제**이기도 하다. → [pipeline_test_v6](../../../pipeline_test_v6/try1/results/all_summary.md)에서 평가 계정에 회선·사용량·청구 데이터를 넣고 UD 라벨을 다시 매겨 쟀다.
  2. 출력 가드의 ANSWER 칸 차단(정답 상실 19건). 가드 전 답변을 따로 Judge해 가드 오탐률을 재는 것이 다음 확인 대상이다.
- "회선 없음"은 조회 결과가 아니라 계정 상태다. 사용자 정보 섹션에서 **"없음"을 값으로 읽히지 않게 쓰는 것**(예: "회선 정보 없음 — 요금·사용량은 조회하지 않음")이 v4 try2에서 본 "조회 결과에 없음 → 미납 없음"(UD-009)과 같은 과제다.
- 가드·도구·DB 저장 경로는 검증 기준을 모두 통과했다(HTTP·가드 후·DB 답변 356/356 일치, 미응답 outbox 0).

## 현재 환각 케이스와 판정 사유

### SA-022 · 단일·답할 수 있음

> 여행이 취소되면 쓰지 않은 로밍 패스를 환불받을 수 있나요?

- 최종 status: ANSWER; grounding 2; 정확도 INCORRECT.

> 여행이 취소되었더라도 로밍 패스를 사용하지 않았다면 가입을 취소하고 전액 환불받을 수 있습니다. 다만, 로밍 패스는 이용 중인 회선이 있어야 신청 및 취소가 가능하므로, 현재 이용 중인 회선이 없습니다. 따라서 로밍 패스 가입이 없거나 사용되지 않았을 가능성이 높습니다.
> 
> 이용 중인 회선이 없기 때문에 로밍 패스는 가입되지 않았거나 사용되지 않았을 가능성이 높습니다. 따라서 환불이 불가능한 상황입니다.

- FABRICATION: 로밍 패스는 이용 중인 회선이 있어야 신청 및 취소가 가능합니다.
  - 근거 이탈 사유: 제공된 자료에는 신청·취소에 회선이 필요하다는 조건이 없습니다.
- UNSUPPORTED_GENERALIZATION: 이용 중인 회선이 없으므로 로밍 패스가 가입되지 않았거나 사용되지 않았을 가능성이 높습니다.
  - 근거 이탈 사유: 현재 회선 정보만으로 로밍 패스의 가입·사용 상태를 추정할 근거가 없습니다.
- FABRICATION: 따라서 환불이 불가능한 상황입니다.
  - 근거 이탈 사유: 환불 불가를 판단할 가입·사용 기록이 없으며, FAQ는 출국 전 사용 미시작 시 전액 환불이 가능하다고 안내합니다.

### ST-017 · 매장

> 강남역 근처 매장 중에 주차되는 곳 알려 주세요.

- 최종 status: ANSWER; grounding 3; 정확도 INCORRECT.

> 강남역 근처에 주차가 가능한 매장은 다음과 같습니다: 강남역12번출구점(0.1km), 강남역6번출구점(0.2km)입니다.
> 
> 주차가 가능한 매장 중 가장 가까운 곳은 강남역12번출구점으로, 거리는 0.1km입니다.

- FABRICATION: 강남역12번출구점과 강남역6번출구점은 주차가 가능합니다.
  - 근거 이탈 사유: 매장 조회 결과에는 두 매장의 주차 가능 여부가 없습니다.

### CQ-008 · 모호한 질문

> 요금이 많이 나왔어요.

- 최종 status: ANSWER; grounding 3; 정확도 INCORRECT.

> 이용 중인 회선이 없으므로 요금이 많이 나왔을 가능성이 없습니다. 요금 상세 내역을 확인할 수 없습니다.
> 
> 이용 중인 회선이 없으므로 데이터 추가 사용, 로밍, 소액결제, 부가서비스 등의 사용 내역을 확인할 수 없습니다.

- UNSUPPORTED_GENERALIZATION: 이용 중인 회선이 없으므로 요금이 많이 나왔을 가능성이 없습니다.
  - 근거 이탈 사유: 현재 이용 중인 회선이 없다는 정보만으로 과거 또는 현재 청구 요금이 많이 나왔을 가능성을 배제할 수 없습니다.

### CQ-010 · 모호한 질문

> 번호이동 하고 싶어요.

- 최종 status: ANSWER; grounding 3; 정확도 INCORRECT.

> 번호이동을 원하시면 휴대폰 번호 변경을 신청하시면 됩니다. 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있습니다.

- MISATTRIBUTION: 번호이동을 원하면 휴대폰 번호 변경을 신청하면 된다.
  - 근거 이탈 사유: 휴대폰 번호 변경 FAQ의 절차를 기존 번호를 유지하는 번호이동에 잘못 적용했습니다.

### CQ-012 · 모호한 질문

> eSIM으로 바꾸고 싶어요.

- 최종 status: ANSWER; grounding 3; 정확도 INCORRECT.

> eSIM으로 바꾸려면 eSIM을 지원하는 휴대폰이 필요하며, Ubot 앱 또는 홈페이지에서 eSIM 가입을 신청하면 QR 코드가 발급되며 휴대폰 설정에서 코드를 촬영하면 개통됩니다. 또한, 매장에서도 eSIM 발급이 가능합니다.

- MISATTRIBUTION: eSIM으로 바꾸려면 앱·홈페이지에서 eSIM 가입을 신청하거나 매장에서 발급받으면 됩니다.
  - 근거 이탈 사유: 가입·발급 절차에 관한 FAQ 1274를 기존 유심의 eSIM 전환 절차에 적용했습니다.

### CQ-015 · 모호한 질문

> 결합 할인 받고 싶어요.

- 최종 status: ANSWER; grounding 2; 정확도 INCORRECT.

> Ubot 가족 결합이나 휴대폰과 인터넷의 홈 결합 할인은 현재 이용 중인 회선이 없기 때문에 적용되지 않습니다. 인터넷과 IPTV 결합의 할인은 가입 내역에서 확인할 수 있으나, 현재 가입 내역이 없기 때문에 확인할 수 없습니다.
> 
> 현재 이용 중인 회선이 없기 때문에 결합 할인을 받을 수 없습니다. 회선을 가입하거나 가입 내역을 확인해야 할인을 받을 수 있습니다.

- UNSUPPORTED_GENERALIZATION: 현재 가입 내역이 없기 때문에 인터넷과 IPTV 결합 할인을 확인할 수 없습니다.
  - 근거 이탈 사유: 이용 중인 회선이 없다는 정보만으로 인터넷·IPTV 가입 내역까지 없다고 단정할 수 없습니다.
- FABRICATION: 가입 내역을 확인해야 결합 할인을 받을 수 있습니다.
  - 근거 이탈 사유: 제공된 FAQ는 가입 내역에서 할인 금액을 확인할 수 있다고만 하며, 확인을 할인 신청 조건으로 제시하지 않습니다.

### CQ-022 · 모호한 질문

> 요금을 못 냈어요.

- 최종 status: ANSWER; grounding 1; 정확도 INCORRECT.

> 이용 중인 회선이 없으므로 요금을 납부하지 못한 상황은 존재하지 않습니다. 따라서 요금 미납 상태는 발생할 수 없습니다.

- UNSUPPORTED_GENERALIZATION: 이용 중인 회선이 없으므로 요금을 납부하지 못한 상황이나 미납 상태는 발생할 수 없습니다.
  - 근거 이탈 사유: 현재 이용 중인 회선이 없다는 정보만으로 미납 요금이 없다고 단정할 수 없으며, 사용자는 요금을 내지 못했다고 밝혔습니다.

### CQ-026 · 모호한 질문

> 가입하고 싶어요.

- 최종 status: ANSWER; grounding 3; 정확도 INCORRECT.

> 가입을 원하시면 본인 신분증을 준비하시고 고객센터나 AI 챗봇으로 문의해 주세요. 가입 유형에 따라 추가 서류가 필요할 수 있습니다.

- MISATTRIBUTION: 가입을 원하면 고객센터나 AI 챗봇으로 문의하면 된다.
  - 근거 이탈 사유: 고객센터·AI 챗봇 문의는 멤버십 관련 FAQ의 안내이며, 가입 방법으로 제시된 근거는 아닙니다.

### CQ-027 · 모호한 질문

> 자동이체 바꾸려고요.

- 최종 status: ANSWER; grounding 3; 정확도 INCORRECT.

> 자동이체를 바꾸려면 Ubot 앱 또는 홈페이지에서 본인인증 후 납부 방법 메뉴에서 납부일을 10일, 15일, 21일, 25일 중 하나로 설정할 수 있습니다. 변경은 신청한 다음 달 청구분부터 적용됩니다.

- MISATTRIBUTION: 자동이체를 바꾸려면 납부일을 10일, 15일, 21일, 25일 중 하나로 설정하며 다음 달 청구분부터 적용됩니다.
  - 근거 이탈 사유: 납부일 변경에 관한 FAQ 1161의 내용을 계좌 변경 질문에 적용했습니다.

### IN-009 · 한 질문 내부 일부 미확인

> 데이터 쉐어링 이용 조건을 비용까지 포함해서 알려 주세요.

- 최종 status: PARTIAL; grounding 3; 정확도 INCORRECT.

> 데이터 쉐어링은 5G 스탠다드 이상 요금제에서 본인 명의 서브 회선을 최대 2개까지 연결할 수 있으며, 앱의 부가서비스 메뉴나 고객센터, 매장에서 신청할 수 있습니다. 그러나 사용자 정보에 따르면 현재 이용 중인 회선이 없어 데이터 쉐어링을 적용할 수 없습니다. 따라서 비용은 발생하지 않으며, 데이터 쉐어링 이용 조건에 대한 비용은 적용되지 않습니다.
> 
> 문의하신 내용 중 일부는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- FABRICATION: 비용은 발생하지 않으며, 데이터 쉐어링 이용 조건에 대한 비용은 적용되지 않습니다.
  - 근거 이탈 사유: 제공된 자료에는 데이터 쉐어링 비용 정보가 없습니다.

### IN-015 · 한 질문 내부 일부 미확인

> VIP 영화 혜택 사용 조건을 예매 가능 매수까지 알려 주세요.

- 최종 status: ANSWER; grounding 2; 정확도 INCORRECT.

> VIP 영화 혜택의 사용 조건은 매월 영화 예매 1회를 받을 수 있으며, 예매 가능 매수는 1회로 제한됩니다.
> 그러나 사용자 정보에 따르면 현재 이용 중인 회선이 없어 해당 혜택을 적용할 수 없습니다.
> 
> 예매 가능 매수는 1회입니다.
> 이는 FAQ에서 명시된 '매월 영화 예매 1회'에 기반합니다.
> 그러나 사용자 정보에 따르면 현재 이용 중인 회선이 없어 실제 예매가 불가능합니다.

- FABRICATION: 예매 가능 매수는 1회로 제한됩니다.
  - 근거 이탈 사유: FAQ의 ‘매월 영화 예매 1회’는 이용 횟수이며, 예매 가능 매수는 자료에 없습니다.
- UNSUPPORTED_GENERALIZATION: 이용 중인 회선이 없어 해당 혜택을 적용할 수 없고 실제 예매가 불가능합니다.
  - 근거 이탈 사유: 회선이 없다는 정보만으로 VIP 영화 혜택 이용 불가를 확정할 근거가 없습니다.

### MA-001 · 복합·모두 답할 수 있음

> 요금제는 한 달에 몇 번 바꿀 수 있고, 바꾸면 언제부터 적용돼요?

- 최종 status: ANSWER; grounding 3; 정확도 INCORRECT.

> 요금제는 한 달에 1회 변경할 수 있습니다. 이번 달에 이미 요금제를 변경했다면 다음 달에 다시 변경할 수 있습니다.
> 
> 요금제 변경은 변경 조건에 따라 즉시 또는 다음 정산일부터 적용될 수 있습니다. 바뀐 요금제 기준 사용량은 앱 첫 화면에서 바로 확인할 수 있으며, 요금제 변경일을 기준으로 나눠 계산된 요금은 다음 달 청구서에서 확인할 수 있습니다.

- SILENT_CONFLICT_PICK: 요금제 변경은 변경 조건에 따라 즉시 또는 다음 정산일부터 적용될 수 있습니다.
  - 근거 이탈 사유: 받은 FAQ 68과 FAQ 1126의 적용 시점이 충돌하지만 이를 알리지 않고 FAQ 68의 조건부 설명을 확정해 제시했습니다.

### MA-003 · 복합·모두 답할 수 있음

> 넘버플러스 월 요금과 해지하면 두 번째 번호가 어떻게 되는지 알려 주세요.

- 최종 status: PARTIAL; grounding 3; 정확도 INCORRECT.

> 넘버플러스의 월 요금은 3,300원입니다. 넘버플러스를 해지하면 두 번째 번호를 더 이상 사용할 수 있습니다.
> 
> 문의하신 내용 중 일부는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- FABRICATION: 넘버플러스를 해지하면 두 번째 번호를 더 이상 사용할 수 있습니다.
  - 근거 이탈 사유: 제공된 FAQ는 해지 후 두 번째 번호를 더 이상 사용할 수 없다고 명시합니다.

### MA-011 · 복합·모두 답할 수 있음

> 일시정지 기간 요금은 얼마고, 유료 부가서비스 요금도 나오나요?

- 최종 status: ANSWER; grounding 3; 정확도 INCORRECT.

> 일시정지 기간에는 월 3,850원이 일할 계산되어 청구됩니다. 다만, 이용 중인 회선이 없으므로 해당 요금은 적용되지 않습니다.
> 
> 유료 부가서비스 요금은 청구될 수 있지만, 이용 중인 회선이 없으므로 해당 요금은 발생하지 않습니다.

- UNSUPPORTED_GENERALIZATION: 이용 중인 회선이 없으므로 일시정지 요금과 유료 부가서비스 요금이 발생하지 않습니다.
  - 근거 이탈 사유: 이용 중인 회선이 없다는 정보만으로 해당 요금의 적용 여부나 실제 청구액을 확정할 수 없습니다.

### MA-017 · 복합·모두 답할 수 있음

> 휴대폰 결제 기본 한도는 얼마고, 최대 얼마까지 올릴 수 있어요?

- 최종 status: ANSWER; grounding 3; 정확도 CORRECT.

> 휴대폰 결제 기본 한도는 월 30만 원이며, 앱에서 1만 원 단위로 최대 100만 원까지 변경할 수 있습니다. 만 19세 미만의 경우 기본 한도는 월 5만 원입니다. 하지만 사용자 정보에 따르면 현재 이용 중인 회선이 없으므로, 이 한도는 적용되지 않습니다.
> 
> 최대 한도는 앱에서 1만 원 단위로 100만 원까지 설정할 수 있습니다. 그러나 현재 이용 중인 회선이 없으므로, 이 한도는 적용되지 않습니다.

- MISATTRIBUTION: 만 19세 미만의 기본 한도는 월 5만 원입니다.
  - 근거 이탈 사유: 자료에는 만 19세 미만의 월 최대 한도가 5만 원이라고만 나옵니다.
- UNSUPPORTED_GENERALIZATION: 이용 중인 회선이 없으므로 이 한도는 적용되지 않습니다.
  - 근거 이탈 사유: 회선이 없다는 정보는 있지만, 그에 따른 한도 적용 여부는 자료에 명시되지 않았습니다.

### MA-023 · 복합·모두 답할 수 있음

> 번호이동 인증은 하루 몇 번까지 되고, 넘기면 언제 다시 할 수 있어요?

- 최종 status: ANSWER; grounding 3; 정확도 CORRECT.

> 번호이동 인증은 하루에 최대 7회까지 시도할 수 있습니다. 7회를 넘기면 다음 날 다시 진행해 주셔야 합니다.
> 
> 번호이동 인증을 하루에 7회 넘게 시도하면 다음 날 다시 진행해야 합니다. 이 경우, 다음 날의 처리 시간은 평일과 토요일 오전 10시부터 오후 7시 50분까지입니다.

- MISATTRIBUTION: 이 경우, 다음 날의 처리 시간은 평일과 토요일 오전 10시부터 오후 7시 50분까지입니다.
  - 근거 이탈 사유: FAQ의 해당 시간은 번호이동 개통 처리 시간인데, 답변은 인증 재시도에 적용했습니다.

### MA-026 · 복합·모두 답할 수 있음

> eSIM을 실수로 지우면 회선이 해지되나요? 다시 받으려면 비용이 얼마예요?

- 최종 status: ANSWER; grounding 3; 정확도 CORRECT.

> eSIM을 실수로 지우더라도 회선은 해지되지 않습니다. 실수로 삭제한 eSIM은 Ubot 앱이나 매장에서 다시 발급받아 설치할 수 있으며, 재발급 비용은 2,750원이 청구됩니다.
> 
> 다시 받으려면 eSIM 재발급 비용은 2,750원입니다. 유심 또는 eSIM을 분실하거나 파손해 재발급받을 때도 같은 금액이 부과됩니다.

- MISATTRIBUTION: 유심 또는 eSIM을 분실하거나 파손해 재발급받을 때도 같은 금액이 부과됩니다.
  - 근거 이탈 사유: 앞서 말한 2,750원이 유심 재발급에도 적용되는 것처럼 표현했지만, 자료상 유심 비용은 7,700원입니다.

### MA-030 · 복합·모두 답할 수 있음

> 통화 내역은 앱에서 몇 개월까지 보이고, 상대 번호 전체가 나온 내역은 어디서 신청해요?

- 최종 status: ANSWER; grounding 3; 정확도 INCORRECT.

> Ubot 앱에서는 최근 6개월의 발신 통화 내역을 조회할 수 있습니다.
> 
> 상대 번호 전체가 나온 내역은 가입 통신사의 공식 고객센터나 앱에서 신청할 수 있습니다.

- FABRICATION: 상대 번호 전체가 나온 내역은 가입 통신사의 공식 고객센터나 앱에서 신청할 수 있습니다.
  - 근거 이탈 사유: 제공된 FAQ는 신청 채널을 고객센터나 앱에서 확인하라고 할 뿐, 그곳에서 신청할 수 있다고 하지 않습니다.

### MA-032 · 복합·모두 답할 수 있음

> 데이터 로밍 차단은 유료예요? 차단해도 해외에서 전화랑 문자는 되나요?

- 최종 status: ANSWER; grounding 3; 정확도 CORRECT.

> 데이터 로밍 차단은 무료입니다. Ubot 데이터 로밍 차단 서비스는 해외 데이터 사용을 차단하는 무료 서비스로, 휴대폰 설정에서 끄거나 앱에서 신청할 수 있습니다.
> 
> 차단해도 해외에서 전화와 문자는 사용할 수 있습니다. 데이터 로밍 차단은 해외 데이터만 막으므로 음성통화와 문자는 계속 가능합니다. 다만, 전화를 완전히 막하고 싶다면 휴대폰을 비행기 모드로 두는 것이 필요합니다.

- MISATTRIBUTION: 데이터 로밍 차단 서비스를 앱에서 신청할 수 있습니다.
  - 근거 이탈 사유: 앱 신청은 스팸 차단 서비스에만 명시되어 있으며, 데이터 로밍 차단의 신청 경로로는 확인되지 않습니다.

### MN-014 · 복합·모두 답할 수 없음

> 로밍 패스를 쓰다가 해지하면 부분 환불되나요? 환불은 며칠 걸려요?

- 최종 status: PARTIAL; grounding 3; 정확도 INCORRECT.

> 환불은 등록된 환불 계좌로 7영업일 안에 돌려드립니다. 처리 결과는 문자로 안내됩니다.
> 
> 「로밍 패스를 쓰다가 해지하면 부분 환불되나요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- MISATTRIBUTION: 로밍 패스 환불은 등록된 계좌로 7영업일 안에 처리되고 결과가 문자로 안내됩니다.
  - 근거 이탈 사유: FAQ 259는 일반 계좌 환불 안내이며, 로밍 패스 환불 기간에 적용된다는 근거는 없습니다.

### MP-018 · 복합·답할 수 있음+없음

> 매장 예약 없이 가도 되나요? 예약 시간에 늦으면 몇 분까지 기다려 줘요?

- 최종 status: ANSWER; grounding 2; 정확도 INCORRECT.

> 예약하지 않고 매장에 가도 되며, 영업시간 안에 방문할 수 있습니다. 다만, 예약을 하면 원하는 시간에 상담받을 수 있어 대기 시간을 줄일 수 있습니다.
> 
> 예약 시간에 늦으면 기다려 주는 기준은 없습니다. 예약 시간 이후에는 상담이 진행되지 않으며, 방문 시간이 지나면 예약은 자동으로 취소됩니다. 따라서 예약 시간에 늦을 경우 상담은 받을 수 없습니다.

- FABRICATION: 예약 시간에 늦으면 기다려 주는 기준은 없습니다.
  - 근거 이탈 사유: 자료에는 늦었을 때의 대기 기준이 있는지 여부가 나와 있지 않습니다.
- FABRICATION: 예약 시간 이후에는 상담이 진행되지 않으며, 늦으면 상담을 받을 수 없습니다.
  - 근거 이탈 사유: 자료에는 지각 시 상담 가능 여부가 나와 있지 않습니다.
- FABRICATION: 방문 시간이 지나면 예약은 자동으로 취소됩니다.
  - 근거 이탈 사유: 자료에는 방문 시간 전까지만 취소할 수 있다고 할 뿐 자동 취소는 명시되어 있지 않습니다.

### MP-021 · 복합·답할 수 있음+없음

> 친구 추천하면 몇 포인트 받고, 몇 명까지 추천할 수 있어요?

- 최종 status: PARTIAL; grounding 3; 정확도 INCORRECT.

> 친구를 추천하면 추천한 사람과 친구 모두에게 5,000포인트를 드립니다.
> 
> 「몇 명까지 추천할 수 있어요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- UNSUPPORTED_GENERALIZATION: 친구를 추천하면 추천한 사람과 친구 모두에게 5,000포인트를 드립니다.
  - 근거 이탈 사유: 추천 링크 가입과 3개월 이상 이용이라는 지급 조건을 생략해 무조건 지급되는 것처럼 안내했습니다.

### MP-029 · 복합·답할 수 있음+없음

> 워치 요금제 2GB 가격은 얼마고 개통비는 따로 있어요?

- 최종 status: PARTIAL; grounding 1; 정확도 INCORRECT.

> 개통비는 따로 없습니다.
> 
> 「워치 요금제 2GB 가격은 얼마인지」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- FABRICATION: 개통비는 따로 없습니다.
  - 근거 이탈 사유: 제공된 자료에는 개통비 유무가 나와 있지 않습니다.

### MP-036 · 복합·답할 수 있음+없음

> 번호 변경은 어디서 신청하고 수수료가 있어요?

- 최종 status: ANSWER; grounding 3; 정확도 INCORRECT.

> 번호 변경은 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있습니다.
> 
> 약정 기간 중 번호이동을 하면 남은 기간에 해당하는 할인반환금이 청구되며, 단말 할부가 남아 있다면 할부금은 계속 청구됩니다.

- MISATTRIBUTION: 번호 변경 수수료 질문에 약정 중 번호이동의 할인반환금과 단말 할부금을 제시함
  - 근거 이탈 사유: 번호이동 청구 정보는 FAQ에 있지만 번호 변경 수수료에 적용할 근거는 없습니다.

### MP-044 · 복합·답할 수 있음+없음

> 공항 로밍센터 운영시간이 어떻게 되고, 거기서 유심도 살 수 있어요?

- 최종 status: ANSWER; grounding 3; 정확도 INCORRECT.

> 인천공항 제1·제2여객터미널의 로밍센터는 매일 06:00~22:00 운영합니다.
> 
> 거기에서 유심을 판매할 수는 없습니다.

- FABRICATION: 거기에서 유심을 판매할 수는 없습니다.
  - 근거 이탈 사유: 제공된 FAQ에는 유심 판매 여부가 나와 있지 않습니다.

### MP-046 · 복합·답할 수 있음+없음

> 뮤직패스는 월 얼마고 음악을 오프라인으로 저장할 수 있어요?

- 최종 status: ANSWER; grounding 3; 정확도 INCORRECT.

> 뮤직패스는 월 6,900원입니다.
> 
> 음악을 오프라인으로 저장할 수는 없습니다.

- FABRICATION: 음악을 오프라인으로 저장할 수는 없습니다.
  - 근거 이탈 사유: 제공된 FAQ에는 오프라인 저장 가능 여부가 없습니다.

### MP-056 · 복합·답할 수 있음+없음

> 비디오패스는 동시에 몇 대에서 볼 수 있어요? 그리고 월 요금은 얼마예요?

- 최종 status: ANSWER; grounding 3; 정확도 INCORRECT.

> 비디오패스는 동시에 1대에서만 볼 수 있습니다. FAQ 원문에 '비디오패스는 1인이 이용하는 부가서비스'라고 명시되어 있으며, 이는 동시에 여러 대에서 사용할 수 없다는 의미입니다.
> 
> 비디오패스의 월 요금은 9,900원입니다. FAQ 원문에 'Ubot 비디오패스(월 9,900원)'라고 명시되어 있습니다.

- UNSUPPORTED_GENERALIZATION: 비디오패스는 동시에 1대에서만 볼 수 있으며, 1인 이용은 여러 대에서 동시에 사용할 수 없다는 의미다.
  - 근거 이탈 사유: 자료의 ‘1인이 이용’한다는 설명만으로 동시 시청 가능 기기 수를 확정할 수 없습니다.

### MT-012 · 멀티턴

> 그럼 얼마나 감면돼요?

- 최종 status: ANSWER; grounding 3; 정확도 CORRECT.

> 복지 할인 금액은 대상별로 다릅니다. 구체적인 금액은 대상자별로 달라서, 기초생활수급자, 장애인, 국가유공자, 차상위계층, 기초연금 수급자 등에 따라 다르며, 정확한 금액은 매장이나 고객센터에서 자격 확인 후 안내받습니다.

- UNSUPPORTED_GENERALIZATION: 정확한 금액은 매장이나 고객센터에서 자격 확인 후 안내받습니다.
  - 근거 이탈 사유: 자료에는 매장·고객센터 신청과 자격 확인만 있으며, 정확한 금액을 그곳에서 안내한다는 내용은 없습니다.

### SA-019 · 단일·답할 수 있음

> 넘버플러스 월 요금이 얼마예요?

- 최종 status: ANSWER; grounding 3; 정확도 CORRECT.

> 넘버플러스의 월 요금은 3,300원입니다. 하지만 현재 이용 중인 회선이 없기 때문에 요금이 청구되지 않았습니다.

- UNSUPPORTED_GENERALIZATION: 현재 이용 중인 회선이 없기 때문에 요금이 청구되지 않았습니다.
  - 근거 이탈 사유: 현재 회선이 없다는 정보만으로 과거 또는 현재의 청구 여부를 확정할 수 없습니다.

### SB-011 · 단일·묻는 값 없음

> 임대폰을 잃어버리면 변상금이 얼마예요?

- 최종 status: ANSWER; grounding 2; 정확도 INCORRECT.

> 분실 시 변상금은 최초 7일 무료 이후 하루 2,200원이 청구됩니다.
> 그러나 사용자 정보에 따르면 현재 이용 중인 회선이 없으므로 변상금이 청구되는 상황은 발생하지 않습니다.

- MISATTRIBUTION: 분실 시 변상금은 최초 7일 무료 이후 하루 2,200원이 청구됩니다.
  - 근거 이탈 사유: 7일 무료와 하루 2,200원은 임대료 조건이며, 분실 변상금 액수는 자료에 없습니다.
- UNSUPPORTED_GENERALIZATION: 이용 중인 회선이 없으므로 변상금이 청구되는 상황은 발생하지 않습니다.
  - 근거 이탈 사유: 회선이 없다는 정보만으로 임대폰 분실 변상금이 청구되지 않는다고 단정할 수 없습니다.

### SB-027 · 단일·묻는 값 없음

> VIP 영화 예매 혜택은 한 번에 몇 장까지 돼요?

- 최종 status: PARTIAL; grounding 1; 정확도 INCORRECT.

> 문서에 따르면 VIP 혜택으로는 매월 영화 예매 1회가 제공됩니다. 따라서 영화 예매 혜택은 한 번에 1장까지입니다.
> 
> 문의하신 내용 중 일부는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- FABRICATION: 영화 예매 혜택은 한 번에 1장까지입니다.
  - 근거 이탈 사유: 제공된 FAQ에는 월 1회 혜택만 있고 한 번에 예매할 수 있는 장수는 없습니다.

### SB-034 · 단일·묻는 값 없음

> 공항 로밍센터에서 유심도 살 수 있어요?

- 최종 status: ANSWER; grounding 1; 정확도 INCORRECT.

> 아니요, 공항 로밍센터에서는 유심을 판매하지 않습니다. 로밍 패스 가입 상담과 로밍 설정 안내만 제공합니다.

- FABRICATION: 공항 로밍센터에서는 유심을 판매하지 않으며 로밍 패스 가입 상담과 로밍 설정 안내만 제공합니다.
  - 근거 이탈 사유: 자료는 두 가지 안내 업무만 명시하며 유심 판매 여부나 업무 범위의 제한은 밝히지 않습니다.

### SB-038 · 단일·묻는 값 없음

> 데이터 플러스를 자동 갱신 없이 한 달만 살 수 있어요?

- 최종 status: ANSWER; grounding 1; 정확도 INCORRECT.

> 예, 데이터 플러스를 자동 갱신 없이 한 달만 살 수 있습니다. 앱에서 언제든 해지할 수 있으며, 해지 후에도 그달 말일까지 추가 데이터를 사용할 수 있습니다. 다만, 가입한 달에도 요금이 일할 계산되지 않고 월정액이 그대로 청구됩니다.

- FABRICATION: 데이터 플러스를 자동 갱신 없이 한 달만 살 수 있습니다.
  - 근거 이탈 사유: 받은 FAQ는 해지 방법과 해지 후 이용 기간만 설명하며, 자동 갱신 없는 구매 가능 여부는 제시하지 않습니다.

### ST-006 · 매장

> 부산 서면역 근처 매장 전화번호 알려 주세요.

- 최종 status: ANSWER; grounding 3; 정확도 INCORRECT.

> 부산 서면역 근처 매장 중 가장 가까운 매장은 '일상의틈_부전동_서면점'으로, 거리는 0.4km입니다. 전화번호는 000-0000-0489입니다.
> 
> 부산 서면역 근처에 있는 다른 매장은 '부전1동_부전시장점'(0.1km), '부전2동_부산점'(0.3km), '부전2동_서면1번가점'(0.4km), '부전동_부전역2번출구점'(0.5km)입니다. 각 매장의 전화번호는 상기 정보에 따르면 000-0000-0484, 000-0000-0488, 000-0000-0491, 000-0000-0483입니다.

- MISATTRIBUTION: 가장 가까운 매장은 '일상의틈_부전동_서면점'으로, 거리는 0.4km입니다.
  - 근거 이탈 사유: 조회 결과상 가장 가까운 매장은 0.1km 거리의 '부전1동_부전시장점'입니다.

### ST-021 · 매장

> 근처 매장 중에 일요일에 여는 곳 있어요?

- 최종 status: ANSWER; grounding 1; 정확도 INCORRECT.

> 근처 매장 중에 일요일에 운영하는 곳은 없습니다. 모든 매장의 영업시간은 09:00~18:00이며, 주말 영업은 포함되지 않습니다.

- FABRICATION: 근처 매장 중에 일요일에 운영하는 곳은 없습니다.
  - 근거 이탈 사유: 조회 결과에는 요일별 영업 여부가 없습니다.
- FABRICATION: 주말 영업은 포함되지 않습니다.
  - 근거 이탈 사유: 09:00~18:00 영업시간만으로 주말 휴무를 판단할 수 없습니다.

### ST-029 · 매장

> 뉴욕 타임스퀘어 근처 매장 알려 주세요.

- 최종 status: ANSWER; grounding 3; 정확도 INCORRECT.

> 뉴욕 타임스퀘어 근처에 서울의 영등포동 타임스퀘어점이 있습니다. 이 매장은 신세계 백화점 맞은편 금강제화 바로 옆에 위치하고 있으며, 거리는 0.1km입니다. 가장 가까운 매장입니다.
> 
> 다른 근처 매장으로는 영등포동 영등포역점(0.4km), 영등포동 영등포시장점(0.4km), 신길동 대신시장점(1.1km), 문래동 문래점(1.2km)이 있습니다.

- MISATTRIBUTION: 서울의 영등포동 타임스퀘어점과 다른 영등포 인근 매장들이 뉴욕 타임스퀘어 근처에 있다.
  - 근거 이탈 사유: 조회 결과의 매장들은 서울에 있는데, 이를 뉴욕 타임스퀘어 주변 매장으로 적용했습니다.

### UD-007 · 사용자 정보

> 지금 제 데이터 몇 GB 남았어요?

- 최종 status: ANSWER; grounding 3; 정확도 INCORRECT.

> 이용 중인 회선이 없으므로 데이터 사용량이 없습니다.

- UNSUPPORTED_GENERALIZATION: 이용 중인 회선이 없으므로 데이터 사용량이 없습니다.
  - 근거 이탈 사유: 회선이 없다는 정보만으로 데이터 사용량이 없다고 확정할 수 없습니다.

### UD-009 · 사용자 정보

> 제가 밀린 요금이 있나요?

- 최종 status: ANSWER; grounding 1; 정확도 INCORRECT.

> 이용 중인 회선이 없으므로 밀린 요금이 없습니다.

- UNSUPPORTED_GENERALIZATION: 밀린 요금이 없습니다.
  - 근거 이탈 사유: 이용 중인 회선이 없다는 정보는 미납 요금 유무를 확인한 결과가 아닙니다.

### UD-011 · 사용자 정보

> 제 선택약정은 언제 끝나요?

- 최종 status: ANSWER; grounding 3; 정확도 INCORRECT.

> 이용 중인 회선이 없으므로 선택약정이 없습니다.

- UNSUPPORTED_GENERALIZATION: 선택약정이 없습니다.
  - 근거 이탈 사유: 이용 중인 회선이 없다는 정보만으로 선택약정 유무를 확정할 수 없습니다.

### UD-012 · 사용자 정보

> 제 휴대폰 할부가 몇 개월 남았어요?

- 최종 status: ANSWER; grounding 3; 정확도 INCORRECT.

> 이용 중인 회선이 없습니다. 할부가 적용된 회선이 없습니다.

- FABRICATION: 할부가 적용된 회선이 없습니다.
  - 근거 이탈 사유: 이용 중인 회선이 없다는 정보만으로 단말 할부 여부를 확인할 수 없습니다.

### UD-013 · 사용자 정보

> 지금 해지하면 제 할인반환금이 얼마예요?

- 최종 status: ANSWER; grounding 3; 정확도 INCORRECT.

> 이용 중인 회선이 없으므로 할인반환금이 적용되지 않습니다.

- UNSUPPORTED_GENERALIZATION: 이용 중인 회선이 없으므로 할인반환금이 적용되지 않습니다.
  - 근거 이탈 사유: 회선이 없다는 정보만으로 할인반환금의 적용 여부나 금액을 확정할 수 없습니다.

### UD-017 · 사용자 정보

> 제 폰에 지금 로밍 차단이 걸려 있나요?

- 최종 status: ANSWER; grounding 1; 정확도 INCORRECT.

> 사용자 정보에 따르면 현재 이용 중인 회선이 없습니다. 로밍 차단은 회선이 존재할 때 설정할 수 있는 서비스이므로, 회선이 없으면 로밍 차단이 걸려 있을 수 없습니다.

- UNSUPPORTED_GENERALIZATION: 회선이 없으면 로밍 차단이 걸려 있을 수 없습니다.
  - 근거 이탈 사유: 회선이 없다는 정보만으로 현재 로밍 차단 상태를 확정할 근거가 없습니다.

### UD-023 · 사용자 정보

> 제 약정 언제 끝나요? 재약정은 만료 며칠 전부터 신청할 수 있어요?

- 최종 status: ANSWER; grounding 3; 정확도 INCORRECT.

> 이용 중인 회선이 없으므로 약정 종료일이 없습니다.
> 
> 약정 재약정에 대한 정보가 없습니다. 이용 중인 회선이 없으므로 재약정 신청 기간도 확인할 수 없습니다.

- UNSUPPORTED_GENERALIZATION: 이용 중인 회선이 없으므로 약정 종료일이 없습니다.
  - 근거 이탈 사유: 회선이 없다는 자료만으로 약정 종료일의 부재를 확정할 수 없습니다.

### UD-024 · 사용자 정보

> 제 포인트 몇 점 남았어요? 그리고 포인트 유효기간은 얼마예요?

- 최종 status: PARTIAL; grounding 1; 정확도 INCORRECT.

> 이용 중인 회선이 없으므로 포인트를 적립하거나 보유하고 있지 않습니다. 따라서 포인트는 0점입니다.
> 
> 「그리고 포인트 유효기간은 얼마예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- UNSUPPORTED_GENERALIZATION: 이용 중인 회선이 없으므로 포인트를 적립하거나 보유하고 있지 않으며, 잔액은 0점입니다.
  - 근거 이탈 사유: 회선이 없다는 정보만으로 포인트 적립·보유 여부나 잔액을 판단할 수 없습니다.

### UD-029 · 사용자 정보

> 제 폰 할부가 얼마 남았는지 알려 주시고, 중도 완납하면 원금 말고 더 내는 돈이 있는지도 알려 주세요.

- 최종 status: ANSWER; grounding 2; 정확도 INCORRECT.

> 이용 중인 회선이 없습니다. 따라서 할부가 남아 있지 않습니다.
> 
> 이용 중인 회선이 없습니다. 중도 완납이 불가능하며, 원금 말고 더 내는 돈이 없습니다.

- UNSUPPORTED_GENERALIZATION: 할부가 남아 있지 않습니다.
  - 근거 이탈 사유: 이용 중인 회선이 없다는 정보로 단말 할부 잔액을 확인할 수 없습니다.
- UNSUPPORTED_GENERALIZATION: 중도 완납이 불가능합니다.
  - 근거 이탈 사유: 회선 정보만으로 단말 할부의 중도 완납 가능 여부를 판단할 수 없습니다.
- FABRICATION: 원금 말고 더 내는 돈이 없습니다.
  - 근거 이탈 사유: 챗봇이 받은 자료에는 중도 완납 시 추가 납부액에 관한 FAQ가 없습니다.

### UD-030 · 사용자 정보

> 제 거주 지역이 어디로 돼 있는지랑 이번 달 요금이 얼마인지 알려 주세요.

- 최종 status: ANSWER; grounding 3; 정확도 INCORRECT.

> 제 거주 지역은 서울특별시 마포구입니다.
> 
> 이번 달 요금은 조회할 수 없습니다. 이용 중인 회선이 없기 때문에 요금이 적용되지 않습니다.

- UNSUPPORTED_GENERALIZATION: 이용 중인 회선이 없기 때문에 요금이 적용되지 않습니다.
  - 근거 이탈 사유: 회선이 없다는 조회 결과만으로 이번 달 청구 요금이 없다고 확정할 수 없습니다.

## 실행 실패·전체 출력 차단

- MT-017: CHAT-021 — 너무 많은 질문을 입력하셨습니다. 하나씩 물어봐주세요.

## 전체 문항 판정 목록

| ID | 실제 경로 | 최종 status | 정확도 | grounding | 가드로 보류한 칸 |
| --- | --- | --- | --- | --- | --- |
| MP-010 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MT-016 | LLM | ABSTAIN | INCORRECT | 5 | 1 |
| SA-022 | LLM | ANSWER | INCORRECT | 2 | 0 |
| SB-036 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| ST-017 | LLM | ANSWER | INCORRECT | 3 | 0 |
| UD-018 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| CQ-001 | LLM | ANSWER | CORRECT | 5 | 0 |
| CQ-002 | LLM | ANSWER | CORRECT | 5 | 0 |
| CQ-003 | LLM | ANSWER | CORRECT | 5 | 0 |
| CQ-004 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| CQ-005 | LLM | ABSTAIN | INCORRECT | 5 | 1 |
| CQ-006 | LLM | ANSWER | CORRECT | 5 | 0 |
| CQ-007 | LLM | ANSWER | CORRECT | 5 | 0 |
| CQ-008 | LLM | ANSWER | INCORRECT | 3 | 0 |
| CQ-009 | LLM | ANSWER | CORRECT | 5 | 0 |
| CQ-010 | LLM | ANSWER | INCORRECT | 3 | 0 |
| CQ-011 | LLM | ABSTAIN | INCORRECT | 5 | 1 |
| CQ-012 | LLM | ANSWER | INCORRECT | 3 | 0 |
| CQ-013 | LLM | ANSWER | CORRECT | 5 | 0 |
| CQ-014 | LLM | ANSWER | CORRECT | 5 | 0 |
| CQ-015 | LLM | ANSWER | INCORRECT | 2 | 0 |
| CQ-016 | LLM | ANSWER | CORRECT | 5 | 0 |
| CQ-017 | LLM | ANSWER | CORRECT | 5 | 0 |
| CQ-018 | LLM | ABSTAIN | INCORRECT | 5 | 1 |
| CQ-019 | LLM | ANSWER | CORRECT | 5 | 0 |
| CQ-020 | LLM | ANSWER | CORRECT | 5 | 0 |
| CQ-021 | LLM | ANSWER | CORRECT | 5 | 0 |
| CQ-022 | LLM | ANSWER | INCORRECT | 1 | 0 |
| CQ-023 | LLM | ANSWER | CORRECT | 5 | 0 |
| CQ-024 | LLM | ANSWER | CORRECT | 5 | 0 |
| CQ-025 | LLM | ANSWER | CORRECT | 5 | 0 |
| CQ-026 | LLM | ANSWER | INCORRECT | 3 | 0 |
| CQ-027 | LLM | ANSWER | INCORRECT | 3 | 0 |
| CQ-028 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| CQ-029 | LLM | ANSWER | CORRECT | 5 | 0 |
| CQ-030 | LLM | ANSWER | CORRECT | 5 | 0 |
| IN-001 | LLM | ANSWER | CORRECT | 5 | 0 |
| IN-002 | LLM | ANSWER | CORRECT | 5 | 0 |
| IN-003 | LLM | ANSWER | CORRECT | 5 | 0 |
| IN-004 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| IN-005 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| IN-006 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| IN-007 | LLM | ABSTAIN | INCORRECT | 5 | 1 |
| IN-008 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| IN-009 | LLM | PARTIAL | INCORRECT | 3 | 0 |
| IN-010 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| IN-011 | LLM | ANSWER | CORRECT | 5 | 0 |
| IN-012 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| IN-013 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| IN-014 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| IN-015 | LLM | ANSWER | INCORRECT | 2 | 0 |
| IN-016 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| IN-017 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| IN-018 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| IN-019 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| IN-020 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| MA-001 | LLM | ANSWER | INCORRECT | 3 | 0 |
| MA-002 | LLM | ANSWER | CORRECT | 5 | 0 |
| MA-003 | LLM | PARTIAL | INCORRECT | 3 | 0 |
| MA-004 | LLM | ANSWER | CORRECT | 5 | 0 |
| MA-005 | LLM | PARTIAL | INCORRECT | 5 | 1 |
| MA-006 | LLM | PARTIAL | CORRECT | 5 | 1 |
| MA-007 | LLM | ANSWER | CORRECT | 5 | 0 |
| MA-008 | LLM | ANSWER | CORRECT | 5 | 0 |
| MA-009 | LLM | ANSWER | CORRECT | 5 | 0 |
| MA-010 | LLM | ANSWER | CORRECT | 5 | 0 |
| MA-011 | LLM | ANSWER | INCORRECT | 3 | 0 |
| MA-012 | LLM | ANSWER | CORRECT | 5 | 0 |
| MA-013 | LLM | ANSWER | CORRECT | 5 | 0 |
| MA-014 | LLM | PARTIAL | INCORRECT | 5 | 1 |
| MA-015 | LLM | PARTIAL | INCORRECT | 5 | 1 |
| MA-016 | LLM | ABSTAIN | INCORRECT | 5 | 1 |
| MA-017 | LLM | ANSWER | CORRECT | 3 | 0 |
| MA-018 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| MA-019 | LLM | ANSWER | CORRECT | 5 | 0 |
| MA-020 | LLM | ABSTAIN | INCORRECT | 5 | 2 |
| MA-021 | LLM | ANSWER | CORRECT | 5 | 0 |
| MA-022 | LLM | ANSWER | CORRECT | 5 | 0 |
| MA-023 | LLM | ANSWER | CORRECT | 3 | 0 |
| MA-024 | LLM | PARTIAL | INCORRECT | 5 | 1 |
| MA-025 | LLM | PARTIAL | CORRECT | 5 | 1 |
| MA-026 | LLM | ANSWER | CORRECT | 3 | 0 |
| MA-027 | LLM | PARTIAL | INCORRECT | 5 | 0 |
| MA-028 | LLM | ANSWER | CORRECT | 5 | 0 |
| MA-029 | LLM | ANSWER | CORRECT | 5 | 0 |
| MA-030 | LLM | ANSWER | INCORRECT | 3 | 0 |
| MA-031 | LLM | ANSWER | CORRECT | 5 | 0 |
| MA-032 | LLM | ANSWER | CORRECT | 3 | 0 |
| MA-033 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| MA-034 | LLM | PARTIAL | INCORRECT | 5 | 1 |
| MA-035 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| MA-036 | LLM | ANSWER | CORRECT | 5 | 0 |
| MA-037 | LLM | ANSWER | CORRECT | 5 | 0 |
| MA-038 | LLM | ANSWER | CORRECT | 5 | 0 |
| MA-039 | LLM | ANSWER | CORRECT | 5 | 0 |
| MA-040 | LLM | ANSWER | CORRECT | 5 | 0 |
| MN-001 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MN-002 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| MN-003 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MN-004 | LLM | PARTIAL | CORRECT | 4 | 0 |
| MN-005 | LLM | ANSWER | CORRECT | 5 | 0 |
| MN-006 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| MN-007 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| MN-008 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| MN-009 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| MN-010 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| MN-011 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| MN-012 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| MN-013 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MN-014 | LLM | PARTIAL | INCORRECT | 3 | 1 |
| MN-015 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| MN-016 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| MN-017 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| MN-018 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| MN-019 | LLM | ANSWER | CORRECT | 5 | 0 |
| MN-020 | LLM | ABSTAIN | CORRECT | 5 | 1 |
| MP-001 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-002 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-003 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-004 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-005 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-006 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-007 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-008 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-009 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| MP-011 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-012 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| MP-013 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-014 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-015 | LLM | ANSWER | CORRECT | 5 | 0 |
| MP-016 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| MP-017 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| MP-018 | LLM | ANSWER | INCORRECT | 2 | 0 |
| MP-019 | LLM | ABSTAIN | INCORRECT | 5 | 1 |
| MP-020 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-021 | LLM | PARTIAL | INCORRECT | 3 | 0 |
| MP-022 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-023 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-024 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-025 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-026 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-027 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-028 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| MP-029 | LLM | PARTIAL | INCORRECT | 1 | 1 |
| MP-030 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-031 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| MP-032 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| MP-033 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-034 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| MP-035 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-036 | LLM | ANSWER | INCORRECT | 3 | 0 |
| MP-037 | LLM | ABSTAIN | INCORRECT | 5 | 1 |
| MP-038 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-039 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-040 | LLM | ANSWER | CORRECT | 5 | 0 |
| MP-041 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-042 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-043 | LLM | ABSTAIN | INCORRECT | 5 | 1 |
| MP-044 | LLM | ANSWER | INCORRECT | 3 | 0 |
| MP-045 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-046 | LLM | ANSWER | INCORRECT | 3 | 0 |
| MP-047 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-048 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-049 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| MP-050 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-051 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-052 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-053 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-054 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-055 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-056 | LLM | ANSWER | INCORRECT | 3 | 0 |
| MP-057 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MP-058 | LLM | PARTIAL | CORRECT | 5 | 1 |
| MP-059 | LLM | PARTIAL | CORRECT | 5 | 1 |
| MP-060 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MT-001 | LLM | ANSWER | CORRECT | 5 | 0 |
| MT-002 | LLM | — | INCORRECT | 5 | 0 |
| MT-003 | LLM | ANSWER | INCORRECT | 5 | 0 |
| MT-004 | LLM | ABSTAIN | INCORRECT | 5 | 1 |
| MT-005 | LLM | ANSWER | CORRECT | 5 | 0 |
| MT-006 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| MT-007 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| MT-008 | LLM | ANSWER | CORRECT | 5 | 0 |
| MT-009 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| MT-010 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| MT-011 | LLM | — | CORRECT | 5 | 0 |
| MT-012 | LLM | ANSWER | CORRECT | 3 | 0 |
| MT-013 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| MT-014 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| MT-015 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| MT-017 | CHAT-021 | — | — | — | 0 |
| MT-018 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| MT-019 | LLM | PARTIAL | CORRECT | 5 | 0 |
| MT-020 | LLM | — | CORRECT | 5 | 0 |
| MT-021 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| MT-022 | LLM | ANSWER | CORRECT | 5 | 0 |
| MT-023 | LLM | ANSWER | CORRECT | 5 | 0 |
| MT-024 | LLM | ANSWER | CORRECT | 5 | 0 |
| MT-025 | LLM | ABSTAIN | INCORRECT | 5 | 1 |
| MT-026 | LLM | ABSTAIN | INCORRECT | 5 | 1 |
| MT-027 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| MT-028 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| MT-029 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| MT-030 | LLM | — | CORRECT | 5 | 0 |
| OS-001 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| OS-002 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| OS-003 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| OS-004 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| OS-005 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| OS-006 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| OS-007 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| OS-008 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| OS-009 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| OS-010 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| OS-011 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| OS-012 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| OS-013 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| OS-014 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| OS-015 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| OS-016 | LLM | PARTIAL | CORRECT | 5 | 0 |
| OS-017 | LLM | PARTIAL | CORRECT | 5 | 0 |
| OS-018 | LLM | PARTIAL | CORRECT | 5 | 0 |
| OS-019 | LLM | PARTIAL | CORRECT | 5 | 0 |
| OS-020 | LLM | PARTIAL | CORRECT | 5 | 0 |
| OS-021 | LLM | PARTIAL | CORRECT | 5 | 0 |
| OS-022 | LLM | ABSTAIN | INCORRECT | 5 | 1 |
| OS-023 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| OS-024 | LLM | PARTIAL | CORRECT | 5 | 0 |
| OS-025 | LLM | PARTIAL | CORRECT | 5 | 0 |
| OS-026 | LLM | ABSTAIN | INCORRECT | 5 | 1 |
| OS-027 | LLM | PARTIAL | CORRECT | 5 | 0 |
| OS-028 | LLM | PARTIAL | CORRECT | 5 | 0 |
| OS-029 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| OS-030 | LLM | PARTIAL | CORRECT | 5 | 0 |
| SA-001 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-002 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-003 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-004 | LLM | ABSTAIN | INCORRECT | 5 | 1 |
| SA-005 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-006 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-007 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-008 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-009 | LLM | PARTIAL | CORRECT | 5 | 0 |
| SA-010 | LLM | PARTIAL | CORRECT | 5 | 0 |
| SA-011 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-012 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-013 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-014 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-015 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-016 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-017 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-018 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-019 | LLM | ANSWER | CORRECT | 3 | 0 |
| SA-020 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-021 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-023 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-024 | LLM | ABSTAIN | INCORRECT | 5 | 1 |
| SA-025 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-026 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-027 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-028 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-029 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-030 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-031 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-032 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-033 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-034 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-035 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-036 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-037 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-038 | LLM | PARTIAL | CORRECT | 5 | 0 |
| SA-039 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-040 | LLM | PARTIAL | CORRECT | 5 | 0 |
| SA-041 | LLM | ABSTAIN | INCORRECT | 5 | 1 |
| SA-042 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-043 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-044 | LLM | PARTIAL | CORRECT | 5 | 0 |
| SA-045 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-046 | LLM | PARTIAL | CORRECT | 5 | 0 |
| SA-047 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-048 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-049 | LLM | ANSWER | CORRECT | 5 | 0 |
| SA-050 | LLM | ANSWER | CORRECT | 5 | 0 |
| SB-001 | LLM | ANSWER | CORRECT | 5 | 0 |
| SB-002 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-003 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-004 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-005 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-006 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-007 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-008 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-009 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-010 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| SB-011 | LLM | ANSWER | INCORRECT | 2 | 0 |
| SB-012 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-013 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-014 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-015 | LLM | PARTIAL | CORRECT | 5 | 0 |
| SB-016 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| SB-017 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-018 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-019 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-020 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-021 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-022 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-023 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-024 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| SB-025 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-026 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-027 | LLM | PARTIAL | INCORRECT | 1 | 0 |
| SB-028 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-029 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-030 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-031 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-032 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-033 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| SB-034 | LLM | ANSWER | INCORRECT | 1 | 0 |
| SB-035 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-037 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-038 | LLM | ANSWER | INCORRECT | 1 | 0 |
| SB-039 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| SB-040 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-041 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-042 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-043 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| SB-044 | CHAT-013 | SYSTEM_ABSTAIN | — | — | 0 |
| SB-045 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-046 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-047 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-048 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-049 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| SB-050 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| ST-001 | LLM | ANSWER | CORRECT | 5 | 0 |
| ST-002 | LLM | ANSWER | CORRECT | 5 | 0 |
| ST-003 | LLM | ANSWER | CORRECT | 5 | 0 |
| ST-004 | LLM | ANSWER | CORRECT | 5 | 0 |
| ST-005 | LLM | ANSWER | CORRECT | 5 | 0 |
| ST-006 | LLM | ANSWER | INCORRECT | 3 | 0 |
| ST-007 | LLM | ANSWER | CORRECT | 5 | 0 |
| ST-008 | LLM | ANSWER | CORRECT | 5 | 0 |
| ST-009 | LLM | ANSWER | CORRECT | 5 | 0 |
| ST-010 | LLM | ANSWER | CORRECT | 5 | 0 |
| ST-011 | LLM | ANSWER | CORRECT | 5 | 0 |
| ST-012 | LLM | ANSWER | CORRECT | 5 | 0 |
| ST-013 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| ST-014 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| ST-015 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| ST-016 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| ST-018 | LLM | PARTIAL | CORRECT | 5 | 0 |
| ST-019 | LLM | ANSWER | CORRECT | 5 | 0 |
| ST-020 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| ST-021 | LLM | ANSWER | INCORRECT | 1 | 0 |
| ST-022 | LLM | PARTIAL | INCORRECT | 5 | 0 |
| ST-023 | LLM | PARTIAL | INCORRECT | 5 | 1 |
| ST-024 | LLM | ANSWER | CORRECT | 5 | 0 |
| ST-025 | LLM | ANSWER | CORRECT | 5 | 0 |
| ST-026 | LLM | PARTIAL | CORRECT | 5 | 0 |
| ST-027 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| ST-028 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| ST-029 | LLM | ANSWER | INCORRECT | 3 | 0 |
| ST-030 | LLM | PARTIAL | INCORRECT | 5 | 0 |
| UD-001 | LLM | ABSTAIN | INCORRECT | 5 | 1 |
| UD-002 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| UD-003 | LLM | ANSWER | CORRECT | 5 | 0 |
| UD-004 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| UD-005 | LLM | ANSWER | CORRECT | 5 | 0 |
| UD-006 | LLM | ANSWER | CORRECT | 5 | 0 |
| UD-007 | LLM | ANSWER | INCORRECT | 3 | 0 |
| UD-008 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| UD-009 | LLM | ANSWER | INCORRECT | 1 | 0 |
| UD-010 | LLM | ANSWER | CORRECT | 5 | 0 |
| UD-011 | LLM | ANSWER | INCORRECT | 3 | 0 |
| UD-012 | LLM | ANSWER | INCORRECT | 3 | 0 |
| UD-013 | LLM | ANSWER | INCORRECT | 3 | 0 |
| UD-014 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| UD-015 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| UD-016 | LLM | ABSTAIN | CORRECT | 5 | 1 |
| UD-017 | LLM | ANSWER | INCORRECT | 1 | 0 |
| UD-019 | LLM | ANSWER | CORRECT | 5 | 0 |
| UD-020 | LLM | ANSWER | CORRECT | 5 | 0 |
| UD-021 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| UD-022 | LLM | ABSTAIN | CORRECT | 5 | 0 |
| UD-023 | LLM | ANSWER | INCORRECT | 3 | 0 |
| UD-024 | LLM | PARTIAL | INCORRECT | 1 | 0 |
| UD-025 | LLM | ABSTAIN | INCORRECT | 5 | 0 |
| UD-026 | LLM | PARTIAL | CORRECT | 5 | 0 |
| UD-027 | LLM | PARTIAL | CORRECT | 5 | 0 |
| UD-028 | LLM | PARTIAL | CORRECT | 5 | 0 |
| UD-029 | LLM | ANSWER | INCORRECT | 2 | 0 |
| UD-030 | LLM | ANSWER | INCORRECT | 3 | 0 |

## 검증·보관 위치

- 390개 고유 ID, 케이스 해시, 모든 최종 trace, 모든 Judge 입력 해시, 가드 후 답변과 HTTP 최종 답변의 일치를 검증했다.
- Judge 호출 중 외부 연결 403 등으로 실패한 시도 56회는 로그에 보존하고 미판정 건만 재개했다. 최종 판정 356건은 전부 성공·입력 해시 일치 상태다. 챗봇 답변을 다시 생성하거나 성공 판정을 임의로 다시 채점하지 않았다.
- 관련 회귀 테스트 2334건 통과. 실행한 클래스별 건수·결과는 검증 JSON의 regression에 보관했다.
- 데이터셋 SHA-256: `513d1383c549275120409362f806521bde728428fdd2e1bb2c1496170b06950a`.
- BE에는 이 결과 MD 한 파일만 추가한다. 원본 응답·로그·Judge·실행 사본·DB 덤프·검증 JSON은 모두 BE 밖에 있다.
- [외부 전체 결과](C:/Ureka/ureca_project2/LLM_Test/pipeline_test_v5/try1/results) / [검증 JSON](C:/Ureka/ureca_project2/LLM_Test/pipeline_test_v5/try1/results/summary/verification.json) / [비교 JSON](C:/Ureka/ureca_project2/LLM_Test/pipeline_test_v5/try1/results/summary/comparison.json)
- [원본 응답](C:/Ureka/ureca_project2/LLM_Test/pipeline_test_v5/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv5_feat277_n390_20261023/results.jsonl) / [Judge 원본](C:/Ureka/ureca_project2/LLM_Test/pipeline_test_v5/try1/results/llm_judge/pv5-feat277-try1/local-win_qwen3-4b-instruct_t0_pv5_feat277_n390_20261023.judgments.jsonl)
- [실행·소스 메타데이터](C:/Ureka/ureca_project2/LLM_Test/pipeline_test_v5/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv5_feat277_n390_20261023/run_info.json) / [소스 스냅숏 메타데이터](C:/Ureka/ureca_project2/LLM_Test/build/feat277-eval-20261023/source.json)
