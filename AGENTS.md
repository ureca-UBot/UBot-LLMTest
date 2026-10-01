# AGENTS.md — 작업 재개용 메모

이 프로젝트에서 다시 작업을 시작할 때 이 파일부터 읽으세요. 전체 방법론/설계 이유는 [`README.md`](README.md)에 있고, 이 파일은 **"지금 어디까지 했고 다음에 뭘 해야 하는지"**만 빠르게 파악하기 위한 진행 상황 스냅샷입니다.

## 마지막 작업일: 2026-10-01

## 저장소 구조 (2026-09-28 개편, 2026-09-30 공통 엔진 추가)

```
data/                         # 버전 공통 데이터 (eval_sets/test_set1 = v1, test_set2 = v2·v3, test_set3 = v4~)
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

## 현재 상태 (2026-09-30)

- v3 try1에서 **1차 MVP 모델로 `qwen3:14b` 추론 OFF(temperature 0)** 선정 (`model_test_v3/try1/results/summary/model_selection.md`). 최종 확정 아님.
- **v4(test4) 준비 중 — 저급 모델 튜닝 전 기준선(레거시)**. 대상은 `qwen3:4b` OFF · `gemma3:4b`이고, 튜닝 한계가 확인되면 `qwen3:8b` OFF로 넘어간다. 데이터는 `test_set3`(15개 항목 × 200 = 3,000건, 50/100/150 중첩 서브셋)이고, 상담봇 프롬프트는 `v4_base`(**CLARIFY 상태 없음 — 되묻기는 ABSTAIN/PARTIAL 안에서, Judge가 asks_user로 건수만 집계**, `prompts/chatbot/` — 공통 문단 + 근거 기준 status 판정 + 출력 순서 `evidence_ids → status → answer`, 순서는 구조화 출력으로 강제)이다. Judge 루브릭 `v4-judge-6`: 정답률은 답변 문장만 보고 판정하고, 정답+상태·정답+근거·정답+근거+상태를 따로 집계한다. **Judge는 OpenAI API 호출**(`lib/judge/providers/openai.js`)이고 **판정 모델은 미정**(`judge.model: null` — 정하기 전엔 `judge_run.js`가 멈춤). **프롬프트는 모두 `prompts/`(chatbot·judge·docgen), 스크립트는 `scripts/`(run·score·judge·docgen·lib)에 용도별로 둔다** — 판정 단계와 문서 생성 단계는 스크립트·프롬프트를 섞지 않는다.
  - 공통 엔진과 `model_test_v4/test.config.js` · `SETUP.md`는 작성 완료다. 스모크 테스트(생성 → 채점 → 보고서, Judge는 가짜 CLI로 배관만 검증)까지 확인했다. **본 라운드와 LLM Judge는 아직 실행하지 않았다.**
  - 임베딩 검색 적용 테스트(`contextMode: 'retrieval'`, `FAQ_RAG_3000건_사전Context제거_*.xlsx`)는 미구현이다.
  - Judge 프롬프트 압축(2026-10-01, `v4-judge-5`): accuracy의 행동 정의를 공통화하고 정확도·환각 경계의 중복과 상황별 지침을 줄였다. `reasoning`은 한국어 1~2문장 요약이며 상세 누락·모순·환각은 기존 배열에 모두 기록한다. 평가 항목·출력 스키마는 유지한다. 이전 배치와 섞지 않고 새 배치로 준비한다.
  - 표현 품질 범위 축소(2026-10-01, `v4-judge-6` / `v4-schema-5`): 전수 accuracy Judge의 표현 지침·`expression_quality`·보고서 표현 /5를 제거했다. v3 모델 평균은 4.23~4.79지만 개별 답변의 4점 미만은 t0 3,297건 중 197건(5.98%), v4 대상과 같은 두 설정은 600건 중 72건(12%)이다. 표현 규칙 검사는 유지하고 자연스러움 점수의 대체로 해석하지 않는다. 별도 페르소나 준수·안전성은 유지한다. v2·v3 결과는 수정하지 않는다.
  - 결정(2026-10-01): 표현 규칙(v4 공통 엔진)에서 "제공된 자료" 실격 패턴을 빼고, 질문 echo 실격은 질문 전체를 되풀이한 경우만으로 좁혔다. 근거 채택 주 기준은 "인용한 문서가 모두 정답 근거 문서이고 하나 이상"(전부 인용은 엄격 기준으로 따로). v2·v3 스크립트는 그대로.
  - 튜닝 보고서(2026-10-01): 사용자용 코드는 **A/B/C = 과대/과소/교차 × 본문 근거 상태(1 정답, 2 잘못된 문서, 3 본문 문서 근거 없음, 4 판정 대상 외)**, D 근거·내용, E 출력 정합, F 문항 검토, S 안전성. `scripts/lib/tuning_codes.js`·`tuning_report.js`, 보고서 0·5절에 반영. 심각도·동반 환각/오적용/누락·항목별 대응 가설을 따로 표시한다. P 경로는 기존 JSON·접힌 진단에 보존. 채점 완료율·미채점·자료 판정 불가·미분류 오답을 분리했다. 검토 메모는 `model_test_v4/TUNING_GUIDE.md`; 로컬 검증은 `node --test scripts/tests/tuning_report.test.js`. 실제 Judge·본 라운드는 실행하지 않았으며 모델은 여전히 미정이다.
  - 판정·문서 생성 역할: accuracy Judge가 정확도·환각과 본문 행동·출처를 판정한다. **출력 status vs 기대 상태(라벨 기준)**와 **Judge의 content_stance vs 기대 상태(본문 기준)**를 각각 계산·비교하며, 튜닝 코드는 본문 기준이다. 보고서 3절에 같은 행의 두 방향 건수·불일치·대표 ID를 표시하고 전체 교차표는 JSON에 보존한다. 문서 생성 AI는 현재 미구현(`prompts/docgen/README.md`); 역할별 스크립트·프롬프트 분리를 유지한다.
- 후속 과제 후보: 동시성 테스트, 프롬프트 비교 테스트, top-k 테스트(모두 v4 기준선과 비교). v2·v3용 `item_review.md` 수정 23문항과 Judge 채점 경계 통일은 test_set2 한정.

---

아래는 **v1(test1) 진행 당시(2026-09-11) 스냅샷**이다. 경로는 개편 전 기준이며 새 경로는 `model_test_v1/PATH_MAP.csv`를 따른다.

## 지금까지 한 일 (v1 당시)

1. **테스트 대상 확정**: Qwen3(0.6B/1.7B/4B/8B), EXAONE 3.5(2.4B/7.8B), Gemma3(270M/1B/4B) 9개 모델, 전부 Ollama에 로컬 설치 완료
2. **평가 프레임워크 9개 영역 확정** + 프롬프트 템플릿 3종 확정 (README 5·9절)
3. **자동화 파이프라인 구축** — 모델 호출(Ollama API) → 결정론적 보조지표 → Judge 채점(Codex 헤드리스) → 결과 문서 자동 집계, 4단계 스크립트 (README 10절)
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
