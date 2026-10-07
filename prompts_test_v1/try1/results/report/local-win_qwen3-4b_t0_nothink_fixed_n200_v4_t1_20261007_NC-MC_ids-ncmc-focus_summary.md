# run 요약 — local-win_qwen3-4b_t0_nothink_fixed_n200_v4_t1_20261007_NC-MC_ids-ncmc-focus

> 자동 생성 문서(`scripts/docgen/build_run_report.js`) — 손으로 고치지 마세요.
> 생성 2026-10-07T00:56:57.566Z · prompts_test_v1/try1

| 항목 | 값 |
|---|---|
| 모델 | `qwen3:4b` |
| 조건 | t0_nothink {"temperature":0,"seed":null,"think":false,"format":{"type":"object","properties":{"evidence_ids":{"type":"array","items":{"type":"string"}},"status":{"type":"string","enum":["ANSWER","PARTIAL","ABSTAIN","CONFLICT","OUT_OF_SCOPE"]},"answer":{"type":"string"}},"required":["evidence_ids","status","answer"]}} |
| 컨텍스트 방식 | fixed |
| 프롬프트 | v4_t1 |
| 데이터 | test_set4 · 항목당 200건 · 항목 NC,MC · 200행 |
| 환경 | local-win |

## 1. LLM Judge

아직 채점하지 않았다. `scripts/judge_*.js` 단계(외부 전송 승인 필요) 후 이 보고서를 다시 만든다.

## 2. 결과론적 지표 · 계측 (독립 표본, 반복 항목 제외)

| 지표 | 값 |
|---|---|
| 기대 상태 일치 | 89.0% (200행) |
| FAQ 부재 판단 P / R / F1 | 0.000 / N/A / N/A |
| 근거 채택률(정답 근거 문서만 인용) · 엄격(정답 근거 문서 전부 인용) · 정확 인용 | 81.0% · 85.0% · 79.5% (대상 200행) |
| 근거 인용 정밀도 · 정답 문서 재현율 | 92.6% · 87.0% |
| 채택 분류 EXACT / WITH_EXTRA / PARTIAL / WRONG / NONE | 159 / 11 / 8 / 5 / 17 |
| Context에 없는 ID 인용 비율 | 0.0% |
| 사용자 정보/API·대화 이력 꼬리표 인용(채택 판정에서 제외) | 0건 (0.0%) |
| 답했는데 근거 미기재(답·부분 답·충돌 라벨 + 빈 evidence_ids, AR 제외) | 16건 (8.0%) |
| 정답 유사도 평균(×100) · 중앙값 | 89.4 · 91.8 |
| 키워드 포함률 평균 | 87.1% |
| NLI 지지율 평균(참고) | 78.0% (측정 199행) |
| 미확인 숫자 포함 비율(참고) | 0.0% |
| 표현 규칙 점수 · 실격 비율 | 78.8 · 13.5% |
| 포맷 준수 | 100.0% (생성 오류 0건) |
| 키 순서 준수(evidence_ids → status → answer) | 100.0% · evidence_ids>status>answer 200 |
| 타임아웃(60s 초과 = 오류) | 0건 (0.0%) |
| 지연 평균 / P50 / P95 (응답 받은 행) | 1.65s / 1.62s / 2.51s |
| TPS 평균 | 78.0 |

## 3. 항목별 결과론적 지표

| 항목 | 행 | 기대 상태 일치 | 근거 채택률 | 정답 유사도 | 키워드 | NLI 지지율 | 표현 규칙 | 포맷 | 지연 평균 | P95 |
|---|---|---|---|---|---|---|---|---|---|---|
| NC 유사 FAQ 구분·노이즈 | 100 | 81.0% | 69.0% | 85.5 | 87.2% | 77.3% | 74.0 | 100.0% | 1.45s | 2.30s |
| MC 다중 FAQ 조합 | 100 | 97.0% | 93.0% | 93.3 | 86.9% | 78.6% | 83.7 | 100.0% | 1.84s | 2.68s |

## 4. 상태 혼동 행렬 (독립 표본, 행=기대 · 열=응답)

| 기대 \ 응답 | ABSTAIN | ANSWER | PARTIAL | 재현율 |
|---|---|---|---|---|
| ANSWER | 1 | 178 | 21 | 89.0% |

## 5. 파일

- 원본 응답: `prompts_test_v1/try1/results/raw/local-win_qwen3-4b_t0_nothink_fixed_n200_v4_t1_20261007_NC-MC_ids-ncmc-focus/generation.jsonl`
- 채점 결과·통합 CSV: `prompts_test_v1/try1/results/raw/scored/local-win_qwen3-4b_t0_nothink_fixed_n200_v4_t1_20261007_NC-MC_ids-ncmc-focus/` (review.csv)
