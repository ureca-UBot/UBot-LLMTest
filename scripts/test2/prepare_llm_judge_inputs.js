'use strict';

// Prepare saved responses for independent AI review. Does not call an LLM,
// generate answers, assign scores, or modify any existing evaluation results.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { parseCsvObjects } = require('./lib/csv');
const { isPrimaryRound } = require('./lib/rounds');
const { SYSTEM_PROMPT } = require('./lib/prompts');
const {
  ACCURACY_HALLUCINATION_EXPRESSION_SYSTEM_PROMPT,
  SAFETY_SYSTEM_PROMPT,
} = require('./lib/judge_prompts');

const ROOT = path.resolve(__dirname, '../..');
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

function parseJsonlStrict(text, label) {
  return text.split(/\r?\n/).filter((line) => line.trim()).map((line, i) => {
    try { return JSON.parse(line); }
    catch { throw new Error(`${label}: invalid JSON at record ${i + 1}`); }
  });
}

function uniqueIndex(rows, field, label) {
  const index = new Map();
  for (const row of rows) {
    if (!row[field] || index.has(row[field])) throw new Error(`${label}: missing/duplicate ${field}`);
    index.set(row[field], row);
  }
  return index;
}

function buildUserText(row, generation, kind) {
  const context = row['제공 Context'];
  const userInfo = row['사용자 정보 / API 결과'];
  const parts = [
    `[사용자 질문]\n${row['User Question'] || ''}`,
    `[대화 이력]\n${row['대화 이력'] || '(없음)'}`,
    `[제공 Context]\n${!context || context === 'EMPTY' ? '(제공된 자료 없음)' : context}`,
    `[사용자 정보 / API 결과]\n${!userInfo || userInfo === '없음' ? '(없음)' : userInfo}`,
  ];
  if (kind === 'safety') {
    parts.push(`[시스템 프롬프트 요약]\n${SYSTEM_PROMPT}`);
  } else {
    parts.push(`[정답 예시]\n${row['정답 예시'] || ''}`);
    parts.push(`[필수 포함 사실]\n${row['필수 포함 사실'] || ''}`);
    parts.push(`[기대 응답 상태]\n${row['기대 응답 상태'] || ''}`);
  }
  if (generation.parsed && typeof generation.parsed.answer === 'string') {
    parts.push('[상담봇 응답]\n' + JSON.stringify({
      status: generation.parsed.status ?? null,
      answer: generation.parsed.answer,
      evidence_ids: generation.parsed.evidence_ids ?? null,
    }));
  } else {
    // Invalid or empty model responses remain in the denominator and in the
    // judge input. Never drop them as if they had not been tested.
    parts.push('[상담봇 응답 — 파싱 불가 또는 답변 누락]\n' + JSON.stringify({
      parsed: generation.parsed ?? null,
      raw_content: generation.raw_content ?? '',
      generation_error: generation.error ?? null,
      format_fail_reason: generation.format_fail_reason ?? null,
    }));
  }
  return parts.join('\n\n');
}

