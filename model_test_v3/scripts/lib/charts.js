'use strict';
// round_comparison.json 하나만 읽어 발표용 SVG를 만든다.
// 원본 jsonl이나 생성된 문서를 다시 읽지 않는다 — 그래야 다음 라운드에서
// 스키마만 같으면 코드 변경 없이 그대로 돈다.
//
// npm 의존성 0 규칙을 지켜 SVG를 문자열로 조립한다. 각 SVG는 자체 <style>에
// light/dark 토큰을 함께 담아, 마크다운에 <img>로 실려도 테마를 따라간다.
//
// 색은 dataviz 기준 팔레트를 쓴다(검증 완료):
//   계열 1~4  #2a78d6 #eb6834 #1baf7a #eda100  (dark: #3987e5 #d95926 #199e70 #c98500)
//   파레토 산점도는 "프론티어 vs 지배당함"을 색 하나로만 나누지 않고
//   채움/빈 원 + 전 점 직접 라벨로 이중 인코딩한다.

const fs = require('fs');
const path = require('path');

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
`;

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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

const txt = (x, y, s, { cls = 'lbl', size = 12, anchor = 'start', weight = null, op = null } = {}) =>
  `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="${cls}" font-size="${size}"`
  + ` text-anchor="${anchor}"${weight ? ` font-weight="${weight}"` : ''}`
  + `${op != null ? ` opacity="${op}"` : ''}>${esc(s)}</text>`;

// 한글은 12px 폰트에서 대략 정폭 11.5px, ASCII는 6.3px — 라벨 상자 겹침 판정용 근사.
const textW = (str, size = 12) => [...String(str)]
  .reduce((w, ch) => w + (ch.charCodeAt(0) > 0x2000 ? size * 0.96 : size * 0.53), 0);

const pctS = (v, d = 1) => v == null ? '-' : (v * 100).toFixed(d) + '%';

// 표에서 쓰는 표기와 맞춘다 — 음수는 U+2212.
const signed = (v, d = 1, unit = '') =>
  (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(d) + unit;

// ---------------------------------------------------------------- 데이터 평탄화

// cmp.models -> 조건별 설정 목록. llm_judge가 없는 조건은 건너뛴다
// (아직 판정 전인 라운드가 섞여 있어도 죽지 않아야 한다).
function settings(cmp) {
  const out = [];
  for (const m of cmp.models) {
    const push = (r, suffix) => {
      if (!r || !r.llm_judge || r.llm_judge.correct_rate == null) return;
      out.push({
        model: m.model_tag,
        label: m.model_tag + suffix,
        tier: m.tier,
        acc: r.llm_judge.correct_rate,
        n: r.llm_judge.n_scored,
        grounded: r.llm_judge.is_grounded_rate,
        p95: r.latency_p95_ms == null ? null : r.latency_p95_ms / 1000,
        avg: r.latency_avg_ms == null ? null : r.latency_avg_ms / 1000,
        vram: r.vram_mib ? r.vram_mib.avg : null,
        status: r.status_match,
        repeat: r.repeat ? r.repeat.overall : null,
        format: r.format_success_rate,
      });
    };
    push(m.test3_think, m.think_capable ? ' ON' : '');
    push(m.test3_nothink, ' OFF');
  }
  return out.filter((s) => s.p95 != null);
}

// P95 최소 · 정답률 최대 기준 파레토 프론티어.
function paretoFront(pts) {
  const sorted = pts.slice().sort((a, b) => a.p95 - b.p95);
  const front = [];
  let best = -Infinity;
  for (const p of sorted) if (p.acc > best) { front.push(p); best = p.acc; }
  return front;
}

// 지배당한 점마다 "누구에게 지는지"를 찾는다(더 빠르면서 더 정확한 설정).
function dominators(p, front) {
  return front.filter((f) => f.p95 <= p.p95 && f.acc >= p.acc && f !== p);
}


// 라벨 상자가 장애물(점·다른 라벨·주석)과 겹치지 않는 첫 자리를 찾는다.
// 좌/우 × 세로 오프셋을 순서대로 시도하고, 전부 막히면 오른쪽 기본 자리로 둔다.
// 찾은 상자는 obstacles에 추가된다 — 다음 라벨의 장애물이 된다.
function placeLabel(obstacles, { x, y, r, w, lines = 2, bounds, offsets, sides = [1, -1] }) {
  const hits = (bx) => obstacles.some((q) =>
    bx.x0 < q.x1 && bx.x1 > q.x0 && bx.y0 < q.y1 && bx.y1 > q.y0);
  const bottom = lines === 2 ? 19 : 5;
  let best = null;
  outer:
  for (const side of sides) {
    for (const dy of offsets) {
      const tx = side === 1 ? x + r + 8 : x - r - 8;
      const x0 = side === 1 ? tx : tx - w, x1 = x0 + w;
      const ty = y + 4 + dy;
      const box = { x0: x0 - 3, x1: x1 + 3, y0: ty - 12, y1: ty + bottom };
      if (x0 < bounds.x0 || x1 > bounds.x1) continue;
      if (box.y0 < bounds.y0 || box.y1 > bounds.y1) continue;
      if (hits(box)) continue;
      best = { tx, ty, side, box };
      break outer;
    }
  }
  if (!best) { const tx = x + r + 8, ty = y + 4;
    best = { tx, ty, side: 1, box: { x0: tx - 3, x1: tx + w + 3, y0: ty - 12, y1: ty + bottom } }; }
  obstacles.push(best.box);
  return best;
}

// ---------------------------------------------------------------- ① 파레토

const TARGET_P95 = 5; // 상담봇 실용 한계선(초) — 문서의 해석 기준과 같은 값

function paretoSvg(cmp) {
  const pts = settings(cmp);
  if (pts.length < 2) return null;
  const W = 1020, H = 600;
  const M = { l: 62, r: 30, t: 78, b: 70 };
  const iw = W - M.l - M.r, ih = H - M.t - M.b;

  const lo = Math.min(...pts.map((p) => p.p95)) * 0.8;
  const hi = Math.max(...pts.map((p) => p.p95)) * 1.25;
  const lx = (v) => M.l + (Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo)) * iw;

  const accLo = 0.15, accHi = 0.82;
  const ly = (v) => M.t + ih - (v - accLo) / (accHi - accLo) * ih;

  const vmax = Math.max(...pts.map((p) => p.vram || 0)) || 1;
  const rad = (v) => 5 + Math.sqrt((v || 0) / vmax) * 9;

  const front = paretoFront(pts);
  const inFront = new Set(front);
  const b = [];

  b.push(txt(M.l - 34, 30, '지연 대비 정확도 — 파레토 프론티어', { cls: 'ttl', size: 19 }));
  b.push(txt(M.l - 34, 52,
    'x축 P95 지연(로그) · y축 LLM Judge 정답률 · 원 크기 VRAM. 선 위의 설정은 "더 빠르면서 더 정확한 대안이 없는" 설정이다.',
    { cls: 'sub', size: 12.5 }));

  // 격자 + 축
  for (let a = 0.2; a <= 0.8001; a += 0.1) {
    const y = ly(a);
    b.push(`<line class="grid" x1="${M.l}" y1="${y.toFixed(1)}" x2="${M.l + iw}" y2="${y.toFixed(1)}"/>`);
    b.push(txt(M.l - 10, y + 4, (a * 100).toFixed(0) + '%', { cls: 'axl', size: 11, anchor: 'end' }));
  }
  for (const t of [1.5, 2, 3, 5, 8, 10, 20, 30, 50]) {
    if (t < lo || t > hi) continue;
    const x = lx(t);
    b.push(`<line class="grid" x1="${x.toFixed(1)}" y1="${M.t}" x2="${x.toFixed(1)}" y2="${M.t + ih}"/>`);
    b.push(txt(x, M.t + ih + 18, t + 's', { cls: 'axl', size: 11, anchor: 'middle' }));
  }
  b.push(`<line class="axis" x1="${M.l}" y1="${M.t + ih}" x2="${M.l + iw}" y2="${M.t + ih}"/>`);

  // 목표선
  const tx = lx(TARGET_P95);
  b.push(`<line x1="${tx.toFixed(1)}" y1="${M.t - 6}" x2="${tx.toFixed(1)}" y2="${M.t + ih}"`
    + ` stroke="var(--s2)" stroke-width="2" stroke-dasharray="5 4" opacity="0.75"/>`);
  b.push(txt(tx + 6, M.t + 4, '상담봇 목표 P95 5초', { cls: 'sub', size: 11.5, weight: 600 }));

  // 프론티어 계단선
  const step = [];
  front.forEach((p, i) => {
    if (i === 0) step.push(`M ${lx(p.p95).toFixed(1)} ${ly(p.acc).toFixed(1)}`);
    else step.push(`L ${lx(p.p95).toFixed(1)} ${ly(front[i - 1].acc).toFixed(1)}`
      + ` L ${lx(p.p95).toFixed(1)} ${ly(p.acc).toFixed(1)}`);
  });
  b.push(`<path d="${step.join(' ')}" fill="none" stroke="var(--s1)" stroke-width="2"`
    + ` stroke-linejoin="round" opacity="0.5"/>`);

  // 점 + 라벨. 라벨 상자가 겹치지 않는 첫 후보 자리에 놓는다
  // (좌/우 × 세로 오프셋). 겹침을 눈으로 잡는 대신 계산으로 잡는다.
  // 점 자체도 장애물로 먼저 깔아둔다 — 라벨이 다른 점 위에 얹히면 안 된다.
  const boxes = pts.map((q) => {
    const qx = lx(q.p95), qy = ly(q.acc), qr = rad(q.vram) + 3;
    return { x0: qx - qr, x1: qx + qr, y0: qy - qr, y1: qy + qr };
  });
  const ordered = pts.slice().sort((a, p) => p.acc - a.acc);
  const marks = [];
  for (const p of ordered) {
    const x = lx(p.p95), y = ly(p.acc), r = rad(p.vram);
    const front_ = inFront.has(p);
    marks.push(front_
      ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="var(--s1)" stroke="var(--surface)" stroke-width="2"/>`
      : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="var(--surface)" stroke="var(--muted)" stroke-width="2"/>`);

    const sub = `${pctS(p.acc)} · 환각 ${pctS(1 - p.grounded)}`;
    const w = Math.max(textW(p.label, 12), textW(sub, 10.5));
    const best = placeLabel(boxes, { x, y, r, w,
      bounds: { x0: M.l + 2, x1: M.l + iw - 2, y0: M.t - 4, y1: M.t + ih + 2 },
      offsets: [0, -26, 26, -46, 46, -68, 68, -92, 92] });
    // 라벨이 점에서 떨어졌으면 가는 실선으로 이어준다
    if (Math.abs(best.ty - (y + 4)) > 14) {
      const ax = best.side === 1 ? best.tx - 4 : best.tx + 4;
      marks.push(`<line x1="${(x + best.side * (r + 2)).toFixed(1)}" y1="${y.toFixed(1)}"`
        + ` x2="${ax.toFixed(1)}" y2="${(best.ty - 4).toFixed(1)}" stroke="var(--axis)" stroke-width="1"/>`);
    }
    const anchor = best.side === 1 ? 'start' : 'end';
    marks.push(txt(best.tx, best.ty, p.label,
      { cls: front_ ? 'lbl' : 'note', size: 12, anchor, weight: front_ ? 700 : 400 }));
    marks.push(txt(best.tx, best.ty + 14, sub,
      { cls: 'note', size: 10.5, anchor, op: front_ ? 0.95 : 0.7 }));
  }
  b.push(marks.join('\n'));

  // 범례 + 지배 관계 주석
  const ly0 = H - 34;
  b.push(`<circle cx="${M.l + 6}" cy="${ly0 - 4}" r="6" fill="var(--s1)"/>`);
  b.push(txt(M.l + 18, ly0, '파레토 프론티어 (대안 없음)', { cls: 'sub', size: 11.5 }));
  b.push(`<circle cx="${M.l + 206}" cy="${ly0 - 4}" r="6" fill="var(--surface)" stroke="var(--muted)" stroke-width="2"/>`);
  b.push(txt(M.l + 218, ly0, '지배당함 (더 빠르고 더 정확한 대안이 있음)', { cls: 'sub', size: 11.5 }));

  const worst = pts.filter((p) => !inFront.has(p)).sort((a, c) => c.p95 - a.p95)[0];
  if (worst) {
    const d = dominators(worst, front)[0];
    if (d) {
      b.push(txt(M.l, H - 12,
        `예: ${worst.label}(${pctS(worst.acc)}, ${worst.p95.toFixed(2)}s)는 ${d.label}(${pctS(d.acc)}, ${d.p95.toFixed(2)}s)에게 속도·정확도 모두 뒤진다.`,
        { cls: 'note', size: 11 }));
    }
  }
  return svgDoc(W, H, b.join('\n'), '지연 대비 정확도 파레토 프론티어');
}

// ---------------------------------------------------------------- ② 한계 효율

function marginalEfficiencySvg(cmp) {
  const front = paretoFront(settings(cmp));
  if (front.length < 3) return null;
  const segs = [];
  for (let i = 1; i < front.length; i++) {
    const a = front[i - 1], c = front[i];
    const dAcc = (c.acc - a.acc) * 100, dT = c.p95 - a.p95;
    if (dT <= 0) continue;
    segs.push({ from: a, to: c, dAcc, dT, eff: dAcc / dT });
  }
  if (!segs.length) return null;

  const W = 980, H = 152 + segs.length * 54;
  const M = { l: 262, r: 196, t: 78, b: 44 };
  const iw = W - M.l - M.r;
  // 지연 차가 0.2초도 안 되는 구간은 효율이 발산해 막대 스케일을 망친다.
  // 값은 그대로 쓰되 막대만 잘라 표시하고 이유를 각주로 남긴다(정직한 축).
  const MEANINGFUL_DT = 0.2;
  const solid = segs.filter((g) => g.dT >= MEANINGFUL_DT).map((g) => g.eff);
  const max = (solid.length ? Math.max(...solid) : Math.max(...segs.map((g) => g.eff))) * 1.08;
  const bw = (v) => Math.max(2, Math.min(v, max) / max * iw);
  const clipped = segs.filter((g) => g.eff > max);
  const b = [];

  b.push(txt(28, 30, '지연 1초를 더 쓸 때 얻는 정답률 — 프론티어 구간별 한계 효율', { cls: 'ttl', size: 19 }));
  b.push(txt(28, 52,
    '프론티어를 따라 한 칸 올라갈 때의 정답률 증가를 추가 지연으로 나눈 값. 값이 급락하는 지점이 "무릎"이다.',
    { cls: 'sub', size: 12.5 }));

  // 가장 효율이 낮은 마지막 구간을 무릎으로 본다
  const kneeIdx = segs.length - 1;
  segs.forEach((s, i) => {
    const y = M.t + i * 54;
    const knee = i === kneeIdx;
    b.push(txt(M.l - 12, y + 15, `${s.from.label} → ${s.to.label}`, {
      cls: 'lbl', size: 12.5, anchor: 'end', weight: knee ? 400 : 700,
    }));
    b.push(txt(M.l - 12, y + 31, `${signed(s.dAcc)}p / ${signed(s.dT, 2, 's')}`, {
      cls: 'note', size: 11, anchor: 'end',
    }));
    const isClip = s.eff > max;
    b.push(`<rect x="${M.l}" y="${y}" width="${bw(s.eff).toFixed(1)}" height="26" rx="4"`
      + ` fill="var(--s1)" opacity="${knee ? 0.35 : isClip ? 0.45 : 1}"/>`);
    if (isClip) {
      const ex = M.l + bw(s.eff);
      b.push(`<path d="M ${(ex - 10).toFixed(1)} ${y} l 10 13 l -10 13" fill="none"`
        + ` stroke="var(--surface)" stroke-width="3"/>`);
    }
    b.push(txt(M.l + bw(s.eff) + 12, y + 18,
      s.eff.toFixed(2) + ' %p/초' + (isClip ? '  (잘림)' : ''), {
      cls: isClip ? 'note' : 'lbl', size: 12.5, weight: isClip ? 400 : 700,
    }));
  });

  if (clipped.length) {
    b.push(txt(28, H - 34,
      `${clipped.map((g) => `${g.from.label} → ${g.to.label}`).join(', ')} 구간은 지연 차가 ${clipped[0].dT.toFixed(2)}초뿐이라`
      + ` 나눈 값이 발산한다 — 막대를 잘라 표시했고, 해석에 쓰지 않는다.`,
      { cls: 'note', size: 11.5 }));
  }
  const best = segs[kneeIdx - 1], knee = segs[kneeIdx];
  if (best && knee && knee.eff > 0) {
    b.push(txt(28, H - 14,
      `${best.to.label}까지는 1초당 ${best.eff.toFixed(2)}%p를 얻지만, 그 다음 구간은 ${knee.eff.toFixed(2)}%p다`
      + ` — 효율이 ${(best.eff / knee.eff).toFixed(0)}배 떨어진다. ${best.to.label}가 곡선의 무릎이다.`,
      { cls: 'note', size: 12 }));
  }
  return svgDoc(W, H, b.join('\n'), '프론티어 구간별 한계 효율');
}

// ---------------------------------------------------------------- ②-b 기준선

// 프론티어에서 곡선이 가장 크게 꺾이는 점 — 양 끝을 잇는 직선에서 위로 가장
// 멀리 튀어나온 점(Kneedle). x는 선형: 사용자가 체감하는 대기 시간은 선형이다.
function kneePoint(front) {
  if (front.length < 3) return null;
  const a = front[0], z = front[front.length - 1];
  if (z.acc === a.acc || z.p95 === a.p95) return null;
  let best = null, bv = -Infinity;
  for (const p of front) {
    const v = (p.acc - a.acc) / (z.acc - a.acc) - (p.p95 - a.p95) / (z.p95 - a.p95);
    if (v > bv) { bv = v; best = p; }
  }
  return best;
}

// 두 정답률 차이가 채점 문항 수에 비해 우연으로 설명되지 않는 크기인가
// (양측 5%, 비대응 — 문항별 판정 없이 round_comparison.json만으로 계산).
function distinguishable(a, b) {
  if (!a.n || !b.n) return null;
  const se = Math.sqrt(a.acc * (1 - a.acc) / a.n + b.acc * (1 - b.acc) / b.n);
  return Math.abs(b.acc - a.acc) / se >= 1.96;
}

function speedQualitySvg(cmp, { keep = [] } = {}) {
  const pts = settings(cmp);
  const front = paretoFront(pts);
  const knee = kneePoint(front);
  if (!knee) return null;
  const ki = front.indexOf(knee);
  const kept = pts.filter((p) => keep.includes(p.label));
  const bandLo = kept.length ? Math.min(...kept.map((p) => p.p95)) : knee.p95;
  const bandHi = kept.length ? Math.max(...kept.map((p) => p.p95)) : knee.p95;
  // 왼쪽 비교 기준: 선택 구간 직전의 프론티어 점. 오른쪽: 무릎 바로 다음 프론티어 점.
  const L = front.filter((p) => p.p95 < bandLo).pop() || null;
  const R = front[ki + 1] || null;

  const W = 1200, H = 675;
  const M = { l: 72, r: 44, t: 120, b: 100 };
  const iw = W - M.l - M.r, ih = H - M.t - M.b;
  // x축은 프론티어 끝점까지만 그린다(5초 단위 올림). 그보다 느린 설정은 오른쪽 끝에
  // 붙이고 실제 값을 라벨에 적는다 — 한 점 때문에 나머지가 한쪽에 몰리지 않게.
  const xMax = Math.ceil(front[front.length - 1].p95 * 1.04 / 5) * 5;
  const x = (v) => M.l + Math.min(v, xMax) / xMax * iw;
  const clipped = (p) => p.p95 > xMax;
  const accLo = Math.floor((Math.min(...pts.map((p) => p.acc)) - 0.06) * 20) / 20;
  const accHi = Math.ceil((Math.max(...pts.map((p) => p.acc)) + 0.12) * 20) / 20;
  const y = (v) => M.t + ih - (v - accLo) / (accHi - accLo) * ih;
  const s1 = (v) => v.toFixed(1);
  const b = [];
  const obstacles = [];

  b.push(txt(M.l - 40, 38, `속도 대비 정답률 — ${s1(knee.p95)}초에서 곡선이 꺾인다`, { cls: 'ttl', size: 22 }));
  b.push(txt(M.l - 40, 64,
    '파란 선 = 응답 시간(P95)이 그 시간 이내인 설정 중 가장 높은 정답률. 선이 오르는 동안은 기다린 만큼 얻고, 평평해지면 기다려도 얻는 게 없다.',
    { cls: 'sub', size: 13 }));

  // 구간 배경: 왼쪽(오르는 구간) 옅게, 선택 구간 진하게
  b.push(`<rect x="${s1(M.l)}" y="${M.t}" width="${s1(x(knee.p95) - M.l)}" height="${ih}" fill="var(--s1)" opacity="0.06"/>`);
  const bx0 = x(bandLo) - 7, bx1 = x(bandHi) + 7;
  b.push(`<rect x="${s1(bx0)}" y="${M.t}" width="${s1(bx1 - bx0)}" height="${ih}" fill="var(--s1)" opacity="0.16"/>`);

  // 격자 + 축
  const yStep = 0.1;
  for (let a = Math.ceil(accLo / yStep) * yStep; a <= accHi + 1e-9; a += yStep) {
    const yy = y(a);
    b.push(`<line class="grid" x1="${M.l}" y1="${s1(yy)}" x2="${M.l + iw}" y2="${s1(yy)}"/>`);
    b.push(txt(M.l - 10, yy + 4, (a * 100).toFixed(0) + '%', { cls: 'axl', size: 12, anchor: 'end' }));
  }
  for (let t = 0; t <= xMax; t += 5) {
    const xx = x(t);
    b.push(`<line class="grid" x1="${s1(xx)}" y1="${M.t}" x2="${s1(xx)}" y2="${M.t + ih}"/>`);
    b.push(txt(xx, M.t + ih + 20, t + '초', { cls: 'axl', size: 12, anchor: 'middle' }));
  }
  b.push(`<line class="axis" x1="${M.l}" y1="${M.t + ih}" x2="${M.l + iw}" y2="${M.t + ih}"/>`);
  b.push(txt(M.l + iw, M.t + ih + 42, 'P95 응답 시간 — 느린 쪽 5% 답변이 걸린 시간 →', { cls: 'axl', size: 12, anchor: 'end' }));
  b.push(txt(M.l - 40, M.t - 14, '정답률 (LLM Judge)', { cls: 'axl', size: 12 }));

  // 기준선
  const kx = x(knee.p95);
  b.push(`<line x1="${s1(kx)}" y1="${M.t - 30}" x2="${s1(kx)}" y2="${M.t + ih}" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.75"/>`);
  const keepTxt = kept.length ? `선택: ${kept.map((p) => p.label).join(' · ')}` : knee.label;
  b.push(txt(kx + 8, M.t - 32, `기준선 ${s1(knee.p95)}초`, { weight: 700, size: 14 }));
  b.push(txt(kx + 8 + textW(`기준선 ${s1(knee.p95)}초`, 14) + 10, M.t - 32, keepTxt, { cls: 'sub', size: 13 }));
  obstacles.push({ x0: kx - 3, x1: kx + 3, y0: M.t, y1: M.t + ih });

  // 구간 설명 (숫자는 전부 데이터에서 계산)
  const zone = (x0, y0, lines) => {
    let yy = y0;
    for (const [s, o] of lines) {
      b.push(txt(x0, yy, s, o));
      const w = textW(s, o.size);
      obstacles.push({ x0: x0 - 3, x1: x0 + w + 3, y0: yy - o.size, y1: yy + 5 });
      yy += o.size + 8;
    }
  };
  if (L) {
    const dt = knee.p95 - L.p95, da = knee.acc - L.acc;
    zone(M.l + 12, M.t + 26, [
      ['① 기다린 만큼 오른다', { weight: 700, size: 15 }],
      [`${s1(dt)}초 더 기다리면`, { cls: 'sub', size: 13 }],
      [`정답률 ${signed(da * 100, 1, '%p')}`, { weight: 700, size: 20 }],
      [`${s1(L.p95)}초 ${pctS(L.acc)} → ${s1(knee.p95)}초 ${pctS(knee.acc)}`, { cls: 'note', size: 11 }],
    ]);
  }
  if (R) {
    const dt = R.p95 - knee.p95, da = R.acc - knee.acc;
    const same = distinguishable(knee, R) === false;
    const lines = [
      ['② 기다려도 거의 안 오른다', { weight: 700, size: 15 }],
      [`${s1(dt)}초 더 기다려도`, { cls: 'sub', size: 13 }],
      [`정답률 ${signed(da * 100, 1, '%p')}`, { weight: 700, size: 20 }],
      [`${s1(knee.p95)}초 ${pctS(knee.acc)} → ${s1(R.p95)}초 ${pctS(R.acc)}`, { cls: 'note', size: 11 }],
    ];
    if (same) lines.push([`${knee.n}문제 기준으로는 우연과 구분되지 않는 차이`, { cls: 'note', size: 11 }]);
    zone(bx1 + 28, y(knee.acc) + 40, lines);
  }

  // 계단선: 그 시간 안에서 얻을 수 있는 최고 정답률. 마지막 높이는 오른쪽 끝까지 잇는다.
  const d = [];
  front.forEach((p, i) => {
    if (i === 0) d.push(`M ${s1(x(p.p95))} ${s1(y(p.acc))}`);
    else d.push(`L ${s1(x(p.p95))} ${s1(y(front[i - 1].acc))} L ${s1(x(p.p95))} ${s1(y(p.acc))}`);
    const x1 = i + 1 < front.length ? x(front[i + 1].p95) : M.l + iw;
    obstacles.push({ x0: x(p.p95), x1, y0: y(p.acc) - 2, y1: y(p.acc) + 2 });
    if (i) obstacles.push({ x0: x(p.p95) - 2, x1: x(p.p95) + 2, y0: y(p.acc), y1: y(front[i - 1].acc) });
  });
  d.push(`L ${s1(M.l + iw)} ${s1(y(front[front.length - 1].acc))}`);
  b.push(`<path d="${d.join(' ')}" fill="none" stroke="var(--s1)" stroke-width="2.5" stroke-linejoin="round"/>`);

  // 점 — 장애물로 먼저 깐 뒤, 선택 → 프론티어 → 나머지 순으로 라벨을 놓는다
  const inFront = new Set(front), isKept = new Set(kept);
  const rad = (p) => (isKept.has(p) ? 8 : inFront.has(p) ? 6 : 5);
  for (const p of pts) {
    const r = rad(p) + 3;
    obstacles.push({ x0: x(p.p95) - r, x1: x(p.p95) + r, y0: y(p.acc) - r, y1: y(p.acc) + r });
  }
  const rankOf = (p) => (isKept.has(p) ? 0 : inFront.has(p) ? 1 : 2);
  const ordered = pts.slice().sort((a, c) => rankOf(a) - rankOf(c) || c.acc - a.acc);
  const dots = [], labels = [];
  const bounds = { x0: M.l + 4, x1: M.l + iw - 4, y0: M.t + 2, y1: M.t + ih - 2 };
  for (const p of ordered) {
    const px = x(p.p95), py = y(p.acc), r = rad(p);
    const tip = `<title>${esc(`${p.label} — 정답률 ${pctS(p.acc)}, P95 ${p.p95.toFixed(2)}초`)}</title>`;
    if (isKept.has(p)) {
      dots.push(`<circle cx="${s1(px)}" cy="${s1(py)}" r="${r}" fill="var(--s1)" stroke="var(--ink)" stroke-width="2.5">${tip}</circle>`);
    } else if (inFront.has(p)) {
      dots.push(`<circle cx="${s1(px)}" cy="${s1(py)}" r="${r}" fill="var(--s1)" stroke="var(--surface)" stroke-width="2">${tip}</circle>`);
    } else {
      dots.push(`<circle cx="${s1(px)}" cy="${s1(py)}" r="${r}" fill="var(--surface)" stroke="var(--muted)" stroke-width="2">${tip}</circle>`);
    }
    const main = rankOf(p) < 2;
    const sub = `${pctS(p.acc)} · ${s1(p.p95)}초`;
    const name = clipped(p) ? `${p.label} (${s1(p.p95)}초 →)` : p.label;
    const w = main ? Math.max(textW(name, 13), textW(sub, 11)) : textW(name, 11);
    const at = placeLabel(obstacles, { x: px, y: py, r, w, lines: main ? 2 : 1, bounds,
      offsets: [0, -22, 22, -40, 40, -60, 60, -82, 82, -106, 106, -132, 132] });
    if (Math.abs(at.ty - (py + 4)) > 14) {
      const ax = at.side === 1 ? at.tx - 4 : at.tx + 4;
      labels.push(`<line x1="${s1(px + at.side * (r + 2))}" y1="${s1(py)}" x2="${s1(ax)}" y2="${s1(at.ty - 4)}" stroke="var(--axis)" stroke-width="1"/>`);
    }
    const anchor = at.side === 1 ? 'start' : 'end';
    if (main) {
      labels.push(txt(at.tx, at.ty, name, { size: 13, anchor, weight: isKept.has(p) ? 700 : 600 }));
      labels.push(txt(at.tx, at.ty + 15, sub, { cls: 'note', size: 11, anchor }));
    } else {
      labels.push(txt(at.tx, at.ty, name, { cls: 'note', size: 11, anchor, op: 0.85 }));
    }
  }
  b.push(labels.join('\n'));
  b.push(dots.join('\n'));

  // 범례
  const gy = H - 26;
  let gx = M.l - 40;
  const item = (mark, label) => {
    b.push(mark(gx));
    b.push(txt(gx + 26, gy + 4, label, { cls: 'sub', size: 12 }));
    gx += 26 + textW(label, 12) + 28;
  };
  item((g) => `<line x1="${g}" y1="${gy}" x2="${g + 18}" y2="${gy}" stroke="var(--s1)" stroke-width="2.5"/>`, '그 시간 안에서 얻을 수 있는 최고 정답률');
  item((g) => `<circle cx="${g + 9}" cy="${gy}" r="7" fill="var(--s1)" stroke="var(--ink)" stroke-width="2.5"/>`, '선택한 두 설정');
  item((g) => `<circle cx="${g + 9}" cy="${gy}" r="6" fill="var(--s1)"/>`, '더 빠르면서 더 정확한 대안이 없는 설정');
  item((g) => `<circle cx="${g + 9}" cy="${gy}" r="5" fill="var(--surface)" stroke="var(--muted)" stroke-width="2"/>`, '더 빠르고 더 정확한 대안이 있는 설정');

  return svgDoc(W, H, b.join('\n'), `속도 대비 정답률 — ${s1(knee.p95)}초 기준선`);
}

