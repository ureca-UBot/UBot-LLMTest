# run 요약 — local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i2_20261012_PI-CE-UI-AR-CF-SR-HR-AD-NC-MC-MT

> 자동 생성 문서(`scripts/docgen/build_run_report.js`) — 손으로 고치지 마세요.
> 생성 2026-10-12T08:23:48.530Z · prompts_test_v5/try2

| 항목 | 값 |
|---|---|
| 모델 | `qwen3:4b-instruct` |
| 조건 | t0_nothink {"temperature":0,"seed":null,"think":null,"format":{"type":"object","properties":{"evidence_ids":{"type":"array","items":{"type":"string"}},"status":{"type":"string","enum":["ANSWER","PARTIAL","ABSTAIN","CONFLICT","OUT_OF_SCOPE"]},"answer":{"type":"string"}},"required":["evidence_ids","status","answer"]}} |
| 컨텍스트 방식 | fixed |
| 프롬프트 | v5_i2 |
| 데이터 | test_set4r · 항목당 100건 · 항목 PI,CE,UI,AR,CF,SR,HR,AD,NC,MC,MT · 1100행 |
| 환경 | local-win |

## 1. LLM Judge

아직 채점하지 않았다. `scripts/judge_*.js` 단계(외부 전송 승인 필요) 후 이 보고서를 다시 만든다.

## 2. 결과론적 지표 · 계측 (독립 표본, 반복 항목 제외)

| 지표 | 값 |
|---|---|
| 기대 상태 일치 | 84.5% (1100행) |
| FAQ 부재 판단 P / R / F1 | 0.909 / 0.794 / 0.848 |
| 근거 채택률(정답 근거 문서만 인용) · 엄격(정답 근거 문서 전부 인용) · 정확 인용 | 94.7% · 84.3% · 82.3% (대상 751행) |
| 근거 인용 정밀도 · 정답 문서 재현율 | 98.7% · 90.5% |
| 채택 분류 EXACT / WITH_EXTRA / PARTIAL / WRONG / NONE | 618 / 15 / 93 / 2 / 23 |
| Context에 없는 ID 인용 비율 | 0.1% |
| 사용자 정보/API·대화 이력 꼬리표 인용(채택 판정에서 제외) | 1건 (0.1%) |
| 답했는데 근거 미기재(답·부분 답·충돌 라벨 + 빈 evidence_ids, AR 제외) | 5건 (0.7%) |
| 표현 규칙 점수 · 실격 비율 | 82.1 · 5.8% |
| 포맷 준수 | 100.0% (생성 오류 0건) |
| 키 순서 준수(evidence_ids → status → answer) | 0.0% · answer>evidence_ids>status 1100 |
| 타임아웃(60s 초과 = 오류) | 0건 (0.0%) |
| 지연 평균 / P50 / P95 (응답 받은 행) | 1.06s / 1.04s / 1.71s |
| TPS 평균 | 78.8 |

## 3. 항목별 결과론적 지표

| 항목 | 행 | 기대 상태 일치 | 근거 채택률 | 정답 유사도 | 키워드 | NLI 지지율 | 표현 규칙 | 포맷 | 지연 평균 | P95 |
|---|---|---|---|---|---|---|---|---|---|---|
| NC 유사 FAQ 구분·노이즈 | 100 | 99.0% | 85.0% | N/A | N/A | N/A | 89.3 | 100.0% | 1.05s | 1.57s |
| MC 다중 FAQ 조합 | 100 | 100.0% | 100.0% | N/A | N/A | N/A | 84.3 | 100.0% | 1.45s | 2.03s |
| UI 사용자 정보 + FAQ | 100 | 79.0% | 98.0% | N/A | N/A | N/A | 82.9 | 100.0% | 1.24s | 1.79s |
| CE 조건·예외·경계값 | 100 | 77.0% | 93.0% | N/A | N/A | N/A | 83.9 | 100.0% | 1.13s | 1.63s |
| PI 부분 정보 | 100 | 85.0% | 88.0% | N/A | N/A | N/A | 84.2 | 100.0% | 1.12s | 1.61s |
| SR 유사하지만 답 없음 | 100 | 90.0% | 대상 없음 | N/A | N/A | N/A | 85.3 | 100.0% | 0.69s | 1.21s |
| HR 무관 FAQ | 100 | 89.0% | 대상 없음 | N/A | N/A | N/A | 84.6 | 100.0% | 0.59s | 0.83s |
| CF FAQ 충돌·시행일 | 100 | 57.0% | 100.0% | N/A | N/A | N/A | 49.9 | 100.0% | 1.39s | 2.02s |
| MT 멀티턴 대화 | 100 | 98.0% | 100.0% | N/A | N/A | N/A | 82.3 | 100.0% | 1.04s | 1.53s |
| AD 적대적 입력·범위 밖 | 100 | 92.0% | 93.7% | N/A | N/A | N/A | 87.8 | 100.0% | 0.84s | 1.31s |
| AR API 결과 답변 | 100 | 64.0% | 대상 없음 | N/A | N/A | N/A | 88.5 | 100.0% | 1.08s | 1.66s |

## 4. 상태 혼동 행렬 (독립 표본, 행=기대 · 열=응답)

| 기대 \ 응답 | ABSTAIN | ANSWER | CONFLICT | OUT_OF_SCOPE | PARTIAL | 재현율 |
|---|---|---|---|---|---|---|
| ANSWER | 6 | 575 | 0 | 0 | 37 | 93.0% |
| PARTIAL | 13 | 36 | 0 | 1 | 111 | 68.9% |
| ABSTAIN | 189 | 20 | 0 | 9 | 20 | 79.4% |
| CONFLICT | 0 | 23 | 18 | 0 | 5 | 39.1% |
| OUT_OF_SCOPE | 0 | 0 | 0 | 37 | 0 | 100.0% |

## 5. 파일

- 원본 응답: `prompts_test_v5/try2/results/raw/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i2_20261012_PI-CE-UI-AR-CF-SR-HR-AD-NC-MC-MT/generation.jsonl`
- 채점 결과·통합 CSV: `prompts_test_v5/try2/results/raw/scored/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i2_20261012_PI-CE-UI-AR-CF-SR-HR-AD-NC-MC-MT/` (review.csv)
