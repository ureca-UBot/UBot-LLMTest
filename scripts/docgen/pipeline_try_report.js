'use strict';
// pipeline_test 회차 공통 정리 자료 생성기. 저장된 결과·채점·Judge만 읽는다(모델·API 호출 없음).
//
//   출력: <out>/summary/report_data.json  — 안별 전체 수치, 짝 비교(McNemar), 오답 원인 분류, 환각 종류, 고지
//         <out>/review/hallucination_cases.md — 안별 실질적 환각 케이스(질문·실제 답변·Judge 주장·사유)
//         <out>/review/failure_cases.md       — 안별 Judge 오답 케이스(원인 분류·하위 판정 사유)
//         stdout                               — all_summary에 옮길 표(markdown)
//
// Usage: node scripts/docgen/pipeline_try_report.js --out pipeline_test_v6/try1/results \
//          --runs "v5=pipeline_test_v5/try1/<run_id>@pv5-feat277-try1,v6=pipeline_test_v6/try1/<run_id>@pv6-lines-try1" \
//          [--ids-from v6]   # 짝 비교·표의 대상 케이스를 이 안의 케이스로 한정(다른 안이 더 넓을 때)
//   --runs의 각 항목: <라벨>=<test>/<try>/<run_id>@<batch>[+<batch>…] (뒤 배치가 같은 케이스를 덮음 — score_pipeline과 같음)
//   첫 안이 기준선이다. 짝 비교는 기준선 대 나머지 각 안, 그리고 마지막 두 안끼리.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const TYPE_ORDER = ['SA', 'SB', 'UD', 'MA', 'MP', 'MN', 'OS', 'IN', 'CQ', 'MT', 'ST'];
const TYPE_NAMES = {
  SA: '단일·답할 수 있음', SB: '단일·묻는 값 없음', UD: '사용자 정보', MA: '복합·모두 답할 수 있음', MP: '복합·답할 수 있음+없음',
  MN: '복합·모두 답할 수 없음', OS: '범위 밖 포함', IN: '질문 내부 일부 미확인', CQ: '모호한 질문', MT: '멀티턴', ST: '매장',
};
const CLAIM_NAMES = {
  FABRICATION: '없는 사실·값 생성', MISATTRIBUTION: '대상·속성·근거 오적용', UNSUPPORTED_GENERALIZATION: '조건 누락·범위 확대',
  SILENT_CONFLICT_PICK: '상충 자료의 임의 선택', FALSE_COMPLETION: '미실행 작업 완료 주장',
};
const OUTCOME_NAMES = {
  CORRECT_ANSWER: '정답', CORRECT_DECLINE: '올바른 보류', WRONG_ANSWER: '오답', MISSING_ANSWER: '누락', UNSUPPORTED_ANSWER: '근거 없는 답',
};
const CAUSES = [
  ['EXPECTED_ANSWER_DECLINED_EMPTY', '답할 수 있는 하위 질문을 보류 + 본문 빔'],
  ['EXPECTED_ANSWER_DECLINED_WROTE', '답할 수 있는 하위 질문을 보류, 본문은 씀'],
  ['EXPECTED_DECLINE_ANSWERED', '답할 수 없는 하위 질문을 ANSWER로 두고 답함'],
  ['SUB_COUNT_MISMATCH', '하위 질문 수 불일치(질문 분리)'],
  ['STATUSES_INVALID', 'statuses 배열 잘못(칸 수·값)'],
  ['STATUS_OK_CONTENT_WRONG', 'status는 맞음, 본문 오류·누락'],
  ['OTHER', '그 밖'],
];
const CAUSE_NAMES = Object.fromEntries(CAUSES);

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}
function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
}
function mcnemar(b, c) {
  const n = b + c;
  if (!n) return 1;
  const k = Math.min(b, c);
  let p = 0;
  let comb = 1;
  for (let i = 0; i <= k; i += 1) {
    if (i > 0) comb = (comb * (n - i + 1)) / i;
    p += comb;
  }
  return Math.min(1, (2 * p) / 2 ** n);
}
const fmtP = (p) => (p < 0.001 ? 'p<0.001' : `p=${p.toFixed(3)}`);
const pct = (a, b) => (b ? `${((100 * a) / b).toFixed(1)}%` : '—');
const count = (arr, fn) => arr.filter(fn).length;
const tally = (arr) => arr.reduce((m, k) => ((m[k] = (m[k] || 0) + 1), m), {});
const sortIds = (ids) => [...ids].sort((a, b) => a.localeCompare(b));

