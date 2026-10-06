# Serving benchmark v2

`load_test_v1`과 기존 servingtest 코드를 보존한 별도 실행기다. 모의 검증, Windows 로컬 종료 진단·HTTP 처리량 탐색, 정식 비교를 구분한다. 로컬 탐색은 최적 설정이나 정식 SLO 동시성을 확정한 결과가 아니다. Node.js 20 이상이며 외부 npm 패키지는 필요 없다.

현재 이미지를 archive로 고정해 EC2 T4로 전달하는 구성은 [Docker 전달 안내](README.cloud.md)에 있다. 엔진 4개와 Node·Docker CLI 실행기, 모델·문항·템플릿·설정·소스 지문을 고정한다. Linux 전용 HTTP 8 RPS 탐색은 기존 정식 SLO 실행기와 분리했으며 T4 실측 성공을 의미하지 않는다.

로컬 모델 가중치·캐시는 워크스페이스 루트의 `model_assets/`에 모았다. `huggingface/`와 `ollama/thinking_2507/`, `ollama/qwen3_4b_classic/`을 구분하며 실행 경로는 `scripts/dev/model_assets.js`에서 관리한다. 기존 `results/20261002` 아래 캐시를 이동했고 과거 보고서의 경로·지문은 보존했다. 위치 대응표와 검사 결과는 `model_assets/relocation_manifest.json`, 사용 안내는 `model_assets/README.md`다.

## 측정 기준

- `U`: 클라이언트에서 응답을 기다리는 요청 수. `P`: 후보별 엔진 내부 실행 상한. 두 값은 독립적으로 기록한다.
- 공통 HTTP/1.1 스트리밍, keep-alive 정책, timeout, temperature 0, thinking off, context, 출력 상한, JSON Schema를 적용한다. Ollama NDJSON과 다른 엔진의 Chat SSE는 같은 논리적 출력 계약으로 해석한다. 재시도는 없다.
- 같은 상위 모델 저장소와 고정 commit을 사용하되 GGUF·AWQ·FP16 형식과 엔진 설정은 후보마다 바꿀 수 있다. 가중치·토크나이저·템플릿의 SHA-256과 검토된 변환 계보를 요구한다. 기존 Thinking-2507 결과는 이 비교에 합치지 않는다.
- 측정 시간 동안 신규 요청을 허용하고 종료 후 진행 중 요청을 drain한다. 처리량은 측정 구간 안에 완료한 유효 응답만 계산한다. 실패율·지연은 해당 구간에 시작한 요청을 drain까지 포함한다.
- HTTP 성공과 JSON/근거 ID 계약 통과를 분리한다. 출력 절단, reasoning 노출, 입력 절단 및 입력+출력 예산 초과는 유효 처리량에서 제외한다. 근거 ID 존재 검사는 의미 정답 판정이 아니다.
- TTFT는 첫 content chunk 기준이다. 네트워크 chunk 간격은 토큰 간격으로 부르지 않는다. 정확한 토큰별 timing과 서버 queue time을 얻지 못하면 `null`로 둔다. 출력 토큰 usage가 없으면 tok/s를 추정하지 않는다.
- 처리량 정체·P95·실패율 때문에 U 증가를 멈추지 않는다. 프로세스 종료, 연속 timeout(기본 8건), 모니터 기록 실패, 사용자 중단만 안전 중단한다. 측정하지 못한 구간은 `not_measured`로 남긴다.

잠정 기준은 유효 응답 E2E P95 5초 이하, 전체 요청 실패율 1% 이하이다. 운영 요구로 확정한 SLO가 아니다. `screen`은 후보를 좁히는 자료이며 `confirm`은 지정한 모든 U를 180초 × 3회, 회차별 유효 응답 100건 이상으로 확인한다. 의미 품질 자료가 없으면 `C_SLO=null`이다. 높은 U가 표본 부족이어도 낮은 U에서 반복 통과한 `c_performance_lower_bound`는 보존하며 정확한 지정 구간 최대값은 확정하지 않는다.

## 모의 검증 실행

워크스페이스 루트 `D:\finalproject\llm`에서 실행한다. 모의 서버는 loopback에만 연결하며 실제 모델·GPU·Ollama·Docker를 사용하지 않는다. `--mock`으로는 제공된 `mock_server.js` 프로세스만 실행할 수 있다.

