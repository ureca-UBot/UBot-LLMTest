// 실험 4: 백엔드 E 조건 재현 — v4_base 시스템 프롬프트(출력 순서 evidence_ids → status → answer 지시 포함)
const { SYSTEM_PROMPTS } = require('../scripts/lib/prompts');
const URL_ = (process.env.OLLAMA_URL || 'http://localhost:11434') + '/api/chat';
const sys = SYSTEM_PROMPTS.v4_base;
const QS = ['요금제를 한 달에 몇 번 바꿀 수 있나요?', '선택약정 기간은 몇 개월로 할 수 있어요?', '가족끼리 결합하면 회선당 얼마나 할인돼요?'];
const CTX = '[FAQ-130] 요금제는 한 달에 몇 번까지 바꿀 수 있나요?\n요금제 변경은 한 달에 1회 가능합니다.\n\n[FAQ-525] 선택약정 할인은 어디에서 신청하나요?\n12개월 또는 24개월 중에 고르면 월 요금의 25%가 할인됩니다.\n\n[FAQ-862] 가족 결합을 하면 얼마나 할인되나요?\n휴대폰 2회선은 회선당 월 3,300원 할인됩니다.';
const schema = { type: 'object', properties: {
  evidence_ids: { type: 'array', items: { type: 'string' } },
  status: { type: 'string', enum: ['ANSWER', 'PARTIAL', 'ABSTAIN', 'CONFLICT', 'OUT_OF_SCOPE'] },
  answer: { type: 'string' } }, required: ['evidence_ids', 'status', 'answer'], additionalProperties: false };
(async () => {
  const model = process.argv[2];
  for (const [name, format, temp] of [['스키마(evidence 먼저)', schema, 0], ['format "json"', 'json', 0], ['format 없음 · t0.7', undefined, 0.7]]) {
    for (const q of QS) {
      const body = { model, stream: false, options: { temperature: temp }, messages: [{ role: 'system', content: sys },
        { role: 'user', content: `[참고 자료]\n${CTX}\n\n[사용자 정보 / API 결과]\n(없음)\n\n[사용자 질문]\n${q}` }] };
      if (format !== undefined) body.format = format;
      const j = await (await fetch(URL_, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })).json();
      const txt = j.message?.content ?? JSON.stringify(j);
      console.log(`${name} | ${[...txt.matchAll(/"(answer|evidence_ids|status)"\s*:/g)].map((m) => m[1]).join(' → ')}`);
    }
  }
})();
