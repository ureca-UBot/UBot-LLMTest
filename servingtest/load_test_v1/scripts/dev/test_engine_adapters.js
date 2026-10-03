'use strict';
// 실제 서버·GPU를 사용하지 않는 프로토콜/프로세스 소유권/조합 전환 검증.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { EventEmitter } = require('events');
const { loadConfig } = require('../config/load_config');
const { launchSpec, validate, apiModelName } = require('../lib/engine_config');
const { OpenAiServer } = require('../lib/openai_server');
const { runMatrix, deploymentModel } = require('../run_engines');
const { summarizeRecords } = require('../lib/stats');
const { parseMetrics } = require('../lib/engine_metrics');
const { run } = require('../lib/ollama_admin');

test('command environment is inherited and overridden only in the child', async () => {
  const key = 'LLM_ENGINE_RUNTIME_TEST';
  const before = process.env[key];
  const result = await run(process.execPath, ['-e', `process.stdout.write(process.env.${key})`], {
    env: { [key]: 'engine-only' }, timeoutMs: 5000,
  });
  assert.equal(result.code, 0);
  assert.equal(result.out, 'engine-only');
  assert.equal(process.env[key], before);
});

test('runtime CLI inspection receives the same CUDA environment as server launch', async () => {
  const deployment = { ...entry('sglang'), env: { CUDA_HOME: '/fixture/cuda' } };
  const spec = launchSpec(deployment, { parallel: 2, numCtx: 4096 });
  const inspected = [];
  const server = new OpenAiServer({ entry: deployment, logDir: '.' }, {
    run: async (_cmd, args, options) => {
      inspected.push(options.env);
      assert.equal(options.env.CUDA_HOME, '/fixture/cuda');
      assert.equal(options.env.HF_HUB_OFFLINE, '1');
      return { code: 0, err: '', out: args.includes('--help') ? spec.args.join(' ') : deployment.version };
    },
  });
  await server.checkRuntime(spec);
  assert.equal(inspected.length, 2);
});

test('legacy SGLang can retain engine startup warmup and records that difference', () => {
  const deployment = { ...entry('sglang'), skip_server_warmup: false };
  validate(deployment);
  const legacy = launchSpec(deployment, { parallel: 2, numCtx: 4096 });
  assert.equal(legacy.args.includes('--skip-server-warmup'), false);
  assert.equal(legacy.server_warmup_disabled, false);
  const current = launchSpec(entry('sglang'), { parallel: 2, numCtx: 4096 });
  assert.equal(current.args.includes('--skip-server-warmup'), true);
  assert.equal(current.server_warmup_disabled, true);
  assert.throws(() => validate({ ...deployment, skip_server_warmup: 'false' }), /true\/false/);
});

test('automation lease blocks unrelated manual restart and allows only the managed child', () => {
  const file = path.join(__dirname, '../lib/automation_guard.js');
  let exists = true, alive = true, token = '';
  const module = { exports: {} };
  const localRequire = (name) => name === 'fs' ? {
    existsSync: () => exists,
    readFileSync: () => JSON.stringify({ pid: 1234, token: 'owner-token' }),
  } : require(name);
  const fakeProcess = { env: {}, kill() { if (!alive) throw Object.assign(new Error(), { code: 'ESRCH' }); } };
  new Function('require', 'module', '__dirname', 'process', fs.readFileSync(file, 'utf8'))(
    localRequire, module, path.dirname(file), fakeProcess);
  assert.throws(() => module.exports.assertAutomationLease(), /잠금/);
  fakeProcess.env.LLM_T4_LEASE = 'owner-token';
  assert.doesNotThrow(() => module.exports.assertAutomationLease());
  alive = false;
  assert.throws(() => module.exports.assertAutomationLease(), /잠금/);
  exists = false;
  assert.doesNotThrow(() => module.exports.assertAutomationLease());
});

