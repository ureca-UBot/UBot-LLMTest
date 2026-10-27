'use strict';

// Runs the repository's existing six evaluation rounds against only the models
// listed below. The individual round/score/judge/aggregate scripts remain the
// source of truth for test logic and output format.
//
// Usage:
//   node scripts/run_selected_models.js
//   node scripts/run_selected_models.js --reset
//   node scripts/run_selected_models.js --reset --skip-judge

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'results', 'raw');

// Selected model tags for this test run.
const MODELS = [
  'qwen3:4b',
  'qwen3:8b',
  'qwen3:14b',
  'gemma3:4b',
  'gemma3:12b',
];

const FAQ_ROUNDS = ['easy', 'medium', 'hard'];
const RAG_TIERS = ['small', 'medium', 'large'];
const args = new Set(process.argv.slice(2));
const fromRound = process.argv.includes('--from') ? process.argv[process.argv.indexOf('--from') + 1] : null;

function removeIfExists(file) {
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

function resetOutputs() {
  for (const round of FAQ_ROUNDS) {
    const base = path.join(RAW_DIR, `faq_${round}`);
    for (const suffix of ['.jsonl', '.scored.jsonl', '.judged.jsonl']) removeIfExists(base + suffix);
  }
  for (const tier of RAG_TIERS) {
    const base = path.join(RAW_DIR, `rag_stability_${tier}`);
    for (const suffix of ['.jsonl', '.scored.jsonl', '.judged.jsonl']) removeIfExists(base + suffix);
  }
}

function run(script, argument) {
  console.log(`\n>>> node scripts/${script} ${argument}`);
  const result = spawnSync(process.execPath, [path.join(__dirname, script), argument], {
    cwd: ROOT,
    env: { ...process.env, LLM_TEST_MODELS: MODELS.join(','), RESULT_SUFFIX: '_selected' },
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${script} ${argument} failed with exit code ${result.status}`);
  }
}

function copyScoredAsJudged(prefix) {
  fs.copyFileSync(
    path.join(RAW_DIR, `${prefix}.scored.jsonl`),
    path.join(RAW_DIR, `${prefix}.judged.jsonl`),
  );
}

function ensureResultTemplate(sourceName, selectedName) {
  const source = path.join(ROOT, 'results', sourceName);
  const selected = path.join(ROOT, 'results', selectedName);
  if (!fs.existsSync(selected)) fs.copyFileSync(source, selected);
}

function main() {
  if (args.has('--reset')) resetOutputs();

  console.log(`Selected models (${MODELS.length}): ${MODELS.join(', ')}`);
  console.log('Rounds: FAQ easy/medium/hard + RAG stability small/medium/large');
  console.log(args.has('--reset') ? 'Existing intermediate outputs were reset.' : 'Existing raw outputs will be appended; use --reset for a clean run.');
  console.log(args.has('--skip-judge') ? 'Judge step: skipped; deterministic metrics only.' : 'Judge step: OpenAI API.');

  const faqRounds = fromRound ? FAQ_ROUNDS.slice(FAQ_ROUNDS.indexOf(fromRound)) : FAQ_ROUNDS;
  for (const round of faqRounds) {
    run('run_round.js', round);
    run('score_deterministic.js', round);
    if (args.has('--skip-judge')) copyScoredAsJudged(`faq_${round}`);
    else run('judge_round.js', round);
    ensureResultTemplate(`faq_${round}_results.md`, `faq_${round}_selected_results.md`);
    run('aggregate_faq_round.js', round);
  }
  for (const tier of RAG_TIERS) {
    run('run_rag_stability_round.js', tier);
    run('score_rag_stability.js', tier);
    if (args.has('--skip-judge')) copyScoredAsJudged(`rag_stability_${tier}`);
    else run('judge_rag_stability_round.js', tier);
    ensureResultTemplate(`faq_rag_stability_${tier}_results.md`, `faq_rag_stability_${tier}_selected_results.md`);
    run('aggregate_rag_stability_round.js', tier);
  }

  run('generate_summary.js', '');

  console.log('\nAll selected-model rounds completed.');
}

try {
  main();
} catch (error) {
  console.error(`\nERROR: ${error.message}`);
  process.exit(1);
}
