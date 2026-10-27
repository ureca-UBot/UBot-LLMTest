'use strict';

// Runs the same FAQ answer-generation prompt (README 9-1) against all 9 candidate
// models for the RAG 안정성 round (small/medium/large tiers), and appends raw
// results to results/raw/rag_stability_<tier>.jsonl
//
// Unlike run_round.js (Easy/Medium/Hard), the context here is NOT built by looking
// up FAQ IDs in data/faq.csv — the "제공 Context" column in rag_stability_*.csv is
// already the exact text to hand to the model (irrelevant FAQs, contradictions,
// empty context, partial info, noise, multi-FAQ combos — see README 7-1절).
//
// Usage: node scripts/run_rag_stability_round.js small
//        node scripts/run_rag_stability_round.js medium
//        node scripts/run_rag_stability_round.js large

const fs = require('fs');
const path = require('path');
const { parseCsvObjects } = require('./lib/csv');
const { chatOnce } = require('./lib/ollama');
const { MODELS, ANSWER_GEN_SYSTEM_PROMPT } = require('./lib/prompts');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const RAW_DIR = path.join(ROOT, 'results', 'raw');

const TIERS = {
  small: 'rag_stability_small.csv',
  medium: 'rag_stability_medium.csv',
  large: 'rag_stability_large.csv',
};

// "FAQ-063 특정 번호 차단 / FAQ-077 매장 영업시간" -> one FAQ mention per line.
// "EMPTY" -> standard empty-context placeholder (matches the FAQ-round convention).
function buildContextBlock(rawContext) {
  const trimmed = (rawContext || '').trim();
  if (!trimmed || trimmed.toUpperCase() === 'EMPTY') return '(제공된 FAQ 없음)';
  return trimmed
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n');
}

async function runTier(tier) {
  const file = TIERS[tier];
  const text = fs.readFileSync(path.join(DATA_DIR, 'eval_sets', file), 'utf8');
  const rows = parseCsvObjects(text);

  fs.mkdirSync(RAW_DIR, { recursive: true });
  const outPath = path.join(RAW_DIR, `rag_stability_${tier}.jsonl`);
  const outStream = fs.createWriteStream(outPath, { flags: 'a' });

  console.log(`[rag_stability_${tier}] ${rows.length} cases x ${MODELS.length} models = ${rows.length * MODELS.length} calls`);

  for (const row of rows) {
    const id = row['ID'];
    const query = row['사용자 질문'];
    const contextBlock = buildContextBlock(row['제공 Context']);
    const userPrompt = `[사용자 질문]\n${query}\n\n[참고 FAQ]\n${contextBlock}`;

    for (const model of MODELS) {
      process.stdout.write(`  ${id} x ${model} ... `);
      const result = await chatOnce(model, ANSWER_GEN_SYSTEM_PROMPT, userPrompt);
      const record = {
        tier,
        id,
        model,
        query,
        contextBlock,
        type: row['유형'],
        difficulty: row['난이도'],
        contextCount: row['Context 개수'],
        expectedRef: row['정답/관련 FAQ'],
        expectedBehavior: row['기대 행동'],
        failureCondition: row['실패 조건'],
        intent: row['처리 의도'],
        testPoint: row['테스트 포인트'],
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
  console.log(`[rag_stability_${tier}] done -> ${outPath}`);
}

async function main() {
  const tier = process.argv[2];
  if (!TIERS[tier]) {
    console.error(`Usage: node scripts/run_rag_stability_round.js <${Object.keys(TIERS).join('|')}>`);
    process.exit(1);
  }
  await runTier(tier);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
