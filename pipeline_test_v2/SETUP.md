# pipeline_test_v2 — 1단계: 고지 문장 금지 + 이유 (프롬프트 한 줄)

계획은 [pipeline_test_v1/NEXT_TRY.md](../pipeline_test_v1/NEXT_TRY.md) 1단계다. sub 프롬프트의 answer 작성 방식 2번 한 줄만 바꿔, 섞인 경우(ANSWER + 비ANSWER)에 모델이 쓰는 "자료에 없습니다"류 고지(누출)가 줄어드는지 본다. 결과는 [try1/results/all_summary.md](try1/results/all_summary.md).

## 범위

- 대상: 스모크 119건 `pipeline_test_v1/cases/smoke_next_ids.txt` — v1 try1 sub의 섞인 케이스 64 + 빈 answer 과잉 보류 40 + 대조군 15(겹침 제외). **v1에서 실패가 많던 케이스를 고른 것이라 정답률은 390건 전체보다 낮다.**
- 케이스셋·FAQ 스냅숏은 v1 `pipeline_test_v1/cases/`를 같이 쓴다.
- 기준선 `sub`: v1과 같은 `faq-system-sub.txt`(sha `e517fcba`)를 같은 세션에서 다시 생성한다(run 간 흔들림 기준).
- 새 안 `sub_n1`: `pipeline_test_v1/prompts/next/faq-system.sub_n1.txt`(sha `64b66087`), 작성 방식 2만 다르다.

바꾼 문장:

> 2. status가 ANSWER가 아닌 하위 질문은 answer에서 다루지 않습니다. **답할 수 없는 부분이 있다는 말(자료에 없다, 확인할 수 없다 등)도 answer에 쓰지 않습니다. 답할 수 없는 부분은 시스템이 answer 뒤에 따로 안내하기 때문입니다.** 사용자에게 되묻지 않습니다.

## 실행 환경

| 항목 | 값 |
|---|---|
| 백엔드 | `C:/Ureka/ureca_project2/BackEnd`, `test/pipeline-eval`(`b4924700` + 미커밋), 포트 8081 · Redis DB 1 |
| 모델 | 컨테이너 Ollama 0.34.0, `qwen3:4b-instruct-2507-q4_K_M`(`0edcdef34593`), 임베딩 `bge-m3`, temperature 0, 순차 1건 |
| 실행 | 2026-10-21 14:40~15:00 같은 세션에서 연달아 |
| run | `local-win_qwen3-4b-instruct_t0_pv2_sub_n119_20261021` · `local-win_qwen3-4b-instruct_t0_pv2_subn1_n119_20261021` |
| Judge | 배치 `pv2-try1`, 루브릭 `pipeline-judge-2`, Codex CLI · `gpt-6-sol` · medium |

## 명령

```powershell
node scripts/run/run_pipeline_http.js --test pipeline_test_v2 --try try1 --run-id <run_id> --mode sub --ids <smoke_next_ids.txt의 119개 ID를 쉼표로>
node scripts/judge/judge_pipeline.js --test pipeline_test_v2 --try try1 --batch pv2-try1 --runs <sub_run>,<subn1_run> --confirm-external
node scripts/score/score_pipeline.js --test pipeline_test_v2 --try try1 --runs <sub_run>,<subn1_run> --judge-batch pv2-try1
node scripts/docgen/pipeline_try_report.js --out pipeline_test_v2/try1/results --runs "sub=pipeline_test_v2/try1/<sub_run>@pv2-try1,sub_n1=pipeline_test_v2/try1/<subn1_run>@pv2-try1"
```

새 안은 백엔드의 `faq-system-sub.txt`를 n1 본문으로 바꾼 뒤 같은 명령으로 실행했다. 실행 후 원래 sub 본문으로 되돌렸다.

## 확인 항목

1. 섞인 케이스 누출이 줄어드는가(목표 20 이하).
2. Judge 정답이 떨어지지 않는가 — 같은 프롬프트 run 간 차이(v1 sub vs 오늘 sub)를 잡음 기준으로 본다.
3. 고지가 사라진 자리를 환각이 메우지 않는가.
