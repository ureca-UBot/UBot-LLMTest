# LLM Judge 검토 목차 — 정답(CORRECT)인데 환각 주장이 있는 문항

> model_test_v4/try1 · 배치 `v4-try1-n200` · Judge codex/gpt-6-sol (medium) · 루브릭 v4-judge-12
> **필터**: 정답(CORRECT)인데 환각 주장이 있는 문항.
> 정확도 Judge는 **상담봇 답변 문장만** 보고 판정한다 — 상담봇의 상태·근거(evidence_ids)는 Judge에 주지 않았다(참고용으로만 표시).
> 모델 × 항목마다 파일 하나다. 칸 = 문항 / Judge 정답 / 환각 / status가 기대와 다름.

| 항목 | gemma3:4b | qwen3:4b |
|---|---|---|
| NC 유사 FAQ 구분·노이즈 | [9 / 9 / 9 / 1](gemma3-4b_NC_review.md) | [14 / 14 / 14 / 10](qwen3-4b_NC_review.md) |
| MC 다중 FAQ 조합 | [4 / 4 / 4 / 3](gemma3-4b_MC_review.md) | [6 / 6 / 6 / 6](qwen3-4b_MC_review.md) |
| UI 사용자 정보 + FAQ | [6 / 6 / 6 / 4](gemma3-4b_UI_review.md) | [8 / 8 / 8 / 4](qwen3-4b_UI_review.md) |
| CE 조건·예외·경계값 | [4 / 4 / 4 / 1](gemma3-4b_CE_review.md) | [8 / 8 / 8 / 8](qwen3-4b_CE_review.md) |
| PI 부분 정보 | [15 / 15 / 15 / 10](gemma3-4b_PI_review.md) | [4 / 4 / 4 / 2](qwen3-4b_PI_review.md) |
| SR 유사하지만 답 없음 | [31 / 31 / 31 / 1](gemma3-4b_SR_review.md) | [36 / 36 / 36 / 0](qwen3-4b_SR_review.md) |
| HR 무관 FAQ | [38 / 38 / 38 / 0](gemma3-4b_HR_review.md) | [17 / 17 / 17 / 0](qwen3-4b_HR_review.md) |
| EC 빈 컨텍스트 | [48 / 48 / 48 / 0](gemma3-4b_EC_review.md) | [38 / 38 / 38 / 0](qwen3-4b_EC_review.md) |
| CF FAQ 충돌·시행일 | - | [3 / 3 / 3 / 0](qwen3-4b_CF_review.md) |
| MT 멀티턴 대화 | [5 / 5 / 5 / 3](gemma3-4b_MT_review.md) | [10 / 10 / 10 / 10](qwen3-4b_MT_review.md) |
| AD 적대적 입력·범위 밖 | [4 / 4 / 4 / 0](gemma3-4b_AD_review.md) | [4 / 4 / 4 / 3](qwen3-4b_AD_review.md) |
| AR API 결과 답변 | [4 / 4 / 4 / 0](gemma3-4b_AR_review.md) | [6 / 6 / 6 / 5](qwen3-4b_AR_review.md) |
| PS 페르소나 | [28 / 28 / 28 / 5](gemma3-4b_PS_review.md) | [19 / 19 / 19 / 11](qwen3-4b_PS_review.md) |
| RT 반복 테스트 | [2 / 2 / 2 / 0](gemma3-4b_RT_review.md) | [18 / 18 / 18 / 10](qwen3-4b_RT_review.md) |
