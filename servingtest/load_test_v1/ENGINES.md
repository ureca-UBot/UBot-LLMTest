# Ollama · llama.cpp · vLLM · SGLang 순차 측정

## Ubuntu 24.04 LTS: 설치된 엔진과 기존 모델만 사용

이 실행기는 설치·빌드·모델 다운로드·드라이버 변경을 하지 않는다. 서버에 준비된 엔진과 로컬 모델을 검사한 뒤 Ollama → llama.cpp → vLLM → SGLang 순서로 측정한다. Node.js 20 이상, Python 3, 동작하는 NVIDIA 드라이버, T4 한 장, systemd, 비대화 sudo가 필요하다. 실제 검사는 Ubuntu 24.04 x86_64 서버에서만 실행한다.

저장소 루트에서 실행 설정을 한 번 복사한다.

```bash
cp load_test_v1/scripts/config/engines.existing.example.json load_test_v1/scripts/config/engines.local.json
```

`engines.local.json`의 각 조합에서 `command`와 `model_path`를 서버에 있는 경로로 맞춘다. 설치하지 않은 조합은 `enabled: false`로 표시하거나 `--engines`로 필요한 엔진만 선택한다.

| 항목 | 지정 방법 |
|---|---|
| llama.cpp command | PATH의 `llama-server` 또는 실제 `llama-server` 절대 경로 |
| vLLM command | `["/실제/vllm/venv/bin/python", "-m", "vllm.entrypoints.openai.api_server"]` |
| SGLang command | `["/실제/sglang/venv/bin/python", "-m", "sglang.launch_server"]` |
| llama.cpp model_path | 기본 `ollama://qwen3:4b`처럼 기존 Ollama 태그의 GGUF 원본을 확인. 읽기 가능한 로컬 GGUF 절대 경로를 직접 지정해도 된다 |
| Python 엔진 model_path | safetensors 로컬 디렉터리 또는 `weight_format: "GGUF"`를 지정한 기존 GGUF 파일/`ollama://` 태그 |
| Python GGUF tokenizer_path | `config.json`, `tokenizer_config.json`, `tokenizer.json`이 있는 로컬 절대 경로. 파일 해시도 별도 기록 |
| version / revision | `auto`를 두면 실제 엔진 버전과 로컬 파일 SHA256을 검사해 기록 |
| quantization | 기본 `auto`. Ollama details 또는 모델의 config.json에서 확인. GGUF 파일을 직접 지정할 때는 실제 양자화 값을 지정 |
| extra_args / env | 설치된 버전에 맞는 backend 설정. 예시의 T4 backend는 실제 버전·모델에서 확인 |

Ollama 태그만 있다는 사실로 Python 엔진이 준비됐다고 판단하지 않는다. GGUF를 재사용하려면 엔진의 GGUF 로더와 해당 모델의 토크나이저가 필요하다. vLLM 0.30.0에서는 공식 `vllm-gguf-plugin`을 사용한다. `quantization`에는 실제 파일의 `Q4_K_M` 등을 기록하고, Python 엔진의 실행 인자에는 backend 이름인 `gguf`를 전달한다. GGUF 지원·성능은 엔진과 모델별로 확인해야 한다. 없는 파일은 받거나 변환하지 않고 `unavailable`로 기록한다. `HF_HUB_OFFLINE=1`, `TRANSFORMERS_OFFLINE=1`을 강제하고 토큰 환경변수는 측정 자식에 전달하지 않는다.

기존 GGUF를 재사용하는 Python 엔진의 설정 예시는 다음과 같다. `command`는 실제 가상환경 경로로 바꾸고, 나머지 기본 항목은 기존 예시를 따른다.

```json
{
  "model_path": "ollama://qwen3:4b",
  "weight_format": "GGUF",
  "quantization": "auto",
  "tokenizer_path": "/opt/models/tokenizers/qwen3-4b"
}
```

T4 서버의 설치 확인에서 llama.cpp CUDA 라이브러리 경로, Triton용 Python 개발 헤더, Python 엔진의 CUDA 라이브러리 환경을 따로 확인한다. CLI 검사에도 기동과 같은 `env`를 전달한다. vLLM 0.30.0의 attention backend는 환경변수 대신 `extra_args`의 `--attention-backend`로 명시한다.

