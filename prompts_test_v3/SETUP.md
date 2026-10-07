# prompts_test_v3 — 프롬프트 튜닝 3차 · 테스트 항목 · 실행 순서

2차 튜닝 결과([prompts_test_v2 interim_summary](../prompts_test_v2/try1/results/interim_summary.md))에서 확인한 부작용(SR 96 → 78, HR 87 → 80, 환각 103 → 176)의 원인을 고치고, 필수 사실 누락 감소 효과(누락만으로 오답 72 → 45)는 유지하는지 같은 문항끼리 비교한다. 데이터·항목·모델·생성 조건·Judge는 `model_test_v4`와 같다(`test.config.js`가 v4 설정을 그대로 가져온다). 엔진은 루트 `scripts/`를 그대로 쓰고, 실행할 때 `--test prompts_test_v3`를 준다.

## 1. 목표

- 대상: `qwen3:4b` OFF(temperature 0).
- 비교: **기준선은 `v4_t1b`(prompts_test_v2 try1, 같은 PC)**. `v4_t1`(prompts_test_v1)·`v4_base`(v4 try1 EC2)와도 같은 문항이다.
- 판정: LLM Judge(루브릭 `v4-judge-12`, Codex `gpt-6-sol`)는 **이 PC에서 돌리지 않고 따로 실행한다**. 여기서는 생성·결정론 채점·배치 매니페스트(`report/pv3-try1.json`, 루브릭 미포함)까지만 한다 — Judge 준비(`judge_prepare`) 때의 루브릭이 적용된다.
- 확인할 것: SR·HR 정답이 v4_t1 수준(96·87)으로 돌아오는지, 환각이 v4_t1(PI 25 · SR 20 · HR 24) 근처로 내려가는지, PI·NC·MC 누락 감소가 유지되는지.

## 2. 프롬프트 안 (`prompts/chatbot/variants.json`)

| 안 | 구성 | 출력 순서 |
|---|---|---|
| `v4_t1b` (기준) | base_t1b · status_rules_t1b · output_order_t1b | evidence_ids → status → answer |
| `v4_t1c` | **base_t1c** · status_rules_t1b · output_order_t1b | 그대로 |

`v4_t1c`에서 바꾼 것은 `base_t1c.md` 하나다(맨 위 주석에 이유). status_rules·output_order는 t1b와 같다.

| 겨냥한 문제 (v4_t1b) | 변경 |
|---|---|
| 모델이 자신을 특정 통신사 챗봇으로 인식하지 않아 "통신사별·정책에 따라 다르다"를 씀 (언급 30 → 91건, 새 환각 주장 PI 12 · SR 15 · HR 7) | 첫머리를 "당신은 이 통신사의 고객 상담 챗봇입니다. … 제공된 FAQ는 이 회사의 정책입니다"로 바꾸고, "일반적으로 알려진 통신사 정책과 달라도" 구절을 "알고 있는 일반 지식과 달라도 제공된 FAQ를 따릅니다"로 바꿈 |
| 확인 경로 안내 문장이 보류 답변 끝에 근거 없는 꼬리를 붙임 (자료에 없는 경로 24 → 134, 추측 표현 71건 중 39건이 경로와 같은 문장) | 확인 경로 안내 문장(무엇을 확인할지 · 재조회 방법 · 문서의 확인 경로, 예시 포함)을 **삭제**. "문서에 없는 확인 경로는 만들지 않습니다"는 유지. 되묻기 금지는 그대로 |
| 완결성 문장을 비슷한 문서에도 적용해 무관한 FAQ 내용을 옮김 (HR-0031 "소액결제 한도는 정확히 5,000포인트", SR-0003 결합 할인 금액) | "질문의 답을 담은 FAQ를 쓸 때는 그 FAQ의 답변을 조건·예외·후속 방법까지 빠짐없이 전달" + "질문과 주제가 비슷해도 질문의 답을 담지 않은 FAQ의 내용은 옮기지 않습니다". evidence_ids로 한정하지 않은 이유: PI에서 답한 응답의 절반(46/90)이 evidence_ids를 비움. "제공된 FAQ 모두"로 넓히지 않은 이유: 문항당 제공 3건 중 정답 근거는 PI 1.7 · NC 1.0 · SR·HR 0건 |
| 상식·추측 보충 금지 문장의 따옴표 예시('보통', '일반적으로', '~에 따라 다를 수 있습니다')가 그 표현을 떠올리게 했을 가능성 (늘어난 추측 표현이 바로 이 예시들: "일반적으로" 31 · "달라질 수 있" 29 · "다를 수 있" 10) | 예시를 빼고 "자료에 없는 절차·소요 시간·조건·이유를 일반 상식이나 추측으로 보충하지 않습니다"만 남김 |