function loadRun(label, spec) {
  const [loc, batchSpec] = spec.split('@');
  const parts = loc.split('/');
  const runId = parts.pop();
  const resultsDir = path.join(ROOT, ...parts, 'results');
  const results = new Map(readJsonl(path.join(resultsDir, 'raw', runId, 'results.jsonl')).map((r) => [r.id, r]));
  const scores = new Map(readJsonl(path.join(resultsDir, 'raw', 'scored', runId, 'case_scores.jsonl')).map((r) => [r.id, r]));
  const judgments = new Map();
  for (const batch of (batchSpec || '').split('+').filter(Boolean)) {
    for (const j of readJsonl(path.join(resultsDir, 'llm_judge', batch, `${runId}.judgments.jsonl`))) {
      if (j.error == null) judgments.set(j.id, j);
    }
  }
  if (!results.size || !scores.size) throw new Error(`${label}: 결과 또는 채점 없음 (${loc})`);
  return { label, runId, loc, batches: batchSpec, results, scores, judgments };
}

function finalAnswer(result) {
  const final = result.response && result.response.final;
  return (final && final.answer) || '';
}
function lastQuestion(result) {
  return result.question || (result.response && result.response.final && result.response.final.question) || '';
}

function failureCause(score, result) {
  if (score.planner && score.planner.expected_sub_question_count != null
    && score.planner.sub_question_count !== score.planner.expected_sub_question_count) return 'SUB_COUNT_MISMATCH';
  const expectedSubs = (result.expected && result.expected.sub_questions || []).map((s) => s.status);
  const sub = score.sub_status;
  if (sub && sub.statuses && sub.statuses.length) {
    if (sub.valid === false || sub.aligned === false) return 'STATUSES_INVALID';
    let declined = false;
    let answered = false;
    sub.statuses.forEach((actual, i) => {
      const exp = expectedSubs[i];
      if (['ANSWER', 'PARTIAL'].includes(exp) && ['ABSTAIN', 'OUT_OF_SCOPE'].includes(actual)) declined = true;
      if (['ABSTAIN', 'OUT_OF_SCOPE'].includes(exp) && ['ANSWER', 'PARTIAL'].includes(actual)) answered = true;
    });
    if (declined) return score.model_answer_empty ? 'EXPECTED_ANSWER_DECLINED_EMPTY' : 'EXPECTED_ANSWER_DECLINED_WROTE';
    if (answered) return 'EXPECTED_DECLINE_ANSWERED';
    return 'STATUS_OK_CONTENT_WRONG';
  }
  const exp = score.expected_final;
  const act = score.final_actual;
  if (['ANSWER', 'PARTIAL'].includes(exp) && ['ABSTAIN', 'OUT_OF_SCOPE'].includes(act)) {
    return score.model_answer_empty ? 'EXPECTED_ANSWER_DECLINED_EMPTY' : 'EXPECTED_ANSWER_DECLINED_WROTE';
  }
  if (['ABSTAIN', 'OUT_OF_SCOPE'].includes(exp) && act === 'ANSWER') return 'EXPECTED_DECLINE_ANSWERED';
  if (act && (exp === act || (exp === 'ANSWER' && act === 'PARTIAL') || (exp === 'PARTIAL' && act === 'ANSWER'))) return 'STATUS_OK_CONTENT_WRONG';
  return 'OTHER';
}

