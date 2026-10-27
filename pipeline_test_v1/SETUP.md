# pipeline_test_v1 — 백엔드 파이프라인 전체 테스트 · 하위 질문별 status 비교 · 인계 문서

> **다른 세션에서 결과를 정리할 때 이 문서부터 읽는다.** 생성·채점·Judge는 2026-10-20에 끝났다(5절 실행 기록). 결과 정리는 2026-10-21에 [try1/results/all_summary.md](try1/results/all_summary.md)로 마쳤다(2026-10-27 interim_summary를 all_summary로 통합).

prompts_test_v1~v9는 답변 LLM 하나에 고정 Context를 넣어 쟀다. 이 테스트는 **백엔드 레포의 실제 파이프라인**을 HTTP로 그대로 거친다. 파이프라인은 판정 LLM 하위 질문 분리 → 가드 → 임베딩 검색·문장 필터 → intent별 자료(FAQ·사용자 정보·매장 도구) → 답변 LLM 순서다. 같은 케이스셋 390건을 두 방식으로 돌려 비교한다.

| 안 (status_mode) | 시스템 프롬프트 | 모델 출력 | 최종 status | 답하지 못한 부분의 안내 |
|---|---|---|---|---|
| **single** (기준, 현재 운영) | `faq-system.txt` | `{answer, evidence_ids, status}` · status 5종(PARTIAL 포함) | 모델이 낸 값 | 모델이 answer에 직접 씀 |
| **sub** (새 안) | `faq-system-sub.txt` | `{answer, evidence_ids, statuses[]}` · 하위 질문마다 4종(PARTIAL 없음) · 개수는 스키마 `minItems=maxItems=N` | **코드가 조합**(아래 표) | **모델은 쓰지 않음**. 코드가 고정 문구를 붙임 |

sub 안의 최종 status 조합 규칙(`SubQuestionStatuses.combine`, 케이스셋 빌드 스크립트와 같음):

| 하위 status | 최종 |
|---|---|
| 모두 ANSWER | ANSWER |
| ANSWER 1개 이상 + 나머지 | PARTIAL |
| ANSWER 없음, 모두 같은 값 | 그 값 |
| ANSWER 없음, 섞임 | CONFLICT > ABSTAIN > OUT_OF_SCOPE |

- **N(하위 질문 수):** 답변 프롬프트에 "## 하위 질문 N" 제목으로 나눠 넣은 경우(하위 질문 2개 이상이고 원문 조각 `userText`가 모두 있을 때)만 하위 질문 수다. 그 밖에는 1이다(`PromptService.statusSlots`).
- **코드 안내 문구:** `SubQuestionStatuses.notice`가 만든다. 하위 질문이 1개면 "문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다." 같은 문장이고, 여러 개면 "「원문 조각」에 대해서는 …" 형식으로 status별로 묶는다. 이 문구는 사용자 답변 뒤에 붙고, trace에는 `answer_llm.code_notice`로 따로 남는다.
- **statuses가 맞지 않을 때:** 개수가 틀리거나 목록에 없는 값이 섞이면 최종 status를 정하지 않는다(null). 이때는 안내도 붙이지 않고 모델 answer만 쓴다. 최종 답변이 비면 LLM-005로 실패한다.
- **sub 프롬프트에서 바꾼 것(single 대비):** 아래 다섯 가지 말고는 같다. 예시 문항은 넣지 않았다.
  1. 충돌·범위 밖을 "알린다"는 문장을 지웠다.
  2. answer 작성 방식을 "ANSWER인 하위 질문만 쓰고 나머지는 다루지 않음, 되묻지 않음, 없으면 빈 문자열"로 바꿨다.
  3. status 정의를 하위 질문 단위로 바꾸고 PARTIAL을 뺐다.
  4. 주의 1·3·4의 PARTIAL 문장을 지웠다.
  5. 출력 순서를 evidence_ids → statuses → answer로 바꿨다.
- 두 프롬프트 사본은 `pipeline_test_v1/prompts/`에 있다.

## 1. 지표 (채점 스크립트 `scripts/score/score_pipeline.js`가 계산하는 그대로)

