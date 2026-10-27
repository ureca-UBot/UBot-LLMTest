# pipeline_test_v1 — 다음 시도 계획 (2026-10-21 작성)

sub 모드(하위 질문별 status + 코드 조합·고정 안내)의 남은 누출을 줄이는 시도다. 근거는 [try1 정리](try1/results/interim_summary.md) 3-2절(누출 패턴)이다. **두 단계로 나눠 따로 적용·측정한다.**

| 단계 | 테스트 폴더 | 내용 | 바꾸는 곳 |
|---|---|---|---|
| **1단계** | `pipeline_test_v2/` | (1) 답할 수 없다는 말을 answer에 쓰지 않는다고 명시 + (2) 작성 방식 2에 금지와 이유를 넣음 | 프롬프트만 (`faq-system-sub.txt`) |
| **2단계** | `pipeline_test_v3/` | (3) 매장 도구 실패 메시지에서 되묻기 지시를 빼고 ABSTAIN으로 두게 함, 위치 안내는 코드가 붙임 + (4) `UNAVAILABLE_NOTICE`를 목록 형태로 | 백엔드 코드 (`StoreTools`·`StoreSearchRecorder`·`SubQuestionStatuses`·`UserIntentHandler`) |

비교 기준선은 try1 sub run `local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020`(Judge `pv1-try1,pv1-try1-store`)이다. 1단계 결과를 보고 나서 2단계를 1단계 위에 얹는다.

- 러너·채점·Judge(`run_pipeline_http.js`·`score_pipeline.js`·`judge_pipeline.js`)는 `--test pipeline_test_v2`처럼 결과 폴더를 받는다(기본 `pipeline_test_v1`). 결과는 `<테스트 폴더>/<try>/results/`에 쓴다.
- 케이스셋·FAQ 스냅샷·스모크 목록은 v2·v3도 `pipeline_test_v1/cases/`를 그대로 쓴다(복사하지 않음).

---

## 1단계 — 프롬프트: 고지 문장 금지 + 이유

### 1-1. 바꿀 문장 (`faq-system-sub.txt`의 answer 작성 방식 2번, 한 곳만)

**현재**
```
2. status가 ANSWER가 아닌 하위 질문은 answer에서 다루지 않습니다. 사용자에게 되묻지 않습니다.
```

**변경**
```
2. status가 ANSWER가 아닌 하위 질문은 answer에서 다루지 않습니다. 답할 수 없는 부분이 있다는 말(자료에 없다, 확인할 수 없다 등)도 answer에 쓰지 않습니다. 답할 수 없는 부분은 시스템이 answer 뒤에 따로 안내하기 때문입니다. 사용자에게 되묻지 않습니다.
```

- 완성본: `pipeline_test_v1/prompts/next/faq-system.sub_n1.txt`. sub 프롬프트와 이 한 줄만 다르다.
- 나머지 문장(작성 방식 1·3, status 정의, 주의 1~5, 출력 순서)은 **바꾸지 않는다.** 원인을 이 문장 하나로 가르기 위해서다.
- 노린 것: 섞인 경우(ANSWER + 비ANSWER)의 누출 53/66건.
  - 지금 "다루지 않습니다"만 있으면 모델은 "자료에 없다고 알려 주는 것"을 다루는 것으로 보지 않는다. 금지 대상을 직접 적고 이유(시스템이 따로 안내함)를 붙인다.
- 주의할 점 두 가지:
  - 괄호 안 예시(자료에 없다, 확인할 수 없다)는 따옴표 문장이 아니라 종류 설명이다. prompts_test_v3에서는 따옴표 예시 문장을 모델이 그대로 베낀 적이 있다. 결과에서 "자료에 없다"류가 오히려 늘면 괄호를 빼고 다시 잰다.
  - prompts_test_v9에서는 불가 문장을 "어떻게 쓸지" 지시하자 이중화가 늘었다. 이번 문장은 쓰지 말라는 금지만 있고, 쓸 문장은 제시하지 않는다.

### 1-2. 적용 방법 (BackEnd `test/pipeline-eval`)

1. `src/main/resources/prompts/faq-system-sub.txt`를 `faq-system.sub_n1.txt` 내용으로 바꾼다. 원본 사본은 `pipeline_test_v1/prompts/faq-system.sub.txt`에 있다.
   - 파일 교체 대신 `prompt.faq.sub-system-location`으로 바꿔 끼울 수도 있다. 이때는 환경 변수 대신 `--prompt.faq.sub-system-location=file:...` 인자나 `SPRING_APPLICATION_JSON`으로 넘겨야 확실하다(속성 이름에 `-`가 있어서다).
