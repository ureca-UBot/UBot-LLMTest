'use strict';

// All HTTP endpoints and child commands in this file are Node mocks. Docker,
// GPU engines and nvidia-smi are never invoked by these tests.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { EventEmitter } = require('node:events');
const { Runtime } = require('../lib/runtime');
const { Monitor } = require('../lib/monitor');

const FILES = [{ role: 'weight', sha256: 'a'.repeat(64) }, { role: 'tokenizer', sha256: 'b'.repeat(64) },
  { role: 'chat_template', sha256: 'c'.repeat(64) }];
const CONFIG = { generation: { context: 4096 }, comparison: {
  upstream_repository: 'Qwen/Qwen3-4B', upstream_revision: 'd'.repeat(40),
} };

function temp(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'llm-v2-runtime-'));
  t.after(() => {
    const resolved = path.resolve(dir), parent = path.resolve(os.tmpdir());
    assert.equal(path.dirname(resolved), parent);
    assert(path.basename(resolved).startsWith('llm-v2-runtime-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  return dir;
}

async function server(t, handler) {
  const mock = http.createServer(handler);
  mock.listen(0, '127.0.0.1'); await once(mock, 'listening');
  t.after(async () => { mock.closeAllConnections(); await new Promise(resolve => mock.close(resolve)); });
  return `http://127.0.0.1:${mock.address().port}`;
}

function candidate(host, extra = {}) {
  return { id: 'runtime-mock', engine: 'vllm', engine_version: 'test-version', api_model: 'test-model',
    internal_limit: 4, provenance: { files: FILES },
    runtime: { mode: 'external', attestation: { kind: 'http', path: '/attestation' } }, host, ...extra };
}

function evidence(extra = {}) {
  return { engine: 'vllm', engine_version: 'test-version', api_model: 'test-model', internal_limit: 4,
    context_per_request: 4096, ...CONFIG.comparison, fully_on_gpu: true,
    evidence_source: 'node_test', observed_at: new Date().toISOString(), artifact_files: FILES, ...extra };
}

for (const [label, observedAt] of [
  ['invalid', 'not-a-date'], ['stale', () => new Date(Date.now() - 65000).toISOString()],
  ['future', () => new Date(Date.now() + 10000).toISOString()],
]) test(`runtime attestation rejects ${label} observations`, async t => {
  const host = await server(t, (_req, res) => res.end(JSON.stringify(evidence({
    observed_at: typeof observedAt === 'function' ? observedAt() : observedAt,
  }))));
  const runtime = new Runtime(candidate(host), temp(t));
  await assert.rejects(runtime.attest(CONFIG), /시각/);
});

test('runtime attestation verifies current loaded artifact roles and SHA-256', async t => {
  let response = evidence();
  const host = await server(t, (_req, res) => res.end(JSON.stringify(response)));
  const runtime = new Runtime(candidate(host), temp(t));
  assert.equal((await runtime.attest(CONFIG)).verified, true);
  response = evidence({ artifact_files: undefined });
  await assert.rejects(runtime.attest(CONFIG), /artifact_files/);
  response = evidence({ artifact_files: [{ role: 'weight', sha256: 'e'.repeat(64) }, ...FILES.slice(1)] });
  await assert.rejects(runtime.attest(CONFIG), /SHA-256 목록 불일치/);
  response = evidence({ artifact_files: FILES.slice(0, 2) });
  await assert.rejects(runtime.attest(CONFIG), /SHA-256 목록 불일치/);
  response = evidence({ artifact_files: [...FILES, FILES[0]] });
  await assert.rejects(runtime.attest(CONFIG), /SHA-256 목록 불일치/);
});

test('mock runtime evidence is blocked live and optional artifacts are limited to mocks', async t => {
  let response = evidence({ evidence_source: 'mock_fixture', mock: true, artifact_files: undefined });
  const host = await server(t, (_req, res) => res.end(JSON.stringify(response)));
  const actual = new Runtime(candidate(host), temp(t));
  await assert.rejects(actual.attest(CONFIG), /모의 runtime/);
  const mock = new Runtime(candidate(host), temp(t), { mock: true });
  assert.equal((await mock.attest(CONFIG)).verified, true);
  response = evidence({ artifact_files: [{ role: 'unknown', sha256: 'e'.repeat(64) }] });
  await assert.rejects(mock.attest(CONFIG), /artifact_files/);
});

function dockerRuntime(t, inspect) {
  const commands = [];
  let runtime;
  const commandRunner = async (command, args) => {
    assert.equal(command, 'docker'); commands.push(args);
    if (args[0] === 'create') return { code: -1, stdout: '', stderr: '', error: 'unknown timeout' };
    if (args[0] === 'inspect' && args.length === 2) return { code: 1, stdout: '', stderr: 'Error: No such object: removed-test-container' };
    if (args[0] === 'inspect') return inspect(runtime);
    return { code: 0, stdout: '', stderr: '' };
  };
  runtime = new Runtime(candidate('http://127.0.0.1:0', {
    runtime: { mode: 'docker', image: 'never-launched-test-image', args: [], container_port: 8000 },
  }), temp(t), { mock: true, commandRunner });
  return { runtime, commands };
}

test('Docker unknown create outcome retains its name and only cleans verified ownership', async t => {
  const { runtime, commands } = dockerRuntime(t, r => ({ code: 0, stdout: r.session, stderr: '' }));
  await assert.rejects(runtime.start(), /Docker 생성 실패/);
  const name = runtime.container;
  assert(name.startsWith('llm-benchmark-v2-'));
  const stopped = await runtime.stop();
  assert.equal(stopped.stopped, true);
  assert.equal(runtime.container, null);
  assert.deepEqual(commands.map(args => args[0]), ['create', 'inspect', 'logs', 'stop', 'rm', 'inspect']);
  assert.equal(stopped.process_exit_confirmed, true);
  assert.equal(stopped.port_released, true);
  assert(commands.slice(1).every(args => args.at(-1) === name));
  assert.equal(await runtime.stop(), stopped, 'repeated cleanup does not affect unrelated containers');
});

test('Docker unknown create outcome treats confirmed absence as clean', async t => {
  const { runtime, commands } = dockerRuntime(t, () => ({ code: 1, stdout: '', stderr: 'Error: No such object: mock' }));
  await assert.rejects(runtime.start(), /Docker 생성 실패/);
  assert.equal((await runtime.stop()).already_absent, true);
  assert.deepEqual(commands.map(args => args[0]), ['create', 'inspect']);
});

test('Docker missing ownership or failed inspect never stops a container', async t => {
  for (const response of [{ code: 0, stdout: 'another-session', stderr: '' },
    { code: -1, stdout: '', stderr: 'daemon unavailable' }]) {
    const { runtime, commands } = dockerRuntime(t, () => response);
    await assert.rejects(runtime.start(), /Docker 생성 실패/);
    await assert.rejects(runtime.stop(), /소유권 확인 실패/);
    assert.deepEqual(commands.map(args => args[0]), ['create', 'inspect']);
  }
});

test('Docker cleanup still stops and removes owned container when server log cannot be written', async t => {
  const { runtime, commands } = dockerRuntime(t, r => ({ code: 0, stdout: r.session, stderr: '' }));
  await assert.rejects(runtime.start(), /Docker 생성 실패/);
  runtime.outputDir = path.join(runtime.outputDir, 'missing-directory');
  const result = await runtime.stop();
  assert.equal(result.stopped, true);
  assert(result.log_error);
  assert.deepEqual(commands.map(args => args[0]), ['create', 'inspect', 'logs', 'stop', 'rm', 'inspect']);
});

test('Windows live native process launch is rejected before spawning', { skip: process.platform !== 'win32' }, async t => {
  const runtime = new Runtime(candidate('http://127.0.0.1:0', {
    runtime: { mode: 'process', command: [process.execPath, '-e', 'throw new Error("must not launch")'] },
  }), temp(t));
  await assert.rejects(runtime.start(), /Windows 실제 native process/);
  assert.equal(runtime.child, null);
});

test('Windows owned foreground mock cleanup uses its process handle and confirms exit', { skip: process.platform !== 'win32' }, async t => {
  const runtime = new Runtime(candidate('http://127.0.0.1:0', { runtime: { mode: 'process' } }), temp(t), {
    mock: true, commandRunner: () => { throw new Error('mock cleanup must not call taskkill'); },
  });
  const child = new EventEmitter(); let killed = 0;
  child.pid = 12345;
  child.kill = signal => {
    assert.equal(signal, 'SIGTERM'); killed++;
    setImmediate(() => { runtime.exited = true; child.emit('exit', 0, signal); }); return true;
  };
  runtime.child = child; runtime.exited = false;
  assert.equal((await runtime.stop()).stopped, true);
  assert.equal(killed, 1);
  assert.equal(runtime.child, null);
});

test('external runtime cleanup has no process or container side effects', async t => {
  const runtime = new Runtime(candidate('http://127.0.0.1:0'), temp(t), {
    commandRunner: () => { throw new Error('external cleanup must not run commands'); },
  });
  assert.deepEqual(await runtime.stop(), { owned_only: true, stopped: false, mode: 'external' });
});
test('actual external servers are rejected before an API request or process command', async t => {
  const runtime = new Runtime(candidate('http://127.0.0.1:0'), temp(t), {
    commandRunner: () => { throw new Error('must not execute'); },
  });
  await assert.rejects(runtime.start(), /소유한 Docker/);
});
test('Docker stop/rm success requires a final proof that the container is absent', async t => {
  let runtime;
  runtime = new Runtime(candidate('http://127.0.0.1:0', { runtime: { mode: 'docker', image: 'fixture', args: [], container_port: 8000 } }), temp(t), {
    mock: true, commandRunner: async (_command, args) => {
      if (args[0] === 'create') return { code: -1, stdout: '', stderr: 'fixture create error' };
      return { code: 0, stdout: args[0] === 'inspect' && args.length > 2 ? runtime.session : '{}', stderr: '' };
    },
  });
  await assert.rejects(runtime.start(), /생성 실패/);
  await assert.rejects(runtime.stop(), /제거 상태/);
  assert(runtime.container, 'unconfirmed container must remain tracked');
});

test('monitor captures asynchronous write errors once, calls onError and propagates through stop', async t => {
  const host = await server(t, (_req, res) => res.end('vllm:num_requests_running 0\n'));
  const failureFile = path.join(temp(t), 'missing-directory', 'monitor.jsonl');
  let errors = 0;
  const monitor = new Monitor(candidate(host), failureFile, { mock: true, onError: async error => {
    assert.equal(error.code, 'ENOENT'); errors += 1;
  } });
  await monitor.tick();
  assert.equal(monitor.error.code, 'ENOENT');
  assert.equal(errors, 1);
  await monitor.tick(); assert.equal(errors, 1);
  await assert.rejects(monitor.stop(), { code: 'ENOENT' });
});

test('monitor catches rejected error callbacks without unhandled rejection', async t => {
  const host = await server(t, (_req, res) => res.end('vllm:num_requests_running 0\n'));
  const monitor = new Monitor(candidate(host), path.join(temp(t), 'missing', 'monitor.jsonl'), {
    mock: true, onError: async () => { throw new Error('callback failure'); },
  });
  await monitor.tick();
  assert.equal(monitor.errorCallbackFailure.message, 'callback failure');
  await assert.rejects(monitor.stop(), { code: 'ENOENT' });
});

test('mock monitor polls backend queue without spawning GPU tools and freezes stage metadata', async t => {
  const host = await server(t, (req, res) => {
    assert.equal(req.url, '/metrics');
    res.end('mock:num_requests_running 4\nmock:num_requests_waiting 2\n');
  });
  const monitor = new Monitor({ ...candidate(host), engine: 'ollama' }, path.join(temp(t), 'metrics.jsonl'), {
    mock: true, intervalMs: 5, spawnGpu: () => { throw new Error('GPU tool must not spawn'); },
  });
  t.after(() => monitor.stop());
  monitor.stage = { phase: 'arrival', factor: 0.7 };
  monitor.start();
  await new Promise(resolve => setTimeout(resolve, 30));
  await monitor.stop();
  assert.equal(monitor.gpu, null);
  assert(monitor.samples.length > 0);
  assert.equal(monitor.samples[0].engine_metrics.queued, 2);
  assert.equal(monitor.samples[0].gpu, null);
  monitor.stage.factor = 1.1;
  assert.equal(monitor.samples[0].stage.factor, 0.7);
  assert.equal(monitor.samples[0].mock, true);
});

test('monitor HTTP metrics failure is recorded as unknown', async t => {
  const host = await server(t, (_req, res) => { res.statusCode = 503; res.end('not ready'); });
  const monitor = new Monitor(candidate(host), path.join(temp(t), 'metrics.jsonl'), { mock: true });
  await monitor.tick(); await monitor.stop();
  assert.equal(monitor.samples[0].engine_metrics, null);
  assert.equal(monitor.error, null);
});

function fakeGpu() {
  const child = new EventEmitter(); child.stdout = new EventEmitter();
  child.kill = () => { setImmediate(() => { child.emit('exit', 0, 'SIGTERM'); child.emit('close', 0, 'SIGTERM'); }); return true; };
  return child;
}

test('unexpected GPU monitor exit triggers onError and stop failure', async t => {
  const gpu = fakeGpu(); let failures = 0;
  const monitor = new Monitor(candidate('http://127.0.0.1:0'), path.join(temp(t), 'metrics.jsonl'), {
    intervalMs: 1000, spawnGpu: () => gpu, onError: () => { failures++; },
  });
  monitor.start(); gpu.emit('exit', 1, null); gpu.emit('close', 1, null);
  assert.equal(failures, 1);
  await assert.rejects(monitor.stop(), /예기치 않게 종료/);
});

test('expected GPU monitor cleanup confirms exit without reporting failure', async t => {
  const gpu = fakeGpu(); let failures = 0;
  const monitor = new Monitor(candidate('http://127.0.0.1:0'), path.join(temp(t), 'metrics.jsonl'), {
    intervalMs: 1000, spawnGpu: () => gpu, onError: () => { failures++; },
  });
  monitor.start(); await monitor.stop();
  assert.equal(monitor.gpuExited, true);
  assert.equal(failures, 0);
  assert.equal(monitor.error, null);
});
