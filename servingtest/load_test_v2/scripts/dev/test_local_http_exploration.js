'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { options, comparison, warmHttpOnly, validateResumeSource, recoveredBaseline } = require('./run_local_http_exploration');
const ROOT = path.resolve(__dirname, '../..');

function step(users, rps, overrides = {}) {
  return { users, status: 'completed', ...overrides,
    summary: { transport_rps: rps, sample_sufficient: true, target_reached: rps >= 8,
      target_status: rps >= 8 ? 'reached' : 'below_target', e2e_p95_ms: 1000000,
      quality_reference: { n_valid: 0, schema_failures: 100, valid_rps: 0 }, ...overrides.summary } };
}
function candidate(id, steps, flags = {}) {
  return { id, candidate: { internal_limit: 4 }, status: 'completed', lifecycle_verified: true,
    vram_return_observed: true, steps, ...flags };
}
function report(candidates) { return { target: { http_completion_rps: 8 }, candidates }; }

test('comparison uses raw best Ollama HTTP throughput and ignores quality and latency', () => {
  const result = comparison(report([candidate('ollama_p4', [step(4, 8.000001), step(8, 8.123456789)]),
    candidate('vllm_p16', [step(16, 10.987654321)])]));
  assert.equal(result.baseline_best_http_rps, 8.123456789);
  assert.equal(result.rows[1].best_http_rps, 10.987654321);
  assert.equal(result.rows[1].ratio_to_ollama, 10.987654321 / 8.123456789);
  assert.equal(result.rows[0].best_users, 8); assert.equal(result.rows[0].quality_gate_applied, false);
  assert.equal(result.rows[0].latency_gate_applied, false);
});
test('comparison records the minimum tested U reaching 8 and leaves below-target candidates unachieved', () => {
  const result = comparison(report([candidate('ollama_p4', [step(8, 9), step(2, 7.99), step(4, 8)]),
    candidate('llama_p4', [step(1, 7.99), step(4, 7.999999999)])]));
  assert.equal(result.rows[0].minimum_tested_users_at_target, 4); assert.equal(result.rows[0].target_8rps_observed, true);
  assert.equal(result.rows[1].minimum_tested_users_at_target, null); assert.equal(result.rows[1].target_8rps_observed, false);
});
test('unverified lifecycle excludes a round from rates, targets and Ollama ratios', () => {
  const result = comparison(report([candidate('ollama_p4', [step(4, 20)], { lifecycle_verified: false }),
    candidate('llama_p4', [step(4, 40)], { lifecycle_verified: false }), candidate('vllm_p16', [step(16, 30)])]));
  assert.equal(result.baseline_best_http_rps, null);
  for (const row of result.rows) assert.equal(row.ratio_to_ollama, null);
  assert.equal(result.rows[0].best_http_rps, null); assert.equal(result.rows[1].target_8rps_observed, false);
});
test('unobserved VRAM return excludes completed high-throughput rounds', () => {
  const result = comparison(report([candidate('ollama_p4', [step(4, 8)]),
    candidate('sglang_p16', [step(16, 100)], { vram_return_observed: false })]));
  assert.equal(result.rows[1].best_http_rps, null); assert.equal(result.rows[1].ratio_to_ollama, null);
  assert.equal(result.rows[1].target_8rps_observed, false); assert.equal(result.rows[1].minimum_tested_users_at_target, null);
});
test('aborted and insufficient steps are excluded while completed eligible steps remain', () => {
  const result = comparison(report([candidate('ollama_p4', [step(4, 8)]), candidate('llama_p4', [
    step(32, 50, { status: 'aborted' }), step(24, 40, { status: 'safety_stop' }),
    step(16, 30, { summary: { sample_sufficient: false } }), step(8, 8.5),
    { users: 64, status: 'not_measured' } ])]));
  assert.equal(result.rows[1].best_http_rps, 8.5); assert.equal(result.rows[1].best_users, 8);
  assert.equal(result.rows[1].minimum_tested_users_at_target, 8); assert.equal(result.rows[1].ratio_to_ollama, 8.5 / 8);
});
test('all comparison rows remain ineligible for the formal benchmark', () => {
  const result = comparison(report([candidate('ollama_p4', [step(4, 8)]), candidate('llama_p4', []),
    candidate('vllm_p16', [step(16, 100)], { lifecycle_verified: false })]));
  assert(result.rows.every(row => row.formal_benchmark_eligible === false));
  assert.equal(Object.hasOwn(result, 'c_slo'), false); assert.equal(Object.hasOwn(result, 'lambda_slo'), false);
});
test('options accepts only a new v2 results path and rejects outside paths, existing directories and T4 modes', t => {
  t.mock.method(fs, 'writeFileSync', () => { throw new Error('options must never write'); });
  const directory = path.join(ROOT, 'results', `pure_options_${randomUUID()}`);
  const parsed = options(['--out', directory, '--candidate', 'ollama_p4']);
  assert.equal(parsed.out, directory); assert.equal(parsed.candidate, 'ollama_p4'); assert.equal(parsed.targetRps, 8);
  assert.equal(parsed.measureMs, 30000); assert.equal(fs.existsSync(directory), false);
  assert.throws(() => options(['--out', path.join(ROOT, '../load_test_v1/new-test')]), /new directory/);
  assert.throws(() => options(['--out', path.join(ROOT, 'results')]), /new directory/);
  assert.throws(() => options(['--out', directory, '--t4', 'true']), /Use --out/);
  assert.throws(() => options(['--out', directory, '--phase', 'confirm']), /Use --out/);
  assert.throws(() => options(['--out']), /Use --out/);
});
test('HTTP-only warmup permits complete 2xx streams with invalid output quality and writes only mocked logs', async t => {
  const captured = []; let count = 0;
  t.mock.method(fs, 'appendFileSync', (file, text) => { captured.push({ file, record: JSON.parse(text) }); });
  const client = { send: async item => ({ transport_ok: true, http_status: 200, valid: false,
    schema_valid: false, socket_reused: item.caseId === 1 }) };
  const pool = { cursor: () => ({ next: () => ({ caseId: count++ }) }) };
  const result = await warmHttpOnly(client, pool, 2, path.join(ROOT, 'results/mock_no_write'), 'fixture');
  assert.equal(result.passed, true); assert.equal(result.completed, 2); assert.equal(result.quality_valid_reference, 0);
  assert.equal(result.reused, 1); assert.equal(captured.length, 2);
  assert(captured.every(item => item.record.warmup === true && item.record.quality_gate_applied === false));
});