```powershell
node --test load_test_v2/scripts/dev/test_*.js
node load_test_v2/scripts/dev/create_mock_config.js --output-dir load_test_v2/results/my-mock-fixture
node load_test_v2/scripts/run_benchmark.js --config load_test_v2/results/my-mock-fixture/config.json --mock --dry-run
node load_test_v2/scripts/run_benchmark.js --config load_test_v2/results/my-mock-fixture/config.json --mock --phase smoke --out load_test_v2/results/my-mock-smoke
node load_test_v2/scripts/run_benchmark.js --config load_test_v2/results/my-mock-fixture/config.json --mock --phase quality --out load_test_v2/results/my-mock-quality
```

모의 품질 승인과 반복 검증까지 연결하는 예제는 `scripts/dev/test_runner.js`다. 300문항을 네 API에 모두 보내고 품질 report 지문을 연결한 뒤 3회 반복 및 도착률 실험을 검증한다. 승인 자료는 `mock_fixture`라고 표시하고 실제 측정에서는 거부한다. 모의 `simulated_c_slo`와 실제 `c_slo`를 구분한다.

`--dry-run`은 설정·문항을 읽고 실행 계획만 출력한다. 서버 기동, 모델 파일 해시 읽기, GPU 조회와 파일 쓰기는 하지 않는다. 결과 경로는 `load_test_v2/results` 아래 새 디렉터리만 허용한다.

## 실제 후보 준비

`config/engines.example.json`은 네 엔진의 후보 양식이다. 모두 `enabled=false`이며 실행 가능한 최적 구성으로 확정한 파일이 아니다. 엔진 버전의 실제 지원 옵션과 메모리·품질을 검증한 후 값을 채운다. 기존 모델을 자동 다운로드·등록·변환하지 않으며 Docker도 `--pull never`로 로컬 이미지만 사용한다. 원본 FP16, GGUF Q5/Q6, KV q8 등은 같은 계보 증거를 갖춘 별도 후보로 추가한다.

실제 측정은 실행기가 소유한 Docker 컨테이너로 수행한다. 컨테이너 제거를 확인해 서버와 자식 worker의 실행 메모리를 함께 정리한다. 종료 범위를 보장할 수 없는 native `process`와 `external`은 모든 실측 단계에서 거부한다. `process`는 제공된 단일 Node 모의 서버에 사용한다. 정식 confirm/arrival은 Linux 전용 T4 환경에서 수행한다. 기존 GPU 작업이 있거나 GPU 조회가 불확실하면 기동하지 않는다.

## 엔진 전환 시 메모리 정리

후보·회차가 끝나면 신규 요청을 멈추고 진행 중 요청을 drain한 뒤 연결과 monitor를 닫는다. 소유 컨테이너를 종료·제거하고 Docker 조회에서 실제로 사라졌는지, 서버 포트를 다시 사용할 수 있는지 확인한다. 모의 서버는 소유한 프로세스 handle로 종료하고 exit를 확인한다.

GPU 기준선은 전체 실험 시작 때 한 번 기록하며 매 엔진의 VRAM이 이 동일한 기준으로 복귀해야 한다. 매번 높아진 VRAM을 새 기준선으로 받아들이지 않는다. 단일 GPU의 UUID·이름·총 VRAM이 같고 GPU compute 프로세스가 없고 사용 VRAM이 기준선 이하인 상태를 **연속 3회** 확인해야 다음 후보를 시작한다. 기본 허용 오차는 **0MiB**, 정리 제한 시간은 30초, 조회 간격은 500ms다. 드라이버의 기본 사용량은 시작 기준선에 포함한다. 초기 기준선은 기본 64MiB의 유휴 상한도 검사하며 `cleanup.max_idle_vram_mib`로 명시한다.

조회 실패·N/A·GPU 식별 변경·남은 PID·VRAM 미복귀·포트 재점유·컨테이너 제거 미확인은 실패다. 해당 회차를 `cleanup_failed`로 바꾸고 성능/품질 합격 자료에서 제외하며 다음 엔진 실행을 중단한다. 확인이 실패한 잠금은 유지한다. 품질 report는 정리 결과를 붙인 뒤 최종 SHA-256을 계산하며 정리 증거가 없는 기존 품질 승인과 confirm 결과는 재사용할 수 없다.

