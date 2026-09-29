# model_test_v1 — 테스트 항목 · 라운드별 스크립트 · 실행 순서

1차 테스트(test1). 9개 로컬 모델에 대해 **FAQ 답변 생성(Easy/Medium/Hard)** 과 **RAG 안정성(Small/Medium/Large)** 라운드를 돌리고, Claude Code 헤드리스 Judge로 채점했다. 설계 이유·프롬프트 템플릿·Judge 구성은 루트 [README.md](../README.md) 부록 5~10절에 있다.

| try | 내용 | 결과 요약 |
|---|---|---|
| try1 | 2026-09-10~11 · 로컬 Windows · 9개 모델 · 6개 라운드 실행(의도 분류·클러스터 라벨링 미실행) | [try1/results/all_summary.md](try1/results/all_summary.md) |

## 1. 테스트 항목

| # | 라운드 | 항목 | 모델당 건수 | 데이터 (`data/eval_sets/test_set1/`) | 상태 |
|---|---|---|---|---|---|
| 1 | FAQ 답변 생성 | Easy — 직접 표현 | 9 | `faq_easy.csv` | ✅ |
| 2 | FAQ 답변 생성 | Medium — 구어체·간접 표현 | 9 | `faq_medium.csv` | ✅ |
| 3 | FAQ 답변 생성 | Hard — 장문·경쟁 FAQ | 9 | `faq_hard.csv` | ✅ |
| 4 | RAG 안정성 | Small — 컨텍스트 2~3개, 7유형 × 3건 | 21 | `rag_stability_small.csv` | ✅ |
| 5 | RAG 안정성 | Medium — 컨텍스트 3~5개, 7유형 × 3건 | 21 | `rag_stability_medium.csv` | ✅ |
| 6 | RAG 안정성 | Large — 컨텍스트 10개, 7유형 × 3건 | 21 | `rag_stability_large.csv` | ✅ |
| 7 | 의도 분류 | FAQ_RAG / MAP_API / UNREGISTERED | 113 | `intent_classification.csv` | 미실행 (러너 없음) |
| 8 | 클러스터 라벨링 | 20건 → 4그룹 라벨·요약 | 4그룹 | `cluster_labeling.csv` | 미실행 (러너 없음) |

- 실행분 합계: **모델당 90건(FAQ 27 + RAG 63) × 9모델 = 810건**
- RAG 안정성 7유형: HR 무관 FAQ · EC 빈 컨텍스트 · CF 모순 FAQ · PI 부분 정보 · SR 유사하지만 답 없음 · NC 정답+노이즈 · MC 다중 FAQ 조합
- FAQ 라운드는 `data/faq.csv`(마스터 FAQ 100건)에서 `Primary GT` FAQ를 조회해 컨텍스트를 만들고, RAG 안정성은 CSV의 `제공 Context`를 그대로 쓴다.
- 평가 기준: Claude Judge(정답률 = 정확도 4점 이상, 환각률 = faithful=false, RAG Pass/Fail, 표현 1~5) → 결정론(키워드 커버리지·ROUGE-L·숫자 검증·포맷) → 계측(Latency·TPS)

## 2. 테스트 순서

모든 명령은 **저장소 루트**에서 실행한다. 결과 try는 `LLM_TEST_TRY`로 고른다(미설정 시 `try1`). Ollama와 Claude Code CLI(`claude`)가 설치돼 있어야 한다.

```bash
# FAQ 답변 생성 라운드 (easy → medium → hard)
node model_test_v1/scripts/run_round.js easy              # 1. 모델 호출         -> results/raw/faq_easy.jsonl
node model_test_v1/scripts/score_deterministic.js easy    # 2. 보조지표 계산     -> results/raw/faq_easy.scored.jsonl
node model_test_v1/scripts/judge_round.js easy            # 3. Claude Judge 채점 -> results/llm_judge/faq_easy.judged.jsonl
node model_test_v1/scripts/aggregate_faq_round.js easy    # 4. 결과 문서 갱신    -> results/report/faq_easy_results.md

# RAG 안정성 라운드 (small → medium → large, 순서 무관)
node model_test_v1/scripts/run_rag_stability_round.js small
node model_test_v1/scripts/score_rag_stability.js small
node model_test_v1/scripts/judge_rag_stability_round.js small
node model_test_v1/scripts/aggregate_rag_stability_round.js small

# 전체 종합 요약
node model_test_v1/scripts/generate_summary.js            # -> results/summary/summary_results.md
```

그다음 `results/all_summary.md`(항목·건수·평가 기준 → Judge 우선 전체 요약 → 항목별 요약)를 갱신한다.

## 3. 라운드별 스크립트

| 라운드 | 1. 모델 호출 | 2. 결정론 채점 | 3. Judge 채점 | 4. 결과 문서 |
|---|---|---|---|---|
| FAQ Easy/Medium/Hard | `run_round.js <easy\|medium\|hard>` | `score_deterministic.js` (키워드·ROUGE-L·숫자) | `judge_round.js` (정확도·충실도·표현) | `aggregate_faq_round.js` |
| RAG 안정성 Small/Medium/Large | `run_rag_stability_round.js <small\|medium\|large>` | `score_rag_stability.js` (숫자·고유명사) | `judge_rag_stability_round.js` (케이스별 Pass/Fail) | `aggregate_rag_stability_round.js` |
| 종합 | — | — | — | `generate_summary.js` |

단계를 나눈 이유: 기준이 바뀌었을 때 앞 단계(모델 호출)를 다시 돌리지 않고 그 단계부터 재실행하기 위해서다. 집계 스크립트는 문서의 `## 모델별 결과` 아래만 다시 쓰므로 `사람평가` 칸은 덮어써지지 않는다.

공통 모듈 `scripts/lib/`: `paths.js`(경로) · `csv.js` · `ollama.js` · `metrics.js`(결정론 지표) · `judge.js`(헤드리스 Claude) · `prompts.js`(모델 목록·답변 생성 프롬프트)

## 4. 결과 위치

```
model_test_v1/try1/results/
├── all_summary.md                         # ⭐ 전체 요약
├── raw/        faq_<round>.jsonl · .scored.jsonl · rag_stability_<tier>.jsonl · .scored.jsonl
├── llm_judge/  faq_<round>.judged.jsonl · rag_stability_<tier>.judged.jsonl
├── report/     faq_<round>_results.md · faq_rag_stability_<tier>_results.md · intent_classification_results.md · cluster_labeling_results.md
└── summary/    summary_results.md
```

## 5. 알려진 한계

- 정답률 임계값(Judge 4점 이상)은 임의로 정한 값이다.
- 라운드당 9~21건이라 모델 간 1~2건 차이가 10%p 이상으로 보인다.
- 의도 분류·클러스터 라벨링은 데이터만 있고 러너가 없다. v2 이후 범위에서 제외됐다.
