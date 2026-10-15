# run 요약 — local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4ck_20261014_PI-CE-UI-AR-SR-HR-NC-MC-MT

> 자동 생성 문서(`scripts/docgen/build_run_report.js`) — 손으로 고치지 마세요.
> 생성 2026-10-14T07:05:32.879Z · prompts_test_v8/try1

| 항목 | 값 |
|---|---|
| 모델 | `qwen3:4b-instruct` |
| 조건 | t0_nothink {"temperature":0,"seed":null,"think":null,"format":{"type":"object","properties":{"a_calc":{"type":"string"},"b_evidence_ids":{"type":"array","items":{"type":"string"}},"c_status":{"type":"string","enum":["ANSWER","PARTIAL","ABSTAIN","CONFLICT","OUT_OF_SCOPE"]},"d_answer":{"type":"string"}},"required":["a_calc","b_evidence_ids","c_status","d_answer"]}} |
| 컨텍스트 방식 | fixed |
| 프롬프트 | v5_i4ck |
| 데이터 | test_set4r · 항목당 100건 · 항목 PI,CE,UI,AR,SR,HR,NC,MC,MT · 900행 |
| 환경 | local-win |

## 1. LLM Judge

아직 채점하지 않았다. `scripts/judge_*.js` 단계(외부 전송 승인 필요) 후 이 보고서를 다시 만든다.

## 2. 결과론적 지표 · 계측 (독립 표본, 반복 항목 제외)

| 지표 | 값 |
|---|---|
| 기대 상태 일치 | 75.1% (900행) |
| FAQ 부재 판단 P / R / F1 | 0.733 / 0.681 / 0.706 |
| 근거 채택률(정답 근거 문서만 인용) · 엄격(정답 근거 문서 전부 인용) · 정확 인용 | 82.2% · 78.5% · 77.3% (대상 600행) |
| 근거 인용 정밀도 · 정답 문서 재현율 | 98.7% · 80.9% |
| 채택 분류 EXACT / WITH_EXTRA / PARTIAL / WRONG / NONE | 464 / 7 / 29 / 3 / 97 |
| Context에 없는 ID 인용 비율 | 0.0% |
| 사용자 정보/API·대화 이력 꼬리표 인용(채택 판정에서 제외) | 1건 (0.1%) |
| 답했는데 근거 미기재(답·부분 답·충돌 라벨 + 빈 evidence_ids, AR 제외) | 43건 (7.9%) |
| 표현 규칙 점수 · 실격 비율 | 86.3 · 3.1% |
| 포맷 준수 | 99.6% (생성 오류 4건) |
| 키 순서 준수(calc → evidence_ids → status → answer) | 100.0% · calc>evidence_ids>status>answer 896 |
| 타임아웃(60s 초과 = 오류) | 4건 (0.4%) |
| 지연 평균 / P50 / P95 (응답 받은 행) | 1.92s / 1.70s / 3.96s |
| TPS 평균 | 70.2 |

## 3. 항목별 결과론적 지표

| 항목 | 행 | 기대 상태 일치 | 근거 채택률 | 정답 유사도 | 키워드 | NLI 지지율 | 표현 규칙 | 포맷 | 지연 평균 | P95 |
|---|---|---|---|---|---|---|---|---|---|---|
| NC 유사 FAQ 구분·노이즈 | 100 | 82.0% | 70.0% | N/A | N/A | N/A | 84.6 | 99.0% | 1.99s | 3.23s |
| MC 다중 FAQ 조합 | 100 | 100.0% | 100.0% | N/A | N/A | N/A | 88.2 | 100.0% | 2.27s | 3.19s |
| UI 사용자 정보 + FAQ | 100 | 74.0% | 95.0% | N/A | N/A | N/A | 88.3 | 99.0% | 3.08s | 4.50s |
| CE 조건·예외·경계값 | 100 | 65.0% | 77.0% | N/A | N/A | N/A | 83.2 | 99.0% | 2.63s | 4.33s |
| PI 부분 정보 | 100 | 49.0% | 54.0% | N/A | N/A | N/A | 83.5 | 100.0% | 1.59s | 2.44s |
| SR 유사하지만 답 없음 | 100 | 95.0% | 대상 없음 | N/A | N/A | N/A | 85.3 | 100.0% | 0.92s | 1.24s |
| HR 무관 FAQ | 100 | 39.0% | 대상 없음 | N/A | N/A | N/A | 86.0 | 100.0% | 0.83s | 1.01s |
| MT 멀티턴 대화 | 100 | 99.0% | 97.0% | N/A | N/A | N/A | 87.2 | 100.0% | 1.33s | 2.17s |
| AR API 결과 답변 | 100 | 73.0% | 대상 없음 | N/A | N/A | N/A | 90.8 | 99.0% | 2.71s | 5.56s |

## 4. 상태 혼동 행렬 (독립 표본, 행=기대 · 열=응답)

| 기대 \ 응답 | ABSTAIN | ANSWER | CONFLICT | NONE | OUT_OF_SCOPE | PARTIAL | 재현율 |
|---|---|---|---|---|---|---|---|
| ANSWER | 13 | 450 | 1 | 3 | 0 | 46 | 87.7% |
| PARTIAL | 43 | 45 | 0 | 1 | 0 | 72 | 44.7% |
| ABSTAIN | 154 | 7 | 0 | 0 | 64 | 1 | 68.1% |

## 5. 파일

- 원본 응답: `prompts_test_v8/try1/results/raw/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4ck_20261014_PI-CE-UI-AR-SR-HR-NC-MC-MT/generation.jsonl`
- 채점 결과·통합 CSV: `prompts_test_v8/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4ck_20261014_PI-CE-UI-AR-SR-HR-NC-MC-MT/` (review.csv)
