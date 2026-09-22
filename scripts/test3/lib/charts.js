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
  const hits = (bx) => boxes.some((q) =>
    bx.x0 < q.x1 && bx.x1 > q.x0 && bx.y0 < q.y1 && bx.y1 > q.y0);
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
    let best = null;
    outer:
    for (const side of [1, -1]) {
      for (const dy of [0, -26, 26, -46, 46, -68, 68, -92, 92]) {
        const tx = side === 1 ? x + r + 8 : x - r - 8;
        const x0 = side === 1 ? tx : tx - w, x1 = x0 + w;
        const ty = y + 4 + dy;
        const box = { x0: x0 - 3, x1: x1 + 3, y0: ty - 12, y1: ty + 19 };
        if (x0 < M.l + 2 || x1 > M.l + iw - 2) continue;
        if (box.y0 < M.t - 4 || box.y1 > M.t + ih + 2) continue;
        if (hits(box)) continue;
        best = { tx, ty, side, box };
        break outer;
      }
    }
    if (!best) { const tx = x + r + 8, ty = y + 4;
      best = { tx, ty, side: 1, box: { x0: tx - 3, x1: tx + w + 3, y0: ty - 12, y1: ty + 19 } }; }
    boxes.push(best.box);
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

// ---------------------------------------------------------------- 출력

function writeAll(cmp, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const made = [];
  const charts = {
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

module.exports = { writeAll, settings, paretoFront, paretoSvg,
  marginalEfficiencySvg, coreMetricsSvg, thinkSlopeSvg };
