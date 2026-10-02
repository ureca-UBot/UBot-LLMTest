'use strict';
// LLM Judge 3단계(판정): 준비된 입력을 외부 Judge로 채점한다. provider는 test.config.js의 judge.provider로
// 고른다 — openai(OpenAI API, lib/judge/providers/openai.js) 또는 codex(Codex CLI, ChatGPT 구독 인증,
// lib/judge/providers/codex.js — v4가 쓰는 provider, 2026-10-02). 판정 설정(provider·model·추론 강도)은
// 배치를 준비할 때 매니페스트에 고정된다. 저장 답변이 외부로 전송되므로 --confirm-external 없이는 실행하지 않는다(README 4-8절).
// 판정 단계는 이 스크립트 + lib/judge/{prompts,schema}.js + providers/만 쓴다. 문서 생성(judge_report.js
// 등)과 스크립트·프롬프트를 섞지 않는다.
//
//   raw/scored/<run_id>/llm_judge/<batch>/<kind>.jsonl   (케이스별 판정, 재개 가능)
//   llm_judge/runs/<batch>/                              (호출 로그·스키마·잠금)
//
// 재개: 같은 입력(user_text·원본 응답 해시·루브릭)으로 성공한 판정은 건너뛴다. 입력이
// 바뀌었으면 멈춘다 — 새 배치 ID로 다시 준비해야 한다.
//
// Usage:
//   node scripts/judge/judge_run.js --batch <id> --confirm-external [--kinds accuracy,safety,persona]
//     [--limit N] [--concurrency 1..8] [--test v4] [--try try1]

const fs = require('fs');
const path = require('path');
const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { parseRunArgs } = require('../lib/args');
const { readAll, makeAppender } = require('../lib/jsonl');
const { buildPlan } = require('./judge_prepare');
const { SYSTEM_PROMPTS } = require('../lib/judge/prompts');
const { SCHEMAS, SCHEMA_VERSION, validateJudgment } = require('../lib/judge/schema');
const { getProvider, parseAnswer } = require('../lib/judge/providers');

const keyOf = (j) => `${j.run_id}/${j.id}`;

// 준비된 입력이 지금 코드·데이터로 다시 만든 것과 같은지 확인한다.
function verifyInputs(batchId) {
  const { paths } = profile.load();
  const dir = paths.judgeInputsDir(batchId);
  const onDisk = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  const { manifest, jobs } = buildPlan(batchId);
  if (JSON.stringify(onDisk) !== JSON.stringify(manifest)) {
    throw new Error('준비된 입력과 현재 루브릭·스키마·답변·데이터가 다릅니다. 새 배치 ID로 judge_prepare.js를 다시 실행하세요.');
  }
  return { manifest, jobs };
}

function successfulJudgments(manifest, kind, jobsByKey, batchId) {
  const { paths } = profile.load();
  const done = new Map();
  for (const run of manifest.runs) {
    for (const row of readAll(paths.judgeResultPath(run.run_id, batchId, kind))) {
      if (row.error) continue;
      const job = jobsByKey.get(`${row.run_id}/${row.id}`);
      if (!job || row.user_text_sha256 !== job.user_text_sha256 || row.source_record_sha256 !== job.source_record_sha256
        || row.rubric_sha256 !== manifest.kinds[kind].system_prompt_sha256 || row.judge_model !== manifest.judge.model) {
        throw new Error(`저장된 판정이 현재 입력과 다릅니다: ${kind} ${row.run_id}/${row.id}`);
      }
      done.set(`${row.run_id}/${row.id}`, row);
    }
  }
  return done;
}

