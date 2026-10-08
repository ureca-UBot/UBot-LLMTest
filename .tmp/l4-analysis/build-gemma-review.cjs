const fs = require('node:fs');
const input = '.tmp/l4-analysis/l4_gemma3_4b_awq_20261006_01/vllm_s32/u32_requests.jsonl';
const output = 'servingtest/l4/reports/GEMMA3_4B_AWQ_REQUEST_REVIEW_20261006.md';
const rows = fs.readFileSync(input, 'utf8').trim().split('\n').map(JSON.parse);
const groups = new Map();
for (const row of rows) {
  const id = row.caseId;
  if (!groups.has(id)) groups.set(id, []);
  groups.get(id).push(row);
}
const fence = text => {
  const runs = String(text).match(/`+/g) || [];
  const delimiter = '`'.repeat(Math.max(3, ...runs.map(x => x.length + 1)));
  return `${delimiter}text\n${text}\n${delimiter}`;
};
const lines = [
  '# L4 Gemma3-4B 커뮤니티 AWQ — 질문·FAQ·실제 답변', '',
  '- 측정일: 2026-10-06',
  '- 모델: gaunernst/gemma-3-4b-it-int4-awq (Google QAT INT4의 커뮤니티 AWQ 형식 변환본)',
  '- 조건: vLLM 내부 상한 32, 외부 동시 요청 U32, temperature 0, 출력 상한 512토큰',
  `- 원시 응답 ${rows.length}건, 고유 문항 ${groups.size}개. 문항별 첫 응답을 대표로 표시하고, 출력 또는 입력이 다른 반복 응답은 추가로 표시합니다.`,
  '- 정답·기대 상태·정확도 판정은 포함하지 않습니다. 형식 통과는 의미 정답을 뜻하지 않습니다.',
  '- 원본: servingtest/multimodel_results_20261006/raw_l4/raw_results.tgz 안의 ./l4_gemma3_4b_awq_20261006_01/vllm_s32/u32_requests.jsonl',
  '- FAQ·사용자 질문·API 정보·대화 이력은 실제 요청에서 가져왔으며, 답변은 모델 출력을 그대로 보존했습니다.', '',
];
for (const [id, group] of [...groups].sort(([a], [b]) => a.localeCompare(b, 'en', {numeric:true}))) {
  const variants = new Map();
  for (const row of group) {
    const key = JSON.stringify([row.request_body.messages, row.content]);
    if (!variants.has(key)) variants.set(key, {row, count:0});
    variants.get(key).count++;
  }
  lines.push(`## ${id}`, '', `반복 응답 ${group.length}건 · 서로 다른 입력/출력 ${variants.size}종`, '');
  let index = 0;
  for (const {row, count} of variants.values()) {
    if (variants.size > 1) lines.push(`### 응답 ${++index} (${count}회 관측)`, '');
    const messages = row.request_body.messages.filter(m => m.role !== 'system');
    const last = messages[messages.length - 1];
    const body = last.content;
    const q = body.lastIndexOf('[사용자 질문]\n');
    lines.push('### 제공된 질문', '', fence(q >= 0 ? body.slice(q + '[사용자 질문]\n'.length) : body), '');
    const faqStart = body.indexOf('[참고 자료]\n');
    const apiStart = body.indexOf('[사용자 정보 / API 결과]\n');
    if (faqStart >= 0) lines.push('### 제공된 FAQ', '', fence(body.slice(faqStart + '[참고 자료]\n'.length, apiStart >= 0 ? apiStart : q >= 0 ? q : undefined).trim()), '');
    if (apiStart >= 0) {
      const api = body.slice(apiStart + '[사용자 정보 / API 결과]\n'.length, q >= 0 ? q : undefined).trim();
      if (api !== '(없음)') lines.push('### 사용자 정보 / API 결과', '', fence(api), '');
    }
    if (messages.length > 1) lines.push('### 앞선 대화 이력', '', fence(JSON.stringify(messages.slice(0, -1), null, 2)), '');
    const parsed = row.parsed_output;
    lines.push('### 실제 답변', '', fence(parsed?.answer ?? row.content), '',
      `- 출력 status: ${parsed?.status ?? '(파싱 불가)'}`,
      `- 출력 evidence_ids: ${JSON.stringify(parsed?.evidence_ids ?? null)}`,
      `- 전체 완료 시간: ${(row.e2e_ms / 1000).toFixed(3)}초`, '');
  }
}
fs.writeFileSync(output, lines.join('\n') + '\n', 'utf8');
if (groups.size !== 300 || !lines.some(x => x === '## SR-0046')) throw new Error('문항 수 검증 실패');
console.log(JSON.stringify({output, uniqueCases:groups.size, rawResponses:rows.length, bytes:fs.statSync(output).size}));
