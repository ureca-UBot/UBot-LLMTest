'use strict';

const assert = require('node:assert/strict');
const { runClosedLoop, runOpenLoop, sleep } = require('../lib/load_generator');
const { summarizeRecords, capacityFromSteps } = require('../lib/stats');

function cursor() {
  let sequence = 0;
  return { next: () => ({ caseId: `case-${sequence++}` }) };
}

const good = (overrides = {}) => ({
  transport_ok: true, valid: true, contract_valid: true,
  schema_valid: true, evidence_valid: true, truncated: false,
  eval_count: 12, ttft_ms: 1, ...overrides,
});

async function main() {
  let current = 0;
  let warmupComplete = 0;
  const warmup = await runClosedLoop({
    users: 3, cursor: cursor(), measureMs: 40, warmupRequestsPerUser: 2,
    send: async (_item, options) => {
      if (options.warmup) {
        await sleep(3 + current++ % 3);
        warmupComplete += 1;
      } else {
        assert.equal(warmupComplete, 6, 'every user must pass the barrier before measurement');
        await sleep(5);
      }
      return good();
    },
  });
  assert.equal(warmup.warmupReached, true);
  assert.equal(warmup.warmupFailed, false);
  assert.equal(warmup.maxInFlight, 3);
  assert.equal(warmup.warmupSummary.reduce((n, s) => n + s.completed, 0), 6);
  assert(warmup.records.every((r) => r.t_start_rel >= warmup.window.startMs));
  assert(warmup.records.every((r) => r.t_start_rel < warmup.window.endMs));

  const slow = await runClosedLoop({
    users: 2, cursor: cursor(), measureMs: 25, warmupRequestsPerUser: 0,
    minRequests: 999, maxStepMs: 1000,
    send: async () => { await sleep(65); return good(); },
  });
  assert.equal(slow.window.endMs - slow.window.startMs, 25, 'min count must not extend fixed window');
  assert.equal(slow.records.length, 2, 'no replacement requests after deadline');
  assert(slow.drainMs >= 30, 'requests started before deadline drain normally');
  const slowStats = summarizeRecords(slow.records, slow.window);
  assert.equal(slowStats.n_valid, 2);
  assert.equal(slowStats.valid_rps, 0, 'drain completions are excluded from throughput');
  assert.equal(slowStats.drain_completions, 2);
  assert(slowStats.e2e_p95_ms >= 60, 'drain completions remain in latency population');
  assert.equal(slowStats.sample_sufficient, false);
  assert.equal(slowStats.performance_pass, null);

  const failingWarmup = await runClosedLoop({
    users: 2, cursor: cursor(), measureMs: 50,
    send: async () => ({ transport_ok: false, valid: false, error_type: 'http_error' }),
  });
  assert.equal(failingWarmup.records.length, 0);
  assert.equal(failingWarmup.warmupReached, false);
  assert.equal(failingWarmup.warmupFailed, true);
  assert.equal(failingWarmup.stop_reason, 'warmup_failure');

  const timeoutWarmup = await runClosedLoop({
    users: 1, cursor: cursor(), measureMs: 50, warmupTimeoutMs: 15,
    send: (_item, { signal }) => new Promise((resolve) => {
      signal.addEventListener('abort', () => resolve({ transport_ok: false, valid: false }), { once: true });
    }),
  });
  assert.equal(timeoutWarmup.stop_reason, 'warmup_timeout');
  assert.equal(timeoutWarmup.records.length, 0);
  assert(timeoutWarmup.elapsedMs < 100);

  const aborted = new AbortController();
  const cancelTimer = setTimeout(() => aborted.abort(new Error('mock cancellation')), 25);
  const cancelled = await runClosedLoop({
    users: 1, cursor: cursor(), measureMs: 200, warmupRequestsPerUser: 0,
    signal: aborted.signal,
    send: (_item, { signal }) => new Promise((resolve) => {
      signal.addEventListener('abort', () => resolve({ transport_ok: false, valid: false }), { once: true });
    }),
  });
  clearTimeout(cancelTimer);
  assert.equal(cancelled.aborted, true);
  assert.equal(cancelled.stop_reason, 'aborted');
  assert(cancelled.elapsedMs < 150, 'explicit cancellation is independent of the fixed measurement deadline');

  const allFailure = await runClosedLoop({
    users: 1, cursor: cursor(), measureMs: 50, warmupRequestsPerUser: 0,
    send: async () => { await sleep(5); throw new Error('unexpected client error'); },
  });
  assert(allFailure.records.length >= 2, 'errors do not trigger automatic fail-rate stop');
  assert(allFailure.elapsedMs >= 50, 'the full fixed observation window is preserved');
  assert.equal(allFailure.stop_reason, 'completed');
  assert(allFailure.records.every((r) => r.error_type === 'send_exception'));

  const plateauA = await runClosedLoop({
    users: 1, cursor: cursor(), measureMs: 45, warmupRequestsPerUser: 0,
    send: async () => { await sleep(10); return good(); },
  });
  const plateauB = await runClosedLoop({
    users: 4, cursor: cursor(), measureMs: 45, warmupRequestsPerUser: 0,
    send: async () => { await sleep(40); return good(); },
  });
  assert.equal(plateauA.stop_reason, 'completed');
  assert.equal(plateauB.stop_reason, 'completed');
  assert.equal(plateauB.window.endMs - plateauB.window.startMs, 45);

  const observations = [
    { ...good(), t_start_rel: 10, t_end_rel: 30, e2e_ms: 20 },
    { ...good({ eval_count: null }), t_start_rel: 20, t_end_rel: 60, e2e_ms: 40 },
    { ...good({ valid: false, schema_valid: false }), t_start_rel: 30, t_end_rel: 70, e2e_ms: 40 },
    { ...good({ valid: false, evidence_valid: false }), t_start_rel: 40, t_end_rel: 90, e2e_ms: 50 },
    { ...good({ valid: false, truncated: true }), t_start_rel: 50, t_end_rel: 120, e2e_ms: 70 },
    { transport_ok: false, valid: false, t_start_rel: 80, t_end_rel: 160, e2e_ms: 80 },
    { ...good(), t_start_rel: -5, t_end_rel: 10, e2e_ms: 15 },
  ];
  const stats = summarizeRecords(observations, { startMs: 0, endMs: 100 }, { minValidRequests: 2 });
  assert.equal(stats.n_total, 6, 'pre-window starts are excluded');
  assert.equal(stats.n_transport_ok, 5);
  assert.equal(stats.n_valid, 2, 'HTTP 200 invalid bodies are not valid throughput');
  assert.equal(stats.valid_rps, 20);
  assert.equal(stats.transport_rps, 40);
  assert.equal(stats.unknown_tokens, 1);
  assert.equal(stats.output_tok_s, null, 'missing usage cannot be replaced by content chunk count');
  assert.equal(stats.schema_failures, 1);
  assert.equal(stats.evidence_failures, 1);
  assert.equal(stats.truncations, 1);
  assert.equal(stats.performance_pass, false);
  assert.equal(stats.drain_completions, 2);
  const known = summarizeRecords(observations.slice(0, 1), { startMs: 0, endMs: 100 }, { minValidRequests: 1 });
  assert.equal(known.output_tok_s, 120);
  assert.equal(known.performance_pass, true);
  const overflowStats = summarizeRecords([{ ...good({ input_budget_exceeded: true }),
    t_start_rel: 10, t_end_rel: 30, e2e_ms: 20,
  }], { startMs: 0, endMs: 100 }, { minValidRequests: 1 });
  assert.equal(overflowStats.n_valid, 0);
  assert.equal(overflowStats.valid_rps, 0);
  assert.equal(overflowStats.input_budget_failures, 1);

  const overload = await runOpenLoop({
    rate: 200, durationMs: 200, seed: 'repeatable', maxInFlight: 2,
    cursor: cursor(),
    send: async () => { await sleep(100); return good(); },
  });
  assert(overload.scheduledArrivals >= 25);
  assert(overload.scheduledArrivals <= 65);
  assert.equal(overload.offeredArrivals, overload.scheduledArrivals);
  assert.equal(overload.maxInFlight, 2);
  assert(overload.records.some((r) => r.client_drop), 'overload is recorded, not hidden by waiting for completions');
  assert(overload.records.filter((r) => !r.client_drop).every((r) => r.t_send_rel < 200));
  assert(overload.inFlightSamples.every((s) => s.pending >= 0 && s.pending <= 2));
  const overloadedStats = summarizeRecords(overload.records, overload.window, { minValidRequests: 1 });
  assert.equal(overloadedStats.client_drops, overload.records.filter((r) => r.client_drop).length);
  assert.equal(overloadedStats.n_total, overload.scheduledArrivals);
  assert.equal(overloadedStats.performance_pass, false);
  const repeated = await runOpenLoop({
    rate: 200, durationMs: 200, seed: 'repeatable', maxInFlight: 100,
    cursor: cursor(), send: async () => good(),
  });
  assert.deepEqual(overload.records.map((r) => r.t_scheduled_rel).sort((a, b) => a - b),
    repeated.records.map((r) => r.t_scheduled_rel).sort((a, b) => a - b),
    'offered schedule depends on seed and rate, not server completion speed');

  const passingSummary = { sample_sufficient: true, performance_pass: true };
  const failedSummary = { sample_sufficient: true, performance_pass: false };
  const formalSteps = [1, 2, 3].flatMap((repeat) => [
    { users: 1, repeat, summary: passingSummary },
    { users: 4, repeat, summary: passingSummary },
    { users: 8, repeat, summary: failedSummary },
  ]);
  const pendingQuality = capacityFromSteps(formalSteps, { expectedUsers: [1, 4, 8] });
  assert.equal(pendingQuality.c_slo, null);
  assert.equal(pendingQuality.c_performance_candidate, 4);
  assert.equal(pendingQuality.status, 'quality_pending');
  const formal = capacityFromSteps(formalSteps, {
    expectedUsers: [1, 4, 8], semanticQualityStatus: 'passed',
  });
  assert.equal(formal.c_slo, 4);
  assert.equal(formal.status, 'complete');
  for (const cleanupFailure of [{ status: 'cleanup_failed' }, { status: 'completed', cleanup_verified: false }]) {
    const uncleanSteps = [1, 2, 3].map((repeat) => ({
      users: 4, repeat, phase: 'confirm', status: 'completed', cleanup_verified: true,
      summary: passingSummary, ...(repeat === 3 ? cleanupFailure : {}),
    }));
    const unclean = capacityFromSteps(uncleanSteps, {
      expectedUsers: [4], semanticQualityStatus: 'passed',
    });
    assert.equal(unclean.c_slo, null, 'cleanup failure blocks final capacity despite passing request metrics');
    assert.equal(unclean.c_slo_lower_bound, null);
    assert.equal(unclean.c_performance_confirmed, null);
    assert.equal(unclean.c_performance_lower_bound, null, 'unclean repetitions cannot establish a lower bound');
    assert.equal(unclean.c_performance_candidate, null, 'unclean repetitions cannot nominate a candidate');
    assert.equal(unclean.groups[0].complete, true);
    assert.equal(unclean.groups[0].sufficient, false);
    assert.equal(unclean.groups[0].observed_performance_pass, false);
    assert.equal(unclean.status, 'insufficient_samples');
    const uncleanScreen = capacityFromSteps([{ ...uncleanSteps[2], phase: 'screen' }], {
      expectedUsers: [4], semanticQualityStatus: 'passed',
    });
    assert.equal(uncleanScreen.c_performance_candidate, null, 'screen nominations also require clean engine shutdown');
  }
  const missingRepeat = capacityFromSteps(formalSteps.filter((s) => !(s.users === 8 && s.repeat === 3)), {
    expectedUsers: [1, 4, 8], semanticQualityStatus: 'passed',
  });
  assert.equal(missingRepeat.c_slo, null, 'missing failure-side repeat must not be inferred');
  assert.equal(missingRepeat.status, 'incomplete_repeats');
  const wrongLabel = capacityFromSteps(formalSteps.map((s) => s.repeat === 2 ? { ...s, repeat: 4 } : s), {
    expectedUsers: [1, 4, 8], semanticQualityStatus: 'passed',
  });
  assert.equal(wrongLabel.c_slo, null, 'three arbitrary labels cannot substitute for repeats 1..3');
  const missingUsers = capacityFromSteps(formalSteps, {
    expectedUsers: [1, 4, 8, 16], semanticQualityStatus: 'passed',
  });
  assert.equal(missingUsers.c_slo, null);
  const screen = capacityFromSteps([{ users: 4, repeat: 1, summary: passingSummary }], {
    semanticQualityStatus: 'passed',
  });
  assert.equal(screen.c_slo, null, 'one screening run cannot establish final capacity');
  assert.equal(screen.c_performance_candidate, 4);
  const screensOnly = capacityFromSteps([1, 2, 3].map((repeat) => ({
    users: 4, repeat, phase: 'screen', summary: passingSummary,
  })), { semanticQualityStatus: 'passed' });
  assert.equal(screensOnly.c_slo, null, 'screening phases cannot substitute for formal confirmation');
  const mixedPhases = capacityFromSteps([
    ...formalSteps, { users: 4, repeat: 1, phase: 'screen', summary: passingSummary },
  ], { expectedUsers: [1, 4, 8], semanticQualityStatus: 'passed' });
  assert.equal(mixedPhases.c_slo, 4, 'screen repeat 1 must not collide with independent confirmation repeat 1');
  const allFailCapacity = capacityFromSteps([1, 2, 3].map((repeat) => ({
    users: 1, repeat, summary: failedSummary,
  })), { semanticQualityStatus: 'passed' });
  assert.equal(allFailCapacity.c_slo, null);
  assert.equal(allFailCapacity.c_performance_candidate, null);
  assert.equal(allFailCapacity.status, 'no_slo_pass');
  const insufficient = capacityFromSteps(formalSteps.map((s) => s.users === 8
    ? { ...s, summary: { sample_sufficient: false, performance_pass: null } } : s), {
    expectedUsers: [1, 4, 8], semanticQualityStatus: 'passed',
  });
  assert.equal(insufficient.c_slo, null);
  assert.equal(insufficient.status, 'insufficient_samples');
  assert.equal(insufficient.c_performance_lower_bound, 4,
    'insufficient highest U must not erase completely verified lower passing U');
  assert.equal(insufficient.c_slo_lower_bound, 4);
  const insufficientPendingQuality = capacityFromSteps(formalSteps.map((s) => s.users === 8
    ? { ...s, summary: { sample_sufficient: false, performance_pass: null } } : s), {
    expectedUsers: [1, 4, 8], semanticQualityStatus: 'pending',
  });
  assert.equal(insufficientPendingQuality.c_slo, null);
  assert.equal(insufficientPendingQuality.c_slo_lower_bound, null,
    'semantic quality must also gate the verified lower bound');
  assert.equal(insufficientPendingQuality.c_performance_lower_bound, 4);
  const zeroSuccesses = summarizeRecords(Array.from({ length: 100 }, (_, i) => ({
    transport_ok: false, valid: false, t_start_rel: i, t_end_rel: i + 1, e2e_ms: 1,
  })), { startMs: 0, endMs: 1000 });
  assert.equal(zeroSuccesses.e2e_p95_ms, null);
  assert.equal(zeroSuccesses.sample_sufficient, false);
  assert.equal(zeroSuccesses.performance_pass, null);
  assert.equal(zeroSuccesses.fail_rate_sample_sufficient, true);
  assert.equal(zeroSuccesses.fail_rate_pass, false);
  assert.equal(zeroSuccesses.performance_failure_confirmed, true,
    'failure-rate evidence remains explicit despite insufficient valid latency samples');

  console.log('measurement tests: passed (fixed windows, warmup barrier, drain, Poisson arrivals, validation, repetitions)');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
