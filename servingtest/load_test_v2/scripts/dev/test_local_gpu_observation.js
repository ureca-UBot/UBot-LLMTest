'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { readLocalGpuObservation, baselineEnvelope, waitForVramReturn } = require('./local_gpu_observation');
const CSV = '0, GPU-fixture, RTX fixture, 2404, 12288, 580.00\n';
function observation(memory = 2404) {
  return { known: true, gpu: { index: 0, uuid: 'GPU-fixture', name: 'RTX fixture', memory_used_mib: memory,
    memory_total_mib: 12288, driver_version: '580.00' } };
}
function baseline() { return baselineEnvelope([observation(2400), observation(2404), observation(2410)]); }
function assertDiagnostic(result) {
  assert.equal(result.scope, 'windows_wddm_diagnostic'); assert.equal(result.compute_process_verification, 'unsupported');
  assert.equal(result.strict_gpu_release, 'unsupported'); assert.equal(result.benchmark_eligible, false);
}
test('local observation queries total GPU memory with an injected command only', async () => {
  let calls = 0;
  const result = await readLocalGpuObservation({ commandRunner: async (command, args) => {
    calls++; assert.equal(command, 'nvidia-smi'); assert(args[0].startsWith('--query-gpu='));
    assert(args.every(arg => !arg.includes('compute-apps'))); return { code: 0, stdout: CSV };
  } });
  assert.equal(result.known, true); assert.equal(result.gpu.memory_used_mib, 2404); assert.equal(calls, 1); assertDiagnostic(result);
});
for (const [label, stdout] of [['N/A', CSV.replace('2404', 'N/A')], ['negative', CSV.replace('2404', '-1')],
  ['missing GPU', ''], ['multi GPU', CSV + CSV.replace('0, GPU-fixture', '1, GPU-fixture-2')]]) {
  test(`local observation fails closed for ${label}`, async () => {
    const result = await readLocalGpuObservation({ commandRunner: async () => ({ code: 0, stdout }) });
    assert.equal(result.known, false); assert(result.errors); assertDiagnostic(result);
  });
}
test('local observation captures command failure and exceptions', async () => {
  for (const commandRunner of [async () => ({ code: 1, stderr: 'driver unavailable' }), async () => { throw new Error('spawn unavailable'); }]) {
    const result = await readLocalGpuObservation({ commandRunner }); assert.equal(result.known, false); assert(result.errors); assertDiagnostic(result);
  }
});
test('baseline fixes the initial min/max envelope and copies its input samples', () => {
  const inputs = [observation(2400), observation(2404), observation(2410)], result = baselineEnvelope(inputs);
  assert.equal(result.known, true); assert.equal(result.min_mib, 2400); assert.equal(result.max_mib, 2410); assert.equal(result.range_mib, 10);
  inputs[0].gpu.memory_used_mib = 10000; assert.equal(result.samples[0].gpu.memory_used_mib, 2400); assertDiagnostic(result);
});
test('baseline rejects missing, unknown, changed GPU and noisy initial windows', () => {
  assert.equal(baselineEnvelope([]).reason, 'baseline_insufficient_samples');
  assert.equal(baselineEnvelope([observation(), observation(), { known: false }]).reason, 'baseline_unknown');
  const changed = observation(); changed.gpu.uuid = 'other';
  assert.equal(baselineEnvelope([observation(), observation(), changed]).reason, 'baseline_gpu_identity_changed');
  const noisy = baselineEnvelope([observation(2400), observation(2600), observation(2700)]);
  assert.equal(noisy.known, false); assert.equal(noisy.reason, 'baseline_unstable'); assert.equal(noisy.max_mib, 2700); assertDiagnostic(noisy);
});
test('return needs three consecutive samples and resets stability after rebound', async () => {
  const inputs = [observation(5000), observation(2400), observation(2405), observation(2411), observation(2400), observation(2405), observation(2410)];
  let calls = 0;
  const result = await waitForVramReturn({ baseline: baseline(), snapshot: async () => inputs[calls++], intervalMs: 1, timeoutMs: 250 });
  assert.equal(result.status, 'observed_returned'); assert.equal(calls, 7); assert.equal(result.consecutive_stable_samples, 3); assertDiagnostic(result);
});
test('high later observations never rebase the initial max envelope', async () => {
  const initial = baseline(); let calls = 0;
  const result = await waitForVramReturn({ baseline: initial, snapshot: async () => {
    calls++; initial.max_mib = 6000; return observation(5000);
  }, intervalMs: 1, timeoutMs: 20 });
  assert.equal(result.status, 'timeout'); assert.equal(result.baseline.max_mib, 2410);
  assert(result.samples.length > 0); assert(result.samples.every(sample => sample.baseline_max_mib === 2410)); assertDiagnostic(result);
});
test('observations reject unknown values and GPU identity changes without certification', async () => {
  const changed = observation(); changed.gpu.uuid = 'other';
  for (const current of [{ known: false }, changed]) {
    const result = await waitForVramReturn({ baseline: baseline(), snapshot: async () => current, timeoutMs: 50, intervalMs: 1 });
    assert.equal(result.status, 'failed'); assert.equal(result.samples.length, 1); assertDiagnostic(result);
  }
});
test('missing baseline prevents sampling and residual VRAM times out', async () => {
  let calls = 0;
  const missing = await waitForVramReturn({ baseline: null, snapshot: async () => { calls++; return observation(); } });
  assert.equal(missing.status, 'failed'); assert.equal(calls, 0); assertDiagnostic(missing);
  const residual = await waitForVramReturn({ baseline: baseline(), snapshot: async () => observation(2411), timeoutMs: 15, intervalMs: 1 });
  assert.equal(residual.status, 'timeout'); assert.equal(residual.observed_returned, false); assertDiagnostic(residual);
});
test('hung, throwing and aborted observations remain unsupported', async () => {
  const hung = await waitForVramReturn({ baseline: baseline(), snapshot: () => new Promise(() => {}), timeoutMs: 10, intervalMs: 1 });
  assert.equal(hung.status, 'timeout'); assert.equal(hung.reason, 'snapshot_timeout'); assertDiagnostic(hung);
  const thrown = await waitForVramReturn({ baseline: baseline(), snapshot: async () => { throw new Error('query failed'); } });
  assert.equal(thrown.status, 'failed'); assert.equal(thrown.reason, 'snapshot_error'); assertDiagnostic(thrown);
  const controller = new AbortController(); controller.abort();
  const aborted = await waitForVramReturn({ baseline: baseline(), signal: controller.signal, snapshot: () => { throw new Error('must not run'); } });
  assert.equal(aborted.status, 'failed'); assert.equal(aborted.reason, 'aborted'); assertDiagnostic(aborted);
});
test('explicit 64 MiB tolerance includes its boundary and preserves the original baseline', async () => {
  const initial = baseline(), originalMax = initial.max_mib;
  const result = await waitForVramReturn({ baseline: initial, snapshot: async () => observation(originalMax + 64),
    toleranceMiB: 64, intervalMs: 1, timeoutMs: 200 });
  assert.equal(result.status, 'observed_returned'); assert.equal(result.consecutive_stable_samples, 3);
  assert.equal(initial.max_mib, originalMax); assert.equal(result.baseline.max_mib, originalMax);
  assert.equal(result.tolerance_mib, 64); assert.equal(result.limit_mib, originalMax + 64);
  assert(result.samples.every(sample => sample.tolerance_mib === 64 && sample.limit_mib === originalMax + 64
    && sample.baseline_max_mib === originalMax && sample.reason === 'observed_within_tolerance')); assertDiagnostic(result);
});
test('memory 65 MiB above initial max stays outside the explicitly tolerated boundary', async () => {
  const initial = baseline(), originalMax = initial.max_mib;
  const result = await waitForVramReturn({ baseline: initial, snapshot: async () => observation(originalMax + 65),
    toleranceMiB: 64, intervalMs: 1, timeoutMs: 15 });
  assert.equal(result.status, 'timeout'); assert.equal(result.observed_returned, false);
  assert.equal(result.limit_mib, originalMax + 64); assert.equal(result.consecutive_stable_samples, 0); assertDiagnostic(result);
});
test('tolerance rejects values above 64, negative, fractional and nonnumeric inputs', async () => {
  for (const toleranceMiB of [65, -1, 0.5, NaN, '64', null]) {
    await assert.rejects(waitForVramReturn({ baseline: baseline(), toleranceMiB }), /0\.\.64/);
  }
});
test('tolerance never accumulates or rebases from elevated later observations', async () => {
  const initial = baseline(), originalMax = initial.max_mib; let calls = 0;
  const result = await waitForVramReturn({ baseline: initial, toleranceMiB: 64, intervalMs: 1, timeoutMs: 20,
    snapshot: async () => { calls++; initial.max_mib = originalMax + 64 * calls; return observation(originalMax + 100); } });
  assert.equal(result.status, 'timeout'); assert.equal(result.baseline.max_mib, originalMax);
  assert.equal(result.limit_mib, originalMax + 64);
  assert(result.samples.length > 0); assert(result.samples.every(sample => sample.limit_mib === originalMax + 64)); assertDiagnostic(result);
});
test('tolerance does not permit unknown readings or GPU identity changes', async () => {
  const changed = observation(); changed.gpu.uuid = 'other';
  for (const current of [{ known: false }, changed]) {
    const result = await waitForVramReturn({ baseline: baseline(), snapshot: async () => current, toleranceMiB: 64 });
    assert.equal(result.status, 'failed'); assert.equal(result.observed_returned, false); assertDiagnostic(result);
  }
});
