# v8 — FAQ 코어 1,000건 임베딩·LLM 기준점

2026-10-16 EC2에서 **입력·출력 가드 없이** 실제 BGE-m3 임베딩, FAQ 검색, 지정 RedHatAI LLM을 실행한 결과입니다. 조현빈님이 develop에 반영한 프롬프트를 고정해 사용했습니다.

**현재 상태: 실행 1,000건 완료 / 내용 정확도·환각 Judge 평가 전.** 답변 생성 완료나 원본 FAQ 검색 성공을 정답률로 해석하면 안 됩니다.

1. [전체 요약 — 결과와 한계부터 읽기](try1/results/all_summary.md)
2. [질문·검색 FAQ·답변 1,000건 전체](try1/results/summary/answers/README.md)
3. [평가에 적용할 기준](try1/results/summary/evaluation_criteria.md)
4. [모델·프롬프트·검색·데이터 설정](SETUP.md)
5. [실행 상세와 원자료](try1/results/report/execution_report.md)

이전 가드 실험은 [v7의 별도 목차](../model_test_v7/README.md)에 보존되어 있습니다. v8은 새 데이터·새 프롬프트 조건의 기준점이며 과거 결과를 덮어쓰지 않았습니다.
