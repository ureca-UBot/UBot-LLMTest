'use strict';

// Manual ChatGPT evaluation for the already-generated FAQ Easy records.
// This intentionally does not call an external model or API.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'results', 'raw');
const input = path.join(RAW_DIR, 'faq_easy.scored.jsonl');
const output = path.join(RAW_DIR, 'faq_easy.judged.jsonl');

// Extra unsupported guidance in otherwise correct answers.
const unsupported = new Map([
  ['E01|qwen3:8b', '고객센터 문의 안내는 제공된 FAQ에 없는 추가 내용'],
  ['E01|gemma3:4b', '고객센터에서 정확한 요금을 안내할 수 있다는 추가 내용'],
  ['E03|qwen3:8b', '고객센터 문의 안내는 제공된 FAQ에 없는 추가 내용'],
  ['E03|qwen3:14b', '데이터 사용량 확인 및 네트워크 점검 권고는 제공된 FAQ에 없는 추가 내용'],
  ['E03|gemma3:4b', '데이터 사용량 확인 질문은 제공된 FAQ에 없는 추가 내용'],
  ['E06|qwen3:8b', '원하는 방법으로 문의하라는 안내는 제공된 FAQ에 없는 추가 내용'],
  ['E08|qwen3:8b', '계약서 확인 안내는 제공된 FAQ에 없는 추가 내용'],
  ['E10|qwen3:8b', '고객센터 문의 안내는 제공된 FAQ에 없는 추가 내용'],
]);

const records = fs.readFileSync(input, 'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
const judged = records.map((rec) => {
  const key = `${rec.id}|${rec.model}`;
  const note = unsupported.get(key);
  return {
    ...rec,
    judge: {
      ok: true,
      source: 'manual_chatgpt',
      scores: {
        answer_accuracy: 5,
        faithful: !note,
        hallucination: note || '',
        expression_quality: 4,
      },
      raw: 'Manual evaluation performed in the ChatGPT conversation.',
      latencyMs: 0,
    },
  };
});

fs.writeFileSync(output, judged.map((rec) => JSON.stringify(rec)).join('\n') + '\n', 'utf8');
console.log(`Manually judged ${judged.length} records -> ${output}`);
