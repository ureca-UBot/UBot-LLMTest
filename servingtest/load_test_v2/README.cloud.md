# 로컬 Docker 고정 묶음을 EC2 T4로 전달

이번 묶음은 Qwen3-4B의 **HTTP 완료 8 RPS 탐색**을 재현하기 위한 소스·이미지·모델 snapshot이다. 생성 조건, 300문항, U/P와 30초 측정 구간은 로컬 탐색과 같다. 지연·품질 합격 상한은 적용하지 않고 drain 완료는 RPS에서 제외한다. 정식 C_SLO·λ_SLO, 정확한 GGUF/AWQ 변환 계보, T4 성능은 확정하지 않는다.

## 고정되는 항목

| 항목 | 고정 방식 |
|---|---|
| Ollama 0.34.0 | 현재 linux/amd64 이미지 archive·SHA-256·실행 Config와 RootFS 지문 |
| llama.cpp b11312 | 현재 `server-cuda` snapshot을 고정. 태그를 다시 pull하지 않음 |
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

대형 tar는 `.gitignore`로 제외한다. GitHub에는 소스·Dockerfile·lock·문항을 올리고, tar 묶음은 S3 또는 파일 전송으로 같은 EC2에 전달한다. Git clone한 코드가 달라지면 source SHA 검사가 먼저 실패한다. 이미지나 모델을 자동 업데이트하는 경로는 없다.

## EC2에서 준비

Linux x86_64, T4 한 장, Docker Engine의 로컬 `/var/run/docker.sock`, NVIDIA Container Toolkit, Python 3이 필요하다. 호스트에 Node·Torch·vLLM·SGLang을 별도로 설치하지 않는다.

현재 vLLM 이미지는 CUDA 13.0.2를 포함하므로 이 묶음은 Linux NVIDIA driver **580.95.05 이상**을 요구한다. CUDA 13의 최소 major 호환 조건 580보다 보수적으로 고정한 실험 환경 요구다. Docker로 GPU·호스트 드라이버·커널은 고정할 수 없다. [NVIDIA 호환 문서](https://docs.nvidia.com/deploy/cuda-compatibility/minor-version-compatibility.html), [CUDA 13.0.2 release notes](https://docs.nvidia.com/cuda/archive/13.0.2/cuda-toolkit-release-notes/index.html).

저장소 루트에서, 전달 폴더의 실제 경로를 지정한다.

```bash
# 예: Git clone 후 지정한 commit으로 checkout한 저장소의 루트
python3 load_test_v2/scripts/cloud/bootstrap_images.py --bundle /data/frozen_20261002_01
python3 load_test_v2/scripts/cloud/archive_models.py --import --bundle /data/frozen_20261002_01

# 고정 source/config/문항 검증. 실행기 컨테이너 하나만 시작하며 GPU/네트워크/socket 없음
bash load_test_v2/scripts/cloud/run_t4.sh --dry-run

# 준비된 모델의 전체 SHA, 이미지, T4·드라이버·idle 상태 확인 후 실제 탐색
bash load_test_v2/scripts/cloud/run_t4.sh --out load_test_v2/results/t4_http_8rps_01
```

`bootstrap_images.py`는 모든 tar SHA를 먼저 검사한 뒤 load하고 이미지 내용 지문을 다시 검사한다. 모델 import는 모든 archive/member SHA와 allow-list를 확인한 뒤 새 `model_assets/portable/` 경로에 게시한다. 기존 모델 경로를 덮어쓰지 않는다. 재실행 시 모델은 `prepare_models.py --validate-only`로 확인할 수 있다. 모델 tar가 없을 때만 준비된 Python 엔진 이미지에서 `prepare_models.py --download`를 명시해 pinned HF 파일을 내려받는다.

런처는 저장소의 **호스트 절대경로를 컨테이너에도 같은 경로로 bind**한다. 엔진 mount는 host Docker daemon이 해석하기 때문이다. 실제 실행기는 `--network host`로 loopback 엔진 포트에 접속하며, `--pid host`로 GPU 프로세스 조회를 확인하고, socket을 통해 소유 label이 붙은 엔진 컨테이너만 관리한다. 이 런처는 신뢰하는 이 실험 저장소에서 실행한다. SSH 연결을 끊을 계획이면 먼저 `tmux` 안에서 실행한다.

## 엔진 전환과 중단

엔진은 순차 실행한다. 연결·monitor·컨테이너를 종료하고 컨테이너 제거·포트 해제·GPU compute PID 부재·최초 VRAM 기준선 복귀를 연속 3회 확인한다. Linux 허용치는 0 MiB이며 Windows 로컬에서 허용한 64 MiB를 가져오지 않는다. 정리 실패는 다음 엔진을 막고 `.benchmark.lock`을 남긴다. 실패한 lock을 무조건 삭제하거나 높아진 VRAM을 새 기준선으로 잡지 않는다.

T4의 compute capability는 7.5다. 현재 로컬 vLLM에서 선택됐던 FlashAttention2와 같은 커널이 T4에서 선택될 수는 없다. SGLang의 현재 AWQ는 최소 7.5, AWQ Marlin은 최소 8.0을 선언한다. 같은 이미지에서도 실제 선택 backend가 달라질 수 있다. `docker/inventory/`의 CPU 메타데이터 조회는 지원 사양 확인이며 GPU 실행 성공 증명은 아니다. 실제 backend·모델 적재는 후보별 `server.log`, GPU snapshot과 API 응답으로 확인한다. 실패 후보는 실패로 기록하고 결과를 꾸며서 이어 붙이지 않는다.

## 로컬에서 묶음을 새로 만드는 도구

`capture_images.js`는 이미 준비된 이미지만 inspect/tag하고 새 image/profile lock을 만든다. 기존 lock을 덮어쓰지 않는다. `export_images.js --out docker_artifacts/새_폴더`는 이미지 tar를 새로 저장한다. `archive_models.py --export`는 Linux CPU 환경에서 기존 HF cache 링크를 일반 파일로 읽어 허용 목록만 저장한다. 모델을 등록하거나 실행하지 않는다.

소스 수정이 끝난 뒤 `freeze_sources.js`로 source lock을 만들고 `pack_sources.py --bundle 전달폴더`로 source.zip을 만든다. source만 수정할 경우 명시한 `--refresh-source-lock`을 사용한다. 엔진·모델·측정 profile lock이 달라졌으면 별도의 묶음으로 검토한다. [Docker save](https://docs.docker.com/reference/cli/docker/image/save/), [Docker load](https://docs.docker.com/reference/cli/docker/image/load/).
