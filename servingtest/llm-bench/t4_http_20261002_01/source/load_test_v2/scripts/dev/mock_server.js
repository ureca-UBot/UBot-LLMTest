'use strict';

// This is an HTTP fixture, not an inference engine. It never loads weights,
// invokes GPU tools, downloads artifacts, or forwards a request elsewhere.
const http = require('node:http');

const ENGINES = ['ollama', 'llama.cpp', 'vllm', 'sglang'];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseArgs(argv) {
  const flags = {};
  const allowed = new Set(['port', 'engine', 'model', 'engine-version', 'internal-limit', 'context', 'upstream-repository', 'upstream-revision', 'delay-ms']);
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index]?.replace(/^--/, '');
    if (!argv[index]?.startsWith('--') || !allowed.has(name) || Object.hasOwn(flags, name) || argv[index + 1] === undefined) throw new Error(`Invalid mock flag: ${argv[index]}`);
    flags[name] = argv[index + 1];
  }
  return {
    port: Number(flags.port), engine: flags.engine, model: flags.model,
    engineVersion: flags['engine-version'] || 'mock-1.0',
    internalLimit: Number(flags['internal-limit'] || 4), context: Number(flags.context || 4096),
    upstreamRepository: flags['upstream-repository'] || 'Qwen/Qwen3-4B',
    upstreamRevision: flags['upstream-revision'] || 'mock-upstream-qwen3-4b',
    delayMs: Number(flags['delay-ms'] || 12),
  };
}

function knownId(messages) {
  for (const message of messages) {
    if (message.role !== 'user') continue;
    let source = message.content;
    const start = source.indexOf('[참고 자료]');
    if (start >= 0) {
      source = source.slice(start + '[참고 자료]'.length);
      const ends = ['[사용자 정보 / API 결과]', '[사용자 질문]'].map((label) => source.indexOf(label)).filter((index) => index >= 0);
      if (ends.length) source = source.slice(0, Math.min(...ends));
    }
    const match = /\[([A-Za-z][A-Za-z0-9]*(?:[-_][A-Za-z0-9]+)+)\]/.exec(source);
    if (match) return match[1];
  }
  return null;
}

