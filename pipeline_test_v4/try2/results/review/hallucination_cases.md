# 환각 변화 케이스 원장 — single / sub / slot

[요약·제어 규칙](hallucination_progression.md) · [기계 판독 JSON](hallucination_progression.json)

환각을 한 번이라도 보인 72개 케이스. 미판정은 환각 없음과 구분한다. 각 제어는 제안이며 아직 서비스에 적용하지 않았다. status=ANSWER도 개별 문장에 근거가 없을 수 있다.

| 케이스 | 항목 | single→sub→slot | 제어 후보 | 검토 |
| --- | --- | --- | --- | --- |
| [CQ-010](#cq-010) | 모호한 질문 | 환각 → 없음 → 환각 | HC02 |  |
| [CQ-012](#cq-012) | 모호한 질문 | 환각 → 없음 → 없음 | HC02, HC04 |  |
| [CQ-018](#cq-018) | 모호한 질문 | 환각 → 없음 → 없음 | HC01, HC04 |  |
| [CQ-020](#cq-020) | 모호한 질문 | 환각 → 없음 → 없음 | HC04 |  |
| [CQ-021](#cq-021) | 모호한 질문 | 없음 → 없음 → 환각 | HC04 |  |
| [IN-007](#in-007) | 질문 내부 일부 미확인 | 환각 → 없음 → 없음 | HC02, HC04 |  |
| [IN-013](#in-013) | 질문 내부 일부 미확인 | 환각 → 없음 → 없음 | HC11, HC05 |  |
| [IN-015](#in-015) | 질문 내부 일부 미확인 | 환각 → 환각 → 환각 | HC03, HC05 |  |
| [IN-016](#in-016) | 질문 내부 일부 미확인 | 환각 → 환각 → 환각 | HC02, HC03, HC05 |  |
| [MA-001](#ma-001) | 복합·모두 답할 수 있음 | 환각 → 환각 → 환각 | HC09 |  |
| [MA-007](#ma-007) | 복합·모두 답할 수 있음 | 환각 → 없음 → 없음 | HC04 | 재교정/정합성 |
| [MA-011](#ma-011) | 복합·모두 답할 수 있음 | 환각 → 없음 → 없음 | HC11 |  |
| [MA-015](#ma-015) | 복합·모두 답할 수 있음 | 없음 → 환각 → 없음 | HC02, HC09 |  |
| [MA-017](#ma-017) | 복합·모두 답할 수 있음 | 환각 → 없음 → 없음 | HC07, HC04 |  |
| [MA-026](#ma-026) | 복합·모두 답할 수 있음 | 없음 → 없음 → 환각 | HC02, HC03, HC05 |  |
| [MA-027](#ma-027) | 복합·모두 답할 수 있음 | 환각 → 환각 → 없음 | HC01, HC05 |  |
| [MA-030](#ma-030) | 복합·모두 답할 수 있음 | 환각 → 환각 → 없음 | HC02, HC05 |  |
| [MN-003](#mn-003) | 복합·모두 답할 수 없음 | 없음 → 환각 → 없음 | HC01, HC05 |  |
| [MN-005](#mn-005) | 복합·모두 답할 수 없음 | 환각 → 없음 → 없음 | HC02, HC04 |  |
| [MN-014](#mn-014) | 복합·모두 답할 수 없음 | 환각 → 환각 → 환각 | HC01, HC04, HC05 |  |
| [MN-015](#mn-015) | 복합·모두 답할 수 없음 | 없음 → 환각 → 없음 | HC02, HC03 |  |
| [MN-020](#mn-020) | 복합·모두 답할 수 없음 | 환각 → 환각 → 환각 | HC01, HC02, HC03, HC05 |  |
| [MP-005](#mp-005) | 복합·답할 수 있음+없음 | 환각 → 환각 → 없음 | HC01, HC02, HC05 |  |
| [MP-006](#mp-006) | 복합·답할 수 있음+없음 | 없음 → 없음 → 환각 | HC04 |  |
| [MP-010](#mp-010) | 복합·답할 수 있음+없음 | 환각 → 환각 → 없음 | HC02, HC03, HC05 |  |
| [MP-012](#mp-012) | 복합·답할 수 있음+없음 | 없음 → 없음 → 환각 | HC04 |  |
| [MP-014](#mp-014) | 복합·답할 수 있음+없음 | 없음 → 없음 → 환각 | HC01, HC03, HC05 |  |
| [MP-017](#mp-017) | 복합·답할 수 있음+없음 | 없음 → 환각 → 없음 | HC01, HC05 |  |
| [MP-018](#mp-018) | 복합·답할 수 있음+없음 | 환각 → 없음 → 없음 | HC01, HC02, HC04 |  |
| [MP-019](#mp-019) | 복합·답할 수 있음+없음 | 없음 → 없음 → 환각 | HC03, HC05 |  |
| [MP-021](#mp-021) | 복합·답할 수 있음+없음 | 환각 → 환각 → 환각 | HC04 |  |
| [MP-022](#mp-022) | 복합·답할 수 있음+없음 | 환각 → 환각 → 없음 | HC03, HC05 |  |
| [MP-023](#mp-023) | 복합·답할 수 있음+없음 | 환각 → 환각 → 환각 | HC01, HC04, HC05 |  |
| [MP-025](#mp-025) | 복합·답할 수 있음+없음 | 환각 → 없음 → 없음 | HC01, HC05 |  |
| [MP-026](#mp-026) | 복합·답할 수 있음+없음 | 환각 → 없음 → 없음 | HC02, HC03, HC05 |  |
| [MP-029](#mp-029) | 복합·답할 수 있음+없음 | 환각 → 환각 → 환각 | HC01, HC05 |  |
| [MP-031](#mp-031) | 복합·답할 수 있음+없음 | 없음 → 환각 → 없음 | HC02, HC03, HC05 |  |
| [MP-033](#mp-033) | 복합·답할 수 있음+없음 | 환각 → 환각 → 없음 | HC01, HC03, HC05 |  |
| [MP-035](#mp-035) | 복합·답할 수 있음+없음 | 없음 → 환각 → 없음 | HC01, HC05 |  |
| [MP-036](#mp-036) | 복합·답할 수 있음+없음 | 환각 → 환각 → 환각 | HC02, HC05 |  |
| [MP-037](#mp-037) | 복합·답할 수 있음+없음 | 없음 → 환각 → 환각 | HC02, HC05 |  |
| [MP-040](#mp-040) | 복합·답할 수 있음+없음 | 환각 → 환각 → 환각 | HC02, HC04, HC05 |  |
| [MP-044](#mp-044) | 복합·답할 수 있음+없음 | 없음 → 환각 → 환각 | HC01, HC04, HC12, HC05 |  |
| [MP-045](#mp-045) | 복합·답할 수 있음+없음 | 없음 → 환각 → 없음 | HC01, HC05 |  |
| [MP-047](#mp-047) | 복합·답할 수 있음+없음 | 없음 → 없음 → 환각 | HC01, HC04, HC05 |  |
| [MP-056](#mp-056) | 복합·답할 수 있음+없음 | 환각 → 환각 → 환각 | HC03, HC05 |  |
| [MP-058](#mp-058) | 복합·답할 수 있음+없음 | 환각 → 없음 → 환각 | HC01, HC04, HC06, HC05 |  |
| [MP-059](#mp-059) | 복합·답할 수 있음+없음 | 환각 → 환각 → 환각 | HC01, HC02, HC05 |  |
| [MT-003](#mt-003) | 멀티턴 | 없음 → 환각 → 없음 | HC08, HC02 | 재교정/정합성 |
| [MT-006](#mt-006) | 멀티턴 | 환각 → 없음 → 없음 | HC08, HC02, HC03 |  |
| [MT-012](#mt-012) | 멀티턴 | 환각 → 없음 → 환각 | HC02, HC04 | 재교정/정합성 |
| [MT-016](#mt-016) | 멀티턴 | 없음 → 없음 → 환각 | HC08, HC02, HC05 |  |
| [MT-028](#mt-028) | 멀티턴 | 없음 → 미판정 → 환각 | HC01, HC08 |  |
| [OS-016](#os-016) | 범위 밖 포함 | 없음 → 없음 → 환각 | HC10 |  |
| [SA-022](#sa-022) | 단일·답할 수 있음 | 환각 → 환각 → 없음 | HC01, HC04 |  |
| [SB-004](#sb-004) | 단일·묻는 값 없음 | 없음 → 없음 → 환각 | HC01, HC04 |  |
| [SB-025](#sb-025) | 단일·묻는 값 없음 | 환각 → 없음 → 없음 | HC01, HC03 |  |
| [SB-034](#sb-034) | 단일·묻는 값 없음 | 환각 → 없음 → 환각 | HC01 |  |
| [SB-035](#sb-035) | 단일·묻는 값 없음 | 없음 → 환각 → 없음 | HC01, HC02 |  |
| [SB-036](#sb-036) | 단일·묻는 값 없음 | 없음 → 없음 → 환각 | HC01 |  |
| [SB-037](#sb-037) | 단일·묻는 값 없음 | 없음 → 없음 → 환각 | HC01, HC04 |  |
| [SB-038](#sb-038) | 단일·묻는 값 없음 | 없음 → 없음 → 환각 | HC01 |  |
| [SB-042](#sb-042) | 단일·묻는 값 없음 | 없음 → 없음 → 환각 | HC01, HC04 |  |
| [SB-049](#sb-049) | 단일·묻는 값 없음 | 없음 → 없음 → 환각 | HC01 |  |
| [ST-017](#st-017) | 매장 | 없음 → 미판정 → 환각 | HC06, HC01 |  |
| [ST-021](#st-021) | 매장 | 환각 → 환각 → 환각 | HC06, HC01, HC04 |  |
| [ST-027](#st-027) | 매장 | 환각 → 없음 → 없음 | HC12 |  |
| [ST-030](#st-030) | 매장 | 환각 → 없음 → 없음 | HC01, HC05 |  |
| [UD-002](#ud-002) | 사용자 정보 | 환각 → 없음 → 없음 | HC07 | 재교정/정합성 |
| [UD-013](#ud-013) | 사용자 정보 | 환각 → 없음 → 없음 | HC07 |  |
| [UD-018](#ud-018) | 사용자 정보 | 환각 → 없음 → 없음 | HC07, HC04 |  |
| [UD-024](#ud-024) | 사용자 정보 | 환각 → 없음 → 없음 | HC11, HC05 |  |

<a id="cq-010"></a>
## CQ-010 · 번호이동과 번호 변경

> 번호이동 하고 싶어요.

- 분류: 모호한 질문 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 없음 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC02](hallucination_progression.md#hc02)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 번호이동 하고 싶어요. → ANSWER; gold FAQ 2, 1076 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=1; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1031, 1255, 4
- 원본: [results.jsonl:10](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:10](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:9](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 번호이동은 휴대폰 번호를 변경하는 것으로, 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있습니다. 그러나 제공된 FAQ 문서 중에서 직접적으로 '번호이동'에 대한 정책이나 절차가 명시되어 있지 않습니다. 따라서 번호이동에 대한 구체적인 절차나 요금, 조건 등은 확인할 수 없습니다.

**모델 본문**

> 번호이동은 휴대폰 번호를 변경하는 것으로, 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있습니다. 그러나 제공된 FAQ 문서 중에서 직접적으로 '번호이동'에 대한 정책이나 절차가 명시되어 있지 않습니다. 따라서 번호이동에 대한 구체적인 절차나 요금, 조건 등은 확인할 수 없습니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 번호이동은 휴대폰 번호를 변경하는 것으로, 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있습니다.
  - 사유: 받은 FAQ의 휴대폰 번호 변경 절차를 번호이동에 적용했습니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02)

- 하위 #1: WRONG_ANSWER — 번호이동을 휴대폰 번호 변경으로 잘못 설명하고, 번호 변경 절차를 번호이동 절차로 안내했습니다.
- Judge 요약: 받은 자료에는 번호이동 절차가 없는데도 다른 서비스의 절차를 핵심 답으로 제시했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 번호이동 하고 싶어요.; FAQ 1031, 1255, 4
- 검색 #1: 번호이동 하고 싶어요.

**실제로 입력된 FAQ 원문**

- FAQ 1031: 착신전환은 어떻게 신청하고 요금은 얼마인가요?
> 착신전환 부가서비스를 신청하면 음성 전화를 지정한 국내 번호로 돌릴 수 있으며 월 요금은 부가세를 포함해 1,100원입니다. 착신전환은 국제전화나 유료 특수번호로 설정할 수 없습니다.
- FAQ 1255: 다른 통신사로 가입됐다는 문자를 받았어요.
> 다른 통신사로 가입됐다는 문자를 받았는데 본인이 신청하지 않았다면 명의도용일 수 있으니 즉시 고객센터(114)에 연락해 주세요. 명의도용 방지 서비스(엠세이퍼)에 가입하면 본인 명의의 새 회선 개통을 막을 수 있습니다.
- FAQ 4: 휴대폰 번호를 변경하려면 어떻게 하나요?
> 휴대폰 번호 변경은 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1031, 1255, 4
- 원본: [results.jsonl:10](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:10](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:6](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: MISSING_ANSWER — 번호이동 신청 방법을 답하지 않았습니다.
- Judge 요약: 모델 본문이 비어 있어 답변이 누락됐고, 시스템 고정 안내는 모델 답변으로 평가하지 않습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 번호이동 하고 싶어요.; FAQ 1031, 1255, 4
- 검색 #1: 번호이동 하고 싶어요.

**실제로 입력된 FAQ 원문**

- FAQ 1031: 착신전환은 어떻게 신청하고 요금은 얼마인가요?
> 착신전환 부가서비스를 신청하면 음성 전화를 지정한 국내 번호로 돌릴 수 있으며 월 요금은 부가세를 포함해 1,100원입니다. 착신전환은 국제전화나 유료 특수번호로 설정할 수 없습니다.
- FAQ 1255: 다른 통신사로 가입됐다는 문자를 받았어요.
> 다른 통신사로 가입됐다는 문자를 받았는데 본인이 신청하지 않았다면 명의도용일 수 있으니 즉시 고객센터(114)에 연락해 주세요. 명의도용 방지 서비스(엠세이퍼)에 가입하면 본인 명의의 새 회선 개통을 막을 수 있습니다.
- FAQ 4: 휴대폰 번호를 변경하려면 어떻게 하나요?
> 휴대폰 번호 변경은 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=1; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1031, 1255, 4
- 원본: [results.jsonl:2](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:2](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:4](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 번호이동은 휴대폰 번호를 변경하는 것으로, 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있습니다.

**모델 본문**

> 번호이동은 휴대폰 번호를 변경하는 것으로, 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있습니다.

**Judge가 표시한 주장**

- FABRICATION: 번호이동은 휴대폰 번호를 변경하는 것이다.
  - 사유: 번호이동과 번호 변경을 동일시할 근거가 없으며, 질문의 대상을 잘못 설명했습니다.
- MISATTRIBUTION: 번호이동은 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있다.
  - 사유: 휴대폰 번호 변경 FAQ의 절차를 번호이동에 적용했습니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02)

- 하위 #1: WRONG_ANSWER — 번호이동을 휴대폰 번호 변경으로 잘못 설명하고, 번호이동 신청 방법 대신 번호 변경 절차를 안내했습니다.
- Judge 요약: 챗봇은 번호이동 FAQ를 받지 않았고, 받은 번호 변경 FAQ를 번호이동 절차로 오인해 답했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 번호이동 하고 싶어요.; FAQ 1031, 1255, 4
- 검색 #1: 번호이동 하고 싶어요.
- slot #1: ANSWER; 최종 본문에 남음
> 번호이동은 휴대폰 번호를 변경하는 것으로, 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1031: 착신전환은 어떻게 신청하고 요금은 얼마인가요?
> 착신전환 부가서비스를 신청하면 음성 전화를 지정한 국내 번호로 돌릴 수 있으며 월 요금은 부가세를 포함해 1,100원입니다. 착신전환은 국제전화나 유료 특수번호로 설정할 수 없습니다.
- FAQ 1255: 다른 통신사로 가입됐다는 문자를 받았어요.
> 다른 통신사로 가입됐다는 문자를 받았는데 본인이 신청하지 않았다면 명의도용일 수 있으니 즉시 고객센터(114)에 연락해 주세요. 명의도용 방지 서비스(엠세이퍼)에 가입하면 본인 명의의 새 회선 개통을 막을 수 있습니다.
- FAQ 4: 휴대폰 번호를 변경하려면 어떻게 하나요?
> 휴대폰 번호 변경은 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있습니다.

</details>

<a id="cq-012"></a>
## CQ-012 · 실물 유심→eSIM 전환과 다른 eSIM 발급 절차

> eSIM으로 바꾸고 싶어요.

- 분류: 모호한 질문 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 없음 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC02](hallucination_progression.md#hc02), [HC04](hallucination_progression.md#hc04)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 eSIM으로 바꾸고 싶어요. → ANSWER; gold FAQ 158, 1281 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1274, 159, 158
- 원본: [results.jsonl:12](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:12](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:11](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> eSIM으로 바꾸고 싶으시면, eSIM을 지원하는 휴대폰이면 Ubot 앱에서 기존 유심을 eSIM으로 전환할 수 있습니다. 전환 후 기존 유심은 사용할 수 없습니다. 전환을 원하시면 앱에서 진행하시거나, 매장에서 직접 상담하여 전환을 신청할 수 있습니다.

**모델 본문**

> eSIM으로 바꾸고 싶으시면, eSIM을 지원하는 휴대폰이면 Ubot 앱에서 기존 유심을 eSIM으로 전환할 수 있습니다. 전환 후 기존 유심은 사용할 수 없습니다. 전환을 원하시면 앱에서 진행하시거나, 매장에서 직접 상담하여 전환을 신청할 수 있습니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 매장에서 직접 상담하여 기존 유심의 eSIM 전환을 신청할 수 있습니다.
  - 사유: 받은 자료의 매장 안내는 eSIM 신규 발급 또는 eSIM에서 실물 유심으로의 전환에 관한 것이며, 기존 유심의 eSIM 전환은 앱에서 가능하다고만 명시합니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC04](hallucination_progression.md#hc04)

- 하위 #1: CORRECT_ANSWER — eSIM 지원 휴대폰에서 앱으로 전환할 수 있고, 전환 후 기존 유심을 사용할 수 없다고 정확히 안내했습니다.
- Judge 요약: 핵심 전환 방법은 맞지만, 근거가 다른 매장 절차를 기존 유심의 eSIM 전환에 적용했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: eSIM으로 바꾸고 싶어요.; FAQ 1274, 159, 158
- 검색 #1: eSIM으로 바꾸고 싶어요.

**실제로 입력된 FAQ 원문**

- FAQ 1274: eSIM은 어떻게 개통하나요?
> Ubot 앱·홈페이지에서 eSIM 가입을 신청하면 QR 코드가 발급되며 휴대폰 설정에서 코드를 촬영하면 개통됩니다. eSIM은 매장에서도 바로 발급받을 수 있습니다.
- FAQ 159: eSIM을 쓰다가 다시 실물 유심으로 바꾸고 싶어요.
> eSIM에서 실물 유심으로 바꾸려면 매장에서 전환을 신청할 수 있습니다. 실물 유심으로 전환되면 기존 eSIM 프로필은 비활성화됩니다.
- FAQ 158: 쓰던 유심을 eSIM으로 바꿀 수 있나요?
> eSIM을 지원하는 휴대폰이라면 앱에서 기존 유심을 eSIM으로 전환할 수 있습니다. 유심에서 eSIM으로 전환이 끝나면 기존 유심은 사용할 수 없습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1274, 159, 158
- 원본: [results.jsonl:12](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:12](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:10](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: MISSING_ANSWER — 앱에서 기존 유심을 eSIM으로 전환할 수 있다는 안내를 하지 않았습니다.
- Judge 요약: 모델 답변이 비어 있어 답할 수 있는 질문에 답하지 않았으며, 시스템 고정 안내는 평가 대상이 아닙니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: eSIM으로 바꾸고 싶어요.; FAQ 1274, 159, 158
- 검색 #1: eSIM으로 바꾸고 싶어요.

**실제로 입력된 FAQ 원문**

- FAQ 1274: eSIM은 어떻게 개통하나요?
> Ubot 앱·홈페이지에서 eSIM 가입을 신청하면 QR 코드가 발급되며 휴대폰 설정에서 코드를 촬영하면 개통됩니다. eSIM은 매장에서도 바로 발급받을 수 있습니다.
- FAQ 159: eSIM을 쓰다가 다시 실물 유심으로 바꾸고 싶어요.
> eSIM에서 실물 유심으로 바꾸려면 매장에서 전환을 신청할 수 있습니다. 실물 유심으로 전환되면 기존 eSIM 프로필은 비활성화됩니다.
- FAQ 158: 쓰던 유심을 eSIM으로 바꿀 수 있나요?
> eSIM을 지원하는 휴대폰이라면 앱에서 기존 유심을 eSIM으로 전환할 수 있습니다. 유심에서 eSIM으로 전환이 끝나면 기존 유심은 사용할 수 없습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1274, 159, 158
- 원본: [results.jsonl:3](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:3](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:2](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> eSIM으로 바꾸고 싶으시면, eSIM을 지원하는 휴대폰이라면 Ubot 앱에서 기존 유심을 eSIM으로 전환할 수 있습니다. 전환 후 기존 유심은 사용할 수 없습니다.

**모델 본문**

> eSIM으로 바꾸고 싶으시면, eSIM을 지원하는 휴대폰이라면 Ubot 앱에서 기존 유심을 eSIM으로 전환할 수 있습니다. 전환 후 기존 유심은 사용할 수 없습니다.

- 하위 #1: CORRECT_ANSWER — eSIM 지원 휴대폰에서 앱으로 전환할 수 있고 기존 유심은 사용할 수 없다는 핵심 내용을 정확히 안내했습니다.
- Judge 요약: 답변은 제공된 FAQ 158에 근거하며, 사용자의 전환 요청에 필요한 핵심 정보를 전달했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: eSIM으로 바꾸고 싶어요.; FAQ 1274, 159, 158
- 검색 #1: eSIM으로 바꾸고 싶어요.
- slot #1: ANSWER; 최종 본문에 남음
> eSIM으로 바꾸고 싶으시면, eSIM을 지원하는 휴대폰이라면 Ubot 앱에서 기존 유심을 eSIM으로 전환할 수 있습니다. 전환 후 기존 유심은 사용할 수 없습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1274: eSIM은 어떻게 개통하나요?
> Ubot 앱·홈페이지에서 eSIM 가입을 신청하면 QR 코드가 발급되며 휴대폰 설정에서 코드를 촬영하면 개통됩니다. eSIM은 매장에서도 바로 발급받을 수 있습니다.
- FAQ 159: eSIM을 쓰다가 다시 실물 유심으로 바꾸고 싶어요.
> eSIM에서 실물 유심으로 바꾸려면 매장에서 전환을 신청할 수 있습니다. 실물 유심으로 전환되면 기존 eSIM 프로필은 비활성화됩니다.
- FAQ 158: 쓰던 유심을 eSIM으로 바꿀 수 있나요?
> eSIM을 지원하는 휴대폰이라면 앱에서 기존 유심을 eSIM으로 전환할 수 있습니다. 유심에서 eSIM으로 전환이 끝나면 기존 유심은 사용할 수 없습니다.

</details>

<a id="cq-018"></a>
## CQ-018 · 로밍 에그의 사전 로밍 신청 필요 여부

> 로밍 신청하려고요.

- 분류: 모호한 질문 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 없음 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 로밍 신청하려고요. → ANSWER; gold FAQ 29 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: context_sections_changed
- 입력 차이 v4sub_slot: context_sections_changed

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1020, 29
- 원본: [results.jsonl:18](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:18](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:17](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 로밍은 앱, 홈페이지, 고객센터 또는 로밍센터에서 신청할 수 있습니다. 해외에서 로밍 에그를 사용하려면 로밍을 먼저 신청해야 합니다.

**모델 본문**

> 로밍은 앱, 홈페이지, 고객센터 또는 로밍센터에서 신청할 수 있습니다. 해외에서 로밍 에그를 사용하려면 로밍을 먼저 신청해야 합니다.

**Judge가 표시한 주장**

- FABRICATION: 해외에서 로밍 에그를 사용하려면 로밍을 먼저 신청해야 합니다.
  - 사유: 제공된 FAQ에는 로밍 에그 사용 전에 로밍 신청이 필요하다는 조건이 없습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04)

- 하위 #1: CORRECT_ANSWER — 앱, 홈페이지, 고객센터 또는 로밍센터에서 신청할 수 있다는 핵심 답을 전달했습니다.
- Judge 요약: 신청 방법은 정확하지만, 근거 없는 로밍 에그 사용 조건을 덧붙였습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 로밍 신청하려고요.; FAQ 1020, 29
- 검색 #1: 로밍 신청하려고요.

**실제로 입력된 FAQ 원문**

- FAQ 1020: 해외에서 포켓 와이파이(로밍 에그)를 쓸 수 있나요?
> 해외에서 로밍 에그를 대여하면 여러 기기가 데이터를 함께 사용할 수 있습니다. 해외 로밍 에그의 대여 방법과 요금은 상품에 따라 다르니 출국 전에 확인해 주세요.
- FAQ 29: 해외 로밍은 어떻게 신청하나요?
> 해외 로밍은 앱, 홈페이지, 고객센터 또는 로밍센터에서 신청할 수 있습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1020, 29
- 원본: [results.jsonl:18](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:18](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:16](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 해외 로밍은 앱, 홈페이지, 고객센터 또는 로밍센터에서 신청할 수 있습니다.

**모델 본문**

> 해외 로밍은 앱, 홈페이지, 고객센터 또는 로밍센터에서 신청할 수 있습니다.

- 하위 #1: CORRECT_ANSWER — FAQ에 나온 로밍 신청 경로 네 가지를 정확히 안내했습니다.
- Judge 요약: 답변이 제공된 FAQ 29와 일치하며 근거 없는 주장이 없습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 로밍 신청하려고요.; FAQ 1020, 29
- 검색 #1: 로밍 신청하려고요.

**실제로 입력된 FAQ 원문**

- FAQ 1020: 해외에서 포켓 와이파이(로밍 에그)를 쓸 수 있나요?
> 해외에서 로밍 에그를 대여하면 여러 기기가 데이터를 함께 사용할 수 있습니다. 해외 로밍 에그의 대여 방법과 요금은 상품에 따라 다르니 출국 전에 확인해 주세요.
- FAQ 29: 해외 로밍은 어떻게 신청하나요?
> 해외 로밍은 앱, 홈페이지, 고객센터 또는 로밍센터에서 신청할 수 있습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1020, 29
- 원본: [results.jsonl:134](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:134](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:131](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 해외 로밍은 앱, 홈페이지, 고객센터 또는 로밍센터에서 신청할 수 있습니다.

**모델 본문**

> 해외 로밍은 앱, 홈페이지, 고객센터 또는 로밍센터에서 신청할 수 있습니다.

- 하위 #1: CORRECT_ANSWER — FAQ 29의 해외 로밍 신청 경로를 정확히 안내했습니다.
- Judge 요약: 모델 답변이 제공된 FAQ의 신청 방법과 일치하며 근거 없는 주장이 없습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 로밍 신청하려고요.; FAQ 1020, 29
- 검색 #1: 로밍 신청하려고요.
- slot #1: ANSWER; 최종 본문에 남음
> 해외 로밍은 앱, 홈페이지, 고객센터 또는 로밍센터에서 신청할 수 있습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1020: 해외에서 포켓 와이파이(로밍 에그)를 쓸 수 있나요?
> 해외에서 로밍 에그를 대여하면 여러 기기가 데이터를 함께 사용할 수 있습니다. 해외 로밍 에그의 대여 방법과 요금은 상품에 따라 다르니 출국 전에 확인해 주세요.
- FAQ 29: 해외 로밍은 어떻게 신청하나요?
> 해외 로밍은 앱, 홈페이지, 고객센터 또는 로밍센터에서 신청할 수 있습니다.

</details>

<a id="cq-020"></a>
## CQ-020 · 부가서비스 일할 계산의 예외

> 부가서비스 해지하고 싶어요.

- 분류: 모호한 질문 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 없음 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC04](hallucination_progression.md#hc04)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 부가서비스 해지하고 싶어요. → ANSWER; gold FAQ 1444 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1444, 45, 1337
- 원본: [results.jsonl:20](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:20](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:19](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 부가서비스 해지 방법은 Ubot 앱 또는 홈페이지의 부가서비스 메뉴, 또는 고객센터(114)에서 가능합니다. 월정액 부가서비스를 해지하면 해지한 달까지 요금이 청구됩니다. 월 중간에 해지할 경우, 해지한 날까지의 요금이 계산되어 청구됩니다.

**모델 본문**

> 부가서비스 해지 방법은 Ubot 앱 또는 홈페이지의 부가서비스 메뉴, 또는 고객센터(114)에서 가능합니다. 월정액 부가서비스를 해지하면 해지한 달까지 요금이 청구됩니다. 월 중간에 해지할 경우, 해지한 날까지의 요금이 계산되어 청구됩니다.

**Judge가 표시한 주장**

- UNSUPPORTED_GENERALIZATION: 월 중간에 해지하면 해지한 날까지의 요금이 계산되어 청구됩니다.
  - 사유: 자료는 대부분의 월정액 부가서비스에만 일할 계산이 적용되며, 월 요금 전액이 청구되는 상품도 있다고 설명합니다.
- 적용 후보: [HC04](hallucination_progression.md#hc04)

- 하위 #1: CORRECT_ANSWER — 앱·홈페이지의 부가서비스 메뉴와 고객센터(114)를 통한 해지 방법을 맞게 안내했습니다.
- Judge 요약: 해지 방법은 정확하지만, 월 중간 해지 시 일할 계산을 예외 없이 적용되는 것처럼 단정했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 부가서비스 해지하고 싶어요.; FAQ 1444, 45, 1337
- 검색 #1: 부가서비스 해지하고 싶어요.

**실제로 입력된 FAQ 원문**

- FAQ 1444: 부가서비스는 어떻게 해지하나요?
> 부가서비스는 Ubot 앱·홈페이지의 부가서비스 메뉴나 고객센터(114)에서 해지할 수 있습니다. 월정액 부가서비스를 해지해도 해지한 달까지 요금이 청구됩니다.
- FAQ 45: 서비스를 해지하려면 어떻게 하나요?
> 통신 서비스를 해지하려면 본인 인증 후 고객센터 또는 매장에서 해지를 신청할 수 있습니다.
- FAQ 1337: 부가서비스를 월 중간에 해지하면 요금은 어떻게 되나요?
> 대부분의 월정액 부가서비스는 월 중간에 해지하면 해지한 날까지의 요금이 일할 계산되어 청구됩니다. 데이터 플러스처럼 월 단위로 제공하는 상품은 중간에 해지해도 그달 요금이 모두 청구되고 말일까지 사용할 수 있습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1444, 45, 1337
- 원본: [results.jsonl:20](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:20](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:17](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 부가서비스는 Ubot 앱·홈페이지의 부가서비스 메뉴나 고객센터(114)에서 해지할 수 있습니다.

**모델 본문**

> 부가서비스는 Ubot 앱·홈페이지의 부가서비스 메뉴나 고객센터(114)에서 해지할 수 있습니다.

- 하위 #1: CORRECT_ANSWER — 부가서비스 해지 경로를 FAQ와 일치하게 안내했습니다.
- Judge 요약: 해지 방법이라는 핵심 질문에 자료에 근거해 답했으며, 요금 관련 부가 설명을 생략한 것은 오류가 아닙니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 부가서비스 해지하고 싶어요.; FAQ 1444, 45, 1337
- 검색 #1: 부가서비스 해지하고 싶어요.

**실제로 입력된 FAQ 원문**

- FAQ 1444: 부가서비스는 어떻게 해지하나요?
> 부가서비스는 Ubot 앱·홈페이지의 부가서비스 메뉴나 고객센터(114)에서 해지할 수 있습니다. 월정액 부가서비스를 해지해도 해지한 달까지 요금이 청구됩니다.
- FAQ 45: 서비스를 해지하려면 어떻게 하나요?
> 통신 서비스를 해지하려면 본인 인증 후 고객센터 또는 매장에서 해지를 신청할 수 있습니다.
- FAQ 1337: 부가서비스를 월 중간에 해지하면 요금은 어떻게 되나요?
> 대부분의 월정액 부가서비스는 월 중간에 해지하면 해지한 날까지의 요금이 일할 계산되어 청구됩니다. 데이터 플러스처럼 월 단위로 제공하는 상품은 중간에 해지해도 그달 요금이 모두 청구되고 말일까지 사용할 수 있습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1444, 45, 1337
- 원본: [results.jsonl:136](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:136](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:133](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 부가서비스는 Ubot 앱·홈페이지의 부가서비스 메뉴나 고객센터(114)에서 해지할 수 있습니다. 월정액 부가서비스를 해지해도 해지한 달까지 요금이 청구됩니다.

**모델 본문**

> 부가서비스는 Ubot 앱·홈페이지의 부가서비스 메뉴나 고객센터(114)에서 해지할 수 있습니다. 월정액 부가서비스를 해지해도 해지한 달까지 요금이 청구됩니다.

- 하위 #1: CORRECT_ANSWER — 부가서비스 해지 경로와 월정액 요금 안내를 근거 FAQ대로 답했습니다.
- Judge 요약: 모델 답변이 제공된 FAQ 1444와 일치하며 근거 없는 주장이 없습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 부가서비스 해지하고 싶어요.; FAQ 1444, 45, 1337
- 검색 #1: 부가서비스 해지하고 싶어요.
- slot #1: ANSWER; 최종 본문에 남음
> 부가서비스는 Ubot 앱·홈페이지의 부가서비스 메뉴나 고객센터(114)에서 해지할 수 있습니다. 월정액 부가서비스를 해지해도 해지한 달까지 요금이 청구됩니다.

**실제로 입력된 FAQ 원문**

- FAQ 1444: 부가서비스는 어떻게 해지하나요?
> 부가서비스는 Ubot 앱·홈페이지의 부가서비스 메뉴나 고객센터(114)에서 해지할 수 있습니다. 월정액 부가서비스를 해지해도 해지한 달까지 요금이 청구됩니다.
- FAQ 45: 서비스를 해지하려면 어떻게 하나요?
> 통신 서비스를 해지하려면 본인 인증 후 고객센터 또는 매장에서 해지를 신청할 수 있습니다.
- FAQ 1337: 부가서비스를 월 중간에 해지하면 요금은 어떻게 되나요?
> 대부분의 월정액 부가서비스는 월 중간에 해지하면 해지한 날까지의 요금이 일할 계산되어 청구됩니다. 데이터 플러스처럼 월 단위로 제공하는 상품은 중간에 해지해도 그달 요금이 모두 청구되고 말일까지 사용할 수 있습니다.

</details>

<a id="cq-021"></a>
## CQ-021 · 결제 유도와 실제 결제 발생의 조건 차이

> 이상한 문자를 받았어요.

- 분류: 모호한 질문 · 주된 주장 영역: FAQ 사실·정책
- 변화: **없음 → 없음 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC04](hallucination_progression.md#hc04)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 이상한 문자를 받았어요. → ANSWER; gold FAQ 330, 1466 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 330, 1246, 62
- 원본: [results.jsonl:21](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:21](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:21](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 이상한 문자를 받았다면, 링크가 담겨 있다면 그 링크를 누르지 말고 앱에서 스팸으로 신고해 주세요. 만약 문자가 협박이나 욕설을 포함하고 있다면, 경찰에 신고하여 발신자를 확인받을 수 있습니다. 문자 메시지를 받지 못하는 상황과는 다릅니다.

**모델 본문**

> 이상한 문자를 받았다면, 링크가 담겨 있다면 그 링크를 누르지 말고 앱에서 스팸으로 신고해 주세요. 만약 문자가 협박이나 욕설을 포함하고 있다면, 경찰에 신고하여 발신자를 확인받을 수 있습니다. 문자 메시지를 받지 못하는 상황과는 다릅니다.

- 하위 #1: CORRECT_ANSWER — 이상한 링크가 담긴 문자는 링크를 누르지 말고 앱에서 스팸 신고하라는 핵심 안내를 전달했습니다.
- Judge 요약: 핵심 답변과 추가 안내가 챗봇이 받은 FAQ에 근거하며, 자료에 없는 사실을 지어내지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 이상한 문자를 받았어요.; FAQ 330, 1246, 62
- 검색 #1: 이상한 문자를 받았어요.

**실제로 입력된 FAQ 원문**

- FAQ 330: 이상한 링크가 담긴 문자가 왔어요.
> 이상한 링크가 담긴 문자를 받았다면 링크를 누르지 말고 앱에서 스팸으로 신고해 주세요. 이상한 링크를 통해 결제가 발생했다면 고객센터로 연락해 주세요.
- FAQ 1246: 협박이나 욕설 문자를 받았는데 보낸 사람을 알 수 있나요?
> 번호를 숨기고 보낸 협박·욕설 문자의 발신자 정보는 통신사가 개인에게 알려 줄 수 없습니다. 협박·욕설 문자를 경찰에 신고하면 수사기관이 법적 절차에 따라 발신자를 확인할 수 있으니 문자를 지우지 말고 보관해 주세요.
- FAQ 62: 문자 메시지를 받지 못하고 있어요.
> 문자 메시지를 받지 못한다면 수신 차단 설정과 저장 공간, 네트워크 상태를 확인해 주세요.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 330, 1246, 62
- 원본: [results.jsonl:21](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:21](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:18](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 이상한 문자를 받았다면, 링크가 담겨 있다면 그 링크를 누르지 말고 앱에서 스팸으로 신고해 주세요. 만약 문자가 협박이나 욕설을 포함하고 있다면, 경찰에 신고하여 발신자를 확인받을 수 있습니다. 문자 메시지를 받지 못하는 상황과는 다릅니다.

**모델 본문**

> 이상한 문자를 받았다면, 링크가 담겨 있다면 그 링크를 누르지 말고 앱에서 스팸으로 신고해 주세요. 만약 문자가 협박이나 욕설을 포함하고 있다면, 경찰에 신고하여 발신자를 확인받을 수 있습니다. 문자 메시지를 받지 못하는 상황과는 다릅니다.

- 하위 #1: CORRECT_ANSWER — 이상한 링크가 있다면 누르지 말고 앱에서 스팸 신고하라는 핵심 안내를 전달했습니다.
- Judge 요약: 답변의 링크 문자와 협박·욕설 문자 안내는 모두 챗봇이 받은 FAQ에 근거합니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 이상한 문자를 받았어요.; FAQ 330, 1246, 62
- 검색 #1: 이상한 문자를 받았어요.

**실제로 입력된 FAQ 원문**

- FAQ 330: 이상한 링크가 담긴 문자가 왔어요.
> 이상한 링크가 담긴 문자를 받았다면 링크를 누르지 말고 앱에서 스팸으로 신고해 주세요. 이상한 링크를 통해 결제가 발생했다면 고객센터로 연락해 주세요.
- FAQ 1246: 협박이나 욕설 문자를 받았는데 보낸 사람을 알 수 있나요?
> 번호를 숨기고 보낸 협박·욕설 문자의 발신자 정보는 통신사가 개인에게 알려 줄 수 없습니다. 협박·욕설 문자를 경찰에 신고하면 수사기관이 법적 절차에 따라 발신자를 확인할 수 있으니 문자를 지우지 말고 보관해 주세요.
- FAQ 62: 문자 메시지를 받지 못하고 있어요.
> 문자 메시지를 받지 못한다면 수신 차단 설정과 저장 공간, 네트워크 상태를 확인해 주세요.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 330, 1246, 62
- 원본: [results.jsonl:137](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:137](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:135](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 이상한 문자를 받았다면 링크를 누르지 말고 앱에서 스팸으로 신고해 주세요. 만약 이상한 문자가 결제를 유도했다면 고객센터로 연락해 주세요.

**모델 본문**

> 이상한 문자를 받았다면 링크를 누르지 말고 앱에서 스팸으로 신고해 주세요. 만약 이상한 문자가 결제를 유도했다면 고객센터로 연락해 주세요.

**Judge가 표시한 주장**

- UNSUPPORTED_GENERALIZATION: 이상한 문자가 결제를 유도했다면 고객센터로 연락해 주세요.
  - 사유: 받은 FAQ는 이상한 링크를 통해 결제가 발생한 경우에만 고객센터 연락을 안내합니다.
- 적용 후보: [HC04](hallucination_progression.md#hc04)

- 하위 #1: WRONG_ANSWER — 링크를 누르지 말고 신고하라는 안내는 맞지만, 고객센터 연락 조건을 결제 발생이 아닌 결제 유도로 바꿨습니다.
- Judge 요약: 기본 대응은 근거에 맞지만, 결제 관련 핵심 조건을 근거 없이 넓혔습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 이상한 문자를 받았어요.; FAQ 330, 1246, 62
- 검색 #1: 이상한 문자를 받았어요.
- slot #1: ANSWER; 최종 본문에 남음
> 이상한 문자를 받았다면 링크를 누르지 말고 앱에서 스팸으로 신고해 주세요. 만약 이상한 문자가 결제를 유도했다면 고객센터로 연락해 주세요.

**실제로 입력된 FAQ 원문**

- FAQ 330: 이상한 링크가 담긴 문자가 왔어요.
> 이상한 링크가 담긴 문자를 받았다면 링크를 누르지 말고 앱에서 스팸으로 신고해 주세요. 이상한 링크를 통해 결제가 발생했다면 고객센터로 연락해 주세요.
- FAQ 1246: 협박이나 욕설 문자를 받았는데 보낸 사람을 알 수 있나요?
> 번호를 숨기고 보낸 협박·욕설 문자의 발신자 정보는 통신사가 개인에게 알려 줄 수 없습니다. 협박·욕설 문자를 경찰에 신고하면 수사기관이 법적 절차에 따라 발신자를 확인할 수 있으니 문자를 지우지 말고 보관해 주세요.
- FAQ 62: 문자 메시지를 받지 못하고 있어요.
> 문자 메시지를 받지 못한다면 수신 차단 설정과 저장 공간, 네트워크 상태를 확인해 주세요.

</details>

<a id="in-007"></a>
## IN-007 · 본인 휴대폰 분실 후 임대와 임대폰 분실 후 재대여

> 임대폰 대여 조건을 분실 변상금까지 정리해 주세요.

- 분류: 질문 내부 일부 미확인 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 없음 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC02](hallucination_progression.md#hc02), [HC04](hallucination_progression.md#hc04)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 임대폰 대여 조건을 분실 변상금까지 정리해 주세요. → ANSWER; gold FAQ 1394, 1456 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1456
- 원본: [results.jsonl:37](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:37](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:35](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 임대폰 분실 시 Ubot 매장에서 신분증을 제시하면 분실 당시에 쓸 임대폰을 빌릴 수 있습니다. 분실 시 빌린 임대폰은 최초 7일 무료이며, 이후 하루 2,200원이 청구됩니다. 또한, 임대폰을 잃어버리거나 파손하면 정해진 변상금이 청구됩니다. 그러나 변상금의 구체적인 금액은 FAQ에 명시되어 있지 않습니다.

**모델 본문**

> 임대폰 분실 시 Ubot 매장에서 신분증을 제시하면 분실 당시에 쓸 임대폰을 빌릴 수 있습니다. 분실 시 빌린 임대폰은 최초 7일 무료이며, 이후 하루 2,200원이 청구됩니다. 또한, 임대폰을 잃어버리거나 파손하면 정해진 변상금이 청구됩니다. 그러나 변상금의 구체적인 금액은 FAQ에 명시되어 있지 않습니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 임대폰 분실 시 Ubot 매장에서 신분증을 제시하면 임대폰을 빌릴 수 있습니다.
  - 사유: FAQ는 기존 휴대폰을 분실 신고한 뒤 신분증을 제시하는 경우를 설명하며, 임대폰 분실 후 재대여 조건은 제시하지 않습니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC04](hallucination_progression.md#hc04)

- 하위 #1: WRONG_ANSWER — 최초 7일 무료·이후 하루 2,200원·분실·파손 시 변상금은 맞지만, 필수 조건인 분실 신고를 빠뜨리고 임대폰 분실 시 대여할 수 있다고 잘못 설명했습니다.
- Judge 요약: 요금과 변상금 부과 및 금액 미기재 안내는 근거에 맞지만, 대여 대상과 필수 신고 조건을 잘못 전달했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 임대폰 대여 조건을 분실 변상금까지 정리해 주세요.; FAQ 1456
- 검색 #1: 임대폰 대여 조건을 분실 변상금까지 정리해 주세요.

**실제로 입력된 FAQ 원문**

- FAQ 1456: 분실한 동안 쓸 임대폰을 빌릴 수 있나요?
> 분실 신고 후 Ubot 매장에서 신분증을 보여 주면 임대폰을 빌릴 수 있습니다. 분실 시 빌린 임대폰은 최초 7일 무료이고 이후 하루 2,200원이 청구됩니다. 임대폰을 잃어버리거나 파손하면 정해진 변상금이 청구됩니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1456
- 원본: [results.jsonl:37](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:37](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:35](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 분실한 동안 쓸 임대폰을 빌릴 수 있습니다. 분실 신고 후 Ubot 매장에서 신분증을 보여 주면 임대폰을 빌릴 수 있으며, 분실 시 빌린 임대폰은 최초 7일 무료입니다. 이후 하루 2,200원이 청구됩니다. 또한, 임대폰을 잃어버리거나 파손하면 정해진 변상금이 청구됩니다.

**모델 본문**

> 분실한 동안 쓸 임대폰을 빌릴 수 있습니다. 분실 신고 후 Ubot 매장에서 신분증을 보여 주면 임대폰을 빌릴 수 있으며, 분실 시 빌린 임대폰은 최초 7일 무료입니다. 이후 하루 2,200원이 청구됩니다. 또한, 임대폰을 잃어버리거나 파손하면 정해진 변상금이 청구됩니다.

- 하위 #1: CORRECT_ANSWER — 분실 시 대여 조건과 요금, 임대폰 분실·파손 시 변상금 청구를 제공된 FAQ에 맞게 설명했습니다.
- Judge 요약: 수리 중 대여 조건과 변상금 액수는 답하지 않았지만 부분 답변이 허용되며, 답한 내용은 모두 제공 자료에 근거합니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 임대폰 대여 조건을 분실 변상금까지 정리해 주세요.; FAQ 1456
- 검색 #1: 임대폰 대여 조건을 분실 변상금까지 정리해 주세요.

**실제로 입력된 FAQ 원문**

- FAQ 1456: 분실한 동안 쓸 임대폰을 빌릴 수 있나요?
> 분실 신고 후 Ubot 매장에서 신분증을 보여 주면 임대폰을 빌릴 수 있습니다. 분실 시 빌린 임대폰은 최초 7일 무료이고 이후 하루 2,200원이 청구됩니다. 임대폰을 잃어버리거나 파손하면 정해진 변상금이 청구됩니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1456
- 원본: [results.jsonl:144](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:144](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:142](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 분실한 동안 쓸 임대폰을 빌릴 수 있습니다. 분실 신고 후 Ubot 매장에서 신분증을 보여 주면 임대폰을 빌릴 수 있으며, 분실 시 빌린 임대폰은 최초 7일 무료입니다. 이후 하루 2,200원이 청구됩니다. 임대폰을 잃어버리거나 파손하면 정해진 변상금이 청구됩니다.

**모델 본문**

> 분실한 동안 쓸 임대폰을 빌릴 수 있습니다. 분실 신고 후 Ubot 매장에서 신분증을 보여 주면 임대폰을 빌릴 수 있으며, 분실 시 빌린 임대폰은 최초 7일 무료입니다. 이후 하루 2,200원이 청구됩니다. 임대폰을 잃어버리거나 파손하면 정해진 변상금이 청구됩니다.

- 하위 #1: CORRECT_ANSWER — 분실 시 대여 조건, 이용 요금, 임대폰 분실·파손 시 변상금 청구를 자료대로 설명했습니다.
- Judge 요약: 받은 FAQ에 근거해 답했으며, 자료에 없는 변상금 액수는 지어내지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 임대폰 대여 조건을 분실 변상금까지 정리해 주세요.; FAQ 1456
- 검색 #1: 임대폰 대여 조건을 분실 변상금까지 정리해 주세요.
- slot #1: ANSWER; 최종 본문에 남음
> 분실한 동안 쓸 임대폰을 빌릴 수 있습니다. 분실 신고 후 Ubot 매장에서 신분증을 보여 주면 임대폰을 빌릴 수 있으며, 분실 시 빌린 임대폰은 최초 7일 무료입니다. 이후 하루 2,200원이 청구됩니다. 임대폰을 잃어버리거나 파손하면 정해진 변상금이 청구됩니다.

**실제로 입력된 FAQ 원문**

- FAQ 1456: 분실한 동안 쓸 임대폰을 빌릴 수 있나요?
> 분실 신고 후 Ubot 매장에서 신분증을 보여 주면 임대폰을 빌릴 수 있습니다. 분실 시 빌린 임대폰은 최초 7일 무료이고 이후 하루 2,200원이 청구됩니다. 임대폰을 잃어버리거나 파손하면 정해진 변상금이 청구됩니다.

</details>

<a id="in-013"></a>
## IN-013 · 할인율 미제공과 제공된 1일 1회 조건 분리

> 멤버십 제휴 할인 규칙을 할인율까지 알려 주세요.

- 분류: 질문 내부 일부 미확인 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 없음 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC11](hallucination_progression.md#hc11), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 멤버십 제휴 할인 규칙을 할인율까지 알려 주세요. → ANSWER; gold FAQ 287, 1628 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: context_sections_changed
- 입력 차이 v4sub_slot: context_sections_changed

### v1 single

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 287
- 원본: [results.jsonl:43](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:43](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:45](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 멤버십 제휴 할인에 대한 할인율 정보는 제공된 FAQ에서 명시되어 있지 않습니다. 관련된 할인율이나 세부 조건에 대한 내용이 없습니다.

**모델 본문**

> 멤버십 제휴 할인에 대한 할인율 정보는 제공된 FAQ에서 명시되어 있지 않습니다. 관련된 할인율이나 세부 조건에 대한 내용이 없습니다.

**Judge가 표시한 주장**

- FABRICATION: 세부 조건에 대한 내용이 없습니다.
  - 사유: 제공된 FAQ에 멤버십 할인은 1일 1회로 제한된다는 조건이 있습니다.
- 적용 후보: [HC11](hallucination_progression.md#hc11), [HC05](hallucination_progression.md#hc05)

- 하위 #1: MISSING_ANSWER — 할인율이 없다는 점만 말하고 바코드 제시와 1일 1회 제한은 답하지 않았습니다.
- Judge 요약: 할인율은 자료에 없지만, 답할 수 있는 할인 방법과 사용 제한을 누락하고 조건도 없다고 잘못 말했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 멤버십 제휴 할인 규칙을 할인율까지 알려 주세요.; FAQ 287
- 검색 #1: 멤버십 제휴 할인 규칙을 할인율까지 알려 주세요.

**실제로 입력된 FAQ 원문**

- FAQ 287: 멤버십 할인은 어떻게 받나요?
> 멤버십 할인을 받으려면 제휴처에서 앱의 멤버십 바코드를 제시하면 됩니다. 멤버십 할인 사용은 1일 1회로 제한됩니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 287
- 원본: [results.jsonl:43](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:43](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:40](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: MISSING_ANSWER — 자료에 있는 바코드 제시 방법과 1일 1회 제한도 답하지 않았습니다.
- Judge 요약: 모델 본문이 비어 있어 답변은 누락됐지만, 근거 없는 주장도 없습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 멤버십 제휴 할인 규칙을 할인율까지 알려 주세요.; FAQ 287
- 검색 #1: 멤버십 제휴 할인 규칙을 할인율까지 알려 주세요.

**실제로 입력된 FAQ 원문**

- FAQ 287: 멤버십 할인은 어떻게 받나요?
> 멤버십 할인을 받으려면 제휴처에서 앱의 멤버십 바코드를 제시하면 됩니다. 멤버십 할인 사용은 1일 1회로 제한됩니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 287
- 원본: [results.jsonl:16](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:16](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:18](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: MISSING_ANSWER — 바코드 제시와 1일 1회 제한은 안내할 수 있었지만 모델 본문이 비어 있습니다.
- Judge 요약: 시스템 고정 안내는 평가 대상이 아니며, 모델은 근거 있는 할인 이용 규칙에도 답하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 멤버십 제휴 할인 규칙을 할인율까지 알려 주세요.; FAQ 287
- 검색 #1: 멤버십 제휴 할인 규칙을 할인율까지 알려 주세요.
- slot #1: ABSTAIN; 최종 본문에서 제거
> 멤버십 제휴 할인에 대한 할인율은 FAQ 문서에 명시되어 있지 않습니다. 제휴 할인은 제휴처에서 앱의 멤버십 바코드를 제시하면 가능하지만, 할인율에 대한 구체적인 정보는 제공되지 않았습니다.

**실제로 입력된 FAQ 원문**

- FAQ 287: 멤버십 할인은 어떻게 받나요?
> 멤버십 할인을 받으려면 제휴처에서 앱의 멤버십 바코드를 제시하면 됩니다. 멤버십 할인 사용은 1일 1회로 제한됩니다.

</details>

<a id="in-015"></a>
## IN-015 · 영화 이용 횟수와 예매 가능 매수

> VIP 영화 혜택 사용 조건을 예매 가능 매수까지 알려 주세요.

- 분류: 질문 내부 일부 미확인 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 환각 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 VIP 영화 혜택 사용 조건을 예매 가능 매수까지 알려 주세요. → ANSWER; gold FAQ 1362, 1363 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: context_sections_changed
- 입력 차이 v4sub_slot: context_sections_changed

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1362
- 원본: [results.jsonl:45](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:45](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:43](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> VIP 영화 혜택의 사용 조건은 매월 영화 예매 1회를 포함한 전용 혜택을 받을 수 있다는 것입니다. 예매 가능 매수는 매월 1회로 제한됩니다. 다만, 예매 가능 매수에 대한 명시적인 제한 조건이나 예매 가능 수량의 상세 정보는 제공된 FAQ에서 명시되어 있지 않습니다. 따라서 예매 가능 매수의 정확한 수치는 확인할 수 없습니다.

**모델 본문**

> VIP 영화 혜택의 사용 조건은 매월 영화 예매 1회를 포함한 전용 혜택을 받을 수 있다는 것입니다. 예매 가능 매수는 매월 1회로 제한됩니다. 다만, 예매 가능 매수에 대한 명시적인 제한 조건이나 예매 가능 수량의 상세 정보는 제공된 FAQ에서 명시되어 있지 않습니다. 따라서 예매 가능 매수의 정확한 수치는 확인할 수 없습니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 예매 가능 매수는 매월 1회로 제한됩니다.
  - 사유: FAQ의 월 1회는 영화 예매 혜택의 이용 횟수이며, 한 번에 예매 가능한 매수는 제시되지 않았습니다.
- 적용 후보: [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)

- 하위 #1: WRONG_ANSWER — 영화 예매는 월 1회라고 맞게 안내했지만, 이용 횟수를 예매 가능 매수의 제한으로 잘못 제시했습니다.
- Judge 요약: 답변은 예매 가능 매수를 확인할 수 없다고도 했지만, 앞서 월 1회 이용 횟수를 매수 제한으로 단정해 핵심 내용을 혼동했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: VIP 영화 혜택 사용 조건을; FAQ 1362
- 실제 하위 #2: 예매 가능 매수까지 알려 주세요.; FAQ 1362
- 검색 #1: VIP 영화 혜택의 사용 조건은 무엇인가요?
- 검색 #2: VIP 영화 혜택을 사용할 수 있는 예매 가능 매수는 얼마인가요?

**실제로 입력된 FAQ 원문**

- FAQ 1362: VIP 혜택은 무엇인가요?
> VIP 멤버십은 제휴처 할인 한도가 늘고 매월 영화 예매 1회와 카페 음료 1회 같은 전용 혜택을 받을 수 있습니다. VIP 혜택의 제휴처와 이용 횟수는 앱의 멤버십 혜택 메뉴에서 확인할 수 있습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1362
- 원본: [results.jsonl:45](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:45](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:42](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> VIP 영화 혜택의 사용 조건은 매월 영화 예매 1회를 받을 수 있다는 것입니다. 예매 가능 매수는 1회로 제한됩니다.

**모델 본문**

> VIP 영화 혜택의 사용 조건은 매월 영화 예매 1회를 받을 수 있다는 것입니다. 예매 가능 매수는 1회로 제한됩니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 예매 가능 매수는 1회로 제한됩니다.
  - 사유: FAQ의 ‘매월 영화 예매 1회’는 이용 횟수이며, 한 번에 예매할 수 있는 매수는 제공되지 않았습니다.
- 적용 후보: [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)

- 하위 #1: WRONG_ANSWER — 월 1회 예매 혜택은 맞지만, 자료에 없는 예매 가능 매수를 1회로 단정했습니다.
- Judge 요약: 월별 이용 횟수를 예매 가능 매수로 잘못 적용해 핵심 질문에 부정확하게 답했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: VIP 영화 혜택 사용 조건을; FAQ 1362
- 실제 하위 #2: 예매 가능 매수까지 알려 주세요.; FAQ 1362
- 검색 #1: VIP 영화 혜택의 사용 조건은 무엇인가요?
- 검색 #2: VIP 영화 혜택을 사용할 수 있는 예매 가능 매수는 얼마인가요?

**실제로 입력된 FAQ 원문**

- FAQ 1362: VIP 혜택은 무엇인가요?
> VIP 멤버십은 제휴처 할인 한도가 늘고 매월 영화 예매 1회와 카페 음료 1회 같은 전용 혜택을 받을 수 있습니다. VIP 혜택의 제휴처와 이용 횟수는 앱의 멤버십 혜택 메뉴에서 확인할 수 있습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1362
- 원본: [results.jsonl:147](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:147](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:143](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> VIP 영화 혜택의 사용 조건은 매월 영화 예매 1회를 받을 수 있다는 것입니다. 이는 VIP 멤버십에 가입한 경우 제휴처 할인 한도가 늘고, 영화 예매 및 카페 음료 1회 같은 전용 혜택을 받을 수 있도록 합니다.
> 
> 예매 가능 매수는 매월 1회입니다. VIP 멤버십을 가입한 경우 영화 예매는 매월 1회만 가능하며, 이는 VIP 혜택의 일부로 제한되어 있습니다.

**모델 본문**

> VIP 영화 혜택의 사용 조건은 매월 영화 예매 1회를 받을 수 있다는 것입니다. 이는 VIP 멤버십에 가입한 경우 제휴처 할인 한도가 늘고, 영화 예매 및 카페 음료 1회 같은 전용 혜택을 받을 수 있도록 합니다.
> 
> 예매 가능 매수는 매월 1회입니다. VIP 멤버십을 가입한 경우 영화 예매는 매월 1회만 가능하며, 이는 VIP 혜택의 일부로 제한되어 있습니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 예매 가능 매수는 매월 1회입니다.
  - 사유: FAQ의 '매월 영화 예매 1회'는 이용 횟수이며, 한 번에 예매할 수 있는 매수는 자료에 없습니다.
- 적용 후보: [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)

- 하위 #1: WRONG_ANSWER — 월 1회 이용 가능하다는 점은 맞지만, 예매 횟수를 예매 가능 매수로 잘못 답했습니다.
- Judge 요약: 모델은 근거 있는 월별 이용 횟수를 설명했으나, 자료에 없는 예매 가능 매수까지 답한 것처럼 제시했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: VIP 영화 혜택 사용 조건을; FAQ 1362
- 실제 하위 #2: 예매 가능 매수까지 알려 주세요.; FAQ 1362
- 검색 #1: VIP 영화 혜택의 사용 조건은 무엇인가요?
- 검색 #2: VIP 영화 혜택을 사용할 수 있는 예매 가능 매수는 얼마인가요?
- slot #1: ANSWER; 최종 본문에 남음
> VIP 영화 혜택의 사용 조건은 매월 영화 예매 1회를 받을 수 있다는 것입니다. 이는 VIP 멤버십에 가입한 경우 제휴처 할인 한도가 늘고, 영화 예매 및 카페 음료 1회 같은 전용 혜택을 받을 수 있도록 합니다.
- slot #2: ANSWER; 최종 본문에 남음
> 예매 가능 매수는 매월 1회입니다. VIP 멤버십을 가입한 경우 영화 예매는 매월 1회만 가능하며, 이는 VIP 혜택의 일부로 제한되어 있습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1362: VIP 혜택은 무엇인가요?
> VIP 멤버십은 제휴처 할인 한도가 늘고 매월 영화 예매 1회와 카페 음료 1회 같은 전용 혜택을 받을 수 있습니다. VIP 혜택의 제휴처와 이용 횟수는 앱의 멤버십 혜택 메뉴에서 확인할 수 있습니다.

</details>

<a id="in-016"></a>
## IN-016 · 북패스 이용권 수·월 권수·요금제 데이터량 구분

> 북패스 서비스 이용 조건을 월 이용 권수까지 알려 주세요.

- 분류: 질문 내부 일부 미확인 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 환각 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC02](hallucination_progression.md#hc02), [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 북패스 서비스 이용 조건을 월 이용 권수까지 알려 주세요. → ANSWER; gold FAQ 1345, 1335 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: faq_set_changed, sub_question_input_changed, search_queries_changed
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1345, 1336, 1113
- 원본: [results.jsonl:46](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:46](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:44](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 북패스 서비스는 Ubot 전자책 라이브러리를 이용하는 부가서비스입니다. 북패스 요금제에는 북패스 전자책 이용권 1개가 포함되며, 월 이용 권수는 7GB+, 10GB+, 15GB+, 100GB+까지 제공됩니다. 각 데이터량에 따른 요금은 7GB+(월 16,300원), 10GB+(월 19,000원), 15GB+(월 21,500원), 100GB+(월 38,300원)입니다. 북패스는 요금제에 포함되어 있어 따로 가입할 필요가 없습니다.

**모델 본문**

> 북패스 서비스는 Ubot 전자책 라이브러리를 이용하는 부가서비스입니다. 북패스 요금제에는 북패스 전자책 이용권 1개가 포함되며, 월 이용 권수는 7GB+, 10GB+, 15GB+, 100GB+까지 제공됩니다. 각 데이터량에 따른 요금은 7GB+(월 16,300원), 10GB+(월 19,000원), 15GB+(월 21,500원), 100GB+(월 38,300원)입니다. 북패스는 요금제에 포함되어 있어 따로 가입할 필요가 없습니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 월 이용 권수는 7GB+, 10GB+, 15GB+, 100GB+까지 제공됩니다.
  - 사유: 해당 수치는 요금제 데이터량이며, 받은 자료에는 월 전자책 이용 권수가 없습니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)

- 하위 #1: WRONG_ANSWER — 서비스와 포함 요금제는 설명했지만, 요금제 데이터량을 월 이용 권수로 잘못 답했습니다.
- Judge 요약: 월 이용 권수가 자료에 없는데 데이터량을 권수로 오인해 확정적으로 답했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 북패스 서비스 이용 조건을; FAQ 1345, 1336, 1113
- 실제 하위 #2: 월 이용 권수까지 알려 주세요.; FAQ 1345, 1113
- 검색 #1: 북패스 서비스의 이용 조건은 무엇인가요?
- 검색 #2: 북패스 서비스의 월 이용 권수는 얼마인가요?

**실제로 입력된 FAQ 원문**

- FAQ 1345: 북패스는 어떤 서비스인가요?
> Ubot 북패스(월 4,900원)는 Ubot 전자책 라이브러리를 이용하는 부가서비스입니다. 북패스 요금제에는 북패스 이용권이 포함되어 있어 따로 가입하지 않아도 됩니다.
- FAQ 1336: 북패스가 포함된 요금제를 쓰는데 북패스에 또 가입해야 하나요?
> Ubot 북패스 요금제에는 북패스 이용권이 포함되어 있어 따로 부가서비스에 가입할 필요가 없으며 중복 가입도 할 수 없습니다.
- FAQ 1113: 북패스 요금제는 어떤 요금제인가요?
> 북패스 요금제에는 Ubot 북패스 전자책 이용권 1개가 포함되며 7GB+(월 16,300원), 10GB+(19,000원), 15GB+(21,500원), 100GB+(38,300원)가 있습니다. 북패스의 기본 데이터를 다 쓰면 7GB+~15GB+는 1Mbps, 100GB+는 5Mbps로 계속 이용할 수 있습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1345, 1336, 1113
- 원본: [results.jsonl:46](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:46](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:45](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 북패스 서비스는 Ubot 전자책 라이브러리를 이용하는 부가서비스입니다. 북패스 요금제에는 월 4,900원의 이용권이 포함되어 있으며, 기본 데이터를 다 쓰면 7GB+~15GB+는 1Mbps, 100GB+는 5Mbps로 계속 이용할 수 있습니다. 월 이용 권수는 1개이며, 이는 북패스 이용권 1개로 제공됩니다.

**모델 본문**

> 북패스 서비스는 Ubot 전자책 라이브러리를 이용하는 부가서비스입니다. 북패스 요금제에는 월 4,900원의 이용권이 포함되어 있으며, 기본 데이터를 다 쓰면 7GB+~15GB+는 1Mbps, 100GB+는 5Mbps로 계속 이용할 수 있습니다. 월 이용 권수는 1개이며, 이는 북패스 이용권 1개로 제공됩니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 월 이용 권수는 1개입니다.
  - 사유: 자료의 '이용권 1개'는 요금제에 포함된 이용권 수이며, 월 이용 가능한 책의 권수는 자료에 없습니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)

- 하위 #1: WRONG_ANSWER — 서비스 설명은 맞지만 이용권 1개를 월 이용 가능한 책 1권으로 잘못 답했습니다.
- Judge 요약: 월 이용 권수는 확인할 수 없는데 이용권 수를 책의 권수로 오인해 확정했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 북패스 서비스 이용 조건을; FAQ 1345, 1336, 1113
- 실제 하위 #2: 월 이용 권수까지 알려 주세요.; FAQ 1345, 1113
- 검색 #1: 북패스 서비스의 이용 조건은 무엇인가요?
- 검색 #2: 북패스 서비스의 월 이용 권수는 얼마인가요?

**실제로 입력된 FAQ 원문**

- FAQ 1345: 북패스는 어떤 서비스인가요?
> Ubot 북패스(월 4,900원)는 Ubot 전자책 라이브러리를 이용하는 부가서비스입니다. 북패스 요금제에는 북패스 이용권이 포함되어 있어 따로 가입하지 않아도 됩니다.
- FAQ 1336: 북패스가 포함된 요금제를 쓰는데 북패스에 또 가입해야 하나요?
> Ubot 북패스 요금제에는 북패스 이용권이 포함되어 있어 따로 부가서비스에 가입할 필요가 없으며 중복 가입도 할 수 없습니다.
- FAQ 1113: 북패스 요금제는 어떤 요금제인가요?
> 북패스 요금제에는 Ubot 북패스 전자책 이용권 1개가 포함되며 7GB+(월 16,300원), 10GB+(19,000원), 15GB+(21,500원), 100GB+(38,300원)가 있습니다. 북패스의 기본 데이터를 다 쓰면 7GB+~15GB+는 1Mbps, 100GB+는 5Mbps로 계속 이용할 수 있습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=2; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1345, 1113
- 원본: [results.jsonl:148](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:148](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:146](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 북패스 서비스는 Ubot 전자책 라이브러리를 이용하는 부가서비스로, 월 4,900원에 이용권 1개가 포함됩니다. 이용권은 7GB+, 10GB+, 15GB+, 100GB+의 데이터 용량으로 제공되며, 각 데이터 용량별로 이용 속도가 달라집니다. 7GB+~15GB+는 1Mbps, 100GB+는 5Mbps로 계속 이용할 수 있습니다.

**모델 본문**

> 북패스 서비스는 Ubot 전자책 라이브러리를 이용하는 부가서비스로, 월 4,900원에 이용권 1개가 포함됩니다. 이용권은 7GB+, 10GB+, 15GB+, 100GB+의 데이터 용량으로 제공되며, 각 데이터 용량별로 이용 속도가 달라집니다. 7GB+~15GB+는 1Mbps, 100GB+는 5Mbps로 계속 이용할 수 있습니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 월 4,900원에 이용권 1개가 포함됩니다.
  - 사유: 이용권 1개 포함은 별도 북패스 요금제의 조건이지 월 4,900원 부가서비스의 조건으로 확인되지 않습니다.
- MISATTRIBUTION: 이용권은 7GB+, 10GB+, 15GB+, 100GB+의 데이터 용량으로 제공됩니다.
  - 사유: 해당 용량은 북패스 요금제의 기본 데이터량이며 전자책 이용권의 종류가 아닙니다.
- MISATTRIBUTION: 7GB+~15GB+는 1Mbps, 100GB+는 5Mbps로 계속 이용할 수 있습니다.
  - 사유: 이는 북패스 요금제의 기본 데이터를 모두 쓴 뒤 적용되는 속도인데, 그 조건 없이 서비스 이용 조건으로 제시했습니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)

- 하위 #1: WRONG_ANSWER — 서비스 요금과 성격은 맞지만, 요금제에 포함된 이용권을 월 4,900원 서비스의 제공 조건처럼 설명하고 월 이용 권수는 답하지 않았습니다.
- Judge 요약: 월 이용 권수는 자료에 없지만 답변은 요금제의 이용권·데이터 조건을 부가서비스 조건과 혼동했고, 검색어도 질문의 일부만 담았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 북패스 서비스 이용 조건을 월 이용 권수까지 알려 주세요.; FAQ 1345, 1113
- 검색 #1: 북패스 서비스의 월 이용 권수는 얼마인가요?
- slot #1: ANSWER; 최종 본문에 남음
> 북패스 서비스는 Ubot 전자책 라이브러리를 이용하는 부가서비스로, 월 4,900원에 이용권 1개가 포함됩니다. 이용권은 7GB+, 10GB+, 15GB+, 100GB+의 데이터 용량으로 제공되며, 각 데이터 용량별로 이용 속도가 달라집니다. 7GB+~15GB+는 1Mbps, 100GB+는 5Mbps로 계속 이용할 수 있습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1345: 북패스는 어떤 서비스인가요?
> Ubot 북패스(월 4,900원)는 Ubot 전자책 라이브러리를 이용하는 부가서비스입니다. 북패스 요금제에는 북패스 이용권이 포함되어 있어 따로 가입하지 않아도 됩니다.
- FAQ 1113: 북패스 요금제는 어떤 요금제인가요?
> 북패스 요금제에는 Ubot 북패스 전자책 이용권 1개가 포함되며 7GB+(월 16,300원), 10GB+(19,000원), 15GB+(21,500원), 100GB+(38,300원)가 있습니다. 북패스의 기본 데이터를 다 쓰면 7GB+~15GB+는 1Mbps, 100GB+는 5Mbps로 계속 이용할 수 있습니다.

</details>

<a id="ma-001"></a>
## MA-001 · 요금제 적용 시점의 FAQ 68·1126 충돌

> 요금제는 한 달에 몇 번 바꿀 수 있고, 바꾸면 언제부터 적용돼요?

- 분류: 복합·모두 답할 수 있음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 환각 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC09](hallucination_progression.md#hc09)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 요금제는 한 달에 몇 번 바꿀 수 있고 → ANSWER; gold FAQ 105 (gold는 실제 제공 자료와 다를 수 있음)
- #2 바꾸면 언제부터 적용돼요? → ANSWER; gold FAQ 1124, 1126 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: context_sections_changed
- 입력 차이 v4sub_slot: context_sections_changed

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 105, 1123, 68, 1126, 1604
- 원본: [results.jsonl:51](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:51](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:54](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 요금제는 한 달에 1회만 변경할 수 있습니다. 이전 달에 변경한 경우 다음 달에 다시 변경할 수 있습니다. 요금제 변경은 변경 조건에 따라 즉시 또는 다음 정산일부터 적용될 수 있습니다. 바뀐 요금제 기준 사용량은 앱 첫 화면에서 바로 확인할 수 있으며, 요금제 변경일을 기준으로 나눠 계산된 요금은 다음 달 청구서에서 확인할 수 있습니다.

**모델 본문**

> 요금제는 한 달에 1회만 변경할 수 있습니다. 이전 달에 변경한 경우 다음 달에 다시 변경할 수 있습니다. 요금제 변경은 변경 조건에 따라 즉시 또는 다음 정산일부터 적용될 수 있습니다. 바뀐 요금제 기준 사용량은 앱 첫 화면에서 바로 확인할 수 있으며, 요금제 변경일을 기준으로 나눠 계산된 요금은 다음 달 청구서에서 확인할 수 있습니다.

**Judge가 표시한 주장**

- SILENT_CONFLICT_PICK: 요금제 변경은 변경 조건에 따라 즉시 또는 다음 정산일부터 적용될 수 있습니다.
  - 사유: 제공된 FAQ 68과 신청 즉시 적용된다는 FAQ 1126의 충돌을 알리지 않고 FAQ 68의 설명을 확정적으로 제시했습니다.
- 적용 후보: [HC09](hallucination_progression.md#hc09)

- 하위 #1: CORRECT_ANSWER — 한 달에 1회 변경할 수 있다는 핵심 답을 전달했습니다.
- 하위 #2: WRONG_ANSWER — 정답 기준은 신청 즉시 적용인데, 조건에 따라 다음 정산일부터 적용될 수 있다고 답했습니다.
- Judge 요약: 변경 횟수는 맞혔지만 적용 시점은 정답 기준과 다르며, 제공 자료의 상충하는 적용 시점도 밝히지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 요금제는 한 달에 몇 번 바꿀 수 있고, 바꾸면; FAQ 105, 1123
- 실제 하위 #2: 언제부터 적용돼요?; FAQ 68, 1126, 1604
- 검색 #1: 요금제를 한 달에 몇 번 바꿀 수 있나요?
- 검색 #2: 요금제를 바꾸면 언제부터 적용되나요?

**실제로 입력된 FAQ 원문**

- FAQ 105: 요금제는 한 달에 몇 번까지 바꿀 수 있나요?
> 요금제는 한 달에 1회 변경할 수 있습니다. 이번 달에 이미 요금제를 변경했다면 다음 달에 다시 변경할 수 있습니다.
- FAQ 1123: 요금제는 어디에서 변경할 수 있나요?
> 요금제는 Ubot 앱·홈페이지에 로그인해 요금제 변경 메뉴에서 바꾸거나 고객센터(114)·매장에서 변경할 수 있습니다. 키즈 요금제처럼 법정대리인 동의가 필요한 요금제는 고객센터나 매장에서만 변경할 수 있습니다.
- FAQ 68: 요금제를 변경하면 언제 적용되나요?
> 요금제 변경은 변경 조건에 따라 즉시 또는 다음 정산일부터 적용될 수 있습니다.
- FAQ 1126: 요금제를 변경하면 언제부터 바뀐 요금을 확인할 수 있나요?
> 요금제 변경은 신청 즉시 적용되며 바뀐 요금제 기준 사용량은 앱 첫 화면에서 바로 확인할 수 있습니다. 요금제 변경일을 기준으로 나눠 계산된 요금은 다음 달 청구서에서 확인할 수 있습니다.
- FAQ 1604: 요금제를 바꿨는데 새 데이터 제공량은 언제 반영되나요?
> 요금제를 바꿨다면 가입 내역에서 변경 처리 상태와 적용일을 확인해 주세요. 요금제 적용일이 지났는데도 새 데이터 제공량이 반영되지 않았다면 고객센터에 회선 상태 점검을 요청해 주세요. 새 데이터 제공량의 정확한 반영 시점은 요금제 변경 조건에 따라 확인이 필요합니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 105, 1123, 68, 1126, 1604
- 원본: [results.jsonl:51](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:51](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:49](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 요금제는 한 달에 1회 변경할 수 있습니다. 이번 달에 이미 요금제를 변경했다면 다음 달에 다시 변경할 수 있습니다. 요금제 변경은 변경 조건에 따라 즉시 또는 다음 정산일부터 적용될 수 있습니다. 바뀐 요금제 기준 사용량은 앱 첫 화면에서 바로 확인할 수 있으며, 요금제 변경일을 기준으로 나눠 계산된 요금은 다음 달 청구서에서 확인할 수 있습니다.

**모델 본문**

> 요금제는 한 달에 1회 변경할 수 있습니다. 이번 달에 이미 요금제를 변경했다면 다음 달에 다시 변경할 수 있습니다. 요금제 변경은 변경 조건에 따라 즉시 또는 다음 정산일부터 적용될 수 있습니다. 바뀐 요금제 기준 사용량은 앱 첫 화면에서 바로 확인할 수 있으며, 요금제 변경일을 기준으로 나눠 계산된 요금은 다음 달 청구서에서 확인할 수 있습니다.

**Judge가 표시한 주장**

- SILENT_CONFLICT_PICK: 요금제 변경은 변경 조건에 따라 즉시 또는 다음 정산일부터 적용될 수 있습니다.
  - 사유: 받은 FAQ 68과 FAQ 1126의 적용 시점이 충돌하는데 이를 알리지 않고 FAQ 68의 조건부 설명을 확정적으로 제시했습니다.
- 적용 후보: [HC09](hallucination_progression.md#hc09)

- 하위 #1: CORRECT_ANSWER — 한 달에 1회 변경할 수 있고 이미 변경했다면 다음 달에 가능하다고 정확히 답했습니다.
- 하위 #2: WRONG_ANSWER — 정답 기준은 신청 즉시 적용인데, 조건에 따라 다음 정산일부터 적용될 수도 있다고 답했습니다.
- Judge 요약: 변경 횟수는 정확하지만 적용 시점은 정답 기준과 다르며, 받은 FAQ 간 충돌도 알리지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 요금제는 한 달에 몇 번 바꿀 수 있고, 바꾸면; FAQ 105, 1123
- 실제 하위 #2: 언제부터 적용돼요?; FAQ 68, 1126, 1604
- 검색 #1: 요금제를 한 달에 몇 번 바꿀 수 있나요?
- 검색 #2: 요금제를 바꾸면 언제부터 적용되나요?

**실제로 입력된 FAQ 원문**

- FAQ 105: 요금제는 한 달에 몇 번까지 바꿀 수 있나요?
> 요금제는 한 달에 1회 변경할 수 있습니다. 이번 달에 이미 요금제를 변경했다면 다음 달에 다시 변경할 수 있습니다.
- FAQ 1123: 요금제는 어디에서 변경할 수 있나요?
> 요금제는 Ubot 앱·홈페이지에 로그인해 요금제 변경 메뉴에서 바꾸거나 고객센터(114)·매장에서 변경할 수 있습니다. 키즈 요금제처럼 법정대리인 동의가 필요한 요금제는 고객센터나 매장에서만 변경할 수 있습니다.
- FAQ 68: 요금제를 변경하면 언제 적용되나요?
> 요금제 변경은 변경 조건에 따라 즉시 또는 다음 정산일부터 적용될 수 있습니다.
- FAQ 1126: 요금제를 변경하면 언제부터 바뀐 요금을 확인할 수 있나요?
> 요금제 변경은 신청 즉시 적용되며 바뀐 요금제 기준 사용량은 앱 첫 화면에서 바로 확인할 수 있습니다. 요금제 변경일을 기준으로 나눠 계산된 요금은 다음 달 청구서에서 확인할 수 있습니다.
- FAQ 1604: 요금제를 바꿨는데 새 데이터 제공량은 언제 반영되나요?
> 요금제를 바꿨다면 가입 내역에서 변경 처리 상태와 적용일을 확인해 주세요. 요금제 적용일이 지났는데도 새 데이터 제공량이 반영되지 않았다면 고객센터에 회선 상태 점검을 요청해 주세요. 새 데이터 제공량의 정확한 반영 시점은 요금제 변경 조건에 따라 확인이 필요합니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 105, 1123, 68, 1126, 1604
- 원본: [results.jsonl:22](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:22](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:23](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 요금제는 한 달에 1회 변경할 수 있습니다. 이번 달에 이미 요금제를 변경했다면 다음 달에 다시 변경할 수 있습니다.
> 
> 요금제 변경은 변경 조건에 따라 즉시 또는 다음 정산일부터 적용될 수 있습니다. 신청 즉시 적용되는 요금제 기준 사용량은 앱 첫 화면에서 확인할 수 있으며, 요금제 변경일을 기준으로 나눠 계산된 요금은 다음 달 청구서에서 확인할 수 있습니다.

**모델 본문**

> 요금제는 한 달에 1회 변경할 수 있습니다. 이번 달에 이미 요금제를 변경했다면 다음 달에 다시 변경할 수 있습니다.
> 
> 요금제 변경은 변경 조건에 따라 즉시 또는 다음 정산일부터 적용될 수 있습니다. 신청 즉시 적용되는 요금제 기준 사용량은 앱 첫 화면에서 확인할 수 있으며, 요금제 변경일을 기준으로 나눠 계산된 요금은 다음 달 청구서에서 확인할 수 있습니다.

**Judge가 표시한 주장**

- SILENT_CONFLICT_PICK: 요금제 변경은 변경 조건에 따라 즉시 또는 다음 정산일부터 적용될 수 있습니다.
  - 사유: 받은 자료의 FAQ 68과 FAQ 1126이 적용 시점에서 충돌하지만, 이를 알리지 않고 FAQ 68의 조건부 적용을 결론으로 제시했습니다.
- 적용 후보: [HC09](hallucination_progression.md#hc09)

- 하위 #1: CORRECT_ANSWER — 한 달에 1회 변경할 수 있다는 횟수와 재변경 가능 시점을 맞게 답했습니다.
- 하위 #2: WRONG_ANSWER — 정답 기준의 신청 즉시 적용 대신 조건에 따라 다음 정산일부터 적용될 수도 있다고 답했습니다.
- Judge 요약: 변경 횟수는 정확하지만 적용 시점은 정답 기준과 다르며, 충돌하는 FAQ를 설명 없이 한쪽 기준으로 답했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 요금제는 한 달에 몇 번 바꿀 수 있고, 바꾸면; FAQ 105, 1123
- 실제 하위 #2: 언제부터 적용돼요?; FAQ 68, 1126, 1604
- 검색 #1: 요금제를 한 달에 몇 번 바꿀 수 있나요?
- 검색 #2: 요금제를 바꾸면 언제부터 적용되나요?
- slot #1: ANSWER; 최종 본문에 남음
> 요금제는 한 달에 1회 변경할 수 있습니다. 이번 달에 이미 요금제를 변경했다면 다음 달에 다시 변경할 수 있습니다.
- slot #2: ANSWER; 최종 본문에 남음
> 요금제 변경은 변경 조건에 따라 즉시 또는 다음 정산일부터 적용될 수 있습니다. 신청 즉시 적용되는 요금제 기준 사용량은 앱 첫 화면에서 확인할 수 있으며, 요금제 변경일을 기준으로 나눠 계산된 요금은 다음 달 청구서에서 확인할 수 있습니다.

**실제로 입력된 FAQ 원문**

- FAQ 105: 요금제는 한 달에 몇 번까지 바꿀 수 있나요?
> 요금제는 한 달에 1회 변경할 수 있습니다. 이번 달에 이미 요금제를 변경했다면 다음 달에 다시 변경할 수 있습니다.
- FAQ 1123: 요금제는 어디에서 변경할 수 있나요?
> 요금제는 Ubot 앱·홈페이지에 로그인해 요금제 변경 메뉴에서 바꾸거나 고객센터(114)·매장에서 변경할 수 있습니다. 키즈 요금제처럼 법정대리인 동의가 필요한 요금제는 고객센터나 매장에서만 변경할 수 있습니다.
- FAQ 68: 요금제를 변경하면 언제 적용되나요?
> 요금제 변경은 변경 조건에 따라 즉시 또는 다음 정산일부터 적용될 수 있습니다.
- FAQ 1126: 요금제를 변경하면 언제부터 바뀐 요금을 확인할 수 있나요?
> 요금제 변경은 신청 즉시 적용되며 바뀐 요금제 기준 사용량은 앱 첫 화면에서 바로 확인할 수 있습니다. 요금제 변경일을 기준으로 나눠 계산된 요금은 다음 달 청구서에서 확인할 수 있습니다.
- FAQ 1604: 요금제를 바꿨는데 새 데이터 제공량은 언제 반영되나요?
> 요금제를 바꿨다면 가입 내역에서 변경 처리 상태와 적용일을 확인해 주세요. 요금제 적용일이 지났는데도 새 데이터 제공량이 반영되지 않았다면 고객센터에 회선 상태 점검을 요청해 주세요. 새 데이터 제공량의 정확한 반영 시점은 요금제 변경 조건에 따라 확인이 필요합니다.

</details>

<a id="ma-007"></a>
## MA-007 · 114 신고의 발신 회선 조건

> 휴대폰 분실 신고는 어디서 하고, 분실 정지 중에도 요금제 월정액이 나와요?

- 분류: 복합·모두 답할 수 있음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 없음 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC04](hallucination_progression.md#hc04)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.
- 재검토: single·sub·slot 모두 114 안내를 유지하고 적용 조건을 쓰지 않는데 single만 실질적 환각 판정. 통계상 감소를 실제 수정으로 단정하지 말고 재교정 필요.

**기대 하위 질문**

- #1 휴대폰 분실 신고는 어디서 하고 → ANSWER; gold FAQ 1448, 52 (gold는 실제 제공 자료와 다를 수 있음)
- #2 분실 정지 중에도 요금제 월정액이 나와요? → ANSWER; gold FAQ 1450 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1448, 52, 1447, 1450, 1462, 1432
- 원본: [results.jsonl:57](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:57](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:59](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 휴대폰 분실 신고는 Ubot 앱 또는 홈페이지에서 본인인증 후, 또는 114번으로 전화하여 ARS를 이용해 24시간 신고할 수 있으며, Ubot 매장에서도 신분증을 제시하면 분실 신고가 가능합니다. 분실 정지 기간에는 요금제 월정액이 청구되지 않으며, 단말 할부금과 유료 부가서비스 요금은 계속 청구됩니다.

**모델 본문**

> 휴대폰 분실 신고는 Ubot 앱 또는 홈페이지에서 본인인증 후, 또는 114번으로 전화하여 ARS를 이용해 24시간 신고할 수 있으며, Ubot 매장에서도 신분증을 제시하면 분실 신고가 가능합니다. 분실 정지 기간에는 요금제 월정액이 청구되지 않으며, 단말 할부금과 유료 부가서비스 요금은 계속 청구됩니다.

**Judge가 표시한 주장**

- UNSUPPORTED_GENERALIZATION: 114번으로 전화하여 ARS로 분실 신고할 수 있습니다.
  - 사유: 자료는 Ubot 휴대폰이 아닌 전화에서는 홈페이지의 고객센터 대표번호로 걸어야 한다고 구분합니다.
- 적용 후보: [HC04](hallucination_progression.md#hc04)

- 하위 #1: WRONG_ANSWER — 신고 경로는 제시했지만, Ubot 휴대폰이 아닌 전화에서는 114 대신 홈페이지의 고객센터 대표번호를 이용해야 한다는 조건을 빠뜨렸습니다.
- 하위 #2: CORRECT_ANSWER — 분실 정지 중 월정액은 청구되지 않고 단말 할부금과 유료 부가서비스 요금은 계속 청구된다고 정확히 답했습니다.
- Judge 요약: 월정액 답변은 정확하지만, 분실 신고 전화번호의 적용 조건을 누락해 114를 일반적인 신고 경로처럼 안내했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 휴대폰 분실 신고는 어디서 하고,; FAQ 1448, 52, 1447
- 실제 하위 #2: 분실 정지 중에도 요금제 월정액이 나와요?; FAQ 1450, 1462, 1432
- 검색 #1: 휴대폰 분실 신고는 어디서 해요?
- 검색 #2: 분실 정지 중에도 요금제 월정액이 나와요?

**실제로 입력된 FAQ 원문**

- FAQ 1448: 분실 신고는 어디에서 할 수 있나요?
> 분실 신고는 Ubot 앱·홈페이지에서 본인인증 후 할 수 있습니다. 다른 전화로 114(Ubot 휴대폰이 아니면 홈페이지의 고객센터 대표번호)에 걸어 ARS로 24시간 분실 신고할 수도 있습니다. Ubot 매장에서도 신분증을 보여 주면 분실 신고할 수 있습니다.
- FAQ 52: 휴대폰 분실 신고는 어떻게 하나요?
> 휴대폰 분실 신고는 앱, 홈페이지 또는 고객센터에서 할 수 있습니다.
- FAQ 1447: 휴대폰을 잃어버렸어요. 어떻게 해야 하나요?
> 휴대폰을 잃어버리면 먼저 Ubot 앱·홈페이지나 고객센터 ARS(114)에서 분실 신고와 분실 정지를 해 주세요. 분실 정지는 무료이고 최대 90일 동안 다른 사람이 내 번호로 전화·결제하는 것을 막습니다.
- FAQ 1450: 분실 정지 중에도 요금이 나오나요?
> 분실 정지 기간에는 요금제 월정액이 청구되지 않습니다. 분실 정지 중에도 단말 할부금과 유료 부가서비스 요금은 계속 청구됩니다.
- FAQ 1462: 선불 요금제는 분실 정지 중에도 잔액이 줄어드나요?
> 선불 요금제는 분실 정지 기간에 잔액이 차감되지 않습니다. 분실 정지 기간도 선불 충전 유효기간에는 포함되므로 유효기간을 확인해 주세요.
- FAQ 1432: 일시정지 중에도 요금이 나오나요?
> 일시정지 기간에는 요금제 월정액 대신 월 3,850원이 일할 계산되어 청구됩니다. 일시정지 중에도 유료 부가서비스 요금은 청구되므로 필요 없으면 해지해 주세요.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1448, 52, 1447, 1450, 1462, 1432
- 원본: [results.jsonl:57](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:57](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:57](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 휴대폰 분실 신고는 Ubot 앱 또는 홈페이지에서 본인인증 후, 또는 114번으로 전화하여 ARS를 이용해 24시간 분실 신고할 수 있습니다. 또한 Ubot 매장에서 신분증을 제시하면 분실 신고가 가능합니다.
> 
> 분실 정지 기간에는 요금제 월정액이 청구되지 않습니다. 다만, 단말 할부금과 유료 부가서비스 요금은 계속 청구됩니다.

**모델 본문**

> 휴대폰 분실 신고는 Ubot 앱 또는 홈페이지에서 본인인증 후, 또는 114번으로 전화하여 ARS를 이용해 24시간 분실 신고할 수 있습니다. 또한 Ubot 매장에서 신분증을 제시하면 분실 신고가 가능합니다.
> 
> 분실 정지 기간에는 요금제 월정액이 청구되지 않습니다. 다만, 단말 할부금과 유료 부가서비스 요금은 계속 청구됩니다.

- 하위 #1: CORRECT_ANSWER — 앱·홈페이지, ARS, 매장에서 분실 신고할 수 있다는 핵심 경로를 안내했습니다.
- 하위 #2: CORRECT_ANSWER — 분실 정지 중 월정액은 청구되지 않고 할부금·유료 부가서비스 요금은 청구된다고 답했습니다.
- Judge 요약: 두 하위 질문 모두 제공된 FAQ에 근거해 핵심 내용을 답했고, 검색어도 원래 질문을 충실히 반영했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 휴대폰 분실 신고는 어디서 하고,; FAQ 1448, 52, 1447
- 실제 하위 #2: 분실 정지 중에도 요금제 월정액이 나와요?; FAQ 1450, 1462, 1432
- 검색 #1: 휴대폰 분실 신고는 어디서 해요?
- 검색 #2: 분실 정지 중에도 요금제 월정액이 나와요?

**실제로 입력된 FAQ 원문**

- FAQ 1448: 분실 신고는 어디에서 할 수 있나요?
> 분실 신고는 Ubot 앱·홈페이지에서 본인인증 후 할 수 있습니다. 다른 전화로 114(Ubot 휴대폰이 아니면 홈페이지의 고객센터 대표번호)에 걸어 ARS로 24시간 분실 신고할 수도 있습니다. Ubot 매장에서도 신분증을 보여 주면 분실 신고할 수 있습니다.
- FAQ 52: 휴대폰 분실 신고는 어떻게 하나요?
> 휴대폰 분실 신고는 앱, 홈페이지 또는 고객센터에서 할 수 있습니다.
- FAQ 1447: 휴대폰을 잃어버렸어요. 어떻게 해야 하나요?
> 휴대폰을 잃어버리면 먼저 Ubot 앱·홈페이지나 고객센터 ARS(114)에서 분실 신고와 분실 정지를 해 주세요. 분실 정지는 무료이고 최대 90일 동안 다른 사람이 내 번호로 전화·결제하는 것을 막습니다.
- FAQ 1450: 분실 정지 중에도 요금이 나오나요?
> 분실 정지 기간에는 요금제 월정액이 청구되지 않습니다. 분실 정지 중에도 단말 할부금과 유료 부가서비스 요금은 계속 청구됩니다.
- FAQ 1462: 선불 요금제는 분실 정지 중에도 잔액이 줄어드나요?
> 선불 요금제는 분실 정지 기간에 잔액이 차감되지 않습니다. 분실 정지 기간도 선불 충전 유효기간에는 포함되므로 유효기간을 확인해 주세요.
- FAQ 1432: 일시정지 중에도 요금이 나오나요?
> 일시정지 기간에는 요금제 월정액 대신 월 3,850원이 일할 계산되어 청구됩니다. 일시정지 중에도 유료 부가서비스 요금은 청구되므로 필요 없으면 해지해 주세요.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1448, 52, 1447, 1450, 1462, 1432
- 원본: [results.jsonl:153](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:153](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:150](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 휴대폰 분실 신고는 Ubot 앱이나 홈페이지에서 본인인증 후, 또는 114번 전화번호에 걸어 ARS를 이용해 24시간 분실 신고할 수 있습니다. 또한 Ubot 매장에서 신분증을 제시하면 분실 신고가 가능합니다.
> 
> 분실 정지 기간에는 요금제 월정액이 청구되지 않습니다. 다만, 단말 할부금과 유료 부가서비스 요금은 계속 청구됩니다.

**모델 본문**

> 휴대폰 분실 신고는 Ubot 앱이나 홈페이지에서 본인인증 후, 또는 114번 전화번호에 걸어 ARS를 이용해 24시간 분실 신고할 수 있습니다. 또한 Ubot 매장에서 신분증을 제시하면 분실 신고가 가능합니다.
> 
> 분실 정지 기간에는 요금제 월정액이 청구되지 않습니다. 다만, 단말 할부금과 유료 부가서비스 요금은 계속 청구됩니다.

- 하위 #1: CORRECT_ANSWER — 앱·홈페이지, ARS, 매장 신고 방법을 안내했습니다.
- 하위 #2: CORRECT_ANSWER — 월정액은 청구되지 않고 할부금·유료 부가서비스 요금은 계속 청구된다고 답했습니다.
- Judge 요약: 두 하위 질문 모두 제공된 FAQ의 핵심 내용을 정확히 전달했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 휴대폰 분실 신고는 어디서 하고,; FAQ 1448, 52, 1447
- 실제 하위 #2: 분실 정지 중에도 요금제 월정액이 나와요?; FAQ 1450, 1462, 1432
- 검색 #1: 휴대폰 분실 신고는 어디서 해요?
- 검색 #2: 분실 정지 중에도 요금제 월정액이 나와요?
- slot #1: ANSWER; 최종 본문에 남음
> 휴대폰 분실 신고는 Ubot 앱이나 홈페이지에서 본인인증 후, 또는 114번 전화번호에 걸어 ARS를 이용해 24시간 분실 신고할 수 있습니다. 또한 Ubot 매장에서 신분증을 제시하면 분실 신고가 가능합니다.
- slot #2: ANSWER; 최종 본문에 남음
> 분실 정지 기간에는 요금제 월정액이 청구되지 않습니다. 다만, 단말 할부금과 유료 부가서비스 요금은 계속 청구됩니다.

**실제로 입력된 FAQ 원문**

- FAQ 1448: 분실 신고는 어디에서 할 수 있나요?
> 분실 신고는 Ubot 앱·홈페이지에서 본인인증 후 할 수 있습니다. 다른 전화로 114(Ubot 휴대폰이 아니면 홈페이지의 고객센터 대표번호)에 걸어 ARS로 24시간 분실 신고할 수도 있습니다. Ubot 매장에서도 신분증을 보여 주면 분실 신고할 수 있습니다.
- FAQ 52: 휴대폰 분실 신고는 어떻게 하나요?
> 휴대폰 분실 신고는 앱, 홈페이지 또는 고객센터에서 할 수 있습니다.
- FAQ 1447: 휴대폰을 잃어버렸어요. 어떻게 해야 하나요?
> 휴대폰을 잃어버리면 먼저 Ubot 앱·홈페이지나 고객센터 ARS(114)에서 분실 신고와 분실 정지를 해 주세요. 분실 정지는 무료이고 최대 90일 동안 다른 사람이 내 번호로 전화·결제하는 것을 막습니다.
- FAQ 1450: 분실 정지 중에도 요금이 나오나요?
> 분실 정지 기간에는 요금제 월정액이 청구되지 않습니다. 분실 정지 중에도 단말 할부금과 유료 부가서비스 요금은 계속 청구됩니다.
- FAQ 1462: 선불 요금제는 분실 정지 중에도 잔액이 줄어드나요?
> 선불 요금제는 분실 정지 기간에 잔액이 차감되지 않습니다. 분실 정지 기간도 선불 충전 유효기간에는 포함되므로 유효기간을 확인해 주세요.
- FAQ 1432: 일시정지 중에도 요금이 나오나요?
> 일시정지 기간에는 요금제 월정액 대신 월 3,850원이 일할 계산되어 청구됩니다. 일시정지 중에도 유료 부가서비스 요금은 청구되므로 필요 없으면 해지해 주세요.

</details>

<a id="ma-011"></a>
## MA-011 · FAQ에 명시된 부가세 포함 조건을 없다고 말함

> 일시정지 기간 요금은 얼마고, 유료 부가서비스 요금도 나오나요?

- 분류: 복합·모두 답할 수 있음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 없음 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC11](hallucination_progression.md#hc11)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 일시정지 기간 요금은 얼마고 → ANSWER; gold FAQ 1432, 1431 (gold는 실제 제공 자료와 다를 수 있음)
- #2 유료 부가서비스 요금도 나오나요? → ANSWER; gold FAQ 1432 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: context_sections_changed
- 입력 차이 v4sub_slot: context_sections_changed

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 58, 1432, 240, 1143
- 원본: [results.jsonl:61](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:61](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:62](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 일시정지 기간에는 월 3,850원이 청구됩니다. 유료 부가서비스 요금은 정지 중에도 계속 청구됩니다. 그러나 부가서비스 요금이 부가세가 포함된 금액이라는 정보는 제공된 FAQ에서 직접 언급되지 않았습니다.

**모델 본문**

> 일시정지 기간에는 월 3,850원이 청구됩니다. 유료 부가서비스 요금은 정지 중에도 계속 청구됩니다. 그러나 부가서비스 요금이 부가세가 포함된 금액이라는 정보는 제공된 FAQ에서 직접 언급되지 않았습니다.

**Judge가 표시한 주장**

- FABRICATION: 부가서비스 요금의 부가세 포함 여부는 제공된 FAQ에서 직접 언급되지 않았습니다.
  - 사유: 제공된 FAQ 1143은 부가서비스 가격에 부가세가 포함된다고 명시합니다.
- 적용 후보: [HC11](hallucination_progression.md#hc11)

- 하위 #1: CORRECT_ANSWER — 일시정지 기간 요금이 월 3,850원이라고 답했습니다.
- 하위 #2: CORRECT_ANSWER — 유료 부가서비스 요금이 정지 중에도 청구된다고 답했습니다.
- Judge 요약: 두 질문에는 맞게 답했지만, 추가한 부가세 정보 부재 주장은 제공된 FAQ와 모순됩니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 일시정지 기간 요금은 얼마고,; FAQ 58, 1432, 240
- 실제 하위 #2: 유료 부가서비스 요금도 나오나요?; FAQ 1143
- 검색 #1: 일시정지 기간 요금은 얼마인가요?
- 검색 #2: 유료 부가서비스 요금은 나오나요?

**실제로 입력된 FAQ 원문**

- FAQ 58: 일시정지 중에도 요금이 발생하나요?
> 회선 일시정지 중에도 일부 기본 유지 비용이나 서비스 요금이 발생할 수 있습니다.
- FAQ 1432: 일시정지 중에도 요금이 나오나요?
> 일시정지 기간에는 요금제 월정액 대신 월 3,850원이 일할 계산되어 청구됩니다. 일시정지 중에도 유료 부가서비스 요금은 청구되므로 필요 없으면 해지해 주세요.
- FAQ 240: 정지 중에도 부가서비스 요금이 나오나요?
> 회선 정지 중에도 가입한 부가서비스의 월 요금은 계속 청구됩니다. 정지 중 필요 없는 부가서비스는 앱이나 고객센터에서 해지할 수 있습니다.
- FAQ 1143: 요금제 가격에 부가세가 포함되어 있나요?
> Ubot에서 안내하는 요금제와 부가서비스 가격은 모두 부가세가 포함된 금액입니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 58, 1432, 240, 1143
- 원본: [results.jsonl:61](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:61](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:60](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 일시정지 기간 요금은 월 3,850원이 청구됩니다. 유료 부가서비스 요금도 청구되며, 필요 없으면 해지해 주세요.

**모델 본문**

> 일시정지 기간 요금은 월 3,850원이 청구됩니다. 유료 부가서비스 요금도 청구되며, 필요 없으면 해지해 주세요.

- 하위 #1: CORRECT_ANSWER — 일시정지 기간 요금을 월 3,850원으로 정확히 안내했습니다.
- 하위 #2: CORRECT_ANSWER — 유료 부가서비스 요금도 청구된다고 정확히 안내했습니다.
- Judge 요약: 답변은 제공된 FAQ에 근거하며 두 질문의 핵심 내용에 답했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 일시정지 기간 요금은 얼마고,; FAQ 58, 1432, 240
- 실제 하위 #2: 유료 부가서비스 요금도 나오나요?; FAQ 1143
- 검색 #1: 일시정지 기간 요금은 얼마인가요?
- 검색 #2: 유료 부가서비스 요금은 나오나요?

**실제로 입력된 FAQ 원문**

- FAQ 58: 일시정지 중에도 요금이 발생하나요?
> 회선 일시정지 중에도 일부 기본 유지 비용이나 서비스 요금이 발생할 수 있습니다.
- FAQ 1432: 일시정지 중에도 요금이 나오나요?
> 일시정지 기간에는 요금제 월정액 대신 월 3,850원이 일할 계산되어 청구됩니다. 일시정지 중에도 유료 부가서비스 요금은 청구되므로 필요 없으면 해지해 주세요.
- FAQ 240: 정지 중에도 부가서비스 요금이 나오나요?
> 회선 정지 중에도 가입한 부가서비스의 월 요금은 계속 청구됩니다. 정지 중 필요 없는 부가서비스는 앱이나 고객센터에서 해지할 수 있습니다.
- FAQ 1143: 요금제 가격에 부가세가 포함되어 있나요?
> Ubot에서 안내하는 요금제와 부가서비스 가격은 모두 부가세가 포함된 금액입니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 58, 1432, 240, 1143
- 원본: [results.jsonl:156](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:156](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:152](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 일시정지 기간에는 월 3,850원이 청구됩니다. 이 요금은 일시정지 기간 동안 적용되는 기본 유지 비용으로, 요금제 월정액 대신 청구됩니다.
> 
> 유료 부가서비스 요금은 청구됩니다. 회선 정지 중에도 가입한 부가서비스의 월 요금이 계속 청구됩니다.

**모델 본문**

> 일시정지 기간에는 월 3,850원이 청구됩니다. 이 요금은 일시정지 기간 동안 적용되는 기본 유지 비용으로, 요금제 월정액 대신 청구됩니다.
> 
> 유료 부가서비스 요금은 청구됩니다. 회선 정지 중에도 가입한 부가서비스의 월 요금이 계속 청구됩니다.

- 하위 #1: WRONG_ANSWER — 월 3,850원은 맞지만 일할 계산된다는 핵심 조건을 빠뜨렸습니다.
- 하위 #2: CORRECT_ANSWER — 일시정지 중에도 유료 부가서비스 요금이 청구된다고 정확히 답했습니다.
- Judge 요약: 첫 번째 답변은 일할 계산 조건이 누락됐고, 두 번째 답변과 검색어는 기준에 부합합니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 일시정지 기간 요금은 얼마고,; FAQ 58, 1432, 240
- 실제 하위 #2: 유료 부가서비스 요금도 나오나요?; FAQ 1143
- 검색 #1: 일시정지 기간 요금은 얼마인가요?
- 검색 #2: 유료 부가서비스 요금은 나오나요?
- slot #1: ANSWER; 최종 본문에 남음
> 일시정지 기간에는 월 3,850원이 청구됩니다. 이 요금은 일시정지 기간 동안 적용되는 기본 유지 비용으로, 요금제 월정액 대신 청구됩니다.
- slot #2: ANSWER; 최종 본문에 남음
> 유료 부가서비스 요금은 청구됩니다. 회선 정지 중에도 가입한 부가서비스의 월 요금이 계속 청구됩니다.

**실제로 입력된 FAQ 원문**

- FAQ 58: 일시정지 중에도 요금이 발생하나요?
> 회선 일시정지 중에도 일부 기본 유지 비용이나 서비스 요금이 발생할 수 있습니다.
- FAQ 1432: 일시정지 중에도 요금이 나오나요?
> 일시정지 기간에는 요금제 월정액 대신 월 3,850원이 일할 계산되어 청구됩니다. 일시정지 중에도 유료 부가서비스 요금은 청구되므로 필요 없으면 해지해 주세요.
- FAQ 240: 정지 중에도 부가서비스 요금이 나오나요?
> 회선 정지 중에도 가입한 부가서비스의 월 요금은 계속 청구됩니다. 정지 중 필요 없는 부가서비스는 앱이나 고객센터에서 해지할 수 있습니다.
- FAQ 1143: 요금제 가격에 부가세가 포함되어 있나요?
> Ubot에서 안내하는 요금제와 부가서비스 가격은 모두 부가세가 포함된 금액입니다.

</details>

<a id="ma-015"></a>
## MA-015 · 태블릿 요금제와 데이터 전용 상품의 소진 후 정책

> 태블릿 요금제 20GB 가격이 얼마고 음성통화도 되나요?

- 분류: 복합·모두 답할 수 있음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **없음 → 환각 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC02](hallucination_progression.md#hc02), [HC09](hallucination_progression.md#hc09)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 태블릿 요금제 20GB 가격이 얼마고 → ANSWER; gold FAQ 1118 (gold는 실제 제공 자료와 다를 수 있음)
- #2 음성통화도 되나요? → ANSWER; gold FAQ 1118, 189 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 103, 1118, 119
- 원본: [results.jsonl:65](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:65](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:64](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 태블릿 요금제 20GB는 월 19,900원이며, 음성통화는 제공되지 않습니다. 데이터 전용 요금제이므로 음성·문자는 포함되지 않습니다.

**모델 본문**

> 태블릿 요금제 20GB는 월 19,900원이며, 음성통화는 제공되지 않습니다. 데이터 전용 요금제이므로 음성·문자는 포함되지 않습니다.

- 하위 #1: CORRECT_ANSWER — 20GB 요금이 월 19,900원이라고 정확히 답했습니다.
- 하위 #2: CORRECT_ANSWER — 음성통화가 제공되지 않는다고 정확히 답했습니다.
- Judge 요약: 답변과 검색어 모두 질문의 가격 및 음성통화 가능 여부를 자료에 맞게 다뤘습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 태블릿 요금제 20GB 가격이 얼마고; FAQ 103, 1118
- 실제 하위 #2: 음성통화도 되나요?; FAQ 119
- 검색 #1: 태블릿 요금제 20GB 가격이 얼마인가요?
- 검색 #2: 태블릿 요금제 20GB에 음성통화가 가능한가요?

**실제로 입력된 FAQ 원문**

- FAQ 103: 태블릿에서 쓸 수 있는 요금제가 있나요?
> 태블릿은 데이터 전용 Ubot 태블릿 요금제를 이용할 수 있습니다. Ubot 태블릿 요금제는 5GB 월 9,900원부터 50GB 월 29,900원까지 있으며 음성·문자는 제공하지 않습니다. 스마트워치는 별도의 Ubot 워치 요금제를 이용할 수 있습니다.
- FAQ 1118: 태블릿 요금제 종류와 가격이 궁금해요.
> Ubot 태블릿 요금제는 데이터 전용 5G 상품으로 5GB(월 9,900원), 10GB(14,900원), 20GB(19,900원), 50GB(29,900원)가 있습니다. Ubot 태블릿 요금제는 음성·문자를 제공하지 않으며 데이터를 다 쓰면 차단됩니다.
- FAQ 119: 데이터 전용 요금제에서 20GB를 다 쓰면 끊기나요?
> 데이터 전용 요금제는 20GB 소진 후 1Mbps 속도로 계속 사용할 수 있습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 103, 1118, 119
- 원본: [results.jsonl:65](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:65](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:63](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 태블릿 요금제 20GB는 월 19,900원입니다. 그러나 음성통화는 제공되지 않습니다. 데이터 전용 요금제인 태블릿 요금제는 음성·문자를 포함하지 않으며, 데이터 소진 후 1Mbps 속도로 계속 사용할 수 있습니다.

**모델 본문**

> 태블릿 요금제 20GB는 월 19,900원입니다. 그러나 음성통화는 제공되지 않습니다. 데이터 전용 요금제인 태블릿 요금제는 음성·문자를 포함하지 않으며, 데이터 소진 후 1Mbps 속도로 계속 사용할 수 있습니다.

**Judge가 표시한 주장**

- SILENT_CONFLICT_PICK: 태블릿 요금제는 데이터 소진 후 1Mbps 속도로 계속 사용할 수 있습니다.
  - 사유: FAQ 119는 데이터 전용 요금제의 20GB 소진 후 1Mbps 이용을 안내하지만, 태블릿 요금제를 명시한 FAQ 1118은 데이터 소진 시 차단된다고 하므로 충돌을 알리지 않고 한쪽을 확정했습니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC09](hallucination_progression.md#hc09)

- 하위 #1: CORRECT_ANSWER — 20GB 태블릿 요금제의 월 요금 19,900원을 정확히 답했습니다.
- 하위 #2: CORRECT_ANSWER — 태블릿 요금제는 음성통화를 제공하지 않는다고 정확히 답했습니다.
- Judge 요약: 가격과 음성통화 여부는 맞았지만, 부가 설명에서 서로 충돌하는 자료 중 한쪽만 확정했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 태블릿 요금제 20GB 가격이 얼마고; FAQ 103, 1118
- 실제 하위 #2: 음성통화도 되나요?; FAQ 119
- 검색 #1: 태블릿 요금제 20GB 가격이 얼마인가요?
- 검색 #2: 태블릿 요금제 20GB에 음성통화가 가능한가요?

**실제로 입력된 FAQ 원문**

- FAQ 103: 태블릿에서 쓸 수 있는 요금제가 있나요?
> 태블릿은 데이터 전용 Ubot 태블릿 요금제를 이용할 수 있습니다. Ubot 태블릿 요금제는 5GB 월 9,900원부터 50GB 월 29,900원까지 있으며 음성·문자는 제공하지 않습니다. 스마트워치는 별도의 Ubot 워치 요금제를 이용할 수 있습니다.
- FAQ 1118: 태블릿 요금제 종류와 가격이 궁금해요.
> Ubot 태블릿 요금제는 데이터 전용 5G 상품으로 5GB(월 9,900원), 10GB(14,900원), 20GB(19,900원), 50GB(29,900원)가 있습니다. Ubot 태블릿 요금제는 음성·문자를 제공하지 않으며 데이터를 다 쓰면 차단됩니다.
- FAQ 119: 데이터 전용 요금제에서 20GB를 다 쓰면 끊기나요?
> 데이터 전용 요금제는 20GB 소진 후 1Mbps 속도로 계속 사용할 수 있습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 103, 1118, 119
- 원본: [results.jsonl:26](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:26](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:26](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 태블릿 요금제 20GB는 월 19,900원입니다.
> 
> 음성통화는 제공되지 않습니다.

**모델 본문**

> 태블릿 요금제 20GB는 월 19,900원입니다.
> 
> 음성통화는 제공되지 않습니다.

- 하위 #1: CORRECT_ANSWER — 20GB 요금제 가격을 월 19,900원으로 정확히 답했습니다.
- 하위 #2: CORRECT_ANSWER — 태블릿 요금제에서 음성통화를 제공하지 않는다고 정확히 답했습니다.
- Judge 요약: 답변은 제공된 FAQ와 일치하며 검색어도 사용자 질문의 두 부분을 모두 담았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 태블릿 요금제 20GB 가격이 얼마고; FAQ 103, 1118
- 실제 하위 #2: 음성통화도 되나요?; FAQ 119
- 검색 #1: 태블릿 요금제 20GB 가격이 얼마인가요?
- 검색 #2: 태블릿 요금제 20GB에 음성통화가 가능한가요?
- slot #1: ANSWER; 최종 본문에 남음
> 태블릿 요금제 20GB는 월 19,900원입니다.
- slot #2: ANSWER; 최종 본문에 남음
> 음성통화는 제공되지 않습니다.

**실제로 입력된 FAQ 원문**

- FAQ 103: 태블릿에서 쓸 수 있는 요금제가 있나요?
> 태블릿은 데이터 전용 Ubot 태블릿 요금제를 이용할 수 있습니다. Ubot 태블릿 요금제는 5GB 월 9,900원부터 50GB 월 29,900원까지 있으며 음성·문자는 제공하지 않습니다. 스마트워치는 별도의 Ubot 워치 요금제를 이용할 수 있습니다.
- FAQ 1118: 태블릿 요금제 종류와 가격이 궁금해요.
> Ubot 태블릿 요금제는 데이터 전용 5G 상품으로 5GB(월 9,900원), 10GB(14,900원), 20GB(19,900원), 50GB(29,900원)가 있습니다. Ubot 태블릿 요금제는 음성·문자를 제공하지 않으며 데이터를 다 쓰면 차단됩니다.
- FAQ 119: 데이터 전용 요금제에서 20GB를 다 쓰면 끊기나요?
> 데이터 전용 요금제는 20GB 소진 후 1Mbps 속도로 계속 사용할 수 있습니다.

</details>

<a id="ma-017"></a>
## MA-017 · 사용자 나이 없이 성인·개인 결제 한도 확정

> 휴대폰 결제 기본 한도는 얼마고, 최대 얼마까지 올릴 수 있어요?

- 분류: 복합·모두 답할 수 있음 · 주된 주장 영역: 사용자 필드·날짜
- 변화: **환각 → 없음 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC07](hallucination_progression.md#hc07), [HC04](hallucination_progression.md#hc04)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 휴대폰 결제 기본 한도는 얼마고 → ANSWER; gold FAQ 1187 (gold는 실제 제공 자료와 다를 수 있음)
- #2 최대 얼마까지 올릴 수 있어요? → ANSWER; gold FAQ 1187 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: context_sections_changed
- 입력 차이 v4sub_slot: context_sections_changed

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1187, 44
- 원본: [results.jsonl:67](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:67](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:67](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 휴대폰 결제의 기본 한도는 월 30만 원이며, 앱에서 1만 원 단위로 최대 100만 원까지 변경할 수 있습니다. 만 19세 미만의 경우 월 최대 5만 원입니다. 사용자 정보에 따르면, 이 사용자는 만 19세 이상이므로 기본 한도 30만 원에서 최대 100만 원까지 설정이 가능합니다.

**모델 본문**

> 휴대폰 결제의 기본 한도는 월 30만 원이며, 앱에서 1만 원 단위로 최대 100만 원까지 변경할 수 있습니다. 만 19세 미만의 경우 월 최대 5만 원입니다. 사용자 정보에 따르면, 이 사용자는 만 19세 이상이므로 기본 한도 30만 원에서 최대 100만 원까지 설정이 가능합니다.

**Judge가 표시한 주장**

- FABRICATION: 이 사용자는 만 19세 이상이므로 기본 한도 30만 원에서 최대 100만 원까지 설정이 가능합니다.
  - 사유: 제공된 사용자 정보에는 나이가 없어 성인 여부와 개인별 적용 한도를 확정할 수 없습니다.
- 적용 후보: [HC07](hallucination_progression.md#hc07), [HC04](hallucination_progression.md#hc04)

- 하위 #1: CORRECT_ANSWER — 기본 한도를 월 30만 원으로 정확히 답했습니다.
- 하위 #2: CORRECT_ANSWER — 최대 100만 원과 미성년자의 월 최대 5만 원을 정확히 안내했습니다.
- Judge 요약: 일반 한도 답변은 정확하지만, 근거 없이 사용자를 성인으로 단정해 개인별 적용 가능 여부를 주장했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 휴대폰 결제 기본 한도는 얼마고,; FAQ 1187, 44
- 실제 하위 #2: 최대 얼마까지 올릴 수 있어요?; FAQ 1187, 44
- 검색 #1: 휴대폰 결제 기본 한도는 얼마인가요?
- 검색 #2: 휴대폰 결제 최대 한도는 얼마인가요?

**실제로 입력된 FAQ 원문**

- FAQ 1187: 휴대폰 결제(소액결제) 한도는 얼마인가요?
> 휴대폰 결제의 기본 한도는 월 30만 원이며 앱에서 1만 원 단위로 최대 100만 원까지 변경할 수 있습니다. 만 19세 미만의 휴대폰 결제 한도는 월 최대 5만 원입니다.
- FAQ 44: 소액결제 한도를 변경하고 싶어요.
> 휴대폰 소액결제 한도는 본인 인증 후 변경할 수 있습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1187, 44
- 원본: [results.jsonl:67](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:67](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:62](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 휴대폰 결제의 기본 한도는 월 30만 원이며, 앱에서 1만 원 단위로 최대 100만 원까지 변경할 수 있습니다. 만 19세 미만의 경우 월 최대 5만 원입니다.

**모델 본문**

> 휴대폰 결제의 기본 한도는 월 30만 원이며, 앱에서 1만 원 단위로 최대 100만 원까지 변경할 수 있습니다. 만 19세 미만의 경우 월 최대 5만 원입니다.

- 하위 #1: CORRECT_ANSWER — 기본 한도를 월 30만 원으로 정확히 답했습니다.
- 하위 #2: CORRECT_ANSWER — 최대 100만 원까지 변경할 수 있다고 정확히 답했습니다.
- Judge 요약: 답변의 한도와 미성년자 조건이 제공된 FAQ와 일치하며, 검색어도 질문의 두 부분을 모두 담았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 휴대폰 결제 기본 한도는 얼마고,; FAQ 1187, 44
- 실제 하위 #2: 최대 얼마까지 올릴 수 있어요?; FAQ 1187, 44
- 검색 #1: 휴대폰 결제 기본 한도는 얼마인가요?
- 검색 #2: 휴대폰 결제 최대 한도는 얼마인가요?

**실제로 입력된 FAQ 원문**

- FAQ 1187: 휴대폰 결제(소액결제) 한도는 얼마인가요?
> 휴대폰 결제의 기본 한도는 월 30만 원이며 앱에서 1만 원 단위로 최대 100만 원까지 변경할 수 있습니다. 만 19세 미만의 휴대폰 결제 한도는 월 최대 5만 원입니다.
- FAQ 44: 소액결제 한도를 변경하고 싶어요.
> 휴대폰 소액결제 한도는 본인 인증 후 변경할 수 있습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1187, 44
- 원본: [results.jsonl:159](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:159](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:155](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 휴대폰 결제의 기본 한도는 월 30만 원입니다. 만 19세 미만의 경우 월 최대 5만 원입니다.
> 
> 휴대폰 결제 한도는 앱에서 1만 원 단위로 최대 100만 원까지 변경할 수 있습니다.

**모델 본문**

> 휴대폰 결제의 기본 한도는 월 30만 원입니다. 만 19세 미만의 경우 월 최대 5만 원입니다.
> 
> 휴대폰 결제 한도는 앱에서 1만 원 단위로 최대 100만 원까지 변경할 수 있습니다.

- 하위 #1: CORRECT_ANSWER — 기본 한도를 월 30만 원으로 정확히 답했습니다.
- 하위 #2: CORRECT_ANSWER — 최대 100만 원까지 변경할 수 있다고 정확히 답했습니다.
- Judge 요약: 답변의 한도와 변경 조건이 제공된 FAQ와 일치하며 검색어도 질문을 충실히 반영합니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 휴대폰 결제 기본 한도는 얼마고,; FAQ 1187, 44
- 실제 하위 #2: 최대 얼마까지 올릴 수 있어요?; FAQ 1187, 44
- 검색 #1: 휴대폰 결제 기본 한도는 얼마인가요?
- 검색 #2: 휴대폰 결제 최대 한도는 얼마인가요?
- slot #1: ANSWER; 최종 본문에 남음
> 휴대폰 결제의 기본 한도는 월 30만 원입니다. 만 19세 미만의 경우 월 최대 5만 원입니다.
- slot #2: ANSWER; 최종 본문에 남음
> 휴대폰 결제 한도는 앱에서 1만 원 단위로 최대 100만 원까지 변경할 수 있습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1187: 휴대폰 결제(소액결제) 한도는 얼마인가요?
> 휴대폰 결제의 기본 한도는 월 30만 원이며 앱에서 1만 원 단위로 최대 100만 원까지 변경할 수 있습니다. 만 19세 미만의 휴대폰 결제 한도는 월 최대 5만 원입니다.
- FAQ 44: 소액결제 한도를 변경하고 싶어요.
> 휴대폰 소액결제 한도는 본인 인증 후 변경할 수 있습니다.

</details>

<a id="ma-026"></a>
## MA-026 · eSIM 비용과 실물 유심 재발급 비용

> eSIM을 실수로 지우면 회선이 해지되나요? 다시 받으려면 비용이 얼마예요?

- 분류: 복합·모두 답할 수 있음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **없음 → 없음 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC02](hallucination_progression.md#hc02), [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 eSIM을 실수로 지우면 회선이 해지되나요? → ANSWER; gold FAQ 1278 (gold는 실제 제공 자료와 다를 수 있음)
- #2 다시 받으려면 비용이 얼마예요? → ANSWER; gold FAQ 1278, 1257 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1278, 1279, 15, 1257, 1280, 1281
- 원본: [results.jsonl:76](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:76](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:74](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> eSIM을 실수로 지우면 회선이 해지되지 않습니다. 실수로 삭제한 eSIM은 Ubot 앱이나 매장에서 다시 발급받아 설치할 수 있으며, 재발급 비용은 2,750원입니다.
> 
> 이 정보는 [FAQ ID: 1278]과 [FAQ ID: 1257]을 기준으로 확정되었습니다.

**모델 본문**

> eSIM을 실수로 지우면 회선이 해지되지 않습니다. 실수로 삭제한 eSIM은 Ubot 앱이나 매장에서 다시 발급받아 설치할 수 있으며, 재발급 비용은 2,750원입니다.
> 
> 이 정보는 [FAQ ID: 1278]과 [FAQ ID: 1257]을 기준으로 확정되었습니다.

- 하위 #1: CORRECT_ANSWER — eSIM을 삭제해도 회선은 해지되지 않는다고 정확히 답했습니다.
- 하위 #2: CORRECT_ANSWER — 재발급 비용 2,750원을 정확히 답했습니다.
- Judge 요약: 답변의 회선 유지, 재발급 방법, 비용이 모두 제공된 FAQ와 일치합니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: eSIM을 실수로 지우면 회선이 해지되나요?; FAQ 1278, 1279, 15
- 실제 하위 #2: 다시 받으려면 비용이 얼마예요?; FAQ 1257, 1280, 1281
- 검색 #1: eSIM을 실수로 지우면 회선이 해지되나요?
- 검색 #2: eSIM을 다시 받으려면 비용이 얼마예요?

**실제로 입력된 FAQ 원문**

- FAQ 1278: 설정에서 eSIM을 실수로 삭제했어요.
> 휴대폰에서 eSIM을 삭제해도 통신 회선은 해지되지 않습니다. 실수로 삭제한 eSIM은 Ubot 앱이나 매장에서 다시 발급받아 설치할 수 있으며 재발급 비용 2,750원이 청구됩니다. 이전에 받은 eSIM QR 코드는 다시 사용할 수 없습니다.
- FAQ 1279: 휴대폰을 초기화했더니 eSIM 전화가 안 돼요.
> 휴대폰을 초기화할 때 eSIM 삭제 옵션을 선택하면 eSIM이 지워져 전화가 되지 않을 수 있습니다. 초기화로 eSIM을 삭제했더라도 회선은 유지되므로 앱이나 매장에서 2,750원을 내고 재발급받아 설치해 주세요. 다음에 휴대폰을 초기화할 때 eSIM을 유지하려면 초기화 옵션에서 eSIM 유지를 선택해 주세요.
- FAQ 15: eSIM을 다른 휴대폰으로 옮길 수 있나요?
> eSIM을 다른 휴대폰으로 옮길 때는 새 단말기에 eSIM을 다시 발급해야 할 수 있습니다.
- FAQ 1257: 유심은 얼마인가요?
> Ubot 유심은 7,700원이고 eSIM 발급은 2,750원입니다. 유심·eSIM을 분실하거나 파손해 재발급받을 때도 같은 금액이 부과됩니다. 개통 30일 안에 정상 사용 중 유심 불량이 발생했다면 무료로 교체해 드립니다.
- FAQ 1280: eSIM을 새 휴대폰으로 옮기려면 어떻게 하나요?
> eSIM을 새 휴대폰으로 옮기려면 새 기기에서 eSIM을 다시 발급받아야 합니다. Ubot 앱에서 eSIM 기기 변경을 신청하면 새 QR 코드가 발급되고 2,750원의 비용이 청구되며 기존 휴대폰의 eSIM은 자동으로 비활성화됩니다.
- FAQ 1281: 유심을 eSIM으로, eSIM을 유심으로 바꿀 수 있나요?
> 같은 휴대폰에서도 유심과 eSIM 사이를 전환할 수 있습니다. 유심에서 eSIM으로 바꾸려면 앱에서 신청할 수 있고 비용은 2,750원입니다. eSIM에서 유심으로 바꾸려면 새 유심(7,700원)을 구매해 교체 등록해야 합니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1278, 1279, 15, 1257, 1280, 1281
- 원본: [results.jsonl:76](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:76](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:72](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> eSIM을 실수로 지우면 회선이 해지되지 않습니다. 실수로 삭제한 eSIM은 Ubot 앱이나 매장에서 다시 발급받아 설치할 수 있으며, 재발급 비용은 2,750원입니다.
> 
> 다시 받으려면 비용은 2,750원입니다.

**모델 본문**

> eSIM을 실수로 지우면 회선이 해지되지 않습니다. 실수로 삭제한 eSIM은 Ubot 앱이나 매장에서 다시 발급받아 설치할 수 있으며, 재발급 비용은 2,750원입니다.
> 
> 다시 받으려면 비용은 2,750원입니다.

- 하위 #1: CORRECT_ANSWER — eSIM을 삭제해도 회선은 해지되지 않는다고 정확히 답했습니다.
- 하위 #2: CORRECT_ANSWER — 재발급 비용 2,750원을 정확히 답했습니다.
- Judge 요약: 두 답변 모두 제공된 FAQ에 근거하며 검색어도 사용자 질문을 그대로 반영합니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: eSIM을 실수로 지우면 회선이 해지되나요?; FAQ 1278, 1279, 15
- 실제 하위 #2: 다시 받으려면 비용이 얼마예요?; FAQ 1257, 1280, 1281
- 검색 #1: eSIM을 실수로 지우면 회선이 해지되나요?
- 검색 #2: eSIM을 다시 받으려면 비용이 얼마예요?

**실제로 입력된 FAQ 원문**

- FAQ 1278: 설정에서 eSIM을 실수로 삭제했어요.
> 휴대폰에서 eSIM을 삭제해도 통신 회선은 해지되지 않습니다. 실수로 삭제한 eSIM은 Ubot 앱이나 매장에서 다시 발급받아 설치할 수 있으며 재발급 비용 2,750원이 청구됩니다. 이전에 받은 eSIM QR 코드는 다시 사용할 수 없습니다.
- FAQ 1279: 휴대폰을 초기화했더니 eSIM 전화가 안 돼요.
> 휴대폰을 초기화할 때 eSIM 삭제 옵션을 선택하면 eSIM이 지워져 전화가 되지 않을 수 있습니다. 초기화로 eSIM을 삭제했더라도 회선은 유지되므로 앱이나 매장에서 2,750원을 내고 재발급받아 설치해 주세요. 다음에 휴대폰을 초기화할 때 eSIM을 유지하려면 초기화 옵션에서 eSIM 유지를 선택해 주세요.
- FAQ 15: eSIM을 다른 휴대폰으로 옮길 수 있나요?
> eSIM을 다른 휴대폰으로 옮길 때는 새 단말기에 eSIM을 다시 발급해야 할 수 있습니다.
- FAQ 1257: 유심은 얼마인가요?
> Ubot 유심은 7,700원이고 eSIM 발급은 2,750원입니다. 유심·eSIM을 분실하거나 파손해 재발급받을 때도 같은 금액이 부과됩니다. 개통 30일 안에 정상 사용 중 유심 불량이 발생했다면 무료로 교체해 드립니다.
- FAQ 1280: eSIM을 새 휴대폰으로 옮기려면 어떻게 하나요?
> eSIM을 새 휴대폰으로 옮기려면 새 기기에서 eSIM을 다시 발급받아야 합니다. Ubot 앱에서 eSIM 기기 변경을 신청하면 새 QR 코드가 발급되고 2,750원의 비용이 청구되며 기존 휴대폰의 eSIM은 자동으로 비활성화됩니다.
- FAQ 1281: 유심을 eSIM으로, eSIM을 유심으로 바꿀 수 있나요?
> 같은 휴대폰에서도 유심과 eSIM 사이를 전환할 수 있습니다. 유심에서 eSIM으로 바꾸려면 앱에서 신청할 수 있고 비용은 2,750원입니다. eSIM에서 유심으로 바꾸려면 새 유심(7,700원)을 구매해 교체 등록해야 합니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1278, 1279, 15, 1257, 1280, 1281
- 원본: [results.jsonl:167](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:167](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:163](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> eSIM을 실수로 지우더라도 회선은 해지되지 않습니다. 실수로 삭제한 eSIM은 Ubot 앱이나 매장에서 다시 발급받아 설치할 수 있으며, 재발급 비용은 2,750원이 청구됩니다.
> 
> 다시 받으려면 비용은 2,750원입니다. eSIM을 재발급받을 때는 이 금액이 부과되며, 유심 또는 eSIM을 분실하거나 파손한 경우에도 동일한 금액이 적용됩니다.

**모델 본문**

> eSIM을 실수로 지우더라도 회선은 해지되지 않습니다. 실수로 삭제한 eSIM은 Ubot 앱이나 매장에서 다시 발급받아 설치할 수 있으며, 재발급 비용은 2,750원이 청구됩니다.
> 
> 다시 받으려면 비용은 2,750원입니다. eSIM을 재발급받을 때는 이 금액이 부과되며, 유심 또는 eSIM을 분실하거나 파손한 경우에도 동일한 금액이 적용됩니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 유심을 분실하거나 파손해 재발급받을 때도 2,750원이 적용됩니다.
  - 사유: 자료상 유심 재발급 비용은 7,700원이며, 2,750원은 eSIM 비용입니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — eSIM을 삭제해도 회선은 해지되지 않는다고 정확히 답했습니다.
- 하위 #2: CORRECT_ANSWER — eSIM 재발급 비용 2,750원을 정확히 답했습니다.
- Judge 요약: 두 질문의 핵심 답은 맞지만, 부가 설명에서 eSIM 비용을 유심에도 잘못 적용했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: eSIM을 실수로 지우면 회선이 해지되나요?; FAQ 1278, 1279, 15
- 실제 하위 #2: 다시 받으려면 비용이 얼마예요?; FAQ 1257, 1280, 1281
- 검색 #1: eSIM을 실수로 지우면 회선이 해지되나요?
- 검색 #2: eSIM을 다시 받으려면 비용이 얼마예요?
- slot #1: ANSWER; 최종 본문에 남음
> eSIM을 실수로 지우더라도 회선은 해지되지 않습니다. 실수로 삭제한 eSIM은 Ubot 앱이나 매장에서 다시 발급받아 설치할 수 있으며, 재발급 비용은 2,750원이 청구됩니다.
- slot #2: ANSWER; 최종 본문에 남음
> 다시 받으려면 비용은 2,750원입니다. eSIM을 재발급받을 때는 이 금액이 부과되며, 유심 또는 eSIM을 분실하거나 파손한 경우에도 동일한 금액이 적용됩니다.

**실제로 입력된 FAQ 원문**

- FAQ 1278: 설정에서 eSIM을 실수로 삭제했어요.
> 휴대폰에서 eSIM을 삭제해도 통신 회선은 해지되지 않습니다. 실수로 삭제한 eSIM은 Ubot 앱이나 매장에서 다시 발급받아 설치할 수 있으며 재발급 비용 2,750원이 청구됩니다. 이전에 받은 eSIM QR 코드는 다시 사용할 수 없습니다.
- FAQ 1279: 휴대폰을 초기화했더니 eSIM 전화가 안 돼요.
> 휴대폰을 초기화할 때 eSIM 삭제 옵션을 선택하면 eSIM이 지워져 전화가 되지 않을 수 있습니다. 초기화로 eSIM을 삭제했더라도 회선은 유지되므로 앱이나 매장에서 2,750원을 내고 재발급받아 설치해 주세요. 다음에 휴대폰을 초기화할 때 eSIM을 유지하려면 초기화 옵션에서 eSIM 유지를 선택해 주세요.
- FAQ 15: eSIM을 다른 휴대폰으로 옮길 수 있나요?
> eSIM을 다른 휴대폰으로 옮길 때는 새 단말기에 eSIM을 다시 발급해야 할 수 있습니다.
- FAQ 1257: 유심은 얼마인가요?
> Ubot 유심은 7,700원이고 eSIM 발급은 2,750원입니다. 유심·eSIM을 분실하거나 파손해 재발급받을 때도 같은 금액이 부과됩니다. 개통 30일 안에 정상 사용 중 유심 불량이 발생했다면 무료로 교체해 드립니다.
- FAQ 1280: eSIM을 새 휴대폰으로 옮기려면 어떻게 하나요?
> eSIM을 새 휴대폰으로 옮기려면 새 기기에서 eSIM을 다시 발급받아야 합니다. Ubot 앱에서 eSIM 기기 변경을 신청하면 새 QR 코드가 발급되고 2,750원의 비용이 청구되며 기존 휴대폰의 eSIM은 자동으로 비활성화됩니다.
- FAQ 1281: 유심을 eSIM으로, eSIM을 유심으로 바꿀 수 있나요?
> 같은 휴대폰에서도 유심과 eSIM 사이를 전환할 수 있습니다. 유심에서 eSIM으로 바꾸려면 앱에서 신청할 수 있고 비용은 2,750원입니다. eSIM에서 유심으로 바꾸려면 새 유심(7,700원)을 구매해 교체 등록해야 합니다.

</details>

<a id="ma-027"></a>
## MA-027 · PIN 세 번 오류 결과와 복구 절차의 미지원 주장

> 유심 PIN 초기값이 뭐예요? 세 번 틀리면 어떻게 돼요?

- 분류: 복합·모두 답할 수 있음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 환각 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 유심 PIN 초기값이 뭐예요? → ANSWER; gold FAQ 1270 (gold는 실제 제공 자료와 다를 수 있음)
- #2 세 번 틀리면 어떻게 돼요? → ANSWER; gold FAQ 1271 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=2; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1270, 157
- 원본: [results.jsonl:77](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:77](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:78](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 유심 PIN의 초기값은 0000입니다. 세 번 틀리면 유심이 잠기며, 이 경우 유심을 다시 풀기 위해서는 통신사에 연락하여 복구 절차를 진행해야 합니다. 다만, FAQ 원문에 세 번 틀렸을 때의 구체적인 결과에 대한 정보가 없습니다.

**모델 본문**

> 유심 PIN의 초기값은 0000입니다. 세 번 틀리면 유심이 잠기며, 이 경우 유심을 다시 풀기 위해서는 통신사에 연락하여 복구 절차를 진행해야 합니다. 다만, FAQ 원문에 세 번 틀렸을 때의 구체적인 결과에 대한 정보가 없습니다.

**Judge가 표시한 주장**

- FABRICATION: PIN을 세 번 틀리면 유심이 잠깁니다.
  - 사유: 챗봇이 받은 자료에는 세 번 틀렸을 때의 결과가 없습니다.
- FABRICATION: 통신사에 연락하여 복구 절차를 진행해야 합니다.
  - 사유: 챗봇이 받은 자료에는 해당 복구 절차가 없습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 유심 PIN 초기값 0000을 정확히 답했습니다.
- 하위 #2: WRONG_ANSWER — 유심 잠김은 언급했지만 필요한 PUK를 빠뜨리고 근거 없는 복구 절차를 안내했습니다.
- Judge 요약: 초기값은 자료와 일치하지만, 세 번 오류 시 답변은 PUK를 누락했고 받은 자료에 없는 사실을 단정했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 유심 PIN 초기값이 뭐예요?; FAQ 1270, 157
- 실제 하위 #2: 세 번 틀리면 어떻게 돼요?; FAQ 없음
- 검색 #1: 유심 PIN 초기값은 뭐예요?
- 검색 #2: 세 번 틀리면 어떻게 돼요?

**실제로 입력된 FAQ 원문**

- FAQ 1270: 유심 PIN 번호가 무엇인가요?
> 유심 PIN은 휴대폰을 켤 때 유심을 잠그는 비밀번호로 초기값은 0000입니다. 유심 PIN은 휴대폰 설정의 SIM 카드 잠금에서 켜고 원하는 번호로 바꿀 수 있습니다.
- FAQ 157: 유심 비밀번호(PIN)를 설정할 수 있나요?
> 유심 비밀번호(PIN)는 휴대폰 설정의 보안 메뉴에서 유심 잠금 기능으로 설정할 수 있습니다. 유심 잠금(PIN)을 설정하면 휴대폰을 켤 때 PIN을 입력해야 합니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=2; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1270, 157
- 원본: [results.jsonl:77](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:77](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:76](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 유심 PIN의 초기값은 0000입니다. 세 번 틀리면 유심이 잠기고, 이후에는 유심을 다시 풀기 위해 고객센터에 연락하거나, 휴대폰을 재설치하거나, 유심을 교체해야 합니다. 다만, 세 번 틀렸을 때의 정확한 처리 방식은 FAQ에 명시되어 있지 않습니다.
> 
> 「세 번 틀리면 어떻게 돼요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 유심 PIN의 초기값은 0000입니다. 세 번 틀리면 유심이 잠기고, 이후에는 유심을 다시 풀기 위해 고객센터에 연락하거나, 휴대폰을 재설치하거나, 유심을 교체해야 합니다. 다만, 세 번 틀렸을 때의 정확한 처리 방식은 FAQ에 명시되어 있지 않습니다.

**코드 고정 안내**

> 「세 번 틀리면 어떻게 돼요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**Judge가 표시한 주장**

- FABRICATION: PIN을 세 번 틀리면 유심이 잠긴다.
  - 사유: 챗봇이 받은 자료에는 세 번 오류 시의 결과가 없습니다.
- FABRICATION: 고객센터에 연락하거나 휴대폰을 재설치하거나 유심을 교체해야 한다.
  - 사유: 챗봇이 받은 자료에는 이러한 후속 조치가 없습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 유심 PIN 초기값 0000을 정확히 답했습니다.
- 하위 #2: WRONG_ANSWER — 세 번 틀리면 PUK가 필요하다는 핵심 내용을 빠뜨리고 근거 없는 조치를 안내했습니다.
- Judge 요약: 초기값은 맞았지만 두 번째 답변은 PUK 필요성을 누락했고, 제공된 자료에 없는 결과와 조치를 확정했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 유심 PIN 초기값이 뭐예요?; FAQ 1270, 157
- 실제 하위 #2: 세 번 틀리면 어떻게 돼요?; FAQ 없음
- 검색 #1: 유심 PIN 초기값은 뭐예요?
- 검색 #2: 세 번 틀리면 어떻게 돼요?

**실제로 입력된 FAQ 원문**

- FAQ 1270: 유심 PIN 번호가 무엇인가요?
> 유심 PIN은 휴대폰을 켤 때 유심을 잠그는 비밀번호로 초기값은 0000입니다. 유심 PIN은 휴대폰 설정의 SIM 카드 잠금에서 켜고 원하는 번호로 바꿀 수 있습니다.
- FAQ 157: 유심 비밀번호(PIN)를 설정할 수 있나요?
> 유심 비밀번호(PIN)는 휴대폰 설정의 보안 메뉴에서 유심 잠금 기능으로 설정할 수 있습니다. 유심 잠금(PIN)을 설정하면 휴대폰을 켤 때 PIN을 입력해야 합니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1270, 157
- 원본: [results.jsonl:29](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:29](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:29](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 유심 PIN의 초기값은 0000입니다. 휴대폰을 켤 때 유심을 잠그는 비밀번호로, 초기값은 0000이며, 휴대폰 설정의 SIM 카드 잠금에서 원하는 번호로 변경할 수 있습니다.
> 
> 「세 번 틀리면 어떻게 돼요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 유심 PIN의 초기값은 0000입니다. 휴대폰을 켤 때 유심을 잠그는 비밀번호로, 초기값은 0000이며, 휴대폰 설정의 SIM 카드 잠금에서 원하는 번호로 변경할 수 있습니다.

**코드 고정 안내**

> 「세 번 틀리면 어떻게 돼요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_ANSWER — 유심 PIN 초기값이 0000이라고 정확히 답했습니다.
- 하위 #2: MISSING_ANSWER — 세 번 틀렸을 때의 결과를 모델 본문에서 답하지 않았습니다.
- Judge 요약: 첫 질문에는 근거대로 답했지만, 두 번째 질문은 모델이 받은 자료에 없어 답하지 않았으며 정답 기준상 답변 누락입니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 유심 PIN 초기값이 뭐예요?; FAQ 1270, 157
- 실제 하위 #2: 세 번 틀리면 어떻게 돼요?; FAQ 없음
- 검색 #1: 유심 PIN 초기값은 뭐예요?
- 검색 #2: 세 번 틀리면 어떻게 돼요?
- slot #1: ANSWER; 최종 본문에 남음
> 유심 PIN의 초기값은 0000입니다. 휴대폰을 켤 때 유심을 잠그는 비밀번호로, 초기값은 0000이며, 휴대폰 설정의 SIM 카드 잠금에서 원하는 번호로 변경할 수 있습니다.
- slot #2: ABSTAIN; 최종 본문에서 제거
> 세 번 틀리면 유심이 잠겨서 사용이 불가능해지며, 유심을 다시 설정하거나 통신사에 연락하여 복구를 요청해야 합니다. 세 번 틀리면 유심이 잠겨서 사용이 불가능해지며, 이 경우는 유심을 다시 설정하거나 통신사에 연락하여 복구를 요청해야 합니다.

**실제로 입력된 FAQ 원문**

- FAQ 1270: 유심 PIN 번호가 무엇인가요?
> 유심 PIN은 휴대폰을 켤 때 유심을 잠그는 비밀번호로 초기값은 0000입니다. 유심 PIN은 휴대폰 설정의 SIM 카드 잠금에서 켜고 원하는 번호로 바꿀 수 있습니다.
- FAQ 157: 유심 비밀번호(PIN)를 설정할 수 있나요?
> 유심 비밀번호(PIN)는 휴대폰 설정의 보안 메뉴에서 유심 잠금 기능으로 설정할 수 있습니다. 유심 잠금(PIN)을 설정하면 휴대폰을 켤 때 PIN을 입력해야 합니다.

</details>

<a id="ma-030"></a>
## MA-030 · 신청 채널 확인과 실제 신청·내역 조회 가능 채널

> 통화 내역은 앱에서 몇 개월까지 보이고, 상대 번호 전체가 나온 내역은 어디서 신청해요?

- 분류: 복합·모두 답할 수 있음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 환각 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC02](hallucination_progression.md#hc02), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 통화 내역은 앱에서 몇 개월까지 보이고 → ANSWER; gold FAQ 1243, 1244 (gold는 실제 제공 자료와 다를 수 있음)
- #2 상대 번호 전체가 나온 내역은 어디서 신청해요? → ANSWER; gold FAQ 1243 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: search_queries_changed
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1244, 1251, 1617
- 원본: [results.jsonl:80](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:80](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:81](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 통화 내역은 앱에서 최근 6개월까지 보입니다. 상대 번호 전체가 나온 내역은 가입 통신사의 공식 고객센터나 앱에서 확인할 수 있으며, 관련 신청 채널과 필요 서류는 그곳에서 확인해야 합니다.

**모델 본문**

> 통화 내역은 앱에서 최근 6개월까지 보입니다. 상대 번호 전체가 나온 내역은 가입 통신사의 공식 고객센터나 앱에서 확인할 수 있으며, 관련 신청 채널과 필요 서류는 그곳에서 확인해야 합니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 상대 번호 전체가 나온 내역은 가입 통신사의 공식 고객센터나 앱에서 확인할 수 있습니다.
  - 사유: 받은 FAQ는 고객센터나 앱에서 신청 채널과 필요 서류를 확인하라고 할 뿐, 번호 전체가 나온 내역을 그곳에서 확인할 수 있다고 하지 않습니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 앱에서 최근 6개월까지 볼 수 있다고 정확히 답했습니다.
- 하위 #2: MISSING_ANSWER — 상대 번호 전체가 나온 내역을 어디서 신청하는지는 답하지 않고 확인 경로만 안내했습니다.
- Judge 요약: 앱 조회 기간은 맞지만 번호 전체가 나온 내역의 신청 장소는 답하지 않았고, 확인 가능 경로도 근거를 넘어섰습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 통화 내역은 앱에서 몇 개월까지 보이고,; FAQ 1244, 1251
- 실제 하위 #2: 상대 번호 전체가 나온 내역은 어디서 신청해요?; FAQ 1617
- 검색 #1: 통화 내역은 앱에서 몇 개월까지 보이나요?
- 검색 #2: 상대 번호 전체가 나온 내역은 어디서 신청해요?

**실제로 입력된 FAQ 원문**

- FAQ 1244: 통화 내역은 얼마 동안 조회할 수 있나요?
> Ubot 앱에서는 최근 6개월의 발신 통화 내역을 조회할 수 있습니다. 통화 내역은 최근 12개월까지 조회할 수 있으며 앱에서 볼 수 없는 기간의 내역은 명의자가 신분증을 가지고 매장에서 신청해 주세요. 법령에 따른 통화 내역 보관 기간이 지났다면 내역을 제공할 수 없습니다.
- FAQ 1251: 남은 통화량은 어떻게 확인하나요?
> 남은 통화·문자 제공량은 Ubot 앱 첫 화면이나 114 자동응답에서 확인할 수 있습니다. 음성통화가 기본 제공되는 요금제에서는 남은 통화량이 '무제한'으로 표시됩니다.
- FAQ 1617: 본인 명의 휴대폰의 통화 내역을 열람하려면 어떻게 신청하나요?
> 본인 명의 휴대폰의 통화 내역 열람은 본인 확인과 개인정보 보호 절차가 필요한 업무입니다. 통화 내역의 열람 가능한 항목, 기간, 신청 채널과 필요 서류는 가입 통신사의 공식 고객센터나 앱에서 확인해 주세요. 타인의 통화 내역은 본인 명의 여부와 별도 권한 확인 없이 안내할 수 없습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1244, 1251, 1617
- 원본: [results.jsonl:80](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:80](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:77](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 통화 내역은 앱에서 최근 6개월까지 보입니다. 상대 번호 전체가 나온 내역은 가입 통신사의 공식 고객센터나 앱에서 확인할 수 있으며, 그곳에서 신청해야 합니다.

**모델 본문**

> 통화 내역은 앱에서 최근 6개월까지 보입니다. 상대 번호 전체가 나온 내역은 가입 통신사의 공식 고객센터나 앱에서 확인할 수 있으며, 그곳에서 신청해야 합니다.

**Judge가 표시한 주장**

- UNSUPPORTED_GENERALIZATION: 상대 번호 전체가 나온 내역은 가입 통신사의 공식 고객센터나 앱에서 신청해야 합니다.
  - 사유: 받은 FAQ는 고객센터나 앱에서 신청 채널과 서류를 확인하라고만 하며, 그곳에서 신청할 수 있다고 명시하지 않습니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 앱에서 최근 6개월까지 볼 수 있다는 핵심 기간을 맞게 답했습니다.
- 하위 #2: WRONG_ANSWER — 명의자가 신분증을 가지고 매장에서 신청해야 하는데, 고객센터나 앱에서 신청해야 한다고 답했습니다.
- Judge 요약: 첫 질문의 6개월은 맞지만, 두 번째 질문은 신청 장소를 잘못 안내했고 받은 자료에 없는 신청 가능 여부까지 단정했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 통화 내역은 앱에서 몇 개월까지 보이고,; FAQ 1244, 1251
- 실제 하위 #2: 상대 번호 전체가 나온 내역은 어디서 신청해요?; FAQ 1617
- 검색 #1: 통화 내역은 앱에서 몇 개월까지 보이나요?
- 검색 #2: 상대 번호 전체가 나온 내역은 어디서 신청해요?

**실제로 입력된 FAQ 원문**

- FAQ 1244: 통화 내역은 얼마 동안 조회할 수 있나요?
> Ubot 앱에서는 최근 6개월의 발신 통화 내역을 조회할 수 있습니다. 통화 내역은 최근 12개월까지 조회할 수 있으며 앱에서 볼 수 없는 기간의 내역은 명의자가 신분증을 가지고 매장에서 신청해 주세요. 법령에 따른 통화 내역 보관 기간이 지났다면 내역을 제공할 수 없습니다.
- FAQ 1251: 남은 통화량은 어떻게 확인하나요?
> 남은 통화·문자 제공량은 Ubot 앱 첫 화면이나 114 자동응답에서 확인할 수 있습니다. 음성통화가 기본 제공되는 요금제에서는 남은 통화량이 '무제한'으로 표시됩니다.
- FAQ 1617: 본인 명의 휴대폰의 통화 내역을 열람하려면 어떻게 신청하나요?
> 본인 명의 휴대폰의 통화 내역 열람은 본인 확인과 개인정보 보호 절차가 필요한 업무입니다. 통화 내역의 열람 가능한 항목, 기간, 신청 채널과 필요 서류는 가입 통신사의 공식 고객센터나 앱에서 확인해 주세요. 타인의 통화 내역은 본인 명의 여부와 별도 권한 확인 없이 안내할 수 없습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1244, 1251, 1617
- 원본: [results.jsonl:170](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:170](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:166](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> Ubot 앱에서는 최근 6개월의 발신 통화 내역을 조회할 수 있습니다. 통화 내역은 최근 12개월까지 조회할 수 있으며, 앱에서 볼 수 없는 기간의 내역은 명의자가 신분증을 가지고 매장에서 신청해 주어야 합니다.
> 
> 「상대 번호 전체가 나온 내역은 어디서 신청해요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> Ubot 앱에서는 최근 6개월의 발신 통화 내역을 조회할 수 있습니다. 통화 내역은 최근 12개월까지 조회할 수 있으며, 앱에서 볼 수 없는 기간의 내역은 명의자가 신분증을 가지고 매장에서 신청해 주어야 합니다.

**코드 고정 안내**

> 「상대 번호 전체가 나온 내역은 어디서 신청해요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_ANSWER — 앱에서 최근 6개월의 발신 통화 내역을 조회할 수 있다고 정확히 답했습니다.
- 하위 #2: MISSING_ANSWER — 매장 신청 안내는 앱에서 볼 수 없는 기간에 관한 것으로, 상대 번호 전체가 나온 내역의 신청처는 답하지 않았습니다.
- Judge 요약: 모델 답변은 받은 FAQ 1244에 근거하지만, 두 번째 질문의 핵심인 전체 번호 표시 내역의 신청처를 명시하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 통화 내역은 앱에서 몇 개월까지 보이고,; FAQ 1244, 1251
- 실제 하위 #2: 상대 번호 전체가 나온 내역은 어디서 신청해요?; FAQ 1617
- 검색 #1: 통화 내역은 앱에서 몇 개월까지 보이나요?
- 검색 #2: 상대 번호 전체가 나온 내역은 어디서 신청하나요?
- slot #1: ANSWER; 최종 본문에 남음
> Ubot 앱에서는 최근 6개월의 발신 통화 내역을 조회할 수 있습니다. 통화 내역은 최근 12개월까지 조회할 수 있으며, 앱에서 볼 수 없는 기간의 내역은 명의자가 신분증을 가지고 매장에서 신청해 주어야 합니다.
- slot #2: ABSTAIN; 최종 본문에서 제거
> 상대 번호 전체가 나온 내역은 가입 통신사의 공식 고객센터나 앱에서 확인하고, 필요한 경우 신청할 수 있습니다. 하지만 구체적인 신청 절차나 서류는 고객센터나 앱에서 확인해야 합니다.

**실제로 입력된 FAQ 원문**

- FAQ 1244: 통화 내역은 얼마 동안 조회할 수 있나요?
> Ubot 앱에서는 최근 6개월의 발신 통화 내역을 조회할 수 있습니다. 통화 내역은 최근 12개월까지 조회할 수 있으며 앱에서 볼 수 없는 기간의 내역은 명의자가 신분증을 가지고 매장에서 신청해 주세요. 법령에 따른 통화 내역 보관 기간이 지났다면 내역을 제공할 수 없습니다.
- FAQ 1251: 남은 통화량은 어떻게 확인하나요?
> 남은 통화·문자 제공량은 Ubot 앱 첫 화면이나 114 자동응답에서 확인할 수 있습니다. 음성통화가 기본 제공되는 요금제에서는 남은 통화량이 '무제한'으로 표시됩니다.
- FAQ 1617: 본인 명의 휴대폰의 통화 내역을 열람하려면 어떻게 신청하나요?
> 본인 명의 휴대폰의 통화 내역 열람은 본인 확인과 개인정보 보호 절차가 필요한 업무입니다. 통화 내역의 열람 가능한 항목, 기간, 신청 채널과 필요 서류는 가입 통신사의 공식 고객센터나 앱에서 확인해 주세요. 타인의 통화 내역은 본인 명의 여부와 별도 권한 확인 없이 안내할 수 없습니다.

</details>

<a id="mn-003"></a>
## MN-003 · 배터리 교체의 무상 여부

> 무상 수리 기간이 몇 년이고 배터리 교체도 무상이에요?

- 분류: 복합·모두 답할 수 없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **없음 → 환각 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 무상 수리 기간이 몇 년이고 → ABSTAIN; gold FAQ 1014 (gold는 실제 제공 자료와 다를 수 있음)
- #2 배터리 교체도 무상이에요? → ABSTAIN; gold FAQ 1014, 1392 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: search_queries_changed
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1014
- 원본: [results.jsonl:93](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:93](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:91](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 무상 수리 기간은 제조사 보증 정책을 따르며, 구체적인 기간은 FAQ에 명시되어 있지 않습니다. 배터리 교체에 대한 무상 정책도 FAQ에 포함되어 있지 않습니다.

**모델 본문**

> 무상 수리 기간은 제조사 보증 정책을 따르며, 구체적인 기간은 FAQ에 명시되어 있지 않습니다. 배터리 교체에 대한 무상 정책도 FAQ에 포함되어 있지 않습니다.

- 하위 #1: CORRECT_DECLINE — 구체적인 무상 수리 기간이 자료에 없다고 안내했습니다.
- 하위 #2: CORRECT_DECLINE — 배터리 교체의 무상 여부가 자료에 없다고 안내했습니다.
- Judge 요약: 두 질문 모두 자료에 없는 값을 지어내지 않았고, 검색어도 원래 질문의 의미를 유지했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 무상 수리 기간이 몇 년이고; FAQ 1014
- 실제 하위 #2: 배터리 교체도 무상이에요?; FAQ 없음
- 검색 #1: 무상 수리 기간이 몇 년인가요?
- 검색 #2: 배터리 교체가 무상인가요?

**실제로 입력된 FAQ 원문**

- FAQ 1014: 휴대폰을 사고 얼마 동안 무상 수리를 받을 수 있나요?
> 휴대폰 무상 수리 기간과 범위는 제조사 보증 정책을 따르며 수리는 통신사 매장이 아닌 제조사 서비스센터에서 접수합니다. 휴대폰이 고의나 부주의로 파손됐다면 무상 보증 기간에도 유상 수리일 수 있습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1014
- 원본: [results.jsonl:93](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:93](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:89](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 무상 수리 기간은 제조사 보증 정책을 따르며, 구체적인 기간은 제조사에 따라 다릅니다. 배터리 교체는 무상이 아니며, 무상 수리 기간과는 별개로 제조사 보증 정책에 따라 결정됩니다.
> 
> 「배터리 교체도 무상이에요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 무상 수리 기간은 제조사 보증 정책을 따르며, 구체적인 기간은 제조사에 따라 다릅니다. 배터리 교체는 무상이 아니며, 무상 수리 기간과는 별개로 제조사 보증 정책에 따라 결정됩니다.

**코드 고정 안내**

> 「배터리 교체도 무상이에요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**Judge가 표시한 주장**

- FABRICATION: 배터리 교체는 무상이 아니며 무상 수리 기간과 별개로 결정됩니다.
  - 사유: 제공된 FAQ에는 배터리 교체의 유상 여부나 별도 적용 조건이 없습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_DECLINE — 제조사 보증 정책을 따른다고 안내하고 자료에 없는 연수를 제시하지 않았습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 자료에 없는 배터리 교체 유상 여부를 확정했습니다.
- Judge 요약: 수리 기간의 연수는 지어내지 않았지만, 배터리 교체에 대해서는 근거 없는 결론을 제시했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 무상 수리 기간이 몇 년이고; FAQ 1014
- 실제 하위 #2: 배터리 교체도 무상이에요?; FAQ 없음
- 검색 #1: 무상 수리 기간이 몇 년인가요?
- 검색 #2: 배터리 교체가 무상인가요?

**실제로 입력된 FAQ 원문**

- FAQ 1014: 휴대폰을 사고 얼마 동안 무상 수리를 받을 수 있나요?
> 휴대폰 무상 수리 기간과 범위는 제조사 보증 정책을 따르며 수리는 통신사 매장이 아닌 제조사 서비스센터에서 접수합니다. 휴대폰이 고의나 부주의로 파손됐다면 무상 보증 기간에도 유상 수리일 수 있습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1014
- 원본: [results.jsonl:30](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:30](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:30](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 무상 수리 기간은 제조사 보증 정책을 따르며, 통신사 매장이 아닌 제조사 서비스센터에서 수리 접수합니다. 고의나 부주의로 파손된 경우 무상 보증 기간에도 유상 수리가 될 수 있습니다. 구체적인 기간은 제조사 정책에 따라 달라지므로, 해당 휴대폰의 제조사 보증 정책을 확인해야 합니다.
> 
> 「배터리 교체도 무상이에요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 무상 수리 기간은 제조사 보증 정책을 따르며, 통신사 매장이 아닌 제조사 서비스센터에서 수리 접수합니다. 고의나 부주의로 파손된 경우 무상 보증 기간에도 유상 수리가 될 수 있습니다. 구체적인 기간은 제조사 정책에 따라 달라지므로, 해당 휴대폰의 제조사 보증 정책을 확인해야 합니다.

**코드 고정 안내**

> 「배터리 교체도 무상이에요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_DECLINE — 몇 년인지 단정하지 않고 제조사 보증 정책을 확인하도록 안내했습니다.
- 하위 #2: CORRECT_DECLINE — 배터리 교체의 무상 여부를 지어내지 않고 답하지 않았습니다.
- Judge 요약: 모델 답변은 제공된 FAQ 범위의 일반 정보만 전했고, 자료에 없는 기간과 배터리 교체 여부를 확정하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 무상 수리 기간이 몇 년이고; FAQ 1014
- 실제 하위 #2: 배터리 교체도 무상이에요?; FAQ 없음
- 검색 #1: 무상 수리 기간은 몇 년이에요?
- 검색 #2: 배터리 교체는 무상이에요?
- slot #1: ANSWER; 최종 본문에 남음
> 무상 수리 기간은 제조사 보증 정책을 따르며, 통신사 매장이 아닌 제조사 서비스센터에서 수리 접수합니다. 고의나 부주의로 파손된 경우 무상 보증 기간에도 유상 수리가 될 수 있습니다. 구체적인 기간은 제조사 정책에 따라 달라지므로, 해당 휴대폰의 제조사 보증 정책을 확인해야 합니다.
- slot #2: ABSTAIN; 최종 본문에서 제거
> 배터리 교체에 대한 무상 여부는 FAQ에 명시되어 있지 않습니다. 따라서 배터리 교체가 무상인지 여부를 확정할 수 없습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1014: 휴대폰을 사고 얼마 동안 무상 수리를 받을 수 있나요?
> 휴대폰 무상 수리 기간과 범위는 제조사 보증 정책을 따르며 수리는 통신사 매장이 아닌 제조사 서비스센터에서 접수합니다. 휴대폰이 고의나 부주의로 파손됐다면 무상 보증 기간에도 유상 수리일 수 있습니다.

</details>

<a id="mn-005"></a>
## MN-005 · 해외 수신 로밍 요금을 와이파이 콜링에 적용

> 와이파이 콜링 요금이 얼마고 해외에서도 무료예요?

- 분류: 복합·모두 답할 수 없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 없음 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC02](hallucination_progression.md#hc02), [HC04](hallucination_progression.md#hc04)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 와이파이 콜링 요금이 얼마고 → ABSTAIN; gold FAQ 1016 (gold는 실제 제공 자료와 다를 수 있음)
- #2 해외에서도 무료예요? → ABSTAIN; gold FAQ 1016 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: search_queries_changed
- 입력 차이 sub_slot: search_queries_changed
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1016, 1297, 1302
- 원본: [results.jsonl:95](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:95](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:95](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 와이파이 콜링 요금은 단말기와 요금제에 따라 달라서 정확한 금액을 확인할 수 없습니다. 해외에서 문자를 받는 것은 일반적으로 무료지만, 음성통화를 받는 경우 국가별로 분당 로밍 요금이 부과될 수 있습니다. 따라서 해외에서 무료라고 할 수는 없습니다. 요금제 및 단말기 정보가 필요합니다.

**모델 본문**

> 와이파이 콜링 요금은 단말기와 요금제에 따라 달라서 정확한 금액을 확인할 수 없습니다. 해외에서 문자를 받는 것은 일반적으로 무료지만, 음성통화를 받는 경우 국가별로 분당 로밍 요금이 부과될 수 있습니다. 따라서 해외에서 무료라고 할 수는 없습니다. 요금제 및 단말기 정보가 필요합니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 따라서 해외에서 무료라고 할 수는 없습니다.
  - 사유: 해외 수신 통화의 로밍 요금을 와이파이 콜링의 해외 요금 판단에 적용했습니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC04](hallucination_progression.md#hc04)

- 하위 #1: CORRECT_DECLINE — 요금이 단말기와 요금제에 따라 달라 정확한 금액을 확인할 수 없다고 했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 일반 로밍 요금을 근거로 해외 와이파이 콜링이 무료가 아니라고 결론 내렸습니다.
- Judge 요약: 첫 질문은 적절히 답변을 보류했지만, 둘째 질문은 다른 서비스의 요금을 근거로 결론을 냈습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 와이파이 콜링 요금이 얼마고; FAQ 1016, 1297
- 실제 하위 #2: 해외에서도 무료예요?; FAQ 1302
- 검색 #1: 와이파이 콜링 요금이 얼마인가요?
- 검색 #2: 해외에서도와이파이 콜링이 무료인가요?

**실제로 입력된 FAQ 원문**

- FAQ 1016: 와이파이로 전화를 걸 수 있나요?
> 와이파이 콜링을 지원하는 단말기에서 기능을 설정하면 와이파이 연결 상태로 전화를 걸 수 있습니다. 와이파이 콜링 지원 여부와 요금 적용은 단말기와 요금제에 따라 달라 고객센터에서 확인해 주세요.
- FAQ 1297: 로밍 상품 요금은 얼마인가요?
> 로밍 상품 요금은 국가와 관계없이 데이터 사용 24시간 구간마다 베이직 1GB 11,000원, 플러스 2GB 13,000원, 맥스 5GB 15,000원입니다. 로밍 상품은 데이터를 쓴 24시간 구간에만 요금이 부과되며 음성통화와 문자 요금은 포함되지 않습니다.
- FAQ 1302: 해외에서 전화나 문자를 받으면 요금이 나오나요?
> 해외에서 문자를 받는 것은 일반적으로 무료지만 국가별 로밍 조건을 확인해 주세요. 해외에서 음성통화를 받으면 국가별 분당 로밍 요금이 부과되지만 벨만 울리고 받지 않으면 요금이 없습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1016, 1297, 1302
- 원본: [results.jsonl:95](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:95](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:90](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 「와이파이 콜링 요금이 얼마고」, 「해외에서도 무료예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 「와이파이 콜링 요금이 얼마고」, 「해외에서도 무료예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_DECLINE — 요금액을 지어내지 않았고 시스템 고정 안내에서 확인 불가를 알렸습니다.
- 하위 #2: CORRECT_DECLINE — 해외 무료 여부를 단정하지 않았고 시스템 고정 안내에서 확인 불가를 알렸습니다.
- Judge 요약: 모델 본문은 비어 있어 근거 없는 주장이 없으며, 검색어는 두 질문의 의미를 그대로 담았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 와이파이 콜링 요금이 얼마고; FAQ 1016, 1297
- 실제 하위 #2: 해외에서도 무료예요?; FAQ 1302
- 검색 #1: 와이파이 콜링 요금이 얼마인가요?
- 검색 #2: 해외에서도 와이파이 콜링이 무료인가요?

**실제로 입력된 FAQ 원문**

- FAQ 1016: 와이파이로 전화를 걸 수 있나요?
> 와이파이 콜링을 지원하는 단말기에서 기능을 설정하면 와이파이 연결 상태로 전화를 걸 수 있습니다. 와이파이 콜링 지원 여부와 요금 적용은 단말기와 요금제에 따라 달라 고객센터에서 확인해 주세요.
- FAQ 1297: 로밍 상품 요금은 얼마인가요?
> 로밍 상품 요금은 국가와 관계없이 데이터 사용 24시간 구간마다 베이직 1GB 11,000원, 플러스 2GB 13,000원, 맥스 5GB 15,000원입니다. 로밍 상품은 데이터를 쓴 24시간 구간에만 요금이 부과되며 음성통화와 문자 요금은 포함되지 않습니다.
- FAQ 1302: 해외에서 전화나 문자를 받으면 요금이 나오나요?
> 해외에서 문자를 받는 것은 일반적으로 무료지만 국가별 로밍 조건을 확인해 주세요. 해외에서 음성통화를 받으면 국가별 분당 로밍 요금이 부과되지만 벨만 울리고 받지 않으면 요금이 없습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1016, 1297, 1302
- 원본: [results.jsonl:183](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:183](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:179](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 와이파이 콜링 요금은 단말기와 요금제에 따라 달라서 정확한 금액은 고객센터에서 확인해야 합니다.
> 
> 해외에서 문자를 받는 것은 일반적으로 무료지만, 음성통화를 받는 경우 국가별 분당 로밍 요금이 부과될 수 있습니다. 벨만 울리고 받지 않으면 요금이 없습니다.

**모델 본문**

> 와이파이 콜링 요금은 단말기와 요금제에 따라 달라서 정확한 금액은 고객센터에서 확인해야 합니다.
> 
> 해외에서 문자를 받는 것은 일반적으로 무료지만, 음성통화를 받는 경우 국가별 분당 로밍 요금이 부과될 수 있습니다. 벨만 울리고 받지 않으면 요금이 없습니다.

- 하위 #1: CORRECT_DECLINE — 요금을 지어내지 않고 단말기와 요금제에 따라 달라 고객센터 확인이 필요하다고 안내했습니다.
- 하위 #2: CORRECT_DECLINE — 해외 와이파이 콜링이 무료인지 단정하지 않았고, 덧붙인 로밍 안내는 제공된 FAQ에 근거합니다.
- Judge 요약: 두 질문 모두 자료에 없는 요금이나 해외 무료 여부를 확정하지 않았으며, 답변의 사실 주장은 제공된 FAQ에 근거합니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 와이파이 콜링 요금이 얼마고; FAQ 1016, 1297
- 실제 하위 #2: 해외에서도 무료예요?; FAQ 1302
- 검색 #1: 와이파이 콜링 요금은 얼마인가요?
- 검색 #2: 해외에서도와이파이 콜링이 무료인가요?
- slot #1: ANSWER; 최종 본문에 남음
> 와이파이 콜링 요금은 단말기와 요금제에 따라 달라서 정확한 금액은 고객센터에서 확인해야 합니다.
- slot #2: ANSWER; 최종 본문에 남음
> 해외에서 문자를 받는 것은 일반적으로 무료지만, 음성통화를 받는 경우 국가별 분당 로밍 요금이 부과될 수 있습니다. 벨만 울리고 받지 않으면 요금이 없습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1016: 와이파이로 전화를 걸 수 있나요?
> 와이파이 콜링을 지원하는 단말기에서 기능을 설정하면 와이파이 연결 상태로 전화를 걸 수 있습니다. 와이파이 콜링 지원 여부와 요금 적용은 단말기와 요금제에 따라 달라 고객센터에서 확인해 주세요.
- FAQ 1297: 로밍 상품 요금은 얼마인가요?
> 로밍 상품 요금은 국가와 관계없이 데이터 사용 24시간 구간마다 베이직 1GB 11,000원, 플러스 2GB 13,000원, 맥스 5GB 15,000원입니다. 로밍 상품은 데이터를 쓴 24시간 구간에만 요금이 부과되며 음성통화와 문자 요금은 포함되지 않습니다.
- FAQ 1302: 해외에서 전화나 문자를 받으면 요금이 나오나요?
> 해외에서 문자를 받는 것은 일반적으로 무료지만 국가별 로밍 조건을 확인해 주세요. 해외에서 음성통화를 받으면 국가별 분당 로밍 요금이 부과되지만 벨만 울리고 받지 않으면 요금이 없습니다.

</details>

<a id="mn-014"></a>
## MN-014 · 사용 전 환불 규칙에서 사용 후 부분 환불 불가 역추론

> 로밍 패스를 쓰다가 해지하면 부분 환불되나요? 환불은 며칠 걸려요?

- 분류: 복합·모두 답할 수 없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 환각 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 로밍 패스를 쓰다가 해지하면 부분 환불되나요? → ABSTAIN; gold FAQ 197 (gold는 실제 제공 자료와 다를 수 있음)
- #2 환불은 며칠 걸려요? → ABSTAIN; gold FAQ 197 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: context_sections_changed
- 입력 차이 v4sub_slot: faq_set_changed, sub_question_input_changed, search_queries_changed, context_sections_changed

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 197
- 원본: [results.jsonl:104](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:104](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:101](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 로밍 패스를 쓰다가 해지하면 부분 환불되지 않습니다. 로밍 패스 사용이 시작되지 않았고 여행이 취소된 경우에만 전액 환불이 가능하며, 사용이 시작된 경우는 환불이 불가능합니다. 환불에 대한 기간 정보는 FAQ에 명시되어 있지 않습니다.

**모델 본문**

> 로밍 패스를 쓰다가 해지하면 부분 환불되지 않습니다. 로밍 패스 사용이 시작되지 않았고 여행이 취소된 경우에만 전액 환불이 가능하며, 사용이 시작된 경우는 환불이 불가능합니다. 환불에 대한 기간 정보는 FAQ에 명시되어 있지 않습니다.

**Judge가 표시한 주장**

- FABRICATION: 로밍 패스를 쓰다가 해지하면 부분 환불되지 않으며, 사용이 시작된 경우 환불이 불가능합니다.
  - 사유: FAQ는 사용 전 취소 시 전액 환불만 설명하고 사용 후 환불 여부는 다루지 않습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04), [HC05](hallucination_progression.md#hc05)

- 하위 #1: UNSUPPORTED_ANSWER — 사용 중 해지 시 부분 환불 여부는 자료에 없는데, 불가하다고 단정했습니다.
- 하위 #2: CORRECT_DECLINE — 환불 소요 기간이 FAQ에 없다고 안내하며 일수를 지어내지 않았습니다.
- Judge 요약: 사용 후 환불 불가 주장은 근거가 없지만, 환불 소요 기간에 대해서는 적절히 답변을 유보했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 로밍 패스를 쓰다가 해지하면 부분 환불되나요?; FAQ 197
- 실제 하위 #2: 환불은 며칠 걸려요?; FAQ 없음
- 검색 #1: 로밍 패스를 해지할 때 부분 환불이 되나요?
- 검색 #2: 로밍 패스 환불이 이루어질 때 며칠 걸려요?

**실제로 입력된 FAQ 원문**

- FAQ 197: 여행이 취소됐는데 로밍 패스는 어떻게 하나요?
> 여행이 취소되어 출국하지 않았고 로밍 패스 사용이 시작되지 않았다면 가입을 취소하고 전액 환불받을 수 있습니다. 사용 전 로밍 패스 취소는 앱이나 고객센터에서 신청해 주세요.

</details>

### v1 sub

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=2; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 197
- 원본: [results.jsonl:104](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:104](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:100](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 로밍 패스를 쓰다가 해지하면 부분 환불되나요? 환불은 며칠 걸려요?
> 
> 로밍 패스를 사용 중에 해지했을 경우, 사용이 시작되지 않았거나 사용이 제한된 상황이어야 전액 환불이 가능하며, 사용이 시작된 경우는 부분 환불이 되지 않습니다. 따라서 사용이 시작된 경우 부분 환불은 되지 않습니다.
> 
> 환불 처리 기간에 대해서는 FAQ에 명시된 정보가 없어 정확한 기간을 알 수 없습니다.
> 
> ※ 참고: [FAQ ID: 197]에 따르면, 여행이 취소되고 출국하지 않았으며 로밍 패스 사용이 시작되지 않았다면 전액 환불이 가능합니다. 사용이 시작된 경우는 해당 조건에 해당하지 않아 부분 환불이 되지 않습니다.
> 
> 「환불은 며칠 걸려요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 로밍 패스를 쓰다가 해지하면 부분 환불되나요? 환불은 며칠 걸려요?
> 
> 로밍 패스를 사용 중에 해지했을 경우, 사용이 시작되지 않았거나 사용이 제한된 상황이어야 전액 환불이 가능하며, 사용이 시작된 경우는 부분 환불이 되지 않습니다. 따라서 사용이 시작된 경우 부분 환불은 되지 않습니다.
> 
> 환불 처리 기간에 대해서는 FAQ에 명시된 정보가 없어 정확한 기간을 알 수 없습니다.
> 
> ※ 참고: [FAQ ID: 197]에 따르면, 여행이 취소되고 출국하지 않았으며 로밍 패스 사용이 시작되지 않았다면 전액 환불이 가능합니다. 사용이 시작된 경우는 해당 조건에 해당하지 않아 부분 환불이 되지 않습니다.

**코드 고정 안내**

> 「환불은 며칠 걸려요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**Judge가 표시한 주장**

- FABRICATION: 사용이 제한된 상황이면 전액 환불이 가능하다.
  - 사유: FAQ에는 사용 제한 상황의 환불 조건이 없습니다.
- UNSUPPORTED_GENERALIZATION: 사용이 시작된 경우 부분 환불이 되지 않는다.
  - 사유: FAQ는 사용 전 취소의 전액 환불만 설명하며 사용 후 부분 환불 여부는 밝히지 않습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04), [HC05](hallucination_progression.md#hc05)

- 하위 #1: UNSUPPORTED_ANSWER — 자료에 없는 사용 중 해지 시 부분 환불 불가를 확정했습니다.
- 하위 #2: CORRECT_DECLINE — 환불 처리 기간이 자료에 없다고 안내했습니다.
- Judge 요약: 환불 기간은 적절히 답변을 유보했지만, 사용 후 부분 환불 불가와 추가 환불 조건을 근거 없이 단정했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 로밍 패스를 쓰다가 해지하면 부분 환불되나요?; FAQ 197
- 실제 하위 #2: 환불은 며칠 걸려요?; FAQ 없음
- 검색 #1: 로밍 패스를 해지할 때 부분 환불이 되나요?
- 검색 #2: 로밍 패스 환불이 이루어질 때 며칠 걸려요?

**실제로 입력된 FAQ 원문**

- FAQ 197: 여행이 취소됐는데 로밍 패스는 어떻게 하나요?
> 여행이 취소되어 출국하지 않았고 로밍 패스 사용이 시작되지 않았다면 가입을 취소하고 전액 환불받을 수 있습니다. 사용 전 로밍 패스 취소는 앱이나 고객센터에서 신청해 주세요.

</details>

### v4 slot

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=1; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 197
- 원본: [results.jsonl:32](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:32](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:36](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 로밍 패스를 쓰다가 해지하면 부분 환불되지 않습니다. 로밍 패스 사용이 시작되지 않았고 여행이 취소된 경우에만 전액 환불이 가능합니다. 사용 전 해지 시 앱이나 고객센터에서 신청해야 합니다.
> 
> 「환불은 며칠 걸려요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 로밍 패스를 쓰다가 해지하면 부분 환불되지 않습니다. 로밍 패스 사용이 시작되지 않았고 여행이 취소된 경우에만 전액 환불이 가능합니다. 사용 전 해지 시 앱이나 고객센터에서 신청해야 합니다.

**코드 고정 안내**

> 「환불은 며칠 걸려요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**Judge가 표시한 주장**

- FABRICATION: 로밍 패스를 쓰다가 해지하면 부분 환불되지 않습니다.
  - 사유: FAQ는 사용 전 취소 시 전액 환불만 설명하며, 사용 후 부분 환불 여부는 제시하지 않습니다.
- UNSUPPORTED_GENERALIZATION: 사용이 시작되지 않았고 여행이 취소된 경우에만 전액 환불이 가능합니다.
  - 사유: FAQ의 환불 가능 사례를 유일한 환불 조건으로 단정했습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04), [HC05](hallucination_progression.md#hc05)

- 하위 #1: UNSUPPORTED_ANSWER — 사용 중 해지 시 부분 환불이 안 된다고 단정했지만, 자료에는 해당 내용이 없습니다.
- 하위 #2: CORRECT_DECLINE — 환불 소요 기간을 지어내지 않았고, 시스템 고정 안내가 답변 불가를 알렸습니다.
- Judge 요약: 부분 환불 여부를 근거 없이 단정했으며, 환불 기간은 답하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 로밍 패스를 쓰다가 해지하면 부분 환불되나요?; FAQ 197
- 실제 하위 #2: 환불은 며칠 걸려요?; FAQ 없음
- 검색 #1: 로밍 패스를 해지할 때 부분 환불이 되나요?
- 검색 #2: 로밍 패스 환불이 이루어질 때 며칠 걸려요?
- slot #1: ANSWER; 최종 본문에 남음
> 로밍 패스를 쓰다가 해지하면 부분 환불되지 않습니다. 로밍 패스 사용이 시작되지 않았고 여행이 취소된 경우에만 전액 환불이 가능합니다. 사용 전 해지 시 앱이나 고객센터에서 신청해야 합니다.
- slot #2: ABSTAIN; 최종 본문에서 제거
> 환불 기간에 대한 정보가 FAQ에 없습니다. 환불이 며칠 걸리는지에 대한 정책은 제공된 자료에 없습니다.

**실제로 입력된 FAQ 원문**

- FAQ 197: 여행이 취소됐는데 로밍 패스는 어떻게 하나요?
> 여행이 취소되어 출국하지 않았고 로밍 패스 사용이 시작되지 않았다면 가입을 취소하고 전액 환불받을 수 있습니다. 사용 전 로밍 패스 취소는 앱이나 고객센터에서 신청해 주세요.

</details>

<a id="mn-015"></a>
## MN-015 · 일반 일시정지 연 2회와 장기 정지 연장 횟수

> 장기 일시정지는 최대 몇 년까지 되고, 연장은 몇 번까지 돼요?

- 분류: 복합·모두 답할 수 없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **없음 → 환각 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC02](hallucination_progression.md#hc02), [HC03](hallucination_progression.md#hc03)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 장기 일시정지는 최대 몇 년까지 되고 → ABSTAIN; gold FAQ 1435, 1320 (gold는 실제 제공 자료와 다를 수 있음)
- #2 연장은 몇 번까지 돼요? → ABSTAIN; gold FAQ 1435 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1431, 1435, 1433
- 원본: [results.jsonl:105](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:105](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:99](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 장기 일시정지의 최대 기간과 연장 횟수에 대한 정확한 정보는 제공된 FAQ에서 명시되어 있지 않습니다. 다만, [FAQ ID: 1435]에서는 '장기 정지는 군 입대, 해외 체류, 입원처럼 증빙 서류가 있는 경우에 더 긴 기간 동안 신청할 수 있습니다'라고 언급하고 있으며, 일시정지의 경우 '연 2회, 1회 최대 90일'이라고 명시되어 있습니다. 그러나 이 내용은 일시정지와 장기 정지의 차이를 설명하는 것이며, 장기 일시정지의 최대 기간이나 연장 횟수에 대한 구체적인 기준은 포함되어 있지 않습니다. 따라서 장기 일시정지의 최대 기간과 연장 횟수는 확정할 수 없습니다.

**모델 본문**

> 장기 일시정지의 최대 기간과 연장 횟수에 대한 정확한 정보는 제공된 FAQ에서 명시되어 있지 않습니다. 다만, [FAQ ID: 1435]에서는 '장기 정지는 군 입대, 해외 체류, 입원처럼 증빙 서류가 있는 경우에 더 긴 기간 동안 신청할 수 있습니다'라고 언급하고 있으며, 일시정지의 경우 '연 2회, 1회 최대 90일'이라고 명시되어 있습니다. 그러나 이 내용은 일시정지와 장기 정지의 차이를 설명하는 것이며, 장기 일시정지의 최대 기간이나 연장 횟수에 대한 구체적인 기준은 포함되어 있지 않습니다. 따라서 장기 일시정지의 최대 기간과 연장 횟수는 확정할 수 없습니다.

- 하위 #1: CORRECT_DECLINE — 장기 일시정지의 최대 기간이 자료에 없다고 안내했습니다.
- 하위 #2: CORRECT_DECLINE — 장기 일시정지의 연장 횟수가 자료에 없다고 안내했습니다.
- Judge 요약: 모델은 일반 일시정지 조건과 장기 정지 조건을 구분하고, 자료에 없는 두 값을 확정하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 장기 일시정지는 최대 몇 년까지 되고,; FAQ 1431, 1435
- 실제 하위 #2: 연장은 몇 번까지 돼요?; FAQ 1431, 1435, 1433
- 검색 #1: 장기 일시정지의 최대 기간은 몇 년까지 되나요?
- 검색 #2: 장기 일시정지 연장은 몇 번까지 돼요?

**실제로 입력된 FAQ 원문**

- FAQ 1431: 휴대폰을 잠시 쉬려면 어떻게 하나요?
> 휴대폰을 잠시 쉬려면 Ubot 앱·고객센터·매장에서 일시정지를 신청하면 됩니다. 휴대폰 일시정지는 연 2회, 1회 최대 90일, 연간 합계 180일까지 가능합니다. 일시정지 기간에는 월 3,850원이 청구됩니다.
- FAQ 1435: 일시정지와 장기 정지는 무엇이 다른가요?
> 일시정지는 누구나 연 2회, 1회 최대 90일까지 월 3,850원에 신청할 수 있습니다. 장기 정지는 군 입대, 해외 체류, 입원처럼 증빙 서류가 있는 경우에 더 긴 기간 동안 신청할 수 있습니다.
- FAQ 1433: 일시정지 기간이 끝나면 자동으로 풀리나요?
> 신청한 일시정지 기간이 끝나면 정지가 자동으로 해제되어 원래 요금제로 다시 쓸 수 있습니다. 일시정지는 1회 최대 90일을 넘겨 자동 연장되지 않으므로, 더 쉬려면 다시 신청해 주세요.

</details>

### v1 sub

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1431, 1435, 1433
- 원본: [results.jsonl:105](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:105](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:97](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 장기 일시정지의 최대 기간은 FAQ 문서에서 명시되어 있지 않습니다. 다만, 장기 정지는 군 입대, 해외 체류, 입원 등 증빙 서류가 있는 경우에 더 긴 기간 동안 신청할 수 있다고 설명되어 있습니다. 그러나 구체적인 기간(예: 몇 년까지)은 제공되지 않았습니다.
> 
> 연장은 일시정지에 대해 '연 2회'로 제한되어 있으며, 이는 1회 최대 90일까지 가능하다는 점에서, 연장은 2번까지 가능하다고 볼 수 있습니다. 그러나 '장기 일시정지'와 '일시정지'의 구분이 명확히 되어 있지 않아, 장기 일시정지의 연장 횟수에 대한 정확한 정보는 확정할 수 없습니다.
> 
> 「장기 일시정지는 최대 몇 년까지 되고」, 「연장은 몇 번까지 돼요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 장기 일시정지의 최대 기간은 FAQ 문서에서 명시되어 있지 않습니다. 다만, 장기 정지는 군 입대, 해외 체류, 입원 등 증빙 서류가 있는 경우에 더 긴 기간 동안 신청할 수 있다고 설명되어 있습니다. 그러나 구체적인 기간(예: 몇 년까지)은 제공되지 않았습니다.
> 
> 연장은 일시정지에 대해 '연 2회'로 제한되어 있으며, 이는 1회 최대 90일까지 가능하다는 점에서, 연장은 2번까지 가능하다고 볼 수 있습니다. 그러나 '장기 일시정지'와 '일시정지'의 구분이 명확히 되어 있지 않아, 장기 일시정지의 연장 횟수에 대한 정확한 정보는 확정할 수 없습니다.

**코드 고정 안내**

> 「장기 일시정지는 최대 몇 년까지 되고」, 「연장은 몇 번까지 돼요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 연장은 2번까지 가능하다고 볼 수 있습니다.
  - 사유: 자료의 연 2회는 일반 일시정지 신청 횟수이며, 장기 일시정지의 연장 횟수는 제시되지 않았습니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC03](hallucination_progression.md#hc03)

- 하위 #1: CORRECT_DECLINE — 장기 일시정지의 최대 기간이 자료에 없다고 안내했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 일반 일시정지의 연 2회 신청 제한을 근거로 연장도 2번 가능하다고 답했습니다.
- Judge 요약: 최대 기간은 적절히 답변을 유보했지만, 연장 횟수에는 다른 제도의 제한을 적용했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 장기 일시정지는 최대 몇 년까지 되고,; FAQ 1431, 1435
- 실제 하위 #2: 연장은 몇 번까지 돼요?; FAQ 1431, 1435, 1433
- 검색 #1: 장기 일시정지의 최대 기간은 몇 년까지 되나요?
- 검색 #2: 장기 일시정지 연장은 몇 번까지 돼요?

**실제로 입력된 FAQ 원문**

- FAQ 1431: 휴대폰을 잠시 쉬려면 어떻게 하나요?
> 휴대폰을 잠시 쉬려면 Ubot 앱·고객센터·매장에서 일시정지를 신청하면 됩니다. 휴대폰 일시정지는 연 2회, 1회 최대 90일, 연간 합계 180일까지 가능합니다. 일시정지 기간에는 월 3,850원이 청구됩니다.
- FAQ 1435: 일시정지와 장기 정지는 무엇이 다른가요?
> 일시정지는 누구나 연 2회, 1회 최대 90일까지 월 3,850원에 신청할 수 있습니다. 장기 정지는 군 입대, 해외 체류, 입원처럼 증빙 서류가 있는 경우에 더 긴 기간 동안 신청할 수 있습니다.
- FAQ 1433: 일시정지 기간이 끝나면 자동으로 풀리나요?
> 신청한 일시정지 기간이 끝나면 정지가 자동으로 해제되어 원래 요금제로 다시 쓸 수 있습니다. 일시정지는 1회 최대 90일을 넘겨 자동 연장되지 않으므로, 더 쉬려면 다시 신청해 주세요.

</details>

### v4 slot

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1431, 1435, 1433
- 원본: [results.jsonl:192](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:192](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:184](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 「장기 일시정지는 최대 몇 년까지 되고」, 「연장은 몇 번까지 돼요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 「장기 일시정지는 최대 몇 년까지 되고」, 「연장은 몇 번까지 돼요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_DECLINE — 장기 일시정지의 최대 연수는 자료에 없고, 모델은 값을 답하지 않았습니다.
- 하위 #2: CORRECT_DECLINE — 장기 일시정지의 연장 횟수는 자료에 없고, 모델은 값을 답하지 않았습니다.
- Judge 요약: 모델 본문은 비어 있으며, 시스템 고정 안내는 평가 대상이 아니지만 두 질문에 답하지 않은 것으로 판정합니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 장기 일시정지는 최대 몇 년까지 되고,; FAQ 1431, 1435
- 실제 하위 #2: 연장은 몇 번까지 돼요?; FAQ 1431, 1435, 1433
- 검색 #1: 장기 일시정지의 최대 기간은 몇 년까지 되나요?
- 검색 #2: 장기 일시정지 연장은 몇 번까지 돼요?
- slot #1: ABSTAIN; 최종 본문에서 제거
> 장기 일시정지의 최대 기간은 FAQ 원문에서 명시되어 있지 않으며, 일시정지와 장기 정지의 차이점에 따르면 장기 정지는 군 입대, 해외 체류, 입원 등 증빙 서류가 있는 경우에 적용되지만, 구체적인 기간은 명시되어 있지 않습니다. 따라서 장기 일시정지의 최대 기간은 제공된 자료에서 확인할 수 없습니다.
- slot #2: ABSTAIN; 최종 본문에서 제거
> 연장은 FAQ 원문에서 '일시정지'에 대해 '연 2회'라고 명시되어 있으며, 이는 일시정지의 경우에만 적용되는 것으로, 장기 정지에 대한 연장 횟수는 언급되어 있지 않습니다. 따라서 연장 가능한 횟수는 일시정지에 한해 '2회'로 제한되며, 장기 정지에 대한 연장 횟수는 제공된 자료에서 확인할 수 없습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1431: 휴대폰을 잠시 쉬려면 어떻게 하나요?
> 휴대폰을 잠시 쉬려면 Ubot 앱·고객센터·매장에서 일시정지를 신청하면 됩니다. 휴대폰 일시정지는 연 2회, 1회 최대 90일, 연간 합계 180일까지 가능합니다. 일시정지 기간에는 월 3,850원이 청구됩니다.
- FAQ 1435: 일시정지와 장기 정지는 무엇이 다른가요?
> 일시정지는 누구나 연 2회, 1회 최대 90일까지 월 3,850원에 신청할 수 있습니다. 장기 정지는 군 입대, 해외 체류, 입원처럼 증빙 서류가 있는 경우에 더 긴 기간 동안 신청할 수 있습니다.
- FAQ 1433: 일시정지 기간이 끝나면 자동으로 풀리나요?
> 신청한 일시정지 기간이 끝나면 정지가 자동으로 해제되어 원래 요금제로 다시 쓸 수 있습니다. 일시정지는 1회 최대 90일을 넘겨 자동 연장되지 않으므로, 더 쉬려면 다시 신청해 주세요.

</details>

<a id="mn-020"></a>
## MN-020 · 임대료·분실 변상금·기종 선택 가능 여부

> 임대폰 변상금이 얼마고 임대폰 기종은 고를 수 있어요?

- 분류: 복합·모두 답할 수 없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 환각 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC02](hallucination_progression.md#hc02), [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 임대폰 변상금이 얼마고 → ABSTAIN; gold FAQ 1456 (gold는 실제 제공 자료와 다를 수 있음)
- #2 임대폰 기종은 고를 수 있어요? → ABSTAIN; gold FAQ 1456, 1394 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: search_queries_changed
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=2; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1456, 1394, 1622
- 원본: [results.jsonl:110](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:110](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:106](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 임대폰 분실 시 최초 7일은 무료로 사용이 가능하며, 이후 하루 2,200원이 청구됩니다. 임대폰 기종은 선택이 가능하지만, 신청 대상, 재고, 이용 기간 및 비용은 통신사 고객센터나 방문 예정 매장에서 확인해야 합니다. 기종 선택은 고객센터나 매장에서 진행됩니다.

**모델 본문**

> 임대폰 분실 시 최초 7일은 무료로 사용이 가능하며, 이후 하루 2,200원이 청구됩니다. 임대폰 기종은 선택이 가능하지만, 신청 대상, 재고, 이용 기간 및 비용은 통신사 고객센터나 방문 예정 매장에서 확인해야 합니다. 기종 선택은 고객센터나 매장에서 진행됩니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 임대폰 분실 시 최초 7일은 무료이고 이후 하루 2,200원이 청구됩니다.
  - 사유: 7일 무료와 하루 2,200원은 임대 이용료이며, 임대폰 분실 변상금에 적용되는 금액이 아닙니다.
- FABRICATION: 임대폰 기종은 선택이 가능하며 고객센터나 매장에서 선택을 진행합니다.
  - 사유: 제공된 자료에는 기종 선택 가능 여부나 선택 절차가 없습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC02](hallucination_progression.md#hc02), [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)

- 하위 #1: UNSUPPORTED_ANSWER — 변상금 액수는 자료에 없는데 임대 이용료를 분실 시 비용처럼 답했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 기종 선택 가능 여부와 선택 절차는 자료에 없는데 가능하다고 단정했습니다.
- Judge 요약: 검색어는 두 질문을 충실히 반영했지만, 모델은 자료에 없는 변상금 답변과 기종 선택 가능 여부를 단정했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 임대폰 변상금이 얼마고; FAQ 1456, 1394
- 실제 하위 #2: 임대폰 기종은 고를 수 있어요?; FAQ 1622
- 검색 #1: 임대폰 변상금이 얼마인가요?
- 검색 #2: 임대폰 기종은 고를 수 있나요?

**실제로 입력된 FAQ 원문**

- FAQ 1456: 분실한 동안 쓸 임대폰을 빌릴 수 있나요?
> 분실 신고 후 Ubot 매장에서 신분증을 보여 주면 임대폰을 빌릴 수 있습니다. 분실 시 빌린 임대폰은 최초 7일 무료이고 이후 하루 2,200원이 청구됩니다. 임대폰을 잃어버리거나 파손하면 정해진 변상금이 청구됩니다.
- FAQ 1394: 수리 기간 동안 쓸 임대폰을 빌릴 수 있나요?
> 휴대폰 수리 접수증이나 분실 신고 내역을 Ubot 매장에 보여 주면 임대폰을 빌릴 수 있습니다. Ubot 임대폰은 최초 7일 무료이며 이후 임대 기간에는 하루 2,200원이 청구됩니다.
- FAQ 1622: 새 휴대폰을 마련하기 전까지 임대폰을 이용할 수 있나요?
> 새 휴대폰을 마련하기 전 임대폰을 쓸 수 있는지 가입 통신사의 고객센터나 방문 예정 매장에서 신청 대상, 재고, 이용 기간 및 비용을 확인해 주세요. 임대폰을 이용할 수 있다면 회선과 유심을 임대 기기에 연결하는 절차를 안내받아 주세요.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=2; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1456, 1394, 1622
- 원본: [results.jsonl:110](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:110](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:104](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 임대폰 변상금은 분실 또는 파손 시 최초 7일 무료 이후 하루 2,200원이 청구됩니다. 임대폰 기종은 선택이 가능하지만, 신청 대상, 재고, 이용 기간 및 비용은 통신사 고객센터나 방문 예정 매장에서 확인해야 합니다. 기종 선택은 고객센터나 매장에서 진행됩니다.

**모델 본문**

> 임대폰 변상금은 분실 또는 파손 시 최초 7일 무료 이후 하루 2,200원이 청구됩니다. 임대폰 기종은 선택이 가능하지만, 신청 대상, 재고, 이용 기간 및 비용은 통신사 고객센터나 방문 예정 매장에서 확인해야 합니다. 기종 선택은 고객센터나 매장에서 진행됩니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 임대폰 변상금은 최초 7일 무료 이후 하루 2,200원이 청구됩니다.
  - 사유: 7일 무료와 하루 2,200원은 임대료이며, 자료에 변상금 액수는 없습니다.
- FABRICATION: 임대폰 기종은 선택이 가능합니다.
  - 사유: 자료에 기종 선택 가능 여부가 없습니다.
- FABRICATION: 기종 선택은 고객센터나 매장에서 진행됩니다.
  - 사유: 자료에 기종 선택 절차가 없습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC02](hallucination_progression.md#hc02), [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)

- 하위 #1: UNSUPPORTED_ANSWER — 임대료를 변상금으로 잘못 적용해 금액을 답했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 자료에 없는 기종 선택 가능 여부와 선택 절차를 확정했습니다.
- Judge 요약: 두 질문 모두 자료에 없는 값을 확정했고, 임대료를 변상금으로 혼동했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 임대폰 변상금이 얼마고; FAQ 1456, 1394
- 실제 하위 #2: 임대폰 기종은 고를 수 있어요?; FAQ 1622
- 검색 #1: 임대폰 변상금은 얼마인가요?
- 검색 #2: 임대폰 기종은 고를 수 있나요?

**실제로 입력된 FAQ 원문**

- FAQ 1456: 분실한 동안 쓸 임대폰을 빌릴 수 있나요?
> 분실 신고 후 Ubot 매장에서 신분증을 보여 주면 임대폰을 빌릴 수 있습니다. 분실 시 빌린 임대폰은 최초 7일 무료이고 이후 하루 2,200원이 청구됩니다. 임대폰을 잃어버리거나 파손하면 정해진 변상금이 청구됩니다.
- FAQ 1394: 수리 기간 동안 쓸 임대폰을 빌릴 수 있나요?
> 휴대폰 수리 접수증이나 분실 신고 내역을 Ubot 매장에 보여 주면 임대폰을 빌릴 수 있습니다. Ubot 임대폰은 최초 7일 무료이며 이후 임대 기간에는 하루 2,200원이 청구됩니다.
- FAQ 1622: 새 휴대폰을 마련하기 전까지 임대폰을 이용할 수 있나요?
> 새 휴대폰을 마련하기 전 임대폰을 쓸 수 있는지 가입 통신사의 고객센터나 방문 예정 매장에서 신청 대상, 재고, 이용 기간 및 비용을 확인해 주세요. 임대폰을 이용할 수 있다면 회선과 유심을 임대 기기에 연결하는 절차를 안내받아 주세요.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1456, 1394, 1622
- 원본: [results.jsonl:197](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:197](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:187](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 분실한 임대폰을 빌릴 수 있는 기간은 최초 7일 무료이며, 이후 하루 2,200원이 청구됩니다. 임대폰을 잃어버리거나 파손하면 정해진 변상금이 청구됩니다.
> 
> 임대폰 기종을 선택할 수는 있지만, 신청 대상, 재고, 이용 기간 및 비용은 통신사 고객센터나 방문 예정 매장에서 확인해야 합니다. 기종 선택은 가능하지만, 구체적인 기종 리스트나 선택 기준은 제공되지 않았습니다.

**모델 본문**

> 분실한 임대폰을 빌릴 수 있는 기간은 최초 7일 무료이며, 이후 하루 2,200원이 청구됩니다. 임대폰을 잃어버리거나 파손하면 정해진 변상금이 청구됩니다.
> 
> 임대폰 기종을 선택할 수는 있지만, 신청 대상, 재고, 이용 기간 및 비용은 통신사 고객센터나 방문 예정 매장에서 확인해야 합니다. 기종 선택은 가능하지만, 구체적인 기종 리스트나 선택 기준은 제공되지 않았습니다.

**Judge가 표시한 주장**

- FABRICATION: 임대폰 기종을 선택할 수 있습니다.
  - 사유: 받은 자료에는 임대폰 기종 선택 가능 여부가 나와 있지 않습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC02](hallucination_progression.md#hc02), [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_DECLINE — 변상금 액수를 지어내지 않고, 변상금이 청구된다는 근거 있는 정보만 전했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 자료에 없는 기종 선택 가능 여부를 가능하다고 단정했습니다.
- Judge 요약: 변상금 액수는 답하지 않았지만, 근거 없이 기종 선택이 가능하다고 답했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 임대폰 변상금이 얼마고; FAQ 1456, 1394
- 실제 하위 #2: 임대폰 기종은 고를 수 있어요?; FAQ 1622
- 검색 #1: 임대폰 변상금은 얼마인가요?
- 검색 #2: 임대폰 기종은 고를 수 있나요?
- slot #1: ANSWER; 최종 본문에 남음
> 분실한 임대폰을 빌릴 수 있는 기간은 최초 7일 무료이며, 이후 하루 2,200원이 청구됩니다. 임대폰을 잃어버리거나 파손하면 정해진 변상금이 청구됩니다.
- slot #2: ANSWER; 최종 본문에 남음
> 임대폰 기종을 선택할 수는 있지만, 신청 대상, 재고, 이용 기간 및 비용은 통신사 고객센터나 방문 예정 매장에서 확인해야 합니다. 기종 선택은 가능하지만, 구체적인 기종 리스트나 선택 기준은 제공되지 않았습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1456: 분실한 동안 쓸 임대폰을 빌릴 수 있나요?
> 분실 신고 후 Ubot 매장에서 신분증을 보여 주면 임대폰을 빌릴 수 있습니다. 분실 시 빌린 임대폰은 최초 7일 무료이고 이후 하루 2,200원이 청구됩니다. 임대폰을 잃어버리거나 파손하면 정해진 변상금이 청구됩니다.
- FAQ 1394: 수리 기간 동안 쓸 임대폰을 빌릴 수 있나요?
> 휴대폰 수리 접수증이나 분실 신고 내역을 Ubot 매장에 보여 주면 임대폰을 빌릴 수 있습니다. Ubot 임대폰은 최초 7일 무료이며 이후 임대 기간에는 하루 2,200원이 청구됩니다.
- FAQ 1622: 새 휴대폰을 마련하기 전까지 임대폰을 이용할 수 있나요?
> 새 휴대폰을 마련하기 전 임대폰을 쓸 수 있는지 가입 통신사의 고객센터나 방문 예정 매장에서 신청 대상, 재고, 이용 기간 및 비용을 확인해 주세요. 임대폰을 이용할 수 있다면 회선과 유심을 임대 기기에 연결하는 절차를 안내받아 주세요.

</details>

<a id="mp-005"></a>
## MP-005 · 복지 감면액 결정 주체와 확인 채널 추측

> 복지 할인 대상은 누구고 감면 금액은 얼마예요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 환각 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC02](hallucination_progression.md#hc02), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 복지 할인 대상은 누구고 → ANSWER; gold FAQ 1492, 1156 (gold는 실제 제공 자료와 다를 수 있음)
- #2 감면 금액은 얼마예요? → ABSTAIN; gold FAQ 1492 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: sub_question_input_changed, search_queries_changed
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: sub_question_input_changed, search_queries_changed

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1492, 1156
- 원본: [results.jsonl:115](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:115](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:110](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 복지 할인 대상은 장애인, 국가유공자, 기초생활수급자, 차상위계층, 기초연금 수급자입니다. 감면 금액은 대상별로 다릅니다. 구체적인 금액은 FAQ에 명시되어 있지 않으며, 자세한 정보는 매장이나 고객센터에서 확인해야 합니다.

**모델 본문**

> 복지 할인 대상은 장애인, 국가유공자, 기초생활수급자, 차상위계층, 기초연금 수급자입니다. 감면 금액은 대상별로 다릅니다. 구체적인 금액은 FAQ에 명시되어 있지 않으며, 자세한 정보는 매장이나 고객센터에서 확인해야 합니다.

**Judge가 표시한 주장**

- UNSUPPORTED_GENERALIZATION: 자세한 정보는 매장이나 고객센터에서 확인해야 합니다.
  - 사유: 자료는 매장이나 고객센터에서 할인 신청이 가능하다고만 하며, 감면 금액을 그곳에서 확인해야 한다고 명시하지 않습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC02](hallucination_progression.md#hc02), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 복지 할인 대상 다섯 범주를 자료와 일치하게 답했습니다.
- 하위 #2: CORRECT_DECLINE — 대상별로 금액이 다르다고만 설명하고 구체적인 금액은 제시하지 않았습니다.
- Judge 요약: 대상과 금액에 대한 답변 판정은 적절하지만, 금액 확인 경로에 관한 단정은 받은 자료로 뒷받침되지 않습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 복지 할인 대상은 누구고; FAQ 1492, 1156
- 실제 하위 #2: 감면 금액은 얼마예요?; FAQ 1156, 1492
- 검색 #1: 복지 할인 대상은 누구예요?
- 검색 #2: 복지 할인 감면 금액은 얼마예요?

**실제로 입력된 FAQ 원문**

- FAQ 1492: 복지 할인 대상은 누구인가요?
> 복지 할인 대상은 장애인, 국가유공자, 기초생활수급자, 차상위계층, 기초연금 수급자입니다. 복지 할인 금액은 대상별로 다릅니다. 복지 할인은 매장이나 고객센터에서 신청하면 정부 자격 확인 후 적용됩니다.
- FAQ 1156: 복지 할인은 어떻게 받나요?
> 기초생활수급자, 장애인, 국가유공자 등 복지 할인 대상자는 매장이나 고객센터에서 신청하면 요금제와 관계없이 월 요금을 감면받을 수 있습니다. 복지 할인 대상 자격은 1년마다 다시 확인하며 자격이 없어지면 할인이 종료됩니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1492, 1156
- 원본: [results.jsonl:115](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:115](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:107](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 복지 할인 대상은 장애인, 국가유공자, 기초생활수급자, 차상위계층, 기초연금 수급자입니다. 감면 금액은 대상별로 다릅니다. 구체적인 금액은 FAQ에 명시되어 있지 않으며, 실제 감면 금액은 대상별로 정부에서 결정하고, 매장이나 고객센터에서 자격 확인 후 적용됩니다.
> 
> 「감면 금액은 얼마예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 복지 할인 대상은 장애인, 국가유공자, 기초생활수급자, 차상위계층, 기초연금 수급자입니다. 감면 금액은 대상별로 다릅니다. 구체적인 금액은 FAQ에 명시되어 있지 않으며, 실제 감면 금액은 대상별로 정부에서 결정하고, 매장이나 고객센터에서 자격 확인 후 적용됩니다.

**코드 고정 안내**

> 「감면 금액은 얼마예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**Judge가 표시한 주장**

- FABRICATION: 실제 감면 금액은 대상별로 정부에서 결정합니다.
  - 사유: 자료에는 금액이 대상별로 다르다는 내용만 있고 정부가 금액을 결정한다는 근거는 없습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC02](hallucination_progression.md#hc02), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 복지 할인 대상 다섯 범주를 자료와 일치하게 답했습니다.
- 하위 #2: CORRECT_DECLINE — 구체적인 감면 금액이 자료에 없다고 밝히고 금액을 지어내지 않았습니다.
- Judge 요약: 대상과 금액 미제공 여부는 올바르게 처리했지만, 정부가 감면 금액을 결정한다는 근거 없는 사실을 덧붙였습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 복지 할인 대상은 누구고; FAQ 1492, 1156
- 실제 하위 #2: 감면 금액은 얼마예요?; FAQ 없음
- 검색 #1: 복지 할인 대상은 누구예요?
- 검색 #2: 복지 감면 금액은 얼마예요?

**실제로 입력된 FAQ 원문**

- FAQ 1492: 복지 할인 대상은 누구인가요?
> 복지 할인 대상은 장애인, 국가유공자, 기초생활수급자, 차상위계층, 기초연금 수급자입니다. 복지 할인 금액은 대상별로 다릅니다. 복지 할인은 매장이나 고객센터에서 신청하면 정부 자격 확인 후 적용됩니다.
- FAQ 1156: 복지 할인은 어떻게 받나요?
> 기초생활수급자, 장애인, 국가유공자 등 복지 할인 대상자는 매장이나 고객센터에서 신청하면 요금제와 관계없이 월 요금을 감면받을 수 있습니다. 복지 할인 대상 자격은 1년마다 다시 확인하며 자격이 없어지면 할인이 종료됩니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1492, 1156
- 원본: [results.jsonl:37](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:37](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:37](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 복지 할인 대상은 장애인, 국가유공자, 기초생활수급자, 차상위계층, 기초연금 수급자입니다. 복지 할인 금액은 대상별로 다릅니다.
> 
> 「감면 금액은 얼마예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 복지 할인 대상은 장애인, 국가유공자, 기초생활수급자, 차상위계층, 기초연금 수급자입니다. 복지 할인 금액은 대상별로 다릅니다.

**코드 고정 안내**

> 「감면 금액은 얼마예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_ANSWER — 복지 할인 대상 다섯 범주를 자료대로 모두 답했습니다.
- 하위 #2: CORRECT_DECLINE — 구체적인 감면 금액을 지어내지 않고 대상별로 다르다고만 답했습니다.
- Judge 요약: 모델 답변은 제공된 FAQ에 근거하며, 금액 확인 불가 안내는 시스템 고정 문구이므로 모델의 안내로 세지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 복지 할인 대상은 누구고; FAQ 1492, 1156
- 실제 하위 #2: 감면 금액은 얼마예요?; FAQ 없음
- 검색 #1: 복지 할인 대상은 누구예요?
- 검색 #2: 복지 감면 금액은 얼마예요?
- slot #1: ANSWER; 최종 본문에 남음
> 복지 할인 대상은 장애인, 국가유공자, 기초생활수급자, 차상위계층, 기초연금 수급자입니다. 복지 할인 금액은 대상별로 다릅니다.
- slot #2: ABSTAIN; 최종 본문에서 제거
> 감면 금액은 대상별로 다릅니다. 구체적인 금액은 FAQ에 명시되어 있지 않아 정확한 금액을 알 수 없습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1492: 복지 할인 대상은 누구인가요?
> 복지 할인 대상은 장애인, 국가유공자, 기초생활수급자, 차상위계층, 기초연금 수급자입니다. 복지 할인 금액은 대상별로 다릅니다. 복지 할인은 매장이나 고객센터에서 신청하면 정부 자격 확인 후 적용됩니다.
- FAQ 1156: 복지 할인은 어떻게 받나요?
> 기초생활수급자, 장애인, 국가유공자 등 복지 할인 대상자는 매장이나 고객센터에서 신청하면 요금제와 관계없이 월 요금을 감면받을 수 있습니다. 복지 할인 대상 자격은 1년마다 다시 확인하며 자격이 없어지면 할인이 종료됩니다.

</details>

<a id="mp-006"></a>
## MP-006 · 요금 감면의 통신사 귀책 조건 누락

> 통신 장애로 3시간 넘게 못 쓰면 보상되나요? 몇 배를 감면해 줘요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **없음 → 없음 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC04](hallucination_progression.md#hc04)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 통신 장애로 3시간 넘게 못 쓰면 보상되나요? → ANSWER; gold FAQ 1491 (gold는 실제 제공 자료와 다를 수 있음)
- #2 몇 배를 감면해 줘요? → ABSTAIN; gold FAQ 1491 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1491
- 원본: [results.jsonl:116](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:116](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:107](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 통신 장애로 3시간 넘게 서비스를 못 쓰면 보상이 됩니다. Ubot의 책임으로 연속 3시간 이상 서비스를 쓰지 못했을 경우, 해당 시간 요금의 일정 배수를 감면해 드립니다. 그러나 몇 배를 감면해 주는지에 대한 구체적인 배수는 FAQ에 명시되어 있지 않으며, 개별 통신 장애의 경우 고객센터에 신청해야 합니다. 대규모 통신 장애는 자동으로 요금 감면이 처리됩니다.

**모델 본문**

> 통신 장애로 3시간 넘게 서비스를 못 쓰면 보상이 됩니다. Ubot의 책임으로 연속 3시간 이상 서비스를 쓰지 못했을 경우, 해당 시간 요금의 일정 배수를 감면해 드립니다. 그러나 몇 배를 감면해 주는지에 대한 구체적인 배수는 FAQ에 명시되어 있지 않으며, 개별 통신 장애의 경우 고객센터에 신청해야 합니다. 대규모 통신 장애는 자동으로 요금 감면이 처리됩니다.

- 하위 #1: CORRECT_ANSWER — Ubot 책임으로 연속 3시간 이상 이용하지 못한 경우 요금 감면을 받을 수 있다고 정확히 답했습니다.
- 하위 #2: CORRECT_DECLINE — 구체적인 감면 배수는 FAQ에 없다고 밝히고 값을 지어내지 않았습니다.
- Judge 요약: 답변의 보상 조건과 처리 방법은 제공된 FAQ와 일치하며, 검색어도 두 질문을 충실히 담았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 통신 장애로 3시간 넘게 못 쓰면 보상되나요?; FAQ 1491
- 실제 하위 #2: 몇 배를 감면해 줘요?; FAQ 1491
- 검색 #1: 통신 장애로 3시간 넘게 못 쓰면 보상되나요?
- 검색 #2: 통신 장애 시 몇 배를 감면해 주나요?

**실제로 입력된 FAQ 원문**

- FAQ 1491: 통신 장애로 서비스를 못 썼는데 보상을 받을 수 있나요?
> Ubot의 책임으로 연속 3시간 이상 서비스를 쓰지 못했다면 약관에 따라 해당 시간 요금의 일정 배수를 감면해 드립니다. 대규모 통신 장애에 대한 요금 감면은 자동으로 처리됩니다. 개별 통신 장애에 대한 요금 감면은 고객센터에 신청해 주세요.

</details>

### v1 sub

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1491
- 원본: [results.jsonl:116](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:116](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:106](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 통신 장애로 3시간 넘게 서비스를 못 쓰면, Ubot의 책임으로 연속 3시간 이상 서비스를 쓰지 못했다면 약관에 따라 해당 시간 요금의 일정 배수를 감면해 드립니다. 그러나 몇 배를 감면해 주는지에 대한 구체적인 배수는 FAQ에 명시되어 있지 않습니다. 대규모 통신 장애에 대한 감면은 자동으로 처리되지만, 개별 통신 장애의 경우는 고객센터에 신청해야 합니다. 따라서 보상은 가능하지만, 감면 배수는 명시되지 않았습니다.
> 
> 「몇 배를 감면해 줘요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 통신 장애로 3시간 넘게 서비스를 못 쓰면, Ubot의 책임으로 연속 3시간 이상 서비스를 쓰지 못했다면 약관에 따라 해당 시간 요금의 일정 배수를 감면해 드립니다. 그러나 몇 배를 감면해 주는지에 대한 구체적인 배수는 FAQ에 명시되어 있지 않습니다. 대규모 통신 장애에 대한 감면은 자동으로 처리되지만, 개별 통신 장애의 경우는 고객센터에 신청해야 합니다. 따라서 보상은 가능하지만, 감면 배수는 명시되지 않았습니다.

**코드 고정 안내**

> 「몇 배를 감면해 줘요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_ANSWER — Ubot 책임으로 연속 3시간 이상 이용하지 못하면 요금을 감면한다는 조건을 정확히 안내했습니다.
- 하위 #2: CORRECT_DECLINE — 구체적인 감면 배수가 FAQ에 없다고 밝히고 값을 지어내지 않았습니다.
- Judge 요약: 답변은 두 질문을 FAQ에 맞게 처리했고, 검색어도 원래 질문의 의미를 유지했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 통신 장애로 3시간 넘게 못 쓰면 보상되나요?; FAQ 1491
- 실제 하위 #2: 몇 배를 감면해 줘요?; FAQ 1491
- 검색 #1: 통신 장애로 3시간 넘게 못 쓰면 보상되나요?
- 검색 #2: 통신 장애 시 몇 배를 감면해 주나요?

**실제로 입력된 FAQ 원문**

- FAQ 1491: 통신 장애로 서비스를 못 썼는데 보상을 받을 수 있나요?
> Ubot의 책임으로 연속 3시간 이상 서비스를 쓰지 못했다면 약관에 따라 해당 시간 요금의 일정 배수를 감면해 드립니다. 대규모 통신 장애에 대한 요금 감면은 자동으로 처리됩니다. 개별 통신 장애에 대한 요금 감면은 고객센터에 신청해 주세요.

</details>

### v4 slot

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1491
- 원본: [results.jsonl:38](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:38](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:40](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 통신 장애로 연속 3시간 이상 서비스를 쓰지 못했다면 약관에 따라 해당 시간 요금의 일정 배수를 감면해 드립니다. 대규모 통신 장애의 경우 자동으로 처리됩니다.
> 
> 「몇 배를 감면해 줘요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 통신 장애로 연속 3시간 이상 서비스를 쓰지 못했다면 약관에 따라 해당 시간 요금의 일정 배수를 감면해 드립니다. 대규모 통신 장애의 경우 자동으로 처리됩니다.

**코드 고정 안내**

> 「몇 배를 감면해 줘요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**Judge가 표시한 주장**

- UNSUPPORTED_GENERALIZATION: 통신 장애로 연속 3시간 이상 서비스를 쓰지 못하면 요금을 감면한다는 무조건적 안내
  - 사유: 자료는 Ubot의 책임으로 발생한 장애일 때만 감면한다고 명시합니다.
- 적용 후보: [HC04](hallucination_progression.md#hc04)

- 하위 #1: WRONG_ANSWER — 감면의 핵심 조건인 ‘Ubot의 책임으로’ 발생한 장애라는 점을 빠뜨렸습니다.
- 하위 #2: CORRECT_DECLINE — 구체적인 감면 배수를 지어내지 않았고, 시스템 고정 안내가 확인 불가를 알렸습니다.
- Judge 요약: 첫 번째 답변은 책임 조건을 누락해 감면 대상을 넓혔고, 두 번째 질문의 배수는 답하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 통신 장애로 3시간 넘게 못 쓰면 보상되나요?; FAQ 1491
- 실제 하위 #2: 몇 배를 감면해 줘요?; FAQ 1491
- 검색 #1: 통신 장애로 3시간 넘게 못 쓰면 보상되나요?
- 검색 #2: 통신 장애 시 몇 배를 감면해 주나요?
- slot #1: ANSWER; 최종 본문에 남음
> 통신 장애로 연속 3시간 이상 서비스를 쓰지 못했다면 약관에 따라 해당 시간 요금의 일정 배수를 감면해 드립니다. 대규모 통신 장애의 경우 자동으로 처리됩니다.
- slot #2: ABSTAIN; 최종 본문에서 제거
> 개별 통신 장애에 대한 요금 감면은 고객센터에 신청해 주셔야 하며, 몇 배를 감면해 주는지에 대한 구체적인 배수는 FAQ에 명시되어 있지 않습니다. 따라서 몇 배를 감면해 주는지에 대한 정확한 정보는 제공되지 않습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1491: 통신 장애로 서비스를 못 썼는데 보상을 받을 수 있나요?
> Ubot의 책임으로 연속 3시간 이상 서비스를 쓰지 못했다면 약관에 따라 해당 시간 요금의 일정 배수를 감면해 드립니다. 대규모 통신 장애에 대한 요금 감면은 자동으로 처리됩니다. 개별 통신 장애에 대한 요금 감면은 고객센터에 신청해 주세요.

</details>

<a id="mp-010"></a>
## MP-010 · 하루 임대료를 분실 변상금에 사용

> 임대폰은 며칠까지 무료예요? 잃어버리면 변상금은 얼마예요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 환각 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC02](hallucination_progression.md#hc02), [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 임대폰은 며칠까지 무료예요? → ANSWER; gold FAQ 1456, 1394 (gold는 실제 제공 자료와 다를 수 있음)
- #2 잃어버리면 변상금은 얼마예요? → ABSTAIN; gold FAQ 1456 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: search_queries_changed
- 입력 차이 sub_slot: search_queries_changed, context_sections_changed
- 입력 차이 v4sub_slot: search_queries_changed, context_sections_changed

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1622, 1394, 1456
- 원본: [results.jsonl:120](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:120](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:115](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 임대폰 무료 이용 기간은 최초 7일입니다. 잃어버리면 변상금은 정해진 금액이 청구되지만, 그 금액은 FAQ에 명시되어 있지 않습니다. 다만, 임대폰을 잃어버리면 이후 하루 2,200원이 청구됩니다.
> 
> ※ FAQ [1394]과 [1456]에 따르면, 임대폰의 무료 기간은 모두 최초 7일이며, 분실 시 이후 하루 2,200원이 청구됩니다. 그러나 변상금의 구체적인 금액은 명시되어 있지 않습니다.

**모델 본문**

> 임대폰 무료 이용 기간은 최초 7일입니다. 잃어버리면 변상금은 정해진 금액이 청구되지만, 그 금액은 FAQ에 명시되어 있지 않습니다. 다만, 임대폰을 잃어버리면 이후 하루 2,200원이 청구됩니다.
> 
> ※ FAQ [1394]과 [1456]에 따르면, 임대폰의 무료 기간은 모두 최초 7일이며, 분실 시 이후 하루 2,200원이 청구됩니다. 그러나 변상금의 구체적인 금액은 명시되어 있지 않습니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 임대폰을 잃어버리면 이후 하루 2,200원이 청구됩니다.
  - 사유: 하루 2,200원은 무료 기간인 최초 7일 이후의 임대료이지, 임대폰 분실에 따른 요금으로 제시된 금액이 아닙니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 임대폰의 최초 7일 무료 이용 기간을 정확히 답했습니다.
- 하위 #2: CORRECT_DECLINE — 변상금의 구체적인 금액은 자료에 없다고 밝혔습니다.
- Judge 요약: 무료 기간과 변상금 미기재 여부는 맞게 답했지만, 7일 이후 임대료를 임대폰 분실 시 청구액처럼 잘못 연결했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 임대폰은 며칠까지 무료예요?; FAQ 1622, 1394
- 실제 하위 #2: 잃어버리면 변상금은 얼마예요?; FAQ 1456
- 검색 #1: 임대폰의 무료 사용 기간은 며칠까지예요?
- 검색 #2: 임대폰을 잃어버리면 변상금은 얼마예요?

**실제로 입력된 FAQ 원문**

- FAQ 1622: 새 휴대폰을 마련하기 전까지 임대폰을 이용할 수 있나요?
> 새 휴대폰을 마련하기 전 임대폰을 쓸 수 있는지 가입 통신사의 고객센터나 방문 예정 매장에서 신청 대상, 재고, 이용 기간 및 비용을 확인해 주세요. 임대폰을 이용할 수 있다면 회선과 유심을 임대 기기에 연결하는 절차를 안내받아 주세요.
- FAQ 1394: 수리 기간 동안 쓸 임대폰을 빌릴 수 있나요?
> 휴대폰 수리 접수증이나 분실 신고 내역을 Ubot 매장에 보여 주면 임대폰을 빌릴 수 있습니다. Ubot 임대폰은 최초 7일 무료이며 이후 임대 기간에는 하루 2,200원이 청구됩니다.
- FAQ 1456: 분실한 동안 쓸 임대폰을 빌릴 수 있나요?
> 분실 신고 후 Ubot 매장에서 신분증을 보여 주면 임대폰을 빌릴 수 있습니다. 분실 시 빌린 임대폰은 최초 7일 무료이고 이후 하루 2,200원이 청구됩니다. 임대폰을 잃어버리거나 파손하면 정해진 변상금이 청구됩니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1622, 1394, 1456
- 원본: [results.jsonl:120](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:120](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:112](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 임대폰은 최초 7일까지 무료입니다. 잃어버리면 변상금은 정해진 금액이 청구되며, 그 금액은 FAQ에서 명시되어 있지 않습니다. 다만, 임대폰을 잃어버리면 하루 2,200원이 청구됩니다. 변상금의 구체적인 금액은 제공된 FAQ에서 명시되어 있지 않아 정확한 금액을 알 수 없습니다.
> 
> 「잃어버리면 변상금은 얼마예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 임대폰은 최초 7일까지 무료입니다. 잃어버리면 변상금은 정해진 금액이 청구되며, 그 금액은 FAQ에서 명시되어 있지 않습니다. 다만, 임대폰을 잃어버리면 하루 2,200원이 청구됩니다. 변상금의 구체적인 금액은 제공된 FAQ에서 명시되어 있지 않아 정확한 금액을 알 수 없습니다.

**코드 고정 안내**

> 「잃어버리면 변상금은 얼마예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 임대폰을 잃어버리면 하루 2,200원이 청구됩니다.
  - 사유: 하루 2,200원은 최초 7일 이후의 임대료이며, 임대폰 분실 시 변상금으로 제시된 금액이 아닙니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 임대폰은 최초 7일까지 무료라고 정확히 답했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 변상금 액수는 모른다고 했지만, 분실하면 하루 2,200원이 청구된다고 근거 없이 단정했습니다.
- Judge 요약: 무료 기간은 맞혔으나, 분실 변상금 질문에 임대료를 분실 시 청구액으로 잘못 적용했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 임대폰은 며칠까지 무료예요?; FAQ 1622, 1394
- 실제 하위 #2: 잃어버리면 변상금은 얼마예요?; FAQ 1456
- 검색 #1: 임대폰의 무료 사용 기간은 며칠까지인가요?
- 검색 #2: 임대폰을 잃어버리면 변상금은 얼마인가요?

**실제로 입력된 FAQ 원문**

- FAQ 1622: 새 휴대폰을 마련하기 전까지 임대폰을 이용할 수 있나요?
> 새 휴대폰을 마련하기 전 임대폰을 쓸 수 있는지 가입 통신사의 고객센터나 방문 예정 매장에서 신청 대상, 재고, 이용 기간 및 비용을 확인해 주세요. 임대폰을 이용할 수 있다면 회선과 유심을 임대 기기에 연결하는 절차를 안내받아 주세요.
- FAQ 1394: 수리 기간 동안 쓸 임대폰을 빌릴 수 있나요?
> 휴대폰 수리 접수증이나 분실 신고 내역을 Ubot 매장에 보여 주면 임대폰을 빌릴 수 있습니다. Ubot 임대폰은 최초 7일 무료이며 이후 임대 기간에는 하루 2,200원이 청구됩니다.
- FAQ 1456: 분실한 동안 쓸 임대폰을 빌릴 수 있나요?
> 분실 신고 후 Ubot 매장에서 신분증을 보여 주면 임대폰을 빌릴 수 있습니다. 분실 시 빌린 임대폰은 최초 7일 무료이고 이후 하루 2,200원이 청구됩니다. 임대폰을 잃어버리거나 파손하면 정해진 변상금이 청구됩니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1622, 1394, 1456
- 원본: [results.jsonl:42](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:42](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:41](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 임대폰은 최초 7일 무료입니다. 이후 하루 2,200원이 청구됩니다.
> 
> 「잃어버리면 변상금은 얼마예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 임대폰은 최초 7일 무료입니다. 이후 하루 2,200원이 청구됩니다.

**코드 고정 안내**

> 「잃어버리면 변상금은 얼마예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_ANSWER — 임대폰의 최초 7일 무료 이용 기간을 정확히 답했습니다.
- 하위 #2: CORRECT_DECLINE — 변상금 액수를 지어내지 않았고 시스템 고정 안내가 답변 불가를 알렸습니다.
- Judge 요약: 모델 답변은 제공된 FAQ에 근거하며, 자료에 없는 변상금 액수는 답하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 임대폰은 며칠까지 무료예요?; FAQ 1622, 1394
- 실제 하위 #2: 잃어버리면 변상금은 얼마예요?; FAQ 1456
- 검색 #1: 임대폰의 무료 사용 기간은 며칠까지예요?
- 검색 #2: 임대폰을 잃어버리면 변상금은 얼마예요?
- slot #1: ANSWER; 최종 본문에 남음
> 임대폰은 최초 7일 무료입니다. 이후 하루 2,200원이 청구됩니다.
- slot #2: ABSTAIN; 최종 본문에서 제거
> 임대폰을 잃어버리면 정해진 변상금이 청구됩니다. 하지만 변상금의 구체적인 금액은 FAQ에 명시되어 있지 않습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1622: 새 휴대폰을 마련하기 전까지 임대폰을 이용할 수 있나요?
> 새 휴대폰을 마련하기 전 임대폰을 쓸 수 있는지 가입 통신사의 고객센터나 방문 예정 매장에서 신청 대상, 재고, 이용 기간 및 비용을 확인해 주세요. 임대폰을 이용할 수 있다면 회선과 유심을 임대 기기에 연결하는 절차를 안내받아 주세요.
- FAQ 1394: 수리 기간 동안 쓸 임대폰을 빌릴 수 있나요?
> 휴대폰 수리 접수증이나 분실 신고 내역을 Ubot 매장에 보여 주면 임대폰을 빌릴 수 있습니다. Ubot 임대폰은 최초 7일 무료이며 이후 임대 기간에는 하루 2,200원이 청구됩니다.
- FAQ 1456: 분실한 동안 쓸 임대폰을 빌릴 수 있나요?
> 분실 신고 후 Ubot 매장에서 신분증을 보여 주면 임대폰을 빌릴 수 있습니다. 분실 시 빌린 임대폰은 최초 7일 무료이고 이후 하루 2,200원이 청구됩니다. 임대폰을 잃어버리거나 파손하면 정해진 변상금이 청구됩니다.

</details>

<a id="mp-012"></a>
## MP-012 · 벨만 울리고 받지 않은 조건을 잘못 바꿈

> 해외에서 전화를 받으면 요금이 나오나요? 일본에서는 분당 얼마예요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **없음 → 없음 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC04](hallucination_progression.md#hc04)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 해외에서 전화를 받으면 요금이 나오나요? → ANSWER; gold FAQ 1302, 34 (gold는 실제 제공 자료와 다를 수 있음)
- #2 일본에서는 분당 얼마예요? → ABSTAIN; gold FAQ 1302 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 34, 1302, 1306
- 원본: [results.jsonl:122](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:122](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:114](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 해외에서 전화를 받을 때는 국가와 로밍 조건에 따라 수신 통화 요금이 발생할 수 있습니다. 일본에서의 분당 요금은 FAQ에 명시되어 있지 않으며, 국가별로 다르고, 로밍 조건에 따라 달라질 수 있습니다. 따라서 일본에서의 구체적인 분당 요금은 공식적으로 제공된 로밍 요금표를 확인해야 합니다.

**모델 본문**

> 해외에서 전화를 받을 때는 국가와 로밍 조건에 따라 수신 통화 요금이 발생할 수 있습니다. 일본에서의 분당 요금은 FAQ에 명시되어 있지 않으며, 국가별로 다르고, 로밍 조건에 따라 달라질 수 있습니다. 따라서 일본에서의 구체적인 분당 요금은 공식적으로 제공된 로밍 요금표를 확인해야 합니다.

- 하위 #1: CORRECT_ANSWER — 해외 수신 통화 요금이 국가와 로밍 조건에 따라 발생할 수 있다고 정확히 답했습니다.
- 하위 #2: CORRECT_DECLINE — 자료에 없는 일본의 분당 요금을 제시하지 않았습니다.
- Judge 요약: 두 하위 질문 모두 자료에 맞게 처리했고, 검색어도 원래 질문의 의미를 유지했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 해외에서 전화를 받으면 요금이 나오나요?; FAQ 34, 1302, 1306
- 실제 하위 #2: 일본에서는 분당 얼마예요?; FAQ 34, 1302
- 검색 #1: 해외에서 전화를 받으면 요금이 나오나요?
- 검색 #2: 일본에서 전화를 받을 때 분당 얼마의 요금이 나요?

**실제로 입력된 FAQ 원문**

- FAQ 34: 해외에서 전화를 받으면 요금이 발생하나요?
> 해외에서 전화를 받을 때는 국가와 로밍 조건에 따라 수신 통화 요금이 발생할 수 있습니다.
- FAQ 1302: 해외에서 전화나 문자를 받으면 요금이 나오나요?
> 해외에서 문자를 받는 것은 일반적으로 무료지만 국가별 로밍 조건을 확인해 주세요. 해외에서 음성통화를 받으면 국가별 분당 로밍 요금이 부과되지만 벨만 울리고 받지 않으면 요금이 없습니다.
- FAQ 1306: 해외에서 카카오톡이나 인스타그램을 쓰면 요금이 나오나요?
> 해외에서 카카오톡이나 인스타그램 같은 메신저·SNS를 Wi-Fi가 아닌 모바일 데이터로 쓰면 데이터 로밍 요금이 발생합니다. 해외에서 로밍 상품에 가입했다면 메신저·SNS를 상품 데이터 제공량 안에서 추가 요금 없이 이용할 수 있습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 34, 1302, 1306
- 원본: [results.jsonl:122](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:122](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:113](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 해외에서 전화를 받을 때는 국가와 로밍 조건에 따라 수신 통화 요금이 발생할 수 있습니다. 일본에서는 분당 로밍 요금이 부과되지만, 벨만 울리고 받지 않으면 요금이 없습니다. 다만, 일본에서의 구체적인 분당 요금은 FAQ에 명시되어 있지 않습니다.
> 
> 「일본에서는 분당 얼마예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 해외에서 전화를 받을 때는 국가와 로밍 조건에 따라 수신 통화 요금이 발생할 수 있습니다. 일본에서는 분당 로밍 요금이 부과되지만, 벨만 울리고 받지 않으면 요금이 없습니다. 다만, 일본에서의 구체적인 분당 요금은 FAQ에 명시되어 있지 않습니다.

**코드 고정 안내**

> 「일본에서는 분당 얼마예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_ANSWER — 해외에서 전화를 받으면 국가와 로밍 조건에 따라 요금이 발생할 수 있다고 답했습니다.
- 하위 #2: CORRECT_DECLINE — 자료에 없는 일본의 구체적인 분당 요금을 제시하지 않았습니다.
- Judge 요약: 두 하위 질문을 자료에 맞게 처리했고, 근거 없는 요금이나 조건을 추가하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 해외에서 전화를 받으면 요금이 나오나요?; FAQ 34, 1302, 1306
- 실제 하위 #2: 일본에서는 분당 얼마예요?; FAQ 34, 1302
- 검색 #1: 해외에서 전화를 받으면 요금이 나오나요?
- 검색 #2: 일본에서 전화를 받을 때 분당 얼마의 요금이 나요?

**실제로 입력된 FAQ 원문**

- FAQ 34: 해외에서 전화를 받으면 요금이 발생하나요?
> 해외에서 전화를 받을 때는 국가와 로밍 조건에 따라 수신 통화 요금이 발생할 수 있습니다.
- FAQ 1302: 해외에서 전화나 문자를 받으면 요금이 나오나요?
> 해외에서 문자를 받는 것은 일반적으로 무료지만 국가별 로밍 조건을 확인해 주세요. 해외에서 음성통화를 받으면 국가별 분당 로밍 요금이 부과되지만 벨만 울리고 받지 않으면 요금이 없습니다.
- FAQ 1306: 해외에서 카카오톡이나 인스타그램을 쓰면 요금이 나오나요?
> 해외에서 카카오톡이나 인스타그램 같은 메신저·SNS를 Wi-Fi가 아닌 모바일 데이터로 쓰면 데이터 로밍 요금이 발생합니다. 해외에서 로밍 상품에 가입했다면 메신저·SNS를 상품 데이터 제공량 안에서 추가 요금 없이 이용할 수 있습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 34, 1302, 1306
- 원본: [results.jsonl:44](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:44](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:44](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 해외에서 전화를 받을 때는 국가와 로밍 조건에 따라 수신 통화 요금이 발생할 수 있습니다. 다만, '벨만 울리고 받지 않으면 요금이 없습니다'라는 내용을 보면, 특정 조건(예: 벨만 울리지 않음)에서 요금이 발생하지 않을 수 있습니다.
> 
> 「일본에서는 분당 얼마예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 해외에서 전화를 받을 때는 국가와 로밍 조건에 따라 수신 통화 요금이 발생할 수 있습니다. 다만, '벨만 울리고 받지 않으면 요금이 없습니다'라는 내용을 보면, 특정 조건(예: 벨만 울리지 않음)에서 요금이 발생하지 않을 수 있습니다.

**코드 고정 안내**

> 「일본에서는 분당 얼마예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**Judge가 표시한 주장**

- FABRICATION: 벨만 울리지 않음 같은 조건에서는 요금이 발생하지 않을 수 있습니다.
  - 사유: FAQ는 벨만 울리고 전화를 받지 않으면 요금이 없다고 할 뿐, 벨만 울리지 않는 경우는 설명하지 않습니다.
- 적용 후보: [HC04](hallucination_progression.md#hc04)

- 하위 #1: CORRECT_ANSWER — 국가와 로밍 조건에 따라 해외 수신 통화 요금이 발생할 수 있다고 답했습니다.
- 하위 #2: CORRECT_DECLINE — 일본의 분당 요금을 지어내지 않았고, 시스템 고정 안내에서 확인이 어렵다고 밝혔습니다.
- Judge 요약: 두 하위 질문의 핵심 처리는 맞지만, 벨만 울리지 않는 경우에 관한 근거 없는 조건을 덧붙였습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 해외에서 전화를 받으면 요금이 나오나요?; FAQ 34, 1302, 1306
- 실제 하위 #2: 일본에서는 분당 얼마예요?; FAQ 34, 1302
- 검색 #1: 해외에서 전화를 받으면 요금이 나오나요?
- 검색 #2: 일본에서 전화를 받을 때 분당 얼마의 요금이 나요?
- slot #1: ANSWER; 최종 본문에 남음
> 해외에서 전화를 받을 때는 국가와 로밍 조건에 따라 수신 통화 요금이 발생할 수 있습니다. 다만, '벨만 울리고 받지 않으면 요금이 없습니다'라는 내용을 보면, 특정 조건(예: 벨만 울리지 않음)에서 요금이 발생하지 않을 수 있습니다.
- slot #2: ABSTAIN; 최종 본문에서 제거
> 일본에서의 분당 요금은 FAQ에 명시되어 있지 않습니다. 제공된 자료에서는 일본에 대한 분당 요금이 언급되지 않았으며, 국가별 로밍 요금은 각 국가에 따라 다릅니다. 따라서 일본의 분당 요금은 확인할 수 없습니다.

**실제로 입력된 FAQ 원문**

- FAQ 34: 해외에서 전화를 받으면 요금이 발생하나요?
> 해외에서 전화를 받을 때는 국가와 로밍 조건에 따라 수신 통화 요금이 발생할 수 있습니다.
- FAQ 1302: 해외에서 전화나 문자를 받으면 요금이 나오나요?
> 해외에서 문자를 받는 것은 일반적으로 무료지만 국가별 로밍 조건을 확인해 주세요. 해외에서 음성통화를 받으면 국가별 분당 로밍 요금이 부과되지만 벨만 울리고 받지 않으면 요금이 없습니다.
- FAQ 1306: 해외에서 카카오톡이나 인스타그램을 쓰면 요금이 나오나요?
> 해외에서 카카오톡이나 인스타그램 같은 메신저·SNS를 Wi-Fi가 아닌 모바일 데이터로 쓰면 데이터 로밍 요금이 발생합니다. 해외에서 로밍 상품에 가입했다면 메신저·SNS를 상품 데이터 제공량 안에서 추가 요금 없이 이용할 수 있습니다.

</details>

<a id="mp-014"></a>
## MP-014 · 영상통화 분당 요금 1,000원 생성

> 영상통화도 기본 제공에 포함되나요? 안 되면 1분에 얼마예요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **없음 → 없음 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 영상통화도 기본 제공에 포함되나요? → ANSWER; gold FAQ 1249 (gold는 실제 제공 자료와 다를 수 있음)
- #2 안 되면 1분에 얼마예요? → ABSTAIN; gold FAQ 1249 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1249
- 원본: [results.jsonl:124](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:124](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:117](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 영상통화는 기본 제공에 포함되지 않습니다. 국제전화, 영상통화, 유료 특수번호(060·1588 일부 등)는 통화 기본 제공에서 제외되어 별도 요금이 부과됩니다. 그러나 안 되면 1분에 얼마인지에 대한 정보는 제공된 FAQ에서 명시되어 있지 않습니다.

**모델 본문**

> 영상통화는 기본 제공에 포함되지 않습니다. 국제전화, 영상통화, 유료 특수번호(060·1588 일부 등)는 통화 기본 제공에서 제외되어 별도 요금이 부과됩니다. 그러나 안 되면 1분에 얼마인지에 대한 정보는 제공된 FAQ에서 명시되어 있지 않습니다.

- 하위 #1: CORRECT_ANSWER — 영상통화가 기본 제공에서 제외된다고 정확히 답했습니다.
- 하위 #2: CORRECT_DECLINE — 분당 요금이 FAQ에 없다고 밝히고 금액을 지어내지 않았습니다.
- Judge 요약: 두 하위 질문 모두 자료에 맞게 처리했고, 검색어도 원래 질문의 의미를 유지했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 영상통화도 기본 제공에 포함되나요?; FAQ 없음
- 실제 하위 #2: 안 되면 1분에 얼마예요?; FAQ 1249
- 검색 #1: 영상통화가 기본 제공에 포함되나요?
- 검색 #2: 영상통화가 기본 제공에 포함되지 않으면 1분에 얼마인가요?

**실제로 입력된 FAQ 원문**

- FAQ 1249: 통화와 문자 기본 제공이 무엇인가요?
> 요금제에 '기본 제공'으로 표시된 국내 음성통화와 문자는 추가 요금 없이 쓸 수 있습니다. 국제전화, 영상통화, 유료 특수번호(060·1588 일부 등)는 통화 기본 제공에서 제외되어 별도 요금이 부과됩니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1249
- 원본: [results.jsonl:124](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:124](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:115](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 영상통화는 기본 제공에 포함되지 않습니다. 국제전화, 영상통화, 유료 특수번호(060·1588 일부 등)는 통화 기본 제공에서 제외되어 별도 요금이 부과됩니다. 그러나 '안 되면 1분에 얼마예요'에 대한 구체적인 요금 정보는 제공된 자료에 없습니다.
> 
> 「안 되면 1분에 얼마예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 영상통화는 기본 제공에 포함되지 않습니다. 국제전화, 영상통화, 유료 특수번호(060·1588 일부 등)는 통화 기본 제공에서 제외되어 별도 요금이 부과됩니다. 그러나 '안 되면 1분에 얼마예요'에 대한 구체적인 요금 정보는 제공된 자료에 없습니다.

**코드 고정 안내**

> 「안 되면 1분에 얼마예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_ANSWER — 영상통화가 기본 제공에서 제외된다고 정확히 답했습니다.
- 하위 #2: CORRECT_DECLINE — 자료에 없는 분당 요금을 지어내지 않고 답변을 보류했습니다.
- Judge 요약: 답변은 FAQ의 제외 대상과 별도 요금 부과 사실에 부합하며, 제공되지 않은 분당 요금은 답하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 영상통화도 기본 제공에 포함되나요?; FAQ 없음
- 실제 하위 #2: 안 되면 1분에 얼마예요?; FAQ 1249
- 검색 #1: 영상통화가 기본 제공에 포함되나요?
- 검색 #2: 영상통화가 기본 제공에 포함되지 않으면 1분에 얼마인가요?

**실제로 입력된 FAQ 원문**

- FAQ 1249: 통화와 문자 기본 제공이 무엇인가요?
> 요금제에 '기본 제공'으로 표시된 국내 음성통화와 문자는 추가 요금 없이 쓸 수 있습니다. 국제전화, 영상통화, 유료 특수번호(060·1588 일부 등)는 통화 기본 제공에서 제외되어 별도 요금이 부과됩니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1249
- 원본: [results.jsonl:46](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:46](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:46](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 영상통화는 기본 제공에 포함되지 않습니다. 국제전화, 영상통화, 유료 특수번호(060·1588 일부 등)는 통화 기본 제공에서 제외되어 별도 요금이 부과됩니다.
> 
> 1분에 1,000원입니다. 영상통화는 기본 제공에 포함되지 않으며, 1분당 1,000원이 부과됩니다.

**모델 본문**

> 영상통화는 기본 제공에 포함되지 않습니다. 국제전화, 영상통화, 유료 특수번호(060·1588 일부 등)는 통화 기본 제공에서 제외되어 별도 요금이 부과됩니다.
> 
> 1분에 1,000원입니다. 영상통화는 기본 제공에 포함되지 않으며, 1분당 1,000원이 부과됩니다.

**Judge가 표시한 주장**

- FABRICATION: 영상통화는 1분당 1,000원이 부과됩니다.
  - 사유: 제공된 FAQ에는 영상통화의 분당 요금이 없습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 영상통화가 기본 제공에서 제외된다고 정확히 답했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 자료에 없는 1분당 1,000원을 확정해 답했습니다.
- Judge 요약: 기본 제공 제외 여부는 근거에 맞지만, 분당 요금은 근거 없이 지어냈습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 영상통화도 기본 제공에 포함되나요?; FAQ 없음
- 실제 하위 #2: 안 되면 1분에 얼마예요?; FAQ 1249
- 검색 #1: 영상통화가 기본 제공에 포함되나요?
- 검색 #2: 영상통화가 기본 제공에 포함되지 않으면 1분에 얼마인가요?
- slot #1: ANSWER; 최종 본문에 남음
> 영상통화는 기본 제공에 포함되지 않습니다. 국제전화, 영상통화, 유료 특수번호(060·1588 일부 등)는 통화 기본 제공에서 제외되어 별도 요금이 부과됩니다.
- slot #2: ANSWER; 최종 본문에 남음
> 1분에 1,000원입니다. 영상통화는 기본 제공에 포함되지 않으며, 1분당 1,000원이 부과됩니다.

**실제로 입력된 FAQ 원문**

- FAQ 1249: 통화와 문자 기본 제공이 무엇인가요?
> 요금제에 '기본 제공'으로 표시된 국내 음성통화와 문자는 추가 요금 없이 쓸 수 있습니다. 국제전화, 영상통화, 유료 특수번호(060·1588 일부 등)는 통화 기본 제공에서 제외되어 별도 요금이 부과됩니다.

</details>

<a id="mp-017"></a>
## MP-017 · 주말 기사 방문 가능 여부

> 인터넷 이전 설치비는 얼마고, 주말에도 기사님이 와요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **없음 → 환각 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 인터넷 이전 설치비는 얼마고 → ANSWER; gold FAQ 304 (gold는 실제 제공 자료와 다를 수 있음)
- #2 주말에도 기사님이 와요? → ABSTAIN; gold FAQ 304, 251 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 304
- 원본: [results.jsonl:127](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:127](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:120](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 인터넷 이전 설치비는 22,000원입니다. 주말에 기사님이 와요라는 정보는 FAQ에 없습니다. 따라서 주말에 기사님이 와요는 확정할 수 없습니다.

**모델 본문**

> 인터넷 이전 설치비는 22,000원입니다. 주말에 기사님이 와요라는 정보는 FAQ에 없습니다. 따라서 주말에 기사님이 와요는 확정할 수 없습니다.

- 하위 #1: CORRECT_ANSWER — 이전 설치비 22,000원을 정확히 답했습니다.
- 하위 #2: CORRECT_DECLINE — 주말 방문 여부가 자료에 없어 확답하지 않았습니다.
- Judge 요약: 설치비 답변은 FAQ와 일치하고, 자료에 없는 주말 방문 여부는 답하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 인터넷 이전 설치비는 얼마고,; FAQ 304
- 실제 하위 #2: 주말에도 기사님이 와요?; FAQ 없음
- 검색 #1: 인터넷 이전 설치비는 얼마인가요?
- 검색 #2: 주말에도 기사님이 와요?

**실제로 입력된 FAQ 원문**

- FAQ 304: 이사 갈 때 인터넷을 옮기면 비용이 드나요?
> 이사할 때 인터넷을 옮기는 이전 설치비는 22,000원입니다. 인터넷 이전 설치는 신청 후 평균 2~3일 이내에 방문해 진행합니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 304
- 원본: [results.jsonl:127](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:127](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:118](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 인터넷 이전 설치비는 22,000원입니다. 주말에도 기사님이 방문합니다.

**모델 본문**

> 인터넷 이전 설치비는 22,000원입니다. 주말에도 기사님이 방문합니다.

**Judge가 표시한 주장**

- FABRICATION: 주말에도 기사님이 방문합니다.
  - 사유: 받은 FAQ에는 주말 방문 여부가 나와 있지 않습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 이전 설치비 22,000원을 정확히 답했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 자료에 없는 주말 방문 가능 여부를 확정했습니다.
- Judge 요약: 설치비 답변은 근거와 일치하지만, 주말 방문 답변은 자료로 뒷받침되지 않습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 인터넷 이전 설치비는 얼마고,; FAQ 304
- 실제 하위 #2: 주말에도 기사님이 와요?; FAQ 없음
- 검색 #1: 인터넷 이전 설치비는 얼마인가요?
- 검색 #2: 주말에도 기사님이 와요?

**실제로 입력된 FAQ 원문**

- FAQ 304: 이사 갈 때 인터넷을 옮기면 비용이 드나요?
> 이사할 때 인터넷을 옮기는 이전 설치비는 22,000원입니다. 인터넷 이전 설치는 신청 후 평균 2~3일 이내에 방문해 진행합니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 304
- 원본: [results.jsonl:199](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:199](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:188](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 인터넷 이전 설치비는 22,000원입니다. 이전 설치는 신청 후 평균 2~3일 이내에 방문해 진행합니다.
> 
> 「주말에도 기사님이 와요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 인터넷 이전 설치비는 22,000원입니다. 이전 설치는 신청 후 평균 2~3일 이내에 방문해 진행합니다.

**코드 고정 안내**

> 「주말에도 기사님이 와요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_ANSWER — 이전 설치비 22,000원을 정확히 답했습니다.
- 하위 #2: CORRECT_DECLINE — 주말 방문 여부를 지어내지 않았고 시스템 고정 안내에서 확인이 어렵다고 알렸습니다.
- Judge 요약: 모델 본문의 비용과 방문 소요 기간은 제공된 FAQ와 일치하며, 검색어도 원래 질문을 충실히 담았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 인터넷 이전 설치비는 얼마고,; FAQ 304
- 실제 하위 #2: 주말에도 기사님이 와요?; FAQ 없음
- 검색 #1: 인터넷 이전 설치비는 얼마인가요?
- 검색 #2: 주말에도 기사님이 와요?
- slot #1: ANSWER; 최종 본문에 남음
> 인터넷 이전 설치비는 22,000원입니다. 이전 설치는 신청 후 평균 2~3일 이내에 방문해 진행합니다.
- slot #2: ABSTAIN; 최종 본문에서 제거
> 주말에도 기사님이 와요라는 정보는 제공된 FAQ에서 없습니다. 따라서 주말 방문 여부에 대한 답변은 불가능합니다.

**실제로 입력된 FAQ 원문**

- FAQ 304: 이사 갈 때 인터넷을 옮기면 비용이 드나요?
> 이사할 때 인터넷을 옮기는 이전 설치비는 22,000원입니다. 인터넷 이전 설치는 신청 후 평균 2~3일 이내에 방문해 진행합니다.

</details>

<a id="mp-018"></a>
## MP-018 · 지각 대기 허용 시간과 예약 취소 규칙

> 매장 예약 없이 가도 되나요? 예약 시간에 늦으면 몇 분까지 기다려 줘요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 없음 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC02](hallucination_progression.md#hc02), [HC04](hallucination_progression.md#hc04)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 매장 예약 없이 가도 되나요? → ANSWER; gold FAQ 1567 (gold는 실제 제공 자료와 다를 수 있음)
- #2 예약 시간에 늦으면 몇 분까지 기다려 줘요? → ABSTAIN; gold FAQ 1567, 1569 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=1; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1567, 1564, 242, 1569, 1038, 1561
- 원본: [results.jsonl:128](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:128](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:123](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 매장 예약 없이도 영업시간 안에 방문할 수 있습니다. 예약 시간에 늦으면 기다려주는 기준은 제공된 FAQ에서 명시되어 있지 않으며, 기다려주는 시간은 없습니다. 예약 시간에 늦으면 예약이 취소되며, 그 시간대는 다른 고객이 예약할 수 있습니다.

**모델 본문**

> 매장 예약 없이도 영업시간 안에 방문할 수 있습니다. 예약 시간에 늦으면 기다려주는 기준은 제공된 FAQ에서 명시되어 있지 않으며, 기다려주는 시간은 없습니다. 예약 시간에 늦으면 예약이 취소되며, 그 시간대는 다른 고객이 예약할 수 있습니다.

**Judge가 표시한 주장**

- FABRICATION: 기다려주는 시간은 없습니다.
  - 사유: 제공된 FAQ에는 지각 시 대기 허용 시간이 명시되어 있지 않습니다.
- MISATTRIBUTION: 예약 시간에 늦으면 예약이 취소되며, 그 시간대는 다른 고객이 예약할 수 있습니다.
  - 사유: 다른 고객이 예약할 수 있다는 설명은 방문 시간 전에 예약을 취소한 경우에만 해당하며, 지난 예약은 취소되지 않고 지난 예약으로 남습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC02](hallucination_progression.md#hc02), [HC04](hallucination_progression.md#hc04)

- 하위 #1: CORRECT_ANSWER — 예약 없이 영업시간 안에 방문할 수 있다는 핵심 내용을 맞게 답했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 대기 시간이 없고 지각하면 예약이 취소된다고 근거 없이 단정했습니다.
- Judge 요약: 첫 질문은 정확히 답했지만, 둘째 질문에서는 자료에 없는 지각 시 처리 기준을 지어냈습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 매장 예약 없이 가도 되나요?; FAQ 1567, 1564, 242
- 실제 하위 #2: 예약 시간에 늦으면 몇 분까지 기다려 줘요?; FAQ 1569, 1038, 1561
- 검색 #1: 매장 예약 없이 가도 되나요?
- 검색 #2: 예약 시간에 늦으면 몇 분까지 기다려 줘요?

**실제로 입력된 FAQ 원문**

- FAQ 1567: 예약하지 않고 매장에 가도 되나요?
> 매장 예약 없이도 영업시간 안에 방문할 수 있습니다. 매장 방문을 예약하면 원하는 시간에 상담받을 수 있어 대기 시간을 줄일 수 있습니다.
- FAQ 1564: 비회원도 매장 예약을 할 수 있나요?
> 매장 방문 예약은 로그인한 회원만 할 수 있습니다. 회원 가입 후 로그인하면 매장 예약과 예약 알림을 이용할 수 있습니다.
- FAQ 242: 매장을 예약하고 갈 수 있나요?
> 매장 방문은 앱에서 매장과 시간을 선택해 예약할 수 있습니다. 매장 방문을 예약한 고객은 우선 상담을 받을 수 있습니다.
- FAQ 1569: 예약한 시간에 갈 수 없으면 어떻게 하나요?
> 예약한 시간에 매장에 갈 수 없으면 방문 시간 전에 Ubot 앱에서 예약을 취소해 주세요. 매장 예약을 취소하면 그 시간대를 다른 고객이 예약할 수 있습니다. 취소 후에는 다른 시간으로 매장 방문을 다시 예약할 수 있습니다.
- FAQ 1038: 매장 예약 시간은 어떻게 정해지나요?
> 매장 예약 시간은 영업시간 안에서 1시간 단위로 선택할 수 있으며 영업 종료 1시간 전 시간대가 마지막입니다. 매장 예약은 한 시간대에 한 명만 할 수 있어 이미 예약된 시간대는 선택할 수 없습니다.
- FAQ 1561: 방문 시간이 지난 예약도 취소할 수 있나요?
> 매장 예약은 방문 시간 전까지만 취소할 수 있습니다. 방문 시간이 지난 예약은 지난 예약으로 남고 예약 건수에는 포함되지 않습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1567, 1564, 242, 1569, 1038, 1561
- 원본: [results.jsonl:128](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:128](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:119](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 매장 예약 없이도 영업시간 안에 방문할 수 있습니다. 예약한 시간에 늦으면 기다려주는 시간은 명시되어 있지 않으며, 관련 FAQ에서는 예약 취소나 다른 고객의 예약에 대한 내용만 제공됩니다. 따라서 예약 시간에 늦으면 몇 분까지 기다려주는지에 대한 정보는 없습니다.
> 
> 「예약 시간에 늦으면 몇 분까지 기다려 줘요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 매장 예약 없이도 영업시간 안에 방문할 수 있습니다. 예약한 시간에 늦으면 기다려주는 시간은 명시되어 있지 않으며, 관련 FAQ에서는 예약 취소나 다른 고객의 예약에 대한 내용만 제공됩니다. 따라서 예약 시간에 늦으면 몇 분까지 기다려주는지에 대한 정보는 없습니다.

**코드 고정 안내**

> 「예약 시간에 늦으면 몇 분까지 기다려 줘요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_ANSWER — 예약 없이 영업시간 안에 방문할 수 있다고 정확히 답했습니다.
- 하위 #2: CORRECT_DECLINE — 기다려주는 시간이 자료에 없다고 안내하고 분 단위를 지어내지 않았습니다.
- Judge 요약: 두 하위 질문에 자료 범위대로 답했고, 근거 없는 사실 주장도 없습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 매장 예약 없이 가도 되나요?; FAQ 1567, 1564, 242
- 실제 하위 #2: 예약 시간에 늦으면 몇 분까지 기다려 줘요?; FAQ 1569, 1038, 1561
- 검색 #1: 매장 예약 없이 가도 되나요?
- 검색 #2: 예약 시간에 늦으면 몇 분까지 기다려 줘요?

**실제로 입력된 FAQ 원문**

- FAQ 1567: 예약하지 않고 매장에 가도 되나요?
> 매장 예약 없이도 영업시간 안에 방문할 수 있습니다. 매장 방문을 예약하면 원하는 시간에 상담받을 수 있어 대기 시간을 줄일 수 있습니다.
- FAQ 1564: 비회원도 매장 예약을 할 수 있나요?
> 매장 방문 예약은 로그인한 회원만 할 수 있습니다. 회원 가입 후 로그인하면 매장 예약과 예약 알림을 이용할 수 있습니다.
- FAQ 242: 매장을 예약하고 갈 수 있나요?
> 매장 방문은 앱에서 매장과 시간을 선택해 예약할 수 있습니다. 매장 방문을 예약한 고객은 우선 상담을 받을 수 있습니다.
- FAQ 1569: 예약한 시간에 갈 수 없으면 어떻게 하나요?
> 예약한 시간에 매장에 갈 수 없으면 방문 시간 전에 Ubot 앱에서 예약을 취소해 주세요. 매장 예약을 취소하면 그 시간대를 다른 고객이 예약할 수 있습니다. 취소 후에는 다른 시간으로 매장 방문을 다시 예약할 수 있습니다.
- FAQ 1038: 매장 예약 시간은 어떻게 정해지나요?
> 매장 예약 시간은 영업시간 안에서 1시간 단위로 선택할 수 있으며 영업 종료 1시간 전 시간대가 마지막입니다. 매장 예약은 한 시간대에 한 명만 할 수 있어 이미 예약된 시간대는 선택할 수 없습니다.
- FAQ 1561: 방문 시간이 지난 예약도 취소할 수 있나요?
> 매장 예약은 방문 시간 전까지만 취소할 수 있습니다. 방문 시간이 지난 예약은 지난 예약으로 남고 예약 건수에는 포함되지 않습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1567, 1564, 242, 1569, 1038, 1561
- 원본: [results.jsonl:48](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:48](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:48](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 예, 매장 예약 없이도 영업시간 안에 방문할 수 있습니다. 하지만 예약을 하면 원하는 시간에 상담받을 수 있어 대기 시간을 줄일 수 있습니다.
> 
> 「예약 시간에 늦으면 몇 분까지 기다려 줘요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 예, 매장 예약 없이도 영업시간 안에 방문할 수 있습니다. 하지만 예약을 하면 원하는 시간에 상담받을 수 있어 대기 시간을 줄일 수 있습니다.

**코드 고정 안내**

> 「예약 시간에 늦으면 몇 분까지 기다려 줘요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_ANSWER — 예약 없이 영업시간 안에 방문할 수 있다고 정확히 답했습니다.
- 하위 #2: CORRECT_DECLINE — 대기 가능 시간을 지어내지 않았고, 시스템 고정 안내로 확인 불가를 알렸습니다.
- Judge 요약: 모델 답변은 제공된 FAQ에 근거하며, 자료에 없는 지각 허용 시간은 답하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 매장 예약 없이 가도 되나요?; FAQ 1567, 1564, 242
- 실제 하위 #2: 예약 시간에 늦으면 몇 분까지 기다려 줘요?; FAQ 1569, 1038, 1561
- 검색 #1: 매장 예약 없이 가도 되나요?
- 검색 #2: 예약 시간에 늦으면 몇 분까지 기다려 줘요?
- slot #1: ANSWER; 최종 본문에 남음
> 예, 매장 예약 없이도 영업시간 안에 방문할 수 있습니다. 하지만 예약을 하면 원하는 시간에 상담받을 수 있어 대기 시간을 줄일 수 있습니다.
- slot #2: ABSTAIN; 최종 본문에서 제거
> 예약한 시간에 늦을 경우, 예약은 취소할 수 있지만 기다려주는 정책은 명시되어 있지 않습니다. 따라서 예약 시간에 늦으면 기다려주는 시간은 없습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1567: 예약하지 않고 매장에 가도 되나요?
> 매장 예약 없이도 영업시간 안에 방문할 수 있습니다. 매장 방문을 예약하면 원하는 시간에 상담받을 수 있어 대기 시간을 줄일 수 있습니다.
- FAQ 1564: 비회원도 매장 예약을 할 수 있나요?
> 매장 방문 예약은 로그인한 회원만 할 수 있습니다. 회원 가입 후 로그인하면 매장 예약과 예약 알림을 이용할 수 있습니다.
- FAQ 242: 매장을 예약하고 갈 수 있나요?
> 매장 방문은 앱에서 매장과 시간을 선택해 예약할 수 있습니다. 매장 방문을 예약한 고객은 우선 상담을 받을 수 있습니다.
- FAQ 1569: 예약한 시간에 갈 수 없으면 어떻게 하나요?
> 예약한 시간에 매장에 갈 수 없으면 방문 시간 전에 Ubot 앱에서 예약을 취소해 주세요. 매장 예약을 취소하면 그 시간대를 다른 고객이 예약할 수 있습니다. 취소 후에는 다른 시간으로 매장 방문을 다시 예약할 수 있습니다.
- FAQ 1038: 매장 예약 시간은 어떻게 정해지나요?
> 매장 예약 시간은 영업시간 안에서 1시간 단위로 선택할 수 있으며 영업 종료 1시간 전 시간대가 마지막입니다. 매장 예약은 한 시간대에 한 명만 할 수 있어 이미 예약된 시간대는 선택할 수 없습니다.
- FAQ 1561: 방문 시간이 지난 예약도 취소할 수 있나요?
> 매장 예약은 방문 시간 전까지만 취소할 수 있습니다. 방문 시간이 지난 예약은 지난 예약으로 남고 예약 건수에는 포함되지 않습니다.

</details>

<a id="mp-019"></a>
## MP-019 · 비디오패스 이용자 1인과 동시 기기 수

> 비디오패스 월 요금이랑 동시에 몇 대에서 볼 수 있는지 알려 주세요.

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **없음 → 없음 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 비디오패스 월 요금 → ANSWER; gold FAQ 1344, 1335 (gold는 실제 제공 자료와 다를 수 있음)
- #2 동시에 몇 대에서 볼 수 있는지 알려 주세요. → ABSTAIN; gold FAQ 1344 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: faq_set_changed, sub_question_input_changed, search_queries_changed
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1344, 302
- 원본: [results.jsonl:129](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:129](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:121](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 비디오패스 월 요금은 9,900원이며, 이 서비스는 1인이 이용하는 부가서비스입니다. 동시에 볼 수 있는 기기 수에 대한 정보는 제공된 FAQ에서 명시되어 있지 않습니다. 따라서 동시에 몇 대에서 볼 수 있는지에 대한 정확한 정보는 확정할 수 없습니다.

**모델 본문**

> 비디오패스 월 요금은 9,900원이며, 이 서비스는 1인이 이용하는 부가서비스입니다. 동시에 볼 수 있는 기기 수에 대한 정보는 제공된 FAQ에서 명시되어 있지 않습니다. 따라서 동시에 몇 대에서 볼 수 있는지에 대한 정확한 정보는 확정할 수 없습니다.

- 하위 #1: CORRECT_ANSWER — 월 요금 9,900원을 정확히 답했습니다.
- 하위 #2: CORRECT_DECLINE — 동시 시청 기기 수가 자료에 없어 확정하지 않았습니다.
- Judge 요약: 월 요금과 1인 이용 설명은 제공된 FAQ에 근거하며, 동시 시청 기기 수는 자료에 없다고 안내했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 비디오패스 월 요금이랑; FAQ 1344, 302
- 실제 하위 #2: 동시에 몇 대에서 볼 수 있는지 알려 주세요.; FAQ 1344
- 검색 #1: 비디오패스 월 요금이 얼마인가요?
- 검색 #2: 비디오패스는 몇 대에서 동시에 볼 수 있나요?

**실제로 입력된 FAQ 원문**

- FAQ 1344: 비디오패스는 어떤 서비스인가요?
> Ubot 비디오패스(월 9,900원)는 Ubot 영상 라이브러리를 1인이 이용하는 부가서비스이며 실제 OTT 제휴 상품은 아닙니다. 비디오패스로 영상을 볼 때 쓰는 데이터는 요금제에서 차감됩니다. 라이프 비디오 요금제에는 비디오패스가 포함되어 있습니다.
- FAQ 302: IPTV는 월 얼마인가요?
> IPTV 베이직 요금은 월 16,500원, 프리미엄 요금은 월 22,000원이며 두 상품 모두 셋톱박스 임대가 포함되어 있습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1344, 302
- 원본: [results.jsonl:129](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:129](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:121](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 「비디오패스 월 요금이랑」, 「동시에 몇 대에서 볼 수 있는지 알려 주세요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 「비디오패스 월 요금이랑」, 「동시에 몇 대에서 볼 수 있는지 알려 주세요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: MISSING_ANSWER — 자료에 월 9,900원이 있지만 모델은 답하지 않았습니다.
- 하위 #2: CORRECT_DECLINE — 동시 시청 가능 대수는 자료에 없어 답하지 않은 것이 적절합니다.
- Judge 요약: 모델 본문은 비어 있어 월 요금 답변이 누락됐고, 근거 없는 주장도 없습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 비디오패스 월 요금이랑; FAQ 1344, 302
- 실제 하위 #2: 동시에 몇 대에서 볼 수 있는지 알려 주세요.; FAQ 1344
- 검색 #1: 비디오패스 월 요금이 얼마인가요?
- 검색 #2: 비디오패스는 몇 대에서 동시에 볼 수 있나요?

**실제로 입력된 FAQ 원문**

- FAQ 1344: 비디오패스는 어떤 서비스인가요?
> Ubot 비디오패스(월 9,900원)는 Ubot 영상 라이브러리를 1인이 이용하는 부가서비스이며 실제 OTT 제휴 상품은 아닙니다. 비디오패스로 영상을 볼 때 쓰는 데이터는 요금제에서 차감됩니다. 라이프 비디오 요금제에는 비디오패스가 포함되어 있습니다.
- FAQ 302: IPTV는 월 얼마인가요?
> IPTV 베이직 요금은 월 16,500원, 프리미엄 요금은 월 22,000원이며 두 상품 모두 셋톱박스 임대가 포함되어 있습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1344
- 원본: [results.jsonl:49](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:49](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:50](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 비디오패스 월 요금은 9,900원입니다. 이 서비스는 1인이 이용하는 부가서비스이며, 실제 OTT 제휴 상품은 아닙니다. 비디오패스로 영상을 볼 때 쓰는 데이터는 요금제에서 차감됩니다. 라이프 비디오 요금제에는 비디오패스가 포함되어 있습니다.
> 
> 비디오패스는 1대에서만 이용할 수 있습니다. FAQ에서 제공된 정보에 따르면, 비디오패스는 1인이 이용하는 서비스로, 동시에 여러 대에서 볼 수 있는 기능이 명시되어 있지 않습니다.

**모델 본문**

> 비디오패스 월 요금은 9,900원입니다. 이 서비스는 1인이 이용하는 부가서비스이며, 실제 OTT 제휴 상품은 아닙니다. 비디오패스로 영상을 볼 때 쓰는 데이터는 요금제에서 차감됩니다. 라이프 비디오 요금제에는 비디오패스가 포함되어 있습니다.
> 
> 비디오패스는 1대에서만 이용할 수 있습니다. FAQ에서 제공된 정보에 따르면, 비디오패스는 1인이 이용하는 서비스로, 동시에 여러 대에서 볼 수 있는 기능이 명시되어 있지 않습니다.

**Judge가 표시한 주장**

- UNSUPPORTED_GENERALIZATION: 비디오패스는 1대에서만 이용할 수 있습니다.
  - 사유: FAQ의 ‘1인이 이용’은 이용자 수에 관한 설명이며 동시 이용 가능 기기 수는 제시하지 않습니다.
- 적용 후보: [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 월 요금 9,900원을 정확히 답했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 1인 이용이라는 설명만으로 동시 이용 가능 기기를 1대로 확정했습니다.
- Judge 요약: 월 요금은 근거와 일치하지만, 자료에 없는 동시 이용 기기 수를 1대로 단정했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 비디오패스 월 요금이랑; FAQ 1344
- 실제 하위 #2: 동시에 몇 대에서 볼 수 있는지 알려 주세요.; FAQ 1344
- 검색 #1: 비디오패스의 월 요금은 얼마인가요?
- 검색 #2: 비디오패스는 몇 대에서 동시에 볼 수 있나요?
- slot #1: ANSWER; 최종 본문에 남음
> 비디오패스 월 요금은 9,900원입니다. 이 서비스는 1인이 이용하는 부가서비스이며, 실제 OTT 제휴 상품은 아닙니다. 비디오패스로 영상을 볼 때 쓰는 데이터는 요금제에서 차감됩니다. 라이프 비디오 요금제에는 비디오패스가 포함되어 있습니다.
- slot #2: ANSWER; 최종 본문에 남음
> 비디오패스는 1대에서만 이용할 수 있습니다. FAQ에서 제공된 정보에 따르면, 비디오패스는 1인이 이용하는 서비스로, 동시에 여러 대에서 볼 수 있는 기능이 명시되어 있지 않습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1344: 비디오패스는 어떤 서비스인가요?
> Ubot 비디오패스(월 9,900원)는 Ubot 영상 라이브러리를 1인이 이용하는 부가서비스이며 실제 OTT 제휴 상품은 아닙니다. 비디오패스로 영상을 볼 때 쓰는 데이터는 요금제에서 차감됩니다. 라이프 비디오 요금제에는 비디오패스가 포함되어 있습니다.

</details>

<a id="mp-021"></a>
## MP-021 · 추천 포인트 지급의 링크 가입·3개월 이용 조건

> 친구 추천하면 몇 포인트 받고, 몇 명까지 추천할 수 있어요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 환각 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC04](hallucination_progression.md#hc04)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 친구 추천하면 몇 포인트 받고 → ANSWER; gold FAQ 1367 (gold는 실제 제공 자료와 다를 수 있음)
- #2 몇 명까지 추천할 수 있어요? → ABSTAIN; gold FAQ 1367 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1367
- 원본: [results.jsonl:131](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:131](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:124](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 친구를 추천하면 추천한 사람과 친구 모두에게 5,000포인트를 드립니다. 그러나 몇 명까지 추천할 수 있는지에 대한 정보는 제공된 자료에 없습니다.

**모델 본문**

> 친구를 추천하면 추천한 사람과 친구 모두에게 5,000포인트를 드립니다. 그러나 몇 명까지 추천할 수 있는지에 대한 정보는 제공된 자료에 없습니다.

**Judge가 표시한 주장**

- UNSUPPORTED_GENERALIZATION: 친구를 추천하면 추천한 사람과 친구 모두에게 5,000포인트를 드립니다.
  - 사유: 자료는 앱 추천 링크로 가입한 친구가 3개월 이상 이용한 경우에만 포인트를 지급한다고 명시합니다.
- 적용 후보: [HC04](hallucination_progression.md#hc04)

- 하위 #1: WRONG_ANSWER — 5,000포인트는 맞지만, 앱 추천 링크로 가입한 친구가 3개월 이상 이용해야 한다는 핵심 조건을 빠뜨렸습니다.
- 하위 #2: CORRECT_DECLINE — 추천 가능 인원은 자료에 없다고 안내하고 수치를 지어내지 않았습니다.
- Judge 요약: 포인트 액수는 맞지만 지급 조건을 생략해 무조건 지급되는 것처럼 답했고, 추천 인원은 적절히 답변을 보류했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 친구 추천하면 몇 포인트 받고,; FAQ 1367
- 실제 하위 #2: 몇 명까지 추천할 수 있어요?; FAQ 없음
- 검색 #1: 친구 추천 시 몇 포인트를 받나요?
- 검색 #2: 친구를 몇 명까지 추천할 수 있나요?

**실제로 입력된 FAQ 원문**

- FAQ 1367: 친구를 추천하면 혜택이 있나요?
> Ubot 앱의 친구 추천 링크로 가입한 친구가 3개월 이상 이용하면 추천한 사람과 친구 모두에게 5,000포인트를 드립니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1367
- 원본: [results.jsonl:131](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:131](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:122](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 친구를 추천하면 추천한 사람과 친구 모두에게 5,000포인트를 드립니다. 그러나 몇 명까지 추천할 수 있는 제한은 FAQ에 명시되어 있지 않습니다.
> 
> 「몇 명까지 추천할 수 있어요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 친구를 추천하면 추천한 사람과 친구 모두에게 5,000포인트를 드립니다. 그러나 몇 명까지 추천할 수 있는 제한은 FAQ에 명시되어 있지 않습니다.

**코드 고정 안내**

> 「몇 명까지 추천할 수 있어요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**Judge가 표시한 주장**

- UNSUPPORTED_GENERALIZATION: 친구를 추천하면 추천한 사람과 친구 모두에게 5,000포인트를 드립니다.
  - 사유: 앱 추천 링크로 가입한 친구가 3개월 이상 이용해야 한다는 지급 조건을 생략해 무조건 지급되는 것처럼 말했습니다.
- 적용 후보: [HC04](hallucination_progression.md#hc04)

- 하위 #1: WRONG_ANSWER — 5,000포인트는 맞지만 앱 추천 링크 가입과 3개월 이상 이용 조건을 빠뜨렸습니다.
- 하위 #2: CORRECT_DECLINE — 추천 가능 인원은 FAQ에 없다고 안내하고 숫자를 지어내지 않았습니다.
- Judge 요약: 포인트 액수는 맞지만 지급 조건이 빠졌고, 추천 인원 제한은 자료에 없다고 적절히 답하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 친구 추천하면 몇 포인트 받고,; FAQ 1367
- 실제 하위 #2: 몇 명까지 추천할 수 있어요?; FAQ 없음
- 검색 #1: 친구 추천 시 몇 포인트를 받나요?
- 검색 #2: 친구를 몇 명까지 추천할 수 있나요?

**실제로 입력된 FAQ 원문**

- FAQ 1367: 친구를 추천하면 혜택이 있나요?
> Ubot 앱의 친구 추천 링크로 가입한 친구가 3개월 이상 이용하면 추천한 사람과 친구 모두에게 5,000포인트를 드립니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1367
- 원본: [results.jsonl:51](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:51](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:51](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 친구를 추천하면 추천한 사람과 친구 모두에게 5,000포인트를 드립니다.
> 
> 「몇 명까지 추천할 수 있어요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 친구를 추천하면 추천한 사람과 친구 모두에게 5,000포인트를 드립니다.

**코드 고정 안내**

> 「몇 명까지 추천할 수 있어요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**Judge가 표시한 주장**

- UNSUPPORTED_GENERALIZATION: 친구를 추천하면 추천한 사람과 친구 모두에게 5,000포인트를 드립니다.
  - 사유: 자료는 앱 추천 링크로 가입한 친구가 3개월 이상 이용한 경우에만 포인트를 지급한다고 합니다.
- 적용 후보: [HC04](hallucination_progression.md#hc04)

- 하위 #1: WRONG_ANSWER — 5,000포인트는 맞지만 앱 추천 링크 가입과 3개월 이상 이용이라는 핵심 조건을 빠뜨렸습니다.
- 하위 #2: CORRECT_DECLINE — 추천 가능 인원을 지어내지 않았고, 시스템 고정 안내에서 확인할 수 없다고 알렸습니다.
- Judge 요약: 포인트 금액은 맞지만 지급 조건을 누락해 첫 하위 질문은 오답이며, 추천 가능 인원은 답하지 않아 적절합니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 친구 추천하면 몇 포인트 받고,; FAQ 1367
- 실제 하위 #2: 몇 명까지 추천할 수 있어요?; FAQ 없음
- 검색 #1: 친구 추천 시 몇 포인트를 받나요?
- 검색 #2: 친구를 몇 명까지 추천할 수 있나요?
- slot #1: ANSWER; 최종 본문에 남음
> 친구를 추천하면 추천한 사람과 친구 모두에게 5,000포인트를 드립니다.
- slot #2: ABSTAIN; 최종 본문에서 제거
> 친구 추천 명수 제한에 대한 정보가 없습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1367: 친구를 추천하면 혜택이 있나요?
> Ubot 앱의 친구 추천 링크로 가입한 친구가 3개월 이상 이용하면 추천한 사람과 친구 모두에게 5,000포인트를 드립니다.

</details>

<a id="mp-022"></a>
## MP-022 · 월 1회 영화 혜택을 한 번에 1장으로 적용

> VIP 기준 요금이 얼마고, 영화 예매는 한 번에 몇 장까지 돼요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 환각 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 VIP 기준 요금이 얼마고 → ANSWER; gold FAQ 285, 1349 (gold는 실제 제공 자료와 다를 수 있음)
- #2 영화 예매는 한 번에 몇 장까지 돼요? → ABSTAIN; gold FAQ 1362 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1349, 1362, 1039
- 원본: [results.jsonl:132](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:132](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:126](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> VIP 기준 요금은 월정액 70,000원 이상입니다. 영화 예매는 한 번에 1장까지 가능합니다. 다만, 매장 예약에 대한 정보는 '한 사람당 최대 3건까지' 가능하다고 되어 있지만, 이는 예약 건수를 의미하며 영화 예매 수량과는 다릅니다. 영화 예매 수량에 대한 명시적 정보는 FAQ에 없습니다.

**모델 본문**

> VIP 기준 요금은 월정액 70,000원 이상입니다. 영화 예매는 한 번에 1장까지 가능합니다. 다만, 매장 예약에 대한 정보는 '한 사람당 최대 3건까지' 가능하다고 되어 있지만, 이는 예약 건수를 의미하며 영화 예매 수량과는 다릅니다. 영화 예매 수량에 대한 명시적 정보는 FAQ에 없습니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 영화 예매는 한 번에 1장까지 가능합니다.
  - 사유: FAQ의 '매월 영화 예매 1회'는 월 이용 횟수이지 한 번에 예매할 수 있는 장수가 아닙니다.
- 적용 후보: [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — VIP 기준 월정액 70,000원 이상을 맞게 답했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 자료에 없는 1회 예매 가능 수량을 1장으로 단정했습니다.
- Judge 요약: VIP 요금은 맞지만, 영화 예매 수량은 자료에 없는데도 1장이라고 답했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: VIP 기준 요금이 얼마고,; FAQ 1349, 1362
- 실제 하위 #2: 영화 예매는 한 번에 몇 장까지 돼요?; FAQ 1039
- 검색 #1: VIP 기준 요금은 얼마인가요?
- 검색 #2: 영화 예매는 한 번에 몇 장까지 가능한가요?

**실제로 입력된 FAQ 원문**

- FAQ 1349: 멤버십 등급은 어떻게 정해지나요?
> Ubot 멤버십 등급은 매년 1월 1일에 직전 6개월의 평균 월정액을 기준으로 정합니다. 멤버십 평균 월정액이 70,000원 이상이면 VIP, 40,000원 이상이면 골드, 그 외는 실버이며 신규 가입자는 가입 다음 달에 등급이 정해집니다.
- FAQ 1362: VIP 혜택은 무엇인가요?
> VIP 멤버십은 제휴처 할인 한도가 늘고 매월 영화 예매 1회와 카페 음료 1회 같은 전용 혜택을 받을 수 있습니다. VIP 혜택의 제휴처와 이용 횟수는 앱의 멤버십 혜택 메뉴에서 확인할 수 있습니다.
- FAQ 1039: 매장 예약은 몇 건까지 할 수 있나요?
> 방문 시간이 지나지 않은 매장 예약은 한 사람당 최대 3건까지 할 수 있으며 같은 시간에 두 매장을 예약할 수 없습니다. 방문 시간이 지난 매장 예약은 예약 건수에서 빠집니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1349, 1362, 1039
- 원본: [results.jsonl:132](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:132](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:125](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> VIP 기준 요금은 월정액 70,000원 이상입니다. 영화 예매는 한 번에 1장까지 가능합니다. 이는 영화 예매 혜택이 매월 1회로 제한된다는 FAQ 내용에서 파악할 수 있습니다. 다만, 매장 예약은 한 사람당 최대 3건까지 가능하지만, 이는 영화 예매와는 별개의 사항입니다.

**모델 본문**

> VIP 기준 요금은 월정액 70,000원 이상입니다. 영화 예매는 한 번에 1장까지 가능합니다. 이는 영화 예매 혜택이 매월 1회로 제한된다는 FAQ 내용에서 파악할 수 있습니다. 다만, 매장 예약은 한 사람당 최대 3건까지 가능하지만, 이는 영화 예매와는 별개의 사항입니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 영화 예매는 한 번에 1장까지 가능합니다.
  - 사유: FAQ의 '매월 영화 예매 1회'는 이용 횟수이며, 한 번에 예매할 수 있는 장수는 자료에 없습니다.
- 적용 후보: [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — VIP 기준 요금인 월정액 70,000원 이상을 맞게 답했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 월 1회 이용 가능하다는 자료만으로 한 번에 1장까지라고 단정했습니다.
- Judge 요약: VIP 요금은 맞지만 영화 예매의 월 이용 횟수를 1회당 예매 가능 장수로 잘못 해석했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: VIP 기준 요금이 얼마고,; FAQ 1349, 1362
- 실제 하위 #2: 영화 예매는 한 번에 몇 장까지 돼요?; FAQ 1039
- 검색 #1: VIP 기준 요금은 얼마인가요?
- 검색 #2: 영화 예매는 한 번에 몇 장까지 가능한가요?

**실제로 입력된 FAQ 원문**

- FAQ 1349: 멤버십 등급은 어떻게 정해지나요?
> Ubot 멤버십 등급은 매년 1월 1일에 직전 6개월의 평균 월정액을 기준으로 정합니다. 멤버십 평균 월정액이 70,000원 이상이면 VIP, 40,000원 이상이면 골드, 그 외는 실버이며 신규 가입자는 가입 다음 달에 등급이 정해집니다.
- FAQ 1362: VIP 혜택은 무엇인가요?
> VIP 멤버십은 제휴처 할인 한도가 늘고 매월 영화 예매 1회와 카페 음료 1회 같은 전용 혜택을 받을 수 있습니다. VIP 혜택의 제휴처와 이용 횟수는 앱의 멤버십 혜택 메뉴에서 확인할 수 있습니다.
- FAQ 1039: 매장 예약은 몇 건까지 할 수 있나요?
> 방문 시간이 지나지 않은 매장 예약은 한 사람당 최대 3건까지 할 수 있으며 같은 시간에 두 매장을 예약할 수 없습니다. 방문 시간이 지난 매장 예약은 예약 건수에서 빠집니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1349, 1362, 1039
- 원본: [results.jsonl:200](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:200](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:190](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> VIP 기준 요금은 월정액이 70,000원 이상일 때입니다.
> 
> 「영화 예매는 한 번에 몇 장까지 돼요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> VIP 기준 요금은 월정액이 70,000원 이상일 때입니다.

**코드 고정 안내**

> 「영화 예매는 한 번에 몇 장까지 돼요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_ANSWER — VIP 기준 요금이 월 70,000원 이상이라는 핵심 금액을 답했습니다.
- 하위 #2: CORRECT_DECLINE — 한 번에 예매할 수 있는 장수를 지어내지 않고 답하지 않았습니다.
- Judge 요약: 답변은 VIP 기준 금액을 자료에 맞게 제시했고, 자료에 없는 영화 예매 장수는 답하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: VIP 기준 요금이 얼마고,; FAQ 1349, 1362
- 실제 하위 #2: 영화 예매는 한 번에 몇 장까지 돼요?; FAQ 1039
- 검색 #1: VIP 기준 요금은 얼마인가요?
- 검색 #2: 영화 예매는 한 번에 몇 장까지 가능한가요?
- slot #1: ANSWER; 최종 본문에 남음
> VIP 기준 요금은 월정액이 70,000원 이상일 때입니다.
- slot #2: ABSTAIN; 최종 본문에서 제거
> 영화 예매는 한 번에 1장까지 가능합니다. 매장 예약은 한 사람당 최대 3건까지 가능하지만, 이는 영화 예매와는 다릅니다.

**실제로 입력된 FAQ 원문**

- FAQ 1349: 멤버십 등급은 어떻게 정해지나요?
> Ubot 멤버십 등급은 매년 1월 1일에 직전 6개월의 평균 월정액을 기준으로 정합니다. 멤버십 평균 월정액이 70,000원 이상이면 VIP, 40,000원 이상이면 골드, 그 외는 실버이며 신규 가입자는 가입 다음 달에 등급이 정해집니다.
- FAQ 1362: VIP 혜택은 무엇인가요?
> VIP 멤버십은 제휴처 할인 한도가 늘고 매월 영화 예매 1회와 카페 음료 1회 같은 전용 혜택을 받을 수 있습니다. VIP 혜택의 제휴처와 이용 횟수는 앱의 멤버십 혜택 메뉴에서 확인할 수 있습니다.
- FAQ 1039: 매장 예약은 몇 건까지 할 수 있나요?
> 방문 시간이 지나지 않은 매장 예약은 한 사람당 최대 3건까지 할 수 있으며 같은 시간에 두 매장을 예약할 수 없습니다. 방문 시간이 지난 매장 예약은 예약 건수에서 빠집니다.

</details>

<a id="mp-023"></a>
## MP-023 · 로밍 사용 전 환불에서 사용 후 환불 불가 단정

> 로밍 패스를 쓰기 전에 여행이 취소되면 환불되나요? 쓰다가 중간에 해지하면 남은 날만큼 돌려줘요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 환각 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 로밍 패스를 쓰기 전에 여행이 취소되면 환불되나요? → ANSWER; gold FAQ 197 (gold는 실제 제공 자료와 다를 수 있음)
- #2 쓰다가 중간에 해지하면 남은 날만큼 돌려줘요? → ABSTAIN; gold FAQ 197 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: context_sections_changed
- 입력 차이 v4sub_slot: context_sections_changed

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 197, 1680
- 원본: [results.jsonl:133](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:133](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:125](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 로밍 패스를 쓰기 전에 여행이 취소되면, 출국하지 않았고 로밍 패스 사용이 시작되지 않았다면 전액 환불받을 수 있습니다. 로밍 패스를 쓰다가 중간에 해지하면 남은 날만큼 환불이 되는 것은 아니며, 사용 전 취소만 전액 환불이 가능합니다. 사용 전 해지 시 앱이나 고객센터에서 신청해야 합니다. 
> 
> ※ FAQ [197]에 따르면, 사용이 시작되지 않았을 경우에만 전액 환불이 가능하며, 중간 해지 시 남은 날만큼 환불되는 내용은 명시되어 있지 않습니다.

**모델 본문**

> 로밍 패스를 쓰기 전에 여행이 취소되면, 출국하지 않았고 로밍 패스 사용이 시작되지 않았다면 전액 환불받을 수 있습니다. 로밍 패스를 쓰다가 중간에 해지하면 남은 날만큼 환불이 되는 것은 아니며, 사용 전 취소만 전액 환불이 가능합니다. 사용 전 해지 시 앱이나 고객센터에서 신청해야 합니다. 
> 
> ※ FAQ [197]에 따르면, 사용이 시작되지 않았을 경우에만 전액 환불이 가능하며, 중간 해지 시 남은 날만큼 환불되는 내용은 명시되어 있지 않습니다.

**Judge가 표시한 주장**

- FABRICATION: 로밍 패스를 쓰다가 중간에 해지하면 남은 날만큼 환불이 되는 것은 아닙니다.
  - 사유: 제공된 FAQ에는 사용 전 취소 조건만 있으며 중간 해지 시 환불 여부는 나와 있지 않습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 출국하지 않았고 사용 전이라면 전액 환불받을 수 있다는 조건을 정확히 답했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 자료에 없는 중간 해지 시 잔여 기간 환불 불가를 단정했습니다.
- Judge 요약: 사용 전 전액 환불 안내는 근거와 일치하지만, 근거 없는 중간 해지 환불 불가를 단정해 전체 판정은 틀렸습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 로밍 패스를 쓰기 전에 여행이 취소되면 환불되나요? 쓰다가; FAQ 197, 1680
- 실제 하위 #2: 중간에 해지하면 남은 날만큼 돌려줘요?; FAQ 197
- 검색 #1: 로밍 패스를 쓰기 전에 여행이 취소되면 환불되나요?
- 검색 #2: 로밍 패스를 쓰다가 중간에 해지하면 남은 날만큼 환불되나요?

**실제로 입력된 FAQ 원문**

- FAQ 197: 여행이 취소됐는데 로밍 패스는 어떻게 하나요?
> 여행이 취소되어 출국하지 않았고 로밍 패스 사용이 시작되지 않았다면 가입을 취소하고 전액 환불받을 수 있습니다. 사용 전 로밍 패스 취소는 앱이나 고객센터에서 신청해 주세요.
- FAQ 1680: 이미 해외에 도착했는데 지금 로밍 패스에 가입할 수 있나요?
> 이미 해외에 도착했어도 데이터 로밍이나 현지 와이파이로 통신사 앱에 접속하면 로밍 패스에 가입할 수 있습니다. 해외에서 가입한 로밍 패스와 이용 기간은 앱의 로밍 메뉴에서 확인해 주세요.

</details>

### v1 sub

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 197, 1680
- 원본: [results.jsonl:133](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:133](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:124](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 로밍 패스를 쓰기 전에 여행이 취소되면, 출국하지 않았고 로밍 패스 사용이 시작되지 않았다면 전액 환불받을 수 있습니다. 쓰다가 중간에 해지하면, 사용이 시작되지 않았다는 조건을 충족하지 않기 때문에 남은 날만큼 환불되는 경우는 명시되어 있지 않습니다. 따라서 중간 해지 시 환불 여부는 FAQ에 명시된 조건을 기준으로 하여, 사용이 시작되지 않았다면 전액 환불이 가능하지만, 사용이 시작된 경우는 환불이 불가능합니다. 다만, 사용 전 해지 시에는 앱이나 고객센터에서 신청해 주어야 합니다.
> 
> 「중간에 해지하면 남은 날만큼 돌려줘요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 로밍 패스를 쓰기 전에 여행이 취소되면, 출국하지 않았고 로밍 패스 사용이 시작되지 않았다면 전액 환불받을 수 있습니다. 쓰다가 중간에 해지하면, 사용이 시작되지 않았다는 조건을 충족하지 않기 때문에 남은 날만큼 환불되는 경우는 명시되어 있지 않습니다. 따라서 중간 해지 시 환불 여부는 FAQ에 명시된 조건을 기준으로 하여, 사용이 시작되지 않았다면 전액 환불이 가능하지만, 사용이 시작된 경우는 환불이 불가능합니다. 다만, 사용 전 해지 시에는 앱이나 고객센터에서 신청해 주어야 합니다.

**코드 고정 안내**

> 「중간에 해지하면 남은 날만큼 돌려줘요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**Judge가 표시한 주장**

- UNSUPPORTED_GENERALIZATION: 사용이 시작된 경우는 환불이 불가능합니다.
  - 사유: FAQ는 사용 전 전액 환불 조건만 설명하며, 사용 시작 후 환불 여부는 밝히지 않습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 출국하지 않았고 사용 전이면 전액 환불된다는 조건을 정확히 안내했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 자료에 없는 사용 시작 후 환불 불가를 확정해 답했습니다.
- Judge 요약: 첫 질문은 정확히 답했지만, 둘째 질문에서는 자료에 없는 환불 불가 결론을 단정했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 로밍 패스를 쓰기 전에 여행이 취소되면 환불되나요? 쓰다가; FAQ 197, 1680
- 실제 하위 #2: 중간에 해지하면 남은 날만큼 돌려줘요?; FAQ 197
- 검색 #1: 로밍 패스를 쓰기 전에 여행이 취소되면 환불되나요?
- 검색 #2: 로밍 패스를 쓰다가 중간에 해지하면 남은 날만큼 환불되나요?

**실제로 입력된 FAQ 원문**

- FAQ 197: 여행이 취소됐는데 로밍 패스는 어떻게 하나요?
> 여행이 취소되어 출국하지 않았고 로밍 패스 사용이 시작되지 않았다면 가입을 취소하고 전액 환불받을 수 있습니다. 사용 전 로밍 패스 취소는 앱이나 고객센터에서 신청해 주세요.
- FAQ 1680: 이미 해외에 도착했는데 지금 로밍 패스에 가입할 수 있나요?
> 이미 해외에 도착했어도 데이터 로밍이나 현지 와이파이로 통신사 앱에 접속하면 로밍 패스에 가입할 수 있습니다. 해외에서 가입한 로밍 패스와 이용 기간은 앱의 로밍 메뉴에서 확인해 주세요.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 197, 1680
- 원본: [results.jsonl:52](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:52](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:52](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 여행이 취소되어 출국하지 않았고 로밍 패스 사용이 시작되지 않았다면 가입을 취소하고 전액 환불받을 수 있습니다. 사용 전 로밍 패스 취소는 앱이나 고객센터에서 신청해 주세요.
> 
> 로밍 패스를 쓰다가 중간에 해지하면 남은 날만큼 환불이 되지 않습니다. 로밍 패가 사용이 시작되지 않았을 경우에만 전액 환불이 가능하며, 사용이 시작된 후에는 환불이 불가능합니다.

**모델 본문**

> 여행이 취소되어 출국하지 않았고 로밍 패스 사용이 시작되지 않았다면 가입을 취소하고 전액 환불받을 수 있습니다. 사용 전 로밍 패스 취소는 앱이나 고객센터에서 신청해 주세요.
> 
> 로밍 패스를 쓰다가 중간에 해지하면 남은 날만큼 환불이 되지 않습니다. 로밍 패가 사용이 시작되지 않았을 경우에만 전액 환불이 가능하며, 사용이 시작된 후에는 환불이 불가능합니다.

**Judge가 표시한 주장**

- FABRICATION: 로밍 패스를 쓰다가 중간에 해지하면 남은 날만큼 환불되지 않으며, 사용 시작 후에는 환불이 불가능하다.
  - 사유: 제공된 FAQ는 사용 전 취소와 전액 환불만 설명하며 사용 시작 후 환불 여부는 명시하지 않습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 출국 전이고 사용이 시작되지 않았다면 취소 후 전액 환불받을 수 있다고 정확히 답했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 자료에 없는 사용 중 해지 시 환불 불가를 확정해 답했습니다.
- Judge 요약: 사용 전 환불은 근거에 맞지만, 사용 중 해지의 환불 여부는 근거 없이 단정했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 로밍 패스를 쓰기 전에 여행이 취소되면 환불되나요? 쓰다가; FAQ 197, 1680
- 실제 하위 #2: 중간에 해지하면 남은 날만큼 돌려줘요?; FAQ 197
- 검색 #1: 로밍 패스를 쓰기 전에 여행이 취소되면 환불되나요?
- 검색 #2: 로밍 패스를 쓰다가 중간에 해지하면 남은 날만큼 환불되나요?
- slot #1: ANSWER; 최종 본문에 남음
> 여행이 취소되어 출국하지 않았고 로밍 패스 사용이 시작되지 않았다면 가입을 취소하고 전액 환불받을 수 있습니다. 사용 전 로밍 패스 취소는 앱이나 고객센터에서 신청해 주세요.
- slot #2: ANSWER; 최종 본문에 남음
> 로밍 패스를 쓰다가 중간에 해지하면 남은 날만큼 환불이 되지 않습니다. 로밍 패가 사용이 시작되지 않았을 경우에만 전액 환불이 가능하며, 사용이 시작된 후에는 환불이 불가능합니다.

**실제로 입력된 FAQ 원문**

- FAQ 197: 여행이 취소됐는데 로밍 패스는 어떻게 하나요?
> 여행이 취소되어 출국하지 않았고 로밍 패스 사용이 시작되지 않았다면 가입을 취소하고 전액 환불받을 수 있습니다. 사용 전 로밍 패스 취소는 앱이나 고객센터에서 신청해 주세요.
- FAQ 1680: 이미 해외에 도착했는데 지금 로밍 패스에 가입할 수 있나요?
> 이미 해외에 도착했어도 데이터 로밍이나 현지 와이파이로 통신사 앱에 접속하면 로밍 패스에 가입할 수 있습니다. 해외에서 가입한 로밍 패스와 이용 기간은 앱의 로밍 메뉴에서 확인해 주세요.

</details>

<a id="mp-025"></a>
## MP-025 · 장기 정지 최대 기간 미제공을 제한 없음으로 변환

> 장기 일시정지는 어떤 경우에 신청하고 최대 몇 년까지 돼요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 없음 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 장기 일시정지는 어떤 경우에 신청하고 → ANSWER; gold FAQ 1435, 1320 (gold는 실제 제공 자료와 다를 수 있음)
- #2 최대 몇 년까지 돼요? → ABSTAIN; gold FAQ 1435 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: sub_question_input_changed, search_queries_changed
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: sub_question_input_changed, search_queries_changed

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1435, 1321, 1431
- 원본: [results.jsonl:135](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:135](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:128](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 장기 일시정지는 군 입대, 해외 체류, 입원처럼 증빙 서류가 있는 경우에 신청할 수 있습니다. 최대 기간은 FAQ에서 명시되어 있지 않으며, 일시정지의 경우 1회 최대 90일까지 가능하지만, 장기 정지의 최대 기간은 정해져 있지 않습니다. 따라서 장기 일시정지의 최대 기간에 대한 구체적인 정보는 제공된 자료에서 확인할 수 없습니다.

**모델 본문**

> 장기 일시정지는 군 입대, 해외 체류, 입원처럼 증빙 서류가 있는 경우에 신청할 수 있습니다. 최대 기간은 FAQ에서 명시되어 있지 않으며, 일시정지의 경우 1회 최대 90일까지 가능하지만, 장기 정지의 최대 기간은 정해져 있지 않습니다. 따라서 장기 일시정지의 최대 기간에 대한 구체적인 정보는 제공된 자료에서 확인할 수 없습니다.

**Judge가 표시한 주장**

- FABRICATION: 장기 정지의 최대 기간은 정해져 있지 않습니다.
  - 사유: FAQ에 최대 기간이 명시되지 않았다는 사실만으로 기간 제한이 없다고 단정할 수 없습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 증빙 서류가 있는 군 입대·해외 체류·입원 사례를 정확히 답했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 자료에 최대 기간이 없는데도 최대 기간이 정해져 있지 않다고 단정했습니다.
- Judge 요약: 신청 사유는 근거와 일치하고 최대 기간을 확인할 수 없다고 안내했지만, 제한이 없다는 근거 없는 주장을 함께 했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 장기 일시정지는 어떤 경우에 신청하고; FAQ 1435, 1321
- 실제 하위 #2: 최대 몇 년까지 돼요?; FAQ 1431, 1435
- 검색 #1: 장기 일시정지 신청은 어떤 경우에 돼요?
- 검색 #2: 장기 일시정지의 최대 기간은 몇 년까지 돼요?

**실제로 입력된 FAQ 원문**

- FAQ 1435: 일시정지와 장기 정지는 무엇이 다른가요?
> 일시정지는 누구나 연 2회, 1회 최대 90일까지 월 3,850원에 신청할 수 있습니다. 장기 정지는 군 입대, 해외 체류, 입원처럼 증빙 서류가 있는 경우에 더 긴 기간 동안 신청할 수 있습니다.
- FAQ 1321: 해외 체류로 장기 일시정지를 신청할 때 필요한 서류가 있나요?
> 해외 체류로 장기 일시정지를 신청하려면 항공권이나 출입국 사실 증명서와 명의자 신분증이 필요합니다. 해외에 출국한 뒤에는 대리인이 위임장을 가지고 매장에서 장기 일시정지를 신청할 수도 있습니다.
- FAQ 1431: 휴대폰을 잠시 쉬려면 어떻게 하나요?
> 휴대폰을 잠시 쉬려면 Ubot 앱·고객센터·매장에서 일시정지를 신청하면 됩니다. 휴대폰 일시정지는 연 2회, 1회 최대 90일, 연간 합계 180일까지 가능합니다. 일시정지 기간에는 월 3,850원이 청구됩니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1321, 1435, 1431
- 원본: [results.jsonl:135](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:135](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:126](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 장기 일시정지는 군 입대, 해외 체류, 입원처럼 증빙 서류가 있는 경우에 신청할 수 있습니다. 최대 기간은 FAQ에서 명시된 바 없으나, 장기 정지의 경우 증빙 서류가 있는 경우에 더 긴 기간 동안 신청 가능하다고 되어 있습니다. 그러나 구체적인 최대 기간(년 단위)은 제공된 FAQ에서 명시되어 있지 않습니다. 따라서 최대 몇 년까지 가능한지에 대한 정확한 정보는 확정할 수 없습니다.
> 
> 「최대 몇 년까지 돼요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 장기 일시정지는 군 입대, 해외 체류, 입원처럼 증빙 서류가 있는 경우에 신청할 수 있습니다. 최대 기간은 FAQ에서 명시된 바 없으나, 장기 정지의 경우 증빙 서류가 있는 경우에 더 긴 기간 동안 신청 가능하다고 되어 있습니다. 그러나 구체적인 최대 기간(년 단위)은 제공된 FAQ에서 명시되어 있지 않습니다. 따라서 최대 몇 년까지 가능한지에 대한 정확한 정보는 확정할 수 없습니다.

**코드 고정 안내**

> 「최대 몇 년까지 돼요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_ANSWER — 증빙 서류가 있는 군 입대·해외 체류·입원 등의 신청 조건을 정확히 안내했습니다.
- 하위 #2: CORRECT_DECLINE — 자료에 없는 최대 연수를 지어내지 않고 확인할 수 없다고 밝혔습니다.
- Judge 요약: 신청 조건은 FAQ와 일치하고, 최대 연수는 자료에 없어 답하지 않았으며 검색어도 질문을 충실히 반영했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 장기 일시정지는 어떤 경우에 신청하고; FAQ 1321, 1435
- 실제 하위 #2: 최대 몇 년까지 돼요?; FAQ 1431
- 검색 #1: 장기 일시정지의 신청 조건은 무엇인가요?
- 검색 #2: 장기 일시정지의 최대 기간은 몇 년인가요?

**실제로 입력된 FAQ 원문**

- FAQ 1321: 해외 체류로 장기 일시정지를 신청할 때 필요한 서류가 있나요?
> 해외 체류로 장기 일시정지를 신청하려면 항공권이나 출입국 사실 증명서와 명의자 신분증이 필요합니다. 해외에 출국한 뒤에는 대리인이 위임장을 가지고 매장에서 장기 일시정지를 신청할 수도 있습니다.
- FAQ 1435: 일시정지와 장기 정지는 무엇이 다른가요?
> 일시정지는 누구나 연 2회, 1회 최대 90일까지 월 3,850원에 신청할 수 있습니다. 장기 정지는 군 입대, 해외 체류, 입원처럼 증빙 서류가 있는 경우에 더 긴 기간 동안 신청할 수 있습니다.
- FAQ 1431: 휴대폰을 잠시 쉬려면 어떻게 하나요?
> 휴대폰을 잠시 쉬려면 Ubot 앱·고객센터·매장에서 일시정지를 신청하면 됩니다. 휴대폰 일시정지는 연 2회, 1회 최대 90일, 연간 합계 180일까지 가능합니다. 일시정지 기간에는 월 3,850원이 청구됩니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1321, 1435, 1431
- 원본: [results.jsonl:54](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:54](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:53](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 장기 일시정지는 군 입대, 해외 체류, 입원처럼 증빙 서류가 있는 경우에 신청할 수 있습니다.
> 
> 「최대 몇 년까지 돼요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 장기 일시정지는 군 입대, 해외 체류, 입원처럼 증빙 서류가 있는 경우에 신청할 수 있습니다.

**코드 고정 안내**

> 「최대 몇 년까지 돼요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_ANSWER — 증빙 서류가 있는 군 입대·해외 체류·입원 경우를 정확히 안내했습니다.
- 하위 #2: CORRECT_DECLINE — 최대 연수를 지어내지 않았고 시스템 고정 안내에서 확인 불가를 알렸습니다.
- Judge 요약: 모델 답변은 제공된 FAQ에 근거하며, 자료에 없는 최대 기간은 답하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 장기 일시정지는 어떤 경우에 신청하고; FAQ 1321, 1435
- 실제 하위 #2: 최대 몇 년까지 돼요?; FAQ 1431
- 검색 #1: 장기 일시정지의 신청 조건은 무엇인가요?
- 검색 #2: 장기 일시정지의 최대 기간은 몇 년인가요?
- slot #1: ANSWER; 최종 본문에 남음
> 장기 일시정지는 군 입대, 해외 체류, 입원처럼 증빙 서류가 있는 경우에 신청할 수 있습니다.
- slot #2: ABSTAIN; 최종 본문에서 제거
> 장기 정지의 최대 기간은 FAQ에서 명시된 바 없으나, 해외 체류 등 증빙 서류가 있는 경우에 신청 가능하며, 일시정지의 최대 기간은 90일까지입니다. 그러나 장기 정지의 최대 기간은 정책에 명시되어 있지 않아 구체적인 년 수는 확인할 수 없습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1321: 해외 체류로 장기 일시정지를 신청할 때 필요한 서류가 있나요?
> 해외 체류로 장기 일시정지를 신청하려면 항공권이나 출입국 사실 증명서와 명의자 신분증이 필요합니다. 해외에 출국한 뒤에는 대리인이 위임장을 가지고 매장에서 장기 일시정지를 신청할 수도 있습니다.
- FAQ 1435: 일시정지와 장기 정지는 무엇이 다른가요?
> 일시정지는 누구나 연 2회, 1회 최대 90일까지 월 3,850원에 신청할 수 있습니다. 장기 정지는 군 입대, 해외 체류, 입원처럼 증빙 서류가 있는 경우에 더 긴 기간 동안 신청할 수 있습니다.
- FAQ 1431: 휴대폰을 잠시 쉬려면 어떻게 하나요?
> 휴대폰을 잠시 쉬려면 Ubot 앱·고객센터·매장에서 일시정지를 신청하면 됩니다. 휴대폰 일시정지는 연 2회, 1회 최대 90일, 연간 합계 180일까지 가능합니다. 일시정지 기간에는 월 3,850원이 청구됩니다.

</details>

<a id="mp-026"></a>
## MP-026 · 결제·유심 PIN·고객 보호 비밀번호 자릿수 혼동

> 휴대폰 결제 비밀번호는 어디서 설정하고 몇 자리예요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 없음 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC02](hallucination_progression.md#hc02), [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 휴대폰 결제 비밀번호는 어디서 설정하고 → ANSWER; gold FAQ 1478 (gold는 실제 제공 자료와 다를 수 있음)
- #2 몇 자리예요? → ABSTAIN; gold FAQ 1478 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1478, 157, 1477, 1596
- 원본: [results.jsonl:136](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:136](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:130](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 휴대폰 결제 비밀번호는 Ubot 앱의 휴대폰 결제 메뉴에서 설정할 수 있습니다. 그러나 몇 자리인지에 대한 정보는 제공된 FAQ에서 명시되어 있지 않습니다. 결제 비밀번호의 자릿수는 관련 FAQ에서 언급되지 않았고, 회원 가입 비밀번호(8자 이상 20자 이하)나 유심 비밀번호(PIN)(4~6자리)와는 다릅니다. 따라서 결제 비밀번호의 자릿수는 확정할 수 없습니다.

**모델 본문**

> 휴대폰 결제 비밀번호는 Ubot 앱의 휴대폰 결제 메뉴에서 설정할 수 있습니다. 그러나 몇 자리인지에 대한 정보는 제공된 FAQ에서 명시되어 있지 않습니다. 결제 비밀번호의 자릿수는 관련 FAQ에서 언급되지 않았고, 회원 가입 비밀번호(8자 이상 20자 이하)나 유심 비밀번호(PIN)(4~6자리)와는 다릅니다. 따라서 결제 비밀번호의 자릿수는 확정할 수 없습니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 유심 비밀번호(PIN)는 4~6자리이며 결제 비밀번호의 자릿수와 다릅니다.
  - 사유: 4~6자리는 유심 PIN이 아닌 고객 보호 비밀번호의 정보이며, 결제 비밀번호와의 차이도 확인되지 않습니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — Ubot 앱의 휴대폰 결제 메뉴에서 설정한다고 정확히 답했습니다.
- 하위 #2: CORRECT_DECLINE — 자료에 자릿수가 없다며 확정하지 않았습니다.
- Judge 요약: 두 하위 질문에는 적절히 대응했지만, 다른 비밀번호의 자릿수를 유심 PIN에 잘못 적용했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 휴대폰 결제 비밀번호는 어디서 설정하고; FAQ 1478, 157, 1477
- 실제 하위 #2: 몇 자리예요?; FAQ 1478, 1596, 157
- 검색 #1: 휴대폰 결제 비밀번호는 어디서 설정해요?
- 검색 #2: 휴대폰 결제 비밀번호는 몇 자리예요?

**실제로 입력된 FAQ 원문**

- FAQ 1478: 휴대폰 결제 비밀번호를 설정할 수 있나요?
> Ubot 앱의 휴대폰 결제 메뉴에서 결제 비밀번호를 설정할 수 있습니다. 휴대폰 결제 비밀번호를 설정하면 결제할 때마다 비밀번호를 한 번 더 입력해야 합니다.
- FAQ 157: 유심 비밀번호(PIN)를 설정할 수 있나요?
> 유심 비밀번호(PIN)는 휴대폰 설정의 보안 메뉴에서 유심 잠금 기능으로 설정할 수 있습니다. 유심 잠금(PIN)을 설정하면 휴대폰을 켤 때 PIN을 입력해야 합니다.
- FAQ 1477: 고객센터 상담 때 쓰는 고객 보호 비밀번호가 무엇인가요?
> 고객 보호 비밀번호는 다른 사람이 나를 사칭해 고객센터에서 업무를 보지 못하도록 설정하는 숫자 4~6자리 비밀번호입니다. 고객 보호 비밀번호를 앱에서 설정해 두면 고객센터 상담 시 본인 확인에 함께 사용합니다.
- FAQ 1596: 회원 가입할 때 비밀번호 조건이 있나요?
> 회원 가입 비밀번호는 8자 이상 20자 이하로 정하고 비밀번호 확인 칸에 같은 값을 입력해야 합니다. 한글처럼 글자당 용량이 큰 문자는 비밀번호에 입력할 수 있는 글자 수가 더 적을 수 있습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1478, 157, 1477, 1596
- 원본: [results.jsonl:136](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:136](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:127](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 휴대폰 결제 비밀번호는 Ubot 앱의 휴대폰 결제 메뉴에서 설정할 수 있습니다. 몇 자리에 대해서는 FAQ에 명시되어 있지 않으며, 결제 비밀번호의 자릿수는 제공된 자료에서 확인할 수 없습니다.
> 
> 「몇 자리예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 휴대폰 결제 비밀번호는 Ubot 앱의 휴대폰 결제 메뉴에서 설정할 수 있습니다. 몇 자리에 대해서는 FAQ에 명시되어 있지 않으며, 결제 비밀번호의 자릿수는 제공된 자료에서 확인할 수 없습니다.

**코드 고정 안내**

> 「몇 자리예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_ANSWER — Ubot 앱의 휴대폰 결제 메뉴에서 설정한다고 정확히 답했습니다.
- 하위 #2: CORRECT_DECLINE — 자료에 자릿수가 없다고 안내하고 값을 지어내지 않았습니다.
- Judge 요약: 설정 위치는 FAQ와 일치하며, 근거 없는 자릿수 답변은 하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 휴대폰 결제 비밀번호는 어디서 설정하고; FAQ 1478, 157, 1477
- 실제 하위 #2: 몇 자리예요?; FAQ 1478, 1596, 157
- 검색 #1: 휴대폰 결제 비밀번호는 어디서 설정해요?
- 검색 #2: 휴대폰 결제 비밀번호는 몇 자리예요?

**실제로 입력된 FAQ 원문**

- FAQ 1478: 휴대폰 결제 비밀번호를 설정할 수 있나요?
> Ubot 앱의 휴대폰 결제 메뉴에서 결제 비밀번호를 설정할 수 있습니다. 휴대폰 결제 비밀번호를 설정하면 결제할 때마다 비밀번호를 한 번 더 입력해야 합니다.
- FAQ 157: 유심 비밀번호(PIN)를 설정할 수 있나요?
> 유심 비밀번호(PIN)는 휴대폰 설정의 보안 메뉴에서 유심 잠금 기능으로 설정할 수 있습니다. 유심 잠금(PIN)을 설정하면 휴대폰을 켤 때 PIN을 입력해야 합니다.
- FAQ 1477: 고객센터 상담 때 쓰는 고객 보호 비밀번호가 무엇인가요?
> 고객 보호 비밀번호는 다른 사람이 나를 사칭해 고객센터에서 업무를 보지 못하도록 설정하는 숫자 4~6자리 비밀번호입니다. 고객 보호 비밀번호를 앱에서 설정해 두면 고객센터 상담 시 본인 확인에 함께 사용합니다.
- FAQ 1596: 회원 가입할 때 비밀번호 조건이 있나요?
> 회원 가입 비밀번호는 8자 이상 20자 이하로 정하고 비밀번호 확인 칸에 같은 값을 입력해야 합니다. 한글처럼 글자당 용량이 큰 문자는 비밀번호에 입력할 수 있는 글자 수가 더 적을 수 있습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1478, 157, 1477, 1596
- 원본: [results.jsonl:55](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:55](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:54](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 휴대폰 결제 비밀번호는 Ubot 앱의 휴대폰 결제 메뉴에서 설정할 수 있습니다.
> 
> 「몇 자리예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 휴대폰 결제 비밀번호는 Ubot 앱의 휴대폰 결제 메뉴에서 설정할 수 있습니다.

**코드 고정 안내**

> 「몇 자리예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_ANSWER — Ubot 앱의 휴대폰 결제 메뉴에서 설정한다고 정확히 답했습니다.
- 하위 #2: CORRECT_DECLINE — 자료에 없는 비밀번호 자릿수를 지어내지 않았습니다.
- Judge 요약: 모델 답변은 제공된 FAQ에 근거하며, 자릿수는 답하지 않았고 시스템 고정 안내는 모델 본문의 거절 안내로 세지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 휴대폰 결제 비밀번호는 어디서 설정하고; FAQ 1478, 157, 1477
- 실제 하위 #2: 몇 자리예요?; FAQ 1478, 1596, 157
- 검색 #1: 휴대폰 결제 비밀번호는 어디서 설정해요?
- 검색 #2: 휴대폰 결제 비밀번호는 몇 자리예요?
- slot #1: ANSWER; 최종 본문에 남음
> 휴대폰 결제 비밀번호는 Ubot 앱의 휴대폰 결제 메뉴에서 설정할 수 있습니다.
- slot #2: ABSTAIN; 최종 본문에서 제거
> 휴대폰 결제 비밀번호의 자리는 FAQ에 명시되어 있지 않으며, 관련된 정보가 없습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1478: 휴대폰 결제 비밀번호를 설정할 수 있나요?
> Ubot 앱의 휴대폰 결제 메뉴에서 결제 비밀번호를 설정할 수 있습니다. 휴대폰 결제 비밀번호를 설정하면 결제할 때마다 비밀번호를 한 번 더 입력해야 합니다.
- FAQ 157: 유심 비밀번호(PIN)를 설정할 수 있나요?
> 유심 비밀번호(PIN)는 휴대폰 설정의 보안 메뉴에서 유심 잠금 기능으로 설정할 수 있습니다. 유심 잠금(PIN)을 설정하면 휴대폰을 켤 때 PIN을 입력해야 합니다.
- FAQ 1477: 고객센터 상담 때 쓰는 고객 보호 비밀번호가 무엇인가요?
> 고객 보호 비밀번호는 다른 사람이 나를 사칭해 고객센터에서 업무를 보지 못하도록 설정하는 숫자 4~6자리 비밀번호입니다. 고객 보호 비밀번호를 앱에서 설정해 두면 고객센터 상담 시 본인 확인에 함께 사용합니다.
- FAQ 1596: 회원 가입할 때 비밀번호 조건이 있나요?
> 회원 가입 비밀번호는 8자 이상 20자 이하로 정하고 비밀번호 확인 칸에 같은 값을 입력해야 합니다. 한글처럼 글자당 용량이 큰 문자는 비밀번호에 입력할 수 있는 글자 수가 더 적을 수 있습니다.

</details>

<a id="mp-029"></a>
## MP-029 · 워치 개통비 미제공을 무료로 단정

> 워치 요금제 2GB 가격은 얼마고 개통비는 따로 있어요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 환각 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 워치 요금제 2GB 가격은 얼마고 → ANSWER; gold FAQ 1117 (gold는 실제 제공 자료와 다를 수 있음)
- #2 개통비는 따로 있어요? → ABSTAIN; gold FAQ 1117, 1071 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: context_sections_changed
- 입력 차이 v4sub_slot: context_sections_changed

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1117, 1138
- 원본: [results.jsonl:139](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:139](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:132](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 워치 요금제 2GB는 월 11,000원입니다. 개통비는 따로 없으며, 워치 요금제는 데이터를 다 쓰면 차단됩니다. 같은 명의의 Ubot 휴대폰과 연결해야 이용할 수 있습니다.

**모델 본문**

> 워치 요금제 2GB는 월 11,000원입니다. 개통비는 따로 없으며, 워치 요금제는 데이터를 다 쓰면 차단됩니다. 같은 명의의 Ubot 휴대폰과 연결해야 이용할 수 있습니다.

**Judge가 표시한 주장**

- FABRICATION: 개통비는 따로 없습니다.
  - 사유: 제공된 자료에는 개통비 유무가 나와 있지 않습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 2GB 워치 요금제의 월 11,000원 가격을 정확히 답했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 자료에 없는 개통비 면제 여부를 확정해 답했습니다.
- Judge 요약: 요금제 가격과 부가 조건은 근거가 있지만, 개통비가 없다는 주장은 근거가 없습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 워치 요금제 2GB 가격은 얼마고; FAQ 1117
- 실제 하위 #2: 개통비는 따로 있어요?; FAQ 1138, 1117
- 검색 #1: 워치 요금제 2GB 가격은 얼마인가요?
- 검색 #2: 워치 요금제의 개통비는 따로 있어요?

**실제로 입력된 FAQ 원문**

- FAQ 1117: 워치 요금제 종류와 가격이 궁금해요.
> Ubot 워치 요금제는 0.5GB(월 5,500원, 음성 50분·문자 100건), 1GB(8,800원, 음성 100분·문자 250건), 2GB(11,000원, 음성 200분·문자 500건)가 있습니다. Ubot 워치 요금제는 데이터를 다 쓰면 차단되며 같은 명의의 Ubot 휴대폰과 연결해야 이용할 수 있습니다.
- FAQ 1138: 태블릿이나 워치에서 쓸 수 있는 요금제가 있나요?
> 태블릿은 데이터 전용 Ubot 태블릿 요금제(5GB 월 9,900원~50GB 월 29,900원)를 이용할 수 있습니다. 스마트워치는 Ubot 워치 요금제(0.5GB 월 5,500원~2GB 월 11,000원)를 이용할 수 있습니다. Ubot 태블릿 요금제와 워치 요금제는 모두 데이터를 다 쓰면 차단됩니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1117, 1138
- 원본: [results.jsonl:139](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:139](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:130](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 워치 요금제 2GB는 월 11,000원입니다. 개통비는 따로 없습니다.
> 
> 이 정보는 [FAQ ID: 1117]에서 확인할 수 있습니다. 해당 FAQ는 워치 요금제의 종류와 가격을 명시하고 있으며, 2GB 요금제의 가격이 11,000원이라고 명시하고 있습니다. 또한 개통비에 대한 언급은 해당 FAQ에 포함되어 있지 않으며, 다른 FAQ 문서에서도 개통비에 대한 정보가 제공되지 않았습니다. 따라서 개통비가 따로 없다고 판단할 수 있습니다.

**모델 본문**

> 워치 요금제 2GB는 월 11,000원입니다. 개통비는 따로 없습니다.
> 
> 이 정보는 [FAQ ID: 1117]에서 확인할 수 있습니다. 해당 FAQ는 워치 요금제의 종류와 가격을 명시하고 있으며, 2GB 요금제의 가격이 11,000원이라고 명시하고 있습니다. 또한 개통비에 대한 언급은 해당 FAQ에 포함되어 있지 않으며, 다른 FAQ 문서에서도 개통비에 대한 정보가 제공되지 않았습니다. 따라서 개통비가 따로 없다고 판단할 수 있습니다.

**Judge가 표시한 주장**

- FABRICATION: 개통비는 따로 없습니다.
  - 사유: 제공된 FAQ에는 개통비 유무가 명시되어 있지 않습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 2GB 요금제의 월 가격을 11,000원으로 정확히 답했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 자료에 개통비 정보가 없는데도 별도 개통비가 없다고 단정했습니다.
- Judge 요약: 가격 답변은 정확하지만, 개통비 정보가 없다는 사실을 인정하면서도 개통비가 없다고 추론해 답했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 워치 요금제 2GB 가격은 얼마고; FAQ 1117
- 실제 하위 #2: 개통비는 따로 있어요?; FAQ 1138, 1117
- 검색 #1: 워치 요금제 2GB 가격은 얼마인가요?
- 검색 #2: 워치 요금제의 개통비는 따로 있어요?

**실제로 입력된 FAQ 원문**

- FAQ 1117: 워치 요금제 종류와 가격이 궁금해요.
> Ubot 워치 요금제는 0.5GB(월 5,500원, 음성 50분·문자 100건), 1GB(8,800원, 음성 100분·문자 250건), 2GB(11,000원, 음성 200분·문자 500건)가 있습니다. Ubot 워치 요금제는 데이터를 다 쓰면 차단되며 같은 명의의 Ubot 휴대폰과 연결해야 이용할 수 있습니다.
- FAQ 1138: 태블릿이나 워치에서 쓸 수 있는 요금제가 있나요?
> 태블릿은 데이터 전용 Ubot 태블릿 요금제(5GB 월 9,900원~50GB 월 29,900원)를 이용할 수 있습니다. 스마트워치는 Ubot 워치 요금제(0.5GB 월 5,500원~2GB 월 11,000원)를 이용할 수 있습니다. Ubot 태블릿 요금제와 워치 요금제는 모두 데이터를 다 쓰면 차단됩니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1117, 1138
- 원본: [results.jsonl:201](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:201](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:191](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 워치 요금제 2GB는 월 11,000원입니다.
> 
> 개통비는 따로 없습니다.

**모델 본문**

> 워치 요금제 2GB는 월 11,000원입니다.
> 
> 개통비는 따로 없습니다.

**Judge가 표시한 주장**

- FABRICATION: 개통비는 따로 없습니다.
  - 사유: 제공된 자료에는 개통비 여부가 나와 있지 않습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 2GB 요금제의 월 가격 11,000원을 정확히 답했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 자료에 없는 개통비 여부를 없다고 단정했습니다.
- Judge 요약: 요금제 가격은 근거와 일치하지만, 개통비가 없다는 답변은 자료로 뒷받침되지 않습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 워치 요금제 2GB 가격은 얼마고; FAQ 1117
- 실제 하위 #2: 개통비는 따로 있어요?; FAQ 1138, 1117
- 검색 #1: 워치 요금제 2GB 가격은 얼마인가요?
- 검색 #2: 워치 요금제의 개통비는 따로 있어요?
- slot #1: ANSWER; 최종 본문에 남음
> 워치 요금제 2GB는 월 11,000원입니다.
- slot #2: ANSWER; 최종 본문에 남음
> 개통비는 따로 없습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1117: 워치 요금제 종류와 가격이 궁금해요.
> Ubot 워치 요금제는 0.5GB(월 5,500원, 음성 50분·문자 100건), 1GB(8,800원, 음성 100분·문자 250건), 2GB(11,000원, 음성 200분·문자 500건)가 있습니다. Ubot 워치 요금제는 데이터를 다 쓰면 차단되며 같은 명의의 Ubot 휴대폰과 연결해야 이용할 수 있습니다.
- FAQ 1138: 태블릿이나 워치에서 쓸 수 있는 요금제가 있나요?
> 태블릿은 데이터 전용 Ubot 태블릿 요금제(5GB 월 9,900원~50GB 월 29,900원)를 이용할 수 있습니다. 스마트워치는 Ubot 워치 요금제(0.5GB 월 5,500원~2GB 월 11,000원)를 이용할 수 있습니다. Ubot 태블릿 요금제와 워치 요금제는 모두 데이터를 다 쓰면 차단됩니다.

</details>

<a id="mp-031"></a>
## MP-031 · 데이터 플러스와 다른 요금제 가격 혼동

> 데이터 플러스 5GB는 월 얼마고, 자동 갱신 없이 한 달만 살 수 있어요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **없음 → 환각 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC02](hallucination_progression.md#hc02), [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 데이터 플러스 5GB는 월 얼마고 → ANSWER; gold FAQ 1151 (gold는 실제 제공 자료와 다를 수 있음)
- #2 자동 갱신 없이 한 달만 살 수 있어요? → ABSTAIN; gold FAQ 1151 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: context_sections_changed
- 입력 차이 v4sub_slot: context_sections_changed

### v1 single

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1121, 1110
- 원본: [results.jsonl:141](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:141](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:134](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 데이터 플러스 5GB의 월 요금은 FAQ 원문에 명시되어 있지 않으며, 제공된 자료에서 해당 요금제에 대한 정보가 없습니다. 자동 갱신 없이 한 달만 살 수 있는지에 대한 정보도 FAQ 원문에 포함되어 있지 않습니다. 따라서 두 질문 모두 답변할 수 없습니다.

**모델 본문**

> 데이터 플러스 5GB의 월 요금은 FAQ 원문에 명시되어 있지 않으며, 제공된 자료에서 해당 요금제에 대한 정보가 없습니다. 자동 갱신 없이 한 달만 살 수 있는지에 대한 정보도 FAQ 원문에 포함되어 있지 않습니다. 따라서 두 질문 모두 답변할 수 없습니다.

- 하위 #1: MISSING_ANSWER — 정답 기준상 월 9,900원으로 답해야 하지만 요금을 안내하지 않았습니다.
- 하위 #2: CORRECT_DECLINE — 한 달만 구매할 수 있는지는 확인할 자료가 없다며 답하지 않았습니다.
- Judge 요약: 첫 질문의 정답은 빠졌지만, 모델이 받은 자료에 없는 사실을 지어내지는 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 데이터 플러스 5GB는 월 얼마고,; FAQ 1121, 1110
- 실제 하위 #2: 자동 갱신 없이 한 달만 살 수 있어요?; FAQ 없음
- 검색 #1: 데이터 플러스 5GB는 월 얼마인가요?
- 검색 #2: 데이터 플러스 5GB를 자동 갱신 없이 한 달만 살 수 있나요?

**실제로 입력된 FAQ 원문**

- FAQ 1121: 월 5만 원 정도 요금제 중에 데이터를 가장 많이 주는 것은 무엇인가요?
> 월 5만 원 안팎 요금제 중 다이렉트 49는 월 49,000원에 데이터 120GB를 제공하고 소진 후 5Mbps로 이용하는 온라인 전용 상품입니다. 월 5만 원 안팎의 매장 가입 요금제로는 밸런스 49(11GB)와 베이직 50(10GB)이 있습니다. 만 19~34세라면 월 45,000원에 데이터 100GB를 제공하는 청년 100GB 요금제도 이용할 수 있습니다.
- FAQ 1110: Ubot 데이터 요금제 시리즈는 어떤 요금제인가요?
> Ubot 데이터 시리즈는 300MB(월 28,000원)부터 150GB(월 75,000원)까지 데이터 제공량에 따라 고르는 요금제이며 데이터 MAX(월 85,000원)는 무제한입니다. 데이터 시리즈 중 300MB·750MB는 음성 125분·문자 150건을 제공하고 나머지는 음성·문자를 기본 제공합니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1121, 1110
- 원본: [results.jsonl:141](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:141](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:133](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 하위 질문 1: 데이터 플러스 5GB는 월 5만 원 정도의 요금제에 포함되어 있으며, 데이터 120GB를 제공하는 다이렉트 49 요금제(월 49,000원)와 같은 요금제가 있습니다. 그러나 '데이터 플러스 5GB'라는 명칭의 요금제는 제공된 FAQ에서 명시되어 있지 않습니다. 따라서 데이터 플러스 5GB의 월 요금은 확인할 수 없습니다.
> 
> 하위 질문 2: 자동 갱신 없이 한 달만 살 수 있는지에 대한 정보는 제공된 FAQ에서 명시되어 있지 않습니다. 따라서 자동 갱신 없이 한 달만 살 수 있는지 여부는 확인할 수 없습니다.
> 
> 「데이터 플러스 5GB는 월 얼마고」, 「자동 갱신 없이 한 달만 살 수 있어요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 하위 질문 1: 데이터 플러스 5GB는 월 5만 원 정도의 요금제에 포함되어 있으며, 데이터 120GB를 제공하는 다이렉트 49 요금제(월 49,000원)와 같은 요금제가 있습니다. 그러나 '데이터 플러스 5GB'라는 명칭의 요금제는 제공된 FAQ에서 명시되어 있지 않습니다. 따라서 데이터 플러스 5GB의 월 요금은 확인할 수 없습니다.
> 
> 하위 질문 2: 자동 갱신 없이 한 달만 살 수 있는지에 대한 정보는 제공된 FAQ에서 명시되어 있지 않습니다. 따라서 자동 갱신 없이 한 달만 살 수 있는지 여부는 확인할 수 없습니다.

**코드 고정 안내**

> 「데이터 플러스 5GB는 월 얼마고」, 「자동 갱신 없이 한 달만 살 수 있어요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 데이터 플러스 5GB는 월 5만 원 정도의 요금제에 포함되어 있습니다.
  - 사유: 받은 자료에는 데이터 플러스 5GB의 포함 여부가 없으며, 다른 요금제 정보를 이 상품에 적용했습니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)

- 하위 #1: WRONG_ANSWER — 월 9,900원을 답하지 않고 데이터 플러스 5GB를 다른 요금제와 잘못 연결했습니다.
- 하위 #2: CORRECT_DECLINE — 한 달만 구매할 수 있는지 확정하지 않고 확인할 수 없다고 했습니다.
- Judge 요약: 첫째 질문은 가격 대신 근거 없는 요금제 연관성을 제시해 틀렸고, 둘째 질문은 자료에 없는 구매 가능 여부를 단정하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 데이터 플러스 5GB는 월 얼마고,; FAQ 1121, 1110
- 실제 하위 #2: 자동 갱신 없이 한 달만 살 수 있어요?; FAQ 없음
- 검색 #1: 데이터 플러스 5GB는 월 얼마인가요?
- 검색 #2: 데이터 플러스 5GB를 자동 갱신 없이 한 달만 살 수 있나요?

**실제로 입력된 FAQ 원문**

- FAQ 1121: 월 5만 원 정도 요금제 중에 데이터를 가장 많이 주는 것은 무엇인가요?
> 월 5만 원 안팎 요금제 중 다이렉트 49는 월 49,000원에 데이터 120GB를 제공하고 소진 후 5Mbps로 이용하는 온라인 전용 상품입니다. 월 5만 원 안팎의 매장 가입 요금제로는 밸런스 49(11GB)와 베이직 50(10GB)이 있습니다. 만 19~34세라면 월 45,000원에 데이터 100GB를 제공하는 청년 100GB 요금제도 이용할 수 있습니다.
- FAQ 1110: Ubot 데이터 요금제 시리즈는 어떤 요금제인가요?
> Ubot 데이터 시리즈는 300MB(월 28,000원)부터 150GB(월 75,000원)까지 데이터 제공량에 따라 고르는 요금제이며 데이터 MAX(월 85,000원)는 무제한입니다. 데이터 시리즈 중 300MB·750MB는 음성 125분·문자 150건을 제공하고 나머지는 음성·문자를 기본 제공합니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1121, 1110
- 원본: [results.jsonl:202](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:202](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:192](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 「데이터 플러스 5GB는 월 얼마고」, 「자동 갱신 없이 한 달만 살 수 있어요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 「데이터 플러스 5GB는 월 얼마고」, 「자동 갱신 없이 한 달만 살 수 있어요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: MISSING_ANSWER — 월 9,900원이라는 가격을 답하지 않았습니다.
- 하위 #2: CORRECT_DECLINE — 자동 갱신 없는 한 달 구매 가능 여부를 지어내지 않고 답하지 않았습니다.
- Judge 요약: 모델 본문은 비어 있어 첫 질문의 정답은 누락됐고, 둘째 질문에는 근거 없는 답을 하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 데이터 플러스 5GB는 월 얼마고,; FAQ 1121, 1110
- 실제 하위 #2: 자동 갱신 없이 한 달만 살 수 있어요?; FAQ 없음
- 검색 #1: 데이터 플러스 5GB는 월 얼마인가요?
- 검색 #2: 데이터 플러스 5GB를 자동 갱신 없이 한 달만 살 수 있나요?
- slot #1: ABSTAIN; 최종 본문에서 제거
> 데이터 플러스 5GB 요금제에 대한 정보는 제공된 FAQ에서 명시되어 있지 않습니다. 월 5만 원 정도의 요금제 중 데이터를 가장 많이 제공하는 것은 다이렉트 49(120GB, 월 49,000원)이며, 이는 데이터 플러스 5GB와는 다릅니다.
- slot #2: ABSTAIN; 최종 본문에서 제거
> 자동 갱신 없이 한 달만 살 수 있는 여부에 대한 정보는 제공된 FAQ에서 명시되어 있지 않습니다. 따라서 해당 내용을 확정할 수 없습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1121: 월 5만 원 정도 요금제 중에 데이터를 가장 많이 주는 것은 무엇인가요?
> 월 5만 원 안팎 요금제 중 다이렉트 49는 월 49,000원에 데이터 120GB를 제공하고 소진 후 5Mbps로 이용하는 온라인 전용 상품입니다. 월 5만 원 안팎의 매장 가입 요금제로는 밸런스 49(11GB)와 베이직 50(10GB)이 있습니다. 만 19~34세라면 월 45,000원에 데이터 100GB를 제공하는 청년 100GB 요금제도 이용할 수 있습니다.
- FAQ 1110: Ubot 데이터 요금제 시리즈는 어떤 요금제인가요?
> Ubot 데이터 시리즈는 300MB(월 28,000원)부터 150GB(월 75,000원)까지 데이터 제공량에 따라 고르는 요금제이며 데이터 MAX(월 85,000원)는 무제한입니다. 데이터 시리즈 중 300MB·750MB는 음성 125분·문자 150건을 제공하고 나머지는 음성·문자를 기본 제공합니다.

</details>

<a id="mp-033"></a>
## MP-033 · 보험 보상 지급 기간 1~2주·3일 생성

> 분실 보험은 분실일로부터 며칠 안에 접수해야 하고, 보상은 신청하고 며칠 만에 나와요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 환각 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 분실 보험은 분실일로부터 며칠 안에 접수해야 하고 → ANSWER; gold FAQ 1457 (gold는 실제 제공 자료와 다를 수 있음)
- #2 보상은 신청하고 며칠 만에 나와요? → ABSTAIN; gold FAQ 1405, 1457 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1457
- 원본: [results.jsonl:143](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:143](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:136](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 분실 보험은 분실일로부터 60일 안에 접수해야 합니다. 보상은 신청 후 1~2주 내에 나옵니다. 다만, 보상 지급 기간에 대한 구체적인 기준은 FAQ에 명시되어 있지 않아 정확한 일수는 확인이 어렵습니다.

**모델 본문**

> 분실 보험은 분실일로부터 60일 안에 접수해야 합니다. 보상은 신청 후 1~2주 내에 나옵니다. 다만, 보상 지급 기간에 대한 구체적인 기준은 FAQ에 명시되어 있지 않아 정확한 일수는 확인이 어렵습니다.

**Judge가 표시한 주장**

- FABRICATION: 보상은 신청 후 1~2주 내에 나옵니다.
  - 사유: 챗봇이 받은 FAQ에는 보상 지급 기간이 없습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 분실일로부터 60일 안에 접수해야 한다고 정확히 답했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 자료에 없는 보상 지급 기간을 1~2주로 단정했습니다.
- Judge 요약: 접수 기한은 맞지만 보상 지급 기간을 지어냈으며, 확인이 어렵다는 후속 안내도 그 단정을 취소하지는 않습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 분실 보험은 분실일로부터 며칠 안에 접수해야 하고,; FAQ 1457
- 실제 하위 #2: 보상은 신청하고 며칠 만에 나와요?; FAQ 1457
- 검색 #1: 분실 보험은 분실일로부터 며칠 안에 접수해야 해요?
- 검색 #2: 분실 보험의 보상은 신청하고 며칠 만에 나와요?

**실제로 입력된 FAQ 원문**

- FAQ 1457: 휴대폰 보험으로 분실 보상을 받으려면 어떻게 하나요?
> 휴대폰 분실 신고 후 보험사 고객센터나 Ubot 앱의 보험 메뉴에서 분실 보상을 접수해 주세요. 휴대폰 분실 보험은 분실일로부터 60일 안에 접수해야 하며 경찰 분실·도난 신고 접수증과 자기부담금이 필요합니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1457
- 원본: [results.jsonl:143](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:143](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:132](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 분실 보험은 분실일로부터 60일 안에 접수해야 합니다. 보상은 신청 후 3일 내에 나옵니다.

**모델 본문**

> 분실 보험은 분실일로부터 60일 안에 접수해야 합니다. 보상은 신청 후 3일 내에 나옵니다.

**Judge가 표시한 주장**

- FABRICATION: 보상은 신청 후 3일 내에 나옵니다.
  - 사유: 제공된 FAQ에는 보상까지 걸리는 기간이 없습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 분실일로부터 60일 안에 접수해야 한다고 정확히 답했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 자료에 없는 보상 소요 기간을 3일로 단정했습니다.
- Judge 요약: 접수 기한은 근거와 일치하지만, 보상 소요 기간은 근거 없이 지어냈습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 분실 보험은 분실일로부터 며칠 안에 접수해야 하고,; FAQ 1457
- 실제 하위 #2: 보상은 신청하고 며칠 만에 나와요?; FAQ 1457
- 검색 #1: 분실 보험은 분실일로부터 며칠 안에 접수해야 해요?
- 검색 #2: 분실 보험의 보상은 신청하고 며칠 만에 나와요?

**실제로 입력된 FAQ 원문**

- FAQ 1457: 휴대폰 보험으로 분실 보상을 받으려면 어떻게 하나요?
> 휴대폰 분실 신고 후 보험사 고객센터나 Ubot 앱의 보험 메뉴에서 분실 보상을 접수해 주세요. 휴대폰 분실 보험은 분실일로부터 60일 안에 접수해야 하며 경찰 분실·도난 신고 접수증과 자기부담금이 필요합니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1457
- 원본: [results.jsonl:204](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:204](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:193](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 분실일로부터 60일 안에 접수해야 합니다.
> 
> 「보상은 신청하고 며칠 만에 나와요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 분실일로부터 60일 안에 접수해야 합니다.

**코드 고정 안내**

> 「보상은 신청하고 며칠 만에 나와요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_ANSWER — 분실일로부터 60일 안에 접수해야 한다고 정확히 답했습니다.
- 하위 #2: CORRECT_DECLINE — 모델이 보상 소요 기간을 지어내지 않았고, 시스템 고정 안내가 확인 불가를 알렸습니다.
- Judge 요약: 모델 답변은 제공된 FAQ에 근거하며, 검색어도 두 질문의 의미를 그대로 담았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 분실 보험은 분실일로부터 며칠 안에 접수해야 하고,; FAQ 1457
- 실제 하위 #2: 보상은 신청하고 며칠 만에 나와요?; FAQ 1457
- 검색 #1: 분실 보험은 분실일로부터 며칠 안에 접수해야 해요?
- 검색 #2: 분실 보험의 보상은 신청하고 며칠 만에 나와요?
- slot #1: ANSWER; 최종 본문에 남음
> 분실일로부터 60일 안에 접수해야 합니다.
- slot #2: ABSTAIN; 최종 본문에서 제거
> 보상은 접수 후 7일 내에 보상이 나옵니다.

**실제로 입력된 FAQ 원문**

- FAQ 1457: 휴대폰 보험으로 분실 보상을 받으려면 어떻게 하나요?
> 휴대폰 분실 신고 후 보험사 고객센터나 Ubot 앱의 보험 메뉴에서 분실 보상을 접수해 주세요. 휴대폰 분실 보험은 분실일로부터 60일 안에 접수해야 하며 경찰 분실·도난 신고 접수증과 자기부담금이 필요합니다.

</details>

<a id="mp-035"></a>
## MP-035 · IPTV 리모컨 교체 무료 정책 생성

> IPTV 리모컨이 안 되면 뭘 확인하고, 교체는 유료예요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **없음 → 환각 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 IPTV 리모컨이 안 되면 뭘 확인하고 → ANSWER; gold FAQ 1676 (gold는 실제 제공 자료와 다를 수 있음)
- #2 교체는 유료예요? → ABSTAIN; gold FAQ 1676 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1676, 1673
- 원본: [results.jsonl:145](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:145](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:135](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> IPTV 리모컨이 안 되면 먼저 배터리와 극성, 버튼 눌림 상태를 확인하고, 블루투스 리모컨인 경우 셋톱박스와 다시 연결해야 할 수 있습니다. 문제가 계속되면 교체 또는 점검을 문의할 수 있습니다. 교체 비용에 대한 정보는 제공된 FAQ에 없습니다. 따라서 교체가 유료인지 여부는 확인할 수 없습니다.

**모델 본문**

> IPTV 리모컨이 안 되면 먼저 배터리와 극성, 버튼 눌림 상태를 확인하고, 블루투스 리모컨인 경우 셋톱박스와 다시 연결해야 할 수 있습니다. 문제가 계속되면 교체 또는 점검을 문의할 수 있습니다. 교체 비용에 대한 정보는 제공된 FAQ에 없습니다. 따라서 교체가 유료인지 여부는 확인할 수 없습니다.

- 하위 #1: CORRECT_ANSWER — 배터리·극성·버튼 상태와 블루투스 리모컨 재연결, 지속 시 교체·점검 문의를 안내했습니다.
- 하위 #2: CORRECT_DECLINE — 자료에 교체 비용 정보가 없다며 유료 여부를 확정하지 않았습니다.
- Judge 요약: 답변은 받은 FAQ에 근거하며 두 질문의 핵심을 각각 답변하고 판단을 유보했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: IPTV 리모컨이 안 되면 뭘 확인하고,; FAQ 1676, 1673
- 실제 하위 #2: 교체는 유료예요?; FAQ 없음
- 검색 #1: IPTV 리모컨이 안 되면 뭘 확인해야 해요?
- 검색 #2: IPTV 리모컨 교체는 유료예요?

**실제로 입력된 FAQ 원문**

- FAQ 1676: IPTV 리모컨이 작동하지 않아요.
> IPTV 리모컨이 작동하지 않으면 배터리와 극성, 버튼 눌림 상태를 확인하세요. 블루투스 IPTV 리모컨은 셋톱박스와 다시 연결해야 할 수 있으므로 모델별 페어링 안내를 따라 주세요. IPTV 리모컨 문제가 계속되면 교체·점검을 문의하세요.
- FAQ 1673: IPTV에서 신호 없음 화면이 나오면 어떻게 하나요?
> IPTV에서 신호 없음 화면이 나오면 TV 외부 입력이 셋톱박스가 연결된 HDMI로 선택됐는지 확인하세요. IPTV 신호가 없으면 셋톱박스 전원과 HDMI 케이블 연결도 점검해 주세요. 신호 없음 문제가 계속되면 다른 케이블이나 단자로 비교한 뒤 고객센터에 문의하세요.

</details>

### v1 sub

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1676, 1673
- 원본: [results.jsonl:145](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:145](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:134](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> IPTV 리모컨이 안 되면 배터리와 극성, 버튼 눌림 상태를 확인하세요. 블루투스 IPTV 리모컨은 셋톱박스와 다시 연결해야 할 수 있으므로 모델별 페어링 안내를 따라 주세요. 문제 that 계속되면 교체·점검을 문의하세요. 교체는 유료가 아니며, 정책상 무료로 제공됩니다. 다만, 교체가 필요할 경우 고객센터에 문의하여 상담받아야 합니다.
> 
> 「교체는 유료예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> IPTV 리모컨이 안 되면 배터리와 극성, 버튼 눌림 상태를 확인하세요. 블루투스 IPTV 리모컨은 셋톱박스와 다시 연결해야 할 수 있으므로 모델별 페어링 안내를 따라 주세요. 문제 that 계속되면 교체·점검을 문의하세요. 교체는 유료가 아니며, 정책상 무료로 제공됩니다. 다만, 교체가 필요할 경우 고객센터에 문의하여 상담받아야 합니다.

**코드 고정 안내**

> 「교체는 유료예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**Judge가 표시한 주장**

- FABRICATION: 교체는 유료가 아니며, 정책상 무료로 제공됩니다.
  - 사유: 제공된 FAQ에는 리모컨 교체 비용이나 무료 제공 정책이 없습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 배터리·극성·버튼 상태와 블루투스 리모컨 재연결 방법을 안내했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 자료에 없는 무료 교체 정책을 확정해 답했습니다.
- Judge 요약: 점검 안내는 FAQ와 일치하지만, 교체 비용은 근거 없이 무료라고 단정했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: IPTV 리모컨이 안 되면 뭘 확인하고,; FAQ 1676, 1673
- 실제 하위 #2: 교체는 유료예요?; FAQ 없음
- 검색 #1: IPTV 리모컨이 안 되면 뭘 확인해야 해요?
- 검색 #2: IPTV 리모컨 교체는 유료예요?

**실제로 입력된 FAQ 원문**

- FAQ 1676: IPTV 리모컨이 작동하지 않아요.
> IPTV 리모컨이 작동하지 않으면 배터리와 극성, 버튼 눌림 상태를 확인하세요. 블루투스 IPTV 리모컨은 셋톱박스와 다시 연결해야 할 수 있으므로 모델별 페어링 안내를 따라 주세요. IPTV 리모컨 문제가 계속되면 교체·점검을 문의하세요.
- FAQ 1673: IPTV에서 신호 없음 화면이 나오면 어떻게 하나요?
> IPTV에서 신호 없음 화면이 나오면 TV 외부 입력이 셋톱박스가 연결된 HDMI로 선택됐는지 확인하세요. IPTV 신호가 없으면 셋톱박스 전원과 HDMI 케이블 연결도 점검해 주세요. 신호 없음 문제가 계속되면 다른 케이블이나 단자로 비교한 뒤 고객센터에 문의하세요.

</details>

### v4 slot

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1676, 1673
- 원본: [results.jsonl:59](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:59](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:59](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> IPTV 리모컨이 작동하지 않으면 배터리와 극성, 버튼 눌림 상태를 확인하세요. 블루투스 IPTV 리모컨은 셋톱박스와 다시 연결해야 할 수 있으므로 모델별 페어링 안내를 따라 주세요. IPTV 리모컨 문제가 계속되면 교체·점검을 문의하세요.
> 
> 「교체는 유료예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> IPTV 리모컨이 작동하지 않으면 배터리와 극성, 버튼 눌림 상태를 확인하세요. 블루투스 IPTV 리모컨은 셋톱박스와 다시 연결해야 할 수 있으므로 모델별 페어링 안내를 따라 주세요. IPTV 리모컨 문제가 계속되면 교체·점검을 문의하세요.

**코드 고정 안내**

> 「교체는 유료예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_ANSWER — 배터리·극성·버튼 상태와 블루투스 재연결 등 필요한 점검을 안내했습니다.
- 하위 #2: CORRECT_DECLINE — 모델은 교체 비용을 지어내지 않았고, 시스템 고정 안내가 확인 불가를 알렸습니다.
- Judge 요약: 모델 답변은 제공된 FAQ와 일치하며, 검색어도 원래 질문의 두 부분을 그대로 담았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: IPTV 리모컨이 안 되면 뭘 확인하고,; FAQ 1676, 1673
- 실제 하위 #2: 교체는 유료예요?; FAQ 없음
- 검색 #1: IPTV 리모컨이 안 되면 뭘 확인해야 해요?
- 검색 #2: IPTV 리모컨 교체는 유료예요?
- slot #1: ANSWER; 최종 본문에 남음
> IPTV 리모컨이 작동하지 않으면 배터리와 극성, 버튼 눌림 상태를 확인하세요. 블루투스 IPTV 리모컨은 셋톱박스와 다시 연결해야 할 수 있으므로 모델별 페어링 안내를 따라 주세요. IPTV 리모컨 문제가 계속되면 교체·점검을 문의하세요.
- slot #2: ABSTAIN; 최종 본문에서 제거
> 교체는 유료가 아닙니다. 교체 여부는 고객센터에 문의하여 확인할 수 있습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1676: IPTV 리모컨이 작동하지 않아요.
> IPTV 리모컨이 작동하지 않으면 배터리와 극성, 버튼 눌림 상태를 확인하세요. 블루투스 IPTV 리모컨은 셋톱박스와 다시 연결해야 할 수 있으므로 모델별 페어링 안내를 따라 주세요. IPTV 리모컨 문제가 계속되면 교체·점검을 문의하세요.
- FAQ 1673: IPTV에서 신호 없음 화면이 나오면 어떻게 하나요?
> IPTV에서 신호 없음 화면이 나오면 TV 외부 입력이 셋톱박스가 연결된 HDMI로 선택됐는지 확인하세요. IPTV 신호가 없으면 셋톱박스 전원과 HDMI 케이블 연결도 점검해 주세요. 신호 없음 문제가 계속되면 다른 케이블이나 단자로 비교한 뒤 고객센터에 문의하세요.

</details>

<a id="mp-036"></a>
## MP-036 · 번호이동 할인반환금과 번호 변경 수수료

> 번호 변경은 어디서 신청하고 수수료가 있어요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 환각 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC02](hallucination_progression.md#hc02), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 번호 변경은 어디서 신청하고 → ANSWER; gold FAQ 4 (gold는 실제 제공 자료와 다를 수 있음)
- #2 수수료가 있어요? → ABSTAIN; gold FAQ 4 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=2; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 4, 1077, 81, 222, 1085, 1092
- 원본: [results.jsonl:146](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:146](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:137](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 번호 변경은 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있습니다. 수수료는 약정 기간 중 번호이동 시 남은 기간에 해당하는 할인반환금이 청구되며, 단말 할부가 남아 있다면 할부금은 계속 청구됩니다. 다만, 구체적인 수수료 금액은 앱에서 조회해야 합니다.

**모델 본문**

> 번호 변경은 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있습니다. 수수료는 약정 기간 중 번호이동 시 남은 기간에 해당하는 할인반환금이 청구되며, 단말 할부가 남아 있다면 할부금은 계속 청구됩니다. 다만, 구체적인 수수료 금액은 앱에서 조회해야 합니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 번호 변경 수수료로 약정 중 번호이동의 할인반환금과 잔여 단말 할부금이 청구된다.
  - 사유: 번호이동에 관한 FAQ 내용을 번호 변경 수수료 질문에 적용했습니다.
- MISATTRIBUTION: 구체적인 번호 변경 수수료 금액은 앱에서 조회해야 한다.
  - 사유: 앱 조회 안내는 번호이동 시 할인반환금 예상액에 관한 내용입니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있다고 정확히 답했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 번호 변경 수수료 자료가 없는데 번호이동의 청구 내용을 수수료 답변으로 제시했습니다.
- Judge 요약: 신청 경로는 정확하지만 자료에 없는 번호 변경 수수료를 번호이동 청구 내용으로 잘못 답했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 번호 변경은 어디서 신청하고; FAQ 4, 1077, 81
- 실제 하위 #2: 수수료가 있어요?; FAQ 222, 1085, 1092
- 검색 #1: 번호 변경은 어디서 신청해요?
- 검색 #2: 번호 변경에 수수료가 있어요?

**실제로 입력된 FAQ 원문**

- FAQ 4: 휴대폰 번호를 변경하려면 어떻게 하나요?
> 휴대폰 번호 변경은 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있습니다.
- FAQ 1077: 번호이동은 언제 신청할 수 있나요?
> 번호이동 개통은 평일과 토요일 오전 10시부터 오후 7시 50분까지 처리됩니다. 번호이동을 일요일이나 공휴일에 신청하면 다음 처리일에 개통됩니다.
- FAQ 81: 명의 변경이 가능한가요?
> 허용되는 조건에서 본인 확인 및 필요한 서류를 제출하면 명의 변경을 신청할 수 있습니다.
- FAQ 222: 약정 중에 번호이동을 하면 무엇이 청구되나요?
> 약정 기간 중 번호이동을 하면 남은 기간에 해당하는 할인반환금이 청구되며 예상 금액은 앱에서 조회할 수 있습니다. 약정 중 번호이동을 하더라도 단말 할부가 남아 있다면 할부금은 계속 청구됩니다.
- FAQ 1085: 번호이동했는데 이전 통신사에서 요금이 또 청구됐어요.
> 국제전화, 로밍, 수신자 부담 전화처럼 정산이 늦은 요금은 번호이동 후 1~2개월 뒤에도 이전 통신사에서 청구될 수 있습니다. 번호이동 후 뒤늦게 청구된 이전 통신사 요금에는 연체 가산금이 붙지 않습니다.
- FAQ 1092: 번호를 변경해도 가입한 부가서비스는 유지되나요?
> 휴대폰 번호나 기기를 변경해도 가입한 부가서비스는 그대로 유지됩니다. 번호 변경 후 새 기기에서 지원하지 않는 부가서비스는 자동 해지될 수 있습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 4, 1077, 81, 222, 1085, 1092
- 원본: [results.jsonl:146](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:146](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:135](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 번호 변경은 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있습니다. 수수료는 약정 기간 중 번호이동을 하면 남은 기간에 해당하는 할인반환금이 청구되며, 단말 할부가 남아 있다면 할부금은 계속 청구됩니다.

**모델 본문**

> 번호 변경은 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있습니다. 수수료는 약정 기간 중 번호이동을 하면 남은 기간에 해당하는 할인반환금이 청구되며, 단말 할부가 남아 있다면 할부금은 계속 청구됩니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 번호 변경 수수료로 약정 중 번호이동의 할인반환금과 남은 단말 할부금을 안내함
  - 사유: FAQ 222는 번호 변경이 아닌 번호이동에 관한 내용입니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있다고 정확히 답했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 번호 변경 수수료 자료가 없는데 번호이동 시 청구되는 금액으로 답했습니다.
- Judge 요약: 신청 경로는 맞지만 수수료 질문에는 다른 절차의 청구 내용을 잘못 적용했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 번호 변경은 어디서 신청하고; FAQ 4, 1077, 81
- 실제 하위 #2: 수수료가 있어요?; FAQ 222, 1085, 1092
- 검색 #1: 번호 변경은 어디서 신청해요?
- 검색 #2: 번호 변경에 수수료가 있어요?

**실제로 입력된 FAQ 원문**

- FAQ 4: 휴대폰 번호를 변경하려면 어떻게 하나요?
> 휴대폰 번호 변경은 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있습니다.
- FAQ 1077: 번호이동은 언제 신청할 수 있나요?
> 번호이동 개통은 평일과 토요일 오전 10시부터 오후 7시 50분까지 처리됩니다. 번호이동을 일요일이나 공휴일에 신청하면 다음 처리일에 개통됩니다.
- FAQ 81: 명의 변경이 가능한가요?
> 허용되는 조건에서 본인 확인 및 필요한 서류를 제출하면 명의 변경을 신청할 수 있습니다.
- FAQ 222: 약정 중에 번호이동을 하면 무엇이 청구되나요?
> 약정 기간 중 번호이동을 하면 남은 기간에 해당하는 할인반환금이 청구되며 예상 금액은 앱에서 조회할 수 있습니다. 약정 중 번호이동을 하더라도 단말 할부가 남아 있다면 할부금은 계속 청구됩니다.
- FAQ 1085: 번호이동했는데 이전 통신사에서 요금이 또 청구됐어요.
> 국제전화, 로밍, 수신자 부담 전화처럼 정산이 늦은 요금은 번호이동 후 1~2개월 뒤에도 이전 통신사에서 청구될 수 있습니다. 번호이동 후 뒤늦게 청구된 이전 통신사 요금에는 연체 가산금이 붙지 않습니다.
- FAQ 1092: 번호를 변경해도 가입한 부가서비스는 유지되나요?
> 휴대폰 번호나 기기를 변경해도 가입한 부가서비스는 그대로 유지됩니다. 번호 변경 후 새 기기에서 지원하지 않는 부가서비스는 자동 해지될 수 있습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 4, 1077, 81, 222, 1085, 1092
- 원본: [results.jsonl:206](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:206](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:194](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 번호 변경은 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있습니다.
> 
> 약정 기간 중 번호이동을 하면 남은 기간에 해당하는 할인반환금이 청구되며, 단말 할부가 남아 있다면 할부금은 계속 청구됩니다. 따라서 수수료가 있습니다.

**모델 본문**

> 번호 변경은 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있습니다.
> 
> 약정 기간 중 번호이동을 하면 남은 기간에 해당하는 할인반환금이 청구되며, 단말 할부가 남아 있다면 할부금은 계속 청구됩니다. 따라서 수수료가 있습니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 번호 변경에는 수수료가 있습니다.
  - 사유: 번호이동 시 할인반환금·단말 할부금 안내를 번호 변경 수수료에 잘못 적용했습니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있다고 정확히 답했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 번호이동 때의 청구 내용을 번호 변경 수수료에 적용해 수수료가 있다고 단정했습니다.
- Judge 요약: 신청 경로는 FAQ와 일치하지만, 자료에 없는 번호 변경 수수료를 번호이동 청구 내용으로 추론해 답했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 번호 변경은 어디서 신청하고; FAQ 4, 1077, 81
- 실제 하위 #2: 수수료가 있어요?; FAQ 222, 1085, 1092
- 검색 #1: 번호 변경은 어디서 신청해요?
- 검색 #2: 번호 변경에 수수료가 있어요?
- slot #1: ANSWER; 최종 본문에 남음
> 번호 변경은 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있습니다.
- slot #2: ANSWER; 최종 본문에 남음
> 약정 기간 중 번호이동을 하면 남은 기간에 해당하는 할인반환금이 청구되며, 단말 할부가 남아 있다면 할부금은 계속 청구됩니다. 따라서 수수료가 있습니다.

**실제로 입력된 FAQ 원문**

- FAQ 4: 휴대폰 번호를 변경하려면 어떻게 하나요?
> 휴대폰 번호 변경은 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있습니다.
- FAQ 1077: 번호이동은 언제 신청할 수 있나요?
> 번호이동 개통은 평일과 토요일 오전 10시부터 오후 7시 50분까지 처리됩니다. 번호이동을 일요일이나 공휴일에 신청하면 다음 처리일에 개통됩니다.
- FAQ 81: 명의 변경이 가능한가요?
> 허용되는 조건에서 본인 확인 및 필요한 서류를 제출하면 명의 변경을 신청할 수 있습니다.
- FAQ 222: 약정 중에 번호이동을 하면 무엇이 청구되나요?
> 약정 기간 중 번호이동을 하면 남은 기간에 해당하는 할인반환금이 청구되며 예상 금액은 앱에서 조회할 수 있습니다. 약정 중 번호이동을 하더라도 단말 할부가 남아 있다면 할부금은 계속 청구됩니다.
- FAQ 1085: 번호이동했는데 이전 통신사에서 요금이 또 청구됐어요.
> 국제전화, 로밍, 수신자 부담 전화처럼 정산이 늦은 요금은 번호이동 후 1~2개월 뒤에도 이전 통신사에서 청구될 수 있습니다. 번호이동 후 뒤늦게 청구된 이전 통신사 요금에는 연체 가산금이 붙지 않습니다.
- FAQ 1092: 번호를 변경해도 가입한 부가서비스는 유지되나요?
> 휴대폰 번호나 기기를 변경해도 가입한 부가서비스는 그대로 유지됩니다. 번호 변경 후 새 기기에서 지원하지 않는 부가서비스는 자동 해지될 수 있습니다.

</details>

<a id="mp-037"></a>
## MP-037 · 개명과 다른 사람에게 명의 이전 절차

> 개명하면 이름 변경에 뭐가 필요하고 처리는 며칠 걸려요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **없음 → 환각 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC02](hallucination_progression.md#hc02), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 개명하면 이름 변경에 뭐가 필요하고 → ANSWER; gold FAQ 1472 (gold는 실제 제공 자료와 다를 수 있음)
- #2 처리는 며칠 걸려요? → ABSTAIN; gold FAQ 1472 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: sub_question_input_changed, search_queries_changed
- 입력 차이 sub_slot: sub_question_input_changed, search_queries_changed
- 입력 차이 v4sub_slot: search_queries_changed

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1472, 1094, 81
- 원본: [results.jsonl:147](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:147](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:141](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 개명한 경우 이름 변경을 위해서는 개명 사실이 기재된 기본증명서와 신분증을 가지고 매장을 방문하거나 고객센터에 서류를 보내야 합니다. 명의 변경을 하려면 기존 명의자와 새 명의자가 신분증을 가지고 함께 방문해야 하며, 한 사람만 방문할 경우 오지 않는 사람의 인감증명서와 위임장이 추가로 필요합니다. 그러나 처리 기간에 대한 정보는 제공된 FAQ에서 없습니다.

**모델 본문**

> 개명한 경우 이름 변경을 위해서는 개명 사실이 기재된 기본증명서와 신분증을 가지고 매장을 방문하거나 고객센터에 서류를 보내야 합니다. 명의 변경을 하려면 기존 명의자와 새 명의자가 신분증을 가지고 함께 방문해야 하며, 한 사람만 방문할 경우 오지 않는 사람의 인감증명서와 위임장이 추가로 필요합니다. 그러나 처리 기간에 대한 정보는 제공된 FAQ에서 없습니다.

- 하위 #1: WRONG_ANSWER — 필요한 신분증이 개명 후 발급받은 것이라는 핵심 조건을 빠뜨렸고, 별개인 명의 변경 절차를 덧붙였습니다.
- 하위 #2: CORRECT_DECLINE — 자료에 처리 기간이 없다고 밝히고 며칠인지 지어내지 않았습니다.
- Judge 요약: 처리 기간은 적절히 답하지 않았지만, 이름 변경에 필요한 신분증의 발급 시점이라는 핵심 조건이 누락되었습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 개명하면 이름 변경에 뭐가 필요하고; FAQ 1472, 1094, 81
- 실제 하위 #2: 처리는 며칠 걸려요?; FAQ 없음
- 검색 #1: 개명하면 이름 변경에 뭐가 필요하고요?
- 검색 #2: 개명하면 처리는 며칠 걸려요?

**실제로 입력된 FAQ 원문**

- FAQ 1472: 개명했는데 이름은 어떻게 바꾸나요?
> 개명 후 발급받은 신분증과 개명 사실이 기재된 기본증명서를 가지고 매장을 방문하거나 고객센터에 서류를 보내면 가입자 이름을 바꿀 수 있습니다. 가입자 이름이 변경되기 전에는 새 이름으로 본인인증이 되지 않을 수 있습니다.
- FAQ 1094: 명의 변경을 하려면 무엇이 필요한가요?
> 명의 변경을 하려면 기존 명의자와 새 명의자가 신분증을 가지고 함께 매장에 방문해야 합니다. 가족 간 명의 변경에는 발급 3개월 이내의 가족관계증명서도 준비해 주세요. 명의 변경에 한 사람만 방문한다면 오지 않는 사람의 인감증명서와 위임장이 추가로 필요합니다.
- FAQ 81: 명의 변경이 가능한가요?
> 허용되는 조건에서 본인 확인 및 필요한 서류를 제출하면 명의 변경을 신청할 수 있습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=2; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1472, 1094, 81
- 원본: [results.jsonl:147](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:147](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:136](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 개명하면 이름 변경에 필요한 것은 개명 사실이 기재된 기본증명서와 신분증이며, 기존 명의자와 새 명의자가 함께 매장을 방문해야 합니다. 한 사람만 방문할 경우 오지 않는 사람의 인감증명서와 위임장이 추가로 필요합니다. 처리 시간에 대해서는 FAQ에 명시된 정보가 없어 정확한 일수는 확인할 수 없습니다.
> 
> 처리는 며칠 걸려요?에 대한 답변은 제공된 FAQ에서 처리 기간에 관한 정보가 없습니다. 따라서 처리 시간은 확정할 수 없습니다.
> 
> 「처리는 며칠 걸려요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 개명하면 이름 변경에 필요한 것은 개명 사실이 기재된 기본증명서와 신분증이며, 기존 명의자와 새 명의자가 함께 매장을 방문해야 합니다. 한 사람만 방문할 경우 오지 않는 사람의 인감증명서와 위임장이 추가로 필요합니다. 처리 시간에 대해서는 FAQ에 명시된 정보가 없어 정확한 일수는 확인할 수 없습니다.
> 
> 처리는 며칠 걸려요?에 대한 답변은 제공된 FAQ에서 처리 기간에 관한 정보가 없습니다. 따라서 처리 시간은 확정할 수 없습니다.

**코드 고정 안내**

> 「처리는 며칠 걸려요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 개명 시 기존 명의자와 새 명의자가 함께 매장을 방문해야 합니다.
  - 사유: 명의 변경 FAQ의 조건을 개명 후 가입자 이름 변경에 적용했습니다.
- MISATTRIBUTION: 한 사람만 방문하면 오지 않는 사람의 인감증명서와 위임장이 필요합니다.
  - 사유: 명의 변경 FAQ의 추가 서류 조건을 개명 절차에 적용했습니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC05](hallucination_progression.md#hc05)

- 하위 #1: WRONG_ANSWER — 필요 서류는 맞지만, 개명에 명의 변경 절차를 잘못 적용하고 고객센터 서류 제출 방법을 빠뜨렸습니다.
- 하위 #2: CORRECT_DECLINE — 자료에 처리 기간이 없다고 밝히고 일수를 지어내지 않았습니다.
- Judge 요약: 처리 기간은 적절히 답변을 보류했지만, 개명 절차에 별개의 명의 변경 조건을 섞어 첫 질문을 잘못 답했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 개명하면 이름 변경에 뭐가 필요하고; FAQ 1472, 1094, 81
- 실제 하위 #2: 처리는 며칠 걸려요?; FAQ 1472, 1094, 81
- 검색 #1: 개명하면 이름 변경에 뭐가 필요하고요?
- 검색 #2: 개명하면 이름 변경 처리는 며칠 걸려요?

**실제로 입력된 FAQ 원문**

- FAQ 1472: 개명했는데 이름은 어떻게 바꾸나요?
> 개명 후 발급받은 신분증과 개명 사실이 기재된 기본증명서를 가지고 매장을 방문하거나 고객센터에 서류를 보내면 가입자 이름을 바꿀 수 있습니다. 가입자 이름이 변경되기 전에는 새 이름으로 본인인증이 되지 않을 수 있습니다.
- FAQ 1094: 명의 변경을 하려면 무엇이 필요한가요?
> 명의 변경을 하려면 기존 명의자와 새 명의자가 신분증을 가지고 함께 매장에 방문해야 합니다. 가족 간 명의 변경에는 발급 3개월 이내의 가족관계증명서도 준비해 주세요. 명의 변경에 한 사람만 방문한다면 오지 않는 사람의 인감증명서와 위임장이 추가로 필요합니다.
- FAQ 81: 명의 변경이 가능한가요?
> 허용되는 조건에서 본인 확인 및 필요한 서류를 제출하면 명의 변경을 신청할 수 있습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1094, 1472, 81
- 원본: [results.jsonl:60](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:60](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:61](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 개명하면 이름 변경에 필요한 것은 기존 명의자와 새 명의자가 각각 신분증을 가지고 매장에 방문하는 것입니다. 가족 간 명의 변경의 경우, 발급 3개월 이내의 가족관계증명서도 준비해야 합니다. 한 사람만 방문하는 경우에는 오지 않는 사람의 인감증명서와 위임장이 추가로 필요합니다.
> 
> 「처리는 며칠 걸려요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 개명하면 이름 변경에 필요한 것은 기존 명의자와 새 명의자가 각각 신분증을 가지고 매장에 방문하는 것입니다. 가족 간 명의 변경의 경우, 발급 3개월 이내의 가족관계증명서도 준비해야 합니다. 한 사람만 방문하는 경우에는 오지 않는 사람의 인감증명서와 위임장이 추가로 필요합니다.

**코드 고정 안내**

> 「처리는 며칠 걸려요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 개명 시 기존 명의자와 새 명의자가 신분증을 가지고 함께 방문해야 하며, 가족관계증명서 또는 인감증명서와 위임장이 필요할 수 있다.
  - 사유: 다른 사람에게 명의를 변경하는 FAQ의 요건을 개명에 따른 가입자 이름 변경에 적용했습니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC05](hallucination_progression.md#hc05)

- 하위 #1: WRONG_ANSWER — 개명에 따른 이름 변경이 아니라 다른 사람에게 명의를 변경할 때 필요한 서류와 절차를 안내했습니다.
- 하위 #2: CORRECT_DECLINE — 모델은 처리 기간을 지어내지 않았고, 시스템 고정 안내에서 확인할 수 없다고 밝혔습니다.
- Judge 요약: 개명에 필요한 서류는 잘못 안내했지만, 자료에 없는 처리 기간은 답하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 개명하면 이름 변경에 뭐가 필요하고; FAQ 1094, 1472, 81
- 실제 하위 #2: 처리는 며칠 걸려요?; FAQ 없음
- 검색 #1: 개명 시 이름 변경에 필요한 서류는 무엇인가요?
- 검색 #2: 개명 처리는 평균으로 며칠 걸려요?
- slot #1: ANSWER; 최종 본문에 남음
> 개명하면 이름 변경에 필요한 것은 기존 명의자와 새 명의자가 각각 신분증을 가지고 매장에 방문하는 것입니다. 가족 간 명의 변경의 경우, 발급 3개월 이내의 가족관계증명서도 준비해야 합니다. 한 사람만 방문하는 경우에는 오지 않는 사람의 인감증명서와 위임장이 추가로 필요합니다.
- slot #2: ABSTAIN; 최종 본문에서 제거
> 처리 기간에 대한 정보가 FAQ에 없습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1094: 명의 변경을 하려면 무엇이 필요한가요?
> 명의 변경을 하려면 기존 명의자와 새 명의자가 신분증을 가지고 함께 매장에 방문해야 합니다. 가족 간 명의 변경에는 발급 3개월 이내의 가족관계증명서도 준비해 주세요. 명의 변경에 한 사람만 방문한다면 오지 않는 사람의 인감증명서와 위임장이 추가로 필요합니다.
- FAQ 1472: 개명했는데 이름은 어떻게 바꾸나요?
> 개명 후 발급받은 신분증과 개명 사실이 기재된 기본증명서를 가지고 매장을 방문하거나 고객센터에 서류를 보내면 가입자 이름을 바꿀 수 있습니다. 가입자 이름이 변경되기 전에는 새 이름으로 본인인증이 되지 않을 수 있습니다.
- FAQ 81: 명의 변경이 가능한가요?
> 허용되는 조건에서 본인 확인 및 필요한 서류를 제출하면 명의 변경을 신청할 수 있습니다.

</details>

<a id="mp-040"></a>
## MP-040 · 유심 사용 가능을 해외 구매폰 보험 가입 자격으로 확대

> 해외에서 산 휴대폰을 국내에서 쓸 수 있나요? 그 폰으로 Ubot 휴대폰 보험도 들 수 있어요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 환각 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC02](hallucination_progression.md#hc02), [HC04](hallucination_progression.md#hc04), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 해외에서 산 휴대폰을 국내에서 쓸 수 있나요? → ANSWER; gold FAQ 1322 (gold는 실제 제공 자료와 다를 수 있음)
- #2 그 폰으로 Ubot 휴대폰 보험도 들 수 있어요? → ABSTAIN; gold FAQ 1406 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=2; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1322, 27, 1263, 1296, 1319
- 원본: [results.jsonl:150](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:150](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:145](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 해외에서 산 휴대폰을 국내에서 쓸 수 있는지 여부는 국내 전파 인증을 받은 모델이고 통신사 잠금이 없으면 가능하지만, 해외 전용 모델은 국내 일부 주파수나 VoLTE를 지원하지 않아 통화 품질이 떨어질 수 있습니다. Ubot 휴대폰 보험은 자급제폰이나 다른 통신사에서 산 휴대폰에도 Ubot 유심을 끼워 사용할 수 있습니다. 다만, 해외에서 현지 유심을 쓰는 경우 Ubot 번호로 오는 전화와 문자를 받을 수 없으며, eSIM을 지원하는 휴대폰이라면 Ubot 번호를 eSIM으로 두고 현지 유심을 함께 쓸 수 있습니다. 그러나 Ubot 로밍 상품은 해외 특정 국가에서만 제공되므로, 해외에서 사용하는 휴대폰이 해당 국가에 속하지 않으면 로밍 서비스를 이용할 수 없습니다.

**모델 본문**

> 해외에서 산 휴대폰을 국내에서 쓸 수 있는지 여부는 국내 전파 인증을 받은 모델이고 통신사 잠금이 없으면 가능하지만, 해외 전용 모델은 국내 일부 주파수나 VoLTE를 지원하지 않아 통화 품질이 떨어질 수 있습니다. Ubot 휴대폰 보험은 자급제폰이나 다른 통신사에서 산 휴대폰에도 Ubot 유심을 끼워 사용할 수 있습니다. 다만, 해외에서 현지 유심을 쓰는 경우 Ubot 번호로 오는 전화와 문자를 받을 수 없으며, eSIM을 지원하는 휴대폰이라면 Ubot 번호를 eSIM으로 두고 현지 유심을 함께 쓸 수 있습니다. 그러나 Ubot 로밍 상품은 해외 특정 국가에서만 제공되므로, 해외에서 사용하는 휴대폰이 해당 국가에 속하지 않으면 로밍 서비스를 이용할 수 없습니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: Ubot 휴대폰 보험은 자급제폰이나 다른 통신사에서 산 휴대폰에도 Ubot 유심을 끼워 사용할 수 있습니다.
  - 사유: 유심 사용에 관한 FAQ 내용을 보험에 잘못 적용했으며, 받은 자료에는 해외 구매 휴대폰의 보험 가입 가능 여부가 없습니다.
- MISATTRIBUTION: 해외에서 사용하는 휴대폰이 로밍 제공 국가에 속하지 않으면 로밍 서비스를 이용할 수 없습니다.
  - 사유: 로밍 상품의 이용 가능 국가는 방문 국가에 관한 조건이지 휴대폰의 소속 국가에 관한 조건이 아닙니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC04](hallucination_progression.md#hc04), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 국내 전파 인증과 잠금 해제 조건, 해외 전용 모델의 품질 저하 가능성을 맞게 설명했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 유심 사용 가능 여부를 휴대폰 보험에 잘못 적용해 보험 관련 답변으로 제시했습니다.
- Judge 요약: 국내 사용 조건은 정확하지만 보험 질문에는 근거 없는 내용을 적용했고, 로밍 조건도 잘못 해석했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 해외에서 산 휴대폰을 국내에서 쓸 수 있나요?; FAQ 1322, 27
- 실제 하위 #2: 그 폰으로 Ubot 휴대폰 보험도 들 수 있어요?; FAQ 1263, 1296, 1319
- 검색 #1: 해외에서 산 휴대폰을 국내에서 쓸 수 있나요?
- 검색 #2: 해외에서 산 휴대이폰으로 Ubot 휴대폰 보험을 들 수 있나요?

**실제로 입력된 FAQ 원문**

- FAQ 1322: 해외에서 산 휴대폰을 국내에서 쓸 수 있나요?
> 해외에서 산 휴대폰도 국내 전파 인증을 받은 모델이고 통신사 잠금이 없다면 Ubot 유심을 끼워 사용할 수 있습니다. 해외 전용 휴대폰 모델은 국내 일부 주파수나 VoLTE를 지원하지 않아 통화 품질이 떨어질 수 있습니다.
- FAQ 27: 해외에서 휴대폰을 사용할 수 있나요?
> 자동 로밍이 지원되는 해외 국가에서는 휴대폰으로 전화, 문자, 데이터를 사용할 수 있습니다.
- FAQ 1263: 다른 통신사에서 산 휴대폰에 Ubot 유심을 써도 되나요?
> 자급제폰이나 다른 통신사에서 산 휴대폰에도 Ubot 유심을 끼워 사용할 수 있습니다. 다른 통신사에서 산 휴대폰에서는 일부 통신사 전용 기능이 제한될 수 있습니다.
- FAQ 1296: 어떤 나라에서 Ubot 로밍 상품을 쓸 수 있나요?
> Ubot 로밍 상품은 일본, 중국, 대만, 홍콩, 베트남, 태국, 싱가포르, 필리핀, 미국, 캐나다, 영국, 프랑스, 독일, 스페인, 이탈리아, 호주 16개국에서 이용할 수 있습니다. 로밍 상품은 국가별 전용이라 가입한 나라 외에서는 사용할 수 없습니다.
- FAQ 1319: 해외에서 현지 유심을 써도 되나요?
> 휴대폰에 통신사 잠금(컨트리 락)이 없다면 해외에서 현지 유심을 끼워 사용할 수 있습니다. 현지 유심으로 바꾼 동안에는 Ubot 번호로 오는 전화와 문자를 받을 수 없습니다. eSIM을 지원하는 휴대폰이라면 Ubot 번호를 eSIM으로 두고 현지 유심을 함께 쓸 수도 있습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1322, 27, 1263, 1296, 1319
- 원본: [results.jsonl:150](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:150](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:139](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 해외에서 산 휴대폰이 국내 전파 인증을 받은 모델이고 통신사 잠금이 없다면 Ubot 유심을 끼워 국내에서 사용할 수 있습니다. 다만, 해외 전용 휴대폰은 국내 일부 주파수나 VoLTE를 지원하지 않아 통화 품질이 떨어질 수 있습니다. 또한, 다른 통신사에서 산 휴대폰에 대해서도 Ubot 유심을 끼워 사용할 수 있습니다. 따라서 그 폰으로 Ubot 휴대폰 보험도 들 수 있습니다.

**모델 본문**

> 해외에서 산 휴대폰이 국내 전파 인증을 받은 모델이고 통신사 잠금이 없다면 Ubot 유심을 끼워 국내에서 사용할 수 있습니다. 다만, 해외 전용 휴대폰은 국내 일부 주파수나 VoLTE를 지원하지 않아 통화 품질이 떨어질 수 있습니다. 또한, 다른 통신사에서 산 휴대폰에 대해서도 Ubot 유심을 끼워 사용할 수 있습니다. 따라서 그 폰으로 Ubot 휴대폰 보험도 들 수 있습니다.

**Judge가 표시한 주장**

- UNSUPPORTED_GENERALIZATION: 그 폰으로 Ubot 휴대폰 보험도 들 수 있습니다.
  - 사유: 국내 사용 가능 여부를 보험 가입 자격으로 확대했지만, 제공 자료에는 해외 구매 휴대폰의 보험 가입 기준이 없습니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC04](hallucination_progression.md#hc04), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 국내 전파 인증과 통신사 잠금 해제 조건, 사용 가능 여부와 통화 품질 유의점을 정확히 답했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 해외 구매 휴대폰의 보험 가입 가능 여부는 자료에 없는데 가능하다고 단정했습니다.
- Judge 요약: 국내 사용 조건은 근거와 일치하지만, 보험 가입 가능 여부는 근거 없이 단정했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 해외에서 산 휴대폰을 국내에서 쓸 수 있나요?; FAQ 1322, 27
- 실제 하위 #2: 그 폰으로 Ubot 휴대폰 보험도 들 수 있어요?; FAQ 1263, 1296, 1319
- 검색 #1: 해외에서 산 휴대폰을 국내에서 쓸 수 있나요?
- 검색 #2: 해외에서 산 휴대이폰으로 Ubot 휴대폰 보험을 들 수 있나요?

**실제로 입력된 FAQ 원문**

- FAQ 1322: 해외에서 산 휴대폰을 국내에서 쓸 수 있나요?
> 해외에서 산 휴대폰도 국내 전파 인증을 받은 모델이고 통신사 잠금이 없다면 Ubot 유심을 끼워 사용할 수 있습니다. 해외 전용 휴대폰 모델은 국내 일부 주파수나 VoLTE를 지원하지 않아 통화 품질이 떨어질 수 있습니다.
- FAQ 27: 해외에서 휴대폰을 사용할 수 있나요?
> 자동 로밍이 지원되는 해외 국가에서는 휴대폰으로 전화, 문자, 데이터를 사용할 수 있습니다.
- FAQ 1263: 다른 통신사에서 산 휴대폰에 Ubot 유심을 써도 되나요?
> 자급제폰이나 다른 통신사에서 산 휴대폰에도 Ubot 유심을 끼워 사용할 수 있습니다. 다른 통신사에서 산 휴대폰에서는 일부 통신사 전용 기능이 제한될 수 있습니다.
- FAQ 1296: 어떤 나라에서 Ubot 로밍 상품을 쓸 수 있나요?
> Ubot 로밍 상품은 일본, 중국, 대만, 홍콩, 베트남, 태국, 싱가포르, 필리핀, 미국, 캐나다, 영국, 프랑스, 독일, 스페인, 이탈리아, 호주 16개국에서 이용할 수 있습니다. 로밍 상품은 국가별 전용이라 가입한 나라 외에서는 사용할 수 없습니다.
- FAQ 1319: 해외에서 현지 유심을 써도 되나요?
> 휴대폰에 통신사 잠금(컨트리 락)이 없다면 해외에서 현지 유심을 끼워 사용할 수 있습니다. 현지 유심으로 바꾼 동안에는 Ubot 번호로 오는 전화와 문자를 받을 수 없습니다. eSIM을 지원하는 휴대폰이라면 Ubot 번호를 eSIM으로 두고 현지 유심을 함께 쓸 수도 있습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1322, 27, 1263, 1296, 1319
- 원본: [results.jsonl:207](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:207](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:196](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 해외에서 산 휴대폰이 국내 전파 인증을 받은 모델이고 통신사 잠금이 없다면 Ubot 유심을 끼워 사용할 수 있습니다. 그러나 해외 전용 휴대폰은 국내 일부 주파수나 VoLTE를 지원하지 않아 통화 품질이 떨어질 수 있습니다.
> 
> 다른 통신사에서 산 휴대폰에 Ubot 유심을 끼워 사용할 수 있습니다. 따라서 해외에서 산 휴대폰으로도 Ubot 휴대폰 보험을 들 수 있습니다.

**모델 본문**

> 해외에서 산 휴대폰이 국내 전파 인증을 받은 모델이고 통신사 잠금이 없다면 Ubot 유심을 끼워 사용할 수 있습니다. 그러나 해외 전용 휴대폰은 국내 일부 주파수나 VoLTE를 지원하지 않아 통화 품질이 떨어질 수 있습니다.
> 
> 다른 통신사에서 산 휴대폰에 Ubot 유심을 끼워 사용할 수 있습니다. 따라서 해외에서 산 휴대폰으로도 Ubot 휴대폰 보험을 들 수 있습니다.

**Judge가 표시한 주장**

- UNSUPPORTED_GENERALIZATION: 해외에서 산 휴대폰으로도 Ubot 휴대폰 보험을 들 수 있습니다.
  - 사유: Ubot 유심 사용 가능 여부만 확인되는 자료에서 보험 가입 가능 여부를 추론해 확정했습니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC04](hallucination_progression.md#hc04), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 국내 전파 인증과 통신사 잠금 해제 조건, 해외 전용 모델의 통화 품질 주의점을 정확히 답했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 보험 가입 가능 여부는 받은 자료에 없는데 가능하다고 단정했습니다.
- Judge 요약: 국내 사용 조건은 FAQ와 일치하지만, 보험 가입 가능하다는 결론은 제공된 자료로 뒷받침되지 않습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 해외에서 산 휴대폰을 국내에서 쓸 수 있나요?; FAQ 1322, 27
- 실제 하위 #2: 그 폰으로 Ubot 휴대폰 보험도 들 수 있어요?; FAQ 1263, 1296, 1319
- 검색 #1: 해외에서 산 휴대폰을 국내에서 쓸 수 있나요?
- 검색 #2: 해외에서 산 휴대이폰으로 Ubot 휴대폰 보험을 들 수 있나요?
- slot #1: ANSWER; 최종 본문에 남음
> 해외에서 산 휴대폰이 국내 전파 인증을 받은 모델이고 통신사 잠금이 없다면 Ubot 유심을 끼워 사용할 수 있습니다. 그러나 해외 전용 휴대폰은 국내 일부 주파수나 VoLTE를 지원하지 않아 통화 품질이 떨어질 수 있습니다.
- slot #2: ANSWER; 최종 본문에 남음
> 다른 통신사에서 산 휴대폰에 Ubot 유심을 끼워 사용할 수 있습니다. 따라서 해외에서 산 휴대폰으로도 Ubot 휴대폰 보험을 들 수 있습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1322: 해외에서 산 휴대폰을 국내에서 쓸 수 있나요?
> 해외에서 산 휴대폰도 국내 전파 인증을 받은 모델이고 통신사 잠금이 없다면 Ubot 유심을 끼워 사용할 수 있습니다. 해외 전용 휴대폰 모델은 국내 일부 주파수나 VoLTE를 지원하지 않아 통화 품질이 떨어질 수 있습니다.
- FAQ 27: 해외에서 휴대폰을 사용할 수 있나요?
> 자동 로밍이 지원되는 해외 국가에서는 휴대폰으로 전화, 문자, 데이터를 사용할 수 있습니다.
- FAQ 1263: 다른 통신사에서 산 휴대폰에 Ubot 유심을 써도 되나요?
> 자급제폰이나 다른 통신사에서 산 휴대폰에도 Ubot 유심을 끼워 사용할 수 있습니다. 다른 통신사에서 산 휴대폰에서는 일부 통신사 전용 기능이 제한될 수 있습니다.
- FAQ 1296: 어떤 나라에서 Ubot 로밍 상품을 쓸 수 있나요?
> Ubot 로밍 상품은 일본, 중국, 대만, 홍콩, 베트남, 태국, 싱가포르, 필리핀, 미국, 캐나다, 영국, 프랑스, 독일, 스페인, 이탈리아, 호주 16개국에서 이용할 수 있습니다. 로밍 상품은 국가별 전용이라 가입한 나라 외에서는 사용할 수 없습니다.
- FAQ 1319: 해외에서 현지 유심을 써도 되나요?
> 휴대폰에 통신사 잠금(컨트리 락)이 없다면 해외에서 현지 유심을 끼워 사용할 수 있습니다. 현지 유심으로 바꾼 동안에는 Ubot 번호로 오는 전화와 문자를 받을 수 없습니다. eSIM을 지원하는 휴대폰이라면 Ubot 번호를 eSIM으로 두고 현지 유심을 함께 쓸 수도 있습니다.

</details>

<a id="mp-044"></a>
## MP-044 · 질문에 없는 인천공항 단정과 유심 미판매 단정

> 공항 로밍센터 운영시간이 어떻게 되고, 거기서 유심도 살 수 있어요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **없음 → 환각 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04), [HC12](hallucination_progression.md#hc12), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 공항 로밍센터 운영시간이 어떻게 되고 → ANSWER; gold FAQ 210 (gold는 실제 제공 자료와 다를 수 있음)
- #2 거기서 유심도 살 수 있어요? → ABSTAIN; gold FAQ 210 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: sub_question_input_changed, search_queries_changed, store_result_changed
- 입력 차이 sub_slot: store_result_changed
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 있음; 실제 FAQ 210
- 원본: [results.jsonl:154](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:154](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:1](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1-store/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 인천공항 제1·제2여객터미널의 로밍센터는 매일 06:00~22:00 운영합니다. 유심 판매는 FAQ에 명시되어 있지 않습니다.

**모델 본문**

> 인천공항 제1·제2여객터미널의 로밍센터는 매일 06:00~22:00 운영합니다. 유심 판매는 FAQ에 명시되어 있지 않습니다.

- 하위 #1: CORRECT_ANSWER — 인천공항 제1·제2여객터미널 로밍센터의 매일 06:00~22:00 운영시간을 정확히 답했습니다.
- 하위 #2: CORRECT_DECLINE — 유심 판매 여부가 FAQ에 없다고 밝히고 값을 지어내지 않았습니다.
- Judge 요약: 두 하위 질문을 자료 범위에 맞게 처리했고, 검색어도 원래 질문을 충실히 반영했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 공항 로밍센터 운영시간이 어떻게 되고,; FAQ 210
- 실제 하위 #2: 거기서 유심도 살 수 있어요?; FAQ 없음
- 검색 #1: 공항 로밍센터의 운영시간은 어떻게 되나요?
- 검색 #2: 공항 로밍센터에서 유심을 살 수 있나요?

**실제로 입력된 FAQ 원문**

- FAQ 210: 공항 로밍센터에서는 어떤 일을 볼 수 있나요?
> 공항 로밍센터에서는 로밍 패스 가입 상담과 로밍 설정 안내를 받을 수 있습니다. 인천공항 제1·제2여객터미널의 로밍센터는 매일 06:00~22:00 운영합니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: null; 하위 status: 없음; status 배열 검증: false
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 있음; 실제 FAQ 210
- 원본: [results.jsonl:154](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:154](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:6](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1-store/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 인천공항을 기준으로 한 매장 조회를 위해 '인천공항'이라는 장소를 사용자 질문에 쓴 철자 그대로 넣어 다시 조회를 요청합니다. 그러나 사용자가 명시적으로 장소를 말하지 않았다면, 그에 따라 기준이 될 지명이나 역 이름을 알려 달라고 안내해야 합니다. 현재 질문에서 '인천공항'이 명시되어 있으므로, 이를 기준으로 매장 조회를 진행합니다.

**모델 본문**

> 인천공항을 기준으로 한 매장 조회를 위해 '인천공항'이라는 장소를 사용자 질문에 쓴 철자 그대로 넣어 다시 조회를 요청합니다. 그러나 사용자가 명시적으로 장소를 말하지 않았다면, 그에 따라 기준이 될 지명이나 역 이름을 알려 달라고 안내해야 합니다. 현재 질문에서 '인천공항'이 명시되어 있으므로, 이를 기준으로 매장 조회를 진행합니다.

**Judge가 표시한 주장**

- FABRICATION: 현재 질문에서 '인천공항'이 명시되어 있으므로
  - 사유: 사용자는 공항 로밍센터라고만 했고 인천공항을 명시하지 않았습니다.
- 적용 후보: [HC12](hallucination_progression.md#hc12)

- 하위 #1: MISSING_ANSWER — 자료에 있는 매일 06:00~22:00 운영시간을 답하지 않았습니다.
- 하위 #2: CORRECT_DECLINE — 유심 구매 가능 여부를 확정하지 않았습니다.
- Judge 요약: 운영시간 답변을 빠뜨렸고, 질문에 없는 인천공항을 사용자가 명시했다고 잘못 주장했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 공항 로밍센터 운영시간이 어떻게 되고,; FAQ 210
- 실제 하위 #2: 거기서 유심도 살 수 있어요?; FAQ 210
- 검색 #1: 공항 로밍센터의 운영시간은 어떻게 되나요?
- 검색 #2: 공항 로밍센터에서 유심도 살 수 있나요?

**실제로 입력된 FAQ 원문**

- FAQ 210: 공항 로밍센터에서는 어떤 일을 볼 수 있나요?
> 공항 로밍센터에서는 로밍 패스 가입 상담과 로밍 설정 안내를 받을 수 있습니다. 인천공항 제1·제2여객터미널의 로밍센터는 매일 06:00~22:00 운영합니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 있음; 실제 FAQ 210
- 원본: [results.jsonl:208](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:208](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:195](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 인천공항 제1·제2여객터미널의 로밍센터는 매일 06:00~22:00 운영합니다. 그러나 유심 판매는 제공되지 않습니다.
> 
> 거기서 유심을 살 수 없습니다.

**모델 본문**

> 인천공항 제1·제2여객터미널의 로밍센터는 매일 06:00~22:00 운영합니다. 그러나 유심 판매는 제공되지 않습니다.
> 
> 거기서 유심을 살 수 없습니다.

**Judge가 표시한 주장**

- FABRICATION: 공항 로밍센터에서는 유심을 판매하지 않아 살 수 없다.
  - 사유: 제공된 FAQ에는 유심 판매 여부가 나와 있지 않습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 인천공항 제1·제2여객터미널 로밍센터의 운영시간을 FAQ대로 답했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 자료에 없는 유심 판매 여부를 판매하지 않는다고 단정했습니다.
- Judge 요약: 운영시간은 근거와 일치하지만, 확인되지 않은 유심 판매 여부를 부정해 답했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 공항 로밍센터 운영시간이 어떻게 되고,; FAQ 210
- 실제 하위 #2: 거기서 유심도 살 수 있어요?; FAQ 210
- 검색 #1: 공항 로밍센터의 운영시간은 어떻게 되나요?
- 검색 #2: 공항 로밍센터에서 유심도 살 수 있나요?
- slot #1: ANSWER; 최종 본문에 남음
> 인천공항 제1·제2여객터미널의 로밍센터는 매일 06:00~22:00 운영합니다. 그러나 유심 판매는 제공되지 않습니다.
- slot #2: ANSWER; 최종 본문에 남음
> 거기서 유심을 살 수 없습니다.

**실제로 입력된 FAQ 원문**

- FAQ 210: 공항 로밍센터에서는 어떤 일을 볼 수 있나요?
> 공항 로밍센터에서는 로밍 패스 가입 상담과 로밍 설정 안내를 받을 수 있습니다. 인천공항 제1·제2여객터미널의 로밍센터는 매일 06:00~22:00 운영합니다.

</details>

<a id="mp-045"></a>
## MP-045 · 실속 5G 상품 매장 가입 가능 여부

> 실속 5G 2GB 요금제는 얼마고 매장에서도 가입할 수 있어요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **없음 → 환각 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 실속 5G 2GB 요금제는 얼마고 → ANSWER; gold FAQ 1111, 1130 (gold는 실제 제공 자료와 다를 수 있음)
- #2 매장에서도 가입할 수 있어요? → ABSTAIN; gold FAQ 1111 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: search_queries_changed
- 입력 차이 v4sub_slot: search_queries_changed

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1111
- 원본: [results.jsonl:155](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:155](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:144](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 실속 5G 2GB 요금제는 월 6,000원입니다. 그러나 매장에서 가입할 수 있는지에 대한 정보가 FAQ에 없습니다.

**모델 본문**

> 실속 5G 2GB 요금제는 월 6,000원입니다. 그러나 매장에서 가입할 수 있는지에 대한 정보가 FAQ에 없습니다.

- 하위 #1: CORRECT_ANSWER — 실속 5G 2GB의 월 요금 6,000원을 정확히 답했습니다.
- 하위 #2: CORRECT_DECLINE — 매장 가입 가능 여부는 자료에 없어 답하지 않았습니다.
- Judge 요약: 가격은 제공된 FAQ와 일치하고, 자료에 없는 매장 가입 가능 여부는 확정하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 실속 5G 2GB 요금제는 얼마고; FAQ 1111
- 실제 하위 #2: 매장에서도 가입할 수 있어요?; FAQ 없음
- 검색 #1: 실속 5G 2GB 요금제의 가격은 얼마인가요?
- 검색 #2: 실속 5G 2GB 요금제를 매장에서 가입할 수 있나요?

**실제로 입력된 FAQ 원문**

- FAQ 1111: Ubot 실속 요금제는 어떤 요금제인가요?
> Ubot 실속은 약정 없는 저가 요금제로 LTE 10종(월 3,300원~9,900원)과 5G 3종(2GB 6,000원, 3GB 6,900원, 4GB 7,800원)이 있습니다. Ubot 실속에서 이름에 +가 붙은 요금제는 데이터를 다 쓴 뒤 1Mbps로 계속 이용할 수 있고 나머지 요금제는 데이터가 차단됩니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1111
- 원본: [results.jsonl:155](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:155](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:144](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 실속 5G 2GB 요금제는 월 6,000원입니다. 매장에서도 가입할 수 있습니다.
> 
> 「매장에서도 가입할 수 있어요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 실속 5G 2GB 요금제는 월 6,000원입니다. 매장에서도 가입할 수 있습니다.

**코드 고정 안내**

> 「매장에서도 가입할 수 있어요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**Judge가 표시한 주장**

- FABRICATION: 매장에서도 가입할 수 있습니다.
  - 사유: 제공된 FAQ에는 매장 가입 가능 여부가 없습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — FAQ에 나온 월 6,000원을 정확히 답했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 매장 가입 가능 여부는 자료에 없는데 가능하다고 단정했습니다.
- Judge 요약: 가격은 근거에 맞지만 매장 가입 가능 여부를 근거 없이 확정했으며, 시스템 고정 안내는 모델 답변 평가에서 제외했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 실속 5G 2GB 요금제는 얼마고; FAQ 1111
- 실제 하위 #2: 매장에서도 가입할 수 있어요?; FAQ 없음
- 검색 #1: 실속 5G 2GB 요금제의 가격은 얼마인가요?
- 검색 #2: 실속 5G 2GB 요금제를 매장에서 가입할 수 있나요?

**실제로 입력된 FAQ 원문**

- FAQ 1111: Ubot 실속 요금제는 어떤 요금제인가요?
> Ubot 실속은 약정 없는 저가 요금제로 LTE 10종(월 3,300원~9,900원)과 5G 3종(2GB 6,000원, 3GB 6,900원, 4GB 7,800원)이 있습니다. Ubot 실속에서 이름에 +가 붙은 요금제는 데이터를 다 쓴 뒤 1Mbps로 계속 이용할 수 있고 나머지 요금제는 데이터가 차단됩니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1111
- 원본: [results.jsonl:66](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:66](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:66](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 실속 5G 2GB 요금제는 월 6,000원입니다.
> 
> 「매장에서도 가입할 수 있어요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 실속 5G 2GB 요금제는 월 6,000원입니다.

**코드 고정 안내**

> 「매장에서도 가입할 수 있어요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_ANSWER — 실속 5G 2GB의 월 요금 6,000원을 정확히 답했습니다.
- 하위 #2: CORRECT_DECLINE — 매장 가입 가능 여부를 지어내지 않고 답하지 않았습니다.
- Judge 요약: 요금 답변은 제공된 FAQ와 일치하며, 자료에 없는 매장 가입 가능 여부는 모델 본문에서 단정하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 실속 5G 2GB 요금제는 얼마고; FAQ 1111
- 실제 하위 #2: 매장에서도 가입할 수 있어요?; FAQ 없음
- 검색 #1: 실속 5G 2GB 요금제의 요금은 얼마인가요?
- 검색 #2: 실속 5G 2GB 요금제를 매장에서 가입할 수 있나요?
- slot #1: ANSWER; 최종 본문에 남음
> 실속 5G 2GB 요금제는 월 6,000원입니다.
- slot #2: ABSTAIN; 최종 본문에서 제거
> 매장에서 가입할 수 있는지에 대한 정보가 없습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1111: Ubot 실속 요금제는 어떤 요금제인가요?
> Ubot 실속은 약정 없는 저가 요금제로 LTE 10종(월 3,300원~9,900원)과 5G 3종(2GB 6,000원, 3GB 6,900원, 4GB 7,800원)이 있습니다. Ubot 실속에서 이름에 +가 붙은 요금제는 데이터를 다 쓴 뒤 1Mbps로 계속 이용할 수 있고 나머지 요금제는 데이터가 차단됩니다.

</details>

<a id="mp-047"></a>
## MP-047 · 출국 후 앱 신청 불가·매장만 가능 단정

> 해외 장기 체류 일시정지에 필요한 서류가 뭐고, 출국한 뒤 앱으로도 신청돼요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **없음 → 없음 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 해외 장기 체류 일시정지에 필요한 서류가 뭐고 → ANSWER; gold FAQ 1321 (gold는 실제 제공 자료와 다를 수 있음)
- #2 출국한 뒤 앱으로도 신청돼요? → ABSTAIN; gold FAQ 1321 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1321, 1435, 1025
- 원본: [results.jsonl:157](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:157](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:148](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 해외 장기 체류 일시정지에 필요한 서류는 항공권이나 출입국 사실 증명서와 명의자 신분증입니다. 출국한 뒤에는 대리인이 위임장을 가지고 매장에서 신청할 수 있습니다. 그러나 앱을 통해 신청할 수 있는지에 대한 정보는 제공된 FAQ에서 명시되어 있지 않습니다.

**모델 본문**

> 해외 장기 체류 일시정지에 필요한 서류는 항공권이나 출입국 사실 증명서와 명의자 신분증입니다. 출국한 뒤에는 대리인이 위임장을 가지고 매장에서 신청할 수 있습니다. 그러나 앱을 통해 신청할 수 있는지에 대한 정보는 제공된 FAQ에서 명시되어 있지 않습니다.

- 하위 #1: CORRECT_ANSWER — 필요한 서류를 FAQ와 일치하게 안내했습니다.
- 하위 #2: CORRECT_DECLINE — 출국 후 앱 신청 가능 여부는 자료에 없어 확답하지 않았습니다.
- Judge 요약: 서류와 대리인 신청 안내는 FAQ에 근거하며, 앱 신청 가능 여부는 알 수 없다고 밝혔습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 해외 장기 체류 일시정지에 필요한 서류가 뭐고,; FAQ 1321, 1435
- 실제 하위 #2: 출국한 뒤 앱으로도 신청돼요?; FAQ 1321, 1025
- 검색 #1: 해외 장기 체류 일시정지에 필요한 서류는 무엇인가요?
- 검색 #2: 출국한 뒤 앱으로 해외 장기 체류 일시정지 신청이 가능하나요?

**실제로 입력된 FAQ 원문**

- FAQ 1321: 해외 체류로 장기 일시정지를 신청할 때 필요한 서류가 있나요?
> 해외 체류로 장기 일시정지를 신청하려면 항공권이나 출입국 사실 증명서와 명의자 신분증이 필요합니다. 해외에 출국한 뒤에는 대리인이 위임장을 가지고 매장에서 장기 일시정지를 신청할 수도 있습니다.
- FAQ 1435: 일시정지와 장기 정지는 무엇이 다른가요?
> 일시정지는 누구나 연 2회, 1회 최대 90일까지 월 3,850원에 신청할 수 있습니다. 장기 정지는 군 입대, 해외 체류, 입원처럼 증빙 서류가 있는 경우에 더 긴 기간 동안 신청할 수 있습니다.
- FAQ 1025: 몇 달 동안 해외에 머물 때 회선은 어떻게 하나요?
> 몇 달 동안 해외에 머무른다면 휴대폰 회선을 일시 정지하거나 요금제를 변경할 수 있습니다. 장기 해외 체류에 어떤 회선 유지 방법이 유리한지는 체류 기간과 이용 계획에 따라 달라 출국 전에 상담해 주세요.

</details>

### v1 sub

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1321, 1435, 1025
- 원본: [results.jsonl:157](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:157](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:145](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 해외 장기 체류 일시정지에 필요한 서류는 항공권이나 출입국 사실 증명서와 명의자 신분증입니다. 출국한 뒤에는 대리인이 위임장을 가지고 매장에서 신청할 수 있지만, 앱을 통해 신청하는 것은 제공된 정보에 없습니다.
> 
> 「출국한 뒤 앱으로도 신청돼요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 해외 장기 체류 일시정지에 필요한 서류는 항공권이나 출입국 사실 증명서와 명의자 신분증입니다. 출국한 뒤에는 대리인이 위임장을 가지고 매장에서 신청할 수 있지만, 앱을 통해 신청하는 것은 제공된 정보에 없습니다.

**코드 고정 안내**

> 「출국한 뒤 앱으로도 신청돼요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_ANSWER — 필요 서류를 FAQ와 일치하게 안내했습니다.
- 하위 #2: CORRECT_DECLINE — 앱 신청 가능 여부를 지어내지 않고 자료에 없다고 밝혔습니다.
- Judge 요약: 답변의 서류와 대리인 매장 신청 안내는 FAQ에 근거하며, 앱 신청 여부는 확인되지 않는다고 처리했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 해외 장기 체류 일시정지에 필요한 서류가 뭐고,; FAQ 1321, 1435
- 실제 하위 #2: 출국한 뒤 앱으로도 신청돼요?; FAQ 1321, 1025
- 검색 #1: 해외 장기 체류 일시정지에 필요한 서류는 무엇인가요?
- 검색 #2: 출국한 뒤 앱으로 해외 장기 체류 일시정지 신청이 가능하나요?

**실제로 입력된 FAQ 원문**

- FAQ 1321: 해외 체류로 장기 일시정지를 신청할 때 필요한 서류가 있나요?
> 해외 체류로 장기 일시정지를 신청하려면 항공권이나 출입국 사실 증명서와 명의자 신분증이 필요합니다. 해외에 출국한 뒤에는 대리인이 위임장을 가지고 매장에서 장기 일시정지를 신청할 수도 있습니다.
- FAQ 1435: 일시정지와 장기 정지는 무엇이 다른가요?
> 일시정지는 누구나 연 2회, 1회 최대 90일까지 월 3,850원에 신청할 수 있습니다. 장기 정지는 군 입대, 해외 체류, 입원처럼 증빙 서류가 있는 경우에 더 긴 기간 동안 신청할 수 있습니다.
- FAQ 1025: 몇 달 동안 해외에 머물 때 회선은 어떻게 하나요?
> 몇 달 동안 해외에 머무른다면 휴대폰 회선을 일시 정지하거나 요금제를 변경할 수 있습니다. 장기 해외 체류에 어떤 회선 유지 방법이 유리한지는 체류 기간과 이용 계획에 따라 달라 출국 전에 상담해 주세요.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=2; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1321, 1435, 1025
- 원본: [results.jsonl:68](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:68](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:68](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 해외 체류로 장기 일시정지를 신청하려면 항공권이나 출입국 사실 증명서와 명의자 신분증이 필요합니다. 해외에 출국한 뒤에는 대리인이 위임장을 가지고 매장에서 장기 일시정지를 신청할 수도 있습니다.
> 
> 출국한 뒤 앱으로는 신청이 되지 않습니다. 해외에 출국한 뒤에는 대리인이 위임장을 가지고 매장에서만 장기 일시정지를 신청할 수 있습니다.

**모델 본문**

> 해외 체류로 장기 일시정지를 신청하려면 항공권이나 출입국 사실 증명서와 명의자 신분증이 필요합니다. 해외에 출국한 뒤에는 대리인이 위임장을 가지고 매장에서 장기 일시정지를 신청할 수도 있습니다.
> 
> 출국한 뒤 앱으로는 신청이 되지 않습니다. 해외에 출국한 뒤에는 대리인이 위임장을 가지고 매장에서만 장기 일시정지를 신청할 수 있습니다.

**Judge가 표시한 주장**

- FABRICATION: 출국한 뒤 앱으로는 신청이 되지 않습니다.
  - 사유: 제공된 FAQ에는 출국 후 앱 신청 가능 여부가 없습니다.
- UNSUPPORTED_GENERALIZATION: 출국한 뒤에는 대리인이 매장에서만 신청할 수 있습니다.
  - 사유: FAQ는 대리인의 매장 신청이 가능하다고만 하며 유일한 방법이라고 하지 않습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 필요 서류인 항공권 또는 출입국 사실 증명서와 명의자 신분증을 정확히 안내했습니다.
- 하위 #2: UNSUPPORTED_ANSWER — 자료에 없는 앱 신청 불가 여부를 단정했습니다.
- Judge 요약: 서류 안내는 정확하지만, 앱 신청 불가와 매장 신청만 가능하다는 주장은 자료로 확인되지 않습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 해외 장기 체류 일시정지에 필요한 서류가 뭐고,; FAQ 1321, 1435
- 실제 하위 #2: 출국한 뒤 앱으로도 신청돼요?; FAQ 1321, 1025
- 검색 #1: 해외 장기 체류 일시정지에 필요한 서류는 무엇인가요?
- 검색 #2: 출국한 뒤 앱으로 해외 장기 체류 일시정지 신청이 가능하나요?
- slot #1: ANSWER; 최종 본문에 남음
> 해외 체류로 장기 일시정지를 신청하려면 항공권이나 출입국 사실 증명서와 명의자 신분증이 필요합니다. 해외에 출국한 뒤에는 대리인이 위임장을 가지고 매장에서 장기 일시정지를 신청할 수도 있습니다.
- slot #2: ANSWER; 최종 본문에 남음
> 출국한 뒤 앱으로는 신청이 되지 않습니다. 해외에 출국한 뒤에는 대리인이 위임장을 가지고 매장에서만 장기 일시정지를 신청할 수 있습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1321: 해외 체류로 장기 일시정지를 신청할 때 필요한 서류가 있나요?
> 해외 체류로 장기 일시정지를 신청하려면 항공권이나 출입국 사실 증명서와 명의자 신분증이 필요합니다. 해외에 출국한 뒤에는 대리인이 위임장을 가지고 매장에서 장기 일시정지를 신청할 수도 있습니다.
- FAQ 1435: 일시정지와 장기 정지는 무엇이 다른가요?
> 일시정지는 누구나 연 2회, 1회 최대 90일까지 월 3,850원에 신청할 수 있습니다. 장기 정지는 군 입대, 해외 체류, 입원처럼 증빙 서류가 있는 경우에 더 긴 기간 동안 신청할 수 있습니다.
- FAQ 1025: 몇 달 동안 해외에 머물 때 회선은 어떻게 하나요?
> 몇 달 동안 해외에 머무른다면 휴대폰 회선을 일시 정지하거나 요금제를 변경할 수 있습니다. 장기 해외 체류에 어떤 회선 유지 방법이 유리한지는 체류 기간과 이용 계획에 따라 달라 출국 전에 상담해 주세요.

</details>

<a id="mp-056"></a>
## MP-056 · 비디오패스 1인 이용과 동시 시청 기기 수

> 비디오패스는 동시에 몇 대에서 볼 수 있어요? 그리고 월 요금은 얼마예요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 환각 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 비디오패스는 동시에 몇 대에서 볼 수 있어요? → ABSTAIN; gold FAQ 1344 (gold는 실제 제공 자료와 다를 수 있음)
- #2 월 요금은 얼마예요? → ANSWER; gold FAQ 1344, 1335 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: faq_set_changed, sub_question_input_changed, search_queries_changed
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1344, 302
- 원본: [results.jsonl:166](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:166](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:158](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 비디오패스는 동시에 1대에서만 볼 수 있습니다. 월 요금은 9,900원입니다. 다만, 이 요금은 Ubot 비디오패스 서비스에 한정되며, 라이프 비디오 요금제에 포함되어 있는 부가서비스입니다.

**모델 본문**

> 비디오패스는 동시에 1대에서만 볼 수 있습니다. 월 요금은 9,900원입니다. 다만, 이 요금은 Ubot 비디오패스 서비스에 한정되며, 라이프 비디오 요금제에 포함되어 있는 부가서비스입니다.

**Judge가 표시한 주장**

- FABRICATION: 비디오패스는 동시에 1대에서만 볼 수 있습니다.
  - 사유: FAQ의 ‘1인이 이용’은 동시 시청 가능 대수가 1대라는 근거가 아닙니다.
- 적용 후보: [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)

- 하위 #1: UNSUPPORTED_ANSWER — 동시 시청 가능 대수는 자료에 없는데 1대로 단정했습니다.
- 하위 #2: CORRECT_ANSWER — 비디오패스 월 요금 9,900원을 정확히 답했습니다.
- Judge 요약: 월 요금과 요금제 포함 여부는 근거가 있지만, 자료에 없는 동시 시청 대수를 지어냈습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 비디오패스는 동시에 몇 대에서 볼 수 있어요?; FAQ 1344
- 실제 하위 #2: 그리고 월 요금은 얼마예요?; FAQ 1344, 302
- 검색 #1: 비디오패스는 동시에 몇 대에서 볼 수 있어요?
- 검색 #2: 비디오패스 월 요금은 얼마예요?

**실제로 입력된 FAQ 원문**

- FAQ 1344: 비디오패스는 어떤 서비스인가요?
> Ubot 비디오패스(월 9,900원)는 Ubot 영상 라이브러리를 1인이 이용하는 부가서비스이며 실제 OTT 제휴 상품은 아닙니다. 비디오패스로 영상을 볼 때 쓰는 데이터는 요금제에서 차감됩니다. 라이프 비디오 요금제에는 비디오패스가 포함되어 있습니다.
- FAQ 302: IPTV는 월 얼마인가요?
> IPTV 베이직 요금은 월 16,500원, 프리미엄 요금은 월 22,000원이며 두 상품 모두 셋톱박스 임대가 포함되어 있습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1344, 302
- 원본: [results.jsonl:166](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:166](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:157](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 비디오패스는 동시에 1대에서만 볼 수 있습니다. 월 요금은 9,900원입니다.

**모델 본문**

> 비디오패스는 동시에 1대에서만 볼 수 있습니다. 월 요금은 9,900원입니다.

**Judge가 표시한 주장**

- FABRICATION: 비디오패스는 동시에 1대에서만 볼 수 있습니다.
  - 사유: FAQ의 '1인이 이용'은 동시 시청 가능 기기 수를 뜻하지 않으며, 자료에 해당 대수가 없습니다.
- 적용 후보: [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)

- 하위 #1: UNSUPPORTED_ANSWER — 자료에는 동시 시청 가능 대수가 없는데 1대라고 확정했습니다.
- 하위 #2: CORRECT_ANSWER — 비디오패스의 월 요금 9,900원을 정확히 답했습니다.
- Judge 요약: 월 요금은 근거와 일치하지만, 자료에 없는 동시 시청 대수를 지어냈습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 비디오패스는 동시에 몇 대에서 볼 수 있어요?; FAQ 1344
- 실제 하위 #2: 그리고 월 요금은 얼마예요?; FAQ 1344, 302
- 검색 #1: 비디오패스는 동시에 몇 대에서 볼 수 있어요?
- 검색 #2: 비디오패스 월 요금은 얼마예요?

**실제로 입력된 FAQ 원문**

- FAQ 1344: 비디오패스는 어떤 서비스인가요?
> Ubot 비디오패스(월 9,900원)는 Ubot 영상 라이브러리를 1인이 이용하는 부가서비스이며 실제 OTT 제휴 상품은 아닙니다. 비디오패스로 영상을 볼 때 쓰는 데이터는 요금제에서 차감됩니다. 라이프 비디오 요금제에는 비디오패스가 포함되어 있습니다.
- FAQ 302: IPTV는 월 얼마인가요?
> IPTV 베이직 요금은 월 16,500원, 프리미엄 요금은 월 22,000원이며 두 상품 모두 셋톱박스 임대가 포함되어 있습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1344
- 원본: [results.jsonl:209](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:209](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:197](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 비디오패스는 1대에서만 볼 수 있습니다. FAQ 원문에 따르면 비디오패스는 '1인이 이용하는 부가서비스'로 기재되어 있으며, 동시에 여러 대에서 사용하는 것은 명시되어 있지 않습니다.
> 
> 비디오패스의 월 요금은 9,900원입니다. FAQ 원문에 따르면 'Ubot 비디오패스(월 9,900원)'라고 명시되어 있습니다.

**모델 본문**

> 비디오패스는 1대에서만 볼 수 있습니다. FAQ 원문에 따르면 비디오패스는 '1인이 이용하는 부가서비스'로 기재되어 있으며, 동시에 여러 대에서 사용하는 것은 명시되어 있지 않습니다.
> 
> 비디오패스의 월 요금은 9,900원입니다. FAQ 원문에 따르면 'Ubot 비디오패스(월 9,900원)'라고 명시되어 있습니다.

**Judge가 표시한 주장**

- UNSUPPORTED_GENERALIZATION: 비디오패스는 1대에서만 볼 수 있습니다.
  - 사유: FAQ의 '1인이 이용'은 동시 시청 기기 수를 뜻하지 않으며, 기기 제한은 자료에 없습니다.
- 적용 후보: [HC03](hallucination_progression.md#hc03), [HC05](hallucination_progression.md#hc05)

- 하위 #1: UNSUPPORTED_ANSWER — 1인 이용이라는 설명만으로 동시 시청 기기가 1대라고 단정할 수 없습니다.
- 하위 #2: CORRECT_ANSWER — 월 요금 9,900원을 정확히 답했습니다.
- Judge 요약: 월 요금은 근거와 일치하지만, 자료에 없는 동시 시청 기기 수를 1대로 확정했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 비디오패스는 동시에 몇 대에서 볼 수 있어요?; FAQ 1344
- 실제 하위 #2: 그리고 월 요금은 얼마예요?; FAQ 1344
- 검색 #1: 비디오패스는 동시에 몇 대에서 볼 수 있어요?
- 검색 #2: 비디오패스의 월 요금은 얼마예요?
- slot #1: ANSWER; 최종 본문에 남음
> 비디오패스는 1대에서만 볼 수 있습니다. FAQ 원문에 따르면 비디오패스는 '1인이 이용하는 부가서비스'로 기재되어 있으며, 동시에 여러 대에서 사용하는 것은 명시되어 있지 않습니다.
- slot #2: ANSWER; 최종 본문에 남음
> 비디오패스의 월 요금은 9,900원입니다. FAQ 원문에 따르면 'Ubot 비디오패스(월 9,900원)'라고 명시되어 있습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1344: 비디오패스는 어떤 서비스인가요?
> Ubot 비디오패스(월 9,900원)는 Ubot 영상 라이브러리를 1인이 이용하는 부가서비스이며 실제 OTT 제휴 상품은 아닙니다. 비디오패스로 영상을 볼 때 쓰는 데이터는 요금제에서 차감됩니다. 라이프 비디오 요금제에는 비디오패스가 포함되어 있습니다.

</details>

<a id="mp-058"></a>
## MP-058 · 로밍센터 유심 미판매·업무 한정 및 매장 검색 없음 확대

> 공항 로밍센터에서 유심도 살 수 있어요? 운영시간은 어떻게 돼요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 없음 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04), [HC06](hallucination_progression.md#hc06), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 공항 로밍센터에서 유심도 살 수 있어요? → ABSTAIN; gold FAQ 210 (gold는 실제 제공 자료와 다를 수 있음)
- #2 운영시간은 어떻게 돼요? → ANSWER; gold FAQ 210 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=2; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 있음; 실제 FAQ 210
- 원본: [results.jsonl:168](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:168](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:7](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1-store/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 공항 로밍센터에서 유심을 판매하는 서비스는 제공되지 않습니다. 운영시간은 인천공항 제1·제2여객터미널의 로밍센터가 매일 06:00~22:00까지 운영됩니다. 하지만, 근처 매장이 반경 3km 내에 없어 매장 방문이 불가능합니다.

**모델 본문**

> 공항 로밍센터에서 유심을 판매하는 서비스는 제공되지 않습니다. 운영시간은 인천공항 제1·제2여객터미널의 로밍센터가 매일 06:00~22:00까지 운영됩니다. 하지만, 근처 매장이 반경 3km 내에 없어 매장 방문이 불가능합니다.

**Judge가 표시한 주장**

- FABRICATION: 공항 로밍센터에서 유심을 판매하는 서비스는 제공되지 않습니다.
  - 사유: FAQ에는 유심 판매 여부가 나와 있지 않습니다.
- UNSUPPORTED_GENERALIZATION: 근처 매장이 반경 3km 내에 없어 매장 방문이 불가능합니다.
  - 사유: 조회 결과는 반경 3km 내 매장이 없다는 것뿐이며, 매장 방문 자체가 불가능하다는 뜻은 아닙니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04), [HC06](hallucination_progression.md#hc06), [HC05](hallucination_progression.md#hc05)

- 하위 #1: UNSUPPORTED_ANSWER — 자료에 없는 유심 판매 여부를 판매하지 않는다고 확정했습니다.
- 하위 #2: CORRECT_ANSWER — 인천공항 제1·제2여객터미널 로밍센터의 운영시간을 매일 06:00~22:00로 정확히 답했습니다.
- Judge 요약: 운영시간은 맞지만, 확인되지 않은 유심 판매 여부와 매장 방문 가능성을 단정했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 공항 로밍센터에서 유심도 살 수 있어요?; FAQ 없음
- 실제 하위 #2: 운영시간은 어떻게 돼요?; FAQ 210
- 검색 #1: 공항 로밍센터에서 유심을 살 수 있어요?
- 검색 #2: 공항 로밍센터의 운영시간은 어떻게 돼요?

**실제로 입력된 FAQ 원문**

- FAQ 210: 공항 로밍센터에서는 어떤 일을 볼 수 있나요?
> 공항 로밍센터에서는 로밍 패스 가입 상담과 로밍 설정 안내를 받을 수 있습니다. 인천공항 제1·제2여객터미널의 로밍센터는 매일 06:00~22:00 운영합니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 있음; 실제 FAQ 210
- 원본: [results.jsonl:168](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:168](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:4](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1-store/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 「공항 로밍센터에서 유심도 살 수 있어요」, 「운영시간은 어떻게 돼요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 「공항 로밍센터에서 유심도 살 수 있어요」, 「운영시간은 어떻게 돼요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_DECLINE — 유심 구매 가능 여부를 지어내지 않고 답하지 않았습니다.
- 하위 #2: MISSING_ANSWER — 자료에 있는 인천공항 로밍센터 운영시간(매일 06:00~22:00)을 답하지 않았습니다.
- Judge 요약: 모델 본문은 비어 있어 환각은 없지만, 답할 수 있는 운영시간을 누락했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 공항 로밍센터에서 유심도 살 수 있어요?; FAQ 없음
- 실제 하위 #2: 운영시간은 어떻게 돼요?; FAQ 210
- 검색 #1: 공항 로밍센터에서 유심을 살 수 있어요?
- 검색 #2: 공항 로밍센터의 운영시간은 어떻게 돼요?

**실제로 입력된 FAQ 원문**

- FAQ 210: 공항 로밍센터에서는 어떤 일을 볼 수 있나요?
> 공항 로밍센터에서는 로밍 패스 가입 상담과 로밍 설정 안내를 받을 수 있습니다. 인천공항 제1·제2여객터미널의 로밍센터는 매일 06:00~22:00 운영합니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 있음; 실제 FAQ 210
- 원본: [results.jsonl:78](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:78](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:80](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 공항 로밍센터에서 유심을 판매하는 서비스는 제공되지 않습니다. 로밍 패스 가입 상담과 로밍 설정 안내만 가능합니다.
> 
> 인천공항 제1·제2여객터미널의 로밍센터는 매일 06:00~22:00 운영합니다.

**모델 본문**

> 공항 로밍센터에서 유심을 판매하는 서비스는 제공되지 않습니다. 로밍 패스 가입 상담과 로밍 설정 안내만 가능합니다.
> 
> 인천공항 제1·제2여객터미널의 로밍센터는 매일 06:00~22:00 운영합니다.

**Judge가 표시한 주장**

- FABRICATION: 공항 로밍센터에서 유심을 판매하는 서비스는 제공되지 않으며, 로밍 패스 가입 상담과 로밍 설정 안내만 가능합니다.
  - 사유: FAQ는 두 가지 상담·안내 업무를 명시할 뿐 유심 판매 여부나 업무가 그 둘로 한정된다는 사실은 제공하지 않습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04), [HC06](hallucination_progression.md#hc06), [HC05](hallucination_progression.md#hc05)

- 하위 #1: UNSUPPORTED_ANSWER — 자료에 없는 유심 판매 여부를 판매하지 않는다고 단정했습니다.
- 하위 #2: CORRECT_ANSWER — 인천공항 제1·제2여객터미널 로밍센터의 운영시간을 정확히 답했습니다.
- Judge 요약: 운영시간은 근거와 일치하지만 유심 판매 여부는 자료에 없는데도 부정으로 확정했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 공항 로밍센터에서 유심도 살 수 있어요?; FAQ 없음
- 실제 하위 #2: 운영시간은 어떻게 돼요?; FAQ 210
- 검색 #1: 공항 로밍센터에서 유심을 살 수 있어요?
- 검색 #2: 공항 로밍센터의 운영시간은 어떻게 돼요?
- slot #1: ANSWER; 최종 본문에 남음
> 공항 로밍센터에서 유심을 판매하는 서비스는 제공되지 않습니다. 로밍 패스 가입 상담과 로밍 설정 안내만 가능합니다.
- slot #2: ANSWER; 최종 본문에 남음
> 인천공항 제1·제2여객터미널의 로밍센터는 매일 06:00~22:00 운영합니다.

**실제로 입력된 FAQ 원문**

- FAQ 210: 공항 로밍센터에서는 어떤 일을 볼 수 있나요?
> 공항 로밍센터에서는 로밍 패스 가입 상담과 로밍 설정 안내를 받을 수 있습니다. 인천공항 제1·제2여객터미널의 로밍센터는 매일 06:00~22:00 운영합니다.

</details>

<a id="mp-059"></a>
## MP-059 · 번호 변경 무료 단정과 번호이동 비용 혼동

> 번호 변경 수수료가 있어요? 그리고 뒷자리를 직접 고를 수 있어요?

- 분류: 복합·답할 수 있음+없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 환각 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC02](hallucination_progression.md#hc02), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 번호 변경 수수료가 있어요? → ABSTAIN; gold FAQ 4 (gold는 실제 제공 자료와 다를 수 있음)
- #2 뒷자리를 직접 고를 수 있어요? → ANSWER; gold FAQ 144 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=2; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 222, 1085, 4, 144, 1052
- 원본: [results.jsonl:169](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:169](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:162](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 번호 변경 시 수수료는 없으며, 약정 기간 중 이동을 하더라도 남은 기간에 해당하는 할인반환금이 청구됩니다. 뒷자리를 직접 고를 수 있습니다. 사용 가능한 번호 목록에서 뒷자리로 검색해 원하는 번호를 선택할 수 있습니다.

**모델 본문**

> 번호 변경 시 수수료는 없으며, 약정 기간 중 이동을 하더라도 남은 기간에 해당하는 할인반환금이 청구됩니다. 뒷자리를 직접 고를 수 있습니다. 사용 가능한 번호 목록에서 뒷자리로 검색해 원하는 번호를 선택할 수 있습니다.

**Judge가 표시한 주장**

- FABRICATION: 번호 변경 시 수수료는 없습니다.
  - 사유: 제공된 자료에는 번호 변경 수수료에 관한 정보가 없습니다.
- MISATTRIBUTION: 약정 기간 중 이동하면 남은 기간의 할인반환금이 청구됩니다.
  - 사유: 번호이동에 관한 FAQ 내용을 번호 변경 질문에 적용했습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC02](hallucination_progression.md#hc02), [HC05](hallucination_progression.md#hc05)

- 하위 #1: UNSUPPORTED_ANSWER — 자료에 없는 번호 변경 수수료 면제를 단정했습니다.
- 하위 #2: CORRECT_ANSWER — 사용 가능한 번호 목록에서 뒷자리로 검색해 선택할 수 있다고 정확히 답했습니다.
- Judge 요약: 뒷자리 선택 방법은 근거와 일치하지만, 수수료를 지어내고 번호이동의 청구 조건을 번호 변경 답변에 섞었습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 번호 변경 수수료가 있어요?; FAQ 222, 1085, 4
- 실제 하위 #2: 그리고 뒷자리를 직접 고를 수 있어요?; FAQ 144, 1052
- 검색 #1: 번호 변경 수수료가 있어요?
- 검색 #2: 번호 뒷자리를 직접 고를 수 있어요?

**실제로 입력된 FAQ 원문**

- FAQ 222: 약정 중에 번호이동을 하면 무엇이 청구되나요?
> 약정 기간 중 번호이동을 하면 남은 기간에 해당하는 할인반환금이 청구되며 예상 금액은 앱에서 조회할 수 있습니다. 약정 중 번호이동을 하더라도 단말 할부가 남아 있다면 할부금은 계속 청구됩니다.
- FAQ 1085: 번호이동했는데 이전 통신사에서 요금이 또 청구됐어요.
> 국제전화, 로밍, 수신자 부담 전화처럼 정산이 늦은 요금은 번호이동 후 1~2개월 뒤에도 이전 통신사에서 청구될 수 있습니다. 번호이동 후 뒤늦게 청구된 이전 통신사 요금에는 연체 가산금이 붙지 않습니다.
- FAQ 4: 휴대폰 번호를 변경하려면 어떻게 하나요?
> 휴대폰 번호 변경은 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있습니다.
- FAQ 144: 번호를 바꿀 때 뒷자리를 직접 고를 수 있나요?
> 번호 변경 시에도 사용 가능한 번호 목록에서 뒷자리로 검색해 원하는 번호를 고를 수 있습니다.
- FAQ 1052: 신규 가입할 때 원하는 번호를 고를 수 있나요?
> 신규 가입할 때 원하는 번호의 뒷자리 4자리를 가입 화면에서 검색해 사용 가능한 번호 중에서 고를 수 있습니다. 신규 가입 시 원하는 번호가 없다면 비슷한 번호를 추천해 드립니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 222, 1085, 4, 144, 1052
- 원본: [results.jsonl:169](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:169](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:158](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 번호 변경 시 약정 기간 중에 이동을 하면 남은 기간에 해당하는 할인반환금이 청구되며, 단말 할부가 남아 있다면 할부금은 계속 청구됩니다. 번호 변경 시 사용 가능한 번호 목록에서 뒷자리를 직접 검색해 원하는 번호를 고를 수 있습니다.

**모델 본문**

> 번호 변경 시 약정 기간 중에 이동을 하면 남은 기간에 해당하는 할인반환금이 청구되며, 단말 할부가 남아 있다면 할부금은 계속 청구됩니다. 번호 변경 시 사용 가능한 번호 목록에서 뒷자리를 직접 검색해 원하는 번호를 고를 수 있습니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 번호 변경 시 약정 기간 중에 이동하면 할인반환금이 청구되고 단말 할부금이 계속 청구됩니다.
  - 사유: 해당 청구 내용은 번호 변경이 아니라 약정 중 번호이동에 관한 FAQ입니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC02](hallucination_progression.md#hc02), [HC05](hallucination_progression.md#hc05)

- 하위 #1: UNSUPPORTED_ANSWER — 번호 변경 수수료는 자료에 없는데 번호이동 시 청구 항목을 번호 변경에 적용했습니다.
- 하위 #2: CORRECT_ANSWER — 사용 가능한 번호 목록에서 뒷자리를 검색해 고를 수 있다고 정확히 답했습니다.
- Judge 요약: 뒷자리 선택은 근거에 맞지만, 자료에 없는 번호 변경 수수료 질문에 번호이동 청구 내용을 잘못 적용했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 번호 변경 수수료가 있어요?; FAQ 222, 1085, 4
- 실제 하위 #2: 그리고 뒷자리를 직접 고를 수 있어요?; FAQ 144, 1052
- 검색 #1: 번호 변경 수수료가 있어요?
- 검색 #2: 번호 뒷자리를 직접 고를 수 있어요?

**실제로 입력된 FAQ 원문**

- FAQ 222: 약정 중에 번호이동을 하면 무엇이 청구되나요?
> 약정 기간 중 번호이동을 하면 남은 기간에 해당하는 할인반환금이 청구되며 예상 금액은 앱에서 조회할 수 있습니다. 약정 중 번호이동을 하더라도 단말 할부가 남아 있다면 할부금은 계속 청구됩니다.
- FAQ 1085: 번호이동했는데 이전 통신사에서 요금이 또 청구됐어요.
> 국제전화, 로밍, 수신자 부담 전화처럼 정산이 늦은 요금은 번호이동 후 1~2개월 뒤에도 이전 통신사에서 청구될 수 있습니다. 번호이동 후 뒤늦게 청구된 이전 통신사 요금에는 연체 가산금이 붙지 않습니다.
- FAQ 4: 휴대폰 번호를 변경하려면 어떻게 하나요?
> 휴대폰 번호 변경은 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있습니다.
- FAQ 144: 번호를 바꿀 때 뒷자리를 직접 고를 수 있나요?
> 번호 변경 시에도 사용 가능한 번호 목록에서 뒷자리로 검색해 원하는 번호를 고를 수 있습니다.
- FAQ 1052: 신규 가입할 때 원하는 번호를 고를 수 있나요?
> 신규 가입할 때 원하는 번호의 뒷자리 4자리를 가입 화면에서 검색해 사용 가능한 번호 중에서 고를 수 있습니다. 신규 가입 시 원하는 번호가 없다면 비슷한 번호를 추천해 드립니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=2; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 222, 1085, 4, 144, 1052
- 원본: [results.jsonl:210](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:210](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:199](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 약정 기간 중 번호이동을 하면 남은 기간에 해당하는 할인반환금이 청구되며, 단말 할부가 남아 있다면 할부금은 계속 청구됩니다. 따라서 번호 변경 수수료는 없으며, 할인반환금과 할부금의 청구가 적용됩니다.
> 
> 번호 변경 시 사용 가능한 번호 목록에서 뒷자리로 검색해 원하는 번호를 고를 수 있습니다. 신규 가입 시에도 뒷자리 4자리를 가입 화면에서 검색해 사용 가능한 번호 중에서 선택할 수 있습니다.

**모델 본문**

> 약정 기간 중 번호이동을 하면 남은 기간에 해당하는 할인반환금이 청구되며, 단말 할부가 남아 있다면 할부금은 계속 청구됩니다. 따라서 번호 변경 수수료는 없으며, 할인반환금과 할부금의 청구가 적용됩니다.
> 
> 번호 변경 시 사용 가능한 번호 목록에서 뒷자리로 검색해 원하는 번호를 고를 수 있습니다. 신규 가입 시에도 뒷자리 4자리를 가입 화면에서 검색해 사용 가능한 번호 중에서 선택할 수 있습니다.

**Judge가 표시한 주장**

- FABRICATION: 번호 변경 수수료는 없습니다.
  - 사유: 제공된 자료에 번호 변경 수수료 정보가 없습니다.
- MISATTRIBUTION: 번호 변경에 할인반환금과 단말 할부금 청구가 적용됩니다.
  - 사유: 해당 청구 내용은 약정 중 번호이동에 관한 FAQ이며 번호 변경에 관한 내용이 아닙니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC02](hallucination_progression.md#hc02), [HC05](hallucination_progression.md#hc05)

- 하위 #1: UNSUPPORTED_ANSWER — 자료에 없는 번호 변경 수수료 면제를 단정하고 번호이동 청구 내용을 적용했습니다.
- 하위 #2: CORRECT_ANSWER — 사용 가능한 번호 목록에서 뒷자리로 검색해 고를 수 있다고 정확히 답했습니다.
- Judge 요약: 뒷자리 선택은 정확하지만 수수료를 지어내고 번호이동 청구 내용을 번호 변경에 잘못 적용했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 번호 변경 수수료가 있어요?; FAQ 222, 1085, 4
- 실제 하위 #2: 그리고 뒷자리를 직접 고를 수 있어요?; FAQ 144, 1052
- 검색 #1: 번호 변경 수수료가 있어요?
- 검색 #2: 번호 뒷자리를 직접 고를 수 있어요?
- slot #1: ANSWER; 최종 본문에 남음
> 약정 기간 중 번호이동을 하면 남은 기간에 해당하는 할인반환금이 청구되며, 단말 할부가 남아 있다면 할부금은 계속 청구됩니다. 따라서 번호 변경 수수료는 없으며, 할인반환금과 할부금의 청구가 적용됩니다.
- slot #2: ANSWER; 최종 본문에 남음
> 번호 변경 시 사용 가능한 번호 목록에서 뒷자리로 검색해 원하는 번호를 고를 수 있습니다. 신규 가입 시에도 뒷자리 4자리를 가입 화면에서 검색해 사용 가능한 번호 중에서 선택할 수 있습니다.

**실제로 입력된 FAQ 원문**

- FAQ 222: 약정 중에 번호이동을 하면 무엇이 청구되나요?
> 약정 기간 중 번호이동을 하면 남은 기간에 해당하는 할인반환금이 청구되며 예상 금액은 앱에서 조회할 수 있습니다. 약정 중 번호이동을 하더라도 단말 할부가 남아 있다면 할부금은 계속 청구됩니다.
- FAQ 1085: 번호이동했는데 이전 통신사에서 요금이 또 청구됐어요.
> 국제전화, 로밍, 수신자 부담 전화처럼 정산이 늦은 요금은 번호이동 후 1~2개월 뒤에도 이전 통신사에서 청구될 수 있습니다. 번호이동 후 뒤늦게 청구된 이전 통신사 요금에는 연체 가산금이 붙지 않습니다.
- FAQ 4: 휴대폰 번호를 변경하려면 어떻게 하나요?
> 휴대폰 번호 변경은 본인 인증 후 홈페이지, 고객센터 또는 매장에서 신청할 수 있습니다.
- FAQ 144: 번호를 바꿀 때 뒷자리를 직접 고를 수 있나요?
> 번호 변경 시에도 사용 가능한 번호 목록에서 뒷자리로 검색해 원하는 번호를 고를 수 있습니다.
- FAQ 1052: 신규 가입할 때 원하는 번호를 고를 수 있나요?
> 신규 가입할 때 원하는 번호의 뒷자리 4자리를 가입 화면에서 검색해 사용 가능한 번호 중에서 고를 수 있습니다. 신규 가입 시 원하는 번호가 없다면 비슷한 번호를 추천해 드립니다.

</details>

<a id="mt-003"></a>
## MT-003 · 이전 턴 로밍 상품을 국내 요금제로 바꿈

> 데이터를 다 쓰면요?

- 분류: 멀티턴 · 주된 주장 영역: 대화 대상 연결
- 변화: **없음 → 환각 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC08](hallucination_progression.md#hc08), [HC02](hallucination_progression.md#hc02)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.
- 이전 사용자 질문: 로밍 상품 요금은 얼마예요?
- 재검토: 세 안의 검색 FAQ와 국내 요금제 설명이 거의 같음에도 sub만 실질적 환각 판정. 공식 통계는 유지하되 slot이 이 문제를 해결했다고 해석하지 않음.

**기대 하위 질문**

- #1 데이터를 다 쓰면요? → ANSWER; gold FAQ 1299 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1201, 19, 1221
- 원본: [results.jsonl:173](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:173](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:165](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 데이터를 다 쓰면 요금제에 따라 처리가 다릅니다. 대부분의 5G 요금제는 데이터를 다 쓰면 0.4~5Mbps의 속도로 제한되지만 추가 요금 없이 계속 이용할 수 있습니다. 실속 LTE·태블릿·워치 요금제는 데이터를 다 쓰면 차단됩니다. 로밍 상품을 사용하지 않으면 해외에서 하루 데이터 요금이 11,000원을 넘으면 그날은 추가 과금 없이 속도가 제한됩니다. 데이터를 다 쓰고 더 빠른 속도로 사용하고 싶다면 데이터 플러스 상품을 추가해 주세요.

**모델 본문**

> 데이터를 다 쓰면 요금제에 따라 처리가 다릅니다. 대부분의 5G 요금제는 데이터를 다 쓰면 0.4~5Mbps의 속도로 제한되지만 추가 요금 없이 계속 이용할 수 있습니다. 실속 LTE·태블릿·워치 요금제는 데이터를 다 쓰면 차단됩니다. 로밍 상품을 사용하지 않으면 해외에서 하루 데이터 요금이 11,000원을 넘으면 그날은 추가 과금 없이 속도가 제한됩니다. 데이터를 다 쓰고 더 빠른 속도로 사용하고 싶다면 데이터 플러스 상품을 추가해 주세요.

- 하위 #1: WRONG_ANSWER — 로밍 상품의 데이터 소진 후 차단·추가 요금 없음·다음 구간 재사용을 답하지 않고 다른 요금제의 처리 방식을 설명했습니다.
- Judge 요약: 답변의 개별 사실은 받은 FAQ에 있지만, 사용자가 물은 로밍 상품의 데이터 소진 후 처리에 대한 답은 아닙니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 데이터를 다 쓰면요?; FAQ 1201, 19, 1221
- 검색 #1: 데이터를 다 쓰면 요금은 어떻게 되나요?
- 이전 사용자: 로밍 상품 요금은 얼마예요?
> 로밍 상품 요금은 국가와 관계없이 데이터 사용 24시간 구간마다 베이직 1GB 11,000원, 플러스 2GB 13,000원, 맥스 5GB 15,000원입니다. 로밍 상품은 데이터를 쓴 24시간 구간에만 요금이 부과되며 음성통화와 문자 요금은 포함되지 않습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1201: 데이터를 다 쓰면 어떻게 되나요?
> 데이터를 모두 사용한 뒤의 처리 방식은 요금제마다 다릅니다. 대부분의 5G 요금제는 데이터를 다 쓰면 0.4~5Mbps의 정해진 속도로 추가 요금 없이 계속 이용할 수 있습니다. 실속 LTE·태블릿·워치 요금제는 데이터를 모두 쓰면 차단됩니다. 데이터 소진 뒤 더 빠른 속도로 쓰고 싶다면 데이터 플러스 상품을 추가해 주세요.
- FAQ 19: 데이터를 모두 사용하면 어떻게 되나요?
> 데이터를 모두 사용한 뒤의 처리 방식은 요금제에 따라 다르며, 데이터가 차단되거나 추가 요금이 부과되거나 속도가 제한될 수 있습니다.
- FAQ 1221: 데이터 요금이 과도하게 나오지 않게 막는 장치가 있나요?
> Ubot 국내 데이터 요금제는 기본 데이터를 다 쓰면 속도 제한이나 차단으로 전환되어 추가 데이터 요금이 발생하지 않습니다. 로밍 상품 없이 해외에서 데이터를 사용해 하루 요금이 11,000원을 넘으면 그날은 추가 과금 없이 속도가 제한됩니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1201, 19, 1221
- 원본: [results.jsonl:173](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:173](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:162](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 데이터를 다 쓰면 요금제에 따라 처리가 다릅니다. 대부분의 5G 요금제는 데이터를 다 쓰면 0.4~5Mbps의 정해진 속도로 추가 요금 없이 계속 이용할 수 있습니다. 실속 LTE·태블릿·워치 요금제는 데이터를 모두 쓰면 차단됩니다. 데이터 소진 후 더 빠른 속도로 쓰고 싶다면 데이터 플러스 상품을 추가해 주세요. 로밍 상품 없이 해외에서 데이터를 사용해 하루 요금이 11,000원을 넘으면 그날은 추가 과금 없이 속도가 제한됩니다.

**모델 본문**

> 데이터를 다 쓰면 요금제에 따라 처리가 다릅니다. 대부분의 5G 요금제는 데이터를 다 쓰면 0.4~5Mbps의 정해진 속도로 추가 요금 없이 계속 이용할 수 있습니다. 실속 LTE·태블릿·워치 요금제는 데이터를 모두 쓰면 차단됩니다. 데이터 소진 후 더 빠른 속도로 쓰고 싶다면 데이터 플러스 상품을 추가해 주세요. 로밍 상품 없이 해외에서 데이터를 사용해 하루 요금이 11,000원을 넘으면 그날은 추가 과금 없이 속도가 제한됩니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 로밍 상품 데이터를 다 쓴 경우에 5G·LTE 등 국내 요금제별 소진 후 처리 방식이 적용되는 것처럼 설명함
  - 사유: 받은 FAQ의 해당 설명은 국내 요금제에 관한 것이며, 이전 대화의 대상은 로밍 상품입니다.
- 적용 후보: [HC08](hallucination_progression.md#hc08), [HC02](hallucination_progression.md#hc02)

- 하위 #1: WRONG_ANSWER — 로밍 상품의 데이터 소진 후 차단·추가 요금 없음·다음 구간 재제공을 답하지 않고 국내 요금제 기준으로 설명했습니다.
- Judge 요약: 답변은 받은 FAQ 내용을 인용했지만 로밍 상품에 관한 핵심 질문에는 다른 대상의 정보를 적용했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 데이터를 다 쓰면요?; FAQ 1201, 19, 1221
- 검색 #1: 데이터를 다 쓰면 요금은 어떻게 되나요?
- 이전 사용자: 로밍 상품 요금은 얼마예요?
> 로밍 상품 요금은 국가와 관계없이 데이터 사용 24시간 구간마다 베이직 1GB 11,000원, 플러스 2GB 13,000원, 맥스 5GB 15,000원입니다. 로밍 상품은 데이터를 쓴 24시간 구간에만 요금이 부과되며 음성통화와 문자 요금은 포함되지 않습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1201: 데이터를 다 쓰면 어떻게 되나요?
> 데이터를 모두 사용한 뒤의 처리 방식은 요금제마다 다릅니다. 대부분의 5G 요금제는 데이터를 다 쓰면 0.4~5Mbps의 정해진 속도로 추가 요금 없이 계속 이용할 수 있습니다. 실속 LTE·태블릿·워치 요금제는 데이터를 모두 쓰면 차단됩니다. 데이터 소진 뒤 더 빠른 속도로 쓰고 싶다면 데이터 플러스 상품을 추가해 주세요.
- FAQ 19: 데이터를 모두 사용하면 어떻게 되나요?
> 데이터를 모두 사용한 뒤의 처리 방식은 요금제에 따라 다르며, 데이터가 차단되거나 추가 요금이 부과되거나 속도가 제한될 수 있습니다.
- FAQ 1221: 데이터 요금이 과도하게 나오지 않게 막는 장치가 있나요?
> Ubot 국내 데이터 요금제는 기본 데이터를 다 쓰면 속도 제한이나 차단으로 전환되어 추가 데이터 요금이 발생하지 않습니다. 로밍 상품 없이 해외에서 데이터를 사용해 하루 요금이 11,000원을 넘으면 그날은 추가 과금 없이 속도가 제한됩니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1201, 19, 1221
- 원본: [results.jsonl:213](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:213](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:205](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 데이터를 다 쓰면 요금제에 따라 처리가 다릅니다. 대부분의 5G 요금제는 데이터를 다 쓰면 0.4~5Mbps의 속도로 제한되지만 추가 요금 없이 계속 이용할 수 있습니다. 실속 LTE·태블릿·워치 요금제는 데이터를 다 쓰면 차단됩니다. 데이터 소진 후 빠른 속도를 원한다면 데이터 플러스 상품을 추가해야 합니다. 로밍 상품 없이 해외에서 데이터를 사용해 하루 요금이 11,000원을 넘으면 그날은 추가 과금 없이 속도가 제한됩니다.

**모델 본문**

> 데이터를 다 쓰면 요금제에 따라 처리가 다릅니다. 대부분의 5G 요금제는 데이터를 다 쓰면 0.4~5Mbps의 속도로 제한되지만 추가 요금 없이 계속 이용할 수 있습니다. 실속 LTE·태블릿·워치 요금제는 데이터를 다 쓰면 차단됩니다. 데이터 소진 후 빠른 속도를 원한다면 데이터 플러스 상품을 추가해야 합니다. 로밍 상품 없이 해외에서 데이터를 사용해 하루 요금이 11,000원을 넘으면 그날은 추가 과금 없이 속도가 제한됩니다.

- 하위 #1: WRONG_ANSWER — 이전 대화의 로밍 상품 데이터 소진을 묻는데, 국내 요금제와 로밍 상품 미가입 시의 처리 방식으로 답했습니다.
- Judge 요약: 답변의 개별 사실은 제공된 FAQ에 있지만, 질문 대상인 로밍 상품의 데이터 차단·추가 요금 없음·다음 구간 재사용을 답하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 데이터를 다 쓰면요?; FAQ 1201, 19, 1221
- 검색 #1: 데이터를 다 쓰면 요금은 어떻게 되나요?
- 이전 사용자: 로밍 상품 요금은 얼마예요?
> 로밍 상품 요금은 국가와 관계없이 데이터 사용 24시간 구간마다 베이직 1GB 11,000원, 플러스 2GB 13,000원, 맥스 5GB 15,000원입니다. 로밍 상품은 데이터를 쓴 24시간 구간에만 요금이 부과되며 음성통화와 문자 요금은 포함되지 않습니다.
- slot #1: ANSWER; 최종 본문에 남음
> 데이터를 다 쓰면 요금제에 따라 처리가 다릅니다. 대부분의 5G 요금제는 데이터를 다 쓰면 0.4~5Mbps의 속도로 제한되지만 추가 요금 없이 계속 이용할 수 있습니다. 실속 LTE·태블릿·워치 요금제는 데이터를 다 쓰면 차단됩니다. 데이터 소진 후 빠른 속도를 원한다면 데이터 플러스 상품을 추가해야 합니다. 로밍 상품 없이 해외에서 데이터를 사용해 하루 요금이 11,000원을 넘으면 그날은 추가 과금 없이 속도가 제한됩니다.

**실제로 입력된 FAQ 원문**

- FAQ 1201: 데이터를 다 쓰면 어떻게 되나요?
> 데이터를 모두 사용한 뒤의 처리 방식은 요금제마다 다릅니다. 대부분의 5G 요금제는 데이터를 다 쓰면 0.4~5Mbps의 정해진 속도로 추가 요금 없이 계속 이용할 수 있습니다. 실속 LTE·태블릿·워치 요금제는 데이터를 모두 쓰면 차단됩니다. 데이터 소진 뒤 더 빠른 속도로 쓰고 싶다면 데이터 플러스 상품을 추가해 주세요.
- FAQ 19: 데이터를 모두 사용하면 어떻게 되나요?
> 데이터를 모두 사용한 뒤의 처리 방식은 요금제에 따라 다르며, 데이터가 차단되거나 추가 요금이 부과되거나 속도가 제한될 수 있습니다.
- FAQ 1221: 데이터 요금이 과도하게 나오지 않게 막는 장치가 있나요?
> Ubot 국내 데이터 요금제는 기본 데이터를 다 쓰면 속도 제한이나 차단으로 전환되어 추가 데이터 요금이 발생하지 않습니다. 로밍 상품 없이 해외에서 데이터를 사용해 하루 요금이 11,000원을 넘으면 그날은 추가 과금 없이 속도가 제한됩니다.

</details>

<a id="mt-006"></a>
## MT-006 · 청년 무제한 지시 대상을 다이렉트 61로 연결

> 그 요금제 무제한은 월 얼마예요?

- 분류: 멀티턴 · 주된 주장 영역: 대화 대상 연결
- 변화: **환각 → 없음 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC08](hallucination_progression.md#hc08), [HC02](hallucination_progression.md#hc02), [HC03](hallucination_progression.md#hc03)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.
- 이전 사용자 질문: 청년 요금제는 몇 살까지 가입할 수 있어요?

**기대 하위 질문**

- #1 그 요금제 무제한은 월 얼마예요? → ANSWER; gold FAQ 1114, 1128 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1128, 69
- 원본: [results.jsonl:176](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:176](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:166](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 그 요금제 무제한은 월 61,000원입니다. 다이렉트 61 요금제가 데이터 무제한 요금제 중 하나이며, 이 요금제는 온라인 전용입니다. 만 19~34세라면 청년 무제한(월 65,000원)도 이용할 수 있습니다. 그러나 사용자가 특정 요금제를 지칭하고 있는지 명확하지 않아 정확한 금액을 확정할 수 없습니다.

**모델 본문**

> 그 요금제 무제한은 월 61,000원입니다. 다이렉트 61 요금제가 데이터 무제한 요금제 중 하나이며, 이 요금제는 온라인 전용입니다. 만 19~34세라면 청년 무제한(월 65,000원)도 이용할 수 있습니다. 그러나 사용자가 특정 요금제를 지칭하고 있는지 명확하지 않아 정확한 금액을 확정할 수 없습니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 그 요금제 무제한은 월 61,000원입니다.
  - 사유: 월 61,000원은 다이렉트 61의 가격이며, 이전 대화가 가리키는 청년 무제한은 월 65,000원입니다.
- 적용 후보: [HC08](hallucination_progression.md#hc08), [HC02](hallucination_progression.md#hc02), [HC03](hallucination_progression.md#hc03)

- 하위 #1: WRONG_ANSWER — 이전 대화의 청년 요금제 무제한은 월 65,000원인데, 첫 문장에서 다이렉트 61의 월 61,000원을 답으로 제시했습니다.
- Judge 요약: 청년 무제한의 가격을 뒤에서 언급했지만, 앞에서 다른 요금제의 가격을 답으로 확정하고 끝에서는 금액을 확정할 수 없다고 해 핵심 답이 모순됩니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 그 요금제 무제한은 월 얼마예요?; FAQ 1128, 69
- 검색 #1: 그 요금제 무제한은 월 얼마예요?
- 이전 사용자: 청년 요금제는 몇 살까지 가입할 수 있어요?
> 청년 요금제는 만 19세부터 34세까지 가입할 수 있으며, 만 35세가 되는 달 말일까지 이용할 수 있습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1128: 데이터를 많이 쓰는데 무제한 요금제가 있나요?
> 속도 제한 없이 고속 데이터를 무제한으로 쓰는 요금제는 다이렉트 61(월 61,000원, 온라인 전용)·69, 베이직 80·100, 데이터 MAX, 프리미엄 89~Max, 플러스 95~130 등이 있습니다. 만 19~34세라면 청년 무제한(월 65,000원)도 이용할 수 있으며 무제한 요금제의 테더링 한도는 상품별로 월 40GB~140GB입니다.
- FAQ 69: 데이터 무제한 요금제가 있나요?
> 데이터 무제한 또는 일정 사용 후 속도 제한형 요금제가 있습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1128, 69
- 원본: [results.jsonl:176](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:176](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:165](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: MISSING_ANSWER — 제공된 FAQ에 청년 무제한 요금이 월 65,000원으로 나와 있지만 모델은 답하지 않았습니다.
- Judge 요약: 모델 본문은 빈 문자열이므로 답변 누락이며, 시스템 고정 안내는 모델의 주장으로 평가하지 않습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 그 요금제 무제한은 월 얼마예요?; FAQ 1128, 69
- 검색 #1: 그 요금제 무제한은 월 얼마예요?
- 이전 사용자: 청년 요금제는 몇 살까지 가입할 수 있어요?
> 청년 요금제는 만 19세부터 34세까지 가입할 수 있으며, 만 35세가 되는 달 말일까지 이용할 수 있습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1128: 데이터를 많이 쓰는데 무제한 요금제가 있나요?
> 속도 제한 없이 고속 데이터를 무제한으로 쓰는 요금제는 다이렉트 61(월 61,000원, 온라인 전용)·69, 베이직 80·100, 데이터 MAX, 프리미엄 89~Max, 플러스 95~130 등이 있습니다. 만 19~34세라면 청년 무제한(월 65,000원)도 이용할 수 있으며 무제한 요금제의 테더링 한도는 상품별로 월 40GB~140GB입니다.
- FAQ 69: 데이터 무제한 요금제가 있나요?
> 데이터 무제한 또는 일정 사용 후 속도 제한형 요금제가 있습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1128, 69
- 원본: [results.jsonl:80](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:80](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:79](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: MISSING_ANSWER — 받은 FAQ에 청년 무제한 요금이 월 65,000원으로 나와 있지만 모델은 답하지 않았습니다.
- Judge 요약: 모델 본문은 빈 문자열이며, 시스템 고정 안내는 답변이나 환각 판정에 포함하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 그 요금제 무제한은 월 얼마예요?; FAQ 1128, 69
- 검색 #1: 그 요금제 무제한은 월 얼마예요?
- 이전 사용자: 청년 요금제는 몇 살까지 가입할 수 있어요?
> 청년 요금제는 만 19세부터 34세까지 가입할 수 있으며, 만 35세가 되는 달 말일까지 이용할 수 있습니다.
- slot #1: ABSTAIN; 최종 본문에서 제거
> 그 요금제 무제한은 월 61,000원부터 130,000원까지 다양하게 제공되며, 만 19~34세라면 청년 무제한(월 65,000원)도 가능합니다. 다만, 요금제는 상품별로 차이가 있으므로 구체적인 상품을 확인해야 합니다.

**실제로 입력된 FAQ 원문**

- FAQ 1128: 데이터를 많이 쓰는데 무제한 요금제가 있나요?
> 속도 제한 없이 고속 데이터를 무제한으로 쓰는 요금제는 다이렉트 61(월 61,000원, 온라인 전용)·69, 베이직 80·100, 데이터 MAX, 프리미엄 89~Max, 플러스 95~130 등이 있습니다. 만 19~34세라면 청년 무제한(월 65,000원)도 이용할 수 있으며 무제한 요금제의 테더링 한도는 상품별로 월 40GB~140GB입니다.
- FAQ 69: 데이터 무제한 요금제가 있나요?
> 데이터 무제한 또는 일정 사용 후 속도 제한형 요금제가 있습니다.

</details>

<a id="mt-012"></a>
## MT-012 · 복지 감면액을 매장·고객센터가 확인·공지한다는 확대

> 그럼 얼마나 감면돼요?

- 분류: 멀티턴 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 없음 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC02](hallucination_progression.md#hc02), [HC04](hallucination_progression.md#hc04)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.
- 이전 사용자 질문: 복지 할인은 누가 받을 수 있어요?
- 재검토: 비슷한 고객센터·매장 확인 권고가 세 안에 남는데 single·slot만 실질적 환각. 확정된 금액 공지와 일반 확인 권고의 경계를 Judge 재교정할 필요.

**기대 하위 질문**

- #1 그럼 얼마나 감면돼요? → ABSTAIN; gold FAQ 1492, 1156 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: search_queries_changed, previous_model_answers_changed
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1156, 1492
- 원본: [results.jsonl:182](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:182](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:174](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 복지 할인 금액은 대상별로 다릅니다. 예를 들어, 장애인, 국가유공자, 기초생활수급자, 차상위계층, 기초연금 수급자 등 각각의 자격에 따라 감면액이 달라지며, 구체적인 금액은 대상에 따라 다릅니다. 정확한 금액은 매장이나 고객센터에서 자격 확인 후 안내받을 수 있습니다.

**모델 본문**

> 복지 할인 금액은 대상별로 다릅니다. 예를 들어, 장애인, 국가유공자, 기초생활수급자, 차상위계층, 기초연금 수급자 등 각각의 자격에 따라 감면액이 달라지며, 구체적인 금액은 대상에 따라 다릅니다. 정확한 금액은 매장이나 고객센터에서 자격 확인 후 안내받을 수 있습니다.

**Judge가 표시한 주장**

- UNSUPPORTED_GENERALIZATION: 정확한 금액은 매장이나 고객센터에서 자격 확인 후 안내받을 수 있습니다.
  - 사유: 자료에는 매장·고객센터 신청과 자격 확인만 있으며, 정확한 금액을 그곳에서 안내한다는 내용은 없습니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC04](hallucination_progression.md#hc04)

- 하위 #1: CORRECT_DECLINE — 자료에 없는 감면액을 지어내지 않고 대상별로 다르다고만 설명했습니다.
- Judge 요약: 감면액을 확정하지 않아 거절 판정은 맞지만, 정확한 금액의 안내 경로를 근거 없이 단정했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 그럼 얼마나 감면돼요?; FAQ 1156, 1492
- 검색 #1: 복지 할인의 감면 금액은 얼마나 되나요?
- 이전 사용자: 복지 할인은 누가 받을 수 있어요?
> 복지 할인은 장애인, 국가유공자, 기초생활수급자, 차상위계층, 기초연금 수급자에게 받을 수 있습니다. 복지 할인은 매장이나 고객센터에서 신청하여 정부 자격을 확인 후 적용됩니다.

**실제로 입력된 FAQ 원문**

- FAQ 1156: 복지 할인은 어떻게 받나요?
> 기초생활수급자, 장애인, 국가유공자 등 복지 할인 대상자는 매장이나 고객센터에서 신청하면 요금제와 관계없이 월 요금을 감면받을 수 있습니다. 복지 할인 대상 자격은 1년마다 다시 확인하며 자격이 없어지면 할인이 종료됩니다.
- FAQ 1492: 복지 할인 대상은 누구인가요?
> 복지 할인 대상은 장애인, 국가유공자, 기초생활수급자, 차상위계층, 기초연금 수급자입니다. 복지 할인 금액은 대상별로 다릅니다. 복지 할인은 매장이나 고객센터에서 신청하면 정부 자격 확인 후 적용됩니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1156, 1492
- 원본: [results.jsonl:182](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:182](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:171](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 복지 할인 금액은 대상별로 다릅니다. 구체적인 금액은 대상자별로 달라서, 자세한 정보는 고객센터나 매장에서 확인해야 합니다.

**모델 본문**

> 복지 할인 금액은 대상별로 다릅니다. 구체적인 금액은 대상자별로 달라서, 자세한 정보는 고객센터나 매장에서 확인해야 합니다.

- 하위 #1: CORRECT_DECLINE — 자료에 없는 감면 금액을 지어내지 않고 대상별로 다르다고만 안내했습니다.
- Judge 요약: 모델 답변은 제공된 FAQ의 범위에 머물렀고, 검색어만 질문의 값을 금액에서 감면률로 변경했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 그럼 얼마나 감면돼요?; FAQ 1156, 1492
- 검색 #1: 복지 할인의 감면률은 얼마나 되나요?
- 이전 사용자: 복지 할인은 누가 받을 수 있어요?
> 복지 할인은 장애인, 국가유공자, 기초생활수급자, 차상위계층, 기초연금 수급자에게 받을 수 있습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1156: 복지 할인은 어떻게 받나요?
> 기초생활수급자, 장애인, 국가유공자 등 복지 할인 대상자는 매장이나 고객센터에서 신청하면 요금제와 관계없이 월 요금을 감면받을 수 있습니다. 복지 할인 대상 자격은 1년마다 다시 확인하며 자격이 없어지면 할인이 종료됩니다.
- FAQ 1492: 복지 할인 대상은 누구인가요?
> 복지 할인 대상은 장애인, 국가유공자, 기초생활수급자, 차상위계층, 기초연금 수급자입니다. 복지 할인 금액은 대상별로 다릅니다. 복지 할인은 매장이나 고객센터에서 신청하면 정부 자격 확인 후 적용됩니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1156, 1492
- 원본: [results.jsonl:221](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:221](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:210](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 복지 할인 금액은 대상별로 다릅니다. 예를 들어, 장애인, 국가유공자, 기초생활수급자, 차상위계층, 기초연금 수급자 등 각각의 자격에 따라 감면액이 달라지며, 정확한 금액은 자격 확인 후 고객센터나 매장에서 공지됩니다.

**모델 본문**

> 복지 할인 금액은 대상별로 다릅니다. 예를 들어, 장애인, 국가유공자, 기초생활수급자, 차상위계층, 기초연금 수급자 등 각각의 자격에 따라 감면액이 달라지며, 정확한 금액은 자격 확인 후 고객센터나 매장에서 공지됩니다.

**Judge가 표시한 주장**

- FABRICATION: 정확한 금액은 자격 확인 후 고객센터나 매장에서 공지됩니다.
  - 사유: 자료에는 신청과 자격 확인 절차만 있고, 감면액을 언제 어디서 공지하는지는 없습니다.
- 적용 후보: [HC02](hallucination_progression.md#hc02), [HC04](hallucination_progression.md#hc04)

- 하위 #1: CORRECT_DECLINE — 감면액을 지어내지 않고 대상별로 다르다고만 답했습니다.
- Judge 요약: 금액 자체는 답하지 않아 거절 판정이 맞지만, 금액 공지 절차를 근거 없이 덧붙였습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 그럼 얼마나 감면돼요?; FAQ 1156, 1492
- 검색 #1: 복지 할인의 감면률은 얼마나 되나요?
- 이전 사용자: 복지 할인은 누가 받을 수 있어요?
> 복지 할인은 장애인, 국가유공자, 기초생활수급자, 차상위계층, 기초연금 수급자에게 받을 수 있습니다.
- slot #1: ANSWER; 최종 본문에 남음
> 복지 할인 금액은 대상별로 다릅니다. 예를 들어, 장애인, 국가유공자, 기초생활수급자, 차상위계층, 기초연금 수급자 등 각각의 자격에 따라 감면액이 달라지며, 정확한 금액은 자격 확인 후 고객센터나 매장에서 공지됩니다.

**실제로 입력된 FAQ 원문**

- FAQ 1156: 복지 할인은 어떻게 받나요?
> 기초생활수급자, 장애인, 국가유공자 등 복지 할인 대상자는 매장이나 고객센터에서 신청하면 요금제와 관계없이 월 요금을 감면받을 수 있습니다. 복지 할인 대상 자격은 1년마다 다시 확인하며 자격이 없어지면 할인이 종료됩니다.
- FAQ 1492: 복지 할인 대상은 누구인가요?
> 복지 할인 대상은 장애인, 국가유공자, 기초생활수급자, 차상위계층, 기초연금 수급자입니다. 복지 할인 금액은 대상별로 다릅니다. 복지 할인은 매장이나 고객센터에서 신청하면 정부 자격 확인 후 적용됩니다.

</details>

<a id="mt-016"></a>
## MT-016 · 임대폰을 본인 휴대폰으로 재작성하고 ANSWER 칸에 보험·할부금 혼입

> 며칠 무료예요? 그리고 잃어버리면 변상금은 얼마예요?

- 분류: 멀티턴 · 주된 주장 영역: 대화 대상 연결
- 변화: **없음 → 없음 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC08](hallucination_progression.md#hc08), [HC02](hallucination_progression.md#hc02), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.
- 이전 사용자 질문: 임대폰 빌릴 수 있어요?

**기대 하위 질문**

- #1 며칠 무료예요? → ANSWER; gold FAQ 1394, 1456 (gold는 실제 제공 자료와 다를 수 있음)
- #2 잃어버리면 변상금은 얼마예요? → ABSTAIN; gold FAQ 1456 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: search_queries_changed, previous_model_answers_changed
- 입력 차이 sub_slot: faq_set_changed, sub_question_input_changed, search_queries_changed, context_sections_changed, previous_model_answers_changed
- 입력 차이 v4sub_slot: faq_set_changed, sub_question_input_changed, search_queries_changed, context_sections_changed, previous_model_answers_changed

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1456
- 원본: [results.jsonl:186](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:186](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:173](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 최초 7일은 무료입니다. 이후 하루 2,200원이 청구됩니다. 분실 시 변상금은 정해진 금액이 청구되지만, 그 금액은 FAQ에 명시되어 있지 않습니다.

**모델 본문**

> 최초 7일은 무료입니다. 이후 하루 2,200원이 청구됩니다. 분실 시 변상금은 정해진 금액이 청구되지만, 그 금액은 FAQ에 명시되어 있지 않습니다.

- 하위 #1: CORRECT_ANSWER — 임대폰의 최초 7일 무료 기간을 정확히 답했습니다.
- 하위 #2: CORRECT_DECLINE — 변상금 액수가 FAQ에 없음을 밝히고 금액을 지어내지 않았습니다.
- Judge 요약: 답변의 무료 기간과 변상금 안내가 제공된 FAQ에 부합하며, 검색어도 두 질문의 의미를 유지합니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 며칠 무료예요?; FAQ 없음
- 실제 하위 #2: 그리고 잃어버리면 변상금은 얼마예요?; FAQ 1456
- 검색 #1: 임대폰 최초 무료 기간은 몇 일인가요?
- 검색 #2: 임대폰을 잃어버리면 변상금은 얼마인가요?
- 이전 사용자: 임대폰 빌릴 수 있어요?
> 임대폰을 빌릴 수 있습니다. 수리 기간이나 분실 시에는 휴대폰 수리 접수증 또는 분실 신고 내역을 보여 주면 Ubot 매장에서 임대폰을 빌릴 수 있습니다. 또한, 새 휴대폰을 마련하기 전까지는 고객센터나 방문 예정 매장에서 신청 대상과 이용 기간, 비용을 확인한 후 임대폰을 이용할 수 있습니다. 최초 7일은 무료이며, 이후 하루 2,200원이 청구됩니다.

**실제로 입력된 FAQ 원문**

- FAQ 1456: 분실한 동안 쓸 임대폰을 빌릴 수 있나요?
> 분실 신고 후 Ubot 매장에서 신분증을 보여 주면 임대폰을 빌릴 수 있습니다. 분실 시 빌린 임대폰은 최초 7일 무료이고 이후 하루 2,200원이 청구됩니다. 임대폰을 잃어버리거나 파손하면 정해진 변상금이 청구됩니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1456
- 원본: [results.jsonl:186](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:186](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:172](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 최초 7일은 무료입니다. 이후 하루 2,200원이 청구됩니다. 그러나 분실 시 정해진 변상금이 청구되며, 그 금액은 FAQ에서 명시되어 있지 않습니다. 변상금의 구체적인 금액은 고객센터나 매장에서 확인해야 합니다.
> 
> 「그리고 잃어버리면 변상금은 얼마예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 최초 7일은 무료입니다. 이후 하루 2,200원이 청구됩니다. 그러나 분실 시 정해진 변상금이 청구되며, 그 금액은 FAQ에서 명시되어 있지 않습니다. 변상금의 구체적인 금액은 고객센터나 매장에서 확인해야 합니다.

**코드 고정 안내**

> 「그리고 잃어버리면 변상금은 얼마예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_ANSWER — 임대폰의 최초 7일 무료 기간을 정확히 안내했습니다.
- 하위 #2: CORRECT_DECLINE — 변상금 금액이 자료에 없음을 밝히고 금액을 지어내지 않았습니다.
- Judge 요약: 두 질문 모두 이전 대화의 임대폰을 대상으로 해석했고, 답변과 검색어가 자료 및 질문에 부합합니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 며칠 무료예요?; FAQ 없음
- 실제 하위 #2: 그리고 잃어버리면 변상금은 얼마예요?; FAQ 1456
- 검색 #1: 임대폰 무료 기간은 몇 일인가요?
- 검색 #2: 임대폰을 잃어버리면 변상금은 얼마인가요?
- 이전 사용자: 임대폰 빌릴 수 있어요?
> 임대폰을 빌릴 수 있습니다. 휴대폰 수리 또는 분실 시 경우, Ubot 매장에서 접수증이나 신분증을 제시하면 임대폰을 빌릴 수 있습니다. 최초 7일은 무료이며, 이후 하루 2,200원이 청구됩니다. 다만, 새 휴대폰을 마련하기 전까지 이용할 수 있는지 여부는 고객센터나 매장에서 직접 확인해야 합니다.

**실제로 입력된 FAQ 원문**

- FAQ 1456: 분실한 동안 쓸 임대폰을 빌릴 수 있나요?
> 분실 신고 후 Ubot 매장에서 신분증을 보여 주면 임대폰을 빌릴 수 있습니다. 분실 시 빌린 임대폰은 최초 7일 무료이고 이후 하루 2,200원이 청구됩니다. 임대폰을 잃어버리거나 파손하면 정해진 변상금이 청구됩니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 230, 1457
- 원본: [results.jsonl:81](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:81](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:83](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 최초 7일은 무료로 임대폰을 이용할 수 있습니다. 분실 시에는 단말 할부금이 기기 사용 여부와 관계없이 남은 금액이 계속 청구되며, 보험 보상은 분실일로부터 60일 안에 접수해야 하며 경찰 분실·도난 신고 접수증과 자기부담금이 필요합니다. 그러나 변상금 금액에 대한 구체적인 금액은 FAQ에 명시되어 있지 않습니다.
> 
> 「그리고 잃어버리면 변상금은 얼마예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 최초 7일은 무료로 임대폰을 이용할 수 있습니다. 분실 시에는 단말 할부금이 기기 사용 여부와 관계없이 남은 금액이 계속 청구되며, 보험 보상은 분실일로부터 60일 안에 접수해야 하며 경찰 분실·도난 신고 접수증과 자기부담금이 필요합니다. 그러나 변상금 금액에 대한 구체적인 금액은 FAQ에 명시되어 있지 않습니다.

**코드 고정 안내**

> 「그리고 잃어버리면 변상금은 얼마예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**Judge가 표시한 주장**

- MISATTRIBUTION: 분실 시 단말 할부금이 계속 청구되고 보험 보상을 60일 안에 접수해야 한다는 내용을 임대폰 분실 질문에 연결한 부분
  - 사유: 해당 자료는 분실한 본인 휴대폰의 할부금과 보험에 관한 것으로, 임대폰 분실 변상금에는 적용할 근거가 없습니다.
- 적용 후보: [HC08](hallucination_progression.md#hc08), [HC02](hallucination_progression.md#hc02), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_ANSWER — 임대폰은 최초 7일 무료라고 정확히 답했습니다.
- 하위 #2: CORRECT_DECLINE — 변상금 금액을 지어내지 않고 자료에 없다고 안내했습니다.
- Judge 요약: 무료 기간과 변상금 금액에 대한 판정은 맞지만, 답변에 다른 휴대폰 분실 절차를 임대폰 질문과 혼동한 내용이 있습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 며칠 무료예요?; FAQ 없음
- 실제 하위 #2: 그리고 잃어버리면 변상금은 얼마예요?; FAQ 230, 1457
- 검색 #1: 임대폰 무료 이용 기간은 몇 일인가요?
- 검색 #2: 휴대폰을 잃어버리면 변상금은 얼마인가요?
- 이전 사용자: 임대폰 빌릴 수 있어요?
> 예, 수리 기간이나 분실 시에 임대폰을 빌릴 수 있습니다. 수리 기간 또는 분실 신고 후 Ubot 매장에 휴대폰 수리 접수증이나 분실 신고 내역을 제시하면 임대폰을 빌릴 수 있고, 최초 7일은 무료이며 이후 하루 2,200원이 청구됩니다. 또한, 새 휴대폰을 마련하기 전까지는 고객센터나 방문 예정 매장에서 신청 대상, 재고, 이용 기간 및 비용을 확인해 주어야 합니다. 임대폰을 이용할 수 있다면 회선과 유심을 임대 기기에 연결하는 절차를 안내받을 수 있습니다.
- slot #1: ANSWER; 최종 본문에 남음
> 최초 7일은 무료로 임대폰을 이용할 수 있습니다. 분실 시에는 단말 할부금이 기기 사용 여부와 관계없이 남은 금액이 계속 청구되며, 보험 보상은 분실일로부터 60일 안에 접수해야 하며 경찰 분실·도난 신고 접수증과 자기부담금이 필요합니다. 그러나 변상금 금액에 대한 구체적인 금액은 FAQ에 명시되어 있지 않습니다.
- slot #2: ABSTAIN; 최종 본문에서 제거
> 변상금에 대한 금액은 FAQ에 명시되어 있지 않으며, 분실 보험은 분실일로부터 6이나 60일 안에 접수해야 하며 경찰 분실·도난 신고 접수증과 자기부담금이 필요합니다. 그러나 보험 보상 금액은 제공된 자료에 포함되어 있지 않습니다.

**실제로 입력된 FAQ 원문**

- FAQ 230: 잃어버린 휴대폰의 할부금은 어떻게 되나요?
> 분실한 휴대폰의 단말 할부금은 기기 사용 여부와 관계없이 남은 금액이 계속 청구됩니다. 분실한 휴대폰의 할부금을 한 번에 정리하려면 앱이나 매장에서 중도 완납할 수 있습니다.
- FAQ 1457: 휴대폰 보험으로 분실 보상을 받으려면 어떻게 하나요?
> 휴대폰 분실 신고 후 보험사 고객센터나 Ubot 앱의 보험 메뉴에서 분실 보상을 접수해 주세요. 휴대폰 분실 보험은 분실일로부터 60일 안에 접수해야 하며 경찰 분실·도난 신고 접수증과 자기부담금이 필요합니다.

</details>

<a id="mt-028"></a>
## MT-028 · 거기가 가리키는 로밍센터의 유심 판매 여부

> 거기서 유심도 팔아요?

- 분류: 멀티턴 · 주된 주장 영역: FAQ 사실·정책
- 변화: **없음 → 미판정 → 환각** · 공통 339문항 포함: 아니오
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC08](hallucination_progression.md#hc08)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.
- 이전 사용자 질문: 공항 로밍센터는 어디 있어요?

**기대 하위 질문**

- #1 거기서 유심도 팔아요? → ABSTAIN; gold FAQ 210 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: faq_set_changed, sub_question_input_changed, search_queries_changed, previous_model_answers_changed
- 입력 차이 sub_slot: faq_set_changed, sub_question_input_changed, search_queries_changed, previous_model_answers_changed
- 입력 차이 v4sub_slot: faq_set_changed, sub_question_input_changed, search_queries_changed, previous_model_answers_changed

### v1 single

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 있음; 실제 FAQ 없음
- 원본: [results.jsonl:198](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:198](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:5](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1-store/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 공항 로밍센터에서 유심을 팔는지에 대한 정보가 없습니다.

**모델 본문**

> 공항 로밍센터에서 유심을 팔는지에 대한 정보가 없습니다.

- 하위 #1: CORRECT_DECLINE — 유심 판매 여부를 확인할 자료가 없어 답하지 않았습니다.
- Judge 요약: 모델은 자료에 없는 유심 판매 여부를 지어내지 않았고, 검색어도 이전 대화의 로밍센터를 올바르게 가리킵니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 거기서 유심도 팔아요?; FAQ 없음
- 검색 #1: 인천공항 제1·제2여객터미널의 로밍센터에서 유심도 팔아요?
- 이전 사용자: 공항 로밍센터는 어디 있어요?
> 인천공항 제1·제2여객터미널의 로밍센터는 운영 중이지만, 근처 매장 정보가 없습니다.

</details>

### v1 sub

- 경로: LLM-005; 최종 status: null; 하위 status: 없음; status 배열 검증: false
- 판정: 미판정; grounding=—; accuracy=미판정
- 입력 섹션: 없음; 매장 연동: 있음; 실제 FAQ 210
- 원본: [results.jsonl:198](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:198](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · 미판정

**실제 사용자 답변**

> (실행 실패/답변 없음)

**모델 본문**

> (빈 answer — 통계 분모에 포함)


<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 거기서 유심도 팔아요?; FAQ 210
- 검색 #1: 공항 로밍센터에서 유심도 팔아요?
- 이전 사용자: 공항 로밍센터는 어디 있어요?
> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

**실제로 입력된 FAQ 원문**

- FAQ 210: 공항 로밍센터에서는 어떤 일을 볼 수 있나요?
> 공항 로밍센터에서는 로밍 패스 가입 상담과 로밍 설정 안내를 받을 수 있습니다. 인천공항 제1·제2여객터미널의 로밍센터는 매일 06:00~22:00 운영합니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=1; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 있음; 실제 FAQ 없음
- 원본: [results.jsonl:234](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:234](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:220](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 공항 로밍센터에서는 유심을 팔지 않습니다.

**모델 본문**

> 공항 로밍센터에서는 유심을 팔지 않습니다.

**Judge가 표시한 주장**

- FABRICATION: 공항 로밍센터에서는 유심을 팔지 않습니다.
  - 사유: 챗봇이 받은 자료에 유심 판매 여부에 관한 근거가 없습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC08](hallucination_progression.md#hc08)

- 하위 #1: UNSUPPORTED_ANSWER — 유심 판매 여부는 자료에 없는데 판매하지 않는다고 단정했습니다.
- Judge 요약: 이전 대화의 공항 로밍센터를 올바르게 지칭했지만, 모델은 근거 없는 유심 판매 여부를 확정했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 거기서 유심도 팔아요?; FAQ 없음
- 검색 #1: 인천공항 제1·제2여객터미널의 로밍센터에서 유심을 팔아요?
- 이전 사용자: 공항 로밍센터는 어디 있어요?
> 인천공항 제1·제2여객터미널의 로밍센터는 매일 06:00~22:00 운영합니다. 하지만 근처 매장이 없습니다.
- slot #1: ANSWER; 최종 본문에 남음
> 공항 로밍센터에서는 유심을 팔지 않습니다.

</details>

<a id="os-016"></a>
## OS-016 · 13,000원 요금 앞에 음수 부호 생성

> 오늘 날씨 어때요? 그리고 로밍 상품 요금도 알려 주세요.

- 분류: 범위 밖 포함 · 주된 주장 영역: 출력 값·포맷
- 변화: **없음 → 없음 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC10](hallucination_progression.md#hc10)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 오늘 날씨 어때요? → OUT_OF_SCOPE; gold FAQ 없음 (gold는 실제 제공 자료와 다를 수 있음)
- #2 로밍 상품 요금도 알려 주세요. → ANSWER; gold FAQ 1297 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: context_sections_changed
- 입력 차이 v4sub_slot: context_sections_changed

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1297
- 원본: [results.jsonl:216](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:216](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:186](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 로밍 상품 요금은 국가와 관계없이 데이터 사용 24시간 구간마다 베이직 1GB 11,000원, 플러스 2GB 13,000원, 맥스 5GB 15,000원입니다. 로밍 상품은 데이터를 쓴 24시간 구간에만 요금이 부과되며 음성통화와 문자 요금은 포함되지 않습니다. 그러나 오늘 날씨에 대한 정보는 제공된 자료에 없습니다.

**모델 본문**

> 로밍 상품 요금은 국가와 관계없이 데이터 사용 24시간 구간마다 베이직 1GB 11,000원, 플러스 2GB 13,000원, 맥스 5GB 15,000원입니다. 로밍 상품은 데이터를 쓴 24시간 구간에만 요금이 부과되며 음성통화와 문자 요금은 포함되지 않습니다. 그러나 오늘 날씨에 대한 정보는 제공된 자료에 없습니다.

- 하위 #1: CORRECT_DECLINE — 날씨 정보가 자료에 없다고 안내하고 날씨를 답하지 않았습니다.
- 하위 #2: CORRECT_ANSWER — 로밍 요금과 과금 조건, 음성·문자 제외 사항을 FAQ와 일치하게 답했습니다.
- Judge 요약: 모델 답변은 날씨 질문을 적절히 거절하고 로밍 요금을 제공된 FAQ에 근거해 정확히 안내했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 오늘 날씨 어때요?; FAQ 없음
- 실제 하위 #2: 그리고 로밍 상품 요금도 알려 주세요.; FAQ 1297
- 검색 #1: 오늘 날씨 어때요?
- 검색 #2: 로밍 상품 요금도 알려 주세요

**실제로 입력된 FAQ 원문**

- FAQ 1297: 로밍 상품 요금은 얼마인가요?
> 로밍 상품 요금은 국가와 관계없이 데이터 사용 24시간 구간마다 베이직 1GB 11,000원, 플러스 2GB 13,000원, 맥스 5GB 15,000원입니다. 로밍 상품은 데이터를 쓴 24시간 구간에만 요금이 부과되며 음성통화와 문자 요금은 포함되지 않습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ABSTAIN, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1297
- 원본: [results.jsonl:216](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:216](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:184](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 「오늘 날씨 어때요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 「오늘 날씨 어때요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_DECLINE — 날씨에는 답하지 않았고 시스템 고정 안내가 붙었습니다.
- 하위 #2: MISSING_ANSWER — FAQ에 요금이 있지만 모델이 답하지 않았습니다.
- Judge 요약: 모델 본문이 비어 있어 로밍 요금 답변이 누락됐으며, 근거 없는 주장도 없습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 오늘 날씨 어때요?; FAQ 없음
- 실제 하위 #2: 그리고 로밍 상품 요금도 알려 주세요.; FAQ 1297
- 검색 #1: 오늘 날씨 어때요?
- 검색 #2: 로밍 상품 요금도 알려 주세요

**실제로 입력된 FAQ 원문**

- FAQ 1297: 로밍 상품 요금은 얼마인가요?
> 로밍 상품 요금은 국가와 관계없이 데이터 사용 24시간 구간마다 베이직 1GB 11,000원, 플러스 2GB 13,000원, 맥스 5GB 15,000원입니다. 로밍 상품은 데이터를 쓴 24시간 구간에만 요금이 부과되며 음성통화와 문자 요금은 포함되지 않습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ABSTAIN, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1297
- 원본: [results.jsonl:85](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:85](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:84](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 로밍 상품 요금은 국가와 관계없이 데이터 사용 24시간 구간마다 베이직 1GB 11,000원, 플러스 2GB -13,000원, 맥스 5GB 15,000원입니다. 로밍 상품은 데이터를 쓴 24시간 구간에만 요금이 부과되며 음성통화와 문자 요금은 포함되지 않습니다.
> 
> 「오늘 날씨 어때요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 로밍 상품 요금은 국가와 관계없이 데이터 사용 24시간 구간마다 베이직 1GB 11,000원, 플러스 2GB -13,000원, 맥스 5GB 15,000원입니다. 로밍 상품은 데이터를 쓴 24시간 구간에만 요금이 부과되며 음성통화와 문자 요금은 포함되지 않습니다.

**코드 고정 안내**

> 「오늘 날씨 어때요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**Judge가 표시한 주장**

- FABRICATION: 플러스 2GB -13,000원
  - 사유: 제공된 FAQ의 플러스 2GB 요금은 13,000원이며 음수 요금은 근거가 없습니다.
- 적용 후보: [HC10](hallucination_progression.md#hc10)

- 하위 #1: CORRECT_DECLINE — 날씨에는 모델이 답하지 않았고 시스템 고정 안내가 붙었습니다.
- 하위 #2: WRONG_ANSWER — 플러스 2GB 요금을 13,000원이 아닌 -13,000원으로 잘못 적었습니다.
- Judge 요약: 날씨는 답하지 않아 적절하지만, 로밍 요금의 핵심 수치 하나를 잘못 전달했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 오늘 날씨 어때요?; FAQ 없음
- 실제 하위 #2: 그리고 로밍 상품 요금도 알려 주세요.; FAQ 1297
- 검색 #1: 오늘 날씨 어때요?
- 검색 #2: 로밍 상품 요금도 알려 주세요
- slot #1: ABSTAIN; 최종 본문에서 제거
> 오늘 날씨에 대한 정보는 제공된 자료에 없습니다.
- slot #2: ANSWER; 최종 본문에 남음
> 로밍 상품 요금은 국가와 관계없이 데이터 사용 24시간 구간마다 베이직 1GB 11,000원, 플러스 2GB -13,000원, 맥스 5GB 15,000원입니다. 로밍 상품은 데이터를 쓴 24시간 구간에만 요금이 부과되며 음성통화와 문자 요금은 포함되지 않습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1297: 로밍 상품 요금은 얼마인가요?
> 로밍 상품 요금은 국가와 관계없이 데이터 사용 24시간 구간마다 베이직 1GB 11,000원, 플러스 2GB 13,000원, 맥스 5GB 15,000원입니다. 로밍 상품은 데이터를 쓴 24시간 구간에만 요금이 부과되며 음성통화와 문자 요금은 포함되지 않습니다.

</details>

<a id="sa-022"></a>
## SA-022 · 사용 전 전액 환불에서 사용 후·출국 후 불가 역추론

> 여행이 취소되면 쓰지 않은 로밍 패스를 환불받을 수 있나요?

- 분류: 단일·답할 수 있음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 환각 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 여행이 취소되면 쓰지 않은 로밍 패스를 환불받을 수 있나요? → ANSWER; gold FAQ 197 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: context_sections_changed
- 입력 차이 v4sub_slot: context_sections_changed

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 197
- 원본: [results.jsonl:252](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:252](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:224](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 여행이 취소되어 출국하지 않았고 로밍 패스 사용이 시작되지 않았다면, 가입을 취소하고 전액 환불받을 수 있습니다. 그러나 로밍 패스 사용이 이미 시작된 경우 또는 출국 후 취소된 경우는 환불이 불가능합니다. 사용 전 로밍 패스 취소는 앱이나 고객센터에서 신청해야 합니다.

**모델 본문**

> 여행이 취소되어 출국하지 않았고 로밍 패스 사용이 시작되지 않았다면, 가입을 취소하고 전액 환불받을 수 있습니다. 그러나 로밍 패스 사용이 이미 시작된 경우 또는 출국 후 취소된 경우는 환불이 불가능합니다. 사용 전 로밍 패스 취소는 앱이나 고객센터에서 신청해야 합니다.

**Judge가 표시한 주장**

- FABRICATION: 로밍 패스 사용이 이미 시작된 경우 또는 출국 후 취소된 경우는 환불이 불가능합니다.
  - 사유: 제공된 FAQ는 사용 전 전액 환불 조건만 명시하며, 그 밖의 경우 환불 불가 여부는 밝히지 않습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04)

- 하위 #1: CORRECT_ANSWER — 출국하지 않았고 사용이 시작되지 않았다면 전액 환불받을 수 있다는 핵심 조건과 신청 방법을 맞게 답했습니다.
- Judge 요약: 질문의 핵심에는 올바르게 답했지만, 자료에 없는 환불 불가 조건을 단정했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 여행이 취소되면 쓰지 않은 로밍 패스를 환불받을 수 있나요?; FAQ 197
- 검색 #1: 여행이 취소되면 쓰지 않은 로밍 패스를 환불받을 수 있나요?

**실제로 입력된 FAQ 원문**

- FAQ 197: 여행이 취소됐는데 로밍 패스는 어떻게 하나요?
> 여행이 취소되어 출국하지 않았고 로밍 패스 사용이 시작되지 않았다면 가입을 취소하고 전액 환불받을 수 있습니다. 사용 전 로밍 패스 취소는 앱이나 고객센터에서 신청해 주세요.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 197
- 원본: [results.jsonl:252](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:252](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:223](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 여행이 취소되어 출국하지 않았고 로밍 패스 사용이 시작되지 않았다면 가입을 취소하고 전액 환불받을 수 있습니다. 그러나 로밍 패스 사용이 이미 시작된 경우 또는 출국 후 취소된 경우는 환불이 불가능합니다. 사용 전 로밍 패스 취소는 앱이나 고객센터에서 신청해야 합니다.

**모델 본문**

> 여행이 취소되어 출국하지 않았고 로밍 패스 사용이 시작되지 않았다면 가입을 취소하고 전액 환불받을 수 있습니다. 그러나 로밍 패스 사용이 이미 시작된 경우 또는 출국 후 취소된 경우는 환불이 불가능합니다. 사용 전 로밍 패스 취소는 앱이나 고객센터에서 신청해야 합니다.

**Judge가 표시한 주장**

- UNSUPPORTED_GENERALIZATION: 로밍 패스 사용이 이미 시작된 경우 또는 출국 후 취소된 경우는 환불이 불가능합니다.
  - 사유: FAQ는 미출국·사용 전 취소의 환불 가능 여부만 밝히며, 다른 경우의 환불 불가 여부는 명시하지 않습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04)

- 하위 #1: CORRECT_ANSWER — 출국하지 않았고 사용이 시작되지 않은 경우 전액 환불받을 수 있다는 핵심 조건과 신청 방법을 맞게 답했습니다.
- Judge 요약: 질문의 핵심에는 정확히 답했지만, 자료에 없는 환불 불가 조건을 단정했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 여행이 취소되면 쓰지 않은 로밍 패스를 환불받을 수 있나요?; FAQ 197
- 검색 #1: 여행이 취소되면 쓰지 않은 로밍 패스를 환불받을 수 있나요?

**실제로 입력된 FAQ 원문**

- FAQ 197: 여행이 취소됐는데 로밍 패스는 어떻게 하나요?
> 여행이 취소되어 출국하지 않았고 로밍 패스 사용이 시작되지 않았다면 가입을 취소하고 전액 환불받을 수 있습니다. 사용 전 로밍 패스 취소는 앱이나 고객센터에서 신청해 주세요.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 197
- 원본: [results.jsonl:272](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:272](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:243](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 여행이 취소되어 출국하지 않았고 로밍 패스 사용이 시작되지 않았다면 가입을 취소하고 전액 환불받을 수 있습니다. 사용 전 로밍 패스 취소는 앱이나 고객센터에서 신청해 주세요.

**모델 본문**

> 여행이 취소되어 출국하지 않았고 로밍 패스 사용이 시작되지 않았다면 가입을 취소하고 전액 환불받을 수 있습니다. 사용 전 로밍 패스 취소는 앱이나 고객센터에서 신청해 주세요.

- 하위 #1: CORRECT_ANSWER — 출국하지 않았고 사용이 시작되지 않은 경우 전액 환불과 신청 방법을 정확히 안내했습니다.
- Judge 요약: 답변의 조건, 환불 범위, 신청 방법이 제공된 FAQ와 일치합니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 여행이 취소되면 쓰지 않은 로밍 패스를 환불받을 수 있나요?; FAQ 197
- 검색 #1: 여행이 취소되면 쓰지 않은 로밍 패스를 환불받을 수 있나요?
- slot #1: ANSWER; 최종 본문에 남음
> 여행이 취소되어 출국하지 않았고 로밍 패스 사용이 시작되지 않았다면 가입을 취소하고 전액 환불받을 수 있습니다. 사용 전 로밍 패스 취소는 앱이나 고객센터에서 신청해 주세요.

**실제로 입력된 FAQ 원문**

- FAQ 197: 여행이 취소됐는데 로밍 패스는 어떻게 하나요?
> 여행이 취소되어 출국하지 않았고 로밍 패스 사용이 시작되지 않았다면 가입을 취소하고 전액 환불받을 수 있습니다. 사용 전 로밍 패스 취소는 앱이나 고객센터에서 신청해 주세요.

</details>

<a id="sb-004"></a>
## SB-004 · 제조사 정책 준수를 제조사별 보증 기간 차이로 확대

> 휴대폰 무상 수리 기간은 몇 년이에요?

- 분류: 단일·묻는 값 없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **없음 → 없음 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 휴대폰 무상 수리 기간은 몇 년이에요? → ABSTAIN; gold FAQ 1014 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1014, 1395
- 원본: [results.jsonl:284](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:284](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:256](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 휴대폰 무상 수리 기간은 제조사 보증 정책을 따르므로, 통신사에서 명시된 기간이 없습니다. 무상 수리 기간과 범위는 제조사의 보증 정책에 따라 달라지며, 통신사 매장에서의 수리는 이루어지지 않습니다. 따라서 정확한 기간은 제조사의 보증 정책을 확인해야 합니다.

**모델 본문**

> 휴대폰 무상 수리 기간은 제조사 보증 정책을 따르므로, 통신사에서 명시된 기간이 없습니다. 무상 수리 기간과 범위는 제조사의 보증 정책에 따라 달라지며, 통신사 매장에서의 수리는 이루어지지 않습니다. 따라서 정확한 기간은 제조사의 보증 정책을 확인해야 합니다.

- 하위 #1: CORRECT_DECLINE — 자료에 없는 무상 수리 연수를 제시하지 않고 제조사 보증 정책을 확인하도록 안내했습니다.
- Judge 요약: 답변은 제공된 FAQ에 근거하며, 확인되지 않은 수리 기간을 지어내지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 휴대폰 무상 수리 기간은 몇 년이에요?; FAQ 1014, 1395
- 검색 #1: 휴대폰 무상 수리 기간은 몇 년이에요?

**실제로 입력된 FAQ 원문**

- FAQ 1014: 휴대폰을 사고 얼마 동안 무상 수리를 받을 수 있나요?
> 휴대폰 무상 수리 기간과 범위는 제조사 보증 정책을 따르며 수리는 통신사 매장이 아닌 제조사 서비스센터에서 접수합니다. 휴대폰이 고의나 부주의로 파손됐다면 무상 보증 기간에도 유상 수리일 수 있습니다.
- FAQ 1395: 새로 산 휴대폰이 불량이에요.
> 새 휴대폰이 불량이라면 개통일을 포함해 14일 안에 제조사 서비스센터에서 불량 판정을 받아 새 제품으로 교환하거나 개통을 철회할 수 있습니다. 불량 휴대폰의 교환·철회는 불량 확인서를 가지고 구매한 매장이나 고객센터에 신청해 주세요.

</details>

### v1 sub

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1014, 1395
- 원본: [results.jsonl:284](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:284](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:254](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_DECLINE — 무상 수리 기간의 연수는 자료에 없어 답하지 않았습니다.
- Judge 요약: 모델 본문은 비어 있고, 시스템 고정 안내는 환각이나 본문의 안내로 세지 않습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 휴대폰 무상 수리 기간은 몇 년이에요?; FAQ 1014, 1395
- 검색 #1: 휴대폰 무상 수리 기간은 몇 년이에요?

**실제로 입력된 FAQ 원문**

- FAQ 1014: 휴대폰을 사고 얼마 동안 무상 수리를 받을 수 있나요?
> 휴대폰 무상 수리 기간과 범위는 제조사 보증 정책을 따르며 수리는 통신사 매장이 아닌 제조사 서비스센터에서 접수합니다. 휴대폰이 고의나 부주의로 파손됐다면 무상 보증 기간에도 유상 수리일 수 있습니다.
- FAQ 1395: 새로 산 휴대폰이 불량이에요.
> 새 휴대폰이 불량이라면 개통일을 포함해 14일 안에 제조사 서비스센터에서 불량 판정을 받아 새 제품으로 교환하거나 개통을 철회할 수 있습니다. 불량 휴대폰의 교환·철회는 불량 확인서를 가지고 구매한 매장이나 고객센터에 신청해 주세요.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1014, 1395
- 원본: [results.jsonl:299](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:299](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:272](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 휴대폰 무상 수리 기간은 제조사 보증 정책을 따르므로 정확한 기간은 제조사별로 다릅니다. 통신사 매장에서의 수리는 포함되지 않으며, 제조사 서비스센터에서만 접수됩니다.

**모델 본문**

> 휴대폰 무상 수리 기간은 제조사 보증 정책을 따르므로 정확한 기간은 제조사별로 다릅니다. 통신사 매장에서의 수리는 포함되지 않으며, 제조사 서비스센터에서만 접수됩니다.

**Judge가 표시한 주장**

- UNSUPPORTED_GENERALIZATION: 정확한 기간은 제조사별로 다릅니다.
  - 사유: 자료에는 제조사 보증 정책을 따른다고만 되어 있고 제조사별 기간 차이는 확인되지 않습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04)

- 하위 #1: CORRECT_DECLINE — 자료에 없는 무상 수리 연수를 지어내지 않았습니다.
- Judge 요약: 연수 답변은 삼갔지만 제조사별 기간이 다르다는 근거 없는 설명을 덧붙였습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 휴대폰 무상 수리 기간은 몇 년이에요?; FAQ 1014, 1395
- 검색 #1: 휴대폰 무상 수리 기간은 몇 년이에요?
- slot #1: ANSWER; 최종 본문에 남음
> 휴대폰 무상 수리 기간은 제조사 보증 정책을 따르므로 정확한 기간은 제조사별로 다릅니다. 통신사 매장에서의 수리는 포함되지 않으며, 제조사 서비스센터에서만 접수됩니다.

**실제로 입력된 FAQ 원문**

- FAQ 1014: 휴대폰을 사고 얼마 동안 무상 수리를 받을 수 있나요?
> 휴대폰 무상 수리 기간과 범위는 제조사 보증 정책을 따르며 수리는 통신사 매장이 아닌 제조사 서비스센터에서 접수합니다. 휴대폰이 고의나 부주의로 파손됐다면 무상 보증 기간에도 유상 수리일 수 있습니다.
- FAQ 1395: 새로 산 휴대폰이 불량이에요.
> 새 휴대폰이 불량이라면 개통일을 포함해 14일 안에 제조사 서비스센터에서 불량 판정을 받아 새 제품으로 교환하거나 개통을 철회할 수 있습니다. 불량 휴대폰의 교환·철회는 불량 확인서를 가지고 구매한 매장이나 고객센터에 신청해 주세요.

</details>

<a id="sb-025"></a>
## SB-025 · 친구 추천 최대 3명 생성

> 친구 추천은 몇 명까지 할 수 있어요?

- 분류: 단일·묻는 값 없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 없음 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC03](hallucination_progression.md#hc03)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 친구 추천은 몇 명까지 할 수 있어요? → ABSTAIN; gold FAQ 1367 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=1; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1367
- 원본: [results.jsonl:305](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:305](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:273](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 친구 추천은 3명까지 가능합니다. 그러나 제공된 FAQ에서는 친구 추천의 수에 대한 명시적인 정보가 없고, '3개월 이상 이용하면'이라는 조건은 추천한 친구의 이용 기간에 관한 것이며, 추천 가능한 친구의 최대 수는 언급되어 있지 않습니다. 따라서 친구 추천 가능 수에 대한 정확한 정보는 확정할 수 없습니다.

**모델 본문**

> 친구 추천은 3명까지 가능합니다. 그러나 제공된 FAQ에서는 친구 추천의 수에 대한 명시적인 정보가 없고, '3개월 이상 이용하면'이라는 조건은 추천한 친구의 이용 기간에 관한 것이며, 추천 가능한 친구의 최대 수는 언급되어 있지 않습니다. 따라서 친구 추천 가능 수에 대한 정확한 정보는 확정할 수 없습니다.

**Judge가 표시한 주장**

- FABRICATION: 친구 추천은 3명까지 가능합니다.
  - 사유: 제공된 FAQ에는 추천 가능한 친구의 최대 인원이 없습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC03](hallucination_progression.md#hc03)

- 하위 #1: UNSUPPORTED_ANSWER — FAQ에 없는 추천 가능 인원을 3명으로 단정했습니다.
- Judge 요약: 뒤에서 확정할 수 없다고 밝혔지만, 첫 문장에서 근거 없는 최대 인원을 답했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 친구 추천은 몇 명까지 할 수 있어요?; FAQ 1367
- 검색 #1: 친구 추천은 몇 명까지 할 수 있어요?

**실제로 입력된 FAQ 원문**

- FAQ 1367: 친구를 추천하면 혜택이 있나요?
> Ubot 앱의 친구 추천 링크로 가입한 친구가 3개월 이상 이용하면 추천한 사람과 친구 모두에게 5,000포인트를 드립니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1367
- 원본: [results.jsonl:305](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:305](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:273](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_DECLINE — 추천 가능 인원은 자료에 없어 답하지 않았습니다.
- Judge 요약: 모델 본문은 비어 있으며, 시스템 고정 안내는 환각이나 본문 안내로 평가하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 친구 추천은 몇 명까지 할 수 있어요?; FAQ 1367
- 검색 #1: 친구 추천은 몇 명까지 할 수 있어요?

**실제로 입력된 FAQ 원문**

- FAQ 1367: 친구를 추천하면 혜택이 있나요?
> Ubot 앱의 친구 추천 링크로 가입한 친구가 3개월 이상 이용하면 추천한 사람과 친구 모두에게 5,000포인트를 드립니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1367
- 원본: [results.jsonl:320](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:320](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:289](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_DECLINE — 추천 가능 인원은 자료에 없어 답하지 않았습니다.
- Judge 요약: 모델 본문은 비어 있으며, 시스템 고정 안내는 환각이나 모델의 안내 문장으로 세지 않습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 친구 추천은 몇 명까지 할 수 있어요?; FAQ 1367
- 검색 #1: 친구 추천은 몇 명까지 할 수 있어요?
- slot #1: ABSTAIN; 최종 본문에서 제거
> 친구 추천은 3명까지 가능합니다. 친구를 추천하면 추천한 사람과 친구 모두에게 5,000포인트를 드립니다.

**실제로 입력된 FAQ 원문**

- FAQ 1367: 친구를 추천하면 혜택이 있나요?
> Ubot 앱의 친구 추천 링크로 가입한 친구가 3개월 이상 이용하면 추천한 사람과 친구 모두에게 5,000포인트를 드립니다.

</details>

<a id="sb-034"></a>
## SB-034 · 공항 로밍센터 유심 미판매 단정

> 공항 로밍센터에서 유심도 살 수 있어요?

- 분류: 단일·묻는 값 없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 없음 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 공항 로밍센터에서 유심도 살 수 있어요? → ABSTAIN; gold FAQ 210 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=1; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 210
- 원본: [results.jsonl:314](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:314](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:282](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 공항 로밍센터에서는 유심을 판매하거나 구매할 수는 없습니다. 로밍 패스 가입 상담과 로밍 설정 안내를 받을 수 있습니다.

**모델 본문**

> 공항 로밍센터에서는 유심을 판매하거나 구매할 수는 없습니다. 로밍 패스 가입 상담과 로밍 설정 안내를 받을 수 있습니다.

**Judge가 표시한 주장**

- FABRICATION: 공항 로밍센터에서는 유심을 판매하거나 구매할 수는 없습니다.
  - 사유: FAQ에는 로밍 상담과 설정 안내만 나와 있으며 유심 판매 여부는 제시되지 않습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01)

- 하위 #1: UNSUPPORTED_ANSWER — 자료에 없는 유심 판매 불가 여부를 확정해 답했습니다.
- Judge 요약: 유심 구매 가능 여부는 자료로 판단할 수 없는데, 모델이 불가능하다고 단정했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 공항 로밍센터에서 유심도 살 수 있어요?; FAQ 210
- 검색 #1: 공항 로밍센터에서 유심도 살 수 있어요?

**실제로 입력된 FAQ 원문**

- FAQ 210: 공항 로밍센터에서는 어떤 일을 볼 수 있나요?
> 공항 로밍센터에서는 로밍 패스 가입 상담과 로밍 설정 안내를 받을 수 있습니다. 인천공항 제1·제2여객터미널의 로밍센터는 매일 06:00~22:00 운영합니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 210
- 원본: [results.jsonl:314](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:314](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:281](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_DECLINE — 유심 구매 가능 여부를 지어내지 않았습니다.
- Judge 요약: 모델 본문은 비어 있고, 시스템 고정 안내는 답변 및 환각 판정 대상이 아닙니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 공항 로밍센터에서 유심도 살 수 있어요?; FAQ 210
- 검색 #1: 공항 로밍센터에서 유심도 살 수 있어요?

**실제로 입력된 FAQ 원문**

- FAQ 210: 공항 로밍센터에서는 어떤 일을 볼 수 있나요?
> 공항 로밍센터에서는 로밍 패스 가입 상담과 로밍 설정 안내를 받을 수 있습니다. 인천공항 제1·제2여객터미널의 로밍센터는 매일 06:00~22:00 운영합니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=1; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 210
- 원본: [results.jsonl:329](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:329](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:295](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 공항 로밍센터에서는 유심을 판매하거나 구매할 수는 없습니다. 로밍 패스 가입 상담과 로밍 설정 안내를 받을 수 있습니다.

**모델 본문**

> 공항 로밍센터에서는 유심을 판매하거나 구매할 수는 없습니다. 로밍 패스 가입 상담과 로밍 설정 안내를 받을 수 있습니다.

**Judge가 표시한 주장**

- FABRICATION: 공항 로밍센터에서는 유심을 판매하거나 구매할 수 없습니다.
  - 사유: 제공된 FAQ에는 유심 판매 여부가 나와 있지 않습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01)

- 하위 #1: UNSUPPORTED_ANSWER — 자료에 없는 유심 판매 불가 여부를 확정해 답했습니다.
- Judge 요약: 로밍 상담·설정 안내는 근거가 있지만, 핵심 질문인 유심 구매 가능 여부를 근거 없이 부정했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 공항 로밍센터에서 유심도 살 수 있어요?; FAQ 210
- 검색 #1: 공항 로밍센터에서 유심도 살 수 있어요?
- slot #1: ANSWER; 최종 본문에 남음
> 공항 로밍센터에서는 유심을 판매하거나 구매할 수는 없습니다. 로밍 패스 가입 상담과 로밍 설정 안내를 받을 수 있습니다.

**실제로 입력된 FAQ 원문**

- FAQ 210: 공항 로밍센터에서는 어떤 일을 볼 수 있나요?
> 공항 로밍센터에서는 로밍 패스 가입 상담과 로밍 설정 안내를 받을 수 있습니다. 인천공항 제1·제2여객터미널의 로밍센터는 매일 06:00~22:00 운영합니다.

</details>

<a id="sb-035"></a>
## SB-035 · 키즈 안심 요금제 소진 후 속도 제한 단정

> 키즈 안심 요금제는 데이터를 다 쓰면 속도가 어떻게 돼요?

- 분류: 단일·묻는 값 없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **없음 → 환각 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC02](hallucination_progression.md#hc02)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 키즈 안심 요금제는 데이터를 다 쓰면 속도가 어떻게 돼요? → ABSTAIN; gold FAQ 1116 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: context_sections_changed
- 입력 차이 v4sub_slot: context_sections_changed

### v1 single

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1129, 167
- 원본: [results.jsonl:315](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:315](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:281](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 키즈 안심 요금제는 데이터를 다 쓴 뒤의 속도 제한을 설명한 FAQ가 없습니다. 제공된 FAQ 중에는 '키즈 안심 요금제'에 대한 정보가 없으며, '밸런스 79·69', '밸런스 39', '실속 LTE·태블릿·워치 요금제' 등 특정 요금제에 대한 정보만 포함되어 있습니다. 따라서 키즈 안심 요금제의 데이터 소진 후 속도 제한 내용은 확정할 수 없습니다.

**모델 본문**

> 키즈 안심 요금제는 데이터를 다 쓴 뒤의 속도 제한을 설명한 FAQ가 없습니다. 제공된 FAQ 중에는 '키즈 안심 요금제'에 대한 정보가 없으며, '밸런스 79·69', '밸런스 39', '실속 LTE·태블릿·워치 요금제' 등 특정 요금제에 대한 정보만 포함되어 있습니다. 따라서 키즈 안심 요금제의 데이터 소진 후 속도 제한 내용은 확정할 수 없습니다.

- 하위 #1: CORRECT_DECLINE — 제공된 자료에 키즈 안심 요금제의 데이터 소진 후 속도가 없어 값을 추정하지 않았습니다.
- Judge 요약: 모델은 다른 요금제의 속도를 키즈 안심에 적용하지 않고 확인할 수 없다고 안내했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 키즈 안심 요금제는 데이터를 다 쓰면 속도가 어떻게 돼요?; FAQ 1129, 167
- 검색 #1: 키즈 안심 요금제는 데이터를 다 쓰면 속도가 어떻게 돼요?

**실제로 입력된 FAQ 원문**

- FAQ 1129: 데이터를 다 쓰면 속도가 얼마나 느려지나요?
> 데이터를 다 쓴 뒤의 속도는 요금제마다 다릅니다. 밸런스 79·69는 데이터를 소진한 뒤 최대 5Mbps, 밸런스 39나 일부 베이직 요금제는 최대 0.4Mbps로 계속 이용할 수 있습니다. 실속 LTE·태블릿·워치 요금제는 데이터를 모두 쓰면 차단됩니다.
- FAQ 167: 데이터 안심을 쓰면 속도 제한 대신 아예 끊기는 건가요?
> 데이터 안심 서비스를 이용하면 기본 데이터 소진 시 추가 과금을 막기 위해 데이터를 차단합니다. 기본 데이터를 다 쓴 뒤에도 제한 속도로 계속 사용하고 싶다면 데이터 안심 서비스를 신청하지 않으면 됩니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1129, 167
- 원본: [results.jsonl:315](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:315](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:283](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 키즈 안심 요금제는 데이터를 다 쓴 뒤의 속도를 제한합니다. 그러나 제공된 FAQ에서 '키즈 안심 요금제'에 대한 직접적인 정보는 없습니다. '데이터 안심 서비스'에 대한 정보는 존재하지만, 이는 일반 요금제에 대한 설명이며 키즈 요금제에 대한 적용 여부는 명시되어 있지 않습니다. 따라서 키즈 안심 요금제의 데이터 소진 후 속도 제한 내용은 확정할 수 없습니다.
> 
> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 키즈 안심 요금제는 데이터를 다 쓴 뒤의 속도를 제한합니다. 그러나 제공된 FAQ에서 '키즈 안심 요금제'에 대한 직접적인 정보는 없습니다. '데이터 안심 서비스'에 대한 정보는 존재하지만, 이는 일반 요금제에 대한 설명이며 키즈 요금제에 대한 적용 여부는 명시되어 있지 않습니다. 따라서 키즈 안심 요금제의 데이터 소진 후 속도 제한 내용은 확정할 수 없습니다.

**코드 고정 안내**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

**Judge가 표시한 주장**

- UNSUPPORTED_GENERALIZATION: 키즈 안심 요금제는 데이터를 다 쓴 뒤의 속도를 제한합니다.
  - 사유: 받은 FAQ에는 키즈 안심 요금제의 데이터 소진 후 처리 방식이 나와 있지 않습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC02](hallucination_progression.md#hc02)

- 하위 #1: UNSUPPORTED_ANSWER — 자료에 없는 키즈 안심 요금제의 데이터 소진 후 속도 제한을 단정했습니다.
- Judge 요약: 답변 후반에는 확인할 수 없다고 했지만, 첫 문장에서 근거 없는 속도 제한을 확정했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 키즈 안심 요금제는 데이터를 다 쓰면 속도가 어떻게 돼요?; FAQ 1129, 167
- 검색 #1: 키즈 안심 요금제는 데이터를 다 쓰면 속도가 어떻게 돼요?

**실제로 입력된 FAQ 원문**

- FAQ 1129: 데이터를 다 쓰면 속도가 얼마나 느려지나요?
> 데이터를 다 쓴 뒤의 속도는 요금제마다 다릅니다. 밸런스 79·69는 데이터를 소진한 뒤 최대 5Mbps, 밸런스 39나 일부 베이직 요금제는 최대 0.4Mbps로 계속 이용할 수 있습니다. 실속 LTE·태블릿·워치 요금제는 데이터를 모두 쓰면 차단됩니다.
- FAQ 167: 데이터 안심을 쓰면 속도 제한 대신 아예 끊기는 건가요?
> 데이터 안심 서비스를 이용하면 기본 데이터 소진 시 추가 과금을 막기 위해 데이터를 차단합니다. 기본 데이터를 다 쓴 뒤에도 제한 속도로 계속 사용하고 싶다면 데이터 안심 서비스를 신청하지 않으면 됩니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1129, 167
- 원본: [results.jsonl:330](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:330](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:297](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_DECLINE — 키즈 안심 요금제의 데이터 소진 후 속도는 자료에 없어 답하지 않은 것이 맞습니다.
- Judge 요약: 모델 본문은 비어 있고, 시스템 고정 안내는 환각이나 본문의 안내로 평가하지 않습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 키즈 안심 요금제는 데이터를 다 쓰면 속도가 어떻게 돼요?; FAQ 1129, 167
- 검색 #1: 키즈 안심 요금제는 데이터를 다 쓰면 속도가 어떻게 돼요?
- slot #1: ABSTAIN; 최종 본문에서 제거
> 키즈 안심 요금제는 데이터를 다 쓴 뒤의 속도 제한을 묻는 질문에 직접적으로 언급되어 있지 않습니다. 그러나 데이터를 다 쓴 뒤의 속도는 요금제마다 다릅니다. 밸런스 79·69는 최대 5Mbps, 밸런스 39나 일부 베이직 요금제는 최대 0.4Mbps로 제한됩니다. 실속 LTE·태블릿·워치 요금제는 데이터를 모두 쓰면 차단됩니다. 키즈 안심 요금제가 이에 해당하는지 확인할 수 없습니다. 따라서 키즈 안심 요금제의 데이터 소진 후 속도는 불확실합니다.

**실제로 입력된 FAQ 원문**

- FAQ 1129: 데이터를 다 쓰면 속도가 얼마나 느려지나요?
> 데이터를 다 쓴 뒤의 속도는 요금제마다 다릅니다. 밸런스 79·69는 데이터를 소진한 뒤 최대 5Mbps, 밸런스 39나 일부 베이직 요금제는 최대 0.4Mbps로 계속 이용할 수 있습니다. 실속 LTE·태블릿·워치 요금제는 데이터를 모두 쓰면 차단됩니다.
- FAQ 167: 데이터 안심을 쓰면 속도 제한 대신 아예 끊기는 건가요?
> 데이터 안심 서비스를 이용하면 기본 데이터 소진 시 추가 과금을 막기 위해 데이터를 차단합니다. 기본 데이터를 다 쓴 뒤에도 제한 속도로 계속 사용하고 싶다면 데이터 안심 서비스를 신청하지 않으면 됩니다.

</details>

<a id="sb-036"></a>
## SB-036 · 워치 개통비 0원 단정

> 워치 요금제 개통비는 얼마예요?

- 분류: 단일·묻는 값 없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **없음 → 없음 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 워치 요금제 개통비는 얼마예요? → ABSTAIN; gold FAQ 1117, 1071 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: context_sections_changed
- 입력 차이 v4sub_slot: context_sections_changed

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1138, 1117
- 원본: [results.jsonl:316](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:316](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:287](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 워치 요금제의 개통비는 FAQ 문서에 명시되어 있지 않습니다. 워치 요금제는 0.5GB(월 5,500원), 1GB(월 8,800원), 2GB(월 11,000원)으로 구성되며, 이는 월 이용료이며 개통비는 포함되지 않습니다. 제공된 FAQ에서는 개통비에 대한 정보가 없습니다.

**모델 본문**

> 워치 요금제의 개통비는 FAQ 문서에 명시되어 있지 않습니다. 워치 요금제는 0.5GB(월 5,500원), 1GB(월 8,800원), 2GB(월 11,000원)으로 구성되며, 이는 월 이용료이며 개통비는 포함되지 않습니다. 제공된 FAQ에서는 개통비에 대한 정보가 없습니다.

- 하위 #1: CORRECT_DECLINE — 개통비 금액을 지어내지 않고 FAQ에 정보가 없다고 안내했습니다.
- Judge 요약: 월 요금은 자료와 일치하며, 개통비 금액은 답하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 워치 요금제 개통비는 얼마예요?; FAQ 1138, 1117
- 검색 #1: 워치 요금제 개통비는 얼마예요?

**실제로 입력된 FAQ 원문**

- FAQ 1138: 태블릿이나 워치에서 쓸 수 있는 요금제가 있나요?
> 태블릿은 데이터 전용 Ubot 태블릿 요금제(5GB 월 9,900원~50GB 월 29,900원)를 이용할 수 있습니다. 스마트워치는 Ubot 워치 요금제(0.5GB 월 5,500원~2GB 월 11,000원)를 이용할 수 있습니다. Ubot 태블릿 요금제와 워치 요금제는 모두 데이터를 다 쓰면 차단됩니다.
- FAQ 1117: 워치 요금제 종류와 가격이 궁금해요.
> Ubot 워치 요금제는 0.5GB(월 5,500원, 음성 50분·문자 100건), 1GB(8,800원, 음성 100분·문자 250건), 2GB(11,000원, 음성 200분·문자 500건)가 있습니다. Ubot 워치 요금제는 데이터를 다 쓰면 차단되며 같은 명의의 Ubot 휴대폰과 연결해야 이용할 수 있습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1138, 1117
- 원본: [results.jsonl:316](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:316](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:280](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 워치 요금제의 개통비는 명시되어 있지 않습니다. 제공된 FAQ에서는 워치 요금제의 데이터 용량과 가격(0.5GB 월 5,500원, 1GB 월 8,800원, 2GB 월 11,000원)이 설명되어 있지만, 개통비에 대한 정보는 포함되어 있지 않습니다.
> 
> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 워치 요금제의 개통비는 명시되어 있지 않습니다. 제공된 FAQ에서는 워치 요금제의 데이터 용량과 가격(0.5GB 월 5,500원, 1GB 월 8,800원, 2GB 월 11,000원)이 설명되어 있지만, 개통비에 대한 정보는 포함되어 있지 않습니다.

**코드 고정 안내**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_DECLINE — 자료에 없는 개통비를 지어내지 않고 안내했습니다.
- Judge 요약: 모델은 제공된 월 요금만 정확히 언급하고 개통비는 확인할 수 없다고 밝혔습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 워치 요금제 개통비는 얼마예요?; FAQ 1138, 1117
- 검색 #1: 워치 요금제 개통비는 얼마예요?

**실제로 입력된 FAQ 원문**

- FAQ 1138: 태블릿이나 워치에서 쓸 수 있는 요금제가 있나요?
> 태블릿은 데이터 전용 Ubot 태블릿 요금제(5GB 월 9,900원~50GB 월 29,900원)를 이용할 수 있습니다. 스마트워치는 Ubot 워치 요금제(0.5GB 월 5,500원~2GB 월 11,000원)를 이용할 수 있습니다. Ubot 태블릿 요금제와 워치 요금제는 모두 데이터를 다 쓰면 차단됩니다.
- FAQ 1117: 워치 요금제 종류와 가격이 궁금해요.
> Ubot 워치 요금제는 0.5GB(월 5,500원, 음성 50분·문자 100건), 1GB(8,800원, 음성 100분·문자 250건), 2GB(11,000원, 음성 200분·문자 500건)가 있습니다. Ubot 워치 요금제는 데이터를 다 쓰면 차단되며 같은 명의의 Ubot 휴대폰과 연결해야 이용할 수 있습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=1; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1138, 1117
- 원본: [results.jsonl:331](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:331](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:298](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 워치 요금제의 개통비는 없습니다. 워치 요금제는 월 5,500원부터 11,000원까지 데이터량에 따라 가격이 달라지며, 개통비는 추가되지 않습니다.

**모델 본문**

> 워치 요금제의 개통비는 없습니다. 워치 요금제는 월 5,500원부터 11,000원까지 데이터량에 따라 가격이 달라지며, 개통비는 추가되지 않습니다.

**Judge가 표시한 주장**

- FABRICATION: 워치 요금제의 개통비는 없으며 추가되지 않습니다.
  - 사유: 제공된 FAQ에는 월 요금만 있고 개통비 정보는 없습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01)

- 하위 #1: UNSUPPORTED_ANSWER — 자료에 없는 개통비를 없다고 단정했습니다.
- Judge 요약: 월 요금 범위는 근거가 있지만, 질문의 핵심인 개통비를 근거 없이 0원으로 답했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 워치 요금제 개통비는 얼마예요?; FAQ 1138, 1117
- 검색 #1: 워치 요금제 개통비는 얼마예요?
- slot #1: ANSWER; 최종 본문에 남음
> 워치 요금제의 개통비는 없습니다. 워치 요금제는 월 5,500원부터 11,000원까지 데이터량에 따라 가격이 달라지며, 개통비는 추가되지 않습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1138: 태블릿이나 워치에서 쓸 수 있는 요금제가 있나요?
> 태블릿은 데이터 전용 Ubot 태블릿 요금제(5GB 월 9,900원~50GB 월 29,900원)를 이용할 수 있습니다. 스마트워치는 Ubot 워치 요금제(0.5GB 월 5,500원~2GB 월 11,000원)를 이용할 수 있습니다. Ubot 태블릿 요금제와 워치 요금제는 모두 데이터를 다 쓰면 차단됩니다.
- FAQ 1117: 워치 요금제 종류와 가격이 궁금해요.
> Ubot 워치 요금제는 0.5GB(월 5,500원, 음성 50분·문자 100건), 1GB(8,800원, 음성 100분·문자 250건), 2GB(11,000원, 음성 200분·문자 500건)가 있습니다. Ubot 워치 요금제는 데이터를 다 쓰면 차단되며 같은 명의의 Ubot 휴대폰과 연결해야 이용할 수 있습니다.

</details>

<a id="sb-037"></a>
## SB-037 · 선불 충전 보너스 미제공·유효기간 생성

> 선불 요금제는 충전하면 보너스 금액이 붙어요?

- 분류: 단일·묻는 값 없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **없음 → 없음 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 선불 요금제는 충전하면 보너스 금액이 붙어요? → ABSTAIN; gold FAQ 1154 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1154, 1153, 1101
- 원본: [results.jsonl:317](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:317](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:283](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 선불 요금제에 대한 충전 시 보너스 금액이 붙는다는 내용은 제공된 FAQ 문서에서 언급되어 있지 않습니다. 따라서 선불 요금제에 충전하면 보너스 금액이 붙는다는 것은 확인할 수 없습니다.

**모델 본문**

> 선불 요금제에 대한 충전 시 보너스 금액이 붙는다는 내용은 제공된 FAQ 문서에서 언급되어 있지 않습니다. 따라서 선불 요금제에 충전하면 보너스 금액이 붙는다는 것은 확인할 수 없습니다.

- 하위 #1: CORRECT_DECLINE — FAQ에 충전 보너스 정보가 없어 확인할 수 없다고 답했습니다.
- Judge 요약: 모델은 자료에 없는 보너스 지급 여부를 단정하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 선불 요금제는 충전하면 보너스 금액이 붙어요?; FAQ 1154, 1153, 1101
- 검색 #1: 선불 요금제는 충전하면 보너스 금액이 붙어요?

**실제로 입력된 FAQ 원문**

- FAQ 1154: 선불 요금제는 어떻게 충전하나요?
> Ubot 선불 요금제는 앱·홈페이지, 고객센터, 매장에서 5,000원, 10,000원, 30,000원, 50,000원 단위로 충전할 수 있습니다. 선불 충전 금액은 충전일부터 1년 안에 사용해야 하며 남은 금액은 소멸됩니다.
- FAQ 1153: 선불 요금제가 있나요?
> Ubot은 외국인등록증이 없는 외국인과 단기 이용자를 위한 선불 요금제를 제공합니다. Ubot 선불 요금제는 매장이나 고객센터에서 가입하며 충전한 금액만큼 사용하는 방식입니다.
- FAQ 1101: 선불폰에서 후불 요금제로 번호이동하면 충전 잔액은 어떻게 되나요?
> 선불 충전 잔액은 후불 요금제나 다른 통신사로 이어지지 않고 번호이동할 때 소멸됩니다. 선불폰의 번호이동을 14일 안에 철회하면 충전 잔액이 복구됩니다. 선불폰에서 후불 요금제로 옮길 계획이라면 가능하면 충전 잔액을 다 쓴 뒤 번호이동하는 것이 좋습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1154, 1153, 1101
- 원본: [results.jsonl:317](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:317](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:282](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_DECLINE — 보너스 금액 정보가 자료에 없고 모델도 답하지 않았습니다.
- Judge 요약: 모델 본문이 비어 있어 근거 없는 주장이나 안내·되묻기가 없습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 선불 요금제는 충전하면 보너스 금액이 붙어요?; FAQ 1154, 1153, 1101
- 검색 #1: 선불 요금제는 충전하면 보너스 금액이 붙어요?

**실제로 입력된 FAQ 원문**

- FAQ 1154: 선불 요금제는 어떻게 충전하나요?
> Ubot 선불 요금제는 앱·홈페이지, 고객센터, 매장에서 5,000원, 10,000원, 30,000원, 50,000원 단위로 충전할 수 있습니다. 선불 충전 금액은 충전일부터 1년 안에 사용해야 하며 남은 금액은 소멸됩니다.
- FAQ 1153: 선불 요금제가 있나요?
> Ubot은 외국인등록증이 없는 외국인과 단기 이용자를 위한 선불 요금제를 제공합니다. Ubot 선불 요금제는 매장이나 고객센터에서 가입하며 충전한 금액만큼 사용하는 방식입니다.
- FAQ 1101: 선불폰에서 후불 요금제로 번호이동하면 충전 잔액은 어떻게 되나요?
> 선불 충전 잔액은 후불 요금제나 다른 통신사로 이어지지 않고 번호이동할 때 소멸됩니다. 선불폰의 번호이동을 14일 안에 철회하면 충전 잔액이 복구됩니다. 선불폰에서 후불 요금제로 옮길 계획이라면 가능하면 충전 잔액을 다 쓴 뒤 번호이동하는 것이 좋습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=1; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1154, 1153, 1101
- 원본: [results.jsonl:332](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:332](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:301](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 아니요, 선불 요금제는 충전하면 보너스 금액이 붙지 않습니다. 선불 요금제의 충전 금액은 사용일까지 사용 가능하며, 남은 금액은 소멸됩니다. 보너스 금액이나 추가 혜택은 제공되지 않습니다.

**모델 본문**

> 아니요, 선불 요금제는 충전하면 보너스 금액이 붙지 않습니다. 선불 요금제의 충전 금액은 사용일까지 사용 가능하며, 남은 금액은 소멸됩니다. 보너스 금액이나 추가 혜택은 제공되지 않습니다.

**Judge가 표시한 주장**

- FABRICATION: 충전하면 보너스 금액이 붙지 않으며 추가 혜택도 제공되지 않습니다.
  - 사유: 제공된 FAQ에는 보너스 금액이나 추가 혜택의 제공 여부가 없습니다.
- FABRICATION: 충전 금액은 사용일까지 사용 가능합니다.
  - 사유: 자료에는 충전일부터 1년 안에 사용해야 한다고만 나와 있습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04)

- 하위 #1: UNSUPPORTED_ANSWER — 자료에 없는 보너스 미제공 여부를 확정해 답했습니다.
- Judge 요약: 보너스 제공 여부가 자료에 없는데도 미제공이라고 단정했으므로 핵심 답변이 근거 없습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 선불 요금제는 충전하면 보너스 금액이 붙어요?; FAQ 1154, 1153, 1101
- 검색 #1: 선불 요금제는 충전하면 보너스 금액이 붙어요?
- slot #1: ANSWER; 최종 본문에 남음
> 아니요, 선불 요금제는 충전하면 보너스 금액이 붙지 않습니다. 선불 요금제의 충전 금액은 사용일까지 사용 가능하며, 남은 금액은 소멸됩니다. 보너스 금액이나 추가 혜택은 제공되지 않습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1154: 선불 요금제는 어떻게 충전하나요?
> Ubot 선불 요금제는 앱·홈페이지, 고객센터, 매장에서 5,000원, 10,000원, 30,000원, 50,000원 단위로 충전할 수 있습니다. 선불 충전 금액은 충전일부터 1년 안에 사용해야 하며 남은 금액은 소멸됩니다.
- FAQ 1153: 선불 요금제가 있나요?
> Ubot은 외국인등록증이 없는 외국인과 단기 이용자를 위한 선불 요금제를 제공합니다. Ubot 선불 요금제는 매장이나 고객센터에서 가입하며 충전한 금액만큼 사용하는 방식입니다.
- FAQ 1101: 선불폰에서 후불 요금제로 번호이동하면 충전 잔액은 어떻게 되나요?
> 선불 충전 잔액은 후불 요금제나 다른 통신사로 이어지지 않고 번호이동할 때 소멸됩니다. 선불폰의 번호이동을 14일 안에 철회하면 충전 잔액이 복구됩니다. 선불폰에서 후불 요금제로 옮길 계획이라면 가능하면 충전 잔액을 다 쓴 뒤 번호이동하는 것이 좋습니다.

</details>

<a id="sb-038"></a>
## SB-038 · 데이터 플러스 일회성 구매 불가 단정

> 데이터 플러스를 자동 갱신 없이 한 달만 살 수 있어요?

- 분류: 단일·묻는 값 없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **없음 → 없음 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 데이터 플러스를 자동 갱신 없이 한 달만 살 수 있어요? → ABSTAIN; gold FAQ 1151 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1211
- 원본: [results.jsonl:318](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:318](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:284](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 데이터 플러스를 자동 갱신 없이 한 달만 살 수 있는지에 대한 정보는 제공된 FAQ에서 명시되어 있지 않습니다. 따라서 해당 질문에 대한 확정적인 답변을 드릴 수 없습니다.

**모델 본문**

> 데이터 플러스를 자동 갱신 없이 한 달만 살 수 있는지에 대한 정보는 제공된 FAQ에서 명시되어 있지 않습니다. 따라서 해당 질문에 대한 확정적인 답변을 드릴 수 없습니다.

- 하위 #1: CORRECT_DECLINE — 제공된 FAQ에 자동 갱신 없이 한 달만 구매할 수 있는지는 없어 답변을 유보했습니다.
- Judge 요약: 모델은 자료에 없는 구매 가능 여부를 지어내지 않고 확인할 수 없다고 밝혔습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 데이터 플러스를 자동 갱신 없이 한 달만 살 수 있어요?; FAQ 1211
- 검색 #1: 데이터 플러스를 자동 갱신 없이 한 달만 살 수 있어요?

**실제로 입력된 FAQ 원문**

- FAQ 1211: 데이터 플러스는 취소할 수 있나요?
> 데이터 플러스는 앱에서 언제든 해지할 수 있으며 해지 후에도 그달 말일까지 추가 데이터를 사용할 수 있습니다. 데이터 플러스는 가입한 달에도 요금이 일할 계산되지 않고 월정액이 그대로 청구됩니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1211
- 원본: [results.jsonl:318](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:318](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:285](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_DECLINE — 자동 갱신 없이 한 달만 구매할 수 있는지는 자료로 확인되지 않으며, 모델은 답하지 않았습니다.
- Judge 요약: 모델 본문이 비어 있어 근거 없는 주장이나 안내·되묻기가 없습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 데이터 플러스를 자동 갱신 없이 한 달만 살 수 있어요?; FAQ 1211
- 검색 #1: 데이터 플러스를 자동 갱신 없이 한 달만 살 수 있어요?

**실제로 입력된 FAQ 원문**

- FAQ 1211: 데이터 플러스는 취소할 수 있나요?
> 데이터 플러스는 앱에서 언제든 해지할 수 있으며 해지 후에도 그달 말일까지 추가 데이터를 사용할 수 있습니다. 데이터 플러스는 가입한 달에도 요금이 일할 계산되지 않고 월정액이 그대로 청구됩니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1211
- 원본: [results.jsonl:333](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:333](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:300](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 데이터 플러스를 자동 갱신 없이 한 달만 살 수는 없습니다. 데이터 플러스는 가입한 달에도 요금이 일할 계산되지 않고 월정액이 그대로 청구됩니다. 앱에서 해지할 수는 있지만, 해지 후에는 그달 말일까지 추가 데이터를 사용할 수 있습니다.

**모델 본문**

> 데이터 플러스를 자동 갱신 없이 한 달만 살 수는 없습니다. 데이터 플러스는 가입한 달에도 요금이 일할 계산되지 않고 월정액이 그대로 청구됩니다. 앱에서 해지할 수는 있지만, 해지 후에는 그달 말일까지 추가 데이터를 사용할 수 있습니다.

**Judge가 표시한 주장**

- FABRICATION: 데이터 플러스를 자동 갱신 없이 한 달만 살 수는 없습니다.
  - 사유: 챗봇이 받은 FAQ에는 해지와 요금 청구 방식만 있고 자동 갱신 없는 구매 가능 여부는 없습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01)

- 하위 #1: UNSUPPORTED_ANSWER — 받은 자료에는 자동 갱신 없이 한 달만 구매할 수 있는지 없는데, 불가능하다고 단정했습니다.
- Judge 요약: 해지 후 사용 기간과 월정액 청구 설명은 근거가 있지만, 질문의 핵심인 자동 갱신 없는 구매 가능 여부는 근거 없이 답했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 데이터 플러스를 자동 갱신 없이 한 달만 살 수 있어요?; FAQ 1211
- 검색 #1: 데이터 플러스를 자동 갱신 없이 한 달만 살 수 있어요?
- slot #1: ANSWER; 최종 본문에 남음
> 데이터 플러스를 자동 갱신 없이 한 달만 살 수는 없습니다. 데이터 플러스는 가입한 달에도 요금이 일할 계산되지 않고 월정액이 그대로 청구됩니다. 앱에서 해지할 수는 있지만, 해지 후에는 그달 말일까지 추가 데이터를 사용할 수 있습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1211: 데이터 플러스는 취소할 수 있나요?
> 데이터 플러스는 앱에서 언제든 해지할 수 있으며 해지 후에도 그달 말일까지 추가 데이터를 사용할 수 있습니다. 데이터 플러스는 가입한 달에도 요금이 일할 계산되지 않고 월정액이 그대로 청구됩니다.

</details>

<a id="sb-042"></a>
## SB-042 · 출국 후 앱 신청 불가·매장만 가능 단정

> 해외 장기 체류 일시정지는 출국한 뒤 앱으로도 신청할 수 있어요?

- 분류: 단일·묻는 값 없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **없음 → 없음 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 해외 장기 체류 일시정지는 출국한 뒤 앱으로도 신청할 수 있어요? → ABSTAIN; gold FAQ 1321 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1321
- 원본: [results.jsonl:322](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:322](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:288](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 해외 장기 체류 일시정지 신청에 대한 앱으로의 신청 가능 여부는 제공된 FAQ에서 언급되어 있지 않습니다. 따라서 앱으로 신청할 수 있는지 여부를 확정할 수 없습니다.

**모델 본문**

> 해외 장기 체류 일시정지 신청에 대한 앱으로의 신청 가능 여부는 제공된 FAQ에서 언급되어 있지 않습니다. 따라서 앱으로 신청할 수 있는지 여부를 확정할 수 없습니다.

- 하위 #1: CORRECT_DECLINE — FAQ에 없는 출국 후 앱 신청 가능 여부를 확정하지 않았습니다.
- Judge 요약: 모델 답변은 제공된 FAQ의 범위를 정확히 밝히고 근거 없는 결론을 내리지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 해외 장기 체류 일시정지는 출국한 뒤 앱으로도 신청할 수 있어요?; FAQ 1321
- 검색 #1: 해외 장기 체류 일시정지는 출국한 뒤 앱으로도 신청할 수 있어요?

**실제로 입력된 FAQ 원문**

- FAQ 1321: 해외 체류로 장기 일시정지를 신청할 때 필요한 서류가 있나요?
> 해외 체류로 장기 일시정지를 신청하려면 항공권이나 출입국 사실 증명서와 명의자 신분증이 필요합니다. 해외에 출국한 뒤에는 대리인이 위임장을 가지고 매장에서 장기 일시정지를 신청할 수도 있습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1321
- 원본: [results.jsonl:322](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:322](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:287](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_DECLINE — 앱 신청 가능 여부는 자료에 없으며, 모델은 이를 지어내지 않았습니다.
- Judge 요약: 모델 본문은 비어 있고, 시스템 고정 안내는 평가 대상이 아닙니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 해외 장기 체류 일시정지는 출국한 뒤 앱으로도 신청할 수 있어요?; FAQ 1321
- 검색 #1: 해외 장기 체류 일시정지는 출국한 뒤 앱으로도 신청할 수 있어요?

**실제로 입력된 FAQ 원문**

- FAQ 1321: 해외 체류로 장기 일시정지를 신청할 때 필요한 서류가 있나요?
> 해외 체류로 장기 일시정지를 신청하려면 항공권이나 출입국 사실 증명서와 명의자 신분증이 필요합니다. 해외에 출국한 뒤에는 대리인이 위임장을 가지고 매장에서 장기 일시정지를 신청할 수도 있습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=1; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1321
- 원본: [results.jsonl:337](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:337](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:303](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 해외 장기 체류 일시정지 신청은 출국한 뒤 앱으로 신청할 수 없습니다. 출국 후에는 대리인이 위임장을 가지고 매장에서만 신청할 수 있습니다.

**모델 본문**

> 해외 장기 체류 일시정지 신청은 출국한 뒤 앱으로 신청할 수 없습니다. 출국 후에는 대리인이 위임장을 가지고 매장에서만 신청할 수 있습니다.

**Judge가 표시한 주장**

- FABRICATION: 출국한 뒤 앱으로 신청할 수 없습니다.
  - 사유: FAQ에는 출국 후 앱 신청 가능 여부가 나와 있지 않습니다.
- UNSUPPORTED_GENERALIZATION: 출국 후에는 대리인이 매장에서만 신청할 수 있습니다.
  - 사유: FAQ는 대리인의 매장 신청도 가능하다고 할 뿐, 유일한 방법이라고 하지 않습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04)

- 하위 #1: UNSUPPORTED_ANSWER — FAQ에 없는 출국 후 앱 신청 가능 여부를 불가능하다고 단정했습니다.
- Judge 요약: 자료에 없는 앱 신청 불가 여부를 핵심 답으로 단정하고, 대리인의 매장 신청만 가능하다고 범위를 좁혔습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 해외 장기 체류 일시정지는 출국한 뒤 앱으로도 신청할 수 있어요?; FAQ 1321
- 검색 #1: 해외 장기 체류 일시정지는 출국한 뒤 앱으로도 신청할 수 있어요?
- slot #1: ANSWER; 최종 본문에 남음
> 해외 장기 체류 일시정지 신청은 출국한 뒤 앱으로 신청할 수 없습니다. 출국 후에는 대리인이 위임장을 가지고 매장에서만 신청할 수 있습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1321: 해외 체류로 장기 일시정지를 신청할 때 필요한 서류가 있나요?
> 해외 체류로 장기 일시정지를 신청하려면 항공권이나 출입국 사실 증명서와 명의자 신분증이 필요합니다. 해외에 출국한 뒤에는 대리인이 위임장을 가지고 매장에서 장기 일시정지를 신청할 수도 있습니다.

</details>

<a id="sb-049"></a>
## SB-049 · 챗봇 기록 파일 다운로드 불가 단정

> 챗봇 대화 기록을 파일로 내려받을 수 있어요?

- 분류: 단일·묻는 값 없음 · 주된 주장 영역: FAQ 사실·정책
- 변화: **없음 → 없음 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 챗봇 대화 기록을 파일로 내려받을 수 있어요? → ABSTAIN; gold FAQ 1509 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1509, 1590
- 원본: [results.jsonl:329](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:329](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:294](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 챗봇 대화 기록을 파일로 내려받을 수 있는 정보는 제공된 FAQ에서 없습니다. 대화 기록은 로그인한 회원이 챗봇 대화 기록 메뉴에서 열어 볼 수 있으며, 마지막으로 이용한 날부터 3개월 동안 보관됩니다. 그러나 기록을 파일로 다운로드하거나 저장하는 방법에 대한 설명은 없습니다.

**모델 본문**

> 챗봇 대화 기록을 파일로 내려받을 수 있는 정보는 제공된 FAQ에서 없습니다. 대화 기록은 로그인한 회원이 챗봇 대화 기록 메뉴에서 열어 볼 수 있으며, 마지막으로 이용한 날부터 3개월 동안 보관됩니다. 그러나 기록을 파일로 다운로드하거나 저장하는 방법에 대한 설명은 없습니다.

- 하위 #1: CORRECT_DECLINE — 파일 다운로드 가능 여부는 자료에 없어 답하지 않았고, 확인 가능한 기록 열람·보관 정보만 안내했습니다.
- Judge 요약: 모델 답변의 사실 주장과 답변 불가 안내가 모두 제공된 FAQ에 부합합니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 챗봇 대화 기록을 파일로 내려받을 수 있어요?; FAQ 1509, 1590
- 검색 #1: 챗봇 대화 기록을 파일로 내려받을 수 있어요?

**실제로 입력된 FAQ 원문**

- FAQ 1509: 이전 챗봇 대화를 다시 볼 수 있나요?
> 로그인한 회원은 챗봇 대화 기록 메뉴에서 이전 대화를 열어 볼 수 있습니다. 챗봇 대화는 마지막으로 이용한 날부터 3개월 동안 보관됩니다.
- FAQ 1590: 챗봇에 개인정보를 입력해도 되나요?
> 챗봇에 주민등록번호, 계좌번호, 카드번호, 비밀번호를 입력하지 마세요. 챗봇 질문 내용은 서비스 개선을 위해 보관하며 3개월이 지나면 원문을 지우고 통계로만 씁니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1509, 1590
- 원본: [results.jsonl:329](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:329](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:292](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_DECLINE — 파일 다운로드 가능 여부를 지어내지 않고 답하지 않았습니다.
- Judge 요약: 모델 본문은 비어 있고, 시스템 고정 안내는 환각이나 본문 안내로 세지 않습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 챗봇 대화 기록을 파일로 내려받을 수 있어요?; FAQ 1509, 1590
- 검색 #1: 챗봇 대화 기록을 파일로 내려받을 수 있어요?

**실제로 입력된 FAQ 원문**

- FAQ 1509: 이전 챗봇 대화를 다시 볼 수 있나요?
> 로그인한 회원은 챗봇 대화 기록 메뉴에서 이전 대화를 열어 볼 수 있습니다. 챗봇 대화는 마지막으로 이용한 날부터 3개월 동안 보관됩니다.
- FAQ 1590: 챗봇에 개인정보를 입력해도 되나요?
> 챗봇에 주민등록번호, 계좌번호, 카드번호, 비밀번호를 입력하지 마세요. 챗봇 질문 내용은 서비스 개선을 위해 보관하며 3개월이 지나면 원문을 지우고 통계로만 씁니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=1; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 없음; 실제 FAQ 1509, 1590
- 원본: [results.jsonl:344](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:344](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:308](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 챗봇 대화 기록을 파일로 내려받을 수는 없습니다. 다만, 로그인한 회원은 챗봇 대화 기록 메뉴에서 이전 대화를 열어 볼 수 있으며, 챗봇 대화는 마지막으로 이용한 날부터 3개월 동안 보관됩니다.

**모델 본문**

> 챗봇 대화 기록을 파일로 내려받을 수는 없습니다. 다만, 로그인한 회원은 챗봇 대화 기록 메뉴에서 이전 대화를 열어 볼 수 있으며, 챗봇 대화는 마지막으로 이용한 날부터 3개월 동안 보관됩니다.

**Judge가 표시한 주장**

- FABRICATION: 챗봇 대화 기록을 파일로 내려받을 수는 없습니다.
  - 사유: 제공된 FAQ에는 대화 열람과 보관 기간만 있으며 파일 내려받기 가능 여부는 없습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01)

- 하위 #1: UNSUPPORTED_ANSWER — 자료에 없는 파일 내려받기 가능 여부를 불가능하다고 단정했습니다.
- Judge 요약: 핵심 질문에 대해 근거 없는 불가 답변을 했고, 나머지 열람·보관 안내만 FAQ에 부합합니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 챗봇 대화 기록을 파일로 내려받을 수 있어요?; FAQ 1509, 1590
- 검색 #1: 챗봇 대화 기록을 파일로 내려받을 수 있어요?
- slot #1: ANSWER; 최종 본문에 남음
> 챗봇 대화 기록을 파일로 내려받을 수는 없습니다. 다만, 로그인한 회원은 챗봇 대화 기록 메뉴에서 이전 대화를 열어 볼 수 있으며, 챗봇 대화는 마지막으로 이용한 날부터 3개월 동안 보관됩니다.

**실제로 입력된 FAQ 원문**

- FAQ 1509: 이전 챗봇 대화를 다시 볼 수 있나요?
> 로그인한 회원은 챗봇 대화 기록 메뉴에서 이전 대화를 열어 볼 수 있습니다. 챗봇 대화는 마지막으로 이용한 날부터 3개월 동안 보관됩니다.
- FAQ 1590: 챗봇에 개인정보를 입력해도 되나요?
> 챗봇에 주민등록번호, 계좌번호, 카드번호, 비밀번호를 입력하지 마세요. 챗봇 질문 내용은 서비스 개선을 위해 보관하며 3개월이 지나면 원문을 지우고 통계로만 씁니다.

</details>

<a id="st-017"></a>
## ST-017 · 응답에 없는 주차 가능 여부

> 강남역 근처 매장 중에 주차되는 곳 알려 주세요.

- 분류: 매장 · 주된 주장 영역: 매장 반환 필드
- 변화: **없음 → 미판정 → 환각** · 공통 339문항 포함: 아니오
- 제어 후보: [HC06](hallucination_progression.md#hc06), [HC01](hallucination_progression.md#hc01)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 강남역 근처 매장 중에 주차되는 곳 알려 주세요. → ANSWER; gold FAQ 340, 374 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 없음; grounding=5; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 있음; 실제 FAQ 없음
- 원본: [results.jsonl:347](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:347](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:24](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1-store/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 강남역 근처 매장 중 주차가 가능한 곳에 대한 정보가 제공되지 않았습니다.

**모델 본문**

> 강남역 근처 매장 중 주차가 가능한 곳에 대한 정보가 제공되지 않았습니다.

- 하위 #1: MISSING_ANSWER — 주차 가능 여부는 확인할 수 없지만, 조회된 강남역 근처 매장 정보도 안내하지 않았습니다.
- Judge 요약: 조회 결과에 주차 정보가 없어 이를 확인할 수 없다는 말은 근거가 있지만, 답할 수 있는 근처 매장 정보까지 빠뜨렸습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 강남역 근처 매장 중에 주차되는 곳 알려 주세요.; FAQ 없음
- 검색 #1: 강남역 근처 매장 중에 주차되는 곳 알려 주세요.

</details>

### v1 sub

- 경로: LLM-005; 최종 status: null; 하위 status: 없음; status 배열 검증: false
- 판정: 미판정; grounding=—; accuracy=미판정
- 입력 섹션: 없음; 매장 연동: 있음; 실제 FAQ 없음
- 원본: [results.jsonl:347](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:347](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · 미판정

**실제 사용자 답변**

> (실행 실패/답변 없음)

**모델 본문**

> (빈 answer — 통계 분모에 포함)


<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 강남역 근처 매장 중에 주차되는 곳 알려 주세요.; FAQ 없음
- 검색 #1: 강남역 근처 매장 중에 주차되는 곳 알려 주세요.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=1; accuracy=INCORRECT
- 입력 섹션: 없음; 매장 연동: 있음; 실제 FAQ 없음
- 원본: [results.jsonl:362](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:362](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:326](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 강남역 근처에 주차가 가능한 매장은 '일상의틈_역삼동_강남역12번출구점'이 있으며, 거리는 0.1km입니다. 이 매장은 강남역 12번 출구에 위치해 있으며, 영업시간은 09:00~18:00입니다.

**모델 본문**

> 강남역 근처에 주차가 가능한 매장은 '일상의틈_역삼동_강남역12번출구점'이 있으며, 거리는 0.1km입니다. 이 매장은 강남역 12번 출구에 위치해 있으며, 영업시간은 09:00~18:00입니다.

**Judge가 표시한 주장**

- FABRICATION: 일상의틈_역삼동_강남역12번출구점은 주차가 가능합니다.
  - 사유: 매장 조회 결과에는 주차 가능 여부가 없습니다.
- 적용 후보: [HC06](hallucination_progression.md#hc06), [HC01](hallucination_progression.md#hc01)

- 하위 #1: WRONG_ANSWER — 가장 가까운 매장과 거리는 맞지만, 조회 결과에 없는 주차 가능 여부를 확정했습니다.
- Judge 요약: 주차 가능 매장을 묻는 핵심 조건을 근거 없이 확정했으므로 오답이며 핵심 답변이 창작되었습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 강남역 근처 매장 중에 주차되는 곳 알려 주세요.; FAQ 없음
- 검색 #1: 강남역 근처 매장 중에 주차되는 곳 알려 주세요.
- slot #1: ANSWER; 최종 본문에 남음
> 강남역 근처에 주차가 가능한 매장은 '일상의틈_역삼동_강남역12번출구점'이 있으며, 거리는 0.1km입니다. 이 매장은 강남역 12번 출구에 위치해 있으며, 영업시간은 09:00~18:00입니다.

</details>

<a id="st-021"></a>
## ST-021 · 요일 없는 영업시간을 일요일 휴무·평일 시간으로 변환

> 근처 매장 중에 일요일에 여는 곳 있어요?

- 분류: 매장 · 주된 주장 영역: 매장 반환 필드
- 변화: **환각 → 환각 → 환각** · 공통 339문항 포함: 예
- 제어 후보: [HC06](hallucination_progression.md#hc06), [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 근처 매장 중에 일요일에 여는 곳 있어요? → ANSWER; gold FAQ 351 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: context_sections_changed

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 현재 위치 근처 매장; 매장 연동: 있음; 실제 FAQ 77
- 원본: [results.jsonl:351](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:351](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:315](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 근처 매장 중 일요일에 운영되는 곳은 없습니다. 모든 매장의 영업시간이 09:00~18:00이며, 주말 영업 여부는 FAQ에 따르면 매장별로 확인해야 하므로 일요일 영업 여부는 확인되지 않았습니다. 제공된 정보에 따르면 주말 영업 여부는 명시되어 있지 않으며, 일요일 영업 여부는 각 매장별로 확인해야 합니다.

**모델 본문**

> 근처 매장 중 일요일에 운영되는 곳은 없습니다. 모든 매장의 영업시간이 09:00~18:00이며, 주말 영업 여부는 FAQ에 따르면 매장별로 확인해야 하므로 일요일 영업 여부는 확인되지 않았습니다. 제공된 정보에 따르면 주말 영업 여부는 명시되어 있지 않으며, 일요일 영업 여부는 각 매장별로 확인해야 합니다.

**Judge가 표시한 주장**

- FABRICATION: 근처 매장 중 일요일에 운영되는 곳은 없습니다.
  - 사유: 제공된 매장 목록에는 일요일 영업 여부가 없어 영업 매장이 없다고 단정할 수 없습니다.
- 적용 후보: [HC06](hallucination_progression.md#hc06), [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04)

- 하위 #1: WRONG_ANSWER — 일요일 영업 매장이 없다고 단정했고, 안내해야 할 매장 수와 가장 가까운 매장의 이름·거리를 빠뜨렸습니다.
- Judge 요약: 일요일 영업 여부는 확인되지 않지만, 답변은 이를 단정적으로 부정하고 제공된 근처 매장 정보도 제대로 전달하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 근처 매장 중에 일요일에 여는 곳 있어요?; FAQ 77
- 검색 #1: 근처 매장 중에 일요일에 여는 곳 있어요?

**실제로 입력된 FAQ 원문**

- FAQ 77: 주말에도 운영하는 매장이 있나요?
> 일부 매장은 주말에도 운영하며, 주말 영업시간은 매장별로 확인해야 합니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=1; accuracy=INCORRECT
- 입력 섹션: 현재 위치 근처 매장; 매장 연동: 있음; 실제 FAQ 77
- 원본: [results.jsonl:351](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:351](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:306](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 근처 매장 중 일요일에 운영되는 곳은 없습니다. 모든 매장의 영업시간은 09:00~18:00이며, 주말 영업 여부는 명시되어 있지 않습니다. 주말 영업 여부는 매장별로 확인해야 하며, 현재 제공된 정보에 따르면 일요일에 여는 매장이 없습니다.

**모델 본문**

> 근처 매장 중 일요일에 운영되는 곳은 없습니다. 모든 매장의 영업시간은 09:00~18:00이며, 주말 영업 여부는 명시되어 있지 않습니다. 주말 영업 여부는 매장별로 확인해야 하며, 현재 제공된 정보에 따르면 일요일에 여는 매장이 없습니다.

**Judge가 표시한 주장**

- FABRICATION: 근처 매장 중 일요일에 운영되는 곳은 없습니다.
  - 사유: 제공된 매장 목록에는 일요일 영업 여부가 없으므로 영업 매장이 없다고 확정할 근거가 없습니다.
- 적용 후보: [HC06](hallucination_progression.md#hc06), [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04)

- 하위 #1: WRONG_ANSWER — 일요일 영업 여부가 확인되지 않는데 영업 매장이 없다고 단정했고, 매장 수와 가장 가까운 매장 정보도 빠졌습니다.
- Judge 요약: 일요일 영업 정보가 없다고 인정하면서도 영업 매장이 없다고 단정해 핵심 답변이 근거를 벗어났습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 근처 매장 중에 일요일에 여는 곳 있어요?; FAQ 77
- 검색 #1: 근처 매장 중에 일요일에 여는 곳 있어요?

**실제로 입력된 FAQ 원문**

- FAQ 77: 주말에도 운영하는 매장이 있나요?
> 일부 매장은 주말에도 운영하며, 주말 영업시간은 매장별로 확인해야 합니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 있음; grounding=1; accuracy=INCORRECT
- 입력 섹션: 현재 위치 근처 매장; 매장 연동: 있음; 실제 FAQ 77
- 원본: [results.jsonl:365](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:365](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:330](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 근처 매장 중 일요일에 운영되는 곳은 없습니다. 모든 매장의 영업시간은 평일 09:00~18:00이며, 주말 영업 여부는 매장별로 확인해야 하므로 일요일 영업 여부는 확인할 수 없습니다.

**모델 본문**

> 근처 매장 중 일요일에 운영되는 곳은 없습니다. 모든 매장의 영업시간은 평일 09:00~18:00이며, 주말 영업 여부는 매장별로 확인해야 하므로 일요일 영업 여부는 확인할 수 없습니다.

**Judge가 표시한 주장**

- FABRICATION: 근처 매장 중 일요일에 운영되는 곳은 없습니다.
  - 사유: 매장 조회 결과에는 요일별 영업 여부가 없어 일요일 영업 매장이 없다고 확정할 수 없습니다.
- UNSUPPORTED_GENERALIZATION: 모든 매장의 영업시간은 평일 09:00~18:00입니다.
  - 사유: 조회 결과에는 09:00~18:00만 표시되어 있으며 평일 영업시간인지는 명시되지 않았습니다.
- 적용 후보: [HC06](hallucination_progression.md#hc06), [HC01](hallucination_progression.md#hc01), [HC04](hallucination_progression.md#hc04)

- 하위 #1: WRONG_ANSWER — 일요일 영업 여부를 확인할 자료가 없는데도 영업하는 매장이 없다고 단정했습니다.
- Judge 요약: 답변 말미에는 확인할 수 없다고 했지만, 앞서 일요일 영업 매장이 없다고 근거 없이 단정했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 근처 매장 중에 일요일에 여는 곳 있어요?; FAQ 77
- 검색 #1: 근처 매장 중에 일요일에 여는 곳 있어요?
- slot #1: ANSWER; 최종 본문에 남음
> 근처 매장 중 일요일에 운영되는 곳은 없습니다. 모든 매장의 영업시간은 평일 09:00~18:00이며, 주말 영업 여부는 매장별로 확인해야 하므로 일요일 영업 여부는 확인할 수 없습니다.

**실제로 입력된 FAQ 원문**

- FAQ 77: 주말에도 운영하는 매장이 있나요?
> 일부 매장은 주말에도 운영하며, 주말 영업시간은 매장별로 확인해야 합니다.

</details>

<a id="st-027"></a>
## ST-027 · 오타 장소 조회 실패 시 강남동을 정확한 지명으로 제시

> 강남녁 근처 매장 알려 주세요.

- 분류: 매장 · 주된 주장 영역: 장소 엔티티
- 변화: **환각 → 없음 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC12](hallucination_progression.md#hc12)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 강남녁 근처 매장 알려 주세요. → ABSTAIN; gold FAQ 339, 349 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: store_result_changed
- 입력 차이 v4sub_slot: 기록한 입력 항목 차이 없음

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 있음; 실제 FAQ 없음
- 원본: [results.jsonl:357](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:357](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:32](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1-store/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 질문에서 '강남녁'이라는 지명이 정확하지 않아 매장 조회가 불가능합니다. '강남역'이나 '강남동'과 같은 정확한 지명을 사용해 다시 요청해 주시기 바랍니다.

**모델 본문**

> 질문에서 '강남녁'이라는 지명이 정확하지 않아 매장 조회가 불가능합니다. '강남역'이나 '강남동'과 같은 정확한 지명을 사용해 다시 요청해 주시기 바랍니다.

**Judge가 표시한 주장**

- FABRICATION: ‘강남동’을 정확한 지명의 예로 제시함
  - 사유: 제공된 자료에는 ‘강남동’이 정확한 조회 지명이라는 근거가 없습니다.
- 적용 후보: [HC12](hallucination_progression.md#hc12)

- 하위 #1: CORRECT_DECLINE — 조회되지 않은 매장 정보를 지어내지 않고 정확한 지명을 다시 요청했습니다.
- Judge 요약: 매장 정보 답변은 적절히 보류했지만, 근거 없는 지명을 유효한 예로 제시했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 강남녁 근처 매장 알려 주세요.; FAQ 없음
- 검색 #1: 강남녁 근처 매장 알려 주세요.

</details>

### v1 sub

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 있음; 실제 FAQ 없음
- 원본: [results.jsonl:357](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:357](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:22](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1-store/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_DECLINE — 위치를 찾지 못한 상황에서 매장 정보를 지어내지 않고 답하지 않았습니다.
- Judge 요약: 모델 본문이 비어 있고 시스템 고정 안내만 제공되어, 근거 없는 매장 정보나 모델의 안내·되묻기는 없습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 강남녁 근처 매장 알려 주세요.; FAQ 없음
- 검색 #1: 강남녁 근처 매장 알려 주세요.

</details>

### v4 slot

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 없음; 매장 연동: 있음; 실제 FAQ 없음
- 원본: [results.jsonl:368](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:368](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:332](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> '강남녁' 위치를 찾지 못했습니다. 정확한 지명이나 역 이름으로 다시 질문해 주세요.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> '강남녁' 위치를 찾지 못했습니다. 정확한 지명이나 역 이름으로 다시 질문해 주세요.

- 하위 #1: CORRECT_DECLINE — 매장 조회에서 위치를 찾지 못했고, 모델은 매장 정보를 지어내지 않았습니다.
- Judge 요약: 모델 본문은 비어 있으며, 시스템 고정 안내는 환각이나 되묻기 판정에 포함하지 않습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 강남녁 근처 매장 알려 주세요.; FAQ 없음
- 검색 #1: 강남녁 근처 매장 알려 주세요.
- slot #1: ABSTAIN; 최종 본문에서 제거
> 매장 정보를 찾지 못했습니다. '강남녁'이라는 장소를 인식하지 못했으며, 이는 매장 조회에 실패한 결과입니다.

</details>

<a id="st-030"></a>
## ST-030 · 매장 검색을 길 안내 기능으로 확대

> 근처 매장 알려 주시고, 매장까지 가는 길도 알려 주세요.

- 분류: 매장 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 없음 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC01](hallucination_progression.md#hc01), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 근처 매장 알려 주시고 → ANSWER; gold FAQ 338 (gold는 실제 제공 자료와 다를 수 있음)
- #2 매장까지 가는 길도 알려 주세요. → ANSWER; gold FAQ 343 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: 기록한 입력 항목 차이 없음
- 입력 차이 v4sub_slot: context_sections_changed

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 현재 위치 근처 매장; 매장 연동: 있음; 실제 FAQ 75
- 원본: [results.jsonl:360](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:360](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:328](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 가까운 매장은 부전1동_부전시장점(0.2km)입니다. 이 매장까지 가는 길은 지도를 통해 확인할 수 있으며, 앱이나 홈페이지의 매장 찾기 기능에서 주소를 입력해 길을 안내받을 수 있습니다.

**모델 본문**

> 가까운 매장은 부전1동_부전시장점(0.2km)입니다. 이 매장까지 가는 길은 지도를 통해 확인할 수 있으며, 앱이나 홈페이지의 매장 찾기 기능에서 주소를 입력해 길을 안내받을 수 있습니다.

**Judge가 표시한 주장**

- FABRICATION: 앱이나 홈페이지의 매장 찾기에서 주소를 입력해 매장까지의 길을 안내받을 수 있습니다.
  - 사유: 받은 FAQ는 매장을 위치나 주소로 검색할 수 있다고만 하며 길 안내 기능은 확인해 주지 않습니다.
- 적용 후보: [HC01](hallucination_progression.md#hc01), [HC05](hallucination_progression.md#hc05)

- 하위 #1: WRONG_ANSWER — 가장 가까운 매장과 거리는 맞지만, 자료에서 요구한 매장 수 5곳을 빠뜨렸습니다.
- 하위 #2: WRONG_ANSWER — 매장 찾기에서 주소를 입력하면 길을 안내받는다고 했으나, 정답 기준의 앱 매장 상세 길찾기 절차를 설명하지 않았습니다.
- Judge 요약: 첫 답변은 매장 수를 누락했고, 길찾기 답변은 받은 자료에 없는 기능을 주장하며 필요한 절차도 제시하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 근처 매장 알려 주시고,; FAQ 75
- 실제 하위 #2: 매장까지 가는 길도 알려 주세요.; FAQ 없음
- 검색 #1: 근처 매장이 어디인가요?
- 검색 #2: 그 매장까지 가는 길은 어떻게 되나요?

**실제로 입력된 FAQ 원문**

- FAQ 75: 가까운 매장은 어떻게 찾나요?
> 가까운 매장은 홈페이지 또는 앱의 매장 찾기 기능에서 위치나 주소로 검색할 수 있습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=INCORRECT
- 입력 섹션: 현재 위치 근처 매장; 매장 연동: 있음; 실제 FAQ 75
- 원본: [results.jsonl:360](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:360](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:315](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 가까운 매장은 총 5개입니다. 가장 가까운 매장은 '부전1동_부전시장점'으로, 거리는 0.2km입니다.
> 
> 「매장까지 가는 길도 알려 주세요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 가까운 매장은 총 5개입니다. 가장 가까운 매장은 '부전1동_부전시장점'으로, 거리는 0.2km입니다.

**코드 고정 안내**

> 「매장까지 가는 길도 알려 주세요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_ANSWER — 근처 매장 5개와 가장 가까운 매장의 이름·거리를 자료와 일치하게 답했습니다.
- 하위 #2: MISSING_ANSWER — 모델 본문은 매장까지 가는 길을 안내하지 않았습니다.
- Judge 요약: 매장 정보는 근거 자료에 부합하지만 길찾기 질문에는 답하지 않았고, 시스템 고정 안내는 모델 본문 평가에서 제외했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 근처 매장 알려 주시고,; FAQ 75
- 실제 하위 #2: 매장까지 가는 길도 알려 주세요.; FAQ 없음
- 검색 #1: 근처 매장이 어디인가요?
- 검색 #2: 그 매장까지 가는 길은 어떻게 되나요?

**실제로 입력된 FAQ 원문**

- FAQ 75: 가까운 매장은 어떻게 찾나요?
> 가까운 매장은 홈페이지 또는 앱의 매장 찾기 기능에서 위치나 주소로 검색할 수 있습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ANSWER, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=INCORRECT
- 입력 섹션: 현재 위치 근처 매장; 매장 연동: 있음; 실제 FAQ 75
- 원본: [results.jsonl:109](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:109](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:108](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 가까운 매장은 부전1동_부전시장점(0.2km), 부전2동_부산점(0.3km), 일상의틈_부전동_서면점(0.3km), 부전2동_서면1번가점(0.4km), 부전동_부전역2번출구점(0.5km)입니다. 이 매장들은 홈페이지 또는 앱의 매장 찾기 기능에서 위치나 주소로 검색할 수 있습니다.
> 
> 「매장까지 가는 길도 알려 주세요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 가까운 매장은 부전1동_부전시장점(0.2km), 부전2동_부산점(0.3km), 일상의틈_부전동_서면점(0.3km), 부전2동_서면1번가점(0.4km), 부전동_부전역2번출구점(0.5km)입니다. 이 매장들은 홈페이지 또는 앱의 매장 찾기 기능에서 위치나 주소로 검색할 수 있습니다.

**코드 고정 안내**

> 「매장까지 가는 길도 알려 주세요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_ANSWER — 조회 결과에 있는 근처 매장과 거리를 정확히 안내했습니다.
- 하위 #2: MISSING_ANSWER — 모델 본문에 매장까지 가는 길에 대한 안내가 없습니다.
- Judge 요약: 근처 매장 정보는 자료와 일치하지만 길찾기 질문에는 답하지 않았고, 모델 본문에 근거 없는 주장은 없습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 근처 매장 알려 주시고,; FAQ 75
- 실제 하위 #2: 매장까지 가는 길도 알려 주세요.; FAQ 없음
- 검색 #1: 근처 매장이 어디인가요?
- 검색 #2: 그 매장까지 가는 길은 어떻게 되나요?
- slot #1: ANSWER; 최종 본문에 남음
> 가까운 매장은 부전1동_부전시장점(0.2km), 부전2동_부산점(0.3km), 일상의틈_부전동_서면점(0.3km), 부전2동_서면1번가점(0.4km), 부전동_부전역2번출구점(0.5km)입니다. 이 매장들은 홈페이지 또는 앱의 매장 찾기 기능에서 위치나 주소로 검색할 수 있습니다.
- slot #2: ABSTAIN; 최종 본문에서 제거
> 매장까지 가는 길은 제공된 정보에 없습니다. 지도 기능을 통해 직접 확인하거나, 고객센터에 문의해 주세요.

**실제로 입력된 FAQ 원문**

- FAQ 75: 가까운 매장은 어떻게 찾나요?
> 가까운 매장은 홈페이지 또는 앱의 매장 찾기 기능에서 위치나 주소로 검색할 수 있습니다.

</details>

<a id="ud-002"></a>
## UD-002 · 가입 다음 달이라는 자료로 다음 달 1일 생성

> 제 가입일 기준으로 멤버십 등급은 언제 정해져요?

- 분류: 사용자 정보 · 주된 주장 영역: 사용자 필드·날짜
- 변화: **환각 → 없음 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC07](hallucination_progression.md#hc07)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.
- 재검토: gold는 다음 달 1일을 기대하지만 실제 받은 FAQ에는 다음 달만 있어 정확도와 근거 판정이 엇갈림. 모델만 고칠 문제가 아니라 정답·검색 근거의 정합성도 확인해야 함.

**기대 하위 질문**

- #1 제 가입일 기준으로 멤버십 등급은 언제 정해져요? → ANSWER; gold FAQ 803, 295, 1349 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: context_sections_changed
- 입력 차이 v4sub_slot: context_sections_changed

### v1 single

- 경로: LLM; 최종 status: ANSWER; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1349, 284
- 원본: [results.jsonl:362](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:362](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:327](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 사용자 가입일이 2026년 10월 20일이라면, 멤버십 등급은 다음 달인 2026년 11월 1일에 정해집니다. 이는 신규 가입자의 경우 가입 다음 달에 등급이 정해진다는 FAQ 내용에 따르기 때문입니다. 등급은 직전 6개월의 평균 월정액을 기준으로 산정되지만, 사용자의 요금 정보가 없기 때문에 등급 구분은 불가능합니다. 그러나 등급이 정해지는 시점은 가입 다음 달인 2026년 11월 1일입니다.

**모델 본문**

> 사용자 가입일이 2026년 10월 20일이라면, 멤버십 등급은 다음 달인 2026년 11월 1일에 정해집니다. 이는 신규 가입자의 경우 가입 다음 달에 등급이 정해진다는 FAQ 내용에 따르기 때문입니다. 등급은 직전 6개월의 평균 월정액을 기준으로 산정되지만, 사용자의 요금 정보가 없기 때문에 등급 구분은 불가능합니다. 그러나 등급이 정해지는 시점은 가입 다음 달인 2026년 11월 1일입니다.

**Judge가 표시한 주장**

- FABRICATION: 멤버십 등급은 2026년 11월 1일에 정해집니다.
  - 사유: 챗봇이 받은 FAQ에는 가입 다음 달이라고만 되어 있고, 1일이라는 날짜는 명시되어 있지 않습니다.
- 적용 후보: [HC07](hallucination_progression.md#hc07)

- 하위 #1: CORRECT_ANSWER — 가입일에 따른 등급 결정일을 2026년 11월 1일로 정확히 답했습니다.
- Judge 요약: 정답 기준에는 맞지만, 받은 자료만으로는 다음 달 1일이라는 정확한 날짜를 뒷받침할 수 없습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 제 가입일 기준으로 멤버십 등급은 언제 정해져요?; FAQ 1349, 284
- 검색 #1: 제 가입일 기준으로 멤버십 등급은 언제 정해져요?

**실제로 입력된 FAQ 원문**

- FAQ 1349: 멤버십 등급은 어떻게 정해지나요?
> Ubot 멤버십 등급은 매년 1월 1일에 직전 6개월의 평균 월정액을 기준으로 정합니다. 멤버십 평균 월정액이 70,000원 이상이면 VIP, 40,000원 이상이면 골드, 그 외는 실버이며 신규 가입자는 가입 다음 달에 등급이 정해집니다.
- FAQ 284: 멤버십 등급은 어떻게 나뉘나요?
> 멤버십 등급은 VIP, GOLD, SILVER 세 등급으로 나뉩니다. 멤버십 등급은 직전 6개월의 평균 월 요금을 기준으로 산정됩니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1349, 284
- 원본: [results.jsonl:362](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:362](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:317](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 가입일 기준으로 멤버십 등급은 가입 다음 달에 정해집니다. 사용자 정보에 따르면 가입일은 2026년 10월 20일로, 이에 따라 멤버십 등급은 2026년 11월에 정해집니다.

**모델 본문**

> 가입일 기준으로 멤버십 등급은 가입 다음 달에 정해집니다. 사용자 정보에 따르면 가입일은 2026년 10월 20일로, 이에 따라 멤버십 등급은 2026년 11월에 정해집니다.

- 하위 #1: WRONG_ANSWER — 가입 다음 달인 2026년 11월이라고 답했지만, 정답 기준의 핵심 날짜인 11월 1일을 빠뜨렸습니다.
- Judge 요약: 답변은 챗봇이 받은 FAQ와 가입일 정보에 근거하지만, 정답 기준이 요구하는 확정일을 제시하지 못했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 제 가입일 기준으로 멤버십 등급은 언제 정해져요?; FAQ 1349, 284
- 검색 #1: 제 가입일 기준으로 멤버십 등급은 언제 정해져요?

**실제로 입력된 FAQ 원문**

- FAQ 1349: 멤버십 등급은 어떻게 정해지나요?
> Ubot 멤버십 등급은 매년 1월 1일에 직전 6개월의 평균 월정액을 기준으로 정합니다. 멤버십 평균 월정액이 70,000원 이상이면 VIP, 40,000원 이상이면 골드, 그 외는 실버이며 신규 가입자는 가입 다음 달에 등급이 정해집니다.
- FAQ 284: 멤버십 등급은 어떻게 나뉘나요?
> 멤버십 등급은 VIP, GOLD, SILVER 세 등급으로 나뉩니다. 멤버십 등급은 직전 6개월의 평균 월 요금을 기준으로 산정됩니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ANSWER; 하위 status: ANSWER; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1349, 284
- 원본: [results.jsonl:371](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:371](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:335](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 가입일 기준으로 멤버십 등급은 가입 다음 달에 정해집니다. 예를 들어, 가입일이 2026년 10월 20일이라면, 2026년 11월에 멤버십 등급이 정해집니다.

**모델 본문**

> 가입일 기준으로 멤버십 등급은 가입 다음 달에 정해집니다. 예를 들어, 가입일이 2026년 10월 20일이라면, 2026년 11월에 멤버십 등급이 정해집니다.

- 하위 #1: WRONG_ANSWER — 가입 다음 달이라고 답했지만, 정답 기준의 핵심 날짜인 2026년 11월 1일을 빠뜨렸습니다.
- Judge 요약: 답변은 챗봇이 받은 FAQ와 가입일에 근거하지만, 정답 기준에서 요구하는 확정일은 제시하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 제 가입일 기준으로 멤버십 등급은 언제 정해져요?; FAQ 1349, 284
- 검색 #1: 제 가입일 기준으로 멤버십 등급은 언제 정해져요?
- slot #1: ANSWER; 최종 본문에 남음
> 가입일 기준으로 멤버십 등급은 가입 다음 달에 정해집니다. 예를 들어, 가입일이 2026년 10월 20일이라면, 2026년 11월에 멤버십 등급이 정해집니다.

**실제로 입력된 FAQ 원문**

- FAQ 1349: 멤버십 등급은 어떻게 정해지나요?
> Ubot 멤버십 등급은 매년 1월 1일에 직전 6개월의 평균 월정액을 기준으로 정합니다. 멤버십 평균 월정액이 70,000원 이상이면 VIP, 40,000원 이상이면 골드, 그 외는 실버이며 신규 가입자는 가입 다음 달에 등급이 정해집니다.
- FAQ 284: 멤버십 등급은 어떻게 나뉘나요?
> 멤버십 등급은 VIP, GOLD, SILVER 세 등급으로 나뉩니다. 멤버십 등급은 직전 6개월의 평균 월 요금을 기준으로 산정됩니다.

</details>

<a id="ud-013"></a>
## UD-013 · 오늘과 같은 가입일을 미래일로 계산

> 지금 해지하면 제 할인반환금이 얼마예요?

- 분류: 사용자 정보 · 주된 주장 영역: 사용자 필드·날짜
- 변화: **환각 → 없음 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC07](hallucination_progression.md#hc07)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 지금 해지하면 제 할인반환금이 얼마예요? → ABSTAIN; gold FAQ 681 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: context_sections_changed
- 입력 차이 v4sub_slot: context_sections_changed

### v1 single

- 경로: LLM; 최종 status: PARTIAL; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1427
- 원본: [results.jsonl:373](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:373](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:337](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 해지 시 할인반환금의 금액은 약정 기간이 얼마나 지났는지에 따라 달라지며, 약정 기간이 많이 지날수록 할인반환금이 줄어듭니다. 그러나 현재 가입일(2026-10-20)이 미래에 위치해 있어 약정 기간이 지나거나 해지 시점이 명확하지 않습니다. 따라서 할인반환금의 구체적인 금액을 정확히 알 수 없습니다.

**모델 본문**

> 해지 시 할인반환금의 금액은 약정 기간이 얼마나 지났는지에 따라 달라지며, 약정 기간이 많이 지날수록 할인반환금이 줄어듭니다. 그러나 현재 가입일(2026-10-20)이 미래에 위치해 있어 약정 기간이 지나거나 해지 시점이 명확하지 않습니다. 따라서 할인반환금의 구체적인 금액을 정확히 알 수 없습니다.

**Judge가 표시한 주장**

- FABRICATION: 가입일(2026-10-20)이 미래에 위치해 있다
  - 사유: 제공된 현재 날짜도 2026-10-20이므로 가입일은 미래가 아닙니다.
- 적용 후보: [HC07](hallucination_progression.md#hc07)

- 하위 #1: CORRECT_DECLINE — 개별 할인반환금 액수를 지어내지 않고 답하지 않았습니다.
- Judge 요약: 금액을 안내하지 않은 판정은 맞지만, 가입일이 미래라는 설명은 제공된 날짜와 모순됩니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 지금 해지하면 제 할인반환금이 얼마예요?; FAQ 1427
- 검색 #1: 지금 해지하면 제 할인반환금이 얼마예요?

**실제로 입력된 FAQ 원문**

- FAQ 1427: 약정 중에 해지하면 위약금이 있나요?
> 선택약정이나 공시지원금을 받고 약정 기간 안에 회선을 해지하면 받은 할인 금액 중 일부를 할인반환금으로 내야 합니다. 약정 기간이 많이 지날수록 해지할 때의 할인반환금은 줄어듭니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1427
- 원본: [results.jsonl:373](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:373](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:325](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_DECLINE — 개인별 할인반환금 액수가 자료에 없어 답하지 않았습니다.
- Judge 요약: 모델 본문은 비어 있으며, 시스템 고정 안내는 환각이나 본문 안내로 세지 않습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 지금 해지하면 제 할인반환금이 얼마예요?; FAQ 1427
- 검색 #1: 지금 해지하면 제 할인반환금이 얼마예요?

**실제로 입력된 FAQ 원문**

- FAQ 1427: 약정 중에 해지하면 위약금이 있나요?
> 선택약정이나 공시지원금을 받고 약정 기간 안에 회선을 해지하면 받은 할인 금액 중 일부를 할인반환금으로 내야 합니다. 약정 기간이 많이 지날수록 해지할 때의 할인반환금은 줄어듭니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1427
- 원본: [results.jsonl:381](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:381](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:343](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_DECLINE — 할인반환금 금액이 자료에 없어 답하지 않았습니다.
- Judge 요약: 모델 본문은 비어 있고, 시스템 고정 안내는 답변이나 환각 주장으로 평가하지 않습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 지금 해지하면 제 할인반환금이 얼마예요?; FAQ 1427
- 검색 #1: 지금 해지하면 제 할인반환금이 얼마예요?
- slot #1: ABSTAIN; 최종 본문에서 제거
> 해지 시 할인반환금은 약정 기간이 많이 지날수록 줄어듭니다. 그러나 구체적인 금액은 약정 조건과 해지 시점에 따라 달라지며, 현재 가입일(2026-10-20)이 약정 기간을 초과하지 않았기 때문에 할인반환금이 적용될 수 있습니다. 다만, 사용자 정보에 요금이나 데이터 사용량 등 구체적인 약정 내용이 없어 정확한 금액을 계산할 수 없습니다.

**실제로 입력된 FAQ 원문**

- FAQ 1427: 약정 중에 해지하면 위약금이 있나요?
> 선택약정이나 공시지원금을 받고 약정 기간 안에 회선을 해지하면 받은 할인 금액 중 일부를 할인반환금으로 내야 합니다. 약정 기간이 많이 지날수록 해지할 때의 할인반환금은 줄어듭니다.

</details>

<a id="ud-018"></a>
## UD-018 · 가입일을 미래일로 보고 소액결제 내역 부재 사유 생성

> 이번 달에 제가 소액결제로 얼마 썼어요?

- 분류: 사용자 정보 · 주된 주장 영역: 사용자 필드·날짜
- 변화: **환각 → 없음 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC07](hallucination_progression.md#hc07), [HC04](hallucination_progression.md#hc04)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 이번 달에 제가 소액결제로 얼마 썼어요? → ABSTAIN; gold FAQ 674 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: context_sections_changed
- 입력 차이 v4sub_slot: context_sections_changed

### v1 single

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 없음
- 원본: [results.jsonl:378](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:378](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:343](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 소액결제 사용 내역은 제공된 정보에서 확인할 수 없습니다. 가입일이 2026-10-20로 미래일로, 실제 사용 내역이 존재하지 않거나 조회가 불가능할 수 있습니다.

**모델 본문**

> 소액결제 사용 내역은 제공된 정보에서 확인할 수 없습니다. 가입일이 2026-10-20로 미래일로, 실제 사용 내역이 존재하지 않거나 조회가 불가능할 수 있습니다.

**Judge가 표시한 주장**

- FABRICATION: 가입일인 2026-10-20이 미래일이다.
  - 사유: 제공된 자료에는 해당 가입일이 미래라는 근거가 없습니다.
- UNSUPPORTED_GENERALIZATION: 가입일 때문에 사용 내역이 없거나 조회가 불가능할 수 있다.
  - 사유: 가입일과 소액결제 내역의 존재·조회 가능 여부를 연결하는 근거가 없습니다.
- 적용 후보: [HC07](hallucination_progression.md#hc07), [HC04](hallucination_progression.md#hc04)

- 하위 #1: CORRECT_DECLINE — 이번 달 소액결제 금액을 지어내지 않고 확인할 수 없다고 안내했습니다.
- Judge 요약: 금액에 대한 답변 거절은 적절하지만, 가입일에 관한 근거 없는 해석과 추측을 덧붙였습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 이번 달에 제가 소액결제로 얼마 썼어요?; FAQ 없음
- 검색 #1: 이번 달에 제가 소액결제로 얼마 썼어요?

</details>

### v1 sub

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 없음
- 원본: [results.jsonl:378](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:378](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:330](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_DECLINE — 이번 달 소액결제 금액이 자료에 없어 답하지 않았습니다.
- Judge 요약: 모델 본문은 비어 있고, 시스템 고정 안내는 환각이나 본문 안내로 평가하지 않습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 이번 달에 제가 소액결제로 얼마 썼어요?; FAQ 없음
- 검색 #1: 이번 달에 제가 소액결제로 얼마 썼어요?

</details>

### v4 slot

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 없음
- 원본: [results.jsonl:386](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:386](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:348](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 문의하신 내용은 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_DECLINE — 이번 달 소액결제 이용 금액이 자료에 없어 답하지 않았습니다.
- Judge 요약: 모델 본문은 비어 있으며, 시스템 고정 안내는 환각이나 본문 안내로 평가하지 않았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 이번 달에 제가 소액결제로 얼마 썼어요?; FAQ 없음
- 검색 #1: 이번 달에 제가 소액결제로 얼마 썼어요?
- slot #1: ABSTAIN; 최종 본문에서 제거
> 소액결제 사용 내역을 확인할 수 없습니다. 제공된 정보에 따라 요금, 데이터 사용량, 미납 정보 등은 조회 결과에 포함되어 있지 않으며, 소액결제 사용 금액은 명시되어 있지 않습니다.

</details>

<a id="ud-024"></a>
## UD-024 · 개인 포인트 잔액 누락을 FAQ 유효기간 미제공으로 확대

> 제 포인트 몇 점 남았어요? 그리고 포인트 유효기간은 얼마예요?

- 분류: 사용자 정보 · 주된 주장 영역: FAQ 사실·정책
- 변화: **환각 → 없음 → 없음** · 공통 339문항 포함: 예
- 제어 후보: [HC11](hallucination_progression.md#hc11), [HC05](hallucination_progression.md#hc05)
- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.

**기대 하위 질문**

- #1 제 포인트 몇 점 남았어요? → ABSTAIN; gold FAQ 684 (gold는 실제 제공 자료와 다를 수 있음)
- #2 포인트 유효기간은 얼마예요? → ANSWER; gold FAQ 684, 1353 (gold는 실제 제공 자료와 다를 수 있음)
- 입력 차이 single_sub: 기록한 입력 항목 차이 없음
- 입력 차이 sub_slot: context_sections_changed
- 입력 차이 v4sub_slot: context_sections_changed

### v1 single

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: 없음; status 배열 검증: 해당 없음
- 판정: 실질적 환각 있음; grounding=3; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1353
- 원본: [results.jsonl:384](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/results.jsonl) · [case_scores.jsonl:384](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl:351](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 사용자 정보에 포인트 잔액이나 유효기간에 대한 데이터가 없습니다. 따라서 포인트 잔액과 유효기간을 확인할 수 없습니다.

**모델 본문**

> 사용자 정보에 포인트 잔액이나 유효기간에 대한 데이터가 없습니다. 따라서 포인트 잔액과 유효기간을 확인할 수 없습니다.

**Judge가 표시한 주장**

- UNSUPPORTED_GENERALIZATION: 포인트 유효기간을 확인할 수 없습니다.
  - 사유: 받은 FAQ에 포인트를 적립일부터 2년 동안 사용할 수 있다고 명시되어 있습니다.
- 적용 후보: [HC11](hallucination_progression.md#hc11), [HC05](hallucination_progression.md#hc05)

- 하위 #1: CORRECT_DECLINE — 포인트 잔액 자료가 없어 수치를 지어내지 않았습니다.
- 하위 #2: MISSING_ANSWER — 받은 FAQ에 적립일부터 2년이라고 명시되어 있지만 답하지 않았습니다.
- Judge 요약: 잔액에 대한 답변 거절은 적절하지만, FAQ로 확인 가능한 유효기간까지 확인할 수 없다고 한 것은 잘못입니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 제 포인트 몇 점 남았어요?; FAQ 없음
- 실제 하위 #2: 그리고 포인트 유효기간은 얼마예요?; FAQ 1353
- 검색 #1: 제 포인트 몇 점 남았어요?
- 검색 #2: 포인트 유효기간은 얼마예요?

**실제로 입력된 FAQ 원문**

- FAQ 1353: Ubot 포인트는 어떻게 쌓이나요?
> Ubot 포인트는 매월 납부한 요금제 월정액의 1%가 적립되며 적립일부터 2년 동안 사용할 수 있습니다. Ubot 포인트 적립 내역은 앱의 포인트 메뉴에서 확인할 수 있습니다.

</details>

### v1 sub

- 경로: LLM; 최종 status: ABSTAIN; 하위 status: ABSTAIN, ABSTAIN; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=INCORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1353
- 원본: [results.jsonl:384](../../../../pipeline_test_v1/try1/results/raw/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/results.jsonl) · [case_scores.jsonl:384](../../../../pipeline_test_v1/try1/results/raw/scored/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl:336](../../../../pipeline_test_v1/try1/results/llm_judge/pv1-try1/local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020.judgments.jsonl)

**실제 사용자 답변**

> 「제 포인트 몇 점 남았어요」, 「그리고 포인트 유효기간은 얼마예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> (빈 answer — 통계 분모에 포함)

**코드 고정 안내**

> 「제 포인트 몇 점 남았어요」, 「그리고 포인트 유효기간은 얼마예요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_DECLINE — 잔여 포인트 자료가 없고 모델도 점수를 답하지 않았습니다.
- 하위 #2: MISSING_ANSWER — 받은 FAQ에 적립일부터 2년이라는 유효기간이 있지만 모델은 답하지 않았습니다.
- Judge 요약: 모델 본문이 비어 있어 근거 없는 주장은 없지만, 답할 수 있는 유효기간을 누락했습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 제 포인트 몇 점 남았어요?; FAQ 없음
- 실제 하위 #2: 그리고 포인트 유효기간은 얼마예요?; FAQ 1353
- 검색 #1: 제 포인트 몇 점 남았어요?
- 검색 #2: 포인트 유효기간은 얼마예요?

**실제로 입력된 FAQ 원문**

- FAQ 1353: Ubot 포인트는 어떻게 쌓이나요?
> Ubot 포인트는 매월 납부한 요금제 월정액의 1%가 적립되며 적립일부터 2년 동안 사용할 수 있습니다. Ubot 포인트 적립 내역은 앱의 포인트 메뉴에서 확인할 수 있습니다.

</details>

### v4 slot

- 경로: LLM; 최종 status: PARTIAL; 하위 status: ABSTAIN, ANSWER; status 배열 검증: true
- 판정: 실질적 환각 없음; grounding=5; accuracy=CORRECT
- 입력 섹션: 사용자 정보; 매장 연동: 없음; 실제 FAQ 1353
- 원본: [results.jsonl:113](../raw/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/results.jsonl) · [case_scores.jsonl:113](../raw/scored/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023/case_scores.jsonl) · [local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl:118](../llm_judge/pv4-try2/local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023.judgments.jsonl)

**실제 사용자 답변**

> 포인트 유효기간은 적립일로부터 2년입니다. 예: 2026년 10월 20일에 적립된 포인트는 2028년 10월 19일까지 유효합니다.
> 
> 「제 포인트 몇 점 남았어요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

**모델 본문**

> 포인트 유효기간은 적립일로부터 2년입니다. 예: 2026년 10월 20일에 적립된 포인트는 2028년 10월 19일까지 유효합니다.

**코드 고정 안내**

> 「제 포인트 몇 점 남았어요」에 대해서는 현재 안내 자료로는 확인해 드리기 어렵습니다.

- 하위 #1: CORRECT_DECLINE — 모델은 잔여 포인트를 지어내지 않았고, 시스템 고정 안내가 확인 불가를 알렸습니다.
- 하위 #2: CORRECT_ANSWER — 포인트 유효기간을 적립일로부터 2년이라고 정확히 답했습니다.
- Judge 요약: 잔여 포인트는 답하지 않았고, 유효기간은 제공된 FAQ와 일치하며 검색어도 두 질문을 그대로 담았습니다.

<details>
<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>

- 실제 하위 #1: 제 포인트 몇 점 남았어요?; FAQ 없음
- 실제 하위 #2: 그리고 포인트 유효기간은 얼마예요?; FAQ 1353
- 검색 #1: 제 포인트 몇 점 남았어요?
- 검색 #2: 포인트 유효기간은 얼마예요?
- slot #1: ABSTAIN; 최종 본문에서 제거
> 포인트 남은 점수는 확인할 수 없습니다. 사용자 정보에 요금제 또는 포인트 적립 정보가 없습니다.
- slot #2: ANSWER; 최종 본문에 남음
> 포인트 유효기간은 적립일로부터 2년입니다. 예: 2026년 10월 20일에 적립된 포인트는 2028년 10월 19일까지 유효합니다.

**실제로 입력된 FAQ 원문**

- FAQ 1353: Ubot 포인트는 어떻게 쌓이나요?
> Ubot 포인트는 매월 납부한 요금제 월정액의 1%가 적립되며 적립일부터 2년 동안 사용할 수 있습니다. Ubot 포인트 적립 내역은 앱의 포인트 메뉴에서 확인할 수 있습니다.

</details>
