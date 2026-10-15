# 1,600문항 종합 실행 — 고정 FAQ 사용

[종합 테스트 목차](README.md) · [기존 상세 보고서](../../summary/code_guard_pipeline_1600/README.md)

코드 입력 가드 → 저장 FAQ Context → EC2 RedHatAI → 코드 출력 가드를 실제 연결했습니다. 질문 1,600개 중 입력 전체 종료 15개를 제외해 LLM을 1,585회 호출했습니다. 새 임베딩 측정은 하지 않았습니다.

| 처리 | 건수 |
|---|---:|
| 입력 전체 종료 | 15 |
| 출력 전체 종료 | 8 |
| 출력 일부 제거 | 242 |
| 출력 내용 유지 | 1,335 |

[읽기용 실행 결과 TXT](../../summary/code_guard_pipeline_1600/execution_results.txt) → [실행 집계 JSON](../../report/code_guard_pipeline_1600/execution_summary.json) → [원자료 폴더](../../raw/) 순서로 읽습니다. 정확한 run ID와 경로는 기존 상세 보고서에 있습니다.

전체 새 Judge 평가는 연결 확인 2개 뒤 범위 변경으로 중단됐습니다. 이후 실제 임베딩을 포함한 [63문항](63_live_embedding.md)을 별도로 실행·평가했습니다. 1,600개 전체가 새 안전성 평가를 통과했다고 표시하지 않습니다.
