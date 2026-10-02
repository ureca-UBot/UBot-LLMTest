# load_test_v1 — LLM 동시성(부하) 테스트

## 1. 개요와 try 목록

사람이 몰렸을 때 로컬 LLM이 **몇 명까지 버티는지**, **어느 지점부터 얼마나 느려지는지**, **운영에 쓸 `OLLAMA_NUM_PARALLEL` 값**을 정하기 위한 테스트다. 품질(정답률)은 재지 않고 **속도와 처리량만** 잰다.

이 문서는 Ollama 실행 절차다. llama.cpp·vLLM·SGLang도 같은 부하 측정기에 연결했으며 별도 [엔진 실행 안내](ENGINES.md)와 `scripts/run_engines.js`를 사용한다. 실제 모델 기동은 Linux EC2에서만 수행한다. 세 엔진의 12개 예시 조합은 EC2 버전·모델 경로·양자화 정보를 채운 뒤 활성화한다.

| try | 날짜 | 환경 | 내용 | 결과 |
|---|---|---|---|---|
| try1 | 2026-10-01 | EC2 g4dn.xlarge · Tesla T4 16GB | Ollama 4개 모델의 단계적 증가·스파이크·도착률·반복 실측. 나머지 엔진 12개 조합은 준비 부족으로 미측정 | [all_summary](try1/results/all_summary.md) |
| try2 | 2026-10-01 | 같은 T4 서버 | try1의 단계적 증가·스파이크·반복 결과를 보존하고, 60초 관측 시간 보완 후 도착률 구간만 재측정. 원본 출처는 correction_audit_20261001.json에 기록 | [all_summary](try2/results/all_summary.md) |

> 폴더 이름을 `model_test_v4`로 하지 않은 이유: README 4-9절에 v4가 다음 **품질 평가**(평가 방식 변경)로 예정돼 있어서, 부하 테스트는 별도 계열(`load_test_vN`)로 분리했다. 내부 구조(`scripts/` · `tryM/results/` · run_id 규칙 · `LLM_TEST_TRY`)는 `model_test_vN`과 같다.

## 2. 테스트 목표와 v3 대비 변경점

**확인하려는 것**
1. 모델별로 판단 기준(전체 응답 P95 3~5초, 실패율 5% 이하)을 지키며 버티는 **최대 동시 사용자 수**
2. 동시 사용자가 늘 때 **처리량이 정체되는 지점(무릎)** 과 그때 느려지는 정도
3. **KV 캐시(VRAM) 한계** — 동시 처리 수를 올렸을 때 모델이 GPU에 다 안 들어가는 지점
4. 운영에 쓸 **`OLLAMA_NUM_PARALLEL` 값**
5. 한꺼번에 몰릴 때(스파이크)와 계속 들어올 때(도착률)의 대기·타임아웃 동작

| 구분 | v3 try1 | load_test_v1 try1 |
|---|---|---|
| 목적 | 품질 평가 + 순차 속도 | **동시 요청 속도·처리량** (품질 채점 없음) |
| 데이터 | test_set2 380건 | 제공된 3,000건에서 **15개 항목별 20건, 총 300건** 표본. 항목 비율 유지, seed 고정 |
| 요청 방식 | `stream:false`, 한 번에 1건 | **`stream:true`**, 여러 건 동시 |
| 생성 설정 | temperature 0 · num_ctx 미지정 | temperature 0 · **num_ctx 4096 고정 · num_predict 512** · format json |
| 추론 | ON/OFF 비교 | qwen3 **OFF(think=false)**, gemma3 think 미전송 |
| 서버 설정 | Ollama 기본값 | `NUM_PARALLEL` 2·4·8·16 비교, **FLASH_ATTENTION=0 · KV_CACHE_TYPE=f16 명시 고정**, MAX_LOADED_MODELS=1 |
| 모델 | 7개 | `gemma3:4b` `qwen3:4b` `qwen3:8b` `qwen3:14b` |
| 측정 지표 | 전체 시간 평균·P95 | **TTFT**, 토큰 간격, 전체 응답 p50/p95/p99, req/s, tok/s, 실패율, 대기 추정, VRAM·GPU·CPU |

## 3. 대상 모델

