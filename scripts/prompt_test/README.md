# 프롬프트 테스트

모델(`qwen3:14b`, temperature 0, 추론 끔)은 고정하고 **시스템 프롬프트만 바꿔** 비교한다. 회차마다 폴더를 나눈다.
모델 라운드 공용 모듈(`scripts/test3/config`, `scripts/test3/lib`)과 프롬프트 원문(`scripts/test2/lib/prompts.js`)은 그대로 불러 쓴다.

| 회차 | 내용 | 문서 | 결과 |
|---|---|---|---|
| [round1/](round1/) | v0(현행) 대조 · v1~v3 3안 · 300문항 전체 | [실행 방법](round1/PROMPT_TEST.md) · [설계 근거](round1/PROMPT_DESIGN.md) | `results/test3_prompt/` — [대시보드](../../results/test3_prompt/dashboard.html) |
| [round2/](round2/) | v2 기준선 · 블록 v4~v7 스모크 → 조합안 · 정정본 300 + 신규 50문항 | [계획](round2/PROMPT_ROUND2_PLAN.md) · [실행 방법](round2/PROMPT_ROUND2_RUN.md) | `results/test3_prompt_r2/` |

## 1차 명령

```bash
node scripts/prompt_test/round1/run_prompt_test.js qwen3:14b                       # 생성 + 결정론 채점 + 비교 문서
node scripts/prompt_test/round1/prompt_stats.js  --model qwen3:14b --date 20260922  # LLM Judge 채점 후 통계
node scripts/prompt_test/round1/prompt_charts.js --model qwen3:14b --date 20260922  # 차트 4장 + 대시보드
```

## 2차 명령

순서와 옵션은 [PROMPT_ROUND2_RUN.md](round2/PROMPT_ROUND2_RUN.md)를 따른다.

```bash
node scripts/prompt_test/round2/run_prompt_round2.js baseline   # Phase 0: v2 기준선
node scripts/prompt_test/round2/run_prompt_round2.js smoke      # Phase 1: 블록 스모크
node scripts/prompt_test/round2/judge_round2.js prepare <batch> --runs <run_id,...>
node scripts/prompt_test/round2/report_round2.js smoke --date <날짜>
```
