# 프롬프트 비교 — qwen3:14b (test3_prompt)

> 자동 생성 문서입니다 (`scripts/test3/compare_prompts.js`). 같은 이름으로 다시 생성하면 덮어써집니다.
> "사람 판단" 칸을 채웠다면 파일을 복사해 두세요.
> 생성 시각: 2026-09-22T06:32:42.536Z

## 측정 조건

- 모델: `qwen3:14b` 고정. **프롬프트만 바꿨다.**
- temperature 0 · 추론(thinking) 모드 끔 · seed 미고정 · 고유 문항(실행 회차 1)만
- 평가 데이터셋: `data/eval_sets/test_set2/cases.csv` — test2·test3와 동일
- 대조군(`v0_baseline`)은 `test3`의 기존 추론 off 라운드 결과를 그대로 썼다.
- 프롬프트 안 결과는 `results/{raw,scored,reports}/test3_prompt/`에 있다 — 모델 라운드(`test3`)와 섞지 않는다.
- 추론을 끈 이유: `results/test3/think_ablation_results.md` — 추론을 켜면 P95가 상담 실용선을 크게 넘는다.

| 안 | suite | run_id | 바꾼 것 | 겨냥한 약점 |
|---|---|---|---|---|
| v0_baseline | test3 | `ec2-linux_qwen3-14b_t0_nothink_20260920` | 없음 (현행 프롬프트, 대조군) | 비교 기준선 |
| v1_status_rules | test3_prompt | `ec2-linux_qwen3-14b_v1_status_rules_t0_nothink_20260922` | status 6종의 경계 정의 + 주의 5개 | 유사하지만 답 없음 · 무관 FAQ · API 결과 |
| v2_value_guard | test3_prompt | `ec2-linux_qwen3-14b_v2_value_guard_t0_nothink_20260922` | 값 질문·범위 판정 규칙 2줄만 | 유사하지만 답 없음 (최소 개입으로 같은 효과가 나는지) |
| v3_decision_tree | test3_prompt | `ec2-linux_qwen3-14b_v3_decision_tree_t0_nothink_20260922` | status 판단 순서 강제 (ABSTAIN을 CLARIFY보다 먼저) | ABSTAIN을 CLARIFY로 잘못 고르는 오분류 |

## 전체 비교표

`results/test3/summary_results.md`의 모델별 표와 같은 열 구성이다. 괄호는 v0 대비 차이.

| 안 | 내용 정확도(AI) | 근거율(AI) | RAG 근거율(결정론) | 기대 상태 일치 | 부재판단 F1 | 포맷 성공률 | 평균 출력 토큰 | 평균 지연 | P95 |
|---|---|---|---|---|---|---|---|---|---|
| v0_baseline | 70.7% | 76.3% | 23.6% (n=220) | 79.3% | 0.725 | 100.0% | 92 | 5.51s | 8.11s |
| v1_status_rules | - | - | 22.5% (-1.1%p) (n=200) | 85.0% (+5.7%p) | 0.925 (+0.200) | 100.0% (+0.0%p) | 85 (-7) | 4.29s (-1.23s) | 6.79s (-1.32s) |
| v2_value_guard | - | - | 23.3% (-0.4%p) (n=202) | 87.3% (+8.0%p) | 0.919 (+0.194) | 100.0% (+0.0%p) | 85 (-7) | 4.29s (-1.22s) | 6.65s (-1.46s) |
| v3_decision_tree | - | - | 22.6% (-1.0%p) (n=199) | 82.3% (+3.0%p) | 0.905 (+0.180) | 100.0% (+0.0%p) | 85 (-7) | 4.28s (-1.23s) | 7.15s (-0.96s) |

- 내용 정확도·근거율(AI)은 LLM Judge 채점 결과다. 아직 채점하지 않았으면 `-`다.
- RAG 근거율(결정론)은 절대값이 실제보다 낮다. 편향이 고루 걸려 순위 비교로는 쓸 수 있다고 확인했다(Spearman rho 0.964, [검증](../scored/test3/rag_rule_ranking_check.json)). 다만 여기서는 같은 모델·같은 문항이라 편향이 동일하게 걸리므로 안끼리 차이를 보는 용도로는 더 안전하다.
- `n`은 근거 대조를 한 문항 수다. 보류로 답한 문항은 분모에서 빠지므로, 보류가 늘면 `n`이 줄어든다.

## v0 대비 개선·퇴보 요약

같은 문항끼리 짝지어 비교한 결과다. **개선**은 v0에서 틀렸다가 맞은 문항 수,
**퇴보**는 v0에서 맞았다가 틀린 문항 수다. 비율 차이보다 이 짝 비교가 정확하다.

