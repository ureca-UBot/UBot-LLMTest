# run 요약 — local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4ek_20261014_CE-UI-PI-NC-SR-MC-MT_ids-ids

> 자동 생성 문서(`scripts/docgen/build_run_report.js`) — 손으로 고치지 마세요.
> 생성 2026-10-14T04:52:52.454Z · prompts_test_v8_evcalc/smoke

| 항목 | 값 |
|---|---|
| 모델 | `qwen3:4b-instruct` |
| 조건 | t0_nothink {"temperature":0,"seed":null,"think":null,"format":{"type":"object","properties":{"a_evidence_ids":{"type":"array","items":{"type":"string"}},"b_calc":{"type":"string"},"c_status":{"type":"string","enum":["ANSWER","PARTIAL","ABSTAIN","CONFLICT","OUT_OF_SCOPE"]},"d_answer":{"type":"string"}},"required":["a_evidence_ids","b_calc","c_status","d_answer"]}} |
| 컨텍스트 방식 | fixed |
| 프롬프트 | v5_i4ek |
| 데이터 | test_set4r · 항목당 100건 · 항목 CE,UI,PI,NC,SR,MC,MT · 22행 |
| 환경 | local-win |

## 1. LLM Judge

아직 채점하지 않았다. `scripts/judge_*.js` 단계(외부 전송 승인 필요) 후 이 보고서를 다시 만든다.

## 2. 결과론적 지표 · 계측 (독립 표본, 반복 항목 제외)

| 지표 | 값 |
|---|---|
| 기대 상태 일치 | 45.5% (22행) |
| FAQ 부재 판단 P / R / F1 | 0.429 / 1.000 / 0.600 |
| 근거 채택률(정답 근거 문서만 인용) · 엄격(정답 근거 문서 전부 인용) · 정확 인용 | 15.8% · 10.5% · 10.5% (대상 19행) |
| 근거 인용 정밀도 · 정답 문서 재현율 | 100.0% · 13.2% |
| 채택 분류 EXACT / WITH_EXTRA / PARTIAL / WRONG / NONE | 2 / 0 / 1 / 0 / 16 |
| Context에 없는 ID 인용 비율 | 0.0% |
| 사용자 정보/API·대화 이력 꼬리표 인용(채택 판정에서 제외) | 0건 (0.0%) |
| 답했는데 근거 미기재(답·부분 답·충돌 라벨 + 빈 evidence_ids, AR 제외) | 12건 (80.0%) |
| 표현 규칙 점수 · 실격 비율 | 71.6 · 18.2% |
| 포맷 준수 | 100.0% (생성 오류 0건) |
| 키 순서 준수(evidence_ids → calc → status → answer) | 100.0% · evidence_ids>calc>status>answer 22 |
| 타임아웃(60s 초과 = 오류) | 0건 (0.0%) |
| 지연 평균 / P50 / P95 (응답 받은 행) | 2.35s / 1.99s / 4.15s |
| TPS 평균 | 68.1 |

## 3. 항목별 결과론적 지표

| 항목 | 행 | 기대 상태 일치 | 근거 채택률 | 정답 유사도 | 키워드 | NLI 지지율 | 표현 규칙 | 포맷 | 지연 평균 | P95 |
|---|---|---|---|---|---|---|---|---|---|---|
| NC 유사 FAQ 구분·노이즈 | 3 | 33.3% | 0.0% | N/A | N/A | N/A | 85.0 | 100.0% | 1.91s | 2.83s |
| MC 다중 FAQ 조합 | 1 | 0.0% | 0.0% | N/A | N/A | N/A | 100.0 | 100.0% | 2.92s | 2.92s |
| UI 사용자 정보 + FAQ | 4 | 75.0% | 50.0% | N/A | N/A | N/A | 88.8 | 100.0% | 2.91s | 4.15s |
| CE 조건·예외·경계값 | 5 | 0.0% | 0.0% | N/A | N/A | N/A | 34.0 | 100.0% | 3.54s | 8.55s |
| PI 부분 정보 | 5 | 40.0% | 0.0% | N/A | N/A | N/A | 68.0 | 100.0% | 1.74s | 2.12s |
| SR 유사하지만 답 없음 | 3 | 100.0% | 대상 없음 | N/A | N/A | N/A | 85.0 | 100.0% | 1.07s | 1.13s |
| MT 멀티턴 대화 | 1 | 100.0% | 100.0% | N/A | N/A | N/A | 100.0 | 100.0% | 1.78s | 1.78s |

## 4. 상태 혼동 행렬 (독립 표본, 행=기대 · 열=응답)

| 기대 \ 응답 | ABSTAIN | ANSWER | PARTIAL | 재현율 |
|---|---|---|---|---|
| ANSWER | 1 | 5 | 8 | 35.7% |
| PARTIAL | 3 | 0 | 2 | 40.0% |
| ABSTAIN | 3 | 0 | 0 | 100.0% |

## 5. 파일

- 원본 응답: `prompts_test_v8_evcalc/smoke/results/raw/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4ek_20261014_CE-UI-PI-NC-SR-MC-MT_ids-ids/generation.jsonl`
- 채점 결과·통합 CSV: `prompts_test_v8_evcalc/smoke/results/raw/scored/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4ek_20261014_CE-UI-PI-NC-SR-MC-MT_ids-ids/` (review.csv)
