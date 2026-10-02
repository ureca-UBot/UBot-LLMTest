# 로컬 Docker 고정 묶음을 EC2 T4로 전달

이번 묶음은 Qwen3-4B의 **HTTP 완료 8 RPS 탐색**을 재현하기 위한 소스·이미지·모델 snapshot이다. 생성 조건, 300문항, U/P와 30초 측정 구간은 로컬 탐색과 같다. 지연·품질 합격 상한은 적용하지 않고 drain 완료는 RPS에서 제외한다. 정식 C_SLO·λ_SLO, 정확한 GGUF/AWQ 변환 계보, T4 성능은 확정하지 않는다.

## 고정되는 항목

| 항목 | 고정 방식 |
|---|---|
| Ollama 0.34.0 | 현재 linux/amd64 이미지 archive·SHA-256·실행 Config와 RootFS 지문 |
| llama.cpp b11312 | 현재 `server-cuda` snapshot의 digest를 고정. 변할 수 있는 태그를 다시 pull하지 않음 |
| vLLM 0.30.0 | 현재 이미지 archive, Torch 2.13.0+cu130·CUDA 13 빌드 inventory |
| SGLang 0.4.6.post5 | vLLM 0.8.4를 추가했던 완성 이미지 archive. recipe 재빌드와 구분 |
| 부하 생성기 | Node 24.17.0·Docker CLI 29.7.2 이미지 |
| 모델 | GGUF Q4_K_M·AWQ의 고정 revision, 가중치·config·tokenizer SHA |
| 템플릿·문항·코드·설정 | `config/cloud.lock.json`의 파일 SHA-256 |

`config/images.lock.json`은 이미지 지문, `config/models.lock.json`은 모델 파일 지문, `config/http.t4.json`은 여섯 후보의 인자·환경변수·U/P를 기록한다. 이미지를 검사한 **현재 snapshot**이다. 이전 측정 보고서에 image ID가 없어 과거 측정 이미지와 암호학적으로 동일하다고 입증한 것은 아니다.

`.Id`는 Docker Desktop의 OCI 저장소와 Linux의 classic 저장소에서 표현이 달라질 수 있다. 전달 tar의 SHA와 `OS/Architecture + RootFS diff IDs + 실행 Config`를 확인하고, 실제 실행은 현 daemon이 반환한 불변 image ID로 한다.

## 전달 파일과 GitHub

워크스페이스의 `docker_artifacts/frozen_20261002_01/`에는 다음을 둔다.

- `ollama.tar`, `llamacpp.tar`, `vllm.tar`, `sglang.tar`, `runner.tar`: 완성 이미지 5개.
- `images.transfer.json`: 이미지 tar의 크기·SHA-256·지문.
- `models.tar`, `models.transfer.json`: 이번 GGUF/AWQ와 필수 파일만 있는 모델 묶음. 개인 키·Ollama 캐시·BF16 원본·Thinking-2507은 포함하지 않는다.
- `source.zip`, `source.transfer.json`: 고정 source allow-list와 lock의 보조 사본.

대형 tar는 `.gitignore`로 제외한다. GitHub에는 소스·Dockerfile·lock·문항을 올린다. 전체 archive를 전달하는 방식과, 선택한 엔진의 공개 이미지를 digest로 pull하고 필요한 모델만 다운로드하는 방식을 모두 지원한다. 준비 단계에서 명시적으로 받으며 측정 중에는 이미지나 모델을 자동 업데이트하지 않는다.

선택 준비를 추가한 코드는 현재 로컬 수정이며 아직 커밋·원격 반영되지 않았다. 기존 EC2 clone에서 pull한 것만으로 아래 새 옵션을 사용할 수 있다고 가정하지 않는다. 새 소스와 source lock은 `docker_artifacts/on_demand_20261002_01/source.zip` 및 `source.transfer.json`으로 구분한다. 이 ZIP은 새 빈 snapshot 폴더에 풀어 사용한다. 저장소에 반영된 이후에는 `UBot-LLMTest/servingtest`를 작업 루트로 사용한다.

최초 `frozen_20261002_01`의 source.zip·source lock·transfer manifest는 그대로 보존한다. 새 source.zip에 옛 source lock을 섞거나 옛 소스 ZIP으로 새 코드를 덮어쓰지 않는다. 이미지·모델 lock은 유지하므로 최초 archive의 이미지·모델 파일은 계속 재사용할 수 있다. source SHA가 달라진 새 코드는 새 source identity로 검증한다.

## EC2에서 준비

Linux x86_64, T4 한 장, Docker Engine의 로컬 `/var/run/docker.sock`, NVIDIA Container Toolkit, Python 3이 필요하다. 호스트에 Node·Torch·vLLM·SGLang을 별도로 설치하지 않는다.

