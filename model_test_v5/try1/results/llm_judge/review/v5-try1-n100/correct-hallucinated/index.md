# LLM Judge 검토 목차 — 정답(CORRECT)인데 환각 주장이 있는 문항

> model_test_v5/try1 · 배치 `v5-try1-n100` · Judge codex/gpt-6-sol (medium) · 루브릭 v4-judge-12
> **필터**: 정답(CORRECT)인데 환각 주장이 있는 문항.
> 정확도 Judge는 **상담봇 답변 문장만** 보고 판정한다 — 상담봇의 상태·근거(evidence_ids)는 Judge에 주지 않았다(참고용으로만 표시).
> 모델 × 항목마다 파일 하나다. 칸 = 문항 / Judge 정답 / 환각 / status가 기대와 다름.

| 항목 | gemma3:4b-it-qat | qwen3:4b-instruct | qwen3:4b-instruct-2507-q8_0 |
|---|---|---|---|
| NC 유사 FAQ 구분·노이즈 | [6 / 6 / 6 / 3](gemma3-4b-it-qat_NC_review.md) | [12 / 12 / 12 / 0](qwen3-4b-instruct_NC_review.md) | [11 / 11 / 11 / 0](qwen3-4b-instruct-2507-q8_0_NC_review.md) |
| MC 다중 FAQ 조합 | [3 / 3 / 3 / 2](gemma3-4b-it-qat_MC_review.md) | [3 / 3 / 3 / 0](qwen3-4b-instruct_MC_review.md) | [2 / 2 / 2 / 0](qwen3-4b-instruct-2507-q8_0_MC_review.md) |
| UI 사용자 정보 + FAQ | - | [3 / 3 / 3 / 0](qwen3-4b-instruct_UI_review.md) | [8 / 8 / 8 / 3](qwen3-4b-instruct-2507-q8_0_UI_review.md) |
| CE 조건·예외·경계값 | [3 / 3 / 3 / 3](gemma3-4b-it-qat_CE_review.md) | [10 / 10 / 10 / 0](qwen3-4b-instruct_CE_review.md) | [17 / 17 / 17 / 0](qwen3-4b-instruct-2507-q8_0_CE_review.md) |
| PI 부분 정보 | [25 / 25 / 25 / 10](gemma3-4b-it-qat_PI_review.md) | [19 / 19 / 19 / 0](qwen3-4b-instruct_PI_review.md) | [16 / 16 / 16 / 1](qwen3-4b-instruct-2507-q8_0_PI_review.md) |
| SR 유사하지만 답 없음 | [28 / 28 / 28 / 4](gemma3-4b-it-qat_SR_review.md) | [18 / 18 / 18 / 2](qwen3-4b-instruct_SR_review.md) | [23 / 23 / 23 / 6](qwen3-4b-instruct-2507-q8_0_SR_review.md) |
| HR 무관 FAQ | [31 / 31 / 31 / 0](gemma3-4b-it-qat_HR_review.md) | [8 / 8 / 8 / 2](qwen3-4b-instruct_HR_review.md) | [14 / 14 / 14 / 2](qwen3-4b-instruct-2507-q8_0_HR_review.md) |
| EC 빈 컨텍스트 | [43 / 43 / 43 / 0](gemma3-4b-it-qat_EC_review.md) | [7 / 7 / 7 / 0](qwen3-4b-instruct_EC_review.md) | [12 / 12 / 12 / 0](qwen3-4b-instruct-2507-q8_0_EC_review.md) |
| CF FAQ 충돌·시행일 | - | [6 / 6 / 6 / 3](qwen3-4b-instruct_CF_review.md) | [2 / 2 / 2 / 2](qwen3-4b-instruct-2507-q8_0_CF_review.md) |
| MT 멀티턴 대화 | [2 / 2 / 2 / 2](gemma3-4b-it-qat_MT_review.md) | [10 / 10 / 10 / 1](qwen3-4b-instruct_MT_review.md) | [18 / 18 / 18 / 1](qwen3-4b-instruct-2507-q8_0_MT_review.md) |
| AD 적대적 입력·범위 밖 | [3 / 3 / 3 / 0](gemma3-4b-it-qat_AD_review.md) | [11 / 11 / 11 / 0](qwen3-4b-instruct_AD_review.md) | [7 / 7 / 7 / 0](qwen3-4b-instruct-2507-q8_0_AD_review.md) |
| AR API 결과 답변 | [7 / 7 / 7 / 0](gemma3-4b-it-qat_AR_review.md) | [7 / 7 / 7 / 3](qwen3-4b-instruct_AR_review.md) | [7 / 7 / 7 / 2](qwen3-4b-instruct-2507-q8_0_AR_review.md) |
| PS 페르소나 | [28 / 28 / 28 / 13](gemma3-4b-it-qat_PS_review.md) | [38 / 38 / 38 / 1](qwen3-4b-instruct_PS_review.md) | [35 / 35 / 35 / 3](qwen3-4b-instruct-2507-q8_0_PS_review.md) |
| RT 반복 테스트 | [21 / 21 / 21 / 0](gemma3-4b-it-qat_RT_review.md) | [9 / 9 / 9 / 9](qwen3-4b-instruct_RT_review.md) | [18 / 18 / 18 / 9](qwen3-4b-instruct-2507-q8_0_RT_review.md) |
