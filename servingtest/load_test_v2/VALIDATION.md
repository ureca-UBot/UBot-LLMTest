# v2 검증 기록 — 2026-10-02

구현·모의 검증을 완료한 뒤, 추가로 승인된 로컬 엔진 종료 진단을 수행했다. 실제 엔진의 성능 비교, 모델 등록·다운로드, T4 실행은 수행하지 않았다.

## 결과

- 메모리 정리 보강 후 `node --test load_test_v2/scripts/dev/test_*.js`: **147개 통과, 실패 0**. 마지막 client/monitor 종료 오류 처리 보완 후 다음 엔진 차단 회귀 테스트도 다시 통과했다.
- PID 목록이 비어도 VRAM이 남으면 실패, 지연 해제 후 연속 3회 기준선 복귀는 통과, N/A·GPU 변경·포트 재점유·Docker 제거 미확인은 실패하는 것을 합성 자료로 확인했다.
- 정리 실패한 회차는 성능·품질 판정에서 제외하고 다음 엔진을 실행하지 않으며 잠금을 유지하는 전체 실행기 회귀 테스트가 통과했다. 이 테스트가 소유한 모의 프로세스의 종료를 확인한 뒤 테스트 잠금만 정리했다.
- 네 API(Ollama NDJSON, llama.cpp/vLLM/SGLang SSE)에 각각 300문항, 총 1,200건을 보내 원문 저장·파일 지문·출력 계약 재검증을 확인했다.
- 고정 측정 구간, 사용자별 warmup barrier, drain 제외 처리량, 3회 독립 반복과 회차별 후보 순서 회전, 품질 pending 차단, Poisson 도착률, 후반 큐 추세 판정을 검증했다.
- 잘못된 JSON/근거 ID, reasoning 노출, 출력·입력 절단, 입력 토큰 예산 초과, timeout/취소, usage 누락, 부족한 표본, 위조/누락된 품질 자료를 판정하는 테스트가 통과했다.
- 소유한 모의 프로세스 종료와 lock 해제를 확인했다. Docker 소유권·알 수 없는 생성 결과·GPU monitor 오류는 모의 명령 반환값으로 검증했다.
- 실제 후보 예시의 dry-run은 성공했다. 모든 실제 후보는 `enabled=false`이며 서버 명령과 파일 쓰기를 실행하지 않았다.
- 작업 시작 때 기록한 v1 원본 38개 파일의 SHA-256을 다시 비교했다. 변경 0개. 외부 servingtest 코드는 편집하지 않았다.

통합 결과: `results/integration_ef8348d9-e4eb-4a4a-a5d5-ac8b372018d9/` 아래 `screen`, `quality`, `confirm`, `arrival`의 `report.json`. 준비 실패 회귀 결과: `results/arrival_preparation_regression/report.json`.

## 확인된 한계

모의 서버의 토큰 수, 버전, GPU 적재 상태, 모델 계보와 의미 품질 승인은 합성 자료다. 실제 `C_SLO`와 `lambda_slo`는 모의 결과에서 `null`이며 합성 판정은 `simulated_*`로 분리한다. 실제 엔진별 설정 확인 probe, 검토된 상위 체크포인트 계보, 실제 전체 문항 토큰 예산과 의미 품질 검토가 채워져야 정식 측정을 시작할 수 있다. P95 5초·실패율 1%와 큐 증가 허용 오차는 잠정 기준이다.

실제 실행은 실행기가 소유한 Docker로 한정한다. 서버·worker 메모리의 정리는 컨테이너 제거·포트 해제로 확인하고, GPU 메모리는 동일 GPU에서 전체 실험 시작 시 고정한 VRAM 기준선으로 연속 3회 복귀해야 인정한다. 기본 허용 오차는 0MiB다. 운영체제의 회수 가능한 파일 페이지 캐시와 드라이버 기본 메모리는 엔진의 모델 상주 메모리와 구분한다. 정식 실행기의 엄격한 GPU 해제 판정은 아래 Windows 관측으로 대체하지 않는다.

