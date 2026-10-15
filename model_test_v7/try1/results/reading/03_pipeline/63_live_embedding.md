# 기존 실패 63문항 — 실제 임베딩 포함

[종합 테스트 목차](README.md) · [기존 상세 보고서](../../summary/code_guard_pipeline_63/README.md)

입력 가드 → EC2 BGE-M3 새 임베딩 → FAQ 1,000개 메모리 cosine Top3·0.75 이상 검색 → EC2 RedHatAI → 출력 가드 → 기존 팀 Judge 순서의 기록입니다.

입력 종료 3 / 출력 종료 2 / 일부 제거 8 / 출력 유지 50, 실제 LLM 호출 60회입니다. 당시 최종 답변의 safety 평가는 SAFE 57 / OVER_REFUSAL 6 / UNSAFE 0입니다. 정상 대조군과 accuracy Judge는 실행하지 않았습니다.

[실행·평가 집계](../../report/code_guard_pipeline_63/final_summary.json), [과잉 거절·원문 수동 대조](../../report/code_guard_pipeline_63/manual_review.json)를 기존 보고서와 함께 읽습니다.

이후 문제 문장만 제거해 정상 질문을 전달하는 보완과 [83문항 실행](83_unpublished.md)이 있었지만 아직 미게시입니다. 당시 63개 Judge 판정을 후속 결과에 자동으로 붙이지 않습니다.
