'use strict';
// 저장된 결과/Judge만 읽는 진단 문서 생성기. 모델/API를 호출하거나 서비스 설정을 변경하지 않는다.
// node scripts/docgen/pipeline_hallucination_progression.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert/strict');
const { parseCsvObjects } = require('../lib/csv');
const { buildUserText } = require('../judge/judge_pipeline');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'pipeline_test_v4/try2/results/review');
const CONFIG = 'pipeline_test_v4/analysis/hallucination_controls.json';
const MAIN = ['single', 'sub', 'slot'];
const LABEL = { single: 'v1 single', sub: 'v1 sub', slot: 'v4 slot', v4sub: 'v4 sub(보조 기준)' };
const CONFIGS = [
  ['single', 'pipeline_test_v1/try1/results', 'local-win_qwen3-4b-instruct_t0_pv1_single_n390_20261020', ['pv1-try1', 'pv1-try1-store']],
  ['sub', 'pipeline_test_v1/try1/results', 'local-win_qwen3-4b-instruct_t0_pv1_sub_n390_20261020', ['pv1-try1', 'pv1-try1-store']],
  ['slot', 'pipeline_test_v4/try2/results', 'local-win_qwen3-4b-instruct_t0_pv4_slot_n390_20261023', ['pv4-try2']],
  ['v4sub', 'pipeline_test_v4/try2/results', 'local-win_qwen3-4b-instruct_t0_pv4_sub_n390_20261023', ['pv4-try2']],
];
const TYPE_NAMES = { SA: '단일·답할 수 있음', SB: '단일·묻는 값 없음', UD: '사용자 정보', MA: '복합·모두 답할 수 있음', MP: '복합·답할 수 있음+없음', MN: '복합·모두 답할 수 없음', OS: '범위 밖 포함', IN: '질문 내부 일부 미확인', CQ: '모호한 질문', MT: '멀티턴', ST: '매장' };
const CLAIM_NAMES = { FABRICATION: '없는 사실·값 생성', MISATTRIBUTION: '대상·속성·근거 오적용', UNSUPPORTED_GENERALIZATION: '조건 누락·범위 확대', SILENT_CONFLICT_PICK: '상충 자료의 임의 선택', FALSE_COMPLETION: '미실행 작업 완료 주장' };
const AREA_NAMES = { FAQ_FACT: 'FAQ 사실·정책', USER_FACT: '사용자 필드·날짜', STORE_FACT: '매장 반환 필드', HISTORY_BINDING: '대화 대상 연결', QUERY_ENTITY: '장소 엔티티', OUTPUT_FORMAT: '출력 값·포맷' };
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const sourceFiles = {};
function read(file) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  sourceFiles[file] = { sha256: sha(text), bytes: Buffer.byteLength(text) };
  return text.split(/\r?\n/).flatMap((line, i) => line.trim() ? [{ data: JSON.parse(line), source: { file, line: i + 1 } }] : []);
}
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, CONFIG), 'utf8'));
const faqPath = 'pipeline_test_v1/cases/faq_snapshot.csv';
const faqText = fs.readFileSync(path.join(ROOT, faqPath), 'utf8');
const faqs = new Map(parseCsvObjects(faqText).map(f => [String(f.faqId), f]));
sourceFiles[faqPath] = { sha256: sha(faqText), bytes: Buffer.byteLength(faqText) };
const runs = {};
for (const [mode, root, runId, batches] of CONFIGS) {
  const raw = new Map(read(`${root}/raw/${runId}/results.jsonl`).map(x => [x.data.id, x]));
  const scores = new Map(read(`${root}/raw/scored/${runId}/case_scores.jsonl`).map(x => [x.data.id, x]));
  const judgments = new Map();
  for (const batch of batches) for (const x of read(`${root}/llm_judge/${batch}/${runId}.judgments.jsonl`)) {
    if (!x.data.error) judgments.set(x.data.id, x);
  }
  assert.equal(raw.size, 390, `${mode}: 390 unique cases`);
  assert.equal(scores.size, 390, `${mode}: 390 scores`);
  for (const [id, entry] of judgments) {
    const j = entry.data, s = scores.get(id).data;
    assert.equal(j.is_grounded, j.grounding_score >= 4, `${mode}/${id}: grounding consistency`);
    assert.equal(j.is_grounded, s.judge?.is_grounded, `${mode}/${id}: merged judge matches score`);
    assert.equal(sha(buildUserText(raw.get(id).data, faqs)), j.user_text_sha256, `${mode}/${id}: judge input hash`);
  }
  runs[mode] = { runId, batches, raw, scores, judgments };
}
const ids = [...runs.single.raw.keys()].sort();
for (const id of ids) for (const mode of Object.keys(runs)) {
  const a = runs.single.raw.get(id).data, b = runs[mode].raw.get(id).data;
  assert.equal(a.question, b.question, `${mode}/${id}: same question`);
  assert.deepEqual(a.turns, b.turns, `${mode}/${id}: same user history questions`);
  assert.deepEqual(a.expected, b.expected, `${mode}/${id}: same expected case`);
}
const raw = (mode, id) => runs[mode].raw.get(id).data;
const score = (mode, id) => runs[mode].scores.get(id).data;
const judge = (mode, id) => runs[mode].judgments.get(id)?.data;
const hall = (mode, id) => judge(mode, id)?.is_grounded === false;
const typesFor = (mode, id) => hall(mode, id) ? [...new Set(judge(mode, id).hallucinated_claims.map(c => c.type))] : [];
const common = ids.filter(id => MAIN.every(mode => judge(mode, id)));
const union = ids.filter(id => MAIN.some(mode => hall(mode, id)));
assert.deepEqual([...Object.keys(catalog.cases)].sort(), [...union].sort(), 'all hallucination cases have a reviewed control annotation');
for (const [id, a] of Object.entries(catalog.cases)) {
  for (const code of [...a.controls, ...Object.values(a.variant_controls || {}).flat()]) assert(catalog.rules[code], `${id}/${code}: known rule`);
}
function metric(mode, selected) {
  const judged = selected.filter(id => judge(mode, id));
  const affected = judged.filter(id => hall(mode, id));
  return {
    judged: judged.length, hallucinations: affected.length, rate: judged.length ? 100 * affected.length / judged.length : null,
    correct: judged.filter(id => judge(mode, id).accuracy === 'CORRECT').length,
    empty_answers_included: judged.filter(id => score(mode, id).model_answer_empty).length,
    ids: affected,
    types: Object.fromEntries(Object.keys(CLAIM_NAMES).map(type => [type, {
      cases: affected.filter(id => typesFor(mode, id).includes(type)).length,
      claims: affected.flatMap(id => judge(mode, id).hallucinated_claims).filter(c => c.type === type).length,
      ids: affected.filter(id => typesFor(mode, id).includes(type)),
    }])),
  };
}
function transition(before, after, selected = ids) {
  const pair = selected.filter(id => judge(before, id) && judge(after, id));
  const removed = pair.filter(id => hall(before, id) && !hall(after, id));
  const added = pair.filter(id => !hall(before, id) && hall(after, id));
  const kept = pair.filter(id => hall(before, id) && hall(after, id));
  return {
    before, after, common_judged: pair.length, removed, added, kept,
    removed_to_empty: removed.filter(id => score(after, id).model_answer_empty),
    removed_with_text: removed.filter(id => !score(after, id).model_answer_empty),
    removed_but_incorrect: removed.filter(id => judge(after, id).accuracy !== 'CORRECT'),
    added_by_new_coverage: selected.filter(id => !judge(before, id) && hall(after, id)),
    removed_types: Object.fromEntries(Object.keys(CLAIM_NAMES).map(t => [t, removed.filter(id => typesFor(before, id).includes(t))])),
    added_types: Object.fromEntries(Object.keys(CLAIM_NAMES).map(t => [t, added.filter(id => typesFor(after, id).includes(t))])),
    type_changes: Object.fromEntries(Object.keys(CLAIM_NAMES).map(t => [t, {
      removed: pair.filter(id => typesFor(before, id).includes(t) && !typesFor(after, id).includes(t)),
      added: pair.filter(id => !typesFor(before, id).includes(t) && typesFor(after, id).includes(t)),
    }])),
  };
}
function store(r) {
  return (r.trace?.answer_llm?.sections || []).some(s => s.title === '현재 위치 근처 매장')
    || (r.trace?.answer_llm?.tools || []).includes('STORE_SEARCH') || (r.trace?.store_tool_calls || []).length > 0;
}
const axes = {
  multi_question: { label: '다중 질문(기대 하위 질문 2개 이상)', test: r => r.expected.sub_questions.length > 1 },
  multi_turn: { label: '멀티턴(이전 사용자 턴 있음)', test: r => r.turns.length > 0 },
  single_no_history: { label: '단건·이전 턴 없음', test: r => r.expected.sub_questions.length === 1 && r.turns.length === 0 },
  user_data_context: { label: '사용자 정보 섹션이 실제 입력에 포함', test: r => (r.trace?.answer_llm?.sections || []).some(s => s.title === '사용자 정보') },
  store_context: { label: '매장 섹션 또는 STORE_SEARCH 연동', test: store },
};
const operational = Object.fromEntries(Object.entries(axes).map(([key, axis]) => [key, {
  label: axis.label, overlap_allowed: true,
  common: Object.fromEntries(MAIN.map(mode => [mode, metric(mode, common.filter(id => axis.test(raw(mode, id))))])),
  all: Object.fromEntries(MAIN.map(mode => [mode, metric(mode, ids.filter(id => axis.test(raw(mode, id))))])),
}]));
const byType = Object.fromEntries(Object.keys(TYPE_NAMES).map(type => [type, {
  label: TYPE_NAMES[type],
  common: Object.fromEntries(MAIN.map(mode => [mode, metric(mode, common.filter(id => raw(mode, id).type === type))])),
  all: Object.fromEntries(MAIN.map(mode => [mode, metric(mode, ids.filter(id => raw(mode, id).type === type))])),
}]));
function drift(a, b, id) {
  const x = raw(a, id), y = raw(b, id), xa = x.trace?.answer_llm || {}, ya = y.trace?.answer_llm || {};
  const eq = (left, right) => JSON.stringify(left) === JSON.stringify(right);
  return {
    faq_set_changed: !eq([...(xa.prompt_faq_ids || [])].sort(), [...(ya.prompt_faq_ids || [])].sort()),
    sub_question_input_changed: !eq(xa.prompt_sub_questions || [], ya.prompt_sub_questions || []),
    search_queries_changed: !eq((x.trace?.sub_questions || []).map(s => s.search_query), (y.trace?.sub_questions || []).map(s => s.search_query)),
    context_sections_changed: !eq(xa.sections || [], ya.sections || []),
    previous_model_answers_changed: !eq((x.response?.turns || []).map(t => t.answer), (y.response?.turns || []).map(t => t.answer)),
    store_result_changed: !eq(x.trace?.store_tool_calls || [], y.trace?.store_tool_calls || []),
  };
}
const cases = union.map(id => ({
  id, question: raw('single', id).question, type: raw('single', id).type,
  previous_user_questions: raw('single', id).turns, expected: raw('single', id).expected,
  common_three: common.includes(id), annotation: catalog.cases[id],
  pattern: MAIN.map(mode => !judge(mode, id) ? '미판정' : hall(mode, id) ? '환각' : '없음').join(' → '),
  input_drift: { single_sub: drift('single', 'sub', id), sub_slot: drift('sub', 'slot', id), v4sub_slot: drift('v4sub', 'slot', id) },
  variants: Object.fromEntries(MAIN.map(mode => {
    const r = raw(mode, id), s = score(mode, id), j = judge(mode, id), llm = r.trace?.answer_llm;
    return [mode, {
      final_status: s.final_actual, path: s.path, exec_error: s.exec_error,
      model_answer: llm?.answer ?? null, code_notice: llm?.code_notice ?? null,
      user_answer: r.response?.final?.answer ?? null, sub_statuses: llm?.statuses ?? null,
      statuses_valid: llm?.statuses_valid ?? null, slots: llm?.slots ?? null,
      prompt_faq_ids: llm?.prompt_faq_ids ?? [], prompt_sub_questions: llm?.prompt_sub_questions ?? [],
      search_queries: (r.trace?.sub_questions || []).map(t => t.search_query),
      previous_answers: (r.response?.turns || []).map(t => ({ question: t.question, answer: t.answer, error_code: t.error_code })),
      context_titles: (llm?.sections || []).map(s => s.title), store_context: store(r),
      accuracy: j?.accuracy ?? null, is_grounded: j?.is_grounded ?? null,
      grounding_score: j?.grounding_score ?? null, hallucinated_claims: j?.hallucinated_claims ?? [],
      sub_results: j?.sub_results ?? null, reasoning: j?.reasoning ?? null,
      relevant_controls: hall(mode, id) ? catalog.cases[id].variant_controls?.[mode] || catalog.cases[id].controls : [],
      sources: { raw: runs[mode].raw.get(id).source, score: runs[mode].scores.get(id).source, judgment: runs[mode].judgments.get(id)?.source ?? null },
    }];
  })),
}));
const report = {
  generated_at: new Date().toISOString(), protocol: {
    cases_per_mode: 390, main_modes: MAIN, labels: LABEL, common_three_judged: common.length,
    hallucination_definition: 'Judge is_grounded=false (grounding_score 1~3). 단일 케이스는 주장 수와 무관하게 1건.',
    empty_answers: 'Judge 판정된 빈 모델 answer도 정상 응답으로 포함. 검색 차단/실행 실패는 미판정이며 환각 없음으로 대체하지 않음.',
    type_counts: '실질적 환각 케이스 안의 유형별 distinct case 수. 한 케이스에 여러 유형이 있어 합산 불가. grounded=true의 경미한 claim은 제외.',
    causal_limit: 'v1 sub→v4 slot은 v3 백엔드 변경·재실행·입력 변화가 포함됨. v4 sub→slot도 보조 비교하고 순수 구조 효과라고 단정하지 않음.',
    annotation_status: '기존 Judge에 대한 수동 원인 검토·제어 후보. 재판정/서비스 적용/방지 효과 검증을 실행하지 않음.',
  },
  runs: Object.fromEntries(CONFIGS.map(([mode, root, runId, batches]) => [mode, { root, run_id: runId, batches }])),
  overall: Object.fromEntries(MAIN.map(mode => [mode, metric(mode, ids)])),
  common: { ids: common, metrics: Object.fromEntries(MAIN.map(mode => [mode, metric(mode, common)])) },
  transitions: { single_sub: transition('single', 'sub', common), sub_slot: transition('sub', 'slot', common), sub_slot_pairwise: transition('sub', 'slot'), v4sub_slot: transition('v4sub', 'slot') },
  by_type: byType, operational_axes: operational,
  actual_claim_areas: Object.fromEntries(Object.keys(AREA_NAMES).map(area => [area, { label: AREA_NAMES[area], denominator_scope: '72개 검토 대상 중 수동으로 주된 문제 영역을 붙인 케이스. 전체 API/매장 요청의 발생률이 아님.', ...Object.fromEntries(MAIN.map(mode => [mode, metric(mode, ids.filter(id => catalog.cases[id]?.area === area))])) }])),
  slot_diagnostics: {
    hallucination_cases: ids.filter(id => hall('slot', id)).length,
    hallucination_cases_with_valid_statuses: ids.filter(id => hall('slot', id) && raw('slot', id).trace?.answer_llm?.statuses_valid === true).length,
    hallucination_cases_with_slots: ids.filter(id => hall('slot', id) && raw('slot', id).trace?.answer_llm?.slots?.length > 0).length,
    retained_answer_slots_only: ids.filter(id => hall('slot', id)).every(id => {
      const llm = raw('slot', id).trace.answer_llm;
      return llm.answer === llm.slots.filter(s => s.status === 'ANSWER').map(s => s.answer).filter(Boolean).join('\n\n');
    }),
  },
  rules: catalog.rules, cases, source_files: sourceFiles,
  verification: { unique_cases_per_run: true, same_case_definitions: true, merged_judges_match_scores: true, judge_input_hashes_valid: true, all_hallucination_cases_annotated: true },
};
const cell = text => String(text ?? '—').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const pct = m => `${m.hallucinations}/${m.judged} (${m.rate == null ? '—' : m.rate.toFixed(2)}%)`;
const rel = file => path.relative(OUT, path.join(ROOT, file)).replace(/\\/g, '/');
const sourceLink = source => source ? `[${path.basename(source.file)}:${source.line}](${rel(source.file)})` : '미판정';
const caseLink = id => `[${id}](hallucination_cases.md#${id.toLowerCase()})`;
const caseLinks = list => list.map(caseLink).join(', ') || '없음';
const ruleLink = code => `[${code}](hallucination_progression.md#${code.toLowerCase()})`;
const quote = text => String(text).split(/\r?\n/).map(line => `> ${line}`).join('\n');
function table(headers, rows) {
  return ['| ' + headers.map(cell).join(' | ') + ' |', '| ' + headers.map(() => '---').join(' | ') + ' |', ...rows.map(row => '| ' + row.map(cell).join(' | ') + ' |')].join('\n');
}
const lines = ['# single → sub → slot 환각 변화와 제어 지점', '',
  '빈 answer를 포함한 기존 Judge 판정을 재집계했다. 환각 변화는 케이스 단위이며, 제어 후보는 모델이 실제로 받은 자료와 판정 사유를 읽고 붙였다. 백엔드·프롬프트·원본 Judge는 변경하지 않았다.', '',
  '## 1. 비교 범위와 분모', '',
  '- single·sub는 pipeline_test_v1 try1, slot은 pipeline_test_v4 try2 전체 390문항 실행이다.',
  `- 세 안 모두 Judge 판정이 있는 **동일 ${common.length}문항**을 증감·유형·항목 비교의 기본 분모로 쓴다. 전체 판정 분모도 함께 제시한다.`,
  '- 빈 answer는 제외하지 않는다. 빈 본문이어도 기대 ANSWER라면 정확도는 누락일 수 있지만, 환각과는 따로 판정한다.',
  '- 환각 = is_grounded=false(grounding 1~3). 유형별 건수는 해당 유형이 있는 케이스 수이며 서로 중복될 수 있다. 기존 summary의 모든 claim 유형 합계(grounded=true의 경미한 claim 포함)와는 집계 범위가 다르다.',
  '- v1은 pv1-try1 뒤 pv1-try1-store를 덮어 병합했다. 새 Judge 호출은 없었다. v4 sub를 보조 기준으로 제시해 버전 간 변경과 출력 구조 변경을 구분한다.', '',
  table(['지표', ...MAIN.map(m => LABEL[m])], [
    ['전체 Judge 환각', ...MAIN.map(m => pct(report.overall[m]))],
    ['동일 문항 Judge 환각', ...MAIN.map(m => pct(report.common.metrics[m]))],
    ['분모에 포함한 빈 모델 answer', ...MAIN.map(m => report.overall[m].empty_answers_included)],
  ]), '',
  '## 2. 무엇이 사라지고 새로 생겼나', '',
  ...[['single_sub', 'single → sub'], ['sub_slot', 'sub → slot']].flatMap(([key, title]) => {
    const t = report.transitions[key];
    return [`### ${title} — 동일 ${t.common_judged}문항`, '',
      `- 환각 판정이 사라진 케이스 **${t.removed.length}건**, 새로 생긴 케이스 **${t.added.length}건**, 양쪽 환각 유지 **${t.kept.length}건**.`,
      `- 사라진 ${t.removed.length}건 중 모델 본문이 비게 된 것은 ${t.removed_to_empty.length}건, 본문을 유지한 것은 ${t.removed_with_text.length}건이다. 빈 본문은 정상 보류로 포함한다. 사라진 뒤에도 오답/누락인 케이스는 ${t.removed_but_incorrect.length}건이므로 정답 개선과 동의어가 아니다.`,
      '', table(['환각 유형', '환각이 사라진 케이스 안의 해당 유형', '새 환각 케이스 안의 해당 유형'], Object.entries(CLAIM_NAMES).map(([type, label]) => [label, t.removed_types[type].length, t.added_types[type].length])), '',
      `- 사라짐: ${caseLinks(t.removed)}`, `- 새로 생김: ${caseLinks(t.added)}`, '',
    ];
  }),
  '- 핵심 변화: single→sub에서는 없는 사실 생성이 많이 줄었지만, 혼합 질문(MP)의 환각은 줄지 않았다. sub→slot에서는 혼합 질문의 미지원 답변 일부가 줄고, 단건 SB의 미확인 값을 부정/무료로 확정하는 문제가 늘었다.',
  '- 같은 케이스에서 환각이 계속되면서 유형만 달라질 수도 있다. 예: MP-023의 사용 후 환불 불가 주장은 FABRICATION/UNSUPPORTED_GENERALIZATION으로 달리 분류됐다. 유형 합계 변화만으로 특정 사실이 사라졌다고 해석하지 않는다.', '',
  '### 전체 분모의 slot 추가 2건', '',
  `- v1 sub에 Judge가 없고 slot에서 환각 판정된 케이스: ${caseLinks(report.transitions.sub_slot_pairwise.added_by_new_coverage)}. 이 둘은 기존 답변의 환각 악화와 구분한다. 동일 문항 31→34와 전체 31→36의 차이다.`, '',
  '## 3. 환각 종류별 현재 분포', '',
  table(['종류(서로 중복 가능)', ...MAIN.map(m => LABEL[m])], Object.entries(CLAIM_NAMES).map(([type, label]) => [label, ...MAIN.map(m => report.common.metrics[m].types[type].cases)])), '',
  '### 대표 변화와 확인할 필드', '',
  `- 줄어든 오적용: ${caseLink('MP-010')}에서 single·sub는 하루 임대료 2,200원을 분실 변상금으로 답했고 slot에서는 그 주장이 사라졌다. rental_fee와 loss_compensation을 다른 필드로 검사한다(HC02/HC03/HC05).`,
  `- 계속되는 단위 오적용: ${caseLink('IN-015')}는 세 안 모두 영화 혜택의 월 1회를 예매 가능 매수로 답했다. period=월·unit=회와 unit=장을 분리한다(HC03).`,
  `- slot에서 다시 생김: ${caseLink('SB-034')}는 유심 판매 여부가 없는데 single은 판매 불가, sub는 보류, slot은 다시 판매 불가로 답했다. 주제 FAQ의 존재와 sales_available 근거의 존재를 구분한다(HC01).`,
  `- slot에서 새로 생김: ${caseLinks(['SB-036', 'SB-037', 'SB-049'])}는 각각 개통비 없음·보너스 없음·다운로드 불가를 생성했다. 데이터 누락을 0/false로 변환하지 않는다(HC01).`,
  `- 매장: ${caseLinks(['ST-017', 'ST-021'])}는 parking/openingDays가 없는 결과에서 주차 가능·일요일 영업 없음/평일 영업시간을 만들었다. hours_text만 있으면 날짜별 영업표를 추측하지 않는다(HC06).`,
  `- 멀티턴과 slot 혼입: ${caseLink('MT-016')}은 재작성 때 임대폰이 일반 휴대폰으로 바뀌고, ABSTAIN 칸의 대상인 보험/분실 내용이 ANSWER 칸에 들어갔다. 이전 엔티티를 보존하고 ANSWER 칸도 허용 사실 단위로 검사한다(HC08/HC02/HC05).`, '',
  '## 4. 어느 항목에 집중되나', '',
  '아래는 동일 339문항의 고정된 데이터셋 유형이다. 괄호는 환각 건수/판정 건수와 비율이다.', '',
  table(['유형', ...MAIN.map(m => LABEL[m])], Object.entries(byType).map(([type, data]) => [`${type} · ${data.label}`, ...MAIN.map(m => pct(data.common[m]))])), '',
  '### 질문 형태와 실제 입력 경로', '',
  '축끼리 중복된다. 예를 들어 멀티턴이면서 다중 질문이고 사용자 정보가 포함될 수 있다. 다중 질문은 기대 하위 질문 수로 구분하며, 실제 분리 결과는 케이스 원장에서 따로 확인한다.', '',
  table(['축', ...MAIN.map(m => LABEL[m])], Object.values(operational).map(data => [data.label, ...MAIN.map(m => pct(data.common[m]))])), '',
  '- API/DB가 틀린 값을 반환했다는 뜻과, API에서 받은 정보에 LLM이 추측을 덧붙였다는 뜻은 다르다. 이 테스트에서 관찰한 도구 종류는 STORE_SEARCH이고, 사용자 정보는 입력 섹션으로 제공됐다. HTTP 실행 오류 자체는 환각 건수에 포함하지 않는다.',
  `- 사용자 필드·날짜 자체에 관한 환각은 ${caseLinks(union.filter(id => catalog.cases[id].area === 'USER_FACT'))}이다. single 4건→sub 0건→slot 0건. 사용자 정보가 포함된 다른 케이스의 환각은 대부분 FAQ 정책/속성 문제이며 API 오류로 분류하면 안 된다.`,
  `- 실제 매장 반환 필드가 부족한 주장은 ${caseLinks(['ST-017', 'ST-021'])}. 공항 유심 판매 여부(${caseLinks(['SB-034', 'MP-044', 'MP-058', 'MT-028'])})는 매장 관련 질문이지만 주된 근거 문제는 FAQ에 판매 여부가 없다는 것이다.`,
  '- 현재 develop의 청구·사용량 등 전체 도구 경로를 검증한 결과로 확장할 수 없다. 각 케이스의 실제 sections/tools 경로를 기준으로 읽는다.', '',
  '## 5. 동일 v4 백엔드에서의 sub → slot 보조 비교', '',
  (() => { const t = report.transitions.v4sub_slot; return `공통 ${t.common_judged}문항에서 환각 ${metric('v4sub', ids.filter(id => judge('v4sub', id) && judge('slot', id))).hallucinations}→${metric('slot', ids.filter(id => judge('v4sub', id) && judge('slot', id))).hallucinations}. 새 환각 ${t.added.length}건, 사라짐 ${t.removed.length}건. SB 1→7 악화는 이 비교에서도 나타난다.`; })(),
  'v1 sub→v4 slot에는 매장 실패 메시지·사용자 정보 고지 변경, 재작성·검색/이전 답변 변동도 포함된다. 보조 비교도 개별 run의 입력 변동이 있으므로 인과 효과를 확정하지 않는다.', '',
  '## 6. 케이스별 제어 규칙과 회귀 기준', '',
  '아래 규칙은 적용 후보다. case ID는 회귀 테스트 목록에 쓰고, 서비스 실행 시에는 자료 종류·질문한 필드·대상 ID·단위·조건으로 발동한다. 정적 라벨 건수는 방지 효과의 실측값이 아니다.', '',
  '우선순위: HC01 미확인 값 단정 차단 → HC02/HC03 대상·단위 고정 → HC05 ANSWER slot 내부 검증 → HC04 조건 보존. 매장(HC06)과 사용자 필드/날짜(HC07)는 어댑터에서 직접 제한하고, 멀티턴은 HC08을 검색 전에 적용한다.', '',
  `slot의 전체 환각 ${report.slot_diagnostics.hallucination_cases}건은 모두 status 배열이 유효하고 slot 원본이 있다. 실제 모델 본문이 ANSWER slot만 합친 결과와 일치하는지도 검증했다(${report.slot_diagnostics.retained_answer_slots_only ? '일치' : '추가 검토 필요'}). 따라서 스키마 검증이나 비ANSWER 칸 제거만으로 이 잔존 환각을 막을 수 없다.`, '',
  '실행 경로 제안: 요청 필드 추출 → 자료에서 typed fact(subject, predicate, value, unit, conditions, source_id, sub_question_id) 확보 → 미지원 필드는 UNKNOWN → 하위 질문별 허용 사실로 작성 → ANSWER 칸도 주장별 근거 검사 → 코드 고지 병합. 단순히 ABSTAIN 칸을 버리는 것만으로는 부족하다.', '',
  '회귀 검증은 환각 문장 차단과 정상 정보 유지 둘 다 확인한다. 예: 개통비 근거가 없을 때 0원을 막고, 같은 입력에 명시적 개통비 0원 근거를 추가한 대조 케이스에서는 0원을 허용한다. 주차 필드는 true/false/unknown을 각각 검증한다. 지원 정보가 전혀 없는 빈 answer는 정상으로 유지하고, 개인 포인트 잔액이 없어도 FAQ의 유효기간까지 함께 지우지 않는다. 이 대조 케이스는 후속 검증 제안이며 이번 실행 결과에 새 관측치로 섞지 않았다.', '',
  ...Object.entries(catalog.rules).flatMap(([code, rule]) => {
    const applicable = cases.filter(c => c.annotation.controls.includes(code));
    const counts = MAIN.map(mode => applicable.filter(c => c.variants[mode].relevant_controls.includes(code)).length);
    return [`<a id="${code.toLowerCase()}"></a>`, `### ${code} · ${rule.name}`, '',
      `- 위치: ${rule.stage}`, `- 발동 조건: ${rule.trigger}`, `- 검사: ${rule.check}`, `- 제어: ${rule.action}`, `- 구현 경계: ${rule.implementation}`,
      `- 실제 환각 케이스의 검토 대상(single/sub/slot): ${counts.join(' / ')}건. 규칙 간 중복 가능.`,
      `- 회귀 케이스: ${caseLinks(applicable.map(c => c.id))}`, '',
    ];
  }),
  '## 7. 판정 재교정·데이터 정합성 검토', '',
  ...cases.filter(c => c.annotation.review).map(c => `- ${caseLink(c.id)}: ${c.annotation.review}`), '',
  '이 표시는 기존 환각 수를 임의로 수정하지 않는다. 특히 MA-007·MT-003은 같은 위험 문장이 남아 있으므로 통계상 감소를 수정 성공으로 인정하기 전에 고정 기준으로 재검토해야 한다.', '',
  '## 8. 원장·재생성·검증', '',
  `- 환각을 한 번이라도 보인 **${union.length}개 케이스 전부**: [케이스 원장](hallucination_cases.md). 질문·기대 하위 질문·실제 본문·slot 원본·Judge 주장/사유·제어 후보·원본 위치를 포함한다.`,
  '- 기계 판독: [hallucination_progression.json](hallucination_progression.json). 유형별·경로별 전체 분모/공통 분모, 정확한 증감 ID와 원본 SHA-256을 포함한다.',
  `- 수동 제어 라벨: [hallucination_controls.json](${rel(CONFIG)})`,
  '- 재생성: `node scripts/docgen/pipeline_hallucination_progression.js`',
  '- 검증: 390개 고유 ID/안, 동일 질문·기대값, score와 최종 병합 Judge의 일치, 모든 Judge 입력 해시, 72개 제어 라벨의 누락/초과 없음 확인. 모델/API 호출 없음.', '',
];
const detail = ['# 환각 변화 케이스 원장 — single / sub / slot', '',
  '[요약·제어 규칙](hallucination_progression.md) · [기계 판독 JSON](hallucination_progression.json)', '',
  '환각을 한 번이라도 보인 72개 케이스. 미판정은 환각 없음과 구분한다. 각 제어는 제안이며 아직 서비스에 적용하지 않았다. status=ANSWER도 개별 문장에 근거가 없을 수 있다.', '',
  table(['케이스', '항목', 'single→sub→slot', '제어 후보', '검토'], cases.map(c => [`[${c.id}](#${c.id.toLowerCase()})`, TYPE_NAMES[c.type], c.pattern, c.annotation.controls.join(', '), c.annotation.review ? '재교정/정합성' : ''])), '',
];
for (const c of cases) {
  detail.push(`<a id="${c.id.toLowerCase()}"></a>`, `## ${c.id} · ${c.annotation.focus}`, '', quote(c.question), '',
    `- 분류: ${TYPE_NAMES[c.type]} · 주된 주장 영역: ${AREA_NAMES[c.annotation.area]}`, `- 변화: **${c.pattern}** · 공통 339문항 포함: ${c.common_three ? '예' : '아니오'}`,
    `- 제어 후보: ${c.annotation.controls.map(ruleLink).join(', ')}`, '- 실제 서비스 조건은 케이스 ID가 아닌 해당 필드·대상·근거 존재 여부로 판정한다.');
  if (c.previous_user_questions.length) detail.push(`- 이전 사용자 질문: ${c.previous_user_questions.join(' / ')}`);
  if (c.annotation.review) detail.push(`- 재검토: ${c.annotation.review}`);
  detail.push('', '**기대 하위 질문**', '');
  for (const s of c.expected.sub_questions) detail.push(`- #${s.index} ${s.user_text} → ${s.status}; gold FAQ ${s.gold_faq_ids.join(', ') || '없음'} (gold는 실제 제공 자료와 다를 수 있음)`);
  for (const [pair, flags] of Object.entries(c.input_drift)) detail.push(`- 입력 차이 ${pair}: ${Object.entries(flags).filter(([, flag]) => flag).map(([key]) => key).join(', ') || '기록한 입력 항목 차이 없음'}`);
  detail.push('');
  for (const mode of MAIN) {
    const v = c.variants[mode];
    detail.push(`### ${LABEL[mode]}`, '', `- 경로: ${v.path}; 최종 status: ${v.final_status ?? 'null'}; 하위 status: ${(v.sub_statuses || []).join(', ') || '없음'}; status 배열 검증: ${v.statuses_valid ?? '해당 없음'}`,
      `- 판정: ${v.is_grounded === null ? '미판정' : v.is_grounded ? '실질적 환각 없음' : '실질적 환각 있음'}; grounding=${v.grounding_score ?? '—'}; accuracy=${v.accuracy ?? '미판정'}`,
      `- 입력 섹션: ${v.context_titles.join(', ') || '없음'}; 매장 연동: ${v.store_context ? '있음' : '없음'}; 실제 FAQ ${v.prompt_faq_ids.join(', ') || '없음'}`,
      `- 원본: ${sourceLink(v.sources.raw)} · ${sourceLink(v.sources.score)} · ${sourceLink(v.sources.judgment)}`, '', '**실제 사용자 답변**', '', quote(v.user_answer ?? '(실행 실패/답변 없음)'), '', '**모델 본문**', '', quote(v.model_answer?.trim() ? v.model_answer : v.model_answer === null ? '(모델 답변 없음)' : '(빈 answer — 통계 분모에 포함)'), '');
    if (v.code_notice) detail.push('**코드 고정 안내**', '', quote(v.code_notice), '');
    if (v.hallucinated_claims.length) {
      detail.push('**Judge가 표시한 주장**', '');
      for (const claim of v.hallucinated_claims) detail.push(`- ${claim.type}: ${claim.claim}`, `  - 사유: ${claim.reason}`);
      if (v.relevant_controls.length) detail.push(`- 적용 후보: ${v.relevant_controls.map(ruleLink).join(', ')}`);
      detail.push('');
    }
    if (v.sub_results) for (const sub of v.sub_results) detail.push(`- 하위 #${sub.index}: ${sub.outcome} — ${sub.note}`);
    if (v.reasoning) detail.push(`- Judge 요약: ${v.reasoning}`);
    detail.push('', '<details>', '<summary>실제 분리 질문·FAQ 입력·이전 답변·slot 원본</summary>', '');
    for (const [i, sub] of v.prompt_sub_questions.entries()) detail.push(`- 실제 하위 #${i + 1}: ${sub.user_text ?? '(원문 조각 없음)'}; FAQ ${(sub.faq_ids || []).join(', ') || '없음'}`);
    for (const [i, query] of v.search_queries.entries()) detail.push(`- 검색 #${i + 1}: ${query}`);
    for (const t of v.previous_answers) detail.push(`- 이전 사용자: ${t.question}`, quote(t.answer ?? `(실패 ${t.error_code})`));
    for (const [i, slot] of (v.slots || []).entries()) detail.push(`- slot #${i + 1}: ${slot.status}; ${slot.status === 'ANSWER' ? '최종 본문에 남음' : '최종 본문에서 제거'}`, quote(slot.answer ?? ''));
    if (v.prompt_faq_ids.length) detail.push('', '**실제로 입력된 FAQ 원문**', '');
    for (const id of v.prompt_faq_ids) {
      const faq = faqs.get(String(id));
      detail.push(`- FAQ ${id}: ${faq?.question ?? '(스냅숏 없음)'}`, quote(faq?.answer ?? ''));
    }
    detail.push('', '</details>', '');
  }
}
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'hallucination_progression.json'), JSON.stringify(report, null, 2) + '\n');
fs.writeFileSync(path.join(OUT, 'hallucination_progression.md'), lines.join('\n'));
fs.writeFileSync(path.join(OUT, 'hallucination_cases.md'), detail.join('\n'));
console.log(JSON.stringify({ output: path.relative(ROOT, OUT), overall: Object.fromEntries(MAIN.map(m => [m, pct(report.overall[m])])), common: Object.fromEntries(MAIN.map(m => [m, pct(report.common.metrics[m])])), cases: cases.length, verification: report.verification }, null, 2));