test('local tolerance is explicit, bounded and independent from the fixed experiment defaults', () => {
  const out = path.join(ROOT, 'results', `pure_options_${randomUUID()}`);
  assert.equal(options(['--out', out]).vramToleranceMiB, 0);
  const opt = options(['--out', out, '--vram-tolerance-mib', '64', '--resume-report', path.join(ROOT, 'results/old/report.json')]);
  assert.equal(opt.vramToleranceMiB, 64); assert.equal(opt.targetRps, 8); assert.equal(opt.measureMs, 30000);
  for (const value of ['65', '-1', '1.5', 'NaN']) assert.throws(() => options(['--out', out, '--vram-tolerance-mib', value]), /integer/);
  assert.throws(() => options(['--out', out, '--resume-report', path.join(ROOT, '../outside/report.json')]), /Resume report/);
});

function resumeFixture() {
  const expected = { target: { http_completion_rps: 8, latency_limit_ms: null }, generation: { context: 4096, max_tokens: 512 },
    transport: { streaming: true, retries: 0 }, model_family: 'Qwen/Qwen3-4B', workload: { sha256: 'workload', seed: 20261002 },
    profile: { targetRps: 8, measureMs: 30000, minRequests: 20, timeoutMs: 120000, seed: 20261002 },
    weight_fingerprints: [{ bytes: 123, sha256: 'same_weights' }] };
  const source = { ...structuredClone(expected), scope: 'local_http_capacity_exploration', mock: false, formal_benchmark_eligible: false,
    gpu_baseline: { known: true, status: 'recorded', max_mib: 2252 }, candidates: [{ id: 'ollama_p4', status: 'cleanup_unverified',
      measurement_status: 'completed', lifecycle_verified: true, vram_return_observed: false, cleanup_errors: [],
      runtime_cleanup: { process_exit_confirmed: true, port_released: true }, vram_return: { status: 'timeout' }, steps: [step(32, 1.2)] }] };
  return { source, expected };
}
test('resumption rejects changed workload, generation, transport, weights and runtime cleanup', () => {
  const { source, expected } = resumeFixture();
  assert.equal(validateResumeSource(source, expected).id, 'ollama_p4');
  for (const mutate of [s => { s.workload.seed++; }, s => { s.generation.max_tokens = 16; }, s => { s.transport.streaming = false; },
    s => { s.weight_fingerprints[0].sha256 = 'different'; }, s => { s.profile.measureMs = 1000; },
    s => { s.candidates[0].runtime_cleanup.port_released = false; }, s => { s.candidates[0].steps[0].status = 'safety_stop'; }]) {
    const changed = structuredClone(source); mutate(changed); assert.throws(() => validateResumeSource(changed, expected));
  }
});
test('fresh recovery reuses immutable measurements and preserves the original failed cleanup evidence', () => {
  const { source } = resumeFixture(); const original = source.candidates[0], before = JSON.stringify(original);
  const recovery = { status: 'recovered', vram_return: { status: 'observed_returned', tolerance_mib: 64, limit_mib: 2316 } };
  const inherited = recoveredBaseline(original, recovery);
  assert.equal(JSON.stringify(original), before); assert.deepEqual(inherited.steps, original.steps);
  assert.equal(inherited.status, 'completed'); assert.equal(inherited.vram_return_observed, true);
  assert.equal(inherited.vram_return.status, 'observed_returned'); assert.equal(inherited.original_cleanup_failure.vram_return.status, 'timeout');
  assert.equal(inherited.measurements_reused_without_modification, true);
  assert.throws(() => recoveredBaseline(original, { status: 'failed' }), /Fresh approved/);
});
