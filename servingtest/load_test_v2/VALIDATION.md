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

## 클라우드 선택 준비 — 구현·모의 검증

2026-10-02 `--candidate`의 준비 범위를 해당 엔진과 공통 runner, 대응 모델로 제한했다. 후보를 생략하면 기존 전체 검증을 유지한다. 전체 소스·설정·이미지·모델 잠금의 메타데이터는 계속 검증하며, 선택하지 않은 모델·이미지·mount의 실물 부재만 허용한다. 보고서에 후보·이미지·모델 준비 범위를 기록한다.

`bootstrap_images.py --pull`은 공개 Ollama·llama.cpp·vLLM의 고정 digest를 준비 단계에서만 사용한다. 커스텀 SGLang·runner는 기존 tar를 사용한다. 선택 archive SHA를 모두 확인한 뒤 runner 내용 지문을 먼저 검증하며, 공개 이미지도 지문이 일치한 뒤 alias를 붙인다. 실제 엔진 실행은 검증한 불변 image ID로 고정하고 기존 GPU 정리 gate를 유지한다.

bundle 테스트 10개, 모델 준비·archive 테스트 15개, Python bootstrap 모의 테스트 19개와 런처·실행기 통합 모의가 통과했다. 작은 가짜 모델·가짜 Docker 응답으로 선택 자산 부재/변조, 전체 잠금 변경, 기본 전체 모드와 정리 실패 시 다음 엔진 차단을 확인했다. 실제 registry pull·모델 다운로드·GPU 실행·서버 변경은 수행하지 않았다.

`docker_artifacts/on_demand_20261002_01/`에 새 소스 ZIP과 기존 runner tar, 전체 이미지 transfer 메타데이터를 따로 만들었다. 모델·다른 엔진 tar가 없는 이 폴더에서 Ollama `--pull --verify-only`가 통과했고 Docker·네트워크 호출은 0회였다. Ollama·vLLM Node dry-run도 대응 모델 1종과 이미지 2개만 표시하며 통과했다. 이 검사는 실제 모델 준비나 엔진 기동 성공을 뜻하지 않는다.

새 source lock SHA-256은 `95c5a74ae468cfedc68bced918acc6ba0c3c316cacc9675151676571c68fc075`, source ZIP SHA-256은 `a0209bd39b522a3181a72560cd92692781448ead09e90d4773f7de279dc21466`이다. 원래 frozen 묶음의 소스 사본·ZIP과 이미지·모델·측정 조건 잠금은 보존했다. Git 커밋·push는 하지 않았다.

## 새 EC2 T4 실행 준비 — CDI 지원

사용자가 새 EC2 T4에서 실제 여섯 후보를 실행하도록 지정했다. 읽기 검사에서 T4 한 장·VRAM 0/15,360 MiB·compute PID 없음·driver 595.91.07·Docker 29.8.1·약 41.12 GiB 여유를 확인했다. 기존 네 컨테이너와 `serving` clone을 보존하며, 기존 Ollama 이미지의 내용 지문은 고정 snapshot과 일치했다. 원격 clone의 이전 source lock 및 47개 파일도 일치했으나 실험 GGUF/AWQ는 준비되지 않았다.

Toolkit 미설치 상태에서 시작한 Docker의 `--gpus` 드라이버 등록은 데몬 시작 시 수행된다. 운영 데몬 재시작 없이 native CDI를 쓰도록 `--gpu-mode gpus|cdi`를 추가했다. 기본값은 기존 `gpus`이고, CDI 실행에서는 엔진을 측정한 GPU UUID에만 연결한다. 어떤 모드의 dry-run도 GPU·socket을 사용하지 않는다. CLI 오류·GPU selector 혼입·UUID 고정·기존 기본 방식·CDI 방식·정리 gate의 모의 검증 및 독립 코드 검토를 통과했다.

엔진·모델·측정 profile 잠금은 그대로이며 새 소스 묶음은 `docker_artifacts/on_demand_20261002_02/`다. source lock SHA는 `998b52644f29a2628d021f78191c363f513481714db92f6a7d3579feefeeffe7`, source ZIP SHA는 `9c07cdb67efc3bb90d6f47f9e785db9d56e018bbe8454be3850b90d8732d35ec`이다. ZIP 48개 파일 복원·SHA 및 선택 준비 검사도 통과했다. Toolkit 1.20.1-1 설치·CDI 생성은 자동 승인 검토가 공유 서버의 시스템 변경에 대한 명시적 승인을 요구해 실행되지 않았으며, 이 기록 시점에는 사용자 승인과 실제 T4 측정을 기다린다.

## 사용자 승인 후 새 EC2 준비 완료

