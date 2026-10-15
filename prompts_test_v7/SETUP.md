# prompts_test_v7 — 프롬프트 튜닝 7차(Instruct 4차) · 테스트 항목 · 실행 순서

prompts_test_v6(`v5_i3`, 배치 `pv6-try1`)은 누락을 되돌려 정답을 v4_base 수준(551/699)으로 회복했지만, "답할 수 없음" 문장이 233(v4_base) · 121(v5_i2) → 392로 늘었다. 그중 193건이 이유·추측을 붙였고, 105건은 그런 문장이 두 개 이상, 기대 ANSWER 45건에도 붙었다(오답 18, 모두 모순). 원인은 같은 지시가 base·status_rules·output_order 네 군데에 흩어져 있고, output_order_t1b의 "그다음 확인할 수 없는 부분을 밝힙니다"에 조건이 없다는 점이었다([v6 원인 분석](../prompts_test_v6/try1/results/summary/failure_analysis.md)). 7차는 이 지시를 base 작성 방식 2번 한 곳으로 모은 `v5_i4`를 잰다. 실행할 때 `--test prompts_test_v7`를 준다.

## 1. 목표

- 대상: `qwen3:4b-instruct` Q4_K_M(digest `0edcdef34593`), temperature 0, 이 PC(RTX 4060 Ti), 데이터 `test_set4r`.
- **환경 차이:** Ollama가 0.40.3으로 올라갔다(기준선 pv5-try2·pv6-try1은 0.40.2). 모델 digest는 같다.
- **새 안 `v5_i4`만 생성·Judge한다.** 기준선은 pv6-try1의 `v5_i3`와 pv5-try2의 `v4_base`·`v5_i2`(`--base-from`).
- 확인할 것:
  - "답할 수 없음" 문장 수, 그중 이유를 붙인 문장, 두 개 이상인 답, 기대 ANSWER에 붙은 경우가 `v5_i3`보다 줄어드는지.
  - CE·UI 모순이 줄어드는지(CE 정답 v4_base 68 → v5_i3 57).
  - v5_i3의 누락 회복(MC·MT·PI·NC)과 되묻기 감소가 유지되는지.
  - status 규칙 변경이 HR(ABSTAIN)·AR(PARTIAL)을 흔들지 않는지.

## 2. 프롬프트 안 (`prompts/chatbot/variants.json`)

| 안 | 구성 |
|---|---|
| `v4_base` (기준, pv5-try2) | base · status_rules · output_order |
| `v5_i2` (기준, pv5-try2) | base_i2 · status_rules_i2 · output_order_t1b |
| `v5_i3` (기준, pv6-try1) | base_i3 · status_rules_i2 · output_order_t1b |
| `v5_i4` | **base_i4 · status_rules_i4 · output_order_i4** |

`v5_i3`와 다른 점(각 파일 머리 주석에 이유):
- `base_i4` answer 작성 방식
  1. "결론부터", "계산 결과는 줄이지 않습니다" → "계산한 최종 값은 빠뜨리지 않습니다".
  2. "근거로 답할 수 없는 부분이 질문에 있을 때만, answer 맨 끝에 그 대상만 짧게 한 문장으로 답할 수 없다고 밝힙니다. 이유·추측·다른 안내는 붙이지 않습니다. 여러 개면 한 문장에 함께. 계산·비교로 구할 수 있는 답은 답할 수 있는 부분. 모두 답했으면 쓰지 않음."
  3. "answer는 1의 답과 2의 문장으로만. 2의 문장 뒤에는 아무것도 쓰지 않고, 되묻지 않음."
- `status_rules_i4`: PARTIAL·ABSTAIN 정의에서 "answer에서 ~를 밝힌다" 삭제, 주의 3에서 "확정할 수 없는 부분을 밝히되" 삭제.
- `output_order_i4`: "answer에는 … 먼저 빠짐없이 직접 쓰고, 그다음 확인할 수 없는 부분을 밝힙니다" → "answer는 answer 작성 방식을 따릅니다".

## 3. 스모크 (`smoke/`, 2026-10-14, Judge 없음)

`smoke/ids.txt` 22건(v6 분석에서 다룬 문항)을 세 번 돌렸다. 결과는 `smoke/results/raw/`의 `_s1` · `_s2` · 접미사 없음(3차).

| 22건 | v5_i3 | 1차 `"[그 부분]은 답할 수 없습니다."` 틀 | 2차 `"~은 …"` + 예시 | **3차 조건만 (채택)** |
|---|---|---|---|---|
| 불가 문장 있는 답 | 15 | 8 | — | 9 |
| 불가 문장 2개 이상 | 12 | 7 | — | 1 |
| 불가 문장에 이유 | 11 | 2 | — | 2 |
| 틀 문장 사용 | — | 5 (대괄호를 글자 그대로 3) | 3 (예시 "처리 기간"을 엉뚱하게 베낌 2) | — |
| 평균 길이 | 221 | 167 | 155 | 152 |

- 문장 형식을 문구로 강제하면 4B 모델이 대괄호·예시를 베끼고, 원래 쓰던 "제공된 자료에 없습니다"는 그대로 둔 채 틀 문장을 덧붙였다. 그래서 틀을 빼고 조건만 남겼다.
- 기대 ANSWER에 불가 문장이 붙지 않는 효과는 세 번 모두 있었다(1·2차 13/13, 3차 12/13 — CE-0058이 PARTIAL로 돌아감).
- 남은 문제: PI-0093 "고객센터에 문의" 세 번 모두, 과정 서술("다만 …" 되풀이, "따라서", "FAQ-n에 따르면")은 그대로(이번 변경 대상 아님).

## 4. 테스트 항목 (try1)

