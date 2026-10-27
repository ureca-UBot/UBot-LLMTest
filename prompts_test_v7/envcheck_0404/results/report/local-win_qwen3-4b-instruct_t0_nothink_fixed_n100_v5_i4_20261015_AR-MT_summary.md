# run 요약 — local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4_20261015_AR-MT

> 자동 생성 문서(`scripts/docgen/build_run_report.js`) — 손으로 고치지 마세요.
> 생성 2026-10-15T01:08:00.108Z · prompts_test_v7/envcheck_0404

| 항목 | 값 |
|---|---|
| 모델 | `qwen3:4b-instruct` |
| 조건 | t0_nothink {"temperature":0,"seed":null,"think":null,"format":{"type":"object","properties":{"evidence_ids":{"type":"array","items":{"type":"string"}},"status":{"type":"string","enum":["ANSWER","PARTIAL","ABSTAIN","CONFLICT","OUT_OF_SCOPE"]},"answer":{"type":"string"}},"required":["evidence_ids","status","answer"]}} |
| 컨텍스트 방식 | fixed |
| 프롬프트 | v5_i4 |
| 데이터 | test_set4r · 항목당 100건 · 항목 AR,MT · 200행 |
| 환경 | local-win |

## 1. LLM Judge

아직 채점하지 않았다. `scripts/judge_*.js` 단계(외부 전송 승인 필요) 후 이 보고서를 다시 만든다.

## 2. 결과론적 지표 · 계측 (독립 표본, 반복 항목 제외)

| 지표 | 값 |
|---|---|
| 기대 상태 일치 | 77.5% (200행) |
| FAQ 부재 판단 P / R / F1 | 1.000 / 0.077 / 0.143 |
| 근거 채택률(정답 근거 문서만 인용) · 엄격(정답 근거 문서 전부 인용) · 정확 인용 | 100.0% · 100.0% · 100.0% (대상 100행) |
| 근거 인용 정밀도 · 정답 문서 재현율 | 100.0% · 100.0% |
| 채택 분류 EXACT / WITH_EXTRA / PARTIAL / WRONG / NONE | 100 / 0 / 0 / 0 / 0 |
| Context에 없는 ID 인용 비율 | 0.0% |
| 사용자 정보/API·대화 이력 꼬리표 인용(채택 판정에서 제외) | 2건 (1.0%) |
| 답했는데 근거 미기재(답·부분 답·충돌 라벨 + 빈 evidence_ids, AR 제외) | 0건 (0.0%) |
| 표현 규칙 점수 · 실격 비율 | 81.5 · 11.5% |
| 포맷 준수 | 100.0% (생성 오류 0건) |
| 키 순서 준수(evidence_ids → status → answer) | 0.0% · answer>evidence_ids>status 200 |
| 타임아웃(60s 초과 = 오류) | 0건 (0.0%) |
| 지연 평균 / P50 / P95 (응답 받은 행) | 1.60s / 1.50s / 2.67s |
| TPS 평균 | 75.8 |

## 3. 항목별 결과론적 지표

| 항목 | 행 | 기대 상태 일치 | 근거 채택률 | 정답 유사도 | 키워드 | NLI 지지율 | 표현 규칙 | 포맷 | 지연 평균 | P95 |
|---|---|---|---|---|---|---|---|---|---|---|
| MT 멀티턴 대화 | 100 | 98.0% | 100.0% | N/A | N/A | N/A | 74.1 | 100.0% | 1.44s | 2.54s |
| AR API 결과 답변 | 100 | 57.0% | 대상 없음 | N/A | N/A | N/A | 88.8 | 100.0% | 1.75s | 2.73s |

## 4. 상태 혼동 행렬 (독립 표본, 행=기대 · 열=응답)

| 기대 \ 응답 | ABSTAIN | ANSWER | PARTIAL | 재현율 |
|---|---|---|---|---|
| ANSWER | 0 | 147 | 6 | 96.1% |
| ABSTAIN | 2 | 11 | 13 | 7.7% |
| PARTIAL | 0 | 15 | 6 | 28.6% |

## 5. 파일

- 원본 응답: `prompts_test_v7/envcheck_0404/results/raw/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4_20261015_AR-MT/generation.jsonl`
- 채점 결과·통합 CSV: `prompts_test_v7/envcheck_0404/results/raw/scored/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4_20261015_AR-MT/` (review.csv)
