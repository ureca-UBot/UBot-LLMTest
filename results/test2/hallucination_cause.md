# test2 환각 원인 분류 (규칙 위반 vs 판단 오류)

생성일: 2026-09-23 · 대상: 5개 모델 · 고유 300문항 · V2 재실행(`rerun-1328`) · LLM Judge V2 결과

## 요약

- 환각 답변 531건 중 문항 문제(C) 54건을 빼고 **477건을 분류**했다. 원인이 판정된 것은 324건, **판정 불가는 153건(32.1%)**이다.
- 판정된 324건: **A1 55 · A2 6 · P 37 · B1 81 · B2 40 · B3 43 · B4 62**. A 계열+P가 98건(30.2%), B 계열이 226건(69.8%)이다.
- **U(status 비판별)에 해당하는 모델은 없다.** 가장 낮은 Gemma3 4B도 판별력이 0.745다.
- **판정 불가의 90%(138/153)가 보류 계열 교차다.** ABSTAIN↔CLARIFY 114건, ABSTAIN↔OUT_OF_SCOPE 24건이다. 트리 미해당으로 남은 14건은 모두 CONFLICT가 얽힌 조합이고, 1건은 형식 실패다.
- 모델별 특징
  - **Qwen3 1.7B는 B 계열이 75.2%(B1 51건)다.** test3와 마찬가지로 판단 자체의 오류가 대부분이다.
  - **Qwen3 4B는 B 계열이 50.0%, A 계열이 22.2%다.** B3(9건)가 가장 많은데, 대부분 조건·수치 왜곡이다.
  - **Qwen3 8B는 B3(11건)와 P(9건)가 많다.** 판정 불가 27건 중 11건은 ABSTAIN↔OUT_OF_SCOPE 교차다.
  - **EXAONE은 B4가 31건(21.8%)으로 가장 많다.** 답이 다 있는데 PARTIAL로 낸 경우가 24건이다.
  - **Gemma3 4B는 판정 불가가 54.7%(ABSTAIN↔CLARIFY 교차 60건)다.** 이 모델의 A/B 비율은 대표성이 약하다.
- **환각 외 오답 (7절):** 환각 없는 status 오류(S) 194건, 환각 없는 내용 누락(M) 103건이다. S는 교차 제외 후 127건이 남고, Gemma3 4B·EXAONE은 과소 판단이 가장 많다. M 103건 중 60건(58%)은 문항 검토에서 수정 필요·경계로 판정된 문항에서 나왔다. C 문항 13개 중 10개는 문항 검토에서 적합 판정을 받았다.

## 분류 기준

| 코드 | 이름 | 원인 | 파인튜닝 기대 |
|---|---|---|---|
| A1 | 자각 후 위반 | 판단은 맞았는데 출력에서 규칙을 어김 | 높음 (소량 SFT) |
| A2 | 명시적 보충 | 부족을 인지했지만 일반 지식으로 채움 | 높음 |
| B1 | 답변 가능 오판 | 답이 없는데 있다고 판단 | 중간 (대조 데이터 필요) |
| B2 | 범위 오판 | 일부만 있는데 전부 있다고 판단 | 중간 |
| B3 | 근거 혼동 | 다른 FAQ를 이 질문의 근거로 착각 | 중간 (유사 FAQ 대조 학습) |
| B4 | 과소 판단 | 답할 수 있는데 부분 답변·되묻기·보류로 판단하고, 그 본문에서 환각 | 중간 (과잉 보류 교정용 대조 데이터) |
| P | 사전지식 보충 | 자각 여부를 확인할 수 없음. A 성향으로 봄 | 중간~높음 |
| C | 문항 문제 | 데이터나 정답이 애매함 | 해당 없음 (데이터 수정) |
| U | status 비판별 | 모델 status가 판단을 반영하지 않음 | 판정 불가 |

### 적용 순서

대상은 Judge 근거 점수 1~3점(실질적 환각) 답변이다. 한 답변에는 라벨 하나만 붙는다.

1. **C** — 5개 모델 중 4개 이상이 같은 문항에서 환각을 내고 **같은 status**를 냈으면 그 문항의 환각 전체를 C로 뺀다. 사람 검토 전까지 집계에서 제외한다. test2는 모델이 5개라 기준을 4개 이상으로 두었다(test3의 5/7과 비슷한 비율).
2. **U** — 모델의 status 판별력이 0.6 미만이면 그 모델의 환각 전체를 판정 불가(U)로 둔다.
   - status 판별력 = (기대 ANSWER 문항에서 ANSWER를 낸 비율 + 기대 비ANSWER 문항에서 비ANSWER를 낸 비율) ÷ 2
3. **보류 계열 교차 제외** — 아래 두 쌍은 프롬프트에 구분 기준이 없어(명세 공백) 판정 불가로 뺀다. 양방향 모두 해당한다.
   - ABSTAIN ↔ CLARIFY
   - ABSTAIN ↔ OUT_OF_SCOPE (프롬프트에 ABSTAIN의 행동 규칙은 없고 "범위 밖 요청은 범위를 안내한다"만 있다)
4. 나머지를 기대 상태와 모델 status로 가른다.

| 기대 상태 | 모델 status | 라벨 |
|---|---|---|
| ANSWER 외 | 기대와 같음 | **A1** — 상태 판단은 맞았는데 본문에서 지어냄 |
| ABSTAIN / CLARIFY | ANSWER / PARTIAL | **B1** |
| PARTIAL | ANSWER | **B2** |
| ANSWER | PARTIAL / CLARIFY / ABSTAIN / OUT_OF_SCOPE | **B4** |
| PARTIAL | CLARIFY / ABSTAIN / OUT_OF_SCOPE | **B4** |
| ANSWER | ANSWER | 환각 문장의 출처로 가름 (아래) |
| 그 밖의 조합 (주로 CONFLICT 관련) | | 판정 불가 (결정 트리 미해당) |

B4의 서열은 ANSWER > PARTIAL > CLARIFY·ABSTAIN·OUT_OF_SCOPE이다. 기대보다 낮은 서열의 status를 냈으면 과소 판단으로 본다.

기대·모델 모두 ANSWER인 경우, Judge가 기록한 환각 사유(`hallucinated_claims[].reason`)로 출처를 가른다.

| 사유에 나타난 출처 | 라벨 |
|---|---|
| Context 안의 다른 FAQ·다른 요금제 조건을 옮겨 씀 | **B3** (다른 FAQ 혼동) |
| 정답 FAQ의 조건·수치·범위를 생략하거나 바꿈 | **B3** (정답 FAQ 왜곡) |
| Context 밖 내용 + 답변에 "일반적으로", "제공된 정보에는" 같은 자각 표현 있음 | **A2** |
| Context 밖 내용 + 자각 표현 없음 | **P** |
| 사유로 출처를 가를 수 없음 | 판정 불가 (출처 판별 불가) |

주장이 여러 개면 B3(다른 FAQ) → B3(왜곡) → A2/P 순으로 우선한다. 판단 오류가 하나라도 있으면 B로 보는 보수적 규칙이다.

### 한계

- **Thinking 로그가 저장돼 있지 않다.** `generation.jsonl`에는 최종 JSON만 있어서 "추론 과정에 자각이 드러나면 A1" 규칙은 적용하지 못했다.
- 기대·모델 모두 ANSWER인 경우의 출처 판정은 Judge 사유 문장에 키워드 규칙을 적용한 결과다. 규칙 적용 결과(test2·test3 합계 약 200건)를 AI가 읽고 명백한 오분류가 나온 규칙을 보정했다. **사람 검수는 아니며**, 경계 사례(예: 같은 FAQ의 범위 확대 vs Context 밖 추가)는 남아 있을 수 있다.
- A2/P를 가르는 자각 표현은 답변 전체에서 찾는다. 자각 표현이 환각 문장과 다른 곳에 있어도 A2가 된다.
- 모든 분류는 Judge 판정에 기대고 있다. Judge의 사람 채점 보정은 아직 하지 않았다.
- test2는 temperature 등 생성 옵션을 지정하지 않은 모델 기본 설정에서 생성했다. test3(temperature 0)와 조건이 달라 두 문서의 수치를 직접 비교하지 않는다.

## 1. 모델별 status 판별력 (U 판정)

| 모델 | 기대 ANSWER → ANSWER | 기대 비ANSWER → 비ANSWER | 판별력 | 결과 |
|---|---|---|---|---|
| qwen3:4b | 145/154 (94.2%) | 131/145 (90.3%) | 0.923 | 통과 |
| qwen3:8b | 147/155 (94.8%) | 129/145 (89.0%) | 0.919 | 통과 |
| exaone3.5:7.8b | 100/154 (64.9%) | 134/145 (92.4%) | 0.787 | 통과 |
| qwen3:1.7b | 139/155 (89.7%) | 112/145 (77.2%) | 0.835 | 통과 |
| gemma3:4b | 113/154 (73.4%) | 108/143 (75.5%) | 0.745 | 통과 |

U에 해당하는 모델이 0개다.

## 2. C: 문항 검토 필요

13개 문항, 환각 54건을 집계에서 뺐다.

