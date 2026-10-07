'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { startMockServer, parseArgs } = require('./mock_server');
const { createMockConfig } = require('./create_mock_config');
const { createClient } = require('../lib/transport');
const { loadConfig, validate, ENGINES } = require('../lib/config');
const { verifyProvenance, semanticGate } = require('../lib/provenance');

const ITEM = { caseId: 'mock-1', type: 'SF', messages: [
  { role: 'system', content: 'JSON contract.' },
  { role: 'user', content: '[참고 자료]\n[FAQ-010] 설명 자료\n[사용자 질문]\n설명' },
] };

for (const engine of ENGINES) {
  test(`fixture ${engine}: streaming contract, readiness, metrics and explicit mock attestation`, async (t) => {
    const fixture = await startMockServer({ engine, model: 'mock-model', internalLimit: 2, delayMs: 3,
      engineVersion: 'mock-test-version', context: 4096, upstreamRepository: 'Qwen/Qwen3-4B', upstreamRevision: 'mock-revision' });
    t.after(() => fixture.close());
    const client = createClient({ engine, host: fixture.host, model: 'mock-model', transport: { keepAlive: true, timeoutMs: 1000 } });
    t.after(() => client.close());
    const rec = await client.send(ITEM);
    assert.equal(rec.valid, true);
    assert.equal(rec.eval_count, 27);
    const attestation = await (await fetch(fixture.host + '/benchmark/runtime')).json();
    assert.equal(attestation.mock, true);
    assert.equal(attestation.evidence_source, 'mock_fixture');
    assert.equal(attestation.engine, engine);
    assert.equal(attestation.engine_version, 'mock-test-version');
    assert.equal(attestation.api_model, 'mock-model');
    assert.equal(attestation.internal_limit, 2);
    assert.equal(attestation.context_per_request, 4096);
    assert.equal(attestation.upstream_revision, 'mock-revision');
    assert.equal(attestation.fully_on_gpu, true);
    assert.ok(Number.isFinite(Date.parse(attestation.observed_at)));
    for (const route of ['/api/tags', '/api/ps', '/v1/models']) {
      const ready = await (await fetch(fixture.host + route)).json();
      assert.equal(ready.mock, true);
      assert.equal((ready.models?.[0].name || ready.data?.[0].id), 'mock-model');
    }
    const metrics = await (await fetch(fixture.host + '/metrics')).text();
    assert.match(metrics, /MOCK FIXTURE/);
    assert.match(metrics, /mock:requests_total 1/);
  });
}

test('fixture applies its internal running limit and exposes waiting requests', async (t) => {
  const fixture = await startMockServer({ engine: 'vllm', model: 'mock-model', internalLimit: 1, delayMs: 60 });
  t.after(() => fixture.close());
  const client = createClient({ engine: 'vllm', host: fixture.host, model: 'mock-model' });
  t.after(() => client.close());
  const requests = [client.send(ITEM), client.send(ITEM), client.send(ITEM)];
  const until = Date.now() + 1000;
  while (fixture.state.requests < 3 && Date.now() < until) await new Promise((resolve) => setImmediate(resolve));
  assert.equal(fixture.state.active, 1);
  assert.equal(fixture.state.waiting.length, 2);
  const metrics = await (await fetch(fixture.host + '/metrics')).text();
  assert.match(metrics, /vllm:num_requests_running 1/);
  assert.match(metrics, /vllm:num_requests_waiting 2/);
  assert.equal((await Promise.all(requests)).filter((record) => record.valid).length, 3);
});

test('fixture rejects invalid model requests and closes pending requests', async (t) => {
  const fixture = await startMockServer({ engine: 'ollama', model: 'mock-model', delayMs: 1000 });
  t.after(() => fixture.close());
  const response = await fetch(fixture.host + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'wrong-model', messages: ITEM.messages, stream: true }) });
  assert.equal(response.status, 400);
  const client = createClient({ engine: 'ollama', host: fixture.host, model: 'mock-model' });
  t.after(() => client.close());
  const pending = client.send(ITEM);
  const until = Date.now() + 1000;
  while (fixture.state.requests < 1 && Date.now() < until) await new Promise((resolve) => setImmediate(resolve));
  await fixture.close();
  assert.equal((await pending).transport_ok, false);
});

test('generator creates hashed four-engine fixtures, keeps semantic approval pending, and rejects real mode/v1 outputs', async (t) => {
  const results = path.resolve(__dirname, '../../results');
  const directory = path.resolve(results, `test-mock-config-${randomUUID()}`);
  t.after(() => {
    // Verify the resolved target before recursive fixture cleanup on Windows.
    const relative = path.relative(results, directory);
    assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const generated = createMockConfig({ outputDir: directory, basePort: 19961, delayMs: 3 });
  const config = loadConfig(generated.config, { mock: true });
  assert.equal(config.mock, true);
  assert.equal(generated.questions, 300);
  assert.equal(config.candidates.length, 4);
  assert.ok(config.workload.file.startsWith(path.resolve(__dirname, '../../data')));
  assert.equal(config.profiles.confirm.measure_ms, 250);
  assert.equal(config.profiles.confirm.repeats, 3);
  assert.equal(config.arrival.duration_ms, 400);
  assert.throws(() => validate(config, { mock: false }), /모의/);
  for (const candidate of config.candidates) {
    const result = await verifyProvenance(candidate, { mock: true });
    assert.equal(result.lineage.method, 'mock_fixture');
    assert.equal((await semanticGate(candidate, config.workload.sha256, { mock: true })).status, 'pending');
    assert.equal(candidate.runtime.command[0], process.execPath);
    assert.equal(candidate.runtime.attestation.path, '/benchmark/runtime');
  }
  assert.throws(() => createMockConfig({ outputDir: path.resolve(__dirname, '../../../load_test_v1/mock-fixture') }), /load_test_v2\/results/);
  assert.throws(() => createMockConfig({ outputDir: directory }), /already exists/);
});

test('mock CLI parser uses structured flags and rejects duplicates', () => {
  const parsed = parseArgs(['--port', '19441', '--engine', 'vllm', '--model', 'mock-model', '--internal-limit', '2']);
  assert.equal(parsed.port, 19441);
  assert.equal(parsed.internalLimit, 2);
  assert.throws(() => parseArgs(['--port', '19441', '--port', '19442']), /Invalid/);
});
