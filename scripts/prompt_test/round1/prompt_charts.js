#!/usr/bin/env node
'use strict';
// prompt_stats.js가 만든 JSON 하나만 읽어 프롬프트 비교 차트(SVG)를 만든다.
// 1차 프롬프트 비교(v0~v3) 전용. 대조군·안 목록은 JSON의 baseline·variants를 따른다.
//
//   node scripts/prompt_test/round1/prompt_charts.js --model qwen3:14b --date 20260922
//
// 출력: results/test3_prompt/charts/
//   ① prompt_two_axis.svg     답해야 할 문항 vs 막아야 할 문항 정답률 산점도
//   ② prompt_gain_loss.svg    대조군 대비 얻은/잃은 문항(두 축별 짝 비교)
//   ③ prompt_by_type.svg      유형별 대조군 → 후보 정답률(덤벨, 나머지 안은 작은 점)
//   ④ prompt_head_to_head.svg 유형별 대조군 vs 후보 맞대결(45° 산점도, 마우스를 올리면 상세)
// 그리고 results/test3_prompt/dashboard.html — 요약·표·차트 4장을 한 페이지에 모은다.
//
// 스타일(팔레트·폰트·light/dark 토큰)은 test3 모델 라운드의 lib/charts.js와 맞췄다.
// npm 의존성 0 규칙을 지켜 SVG를 문자열로 조립한다.

const fs = require('fs');
const path = require('path');
const models = require('../../test3/config/models');
const { ROOT, sanitizeTag } = require('../../test3/lib/runner');

const SUITE = `${models.suite}_prompt`;

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', 'Malgun Gothic', sans-serif";

const STYLE = `
  .viz { --surface:#fcfcfb; --ink:#0b0b0b; --ink2:#52514e; --muted:#898781;
         --grid:#e1e0d9; --axis:#c3c2b7;
         --s1:#2a78d6; --s2:#eb6834; --s3:#1baf7a; --s4:#eda100; }
  @media (prefers-color-scheme: dark) {
    .viz { --surface:#1a1a19; --ink:#ffffff; --ink2:#c3c2b7; --muted:#898781;
           --grid:#2c2c2a; --axis:#383835;
           --s1:#3987e5; --s2:#d95926; --s3:#199e70; --s4:#c98500; }
  }
  .bg   { fill: var(--surface); }
  .ttl  { fill: var(--ink);   font-weight:700; }
  .sub  { fill: var(--ink2); }
  .lbl  { fill: var(--ink);  }
  .axl  { fill: var(--muted); }
  .grid { stroke: var(--grid); stroke-width:1; }
  .axis { stroke: var(--axis); stroke-width:1; }
  .note { fill: var(--ink2); }
  .pt   { cursor: default; }
  .pt:hover circle { stroke: var(--ink); stroke-width: 2.5; }
`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function svgDoc(w, h, body, title) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"`,
    ` role="img" aria-label="${esc(title)}" font-family="${FONT}">`,
    `<style>${STYLE}</style>`,
    `<g class="viz"><rect class="bg" x="0" y="0" width="${w}" height="${h}"/>`,
    body,
    '</g></svg>', '',
  ].join('\n');
}

const txt = (x, y, s, { cls = 'lbl', size = 12, anchor = 'start', weight = null, fill = null } = {}) =>
  `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="${cls}" font-size="${size}"`
  + ` text-anchor="${anchor}"${weight ? ` font-weight="${weight}"` : ''}`
  + `${fill ? ` style="fill:${fill}"` : ''}>${esc(s)}</text>`;

const textW = (str, size = 12) => [...String(str)]
  .reduce((w, ch) => w + (ch.charCodeAt(0) > 0x2000 ? size * 0.96 : size * 0.53), 0);

const pct = (v, d = 1) => (v == null ? '-' : (v * 100).toFixed(d) + '%');
const signed = (v) => (v >= 0 ? '+' : '−') + Math.abs(v);
const pFmt = (p) => (p < 0.001 ? 'p<0.001' : `p=${p.toFixed(p < 0.01 ? 3 : 2)}`);

// 안별 표시 이름. 색은 회차마다 setVariants()가 정한다 — 대조군은 회색으로 한 발 물리고,
// 안들은 s1·s3·s4 순서다(1차: v1 파랑 · v2 초록 · v3 노랑).
const NAMES = {
  v0_baseline: '기준선', v1_status_rules: '상태 규칙', v2_value_guard: '값 가드', v3_decision_tree: '판단 순서',
  v4_injection_guard: '공격 경계', v5_condition_apply: '조건 적용', v6_abstain_examples: '보류 예시',
};
const SERIES = ['var(--s1)', 'var(--s3)', 'var(--s4)', 'var(--s2)'];
let VARIANT = {};
let BASE = 'v0_baseline';   // 대조군 안 이름
let B0 = 'v0';              // 대조군 짧은 이름

function setVariants(stats) {
  BASE = stats.baseline || 'v0_baseline';
  B0 = BASE.split('_')[0];
  const vs = stats.variants || Object.keys(stats.headline).filter((v) => v !== BASE);
  const entry = (v, color) => ({ short: v.split('_')[0], name: `${v.split('_')[0]} ${NAMES[v] || v}`, color });
  VARIANT = { [BASE]: entry(BASE, 'var(--muted)') };
  vs.forEach((v, i) => { VARIANT[v] = entry(v, SERIES[i % SERIES.length]); });
}

// "v1·v2·v3" → "v1~v3"처럼 번호가 이어지면 범위로 줄인다.
function shortList(vs) {
  const shorts = vs.map((v) => v.split('_')[0]);
  const nums = shorts.map((x) => Number(x.slice(1)));
  const consecutive = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
  return shorts.length > 2 && consecutive ? `${shorts[0]}~${shorts[shorts.length - 1]}` : shorts.join('·');
}

// Judge 설정(reasoning effort)이 같은 안끼리 묶는다 — [{label: 'v1~v3', effort: 'ultra'}]
function judgeGroups(stats) {
  const groups = [];
  for (const v of Object.keys(VARIANT)) {
    const eff = (stats.headline[v].judge_effort || []).join('/') || '미채점';
    const last = groups[groups.length - 1];
    if (last && last.effort === eff) last.vs.push(v); else groups.push({ effort: eff, vs: [v] });
  }
  return groups.map((g) => ({ label: shortList(g.vs), effort: g.effort }));
}
const judgeShort = (stats) => judgeGroups(stats).map((g) => `${g.label} Judge ${g.effort}`).join(', ');
const modelNote = (stats) => `${stats.model} · temperature 0 · 추론 끔 · 300문항`;
const sigLoss = (x) => x.p_mcnemar < 0.05 && x.only_a > x.only_b;
const sigGain = (x) => x.p_mcnemar < 0.05 && x.only_b > x.only_a;
const COUNT_WORD = { 2: '두', 3: '세', 4: '네' };

// 막을 문항을 유의하게 개선하면서 답할 문항을 유의하게 잃지 않은 안.
function keepers(stats) {
  return stats.paired.filter((p) => p.a === BASE)
    .filter((p) => sigGain(p.ai_correct_by_axis.should_hold) && !sigLoss(p.ai_correct_by_axis.answerable))
    .map((p) => p.b);
}