| 지표 | 정의 | 필드(`case_scores.jsonl` / `summary.json`) |
|---|---|---|
| 경로 | `LLM`(답변 LLM까지 감) · `CHAT-012/013`(검색 단계에서 근거 없음 → 시스템 보류) · `CHAT-021`(하위 질문 4개 이상) · `LLM-005` 등 실행 오류 | `path`, `summary.paths` |
| 실행 오류 | LLM까지 못 갔고 CHAT-012/013도 아닌 것(LLM-005, CHAT-021, 타임아웃, HTTP 오류) | `exec_error` |
| 최종 status 일치 | 기대 최종 status와 실제 최종 status 비교. 실제 값은 single이면 모델 `status`, sub이면 코드 조합 `combined_status`. CHAT-012/013은 `SYSTEM_ABSTAIN`이고 기대 ABSTAIN과 같다고 본다. 기대 `path=ANY`(범위 밖 단독)는 SYSTEM_ABSTAIN이나 OUT_OF_SCOPE면 일치. `status_match_strict`는 엄격 라벨 기준, `status_match_llm_only`는 SYSTEM_ABSTAIN을 일치로 보지 않는 기준 | `status_match*`, `summary.status.confusion` |
| 하위 status 일치 (sub만) | 모델 `statuses` 개수가 기대 하위 질문 수와 같은 케이스에서 자리별 비교 | `sub_status`, `summary.sub_status.pair_match_rate` |
| 검색 적중 | 기대 하위 질문(근거 FAQ가 있는 것)마다, 근거 FAQ가 실제 검색에서 통과(`passed_faq_ids`, 원문 먼저 검색 포함)했으면 HIT. 실패했는데 원문 조각으로 다시 검색한 shadow에서는 나오면 QUERY_VARIANT_MISS(판정 LLM 검색어 탓), 둘 다 없으면 RETRIEVAL_MISS. 사용자 정보·매장 FAQ는 프롬프트에 FAQ로 들어가지 않으므로 `prompt_faq_ids`가 아니라 통과 목록 기준 | `retrieval[]`, `summary.retrieval` |
| 누출 | **모델 본문**(sub은 코드 안내를 붙이기 전)에 답하지 못한다는 안내 문장(NOTICE 패턴)이나 되묻기(물음표로 끝남·"알려 주시면" 등)가 있는 비율. 근거 FAQ 원문에 같은 표현이 있으면 FAQ 인용으로 빼서 `faq_quotes`에 둔다. "고객센터로 문의" 류는 `refer`로 따로 센다. 분모는 LLM 경로 케이스. Judge의 `decline_notice`·`asks_user`도 보조 지표로 함께 집계 | `leak`, `summary.leak` |
| 빈 answer | 기대 ABSTAIN·OUT_OF_SCOPE인 LLM 경로 케이스에서 모델 answer가 빈 문자열인 수(sub 안의 의도된 동작) | `summary.empty_answer_when_expected_decline` |
| 정답 (Judge) | 기대 하위 질문마다 CORRECT_ANSWER / WRONG_ANSWER / MISSING_ANSWER / CORRECT_DECLINE / UNSUPPORTED_ANSWER. 모두 CORRECT_*이면 케이스 CORRECT. 정답 기준은 근거 FAQ 원문. LLM 경로 케이스만 판정 | `judge.accuracy`, `judge.sub_outcomes` |
| 환각 (Judge) | 챗봇이 실제로 받은 자료(프롬프트 FAQ·사용자 정보·매장 도구 결과)와 대조. grounding_score 1~5, 4 이상이면 is_grounded. 이탈 종류 5가지(v4 루브릭과 같음) | `judge.is_grounded`, `claim_types` |
| 질문 재작성 (Judge) | 판정 LLM 검색어가 사용자 질문의 뜻을 지켰는지: FAITHFUL / CHANGED / NOT_APPLICABLE(판정 LLM 미호출) | `judge.query_rewrite` |
| 통과 · 실패 원인 | 통과 = 실행 오류 없음 + 최종 status 일치 + (Judge가 있으면) CORRECT. 실패한 케이스에는 원인 하나를 앞 단계부터 매긴다: EXEC_ERROR → QUERY_VARIANT_MISS → RETRIEVAL_MISS(기대 ANSWER 하위 질문의 근거를 못 찾음) → STATUS_MISMATCH → ANSWER_INCORRECT | `passed`, `failure_cause` |

`summary.json`은 `overall`과 유형별 `by_type`(SA·SB·…)로 같은 구조를 낸다.

## 2. 케이스셋 (`cases/`)

`test_set4r`는 고정 Context 문항이라 쓰지 않고, 현재 백엔드 FAQ DB(1,688건)로 답할 수 있는지를 기준으로 새로 만들었다(390건). 정답 예시는 두지 않고 **근거 FAQ 원문을 Judge 기준**으로 쓴다.

