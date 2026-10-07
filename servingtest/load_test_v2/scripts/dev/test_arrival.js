'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { assessArrival, lateWindowTrend } = require('../lib/arrival');

function fixture() {
  const measureMs = 300000;
  const records = Array.from({ length: 300 }, (_, index) => ({ t_scheduled_rel: index * 1000, lateness_ms: 1, client_drop: false }));
  const regular = Array.from({ length: 301 }, (_, index) => ({ at_ms: index * 1000, pending: 5, queued: 0 }));
  return {
    result: { records, window: { startMs: 0, endMs: measureMs }, scheduledArrivals: 300, offeredArrivals: 300,
      offered_rate: 1, aborted: false, stop_reason: 'completed', drainMs: 50, inFlightSamples: regular },
    summary: { n_total: 300, n_valid: 300, fail_rate: 0, client_drops: 0, lateness_p95_ms: 1,
      scheduled_e2e_p95_ms: 100, valid_rps: 1 },
    options: { measureMs, minSamples: 100, backendSamples: regular, slo: { e2eP95Ms: 5000, failRate: 0.01 } },
  };
}

test('stable client backlog and observed backend queue pass all arrival criteria', () => {
  const { result, summary, options } = fixture();
  const assessment = assessArrival(result, summary, options);
  assert.equal(assessment.status, 'passed');
  assert.equal(assessment.lambda_slo, 1);
  assert.equal(assessment.offered_rate, 1);
  assert.equal(assessment.client_trend.slope_per_sec, 0);
  assert.equal(assessment.backend_queue_trend.endpoint_growth_per_sec, 0);
  assert.equal(assessment.criteria.provisional, true);
  assert.deepEqual(assessment.failure_reasons, []);
  assert.deepEqual(assessment.pending_reasons, []);
});

for (const field of ['pending', 'queued']) {
  test(`growing ${field} fails even when drain later reaches zero`, () => {
    const { result, summary, options } = fixture();
    const growing = result.inFlightSamples.map((point) => ({ ...point, [field]: Math.floor(point.at_ms / 2000) }));
    growing.push({ at_ms: 305000, pending: 0, queued: 0 });
    if (field === 'pending') result.inFlightSamples = growing;
    else options.backendSamples = growing;
    const assessment = assessArrival(result, summary, options);
    assert.equal(assessment.status, 'failed');
    assert.equal(assessment.lambda_slo, null);
    assert.ok(assessment.failure_reasons.includes(field === 'pending' ? 'client_backlog_stability' : 'backend_queue_stability'));
    const trend = field === 'pending' ? assessment.client_trend : assessment.backend_queue_trend;
    assert.ok(trend.slope_per_sec > 0.01);
    assert.ok(trend.endpoint_growth_per_sec > 0.01);
    assert.equal(trend.last_at_ms, 300000);
  });
}

test('regression and endpoint growth both apply, preventing an oscillating endpoint increase from passing', () => {
  const { result, summary, options } = fixture();
  options.backendSamples = result.inFlightSamples.map((sample) => ({ ...sample, queued: sample.at_ms === 300000 ? 10 : 0 }));
  const assessment = assessArrival(result, summary, options);
  assert.equal(assessment.status, 'failed');
  assert.ok(assessment.backend_queue_trend.slope_per_sec < 0.01);
  assert.ok(assessment.backend_queue_trend.endpoint_growth_per_sec > 0.01);
});

test('unknown backend queue remains pending; absence is not a zero queue', () => {
  const { result, summary, options } = fixture();
  options.backendSamples = result.inFlightSamples.map((sample) => ({ at_ms: sample.at_ms, queued: null }));
  const assessment = assessArrival(result, summary, options);
  assert.equal(assessment.status, 'pending');
  assert.equal(assessment.lambda_slo, null);
  assert.ok(assessment.pending_reasons.includes('backend_queue_stability'));
  assert.equal(assessment.backend_queue_trend.slope_per_sec, null);
});

test('few valid requests or backend samples remain pending', () => {
  const a = fixture();
  a.summary.n_valid = 99;
  assert.equal(assessArrival(a.result, a.summary, a.options).status, 'pending');
  const b = fixture();
  b.options.backendSamples = b.options.backendSamples.slice(-9);
  const assessment = assessArrival(b.result, b.summary, b.options);
  assert.equal(assessment.status, 'pending');
  assert.equal(assessment.backend_queue_trend.sample_count, 9);
});

test('irregular samples and poor last-half coverage cannot establish stability', () => {
  const a = fixture();
  a.options.backendSamples = a.options.backendSamples.filter((sample) => sample.at_ms < 200000 || sample.at_ms > 260000);
  const irregular = assessArrival(a.result, a.summary, a.options);
  assert.equal(irregular.status, 'pending');
  assert.equal(irregular.backend_queue_trend.reason, 'insufficient_or_irregular_time_coverage');
  const b = fixture();
  b.result.inFlightSamples = b.result.inFlightSamples.slice(-20);
  const coverage = assessArrival(b.result, b.summary, b.options);
  assert.equal(coverage.status, 'pending');
  assert.ok(coverage.client_trend.coverage_ratio < 0.8);
});