function clientWith(events, options = {}) {
  const file = path.join(__dirname, '../lib/openai_stream_client.js');
  const mod = { exports: {} };
  const fakeHttp = { request(_opts, callback) {
    const req = new EventEmitter(); req.destroy = () => {};
    req.end = (payload) => {
      options.body = JSON.parse(payload);
      queueMicrotask(() => {
        const res = new EventEmitter(); res.statusCode = options.status || 200; res.setEncoding = () => {};
        callback(res);
        for (const text of events) res.emit('data', text);
        res.emit(options.abort ? 'aborted' : 'end');
      });
    };
    return req;
  } };
  const localRequire = (name) => name === './http_client'
    ? { libFor: () => fakeHttp, getAgent: () => null, errText: (e) => e.message }
    : name.startsWith('.') ? require(path.resolve(path.dirname(file), name)) : require(name);
  new Function('require', 'module', 'exports', fs.readFileSync(file, 'utf8'))(localRequire, mod, mod.exports);
  return mod.exports;
}

const messages = [{ role: 'system', content: '지시' }, { role: 'user', content: '질문' }];
const generation = loadConfig('quick').generation;
const request = { host: 'http://127.0.0.1:12345', model: 'qwen3:4b', messages, generation, think: false, timeoutMs: 100 };
const data = (obj) => `data: ${JSON.stringify(obj)}\r\n\r\n`;

