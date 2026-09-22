# 프롬프트 비교 — qwen3:14b (test3_prompt · 문항 5건만)

> 자동 생성 문서입니다 (`scripts/test3/compare_prompts.js`). 같은 이름으로 다시 생성하면 덮어써집니다.
> "사람 판단" 칸을 채웠다면 파일을 복사해 두세요.
> 생성 시각: 2026-09-22T05:01:55.647Z

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
| v1_status_rules | test3_prompt | `ec2-linux_qwen3-14b_v1_status_rules_t0_nothink_smoke` | status 6종의 경계 정의 + 주의 5개 | 유사하지만 답 없음 · 무관 FAQ · API 결과 |
| v2_value_guard | test3_prompt | `ec2-linux_qwen3-14b_v2_value_guard_t0_nothink_smoke` | 값 질문·범위 판정 규칙 2줄만 | 유사하지만 답 없음 (최소 개입으로 같은 효과가 나는지) |
| v3_decision_tree | test3_prompt | `ec2-linux_qwen3-14b_v3_decision_tree_t0_nothink_smoke` | status 판단 순서 강제 (ABSTAIN을 CLARIFY보다 먼저) | ABSTAIN을 CLARIFY로 잘못 고르는 오분류 |

## 전체 비교표

`results/test3/summary_results.md`의 모델별 표와 같은 열 구성이다. 괄호는 v0 대비 차이.

| 안 | 내용 정확도(AI) | 근거율(AI) | RAG 근거율(결정론) | 기대 상태 일치 | 부재판단 F1 | 포맷 성공률 | 평균 출력 토큰 | 평균 지연 | P95 |
|---|---|---|---|---|---|---|---|---|---|
| v0_baseline | 70.7% | 76.3% | 23.6% (n=220) | 79.3% | 0.725 | 100.0% | 92 | 5.51s | 8.11s |
| v1_status_rules | - | - | 80.0% (+56.4%p) (n=5) | 100.0% (+20.7%p) | - | 100.0% (+0.0%p) | 54 (-37) | 3.60s (-1.91s) | 8.06s (-0.05s) |
| v2_value_guard | - | - | 80.0% (+56.4%p) (n=5) | 100.0% (+20.7%p) | - | 100.0% (+0.0%p) | 54 (-37) | 2.61s (-2.90s) | 3.17s (-4.94s) |
| v3_decision_tree | - | - | 80.0% (+56.4%p) (n=5) | 100.0% (+20.7%p) | - | 100.0% (+0.0%p) | 54 (-37) | 2.62s (-2.89s) | 3.20s (-4.91s) |

- 내용 정확도·근거율(AI)은 LLM Judge 채점 결과다. 아직 채점하지 않았으면 `-`다.
- RAG 근거율(결정론)은 절대값이 실제보다 낮다. 편향이 고루 걸려 순위 비교로는 쓸 수 있다고 확인했다(Spearman rho 0.964, [검증](../scored/test3/rag_rule_ranking_check.json)). 다만 여기서는 같은 모델·같은 문항이라 편향이 동일하게 걸리므로 안끼리 차이를 보는 용도로는 더 안전하다.
- `n`은 근거 대조를 한 문항 수다. 보류로 답한 문항은 분모에서 빠지므로, 보류가 늘면 `n`이 줄어든다.

## v0 대비 개선·퇴보 요약

같은 문항끼리 짝지어 비교한 결과다. **개선**은 v0에서 틀렸다가 맞은 문항 수,
**퇴보**는 v0에서 맞았다가 틀린 문항 수다. 비율 차이보다 이 짝 비교가 정확하다.

| 안 | 개선 | 퇴보 | 순증 | 기대 상태 일치 | 지연 변화 | 한 줄 판정 |
|---|---|---|---|---|---|---|
| v1_status_rules | +0문항 | -0문항 | +0문항 | 100.0% (+20.7%p) | -1.91s | 차이 없음 |
| v2_value_guard | +0문항 | -0문항 | +0문항 | 100.0% (+20.7%p) | -2.90s | 차이 없음 |
| v3_decision_tree | +0문항 | -0문항 | +0문항 | 100.0% (+20.7%p) | -2.89s | 차이 없음 |

### v1_status_rules

- 좋아진 유형: 없음
- 나빠진 유형: 없음

### v2_value_guard

- 좋아진 유형: 없음
- 나빠진 유형: 없음

### v3_decision_tree

