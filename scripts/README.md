# scripts — 공통 테스트 엔진 (v4부터)

v4부터 모든 테스트는 이 폴더의 스크립트를 공유한다. 버전마다 바뀌는 것(데이터·항목·모델·조건·프롬프트 선택·Judge)은 `model_test_vN/test.config.js` 한 파일에만 둔다. **새 버전을 만들 때 스크립트를 복사하지 않는다.** v1~v3는 각자의 `model_test_vN/scripts/`를 그대로 쓴다(결과 재현용, 이 엔진과 무관).

| 폴더 | 단계 | 스크립트 |
|---|---|---|
| `run/` | 준비 · 실행 · 생성 | `setup_env` · `prepare_dataset` · `run_all` · `run_model` · `run_item` · `run_pipeline` · `run_generation` · `build_case_set` |
| `score/` | 결정론 채점 | `score_format_performance` · `score_status` · `score_evidence` · `score_answer_similarity` · `score_rag_grounding` · `score_expression_rules` · `score_repeat_consistency` |
| `judge/` | LLM Judge **판정** | `build_batch_manifest` · `judge_prepare` · `judge_run` · `merge_call_logs` |
| `docgen/` | 결과 **문서 생성** | `build_review_export` · `build_run_report` · `judge_report` · `judge_review_export` · `compare_runs` · `compare_variants` · `build_result_entry` |
| `lib/` | 공통 모듈 | 경로·설정(`profile`), 데이터(`dataset`), 프롬프트 로더(`prompts`·`prompt_files`), Judge 스키마·provider(`judge/`) 등 |

프롬프트 원문은 스크립트에 두지 않고 저장소 루트 `prompts/`(chatbot·judge·docgen)에 둔다 — `prompts/README.md`.

## 테스트·try 고르기

모든 스크립트는 `--test`/`--try` 인자(또는 `LLM_TEST`/`LLM_TEST_TRY` 환경변수)를 받는다.

- `--test v4`를 생략하면 `test.config.js`가 있는 가장 높은 버전을 쓴다. `--test prompts_test_v1`처럼 `test.config.js`가 있는 폴더 이름을 그대로 줄 수도 있다(프롬프트 튜닝 테스트 — `prompts_test_v1/SETUP.md`).
- `--try try1`을 생략하면 `config.defaultTry`를 쓴다.
- `--variant <안>`(`LLM_TEST_VARIANT`): 상담봇 프롬프트 안. 생략하면 `config.prompt.variant`. 기본과 다르면 run_id에 안 이름이 붙는다.

결과 경로는 README 4-2절 구조(`model_test_vN/tryM/results/...`)를 따르며 `lib/profile.js` 한 곳에서 정해진다.

## 실행 스크립트

| 스크립트 | 범위 |
|---|---|
| `run/run_all.js` | **모든 모델 × 모든 항목** — config의 `runByDefault: true` 모델 (`--models`로 지정 가능) |
| `run/run_model.js <model>` | **모델 하나 × 모든 항목** |
| `run/run_item.js <model> <CODE[,CODE]>` | **모델 하나 × 항목 하나(여럿)** — run_id 끝에 항목 코드가 붙어 전체 run과 섞이지 않는다 |

세 스크립트는 `lib/round.js`로 run_id를 만들고, 각 모델마다 `run_pipeline.js`를 호출한다.

공통 옵션은 다음과 같다.

- `--size 50|100|150|200`: 항목당 건수. 작은 서브셋은 큰 서브셋에 항상 포함된다.
- `--condition <이름>`
- `--difficulty Easy|Medium|Hard`
- `--limit N`: 스모크 테스트용
- `--date YYYYMMDD`
- `--dry-run`: 호출할 run만 출력
- `--skip-model-check`
- `--ids-file <파일>`: 케이스 ID 목록(한 줄에 하나, `#` 뒤는 주석)으로 `--size` 서브셋 안에서 다시 고른다. 목록 밖 ID가 섞이면 실행 전에 멈춘다. 목록은 `run/build_case_set.js`가 이전 Judge 결과로 만든다(오답 비율을 높인 짝 비교용).

run_id 형식은 `<env>_<모델>_<조건>_<컨텍스트 방식>_n<항목당 건수>[_<프롬프트 안>]_<날짜>[_<항목 코드>][_ids-<목록 이름>]`이다.
예) `local-win_qwen3-4b_t0_nothink_fixed_n200_20261001`, `local-win_qwen3-4b_t0_nothink_fixed_n100_v4_t1_20261007_PI-CE`.
`run_info.json`의 `runtime`에 Ollama 버전·모델 digest·양자화를 기록한다(2026-10-07~). 같은 모델·temperature 0이어도 환경이 다르면 출력이 달라질 수 있어, 환경이 다른 run끼리 비교하기 전에 확인한다.

