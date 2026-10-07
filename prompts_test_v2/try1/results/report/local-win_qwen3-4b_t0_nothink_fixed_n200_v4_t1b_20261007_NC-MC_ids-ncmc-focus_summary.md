# run 요약 — local-win_qwen3-4b_t0_nothink_fixed_n200_v4_t1b_20261007_NC-MC_ids-ncmc-focus

> 자동 생성 문서(`scripts/docgen/build_run_report.js`) — 손으로 고치지 마세요.
> 생성 2026-10-07T04:40:04.370Z · prompts_test_v2/try1

| 항목 | 값 |
|---|---|
| 모델 | `qwen3:4b` |
| 조건 | t0_nothink {"temperature":0,"seed":null,"think":false,"format":{"type":"object","properties":{"evidence_ids":{"type":"array","items":{"type":"string"}},"status":{"type":"string","enum":["ANSWER","PARTIAL","ABSTAIN","CONFLICT","OUT_OF_SCOPE"]},"answer":{"type":"string"}},"required":["evidence_ids","status","answer"]}} |
| 컨텍스트 방식 | fixed |
| 프롬프트 | v4_t1b |
| 데이터 | test_set4 · 항목당 200건 · 항목 NC,MC · 200행 |
| 환경 | local-win |

## 1. LLM Judge

아직 채점하지 않았다. `scripts/judge_*.js` 단계(외부 전송 승인 필요) 후 이 보고서를 다시 만든다.

## 2. 결과론적 지표 · 계측 (독립 표본, 반복 항목 제외)

| 지표 | 값 |
|---|---|
| 기대 상태 일치 | 92.0% (200행) |
| FAQ 부재 판단 P / R / F1 | N/A / N/A / N/A |
| 근거 채택률(정답 근거 문서만 인용) · 엄격(정답 근거 문서 전부 인용) · 정확 인용 | 82.5% · 88.5% · 81.5% (대상 200행) |
| 근거 인용 정밀도 · 정답 문서 재현율 | 91.2% · 90.8% |
| 채택 분류 EXACT / WITH_EXTRA / PARTIAL / WRONG / NONE | 163 / 14 / 9 / 6 / 8 |
| Context에 없는 ID 인용 비율 | 0.0% |
| 사용자 정보/API·대화 이력 꼬리표 인용(채택 판정에서 제외) | 0건 (0.0%) |
| 답했는데 근거 미기재(답·부분 답·충돌 라벨 + 빈 evidence_ids, AR 제외) | 8건 (4.0%) |
| 정답 유사도 평균(×100) · 중앙값 | 89.9 · 92.7 |
| 키워드 포함률 평균 | 88.8% |
| NLI 지지율 평균(참고) | 78.3% (측정 200행) |
| 미확인 숫자 포함 비율(참고) | 0.0% |
| 표현 규칙 점수 · 실격 비율 | 84.1 · 8.0% |
| 포맷 준수 | 100.0% (생성 오류 0건) |
| 키 순서 준수(evidence_ids → status → answer) | 100.0% · evidence_ids>status>answer 200 |
| 타임아웃(60s 초과 = 오류) | 0건 (0.0%) |
| 지연 평균 / P50 / P95 (응답 받은 행) | 1.70s / 1.69s / 2.62s |
| TPS 평균 | 78.3 |

## 3. 항목별 결과론적 지표

| 항목 | 행 | 기대 상태 일치 | 근거 채택률 | 정답 유사도 | 키워드 | NLI 지지율 | 표현 규칙 | 포맷 | 지연 평균 | P95 |
|---|---|---|---|---|---|---|---|---|---|---|
| NC 유사 FAQ 구분·노이즈 | 100 | 86.0% | 74.0% | 85.8 | 87.0% | 78.0% | 77.7 | 100.0% | 1.51s | 2.54s |
| MC 다중 FAQ 조합 | 100 | 98.0% | 91.0% | 94.0 | 90.7% | 78.6% | 90.5 | 100.0% | 1.88s | 2.80s |

## 4. 상태 혼동 행렬 (독립 표본, 행=기대 · 열=응답)

| 기대 \ 응답 | ANSWER | PARTIAL | 재현율 |
|---|---|---|---|
| ANSWER | 184 | 16 | 92.0% |

## 5. 파일

- 원본 응답: `prompts_test_v2/try1/results/raw/local-win_qwen3-4b_t0_nothink_fixed_n200_v4_t1b_20261007_NC-MC_ids-ncmc-focus/generation.jsonl`
- 채점 결과·통합 CSV: `prompts_test_v2/try1/results/raw/scored/local-win_qwen3-4b_t0_nothink_fixed_n200_v4_t1b_20261007_NC-MC_ids-ncmc-focus/` (review.csv)
