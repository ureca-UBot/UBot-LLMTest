#!/usr/bin/env node
// 환각·오답 원인 비율 — Judge 판정(paths.jsonl + accuracy.jsonl)을 원인별로 나눈다.
//
//   node scripts/docgen/cause_breakdown.js <이름>=<llm_judge/<batch> 폴더>[,<폴더>...] ... [--items PI,HR,SR] [--ids-from <이름>] [--json]
//
// 폴더는 raw/scored/<run>/llm_judge/<batch>/ (paths.jsonl·accuracy.jsonl이 있는 곳). 반복 항목(RT)은 뺀다.
// --ids-from: 그 시리즈에 있는 ID만 남긴다(같은 문항끼리 비교할 때).
//
// 환각 원인은 Judge가 적은 hallucinated_claims(주장 문장 + 이유 + type)를 아래 순서로 처음 걸린 하나로 분류한다.
// 응답 단위 집계는 (1) 포함률: 그 원인 주장이 하나라도 있는 환각 응답 비율(겹침 허용) (2) 단독률: 주장이 모두 그 원인인
// 환각 응답 비율(그 원인만 없애면 환각이 사라지는 응답) 두 가지로 본다.
// 오답 원인은 배타 분류(위에서부터 처음 걸린 것)와 포함률(겹침 허용)을 같이 낸다. 배타 분류에서 환각 동반 오답은
// 응답의 "주된" 환각 원인으로 나누는데, 내용 창작(완료·충돌·오귀속·값 창작)을 꼬리 문장(경로·정보 요청·추측)보다 앞에 둔다.
const fs = require('fs');
const path = require('path');

const HALLU = [
  ['COMPLETION', '처리 완료·사칭 수용', (c) => c.type === 'FALSE_COMPLETION' || /(완료|처리|접수)(되었|됐|했|하였)/.test(c.claim)],
  ['ROUTE', '자료에 없는 확인 경로·연락처', (c) => /고객 ?센터|114|\d{3,4}-\d{4}|상담(원|사)|홈페이지|웹사이트|대리점|문의(해|하|를|주)|(앱|메뉴|매장)[^.,]{0,20}(확인|조회|신청|변경|설정|방문)(해|하|할|이|을)|확인(해 ?주시|하시기|하시면)/.test(c.claim)],
  ['CONFLICT', '충돌 임의 선택·우선 규칙 창작', (c, r) => c.type === 'SILENT_CONFLICT_PICK' || (r.item === 'CF' && /문서 ?[AB]|우선(순위|적용)|최근|최신|기준 ?(시점|시각)|시행/.test(c.claim))],
  ['ASK', '추가 정보 요청 꼬리', (c) => /알려 ?주시면|제공해 ?주시면|말씀해 ?주시면|정보가 필요|더 정확한 (답변|안내|정보)/.test(c.claim)],
  ['SPECULATION', '추측·상식 일반화("~에 따라 다를 수 있다")', (c) => c.type === 'UNSUPPORTED_GENERALIZATION' || /따라 ?(다르|달라|상이)|다를 수 있|달라질 수 있|일반적으로|보통|대개|대부분|통신사(별|마다| 정책)|정책에 따라|경우에 따라/.test(c.claim)],
  ['MISATTRIBUTION', '다른 대상·문서·시점 조건 적용(오귀속)', (c) => c.type === 'MISATTRIBUTION'],
  ['FABRICATION', '값·조건·절차 창작', () => true],
];
const HALLU_NAME = Object.fromEntries(HALLU.map(([k, n]) => [k, n]));
const TAILS = new Set(['ROUTE', 'ASK', 'SPECULATION']);
// 배타 분류에서 응답의 주된 환각 원인 — 내용 창작을 꼬리보다 먼저
const PRIMARY_ORDER = ['COMPLETION', 'CONFLICT', 'MISATTRIBUTION', 'FABRICATION', 'ROUTE', 'SPECULATION', 'ASK', 'NO_CLAIM'];