// ---------------------------------------------------------------- ① 두 축

function twoAxisSvg(stats) {
  const W = 960, H = 660;
  const M = { l: 92, r: 48, t: 118, b: 104 };
  const iw = W - M.l - M.r, ih = H - M.t - M.b;
  // 축 범위는 신뢰구간이 모두 들어가게 x는 5%p, y는 10%p 단위로 잡는다.
  const all = Object.values(stats.two_axis);
  const xs = all.flatMap((a) => [a.answerable.ai_correct.lo, a.answerable.ai_correct.hi]);
  const ys = all.flatMap((a) => [a.should_hold.ai_correct.lo, a.should_hold.ai_correct.hi]);
  const X = [Math.floor(Math.min(...xs) * 20 + 1e-9) / 20, Math.min(1, Math.ceil(Math.max(...xs) * 20 - 1e-9) / 20)];
  const Y = [Math.floor(Math.min(...ys) * 10 + 1e-9) / 10, Math.min(1, Math.ceil(Math.max(...ys) * 10 - 1e-9) / 10)];
  const heroes = keepers(stats);
  const hero = heroes.length === 1 ? heroes[0] : null;
  const sx = (v) => M.l + (v - X[0]) / (X[1] - X[0]) * iw;
  const sy = (v) => M.t + ih - (v - Y[0]) / (Y[1] - Y[0]) * ih;
  const b = [];

  const title = hero ? `보류를 늘리면서 답변 능력을 지킨 건 ${VARIANT[hero].short}뿐`
    : heroes.length ? `막을 문항을 개선하면서 답변 능력을 지킨 안: ${heroes.map((v) => VARIANT[v].short).join(', ')}`
      : `답해야 할 문항 vs 막아야 할 문항 — ${B0} 대비`;
  b.push(txt(26, 32, title, { cls: 'ttl', size: 19 }));
  b.push(txt(26, 54, `x = 답해야 할 문항(기대 상태 답변·부분 답변) 정답률 · y = 막아야 할 문항(보류·확인·범위 밖·충돌) 정답률.`,
    { cls: 'sub', size: 12.5 }));
  b.push(txt(26, 74, `오른쪽 위일수록 좋다. 가로·세로 선은 95% 신뢰구간(Wilson), 점선 화살표는 ${B0}에서의 이동.`,
    { cls: 'sub', size: 12.5 }));

  for (let g = X[0]; g <= X[1] + 1e-9; g += 0.05) {
    b.push(`<line class="grid" x1="${sx(g).toFixed(1)}" y1="${M.t}" x2="${sx(g).toFixed(1)}" y2="${M.t + ih}"/>`);
    b.push(txt(sx(g), M.t + ih + 20, (g * 100).toFixed(0) + '%', { cls: 'axl', size: 11, anchor: 'middle' }));
  }
  for (let g = Y[0]; g <= Y[1] + 1e-9; g += 0.1) {
    b.push(`<line class="grid" x1="${M.l}" y1="${sy(g).toFixed(1)}" x2="${M.l + iw}" y2="${sy(g).toFixed(1)}"/>`);
    b.push(txt(M.l - 10, sy(g) + 4, (g * 100).toFixed(0) + '%', { cls: 'axl', size: 11, anchor: 'end' }));
  }
  const ans0 = stats.two_axis[BASE].answerable.ai_correct;
  b.push(txt(M.l + iw / 2, M.t + ih + 46, `답해야 할 문항 정답률 (n=${ans0.n}) →`, { cls: 'sub', size: 12.5, anchor: 'middle', weight: 600 }));
  const yl = `막아야 할 문항 정답률 (n=${stats.two_axis[BASE].should_hold.ai_correct.n}) →`;
  b.push(`<text transform="translate(30 ${(M.t + ih / 2).toFixed(1)}) rotate(-90)" class="sub" font-size="12.5"`
    + ` font-weight="600" text-anchor="middle">${esc(yl)}</text>`);

  // 대조군의 답변 수준 기준선 — 이 선보다 왼쪽이면 "답할 문항"에서 대조군보다 못하다.
  b.push(`<line x1="${sx(ans0.rate).toFixed(1)}" y1="${M.t}" x2="${sx(ans0.rate).toFixed(1)}" y2="${M.t + ih}"`
    + ` stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="5 4"/>`);
  b.push(txt(sx(ans0.rate) + 6, M.t + 14, `${B0}의 답변 정답률`, { cls: 'note', size: 11 }));
  b.push(txt(sx(ans0.rate) - 6, M.t + 14, '← 여기서 왼쪽 = 답변 능력 손실', { cls: 'note', size: 11, anchor: 'end' }));

  b.push('<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">'
    + '<path d="M0,0 L10,5 L0,10 z" fill="var(--muted)"/></marker></defs>');

  const pts = Object.entries(stats.two_axis).map(([v, a]) => ({
    v, x: a.answerable.ai_correct, y: a.should_hold.ai_correct,
  }));
  const p0 = pts.find((p) => p.v === BASE);
  for (const p of pts) {
    if (p === p0) continue;
    const x1 = sx(p0.x.rate), y1 = sy(p0.y.rate), x2 = sx(p.x.rate), y2 = sy(p.y.rate);
    const d = Math.hypot(x2 - x1, y2 - y1), sh = 12 / d;
    b.push(`<line x1="${(x1 + (x2 - x1) * sh).toFixed(1)}" y1="${(y1 + (y2 - y1) * sh).toFixed(1)}"`
      + ` x2="${(x2 - (x2 - x1) * sh).toFixed(1)}" y2="${(y2 - (y2 - y1) * sh).toFixed(1)}"`
      + ` stroke="var(--muted)" stroke-width="1.2" stroke-dasharray="3 4" opacity="0.7" marker-end="url(#arr)"/>`);
  }
  for (const p of pts) {
    const c = VARIANT[p.v].color, x = sx(p.x.rate), y = sy(p.y.rate);
    b.push(`<line x1="${sx(p.x.lo).toFixed(1)}" y1="${y.toFixed(1)}" x2="${sx(p.x.hi).toFixed(1)}" y2="${y.toFixed(1)}" stroke="${c}" stroke-width="2" opacity="0.45"/>`);
    b.push(`<line x1="${x.toFixed(1)}" y1="${sy(p.y.lo).toFixed(1)}" x2="${x.toFixed(1)}" y2="${sy(p.y.hi).toFixed(1)}" stroke="${c}" stroke-width="2" opacity="0.45"/>`);
  }
  // 1차는 점 배치에 맞춰 라벨 자리를 손으로 정했다(4개뿐이라 읽기 쉽다).
  // 다른 회차는 점·다른 라벨과 겹치지 않는 첫 자리를 고른다.
  const ROUND1_PLACE = { v0_baseline: [14, 22, 'start'], v1_status_rules: [-14, -30, 'end'],
    v2_value_guard: [48, -30, 'start'], v3_decision_tree: [-14, 30, 'end'] };
  const fixed = BASE === 'v0_baseline';
  const taken = pts.map((p) => ({ x0: sx(p.x.rate) - 12, x1: sx(p.x.rate) + 12, y0: sy(p.y.rate) - 12, y1: sy(p.y.rate) + 12 }));
  const autoPlace = (p) => {
    const x = sx(p.x.rate), y = sy(p.y.rate);
    const w = Math.max(textW(VARIANT[p.v].name, 13.5), textW('답 00.0% · 막기 00.0%', 11.5));
    for (const [dx, dy, anchor] of [[14, 22, 'start'], [14, -30, 'start'], [-14, -30, 'end'], [-14, 22, 'end'], [48, -30, 'start'], [14, 48, 'start']]) {
      const x0 = anchor === 'start' ? x + dx : x + dx - w;
      const box = { x0: x0 - 3, x1: x0 + w + 3, y0: y + dy - 14, y1: y + dy + 22 };
      if (box.x0 < M.l || box.x1 > M.l + iw || box.y0 < M.t || box.y1 > M.t + ih) continue;
      if (taken.some((q) => box.x0 < q.x1 && box.x1 > q.x0 && box.y0 < q.y1 && box.y1 > q.y0)) continue;
      taken.push(box);
      return [dx, dy, anchor];
    }
    return [14, 22, 'start'];
  };
  for (const p of pts) {
    const c = VARIANT[p.v].color, x = sx(p.x.rate), y = sy(p.y.rate);
    const isHero = p.v === hero;
    b.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${isHero ? 10 : 8}" fill="${c}" stroke="var(--surface)" stroke-width="2"/>`);
    const [dx, dy, anchor] = fixed && ROUND1_PLACE[p.v] ? ROUND1_PLACE[p.v] : autoPlace(p);
    b.push(txt(x + dx, y + dy, VARIANT[p.v].name, { cls: 'lbl', size: 13.5, anchor, weight: 700 }));
    b.push(txt(x + dx, y + dy + 17, `답 ${pct(p.x.rate)} · 막기 ${pct(p.y.rate)}`, { cls: 'note', size: 11.5, anchor }));
  }

  // Judge 설정 교란 점검 결과를 그대로 적는다(prompt_stats.js의 judge_calibration).
  const cal = Object.values(stats.judge_calibration || {});
  if (cal.length) {
    const same = cal.map((c) => c.identical_answers);
    const agree = cal.reduce((a, c) => a + c.verdict_agree, 0) / Math.max(1, same.reduce((a, c) => a + c, 0));
    const settings = judgeGroups(stats).map((g) => `${g.label}는 ${g.effort}`).join(', ');
    b.push(txt(26, H - 30, `LLM Judge(gpt-6-astra) 정답 판정 기준. ${settings} 설정으로 채점했다 —`
      + ` ${B0}와 답이 글자까지 같은 ${Math.min(...same)}~${Math.max(...same)}문항에서 두 설정의 판정은 ${pct(agree, 0)} 일치했다.`,
    { cls: 'note', size: 11.5 }));
  } else {
    b.push(txt(26, H - 30, `LLM Judge(gpt-6-astra) 정답 판정 기준. 모든 안을 같은 설정(${judgeGroups(stats)[0].effort})으로 채점했다.`,
      { cls: 'note', size: 11.5 }));
  }
  b.push(txt(26, H - 12, modelNote(stats), { cls: 'note', size: 11.5 }));
  return svgDoc(W, H, b.join('\n'), '프롬프트별 답해야 할 문항과 막아야 할 문항 정답률');
}

