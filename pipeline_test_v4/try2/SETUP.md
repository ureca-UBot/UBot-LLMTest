# pipeline_test_v4 try2 — 전체 390건 확대

시작: 2026-10-23. sub와 slot을 같은 전체 390개 케이스로 비교한다.

완료: 각 390건의 생성·trace 병합과 LLM 답변 Judge 692건(sub 340·slot 352)을 마쳤다. trace 누락 0건이며 평가용 백엔드는 원래 sub 모드로 복원했다. [최종 요약](results/all_summary.md)과 [검증 결과](results/summary/verification.json)를 확인한다.

## 실행 범위와 재사용

- 케이스: `pipeline_test_v1/cases/cases.jsonl`의 390건 전부. ID·유형·건수 제한 없이 공통 HTTP 러너를 실행한다.
- 두 안 모두 직전에 같은 환경으로 완료한 try1의 119개 응답을 그대로 재사용하고 나머지 271건씩 새로 실행한다. try1 원본은 수정하지 않는다.
- 기존 응답·trace의 일치, 케이스셋 해시, sub·slot·하위 질문 프롬프트 해시를 확인했다.
- Judge는 입력 본문 해시와 루브릭 해시가 동일한 성공 판정만 재사용한다. 재사용 레코드에는 원본 파일·행·run·batch·레코드 해시를 남겼다. sub 119건, slot 118건을 재사용하며, slot MT-017의 기존 CHAT-021 실패 1건도 유지한다.
- 재사용 증거와 ID 목록: `results/source_provenance.json`. 같은 케이스는 전체 결과에서 한 번만 센다.

## 실행 설정

- 백엔드·모델·코드·프롬프트는 [상위 SETUP](../SETUP.md)의 try1과 같다. 생성 동시성은 1, Judge 동시성은 4다.
- sub run: `local-win_qwen3-4b-instruct_t0_pv4_sub_n390_20261023`.
- slot run: `local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023`.
- Judge batch: `pv4-try2`, `pipeline-judge-2`, `gpt-6-sol`, medium.

```powershell
node scripts/run/run_pipeline_http.js --test pipeline_test_v4 --try try2 --run-id <run_id> --mode <sub|slot> --backend-dir C:/Ureka/ureca_project2/BackEnd_eval
node scripts/judge/judge_pipeline.js --test pipeline_test_v4 --try try2 --batch pv4-try2 --runs <sub_run>,<slot_run> --concurrency 4 --confirm-external
node scripts/score/score_pipeline.js --test pipeline_test_v4 --try try2 --runs <sub_run>,<slot_run> --judge-batch pv4-try2
```

## 완료 조건

- 각 run에 중복 없는 390개 케이스가 있고 trace가 빠지지 않아야 한다.
- LLM 답변이 생성된 케이스는 Judge 판정을 전부 마치고, 실행 실패는 그대로 따로 집계한다.
- 정답·환각·모델 고지·코드 안내·빈 본문·하위 status·검색·실행 실패를 집계하고 같은 케이스의 개선·악화를 짝 비교한다.
- 최종 결과는 `results/all_summary.md`와 `results/summary/comparison.json`에 기록하고 평가용 백엔드를 원래 sub 모드로 복원한다.
