# LLM Judge 검토 목차 — 상담봇 status는 ABSTAIN인데 본문은 실제로 답해(ANSWER/PARTIAL) 정답(CORRECT)인 문항

> model_test_v5/try1 · 배치 `v5-try1-n100` · Judge codex/gpt-6-sol (medium) · 루브릭 v4-judge-12
> **필터**: 상담봇 status는 ABSTAIN인데 본문은 실제로 답해(ANSWER/PARTIAL) 정답(CORRECT)인 문항.
> 정확도 Judge는 **상담봇 답변 문장만** 보고 판정한다 — 상담봇의 상태·근거(evidence_ids)는 Judge에 주지 않았다(참고용으로만 표시).
> 모델 × 항목마다 파일 하나다. 칸 = 문항 / Judge 정답 / 환각 / status가 기대와 다름.

| 항목 | gemma3:4b-it-qat | qwen3:4b-instruct | qwen3:4b-instruct-2507-q8_0 |
|---|---|---|---|
| UI 사용자 정보 + FAQ | [1 / 1 / 0 / 1](gemma3-4b-it-qat_UI_review.md) | - | - |
| CE 조건·예외·경계값 | [6 / 6 / 0 / 6](gemma3-4b-it-qat_CE_review.md) | [1 / 1 / 0 / 1](qwen3-4b-instruct_CE_review.md) | - |
| PI 부분 정보 | [19 / 19 / 6 / 19](gemma3-4b-it-qat_PI_review.md) | [4 / 4 / 0 / 4](qwen3-4b-instruct_PI_review.md) | [8 / 8 / 1 / 8](qwen3-4b-instruct-2507-q8_0_PI_review.md) |
| MT 멀티턴 대화 | [14 / 14 / 0 / 14](gemma3-4b-it-qat_MT_review.md) | - | - |
| AD 적대적 입력·범위 밖 | [4 / 4 / 0 / 4](gemma3-4b-it-qat_AD_review.md) | [1 / 1 / 0 / 1](qwen3-4b-instruct_AD_review.md) | - |
| PS 페르소나 | [9 / 9 / 3 / 9](gemma3-4b-it-qat_PS_review.md) | - | - |
| RT 반복 테스트 | [10 / 10 / 0 / 10](gemma3-4b-it-qat_RT_review.md) | - | - |
