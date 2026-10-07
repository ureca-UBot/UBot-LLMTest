'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { gpuSnapshot } = require('../lib/monitor');
const { evaluateGpuRelease, waitForGpuRelease } = require('../lib/gpu_cleanup');

const GPU_CSV = '0, GPU-test-uuid, Tesla T4, 7, 15360, 550.54.15\n';
function snapshot(memory = 7, pids = [], overrides = {}) {
  return { known: true, compute_processes: pids.map(pid => `${pid}, worker, 4096`),
    processes: pids.map(pid => ({ pid, name: 'worker', used_memory_mib: 4096 })),
    gpus: [{ index: 0, uuid: 'GPU-test-uuid', name: 'Tesla T4', memory_used_mib: memory,
      memory_total_mib: 15360, driver_version: '550.54.15' }], ...overrides };
}
async function injectedSnapshot(processCsv = '', gpuCsv = GPU_CSV) {
  const calls = [];
  const output = await gpuSnapshot({ commandRunner: async (command, args, options) => {
    calls.push({ command, args, options }); return { code: 0, stdout: args[0].startsWith('--query-compute-apps') ? processCsv : gpuCsv, stderr: '' };
  } });
  return { output, calls };
}
test('snapshot uses injected commands and retains raw compatibility fields', async () => {
  const { output, calls } = await injectedSnapshot('123, "worker, gpu", 4096\n');
  assert.equal(output.known, true); assert.equal(calls.length, 2);
  assert(calls.every(call => call.command === 'nvidia-smi' && call.options.timeoutMs === 10000));
  assert.equal(output.gpu, GPU_CSV.trim()); assert.deepEqual(output.compute_processes, ['123, "worker, gpu", 4096']);
  assert.deepEqual(output.processes, [{ pid: 123, name: 'worker, gpu', used_memory_mib: 4096 }]);
  assert.equal(output.gpus[0].uuid, 'GPU-test-uuid'); assert.equal(output.gpus[0].memory_used_mib, 7);
});
test('mock snapshot never invokes GPU commands and reports no real hardware', async () => {
  const output = await gpuSnapshot({ mock: true, commandRunner: () => { throw new Error('must not execute'); } });
  assert.equal(output.scope, 'mock'); assert.deepEqual(output.gpus, []);
});
for (const [name, processes, gpu] of [
  ['GPU N/A', '', GPU_CSV.replace(', 7,', ', N/A,')],
  ['process N/A', '123, worker, N/A\n', GPU_CSV],
  ['negative VRAM', '', GPU_CSV.replace(', 7,', ', -1,')],
  ['empty memory', '', GPU_CSV.replace(', 7,', ', ,')],
  ['missing GPU', '', ''],
  ['malformed GPU columns', '', 'Tesla T4, 0, 15360\n'],
  ['malformed process columns', '123, worker\n', GPU_CSV],
  ['unclosed CSV quote', '123, "worker, 4\n', GPU_CSV],
  ['invalid PID', '0, worker, 4\n', GPU_CSV],
  ['VRAM above total', '', GPU_CSV.replace(', 7,', ', 20000,')],
  ['duplicate GPU UUID', '', GPU_CSV + GPU_CSV.replace(/^0,/, '1,')],
]) test(`snapshot fails closed for ${name}`, async () => {
  const { output } = await injectedSnapshot(processes, gpu);
  assert.equal(output.known, false); assert(output.errors.length > 0);
});
test('snapshot inspects command failures and rejected promises', async () => {
  for (const rejected of [false, true]) {
    const output = await gpuSnapshot({ commandRunner: async () => {
      if (rejected) throw new Error('missing binary'); return { code: 1, stdout: '', stderr: 'driver failed' };
    } });
    assert.equal(output.known, false); assert.match(output.errors, rejected ? /missing binary/ : /driver failed/);
  }
});
test('release requires PID empty and VRAM restored, allowing nonzero driver baseline', () => {
  assert.equal(evaluateGpuRelease(snapshot(), snapshot()).released, true);
  assert.equal(evaluateGpuRelease(snapshot(), snapshot(4096, [123])).reason, 'compute_processes_present');
  assert.equal(evaluateGpuRelease(snapshot(), snapshot(4096)).reason, 'vram_above_baseline');
  assert.equal(evaluateGpuRelease(snapshot(), snapshot(8), { toleranceMiB: 1 }).released, true);
  assert.equal(evaluateGpuRelease(snapshot(), snapshot(0)).released, true);
});
test('release rejects unknown, dirty, invalid or changed baseline and snapshots', () => {
  assert.equal(evaluateGpuRelease(null, snapshot()).reason, 'baseline_unknown');
  assert.equal(evaluateGpuRelease(snapshot(7, [123]), snapshot()).reason, 'baseline_processes_present');
  assert.equal(evaluateGpuRelease(snapshot(), { known: false }).reason, 'after_unknown');
  assert.equal(evaluateGpuRelease(snapshot(-1), snapshot()).reason, 'baseline_invalid_gpu');
  assert.equal(evaluateGpuRelease(snapshot(), snapshot(-1)).reason, 'after_invalid_gpu');
  const changed = snapshot(); changed.gpus[0].uuid = 'different';
  assert.equal(evaluateGpuRelease(snapshot(), changed).reason, 'gpu_identity_changed');
  assert.equal(evaluateGpuRelease(snapshot(), snapshot(7, [], { compute_processes: ['123, worker, 4'] })).reason, 'after_invalid_processes');
  assert.throws(() => evaluateGpuRelease(snapshot(), snapshot(), { toleranceMiB: -1 }), /허용 오차/);
});
test('release waits for delayed PID and VRAM cleanup and three consecutive samples', async () => {
  const sequence = [snapshot(4096, [123]), snapshot(4096), snapshot(), snapshot(30), snapshot(), snapshot(), snapshot()];
  let calls = 0;
  const result = await waitForGpuRelease({ before: snapshot(), snapshot: async () => sequence[calls++], timeoutMs: 200, intervalMs: 1 });
  assert.equal(result.status, 'released'); assert.equal(calls, 7);
  assert.equal(result.consecutive_stable_samples, 3); assert.equal(result.samples.length, 7);
  assert.equal(result.checks.baseline_mib, 7); assert.equal(result.checks.after_mib, 7);
});
test('release times out if either PID or excess VRAM remains', async () => {
  for (const dirty of [snapshot(7, [123]), snapshot(4096)]) {
    const result = await waitForGpuRelease({ before: snapshot(), snapshot: async () => dirty, timeoutMs: 15, intervalMs: 1 });
    assert.equal(result.status, 'timeout'); assert.equal(result.released, false); assert(result.samples.length > 0);
  }
});
test('release fails immediately on missing baseline or unknown sample', async () => {
  let calls = 0;
  const missing = await waitForGpuRelease({ before: null, snapshot: async () => { calls++; return snapshot(); } });
  assert.equal(missing.status, 'failed'); assert.equal(calls, 0);
  const unknown = await waitForGpuRelease({ before: snapshot(), snapshot: async () => ({ known: false, errors: 'N/A' }) });
  assert.equal(unknown.status, 'failed'); assert.equal(unknown.samples.length, 1); assert.equal(unknown.reason, 'after_unknown');
});
test('release bounds a hung snapshot and records errors without certifying cleanup', async () => {
  const hung = await waitForGpuRelease({ before: snapshot(), snapshot: () => new Promise(() => {}), timeoutMs: 10, intervalMs: 1 });
  assert.equal(hung.status, 'timeout'); assert.equal(hung.reason, 'snapshot_timeout');
  const failure = await waitForGpuRelease({ before: snapshot(), snapshot: async () => { throw new Error('probe failed'); } });
  assert.equal(failure.status, 'failed'); assert.equal(failure.reason, 'snapshot_error'); assert.match(failure.after.errors, /probe failed/);
});
test('release aborts promptly and does not certify a single clean reading', async () => {
  const controller = new AbortController(); let calls = 0;
  const result = await waitForGpuRelease({ before: snapshot(), signal: controller.signal,
    snapshot: async () => { calls++; setTimeout(() => controller.abort(), 2); return snapshot(); }, intervalMs: 100 });
  assert.equal(result.status, 'aborted'); assert.equal(result.released, false); assert.equal(calls, 1);
  assert.equal(result.consecutive_stable_samples, 1);
});
test('release rejects invalid polling settings', async () => {
  await assert.rejects(waitForGpuRelease({ before: snapshot(), timeoutMs: 60001 }), /60000ms/);
  await assert.rejects(waitForGpuRelease({ before: snapshot(), intervalMs: 0 }), /주기/);
  await assert.rejects(waitForGpuRelease({ before: snapshot(), stableSamples: 1 }), /2회/);
});