// ---------------------------------------------------------------- ② 얻은/잃은 문항

function gainLossSvg(stats) {
  const rows = [];
  for (const r of stats.paired.filter((x) => x.a === BASE)) {
    for (const [axis, label] of [['should_hold', '막아야 할 문항'], ['answerable', '답해야 할 문항']]) {
      const s = r.ai_correct_by_axis[axis];
      rows.push({ v: r.b, axis, label, gain: s.only_b, loss: s.only_a, n: s.n, p: s.p_mcnemar });
    }
  }
  const W = 960, rowH = 34, groupGap = 22;
  const top = 128, labelW = 250;
  const H = top + rows.length * rowH + (rows.length / 2 - 1) * groupGap + 110;
  const max = Math.max(...rows.map((r) => Math.max(r.gain, r.loss)));
  const half = 230;
  // 막대 왼쪽 끝과 행 라벨 사이에 숫자(−NN)가 들어갈 자리를 남긴다.
  const cx = labelW + half + 44;
  const scale = (n) => n / max * half;
  const b = [];

  b.push(txt(26, 32, `${B0} 대비 어디서 얻고 어디서 잃었나`, { cls: 'ttl', size: 19 }));
  b.push(txt(26, 54, `같은 문항끼리 짝지어 센 LLM Judge 정답 수. 오른쪽 = ${B0}에서 틀렸다가 맞힌 문항, 왼쪽 = ${B0}에서 맞혔다가 틀린 문항.`,
    { cls: 'sub', size: 12.5 }));
  // 요약 한 줄도 데이터에서 만든다.
  const fromBase = stats.paired.filter((p) => p.a === BASE);
  const holdUp = fromBase.filter((p) => sigGain(p.ai_correct_by_axis.should_hold)).map((p) => p.b);
  const keep = fromBase.filter((p) => !sigLoss(p.ai_correct_by_axis.answerable)).map((p) => p.b);
  const sh = (vs) => vs.map((v) => VARIANT[v].short).join(', ');
  const part1 = holdUp.length === fromBase.length
    ? `${COUNT_WORD[fromBase.length] || fromBase.length} 안 모두 "막아야 할 문항"은 크게 고쳤다.`
    : `"막아야 할 문항"을 유의하게 고친 안: ${sh(holdUp) || '없음'}.`;
  const part2 = keep.length === 1 ? `"답해야 할 문항"을 유의하게 잃지 않은 건 ${sh(keep)}뿐이다.`
    : keep.length === fromBase.length ? '"답해야 할 문항"을 유의하게 잃은 안은 없다.'
      : `"답해야 할 문항"을 유의하게 잃지 않은 안: ${sh(keep) || '없음'}.`;
  b.push(txt(26, 74, `${part1} ${part2}`, { cls: 'sub', size: 12.5, weight: 600 }));

  b.push(txt(cx - 8, top - 16, `← 잃음 (${B0}만 맞힘)`, { cls: 'sub', size: 12, anchor: 'end', weight: 600 }));
  b.push(txt(cx + 8, top - 16, '얻음 (이 안만 맞힘) →', { cls: 'sub', size: 12, weight: 600 }));
  b.push(txt(W - 26, top - 16, '순증 · McNemar', { cls: 'sub', size: 12, anchor: 'end', weight: 600 }));

  let y = top;
  rows.forEach((r, i) => {
    if (i > 0 && i % 2 === 0) {
      b.push(`<line class="grid" x1="26" y1="${(y + groupGap / 2 - 4).toFixed(1)}" x2="${W - 26}" y2="${(y + groupGap / 2 - 4).toFixed(1)}"/>`);
      y += groupGap;
    }
    if (i % 2 === 0) {
      b.push(txt(26, y + rowH + 2, VARIANT[r.v].name, { cls: 'lbl', size: 14, weight: 700, fill: VARIANT[r.v].color }));
    }
    b.push(txt(labelW, y + 18, `${r.label} (n=${r.n})`, { cls: 'note', size: 12, anchor: 'end' }));
    const wl = scale(r.loss), wg = scale(r.gain);
    const sig = r.p < 0.05;
    const lossBad = sig && r.loss > r.gain;
    b.push(`<rect x="${(cx - wl).toFixed(1)}" y="${y + 4}" width="${Math.max(1.5, wl).toFixed(1)}" height="20" rx="3"`
      + ` fill="var(--s2)" fill-opacity="${lossBad ? 1 : 0.55}"/>`);
    b.push(`<rect x="${cx}" y="${y + 4}" width="${Math.max(1.5, wg).toFixed(1)}" height="20" rx="3"`
      + ` fill="var(--s3)" fill-opacity="${sig && r.gain > r.loss ? 1 : 0.55}"/>`);
    b.push(txt(cx - wl - 6, y + 19, `−${r.loss}`, { cls: 'lbl', size: 12, anchor: 'end', weight: lossBad ? 700 : 400 }));
    b.push(txt(cx + wg + 6, y + 19, `+${r.gain}`, { cls: 'lbl', size: 12 }));
    const net = r.gain - r.loss;
    const verdict = !sig ? '차이 없음' : net > 0 ? '유의하게 좋아짐' : '유의하게 나빠짐';
    b.push(txt(W - 26, y + 19, `${signed(net)}  ${pFmt(r.p)}  ${verdict}`,
      { cls: sig ? 'lbl' : 'note', size: 12, anchor: 'end', weight: sig && net < 0 ? 700 : 400,
        fill: sig && net < 0 ? 'var(--s2)' : null }));
    y += rowH;
  });
  b.push(`<line class="axis" x1="${cx}" y1="${top - 4}" x2="${cx}" y2="${y + 2}"/>`);

  b.push(txt(26, H - 48, '막아야 할 문항: 기대 상태가 보류·확인 요청·범위 밖·충돌 고지. 답해야 할 문항: 기대 상태가 답변·부분 답변.',
    { cls: 'note', size: 11.5 }));
  b.push(txt(26, H - 30, 'McNemar 정확검정(양측)은 짝이 갈린 문항만으로 우연 여부를 본다. p<0.05면 진하게 표시했다.',
    { cls: 'note', size: 11.5 }));
  b.push(txt(26, H - 12, modelNote(stats), { cls: 'note', size: 11.5 }));
  return svgDoc(W, H, b.join('\n'), `${B0} 대비 프롬프트별 얻은 문항과 잃은 문항`);
}

