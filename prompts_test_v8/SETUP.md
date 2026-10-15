# prompts_test_v8 — 출력 키 순서 고정(calc → evidence_ids → status → answer) 테스트 · 실행 순서

`qwen3:4b-instruct`는 Ollama가 JSON 키를 알파벳순(answer → evidence_ids → status)으로 내보내 스키마 순서를 무시한다(v5 try1 이후 전 실행). 그래서 지금까지 status 규칙과 출력 순서 지시("먼저 evidence_ids, 다음 status, 마지막 answer")는 순서대로 작동하지 않았고, status는 이미 쓴 answer에 나중에 붙는 라벨이었다(라벨과 본문 일치 약 92%). 이 테스트는 키 이름에 접두어를 붙여 순서를 강제한다. 처음 계획은 evidence_ids → status → answer였으나, 스모크(3절)에서 다섯 순서를 비교한 뒤 **본 테스트(try1)는 calc → evidence_ids → status → answer**로 바꿨다(2026-10-14). 실행할 때 `--test prompts_test_v8`를 준다.

## 1. 목표

- 대상: `qwen3:4b-instruct` Q4_K_M(digest `0edcdef34593`), temperature 0, 이 PC(RTX 4060 Ti, Ollama 0.40.3), 데이터 `test_set4r`.
- 안 두 개(같은 키 순서, 본문만 다름 — 3-7절):
  - `v5_i4ck` = `v5_i4` + `calc_i4.md`(옛 본문 — 순서 설명이 "evidence_ids, status, answer"로 남아 실제 순서와 어긋남).
  - `v5_i4ck2` = `base_i4o` · `status_rules_i4` · `output_order_i4ck`(새 본문 — 순서 설명을 calc → evidence_ids → status → answer에 맞춤).
- 기준선: prompts_test_v7 try1의 `v5_i4`(answer 먼저, 같은 PC·같은 Ollama 0.40.3, `--base-from prompts_test_v7/try1/pv7-try1`). 환경 차이가 없는 짝 비교다.
- 확인할 것:
  - status 정확도와 혼동(기대→출력). 특히 계산·비교 문항(CE·UI)의 "확정할 수 없다" 덧붙이기, SR의 ABSTAIN→PARTIAL, HR의 OUT_OF_SCOPE 오분류.
  - 빈 evidence_ids가 늘어 ABSTAIN·보류가 늘어나는지(3-1·3-7절).
  - 정답·환각·누락·FAQ 번호 노출·답 길이.
  - 옛 본문과 새 본문의 차이(본문을 실제 순서에 맞춘 효과).

## 2. 구현 (`test.config.js`의 `output.keyNames`)

```js
output: {
  keyOrder: ['calc', 'evidence_ids', 'status', 'answer'],
  keyNames: { calc: 'a_calc', evidence_ids: 'b_evidence_ids', status: 'c_status', answer: 'd_answer' },
},
```

- 스모크 때(evidence_ids → status → answer, `v5_i4k`)는 `keyOrder: ['evidence_ids', 'status', 'answer']`, 키 `a_evidence_ids · b_status · c_answer`였다. 다른 순서의 스모크도 모두 `smoke/`에 모았다(3절) — 각 run의 키 순서는 `generation.jsonl`의 `gen_params.format`에 기록돼 있다.
- `lib/prompts.js` `outputSchema`가 스키마 키를 접두어 붙인 이름으로 만든다. 이 모델은 접두어를 붙이면 그 순서를 따른다(2026-10-13 확인, 스모크 22/22). calc는 출력 계약(필수 키)에 넣지 않았다 — `parsed.calc`로만 남는다.
- `lib/metrics.js` `checkFormatSuccess`가 파싱할 때 표준 키(evidence_ids · status · answer)로 되돌린다. `generation.jsonl`의 `parsed`는 표준 키이고, `raw_content`는 원문(접두어 키) 그대로다. 채점·Judge·보고서는 바꾸지 않았다.
- 키 순서 준수(`score_format_performance.js`)도 keyNames로 원문 키를 찾는다.
- 옛 본문(`v5_i4ck`)은 여전히 "evidence_ids, status, answer 키만 사용합니다"·"먼저 evidence_ids"라고 쓴다. 새 본문(`v5_i4ck2`)은 키 목록·순서를 `output_order_i4ck` 한 곳에서 실제 순서대로 말한다(3-7절). 키 이름의 접두어(a_·b_…)는 어느 쪽도 프롬프트에 쓰지 않는다 — 생성 문법이 강제한다.
- **백엔드 적용 시:** UBot-BE가 이 순서를 쓰려면 같은 접두어 스키마로 요청하고 응답 키를 되돌려야 한다.