2. `.\tools\eval\start-eval-backend.ps1 -Mode sub`로 띄운다.
   - 컨테이너 Ollama 0.34.0, 모델 digest `0edcdef34593`, 포트 8081, Redis DB 1인지 확인한다.

### 1-3. 실행 (스모크 → 필요하면 390건)

- 스모크 대상 119건: `pipeline_test_v1/cases/smoke_next_ids.txt`
  - try1 sub의 섞인 케이스 64건
  - 빈 answer 과잉 보류 40건(3-1절)
  - 대조군 15건(SA 10, MA-001·005·010·014·015)
  - 겹치는 케이스는 한 번만 셌다.
- 같은 세션에서 **기준선 sub도 같은 119건으로 다시 돌린다.** 판정 LLM 출력이 run마다 조금씩 달라서다(try1에서 멀티턴이 아닌 케이스 3건이 검색 결과가 달라짐).

```
node scripts/run/run_pipeline_http.js --test pipeline_test_v2 --try try1 --run-id local-win_qwen3-4b-instruct_t0_pv2_sub_n119_<날짜> --mode sub --ids <smoke_next_ids.txt 내용>
# 백엔드 프롬프트를 n1로 바꾸고 다시 띄운 뒤
node scripts/run/run_pipeline_http.js --test pipeline_test_v2 --try try1 --run-id local-win_qwen3-4b-instruct_t0_pv2_subn1_n119_<날짜> --mode sub --ids <같은 목록>
node scripts/score/score_pipeline.js --test pipeline_test_v2 --try try1 --runs <두 run>
```

- `smoke_next_ids.txt`는 쉼표로 이은 한 줄이라 `--ids`에 그대로 넣으면 된다.
- 러너의 `run_info.json`에는 `faq_system_sub_sha256`가 남는다. 파일을 바꿨는지 이 값으로 확인한다.
- 결정론 지표가 좋아지면 Judge(`--test pipeline_test_v2 --try try1 --batch pv2-try1`, 루브릭 `pipeline-judge-2`)까지 돌린다. 스모크가 좋으면 390건으로 넓힌다.

### 1-4. 볼 지표와 판단 기준

| 지표 | try1 sub (전체 기준) | 목표 |
|---|---|---|
| 섞인 케이스 누출 (패턴) | 56 / 65 (패턴 보강 전 53 / 64) | 크게 감소 (예: 20 이하) |
| 이중 고지 (모델 고지 + 코드 안내) | 60 (패턴 보강 전 기준) | 같이 감소 |
| 모두 ANSWER인 케이스 누출 | 5 (대부분 오탐) | 늘지 않음 |
| 기대 ANSWER 하위 질문의 Judge 누락·오답 | — | **늘면 안 됨**. 금지가 답 내용까지 줄이는지 확인 |
| 빈 answer / ABSTAIN 비율 | 120 | 늘지 않음 (status 판정에는 손대지 않았으므로 그대로여야 함) |
| 새로 생기는 형태 | — | "따라서 …" 재진술, 사실 + 고지가 섞인 문장이 남는지 형태별로 다시 셈 (3-2-3절 표 기준) |

- **먼저 할 일 — 완료(2026-10-21):** 채점 누출 패턴이 "제공된 FAQ에서 없습니다" 형태를 놓치던 것을 고쳤다.
  - `NOTICE_PATTERNS`의 `(자료|정보|안내|FAQ)(에|에는|에서는)…`에 `에서`를 넣었다.
  - try1 세 run을 다시 채점했다(같은 Judge 배치). 누출(패턴): single 179 → **195**, sub 66 → **70**, subp 78 → **87**. 새로 잡힌 29건은 모두 실제 고지 문장이다(오탐 0, 예: MP-016 "프리미엄 채널 수에 대한 정보는 제공된 FAQ에서 없습니다").
  - Judge 고지·정답·status는 그대로다. `try1/results/interim_summary.md`의 누출 수치는 보강 전 값이다.

---

## 2단계 — 백엔드: 매장 도구 메시지 + 사용자 정보 고정 문장 (1단계 위에 얹음)

### 2-1. (3) StoreTools 실패 메시지 — 되묻기 지시 제거, ABSTAIN으로 두게 함

**ABSTAIN은 조회가 실패해 답할 수 없을 때만이다.**
- 조회 성공(매장 목록, 0곳 포함)은 지금처럼 ANSWER다.
- ABSTAIN은 매장을 묻는 하위 질문 하나에만 적용한다. 같은 질문의 다른 하위 질문은 평소대로 판정한다.

