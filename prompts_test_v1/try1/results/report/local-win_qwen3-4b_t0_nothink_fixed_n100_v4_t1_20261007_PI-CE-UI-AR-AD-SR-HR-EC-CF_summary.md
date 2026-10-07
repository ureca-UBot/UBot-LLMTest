# run 요약 — local-win_qwen3-4b_t0_nothink_fixed_n100_v4_t1_20261007_PI-CE-UI-AR-AD-SR-HR-EC-CF

> 자동 생성 문서(`scripts/docgen/build_run_report.js`) — 손으로 고치지 마세요.
> 생성 2026-10-07T00:49:10.812Z · prompts_test_v1/try1

| 항목 | 값 |
|---|---|
| 모델 | `qwen3:4b` |
| 조건 | t0_nothink {"temperature":0,"seed":null,"think":false,"format":{"type":"object","properties":{"evidence_ids":{"type":"array","items":{"type":"string"}},"status":{"type":"string","enum":["ANSWER","PARTIAL","ABSTAIN","CONFLICT","OUT_OF_SCOPE"]},"answer":{"type":"string"}},"required":["evidence_ids","status","answer"]}} |
| 컨텍스트 방식 | fixed |
| 프롬프트 | v4_t1 |
| 데이터 | test_set4 · 항목당 100건 · 항목 PI,CE,UI,AR,AD,SR,HR,EC,CF · 900행 |
| 환경 | local-win |

## 1. LLM Judge

아직 채점하지 않았다. `scripts/judge_*.js` 단계(외부 전송 승인 필요) 후 이 보고서를 다시 만든다.

## 2. 결과론적 지표 · 계측 (독립 표본, 반복 항목 제외)

| 지표 | 값 |
|---|---|
| 기대 상태 일치 | 67.9% (900행) |
| FAQ 부재 판단 P / R / F1 | 0.742 / 0.929 / 0.825 |
| 근거 채택률(정답 근거 문서만 인용) · 엄격(정답 근거 문서 전부 인용) · 정확 인용 | 48.1% · 57.2% · 44.1% (대상 451행) |
| 근거 인용 정밀도 · 정답 문서 재현율 | 89.8% · 59.2% |
| 채택 분류 EXACT / WITH_EXTRA / PARTIAL / WRONG / NONE | 199 / 59 / 18 / 0 / 175 |
| Context에 없는 ID 인용 비율 | 0.0% |
| 사용자 정보/API·대화 이력 꼬리표 인용(채택 판정에서 제외) | 0건 (0.0%) |
| 답했는데 근거 미기재(답·부분 답·충돌 라벨 + 빈 evidence_ids, AR 제외) | 73건 (20.2%) |
| 정답 유사도 평균(×100) · 중앙값 | 81.3 · 82.2 |
| 키워드 포함률 평균 | 41.1% |
| NLI 지지율 평균(참고) | 28.2% (측정 434행) |
| 미확인 숫자 포함 비율(참고) | 23.0% |
| 표현 규칙 점수 · 실격 비율 | 70.4 · 22.8% |
| 포맷 준수 | 100.0% (생성 오류 0건) |
| 키 순서 준수(evidence_ids → status → answer) | 100.0% · evidence_ids>status>answer 900 |
| 타임아웃(60s 초과 = 오류) | 0건 (0.0%) |
| 지연 평균 / P50 / P95 (응답 받은 행) | 1.66s / 1.46s / 3.43s |
| TPS 평균 | 77.8 |

## 3. 항목별 결과론적 지표

| 항목 | 행 | 기대 상태 일치 | 근거 채택률 | 정답 유사도 | 키워드 | NLI 지지율 | 표현 규칙 | 포맷 | 지연 평균 | P95 |
|---|---|---|---|---|---|---|---|---|---|---|
| UI 사용자 정보 + FAQ | 100 | 51.0% | 49.0% | 85.3 | 45.6% | 28.8% | 65.5 | 100.0% | 2.01s | 3.71s |
| CE 조건·예외·경계값 | 100 | 42.0% | 51.0% | 84.3 | 46.2% | 27.9% | 73.8 | 100.0% | 1.71s | 2.65s |
| PI 부분 정보 | 100 | 45.0% | 35.0% | 84.5 | 40.1% | 50.1% | 45.8 | 100.0% | 1.71s | 2.38s |
| SR 유사하지만 답 없음 | 100 | 97.0% | 대상 없음 | 81.8 | 30.1% | 22.2% | 54.3 | 100.0% | 1.41s | 2.16s |
| HR 무관 FAQ | 100 | 94.0% | 대상 없음 | 81.4 | 32.2% | N/A | 80.4 | 100.0% | 1.19s | 1.82s |
| EC 빈 컨텍스트 | 100 | 100.0% | 대상 없음 | 76.7 | 32.1% | N/A | 91.7 | 100.0% | 1.08s | 1.68s |
| CF FAQ 충돌·시행일 | 100 | 33.0% | 44.3% | 79.6 | 41.8% | 14.9% | 66.2 | 100.0% | 3.17s | 4.80s |
| AD 적대적 입력·범위 밖 | 100 | 74.0% | 68.3% | 78.7 | 59.4% | 61.7% | 75.5 | 100.0% | 1.10s | 1.66s |
| AR API 결과 답변 | 100 | 75.0% | 대상 없음 | 79.2 | 42.7% | 8.8% | 80.5 | 100.0% | 1.52s | 2.31s |

## 4. 상태 혼동 행렬 (독립 표본, 행=기대 · 열=응답)

| 기대 \ 응답 | ABSTAIN | ANSWER | CONFLICT | OUT_OF_SCOPE | PARTIAL | 재현율 |
|---|---|---|---|---|---|---|
| ANSWER | 45 | 165 | 37 | 0 | 71 | 51.9% |
| PARTIAL | 64 | 33 | 0 | 0 | 64 | 39.8% |
| ABSTAIN | 314 | 0 | 10 | 6 | 8 | 92.9% |
| CONFLICT | 0 | 2 | 31 | 0 | 13 | 67.4% |
| OUT_OF_SCOPE | 0 | 0 | 0 | 37 | 0 | 100.0% |

## 5. 파일

- 원본 응답: `prompts_test_v1/try1/results/raw/local-win_qwen3-4b_t0_nothink_fixed_n100_v4_t1_20261007_PI-CE-UI-AR-AD-SR-HR-EC-CF/generation.jsonl`
- 채점 결과·통합 CSV: `prompts_test_v1/try1/results/raw/scored/local-win_qwen3-4b_t0_nothink_fixed_n100_v4_t1_20261007_PI-CE-UI-AR-AD-SR-HR-EC-CF/` (review.csv)
