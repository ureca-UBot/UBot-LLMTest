# pipeline_test_v3 — 2단계: 매장 도구 메시지 · UNAVAILABLE_NOTICE (백엔드 코드)

계획은 [pipeline_test_v1/NEXT_TRY.md](../pipeline_test_v1/NEXT_TRY.md) 2단계다. 1단계(n1 프롬프트) 위에 백엔드 코드 변경을 얹어, 프롬프트 밖 문자열이 시키던 되묻기·고지가 없어지는지 본다. 결과는 [try1/results/all_summary.md](try1/results/all_summary.md).

## 범위

- 대상: 168건 `pipeline_test_v1/cases/smoke_v3_ids.txt` = ST 30 + UD 30 + 사용자 정보 섹션이 붙은 MP·OS 27 + 1단계 스모크 119(겹침 제외). 케이스셋·FAQ 스냅숏은 v1 `pipeline_test_v1/cases/`를 같이 쓴다.
- 기준선 `subn1`: 1단계 n1 프롬프트(sha `64b66087`), 백엔드 코드는 그대로.
- 새 안 `subs2`: n1 프롬프트 + 2단계 코드. BackEnd `test/pipeline-eval` 커밋 `4985372`("파이프라인 평가용 로컬 변경 (push 금지)")에 포함.

## 2단계 코드 변경

| 위치 | 변경 |
|---|---|
| `StoreTools` | sub·subp 모드에서 실패 메시지 4개를 "매장을 묻는 하위 질문은 ABSTAIN으로 두세요. 위치를 알려 달라는 안내는 시스템이 따로 붙이므로 answer에 쓰지 않습니다"로(NEXT_TRY 2-1 표). single은 기존 메시지 |
| `StoreSearchRecorder` | 실패 사유 `NO_LOCATION` · `PLACE_NOT_FOUND`(장소명) · `LOOKUP_FAILED` 기록. 질문에 없는 장소는 `NO_LOCATION`, 다음 호출이 성공하면 지움 |
| `SubQuestionStatuses.notice` | 매장 칸이 ABSTAIN이고 실패 사유가 있으면 사유별 고정 문구. trace에 `store_failure` |
| `UserIntentHandler.UNAVAILABLE_NOTICE` | "요금, 데이터 사용량, 미납 정보는 제공되지 않습니다." → "다음 항목은 조회 결과에 없음: 요금, 데이터 사용량, 미납 정보" |
| 테스트 | `SubQuestionStatusesTest` · `StoreToolsTest` 추가, 관련 4개 클래스 통과 |

develop의 `AiOutputGuardService.MISSING_LOOKUP_DATA` 패턴과 `AiOutputGuardServiceTest` 2523행은 이 브랜치에 없어 손대지 않았다. develop에 반영할 때 같이 고쳐야 한다(NEXT_TRY 2-2).

## 실행 환경

v2와 같은 세션·환경(2026-10-21). 컨테이너 Ollama 0.34.0, `qwen3:4b-instruct-2507-q4_K_M`(`0edcdef34593`), 포트 8081 · Redis DB 1, 순차 1건. 두 run 모두 trace 누락 0.

- run: `local-win_qwen3-4b-instruct_t0_pv3_subn1_n168_20261021` · `local-win_qwen3-4b-instruct_t0_pv3_subs2_n168_20261021`
- **LLM Judge는 하지 않았다.** 결정론 결과로 판단이 끝났다(all_summary 0절).

## 명령

```powershell
node scripts/run/run_pipeline_http.js --test pipeline_test_v3 --try try1 --run-id <run_id> --mode sub --ids <smoke_v3_ids.txt의 168개 ID를 쉼표로>
node scripts/score/score_pipeline.js --test pipeline_test_v3 --try try1 --runs <subn1_run>,<subs2_run>
```

Judge가 필요하면: `node scripts/judge/judge_pipeline.js --test pipeline_test_v3 --try try1 --batch pv3-try1 --runs <두 run> --confirm-external`.
