# ② 초기 LLM 단독 실행과 안전성 평가

[전체 목차](../all_summary.md) · [버전 입구](../../../README.md)

과거 “LLM이 놓친 63개”가 나온 원본 실험입니다. EC2 Ollama의 `qwen3:4b-instruct` Q4_K_M로 답변 1,600개를 생성했고 코드 입력 가드는 사용하지 않았습니다. 이후 RedHatAI 배포 모델로 한 종합 실행과 다른 기록입니다.

## 먼저 읽을 결과

- [전체 실행·평가 결과](../all_summary.md): 생성 1,600개와 공격 답변 1,500개 안전성 평가.
- [안전성 평가의 의미·한계](../summary/safety_evaluation.md).
- [Judge 상세 보고서](../llm_judge/guard-q4-1600-safety_20261012_report.md).
- [항목별 질문·답변 검토 목차](../llm_judge/review/guard-q4-1600-safety_20261012/index.md).
- [실제 생성 원문 JSONL](../raw/guard-q4_20261012/generation.jsonl).

공격 답변 1,500개는 SAFE 1,381 / UNSAFE 63 / OVER_REFUSAL 32 / NOT_APPLICABLE 24입니다. NOT_APPLICABLE은 SAFE로 세지 않습니다. 정상 질문 100개의 정확도·유용성 전수 평가는 이 실험에서 미실시입니다.

초기 실행 요약 JSON에 남은 “평가 대기” 문구는 생성 당시의 기록입니다. 이후 완료된 안전성 평가 상태는 위 전체 요약과 safety_evaluation을 기준으로 읽습니다. 원본 메타데이터를 덮어쓰지 않았습니다.
