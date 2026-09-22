'use strict';
// 결정론 RAG 근거율(rag_faithfulness.jsonl)을 "순위 비교용"으로 써도 되는지 검증한다.
//
// 배경: score_rag_faithfulness.js는 NLI premise에 `제공 Context`만 넣고
// `사용자 정보 / API 결과`·`대화 이력`을 빼므로, 그 두 입력을 쓰는 문항은
// 구조적으로 불리하다. 그래서 test3 summary 표에서 이 지표를 뺐다.
// 다만 "절대값은 못 믿어도 모델 간 순위는 유효하다"는 주장이 따로 있어,
// 두 가지를 실제로 확인한다.
//
//   ① 편향이 모델에 고루 걸리는가 — 전체 순위 vs premise가 완전한 문항만의 순위
//      (Spearman rho). 편향이 특정 모델만 때리면 두 순위가 갈린다.
//   ② 순위가 재현되는가 — 문항을 두 묶음으로 갈라 각각 순위를 매긴 뒤 비교
//      (split-half). 표본 잡음이면 두 묶음의 순위가 흔들린다.
//   ③ 어느 쌍을 비교해도 되는가 — 모델별 95% 신뢰구간(Wilson)이 겹치지 않는 쌍만
//      골라, 그 쌍들의 순서가 두 묶음에서도 유지되는지 본다. 전체 줄세우기가
//      흔들리는 건 중간 그룹이 오차 범위 안에서 붙어 있기 때문일 수 있다.
//
// 모델을 호출하지 않는다. 이미 채점된 파일만 읽는다.
//
// Usage: node scripts/test3/verify_rag_rule_ranking.js [--condition t0_think]

const fs = require('fs');
const path = require('path');
const models = require('./config/models');
const { ROOT } = require('./lib/runner');
const { loadPrimaryCases, findRunId, readJsonl, scoredDir } = require('./lib/collect');
const { parseCsvObjects } = require('../test2/lib/csv');

const SUITE = models.suite;
const OUT_PATH = path.join(ROOT, 'results', 'scored', SUITE, 'rag_rule_ranking_check.json');

function loadCaseMeta() {
  const rows = parseCsvObjects(fs.readFileSync(
    path.join(ROOT, 'data', 'eval_sets', 'test_set2', 'cases.csv'), 'utf8'));
  const premiseComplete = new Set(rows
    .filter((r) => (r['사용자 정보 / API 결과'] || '없음') === '없음' && (r['대화 이력'] || '없음') === '없음')
    .map((r) => r['ID']));
  return { premiseComplete };
}

// 문항 ID를 두 묶음으로 가른다. 모델과 무관하게 같은 기준이어야 하므로
// ID 문자열의 문자 합으로 정한다(난수 X — 재실행해도 같은 분할).
function half(id) {
  let sum = 0;
  for (const ch of id) sum += ch.charCodeAt(0);
  return sum % 2;
}

// 이항비율 95% 신뢰구간(Wilson). 분모가 작아 정규근사가 위험하므로 Wilson을 쓴다.
function wilson95(p, n) {
  if (!n) return [null, null];
  const z = 1.96;
  const denom = 1 + (z * z) / n;
  const center = p + (z * z) / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [(center - margin) / denom, (center + margin) / denom];
}

function spearman(rankA, rankB, keys) {
  const n = keys.length;
  if (n < 3) return null;
  let d2 = 0;
  for (const k of keys) d2 += (rankA.get(k) - rankB.get(k)) ** 2;
  return 1 - (6 * d2) / (n * (n * n - 1));
}

// 값이 큰 순서로 1등부터. 동점은 평균 순위.
function rankMap(entries) {
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const map = new Map();
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1][1] === sorted[i][1]) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) map.set(sorted[k][0], avg);
    i = j + 1;
  }
  return map;
}

