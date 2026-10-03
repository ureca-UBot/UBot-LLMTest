'use strict';

function percentile(values, p) {
  const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const position = (sorted.length - 1) * p;
  const low = Math.floor(position);
  const high = Math.ceil(position);
  return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
}

function mean(values) {
  const finite = values.filter((v) => Number.isFinite(v));
  return finite.length ? finite.reduce((sum, v) => sum + v, 0) / finite.length : null;
}

function round(value, digits = 3) {
  return Number.isFinite(value) ? Math.round(value * 10 ** digits) / 10 ** digits : null;
}

const transportOK = (r) => (r.transport_ok ?? r.ok) === true;
const schemaOK = (r) => r.schema_valid ?? r.schema_ok;
const evidenceOK = (r) => r.evidence_valid ?? r.evidence_ok;
const valid = (r) => transportOK(r) && r.valid === true && r.contract_valid !== false
  && schemaOK(r) !== false && evidenceOK(r) !== false && r.truncated !== true
  && r.reasoning_leak !== true && r.input_truncated !== true && r.input_budget_exceeded !== true;
const tokens = (r) => {
  const value = r.eval_count ?? r.output_tokens;
  return Number.isInteger(value) && value >= 0 ? value : null;
};

function summarizeRecords(records, window, {
  minValidRequests = 100, slo = { e2eP95Ms: 5000, failRate: 0.01 },
} = {}) {
  if (!window || !Number.isFinite(window.startMs) || !Number.isFinite(window.endMs)
      || window.endMs <= window.startMs) {
    throw new TypeError('window must contain finite startMs < endMs');
  }
  if (!Number.isInteger(minValidRequests) || minValidRequests < 1) {
    throw new TypeError('minValidRequests must be a positive integer');
  }
  const measured = records.filter((r) => {
    const start = r.client_drop ? r.t_scheduled_rel : r.t_start_rel;
    return Number.isFinite(start) && start >= window.startMs && start < window.endMs;
  });
  const transport = measured.filter(transportOK);
  const successes = measured.filter(valid);
  const completedInWindow = (r) => r.client_drop !== true && Number.isFinite(r.t_end_rel)
    && r.t_end_rel >= window.startMs && r.t_end_rel <= window.endMs;
  const doneValid = successes.filter(completedInWindow);
  const doneTransport = transport.filter(completedInWindow);
  const unknown = successes.filter((r) => tokens(r) === null).length;
  const tokenUsageComplete = doneValid.length > 0 && doneValid.every((r) => tokens(r) !== null);
  const seconds = (window.endMs - window.startMs) / 1000;
  const nFail = measured.length - successes.length;
  const failRate = measured.length ? nFail / measured.length : null;
  const e2eP95 = percentile(successes.map((r) => r.e2e_ms), 0.95);
  const sampleSufficient = successes.length >= minValidRequests
    && successes.every((r) => Number.isFinite(r.e2e_ms));
  const failRateSampleSufficient = measured.length >= minValidRequests;
  const latencyLimit = slo.e2eP95Ms ?? 5000;
  const failureLimit = slo.failRate ?? 0.01;
  const failTypes = {};
  for (const record of measured.filter((r) => !valid(r))) {
    const kind = record.error_type || (record.truncated ? 'truncated'
      : schemaOK(record) === false ? 'schema_invalid'
        : evidenceOK(record) === false ? 'evidence_invalid' : 'invalid_response');
    failTypes[kind] = (failTypes[kind] || 0) + 1;
  }
  return {
    n_total: measured.length, n_transport_ok: transport.length, n_valid: successes.length,
    n_fail: nFail, fail_rate: round(failRate, 6),
    transport_fail_rate: measured.length ? round((measured.length - transport.length) / measured.length, 6) : null,
    schema_failures: measured.filter((r) => schemaOK(r) === false).length,
    evidence_failures: measured.filter((r) => evidenceOK(r) === false).length,
    truncations: measured.filter((r) => r.truncated === true).length,
    input_truncations: measured.filter((r) => r.input_truncated === true).length,
    input_budget_failures: measured.filter((r) => r.input_budget_exceeded === true).length,
    unknown_tokens: unknown, fail_types: failTypes, window_sec: seconds,
    ttft_p50_ms: round(percentile(successes.map((r) => r.ttft_ms), 0.5)),
    ttft_p95_ms: round(percentile(successes.map((r) => r.ttft_ms), 0.95)),
    e2e_p50_ms: round(percentile(successes.map((r) => r.e2e_ms), 0.5)),
    e2e_p95_ms: round(e2eP95),
    e2e_p95_all_ms: round(percentile(measured.map((r) => r.e2e_ms), 0.95)),
    valid_rps: round(doneValid.length / seconds, 6),
    transport_rps: round(doneTransport.length / seconds, 6),
    output_tok_s: tokenUsageComplete ? round(doneValid.reduce((n, r) => n + tokens(r), 0) / seconds, 6) : null,
    out_tokens_avg: round(mean(successes.map(tokens))),
    out_tokens_p95: round(percentile(successes.map(tokens), 0.95)),
    n_completed_in_window: measured.filter(completedInWindow).length,
    n_valid_completed_in_window: doneValid.length,
    drain_completions: measured.filter((r) => r.client_drop !== true
      && Number.isFinite(r.t_end_rel) && r.t_end_rel > window.endMs).length,
    valid_drain_completions: successes.filter((r) => Number.isFinite(r.t_end_rel) && r.t_end_rel > window.endMs).length,
    client_drops: measured.filter((r) => r.client_drop === true).length,
    lateness_p95_ms: round(percentile(measured.map((r) => r.lateness_ms), 0.95)),
    scheduled_e2e_p95_ms: round(percentile(successes.map((r) => r.e2e_from_scheduled_ms), 0.95)),
    sample_sufficient: sampleSufficient,
    fail_rate_sample_sufficient: failRateSampleSufficient,
    fail_rate_pass: failRateSampleSufficient ? failRate <= failureLimit : null,
    // A large number of failures establishes that the failure criterion was
    // missed even when too few valid responses remain to estimate their P95.
    // This evidence never substitutes for sufficient valid latency samples.
    performance_failure_confirmed: failRateSampleSufficient && failRate > failureLimit
      || sampleSufficient && e2eP95 > latencyLimit,
    performance_pass: sampleSufficient ? e2eP95 <= latencyLimit
      && failRate <= failureLimit : null,
  };
}

