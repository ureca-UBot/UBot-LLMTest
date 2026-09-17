'use strict';
// 프롬프트 안 비교: 같은 모델로 프롬프트만 바꿔 돌린 run_id 여러 개의 채점
// 결과를 한 문서로 모음. run_prompt_test.js가 마지막 단계로 부르며, 따로
// 실행해도 됨. 각 run_id의 채점 파일(score_*.js 출력)을 읽기만 함.
//
// 집계는 aggregate_report.js와 같이 고유 문항(실행 회차=1)만 기준.
// 분모 원칙: 답변정확도·status 일치율은 "생성한 전체 문항"을 분모로 둔다 —
// 포맷이 깨져 채점이 안 된 문항을 분모에서 빼면 출력이 자주 깨지는 안이
// 오히려 유리해지기 때문.
//
// Usage:
//   node scripts/test2/compare_prompts.js <run_id> <run_id> [...] [--out <md 경로>]

const fs = require('fs');
const path = require('path');
const { readAll } = require('./lib/jsonl');
const { parseCsvObjects } = require('./lib/csv');
const { isPrimaryRound } = require('./lib/rounds');
const { expectedStatusEnum } = require('./lib/status_map');
const { PROMPT_NOTES } = require('./lib/prompts');

const ROOT = path.join(__dirname, '..', '..');
const CASES_PATH = path.join(ROOT, 'data', 'eval_sets', 'test_set2', 'cases.csv');
const STATUSES = ['ANSWER', 'PARTIAL', 'CLARIFY', 'ABSTAIN', 'CONFLICT', 'OUT_OF_SCOPE'];
const SMALL_SAMPLE = 10;

function readJsonIfExists(p) { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; }
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
function p95(arr) {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
}
const isNum = (v) => typeof v === 'number' && !Number.isNaN(v);
function pct(v) { return isNum(v) ? `${(v * 100).toFixed(1)}%` : 'N/A'; }
function num(v, d = 1) { return isNum(v) ? v.toFixed(d) : 'N/A'; }
function diffPp(v, base) {
  if (!isNum(v) || !isNum(base)) return '';
  const d = (v - base) * 100;
  return ` (${d >= 0 ? '+' : ''}${d.toFixed(1)}%p)`;
}
function diffNum(v, base, d = 1, unit = '') {
  if (!isNum(v) || !isNum(base)) return '';
  const x = v - base;
  return ` (${x >= 0 ? '+' : ''}${x.toFixed(d)}${unit})`;
}

function loadCases() {
  return Object.fromEntries(parseCsvObjects(fs.readFileSync(CASES_PATH, 'utf8')).map((c) => [c['ID'], c]));
}

function summarizeRun(runId, casesById) {
  const rawDir = path.join(ROOT, 'results', 'raw', 'test2', runId);
  const scoredDir = path.join(ROOT, 'results', 'scored', 'test2', runId);
  const isPrimary = (r) => { const c = casesById[r.id]; return c ? isPrimaryRound(c) : true; };

  const gen = readAll(path.join(rawDir, 'generation.jsonl')).filter(isPrimary);
  if (gen.length === 0) return { runId, missing: true };
  const n = gen.length;
  const first = gen[0];

  const perf = readJsonIfExists(path.join(scoredDir, 'performance_summary.json'));
  const absence = readJsonIfExists(path.join(scoredDir, 'absence_detection_summary.json'));
  const acc = readAll(path.join(scoredDir, 'answer_accuracy.jsonl')).filter(isPrimary);
  const faith = readAll(path.join(scoredDir, 'rag_faithfulness.jsonl')).filter(isPrimary);
  const expr = readAll(path.join(scoredDir, 'expression_quality.jsonl')).filter(isPrimary);

  // status 6분류 일치율 + 기대 상태별 맞힌 비율
  let statusMatch = 0;
  const byExpected = Object.fromEntries(STATUSES.map((s) => [s, { n: 0, hit: 0 }]));
  for (const r of gen) {
    const c = casesById[r.id];
    const expected = expectedStatusEnum(c && c['기대 응답 상태']);
    const predicted = r.parsed ? r.parsed.status : null;
    if (!expected) continue;
    byExpected[expected].n++;
    if (predicted === expected) { statusMatch++; byExpected[expected].hit++; }
  }

  const faithScored = faith.filter((r) => !r.status_based_skip);
  const exprScores = expr.map((r) => r.score).filter(isNum);

  // 모델 로드 시간을 뺀 추론 지연 (wall_ms에는 첫 호출의 로드 시간이 섞임)
  const inferMs = gen
    .filter((r) => r.timing && r.timing.total_duration_ns)
    .map((r) => (r.timing.total_duration_ns - (r.timing.load_duration_ns || 0)) / 1e6);
  const outTokens = gen.filter((r) => r.timing && r.timing.eval_count).map((r) => r.timing.eval_count);

  return {
    runId,
    missing: false,
    variant: first.prompt_variant || '(미기록)',
    model: first.model_tag,
    env: first.env,
    inference: first.inference || null,
    n,
    errors: gen.filter((r) => r.error).length,
    format: perf ? perf.format_success_rate : gen.filter((r) => r.format_pass).length / n,
    accuracy: acc.filter((r) => r.pass).length / n,
    faithful: faithScored.length ? faithScored.filter((r) => r.faithful).length / faithScored.length : null,
    faithSkipped: faith.length - faithScored.length,
    absence,
    statusMatch: statusMatch / n,
    byExpected,
    expression: avg(exprScores),
    disqualified: expr.length ? expr.filter((r) => r.disqualified).length / expr.length : null,
    latencyAvg: avg(inferMs),
    latencyP95: p95(inferMs),
    tps: perf ? perf.tps.avg : null,
    outTokens: avg(outTokens),
  };
}