## 3. 스모크 — 키 순서 · 계산 칸 (2026-10-14, Judge 없음)

prompts_test_v7 스모크와 같은 22건(`smoke/ids.txt` — v6 분석에서 다룬 계산·비교·보류 문항이라 **전체를 대표하지 않는다**). 프롬프트는 모두 v5_i4(base_i4 · status_rules_i4 · output_order_i4) 기반이고, 키 순서와 계산 칸만 다르다(3-7절의 `v5_i4ck2`·`v5_i4s2`만 순서 설명 문장도 다름).

설정(`output.keyOrder`)이 폴더 단위라 처음에는 순서마다 폴더를 따로 두고 돌렸다(`prompts_test_v8_status`·`v8_evcalc`·`v9`·`v9_status`, 각각 이 파일을 base로 `output`만 덮어씀). 2026-10-14 결과를 모두 **`smoke/`** 한 곳으로 옮기고 그 폴더들은 지웠다 — run 폴더 이름의 안 이름으로 구분하고, `run_info.json`의 `test` 값은 옛 폴더 이름 그대로다. 다시 돌리려면 `test.config.js`의 `output`을 아래 순서로 바꾸고 `--try smoke --ids-file prompts_test_v8/smoke/ids.txt --variant <안>`으로 실행한다(키 이름은 순서대로 a_·b_·c_·d_ 접두어). 실행 로그 두 개는 `smoke/logs/`.

| 순서 (`keyOrder`) | 안 (`smoke/results/raw/…_<안>_…`) | 계산 칸 |
|---|---|---|
| answer → evidence_ids → status (기준) | prompts_test_v7 try1 · `v5_i4` | 없음 |
| evidence_ids → status → answer | `v5_i4k` | 없음 |
| status → evidence_ids → answer | `v5_i4s` · `v5_i4s2`(3-7) | 없음 |
| calc → evidence_ids → status → answer | `v5_i4ck` · `v5_i4ck2`(3-7) | `calc_i4.md` (`v5_i4ck2`는 output_order_i4ck에 합침) |
| evidence_ids → calc → status → answer | `v5_i4ek` | `calc_i4.md` |
| calc → status → evidence_ids → answer | `v5_i4cs` (`_timeout` = 첫 실행) | `calc_i4.md` |

계산 칸(`prompts/chatbot/calc_i4.md`): 계산하거나 숫자·날짜·횟수를 기준과 비교해야 하면 calc에 식과 결과를 먼저 쓰고(예: 50 - 12 = 38, 12개 ≥ 10개 → 기준 충족), 필요 없으면 빈 문자열. calc는 사용자에게 보이지 않고, answer에는 결과만 쓴다. calc는 출력 계약(필수 키)에 넣지 않았다 — `parsed.calc`로만 남는다.

키 순서 준수는 응답한 행 모두 지정 순서였고 포맷 오류는 없었다.

| 순서 | 응답 | status 맞음 | 틀린 경우(기대→출력) | 빈 evidence | 불가 문장 2+ | FAQ 번호 | "따라서" 류 | calc 채움 | 평균 길이 |
|---|---|---|---|---|---|---|---|---|---|
| answer 먼저 (기준) | 22 | 19 | ANS→PAR 1, ABS→PAR 2 | 1 | 1 | 3 | 10 | — | 147자 |
| evidence → status → answer | 22 | 16 | ANS→PAR 4, ANS→ABS 2 | 12 | 4 | 5 | 8 | — | 138자 |
| status → evidence → answer | 22 | 16 | ANS→PAR 4, ABS→PAR 2 | 1 | 1 | 2 | 5 | — | 129자 |
| **calc → evidence → status → answer** | 22 | **20** | ANS→PAR 1, PAR→ABS 1 | 6 | 1 | **1** | **3** | 6 | **113자** |
| evidence → calc → status → answer | 22 | **10** | ANS→PAR 8, PAR→ABS 3, ANS→ABS 1 | **19** | 2 | 4 | 5 | 6 | 145자 |
| calc → status → evidence → answer | **9** (타임아웃 13) | 7/9 | ABS→PAR 2 | 3 | 4 | 4 | 3 | 3 | 156자 |

