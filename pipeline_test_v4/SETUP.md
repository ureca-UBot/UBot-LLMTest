# pipeline_test_v4 — 하위 질문별 answer → status 칸 비교

완료: **[try2 전체 390건 확대](try2/SETUP.md)**. try1의 119개 응답을 보존하고 두 모드에서 나머지 271건씩 실행했다. LLM 답변의 Judge 692건도 모두 완료했다. [전체 결과](try2/results/all_summary.md)와 try1 스모크 결과는 별도로 둔다.

완료: 두 모드 119건씩 생성, trace 누락 0건. Judge sub 119건·slot 118건 완료. slot MT-017의 CHAT-021 1건은 실행 오류로 보존했다. 최종 결과는 [all_summary.md](try1/results/all_summary.md)에 있다. 평가용 백엔드는 원래 sub 모드로 복원했다.

## 범위

- 기존에 중단된 `try1`을 2026-10-23에 재개한다. 최초 시도는 로그인 HTTP 500으로 답변 생성 전에 멈췄으며, 재개 시 로그인 HTTP 200을 확인했다.
- 대상은 저장된 sub run의 `run_info.json.selection.ids` 119건이다. `pipeline_test_v1/cases/smoke_next_ids.txt`와 같은 집합이며, 전체 390건이 아닌 표적 스모크다.
- `sub`: 공통 answer와 하위 `statuses[]`를 받아 코드가 최종 status와 안내를 조합한다.
- `slot`: 하위 질문마다 `{answer, status}` 칸을 받고 **ANSWER인 칸의 answer만** 사용자 본문에 남긴다. 칸별 원본은 trace의 `answer_llm.slots`에 보존한다. 코드 안내는 별도로 붙는다.
- 기존 백엔드 작업 내용을 그대로 실행한다. 이번 재개 작업에서는 백엔드 소스·프롬프트를 수정하지 않는다.

## 실행 환경과 증거

- 백엔드: `C:/Ureka/ureca_project2/BackEnd_eval`, `test/pipeline-eval`, 커밋 `498537256462e1153122d13ce6f03b34cc49525d` + 기존 미커밋 변경.
- HTTP: `http://localhost:8081`, `local,eval`, Redis DB 1. 원래 실행 중인 모드는 sub였다.
- 모델: `qwen3:4b-instruct-2507-q4_K_M`, digest `0edcdef34593eac1aa2be9c7d06c432dcf81945adca5eca2f27662c18f168ba0`; 임베딩 `bge-m3:567m`.
- 두 안은 같은 119건을 순차 실행한다. 최초 저장된 데이터셋·sub 프롬프트·slot 프롬프트·하위 질문 프롬프트 해시가 재개 시 파일과 일치함을 확인했다.
- 실행 프롬프트 사본: `prompts/faq-system.sub.txt`, `prompts/faq-system.slot.txt`.
- sub run: `local-win_qwen3-4b-instruct_t0_pv4_sub_n119_20261023`.
- slot run: `local-win_qwen3-4b-instruct_t0_pv4_slot_n119_20261023`.
- Judge: `pv4-try1`, 기존 `pipeline-judge-2`, Codex `gpt-6-sol`, reasoning medium. 사용자에게 노출되는 모델 본문을 평가하고, 버린 칸은 정답·환각 평가 대상에 넣지 않는다.

## 확인 항목

1. 119건씩 결과가 있고 trace가 빠지지 않았는지 확인한다. 실행 오류는 평가 결과로 보존한다.
2. 정답·환각·누락을 Judge로 확인하고, 같은 케이스에서 sub와 slot을 짝 비교한다.
3. 모델 고지·되묻기, 코드 안내, 빈 본문, 하위 status 정합을 각각 센다.
4. slot 원본에서 ANSWER 칸에 남은 고지와 비ANSWER 칸에서 제거된 본문을 구분한다. 고지가 줄었다는 이유만으로 정답이 개선됐다고 해석하지 않는다.
5. 검색·질문 재작성·멀티턴의 실제 입력 차이가 있으면 결과 해석에 남긴다.

## 공통 실행 명령

119개 ID는 sub의 `run_info.json.selection.ids`를 쉼표로 합쳐 `--ids`에 전달한다. 백엔드는 각 run의 mode와 일치시킨다.

```powershell
node scripts/run/run_pipeline_http.js --test pipeline_test_v4 --try try1 --run-id <run_id> --mode <sub|slot> --ids <119개_ID> --backend-dir C:/Ureka/ureca_project2/BackEnd_eval
node scripts/judge/judge_pipeline.js --test pipeline_test_v4 --try try1 --batch pv4-try1 --runs <sub_run>,<slot_run> --concurrency 4 --confirm-external
node scripts/score/score_pipeline.js --test pipeline_test_v4 --try try1 --runs <sub_run>,<slot_run> --judge-batch pv4-try1
```

실행 중 끊기면 같은 run ID로 재개한다. 러너는 저장된 응답을, Judge는 입력 해시가 같은 성공 판정을 건너뛴다. 최종 결과와 제한은 `try1/results/all_summary.md`에 기록한다.