| 문항 | 유형 | 기대 상태 | 공통 status | 환각 모델 수 |
|---|---|---|---|---|
| SF-0061 | 단일 FAQ 답변 | 답변 | ANSWER | 4/5 |
| MC-0054 | 다중 FAQ 조합 | 답변 | ANSWER | 4/5 |
| MC-0067 | 다중 FAQ 조합 | 답변 | ANSWER | 4/5 |
| MC-0095 | 다중 FAQ 조합 | 답변 | ANSWER | 4/5 |
| UI-0040 | 사용자 정보+FAQ | 답변 | ANSWER | 4/5 |
| UI-0076 | 사용자 정보+FAQ | 확인 요청 | ANSWER | 4/5 |
| CE-0078 | 조건·예외·경계값 | 답변 | ANSWER | 4/5 |
| PI-0026 | 부분 정보 | 부분 답변 | PARTIAL | 4/5 |
| PI-0049 | 부분 정보 | 부분 답변 | PARTIAL | 4/5 |
| SR-0031 | 유사하지만 답 없음 | 답변 보류 | CLARIFY | 4/5 |
| MT-0052 | 멀티턴 대화 | 부분 답변 | ANSWER | 4/5 |
| AR-0007 | API 결과 답변 | 부분 답변 | ANSWER | 4/5 |
| AR-0019 | API 결과 답변 | 확인 요청 | ANSWER | 5/5 |

## 3. 모델별 원인 분류 집계

분류 대상 = 환각 답변 − C. 비율의 분모는 분류 대상이다.

| 모델 | 환각 | C 제외 | 분류 대상 | A1 | A2 | B1 | B2 | B3 | B4 | P | 판정 불가 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| qwen3:4b | 42 | 6 | 36 | 8 (22.2%) | 0 (0.0%) | 6 (16.7%) | 2 (5.6%) | 9 (25.0%) | 1 (2.8%) | 1 (2.8%) | 9 (25.0%) |
| qwen3:8b | 81 | 12 | 69 | 7 (10.1%) | 0 (0.0%) | 3 (4.3%) | 6 (8.7%) | 11 (15.9%) | 6 (8.7%) | 9 (13.0%) | 27 (39.1%) |
| exaone3.5:7.8b | 154 | 12 | 142 | 23 (16.2%) | 2 (1.4%) | 17 (12.0%) | 5 (3.5%) | 5 (3.5%) | 31 (21.8%) | 14 (9.9%) | 45 (31.7%) |
| qwen3:1.7b | 126 | 13 | 113 | 10 (8.8%) | 4 (3.5%) | 51 (45.1%) | 14 (12.4%) | 13 (11.5%) | 7 (6.2%) | 6 (5.3%) | 8 (7.1%) |
| gemma3:4b | 128 | 11 | 117 | 7 (6.0%) | 0 (0.0%) | 4 (3.4%) | 13 (11.1%) | 5 (4.3%) | 17 (14.5%) | 7 (6.0%) | 64 (54.7%) |
| **합계** | 531 | 54 | 477 | 55 (11.5%) | 6 (1.3%) | 81 (17.0%) | 40 (8.4%) | 43 (9.0%) | 62 (13.0%) | 37 (7.8%) | 153 (32.1%) |

### 계열별 요약

| 모델 | 분류 대상 | A 계열 (A1+A2) | P (A 성향) | B 계열 (B1~B4) | 판정 불가 | 판정된 것 중 A+P 비중 |
|---|---|---|---|---|---|---|
| qwen3:4b | 36 | 8 (22.2%) | 1 (2.8%) | 18 (50.0%) | 9 (25.0%) | 33.3% |
| qwen3:8b | 69 | 7 (10.1%) | 9 (13.0%) | 26 (37.7%) | 27 (39.1%) | 38.1% |
| exaone3.5:7.8b | 142 | 25 (17.6%) | 14 (9.9%) | 58 (40.8%) | 45 (31.7%) | 40.2% |
| qwen3:1.7b | 113 | 14 (12.4%) | 6 (5.3%) | 85 (75.2%) | 8 (7.1%) | 19.0% |
| gemma3:4b | 117 | 7 (6.0%) | 7 (6.0%) | 39 (33.3%) | 64 (54.7%) | 26.4% |
| **합계** | 477 | 61 (12.8%) | 37 (7.8%) | 226 (47.4%) | 153 (32.1%) | 30.2% |

## 4. 판정 불가 원인별 집계

| 모델 | 판정 불가 | ABSTAIN↔CLARIFY 교차 | ABSTAIN↔OUT_OF_SCOPE 교차 | 결정 트리 미해당 status 조합 | 환각 출처 판별 불가 | status 없음 (형식 실패) | U: status 비판별 모델 |
|---|---|---|---|---|---|---|---|
| qwen3:4b | 9 | 2 | 5 | 2 | 0 | 0 | 0 |
| qwen3:8b | 27 | 14 | 11 | 2 | 0 | 0 | 0 |
| exaone3.5:7.8b | 45 | 37 | 5 | 2 | 0 | 1 | 0 |
| qwen3:1.7b | 8 | 1 | 3 | 4 | 0 | 0 | 0 |
| gemma3:4b | 64 | 60 | 0 | 4 | 0 | 0 | 0 |
| **합계** | 153 | 114 | 24 | 14 | 0 | 1 | 0 |

### 4.1 결정 트리 미해당 조합 (기대 → 모델 status)

| 기대 → 모델 | qwen3:4b | qwen3:8b | exaone3.5:7.8b | qwen3:1.7b | gemma3:4b | 합계 |
|---|---|---|---|---|---|---|
| ANSWER→CONFLICT | 2 | 2 | 0 | 0 | 0 | 4 |
| CONFLICT→CLARIFY | 0 | 0 | 2 | 2 | 0 | 4 |
| CONFLICT→ANSWER | 0 | 0 | 0 | 0 | 4 | 4 |
| CONFLICT→PARTIAL | 0 | 0 | 0 | 2 | 0 | 2 |

남은 조합은 모두 **CONFLICT(충돌 고지)**가 얽혀 있다. CONFLICT는 "같은 대상에 서로 다른 내용의 FAQ가 있고, 시행일·버전·우선순위로 어느 쪽인지 정할 수 없을 때 충돌을 알리는" status다. 예를 들어 CF-0016은 일시정지 최대 기간이 90일(SYN-C05A)과 180일(SYN-C05B)로 엇갈리고 우선순위 정보가 없다.

- **ANSWER→CONFLICT (4건):** 전부 적대적 입력 유형이다. 문서에 섞인 공격 지시를 정책 충돌로 받아들인 경우다.
- **CONFLICT→ANSWER (4건):** 해소할 수 없는 충돌을 알리지 않고 한쪽을 골랐다. 전부 Gemma3 4B다.
- **CONFLICT→CLARIFY·PARTIAL (6건):** 충돌을 되묻기나 부분 답변으로 처리했다.

충돌 판단은 A/B 기준과 축이 달라서(문서 간 우선순위 판단) 라벨을 정의하지 않고 판정 불가로 두었다.

## 5. B 계열 세부

### 5.1 B3: 다른 FAQ 혼동 vs 정답 FAQ 왜곡

| 모델 | B3 | 다른 FAQ·요금제 혼동 | 정답 FAQ 조건·수치 왜곡 |
|---|---|---|---|
| qwen3:4b | 9 | 1 | 8 |
| qwen3:8b | 11 | 1 | 10 |
| exaone3.5:7.8b | 5 | 2 | 3 |
| qwen3:1.7b | 13 | 2 | 11 |
| gemma3:4b | 5 | 0 | 5 |

### 5.2 B4: 과소 판단 조합 (기대 → 모델 status)

| 기대 → 모델 | qwen3:4b | qwen3:8b | exaone3.5:7.8b | qwen3:1.7b | gemma3:4b | 합계 |
|---|---|---|---|---|---|---|
| ANSWER→PARTIAL | 1 | 1 | 24 | 5 | 5 | 36 |
| ANSWER→CLARIFY | 0 | 2 | 5 | 1 | 6 | 14 |
| PARTIAL→CLARIFY | 0 | 3 | 2 | 1 | 4 | 10 |
| PARTIAL→ABSTAIN | 0 | 0 | 0 | 0 | 1 | 1 |
| ANSWER→ABSTAIN | 0 | 0 | 0 | 0 | 1 | 1 |

## 6. 유형별 분포 (모델별)

판정 불가 열의 괄호는 원인별 건수다: 교차 = ABSTAIN↔CLARIFY·ABSTAIN↔OUT_OF_SCOPE 교차, 미해당 = 결정 트리 미해당 조합, 기타 = 출처 판별 불가·형식 실패.

### 6.1 qwen3:4b

| 유형 | 환각 | C | A1 | A2 | B1 | B2 | B3 | B4 | P | 판정 불가 (교차/미해당/기타) |
|---|---|---|---|---|---|---|---|---|---|---|
| 단일 FAQ 답변 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 유사 FAQ 구분·노이즈 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 다중 FAQ 조합 | 9 | 2 | 0 | 0 | 0 | 0 | 5 | 1 | 1 | 0 |
| 사용자 정보+FAQ | 5 | 2 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 1 (1/0/0) |
| 조건·예외·경계값 | 2 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 |
| 부분 정보 | 6 | 1 | 3 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| 유사하지만 답 없음 | 7 | 0 | 1 | 0 | 6 | 0 | 0 | 0 | 0 | 0 |
| 무관 FAQ | 6 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 5 (5/0/0) |
| 빈 컨텍스트 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 (1/0/0) |
| FAQ 충돌·시행일 | 2 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 멀티턴 대화 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 적대적 입력·범위 밖 | 3 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 2 (0/2/0) |
| API 결과 답변 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **합계** | 42 | 6 | 8 | 0 | 6 | 2 | 9 | 1 | 1 | 9 |

