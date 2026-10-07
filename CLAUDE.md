# CLAUDE.md — 작업 재개용 메모

이 프로젝트에서 다시 작업을 시작할 때 이 파일부터 읽으세요. 전체 방법론/설계 이유는 [`README.md`](README.md)에 있고, 이 파일은 **"지금 어디까지 했고 다음에 뭘 해야 하는지"**만 빠르게 파악하기 위한 진행 상황 스냅샷입니다.

## 마지막 작업일: 2026-10-06

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
