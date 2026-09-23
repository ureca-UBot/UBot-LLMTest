#!/usr/bin/env node
'use strict';
// 프롬프트 비교(test3_prompt)의 차트용 통계를 JSON 하나로 뽑는다.
//
//   node scripts/test3/prompt_stats.js --model qwen3:14b --date 20260922
//
// compare_prompts.js가 "표"를 만든다면 이 스크립트는 그 표 밑의 문항 단위 비교를 한다.
//   - 헤드라인 지표 + Wilson 95% CI
//   - 같은 문항끼리 짝지은 McNemar 정확검정(상태 일치 · AI 정답 · AI 근거)
//   - 지연 차이의 부트스트랩 95% CI
//   - Judge 설정 차이(v0 = medium, v1~v3 = ultra) 교란 점검:
//     답변이 글자까지 같은 문항에서 두 Judge 판정이 얼마나 일치하는지
//   - 답해야 할 문항 vs 막아야 할 문항 두 축, status 분포, 유형별 표
//
// 출력: results/test3_prompt/prompt_stats_<model>_<date>.json
// 원본 jsonl만 읽고 아무것도 고치지 않는다.

const fs = require('fs');
const path = require('path');
const models = require('./config/models');
const { ROOT, sanitizeTag } = require('./lib/runner');
const { findRunId, readJsonl, readJson } = require('./lib/collect');
const { parseCsvObjects } = require('../test2/lib/csv');
const { expectedStatusEnum } = require('../test2/lib/status_map');

const PROMPT_SUITE = `${models.suite}_prompt`;
const BASE_SUITE = models.suite;
const VARIANTS = ['v0_baseline', 'v1_status_rules', 'v2_value_guard', 'v3_decision_tree'];
const ANSWERABLE = new Set(['ANSWER', 'PARTIAL']);

function parseArgs(argv) {
  const o = { model: 'qwen3:14b', date: null, out: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--model') o.model = argv[++i];
    else if (a === '--date') o.date = argv[++i];
    else if (a === '--out') o.out = argv[++i];
  }
  if (!o.date) throw new Error('--date가 필요합니다 (예: 20260922)');
  return o;
}

// ---------------------------------------------------------------- 통계 도구

function wilson(k, n) {
  if (!n) return { rate: null, lo: null, hi: null };
  const z = 1.96, p = k / n, d = 1 + z * z / n;
  const c = (p + z * z / (2 * n)) / d;
  const h = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d;
  return { rate: p, lo: Math.max(0, c - h), hi: Math.min(1, c + h) };
}

// McNemar 정확검정(양측): 불일치 쌍 b, c만으로 이항검정.
function mcnemarExact(b, c) {
  const n = b + c;
  if (!n) return 1;
  const k = Math.min(b, c);
  let logC = 0, tail = 0;
  for (let i = 0; i <= k; i++) {
    if (i > 0) logC += Math.log(n - i + 1) - Math.log(i);
    tail += Math.exp(logC - n * Math.LN2);
  }
  return Math.min(1, 2 * tail);
}

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function bootstrapMeanCi(diffs, iters = 5000) {
  const rnd = mulberry32(20260922);
  const n = diffs.length, means = [];
  for (let b = 0; b < iters; b++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += diffs[Math.floor(rnd() * n)];
    means.push(s / n);
  }
  means.sort((a, b) => a - b);
  return { lo: means[Math.floor(iters * 0.025)], hi: means[Math.floor(iters * 0.975)] };
}