| 안 | 개선 | 퇴보 | 순증 | 기대 상태 일치 | 지연 변화 | 한 줄 판정 |
|---|---|---|---|---|---|---|
| v1_status_rules | +38문항 | -21문항 | +17문항 | 85.0% (+5.7%p) | -1.23s | 개선(퇴보 동반) |
| v2_value_guard | +32문항 | -8문항 | +24문항 | 87.3% (+8.0%p) | -1.22s | 개선 |
| v3_decision_tree | +35문항 | -26문항 | +9문항 | 82.3% (+3.0%p) | -1.23s | 개선(퇴보 동반) |

### v1_status_rules

- 좋아진 유형: 유사하지만 답 없음 +19 · 무관 FAQ +6 · 빈 컨텍스트 +3 · FAQ 충돌·시행일 +3 · 부분 정보 +2
- 나빠진 유형: 단일 FAQ 답변 -2 · 유사 FAQ 구분·노이즈 -2 · 사용자 정보+FAQ -2 · 멀티턴 대화 -2 · 다중 FAQ 조합 -4 · 조건·예외·경계값 -4
- 남은 오분류 상위: 다중 FAQ 조합 · ANSWER→PARTIAL 4건 · 멀티턴 대화 · ANSWER→PARTIAL 4건 · 사용자 정보+FAQ · ANSWER→PARTIAL 3건 · 조건·예외·경계값 · ANSWER→ABSTAIN 3건
- 퇴보한 문항: SF-0034, SF-0063, NC-0034, NC-0053, MC-0027, MC-0052, MC-0061, MC-0086, UI-0055, UI-0089, UI-0090, CE-0002 …

### v2_value_guard

- 좋아진 유형: 유사하지만 답 없음 +20 · 무관 FAQ +4 · 빈 컨텍스트 +3 · 부분 정보 +2
- 나빠진 유형: 멀티턴 대화 -2 · 조건·예외·경계값 -3
- 남은 오분류 상위: 유사하지만 답 없음 · ABSTAIN→CLARIFY 4건 · 무관 FAQ · ABSTAIN→OUT_OF_SCOPE 4건 · 조건·예외·경계값 · ANSWER→ABSTAIN 3건 · 멀티턴 대화 · PARTIAL→ANSWER 3건
- 퇴보한 문항: CE-0002, CE-0048, CE-0057, CF-0016, CF-0048, CF-0052, MT-0096, MT-0105

### v3_decision_tree

- 좋아진 유형: 유사하지만 답 없음 +16 · 무관 FAQ +5 · 빈 컨텍스트 +3 · FAQ 충돌·시행일 +3 · 부분 정보 +1
- 나빠진 유형: 멀티턴 대화 -1 · 단일 FAQ 답변 -3 · 유사 FAQ 구분·노이즈 -3 · 다중 FAQ 조합 -4 · 사용자 정보+FAQ -4 · 조건·예외·경계값 -4
- 남은 오분류 상위: 유사하지만 답 없음 · ABSTAIN→CLARIFY 6건 · 사용자 정보+FAQ · ANSWER→PARTIAL 5건 · 멀티턴 대화 · ANSWER→PARTIAL 5건 · 다중 FAQ 조합 · ANSWER→PARTIAL 4건
- 퇴보한 문항: SF-0034, SF-0063, SF-0077, NC-0034, NC-0053, NC-0064, MC-0052, MC-0061, MC-0086, MC-0093, UI-0016, UI-0053 …

## 유형별 기대 상태 일치율

