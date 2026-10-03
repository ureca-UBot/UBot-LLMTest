# servingtest

Ubuntu 24.04 LTS와 NVIDIA Tesla T4 한 장에서 Ollama, llama.cpp, vLLM, SGLang을 순서대로 비교하는 LLM 서빙 부하 테스트다.

기존 실행 코드는 `load_test_v1/`에 보존돼 있다. 새 비교 기준의 실행기와 모의 검증은 [load_test_v2](load_test_v2/README.md)에 있다. 엔진 설치·모델 다운로드·드라이버 변경은 실행기가 하지 않는다.

**HTTP 완료 8 RPS 탐색의 Docker 전달은 [v2 Docker 안내](load_test_v2/README.cloud.md), 실제 새 EC2 T4 결과는 [검증 기록](load_test_v2/VALIDATION.md)을 사용한다.** 아래 서버 명령은 기존 v1 기준이다. 새 Docker 전달 구성은 완성 이미지·모델 archive의 검증과 별도 Linux 실행기를 사용한다.

## 서버에서 실행

저장소를 내려받은 뒤 `servingtest` 폴더로 이동해 실행한다.

```bash
cd servingtest

# 설치·다운로드·서버 기동 없이 계획 확인
bash load_test_v1/scripts/run_t4_ubuntu.sh --dry-run

# 엔진·모델 형식 확인만 수행
bash load_test_v1/scripts/run_t4_ubuntu.sh --check-only

# 설치 없이 전체 측정. SSH 연결 종료 후에도 계속 실행
bash load_test_v1/scripts/run_t4_ubuntu.sh --background
```

Ubuntu 24.04 x86_64, systemd, T4 한 장, 동작하는 NVIDIA 드라이버, Node.js 20 이상, Python 3, 비밀번호 없이 실행 가능한 `sudo`가 필요하다. `load_test_v1/scripts/config/engines.existing.example.json`을 `engines.local.json`으로 복사하고 엔진 실행 파일과 기존 모델 경로를 지정한다. 설정 방법은 [엔진 안내](load_test_v1/ENGINES.md)에 있다. `--check-only`는 메타데이터 확인을 위해 Ollama 서비스를 잠시 기동·중지한 뒤 원래 상태를 복원한다.

기본 실행 순서는 Ollama → llama.cpp → vLLM → SGLang이다. 각 모델의 로딩 시간과 웜업 시간을 따로 기록하고, 웜업이 끝난 뒤 측정한다. 한 조합의 서버와 worker가 종료되고 GPU가 해제된 것을 확인해야 다음 조합을 시작한다.

## 측정 조건과 기록

- 모델: Gemma 3 4B, Qwen 3 4B·8B·14B.
- 문항: 15개 항목별 20건, 총 300건의 고정 표본. 항목 비율과 난이도 비율을 유지한다.
- 생성: context 4096, 출력 상한 512, temperature 0, Qwen thinking 비활성화.
- 판정: 기존 E2E P95 5초 이하와 실패율 5% 이하를 유지한다.
- 측정: 단계적 동시 사용자 증가, 스파이크, 도착률, 반복 측정. 답변 원문과 부분 답변도 저장한다.
- 검증: 로컬 회귀 테스트 40개 통과. Ubuntu 24.04/Tesla T4에서 Ollama 4개 모델의 기동·웜업·순차 측정·종료를 실측했다. Python 엔진도 GGUF 로더와 로컬 토크나이저가 준비돼 있으면 기존 Ollama GGUF를 재사용한다. llama.cpp·vLLM·SGLang의 부하 실측은 각 실행 환경과 모델의 기동 검증 후 진행한다.

기본 회차 결과는 `load_test_v1/try1/results/`, 전체 실행 로그는 `load_test_v1/automation_logs/`에 저장한다. 답변은 `raw/<run_id>/requests.jsonl`, 전체 상태는 `summary/automation_<날짜>_<profile>.json`, 성능 요약은 `all_summary.md`에서 확인한다. 모델·양자화·정밀도에 따라 실행 가능 여부가 달라지며 실패한 조합은 별도 상태로 기록한다.

## 안내 문서

- [기존 엔진·모델 검사와 순차 실행](load_test_v1/ENGINES.md)
- [측정 설정과 Ollama 개별 실행](load_test_v1/SETUP.md)
- [T4 벤치마크 설계](load_test_v1/aws_t4_llm_serving_benchmark_design.md)
- [기존 엔진·모델 경로 설정 예시](load_test_v1/scripts/config/engines.existing.example.json)
- [문항 추출 조건](load_test_v1/data/benchmark_prompt_sample.json)

루트에 있는 동명 문서·스크립트·문항 파일은 복구한 참고용 사본이다. 실행할 때는 위 명령처럼 `load_test_v1/scripts/` 아래 파일을 사용한다. 3,000문항 엑셀 원본은 포함하지 않으며, 측정에 필요한 300문항 JSONL은 패키지에 포함돼 있다.

검사 상태, 측정 결과, 로그, 로컬 엔진 설정, 환경변수 파일, ZIP은 `.gitignore`로 제외한다. GitHub에는 소스 코드, 설정 예시, 안내 문서와 고정 문항 데이터를 올린다.

로컬 모델 저장소 `model_assets/`는 폴더 안내 `README.md`만 포함한다. BF16·AWQ·GGUF 가중치, Hugging Face·Ollama 캐시와 로컬 이동·검증 기록은 Git 추적에서 제외하며 실행 환경에서 별도로 준비한다. 폴더 구성과 실행기의 모델 경로 관리는 [모델 저장소 안내](model_assets/README.md)를 참고한다.
## 새 비교 실행기

기존 v1과 분리한 [load_test_v2](load_test_v2/README.md)는 공통 스트리밍·전송 조건, 고정 측정 구간, 유효 응답 처리량 및 품질 승인 gate를 구현한다. 비교 기준은 [v2 설계안](SERVING_BENCHMARK_V2_DESIGN.md)에 기록했다.

2026-10-02 새 EC2 T4에서 HTTP 완료 탐색의 여섯 후보를 실제 실행했다. 각 U의 30초 창에서 최고 관측값은 vLLM 내부 상한 32의 1.9667 RPS와 SGLang 내부 상한 32의 1.9333 RPS였고, 목표 8 RPS에는 모두 미달했다. llama.cpp는 연결 재사용 실패 117건이 있어 안정적인 처리량으로 해석하지 않는다. 모든 엔진의 종료 후 VRAM 0 MiB·compute PID 없음·소유 컨테이너 제거를 확인했고 기존 네 서비스와 원격 clone을 보존했다. 세부 조건·실패·한계는 [검증 기록](load_test_v2/VALIDATION.md)에 있다.

실측은 보존된 `docker_artifacts/on_demand_20261002_02` 소스로 수행했다. 후속 전달용 `on_demand_20261002_03`은 AWQ 준비 검사의 선택적 null 필드 처리만 수정하며, 22개 회귀 테스트와 실제 AWQ 파일의 읽기 전용 검증을 통과했다. 소스 ZIP·runner·이미지 전달 메타데이터는 모델 가중치·결과와 분리한다. 로컬 저장소 수정은 커밋·push하지 않았다.