"불가 문장"·"따라서 류"·FAQ 번호는 정규식으로 센 근사치다.

### 3-1. evidence 먼저 — 빈 근거 → 보류 연쇄

근거를 먼저 비우고(빈 배열) 그다음 PARTIAL·ABSTAIN을 고른 뒤 답을 보류했다. v4 qwen3:4b OFF의 "빈 evidence_ids → ABSTAIN → 보류 문장" 연쇄(v4 try1 tuning_target_decision)와 같은 모양이다.
- CE-0041: ANSWER → ABSTAIN, "5GB 남는다고 계산할 수 없습니다"(기준은 "5GB 남습니다"로 정답)
- UI-0067: → ABSTAIN, UI-0070·CE-0055·CE-0058·NC-0156: ANSWER → PARTIAL
- 좋아진 쪽: SR-0055·0057(기대 ABSTAIN)이 ABSTAIN이 되고 한 문장(42자)으로 끝났다. PI-0093의 "고객센터에 문의"가 처음으로 사라졌다.

### 3-2. status 먼저 — 라벨을 먼저 정하고 답을 휘게 함

빈 근거 문제는 없지만, 질문 겉모양으로 라벨을 먼저 정한 뒤 answer가 그 라벨을 정당화했다.
- CE-0041(→ PARTIAL): "남은 기본 한도는 5GB입니다. 그러나 … '기본 한도'인지 여부는 명시되어 있지 않습니다. 따라서 … 확정할 수 없습니다."
- UI-0070(→ PARTIAL): "30분간 잠금이 적용됩니다. 그러나 5회 기준에 도달했는지 확인할 수 없으므로…"(9회 오류인데 모순)
- SR-0055·0057은 여전히 PARTIAL.

### 3-3. calc → evidence → status → answer — 가장 좋음

계산을 status보다 먼저 끝내자 계산·비교 문항의 라벨과 답이 맞았고, 과정 서술이 calc 칸으로 옮겨 answer가 짧아졌다.

| 문항 | calc | answer |
|---|---|---|
| CE-0041 | `30 - 25 = 5` | "기본 한도는 5GB 남습니다." |
| UI-0067 | `5회 연속 오류 → 잠금 (30분), 현재 오류 횟수는 6회 → 5회 기준 초과, 따라서 30분 잠금 적용` | ANSWER, 30분 잠금(기준은 PARTIAL) |
| UI-0070 | `…9회로, 5회를 초과함. 따라서 30분 잠금 기준이 적용됨.` | ANSWER |
| SR-0055·0057 | (빈칸) | ABSTAIN, 한 문장 |

남은 문제:
- calc를 채운 문항은 6/22. CE-0058(22GB ≥ 20GB)·CE-0055·0053 같은 경계 비교는 calc가 비었고, CE-0058은 여전히 PARTIAL + "다만 … 설명하지 않습니다".
- CE-0076은 calc에 회선 수만 쓰고 4 × 8,800을 하지 않아 8,800원으로 틀렸다(정답 35,200원).
- UI-0035·0039는 식 대신 FAQ 문장을 옮겨 썼다.
- 빈 evidence 6(기준 1) — NC-0156·0180은 답이 맞는데 근거를 비웠고, PI-0082는 빈 근거로 ABSTAIN.

### 3-4. evidence → calc → status → answer — 가장 나쁨

근거를 맨 앞에서 정하면 22건 중 19건이 빈 배열이었고, 계산 칸이 중간에 있어도 빈 근거가 라벨을 끌어내렸다(status 10/22). calc 자체는 더 잘 채웠다(UI-0035 `19GB < 20GB → 데이터 잔여량 1GB`, UI-0039 `23GB > 20GB → 소진 조건 충족`, CE-0041 `30 - 25 = 5`). 하지만 CE-0041은 계산을 하고도 PARTIAL + "정확한 남은 한도를 확정할 수 없습니다"가 됐다. 근거를 먼저 고르는 순서가 이 모델에는 맞지 않는다는 3-1의 결론이 계산 칸으로도 바뀌지 않았다.

### 3-5. calc → status → evidence → answer — 반복 루프