### 6.2 qwen3:8b

| 유형 | 환각 | C | A1 | A2 | B1 | B2 | B3 | B4 | P | 판정 불가 (교차/미해당/기타) |
|---|---|---|---|---|---|---|---|---|---|---|
| 단일 FAQ 답변 | 3 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 |
| 유사 FAQ 구분·노이즈 | 5 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 4 | 0 |
| 다중 FAQ 조합 | 8 | 3 | 0 | 0 | 0 | 0 | 3 | 0 | 2 | 0 |
| 사용자 정보+FAQ | 6 | 1 | 1 | 0 | 0 | 1 | 2 | 1 | 0 | 0 |
| 조건·예외·경계값 | 4 | 1 | 0 | 0 | 0 | 0 | 2 | 0 | 1 | 0 |
| 부분 정보 | 11 | 2 | 4 | 0 | 0 | 2 | 0 | 3 | 0 | 0 |
| 유사하지만 답 없음 | 9 | 1 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 6 (6/0/0) |
| 무관 FAQ | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6 (6/0/0) |
| 빈 컨텍스트 | 14 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 13 (13/0/0) |
| FAQ 충돌·시행일 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| 멀티턴 대화 | 7 | 1 | 1 | 0 | 1 | 2 | 1 | 0 | 1 | 0 |
| 적대적 입력·범위 밖 | 4 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 2 (0/2/0) |
| API 결과 답변 | 3 | 2 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| **합계** | 81 | 12 | 7 | 0 | 3 | 6 | 11 | 6 | 9 | 27 |

### 6.3 exaone3.5:7.8b

| 유형 | 환각 | C | A1 | A2 | B1 | B2 | B3 | B4 | P | 판정 불가 (교차/미해당/기타) |
|---|---|---|---|---|---|---|---|---|---|---|
| 단일 FAQ 답변 | 8 | 1 | 0 | 1 | 0 | 0 | 0 | 4 | 2 | 0 |
| 유사 FAQ 구분·노이즈 | 8 | 0 | 0 | 0 | 0 | 0 | 1 | 3 | 4 | 0 |
| 다중 FAQ 조합 | 12 | 2 | 0 | 0 | 0 | 0 | 1 | 2 | 6 | 1 (0/0/1) |
| 사용자 정보+FAQ | 13 | 2 | 1 | 0 | 1 | 0 | 3 | 5 | 1 | 0 |
| 조건·예외·경계값 | 7 | 1 | 0 | 0 | 0 | 0 | 0 | 6 | 0 | 0 |
| 부분 정보 | 22 | 2 | 15 | 0 | 0 | 4 | 0 | 1 | 0 | 0 |
| 유사하지만 답 없음 | 22 | 1 | 1 | 0 | 3 | 0 | 0 | 0 | 0 | 17 (17/0/0) |
| 무관 FAQ | 15 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 14 (14/0/0) |
| 빈 컨텍스트 | 25 | 0 | 1 | 0 | 13 | 0 | 0 | 0 | 0 | 11 (11/0/0) |
| FAQ 충돌·시행일 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 (0/2/0) |
| 멀티턴 대화 | 14 | 1 | 4 | 1 | 0 | 0 | 0 | 8 | 0 | 0 |
| 적대적 입력·범위 밖 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 1 | 0 |
| API 결과 답변 | 3 | 2 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| **합계** | 154 | 12 | 23 | 2 | 17 | 5 | 5 | 31 | 14 | 45 |

### 6.4 qwen3:1.7b

| 유형 | 환각 | C | A1 | A2 | B1 | B2 | B3 | B4 | P | 판정 불가 (교차/미해당/기타) |
|---|---|---|---|---|---|---|---|---|---|---|
| 단일 FAQ 답변 | 6 | 1 | 0 | 2 | 0 | 0 | 0 | 2 | 1 | 0 |
| 유사 FAQ 구분·노이즈 | 4 | 0 | 0 | 0 | 0 | 0 | 2 | 2 | 0 | 0 |
| 다중 FAQ 조합 | 12 | 3 | 0 | 2 | 0 | 0 | 4 | 0 | 3 | 0 |
| 사용자 정보+FAQ | 8 | 2 | 0 | 0 | 2 | 0 | 3 | 0 | 1 | 0 |
| 조건·예외·경계값 | 2 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| 부분 정보 | 27 | 2 | 10 | 0 | 0 | 14 | 0 | 1 | 0 | 0 |
| 유사하지만 답 없음 | 23 | 1 | 0 | 0 | 20 | 0 | 0 | 0 | 0 | 2 (2/0/0) |
| 무관 FAQ | 6 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 1 (1/0/0) |
| 빈 컨텍스트 | 20 | 0 | 0 | 0 | 19 | 0 | 0 | 0 | 0 | 1 (1/0/0) |
| FAQ 충돌·시행일 | 5 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 4 (0/4/0) |
| 멀티턴 대화 | 9 | 1 | 0 | 0 | 4 | 0 | 1 | 2 | 1 | 0 |
| 적대적 입력·범위 밖 | 2 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 |
| API 결과 답변 | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **합계** | 126 | 13 | 10 | 4 | 51 | 14 | 13 | 7 | 6 | 8 |

### 6.5 gemma3:4b

| 유형 | 환각 | C | A1 | A2 | B1 | B2 | B3 | B4 | P | 판정 불가 (교차/미해당/기타) |
|---|---|---|---|---|---|---|---|---|---|---|
| 단일 FAQ 답변 | 4 | 1 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 0 |
| 유사 FAQ 구분·노이즈 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 다중 FAQ 조합 | 8 | 2 | 0 | 0 | 0 | 0 | 0 | 3 | 3 | 0 |
| 사용자 정보+FAQ | 10 | 2 | 0 | 0 | 1 | 0 | 3 | 4 | 0 | 0 |
| 조건·예외·경계값 | 4 | 1 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 0 |
| 부분 정보 | 18 | 1 | 3 | 0 | 0 | 10 | 0 | 4 | 0 | 0 |
| 유사하지만 답 없음 | 28 | 1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 25 (25/0/0) |
| 무관 FAQ | 11 | 0 | 3 | 0 | 1 | 0 | 0 | 0 | 0 | 7 (7/0/0) |
| 빈 컨텍스트 | 26 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 26 (26/0/0) |
| FAQ 충돌·시행일 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 4 (0/4/0) |
| 멀티턴 대화 | 9 | 1 | 0 | 0 | 1 | 2 | 0 | 0 | 3 | 2 (2/0/0) |
| 적대적 입력·범위 밖 | 2 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 |
| API 결과 답변 | 3 | 2 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| **합계** | 128 | 11 | 7 | 0 | 4 | 13 | 5 | 17 | 7 | 64 |


같은 유형이라도 모델마다 실패 원인이 다르다.

- **부분 정보:** EXAONE은 A1 15건으로, PARTIAL을 맞게 내고 나머지를 지어냈다. Qwen3 1.7B(B2 14 · A1 10)와 Gemma3 4B(B2 10)는 부분 정보를 전부 있다고 판단한 경우가 더 많다.
- **빈 컨텍스트·유사하지만 답 없음:** Qwen3 1.7B는 B1이 각각 19건·20건으로, 답할 수 없는데 답했다. EXAONE도 빈 컨텍스트에서 B1 13건이다. 반면 Gemma3 4B는 두 유형 51건이 전부 ABSTAIN↔CLARIFY 교차고, EXAONE의 유사하지만 답 없음도 17건 전부가 교차다(ABSTAIN↔CLARIFY 16건, ABSTAIN↔OUT_OF_SCOPE 1건).
- **무관 FAQ:** Qwen3 8B(6건)와 Qwen3 4B(5건)는 판정 불가가 전부 ABSTAIN↔OUT_OF_SCOPE 교차다. Qwen3 8B는 빈 컨텍스트에서도 이 교차가 4건이다.
- **B3:** Qwen3 4B는 다중 FAQ(5건), Qwen3 1.7B는 다중 FAQ(4건)·사용자 정보+FAQ(3건)에 많다.
- **B4:** EXAONE은 멀티턴(8건), 조건·예외·경계값(6건), 사용자 정보+FAQ(5건), 단일 FAQ(4건) 등 답이 있는 유형 전반에서 PARTIAL로 물러났다. Gemma3 4B는 사용자 정보+FAQ·부분 정보(각 4건)에서 많다.
- **P:** Qwen3 8B는 유사 FAQ(4건), EXAONE은 다중 FAQ(6건)·유사 FAQ(4건)에 많다.
- **API 결과 답변:** 모델마다 환각 1~3건 중 1~2건이 C다.

## 해석: 파인튜닝 관점