test('sequential native streams survive a server closing each connection without retries', async () => {
  const http = require('http');
  const { streamChat } = require('../lib/openai_stream_client');
  const sockets = new Set();
  let calls = 0;
  const server = http.createServer((req, res) => {
    calls++; sockets.add(req.socket);
    req.resume();
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', Connection: 'close' });
      res.end(data({ choices: [{ delta: { content: '{}' }, finish_reason: 'stop' }] })
        + 'data: [DONE]\n\n');
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    for (let i = 0; i < 6; i++) {
      const response = await streamChat({ ...request,
        host: `http://127.0.0.1:${server.address().port}`, timeoutMs: 2000 });
      assert.equal(response.ok, true);
      assert.equal(response.content, '{}');
      assert.equal(response.http_keep_alive, false);
      assert.equal(response.socket_reused, false);
    }
    assert.equal(calls, 6); // A failed request must never be hidden by automatic retry.
    assert.equal(sockets.size, 6);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});

test('split SSE/CRLF, usage-only event, answer preservation and fixed limits', async () => {
  const events = ':keepalive\r\n\r\n' + data({ choices: [{ index: 0, delta: { role: 'assistant' } }] })
    + data({ choices: [{ index: 0, delta: { content: '답' } }] })
    + data({ choices: [{ index: 0, delta: { content: '변' }, finish_reason: 'length' }] })
    + data({ choices: [], usage: { prompt_tokens: 50, completion_tokens: 2 } }) + 'data: [DONE]\r\n\r\n';
  const options = {};
  const client = clientWith([...events], options); // UTF-8 decoding is provided by HTTP setEncoding.
  const response = await client.streamChat(request);
  assert.equal(response.ok, true); assert.equal(response.content, '답변');
  assert.equal(response.eval_count, 2); assert.equal(response.prompt_eval_count, 50);
  assert.equal(response.done_reason, 'length'); assert.equal(response.chunks, 2);
  assert.ok(response.tpot_ms >= 0); assert.ok(response.user_tok_s > 0);
  assert.equal(options.body.max_tokens, 512); assert.equal(options.body.temperature, 0);
  assert.equal(options.body.chat_template_kwargs.enable_thinking, false);
});

test('partial, malformed, HTTP errors and thinking leak do not become successful requests', async () => {
  const piece = data({ choices: [{ index: 0, delta: { content: '부분 답변' } }] });
  const broken = await clientWith([piece], { abort: true }).streamChat(request);
  assert.equal(broken.ok, false); assert.equal(broken.content, '부분 답변');
  const noFinal = await clientWith([piece, 'data: [DONE]\n\n']).streamChat(request);
  assert.equal(noFinal.error_type, 'incomplete_stream');
  const malformed = await clientWith(['data: {broken}\n\n']).streamChat(request);
  assert.equal(malformed.error_type, 'stream_parse');
  const rejected = await clientWith(['queue full'], { status: 503 }).streamChat(request);
  assert.equal(rejected.error_type, 'http_503');
  const thinking = await clientWith([data({ choices: [{ delta: { reasoning_content: '숨은 추론' }, finish_reason: 'stop' }] }),
    'data: [DONE]\n\n']).streamChat(request);
  assert.equal(thinking.error_type, 'thinking_not_disabled');
});

test('Gemma system role merge retains content and missing usage is null', async () => {
  const options = {};
  const response = await clientWith([data({ choices: [{ delta: { content: '{}' }, finish_reason: 'stop' }] }),
    'data: [DONE]\n\n'], options).streamChat({ ...request, think: undefined, mergeSystem: true });
  assert.equal(options.body.messages.length, 1); assert.equal(options.body.messages[0].content, '지시\n\n질문');
  assert.equal(Object.hasOwn(options.body, 'chat_template_kwargs'), false);
  assert.equal(messages[0].role, 'system');
  const summary = summarizeRecords([{ ...response, in_window: true, t_end_rel: 10 }], { startMs: 0, endMs: 20 });
  assert.equal(summary.tok_s, null); assert.equal(summary.token_usage_requests, 0);
});

function entry(engine = 'llama.cpp') {
  return { engine, model: 'qwen3:4b', enabled: true, command: engine === 'llama.cpp' ? ['fixture-server']
    : ['fixture-python', '-m', engine === 'vllm' ? 'vllm.entrypoints.openai.api_server' : 'sglang.launch_server'],
    model_path: '/fixture/model', version: 'fixture-version', revision: 'fixture-revision',
    weight_format: 'fixture', quantization: 'none', port: 12345 };
}

test('Python GGUF uses local tokenizer and backend name while preserving actual weight quantization', () => {
  for (const engine of ['vllm', 'sglang']) {
    const deployment = { ...entry(engine), model_path: '/fixture/model.gguf', weight_format: 'GGUF',
      quantization: 'Q4_K_M', tokenizer_path: '/fixture/tokenizer' };
    validate(deployment);
    const spec = launchSpec(deployment, { parallel: 2, numCtx: 4096 });
    assert.equal(spec.args[spec.args.indexOf('--quantization') + 1], 'gguf');
    assert.equal(spec.args[spec.args.indexOf('--load-format') + 1], 'gguf');
    const flag = engine === 'vllm' ? '--tokenizer' : '--tokenizer-path';
    assert.equal(spec.args[spec.args.indexOf(flag) + 1], deployment.tokenizer_path);
    assert.equal(deployment.quantization, 'Q4_K_M');
    assert.throws(() => validate({ ...deployment, tokenizer_path: undefined }), /tokenizer_path/);
    assert.throws(() => validate({ ...deployment, tokenizer_path: 'remote/model' }), /tokenizer_path/);
    for (const reserved of ['--model-weights', '--load-format', '--quantization', '--tokenizer']) {
      assert.throws(() => validate({ ...deployment, extra_args: [reserved, 'override'] }), /extra_args/);
    }
  }
});

test('SGLang uses a colon-free API alias and readiness checks that alias', async () => {
  const deployment = entry('sglang');
  const spec = launchSpec(deployment, { parallel: 2, numCtx: 4096 });
  assert.equal(apiModelName(deployment), 'qwen3-4b');
  assert.equal(spec.args[spec.args.indexOf('--served-model-name') + 1], 'qwen3-4b');
  assert.equal(deployment.model, 'qwen3:4b');
  const server = new OpenAiServer({ entry: deployment, logDir: os.tmpdir() }, {
    requestJson: async (_method, route) => ({ ok: true, json: route === '/v1/models' ? { data: [{ id: 'qwen3-4b' }] } : {} }),
  });
  assert.equal(await server.isUp(), true);
});

test('each launch uses correct per-request context and its own concurrency limit', () => {
  const llama = launchSpec(entry(), { parallel: 4, numCtx: 4096 });
  assert.equal(llama.args[llama.args.indexOf('--ctx-size') + 1], '16384');
  assert.ok(llama.args.includes('--no-warmup'));
  for (const [engine, flag] of [['vllm', '--max-num-seqs'], ['sglang', '--max-running-requests']]) {
    const deployment = entry(engine); validate(deployment);
    deployment.env = { HF_HUB_OFFLINE: '0', TRANSFORMERS_OFFLINE: '0' };
    const spec = launchSpec(deployment, { parallel: 4, numCtx: 4096 });
    assert.equal(spec.args[spec.args.indexOf(flag) + 1], '4');
    assert.ok(spec.args.includes('4096')); assert.equal(spec.env.CUDA_VISIBLE_DEVICES, '0');
    assert.equal(spec.env.HF_HUB_OFFLINE, '1');
    assert.equal(spec.env.TRANSFORMERS_OFFLINE, '1');
  }
  assert.throws(() => validate({ ...entry(), extra_args: ['--parallel=64'] }), /extra_args/);
  assert.throws(() => validate({ ...entry(), extra_args: ['--n-gpu-layers', '0'] }), /extra_args/);
  const model = loadConfig('full').models[1];
  assert.notEqual(deploymentModel(model, entry()).cond, deploymentModel(model, entry('vllm')).cond);
});

test('cleanup signals only owned process group, verifies GPU/port and blocks residual GPU', async () => {
  let alive = true; const signals = [], commands = [];
  const server = new OpenAiServer({ entry: entry(), logDir: os.tmpdir() }, {
    platform: 'linux', kill: (pid, signal) => {
      signals.push([pid, signal]);
      if (!alive) throw Object.assign(new Error('gone'), { code: 'ESRCH' });
      if (signal === 'SIGTERM') alive = false;
    }, run: async (cmd, args) => { commands.push([cmd, args]); return { code: 0, out: '', err: '' }; },
  });
  server.groupId = 98765; server.portFree = async () => {};
  const result = await server.stop();
  assert.equal(result.gpu_release.known, true); assert.equal(server.groupId, null);
  assert.ok(signals.some(([pid, signal]) => pid === -98765 && signal === 'SIGTERM'));
  assert.ok(signals.every(([pid]) => pid === -98765));
  assert.ok(commands.some(([, args]) => args[0].includes('compute-apps')));
  server.deps.run = async () => ({ code: 0, out: '77, other-engine, 4000', err: '' });
  await assert.rejects(server.gpuIdle(0), { code: 'CLEANUP_FAILED' });
});

test('startup records spawn-to-model-ready time and rejects the wrong advertised model', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'llm-engine-test-'));
  const deployment = { ...entry('vllm'), model_path: __filename };
  const spec = launchSpec(deployment, { parallel: 2, numCtx: 4096 });
  let alive = false, advertised = deployment.model;
  const server = new OpenAiServer({ entry: deployment, logDir: directory }, {
    platform: 'linux', run: async (cmd, args) => ({ code: 0, err: '', out: cmd === 'nvidia-smi' ? ''
      : args.includes('--help') ? spec.args.join(' ') : deployment.version }),
    spawn: () => { alive = true; const child = new EventEmitter(); child.pid = 87654; return child; },
    kill: (_pid, signal) => {
      if (!alive) throw Object.assign(new Error('gone'), { code: 'ESRCH' });
      if (signal === 'SIGTERM') alive = false;
    },
    requestJson: async (_method, endpoint) => ({ ok: true, json: endpoint === '/v1/models' ? { data: [{ id: advertised }] } : {} }),
  });
  server.portFree = async () => {};
  try {
    const applied = await server.apply({ parallel: 2, numCtx: 4096 });
    assert.equal(applied.context_per_request, 4096);
    assert.equal(applied.load_measurement, 'process_spawn_to_model_ready');
    assert.ok(applied.load_ms >= 0); assert.ok(applied.load_started_at && applied.load_ended_at);
    assert.equal(await server.preload(), applied.load_ms);
    advertised = 'other-model'; assert.equal(await server.isUp(), false);
    await server.stop();
  } finally {
    if (server.serveLog && fs.existsSync(server.serveLog)) fs.unlinkSync(server.serveLog);
    fs.rmdirSync(directory);
  }
});