| 유형 | 건수 | 내용 | 주로 보는 것 |
|---|---|---|---|
| SA | 50 | 단일 · FAQ로 답할 수 있음 | 기준선, 군더더기 고지 |
| SB | 50 | 단일 · 주제 FAQ는 검색되지만 묻는 값이 없음 | 고지 누출, 지어내기 |
| UD | 30 | 사용자 정보(USER_DATA): 가입일·지역 계산(ANSWER) / 요금·사용량(ABSTAIN) / 섞임 | "제공되지 않습니다" 누출 |
| MA | 40 | 복합 · 모두 답할 수 있음 | 하위 질문 빠뜨림 |
| MP | 60 | 복합 · 답할 수 있음 + 없음(최종 PARTIAL) | 하위 status 판정, 고지 누출 |
| MN | 20 | 복합 · 모두 답할 수 없음 | 빈 answer |
| OS | 30 | 범위 밖 단독(15) · 범위 밖 + 정상(12) · 범위 밖 + 답 못 함(3) | "범위 밖" 누출 |
| IN | 20 | 하위 질문 하나 안에 답할 수 있는 부분과 없는 부분(분리 표지 없음) | PARTIAL 삭제 부작용 |
| CQ | 30 | 모호해서 되묻기 쉬운 질문 | 되묻기 누출 |
| MT | 30 | 멀티턴(이전 질문을 같은 대화에서 먼저 실행) | 질문 변형, 맥락 |
| ST | 30 | 매장(좌표 · 장소명 · 장소 없음 · 도구에 없는 속성) | 도구 경로, 위치 되묻기 |

- 기대 최종 status: ANSWER 184 · ABSTAIN 104 · PARTIAL 87 · OUT_OF_SCOPE 15. 엄격 라벨(IN·일부 ST·UD-001)로는 ANSWER 160 · ABSTAIN 128.
- 범위 밖 단독 15건은 `path = ANY` — 검색 단계 실패(CHAT-012/013)도 정답.
- 회원 계정 하나로 실행하고 케이스마다 새 대화를 연다. 좌표는 `dataset_manifest.json`의 `locations`.

파일:

- `parts/<유형>.jsonl` — 손으로 쓴 원본(짧은 키). 고칠 때는 여기만 고친다
- `faq_snapshot.csv` — 만든 시점의 백엔드 시드 CSV 사본
- `cases.jsonl` · `dataset_manifest.json` — `node scripts/run/build_pipeline_cases.js [--faq <시드 CSV>]`로 생성. 근거 FAQ ID 존재, 하위 질문 조각이 원문에 있는지 검사하고 최종 status를 조합 규칙으로 계산한다

알고 있는 자연 충돌·주의(케이스 `note`에 적어 둠): 매장 FAQ 기본 영업시간(평일 10~20시)과 매장 데이터(예: 09:00-18:00) 불일치, 약정 중 요금제 변경(106·1145 vs 1688), 통화 연결음 요금(274의 1,100원 vs 1329·1330 컬러링 990원 — 케이스에서는 피함), 334·1688처럼 FAQ 원문에 "확인할 수 없습니다"가 들어 있어 누출 패턴에 걸릴 수 있는 문장, 매장 도구가 위치를 되묻게 지시하는 문구(ST-013~016·027·028).

## 3. 파일 위치

