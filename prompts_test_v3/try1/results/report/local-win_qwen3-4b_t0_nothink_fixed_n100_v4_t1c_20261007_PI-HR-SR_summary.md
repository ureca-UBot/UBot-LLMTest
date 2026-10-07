# run 요약 — local-win_qwen3-4b_t0_nothink_fixed_n100_v4_t1c_20261007_PI-HR-SR

> 자동 생성 문서(`scripts/docgen/build_run_report.js`) — 손으로 고치지 마세요.
> 생성 2026-10-07T05:59:23.660Z · prompts_test_v3/try1

| 항목 | 값 |
|---|---|
| 모델 | `qwen3:4b` |
| 조건 | t0_nothink {"temperature":0,"seed":null,"think":false,"format":{"type":"object","properties":{"evidence_ids":{"type":"array","items":{"type":"string"}},"status":{"type":"string","enum":["ANSWER","PARTIAL","ABSTAIN","CONFLICT","OUT_OF_SCOPE"]},"answer":{"type":"string"}},"required":["evidence_ids","status","answer"]}} |
| 컨텍스트 방식 | fixed |
| 프롬프트 | v4_t1c |
| 데이터 | test_set4 · 항목당 100건 · 항목 PI,HR,SR · 300행 |
| 환경 | local-win |

## 1. LLM Judge

아직 채점하지 않았다. `scripts/judge_*.js` 단계(외부 전송 승인 필요) 후 이 보고서를 다시 만든다.

## 2. 결과론적 지표 · 계측 (독립 표본, 반복 항목 제외)

| 지표 | 값 |
|---|---|
| 기대 상태 일치 | 76.3% (300행) |
| FAQ 부재 판단 P / R / F1 | 0.891 / 0.855 / 0.872 |
| 근거 채택률(정답 근거 문서만 인용) · 엄격(정답 근거 문서 전부 인용) · 정확 인용 | 27.0% · 29.0% · 26.0% (대상 100행) |
| 근거 인용 정밀도 · 정답 문서 재현율 | 96.7% · 29.5% |
| 채택 분류 EXACT / WITH_EXTRA / PARTIAL / WRONG / NONE | 26 / 3 / 1 / 0 / 70 |
| Context에 없는 ID 인용 비율 | 0.0% |
| 사용자 정보/API·대화 이력 꼬리표 인용(채택 판정에서 제외) | 0건 (0.0%) |
| 답했는데 근거 미기재(답·부분 답·충돌 라벨 + 빈 evidence_ids, AR 제외) | 73건 (70.2%) |
| 표현 규칙 점수 · 실격 비율 | 49.6 · 46.3% |
| 포맷 준수 | 100.0% (생성 오류 0건) |
| 키 순서 준수(evidence_ids → status → answer) | 100.0% · evidence_ids>status>answer 300 |
| 타임아웃(60s 초과 = 오류) | 0건 (0.0%) |
| 지연 평균 / P50 / P95 (응답 받은 행) | 1.62s / 1.65s / 2.43s |
| TPS 평균 | 80.8 |

## 3. 항목별 결과론적 지표

| 항목 | 행 | 기대 상태 일치 | 근거 채택률 | 정답 유사도 | 키워드 | NLI 지지율 | 표현 규칙 | 포맷 | 지연 평균 | P95 |
|---|---|---|---|---|---|---|---|---|---|---|
| PI 부분 정보 | 100 | 58.0% | 27.0% | N/A | N/A | N/A | 51.1 | 100.0% | 1.87s | 2.52s |
| SR 유사하지만 답 없음 | 100 | 77.0% | 대상 없음 | N/A | N/A | N/A | 34.9 | 100.0% | 1.63s | 2.56s |
| HR 무관 FAQ | 100 | 94.0% | 대상 없음 | N/A | N/A | N/A | 62.9 | 100.0% | 1.37s | 2.02s |

## 4. 상태 혼동 행렬 (독립 표본, 행=기대 · 열=응답)

| 기대 \ 응답 | ABSTAIN | ANSWER | OUT_OF_SCOPE | PARTIAL | 재현율 |
|---|---|---|---|---|---|
| PARTIAL | 21 | 21 | 0 | 58 | 58.0% |
| ABSTAIN | 171 | 0 | 4 | 25 | 85.5% |

## 5. 파일

- 원본 응답: `prompts_test_v3/try1/results/raw/local-win_qwen3-4b_t0_nothink_fixed_n100_v4_t1c_20261007_PI-HR-SR/generation.jsonl`
- 채점 결과·통합 CSV: `prompts_test_v3/try1/results/raw/scored/local-win_qwen3-4b_t0_nothink_fixed_n100_v4_t1c_20261007_PI-HR-SR/` (review.csv)
