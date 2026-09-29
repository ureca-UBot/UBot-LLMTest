'use strict';

// Runs the FAQ answer-generation prompt (README 9-1) against all 9 candidate models
// for one round (easy/medium/hard/rag), and appends raw results to results/raw/<round>.jsonl
//
// Usage: node model_test_v1/scripts/run_round.js easy
//        node model_test_v1/scripts/run_round.js medium
//        node model_test_v1/scripts/run_round.js hard
//        node model_test_v1/scripts/run_round.js rag

const fs = require('fs');
const path = require('path');
const { DATA_DIR, EVAL_DIR, RAW_DIR } = require('./lib/paths');
const { parseCsvObjects } = require('./lib/csv');
const { chatOnce } = require('./lib/ollama');
const { MODELS, ANSWER_GEN_SYSTEM_PROMPT: SYSTEM_PROMPT } = require('./lib/prompts');


function loadFaqMap() {
  const text = fs.readFileSync(path.join(DATA_DIR, 'faq.csv'), 'utf8');
  const rows = parseCsvObjects(text);
  const map = new Map();
  for (const r of rows) {
    map.set(r['FAQ ID'], { category: r['카테고리'], question: r['FAQ 질문'], answer: r['FAQ 답변'] });
  }
  return map;
}

function buildContextBlockFromFaqIds(idsField, faqMap) {
  const ids = idsField.split(';').map((s) => s.trim()).filter(Boolean);
  if (ids.length === 0) return '(제공된 FAQ 없음)';
  return ids
    .map((id) => {
      const faq = faqMap.get(id);
      if (!faq) return `${id}: (원문 조회 실패)`;
      return `${id}: ${faq.category} - Q: ${faq.question} A: ${faq.answer}`;
    })
    .join('\n');
}

const ROUND_CONFIG = {
  easy: { file: 'faq_easy.csv', excludeIntent: 'MAP_API', idField: 'ID', queryField: '사용자 질문', gtField: 'Primary GT', intentField: '처리 의도' },
  medium: { file: 'faq_medium.csv', excludeIntent: 'MAP_API', idField: 'ID', queryField: '사용자 질문', gtField: 'Primary GT', intentField: '처리 의도' },
  hard: { file: 'faq_hard.csv', excludeIntent: 'MAP_API', idField: 'ID', queryField: '사용자 질문', gtField: 'Primary GT', intentField: '처리 의도' },
};

async function runFaqRound(roundName) {
  const cfg = ROUND_CONFIG[roundName];
  const faqMap = loadFaqMap();
  const text = fs.readFileSync(path.join(EVAL_DIR, cfg.file), 'utf8');
  const rows = parseCsvObjects(text).filter((r) => r[cfg.intentField] !== cfg.excludeIntent);

  fs.mkdirSync(RAW_DIR, { recursive: true });
  const outPath = path.join(RAW_DIR, `faq_${roundName}.jsonl`);
  const outStream = fs.createWriteStream(outPath, { flags: 'a' });

  console.log(`[${roundName}] ${rows.length} cases x ${MODELS.length} models = ${rows.length * MODELS.length} calls`);

  for (const row of rows) {
    const id = row[cfg.idField];
    const query = row[cfg.queryField];
    const contextBlock = buildContextBlockFromFaqIds(row[cfg.gtField], faqMap);
    const userPrompt = `[사용자 질문]\n${query}\n\n[참고 FAQ]\n${contextBlock}`;

    for (const model of MODELS) {
      process.stdout.write(`  ${id} x ${model} ... `);
      const result = await chatOnce(model, SYSTEM_PROMPT, userPrompt);
      const record = {
        round: roundName,
        id,
        model,
        query,
        contextBlock,
        ...result,
      };
      outStream.write(JSON.stringify(record) + '\n');
      if (result.ok) {
        console.log(`ok (${result.latencyMs}ms, format=${result.formatValid})`);
      } else {
        console.log(`FAILED: ${result.error}`);
      }
    }
  }

  outStream.end();
  console.log(`[${roundName}] done -> ${outPath}`);
}

async function main() {
  const roundName = process.argv[2];
  if (!ROUND_CONFIG[roundName]) {
    console.error(`Usage: node model_test_v1/scripts/run_round.js <${Object.keys(ROUND_CONFIG).join('|')}>`);
    process.exit(1);
  }
  await runFaqRound(roundName);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
