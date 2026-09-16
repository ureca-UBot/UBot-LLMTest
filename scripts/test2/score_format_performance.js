'use strict';
// Stage 2a (항목6 + 항목7): reads generation.jsonl and splits the already-
// computed format/timing data into two SEPARATE per-item result files, as
// required — every evaluation item gets its own file, nothing shared.
//
//   results/scored/test2/<run_id>/format_success.jsonl   (항목6)
//   results/scored/test2/<run_id>/performance.jsonl       (항목7, + a small
//                                                           aggregate summary)
//
// Usage: node scripts/score_format_performance.js <run_id>

const fs = require('fs');
const path = require('path');
const { readAll, makeAppender } = require('./lib/jsonl');
const { parseCsvObjects } = require('./lib/csv');
const { isPrimaryRound } = require('./lib/rounds');

const ROOT = path.join(__dirname, '..', '..');
const CASES_PATH = path.join(ROOT, 'data', 'eval_sets', 'test_set2', 'cases.csv');

function main() {
  const runId = process.argv[2];
  if (!runId) {
    console.error('usage: node scripts/score_format_performance.js <run_id>');
    process.exit(1);
  }
  const genPath = path.join(ROOT, 'results', 'raw', 'test2', runId, 'generation.jsonl');
  const rows = readAll(genPath);
  if (rows.length === 0) {
    console.error(`generation.jsonl이 비어있거나 없음: ${genPath}`);
    process.exit(1);
  }
  const casesById = Object.fromEntries(
    parseCsvObjects(fs.readFileSync(CASES_PATH, 'utf8')).map((c) => [c['ID'], c])
  );

  const formatOutPath = path.join(ROOT, 'results', 'scored', 'test2', runId, 'format_success.jsonl');
  const perfOutPath = path.join(ROOT, 'results', 'scored', 'test2', runId, 'performance.jsonl');
  const perfSummaryPath = path.join(ROOT, 'results', 'scored', 'test2', runId, 'performance_summary.json');

  fs.mkdirSync(path.dirname(formatOutPath), { recursive: true });
  fs.writeFileSync(formatOutPath, '');
  fs.writeFileSync(perfOutPath, '');
  const formatAppender = makeAppender(formatOutPath);
  const perfAppender = makeAppender(perfOutPath);

  // 집계(비율/평균)는 고유 문항(실행 회차=1, 300건)만 기준으로 함 — 반복
  // 대상 40문항이 3배로 뽑혀서 집계에 편향을 주지 않도록. 건별 상세는
  // 380행 전부 그대로 기록.
  const latencies = [];
  const tpsList = [];
  let formatPassCount = 0, primaryCount = 0;

  for (const r of rows) {
    const c = casesById[r.id];
    const primary = c ? isPrimaryRound(c) : true;
    if (primary) primaryCount++;

    formatAppender.append({
      id: r.id, run_id: r.run_id, model_tag: r.model_tag, env: r.env,
      pass: !!r.format_pass, reason: r.format_fail_reason,
    });
    if (r.format_pass && primary) formatPassCount++;

    let tps = null, latencyMs = null;
    if (r.timing) {
      latencyMs = r.timing.wall_ms;
      if (r.timing.eval_count && r.timing.eval_duration_ns) {
        tps = r.timing.eval_count / (r.timing.eval_duration_ns / 1e9);
      }
      // Ollama non-streaming responses don't expose a true first-token
      // timestamp, so TTFT isn't recorded here (README 8-1 원칙: "스트리밍
      // 계측이 있을 때만 기록; 없으면 공란").
      if (primary) {
        if (latencyMs != null) latencies.push(latencyMs);
        if (tps != null) tpsList.push(tps);
      }
    }
    perfAppender.append({
      id: r.id, run_id: r.run_id, model_tag: r.model_tag, env: r.env,
      latency_ms: latencyMs, tps, error: r.error,
    });
  }
  formatAppender.close();
  perfAppender.close();

  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
  const p95 = (arr) => {
    if (!arr.length) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
  };
  const summary = {
    run_id: runId,
    n: rows.length,
    n_primary: primaryCount,
    format_success_rate: formatPassCount / (primaryCount || 1),
    latency_ms: { avg: avg(latencies), p95: p95(latencies) },
    tps: { avg: avg(tpsList) },
  };
  fs.writeFileSync(perfSummaryPath, JSON.stringify(summary, null, 2), 'utf8');

  console.log(`항목6(포맷성공률): ${(summary.format_success_rate * 100).toFixed(1)}% -> ${formatOutPath}`);
  console.log(`항목7(성능): avg latency ${summary.latency_ms.avg?.toFixed(0)}ms, avg TPS ${summary.tps.avg?.toFixed(1)} -> ${perfOutPath}`);
  console.log(`요약 -> ${perfSummaryPath}`);
}

main();
