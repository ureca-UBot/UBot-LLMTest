'use strict';

// Reads all judged.jsonl files (FAQ Easy/Medium/Hard + RAG stability Small/Medium/Large)
// and writes a single consolidated results/summary_results.md — overview tables per
// round, plus a per-type (HR/EC/CF/PI/SR/NC/MC) breakdown for each RAG stability tier.
//
// Usage: node scripts/generate_summary.js

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'results', 'raw');
const RESULTS_DIR = path.join(ROOT, 'results');
const RESULT_SUFFIX = process.env.RESULT_SUFFIX || '';

const DEFAULT_MODELS = [
  { tag: 'qwen3:0.6b', label: 'Qwen3 0.6B' },
  { tag: 'qwen3:1.7b', label: 'Qwen3 1.7B' },
  { tag: 'qwen3:4b', label: 'Qwen3 4B' },
  { tag: 'qwen3:8b', label: 'Qwen3 8B' },
  { tag: 'exaone3.5:2.4b', label: 'EXAONE 3.5 2.4B' },
  { tag: 'exaone3.5:7.8b', label: 'EXAONE 3.5 7.8B' },
  { tag: 'gemma3:270m', label: 'Gemma3 270M' },
  { tag: 'gemma3:1b', label: 'Gemma3 1B' },
  { tag: 'gemma3:4b', label: 'Gemma3 4B' },
];

const MODELS = (process.env.LLM_TEST_MODELS
  ? process.env.LLM_TEST_MODELS.split(',').map((tag) => ({ tag: tag.trim(), label: tag.trim() })).filter((m) => m.tag)
  : DEFAULT_MODELS);

const TYPES = ['HR', 'EC', 'CF', 'PI', 'SR', 'NC', 'MC'];

function fmt(n, digits = 1) {
  if (n === null || n === undefined || Number.isNaN(n)) return '-';
  return Number(n).toFixed(digits);
}

