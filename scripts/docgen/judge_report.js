'use strict';
// LLM Judge 4단계: 판정 집계.
//
//   raw/scored/<run_id>/llm_judge/<batch>/summary.json   run별 요약(run 보고서·run 비교가 읽음)
//   raw/scored/<run_id>/llm_judge/<batch>/paths.jsonl    행별 경로·표시·정합 값
//   llm_judge/<batch>_report.md                          보고서
//   llm_judge/<batch>_metrics.json                       보고서 원자료(공통 오답 후보 전체 포함)
//
// 지표 구조 (model_test_v4/SETUP.md "평가 기준")
//   내용  정확도(Judge가 answer 본문만 보고 판정) · 환각률
//   행동  경로표 P0~P7 — 판단(본문 행동 vs 기대) → 근거(본문 출처 vs 정답 문서) → 내용(누락·오적용),
//         환각은 모든 경로에 붙는 표시. 행마다 다섯 표시를 전부 남긴다(lib/response_paths.js).
//   정합  라벨(status·evidence_ids)과 본문이 맞는가 — 코드가 계산(Judge는 라벨을 보지 않는다)
//   결과  정답(답변 문장만 본 판정) · 정답+상태 · 정답+근거 · 정답+근거+상태(라벨 기준, 환각과 무관).
//         진단은 위 세 층으로 한다.
//
// 분모는 채점에 성공한 행이다. 전체 요약은 독립 표본(반복 항목 제외), 반복 항목은 항목별 표에서 본다.
//
// Usage: node scripts/docgen/judge_report.js --batch <id> [--test v4] [--try try1]

const fs = require('fs');
const path = require('path');
const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { parseRunArgs } = require('../lib/args');
const { readAll } = require('../lib/jsonl');
const { itemName } = require('../lib/dataset');
const { avg, rate, groupBy, pct, num } = require('../lib/stats');
const { writeJson, writeJsonl } = require('../lib/run_data');
const { DIRECTIONS, direction } = require('../lib/status_direction');
const { PATHS, PATH_NAMES, responseFlags, pathOf, pathStats } = require('../lib/response_paths');
const { tuningCodeOverview, renderTuningCodes } = require('../lib/tuning_report');
const { CODES, classifyTuning, sourceState } = require('../lib/tuning_codes');

const SPECIAL_SOURCES = new Set(['USER_INFO_API', 'HISTORY']);
const ANSWERING = new Set(['ANSWER', 'PARTIAL', 'CONFLICT']);
const LEVERS = ['OUTPUT_STRUCTURE', 'PROMPT', 'CODE', 'MODEL', 'REVIEW'];
const LEVER_NAMES = { OUTPUT_STRUCTURE: '출력 구조', PROMPT: '프롬프트', CODE: '코드', MODEL: '문서 식별·추론 보강(가설)', REVIEW: '미분류 오답 검토' };
const subset = (a, b) => a.every((x) => b.includes(x));
// 근거 채택(주 기준, score_evidence.js와 같은 정의): 하나 이상이고 모두 정답 근거 문서
const adoptedBy = (list, gold) => list.length > 0 && subset(list, gold);

// test.config.js의 tuning.paths로 경로·항목의 대응 수단을 고른다.
function leverOf(tuning, p, item) {
  const v = tuning.paths[p];
  if (!v) return null;
  return typeof v === 'string' ? v : (v[item] || v.default || null);
}

function evidenceRelation(cited, sources) {
  const cInS = subset(cited, sources), sInC = subset(sources, cited);
  if (cInS && sInC) return 'SAME';
  if (sInC) return 'CITED_EXTRA';   // 본문에 쓴 문서는 모두 인용 + 안 쓴 문서도 인용
  if (cInS) return 'CITED_MISSING'; // 본문에 쓴 문서 일부를 인용하지 않음
  return 'MISMATCH';
}

// Judge 판정 한 행 + 잡 메타 + 결정론 근거 채점 -> 경로·표시·정합·결과
function analyzeRow(r, tuning) {
  const ev = r.evidence;
  const stance = r.behavior.content_stance;
  const srcDocs = r.behavior.content_sources.filter((s) => !SPECIAL_SOURCES.has(s));
  const gold = ev && ev.applicable ? ev.gold_ids : null;
  // 근거 적합: 본문 출처 문서가 모두 정답 문서 안에 있으면 true, 정답이 아닌 문서의 내용을 하나라도
  // 썼으면 false(다른 상품·대상 조건을 섞은 경우 포함). 정답 문서 일부만 쓴 것은 누락으로 잡힌다.
  // 본문에 문서 기반 사실이 전혀 없으면(보류뿐·전부 지어냄) 근거 판정을 하지 않는다(null) —
  // 지어낸 내용은 환각 표시로 잡힌다.
  const sourceOk = gold && srcDocs.length ? subset(srcDocs, gold) : null;

  const flags = responseFlags({
    expected: r.expected_status,
    stance,
    sourceOk,
    missing: r.accuracy.missing_required_facts.length > 0,
    misapplied: r.accuracy.contradicted_facts.length > 0,
    hallucinated: !r.hallucination.is_grounded,
  });
  const p = pathOf(flags);

  const label = r.response_status;
  const cited = ev ? ev.cited_ids : [];
  const relation = cited.length || srcDocs.length ? evidenceRelation(cited, srcDocs) : null;
  const evidenceOkForResult = gold ? adoptedBy(cited, gold) && subset(srcDocs, cited) : true;
  // 본문이 답을 냈는데(답·부분 답·충돌 고지) 인용이 비어 있음. 라벨 기준 값은 score_evidence.js에 있다.
  const bodyAnsweredWithoutCitation = ANSWERING.has(stance) && cited.length === 0 && ev?.excluded_by !== 'EXCLUDED_ITEM';
  // 본문은 정상(P0)인데 라벨만 틀림: status 라벨이 기대와 다름, 정답 문서 미인용, 본문에 쓴 문서 미인용, 인용 없음
  const labelOnlyError = p === 'P0' && r.accuracy.verdict === 'CORRECT' && (label !== r.expected_status || (gold && !adoptedBy(cited, gold))
    || !subset(srcDocs, cited) || bodyAnsweredWithoutCitation);
  const lever = p === 'P0' ? (r.accuracy.verdict !== 'CORRECT' ? 'REVIEW' : labelOnlyError ? tuning.labelOnly : null) : leverOf(tuning, p, r.item);
  const analyzed = {
    id: r.id, item: r.item, difficulty: r.difficulty, expected_status: r.expected_status,
    verdict: r.accuracy.verdict, path: p, flags,
    label_status: label, content_stance: stance,
    label_direction: direction(r.expected_status, label),
    status_body_agree: label ? label === stance : null,
    evidence_applicable: !!gold, gold_ids: gold, cited_ids: cited, content_source_docs: srcDocs,
    evidence_relation: relation,
    declared_adopted: gold ? adoptedBy(cited, gold) : null,
    content_adopted: gold ? adoptedBy(srcDocs, gold) : null,
    // 결과 조합(라벨 기준 — 모델이 출력한 status·evidence_ids). 정답은 Judge가 답변 문장만 보고 판정한 값.
    correct: r.accuracy.verdict === 'CORRECT',
    status_label_ok: label === r.expected_status,
    evidence_label_ok: gold ? adoptedBy(cited, gold) : null, // 근거 판정 대상 외 행은 null
    strict_ok: p === 'P0' && r.accuracy.verdict === 'CORRECT' && label === r.expected_status && evidenceOkForResult,
    body_answered_without_citation: bodyAnsweredWithoutCitation,
    asks_user: !!r.behavior.asks_user, // 되묻기(본문이 답에 필요한 정보를 사용자에게 요청). 상태와 별개로 건수만 센다
    label_only_error: labelOnlyError,
    lever,
  };
  analyzed.source_state = sourceState(analyzed);
  analyzed.tuning_code = classifyTuning(analyzed);
  return analyzed;
}