const ANSWERING = new Set(['ANSWER', 'PARTIAL']);
const HOLDING = new Set(['ABSTAIN', 'OUT_OF_SCOPE']);
const WRONG = [
  ['OVER_ABSTAIN', '과잉 보류(답할 수 있는데 보류)', (p) => ANSWERING.has(p.expected_status) && HOLDING.has(p.content_stance)],
  ['HALLU', '환각 동반', (p) => p.flags.hallucinated],
  ['MISSING', '필수 사실 누락(환각 없음)', (p) => p.flags.missing],
  ['SOURCE', '다른 FAQ 내용 사용·사실 오적용(환각 없음)', (p) => p.flags.source_ok === false || p.flags.misapplied],
  ['CONFLICT_MISS', '충돌 미고지(기대 CONFLICT)', (p) => p.expected_status === 'CONFLICT' && p.content_stance !== 'CONFLICT'],
  ['OVER_ANSWER', '보류해야 하는데 답함', (p) => HOLDING.has(p.expected_status) && ANSWERING.has(p.content_stance)],
  ['OTHER', '기타', () => true],
];

const readJsonl = (f) => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));

function load(dirs) {
  const rows = [];
  for (const d of dirs) {
    const acc = new Map();
    for (const a of readJsonl(path.join(d, 'accuracy.jsonl'))) if (a.hallucination) acc.set(a.id, a);
    for (const p of readJsonl(path.join(d, 'paths.jsonl'))) {
      if (p.item === 'RT') continue;
      const a = acc.get(p.id);
      if (!a) throw new Error(`accuracy 없음: ${d} ${p.id}`);
      rows.push({ ...p, claims: a.hallucination.hallucinated_claims });
    }
  }
  return rows;
}

const claimCause = (c, r) => HALLU.find(([, , f]) => f(c, r))[0];

function analyze(rows) {
  const hal = rows.filter((r) => r.flags.hallucinated);
  const wrong = rows.filter((r) => !r.correct);
  const H = { n: hal.length, claims: 0, claimBy: {}, incl: {}, only: {}, noClaim: 0, tailOnly: 0 };
  const respCauses = new Map();
  for (const r of hal) {
    const cs = new Set(r.claims.map((c) => claimCause(c, r)));
    for (const c of r.claims) { H.claims++; const k = claimCause(c, r); H.claimBy[k] = (H.claimBy[k] || 0) + 1; }
    if (!cs.size) { H.noClaim++; cs.add('NO_CLAIM'); }
    for (const k of cs) H.incl[k] = (H.incl[k] || 0) + 1;
    if (cs.size === 1) { const [k] = cs; H.only[k] = (H.only[k] || 0) + 1; }
    if ([...cs].every((k) => TAILS.has(k))) H.tailOnly++;
    respCauses.set(r, cs);
  }
  const W = { n: wrong.length, excl: {}, halluPrimary: {}, incl: {} };
  for (const r of wrong) {
    const k = WRONG.find(([, , f]) => f(r))[0];
    W.excl[k] = (W.excl[k] || 0) + 1;
    if (k === 'HALLU') {
      const cs = respCauses.get(r);
      const pk = PRIMARY_ORDER.find((x) => cs.has(x));
      W.halluPrimary[pk] = (W.halluPrimary[pk] || 0) + 1;
    }
    for (const [wk, , f] of WRONG) if (wk !== 'OTHER' && f(r)) W.incl[wk] = (W.incl[wk] || 0) + 1;
    if (r.flags.hallucinated) for (const hk of respCauses.get(r)) W.incl[`H_${hk}`] = (W.incl[`H_${hk}`] || 0) + 1;
  }
  return { n: rows.length, correct: rows.length - wrong.length, H, W };
}

