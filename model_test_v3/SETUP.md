# model_test_v3 — 테스트 항목 · 라운드별 스크립트 · 실행 순서 (EC2)

v2에서 1차 선별한 **5개 모델 + EC2 전용 2개 = 총 7개**를 EC2에서 측정한다.
평가 데이터셋은 v2와 동일한 `data/eval_sets/test_set2/cases.csv`(380행)이고,
**바뀌는 것은 실행 환경과 생성 파라미터(temperature 0, 추론 ON/OFF 명시)뿐**이다.

채점 스크립트는 `model_test_v2/scripts/`의 복사본이 `model_test_v3/scripts/`에 함께 들어 있다.
결과는 `model_test_v3/<try>/results/`에 쌓이며, try는 `LLM_TEST_TRY`로 고른다(미설정 시 `try1`).

| try | 내용 | 결과 요약 |
|---|---|---|
| try1 | 2026-09-20 · EC2 Tesla T4 · 7모델 본측정 + Qwen3 추론 OFF + temperature 대조군 · LLM Judge 전수 | [try1/results/all_summary.md](try1/results/all_summary.md) |

## 테스트 목표와 이전 버전 대비 변경점

**테스트 목표**

- 로컬 GPU(12GB) 부족으로 v2에서 빠졌던 **대형 모델 `gemma3:12b` · `qwen3:14b`를 측정**한다.
- 선별 5개와 대형 2개를 **같은 하드웨어**에 올려, 속도 차이가 모델 차이인지 하드웨어 차이인지 구분한다.
- **운영 생성 설정을 확정**한다 — v2의 기본값(temperature 0.8)에서 반복 일관성이 45~52%에 그쳐 temperature 0을 운영값으로 정하고, 같은 EC2의 0.8 대조군으로 효과를 분리한다.
- **추론(thinking) 모드 ON/OFF의 속도·정확도 트레이드오프**를 잰다(v1·v2는 ON만 측정).
- 위 결과로 **1차 MVP 운영 모델을 선정**한다(결과: `qwen3:14b` 추론 OFF).

**이전 버전(v2 try2) 대비 변경점**

| 구분 | v2 try2 | v3 try1 |
|---|---|---|
| 실행 환경 | 로컬 Windows · RTX 4070 Ti 12GB | AWS EC2 · Tesla T4 16GB |
| 대상 모델 | 선별 5개 | 선별 5개 + EC2 전용 2개(`gemma3:12b` `qwen3:14b`) = 7개 |
| temperature | Ollama 기본값(0.8) | **0** (운영 설정) + 0.8 대조군(반복 40문항) |
| 추론 모드 | 모델 기본값(명시 안 함) | **명시적 ON**(본측정) + Qwen3 4개 **OFF** 라운드 |
| 라운드 | 전체 1회 | 조건별 러너 3개 — 본측정 `t0_think` · 추론 OFF `t0_nothink` · 대조군 `t08_think` |
| LLM Judge | `gpt-6-astra`, 루브릭 `20260918-minor-issues` | `gpt-6-astra`, 루브릭 `test3-saved-v1` (1~3%p 차이는 루브릭 차이일 수 있음) |
| 새 측정 | - | 모델별 VRAM 실측(`measure_vram.js`), 운영 모델 선별(최하위 탈락 방식) |
| 그대로인 것 | | 데이터셋(`test_set2` 380건) · 채점 스크립트(v2 복사본) · 평가 지표 |

v2와는 하드웨어가 달라 **응답 시간은 버전 간 비교하지 않는다.**

## 대상 모델

| 구분 | 모델 |
|---|---|
| 선별 5 | `gemma3:4b` `qwen3:1.7b` `qwen3:4b` `qwen3:8b` `exaone3.5:7.8b` |
| EC2 전용 2 | `gemma3:12b` `qwen3:14b` |

## 테스트 항목

