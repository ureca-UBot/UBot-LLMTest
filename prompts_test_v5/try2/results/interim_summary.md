# prompts_test_v5 · try2 — 중간 정리 (2026-10-14)

> 대상 `qwen3:4b-instruct` Q4_K_M · 이 PC(Ollama 0.40.2) · 데이터 `test_set4r` · 11항목(EC·RT·PS 제외) × 100. 기준 `v4_base`와 새 안 `v5_i2`를 같은 배치 `pv5-try2`에서 생성해 짝 비교한다. 계획·변경 문장은 [SETUP](../../SETUP.md), 원인 분석은 [failure_analysis](summary/failure_analysis.md).

## 0. 진행 상황

| 단계 | 상태 | 비고 |
|---|---|---|
| 생성 `v4_base` · `v5_i2` | ✅ 각 1,100/1,100 | 오류 0 (2026-10-12) |
| 결정론 채점 · run 비교 | ✅ | [run_comparison](summary/run_comparison.md) |
| LLM Judge 정확도 | ✅ 2,200/2,200 | 10-13 ChatGPT 사용 한도로 2,020건에서 중단 → 10-14 남은 181건 이어서 판정 |
| LLM Judge 안전성 (AD) | ✅ 200/200 | 10-14 |
| 보고서 | ✅ | [Judge 보고서](llm_judge/pv5-try2_report.md) · [짝 비교](llm_judge/pv5-try2_variant_compare.md) |

Codex CLI 경로는 앱 업데이트로 바뀐다(10-14: `C:/Users/pc/AppData/Local/OpenAI/Codex/bin/2e5e00daee91c61d/codex.exe`). 10-13 밤 이어 돌리기는 판정 없이 잠금 파일만 남기고 끝나서, 잠금을 지우고 다시 돌렸다.

## 1. 핵심 결과 (같은 문항 1,100쌍)

| 지표 | v4_base → v5_i2 | 판단 |
|---|---|---|
| **정답** | 825 → **662** (75.0% → 60.2%) · 정답→오답 237 · 오답→정답 74 · p<0.001 | ❌ 크게 떨어졌다 |
| 정답+근거+상태 | 67.9% → 49.5% | ❌ |
| 환각 응답 | 244 → **150** (22.2% → 13.6%) | ✅ |
| 되묻기 | 144 → **1** | ✅ |
| 본문 FAQ ID 노출 | 222 → **62** | ✅ |
| 누락만으로 오답 | 53 → **200** | ❌ 정답 하락의 주원인 |
| 답변 길이 중앙값 | 192 → 68자(7항목 기준) | 50자 제한 |
| AD 안전성 | SAFE 55 → 59 · **UNSAFE 8 → 4** · 과잉 거부 0 → 0 | ✅ |

## 2. 항목별

| 항목 | 정답 전→후 | 정답→오답 / 오답→정답 (p) | 환각 전→후 |
|---|---|---|---|
| NC | 82 → 66 | 21 / 5 (0.002) | 22 → 16 |
| MC | 90 → **43** | 48 / 1 (<0.001) | 7 → 8 |
| UI | 60 → 46 | 22 / 8 (0.016) | 24 → 22 |
| CE | 68 → 64 | 16 / 12 (0.57) | 24 → 3 |
| PI | 74 → 50 | 33 / 9 (<0.001) | 27 → 12 |
| SR | 93 → 89 | 6 / 2 (0.29) | 28 → 13 |
| HR | 94 → 87 | 10 / 3 (0.092) | 15 → 8 |
| CF | 37 → 27 | 21 / 11 (0.11) | 34 → 44 |
| MT | 83 → **55** | 31 / 3 (<0.001) | 15 → 6 |
| AD | 85 → 80 | 12 / 7 (0.36) | 26 → 6 |
| AR | 59 → 55 | 17 / 13 (0.59) | 22 → 12 |

## 3. 해석

1. **50자 제한과 "두 부분으로만" 답변 틀이 정답을 깎았다.** 정답→오답 237건 중 212건에 필수 사실 누락이 있다. 조건·단서·계산 결과·근거 수치를 버렸다(MC·MT·PI가 가장 크게 떨어짐). 자세한 사례는 failure_analysis 2절.
2. **꼬리 문장·되묻기·ID 노출은 확실히 줄었다.** 환각 244 → 150, 되묻기 144 → 1, ID 노출 222 → 62, AD UNSAFE 8 → 4.
3. **CF는 환각이 오히려 늘었다**(34 → 44). 짧게 쓰면서 충돌을 밝히지 않고 한쪽 값으로 확정했다(failure_analysis 4-1절).
4. 10-14에 추가된 AR·AD도 같은 방향이다(AR 59 → 55, AD 85 → 80, 둘 다 유의하지 않음).

## 4. 다음

- 50자 제한을 지우고 조건 보존 문장을 더한 `v5_i3` → [prompts_test_v6](../../../prompts_test_v6/try1/results/interim_summary.md). 개선(환각·되묻기·ID 노출)은 유지하면서 누락만 되돌리는지 본다.

## 5. 파일

| 파일 | 내용 |
|---|---|
| [llm_judge/pv5-try2_report.md](llm_judge/pv5-try2_report.md) | Judge 보고서(두 안) |
| [llm_judge/pv5-try2_variant_compare.md](llm_judge/pv5-try2_variant_compare.md) | v4_base ↔ v5_i2 짝 비교 · 안전성 |
| [summary/failure_analysis.md](summary/failure_analysis.md) | 오답 원인 · 데이터 변경(test_set4r) 효과 |
| [summary/run_comparison.md](summary/run_comparison.md) | 결정론 지표 비교 |
| `llm_judge/runs/pv5-try2/` | Judge 호출 로그 · 이어 판정 로그(`judge_run_resume.log`, `judge_run_resume2.log`) |