// ---------------------------------------------------------------- ③ 유형별 덤벨

// 유형 13개를 한 줄씩. v0(빈 원) → 채택 후보(큰 원)를 선으로 잇고, 나머지 안은 작은 점으로
// 같은 줄에 찍는다. 산점도는 90~100% 구간에 유형이 몰려 라벨이 겹쳐서 줄 형태로 그린다.
function byTypeSvg(stats, A, B) {
  const others = Object.keys(VARIANT).filter((v) => v !== A && v !== B);
  const rows = stats.by_type
    .filter((t) => t[A] && t[B] && t[A].ai_correct != null && t[B].ai_correct != null)
    .map((t) => ({ type: t.type, n: t.n, a: t[A].ai_correct, b: t[B].ai_correct,
      o: others.map((v) => ({ v, x: t[v] ? t[v].ai_correct : null })) }))
    .sort((p, q) => (q.b - q.a) - (p.b - p.a));
  const winsB = rows.filter((r) => r.b > r.a + 1e-9).length;
  const winsA = rows.filter((r) => r.a > r.b + 1e-9).length;

  const W = 960, rowH = 36, top = 142, labelW = 212, deltaW = 96;
  const H = top + rows.length * rowH + 92;
  const x0 = labelW + 14, x1 = W - deltaW - 26;
  const sx = (v) => x0 + v * (x1 - x0);
  const b = [];
  const nA = VARIANT[A].name, nB = VARIANT[B].name;

  b.push(txt(26, 32, `유형별 정답률 — ${nA} → ${nB}`, { cls: 'ttl', size: 19 }));
  b.push(txt(26, 54, `빈 원 = ${VARIANT[A].short}, 큰 원 = ${VARIANT[B].short}, 작은 점 = 나머지 안. 선 색은 ${VARIANT[A].short} 대비 방향(초록 개선 · 주황 퇴보). LLM Judge 정답률.`,
    { cls: 'sub', size: 12.5 }));
  b.push(txt(26, 76, `${VARIANT[B].short} ${winsB}개 유형 개선 · ${winsA}개 유형 퇴보 · ${rows.length - winsA - winsB}개 동률. 개선 폭이 큰 순으로 정렬했다.`,
    { cls: 'sub', size: 13, weight: 700 }));

  // 범례
  let lx = 26;
  const legend = [[A, 'hollow'], [B, 'big'], ...others.map((v) => [v, 'dot'])];
  for (const [v, kind] of legend) {
    const c = VARIANT[v].color;
    if (kind === 'hollow') b.push(`<circle cx="${lx + 6}" cy="102" r="6" fill="var(--surface)" stroke="${c}" stroke-width="2.5"/>`);
    else if (kind === 'big') b.push(`<circle cx="${lx + 6}" cy="102" r="7" fill="${c}"/>`);
    else b.push(`<circle cx="${lx + 6}" cy="102" r="4.5" fill="${c}" fill-opacity="0.85"/>`);
    b.push(txt(lx + 18, 106, VARIANT[v].name, { cls: 'note', size: 12 }));
    lx += 30 + textW(VARIANT[v].name, 12);
  }

  for (let g = 0; g <= 1.0001; g += 0.25) {
    b.push(`<line class="grid" x1="${sx(g).toFixed(1)}" y1="${top - 8}" x2="${sx(g).toFixed(1)}" y2="${top + rows.length * rowH}"/>`);
    b.push(txt(sx(g), top + rows.length * rowH + 18, (g * 100).toFixed(0) + '%', { cls: 'axl', size: 11, anchor: 'middle' }));
  }
  b.push(txt(W - 26, top - 14, `${VARIANT[B].short} − ${VARIANT[A].short}`, { cls: 'sub', size: 12, anchor: 'end', weight: 600 }));

  rows.forEach((r, i) => {
    const y = top + i * rowH + rowH / 2;
    if (i % 2 === 0) b.push(`<rect x="20" y="${y - rowH / 2}" width="${W - 40}" height="${rowH}" fill="var(--grid)" opacity="0.35"/>`);
    const small = r.n < 10;
    b.push(txt(labelW, y + 4.5, `${r.type} (${r.n})${small ? ' ⚠' : ''}`, { cls: small ? 'note' : 'lbl', size: 12.5, anchor: 'end' }));
    const d = r.b - r.a;
    const c = Math.abs(d) < 1e-9 ? 'var(--muted)' : d > 0 ? 'var(--s3)' : 'var(--s2)';
    b.push(`<line x1="${sx(r.a).toFixed(1)}" y1="${y}" x2="${sx(r.b).toFixed(1)}" y2="${y}" stroke="${c}" stroke-width="4" stroke-linecap="round" opacity="0.8"/>`);
    // 그리는 순서: 후보(큰 원) → v0(빈 고리) → 나머지(작은 점). 값이 같아도 서로 가리지 않는다
    // — 같으면 큰 원 위에 고리가 씌워지고, 그 안에 작은 점이 보인다.
    b.push(`<circle cx="${sx(r.b).toFixed(1)}" cy="${y}" r="8" fill="${VARIANT[B].color}" stroke="var(--surface)" stroke-width="1.5"/>`);
    b.push(`<circle cx="${sx(r.a).toFixed(1)}" cy="${y}" r="${Math.abs(d) < 1e-9 ? 10.5 : 6.5}" fill="${Math.abs(d) < 1e-9 ? 'none' : 'var(--surface)'}" stroke="${VARIANT[A].color}" stroke-width="2.5"/>`);
    for (const o of r.o) {
      if (o.x == null) continue;
      b.push(`<circle cx="${sx(o.x).toFixed(1)}" cy="${y}" r="4.5" fill="${VARIANT[o.v].color}" fill-opacity="0.9" stroke="var(--surface)" stroke-width="1"/>`);
    }
    const pp = Math.round(d * 100);
    b.push(txt(W - 26, y + 4.5, `${pp === 0 ? '±0' : signed(pp)}%p`,
      { cls: 'lbl', size: 12.5, anchor: 'end', weight: Math.abs(pp) >= 10 ? 700 : 400,
        fill: Math.abs(pp) >= 10 ? (pp > 0 ? 'var(--s3)' : 'var(--s2)') : null }));
  });

  b.push(txt(26, H - 30, '⚠ = 10문항 미만. 1~2문항 차이로 비율이 크게 흔들리므로 결론 근거로 쓰지 말 것.', { cls: 'note', size: 11.5 }));
  b.push(txt(26, H - 12, `${modelNote(stats)} · ${judgeShort(stats)}`, { cls: 'note', size: 11.5 }));
  return svgDoc(W, H, b.join('\n'), `유형별 정답률 ${nA} 대 ${nB}`);
}

