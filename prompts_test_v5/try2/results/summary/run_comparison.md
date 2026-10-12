# run 비교 — prompts_test_v5/try2

> 자동 생성(`scripts/docgen/compare_runs.js`) — 손으로 고치지 마세요. 전체 지표는 독립 표본(반복 항목 제외) 기준, 반복 항목은 별도 열.
> 생성 2026-10-12T08:23:48.600Z · LLM Judge 배치: 없음

## t0_nothink · fixed · 항목당 100건 · v4_base

### LLM Judge

아직 채점하지 않았다.

### 결과론적 지표 · 계측

| 모델 | 기대 상태 일치 | 부재 F1 | 근거 채택률 | 근거 정밀도 | 정답 유사도 | 키워드 | NLI 지지율* | 표현 규칙 | 포맷 | 반복 일관성 | 타임아웃 | 평균 지연 | P95 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| qwen3:4b-instruct [PI,CE,UI,AR,CF,SR,HR,AD,NC,MC,MT] | 85.6% | 0.819 | 94.7% | 98.5% | N/A | N/A | N/A | 72.0 | 100.0% | N/A | 0 | 2.04s | 3.57s |

\* NLI 지지율은 참고값이다. 환각 판단은 LLM Judge 환각률을 쓴다.

### 항목별 — 기대 상태 일치 / 정답 유사도 (Judge가 있으면 내용 정확도 추가)

| 항목 | qwen3:4b-instruct [PI,CE,UI,AR,CF,SR,HR,AD,NC,MC,MT] |
|---|---|
| NC 유사 FAQ 구분·노이즈 | 98.0% / N/A |
| MC 다중 FAQ 조합 | 100.0% / N/A |
| UI 사용자 정보 + FAQ | 82.0% / N/A |
| CE 조건·예외·경계값 | 93.0% / N/A |
| PI 부분 정보 | 83.0% / N/A |
| SR 유사하지만 답 없음 | 82.0% / N/A |
| HR 무관 FAQ | 91.0% / N/A |
| CF FAQ 충돌·시행일 | 63.0% / N/A |
| MT 멀티턴 대화 | 97.0% / N/A |
| AD 적대적 입력·범위 밖 | 96.0% / N/A |
| AR API 결과 답변 | 57.0% / N/A |

### 세부 보고서

- [qwen3:4b-instruct [PI,CE,UI,AR,CF,SR,HR,AD,NC,MC,MT]](../report/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_20261012_PI-CE-UI-AR-CF-SR-HR-AD-NC-MC-MT_summary.md)

## t0_nothink · fixed · 항목당 100건 · v5_i2

### LLM Judge

아직 채점하지 않았다.

### 결과론적 지표 · 계측

| 모델 | 기대 상태 일치 | 부재 F1 | 근거 채택률 | 근거 정밀도 | 정답 유사도 | 키워드 | NLI 지지율* | 표현 규칙 | 포맷 | 반복 일관성 | 타임아웃 | 평균 지연 | P95 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| qwen3:4b-instruct [PI,CE,UI,AR,CF,SR,HR,AD,NC,MC,MT] | 84.5% | 0.848 | 94.7% | 98.7% | N/A | N/A | N/A | 82.1 | 100.0% | N/A | 0 | 1.06s | 1.71s |

\* NLI 지지율은 참고값이다. 환각 판단은 LLM Judge 환각률을 쓴다.

### 항목별 — 기대 상태 일치 / 정답 유사도 (Judge가 있으면 내용 정확도 추가)

| 항목 | qwen3:4b-instruct [PI,CE,UI,AR,CF,SR,HR,AD,NC,MC,MT] |
|---|---|
| NC 유사 FAQ 구분·노이즈 | 99.0% / N/A |
| MC 다중 FAQ 조합 | 100.0% / N/A |
| UI 사용자 정보 + FAQ | 79.0% / N/A |
| CE 조건·예외·경계값 | 77.0% / N/A |
| PI 부분 정보 | 85.0% / N/A |
| SR 유사하지만 답 없음 | 90.0% / N/A |
| HR 무관 FAQ | 89.0% / N/A |
| CF FAQ 충돌·시행일 | 57.0% / N/A |
| MT 멀티턴 대화 | 98.0% / N/A |
| AD 적대적 입력·범위 밖 | 92.0% / N/A |
| AR API 결과 답변 | 64.0% / N/A |

### 세부 보고서

- [qwen3:4b-instruct [PI,CE,UI,AR,CF,SR,HR,AD,NC,MC,MT]](../report/local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i2_20261012_PI-CE-UI-AR-CF-SR-HR-AD-NC-MC-MT_summary.md)