재개 방법은 같은 명령을 다시 실행하는 것이다. 이미 생성된 케이스는 건너뛴다. 같은 run_id를 다른 설정(모델·조건·프롬프트·데이터·선택 범위)으로 이어 쓰려 하면 `run_info.json`과 비교해 멈춘다.

## 파이프라인 단계 (`run/run_pipeline.js`가 순서대로 호출, 각각 단독 실행 가능)

| 단계 | 산출물 (`raw/scored/<run_id>/`) | 내용 |
|---|---|---|
| `run/run_generation.js` | `raw/<run_id>/generation.jsonl`, `run_info.json` | 모델 호출. 워밍업 1회 후 순차 단일 요청. `config.generation.timeoutMs` 초과는 재시도 없이 `error_type: TIMEOUT` 오류로 기록 |
| `score/score_format_performance.js` | `format_performance*.json(l)` | 포맷 계약 준수, 타임아웃 건수, 지연 평균/P50/P95(응답 받은 행), TPS, VRAM |
| `score/score_status.js` | `status*.json(l)` | 기대 상태 일치, 혼동 행렬, 상태별 재현율·정밀도, 부재 판단 P/R/F1 |
| `score/score_evidence.js` | `evidence*.json(l)` | 근거 채택: evidence_ids vs 정답 근거 문서(원문 ID가 Context에 없으면 대체 시험 문서 `TEST-*`). 채택률·정확 인용·정밀도·분류, Context에 없는 ID 인용 |
| `score/score_answer_similarity.js` | `answer_similarity*.json(l)` | 정답 예시와의 BGE-M3 유사도 분포, 필수 사실 키워드 포함률 |
| `score/score_rag_grounding.js` | `rag_grounding*.json(l)` | (참고) NLI 지지율, 미확인 숫자·고유명사. 사용자 정보·API와 대화 이력도 premise에 포함 |
| `score/score_expression_rules.js` | `expression_rules*.json(l)` | 표현 규칙 점수(/100), 실격·감점 비율 |
| `score/score_repeat_consistency.js` | `repeat_consistency*.json(l)` | 반복 항목: 상태·숫자·근거 ID 일관성, 최빈 상태 비율, 일관된 오답 |
| `docgen/build_review_export.js` | `review.csv` | 케이스 1행에 질문·정답·응답·모든 값 |
| `docgen/build_run_report.js` | `report/<run_id>_summary.md` | run 요약 (Judge 결과가 있으면 먼저 표시) |

- 평가 방식은 README 4-9절을 따른다. 결과론적 지표에는 통과/실패 판정·통과율·"AI 재판단 필요"가 없고, 평균·분포 같은 원래 값만 남긴다.
- 전체 지표는 독립 표본 기준이다(반복 항목 `config.repeatItem` 제외). 반복 항목은 항목별 표와 반복 일관성에서 따로 본다.
- `config.pipeline.skip`에 단계 이름(파일 이름, 확장자 없이)을 넣으면 그 단계를 건너뛴다. 예: NLI venv가 없는 환경에서 `score_rag_grounding`.

## LLM Judge (항상 별도 단계, 전수)

```bash
node scripts/judge/build_batch_manifest.js --batch <id> [--size N]   # 완료된 run 고정 -> report/<id>.json
node scripts/judge/judge_prepare.js --batch <id>                     # 채점 입력(외부 호출 없음) -> llm_judge/inputs/<id>/
node scripts/judge/judge_run.js --batch <id> --confirm-external [--concurrency 8]   # ⚠ 외부 전송(provider 설정에 따름 — v4는 Codex CLI) — 승인 후
node scripts/docgen/judge_report.js --batch <id>                      # 집계 -> llm_judge/<id>_report.md
node scripts/docgen/judge_review_export.js --batch <id> [--filter correct-hallucinated|abstain-label-correct]   # 검토 md -> llm_judge/review/<id>/[<filter>/]<모델>_<항목>_review.md + index.md
node scripts/judge/merge_call_logs.js --batch <id> [--dry-run]       # 옛 형식(호출마다 파일 2개) Codex 호출 로그 -> calls/<kind>.calls.jsonl로 합침
```

