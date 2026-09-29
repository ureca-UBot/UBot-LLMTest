'use strict';
// 모델 선별 시뮬레이션 — round_comparison.json 하나만 읽는다.
//
// 설계 의도: 상담 챗봇은 "한 지표가 특출난 모델"보다 "어느 지표도 고장나지
// 않은 모델"이 필요하다. 그래서 매 라운드 최하위 1개를 떨어뜨리는 방식을 쓴다.
// 이 방식은 순서에 의존하므로, 순서를 고르지 않고 **전순열을 전수로 훑어**
// 그 의존성을 없앤다.
//
//   1차(6라운드)  지표 6개를 한 번씩  → 11개 중 5개 생존. 가중치 완전 균등.
//   2차(9라운드)  2개까지 좁히려면 3라운드가 더 필요해 지표 3개가 재사용된다.
//                 "어느 3개를 재사용할지"까지 독립으로 훑어(P(6,3)=120)
//                 앞자리 가중 편향을 제거한다. 720 × 120 = 86,400가지.

// 탈락 라운드에 쓰는 6개 지표. 부호는 "클수록 좋음"으로 통일한다.
//   제외: 포맷 성공률(값 폭 1%)·표현 품질(6%) — 변별력이 없어 동전 던지기가 된다.
//         평균 지연 — P95와 중복이라 속도에 가중치가 두 배로 들어간다.
//   VRAM은 순위 지표가 아니라 전제다(T4 16GB, 전 설정 적재 가능).
const METRICS = ['정확도', '근거율', '상태일치', '부재F1', '일관성', 'P95'];

// round_comparison.json -> 탈락전에 올릴 설정 목록
function candidates(cmp) {
  const out = [];
  for (const m of cmp.models) {
    const add = (r, suffix) => {
      if (!r || !r.llm_judge || r.llm_judge.correct_rate == null) return;
      out.push({
        tag: m.model_tag + suffix,
        정확도: r.llm_judge.correct_rate,
        근거율: r.llm_judge.is_grounded_rate,
        상태일치: r.status_match,
        부재F1: r.absence_f1,
        일관성: r.repeat ? r.repeat.overall : null,
        P95: r.latency_p95_ms == null ? null : -r.latency_p95_ms / 1000, // 낮을수록 좋음 → 부호 반전
      });
    };
    add(m.test3_think, m.think_capable ? ' ON' : '');
    add(m.test3_nothink, ' OFF');
  }
  return out.filter((c) => METRICS.every((k) => c[k] != null));
}

// 지표 순서 하나로 탈락전을 돌린다. 최하위가 동점이면 분기해 가중치를 나눈다
// (임의로 하나를 고르지 않는다).
function runOrder(cands, order, stopAt) {
  let states = [{ alive: cands.map((c) => c.tag), w: 1 }];
  for (const k of order) {
    if (states.every((s) => s.alive.length <= stopAt)) break;
    const next = [];
    for (const s of states) {
      if (s.alive.length <= stopAt) { next.push(s); continue; }
      const vals = s.alive.map((t) => ({ t, v: cands.find((c) => c.tag === t)[k] }));
      const min = Math.min(...vals.map((x) => x.v));
      const tied = vals.filter((x) => x.v === min).map((x) => x.t);
      for (const drop of tied) {
        next.push({ alive: s.alive.filter((t) => t !== drop), w: s.w / tied.length });
      }
    }
    states = next;
  }
  return states;
}

function permutations(arr) {
  if (arr.length <= 1) return [arr];
  const out = [];
  arr.forEach((x, i) => permutations(arr.filter((_, j) => j !== i)).forEach((p) => out.push([x, ...p])));
  return out;
}

// k개를 순서 있게 뽑는 모든 경우 (P(n,k))
function orderedPicks(arr, k) {
  if (k === 0) return [[]];
  const out = [];
  arr.forEach((x, i) => orderedPicks(arr.filter((_, j) => j !== i), k - 1).forEach((p) => out.push([x, ...p])));
  return out;
}

// 생존율 집계. rounds: 'six'(6라운드 → 5생존) | 'nine'(9라운드 → 2생존)
function survival(cands, rounds) {
  const perms = permutations(METRICS);
  const tally = {};
  cands.forEach((c) => { tally[c.tag] = 0; });
  let total = 0, orders = 0;

  const tallyStates = (states) => {
    for (const s of states) { total += s.w; s.alive.forEach((t) => { tally[t] += s.w; }); }
  };

  if (rounds === 'six') {
    for (const p of perms) { orders++; tallyStates(runOrder(cands, p, 2)); }
  } else {
    // 앞 6라운드(순열) × 뒤 3라운드(재사용할 지표를 독립 선택)
    const tails = orderedPicks(METRICS, 3);
    for (const p of perms) {
      for (const t of tails) { orders++; tallyStates(runOrder(cands, p.concat(t), 2)); }
    }
  }
  return {
    orders,
    rate: Object.fromEntries(Object.entries(tally).map(([t, w]) => [t, w / total * 100])),
  };
}

// 두 설정의 유형별 정답률 맞대결
function headToHead(cmp, tagA, tagB) {
  const find = (tag) => {
    for (const m of cmp.models) {
      for (const [k, suf] of [['test3_think', m.think_capable ? ' ON' : ''], ['test3_nothink', ' OFF']]) {
        if (m.model_tag + suf === tag && m[k] && m[k].llm_judge) return m[k].llm_judge;
      }
    }
    return null;
  };
  const A = find(tagA), B = find(tagB);
  if (!A || !B || !A.by_type || !B.by_type) return null;
  const pairs = A.by_type.map((t) => {
    const b = B.by_type.find((x) => x.key === t.key);
    return b ? { key: t.key, n: t.n, a: t.rate, b: b.rate, aC: t.correct, bC: b.correct } : null;
  }).filter(Boolean);
  return {
    tagA, tagB, pairs,
    winsB: pairs.filter((p) => p.b - p.a > 0.005).length,
    winsA: pairs.filter((p) => p.a - p.b > 0.005).length,
    ties: pairs.filter((p) => Math.abs(p.a - p.b) <= 0.005).length,
    belowA: pairs.filter((p) => p.a < 0.5).length,
    belowB: pairs.filter((p) => p.b < 0.5).length,
    difficulty: { a: A.by_difficulty, b: B.by_difficulty },
  };
}

module.exports = { METRICS, candidates, survival, headToHead, runOrder };