22건 중 13건이 60초 타임아웃(재실행 15건 중 9건). 같은 순서로 연달아 보내 재현해 보니 answer 안에서 같은 문장을 끝없이 되풀이했다(MC-0004: 70초 동안 3,622토큰, "요금은 회선 수에 따라 달라지므로 … FAQ-862에 기재되어 있습니다" 반복). 같은 문항을 단독으로 보내면 정상 종료할 때도 있어 걸리는 문항이 실행마다 바뀐다. 원인은 모른다. 첫 실행 결과는 `smoke/results/raw/…_v5_i4cs_…_timeout/`, 중단한 재실행은 접미사 없는 `…_v5_i4cs_…` 폴더(15건)에 있다.

### 3-6. 정리

- 이 모델은 **근거를 먼저 고르면** 빈 배열 → 보류로 무너지고(3-1·3-4), **status를 먼저 정하면** 답이 라벨을 정당화한다(3-2).
- **계산을 먼저 끝내고 근거 → status → answer**로 가는 순서만 기준(answer 먼저)보다 나았다(3-3). 본 테스트 후보다.
- 본 테스트 전에 볼 것: 경계 비교(넘었는지·도달했는지)도 calc에 쓰게 할지, 빈 evidence 증가(1 → 6)가 근거 지표에 주는 영향.

### 3-7. 본문을 실제 순서에 맞춘 재스모크 (`v5_i4ck2` · `v5_i4s2`)

3-1~3-5의 스모크는 모두 `v5_i4` 본문 그대로였다. 그 본문은 키 순서를 "evidence_ids, status, answer 키만", "먼저 evidence_ids, 다음으로 status"라고 말하고(base_i4 마지막 문단 · output_order_i4), status 판정 기준은 "evidence_ids로 고른 문서"로 정한다(status_rules_i4 첫 줄). calc 먼저는 "evidence_ids … 키만"과 "맨 앞에는 calc 키도"가 어긋나고 calc 설명이 프롬프트 맨 끝에 있었으며, status 먼저는 아직 없는 evidence_ids로 status를 정하라는 본문이었다. 순서를 설명하는 문장만 실제 순서에 맞춘 새 파일을 만들었다(나머지 문장은 그대로, 각 파일 머리 주석에 이유).

| 안 | 구성 | 바꾼 것 |
|---|---|---|
| `v5_i4ck2` | base_i4o · status_rules_i4 · output_order_i4ck | base_i4o: "evidence_ids, status, answer 키만 사용합니다" 삭제. output_order_i4ck: output_order_i4 + calc_i4를 한 문단으로, 순서를 calc → evidence_ids → status → answer로 쓰고 "calc에 쓴 값이 나온 문서도 적습니다" 추가 |
| `v5_i4s2` | base_i4o · status_rules_i4s · output_order_i4s | status_rules_i4s: 판정 근거 "evidence_ids로 고른 문서" → "제공된 FAQ 문서". output_order_i4s: status 먼저, evidence_ids는 "status를 정할 때 쓴 문서" |

같은 22건. 결과는 `smoke/results/raw/`의 `…_v5_i4ck2_…`·`…_v5_i4s2_…` 폴더.

| 순서 | status 맞음 | 틀린 경우(기대→출력) | 빈 evidence | 정답 근거 포함 | FAQ 번호 | "따라서" 류 | calc 채움 | 평균 길이 |
|---|---|---|---|---|---|---|---|---|
| answer 먼저 (기준 `v5_i4`) | 19 | ANS→PAR 1, ABS→PAR 2 | 1 | 17 | 3 | 9 | — | 147자 |
| calc 먼저 옛 본문 (`v5_i4ck`) | **20** | ANS→PAR 1, PAR→ABS 1 | 6 | 14 | 1 | 3 | 6 | 113자 |
| calc 먼저 새 본문 (`v5_i4ck2`) | 19 | ANS→PAR 1, ABS→PAR 2 | **3** | 16 | 3 | **1** | 3 | **107자** |
| status 먼저 옛 본문 (`v5_i4s`) | 16 | ANS→PAR 4, ABS→PAR 2 | 1 | 16 | 2 | 5 | — | 129자 |
| status 먼저 새 본문 (`v5_i4s2`) | 16 | ANS→PAR 4, ABS→PAR 2 | 1 | 17 | 2 | 4 | — | 122자 |

("정답 근거 포함" = 정답 근거 ID를 모두 인용, "따라서" 류는 따라서·그러므로·그래서·때문에 정규식. 3절 표와 셈법이 조금 달라 기준 행의 "따라서"가 10 → 9.)

