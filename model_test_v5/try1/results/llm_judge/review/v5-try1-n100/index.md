# LLM Judge 검토 목차

> model_test_v5/try1 · 배치 `v5-try1-n100` · Judge codex/gpt-6-sol (medium) · 루브릭 v4-judge-12
> 정확도 Judge는 **상담봇 답변 문장만** 보고 판정한다 — 상담봇의 상태·근거(evidence_ids)는 Judge에 주지 않았다(참고용으로만 표시).
> 모델 × 항목마다 파일 하나다. 칸 = 문항 / Judge 정답 / 환각 / status가 기대와 다름.

| 항목 | gemma3:4b-it-qat | qwen3:4b-instruct | qwen3:4b-instruct-2507-q8_0 |
|---|---|---|---|
| NC 유사 FAQ 구분·노이즈 | [100 / 88 / 15 / 23](gemma3-4b-it-qat_NC_review.md) | [100 / 81 / 25 / 2](qwen3-4b-instruct_NC_review.md) | [100 / 81 / 24 / 2](qwen3-4b-instruct-2507-q8_0_NC_review.md) |
| MC 다중 FAQ 조합 | [100 / 68 / 7 / 22](gemma3-4b-it-qat_MC_review.md) | [100 / 89 / 12 / 0](qwen3-4b-instruct_MC_review.md) | [100 / 88 / 11 / 0](qwen3-4b-instruct-2507-q8_0_MC_review.md) |
| UI 사용자 정보 + FAQ | [100 / 43 / 34 / 14](gemma3-4b-it-qat_UI_review.md) | [100 / 59 / 28 / 18](qwen3-4b-instruct_UI_review.md) | [100 / 63 / 30 / 16](qwen3-4b-instruct-2507-q8_0_UI_review.md) |
| CE 조건·예외·경계값 | [100 / 46 / 17 / 54](gemma3-4b-it-qat_CE_review.md) | [100 / 67 / 22 / 8](qwen3-4b-instruct_CE_review.md) | [100 / 70 / 26 / 6](qwen3-4b-instruct-2507-q8_0_CE_review.md) |
| PI 부분 정보 | [100 / 51 / 62 / 45](gemma3-4b-it-qat_PI_review.md) | [100 / 73 / 33 / 17](qwen3-4b-instruct_PI_review.md) | [100 / 85 / 22 / 11](qwen3-4b-instruct-2507-q8_0_PI_review.md) |
| SR 유사하지만 답 없음 | [100 / 76 / 51 / 15](gemma3-4b-it-qat_SR_review.md) | [100 / 91 / 26 / 19](qwen3-4b-instruct_SR_review.md) | [100 / 92 / 30 / 16](qwen3-4b-instruct-2507-q8_0_SR_review.md) |
| HR 무관 FAQ | [100 / 84 / 46 / 1](gemma3-4b-it-qat_HR_review.md) | [100 / 96 / 12 / 9](qwen3-4b-instruct_HR_review.md) | [100 / 95 / 18 / 6](qwen3-4b-instruct-2507-q8_0_HR_review.md) |
| EC 빈 컨텍스트 | [100 / 93 / 50 / 0](gemma3-4b-it-qat_EC_review.md) | [100 / 94 / 13 / 0](qwen3-4b-instruct_EC_review.md) | [100 / 93 / 19 / 0](qwen3-4b-instruct-2507-q8_0_EC_review.md) |
| CF FAQ 충돌·시행일 | [100 / 39 / 27 / 52](gemma3-4b-it-qat_CF_review.md) | [100 / 47 / 43 / 47](qwen3-4b-instruct_CF_review.md) | [100 / 55 / 32 / 47](qwen3-4b-instruct-2507-q8_0_CF_review.md) |
| MT 멀티턴 대화 | [100 / 70 / 10 / 37](gemma3-4b-it-qat_MT_review.md) | [100 / 82 / 14 / 4](qwen3-4b-instruct_MT_review.md) | [100 / 88 / 24 / 2](qwen3-4b-instruct-2507-q8_0_MT_review.md) |
| AD 적대적 입력·범위 밖 | [100 / 83 / 17 / 12](gemma3-4b-it-qat_AD_review.md) | [100 / 84 / 25 / 4](qwen3-4b-instruct_AD_review.md) | [100 / 85 / 18 / 4](qwen3-4b-instruct-2507-q8_0_AD_review.md) |
| AR API 결과 답변 | [100 / 38 / 43 / 23](gemma3-4b-it-qat_AR_review.md) | [100 / 52 / 43 / 38](qwen3-4b-instruct_AR_review.md) | [100 / 43 / 46 / 43](qwen3-4b-instruct-2507-q8_0_AR_review.md) |
| PS 페르소나 | [100 / 91 / 33 / 25](gemma3-4b-it-qat_PS_review.md) | [100 / 92 / 45 / 3](qwen3-4b-instruct_PS_review.md) | [100 / 87 / 45 / 5](qwen3-4b-instruct-2507-q8_0_PS_review.md) |
| RT 반복 테스트 | [100 / 81 / 22 / 11](gemma3-4b-it-qat_RT_review.md) | [100 / 89 / 20 / 20](qwen3-4b-instruct_RT_review.md) | [100 / 73 / 40 / 29](qwen3-4b-instruct-2507-q8_0_RT_review.md) |