// ---------------------------------------------------------------- ③ 핵심 지표

const PANELS = [
  { key: 'acc', name: '내용 정확도 (AI)' },
  { key: 'grounded', name: '근거율 (1 − 환각률)' },
  { key: 'status', name: '기대 상태 일치' },
  { key: 'repeat', name: '반복 일관성' },
  { key: 'format', name: '포맷 성공률' },
];

function coreMetricsSvg(cmp) {
  // 본측정(ON/추론 없음)만 — 조건이 섞이면 모델 비교가 안 된다.
  const rows = cmp.models
    .map((m) => {
      const r = m.test3_think;
      if (!r || !r.llm_judge || r.llm_judge.correct_rate == null) return null;
      return {
        label: m.model_tag, acc: r.llm_judge.correct_rate,
        grounded: r.llm_judge.is_grounded_rate, status: r.status_match,
        repeat: r.repeat ? r.repeat.overall : null, format: r.format_success_rate,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.acc - a.acc);
  if (!rows.length) return null;

  const rowH = 26, padT = 36;
  const panelW = 172, gap = 18, labelW = 130;
  const W = labelW + PANELS.length * (panelW + gap) + 26;
  const H = 96 + padT + rows.length * rowH + 42;
  const b = [];

  b.push(txt(26, 32, 'test3 본측정 핵심 지표 — 7개 모델', { cls: 'ttl', size: 19 }));
  b.push(txt(26, 54,
    '모든 패널에서 모델 순서는 정확도 내림차순으로 같다 — 패널 간 순위가 어떻게 뒤집히는지 보기 위해서다. 모든 축은 0~100%.',
    { cls: 'sub', size: 12.5 }));

  const top = 96;
  rows.forEach((r, i) => {
    b.push(txt(labelW - 10, top + padT + i * rowH + 16, r.label,
      { cls: 'lbl', size: 12.5, anchor: 'end', weight: i === 0 ? 700 : 400 }));
  });

  PANELS.forEach((p, pi) => {
    const x0 = labelW + pi * (panelW + gap);
    b.push(txt(x0, top + 16, p.name, { cls: 'sub', size: 12, weight: 600 }));
    b.push(`<line class="axis" x1="${x0}" y1="${top + padT - 6}" x2="${x0}" y2="${top + padT + rows.length * rowH - 4}"/>`);
    rows.forEach((r, i) => {
      const v = r[p.key];
      const y = top + padT + i * rowH;
      if (v == null) { b.push(txt(x0 + 6, y + 16, '-', { cls: 'note', size: 11.5 })); return; }
      const w = Math.max(2, v * panelW);
      b.push(`<rect x="${x0}" y="${y}" width="${w.toFixed(1)}" height="18" rx="4" fill="var(--s1)"/>`);
      const inside = w > 54;
      b.push(txt(inside ? x0 + w - 7 : x0 + w + 6, y + 13.5, pctS(v),
        { cls: inside ? 'lbl' : 'note', size: 11, anchor: inside ? 'end' : 'start',
          weight: inside ? 700 : 400 }));
    });
  });
  b.push(txt(26, H - 16,
    '정확도·근거율은 LLM Judge 판정, 나머지 셋은 코드 기반 결정론 지표다. 두 방식의 모델 순위는 거의 같다.',
    { cls: 'note', size: 11.5 }));
  return svgDoc(W, H, b.join('\n'), 'test3 본측정 핵심 지표 비교');
}

// ---------------------------------------------------------------- ④ 추론 기울기

const SERIES = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)'];

function thinkSlopeSvg(cmp) {
  const paired = cmp.paired_thinking || [];
  if (!paired.length) return null;
  const byTag = new Map(cmp.models.map((m) => [m.model_tag, m]));
  const rows = paired.map((p) => {
    const m = byTag.get(p.model_tag);
    const on = m && m.test3_think, off = m && m.test3_nothink;
    return {
      label: p.model_tag,
      accOn: p.on && p.on.correct_rate, accOff: p.off && p.off.correct_rate,
      p95On: on && on.latency_p95_ms != null ? on.latency_p95_ms / 1000 : null,
      p95Off: off && off.latency_p95_ms != null ? off.latency_p95_ms / 1000 : null,
    };
  }).filter((r) => r.accOn != null && r.accOff != null);
  if (!rows.length) return null;

  const W = 960, H = 540;
  const pw = 268;
  const P1 = 172, P2 = 600;           // 두 패널의 왼쪽 축 x좌표
  const top = 142, ih = H - top - 92;
  const b = [];

  b.push(txt(28, 32, '추론 모드를 끄면 무엇을 잃는가 — Qwen3 계열', { cls: 'ttl', size: 19 }));
  b.push(txt(28, 54,
    '왼쪽은 잃는 것(정확도), 오른쪽은 얻는 것(P95 지연). 정확도는 두 조건 모두 채점된 동일 문항만 짝지은 값이다.',
    { cls: 'sub', size: 12.5 }));
  b.push(txt(28, 76,
    'qwen3:14b만 왼쪽 선이 거의 평평하면서 오른쪽은 급락한다 — 품질을 거의 안 잃고 속도만 얻는 유일한 모델.',
    { cls: 'sub', size: 12.5, weight: 600 }));

  // 한 패널 = ON→OFF 기울기. showName이면 왼쪽에 모델명을 같이 적는다
  // (오른쪽 패널은 색으로 이어지므로 값만 — 폭 경쟁을 줄인다).
  const panel = (x0, title, get, fmt, invert, showName, useLog) => {
    const vals = rows.flatMap((r) => [get(r).a, get(r).b]).filter((v) => v != null);
    // 지연은 1.4초~47.6초로 한 자릿수 이상 벌어져 선형 축에서는 느린 쪽만 보인다.
    // 로그 축을 쓰면 네 모델의 기울기를 모두 읽을 수 있다.
    const f = useLog ? Math.log10 : (v) => v;
    const min = f(Math.min(...vals)), max = f(Math.max(...vals));
    const pad = (max - min) * 0.16 || 1;
    const sy = (v) => invert
      ? top + (f(v) - (min - pad)) / ((max + pad) - (min - pad)) * ih
      : top + ih - (f(v) - (min - pad)) / ((max + pad) - (min - pad)) * ih;

    b.push(txt(x0, top - 28, title, { cls: 'sub', size: 13, weight: 600 }));
    b.push(`<line class="axis" x1="${x0}" y1="${top - 12}" x2="${x0}" y2="${top + ih + 12}"/>`);
    b.push(`<line class="axis" x1="${x0 + pw}" y1="${top - 12}" x2="${x0 + pw}" y2="${top + ih + 12}"/>`);
    b.push(txt(x0, top + ih + 34, 'ON', { cls: 'axl', size: 12, anchor: 'middle', weight: 600 }));
    b.push(txt(x0 + pw, top + ih + 34, 'OFF', { cls: 'axl', size: 12, anchor: 'middle', weight: 600 }));

    // 라벨 세로 충돌 회피 — 같은 쪽에서 13px 안으로 붙으면 밀어낸다.
    const spread = (items) => {
      const sorted = items.slice().sort((p, q) => p.y - q.y);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].y - sorted[i - 1].y < 15) sorted[i].y = sorted[i - 1].y + 15;
      }
      return items;
    };
    const L = [], R = [];
    rows.forEach((r, i) => {
      const a = get(r).a, c = get(r).b;
      if (a == null || c == null) return;
      L.push({ i, v: a, y: sy(a) + 4 });
      R.push({ i, v: c, y: sy(c) + 4 });
    });
    spread(L); spread(R);

    rows.forEach((r, i) => {
      const a = get(r).a, c = get(r).b;
      if (a == null || c == null) return;
      const col = SERIES[i % SERIES.length];
      const y1 = sy(a), y2 = sy(c);
      b.push(`<line x1="${x0}" y1="${y1.toFixed(1)}" x2="${x0 + pw}" y2="${y2.toFixed(1)}"`
        + ` stroke="${col}" stroke-width="2.5" stroke-linecap="round"/>`);
      for (const [xx, yy] of [[x0, y1], [x0 + pw, y2]]) {
        b.push(`<circle cx="${xx}" cy="${yy.toFixed(1)}" r="5" fill="${col}"`
          + ` stroke="var(--surface)" stroke-width="2"/>`);
      }
      const lt = L.find((p) => p.i === i), rt = R.find((p) => p.i === i);
      b.push(txt(x0 - 12, lt.y, showName ? `${r.label}  ${fmt(a)}` : fmt(a),
        { cls: 'lbl', size: 11.5, anchor: 'end' }));
      b.push(txt(x0 + pw + 12, rt.y, fmt(c), { cls: 'lbl', size: 11.5, weight: 700 }));
    });
  };

  panel(P1, '내용 정확도 — 낮아질수록 나쁘다',
    (r) => ({ a: r.accOn, b: r.accOff }), (v) => pctS(v), false, true);
  panel(P2, 'P95 지연 (로그) — 올라갈수록 빠르다',
    (r) => ({ a: r.p95On, b: r.p95Off }), (v) => v.toFixed(2) + 's', true, false, true);

  // 범례 — 오른쪽 패널은 모델명을 안 적으므로 색 식별을 여기서 보장한다.
  let lx0 = P1 - 22;
  rows.forEach((r, i) => {
    b.push(`<line x1="${lx0}" y1="${H - 44}" x2="${lx0 + 18}" y2="${H - 44}"`
      + ` stroke="${SERIES[i % SERIES.length]}" stroke-width="3" stroke-linecap="round"/>`);
    b.push(txt(lx0 + 24, H - 40, r.label, { cls: 'sub', size: 11.5 }));
    lx0 += 24 + textW(r.label, 11.5) + 26;
  });

  const best = rows.slice().sort((a, c) =>
    (c.accOff - c.accOn) - (a.accOff - a.accOn))[0];
  if (best) {
    b.push(txt(28, H - 16,
      `${best.label}: 정확도 ${signed((best.accOff - best.accOn) * 100)}p를 내주고`
      + ` P95를 ${best.p95On.toFixed(2)}초 → ${best.p95Off.toFixed(2)}초로 줄인다`
      + ` (${((1 - best.p95Off / best.p95On) * 100).toFixed(0)}% 단축).`,
      { cls: 'note', size: 12 }));
  }
  return svgDoc(W, H, b.join('\n'), '추론 모드 on/off 기울기 비교');
}

