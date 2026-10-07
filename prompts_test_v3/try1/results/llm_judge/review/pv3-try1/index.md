# LLM Judge 검토 목차

> prompts_test_v3/try1 · 배치 `pv3-try1` · Judge codex/gpt-6-sol (medium) · 루브릭 v4-judge-12
> 정확도 Judge는 **상담봇 답변 문장만** 보고 판정한다 — 상담봇의 상태·근거(evidence_ids)는 Judge에 주지 않았다(참고용으로만 표시).
> 모델 × 항목마다 파일 하나다. 칸 = 문항 / Judge 정답 / 환각 / status가 기대와 다름.

| 항목 | qwen3:4b |
|---|---|
| NC 유사 FAQ 구분·노이즈 | [100 / 79 / 19 / 26](qwen3-4b_NC_review.md) |
| MC 다중 FAQ 조합 | [100 / 88 / 4 / 9](qwen3-4b_MC_review.md) |
| PI 부분 정보 | [100 / 57 / 38 / 42](qwen3-4b_PI_review.md) |
| SR 유사하지만 답 없음 | [100 / 87 / 21 / 23](qwen3-4b_SR_review.md) |
| HR 무관 FAQ | [100 / 82 / 25 / 6](qwen3-4b_HR_review.md) |
