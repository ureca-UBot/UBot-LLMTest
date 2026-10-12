# run 요약 — local-win_qwen3-4b-instruct_t0_nothink_fixed_n200_20261012_AR-UI-PI-MC-CE-NC-SR-HR-AD-MT_ids-ids

> 자동 생성 문서(`scripts/docgen/build_run_report.js`) — 손으로 고치지 마세요.
> 생성 2026-10-12T02:56:44.566Z · prompts_test_v5/smoke

| 항목 | 값 |
|---|---|
| 모델 | `qwen3:4b-instruct` |
| 조건 | t0_nothink {"temperature":0,"seed":null,"think":null,"format":{"type":"object","properties":{"evidence_ids":{"type":"array","items":{"type":"string"}},"status":{"type":"string","enum":["ANSWER","PARTIAL","ABSTAIN","CONFLICT","OUT_OF_SCOPE"]},"answer":{"type":"string"}},"required":["evidence_ids","status","answer"]}} |
| 컨텍스트 방식 | fixed |
| 프롬프트 | v4_base |
| 데이터 | test_set4r · 항목당 200건 · 항목 AR,UI,PI,MC,CE,NC,SR,HR,AD,MT · 24행 |
| 환경 | local-win |

## 1. LLM Judge

아직 채점하지 않았다. `scripts/judge_*.js` 단계(외부 전송 승인 필요) 후 이 보고서를 다시 만든다.

## 2. 결과론적 지표 · 계측 (독립 표본, 반복 항목 제외)

| 지표 | 값 |
|---|---|
| 기대 상태 일치 | 62.5% (24행) |
| FAQ 부재 판단 P / R / F1 | 0.667 / 0.286 / 0.400 |
| 근거 채택률(정답 근거 문서만 인용) · 엄격(정답 근거 문서 전부 인용) · 정확 인용 | 84.6% · 92.3% · 84.6% (대상 13행) |
| 근거 인용 정밀도 · 정답 문서 재현율 | 95.8% · 92.3% |
| 채택 분류 EXACT / WITH_EXTRA / PARTIAL / WRONG / NONE | 11 / 1 / 0 / 0 / 1 |
| Context에 없는 ID 인용 비율 | 0.0% |
| 사용자 정보/API·대화 이력 꼬리표 인용(채택 판정에서 제외) | 3건 (12.5%) |
| 답했는데 근거 미기재(답·부분 답·충돌 라벨 + 빈 evidence_ids, AR 제외) | 0건 (0.0%) |
| 표현 규칙 점수 · 실격 비율 | 78.8 · 12.5% |
| 포맷 준수 | 100.0% (생성 오류 0건) |
| 키 순서 준수(evidence_ids → status → answer) | 0.0% · answer>evidence_ids>status 24 |
| 타임아웃(60s 초과 = 오류) | 0건 (0.0%) |
| 지연 평균 / P50 / P95 (응답 받은 행) | 2.17s / 1.97s / 3.54s |
| TPS 평균 | 83.9 |

## 3. 항목별 결과론적 지표

| 항목 | 행 | 기대 상태 일치 | 근거 채택률 | 정답 유사도 | 키워드 | NLI 지지율 | 표현 규칙 | 포맷 | 지연 평균 | P95 |
|---|---|---|---|---|---|---|---|---|---|---|
| NC 유사 FAQ 구분·노이즈 | 1 | 100.0% | 0.0% | N/A | N/A | N/A | 85.0 | 100.0% | 3.19s | 3.19s |
| MC 다중 FAQ 조합 | 2 | 100.0% | 100.0% | N/A | N/A | N/A | 100.0 | 100.0% | 2.85s | 3.08s |
| UI 사용자 정보 + FAQ | 5 | 60.0% | 100.0% | N/A | N/A | N/A | 52.0 | 100.0% | 2.78s | 4.71s |
| CE 조건·예외·경계값 | 1 | 100.0% | 100.0% | N/A | N/A | N/A | 60.0 | 100.0% | 1.95s | 1.95s |
| PI 부분 정보 | 3 | 66.7% | 66.7% | N/A | N/A | N/A | 100.0 | 100.0% | 2.06s | 2.15s |
| SR 유사하지만 답 없음 | 1 | 100.0% | 대상 없음 | N/A | N/A | N/A | 85.0 | 100.0% | 1.45s | 1.45s |
| HR 무관 FAQ | 1 | 100.0% | 대상 없음 | N/A | N/A | N/A | 100.0 | 100.0% | 0.93s | 0.93s |
| MT 멀티턴 대화 | 1 | 100.0% | 100.0% | N/A | N/A | N/A | 0.0 | 100.0% | 3.46s | 3.46s |
| AD 적대적 입력·범위 밖 | 1 | 100.0% | 대상 없음 | N/A | N/A | N/A | 100.0 | 100.0% | 0.78s | 0.78s |
| AR API 결과 답변 | 8 | 25.0% | 대상 없음 | N/A | N/A | N/A | 87.5 | 100.0% | 1.82s | 2.97s |

## 4. 상태 혼동 행렬 (독립 표본, 행=기대 · 열=응답)

| 기대 \ 응답 | ABSTAIN | ANSWER | OUT_OF_SCOPE | PARTIAL | 재현율 |
|---|---|---|---|---|---|
| ANSWER | 0 | 7 | 0 | 1 | 87.5% |
| PARTIAL | 1 | 2 | 0 | 5 | 62.5% |
| ABSTAIN | 2 | 1 | 0 | 4 | 28.6% |
| OUT_OF_SCOPE | 0 | 0 | 1 | 0 | 100.0% |

## 5. 파일

- 원본 응답: `prompts_test_v5/smoke/results/raw/local-win_qwen3-4b-instruct_t0_nothink_fixed_n200_20261012_AR-UI-PI-MC-CE-NC-SR-HR-AD-MT_ids-ids/generation.jsonl`
- 채점 결과·통합 CSV: `prompts_test_v5/smoke/results/raw/scored/local-win_qwen3-4b-instruct_t0_nothink_fixed_n200_20261012_AR-UI-PI-MC-CE-NC-SR-HR-AD-MT_ids-ids/` (review.csv)
