'use strict';
// Stage 3 (종합 리포트): reads every per-item scored file for a run_id and
// writes ONE human-readable markdown summary. This does not replace the
// per-item files (those stay separate, one per evaluation item, and remain
// the source of truth) — it's a read-only rollup for quick scanning.
// 집계(비율/평균)는 고유 문항(실행 회차=1, 300건)만 기준 — review.csv에는
// 380행 전부 남아있음.
//
//   results/reports/test2/<run_id>_summary.md
//
// Usage: node scripts/aggregate_report.js <run_id>

const fs = require('fs');
const path = require('path');
const { readAll } = require('./lib/jsonl');
const { parseCsvObjects } = require('./lib/csv');
const { isPrimaryRound } = require('./lib/rounds');

const ROOT = path.join(__dirname, '..', '..');
const CASES_PATH = path.join(ROOT, 'data', 'eval_sets', 'test_set2', 'cases.csv');

function pct(n) { return n === null || n === undefined ? 'N/A' : (n * 100).toFixed(1) + '%'; }
function num(n, d = 1) { return n === null || n === undefined || Number.isNaN(n) ? 'N/A' : n.toFixed(d); }
function readJsonIfExists(p) { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; }

function main() {
  const runId = process.argv[2];
  if (!runId) {
    console.error('usage: node scripts/aggregate_report.js <run_id>');
    process.exit(1);
  }
  const scoredDir = path.join(ROOT, 'results', 'scored', 'test2', runId);
  const genPath = path.join(ROOT, 'results', 'raw', 'test2', runId, 'generation.jsonl');

  const casesById = Object.fromEntries(
    parseCsvObjects(fs.readFileSync(CASES_PATH, 'utf8')).map((c) => [c['ID'], c])
  );
  const isPrimary = (row) => { const c = casesById[row.id]; return c ? isPrimaryRound(c) : true; };

  const generation = readAll(genPath);
  const modelTag = generation[0] ? generation[0].model_tag : 'unknown';
  const env = generation[0] ? generation[0].env : 'unknown';
  const primaryN = generation.filter(isPrimary).length;

  const perfSummary = readJsonIfExists(path.join(scoredDir, 'performance_summary.json'));
  const absenceSummary = readJsonIfExists(path.join(scoredDir, 'absence_detection_summary.json'));
  const repeatSummary = readJsonIfExists(path.join(scoredDir, 'repeat_consistency_summary.json'));
  const answerAcc = readAll(path.join(scoredDir, 'answer_accuracy.jsonl')).filter(isPrimary);
  const faithfulness = readAll(path.join(scoredDir, 'rag_faithfulness.jsonl')).filter(isPrimary);
  const escalation = readAll(path.join(scoredDir, 'escalation.jsonl'));
  const expression = readAll(path.join(scoredDir, 'expression_quality.jsonl')).filter(isPrimary);

  const simPassN = answerAcc.filter((r) => r.similarity_pass).length;
  const avgSim = answerAcc.length
    ? answerAcc.reduce((s, r) => s + (r.bge_m3_similarity || 0), 0) / answerAcc.length : null;
  const kwRows = answerAcc.filter((r) => r.keyword_coverage != null);
  const avgKw = kwRows.length ? kwRows.reduce((s, r) => s + r.keyword_coverage, 0) / kwRows.length : null;

  const scoredFaith = faithfulness.filter((r) => !r.status_based_skip);
  const faithfulN = scoredFaith.filter((r) => r.faithful).length;
  const skippedFaith = faithfulness.length - scoredFaith.length;

  const flaggedN = escalation.filter((r) => r.needs_review).length;
  const avgExpr = expression.length ? expression.reduce((s, r) => s + r.score, 0) / expression.length : null;
  const disqualifiedN = expression.filter((r) => r.disqualified).length;

  const lines = [];
  lines.push(`# 결과 요약 — ${runId}`);
  lines.push('');
  lines.push(`> 자동 생성 문서입니다 (\`scripts/aggregate_report.js\`). 손으로 고치지 마세요 — 재실행 시 덮어써집니다.`);
  lines.push(`> 생성 시각: ${new Date().toISOString()}`);
  lines.push(`> 비율/평균은 **고유 문항(실행 회차=1, ${primaryN}건)** 기준입니다. 반복 대상 문항의 2·3회차는 반복 일관성 지표에서만 쓰입니다.`);
  lines.push('');
  lines.push(`- 모델: \`${modelTag}\``);
  lines.push(`- 실행 환경: \`${env}\``);
  lines.push(`- 전체 실행 건수: ${generation.length} (고유 문항 ${primaryN}건 + 반복 회차 ${generation.length - primaryN}건)`);
  lines.push(`- 사람이 읽을 통합 파일: \`review.csv\` (질문/정답/LLM답변/전체 점수/재확인필요여부 한 행에)`);
  lines.push('');
  lines.push('## 항목별 결과');
  lines.push('');
  lines.push('| 항목 | 지표 | 값 | 상세 파일 |');
  lines.push('|---|---|---|---|');
  lines.push(`| 1. 답변정확도 | BGE-M3 유사도 통과율 | ${pct(simPassN / (answerAcc.length || 1))} (avg sim ${num(avgSim, 3)}) | answer_accuracy.jsonl |`);
  lines.push(`| 1. 답변정확도 | 키워드 커버리지(평균) | ${pct(avgKw)} | answer_accuracy.jsonl |`);
  lines.push(`| 2. RAG충실도 | Faithful 비율 | ${pct(faithfulN / (scoredFaith.length || 1))} (스킵 ${skippedFaith}건: ABSTAIN/CLARIFY/OUT_OF_SCOPE) | rag_faithfulness.jsonl |`);
  if (absenceSummary) {
    lines.push(`| 3. FAQ부재판단 | Precision / Recall / F1 | ${num(absenceSummary.precision, 3)} / ${num(absenceSummary.recall, 3)} / ${num(absenceSummary.f1, 3)} | absence_detection.jsonl |`);
  }
  lines.push(`| 5. 표현품질 | 평균 점수 / 실격 비율 | ${num(avgExpr, 1)}점 / ${pct(disqualifiedN / (expression.length || 1))} | expression_quality.jsonl |`);
  if (perfSummary) {
    lines.push(`| 6. 명령수행능력 | 포맷 성공률 | ${pct(perfSummary.format_success_rate)} | format_success.jsonl |`);
    lines.push(`| 7. 성능 | 평균 Latency / P95 | ${num(perfSummary.latency_ms.avg, 0)}ms / ${num(perfSummary.latency_ms.p95, 0)}ms | performance.jsonl |`);
    lines.push(`| 7. 성능 | 평균 TPS | ${num(perfSummary.tps.avg, 1)} | performance.jsonl |`);
  }
  if (repeatSummary) {
    lines.push(`| 반복 일관성 | 사실(상태+숫자) 일치율 | ${pct(repeatSummary.overall_consistency_rate)} (${repeatSummary.n}개 반복문항) | repeat_consistency.jsonl |`);
    lines.push(`| 반복 일관성 | status 일치 / 숫자 일치 / evidence_ids 일치 | ${pct(repeatSummary.status_consistency_rate)} / ${pct(repeatSummary.numbers_consistency_rate)} / ${pct(repeatSummary.evidence_consistency_rate)} | repeat_consistency.jsonl |`);
  }
  lines.push(`| (에스컬레이션) | LLM 재판단 필요 비율 | ${pct(flaggedN / (escalation.length || 1))} (${flaggedN}/${escalation.length}건, 380행 전체 기준) | escalation.jsonl, review.csv |`);
  lines.push('');

  if (flaggedN > 0) {
    lines.push('## 재판단 필요 케이스 (상위 20건, 전체는 review.csv 참고)');
    lines.push('');
    lines.push('| ID | 사유 |');
    lines.push('|---|---|');
    for (const r of escalation.filter((e) => e.needs_review).slice(0, 20)) {
      lines.push(`| ${r.id} | ${r.reasons.join('; ')} |`);
    }
    lines.push('');
  }

  const outDir = path.join(ROOT, 'results', 'reports', 'test2');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${runId}_summary.md`);
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`요약 리포트 -> ${outPath}`);
}

main();