// ---------------------------------------------------------------- ④ 유형별 맞대결(호버)

// test3 대시보드의 맞대결 차트와 같은 45° 대각선 산점도. 90~100% 구간에 유형이 몰려
// 이름 라벨이 겹치므로 라벨을 달지 않고, 점에 마우스를 올리면 유형·수치가 뜨게 한다
// (<title> = 브라우저 기본 툴팁, data-tip = 대시보드의 즉시 툴팁).
// 점끼리 겹치면 가려진 점에 마우스를 올릴 수 없으므로 밀어내고(반발 이완),
// 실제 위치에는 작은 점 + 지시선을 남긴다.
function headToHeadSvg(stats, A, B) {
  const others = Object.keys(VARIANT).filter((v) => v !== A && v !== B);
  const rows = stats.by_type
    .filter((t) => t[A] && t[B] && t[A].ai_correct != null && t[B].ai_correct != null)
    .map((t) => ({ type: t.type, n: t.n, a: t[A].ai_correct, b: t[B].ai_correct,
      o: others.map((v) => ({ v, x: t[v] ? t[v].ai_correct : null })) }));
  const winsB = rows.filter((r) => r.b > r.a + 1e-9).length;
  const winsA = rows.filter((r) => r.a > r.b + 1e-9).length;

  const W = 640, H = 770;
  const side = 520, M = { l: 86, t: 118 };
  const D = [0.2, 1.0];
  const sx = (v) => M.l + (v - D[0]) / (D[1] - D[0]) * side;
  const sy = (v) => M.t + side - (v - D[0]) / (D[1] - D[0]) * side;
  const nmax = Math.max(...rows.map((r) => r.n));
  const rad = (n) => 6 + Math.sqrt(n / nmax) * 8;
  const b = [];
  const nA = VARIANT[A].name, nB = VARIANT[B].name;

  b.push(txt(26, 32, `유형별 정답률 맞대결 — ${nB} vs ${nA}`, { cls: 'ttl', size: 19 }));
  b.push(txt(26, 54, `대각선 위 = ${VARIANT[B].short} 우세. 원 크기는 문항 수, 빈 원은 10문항 미만. LLM Judge 정답률.`,
    { cls: 'sub', size: 12.5 }));
  b.push(txt(26, 74, '점에 마우스를 올리면 유형 이름과 안별 정답률이 보인다.', { cls: 'sub', size: 12.5 }));
  b.push(txt(26, 96, `${VARIANT[B].short} ${winsB}승 · ${VARIANT[A].short} ${winsA}승 · 무 ${rows.length - winsA - winsB}`,
    { cls: 'sub', size: 13, weight: 700 }));

  for (let g = D[0]; g <= D[1] + 1e-9; g += 0.2) {
    b.push(`<line class="grid" x1="${sx(g).toFixed(1)}" y1="${M.t}" x2="${sx(g).toFixed(1)}" y2="${M.t + side}"/>`);
    b.push(`<line class="grid" x1="${M.l}" y1="${sy(g).toFixed(1)}" x2="${M.l + side}" y2="${sy(g).toFixed(1)}"/>`);
    b.push(txt(sx(g), M.t + side + 20, (g * 100).toFixed(0) + '%', { cls: 'axl', size: 11, anchor: 'middle' }));
    b.push(txt(M.l - 10, sy(g) + 4, (g * 100).toFixed(0) + '%', { cls: 'axl', size: 11, anchor: 'end' }));
  }
  b.push(txt(M.l + side / 2, M.t + side + 46, `${nA} 정답률 →`, { cls: 'sub', size: 12.5, anchor: 'middle', weight: 600 }));
  b.push(`<text transform="translate(30 ${(M.t + side / 2).toFixed(1)}) rotate(-90)" class="sub" font-size="12.5"`
    + ` font-weight="600" text-anchor="middle">${esc(nB + ' 정답률 →')}</text>`);
  b.push(`<line x1="${sx(D[0])}" y1="${sy(D[0])}" x2="${sx(D[1])}" y2="${sy(D[1])}"`
    + ` stroke="var(--muted)" stroke-width="2" stroke-dasharray="6 5" opacity="0.8"/>`);
  b.push(txt(sx(0.3) + 10, sy(0.3) + 4, '동률선', { cls: 'note', size: 11 }));
  b.push(txt(M.l + 12, M.t + 22, `▲ ${VARIANT[B].short} 우세`, { cls: 'sub', size: 12, weight: 600 }));
  b.push(txt(M.l + side - 12, M.t + side - 14, `${VARIANT[A].short} 우세 ▼`, { cls: 'sub', size: 12, weight: 600, anchor: 'end' }));

  // 반발 이완: 두 원의 반지름 합 + 2px 이상 떨어질 때까지 조금씩 민다. 결정론적이다.
  const pts = rows.map((r) => ({ r, rr: rad(r.n), tx: sx(r.a), ty: sy(r.b), x: sx(r.a), y: sy(r.b) }));
  for (let it = 0; it < 400; it++) {
    let moved = false;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const p = pts[i], q = pts[j];
        const minD = p.rr + q.rr + 2;
        let dx = q.x - p.x, dy = q.y - p.y;
        let d = Math.hypot(dx, dy);
        if (d >= minD) continue;
        if (d < 1e-6) { dx = 1; dy = -1; d = Math.SQRT2; }
        const push = (minD - d) / 2 + 0.2;
        p.x -= dx / d * push; p.y -= dy / d * push;
        q.x += dx / d * push; q.y += dy / d * push;
        moved = true;
      }
    }
    for (const p of pts) {
      p.x = Math.min(M.l + side - p.rr, Math.max(M.l + p.rr, p.x));
      p.y = Math.min(M.t + side - p.rr, Math.max(M.t + p.rr, p.y));
    }
    if (!moved) break;
  }
  for (const p of pts) {
    if (Math.hypot(p.x - p.tx, p.y - p.ty) > 3) {
      b.push(`<line x1="${p.tx.toFixed(1)}" y1="${p.ty.toFixed(1)}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="var(--ink2)" stroke-width="1" opacity="0.6"/>`);
      b.push(`<circle cx="${p.tx.toFixed(1)}" cy="${p.ty.toFixed(1)}" r="2.5" fill="var(--ink2)"/>`);
    }
  }
  const colorOf = (r) => (Math.abs(r.b - r.a) < 1e-9 ? 'var(--muted)' : r.b > r.a ? 'var(--s3)' : 'var(--s2)');
  // 큰 원부터 그려 작은 원이 위에 오게 한다(작은 원도 마우스로 잡히도록).
  for (const p of pts.slice().sort((x, y) => y.rr - x.rr)) {
    const r = p.r, c = colorOf(r), small = r.n < 10;
    const pp = Math.round((r.b - r.a) * 100);
    const tip = [
      `${r.type} (${r.n}문항)${small ? ' ⚠ 10문항 미만' : ''}`,
      `${VARIANT[A].short} ${pct(r.a, 0)} → ${VARIANT[B].short} ${pct(r.b, 0)} (${pp === 0 ? '±0' : signed(pp)}%p)`,
      r.o.filter((o) => o.x != null).map((o) => `${VARIANT[o.v].short} ${pct(o.x, 0)}`).join(' · '),
    ].filter(Boolean).join('\n');
    b.push(`<g class="pt" data-tip="${esc(tip).replace(/"/g, '&quot;').replace(/\n/g, '&#10;')}">`
      + `<title>${esc(tip)}</title>`
      + `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.rr.toFixed(1)}"`
      + (small ? ` fill="var(--surface)" stroke="${c}" stroke-width="2.5"`
        : ` fill="${c}" fill-opacity="${Math.abs(pp) >= 10 ? 0.95 : 0.65}" stroke="var(--surface)" stroke-width="1.5"`)
      + '/></g>');
  }

  b.push(txt(26, H - 48, `초록 = ${VARIANT[B].short}가 높음, 주황 = ${VARIANT[A].short}가 높음, 회색 = 같음. 진한 원 = 10%p 이상 차이.`,
    { cls: 'note', size: 11.5 }));
  b.push(txt(26, H - 30, '축은 20%부터. 겹치는 원은 옆으로 밀고 실제 위치는 작은 점과 가는 선으로 남겼다.',
    { cls: 'note', size: 11.5 }));
  b.push(txt(26, H - 12, `${modelNote(stats)} · ${judgeShort(stats)}`, { cls: 'note', size: 11.5 }));
  return svgDoc(W, H, b.join('\n'), `유형별 정답률 맞대결 ${nB} 대 ${nA}`);
}

