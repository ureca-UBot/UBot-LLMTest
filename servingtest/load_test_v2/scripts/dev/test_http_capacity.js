'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { summarizeHttpCapacity } = require('./http_capacity');

function record(overrides = {}) {
  return { t_start_rel: 0, t_end_rel: 100, transport_ok: true, http_status: 200, e2e_ms: 100,
    valid: true, schema_valid: true, evidence_valid: true, ...overrides };
}
function records(count, overrides = {}) { return Array.from({ length: count }, () => record(overrides)); }
test('exactly 8 HTTP RPS meets target and 7.99 remains below target', () => {
  const reached = summarizeHttpCapacity(records(800), { startMs: 0, endMs: 100000 });
  const below = summarizeHttpCapacity(records(799), { startMs: 0, endMs: 100000 });
  assert.equal(reached.transport_rps, 8); assert.equal(reached.target_status, 'reached');
  assert.equal(below.transport_rps, 7.99); assert.equal(below.target_status, 'below_target');
});
test('rounding near 8 cannot create a passing result', () => {
  const result = summarizeHttpCapacity(records(80), { startMs: 0, endMs: 10000.00000001 });
  assert(result.transport_rps < 8); assert.equal(result.target_status, 'below_target');
});
test('only admissions inside fixed interval and completions no later than its end count for RPS', () => {
  const input = [record({ t_start_rel: 100, t_end_rel: 110 }), record({ t_start_rel: 999, t_end_rel: 1000 }),
    record({ t_start_rel: 999, t_end_rel: 1001 }), record({ t_start_rel: 99, t_end_rel: 110 }),
    record({ t_start_rel: 1000, t_end_rel: 1001 }), record({ t_start_rel: 100, t_end_rel: 110, warmup: true })];
  const result = summarizeHttpCapacity(input, { startMs: 100, endMs: 1000 }, { minRequests: 2 });
  assert.equal(result.n_total, 3); assert.equal(result.n_http_complete, 3);
  assert.equal(result.n_http_complete_in_window, 2); assert.equal(result.n_http_complete_drain, 1);
  assert.equal(result.transport_rps, 2 / 0.9); assert.equal(result.http_completion_fail_rate, 0);
});
test('latency is diagnostic and never gates the HTTP throughput target', () => {
  const result = summarizeHttpCapacity(records(80, { e2e_ms: 1000000 }), { startMs: 0, endMs: 10000 });
  assert.equal(result.target_status, 'reached'); assert.equal(result.e2e_p95_ms, 1000000);
  assert.equal(result.latency_gate_applied, false); assert.equal(result.quality_gate_applied, false);
  assert.equal(Object.hasOwn(result, 'c_slo'), false); assert.equal(Object.hasOwn(result, 'lambda_slo'), false);
});
test('completed 200 with invalid JSON still counts as HTTP throughput, with quality reference preserved', () => {
  const result = summarizeHttpCapacity(records(80, { valid: false, schema_valid: false, error_type: 'output_schema' }), { startMs: 0, endMs: 10000 });
  assert.equal(result.target_status, 'reached'); assert.equal(result.http_completion_fail_rate, 0);
  assert.equal(result.quality_reference.n_valid, 0); assert.equal(result.quality_reference.schema_failures, 80);
});
test('500 errors, timeouts and incomplete 200 streams do not count as HTTP completions', () => {
  const input = [...records(20), record({ transport_ok: false, http_status: 500, error_type: 'http_error' }),
    record({ transport_ok: false, http_status: 200, error_type: 'stream_incomplete' }),
    record({ transport_ok: false, http_status: null, error_type: 'timeout' }),
    record({ transport_ok: true, http_status: 500 })];
  const result = summarizeHttpCapacity(input, { startMs: 0, endMs: 1000 });
  assert.equal(result.n_http_complete, 20); assert.equal(result.transport_rps, 20);
  assert.equal(result.n_http_completion_fail, 4); assert.equal(result.http_completion_fail_rate, 4 / 24);
  assert.equal(result.timeouts, 1); assert.equal(result.fail_types.http_500, 1);
});
test('missing explicit transport completion, completion time or numeric status is excluded', () => {
  const input = [record({ transport_ok: undefined, ok: true }), record({ transport_ok: 'true' }),
    record({ t_end_rel: null }), record({ t_end_rel: -1 }), record({ http_status: '200' }),
    record({ http_status: null }), record({ client_drop: true })];
  const result = summarizeHttpCapacity(input, { startMs: 0, endMs: 1000 }, { minRequests: 1 });
  assert.equal(result.n_http_complete, 0); assert.equal(result.http_completion_fail_rate, 1);
  assert.equal(result.target_status, 'insufficient_samples'); assert.equal(result.target_reached, null);
});
test('too few measured HTTP completions stays insufficient even when observed RPS exceeds target', () => {
  const result = summarizeHttpCapacity(records(8), { startMs: 0, endMs: 100 }, { minRequests: 20 });
  assert.equal(result.transport_rps, 80); assert.equal(result.target_status, 'insufficient_samples');
  assert.equal(result.sample_sufficient, false); assert.equal(result.target_reached, null);
});
test('drained HTTP completions affect diagnostic latency but cannot reach an interval target', () => {
  const input = [...records(20), ...records(60, { t_end_rel: 11000, e2e_ms: 11000 })];
  const result = summarizeHttpCapacity(input, { startMs: 0, endMs: 10000 });
  assert.equal(result.transport_rps, 2); assert.equal(result.target_status, 'below_target');
  assert.equal(result.n_http_complete_drain, 60); assert.equal(result.http_completion_fail_rate, 0); assert.equal(result.e2e_p95_ms, 11000);
});
test('empty cohort has unknown failure and latency statistics', () => {
  const result = summarizeHttpCapacity([], { startMs: 0, endMs: 1000 });
  assert.equal(result.transport_rps, 0); assert.equal(result.http_completion_fail_rate, null);
  assert.equal(result.e2e_p50_ms, null); assert.equal(result.e2e_p95_ms, null); assert.equal(result.target_status, 'insufficient_samples');
});
test('missing latency is derived from the completed request timings', () => {
  const result = summarizeHttpCapacity([record({ t_start_rel: 2, t_end_rel: 102, e2e_ms: null })],
    { startMs: 0, endMs: 1000 }, { minRequests: 1 });
  assert.equal(result.e2e_p50_ms, 100);
});
test('invalid windows and target parameters are rejected', () => {
  assert.throws(() => summarizeHttpCapacity([], { startMs: 1, endMs: 1 }), /window/);
  assert.throws(() => summarizeHttpCapacity([], { startMs: null, endMs: 1 }), /window/);
  assert.throws(() => summarizeHttpCapacity([], { startMs: 0, endMs: 1 }, { targetRps: 0 }), /targetRps/);
  assert.throws(() => summarizeHttpCapacity([], { startMs: 0, endMs: 1 }, { minRequests: 0 }), /minRequests/);
});
