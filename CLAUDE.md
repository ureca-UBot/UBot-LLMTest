# CLAUDE.md — 작업 재개용 메모

이 프로젝트에서 다시 작업을 시작할 때 이 파일부터 읽으세요. 전체 방법론/설계 이유는 [`README.md`](README.md)에 있고, 이 파일은 **"지금 어디까지 했고 다음에 뭘 해야 하는지"**만 빠르게 파악하기 위한 진행 상황 스냅샷입니다.

## 마지막 작업일: 2026-10-15

## 저장소 구조 (2026-09-28 개편, 2026-09-30 공통 엔진 추가)

```
data/                         # 버전 공통 데이터 (eval_sets/test_set1 = v1, test_set2 = v2·v3, test_set4 = v4~ — test_set3은 교체 전 v4 데이터)
scripts/                      # ⭐ v4부터 모든 버전이 공유하는 공통 엔진(run·score·judge·docgen·lib) — scripts/README.md
prompts/                      # ⭐ 모든 프롬프트(chatbot·judge·docgen) — prompts/README.md
model_test_v4/test.config.js  # v4부터 버전별로 바뀌는 값은 이 파일 하나 (스크립트 복사 금지)
model_test_vN/                # (아래는 v1~v3 구조)
├── SETUP.md                  # 테스트 항목 · 라운드별 스크립트 · 실행 순서
├── PATH_MAP.csv              # 개편 전(results/..., scripts/testN/...) → 개편 후 경로
├── scripts/                  # 버전 단위 스크립트 (try끼리 공유)
└── tryN/results/
    ├── all_summary.md        # ⭐ 회차 전체 요약 — 여기서 시작
    ├── raw/ (v2·v3는 raw/scored/ 포함) · report/ · llm_judge/ · summary/
```

- 버전 ↔ 옛 이름: v1 = test1, v2 try1 = test2(9/17, 9모델), v2 try2 = test2 V2 재실행(9/18, 5모델 + LLM Judge), v3 try1 = test3(EC2, 9/20)
- v4~는 루트 `scripts/run/`의 `run_all.js`(모든 모델×모든 항목) · `run_model.js <model>`(모델×모든 항목) · `run_item.js <model> <CODE>`(모델×항목)로 실행한다. `--test`·`--try`·`--size 50|100|150|200`을 받고, 경로·설정은 `scripts/lib/profile.js`가 `test.config.js`를 읽어 해석한다. LLM Judge `judge_run.js`는 `--confirm-external` 없이는 실행되지 않는다.
- v2·v3 스크립트는 `LLM_TEST_TRY`(기본: v2=`try2`, v3=`try1`)로 결과 try를 고르고, 경로는 `model_test_vN/scripts/lib/suite.js` 한 곳에서 해석한다. 옛 `LLM_TEST_SUITE`는 없어졌다.
- v3 채점 스크립트는 v2의 **복사본**이다 — 채점 로직을 고치면 양쪽에 반영할 것.
- 13개 항목 + 반복 라운드 스크립트: `model_test_v2|v3/scripts/rounds/01~14_*.js` (`--dry-run` 지원)
- 증거 파일(배치 매니페스트·publish_manifest 등)의 `source_path`는 옛 경로로 기록돼 있고 SHA-256 보존을 위해 수정하지 않는다. 스크립트는 run_id로 새 경로를 찾는다.
- **v4부터 평가 방식 변경**(README 4-9절): 결과론적 평가는 유사도 점수로 정확도를 보고 통과/실패·통과율 없음, "AI 재판단 필요"(escalation) 없음, LLM Judge는 항상 별도 단계로 전수. v2·v3 스크립트·결과는 기존 방식 그대로 둔다.
- 새 try를 추가하면 `all_summary.md`를 작성한다: 서두에 테스트 항목·건수·평가 기준 → 전체 결과(LLM Judge 우선) → 이전 버전/회차 대비 → 항목별 요약(모든 평가 기준) → summary 문서 요약 → 세부 경로.

## 현재 상태 (2026-10-06)

