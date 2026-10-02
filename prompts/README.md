# prompts — 모든 프롬프트 (버전 공통)

테스트에 쓰는 프롬프트는 모두 여기에 텍스트 파일로 둔다. 스크립트(`scripts/`)는 이 파일을 읽기만 하고 프롬프트 원문을 코드에 갖지 않는다. 로더는 `scripts/lib/prompt_files.js`이다.

| 폴더 | 용도 | 읽는 곳 |
|---|---|---|
| `chatbot/` | 후보 LLM(상담봇) 시스템 프롬프트 | `scripts/lib/prompts.js` → 생성 단계 |
| `judge/` | LLM Judge 루브릭 — **판정 단계 전용** | `scripts/lib/judge/prompts.js` → `scripts/judge/` |
| `docgen/` | 결과 문서 생성·정리용 — **문서 생성 단계 전용**(LLM을 쓰게 되면) | `scripts/docgen/` |

판정 루브릭과 문서 생성 프롬프트는 섞지 않는다.

## 파일 규칙

- 파일 맨 앞의 `<!-- ... -->` 블록은 사람이 읽는 설명(출처·바꾼 이유)이며 모델에 보내지 않는다.
- `{{include <파일>}}`는 같은 폴더의 다른 파일 내용으로 바뀐다(예: `judge/common_guard.md`).
- 끝 줄바꿈만 떼고 나머지는 그대로 보낸다. 문장을 고치면 결과가 달라질 수 있다.

## chatbot

`variants.json`이 안 이름 → 이어 붙일 파일 목록을 정한다. `test.config.js`의 `prompt.variant`로 안을 고른다. **쓰지 않는 안은 두지 않는다.** 과거 안(v0·v1·v2·v3·v1r)은 git 이력과 `origin/prompttest-judge` 브랜치에 있다.

| 안 | 구성 |
|---|---|
| `v4_base` | `base.md`(공통 문단) + `status_rules.md`(status 판정 기준) + `output_order.md`(출력 순서 evidence_ids → status → answer) |

- `base.md`: test1~test3 공통 프롬프트와 test_set3 데이터셋 공통 프롬프트를 합친 것.
- `status_rules.md`: 고른 근거가 질문을 얼마나 덮는가를 기준으로 쓴 판정 규칙.
- `output_order.md`: 근거를 먼저 고르고, 그 근거로 상태를 정한 뒤 답하게 한다.

페르소나 지시는 데이터셋 행마다 다르므로 파일이 아니라 데이터에서 온다. 생성 단계가 시스템 영역 끝에 `[추가 페르소나 지시]`로 붙인다.

## judge

`accuracy.md`(정확도·환각·본문 행동·본문 출처) · `safety.md` · `persona.md`, 공통 안내는 `common_guard.md`이다. 출력 스키마는 `scripts/lib/judge/schema.js`에 있다. 루브릭을 고치면 `scripts/lib/judge/prompts.js`의 `RUBRIC_VERSION`을 올리고 새 배치 ID로 준비한다. 표현 품질 점수는 전수 accuracy Judge에서 제외하며 표현 규칙 검사와 별도 페르소나 판정은 유지한다.
