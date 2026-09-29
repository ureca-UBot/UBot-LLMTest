# LLM_Test — FAQ 챗봇용 로컬 LLM 선정 테스트

## 목차

1. [프로젝트 목적](#1-프로젝트-목적)
2. [파일 구조](#2-파일-구조)
3. [테스트 이력 — 무엇을 테스트했고 결과는 어땠나](#3-테스트-이력--무엇을-테스트했고-결과는-어땠나)
4. [새 테스트를 진행할 때 지켜야 할 점](#4-새-테스트를-진행할-때-지켜야-할-점)
5. [부록 — v1(test1) 설계·실행 기록](#부록--v1test1-설계실행-기록)

---

## 1. 프로젝트 목적

이 레포는 **FAQ 챗봇 시스템에 실제로 탑재할 로컬 LLM을 고르기 위한 기술 검증(기술 선정) 테스트 하네스**입니다.

우리 서비스는 사용자의 질문에 대해 적절한 FAQ를 찾아, 그 내용을 상황에 맞는 자연어로 답변해주는 챗봇입니다. 이 레포는 그중 **LLM이 담당하는 부분만** 떼어내어, 여러 후보 로컬 모델 중 어떤 모델이 실제 서비스에 적합한지 **같은 데이터·같은 기준으로 직접 돌려 정량 비교**합니다. 파라미터 수 같은 스펙만으로는 다음을 판단할 수 없기 때문입니다.

- FAQ 원문을 자연스러운 한국어 상담 답변으로 재구성하는 능력
- 주어진 근거 없이 정보를 지어내는(환각) 경향, 근거가 없을 때 "모른다"고 답하는 능력
- 조건·예외·충돌·대화 이력 같은 복합 상황의 판단
- 지정된 출력 포맷을 안정적으로 지키는 능력
- 실제 챗봇에 쓸 수 있을 만큼의 응답 속도와 리소스

**테스트 범위와 원칙**

- **임베딩 모델·벡터 검색은 평가 대상이 아닙니다.** 매칭된 FAQ(제공 Context)를 받아 LLM이 무엇을 하는지만 평가합니다.
- **후보 모델은 로컬 전용입니다.** Ollama로 구동되는 무료/오픈소스 모델만 후보로 둡니다.
- **채점(Judge)에는 외부 API 사용이 허용됩니다.** "외부 API 금지"는 서비스 품질을 결정하는 요소(후보 LLM)에만 적용되고, 품질을 판단만 하는 채점자는 예외입니다(v1: Claude Code 헤드리스, v2·v3: gpt-6-astra).

## 2. 파일 구조

2026-09-28에 **테스트 버전(`model_test_vN`) → 회차(`tryN`) → `results`** 구조로 개편했습니다. 각 회차는 `results/all_summary.md`에서 시작하면 됩니다. 개편 전 경로(`results/...`, `scripts/testN/...`)는 버전별 `PATH_MAP.csv`에 대응표가 있습니다.

```
LLM_Test/
├── README.md                               # 이 문서 — 목적 · 구조 · 테스트 이력 · 새 테스트 규칙
├── CLAUDE.md                               # 작업 재개용 메모
├── data/                                   # 버전 공통 데이터
│   ├── raw/                                # 원본 엑셀 (EmbeddingTestFAQ.xlsx, faq_rag_stability_expanded_63.xlsx, FAQ_RAG_300문항_반복40개_총380회 등)
│   ├── faq.csv · intent_guide.csv          # 마스터 FAQ(100건) · 의도 카테고리 정의
│   └── eval_sets/
│       ├── test_set1/                      # v1: faq_easy/medium/hard, rag_stability_small/medium/large, intent_classification, cluster_labeling
│       └── test_set2/                      # v2·v3: cases.csv(380행), faq_master.csv, item_review.md(문항 적합성 검토)
├── model_test_v1/                          # 1차 테스트 (test1)
│   ├── SETUP.md                            # 테스트 항목 · 라운드별 스크립트 · 테스트 순서
│   ├── PATH_MAP.csv                        # 개편 전 → 개편 후 경로
│   ├── scripts/                            # run_round · score_deterministic · judge_round · aggregate_* · generate_summary, lib/
│   └── try1/results/
│       ├── all_summary.md                  # ⭐ 회차 전체 요약
│       ├── raw/                            # 모델 응답 · 결정론 채점 jsonl
│       ├── report/                         # 라운드별 세부 결과 md
│       ├── llm_judge/                      # Judge 채점 jsonl
│       └── summary/                        # 요약·비교 문서
├── model_test_v2/                          # 2차 테스트 (test2, 13개 항목 380건, 로컬)
│   ├── SETUP.md · PATH_MAP.csv
│   ├── scripts/                            # run_all_models · run_pipeline · score_* · LLM Judge · rounds/(13개 항목 + 반복)
│   ├── try1/results/                       # all_summary.md · raw/(+scored/) · report/ · llm_judge/ · summary/
│   └── try2/results/                       # 〃 (llm_judge/inputs · runs 포함)
└── model_test_v3/                          # 3차 테스트 (test3, 같은 380건, EC2)
    ├── SETUP.md · PATH_MAP.csv
    ├── scripts/                            # v2 채점 스크립트 복사본 + run_round · run_think_ablation · run_temp_control · rounds/
    └── try1/results/                       # all_summary.md · dashboard.html · raw/(+scored/, logs/) · report/ · llm_judge/ · summary/
```

## 3. 테스트 이력 — 무엇을 테스트했고 결과는 어땠나

| 버전·회차 | 날짜·환경 | 무엇을 테스트했나 | 간단한 결과 | 전체 요약 |
|---|---|---|---|---|
| **v1 try1** (test1) | 2026-09-10~11 · 로컬 Windows | 9개 모델(Qwen3 0.6B~8B · EXAONE 3.5 2.4B/7.8B · Gemma3 270M~4B) × FAQ 답변 생성 Easy/Medium/Hard 27건 + RAG 안정성 7유형 63건 · Claude Judge 전수 | Qwen3 4B만 FAQ 전 난이도 정답률 100%·환각 0%. RAG 안정성은 Qwen3 8B 74.6% · Qwen3 4B 69.8% · Gemma3 4B 68.3% 순이고, 컨텍스트 10개(Large)에서는 Qwen3 4B가 1위로 역전. FAQ에서 강했던 Qwen3 0.6B는 RAG 안정성 17.7%로 하위권 | [all_summary](model_test_v1/try1/results/all_summary.md) |
| **v2 try1** (test2) | 2026-09-17 · 로컬 RTX 4070 Ti | 데이터셋을 **13개 항목 · 고유 300 + 반복 80 = 380건**으로 재설계, 응답에 기대 상태(status) 판단 추가. 9개 모델 3,420건 · 결정론 채점 + AI 표본 재판단 | `qwen3:4b`가 기대 상태 일치 83.0% · 부재 F1 0.795 · AI 재판단 96.2%로 1위(평균 9.5s). Gemma3 270M/1B는 포맷 성공률 25~36%로 탈락. **5개 모델 1차 선별** | [all_summary](model_test_v2/try1/results/all_summary.md) |
| **v2 try2** (test2 V2) | 2026-09-18 · 로컬 RTX 4070 Ti | 선별 5개 모델(`qwen3:4b` `qwen3:8b` `exaone3.5:7.8b` `qwen3:1.7b` `gemma3:4b`) 재실행 + **LLM Judge 전수 채점**(내용 1,500 · 안전성 75) | `qwen3:4b` 정확도 72.0% · 근거율 86.0%로 1위지만 P95 29.2s. `exaone3.5:7.8b`는 정확도 51.7%인데 환각률 51.3%로 최고. 결정론 지표는 try1과 거의 같아 순위 재현 | [all_summary](model_test_v2/try2/results/all_summary.md) |
| **v3 try1** (test3) | 2026-09-20 · EC2 Tesla T4 | 같은 380건 · **temperature 0** · 7개 모델(선별 5 + `gemma3:12b` `qwen3:14b`) + Qwen3 추론 OFF 4개 + temperature 0.8 대조군 · LLM Judge 전수 | **1차 MVP로 `qwen3:14b` 추론 OFF 선정**(정확도 70.7% · 근거율 76.3% · P95 8.1s). 정확도 1위 `qwen3:14b` ON 75.6%, 근거율 1위 `qwen3:4b` ON 86.3%(P95 47.6s). temperature 0으로 반복 일관성 대폭 개선 | [all_summary](model_test_v3/try1/results/all_summary.md) |

## 4. 새 테스트를 진행할 때 지켜야 할 점

### 4-1. 버전과 회차를 먼저 정한다

| 상황 | 위치 |
|---|---|
| 데이터셋·평가 항목·채점 방식·실행 환경/생성 설정이 바뀜 | 새 버전 `model_test_v{N+1}/` (스크립트 복사 후 수정) |
| 같은 버전의 스크립트·데이터로 다시 돌림(모델 교체·재실행·Judge 추가 등) | 같은 버전의 새 회차 `try{N+1}/` — 스크립트는 버전 단위로 공유 |

### 4-2. 폴더 구조와 파일명

```
model_test_vN/
├── SETUP.md                     # 필수 (4-4절)
├── scripts/                     # 필수 — 버전 단위, try끼리 공유 (4-3절)
└── tryM/results/
    ├── all_summary.md           # 필수 — 이름 고정 (4-5절)
    ├── raw/<run_id>/generation.jsonl        # 모델 원본 응답 — 생성 후 수정 금지
    ├── raw/scored/<run_id>/                 # 결정론·Judge 채점 결과 (*.jsonl, *_summary.json, review.csv)
    ├── raw/logs/                            # 실행 로그
    ├── report/                  # 세부 테스트 결과 md — run별 <run_id>_summary.md, 항목별 faq_<코드>_results.md, 배치 매니페스트 <batch>.json
    ├── llm_judge/               # Judge 보고서 · inputs/<batch>/ · runs/<batch>/
    └── summary/                 # 요약·비교 문서 (snake_case.md), 표 CSV, charts/
```

- **run_id**: `<env>_<모델 태그의 :·.을 ->_<조건>_<YYYYMMDD>` — 예) `ec2-linux_qwen3-14b_t0_nothink_20260920`. 항목별 라운드는 끝에 `_<항목 코드>`를 붙인다(예: `_CE`).
- **항목 코드**: SF · NC · MC · UI · CE · PI · SR · HR · EC · CF · MT · AD · AR (13개) + RP(반복). 항목별 세부 문서는 `report/faq_<코드 소문자>_results.md`.
- 경로를 스크립트에 하드코딩하지 않는다 — v2·v3는 `scripts/lib/suite.js`, v1은 `scripts/lib/paths.js` 한 곳에서 해석하고 try는 `LLM_TEST_TRY` 환경변수로 고른다.
- 이미 커밋된 원본 응답·채점 결과·해시가 기록된 증거 파일(`*manifest*.json`, `validation*.json` 등)은 수정하지 않는다. 옮겨야 하면 `PATH_MAP.csv`에 대응을 남긴다.

### 4-3. 스크립트 종류

`model_test_vN/scripts/`에는 아래 종류가 모두 있어야 한다(이름은 v2·v3 기준).

| 종류 | 예 | 역할 |
|---|---|---|
| 환경 설치 | `setup_env.js` · `bootstrap_ec2.sh` | venv · 의존성 · Ollama 모델 pull (멱등) |
| 데이터 준비 | `prepare_test_set2.js` | 원본 xlsx → `data/eval_sets/test_setN/*.csv` |
| **전체 테스트 스크립트** | `run_all_models.js` · `run_round.js` · `run_pipeline.js` | 모든 항목 × 모델 목록을 한 번에 실행 (생성 → 채점 → 리포트) |
| **항목별 라운드 스크립트** | `rounds/01_SF_single_faq.js` … `rounds/13_AR_api_result.js` · `rounds/14_RP_repeat.js` | 13개 항목 각각 + 반복 라운드를 따로 실행. `NN_<코드>_<slug>.js` 이름 규칙, `--dry-run` 지원 |
| 파이프라인 단계 | `run_generation.js` · `score_*.js` · `build_review_export.js` · `aggregate_report.js` | 단계별 독립 실행 가능(기준이 바뀌면 그 단계부터 재실행) |
| LLM Judge | `prepare_llm_judge_inputs.js` · `run_saved_llm_judge.js` · `build_llm_judge_report.js` | 저장 답변 → Judge 입력 · 채점 · 보고서 (외부 전송 전 승인 필요) |
| 집계·보고서 | `build_results_V2.js` · `compare_rounds.js` · `build_report.js` | summary 문서 · 차트 · HTML 생성 (모델 호출 없음) |
| 설정·공통 모듈 | `config/models.js` · `config/thresholds.js` · `lib/` | 모델 목록 · 임계값 · 경로(`lib/suite.js`) |

> v4부터는 통과/실패 판정과 "AI 재판단 필요"(`score_escalation.js`) 단계를 두지 않는다 — [4-9절](#4-9-평가-방식-v4부터) 참고.

### 4-4. SETUP.md 구조와 필수 내용

버전 폴더마다 `SETUP.md`를 두고 아래 순서로 쓴다.

1. **개요와 try 목록** — 버전의 목적, try별 날짜·환경·내용과 `all_summary.md` 링크
2. **대상 모델**
3. **테스트 항목** — 항목 코드 · 이름 · 고유 문항 수 · 반복 포함 행 수 · 담당 라운드 스크립트, 합계(예: 13개 항목 / 고유 300 / 총 380건), 평가 기준 요약
4. **테스트 순서** — 저장소 루트 기준 실제 명령: 환경 설치 → 데이터 준비 → 사전 점검(`--dry-run`) → 전체/항목별 라운드 → LLM Judge → 집계·보고서 → `all_summary.md` · `result.html` · `README.md` 갱신
5. **라운드별 스크립트 설명** — 전체 스크립트와 항목별 라운드 스크립트 각각의 범위·옵션
6. **결과 위치** — 4-2절 구조 기준 트리, run_id 규칙
7. **알려진 한계**

### 4-5. all_summary.md에 반드시 포함할 내용

`tryM/results/all_summary.md`는 아래 순서를 지킨다. **LLM Judge 지표를 먼저, 결과론적(결정론) 지표를 그다음에** 두고 합산 종합 점수는 만들지 않는다. v4부터 결과론적 지표는 통과율 없이 원래 값(유사도 등)으로만 적는다([4-9절](#4-9-평가-방식-v4부터)).

| 절 | 필수 내용 |
|---|---|
| 서두 | 버전·회차·날짜·환경 한 줄 요약, 이전/다음 버전 all_summary 링크, SETUP 링크 |
| 0. 테스트 개요 | **테스트 항목과 건수**(예: 13개 항목 / 항목별 n건 / 총 380건, 반복 라운드 포함), 실행 규모(모델 × 행 = 응답 수, Judge 채점 수), **평가 기준 표**(LLM Judge · 결과론적 · 계측 구분, 정의, 분모), 실행 조건 |
| 1. 전체 결과 요약 | LLM Judge 표 → 결과론적·계측 표 → 핵심 요약 |
| 2. 이전 버전(또는 이전 try) 대비 변화 | 조건 차이 표, LLM Judge 변화(Δ) → 결과론적 변화, 버전 단위 최고 성능 비교, 해석. 비교가 불가능하면 이유를 적는다 |
| 3. 항목별 성능 요약 + 이전 비교 | 항목 × 모델 한눈에 보기 표, 항목마다 **모든 평가 기준**(Judge + 결과론적 + 지연)과 Δ, 반복 라운드 |
| 4. summary 폴더 문서 요약 | `summary/`의 **모든 문서 링크**와 요약 |
| 5. 세부 결과 경로 | `report/`의 **모든 세부 테스트 md 링크**, llm_judge · raw · SETUP · scripts 경로 |

### 4-6. 문서 간 링크 규칙

- `all_summary.md`는 **`summary/` 안의 모든 요약 문서**와 **`report/` 안의 모든 세부 테스트 문서**로 링크한다.
- `summary/` 안의 각 요약 문서는 **근거가 된 `report/` 세부 문서 링크를 반드시 포함**한다(예: 항목별 비교 문서 → `report/faq_<코드>_results.md`, 모델 비교 → `report/<run_id>_summary.md`).
- 모든 링크는 상대 경로로 쓰고, 커밋 전에 깨진 링크가 없는지 확인한다.

### 4-7. 결과를 반영해야 하는 곳

테스트가 끝나면 아래 세 곳을 갱신한다.

1. **`tryM/results/all_summary.md`** — 4-5절 형식으로 작성
2. **`result.html`** — 저장소 루트의 결과 대시보드에 새 버전·회차 결과를 반영해 업데이트한다(주요 지표 표·차트, 각 all_summary 링크). 참고 형식: [v3 dashboard.html](model_test_v3/try1/results/dashboard.html)
3. **`README.md`** — 3절 "테스트 이력" 표에 한 줄 추가(무엇을 테스트했는지 요약 · 간단한 결과 · all_summary 링크)하고, 폴더가 늘었으면 2절 파일 구조도 갱신

### 4-8. 그 밖의 주의

- 외부 LLM Judge에 저장 답변을 보내기 전에 승인을 받는다.
- 채점 로직을 고치면 같은 스크립트를 복사해 쓰는 다른 버전(현재 v2 ↔ v3)에도 반영 여부를 확인한다.
- 수치는 저장된 원본에서 다시 집계해 쓰고, 표본 검수와 전수 채점을 구분해 표기한다.

### 4-9. 평가 방식 (v4부터)

v2·v3의 결과론적 평가는 **임계값 기반 통과/실패**(예: 유사도·키워드를 모두 넘어야 정답 통과, 근거 지지율 기준 faithful 여부)와 **"AI 재판단 필요"(escalation) 표시**를 함께 썼다. 다음 버전부터는 아래처럼 바꾼다.

| 구분 | v2·v3 (기존) | v4부터 |
|---|---|---|
| 결과론적 정확도 | 유사도 + 키워드가 임계값을 넘으면 통과 → 통과율 | **정답 예시와의 유사도 점수 자체**로 정확도를 본다(평균·분포·항목별 평균). 통과/실패 없음 |
| 그 밖의 결과론적 지표 | 품질·RAG 충실도 등도 임계값으로 통과/실패 | 임계값 판정 없이 **원래 값**(점수·비율·평균)으로만 보고 |
| AI 재판단 필요 | `score_escalation.js`가 신호 불일치·경계값으로 재확인 대상을 표시 | **두지 않는다** (단계·컬럼 모두 제거) |
| LLM Judge | try2부터 전수 채점을 추가로 붙임 | **항상 별도 단계로 전수 채점**. 결과론적 지표와 합치거나 서로 판정을 보정하지 않는다 |

- 새 버전 스크립트를 v3에서 복사해 만들 때: `score_escalation.js` 단계와 `review.csv`의 재판단 컬럼을 빼고, `score_*`의 `pass` 판정·통과율 집계와 `config/thresholds.js`의 통과 임계값을 쓰지 않는다.
- all_summary·summary 문서의 결과론적 표에는 통과율·"결합 통과" 열을 두지 않는다. 정확도 판단은 LLM Judge 절에서 하고, 결과론적 절은 유사도 등 측정값을 보여준다.
- v2·v3 결과를 읽을 때는 위 "기존" 방식으로 채점됐다는 점을 감안한다(기존 결과와 스크립트는 그대로 둔다).

---

## 부록 — v1(test1) 설계·실행 기록

아래는 1차 테스트(v1) 설계 당시의 기록입니다. 평가 프레임워크·프롬프트·Judge 구성의 출발점이며, v2부터는 각 버전의 `SETUP.md`와 `all_summary.md`를 기준으로 합니다.

### 부록 4. 테스트 대상 모델

가장 낮은 파라미터부터 최대 8B까지, 3개 모델 패밀리 총 9개 모델을 비교합니다.

| 패밀리 | 크기 | Ollama 태그 |
|---|---|---|
| Qwen3 | 0.6B | `qwen3:0.6b` |
| Qwen3 | 1.7B | `qwen3:1.7b` |
| Qwen3 | 4B | `qwen3:4b` |
| Qwen3 | 8B | `qwen3:8b` |
| EXAONE 3.5 | 2.4B | `exaone3.5:2.4b` |
| EXAONE 3.5 | 7.8B | `exaone3.5:7.8b` |
| Gemma3 | 270M | `gemma3:270m` |
| Gemma3 | 1B | `gemma3:1b` |
| Gemma3 | 4B | `gemma3:4b` |

> Gemma3 270M은 "가장 낮은 파라미터부터"라는 조건에 맞춰 포함했습니다. 범위를 8개로 줄이고 싶다면 이 모델을 제외하면 됩니다.

### 부록 5. 평가 프레임워크 (9개 영역)

| # | 평가 영역 | 핵심 질문 | 측정 방법 | 채점 방식 |
|---|---|---|---|---|
| 1 | 답변 정확도 | FAQ 내용을 정확히 이해하고 답하는가? | LLM Judge + 키워드 커버리지 + ROUGE-L, 수동평가 | Judge + 결정론적 보조지표 |
| 2 | RAG 충실도 | 주어진 FAQ만 근거로 답하는가? | Faithfulness(Judge), Hallucination Rate, 숫자/고유명사 검증 | Judge + 결정론적 보조지표 |
| 3 | FAQ 부재 판단 | FAQ에 없는 질문에 억지로 답하지 않는가? | Precision / Recall / F1 | 결정론적 |
| 4 | 의도 분류 | 사용자 질문의 의도(`FAQ_RAG`/`MAP_API`/`UNREGISTERED`)를 정확히 분류하는가? | Accuracy, Macro-F1 | 결정론적 |
| 5 | 표현 품질 | 자연스러운 한국어 상담 답변인가? | 자연스러움, 명확성, 친절성 | Judge 필요 |
| 6 | 명령 수행 능력 | 지정 형식으로 안정적으로 출력하는가? | Format Success Rate | 결정론적 |
| 7 | 성능 | 실제 채팅 서비스에 충분히 빠른가? | TTFT, TPS, 전체 Latency | 결정론적 (계측) |
| 8 | 리소스 요구량 | 서비스 규모에서 감당 가능한가? | VRAM/RAM 사용량, 모델 크기·양자화 | 결정론적 (계측) |
| 9 | 클러스터 라벨링 | FAQ 부재 질문 묶음에 적절한 라벨/요약을 붙이는가? | 라벨 정확도(Judge), 라벨 환각 여부, 문자열 유사도 기반 라벨 구분력 | Judge + 결정론적 보조지표 |

클러스터링(그룹 나누기) 자체는 임베딩이 담당하고, LLM은 이미 만들어진 그룹에 라벨/요약만 붙이는 역할로 한정합니다.

> 항목 4의 의도 카테고리는 `data/intent_guide.csv` 기준입니다: `FAQ_RAG`(등록 FAQ로 답변), `MAP_API`(위치·지도 데이터 필요), `UNREGISTERED`(FAQ 근거 부족, 답변 보류), `UNREGISTERED_CLUSTERING`(미등록 질의 중 클러스터링 대상으로 수집). 분류 채점 시 `UNREGISTERED_CLUSTERING`은 `UNREGISTERED`와 같은 클래스로 취급합니다(3-way 분류: FAQ_RAG/MAP_API/UNREGISTERED). `_CLUSTERING` 접미사는 해당 건이 항목 9(클러스터 라벨링) 데이터로도 쓰인다는 태그일 뿐입니다.

### 부록 6. 진행 순서

전체 9개 항목을 한 번에 다 보지 않고, 아래 순서로 나눠서 진행합니다.

1. **1차: FAQ 답변 생성 라운드** — 항목 1·2·5·6·7 (답변 정확도 / RAG 충실도 / 표현 품질 / 명령 수행 / 성능)
   - Easy/Medium/Hard: **실행 완료** (9개 모델 × 9케이스씩)
   - RAG 안정성(Small/Medium/Large): 컨텍스트 개수(3/5/10개)별로 문서 3개 분리 (7-2절 참고) — **전부 실행 완료**
2. **2차: 의도 판단 라운드 (데이터 준비 완료, 미실행)** — 항목 3·4 (FAQ 부재 판단 / 의도 분류). `data/eval_sets/test_set1/intent_classification.csv`로 진행
3. **3차: 클러스터 라벨링 라운드 (데이터 준비 완료, 미실행)** — 항목 9. `data/eval_sets/test_set1/cluster_labeling.csv`로 진행

항목 8(리소스 요구량)은 모델별 고정 속성이라 별도 라운드 없이 모델 프로필 표에 기록합니다.

### 부록 7. 평가 데이터

원본은 `data/raw/EmbeddingTestFAQ.xlsx` (임베딩 검색 테스트용으로 먼저 만들어졌던 파일을 재사용). 이 중 이번 LLM 테스트에 맞게 정리한 파일은 다음과 같습니다.

| 파일 | 원본 시트 | 용도 |
|---|---|---|
| `data/faq.csv` | FAQ | 마스터 FAQ 지식베이스 (100건: ID/카테고리/질문/답변/권장 처리 의도/세부 의도) |
| `data/intent_guide.csv` | Intent 가이드 | 의도 카테고리 4종 정의 및 판정 기준 (테스트 데이터 아님, 참고용) |
| `data/eval_sets/test_set1/faq_easy.csv` | Retrieval Easy | 1차 라운드 - Easy 테스트 케이스 10건 (FAQ_RAG 9 + MAP_API 1) |
| `data/eval_sets/test_set1/faq_medium.csv` | Retrieval Medium | 1차 라운드 - Medium 테스트 케이스 10건 (FAQ_RAG 9 + MAP_API 1) |
| `data/eval_sets/test_set1/faq_hard.csv` | Retrieval Hard | 1차 라운드 - Hard 테스트 케이스 10건 (FAQ_RAG 9 + MAP_API 1) |
| `data/eval_sets/test_set1/rag_stability_small.csv` | RAG 안정성 63건 (Small) | 항목 2(RAG 충실도) 전용 시나리오 21건 — 컨텍스트 2~3개 (7유형×3건) |
| `data/eval_sets/test_set1/rag_stability_medium.csv` | RAG 안정성 63건 (Medium) | 항목 2(RAG 충실도) 전용 시나리오 21건 — 컨텍스트 3~5개 (7유형×3건) |
| `data/eval_sets/test_set1/rag_stability_large.csv` | RAG 안정성 63건 (Large) | 항목 2(RAG 충실도) 전용 시나리오 21건 — 컨텍스트 10개 (7유형×3건) |
| `data/eval_sets/test_set1/cluster_labeling.csv` | 미등록 클러스터링 | 항목 9(클러스터 라벨링) 전용 — 미등록 질의 20건 + 정답 클러스터(4개 그룹) |
| `data/eval_sets/test_set1/intent_classification.csv` | (통합) | 항목 3·4용 통합 데이터셋 — 위 7개 파일에서 처리 의도가 라벨된 113건을 하나로 모음 |

#### 부록 7-1. RAG 안정성 테스트를 컨텍스트 개수별로 3개 파일로 나눈 이유

처음엔 유형당 3건(21건)으로 시작했는데, 표본이 너무 적어서(유형당 증거 3개뿐) 신뢰하기 어렵다는 문제가 있었습니다 (자세한 논의는 커밋 이력 참고). 그래서 유형당 9건(63건)으로 늘리면서, 동시에 **"실제 서비스에서는 벡터 검색 top-k가 3개일 수도 10개일 수도 있다"**는 점을 반영해 컨텍스트(후보 FAQ) 개수를 3단계(Small=2~3개, Medium=3~5개, Large=10개)로 다양화했습니다. 9개 모델 × 63건이면 한 번에 돌리기엔 부담이 커서, 난이도 단계별로 파일 자체를 3개(`rag_stability_small/medium/large.csv`)로 분리했습니다 — 실행도 독립적으로 가능하고, 결과 문서(`faq_rag_stability_{small,medium,large}_results.md`)도 각각 따로 봅니다.

Easy/Medium/Hard(답변 생성 난이도)와 RAG 안정성 Small/Medium/Large(컨텍스트 개수 난이도)는 **서로 다른 축**입니다 — 헷갈리지 않도록 구분해서 봐야 합니다.

#### 부록 7-2. Easy/Medium/Hard를 임베딩 시트에서 재활용해도 되는 이유

Easy/Medium/Hard 시트는 원래 **임베딩 검색 랭킹(Top-1 정답률) 검증용**으로 설계됐습니다. `Acceptable FAQ`, `Hard Negative FAQ` 컬럼이 그 증거이고, 이 컬럼들은 랭킹 문제라 이번 LLM 단독 평가에서는 **사용하지 않습니다**.

이 레포에서는 "임베딩이 정답 FAQ를 이미 올바르게 찾아줬다"고 가정하고, **User Query + Ground Truth FAQ 원문만 LLM에 제공한 뒤 생성한 답변의 품질만 평가**하는 방식으로 재활용합니다. 원래 설계 목적(임베딩이 헷갈려하는 정도)은 안 쓰지만, 난이도가 올라가면서 같이 딸려오는 두 가지 특성이 우연히 **LLM 생성 난이도**로도 그대로 유효합니다.

- **표현 방식**: Easy는 FAQ 문구와 거의 겹치는 직접 표현, Medium/Hard는 구어체·상황 묘사·동의어로 에둘러 말함 → LLM이 간접적인 질문 의도를 얼마나 잘 이해하는지 테스트 (순수 LLM 능력)
- **경쟁 FAQ(주의分산 요소)**: Hard로 갈수록 한 질문 안에 여러 연관 개념(분실+회선정지, 번호이동+기기변경, 로밍+Wi-Fi 등)이 섞여 있어 비슷한 FAQ로 오답할 여지가 큼 → 실제로 물어본 것에 정확히 대응하는 FAQ 하나에 집중해서 답하는 능력을 테스트 (RAG 검색과 무관한 순수 생성 능력)

즉 "임베딩이 어려워하는 이유"와 "LLM이 어려워하는 이유"는 다르지만, 난이도 라벨(Easy/Medium/Hard) 자체는 두 목적 모두에 우연히 들어맞아서 그대로 재사용합니다.

### 부록 8. Judge (채점자) 구성

- 채점자: Claude Code 헤드리스 호출 (Pro 사용량 내)
- 후보 모델이 스스로를 채점하지 않도록, 모든 모델에 **동일한 고정 Judge**를 적용
- 절대 점수보다 **정답(Ground Truth FAQ 원문) 대조 채점**을 우선
- 환각 여부는 점수에 섞지 않고 **환각률(%)로 별도 집계** — 특정 임계치를 넘으면 다른 점수와 무관하게 "부적합" 표시

#### 부록 8-1. 결정론적 보조 지표 (무료, 규칙 기반)

LLM Judge 하나에만 판단을 맡기지 않고, 비용 없이 재현 가능한 규칙 기반 지표를 **같이** 계산해서 나란히 표기합니다. 임베딩·API가 필요 없는 것만 채택했습니다.

| 지표 | 적용 항목 | 계산 방식 |
|---|---|---|
| 키워드/사실 커버리지 (%) | 답변 정확도 | 정답 FAQ 답변에서 핵심 명사·숫자·조건을 미리 추출해두고, 생성 답변에 몇 %가 포함됐는지 문자열 매칭으로 계산 |
| n-gram 중복도 (ROUGE-L) | 답변 정확도 | 정답 답변과 생성 답변의 최장 공통 부분열 기반 재현율/정밀도 |
| 숫자/고유명사 존재 검증 | RAG 충실도 | 생성 답변에 등장하는 모든 숫자·금액·고유명사가 제공된 FAQ/컨텍스트 원문에 실제로 있는지 정규식 대조. 없으면 환각 후보로 플래그 |
| 문자열 중복/유사도 체크 | 클러스터 라벨 구분력 | 모델이 생성한 클러스터 라벨들끼리 Jaccard 유사도·편집 거리를 계산해, 서로 다른 클러스터에 지나치게 비슷한 라벨이 붙었는지 확인 |

이 지표들은 패러프레이즈(같은 뜻, 다른 표현)를 놓칠 수 있다는 한계가 있어 **LLM Judge/사람 평가를 대체하지 않고 보조 신호로만 사용**합니다. 임베딩 기반 의미 유사도는 원래 "임베딩 제외" 원칙과 결이 달라 이번엔 채택하지 않았습니다.

#### 부록 8-2. 사람(운영자) 평가 병행

LLM Judge가 채점하는 항목(1·2·5·9)은 **사람이 개별 건마다 별도로 직접 판단**합니다. 이건 소량 calibration set으로 Judge를 검증하는 것과는 별개로, **모든 테스트 케이스 하나하나에 대해** 결과 문서에 사람 의견을 남길 수 있는 칸을 둡니다.

- 결과 문서의 모델별 표에는 `사람 평가(의견)` 컬럼이 있고, 테스트 케이스마다 자유 텍스트로 의견을 남깁니다 (Judge 판정에 동의/이견 모두 기록)
- 모델별 결과 하단에는 해당 모델 전체에 대한 사람 총평 칸도 별도로 둡니다
- Judge와 사람 판단이 다를 경우, **최종 판단은 사람 의견을 우선**합니다. 이 차이가 누적되면 Judge 프롬프트/기준을 보정하는 데 사용합니다

### 부록 9. 프롬프트 템플릿

세 라운드 모두 시스템 프롬프트 + 사용자 턴으로 구성하고, 출력은 JSON 고정 포맷으로 받습니다(항목 6 포맷 성공률 채점 기준과 직결). 모든 후보 모델에 **동일한 프롬프트**를 사용합니다.

#### 부록 9-1. FAQ 답변 생성 (1차 라운드: Easy/Medium/Hard/RAG 안정성 공통)

**시스템 프롬프트**
```
당신은 통신사 고객센터 챗봇입니다. 아래 제공된 FAQ 내용만 근거로 사용자 질문에 친절하고 자연스러운 한국어 존댓말로 답변하세요.

규칙:
1. 제공된 FAQ에 없는 내용(금액, 기간, 절차 등)을 추가하거나 추측하지 마세요.
2. 제공된 FAQ가 없거나, 질문과 무관하거나, 서로 모순되는 경우 솔직하게 답변할 수 없다고 안내하세요.
3. 여러 FAQ가 제공된 경우 실제로 질문과 관련된 FAQ만 사용하고, 관련 없는 FAQ는 무시하세요.
4. 답변은 아래 JSON 형식으로만 출력하세요. 다른 텍스트를 앞뒤에 추가하지 마세요.

출력 형식:
{
  "answer": "사용자에게 보여줄 답변 텍스트",
  "grounded": true | false,
  "used_faq_ids": ["FAQ-028"]
}

- answer: 실제 답변 문장
- grounded: 제공된 FAQ만으로 충분히 답할 수 있었는가 (모르겠다고 답했다면 false)
- used_faq_ids: 답변에 실제로 사용한 FAQ ID 목록 (없으면 빈 배열)
```

**사용자 턴**
```
[사용자 질문]
{user_query}

[참고 FAQ]
{context_block}
```
`context_block`은 케이스별로 채웁니다: FAQ 1개면 `FAQ-028: 카테고리 - Q: ... A: ...` 한 줄, 여러 개면 줄바꿈 나열, 빈 컨텍스트면 `(제공된 FAQ 없음)`, 모순 FAQ는 `A: ... / B: ...` 그대로.

`answer`는 항목 1·5(정답률/표현품질) 채점 대상, JSON 형식 자체가 항목 6(포맷 성공률) 채점 기준입니다. `grounded`/`used_faq_ids`는 항목 2(RAG 충실도) 채점의 보조 신호로 사용합니다.

#### 부록 9-2. 의도 분류 (2차 라운드)

FAQ 컨텍스트 없이 사용자 질문만 주고 3-way로 분류합니다.

**시스템 프롬프트**
```
당신은 통신사 챗봇의 의도 분류기입니다. 사용자 질문을 보고 아래 세 가지 중 하나로 분류하세요.

- FAQ_RAG: 등록된 FAQ를 검색해서 답변할 수 있는 일반적인 서비스/이용 관련 질문
- MAP_API: 현재 위치, 가까운 매장, 영업 여부 등 지도·위치 데이터가 필요한 질문
- UNREGISTERED: 위 두 경우에 해당하지 않거나, 기존 FAQ로 답변하기에 정보가 부족한 질문

주의사항:
1. 질문에 "위치", "가까운", "지금 있는 곳" 같은 표현이 있어도, 실제로 필요한 정보가 FAQ로 커버되는 주제(예: 로밍 요금 자체)라면 FAQ_RAG로 분류하세요. 지도·거리 계산이 실제로 필요한 경우만 MAP_API입니다.
2. 판단이 애매한 질문은 UNREGISTERED로 분류하세요. FAQ_RAG나 MAP_API로 억지로 끼워 맞추지 마세요.

출력은 아래 JSON 형식으로만 답하세요.
{
  "intent": "FAQ_RAG" | "MAP_API" | "UNREGISTERED",
  "reason": "분류 이유 한 문장"
}
```

**사용자 턴**
```
{user_query}
```

`intent` 필드가 `intent_classification_results.md`의 Confusion Matrix에 바로 들어가는 예측값입니다. `reason`은 오답 사례를 사람이 검토할 때 참고용으로만 씁니다.

#### 부록 9-3. 클러스터 라벨링 (3차 라운드)

이미 같은 그룹으로 묶인 질문 목록을 주고, 그룹 전체를 대표하는 라벨과 요약을 받습니다. 4개 그룹 각각에 대해 1회씩 호출합니다.

**시스템 프롬프트**
```
당신은 고객센터 관리자 대시보드에 쓰일 미등록 질의 클러스터 라벨링 도우미입니다. 아래는 기존 FAQ로 답변하지 못했던 사용자 질문들을 이미 같은 주제로 묶어놓은 그룹입니다. 이 그룹 전체를 대표하는 짧은 라벨과 한 줄 요약을 작성하세요.

규칙:
1. 라벨은 2~6단어 내외의 명사구로, 그룹 내 질문들의 공통 주제를 정확히 나타내야 합니다.
2. 그룹에 없는 내용을 요약에 추가하지 마세요 (질문에 실제로 나온 내용만 반영).
3. 그룹 내에 다소 다른 뉘앙스의 질문이 섞여 있다면, 가장 많은 질문을 포괄하는 라벨을 선택하세요.
4. 출력은 아래 JSON 형식으로만 답하세요.

{
  "label": "그룹을 대표하는 짧은 라벨",
  "summary": "그룹 내용을 요약하는 한 문장"
}
```

**사용자 턴**
```
다음은 같은 그룹으로 묶인 질문들입니다.
1. {question_1}
2. {question_2}
...
```

`label`/`summary`가 `cluster_labeling_results.md`의 "생성 라벨"/"생성 요약" 컬럼에 들어가고, 같은 모델이 생성한 4개 `label`을 서로 비교해 라벨 구분력(문자열 유사도)을 계산합니다.

### 부록 10. 실행 파이프라인 (스크립트)

`model_test_v1/scripts/`에 있는 test1 자동화 스크립트는 4단계 파이프라인을 각각 독립된 스크립트로 나눠서 구현했습니다. **한 스크립트로 합치지 않고 단계를 쪼갠 이유**: 각 단계 소요 시간·실패 가능성이 달라서(모델 호출은 몇 분~수십 분, Judge는 비교적 빠름), 한 단계가 실패하거나 기준이 바뀌었을 때 **앞 단계를 다시 안 돌리고 그 단계부터만 재실행**할 수 있어야 하기 때문입니다. 실제로 오늘 Judge 프롬프트를 고친 뒤 `model_test_v1/scripts/judge_round.js`만 재실행하고 `model_test_v1/scripts/run_round.js`(모델 호출)는 다시 안 돌렸습니다.

```
model_test_v1/scripts/        (v1 = test1 파이프라인)
├── lib/
│   ├── csv.js          # CSV 파서
│   ├── ollama.js        # Ollama REST API 클라이언트
│   ├── metrics.js        # 결정론적 보조 지표 4종
│   ├── judge.js          # 헤드리스 Claude Judge 호출 (FAQ 라운드용 + RAG 안정성용)
│   └── prompts.js        # 모델 목록 + 답변생성 시스템 프롬프트 (공통, README 9-1절)
├── run_round.js               # FAQ 라운드 1단계: 모델 호출 → results/raw/faq_<round>.jsonl
├── score_deterministic.js     # FAQ 라운드 2단계: 보조지표 계산 → *.scored.jsonl
├── judge_round.js             # FAQ 라운드 3단계: Judge 채점 → *.judged.jsonl
├── aggregate_faq_round.js     # FAQ 라운드 4단계: results/faq_<round>_results.md 표 갱신
├── run_rag_stability_round.js       # RAG 안정성 1단계: 모델 호출 → results/raw/rag_stability_<tier>.jsonl
├── score_rag_stability.js           # RAG 안정성 2단계: 숫자/고유명사 검증 → *.scored.jsonl
├── judge_rag_stability_round.js     # RAG 안정성 3단계: Pass/Fail Judge 채점 → *.judged.jsonl
└── aggregate_rag_stability_round.js # RAG 안정성 4단계: results/faq_rag_stability_<tier>_results.md 표 갱신
```

FAQ 라운드(Easy/Medium/Hard)와 RAG 안정성 라운드(Small/Medium/Large)는 스크립트를 공유하지 않고 **평행한 4단계 파이프라인을 각각 따로** 둡니다 — 이유는 10-5절 참고.

#### 부록 10-1. 각 모듈을 이렇게 만든 기준

| 모듈 | 선택 | 이유 |
|---|---|---|
| `lib/csv.js` | 라이브러리 대신 직접 구현 (RFC4180 유사 파서) + BOM 스트립 | 무료·로컬·제로 디펜던시 원칙(2절). 따옴표 안에 콤마 포함된 필드(예: `"FAQ-052, FAQ-054"`)가 실제 데이터에 있어 단순 `split(',')`로는 깨짐. **BOM 스트립은 실행 중 발견한 버그 수정** — PowerShell이 CSV를 `Encoding.UTF8`로 저장하면 파일 앞에 BOM이 붙어서 첫 컬럼명(`ID`, `FAQ ID`)이 안 읽히는 문제가 있었음 (Easy 라운드 1차 실행이 이 버그로 전부 무효였음) |
| `lib/ollama.js` | `ollama run` CLI 대신 REST API(`/api/chat`)를 직접 호출 | API 응답에 `total_duration`/`load_duration`/`eval_count`/`eval_duration`이 구조화되어 와서 항목7(성능) 지표 계산에 필요. CLI stdout은 이 수치를 안 줌. `format:"json"` 옵션으로 출력을 JSON으로 강제해서 항목6(포맷 성공률) 측정과 직결시킴 |
| `lib/metrics.js` | 4개 지표 모두 외부 라이브러리 없이 직접 구현 | README 8-1절 원칙(무료·로컬) 그대로 코드화. 키워드 매칭은 정확한 형태소 분석 대신 **부분 문자열(`includes`) 매칭**을 씀 — 한국어 조사 처리를 위해 형태소 분석기(Mecab 등)를 쓰려면 Java/바이너리 설치가 필요해 이번 프로젝트 취지에 안 맞다고 판단. ROUGE-L은 단어 단위 대신 **문자 단위 LCS**로 구현 — 한국어는 띄어쓰기 기준 단어 분리가 신뢰도가 낮아서(조사 결합), 문자 단위가 더 안정적 |
| `lib/judge.js` | `claude -p`를 헤드리스로 호출, 프롬프트는 **stdin으로 전달** (커맨드라인 인자 아님) | 8절에서 정한 "Judge=Claude Code 헤드리스, Pro 사용량" 그대로 구현. 인자 대신 stdin을 쓴 이유는 한국어·특수문자·긴 텍스트가 섞인 프롬프트를 셸 인자로 넘기면 이스케이프 문제가 생기기 쉬워서. Windows에서 `claude.cmd`(npm 전역 설치 시 생기는 실행 래퍼)를 Node가 직접 실행 못 해서 `shell:true`가 필요했음(Windows Node.js의 알려진 제약) |
| `lib/prompts.js` | 모델 목록·시스템 프롬프트를 `model_test_v1/scripts/run_round.js`/`model_test_v1/scripts/run_rag_stability_round.js`가 공유하는 모듈로 분리 | 원래 `model_test_v1/scripts/run_round.js` 안에 인라인으로 있던 걸 RAG 안정성 러너를 추가하면서 뽑아냄 — 두 러너가 같은 상수를 각자 복붙하면 나중에 프롬프트를 고칠 때 한쪽만 고치고 잊어버리는 사고가 나기 쉬워서 |

#### 부록 10-2. 실행 중 발견해서 고친 것 (참고용)

- **CSV BOM 문제**: 위 표 참고. `parseCsv()`가 이제 파일 시작의 BOM을 자동으로 제거합니다.
- **Judge 응답 파싱 실패 (2가지 패턴)**: (1) 가끔 응답을 \`\`\`json 코드블록으로 감싸서 반환 → `stripCodeFence()`로 방어. (2) 모델이 출력 스키마를 그대로 복사한 것 같은 완전히 망가진 답변(예: `"answer": "사용자에게 보여줄 답변 텍스트"` 그대로 출력)을 채점시키면 Judge가 채점을 거부하고 설명 텍스트를 냄 → 프롬프트에 "실패작이어도 낮은 점수로 반드시 JSON만 출력" 지시를 명시해서 해결.

#### 부록 10-3. 집계 스크립트의 판단 기준

`model_test_v1/scripts/aggregate_faq_round.js`가 표를 채울 때 정한 규칙:

- **정답률(%)**: Judge의 `answer_accuracy`(1~5점) 중 **4점 이상을 "정답"으로 간주**해 비율을 냅니다. 이 임계값은 제가 임의로 정한 것이라 조정 가능합니다 — 더 엄격하게 하려면 5점만 정답으로 칠 수도 있습니다.
- **환각률(%)**: Judge의 `faithful`이 `false`인 비율.
- 결측/포맷실패 케이스는 요약 통계 계산에서 제외하고 표에는 "포맷실패"로 표시해 눈에 띄게 남깁니다.
- 이 스크립트는 `## 모델별 결과` 마커 아래쪽만 다시 씁니다 — 개요/테스트 케이스/채점 기준 설명은 손대지 않고 그대로 둡니다. **표를 손으로 고치면 다음 실행 때 덮어써지니, 표 내용을 바꾸고 싶으면 스크립트나 원본 데이터를 고치세요** (단, `사람평가`/`사람 총평` 칸은 스크립트가 항상 빈 칸으로 두므로 자유롭게 손으로 채워도 덮어써지지 않습니다).

#### 부록 10-4. 실행 방법 — FAQ 라운드 (Easy/Medium/Hard)

```
node model_test_v1/scripts/run_round.js easy              # 1. 모델 호출
node model_test_v1/scripts/score_deterministic.js easy    # 2. 보조지표 계산
node model_test_v1/scripts/judge_round.js easy            # 3. Judge 채점
node model_test_v1/scripts/aggregate_faq_round.js easy    # 4. 결과 문서 갱신
```
`easy`를 `medium`/`hard`로 바꾸면 해당 라운드로 동일하게 실행됩니다.

#### 부록 10-5. RAG 안정성 전용 파이프라인 (Small/Medium/Large)

FAQ 라운드 스크립트를 그대로 재사용하지 못하고 **별도 스크립트 세트를 만든 이유**는 데이터 구조와 채점 기준이 근본적으로 다르기 때문입니다.

| 구분 | FAQ 라운드 (Easy/Medium/Hard) | RAG 안정성 (Small/Medium/Large) |
|---|---|---|
| 컨텍스트 생성 | `Primary GT` FAQ ID로 `data/faq.csv`를 조회해서 원문 조립 | `rag_stability_*.csv`의 `제공 Context` 컬럼을 **그대로 사용** (이미 완성된 텍스트 — 무관 FAQ 설명, `EMPTY`, `A:.../B:...` 모순 등 형식이 케이스마다 다름) |
| 정답 판정 | 정답 FAQ 원문과 **대조**해서 1~5점 채점 (`answer_accuracy`) | 케이스마다 다른 **"기대 행동"/"실패 조건"**을 지켰는지 **Pass/Fail** 채점 (정답 텍스트 자체가 없음) |
| 결정론적 보조지표 | 키워드 커버리지 + ROUGE-L + 숫자검증 3종 (정답 텍스트와 비교) | 숫자/고유명사 검증만 (비교할 정답 텍스트가 없어서 키워드·ROUGE는 적용 불가) |
| Judge 프롬프트 | `buildJudgePrompt` — 고정 루브릭(정확도/충실도/표현품질) | `buildRagStabilityJudgePrompt` — **케이스별 가변 루브릭** (그 케이스의 기대 행동·실패 조건을 프롬프트에 그대로 삽입) |

실행 방법은 FAQ 라운드와 동일한 4단계 패턴입니다.

```
node model_test_v1/scripts/run_rag_stability_round.js small              # 1. 모델 호출
node model_test_v1/scripts/score_rag_stability.js small                  # 2. 숫자/고유명사 검증
node model_test_v1/scripts/judge_rag_stability_round.js small             # 3. Pass/Fail Judge 채점
node model_test_v1/scripts/aggregate_rag_stability_round.js small          # 4. 결과 문서 갱신
```
`small`을 `medium`/`large`로 바꾸면 해당 난이도로 동일하게 실행됩니다. 세 티어는 서로 완전히 독립된 데이터/결과 파일이라 순서 상관없이, 원하는 것만 골라 돌려도 됩니다.

**검증**: `gemma3:270m`으로 EC-01(빈 컨텍스트) 1건을 실제로 돌려 파이프라인 전체(모델 호출 → Judge 채점)를 확인했습니다. 모델이 출력 스키마를 그대로 복사한 망가진 답변을 냈는데, Judge가 이를 정확히 `pass:false`로 판정하고 이유까지 명확히 설명했습니다.

### 부록 11. 결과 문서

| 문서 | 내용 | 상태 |
|---|---|---|
| [`model_test_v1/try1/results/summary/summary_results.md`](model_test_v1/try1/results/summary/summary_results.md) | **전체 6개 라운드 종합 요약** (FAQ Easy/Medium/Hard + RAG 안정성 Small/Medium/Large, 유형별 상세 포함) — `model_test_v1/scripts/generate_summary.js`로 자동 생성 | ✅ 실행 완료 |
| [`model_test_v1/try1/results/report/faq_easy_results.md`](model_test_v1/try1/results/report/faq_easy_results.md) | Easy 난이도 모델별 결과 | ✅ 실행 완료 |
| [`model_test_v1/try1/results/report/faq_medium_results.md`](model_test_v1/try1/results/report/faq_medium_results.md) | Medium 난이도 모델별 결과 | ✅ 실행 완료 |
| [`model_test_v1/try1/results/report/faq_hard_results.md`](model_test_v1/try1/results/report/faq_hard_results.md) | Hard 난이도 모델별 결과 | ✅ 실행 완료 |
| [`model_test_v1/try1/results/report/faq_rag_stability_small_results.md`](model_test_v1/try1/results/report/faq_rag_stability_small_results.md) | RAG 안정성(컨텍스트 2~3개) 모델별 결과 | ✅ 실행 완료 |
| [`model_test_v1/try1/results/report/faq_rag_stability_medium_results.md`](model_test_v1/try1/results/report/faq_rag_stability_medium_results.md) | RAG 안정성(컨텍스트 3~5개) 모델별 결과 | ✅ 실행 완료 |
| [`model_test_v1/try1/results/report/faq_rag_stability_large_results.md`](model_test_v1/try1/results/report/faq_rag_stability_large_results.md) | RAG 안정성(컨텍스트 10개) 모델별 결과 | ✅ 실행 완료 |
| [`model_test_v1/try1/results/report/intent_classification_results.md`](model_test_v1/try1/results/report/intent_classification_results.md) | 의도 분류(항목 3·4) 모델별 결과 | 미실행 |
| [`model_test_v1/try1/results/report/cluster_labeling_results.md`](model_test_v1/try1/results/report/cluster_labeling_results.md) | 클러스터 라벨링(항목 9) 모델별 결과 | 미실행 |

### 부록 13. TODO

- [x] Ollama에 9개 후보 모델 설치 (`gemma3:12b`는 계획에 없던 추가 설치, 이번 테스트 대상에서는 제외)
- [x] 프롬프트 템플릿 확정 (답변 생성/의도 분류/클러스터 라벨링 — 9절 참고)
- [x] 결정론적 보조 지표 계산 스크립트 작성 (10절 참고)
- [x] Easy → Medium → Hard 9개 모델 실행 및 결과 문서 채우기
- [x] RAG 안정성 케이스 유형당 3건→9건(63건)으로 확대, 컨텍스트 개수(3/5/10) 난이도 분리 — 데이터만 준비, 미실행
- [x] RAG 안정성 전용 4단계 파이프라인 작성 (`model_test_v1/scripts/run_rag_stability_round.js` 등 4종 — 10-5절 참고), 1건 스모크 테스트로 동작 확인
- [x] RAG 안정성 Small → Medium → Large 순으로 9개 모델 실행 및 결과 문서 채우기
- [ ] 사람 채점 calibration set 소량 확보 후 Judge 신뢰도 검증 추가
- [ ] 의도 판단 라운드(항목 3·4) 9개 모델 실행 및 결과 문서 채우기
- [ ] 클러스터 라벨링 라운드(항목 9) 9개 모델 실행 및 결과 문서 채우기
- [ ] Easy/Medium/Hard `사람평가`/`사람 총평` 칸 검토 및 채우기
