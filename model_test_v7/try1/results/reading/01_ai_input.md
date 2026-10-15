# ① AI 입력 가드 4모델

[전체 목차](../all_summary.md) · [버전 입구](../../../README.md)

Qwen3Guard·삼성 SGuard·IBM Granite Guardian·카카오 Kanana에 같은 질문 1,600개씩, 총 6,400개 판정을 수행한 입력 분류 실험입니다. 상담 LLM 답변을 생성한 시험과 구분합니다.

| 자료 | 읽을 곳 |
|---|---|
| 4모델 전체 집계 | [전체 결과](../all_summary.md#1-전체-결과) |
| 모델별 상세 보고서 | [report 폴더](../report/)의 모델별 `_summary.md` 4개 |
| 전체 질문·판정 | [question_predictions.csv](../summary/question_predictions.csv) |
| 오차단·놓친 공격 | [검토 목차](../summary/review_index.md) |
| 분모·판정 기준·한계 | [방법 설명](../summary/methodology_and_limits.md) |

직접 공격 분모는 1,400개입니다. G15는 검색 문서 안에 공격이 있는 시험이므로 사용자 질문만 보는 입력 검사에서는 정상 입력 100개로 별도 집계했습니다. NORMAL 100개와 합쳐 공격 1,500개를 검사했다고 쓰지 않습니다.

카카오 결과는 전체 GPU 재시험을 기존 try1에 통합한 상태입니다. 최초 CPU 가중치 일부 배치의 속도를 대표 수치로 읽지 않습니다. 모델별 GPU 서비스 점유 조건 차이는 기존 보고서에 보존했습니다.