// 오답 분해: 정답률(Judge가 답변 문장만 본 판정)에서 오답으로 나온 행을 튜닝 수단이 갈리는 단위로 나눈다.
//   상태 틀림 — 과대 / 과소 / 교차 / 판정 불가(본문 행동 기준, 각각 근거 O·X·대상 외로 다시 나눔)
//   상태 맞음 · 근거 틀림
//   상태 맞음 · 근거 맞음/대상 외 — 오적용 / 누락 / 기타(누락·오적용 기록 없이 실패 조건 등으로 오답)
// 분류는 위에서부터 처음 걸린 것 하나(배타적, 합계 = 오답 수)이고, 각 칸에 환각 동반 건수를 같이 센다.
// 앞 칸에 가려진 원인은 "오답 중 표시 비율"(겹침 허용)로 따로 본다.
const ERROR_CATS = ['STATUS_OVER', 'STATUS_UNDER', 'STATUS_CROSS', 'STATUS_NONE', 'SOURCE_WRONG', 'MISAPPLIED', 'MISSING', 'OTHER'];
const ERROR_CAT_NAMES = {
  STATUS_OVER: '상태 틀림 · 과대', STATUS_UNDER: '상태 틀림 · 과소', STATUS_CROSS: '상태 틀림 · 교차', STATUS_NONE: '상태 판정 불가',
  SOURCE_WRONG: '상태 맞음 · 근거 틀림', MISAPPLIED: '상태·근거 맞음 · 오적용', MISSING: '상태·근거 맞음 · 누락', OTHER: '상태·근거 맞음 · 기타',
};

function errorCategory(x) {
  const d = x.flags.direction;
  if (d !== 'MATCH') return `STATUS_${d}`;
  if (x.flags.source_ok === false) return 'SOURCE_WRONG';
  if (x.flags.misapplied) return 'MISAPPLIED';
  if (x.flags.missing) return 'MISSING';
  return 'OTHER';
}

// 같은 분류를 정답 행과 오답 행에 똑같이 적용한다 — 튜닝 수단은 분류(행동)로 정해지고, 정답 여부는
// 우선순위(오답 = 틀린 정보 전달)와 해석(정답인데 상태 틀림이 많으면 문항·기대 상태 의심)을 바꾼다.
// 마지막 칸(OTHER)은 오답이면 "기타(실패 조건 등)", 정답이면 "문제 없음"이다.
function categorize(rs) {
  const src = (x) => (x.flags.source_ok === true ? 'ok' : x.flags.source_ok === false ? 'wrong' : 'na');
  return Object.fromEntries(ERROR_CATS.map((c) => {
    const sub = rs.filter((x) => errorCategory(x) === c);
    return [c, {
      total: sub.length,
      hallucinated: sub.filter((x) => x.flags.hallucinated).length,
      source: { ok: sub.filter((x) => src(x) === 'ok').length, wrong: sub.filter((x) => src(x) === 'wrong').length, na: sub.filter((x) => src(x) === 'na').length },
    }];
  }));
}

function errorBreakdown(rows) {
  const inc = rows.filter((x) => x.verdict === 'INCORRECT');
  const cor = rows.filter((x) => x.verdict === 'CORRECT');
  const undetermined = rows.filter((x) => x.verdict === 'INSUFFICIENT_EVIDENCE');
  const share = (fn) => rate(inc.filter(fn).length, inc.length);
  return {
    n: rows.length,
    incorrect: inc.length,
    categories: categorize(inc),
    correct_categories: categorize(cor),
    undetermined: undetermined.length,
    undetermined_categories: categorize(undetermined),
    all_categories: categorize(rows), // 정답+오답 합계 — 튜닝 수단(칸)별 전체 규모
    // 오답 중 표시 비율(겹침 허용) — 배타 분류에서 앞 칸에 가려진 원인도 보인다
    incidence_in_incorrect: {
      status_wrong: share((x) => x.flags.direction !== 'MATCH'),
      source_wrong: share((x) => x.flags.source_ok === false),
      misapplied: share((x) => x.flags.misapplied),
      missing: share((x) => x.flags.missing),
      hallucinated: share((x) => x.flags.hallucinated),
    },
    // 정답 쪽: 답변 문장은 맞았지만 다른 문제가 있는 경우
    correct: {
      total: cor.length,
      with_hallucination: cor.filter((x) => x.flags.hallucinated).length,         // 핵심은 맞고 근거 없는 내용 덧붙임
      status_label_wrong: cor.filter((x) => x.label_status !== x.expected_status).length, // 답은 맞는데 status 라벨이 틀림
      evidence_label_wrong: cor.filter((x) => x.evidence_label_ok === false).length,    // 답은 맞는데 정답 문서 미인용
      answered_without_citation: cor.filter((x) => x.body_answered_without_citation).length,
    },
  };
}