async function runKind(kind, { manifest, jobs }, opts, batchId) {
  const { paths, config } = profile.load();
  const outDir = paths.judgeRunsDir(batchId);
  const all = jobs[kind];
  const jobsByKey = new Map(all.map((j) => [keyOf(j), j]));
  const done = successfulJudgments(manifest, kind, jobsByKey, batchId);
  const pending = all.filter((j) => !j.unscored_reason && !done.has(keyOf(j))).slice(0, opts.limit || Infinity);
  console.log(`[${kind}] 전체 ${all.length} · 완료 ${done.size} · 미채점 대상 ${all.filter((j) => j.unscored_reason).length} · 이번 ${pending.length}`);
  if (!pending.length) return;

  // 판정 설정은 매니페스트(준비 시점)에 고정된 값을 쓴다. 호출 방식에 필요한 부가 값(타임아웃·재시도·
  // 키 환경변수·CLI 경로)만 현재 설정에서 가져온다.
  const judgeCfg = { ...config.judge, provider: manifest.judge.provider, model: manifest.judge.model,
    reasoningEffort: manifest.judge.reasoning_effort, temperature: manifest.judge.temperature, seed: manifest.judge.seed };
  const provider = getProvider(judgeCfg.provider);
  provider.checkReady(judgeCfg);

  fs.mkdirSync(outDir, { recursive: true });
  const lockPath = path.join(outDir, `${kind}.lock`);
  fs.writeFileSync(lockPath, JSON.stringify({ pid: process.pid, started_at: new Date().toISOString() }), { flag: 'wx' });
  let next = 0, consecutiveFailures = 0, stopError = null, finished = 0;

  async function worker() {
    while (!stopError && next < pending.length) {
      const job = pending[next++];
      const base = {
        id: job.id, run_id: job.run_id, model_tag: job.model_tag, item: job.item, difficulty: job.difficulty,
        round: job.round, batch_id: batchId, kind,
        judge: manifest.judge.provider, judge_model: manifest.judge.model, judge_reasoning_effort: manifest.judge.reasoning_effort,
        rubric_version: manifest.rubric_version, rubric_sha256: manifest.kinds[kind].system_prompt_sha256,
        schema_version: SCHEMA_VERSION, source_record_sha256: job.source_record_sha256, user_text_sha256: job.user_text_sha256,
      };
      let success = false;
      for (let attempt = 1; attempt <= 2 && !success; attempt++) {
        const appender = makeAppender(paths.judgeResultPath(job.run_id, batchId, kind));
        try {
          const res = await provider.invoke({ job, kind, systemPrompt: SYSTEM_PROMPTS[kind], schema: SCHEMAS[kind],
            attempt, outDir, judgeCfg, root: paths.root });
          const result = validateJudgment(parseAnswer(res.text), kind, job);
          appender.append({ ...base, ...result, judged_at: new Date().toISOString(), judge_latency_ms: res.latency_ms,
            judge_response_model: res.response_model ?? null, judge_usage: res.usage, call_log: res.call_log, error: null });
          success = true; consecutiveFailures = 0;
        } catch (e) {
          appender.append({ ...base, judged_at: new Date().toISOString(), attempt, error: String(e.message).slice(0, 2000) });
          console.error(`[${kind}] ${keyOf(job)} 시도 ${attempt} 실패: ${String(e.message).slice(0, 200)}`);
        } finally { appender.close(); }
      }
      finished++;
      if (finished % 20 === 0 || finished === pending.length) console.log(`[${kind}] ${finished}/${pending.length}`);
      if (!success && ++consecutiveFailures >= 3) stopError = new Error('Judge 호출이 연속으로 실패해 멈췄습니다. 성공한 판정은 보존됩니다.');
    }
  }

  try {
    await Promise.all(Array.from({ length: Math.min(opts.concurrency || 1, pending.length) }, () => worker()));
    if (stopError) throw stopError;
  } finally {
    fs.unlinkSync(lockPath);
  }
}

async function main() {
  const { opts } = parseRunArgs(argv);
  if (!opts.batch) throw new Error('--batch <id>가 필요합니다.');
  if (!opts.confirmExternal) {
    throw new Error('저장된 답변을 외부 Judge로 전송합니다. 승인을 받은 뒤 --confirm-external을 붙여 실행하세요.');
  }
  if (opts.concurrency && opts.concurrency > 8) throw new Error('--concurrency는 1~8입니다.');
  const plan = verifyInputs(opts.batch);
  const kinds = opts.kinds || Object.keys(plan.jobs);
  for (const kind of kinds) {
    if (!plan.jobs[kind]) throw new Error(`이 배치에 없는 Judge 종류: ${kind}`);
    await runKind(kind, plan, opts, opts.batch);
  }
  console.log(`\n다음: node scripts/docgen/judge_report.js --batch ${opts.batch}`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