현재 vLLM 이미지는 CUDA 13.0.2를 포함하므로 이 묶음은 Linux NVIDIA driver **580.95.05 이상**을 요구한다. CUDA 13의 최소 major 호환 조건 580보다 보수적으로 고정한 실험 환경 요구다. Docker로 GPU·호스트 드라이버·커널은 고정할 수 없다. [NVIDIA 호환 문서](https://docs.nvidia.com/deploy/cuda-compatibility/minor-version-compatibility.html), [CUDA 13.0.2 release notes](https://docs.nvidia.com/cuda/archive/13.0.2/cuda-toolkit-release-notes/index.html).

명령의 작업 루트는 `load_test_v2/`가 바로 아래에 있는 snapshot 폴더다. 저장소 안에서는 `UBot-LLMTest/servingtest`로 이동한다. 준비용 이미지·모델 다운로드와 실제 측정은 별도 단계다.

### 운영 Docker를 재시작하지 않는 CDI 실행

운영 컨테이너가 실행 중인 호스트에서 Toolkit을 새로 설치했다면 `--gpus`가 바로 작동한다고 가정하지 않는다. Docker 29.8.1은 시작할 때 NVIDIA hook 존재 여부로 GPU device driver를 등록하며, SIGHUP으로 OCI runtime 설정을 다시 읽는 동작은 이 등록을 반복하지 않는다. [Docker 29.8.1 시작 코드](https://github.com/moby/moby/blob/docker-v29.8.1/daemon/command/daemon.go), [NVIDIA device driver 등록 코드](https://github.com/moby/moby/blob/docker-v29.8.1/daemon/devices_nvidia_linux.go), [runtime reload 코드](https://github.com/moby/moby/blob/docker-v29.8.1/daemon/reload_unix.go).

이 경우 Docker의 native CDI를 사용한다. Docker Engine 28.3.0 이상은 CDI를 기본 활성화하며 `/etc/cdi`, `/var/run/cdi`의 명세를 읽는다. 현재 daemon에서 CDI가 활성화되어 있고 Toolkit이 생성한 명세와 GPU UUID를 인식하는지 먼저 확인한다. 명세 생성·Toolkit 준비와 고정 runner의 `nvidia-smi` 확인은 측정 전 단계다. Docker daemon 재시작, `daemon.json` 변경, 기본 runtime 변경은 이 경로에 필요하지 않다. [Docker CDI 설정](https://docs.docker.com/reference/cli/dockerd/#configure-cdi-devices), [NVIDIA CDI 준비](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/cdi-support.html).

`nvidia-ctk cdi list`와 Docker의 장치 목록에 같은 T4의 UUID가 있어야 한다. 새로 생성된 명세는 CDI cache가 자동 갱신하며, 시작 시 없던 명세 디렉터리가 생기는 경우도 다시 읽도록 구현되어 있다. 이 근거가 실제 호스트의 GPU 주입 성공을 대신하지는 않는다. [Docker가 사용하는 CDI 1.1.1 cache 코드](https://github.com/cncf-tags/container-device-interface/blob/v1.1.1/pkg/cdi/cache.go).

CDI 옵션은 새 `on_demand_20261002_02` 소스 identity에서 사용한다. 기존 묶음의 코드·lock·ZIP은 보존한다. 실행기의 기본값은 `--gpu-mode gpus`이며, `--gpu-mode cdi`를 명시하면 runner는 `--device=nvidia.com/gpu=all`, 소유 엔진은 측정한 단일 GPU UUID를 사용한다. 이미지·모델·U/P·문항·생성 조건·30초 측정 구간은 유지하며 실제 선택 방식은 report에 기록한다.

```bash
# 새 snapshot 루트에서 수행. dry-run은 두 GPU mode 모두 GPU를 노출하지 않는다
bash load_test_v2/scripts/cloud/run_t4.sh --gpu-mode cdi --candidate ollama_p4 --dry-run

# 선택 이미지·모델 준비와 CDI GPU 확인을 마친 뒤 실행
bash load_test_v2/scripts/cloud/run_t4.sh --gpu-mode cdi --candidate ollama_p4 \
  --out load_test_v2/results/t4_ollama_cdi_01
```

운영 `ubot-nginx/backend/postgres/ollama`는 유지한다. 실험은 별도 snapshot·결과 폴더와 소유 컨테이너를 사용하며 전체 prune를 수행하지 않는다. 후보를 따로 실행하면 각 원문 report를 보존한다. Ollama 기준 대비 비율은 동일 GPU UUID·드라이버·최초 VRAM 기준선·source/model/image lock·측정 조건과 정상 정리를 확인한 뒤 별도 비교 자료로 계산한다. 단독 후보 report의 `ratio_to_ollama: null`을 임의로 채우지 않는다.

### 선택한 엔진만 준비

`--candidate`를 지정하면 선택한 엔진 이미지와 공통 runner, 그 엔진에 필요한 모델만 준비·검증한다. 전체 source/profile/image/model lock의 메타데이터 검증은 유지한다. 선택하지 않은 엔진의 image·모델 파일·mount가 없어도 된다.

| 후보 | 준비 모델 ID | `--pull` 사용 시 필요한 archive |
|---|---|---|
| `ollama_p4` | `qwen3_4b_gguf_q4km` | `runner.tar` |
| `llamacpp_p4` | `qwen3_4b_gguf_q4km` | `runner.tar` |
| `vllm_s8`, `vllm_s32` | `qwen3_4b_awq` | `runner.tar` |
| `sglang_r8`, `sglang_r32` | `qwen3_4b_awq` | `sglang.tar`, `runner.tar` |

`on_demand_20261002_01`에는 새 소스 사본, **5개 이미지의 원래 identity를 모두 담은** `images.transfer.json`, 공통 `runner.tar`를 둔다. 선택 엔진에 필요한 tar만 실물로 있으면 된다. SGLang을 준비할 때만 최초 묶음의 `sglang.tar`를 추가한다. transfer JSON을 선택한 이미지 2개로 임의로 줄이지 않는다.

Ollama·llama.cpp·vLLM은 `images.lock.json`의 공개 원본 digest로 pull한 후 내용 지문을 검사하고 고정 alias를 만든다. `--pull`을 생략하면 선택 엔진도 tar로 받아야 한다. custom SGLang과 runner는 현재 공개 registry digest가 없으므로 완성 archive가 필요하다. 공식 SGLang 이미지나 Dockerfile 재빌드를 이 snapshot의 동일 이미지로 취급하지 않는다.

```bash
# Docker·네트워크 호출 없이 선택 archive/metadata만 검사
# 공개 engine의 실제 내용 지문 검증은 pull 후에 수행된다
python3 load_test_v2/scripts/cloud/bootstrap_images.py \
  --bundle /data/on_demand_20261002_01 --candidate ollama_p4 --pull --verify-only

# 준비 단계: runner.tar와 전체 images.transfer.json이 있는 폴더 사용
python3 load_test_v2/scripts/cloud/bootstrap_images.py \
  --bundle /data/on_demand_20261002_01 --candidate ollama_p4 --pull
```

SGLang을 선택한 경우에는 같은 폴더에 `sglang.tar`도 준비하고 다음 명령을 사용한다.

```bash
python3 load_test_v2/scripts/cloud/bootstrap_images.py \
  --bundle /data/on_demand_20261002_01 --candidate sglang_r8
```

모델은 별도의 준비용 Python 3 환경에서 받을 수 있다. 다음 venv는 파일을 다운로드하는 용도이며 엔진 Python 환경을 바꾸지 않는다. `huggingface_hub==1.32.0`은 고정 vLLM inventory에 기록된 버전이다. GGUF를 받기 위해 vLLM·SGLang 이미지까지 추가로 받을 필요는 없다. Python의 venv 기능과 준비용 패키지가 필요하며 이번 로컬 모의 검증에서는 실제 네트워크 다운로드를 실행하지 않았다.

```bash
# 준비용 환경. 측정 시에는 이 venv를 사용하지 않는다
python3 -m venv .venv/model_prepare
.venv/model_prepare/bin/python -m pip install huggingface_hub==1.32.0
```

Ollama·llama.cpp를 선택하면 GGUF 모델을 받는다.

```bash
.venv/model_prepare/bin/python load_test_v2/scripts/cloud/prepare_models.py \
  --download --model qwen3_4b_gguf_q4km
```

vLLM·SGLang을 선택하면 AWQ 모델을 받는다.

```bash
.venv/model_prepare/bin/python load_test_v2/scripts/cloud/prepare_models.py \
  --download --model qwen3_4b_awq
```

모델 준비는 고정 HF revision과 파일 allow-list만 사용하며 모든 파일의 크기·SHA를 검사한다. 기존 모델 폴더를 덮어쓰지 않는다. 이미 준비된 선택 모델을 확인할 때는 같은 모델 ID와 `--validate-only`를 사용한다.

```bash
.venv/model_prepare/bin/python load_test_v2/scripts/cloud/prepare_models.py \
  --model qwen3_4b_gguf_q4km --validate-only

# 소스/설정 연결 검사. runner만 시작하며 GPU·network·Docker socket 없음
bash load_test_v2/scripts/cloud/run_t4.sh --candidate ollama_p4 --dry-run

# 필요한 이미지와 선택 모델 전체 SHA·T4·idle 상태 확인 후 측정
bash load_test_v2/scripts/cloud/run_t4.sh --candidate ollama_p4 \
  --out load_test_v2/results/t4_ollama_01
```

`--dry-run` 성공은 모델 SHA·GPU 기동 성공을 뜻하지 않는다. 실제 시작 전에 선택 모델의 전체 SHA와 engine+runner 이미지 지문을 확인하고, image alias 대신 현 daemon의 불변 image ID로 실행한다. 측정 중에는 `HF_HUB_OFFLINE=1`, `TRANSFORMERS_OFFLINE=1`, Docker `--pull never`를 유지한다. 준비 단계에서만 다운로드를 허용한다.

### 전체 묶음으로 준비

`--candidate` 없이 실행하면 기존처럼 이미지 5개와 모델 2종 전체를 요구한다. 이미지·모델 archive가 모두 준비된 전달 폴더를 지정한다.

```bash
# load_test_v2가 바로 아래에 있는 snapshot 루트에서 실행
python3 load_test_v2/scripts/cloud/bootstrap_images.py --bundle /data/frozen_20261002_01
python3 load_test_v2/scripts/cloud/archive_models.py --import --bundle /data/frozen_20261002_01

# 고정 source/config/문항 검증. 실행기 컨테이너 하나만 시작하며 GPU/네트워크/socket 없음
bash load_test_v2/scripts/cloud/run_t4.sh --dry-run

# 준비된 모델의 전체 SHA, 이미지, T4·드라이버·idle 상태 확인 후 실제 탐색
bash load_test_v2/scripts/cloud/run_t4.sh --out load_test_v2/results/t4_http_8rps_01
```

전체 모드의 `bootstrap_images.py`는 모든 tar SHA를 먼저 검사한 뒤 load하고 이미지 내용 지문을 다시 검사한다. 모델 import는 모든 archive/member SHA와 allow-list를 확인한 뒤 새 `model_assets/portable/` 경로에 게시한다. 기존 모델 경로를 덮어쓰지 않는다. 재실행 시 모델은 `prepare_models.py --validate-only`로 확인할 수 있다. archive 대신 다운로드할 때는 위 준비용 Python 환경에서 `--download`를 명시한다.

런처는 저장소의 **호스트 절대경로를 컨테이너에도 같은 경로로 bind**한다. 엔진 mount는 host Docker daemon이 해석하기 때문이다. 실제 실행기는 `--network host`로 loopback 엔진 포트에 접속하며, `--pid host`로 GPU 프로세스 조회를 확인하고, socket을 통해 소유 label이 붙은 엔진 컨테이너만 관리한다. 이 런처는 신뢰하는 이 실험 저장소에서 실행한다. SSH 연결을 끊을 계획이면 먼저 `tmux` 안에서 실행한다.

## 엔진 전환과 중단

엔진은 순차 실행한다. 연결·monitor·컨테이너를 종료하고 컨테이너 제거·포트 해제·GPU compute PID 부재·최초 VRAM 기준선 복귀를 연속 3회 확인한다. Linux 허용치는 0 MiB이며 Windows 로컬에서 허용한 64 MiB를 가져오지 않는다. 정리 실패는 다음 엔진을 막고 `.benchmark.lock`을 남긴다. 실패한 lock을 무조건 삭제하거나 높아진 VRAM을 새 기준선으로 잡지 않는다.

T4의 compute capability는 7.5다. 현재 로컬 vLLM에서 선택됐던 FlashAttention2와 같은 커널이 T4에서 선택될 수는 없다. SGLang의 현재 AWQ는 최소 7.5, AWQ Marlin은 최소 8.0을 선언한다. 같은 이미지에서도 실제 선택 backend가 달라질 수 있다. `docker/inventory/`의 CPU 메타데이터 조회는 지원 사양 확인이며 GPU 실행 성공 증명은 아니다. 실제 backend·모델 적재는 후보별 `server.log`, GPU snapshot과 API 응답으로 확인한다. 실패 후보는 실패로 기록하고 결과를 꾸며서 이어 붙이지 않는다.

## 로컬에서 묶음을 새로 만드는 도구

`capture_images.js`는 이미 준비된 이미지만 inspect/tag하고 새 image/profile lock을 만든다. 기존 lock을 덮어쓰지 않는다. `export_images.js --out docker_artifacts/새_폴더`는 이미지 tar를 새로 저장한다. `archive_models.py --export`는 Linux CPU 환경에서 기존 HF cache 링크를 일반 파일로 읽어 허용 목록만 저장한다. 모델을 등록하거나 실행하지 않는다.

소스 수정이 끝난 뒤 `freeze_sources.js`로 source lock을 만들고 `pack_sources.py --bundle 전달폴더`로 source.zip을 만든다. source만 수정할 경우 명시한 `--refresh-source-lock`을 사용한다. 엔진·모델·측정 profile lock이 달라졌으면 별도의 묶음으로 검토한다. [Docker save](https://docs.docker.com/reference/cli/docker/image/save/), [Docker load](https://docs.docker.com/reference/cli/docker/image/load/).
