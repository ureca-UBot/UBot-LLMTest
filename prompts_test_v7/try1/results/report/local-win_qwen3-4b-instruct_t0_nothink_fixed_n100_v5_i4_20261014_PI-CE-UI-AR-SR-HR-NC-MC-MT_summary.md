# run 요약 — local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4_20261014_PI-CE-UI-AR-SR-HR-NC-MC-MT

> 자동 생성 문서(`scripts/docgen/build_run_report.js`) — 손으로 고치지 마세요.
> 생성 2026-10-14T02:38:28.861Z · prompts_test_v7/try1

| 항목 | 값 |
|---|---|
| 모델 | `qwen3:4b-instruct` |
| 조건 | t0_nothink {"temperature":0,"seed":null,"think":null,"format":{"type":"object","properties":{"evidence_ids":{"type":"array","items":{"type":"string"}},"status":{"type":"string","enum":["ANSWER","PARTIAL","ABSTAIN","CONFLICT","OUT_OF_SCOPE"]},"answer":{"type":"string"}},"required":["evidence_ids","status","answer"]}} |
| 컨텍스트 방식 | fixed |
| 프롬프트 | v5_i4 |
| 데이터 | test_set4r · 항목당 100건 · 항목 PI,CE,UI,AR,SR,HR,NC,MC,MT · 900행 |
| 환경 | local-win |

## 1. LLM Judge

아직 채점하지 않았다. `scripts/judge_*.js` 단계(외부 전송 승인 필요) 후 이 보고서를 다시 만든다.

## 2. 결과론적 지표 · 계측 (독립 표본, 반복 항목 제외)

| 지표 | 값 |
|---|---|
| 기대 상태 일치 | 86.2% (900행) |
| FAQ 부재 판단 P / R / F1 | 0.943 / 0.726 / 0.820 |
| 근거 채택률(정답 근거 문서만 인용) · 엄격(정답 근거 문서 전부 인용) · 정확 인용 | 94.0% · 94.7% · 91.2% (대상 600행) |
| 근거 인용 정밀도 · 정답 문서 재현율 | 98.0% · 96.1% |
| 채택 분류 EXACT / WITH_EXTRA / PARTIAL / WRONG / NONE | 547 / 21 / 17 / 1 / 14 |
| Context에 없는 ID 인용 비율 | 0.0% |
| 사용자 정보/API·대화 이력 꼬리표 인용(채택 판정에서 제외) | 1건 (0.1%) |
| 답했는데 근거 미기재(답·부분 답·충돌 라벨 + 빈 evidence_ids, AR 제외) | 6건 (1.0%) |
| 표현 규칙 점수 · 실격 비율 | 83.6 · 8.6% |
| 포맷 준수 | 100.0% (생성 오류 0건) |
| 키 순서 준수(evidence_ids → status → answer) | 0.0% · answer>evidence_ids>status 900 |
| 타임아웃(60s 초과 = 오류) | 0건 (0.0%) |
| 지연 평균 / P50 / P95 (응답 받은 행) | 1.63s / 1.59s / 2.77s |
| TPS 평균 | 75.9 |

## 3. 항목별 결과론적 지표

| 항목 | 행 | 기대 상태 일치 | 근거 채택률 | 정답 유사도 | 키워드 | NLI 지지율 | 표현 규칙 | 포맷 | 지연 평균 | P95 |
|---|---|---|---|---|---|---|---|---|---|---|
| NC 유사 FAQ 구분·노이즈 | 100 | 100.0% | 78.0% | N/A | N/A | N/A | 84.3 | 100.0% | 1.47s | 2.88s |
| MC 다중 FAQ 조합 | 100 | 100.0% | 100.0% | N/A | N/A | N/A | 89.8 | 100.0% | 1.81s | 2.58s |
| UI 사용자 정보 + FAQ | 100 | 80.0% | 100.0% | N/A | N/A | N/A | 79.3 | 100.0% | 2.06s | 3.29s |
| CE 조건·예외·경계값 | 100 | 89.0% | 96.0% | N/A | N/A | N/A | 77.2 | 100.0% | 2.03s | 2.72s |
| PI 부분 정보 | 100 | 90.0% | 90.0% | N/A | N/A | N/A | 85.0 | 100.0% | 1.77s | 2.67s |
| SR 유사하지만 답 없음 | 100 | 80.0% | 대상 없음 | N/A | N/A | N/A | 83.0 | 100.0% | 1.25s | 2.21s |
| HR 무관 FAQ | 100 | 80.0% | 대상 없음 | N/A | N/A | N/A | 91.8 | 100.0% | 0.85s | 1.21s |
| MT 멀티턴 대화 | 100 | 97.0% | 100.0% | N/A | N/A | N/A | 74.5 | 100.0% | 1.50s | 2.83s |
| AR API 결과 답변 | 100 | 60.0% | 대상 없음 | N/A | N/A | N/A | 87.9 | 100.0% | 1.90s | 3.05s |

## 4. 상태 혼동 행렬 (독립 표본, 행=기대 · 열=응답)

| 기대 \ 응답 | ABSTAIN | ANSWER | OUT_OF_SCOPE | PARTIAL | 재현율 |
|---|---|---|---|---|---|
| ANSWER | 0 | 493 | 0 | 20 | 96.1% |
| PARTIAL | 10 | 32 | 0 | 119 | 73.9% |
| ABSTAIN | 164 | 14 | 18 | 30 | 72.6% |

## 5. 파일

- 원본 응답: `prompts_test_v7/try1/results/raw/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4_20261014_PI-CE-UI-AR-SR-HR-NC-MC-MT/generation.jsonl`
- 채점 결과·통합 CSV: `prompts_test_v7/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4_20261014_PI-CE-UI-AR-SR-HR-NC-MC-MT/` (review.csv)
