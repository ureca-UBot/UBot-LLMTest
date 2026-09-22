# 결과 요약 — ec2-linux_qwen3-14b_v2_value_guard_t0_nothink_smoke

> 자동 생성 문서입니다 (`scripts/aggregate_report.js`). 손으로 고치지 마세요 — 재실행 시 덮어써집니다.
> 생성 시각: 2026-09-22T05:01:32.878Z
> 비율/평균은 **고유 문항(실행 회차=1, 5건)** 기준입니다. 반복 대상 문항의 2·3회차는 반복 일관성 지표에서만 쓰입니다.

- 모델: `qwen3:14b`
- 실행 환경: `ec2-linux`
- 전체 실행 건수: 5 (고유 문항 5건 + 반복 회차 0건)
- 사람이 읽을 통합 파일: `review.csv` (질문/정답/LLM답변/전체 점수/재확인필요여부 한 행에)

## 항목별 결과

| 항목 | 지표 | 값 | 상세 파일 |
|---|---|---|---|
| 1. 답변정확도 | BGE-M3 유사도 통과율 | 100.0% (avg sim 0.916) | answer_accuracy.jsonl |
| 1. 답변정확도 | 키워드 커버리지(평균) | 93.3% | answer_accuracy.jsonl |
| 2. RAG충실도 | Faithful 비율 | 80.0% (스킵 0건: ABSTAIN/CLARIFY/OUT_OF_SCOPE) | rag_faithfulness.jsonl |
| 3. FAQ부재판단 | Precision / Recall / F1 | N/A / N/A / N/A | absence_detection.jsonl |
| 5. 표현품질 | 평균 점수 / 실격 비율 | 94.0점 / 0.0% | expression_quality.jsonl |
| 6. 명령수행능력 | 포맷 성공률 | 100.0% | format_success.jsonl |
| 7. 성능 | 평균 Latency / P95 | 2613ms / 3173ms | performance.jsonl |
| 7. 성능 | 평균 TPS | 23.1 | performance.jsonl |
| (에스컬레이션) | LLM 재판단 필요 비율 | 0.0% (0/5건, 380행 전체 기준) | escalation.jsonl, review.csv |
