# run 요약 — local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i1_20261012_PI-CE-UI-AR-CF-SR-HR-AD-NC-MC-MT

> 자동 생성 문서(`scripts/docgen/build_run_report.js`) — 손으로 고치지 마세요.
> 생성 2026-10-11T22:40:22.871Z · prompts_test_v4/try1

| 항목 | 값 |
|---|---|
| 모델 | `qwen3:4b-instruct` |
| 조건 | t0_nothink {"temperature":0,"seed":null,"think":null,"format":{"type":"object","properties":{"evidence_ids":{"type":"array","items":{"type":"string"}},"status":{"type":"string","enum":["ANSWER","PARTIAL","ABSTAIN","CONFLICT","OUT_OF_SCOPE"]},"answer":{"type":"string"}},"required":["evidence_ids","status","answer"]}} |
| 컨텍스트 방식 | fixed |
| 프롬프트 | v5_i1 |
| 데이터 | test_set4 · 항목당 100건 · 항목 PI,CE,UI,AR,CF,SR,HR,AD,NC,MC,MT · 1100행 |
| 환경 | local-win |

## 1. LLM Judge

아직 채점하지 않았다. `scripts/judge_*.js` 단계(외부 전송 승인 필요) 후 이 보고서를 다시 만든다.

## 2. 결과론적 지표 · 계측 (독립 표본, 반복 항목 제외)

| 지표 | 값 |
|---|---|
| 기대 상태 일치 | 85.4% (1100행) |
| FAQ 부재 판단 P / R / F1 | 0.910 / 0.723 / 0.806 |
| 근거 채택률(정답 근거 문서만 인용) · 엄격(정답 근거 문서 전부 인용) · 정확 인용 | 92.8% · 91.1% · 87.1% (대상 751행) |
| 근거 인용 정밀도 · 정답 문서 재현율 | 97.1% · 93.9% |
| 채택 분류 EXACT / WITH_EXTRA / PARTIAL / WRONG / NONE | 654 / 30 / 43 / 6 / 18 |
| Context에 없는 ID 인용 비율 | 0.0% |
| 사용자 정보/API·대화 이력 꼬리표 인용(채택 판정에서 제외) | 16건 (1.5%) |
| 답했는데 근거 미기재(답·부분 답·충돌 라벨 + 빈 evidence_ids, AR 제외) | 4건 (0.5%) |
| 표현 규칙 점수 · 실격 비율 | 71.2 · 20.2% |
| 포맷 준수 | 100.0% (생성 오류 0건) |
| 키 순서 준수(evidence_ids → status → answer) | 0.0% · answer>evidence_ids>status 1100 |
| 타임아웃(60s 초과 = 오류) | 0건 (0.0%) |
| 지연 평균 / P50 / P95 (응답 받은 행) | 2.34s / 2.18s / 4.39s |
| TPS 평균 | 79.1 |

## 3. 항목별 결과론적 지표

| 항목 | 행 | 기대 상태 일치 | 근거 채택률 | 정답 유사도 | 키워드 | NLI 지지율 | 표현 규칙 | 포맷 | 지연 평균 | P95 |
|---|---|---|---|---|---|---|---|---|---|---|
| NC 유사 FAQ 구분·노이즈 | 100 | 98.0% | 81.0% | N/A | N/A | N/A | 75.2 | 100.0% | 1.99s | 3.22s |
| MC 다중 FAQ 조합 | 100 | 100.0% | 100.0% | N/A | N/A | N/A | 88.2 | 100.0% | 2.45s | 4.73s |
| UI 사용자 정보 + FAQ | 100 | 83.0% | 91.0% | N/A | N/A | N/A | 53.0 | 100.0% | 3.36s | 6.20s |
| CE 조건·예외·경계값 | 100 | 94.0% | 96.0% | N/A | N/A | N/A | 63.1 | 100.0% | 2.69s | 4.28s |
| PI 부분 정보 | 100 | 84.0% | 91.0% | N/A | N/A | N/A | 87.3 | 100.0% | 2.46s | 4.12s |
| SR 유사하지만 답 없음 | 100 | 79.0% | 대상 없음 | N/A | N/A | N/A | 70.3 | 100.0% | 2.02s | 3.35s |
| HR 무관 FAQ | 100 | 91.0% | 대상 없음 | N/A | N/A | N/A | 84.0 | 100.0% | 1.52s | 2.34s |
| CF FAQ 충돌·시행일 | 100 | 59.0% | 87.5% | N/A | N/A | N/A | 45.9 | 100.0% | 3.33s | 6.19s |
| MT 멀티턴 대화 | 100 | 98.0% | 100.0% | N/A | N/A | N/A | 56.5 | 100.0% | 1.94s | 3.85s |
| AD 적대적 입력·범위 밖 | 100 | 95.0% | 96.8% | N/A | N/A | N/A | 84.7 | 100.0% | 1.57s | 2.32s |
| AR API 결과 답변 | 100 | 58.0% | 대상 없음 | N/A | N/A | N/A | 75.0 | 100.0% | 2.37s | 3.59s |

## 4. 상태 혼동 행렬 (독립 표본, 행=기대 · 열=응답)

| 기대 \ 응답 | ABSTAIN | ANSWER | CONFLICT | OUT_OF_SCOPE | PARTIAL | 재현율 |
|---|---|---|---|---|---|---|
| ANSWER | 5 | 593 | 2 | 0 | 18 | 96.0% |
| PARTIAL | 12 | 31 | 0 | 0 | 118 | 73.3% |
| ABSTAIN | 172 | 24 | 1 | 7 | 34 | 72.3% |
| CONFLICT | 0 | 20 | 19 | 0 | 7 | 41.3% |
| OUT_OF_SCOPE | 0 | 0 | 0 | 37 | 0 | 100.0% |

## 5. 파일

- 원본 응답: `prompts_test_v4/try1/results/raw/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i1_20261012_PI-CE-UI-AR-CF-SR-HR-AD-NC-MC-MT/generation.jsonl`
- 채점 결과·통합 CSV: `prompts_test_v4/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i1_20261012_PI-CE-UI-AR-CF-SR-HR-AD-NC-MC-MT/` (review.csv)
