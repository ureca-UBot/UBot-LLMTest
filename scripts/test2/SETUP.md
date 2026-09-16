# test2 라운드 — 실행 가이드 & 스크립트 상세

380문항(고유 300 + 반복 40문항×3회차) 기준. 이 폴더(`scripts/test2/`) 안의 스크립트는 전부 로컬(Windows)/EC2(Linux) 공통이며, 이전 라운드(`scripts/test1/`, `data/eval_sets/test_set1/`, `results/*/test1/`)와 완전히 독립되어 있습니다 — 서로 건드리지 않습니다.

## 목차
1. [빠른 시작](#빠른-시작)
2. [디렉터리 구조](#디렉터리-구조)
3. [스크립트별 상세 설명](#스크립트별-상세-설명)
4. [결과 파일 위치](#결과-파일-위치)
5. [반복 일관성 동작 방식](#반복-일관성-동작-방식)
6. [평가 항목 ↔ 스크립트 매핑](#평가-항목-매핑)
7. [알려진 한계](#알려진-한계)

---

## 빠른 시작

### 0. 환경 설치 (최초 1회)

**로컬(Windows)** — Node.js와 Python이 이미 있다는 전제:
```
node scripts/test2/setup_env.js --tier local
```

**EC2(Linux) 맨 인스턴스** — Node.js조차 없는 새 인스턴스부터:
```
bash scripts/test2/bootstrap_ec2.sh --tier ec2
```
이 스크립트가 Node.js → Python3 → Ollama 설치까지 다 한 뒤 `setup_env.js`로 넘겨줍니다.

둘 다 멱등(idempotent)이라 여러 번 실행해도 안전합니다(이미 된 단계는 건너뜀).

### 1. 모델 하나 테스트 (원커맨드)
```
node scripts/test2/run_pipeline.js <run_id> <model_tag>
```
예: `node scripts/test2/run_pipeline.js local-win_gemma3-4b_20260917 gemma3:4b`

### 2. 전체 모델 일괄 테스트
```
node scripts/test2/run_all_models.js local   # 로컬 9개
node scripts/test2/run_all_models.js ec2     # EC2 2개
node scripts/test2/run_all_models.js all     # 11개 전부
```

---

## 디렉터리 구조

```
scripts/test2/
├── SETUP.md                        # 이 문서
├── bootstrap_ec2.sh                # EC2 맨 인스턴스 부트스트랩 (Node/Python/Ollama 설치)
├── setup_env.js                    # 환경 설치 (venv+pip+ollama pull+데이터생성)
├── prepare_test_set2.js            # xlsx -> CSV 변환 (데이터 준비)
├── run_pipeline.js                 # ⭐ 모델 1개 원커맨드 실행 (9단계 자동)
├── run_all_models.js               # ⭐ 전체 모델 일괄 실행
├── run_generation.js               # [단계1] 모델 호출
├── score_format_performance.js     # [단계2] 항목6·7 채점
├── score_answer_accuracy.js        # [단계3] 항목1 채점
├── score_rag_faithfulness.js       # [단계4] 항목2 채점
├── score_absence_detection.js      # [단계5] 항목3 채점
├── score_expression_quality.js     # [단계6] 항목5 채점
├── score_repeat_consistency.js     # [단계7] 반복 일관성 채점
├── score_escalation.js             # [단계8] LLM 재판단 필요 여부
├── build_review_export.js          # [단계9] 통합 리뷰 CSV 생성
├── aggregate_report.js             # [단계10] 종합 리포트 생성
├── config/
│   ├── models.js                   # 후보 모델 목록 (local 9개 / ec2 2개) + 임베딩 모델명
│   └── thresholds.js               # 판정 임계값 전부 (calibration 기반 가설값, 재검증 필요)
├── lib/                            # 공통 라이브러리 (모든 스크립트가 재사용)
│   ├── platform.js                 # OS 감지, Python venv 경로 자동 해석, 환경 태그
│   ├── ollama.js                   # Ollama REST 클라이언트 (chat/embed, 재시도 포함)
│   ├── nli.js                      # KLUE-NLI Python 서브프로세스 브릿지 (재시도 포함)
│   ├── csv.js                      # CSV 파서/직렬화 (zero-dependency)
│   ├── xlsx.js                     # xlsx 파서 (zero-dependency, unzip+정규식)
│   ├── jsonl.js                    # JSONL 읽기/이어쓰기(체크포인트) 헬퍼
│   ├── prompts.js                  # 시스템 프롬프트 + 메시지 빌더
│   ├── context_blocks.js           # "제공 Context"를 FAQ/SYN 블록 단위로 분해
│   ├── fact_units.js               # 답변을 문장 단위로 분해
│   ├── regex_checks.js             # 숫자·고유명사 검증, CF 충돌 판별, 출처오매칭 검증
│   ├── metrics.js                  # 포맷 검증, 키워드 커버리지
│   ├── vectors.js                  # 코사인 유사도
│   ├── status_map.js               # 한국어 상태 라벨 <-> enum 매핑
│   ├── rounds.js                   # 실행회차=1(고유문항) 판별
│   └── expression_quality.js       # 항목5 규칙 기반 채점 로직
└── python_nli/
    ├── requirements.txt            # KLUE-NLI 파이썬 의존성
    └── run_nli_batch.py            # KLUE-NLI 배치 추론 스크립트
```

---

## 스크립트별 상세 설명

### 설치/준비

**`bootstrap_ec2.sh`** — EC2 맨 인스턴스용. Node.js(NodeSource, Ubuntu/Amazon Linux 자동감지) → Python3+venv → Ollama 설치·기동까지 처리한 뒤 `setup_env.js`를 호출. Node가 이미 있는 로컬에서는 필요 없음(대신 `setup_env.js`를 직접 씀).

**`setup_env.js`** — Node 기반, OS 공통. `.venv_nli`(Python venv) 생성 + `python_nli/requirements.txt` 설치(Windows는 CPU 전용 torch 인덱스 사용) → Ollama 설치 확인(자동 설치는 안 함) → `config/models.js`의 해당 티어 모델 + `bge-m3` pull → `prepare_test_set2.js` 실행. `--tier local|ec2|all`, `--skip-models`(모델 pull 생략) 옵션.

**`prepare_test_set2.js`** — 원본 `data/raw/FAQ_RAG_300문항_반복40개_총380회 (1).xlsx`를 읽어(zero-dependency `lib/xlsx.js` 사용) `data/eval_sets/test_set2/{cases.csv, faq_master.csv}`로 변환. 원본 xlsx가 바뀌면 재실행.

### 실행 오케스트레이터

**`run_pipeline.js <run_id> <model_tag>`** — 아래 [단계1]~[단계10]을 서브프로세스로 순서대로 호출. 한 단계라도 실패하면 그 자리에서 멈추고, 같은 명령으로 재실행하면 재개 가능한 단계(모델 생성 등)는 이어서 진행. 옵션: `--limit N`(디버그용) `--type T` `--difficulty D` `--skip-repeat`.

**`run_all_models.js [local|ec2|all]`** — `config/models.js` 목록을 순회하며 모델마다 `run_pipeline.js`를 호출. run_id는 `<env>_<모델>_<날짜>`로 자동 생성. 한 모델이 실패해도 나머지는 계속 진행, 끝나면 성공/실패 요약 출력.

### 평가 파이프라인 (9단계, run_id 하나에 대해)

| # | 스크립트 | 하는 일 | 외부 호출 |
|---|---|---|---|
| 1 | `run_generation.js` | `cases.csv` 380행을 읽어 모델에 프롬프트 전달, JSON 응답 파싱·포맷검증까지 해서 저장. 이미 처리한 ID는 건너뜀(재개 가능) | Ollama `/api/chat` |
| 2 | `score_format_performance.js` | 1단계 결과에서 포맷 성공 여부·Latency·TPS를 항목6/항목7 파일로 분리 저장 | 없음 |
| 3 | `score_answer_accuracy.js` | 답변과 `정답 예시`를 BGE-M3로 임베딩해 코사인 유사도 계산 + 키워드 커버리지 계산. **둘 다 통과해야 pass**(유사도만으론 안 됨 — 누락형 오류 방지) | Ollama `/api/embed` |
| 4 | `score_rag_faithfulness.js` | 컨텍스트를 블록 단위로 쪼개 KLUE-NLI로 함의 판정 + 숫자/고유명사 규칙 검증 + evidence_ids 기준 출처 정밀 대조 | Python(KLUE-NLI) |
| 5 | `score_absence_detection.js` | `status=ABSTAIN` 여부로 Precision/Recall/F1 계산 (완전 결정론적) | 없음 |
| 6 | `score_expression_quality.js` | 실격 3종(내부용어누출/질문에코/비존대어미) + 감점 5종(반복/비한글/마크다운/길이밴드/맞춤법) 규칙 채점 | 없음 |
| 7 | `score_repeat_consistency.js` | `원본 ID`로 그룹핑해 회차 간 status/숫자/evidence_ids 일치 여부 판정 | Ollama `/api/embed`(참고용 유사도만) |
| 8 | `score_escalation.js` | 위 모든 신호를 종합해 "LLM 2차 판단 필요" 여부 자동 판정(7가지 트리거 규칙) | 없음 |
| 9 | `build_review_export.js` | 위 전부를 케이스 ID로 조인해서 사람이 엑셀로 볼 `review.csv` 생성(질문/정답/LLM답변/전체 점수/재확인여부가 한 행에) | 없음 |
| — | `aggregate_report.js` | 고유 문항(회차1) 기준 집계 통계를 마크다운 리포트로 생성 | 없음 |

각 단계는 독립 실행도 가능합니다(`node scripts/test2/score_escalation.js <run_id>` 처럼) — Judge 프롬프트나 임계값만 바꿔서 그 단계부터 다시 돌리고 싶을 때 유용합니다.

---

## 결과 파일 위치

```
results/raw/test2/<run_id>/generation.jsonl              # 원본 모델 출력 (380행)
results/scored/test2/<run_id>/
  format_success.jsonl                # 항목6 (건별)
  performance.jsonl                    # 항목7 (건별 + performance_summary.json)
  answer_accuracy.jsonl                # 항목1 (건별)
  rag_faithfulness.jsonl                # 항목2 (건별)
  absence_detection.jsonl                # 항목3 (건별 + absence_detection_summary.json)
  expression_quality.jsonl                # 항목5 (건별)
  repeat_consistency.jsonl                  # 반복 일관성 (원본ID별 + repeat_consistency_summary.json)
  escalation.jsonl                            # LLM 재판단 필요 여부 (건별)
  review.csv                                    # ⭐ 사람이 읽을 통합 파일 (380행, 34컬럼)
results/reports/test2/<run_id>_summary.md   # 종합 리포트 (자동 생성, 손으로 고치지 말 것)
```

집계 수치(통과율·평균 등)는 **고유 문항(실행 회차=1, 300건)** 기준입니다 — 반복 대상 40문항이 3배로 잡혀서 편향되지 않도록. 건별 상세(jsonl, review.csv)는 380행 전부 보존됩니다.

---

## 반복 일관성 동작 방식

`cases.csv`의 40개 문항은 `원본 ID`가 같고 `실행 회차`가 1/2/3인 3개 행으로 존재합니다(ID: `SF-0001`/`SF-0001-R2`/`SF-0001-R3`). `run_generation.js`가 380행을 한 번에 처리하면 이 3회차 데이터도 자동으로 같이 생성됩니다 — 별도 실행 불필요. `score_repeat_consistency.js`가 같은 `원본 ID`끼리 묶어서:
- **표현(패러프레이즈) 차이는 무시** — BGE-M3 유사도로 참고만 함, 판정에 안 씀
- **사실(status/숫자/evidence_ids)이 회차마다 흔들리는지만** 판정

---

## 평가 항목 매핑

| README 5절 항목 | 담당 스크립트 | 채점 방식 |
|---|---|---|
| 1. 답변 정확도 | `score_answer_accuracy.js` | BGE-M3 유사도 + 키워드 커버리지 (결정론적) |
| 2. RAG 충실도 | `score_rag_faithfulness.js` | KLUE-NLI + 규칙 기반 (숫자/고유명사/출처매칭) |
| 3. FAQ 부재 판단 | `score_absence_detection.js` | P/R/F1 (완전 결정론적) |
| 4. 의도 분류 | — | **이번 라운드 제외** |
| 5. 표현 품질 | `score_expression_quality.js` | 규칙 기반 (실격 3종 + 감점 5종) |
| 6. 명령 수행 능력 | `score_format_performance.js` | 포맷 성공률 (결정론적) |
| 7. 성능 | `score_format_performance.js` | Latency/TPS (계측) |
| 8. 리소스 요구량 | — | 파이프라인 밖, 모델 프로필 표로 별도 관리 |
| 9. 클러스터 라벨링 | — | **이번 라운드 제외** |
| (신규) 반복 일관성 | `score_repeat_consistency.js` | 회차 간 사실 일치 여부 |
| (신규) 재판단 필요 여부 | `score_escalation.js` | 신호 불일치/경계값 기반 규칙 |

---

## 알려진 한계

- **임계값 전부 가설값**: `config/thresholds.js`의 모든 수치는 소량 calibration 기반입니다. 실제 상위권 모델(Qwen3 8B, Gemma3 4B 등)로 380건을 돌려본 뒤 분포를 보고 재조정 필요.
- **맞춤법 검사는 사전 기반이 아님**: 여러 라이브러리(Python/JS 양쪽)를 시도했으나 전부 실패(`lib/expression_quality.js` 주석 참고) — 지금은 고빈도 오류 패턴 + 띄어쓰기 휴리스틱만 사용.
- **할루시네이션 탐지는 구조적으로 완전할 수 없음**: 규칙 기반(숫자/고유명사)과 NLI 둘 다 각자의 방식으로 실패할 수 있고, 두 신호가 "같은 방향으로 잘못 동의"하면 에스컬레이션도 못 잡습니다. 새로 발견되는 대로 패치하는 지금 방식은 근본적으로 한계가 있어서, 무작위 표본 감사(needs_review=false로 나온 것 중 일부를 사람/LLM이 직접 대조)를 병행하는 걸 권장합니다 — 아직 미구현.
- **`bootstrap_ec2.sh`는 실제 EC2에서 끝까지 검증되지 않음**: 문법 검사만 했습니다. 처음 실행 시 지켜봐 주세요.
- **NLI/임베딩 서브프로세스는 재시도는 있지만, 여러 번 실패 시 그 스테이지는 중단됩니다**: `run_generation.js`(케이스별)와 `score_answer_accuracy.js`/`score_repeat_consistency.js`(체크포인트 재개)는 재실행 시 이어서 처리되지만, 재시도 자체가 다 소진되면 해당 스테이지가 멈춥니다 — 원인 해결 후 같은 명령으로 재실행하면 됩니다.