// ---------------------------------------------------------------- ⑤ 선별 생존율

// 탈락 시뮬레이션 생존율 막대. 0%로 떨어지는 "절벽"이 보이는 게 핵심이라
// 산점도가 아니라 막대로 그린다(축이 하나뿐인 값이다).
function survivalSvg(res, opts) {
  const list = Object.entries(res.rate).sort((a, b) => b[1] - a[1]);
  if (!list.length) return null;
  const W = 940, rowH = 30;
  const M = { l: 178, r: 96, t: 112, b: 58 };
  const iw = W - M.l - M.r;
  const H = M.t + list.length * rowH + M.b;
  const b = [];
  b.push(txt(26, 32, opts.title, { cls: 'ttl', size: 19 }));
  b.push(txt(26, 54, opts.sub, { cls: 'sub', size: 12.5 }));
  b.push(txt(26, 74, opts.note, { cls: 'sub', size: 12.5, weight: 600 }));

  for (const g of [0, 25, 50, 75, 100]) {
    const x = M.l + g / 100 * iw;
    b.push(`<line class="grid" x1="${x.toFixed(1)}" y1="${M.t - 8}" x2="${x.toFixed(1)}" y2="${M.t + list.length * rowH - 6}"/>`);
    b.push(txt(x, M.t - 14, g + '%', { cls: 'axl', size: 10.5, anchor: 'middle' }));
  }
  list.forEach(([tag, v], i) => {
    const y = M.t + i * rowH;
    const keep = opts.keep.includes(tag);
    const dead = v < 0.05;
    b.push(txt(M.l - 12, y + 15, tag, {
      cls: dead ? 'note' : 'lbl', size: 12.5, anchor: 'end', weight: keep ? 700 : 400,
    }));
    const w = Math.max(dead ? 0 : 2, v / 100 * iw);
    if (w > 0) {
      b.push(`<rect x="${M.l}" y="${y}" width="${w.toFixed(1)}" height="20" rx="4"`
        + ` fill="var(--s1)" opacity="${keep ? 1 : dead ? 0.25 : 0.45}"/>`);
    }
    b.push(txt(M.l + w + 9, y + 15, v.toFixed(1) + '%', {
      cls: keep ? 'lbl' : 'note', size: 12, weight: keep ? 700 : 400,
    }));
    if (dead) b.push(txt(M.l + w + 56, y + 15, '전 순서 탈락', { cls: 'note', size: 10.5, op: 0.8 }));
  });
  b.push(txt(26, H - 18, `지표 순서 ${res.orders.toLocaleString()}가지 전수. 순서를 고르지 않았다.`,
    { cls: 'note', size: 11.5 }));
  return svgDoc(W, H, b.join('\n'), opts.title);
}

