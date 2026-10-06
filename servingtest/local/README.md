# 로컬 실험

RTX 3060에서 확인한 모델 형식·엔진 최적화 및 전송 실험, 모의 검증, 로컬 전달 준비 자료를 모았다.

| 경로 | 내용 |
|---|---|
| [results/20261002/local_probe](results/20261002/local_probe/) | 로컬 엔진 기동·최적화 실험 |
| [results/20261002/format_transport_probe](results/20261002/format_transport_probe/) | 모델 형식·전송 방식 확인 자료 |
| [results/v2](results/v2/) | HTTP 8 RPS 탐색, GPU 정리 확인, 모의·회귀 검증 결과 |
| [reports/LOCAL_MULTIMODEL_RESULTS_20261006.md](reports/LOCAL_MULTIMODEL_RESULTS_20261006.md) | EXAONE 3.5 7.8B·Gemma3 4B 확장 측정 결과와 Qwen3-4B 비교 |
| [results/multimodel](results/multimodel/) | 모델 확장 측정의 원시 결과 ([실행기](../load_test_multimodel/run_local_multimodel.js)) |
| [artifacts](artifacts/) | Docker·서빙 이미지 환경 기록 |
| [archives](archives/) | 기존 v1·servingtest 소스 ZIP |

공통 실행기는 [load_test_v1](../load_test_v1/)과 [load_test_v2](../load_test_v2/)다. 분석·준비 도구는 [tools](../tools/README.md), 저장소 복구 기록은 [archive](../archive/README.md)에 있다. 실제 T4 자료는 [t4](../t4/README.md), L4 자료는 [l4](../l4/README.md)를 사용한다.
