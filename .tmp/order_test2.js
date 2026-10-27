// 스키마 키 순서 실험 2: additionalProperties 유무 등 스키마 세부 차이
const URL_ = (process.env.OLLAMA_URL || 'http://localhost:11434') + '/api/chat';
const MSG = [
  { role: 'system', content: '통신 상담 도우미입니다. JSON으로 답합니다.' },
  { role: 'user', content: '[참고 자료]\n[FAQ-130] 요금제는 한 달에 몇 번까지 바꿀 수 있나요?\n요금제 변경은 한 달에 1회 가능합니다.\n\n[사용자 질문]\n요금제를 한 달에 몇 번 바꿀 수 있나요?' },
];
const P = {
  evidence_ids: { type: 'array', items: { type: 'string' } },
  status: { type: 'string', enum: ['ANSWER', 'PARTIAL', 'ABSTAIN', 'CONFLICT', 'OUT_OF_SCOPE'] },
  answer: { type: 'string' },
};
const order = ['evidence_ids', 'status', 'answer'];
const props = Object.fromEntries(order.map((k) => [k, P[k]]));
const CASES = {
  '1 기본(required, additionalProperties 없음)': { type: 'object', properties: props, required: order },
  '2 additionalProperties:false 추가': { type: 'object', properties: props, required: order, additionalProperties: false },
  '3 required 없음': { type: 'object', properties: props },
  '4 required 없음 + additionalProperties:false': { type: 'object', properties: props, additionalProperties: false },
  '5 required 일부(answer만)': { type: 'object', properties: props, required: ['answer'] },
};
(async () => {
  for (const model of process.argv.slice(2)) for (const [name, format] of Object.entries(CASES)) {
    const j = await (await fetch(URL_, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model, messages: MSG, format, stream: false, options: { temperature: 0 } }) })).json();
    const txt = j.message?.content ?? JSON.stringify(j);
    console.log(`${model} | ${name} | ${[...txt.matchAll(/"([a-z_]+)"\s*:/g)].map((m) => m[1]).join(' → ')}`);
  }
})();
