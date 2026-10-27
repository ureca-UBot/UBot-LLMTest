'use strict';

// Reads results/raw/faq_<round>.judged.jsonl and regenerates the "모델별 결과" +
// "종합 비교" sections of results/faq_<round>_results.md, keeping everything above
// "## 모델별 결과" untouched (intro / test case table / scoring criteria).
//
// Usage: node scripts/aggregate_faq_round.js easy

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

const ROUND_IDS = {
  easy: { prefix: 'E', excluded: 'E09', all: ['E01', 'E02', 'E03', 'E04', 'E05', 'E06', 'E07', 'E08', 'E09', 'E10'] },
  medium: { prefix: 'M', excluded: 'M09', all: ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09', 'M10'] },
  hard: { prefix: 'H', excluded: 'H09', all: ['H01', 'H02', 'H03', 'H04', 'H05', 'H06', 'H07', 'H08', 'H09', 'H10'] },
};

function loadRecords(roundName) {
  const p = path.join(RAW_DIR, `faq_${roundName}.judged.jsonl`);
  return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

// rec.contextBlock holds the exact FAQ text shown to the model, e.g.
// "FAQ-028: 카테고리 - Q: 질문 A: 정답 답변" (one line per FAQ ID, "\n"-joined if several).
// Pull out just the "A: ..." portion(s) as the gold answer to show alongside the LLM's answer.
function goldAnswerFromContextBlock(contextBlock) {
  if (!contextBlock) return '(컨텍스트 없음)';
  const matches = Array.from(contextBlock.matchAll(/A:\s*([^\n]+)/g)).map((m) => m[1].trim());
  return matches.length ? matches.join(' / ') : contextBlock;
}

function fmt(n, digits = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return '-';
  return Number(n).toFixed(digits);
}

// Markdown table cells break on raw "|" and newlines — sanitize free text before embedding.
function cell(text) {
  if (text === null || text === undefined) return '';
  return String(text).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

// Column order for the compact metrics table (after the leading ID column).
const METRIC_COLS = ['답변정확도', '키워드%', 'ROUGE-L', 'RAG충실도', '숫자/고유명사', '표현품질', '포맷성공', 'Latency(ms)', 'TPS', '사람평가'];

function row(id, cells) {
  return `| ${id} | ${cells.join(' | ')} |`;
}

function buildModelSection(modelTag, modelLabel, records, ids, excludedId) {
  const byId = new Map(records.filter((r) => r.model === modelTag).map((r) => [r.id, r]));
  const rows = [];
  const qaBlocks = [];
  const validRows = [];

  for (const id of ids) {
    if (id === excludedId) {
      const anyRec = records.find((r) => r.id === id);
      if (anyRec) qaBlocks.push(`**${id}** (MAP_API — 제외)\n> **Q.** ${anyRec.query}`);
      rows.push(row(id, ['N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', '(MAP_API — 의도분류 참고)']));
      continue;
    }
    const rec = byId.get(id);
    if (!rec) {
      rows.push(row(id, ['(누락)', '-', '-', '-', '-', '-', '-', '-', '-', '']));
      continue;
    }
    if (!rec.ok || !rec.formatValid || !rec.parsed) {
      qaBlocks.push(`**${id}** — 포맷 실패\n> **Q.** ${rec.query}\n>\n> **정답.** ${goldAnswerFromContextBlock(rec.contextBlock)}\n>\n> **LLM답변.** _(JSON 파싱 실패: ${(rec.rawContent || rec.error || '').slice(0, 200)})_`);
      rows.push(row(id, ['포맷실패', '-', '-', '-', '-', '-', 'X', fmt(rec.latencyMs, 0), fmt(rec.tokensPerSec), '']));
      continue;
    }
    const det = rec.det || {};
    const judge = rec.judge && rec.judge.ok ? rec.judge.scores : null;
    const qaLines = [
      `**${id}**`,
      `> **Q.** ${rec.query}`,
      `>`,
      `> **정답.** ${goldAnswerFromContextBlock(rec.contextBlock)}`,
      `>`,
      `> **LLM답변.** ${rec.parsed.answer}`,
    ];
    if (judge && !judge.faithful && judge.hallucination) qaLines.push(`>`, `> ⚠️ 환각: ${judge.hallucination}`);
    if (det.numberVerification && !det.numberVerification.pass) qaLines.push(`>`, `> ⚠️ 미검증 수치: ${det.numberVerification.unverified.join(', ')}`);
    qaBlocks.push(qaLines.join('\n'));

    const kw = det.keywordCoverage ? `${fmt(det.keywordCoverage.coveragePct)}%` : '-';
    const rouge = det.rougeL ? fmt(det.rougeL.f1, 3) : '-';
    const numCheck = det.numberVerification ? (det.numberVerification.pass ? 'O' : 'X') : '-';
    const acc = judge ? `${judge.answer_accuracy}/5` : '-';
    const faithful = judge ? (judge.faithful ? 'O' : 'X') : '-';
    const expr = judge ? `${judge.expression_quality}/5` : '-';
    const fmtOk = rec.formatValid ? 'O' : 'X';

    rows.push(row(id, [acc, kw, rouge, faithful, numCheck, expr, fmtOk, fmt(rec.latencyMs, 0), fmt(rec.tokensPerSec), '']));

    if (judge) {
      validRows.push({
        acc: judge.answer_accuracy,
        faithful: judge.faithful,
        expr: judge.expression_quality,
        kw: det.keywordCoverage ? det.keywordCoverage.coveragePct : null,
        rouge: det.rougeL ? det.rougeL.f1 : null,
        fmtOk: rec.formatValid,
        latency: rec.latencyMs,
        tps: rec.tokensPerSec,
      });
    }
  }

  const n = validRows.length;
  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
  const correctPct = n ? (validRows.filter((r) => r.acc >= 4).length / n) * 100 : null;
  const halluPct = n ? (validRows.filter((r) => !r.faithful).length / n) * 100 : null;
  const avgExpr = avg(validRows.map((r) => r.expr));
  const avgKw = avg(validRows.map((r) => r.kw).filter((v) => v !== null));
  const avgRouge = avg(validRows.map((r) => r.rouge).filter((v) => v !== null));
  const fmtPct = n ? (validRows.filter((r) => r.fmtOk).length / n) * 100 : null;
  const avgLatency = avg(validRows.map((r) => r.latency));
  const avgTps = avg(validRows.map((r) => r.tps));

  const summary = `**요약(${n}건 기준)**: 정답률 ${fmt(correctPct, 1)}% · 키워드커버리지 평균 ${fmt(avgKw, 1)}% · ROUGE-L 평균 ${fmt(avgRouge, 3)} · 환각률 ${fmt(halluPct, 1)}% · 평균 표현품질 ${fmt(avgExpr, 2)}/5 · 포맷성공률 ${fmt(fmtPct, 1)}% · 평균 Latency ${fmt(avgLatency, 0)}ms · 평균 TPS ${fmt(avgTps, 1)}`;

  const header = `| ID | ${METRIC_COLS.join(' | ')} |\n|---|${METRIC_COLS.map(() => '---').join('|')}|`;
  const qaSection = `<details>\n<summary>질문 · 생성 답변 (펼치기)</summary>\n\n${qaBlocks.join('\n\n')}\n\n</details>`;

  return {
    section: `### ${modelLabel}\n\n${qaSection}\n\n${header}\n${rows.join('\n')}\n\n${summary}\n**사람 총평**: _(모델 전체에 대한 종합 의견)_`,
    stats: { correctPct, halluPct, avgExpr, fmtPct, avgLatency, avgTps, avgKw, avgRouge },
  };
}

function main() {
  const roundName = process.argv[2];
  if (!ROUND_IDS[roundName]) {
    console.error(`Usage: node scripts/aggregate_faq_round.js <${Object.keys(ROUND_IDS).join('|')}>`);
    process.exit(1);
  }
  const { all, excluded } = ROUND_IDS[roundName];
  const records = loadRecords(roundName);

  const sections = [];
  const comparisonRows = [];
  MODELS.forEach((m, idx) => {
    const { section, stats } = buildModelSection(m.tag, `${idx + 1}. ${m.label}`, records, all, excluded);
    sections.push(section);
    comparisonRows.push(
      `| ${m.label.split(' (')[0]} | ${fmt(stats.correctPct, 1)}% | ${fmt(stats.avgKw, 1)}% | ${fmt(stats.avgRouge, 3)} | ${fmt(stats.halluPct, 1)}% | ${fmt(stats.avgExpr, 2)}/5 | ${fmt(stats.fmtPct, 1)}% | ${fmt(stats.avgLatency, 0)} | ${fmt(stats.avgTps, 1)} |`
    );
  });

  const modelSectionsText = sections.join('\n\n---\n\n');
  const comparisonTable = `| 모델 | 정답률 | 키워드커버리지 | ROUGE-L | 환각률 | 표현품질 | 포맷성공률 | 평균 Latency(ms) | 평균 TPS |\n|---|---|---|---|---|---|---|---|---|\n${comparisonRows.join('\n')}`;

  const resultSuffix = process.env.RESULT_SUFFIX || '';
  const mdPath = path.join(RESULTS_DIR, `faq_${roundName}${resultSuffix}_results.md`);
  const original = fs.readFileSync(mdPath, 'utf8');
  const marker = '## 모델별 결과';
  // Match the marker only as a heading line (start of line), not an inline backtick mention
  // (e.g. a warning note referencing "`## 모델별 결과`" earlier in the file).
  const markerRe = /^## 모델별 결과\s*$/m;
  const m = markerRe.exec(original);
  if (!m) {
    console.error(`Marker "${marker}" (as heading) not found in ${mdPath}`);
    process.exit(1);
  }
  const before = original.slice(0, m.index);

  // Preserve the one-line note directly under the marker (from the current file's first model section header context)
  const newContent =
    before +
    `${marker}\n\n각 모델 표는 ${all[0]}~${all[all.length - 1]}을 모두 나열하되, **${excluded}(MAP_API)는 답변 생성 평가 제외 대상**이라 채점하지 않고 "N/A"로 표시합니다. 요약 통계는 나머지 9건 기준으로 계산합니다.\n\n` +
    modelSectionsText +
    `\n\n## 종합 비교\n\n${comparisonTable}\n`;

  fs.writeFileSync(mdPath, newContent, 'utf8');
  console.log(`Updated ${mdPath}`);
}

main();