```
LLM_Test/ (브랜치 test6/pipeline)
├── pipeline_test_v1/
│   ├── SETUP.md                              # 이 문서
│   ├── cases/                                # 2절 케이스셋
│   ├── prompts/                              # 실행에 쓴 백엔드 프롬프트 사본(faq-system.single.txt · faq-system.sub.txt · faq-user.txt)
│   ├── smoke/                                # 스모크 실행(참고용, 결과 정리에 쓰지 않음)
│   └── try1/
│       ├── run_single.log · run_sub.log · judge_single.log · judge_sub.log   # 실행 로그(.gitignore *.log라 커밋 안 됨)
│       └── results/
│           ├── raw/<run_id>/
│           │   ├── run_info.json             # 모드·백엔드 브랜치/커밋/dirty·프롬프트 SHA·케이스셋 SHA·계정·시각
│           │   ├── responses.jsonl           # 케이스당 1줄: API 응답(이전 턴 포함)
│           │   ├── trace.jsonl               # 이 run의 백엔드 trace(4절)
│           │   └── results.jsonl             # 케이스 + 기대값 + 응답(response) + trace + turn_traces — 모든 분석의 입력
│           ├── raw/scored/<run_id>/
│           │   ├── case_scores.jsonl         # 케이스별 채점(1절 필드)
│           │   └── summary.json              # overall + by_type
│           └── llm_judge/pv1-try1/
│               ├── manifest.json             # 루브릭 SHA·Judge 설정
│               ├── <run_id>.judgments.jsonl  # 케이스별 판정(error 줄은 재시도 기록 — error=null인 줄만 쓴다)
│               └── runs/calls/pipeline_accuracy.calls.jsonl   # Codex 호출 로그
├── prompts/judge/pipeline_accuracy.md        # Judge 루브릭(+ common_guard.md)
└── scripts/
    ├── run/build_pipeline_cases.js           # 케이스셋 빌드·검사
    ├── run/run_pipeline_http.js              # HTTP 러너
    ├── judge/judge_pipeline.js               # Judge(Codex, gpt-6-sol, medium — model_test_v5와 같음)
    └── score/score_pipeline.js               # 채점

BackEnd/ (브랜치 test/pipeline-eval, feat/205-multiturn b492470에서 분기, 커밋 안 함)
├── src/main/java/com/ubot/eval/EvalTrace.java · EvalTraceWriter.java     # eval 프로필 전용 trace
├── src/main/java/com/ubot/ai/service/SubQuestionStatuses.java            # sub 안: 최종 status 조합·안내 문구
├── src/main/resources/application-eval.yml                               # 캐시 끔·trace 켬·status-mode
├── src/main/resources/prompts/faq-system-sub.txt                         # sub 안 시스템 프롬프트
├── tools/eval/start-eval-backend.ps1                                     # 평가용 백엔드 실행
└── (수정) AiService · PromptService · FaqAnswerFormat · ChatAnswerProcessor · ChatJobProcessor · SubQuestionPlanner · StoreTools
```

## 4. 백엔드 trace (`results.jsonl`의 `trace`)

```json
{
  "attempt_id": 123, "idempotency_key": "…", "conversation_id": 45, "question": "사용자 원문", "location": null,
  "planner": { "history_turns": 0, "split_marks": ["나열어"], "multi_turn_marks": [], "search_first": false,
               "judge_called": true, "judge_raw": "…", "judge_queries": ["검색어1", "검색어2"],
               "guard_outcome": "…", "guard_reasons": "[…]", "guard_fallback": false, "multi_turn": false,
               "source": "LLM", "sub_question_count": 2 },
  "search_first": { "candidates": [{"id": "105", "score": 0.81, "intent": "GENERAL"}], "threshold": 0.75,
                    "passed_faq_ids": ["105"], "reason": null },
  "sub_questions": [ { "index": 1, "search_query": "…", "user_text": "원문 조각", "retrieval_source": "search",
                       "candidates": [...], "passed_faq_ids": ["1404"], "reason": null,
                       "shadow": { "query": "원문 조각", "candidates": [...], "passed_faq_ids": ["1404"] } } ],
  "store_tool_calls": [ { "place": "강남역", "result": "도구가 돌려준 매장 목록 문자열" } ],
  "answer_llm": { "prompt_faq_ids": ["1404"], "prompt_sub_questions": [{"user_text": "…", "faq_ids": ["1404"]}],
                  "sections": [{"title": "사용자 정보", "content": "…"}], "tools": ["STORE_SEARCH"], "history_turns": 0,
                  "raw": "답변 LLM 원본 JSON", "status": "PARTIAL", "statuses": null, "evidence_ids": ["1404"],
                  "answer": "모델 본문",
                  "status_slots": 2, "statuses_valid": true, "combined_status": "PARTIAL", "code_notice": "…",
                  "answer_missing_for_answer_status": false,
                  "location_required": false, "store_tool_called": false },
  "outcome": { "answered": true, "error_code": null, "answer": "사용자에게 나간 답변" },
  "elapsed_ms": 8123
}
```

- `status_slots`·`statuses_valid`·`combined_status`·`code_notice`·`answer_missing_for_answer_status`는 sub 모드에만 있다. single은 `statuses`가 null이다.
- `search_first`는 판정 표지가 없어 원문으로 먼저 검색한 경우에만 있다. `retrieval_source`는 `search`(새 검색), `search_first`(원문 먼저 검색 결과 사용), `failed_search_first`(실패한 원문 검색 재사용) 중 하나다.
- `shadow`는 판정 LLM 검색어가 원문 조각과 다를 때만 있다. 원문 조각으로 같은 검색과 문장 필터를 한 번 더 한 결과이며, 답변에는 쓰지 않는다.
- 검색 단계에서 끝나면(CHAT-012/013) `answer_llm`이 없다.
- MT 케이스의 이전 턴 trace는 `turn_traces`에 있다.

