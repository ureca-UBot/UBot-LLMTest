# test3 (EC2 라운드) — 실행 가이드

test2에서 1차 선별한 **5개 모델 + EC2 전용 2개 = 총 7개**를 EC2에서 측정한다.
평가 데이터셋은 test2와 동일한 `data/eval_sets/test_set2/cases.csv`(380행)이고,
**바뀌는 것은 실행 환경과 생성 파라미터뿐**이다.

채점은 `scripts/test2/`의 스크립트를 그대로 쓴다. `LLM_TEST_SUITE=test3` 환경변수가
결과 경로만 `results/*/test3/`로 돌린다(러너가 자동으로 설정하므로 직접 export할 필요 없음).

## 대상 모델

| 구분 | 모델 |
|---|---|
| 선별 5 | `gemma3:4b` `qwen3:1.7b` `qwen3:4b` `qwen3:8b` `exaone3.5:7.8b` |
| EC2 전용 2 | `gemma3:12b` `qwen3:14b` |

## 0. EC2 준비

```bash
git clone https://github.com/ureca-UBot/UBot-LLMTest.git && cd UBot-LLMTest
git checkout results/faq-380-test
bash scripts/test2/bootstrap_ec2.sh --tier ec2      # Node/Python/Ollama + venv + bge-m3 + 12b/14b

# 선별 5개는 따로 받는다 (bootstrap의 --tier ec2는 EC2 전용 2개만 받는다)
for M in qwen3:4b qwen3:8b qwen3:1.7b gemma3:4b exaone3.5:7.8b; do ollama pull "$M"; done

# KLUE-NLI 모델 선다운로드 (항목2 채점 중 네트워크로 죽는 것 방지)
.venv_nli/bin/python -c "
from transformers import AutoModelForSequenceClassification, AutoTokenizer
m='Huffon/klue-roberta-base-nli'
AutoTokenizer.from_pretrained(m); AutoModelForSequenceClassification.from_pretrained(m)"
```

권장 사양: VRAM 16GB 이상(`qwen3:14b` 9.3GB, `gemma3:12b` 8.1GB), EBS 100GB 이상.
**GPU 없는 인스턴스는 쓰지 말 것** — 지연 측정이 무의미해진다.

## 1. 사전 점검

```bash
node scripts/test3/run_round.js --dry-run          # 모델 목록 · run_id · 경로만 출력
node scripts/test3/measure_vram.js --dry-run       # nvidia-smi / Ollama API 접근 확인
```

`think` 파라미터가 이 Ollama 버전에서 실제로 먹는지 1건으로 먼저 확인한다.
`--think false`일 때 `eval_count`가 유의미하게 줄지 않으면 그 버전이 필드를 무시하는 것이므로,
3단계(추론 off)를 돌리기 전에 방법을 다시 잡아야 한다.

```bash
LLM_TEST_SUITE=test3 node scripts/test2/run_generation.js smoke_on  qwen3:1.7b --limit 3 --temperature 0 --think true
LLM_TEST_SUITE=test3 node scripts/test2/run_generation.js smoke_off qwen3:1.7b --limit 3 --temperature 0 --think false
# 두 파일의 timing.eval_count 비교
rm -rf results/raw/test3/smoke_on results/raw/test3/smoke_off
```

## 2. 본 라운드 — 7모델 × temperature 0 × 추론 on

**반드시 tmux 안에서.** 3~6시간 걸린다.

```bash
tmux new -s test3
node scripts/test3/run_round.js 2>&1 | tee -a test3_round_$(date +%Y%m%d).log
# 분리: Ctrl+b 누른 뒤 d   /   재접속: tmux attach -t test3
```

모델 하나가 실패해도 나머지는 계속 진행된다. 실패한 모델은 **같은 명령을 다시 돌리면**
완료된 케이스를 건너뛰고 이어서 진행한다.

## 3. 추론 off 비교 — Qwen3 계열만

```bash
node scripts/test3/run_think_ablation.js
```

`gemma3`·`exaone3.5`는 추론 모드가 없어 자동 제외된다.

## 4. temperature 대조군 — 반복 40문항만

```bash
node scripts/test3/run_temp_control.js
```

이 라운드가 없으면 "temperature=0이 일관성을 개선했다"는 주장이 성립하지 않는다.
test2는 로컬 GPU라 **하드웨어가 같이 바뀌었기** 때문이다. 같은 EC2 위에서 0.8을 한 번 더
돌려야 교란 요인이 제거된다. 40문항×3회차라 비용은 작다.