- v3 try1에서 **1차 MVP 모델로 `qwen3:14b` 추론 OFF(temperature 0)** 선정 (`model_test_v3/try1/results/summary/model_selection.md`). 최종 확정 아님.
- **v4(test4) try1 완료 — 저급 모델 튜닝 전 기준선(레거시)** ([all_summary](model_test_v4/try1/results/all_summary.md)). 대상은 `qwen3:4b` OFF · `gemma3:4b`이고, 튜닝 한계가 확인되면 `qwen3:8b` OFF로 넘어간다. 데이터는 `test_set4`(14개 항목 × 200 = 2,800건, FAQ 원문 1,000건, 50/100/150 중첩 서브셋 — 2026-10-06 `FAQ_RAG_2800건_의도균등FAQ_v4반영본.xlsx`로 교체, 평가 기준·방법은 그대로)이고, 상담봇 프롬프트는 `v4_base`(**CLARIFY 상태 없음 — 되묻기는 ABSTAIN/PARTIAL 안에서, Judge가 asks_user로 건수만 집계**, `prompts/chatbot/` — 공통 문단 + 근거 기준 status 판정 + 출력 순서 `evidence_ids → status → answer`, 순서는 구조화 출력으로 강제)이다. Judge 루브릭 `v4-judge-12`: 정답률은 답변 문장만 보고 판정하고, 정답+상태·정답+근거·정답+근거+상태를 따로 집계한다. **Judge는 Codex CLI**(ChatGPT 구독 인증, `lib/judge/providers/codex.js`) · `gpt-6-sol` · reasoning medium. 호출 로그는 `llm_judge/runs/<batch>/calls/<kind>.calls.jsonl`(판정 종류마다 1파일, 재개 시 이어 씀). **프롬프트는 모두 `prompts/`(chatbot·judge·docgen), 스크립트는 `scripts/`(run·score·judge·docgen·lib)에 용도별로 둔다** — 판정 단계와 문서 생성 단계는 스크립트·프롬프트를 섞지 않는다.
  - **try1 결과**(EC2 생성 2026-10-05~06, Judge 6,398/6,400): 정답률 `gemma3:4b` 65.1% · `qwen3:4b` OFF 63.0%, 정답+근거+상태 44.4% · 31.3%, 환각률 24.1% · 22.0%. 약한 항목은 둘 다 PI·CE·UI·CF·AR. 처음엔 gemma3:4b를 우선 튜닝 후보로 봤으나(brief_report), **2026-10-07 오답 분석 후 튜닝 대상을 `qwen3:4b` OFF로 변경**([tuning_target_decision](model_test_v4/try1/results/summary/tuning_target_decision.md)) — qwen 오답의 36.6%가 프롬프트 구조(빈 evidence_ids → ABSTAIN → 보류 문장)가 만든 과잉 보류였고, 답했을 때 정답률은 qwen이 높다. 최종 선정 아님.
  - **프롬프트 튜닝 1차 진행 중: `prompts_test_v1/`**([SETUP](prompts_test_v1/SETUP.md), 브랜치 `test4/prompt-tuning`). 안 `v4_t1`(`prompts/chatbot/*_t1.md`)을 로컬에서 생성하고 기준선은 v4 try1(EC2)을 쓴다 — 같은 v4_base로 로컬·EC2를 비교한 399건에서 status 일치 93.5%라 환경 차이가 섞인다. 엔진에 `--test prompts_test_v1`·`--variant`·`--ids-file`, `run_info.runtime`, `run/build_case_set.js`, `docgen/compare_variants.js --base-from` 추가. 다음 안 후보: PARTIAL인데 evidence_ids를 비우는 문제("보류하는 경우 빈 배열" 문장), FAQ ID 노출 잔존, API 필드 이름 노출, 출력 순서 변경(`v4_t2`·`v4_t3`은 키 순서 설정이 아직 없어 실행 불가).
  - **프롬프트 튜닝 2차: `prompts_test_v2/`**([SETUP](prompts_test_v2/SETUP.md), [중간 정리](prompts_test_v2/try1/results/interim_summary.md)). 안 `v4_t1b`(`prompts/chatbot/*_t1b.md`) — 완결성·PI 답할 부분 먼저·다음 행동 안내·HR 범위 밖 기준·질문 속 요구 문장 복사 금지·상식 보충 금지, 출력 순서는 유지. 항목은 PI·AD·HR·SR 100 + NC·MC 목록 200(CE·CF·UI·AR은 기준·테스트셋·Judge 재검토 예정이라 제외), 기준선은 v4_t1(같은 PC). 2026-10-07 생성·Judge(`pv2-try1`, 정확도 599/600 · 안전성 100) 완료. 결과: 정답 460 → 462(합계 그대로) — 누락만으로 오답 72 → 45, PI 47 → 56, MC 70 → 79는 좋아졌지만 **SR 96 → 78, HR 87 → 80, 환각 103 → 176**. "정책에 따라 다를 수 있으니 고객센터로" 같은 추측·자료에 없는 확인 경로가 원인(확인 경로 안내 문장 + 모델이 자신을 특정 통신사 챗봇으로 모름). 다음 안 `v4_t1c` 후보: 소속 정체성 추가, 확인 경로 안내 문장 제거, 추측 금지 예시 제거, 완결성 유지(interim_summary 4절). v1 안전성 Judge는 2026-10-07 완료(UNSAFE 8 → 10, 과잉 거부 18 → 5). 결과 폴더 줄바꿈 변환을 막도록 `.gitattributes`에 `-text` 추가(다른 PC에서 Judge할 때 SHA 검사용).
  - **프롬프트 튜닝 3차: `prompts_test_v3/`**([SETUP](prompts_test_v3/SETUP.md), [중간 정리](prompts_test_v3/try1/results/interim_summary.md)). 안 `v4_t1c`(`base_t1c.md` + t1b의 status_rules·output_order) — 소속 정체성("이 통신사의 고객 상담 챗봇", "일반적으로 알려진 통신사 정책" 구절 삭제), 확인 경로 안내 문장 삭제, 추측 금지 따옴표 예시 삭제, 완결성 대상을 "질문의 답을 담은 FAQ"로 한정. 항목 PI·HR·SR 100 + NC·MC 목록 200(AD 제외), 기준선 v4_t1b. 결정론 단계 중 정답 유사도·NLI·반복 일관성은 `pipeline.skip`으로 건너뜀. 2026-10-07 생성(이 PC)·Judge(다른 PC, `pv3-try1` 500/500) 완료. 결과(499건, t1 → t1b → t1c): 정답 378 → 378 → **392**, 환각 87 → 157 → **107**(SR 21 · HR 25로 v4_t1 수준), 누락만으로 오답 68 → 41 → 40, MC 79 → 88(p=0.035). 남은 문제: SR 86(v4_t1 96, 값 단정), **NC 85 → 79**(완결성 대상 한정 문장이 FAQ 관련성 판단을 요구), 근거를 evidence_ids 대신 본문에 적음(근거 미기재 70 → 103, ID 노출 123 → 170). 다음 안 후보는 v3_change_effects 3절. `.gitignore`의 `**/results/`(main에서 병합) 때문에 결과가 커밋되지 않던 문제는 `!prompts_test_v*/*/results/` 예외로 해결.
  - **프롬프트 튜닝 4차(Instruct 1차): `prompts_test_v4/`**([SETUP](prompts_test_v4/SETUP.md), [중간 정리](prompts_test_v4/try1/results/interim_summary.md), 2026-10-12). 안 `v5_i1`(`base_i1.md` + `status_rules_i1.md`) = v4_base + 1~3차 문장 중 Instruct 원인 비율로 고른 7개(완결성·추측 보충 금지·확인 경로 금지·사칭·처리 완료·요구 문장 복사 금지·CONFLICT 괄호). `qwen3:4b-instruct` Q4_K_M만, 11항목(EC·RT·PS 제외) × 100을 **이 PC에서 새 안만 생성**, 기준선은 v5 try1 Q4 v4_base(EC2, `--base-from model_test_v5/try1/v5-try1-n100`). 결과(Judge 1,100 + 안전성 100 완료, 2026-10-12): 정답 821 → 814(p=0.63), **환각 283 → 342**, 확인 경로 환각 42 → 68, 누락 그대로, 충돌 임의 선택 32 → 19(CF 환각 43 → 29), AD UNSAFE 7 → 8. 로컬 Ollama 0.40.2에서도 Instruct 키 순서는 답 먼저.
  - **프롬프트 튜닝 5차(Instruct 2차) 준비: `prompts_test_v5/`**([SETUP](prompts_test_v5/SETUP.md), [사람 검토 정리](model_test_v5/try1/results/summary/human_review_issues.md), 2026-10-12). 데이터셋 **`test_set4r`**(`scripts/run/build_test_set4r.js`로 test_set4에서 파생 — AR·UI 조회 결과를 "라벨 = 값" 문장으로(`lib/user_info_text.js`, 인증 실패 시 개인 값 미전달), FAQ-087·819·913 문구, 정답 예시의 재조회·재확인 안내 제거, 채점 메모는 실패 조건으로, AR·UI 20템플릿 질문 다시 쓰기, CF의 "문서 A/B" 제거(질문 꼬리·Context 라벨·정답 예시), 변경 내역 `changes.csv`). 안 `v5_i2`(v4_base에서 덧붙임·되묻기 허용 문장 삭제 + "사용자는 자료를 볼 수 없다" + 답변 틀: 확정 답 + 답할 수 없는 부분 한 문장, 질문 하나당 50자). **비교 방식은 prompts_test_v4와 같다**(새 안만 로컬 생성, 기준선 v5 try1 `--base-from`) — 데이터가 달라 짝 비교가 온전한 문항은 1,100건 중 454건(AR·UI·CF는 입력이 바뀜). 11항목(EC·RT·PS 제외) × 100. **본 테스트는 `try2`**(취소한 옛 try2를 지우고 옛 try3를 옮김): 이 PC에서 `v4_base`·`v5_i2`를 각 1,100건 새로 생성(2026-10-12, 오류 0) — 같은 배치 `pv5-try2`라 `--base-from` 없이 짝 비교. **Judge 완료(2026-10-14, 정확도 2,200 · 안전성 200)** — [중간 정리](prompts_test_v5/try2/results/interim_summary.md) · [원인 분석](prompts_test_v5/try2/results/summary/failure_analysis.md). 정답 825 → 662(p<0.001, 누락만으로 오답 53 → 200 — 50자 제한·"두 부분으로만"이 조건·계산 결과를 버림), 대신 환각 244 → 150, 되묻기 144 → 1, 본문 FAQ ID 노출 222 → 62, AD UNSAFE 8 → 4.
  - **프롬프트 튜닝 6차(Instruct 3차): `prompts_test_v6/`**([SETUP](prompts_test_v6/SETUP.md), [중간 정리](prompts_test_v6/try1/results/interim_summary.md), 2026-10-14 Judge 완료). 안 `v5_i3`(`base_i3.md` = base_i2에서 50자 제한 삭제 + "FAQ의 조건·단서와 계산 결과는 줄이지 않습니다"). PI·CE·UI·SR·NC·MC·MT × 100만 이 PC에서 생성(UI-0093 타임아웃 → 699건), 기준선은 pv5-try2의 `v4_base`·`v5_i2`(`--base-from prompts_test_v5/try2/pv5-try2`). 결과(699쌍): 정답 v4_base 550 · v5_i2 413 · **v5_i3 551**(누락만으로 오답 44 · 165 · 30), 되묻기 86 · 1 · 2는 유지, 하지만 환각 147 · 80 · 126, **본문 FAQ ID 노출 137 · 16 · 184**로 v5_i2 개선 대부분을 잃었고, **CE 68 → 57**(v4_base 대비 p=0.035, 경계 조건을 바꿔 말하는 모순). 다음 안 후보: 출처 표기("~에 따르면", FAQ 번호) 금지, CE 조건 재진술 모순, 덧붙임 창작·일반화.
  - **프롬프트 튜닝 7차(Instruct 4차): `prompts_test_v7/`**([SETUP](prompts_test_v7/SETUP.md), 2026-10-14). 안 `v5_i4`(base_i4 · status_rules_i4 · output_order_i4) — "답할 수 없는 부분" 지시를 base 작성 방식 2번 한 곳으로 모음(조건만: 있을 때만·맨 끝·한 문장·이유 없음). 9항목(PI·CE·UI·AR·SR·HR·NC·MC·MT) × 100 이 PC 생성(Ollama 0.40.3), 기준선 pv6-try1 `v5_i3`·pv5-try2 `v4_base`·`v5_i2`. Judge(`pv7-try1`) 900/900 완료(2026-10-14, 사용량 한도로 782에서 멈췄다 이어 돌림). 정답 v4_base 703 → **698**(p=0.74) · v5_i3 551 → 549(699건), 환각 184 → 122(v4_base 대비)·126 → 90(v5_i3 대비), 되묻기 126 → 1, FAQ ID 노출 v5_i3 184 → 73, CE 57 → 66. 대신 **HR 94 → 82**(v4_base 대비 p=0.004, ABSTAIN 라벨 91 → 80). SETUP 6절.
  - **출력 키 순서 강제(8차): `prompts_test_v8/`**([SETUP](prompts_test_v8/SETUP.md), 2026-10-14). 키 이름에 접두어(a_·b_…)를 붙이면 Instruct가 그 순서를 따른다(`output.keyNames`). 스모크 22건으로 다섯 순서를 비교 — evidence 먼저는 빈 근거 → 보류 연쇄, status 먼저는 라벨을 먼저 정하고 답을 휘게 함(본문을 순서에 맞춰도 같음), **calc → evidence_ids → status → answer**만 기준보다 나음. 본 테스트 try1 = 같은 9항목 × 100 × 안 두 개: `v5_i4ck`(v5_i4 + calc_i4, 옛 본문) · `v5_i4ck2`(base_i4o · status_rules_i4 · output_order_i4ck — 순서 설명을 실제 순서에 맞춤). 기준선 pv7-try1 `v5_i4`. 2026-10-14 생성 완료(calc 먼저 순서에서 60초 타임아웃 = 반복 루프 4 · 1건 — answer 먼저 run은 0~1건), 배치 `pv8-try1` **Judge 완료**(2026-10-14, 한도로 멈췄다 20:35 이어 돌림, 896 · 899) — [정리](prompts_test_v8/try1/results/interim_summary.md) · [원인 분석](prompts_test_v8/try1/results/summary/failure_analysis.md). 정답 v5_i4 696 → `v5_i4ck` **632** · 698 → `v5_i4ck2` **649**(둘 다 p<0.001) → 둘 다 채택 안 함. 원인은 evidence를 answer보다 먼저 쓰는 순서: 빈 근거 → 보류(PI 76 → 53 · 57), HR ABSTAIN → OUT_OF_SCOPE(ck만, ck2는 79로 회복), ck2 MT 86 → 72("두 가지" 문항에서 evidence 하나만 고르고 마지막 질문만 답함). 얻은 것: FAQ ID 노출 76 → 28 · 31(answer 전에 출처 칸이 채워져 본문에 되풀이하지 않음), ck2 환각 122 → 83. calc 효과는 가를 수 없음(calc 채움 226건 정답 135 → 128). 누락 오답 63건 직접 검토 시 33건은 묻지 않은 부가 사실(대부분 답에 쓴 FAQ의 나머지 문장) 누락. **다음 안 후보: calc → answer → evidence_ids → status** + 답에 쓴 FAQ의 요금·확인 경로·주의·다른 선택지 완결성(조건 문장은 적용 결과로, 조회 방법 문장 금지 — failure_analysis 4-1-1절) 표적 스모크. 다른 순서의 스모크는 모두 `prompts_test_v8/smoke/`에 모음(옛 폴더 `prompts_test_v8_status`·`v8_evcalc`·`v9`·`v9_status`는 삭제).
  - **8차 try2(2026-10-15): calc → answer → evidence_ids → status**(`v5_i4ca` = v5_i4ck와 같은 프롬프트, 키 순서만 다름 — `test.config.js`가 `LLM_TEST_TRY`로 try마다 키 순서를 고름). 900건 이 PC(**Ollama 0.40.4**), Judge `pv8-try2` 900/900 — [정리](prompts_test_v8/try2/results/interim_summary.md). 정답 v5_i4 698 → **640**(p<0.001) → 채택 안 함. 빈 근거 연쇄는 회복(PI 53 → 67, HR 69 → 88)했지만 MT 86 → 72(두 질문 중 마지막만 답함 — calc 빈칸인데도, 즉 evidence 순서 탓이 아님), AR 66 → 49(calc에서 비교하고 answer에서 거리·한계 누락), 답 길이 127 → 92자·누락 오답 72 → 150. FAQ ID 노출 77 → 18. try1 failure_analysis의 "짧아짐·ID 노출 감소는 순서 효과" 설명은 틀렸고 calc 칸·calc 문단 쪽 효과다. 환경 확인: v5_i4를 0.40.4로 AR·MT 재실행(`prompts_test_v7/envcheck_0404`, `pv7-envcheck`) — MT 87 · AR 61로 하락 주원인 아님. 다음: calc 없는 v5_i4에 failure_analysis 4-1절 FAQ 완결성 문장을 얹는 안, 또는 calc 효과 분리 스모크(키 접두어만 / "결과만" 삭제).
  - **v7 남은 실패 분석**(2026-10-15, [failure_analysis](prompts_test_v7/try1/results/summary/failure_analysis.md)): 반복은 기준선보다 줄었고(하나라도 303 → 234), 남은 것은 불가 문장 이중화 116(SR 57·HR 25·PI 23, 그중 72건이 "자료에 없습니다. 따라서 확정할 수 없습니다."처럼 두 번째 문장이 "따라서"로 시작)·"따라서" 결론 재진술 52(오답 42%). 누락 143건 중 57건은 상태 판단 실패(확정 불가 미고지 39·HR 범위 밖 9·PI 과잉 보류 9), 계산·적용 32, 방법·경로 30(18건은 v4_base 정답 — 답이 짧아진 대가). ABSTAIN·범위 밖 표현은 나중에 따로 정하기로 함.
  - **프롬프트 튜닝 9차: `prompts_test_v9/`**([SETUP](prompts_test_v9/SETUP.md), 2026-10-15) — 목표는 **불가 문장 이중화 줄이기**. 안 `v5_i5`(`base_i5` · `status_rules_i5` · output_order_i4): 작성 방식 2를 모두/일부/하나도 세 경우로 나누고 "하나도 없으면 불가 문장 하나만, 답할 수 없다는 말은 한 번만", status 정의에 경우 연결, OUT_OF_SCOPE answer 문장 삭제. 9항목 × 100 이 PC(Ollama 0.40.4) 생성, 기준선 pv7-try1 `v5_i4`(`--base-from`). **결과(결정론, Judge 안 함): 이중화 116 → 222**(HR 25 → 73, SR 57 → 80, PI 23 → 49) — 모델이 "자료에 없습니다" 뒤에 지시받은 "따라서 답할 수 없습니다"를 덧붙임, 3번 "뒤에 아무것도 쓰지 않음" 삭제로 꼬리 문장·길이(127 → 145)·FAQ 번호(77 → 116)도 늘어남. 다음 후보: "자료에 없습니다" 한 문장을 불가 문장으로 인정하고 "따라서 …" 덧붙임 금지, 표적 스모크 먼저(SETUP 5-1절).
  - **백엔드 반영안 `v5_i4b`**(2026-10-15): v5_i4에서 OUT_OF_SCOPE answer 문장만 뺀 것(`status_rules_i4b.md`). 완성 시스템 프롬프트·호출 조건은 `prompts/chatbot/assembled/`(v5_i4b.txt · README). v5_i4b 자체는 생성·Judge 안 함.
  - Judge는 두 배치를 동시에 돌리지 않는다(판정 파일 열기 오류). Codex CLI 경로는 앱 업데이트로 바뀐다(2026-10-15: `...\Codex\bin\9614f1d9b40d9c4f\codex.exe`).
  - **EC는 앞으로 모든 테스트에서 제외**(2026-10-12 결정).
  - **v5(test5) try1 완료: `model_test_v5/`** ([all_summary](model_test_v5/try1/results/all_summary.md), [판단](model_test_v5/try1/results/summary/quantization_decision.md), 2026-10-08 Judge 4,799/4,800). 정답률 Instruct Q8_0 78.8% · Q4_K_M 77.5%(짝 검정 p=0.22, 차이 없음, Q8은 1.34배 느림) · Gemma QAT 67.0%. v4 두 모델을 같은 1,400건으로 재집계(`v4-try1-n100`, 판정 재사용)하면 gemma3:4b 64.5% · qwen3:4b OFF 62.2%. 결정: Ollama 기준 Q4_K_M, **튜닝 대상을 `qwen3:4b-instruct` Q4_K_M으로 변경**, QAT 제외, vLLM 동시성은 AWQ 주 후보·FP8 비교용. **주의: Instruct는 JSON 스키마 키 순서를 따르지 않음**(2,800건 전부 `answer → evidence_ids → status`, 같은 Ollama 0.34.2에서 QAT·v4 모델은 지킴) — 다음 튜닝 전에 스모크로 확인. 아래는 준비 당시 기록.
  - v5 준비: `model_test_v5/`([SETUP](model_test_v5/SETUP.md), 브랜치 `test5/script`, 2026-10-07). v4와 평가 기준·항목·데이터셋·프롬프트·Judge·서버(EC2 T4 — L4는 시작 권한이 없어 포기)가 같고, `qwen3:4b-instruct`(Q4_K_M)·`qwen3:4b-instruct-2507-q8_0`·`gemma3:4b-it-qat`를 **항목당 100건**(1,400건/모델)으로 잰다. Q4_K_M은 다시 생성하지 않고 v4 try1 n200 run을 `scripts/run/import_run_subset.js`로 100 서브셋만 가져왔다. 2026-10-08 기준 q8_0·qat 생성(EC2 T4, Ollama 0.34.2, 각 1,400건·오류 0)·Q4_K_M 가져오기·결정론 채점(가져온 run은 로컬 재채점, EC2 채점과 비교해 결정론 지표 동일·정답 유사도 차이 최대 0.0026)·배치 매니페스트 `v5-try1-n100`(3 run)까지 완료, **다음은 Judge**(`judge_prepare.js --test v5 --batch v5-try1-n100`부터). Q8_0은 FP8의 정확도 대리(Ollama에는 FP8 텐서 형식이 없음). 동시성·VRAM·속도는 별도 테스트(vLLM). v4 두 모델의 100건 재집계는 나중에 따로. `--test`를 생략하면 v5가 잡히므로 v4 명령에는 `--test v4`를 붙인다.
  - Judge 사람 검토: `llm_judge/review/<batch>/` — 모델 × 항목마다 `<모델>_<항목>_review.md` + `index.md`, 필터는 하위 폴더(`docgen/judge_review_export.js`, `--filter correct-hallucinated|abstain-label-correct`). Judge 성능 소규모 검증은 `test4/llm-judge-eval` 브랜치의 `tset_4_llm_test/`(qwen3:4b OFF, 항목당 10건).
  - result.html v4 항목은 `scripts/docgen/build_result_entry.js --batch <id> --write`로 만든다(지표 키 `v4_` — v3와 데이터·정의가 달라 차이 계산 안 함).
  - 임베딩 검색 적용 테스트(`contextMode: 'retrieval'`, `FAQ_RAG_2800건_의도균등FAQ_v4_Context제거본.xlsx`)는 미구현이다.
  - 결정(2026-10-01): 표현 규칙(v4 공통 엔진)에서 "제공된 자료" 실격 패턴을 빼고, 질문 echo 실격은 질문 전체를 되풀이한 경우만으로 좁혔다. 근거 채택 주 기준은 "인용한 문서가 모두 정답 근거 문서이고 하나 이상"(전부 인용은 엄격 기준으로 따로). v2·v3 스크립트는 그대로.
