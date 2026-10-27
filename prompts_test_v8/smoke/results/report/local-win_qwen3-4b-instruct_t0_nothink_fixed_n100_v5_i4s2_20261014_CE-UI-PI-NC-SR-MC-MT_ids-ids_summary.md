# run 요약 — local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4s2_20261014_CE-UI-PI-NC-SR-MC-MT_ids-ids

> 자동 생성 문서(`scripts/docgen/build_run_report.js`) — 손으로 고치지 마세요.
> 생성 2026-10-14T06:26:53.071Z · prompts_test_v8_status/smoke

| 항목 | 값 |
|---|---|
| 모델 | `qwen3:4b-instruct` |
| 조건 | t0_nothink {"temperature":0,"seed":null,"think":null,"format":{"type":"object","properties":{"a_status":{"type":"string","enum":["ANSWER","PARTIAL","ABSTAIN","CONFLICT","OUT_OF_SCOPE"]},"b_evidence_ids":{"type":"array","items":{"type":"string"}},"c_answer":{"type":"string"}},"required":["a_status","b_evidence_ids","c_answer"]}} |
| 컨텍스트 방식 | fixed |
| 프롬프트 | v5_i4s2 |
| 데이터 | test_set4r · 항목당 100건 · 항목 CE,UI,PI,NC,SR,MC,MT · 22행 |
| 환경 | local-win |

## 1. LLM Judge

아직 채점하지 않았다. `scripts/judge_*.js` 단계(외부 전송 승인 필요) 후 이 보고서를 다시 만든다.

## 2. 결과론적 지표 · 계측 (독립 표본, 반복 항목 제외)

| 지표 | 값 |
|---|---|
| 기대 상태 일치 | 72.7% (22행) |
| FAQ 부재 판단 P / R / F1 | 1.000 / 0.333 / 0.500 |
| 근거 채택률(정답 근거 문서만 인용) · 엄격(정답 근거 문서 전부 인용) · 정확 인용 | 100.0% · 89.5% · 89.5% (대상 19행) |
| 근거 인용 정밀도 · 정답 문서 재현율 | 100.0% · 94.7% |
| 채택 분류 EXACT / WITH_EXTRA / PARTIAL / WRONG / NONE | 17 / 0 / 2 / 0 / 0 |
| Context에 없는 ID 인용 비율 | 0.0% |
| 사용자 정보/API·대화 이력 꼬리표 인용(채택 판정에서 제외) | 0건 (0.0%) |
| 답했는데 근거 미기재(답·부분 답·충돌 라벨 + 빈 evidence_ids, AR 제외) | 0건 (0.0%) |
| 표현 규칙 점수 · 실격 비율 | 84.1 · 9.1% |
| 포맷 준수 | 100.0% (생성 오류 0건) |
| 키 순서 준수(status → evidence_ids → answer) | 100.0% · status>evidence_ids>answer 22 |
| 타임아웃(60s 초과 = 오류) | 0건 (0.0%) |
| 지연 평균 / P50 / P95 (응답 받은 행) | 1.91s / 1.84s / 2.61s |
| TPS 평균 | 64.1 |

## 3. 항목별 결과론적 지표

| 항목 | 행 | 기대 상태 일치 | 근거 채택률 | 정답 유사도 | 키워드 | NLI 지지율 | 표현 규칙 | 포맷 | 지연 평균 | P95 |
|---|---|---|---|---|---|---|---|---|---|---|
| NC 유사 FAQ 구분·노이즈 | 3 | 100.0% | 100.0% | N/A | N/A | N/A | 95.0 | 100.0% | 1.70s | 2.93s |
| MC 다중 FAQ 조합 | 1 | 100.0% | 100.0% | N/A | N/A | N/A | 85.0 | 100.0% | 2.61s | 2.61s |
| UI 사용자 정보 + FAQ | 4 | 50.0% | 100.0% | N/A | N/A | N/A | 88.8 | 100.0% | 2.09s | 2.46s |
| CE 조건·예외·경계값 | 5 | 60.0% | 100.0% | N/A | N/A | N/A | 60.0 | 100.0% | 2.08s | 2.48s |
| PI 부분 정보 | 5 | 100.0% | 100.0% | N/A | N/A | N/A | 88.0 | 100.0% | 1.92s | 2.45s |
| SR 유사하지만 답 없음 | 3 | 33.3% | 대상 없음 | N/A | N/A | N/A | 95.0 | 100.0% | 1.44s | 1.74s |
| MT 멀티턴 대화 | 1 | 100.0% | 100.0% | N/A | N/A | N/A | 100.0 | 100.0% | 1.65s | 1.65s |

## 4. 상태 혼동 행렬 (독립 표본, 행=기대 · 열=응답)

| 기대 \ 응답 | ABSTAIN | ANSWER | PARTIAL | 재현율 |
|---|---|---|---|---|
| ANSWER | 0 | 10 | 4 | 71.4% |
| PARTIAL | 0 | 0 | 5 | 100.0% |
| ABSTAIN | 1 | 0 | 2 | 33.3% |

## 5. 파일

- 원본 응답: `prompts_test_v8_status/smoke/results/raw/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4s2_20261014_CE-UI-PI-NC-SR-MC-MT_ids-ids/generation.jsonl`
- 채점 결과·통합 CSV: `prompts_test_v8_status/smoke/results/raw/scored/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4s2_20261014_CE-UI-PI-NC-SR-MC-MT_ids-ids/` (review.csv)