async function startMockServer(options) {
  const {
    port = 0, engine = 'vllm', model = 'mock-qwen3-4b', engineVersion = 'mock-1.0',
    internalLimit = 4, context = 4096, upstreamRepository = 'Qwen/Qwen3-4B',
    upstreamRevision = 'mock-upstream-qwen3-4b', delayMs = 12,
  } = options || {};
  if (!ENGINES.includes(engine) || !Number.isSafeInteger(port) || port < 0 || port > 65535
    || !Number.isSafeInteger(internalLimit) || internalLimit < 1 || internalLimit > 256
    || !Number.isSafeInteger(context) || context < 1 || !Number.isFinite(delayMs) || delayMs < 1 || delayMs > 30000
    || !model || !engineVersion || !upstreamRepository || !upstreamRevision) throw new Error('Invalid mock-server options');
  const state = { active: 0, waiting: [], requests: 0, completed: 0, closing: false };
  const sockets = new Set();
  const json = (res, value, status = 200) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(value));
  };

  async function execute(job) {
    if (job.res.destroyed || state.closing) return;
    state.active += 1;
    const { res, body } = job;
    try {
      const id = knownId(body.messages);
      const output = JSON.stringify({ status: 'ANSWER', answer: '모의 서버의 출력 계약 검증용 응답입니다.' + (id ? ` [${id}]` : ''), evidence_ids: id ? [id] : [] });
      const native = job.path === '/api/chat';
      res.writeHead(200, { 'Content-Type': native ? 'application/x-ndjson; charset=utf-8' : 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache' });
      const pieces = [output.slice(0, 23), output.slice(23, 49), output.slice(49)];
      for (const piece of pieces) {
        await sleep(delayMs / pieces.length);
        if (res.destroyed || state.closing) return;
        if (native) res.write(JSON.stringify({ mock: true, model, message: { role: 'assistant', content: piece }, done: false }) + '\n');
        else res.write('data: ' + JSON.stringify({ mock: true, id: `mock-${job.id}`, object: 'chat.completion.chunk', model,
          choices: [{ index: 0, delta: { content: piece }, finish_reason: null }] }) + '\n\n');
      }
      // Counts are synthetic fixtures, never measurements from a tokenizer.
      if (native) res.end(JSON.stringify({ mock: true, model, message: { role: 'assistant', content: '' }, done: true, done_reason: 'stop', prompt_eval_count: 101, eval_count: 27 }) + '\n');
      else res.end('data: ' + JSON.stringify({ mock: true, choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] }) + '\n\n'
        + 'data: ' + JSON.stringify({ mock: true, choices: [], usage: { prompt_tokens: 101, completion_tokens: 27 } }) + '\n\n'
        + 'data: [DONE]\n\n');
      state.completed += 1;
    } finally {
      state.active -= 1;
      pump();
    }
  }

  function pump() {
    while (!state.closing && state.active < internalLimit && state.waiting.length) {
      const job = state.waiting.shift();
      if (!job.res.destroyed) execute(job).catch((error) => job.res.destroy(error));
    }
  }

  const server = http.createServer(async (req, res) => {
    const route = req.url.split('?')[0];
    if (req.method === 'GET') {
      if (route === '/benchmark/runtime') return json(res, {
        mock: true, engine, engine_version: engineVersion, api_model: model, internal_limit: internalLimit,
        context_per_request: context, upstream_repository: upstreamRepository, upstream_revision: upstreamRevision,
        fully_on_gpu: true, evidence_source: 'mock_fixture', observed_at: new Date().toISOString(),
        limitation: 'Synthetic attestation; no GPU or actual inference model exists in this fixture.',
      });
      if (route === '/api/tags') return json(res, { mock: true, models: [{ name: model, model, digest: 'mock-digest', size: 128 }] });
      if (route === '/api/ps') return json(res, { mock: true, models: [{ name: model, model, size: 128, size_vram: 128, context_length: context, digest: 'mock-digest' }] });
      if (route === '/api/version') return json(res, { mock: true, version: engineVersion });
      if (route === '/v1/models') return json(res, { mock: true, object: 'list', data: [{ id: model, object: 'model', owned_by: 'mock_fixture' }] });
      if (route === '/health') return json(res, { mock: true, status: 'ready' });
      if (route === '/metrics') {
        const gauges = {
          'llama.cpp': ['llamacpp:requests_processing', 'llamacpp:requests_deferred'],
          vllm: ['vllm:num_requests_running', 'vllm:num_requests_waiting'],
          sglang: ['sglang:num_running_reqs', 'sglang:num_queue_reqs'],
          ollama: ['mock:num_requests_running', 'mock:num_requests_waiting'],
        }[engine];
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end(`# MOCK FIXTURE; no GPU measurements\n${gauges[0]} ${state.active}\n${gauges[1]} ${state.waiting.length}\nmock:requests_total ${state.requests}\n`);
      }
      return json(res, { mock: true, error: 'Not found' }, 404);
    }
    if (req.method !== 'POST' || !['/api/chat', '/v1/chat/completions'].includes(route)) return json(res, { mock: true, error: 'Not found' }, 404);
    try {
      const buffers = [];
      let size = 0;
      for await (const buffer of req) {
        size += buffer.length;
        if (size > 2 * 1024 * 1024) return json(res, { mock: true, error: 'Request too large' }, 413);
        buffers.push(buffer);
      }
      const body = JSON.parse(Buffer.concat(buffers).toString('utf8'));
      if (body.model !== model || body.stream !== true || !Array.isArray(body.messages) || body.messages.some((message) => !message || typeof message.content !== 'string')) {
        return json(res, { mock: true, error: 'Fixture requires matching model, messages, and stream:true' }, 400);
      }
      state.requests += 1;
      const job = { res, body, path: route, id: state.requests };
      state.waiting.push(job);
      res.once('close', () => {
        const index = state.waiting.indexOf(job);
        if (index >= 0) state.waiting.splice(index, 1);
      });
      pump();
    } catch (error) {
      if (!res.headersSent && !res.destroyed) json(res, { mock: true, error: error.message }, 400);
      else res.destroy(error);
    }
  });
  server.on('connection', (socket) => { sockets.add(socket); socket.once('close', () => sockets.delete(socket)); });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => { server.removeListener('error', reject); resolve(); });
  });
  let stopping;
  const close = () => stopping ||= new Promise((resolve) => {
    state.closing = true;
    state.waiting.length = 0;
    server.close(resolve);
    for (const socket of sockets) socket.destroy();
  });
  return { server, state, close, host: `http://127.0.0.1:${server.address().port}` };
}

if (require.main === module) {
  startMockServer(parseArgs(process.argv.slice(2))).then((fixture) => {
    console.log(JSON.stringify({ mock: true, event: 'ready', host: fixture.host }));
    const stop = () => fixture.close().then(() => process.exit(0));
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  }).catch((error) => { console.error(error.message); process.exitCode = 1; });
}

module.exports = { startMockServer, parseArgs };