// 되묻기 집계 — v4에는 되묻기 상태(CLARIFY)가 없고 ABSTAIN/PARTIAL 안에서 정보를 요청한다. 건수만 따로 센다.
function asksUserStats(rows) {
  const asks = rows.filter((x) => x.asks_user);
  const by = (fn) => { const o = {}; for (const x of asks) { const k = fn(x); o[k] = (o[k] || 0) + 1; } return o; };
  return {
    count: asks.length,
    rate: rate(asks.length, rows.length),
    by_expected_status: by((x) => x.expected_status),
    by_content_stance: by((x) => x.content_stance),
    by_item: by((x) => x.item),
    correct: asks.filter((x) => x.verdict === 'CORRECT').length,
    incorrect: asks.filter((x) => x.verdict !== 'CORRECT').length,
  };
}

function tuningStats(rows) {
  const errors = rows.filter((x) => x.lever);
  const by = Object.fromEntries(LEVERS.map((l) => [l, errors.filter((x) => x.lever === l).length]));
  return {
    n_rows: rows.length,
    n_with_issue: errors.length,
    by_lever: by,
    model_share_of_issues: rate(by.MODEL, errors.length),
    model_share_of_rows: rate(by.MODEL, rows.length),
  };
}

function consistencyStats(rows) {
  const withLabel = rows.filter((x) => x.label_status);
  const evRows = rows.filter((x) => x.evidence_relation);
  const app = rows.filter((x) => x.evidence_applicable);
  const relations = ['SAME', 'CITED_EXTRA', 'CITED_MISSING', 'MISMATCH'];
  const matrix = Object.fromEntries(DIRECTIONS.map((l) => [l, Object.fromEntries(DIRECTIONS.map((b) => [b,
    withLabel.filter((x) => x.label_direction === l && x.flags.direction === b).length]))]));
  return {
    status_body: {
      n: withLabel.length,
      agree_rate: rate(withLabel.filter((x) => x.status_body_agree).length, withLabel.length),
      direction_agree_rate: rate(withLabel.filter((x) => x.label_direction === x.flags.direction).length, withLabel.length),
      label_direction: Object.fromEntries(DIRECTIONS.map((d) => [d, withLabel.filter((x) => x.label_direction === d).length])),
      body_direction: Object.fromEntries(DIRECTIONS.map((d) => [d, withLabel.filter((x) => x.flags.direction === d).length])),
      direction_mismatch_count: withLabel.filter((x) => x.label_direction !== x.flags.direction).length,
      direction_mismatch_ids: withLabel.filter((x) => x.label_direction !== x.flags.direction).map((x) => x.id),
      // 라벨만 틀림: 라벨은 기대와 다른데 본문은 기대대로
      label_error: withLabel.filter((x) => x.label_direction !== 'MATCH' && x.flags.direction === 'MATCH').length,
      matrix_label_x_body: matrix,
    },
    evidence_body: {
      n: evRows.length,
      // 주 지표(느슨): 본문에 쓴 문서를 모두 인용했는가. 안 쓴 관련 문서를 더 인용한 것은 허용
      agree_rate: rate(evRows.filter((x) => ['SAME', 'CITED_EXTRA'].includes(x.evidence_relation)).length, evRows.length),
      strict_agree_rate: rate(evRows.filter((x) => x.evidence_relation === 'SAME').length, evRows.length),
      relation_counts: Object.fromEntries(relations.map((k) => [k, evRows.filter((x) => x.evidence_relation === k).length])),
    },
    adoption_declared_vs_content: {
      n: app.length,
      declared_rate: rate(app.filter((x) => x.declared_adopted).length, app.length),
      content_rate: rate(app.filter((x) => x.content_adopted).length, app.length),
      agree_rate: rate(app.filter((x) => x.declared_adopted === x.content_adopted).length, app.length),
      declared_only: app.filter((x) => x.declared_adopted && !x.content_adopted).length,
      content_only: app.filter((x) => !x.declared_adopted && x.content_adopted).length,
    },
  };
}

// 결과 조합: 정답(답변 문장만 본 Judge 판정)에 상태 라벨·근거 라벨이 맞았는지를 더한다. 환각·표현과 무관.
// 근거 조건은 정답 근거 문서가 정해진 행(근거 대상 행)에서만 판정한다.
function resultStats(rows) {
  const app = rows.filter((x) => x.evidence_applicable);
  const r = (rs, fn) => rate(rs.filter(fn).length, rs.length);
  return {
    n: rows.length,
    n_evidence_applicable: app.length,
    correct_rate: r(rows, (x) => x.correct),
    correct_status_rate: r(rows, (x) => x.correct && x.status_label_ok),
    correct_evidence_rate: r(app, (x) => x.correct && x.evidence_label_ok),
    correct_evidence_status_rate: r(app, (x) => x.correct && x.evidence_label_ok && x.status_label_ok),
    // 근거 대상 행으로 좁힌 정답·정답+상태(정답+근거와 같은 분모로 비교할 때)
    correct_rate_on_evidence_rows: r(app, (x) => x.correct),
    correct_status_rate_on_evidence_rows: r(app, (x) => x.correct && x.status_label_ok),
    // 참고: 가장 엄격한 운영 목표 — 정답+근거+상태 + 경로 P0(환각·누락·오적용 없음) + 본문 출처를 모두 인용
    strict_rate: r(rows, (x) => x.strict_ok),
  };
}

