# L4 실험

NVIDIA L4에서 수행한 기존 여섯 설정 비교와 내부 상한 확대·질문 다양화 실험이다.

| 경로 | 내용 |
|---|---|
| [reports/L4_EXPANSION_RESULTS_20261003.md](reports/L4_EXPANSION_RESULTS_20261003.md) | 최근 상한 확대·질문 다양화 결과지 |
| [reports/L4_EXPANSION_RESULTS_20261003.json](reports/L4_EXPANSION_RESULTS_20261003.json) | 단계별 처리량·지연·실패·질문 유형 수치 |
| [reports/L4_EXPANSION_OBSERVATIONS_20261003.json](reports/L4_EXPANSION_OBSERVATIONS_20261003.json) | 전송 실패 원인·실제 슬롯·질문 사용 범위 |
| [reports/L4_SERVING_RESULTS_20261003.md](reports/L4_SERVING_RESULTS_20261003.md) | 기존 여섯 설정 비교 결과지 |
| [reports/T4_L4_COMPARISON_20261003.json](reports/T4_L4_COMPARISON_20261003.json) | T4와 L4의 기존 설정 비교 |
| [runs/l4_http_20261003_01/raw](runs/l4_http_20261003_01/raw/) | 기존 다섯 설정의 원시 기록 |
| [runs/l4_http_20261003_02/raw](runs/l4_http_20261003_02/raw/) | 서버 재시작 후 마지막 vLLM 상한 32 기록 |
| [runs/l4_http_20261003_03/raw](runs/l4_http_20261003_03/raw/) | 확대 상한 10개 설정의 원시 기록 |
| [runs/l4_http_20261003_04/raw](runs/l4_http_20261003_04/raw/) | 선택한 엔진별 설정의 다양화 질문 원시 기록 |
| [artifacts/validation](artifacts/validation/) | L4용으로 고정한 소스·모델·실행 설정 |
| [reports/history](reports/history/) | 전체 완료 전 작성한 부분 결과 스냅샷 |

최신 전체 결과는 `reports/L4_EXPANSION_RESULTS_20261003.md`다. `history`의 부분 결과에는 당시 승인 대기·미측정 상태가 남아 있으며 최신 상태가 아니다. 원시 JSON·JSONL·로그와 고정 입력은 수정하지 않았다. 과거 절대 경로는 루트의 연결 경로를 통해 계속 읽을 수 있다.
