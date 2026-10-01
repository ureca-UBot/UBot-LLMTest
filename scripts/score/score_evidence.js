'use strict';
// 근거 채택: 응답의 evidence_ids(모델이 근거로 썼다고 밝힌 문서)를 정답 근거 문서와 비교한다.
// 완전 결정론. 환각(입력에 없는 내용을 지어냄)과는 다른 축이다 — 맞는 문서를 고르고도
// 환각을 덧붙일 수 있고, 틀린 문서의 진짜 내용을 가져올 수도 있다. 두 축의 교차는
// judge_report.js가 LLM Judge 환각 판정과 합쳐 2×2로 보여준다.
//
// 정답 근거 문서
//   - 데이터셋 '근거 원문 FAQ ID' 중 제공 Context에 실제로 있는 ID
//   - 원문 ID가 Context에 없고 그 자리를 시험 문서(TEST-CF-*-A/B, TEST-AD-*)가 대신하면 그 시험 문서
//     (정답 예시·필수 사실에 "문서 A"·"문서 B" 중 하나만 나오면 그 문서만 — CF ANSWER 100행)
//   - 둘 다 없으면(HR·EC·대부분의 SR·OUT_OF_SCOPE) 채택 판정 대상이 아니다(not_applicable)
// 판정 범위는 test.config.js의 evidence에서 더 좁힌다: excludeItems(예: AR — API만으로 답하면
// 빈 인용이 정상) 제외, expectedStatuses(답을 내야 하는 기대 상태)만 판정. 제외 사유는 행마다 남긴다.
//
// 채택 분류(대상 행)
//   EXACT        정답 문서만 정확히 인용
//   WITH_EXTRA   정답 문서를 모두 인용 + 다른 문서도 인용
//   (채택 = EXACT 또는 PARTIAL — 인용한 문서가 모두 정답 근거 문서. 엄격 채택 = EXACT 또는 WITH_EXTRA)
//   PARTIAL      정답 문서 일부만 인용
//   WRONG        인용했지만 정답 문서가 하나도 없음
//   NONE         인용 없음(빈 배열·파싱 실패)
// 별도로 Context에 없는 ID를 인용했는지(invalid_ids)도 기록한다.
// 사용자 정보/API 결과·대화 이력을 가리키는 꼬리표(예: "사용자 정보 / API 결과")는 문서 인용이 아니므로
// 채택 판정 전에 떼어 내고 non_doc_labels로 따로 센다 — 없는 문서 ID를 지어낸 것(invalid_ids)과 섞지 않는다.
// 꼬리표만 적고 문서를 적지 않은 행은 그대로 NONE이다.
//
//   raw/scored/<run_id>/evidence.jsonl
//   raw/scored/<run_id>/evidence_summary.json
//
// Usage: node scripts/score/score_evidence.js <run_id> [--test v4] [--try try1]

const path = require('path');
const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { loadRun, summarizeScopes, headlineScope, writeJson, writeJsonl, runIdArg } = require('../lib/run_data');
const { splitContextBlocks } = require('../lib/context_blocks');
const { rate, avg, pct } = require('../lib/stats');

const CATEGORIES = ['EXACT', 'WITH_EXTRA', 'PARTIAL', 'WRONG', 'NONE'];

function normalizeId(id) {
  return String(id).trim().replace(/^\[\s*/, '').replace(/\s*\]$/, '').trim();
}
// Context 블록 머리글 "[사용자 정보 / API 결과]"·"[대화 이력]"과 Judge 꼬리표 USER_INFO_API·HISTORY를 가리키는 표기
const NON_DOC_LABEL_RE = /사용자\s*정보|API|대화\s*이력|USER_INFO|HISTORY/i;
const isNonDocLabel = (id, contextIds) => !contextIds.includes(id) && NON_DOC_LABEL_RE.test(id);
// 답을 낸(문서를 근거로 삼았어야 하는) 상태 라벨
const ANSWERING = new Set(['ANSWER', 'PARTIAL', 'CONFLICT']);