test('matrix executes one combination at a time and never advances after cleanup failure', async () => {
  const events = []; let active = 0;
  const createTest = (_cfg, config) => ({
    stores: [{ has: () => true, get: () => ({ parallel: 2, status: 'done' }) }],
    runAll: async () => { assert.equal(active, 0); active++; events.push(`start:${config.engine}`); },
    server: { stop: async () => { active = 0; events.push(`stop:${config.engine}`); return { gpu_release: { known: true } }; } },
    shutdown: async () => {},
  });
  const configs = [entry(), entry('vllm'), { ...entry('sglang'), enabled: false }];
  const rows = await runMatrix(configs, { profile: 'quick', runDate: '20261001' }, { createTest });
  assert.deepEqual(rows.map((r) => r.status), ['done', 'done', 'unconfigured']);
  assert.deepEqual(events, ['start:llama.cpp', 'stop:llama.cpp', 'start:vllm', 'stop:vllm']);
  events.length = 0;
  await assert.rejects(runMatrix(configs, { profile: 'quick', runDate: '20261001' }, {
    createTest: (cfg, config) => { const test = createTest(cfg, config); test.server.stop = async () => { throw new Error('GPU residual'); }; return test; },
  }), { code: 'CLEANUP_FAILED' });
  assert.deepEqual(events, ['start:llama.cpp']);
});