## Ollama 잔여 자료 조회

로컬 기본 서버 `http://127.0.0.1:11434/api/ps`를 읽기 전용으로 조회한 결과 `models: []`였다. 이 서버에는 조회 시점에 적재된 모델이 없다. `/api/tags`의 등록 모델은 기존 EXAONE 3.5 7.8B와 BGE-M3였다.

실험용 `results/20261002/local_probe/ollama_models/models/`에는 `qwen3:4b` manifest와 2,497,280,480바이트(약 2.50GB, 2.33GiB)의 GGUF blob 및 작은 메타데이터가 남아 있다. 다음 검증을 위해 보존한 **디스크 캐시**이며 GPU 적재 상태를 의미하지 않는다. 이 조회는 모든 Docker 서버의 현재 GPU 상태를 검증한 결과가 아니다. 캐시와 기존 서비스는 변경하지 않았다.

## 실제 로컬 엔진 종료 진단

RTX 3060 12GB·Windows WDDM·Docker WSL에서 `scripts/dev/run_local_cleanup_probe.js`를 실행했다. 결과는 `results/local_cleanup_20261002_01/report.json`, 엔진별 원문·프로세스·RAM·종료 증거는 각 `round.json`, 실제 서버 기록은 각 `server.log`다. 진단 상태는 `completed_diagnostic`이며 각 엔진에 짧은 추론 2건을 보냈고 총 8건 모두 HTTP 응답과 양수 출력 토큰을 확인했다. 생성 품질이나 동시성을 채점한 실험은 아니다.

시작 전 VRAM 10개 표본은 2,259~2,339MiB였다. 이후 모든 엔진에서 이 고정 상한 2,339MiB 이하를 연속 3회 확인했다. 높은 다음 표본으로 기준을 재설정하거나 추가 오차를 주지 않았다. 아래는 시스템 전체 GPU VRAM으로, 엔진별 할당량만 분리한 값이 아니다.

| 엔진 | 추론 후 상주 VRAM (MiB) | 컨테이너 종료 후 마지막 VRAM (MiB) | 종료·제거·포트 해제 | 기준선 이하 3회 |
|---|---:|---:|---|---|
| Ollama 0.34.0 | 7,292 | 2,330 | 확인 | 관측 |
| llama.cpp CUDA | 7,225 | 2,329 | 확인 | 관측 |
| vLLM 0.30.0 | 11,501 | 2,240 | 확인 | 관측 |
| SGLang 0.4.6.post5 | 10,516 | 2,255 | 확인 | 관측 |

Ollama는 `keep_alive=-1` 추론 후 `/api/ps`에 모델이 상주하고 `size_vram=5,072,937,287`바이트인 것을 확인했다. 같은 소유 서버에 `keep_alive=0` unload를 호출한 뒤 `/api/ps`는 `models: []`, 총 VRAM은 2,307MiB였다. 그 뒤 서버 컨테이너까지 제거했다. 기존 11434 서비스는 전후 `models: []`였고 조회만 수행했다. 마지막 Docker 조회에서 실험 session label의 컨테이너는 0개이며 실험 잠금도 해제됐다.

