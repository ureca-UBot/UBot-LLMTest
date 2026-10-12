// 실험 3: 같은 스키마(evidence_ids, status, answer)로 요청 본문의 다른 필드만 바꾼다
const URL_ = (process.env.OLLAMA_URL || 'http://localhost:11434') + '/api/chat';
const MSG = [
  { role: 'system', content: '통신 상담 도우미입니다. JSON으로 답합니다.' },
  { role: 'user', content: '[참고 자료]\n[FAQ-130] 요금제는 한 달에 몇 번까지 바꿀 수 있나요?\n요금제 변경은 한 달에 1회 가능합니다.\n\n[사용자 질문]\n요금제를 한 달에 몇 번 바꿀 수 있나요?' },
];
const format = { type: 'object', properties: {
  evidence_ids: { type: 'array', items: { type: 'string' } },
  status: { type: 'string', enum: ['ANSWER', 'PARTIAL', 'ABSTAIN', 'CONFLICT', 'OUT_OF_SCOPE'] },
  answer: { type: 'string' } }, required: ['evidence_ids', 'status', 'answer'], additionalProperties: false };
const CASES = {
  '1 think 없음': {},
  '2 think:false': { think: false },
  '3 think:true': { think: true },
  '4 options 없음': { options: undefined },
  '5 stream:true': { stream: true },
};
(async () => {
  const model = process.argv[2];
  for (const [name, extra] of Object.entries(CASES)) {
    const body = { model, messages: MSG, format, stream: false, options: { temperature: 0 }, ...extra };
    const r = await fetch(URL_, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    let txt = '';
    if (body.stream) { for (const line of (await r.text()).split('\n')) if (line.trim()) txt += JSON.parse(line).message?.content || ''; }
    else { const j = await r.json(); txt = j.message?.content ?? JSON.stringify(j); }
    console.log(`${name} | ${[...txt.matchAll(/"([a-z_]+)"\s*:/g)].map((m) => m[1]).join(' → ') || txt.slice(0, 120)}`);
  }
})();
