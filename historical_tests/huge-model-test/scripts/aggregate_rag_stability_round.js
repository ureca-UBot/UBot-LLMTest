'use strict';

// Reads results/raw/rag_stability_<tier>.judged.jsonl and regenerates the
// "모델별 결과" + "종합 비교" sections of results/faq_rag_stability_<tier>_results.md,
// keeping everything above "## 모델별 결과" untouched (intro / test case tables / scoring criteria).
//
// Usage: node scripts/aggregate_rag_stability_round.js small

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'results', 'raw');
const RESULTS_DIR = path.join(ROOT, 'results');

const DEFAULT_MODELS = [
  { tag: 'qwen3:0.6b', label: 'Qwen3 0.6B (`qwen3:0.6b`)' },
  { tag: 'qwen3:1.7b', label: 'Qwen3 1.7B (`qwen3:1.7b`)' },
  { tag: 'qwen3:4b', label: 'Qwen3 4B (`qwen3:4b`)' },
  { tag: 'qwen3:8b', label: 'Qwen3 8B (`qwen3:8b`)' },
  { tag: 'exaone3.5:2.4b', label: 'EXAONE 3.5 2.4B (`exaone3.5:2.4b`)' },
  { tag: 'exaone3.5:7.8b', label: 'EXAONE 3.5 7.8B (`exaone3.5:7.8b`)' },
  { tag: 'gemma3:270m', label: 'Gemma3 270M (`gemma3:270m`)' },
  { tag: 'gemma3:1b', label: 'Gemma3 1B (`gemma3:1b`)' },
  { tag: 'gemma3:4b', label: 'Gemma3 4B (`gemma3:4b`)' },
];

const MODELS = (process.env.LLM_TEST_MODELS
  ? process.env.LLM_TEST_MODELS.split(',').map((tag) => ({
      tag: tag.trim(),
      label: `${tag.trim()} (\`${tag.trim()}\`)`,
    })).filter((m) => m.tag)
  : DEFAULT_MODELS);

const TYPES = ['HR', 'EC', 'CF', 'PI', 'SR', 'NC', 'MC'];
const TIER_IDS = {
  // Small = *-01/02/03, Medium = *-04/05/06, Large = *-07/08/09
  small: TYPES.flatMap((t) => [1, 2, 3].map((n) => `${t}-0${n}`)),
  medium: TYPES.flatMap((t) => [4, 5, 6].map((n) => `${t}-0${n}`)),
  large: TYPES.flatMap((t) => [7, 8, 9].map((n) => `${t}-0${n}`)),
};

