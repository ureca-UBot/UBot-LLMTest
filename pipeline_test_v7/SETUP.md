# pipeline_test_v7 — 도구 경로 최종 답변 스키마 강제 (always vs on-broken)

[pipeline_test_v6](../pipeline_test_v6/try1/results/all_summary.md)에서 도구 경로 최종 답변 171회 중 38회(칸 수 불일치 35 · 깨짐 3)가 출력 스키마에 맞지 않았다. 도구 경로에서는 Ollama가 스키마를 강제하지 않기 때문이다. 도구 단계가 끝난 뒤 스키마를 걸어 최종 답변을 다시 받는 두 방식을 v6와 같은 172건으로 비교한다. 결과는 [try1/results/all_summary.md](try1/results/all_summary.md).

## 바꾼 것

v6와 같은 소스(`build/feat277-eval-20261023`)를 복사한 `build/schema-final-eval-20261023/backend`를 쓴다. **바뀐 곳은 `OllamaClient` 한 파일**이고, 환경변수 `LLM_FINAL_SCHEMA_MODE`로 모드를 고른다.

| 모드 | 동작 |
|---|---|
| `off` (= v6) | 원래 동작(ChatClient + ToolCallingAdvisor, 도구 경로에는 스키마 없음) |
| **`always`** | 도구가 붙은 요청은 도구 호출 여부와 관계없이, 도구 단계가 끝난 뒤 스키마를 걸어 최종 답변을 **항상 다시 받음** |
| **`on-broken`** | 도구 단계가 끝난 답변(초안)이 스키마에 맞지 않거나 잘렸을 때만 스키마를 걸어 다시 받음 |

- always·on-broken은 같은 수동 도구 루프(`chatModel.call` + `ToolCallingManager`)를 쓰고, 최종 호출에는 도구를 싣지 않는다.
- trace `answer_llm.final_schema`에 `mode` · `tool_rounds` · `draft_raw`(초안) · `draft_violation` · `draft_truncated` · `recalled`를 남긴다.

## 범위와 환경

- 케이스: v6와 같은 172건(`cases/rerun_ids.txt`, `cases/cases.jsonl` = v6 케이스셋 복사).
- 기준선: v6 run `local-win_qwen3-4b-instruct_t0_pv6_feat277lines_n172_20261023`(Judge `pv6-lines-try1`).
- DB: v6 DB(`ubot_feat277_eval_lines_20261023`)를 모드별로 복제 — `ubot_schema_always_20261023` · `ubot_schema_onbroken_20261023`. Redis DB always 12 · on-broken 13. HTTP 8082.
- 모델 `qwen3:4b-instruct-2507-q4_K_M`, temperature 0, bge-m3 — v6와 같다. 생성 동시성 1.
- run: `local-win_qwen3-4b-instruct_t0_pv7_always_n172_20261023`(스모크 `..._always_smoke_20261023`) · `local-win_qwen3-4b-instruct_t0_pv7_onbroken_n172_20261023`
- Judge: `pv7-always-try1` · `pv7-onbroken-try1`(`pipeline-judge-2`, Codex gpt-6-sol medium)

```powershell
powershell -File pipeline_test_v7/start-backend.ps1 -Mode always   # 또는 on-broken
node scripts/run/run_pipeline_http.js --test pipeline_test_v7 --try try1 --run-id <run_id> --mode slot --base-url http://localhost:8082 --backend-dir build/schema-final-eval-20261023/backend --trace pipeline_test_v7/try1/results/runtime/<mode>/trace_slot.jsonl --ids <rerun_ids.txt를 쉼표로>
node scripts/judge/judge_pipeline.js --test pipeline_test_v7 --try try1 --batch pv7-<mode>-try1 --runs <run_id> --concurrency 4 --confirm-external
node scripts/score/score_pipeline.js --test pipeline_test_v7 --try try1 --runs <run_id> --judge-batch pv7-<mode>-try1
python pipeline_test_v7/analyze.py        # 형식·재호출·지연 집계 (PYTHONIOENCODING=utf-8)
node scripts/docgen/pipeline_try_report.js --out pipeline_test_v7/try1/results --runs "v6=pipeline_test_v6/try1/<v6_run>@pv6-lines-try1,always=pipeline_test_v7/try1/<always_run>@pv7-always-try1,on-broken=pipeline_test_v7/try1/<onbroken_run>@pv7-onbroken-try1"
```

채점(`raw/scored/`)은 2026-10-27 문서 정리 때 `score_pipeline.js`로 만들었다(결정론, 저장된 결과·판정만 읽음).