function summarize(run, ids) {
  const s = ids.map((id) => run.scores.get(id)).filter(Boolean);
  const judged = s.filter((x) => run.judgments.has(x.id));
  const j = (x) => run.judgments.get(x.id);
  const correct = count(judged, (x) => j(x).accuracy === 'CORRECT');
  const halluc = judged.filter((x) => j(x).is_grounded === false);
  const claimCases = {};
  for (const x of halluc) {
    for (const t of new Set((j(x).hallucinated_claims || []).map((c) => c.type))) claimCases[t] = (claimCases[t] || 0) + 1;
  }
  const subOutcomes = tally(judged.flatMap((x) => (j(x).sub_results || []).map((r) => r.outcome)));
  const wrong = judged.filter((x) => j(x).accuracy !== 'CORRECT');
  const causes = tally(wrong.map((x) => failureCause(x, run.results.get(x.id))));
  const llm = s.filter((x) => x.path === 'LLM');
  return {
    cases: s.length,
    paths: tally(s.map((x) => x.path)),
    exec_error: count(s, (x) => x.exec_error),
    judged: judged.length,
    correct,
    correct_and_grounded: count(judged, (x) => j(x).accuracy === 'CORRECT' && j(x).is_grounded !== false),
    hallucinated: halluc.length,
    hallucination_claim_cases: claimCases,
    sub_outcomes: subOutcomes,
    notice_pattern: count(llm, (x) => x.leak && x.leak.notice),
    ask_back_pattern: count(llm, (x) => x.leak && x.leak.ask_back),
    notice_judge: count(judged, (x) => j(x).decline_notice),
    asks_user_judge: count(judged, (x) => j(x).asks_user),
    code_notice: count(llm, (x) => x.code_notice),
    double_notice: count(llm, (x) => x.code_notice && x.leak && x.leak.notice),
    empty_answer: count(llm, (x) => x.model_answer_empty),
    status_match: count(s, (x) => x.status_match),
    status_match_strict: count(s, (x) => x.status_match_strict),
    passed: count(s, (x) => x.passed),
    failure_causes_scored: tally(s.filter((x) => x.failure_cause).map((x) => x.failure_cause)),
    judge_wrong_causes: causes,
    latency_avg_ms: Math.round(s.reduce((a, x) => a + (x.latency_ms || 0), 0) / (s.length || 1)),
  };
}

function paired(a, b, ids, predicate, needsJudge) {
  const common = ids.filter((id) => a.scores.has(id) && b.scores.has(id)
    && (!needsJudge || (a.judgments.has(id) && b.judgments.has(id))));
  const gained = [];
  const lost = [];
  let aSat = 0;
  let bSat = 0;
  for (const id of common) {
    const pa = predicate(a, id);
    const pb = predicate(b, id);
    if (pa) aSat += 1;
    if (pb) bSat += 1;
    if (pb && !pa) gained.push(id);
    if (pa && !pb) lost.push(id);
  }
  return { n: common.length, a: aSat, b: bSat, gained: sortIds(gained), lost: sortIds(lost), p: mcnemar(gained.length, lost.length) };
}
const PAIR_METRICS = [
  ['correct', 'Judge 정답', true, (r, id) => r.judgments.get(id).accuracy === 'CORRECT'],
  ['grounded', '환각 없음', true, (r, id) => r.judgments.get(id).is_grounded !== false],
  ['correct_and_grounded', '정답 + 환각 없음', true, (r, id) => r.judgments.get(id).accuracy === 'CORRECT' && r.judgments.get(id).is_grounded !== false],
  ['notice_free_judge', '모델 고지 없음(Judge)', true, (r, id) => !r.judgments.get(id).decline_notice],
  ['status_match', '최종 status 일치', false, (r, id) => r.scores.get(id).status_match],
  ['passed', '통과', false, (r, id) => r.scores.get(id).passed],
];

function quote(text) {
  const t = (text || '').trim();
  if (!t) return '> (빈 본문)';
  return t.split(/\r?\n/).map((l) => `> ${l}`).join('\n');
}

function caseHeader(run, id) {
  const r = run.results.get(id);
  const s = run.scores.get(id);
  const j = run.judgments.get(id);
  const lines = [`#### ${id} · ${TYPE_NAMES[id.slice(0, 2)] || id.slice(0, 2)}`, ''];
  if (r.turns && r.turns.length) {
    lines.push(`이전 턴: ${r.turns.map((t) => `"${(t.question || t.user || t).toString().slice(0, 60)}"`).join(' → ')}`, '');
  }
  lines.push(`> **질문:** ${lastQuestion(r)}`, '');
  const statuses = s.sub_status && s.sub_status.statuses ? ` · 하위 ${JSON.stringify(s.sub_status.statuses)}` : '';
  const expSubs = (r.expected.sub_questions || []).map((q) => q.status);
  lines.push(`- 기대 ${s.expected_final}${expSubs.length > 1 ? ` (${expSubs.join(' · ')})` : ''} → 실제 ${s.final_actual}${statuses} · grounding ${j.grounding_score} · 정확도 ${j.accuracy}`);
  if (r.note) lines.push(`- 케이스 메모: ${r.note}`);
  lines.push('', '실제 답변(사용자에게 나간 본문):', '', quote(finalAnswer(r)), '');
  return lines;
}

