'use strict';

// Deterministic auxiliary metrics (README 8-1) — no embeddings, no external calls.

// Naive Korean-aware keyword extraction: numbers, units, and content words (2+ chars,
// strips a small set of trailing particles). Substring `includes()` matching downstream
// tolerates most particle variation without a real morphological analyzer.
const PARTICLES = ['으로', '이라', '에서', '까지', '부터', '이나', '과는', '와는', '은', '는', '이', '가', '을', '를', '에', '와', '과', '도', '만', '나'];
const STOPWORDS = new Set(['있습니다', '합니다', '수', '것', '경우', '때', '후', '통해', '위해', '해당']);

function extractKeywords(text) {
  const numbers = (text.match(/\d[\d,.]*\s?(원|%|GB|MB|KB|일|개월|년|분|초|건)?/g) || []).map((s) => s.trim());
  const words = text
    .replace(/[.,()"'/·]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));

  const stripped = words.map((w) => {
    for (const p of PARTICLES) {
      if (w.endsWith(p) && w.length - p.length >= 2) return w.slice(0, w.length - p.length);
    }
    return w;
  });

  return Array.from(new Set([...numbers, ...stripped])).filter((k) => k.length >= 2);
}

// Keyword/fact coverage: % of gold-answer keywords found (as substring) in the generated answer.
function keywordCoverage(goldAnswer, generatedAnswer) {
  const goldKeywords = extractKeywords(goldAnswer);
  if (goldKeywords.length === 0) return { coveragePct: null, matched: [], missing: [] };
  const matched = goldKeywords.filter((k) => generatedAnswer.includes(k));
  const missing = goldKeywords.filter((k) => !generatedAnswer.includes(k));
  return {
    coveragePct: Number(((matched.length / goldKeywords.length) * 100).toFixed(1)),
    matched,
    missing,
  };
}

// ROUGE-L: LCS-based recall/precision/F1 over whitespace-ish character sequence.
// Uses character-level LCS (more robust for Korean than word-level, since word
// segmentation is unreliable without a morphological analyzer).
function lcsLength(a, b) {
  const n = a.length;
  const m = b.length;
  if (n === 0 || m === 0) return 0;
  let prev = new Array(m + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    const curr = new Array(m + 1).fill(0);
    for (let j = 1; j <= m; j++) {
      curr[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], curr[j - 1]);
    }
    prev = curr;
  }
  return prev[m];
}

function rougeL(goldAnswer, generatedAnswer) {
  const a = goldAnswer.replace(/\s+/g, '');
  const b = generatedAnswer.replace(/\s+/g, '');
  const lcs = lcsLength(a, b);
  const recall = a.length ? lcs / a.length : 0;
  const precision = b.length ? lcs / b.length : 0;
  const f1 = recall + precision === 0 ? 0 : (2 * recall * precision) / (recall + precision);
  return { recall: Number(recall.toFixed(3)), precision: Number(precision.toFixed(3)), f1: Number(f1.toFixed(3)) };
}

// Number/proper-noun verification: every number-like token in the generated answer
// must appear in the source context, otherwise it's a hallucination candidate.
function numberVerification(contextText, generatedAnswer) {
  const genNumbers = generatedAnswer.match(/\d[\d,.]*\s?(원|%|GB|MB|KB|일|개월|년|분|초|건)?/g) || [];
  if (genNumbers.length === 0) return { pass: true, unverified: [], checked: 0 };
  const unverified = genNumbers.map((s) => s.trim()).filter((n) => !contextText.includes(n));
  return { pass: unverified.length === 0, unverified, checked: genNumbers.length };
}

// Jaccard similarity over character bigrams — used to check cluster label distinctiveness.
function bigrams(str) {
  const s = str.replace(/\s+/g, '');
  const set = new Set();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  if (set.size === 0 && s.length > 0) set.add(s);
  return set;
}

function jaccardSimilarity(a, b) {
  const setA = bigrams(a);
  const setB = bigrams(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const g of setA) if (setB.has(g)) intersection++;
  const union = setA.size + setB.size - intersection;
  return Number((intersection / union).toFixed(3));
}

// For a list of labels, returns the max pairwise similarity for each label against the others
// (higher = less distinct) plus the overall average pairwise similarity.
function labelDistinctiveness(labels) {
  const n = labels.length;
  const pairwise = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      pairwise.push({ a: labels[i], b: labels[j], sim: jaccardSimilarity(labels[i], labels[j]) });
    }
  }
  const avg = pairwise.length ? pairwise.reduce((s, p) => s + p.sim, 0) / pairwise.length : 0;
  const maxPair = pairwise.reduce((m, p) => (p.sim > m.sim ? p : m), { sim: -1 });
  return { avgPairwiseSimilarity: Number(avg.toFixed(3)), mostSimilarPair: maxPair, pairwise };
}

module.exports = {
  extractKeywords,
  keywordCoverage,
  rougeL,
  numberVerification,
  jaccardSimilarity,
  labelDistinctiveness,
};
