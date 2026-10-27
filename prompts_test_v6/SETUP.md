# prompts_test_v6 — 프롬프트 튜닝 6차(Instruct 3차) · 테스트 항목 · 실행 순서

prompts_test_v5 try2(배치 `pv5-try2`)에서 `v5_i2`는 환각·되묻기·FAQ ID 노출을 줄였지만 정답이 크게 떨어졌다(Judge 919쌍, 696 → 547). 정답→오답 207건 중 184건이 필수 사실 누락이었고, 답을 줄이면서 조건·단서·계산 결과를 버렸다. 6차는 `v5_i2`에서 **50자 제한을 지우고 조건 보존 문장 하나를 더한** `v5_i3`를 잰다. 데이터·모델·생성 환경은 prompts_test_v5 try2와 같다(`test.config.js`가 v5 설정을 가져온다). 실행할 때 `--test prompts_test_v6`를 준다.

## 1. 목표

- 대상: `qwen3:4b-instruct` Q4_K_M(digest `0edcdef34593`), temperature 0, 이 PC(RTX 4060 Ti, Ollama 0.40.2), 데이터 `test_set4r`.
- **새 안 `v5_i3`만 생성·Judge한다.** 기준선은 같은 PC·같은 데이터로 만든 pv5-try2의 `v4_base`·`v5_i2`를 그대로 쓴다(`--base-from prompts_test_v5/try2/pv5-try2`).
- 확인할 것:
  - 필수 사실 누락이 `v5_i2`보다 줄어드는지(MC·MT·PI·NC·UI·CE).
  - `v5_i2`에서 얻은 개선이 유지되는지: 환각(꼬리 문장), 되묻기, 본문 FAQ ID 노출. SR·CE의 환각이 v4_base 수준으로 돌아가지 않는지.

## 2. 프롬프트 안 (`prompts/chatbot/variants.json`)

| 안 | 구성 |
|---|---|
| `v4_base` (기준, pv5-try2) | base · status_rules · output_order |
| `v5_i2` (기준, pv5-try2) | base_i2 · status_rules_i2 · output_order_t1b |
| `v5_i3` | **base_i3** · status_rules_i2 · output_order_t1b |

`base_i3`가 `base_i2`와 다른 점(파일 머리 주석에 이유):
- 삭제: answer 작성 방식 4 "질문 하나에 대한 답은 50자 이내로 씁니다."
- 추가: answer 작성 방식 1 끝에 "FAQ의 조건·단서(약정 기준, 지원되는 경우 등)와 계산 결과는 줄이지 않습니다."
- 유지: "answer는 이 두 부분으로만 씁니다", 되묻기 금지, "사용자는 자료를 볼 수 없다", 일반 지식·추측 보충 금지.

## 3. 테스트 항목 (try1)

PI · CE · UI · SR · NC · MC · MT, 항목당 100건 = **700건**. Judge 비용을 줄이려고 이번 변경과 관계없는 항목을 뺐다.

| 구분 | 항목 | 이유 |
|---|---|---|
| 변경이 직접 겨냥 | MC · MT · PI · NC · UI · CE | pv5-try2에서 누락으로 떨어진 항목(정답→오답 48 · 31 · 33 · 21 · 22 · 16) |
| 부작용 감시 | SR | 50자를 빼면 꼬리 문장이 돌아오는지(v4_base → v5_i2 환각 28 → 13) |
| 제외 | CF · AR · HR · AD(+안전성) | CF·AR 오답은 날짜 비교·충돌 처리·표 필터링 실패로 이번 변경과 무관하다. HR은 대부분 ABSTAIN이라 영향이 작다. AD는 안전 문장을 바꾸지 않았다. |

건너뛰는 결정론 단계는 prompts_test_v5와 같다(정답 유사도 · NLI 근거 · 반복 일관성).

## 4. 실행 순서

```powershell
$T = @('--test', 'prompts_test_v6', '--try', 'try1')
$I3 = 'local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i3_20261013_PI-CE-UI-SR-NC-MC-MT'

# 1. 생성 → 결정론 채점 → CSV·run 보고서 (700건)
node scripts/run/run_item.js qwen3:4b-instruct 'PI,CE,UI,SR,NC,MC,MT' --size 100 @T --variant v5_i3

# 2. 배치 매니페스트 · Judge 입력 준비(외부 호출 없음)
node scripts/judge/build_batch_manifest.js --batch pv6-try1 --size 100 @T --runs $I3
node scripts/judge/judge_prepare.js --batch pv6-try1 @T

# 3. LLM Judge (외부 전송). 이 PC는 PATH에 codex가 없다 — Codex 앱 CLI를 지정한다(해시 폴더는 앱 업데이트 때 바뀐다)
$env:LLM_JUDGE_CODEX_BIN = 'C:\Users\pc\AppData\Local\OpenAI\Codex\bin\2e5e00daee91c61d\codex.exe'
node scripts/judge/judge_run.js --batch pv6-try1 @T --confirm-external --concurrency 8
node scripts/docgen/judge_report.js --batch pv6-try1 @T

# 4. 짝 비교 — 기준 안마다 한 번씩(같은 파일에 쓰므로 실행할 때마다 _vs_<기준안>으로 이름을 바꾼다)
node scripts/docgen/compare_variants.js --batch pv6-try1 @T --base v5_i2 --base-from prompts_test_v5/try2/pv5-try2
node scripts/docgen/compare_variants.js --batch pv6-try1 @T --base v4_base --base-from prompts_test_v5/try2/pv5-try2
```

2026-10-14 전 단계 완료(정확도 699/699, UI-0093은 생성 타임아웃). 결과는 [중간 정리](try1/results/interim_summary.md). Judge를 두 배치에서 동시에 돌리면 판정 파일 열기 오류가 날 수 있으니 하나씩 돌린다(10-13 밤 pv5-try2와 같이 돌렸다가 NC-0134가 `accuracy.schema.json` 열기 실패).

## 5. 알려진 한계

- 두 곳을 함께 바꿨다. 누락이 회복돼도 50자 삭제와 조건 보존 문장 중 어느 쪽 덕분인지는 가를 수 없다. "두 부분으로만"은 그대로 두었으므로, 누락이 남으면 그 문장이 원인 후보다.
- 조건 보존 문장의 괄호 예시가 그 표현을 늘릴 수 있다(t1b에서 따옴표 예시가 해당 표현을 늘린 적이 있다).
- 키 순서: Ollama는 이 모델에서 스키마 키를 알파벳순(answer → evidence_ids → status)으로 강제한다. 프롬프트의 순서 지시와 무관하게 답이 먼저 나온다(2026-10-13 확인 — 스키마 순서를 바꿔도 같고, `a_`·`b_`·`c_` 접두어를 붙이면 그 순서를 따른다).
- 항목당 100건이라 100문항당 ±2건 정도의 판정 노이즈보다 작은 변화는 판단하지 않는다.
