'use strict';
// pipeline_test_v1 LLM Judge. run 폴더의 results.jsonl(케이스 + 응답 + 백엔드 trace)을 하위 질문 단위로 판정한다.
// provider·모델·추론 강도는 model_test_v5와 같다(Codex CLI · gpt-6-sol · medium, lib/judge/providers/codex.js).
// 저장 답변이 외부(Codex)로 전송되므로 --confirm-external 없이는 실행하지 않는다.
//
//   입력:  pipeline_test_v1/<try>/results/raw/<run_id>/results.jsonl
//   출력:  pipeline_test_v1/<try>/results/llm_judge/<batch>/<run_id>.judgments.jsonl   (케이스별, 재개 가능)
//          pipeline_test_v1/<try>/results/llm_judge/<batch>/runs/                      (호출 로그·스키마·지침)
//
// 답변 LLM까지 가지 않은 케이스(CHAT-012/013 등)는 판정하지 않는다(unscored_reason). 채점 스크립트가 따로 센다.
// 재개: 같은 입력 해시로 성공한 판정은 건너뛴다.
//
// Usage: node scripts/judge/judge_pipeline.js --batch <id> --runs <run_id>[,<run_id>] --confirm-external
//          [--test pipeline_test_v1] [--try try1] [--concurrency 4] [--limit N] [--ids SA-001,...] [--store-only]
//   --store-only: 매장 조회 도구가 붙은 케이스만 판정한다(루브릭 2의 매장 기준 재판정용). 채점은 --judge-batch <기존>,<새 배치>로 덮어쓴다.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { parseCsvObjects } = require('../lib/csv');
const codex = require('../lib/judge/providers/codex');

const ROOT = path.join(__dirname, '..', '..');
// FAQ 스냅샷은 pipeline_test_v1/cases를 모든 회차가 같이 쓴다. run·판정은 --test 폴더(기본 pipeline_test_v1).
const CASES_DIR = path.join(ROOT, 'pipeline_test_v1', 'cases');
const PROMPT_DIR = path.join(ROOT, 'prompts', 'judge');
// 2: 매장 조회 하위 질문은 도구 결과를 정답 기준으로 보고, 도구의 작성 안내(매장 수 등)는 정답 조건이 아님(2026-10-21).
const RUBRIC_VERSION = 'pipeline-judge-2';
const KIND = 'pipeline_accuracy';
const JUDGE = {
  provider: 'codex', model: 'gpt-6-sol', reasoningEffort: 'medium',
  cli: process.env.LLM_JUDGE_CODEX_BIN || 'codex', timeoutMs: 240000,
};

const OUTCOMES = ['CORRECT_ANSWER', 'WRONG_ANSWER', 'MISSING_ANSWER', 'CORRECT_DECLINE', 'UNSUPPORTED_ANSWER'];
const CLAIM_TYPES = ['FABRICATION', 'FALSE_COMPLETION', 'MISATTRIBUTION', 'UNSUPPORTED_GENERALIZATION', 'SILENT_CONFLICT_PICK'];
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['sub_results', 'accuracy', 'is_grounded', 'grounding_score', 'hallucinated_claims',
    'decline_notice', 'asks_user', 'query_rewrite', 'query_rewrite_note', 'reasoning'],
  properties: {
    sub_results: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['index', 'outcome', 'note'],
        properties: { index: { type: 'integer' }, outcome: { type: 'string', enum: OUTCOMES }, note: { type: 'string' } },
      },
    },
    accuracy: { type: 'string', enum: ['CORRECT', 'INCORRECT'] },
    is_grounded: { type: 'boolean' },
    grounding_score: { type: 'integer', enum: [1, 2, 3, 4, 5] },
    hallucinated_claims: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['claim', 'type', 'reason'],
        properties: { claim: { type: 'string' }, type: { type: 'string', enum: CLAIM_TYPES }, reason: { type: 'string' } },
      },
    },
    decline_notice: { type: 'boolean' },
    asks_user: { type: 'boolean' },
    query_rewrite: { type: 'string', enum: ['FAITHFUL', 'CHANGED', 'NOT_APPLICABLE'] },
    query_rewrite_note: { type: 'string' },
    reasoning: { type: 'string' },
  },
};

function parseArgs(argv) {
  const args = { batch: null, runs: [], testName: 'pipeline_test_v1', tryName: 'try1', confirm: false, concurrency: 4, limit: null, ids: null, storeOnly: false };
  for (let i = 0; i < argv.length; i++) {
    const value = () => argv[++i];
    switch (argv[i]) {
      case '--batch': args.batch = value(); break;
      case '--runs': args.runs = value().split(','); break;
      case '--test': args.testName = value(); break;
      case '--try': args.tryName = value(); break;
      case '--confirm-external': args.confirm = true; break;
      case '--concurrency': args.concurrency = Number(value()); break;
      case '--limit': args.limit = Number(value()); break;
      case '--ids': args.ids = new Set(value().split(',')); break;
      case '--store-only': args.storeOnly = true; break;
      default: throw new Error(`알 수 없는 인자: ${argv[i]}`);
    }
  }
  if (!args.batch || !args.runs.length) throw new Error('--batch와 --runs가 필요합니다.');
  return args;
}