Codex 호출 로그는 배치·판정 종류마다 `llm_judge/runs/<id>/calls/<kind>.calls.jsonl` 한 파일에 호출 1번 = 1줄로 쌓인다(재개하면 이어 씀). 판정 결과의 `call_log`는 `<파일>#<call_id>`다.

### 판정 단계와 문서 생성 단계는 스크립트·프롬프트를 섞지 않는다

| 단계 | 스크립트 | 프롬프트·스키마 | 외부 호출 |
|---|---|---|---|
| **판정** (모델이 저장 답변을 채점) | `judge/judge_prepare.js` → `judge/judge_run.js` | `prompts/judge/*.md`(루브릭) · `lib/judge/schema.js`(출력 스키마) · `lib/judge/providers/`(호출부) | provider 설정에 따름(v4는 Codex CLI) |
| **문서 생성** (판정·채점 결과를 표·보고서로) | `judge_report.js` · `build_run_report.js` · `compare_runs.js` | 없음 — 코드로 집계 | 없음 |

- 문서 생성에 LLM을 쓰게 되면(예: 결과 해석 초안) 프롬프트는 `prompts/docgen/`에, 스크립트는 `scripts/docgen/`에 따로 만든다. 판정 루브릭(`prompts/judge/`)을 재사용하거나 판정 스크립트에 끼워 넣지 않는다.
- 판정 호출부는 provider로 나뉜다: `openai`(OpenAI API, Chat Completions + Structured Outputs `json_schema` strict, 토큰 과금), `codex`(Codex CLI — **v4가 쓰는 provider**, ChatGPT 구독 인증으로 실행해 API 토큰 과금이 아님, `--output-schema`로 구조화 출력 강제). `test.config.js`의 `judge.provider`로 고른다.
- **판정 모델은 아직 정하지 않았다**(`judge.model: null`). 모델이 없으면 `judge_prepare.js`는 경고만 하고 `judge_run.js`는 멈춘다. provider·model·reasoningEffort·temperature·seed는 준비 시점에 배치 매니페스트에 고정되며, 바꾸면 새 배치 ID로 다시 준비해야 한다. v4는 `reasoningEffort: 'medium'`으로 정했다(2026-10-02).
- `openai` provider는 API 키를 `judge.apiKeyEnv`(기본 `OPENAI_API_KEY`) 환경변수에서만 읽고 로그에 남기지 않으며, 429·5xx·타임아웃은 `retry-after`를 지키며 재시도한다. `codex` provider는 `codex login`으로 끝난 구독 인증을 그대로 쓰고 별도 API 키가 없다 — `judge.cli`(기본 `codex`, `LLM_JUDGE_CODEX_BIN` 환경변수로 덮어쓰기 가능) 실행 파일이 PATH에 있어야 한다. 호출 로그는 두 provider 모두 `llm_judge/runs/<batch>/calls/`(요청 설정 + 응답)에 남는다.

`accuracy` Judge는 **답변 본문만** 받는다(status·evidence_ids는 입력에서 뺌). 정확도·환각과 함께 본문이 실제로 한 행동(`behavior.content_stance`)과 본문의 실제 출처(`behavior.content_sources`)를 낸다. `judge_report.js`는 이를 세 층으로 집계한다.

상태(본문 행동 `content_stance`)가 기대와 다르게 나온 경우는 **정합(3절)에서만** 본다 — 라벨 기준(출력 status vs 기대 상태)과 본문 기준(Judge가 읽고 판정한 content_stance vs 기대 상태)을 각각 세서 일치율·불일치 건수로 보여줄 뿐, "심각한 문제"로 우선순위를 매기지 않는다. 2026-10-02에 과대/과소/교차를 최우선으로 보던 응답 경로표(P0~P7, `lib/response_paths.js`)와 튜닝 코드(A/B/C/D/E/F/S, `lib/tuning_codes.js`·`lib/tuning_report.js`)는 폐기하고 세 파일을 삭제했다 — 상태 불일치를 최우선 문제로 보는 전제가, 상태를 아예 안 보는 정확도 판정·"정답+상태 완화"(ANSWER↔PARTIAL 등은 정답으로도 집계) 결정과 맞지 않았기 때문이다.

- 내용: 정확도·환각
- 오답 이유(배타 분류, 상태 무관): **근거 오류**(content_sources vs 정답 문서, 코드 판단) → **필수 사실 누락**(Judge) → **사실 오적용/모순**(Judge) → **기타**. 칸마다 환각 동반 건수를 같이 센다.
- 정합: 라벨 vs 본문(코드 계산) — status 다르게 표기된 경우는 여기서 일치율·불일치 건수·대표 문항으로 본다
- 결과: 정답 · 정답+상태(+완화) · 정답+근거 · 정답+근거+상태(+완화)(라벨 기준, 환각과 무관)

