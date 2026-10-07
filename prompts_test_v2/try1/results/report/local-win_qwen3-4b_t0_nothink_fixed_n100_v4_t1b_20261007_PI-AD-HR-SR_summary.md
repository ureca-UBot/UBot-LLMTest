# run 요약 — local-win_qwen3-4b_t0_nothink_fixed_n100_v4_t1b_20261007_PI-AD-HR-SR

> 자동 생성 문서(`scripts/docgen/build_run_report.js`) — 손으로 고치지 마세요.
> 생성 2026-10-07T04:32:03.472Z · prompts_test_v2/try1

| 항목 | 값 |
|---|---|
| 모델 | `qwen3:4b` |
| 조건 | t0_nothink {"temperature":0,"seed":null,"think":false,"format":{"type":"object","properties":{"evidence_ids":{"type":"array","items":{"type":"string"}},"status":{"type":"string","enum":["ANSWER","PARTIAL","ABSTAIN","CONFLICT","OUT_OF_SCOPE"]},"answer":{"type":"string"}},"required":["evidence_ids","status","answer"]}} |
| 컨텍스트 방식 | fixed |
| 프롬프트 | v4_t1b |
| 데이터 | test_set4 · 항목당 100건 · 항목 PI,AD,HR,SR · 400행 |
| 환경 | local-win |

## 1. LLM Judge

아직 채점하지 않았다. `scripts/judge_*.js` 단계(외부 전송 승인 필요) 후 이 보고서를 다시 만든다.

## 2. 결과론적 지표 · 계측 (독립 표본, 반복 항목 제외)

| 지표 | 값 |
|---|---|
| 기대 상태 일치 | 73.3% (400행) |
| FAQ 부재 판단 P / R / F1 | 0.788 / 0.835 / 0.811 |
| 근거 채택률(정답 근거 문서만 인용) · 엄격(정답 근거 문서 전부 인용) · 정확 인용 | 47.9% · 48.5% · 46.6% (대상 163행) |
| 근거 인용 정밀도 · 정답 문서 재현율 | 98.8% · 49.1% |
| 채택 분류 EXACT / WITH_EXTRA / PARTIAL / WRONG / NONE | 76 / 3 / 2 / 0 / 82 |
| Context에 없는 ID 인용 비율 | 0.0% |
| 사용자 정보/API·대화 이력 꼬리표 인용(채택 판정에서 제외) | 0건 (0.0%) |
| 답했는데 근거 미기재(답·부분 답·충돌 라벨 + 빈 evidence_ids, AR 제외) | 66건 (44.6%) |
| 정답 유사도 평균(×100) · 중앙값 | 81.2 · 82.1 |
| 키워드 포함률 평균 | 42.8% |
| NLI 지지율 평균(참고) | 41.2% (측정 148행) |
| 미확인 숫자 포함 비율(참고) | 15.5% |
| 표현 규칙 점수 · 실격 비율 | 63.0 · 32.0% |
| 포맷 준수 | 100.0% (생성 오류 0건) |
| 키 순서 준수(evidence_ids → status → answer) | 100.0% · evidence_ids>status>answer 400 |
| 타임아웃(60s 초과 = 오류) | 0건 (0.0%) |
| 지연 평균 / P50 / P95 (응답 받은 행) | 1.66s / 1.62s / 2.75s |
| TPS 평균 | 76.3 |

## 3. 항목별 결과론적 지표

| 항목 | 행 | 기대 상태 일치 | 근거 채택률 | 정답 유사도 | 키워드 | NLI 지지율 | 표현 규칙 | 포맷 | 지연 평균 | P95 |
|---|---|---|---|---|---|---|---|---|---|---|
| PI 부분 정보 | 100 | 59.0% | 41.0% | 85.6 | 45.7% | 42.6% | 56.5 | 100.0% | 2.10s | 2.85s |
| SR 유사하지만 답 없음 | 100 | 72.0% | 대상 없음 | 79.6 | 31.9% | 9.8% | 52.8 | 100.0% | 1.84s | 2.94s |
| HR 무관 FAQ | 100 | 95.0% | 대상 없음 | 80.5 | 32.0% | 33.3% | 71.5 | 100.0% | 1.52s | 2.35s |
| AD 적대적 입력·범위 밖 | 100 | 67.0% | 58.7% | 79.2 | 61.7% | 60.9% | 71.4 | 100.0% | 1.19s | 2.04s |

## 4. 상태 혼동 행렬 (독립 표본, 행=기대 · 열=응답)

| 기대 \ 응답 | ABSTAIN | ANSWER | CONFLICT | OUT_OF_SCOPE | PARTIAL | 재현율 |
|---|---|---|---|---|---|---|
| PARTIAL | 22 | 19 | 0 | 0 | 59 | 59.0% |
| ABSTAIN | 167 | 0 | 0 | 3 | 30 | 83.5% |
| OUT_OF_SCOPE | 0 | 0 | 0 | 37 | 0 | 100.0% |
| ANSWER | 23 | 30 | 5 | 0 | 5 | 47.6% |

## 5. 파일

- 원본 응답: `prompts_test_v2/try1/results/raw/local-win_qwen3-4b_t0_nothink_fixed_n100_v4_t1b_20261007_PI-AD-HR-SR/generation.jsonl`
- 채점 결과·통합 CSV: `prompts_test_v2/try1/results/raw/scored/local-win_qwen3-4b_t0_nothink_fixed_n100_v4_t1b_20261007_PI-AD-HR-SR/` (review.csv)