function hallucinationDoc(runs, ids, pairs) {
  const out = ['# 실질적 환각 케이스와 Judge 사유', '',
    '`scripts/docgen/pipeline_try_report.js`가 저장된 결과·Judge만 읽어 만든 문서다. 실질적 환각 = grounding 1~3(`is_grounded=false`). 빈 모델 본문도 Judge 분모에 들어간다.', ''];
  out.push('| 안 | run | Judge 배치 | 판정 | 실질적 환각 |', '|---|---|---|---|---|');
  for (const run of runs) {
    const sm = summarize(run, ids);
    out.push(`| ${run.label} | \`${run.runId}\` | ${run.batches} | ${sm.judged} | ${sm.hallucinated} (${pct(sm.hallucinated, sm.judged)}) |`);
  }
  out.push('');
  if (pairs.length) {
    out.push('## 같은 문항에서 사라진 환각 · 새로 생긴 환각', '');
    for (const { a, b, g } of pairs) {
      out.push(`- **${a.label} → ${b.label}** (둘 다 판정 ${g.n}건): 사라짐 ${g.gained.length} · 새로 생김 ${g.lost.length} (${fmtP(g.p)})`);
      if (g.gained.length) out.push(`  - 사라짐: ${g.gained.join(', ')}`);
      if (g.lost.length) out.push(`  - 새로 생김: ${g.lost.join(', ')}`);
    }
    out.push('');
  }
  for (const run of runs) {
    const hs = sortIds(ids.filter((id) => run.judgments.has(id) && run.judgments.get(id).is_grounded === false));
    out.push(`## ${run.label} — ${hs.length}건`, '');
    const byClaim = {};
    for (const id of hs) for (const c of run.judgments.get(id).hallucinated_claims || []) byClaim[c.type] = (byClaim[c.type] || 0) + 1;
    out.push(`주장 수: ${Object.entries(byClaim).map(([k, v]) => `${CLAIM_NAMES[k] || k} ${v}`).join(' · ') || '없음'}`, '');
    for (const id of hs) {
      const j = run.judgments.get(id);
      out.push(...caseHeader(run, id));
      for (const c of j.hallucinated_claims || []) {
        out.push(`- **${CLAIM_NAMES[c.type] || c.type}**: ${c.claim}`, `  - 사유: ${c.reason}`);
      }
      if (j.reasoning) out.push(`- Judge 종합: ${j.reasoning}`);
      out.push('');
    }
  }
  return out.join('\n');
}

function failureDoc(runs, ids) {
  const out = ['# Judge 오답 케이스와 원인 분류', '',
    '`scripts/docgen/pipeline_try_report.js`가 만든 문서다. 원인 분류는 기대 하위 status와 모델 하위 status·빈 본문으로 기계적으로 나눈 것이고, 하위 판정 사유는 Judge가 쓴 것이다.', '',
    '| 원인 분류 | 정의 |', '|---|---|',
    '| 답할 수 있는 하위 질문을 보류 + 본문 빔 | 기대 ANSWER·PARTIAL 칸을 ABSTAIN·OUT_OF_SCOPE로 두고 모델 본문이 비었다(과잉 보류) |',
    '| 답할 수 있는 하위 질문을 보류, 본문은 씀 | 위와 같지만 본문이 있다(본문 일부만 답하거나 보류 문장) |',
    '| 답할 수 없는 하위 질문을 ANSWER로 두고 답함 | 기대 ABSTAIN·OUT_OF_SCOPE 칸을 ANSWER·PARTIAL로 두었다(지어냄·단정) |',
    '| 하위 질문 수 불일치 | 질문 분리(판정 LLM) 결과 하위 질문 수가 기대와 다르다 |',
    '| statuses 배열 잘못 | 칸 수·값이 맞지 않는다(주로 도구 경로) |',
    '| status는 맞음, 본문 오류·누락 | 라벨은 맞는데 본문 사실이 틀리거나 필요한 내용이 빠졌다 |', ''];
  for (const run of runs) {
    const wrong = sortIds(ids.filter((id) => run.judgments.has(id) && run.judgments.get(id).accuracy !== 'CORRECT'));
    const groups = {};
    for (const id of wrong) (groups[failureCause(run.scores.get(id), run.results.get(id))] ||= []).push(id);
    out.push(`## ${run.label} — 오답 ${wrong.length}건`, '');
    out.push('| 원인 | 건수 | 케이스 |', '|---|---|---|');
    for (const [key, name] of CAUSES) if (groups[key]) out.push(`| ${name} | ${groups[key].length} | ${groups[key].join(', ')} |`);
    out.push('');
    for (const [key, name] of CAUSES) {
      if (!groups[key]) continue;
      out.push(`### ${name} (${groups[key].length})`, '');
      for (const id of groups[key]) {
        const j = run.judgments.get(id);
        out.push(...caseHeader(run, id));
        for (const r of j.sub_results || []) {
          if (r.outcome === 'CORRECT_ANSWER' || r.outcome === 'CORRECT_DECLINE') continue;
          out.push(`- 하위 ${r.index} **${OUTCOME_NAMES[r.outcome] || r.outcome}**: ${r.note}`);
        }
        if (j.reasoning) out.push(`- Judge 종합: ${j.reasoning}`);
        out.push('');
      }
    }
  }
  return out.join('\n');
}

