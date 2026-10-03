'use strict';
// 집계 헬퍼. 값이 없으면 null을 돌려준다(0으로 채우지 않는다).

function avg(values) {
  const xs = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

function percentile(values, p) {
  const xs = values.filter((v) => typeof v === 'number' && Number.isFinite(v)).sort((a, b) => a - b);
  if (!xs.length) return null;
  return xs[Math.min(xs.length - 1, Math.floor(xs.length * p))];
}

function rate(numerator, denominator) {
  return denominator ? numerator / denominator : null;
}

// 값 분포 — 결과론적 지표는 통과율 대신 분포로 본다(README 4-9절).
function distribution(values) {
  const xs = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
  return {
    n: xs.length,
    mean: avg(xs),
    p10: percentile(xs, 0.1),
    p25: percentile(xs, 0.25),
    median: percentile(xs, 0.5),
    p75: percentile(xs, 0.75),
    p90: percentile(xs, 0.9),
  };
}

function groupBy(rows, keyFn) {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return groups;
}

function pct(v, digits = 1) {
  return v === null || v === undefined || Number.isNaN(v) ? 'N/A' : (v * 100).toFixed(digits) + '%';
}

function num(v, digits = 1) {
  return v === null || v === undefined || Number.isNaN(v) ? 'N/A' : Number(v).toFixed(digits);
}

module.exports = { avg, percentile, rate, distribution, groupBy, pct, num };