## 5. VRAM 실측

```bash
node scripts/test3/measure_vram.js
```

모델을 하나씩만 올려 `/api/ps`의 모델별 `size_vram`과 `nvidia-smi` 순증분을 함께 기록한다.

## 6. 집계 · 문서 생성

```bash
node scripts/test3/compare_rounds.js     # -> results/scored/test3/round_comparison.json
node scripts/test3/build_report.js       # -> results/test3/*.md
```

두 명령 모두 모델을 호출하지 않는다. 아직 안 돌린 라운드는 표에 `-`로 남고,
무엇이 비었는지 콘솔에 나열된다.

## 7. (선택) LLM Judge

환각·정확도를 test2와 같은 기준으로 재려면 LLM Judge를 태운다.
**이 단계는 저장된 답변을 외부(OpenAI Codex)로 전송하므로 사용자 승인이 필요하다.**

### 7-1. 배치 매니페스트 생성

`prepare_llm_judge_inputs.js`는 매니페스트를 **입력으로 받는다**(만들지 않는다).
완료된 run을 스캔해 매니페스트를 먼저 만든다.

```bash
node scripts/test3/build_batch_manifest.js --dry-run            # 어떤 run이 잡히는지 확인
node scripts/test3/build_batch_manifest.js --batch test3-round1
```

7개 모델이 전부 잡혔는지 확인한다. 빠진 모델이 있으면 경고가 나오며, 그대로
진행하면 **일부 모델만 평가된 결과가 "완료"로 남는다.**

조건별로 따로 만들 수 있다 — `--condition t0_nothink` 등.

### 7-2. 채점 입력 생성과 실행

```bash
LLM_TEST_SUITE=test3 node scripts/test2/prepare_llm_judge_inputs.js results/reports/test3/test3-round1.json
LLM_TEST_SUITE=test3 LLM_JUDGE_BATCH=test3-round1 node scripts/test2/run_saved_llm_judge.js --concurrency 8
```

### 7-3. 보고서

```bash
LLM_TEST_SUITE=test3 LLM_JUDGE_BATCH=test3-round1 node scripts/test2/build_llm_judge_report.js
LLM_TEST_SUITE=test3 LLM_JUDGE_BATCH=test3-round1 node scripts/test2/build_results_V2.js
```

두 환경변수를 빼면 기존 test2 배치를 재생성한다(기본값 유지).

## 7-4. (선택) 프롬프트 비교

모델을 고정하고 시스템 프롬프트만 바꿔 같은 300문항을 돌린다. 조건은 추론 off 라운드와
같으므로(temperature 0 · think false · seed 미고정) `v0_baseline`은 기존 `t0_nothink` run을
대조군으로 재사용한다.

```bash
node scripts/test3/run_prompt_test.js qwen3:14b --dry-run   # run_id만 확인
tmux new -s prompt
node scripts/test3/run_prompt_test.js qwen3:14b 2>&1 | tee -a test3_prompt_$(date +%Y%m%d).log
```

결과는 `results/test3/prompt_test_<모델>_<날짜>.md`에 나온다. 자세한 사용법과 결과 읽는 법은
[PROMPT_TEST.md](PROMPT_TEST.md) 참고.

## 8. 결과 회수

```bash
git add results/ scripts/ && git commit -m "test: test3 EC2 라운드 결과 추가"
git push -u origin results/faq-380-test
```

`run_id` 접두가 `ec2-linux_`라 기존 `local-win_*` 결과와 섞이지 않는다.

## run_id 규칙

```
<env>_<모델>_<조건>_<날짜>
  조건: t0_think   = temperature 0, 추론 on   (본 라운드)
        t0_nothink = temperature 0, 추론 off  (Qwen3만)
        t08_think  = temperature 0.8, 추론 on (대조군, 반복 40문항)
예) ec2-linux_qwen3-4b_t0_think_20260920
```

## 알려진 한계

- **RAG 충실도(결정론 채점기)는 이번에도 고치지 않았다.** `score_rag_faithfulness.js:56`의
  premise 누락이 그대로라 `rag_faithfulness.jsonl`은 모델 순위가 역전된다.
  환각 판단은 LLM Judge 결과를 쓴다.
- **seed는 고정하지 않는다.** temperature=0은 greedy decoding이라 영향이 없고,
  전역 고정은 반복 일관성 지표를 무의미하게 만든다(같은 프롬프트 → 같은 답 → 100%).
- test2 ↔ test3는 하드웨어가 달라 **속도 비교 불가**.