13개 항목 × 고유 300건 + 반복 40문항×3회차(추가 80행) = **모델당 380건**. 항목 구성과 건수는 [model_test_v2/SETUP.md 1절](../model_test_v2/SETUP.md#1-테스트-항목)과 같다.

| # | 코드 | 항목 | 고유 | 라운드 스크립트 |
|---|---|---|---|---|
| 1 | SF | 단일 FAQ 답변 | 18 | `rounds/01_SF_single_faq.js` |
| 2 | NC | 유사 FAQ 구분·노이즈 | 22 | `rounds/02_NC_noise_confusion.js` |
| 3 | MC | 다중 FAQ 조합 | 30 | `rounds/03_MC_multi_faq.js` |
| 4 | UI | 사용자 정보+FAQ | 24 | `rounds/04_UI_user_info.js` |
| 5 | CE | 조건·예외·경계값 | 24 | `rounds/05_CE_condition_exception.js` |
| 6 | PI | 부분 정보 | 35 | `rounds/06_PI_partial_info.js` |
| 7 | SR | 유사하지만 답 없음 | 35 | `rounds/07_SR_similar_no_answer.js` |
| 8 | HR | 무관 FAQ | 20 | `rounds/08_HR_irrelevant_faq.js` |
| 9 | EC | 빈 컨텍스트 | 30 | `rounds/09_EC_empty_context.js` |
| 10 | CF | FAQ 충돌·시행일 | 15 | `rounds/10_CF_faq_conflict.js` |
| 11 | MT | 멀티턴 대화 | 27 | `rounds/11_MT_multi_turn.js` |
| 12 | AD | 적대적 입력·범위 밖 | 15 | `rounds/12_AD_adversarial.js` |
| 13 | AR | API 결과 답변 | 5 | `rounds/13_AR_api_result.js` |
| 14 | RP | 반복 라운드 (40문항 × 3회차) | 40 | `rounds/14_RP_repeat.js` |

v3의 `rounds/` 스크립트는 **운영 설정(temperature 0, 추론 가능 모델은 think=true)을 기본으로 붙인다.** 추론 모드가 없는 gemma3·exaone3.5에는 think를 보내지 않는다(Ollama 400 방지). 같은 옵션을 인자로 주면 그 값이 우선한다. `--dry-run`으로 호출할 명령만 확인할 수 있다.

## 라운드별 스크립트 (조건 단위)

| 스크립트 | 범위 | run_id 조건 |
|---|---|---|
| `run_round.js` | **본 라운드** — 7모델 × 380행, temperature 0, 추론 ON | `t0_think` |
| `run_think_ablation.js` | Qwen3 4개 × 380행, temperature 0, 추론 OFF | `t0_nothink` |
| `run_temp_control.js` | 7모델 × 반복 120행, temperature 0.8 (대조군) | `t08_think` |
| `rounds/01~14_*.js <run_id> <model_tag>` | 항목 하나 / 반복 라운드만 | 호출자가 지정 + `_<코드>` 접미사 |
| `measure_vram.js` | 모델별 VRAM 실측 | — |
| `compare_rounds.js` · `build_report.js` | 집계 · 문서 생성(모델 호출 없음) | — |
| `build_batch_manifest.js` | LLM Judge 배치 매니페스트 생성 | — |

세 조건 러너는 `lib/runner.js`를 공유하며, 각 모델마다 이 폴더의 `run_pipeline.js`(생성 → 9단계 채점 → 리포트)를 호출한다.

## 테스트 순서

모든 명령은 **저장소 루트**에서 실행한다.

### 0. EC2 준비

```bash
git clone https://github.com/ureca-UBot/UBot-LLMTest.git && cd UBot-LLMTest
git checkout results/faq-380-test
sudo apt-get install -y unzip                       # prepare_test_set2.js가 xlsx를 unzip으로 읽음
bash model_test_v3/scripts/bootstrap_ec2.sh --tier ec2   # Node/Python/Ollama + venv + bge-m3 + 12b/14b (실행 권한 없음 → bash로)

# 선별 5개는 따로 받는다 (bootstrap의 --tier ec2는 EC2 전용 2개만 받는다)
for M in qwen3:4b qwen3:8b qwen3:1.7b gemma3:4b exaone3.5:7.8b; do ollama pull "$M"; done

# KLUE-NLI 모델 선다운로드 (항목2 채점 중 네트워크로 죽는 것 방지)
.venv_nli/bin/python -c "
from transformers import AutoModelForSequenceClassification, AutoTokenizer
m='Huffon/klue-roberta-base-nli'
AutoTokenizer.from_pretrained(m); AutoModelForSequenceClassification.from_pretrained(m)"
```

권장 사양: VRAM 16GB 이상(`qwen3:14b` 9.3GB, `gemma3:12b` 8.1GB), **EBS 64GB 이상**(기본 30GB로는 모델 8개 약 36GB + venv가 안 들어감).
**GPU 없는 인스턴스는 쓰지 말 것** — 지연 측정이 무의미해진다.

### 1. 사전 점검

```bash
node model_test_v3/scripts/run_round.js --dry-run          # 모델 목록 · run_id · 결과 try만 출력
node model_test_v3/scripts/measure_vram.js --dry-run       # nvidia-smi / Ollama API 접근 확인
```

`think` 파라미터가 이 Ollama 버전에서 실제로 먹는지 1건으로 먼저 확인한다.
`--think false`일 때 `eval_count`가 유의미하게 줄지 않으면 그 버전이 필드를 무시하는 것이다.

```bash
node model_test_v3/scripts/run_generation.js smoke_on  qwen3:1.7b --limit 3 --temperature 0 --think true
node model_test_v3/scripts/run_generation.js smoke_off qwen3:1.7b --limit 3 --temperature 0 --think false
# 두 파일의 timing.eval_count 비교 후
rm -rf model_test_v3/try1/results/raw/smoke_on model_test_v3/try1/results/raw/smoke_off
```

### 2. 본 라운드 — 7모델 × temperature 0 × 추론 on

**반드시 tmux 안에서.** 3~6시간 걸린다.

```bash
tmux new -s test3
node model_test_v3/scripts/run_round.js 2>&1 | tee -a model_test_v3/try1/results/raw/logs/test3_round_$(date +%Y%m%d).log
# 분리: Ctrl+b 누른 뒤 d   /   재접속: tmux attach -t test3
```

모델 하나가 실패해도 나머지는 계속 진행된다. 실패한 모델은 **같은 명령을 다시 돌리면**
완료된 케이스를 건너뛰고 이어서 진행한다. 단, 실패 레코드도 `id`와 함께 남아 건너뛰어지므로
설정 오류로 전부 실패했다면 그 run의 `raw/<run_id>/` 폴더를 지우고 다시 시작한다.

특정 항목만 다시 보고 싶으면 항목별 라운드를 쓴다:

```bash
node model_test_v3/scripts/rounds/05_CE_condition_exception.js ec2-linux_qwen3-14b_t0_think_20260920 qwen3:14b --dry-run
```

### 3. 추론 off 비교 — Qwen3 계열만

```bash
node model_test_v3/scripts/run_think_ablation.js
```

### 4. temperature 대조군 — 반복 40문항만

```bash
node model_test_v3/scripts/run_temp_control.js
```

이 라운드가 없으면 "temperature=0이 일관성을 개선했다"는 주장이 성립하지 않는다.
v2는 로컬 GPU라 **하드웨어가 같이 바뀌었기** 때문이다. 같은 EC2에서 0.8을 한 번 더
돌려야 교란 요인이 제거된다.

### 5. VRAM 실측

```bash
node model_test_v3/scripts/measure_vram.js      # -> results/raw/scored/vram_profile.json
```

### 6. 집계 · 문서 생성 (모델 호출 없음)

```bash
node model_test_v3/scripts/compare_rounds.js     # -> results/raw/scored/round_comparison.json (v2 try2와 비교 포함)
node model_test_v3/scripts/build_report.js       # -> results/summary/*.md, summary/charts/*.svg, results/dashboard.html
```

### 7. LLM Judge

**저장된 답변을 외부 Judge로 전송하므로 사용자 승인이 필요하다.**

```bash
node model_test_v3/scripts/build_batch_manifest.js --dry-run            # 어떤 run이 잡히는지 확인
node model_test_v3/scripts/build_batch_manifest.js --batch test3-round1  # -> results/report/test3-round1.json
node model_test_v3/scripts/prepare_llm_judge_inputs.js model_test_v3/try1/results/report/test3-round1.json
LLM_JUDGE_BATCH=test3-round1 node model_test_v3/scripts/run_saved_llm_judge.js --concurrency 8
LLM_JUDGE_BATCH=test3-round1 node model_test_v3/scripts/build_llm_judge_report.js
```

7개 모델이 전부 매니페스트에 잡혔는지 확인한다. 조건별로 따로 만들 수 있다(`--condition t0_nothink`).
(try1의 실제 Judge 결과는 별도 평가 코드로 채점해 `llm_judge/`에 보존돼 있다 — 평가 코드 사본은 `llm_judge/evaluator/`.)

### 8. all_summary 갱신과 결과 회수

`results/all_summary.md`(항목·건수·평가 기준 서두 → LLM Judge 우선 전체 요약 → 이전 버전 대비 → 항목별 요약 → summary 문서 요약)를 갱신한 뒤:

```bash
git add model_test_v3/ && git commit -m "test: v3 EC2 라운드 결과 추가"
```

## 결과 위치

```
model_test_v3/try1/results/
├── all_summary.md · dashboard.html
├── raw/<run_id>/generation.jsonl · raw/scored/<run_id>/ · raw/logs/
├── report/<run_id>_summary.md · report/<batch>.json
├── llm_judge/ (README · interpretation · metrics.json · t0_think/ t0_nothink/ t08_think/ · evaluator/)
└── summary/ (summary_results · model_selection · methodology · think_ablation_results · temperature_comparison · vram_results · hallucination_cause · ai_analysis · charts/)
```

## run_id 규칙

```
<env>_<모델>_<조건>_<날짜>
  조건: t0_think   = temperature 0, 추론 on   (본 라운드)
        t0_nothink = temperature 0, 추론 off  (Qwen3만)
        t08_think  = temperature 0.8, 추론 on (대조군, 반복 40문항)
예) ec2-linux_qwen3-4b_t0_think_20260920
항목별 라운드는 끝에 _<코드>가 붙는다  예) ec2-linux_qwen3-4b_t0_think_20260920_CE
```

## 알려진 한계

- **RAG 충실도(결정론 채점기)는 고치지 않았다.** `score_rag_faithfulness.js`의 premise 누락으로
  `rag_faithfulness.jsonl`은 모델 순위가 역전될 수 있다. 환각 판단은 LLM Judge 결과를 쓴다.
- **seed는 고정하지 않는다.** temperature=0은 greedy decoding이라 영향이 없고,
  전역 고정은 반복 일관성 지표를 무의미하게 만든다.
- v2 ↔ v3는 하드웨어가 달라 **속도 비교 불가**.
- 채점 스크립트는 v2의 복사본이다. **채점 로직을 고치면 `model_test_v2/scripts/`에도 같이 반영**해야 한다.