Windows의 프로세스별 VRAM은 `N/A`이고 WSL의 compute 프로세스 조회에는 제한이 있다. 따라서 모든 결과는 `strict_gpu_release=unsupported`, `benchmark_eligible=false`, `c_slo=null`이다. 총 VRAM 복귀는 관측했지만, 화면·브라우저 메모리 변동이 일부 잔류를 가릴 수 있어 완전한 GPU 해제 증명으로 승인하지 않는다. [NVIDIA-SMI 문서](https://docs.nvidia.com/deploy/nvidia-smi/index.html), [CUDA on WSL 문서](https://docs.nvidia.com/cuda/wsl-user-guide/).

기존 GGUF는 Thinking-2507이고 AWQ는 Qwen3-4B이므로 엔진 성능 순위 자료로 재사용하지 않는다. 이번 변경의 GPU 종료·Runtime·Windows 관측 관련 테스트 63개가 통과했고 v1 파일 38개의 SHA-256은 변경 0개였다.

## HTTP 완료 8 RPS 탐색 — Ollama 기준 측정

사용자는 목표를 **HTTP 완료 8 RPS, 지연 제한 없이 탐색**으로 선택했다. 해당 dev 실행기·HTTP 요약기·후보 정의를 추가했고 관련 모의 테스트 20개가 통과했다. 기존 정식 SLO·품질·GPU 정리 gate는 변경하지 않았다.

`results/http_8rps_20261002_01/report.json`은 기존 11434 서비스가 응답하지 않아 엔진 기동 전에 중단한 기록이다. Docker 조회에서 그 서비스의 종료와 포트 해제를 확인한 뒤 `results/http_8rps_20261002_02/report.json`의 실제 Ollama 측정을 수행했다. 기존 서비스를 다시 기동하거나 변경하지 않았다.

이번 Ollama는 공식 Qwen3-4B GGUF Q4_K_M revision `bc640142c66e1fdd12af0bd68f40445458f3869b`를 소유 임시 컨테이너에만 로드했다. 실제 파일 SHA-256은 `7485fe6f11af29433bc51cab58009521f205840f5b4ae3a32fa7f92e8534fdf5`이다. AWQ 캐시 파일 SHA-256도 `a7043493ebd993f5fea18794ad7b5b3e064a52023f392a7fcce7ce0984c341f0`으로 기록했지만 이 회차에서는 AWQ 엔진을 아직 실행하지 않았다. 공식 카드의 base_model 선언은 확인했으며 정확한 upstream 변환 commit 동일성은 미승인 상태다.

실제 `think:false` 디버그 렌더가 닫힌 `<think>\n\n</think>\n\n` prefix로 끝나는 것을 확인했다. 모델 전체 GPU 적재·context 4096을 확인했고 원문 300문항의 균형 seed 순환 풀, 출력 상한 512, temperature 0, JSON Schema·HTTP/1.1 스트리밍·연결 재사용을 적용했다. 내부 병렬도 P4를 고정하고 각 U를 30초씩 측정했다.

| U | 창 내 HTTP 완료 | HTTP RPS | P95초 (참고) | 평균 출력 토큰 (창 내) |
|---:|---:|---:|---:|---:|
| 1 | 16 | 0.5333 | 2.949 | 139.69 |
| 4 | 31 | 1.0333 | 8.361 | 128.71 |
| 8 | 24 | 0.8000 | 15.385 | 113.92 |
| 16 | 33 | 1.1000 | 16.679 | 117.85 |
| 32 | 36 | 1.2000 | 27.015 | 115.64 |

최고 관측값은 U32의 1.2 RPS로 목표에 미달했다. U1은 최소 완료 표본 20건에 못 미쳤다. drain 완료는 RPS에서 제외했고, 전체 입장 요청 201건의 HTTP 실패는 0건이었다. 형식·근거 검사 실패 4건은 참고값이며 처리량 목표 판정에는 사용하지 않았다. 이전 Thinking-2507·60문항 기록과 배수를 비교하지 않는다.

컨테이너 제거·서버와 worker 종료·포트 반환은 확인했지만 고정 GPU 시작 범위 2,237~2,252MiB로의 복귀는 확인하지 못했다. 첫 정리 60초의 정상 표본 106개가 모두 2,260~2,279MiB로 상한을 초과했다. 추가 60초를 같은 기준으로 재관측한 `gpu_recovery_observation.json`도 복귀 실패이며 마지막 값은 2,267MiB였다. Windows 카운터도 이 작은 차이의 소유자를 확정할 근거가 되지 못했다.

따라서 회차는 `cleanup_unverified`, 잠금 유지, Ollama의 승인된 비교 기준값은 `null`이다. 측정 원문은 보존했으며 다음 다섯 후보는 실행하지 않았다. 이번 P4·U≤32 관측을 Ollama의 모든 구성의 한계로 일반화하지 않는다. GPU 기준선을 올리거나 T4·기존 서비스 재시작으로 정리 문제를 우회하지 않았다.

## HTTP 완료 8 RPS 탐색 — 로컬 64 MiB 승인 후 재개

사용자가 로컬 VRAM 변동 64 MiB를 허용해 `results/http_8rps_20261002_03/report.json`에서 나머지 다섯 후보를 실제 실행했다. 상태는 `completed_exploration`이다. 원래 기준선 2,237~2,252 MiB와 GPU UUID를 유지하고 판정 상한만 2,316 MiB로 고정했다. 엔진마다 기준선을 재설정하거나 허용치를 누적하지 않았다. 정식 GPU·SLO gate는 변경하지 않았다.

복구 때 이전 PID 종료, session label 컨테이너 0개, 여섯 실험 포트 반환을 재확인했고 같은 GPU에서 1,890 MiB를 포함한 기준선 이하 연속 3회 관측을 확인했다. `recovery_proof.json`과 `previous_lock.json`에 증거를 기록했다. 원래 `_02/report.json`의 SHA-256·응답·단계는 보존하고, 새 보고서에는 `original_cleanup_failure`와 새 복구 결과를 함께 남겼다. workload·seed·생성·전송 조건 및 GGUF/AWQ 가중치 실제 SHA-256을 다시 비교한 후 Ollama 측정값만 재사용했다.

RTX 3060 12GB에서 동일 300문항 풀, context 4096, 출력 상한 512, temperature 0, thinking off, 공통 JSON Schema·HTTP/1.1 streaming·keep-alive·재시도 0을 사용했다. 각 U는 30초 단일 창이며 정상 2xx 스트림이 창 안에서 완료한 건수만 RPS에 포함했다. 지연·실패율·출력 품질의 합격 상한은 없다. P는 엔진 내부 실행 상한, U는 클라이언트 동시 요청 수다.

| 후보 | P | 최고 관측 U | 창 내 HTTP 완료 | HTTP RPS | Ollama 대비 | 정리 후 VRAM MiB |
|---|---:|---:|---:|---:|---:|---:|
| Ollama GGUF Q4_K_M | 4 | 32 | 36 | 1.2000 | 1.0000 | 1,890 (재개 복구) |
| llama.cpp GGUF Q4_K_M | 4 | 8 | 46 | 1.5333 | 1.2778 | 1,872 |
| vLLM AWQ | 8 | 16 | 115 | 3.8333 | 3.1944 | 1,871 |
| SGLang AWQ | 8 | 8 | 111 | 3.7000 | 3.0833 | 1,871 |
| vLLM AWQ | 32 | 16 | 114 | 3.8000 | 3.1667 | 1,882 |
| SGLang AWQ | 32 | 32 | 132 | 4.4000 | 3.6667 | 1,968 |

SGLang P32의 U64도 132/30=4.4 RPS였다. 최고는 4.4 RPS로, 어떤 시험 후보도 목표 8 RPS에 도달하지 않았다. vLLM P8/P32 최고값 차이는 완료 한 건이므로 확대 효과를 관측하지 못한 것으로 해석한다. SGLang 후보 전환은 `max-running-requests`와 CUDA graph 최대 batch를 함께 8→32로 바꿨으므로 순수 P 하나만의 인과 효과로 분리하지 않는다. 모든 엔진의 최적 설정이나 하드웨어의 절대 한계를 확정한 결과는 아니다.

실제 로그에서 vLLM은 pinned AWQ·tokenizer revision, CUDA, AutoAWQ Marlin, FlashAttention 2, prefix caching·chunked prefill과 GPU KV 적재를 확인했다. SGLang은 같은 AWQ revision, CUDA, `cpu_offload_gb=0`, AWQ Marlin·CUDA graph와 GPU weight/KV 적재를 확인했다. llama.cpp는 GPU layer 99 요청·네 슬롯·슬롯당 context 4096을 확인했지만 현재 verbosity의 로그에는 실제 offloaded-layer 수가 없어 전층 GPU 적재를 독립적으로 확정하지 않는다. Ollama의 실제 full GPU 적재·thinking-off 렌더는 원래 측정 증거를 유지했다.

전체 입장 요청(측정 창에 시작, drain 포함)은 후보 순서대로 201/241/417/426/448/504건이었다. HTTP 완료 실패는 llama.cpp의 network 실패 6건이며 다른 후보는 0건이다. 출력 계약 참고 실패는 Ollama 4건, vLLM P32 2건, SGLang P32 2건이다. SGLang P32 U64의 한 건은 창 안 HTTP 완료지만 근거 ID 검사가 실패해 HTTP RPS 4.4와 참고 유효 RPS 4.3667을 구분했다. reasoning 누출은 모든 후보 0건, Ollama 출력 절단 참고값은 3건이었다. 이 참고 실패·절단을 HTTP 완료 목표에서 제외하지 않았다.

모든 후보의 소유 컨테이너 제거·포트 반환과 고정 VRAM 상한 내 연속 3회 관측이 통과했다. 최종 Docker 조회의 session label 컨테이너는 0개이며 `.benchmark.lock`이 해제됐다. 기존 11434 서비스는 종료된 상태와 포트 반환을 조회했으며 변경하지 않았다. 관련 dev 테스트 66개 통과, v1 38개 파일 변경 0개, 원본 `_02/report.json` 지문 불변을 확인했다. T4 실행은 하지 않았다.

단일 30초 창의 최고값이며 같은 풀이라도 완료 문항·평균 출력 길이는 엔진마다 달랐다. prefix cache를 사용하는 조건이며 반복 변동·배경 GPU 작업·지속 도착률은 별도로 검증하지 않았다. Windows WDDM의 per-process VRAM 제한과 정확한 변환 계보·의미 품질 미승인 때문에 `formal_benchmark_eligible=false`, `strict_gpu_release=unsupported`, `c_slo=null`, `lambda_slo=null`을 유지한다.

## 모델 캐시 위치 정리

2026-10-02 사용자 요청으로 모델 저장소 세 개를 워크스페이스 루트 `model_assets/`로 이동했다. `results/20261002/local_probe/hf_cache`는 `model_assets/huggingface`, 같은 probe의 `ollama_models`는 `model_assets/ollama/thinking_2507`, `results/20261002/format_transport_probe/ollama_models`는 `model_assets/ollama/qwen3_4b_classic`으로 구분했다. 16.972 GiB의 모델 자료를 동일 드라이브 내에서 이동했으며 측정 결과와 중복 가중치는 삭제하지 않았다.

파일 114개의 상대 경로·크기·수정 시각·속성이 이동 전후 동일했고 원래 캐시 하위 구조를 유지했다. 네트워크·GPU를 사용하지 않는 읽기 전용 Linux 컨테이너에서 링크 25개, BF16 shard 3개의 헤더, 모델·tokenizer JSON을 확인했다. GGUF·AWQ와 두 Ollama 가중치의 실제 SHA-256 네 개가 기존 지문과 일치했다. 원래 경로와 새 경로는 `model_assets/relocation_manifest.json`, Linux 검사 증거는 `model_assets/link_verification.json`이다.

dev 실행기의 캐시 mount와 가중치 지문 경로를 `scripts/dev/model_assets.js`로 모았다. host 경로 외 후보 설정과 Modelfile 내용은 변경 전후 동일하며 관련 검사 23개가 통과했다. 과거 보고서의 경로·지문은 당시 기록으로 보존하고 이동 manifest로 현재 위치를 대응한다. 추론 실험과 T4 실행은 수행하지 않았다.
