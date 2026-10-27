'use strict';

// Uses the authenticated Codex CLI (the same ChatGPT/Codex agent used in this
// workspace) as a conversational Judge. No OpenAI API key or Claude CLI is used.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'results', 'raw');
const MODEL = process.env.CODEX_JUDGE_MODEL || 'gpt-5.6-luna';
const BATCH_SIZE = 10;

function parseJson(text) {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start < 0 || end < start) throw new Error('Judge did not return a JSON array');
  return JSON.parse(cleaned.slice(start, end + 1));
}

function runCodex(prompt) {
  const outFile = path.join(os.tmpdir(), `codex-judge-${process.pid}-${Date.now()}.txt`);
  const result = spawnSync('codex', [
    'exec', '--ephemeral', '--sandbox', 'read-only',
    '--skip-git-repo-check', '--output-last-message', outFile, '-m', MODEL, '-',
  ], { cwd: ROOT, input: prompt, encoding: 'utf8', timeout: 600000, maxBuffer: 20 * 1024 * 1024, shell: process.platform === 'win32' });
  let output = '';
  if (fs.existsSync(outFile)) output = fs.readFileSync(outFile, 'utf8');
  try { if (fs.existsSync(outFile)) fs.unlinkSync(outFile); } catch (_) {}
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`codex exit ${result.status}: ${(result.stderr || result.stdout || '').slice(0, 500)}`);
  return parseJson(output || result.stdout || '');
}

function buildPrompt(kind, records) {
  const items = records.map((r, index) => kind === 'faq'
    ? { index, id: r.id, model: r.model, query: r.query, gold_answer: r.contextBlock, answer: r.parsed.answer }
    : { index, id: r.id, model: r.model, query: r.query, context: r.contextBlock, expected_behavior: r.expectedBehavior, failure_condition: r.failureCondition, answer: r.parsed.answer });
  const rubric = kind === 'faq'
    ? `For each item, score answer_accuracy 1-5 against the gold FAQ, faithful true only when the answer adds no unsupported factual guidance, hallucination a concise Korean explanation or empty string, and expression_quality 1-5. Return one object per item: {"index":0,"answer_accuracy":5,"faithful":true,"hallucination":"","expression_quality":4}.`
    : `For each item, decide pass true only when the answer follows expected_behavior and avoids failure_condition. Include failure_reason in Korean (empty when pass) and expression_quality 1-5. Return one object per item: {"index":0,"pass":true,"failure_reason":"","expression_quality":4}.`;
  return `You are the evaluation Judge for a Korean telecom FAQ/RAG benchmark. Evaluate every item independently. Do not use tools, do not explain your work, and output ONLY a JSON array with exactly one result for every input item, preserving each index. Be strict about unsupported facts, invented numbers, and claims not present in the supplied evidence.\n\n${rubric}\n\nINPUT ITEMS:\n${JSON.stringify(items)}`;
}

function loadRecords(file) {
  return fs.readFileSync(path.join(RAW_DIR, file), 'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse)
    .filter((r) => r.ok && r.formatValid && r.parsed && typeof r.parsed.answer === 'string');
}

function judgeFile(kind, inputFile, outputFile) {
  const records = loadRecords(inputFile);
  const judged = [];
  for (let start = 0; start < records.length; start += BATCH_SIZE) {
    const batch = records.slice(start, start + BATCH_SIZE);
    process.stdout.write(`  ${inputFile}: ${start + 1}-${start + batch.length}/${records.length} ... `);
    let scores;
    try {
      scores = runCodex(buildPrompt(kind, batch));
      if (!Array.isArray(scores) || scores.length !== batch.length) throw new Error(`expected ${batch.length} scores, got ${scores.length}`);
    } catch (error) {
      console.log(`FAILED: ${error.message}`);
      throw error;
    }
    batch.forEach((record, index) => {
      const score = scores.find((s) => Number(s.index) === index) || scores[index];
      if (!score) throw new Error(`missing score for ${record.id}/${record.model}`);
      const normalized = kind === 'faq'
        ? { answer_accuracy: Number(score.answer_accuracy), faithful: Boolean(score.faithful), hallucination: String(score.hallucination || ''), expression_quality: Number(score.expression_quality) }
        : { pass: Boolean(score.pass), failure_reason: String(score.failure_reason || ''), expression_quality: Number(score.expression_quality) };
      judged.push({ ...record, judge: { ok: true, source: 'codex_chatgpt', model: MODEL, scores: normalized, latencyMs: 0 } });
    });
    console.log('ok');
  }
  fs.writeFileSync(path.join(RAW_DIR, outputFile), judged.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');
  console.log(`Wrote ${outputFile}: ${judged.length} records`);
}

function main() {
  for (const round of ['medium', 'hard']) judgeFile('faq', `faq_${round}.scored.jsonl`, `faq_${round}.judged.jsonl`);
  for (const tier of ['small', 'medium', 'large']) judgeFile('rag', `rag_stability_${tier}.scored.jsonl`, `rag_stability_${tier}.judged.jsonl`);
}

main();