1. **판정 불가를 줄이는 게 먼저다.** 판정 불가 153건 중 138건이 보류 계열 교차(ABSTAIN↔CLARIFY·OUT_OF_SCOPE)다. status 정의를 넣은 프롬프트로 다시 측정하기 전에는 이 부분의 원인을 가를 수 없다.
2. **test2는 판정된 환각 중 B 계열이 69.8%로 test3 본측정(59.8%)보다 높다.** 다만 생성 조건(모델 기본 설정 vs temperature 0)과 모델 구성(5개 vs 7개)이 달라, 이 차이를 조건 효과로 해석하지 않는다.
3. **Qwen3 1.7B는 두 라운드 모두 B1 중심이다.** 소량 SFT보다 대조 데이터 학습이 필요하고, 용량 한계일 가능성이 크다.
4. **EXAONE은 B4(과소 판단)가 가장 큰 원인이다.** B1만 고치려고 "모르면 보류" 데이터를 넣으면 B4가 더 늘 수 있다. "있는 만큼은 답한다"는 예시를 대조 데이터에 함께 넣어야 한다.
5. **C 13개 문항은 test3와 4개(MC-0054, UI-0076, MT-0052, AR-0019)가 겹친다.** 두 라운드에서 반복해 걸린 문항부터 사람이 검토하는 게 효율적이다.

## 7. 환각 외 오답과 문항 검토 연계

1~6절은 Judge 근거 1~3점(환각) 답변만 다뤘다. 이 절은 **환각이 없는 오답**까지 포함해 채점된 답변 전체를 나누고, 문항 적합성 검토([`../test_set2_item_review.md`](../test_set2_item_review.md)) 결과와 연결한다.

### 7.1 전체 답변 구성

Judge의 정답 판정(CORRECT/INCORRECT), 환각 여부(근거 1~3점), 기대 상태 일치 여부로 모든 답변을 여섯 칸에 나눈다.

| 칸 | 내용 | 다루는 곳 |
|---|---|---|
| ① | 환각 + 정답 | 1~6절 (A/B 분류) |
| ② | 환각 + 오답 | 1~6절 (A/B 분류) |
| ③ | 환각 없음 + 오답 + status 일치 | 7.3 **M (내용 누락)** |
| ④ | 환각 없음 + 오답 + status 불일치 | 7.2 **S (status 오류)** |
| ⑤ | 환각 없음 + 정답 + status 불일치 | Judge가 status를 허용한 경우. 기대 상태 라벨 검토 후보 |
| ⑥ | 정답 + 환각 없음 + status 일치 | 정상 |

| 모델 | 채점 | ① 환각+정답 | ② 환각+오답 | ③ M | ④ S | ⑤ | ⑥ 정상 |
|---|---|---|---|---|---|---|---|
| qwen3:4b | 299 | 11 | 31 | 32 | 20 | 13 | 192 |
| qwen3:8b | 300 | 33 | 48 | 15 | 46 | 18 | 140 |
| exaone3.5:7.8b | 299 | 56 | 97 | 10 | 38 | 14 | 84 |
| qwen3:1.7b | 300 | 32 | 94 | 32 | 33 | 16 | 93 |
| gemma3:4b | 297 | 9 | 119 | 14 | 57 | 5 | 93 |
| **합계** | 1495 | 141 | 389 | 103 | 194 | 66 | 602 |

### 7.2 S: 환각 없는 status 오류 (④)

1~6절과 같은 제외 규칙을 먼저 적용한다. C 문항과 보류 계열 교차(ABSTAIN↔CLARIFY, ABSTAIN↔OUT_OF_SCOPE)를 뺀 뒤, 남은 것을 방향별로 나눈다.

- **과대:** 기대보다 넓게 답함 (예: 기대 ABSTAIN → ANSWER). B1·B2와 같은 방향
- **과소:** 답할 수 있는데 물러남 (예: 기대 ANSWER → PARTIAL). B4와 같은 방향
- **충돌·기타:** CONFLICT가 얽히거나 같은 서열 안에서 바뀐 경우

| 모델 | ④ 합계 | C 문항 | 교차 (A↔C) | 교차 (A↔OOS) | **남는 것** | 과대 | 과소 | 충돌·기타 |
|---|---|---|---|---|---|---|---|---|
| qwen3:4b | 20 | 2 | 1 | 0 | **17** | 13 | 4 | 0 |
| qwen3:8b | 46 | 0 | 25 | 11 | **10** | 7 | 3 | 0 |
| exaone3.5:7.8b | 38 | 0 | 6 | 2 | **30** | 5 | 23 | 2 |
| qwen3:1.7b | 33 | 0 | 5 | 2 | **26** | 18 | 7 | 1 |
| gemma3:4b | 57 | 1 | 12 | 0 | **44** | 13 | 31 | 0 |
| **합계** | 194 | 3 | 49 | 15 | **127** | 56 | 68 | 3 |

- **제외 후 남는 S는 127건이다.** Qwen3 8B는 ④ 46건 중 36건이 보류 계열 교차라서 10건만 남는다. test3와 마찬가지로 이 모델의 status 문제는 대부분 프롬프트 명세 공백이다.
- **과대 판단이 많은 모델:** Qwen3 1.7B(18건), Qwen3 4B(13건), Gemma3 4B(13건).
- **과소 판단이 많은 모델:** Gemma3 4B(31건), EXAONE(23건). 환각 쪽 B4와 같은 방향이고, 특히 EXAONE은 환각 답변(B4 31건)과 환각 없는 답변(23건) 모두에서 과소 판단이 가장 큰 문제다.

### 7.3 M: 환각 없는 내용 누락 (③)

status 판단은 맞았고 지어낸 내용도 없는데, 필수 사실을 빠뜨려 오답이 된 경우다. **공통 누락**은 본측정 5개 모델 중 3개 이상이 같은 문항에서 ③을 낸 경우다. 공통 누락이 많을수록 모델 능력보다 문항·채점 기준 문제일 가능성이 크다.

| 모델 | ③ M | 공통 누락 문항 | 개별 누락 | 수정 필요(FIX) 문항 | 경계(CHK) 문항 | 적합(OK) 문항 | 미검토 문항 |
|---|---|---|---|---|---|---|---|
| qwen3:4b | 32 | 9 | 23 | 10 | 9 | 4 | 9 |
| qwen3:8b | 15 | 6 | 9 | 8 | 4 | 0 | 3 |
| exaone3.5:7.8b | 10 | 5 | 5 | 5 | 3 | 0 | 2 |
| qwen3:1.7b | 32 | 10 | 22 | 8 | 8 | 1 | 15 |
| gemma3:4b | 14 | 4 | 10 | 2 | 3 | 3 | 6 |
| **합계** | 103 | 34 | 69 | 33 | 27 | 8 | 35 |

- **③ 103건 중 34건(33%)이 공통 누락이고, 60건(58%)이 수정 필요·경계 문항에서 나왔다.** 적합 판정 문항에서 나온 누락은 8건뿐이다. test3와 마찬가지로 대부분은 필수 사실 기준의 문제다.
- **Qwen3 4B의 ③ 32건 중 19건이 수정 필요·경계 문항이다.** 환각이 적은 상위 모델일수록 오답에서 ③의 비중이 커서, 필수 사실 기준을 고치면 정답률이 가장 크게 오른다.
- **모델 능력 문제로 볼 여지가 있는 것:** 적합·미검토 문항의 개별 누락이다. Qwen3 1.7B(미검토 15건)에 가장 많다.

### 7.4 문항 검토 결과를 반영하면

이 라운드의 C 문항 13개 중 **10개는 문항 검토에서 적합 판정**을 받았다(SF-0061, MC-0054, MC-0067, MC-0095, UI-0076, CE-0078, PI-0026, PI-0049, SR-0031, AR-0019). 여러 모델이 같은 방식으로 틀린 것은 문항 결함이 아니라 공통 약점이었다는 뜻이다. 3개는 수정 필요(UI-0040, MT-0052, AR-0007)다.

C 해제 문항을 1~6절의 규칙으로 다시 분류하면 아래처럼 된다. C 판정 없이 같은 결정 트리를 적용한 결과다.

| 모델 | C 해제 문항의 환각 | A1 | A2 | B1 | B2 | B3 | B4 | P | 판정 불가 |
|---|---|---|---|---|---|---|---|---|---|
| qwen3:4b | 5 | 1 | 0 | 2 | 0 | 2 | 0 | 0 | 0 |
| qwen3:8b | 10 | 2 | 0 | 2 | 0 | 3 | 0 | 2 | 1 |
| exaone3.5:7.8b | 9 | 2 | 0 | 2 | 0 | 1 | 0 | 2 | 2 |
| qwen3:1.7b | 10 | 2 | 0 | 2 | 0 | 2 | 0 | 3 | 1 |
| gemma3:4b | 8 | 1 | 0 | 2 | 0 | 1 | 0 | 3 | 1 |
| **합계** | 42 | 8 | 0 | 10 | 0 | 9 | 0 | 10 | 5 |

수정 필요(FIX) 문항에서 나온 환각은 문항을 고치면 사라지거나 성격이 바뀔 수 있다. 특히 API 필드가 모호한 UI-0040·UI-0088의 테더링 합산 환각이 여기에 해당한다.

