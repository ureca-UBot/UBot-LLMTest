# T4 실험

NVIDIA Tesla T4에서 수행한 초기 설치·네이티브 비교 및 후속 Docker HTTP 처리량 실험이다.

| 경로 | 내용 |
|---|---|
| [reports/T4_SERVING_RESULTS_20261002.md](reports/T4_SERVING_RESULTS_20261002.md) | Docker 여섯 설정의 최종 결과지 |
| [reports/T4_SERVING_RESULTS_20261002.json](reports/T4_SERVING_RESULTS_20261002.json) | 상세 비교 수치 |
| [runs/t4_http_20261002_01/raw](runs/t4_http_20261002_01/raw/) | 원시 보고서·요청 응답·서버 로그·GPU 정리 증거 |
| [results/20261001](results/20261001/) | 초기 설치·Ollama 및 네이티브 실험 기록 |
| [artifacts](artifacts/) | 이미지·모델 버전/해시·전달 매니페스트, on-demand 소스 ZIP, T4 검증용 소스 |
| [archives](archives/) | 서버에서 수집한 결과·설치 자료 ZIP |

전달 이미지와 모델은 L4에서도 같은 파일을 재사용했다. 2026-10-03에 대용량 이미지·모델 전달 TAR를 삭제했고 버전·해시·매니페스트와 소스 ZIP을 보존했다. 측정 결과를 수집한 TAR·ZIP은 그대로 있다. 원시 기록의 과거 절대 경로는 루트의 연결 경로를 통해 계속 유효하다. 기록 안에 들어 있는 원격 Linux 경로는 실행 당시 서버 위치다.