function accuracyStats(jobs, results, analyzed) {
  const count = (fn) => results.filter(fn).length;
  const ps = pathStats(analyzed);
  const d = ps.flags.direction, n = analyzed.length;
  return {
    n_expected: jobs.length,
    n_unscorable: jobs.filter((j) => j.unscored_reason).length,
    n_scored: results.length,
    scoring_coverage: rate(results.length, jobs.length),
    n_pending_or_failed: jobs.length - jobs.filter((j) => j.unscored_reason).length - results.length,
    unscorable_reasons: Object.fromEntries([...groupBy(jobs.filter((j) => j.unscored_reason), (j) => j.unscored_reason)]
      .map(([reason, js]) => [reason, js.length])),
    // 미채점을 오답으로 단정하지 않고 전체 요청 중 확인된 정답을 별도로 표시한다.
    confirmed_correct_rate_all_requests: rate(count((r) => r.accuracy.verdict === 'CORRECT'), jobs.length),
    // 내용
    correct_rate: rate(count((r) => r.accuracy.verdict === 'CORRECT'), results.length),
    verdict_counts: Object.fromEntries(['CORRECT', 'INCORRECT', 'INSUFFICIENT_EVIDENCE'].map((v) => [v, count((r) => r.accuracy.verdict === v)])),
    hallucination_rate: rate(count((r) => !r.hallucination.is_grounded), results.length),
    grounded_rate: rate(count((r) => r.hallucination.is_grounded), results.length),
    grounding_score_avg: avg(results.map((r) => r.hallucination.grounding_score)),
    expression_avg: avg(results.map((r) => r.expression_quality)),
    silent_conflict_pick: count((r) => r.hallucination.silent_conflict_pick),
    // 행동
    paths: ps,
    tuning_codes: Object.fromEntries([...groupBy(analyzed, (x) => x.tuning_code)]
      .map(([code, rows]) => [code, rows.length])),
    headline: {
      over_rate: rate(d.OVER, n),
      under_rate: rate(d.UNDER, n),
      cross_rate: rate(d.CROSS, n),
      source_wrong_rate: ps.flags.source_wrong_rate,
      use_error_rate: rate(ps.paths.P5.total + ps.paths.P6.total, n),
    },
    p0_but_incorrect: analyzed.filter((x) => x.path === 'P0' && x.verdict === 'INCORRECT').length, // 실패 조건 해당 등
    error_breakdown: errorBreakdown(analyzed),
    body_answered_without_citation: analyzed.filter((x) => x.body_answered_without_citation).length,
    body_answered_without_citation_rate: rate(analyzed.filter((x) => x.body_answered_without_citation).length,
      analyzed.filter((x) => ANSWERING.has(x.content_stance)).length),
    tuning: tuningStats(analyzed),
    asks_user: asksUserStats(analyzed),
    // 정합 · 결과
    consistency: consistencyStats(analyzed),
    result: resultStats(analyzed),
  };
}

function safetyStats(jobs, results) {
  const applicable = results.filter((r) => r.verdict !== 'NOT_APPLICABLE');
  return {
    n_expected: jobs.length,
    n_scored: results.length,
    verdict_counts: Object.fromEntries(['SAFE', 'UNSAFE', 'OVER_REFUSAL', 'NOT_APPLICABLE'].map((v) => [v, results.filter((r) => r.verdict === v).length])),
    safe_rate_applicable: rate(applicable.filter((r) => r.verdict === 'SAFE').length, applicable.length),
    injection_failures: results.filter((r) => r.resisted_injection === false).length,
    leaked_internal_info: results.filter((r) => r.leaked_internal_info).length,
    fabricated_compliance: results.filter((r) => r.fabricated_compliance).length,
    leaked_others_pii: results.filter((r) => r.leaked_others_pii).length,
  };
}

function personaStats(jobs, results) {
  const violations = {};
  for (const r of results) for (const v of r.violations) violations[v.type] = (violations[v.type] || 0) + 1;
  return {
    n_expected: jobs.length,
    n_scored: results.length,
    adhered_rate: rate(results.filter((r) => r.verdict === 'ADHERED').length, results.length),
    role_tone_avg: avg(results.map((r) => r.role_tone_score)),
    user_fit_avg: avg(results.map((r) => r.user_fit_score).filter((v) => v !== null)),
    violations,
    by_sub: Object.fromEntries([...groupBy(results, (r) => r.persona_sub || '(없음)')].map(([k, rs]) => [k, {
      n: rs.length, adhered_rate: rate(rs.filter((r) => r.verdict === 'ADHERED').length, rs.length),
      role_tone_avg: avg(rs.map((r) => r.role_tone_score)), user_fit_avg: avg(rs.map((r) => r.user_fit_score).filter((v) => v !== null)),
    }])),
  };
}

// 공통 오답 후보: 서로 다른 모델 2개 이상이 같은 문항에서 같은 오답 경로. 판정 도구가 아니라
// 문항 검토 후보 목록이다(모델 수가 적고 같은 계열끼리는 같이 틀리기 쉬워 우연히 겹칠 수 있다).
function commonErrorCandidates(perRun) {
  const models = new Set(perRun.map((r) => r.model));
  if (models.size < 2) return { note: '모델이 1개라 판정하지 않음', candidates: [] };
  const byCase = new Map();
  for (const { model, rows } of perRun) {
    for (const x of rows) {
      if (x.verdict !== 'INCORRECT') continue;
      const key = `${x.id}|${x.path}`;
      if (!byCase.has(key)) byCase.set(key, { id: x.id, item: x.item, path: x.path, models: new Set() });
      byCase.get(key).models.add(model);
    }
  }
  const candidates = [...byCase.values()].filter((c) => c.models.size >= 2)
    .map((c) => ({ ...c, models: [...c.models].sort(), n_models: c.models.size }))
    .sort((a, b) => b.n_models - a.n_models || a.id.localeCompare(b.id));
  return { n_models: models.size, rule: '서로 다른 모델 2개 이상 · 본문 오답 · 같은 문항 · 같은 경로(P0 미분류 포함)', candidates };
}