- calc 먼저 새 본문: 빈 근거 6 → 3(NC-0156·0180·PI-0082가 정답 근거를 넣음, PI-0082는 ABSTAIN → PARTIAL로 맞음, NC-0180은 노이즈 문서 FAQ-119를 섞지 않음). 남은 빈 근거는 SR 3건(SR-0025는 빈 근거가 맞음). 대신 SR-0055·0057이 ABSTAIN → PARTIAL로 돌아갔고(기준선과 같은 오류), 근거는 비운 채 본문에 "FAQ-178에 따르면"을 썼다. UI-0070은 calc에 "잠금 상태는 아직 발생하지 않았습니다. 30분 후에 잠금"을 지어내 새로 틀렸다. calc 채움 6 → 3, CE-0076(4 × 8,800 미계산)·CE-0058(경계 비교 PARTIAL)은 그대로.
- status 먼저 새 본문: 16/22 그대로, 틀린 문항도 같다. "라벨을 먼저 정하고 답을 휘게 함"은 본문 모순이 아니라 순서 자체 때문이다. CE-0041은 "달라질 수 있음을 … 확인할 필요" 추측까지 붙었다. → 본 테스트에서 뺐다.
- 22건에서 1~3건 차이라 옛·새 본문의 우열은 본 테스트로 가린다.

## 4. 테스트 항목 (try1)

prompts_test_v7 try1과 같은 PI · CE · UI · AR · SR · HR · NC · MC · MT × 100 = **900건**, 안 두 개(`v5_i4ck` · `v5_i4ck2`) = 1,800건. 2026-10-14 이 PC에서 생성.

> 처음 계획한 evidence_ids → status → answer(`v5_i4k`)는 빈 근거 연쇄(3-1)가, status → evidence_ids → answer(`v5_i4s`·`v5_i4s2`)는 라벨 먼저 정하기(3-2·3-7)가 뚜렷해 본 테스트에서 뺐다. 처음에 옛 스모크 폴더(`prompts_test_v9`, 같은 calc 순서 설정)로 시작했다 멈춘 try1 일부는 지웠다.

## 5. 실행 순서

```powershell
$T = @('--test', 'prompts_test_v8', '--try', 'try1')
$CK  = 'local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4ck_20261014_PI-CE-UI-AR-SR-HR-NC-MC-MT'
$CK2 = 'local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4ck2_20261014_PI-CE-UI-AR-SR-HR-NC-MC-MT'

# 1. 생성 → 결정론 채점 → CSV·run 보고서 (안마다 900건, GPU 하나라 차례로)
node scripts/run/run_item.js qwen3:4b-instruct 'PI,CE,UI,AR,SR,HR,NC,MC,MT' --size 100 @T --variant v5_i4ck
node scripts/run/run_item.js qwen3:4b-instruct 'PI,CE,UI,AR,SR,HR,NC,MC,MT' --size 100 @T --variant v5_i4ck2

# 2. 배치 매니페스트 · Judge 입력 준비(외부 호출 없음)
node scripts/judge/build_batch_manifest.js --batch pv8-try1 --size 100 @T --runs "$CK,$CK2"
node scripts/judge/judge_prepare.js --batch pv8-try1 @T

# 3. LLM Judge (외부 전송) — pv7-try1이 끝난 뒤에 돌린다(동시 실행 금지, Codex 사용량 한도 공유)
$env:LLM_JUDGE_CODEX_BIN = 'C:\Users\pc\AppData\Local\OpenAI\Codex\bin\2e5e00daee91c61d\codex.exe'
node scripts/judge/judge_run.js --batch pv8-try1 @T --confirm-external --concurrency 8
node scripts/docgen/judge_report.js --batch pv8-try1 @T

# 4. 짝 비교 — 기준(answer 먼저) 대비, 그리고 옛·새 본문끼리
node scripts/docgen/compare_variants.js --batch pv8-try1 @T --base v5_i4 --base-from prompts_test_v7/try1/pv7-try1
node scripts/docgen/compare_variants.js --batch pv8-try1 @T --base v5_i4ck
```

compare_variants는 실행할 때마다 같은 파일(`llm_judge/pv8-try1_variant_compare.md`·`.json`)에 쓰므로, v7처럼 실행마다 `_vs_<기준안>`으로 이름을 바꾼다.