| 모델 | think | run_id 조건 | v3 순차 p95 (참고) |
|---|---|---|---|
| `gemma3:4b` | 보내지 않음 (추론 모드 없음, 보내면 400) | `t0_ctx4096_out512_sample300_load` | 2.7초 |
| `qwen3:4b` | false | `t0_nothink_ctx4096_out512_sample300_load` | 3.1초 |
| `qwen3:8b` | false | `t0_nothink_ctx4096_out512_sample300_load` | 4.3초 |
| `qwen3:14b` | false | `t0_nothink_ctx4096_out512_sample300_load` | 8.8초 |

**네 모델과 반복 측정을 시간 때문에 빼지 않는다.** 계획 시간을 초과하면 경고하고 계속 측정한다. 안전 중단 조건과 사용자의 중단 요청은 따른다.

## 4. 테스트 항목

| 단계 | 내용 | 설정 |
|---|---|---|
| **A. 단계적 증가** | 동시 처리 수(`NUM_PARALLEL`) 2 → 4 → 8 → 16 라운드마다, 동시 사용자 1 → 2 → 4 → 8 → … 를 멈춤 조건까지 | 워밍업(사용자별 첫 요청 버림) 후 60초, 최소 40건, 최대 240초 |
| 최적 설정 선택 | 판단 기준을 지키며 버틴 동시 사용자 수가 가장 큰 동시 처리 수. 기준을 만족한 설정이 없으면 최대 처리량 기준 | `--optimal 모델=값`으로 직접 지정 가능 |
| **B. 스파이크** | 최적 설정에서 100명이 한순간에 요청 | 모델당 1회 |
| **B. 도착률** | 최적 설정의 최대 처리량 × 0.25 / 0.5 / 0.75 / 1.0 / 1.25 속도로 포아송 도착 | 단계당 60초, 실패율 50% 넘으면 더 빠른 단계 생략 |
| **C. 반복** | 최적 설정의 단계적 증가를 2번 더 (1회차 포함 3회) | 계획 시간 초과 시에도 측정 |

모델 하나의 A→B→C를 마친 뒤 Ollama 서버를 종료하고 GPU compute 프로세스 해제를 확인한 다음 다음 모델을 시작한다. systemd·process 모드에서 종료나 GPU 해제 확인이 실패하면 다음 모델을 시작하지 않는다. GPU 계측이 없는 개발용 모의 서버에서는 미확인 상태를 기록한다. none 모드는 모델 unload만 수행하므로 엔진 전환 시 서버 종료를 수동으로 해야 한다.

**멈춤 조건** (하나라도 걸리면 그 라운드 종료)

| 조건 | 기준 |
|---|---|
| 응답 시간 | 전체 응답 P95 10초 초과 |
| 실패율 | 5% 초과 (타임아웃 30초·에러) |
| 처리량 정체 | 사용자를 2배로 늘려도 처리량 증가 10% 미만 |
| VRAM 부족 | 모델 로딩 후 `/api/ps`에서 size_vram < size (일부가 CPU로 밀림) → 그 동시 처리 수는 측정하지 않고 기록만 남김 |
| 안전장치 | 최대 64명 |

동시 처리 수를 2배로 올려도 최대 처리량이 10% 미만 늘면 그 위의 동시 처리 수는 재지 않는다.

**예상 시간**: `--dry-run`이 모델별 추정치를 보여 준다. 기존 2시간 40분 추정은 참고값이며, 모델별 순차 실행·워밍업·출력 제한으로 실제 시간이 달라질 수 있다. 계획 시간은 3시간 30분이고 강제 종료 제한이 아니다.

## 5. 테스트 순서

모든 명령은 저장소 루트에서 실행한다.

### 5-0. Ubuntu 24.04 LTS에서 설치된 엔진·모델의 전체 비교

```bash
# 설치/서버 기동 없이 계획만 확인
bash load_test_v1/scripts/run_t4_ubuntu.sh --dry-run

# 기존 엔진·모델로 Ollama → llama.cpp → vLLM → SGLang + 요약
bash load_test_v1/scripts/run_t4_ubuntu.sh --background --run-date 20261001
```

설치·빌드·모델 다운로드는 수행하지 않는다. Node.js 20 이상, Python 3, T4 한 장, 동작하는 드라이버, systemd, 비대화 sudo가 필요하다. `engines.existing.example.json`을 `engines.local.json`으로 복사하고 설치된 엔진 실행 파일과 로컬 모델 경로를 지정한다. `--check-only`로 모델 형식과 엔진을 먼저 검사한다. [자동 실행 상세](ENGINES.md)에 경로 설정·짧은 점검·이어하기·중단·실패 처리 방법을 기록했다. 아래 5-1부터는 Ollama를 직접 실행할 때의 절차다.

