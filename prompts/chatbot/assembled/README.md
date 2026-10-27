# assembled — 백엔드 반영용 완성 시스템 프롬프트

테스트 엔진은 이 폴더를 읽지 않는다(`variants.json`이 가리키는 `../*.md`만 읽음). 백엔드(UBot-BE)에 그대로 옮길 수 있게
`scripts/lib/prompts.js`의 `systemPromptFor(<안>)` 결과(머리 주석 제거·파일 사이 빈 줄 하나)를 그대로 저장한 것이다.
원본 `.md`를 고치면 다시 뽑는다:

```powershell
node -e "require('fs').writeFileSync('prompts/chatbot/assembled/v5_i4b.txt', require('./scripts/lib/prompts.js').systemPromptFor('v5_i4b') + '\n')"
```

## v5_i4b (2026-10-15)

- 구성: `base_i4` · `status_rules_i4b` · `output_order_i4` = prompts_test_v7의 `v5_i4`에서 OUT_OF_SCOPE 정의의
  "answer에서 통신 상담 범위 밖이라고 알린다" 한 문장만 뺀 것(이유는 `status_rules_i4b.md` 머리 주석).
- **v5_i4b 자체는 생성·Judge하지 않았다.** 근거 수치는 v5_i4(pv7-try1, 정답 698/900)와, 같은 삭제를 포함한 v5_i5(prompts_test_v9, 결정론만)다.

## 테스트와 같은 조건으로 호출하려면

- 모델 `qwen3:4b-instruct`(Q4_K_M), Ollama `/api/chat`, `options.temperature: 0`, `think` 미지정, 비스트리밍.
- `format`(구조화 출력 스키마):
  `{"type":"object","properties":{"evidence_ids":{"type":"array","items":{"type":"string"}},"status":{"type":"string","enum":["ANSWER","PARTIAL","ABSTAIN","CONFLICT","OUT_OF_SCOPE"]},"answer":{"type":"string"}},"required":["evidence_ids","status","answer"]}`
  — 이 모델은 키를 알파벳순(answer → evidence_ids → status)으로 내보낸다. 테스트도 이 상태로 쟀다.
- messages:
  1. `system`: 이 파일 내용(페르소나 지시가 있으면 끝에 `\n\n[추가 페르소나 지시]\n<지시>`).
  2. 대화 이력(user/assistant 턴).
  3. 마지막 `user`:
     ```
     [참고 자료]
     <FAQ 원문들, 없으면 (제공된 자료 없음)>

     [사용자 정보 / API 결과]
     <조회 결과 "라벨 = 값" 문장, 없으면 (없음)>

     [사용자 질문]
     <질문>
     ```
- 사용자에게는 `answer`만 보여 준다. `evidence_ids`·`status`는 로그·분기용.
