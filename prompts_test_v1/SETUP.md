# prompts_test_v1 — 프롬프트 튜닝 1차 · 테스트 항목 · 실행 순서

v4 try1 기준선([all_summary](../model_test_v4/try1/results/all_summary.md))에서 확인한 qwen3:4b OFF의 오답 원인을 상담봇 프롬프트로 고치고, 같은 문항끼리 수정 전후를 비교한다. 데이터·항목·모델·생성 조건·Judge는 `model_test_v4`와 같다(`test.config.js`가 v4 설정을 그대로 가져온다). 엔진은 루트 `scripts/`를 그대로 쓰고, 실행할 때 `--test prompts_test_v1`을 준다.

## 1. 목표

- 대상: `qwen3:4b` OFF(temperature 0). 2026-10-07에 gemma3:4b 대신 튜닝 대상으로 정했다([결정 근거](../model_test_v4/try1/results/summary/tuning_target_decision.md)) — 오답의 1/3 이상(352/962)이 답할 수 있는데 본문에서 보류한 과잉 보류였고(gemma3:4b는 32/908), 실제로 답했을 때의 정답률은 qwen3:4b가 더 높았다(77.0% vs 69.9%).
- 비교: v4 try1(EC2, `v4_base`) 결과를 기준선으로 쓰고 `v4_t1`(1차 수정안)만 로컬에서 생성한다(2026-10-07 결정 — 기준선은 이전 지표로 본다).
- **환경 차이가 섞인다.** 같은 `v4_base`로 로컬(Ollama 0.35.1, RTX 4060 Ti)에서 다시 생성한 399건(UI·CE·PI 100건, SR 99건)을 EC2 try1과 비교하면 답변 문장 완전 일치 110건(27.6%), status·evidence_ids 일치 373건(93.5%)이었다. 항목별 변화가 몇 %p 수준이면 환경 차이와 구분되지 않으니, 큰 변화(과잉 보류·되묻기·ID 노출 감소 등)를 중심으로 본다. 이 399건은 `raw/local-win_qwen3-4b_t0_nothink_fixed_n100_20261007_PI-CE-UI-AR-AD-SR-HR-EC-CF/`에 미완료 run으로 남아 있다.
- 판정: LLM Judge(v4와 같은 루브릭·모델) 후 같은 문항끼리 정답/오답이 바뀐 건수를 항목별로 본다.

## 2. 프롬프트 안 (`prompts/chatbot/variants.json`)

| 안 | 구성 | 출력 순서 |
|---|---|---|
| `v4_base` | base · status_rules · output_order | evidence_ids → status → answer |
| `v4_t1` | base_t1 · status_rules_t1 · output_order_t1 | evidence_ids → status → answer |
| `v4_t2`·`v4_t3` | t1 + 출력 순서만 변경 | evidence_ids → answer → status / answer → evidence_ids → status — **아직 실행 불가**(구조화 출력 키 순서가 config 하나로 고정) |

`v4_t1`에서 바꾼 것과 이유는 각 `*_t1.md` 맨 위 주석에 있다. 요약:

| 겨냥한 문제 (try1 qwen3:4b) | 변경 |
|---|---|
| 계산 가능한 질문을 "근거 없음"으로 보류 (기대 ANSWER→ABSTAIN 486건, 전부 evidence_ids 빈 배열) | 계산·비교로 구할 수 있으면 답하고 결론을 쓴다 / 근거 정의에 계산 기준 문서 포함 / 빈 근거→ABSTAIN 연결 문장 삭제 |
| PI에서 답할 수 있는 부분까지 보류 (ABSTAIN 본문 보류 121건) | 주의 1 범위 축소("질문 전체가 그 값 하나만 물을 때"), PARTIAL은 근거 있는 부분을 직접 설명, 주의 5 삭제 |
| 되묻기로 답을 대신함 (되묻기 오답 352건) | 되묻기 금지, 조건이 갈리면 문서의 조건을 그대로 안내. 예외: API 입력(위치 동의·주소) |
| 본문에 FAQ ID 노출 (666건) | answer에 FAQ 번호·문서 ID 금지(evidence_ids에만). "문서 A/B"는 CF 정답 예시가 쓰는 이름이라 허용 |
| 관리자 사칭 받아쓰기 5건 · 처리 완료 주장 5건 | 사칭 주장을 사실로 쓰지 않기, 요청받아도 처리 완료라고 말하지 않기 |
| 날짜를 "미래일"이라며 판단 거부 7건 | 질문·조회 결과의 기준 시각을 현재로 본다 |

## 3. 테스트 항목 (try1)

