# run 요약 — local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4ca_20261015_PI-CE-UI-AR-SR-HR-NC-MC-MT

> 자동 생성 문서(`scripts/docgen/build_run_report.js`) — 손으로 고치지 마세요.
> 생성 2026-10-15T00:46:15.912Z · prompts_test_v8/try2

| 항목 | 값 |
|---|---|
| 모델 | `qwen3:4b-instruct` |
| 조건 | t0_nothink {"temperature":0,"seed":null,"think":null,"format":{"type":"object","properties":{"a_calc":{"type":"string"},"b_answer":{"type":"string"},"c_evidence_ids":{"type":"array","items":{"type":"string"}},"d_status":{"type":"string","enum":["ANSWER","PARTIAL","ABSTAIN","CONFLICT","OUT_OF_SCOPE"]}},"required":["a_calc","b_answer","c_evidence_ids","d_status"]}} |
| 컨텍스트 방식 | fixed |
| 프롬프트 | v5_i4ca |
| 데이터 | test_set4r · 항목당 100건 · 항목 PI,CE,UI,AR,SR,HR,NC,MC,MT · 900행 |
| 환경 | local-win |

## 1. LLM Judge

아직 채점하지 않았다. `scripts/judge_*.js` 단계(외부 전송 승인 필요) 후 이 보고서를 다시 만든다.

## 2. 결과론적 지표 · 계측 (독립 표본, 반복 항목 제외)

| 지표 | 값 |
|---|---|
| 기대 상태 일치 | 85.6% (900행) |
| FAQ 부재 판단 P / R / F1 | 0.885 / 0.783 / 0.831 |
| 근거 채택률(정답 근거 문서만 인용) · 엄격(정답 근거 문서 전부 인용) · 정확 인용 | 93.0% · 88.7% · 85.8% (대상 600행) |
| 근거 인용 정밀도 · 정답 문서 재현율 | 98.3% · 92.3% |
| 채택 분류 EXACT / WITH_EXTRA / PARTIAL / WRONG / NONE | 515 / 17 / 43 / 1 / 24 |
| Context에 없는 ID 인용 비율 | 0.0% |
| 사용자 정보/API·대화 이력 꼬리표 인용(채택 판정에서 제외) | 1건 (0.1%) |
| 답했는데 근거 미기재(답·부분 답·충돌 라벨 + 빈 evidence_ids, AR 제외) | 3건 (0.5%) |
| 표현 규칙 점수 · 실격 비율 | 87.7 · 2.0% |
| 포맷 준수 | 99.4% (생성 오류 0건) |
| 키 순서 준수(calc → answer → evidence_ids → status) | 100.0% · calc>answer>evidence_ids>status 895 |
| 타임아웃(60s 초과 = 오류) | 0건 (0.0%) |
| 지연 평균 / P50 / P95 (응답 받은 행) | 1.97s / 1.74s / 3.94s |
| TPS 평균 | 70.3 |

## 3. 항목별 결과론적 지표

| 항목 | 행 | 기대 상태 일치 | 근거 채택률 | 정답 유사도 | 키워드 | NLI 지지율 | 표현 규칙 | 포맷 | 지연 평균 | P95 |
|---|---|---|---|---|---|---|---|---|---|---|
| NC 유사 FAQ 구분·노이즈 | 100 | 100.0% | 86.0% | N/A | N/A | N/A | 89.2 | 100.0% | 1.64s | 2.69s |
| MC 다중 FAQ 조합 | 100 | 100.0% | 100.0% | N/A | N/A | N/A | 89.0 | 100.0% | 2.54s | 3.69s |
| UI 사용자 정보 + FAQ | 100 | 75.0% | 97.0% | N/A | N/A | N/A | 88.8 | 100.0% | 3.24s | 4.44s |
| CE 조건·예외·경계값 | 100 | 88.0% | 91.0% | N/A | N/A | N/A | 91.8 | 95.0% | 2.28s | 3.97s |
| PI 부분 정보 | 100 | 78.0% | 84.0% | N/A | N/A | N/A | 85.4 | 100.0% | 1.84s | 2.59s |
| SR 유사하지만 답 없음 | 100 | 86.0% | 대상 없음 | N/A | N/A | N/A | 78.2 | 100.0% | 1.25s | 2.33s |
| HR 무관 FAQ | 100 | 83.0% | 대상 없음 | N/A | N/A | N/A | 86.8 | 100.0% | 0.94s | 1.19s |
| MT 멀티턴 대화 | 100 | 99.0% | 100.0% | N/A | N/A | N/A | 88.3 | 100.0% | 1.39s | 2.26s |
| AR API 결과 답변 | 100 | 61.0% | 대상 없음 | N/A | N/A | N/A | 91.9 | 100.0% | 2.59s | 5.13s |

## 4. 상태 혼동 행렬 (독립 표본, 행=기대 · 열=응답)

| 기대 \ 응답 | ABSTAIN | ANSWER | CONFLICT | OUT_OF_SCOPE | PARTIAL | 재현율 |
|---|---|---|---|---|---|---|
| ANSWER | 5 | 496 | 1 | 0 | 11 | 96.7% |
| PARTIAL | 18 | 46 | 0 | 0 | 97 | 60.2% |
| ABSTAIN | 177 | 12 | 0 | 16 | 21 | 78.3% |

## 5. 파일

- 원본 응답: `prompts_test_v8/try2/results/raw/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4ca_20261015_PI-CE-UI-AR-SR-HR-NC-MC-MT/generation.jsonl`
- 채점 결과·통합 CSV: `prompts_test_v8/try2/results/raw/scored/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4ca_20261015_PI-CE-UI-AR-SR-HR-NC-MC-MT/` (review.csv)