function main() {
  const args = process.argv.slice(2);
  const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : null; };
  const items = opt('--items'); const idsFrom = opt('--ids-from');
  const asJson = args.includes('--json');
  const series = args.filter((a) => a.includes('=')).map((a) => { const [n, d] = a.split('='); return [n, load(d.split(','))]; });
  const idSet = idsFrom ? new Set(series.find(([n]) => n === idsFrom)[1].map((r) => r.id)) : null;
  const res = series.map(([n, rows]) => {
    let rs = rows;
    if (items) rs = rs.filter((r) => items.split(',').includes(r.item));
    if (idSet) rs = rs.filter((r) => idSet.has(r.id));
    return [n, analyze(rs)];
  });
  if (asJson) return console.log(JSON.stringify(Object.fromEntries(res), null, 1));
  const pct = (a, b) => (b ? `${((100 * (a || 0)) / b).toFixed(1)}%` : '-');
  const cell = (a, b) => `${pct(a, b)} (${a || 0})`;
  const head = (t) => { console.log(`\n${t}\n| 원인 | ${res.map(([n]) => n).join(' | ')} |\n|---|${res.map(() => '---:').join('|')}|`); };
  console.log(`| | ${res.map(([n]) => n).join(' | ')} |\n|---|${res.map(() => '---:').join('|')}|`);
  console.log(`| 문항 | ${res.map(([, a]) => a.n).join(' | ')} |`);
  console.log(`| 오답 | ${res.map(([, a]) => cell(a.W.n, a.n)).join(' | ')} |`);
  console.log(`| 환각 응답 | ${res.map(([, a]) => cell(a.H.n, a.n)).join(' | ')} |`);
  head('환각 응답 중 원인 포함률 (겹침 허용)');
  for (const [k, name] of [...HALLU.map(([k, n]) => [k, n]), ['NO_CLAIM', '주장 미기재']]) console.log(`| ${name} | ${res.map(([, a]) => cell(a.H.incl[k], a.H.n)).join(' | ')} |`);
  console.log(`| (꼬리 문장만으로 환각: 경로·정보 요청·추측뿐) | ${res.map(([, a]) => cell(a.H.tailOnly, a.H.n)).join(' | ')} |`);
  head('환각 응답 중 단독 원인 (그 원인 주장만 있음)');
  for (const [k, name] of HALLU.map(([k, n]) => [k, n])) console.log(`| ${name} | ${res.map(([, a]) => cell(a.H.only[k], a.H.n)).join(' | ')} |`);
  head('원인별 오답 전환율 (그 원인이 포함된 환각 응답 중 오답 비율)');
  for (const [k, name] of HALLU.map(([k, n]) => [k, n])) console.log(`| ${name} | ${res.map(([, a]) => cell(a.W.incl[`H_${k}`], a.H.incl[k])).join(' | ')} |`);
  head('오답 원인 — 배타 분류 (위에서부터 처음 걸린 것, 합계 = 오답)');
  for (const [k, name] of WRONG.map(([k, n]) => [k, n])) {
    console.log(`| ${name} | ${res.map(([, a]) => cell(a.W.excl[k], a.W.n)).join(' | ')} |`);
    if (k === 'HALLU') for (const pk of PRIMARY_ORDER) console.log(`| └ ${HALLU_NAME[pk] || '주장 미기재'} | ${res.map(([, a]) => cell(a.W.halluPrimary[pk], a.W.n)).join(' | ')} |`);
  }
  head('오답 중 원인 포함률 (겹침 허용)');
  for (const [k, name] of WRONG.filter(([k]) => k !== 'OTHER').map(([k, n]) => [k, n.replace('(환각 없음)', '')])) console.log(`| ${name} | ${res.map(([, a]) => cell(a.W.incl[k], a.W.n)).join(' | ')} |`);
  for (const [k, name] of HALLU.map(([k, n]) => [k, n])) console.log(`| 환각: ${name} | ${res.map(([, a]) => cell(a.W.incl[`H_${k}`], a.W.n)).join(' | ')} |`);
}

if (require.main === module) main();
module.exports = { HALLU, WRONG, claimCause, analyze, load };