function loadJsonl(p) {
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

// ---------- FAQ 답변 생성 라운드 (Easy/Medium/Hard) ----------

function faqRoundStats(records, modelTag) {
  const rs = records.filter((r) => r.model === modelTag && r.judge && r.judge.ok);
  const n = rs.length;
  if (n === 0) return null;
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const correctPct = (rs.filter((r) => r.judge.scores.answer_accuracy >= 4).length / n) * 100;
  const halluPct = (rs.filter((r) => !r.judge.scores.faithful).length / n) * 100;
  const avgExpr = avg(rs.map((r) => r.judge.scores.expression_quality));
  const avgKw = avg(rs.filter((r) => r.det && r.det.keywordCoverage).map((r) => r.det.keywordCoverage.coveragePct));
  const avgRouge = avg(rs.filter((r) => r.det && r.det.rougeL).map((r) => r.det.rougeL.f1));
  const fmtPct = (records.filter((r) => r.model === modelTag && r.formatValid).length / records.filter((r) => r.model === modelTag).length) * 100;
  const avgLatency = avg(rs.map((r) => r.latencyMs));
  const avgTps = avg(rs.map((r) => r.tokensPerSec));
  return { n, correctPct, halluPct, avgExpr, avgKw, avgRouge, fmtPct, avgLatency, avgTps };
}

function buildFaqRoundTable(roundName) {
  const records = loadJsonl(path.join(RAW_DIR, `faq_${roundName}.judged.jsonl`));
  if (records.length === 0) return `_(${roundName} 라운드 데이터 없음)_`;
  const rows = MODELS.map((m) => {
    const s = faqRoundStats(records, m.tag);
    if (!s) return `| ${m.label} | - | - | - | - | - | - | - | - |`;
    return `| ${m.label} | ${fmt(s.correctPct)}% | ${fmt(s.avgKw)}% | ${fmt(s.avgRouge, 3)} | ${fmt(s.halluPct)}% | ${fmt(s.avgExpr, 2)}/5 | ${fmt(s.fmtPct)}% | ${fmt(s.avgLatency, 0)} | ${fmt(s.avgTps, 1)} |`;
  });
  return `| 모델 | 정답률 | 키워드커버리지 | ROUGE-L | 환각률 | 표현품질 | 포맷성공률 | 평균Latency(ms) | 평균TPS |\n|---|---|---|---|---|---|---|---|---|\n${rows.join('\n')}`;
}

// ---------- RAG 안정성 라운드 (Small/Medium/Large) ----------

function typeOf(id) {
  return id.split('-')[0];
}

function ragTierStatsByModel(records, modelTag) {
  const rs = records.filter((r) => r.model === modelTag && r.judge && r.judge.ok);
  const total = records.filter((r) => r.model === modelTag).length;
  const n = rs.length;
  if (n === 0) return null;
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const passPct = (rs.filter((r) => r.judge.scores.pass).length / n) * 100;
  const avgExpr = avg(rs.map((r) => r.judge.scores.expression_quality));
  const fmtPct = (records.filter((r) => r.model === modelTag && r.formatValid).length / total) * 100;
  const avgLatency = avg(rs.map((r) => r.latencyMs));
  const avgTps = avg(rs.map((r) => r.tokensPerSec));

  const perType = {};
  for (const t of TYPES) {
    const typeRs = rs.filter((r) => typeOf(r.id) === t);
    perType[t] = typeRs.length ? (typeRs.filter((r) => r.judge.scores.pass).length / typeRs.length) * 100 : null;
  }
  return { n, passPct, avgExpr, fmtPct, avgLatency, avgTps, perType };
}

function buildRagOverviewTable(tiers) {
  const header = `| 모델 | ${tiers.map((t) => t.label).join(' | ')} |`;
  const sep = `|---|${tiers.map(() => '---').join('|')}|`;
  const rows = MODELS.map((m) => {
    const cells = tiers.map((t) => {
      const s = ragTierStatsByModel(t.records, m.tag);
      return s ? `${fmt(s.passPct)}%` : '-';
    });
    return `| ${m.label} | ${cells.join(' | ')} |`;
  });
  return [header, sep, ...rows].join('\n');
}

function buildRagTypeTable(records) {
  const header = `| 모델 | ${TYPES.join(' | ')} | 전체 |`;
  const sep = `|---|${TYPES.map(() => '---').join('|')}|---|`;
  const rows = MODELS.map((m) => {
    const s = ragTierStatsByModel(records, m.tag);
    if (!s) return `| ${m.label} | ${TYPES.map(() => '-').join(' | ')} | - |`;
    const cells = TYPES.map((t) => (s.perType[t] === null ? '-' : `${fmt(s.perType[t], 0)}%`));
    return `| ${m.label} | ${cells.join(' | ')} | ${fmt(s.passPct)}% |`;
  });
  return [header, sep, ...rows].join('\n');
}

function buildRagPerfTable(records) {
  const header = `| 모델 | 표현품질 | 포맷성공률 | 평균Latency(ms) | 평균TPS |`;
  const sep = `|---|---|---|---|---|`;
  const rows = MODELS.map((m) => {
    const s = ragTierStatsByModel(records, m.tag);
    if (!s) return `| ${m.label} | - | - | - | - |`;
    return `| ${m.label} | ${fmt(s.avgExpr, 2)}/5 | ${fmt(s.fmtPct)}% | ${fmt(s.avgLatency, 0)} | ${fmt(s.avgTps, 1)} |`;
  });
  return [header, sep, ...rows].join('\n');
}

// ---------- Main ----------

function main() {
  const faqEasyTable = buildFaqRoundTable('easy');
  const faqMediumTable = buildFaqRoundTable('medium');
  const faqHardTable = buildFaqRoundTable('hard');

  const ragSmall = loadJsonl(path.join(RAW_DIR, 'rag_stability_small.judged.jsonl'));
  const ragMedium = loadJsonl(path.join(RAW_DIR, 'rag_stability_medium.judged.jsonl'));
  const ragLarge = loadJsonl(path.join(RAW_DIR, 'rag_stability_large.judged.jsonl'));

  const tiers = [
    { label: 'Small (2~3개)', records: ragSmall },
    { label: 'Medium (3~5개)', records: ragMedium },
    { label: 'Large (10개)', records: ragLarge },
  ];

  const ragOverview = buildRagOverviewTable(tiers);
  const ragTypeSmall = buildRagTypeTable(ragSmall);
  const ragTypeMedium = buildRagTypeTable(ragMedium);
  const ragTypeLarge = buildRagTypeTable(ragLarge);
  const ragPerfSmall = buildRagPerfTable(ragSmall);
  const ragPerfMedium = buildRagPerfTable(ragMedium);
  const ragPerfLarge = buildRagPerfTable(ragLarge);

  const content = `# 종합 결과 요약

> 이 문서는 \`scripts/generate_summary.js\`로 \`results/raw/*.judged.jsonl\` 원본에서 자동 생성됩니다. **손으로 고치지 마세요** — 다음 실행 때 덮어써집니다. 각 라운드의 케이스별 상세(질문/답변/환각 내용 등)는 개별 결과 문서(\`results/faq_*_results.md\`)를 참고하세요.
>
> 생성 시각: ${new Date().toISOString()}

## 1. FAQ 답변 생성 라운드

정답 FAQ 1개를 주고 자연어로 얼마나 충실하게 재구성하는지 평가 (README 6절 1차 라운드). 자세한 케이스별 결과는 [\`faq_easy${RESULT_SUFFIX}_results.md\`](faq_easy${RESULT_SUFFIX}_results.md) / [\`faq_medium${RESULT_SUFFIX}_results.md\`](faq_medium${RESULT_SUFFIX}_results.md) / [\`faq_hard${RESULT_SUFFIX}_results.md\`](faq_hard${RESULT_SUFFIX}_results.md) 참고.

### Easy (직접 표현)

${faqEasyTable}

### Medium (구어체·간접 표현)

${faqMediumTable}

### Hard (장문·경쟁 FAQ)

${faqHardTable}

## 2. RAG 안정성 라운드 — 전체 적절 대응률

무관/빈/모순/부분정보/유사오답/노이즈/다중조합 7개 유형에 대해 컨텍스트 개수(3/5/10개)를 늘려가며 테스트 (README 7-1절). 자세한 케이스별 결과는 [\`faq_rag_stability_small${RESULT_SUFFIX}_results.md\`](faq_rag_stability_small${RESULT_SUFFIX}_results.md) / [\`faq_rag_stability_medium${RESULT_SUFFIX}_results.md\`](faq_rag_stability_medium${RESULT_SUFFIX}_results.md) / [\`faq_rag_stability_large${RESULT_SUFFIX}_results.md\`](faq_rag_stability_large${RESULT_SUFFIX}_results.md) 참고.

${ragOverview}

> 컨텍스트가 늘어날수록(Small→Large) 어떤 모델이 더 흔들리는지 한눈에 비교하는 표입니다. 유형별 세부 내역은 아래 3절 참고.

## 3. RAG 안정성 — 유형별(HR/EC/CF/PI/SR/NC/MC) 상세

**유형 설명**: HR=무관 FAQ · EC=빈 컨텍스트 · CF=모순 FAQ · PI=부분 정보 · SR=유사하지만 답 없음 · NC=정답+노이즈 · MC=다중 FAQ 조합

### 3-1. Small (컨텍스트 2~3개)

${ragTypeSmall}

**표현품질 · 속도**

${ragPerfSmall}

### 3-2. Medium (컨텍스트 3~5개)

${ragTypeMedium}

**표현품질 · 속도**

${ragPerfMedium}

### 3-3. Large (컨텍스트 10개)

${ragTypeLarge}

**표현품질 · 속도**

${ragPerfLarge}

## 4. 종합 관전 포인트

- **RAG 안정성이 최종 선정 기준의 핵심**이고, FAQ 라운드는 기본기 진단용 보조 자료입니다 (README 6절 논의 참고)
- 유형별 표에서 특정 모델이 어느 유형에서 유독 약한지 확인해보세요 — 예: EC(빈 컨텍스트)에서만 약하면 "모른다고 말하기"가 약점, CF(모순)에서만 약하면 "충돌 감지"가 약점인 식으로 원인이 다릅니다
- 의도 분류·클러스터 라벨링 라운드는 아직 실행 전이라 이 문서에 포함되지 않았습니다 (\`CLAUDE.md\` 참고)
`;

  const outPath = path.join(RESULTS_DIR, `summary_results${RESULT_SUFFIX}.md`);
  fs.writeFileSync(outPath, content, 'utf8');
  console.log(`Wrote ${outPath}`);
}

main();