// ---------------------------------------------------------------- ⑥ 맞대결

// 두 설정의 유형별 정답률. 45° 대각선이 동률선이라, 점이 어느 쪽에
// 쏠렸는지가 즉시 읽힌다 — 표 13행을 한 장이 대신한다.
function headToHeadSvg(h2h) {
  if (!h2h) return null;
  const W = 960, H = 780;
  const M = { l: 92, r: 152, t: 104, b: 132 };   // 오른쪽 여백 = 라벨 통로
  const iw = W - M.l - M.r, ih = H - M.t - M.b;
  const sx = (v) => M.l + v * iw, sy = (v) => M.t + ih - v * ih;
  const nmax = Math.max(...h2h.pairs.map((p) => p.n));
  const rad = (n) => 5 + Math.sqrt(n / nmax) * 8;
  const b = [];
  b.push(txt(26, 32, `유형별 정답률 맞대결 — ${h2h.tagB} vs ${h2h.tagA}`, { cls: 'ttl', size: 19 }));
  b.push(txt(26, 54, '대각선 위 = 왼쪽 모델 우세. 원 크기는 문항 수. LLM Judge 전수 채점 결과다.',
    { cls: 'sub', size: 12.5 }));
  b.push(txt(26, 76, `${h2h.tagB} ${h2h.winsB}승 · ${h2h.tagA} ${h2h.winsA}승 · 무 ${h2h.ties}`,
    { cls: 'sub', size: 13, weight: 700 }));

  for (let g = 0; g <= 1.0001; g += 0.25) {
    b.push(`<line class="grid" x1="${sx(g).toFixed(1)}" y1="${M.t}" x2="${sx(g).toFixed(1)}" y2="${M.t + ih}"/>`);
    b.push(`<line class="grid" x1="${M.l}" y1="${sy(g).toFixed(1)}" x2="${M.l + iw}" y2="${sy(g).toFixed(1)}"/>`);
    b.push(txt(sx(g), M.t + ih + 20, (g * 100).toFixed(0) + '%', { cls: 'axl', size: 11, anchor: 'middle' }));
    b.push(txt(M.l - 10, sy(g) + 4, (g * 100).toFixed(0) + '%', { cls: 'axl', size: 11, anchor: 'end' }));
  }
  // 동률선
  b.push(`<line x1="${sx(0)}" y1="${sy(0)}" x2="${sx(1)}" y2="${sy(1)}"`
    + ` stroke="var(--muted)" stroke-width="2" stroke-dasharray="6 5" opacity="0.8"/>`);
  // 동률선 라벨은 점이 없는 좌하단에 둔다(우상단은 혼잡하다).
  b.push(txt(sx(0.16) + 8, sy(0.16) - 6, '동률선 (두 모델 같음)', { cls: 'note', size: 11 }));
  b.push(txt(M.l + 12, M.t + 22, `▲ ${h2h.tagB} 우세`, { cls: 'sub', size: 12, weight: 600 }));
  b.push(txt(M.l + iw - 12, M.t + ih - 14, `${h2h.tagA} 우세 ▼`, { cls: 'sub', size: 12, weight: 600, anchor: 'end' }));

  const boxes = [{ x0: sx(0.16), x1: sx(0.16) + 130, y0: sy(0.16) - 18, y1: sy(0.16) + 4 }];
  boxes.push(...h2h.pairs.map((p) => {
    const x = sx(p.a), y = sy(p.b), r = rad(p.n) + 3;
    return { x0: x - r, x1: x + r, y0: y - r, y1: y + r };
  }));
  const hits = (bx) => boxes.some((q) => bx.x0 < q.x1 && bx.x1 > q.x0 && bx.y0 < q.y1 && bx.y1 > q.y0);
  const placed = [];
  const ordered = h2h.pairs.slice().sort((a, c) => Math.abs(c.b - c.a) - Math.abs(a.b - a.a));
  for (const p of ordered) {
    const x = sx(p.a), y = sy(p.b), r = rad(p.n);
    const big = Math.abs(p.b - p.a) >= 0.2;
    b.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"`
      + ` fill="var(--s1)" fill-opacity="${big ? 0.95 : 0.55}" stroke="var(--surface)" stroke-width="2"/>`);
    const label = `${p.key} (${p.n})`;
    const w = textW(label, 11);
    let best = null;
    // 오른쪽 3분의 1에 있는 점은 라벨을 왼쪽에 먼저 시도한다 — 안 그러면
    // 우상단 모서리에서 자리를 못 찾고 라벨이 통째로 사라진다.
    const sides = x > M.l + iw * 0.78 ? [-1, 1] : [1, -1];
    outer:
    for (const side of sides) {
      for (const dy of [0, -18, 18, -32, 32, -48, 48, -64, 64, -80, 80]) {
        const tx = side === 1 ? x + r + 7 : x - r - 7;
        const x0 = side === 1 ? tx : tx - w;
        const ty = y + 4 + dy;
        const box = { x0: x0 - 2, x1: x0 + w + 2, y0: ty - 10, y1: ty + 6 };
        if (x0 < M.l + 2 || x0 + w > W - 8) continue;      // 오른쪽 여백까지 쓴다
        if (box.y0 < M.t - 26 || box.y1 > M.t + ih) continue;
        if (hits(box) || placed.some((q) => box.x0 < q.x1 && box.x1 > q.x0 && box.y0 < q.y1 && box.y1 > q.y0)) continue;
        best = { tx, ty, side, box }; break outer;
      }
    }
    if (!best) {   // 마지막 수단: 겹치더라도 점 위에 띄운다(라벨을 잃지 않는다)
      const tx = x > M.l + iw * 0.78 ? x - r - 7 : x + r + 7;
      const side = x > M.l + iw * 0.78 ? -1 : 1;
      const ty = y - r - 8;
      best = { tx, ty, side, box: { x0: tx - w, x1: tx + w, y0: ty - 10, y1: ty + 6 } };
    }
    placed.push(best.box);
    b.push(txt(best.tx, best.ty, label, {
      cls: big ? 'lbl' : 'note', size: 11, anchor: best.side === 1 ? 'start' : 'end',
      weight: big ? 700 : 400,
    }));
  }
  b.push(txt(M.l + iw / 2, H - 92, `${h2h.tagA} 정답률 →`, { cls: 'sub', size: 12, anchor: 'middle' }));
  b.push(`<text transform="translate(28,${M.t + ih / 2}) rotate(-90)" class="sub" font-size="12" text-anchor="middle">${esc(h2h.tagB)} 정답률 →</text>`);
  b.push(txt(26, H - 58, `정답률 50% 미만 유형: ${h2h.tagA} ${h2h.belowA}개 · ${h2h.tagB} ${h2h.belowB}개`,
    { cls: 'lbl', size: 12.5, weight: 700 }));
  b.push(txt(26, H - 38, '전체 평균만 보면 가려지는 구멍이 여기서 드러난다. 상담봇은 평균이 아니라 최저치가 품질을 정한다.',
    { cls: 'note', size: 11.5 }));
  b.push(txt(26, H - 18, '문항 수가 작은 유형(API 5건 등)은 원이 작다 — 한 문항이 20%p라 확정적으로 읽지 않는다.',
    { cls: 'note', size: 11 }));
  return svgDoc(W, H, b.join('\n'), '유형별 정답률 맞대결');
}