### 5-1. 사전 준비 (EC2)

ZIP을 풀면 `load_test_v1/data/benchmark_prompts.jsonl`에 항목별 20건, 총 300건의 부하 문항이 들어 있다. 기존 품질 데이터 파일은 필요 없다. 항목별 난이도 비율도 Easy/Medium/Hard 6/8/6건으로 유지했다. RT는 고유 20문항을 한 번씩 포함한다. 추출 조건과 출처·해시는 같은 폴더의 `benchmark_prompt_sample.json`에 있다.

각 단계는 이 문항 풀을 순환하며 워밍업 후 60초·최소 40건 조건을 적용한다. 300건은 고유 문항 수이며 전체 실행 요청 수의 상한이 아니다. 15건 묶음마다 각 항목을 한 번씩 배치하며 모든 모델이 같은 seed·순서를 사용한다. 다른 문항 파일은 `LOADTEST_PROMPTS=/절대/경로/prompts.jsonl`로 지정한다. 기존 CSV도 명시적으로 지정하면 지원한다. 문항 파일이 바뀌면 다른 `LLM_TEST_TRY` 또는 `RUN_DATE`로 결과를 분리한다.

```bash
# Ubuntu 24.04에서 기존 엔진과 모델만 확인
bash load_test_v1/scripts/run_t4_ubuntu.sh --check-only

# 이미 설치된 Ollama 모델 목록 확인
ollama list

# sudo가 비밀번호 없이 되는지 (systemd 설정 변경·재시작에 필요)
sudo -n true && echo OK
```

> ⚠ **서비스용 인스턴스에서 돌리지 않는다.** 테스트 중 Ollama를 여러 번 재시작한다.
> ⚠ 테스트가 끝나면 Ollama 설정은 자동으로 원래대로 돌아간다. 중간에 강제로 죽었다면 `node load_test_v1/scripts/run_load_test.js --restore-ollama`.

### 5-2. 계획 확인

```bash
bash load_test_v1/scripts/run_all.sh --dry-run
```

### 5-3. 짧은 점검 (약 10분, 결과는 판단에 쓰지 않음)

```bash
LLM_TEST_TRY=smoke bash load_test_v1/scripts/run_all.sh --profile quick --models qwen3:4b
```

### 5-4. 정식 측정 (계획 시간 3시간 30분, 실제 소요는 결과에 기록)

SSH가 끊겨도 계속 돌도록 tmux 안에서 실행한다.

```bash
tmux new -s load
bash load_test_v1/scripts/run_all.sh
# 빠져나오기: Ctrl+B 후 D / 다시 붙기: tmux attach -t load
```

**중간에 끊겼다면** 같은 날짜로 다시 실행하면 끝난 단계는 건너뛰고 이어서 진행한다.

```bash
RUN_DATE=20261001 bash load_test_v1/scripts/run_all.sh
```

### 5-5. 요약만 다시 만들기

```bash
node load_test_v1/scripts/summarize.js --run-date 20261001
```

### 5-6. (선택) GPU 없이 스크립트만 점검 — 모의 서버

```bash
export OLLAMA_HOST=127.0.0.1:11500 OLLAMA_BIN=$PWD/load_test_v1/scripts/dev/mock-ollama \
       OLLAMA_SERVE_PATTERN='mock_ollama.js serve' MOCK_SPEED=0.25 LLM_TEST_TRY=devtest
node load_test_v1/scripts/run_load_test.js --profile quick --server-control process --models gemma3:4b
node load_test_v1/scripts/summarize.js --run-date $(date +%Y%m%d) --profile quick
```

모의 서버 숫자는 실제 T4와 무관하다. 스크립트 흐름 확인용으로만 쓴다.

## 6. 스크립트 설명

