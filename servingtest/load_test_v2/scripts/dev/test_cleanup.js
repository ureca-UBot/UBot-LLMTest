'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanupOwnedEngine, cleanupOptions, assertBaseline } = require('../lib/cleanup');
const snapshot = (memory = 0, processes = []) => ({ known: true, scope: 'gpu', compute_processes: processes.map(x => `${x.pid}, ${x.name}, ${x.used_memory_mib}`),
  processes, gpus: [{ uuid: 'GPU-fixture', name: 'Tesla T4', memory_used_mib: memory, memory_total_mib: 15360 }] });
const runtime = (extra = {}) => ({ stop: async () => ({ stopped: true, process_exit_confirmed: true, port_released: true, ...extra }) });
const options = { timeoutMs: 80, intervalMs: 1, stableSamples: 3 };
test('owned engine cleanup requires exit, free port and stable VRAM restoration', async () => {
  let calls = 0;
  const result = await cleanupOwnedEngine({ runtime: runtime(), before: snapshot(16), snapshot: async () => { calls++; return snapshot(16); }, gpuOptions: options });
  assert.equal(result.status, 'passed'); assert.equal(result.gpu.scope, 'gpu'); assert.equal(calls, 3);
  assert.equal(result.gpu.checks.after_mib, 16);
});
test('an empty GPU PID list cannot hide persistent VRAM allocation', async () => {
  const result = await cleanupOwnedEngine({ runtime: runtime(), before: snapshot(), snapshot: async () => snapshot(4000),
    gpuOptions: { ...options, timeoutMs: 10 } });
  assert.equal(result.status, 'failed'); assert.equal(result.gpu.reason, 'vram_above_baseline');
  assert.equal(result.gpu.release_status, 'timeout');
});
test('runtime exit failure stays failed even after GPU memory is released', async () => {
  const result = await cleanupOwnedEngine({ runtime: runtime({ process_exit_confirmed: false }), before: snapshot(), snapshot: async () => snapshot(), gpuOptions: options });
  assert.equal(result.status, 'failed'); assert.equal(result.gpu.status, 'passed');
});
test('a runtime error still attempts GPU cleanup verification', async () => {
  let calls = 0;
  const result = await cleanupOwnedEngine({ runtime: { stop: async () => { throw new Error('worker still running'); } }, before: snapshot(),
    snapshot: async () => { calls++; return snapshot(); }, gpuOptions: options });
  assert.equal(result.status, 'failed'); assert.equal(calls, 3); assert.match(result.errors[0], /worker/);
});
test('port reuse or unknown GPU observation cannot pass cleanup', async () => {
  assert.equal((await cleanupOwnedEngine({ runtime: runtime({ port_released: false }), before: snapshot(), snapshot: async () => snapshot(), gpuOptions: options })).status, 'failed');
  assert.equal((await cleanupOwnedEngine({ runtime: runtime(), before: snapshot(), snapshot: async () => ({ known: false }), gpuOptions: options })).status, 'failed');
});
test('mock cleanup is explicitly synthetic and never queries a GPU', async () => {
  const result = await cleanupOwnedEngine({ runtime: runtime(), mock: true, snapshot: () => { throw Error('GPU query forbidden'); } });
  assert.equal(result.status, 'passed'); assert.equal(result.gpu.scope, 'mock');
});
test('GPU baseline must be observable, dedicated and within the idle memory ceiling', () => {
  assert.equal(assertBaseline(snapshot(16)).gpus[0].memory_used_mib, 16);
  assert.throws(() => assertBaseline(snapshot(65)), /기준선/);
  assert.throws(() => assertBaseline(snapshot(0, [{ pid: 9, name: 'foreign', used_memory_mib: 1 }])), /기준선/);
  assert.throws(() => assertBaseline({ known: true, compute_processes: [], gpus: [] }), /기준선/);
});
test('cleanup defaults require exact VRAM return and three stable samples', () => {
  assert.equal(cleanupOptions().toleranceMiB, 0); assert.equal(cleanupOptions().stableSamples, 3);
  assert.throws(() => cleanupOptions({ cleanup: { vram_tolerance_mib: -1 } }), /범위/);
  assert.throws(() => cleanupOptions({ cleanup: { stable_samples: 1 } }), /범위/);
  assert.throws(() => cleanupOptions({ cleanup: { timeout_ms: 60001 } }), /범위/);
});
