# run 요약 — local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i5_20261015_PI-CE-UI-AR-SR-HR-NC-MC-MT

> 자동 생성 문서(`scripts/docgen/build_run_report.js`) — 손으로 고치지 마세요.
> 생성 2026-10-15T02:43:04.691Z · prompts_test_v9/try1

| 항목 | 값 |
|---|---|
| 모델 | `qwen3:4b-instruct` |
| 조건 | t0_nothink {"temperature":0,"seed":null,"think":null,"format":{"type":"object","properties":{"evidence_ids":{"type":"array","items":{"type":"string"}},"status":{"type":"string","enum":["ANSWER","PARTIAL","ABSTAIN","CONFLICT","OUT_OF_SCOPE"]},"answer":{"type":"string"}},"required":["evidence_ids","status","answer"]}} |
| 컨텍스트 방식 | fixed |
| 프롬프트 | v5_i5 |
| 데이터 | test_set4r · 항목당 100건 · 항목 PI,CE,UI,AR,SR,HR,NC,MC,MT · 900행 |
| 환경 | local-win |

## 1. LLM Judge

아직 채점하지 않았다. `scripts/judge_*.js` 단계(외부 전송 승인 필요) 후 이 보고서를 다시 만든다.

## 2. 결과론적 지표 · 계측 (독립 표본, 반복 항목 제외)

| 지표 | 값 |
|---|---|
| 기대 상태 일치 | 86.1% (900행) |
| FAQ 부재 판단 P / R / F1 | 0.922 / 0.783 / 0.847 |
| 근거 채택률(정답 근거 문서만 인용) · 엄격(정답 근거 문서 전부 인용) · 정확 인용 | 95.2% · 94.8% · 92.3% (대상 600행) |
| 근거 인용 정밀도 · 정답 문서 재현율 | 98.6% · 96.3% |
| 채택 분류 EXACT / WITH_EXTRA / PARTIAL / WRONG / NONE | 554 / 15 / 17 / 0 / 14 |
| Context에 없는 ID 인용 비율 | 0.1% |
| 사용자 정보/API·대화 이력 꼬리표 인용(채택 판정에서 제외) | 0건 (0.0%) |
| 답했는데 근거 미기재(답·부분 답·충돌 라벨 + 빈 evidence_ids, AR 제외) | 1건 (0.2%) |
| 표현 규칙 점수 · 실격 비율 | 80.8 · 12.9% |
| 포맷 준수 | 100.0% (생성 오류 0건) |
| 키 순서 준수(evidence_ids → status → answer) | 0.0% · answer>evidence_ids>status 900 |
| 타임아웃(60s 초과 = 오류) | 0건 (0.0%) |
| 지연 평균 / P50 / P95 (응답 받은 행) | 1.82s / 1.75s / 3.22s |
| TPS 평균 | 76.0 |

## 3. 항목별 결과론적 지표

| 항목 | 행 | 기대 상태 일치 | 근거 채택률 | 정답 유사도 | 키워드 | NLI 지지율 | 표현 규칙 | 포맷 | 지연 평균 | P95 |
|---|---|---|---|---|---|---|---|---|---|---|
| NC 유사 FAQ 구분·노이즈 | 100 | 98.0% | 86.0% | N/A | N/A | N/A | 81.0 | 100.0% | 1.94s | 3.49s |
| MC 다중 FAQ 조합 | 100 | 100.0% | 100.0% | N/A | N/A | N/A | 88.1 | 100.0% | 2.24s | 3.43s |
| UI 사용자 정보 + FAQ | 100 | 80.0% | 99.0% | N/A | N/A | N/A | 65.0 | 100.0% | 2.53s | 3.59s |
| CE 조건·예외·경계값 | 100 | 83.0% | 97.0% | N/A | N/A | N/A | 70.2 | 100.0% | 2.22s | 3.57s |
| PI 부분 정보 | 100 | 87.0% | 89.0% | N/A | N/A | N/A | 88.3 | 100.0% | 1.79s | 2.51s |
| SR 유사하지만 답 없음 | 100 | 80.0% | 대상 없음 | N/A | N/A | N/A | 83.0 | 100.0% | 1.26s | 2.27s |
| HR 무관 FAQ | 100 | 93.0% | 대상 없음 | N/A | N/A | N/A | 96.3 | 100.0% | 0.96s | 1.41s |
| MT 멀티턴 대화 | 100 | 98.0% | 100.0% | N/A | N/A | N/A | 68.9 | 100.0% | 1.54s | 2.85s |
| AR API 결과 답변 | 100 | 56.0% | 대상 없음 | N/A | N/A | N/A | 86.7 | 100.0% | 1.87s | 3.27s |

## 4. 상태 혼동 행렬 (독립 표본, 행=기대 · 열=응답)

| 기대 \ 응답 | ABSTAIN | ANSWER | CONFLICT | OUT_OF_SCOPE | PARTIAL | 재현율 |
|---|---|---|---|---|---|---|
| ANSWER | 2 | 485 | 1 | 0 | 25 | 94.5% |
| PARTIAL | 13 | 35 | 0 | 0 | 113 | 70.2% |
| ABSTAIN | 177 | 8 | 0 | 5 | 36 | 78.3% |

## 5. 파일

- 원본 응답: `prompts_test_v9/try1/results/raw/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i5_20261015_PI-CE-UI-AR-SR-HR-NC-MC-MT/generation.jsonl`
- 채점 결과·통합 CSV: `prompts_test_v9/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i5_20261015_PI-CE-UI-AR-SR-HR-NC-MC-MT/` (review.csv)
