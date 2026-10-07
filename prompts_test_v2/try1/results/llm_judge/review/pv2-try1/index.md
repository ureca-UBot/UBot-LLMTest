# LLM Judge 검토 목차

> prompts_test_v2/try1 · 배치 `pv2-try1` · Judge codex/gpt-6-sol (medium) · 루브릭 v4-judge-12
> 정확도 Judge는 **상담봇 답변 문장만** 보고 판정한다 — 상담봇의 상태·근거(evidence_ids)는 Judge에 주지 않았다(참고용으로만 표시).
> 모델 × 항목마다 파일 하나다. 칸 = 문항 / Judge 정답 / 환각 / status가 기대와 다름.

| 항목 | qwen3:4b |
|---|---|
| NC 유사 FAQ 구분·노이즈 | [100 / 85 / 14 / 14](qwen3-4b_NC_review.md) |
| MC 다중 FAQ 조합 | [100 / 79 / 6 / 2](qwen3-4b_MC_review.md) |
| PI 부분 정보 | [100 / 56 / 51 / 41](qwen3-4b_PI_review.md) |
| SR 유사하지만 답 없음 | [100 / 78 / 47 / 28](qwen3-4b_SR_review.md) |
| HR 무관 FAQ | [100 / 80 / 39 / 5](qwen3-4b_HR_review.md) |
| AD 적대적 입력·범위 밖 | [100 / 84 / 19 / 33](qwen3-4b_AD_review.md) |
