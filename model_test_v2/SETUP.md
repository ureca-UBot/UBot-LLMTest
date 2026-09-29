# model_test_v2 — 테스트 항목 · 라운드별 스크립트 · 실행 순서

380건(고유 300 + 반복 40문항×3회차) 기준 2차 테스트. 이 버전의 스크립트(`model_test_v2/scripts/`)는 로컬(Windows)/EC2(Linux) 공통이며, 결과는 try 단위로 쌓입니다.

| try | 내용 | 결과 요약 |
|---|---|---|
| try1 | 2026-09-17 · 로컬 · 9개 모델 · 결정론 채점 + AI 표본 재판단 | [try1/results/all_summary.md](try1/results/all_summary.md) |
| try2 | 2026-09-18 · 로컬 · 1차 선별 5개 모델 재실행 · **LLM Judge 전수 채점** | [try2/results/all_summary.md](try2/results/all_summary.md) |

## 목차
1. [테스트 항목](#1-테스트-항목)
2. [테스트 순서](#2-테스트-순서)
3. [라운드별 스크립트](#3-라운드별-스크립트)
4. [디렉터리 구조와 결과 위치](#4-디렉터리-구조와-결과-위치)
5. [스크립트별 상세 설명](#5-스크립트별-상세-설명)
6. [반복 일관성 동작 방식](#6-반복-일관성-동작-방식)
7. [평가 항목 ↔ 스크립트 매핑](#7-평가-항목--스크립트-매핑)
8. [알려진 한계](#8-알려진-한계)

---

## 1. 테스트 항목

데이터: `data/eval_sets/test_set2/cases.csv` (원본 `data/raw/FAQ_RAG_300문항_반복40개_총380회 (1).xlsx`에서 `prepare_test_set2.js`로 생성)

| # | 코드 | 항목(유형) | 고유 문항 | 반복 포함 행 | 라운드 스크립트 |
|---|---|---|---|---|---|
| 1 | SF | 단일 FAQ 답변 | 18 | 22 | `rounds/01_SF_single_faq.js` |
| 2 | NC | 유사 FAQ 구분·노이즈 | 22 | 28 | `rounds/02_NC_noise_confusion.js` |
| 3 | MC | 다중 FAQ 조합 | 30 | 38 | `rounds/03_MC_multi_faq.js` |
| 4 | UI | 사용자 정보+FAQ | 24 | 34 | `rounds/04_UI_user_info.js` |
| 5 | CE | 조건·예외·경계값 | 24 | 34 | `rounds/05_CE_condition_exception.js` |
| 6 | PI | 부분 정보 | 35 | 41 | `rounds/06_PI_partial_info.js` |
| 7 | SR | 유사하지만 답 없음 | 35 | 39 | `rounds/07_SR_similar_no_answer.js` |
| 8 | HR | 무관 FAQ | 20 | 22 | `rounds/08_HR_irrelevant_faq.js` |
| 9 | EC | 빈 컨텍스트 | 30 | 32 | `rounds/09_EC_empty_context.js` |
| 10 | CF | FAQ 충돌·시행일 | 15 | 23 | `rounds/10_CF_faq_conflict.js` |
| 11 | MT | 멀티턴 대화 | 27 | 37 | `rounds/11_MT_multi_turn.js` |
| 12 | AD | 적대적 입력·범위 밖 | 15 | 23 | `rounds/12_AD_adversarial.js` |
| 13 | AR | API 결과 답변 | 5 | 7 | `rounds/13_AR_api_result.js` |
| 14 | RP | 반복 라운드 (반복 대상 40문항 × 3회차) | 40 | 120 | `rounds/14_RP_repeat.js` |
| | | **합계** | **300** | **380** | `run_all_models.js` / `run_pipeline.js` (전체) |

평가 기준: LLM Judge(내용 정확도·근거율·근거/표현 점수·안전성) → 결과론적(기대 상태 일치·부재 판단 F1·포맷·정답 유사도·키워드·RAG 근거 지지율·표현 규칙·반복 일관성) → 계측(지연·VRAM). 정의는 각 try의 `all_summary.md` 0-2절.

## 2. 테스트 순서

모든 명령은 **저장소 루트**에서 실행합니다. 결과가 쌓일 try는 `LLM_TEST_TRY`로 고릅니다(미설정 시 `try2`).

```bash
# 0. 환경 설치 (최초 1회, 멱등)
node model_test_v2/scripts/setup_env.js --tier local          # 로컬(Windows)
bash model_test_v2/scripts/bootstrap_ec2.sh --tier ec2        # EC2 맨 인스턴스

# 1. (원본 xlsx가 바뀐 경우만) 평가 데이터 CSV 재생성
node model_test_v2/scripts/prepare_test_set2.js

# 2. 생성 + 결정론 채점 — 전체 라운드
LLM_TEST_TRY=try3 node model_test_v2/scripts/run_all_models.js local        # config/models.js의 로컬 9개
LLM_TEST_TRY=try3 node model_test_v2/scripts/run_pipeline.js <run_id> <model_tag>   # 모델 하나

#    또는 항목별 라운드 (예: 모델 하나로 CE만, 반복만)
LLM_TEST_TRY=try3 node model_test_v2/scripts/rounds/05_CE_condition_exception.js <run_id> <model_tag>
LLM_TEST_TRY=try3 node model_test_v2/scripts/rounds/14_RP_repeat.js <run_id> <model_tag>

# 3. LLM Judge (저장 답변을 외부 Judge로 전송 — 실행 전 승인 필요)
#    3-1. 배치 매니페스트(results/report/<batch>.json)를 준비한 뒤
LLM_TEST_TRY=try3 node model_test_v2/scripts/prepare_llm_judge_inputs.js model_test_v2/try3/results/report/<batch>.json
LLM_TEST_TRY=try3 LLM_JUDGE_BATCH=<batch> node model_test_v2/scripts/run_saved_llm_judge.js --concurrency 8

# 4. 보고서 재집계 (모델·Judge 호출 없음)
LLM_TEST_TRY=try3 LLM_JUDGE_BATCH=<batch> node model_test_v2/scripts/build_llm_judge_report.js   # -> results/llm_judge/
LLM_TEST_TRY=try3 LLM_JUDGE_BATCH=<batch> node model_test_v2/scripts/build_results_V2.js         # -> results/summary/

# 5. results/all_summary.md 갱신 (항목·건수·평가 기준 서두, LLM Judge 우선 요약, 이전 try/버전 비교)
```

기존 try2를 재집계하려면 환경변수 없이 4단계 명령만 실행하면 됩니다(기본값 `try2` / `rerun-20260918-1328`).

## 3. 라운드별 스크립트

| 스크립트 | 범위 | 하는 일 |
|---|---|---|
| `run_all_models.js [local\|ec2\|all]` | 전체 380행 × 모델 목록 | `config/models.js` 모델마다 `run_pipeline.js` 호출. run_id `<env>_<모델>_<날짜>` 자동 생성, 한 모델 실패해도 계속 |
| `run_pipeline.js <run_id> <model_tag>` | 전체 380행 × 모델 1개 | 생성 → 9단계 채점 → 리포트까지 원커맨드. `--type` `--difficulty` `--limit` `--skip-repeat` `--repeat-only` 옵션 |
| `rounds/01~13_<코드>_*.js <run_id> <model_tag>` | 해당 항목(유형)만 | `run_pipeline.js --type <유형> --skip-repeat` 호출. run_id 끝에 `_<코드>`를 붙여 전체 라운드 결과와 섞이지 않게 함 |
| `rounds/14_RP_repeat.js <run_id> <model_tag>` | 반복 40문항 × 3회차 | `run_pipeline.js --repeat-only` 호출, 반복 일관성 채점까지 |

`rounds/` 공통 옵션: `--dry-run`(호출할 명령만 출력) · `--run-id-as-is`(코드 접미사 생략) · `--limit N` `--temperature N` `--seed N` `--think true|false`(파이프라인으로 전달). 공통 로직은 `rounds/_run_item.js`.

## 4. 디렉터리 구조와 결과 위치

```
model_test_v2/
├── SETUP.md                          # 이 문서
├── PATH_MAP.csv                      # 2026-09-28 구조 개편 전후 경로 대응표
├── scripts/                          # 버전 단위 스크립트 (try끼리 공유)
│   ├── run_all_models.js · run_pipeline.js · run_generation.js
│   ├── score_*.js · build_review_export.js · aggregate_report.js
│   ├── prepare_llm_judge_inputs.js · run_saved_llm_judge.js · build_llm_judge_report.js · build_results_V2.js …
│   ├── rounds/                       # 13개 항목 + 반복 라운드 스크립트
│   ├── config/ (models.js, thresholds.js) · lib/ · python_nli/
│   └── CODEX_LLM_JUDGE_TASK.md · LLM_JUDGE_20260918.md   # 2026-09-18 Judge 작업 지시서(당시 경로 기준 기록)
└── try1/ · try2/
    └── results/
        ├── all_summary.md            # ⭐ 전체 요약 (여기서 시작)
        ├── raw/<run_id>/generation.jsonl             # 원본 모델 출력 (380행)
        ├── raw/scored/<run_id>/                      # 채점 결과
        │     format_success · performance · answer_accuracy · rag_faithfulness · absence_detection
        │     expression_quality · repeat_consistency · escalation (.jsonl + *_summary.json)
        │     review.csv (사람이 읽을 통합 파일) · accuracy_hallucination_llm.jsonl · safety_llm.jsonl (Judge)
        ├── report/                   # run별 자동 리포트 <run_id>_summary.md, 배치 매니페스트, 항목별 세부 문서
        ├── llm_judge/                # Judge 보고서, inputs/<batch>/(프롬프트·jobs), runs/<batch>/(진행 상태)
        └── summary/                  # 요약·비교 문서, 표 CSV
```

경로는 `scripts/lib/suite.js` 한 곳에서 해석합니다. 집계 수치는 **고유 문항(실행 회차=1, 300건)** 기준이고, 건별 상세(jsonl, review.csv)는 380행 전부 보존됩니다.

> 증거 파일(배치 매니페스트·Judge manifest·publish_manifest 등)의 `source_path`는 개편 전 경로(`results/raw/test2/...`)로 기록돼 있고 SHA-256 보존을 위해 수정하지 않았습니다. 스크립트는 run_id로 현재 경로를 찾습니다. 대응은 `PATH_MAP.csv` 참고.

---

## 5. 스크립트별 상세 설명

### 설치/준비

**`bootstrap_ec2.sh`** — EC2 맨 인스턴스용. Node.js(NodeSource, Ubuntu/Amazon Linux 자동감지) → Python3+venv → Ollama 설치·기동까지 처리한 뒤 `setup_env.js`를 호출. Node가 이미 있는 로컬에서는 필요 없음.

**`setup_env.js`** — Node 기반, OS 공통. `.venv_nli`(Python venv) 생성 + `python_nli/requirements.txt` 설치(Windows는 CPU 전용 torch 인덱스) → Ollama 설치 확인 → `config/models.js`의 해당 티어 모델 + `bge-m3` pull → `prepare_test_set2.js` 실행. `--tier local|ec2|all`, `--skip-models`.

**`prepare_test_set2.js`** — 원본 xlsx를 읽어(zero-dependency `lib/xlsx.js`) `data/eval_sets/test_set2/{cases.csv, faq_master.csv}`로 변환.

### 평가 파이프라인 (run_id 하나에 대해, `run_pipeline.js`가 순서대로 호출)

| # | 스크립트 | 하는 일 | 외부 호출 |
|---|---|---|---|
| 1 | `run_generation.js` | `cases.csv`를 읽어 모델에 프롬프트 전달, JSON 응답 파싱·포맷검증까지 저장. 이미 처리한 ID는 건너뜀(재개 가능) | Ollama `/api/chat` |
| 2 | `score_format_performance.js` | 포맷 성공 여부·Latency·TPS·VRAM을 항목6/항목7 파일로 분리 | 없음 |
| 3 | `score_answer_accuracy.js` | 답변과 `정답 예시`의 BGE-M3 코사인 유사도 + 키워드 커버리지. **둘 다 통과해야 pass** | Ollama `/api/embed` |
| 4 | `score_rag_faithfulness.js` | 컨텍스트 블록 단위 KLUE-NLI 함의 판정 + 숫자/고유명사 규칙 + evidence_ids 출처 대조 | Python(KLUE-NLI) |
| 5 | `score_absence_detection.js` | `status=ABSTAIN` 여부로 Precision/Recall/F1 | 없음 |
| 6 | `score_expression_quality.js` | 실격 3종 + 감점 5종 규칙 채점 | 없음 |
| 7 | `score_repeat_consistency.js` | `원본 ID`로 그룹핑해 회차 간 status/숫자/evidence_ids 일치 판정 | Ollama `/api/embed`(참고용) |
| 8 | `score_escalation.js` | 신호 불일치·경계값 기반 "재판단 필요" 판정(7개 트리거) | 없음 |
| 9 | `build_review_export.js` | 전부를 케이스 ID로 조인한 `review.csv` | 없음 |
| — | `aggregate_report.js` | 고유 문항 기준 집계를 `report/<run_id>_summary.md`로 | 없음 |

각 단계는 독립 실행도 가능합니다(`node model_test_v2/scripts/score_escalation.js <run_id>`).

### LLM Judge (try2에서 도입)

| 스크립트 | 하는 일 |
|---|---|
| `prepare_llm_judge_inputs.js <batch-manifest>` | 저장 답변을 Judge 입력(jobs·프롬프트·해시)으로 변환 → `llm_judge/inputs/<batch>/`. 모델·Judge 호출 없음 |
| `run_saved_llm_judge.js` | 입력 해시를 검증한 뒤 Judge 호출, 결과를 `raw/scored/<run_id>/accuracy_hallucination_llm.jsonl`·`safety_llm.jsonl`에 기록. 완료 문항은 건너뜀 |
| `verify_llm_judge.js` · `update_llm_judge_rubric.js` | 결과 검증 · 루브릭 교체(기존 성공 판정과 섞이지 않게 차단) |
| `build_llm_judge_report.js` | Judge 결과 보고서 → `llm_judge/README.md`, 모델별 `*_V2.md`, `judgments_V2.csv` |
| `select_review_V2.js` · `build_results_V2.js` | 검수 표본 선정 · V2 상세 보고서·표 CSV → `summary/` |

---

## 6. 반복 일관성 동작 방식

`cases.csv`의 40개 문항은 `원본 ID`가 같고 `실행 회차`가 1/2/3인 3개 행으로 존재합니다(ID: `SF-0001`/`SF-0001-R2`/`SF-0001-R3`). 전체 라운드는 380행을 한 번에 처리하므로 3회차도 자동 생성되고, `rounds/14_RP_repeat.js`는 이 120행만 따로 돌립니다. `score_repeat_consistency.js`는:
- **표현(패러프레이즈) 차이는 무시** — BGE-M3 유사도는 참고만
- **사실(status/숫자/evidence_ids)이 회차마다 흔들리는지만** 판정

---

## 7. 평가 항목 ↔ 스크립트 매핑

| 평가 항목 | 담당 스크립트 | 채점 방식 |
|---|---|---|
| 1. 답변 정확도 | `score_answer_accuracy.js` / LLM Judge | BGE-M3 유사도 + 키워드 (결정론) / CORRECT 판정 |
| 2. RAG 충실도·환각 | `score_rag_faithfulness.js` / LLM Judge | KLUE-NLI + 규칙 / 근거 점수·환각 목록 |
| 3. FAQ 부재 판단 | `score_absence_detection.js` | P/R/F1 (결정론) |
| 4. 의도 분류 | — | **범위 제외** |
| 5. 표현 품질 | `score_expression_quality.js` / LLM Judge | 규칙 기반 / 1~5점 |
| 6. 명령 수행 능력 | `score_format_performance.js` | 포맷 성공률 |
| 7. 성능 | `score_format_performance.js` | Latency/TPS (계측) |
| 8. 리소스 | `score_format_performance.js`(VRAM 샘플) | 계측 |
| 9. 클러스터 라벨링 | — | **범위 제외** |
| 반복 일관성 | `score_repeat_consistency.js` | 회차 간 사실 일치 |
| 안전성 | LLM Judge (`safety_llm`) | AD 지정 15문항 SAFE/UNSAFE |
| 재판단 필요 여부 | `score_escalation.js` | 규칙 기반 |

---

## 8. 알려진 한계

- **임계값 전부 가설값**: `config/thresholds.js`의 수치는 소량 calibration 기반입니다.
- **맞춤법 검사는 사전 기반이 아님**: 고빈도 오류 패턴 + 띄어쓰기 휴리스틱만 사용(`lib/expression_quality.js` 주석 참고).
- **결정론 RAG 채점기는 premise에 사용자 정보·대화 이력·API 결과가 없어** 해당 유형에서 구조적으로 낮게 나옵니다. 환각 판단은 LLM Judge를 우선합니다.
- **`bootstrap_ec2.sh`는 실행 권한이 없어 `bash`로 실행**합니다. EC2에서 `unzip`이 없으면 `prepare_test_set2.js`가 실패합니다(`sudo apt-get install -y unzip`).
- **NLI/임베딩 서브프로세스 재시도가 모두 소진되면 그 스테이지가 멈춥니다** — 원인 해결 후 같은 명령으로 재실행하면 이어서 처리됩니다.
- v3는 이 스크립트의 복사본(`model_test_v3/scripts/`)을 씁니다. **채점 로직을 고치면 양쪽에 같이 반영**해야 합니다.
