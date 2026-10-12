// 실험 5: format을 객체로 보낼 때와 JSON 문자열로 보낼 때
const URL_ = (process.env.OLLAMA_URL || 'http://localhost:11434') + '/api/chat';
const MSG = [
  { role: 'system', content: '통신 상담 도우미입니다. JSON 키를 evidence_ids, status, answer 순서로 씁니다.' },
  { role: 'user', content: '[참고 자료]\n[FAQ-130] 요금제는 한 달에 몇 번까지 바꿀 수 있나요?\n요금제 변경은 한 달에 1회 가능합니다.\n\n[사용자 질문]\n요금제를 한 달에 몇 번 바꿀 수 있나요?' },
];
const schema = { type: 'object', properties: {
  evidence_ids: { type: 'array', items: { type: 'string' } },
  status: { type: 'string', enum: ['ANSWER', 'ABSTAIN'] },
  answer: { type: 'string' } }, required: ['evidence_ids', 'status', 'answer'], additionalProperties: false };
(async () => {
  for (const [name, format] of [['객체', schema], ['JSON 문자열', JSON.stringify(schema)]]) {
    const r = await fetch(URL_, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: process.argv[2], messages: MSG, format, stream: false, options: { temperature: 0 } }) });
    const t = await r.text(); let txt; try { txt = JSON.parse(t).message?.content ?? t; } catch { txt = t; }
    console.log(`${name} | HTTP ${r.status} | ${[...txt.matchAll(/"([a-z_]+)"\s*:/g)].map((m) => m[1]).join(' → ') || txt.slice(0, 150)}`);
  }
})();