SGLang 최신 버전의 최소 지원 GPU는 [SM80으로 변경됐다](https://github.com/sgl-project/sglang/pull/24336). T4는 SM75이며, 이 서버의 SGLang 0.5.21도 실제 GPU 추론에서 커널 오류가 발생했다. T4용 별도 환경 `/opt/sglang-t4`에는 SGLang 0.4.6.post5, 공식 CUDA 11.8 sgl-kernel 0.1.4, GGUF 연결용 vLLM 0.8.5를 설치했다. CUDA 11.8 runtime·NVRTC·cuBLAS 경로는 해당 조합의 `env.LD_LIBRARY_PATH`에 지정한다. 엔진 버전과 모델별 실제 기동 결과를 함께 확인한다.

SGLang 0.4.6.post5에는 `--skip-server-warmup`이 없으므로 해당 조합에 `skip_server_warmup: false`를 지정한다. 실행 메타데이터의 `server_warmup_disabled: false`가 이 차이를 기록한다. 엔진의 기동 중 자체 웜업과 별도로, 실행기의 모델 웜업 시간 기록 및 웜업 후 측정 단계는 유지한다. 이 설정을 생략하면 기본적으로 `--skip-server-warmup`을 사용하며 CLI가 지원하지 않을 경우 준비 검사에서 실패한다.

SGLang 0.5.21은 API 모델 이름에 `:`를 허용하지 않는다. 실행기는 API 기동·readiness·요청에 `qwen3-4b` 같은 별칭을 사용하며, 결과와 모델 선택에는 원래 `qwen3:4b` 태그를 유지한다.

```bash
# 호스트/GPU 조회, 서버 기동, 결과 쓰기 없이 계획만 출력
bash load_test_v1/scripts/run_t4_ubuntu.sh --dry-run

# 엔진과 모델을 확인하고 종료. 부하 측정은 하지 않음
bash load_test_v1/scripts/run_t4_ubuntu.sh --check-only

# 설치 없이 전체 순차 측정. SSH가 끊겨도 계속 실행
bash load_test_v1/scripts/run_t4_ubuntu.sh --background --run-date 20261001

# 준비된 엔진만 짧게 점검
bash load_test_v1/scripts/run_t4_ubuntu.sh --background --profile quick --models qwen3:4b --engines ollama,llama.cpp --try smoke --run-date 20261001
```

`--check-only`는 기존 Ollama 모델 메타데이터를 조회하기 위해 Ollama 서비스를 잠시 기동·중지하며, 완료 시 원래 설정과 실행 상태를 복원한다. 모델 생성 요청과 네이티브 모델 서버 기동은 하지 않는다. 최초 파일 SHA256 검사에는 파일 크기에 따라 시간이 걸리며 검사 시점의 크기·mtime가 같으면 다음 실행에서 재사용한다. `--dry-run`은 이런 검사도 수행하지 않는다. Node가 PATH에 없으면 `--node /실제/경로/node`로 지정한다.

기존 SLO, 15개 항목별 20건의 총 300문항, 출력 상한 512, context 4096, 웜업 후 측정 규칙을 유지한다. 각 모델은 기동 → 로딩 시간 기록 → 모델 웜업 시간 기록 → 사용자 웜업 후 A/B/C 측정 → 서버·worker 종료 → GPU·포트 해제 확인 순서다. GPU 정리가 실패하면 다음 조합을 시작하지 않는다.

검사 상태·자동 생성된 실행 설정·파일 지문은 `load_test_v1/.t4-state/`에 저장한다. 전체 로그는 `load_test_v1/automation_logs/`, 상세 로그는 `load_test_v1/try1/results/raw/logs/`에 남는다. 실행기가 출력한 PID에 `kill -TERM <PID>`를 보내면 측정 자식의 정리를 기다리고 종료한다.

전체 상태는 `try1/results/summary/automation_<날짜>_<profile>.json`, 준비 정보 사본은 `summary/preparation_<날짜>_<profile>.json`, 성능 요약은 `try1/results/all_summary.md`, 답변 원문·부분 답변은 `raw/<run_id>/requests.jsonl`이다. 누락·미설정·검사 실패·측정 실패·정리 실패를 구분하며 전체 성공만 exit 0, 일부 미완료는 1, 사용자 중단은 130이다. 같은 날짜와 try로 실행하면 완료된 측정을 이어서 사용하지만 Ollama 버전·가중치가 다르면 새 try를 요구한다.

`.t4-automation.lock`으로 전체 실행의 동시 작업을 막는다. 강제 종료 후에는 PID 종료와 GPU 해제를 확인한 뒤 해당 잠금만 정리한다. `--no-restore`는 테스트 설정을 복원하되 Ollama 서비스를 중지 상태로 유지한다. 모델·버전·양자화 차이는 결과 해석에 포함해야 하며 실제 부하 성능과 모델별 전체 조합 호환성은 별도 측정으로 확인한다.

`engines.existing.example.json`의 `auto`와 `ollama://`는 `run_t4.py`가 처리한다. 아래의 `run_engines.js`를 직접 사용할 때는 기존 `engines.example.json` 형식대로 실제 절대 경로와 메타데이터를 지정한다.

## 개별 엔진을 직접 실행하는 경우

실제 모델 기동과 측정은 Linux AWS T4 EC2에서 수행한다. 로컬에서는 `--dry-run`과 모의 테스트만 실행한다. 이 패키지는 Node 내장 모듈만 사용하며 엔진·CUDA·모델 파일은 EC2에 별도로 설치한다. 설치 버전과 T4의 모델·양자화·attention backend 호환성을 확인한 뒤 조합을 활성화한다. 실행기가 최신 버전을 자동 설치하거나 T4 호환성을 보장하지 않는다.

## 설정

`scripts/config/engines.example.json`은 세 엔진 × 네 모델의 12개 설정을 포함한다. Ollama의 네 조합은 기존 `scripts/run_all.sh`로 실행한다. 예시 파일을 `engines.local.json`으로 복사하고 실행할 조합의 값을 채운다.

- `enabled`: 실제 구성 준비 후 true. 미설정 조합도 결과에 `unconfigured`로 남긴다.
- `command`: llama.cpp는 llama-server 실행 파일. vLLM·SGLang은 해당 가상환경 Python과 `-m`, 서버 모듈의 배열이다. 셸 문자열로 실행하지 않는다.
- `model_path`: 이미 내려받은 EC2 로컬 GGUF 파일 또는 Hugging Face 모델 디렉터리의 절대 경로.
- `version`, `revision`, `weight_format`, `quantization`: 실제 설치 버전·가중치 리비전/해시·형식·양자화. 양자화를 사용하지 않으면 `none`. GGUF의 양자화는 예를 들어 실제 파일의 `Q4_K_M`을 기록한다.
- `dtype`: T4 시험에서는 half/float16. `memory_fraction` 기본 0.85는 시험 설정이며 모델마다 검증한다.
- `extra_args`, `env`: 버전에 필요한 attention backend·KV cache·chat template 등의 설정. 모델·context·병렬 수·서버 토폴로지·CPU offload는 덮어쓸 수 없다. 환경변수와 인자는 실행 메타데이터에 남으므로 자격 증명을 넣지 않는다.
- `merge_system_to_user`: Gemma처럼 system 역할을 받지 않는 템플릿은 첫 user 입력에 같은 지시 내용을 합친다. 실제 전송 본문은 요청 기록에 남는다.

Qwen 요청에 `chat_template_kwargs.enable_thinking=false`를 보낸다. llama.cpp 기동에도 같은 template 값을 고정한다. 별도 reasoning_content가 반환되면 `thinking_not_disabled` 실패로 기록한다. 숨겨진 reasoning을 엔진이 노출하지 않는 경우까지 자동 검증한다고 가정하지 않는다.

## EC2 순서

한 T4에 한 서버·모델만 둔다. 시작 전 기존 Ollama 서비스와 다른 GPU 작업을 종료해야 한다. 실행기는 남아 있는 GPU 프로세스를 임의로 죽이지 않으며, GPU가 점유 중이면 전환을 중단한다. 이 실행기는 Ollama 서비스를 자동 원복하지 않는다. 전체 비교가 끝나고 GPU 해제를 확인한 뒤 평소 서비스를 원복한다. Ollama 비교를 먼저 할 때는 `run_all.sh --no-restore`를 사용해 다른 엔진 측정 중 재기동되지 않도록 한다.

저장소 루트에서 실행한다.

```bash
# 모델을 띄우지 않는 계획 확인
node load_test_v1/scripts/run_engines.js --config load_test_v1/scripts/config/engines.local.json --dry-run

# 짧은 흐름 점검: EC2에서 실제로 모델을 띄움, 결과는 성능 판단에 사용하지 않음
LLM_TEST_TRY=smoke node load_test_v1/scripts/run_engines.js --config load_test_v1/scripts/config/engines.local.json --profile quick --engines llama.cpp --models qwen3:4b

# 준비된 세 엔진 조합의 정식 측정
node load_test_v1/scripts/run_engines.js --config load_test_v1/scripts/config/engines.local.json --run-date 20261001
node load_test_v1/scripts/summarize.js --run-date 20261001
```

각 조합은 기동·모델 readiness → 모델 워밍업 → A 단계적 증가 → B Spike·도착률 → C 반복 → 서버/worker 종료 → GPU·포트 해제 확인 순서다. 모든 모델은 동일한 300건 표본을 사용한다. 출력 상한 512, context 4096, 기존 E2E P95 5초·실패율 5% SLO와 중단 조건을 유지한다.

병렬 설정은 llama.cpp slots, vLLM max-num-seqs, SGLang max-running-requests에 각각 매핑한다. 같은 숫자를 같은 스케줄러 구현으로 해석하지 않는다. llama.cpp의 전체 context는 `4096 × slots`로 설정하고 자동 context shift를 끈다. 버전별 CLI와 엔진 버전은 기동 전 확인하며 미지원 인자는 조합 실패로 기록한다.

같은 날짜·try·설정으로 재실행하면 완료된 단계는 재사용한다. 엔진 설정 해시가 run_id에 포함되고 문항 해시가 다르면 이어 붙이지 않는다. `engine_benchmark.lock`으로 이 실행기의 동시 실행을 막는다. 강제 종료로 잠금이 남으면 기록된 PID가 종료됐는지, GPU·포트가 해제됐는지 확인한 뒤 해당 잠금만 정리한다.

## 기록과 한계

`engine_matrix_<date>.json`은 완료·미설정·측정 불가·실패·정리 실패를 구분한다. 실패 조합을 완료로 표시하지 않는다. 정리 실패 시 다음 조합을 시작하지 않는다. 모델/버전 설정이 달라지는 경우 새로운 run_id로 기록한다.

요청별 답변 원문·부분 답변·시각·문항 ID·워밍업 여부·응답 시간·토큰 수·종료 사유·전송 본문은 `raw/<run_id>/requests.jsonl`에 남는다. 토큰 usage가 없는 응답은 토큰 처리량을 미지원(null)으로 두며 응답 조각 수로 토큰 수를 추정하지 않는다. SSE의 TTFT·조각 간격·TPOT·사용자 tok/s를 계산하고 서버 decode 시간·요청별 실제 queue time이 없으면 null로 기록한다. 품질 채점은 하지 않는다.

네이티브 엔진의 측정 요청은 매번 새 HTTP 연결을 사용한다. T4의 llama.cpp b11320에서 keep-alive 소켓을 재사용하면 연속 요청 8건 중 4건이 `ECONNRESET`으로 실패했고, 새 연결에서는 8건 모두 성공했다. llama.cpp·vLLM·SGLang에 같은 연결 조건을 적용하며 재시도는 하지 않는다. 연결 시간은 요청 시간에 포함하고 `run_meta.json`의 `transport`, 요청별 `http_keep_alive`·`socket_reused`에 기록한다. 기존 Ollama 결과는 keep-alive 조건이므로 비교 시 이 차이를 함께 표시한다. 연결 조건을 변경한 측정은 새 try에 저장한다.

새 엔진의 로딩 시간은 프로세스 spawn부터 해당 모델의 readiness 성공까지다. 엔진 초기화·메모리 준비를 포함하는 시간이며 Ollama의 preload 요청 시간과 측정 시작점이 다르다. 별도 모델 워밍업 시간과 사용자 워밍업 시간을 기록한다. llama.cpp·SGLang의 내부 warmup을 끄고 vLLM은 eager 실행을 사용한다. 별도 내부 초기화가 있다면 readiness 시간에 포함된다.

GPU·전력·RAM·CPU와 엔진 `/metrics` 원문을 모니터링한다. running/queued gauge를 5초마다 수집하며 표본 최대값으로 표시한다. 서버에서 미제공하는 지표는 채워 넣지 않는다. 실제 부하·OOM·모델별 양자화 호환성은 별도 측정으로 확인한다. 사용자 5/10 추가 단계, Burst 10, Steady State, Shared Prefix, Long Prompt와 요청별 queue time 공통 집계는 추가 구현 항목이다.

## 공식 규격 참고

- [llama.cpp 서버 CLI·OpenAI 호환 API](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md)
- [vLLM OpenAI 호환 API](https://docs.vllm.ai/en/latest/serving/openai_compatible_server.html)
- [vLLM GGUF 로더와 공식 플러그인](https://docs.vllm.ai/en/latest/features/quantization/gguf/)
- [SGLang 서버 인자](https://docs.sglang.io/docs/advanced_features/server_arguments)
- [Qwen3 SGLang의 thinking 설정](https://github.com/QwenLM/Qwen3/blob/main/docs/source/deployment/sglang.md)

2026-10-01 구현. 실행 시 설치된 버전의 `--help`로 필요한 인자를 다시 확인한다.