## 5. 실행 기록 (2026-10-20, 이 PC)

| 항목 | 값 |
|---|---|
| 모델 | Ollama `qwen3:4b-instruct-2507-q4_K_M`(digest 0edcdef34593), 임베딩 `bge-m3:567m`, RTX 4060 Ti, 동시 1건(순차) |
| 백엔드 | `test/pipeline-eval`(feat/205-multiturn b492470 + 미커밋 변경), `SPRING_PROFILES_ACTIVE=local,eval`, 포트 8081, Redis DB 1. 같은 PC의 개발용 백엔드(IntelliJ, 8080, Redis DB 0)는 그대로 둔 채 실행했다 |
| 설정 | 리랭커 꺼짐, FAQ 캐시 꺼짐, CHAT_TOP_K·임계값은 `.env` 기본(손대지 않음) |
| 계정 | `eval-runner@ubot.test`, 이름 평가회원, 거주 지역 서울특별시 마포구, 가입일 2026-10-20(UD 케이스 정답 기준) |
| single run | `local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020` — 390건, trace 누락 0, CHAT-013 37 · CHAT-021 1 |
| sub run | `local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020` — 390건, trace 누락 0, CHAT-013 38 · LLM-005 10 |
| Judge 배치 | `pv1-try1` — Codex `gpt-6-sol` medium, 동시 4. single 352건(LLM 경로 전부), sub 342건(LLM 경로 전부) |
| 채점 | 두 run 모두 `--judge-batch pv1-try1`로 채점함 → `raw/scored/<run_id>/summary.json` |
| subp run (2026-10-21 추가) | `local-win_qwen3-4b-instruct_t0_pv1_subp_n390_20261021` — sub + 하위 질문 PARTIAL 허용(`-Mode subp`, `faq-system-subp.txt`). 390건, trace 누락 0, CHAT-013 38 · LLM-005 5. 같은 환경(컨테이너 Ollama 0.34.0). Judge `pv1-try1`에 347건 추가. 채점에 `status_match_partial`(부분 답변 라벨) 추가 — 결과는 정리 문서 4절 |

참고 수치(채점 스크립트 첫 줄 출력, 해석은 하지 않음): 아래 표의 수치는 `summary.json`이 기준이다.

| 안 | status 일치 | status 일치(엄격) | 누출(패턴) | 검색 적중 | Judge 정답 | 환각 | 통과 |
|---|---|---|---|---|---|---|---|
| single | 70.26% | 72.31% | 50.85% (179/352) | 80.96% | 78.69% (277/352) | 12.22% | 64.1% |
| sub | 77.69% | 81.28% | 19.3% (66/342) | 81.35% | 75.15% (257/342) | 9.06% | 71.54% |

## 6. 다시 돌리는 방법

1. 컨테이너(Postgres·Redis·Ollama)를 켜고 FAQ 임베딩이 있는지 확인한다.
2. BackEnd에서 `git switch test/pipeline-eval` 후 `.\tools\eval\start-eval-backend.ps1 -Mode single`(또는 `-Mode sub`)을 실행한다. 로그는 `build/eval/bootrun_<mode>.log`, trace는 `build/eval/trace_<mode>.jsonl`이다. 모드를 바꾸면 백엔드를 다시 띄운다.
3. LLM_Test에서 러너를 실행한다(처음 PC면 `--signup`을 붙인다):
   `node scripts/run/run_pipeline_http.js --run-id <id> --mode <single|sub> [--try try1] [--ids …] [--types …]`
   끊기면 같은 명령으로 이어서 돈다. trace만 다시 합치려면 `--merge-only`.
4. Judge: `$env:LLM_JUDGE_CODEX_BIN='<codex.exe 경로>'`(2026-10-20 기준 `C:\Users\pc\AppData\Local\OpenAI\Codex\bin\896a0166b774037a\codex.exe`, 앱 업데이트로 바뀜) 후 다음을 실행한다. 재개를 지원한다.
   `node scripts/judge/judge_pipeline.js --batch <batch> --try try1 --runs <run_id> --concurrency 4 --confirm-external`