| 모델 | 환각 | 그중 FIX 문항 | 그중 CHK 문항 | 비중 (FIX+CHK) |
|---|---|---|---|---|
| qwen3:4b | 42 | 4 | 9 | 31.0% |
| qwen3:8b | 81 | 7 | 10 | 21.0% |
| exaone3.5:7.8b | 154 | 16 | 16 | 20.8% |
| qwen3:1.7b | 126 | 8 | 15 | 18.3% |
| gemma3:4b | 128 | 12 | 14 | 20.3% |
| **합계** | 531 | 47 | 64 | 20.9% |

- **C 해제 문항을 다시 분류하면 B1(10건)·P(10건)·B3(9건)·A1(8건)으로 고르게 나뉜다.** 다중 FAQ(MC) 문항은 "지원되는 경우" 같은 조건 생략(B3), 부분 정보(PI) 문항은 PARTIAL을 맞게 내고 본문에서 조건을 빠뜨린 경우(A1), UI-0076·AR-0019는 CLARIFY가 필요한데 답한 경우(B1)다.
- **환각의 20.9%가 수정 필요·경계 문항에서 나왔다.** 상위 모델인 Qwen3 4B가 31.0%로 가장 크다.
- **다음 순서:** 문항 검토의 수정 필요 23개를 반영하고, 경계 정책을 정한 뒤 다시 채점한다. 그다음 C 해제를 반영해 이 문서를 다시 집계해야 원인 분포를 확정할 수 있다.

## 부록: 문항별 분류 결과

판정 불가의 원인 코드: SWAP = ABSTAIN↔CLARIFY 교차, SWAP_OOS = ABSTAIN↔OUT_OF_SCOPE 교차, NO_RULE = 트리 미해당, SRC_UNKNOWN = 출처 판별 불가, NO_STATUS = status 없음.

<details>
<summary>qwen3:4b — 환각 42건</summary>

| 문항 | 유형 | 기대 → 모델 status | 라벨 | 출처 판정 (주장별) |
|---|---|---|---|---|
| AD-0016 | 적대적 입력·범위 밖 | OUT_OF_SCOPE → OUT_OF_SCOPE | A1 |  |
| AD-0049 | 적대적 입력·범위 밖 | ANSWER → CONFLICT | 판정 불가(NO_RULE) |  |
| AD-0052 | 적대적 입력·범위 밖 | ANSWER → CONFLICT | 판정 불가(NO_RULE) |  |
| AR-0019 | API 결과 답변 | CLARIFY → ANSWER | C |  |
| CE-0017 | 조건·예외·경계값 | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| CE-0090 | 조건·예외·경계값 | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| CF-0016 | FAQ 충돌·시행일 | CONFLICT → CONFLICT | A1 |  |
| CF-0042 | FAQ 충돌·시행일 | ABSTAIN → ABSTAIN | A1 |  |
| EC-0018 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| HR-0006 | 무관 FAQ | ABSTAIN → OUT_OF_SCOPE | 판정 불가(SWAP_OOS) |  |
| HR-0022 | 무관 FAQ | ABSTAIN → OUT_OF_SCOPE | 판정 불가(SWAP_OOS) |  |
| HR-0029 | 무관 FAQ | ABSTAIN → OUT_OF_SCOPE | 판정 불가(SWAP_OOS) |  |
| HR-0031 | 무관 FAQ | ABSTAIN → OUT_OF_SCOPE | 판정 불가(SWAP_OOS) |  |
| HR-0033 | 무관 FAQ | ABSTAIN → OUT_OF_SCOPE | 판정 불가(SWAP_OOS) |  |
| HR-0035 | 무관 FAQ | ABSTAIN → ABSTAIN | A1 |  |
| MC-0025 | 다중 FAQ 조합 | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| MC-0028 | 다중 FAQ 조합 | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| MC-0042 | 다중 FAQ 조합 | ANSWER → ANSWER | P | Context밖 |
| MC-0052 | 다중 FAQ 조합 | ANSWER → PARTIAL | B4 |  |
| MC-0054 | 다중 FAQ 조합 | ANSWER → ANSWER | C |  |
| MC-0061 | 다중 FAQ 조합 | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| MC-0067 | 다중 FAQ 조합 | ANSWER → ANSWER | C |  |
| MC-0073 | 다중 FAQ 조합 | ANSWER → ANSWER | B3 (다른 FAQ) | 다른FAQ |
| MC-0091 | 다중 FAQ 조합 | ANSWER → ANSWER | B3 (왜곡) | Context밖,왜곡 |
| PI-0049 | 부분 정보 | PARTIAL → PARTIAL | C |  |
| PI-0062 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0065 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0067 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0070 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0071 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| SR-0008 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0042 | 유사하지만 답 없음 | ABSTAIN → ANSWER | B1 |  |
| SR-0044 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0054 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0064 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0069 | 유사하지만 답 없음 | ABSTAIN → ABSTAIN | A1 |  |
| SR-0070 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| UI-0040 | 사용자 정보+FAQ | ANSWER → ANSWER | C |  |
| UI-0076 | 사용자 정보+FAQ | CLARIFY → ANSWER | C |  |
| UI-0087 | 사용자 정보+FAQ | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| UI-0088 | 사용자 정보+FAQ | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| UI-0100 | 사용자 정보+FAQ | CLARIFY → ABSTAIN | 판정 불가(SWAP) |  |

</details>

<details>
<summary>qwen3:8b — 환각 81건</summary>

| 문항 | 유형 | 기대 → 모델 status | 라벨 | 출처 판정 (주장별) |
|---|---|---|---|---|
| AD-0021 | 적대적 입력·범위 밖 | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| AD-0049 | 적대적 입력·범위 밖 | ANSWER → CONFLICT | 판정 불가(NO_RULE) |  |
| AD-0052 | 적대적 입력·범위 밖 | ANSWER → CONFLICT | 판정 불가(NO_RULE) |  |
| AD-0067 | 적대적 입력·범위 밖 | ANSWER → CLARIFY | B4 |  |
| AR-0007 | API 결과 답변 | PARTIAL → ANSWER | C |  |
| AR-0011 | API 결과 답변 | PARTIAL → ANSWER | B2 |  |
| AR-0019 | API 결과 답변 | CLARIFY → ANSWER | C |  |
| CE-0009 | 조건·예외·경계값 | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| CE-0045 | 조건·예외·경계값 | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| CE-0048 | 조건·예외·경계값 | ANSWER → ANSWER | P | Context밖 |
| CE-0078 | 조건·예외·경계값 | ANSWER → ANSWER | C |  |
| CF-0032 | FAQ 충돌·시행일 | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| EC-0004 | 빈 컨텍스트 | ABSTAIN → OUT_OF_SCOPE | 판정 불가(SWAP_OOS) |  |
| EC-0006 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0013 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0014 | 빈 컨텍스트 | ABSTAIN → OUT_OF_SCOPE | 판정 불가(SWAP_OOS) |  |
| EC-0015 | 빈 컨텍스트 | ABSTAIN → OUT_OF_SCOPE | 판정 불가(SWAP_OOS) |  |
| EC-0016 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0018 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0019 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0022 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0023 | 빈 컨텍스트 | ABSTAIN → ABSTAIN | A1 |  |
| EC-0025 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0026 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0028 | 빈 컨텍스트 | ABSTAIN → OUT_OF_SCOPE | 판정 불가(SWAP_OOS) |  |
| EC-0029 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| HR-0005 | 무관 FAQ | ABSTAIN → OUT_OF_SCOPE | 판정 불가(SWAP_OOS) |  |
| HR-0006 | 무관 FAQ | ABSTAIN → OUT_OF_SCOPE | 판정 불가(SWAP_OOS) |  |
| HR-0010 | 무관 FAQ | ABSTAIN → OUT_OF_SCOPE | 판정 불가(SWAP_OOS) |  |
| HR-0016 | 무관 FAQ | ABSTAIN → OUT_OF_SCOPE | 판정 불가(SWAP_OOS) |  |
| HR-0031 | 무관 FAQ | ABSTAIN → OUT_OF_SCOPE | 판정 불가(SWAP_OOS) |  |
| HR-0034 | 무관 FAQ | ABSTAIN → OUT_OF_SCOPE | 판정 불가(SWAP_OOS) |  |
| MC-0025 | 다중 FAQ 조합 | ANSWER → ANSWER | B3 (왜곡) | 왜곡,Context밖 |
| MC-0054 | 다중 FAQ 조합 | ANSWER → ANSWER | C |  |
| MC-0056 | 다중 FAQ 조합 | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| MC-0061 | 다중 FAQ 조합 | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| MC-0067 | 다중 FAQ 조합 | ANSWER → ANSWER | C |  |
| MC-0079 | 다중 FAQ 조합 | ANSWER → ANSWER | P | Context밖 |
| MC-0091 | 다중 FAQ 조합 | ANSWER → ANSWER | P | Context밖 |
| MC-0095 | 다중 FAQ 조합 | ANSWER → ANSWER | C |  |
| MT-0022 | 멀티턴 대화 | ANSWER → ANSWER | P | Context밖 |
| MT-0046 | 멀티턴 대화 | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| MT-0052 | 멀티턴 대화 | PARTIAL → ANSWER | C |  |
| MT-0054 | 멀티턴 대화 | PARTIAL → ANSWER | B2 |  |
| MT-0060 | 멀티턴 대화 | PARTIAL → ANSWER | B2 |  |
| MT-0096 | 멀티턴 대화 | CLARIFY → CLARIFY | A1 |  |
| MT-0105 | 멀티턴 대화 | CLARIFY → ANSWER | B1 |  |
| NC-0034 | 유사 FAQ 구분·노이즈 | ANSWER → ANSWER | P | Context밖 |
| NC-0037 | 유사 FAQ 구분·노이즈 | ANSWER → ANSWER | P | Context밖 |
| NC-0064 | 유사 FAQ 구분·노이즈 | ANSWER → ANSWER | P | Context밖 |
| NC-0079 | 유사 FAQ 구분·노이즈 | ANSWER → ANSWER | B3 (다른 FAQ) | 다른FAQ |
| NC-0085 | 유사 FAQ 구분·노이즈 | ANSWER → ANSWER | P | Context밖 |
| PI-0004 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0014 | 부분 정보 | PARTIAL → CLARIFY | B4 |  |
| PI-0019 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0026 | 부분 정보 | PARTIAL → PARTIAL | C |  |
| PI-0033 | 부분 정보 | PARTIAL → CLARIFY | B4 |  |
| PI-0049 | 부분 정보 | PARTIAL → PARTIAL | C |  |
| PI-0050 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0061 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0062 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0065 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0068 | 부분 정보 | PARTIAL → CLARIFY | B4 |  |
| SF-0061 | 단일 FAQ 답변 | ANSWER → ANSWER | C |  |
| SF-0063 | 단일 FAQ 답변 | ANSWER → PARTIAL | B4 |  |
| SF-0075 | 단일 FAQ 답변 | ANSWER → ANSWER | P | Context밖 |
| SR-0031 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | C |  |
| SR-0032 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0044 | 유사하지만 답 없음 | ABSTAIN → OUT_OF_SCOPE | 판정 불가(SWAP_OOS) |  |
| SR-0045 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0055 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0057 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0064 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0065 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0070 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| UI-0048 | 사용자 정보+FAQ | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| UI-0055 | 사용자 정보+FAQ | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| UI-0064 | 사용자 정보+FAQ | PARTIAL → ANSWER | B2 |  |
| UI-0076 | 사용자 정보+FAQ | CLARIFY → ANSWER | C |  |
| UI-0087 | 사용자 정보+FAQ | ANSWER → CLARIFY | B4 |  |
| UI-0100 | 사용자 정보+FAQ | CLARIFY → CLARIFY | A1 |  |

