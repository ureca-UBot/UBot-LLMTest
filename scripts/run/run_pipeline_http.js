'use strict';
// pipeline_test_v1 HTTP 러너. 실행 중인 백엔드(SPRING_PROFILES_ACTIVE=local,eval)에 케이스를 실제 채팅 API로 보낸다.
//
//   1. 평가용 회원으로 로그인한다(--signup이면 없을 때 가입). 토큰이 만료되면 다시 로그인한다.
//   2. 케이스마다 새 대화를 연다. MT 케이스는 turns를 같은 대화에서 먼저 보내 답변까지 기다린다.
//   3. POST /chat/questions → GET /chat/jobs/{jobId}를 SUCCEEDED·FAILED가 될 때까지 폴링한다.
//   4. 케이스 결과를 responses.jsonl에 한 줄씩 덧붙인다(중간에 끊겨도 다시 실행하면 끝난 케이스는 건너뜀).
//   5. 끝나면 백엔드 trace 파일(eval.trace.path)을 idempotency_key로 맞춰 results.jsonl을 만든다.
//
// Usage: node scripts/run/run_pipeline_http.js --run-id <id> --mode single|sub|subp [--test pipeline_test_v1] [--try try1] [--base-url http://localhost:8081]
//          [--ids SA-001,MP-003] [--types SA,MP] [--limit N] [--concurrency 1] [--signup]
//          [--trace ../BackEnd/build/eval/trace.jsonl] [--backend-dir ../BackEnd] [--merge-only]
//   계정: EVAL_EMAIL·EVAL_PASSWORD 환경변수(없으면 기본값). --merge-only는 질문을 보내지 않고 5번만 다시 한다.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
// 케이스셋은 pipeline_test_v1/cases를 모든 회차가 같이 쓴다. 결과는 --test 폴더(기본 pipeline_test_v1)에 쓴다.
// PIPELINE_CASES로 다른 케이스셋(예: 라벨을 바꾼 pipeline_test_v6/cases/cases.jsonl)을 쓸 수 있다.
const CASES_PATH = process.env.PIPELINE_CASES
  ? path.resolve(process.env.PIPELINE_CASES)
  : path.join(ROOT, 'pipeline_test_v1', 'cases', 'cases.jsonl');

const ACCOUNT = {
  email: process.env.EVAL_EMAIL || 'eval-runner@ubot.test',
  password: process.env.EVAL_PASSWORD || 'UbotEval!2026',
  // 사용자 정보로 답변 LLM에 들어가는 값. UD 케이스(가입일·거주 지역)의 정답 기준이다.
  name: '평가회원',
  birthDate: '1990-01-01',
  gender: 'FEMALE',
  residenceArea: '서울특별시 마포구',
};
const TERMINAL = new Set(['SUCCEEDED', 'FAILED']);

function parseArgs(argv) {
  const args = {
    baseUrl: 'http://localhost:8081', testName: 'pipeline_test_v1', tryName: 'try1', runId: null, ids: null, types: null, limit: null,
    concurrency: 1, signup: false, mergeOnly: false, pollMs: 1500, jobTimeoutMs: 240000,
    mode: null, trace: null,
    backendDir: path.join(ROOT, '..', 'BackEnd'),
  };
  for (let i = 0; i < argv.length; i++) {
    const value = () => argv[++i];
    switch (argv[i]) {
      case '--base-url': args.baseUrl = value().replace(/\/$/, ''); break;
      case '--test': args.testName = value(); break;
      case '--try': args.tryName = value(); break;
      case '--run-id': args.runId = value(); break;
      case '--ids': args.ids = new Set(value().split(',')); break;
      case '--types': args.types = new Set(value().split(',')); break;
      case '--limit': args.limit = Number(value()); break;
      case '--concurrency': args.concurrency = Number(value()); break;
      case '--signup': args.signup = true; break;
      case '--merge-only': args.mergeOnly = true; break;
      case '--poll-ms': args.pollMs = Number(value()); break;
      case '--job-timeout-ms': args.jobTimeoutMs = Number(value()); break;
      case '--trace': args.trace = path.resolve(value()); break;
      case '--backend-dir': args.backendDir = path.resolve(value()); break;
      case '--mode': args.mode = value(); break;
      default: throw new Error(`알 수 없는 인자: ${argv[i]}`);
    }
  }
  if (!args.runId) throw new Error('--run-id가 필요합니다. 예: local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020');
  if (!['single', 'sub', 'subp', 'slot'].includes(args.mode)) throw new Error('--mode single|sub|subp|slot이 필요합니다(백엔드 PROMPT_FAQ_STATUS_MODE와 같게).');
  // tools/eval/start-eval-backend.ps1이 모드마다 trace 파일을 나눠 쓴다.
  args.trace = args.trace || path.join(args.backendDir, 'build', 'eval', `trace_${args.mode}.jsonl`);
  return args;
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((line) => line.trim()).map((line) => JSON.parse(line));
}

