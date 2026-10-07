# LLM Judge 검토 목차 — 상담봇 status는 ABSTAIN인데 본문은 실제로 답해(ANSWER/PARTIAL) 정답(CORRECT)인 문항

> model_test_v4/try1 · 배치 `v4-try1-n200` · Judge codex/gpt-6-sol (medium) · 루브릭 v4-judge-12
> **필터**: 상담봇 status는 ABSTAIN인데 본문은 실제로 답해(ANSWER/PARTIAL) 정답(CORRECT)인 문항.
> 정확도 Judge는 **상담봇 답변 문장만** 보고 판정한다 — 상담봇의 상태·근거(evidence_ids)는 Judge에 주지 않았다(참고용으로만 표시).
> 모델 × 항목마다 파일 하나다. 칸 = 문항 / Judge 정답 / 환각 / status가 기대와 다름.

| 항목 | gemma3:4b | qwen3:4b |
|---|---|---|
| NC 유사 FAQ 구분·노이즈 | [9 / 9 / 0 / 9](gemma3-4b_NC_review.md) | [22 / 22 / 4 / 22](qwen3-4b_NC_review.md) |
| MC 다중 FAQ 조합 | [1 / 1 / 0 / 1](gemma3-4b_MC_review.md) | [4 / 4 / 1 / 4](qwen3-4b_MC_review.md) |
| UI 사용자 정보 + FAQ | [6 / 6 / 2 / 6](gemma3-4b_UI_review.md) | [19 / 19 / 4 / 19](qwen3-4b_UI_review.md) |
| CE 조건·예외·경계값 | [4 / 4 / 0 / 4](gemma3-4b_CE_review.md) | [27 / 27 / 6 / 27](qwen3-4b_CE_review.md) |
| PI 부분 정보 | [62 / 62 / 10 / 62](gemma3-4b_PI_review.md) | [24 / 24 / 2 / 24](qwen3-4b_PI_review.md) |
| CF FAQ 충돌·시행일 | [3 / 3 / 0 / 3](gemma3-4b_CF_review.md) | [1 / 1 / 0 / 1](qwen3-4b_CF_review.md) |
| MT 멀티턴 대화 | [4 / 4 / 1 / 4](gemma3-4b_MT_review.md) | [15 / 15 / 5 / 15](qwen3-4b_MT_review.md) |
| AD 적대적 입력·범위 밖 | [6 / 6 / 0 / 6](gemma3-4b_AD_review.md) | [31 / 31 / 3 / 31](qwen3-4b_AD_review.md) |
| AR API 결과 답변 | [1 / 1 / 0 / 1](gemma3-4b_AR_review.md) | [5 / 5 / 0 / 5](qwen3-4b_AR_review.md) |
| PS 페르소나 | [5 / 5 / 2 / 5](gemma3-4b_PS_review.md) | [4 / 4 / 2 / 4](qwen3-4b_PS_review.md) |
| RT 반복 테스트 | [9 / 9 / 0 / 9](gemma3-4b_RT_review.md) | [20 / 20 / 10 / 20](qwen3-4b_RT_review.md) |
