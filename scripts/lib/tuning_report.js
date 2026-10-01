'use strict';
// 문서용 진단: 판단 방향 × 근거 상태로 기본 코드를 정하고 동반 문제를 보존한다.
const { PATH_NAMES } = require('./response_paths');
const { CODES, GROUP_NAMES, classifyTuning, tuningRule } = require('./tuning_codes');

const METHODS = {
  OUTPUT_STRUCTURE: '출력 구조·라벨 검증', PROMPT: '프롬프트·예시 보강',
  CODE: '입출력 코드·템플릿', MODEL: '문서 식별·추론 보강 실험', REVIEW: '문항·판정 검토',
};
function summarize(rows, methods = []) {
  const items = {};
  for (const row of rows) items[row.item] = (items[row.item] || 0) + 1;
  return {
    count: rows.length, incorrect: rows.filter((r) => r.verdict === 'INCORRECT').length,
    correct: rows.filter((r) => r.verdict === 'CORRECT').length,
    undetermined: rows.filter((r) => r.verdict === 'INSUFFICIENT_EVIDENCE').length,
    accuracy_unscored: rows.filter((r) => !r.verdict).length,
    hallucinated: rows.filter((r) => r.flags.hallucinated).length,
    items: Object.fromEntries(Object.entries(items).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
    paths: [...new Set(rows.map((r) => r.path).filter(Boolean))].map((p) => `${PATH_NAMES[p]} (${p})`),
    methods: [...new Set(methods)],
    // 위험 사례를 먼저 보여준다. 전체 ID는 JSON에 보존한다.
    case_ids: [...rows].sort((a, b) => Number(!!b.safety_unsafe) - Number(!!a.safety_unsafe)
      || Number(b.flags.hallucinated || b.flags.misapplied) - Number(a.flags.hallucinated || a.flags.misapplied)
      || Number(b.verdict !== 'CORRECT') - Number(a.verdict !== 'CORRECT') || a.id.localeCompare(b.id)).map((r) => r.id),
  };
}

// 사용자용 코드 집계: 판단 방향과 근거 정오를 교차한 A1~C4 등이 기본 단위다.
function tuningCodeOverview(rows, tuning, safetyRows = []) {
  const byId = new Map(rows.map((r) => [r.id, { ...r }]));
  for (const r of safetyRows.filter((r) => r.verdict === 'UNSAFE')) {
    if (!byId.has(r.id)) byId.set(r.id, { id: r.id, item: r.item, verdict: null,
      flags: { direction: 'MATCH', source_ok: null, missing: false, misapplied: false, hallucinated: false } });
    byId.get(r.id).safety_unsafe = true;
  }
  const entries = [...byId.values()].map((row) => ({ row,
    codes: [classifyTuning(row), row.safety_unsafe ? 'S1' : null].filter((c) => c && c !== 'OK') }));
  const stats = (rs) => ({ ...summarize(rs),
    missing: rs.filter((r) => r.flags.missing).length,
    misapplied: rs.filter((r) => r.flags.misapplied).length,
    source_wrong: rs.filter((r) => r.flags.source_ok === false).length });
  const codes = Object.values(CODES).map((def) => {
    const hits = entries.filter((e) => e.codes.includes(def.code));
    const plans = new Map();
    for (const { row } of hits) {
      const rule = tuningRule(def.code, row.item, tuning);
      const key = JSON.stringify([rule.methods, rule.difficulty, rule.action]);
      if (!plans.has(key)) plans.set(key, { rule, rows: [] });
      plans.get(key).rows.push(row);
    }
    // 같은 판단 코드라도 환각·오적용이 동반되면 영향이 더 크다. 자료 판정 불가는 제외한다.
    const severity = hits.some(({ row }) => row.verdict !== 'INSUFFICIENT_EVIDENCE'
      && (row.flags.hallucinated || row.flags.misapplied)) ? Math.max(def.severity, 3) : def.severity;
    return { ...def, severity, ...stats(hits.map((e) => e.row)),
      plans: [...plans.values()].map(({ rule, rows: rs }) => ({ ...rule, ...stats(rs) })) };
  }).filter((c) => c.count);
  const groups = Object.entries(GROUP_NAMES).map(([key, title]) => {
    const members = codes.filter((c) => c.group === key);
    return { key, title, codes: members,
      ...stats(entries.filter((e) => e.codes.some((c) => c[0] === key)).map((e) => e.row)) };
  }).filter((g) => g.count).sort((a, b) => 'SABCDEF'.indexOf(a.key) - 'SABCDEF'.indexOf(b.key));
  const methods = Object.entries(METHODS).map(([key, name]) => {
    const hits = entries.filter((e) => e.codes.some((code) => tuningRule(code, e.row.item, tuning).methods.includes(key)));
    return { key, name, ...stats(hits.map((e) => e.row)),
      codes: codes.filter((c) => c.plans.some((p) => p.methods.includes(key))).map((c) => c.code) };
  }).filter((m) => m.count);
  return { n_rows: rows.length, n_with_issue: entries.filter((e) => e.codes.length).length, groups, codes, methods };
}

function renderTuningCodes(overview, model, runId) {
  const lines = [`### ${model} — ${runId}`, ''];
  if (!overview.groups.length) return [...lines, '기록된 판정에서 문제 표시가 없습니다. 채점 완료율도 함께 확인하세요.'];
  const severity = { 4: '최우선 · 안전성 확인', 3: '심각', 2: '중요', 1: '정합 개선' };
  const difficulty = { LOW: '낮음', MEDIUM: '중간', HIGH: '높음', UNKNOWN: '미정' };
  lines.push(`문제 표시가 있는 문항 **${overview.n_with_issue}건**. 기본 튜닝 코드는 문항마다 하나이며 S1 안전성은 별도로 동반할 수 있다.`, '');
  const severe = overview.codes.filter((c) => c.severity >= 3).sort((a, b) => b.severity - a.severity || b.incorrect - a.incorrect || b.count - a.count);
  if (severe.length) lines.push(`**우선 확인:** ${severe.map((c) => `${c.code} ${c.title} ${c.count}건`).join(' / ')}`, '');
  for (const g of overview.groups) {
    lines.push(`#### ${g.key}. ${g.title}`, '');
    for (const c of g.codes) {
      lines.push(`**${c.code} — ${c.title}**`, '',
        `- 심각도: ${severity[c.severity]}. ${c.count}건 — 본문 오답 ${c.incorrect} / 정답 ${c.correct} / 자료 판정 불가 ${c.undetermined} / 정확도 미채점 ${c.accuracy_unscored}.`,
        `- 동반 문제: 환각 ${c.hallucinated} · 잘못된 근거 ${c.source_wrong} · 오적용 ${c.misapplied} · 누락 ${c.missing}. 겹침 가능.`,
        `- 항목 코드: ${Object.entries(c.items).map(([code, n]) => `**${code}** ${n}건`).join(' · ')}`);
      for (const p of c.plans) lines.push(`- 튜닝 가설(${Object.keys(p.items).join('·')}): ${p.methods.map((m) => METHODS[m]).join(' + ')} / 난이도 ${difficulty[p.difficulty]}. ${p.action}`);
      lines.push(`- 대표 문항: ${c.case_ids.slice(0, 5).join(', ')}${c.count > 5 ? ' (전체 ID는 metrics.json)' : ''}`, '');
    }
  }
  lines.push('#### 같은 튜닝 방법으로 묶어 보기', '');
  for (const m of overview.methods) lines.push(`- **${m.name}**: ${m.codes.join(' · ')} — ${m.count}문항(오답 ${m.incorrect}, 정답 ${m.correct}, 자료 판정 불가 ${m.undetermined}, 정확도 미채점 ${m.accuracy_unscored}). 수단은 중복 가능하므로 합산하지 않는다.`);
  return lines;
}

module.exports = { METHODS, tuningCodeOverview, renderTuningCodes };
