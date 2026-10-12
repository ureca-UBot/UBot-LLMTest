# prompts_test_v5 — 프롬프트 튜닝 5차(Instruct 2차) · 테스트 항목 · 실행 순서

v5 try1 오답 사람 검토([human_review_issues](../model_test_v5/try1/results/summary/human_review_issues.md))를 반영한 두 번째 Instruct 튜닝이다. 두 가지를 함께 바꿨다.
- **데이터**: `test_set4r` — AR·UI·CF 조회 결과를 "라벨 = 값" 문장으로 바꿨다. 또 FAQ 3건, 정답 예시의 안내 문장, AR·UI 질문, CF의 "문서 A/B"를 고쳤다.
- **프롬프트**: `v5_i2` — 덧붙임·되묻기를 허용하던 문장을 빼고, 다음 세 가지를 넣었다.
  - 답변 틀: 확정 답 + 답할 수 없는 부분 한 문장
  - 길이 제한: 질문 하나당 50자
  - "사용자는 자료를 볼 수 없다"

모델 비교 방식은 prompts_test_v4와 같다. **새 안만 이 PC에서 생성**하고, 기준선은 v5 try1의 Q4_K_M + `v4_base` 결과(EC2, Judge `v5-try1-n100`)를 `--base-from`으로 가져온다. 실행할 때 `--test prompts_test_v5`를 준다.

## 1. 목표

- 대상: `qwen3:4b-instruct` Q4_K_M(digest `0edcdef34593`), temperature 0, 이 PC(RTX 4060 Ti, Ollama 0.40.2).
- 확인할 것:
  - 환각, 특히 꼬리 문장(확인 경로·추측·정보 요청)이 줄어드는지.
  - 50자 제한 때문에 누락이 늘지 않는지(MC·MT·PI처럼 질문이 여러 개인 항목).
  - AR·UI·CF 정답률(is_open·오래된 정보·인증 실패·시행 기간).
  - FAQ ID·항목 이름 노출이 줄어드는지.

## 2. 프롬프트 안 (`prompts/chatbot/variants.json`)

| 안 | 구성 |
|---|---|
| `v4_base` (기준, v5 try1) | base · status_rules · output_order |
| `v5_i2` | **base_i2** · **status_rules_i2** · output_order |

`base_i2`가 `base`와 다른 점(파일 머리 주석에 이유):
- 삭제: "답하는 데 필요한 정보가 사용자에게 있으면 answer에서 그 정보를 요청할 수 있습니다." / "질문 일부에만 근거가 있으면 … 정보가 부족하다고 알립니다." / "근거가 없거나 무관하면 … 확인할 수 없다고 안내합니다."(마지막 두 문장은 답변 틀 2번으로 합침)
- 변경: "통신 상담 범위 밖 요청은 범위를 안내합니다" → "범위 밖이라고 알립니다"
- 추가:
  - "사용자는 FAQ 문서와 사용자 정보/API 결과를 볼 수 없습니다. answer에는 FAQ 번호·문서 ID와 조회 결과의 항목 이름을 쓰지 않고, 내용만 설명합니다."
  - answer 작성 방식 1~4: 확정 답(질문마다) / 답할 수 없는 부분은 한 문장, 이유 추측 금지 / 이 두 부분만, 되묻지 않음 / 질문 하나당 50자 이내

`status_rules_i2`가 `status_rules`와 다른 점:
- ANSWER의 "안내 문장을 덧붙이더라도 status를 낮추지 않는다" 삭제.
- PARTIAL·ABSTAIN·주의 3에서 되묻기 삭제, 괄호 예시 삭제.
- CONFLICT "어떤 문서끼리" → "어떤 내용끼리", OUT_OF_SCOPE "범위 밖이라고 알린다".

## 3. 데이터셋 `test_set4r`

`node scripts/run/build_test_set4r.js`로 만든다. xlsx에서 만들지 않으며, `prepare_dataset.js`는 멈춘다. 수정 규칙은 스크립트 안에 있고, 변경 내역은 `data/eval_sets/test_set4r/changes.csv`다. 요약은 [human_review_issues 6절](../model_test_v5/try1/results/summary/human_review_issues.md)에 있다. 문항 ID·서브셋은 test_set4와 같고 제외 문항은 없다.

## 4. 테스트 항목 (try1)

PI · CE · UI · AR · CF · SR · HR · AD · NC · MC · MT, 항목당 100건 = **1,100건**. prompts_test_v4와 같은 11항목이다.

- **EC는 앞으로 모든 테스트에서 제외한다**(2026-10-12 결정).
- RT·PS는 prompts_test_v4와 같은 이유로 뺐다.
- 건너뛰는 결정론 단계도 prompts_test_v4와 같다(정답 유사도 · NLI 근거 · 반복 일관성).

### 기준선과의 비교 범위

데이터가 바뀌어 v5 try1 기준선을 그대로 쓸 수 있는 문항이 제한된다(n100, 11항목).

| 구분 | 건수 | 항목 | 기준선 판정 |
|---|---|---|---|
| 입력·정답 그대로 | **454** | NC 100 · CE 98 · MC 97 · MT 97 · AD 62 | 그대로 비교 가능 |
| 입력 같음, 정답 예시만 바뀜 | 306 | PI 91 · SR 95 · HR 84 · AD 36 | 기준선 답변은 유효, **판정은 옛 정답 기준** |
| 입력이 바뀜 | 340 | AR 100 · UI 100 · CF 100 · FAQ 수정 문항 40 | 기준선 답변이 다른 입력에 대한 것 — **짝 비교 불가** |

