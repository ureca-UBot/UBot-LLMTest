# run 요약 — local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_20261013_AR-UI

> 자동 생성 문서(`scripts/docgen/build_run_report.js`) — 손으로 고치지 마세요.
> 생성 2026-10-13T06:40:38.094Z · input_format_test/jsonr

| 항목 | 값 |
|---|---|
| 모델 | `qwen3:4b-instruct` |
| 조건 | t0_nothink {"temperature":0,"seed":null,"think":null,"format":{"type":"object","properties":{"evidence_ids":{"type":"array","items":{"type":"string"}},"status":{"type":"string","enum":["ANSWER","PARTIAL","ABSTAIN","CONFLICT","OUT_OF_SCOPE"]},"answer":{"type":"string"}},"required":["evidence_ids","status","answer"]}} |
| 컨텍스트 방식 | fixed |
| 프롬프트 | v4_base |
| 데이터 | test_set4r_jsonr · 항목당 100건 · 항목 AR,UI · 200행 |
| 환경 | local-win |

## 1. LLM Judge

아직 채점하지 않았다. `scripts/judge_*.js` 단계(외부 전송 승인 필요) 후 이 보고서를 다시 만든다.

## 2. 결과론적 지표 · 계측 (독립 표본, 반복 항목 제외)

| 지표 | 값 |
|---|---|
| 기대 상태 일치 | 72.0% (200행) |
| FAQ 부재 판단 P / R / F1 | 1.000 / 0.346 / 0.514 |
| 근거 채택률(정답 근거 문서만 인용) · 엄격(정답 근거 문서 전부 인용) · 정확 인용 | 98.0% · 89.0% · 87.0% (대상 100행) |
| 근거 인용 정밀도 · 정답 문서 재현율 | 99.0% · 94.5% |
| 채택 분류 EXACT / WITH_EXTRA / PARTIAL / WRONG / NONE | 87 / 2 / 11 / 0 / 0 |
| Context에 없는 ID 인용 비율 | 0.0% |
| 사용자 정보/API·대화 이력 꼬리표 인용(채택 판정에서 제외) | 45건 (22.5%) |
| 답했는데 근거 미기재(답·부분 답·충돌 라벨 + 빈 evidence_ids, AR 제외) | 0건 (0.0%) |
| 표현 규칙 점수 · 실격 비율 | 74.0 · 15.5% |
| 포맷 준수 | 100.0% (생성 오류 0건) |
| 키 순서 준수(evidence_ids → status → answer) | 0.0% · answer>evidence_ids>status 200 |
| 타임아웃(60s 초과 = 오류) | 0건 (0.0%) |
| 지연 평균 / P50 / P95 (응답 받은 행) | 2.27s / 2.10s / 4.22s |
| TPS 평균 | 77.6 |

## 3. 항목별 결과론적 지표

| 항목 | 행 | 기대 상태 일치 | 근거 채택률 | 정답 유사도 | 키워드 | NLI 지지율 | 표현 규칙 | 포맷 | 지연 평균 | P95 |
|---|---|---|---|---|---|---|---|---|---|---|
| UI 사용자 정보 + FAQ | 100 | 81.0% | 98.0% | N/A | N/A | N/A | 63.0 | 100.0% | 2.68s | 4.87s |
| AR API 결과 답변 | 100 | 63.0% | 대상 없음 | N/A | N/A | N/A | 85.0 | 100.0% | 1.85s | 2.99s |

## 4. 상태 혼동 행렬 (독립 표본, 행=기대 · 열=응답)

| 기대 \ 응답 | ABSTAIN | ANSWER | PARTIAL | 재현율 |
|---|---|---|---|---|
| ANSWER | 0 | 109 | 4 | 96.5% |
| PARTIAL | 0 | 35 | 26 | 42.6% |
| ABSTAIN | 9 | 6 | 11 | 34.6% |

## 5. 파일

- 원본 응답: `input_format_test/jsonr/results/raw/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_20261013_AR-UI/generation.jsonl`
- 채점 결과·통합 CSV: `input_format_test/jsonr/results/raw/scored/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_20261013_AR-UI/` (review.csv)