PI · CE · UI · AR · SR · HR · NC · MC · MT, 항목당 100건 = **900건**. 기준선이 모두 100건이라 짝 비교가 된다.

| 구분 | 항목 | 이유 |
|---|---|---|
| v6와 같은 범위 | PI · CE · UI · SR · NC · MC · MT | 불가 문장 덧붙이기·CE 모순, 누락 회복 유지 |
| status 규칙 변경 감시 | HR · AR | ABSTAIN·PARTIAL 정의에서 answer 지시를 지웠다. v5_i3 기준선은 없고 v4_base·v5_i2와만 비교 |
| 제외 | CF · AD(+안전성) · EC | CF 오답은 날짜 비교·충돌 처리, AD는 안전 문장 변경 없음, EC는 전 테스트 제외 |

건너뛰는 결정론 단계는 prompts_test_v5와 같다(정답 유사도 · NLI 근거 · 반복 일관성).

## 5. 실행 순서

```powershell
$T = @('--test', 'prompts_test_v7', '--try', 'try1')
$I4 = 'local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4_20261014_PI-CE-UI-AR-SR-HR-NC-MC-MT'

# 1. 생성 → 결정론 채점 → CSV·run 보고서 (900건)
node scripts/run/run_item.js qwen3:4b-instruct 'PI,CE,UI,AR,SR,HR,NC,MC,MT' --size 100 @T --variant v5_i4

# 2. 배치 매니페스트 · Judge 입력 준비(외부 호출 없음)
node scripts/judge/build_batch_manifest.js --batch pv7-try1 --size 100 @T --runs $I4
node scripts/judge/judge_prepare.js --batch pv7-try1 @T

# 3. LLM Judge (외부 전송). 이 PC는 PATH에 codex가 없다 — Codex 앱 CLI를 지정한다(해시 폴더는 앱 업데이트 때 바뀐다)
$env:LLM_JUDGE_CODEX_BIN = 'C:\Users\pc\AppData\Local\OpenAI\Codex\bin\2e5e00daee91c61d\codex.exe'
node scripts/judge/judge_run.js --batch pv7-try1 @T --confirm-external --concurrency 8
node scripts/docgen/judge_report.js --batch pv7-try1 @T

# 4. 짝 비교 — 기준 안마다 한 번씩(같은 파일에 쓰므로 실행할 때마다 _vs_<기준안>으로 이름을 바꾼다)
node scripts/docgen/compare_variants.js --batch pv7-try1 @T --base v5_i3 --base-from prompts_test_v6/try1/pv6-try1
node scripts/docgen/compare_variants.js --batch pv7-try1 @T --base v5_i2 --base-from prompts_test_v5/try2/pv5-try2
node scripts/docgen/compare_variants.js --batch pv7-try1 @T --base v4_base --base-from prompts_test_v5/try2/pv5-try2
```

Judge는 다른 배치와 동시에 돌리지 않는다(판정 파일 열기 오류).

## 6. 결과 (try1, Judge 900/900, 2026-10-14)

Judge는 Codex 사용량 한도로 782/900에서 멈췄다가 이어서 끝냈다(`judge_try1.log` → `judge_try1_resume.log`). 보고서 `try1/results/llm_judge/pv7-try1_report.md`, 짝 비교 `pv7-try1_variant_compare_vs_{v5_i3,v5_i2,v4_base}.md`. 기준선은 Ollama 0.40.2라 환경 차이가 섞인다.

| 기준 → v5_i4 | n | 정답 | p | 환각 | 되묻기 | FAQ ID 노출 |
|---|---|---|---|---|---|---|
| v5_i3 (pv6-try1, HR·AR 없음) | 699 | 551 → 549 | 0.92 | 126 → 90 | 2 → 1 | 184 → 73 |
| v5_i2 (pv5-try2) | 900 | 555 → 698 | <0.001 | 100 → 122 | 1 → 1 | 17 → 77 |
| v4_base (pv5-try2) | 900 | 703 → 698 | 0.74 | 184 → 122 | 126 → 1 | 147 → 77 |

- 정답은 v4_base·v5_i3 수준을 지키면서, v5_i3에서 늘었던 환각(126 → 90)과 FAQ ID 노출(184 → 73)을 되돌렸다. 되묻기 감소(v5_i2 효과)도 유지.
- CE 57 → 66(v5_i3 대비, p=0.108) — v5_i3의 CE 모순 하락을 대부분 회복(v4_base 68).
- **HR 94 → 82(v4_base 대비, p=0.004)**, 87 → 82(v5_i2 대비). ABSTAIN 라벨 91 → 80 — status 규칙에서 ABSTAIN의 answer 지시를 지운 영향으로 보인다(4절 "status 규칙 변경 감시").
- AR 59 → 66(v4_base 대비), MC 90 → 86 · MT 91 → 86(v5_i3 대비)은 노이즈 범위 안팎.

## 7. 알려진 한계

- Ollama 버전이 기준선과 다르다(0.40.2 → 0.40.3). 같은 프롬프트로 버전 차이만 잰 적은 없다.
- 세 파일을 함께 바꿨지만, 모두 "답할 수 없는 부분을 쓰는 지시를 한 곳으로 모은다"는 하나의 변경이다. 작성 방식 1번의 문구("결론부터", "계산한 최종 값")도 함께 바뀌었다.
- 키 순서: Ollama가 이 모델에서 스키마 키를 알파벳순(answer → evidence_ids → status)으로 강제한다. status 규칙은 라벨을 정하는 순서로는 작동하지 않고, 내용이 답변 작성 지시로 읽힌다.
- 항목당 100건이라 100문항당 ±2건 정도의 판정 노이즈보다 작은 변화는 판단하지 않는다.
