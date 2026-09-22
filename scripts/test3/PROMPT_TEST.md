# 프롬프트 비교 테스트 (test3)

모델은 고정하고 **시스템 프롬프트만 바꿔서** 같은 300문항을 돌린 뒤, 비교 문서 1개를 만든다.

```bash
node scripts/test3/run_prompt_test.js qwen3:14b
```

## 목차
1. [무엇을 비교하는가](#1-무엇을-비교하는가)
2. [실행 조건과 그 근거](#2-실행-조건과-그-근거)
3. [사전 준비](#3-사전-준비)
4. [실행 방법](#4-실행-방법)
5. [옵션](#5-옵션)
6. [결과 파일](#6-결과-파일)
7. [결과 읽는 법](#7-결과-읽는-법)
8. [프롬프트 안 추가하기](#8-프롬프트-안-추가하기)
9. [자주 나는 오류](#9-자주-나는-오류)

---

## 1. 무엇을 비교하는가

프롬프트 원문은 [`scripts/test2/lib/prompts.js`](../test2/lib/prompts.js)에 있다. 세 안 모두 **v0 전문을 그대로 두고 뒤에 블록 하나만 덧붙인다** — 한 번에 하나만 바꿔야 무엇 때문에 점수가 달라졌는지 가릴 수 있다.

| 안 | 바꾼 것 | 겨냥한 약점 |
|---|---|---|
| `v0_baseline` | 없음 (현행 프롬프트) | 대조군 |
| `v1_status_rules` | status 6종의 경계 정의 + 주의 5개 | 유사하지만 답 없음 · 무관 FAQ · API 결과 |
| `v2_value_guard` | 값 질문·범위 판정 규칙 2줄만 | 유사하지만 답 없음 (최소 개입으로 같은 효과가 나는지) |
| `v3_decision_tree` | status 판단 순서 강제 (ABSTAIN을 CLARIFY보다 먼저) | ABSTAIN을 CLARIFY로 잘못 고르는 오분류 |

### 겨냥한 약점 (qwen3:14b 추론 off, 고유 300문항)

근거: [results/test3/ai_analysis.md](../../results/test3/ai_analysis.md) 13.1~13.2절과 생성 결과 직접 집계.

| 유형 | n | 기대 상태 일치 | 주된 오분류 |
|---|---:|---:|---|
| 유사하지만 답 없음 | 35 | **28.6%** | ABSTAIN→CLARIFY 14건, ABSTAIN→PARTIAL 11건 |
| API 결과 답변 | 5 | 40.0% | PARTIAL→ANSWER (조회 결과에 없는 항목까지 확정) |
| 무관 FAQ | 20 | 60.0% | ABSTAIN→OUT_OF_SCOPE 8건 (없는 이유를 지어냄) |

- **값을 묻는데 자료에 없다**: 주변 FAQ의 일반 설명("계약 조건에 따라 달라질 수 있습니다")으로 대신 답하거나, "추가 확인이 필요하다"고 되물어 CLARIFY로 분류한다.
- **통신 주제인데 자료가 없을 뿐**인 경우를 범위 밖으로 처리하고, "통신사 내부 정보라 공개되지 않는다" 같은 **자료에 없는 이유**를 붙인다.

## 2. 실행 조건과 그 근거

| 항목 | 값 | 이유 |
|---|---|---|
| temperature | 0 | test3 운영 설정. 0.8에서는 반복 일관성이 45~52%였다 |
| 추론(thinking) | **끔** | 켜면 qwen3:14b P95가 28.49초다. 끄면 8.11초 ([think_ablation_results.md](../../results/test3/think_ablation_results.md)) |
| seed | 미고정 | temperature 0은 greedy decoding이라 난수를 쓰지 않는다 |
| 문항 | 고유 300문항 (`--primary-only`) | 반복 회차는 프롬프트 비교에 필요 없다 |

이 조건은 기존 **`t0_nothink` 라운드와 완전히 같다.** 그래서 `v0_baseline`은 다시 돌리지 않고 그 결과를 대조군으로 쓴다.

## 3. 사전 준비

| 필요한 것 | 확인 |
|---|---|
| Ollama 실행 + 대상 모델 + `bge-m3` | `ollama list` |
| Python 3.10+ / `.venv_nli` | RAG 충실도 채점에 필요 |
| 기존 `t0_nothink` run | 대조군. 없으면 `--with-baseline`으로 같이 생성 |

환경 설치는 [SETUP.md](SETUP.md) 참고. 러너가 `LLM_TEST_SUITE=test3_prompt`를 자동으로 넣으므로 직접 export할 필요는 없다.

## 4. 실행 방법

```bash
# 안 3개 전부 (v0는 기존 t0_nothink run 재사용)
node scripts/test3/run_prompt_test.js qwen3:14b
```
```bash
# 파이프라인 점검 — 5문항만
node scripts/test3/run_prompt_test.js qwen3:14b --limit 5
```
```bash
# 무엇이 돌지 먼저 확인
node scripts/test3/run_prompt_test.js qwen3:14b --dry-run
```
```bash
# 비교 문서만 다시 생성
node scripts/test3/compare_prompts.js --model qwen3:14b --date 20260922
```

**tmux 안에서 돌릴 것.** 300문항 × 3안 = 900회 호출이고, qwen3:14b 추론 off 평균 5.51초 기준 약 1시간 25분 + 채점 시간이다.

도중에 멈추면 **같은 명령을 다시 실행**하면 된다. 끝난 문항은 건너뛴다. 날짜가 바뀐 뒤 이어서 하려면 `--date`로 처음 날짜를 지정한다.

## 5. 옵션

| 옵션 | 기본값 | 의미 |
|---|---|---|
| `--variants a,b` | v0 외 전부 | 실행할 안 |
| `--with-baseline` | 꺼짐 | v0도 새로 생성 (기존 run과 조건이 다를 때만) |
| `--limit N` | 없음 | 앞에서부터 N문항만 |
| `--date YYYYMMDD` | 오늘 | run_id·문서 이름의 날짜 |
| `--dry-run` | 꺼짐 | run_id만 출력, 모델 호출 없음 |
| `--skip-model-check` | 꺼짐 | 시작 전 `ollama list` 확인 생략 |

run_id는 `<env>_<모델>_<안>_t0_nothink_<날짜>`다. 결과 폴더가 `test3_prompt`로 분리되고 run_id에도 안 이름이 들어가므로 모델 라운드 결과와 섞이지 않는다.

## 6. 결과 파일

프롬프트 테스트 결과는 **모델 라운드(test3)와 섞지 않고 `test3_prompt` 폴더에 따로 쌓인다.**

| 파일 | 내용 |
|---|---|
| `results/test3_prompt/prompt_test_<모델>_<날짜>.md` | ⭐ **비교 문서** |
| `results/reports/test3_prompt/<run_id>_summary.md` | 안별 요약 |
| `results/scored/test3_prompt/<run_id>/review.csv` | 문항별 질문·정답·답변·점수 |
| `results/raw/test3_prompt/<run_id>/generation.jsonl` | 원본 출력 (`prompt_variant`, `gen_params` 포함) |

대조군(`v0_baseline`)만 예외로 `results/*/test3/`의 기존 `t0_nothink` run을 읽는다. 비교 문서의
표에 안별 `suite`가 함께 표시되므로 어느 폴더에서 온 값인지 알 수 있다.

## 7. 결과 읽는 법

비교 문서의 구성은 다음과 같다.

1. **측정 조건** — 안별 run_id와 겨냥한 약점
2. **전체 비교표** — `results/test3/summary_results.md`와 같은 열 구성. 괄호는 v0 대비 차이
3. **v0 대비 개선·퇴보 요약** — 같은 문항끼리 짝지어 비교. 개선/퇴보 문항 수와 유형
4. **유형별 기대 상태 일치율** — 13개 유형, v0 대비 차이 포함
5. **읽을 때 주의할 점**, **원본 파일**, **사람 판단** 칸

**개선·퇴보 요약을 먼저 볼 것.** 비율 차이는 같은 문항을 짝지어 세는 것보다 부정확하다. 예를 들어 "+18 / −17 / 순증 +1"이면 사실상 차이가 없다는 뜻이다.

주의할 점:
- 300문항에서 1문항은 약 0.3%p다. **순증이 한 자리 수면 우연일 수 있다.**
- 기대 상태 일치율만 보고 고르지 말 것. 보류(ABSTAIN)를 남발하면 이 지표는 오르지만 답을 못 하는 상담봇이 된다. `부재판단 F1`과 RAG 근거율의 `n`을 같이 볼 것.
- 프롬프트가 길어지면 입력 토큰이 늘어 지연이 커진다. `평균 지연`·`P95`를 같이 볼 것.
- 문항 10건 미만 유형(⚠️ 표시)은 결론 근거로 쓰지 말 것.
- 한 모델에서 좋은 프롬프트가 다른 모델에서도 좋다는 보장은 없다.

## 8. 프롬프트 안 추가하기

[`scripts/test2/lib/prompts.js`](../test2/lib/prompts.js)의 `SYSTEM_PROMPTS`와 `PROMPT_NOTES`에 넣으면 다음 실행부터 자동으로 포함된다.

- **v0에서 한 가지만 바꿀 것.** 여러 개를 동시에 바꾸면 원인을 가릴 수 없다.
- **출력 형식은 유지할 것.** `status`/`answer`/`evidence_ids` 키와 status 6종을 바꾸면 채점이 깨진다.
- **`TEST_ONLY_SENTINEL_X7`을 공개하지 말라는 규칙을 남길 것.** 적대적 입력 채점에 쓰인다.
- **`v0_baseline`은 고치지 말 것.** 원본 xlsx "평가 가이드" 시트와 같아야 하고, test1~test3이 전부 이 프롬프트로 돌았다.

## 9. 자주 나는 오류

### `[중단] run_id "..."에 이미 다른 설정으로 만든 결과가 있습니다`
같은 run_id에 다른 프롬프트나 다른 생성 파라미터의 결과가 있다. 이어서 돌리려면 같은 옵션으로, 새로 돌리려면 `--date`를 다르게 준다.

### `v0_baseline: 해당 조건의 run을 찾지 못했습니다`
대조군으로 쓸 `t0_nothink` run이 없다. `--with-baseline`으로 v0도 생성하거나, `compare_prompts.js --baseline <run_id>`로 직접 지정한다.

### 4단계(RAG 충실도)에서 멈춤
`.venv_nli`가 없거나 KLUE-NLI 모델을 못 받은 경우다. [SETUP.md](SETUP.md)의 환경 설치를 먼저 끝낸다.

### 지연이 test3 문서 값과 크게 다름
같은 EC2에서 돌렸는지 확인한다. 하드웨어가 다르면 속도는 비교할 수 없다.
