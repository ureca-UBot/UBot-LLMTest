# run 요약 — local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i3_20261013_PI-CE-UI-SR-NC-MC-MT

> 자동 생성 문서(`scripts/docgen/build_run_report.js`) — 손으로 고치지 마세요.
> 생성 2026-10-13T06:40:54.907Z · prompts_test_v6/try1

| 항목 | 값 |
|---|---|
| 모델 | `qwen3:4b-instruct` |
| 조건 | t0_nothink {"temperature":0,"seed":null,"think":null,"format":{"type":"object","properties":{"evidence_ids":{"type":"array","items":{"type":"string"}},"status":{"type":"string","enum":["ANSWER","PARTIAL","ABSTAIN","CONFLICT","OUT_OF_SCOPE"]},"answer":{"type":"string"}},"required":["evidence_ids","status","answer"]}} |
| 컨텍스트 방식 | fixed |
| 프롬프트 | v5_i3 |
| 데이터 | test_set4r · 항목당 100건 · 항목 PI,CE,UI,SR,NC,MC,MT · 700행 |
| 환경 | local-win |

## 1. LLM Judge

아직 채점하지 않았다. `scripts/judge_*.js` 단계(외부 전송 승인 필요) 후 이 보고서를 다시 만든다.

## 2. 결과론적 지표 · 계측 (독립 표본, 반복 항목 제외)

| 지표 | 값 |
|---|---|
| 기대 상태 일치 | 89.3% (700행) |
| FAQ 부재 판단 P / R / F1 | 0.875 / 0.840 / 0.857 |
| 근거 채택률(정답 근거 문서만 인용) · 엄격(정답 근거 문서 전부 인용) · 정확 인용 | 93.0% · 92.8% · 88.3% (대상 600행) |
| 근거 인용 정밀도 · 정답 문서 재현율 | 97.6% · 95.2% |
| 채택 분류 EXACT / WITH_EXTRA / PARTIAL / WRONG / NONE | 530 / 27 / 28 / 0 / 15 |
| Context에 없는 ID 인용 비율 | 0.0% |
| 사용자 정보/API·대화 이력 꼬리표 인용(채택 판정에서 제외) | 0건 (0.0%) |
| 답했는데 근거 미기재(답·부분 답·충돌 라벨 + 빈 evidence_ids, AR 제외) | 2건 (0.3%) |
| 표현 규칙 점수 · 실격 비율 | 67.9 · 26.3% |
| 포맷 준수 | 99.9% (생성 오류 1건) |
| 키 순서 준수(evidence_ids → status → answer) | 0.0% · answer>evidence_ids>status 699 |
| 타임아웃(60s 초과 = 오류) | 1건 (0.1%) |
| 지연 평균 / P50 / P95 (응답 받은 행) | 2.20s / 2.08s / 3.77s |
| TPS 평균 | 76.8 |

## 3. 항목별 결과론적 지표

| 항목 | 행 | 기대 상태 일치 | 근거 채택률 | 정답 유사도 | 키워드 | NLI 지지율 | 표현 규칙 | 포맷 | 지연 평균 | P95 |
|---|---|---|---|---|---|---|---|---|---|---|
| NC 유사 FAQ 구분·노이즈 | 100 | 95.0% | 73.0% | N/A | N/A | N/A | 65.9 | 100.0% | 2.06s | 3.47s |
| MC 다중 FAQ 조합 | 100 | 100.0% | 100.0% | N/A | N/A | N/A | 92.1 | 100.0% | 2.44s | 3.95s |
| UI 사용자 정보 + FAQ | 100 | 85.0% | 99.0% | N/A | N/A | N/A | 43.0 | 99.0% | 3.00s | 5.31s |
| CE 조건·예외·경계값 | 100 | 82.0% | 98.0% | N/A | N/A | N/A | 59.8 | 100.0% | 2.70s | 4.09s |
| PI 부분 정보 | 100 | 87.0% | 88.0% | N/A | N/A | N/A | 86.0 | 100.0% | 1.99s | 2.89s |
| SR 유사하지만 답 없음 | 100 | 84.0% | 대상 없음 | N/A | N/A | N/A | 76.3 | 100.0% | 1.40s | 2.54s |
| MT 멀티턴 대화 | 100 | 92.0% | 100.0% | N/A | N/A | N/A | 52.0 | 100.0% | 1.84s | 3.45s |

## 4. 상태 혼동 행렬 (독립 표본, 행=기대 · 열=응답)

| 기대 \ 응답 | ABSTAIN | ANSWER | NONE | PARTIAL | 재현율 |
|---|---|---|---|---|---|
| ANSWER | 0 | 425 | 1 | 34 | 92.4% |
| PARTIAL | 12 | 12 | 0 | 116 | 82.9% |
| ABSTAIN | 84 | 0 | 0 | 16 | 84.0% |

## 5. 파일

- 원본 응답: `prompts_test_v6/try1/results/raw/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i3_20261013_PI-CE-UI-SR-NC-MC-MT/generation.jsonl`
- 채점 결과·통합 CSV: `prompts_test_v6/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i3_20261013_PI-CE-UI-SR-NC-MC-MT/` (review.csv)