function main() {
  const condition = (() => {
    const i = process.argv.indexOf('--condition');
    return i >= 0 ? process.argv[i + 1] : 't0_think';
  })();
  const primary = loadPrimaryCases();
  const { premiseComplete } = loadCaseMeta();

  const rows = [];
  for (const m of models.all) {
    const runId = findRunId(SUITE, m.tag, condition);
    if (!runId) continue;
    const file = path.join(scoredDir(SUITE, runId), 'rag_faithfulness.jsonl');
    const all = readJsonl(file);
    if (!all) continue;
    const scored = all.filter((r) => primary.has(r.id) && !r.status_based_skip);
    if (!scored.length) continue;
    const rate = (a) => (a.length ? a.filter((r) => r.faithful).length / a.length : null);
    rows.push({
      model: m.tag,
      run_id: runId,
      rate_all: rate(scored),
      n_all: scored.length,
      n_skipped: all.filter((r) => primary.has(r.id) && r.status_based_skip).length,
      rate_premise_complete: rate(scored.filter((r) => premiseComplete.has(r.id))),
      n_premise_complete: scored.filter((r) => premiseComplete.has(r.id)).length,
      rate_half_a: rate(scored.filter((r) => half(r.id) === 0)),
      rate_half_b: rate(scored.filter((r) => half(r.id) === 1)),
    });
  }

  if (rows.length < 3) {
    console.error(`조건 "${condition}"에 채점된 run이 ${rows.length}개뿐이라 순위 검증을 할 수 없습니다.`);
    process.exit(1);
  }

  const keys = rows.map((r) => r.model);
  const rAll = rankMap(rows.map((r) => [r.model, r.rate_all]));
  const rClean = rankMap(rows.map((r) => [r.model, r.rate_premise_complete]));
  const rA = rankMap(rows.map((r) => [r.model, r.rate_half_a]));
  const rB = rankMap(rows.map((r) => [r.model, r.rate_half_b]));

  const rhoBias = spearman(rAll, rClean, keys);
  const rhoSplit = spearman(rA, rB, keys);
  const maxShift = Math.max(...keys.map((k) => Math.abs(rAll.get(k) - rClean.get(k))));

  for (const r of rows) r.ci95 = wilson95(r.rate_all, r.n_all).map((v) => Number(v.toFixed(4)));

  // 쌍 단위 판정: 신뢰구간이 겹치지 않는 쌍만 "구분 가능"으로 보고,
  // 그 쌍의 순서가 문항 절반씩 나눈 두 묶음에서도 유지되는지 확인한다.
  const sorted = [...rows].sort((a, b) => b.rate_all - a.rate_all);
  const pairs = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i], b = sorted[j];
      const separable = a.ci95[0] > b.ci95[1];
      if (!separable) continue;
      pairs.push({
        higher: a.model, lower: b.model,
        gap_pp: Number((100 * (a.rate_all - b.rate_all)).toFixed(1)),
        order_holds_in_both_halves: a.rate_half_a > b.rate_half_a && a.rate_half_b > b.rate_half_b,
      });
    }
  }
  const totalPairs = (rows.length * (rows.length - 1)) / 2;
  const separablePairs = pairs.length;
  const consistentPairs = pairs.filter((p) => p.order_holds_in_both_halves).length;

  // 결론: 전체 줄세우기는 못 믿어도, 신뢰구간이 겹치지 않는 쌍은 순서가
  // 재현되므로 "격차가 큰 쌍끼리의 비교"로는 쓸 수 있다.
  const usableForRanking = rhoBias >= 0.9 && separablePairs > 0 && consistentPairs === separablePairs;
  const usableForFullOrdering = usableForRanking && rhoSplit >= 0.9;

  const out = {
    generated_at: new Date().toISOString(),
    suite: SUITE,
    condition,
    n_models: rows.length,
    rho_all_vs_premise_complete: Number(rhoBias.toFixed(3)),
    rho_split_half: Number(rhoSplit.toFixed(3)),
    max_rank_shift: maxShift,
    usable_for_ranking: usableForRanking,
    usable_for_full_ordering: usableForFullOrdering,
    pairs_total: totalPairs,
    pairs_separable: separablePairs,
    pairs_separable_and_consistent: consistentPairs,
    separable_pairs: pairs,
    caveats: [
      '절대값은 실제 근거율보다 낮게 나온다. premise에서 빠진 입력을 쓰는 문항이 구조적으로 불리하다.',
      '분모(n_scored)가 모델마다 다르다. 보류(ABSTAIN/CLARIFY/OUT_OF_SCOPE)가 많은 모델일수록 채점 문항이 적다.',
      '이 검증은 순위의 내부 일관성만 본다. 실제 근거 충실도와 일치하는지는 LLM Judge 채점으로 따로 확인해야 한다.',
      '신뢰구간이 겹치는 쌍은 순서를 주장하지 않는다. 전체 줄세우기가 아니라 구분 가능한 쌍끼리만 비교한다.',
    ],
    models: rows.map((r) => ({
      ...r,
      rank_all: rAll.get(r.model),
      rank_premise_complete: rClean.get(r.model),
    })),
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + '\n', 'utf8');

  const pct = (v) => (v === null ? '-' : (100 * v).toFixed(1) + '%');
  console.log(`\n결정론 RAG 근거율 순위 검증 (suite=${SUITE}, condition=${condition})\n`);
  console.log('모델'.padEnd(18) + '전체'.padStart(9) + 'n'.padStart(6)
    + 'premise정상'.padStart(13) + 'n'.padStart(6) + '순위(전체/정상)'.padStart(18));
  for (const r of out.models) {
    console.log(r.model.padEnd(18) + pct(r.rate_all).padStart(9) + String(r.n_all).padStart(6)
      + pct(r.rate_premise_complete).padStart(13) + String(r.n_premise_complete).padStart(6)
      + `${r.rank_all} / ${r.rank_premise_complete}`.padStart(18));
  }
  console.log(`\n전체 순위 vs premise 정상 문항 순위  Spearman rho = ${out.rho_all_vs_premise_complete}`);
  console.log(`문항 절반씩 나눈 순위끼리            Spearman rho = ${out.rho_split_half}`);
  console.log(`최대 순위 이동                       ${out.max_rank_shift}계단`);
  console.log(`신뢰구간이 겹치지 않는 쌍            ${separablePairs}/${totalPairs}쌍, 그중 두 묶음에서 순서 유지 ${consistentPairs}쌍`);
  console.log(`\n판정`);
  console.log(`  - 구분 가능한 쌍끼리의 비교: ${usableForRanking ? '쓸 수 있다' : '쓸 수 없다'}`);
  console.log(`  - 7개 모델 전체 줄세우기:    ${usableForFullOrdering ? '쓸 수 있다' : '쓸 수 없다 (중간 그룹이 오차 범위 안에서 붙어 있다)'}`);
  for (const c of out.caveats) console.log(`  - ${c}`);
  console.log(`\n-> ${path.relative(ROOT, OUT_PATH)}`);
}

main();