## 5-1. try2 — calc → answer → evidence_ids → status (2026-10-15)

try1 원인 분석(failure_analysis 4절 1안): 손해는 evidence·status를 answer보다 먼저 쓰는 순서에서 났고, calc 효과는 가를 수 없었다. 기준선 순서(answer → evidence_ids → status) 앞에 calc만 붙인다.

- 안 `v5_i4ca` = base_i4 · status_rules_i4 · output_order_i4 · calc_i4 — **`v5_i4ck`와 프롬프트가 같고 키 순서만 다르다.** 그래서 v7 `v5_i4` 대비 = calc 칸(+ 키 접두어) 효과, try1 `v5_i4ck` 대비 = 순서 효과만 남는다. 본문 순서 설명("먼저 evidence_ids")은 기준선 `v5_i4`처럼 실제 순서와 어긋난 채 둔다(기준선과 같은 조건).
- 키: `a_calc · b_answer · c_evidence_ids · d_status`. `test.config.js`가 `LLM_TEST_TRY`로 try마다 키 순서를 고른다(try1을 다시 채점해도 try1 순서).
- 같은 9항목 × 100 = 900건, 이 PC. **Ollama가 0.40.3 → 0.40.4로 올라갔다**(모델 digest `0edcdef34593` 같음).

```powershell
$T = @('--test', 'prompts_test_v8', '--try', 'try2')
$CA = 'local-win_qwen3-4b-instruct_t0_nothink_fixed_n100_v5_i4ca_20261015_PI-CE-UI-AR-SR-HR-NC-MC-MT'
node scripts/run/run_item.js qwen3:4b-instruct 'PI,CE,UI,AR,SR,HR,NC,MC,MT' --size 100 @T --variant v5_i4ca
node scripts/judge/build_batch_manifest.js --batch pv8-try2 --size 100 @T --runs "$CA"
node scripts/judge/judge_prepare.js --batch pv8-try2 @T
$env:LLM_JUDGE_CODEX_BIN = 'C:\Users\pc\AppData\Local\OpenAI\Codex\bin\9614f1d9b40d9c4f\codex.exe'   # 2026-10-15 경로
node scripts/judge/judge_run.js --batch pv8-try2 @T --confirm-external --concurrency 8
node scripts/docgen/judge_report.js --batch pv8-try2 @T
node scripts/docgen/compare_variants.js --batch pv8-try2 @T --base v5_i4 --base-from prompts_test_v7/try1/pv7-try1
node scripts/docgen/compare_variants.js --batch pv8-try2 @T --base v5_i4ck --base-from prompts_test_v8/try1/pv8-try1
```

결과(2026-10-15, Judge 900/900): 정답 v5_i4 698 → **640**(p<0.001), ck 632 → 640(p=0.69) — 채택 안 함. MT 86 → 72(두 질문 중 마지막만 답함, calc 빈칸인데도), AR 66 → 49(calc에서 비교하고 answer에서 거리 누락). 빈 근거 연쇄(PI·HR)는 회복, FAQ ID 노출 77 → 18. Ollama 0.40.4 효과는 v5_i4 AR·MT 재실행(`prompts_test_v7/envcheck_0404`, 배치 `pv7-envcheck`)으로 확인 — MT 86 → 87 · AR 66 → 61로 하락의 주원인이 아니다. [정리](try2/results/interim_summary.md).

## 6. 알려진 한계

- 키 이름(접두어)도 함께 바뀐다. 순서 효과와 키 이름 효과는 가를 수 없다(키 이름만 바꾸고 순서는 그대로 두는 방법이 이 모델에는 없다).
- 기준선(`v5_i4`) 대비 `v5_i4ck`는 순서 + calc 칸, `v5_i4ck2`는 순서 + calc 칸 + 순서 설명 문장 변경이 함께 들어간다. calc 칸 없이 순서만 바꾼 안(`v5_i4k`)은 본 테스트에 없다.
- 프롬프트는 answer 먼저 출력하는 상태에서 다듬어 온 것이다(v5_i1~i4). answer 작성 방식 2번(불가 문장)은 status가 아니라 질문 내용으로 조건을 건다 — status가 answer보다 먼저 나오는 지금은 status로 걸 수 있지만, 내용 변경이라 이번에는 하지 않았다.
- 항목당 100건이라 100문항당 ±2건 정도의 판정 노이즈보다 작은 변화는 판단하지 않는다.