- 정답만 바뀐 306건(대부분 "확인해야 합니다" 안내 문장 제거)은 기준선에 불리한 쪽이 아니다. 옛 정답이 더 많은 걸 요구했으므로, 새 안이 이 문항에서 좋아 보이는 차이 일부는 정답 변경 때문일 수 있다.
- AR·UI·CF는 새 안의 절대 수치(정답률·환각·오답 원인)로만 보고, 전후 비교는 참고로만 한다. 정확히 비교하려면 이 340건만 `v4_base`로 이 PC에서 생성해야 한다. 다만 생성 환경이 섞인다.

## 5. 스모크 (`smoke/`, 2026-10-12, Judge 없음)

`smoke/ids.txt` 24건(사람 검토에서 다룬 문항 + 항목별 대표)을 생성했다(`--try smoke`). CF 수정 전 데이터라 CF 문항은 없다. 사람이 답변을 읽고 본 결과다.

| | v4_base | v5_i2 (50자) | 50자 규칙만 뺀 안 |
|---|---|---|---|
| 평균 답변 길이 | 217자 | **52자** | 152자 |
| 꼬리 문장(확인 경로·되묻기) | 다수(SR·HR·AR 되묻기, "고객센터 문의") | 없음 | 거의 없음 |
| FAQ ID·항목 이름 노출 | MT-0188 `[FAQ-841]`, UI-0183 `FAQ-119` | 없음 | MT-0188 `FAQ-841`, AR-0191 "API 결과에서 '변경 완료 = …'" |
| 길이 때문에 빠진 내용 | — | MT-0188 두 질문 중 하나, MC-0148 주소 조건, UI-0168 인증 실패 사유, UI-0098 합계(할인액만), AR-0014 거리 | 대부분 남음 |
| 오답(사람 판단) | AR-0131(오래된 정보인데 한빛점으로 확정)·CE-0013 VIP·PI-0141 창작 | AR-0131(**영업 중 아닌 누리점**으로 확정)·CE-0013·PI-0141·UI-0171(오래된 값으로 확정) | AR-0131(한빛점으로 확정)·CE-0013·PI-0141·UI-0098(할인액을 "예시"로 보고 계산 거부) |

- 50자 제한은 꼬리를 확실히 없앴다. 하지만 모델이 "질문 하나당"이 아니라 답 전체를 50자 안팎으로 맞추는 경향이 있다(평균 52자). 여러 질문(MT·MC)이나 근거+결론이 필요한 문항(UI·AR)에서 누락이 보인다.
- 50자 규칙만 뺀 안(base_i2에서 4번만 삭제, 본실행에서는 쓰지 않아 파일은 지움)에서는 FAQ ID·항목 표기가 일부 돌아온다. "볼 수 없다" 문장만으로는 완전히 막지 못한다.
- CE-0013(40,001원 → VIP)과 PI-0141("경찰 신고 의무 없음, 기한 없음")은 모든 안이 틀렸다. 프롬프트·데이터로 해결되지 않는 모델 한계로 보인다.
- 24건이라 결론은 Judge 본실행으로 낸다.

## 6. 실행 순서

```bash
T="--test prompts_test_v5 --try try1"

# 1. 생성 (새 안만, 1,100건 — 이 PC에서 건당 약 1.5~2.5초)
node scripts/run/run_item.js qwen3:4b-instruct PI,CE,UI,AR,CF,SR,HR,AD,NC,MC,MT --size 100 $T --variant v5_i2

# 2. 배치 매니페스트
node scripts/judge/build_batch_manifest.js --batch pv5-try1 $T --runs <위 run_id>

# 3. LLM Judge (외부 전송, 정확도 1,100건 + AD 안전성 100건). 이 PC는 PATH에 codex가 없다 — Codex 앱 CLI를 지정한다
export LLM_JUDGE_CODEX_BIN="C:/Users/pc/AppData/Local/OpenAI/Codex/bin/5ea220ae823df3d7/codex.exe"
node scripts/judge/judge_prepare.js --batch pv5-try1 $T
node scripts/judge/judge_run.js --batch pv5-try1 $T --confirm-external --concurrency 8
node scripts/docgen/judge_report.js --batch pv5-try1 $T

# 4. 짝 비교 (기준: v5 try1의 Q4_K_M v4_base) — 4절의 비교 범위를 함께 볼 것
node scripts/docgen/compare_variants.js --batch pv5-try1 $T --base v4_base --base-from model_test_v5/try1/v5-try1-n100
```

## 7. 알려진 한계

- **기준선과 데이터가 다르다**(4절). 짝 비교가 온전한 문항은 454건이다.
- **기준선과 생성 환경이 다르다**(로컬 ↔ EC2, Ollama 버전 다름). prompts_test_v4와 같은 조건이다.
- 데이터와 프롬프트를 함께 바꿨다. AR·UI·CF의 변화는 둘 중 어느 쪽 효과인지 가를 수 없다.
- Judge 루브릭은 그대로(v4-judge-12)다. 정답 예시가 짧아져 Judge가 느슨해질 수 있다. 정답 예시에서 옮긴 채점 메모는 실패 조건 끝에 있다.
- 50자 기준은 정답 예시 길이와 맞지 않는 문항이 많다(정답 예시 중 50자 이내는 1,400건 중 194건). 누락이 늘면 이 기준 때문일 수 있다.
- 항목당 100건이라 100문항당 ±2건 정도의 판정 노이즈보다 작은 변화는 판단하지 않는다.
