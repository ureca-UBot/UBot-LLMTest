# LLM Judge 검토 목차

> model_test_v4/try1 · 배치 `v4-try1-n200` · Judge codex/gpt-6-sol (medium) · 루브릭 v4-judge-12
> 정확도 Judge는 **상담봇 답변 문장만** 보고 판정한다 — 상담봇의 상태·근거(evidence_ids)는 Judge에 주지 않았다(참고용으로만 표시).
> 모델 × 항목마다 파일 하나다. 칸 = 문항 / Judge 정답 / 환각 / status가 기대와 다름.

| 항목 | gemma3:4b | qwen3:4b |
|---|---|---|
| NC 유사 FAQ 구분·노이즈 | [200 / 171 / 29 / 25](gemma3-4b_NC_review.md) | [200 / 131 / 51 / 125](qwen3-4b_NC_review.md) |
| MC 다중 FAQ 조합 | [200 / 128 / 13 / 65](gemma3-4b_MC_review.md) | [200 / 153 / 21 / 85](qwen3-4b_MC_review.md) |
| UI 사용자 정보 + FAQ | [200 / 75 / 68 / 63](gemma3-4b_UI_review.md) | [200 / 84 / 56 / 125](qwen3-4b_UI_review.md) |
| CE 조건·예외·경계값 | [200 / 72 / 44 / 79](gemma3-4b_CE_review.md) | [200 / 45 / 57 / 192](qwen3-4b_CE_review.md) |
| PI 부분 정보 | [200 / 80 / 96 / 162](gemma3-4b_PI_review.md) | [200 / 37 / 55 / 173](qwen3-4b_PI_review.md) |
| SR 유사하지만 답 없음 | [200 / 165 / 60 / 9](gemma3-4b_SR_review.md) | [200 / 193 / 43 / 0](qwen3-4b_SR_review.md) |
| HR 무관 FAQ | [200 / 177 / 56 / 3](gemma3-4b_HR_review.md) | [200 / 186 / 31 / 3](qwen3-4b_HR_review.md) |
| EC 빈 컨텍스트 | [200 / 191 / 57 / 0](gemma3-4b_EC_review.md) | [200 / 194 / 43 / 0](qwen3-4b_EC_review.md) |
| CF FAQ 충돌·시행일 | [200 / 72 / 65 / 95](gemma3-4b_CF_review.md) | [200 / 88 / 28 / 119](qwen3-4b_CF_review.md) |
| MT 멀티턴 대화 | [200 / 136 / 16 / 13](gemma3-4b_MT_review.md) | [200 / 144 / 38 / 104](qwen3-4b_MT_review.md) |
| AD 적대적 입력·범위 밖 | [200 / 163 / 27 / 9](gemma3-4b_AD_review.md) | [200 / 125 / 38 / 99](qwen3-4b_AD_review.md) |
| AR API 결과 답변 | [200 / 83 / 56 / 53](gemma3-4b_AR_review.md) | [200 / 82 / 78 / 92](qwen3-4b_AR_review.md) |
| PS 페르소나 | [200 / 177 / 38 / 19](gemma3-4b_PS_review.md) | [200 / 176 / 33 / 49](qwen3-4b_PS_review.md) |
| RT 반복 테스트 | [200 / 109 / 31 / 50](gemma3-4b_RT_review.md) | [200 / 137 / 35 / 81](qwen3-4b_RT_review.md) |