function loadRecords(tier) {
  const p = path.join(RAW_DIR, `rag_stability_${tier}.judged.jsonl`);
  return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

function fmt(n, digits = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return '-';
  return Number(n).toFixed(digits);
}

const METRIC_COLS = ['대응적절성', '숫자/고유명사', '표현품질', '포맷성공', 'Latency(ms)', 'TPS', '사람평가'];

function row(id, cells) {
  return `| ${id} | ${cells.join(' | ')} |`;
}

function typeOf(id) {
  return id.split('-')[0];
}

function buildModelSection(modelTag, modelLabel, records, ids) {
  const byId = new Map(records.filter((r) => r.model === modelTag).map((r) => [r.id, r]));
  const rows = [];
  const qaBlocks = [];
  const validRows = [];

  for (const id of ids) {
    const rec = byId.get(id);
    if (!rec) {
      rows.push(row(id, ['(누락)', '-', '-', '-', '-', '-', '']));
      continue;
    }
    if (!rec.ok || !rec.formatValid || !rec.parsed) {
      qaBlocks.push(`**${id}** (${rec.type}) — 포맷 실패\n> **Q.** ${rec.query}\n>\n> **컨텍스트.** ${rec.contextBlock}\n>\n> **LLM답변.** _(JSON 파싱 실패: ${(rec.rawContent || rec.error || '').slice(0, 200)})_`);
      rows.push(row(id, ['포맷실패', '-', '-', 'X', fmt(rec.latencyMs, 0), fmt(rec.tokensPerSec), '']));
      continue;
    }
    const det = rec.det || {};
    const judge = rec.judge && rec.judge.ok ? rec.judge.scores : null;

    const qaLines = [
      `**${id}** (${rec.type})`,
      `> **Q.** ${rec.query}`,
      `>`,
      `> **컨텍스트.** ${rec.contextBlock}`,
      `>`,
      `> **기대 행동.** ${rec.expectedBehavior}`,
      `>`,
      `> **LLM답변.** ${rec.parsed.answer}`,
    ];
    if (judge && !judge.pass && judge.failure_reason) qaLines.push(`>`, `> ⚠️ 실패 사유: ${judge.failure_reason}`);
    if (det.numberVerification && !det.numberVerification.pass) qaLines.push(`>`, `> ⚠️ 미검증 수치: ${det.numberVerification.unverified.join(', ')}`);
    qaBlocks.push(qaLines.join('\n'));

    const numCheck = det.numberVerification ? (det.numberVerification.pass ? 'O' : 'X') : '-';
    const pass = judge ? (judge.pass ? 'Pass' : 'Fail') : '-';
    const expr = judge ? `${judge.expression_quality}/5` : '-';
    const fmtOk = rec.formatValid ? 'O' : 'X';

    rows.push(row(id, [pass, numCheck, expr, fmtOk, fmt(rec.latencyMs, 0), fmt(rec.tokensPerSec), '']));

    if (judge) {
      validRows.push({
        type: typeOf(id),
        pass: judge.pass,
        expr: judge.expression_quality,
        fmtOk: rec.formatValid,
        latency: rec.latencyMs,
        tps: rec.tokensPerSec,
      });
    }
  }

  const n = validRows.length;
  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
  const passPct = n ? (validRows.filter((r) => r.pass).length / n) * 100 : null;
  const avgExpr = avg(validRows.map((r) => r.expr));
  const fmtPct = n ? (validRows.filter((r) => r.fmtOk).length / n) * 100 : null;
  const avgLatency = avg(validRows.map((r) => r.latency));
  const avgTps = avg(validRows.map((r) => r.tps));

  const perType = TYPES.map((t) => {
    const rs = validRows.filter((r) => r.type === t);
    const pct = rs.length ? (rs.filter((r) => r.pass).length / rs.length) * 100 : null;
    return `${t} ${fmt(pct, 0)}%`;
  }).join(' · ');

  const summary = `**요약(${n}건 기준)**: 적절 대응률 ${fmt(passPct, 1)}% (유형별: ${perType}) · 평균 표현품질 ${fmt(avgExpr, 2)}/5 · 포맷성공률 ${fmt(fmtPct, 1)}% · 평균 Latency ${fmt(avgLatency, 0)}ms · 평균 TPS ${fmt(avgTps, 1)}`;

  const header = `| ID | ${METRIC_COLS.join(' | ')} |\n|---|${METRIC_COLS.map(() => '---').join('|')}|`;
  const qaSection = `<details>\n<summary>질문 · 컨텍스트 · LLM답변 (펼치기)</summary>\n\n${qaBlocks.join('\n\n')}\n\n</details>`;

  return {
    section: `### ${modelLabel}\n\n${qaSection}\n\n${header}\n${rows.join('\n')}\n\n${summary}\n**사람 총평**: _(모델 전체에 대한 종합 의견)_`,
    stats: { passPct, avgExpr, fmtPct, avgLatency, avgTps },
  };
}

function main() {
  const tier = process.argv[2];
  if (!TIER_IDS[tier]) {
    console.error(`Usage: node scripts/aggregate_rag_stability_round.js <${Object.keys(TIER_IDS).join('|')}>`);
    process.exit(1);
  }
  const ids = TIER_IDS[tier];
  const records = loadRecords(tier);

  const sections = [];
  const comparisonRows = [];
  MODELS.forEach((m, idx) => {
    const { section, stats } = buildModelSection(m.tag, `${idx + 1}. ${m.label}`, records, ids);
    sections.push(section);
    comparisonRows.push(
      `| ${m.label.split(' (')[0]} | ${fmt(stats.passPct, 1)}% | ${fmt(stats.avgExpr, 2)}/5 | ${fmt(stats.fmtPct, 1)}% | ${fmt(stats.avgLatency, 0)} | ${fmt(stats.avgTps, 1)} |`
    );
  });

  const modelSectionsText = sections.join('\n\n---\n\n');
  const comparisonTable = `| 모델 | 적절 대응률 | 표현품질 | 포맷성공률 | 평균 Latency(ms) | 평균 TPS |\n|---|---|---|---|---|---|\n${comparisonRows.join('\n')}`;

  const resultSuffix = process.env.RESULT_SUFFIX || '';
  const mdPath = path.join(RESULTS_DIR, `faq_rag_stability_${tier}${resultSuffix}_results.md`);
  const original = fs.readFileSync(mdPath, 'utf8');
  const markerRe = /^## 모델별 결과\s*$/m;
  const m = markerRe.exec(original);
  if (!m) {
    console.error(`Marker "## 모델별 결과" (as heading) not found in ${mdPath}`);
    process.exit(1);
  }
  const before = original.slice(0, m.index);

  // Preserve the trailing "관전 포인트" section if present (re-read from original, appended after comparison table).
  const watchIdx = original.indexOf('## 관전 포인트');
  const watchSection = watchIdx !== -1 ? '\n\n' + original.slice(watchIdx) : '';

  const newContent =
    before +
    `## 모델별 결과\n\n${modelSectionsText}\n\n## 종합 비교\n\n${comparisonTable}` +
    watchSection;

  fs.writeFileSync(mdPath, newContent, 'utf8');
  console.log(`Updated ${mdPath}`);
}

main();
