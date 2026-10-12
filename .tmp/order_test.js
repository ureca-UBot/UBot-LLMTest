// 스키마 키 순서 실험: 같은 질문에 properties 순서·이름만 바꿔 출력 키 순서를 본다.
const MSG = [
  { role: 'system', content: '통신 상담 도우미입니다. JSON으로 답합니다.' },
  { role: 'user', content: '[참고 자료]\n[FAQ-130] 요금제는 한 달에 몇 번까지 바꿀 수 있나요?\n요금제 변경은 한 달에 1회 가능합니다.\n\n[사용자 질문]\n요금제를 한 달에 몇 번 바꿀 수 있나요?' },
];
const str = { type: 'string' };
const arr = { type: 'array', items: { type: 'string' } };
const st = { type: 'string', enum: ['ANSWER', 'ABSTAIN'] };
const schema = (pairs) => ({ type: 'object', properties: Object.fromEntries(pairs), required: pairs.map((p) => p[0]) });
const CASES = {
  'A 엔진 그대로(evidence_ids,status,answer)': schema([['evidence_ids', arr], ['status', st], ['answer', str]]),
  'B 역순(status,answer,evidence_ids)': schema([['status', st], ['answer', str], ['evidence_ids', arr]]),
  'C 알파벳=원하는 순서(a_evidence,b_status,c_answer)': schema([['a_evidence', arr], ['b_status', st], ['c_answer', str]]),
  'D 알파벳 반대로 준 순서(c_answer,b_status,a_evidence)': schema([['c_answer', str], ['b_status', st], ['a_evidence', arr]]),
};
(async () => {
  const models = process.argv.slice(2);
  for (const model of models) {
    for (const [name, format] of Object.entries(CASES)) {
      const r = await fetch((process.env.OLLAMA_URL || 'http://localhost:11434') + '/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model, messages: MSG, format, stream: false, options: { temperature: 0 } }) });
      const j = await r.json();
      const txt = j.message?.content ?? JSON.stringify(j);
      const keys = [...txt.matchAll(/"([a-z_]+)"\s*:/g)].map((m) => m[1]).join(' → ');
      console.log(`${model} | ${name} | 출력 키: ${keys}`);
    }
  }
})();