그대로 둔 것: 질문 속 요구 문장 복사 금지, HR 범위 밖 기준(status_rules 주의 2), PI 답할 부분 먼저(output_order).

**한 번에 네 가지를 바꿨다.** 꼬리 문장 대응(정체성·확인 경로·추측 예시)과 완결성 대상 한정은 모두 환각을 겨냥하므로, SR·HR·PI 환각이 줄어도 어느 쪽 효과인지 가를 수 없다.

## 3. 테스트 항목 (try1)

| 항목 | 선택 방식 | 기대하는 방향 |
|---|---|---|
| PI | 항목당 100건 서브셋 (v1·v2와 같은 문항) | 정답 유지(v4_t1b 56), 환각 감소(51 → v4_t1 25 근처) |
| SR · HR | 항목당 100건 서브셋 | 정답 회복(78 → 96, 80 → 87), 환각 감소(47 → 20, 39 → 24 근처) |
| NC · MC | 오답 위주 100건씩 (`case_sets/ncmc-focus.txt`, v1·v2와 같은 목록) | 누락 감소 유지 |

- 합계 500건. NC·MC 목록의 정답률은 항목 정답률이 아니다 — 짝 비교에만 쓴다.
- v2에서 뺀 항목: **AD**(이번 변경과 직접 관련 없음 — 처리 완료 복사는 프롬프트로 두 번 실패해 출력 검사로 넘길 예정). CE · CF · UI · AR · EC · MT · PS · RT는 v2와 같은 이유로 제외.
- **건너뛴 결정론 단계**(`test.config.js` `pipeline.skip`): 정답 유사도(`score_answer_similarity`) · NLI 근거(`score_rag_grounding`) · 반복 일관성(`score_repeat_consistency`). 프롬프트 비교 문서에서 쓰지 않는 지표다 — 정확도·환각은 Judge로 보고, NLI는 느리며 Judge 환각과 겹치고, 반복 일관성은 RT 항목이 없어 대상이 없다. 남긴 단계: 형식·성능 · 기대 상태 · 근거 채택 · 표현 규칙 · 통합 CSV · run 보고서.

## 4. 실행 순서

`try1/results/raw/logs/run_all_pv3.sh`가 아래를 차례로 실행한다.

```bash
T="--test prompts_test_v3 --try try1"
LIST=prompts_test_v3/try1/case_sets/ncmc-focus.txt

# 1. 생성 (run_all_pv3.sh는 여기와 2의 매니페스트까지만 실행한다)
node scripts/run/run_item.js qwen3:4b PI,HR,SR --size 100 $T --variant v4_t1c
node scripts/run/run_item.js qwen3:4b NC,MC --size 200 --ids-file $LIST $T --variant v4_t1c

# 2. 배치 매니페스트 (로컬 작업 — 루브릭을 담지 않는다)
node scripts/judge/build_batch_manifest.js --batch pv3-try1 $T --runs <위 2개 run_id>

# 3. LLM Judge — 따로 실행(외부 전송 — 사용자 승인 필요). PATH에 codex가 없으면 LLM_JUDGE_CODEX_BIN을 지정한다(prompts_test_v1/SETUP.md 4절).
node scripts/judge/judge_prepare.js --batch pv3-try1 $T
node scripts/judge/judge_run.js --batch pv3-try1 $T --confirm-external --concurrency 8
node scripts/docgen/judge_report.js --batch pv3-try1 $T

# 4. 짝 비교 -> results/llm_judge/pv3-try1_variant_compare.md (기준 v4_t1b)
node scripts/docgen/compare_variants.js --batch pv3-try1 $T --base v4_t1b --base-from prompts_test_v2/try1/pv2-try1
node scripts/docgen/judge_review_export.js --batch pv3-try1 $T
```

## 5. 결과 위치

`prompts_test_v1`·`v2`와 같은 구조다.

```
prompts_test_v3/try1/
├── case_sets/ncmc-focus.txt          # NC·MC 오답 위주 목록 (v1·v2와 같음)
└── results/
    ├── raw/<run_id>/ · raw/scored/<run_id>/ · report/ · llm_judge/ · summary/
```

run_id 예: `local-win_qwen3-4b_t0_nothink_fixed_n100_v4_t1c_20261007_PI-HR-SR`.

## 6. 알려진 한계

- Judge 루브릭은 되묻기를 건수로만 세고(asks_user) 감점하지 않으며, 본문의 FAQ ID 노출도 감점하지 않는다.
- 항목당 100건이라 정확도 판정 노이즈(반복 간 1.7%, 100문항당 ±2건)보다 작은 변화는 판단하지 않는다.
- 남은 누락 중 "관련 정책·조회 정보 확인 필요"처럼 입력에 없는 일반 안내는 정답 예시·Judge 기준 쪽 문제다(v2 v2_change_effects 2-0c).
