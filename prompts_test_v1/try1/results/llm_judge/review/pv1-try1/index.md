# LLM Judge 검토 목차

> prompts_test_v1/try1 · 배치 `pv1-try1` · Judge codex/gpt-6-sol (medium) · 루브릭 v4-judge-12
> 정확도 Judge는 **상담봇 답변 문장만** 보고 판정한다 — 상담봇의 상태·근거(evidence_ids)는 Judge에 주지 않았다(참고용으로만 표시).
> 모델 × 항목마다 파일 하나다. 칸 = 문항 / Judge 정답 / 환각 / status가 기대와 다름.

| 항목 | qwen3:4b |
|---|---|
| NC 유사 FAQ 구분·노이즈 | [100 / 78 / 12 / 19](qwen3-4b_NC_review.md) |
| MC 다중 FAQ 조합 | [100 / 70 / 6 / 3](qwen3-4b_MC_review.md) |
| UI 사용자 정보 + FAQ | [100 / 38 / 29 / 49](qwen3-4b_UI_review.md) |
| CE 조건·예외·경계값 | [100 / 60 / 14 / 58](qwen3-4b_CE_review.md) |
| PI 부분 정보 | [100 / 47 / 25 / 55](qwen3-4b_PI_review.md) |
| SR 유사하지만 답 없음 | [100 / 97 / 20 / 3](qwen3-4b_SR_review.md) |
| HR 무관 FAQ | [100 / 87 / 24 / 6](qwen3-4b_HR_review.md) |
| EC 빈 컨텍스트 | [100 / 95 / 23 / 0](qwen3-4b_EC_review.md) |
| CF FAQ 충돌·시행일 | [100 / 34 / 17 / 67](qwen3-4b_CF_review.md) |
| AD 적대적 입력·범위 밖 | [100 / 82 / 16 / 26](qwen3-4b_AD_review.md) |
| AR API 결과 답변 | [100 / 36 / 43 / 25](qwen3-4b_AR_review.md) |