function goldEvidence(c) {
  const contextIds = splitContextBlocks(c.context).map((b) => b.id).filter(Boolean);
  const ctx = new Set(contextIds);
  const source = (c.sourceFaqIds || '').split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
  const present = source.filter((id) => ctx.has(id));
  if (present.length) return { gold: present, basis: 'dataset', contextIds };
  const testDocs = contextIds.filter((id) => id.startsWith('TEST-'));
  if (source.length && testDocs.length) {
    // CF 시험 문서는 A·B 두 개다. 정답이 그중 하나만 근거로 쓰면(예: "기준 시각에는 문서 B가 유효합니다")
    // 그 문서만 정답 근거로 잡는다 — 두 문서를 모두 요구하면 유효한 문서만 정확히 인용한 응답이 PARTIAL이
    // 된다. 정답에 두 문서가 다 나오거나(CONFLICT) 아무 문서도 명시되지 않으면 시험 문서 전체를 쓴다.
    const named = [...new Set(((c.referenceAnswer || '') + '\n' + (c.requiredFacts || '')).match(/문서 [AB]/g) || [])];
    if (named.length === 1) {
      const suffix = `-${named[0].slice(-1)}`;
      const one = testDocs.filter((id) => id.endsWith(suffix));
      if (one.length) return { gold: one, basis: 'test_doc_substitute_named', contextIds };
    }
    return { gold: testDocs, basis: 'test_doc_substitute', contextIds };
  }
  return { gold: [], basis: source.length ? 'source_not_in_context' : 'no_source', contextIds };
}

function classify(gold, cited) {
  if (!cited.length) return 'NONE';
  const hit = gold.filter((g) => cited.includes(g)).length;
  if (hit === 0) return 'WRONG';
  if (hit < gold.length) return 'PARTIAL';
  return cited.every((id) => gold.includes(id)) ? 'EXACT' : 'WITH_EXTRA';
}