test('native running/queued gauges keep missing values distinct from zero', () => {
  const metrics = parseMetrics('vllm', '# HELP vllm:num_requests_running help\nvllm:num_requests_running{model="a"} 2\nvllm:num_requests_running{model="b"} 1\nvllm:num_requests_waiting 0\n');
  assert.equal(metrics.running, 3); assert.equal(metrics.queued, 0);
  assert.equal(parseMetrics('sglang', '').queued, null);
});

test('GPU fit does not claim success for a CPU-only or unowned worker', async () => {
  const server = new OpenAiServer({ entry: entry('vllm'), logDir: os.tmpdir() }, {
    run: async () => ({ code: 0, out: '', err: '' }),
  });
  server.pids = async () => [87654];
  assert.equal((await server.fitStatus()).fully_on_gpu, false);
  server.deps.run = async () => ({ code: 0, out: '87654, fixture-worker, 4000', err: '' });
  assert.equal((await server.fitStatus()).fully_on_gpu, true);
  server.deps.run = async () => ({ code: 0, out: '77, other-worker, 4000', err: '' });
  await assert.rejects(server.fitStatus(), { code: 'CLEANUP_FAILED' });
});

test('an optimal setting alone cannot mark failed repeats complete', async () => {
  const rows = await runMatrix([entry()], { profile: 'quick', runDate: '20261001' }, {
    createTest: () => ({ stores: [{ has: () => true, get: (key) => key === 'optimal' ? { parallel: 2 } : { status: 'skipped_warmup_error' } }],
      runAll: async () => {}, server: { stop: async () => ({ gpu_release: { known: true } }) }, shutdown: async () => {} }),
  });
  assert.equal(rows[0].status, 'incomplete');
});
