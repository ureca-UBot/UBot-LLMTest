# v8 — FAQ 코어 1,000건 기준점과 가드 적용 비교

## 회차별로 읽기

| 회차 | 조건 | 읽기 시작점 |
|---|---|---|
| try1 | 임베딩·LLM 기준점, 가드 없음, 내용 Judge 완료 | [기준점 요약](try1/results/all_summary.md) |
| try2 | 현재 STS 입력·출력 가드 적용, 새 내용 Judge 미실행 | [가드 비교 요약](try2/results/all_summary.md) · [1,000건 최종 답변](try2/results/summary/answers/README.md) · [오차단 사례](try2/results/summary/review_findings.md) |

이번 가드 적용 결과는 try2에 구분해 보관했습니다. 기존 기준점과 평가 원자료는 try1에 그대로 있습니다.

## try1 기준점 기록

2026-10-16 EC2에서 **입력·출력 가드 없이** 실제 BGE-m3 임베딩, FAQ 검색, 지정 RedHatAI LLM을 실행한 결과입니다. 조현빈님이 develop에 반영한 프롬프트를 고정해 사용했습니다.

**현재 상태: 실행·내용 Judge 1,000건 완료.** 원판정 정답 633건·근거 이탈 256건이며, Codex 근거 재검토 의견은 정답 702건·근거 이탈 303건입니다. 원판정·재검토를 분리했고 사람의 정답 라벨로 표현하지 않았습니다. 개인·매장 조회 자료를 주지 않은 조건은 [평가 보고서](try1/results/llm_judge/core1000-accuracy-context-v1_20261016/evaluation_report.md)에서 확인하세요.

1. [전체 요약 — 결과와 한계부터 읽기](try1/results/all_summary.md)
2. [질문·검색 FAQ·답변 1,000건 전체](try1/results/summary/answers/README.md)
3. [평가에 적용할 기준](try1/results/summary/evaluation_criteria.md)
4. [모델·프롬프트·검색·데이터 설정](SETUP.md)
5. [실행 상세와 원자료](try1/results/report/execution_report.md)
6. [내용 평가 보고서·문제 사례](try1/results/llm_judge/core1000-accuracy-context-v1_20261016/evaluation_report.md)

이전 가드 실험은 [v7의 별도 목차](../model_test_v7/README.md)에 보존되어 있습니다. v8은 새 데이터·새 프롬프트 조건의 기준점이며 과거 결과를 덮어쓰지 않았습니다.