| 파일 | 역할 |
|---|---|
| `scripts/run_all.sh` | 전체 실행 래퍼 — 측정 → 요약, 화면 출력을 `raw/logs/`에 저장 |
| `scripts/run_load_test.js` | 메인 실행기 — A·B·C 진행, 서버 재시작, 멈춤 조건, 최적 설정 선택, 이어하기, 시간 예산, 종료 시 원복 |
| `scripts/summarize.js` | 결과 요약 — 상세 표 md, CSV, SVG 그래프, `all_summary.md` (모델 호출 없음) |
| `scripts/config/load_config.js` | 모델·고정 설정·단계·멈춤 조건·예산. `full`(정식) / `quick`(점검) 프로파일 |
| `scripts/lib/stream_client.js` | 스트리밍 요청 1건 — TTFT, 토큰 간격, Ollama 보고 시간, 실패 유형 |
| `scripts/lib/load_generator.js` | 동시 사용자 고정(closed-loop) · 도착률(open-loop, 포아송) · 스파이크 |
| `scripts/lib/monitor.js` | 1초 간격 VRAM·GPU 사용률·온도·클럭·CPU(전체/Ollama/부하 스크립트)·로드된 모델 |
| `scripts/lib/ollama_admin.js` | 서버 환경변수 적용 재시작(systemd override 파일 / 프로세스), 모델 사전 로딩, GPU 적재 확인, 원복 |
| `scripts/lib/prompt_pool.js` | 기본 JSONL 300건 + 항목 비율을 맞춘 seed 고정 순서. 기존 CSV 지정도 지원 |
| `scripts/lib/stats.js` | 분위수·단계 요약 |
| `scripts/lib/prompts.js` `csv.js` `jsonl.js` `suite.js` | v3에서 복사한 공통 모듈 · 경로 해석 |
| `scripts/dev/mock_ollama.js` | GPU 없이 흐름을 점검하는 모의 Ollama 서버 |

**`run_load_test.js` 주요 옵션**

| 옵션 | 설명 |
|---|---|
| `--dry-run` | 계획·예상 시간만 출력 |
| `--profile quick` | 점검용 짧은 설정 (run_id 끝에 `_quick`) |
| `--phases A,B,C` | 일부 단계만 실행 (예: 반복만 다시 `--phases C`) |
| `--server-control auto\|systemd\|process\|none` | 서버 재시작 방식 (기본 auto: systemd 서비스가 있으면 systemd) |
| `--run-date YYYYMMDD` | 이어하기·요약에 쓰는 날짜 |
| `--optimal qwen3:8b=4` | 최적 동시 처리 수를 직접 지정 |
| `--budget-min 210` | 계획 시간(분). 초과 예상 시 경고하며 측정을 생략하지 않음 |
| `--no-restore` | 끝난 뒤 Ollama 설정을 되돌리지 않음 |
| `--restore-ollama` | 원복만 실행 |
| `--models a,b` | 일부 모델만 (디버깅용 — 정식 측정에서는 쓰지 않는다) |

## 7. 결과 위치

```
load_test_v1/tryM/results/
├── all_summary.md                              # 시작점: 모델별 핵심 결과
├── summary/
│   ├── load_test_summary_<date>.md             # 단계별 상세 표
│   ├── load_steps_<date>.csv                   # 모든 단계 요약 한 표
│   └── charts/<model>_<date>_{throughput,e2e_p95,ttft_p95}.svg
└── raw/
    ├── <run_id>/
    │   ├── steps.jsonl      # 단계·라운드·서버 준비·최적 설정 기록 (이어하기 기준)
    │   ├── requests.jsonl   # 요청 1건씩: 시간·토큰 수·실패 유형·생성된 답변(content)
    │   ├── monitor.jsonl    # 1초 간격 서버 상태
    │   └── run_meta.json    # 환경·설정·코드 버전
    └── logs/                # 실행 로그, (process 모드) Ollama 서버 로그
```

- **run_id**: `<env>_<모델 태그의 :·.을 ->_<조건>_<YYYYMMDD>` — 예) `ec2-linux_qwen3-14b_t0_nothink_ctx4096_out512_sample300_load_20261001`
- `raw/` 아래 원본 기록은 측정 후 수정하지 않는다.
- **답변 원문**: `requests.jsonl`의 `content`에 저장한다. 엔진·모델·문항 ID·항목·기록 시각·단계·워밍업 여부·응답 시간·출력 토큰 수·종료 사유·오류를 함께 기록한다. 실패·타임아웃 요청도 수신한 답변 조각까지 보존한다. 문항 ID는 기본 입력 JSONL과 연결되며 입력 파일 경로·SHA-256·항목별 건수는 `run_meta.json`에 기록한다. 품질 채점은 하지 않는다.

## 8. 알려진 한계