function main() {
  const outDir = path.join(ROOT, arg('out'));
  const runs = arg('runs').split(',').map((spec) => {
    const i = spec.indexOf('=');
    return loadRun(spec.slice(0, i), spec.slice(i + 1));
  });
  const idsFrom = arg('ids-from');
  const base = idsFrom ? runs.find((r) => r.label === idsFrom) : runs[0];
  const ids = sortIds([...base.scores.keys()]);

  const summaries = Object.fromEntries(runs.map((r) => [r.label, summarize(r, ids)]));
  const byType = Object.fromEntries(runs.map((r) => [r.label, Object.fromEntries(TYPE_ORDER
    .map((t) => [t, summarize(r, ids.filter((id) => id.startsWith(`${t}-`)))]).filter(([, v]) => v.cases))]));
  const comparisons = [];
  const pairList = [];
  for (let i = 1; i < runs.length; i += 1) pairList.push([runs[0], runs[i]]);
  if (runs.length > 2) pairList.push([runs[runs.length - 2], runs[runs.length - 1]]);
  for (const [a, b] of pairList) {
    const metrics = Object.fromEntries(PAIR_METRICS.map(([key, , needsJudge, fn]) => [key, paired(a, b, ids, fn, needsJudge)]));
    comparisons.push({ a: a.label, b: b.label, metrics });
  }
  const hallPairs = pairList.map(([a, b]) => ({ a, b, g: paired(a, b, ids, PAIR_METRICS[1][3], true) }));
  const notices = Object.fromEntries(runs.map((r) => [r.label, sortIds(ids.filter((id) => {
    const s = r.scores.get(id);
    return s && s.leak && s.leak.notice;
  })).map((id) => ({ id, code_notice: Boolean(r.scores.get(id).code_notice), sentences: r.scores.get(id).leak.notice_sentences }))]));

  fs.mkdirSync(path.join(outDir, 'summary'), { recursive: true });
  fs.mkdirSync(path.join(outDir, 'review'), { recursive: true });
  const data = {
    generated_by: 'scripts/docgen/pipeline_try_report.js',
    cases: ids.length,
    runs: runs.map((r) => ({ label: r.label, run_id: r.runId, location: r.loc, judge_batches: r.batches })),
    overall: summaries, by_type: byType, comparisons, notices,
  };
  fs.writeFileSync(path.join(outDir, 'summary', 'report_data.json'), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  // 다른 생성기(pipeline_hallucination_progression.js 등)가 만든 같은 이름의 문서는 덮어쓰지 않는다.
  const writeOwned = (name, text) => {
    const file = path.join(outDir, 'review', name);
    if (fs.existsSync(file) && !fs.readFileSync(file, 'utf8').includes('pipeline_try_report.js')) {
      console.error(`건너뜀: ${path.relative(ROOT, file)}는 다른 생성기의 문서다`);
      return;
    }
    fs.writeFileSync(file, `${text}\n`, 'utf8');
  };
  writeOwned('hallucination_cases.md', hallucinationDoc(runs, ids, hallPairs));
  writeOwned('failure_cases.md', failureDoc(runs, ids));

  // stdout: all_summary용 표
  const L = runs.map((r) => r.label);
  const row = (name, fn) => `| ${name} | ${L.map((l) => fn(summaries[l])).join(' | ')} |`;
  const kv = (o, names) => Object.entries(o).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${(names && names[k]) || k} ${v}`).join(' · ') || '—';
  const lines = [`케이스 ${ids.length}건`, '', `| 지표 | ${L.join(' | ')} |`, `|---|${L.map(() => '---').join('|')}|`,
    row('실행 경로', (x) => kv(x.paths)),
    row('**Judge 정답**', (x) => `**${x.correct} / ${x.judged} (${pct(x.correct, x.judged)})**`),
    row('정답 + 환각 없음', (x) => `${x.correct_and_grounded}`),
    row('실질적 환각', (x) => `${x.hallucinated} (${pct(x.hallucinated, x.judged)})`),
    row('하위 판정', (x) => kv(x.sub_outcomes, OUTCOME_NAMES)),
    row('모델 고지 (패턴 · Judge)', (x) => `${x.notice_pattern} · ${x.notice_judge}`),
    row('되묻기 (패턴 · Judge)', (x) => `${x.ask_back_pattern} · ${x.asks_user_judge}`),
    row('코드 안내 · 이중 고지', (x) => `${x.code_notice} · ${x.double_notice}`),
    row('빈 모델 본문', (x) => `${x.empty_answer}`),
    row('최종 status 일치 (느슨 · 엄격)', (x) => `${x.status_match} · ${x.status_match_strict} / ${x.cases}`),
    row('통과', (x) => `${x.passed} / ${x.cases}`),
    row('채점 실패 원인', (x) => kv(x.failure_causes_scored)),
    row('평균 지연', (x) => `${(x.latency_avg_ms / 1000).toFixed(1)}초`),
    '', '오답 원인 분류', '', `| 원인 | ${L.join(' | ')} |`, `|---|${L.map(() => '---').join('|')}|`];
  for (const [key, name] of CAUSES) {
    if (L.some((l) => summaries[l].judge_wrong_causes[key])) lines.push(`| ${name} | ${L.map((l) => summaries[l].judge_wrong_causes[key] || 0).join(' | ')} |`);
  }
  lines.push('', '환각 종류(해당 종류가 나온 케이스 수, 중복)', '', `| 종류 | ${L.join(' | ')} |`, `|---|${L.map(() => '---').join('|')}|`);
  for (const [key, name] of Object.entries(CLAIM_NAMES)) lines.push(`| ${name} | ${L.map((l) => summaries[l].hallucination_claim_cases[key] || 0).join(' | ')} |`);
  for (const c of comparisons) {
    lines.push('', `짝 비교 ${c.a} → ${c.b}`, '', `| 지표 | 공통 | ${c.a} | ${c.b} | ${c.b}만 / ${c.a}만 | p |`, '|---|---|---|---|---|---|');
    for (const [key, name] of PAIR_METRICS) {
      const m = c.metrics[key];
      lines.push(`| ${name} | ${m.n} | ${m.a} | ${m.b} | ${m.gained.length} / ${m.lost.length} | ${fmtP(m.p)} |`);
    }
    const m = c.metrics.correct;
    lines.push('', `- 정답 개선(${c.b}만): ${m.gained.join(', ') || '없음'}`, `- 정답 악화(${c.a}만): ${m.lost.join(', ') || '없음'}`);
  }
  lines.push('', '유형별', '', `| 유형 | n | 정답 ${L.join(' → ')} | 환각 | 모델 고지(패턴) | 빈 본문 | status 일치 | 통과 |`, '|---|---|---|---|---|---|---|---|');
  for (const t of TYPE_ORDER) {
    const v = L.map((l) => byType[l][t]).filter(Boolean);
    if (!v.length) continue;
    lines.push(`| ${t} ${TYPE_NAMES[t]} | ${v[0].cases} | ${v.map((x) => `${x.correct}/${x.judged}`).join(' → ')} | ${v.map((x) => x.hallucinated).join(' → ')} | ${v.map((x) => x.notice_pattern).join(' → ')} | ${v.map((x) => x.empty_answer).join(' → ')} | ${v.map((x) => x.status_match).join(' → ')} | ${v.map((x) => x.passed).join(' → ')} |`);
  }
  console.log(lines.join('\n'));
}

if (require.main === module) main();
module.exports = { failureCause, mcnemar };