| 구분 | 항목 | 선택 방식 | 기대하는 방향 |
|---|---|---|---|
| 개선 목표 | PI | 항목당 100건 서브셋 | 과잉 보류 → 부분 답변 |
| | CE · UI · AR | 항목당 100건 서브셋 | 계산을 보류하지 않고 결론 제시, 받은 정보 재요청 없음 |
| | AD | 항목당 100건 서브셋 | 과잉 거부 감소, 처리 완료·사칭 UNSAFE 감소 |
| | NC · MC | **오답 위주 100건씩** (`case_sets/ncmc-focus.txt`) | 되묻기·필수 사실 누락 감소 |
| 정답 유지 확인 | SR · HR · EC | 항목당 100건 서브셋 | 보류가 정답인 문항의 정답률 유지 |
| | CF | 항목당 100건 서브셋 | CONFLICT 정의 수정 후에도 정답률 유지 |

- NC·MC 목록은 try1 EC2 qwen3:4b Judge 결과에서 오답 60%를 목표로 뽑았다(NC 오답 60 + 정답 40, MC 오답 47 전부 + 정답 53). **이 목록의 정답률은 항목 정답률이 아니다** — 수정 전후 짝 비교에만 쓴다. `scripts/run/build_case_set.js`로 다시 만들 수 있다(seed 고정).
- 뺀 항목: MT·PS·RT(이번 변경과 직접 관련이 적음).

## 4. 실행 순서

```bash
T="--test prompts_test_v1 --try try1"
LIST=prompts_test_v1/try1/case_sets/ncmc-focus.txt

# 1. 생성 — v4_t1만: 서브셋 9항목(900건) + NC·MC 목록(200건). 기준선은 v4 try1(EC2)을 쓴다.
node scripts/run/run_item.js qwen3:4b PI,CE,UI,AR,AD,SR,HR,EC,CF --size 100 $T --variant v4_t1
node scripts/run/run_item.js qwen3:4b NC,MC --size 200 --ids-file $LIST $T --variant v4_t1

# 2. LLM Judge (외부 전송 — 사용자 승인 필요). 항목을 제한한 run이라 --runs를 꼭 준다.
#    이 PC에는 PATH에 codex가 없다(spawn codex ENOENT). Codex 앱이 설치한 CLI를 지정한다 — 앱 업데이트 때 해시 폴더가 바뀐다:
#    export LLM_JUDGE_CODEX_BIN="C:/Users/pc/AppData/Local/OpenAI/Codex/bin/<해시>/codex.exe"   (2026-10-07: f544b3844e0f14e9, codex-cli 0.160.0)
#    ChatGPT 구독 사용량 한도에 걸리면 403 "usage limit"로 멈춘다 — 한도가 풀린 뒤 같은 명령을 다시 실행하면 남은 건만 채점한다.
node scripts/judge/build_batch_manifest.js --batch pv1-try1 $T --runs <위 2개 run_id>
node scripts/judge/judge_prepare.js --batch pv1-try1 $T
node scripts/judge/judge_run.js --batch pv1-try1 $T --confirm-external --concurrency 8
node scripts/docgen/judge_report.js --batch pv1-try1 $T

# 3. 짝 비교 -> results/llm_judge/pv1-try1_variant_compare.md
node scripts/docgen/compare_variants.js --batch pv1-try1 $T --base-from model_test_v4/try1/v4-try1-n200
```

NC·MC 목록은 200건 서브셋 기준 ID라 `--size 200`으로 실행한다(목록 밖 ID가 섞이면 실행 전에 멈춘다).

## 5. 결과 위치

`model_test_v4`와 같은 구조다.

```
prompts_test_v1/try1/
├── case_sets/ncmc-focus.txt          # NC·MC 오답 위주 목록
└── results/
    ├── raw/<run_id>/ · raw/scored/<run_id>/ · report/ · llm_judge/ · summary/
```

run_id 예: `local-win_qwen3-4b_t0_nothink_fixed_n100_v4_t1_20261007_PI-CE-UI-AR-AD-SR-HR-EC-CF` — `--variant`가 기본(`v4_base`)과 다르면 안 이름이, `--ids-file`이면 `ids-<파일 이름>`이 붙는다. `run_info.json`의 `runtime`에 Ollama 버전·모델 digest·양자화가 기록된다.

## 6. 알려진 한계

- Judge 루브릭은 되묻기를 건수로만 세고(asks_user) 감점하지 않으며, 본문의 FAQ ID 노출도 감점하지 않는다. 두 변경의 효과는 정답률이 아니라 별도 집계(되묻기 건수·ID 노출 건수)로 본다.
- 9항목은 항목당 100건 서브셋이라 항목 정답률은 v4 try1(200건, EC2)과 표본·환경이 다르다.
- API 필드 이름(`remaining_installment_principal_krw` 등)을 본문에 노출하는 문제는 v4_t1에서 다루지 않았다(다음 수정 후보).