- **LLM만 측정**한다. 임베딩 검색·Spring 백엔드·SSE 전달·네트워크 구간은 포함하지 않는다.
- 동시 사용자는 2배 간격으로 잰다. 실제 한계는 "버틴 단계"와 "다음 단계" 사이에 있다.
- **대기 시간**은 Ollama가 따로 보고하지 않아 `전체 시간 − 입력 처리 − 답변 생성`으로 추정한다. 도착률의 `max_in_flight`는 처리 중·대기 중인 미완료 요청의 합계다.
- 부하 스크립트가 같은 EC2(vCPU 4)에서 돈다. 스크립트 CPU 사용률을 단계마다 기록해 영향 여부를 확인한다.
- 기본 시스템 프롬프트를 공유하므로 프롬프트 캐시 효과가 섞인다. PS 표본에는 항목별 페르소나 지시가 추가된다.
- 문항은 부하 입력으로만 사용한다. 기본 300건 표본을 ZIP에 포함했으며, 실행 시 평가 Excel·정답 데이터 연결과 품질 채점은 필요 없다. 생성된 답변은 `requests.jsonl`에 기록한다.
- KV 캐시 절약 설정(Flash Attention, KV 8비트)은 이번에 비교하지 않았다 — 최종 튜닝 때 따로 측정한다.

## 9. 변경 기록

- **2026-10-01 관측 시간 보완**: 도착률 구간은 마지막 요청이 먼저 끝나도 설정된 관측 시간(정식 측정 60초)까지 유지한다. 그 뒤 남은 응답을 기다려 처리량 계산 기간과 GPU 모니터 기간을 맞춘다. 요청이 없는 구간과 관측 종료 후 응답 수집을 `scripts/dev/test_load_generator.js`로 검증한다.
- **2026-10-01**: 환경은 EC2 g4dn.xlarge / Tesla T4 16GB로 유지한다. full·quick 모두 측정 요청의 출력 상한을 `num_predict=512`로 추가했다. EOS가 먼저 나오면 더 적게 생성한다. 사전 로딩용 요청은 기존처럼 `num_predict=1`을 사용한다.
- 판정 기준은 E2E P95 5초 이하·실패율 5% 이하이며, 3초는 더 엄격한 참고선이다. 기존 단계 중단 조건과 타임아웃은 유지한다.
- 출력 제한 전 결과와 이전 문항 결과가 섞이지 않도록 run_id 조건에 `out512_sample300`을 추가했다. 문항 해시가 달라진 상태에서 같은 실행에 이어 붙이는 것을 막는다.
- 실행 순서를 모델별 A→B→C→서버 종료→GPU 해제 확인으로 변경했다. 엔진 간 전환도 한 번에 한 `(엔진, 모델)` 조합만 기동하도록 확장 설계에 명시했다. 중간 모델 전환에서는 기존 서비스 설정 원복을 수행하지 않으며, 전체 Ollama 실행 종료 시에는 기존 원복 옵션을 따른다.
- 출력 상한으로 끝난 요청은 `requests.jsonl`의 `done_reason`·`eval_count`·`content`로 확인한다. 현재 부하 테스트의 성공 여부는 통신·스트림 완료 기준이며, 답변 내용·정답 일치·JSON 형식 정확도는 채점하지 않는다.
- 모델 로딩과 실제 질문 워밍업 시간을 분리해 `steps.jsonl`에 기록한다. 모델 워밍업 요청도 `requests.jsonl`에 `kind=model_warmup`, `warmup=true`, `in_window=false`로 남긴다. 모든 사용자별 첫 요청이 성공할 때까지 본 측정을 시작하지 않는다. 단계별 워밍업 시간·요청 수·실패 수와 측정 구간은 상세 보고서·CSV에 포함한다.
- 모든 측정을 진행한다는 방침에 맞춰 시간 예산에 의한 반복 생략을 제거했다. 기존 안전·과부하 중단 조건은 유지한다.
- 문항은 15개 항목별 비율을 유지한 300건으로 줄였다. JSONL 기본 입력과 표본 메타데이터를 ZIP에 포함했다. 문항·답변을 품질 데이터와 연결하거나 정답 채점하지 않는다. 답변 원문과 실패 시 받은 부분 답변은 요청별 원본 기록으로 보존한다.
- T4에서 네 엔진을 비교할 전체 측정 범위는 [확장 설계안](aws_t4_llm_serving_benchmark_design.md)에 정의한다. 다른 세 엔진의 SSE 요청·서버 제어·순차 A/B/C 실행은 구현했고 추가 시나리오와 지표 구현 상태는 확장 설계안에 구분해 적었다.