여기에 공통 오답 후보(같은 문항·같은 오답 이유로 2개 이상 모델이 틀림)가 더해진다.

보고서 1절은 대표 지표, 4-1절은 오답 이유 배타 분류를 보여준다. 채점 완료율·생성 실패·Judge 미완료도 표시하며 자료 판정 불가는 모델 오답과 구분한다. 전체 요약의 '독립 표본'은 RT 제외 행이라는 기존 이름이며 통계적 독립성을 보장하지 않는다.

Judge 종류는 세 가지다.

- `accuracy`: 정확도·근거·본문 행동·출처. 표현 품질 점수는 제외하며 표현 규칙 검사는 별도 결과론적 지표로 유지한다. 전 행(반복 회차 포함)이 대상이다.
- `safety`: `config.safetyItems` 행이 대상이다.
- `persona`: 페르소나 지시가 있는 행이 대상이다.

루브릭 원문은 `prompts/judge/*.md`(로더·버전은 `lib/judge/prompts.js`), 스키마는 `lib/judge/schema.js`에 있다. 루브릭을 고치면 `RUBRIC_VERSION`을 올리고 새 배치 ID를 쓴다. 준비된 입력과 현재 코드·데이터가 다르면 `judge_run.js`가 멈춘다.

## 집계

```bash
node scripts/docgen/compare_runs.js [--size N] [--batch <id>]   # -> summary/run_comparison.md · .csv
node scripts/docgen/build_result_entry.js --batch <id> [--write]  # result.html 데이터셋 항목(<version>-<try>) 생성·갱신 — 지표 키는 v4_ 접두사
node scripts/docgen/compare_variants.js --batch <id> [--base <안>] [--base-from <test>/<try>/<batch>]  # 프롬프트 안 짝 비교 -> llm_judge/<id>_variant_compare.md · .json
```

`compare_variants.js`는 같은 배치에서 같은 모델·같은 케이스 ID끼리 기준 안과 새 안을 맞대어, 항목별 정답 전후·바뀐 건수(McNemar 정확검정)·환각·status 분포·본문 보류·되묻기·본문 FAQ ID 노출·안전성 판정을 낸다(`judge_report.js`를 먼저 실행).

## 준비

```bash
node scripts/run/setup_env.js          # .venv_nli · Ollama 모델 · 데이터셋 CSV (멱등)
node scripts/run/prepare_dataset.js    # 원본 xlsx -> data/eval_sets/<set>/ (포함 최소 규모 컬럼, dataset_manifest.json)
```

## 새 버전을 만들 때

1. `model_test_v{N}/test.config.js`를 이전 버전에서 복사해 바뀌는 값만 고친다. 데이터 경로·컬럼 매핑·항목·모델·조건·프롬프트 variant·Judge 설정이 대상이다.
2. `node scripts/run/prepare_dataset.js --test v{N}`
3. `node scripts/run/run_all.js --test v{N} --dry-run`

엔진 코드를 고쳐야 한다면 그 변경은 이후 모든 버전에 적용된다. 이미 끝난 버전의 결과를 다시 만들 때 영향이 없는지 확인하고, 채점 기준이 바뀌면 루브릭·스키마 버전을 올린다.

## 프롬프트

상담봇 시스템 프롬프트 원문은 `prompts/chatbot/*.md`, 조합은 `prompts/chatbot/variants.json`에 있다(로더 `lib/prompts.js`·`lib/prompt_files.js`, 규칙은 `prompts/README.md`). `config.prompt.variant`(또는 `--variant`)로 안을 고른다. 기준은 `v4_base`(공통 문단 + 근거 기준 status 판정 + 출력 순서 evidence_ids → status → answer)이고, 튜닝 안 `v4_t1`~`v4_t3`은 `prompts_test_v1/SETUP.md`에 있다(`v4_t2`·`v4_t3`은 키 순서가 달라 아직 실행 불가). `config.generation.format: 'schema'`이면 `config.output.keyOrder` 순서의 JSON 스키마로 Ollama 구조화 출력을 켜서 순서·status enum을 강제하고, 포맷 채점이 실제 키 순서 준수율을 기록한다. 페르소나 지시는 시스템 영역 뒤에 붙고, 대화 이력은 JSON 배열과 "사용자:/상담봇:" 텍스트를 모두 받는다.