function prepare(manifestPath) {
  const manifestBytes = fs.readFileSync(manifestPath);
  const batch = JSON.parse(manifestBytes.toString('utf8'));
  if (batch.status !== 'completed' || !Array.isArray(batch.runs) || !batch.runs.length) {
    throw new Error('A completed generation batch manifest is required.');
  }
  const safeId = /^[A-Za-z0-9_-]+$/;
  if (!safeId.test(batch.batch_id)) throw new Error('Invalid batch ID');
  const casesPath = path.join(ROOT, 'data/eval_sets/test_set2/cases.csv');
  const casesBytes = fs.readFileSync(casesPath);
  const cases = parseCsvObjects(casesBytes.toString('utf8'));
  const casesIndex = uniqueIndex(cases, 'ID', 'cases.csv');
  const primary = cases.filter(isPrimaryRound);
  const safetyCases = primary.filter((c) => c['유형'] === '적대적 입력·범위 밖');
  const jobs = { accuracy: [], safety: [] };
  const runs = [];
  const seenRuns = new Set();

  for (const run of batch.runs) {
    if (!safeId.test(run.run_id) || seenRuns.has(run.run_id)) throw new Error('Invalid/duplicate run ID');
    seenRuns.add(run.run_id);
    if (run.status !== 'completed') throw new Error(`Incomplete run: ${run.run_id}`);
    const sourcePath = path.join(ROOT, 'results/raw/test2', run.run_id, 'generation.jsonl');
    const sourceBytes = fs.readFileSync(sourcePath);
    const generations = parseJsonlStrict(sourceBytes.toString('utf8'), sourcePath);
    const byId = uniqueIndex(generations, 'id', sourcePath);
    for (const generation of generations) {
      if (!casesIndex.has(generation.id)) throw new Error(`Unknown case: ${generation.id}`);
      if (generation.run_id !== run.run_id || generation.model_tag !== run.model) {
        throw new Error(`Source run/model mismatch: ${generation.id}`);
      }
    }
    for (const kind of ['accuracy', 'safety']) {
      const selected = kind === 'accuracy' ? primary : safetyCases;
      for (const row of selected) {
        const generation = byId.get(row.ID);
        if (!generation) throw new Error(`Missing generation: ${run.run_id}/${row.ID}`);
        const userText = buildUserText(row, generation, kind);
        jobs[kind].push({
          kind, id: row.ID, run_id: run.run_id, model_tag: generation.model_tag,
          env: generation.env, type: row['유형'], round: row['실행 회차'] || '1',
          source_record_sha256: sha256(JSON.stringify(generation)),
          user_text: userText, user_text_sha256: sha256(userText),
        });
      }
    }
    runs.push({
      run_id: run.run_id, model: run.model, source_path: path.relative(ROOT, sourcePath),
      source_sha256: sha256(sourceBytes), generation_records: generations.length,
      accuracy_jobs: primary.length, safety_jobs: safetyCases.length,
    });
  }
  const out = path.join(ROOT, 'results/judge_inputs/test2', batch.batch_id);
  const prepared = {
    status: 'inputs_prepared_not_scored', batch_id: batch.batch_id,
    source_commit: batch.source_commit,
    batch_manifest_sha256: sha256(manifestBytes), cases_sha256: sha256(casesBytes),
    accuracy_system_prompt_sha256: sha256(ACCURACY_HALLUCINATION_EXPRESSION_SYSTEM_PROMPT),
    safety_system_prompt_sha256: sha256(SAFETY_SYSTEM_PROMPT),
    planned_accuracy_jobs: jobs.accuracy.length, planned_safety_jobs: jobs.safety.length,
    planned_total_jobs: jobs.accuracy.length + jobs.safety.length,
    completed_judgments: 0, runs,
    note: 'Prepared inputs only. No judge calls or scores. Execution method is awaiting confirmation.',
  };
  const files = {
    'accuracy_system_prompt.txt': ACCURACY_HALLUCINATION_EXPRESSION_SYSTEM_PROMPT,
    'safety_system_prompt.txt': SAFETY_SYSTEM_PROMPT,
    'accuracy_jobs.jsonl': jobs.accuracy.map((r) => JSON.stringify(r)).join('\n') + '\n',
    'safety_jobs.jsonl': jobs.safety.map((r) => JSON.stringify(r)).join('\n') + '\n',
    'manifest.json': JSON.stringify(prepared, null, 2) + '\n',
  };
  // Preflight every destination before writing. A repeated preparation is a
  // no-op; conflicting pre-existing files are preserved and reported.
  for (const [name, content] of Object.entries(files)) {
    const dest = path.join(out, name);
    if (fs.existsSync(dest) && fs.readFileSync(dest, 'utf8') !== content) {
      throw new Error(`Refusing to overwrite different existing file: ${dest}`);
    }
  }
  fs.mkdirSync(out, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    const dest = path.join(out, name);
    if (!fs.existsSync(dest)) fs.writeFileSync(dest, content, { flag: 'wx', encoding: 'utf8' });
  }
  return { ...prepared, output_directory: out };
}

if (require.main === module) {
  try {
    if (!process.argv[2]) throw new Error('usage: node scripts/test2/prepare_llm_judge_inputs.js <batch-manifest>');
    const result = prepare(path.resolve(process.argv[2]));
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { prepare, buildUserText, parseJsonlStrict, uniqueIndex };
