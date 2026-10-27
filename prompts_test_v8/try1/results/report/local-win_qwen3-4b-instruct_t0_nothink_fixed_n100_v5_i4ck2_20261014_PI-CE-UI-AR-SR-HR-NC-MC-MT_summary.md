# run 요약 — local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4ck2_20261014_PI-CE-UI-AR-SR-HR-NC-MC-MT

> 자동 생성 문서(`scripts/docgen/build_run_report.js`) — 손으로 고치지 마세요.
> 생성 2026-10-14T08:01:44.250Z · prompts_test_v8/try1

| 항목 | 값 |
|---|---|
| 모델 | `qwen3:4b-instruct` |
| 조건 | t0_nothink {"temperature":0,"seed":null,"think":null,"format":{"type":"object","properties":{"a_calc":{"type":"string"},"b_evidence_ids":{"type":"array","items":{"type":"string"}},"c_status":{"type":"string","enum":["ANSWER","PARTIAL","ABSTAIN","CONFLICT","OUT_OF_SCOPE"]},"d_answer":{"type":"string"}},"required":["a_calc","b_evidence_ids","c_status","d_answer"]}} |
| 컨텍스트 방식 | fixed |
| 프롬프트 | v5_i4ck2 |
| 데이터 | test_set4r · 항목당 100건 · 항목 PI,CE,UI,AR,SR,HR,NC,MC,MT · 900행 |
| 환경 | local-win |

## 1. LLM Judge

아직 채점하지 않았다. `scripts/judge_*.js` 단계(외부 전송 승인 필요) 후 이 보고서를 다시 만든다.

## 2. 결과론적 지표 · 계측 (독립 표본, 반복 항목 제외)

| 지표 | 값 |
|---|---|
| 기대 상태 일치 | 74.8% (900행) |
| FAQ 부재 판단 P / R / F1 | 0.829 / 0.730 / 0.776 |
| 근거 채택률(정답 근거 문서만 인용) · 엄격(정답 근거 문서 전부 인용) · 정확 인용 | 91.0% · 83.3% · 82.7% (대상 600행) |
| 근거 인용 정밀도 · 정답 문서 재현율 | 98.9% · 87.5% |
| 채택 분류 EXACT / WITH_EXTRA / PARTIAL / WRONG / NONE | 496 / 4 / 50 / 4 / 46 |
| Context에 없는 ID 인용 비율 | 0.0% |
| 사용자 정보/API·대화 이력 꼬리표 인용(채택 판정에서 제외) | 1건 (0.1%) |
| 답했는데 근거 미기재(답·부분 답·충돌 라벨 + 빈 evidence_ids, AR 제외) | 21건 (3.6%) |
| 표현 규칙 점수 · 실격 비율 | 86.4 · 3.4% |
| 포맷 준수 | 99.9% (생성 오류 1건) |
| 키 순서 준수(calc → evidence_ids → status → answer) | 100.0% · calc>evidence_ids>status>answer 899 |
| 타임아웃(60s 초과 = 오류) | 1건 (0.1%) |
| 지연 평균 / P50 / P95 (응답 받은 행) | 1.71s / 1.53s / 3.39s |
| TPS 평균 | 72.4 |

## 3. 항목별 결과론적 지표

| 항목 | 행 | 기대 상태 일치 | 근거 채택률 | 정답 유사도 | 키워드 | NLI 지지율 | 표현 규칙 | 포맷 | 지연 평균 | P95 |
|---|---|---|---|---|---|---|---|---|---|---|
| NC 유사 FAQ 구분·노이즈 | 100 | 67.0% | 92.0% | N/A | N/A | N/A | 85.1 | 100.0% | 1.55s | 2.46s |
| MC 다중 FAQ 조합 | 100 | 99.0% | 100.0% | N/A | N/A | N/A | 89.0 | 100.0% | 2.28s | 3.25s |
| UI 사용자 정보 + FAQ | 100 | 80.0% | 93.0% | N/A | N/A | N/A | 90.1 | 100.0% | 2.70s | 4.30s |
| CE 조건·예외·경계값 | 100 | 38.0% | 88.0% | N/A | N/A | N/A | 81.9 | 100.0% | 2.25s | 4.16s |
| PI 부분 정보 | 100 | 76.0% | 74.0% | N/A | N/A | N/A | 83.7 | 100.0% | 1.58s | 2.26s |
| SR 유사하지만 답 없음 | 100 | 94.0% | 대상 없음 | N/A | N/A | N/A | 82.3 | 100.0% | 0.97s | 1.61s |
| HR 무관 FAQ | 100 | 59.0% | 대상 없음 | N/A | N/A | N/A | 86.5 | 100.0% | 0.87s | 1.20s |
| MT 멀티턴 대화 | 100 | 93.0% | 99.0% | N/A | N/A | N/A | 89.7 | 100.0% | 1.14s | 1.75s |
| AR API 결과 답변 | 100 | 67.0% | 대상 없음 | N/A | N/A | N/A | 89.5 | 99.0% | 2.04s | 4.07s |

## 4. 상태 혼동 행렬 (독립 표본, 행=기대 · 열=응답)

| 기대 \ 응답 | ABSTAIN | ANSWER | NONE | OUT_OF_SCOPE | PARTIAL | 재현율 |
|---|---|---|---|---|---|---|
| ANSWER | 7 | 395 | 0 | 0 | 111 | 77.0% |
| PARTIAL | 27 | 20 | 1 | 0 | 113 | 70.2% |
| ABSTAIN | 165 | 5 | 0 | 39 | 17 | 73.0% |

## 5. 파일

- 원본 응답: `prompts_test_v8/try1/results/raw/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4ck2_20261014_PI-CE-UI-AR-SR-HR-NC-MC-MT/generation.jsonl`
- 채점 결과·통합 CSV: `prompts_test_v8/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4ck2_20261014_PI-CE-UI-AR-SR-HR-NC-MC-MT/` (review.csv)