function capacityFromSteps(steps, {
  requiredRepeats = 3, expectedUsers, semanticQualityStatus = 'pending',
} = {}) {
  if (!Number.isInteger(requiredRepeats) || requiredRepeats < 1) {
    throw new TypeError('requiredRepeats must be a positive integer');
  }
  const users = [...new Set(expectedUsers ?? steps.map((s) => s.users))]
    .filter((u) => Number.isInteger(u) && u > 0).sort((a, b) => a - b);
  const expectedRepeats = Array.from({ length: requiredRepeats }, (_, i) => i + 1);
  const usableStep = (s) => s.summary?.sample_sufficient === true
    && s.cleanup_verified !== false
    && !['aborted', 'not_measured', 'safety_stop', 'cleanup_failed', 'warmup_failure', 'warmup_timeout'].includes(s.status);
  const groups = users.map((user) => {
    const observed = steps.filter((s) => s.users === user);
    const repeats = new Map();
    for (const step of observed.filter((s) => s.phase !== 'screen')) {
      // A duplicated repeat cannot substitute for a missing independent run.
      const key = step.repeat;
      if (!expectedRepeats.includes(key)) continue;
      if (!repeats.has(key)) repeats.set(key, []);
      repeats.get(key).push(step);
    }
    const entries = expectedRepeats.map((repeat) => repeats.get(repeat) || []);
    const complete = entries.every((values) => values.length === 1);
    const sufficient = complete && entries.every(([s]) => usableStep(s));
    const pass = sufficient && entries.every(([s]) => s.summary?.performance_pass === true);
    const observedPass = observed.length > 0 && observed.every((s) => usableStep(s)
      && s.summary?.performance_pass === true);
    return { users: user, observed_repeats: entries.filter((values) => values.length > 0).length,
      expected_repeats: expectedRepeats, complete, sufficient, performance_pass: sufficient ? pass : null,
      observed_performance_pass: observedPass };
  });
  const allComplete = groups.length > 0 && groups.every((g) => g.complete);
  const allSufficient = allComplete && groups.every((g) => g.sufficient);
  const passing = groups.filter((g) => g.performance_pass === true);
  // A screen can nominate a measured U, but only complete repetitions can
  // establish a final performance capacity. No numeric fallback for all-fail.
  const candidates = groups.filter((g) => g.observed_performance_pass);
  const candidate = candidates.length ? Math.max(...candidates.map((g) => g.users)) : null;
  const performanceLowerBound = passing.length ? Math.max(...passing.map((g) => g.users)) : null;
  const performanceCapacity = allSufficient ? performanceLowerBound : null;
  const qualityPassed = semanticQualityStatus === 'passed';
  const status = !allComplete ? 'incomplete_repeats' : !allSufficient ? 'insufficient_samples'
    : semanticQualityStatus === 'failed' ? 'quality_failed' : !qualityPassed ? 'quality_pending'
      : !passing.length ? 'no_slo_pass' : 'complete';
  return {
    c_slo: qualityPassed ? performanceCapacity : null,
    c_performance_candidate: candidate,
    c_performance_confirmed: performanceCapacity,
    c_performance_lower_bound: performanceLowerBound,
    c_slo_lower_bound: qualityPassed ? performanceLowerBound : null,
    status, semantic_quality_status: semanticQualityStatus, required_repeats: requiredRepeats,
    expected_users: users, groups,
  };
}

module.exports = { percentile, mean, round, summarizeRecords, capacityFromSteps };