function sha256File(file) {
  return fs.existsSync(file) ? crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') : null;
}

function git(dir, ...gitArgs) {
  try {
    return execFileSync('git', ['-C', dir, ...gitArgs], { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class Client {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.token = null;
  }

  async request(method, url, body, { auth = true, retryAuth = true } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth && this.token) headers.Authorization = `Bearer ${this.token}`;
    const response = await fetch(this.baseUrl + url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const text = await response.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
    if (response.status === 401 && auth && retryAuth) {
      await this.login();
      return this.request(method, url, body, { auth, retryAuth: false });
    }
    return { status: response.status, body: json };
  }

  async login() {
    const res = await this.request('POST', '/auth/login', { email: ACCOUNT.email, password: ACCOUNT.password }, { auth: false });
    if (res.status !== 200 || !res.body?.data?.accessToken) {
      throw new Error(`로그인 실패(${res.status}): ${JSON.stringify(res.body)} — 처음이면 --signup을 붙이세요`);
    }
    this.token = res.body.data.accessToken;
  }

  async signupIfMissing() {
    const res = await this.request('POST', '/auth/signup', { ...ACCOUNT, passwordConfirm: ACCOUNT.password }, { auth: false });
    if (res.status >= 300) console.warn(`회원 가입 응답 ${res.status}(이미 있으면 무시): ${JSON.stringify(res.body)}`);
  }

  async ask(question, conversationId, location, pollMs, timeoutMs) {
    const startedAt = Date.now();
    const body = { question, conversationId };
    if (location) Object.assign(body, { latitude: location.latitude, longitude: location.longitude, useMyLocation: true });
    const submitted = await this.request('POST', '/chat/questions', body);
    if (submitted.status !== 202) {
      return { question, http_status: submitted.status, error_code: submitted.body?.code ?? null,
        error_message: submitted.body?.message ?? null, elapsed_ms: Date.now() - startedAt };
    }
    const job = submitted.body.data;
    let last = null;
    while (Date.now() - startedAt < timeoutMs) {
      await sleep(pollMs);
      const polled = await this.request('GET', `/chat/jobs/${job.jobId}`);
      last = polled.body?.data;
      if (last && TERMINAL.has(last.status)) break;
    }
    return {
      question,
      job_id: job.jobId,
      idempotency_key: job.idempotencyKey,
      conversation_id: job.conversationId,
      status: last?.status ?? null,
      answer: last?.answer ?? null,
      store: last?.store ?? null,
      error_code: last?.errorCode ?? null,
      error_message: last?.errorMessage ?? null,
      timed_out: !last || !TERMINAL.has(last.status),
      elapsed_ms: Date.now() - startedAt,
    };
  }
}

async function runCase(client, testCase, args) {
  const record = { case_id: testCase.id, type: testCase.type, started_at: new Date().toISOString(), turns: [], final: null, error: null };
  try {
    let conversationId = null;
    for (const turn of testCase.turns) {
      const result = await client.ask(turn, conversationId, null, args.pollMs, args.jobTimeoutMs);
      record.turns.push(result);
      conversationId = result.conversation_id ?? conversationId;
    }
    record.final = await client.ask(testCase.question, conversationId, testCase.location, args.pollMs, args.jobTimeoutMs);
  } catch (error) {
    record.error = String(error?.stack || error);
  }
  return record;
}

function mergeTraces(runDir, args, cases) {
  const responses = readJsonl(path.join(runDir, 'responses.jsonl'));
  const traces = new Map(readJsonl(args.trace).map((trace) => [trace.idempotency_key, trace]));
  const byId = new Map(cases.map((c) => [c.id, c]));
  const matched = [];
  const merged = responses.map((response) => {
    const key = response.final?.idempotency_key;
    const trace = key ? traces.get(key) ?? null : null;
    if (trace) matched.push(trace);
    const turnTraces = response.turns.map((turn) => traces.get(turn.idempotency_key) ?? null);
    turnTraces.filter(Boolean).forEach((t) => matched.push(t));
    return { ...byId.get(response.case_id), response, trace, turn_traces: turnTraces };
  });
  fs.writeFileSync(path.join(runDir, 'trace.jsonl'), matched.map((t) => JSON.stringify(t)).join('\n') + (matched.length ? '\n' : ''), 'utf8');
  fs.writeFileSync(path.join(runDir, 'results.jsonl'), merged.map((m) => JSON.stringify(m)).join('\n') + '\n', 'utf8');
  const missing = merged.filter((m) => m.response.final?.idempotency_key && !m.trace).map((m) => m.id);
  console.log(`병합: 결과 ${merged.length}건, trace 없음 ${missing.length}건${missing.length ? ` (${missing.slice(0, 10).join(', ')}…)` : ''}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runDir = path.join(ROOT, args.testName, args.tryName, 'results', 'raw', args.runId);
  fs.mkdirSync(runDir, { recursive: true });
  const cases = readJsonl(CASES_PATH);
  if (args.mergeOnly) {
    mergeTraces(runDir, args, cases);
    return;
  }

  let selected = cases.filter((c) => (!args.ids || args.ids.has(c.id)) && (!args.types || args.types.has(c.type)));
  if (args.limit) selected = selected.slice(0, args.limit);
  const responsesPath = path.join(runDir, 'responses.jsonl');
  const done = new Set(readJsonl(responsesPath).filter((r) => !r.error).map((r) => r.case_id));
  const pending = selected.filter((c) => !done.has(c.id));

  const runInfoPath = path.join(runDir, 'run_info.json');
  const runInfo = fs.existsSync(runInfoPath) ? JSON.parse(fs.readFileSync(runInfoPath, 'utf8')) : {
    run_id: args.runId,
    status_mode: args.mode,
    started_at: new Date().toISOString(),
    base_url: args.baseUrl,
    account: { email: ACCOUNT.email, name: ACCOUNT.name, residence_area: ACCOUNT.residenceArea },
    cases_sha256: sha256File(CASES_PATH),
    backend: {
      dir: args.backendDir,
      branch: git(args.backendDir, 'rev-parse', '--abbrev-ref', 'HEAD'),
      commit: git(args.backendDir, 'rev-parse', 'HEAD'),
      dirty: Boolean(git(args.backendDir, 'status', '--porcelain')),
      faq_system_sha256: sha256File(path.join(args.backendDir, 'src/main/resources/prompts/faq-system.txt')),
      faq_system_sub_sha256: sha256File(path.join(args.backendDir, 'src/main/resources/prompts/faq-system-sub.txt')),
      faq_system_subp_sha256: sha256File(path.join(args.backendDir, 'src/main/resources/prompts/faq-system-subp.txt')),
      faq_system_slot_sha256: sha256File(path.join(args.backendDir, 'src/main/resources/prompts/faq-system-slot.txt')),
      sub_question_system_sha256: sha256File(path.join(args.backendDir, 'src/main/resources/prompts/sub-question-system.txt')),
    },
    trace_path: args.trace,
    selection: { ids: args.ids ? [...args.ids] : null, types: args.types ? [...args.types] : null, limit: args.limit },
    concurrency: args.concurrency,
  };
  fs.writeFileSync(runInfoPath, JSON.stringify(runInfo, null, 2) + '\n', 'utf8');
  console.log(`대상 ${selected.length}건 중 남은 ${pending.length}건 실행 → ${runDir}`);

  const client = new Client(args.baseUrl);
  if (args.signup) await client.signupIfMissing();
  await client.login();

  let next = 0;
  let finished = 0;
  const worker = async () => {
    while (next < pending.length) {
      const testCase = pending[next++];
      const record = await runCase(client, testCase, args);
      fs.appendFileSync(responsesPath, JSON.stringify(record) + '\n', 'utf8');
      finished += 1;
      const f = record.final;
      console.log(`[${finished}/${pending.length}] ${testCase.id} ${record.error ? 'ERROR' : f?.status ?? f?.http_status}`
        + `${f?.error_code ? ` ${f.error_code}` : ''} ${f?.elapsed_ms ?? '-'}ms`);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, args.concurrency) }, worker));

  runInfo.finished_at = new Date().toISOString();
  fs.writeFileSync(runInfoPath, JSON.stringify(runInfo, null, 2) + '\n', 'utf8');
  mergeTraces(runDir, args, cases);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
