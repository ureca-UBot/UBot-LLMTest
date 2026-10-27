# pipeline_test_v6 — feat/277 + 평가 계정 회선 데이터

[pipeline_test_v5](../pipeline_test_v5/try1/results/all_summary.md)에서 평가 계정의 "이용 중인 회선이 없습니다"가 "요금·미납·사용량이 없다"는 단정을 만들었다(환각 46건 중 19건). 실제 사용자처럼 회선과 이용 기록이 있는 계정으로 같은 백엔드를 다시 잰다. 결과는 [try1/results/all_summary.md](try1/results/all_summary.md).

## 바꾼 것

| 항목 | v5 | v6 |
|---|---|---|
| 백엔드 | `build/feat277-eval-20261023/backend`(feat/277 실행 사본) | **같은 사본**(코드 변경 없음) |
| DB | `ubot_feat277_eval_20261023` | v5 DB를 복제한 `ubot_feat277_eval_lines_20261023` + [seed/eval_runner_lines.sql](seed/eval_runner_lines.sql) |
| 평가 계정 | 회선 없음, 가입일 2026-10-20 | 회선 1개, 가입일 2024-03-15 |
| 케이스셋 | `pipeline_test_v1/cases/cases.jsonl` | [cases/cases.jsonl](cases/cases.jsonl) — v1 복사 + UD 21건 라벨 다시 매김([build_cases.js](build_cases.js)) |
| 실행 범위 | 390건 | **172건**([cases/rerun_ids.txt](cases/rerun_ids.txt)) |

**seed 내용**(기준일 2026-10-23): 회선 `010-3141-5926` Ubot 밸런스 59 75GB업(월 68,000원, 데이터 99,000MB, 음성·문자 무제한), 사용량 2026-05~10(10월은 10-22까지 집계, 미확정), 청구서(10월 청구 52,540원 납부 완료, 미납 없음), 선택약정 2025-03-15~2027-03-14(월 17,000원 할인), 단말 할부 24개월 중 19개월 납부(잔여 240,625원), 부가서비스 컬러링 990원·부재중 알림 550원. **일부러 넣지 않은 것**: 결합·로밍·로밍 차단 부가서비스(UNAVAILABLE_NOTICE 항목과 충돌하지 않게), 미납.

**UD 라벨 변경**: v1 라벨은 회선 없는 계정 기준이라 회선·사용량·청구·약정 질문이 ABSTAIN이었다. 회선을 넣었으므로 자료로 답할 수 있는 칸은 ANSWER다. 최종 status가 바뀐 것은 17건이다 — UD-007~012·016·019~021 ABSTAIN → ANSWER, UD-023·025~030 PARTIAL → ANSWER(두 칸 모두 ANSWER). UD-001·002·004·006은 status는 그대로이고 기대 값 메모(`note`)만 새 가입일 기준으로 달았다. UNAVAILABLE_NOTICE 항목(포인트·멤버십, 할인반환금, 로밍 차단, 소액결제)과 쉐어링 서브 회선은 여전히 ABSTAIN이다.

**실행 범위 172건**: 회선 데이터가 바뀌면 답이 달라질 수 있는 케이스 — v5에서 답변 프롬프트에 사용자 정보 섹션이 들어간 케이스와 UD·ST 전체다(SA 20 · SB 15 · UD 30 · MA 18 · MP 22 · MN 6 · OS 8 · IN 7 · CQ 6 · MT 10 · ST 30). 나머지 218건은 사용자 정보가 답에 들어가지 않으므로 v5 결과와 같다고 보고 다시 돌리지 않았다.

## 실행 환경

- 모델 `qwen3:4b-instruct-2507-q4_K_M`, temperature 0, 임베딩 `bge-m3:567m` — v5와 같은 digest.
- HTTP 8082, Redis DB 14, 생성 동시성 1. 백엔드 실행: [start-backend.ps1](start-backend.ps1)(trace `try1/results/runtime/trace_slot.jsonl`).
- run `local-win_qwen3-4b-instruct_t0_pv6_feat277lines_n172_20261023`(스모크 `..._smoke_20261023`), Judge 배치 `pv6-lines-try1`(`pipeline-judge-2`, Codex `gpt-6-sol` medium). 첫 Judge 시도는 Codex 경로 오류(`spawn codex ENOENT`)로 실패해 경로를 고친 뒤 다시 돌렸다.

```powershell
node pipeline_test_v6/build_cases.js
powershell -File pipeline_test_v6/start-backend.ps1
node scripts/run/run_pipeline_http.js --test pipeline_test_v6 --try try1 --run-id local-win_qwen3-4b-instruct_t0_pv6_feat277lines_n172_20261023 --mode slot --base-url http://localhost:8082 --backend-dir build/feat277-eval-20261023/backend --trace pipeline_test_v6/try1/results/runtime/trace_slot.jsonl --ids <rerun_ids.txt를 쉼표로>
node scripts/judge/judge_pipeline.js --test pipeline_test_v6 --try try1 --batch pv6-lines-try1 --runs local-win_qwen3-4b-instruct_t0_pv6_feat277lines_n172_20261023 --concurrency 4 --confirm-external
node scripts/score/score_pipeline.js --test pipeline_test_v6 --try try1 --runs local-win_qwen3-4b-instruct_t0_pv6_feat277lines_n172_20261023 --judge-batch pv6-lines-try1
node scripts/docgen/pipeline_try_report.js --out pipeline_test_v6/try1/results --ids-from v6 --runs "v5=pipeline_test_v5/try1/local-win_qwen3-4b-instruct_t0_pv5_feat277_n390_20261023@pv5-feat277-try1,v6=pipeline_test_v6/try1/local-win_qwen3-4b-instruct_t0_pv6_feat277lines_n172_20261023@pv6-lines-try1"
```

## 비교할 때 주의

- **UD는 v5와 기대 값이 다르다.** v5는 회선 없는 계정·옛 라벨로 Judge했고, v6는 회선 있는 계정·새 라벨로 Judge했다. UD의 정답·status 수치는 같은 기준의 비교가 아니다. UD를 뺀 142건이 같은 기대 값의 비교다.
- 케이스셋은 v1을 복사했으므로 UD 밖의 라벨·정답 FAQ는 v1~v5와 같다.
