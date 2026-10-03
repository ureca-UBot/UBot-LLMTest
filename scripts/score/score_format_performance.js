'use strict';
// 포맷 계약 준수와 성능(지연·TPS·VRAM). 생성 단계가 남긴 값을 나눠 기록한다.
//
//   raw/scored/<run_id>/format_performance.jsonl
//   raw/scored/<run_id>/format_performance_summary.json
//
// 지연은 순차 단일 요청 기준이다. 비스트리밍 호출이라 TTFT는 기록하지 않는다.
//
// Usage: node scripts/score/score_format_performance.js <run_id> [--test v4] [--try try1]

const path = require('path');
const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { loadRun, summarizeScopes, writeJson, writeJsonl, runIdArg } = require('../lib/run_data');
const { avg, percentile, rate, pct, num } = require('../lib/stats');
const { topLevelKeyOrder } = require('../lib/metrics');

function main() {
  const runId = runIdArg(argv);
  const { rows, scoredDir } = loadRun(runId);

  const expectedOrder = profile.load().config.output?.keyOrder || null;
  const scored = rows.map(({ g }) => {
    const t = g.timing;
    const keyOrder = g.format_pass ? topLevelKeyOrder(g.raw_content, g.parsed) : null;
    const tps = t && t.eval_count && t.eval_duration_ns ? t.eval_count / (t.eval_duration_ns / 1e9) : null;
    return {
      id: g.id, run_id: runId, model_tag: g.model_tag,
      format_pass: !!g.format_pass, format_fail_reason: g.format_fail_reason, generation_error: g.error,
      timeout: g.error_type === 'TIMEOUT',
      key_order: keyOrder,
      // 포맷을 지킨 응답만 판정(null = 판정 대상 아님)
      key_order_ok: keyOrder && expectedOrder ? JSON.stringify(keyOrder) === JSON.stringify(expectedOrder) : null,
      latency_ms: t ? t.wall_ms : null, tps,
      prompt_tokens: t ? t.prompt_eval_count ?? null : null, output_tokens: t ? t.eval_count ?? null : null,
      vram_used_mib: typeof g.vram_used_mib === 'number' ? g.vram_used_mib : null,
    };
  });
  const byId = new Map(rows.map(({ c }) => [c.id, c]));
  const caseOf = (r) => byId.get(r.id);

  const fn = (rs) => {
    const lat = rs.map((r) => r.latency_ms);
    const vram = rs.map((r) => r.vram_used_mib).filter((v) => v !== null);
    return {
      n: rs.length,
      format_success_rate: rate(rs.filter((r) => r.format_pass).length, rs.length),
      key_order_expected: expectedOrder,
      key_order_rate: rate(rs.filter((r) => r.key_order_ok === true).length, rs.filter((r) => r.key_order_ok !== null).length),
      key_order_counts: rs.reduce((o, r) => { if (r.key_order) { const k = r.key_order.join('>'); o[k] = (o[k] || 0) + 1; } return o; }, {}),
      generation_error_count: rs.filter((r) => r.generation_error).length,
      // 지연 통계는 응답을 받은 행만 쓰므로, 상한을 넘긴 건수를 반드시 함께 본다.
      timeout_count: rs.filter((r) => r.timeout).length,
      timeout_rate: rate(rs.filter((r) => r.timeout).length, rs.length),
      latency_ms: { avg: avg(lat), p50: percentile(lat, 0.5), p95: percentile(lat, 0.95), max: percentile(lat, 1) },
      tps_avg: avg(rs.map((r) => r.tps)),
      output_tokens_avg: avg(rs.map((r) => r.output_tokens)),
      vram_mib: vram.length ? { avg: avg(vram), max: Math.max(...vram) } : null,
    };
  };
  const summary = { run_id: runId, ...summarizeScopes(scored, caseOf, fn) };

  writeJsonl(path.join(scoredDir, 'format_performance.jsonl'), scored);
  writeJson(path.join(scoredDir, 'format_performance_summary.json'), summary);
  const s = summary.all_rows;
  console.log(`포맷 준수 ${pct(s.format_success_rate)} · 키 순서 준수 ${pct(s.key_order_rate)} ${JSON.stringify(s.key_order_counts)} · 타임아웃 ${s.timeout_count}건 · 지연 avg ${num(s.latency_ms.avg, 0)}ms / p95 ${num(s.latency_ms.p95, 0)}ms · TPS ${num(s.tps_avg, 1)} (전체 ${s.n}행)`);
}

try { main(); } catch (e) { console.error(e.message); process.exit(1); }