5. 채점: `node scripts/score/score_pipeline.js --runs <run_id>[,<run_id>] --try try1 --judge-batch <batch>`
   - try1 최종 채점은 `--judge-batch pv1-try1,pv1-try1-store`다. 뒤 배치(루브릭 `pipeline-judge-2`, 매장 도구 케이스만 `--store-only`로 재판정)가 같은 케이스의 판정을 덮는다.
   - 매장 검색 적중은 정답 FAQ가 STORE_DATA면 아무 STORE_DATA FAQ나 통과해도 HIT로 본다(정리 문서 0절).

## 7. 다음 세션 할 일: 결과 정리

- 입력은 두 run의 `raw/scored/<run_id>/summary.json`·`case_scores.jsonl`이고, 사례를 볼 때는 `raw/<run_id>/results.jsonl`과 `llm_judge/pv1-try1/<run_id>.judgments.jsonl`(error=null인 줄)을 쓴다.
- 비교는 single과 sub를 같은 케이스로 짝지어 한다. 볼 지표는 최종 status 일치(느슨·엄격·LLM만), 누출(패턴과 Judge 보조), Judge 정답, 환각, 실패 원인 분포, 유형별(by_type) 차이다. 사용자가 원래 보려던 것은 누출, status 불일치, PARTIAL 삭제의 영향(IN 유형, `status_match_strict`)이다.
- 파이프라인 단계(검색, 판정 LLM 질문 변형)는 두 안이 같다. 그래서 검색 적중·QUERY_VARIANT_MISS 차이는 노이즈다(LLM 생성이 섞이는 MT 이전 턴 정도만 다를 수 있음).
- 결과 문서는 `pipeline_test_v1/try1/results/all_summary.md`로 쓰고, LLM_Test `CLAUDE.md`의 현재 상태에 한 단락을 추가한다(기존 테스트들과 같은 방식).

## 8. 알려진 주의점 (결과를 해석할 때 반드시 반영)

1. **sub 안의 매장 도구 경로:** 도구가 붙은 요청(STORE_DATA FAQ가 검색된 경우)에서는 Ollama가 출력 스키마를 강제하지 않는 것으로 보인다. sub LLM 경로 352건 중 도구 경로가 32건이고, 그중 15건이 `statuses: []` 같은 잘못된 statuses(`statuses_valid=false`)였다.
   - 10건(MT-028, ST-004·008·009·010·011·012·017·020·029)은 answer도 비어 LLM-005로 실패했다.
   - 5건은 최종 status 없이 모델 본문만 나갔다.
   - 도구가 없는 요청에서 잘못된 statuses는 0건이다. ST 유형 비교에는 이 영향이 섞여 있다.
2. **status는 맞았는데 answer가 빈 경우:** sub에서 statuses에 ANSWER가 있는데 answer가 빈 경우가 1건 있다(`answer_missing_for_answer_status`).
3. **코드 안내 문구의 어색함:** 원문 조각을 그대로 쓰므로 "「그리고 이번 달 데이터는 얼마나 썼어요」에 대해서는 …"처럼 접속어가 들어갈 수 있다. 문구 품질은 채점 대상이 아니고, Judge에는 시스템 고정 안내라고 알려 평가에서 뺐다.
4. **누출 패턴의 한계:** single은 설계상 모델이 고지 문장을 쓰므로 누출률이 높게 나오는 것이 정상이다. 비교의 핵심은 sub에서 얼마나 줄었는지다. 패턴은 정규식이라 오탐·미탐이 있으므로 Judge의 `decline_notice`·`asks_user`와 함께 본다. FAQ 원문에 "확인할 수 없습니다"가 들어 있는 경우(334·1688 등)는 `faq_quotes`로 뺐다.
5. **CHAT-013의 처리:** 검색 단계에서 근거를 못 찾은 경우는 SYSTEM_ABSTAIN으로 기대 ABSTAIN과 같다고 본다. 범위 밖 단독은 `path=ANY`다. LLM 경로만 보려면 `status_match_llm_only`를 쓴다.
6. **로컬 DB에 남은 기록:** 평가 중 미답변 질문·질문 로그가 로컬 DB에 쌓였다(평가 계정 user). 운영 데이터와는 무관하다.
7. **케이스셋 라벨:** 라벨은 Claude가 작성했고 사람 검수 전이다. 자연 충돌(2절 끝)이 있는 케이스는 라벨이 애매할 수 있다.
8. **IN 유형:** 기본 라벨은 느슨(ANSWER)이고, 엄격 라벨(ABSTAIN)은 `status_match_strict`로 본다.