- 후속 과제 후보: 동시성 테스트, 프롬프트 비교 테스트, top-k 테스트(모두 v4 기준선과 비교). v2·v3용 `item_review.md` 수정 23문항과 Judge 채점 경계 통일은 test_set2 한정.

---

아래는 **v1(test1) 진행 당시(2026-09-11) 스냅샷**이다. 경로는 개편 전 기준이며 새 경로는 `model_test_v1/PATH_MAP.csv`를 따른다.

## 지금까지 한 일 (v1 당시)

1. **테스트 대상 확정**: Qwen3(0.6B/1.7B/4B/8B), EXAONE 3.5(2.4B/7.8B), Gemma3(270M/1B/4B) 9개 모델, 전부 Ollama에 로컬 설치 완료
2. **평가 프레임워크 9개 영역 확정** + 프롬프트 템플릿 3종 확정 (README 5·9절)
3. **자동화 파이프라인 구축** — 모델 호출(Ollama API) → 결정론적 보조지표 → Judge 채점(Claude Code 헤드리스) → 결과 문서 자동 집계, 4단계 스크립트 (README 10절)
4. **FAQ 답변 생성 라운드 (Easy/Medium/Hard) 전부 실행 완료** ✅ — 각 9개 모델 × 9케이스, 결과는 `results/faq_{easy,medium,hard}_results.md`
5. **RAG 안정성 테스트를 유형당 3건(21건)→9건(63건)으로 확대**, 컨텍스트 개수(3/5/10개) 기준 Small/Medium/Large 3개 파일로 분리, 전용 파이프라인 스크립트 작성
6. **RAG 안정성 Small/Medium/Large 라운드 전부 실행 완료** ✅ — `results/faq_rag_stability_{small,medium,large}_results.md` — **1차 라운드(FAQ 답변 생성 + RAG 안정성) 전체 완주**

