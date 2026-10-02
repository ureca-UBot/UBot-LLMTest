'use strict';
// 단계(step) 요약 통계.
//
// 분위수는 선형 보간(numpy 기본값과 같은 방식)으로 계산한다.
// 지연 통계는 "측정 구간에 시작한 요청" 기준, 처리량은 "측정 구간 안에 끝난 성공
// 요청" 기준이다. (구간 밖에서 끝난 요청을 처리량에 넣으면 구간 길이와 안 맞는다.)

function percentile(values, p) {
  const arr = values.filter((v) => typeof v === 'number' && Number.isFinite(v)).sort((a, b) => a - b);
  if (arr.length === 0) return null;
  if (arr.length === 1) return arr[0];
  const pos = (arr.length - 1) * p;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return arr[lo] + (arr[hi] - arr[lo]) * (pos - lo);
}

function mean(values) {
  const arr = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdev(values) {
  const arr = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (arr.length < 2) return null;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length - 1));
}

const round = (v, d = 1) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 10 ** d) / 10 ** d : null);

// records: 요청 기록 배열 (stream_client 결과 + t_start_rel / t_end_rel / in_window)
// window: { startMs, endMs } — 단계 시작 기준 상대 시간
function summarizeRecords(records, window) {
  const measured = records.filter((r) => r.in_window);
  const ok = measured.filter((r) => r.ok);
  const failTypes = {};
  for (const r of measured) {
    if (!r.ok) failTypes[r.error_type || 'unknown'] = (failTypes[r.error_type || 'unknown'] || 0) + 1;
  }

  const windowSec = window && window.endMs > window.startMs ? (window.endMs - window.startMs) / 1000 : null;
  const doneInWindow = measured.filter(
    (r) => r.ok && window && r.t_end_rel >= window.startMs && r.t_end_rel <= window.endMs,
  );
  const tokensInWindow = doneInWindow.reduce((n, r) => n + (r.eval_count || 0), 0);
  const tokenUsageComplete = doneInWindow.every((r) => Number.isInteger(r.eval_count));

  const decodeRates = ok
    .filter((r) => r.eval_count && r.eval_ms)
    .map((r) => r.eval_count / (r.eval_ms / 1000));

  return {
    n_total: measured.length,
    n_ok: ok.length,
    n_fail: measured.length - ok.length,
    fail_rate: measured.length ? round((measured.length - ok.length) / measured.length, 4) : null,
    fail_types: failTypes,
    window_sec: round(windowSec, 2),

    ttft_p50_ms: round(percentile(ok.map((r) => r.ttft_ms), 0.5)),
    ttft_p95_ms: round(percentile(ok.map((r) => r.ttft_ms), 0.95)),
    ttft_p99_ms: round(percentile(ok.map((r) => r.ttft_ms), 0.99)),

    e2e_p50_ms: round(percentile(ok.map((r) => r.e2e_ms), 0.5)),
    e2e_p95_ms: round(percentile(ok.map((r) => r.e2e_ms), 0.95)),
    e2e_p99_ms: round(percentile(ok.map((r) => r.e2e_ms), 0.99)),
    e2e_max_ms: round(percentile(ok.map((r) => r.e2e_ms), 1)),
    // 실패(타임아웃 등)까지 포함한 사용자 체감 P95 — 실패 요청은 끊길 때까지 기다린 시간으로 센다.
    e2e_p95_all_ms: round(percentile(measured.map((r) => r.e2e_ms), 0.95)),

    itl_mean_p50_ms: round(percentile(ok.map((r) => r.itl_mean_ms), 0.5), 2),
    itl_mean_p95_ms: round(percentile(ok.map((r) => r.itl_mean_ms), 0.95), 2),

    wait_est_p50_ms: round(percentile(ok.map((r) => r.wait_est_ms), 0.5)),
    wait_est_p95_ms: round(percentile(ok.map((r) => r.wait_est_ms), 0.95)),

    in_tokens_avg: round(mean(ok.map((r) => r.prompt_eval_count)), 1),
    out_tokens_avg: round(mean(ok.map((r) => r.eval_count)), 1),
    out_tokens_p95: round(percentile(ok.map((r) => r.eval_count), 0.95), 0),
    token_usage_requests: ok.filter((r) => Number.isInteger(r.eval_count)).length,
    tpot_p50_ms: round(percentile(ok.map((r) => r.tpot_ms), 0.5), 2),
    tpot_p95_ms: round(percentile(ok.map((r) => r.tpot_ms), 0.95), 2),
    user_tok_s_avg: round(mean(ok.map((r) => r.user_tok_s)), 2),
    post_ttft_tok_s_avg: round(mean(ok.map((r) => r.post_ttft_tok_s)), 2),
    decode_tok_s_per_req: round(mean(decodeRates), 1),

    // 처리량 — 측정 구간 안에 끝난 성공 요청 기준
    rps: windowSec ? round(doneInWindow.length / windowSec, 3) : null,
    tok_s: windowSec && tokenUsageComplete ? round(tokensInWindow / windowSec, 1) : null,
  };
}

module.exports = { percentile, mean, stdev, round, summarizeRecords };