| 경우 | 현재 메시지 (`StoreTools`) | 변경 메시지 (sub 모드) |
|---|---|---|
| 장소 없음 `NO_LOCATION_MESSAGE` | 사용자가 기준 장소를 말하지 않아 근처 매장을 조회할 수 없습니다. 매장 이름이나 주소를 추측하지 말고, 위치 권한을 허용하거나 지역·역 이름을 알려 달라고 안내하세요. 질문의 다른 부분은 그대로 답하세요. | 사용자가 기준 장소를 말하지 않아 근처 매장을 조회할 수 없습니다. 매장 이름이나 주소를 추측하지 말고, 매장을 묻는 하위 질문은 ABSTAIN으로 두세요. 위치를 알려 달라는 안내는 시스템이 따로 붙이므로 answer에 쓰지 않습니다. 질문의 다른 부분은 그대로 답하세요. |
| 질문에 없는 장소 `PLACE_NOT_IN_QUESTION_MESSAGE` | '%s'은(는) 사용자 질문에 없는 장소입니다. 질문에 쓰인 철자 그대로(오타가 있어도 고치지 말고) place에 넣어 다시 호출하고, 사용자가 장소를 말하지 않았다면 place를 비워 다시 호출하세요. 다시 호출하지 않는다면 매장 이름이나 주소를 추측하지 말고, 기준이 될 지명이나 역 이름을 알려 달라고 안내하세요. | '%s'은(는) 사용자 질문에 없는 장소입니다. 질문에 쓰인 철자 그대로(오타가 있어도 고치지 말고) place에 넣어 다시 호출하고, 사용자가 장소를 말하지 않았다면 place를 비워 다시 호출하세요. 다시 호출하지 않는다면 매장 이름이나 주소를 추측하지 말고, 매장을 묻는 하위 질문은 ABSTAIN으로 두세요. |
| 장소 못 찾음 `PLACE_NOT_FOUND_MESSAGE` | '%s' 위치를 찾지 못했습니다. 매장 이름이나 주소를 추측하지 말고, 정확한 지명이나 역 이름을 다시 알려 달라고 안내하세요. 질문의 다른 부분은 그대로 답하세요. | '%s' 위치를 찾지 못했습니다. 매장 이름이나 주소를 추측하지 말고, 매장을 묻는 하위 질문은 ABSTAIN으로 두세요. 장소를 다시 알려 달라는 안내는 시스템이 따로 붙이므로 answer에 쓰지 않습니다. 질문의 다른 부분은 그대로 답하세요. |
| 조회 오류 `LOOKUP_FAILED_MESSAGE` | 매장 정보를 조회하지 못했습니다. | 매장 정보를 조회하지 못했습니다. 매장 정보를 추측하지 말고, 매장을 묻는 하위 질문은 ABSTAIN으로 두세요. 질문의 다른 부분은 그대로 답하세요. |

- **single 모드는 지금 메시지를 그대로 둔다.** single은 모델이 안내를 직접 쓰는 설계라, 되묻기 지시를 빼면 사용자가 위치를 알려 달라는 말을 듣지 못한다. `StoreTools`가 `PromptService.isSubQuestionStatusMode()`(또는 같은 설정값)를 보고 메시지를 고르게 한다.

**코드 안내 — 실패 사유를 남기고 코드가 붙인다**
- `StoreSearchRecorder`에 실패 사유를 기록한다: `NO_LOCATION` / `PLACE_NOT_FOUND`(장소명 포함) / `LOOKUP_FAILED`.
  - 지금은 장소 없음만 `markLocationRequired()`로 남는다. 프론트로 가는 `locationRequired:true`는 그대로 둔다.
  - `PLACE_NOT_IN_QUESTION`은 재호출 유도라 사유로 남기지 않는다. 재호출 없이 끝나면 장소 없음과 같게 본다.
- `SubQuestionStatuses.notice`: 매장 하위 질문이 ABSTAIN이고 실패 사유가 있으면, 일반 ABSTAIN 문구 대신 아래 문구를 쓴다.
  - 매장 하위 질문 = 그 하위 질문의 FAQ에 STORE_DATA가 있는 칸이다. 하위 질문이 하나면 그 칸이다.

| 사유 | 하위 질문 1개 | 여러 개 (「원문 조각」) |
|---|---|---|
| NO_LOCATION | 매장을 찾을 기준 위치가 없어 조회하지 못했습니다. 위치 권한을 허용하거나 지역·역 이름을 알려 주세요. | 「…」에 대해서는 기준 위치가 없어 매장을 조회하지 못했습니다. 위치 권한을 허용하거나 지역·역 이름을 알려 주세요. |
| PLACE_NOT_FOUND | '장소' 위치를 찾지 못했습니다. 정확한 지명이나 역 이름으로 다시 질문해 주세요. | 「…」에 대해서는 '장소' 위치를 찾지 못했습니다. 정확한 지명이나 역 이름으로 다시 질문해 주세요. |
| LOOKUP_FAILED | 매장 정보를 지금 조회하지 못했습니다. 잠시 후 다시 시도해 주세요. | 「…」에 대해서는 매장 정보를 지금 조회하지 못했습니다. 잠시 후 다시 시도해 주세요. |