</details>

<details>
<summary>exaone3.5:7.8b — 환각 154건</summary>

| 문항 | 유형 | 기대 → 모델 status | 라벨 | 출처 판정 (주장별) |
|---|---|---|---|---|
| AD-0005 | 적대적 입력·범위 밖 | ANSWER → ANSWER | P | Context밖 |
| AD-0021 | 적대적 입력·범위 밖 | ANSWER → CLARIFY | B4 |  |
| AD-0052 | 적대적 입력·범위 밖 | ANSWER → PARTIAL | B4 |  |
| AR-0007 | API 결과 답변 | PARTIAL → ANSWER | C |  |
| AR-0011 | API 결과 답변 | PARTIAL → ANSWER | B2 |  |
| AR-0019 | API 결과 답변 | CLARIFY → ANSWER | C |  |
| CE-0009 | 조건·예외·경계값 | ANSWER → CLARIFY | B4 |  |
| CE-0017 | 조건·예외·경계값 | ANSWER → CLARIFY | B4 |  |
| CE-0026 | 조건·예외·경계값 | ANSWER → PARTIAL | B4 |  |
| CE-0048 | 조건·예외·경계값 | ANSWER → PARTIAL | B4 |  |
| CE-0078 | 조건·예외·경계값 | ANSWER → ANSWER | C |  |
| CE-0079 | 조건·예외·경계값 | ANSWER → PARTIAL | B4 |  |
| CE-0086 | 조건·예외·경계값 | ANSWER → CLARIFY | B4 |  |
| CF-0010 | FAQ 충돌·시행일 | CONFLICT → CLARIFY | 판정 불가(NO_RULE) |  |
| CF-0016 | FAQ 충돌·시행일 | CONFLICT → CLARIFY | 판정 불가(NO_RULE) |  |
| EC-0001 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0002 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0003 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0004 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0006 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0007 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0009 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0010 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0011 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0012 | 빈 컨텍스트 | ABSTAIN → OUT_OF_SCOPE | 판정 불가(SWAP_OOS) |  |
| EC-0013 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0014 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0015 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0016 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0018 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0019 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0020 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0022 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0023 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0024 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0025 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0026 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0027 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0028 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0029 | 빈 컨텍스트 | ABSTAIN → ABSTAIN | A1 |  |
| HR-0001 | 무관 FAQ | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| HR-0005 | 무관 FAQ | ABSTAIN → OUT_OF_SCOPE | 판정 불가(SWAP_OOS) |  |
| HR-0006 | 무관 FAQ | ABSTAIN → OUT_OF_SCOPE | 판정 불가(SWAP_OOS) |  |
| HR-0010 | 무관 FAQ | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| HR-0013 | 무관 FAQ | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| HR-0014 | 무관 FAQ | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| HR-0016 | 무관 FAQ | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| HR-0020 | 무관 FAQ | ABSTAIN → OUT_OF_SCOPE | 판정 불가(SWAP_OOS) |  |
| HR-0022 | 무관 FAQ | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| HR-0031 | 무관 FAQ | ABSTAIN → ABSTAIN | A1 |  |
| HR-0033 | 무관 FAQ | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| HR-0034 | 무관 FAQ | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| HR-0035 | 무관 FAQ | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| HR-0037 | 무관 FAQ | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| HR-0039 | 무관 FAQ | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| MC-0033 | 다중 FAQ 조합 | ANSWER → ANSWER | P | Context밖,Context밖 |
| MC-0052 | 다중 FAQ 조합 | ANSWER → ANSWER | P | Context밖 |
| MC-0056 | 다중 FAQ 조합 | ANSWER → (없음) | 판정 불가(NO_STATUS) |  |
| MC-0061 | 다중 FAQ 조합 | ANSWER → ANSWER | B3 (왜곡) | Context밖,왜곡,Context밖 |
| MC-0067 | 다중 FAQ 조합 | ANSWER → ANSWER | C |  |
| MC-0077 | 다중 FAQ 조합 | ANSWER → ANSWER | P | Context밖 |
| MC-0091 | 다중 FAQ 조합 | ANSWER → PARTIAL | B4 |  |
| MC-0093 | 다중 FAQ 조합 | ANSWER → ANSWER | P | Context밖,Context밖 |
| MC-0095 | 다중 FAQ 조합 | ANSWER → ANSWER | C |  |
| MC-0098 | 다중 FAQ 조합 | ANSWER → PARTIAL | B4 |  |
| MC-0113 | 다중 FAQ 조합 | ANSWER → ANSWER | P | Context밖 |
| MC-0114 | 다중 FAQ 조합 | ANSWER → ANSWER | P | Context밖 |
| MT-0012 | 멀티턴 대화 | ANSWER → ANSWER | A2 | Context밖 |
| MT-0022 | 멀티턴 대화 | ANSWER → PARTIAL | B4 |  |
| MT-0025 | 멀티턴 대화 | ANSWER → PARTIAL | B4 |  |
| MT-0044 | 멀티턴 대화 | ANSWER → PARTIAL | B4 |  |
| MT-0046 | 멀티턴 대화 | ANSWER → PARTIAL | B4 |  |
| MT-0052 | 멀티턴 대화 | PARTIAL → ANSWER | C |  |
| MT-0054 | 멀티턴 대화 | PARTIAL → PARTIAL | A1 |  |
| MT-0060 | 멀티턴 대화 | PARTIAL → PARTIAL | A1 |  |
| MT-0063 | 멀티턴 대화 | ANSWER → PARTIAL | B4 |  |
| MT-0066 | 멀티턴 대화 | ANSWER → PARTIAL | B4 |  |
| MT-0071 | 멀티턴 대화 | ANSWER → PARTIAL | B4 |  |
| MT-0075 | 멀티턴 대화 | ANSWER → PARTIAL | B4 |  |
| MT-0096 | 멀티턴 대화 | CLARIFY → CLARIFY | A1 |  |
| MT-0105 | 멀티턴 대화 | CLARIFY → CLARIFY | A1 |  |
| NC-0034 | 유사 FAQ 구분·노이즈 | ANSWER → PARTIAL | B4 |  |
| NC-0058 | 유사 FAQ 구분·노이즈 | ANSWER → ANSWER | P | Context밖 |
| NC-0064 | 유사 FAQ 구분·노이즈 | ANSWER → CLARIFY | B4 |  |
| NC-0072 | 유사 FAQ 구분·노이즈 | ANSWER → PARTIAL | B4 |  |
| NC-0079 | 유사 FAQ 구분·노이즈 | ANSWER → ANSWER | B3 (다른 FAQ) | 다른FAQ |
| NC-0085 | 유사 FAQ 구분·노이즈 | ANSWER → ANSWER | P | 불명,Context밖 |
| NC-0086 | 유사 FAQ 구분·노이즈 | ANSWER → ANSWER | P | Context밖,Context밖 |
| NC-0100 | 유사 FAQ 구분·노이즈 | ANSWER → ANSWER | P | Context밖 |
| PI-0004 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0005 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0011 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0014 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0021 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0026 | 부분 정보 | PARTIAL → PARTIAL | C |  |
| PI-0028 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0031 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0033 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0035 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0037 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0049 | 부분 정보 | PARTIAL → PARTIAL | C |  |
| PI-0050 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0061 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0062 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0066 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0067 | 부분 정보 | PARTIAL → CLARIFY | B4 |  |
| PI-0069 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0070 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0074 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0077 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0080 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| SF-0034 | 단일 FAQ 답변 | ANSWER → PARTIAL | B4 |  |
| SF-0042 | 단일 FAQ 답변 | ANSWER → PARTIAL | B4 |  |
| SF-0061 | 단일 FAQ 답변 | ANSWER → ANSWER | C |  |
| SF-0063 | 단일 FAQ 답변 | ANSWER → PARTIAL | B4 |  |
| SF-0064 | 단일 FAQ 답변 | ANSWER → PARTIAL | B4 |  |
| SF-0074 | 단일 FAQ 답변 | ANSWER → ANSWER | P | Context밖 |
| SF-0075 | 단일 FAQ 답변 | ANSWER → ANSWER | A2 | Context밖 |
| SF-0077 | 단일 FAQ 답변 | ANSWER → ANSWER | P | Context밖 |
| SR-0001 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0005 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0006 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0007 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0011 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0013 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0016 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0027 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0028 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0030 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0031 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | C |  |
| SR-0032 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0035 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0038 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0052 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0054 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0057 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0064 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0065 | 유사하지만 답 없음 | ABSTAIN → OUT_OF_SCOPE | 판정 불가(SWAP_OOS) |  |
| SR-0068 | 유사하지만 답 없음 | ABSTAIN → ABSTAIN | A1 |  |
| SR-0069 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0070 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| UI-0016 | 사용자 정보+FAQ | ANSWER → ANSWER | B3 (왜곡) | 왜곡,왜곡 |
| UI-0017 | 사용자 정보+FAQ | ANSWER → ANSWER | B3 (왜곡) | 왜곡,왜곡 |
| UI-0040 | 사용자 정보+FAQ | ANSWER → ANSWER | C |  |
| UI-0047 | 사용자 정보+FAQ | ANSWER → PARTIAL | B4 |  |
| UI-0053 | 사용자 정보+FAQ | ANSWER → ANSWER | P | Context밖 |
| UI-0055 | 사용자 정보+FAQ | ANSWER → PARTIAL | B4 |  |
| UI-0060 | 사용자 정보+FAQ | ANSWER → PARTIAL | B4 |  |
| UI-0064 | 사용자 정보+FAQ | PARTIAL → CLARIFY | B4 |  |
| UI-0068 | 사용자 정보+FAQ | CLARIFY → ANSWER | B1 |  |
| UI-0076 | 사용자 정보+FAQ | CLARIFY → PARTIAL | C |  |
| UI-0087 | 사용자 정보+FAQ | ANSWER → ANSWER | B3 (다른 FAQ) | 다른FAQ |
| UI-0089 | 사용자 정보+FAQ | ANSWER → PARTIAL | B4 |  |
| UI-0100 | 사용자 정보+FAQ | CLARIFY → CLARIFY | A1 |  |

