# LLM Judge 검토 목차 — 정확도 INCORRECT(오답)인 문항

> model_test_v5/try1 · 배치 `v5-try1-n100` · Judge codex/gpt-6-sol (medium) · 루브릭 v4-judge-12
> **필터**: 정확도 INCORRECT(오답)인 문항.
> 정확도 Judge는 **상담봇 답변 문장만** 보고 판정한다 — 상담봇의 상태·근거(evidence_ids)는 Judge에 주지 않았다(참고용으로만 표시).
> 모델 × 항목마다 파일 하나다. 칸 = 문항 / Judge 정답 / 환각 / status가 기대와 다름.

| 항목 | qwen3:4b-instruct |
|---|---|
| NC 유사 FAQ 구분·노이즈 | [19 / 0 / 13 / 0](qwen3-4b-instruct_NC_review.md) |
| MC 다중 FAQ 조합 | [11 / 0 / 9 / 0](qwen3-4b-instruct_MC_review.md) |
| UI 사용자 정보 + FAQ | [41 / 0 / 25 / 17](qwen3-4b-instruct_UI_review.md) |
| CE 조건·예외·경계값 | [33 / 0 / 12 / 4](qwen3-4b-instruct_CE_review.md) |
| PI 부분 정보 | [27 / 0 / 14 / 12](qwen3-4b-instruct_PI_review.md) |
| SR 유사하지만 답 없음 | [9 / 0 / 8 / 7](qwen3-4b-instruct_SR_review.md) |
| HR 무관 FAQ | [4 / 0 / 4 / 3](qwen3-4b-instruct_HR_review.md) |
| EC 빈 컨텍스트 | [6 / 0 / 6 / 0](qwen3-4b-instruct_EC_review.md) |
| CF FAQ 충돌·시행일 | [53 / 0 / 37 / 38](qwen3-4b-instruct_CF_review.md) |
| MT 멀티턴 대화 | [18 / 0 / 4 / 1](qwen3-4b-instruct_MT_review.md) |
| AD 적대적 입력·범위 밖 | [16 / 0 / 14 / 2](qwen3-4b-instruct_AD_review.md) |
| AR API 결과 답변 | [48 / 0 / 36 / 27](qwen3-4b-instruct_AR_review.md) |
| PS 페르소나 | [8 / 0 / 7 / 0](qwen3-4b-instruct_PS_review.md) |
| RT 반복 테스트 | [11 / 0 / 11 / 11](qwen3-4b-instruct_RT_review.md) |