// ---------------------------------------------------------------- 출력

function writeAll(cmp, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const made = [];
  const screening = require('./screening');
  const cands = screening.candidates(cmp);
  const KEEP = ['gemma3:12b', 'qwen3:14b OFF'];
  const six = cands.length ? screening.survival(cands, 'six') : null;
  const nine = cands.length ? screening.survival(cands, 'nine') : null;
  const charts = {
    'screening_6r.svg': six && survivalSvg(six, {
      title: '1차 선별 — 하자 있는 모델 걸러내기 (6라운드)',
      sub: '지표 6개를 한 번씩, 매 라운드 최하위 1개 탈락. 11개 → 5개 생존.',
      note: '5개 설정은 어떤 순서에서도 탈락했다. 반대로 상위 4개는 서로 큰 차이가 없다.',
      keep: KEEP }),
    'screening_9r.svg': nine && survivalSvg(nine, {
      title: '변별 — 2개까지 좁히기 (9라운드)',
      sub: '3라운드를 더 돌려 2개만 남긴다. 재사용할 지표 3개까지 독립으로 훑어 앞자리 가중 편향을 제거했다.',
      note: 'qwen3:14b OFF 97.0% · gemma3:12b 82.7% — 3위(17.3%)와 압도적으로 벌어진다.',
      keep: KEEP }),
    'head_to_head.svg': headToHeadSvg(screening.headToHead(cmp, 'gemma3:12b', 'qwen3:14b OFF')),
    'speed_quality.svg': speedQualitySvg(cmp, { keep: KEEP }),
    'pareto.svg': paretoSvg(cmp),
    'marginal_efficiency.svg': marginalEfficiencySvg(cmp),
    'core_metrics.svg': coreMetricsSvg(cmp),
    'think_slope.svg': thinkSlopeSvg(cmp),
  };
  for (const [name, svg] of Object.entries(charts)) {
    if (!svg) continue; // 데이터가 없는 차트는 조용히 건너뛴다
    fs.writeFileSync(path.join(outDir, name), svg, 'utf8');
    made.push(name);
  }
  return { made, charts };
}

module.exports = { writeAll, settings, paretoFront, paretoSvg, speedQualitySvg,
  marginalEfficiencySvg, coreMetricsSvg, thinkSlopeSvg, survivalSvg, headToHeadSvg };
