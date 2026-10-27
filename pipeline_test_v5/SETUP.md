# pipeline_test_v5 — 로컬 BE feat/277 전체 파이프라인 평가

- 대상: `C:/Ureka/ureca_project2/BackEnd`, `feat/277-sub-answer@012ad604997c6286ea7c17261a39045e4af8ac31` + 2026-10-23 14:03 KST 현재 미커밋 소스.
- 실행 사본: `../build/feat277-eval-20261023/backend`. 원본 BE는 실행·빌드·로그 기록에 사용하지 않으며, 완료 뒤 `docs`의 결과 MD 한 파일만 추가한다.
- 데이터: pipeline_test_v4와 같은 `pipeline_test_v1/cases/cases.jsonl` 390건. FAQ 원문 1,688건도 DB 복제 후 v4 스냅숏과 전부 일치함을 확인했다.
- DB: 기존 `ubot`의 독립 복제 `ubot_feat277_eval_20261023`, 이 사본에 현재 브랜치 마이그레이션을 적용했다. Redis DB 14, HTTP 8082.
- 모델: qwen3:4b-instruct-2507-q4_K_M, temperature 0. 모델·bge-m3 임베딩 digest는 v4와 동일하다.
- 입력 가드·하위 질문 가드·검색·intent별 자료 수집·실제 도구·출력 가드·코드 고지·미응답 수집·최종 저장을 모두 현재 브랜치 흐름으로 실행한다. 관측용 trace만 외부 사본에 추가했다.
- 관측: 실제 문장 필터 후 FAQ 원문, 도구의 실제 반환 문자열, 가드 전 출력, 칸별 가드 결과/사유, 가드 후 본문·코드 고지를 구분한다. Judge는 가드 후 사용자 답변을 평가한다.
- 생성 동시성 1. Judge는 pipeline-judge-2 / Codex gpt-6-sol / medium / 동시성 4. 새 결과만 전수 판정하며 기존 버전 답변·판정은 재사용하지 않는다.
- 관련 회귀 테스트: 11개 클래스 2,334건 통과. 기본 95건에 입력 가드·프롬프트 조작 검사·하위 질문 가드·출력 가드·사용자 정보 가드·미응답 연결 검증을 포함한다. 상세 XML은 외부 실행 사본의 `build/test-results/test/`에 있다.
- 평가 run: `local-win_qwen3-4b-instruct_t0_pv5_feat277_n390_20261023`; Judge batch `pv5-feat277-try1`.
- 원본 응답·trace·Judge·로그·채점은 `try1/results/`. 실행 사본·원본 소스 해시·DB 덤프는 `../build/feat277-eval-20261023/`.

```powershell
node scripts/run/run_pipeline_http.js --test pipeline_test_v5 --try try1 --run-id local-win_qwen3-4b-instruct_t0_pv5_feat277_n390_20261023 --mode slot --base-url http://localhost:8082 --backend-dir build/feat277-eval-20261023/backend --trace pipeline_test_v5/try1/results/runtime/trace_slot.jsonl
node scripts/judge/judge_pipeline.js --test pipeline_test_v5 --try try1 --batch pv5-feat277-try1 --runs local-win_qwen3-4b-instruct_t0_pv5_feat277_n390_20261023 --concurrency 4 --confirm-external
node scripts/score/score_pipeline.js --test pipeline_test_v5 --try try1 --runs local-win_qwen3-4b-instruct_t0_pv5_feat277_n390_20261023 --judge-batch pv5-feat277-try1
```

완료(2026-10-23 14:46 KST). 전체 390건 = 답변 356건 + 검색 보류 33건 + 하위 질문 수 제한 CHAT-021 1건. 판정 가능한 답변 356건을 전수 Judge했고, 빈 모델 본문 116건도 포함했다. 정답 254/356(71.35%), 실질적 환각 46/356(12.92%). 결과는 `try1/results/all_summary.md`에 있다.

입력 가드 390문항, 하위 질문 가드 214문항, 출력 가드 261문항·319칸이 실행됐다. 33문항의 34칸이 가드로 ABSTAIN이 됐다. 최종 HTTP 답변·가드 후 답변·DB 저장 답변 356건이 전부 일치하며, DB 최종 작업 상태도 390건 일치한다. 미응답 227건의 DB 저장과 outbox 잔여 0건을 확인했다.

원본 BE는 실행 중 `f7e6f50ca03081777dbabab100493f9f887d383e`으로 커밋됐다. 고정한 소스 987개를 비교한 결과 22개는 줄바꿈만 변경됐고, 내용 차이는 프롬프트 README뿐이라 실행 코드·프롬프트는 이 커밋과 같다. 관측 훅 역변환·소스 해시 검증도 완료했다. Judge의 외부 연결 403은 성공 판정을 보존하고 미판정 건만 재개해 복구했다.

최종 검증과 보고서 생성은 외부 작업 폴더의 `verify-db.js`, `verify-source-text.js`, `finalize-report.js`로 수행했다. 원본 BE에는 `docs/pipeline-test-feat277-20261023.md` 한 파일만 추가한다.
