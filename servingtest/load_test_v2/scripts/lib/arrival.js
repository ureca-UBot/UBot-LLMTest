'use strict';

// Open-loop stability uses observations made while arrivals are admitted.
// Drain snapshots are deliberately excluded: every finite queue eventually
// falling to zero after admission stops does not prove sustainable throughput.
const { percentile } = require('./stats');

function lateWindowTrend(samples, { startMs, endMs, field, minSamples, tolerancePerSec, minCoverageRatio = 0.8, maxGapFactor = 3 }) {
  const lateStart = startMs + (endMs - startMs) / 2;
  const valid = (Array.isArray(samples) ? samples : []).filter((sample) =>
    Number.isFinite(sample?.at_ms) && sample.at_ms >= lateStart && sample.at_ms <= endMs
    && Number.isFinite(sample[field]) && sample[field] >= 0);
  const byTime = new Map();
  for (const sample of valid) byTime.set(sample.at_ms, sample[field]);
  const points = [...byTime].map(([at_ms, value]) => ({ at_ms, value })).sort((a, b) => a.at_ms - b.at_ms);
  const result = {
    status: 'pending', basis: 'regular_samples_during_last_half_of_admission', field,
    sample_count: points.length, required_samples: minSamples, window_start_ms: lateStart, window_end_ms: endMs,
    slope_per_sec: null, endpoint_growth_per_sec: null, first_value: null, last_value: null,
    first_at_ms: null, last_at_ms: null, coverage_ratio: 0, median_gap_ms: null, max_gap_ms: null,
    tolerance_per_sec: tolerancePerSec, reason: null,
  };
  if (points.length < minSamples) { result.reason = 'insufficient_known_regular_samples'; return result; }
  const first = points[0], last = points.at(-1);
  const span = last.at_ms - first.at_ms;
  const gaps = points.slice(1).map((point, index) => point.at_ms - points[index].at_ms);
  const medianGap = percentile(gaps, 0.5);
  const maxGap = Math.max(...gaps);
  Object.assign(result, {
    first_value: first.value, last_value: last.value, first_at_ms: first.at_ms, last_at_ms: last.at_ms,
    coverage_ratio: span / (endMs - lateStart), median_gap_ms: medianGap, max_gap_ms: maxGap,
  });
  if (!(span > 0) || result.coverage_ratio < minCoverageRatio || !(medianGap > 0)
    || maxGap > medianGap * maxGapFactor || first.at_ms - lateStart > medianGap * maxGapFactor
    || endMs - last.at_ms > medianGap * maxGapFactor) {
    result.reason = 'insufficient_or_irregular_time_coverage';
    return result;
  }
  // Centre both axes before regression, keeping the numerical scale small.
  const xs = points.map((point) => (point.at_ms - first.at_ms) / 1000);
  const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
  const meanY = points.reduce((sum, point) => sum + point.value, 0) / points.length;
  const denominator = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
  result.slope_per_sec = xs.reduce((sum, x, index) => sum + (x - meanX) * (points[index].value - meanY), 0) / denominator;
  result.endpoint_growth_per_sec = (last.value - first.value) * 1000 / span;
  const stable = result.slope_per_sec <= tolerancePerSec && result.endpoint_growth_per_sec <= tolerancePerSec;
  result.status = stable ? 'passed' : 'failed';
  result.reason = stable ? 'no_growth_beyond_provisional_tolerance' : 'backlog_growth_beyond_provisional_tolerance';
  return result;
}