- 좋아진 유형: 없음
- 나빠진 유형: 없음

## 유형별 기대 상태 일치율

| 유형 | n | v0_baseline | v1_status_rules | v2_value_guard | v3_decision_tree |
|---|---|---|---|---|---|
| 유사하지만 답 없음 | 35 | 28.6% (10/35) | - | - | - |
| API 결과 답변 ⚠️ | 5 | 40.0% (2/5) | - | - | - |
| 무관 FAQ | 20 | 60.0% (12/20) | - | - | - |
| FAQ 충돌·시행일 | 15 | 66.7% (10/15) | - | - | - |
| 멀티턴 대화 | 27 | 66.7% (18/27) | - | - | - |
| 적대적 입력·범위 밖 | 15 | 80.0% (12/15) | - | - | - |
| 사용자 정보+FAQ | 24 | 87.5% (21/24) | - | - | - |
| 빈 컨텍스트 | 30 | 90.0% (27/30) | - | - | - |
| 부분 정보 | 35 | 94.3% (33/35) | - | - | - |
| 유사 FAQ 구분·노이즈 | 22 | 95.5% (21/22) | - | - | - |
| 단일 FAQ 답변 | 18 | 100.0% (18/18) | 100.0% (5/5) (+0.0%p) | 100.0% (5/5) (+0.0%p) | 100.0% (5/5) (+0.0%p) |
| 다중 FAQ 조합 | 30 | 100.0% (30/30) | - | - | - |
| 조건·예외·경계값 | 24 | 100.0% (24/24) | - | - | - |

⚠️ 표시는 문항이 10건 미만이라 1~2문항 차이로 비율이 크게 흔들린다. 결론 근거로 쓰지 말 것.

## 읽을 때 주의할 점

- 300문항에서 1문항은 약 0.3%p다. 짝 비교의 **순증이 한 자리 수면 우연일 수 있다.**
- 기대 상태 일치율만 보고 고르지 말 것. 보류(ABSTAIN)를 남발하면 이 지표는 오르지만 답을 못 하는 상담봇이 된다. `부재판단 F1`과 `RAG 근거율`의 `n`을 함께 볼 것.
- 프롬프트가 길어지면 입력 토큰이 늘어 지연이 커진다. `평균 지연`·`P95`를 함께 볼 것.
- temperature 0에서 한 번 돌린 결과다. 반복 일관성은 이 비교에서 재지 않는다(`--primary-only`로 반복 회차를 생성하지 않음).
- 한 모델에서 좋은 프롬프트가 다른 모델에서도 좋다는 보장은 없다.

## 원본 파일

- v0_baseline: [생성 결과](../raw/test3/ec2-linux_qwen3-14b_t0_nothink_20260920/generation.jsonl) · [통합 CSV](../scored/test3/ec2-linux_qwen3-14b_t0_nothink_20260920/review.csv) · [요약](../reports/test3/ec2-linux_qwen3-14b_t0_nothink_20260920_summary.md)
- v1_status_rules: [생성 결과](../raw/test3_prompt/ec2-linux_qwen3-14b_v1_status_rules_t0_nothink_smoke/generation.jsonl) · [통합 CSV](../scored/test3_prompt/ec2-linux_qwen3-14b_v1_status_rules_t0_nothink_smoke/review.csv) · [요약](../reports/test3_prompt/ec2-linux_qwen3-14b_v1_status_rules_t0_nothink_smoke_summary.md)
- v2_value_guard: [생성 결과](../raw/test3_prompt/ec2-linux_qwen3-14b_v2_value_guard_t0_nothink_smoke/generation.jsonl) · [통합 CSV](../scored/test3_prompt/ec2-linux_qwen3-14b_v2_value_guard_t0_nothink_smoke/review.csv) · [요약](../reports/test3_prompt/ec2-linux_qwen3-14b_v2_value_guard_t0_nothink_smoke_summary.md)
- v3_decision_tree: [생성 결과](../raw/test3_prompt/ec2-linux_qwen3-14b_v3_decision_tree_t0_nothink_smoke/generation.jsonl) · [통합 CSV](../scored/test3_prompt/ec2-linux_qwen3-14b_v3_decision_tree_t0_nothink_smoke/review.csv) · [요약](../reports/test3_prompt/ec2-linux_qwen3-14b_v3_decision_tree_t0_nothink_smoke_summary.md)

## 사람 판단

- 채택할 안:
- 근거:
- 다른 모델로 확인할 안:
- 메모:

