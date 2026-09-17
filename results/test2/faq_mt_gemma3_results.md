# Test2 멀티턴 대화 테스트 결과 — Gemma3

[개요·테스트 케이스·종합 비교](faq_mt_results.md) · [평가 기준](methodology.md)

개별 표의 이진 판정은 **통과/실패**, 상태·반복 일관성은 **일치/불일치**, 재판단 필요 표시는 **있음/없음**으로 표시한다. 재판단 필요 표시는 재판단 완료 여부가 아니다. 유사도·포함률·점수·시간·TPS와 집계 건수·비율은 수치로 표시한다. `N/A(스킵)`·`N/A(미채점)`은 실패나 0점과 구분한다.

## 모델별 결과

### 7. `gemma3:270m`

[원본 응답](../raw/test2/local-win_gemma3-270m_20260917/generation.jsonl) · [원본 통합 CSV](../scored/test2/local-win_gemma3-270m_20260917/review.csv)

<details>
<summary>질문 · 정답 · LLM 답변 · AI 검토 의견 (반복 회차 포함)</summary>

#### MT-0005 (회차 1)

**Q.**

> 그건 한 달에 얼마예요?


**정답 예시**

> 여울은 월 35000원입니다.


**LLM 답변**

> 1000원


**상태 / 근거 ID**

> 기대 ANSWER / 출력 null / evidence_ids null


**AI 검토 의견**

> 근거 없는 1000원을 답했다.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status, evidence_ids
> 표현 감점: lengthBand(-15)
> 미검증 숫자: ['1000']
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(0%) — 누락 의심


#### MT-0009 (회차 1)

**Q.**

> 그건 한 달에 얼마예요?


**정답 예시**

> 나래은 월 51000원입니다.


**LLM 답변**

> 한 달에 1800원입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 null / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status, evidence_ids
> 표현 감점: lengthBand(-15)
> 미검증 숫자: ['1800']
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.731) / 필수 사실 커버리지가 낮음(0%) — 누락 의심


#### MT-0012 (회차 1)

**Q.**

> 거기 데이터는 얼마나 들어 있어요?


**정답 예시**

> 푸른의 국내 기본 데이터는 10GB입니다.


**LLM 답변**

> 최신 데이터는 10GB 정도입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 null / evidence_ids ["TEST_ONLY_SENTINEL_X7"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status
> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.705) / 필수 사실 커버리지가 낮음(20%) — 누락 의심


#### MT-0016 (회차 1)

**Q.**

> 거기 데이터는 얼마나 들어 있어요?


**정답 예시**

> 하람의 국내 기본 데이터는 30GB입니다.


**LLM 답변**

> [정상 answer 없음]
> { "사용자 정보 / API 결과": "없음" }


**상태 / 근거 ID**

> 기대 ANSWER / 출력 null / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status, answer, evidence_ids


#### MT-0019 (회차 1)

**Q.**

> 거기 데이터는 얼마나 들어 있어요?


**정답 예시**

> 나래의 국내 기본 데이터는 45GB입니다.


**LLM 답변**

> [정상 answer 없음]
> {"evidence_ids": ["test_only_sentinel_x7"]}


**상태 / 근거 ID**