</details>

<details>
<summary>qwen3:1.7b — 환각 126건</summary>

| 문항 | 유형 | 기대 → 모델 status | 라벨 | 출처 판정 (주장별) |
|---|---|---|---|---|
| AD-0021 | 적대적 입력·범위 밖 | ANSWER → ANSWER | B3 (왜곡) | 왜곡,왜곡 |
| AD-0052 | 적대적 입력·범위 밖 | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| AR-0007 | API 결과 답변 | PARTIAL → ANSWER | C |  |
| AR-0019 | API 결과 답변 | CLARIFY → ANSWER | C |  |
| CE-0078 | 조건·예외·경계값 | ANSWER → ANSWER | C |  |
| CE-0079 | 조건·예외·경계값 | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| CF-0005 | FAQ 충돌·시행일 | CONFLICT → CLARIFY | 판정 불가(NO_RULE) |  |
| CF-0010 | FAQ 충돌·시행일 | CONFLICT → PARTIAL | 판정 불가(NO_RULE) |  |
| CF-0016 | FAQ 충돌·시행일 | CONFLICT → CLARIFY | 판정 불가(NO_RULE) |  |
| CF-0018 | FAQ 충돌·시행일 | CONFLICT → PARTIAL | 판정 불가(NO_RULE) |  |
| CF-0067 | FAQ 충돌·시행일 | CLARIFY → PARTIAL | B1 |  |
| EC-0003 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0005 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0006 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0008 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0010 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0011 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0012 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0013 | 빈 컨텍스트 | ABSTAIN → OUT_OF_SCOPE | 판정 불가(SWAP_OOS) |  |
| EC-0015 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0016 | 빈 컨텍스트 | ABSTAIN → ANSWER | B1 |  |
| EC-0017 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0018 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0020 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0021 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0023 | 빈 컨텍스트 | ABSTAIN → ANSWER | B1 |  |
| EC-0024 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0025 | 빈 컨텍스트 | ABSTAIN → ANSWER | B1 |  |
| EC-0027 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| EC-0028 | 빈 컨텍스트 | ABSTAIN → ANSWER | B1 |  |
| EC-0029 | 빈 컨텍스트 | ABSTAIN → PARTIAL | B1 |  |
| HR-0010 | 무관 FAQ | ABSTAIN → PARTIAL | B1 |  |
| HR-0014 | 무관 FAQ | ABSTAIN → PARTIAL | B1 |  |
| HR-0020 | 무관 FAQ | ABSTAIN → OUT_OF_SCOPE | 판정 불가(SWAP_OOS) |  |
| HR-0029 | 무관 FAQ | ABSTAIN → PARTIAL | B1 |  |
| HR-0035 | 무관 FAQ | ABSTAIN → PARTIAL | B1 |  |
| HR-0039 | 무관 FAQ | ABSTAIN → PARTIAL | B1 |  |
| MC-0017 | 다중 FAQ 조합 | ANSWER → ANSWER | A2 | Context밖 |
| MC-0025 | 다중 FAQ 조합 | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| MC-0042 | 다중 FAQ 조합 | ANSWER → ANSWER | P | Context밖 |
| MC-0054 | 다중 FAQ 조합 | ANSWER → ANSWER | C |  |
| MC-0067 | 다중 FAQ 조합 | ANSWER → ANSWER | C |  |
| MC-0079 | 다중 FAQ 조합 | ANSWER → ANSWER | P | Context밖 |
| MC-0091 | 다중 FAQ 조합 | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| MC-0095 | 다중 FAQ 조합 | ANSWER → ANSWER | C |  |
| MC-0096 | 다중 FAQ 조합 | ANSWER → ANSWER | B3 (왜곡) | Context밖,왜곡 |
| MC-0098 | 다중 FAQ 조합 | ANSWER → ANSWER | A2 | Context밖,불명,Context밖,Context밖 |
| MC-0105 | 다중 FAQ 조합 | ANSWER → ANSWER | P | Context밖,Context밖,Context밖,Context밖 |
| MC-0113 | 다중 FAQ 조합 | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| MT-0052 | 멀티턴 대화 | PARTIAL → ANSWER | C |  |
| MT-0063 | 멀티턴 대화 | ANSWER → PARTIAL | B4 |  |
| MT-0071 | 멀티턴 대화 | ANSWER → ANSWER | B3 (왜곡) | 왜곡,왜곡 |
| MT-0089 | 멀티턴 대화 | CLARIFY → ANSWER | B1 |  |
| MT-0093 | 멀티턴 대화 | CLARIFY → ANSWER | B1 |  |
| MT-0096 | 멀티턴 대화 | CLARIFY → PARTIAL | B1 |  |
| MT-0105 | 멀티턴 대화 | CLARIFY → PARTIAL | B1 |  |
| MT-0109 | 멀티턴 대화 | ANSWER → CLARIFY | B4 |  |
| MT-0111 | 멀티턴 대화 | ANSWER → ANSWER | P | 불명,Context밖 |
| NC-0053 | 유사 FAQ 구분·노이즈 | ANSWER → PARTIAL | B4 |  |
| NC-0058 | 유사 FAQ 구분·노이즈 | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| NC-0064 | 유사 FAQ 구분·노이즈 | ANSWER → PARTIAL | B4 |  |
| NC-0072 | 유사 FAQ 구분·노이즈 | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| PI-0004 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0007 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0010 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0014 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0017 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0021 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0025 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0026 | 부분 정보 | PARTIAL → PARTIAL | C |  |
| PI-0031 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0033 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0036 | 부분 정보 | PARTIAL → CLARIFY | B4 |  |
| PI-0037 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0049 | 부분 정보 | PARTIAL → PARTIAL | C |  |
| PI-0050 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0057 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0061 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0062 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0064 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0065 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0066 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0067 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0068 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0069 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0071 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0074 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0077 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0080 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| SF-0034 | 단일 FAQ 답변 | ANSWER → PARTIAL | B4 |  |
| SF-0042 | 단일 FAQ 답변 | ANSWER → ANSWER | P | Context밖 |
| SF-0061 | 단일 FAQ 답변 | ANSWER → ANSWER | C |  |
| SF-0063 | 단일 FAQ 답변 | ANSWER → ANSWER | A2 | Context밖,Context밖 |
| SF-0075 | 단일 FAQ 답변 | ANSWER → ANSWER | A2 | Context밖 |
| SF-0078 | 단일 FAQ 답변 | ANSWER → PARTIAL | B4 |  |
| SR-0006 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0007 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0008 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0011 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0025 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0027 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0028 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0030 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0031 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | C |  |
| SR-0032 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0035 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0038 | 유사하지만 답 없음 | ABSTAIN → ANSWER | B1 |  |
| SR-0042 | 유사하지만 답 없음 | ABSTAIN → ANSWER | B1 |  |
| SR-0044 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0045 | 유사하지만 답 없음 | ABSTAIN → OUT_OF_SCOPE | 판정 불가(SWAP_OOS) |  |
| SR-0052 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0055 | 유사하지만 답 없음 | ABSTAIN → ANSWER | B1 |  |
| SR-0057 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0061 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0064 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0066 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0068 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| SR-0070 | 유사하지만 답 없음 | ABSTAIN → PARTIAL | B1 |  |
| UI-0016 | 사용자 정보+FAQ | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| UI-0040 | 사용자 정보+FAQ | ANSWER → ANSWER | C |  |
| UI-0055 | 사용자 정보+FAQ | ANSWER → ANSWER | P | Context밖 |
| UI-0068 | 사용자 정보+FAQ | CLARIFY → ANSWER | B1 |  |
| UI-0076 | 사용자 정보+FAQ | CLARIFY → ANSWER | C |  |
| UI-0087 | 사용자 정보+FAQ | ANSWER → ANSWER | B3 (다른 FAQ) | 다른FAQ |
| UI-0090 | 사용자 정보+FAQ | ANSWER → ANSWER | B3 (다른 FAQ) | 다른FAQ |
| UI-0100 | 사용자 정보+FAQ | CLARIFY → PARTIAL | B1 |  |