// ---------------------------------------------------------------- 대시보드

// 1차 후보 규칙: 대조군 대비 "답해야 할 문항"을 유의하게 잃지 않은 안 중 AI 정확도 최고.
// (보류를 늘려 막기만 잘하는 안을 거르기 위한 규칙이다. 최종 채택은 사람이 한다.)
function pickCandidate(stats) {
  const fromV0 = stats.paired.filter((p) => p.a === BASE);
  const ok = fromV0.filter((p) => {
    const s = p.ai_correct_by_axis.answerable;
    return !(s.p_mcnemar < 0.05 && s.only_a > s.only_b);
  }).map((p) => p.b);
  const pool = ok.length ? ok : fromV0.map((p) => p.b);
  return pool.sort((x, y) => stats.headline[y].ai_correct.rate - stats.headline[x].ai_correct.rate)[0];
}

function dashboardHtml(stats, charts, suite) {
  const H = stats.headline;
  const V = Object.keys(VARIANT).filter((v) => H[v]);
  const best = pickCandidate(stats);
  const pair = (a, b) => stats.paired.find((p) => p.a === a && p.b === b)
    || stats.paired.find((p) => p.a === b && p.b === a);
  const ci = (m) => `${pct(m.rate)} <span class="ci">[${pct(m.lo, 0)}–${pct(m.hi, 0)}]</span>`;
  const verdict = (p, net) => (p >= 0.05 ? '차이 없음' : net > 0 ? '유의하게 좋아짐' : '유의하게 나빠짐');

  const decode = V.map((v) => `${VARIANT[v].short} ${H[v].decode_tok_per_s}`).join(' · ');
  const cal = Object.values(stats.judge_calibration || {});
  const calSame = cal.reduce((a, c) => a + c.identical_answers, 0);
  const calAgree = cal.reduce((a, c) => a + c.verdict_agree, 0);
  const cands = V.filter((v) => v !== BASE);

  // 지연: 대조군과 안들의 디코딩 속도가 5% 넘게 다르면 실행 환경이 다른 것이다.
  const speeds = cands.map((v) => H[v].decode_tok_per_s);
  const baseSpeed = H[BASE].decode_tok_per_s;
  const envDiff = speeds.some((x) => Math.abs(x - baseSpeed) / Math.max(x, baseSpeed) > 0.05);
  const interLat = stats.paired.filter((p) => p.a !== BASE && p.b !== BASE).map((p) => Math.abs(p.latency.mean_diff_s));
  const latencyNote = envDiff
    ? `<b>지연은 프롬프트 효과가 아니다</b> — 디코딩 속도(tok/s)가 ${decode}로 ${B0} 실행 환경이 달랐다.`
      + (interLat.length ? ` ${shortList(cands)}끼리의 지연 차이는 짝 비교로 ${Math.max(...interLat).toFixed(2)}초 수준이다.` : '')
    : `디코딩 속도(tok/s)가 ${decode}로 같아, 지연 차이를 그대로 비교할 수 있다.`;
  const judgeNote = cal.length
    ? `Judge 설정: ${judgeGroups(stats).map((g, i) => `${g.label}는 ${i === 0 ? 'gpt-6-astra ' : ''}${g.effort}`).join(', ')}.`
      + ` ${B0}와 답이 글자까지 같은 ${calSame}건에서 두 설정의 판정 일치 ${calAgree}/${calSame}건 — 설정 차이의 영향은 작다.`
    : `Judge 설정: 모든 안 gpt-6-astra ${judgeGroups(stats)[0].effort} — AI 지표를 그대로 비교할 수 있다.`;

  // ---- 요약: 전부 JSON에서 계산해 적는다(하드코딩 없음).
  const p0 = pair(BASE, best);
  const ax = p0.ai_correct_by_axis;
  const others = V.filter((v) => v !== BASE && v !== best);
  const vsOthers = others.map((o) => {
    const p = pair(o, best);
    const net = p.a === o ? p.ai_correct.only_b - p.ai_correct.only_a : p.ai_correct.only_a - p.ai_correct.only_b;
    return `${VARIANT[o].short} 대비 ${signed(net)}문항 (Holm ${pFmt(p.ai_correct.p_holm)}, ${verdict(p.ai_correct.p_holm, net)})`;
  });
  const worst = stats.by_type
    .filter((t) => t.n >= 10 && t[best] && t[BASE])
    .map((t) => ({ type: t.type, d: t[best].ai_correct - t[BASE].ai_correct }))
    .filter((t) => t.d < -0.05).sort((a, b) => a.d - b.d);

  const summary = `
<section class="card lead">
  <p class="eyebrow">데이터가 가리키는 후보</p>
  <h2><span class="dot" style="background:${VARIANT[best].color.replace('var(--', 'var(--c-')}"></span>${esc(VARIANT[best].name)} <code>${best}</code></h2>
  <ul>
    <li><b>내용 정확도 ${pct(H[BASE].ai_correct.rate)} → ${pct(H[best].ai_correct.rate)}</b>
      — 같은 문항 짝 비교 ${signed(p0.ai_correct.net_b_minus_a)}문항, Holm ${pFmt(p0.ai_correct.p_holm)}</li>
    <li>막아야 할 문항 ${signed(ax.should_hold.only_b)} / ${'−' + ax.should_hold.only_a}문항 (${pFmt(ax.should_hold.p_mcnemar)}),
      답해야 할 문항 ${signed(ax.answerable.only_b)} / ${'−' + ax.answerable.only_a}문항 (${pFmt(ax.answerable.p_mcnemar)}, ${verdict(ax.answerable.p_mcnemar, ax.answerable.net_b_minus_a)})
      — <b>보류를 늘리면서 답변 능력을 잃지 않은 안</b></li>
    <li>다른 안과 비교: ${vsOthers.map(esc).join(' · ')}</li>
    ${worst.length ? `<li>남은 약점(${B0}보다 5%p 이상 하락, 10문항 이상 유형): ${worst.map((w) => `${esc(w.type)} ${signed(Math.round(w.d * 100))}%p`).join(' · ')}</li>` : ''}
  </ul>
  <p class="rule">후보 규칙: ${B0} 대비 "답해야 할 문항"을 유의하게(p&lt;0.05) 잃지 않은 안 중 내용 정확도가 가장 높은 안. 최종 채택은 사람이 판단한다.</p>
</section>`;

  // ---- 표 1: 전체 비교
  const t1 = V.map((v) => {
    const h = H[v], a = stats.two_axis[v];
    return `<tr${v === best ? ' class="hi"' : ''}><th>${esc(VARIANT[v].name)}</th>
      <td>${ci(h.ai_correct)}</td><td>${h.correct_grounded ? pct(h.correct_grounded.rate) : '-'}</td><td>${ci(h.ai_grounded)}</td><td>${ci(h.status_match)}</td>
      <td>${h.abstain_f1 != null ? h.abstain_f1.toFixed(3) : '-'}</td>
      <td>${pct(a.answerable.ai_correct.rate)}</td><td>${pct(a.should_hold.ai_correct.rate)}</td>
      <td>${a.answerable.over_refusal.k}</td><td>${a.should_hold.over_answer.k}</td>
      <td>${h.hallucinated_cases}</td><td>${h.expression_avg.toFixed(2)}</td>
      <td>${h.latency_s.mean.toFixed(2)}s</td><td>${h.latency_s.p95.toFixed(2)}s</td><td>${h.prompt_tokens_mean}</td></tr>`;
  }).join('\n');

  // ---- 표 2: 짝 비교
  const t2 = stats.paired.map((p) => {
    const c = p.ai_correct, s = p.status_match;
    return `<tr><th>${VARIANT[p.a].short} → ${VARIANT[p.b].short}</th>
      <td>${c.only_a}</td><td>${c.only_b}</td><td>${signed(c.net_b_minus_a)}</td><td>${pFmt(c.p_mcnemar)}</td>
      <td class="${c.p_holm < 0.05 ? (c.net_b_minus_a > 0 ? 'up' : 'down') : ''}">${pFmt(c.p_holm)}</td>
      <td>${signed(s.net_b_minus_a)}</td><td>${pFmt(s.p_holm)}</td>
      <td>${p.judge_comparable ? '같음' : '다름'}</td></tr>`;
  }).join('\n');

  const inline = (svg) => svg
    // 원래 폭 이상으로 늘리지 않는다(좁은 차트가 페이지 폭에 맞춰 과하게 커지지 않게).
    .replace(/ width="(\d+)" height="\d+"/, (m, w) => ` width="100%" height="auto" style="max-width:${w}px;margin:0 auto"`)
    .replace(/^\s+|\s+$/g, '');
  const figs = charts.map((svg) => `<figure>${inline(svg)}</figure>`).join('\n');

  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>프롬프트 비교 대시보드</title>
<style>
  :root { color-scheme: light dark; --page:#f9f9f7; --card:#fcfcfb; --ink:#0b0b0b; --ink2:#52514e; --line:#e1e0d9;
          --c-muted:#898781; --c-s1:#2a78d6; --c-s2:#eb6834; --c-s3:#1baf7a; --c-s4:#eda100; --hi:#1baf7a14; }
  @media (prefers-color-scheme: dark) {
    :root { --page:#0d0d0d; --card:#1a1a19; --ink:#ffffff; --ink2:#c3c2b7; --line:#2c2c2a;
            --c-s1:#3987e5; --c-s2:#d95926; --c-s3:#199e70; --c-s4:#c98500; --hi:#199e7026; }
  }
  * { box-sizing: border-box; }
  body { margin:0; padding:24px 16px 56px; background:var(--page); color:var(--ink);
         font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans KR','Malgun Gothic',sans-serif; }
  .wrap { max-width:1060px; margin:0 auto; }
  h1 { font-size:24px; margin:0 0 6px; }
  h2 { font-size:18px; margin:0 0 10px; }
  h3 { font-size:15px; margin:0 0 10px; }
  .meta { color:var(--ink2); font-size:13px; margin:0 0 22px; line-height:1.6; }
  .card, figure { margin:0 0 22px; padding:14px 16px; background:var(--card);
           border:1px solid var(--line); border-radius:12px; }
  figure { padding:10px; overflow:hidden; }
  figure svg { display:block; width:100%; height:auto; }
  .lead ul { margin:0; padding-left:20px; line-height:1.75; font-size:14px; }
  .eyebrow { margin:0 0 4px; font-size:12px; color:var(--ink2); font-weight:600; }
  .dot { display:inline-block; width:12px; height:12px; border-radius:50%; margin-right:8px; vertical-align:1px; }
  .rule { margin:10px 0 0; font-size:12px; color:var(--ink2); }
  .scroll { overflow-x:auto; }
  table { border-collapse:collapse; width:100%; font-size:12.5px; font-variant-numeric:tabular-nums; }
  th, td { padding:6px 5px; border-bottom:1px solid var(--line); text-align:right; white-space:nowrap; }
  thead th { color:var(--ink2); font-weight:600; font-size:11.5px; }
  tbody th { text-align:left; font-weight:600; }
  tr.hi { background:var(--hi); }
  .ci { color:var(--ink2); font-size:11px; }
  .up { color:var(--c-s3); font-weight:700; } .down { color:var(--c-s2); font-weight:700; }
  .tbl-note { font-size:11.5px; color:var(--ink2); margin:8px 0 0; line-height:1.6; }
  footer { color:var(--ink2); font-size:12px; margin-top:28px; line-height:1.7; }
  code { font-size:11.5px; }
  #tip { position:fixed; pointer-events:none; z-index:10; display:none; max-width:320px;
         padding:8px 10px; border-radius:8px; font-size:12.5px; line-height:1.5; white-space:pre-line;
         background:var(--ink); color:var(--page); box-shadow:0 4px 14px #0003; }
</style></head>
<body><div class="wrap">
<h1>프롬프트 비교 — ${esc(stats.model)}</h1>
<p class="meta">생성 시각 ${new Date().toISOString()} · 출처 <code>results/${suite}/${path.basename(stats.__file || 'prompt_stats.json')}</code><br>
모델 고정, 시스템 프롬프트만 변경 · temperature 0 · 추론 끔 · 고유 300문항 · 대조군 ${B0}는 <code>${esc(stats.runs[BASE].runId)}</code></p>
${summary}
<section class="card">
  <h3>전체 비교</h3>
  <div class="scroll"><table>
    <thead><tr><th></th><th>내용 정확도(AI) [95% CI]</th><th>정답·무환각</th><th>근거율(AI)</th><th>기대 상태 일치</th><th>부재 F1</th>
      <th>답할 문항 정답</th><th>막을 문항 정답</th><th>과잉 보류</th><th>과잉 답변</th><th>환각 답변</th><th>표현 /5</th>
      <th>평균 지연</th><th>P95</th><th>입력 토큰</th></tr></thead>
    <tbody>${t1}</tbody>
  </table></div>
  <p class="tbl-note">답할 문항 = 기대 상태 답변·부분 답변(${stats.two_axis[BASE].answerable.n}문항), 막을 문항 = 보류·확인 요청·범위 밖·충돌 고지(${stats.two_axis[BASE].should_hold.n}문항).
    과잉 보류 = 답할 문항을 보류·확인·범위 밖으로 뺀 수, 과잉 답변 = 막을 문항에 답변·부분 답변을 낸 수. 정답·무환각 = 정답이면서 실질적 환각 없음(계획서 주지표).<br>
    ${latencyNote}</p>
</section>
<section class="card">
  <h3>같은 문항 짝 비교 (McNemar 정확검정)</h3>
  <div class="scroll"><table>
    <thead><tr><th>A → B</th><th>A만 정답</th><th>B만 정답</th><th>순증</th><th>p</th><th>p (Holm)</th>
      <th>상태 일치 순증</th><th>상태 p (Holm)</th><th>Judge 설정</th></tr></thead>
    <tbody>${t2}</tbody>
  </table></div>
  <p class="tbl-note">순증 = B만 정답 − A만 정답(문항 수). Holm은 지표별 ${stats.paired.length}쌍 다중 비교 보정. 300문항에서 1문항 ≈ 0.3%p.<br>
    ${judgeNote}</p>
</section>
${figs}
<footer>
  다시 만들기: <code>node scripts/prompt_test/round1/prompt_stats.js --model ${esc(stats.model)} --date &lt;날짜&gt;</code> →
  <code>node scripts/prompt_test/round1/prompt_charts.js --model ${esc(stats.model)} --date &lt;날짜&gt;</code><br>
  차트 원본 SVG는 <code>results/${suite}/charts/</code>, 표 원문은 <code>results/${suite}/prompt_test_*.md</code>.
</footer>
</div>
<div id="tip" role="tooltip"></div>
<script>
// 차트의 data-tip 요소에 즉시 뜨는 툴팁. 브라우저 기본 툴팁(<title>)과 겹치지 않게 title은 치운다.
(function () {
  var tip = document.getElementById('tip');
  document.querySelectorAll('[data-tip]').forEach(function (el) {
    var t = el.querySelector('title'); if (t) t.remove();
    el.addEventListener('mouseenter', function () { tip.textContent = el.getAttribute('data-tip'); tip.style.display = 'block'; });
    el.addEventListener('mousemove', function (e) {
      var x = e.clientX + 14, y = e.clientY + 14, w = tip.offsetWidth, h = tip.offsetHeight;
      if (x + w > innerWidth - 8) x = e.clientX - w - 14;
      if (y + h > innerHeight - 8) y = e.clientY - h - 14;
      tip.style.left = x + 'px'; tip.style.top = y + 'px';
    });
    el.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
  });
})();
</script>
</body></html>
`;
}

// ---------------------------------------------------------------- 출력

function main() {
  const argv = process.argv.slice(2);
  const get = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
  const model = get('--model', 'qwen3:14b');
  const date = get('--date', null);
  if (!date) throw new Error('--date가 필요합니다 (예: 20260922)');
  const suite = SUITE;
  const slug = sanitizeTag(model);
  const statsPath = path.join(ROOT, 'results', suite, `prompt_stats_${slug}_${date}.json`);
  if (!fs.existsSync(statsPath)) throw new Error(`통계 파일이 없습니다. 먼저 prompt_stats.js를 실행하세요: ${statsPath}`);
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  stats.__file = path.basename(statsPath);
  setVariants(stats);
  // 유형별 차트(③④)의 비교 상대 = 후보 규칙이 고른 안.
  const focus = pickCandidate(stats);

  const outDir = path.join(ROOT, 'results', suite, 'charts');
  fs.mkdirSync(outDir, { recursive: true });
  const charts = {
    'prompt_two_axis.svg': twoAxisSvg(stats),
    'prompt_gain_loss.svg': gainLossSvg(stats),
    'prompt_by_type.svg': byTypeSvg(stats, BASE, focus),
    'prompt_head_to_head.svg': headToHeadSvg(stats, BASE, focus),
  };
  for (const [name, svg] of Object.entries(charts)) {
    fs.writeFileSync(path.join(outDir, name), svg, 'utf8');
    console.log(`차트 저장: ${path.relative(ROOT, path.join(outDir, name))}`);
  }
  const dash = path.join(ROOT, 'results', suite, 'dashboard.html');
  fs.writeFileSync(dash, dashboardHtml(stats, Object.values(charts), suite), 'utf8');
  console.log(`대시보드 저장: ${path.relative(ROOT, dash)}`);
}

main();