for (const [name, modify, reason] of [
  ['client drops', (f) => { f.summary.client_drops = 1; }, 'no_client_drops'],
  ['late arrivals', (f) => { f.summary.lateness_p95_ms = 51; }, 'arrival_timing'],
  ['scheduled latency', (f) => { f.summary.scheduled_e2e_p95_ms = 5001; }, 'scheduled_latency'],
  ['failure rate', (f) => { f.summary.fail_rate = 0.02; }, 'failure_rate'],
  ['completion deficit', (f) => { f.summary.valid_rps = 0.98; }, 'sustained_valid_completion_rate'],
  ['aborted admission', (f) => { f.result.aborted = true; f.result.stop_reason = 'aborted'; }, 'admission_complete'],
  ['missing scheduled request', (f) => { f.result.records.pop(); f.result.offeredArrivals -= 1; }, 'admission_complete'],
  ['mismatched observation window', (f) => { f.result.window.endMs -= 1; }, 'admission_complete'],
]) {
  test(`${name} prevents an arrival pass`, () => {
    const f = fixture();
    modify(f);
    const assessment = assessArrival(f.result, f.summary, f.options);
    assert.equal(assessment.status, 'failed');
    assert.equal(assessment.lambda_slo, null);
    assert.ok(assessment.failure_reasons.includes(reason));
  });
}

test('a confirmed failure takes precedence over unknown queue evidence', () => {
  const { result, summary, options } = fixture();
  summary.fail_rate = 0.5;
  options.backendSamples = [];
  const assessment = assessArrival(result, summary, options);
  assert.equal(assessment.status, 'failed');
  assert.ok(assessment.pending_reasons.includes('backend_queue_stability'));
});

test('completion threshold uses scheduled offered rate and permits only the configured failure allowance', () => {
  const { result, summary, options } = fixture();
  summary.valid_rps = 0.99;
  assert.equal(assessArrival(result, summary, options).status, 'passed');
  summary.valid_rps = 0.989;
  assert.equal(assessArrival(result, summary, options).status, 'failed');
});

test('stable 5-second pipeline over 300 seconds gets an exact finite boundary allowance', () => {
  const { result, summary, options } = fixture();
  result.records = result.records.map((record, index) => ({ ...record,
    t_scheduled_rel: 500 + index * 1000, t_start_rel: 500 + index * 1000,
    t_end_rel: 5500 + index * 1000,
  }));
  summary.valid_rps = 295 / 300;
  summary.scheduled_e2e_p95_ms = 5000;
  const assessment = assessArrival(result, summary, options);
  assert.equal(assessment.status, 'passed');
  const rate = assessment.checks.sustained_valid_completion_rate;
  assert.equal(rate.pending_at_admission_end, 5);
  assert.equal(rate.required_rps, 292 / 300);
  assert.equal(rate.valid_completion_rps, 295 / 300);
  assert.equal(rate.drain_completions_in_measured_rps, false);
});

test('boundary pipeline allowance never substitutes for a stable queue or eventual response validity', () => {
  const f = fixture();
  f.result.records = f.result.records.map((record, index) => ({ ...record,
    t_start_rel: index * 1000, t_end_rel: index * 1000 + 20000,
  }));
  f.summary.valid_rps = 282 / 300;
  f.options.backendSamples = f.options.backendSamples.map((sample) => ({ ...sample, queued: sample.at_ms / 2000 }));
  let assessment = assessArrival(f.result, f.summary, f.options);
  assert.equal(assessment.checks.sustained_valid_completion_rate.status, 'passed');
  assert.equal(assessment.status, 'failed');
  assert.ok(assessment.failure_reasons.includes('backend_queue_stability'));
  f.options.backendSamples = fixture().options.backendSamples;
  f.summary.fail_rate = 0.02;
  assessment = assessArrival(f.result, f.summary, f.options);
  assert.equal(assessment.status, 'failed');
  assert.ok(assessment.failure_reasons.includes('failure_rate'));
});

test('client-dropped requests cannot add a boundary allowance', () => {
  const { result, summary, options } = fixture();
  result.records[0] = { ...result.records[0], client_drop: true, t_start_rel: null, t_end_rel: 301000 };
  summary.client_drops = 1;
  const assessment = assessArrival(result, summary, options);
  assert.equal(assessment.checks.sustained_valid_completion_rate.pending_at_admission_end, 0);
  assert.equal(assessment.status, 'failed');
});

test('slope tolerances are explicit and configurable, and declining queues pass', () => {
  const { result, summary, options } = fixture();
  options.backendSamples = result.inFlightSamples.map((sample) => ({ ...sample, queued: 300 - sample.at_ms / 1000 }));
  const declining = assessArrival(result, summary, options);
  assert.equal(declining.status, 'passed');
  assert.equal(declining.backend_queue_trend.slope_per_sec, -1);
  options.backendSamples = result.inFlightSamples.map((sample) => ({ ...sample, queued: sample.at_ms / 100000 }));
  options.queueTolerancePerSec = 0.02;
  assert.equal(assessArrival(result, summary, options).status, 'passed');
  options.queueTolerancePerSec = 0.001;
  assert.equal(assessArrival(result, summary, options).status, 'failed');
});

test('invalid criteria are rejected, and trend sample boundaries exclude drain', () => {
  const { result, summary, options } = fixture();
  assert.throws(() => assessArrival(result, summary, { ...options, measureMs: 0 }), /Invalid/);
  assert.throws(() => assessArrival(result, summary, { ...options, minBackendSamples: 1 }), /Invalid/);
  const trend = lateWindowTrend([...options.backendSamples, { at_ms: 310000, queued: 999 }], {
    startMs: 0, endMs: 300000, field: 'queued', minSamples: 10, tolerancePerSec: 0.01,
  });
  assert.equal(trend.status, 'passed');
  assert.equal(trend.last_at_ms, 300000);
});
