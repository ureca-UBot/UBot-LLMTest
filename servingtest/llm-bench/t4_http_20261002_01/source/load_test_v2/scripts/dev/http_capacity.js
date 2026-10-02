'use strict';
const { percentile } = require('../lib/stats');

function httpComplete(record) {
  return record.client_drop !== true && record.transport_ok === true
    && Number.isInteger(record.http_status) && record.http_status >= 200 && record.http_status < 300
    && Number.isFinite(record.t_end_rel) && record.t_end_rel >= record.t_start_rel;
}
function contractValid(record) {
  return httpComplete(record) && record.valid === true && record.contract_valid !== false
    && (record.schema_valid ?? record.schema_ok) !== false && (record.evidence_valid ?? record.evidence_ok) !== false
    && record.truncated !== true && record.reasoning_leak !== true && record.input_truncated !== true
    && record.input_budget_exceeded !== true;
}
function latency(record) {
  return Number.isFinite(record.e2e_ms) && record.e2e_ms >= 0 ? record.e2e_ms : record.t_end_rel - record.t_start_rel;
}
function summarizeHttpCapacity(records, window, { targetRps = 8, minRequests = 20 } = {}) {
  if (!Array.isArray(records)) throw new TypeError('records must be an array');
  if (!window || !Number.isFinite(window.startMs) || !Number.isFinite(window.endMs) || window.endMs <= window.startMs) {
    throw new TypeError('window must contain finite startMs < endMs');
  }
  if (!Number.isFinite(targetRps) || targetRps <= 0) throw new TypeError('targetRps must be a positive finite number');
  if (!Number.isInteger(minRequests) || minRequests < 1) throw new TypeError('minRequests must be a positive integer');
  // Admission is [start,end); a completion exactly at end is included, matching
  // the benchmark's existing fixed-window convention. Drained completions are
  // counted in the admitted cohort's failure/latency diagnostics, never RPS.
  const cohort = records.filter(record => record && record.warmup !== true && Number.isFinite(record.t_start_rel)
    && record.t_start_rel >= window.startMs && record.t_start_rel < window.endMs);
  const completed = cohort.filter(httpComplete);
  const inWindow = completed.filter(record => record.t_end_rel <= window.endMs);
  const drained = completed.filter(record => record.t_end_rel > window.endMs);
  const qualityValid = completed.filter(contractValid);
  const seconds = (window.endMs - window.startMs) / 1000;
  const transportRps = inWindow.length / seconds;
  // Sample sufficiency concerns measured HTTP completions, not semantic
  // validity. Latency and output quality do not affect this exploratory target.
  const sufficient = inWindow.length >= minRequests;
  const failTypes = {};
  for (const record of cohort.filter(record => !httpComplete(record))) {
    const reason = record.error_type || (Number.isInteger(record.http_status)
      && (record.http_status < 200 || record.http_status >= 300) ? `http_${record.http_status}` : 'http_completion_unconfirmed');
    failTypes[reason] = (failTypes[reason] || 0) + 1;
  }
  const qualityReference = {
    n_valid: qualityValid.length,
    n_valid_completed_in_window: qualityValid.filter(record => record.t_end_rel <= window.endMs).length,
    valid_rps: qualityValid.filter(record => record.t_end_rel <= window.endMs).length / seconds,
    n_invalid_completed: completed.length - qualityValid.length,
    schema_failures: completed.filter(record => (record.schema_valid ?? record.schema_ok) === false).length,
    evidence_failures: completed.filter(record => (record.evidence_valid ?? record.evidence_ok) === false).length,
    truncations: completed.filter(record => record.truncated === true).length,
    reasoning_leaks: completed.filter(record => record.reasoning_leak === true).length,
  };
  return {
    scope: 'http_completion_diagnostic', criterion: 'completed_2xx_http_streams_per_second',
    target_rps: targetRps, target_status: !sufficient ? 'insufficient_samples' : transportRps >= targetRps ? 'reached' : 'below_target',
    target_reached: sufficient ? transportRps >= targetRps : null,
    min_requests: minRequests, sample_sufficient: sufficient, window_sec: seconds,
    n_total: cohort.length, n_http_complete: completed.length, n_http_complete_in_window: inWindow.length,
    n_http_complete_drain: drained.length, n_http_completion_fail: cohort.length - completed.length,
    http_completion_fail_rate: cohort.length ? (cohort.length - completed.length) / cohort.length : null,
    transport_rps: transportRps,
    e2e_p50_ms: percentile(completed.map(latency), 0.5), e2e_p95_ms: percentile(completed.map(latency), 0.95),
    latency_cohort: 'admitted_completed_2xx_streams_including_drain', latency_gate_applied: false, quality_gate_applied: false,
    timeouts: cohort.filter(record => record.error_type === 'timeout').length, fail_types: failTypes,
    quality_reference: qualityReference,
    limitation: 'HTTP 완료 처리량 탐색값입니다. 지연·출력 품질·지속 가능한 도착률·SLO 동시성을 인증하지 않습니다.',
  };
}
module.exports = { summarizeHttpCapacity };