function loadRubric() {
  const strip = (text) => text.replace(/<!--[\s\S]*?-->\s*/g, '');
  const guard = strip(fs.readFileSync(path.join(PROMPT_DIR, 'common_guard.md'), 'utf8')).trim();
  return strip(fs.readFileSync(path.join(PROMPT_DIR, 'pipeline_accuracy.md'), 'utf8'))
    .replace('{{include common_guard.md}}', guard).trim();
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
}

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

function loadFaqs() {
  const rows = parseCsvObjects(fs.readFileSync(path.join(CASES_DIR, 'faq_snapshot.csv'), 'utf8'));
  return new Map(rows.map((row) => [String(row.faqId), row]));
}

function faqBlock(faqs, ids) {
  const lines = [...new Set(ids)].map((id) => {
    const faq = faqs.get(String(id));
    return faq ? `[FAQ ${id}] 질문: ${faq.question}\n답변: ${faq.answer}` : `[FAQ ${id}] (스냅숏에 없음)`;
  });
  return lines.length ? lines.join('\n') : '(없음)';
}

const ACTION = {
  ANSWER: 'ANSWER — 자료로 답할 수 있으므로 답해야 함',
  ABSTAIN: 'ABSTAIN — 묻는 값이 자료에 없으므로 지어내지 말고 답하지 않아야 함',
  OUT_OF_SCOPE: 'OUT_OF_SCOPE — 통신 상담 주제가 아니므로 답하지 않아야 함',
  CONFLICT: 'CONFLICT — 자료끼리 충돌해 확정하지 않아야 함',
};

/** 답변 LLM에 매장 조회 도구가 붙었거나 실제로 호출된 케이스. */
function usesStoreTool(result) {
  const trace = result.trace || {};
  return (trace.store_tool_calls || []).length > 0 || (trace.answer_llm?.tools || []).includes('STORE_SEARCH');
}

/** 답변 LLM까지 간 케이스만 판정한다. 아니면 이유를 돌려준다. */
function unscoredReason(result) {
  const final = result.response?.final;
  if (result.response?.error) return 'runner_error';
  if (!final || final.timed_out) return 'timeout';
  if (final.status !== 'SUCCEEDED') return `failed:${final.error_code ?? final.http_status ?? 'unknown'}`;
  if (!result.trace?.answer_llm) return 'no_answer_llm_trace';
  return null;
}

function buildUserText(result, faqs) {
  const trace = result.trace;
  const llm = trace.answer_llm;
  const parts = [];
  parts.push(`[사용자 질문]\n${result.question}`);
  if (result.response.turns.length) {
    parts.push('[이전 대화]\n' + result.response.turns.map((turn, i) =>
      `${i + 1}. 사용자: ${turn.question}\n   챗봇: ${turn.answer ?? `(답변 실패: ${turn.error_code ?? '알 수 없음'})`}`).join('\n'));
  }
  parts.push('[하위 질문별 정답 기준]\n' + result.expected.sub_questions.map((sub) => {
    const partial = sub.status !== sub.status_strict ? '\n부분 답변 허용: 자료로 일부만 답할 수 있는 하위 질문' : '';
    return `## 하위 질문 ${sub.index}: ${sub.user_text}\n기대 행동: ${ACTION[sub.status]}${partial}\n근거 FAQ:\n${faqBlock(faqs, sub.gold_faq_ids)}`;
  }).join('\n\n'));

  const seen = [];
  // New backend evaluations retain the exact sentence-filtered FAQ text supplied to the LLM.
  // Older runs lack this field and keep their original judge inputs byte-for-byte.
  const actualFaqs = Array.isArray(llm.prompt_faqs) ? llm.prompt_faqs : null;
  seen.push(`FAQ:\n${actualFaqs ? actualFaqs.map((faq) =>
    `[FAQ ID: ${faq.id}]\n질문: ${faq.question}\n답변: ${faq.answer}`).join('\n\n') || '(없음)' : faqBlock(faqs, llm.prompt_faq_ids || [])}`);
  for (const section of llm.sections || []) seen.push(`${section.title}:\n${section.content}`);
  if (Array.isArray(trace.tool_calls)) {
    for (const call of trace.tool_calls) seen.push(`실제 도구 결과(${call.name}, 입력=${call.input ?? '없음'}):\n${call.result}`);
  } else {
    for (const call of trace.store_tool_calls || []) seen.push(`매장 조회 도구 결과(place=${call.place ?? '없음'}):\n${call.result}`);
  }
  parts.push('[챗봇이 받은 자료]\n' + seen.join('\n\n'));

  parts.push(`[챗봇 답변(모델)]\n${llm.answer && llm.answer.trim() ? llm.answer : '(빈 문자열)'}`);
  if (llm.code_notice) parts.push(`[시스템 고정 안내]\n${llm.code_notice}`);
  const queries = trace.planner?.judge_called ? trace.planner.judge_queries : null;
  if (queries && queries.length) parts.push('[판정 LLM 검색어]\n' + queries.map((q, i) => `${i + 1}. ${q}`).join('\n'));
  return parts.join('\n\n');
}