function assessArrival(result, summary, {
  measureMs, minSamples = 100, slo = { e2eP95Ms: 5000, failRate: 0.01 }, backendSamples = [],
  clientTolerancePerSec = 0.01, queueTolerancePerSec = 0.01,
  minBackendSamples = 10, minClientSamples = 10, maxLatenessP95Ms = 50,
  minCoverageRatio = 0.8, maxGapFactor = 3,
} = {}) {
  const latencyLimit = slo.e2eP95Ms ?? slo.e2e_p95_ms;
  const failureLimit = slo.failRate ?? slo.fail_rate;
  if (!(Number.isFinite(measureMs) && measureMs > 0) || !Number.isInteger(minSamples) || minSamples < 1
    || !(latencyLimit > 0) || !(failureLimit >= 0 && failureLimit < 1)
    || ![clientTolerancePerSec, queueTolerancePerSec, maxLatenessP95Ms].every((n) => Number.isFinite(n) && n >= 0)
    || ![minBackendSamples, minClientSamples].every((n) => Number.isInteger(n) && n >= 2)
    || !(minCoverageRatio > 0 && minCoverageRatio <= 1) || !(maxGapFactor >= 1)) throw new TypeError('Invalid arrival assessment options');
  const startMs = Number.isFinite(result?.window?.startMs) ? result.window.startMs : 0;
  const endMs = startMs + measureMs;
  const records = Array.isArray(result?.records) ? result.records : [];
  const scheduled = records.filter((record) => Number.isFinite(record.t_scheduled_rel)
    && record.t_scheduled_rel >= startMs && record.t_scheduled_rel < endMs);
  const scheduledCount = result?.scheduledArrivals;
  const rateKnown = Number.isInteger(scheduledCount) && scheduledCount > 0;
  const offeredRate = rateKnown ? scheduledCount * 1000 / measureMs : null;
  const completeCount = Number.isInteger(result?.offeredArrivals) ? result.offeredArrivals : scheduled.length;
  const clientDrops = summary?.client_drops ?? scheduled.filter((record) => record.client_drop).length;
  const lateness = summary?.lateness_p95_ms ?? percentile(scheduled.map((record) => record.lateness_ms), 0.95);
  const trendOptions = { startMs, endMs, minCoverageRatio, maxGapFactor };
  const clientTrend = lateWindowTrend(result?.inFlightSamples, { ...trendOptions, field: 'pending', minSamples: minClientSamples, tolerancePerSec: clientTolerancePerSec });
  const backendTrend = lateWindowTrend(backendSamples, { ...trendOptions, field: 'queued', minSamples: minBackendSamples, tolerancePerSec: queueTolerancePerSec });
  const checks = {};
  const failureReasons = [], pendingReasons = [];
  function check(name, status, evidence) {
    checks[name] = { status: status === null ? 'pending' : status ? 'passed' : 'failed', ...evidence };
    if (status === false) failureReasons.push(name);
    if (status === null) pendingReasons.push(name);
  }
  const sampleSufficient = Number.isInteger(summary?.n_total) && Number.isInteger(summary?.n_valid)
    && summary.n_total >= minSamples && summary.n_valid >= minSamples;
  check('request_sample', sampleSufficient ? true : null, { n_total: summary?.n_total ?? null, n_valid: summary?.n_valid ?? null, minimum: minSamples });
  const windowMatches = !result?.window || Number.isFinite(result.window.endMs)
    && Math.abs(result.window.endMs - endMs) < 1e-6;
  const runComplete = result?.aborted === false && result?.stop_reason === 'completed';
  check('admission_complete', runComplete && windowMatches && rateKnown
    ? completeCount === scheduledCount && scheduled.length === scheduledCount
      && (!Number.isFinite(result.offered_rate) || Math.abs(result.offered_rate - offeredRate) < 1e-6)
    : !runComplete || !windowMatches ? false : null,
  { scheduled_arrivals: rateKnown ? scheduledCount : null, recorded_arrivals: scheduled.length, aborted: result?.aborted ?? null });
  check('no_client_drops', Number.isInteger(clientDrops) ? clientDrops === 0 : null, { count: clientDrops });
  check('arrival_timing', Number.isFinite(lateness) ? lateness <= maxLatenessP95Ms : null,
    { lateness_p95_ms: Number.isFinite(lateness) ? lateness : null, provisional_limit_ms: maxLatenessP95Ms });
  check('failure_rate', Number.isFinite(summary?.fail_rate) && summary.n_total >= minSamples ? summary.fail_rate <= failureLimit : null,
    { observed: summary?.fail_rate ?? null, limit: failureLimit });
  check('scheduled_latency', sampleSufficient && Number.isFinite(summary?.scheduled_e2e_p95_ms)
    ? summary.scheduled_e2e_p95_ms <= latencyLimit : null,
  { p95_ms: summary?.scheduled_e2e_p95_ms ?? null, limit_ms: latencyLimit, basis: 'scheduled_arrival_to_stream_end' });
  // A stable pipeline can contain requests admitted shortly before the window
  // ends. Allow exactly that boundary cohort without counting drain successes
  // in measured throughput. Their eventual validity still affects fail_rate,
  // while growth/latency checks prevent a growing queue using this allowance.
  const pendingAtAdmissionEnd = scheduled.filter((record) => record.client_drop !== true
    && Number.isFinite(record.t_start_rel) && record.t_start_rel < endMs
    && Number.isFinite(record.t_end_rel) && record.t_end_rel > endMs).length;
  const minimumCompletionRate = offeredRate === null ? null
    : Math.max(0, scheduledCount * (1 - failureLimit) - pendingAtAdmissionEnd) * 1000 / measureMs;
  check('sustained_valid_completion_rate', sampleSufficient && Number.isFinite(summary?.valid_rps) && minimumCompletionRate !== null
    ? summary.valid_rps + Number.EPSILON * Math.max(1, minimumCompletionRate) >= minimumCompletionRate : null,
  { valid_completion_rps: summary?.valid_rps ?? null, required_rps: minimumCompletionRate,
    pending_at_admission_end: pendingAtAdmissionEnd,
    basis: 'in_window_valid_completions_vs_scheduled_arrivals_minus_actual_boundary_inflight',
    drain_completions_in_measured_rps: false });
  check('client_backlog_stability', clientTrend.status === 'pending' ? null : clientTrend.status === 'passed', { trend: clientTrend });
  check('backend_queue_stability', backendTrend.status === 'pending' ? null : backendTrend.status === 'passed', { trend: backendTrend });
  const status = failureReasons.length ? 'failed' : pendingReasons.length ? 'pending' : 'passed';
  return {
    status, lambda_slo: status === 'passed' ? offeredRate : null, offered_rate: offeredRate,
    checks, failure_reasons: failureReasons, pending_reasons: pendingReasons,
    client_trend: clientTrend, backend_queue_trend: backendTrend,
    criteria: {
      provisional: true, e2e_p95_ms: latencyLimit, fail_rate: failureLimit, min_requests: minSamples,
      client_growth_tolerance_per_sec: clientTolerancePerSec, backend_queue_growth_tolerance_per_sec: queueTolerancePerSec,
      min_client_samples: minClientSamples, min_backend_samples: minBackendSamples,
      lateness_p95_limit_ms: maxLatenessP95Ms, min_last_half_coverage_ratio: minCoverageRatio, max_sample_gap_factor: maxGapFactor,
    },
    drain_ms: Number.isFinite(result?.drainMs) ? result.drainMs : null,
    limitation: 'A pass is limited to this measured duration/rate and provisional tolerances. Unknown backend queue observations keep the result pending; no queue time is inferred.',
  };
}

module.exports = { assessArrival, lateWindowTrend };