- 노린 것:
  - 되묻기 누출: ST-016 "'강남역'이 사용자 질문에 포함되었는지 다시 확인해 주실 수 있나요?", ST-027, MA-019 "…알려주시면…"
  - 도구 지시문을 독백처럼 출력한 것: MP-044 "…기준이 될 지명이나 역 이름을 알려 달라고 안내해야 합니다…"
- 범위 밖으로 둔 것: 도구 경로 statuses 스키마가 강제되지 않아 생기는 LLM-005(10건)는 이 변경으로 해결되지 않는다. 별도 이슈 `issue_store_tool_path.md` 1번이다.

### 2-2. (4) UNAVAILABLE_NOTICE — 문장 대신 목록

**현재** (`UserIntentHandler`)
```java
static final String UNAVAILABLE_NOTICE = "요금, 데이터 사용량, 미납 정보는 제공되지 않습니다.";
```

**변경**
```java
static final String UNAVAILABLE_NOTICE = "다음 항목은 조회 결과에 없음: 요금, 데이터 사용량, 미납 정보";
```

- 목적은 고지 문장 템플릿 역할을 없애는 것이다. 예: UD-028 "이번 달의 데이터 사용량은 제공되지 않았습니다."가 이 문장을 따라 쓴 것이다.
- 사용자 정보 섹션은 USER_DATA FAQ가 하나라도 걸리면 붙는다. sub LLM 경로 342건 중 118건이고, 일반 MP·OS 문항에도 들어간다.
- **develop과 맞물리는 곳:** develop의 `AiOutputGuardService.MISSING_LOOKUP_DATA`(`찾을 수 없|조회하지 못|제공되지 않|정보…없|부족`)는 사용자 정보 섹션 안의 이 문장으로 "조회 결과 없음"을 알아본다.
  - 이 신호는 `hasMissingLookupData`에서 `USER_INFORMATION_OR_LOOKUP_MISSING` 사유를 남기는 데 쓰인다.
  - 문구를 바꾸면 이 패턴에 `조회\s*결과에\s*없` 형태를 함께 추가해야 한다.
  - develop 테스트 `IntentHandlerTest`(`endsWith(UNAVAILABLE_NOTICE)`)는 상수를 쓰므로 그대로 통과한다. `AiOutputGuardServiceTest` 2523행은 옛 문장을 문자열로 들고 있으므로 함께 바꾼다.
- `NOT_FOUND_CONTENT`("사용자 정보를 찾을 수 없습니다.")는 develop 가드가 문자열 그대로 비교한다(`NOT_FOUND_CONTENT.equals`). 이번에는 바꾸지 않는다.

### 2-3. 실행·판단

- 폴더·배치: `--test pipeline_test_v3 --try try1`, Judge `--batch pv3-try1`, run-id는 `..._pv3_...`.
- 대상: ST 30 + UD 30 + 사용자 정보 섹션이 붙은 섞인 케이스(MP·OS 중 해당하는 것) + 1단계 스모크 119. 기준선은 v2(1단계)의 n1 run이다. 같은 세션에서 n1도 같은 대상으로 다시 돌린다.
- 볼 지표:
  - 되묻기(패턴·Judge `asks_user`) 0 근처가 목표다.
  - 매장 하위 질문 status: 실패 경우 ABSTAIN, 성공 경우 ANSWER를 유지하는지 본다.
  - 코드 매장 안내가 제대로 붙었는지 본다.
  - UD 누출 표현에서 "제공되지 않았습니다"가 사라졌는지 본다.
  - 사용자 정보 질문(가입일·거주 지역)의 Judge 정답이 떨어지지 않는지 본다.

---

## 참고 — 이번에 하지 않기로 한 것

- 출력 키 순서 변경(statuses를 answer보다 먼저): 스키마가 answer를 첫 키로 두는 것은 의도된 설정이다. prompts_test_v8에서는 status를 먼저 쓰면 라벨을 먼저 정하고 답을 그에 맞춰 휘게 했다.
- 코드로 고지 문장 지우기: try1 시뮬레이션 기준으로는 안전하게 할 수 있다.
  - 규칙: 코드 안내가 붙는 경우만, 숫자 없는 문장, FAQ 인용 제외, 절 연결 없는 문장 대상.
  - 효과: sub 누출 케이스 30/66, subp 42/78을 완전히 제거하고, 사실 문장을 잘못 지운 경우는 0이었다.
  - 1·2단계 결과를 본 뒤 필요하면 `issue_answer_postprocess.md`로 진행한다.