이후 사용자가 네 패키지 설치·CDI 설정을 명시적으로 승인했다. 새 EC2에 `libnvidia-container1`, `libnvidia-container-tools`, `nvidia-container-toolkit-base`, `nvidia-container-toolkit`을 모두 `1.20.1-1`로 설치하고 `/var/run/cdi/nvidia.yaml`을 생성했다. 동일 T4 UUID의 CDI 접근 확인도 통과했다. Docker 재시작·설정 변경·기존 네 컨테이너 종료·디스크 포맷은 하지 않았다.

원격 clone 대신 `/home/ubuntu/llm-bench/t4_http_20261002_01/source`에 별도 source02를 복원했다. 47개 파일과 source lock·ZIP·모델·이미지·HTTP profile의 지문을 확인하고 후보별 실제 실행에 사용한다. 기존 Ollama 이미지의 내용은 재사용하고 다른 이미지는 필요한 시점에 준비한다. 공간 확보를 위해 실험에서 새로 추가한 llama.cpp·vLLM 이미지에 한해 실행·GPU 정리 및 모든 컨테이너의 미참조를 확인한 뒤 제거했다. 기존 이미지·컨테이너는 보존하며 `prune`은 사용하지 않았다.

고정 AWQ 공식 `config.json`의 SHA는 정확히 일치했지만 source02 준비 검사가 추가 `modules_to_not_convert: null` 때문에 중단했다. 기존 소스·모델·config·잠금 바이트를 바꾸지 않고, 추가 키가 정확히 하나이며 null인 것을 확인한 외부 복구 코드로 7개 파일의 크기·SHA 및 나머지 메타데이터를 모두 검증했다. `.prepared.json`과 별도 `awq_preparation_recovery.json`의 일치도 검증한다. 실제 실행기는 다시 실제 파일 SHA를 검사하고, 외부 실행기가 복구 영수증·원래 모델 잠금·고정 source02 identity를 검사한다.

후속 source03는 이 준비 검사만 수정한다. 잠금이 해당 키를 생략하고 실제 값이 null일 때 비교 사본에서 한 항목을 제거하며, null 이외의 값·알 수 없는 추가 키·누락된 필수 키·파일 SHA 변조는 계속 거부한다. 의미 있는 회귀 테스트 22개가 통과했고 독립 코드 검토·47개 소스 및 ZIP 48개 파일의 SHA·선택 준비 검사·CDI dry-run도 통과했다. source03 lock SHA는 `0e37e0578c0c7f8925150312d814b4e216018de1b87d3e8bf6ee4176fe340b6d`, ZIP SHA는 `9a2bd345a38cf6d91fedc29302db38806db17e728ebc3a5fe4dbda3cd63390b9`이다. 엔진·모델·측정 profile 잠금은 그대로이며, source03를 source02 실제 측정의 identity로 소급 적용하지 않는다.

## 새 EC2 T4 — 여섯 후보 실제 HTTP 완료 탐색

2026-10-02 새 EC2의 동일 T4 한 장에서 고정 여섯 후보를 모두 실제 실행했다. 실제 실행 소스는 위 source02이며 각 후보의 종료 코드가 0이고 상태가 `completed_exploration`이다. 후보별 원문·응답·server log·GPU 표본과 외부 증거는 `docker_artifacts/cloud_runs/t4_http_20261002_01/raw/`, 별도 비교 결과는 `comparison_final_01.json`에 있다. 원문 report에 다른 실행의 Ollama 비율을 채우거나 source03 지문을 덮어쓰지 않았다.

같은 300문항 풀·seed 20261002·context 4096·출력 상한 512·temperature 0·thinking off·공통 JSON Schema·HTTP/1.1 streaming·keep-alive·재시도 0을 사용했다. 각 U는 30초 단일 측정 창이고, 창 안에서 정상 2xx 스트림을 완료한 건수만 RPS에 포함한다. drain 완료는 제외하며 지연·품질·실패율의 합격 상한은 없다. P는 엔진 내부 실행 상한이고 U는 클라이언트 동시 요청 수다. 아래 최고값은 최소 완료 표본 20건을 충족한 단계 중 관측 최대값이며, 동률 U를 함께 표시했다.

| 후보 | P | 최고값 관측 U | 창 내 완료 | HTTP RPS | Ollama 대비 | 전체 측정 요청 HTTP 실패 |
|---|---:|---|---:|---:|---:|---:|
| Ollama GGUF Q4_K_M | 4 | 8 / 16 / 32 | 22 | 0.7333 | 1.0000 | 0 |
| llama.cpp GGUF Q4_K_M | 4 | 8 / 16 | 29 | 0.9667 | 1.3182 | 117 |
| vLLM AWQ | 8 | 32 | 55 | 1.8333 | 2.5000 | 0 |
| vLLM AWQ | 32 | 64 | 59 | 1.9667 | 2.6818 | 0 |
| SGLang AWQ | 8 | 16 / 32 | 21 | 0.7000 | 0.9545 | 0 |
| SGLang AWQ | 32 | 32 / 64 | 58 | 1.9333 | 2.6364 | 0 |