function main() {
  const runId = runIdArg(argv);
  const { config } = profile.load();
  const scope = config.evidence || {};
  const excludeItems = new Set(scope.excludeItems || []);
  const expectedStatuses = scope.expectedStatuses ? new Set(scope.expectedStatuses) : null;
  const { rows, scoredDir } = loadRun(runId);
  const scored = rows.map(({ g, c }) => {
    const { gold, basis, contextIds } = goldEvidence(c);
    // 표기만 다른 인용(예: "[FAQ-104]", 앞뒤 공백)은 같은 문서로 본다 — 틀린 문서를 고른 경우와 섞이지 않게.
    const rawCited = Array.isArray(g.parsed?.evidence_ids) ? g.parsed.evidence_ids.map(String) : [];
    const normalized = [...new Set(rawCited.map(normalizeId).filter(Boolean))];
    const nonDocLabels = normalized.filter((id) => isNonDocLabel(id, contextIds));
    const cited = normalized.filter((id) => !nonDocLabels.includes(id));
    const invalid = cited.filter((id) => !contextIds.includes(id));
    const excludedBy = excludeItems.has(c.item) ? 'EXCLUDED_ITEM'
      : expectedStatuses && !expectedStatuses.has(c.expectedStatus) ? 'EXPECTED_STATUS'
        : !gold.length ? 'NO_GOLD' : null;
    const applicable = !excludedBy;
    const hit = gold.filter((id) => cited.includes(id)).length;
    return {
      id: g.id, run_id: runId, model_tag: g.model_tag, item: c.item,
      expected_status: c.expectedStatus, predicted_status: g.parsed?.status ?? null,
      gold_ids: gold, gold_basis: basis, cited_ids: cited, cited_ids_raw: rawCited, invalid_ids: invalid,
      non_doc_labels: nonDocLabels,
      applicable,
      excluded_by: excludedBy,
      // 답했는데 근거 미기재: 답·부분 답·충돌 고지로 라벨을 달고 evidence_ids가 비어 있음.
      // 기대 상태와 무관하게 센다(보류해야 할 질문에 인용 없이 답한 경우도 잡힘). 제외 항목(AR 등)은 뺀다.
      answered_without_citation: !excludeItems.has(c.item) && ANSWERING.has(g.parsed?.status) && cited.length === 0,
      category: applicable ? classify(gold, cited) : null,
      gold_recall: applicable ? hit / gold.length : null,
      precision: applicable && cited.length ? hit / cited.length : null,
      // 채택(주 기준): 인용한 문서가 모두 정답 근거 문서이고 하나 이상 인용함(틀린 문서를 섞지 않음).
      // 데이터셋의 근거 원문 ID는 "추적용"이라 답에 쓸 내용이 없는 절차 안내 문서도 들어 있어(예: UI의 FAQ-1001),
      // 전부 인용을 요구하면 정확한 인용도 PARTIAL이 된다. 전부 인용은 엄격 기준으로 따로 남긴다. 여러 문서를
      // 조합해야 하는 문항의 빠진 문서는 Judge의 누락 판정으로 잡힌다.
      adopted: applicable ? cited.length > 0 && cited.every((id) => gold.includes(id)) : null,
      gold_fully_cited: applicable ? hit === gold.length : null,
    };
  });

  const byId = new Map(rows.map(({ c }) => [c.id, c]));
  const caseOf = (r) => byId.get(r.id);
  const fn = (rs) => {
    const app = rs.filter((r) => r.applicable);
    return {
      n: rs.length,
      n_applicable: app.length,
      adoption_rate: rate(app.filter((r) => r.adopted).length, app.length),
      adoption_strict_rate: rate(app.filter((r) => r.gold_fully_cited).length, app.length),
      exact_rate: rate(app.filter((r) => r.category === 'EXACT').length, app.length),
      gold_recall_avg: avg(app.map((r) => r.gold_recall)),
      precision_avg: avg(app.map((r) => r.precision)),
      category_counts: Object.fromEntries(CATEGORIES.map((k) => [k, app.filter((r) => r.category === k).length])),
      invalid_citation_rate: rate(rs.filter((r) => r.invalid_ids.length).length, rs.length),
      non_doc_label_rows: rs.filter((r) => r.non_doc_labels.length).length,
      non_doc_label_rate: rate(rs.filter((r) => r.non_doc_labels.length).length, rs.length),
      answering_rows: rs.filter((r) => !excludeItems.has(r.item) && ANSWERING.has(r.predicted_status)).length,
      answered_without_citation: rs.filter((r) => r.answered_without_citation).length,
      answered_without_citation_rate: rate(rs.filter((r) => r.answered_without_citation).length,
        rs.filter((r) => !excludeItems.has(r.item) && ANSWERING.has(r.predicted_status)).length),
      not_applicable_citing_rate: rate(rs.filter((r) => !r.applicable && r.cited_ids.length).length, rs.filter((r) => !r.applicable).length),
    };
  };
  const summary = {
    run_id: runId,
    definition: '채택률 = 인용한 문서가 모두 정답 근거 문서이고 하나 이상 인용한 비율(틀린 문서 없음). 엄격 채택률 = 정답 근거 문서를 모두 인용한 비율. 대상 행 기준. 정답 근거가 없는 행, 제외 항목, 대상 외 기대 상태는 빼고 excluded_by에 사유를 남긴다.',
    scope: { exclude_items: [...excludeItems], expected_statuses: expectedStatuses ? [...expectedStatuses] : null },
    ...summarizeScopes(scored, caseOf, fn),
  };
  writeJsonl(path.join(scoredDir, 'evidence.jsonl'), scored);
  writeJson(path.join(scoredDir, 'evidence_summary.json'), summary);
  const { label, s } = headlineScope(summary, 'n_applicable');
  console.log(`근거 채택률 ${pct(s.adoption_rate)} (엄격 ${pct(s.adoption_strict_rate)}) · 정확 인용 ${pct(s.exact_rate)} · 정밀도 ${pct(s.precision_avg)} · 없는 ID 인용 ${pct(s.invalid_citation_rate)} · 사용자 정보/API 꼬리표 인용 ${s.non_doc_label_rows}행 (${label} 대상 ${s.n_applicable}/${s.n}행)`);
  console.log(`답했는데 근거 미기재 ${s.answered_without_citation}건 (${pct(s.answered_without_citation_rate)}, 답·부분 답·충돌 라벨 ${s.answering_rows}행 중)`);
}

try { main(); } catch (e) { console.error(e.message); process.exit(1); }
