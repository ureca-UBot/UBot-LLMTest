# 서빙 환경 재현

Docker 이미지 빌드나 기존 TAR 없이 공개 이미지를 받아 준비한다. 스크립트 위치는 `load_test_v2/docker/reproduce/reproduce.py`이며 모든 명령은 `servingtest`에서 실행한다.

## 준비

Linux x86_64 클라우드에는 Python 3.9 이상, Docker Engine + Compose, NVIDIA 드라이버와 Container Toolkit이 필요하다. 스크립트는 시스템 패키지·Docker 설정을 바꾸지 않는다. 모델 다운로드는 Python 표준 라이브러리 HTTPS로 처리하므로 호스트 pip 패키지는 필요 없다. Windows에서도 계획 확인과 Linux Docker 이미지 준비는 가능하지만 GPU 엔진 실행은 Linux 호스트에서 한다.

```bash
# 네트워크·Docker·GPU 호출 없는 계획 확인
python3 load_test_v2/docker/reproduce/reproduce.py plan --engine all

# Docker 연결·Compose 설정 확인
python3 load_test_v2/docker/reproduce/reproduce.py doctor

# 선택한 엔진과 필요한 모델만 준비
python3 load_test_v2/docker/reproduce/reproduce.py prepare --engine sglang

# 모든 엔진을 준비할 때
python3 load_test_v2/docker/reproduce/reproduce.py prepare --engine all
```

공개 이미지 digest는 `pins.json`에 고정한다. 모델은 기존 `models.lock.json`의 revision·파일 allow-list·크기·SHA-256·토크나이저·템플릿을 검증해 `model_assets/portable`에 준비한다. 기존 준비 파일이 있으면 다시 해시 검사하고 재사용한다. Ollama/llama.cpp는 GGUF, vLLM/SGLang은 AWQ를 공유한다. 두 모델의 파일 합은 약 4.8GiB이며 BF16 원본과 Thinking-2507 캐시는 요구하지 않는다.

SGLang은 고정 공식 이미지를 그대로 사용한다. `sglang-prepare`가 GPU 없이 별도 named volume에 system-site-packages 가상환경을 만들고 `vllm==0.8.4`를 설치한다. SGLang·Torch·CUDA 빌드·FlashInfer·sgl-kernel·Transformers·Triton 핵심 버전을 검사한다. 나머지 패키지는 실제 전체 버전과 pip freeze, 기존 238개 기록과의 차이를 남긴다. 준비 완료 영수증이 없거나 환경이 바뀌면 실행을 거부한다.

## 하나씩 실행

```bash
# L4 기본 프리셋, CDI 방식 (호스트 CDI 설정이 준비된 경우)
python3 load_test_v2/docker/reproduce/reproduce.py start --engine sglang --hardware l4 --gpu-mode cdi

# 테스트 요청을 보낸 뒤 종료·GPU 메모리 해제 확인
python3 load_test_v2/docker/reproduce/reproduce.py stop

# 다음 엔진
python3 load_test_v2/docker/reproduce/reproduce.py start --engine vllm --hardware l4 --gpu-mode cdi
python3 load_test_v2/docker/reproduce/reproduce.py stop
```

일반 NVIDIA GPU runtime을 사용하는 호스트는 `--gpu-mode gpus`를 쓴다. 스크립트는 GPU 0의 실제 UUID를 조회해 해당 GPU만 연결한다. 기본 API 주소는 `http://127.0.0.1:19551`이다. Ollama 모델 이름은 `qwen3-baseline:4b`, llama.cpp는 `qwen3-4b-q4km`, vLLM/SGLang은 `qwen3-4b-awq`다. `--port 19552` 등으로 바꿀 수 있다.

| 하드웨어 프리셋 | Ollama 병렬 | llama.cpp 슬롯 | vLLM max-num-seqs | SGLang max-running-requests |
|---|---:|---:|---:|---:|
| t4 | 4 | 4 | 32 | 32 |
| l4 | 16 | 16 | 64 | 64 |
| local | 4 | 4 | 8 | 8 |

`--limit 32` 등으로 선택 엔진의 내부 상한만 바꾼다. llama.cpp의 전체 context는 상한 × 4096, SGLang CUDA graph max batch는 같은 상한으로 맞춘다. 기존 조건인 context 4096, AWQ FP16, vLLM VRAM 0.8, SGLang VRAM 0.7·Triton attention·PyTorch sampling을 사용한다. 프리셋은 관측한 후보 설정이며 모든 GPU에서 최적이라는 뜻은 아니다.

스크립트는 한 엔진만 시작하고, 다른 활성 세션이나 GPU compute PID/VRAM 사용이 있으면 거부한다. 종료 시 이 프로젝트 소유 컨테이너만 제거하고 동일 GPU UUID의 **0MiB·compute PID 없음**을 연속 세 번 확인한다. 확인이 실패하면 활성 상태를 남겨 다음 시작을 막는다. 모델·이미지·Python named volume의 디스크 캐시는 유지한다.

## 구성과 기록

- `compose.yaml`: 엔진 네 개와 SGLang 준비 서비스. 모든 엔진은 profile로 구분하며 빌드 항목이 없다.
- `compose.gpus.yaml`, `compose.cdi.yaml`: 호스트의 GPU 연결 방식 선택.
- `pins.json`, `sglang-core.constraints.txt`: 공개 이미지와 핵심 패키지 버전.
- `setup_sglang.py`: 준비·검증·SGLang 실행. 서버 시작 시 pip install을 실행하지 않는다.
- `.repro-state/ready.json`: 준비한 이미지 ID, digest, 소스 입력 identity, 모델 준비 기록.
- `.repro-state/sglang-environment.json`: 설치된 패키지 전체와 기존 환경과의 차이.
- `.repro-state/sessions/`: 실제 Compose 설정, 하드웨어·드라이버·GPU UUID, 서버 로그, 종료 확인.

실행은 스크립트의 `start`/`stop`을 사용한다. 여러 profile을 직접 함께 `compose up`하면 스크립트의 순차 실행·메모리 해제 검사를 거치지 않는다. 중단된 `operation.lock`에는 PID가 기록되며 실행 중인 작업인지 확인 후 복구한다. `active.json`은 GPU 정리 확인 전 임의로 삭제하지 않는다.

이번 구성은 환경 준비와 API 서버 실행 범위다. 요청 생성·HTTP 완료 RPS·질문·생성 조건·응답 품질 검사는 기존 실행기에 있다. 과거 `run_t4.sh`/cloud lock은 기존 완성 이미지의 지문을 요구하므로 이 새 Python-volume 환경을 그대로 기존 실측으로 취급하지 않는다. 후속 측정에는 `.repro-state`의 실제 환경 identity를 별도로 기록해야 한다. 기존 결과·고정 소스·TAR는 보존했다.

GPU와 호스트 드라이버는 Docker로 고정되지 않는다. 고정 vLLM 이미지는 CUDA 13이므로 기존 실험 기준 드라이버 580.95.05 이상을 확인한다. SGLang의 부가 의존성 wheel 해시와 신규 GPU 기동·성능 동일성은 여기서 확정하지 않는다.

## 검증 범위

로컬 Docker 엔진 기동 문제와 분리해서 계획 출력, Compose 설정 해석, 핵심 버전 검사, 잘못된 모델 SHA 거부, 준비 이미지 변경 거부, 소유 컨테이너 정리와 GPU 미해제 게이트를 모의 검증한다. 실제 다운로드·의존성 설치·GPU 기동을 완료했다는 뜻은 아니다.