function validate(answer, result) {
  const expected = result.expected.sub_questions.map((s) => s.index);
  const got = answer.sub_results.map((s) => s.index).sort((a, b) => a - b);
  if (JSON.stringify(expected) !== JSON.stringify(got)) throw new Error(`sub_results index 불일치: ${got} vs ${expected}`);
  const allOk = answer.sub_results.every((s) => ['CORRECT_ANSWER', 'CORRECT_DECLINE'].includes(s.outcome));
  if ((answer.accuracy === 'CORRECT') !== allOk) throw new Error('accuracy와 sub_results가 맞지 않음');
  if (answer.is_grounded !== (answer.grounding_score >= 4)) throw new Error('is_grounded와 grounding_score가 맞지 않음');
  if (!answer.is_grounded && !answer.hallucinated_claims.length) throw new Error('근거 이탈인데 hallucinated_claims가 비어 있음');
  return answer;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.confirm) throw new Error('저장된 답변을 외부 Judge(Codex)로 전송합니다. 승인 후 --confirm-external을 붙이세요.');
  const rubric = loadRubric();
  const rubricSha = sha256(rubric);
  const faqs = loadFaqs();
  const tryDir = path.join(ROOT, args.testName, args.tryName);
  const batchDir = path.join(tryDir, 'results', 'llm_judge', args.batch);
  const outDir = path.join(batchDir, 'runs');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(batchDir, 'manifest.json'), JSON.stringify({
    batch: args.batch, kind: KIND, rubric_version: RUBRIC_VERSION, rubric_sha256: rubricSha,
    judge: { provider: JUDGE.provider, model: JUDGE.model, reasoning_effort: JUDGE.reasoningEffort },
    runs: args.runs, test: args.testName, try: args.tryName, store_only: args.storeOnly, created_at: new Date().toISOString(),
  }, null, 2) + '\n');

  const jobs = [];
  for (const runId of args.runs) {
    const results = readJsonl(path.join(tryDir, 'results', 'raw', runId, 'results.jsonl'));
    if (!results.length) throw new Error(`results.jsonl이 없습니다: ${runId} (러너 --merge-only로 먼저 병합)`);
    const outPath = path.join(batchDir, `${runId}.judgments.jsonl`);
    const done = new Set(readJsonl(outPath).filter((r) => !r.error && r.rubric_sha256 === rubricSha).map((r) => `${r.id}:${r.user_text_sha256}`));
    for (const result of results) {
      if (args.ids && !args.ids.has(result.id)) continue;
      if (args.storeOnly && !usesStoreTool(result)) continue;
      const reason = unscoredReason(result);
      if (reason) continue;
      const userText = buildUserText(result, faqs);
      const job = { id: result.id, run_id: runId, user_text: userText, user_text_sha256: sha256(userText), outPath, result };
      if (!done.has(`${job.id}:${job.user_text_sha256}`)) jobs.push(job);
    }
  }
  const pending = args.limit ? jobs.slice(0, args.limit) : jobs;
  console.log(`판정 대상 ${pending.length}건 (batch=${args.batch}, concurrency=${args.concurrency})`);

  let next = 0, finished = 0, consecutiveFailures = 0, stop = null;
  const worker = async () => {
    while (!stop && next < pending.length) {
      const job = pending[next++];
      const base = { id: job.id, run_id: job.run_id, type: job.result.type, batch: args.batch, kind: KIND,
        rubric_version: RUBRIC_VERSION, rubric_sha256: rubricSha, judge_model: JUDGE.model,
        judge_reasoning_effort: JUDGE.reasoningEffort, user_text_sha256: job.user_text_sha256 };
      let ok = false;
      for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
        try {
          const res = await codex.invoke({ job, kind: KIND, systemPrompt: rubric, schema: SCHEMA, attempt, outDir,
            judgeCfg: JUDGE, root: ROOT });
          const answer = validate(codex.parseAnswer(res.text), job.result);
          fs.appendFileSync(job.outPath, JSON.stringify({ ...base, ...answer, judged_at: new Date().toISOString(),
            judge_latency_ms: res.latency_ms, judge_usage: res.usage, call_log: res.call_log, error: null }) + '\n');
          ok = true;
          consecutiveFailures = 0;
        } catch (error) {
          fs.appendFileSync(job.outPath, JSON.stringify({ ...base, attempt, judged_at: new Date().toISOString(),
            error: String(error.message).slice(0, 1500) }) + '\n');
          console.error(`${job.run_id}/${job.id} 시도 ${attempt} 실패: ${String(error.message).slice(0, 200)}`);
        }
      }
      finished += 1;
      if (finished % 20 === 0 || finished === pending.length) console.log(`${finished}/${pending.length}`);
      if (!ok && ++consecutiveFailures >= 5) stop = new Error('Judge가 연속으로 실패해 멈췄습니다. 성공한 판정은 보존됩니다.');
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(args.concurrency, 8)) }, worker));
  if (stop) throw stop;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = { unscoredReason, buildUserText, SCHEMA, RUBRIC_VERSION };