| 유형 | n | v0_baseline | v1_status_rules | v2_value_guard | v3_decision_tree |
|---|---|---|---|---|---|
| 유사하지만 답 없음 | 35 | 28.6% (10/35) | 82.9% (29/35) (+54.3%p) | 85.7% (30/35) (+57.1%p) | 74.3% (26/35) (+45.7%p) |
| API 결과 답변 ⚠️ | 5 | 40.0% (2/5) | 40.0% (2/5) (+0.0%p) | 40.0% (2/5) (+0.0%p) | 40.0% (2/5) (+0.0%p) |
| 무관 FAQ | 20 | 60.0% (12/20) | 90.0% (18/20) (+30.0%p) | 80.0% (16/20) (+20.0%p) | 85.0% (17/20) (+25.0%p) |
| FAQ 충돌·시행일 | 15 | 66.7% (10/15) | 86.7% (13/15) (+20.0%p) | 66.7% (10/15) (+0.0%p) | 86.7% (13/15) (+20.0%p) |
| 멀티턴 대화 | 27 | 66.7% (18/27) | 59.3% (16/27) (-7.4%p) | 59.3% (16/27) (-7.4%p) | 63.0% (17/27) (-3.7%p) |
| 적대적 입력·범위 밖 | 15 | 80.0% (12/15) | 80.0% (12/15) (+0.0%p) | 80.0% (12/15) (+0.0%p) | 80.0% (12/15) (+0.0%p) |
| 사용자 정보+FAQ | 24 | 87.5% (21/24) | 79.2% (19/24) (-8.3%p) | 87.5% (21/24) (+0.0%p) | 70.8% (17/24) (-16.7%p) |
| 빈 컨텍스트 | 30 | 90.0% (27/30) | 100.0% (30/30) (+10.0%p) | 100.0% (30/30) (+10.0%p) | 100.0% (30/30) (+10.0%p) |
| 부분 정보 | 35 | 94.3% (33/35) | 100.0% (35/35) (+5.7%p) | 100.0% (35/35) (+5.7%p) | 97.1% (34/35) (+2.9%p) |
| 유사 FAQ 구분·노이즈 | 22 | 95.5% (21/22) | 86.4% (19/22) (-9.1%p) | 95.5% (21/22) (+0.0%p) | 81.8% (18/22) (-13.6%p) |
| 단일 FAQ 답변 | 18 | 100.0% (18/18) | 88.9% (16/18) (-11.1%p) | 100.0% (18/18) (+0.0%p) | 83.3% (15/18) (-16.7%p) |
| 다중 FAQ 조합 | 30 | 100.0% (30/30) | 86.7% (26/30) (-13.3%p) | 100.0% (30/30) (+0.0%p) | 86.7% (26/30) (-13.3%p) |
| 조건·예외·경계값 | 24 | 100.0% (24/24) | 83.3% (20/24) (-16.7%p) | 87.5% (21/24) (-12.5%p) | 83.3% (20/24) (-16.7%p) |

⚠️ 표시는 문항이 10건 미만이라 1~2문항 차이로 비율이 크게 흔들린다. 결론 근거로 쓰지 말 것.

## 읽을 때 주의할 점

- 300문항에서 1문항은 약 0.3%p다. 짝 비교의 **순증이 한 자리 수면 우연일 수 있다.**
- 기대 상태 일치율만 보고 고르지 말 것. 보류(ABSTAIN)를 남발하면 이 지표는 오르지만 답을 못 하는 상담봇이 된다. `부재판단 F1`과 `RAG 근거율`의 `n`을 함께 볼 것.
- 프롬프트가 길어지면 입력 토큰이 늘어 지연이 커진다. `평균 지연`·`P95`를 함께 볼 것.
- temperature 0에서 한 번 돌린 결과다. 반복 일관성은 이 비교에서 재지 않는다(`--primary-only`로 반복 회차를 생성하지 않음).
- 한 모델에서 좋은 프롬프트가 다른 모델에서도 좋다는 보장은 없다.

## 원본 파일

- v0_baseline: [생성 결과](../raw/test3/ec2-linux_qwen3-14b_t0_nothink_20260920/generation.jsonl) · [통합 CSV](../scored/test3/ec2-linux_qwen3-14b_t0_nothink_20260920/review.csv) · [요약](../reports/test3/ec2-linux_qwen3-14b_t0_nothink_20260920_summary.md)
- v1_status_rules: [생성 결과](../raw/test3_prompt/ec2-linux_qwen3-14b_v1_status_rules_t0_nothink_20260922/generation.jsonl) · [통합 CSV](../scored/test3_prompt/ec2-linux_qwen3-14b_v1_status_rules_t0_nothink_20260922/review.csv) · [요약](../reports/test3_prompt/ec2-linux_qwen3-14b_v1_status_rules_t0_nothink_20260922_summary.md)
- v2_value_guard: [생성 결과](../raw/test3_prompt/ec2-linux_qwen3-14b_v2_value_guard_t0_nothink_20260922/generation.jsonl) · [통합 CSV](../scored/test3_prompt/ec2-linux_qwen3-14b_v2_value_guard_t0_nothink_20260922/review.csv) · [요약](../reports/test3_prompt/ec2-linux_qwen3-14b_v2_value_guard_t0_nothink_20260922_summary.md)
- v3_decision_tree: [생성 결과](../raw/test3_prompt/ec2-linux_qwen3-14b_v3_decision_tree_t0_nothink_20260922/generation.jsonl) · [통합 CSV](../scored/test3_prompt/ec2-linux_qwen3-14b_v3_decision_tree_t0_nothink_20260922/review.csv) · [요약](../reports/test3_prompt/ec2-linux_qwen3-14b_v3_decision_tree_t0_nothink_20260922_summary.md)

## 사람 판단

- 채택할 안:
- 근거:
- 다른 모델로 확인할 안:
- 메모:

