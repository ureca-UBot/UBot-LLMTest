# servingtest

Ollama, llama.cpp, vLLM, SGLang을 같은 Qwen3-4B로 비교하는 서빙 실험이다. 현재 실행 대상은 **v2의 HTTP 완료 8 RPS 탐색**이며 지연·품질 합격 상한은 적용하지 않는다. Ollama를 기준으로 엔진 내부 병렬도와 클라이언트 동시 사용자 수를 탐색한다. GGUF Q4_K_M과 AWQ는 각 엔진에 맞춰 사용한다.

기존 코드는 `load_test_v1/`, 새 실행기는 `load_test_v2/`로 구분한다. `results/20261002/`의 기존 T4 자료는 v1 측정 증거이며 이번 v2 Docker 묶음의 T4 실행 결과가 아니다. 루트의 기존 동명 스크립트와 문항 파일은 참고 사본이다.

## GitHub에서 받기

아래는 이 구성을 `ureca-UBot/UBot-LLMTest`의 **`serving` 브랜치**에 반영한 이후의 명령이다. 로컬 파일 복사만으로 원격 저장소가 갱신되지는 않는다. 처음 받는 EC2에서는 다음을 실행한다.

```bash
git clone --branch serving --single-branch https://github.com/ureca-UBot/UBot-LLMTest.git
cd UBot-LLMTest/servingtest
```

기존 clone을 갱신할 때는 저장소 루트에서 다음을 실행한다. 로컬 변경이 있으면 먼저 보존한다.

```bash
git fetch origin serving
git switch serving
git pull --ff-only origin serving
cd servingtest
git rev-parse HEAD
```

아래 명령과 [Docker 전달 안내](load_test_v2/README.cloud.md)의 상대경로는 모두 **`UBot-LLMTest/servingtest`를 작업 디렉터리로 사용한다**. 실행기가 계산하는 snapshot 루트도 이 폴더다. 저장소 최상위에서 v2 명령을 실행하지 않는다.

## Docker 묶음 준비와 확인

Git에는 소스·Dockerfile·고정 이미지/모델 lock·템플릿·300문항만 포함한다. 약 **27.12 GiB**의 완성 이미지와 모델 tar는 별도로 EC2에 전달해야 한다. 로컬 묶음 위치는 `D:/finalproject/llm/docker_artifacts/frozen_20261002_01/`이며 EC2의 예시 경로는 `/data/frozen_20261002_01/`이다.

EC2에는 Linux x86_64, NVIDIA T4 한 장, driver 580.95.05 이상, Docker Engine, NVIDIA Container Toolkit, Python 3이 필요하다. Node와 엔진 Python 환경은 고정 이미지 안에 있다. 이 소스를 복사하거나 pull하는 과정은 EC2 접속·드라이버 설치·실제 GPU 측정을 수행하지 않는다.

```bash
# UBot-LLMTest/servingtest에서, 전달 폴더 경로를 실제 위치로 지정
python3 load_test_v2/scripts/cloud/bootstrap_images.py --bundle /data/frozen_20261002_01
python3 load_test_v2/scripts/cloud/archive_models.py --import --bundle /data/frozen_20261002_01

# 고정 source/config/문항 검사. 엔진 기동·GPU 측정 없음
bash load_test_v2/scripts/cloud/run_t4.sh --dry-run
```

이미지 tar SHA와 실행 내용 지문, 모델 archive/member SHA, 소스 SHA를 검사한다. 수정된 고정 파일이나 다른 이미지·모델을 섞으면 실패한다. 기존 모델 경로를 덮어쓰지 않는다. 보조 `source.zip`을 쓰는 경우에도 **이 `servingtest/` 안에** 풀어야 한다.

실제 실행 명령과 T4의 backend 제약은 [v2 Docker 전달 안내](load_test_v2/README.cloud.md)에 있다. 엔진은 하나씩 실행하고, 컨테이너·worker·포트와 GPU 메모리의 정리를 확인한 뒤 다음 엔진으로 넘어간다. Linux에서는 전체 실험 시작 때 고정한 VRAM 기준선으로 3회 연속 복귀해야 하며 허용치는 0 MiB다. 정리 실패 시 다음 엔진을 차단한다.

Docker로 호스트 GPU·드라이버·커널까지 고정할 수는 없다. 현재 묶음은 로컬 저장·복원 및 모의 검증을 마쳤으며, 실제 T4 실행 성공과 성능은 아직 검증하지 않았다.

## 문서와 v1 보존

- [v2 실행기 및 모의 검증](load_test_v2/README.md)
- [v2 비교 기준 설계](SERVING_BENCHMARK_V2_DESIGN.md)
- [v2 검증 기록](load_test_v2/VALIDATION.md)
- [모델 저장소 안내](model_assets/README.md)
- [v1 엔진·모델 검사](load_test_v1/ENGINES.md)
- [v1 측정 설정](load_test_v1/SETUP.md)
- [기존 T4 결과](results/20261002/README.md)

기존 v1의 설치 없는 계획 확인 명령은 아래와 같다. v1의 지연·실패율 기준과 기존 모델 구성은 v2의 HTTP 8 RPS 탐색 기준과 구분한다.

```bash
bash load_test_v1/scripts/run_t4_ubuntu.sh --dry-run
```

새 측정 결과·로그·서버별 설정·환경변수·캐시·가중치·이미지 tar는 `.gitignore`로 제외한다. 이미 버전 관리하던 v1 결과 파일은 보존한다. 새 v2 결과는 `load_test_v2/results/`, 준비된 클라우드 모델은 `model_assets/portable/`에 둔다.