function main() {
  const { opts } = parseRunArgs(argv);
  if (!opts.batch) throw new Error('--batch <id>가 필요합니다.');
  const batchId = opts.batch;
  const { paths, config, repoRel, label } = profile.load();
  const inputDir = paths.judgeInputsDir(batchId);
  const manifest = JSON.parse(fs.readFileSync(path.join(inputDir, 'manifest.json'), 'utf8'));
  const repeatItem = config.repeatItem;

  const metrics = { batch_id: batchId, report_version: 'tuning-codes-v2', tuning_code_definitions: CODES, tuning_rules: config.tuning,
    rubric_version: manifest.rubric_version, judge: manifest.judge, runs: [] };
  const perRunRows = [];
  for (const run of manifest.runs) {
    const out = { run_id: run.run_id, model: run.model };
    let independentRows = [], safetyRows = [];
    for (const kind of Object.keys(manifest.kinds)) {
      const jobs = readAll(path.join(inputDir, `${kind}_jobs.jsonl`)).filter((j) => j.run_id === run.run_id);
      const jobByKey = new Map(jobs.map((j) => [j.id, j]));
      const evidence = new Map(readAll(path.join(paths.scoredDir(run.run_id), 'evidence.jsonl')).map((e) => [e.id, e]));
      const results = readAll(paths.judgeResultPath(run.run_id, batchId, kind)).filter((r) => !r.error)
        .map((r) => ({ ...r, persona_sub: jobByKey.get(r.id)?.persona_sub ?? null, expected_status: jobByKey.get(r.id)?.expected_status,
          response_status: jobByKey.get(r.id)?.response_status ?? null, evidence: evidence.get(r.id) || null }));
      if (kind === 'accuracy') {
        const analyzed = results.map((r) => analyzeRow(r, config.tuning));
        const byId = new Map(analyzed.map((x) => [x.id, x]));
        const pick = (rs) => rs.map((r) => byId.get(r.id));
        const stats = (js, rs) => accuracyStats(js, rs, pick(rs));
        const indJobs = jobs.filter((j) => j.item !== repeatItem);
        const indRes = results.filter((r) => r.item !== repeatItem);
        independentRows = analyzed.filter((x) => x.item !== repeatItem);
        out.accuracy = {
          independent: stats(indJobs, indRes),
          by_item: Object.fromEntries(config.items.map((i) => i.code).filter((code) => jobs.some((j) => j.item === code))
            .map((code) => [code, stats(jobs.filter((j) => j.item === code), results.filter((r) => r.item === code))])),
          by_expected_status: Object.fromEntries([...groupBy(indRes, (r) => r.expected_status)]
            .map(([s, rs]) => [s, stats(indJobs.filter((j) => j.expected_status === s), rs)])),
          by_difficulty: Object.fromEntries([...groupBy(indRes, (r) => r.difficulty)]
            .map(([d, rs]) => [d, stats(indJobs.filter((j) => j.difficulty === d), rs)])),
        };
        writeJsonl(path.join(paths.scoredDir(run.run_id), 'llm_judge', batchId, 'paths.jsonl'), analyzed);
        perRunRows.push({ model: run.model, rows: analyzed.filter((x) => x.item !== repeatItem) });
      } else if (kind === 'safety') {
        out.safety = safetyStats(jobs, results);
        safetyRows = results.filter((r) => r.item !== repeatItem);
      }
      // 페르소나도 정확도처럼 독립 표본만 집계한다(반복 항목의 페르소나 행이 10회씩 중복으로 섞이지 않게).
      else if (kind === 'persona') out.persona = personaStats(jobs.filter((j) => j.item !== repeatItem), results.filter((r) => r.item !== repeatItem));
    }
    out.tuning_overview = tuningCodeOverview(independentRows, config.tuning, safetyRows);
    writeJson(path.join(paths.scoredDir(run.run_id), 'llm_judge', batchId, 'summary.json'), out);
    metrics.runs.push(out);
  }
  metrics.common_error_candidates = commonErrorCandidates(perRunRows);

  const runs = metrics.runs;
  const header = (cols) => [`| ${cols.join(' | ')} |`, `|${cols.map(() => '---').join('|')}|`];
  const L = [];
  L.push(`# LLM Judge 결과 — 배치 \`${batchId}\``, '');
  L.push(`> 자동 생성(\`scripts/docgen/judge_report.js\`) · ${label} · Judge \`${manifest.judge.model}\` (${manifest.judge.reasoning_effort}) · 루브릭 ${manifest.rubric_version}`);
  L.push('> 분모는 채점에 성공한 행. 전체 요약은 독립 표본(반복 항목 제외). 정확도는 Judge가 **답변 본문만** 보고 판정한 값이다(status·evidence_ids는 Judge에 주지 않음) — v3 정확도(상태 적절성 포함)와 직접 비교하지 않는다.', '');
  L.push('> 여기서 독립 표본은 RT 제외 행을 뜻하는 기존 집계 이름이다. 동일 독립 집계 단위·질문의 변형 행이 남아 있을 수 있어 통계적 독립성이나 고유 시나리오 수를 뜻하지 않는다.', '');

  L.push('## 0. 먼저 볼 문제와 튜닝 묶음', '',
    '**문자 = 판단 방향·튜닝 영역, 숫자 = 근거 상태·세부 문제.** A는 과대, B는 과소, C는 교차 판단이며 1=정답 근거 사용, 2=잘못된 근거 사용, 3=판정 대상 문서가 있지만 본문 문서 근거 없음, 4=근거 정오 판정 대상 외·자료 없음이다. D는 판단 일치 후 근거 선택·활용, E는 출력 정합, F는 문항·판정 검토, S는 안전성이다. 정상은 OK로 표시한다.', '',
    '판단 방향과 근거 상태는 Judge가 답변 본문을 읽어 판정한 행동·출처 기준이다. 모델이 출력한 status·evidence_ids만으로 분류하지 않는다. 라벨 기준 과대·과소와 본문 기준 과대·과소를 각각 계산해 3절에서 비교한다. A1과 A2, A1과 B1은 대응 방향·난이도가 달라 별도 집계한다. 기본 코드는 배타적이며 환각·오적용·누락은 동반 표시로 모두 보존한다. 수단·난이도는 가설이며 같은 코드도 EC·HR·SR·AR 등 항목에 따라 달라질 수 있다. 코드 순서가 심각도 서열은 아니다.', '');
  for (const r of runs) L.push(...renderTuningCodes(r.tuning_overview, r.model, r.run_id), '');
  L.push('### 채점 완료율과 생성 실패 (독립 표본)', '');
  for (const r of runs) {
    const a = r.accuracy?.independent;
    if (!a) continue;
    L.push(`- **${r.model}**: 예정 ${a.n_expected} / 채점 ${a.n_scored} (${pct(a.scoring_coverage)}) / 생성 실패·무응답 ${a.n_unscorable} / Judge 미완료·오류 ${a.n_pending_or_failed} / 평가 자료 판정 불가 ${a.verdict_counts.INSUFFICIENT_EVIDENCE}. 채점된 답변 정답률 ${pct(a.correct_rate)}, 전체 요청 중 확인된 정답 ${pct(a.confirmed_correct_rate_all_requests)}.`);
    if (a.n_unscorable) L.push(`  - 미채점 사유: ${Object.entries(a.unscorable_reasons).map(([reason, n]) => `${reason} ${n}`).join(' · ')}`);
  }
  L.push('', `안전성 채점 범위는 설정의 safetyItems(${config.safetyItems.join(', ')})이다. 미채점 항목의 안전성을 보장하는 요약은 아니다.`);
  for (const r of runs) {
    if (r.safety) L.push(`- ${r.model}: 안전성 예정 ${r.safety.n_expected} / 채점 ${r.safety.n_scored}. 미채점은 SAFE로 간주하지 않는다.`);
  }

  L.push('## 1. 대표 지표', '');
  L.push(...header(['모델', '정답률(답변 문장)', '정답+상태', '정답+근거', '정답+근거+상태', '환각률', '과대', '과소', '교차', '근거 선택 오류', '활용 오류(누락+오적용)', '답했는데 근거 미기재', '되묻기(건)', 'status-본문 일치', '근거-본문 일치', '식별·추론 보강 후보 몫(가설)']));
  for (const r of runs) {
    const a = r.accuracy?.independent;
    if (!a) continue;
    const h = a.headline, c = a.consistency;
    const rs = a.result;
    const modelCandidates = r.tuning_overview.methods.find((m) => m.key === 'MODEL')?.count || 0;
    L.push(`| ${r.model} | ${pct(a.correct_rate)} | ${pct(rs.correct_status_rate)} | ${pct(rs.correct_evidence_rate)} | ${pct(rs.correct_evidence_status_rate)} | ${pct(a.hallucination_rate)} | ${pct(h.over_rate)} | ${pct(h.under_rate)} | ${pct(h.cross_rate)} | ${pct(h.source_wrong_rate)} | ${pct(h.use_error_rate)} | ${pct(a.body_answered_without_citation_rate)} | ${a.asks_user.count} | ${pct(c.status_body.agree_rate)} | ${pct(c.evidence_body.agree_rate)} | ${pct(rate(modelCandidates, r.tuning_overview.n_with_issue))} |`);
  }
  L.push('', '- 정답률은 Judge가 **답변 문장만** 보고 판정(환각·표현·상태·근거와 독립). 정답+상태·정답+근거·정답+근거+상태는 모델이 출력한 라벨 기준 조합이고 환각 여부와 무관 — 정의와 분모는 4절.');
  L.push('- 과대·과소·교차는 **본문 기준**(Judge가 본문만 읽고 정한 행동 vs 기대 상태). 근거 선택 오류는 근거 판정 대상 행 중 비율.');
  L.push('- 근거-본문 일치는 본문에 쓴 문서를 모두 인용한 비율(관련 문서를 더 인용한 것은 허용). 엄격 일치는 3절.');
  L.push('- 답했는데 근거 미기재 = 본문이 답·부분 답·충돌 고지를 했는데 evidence_ids가 빈 비율(설정의 제외 항목 제외).');
  L.push('- 식별·추론 보강 후보 몫 = 문제 행 중 대응 수단이 MODEL로 분류된 몫(가설). 튜닝 한계를 입증한 값이 아니다. 미분류 오답도 검토 대상으로 포함한다 — 4-2절.');

  L.push('', '## 2. 응답 경로표 (독립 표본, 건수 · 괄호는 그중 환각 있음)', '');
  L.push('<details>', '<summary>진단용 경로 코드·표시 펼치기</summary>', '');
  L.push('판단(본문 행동 vs 기대) → 근거(본문 출처 vs 정답 문서) → 내용(오적용·누락) 순으로 처음 걸린 경로. 환각은 모든 경로에 붙는 표시다.', '');
  L.push(...header(['모델', ...PATHS.map((p) => `${p} ${PATH_NAMES[p]}`), 'P0인데 오답']));
  for (const r of runs) {
    const a = r.accuracy?.independent;
    if (!a) continue;
    L.push(`| ${r.model} | ${PATHS.map((p) => `${a.paths.paths[p].total} (${a.paths.paths[p].hallucinated})`).join(' | ')} | ${a.p0_but_incorrect} |`);
  }
  L.push('', '표시별 비율(경로와 무관하게 전체 행 기준 — 앞 단계 경로에 가려진 원인도 보인다):', '');
  L.push(...header(['모델', '판단 일치/과대/과소/교차', '근거 선택 오류(대상 행)', '누락', '오적용', '환각']));
  for (const r of runs) {
    const f = r.accuracy?.independent?.paths.flags;
    if (!f) continue;
    L.push(`| ${r.model} | ${f.direction.MATCH} / ${f.direction.OVER} / ${f.direction.UNDER} / ${f.direction.CROSS} | ${pct(f.source_wrong_rate)} (${f.source_applicable}) | ${pct(f.missing_rate)} | ${pct(f.misapplied_rate)} | ${pct(f.hallucinated_rate)} |`);
  }

  L.push('', '</details>', '', '## 2-1. 되묻기 집계 (독립 표본)', '');
  L.push('v4에는 되묻기 상태(CLARIFY)가 없다. 정보 요청은 ABSTAIN/PARTIAL 안에서 하고, 본문이 답에 필요한 정보(주소·조건·대상 등)를 사용자에게 요청했는지를 Judge가 따로 표시한다(일반 안내·고객센터 문의 안내는 제외). 건수만 집계하며 경로·정답률 계산에는 쓰지 않는다.', '');
  L.push(...header(['모델', '되묻기', '비율', '정답 / 오답', '기대 상태별', '본문 행동별', '항목별']));
  for (const r of runs) {
    const q = r.accuracy?.independent?.asks_user;
    if (!q) continue;
    const fmt = (o) => Object.entries(o).map(([k, v]) => k + ' ' + v).join(', ') || '-';
    L.push('| ' + r.model + ' | ' + q.count + ' | ' + pct(q.rate) + ' | ' + q.correct + ' / ' + q.incorrect + ' | ' + fmt(q.by_expected_status) + ' | ' + fmt(q.by_content_stance) + ' | ' + fmt(q.by_item) + ' |');
  }

  L.push('', '## 3. 정합 — 라벨과 본문 (독립 표본)', '');
  L.push(`라벨(evidence_ids·status)은 본문과 따로 출력되는 값이라 본문과 어긋날 수 있다. 이 테스트의 출력 순서: ${(config.output?.keyOrder || ['status', 'answer', 'evidence_ids']).join(' → ')} (실제 준수율은 run 보고서의 "키 순서 준수"). 출력 순서·형식을 바꾸는 실험은 이 절과 비교한다.`, '');
  L.push('라벨 기준은 출력 status와 기대 상태를 비교한다. 본문 기준은 Judge가 status를 보지 않고 판정한 content_stance와 기대 상태를 비교한다. 기대가 ABSTAIN일 때 status가 ABSTAIN이어도 본문이 확정 답변이면 라벨 기준 일치·본문 기준 과대가 된다. 아래 두 방향 집계는 유효 status가 있는 같은 행에서 비교하며, 전체 본문 기준은 1절에서 본다.', '');
  L.push(...header(['모델', 'status-본문 일치', '방향 일치(라벨 vs 본문)', '라벨 기준 과대/과소/교차', '본문 기준 과대/과소/교차', '방향 불일치(건)', '라벨만 틀림', '근거-본문 일치(느슨/엄격)', '같음/인용 과다/인용 누락/불일치', '채택(인용 기준/내용 기준/일치)']));
  for (const r of runs) {
    const c = r.accuracy?.independent?.consistency;
    if (!c) continue;
    const sb = c.status_body, eb = c.evidence_body, ad = c.adoption_declared_vs_content, rc = eb.relation_counts;
    L.push(`| ${r.model} | ${pct(sb.agree_rate)} (${sb.n}) | ${pct(sb.direction_agree_rate)} | ${sb.label_direction.OVER} / ${sb.label_direction.UNDER} / ${sb.label_direction.CROSS} | ${sb.body_direction.OVER} / ${sb.body_direction.UNDER} / ${sb.body_direction.CROSS} | ${sb.direction_mismatch_count} | ${sb.label_error} | ${pct(eb.agree_rate)} / ${pct(eb.strict_agree_rate)} (${eb.n}) | ${rc.SAME} / ${rc.CITED_EXTRA} / ${rc.CITED_MISSING} / ${rc.MISMATCH} | ${pct(ad.declared_rate)} / ${pct(ad.content_rate)} / ${pct(ad.agree_rate)} |`);
  }
  for (const r of runs) {
    const sb = r.accuracy?.independent?.consistency.status_body;
    if (sb?.direction_mismatch_count) L.push(`- ${r.model} 방향 불일치 대표 문항: ${sb.direction_mismatch_ids.slice(0, 5).join(', ')}. 전체 ID·방향 교차표는 metrics.json에 보존한다.`);
  }

  L.push('', '## 4. 결과 — 정답 · 정답+상태 · 정답+근거 · 정답+근거+상태', '');
  L.push('정답 = Judge가 답변 문장만 보고 CORRECT로 판정. 상태 = 모델이 출력한 status가 기대 상태와 같음. 근거 = 모델이 출력한 evidence_ids가 하나 이상이고 모두 정답 근거 문서(틀린 문서를 섞지 않음 — 정답 근거 문서가 정해진 "근거 대상 행"에서만 판정). 환각·표현과 무관하다. 근거가 들어간 조합은 근거 대상 행이 분모이므로, 같은 분모의 정답·정답+상태를 함께 적는다. 엄격 = 정답+근거+상태 + 경로 P0(환각·누락·오적용 없음) + 본문에 쓴 문서를 모두 인용(참고용 운영 목표).', '');
  L.push(...header(['모델', '정답 (전체)', '정답+상태 (전체)', '정답 (근거 대상 행)', '정답+상태 (근거 대상 행)', '정답+근거', '정답+근거+상태', '엄격(참고)']));
  for (const r of runs) {
    const x = r.accuracy?.independent?.result;
    if (!x) continue;
    L.push(`| ${r.model} | ${pct(x.correct_rate)} (${x.n}) | ${pct(x.correct_status_rate)} | ${pct(x.correct_rate_on_evidence_rows)} (${x.n_evidence_applicable}) | ${pct(x.correct_status_rate_on_evidence_rows)} | ${pct(x.correct_evidence_rate)} | ${pct(x.correct_evidence_status_rate)} | ${pct(x.strict_rate)} |`);
  }

  L.push('', '## 4-1. 문제 분해 — 정답 행과 오답 행을 같은 분류로 (독립 표본)', '');
  L.push('<details>', '<summary>배타 분류·정답/오답 세부 집계 펼치기</summary>', '');
  L.push('정답·오답 = Judge가 답변 문장만 보고 판정. 상태는 **본문 행동** 기준(라벨 아님), 근거는 본문 출처가 정답 문서인가. 위에서부터 처음 걸린 칸 하나에 넣는다(행 합계 = 정답 수 / 오답 수). 칸마다 "건수 (환각 동반)"이고, 상태 틀림 칸은 근거 O/X/대상 외로 한 번 더 나눈다. 마지막 칸은 오답이면 기타(실패 조건 등), 정답이면 문제 없음.', '');
  L.push('같은 문제 유형도 항목에 따라 대응 수단이 달라진다(예: 과대 판단의 EC·HR·SR). 실제 묶음은 0절의 항목 코드와 대응 수단을 함께 본다. 정답 여부와 별도로 환각 동반을 확인한다.', '');
  L.push(...header(['모델', '정답 여부', '행', ...ERROR_CATS.map((c) => (c === 'OTHER' ? '상태·근거 맞음 · 기타 / 문제 없음' : ERROR_CAT_NAMES[c]))]));
  const cellOf = (cats, c) => {
    const v = cats[c];
    const base = `${v.total} (${v.hallucinated})`;
    return c.startsWith('STATUS_') && v.total ? `${base}<br>근거 O${v.source.ok}·X${v.source.wrong}·-${v.source.na}` : base;
  };
  for (const r of runs) {
    const eb = r.accuracy?.independent?.error_breakdown;
    if (!eb) continue;
    L.push(`| ${r.model} | 오답 | ${eb.incorrect} | ${ERROR_CATS.map((c) => cellOf(eb.categories, c)).join(' | ')} |`);
    L.push(`| ${r.model} | 정답 | ${eb.correct.total} | ${ERROR_CATS.map((c) => cellOf(eb.correct_categories, c)).join(' | ')} |`);
    L.push(`| ${r.model} | 평가 자료 판정 불가 | ${eb.undetermined} | ${ERROR_CATS.map((c) => cellOf(eb.undetermined_categories, c)).join(' | ')} |`);
    L.push(`| ${r.model} | **합계** | ${eb.n} | ${ERROR_CATS.map((c) => cellOf(eb.all_categories, c)).join(' | ')} |`);
  }
  L.push('', '읽는 법: 튜닝 수단은 **합계** 줄의 칸 크기로 고르고, 우선순위와 효과 판정은 **오답** 줄로 본다(합치면 정답 쪽의 쉬운 개선이 섞여 효과가 부풀 수 있다). 정답 줄의 상태 틀림이 크면 문항의 기대 상태·필수 사실 기준을 먼저 의심한다.');
  L.push('', '오답 중 표시 비율(겹침 허용 — 위 표에서 앞 칸에 가려진 원인도 보인다):', '');
  L.push(...header(['모델', '상태 틀림', '근거 틀림', '오적용', '누락', '환각']));
  for (const r of runs) {
    const i = r.accuracy?.independent?.error_breakdown?.incidence_in_incorrect;
    if (i) L.push(`| ${r.model} | ${pct(i.status_wrong)} | ${pct(i.source_wrong)} | ${pct(i.misapplied)} | ${pct(i.missing)} | ${pct(i.hallucinated)} |`);
  }
  L.push('', '정답인데 다른 문제가 있는 경우(사용자에게 보인 답의 핵심은 맞음):', '');
  L.push(...header(['모델', '정답', '+ 환각 덧붙임', '+ status 라벨 틀림', '+ 정답 문서 미인용', '+ 근거 미기재']));
  for (const r of runs) {
    const c = r.accuracy?.independent?.error_breakdown?.correct;
    if (c) L.push(`| ${r.model} | ${c.total} | ${c.with_hallucination} | ${c.status_label_wrong} | ${c.evidence_label_wrong} | ${c.answered_without_citation} |`);
  }
  L.push('', '대응 수단 가설은 test.config.js의 tuning에서 읽는다. 환각 동반은 0절에서 별도 문제로 함께 묶는다.', '', '</details>');

  L.push('', '## 4-2. 튜닝 방법별 문항 수 (RT 제외)', '');
  L.push('0절의 새 튜닝 코드·항목별 대응 가설로 집계한다. 한 문항에 여러 수단을 제안할 수 있으므로 수단별 건수는 합산하지 않는다. 안전성 실패도 포함한다. MODEL은 능력 한계 판정이 아니라 문서 식별·추론 보강 실험 후보다. 상위 모델 전환은 같은 문항에서 튜닝 전후 변화와 속도·회귀를 확인한 뒤 결정한다.', '');
  L.push(...header(['모델', '문제 문항', ...LEVERS.map((l) => LEVER_NAMES[l])]));
  for (const r of runs) {
    const t = r.tuning_overview;
    L.push(`| ${r.model} | ${t.n_with_issue} | ${LEVERS.map((l) => t.methods.find((m) => m.key === l)?.count || 0).join(' | ')} |`);
  }

  L.push('', '## 5. 항목별 — 정확도 / 환각률 / 가장 많은 튜닝 코드', '');
  L.push(...header(['항목', ...runs.map((r) => r.model)]));
  for (const code of config.items.map((i) => i.code)) {
    if (!runs.some((r) => r.accuracy?.by_item?.[code])) continue;
    L.push(`| ${code} ${itemName(code)} | ${runs.map((r) => {
      const v = r.accuracy?.by_item?.[code];
      if (!v) return '-';
      const top = Object.entries(v.tuning_codes).filter(([c]) => CODES[c]).sort((a, b) => b[1] - a[1])[0];
      return `${pct(v.correct_rate)} / ${pct(v.hallucination_rate)} / ${top ? `${top[0]} ${CODES[top[0]].title} ${top[1]}건` : '-'}`;
    }).join(' | ')} |`);
  }

  L.push('', '## 6. 기대 상태별 정확도 (독립 표본)', '');
  const statuses = [...new Set(runs.flatMap((r) => Object.keys(r.accuracy?.by_expected_status || {})))].sort();
  L.push(...header(['기대 상태', ...runs.map((r) => r.model)]));
  for (const st of statuses) L.push(`| ${st} | ${runs.map((r) => { const v = r.accuracy?.by_expected_status?.[st]; return v ? `${pct(v.correct_rate)} (${v.n_scored})` : '-'; }).join(' | ')} |`);

  L.push('', '## 7. 안전성 · 페르소나', '');
  L.push(...header(['모델', '안전성 SAFE/UNSAFE/OVER/NA', '페르소나 준수', '역할·말투 /5', '사용자 맞춤 /5']));
  for (const r of runs) {
    const s = r.safety, p = r.persona;
    const sv = s && s.n_expected ? ['SAFE', 'UNSAFE', 'OVER_REFUSAL', 'NOT_APPLICABLE'].map((k) => s.verdict_counts[k]).join('/') : '-';
    L.push(`| ${r.model} | ${sv} | ${p && p.n_expected ? pct(p.adhered_rate) : '-'} | ${p && p.n_expected ? num(p.role_tone_avg, 2) : '-'} | ${p && p.n_expected ? num(p.user_fit_avg, 2) : '-'} |`);
  }

  const ce = metrics.common_error_candidates;
  L.push('', '## 8. 공통 오답 후보 (공통 원인·문항 검토)', '', '같이 틀렸다는 사실만으로 문항 오류나 튜닝 불필요를 확정하지 않는다. 입력·기대 답변과 모델의 공통 약점을 함께 검토한다.', '');
  if (!ce.candidates.length) L.push(ce.note || '해당 없음');
  else {
    L.push(`규칙: ${ce.rule}. 총 ${ce.candidates.length}건(상위 50건 표시, 전체는 metrics.json).`, '');
    L.push(...header(['문항', '항목', '경로', '모델']));
    for (const c of ce.candidates.slice(0, 50)) L.push(`| ${c.id} | ${c.item} | ${c.path} ${PATH_NAMES[c.path]} | ${c.models.join(', ')} |`);
  }

  L.push('', '## 9. 파일', '', `- 입력: \`${repoRel(inputDir)}/\``, `- 판정: \`raw/scored/<run_id>/llm_judge/${batchId}/<kind>.jsonl\``,
    `- 행별 경로·표시·정합: \`raw/scored/<run_id>/llm_judge/${batchId}/paths.jsonl\``, `- 원자료: \`${batchId}_metrics.json\``);

  fs.mkdirSync(paths.llmJudgeDir, { recursive: true });
  writeJson(path.join(paths.llmJudgeDir, `${batchId}_metrics.json`), metrics);
  const mdPath = path.join(paths.llmJudgeDir, `${batchId}_report.md`);
  fs.writeFileSync(mdPath, L.join('\n') + '\n', 'utf8');
  console.log(`Judge 보고서 -> ${repoRel(mdPath)}`);
  console.log('run 보고서에 반영하려면: node scripts/docgen/build_run_report.js <run_id> (또는 compare_runs.js)');
}

if (require.main === module) {
  try { main(); } catch (e) { console.error(e.message); process.exit(1); }
}
module.exports = { analyzeRow, accuracyStats, commonErrorCandidates, main };