function relLink(fromFile, target) {
  return path.relative(path.dirname(fromFile), target).split(path.sep).join('/');
}

// failed: 문서에 적을 실패 안 설명 문자열 목록
function buildMarkdown(runIds, { outPath, failed = [], title } = {}) {
  const casesById = loadCases();
  const runs = runIds.map((id) => summarizeRun(id, casesById));
  const ok = runs.filter((r) => !r.missing);
  const missing = runs.filter((r) => r.missing).map((r) => r.runId);
  const base = ok.find((r) => r.variant === 'v0_baseline') || null;
  const linkBase = outPath || path.join(ROOT, 'results', 'reports', 'test2', 'compare.md');

  const L = [];
  const model = ok[0] ? ok[0].model : '?';
  L.push(`# ${title || `프롬프트 비교 — ${model}`}`);
  L.push('');
  L.push('> 자동 생성 문서입니다 (`scripts/test2/compare_prompts.js`). 같은 날짜로 다시 실행하면 덮어써집니다. "사람 판단" 칸을 채웠다면 파일을 다른 이름으로 복사해 두세요.');
  L.push(`> 생성 시각: ${new Date().toISOString()}`);
  L.push('');

  L.push('## 실행 조건');
  L.push('');
  L.push(`- 모델: \`${model}\``);
  L.push(`- 실행 환경: \`${ok[0] ? ok[0].env : '?'}\``);
  L.push(`- 추론 설정: \`${JSON.stringify(ok[0] ? ok[0].inference : null)}\` (think가 null이면 thinking을 지원하지 않는 모델이라 보내지 않은 것)`);
  const inferenceSet = new Set(ok.map((r) => JSON.stringify(r.inference)));
  const modelSet = new Set(ok.map((r) => r.model));
  if (inferenceSet.size > 1 || modelSet.size > 1) {
    L.push('- ⚠️ **안끼리 모델 또는 추론 설정이 다릅니다. 이 비교는 공정하지 않습니다.**');
  }
  L.push(`- 문항 수: 안마다 고유 문항(실행 회차=1) ${ok.map((r) => r.n).join(' / ')}건`);
  L.push('');
  L.push('| 안 | run_id | 바꾼 것 | 확인할 것 |');
  L.push('|---|---|---|---|');
  for (const r of ok) {
    const note = PROMPT_NOTES[r.variant] || { changed: '-', hypothesis: '-' };
    L.push(`| ${r.variant} | \`${r.runId}\` | ${note.changed} | ${note.hypothesis} |`);
  }
  L.push('');

  if (failed.length || missing.length) {
    L.push('## ⚠️ 실패하거나 결과가 없는 안');
    L.push('');
    for (const f of failed) L.push(`- ${f}`);
    for (const m of missing) L.push(`- \`${m}\`: generation.jsonl이 없거나 비어 있음`);
    L.push('');
  }

  if (ok.length === 0) {
    L.push('비교할 결과가 없습니다.');
    L.push('');
    return L.join('\n');
  }

  L.push('## 지표 비교');
  L.push('');
  L.push(base ? '괄호 안은 v0_baseline 대비 차이입니다.' : '⚠️ v0_baseline 결과가 없어 차이를 계산하지 않았습니다.');
  L.push('');
  L.push(`| 지표 | ${ok.map((r) => r.variant).join(' | ')} |`);
  L.push(`|---|${ok.map(() => '---:').join('|')}|`);
  const row = (label, fn) => L.push(`| ${label} | ${ok.map((r) => fn(r)).join(' | ')} |`);
  const vsBase = (r, s) => (r === base ? '' : s);
  const bf = (key) => (base ? base[key] : null);
  const baseF1 = base && base.absence ? base.absence.f1 : null;

  row('6. 포맷 성공률', (r) => pct(r.format) + vsBase(r, diffPp(r.format, bf('format'))));
  row('1. 답변정확도 (통과 / 전체 문항)', (r) => pct(r.accuracy) + vsBase(r, diffPp(r.accuracy, bf('accuracy'))));
  row('2. RAG 충실도', (r) => pct(r.faithful) + vsBase(r, diffPp(r.faithful, bf('faithful'))));
  row('└ 충실도 채점 제외 (보류·확인요청·범위밖)', (r) => `${r.faithSkipped}건`);
  row('3. 부재판단 Precision', (r) => num(r.absence && r.absence.precision, 3));
  row('3. 부재판단 Recall', (r) => num(r.absence && r.absence.recall, 3));
  row('3. 부재판단 F1', (r) => num(r.absence && r.absence.f1, 3) + vsBase(r, diffNum(r.absence && r.absence.f1, baseF1, 3)));
  row('└ 과잉 보류 (답할 수 있는데 ABSTAIN)', (r) => (r.absence ? `${r.absence.confusion.fp}건` : 'N/A'));
  row('status 6분류 일치율', (r) => pct(r.statusMatch) + vsBase(r, diffPp(r.statusMatch, bf('statusMatch'))));
  row('5. 표현품질 평균 점수', (r) => num(r.expression, 1) + vsBase(r, diffNum(r.expression, bf('expression'), 1)));
  row('5. 표현품질 실격 비율', (r) => pct(r.disqualified));
  row('7. 평균 지연 (로드 제외)', (r) => `${num(r.latencyAvg, 0)}ms${vsBase(r, diffNum(r.latencyAvg, bf('latencyAvg'), 0, 'ms'))}`);
  row('7. P95 지연 (로드 제외)', (r) => `${num(r.latencyP95, 0)}ms`);
  row('7. 평균 TPS', (r) => num(r.tps, 1));
  row('평균 출력 토큰 수', (r) => num(r.outTokens, 0));
  row('모델 호출 오류', (r) => `${r.errors}건`);
  L.push('');

  L.push('## 기대 상태별 status 맞힌 비율');
  L.push('');
  L.push(`| 기대 상태 | 문항 수 | ${ok.map((r) => r.variant).join(' | ')} |`);
  L.push(`|---|---:|${ok.map(() => '---:').join('|')}|`);
  for (const s of STATUSES) {
    const cnt = ok[0].byExpected[s].n;
    const flag = cnt < SMALL_SAMPLE ? ' ⚠️' : '';
    const cells = ok.map((r) => {
      const e = r.byExpected[s];
      return e.n ? `${pct(e.hit / e.n)} (${e.hit}/${e.n})` : 'N/A';
    });
    L.push(`| ${s}${flag} | ${cnt} | ${cells.join(' | ')} |`);
  }
  L.push('');
  L.push(`⚠️ 표시는 문항이 ${SMALL_SAMPLE}건 미만이라 1~2건 차이로 비율이 크게 흔들립니다. 결론의 근거로 쓰지 마세요.`);
  L.push('');

  L.push('## 읽을 때 주의할 점');
  L.push('');
  L.push('- **답변정확도**는 통과 건수를 생성한 전체 문항 수로 나눈 값입니다. 포맷이 깨져 채점하지 못한 문항은 실패로 셉니다. 그래서 안별 요약 리포트의 수치와 다를 수 있습니다.');
  L.push('- **RAG 충실도**는 ABSTAIN/CLARIFY/OUT_OF_SCOPE로 답한 문항을 채점에서 뺍니다. 보류를 많이 하는 안은 채점 대상이 줄어 충실도가 좋아 보일 수 있으니 "채점 제외"와 "과잉 보류"를 같이 보세요.');
  L.push('- **지연 시간**은 모델 로드 시간을 뺀 값이고, 같은 컴퓨터에서 차례로 실행했을 때만 안끼리 비교할 수 있습니다.');
  L.push('- temperature 0, seed 고정으로 한 번 실행한 결과입니다. 반복 일관성은 이 비교에서 재지 않습니다.');
  L.push('');

  L.push('## 안별 상세 결과');
  L.push('');
  for (const r of ok) {
    const summary = path.join(ROOT, 'results', 'reports', 'test2', `${r.runId}_summary.md`);
    const review = path.join(ROOT, 'results', 'scored', 'test2', r.runId, 'review.csv');
    L.push(`- ${r.variant}: [요약 리포트](${relLink(linkBase, summary)}) · [review.csv](${relLink(linkBase, review)})`);
  }
  L.push('');

  L.push('## 사람 판단');
  L.push('');
  L.push('- 채택할 안:');
  L.push('- 근거:');
  L.push('- 다른 모델로 확인할 안:');
  L.push('- 메모:');
  L.push('');
  return L.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const runIds = [];
  let outPath = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out') outPath = path.resolve(args[++i]);
    else runIds.push(args[i]);
  }
  if (runIds.length < 1) {
    console.error('usage: node scripts/test2/compare_prompts.js <run_id> <run_id> [...] [--out <md 경로>]');
    process.exit(1);
  }
  const md = buildMarkdown(runIds, { outPath });
  if (outPath) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, md, 'utf8');
    console.log(`비교 문서 -> ${outPath}`);
  } else {
    console.log(md);
  }
}

if (require.main === module) main();

module.exports = { buildMarkdown, summarizeRun };