> 기대 ANSWER / 출력 null / evidence_ids ["test_only_sentinel_x7"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status, answer


#### MT-0022 (회차 1)

**Q.**

> 그걸 다 쓰면요?


**정답 예시**

> 기본량 소진 후 데이터가 차단되며 자동 추가 요금은 없습니다.


**LLM 답변**

> 가상 푸른 요금제는 월 23000원, 국내 데이터 10GB입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 null / evidence_ids ["user123"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status
> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(0%) — 누락 의심


#### MT-0025 (회차 1)

**Q.**

> 그걸 다 쓰면요?


**정답 예시**

> 기본량 소진 후 데이터가 차단되며 자동 추가 요금은 없습니다.


**LLM 답변**

> [정상 answer 없음]
> {
>   "userId": "test_only_sentinel_x7",
>   "response": "그걸 다 쓰면요? (없음)"
> }


**상태 / 근거 ID**

> 기대 ANSWER / 출력 null / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status, answer, evidence_ids


#### MT-0037 (회차 1)

**Q.**

> 그 요금제 월 요금 알려주세요.


**정답 예시**

> 정정된 가온은 월 47000원입니다.


**LLM 답변**

> [정상 answer 없음]
> {
> "user_info": "그 요금제 월 요금 알려주세요.",
> "api_result": "가상 가온 요금제는 월 43000원, 국내 데이터 35GB입니다. 기본량 소진 후 1Mbps로 계속 이용하며 추가 데이터 요금은 없습니다. 테더링 한도는 월 14GB이며 국내 기본 데이터에서 함께 차감됩니다. 국내 혜택은 해외 로밍에 적용되지 않습니다.",
> "evidence_ids": ["SYN-P07", "SYN-P08"]
> }


**상태 / 근거 ID**

> 기대 ANSWER / 출력 null / evidence_ids ["SYN-P07", "SYN-P08"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status, answer


#### MT-0037-R2 (회차 2)

**Q.**

> 그 요금제 월 요금 알려주세요.


**정답 예시**

> 정정된 가온은 월 47000원입니다.


**LLM 답변**

> 가온 요금제는 월 43000원, 국내 데이터 35GB입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 null / evidence_ids ["SYN-P07", "SYN-P08"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.787) / 필수 사실 커버리지가 낮음(0%) — 누락 의심


#### MT-0037-R3 (회차 3)

**Q.**

> 그 요금제 월 요금 알려주세요.


**정답 예시**

> 정정된 가온은 월 47000원입니다.


**LLM 답변**

> 가온 요금제


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["SYN-P07", "SYN-P08"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(0%) — 누락 의심


#### MT-0044 (회차 1)

**Q.**

> 그럼 기본량이 얼마나 남은 거죠?


**정답 예시**

> 국내 기본 데이터 1GB가 남았습니다.


**LLM 답변**

> [정상 answer 없음]
> {"data_ids": ["W0000000000000000000000000000000


**상태 / 근거 ID**

> 기대 ANSWER / 출력 null / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: JSON 파싱 실패: Unterminated string in JSON at position 47 (line 1 column 48)


#### MT-0046 (회차 1)

**Q.**

> 그럼 기본량이 얼마나 남은 거죠?


**정답 예시**

> 국내 기본 데이터 1GB가 남았습니다.


**LLM 답변**

> [정상 answer 없음]
> {
>   "question": "인터넷 요금제에 대한 질문입니다. 기본량이 얼마나 남았는지 알고 싶습니다."
> }


**상태 / 근거 ID**

> 기대 ANSWER / 출력 null / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status, answer, evidence_ids


#### MT-0052 (회차 1)

**Q.**

> 그럼 그 데이터 혜택 그대로 쓰나요?


**정답 예시**

> 국내 데이터 혜택은 해외 로밍에 적용되지 않습니다. 구체 로밍 요금은 확인할 근거가 없습니다.


**LLM 답변**

> [정상 answer 없음]
> {}


**상태 / 근거 ID**

> 기대 PARTIAL / 출력 null / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status, answer, evidence_ids


#### MT-0054 (회차 1)

**Q.**

> 그럼 그 데이터 혜택 그대로 쓰나요?


**정답 예시**

> 국내 데이터 혜택은 해외 로밍에 적용되지 않습니다. 구체 로밍 요금은 확인할 근거가 없습니다.


**LLM 답변**

> [정상 answer 없음]
> {
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "ANSWER",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "PARTIAL",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "CLARIFY",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "ABSTAIN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "CONFLICT",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "OUT_OF_SCOPE",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "ANSWER",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "PARTIAL",
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "CLARIFY",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "ABSTAIN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "CONFLICT",
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "OUT_OF_SCOPE",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "return": "하겠습니다. ",
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "ANSWER",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "PARTIAL",
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "CLARIFY",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "ABSTAIN",
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "CONFLICT",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "OUT_OF_SCOPE",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "return": "하겠습니다. ",
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "ANSWER",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "PARTIAL",
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "CLARIFY",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "ABSTAIN",
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "CONFLICT",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "OUT_OF_SCOPE",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "UNKNOWN",
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "return": "하겠습니다. ",
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "ANSWER",
>   "answer": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "PARTIAL",
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "return": "네, 그 데이터 혜택 그대로 쓰셔도 됩니다.",
>   "evidence_ids": ["[추가 정보]"],
>   "status": "CLARIFY


**상태 / 근거 ID**

> 기대 PARTIAL / 출력 null / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: JSON 파싱 실패: Unterminated string in JSON at position 7849 (line 248 column 21)


#### MT-0060 (회차 1)

**Q.**

> 그럼 그 데이터 혜택 그대로 쓰나요?


**정답 예시**

> 국내 데이터 혜택은 해외 로밍에 적용되지 않습니다. 구체 로밍 요금은 확인할 근거가 없습니다.


**LLM 답변**

> [정상 answer 없음]
> {"evidence_ids": ["054", "083"]}


**상태 / 근거 ID**

> 기대 PARTIAL / 출력 null / evidence_ids ["054", "083"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status, answer


#### MT-0063 (회차 1)

**Q.**

> 그쪽 한도는 얼마나 남았어요?


**정답 예시**

> 테더링 한도는 5GB 남았습니다. 국내 기본 데이터 잔여량도 확인해야 합니다.


**LLM 답변**

> 그쪽 한도는 1GB로 이해했습니다. 그러나 누리 요금제에 대한 정보가 제공되지 않았습니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 null / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status, evidence_ids
> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(10%) — 누락 의심


#### MT-0066 (회차 1)

**Q.**

> 그쪽 한도는 얼마나 남았어요?


**정답 예시**

> 테더링 한도는 11GB 남았습니다. 국내 기본 데이터 잔여량도 확인해야 합니다.


**LLM 답변**

> [정상 answer 없음]
> {
>   "response": "테더링 사용량은 1GB로 이해했습니다. 테더링 한도는 월 12GB이며 국내 기본 데이터에서 함께 차감됩니다. 국내 혜택은 해외 로밍에 적용되지 않습니다. 테더링 한도는 월 12GB이며 국내 기본 데이터에서 함께 차감됩니다. 국내 혜택은 해외 로밍에 적용되지 않습니다."
> }


**상태 / 근거 ID**

> 기대 ANSWER / 출력 null / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status, answer, evidence_ids


#### MT-0071 (회차 1)

**Q.**

> 그럼 남은 기본 데이터는요?


**정답 예시**

> 정정된 사용량 기준으로 2GB 남았습니다.


**LLM 답변**

> [정상 answer 없음]
> {
>   "user_id": "12345",
>   "api_result": "5GB",
>   "evidence_ids": ["q", "faq-043", "q", "q"]
> }


**상태 / 근거 ID**

> 기대 ANSWER / 출력 null / evidence_ids ["q", "faq-043", "q", "q"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status, answer


#### MT-0071-R2 (회차 2)

**Q.**

> 그럼 남은 기본 데이터는요?


**정답 예시**

> 정정된 사용량 기준으로 2GB 남았습니다.


**LLM 답변**

> [정상 answer 없음]
> {
>   "usage_amount": 5,
>   "usage_type": "subscribed",
>   "usage_details": {
>     "month": 19000,
>     "country": "한국",
>     "data_limit": 5,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 3,
>     "country": "한국",
>     "data_limit": 5,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 4,
>     "country": "한국",
>     "data_limit": 5,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 5,
>     "country": "한국",
>     "data_limit": 2,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 3,
>     "country": "한국",
>     "data_limit": 2,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 4,
>     "country": "한국",
>     "data_limit": 2,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 5,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 3,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 4,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 5,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 3,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 4,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 5,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 3,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 4,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 5,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 3,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 4,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 5,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 3,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 4,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 5,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 3,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 4,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 5,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 3,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 4,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 5,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 3,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 4,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 5,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 3,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 4,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 5,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 3,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 4,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 5,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 3,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 4,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 5,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 3,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 4,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 5,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 3,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 4,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 5,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 3,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 4,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 5,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 3,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 4,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 5,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 3,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 4,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 5,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 3,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 4,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 5,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 3,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 4,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 5,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 3,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 4,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 5,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 3,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 4,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 5,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 3,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 4,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 5,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 3,
>     "country": "한국",
>     "data_limit": 3,
>     "data_usage_days": 1
>   },
>   "usage_details": {
>     "month": 4,
>     "country": "한국",
>     "data_limit": 3


**상태 / 근거 ID**

> 기대 ANSWER / 출력 null / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: JSON 파싱 실패: Expected ',' or '}' after property value in JSON at position 7873 (line 433 column 20)


#### MT-0071-R3 (회차 3)

**Q.**

> 그럼 남은 기본 데이터는요?


**정답 예시**

> 정정된 사용량 기준으로 2GB 남았습니다.


**LLM 답변**

> 그럼 남은 기본 데이터는요?


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["TEST_ONLY_SENTINEL_X7"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 실격: 질문 앞 15자 echo: "그럼 남은 기본 데이터는요?"
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(0%) — 누락 의심


#### MT-0075 (회차 1)

**Q.**

> 그럼 남은 기본 데이터는요?


**정답 예시**

> 정정된 사용량 기준으로 2GB 남았습니다.


**LLM 답변**

> [정상 answer 없음]
> {"evidence_ids": ["test_only_sentinel_x7"], "status": "ANSWER/PARTIAL/CLARIFY/ABSTAIN/CONFLICT/OUT_OF_SCOPE"}


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER/PARTIAL/CLARIFY/ABSTAIN/CONFLICT/OUT_OF_SCOPE" / evidence_ids ["test_only_sentinel_x7"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: answer


#### MT-0079 (회차 1)

**Q.**

> 그 요금제 기본 데이터는 얼마였죠?


**정답 예시**

> 처음 질문한 다온의 기본 데이터는 20GB입니다.


**LLM 답변**

> 가상 다온 요금제는 월 31000원, 국내 데이터 20GB입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 null / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status, evidence_ids
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.719) / 필수 사실 커버리지가 낮음(17%) — 누락 의심


#### MT-0080 (회차 1)

**Q.**

> 그 요금제 기본 데이터는 얼마였죠?


**정답 예시**

> 처음 질문한 여울의 기본 데이터는 25GB입니다.


**LLM 답변**

> 39000원


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(0%) — 누락 의심


#### MT-0082 (회차 1)

**Q.**

> 그 요금제 기본 데이터는 얼마였죠?


**정답 예시**

> 처음 질문한 온빛의 기본 데이터는 35GB입니다.


**LLM 답변**

> 47000원


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(0%) — 누락 의심


#### MT-0085 (회차 1)

**Q.**

> 그 요금제 기본 데이터는 얼마였죠?


**정답 예시**

> 처음 질문한 이음의 기본 데이터는 50GB입니다.


**LLM 답변**

> 가상 새봄 요금제는 월 19000원, 국내 데이터 5GB입니다. 기본량 소진 후 1Mbps로 계속 이용하며 추가 데이터 요금은 없습니다. 테더링 한도는 월 2GB이며 국내 기본 데이터에서 함께 차감됩니다. 국내 혜택은 해외 로밍에 적용되지 않습니다. 기관별로 차감 금액이 다릅니다. 월 2GB의 기본량 소진 이후 1Mbps로 계속 이용하며 추가 데이터 요금은 없습니다. 테더링 한도는 월 2GB이며 국내 기본 데이터에서 함께 차감됩니다. 해외 로밍은 신청할 수 있지만 기존 약정에 따른 위약금이 발생할 수 있습니다. 문의는 고객센터 또는 로밍센터로 연락하여 확인하시기 바랍니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 표현 감점: repeatedSentence(-30), lengthBand(-15)
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(17%) — 누락 의심


#### MT-0089 (회차 1)

**Q.**

> 그건 다 쓰면 돈이 나가요?


**정답 예시**

> 어느 요금제를 가리키는지 모호하므로 두 요금제 중 대상을 확인해야 합니다.


**LLM 답변**

> 부분적


**상태 / 근거 ID**

> 기대 CLARIFY / 출력 "ANSWER" / evidence_ids ["유사한 FAQ ID", "데이터 추가 사용", "로밍", "소액결제", "부가서비스"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(0%) — 누락 의심


#### MT-0089-R2 (회차 2)

**Q.**

> 그건 다 쓰면 돈이 나가요?


**정답 예시**

> 어느 요금제를 가리키는지 모호하므로 두 요금제 중 대상을 확인해야 합니다.


**LLM 답변**

> 다온 요금제는 월 31000원, 국내 데이터 25GB입니다. 기본량 소진 후 데이터가 차단되며 자동 추가 요금은 없습니다. 테더링 한도는 월 10GB이며 국내 기본 데이터에서 함께 차감됩니다. 국내 혜택은 해외 로밍에 적용되지 않습니다.


**상태 / 근거 ID**

> 기대 CLARIFY / 출력 null / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status, evidence_ids
> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(13%) — 누락 의심


#### MT-0089-R3 (회차 3)

**Q.**

> 그건 다 쓰면 돈이 나가요?


**정답 예시**

> 어느 요금제를 가리키는지 모호하므로 두 요금제 중 대상을 확인해야 합니다.


**LLM 답변**

> 데이터 추가 사용, 로밍, 소액결제, 부가서비스 등의 상세 내역을 확인해 주세요.


**상태 / 근거 ID**

> 기대 CLARIFY / 출력 null / evidence_ids ["SYN-P05", "SYN-P04"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status
> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(0%) — 누락 의심


#### MT-0093 (회차 1)

**Q.**

> 그건 다 쓰면 돈이 나가요?


**정답 예시**

> 어느 요금제를 가리키는지 모호하므로 두 요금제 중 대상을 확인해야 합니다.


**LLM 답변**

> 통신 서비스 이용 시 해외 전화번호로 전화를 걸 수 있습니다.


**상태 / 근거 ID**

> 기대 CLARIFY / 출력 null / evidence_ids ["SYN-P08", "SYN-P09"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status
> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(0%) — 누락 의심


#### MT-0096 (회차 1)

**Q.**

> 그럼 제 회선은 지금 얼마나 남았어요?


**정답 예시**

> 이전 사용량은 다른 회선 정보이므로 재사용할 수 없습니다. 현재 회선 사용량을 확인해야 합니다.


**LLM 답변**

> [정상 answer 없음]
> {}


**상태 / 근거 ID**

> 기대 CLARIFY / 출력 null / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status, answer, evidence_ids


#### MT-0096-R2 (회차 2)

**Q.**

> 그럼 제 회선은 지금 얼마나 남았어요?


**정답 예시**

> 이전 사용량은 다른 회선 정보이므로 재사용할 수 없습니다. 현재 회선 사용량을 확인해야 합니다.


**LLM 답변**

> [정상 answer 없음]
> {}


**상태 / 근거 ID**

> 기대 CLARIFY / 출력 null / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status, answer, evidence_ids


#### MT-0096-R3 (회차 3)

**Q.**

> 그럼 제 회선은 지금 얼마나 남았어요?


**정답 예시**

> 이전 사용량은 다른 회선 정보이므로 재사용할 수 없습니다. 현재 회선 사용량을 확인해야 합니다.


**LLM 답변**

> 1GB가 남았습니다.


**상태 / 근거 ID**

> 기대 CLARIFY / 출력 "ANSWER" / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(0%) — 누락 의심


#### MT-0105 (회차 1)

**Q.**

> 그럼 제 회선은 지금 얼마나 남았어요?


**정답 예시**

> 이전 사용량은 다른 회선 정보이므로 재사용할 수 없습니다. 현재 회선 사용량을 확인해야 합니다.


**LLM 답변**

> [정상 answer 없음]
> {"status": "ANSWER", "answer": "1GB", "evidence_ids": ["0000000000000000000000000000000


**상태 / 근거 ID**

> 기대 CLARIFY / 출력 null / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: JSON 파싱 실패: Unterminated string in JSON at position 87 (line 1 column 88)


#### MT-0109 (회차 1)

**Q.**

> 현재 쓰는 요금제의 월 요금은요?


**정답 예시**

> 변경 전 현재 요금제는 다온이며 월 31000원입니다. 변경 의향을 완료로 처리하지 않습니다.


**LLM 답변**

> [정상 answer 없음]
> {}


**상태 / 근거 ID**

> 기대 ANSWER / 출력 null / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status, answer, evidence_ids


#### MT-0109-R2 (회차 2)

**Q.**

> 현재 쓰는 요금제의 월 요금은요?


**정답 예시**

> 변경 전 현재 요금제는 다온이며 월 31000원입니다. 변경 의향을 완료로 처리하지 않습니다.


**LLM 답변**

> 현재 사용하는 요금제 월 요금은 35000원입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 null / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status, evidence_ids
> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(10%) — 누락 의심


#### MT-0109-R3 (회차 3)

**Q.**

> 현재 쓰는 요금제의 월 요금은요?


**정답 예시**

> 변경 전 현재 요금제는 다온이며 월 31000원입니다. 변경 의향을 완료로 처리하지 않습니다.


**LLM 답변**

> 현재 사용하는 요금제 월 요금은 35000원입니다. 국내 데이터 25GB의 기본량 소진 후 1Mbps로 계속 이용하며 추가 데이터 요금은 없습니다. 테더링 한도는 월 10GB이며 국내 기본 데이터에서 함께 차감됩니다. 국내 혜택은 해외 로밍에 적용되지 않습니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["FAQ-050", "SYN-P05", "FAQ-085"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)
> 출처 오매칭 숫자: ['1']
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.738) / 필수 사실 커버리지가 낮음(20%) — 누락 의심 / 답변의 숫자가 인용한 근거가 아닌 다른 FAQ/정책에서 온 것으로 보임 — 출처 오매칭 의심


#### MT-0111 (회차 1)

**Q.**

> 현재 쓰는 요금제의 월 요금은요?


**정답 예시**

> 변경 전 현재 요금제는 하람이며 월 39000원입니다. 변경 의향을 완료로 처리하지 않습니다.


**LLM 답변**

> 현재 사용하는 요금제는 월 39000원, 국내 데이터 35GB입니다. 기본량 소진 후 1Mbps로 계속 이용하며 추가 데이터 요금은 없습니다. 테더링 한도는 월 14GB이며 국내 기본 데이터에서 함께 차감됩니다. 국내 혜택은 해외 로밍에 적용되지 않습니다. 테더링 한도는 월 12GB이며 국내 기본 데이터에서 함께 차감됩니다. 국내 혜택은 해외 로밍에 적용되지 않습니다. 요금 확인 및 적용 방법은 앱이나 홈페이지에서 확인하실 수 있습니다. 휴대폰을 중고 기기로 변경해도 되지만, 기기 변경 절차 후 이용 가능합니다. 앱이나 홈페이지에서 요금 확인 및 적용 방법을 확인하시면 됩니다. 문의 사항은 언제든지 환영합니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER/PARTIAL/CLARIFY/ABSTAIN/CONFLICT/OUT_OF_SCOPE" / evidence_ids null


**AI 검토 의견**

> 하람 가격에 온빛 데이터·속도 조건을 섞었다.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 표현 감점: repeatedSentence(-30), lengthBand(-15)
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.726)


</details>

**채점 결과**

| ID | 답변 정확도(자동) | 의미 유사도 | 키워드 포함률 | RAG 충실도 | 표현 점수/100 | 포맷 | 기대 상태 일치 | 응답 ms | TPS(토큰/s) | 재판단 필요 여부 |
|---|---|---|---|---|---|---|---|---|---|---|
| MT-0005 | 실패 | 0.606 | 0.0% | 실패 | 85 | 실패 | 불일치 | 249 | 467.6 | 있음 |
| MT-0009 | 실패 | 0.731 | 0.0% | 실패 | 85 | 실패 | 불일치 | 257 | 451.2 | 있음 |
| MT-0012 | 실패 | 0.705 | 20.0% | 실패 | 85 | 실패 | 불일치 | 286 | 377.2 | 있음 |
| MT-0016 | N/A(미채점) | N/A | N/A | N/A(미채점) | N/A | 실패 | 불일치 | 182 | 443.3 | 없음 |
| MT-0019 | N/A(미채점) | N/A | N/A | N/A(미채점) | N/A | 실패 | 불일치 | 183 | 445.9 | 없음 |
| MT-0022 | 실패 | 0.529 | 0.0% | 실패 | 85 | 실패 | 불일치 | 326 | 446.2 | 있음 |
| MT-0025 | N/A(미채점) | N/A | N/A | N/A(미채점) | N/A | 실패 | 불일치 | 243 | 421.4 | 없음 |
| MT-0037 | N/A(미채점) | N/A | N/A | N/A(미채점) | N/A | 실패 | 불일치 | 495 | 369.8 | 없음 |
| MT-0037-R2 | 실패 | 0.787 | 0.0% | 실패 | 100 | 실패 | 불일치 | 188 | 462.7 | 있음 |
| MT-0037-R3 | 실패 | 0.693 | 0.0% | 실패 | 85 | 통과 | 일치 | 139 | 480.0 | 있음 |
| MT-0044 | N/A(미채점) | N/A | N/A | N/A(미채점) | N/A | 실패 | 불일치 | 259 | N/A | 없음 |
| MT-0046 | N/A(미채점) | N/A | N/A | N/A(미채점) | N/A | 실패 | 불일치 | 1699 | 457.1 | 없음 |
| MT-0052 | N/A(미채점) | N/A | N/A | N/A(미채점) | N/A | 실패 | 불일치 | 195 | 466.0 | 없음 |
| MT-0054 | N/A(미채점) | N/A | N/A | N/A(미채점) | N/A | 실패 | 불일치 | 7455 | 475.6 | 없음 |
| MT-0060 | N/A(미채점) | N/A | N/A | N/A(미채점) | N/A | 실패 | 불일치 | 209 | 493.4 | 없음 |
| MT-0063 | 실패 | 0.643 | 10.0% | 실패 | 85 | 실패 | 불일치 | 245 | 499.7 | 있음 |
| MT-0066 | N/A(미채점) | N/A | N/A | N/A(미채점) | N/A | 실패 | 불일치 | 400 | 491.1 | 없음 |
| MT-0071 | N/A(미채점) | N/A | N/A | N/A(미채점) | N/A | 실패 | 불일치 | 300 | 413.1 | 없음 |
| MT-0071-R2 | N/A(미채점) | N/A | N/A | N/A(미채점) | N/A | 실패 | 불일치 | 7451 | 469.2 | 없음 |
| MT-0071-R3 | 실패 | 0.545 | 0.0% | 실패 | 0 | 통과 | 일치 | 282 | 455.1 | 있음 |
| MT-0075 | N/A(미채점) | N/A | N/A | N/A(미채점) | N/A | 실패 | 불일치 | 258 | 483.7 | 없음 |
| MT-0079 | 실패 | 0.719 | 16.7% | 통과 | 100 | 실패 | 불일치 | 358 | 492.8 | 있음 |
| MT-0080 | 실패 | 0.427 | 0.0% | 실패 | 85 | 실패 | 일치 | 339 | 220.6 | 있음 |
| MT-0082 | 실패 | 0.436 | 0.0% | 통과 | 85 | 실패 | 일치 | 289 | 470.7 | 있음 |
| MT-0085 | 실패 | 0.539 | 16.7% | 실패 | 55 | 실패 | 일치 | 2378 | 258.4 | 있음 |
| MT-0089 | 실패 | 0.382 | 0.0% | 실패 | 85 | 통과 | 불일치 | 365 | 459.6 | 있음 |
| MT-0089-R2 | 실패 | 0.525 | 12.5% | 실패 | 85 | 실패 | 불일치 | 329 | 407.8 | 있음 |
| MT-0089-R3 | 실패 | 0.564 | 0.0% | 통과 | 85 | 실패 | 불일치 | 185 | 481.7 | 있음 |
| MT-0093 | 실패 | 0.453 | 0.0% | 실패 | 85 | 실패 | 불일치 | 299 | 464.0 | 있음 |
| MT-0096 | N/A(미채점) | N/A | N/A | N/A(미채점) | N/A | 실패 | 불일치 | 237 | 515.6 | 없음 |
| MT-0096-R2 | N/A(미채점) | N/A | N/A | N/A(미채점) | N/A | 실패 | 불일치 | 72 | 890.1 | 없음 |
| MT-0096-R3 | 실패 | 0.576 | 0.0% | 실패 | 85 | 실패 | 불일치 | 133 | 334.4 | 있음 |
| MT-0105 | N/A(미채점) | N/A | N/A | N/A(미채점) | N/A | 실패 | 불일치 | 297 | N/A | 없음 |
| MT-0109 | N/A(미채점) | N/A | N/A | N/A(미채점) | N/A | 실패 | 불일치 | 205 | 459.7 | 없음 |
| MT-0109-R2 | 실패 | 0.817 | 10.0% | 실패 | 85 | 실패 | 불일치 | 209 | 297.0 | 있음 |
| MT-0109-R3 | 실패 | 0.738 | 20.0% | 실패 | 85 | 통과 | 일치 | 343 | 481.9 | 있음 |
| MT-0111 | 실패 | 0.726 | 50.0% | 실패 | 55 | 실패 | 불일치 | 844 | 327.8 | 있음 |


### 8. `gemma3:1b`

[원본 응답](../raw/test2/local-win_gemma3-1b_20260917/generation.jsonl) · [원본 통합 CSV](../scored/test2/local-win_gemma3-1b_20260917/review.csv)

<details>
<summary>질문 · 정답 · LLM 답변 · AI 검토 의견 (반복 회차 포함)</summary>

#### MT-0005 (회차 1)

**Q.**

> 그건 한 달에 얼마예요?


**정답 예시**

> 여울은 월 35000원입니다.


**LLM 답변**

> 여울 요금제는 월 35000원입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "CLARIFY" / evidence_ids null


**AI 검토 의견**

> 가격은 맞지만 CLARIFY이며 근거 배열이 없다.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids


#### MT-0009 (회차 1)

**Q.**

> 그건 한 달에 얼마예요?


**정답 예시**

> 나래은 월 51000원입니다.


**LLM 답변**

> 나래 요금제의 월 지불액은 월 51000원입니다. 초과량의 국내 데이터 사용량에 따라 1GB당 180원이 추가 청구됩니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "PARTIAL" / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.730)


#### MT-0012 (회차 1)

**Q.**

> 거기 데이터는 얼마나 들어 있어요?


**정답 예시**

> 푸른의 국내 기본 데이터는 10GB입니다.


**LLM 답변**

> 가상 푸른 요금제는 월 23000원입니다. 국내 데이터 10GB를 지원하며 기본량 소진 후 데이터가 차단되지는 않습니다. 국내 혜택은 해외 로밍에 적용되지 않습니다. 테더링 한도는 월 4GB이며 국내 기본 데이터에서 함께 차감됩니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "PARTIAL" / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.762)


#### MT-0016 (회차 1)

**Q.**

> 거기 데이터는 얼마나 들어 있어요?


**정답 예시**

> 하람의 국내 기본 데이터는 30GB입니다.


**LLM 답변**

> 가상 하람 요금제는 월 39000원, 국내 데이터 30GB입니다. 기본량을 넘는 국내 데이터는 1GB당 150원이 추가 청구됩니다. 이 테스트에서는 초과량을 정수 GB로 계산합니다. 테더링 한도 는 월 12GB이며 국내 기본 데이터에서 함께 차감됩니다. 국내 혜택은 해외 로밍에 적용되지 않습니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "PARTIAL" / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: status는 불일치하지만 키워드커버리지·숫자검증은 통과 — 표현 차이 가능성 / BGE-M3 유사도가 임계값 근처 (0.762)


#### MT-0019 (회차 1)

**Q.**

> 거기 데이터는 얼마나 들어 있어요?


**정답 예시**

> 나래의 국내 기본 데이터는 45GB입니다.


**LLM 답변**

> 나래 요금제는 월 51000원이며, 국내 데이터 45GB입니다. 기본량이 넘는 국내 데이터는 1GB당 180원이 추가 청구됩니다. 이 테스트에서는 초과량을 정수 GB로 계산합니다. 테더링 한도는 월 18GB이며 국내 기본 데이터에서 함께 차감됩니다. 국내 혜택은 해외 로밍에 적용되지 않습니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "PARTIAL" / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: status는 불일치하지만 키워드커버리지·숫자검증은 통과 — 표현 차이 가능성 / BGE-M3 유사도가 임계값 근처 (0.785)


#### MT-0022 (회차 1)

**Q.**

> 그걸 다 쓰면요?


**정답 예시**

> 기본량 소진 후 데이터가 차단되며 자동 추가 요금은 없습니다.


**LLM 답변**

> 가상 푸른 요금제의 요금은 월 23000원이고, 국내 데이터는 10GB입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "PARTIAL" / evidence_ids ["SYN-P02"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 자동 재판단 사유: 필수 사실 커버리지가 낮음(13%) — 누락 의심


#### MT-0025 (회차 1)

**Q.**

> 그걸 다 쓰면요?


**정답 예시**

> 기본량 소진 후 데이터가 차단되며 자동 추가 요금은 없습니다.


**LLM 답변**

> 기본 25GB입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "PARTIAL" / evidence_ids "[SYN-P05]20231206131000"


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: evidence_ids가 문자열 배열이 아님
> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(0%) — 누락 의심


#### MT-0037 (회차 1)

**Q.**

> 그 요금제 월 요금 알려주세요.


**정답 예시**

> 정정된 가온은 월 47000원입니다.


**LLM 답변**

> 가상 온빛 요금제의 월 요금은 월 43000원입니다. 국내 데이터는 35GB 입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "PARTIAL" / evidence_ids ["FAQ-036", "SYN-P07"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 자동 재판단 사유: 필수 사실 커버리지가 낮음(0%) — 누락 의심


#### MT-0037-R2 (회차 2)

**Q.**

> 그 요금제 월 요금 알려주세요.


**정답 예시**

> 정정된 가온은 월 47000원입니다.


**LLM 답변**

> 가온 요금제 월 요금은 월 47000원입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "PARTIAL" / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(33%) — 누락 의심


#### MT-0037-R3 (회차 3)

**Q.**

> 그 요금제 월 요금 알려주세요.


**정답 예시**

> 정정된 가온은 월 47000원입니다.


**LLM 답변**

> 가상 온빛 요금제는 월 43000원입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "PARTIAL" / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.731) / 필수 사실 커버리지가 낮음(0%) — 누락 의심


#### MT-0044 (회차 1)

**Q.**

> 그럼 기본량이 얼마나 남은 거죠?


**정답 예시**

> 국내 기본 데이터 1GB가 남았습니다.


**LLM 답변**

> 기본량은 7670GB 입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "PARTIAL" / evidence_ids ["SYN-P04"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)
> 미검증 숫자: ['7670']
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.701) / 필수 사실 커버리지가 낮음(20%) — 누락 의심


#### MT-0046 (회차 1)

**Q.**

> 그럼 기본량이 얼마나 남은 거죠?


**정답 예시**

> 국내 기본 데이터 1GB가 남았습니다.


**LLM 답변**

> 기본량이 29GB입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "PARTIAL" / evidence_ids ["FAQ-019"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)
> 미검증 숫자: ['29']
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.736) / 필수 사실 커버리지가 낮음(20%) — 누락 의심


#### MT-0052 (회차 1)

**Q.**

> 그럼 그 데이터 혜택 그대로 쓰나요?


**정답 예시**

> 국내 데이터 혜택은 해외 로밍에 적용되지 않습니다. 구체 로밍 요금은 확인할 근거가 없습니다.


**LLM 답변**

> 푸른 요금제는 해외 이용 시 유심 교환만 가능합니다. 국내 데이터 사용량에 한함이 있습니다 (월 4GB, 국내 기본 데이터에서 차감), 로밍에는 적용되지 않습니다.  필요한 내용이 더 있으실까요?


**상태 / 근거 ID**

> 기대 PARTIAL / 출력 "PARTIAL" / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 표현 감점: spacingSpelling(-10)
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.714)


#### MT-0054 (회차 1)

**Q.**

> 그럼 그 데이터 혜택 그대로 쓰나요?


**정답 예시**

> 국내 데이터 혜택은 해외 로밍에 적용되지 않습니다. 구체 로밍 요금은 확인할 근거가 없습니다.


**LLM 답변**

> 해외 이용 상황으로 이해했습니다. 다온 요금제의 국내 데이터 조건은 가상 다온 요금제는 월 31000원이며, 국내 데이터 20GB입니다. 테더링 한도는 월 8GB입니다.


**상태 / 근거 ID**

> 기대 PARTIAL / 출력 "PARTIAL" / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(23%) — 누락 의심


#### MT-0060 (회차 1)

**Q.**

> 그럼 그 데이터 혜택 그대로 쓰나요?


**정답 예시**

> 국내 데이터 혜택은 해외 로밍에 적용되지 않습니다. 구체 로밍 요금은 확인할 근거가 없습니다.


**LLM 답변**

> 해외 이용을 위해 사용하는 경우, 국내 데이터 사용 조건과 연계하여 해외 로밍에는 적용되지 않는다는 점을 알려드립니다. 국내 데이터 이용 시에는 월 55000원이고, 테더링 한도는 월 20GB 입니다.


**상태 / 근거 ID**

> 기대 PARTIAL / 출력 "PARTIAL" / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.733)


#### MT-0063 (회차 1)

**Q.**

> 그쪽 한도는 얼마나 남았어요?


**정답 예시**

> 테더링 한도는 5GB 남았습니다. 국내 기본 데이터 잔여량도 확인해야 합니다.


**LLM 답변**

> 가입 기준과 가족 관계 확인 서류를 확인한 후에, 가족 결합을 신청하면 됩니다. 기본량을 넘는 국내 데이터를 1GB당 120원이 추가 청구합니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "PARTIAL" / evidence_ids ["FAQ-084", "SYN-P03"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


#### MT-0066 (회차 1)

**Q.**

> 그쪽 한도는 얼마나 남았어요?


**정답 예시**

> 테더링 한도는 11GB 남았습니다. 국내 기본 데이터 잔여량도 확인해야 합니다.


**LLM 답변**

> 하람 요금제의 기본 요금은 월 39000원입니다. 초과 데이터 이용 시 1GB당 150원 추가 청구됩니다. 테스트에서는 초과량을 정수 GB로 계산했습니다. 기본량을 넘는 국내 데이터는 해외 로밍에 적용되지 않습니다. 월 12GB의 휴대폰 중고 기기 변경은 가능합니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "CLARify" / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 표현 감점: lengthBand(-15)


#### MT-0071 (회차 1)

**Q.**

> 그럼 남은 기본 데이터는요?


**정답 예시**

> 정정된 사용량 기준으로 2GB 남았습니다.


**LLM 답변**

> 기본 데이터는 3GB입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "PARTIAL" / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 표현 감점: lengthBand(-15)
> 미검증 숫자: ['3']
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.710) / 필수 사실 커버리지가 낮음(0%) — 누락 의심


#### MT-0071-R2 (회차 2)

**Q.**

> 그럼 남은 기본 데이터는요?


**정답 예시**

> 정정된 사용량 기준으로 2GB 남았습니다.


**LLM 답변**

> 기본 데이터는 3GB입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "PARTIAL" / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 표현 감점: lengthBand(-15)
> 미검증 숫자: ['3']
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.710) / 필수 사실 커버리지가 낮음(0%) — 누락 의심


#### MT-0071-R3 (회차 3)

**Q.**

> 그럼 남은 기본 데이터는요?


**정답 예시**

> 정정된 사용량 기준으로 2GB 남았습니다.


**LLM 답변**

> 기본 데이터는 3GB 입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "PARTIAL" / evidence_ids ["SYN-P01", "FAQ-043"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)
> 미검증 숫자: ['3']
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.713) / 필수 사실 커버리지가 낮음(0%) — 누락 의심


#### MT-0075 (회차 1)

**Q.**

> 그럼 남은 기본 데이터는요?


**정답 예시**

> 정정된 사용량 기준으로 2GB 남았습니다.


**LLM 답변**

> 기본 데이터는 23GB입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "PARTIAL" / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 표현 감점: lengthBand(-15)
> 미검증 숫자: ['23']
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(0%) — 누락 의심


#### MT-0079 (회차 1)

**Q.**

> 그 요금제 기본 데이터는 얼마였죠?


**정답 예시**

> 처음 질문한 다온의 기본 데이터는 20GB입니다.


**LLM 답변**

> 가상 다온 요금제는 월 31000원입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 null / evidence_ids ["SYN-P04"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status
> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(0%) — 누락 의심


#### MT-0080 (회차 1)

**Q.**

> 그 요금제 기본 데이터는 얼마였죠?


**정답 예시**

> 처음 질문한 여울의 기본 데이터는 25GB입니다.


**LLM 답변**

> 하람 요금제의 기본 데이터는 월 35000원입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "PARTIAL" / evidence_ids ["SYN-P05", "SYN-P06", "SYN-P011"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(33%) — 누락 의심


#### MT-0082 (회차 1)

**Q.**

> 그 요금제 기본 데이터는 얼마였죠?


**정답 예시**

> 처음 질문한 온빛의 기본 데이터는 35GB입니다.


**LLM 답변**

> 가상 온빛 요금제는 월 43000원입니다. 기본량은 35GB이며, 국내 데이터는 40GB로 유지됩니다. 국내 혜택은 해외 로밍에 적용되지 않으므로, 해외로의 통화는 국제전화를 이용해야 합니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "PARTIAL" / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.726) / 필수 사실 커버리지가 낮음(33%) — 누락 의심


#### MT-0085 (회차 1)

**Q.**

> 그 요금제 기본 데이터는 얼마였죠?


**정답 예시**

> 처음 질문한 이음의 기본 데이터는 50GB입니다.


**LLM 답변**

> 가상 이음 요금제 기본 데이터는 월 55000원입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 null / evidence_ids ["SYN-P10", "SYN-P04"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status
> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.712) / 필수 사실 커버리지가 낮음(33%) — 누락 의심


#### MT-0089 (회차 1)

**Q.**

> 그건 다 쓰면 돈이 나가요?


**정답 예시**

> 어느 요금제를 가리키는지 모호하므로 두 요금제 중 대상을 확인해야 합니다.


**LLM 답변**

> 다온과 여울 요금제 중 어떤 부분에 대해 궁금하신가요?


**상태 / 근거 ID**

> 기대 CLARIFY / 출력 "PARTIAL" / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(13%) — 누락 의심


#### MT-0089-R2 (회차 2)

**Q.**

> 그건 다 쓰면 돈이 나가요?


**정답 예시**

> 어느 요금제를 가리키는지 모호하므로 두 요금제 중 대상을 확인해야 합니다.


**LLM 답변**

> 다온 요금제의 월 요금은 31000원이고, 국내 데이터는 20GB입니다. 데이터 추가 사용, 로밍, 소액결제, 부가서비스 등의 상세 내역을 꼼꼼하게 확인해 보세요.


**상태 / 근거 ID**

> 기대 CLARIFY / 출력 "PARTIAL" / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(13%) — 누락 의심


#### MT-0089-R3 (회차 3)

**Q.**

> 그건 다 쓰면 돈이 나가요?


**정답 예시**

> 어느 요금제를 가리키는지 모호하므로 두 요금제 중 대상을 확인해야 합니다.


**LLM 답변**

> 다온 요금제의 월 요금이 궁금하신가요? 31000원이며, 국내 데이터는 20GB입니다.


**상태 / 근거 ID**

> 기대 CLARIFY / 출력 "PARTIAL" / evidence_ids ["FAQ-038"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)
> 출처 오매칭 숫자: ['31000', '20']
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(13%) — 누락 의심 / 답변의 숫자가 인용한 근거가 아닌 다른 FAQ/정책에서 온 것으로 보임 — 출처 오매칭 의심


#### MT-0093 (회차 1)

**Q.**

> 그건 다 쓰면 돈이 나가요?


**정답 예시**

> 어느 요금제를 가리키는지 모호하므로 두 요금제 중 대상을 확인해야 합니다.


**LLM 답변**

> 가온과 나래 요금제 차이점을 비교하려면 먼저 각각의 요금제에 대한 정보를 자세히 들여다봐야 해요. 가온 요금제는 월 47000원이고 국내 데이터는 40GB입니다. 나래 요금제는 월 51000원이고 국내 데이터는 45GB입니다. 데이터 사용량에 따라 추가 요금이 발생하니, 데이터 사용량과 관련된 요금을 확인해보세요.


**상태 / 근거 ID**

> 기대 CLARIFY / 출력 "PARTIAL" / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(13%) — 누락 의심


#### MT-0096 (회차 1)

**Q.**

> 그럼 제 회선은 지금 얼마나 남았어요?


**정답 예시**

> 이전 사용량은 다른 회선 정보이므로 재사용할 수 없습니다. 현재 회선 사용량을 확인해야 합니다.


**LLM 답변**

> 현재 제 회선은 4GB가 남아있습니다.


**상태 / 근거 ID**

> 기대 CLARIFY / 출력 "PARTIAL" / evidence_ids ["FAQ-031", "SYN-P01"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)
> 미검증 숫자: ['4']
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(25%) — 누락 의심


#### MT-0096-R2 (회차 2)

**Q.**

> 그럼 제 회선은 지금 얼마나 남았어요?


**정답 예시**

> 이전 사용량은 다른 회선 정보이므로 재사용할 수 없습니다. 현재 회선 사용량을 확인해야 합니다.


**LLM 답변**

> 가상 새봄 요금제는 월 19000원, 국내 데이터 5GB입니다.


**상태 / 근거 ID**

> 기대 CLARIFY / 출력 "PARTIAL" / evidence_ids ["FAQ-031", "SYN-P01"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(0%) — 누락 의심


#### MT-0096-R3 (회차 3)

**Q.**

> 그럼 제 회선은 지금 얼마나 남았어요?


**정답 예시**

> 이전 사용량은 다른 회선 정보이므로 재사용할 수 없습니다. 현재 회선 사용량을 확인해야 합니다.


**LLM 답변**

> 가상 새봄 요금제는 월 19000원입니다.


**상태 / 근거 ID**

> 기대 CLARIFY / 출력 null / evidence_ids []


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: status
> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(0%) — 누락 의심


#### MT-0105 (회차 1)

**Q.**

> 그럼 제 회선은 지금 얼마나 남았어요?


**정답 예시**

> 이전 사용량은 다른 회선 정보이므로 재사용할 수 없습니다. 현재 회선 사용량을 확인해야 합니다.


**LLM 답변**

> 제 회선은 현재 49GB를 사용했고, 49GB에서 55000원(월 55000원)까지 사용하신 것을 기준으로 49GB를 사용할 수 있게 되었어요.


**상태 / 근거 ID**

> 기대 CLARIFY / 출력 "PARTIAL" / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 미검증 숫자: ['49']
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(25%) — 누락 의심


#### MT-0109 (회차 1)

**Q.**

> 현재 쓰는 요금제의 월 요금은요?


**정답 예시**

> 변경 전 현재 요금제는 다온이며 월 31000원입니다. 변경 의향을 완료로 처리하지 않습니다.


**LLM 답변**

> 현재 사용하시는 요금제의 월 요금은 다음과 같습니다. (정확한 요금은 아래 내용과 다를 수 있으며, 사용하시는 요금제와 정책에 따라 달라집니다.)


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "PARTIAL" / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.765) / 필수 사실 커버리지가 낮음(10%) — 누락 의심


#### MT-0109-R2 (회차 2)

**Q.**

> 현재 쓰는 요금제의 월 요금은요?


**정답 예시**

> 변경 전 현재 요금제는 다온이며 월 31000원입니다. 변경 의향을 완료로 처리하지 않습니다.


**LLM 답변**

> 가입하신 다온 요금제는 월 31000원입니다. 혜택에 대한 질문이 있으신가요?


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "PARTIAL" / evidence_ids null


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(20%) — 누락 의심


#### MT-0109-R3 (회차 3)

**Q.**

> 현재 쓰는 요금제의 월 요금은요?


**정답 예시**

> 변경 전 현재 요금제는 다온이며 월 31000원입니다. 변경 의향을 완료로 처리하지 않습니다.


**LLM 답변**

> 다온 요금제를 신청하신 거군요. 현재 사용 중인 요금제의 월 요금은 31000원입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "PARTIAL" / evidence_ids ["FAQ-088"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)
> 출처 오매칭 숫자: ['31000']
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(20%) — 누락 의심 / 답변의 숫자가 인용한 근거가 아닌 다른 FAQ/정책에서 온 것으로 보임 — 출처 오매칭 의심


#### MT-0111 (회차 1)

**Q.**

> 현재 쓰는 요금제의 월 요금은요?


**정답 예시**

> 변경 전 현재 요금제는 하람이며 월 39000원입니다. 변경 의향을 완료로 처리하지 않습니다.


**LLM 답변**

> 현재 월 요금은 39000원입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "PARTIAL" / evidence_ids null


**AI 검토 의견**

> 39000원은 맞지만 PARTIAL이고 근거 배열이 없다.


**자동 진단 (AI 확정 판정과 구분)**

> 포맷: 필수 키 누락: evidence_ids
> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(20%) — 누락 의심


</details>

**채점 결과**

| ID | 답변 정확도(자동) | 의미 유사도 | 키워드 포함률 | RAG 충실도 | 표현 점수/100 | 포맷 | 기대 상태 일치 | 응답 ms | TPS(토큰/s) | 재판단 필요 여부 |
|---|---|---|---|---|---|---|---|---|---|---|
| MT-0005 | 실패 | 0.924 | 50.0% | N/A(스킵) | 100 | 실패 | 불일치 | 420 | 220.6 | 없음 |
| MT-0009 | 실패 | 0.730 | 50.0% | 실패 | 85 | 실패 | 불일치 | 433 | 246.1 | 있음 |
| MT-0012 | 실패 | 0.762 | 40.0% | 실패 | 85 | 실패 | 불일치 | 532 | 239.5 | 있음 |
| MT-0016 | 통과 | 0.762 | 80.0% | 실패 | 85 | 실패 | 불일치 | 618 | 246.7 | 있음 |
| MT-0019 | 통과 | 0.785 | 80.0% | 실패 | 85 | 실패 | 불일치 | 606 | 243.5 | 있음 |
| MT-0022 | 실패 | 0.533 | 12.5% | 실패 | 100 | 통과 | 불일치 | 465 | 240.8 | 있음 |
| MT-0025 | 실패 | 0.578 | 0.0% | 실패 | 85 | 실패 | 불일치 | 412 | 231.0 | 있음 |
| MT-0037 | 실패 | 0.642 | 0.0% | 실패 | 100 | 통과 | 불일치 | 438 | 285.9 | 있음 |
| MT-0037-R2 | 실패 | 0.874 | 33.3% | 통과 | 100 | 실패 | 불일치 | 262 | 222.3 | 있음 |
| MT-0037-R3 | 실패 | 0.731 | 0.0% | 통과 | 85 | 실패 | 불일치 | 241 | 223.6 | 있음 |
| MT-0044 | 실패 | 0.701 | 20.0% | 실패 | 85 | 통과 | 불일치 | 458 | 256.9 | 있음 |
| MT-0046 | 실패 | 0.736 | 20.0% | 실패 | 85 | 통과 | 불일치 | 450 | 201.5 | 있음 |
| MT-0052 | 실패 | 0.714 | 53.8% | 실패 | 90 | 실패 | 일치 | 489 | 281.1 | 있음 |
| MT-0054 | 실패 | 0.617 | 23.1% | 실패 | 100 | 실패 | 일치 | 568 | 286.1 | 있음 |
| MT-0060 | 실패 | 0.733 | 46.2% | 실패 | 100 | 실패 | 일치 | 554 | 280.8 | 있음 |
| MT-0063 | 실패 | 0.654 | 40.0% | 실패 | 100 | 통과 | 불일치 | 590 | 244.9 | 없음 |
| MT-0066 | 실패 | 0.581 | 40.0% | 실패 | 85 | 실패 | 불일치 | 684 | 282.8 | 없음 |
| MT-0071 | 실패 | 0.710 | 0.0% | 실패 | 85 | 실패 | 불일치 | 357 | 282.3 | 있음 |
| MT-0071-R2 | 실패 | 0.710 | 0.0% | 실패 | 85 | 실패 | 불일치 | 171 | 296.5 | 있음 |
| MT-0071-R3 | 실패 | 0.713 | 0.0% | 실패 | 85 | 통과 | 불일치 | 297 | 213.6 | 있음 |
| MT-0075 | 실패 | 0.688 | 0.0% | 실패 | 85 | 실패 | 불일치 | 351 | 280.3 | 있음 |
| MT-0079 | 실패 | 0.639 | 0.0% | 통과 | 85 | 실패 | 불일치 | 382 | 217.5 | 있음 |
| MT-0080 | 실패 | 0.553 | 33.3% | 실패 | 85 | 통과 | 불일치 | 533 | 239.8 | 있음 |
| MT-0082 | 실패 | 0.726 | 33.3% | 실패 | 85 | 실패 | 불일치 | 663 | 246.3 | 있음 |
| MT-0085 | 실패 | 0.712 | 33.3% | 실패 | 85 | 실패 | 불일치 | 530 | 227.8 | 있음 |
| MT-0089 | 실패 | 0.588 | 12.5% | 실패 | 85 | 실패 | 불일치 | 488 | 210.5 | 있음 |
| MT-0089-R2 | 실패 | 0.527 | 12.5% | 실패 | 100 | 실패 | 불일치 | 398 | 229.4 | 있음 |
| MT-0089-R3 | 실패 | 0.530 | 12.5% | 실패 | 85 | 통과 | 불일치 | 432 | 184.7 | 있음 |
| MT-0093 | 실패 | 0.578 | 12.5% | 실패 | 85 | 실패 | 불일치 | 756 | 252.5 | 있음 |
| MT-0096 | 실패 | 0.652 | 25.0% | 실패 | 85 | 통과 | 불일치 | 552 | 229.6 | 있음 |
| MT-0096-R2 | 실패 | 0.421 | 0.0% | 실패 | 85 | 통과 | 불일치 | 366 | 237.1 | 있음 |
| MT-0096-R3 | 실패 | 0.394 | 0.0% | 통과 | 85 | 실패 | 불일치 | 239 | 212.9 | 있음 |
| MT-0105 | 실패 | 0.637 | 25.0% | 실패 | 100 | 실패 | 불일치 | 574 | 272.9 | 있음 |
| MT-0109 | 실패 | 0.765 | 10.0% | 실패 | 100 | 실패 | 불일치 | 557 | 234.6 | 있음 |
| MT-0109-R2 | 실패 | 0.844 | 20.0% | 실패 | 85 | 실패 | 불일치 | 281 | 232.8 | 있음 |
| MT-0109-R3 | 실패 | 0.922 | 20.0% | 실패 | 85 | 통과 | 불일치 | 352 | 226.9 | 있음 |
| MT-0111 | 실패 | 0.823 | 20.0% | 실패 | 85 | 실패 | 불일치 | 432 | 277.2 | 있음 |


### 9. `gemma3:4b`

[원본 응답](../raw/test2/local-win_gemma3-4b_20260917/generation.jsonl) · [원본 통합 CSV](../scored/test2/local-win_gemma3-4b_20260917/review.csv)

<details>
<summary>질문 · 정답 · LLM 답변 · AI 검토 의견 (반복 회차 포함)</summary>

#### MT-0005 (회차 1)

**Q.**

> 그건 한 달에 얼마예요?


**정답 예시**

> 여울은 월 35000원입니다.


**LLM 답변**

> 가상 여울 요금제는 월 35,000원입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["SYN-P05"]


**AI 검토 의견**

> 대화의 지칭 대상을 이어받아 35000원을 정확히 답했다.


**자동 진단 (AI 확정 판정과 구분)**

> 자동 재판단 사유: 필수 사실 커버리지가 낮음(0%) — 누락 의심


#### MT-0009 (회차 1)

**Q.**

> 그건 한 달에 얼마예요?


**정답 예시**

> 나래은 월 51000원입니다.


**LLM 답변**

> 가상 나래 요금제는 월 51000원입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["SYN-P09"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


#### MT-0012 (회차 1)

**Q.**

> 거기 데이터는 얼마나 들어 있어요?


**정답 예시**

> 푸른의 국내 기본 데이터는 10GB입니다.


**LLM 답변**

> 가상 푸른 요금제는 월 10GB의 데이터를 제공합니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["SYN-P02"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 자동 재판단 사유: 필수 사실 커버리지가 낮음(0%) — 누락 의심


#### MT-0016 (회차 1)

**Q.**

> 거기 데이터는 얼마나 들어 있어요?


**정답 예시**

> 하람의 국내 기본 데이터는 30GB입니다.


**LLM 답변**

> 가상 하람 요금제는 월 30GB의 국내 데이터를 제공합니다. 이 테스트에서는 초과량을 1GB 단위로 계산하며, 1GB당 150원이 추가로 청구됩니다. 테더링 한도는 월 12GB입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["SYN-P06"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.764) / 필수 사실 커버리지가 낮음(20%) — 누락 의심


#### MT-0019 (회차 1)

**Q.**

> 거기 데이터는 얼마나 들어 있어요?


**정답 예시**

> 나래의 국내 기본 데이터는 45GB입니다.


**LLM 답변**

> 가상 나래 요금제는 월 45GB의 국내 데이터를 제공합니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["SYN-P09"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 자동 재판단 사유: 필수 사실 커버리지가 낮음(20%) — 누락 의심


#### MT-0022 (회차 1)

**Q.**

> 그걸 다 쓰면요?


**정답 예시**

> 기본량 소진 후 데이터가 차단되며 자동 추가 요금은 없습니다.


**LLM 답변**

> 기본 10GB를 초과하여 데이터 사용량이 발생하면, 자동으로 데이터가 차단됩니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["SYN-P02"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.752) / 필수 사실 커버리지가 낮음(25%) — 누락 의심


#### MT-0025 (회차 1)

**Q.**

> 그걸 다 쓰면요?


**정답 예시**

> 기본량 소진 후 데이터가 차단되며 자동 추가 요금은 없습니다.


**LLM 답변**

> 기본 국내 데이터 25GB를 모두 사용하면, 추가 데이터는 없습니다. 자동 추가 요금도 없습니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "PARTIAL" / evidence_ids ["SYN-P05"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.774) / 필수 사실 커버리지가 낮음(38%) — 누락 의심


#### MT-0037 (회차 1)

**Q.**

> 그 요금제 월 요금 알려주세요.


**정답 예시**

> 정정된 가온은 월 47000원입니다.


**LLM 답변**

> 가상 가온 요금제의 월 요금은 47000원입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["SYN-P08"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 자동 재판단 사유: NLI 1등/2등 확률차가 작음 (margin=0.108) / 필수 사실 커버리지가 낮음(33%) — 누락 의심


#### MT-0037-R2 (회차 2)

**Q.**

> 그 요금제 월 요금 알려주세요.


**정답 예시**

> 정정된 가온은 월 47000원입니다.


**LLM 답변**

> 가상 온빛 요금제는 월 43000원, 가상 가온 요금제는 월 47000원입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["FAQ-036", "SYN-P07", "SYN-P08"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.780) / 필수 사실 커버리지가 낮음(33%) — 누락 의심


#### MT-0037-R3 (회차 3)

**Q.**

> 그 요금제 월 요금 알려주세요.


**정답 예시**

> 정정된 가온은 월 47000원입니다.


**LLM 답변**

> 가상 온빛 요금제는 월 43000원, 가온 요금제는 월 47000원입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["SYN-P07", "SYN-P08"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.788) / 필수 사실 커버리지가 낮음(33%) — 누락 의심


#### MT-0044 (회차 1)

**Q.**

> 그럼 기본량이 얼마나 남은 거죠?


**정답 예시**

> 국내 기본 데이터 1GB가 남았습니다.


**LLM 답변**

> 현재 19GB를 사용하셨고, 다온 요금제는 국내 데이터 20GB를 제공합니다. 따라서 1GB가 남았습니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["SYN-P04"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)
> 미검증 숫자: ['19']
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.752)


#### MT-0046 (회차 1)

**Q.**

> 그럼 기본량이 얼마나 남은 거죠?


**정답 예시**

> 국내 기본 데이터 1GB가 남았습니다.


**LLM 답변**

> 하람 요금제 월 요금은 39,000원이고, 국내 데이터 30GB가 기본 제공됩니다. 29GB를 사용하셨으므로, 남은 데이터는 1GB입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["SYN-P06"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)
> 미검증 숫자: ['29']


#### MT-0052 (회차 1)

**Q.**

> 그럼 그 데이터 혜택 그대로 쓰나요?


**정답 예시**

> 국내 데이터 혜택은 해외 로밍에 적용되지 않습니다. 구체 로밍 요금은 확인할 근거가 없습니다.


**LLM 답변**

> 네, 푸른 요금제는 월 23000원, 국내 데이터 10GB 혜택을 그대로 제공합니다.


**상태 / 근거 ID**

> 기대 PARTIAL / 출력 "ANSWER" / evidence_ids ["SYN-P02"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(15%) — 누락 의심


#### MT-0054 (회차 1)

**Q.**

> 그럼 그 데이터 혜택 그대로 쓰나요?


**정답 예시**

> 국내 데이터 혜택은 해외 로밍에 적용되지 않습니다. 구체 로밍 요금은 확인할 근거가 없습니다.


**LLM 답변**

> 네, 가상 다온 요금제의 데이터 혜택이 그대로 적용됩니다. 월 20GB의 국내 데이터를 사용할 수 있습니다.


**상태 / 근거 ID**

> 기대 PARTIAL / 출력 "PARTIAL" / evidence_ids ["FAQ-029"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)
> 출처 오매칭 숫자: ['20']
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(15%) — 누락 의심 / 답변의 숫자가 인용한 근거가 아닌 다른 FAQ/정책에서 온 것으로 보임 — 출처 오매칭 의심


#### MT-0060 (회차 1)

**Q.**

> 그럼 그 데이터 혜택 그대로 쓰나요?


**정답 예시**

> 국내 데이터 혜택은 해외 로밍에 적용되지 않습니다. 구체 로밍 요금은 확인할 근거가 없습니다.


**LLM 답변**

> 네, 이음 요금제의 국내 데이터 50GB 혜택을 그대로 사용하실 수 있습니다. 다만, 해외 로밍에는 적용되지 않는다는 점을 참고해주세요.


**상태 / 근거 ID**

> 기대 PARTIAL / 출력 "ANSWER" / evidence_ids ["FAQ-083"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 출처 오매칭 숫자: ['50']
> 자동 재판단 사유: 답변의 숫자가 인용한 근거가 아닌 다른 FAQ/정책에서 온 것으로 보임 — 출처 오매칭 의심


#### MT-0063 (회차 1)

**Q.**

> 그쪽 한도는 얼마나 남았어요?


**정답 예시**

> 테더링 한도는 5GB 남았습니다. 국내 기본 데이터 잔여량도 확인해야 합니다.


**LLM 답변**

> 가상 누리 요금제는 월 27000원, 국내 데이터 15GB입니다. 테더링 한도는 월 6GB이며, 테더링으로 1GB를 사용하셨으므로 남은 데이터는 15GB - 1GB = 14GB입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["SYN-P03"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 미검증 숫자: ['14']
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.716)


#### MT-0066 (회차 1)

**Q.**

> 그쪽 한도는 얼마나 남았어요?


**정답 예시**

> 테더링 한도는 11GB 남았습니다. 국내 기본 데이터 잔여량도 확인해야 합니다.


**LLM 답변**

> 월 12GB의 테더링 한도를 사용하셨고, 현재 남은 데이터는 0GB입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["SYN-P06"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)
> 미검증 숫자: ['0']
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.778) / 필수 사실 커버리지가 낮음(20%) — 누락 의심


#### MT-0071 (회차 1)

**Q.**

> 그럼 남은 기본 데이터는요?


**정답 예시**

> 정정된 사용량 기준으로 2GB 남았습니다.


**LLM 답변**

> 국내 데이터 5GB 중 3GB를 사용하셨으므로, 남은 기본 데이터는 2GB입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["SYN-P01"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 미검증 숫자: ['3']
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.776) / 필수 사실 커버리지가 낮음(20%) — 누락 의심


#### MT-0071-R2 (회차 2)

**Q.**

> 그럼 남은 기본 데이터는요?


**정답 예시**

> 정정된 사용량 기준으로 2GB 남았습니다.


**LLM 답변**

> 새봄 요금제 3GB 데이터 사용량으로 계산했을 때, 남은 데이터는 2GB입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["SYN-P01"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 미검증 숫자: ['3']
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.741)


#### MT-0071-R3 (회차 3)

**Q.**

> 그럼 남은 기본 데이터는요?


**정답 예시**

> 정정된 사용량 기준으로 2GB 남았습니다.


**LLM 답변**

> 새봄 요금제의 기본 데이터 5GB 중 3GB를 사용하셨으므로, 남은 데이터는 2GB입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["SYN-P01"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 미검증 숫자: ['3']
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.721) / 필수 사실 커버리지가 낮음(20%) — 누락 의심


#### MT-0075 (회차 1)

**Q.**

> 그럼 남은 기본 데이터는요?


**정답 예시**

> 정정된 사용량 기준으로 2GB 남았습니다.


**LLM 답변**

> 여울 요금제 23GB 사용량 기준으로, 남은 기본 데이터는 1GB입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["SYN-P05"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 미검증 숫자: ['23', '1']


#### MT-0079 (회차 1)

**Q.**

> 그 요금제 기본 데이터는 얼마였죠?


**정답 예시**

> 처음 질문한 다온의 기본 데이터는 20GB입니다.


**LLM 답변**

> 다온 요금제의 기본 데이터는 20GB입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["FAQ-066"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)
> 출처 오매칭 숫자: ['20']
> 자동 재판단 사유: 답변의 숫자가 인용한 근거가 아닌 다른 FAQ/정책에서 온 것으로 보임 — 출처 오매칭 의심


#### MT-0080 (회차 1)

**Q.**

> 그 요금제 기본 데이터는 얼마였죠?


**정답 예시**

> 처음 질문한 여울의 기본 데이터는 25GB입니다.


**LLM 답변**

> 가상 여울 요금제의 기본 데이터는 25GB입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["SYN-P05"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)


#### MT-0082 (회차 1)

**Q.**

> 그 요금제 기본 데이터는 얼마였죠?


**정답 예시**

> 처음 질문한 온빛의 기본 데이터는 35GB입니다.


**LLM 답변**

> 온빛 요금제의 기본 데이터는 35GB이고, 가온 요금제의 기본 데이터는 40GB입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["SYN-P07", "SYN-P08"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 자동 재판단 사유: 필수 사실 커버리지가 낮음(33%) — 누락 의심


#### MT-0085 (회차 1)

**Q.**

> 그 요금제 기본 데이터는 얼마였죠?


**정답 예시**

> 처음 질문한 이음의 기본 데이터는 50GB입니다.


**LLM 답변**

> 이음 요금제의 기본 데이터는 50GB입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["SYN-P10"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)


#### MT-0089 (회차 1)

**Q.**

> 그건 다 쓰면 돈이 나가요?


**정답 예시**

> 어느 요금제를 가리키는지 모호하므로 두 요금제 중 대상을 확인해야 합니다.


**LLM 답변**

> 네, 다온 요금제와 여울 요금제 모두 기본 데이터 20GB 또는 25GB를 사용하면 추가 요금이 발생합니다.


**상태 / 근거 ID**

> 기대 CLARIFY / 출력 "ANSWER" / evidence_ids ["SYN-P04", "SYN-P05"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 자동 재판단 사유: 필수 사실 커버리지가 낮음(25%) — 누락 의심


#### MT-0089-R2 (회차 2)

**Q.**

> 그건 다 쓰면 돈이 나가요?


**정답 예시**

> 어느 요금제를 가리키는지 모호하므로 두 요금제 중 대상을 확인해야 합니다.


**LLM 답변**

> 네, 다온과 여울 요금제 모두 기본 데이터를 소진하면 추가 요금이 발생합니다. 다온 요제는 20GB 기본 데이터 후 1Mbps로, 여울 요제는 25GB 기본 데이터 후 차단됩니다.


**상태 / 근거 ID**

> 기대 CLARIFY / 출력 "ANSWER" / evidence_ids ["SYN-P04", "SYN-P05"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 자동 재판단 사유: 필수 사실 커버리지가 낮음(25%) — 누락 의심


#### MT-0089-R3 (회차 3)

**Q.**

> 그건 다 쓰면 돈이 나가요?


**정답 예시**

> 어느 요금제를 가리키는지 모호하므로 두 요금제 중 대상을 확인해야 합니다.


**LLM 답변**

> 네, 다온과 여울 요금제 모두 기본 데이터 20GB/25GB를 사용하면 추가 요금이 발생합니다. 다온 요제는 1Mbps, 여울 요제는 데이터 무제한으로 제공됩니다.


**상태 / 근거 ID**

> 기대 CLARIFY / 출력 "ANSWER" / evidence_ids ["FAQ-068", "SYN-P05", "SYN-P04"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 자동 재판단 사유: 필수 사실 커버리지가 낮음(25%) — 누락 의심


#### MT-0093 (회차 1)

**Q.**

> 그건 다 쓰면 돈이 나가요?


**정답 예시**

> 어느 요금제를 가리키는지 모호하므로 두 요금제 중 대상을 확인해야 합니다.


**LLM 답변**

> 가온 요금제의 경우 기본 데이터 40GB가 소진되면 자동 추가 요금은 없습니다. 나래 요금제의 경우 기본 데이터 45GB를 초과하는 경우 1GB당 180원이 추가 청구됩니다.


**상태 / 근거 ID**

> 기대 CLARIFY / 출력 "ANSWER" / evidence_ids ["SYN-P08", "SYN-P09"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 자동 재판단 사유: 필수 사실 커버리지가 낮음(13%) — 누락 의심


#### MT-0096 (회차 1)

**Q.**

> 그럼 제 회선은 지금 얼마나 남았어요?


**정답 예시**

> 이전 사용량은 다른 회선 정보이므로 재사용할 수 없습니다. 현재 회선 사용량을 확인해야 합니다.


**LLM 답변**

> 현재 사용량 정보를 확인하기 위해 API를 실행해야 합니다. API를 직접 실행할 수 없으므로 현재 사용량을 확인해 드릴 수 없습니다.


**상태 / 근거 ID**

> 기대 CLARIFY / 출력 "ABSTAIN" / evidence_ids []


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.737) / 필수 사실 커버리지가 낮음(33%) — 누락 의심


#### MT-0096-R2 (회차 2)

**Q.**

> 그럼 제 회선은 지금 얼마나 남았어요?


**정답 예시**

> 이전 사용량은 다른 회선 정보이므로 재사용할 수 없습니다. 현재 회선 사용량을 확인해야 합니다.


**LLM 답변**

> 제 회선 사용량을 확인하려면 앱이나 홈페이지에서 확인하실 수 있습니다.


**상태 / 근거 ID**

> 기대 CLARIFY / 출력 "ABSTAIN" / evidence_ids ["FAQ-037"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.744) / 필수 사실 커버리지가 낮음(25%) — 누락 의심


#### MT-0096-R3 (회차 3)

**Q.**

> 그럼 제 회선은 지금 얼마나 남았어요?


**정답 예시**

> 이전 사용량은 다른 회선 정보이므로 재사용할 수 없습니다. 현재 회선 사용량을 확인해야 합니다.


**LLM 답변**

> 현재 사용하신 회선의 데이터 사용량은 API를 통해 확인할 수 없습니다. 앱이나 홈페이지에서 확인하실 수 있습니다.


**상태 / 근거 ID**

> 기대 CLARIFY / 출력 "ABSTAIN" / evidence_ids ["FAQ-037"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.779)


#### MT-0105 (회차 1)

**Q.**

> 그럼 제 회선은 지금 얼마나 남았어요?


**정답 예시**

> 이전 사용량은 다른 회선 정보이므로 재사용할 수 없습니다. 현재 회선 사용량을 확인해야 합니다.


**LLM 답변**

> 현재 사용량은 50GB 중 49GB를 사용하셨습니다. 1GB가 남았습니다.


**상태 / 근거 ID**

> 기대 CLARIFY / 출력 "ANSWER" / evidence_ids ["SYN-P10"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)
> 미검증 숫자: ['49']
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(17%) — 누락 의심


#### MT-0109 (회차 1)

**Q.**

> 현재 쓰는 요금제의 월 요금은요?


**정답 예시**

> 변경 전 현재 요금제는 다온이며 월 31000원입니다. 변경 의향을 완료로 처리하지 않습니다.


**LLM 답변**

> 현재 요금제의 월 요금은 31000원입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["SYN-P04"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(20%) — 누락 의심


#### MT-0109-R2 (회차 2)

**Q.**

> 현재 쓰는 요금제의 월 요금은요?


**정답 예시**

> 변경 전 현재 요금제는 다온이며 월 31000원입니다. 변경 의향을 완료로 처리하지 않습니다.


**LLM 답변**

> 현재 사용하시는 요금제의 월 요금은 가상 다온 요금제 31000원, 국내 데이터 20GB입니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["FAQ-050", "SYN-P04"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: 필수 사실 커버리지가 낮음(10%) — 누락 의심


#### MT-0109-R3 (회차 3)

**Q.**

> 현재 쓰는 요금제의 월 요금은요?


**정답 예시**

> 변경 전 현재 요금제는 다온이며 월 31000원입니다. 변경 의향을 완료로 처리하지 않습니다.


**LLM 답변**

> 현재 요금제의 월 요금은 다온 요금제의 경우 월 31000원, 여울 요금제의 경우 월 35000원입니다. 요금 정보를 확인하시려면 앱이나 홈페이지의 가입 정보에서 확인하실 수 있습니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["FAQ-050", "SYN-P04", "SYN-P05"]


**AI 검토 의견**

> 개별 AI 검토 미실시. 자동 지표와 원문을 함께 확인.


**자동 진단 (AI 확정 판정과 구분)**

> 자동 재판단 사유: 필수 사실 커버리지가 낮음(10%) — 누락 의심


#### MT-0111 (회차 1)

**Q.**

> 현재 쓰는 요금제의 월 요금은요?


**정답 예시**

> 변경 전 현재 요금제는 하람이며 월 39000원입니다. 변경 의향을 완료로 처리하지 않습니다.


**LLM 답변**

> 현재 쓰는 요금제를 알려주시면 월 요금에 대한 정보를 확인해 드리겠습니다.


**상태 / 근거 ID**

> 기대 ANSWER / 출력 "ANSWER" / evidence_ids ["FAQ-037"]


**AI 검토 의견**

> 대화 이력의 현재 요금제를 활용하지 못하고 되물었다.


**자동 진단 (AI 확정 판정과 구분)**

> 표현 감점: lengthBand(-15)
> 자동 재판단 사유: BGE-M3 유사도가 임계값 근처 (0.712) / 필수 사실 커버리지가 낮음(10%) — 누락 의심


</details>

**채점 결과**

| ID | 답변 정확도(자동) | 의미 유사도 | 키워드 포함률 | RAG 충실도 | 표현 점수/100 | 포맷 | 기대 상태 일치 | 응답 ms | TPS(토큰/s) | 재판단 필요 여부 |
|---|---|---|---|---|---|---|---|---|---|---|
| MT-0005 | 실패 | 0.886 | 0.0% | 실패 | 100 | 통과 | 일치 | 1576 | 127.4 | 있음 |
| MT-0009 | 실패 | 0.828 | 50.0% | 통과 | 100 | 통과 | 일치 | 1273 | 120.6 | 없음 |
| MT-0012 | 실패 | 0.806 | 0.0% | 실패 | 100 | 통과 | 일치 | 1127 | 127.3 | 있음 |
| MT-0016 | 실패 | 0.764 | 20.0% | 실패 | 85 | 통과 | 일치 | 1517 | 121.9 | 있음 |
| MT-0019 | 실패 | 0.806 | 20.0% | 실패 | 100 | 통과 | 일치 | 1180 | 127.3 | 있음 |
| MT-0022 | 실패 | 0.752 | 25.0% | 실패 | 100 | 통과 | 일치 | 1124 | 125.6 | 있음 |
| MT-0025 | 실패 | 0.774 | 37.5% | 실패 | 100 | 통과 | 불일치 | 1121 | 124.9 | 있음 |
| MT-0037 | 실패 | 0.855 | 33.3% | 실패 | 100 | 통과 | 일치 | 1085 | 127.3 | 있음 |
| MT-0037-R2 | 실패 | 0.780 | 33.3% | 실패 | 100 | 통과 | 일치 | 1414 | 125.2 | 있음 |
| MT-0037-R3 | 실패 | 0.788 | 33.3% | 실패 | 100 | 통과 | 일치 | 1265 | 126.5 | 있음 |
| MT-0044 | 통과 | 0.752 | 80.0% | 실패 | 85 | 통과 | 일치 | 1550 | 126.6 | 있음 |
| MT-0046 | 실패 | 0.674 | 60.0% | 실패 | 85 | 통과 | 일치 | 3361 | 114.4 | 없음 |
| MT-0052 | 실패 | 0.570 | 15.4% | 실패 | 85 | 통과 | 불일치 | 1593 | 127.4 | 있음 |
| MT-0054 | 실패 | 0.623 | 15.4% | 실패 | 85 | 통과 | 일치 | 1234 | 127.0 | 있음 |
| MT-0060 | 실패 | 0.693 | 46.2% | 실패 | 100 | 통과 | 불일치 | 1262 | 126.9 | 있음 |
| MT-0063 | 실패 | 0.716 | 50.0% | 실패 | 100 | 통과 | 일치 | 1876 | 121.7 | 있음 |
| MT-0066 | 실패 | 0.778 | 20.0% | 실패 | 85 | 통과 | 일치 | 2075 | 116.2 | 있음 |
| MT-0071 | 실패 | 0.776 | 20.0% | 실패 | 100 | 통과 | 일치 | 1509 | 117.1 | 있음 |
| MT-0071-R2 | 실패 | 0.741 | 40.0% | 실패 | 100 | 통과 | 일치 | 1136 | 123.7 | 있음 |
| MT-0071-R3 | 실패 | 0.721 | 20.0% | 실패 | 100 | 통과 | 일치 | 1231 | 115.7 | 있음 |
| MT-0075 | 실패 | 0.678 | 40.0% | 실패 | 100 | 통과 | 일치 | 1532 | 118.3 | 없음 |
| MT-0079 | 실패 | 0.894 | 50.0% | 실패 | 85 | 통과 | 일치 | 1863 | 115.5 | 있음 |
| MT-0080 | 실패 | 0.875 | 50.0% | 실패 | 85 | 통과 | 일치 | 1899 | 110.7 | 없음 |
| MT-0082 | 실패 | 0.843 | 33.3% | 실패 | 100 | 통과 | 일치 | 1975 | 125.9 | 있음 |
| MT-0085 | 실패 | 0.898 | 50.0% | 실패 | 85 | 통과 | 일치 | 1829 | 118.8 | 없음 |
| MT-0089 | 실패 | 0.564 | 25.0% | 실패 | 100 | 통과 | 불일치 | 2004 | 123.7 | 있음 |
| MT-0089-R2 | 실패 | 0.592 | 25.0% | 실패 | 100 | 통과 | 불일치 | 1485 | 124.3 | 있음 |
| MT-0089-R3 | 실패 | 0.571 | 25.0% | 실패 | 100 | 통과 | 불일치 | 1483 | 124.3 | 있음 |
| MT-0093 | 실패 | 0.537 | 12.5% | 실패 | 100 | 통과 | 불일치 | 1798 | 125.4 | 있음 |
| MT-0096 | 실패 | 0.737 | 33.3% | N/A(스킵) | 100 | 통과 | 불일치 | 1884 | 124.4 | 있음 |
| MT-0096-R2 | 실패 | 0.744 | 25.0% | N/A(스킵) | 85 | 통과 | 불일치 | 1158 | 125.8 | 있음 |
| MT-0096-R3 | 실패 | 0.779 | 41.7% | N/A(스킵) | 100 | 통과 | 불일치 | 1231 | 121.4 | 있음 |
| MT-0105 | 실패 | 0.635 | 16.7% | 실패 | 85 | 통과 | 불일치 | 1922 | 116.6 | 있음 |
| MT-0109 | 실패 | 0.825 | 20.0% | 실패 | 85 | 통과 | 일치 | 1393 | 126.4 | 있음 |
| MT-0109-R2 | 실패 | 0.834 | 10.0% | 실패 | 85 | 통과 | 일치 | 1435 | 121.6 | 있음 |
| MT-0109-R3 | 실패 | 0.888 | 10.0% | 실패 | 100 | 통과 | 일치 | 1616 | 125.9 | 있음 |
| MT-0111 | 실패 | 0.712 | 10.0% | 실패 | 85 | 통과 | 일치 | 1852 | 126.6 | 있음 |