function quantile(xs, q) {
  const s = [...xs].sort((a, b) => a - b);
  if (!s.length) return null;
  const pos = (s.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round = (x, d = 4) => (x == null ? null : Math.round(x * 10 ** d) / 10 ** d);

// Holm 보정: 같은 가족 안에서 p를 조정한다.
function holm(items) {
  const sorted = [...items].sort((a, b) => a.p - b.p);
  let running = 0;
  sorted.forEach((it, i) => {
    running = Math.max(running, Math.min(1, it.p * (sorted.length - i)));
    it.p_holm = running;
  });
  return items;
}

// ---------------------------------------------------------------- 데이터 로드

function loadCases() {
  const rows = parseCsvObjects(fs.readFileSync(
    path.join(ROOT, 'data', 'eval_sets', 'test_set2', 'cases.csv'), 'utf8'));
  const idx = new Map();
  for (const r of rows) {
    if (r['실행 회차'] !== '1') continue;
    idx.set(r['ID'], { type: r['유형'], expected: expectedStatusEnum(r['기대 응답 상태']) });
  }
  return idx;
}

// v0 판정은 jsonl이 아니라 llm_judge_review의 문항별 md에 들어 있다.
// <summary>ID · 유형 · VERDICT</summary> 다음의 "AI 평가 결과" json 블록을 읽는다.
function loadV0Judge(runId) {
  const f = path.join(ROOT, 'results', BASE_SUITE, 'llm_judge_review', 't0_nothink', `${runId}.md`);
  if (!fs.existsSync(f)) return null;
  const text = fs.readFileSync(f, 'utf8');
  const out = new Map();
  for (const block of text.split('<details>').slice(1)) {
    const m = block.match(/<summary>(\S+) · /);
    const j = block.split('**AI 평가 결과**')[1];
    if (!m || !j) continue;
    const body = j.match(/```json\s*([\s\S]*?)```/);
    if (!body) continue;
    const obj = JSON.parse(body[1]);
    const ahe = obj.accuracy_hallucination_expression;
    out.set(m[1], {
      correct: ahe ? ahe.accuracy.verdict === 'CORRECT' : null,
      grounded: ahe ? !!ahe.hallucination.is_grounded : null,
      grounding: ahe ? ahe.hallucination.grounding_score : null,
      expression: ahe ? ahe.expression_quality : null,
      safety: obj.safety ? obj.safety.verdict : null,
      effort: 'medium',
    });
  }
  return out;
}

function loadJudgeJsonl(suite, runId) {
  const dir = path.join(ROOT, 'results', 'scored', suite, runId);
  const acc = readJsonl(path.join(dir, 'accuracy_hallucination_llm.jsonl')) || [];
  const saf = readJsonl(path.join(dir, 'safety_llm.jsonl')) || [];
  const safety = new Map(saf.filter((r) => !r.error).map((r) => [r.id, r.verdict]));
  const out = new Map();
  for (const r of acc) {
    if (r.error || !r.accuracy) continue;
    out.set(r.id, {
      correct: r.accuracy.verdict === 'CORRECT',
      grounded: !!r.hallucination.is_grounded,
      grounding: r.hallucination.grounding_score,
      expression: r.expression_quality,
      safety: safety.get(r.id) || null,
      effort: r.judge_reasoning_effort,
    });
  }
  return out;
}

function loadRun(variant, suite, runId, cases) {
  const gen = readJsonl(path.join(ROOT, 'results', 'raw', suite, runId, 'generation.jsonl'));
  if (!gen) throw new Error(`생성 결과 없음: ${suite}/${runId}`);
  const judge = variant === 'v0_baseline' ? loadV0Judge(runId) : loadJudgeJsonl(suite, runId);
  const byId = new Map();
  for (const r of gen) {
    const c = cases.get(r.id);
    if (!c || byId.has(r.id)) continue;
    const p = r.parsed || {};
    const t = r.timing || {};
    const j = judge ? judge.get(r.id) : null;
    byId.set(r.id, {
      id: r.id,
      type: c.type,
      expected: c.expected,
      predicted: p.status || null,
      answer: p.answer || '',
      statusHit: !!(p.status && p.status === c.expected),
      wallMs: t.wall_ms != null ? t.wall_ms : null,
      evalCount: t.eval_count != null ? t.eval_count : null,
      promptEvalCount: t.prompt_eval_count != null ? t.prompt_eval_count : null,
      evalNs: t.eval_duration_ns != null ? t.eval_duration_ns : null,
      generatedAt: r.generated_at || null,
      judge: j || null,
    });
  }
  return byId;
}

// ---------------------------------------------------------------- 집계

function headline(run, absence) {
  const rows = [...run.values()];
  const n = rows.length;
  const judged = rows.filter((r) => r.judge);
  const k = (f) => rows.filter(f).length;
  const lat = rows.map((r) => r.wallMs).filter((x) => x != null).map((x) => x / 1000);
  const safety = {};
  for (const r of judged) if (r.judge.safety) safety[r.judge.safety] = (safety[r.judge.safety] || 0) + 1;
  const effort = [...new Set(judged.map((r) => r.judge.effort))];
  return {
    n,
    status_match: { k: k((r) => r.statusHit), n, ...wilson(k((r) => r.statusHit), n) },
    abstain_f1: absence ? round(absence.f1) : null,
    abstain_precision: absence ? round(absence.precision) : null,
    abstain_recall: absence ? round(absence.recall) : null,
    ai_correct: { k: judged.filter((r) => r.judge.correct).length, n: judged.length,
      ...wilson(judged.filter((r) => r.judge.correct).length, judged.length) },
    ai_grounded: { k: judged.filter((r) => r.judge.grounded).length, n: judged.length,
      ...wilson(judged.filter((r) => r.judge.grounded).length, judged.length) },
    hallucinated_cases: judged.filter((r) => !r.judge.grounded).length,
    grounding_avg: round(mean(judged.map((r) => r.judge.grounding))),
    expression_avg: round(mean(judged.map((r) => r.judge.expression))),
    safety,
    judge_effort: effort,
    latency_s: { mean: round(mean(lat), 3), p50: round(quantile(lat, 0.5), 3),
      p90: round(quantile(lat, 0.9), 3), p95: round(quantile(lat, 0.95), 3), max: round(Math.max(...lat), 3) },
    output_tokens_mean: round(mean(rows.map((r) => r.evalCount).filter((x) => x != null)), 1),
    // 지연 = 출력 토큰 수 / 디코딩 속도 + α. 디코딩 속도가 안끼리 다르면 지연 차이는
    // 프롬프트가 아니라 실행 환경(날짜·GPU 상태) 차이다.
    decode_tok_per_s: round(rows.reduce((a, r) => a + (r.evalCount || 0), 0)
      / rows.reduce((a, r) => a + (r.evalNs || 0), 0) * 1e9, 2),
    generated_at_first: rows.length ? rows[0].generatedAt : null,
    prompt_tokens_mean: round(mean(rows.map((r) => r.promptEvalCount).filter((x) => x != null)), 1),
  };
}

// 두 안을 같은 문항끼리 짝지어 비교. a가 기준(A), b가 후보(B).
function paired(a, b, pick) {
  const ids = [...a.keys()].filter((id) => b.has(id) && pick(a.get(id)) != null && pick(b.get(id)) != null);
  let both = 0, onlyA = 0, onlyB = 0, neither = 0;
  const onlyAIds = [], onlyBIds = [];
  for (const id of ids) {
    const x = pick(a.get(id)), y = pick(b.get(id));
    if (x && y) both++;
    else if (x) { onlyA++; onlyAIds.push(id); }
    else if (y) { onlyB++; onlyBIds.push(id); }
    else neither++;
  }
  return {
    n: ids.length, both, only_a: onlyA, only_b: onlyB, neither,
    net_b_minus_a: onlyB - onlyA,
    diff_pp: round(ids.length ? (onlyB - onlyA) / ids.length * 100 : null, 2),
    p_mcnemar: round(mcnemarExact(onlyA, onlyB), 5),
    only_a_ids: onlyAIds, only_b_ids: onlyBIds,
  };
}

function subset(run, answerable) {
  return new Map([...run].filter(([, r]) => r.expected && ANSWERABLE.has(r.expected) === answerable));
}

function pairedLatency(a, b) {
  const diffs = [];
  let faster = 0;
  for (const [id, x] of a) {
    const y = b.get(id);
    if (!y || x.wallMs == null || y.wallMs == null) continue;
    const d = (y.wallMs - x.wallMs) / 1000;
    diffs.push(d);
    if (d < 0) faster++;
  }
  const ci = bootstrapMeanCi(diffs);
  return { n: diffs.length, mean_diff_s: round(mean(diffs), 3), ci95_s: [round(ci.lo, 3), round(ci.hi, 3)],
    median_diff_s: round(quantile(diffs, 0.5), 3), b_faster_share: round(faster / diffs.length, 4) };
}

// 답해야 할 문항(기대 ANSWER/PARTIAL)과 막아야 할 문항(그 외)을 나눠 본다.
// 보류를 남발하면 "막기"는 오르고 "답하기"는 떨어진다 — 두 축을 같이 봐야 한다.
function twoAxis(run) {
  const ans = [...run.values()].filter((r) => ANSWERABLE.has(r.expected));
  const hold = [...run.values()].filter((r) => r.expected && !ANSWERABLE.has(r.expected));
  const rate = (rows, f) => { const k = rows.filter(f).length; return { k, n: rows.length, ...wilson(k, rows.length) }; };
  const judged = (rows) => rows.filter((r) => r.judge);
  return {
    answerable: {
      n: ans.length,
      ai_correct: rate(judged(ans), (r) => r.judge.correct),
      status_match: rate(ans, (r) => r.statusHit),
      // 답할 수 있는데 보류·확인요청·범위밖으로 빠진 것 = 과잉 보류
      over_refusal: rate(ans, (r) => r.predicted && !ANSWERABLE.has(r.predicted)),
    },
    should_hold: {
      n: hold.length,
      ai_correct: rate(judged(hold), (r) => r.judge.correct),
      status_match: rate(hold, (r) => r.statusHit),
      // 막아야 하는데 ANSWER/PARTIAL로 답해버린 것 = 과잉 답변(환각 위험)
      over_answer: rate(hold, (r) => ANSWERABLE.has(r.predicted)),
    },
  };
}

function statusDist(run) {
  const dist = {}, confusion = {};
  for (const r of run.values()) {
    const p = r.predicted || 'NONE';
    dist[p] = (dist[p] || 0) + 1;
    const e = r.expected || 'NONE';
    confusion[e] = confusion[e] || {};
    confusion[e][p] = (confusion[e][p] || 0) + 1;
  }
  return { dist, confusion };
}

function byType(runs) {
  const types = new Map();
  for (const [v, run] of Object.entries(runs)) {
    for (const r of run.values()) {
      if (!types.has(r.type)) types.set(r.type, {});
      const t = types.get(r.type);
      t[v] = t[v] || { n: 0, status_hit: 0, judged: 0, ai_correct: 0, grounded: 0 };
      const s = t[v];
      s.n++;
      if (r.statusHit) s.status_hit++;
      if (r.judge) { s.judged++; if (r.judge.correct) s.ai_correct++; if (r.judge.grounded) s.grounded++; }
    }
  }
  const out = [];
  for (const [type, perV] of types) {
    const row = { type, n: Object.values(perV)[0].n };
    for (const [v, s] of Object.entries(perV)) {
      row[v] = {
        status_match: round(s.status_hit / s.n),
        ai_correct: s.judged ? round(s.ai_correct / s.judged) : null,
        ai_grounded: s.judged ? round(s.grounded / s.judged) : null,
      };
    }
    out.push(row);
  }
  return out.sort((a, b) => (a.v0_baseline.ai_correct ?? 1) - (b.v0_baseline.ai_correct ?? 1));
}

// Judge 설정 교란 점검: v0 답변과 글자까지 같은 답(status+answer)을 낸 문항에서
// medium(v0) 판정과 ultra(vX) 판정이 얼마나 같은가. 같은 답에 판정이 다르면 그만큼이
// "프롬프트 효과가 아닌 Judge 효과"다.
function judgeCalibration(v0, vx) {
  let same = 0, agree = 0, mediumOnly = 0, ultraOnly = 0;
  for (const [id, a] of v0) {
    const b = vx.get(id);
    if (!b || !a.judge || !b.judge) continue;
    if (a.predicted !== b.predicted || a.answer.trim() !== b.answer.trim()) continue;
    same++;
    if (a.judge.correct === b.judge.correct) agree++;
    else if (a.judge.correct) mediumOnly++;
    else ultraOnly++;
  }
  return { identical_answers: same, verdict_agree: agree, agree_rate: same ? round(agree / same) : null,
    correct_only_medium: mediumOnly, correct_only_ultra: ultraOnly,
    ultra_minus_medium_pp: same ? round((ultraOnly - mediumOnly) / same * 100, 2) : null };
}

// v0가 상태를 틀린 문항을 어느 안이 고쳤는가(UpSet 차트용).
function fixOverlap(runs, pick) {
  const base = runs.v0_baseline;
  const others = VARIANTS.slice(1);
  const combos = {};
  let v0Fail = 0;
  for (const [id, r] of base) {
    if (pick(r) !== false) continue;
    v0Fail++;
    const fixed = others.filter((v) => runs[v].get(id) && pick(runs[v].get(id)) === true);
    const key = fixed.length ? fixed.map((v) => v.split('_')[0]).join('+') : 'none';
    combos[key] = (combos[key] || 0) + 1;
  }
  return { v0_fail: v0Fail, fixed_by: combos };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const slug = sanitizeTag(opts.model);
  const cases = loadCases();

  const runIds = {
    v0_baseline: { suite: BASE_SUITE, runId: findRunId(BASE_SUITE, opts.model, 't0_nothink') },
  };
  for (const v of VARIANTS.slice(1)) {
    const d = path.join(ROOT, 'results', 'scored', PROMPT_SUITE);
    const id = fs.readdirSync(d).find((x) => x.includes(`_${slug}_${v}_t0_nothink_${opts.date}`));
    runIds[v] = { suite: PROMPT_SUITE, runId: id };
  }

  const runs = {}, head = {}, axes = {}, status = {};
  for (const v of VARIANTS) {
    const { suite, runId } = runIds[v];
    if (!runId) throw new Error(`${v} run을 찾지 못했습니다`);
    runs[v] = loadRun(v, suite, runId, cases);
    const absence = readJson(path.join(ROOT, 'results', 'scored', suite, runId, 'absence_detection_summary.json'));
    head[v] = headline(runs[v], absence);
    axes[v] = twoAxis(runs[v]);
    status[v] = statusDist(runs[v]);
  }

  const pairs = [
    ['v0_baseline', 'v1_status_rules'], ['v0_baseline', 'v2_value_guard'], ['v0_baseline', 'v3_decision_tree'],
    ['v1_status_rules', 'v2_value_guard'], ['v3_decision_tree', 'v2_value_guard'], ['v1_status_rules', 'v3_decision_tree'],
  ];
  const metrics = {
    status_match: (r) => r.statusHit,
    ai_correct: (r) => (r.judge ? r.judge.correct : null),
    ai_grounded: (r) => (r.judge ? r.judge.grounded : null),
  };
  const pairedOut = [];
  for (const [a, b] of pairs) {
    const row = { a, b, judge_comparable: head[a].judge_effort.join() === head[b].judge_effort.join() };
    for (const [m, f] of Object.entries(metrics)) row[m] = paired(runs[a], runs[b], f);
    // 답할 문항 / 막을 문항으로 나눠 같은 짝 비교를 한 번 더 — 어느 쪽에서 얻고 잃었는지.
    row.ai_correct_by_axis = {
      answerable: paired(subset(runs[a], true), subset(runs[b], true), metrics.ai_correct),
      should_hold: paired(subset(runs[a], false), subset(runs[b], false), metrics.ai_correct),
    };
    row.latency = pairedLatency(runs[a], runs[b]);
    pairedOut.push(row);
  }
  // 다중 비교 보정은 지표별로 6쌍을 한 가족으로 본다.
  for (const m of Object.keys(metrics)) {
    const items = holm(pairedOut.map((r) => ({ p: r[m].p_mcnemar })));
    items.forEach((it, i) => { pairedOut[i][m].p_holm = round(it.p_holm, 5); });
  }

  const calib = {};
  for (const v of VARIANTS.slice(1)) calib[v] = judgeCalibration(runs.v0_baseline, runs[v]);

  const out = {
    generated_at: new Date().toISOString(),
    model: opts.model,
    runs: runIds,
    notes: [
      'v0 AI 판정은 gpt-6-astra/medium, v1~v3는 gpt-6-astra/ultra. v0 대비 AI 지표 차이에는 Judge 설정 차이가 섞인다 — judge_calibration 참고.',
      '상태 일치·부재판단 F1·지연은 Judge와 무관한 결정론 값이라 v0 비교에 그대로 쓸 수 있다.',
      'paired.*.only_a = A만 맞힌 문항, only_b = B만 맞힌 문항. p_mcnemar는 McNemar 정확검정(양측), p_holm은 지표별 6쌍 Holm 보정.',
    ],
    headline: head,
    paired: pairedOut,
    judge_calibration: calib,
    two_axis: axes,
    status: status,
    by_type: byType(runs),
    fix_overlap: {
      status_match: fixOverlap(runs, (r) => r.statusHit),
      ai_correct: fixOverlap(runs, (r) => (r.judge ? r.judge.correct : null)),
    },
  };

  const outPath = opts.out || path.join(ROOT, 'results', PROMPT_SUITE, `prompt_stats_${slug}_${opts.date}.json`);
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`통계 저장: ${path.relative(ROOT, outPath)}`);
}

main();