어떤 시험 후보도 목표 8 RPS에 도달하지 않았다. Ollama U1(11건), SGLang P8의 U4(9건)·U8(19건)는 표본 부족이므로 목표 도달 여부를 `null`로 유지한다. 전체 측정 요청 수는 후보 순서대로 158/290/243/268/130/262건이며 drain을 포함한다. 품질 참고 실패는 Ollama 5건이고 다른 후보는 0건이다. 품질 실패를 HTTP 완료 목표에서 제외하지 않았다.

llama.cpp의 실패 117건은 모두 재사용 소켓의 `socket hang up`이며 HTTP status는 없고 0.365~6.755ms 만에 실패했다. 새 소켓의 요청 173건은 모두 성공했다. 단계별 실패율은 약 32.6~47.5%다. 현재 b11312 고정 commit의 스트림 종료 callback과 vendored httplib의 연결 종료 처리에서 이 현상과 일치하는 계약 충돌을 확인했으나, 실제 헤더·패킷을 수집하지 않아 wire 수준 원인은 확정하지 않는다. 이 후보의 0.9667 RPS와 비교 비율을 안정적인 성능 우위로 해석하지 않는다. 클라이언트 재시도나 keep-alive 설정을 바꿔 실패를 숨기지 않았다.

vLLM 실제 로그에서 MarlinLinearKernel과 TRITON_ATTN, GPU 모델·KV 적재를 확인했다. FA2 지원 검사 오류 문구는 선택 후보의 지원 검사 결과이며 실제 기동·추론은 Triton backend로 완료됐다. SGLang 실제 로그는 AWQ 최적화 경고·Triton attention·PyTorch sampling·CUDA graph·`cpu_offload_gb=0`·GPU weight/KV 적재를 기록한다. Ollama는 실제 37/37 layer GPU offload를 확인했다. GPU 관측 최고 사용량은 후보 순서대로 4,977/4,899/11,453/11,577/11,155/11,339 MiB이며, 엔진별 전용 할당량이 아닌 시스템 전체 NVML 표본이다.

vLLM P32와 SGLang P32의 최고값 차이는 30초 완료 한 건이다. vLLM P8/P32의 최고 U도 다르고 최고 단계 평균 출력 길이는 약 111.8/96.8토큰이다. 단일 창의 관측 최대값을 안정적인 개선율이나 엔진의 최적·절대 한계로 일반화하지 않는다. SGLang P8/P32는 내부 요청 상한과 CUDA graph 최대 batch가 함께 달라져 순수 P 한 변수의 인과 효과로 분리하지 않는다. 운영 컨테이너의 상태 보존이 운영 트래픽 부재나 독점 호스트를 뜻하지 않는다.

모든 후보에서 소유 컨테이너·worker 종료·포트 반환을 확인하고, 같은 GPU UUID에서 처음 고정한 **VRAM 0 MiB·오차 0·compute PID 없음**을 연속 3회 확인한 뒤에만 다음 후보를 실행했다. 외부 실행기도 각 후보 전후 동일 상태를 재확인했다. 최종 별도 감사는 GPU `[0,0,0]`·compute PID 없음·소유 실험 컨테이너 0개·19551~19556 포트 사용 가능·실험 잠금 없음·기존 네 컨테이너의 ID/PID/StartedAt 동일을 확인했다. 원격 기존 clone은 `serving` branch와 원래 HEAD를 유지하며 수정 0개다. Toolkit 네 패키지와 CDI도 최종 재확인했다. Docker 재시작·운영 컨테이너 종료·디스크 포맷·전체 prune·Git 커밋·push는 하지 않았다.

여섯 실제 추론 종료 후 별도 source03 검증 폴더에서 준비 코드의 `--validate-only`를 실제 AWQ 7개 파일에 적용해 통과했다. 추가 다운로드·추론·GPU 작업·모델 변경은 없으며 호출 전후 source02 47개 SHA와 lock의 보존을 확인했다. `future03_validation.json`과 `final_remote_audit.json`은 원격 원문을 내려받아 보존했다. source03 수정·테스트·lock·안내 문서는 기존 로컬 `UBot-LLMTest/servingtest`에 반영하며 Git stage·커밋·push는 하지 않는다.

T4의 strict GPU release는 이번 실제 회차에서 통과했지만, 지연·품질 gate 미적용·30초 폐쇄형 부하·반복 변동 및 지속 도착률 미검증·정확한 GGUF/AWQ 변환 계보 미승인 때문에 `formal_benchmark_eligible=false`, `c_slo=null`, `lambda_slo=null`을 유지한다. 최고값끼리의 비율은 관측 비교이며 같은 U·P의 인과 효과가 아니다.