## 다음에 할 일 (우선순위 순)

1. **의도 분류 라운드 (항목 3·4)** — 데이터(`data/eval_sets/test_set1/intent_classification.csv`, 113건)는 준비됐지만 **전용 러너 스크립트가 아직 없음** (RAG 안정성처럼 새로 만들어야 함 — FAQ 컨텍스트 없이 질문만 주고 3-way 분류, 채점은 결정론적 Confusion Matrix라 Judge 불필요)
2. **클러스터 라벨링 라운드 (항목 9)** — 데이터(`data/eval_sets/test_set1/cluster_labeling.csv`, 20건→4그룹)는 준비됐지만 **전용 러너 스크립트가 아직 없음** (그룹별 라벨링 프롬프트, Judge로 라벨 정확도 채점)
3. 사람 채점 calibration set 확보 후 Judge 신뢰도 검증
4. Easy/Medium/Hard/RAG안정성 결과 문서의 `사람평가`/`사람 총평` 칸 검토
5. RAG 안정성 3개 티어(Small/Medium/Large) 전체 결과를 놓고 **최종 모델 후보 압축** (아래 요약 참고 — Qwen3 4B/8B, Gemma3 4B가 유력)

## 지금까지 나온 핵심 결과 (요약)

- **Qwen3 4B**가 Easy/Medium/Hard 전부 환각률 0%를 유지한 유일한 모델 (다만 속도가 제일 느림, 케이스당 7~20초)
- **Gemma3 4B**가 정확도-속도 밸런스 1순위 후보로 보임 (Hard 100% 정답률, Qwen3 4B보다 10배 빠름)
- **EXAONE 3.5(2.4B/7.8B)는 난이도가 올라갈수록 환각률이 계속 악화** (Hard에서 67%까지)
- Gemma3 270M/1B는 Hard에서 정답률 20%대로 사실상 실사용 어려움
- **반전**: FAQ 라운드에서 최고였던 Qwen3 0.6B가 RAG 안정성 전 티어(Small 14.3%/Medium 25.0%/Large 14.3%)에서 계속 하위권 — "단순 재진술"과 "무관/모순 컨텍스트 저항"은 완전히 다른 능력
- **RAG 안정성 적절 대응률 (Small/Medium/Large)**:
  - Qwen3 4B: 71.4% / 76.2% / **61.9%(1위)**
  - Qwen3 8B: **85.7%(1위)** / **81.0%(1위)** / 57.1%
  - Gemma3 4B: 76.2% / 71.4% / 57.1%
  - Gemma3 270M/1B: 전 티어 0~33%대로 사실상 전멸
  - → **컨텍스트가 10개까지 늘어나면(Large) Qwen3 8B도 무너지고 Qwen3 4B가 역전** — "속도만 느릴 뿐 정확도는 안 흔들리는" Qwen3 4B와, "작고 빠르지만 Large에서 약해지는" Qwen3 8B/Gemma3 4B 사이의 트레이드오프가 최종 후보 압축의 핵심 포인트

## 되짚어볼 것 (다음 세션에서 판단 근거로 참고)

- RAG 안정성이 최종 모델 선정의 핵심 기준이라고 합의함 (Easy/Medium/Hard는 진단용 보조 자료)
- 정답률 임계값(Judge 1~5점 중 4점 이상=정답)은 임의로 정한 것 — 필요하면 조정
- `gemma3:12b`가 계획에 없이 추가 설치되어 있음 (8B 캡 초과라 테스트 대상에서 제외한 상태, 포함하고 싶으면 알려달라고 했었음)