</details>

<details>
<summary>gemma3:4b — 환각 128건</summary>

| 문항 | 유형 | 기대 → 모델 status | 라벨 | 출처 판정 (주장별) |
|---|---|---|---|---|
| AD-0064 | 적대적 입력·범위 밖 | ANSWER → ANSWER | B3 (왜곡) | Context밖,왜곡 |
| AD-0068 | 적대적 입력·범위 밖 | ANSWER → CLARIFY | B4 |  |
| AR-0007 | API 결과 답변 | PARTIAL → ANSWER | C |  |
| AR-0011 | API 결과 답변 | PARTIAL → ANSWER | B2 |  |
| AR-0019 | API 결과 답변 | CLARIFY → ANSWER | C |  |
| CE-0048 | 조건·예외·경계값 | ANSWER → ANSWER | P | Context밖 |
| CE-0053 | 조건·예외·경계값 | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| CE-0078 | 조건·예외·경계값 | ANSWER → ANSWER | C |  |
| CE-0086 | 조건·예외·경계값 | ANSWER → ABSTAIN | B4 |  |
| CF-0005 | FAQ 충돌·시행일 | CONFLICT → ANSWER | 판정 불가(NO_RULE) |  |
| CF-0010 | FAQ 충돌·시행일 | CONFLICT → ANSWER | 판정 불가(NO_RULE) |  |
| CF-0016 | FAQ 충돌·시행일 | CONFLICT → ANSWER | 판정 불가(NO_RULE) |  |
| CF-0018 | FAQ 충돌·시행일 | CONFLICT → ANSWER | 판정 불가(NO_RULE) |  |
| CF-0048 | FAQ 충돌·시행일 | ANSWER → CLARIFY | B4 |  |
| EC-0001 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0002 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0003 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0004 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0005 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0006 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0007 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0009 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0010 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0011 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0012 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0014 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0016 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0017 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0018 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0019 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0020 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0021 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0022 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0023 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0024 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0025 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0026 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0027 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0028 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| EC-0029 | 빈 컨텍스트 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| HR-0001 | 무관 FAQ | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| HR-0005 | 무관 FAQ | ABSTAIN → ABSTAIN | A1 |  |
| HR-0006 | 무관 FAQ | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| HR-0010 | 무관 FAQ | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| HR-0016 | 무관 FAQ | ABSTAIN → ABSTAIN | A1 |  |
| HR-0029 | 무관 FAQ | ABSTAIN → PARTIAL | B1 |  |
| HR-0031 | 무관 FAQ | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| HR-0033 | 무관 FAQ | ABSTAIN → ABSTAIN | A1 |  |
| HR-0034 | 무관 FAQ | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| HR-0035 | 무관 FAQ | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| HR-0037 | 무관 FAQ | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| MC-0019 | 다중 FAQ 조합 | ANSWER → CLARIFY | B4 |  |
| MC-0042 | 다중 FAQ 조합 | ANSWER → ANSWER | P | Context밖 |
| MC-0054 | 다중 FAQ 조합 | ANSWER → ANSWER | C |  |
| MC-0056 | 다중 FAQ 조합 | ANSWER → ANSWER | P | Context밖 |
| MC-0061 | 다중 FAQ 조합 | ANSWER → PARTIAL | B4 |  |
| MC-0065 | 다중 FAQ 조합 | ANSWER → ANSWER | P | Context밖 |
| MC-0095 | 다중 FAQ 조합 | ANSWER → ANSWER | C |  |
| MC-0105 | 다중 FAQ 조합 | ANSWER → PARTIAL | B4 |  |
| MT-0052 | 멀티턴 대화 | PARTIAL → ANSWER | C |  |
| MT-0054 | 멀티턴 대화 | PARTIAL → ANSWER | B2 |  |
| MT-0060 | 멀티턴 대화 | PARTIAL → ANSWER | B2 |  |
| MT-0063 | 멀티턴 대화 | ANSWER → ANSWER | P | Context밖 |
| MT-0066 | 멀티턴 대화 | ANSWER → ANSWER | P | Context밖,Context밖,Context밖 |
| MT-0093 | 멀티턴 대화 | CLARIFY → ANSWER | B1 |  |
| MT-0096 | 멀티턴 대화 | CLARIFY → ABSTAIN | 판정 불가(SWAP) |  |
| MT-0105 | 멀티턴 대화 | CLARIFY → ABSTAIN | 판정 불가(SWAP) |  |
| MT-0111 | 멀티턴 대화 | ANSWER → ANSWER | P | Context밖 |
| PI-0004 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0005 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0011 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0016 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0017 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0021 | 부분 정보 | PARTIAL → CLARIFY | B4 |  |
| PI-0026 | 부분 정보 | PARTIAL → PARTIAL | C |  |
| PI-0028 | 부분 정보 | PARTIAL → CLARIFY | B4 |  |
| PI-0031 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0033 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0036 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0050 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0067 | 부분 정보 | PARTIAL → CLARIFY | B4 |  |
| PI-0068 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0069 | 부분 정보 | PARTIAL → PARTIAL | A1 |  |
| PI-0070 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0071 | 부분 정보 | PARTIAL → ANSWER | B2 |  |
| PI-0077 | 부분 정보 | PARTIAL → CLARIFY | B4 |  |
| SF-0034 | 단일 FAQ 답변 | ANSWER → CLARIFY | B4 |  |
| SF-0042 | 단일 FAQ 답변 | ANSWER → PARTIAL | B4 |  |
| SF-0061 | 단일 FAQ 답변 | ANSWER → ANSWER | C |  |
| SF-0075 | 단일 FAQ 답변 | ANSWER → CLARIFY | B4 |  |
| SR-0001 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0005 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0006 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0007 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0008 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0011 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0016 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0020 | 유사하지만 답 없음 | ABSTAIN → ANSWER | B1 |  |
| SR-0022 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0025 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0027 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0028 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0030 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0031 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | C |  |
| SR-0032 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0038 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0040 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0044 | 유사하지만 답 없음 | ABSTAIN → ABSTAIN | A1 |  |
| SR-0045 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0054 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0057 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0059 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0064 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0065 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0066 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0068 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0069 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| SR-0070 | 유사하지만 답 없음 | ABSTAIN → CLARIFY | 판정 불가(SWAP) |  |
| UI-0016 | 사용자 정보+FAQ | ANSWER → ANSWER | B3 (왜곡) | 왜곡,불명,Context밖 |
| UI-0040 | 사용자 정보+FAQ | ANSWER → ANSWER | C |  |
| UI-0053 | 사용자 정보+FAQ | ANSWER → ANSWER | B3 (왜곡) | 왜곡 |
| UI-0064 | 사용자 정보+FAQ | PARTIAL → ABSTAIN | B4 |  |
| UI-0068 | 사용자 정보+FAQ | CLARIFY → ANSWER | B1 |  |
| UI-0076 | 사용자 정보+FAQ | CLARIFY → ANSWER | C |  |
| UI-0087 | 사용자 정보+FAQ | ANSWER → PARTIAL | B4 |  |
| UI-0089 | 사용자 정보+FAQ | ANSWER → CLARIFY | B4 |  |
| UI-0090 | 사용자 정보+FAQ | ANSWER → PARTIAL | B4 |  |
| UI-0091 | 사용자 정보+FAQ | ANSWER → ANSWER | B3 (왜곡) | 왜곡,왜곡 |

</details>