정리 대상은 엔진 프로세스에 속한 모델 가중치·KV 캐시·작업 버퍼와 worker 메모리다. RAM의 운영체제 파일 페이지 캐시와 GPU 드라이버 기본 메모리는 별도 항목이며 프로세스의 모델 상주 상태와 구분한다. 모의 검증의 GPU 해제는 `scope: mock`으로 표시하고 실제 VRAM 검증 자료로 인정하지 않는다.

### Windows 로컬 종료 진단

Windows WDDM은 프로세스별 GPU 메모리가 `N/A`일 수 있고 WSL의 compute 프로세스 조회도 제한된다. 이 환경에서 정식 실행기의 GPU 해제 검사를 통과시키려고 빈 PID 목록이나 `N/A`를 0으로 변환하지 않는다. [NVIDIA-SMI 문서](https://docs.nvidia.com/deploy/nvidia-smi/index.html), [CUDA on WSL 문서](https://docs.nvidia.com/cuda/wsl-user-guide/).

`scripts/dev/run_local_cleanup_probe.js`는 이 PC에 이미 준비된 네 엔진·모델을 하나씩 실행하는 별도 종료 진단이다. 실제 추론 2건, 실행 중 컨테이너 프로세스·RAM, Ollama의 `keep_alive=-1` 상주와 `keep_alive=0` unload, 소유 컨테이너 제거·포트 해제를 기록한다. 시작 시 총 VRAM 10개 표본의 범위를 고정하고 각 엔진 종료 후 그 상한 이하를 3회 연속 관측해야 다음 엔진을 실행한다. 추가 VRAM 허용 오차나 다음 엔진별 기준선 재설정은 없다. 관측 실패는 다음 실행을 차단하고 잠금을 유지한다.

```powershell
node load_test_v2/scripts/dev/run_local_cleanup_probe.js --out load_test_v2/results/새_로컬_종료_진단
```

결과의 `lifecycle_verified`와 `vram_return_observed`는 제한된 관측이다. 화면·브라우저 사용량 변화가 잔류를 가릴 수 있어 `strict_gpu_release=unsupported`, `benchmark_eligible=false`를 항상 유지한다. 이 진단은 준비된 GGUF Thinking-2507과 AWQ Qwen3-4B를 사용하므로 엔진 성능 비교, 품질 승인, C_SLO 판정에 재사용하지 않는다. 다운로드·모델 등록·T4 접속은 수행하지 않는다.

### Ollama 기준 HTTP 완료 8 RPS 탐색

사용자가 선택한 이번 목표는 **HTTP 완료 8 RPS이며 지연 상한을 두지 않는다**. `scripts/dev/run_local_http_exploration.js`는 이 목표를 위한 별도 Windows 로컬 프로파일이다. 2xx와 스트림의 정상 종료를 확인한 요청만 완료로 계산한다. JSON 형식·근거 ID·출력 절단·지연은 참고 통계로 남기고 목표 판정에 적용하지 않는다. 120초 요청 timeout은 무한 대기를 막는 실행 안전 장치이며 P95 합격 상한이 아니다. 재시도는 없다.

기준 후보는 Ollama P4다. llama.cpp P4, vLLM·SGLang 내부 상한 8과 32를 같은 장비에서 순차 실행한다. 각 U에서 클라이언트별 HTTP warmup을 완료한 뒤 30초를 고정 관측한다. 30초 내 HTTP 완료 240건 이상이어야 8 RPS에 도달한다. drain 완료를 RPS에 합치거나 처리량 정체 때문에 계획한 U를 생략하지 않는다. 모델 기동 실패·연속 timeout 8건·모니터 오류·사용자 중단은 안전 중단 사유다.

전체 300문항의 원문과 지문·균형 seed 순환 풀을 사용하며 context 4096, 출력 상한 512, temperature 0, thinking off, 동일 JSON Schema·HTTP/1.1 스트리밍을 유지한다. Ollama·llama.cpp는 이미 캐시된 공식 Qwen3-4B GGUF, Python 엔진은 공식 Qwen3-4B AWQ다. 기존 Thinking-2507 모델 결과와 합치지 않는다. 공식 카드가 같은 base_model을 명시하지만 정확한 upstream 변환 commit의 동일성은 아직 검증되지 않아 정식 계보 승인은 하지 않는다. 가중치 실제 SHA-256은 실행 시 기록한다. [GGUF 공식 카드](https://huggingface.co/Qwen/Qwen3-4B-GGUF/raw/bc640142c66e1fdd12af0bd68f40445458f3869b/README.md), [AWQ 공식 카드](https://huggingface.co/Qwen/Qwen3-4B-AWQ).

Ollama의 임시 태그는 소유 실험 컨테이너 내부에서만 생성하고 실제 `think:false` 렌더와 적재 상태를 확인한다. 기존 11434 서비스·태그·캐시는 조회만 한다. 각 후보가 끝나면 연결·monitor·소유 컨테이너를 종료하고 컨테이너 제거·포트 반환을 확인한다. 같은 GPU에서 **최초 VRAM 범위의 상한 + 명시한 허용치 이하를 3회 연속** 관측해야 다음 후보를 시작한다. 허용치 기본값은 0 MiB이며 사용자가 이번 로컬 HTTP 탐색에 승인한 값은 **64 MiB**다. 예를 들어 최초 상한 2252 MiB는 그대로 보존하고 판정 상한만 2316 MiB로 기록한다. 이후 관측값으로 기준선을 높이거나 엔진마다 허용치를 누적하지 않는다. 관측 실패는 잠금을 유지하고 다음 실행을 차단한다.

```powershell
node load_test_v2/scripts/dev/run_local_http_exploration.js --out load_test_v2/results/새_HTTP_8RPS_탐색 --vram-tolerance-mib 64
```

정리 미확인으로 중단된 Ollama 측정을 재사용하려면 원래 `report.json`과 **새 결과 디렉터리**를 지정한다. 실행기는 이전 lock의 프로세스 종료, `llm.benchmark.session` label이 붙은 모든 컨테이너의 부재, 실험 포트 반환을 확인하고 같은 최초 기준선과 지정 허용치로 새 복구 관측을 수행한다. workload·생성·전송 조건과 가중치 지문이 같고 복구 확인이 통과해야 완료된 Ollama 단계만 재사용해 나머지 후보를 진행한다. 원래 보고서·단계·응답 파일은 변경하지 않는다. 새 디렉터리에 원본 보고서 지문, 이전 lock, 복구 증거와 `original_cleanup_failure`를 보존한다.

```powershell
node load_test_v2/scripts/dev/run_local_http_exploration.js --out load_test_v2/results/새_HTTP_8RPS_재개 --resume-report load_test_v2/results/http_8rps_20261002_02/report.json --vram-tolerance-mib 64
```

`report.json`은 Ollama 대비 처리량 배수, 후보별 최고 HTTP RPS, 8 RPS를 관측한 최소 시험 U를 기록한다. 각 `u*_step.json`과 `u*_requests.jsonl`에 고정 경계·원문·지연·품질 참고값을 보존한다. 64 MiB 허용과 복구 경로는 이 Windows 로컬 HTTP 탐색에만 적용하며 정식 실행기의 GPU 정리 gate는 변경하지 않는다. Windows GPU 정리 관측의 한계 때문에 `formal_benchmark_eligible=false`, `strict_gpu_release=unsupported`, `c_slo=null`, `lambda_slo=null`을 유지한다. 이 탐색값은 지속 가능한 8 RPS 도착률이나 운영 동시성 인증이 아니다.

계보 JSON에는 upstream/artifact 저장소와 고정 revision, `method`(`official_release` 또는 `reproducible_conversion`), `reviewed_by`, `reviewed_at`, `source_url`, `files:[{role,sha256}]`가 필요하다. 파일 일치와 검토 자료를 확인할 뿐 변환 계보의 진실성을 수학적으로 증명하지 않는다. GGUF 내장 토크나이저/템플릿을 쓰면 그 파일 자체의 지문과 역할을 명시할 수 있다.

각 후보의 `runtime.attestation`은 HTTP 경로나 구조화된 로컬 command로 실제 상태에서 다음 JSON을 추출해야 한다.

```json
{
  "engine": "vllm",
  "engine_version": "실제 버전",
  "api_model": "실제 API 모델명",
  "internal_limit": 8,
  "context_per_request": 4096,
  "upstream_repository": "Qwen/Qwen3-4B",
  "upstream_revision": "고정 commit",
  "fully_on_gpu": true,
  "artifact_files": [{ "role": "weight", "sha256": "실제 지문" }],
  "evidence_source": "실제 프로세스/API/로그의 확인 원천",
  "observed_at": "조회 시점 ISO8601"
}
```

`artifact_files`는 tokenizer/template까지 구성의 전체 지문 목록과 정확히 같아야 한다. 시각이 60초보다 오래되거나 5초 이상 미래면 거부한다. 설정값을 그대로 반환하는 스크립트는 근거가 될 수 없다. 엔진마다 확인할 API·로그가 다르므로 범용 probe를 꾸며 제공하지 않는다. Ollama는 preload 후 적재 상태를 확인한다. launch→API readiness와 첫 preload 시간은 별도로 기록한다. 실제 시작 전 sequential 요청 100건에서 연결 호환성과 실제 소켓 재사용을 확인한다.

## 품질 승인과 정식 실행

`quality`는 300문항의 답변 원문, 입력 토큰 예산, 스키마/근거/절단 검사를 저장한다. 결과 `quality_report.json`을 후보의 `quality_report:{path,sha256}`에 연결한다. 정식 실행은 전체 300개의 정확한 문항 ID, 요청 원문, 생성 조건, 답변 파일 지문과 통과율을 다시 확인한다. 입력 usage가 없어 전체 context fit을 확인할 수 없으면 품질 gate는 pending이다. 별도 tokenizer로 이를 대체하는 경로는 아직 지원하지 않는다.

의미 검토 결과는 `semantic_gate:{path,sha256}`에 연결한다. 승인 JSON에는 `workload_sha256`, `candidate_identity_sha256`, `quality_report_sha256`, `method`(`human` 또는 `gold_answers`), `reviewer`, `rubric`, `passed`, `evaluation:{path,sha256}`가 들어간다. 실험 출력의 사실성·status 판단·정보 누락·주입 공격 등을 rubric에 따라 별도로 평가해야 한다. 모델 파일, P, 실행 인자, 공통 생성 조건이 바뀌면 승인 자료를 재사용할 수 없다.

```powershell
node load_test_v2/scripts/run_benchmark.js --config load_test_v2/config/engines.local.json --phase screen
node load_test_v2/scripts/run_benchmark.js --config load_test_v2/config/engines.local.json --phase quality
# 실제 품질 검토를 완료하고 gate 지문을 구성에 연결한 뒤 T4에서:
node load_test_v2/scripts/run_benchmark.js --config load_test_v2/config/engines.local.json --phase confirm
node load_test_v2/scripts/run_benchmark.js --config load_test_v2/config/engines.local.json --phase arrival --baseline load_test_v2/results/정식실행/report.json
```

도착률 실험은 confirm의 유효 RPS 중앙값 × 0.7/0.9/1.1을 Poisson 도착으로 각각 5분 이상 보낸다. 클라이언트 미완료 요청과 엔진 큐의 후반부 추세, 예약 도착 시각 기준 지연과 client drop을 확인한다. 큐를 관측할 수 없거나 표본이 부족하면 지속 가능한 도착률을 확정하지 않는다. 기계적 안정성 허용 오차는 잠정 설정으로 결과에 남긴다.

결과는 `report.json`, 후보/회차별 `round.json`, 구간별 `*_step.json`, 원문 `*_requests.jsonl`, `preload.jsonl`, `preflight.jsonl`, 서버 로그와 `metrics.jsonl`로 나뉜다. `.benchmark.lock`은 전체 실행 중복을 막는다. 정리 실패 시 잠금을 유지한다. 강제 종료 뒤에는 기록된 소유 PID/컨테이너가 종료됐는지 확인한 뒤 잠금을 수동 정리한다.
