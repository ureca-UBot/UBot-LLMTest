'use strict';
// 프롬프트 안별 결과를 한 문서로 모은다. run_prompt_test.js가 마지막에 부르고,
// 따로 실행해도 된다. 이미 채점된 파일만 읽으며 모델을 호출하지 않는다.
//
// 경로는 lib/collect.js(= results/{raw,scored}/<suite>/...)를 쓴다. suite는
// LLM_TEST_SUITE로 정해지며 기본값은 config/models.js의 test3다.
//
// 대조군(v0_baseline)은 기존 추론 off 라운드(t0_nothink) run을 쓴다 — 프롬프트와
// 생성 조건이 같으므로 다시 돌릴 필요가 없다.
//
// Usage:
//   node scripts/test3/compare_prompts.js --model qwen3:14b [--date 20260922]
//     [--variants a,b] [--baseline <run_id>] [--out <md 경로>] [--limit-tag N]
//     [--failed "v1_x:exit 1;..."]

const fs = require('fs');
const path = require('path');
const models = require('./config/models');
const { ROOT, sanitizeTag } = require('./lib/runner');
const { collectRun, loadPrimaryCases, findRunId, readJsonl, readJson } = require('./lib/collect');
const { parseCsvObjects } = require('../test2/lib/csv');
const { expectedStatusEnum } = require('../test2/lib/status_map');
const { SYSTEM_PROMPTS, PROMPT_NOTES } = require('../test2/lib/prompts');

const SUITE = models.suite;
const CONDITION_SUFFIX = 't0_nothink';
const BASELINE = 'v0_baseline';
const STATUSES = ['ANSWER', 'PARTIAL', 'CLARIFY', 'ABSTAIN', 'CONFLICT', 'OUT_OF_SCOPE'];
// 유형별 문항이 이보다 적으면 1~2문항 차이로 비율이 크게 흔들려 결론 근거로 못 쓴다.
const SMALL_TYPE_N = 10;

const pct = (v, d = 1) => (v === null || v === undefined ? '-' : (100 * v).toFixed(d) + '%');
const num = (v, d = 0, unit = '') => (v === null || v === undefined ? '-' : v.toFixed(d) + unit);
const signedPp = (v) => (v === null || v === undefined ? '' : ` (${v >= 0 ? '+' : ''}${(100 * v).toFixed(1)}%p)`);
const signedNum = (v, d = 0, unit = '') => (v === null || v === undefined ? '' : ` (${v >= 0 ? '+' : ''}${v.toFixed(d)}${unit})`);
const table = (header, rows) => [
  `| ${header.join(' | ')} |`,
  `|${header.map(() => '---').join('|')}|`,
  ...rows.map((r) => `| ${r.join(' | ')} |`),
].join('\n');

function parseArgs(argv) {
  const o = { model: null, date: null, variants: null, baseline: null, out: null, limitTag: null, failed: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--model') o.model = argv[++i];
    else if (a === '--date') o.date = argv[++i];
    else if (a === '--variants') o.variants = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--baseline') o.baseline = argv[++i];
    else if (a === '--out') o.out = path.resolve(argv[++i]);
    else if (a === '--limit-tag') o.limitTag = argv[++i];
    else if (a === '--failed') o.failed = argv[++i].split(';').filter(Boolean);
  }
  return o;
}

// 고유 문항(회차1)의 ID -> {유형, 기대 status}
function loadCaseIndex() {
  const rows = parseCsvObjects(fs.readFileSync(
    path.join(ROOT, 'data', 'eval_sets', 'test_set2', 'cases.csv'), 'utf8'));
  const idx = new Map();
  for (const r of rows) {
    if (r['실행 회차'] !== '1') continue;
    idx.set(r['ID'], { type: r['유형'], expected: expectedStatusEnum(r['기대 응답 상태']) });
  }
  return idx;
}

// 한 run의 문항별 status 판정 결과. 채점 파일이 아니라 생성 결과에서 직접 만든다.
function statusByCase(suite, runId, caseIdx) {
  const gen = readJsonl(path.join(ROOT, 'results', 'raw', suite, runId, 'generation.jsonl'));
  if (!gen) return null;
  const out = new Map();
  for (const r of gen) {
    const c = caseIdx.get(r.id);
    if (!c) continue; // 반복 회차 행은 비교에서 제외
    out.set(r.id, {
      type: c.type,
      expected: c.expected,
      predicted: r.parsed ? r.parsed.status : null,
      hit: !!(r.parsed && c.expected && r.parsed.status === c.expected),
      promptVariant: r.prompt_variant || BASELINE,
      genParams: r.gen_params || null,
    });
  }
  return out;
}

function typeStats(statusMap) {
  const byType = new Map();
  for (const v of statusMap.values()) {
    if (!byType.has(v.type)) byType.set(v.type, { n: 0, hit: 0 });
    const t = byType.get(v.type);
    t.n++;
    if (v.hit) t.hit++;
  }
  return byType;
}

// 같은 문항을 짝지어 비교한다 — 문항이 동일하므로 비율 차이보다 이게 정확하다.
function pairedDiff(base, cand) {
  const shared = [...cand.keys()].filter((id) => base.has(id));
  const gained = shared.filter((id) => !base.get(id).hit && cand.get(id).hit);
  const lost = shared.filter((id) => base.get(id).hit && !cand.get(id).hit);
  const byType = new Map();
  for (const id of shared) {
    const t = cand.get(id).type;
    if (!byType.has(t)) byType.set(t, { n: 0, gained: 0, lost: 0 });
    const e = byType.get(t);
    e.n++;
    if (!base.get(id).hit && cand.get(id).hit) e.gained++;
    if (base.get(id).hit && !cand.get(id).hit) e.lost++;
  }
  // 오분류 패턴(기대->실제) 상위
  const patterns = new Map();
  for (const id of shared) {
    const v = cand.get(id);
    if (v.hit) continue;
    const key = `${v.type} · ${v.expected}→${v.predicted || '없음'}`;
    patterns.set(key, (patterns.get(key) || 0) + 1);
  }
  return {
    n_shared: shared.length,
    gained: gained.length,
    lost: lost.length,
    net: gained.length - lost.length,
    gained_ids: gained,
    lost_ids: lost,
    by_type: byType,
    top_failures: [...patterns.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
  };
}

function resolveRuns(model, date, variants, baselineOverride) {
  const slug = sanitizeTag(model);
  const runs = [];
  const baseId = baselineOverride || findRunId(SUITE, model, CONDITION_SUFFIX);
  runs.push({ variant: BASELINE, runId: baseId, reused: !baselineOverride && !!baseId });
  for (const v of variants) {
    // date를 주면 그 날짜 run을, 없으면 가장 최신 run을 쓴다.
    const condition = `${v}_${CONDITION_SUFFIX}`;
    let runId = findRunId(SUITE, model, condition);
    if (date) {
      const base = path.join(ROOT, 'results', 'scored', SUITE);
      const exact = fs.existsSync(base)
        ? fs.readdirSync(base).filter((d) => d.includes(`_${slug}_${condition}_`) && d.endsWith(date)).sort()
        : [];
      if (exact.length) runId = exact[exact.length - 1];
    }
    runs.push({ variant: v, runId, reused: false });
  }
  return runs;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.model) {
    console.error('usage: node scripts/test3/compare_prompts.js --model <tag> [--date YYYYMMDD]'
      + '\n  [--variants a,b] [--baseline <run_id>] [--out <md 경로>]');
    process.exit(1);
  }
  const variants = (opts.variants || Object.keys(SYSTEM_PROMPTS).filter((v) => v !== BASELINE))
    .filter((v) => v !== BASELINE);
  const caseIdx = loadCaseIndex();
  const primary = loadPrimaryCases();
  const ragCheck = readJson(path.join(ROOT, 'results', 'scored', SUITE, 'rag_rule_ranking_check.json'));

  const resolved = resolveRuns(opts.model, opts.date, variants, opts.baseline);
  const rows = [];
  const missing = [];
  for (const r of resolved) {
    if (!r.runId) { missing.push(`${r.variant}: 해당 조건의 run을 찾지 못했습니다.`); continue; }
    const metrics = collectRun(SUITE, r.runId, primary);
    const statuses = statusByCase(SUITE, r.runId, caseIdx);
    if (!metrics || !statuses) { missing.push(`${r.variant} (${r.runId}): 결과 파일이 없습니다.`); continue; }
    rows.push({ ...r, metrics, statuses, types: typeStats(statuses) });
  }
  const base = rows.find((r) => r.variant === BASELINE);
  const cands = rows.filter((r) => r.variant !== BASELINE);
  if (!rows.length) {
    console.error('비교할 결과가 없습니다.');
    for (const m of missing) console.error('  - ' + m);
    process.exit(1);
  }

  for (const c of cands) c.diff = base ? pairedDiff(base.statuses, c.statuses) : null;

  const L = [];
  const tag = opts.limitTag ? ` · 문항 ${opts.limitTag}건만` : '';
  L.push(`# 프롬프트 비교 — ${opts.model} (${SUITE}${tag})`, '');
  L.push('> 자동 생성 문서입니다 (`scripts/test3/compare_prompts.js`). 같은 이름으로 다시 생성하면 덮어써집니다.');
  L.push('> "사람 판단" 칸을 채웠다면 파일을 복사해 두세요.');
  L.push(`> 생성 시각: ${new Date().toISOString()}`, '');

  // ── 실행 조건 ──────────────────────────────────────────────────────────
  L.push('## 측정 조건', '');
  L.push(`- 모델: \`${opts.model}\` 고정. **프롬프트만 바꿨다.**`);
  L.push('- temperature 0 · 추론(thinking) 모드 끔 · seed 미고정 · 고유 문항(실행 회차 1)만');
  L.push('- 평가 데이터셋: `data/eval_sets/test_set2/cases.csv` — test2·test3와 동일');
  L.push(`- 대조군(\`${BASELINE}\`)은 ${base && base.reused ? '기존 추론 off 라운드 결과를 그대로 썼다' : '이번에 새로 생성했다'}.`);
  L.push('- 추론을 끈 이유: `results/test3/think_ablation_results.md` — 추론을 켜면 P95가 상담 실용선을 크게 넘는다.', '');
  L.push(table(['안', 'run_id', '바꾼 것', '겨냥한 약점'],
    rows.map((r) => {
      const note = PROMPT_NOTES[r.variant] || { changed: '-', target: '-' };
      return [r.variant, '`' + r.runId + '`', note.changed, note.target];
    })), '');

  const paramSet = new Set(rows.map((r) => JSON.stringify(r.metrics.gen_params)));
  if (paramSet.size > 1) {
    L.push('⚠️ **안끼리 생성 파라미터가 다릅니다. 프롬프트 효과만 떼어 볼 수 없습니다.**', '');
    L.push(table(['안', 'gen_params'], rows.map((r) => [r.variant, '`' + JSON.stringify(r.metrics.gen_params) + '`'])), '');
  }
  if (missing.length || opts.failed.length) {
    L.push('### ⚠️ 빠진 안', '');
    for (const m of missing) L.push(`- ${m}`);
    for (const f of opts.failed) L.push(`- 파이프라인 실패: ${f}`);
    L.push('');
  }

  // ── 전체 비교표 (results/test3/summary_results.md와 같은 열 구성) ────────
  L.push('## 전체 비교표', '');
  L.push('`results/test3/summary_results.md`의 모델별 표와 같은 열 구성이다. 괄호는 v0 대비 차이.', '');
  const cell = (r, get, fmt, diffFmt) => {
    const v = get(r.metrics);
    const b = base ? get(base.metrics) : null;
    const d = (v === null || v === undefined || b === null || b === undefined) ? null : v - b;
    return fmt(v) + (r === base ? '' : diffFmt(d));
  };
  const ppCell = (r, get) => cell(r, get, (v) => pct(v), signedPp);
  L.push(table(
    ['안', '내용 정확도(AI)', '근거율(AI)', 'RAG 근거율(결정론)', '기대 상태 일치', '부재판단 F1',
      '포맷 성공률', '평균 출력 토큰', '평균 지연', 'P95'],
    rows.map((r) => [
      r.variant,
      ppCell(r, (m) => (m.llm_judge ? m.llm_judge.correct_rate : null)),
      ppCell(r, (m) => (m.llm_judge ? m.llm_judge.is_grounded_rate : null)),
      cell(r, (m) => (m.rag_rule ? m.rag_rule.rate : null), (v) => pct(v), signedPp)
        + (r.metrics.rag_rule ? ` (n=${r.metrics.rag_rule.n_scored})` : ''),
      ppCell(r, (m) => m.status_match),
      cell(r, (m) => m.absence_f1, (v) => num(v, 3), (d) => signedNum(d, 3)),
      ppCell(r, (m) => m.format_success_rate),
      cell(r, (m) => m.avg_eval_count, (v) => num(v, 0), (d) => signedNum(d, 0)),
      cell(r, (m) => (m.latency_avg_ms === null ? null : m.latency_avg_ms / 1000), (v) => num(v, 2, 's'), (d) => signedNum(d, 2, 's')),
      cell(r, (m) => (m.latency_p95_ms === null ? null : m.latency_p95_ms / 1000), (v) => num(v, 2, 's'), (d) => signedNum(d, 2, 's')),
    ])), '');
  L.push('- 내용 정확도·근거율(AI)은 LLM Judge 채점 결과다. 아직 채점하지 않았으면 `-`다.');
  if (ragCheck) {
    L.push(`- RAG 근거율(결정론)은 절대값이 실제보다 낮다. 편향이 고루 걸려 순위 비교로는 쓸 수 있다고 확인했다`
      + `(Spearman rho ${ragCheck.rho_all_vs_premise_complete}, [검증](../scored/${SUITE}/rag_rule_ranking_check.json)).`
      + ' 다만 여기서는 같은 모델·같은 문항이라 편향이 동일하게 걸리므로 안끼리 차이를 보는 용도로는 더 안전하다.');
  }
  L.push('- `n`은 근거 대조를 한 문항 수다. 보류로 답한 문항은 분모에서 빠지므로, 보류가 늘면 `n`이 줄어든다.', '');

  // ── v0 대비 개선/퇴보 한눈에 ────────────────────────────────────────────
  if (base && cands.length) {
    L.push('## v0 대비 개선·퇴보 요약', '');
    L.push('같은 문항끼리 짝지어 비교한 결과다. **개선**은 v0에서 틀렸다가 맞은 문항 수,');
    L.push('**퇴보**는 v0에서 맞았다가 틀린 문항 수다. 비율 차이보다 이 짝 비교가 정확하다.', '');
    L.push(table(['안', '개선', '퇴보', '순증', '기대 상태 일치', '지연 변화', '한 줄 판정'],
      cands.map((c) => {
        const d = c.diff;
        const sm = c.metrics.status_match - base.metrics.status_match;
        const lat = (c.metrics.latency_avg_ms === null || base.metrics.latency_avg_ms === null)
          ? null : (c.metrics.latency_avg_ms - base.metrics.latency_avg_ms) / 1000;
        const verdict = d.net > 0 && d.lost <= d.gained / 2 ? '개선'
          : d.net > 0 ? '개선(퇴보 동반)'
            : d.net === 0 ? '차이 없음' : '퇴보';
        return [c.variant, `+${d.gained}문항`, `-${d.lost}문항`,
          `${d.net >= 0 ? '+' : ''}${d.net}문항`, pct(c.metrics.status_match) + signedPp(sm),
          lat === null ? '-' : `${lat >= 0 ? '+' : ''}${lat.toFixed(2)}s`, verdict];
      })), '');
    for (const c of cands) {
      const d = c.diff;
      const byType = [...d.by_type.entries()].filter(([, e]) => e.gained || e.lost)
        .sort((a, b) => (b[1].gained - b[1].lost) - (a[1].gained - a[1].lost));
      L.push(`### ${c.variant}`, '');
      const up = byType.filter(([, e]) => e.gained - e.lost > 0)
        .map(([t, e]) => `${t} +${e.gained - e.lost}`);
      const down = byType.filter(([, e]) => e.gained - e.lost < 0)
        .map(([t, e]) => `${t} ${e.gained - e.lost}`);
      L.push(`- 좋아진 유형: ${up.length ? up.join(' · ') : '없음'}`);
      L.push(`- 나빠진 유형: ${down.length ? down.join(' · ') : '없음'}`);
      if (d.top_failures.length) {
        L.push(`- 남은 오분류 상위: ${d.top_failures.slice(0, 4).map(([k, n]) => `${k} ${n}건`).join(' · ')}`);
      }
      if (d.lost_ids.length) L.push(`- 퇴보한 문항: ${d.lost_ids.slice(0, 12).join(', ')}${d.lost_ids.length > 12 ? ' …' : ''}`);
      L.push('');
    }
  }

  // ── 유형별 상세 ─────────────────────────────────────────────────────────
  L.push('## 유형별 기대 상태 일치율', '');
  const allTypes = [...new Set(rows.flatMap((r) => [...r.types.keys()]))]
    .sort((a, b) => {
      const ra = base ? base.types.get(a) : null;
      const rb = base ? base.types.get(b) : null;
      return (ra ? ra.hit / ra.n : 1) - (rb ? rb.hit / rb.n : 1);
    });
  L.push(table(['유형', 'n', ...rows.map((r) => r.variant)],
    allTypes.map((t) => {
      const n = (base && base.types.get(t) ? base.types.get(t).n : (rows[0].types.get(t) || { n: 0 }).n);
      const flag = n < SMALL_TYPE_N ? ' ⚠️' : '';
      return [t + flag, n, ...rows.map((r) => {
        const e = r.types.get(t);
        if (!e || !e.n) return '-';
        const v = e.hit / e.n;
        const b = base && base.types.get(t) ? base.types.get(t).hit / base.types.get(t).n : null;
        return `${pct(v)} (${e.hit}/${e.n})` + (r === base ? '' : signedPp(b === null ? null : v - b));
      })];
    })), '');
  L.push(`⚠️ 표시는 문항이 ${SMALL_TYPE_N}건 미만이라 1~2문항 차이로 비율이 크게 흔들린다. 결론 근거로 쓰지 말 것.`, '');

  // ── 읽을 때 주의할 점 ───────────────────────────────────────────────────
  L.push('## 읽을 때 주의할 점', '');
  L.push('- 300문항에서 1문항은 약 0.3%p다. 짝 비교의 **순증이 한 자리 수면 우연일 수 있다.**');
  L.push('- 기대 상태 일치율만 보고 고르지 말 것. 보류(ABSTAIN)를 남발하면 이 지표는 오르지만 답을 못 하는 상담봇이 된다. `부재판단 F1`과 `RAG 근거율`의 `n`을 함께 볼 것.');
  L.push('- 프롬프트가 길어지면 입력 토큰이 늘어 지연이 커진다. `평균 지연`·`P95`를 함께 볼 것.');
  L.push('- temperature 0에서 한 번 돌린 결과다. 반복 일관성은 이 비교에서 재지 않는다(`--primary-only`로 반복 회차를 생성하지 않음).');
  L.push('- 한 모델에서 좋은 프롬프트가 다른 모델에서도 좋다는 보장은 없다.', '');

  L.push('## 원본 파일', '');
  for (const r of rows) {
    L.push(`- ${r.variant}: [생성 결과](../raw/${SUITE}/${r.runId}/generation.jsonl)`
      + ` · [통합 CSV](../scored/${SUITE}/${r.runId}/review.csv)`
      + ` · [요약](../reports/${SUITE}/${r.runId}_summary.md)`);
  }
  L.push('');
  L.push('## 사람 판단', '', '- 채택할 안:', '- 근거:', '- 다른 모델로 확인할 안:', '- 메모:', '');

  const outPath = opts.out || path.join(ROOT, 'results', SUITE,
    `prompt_test_${sanitizeTag(opts.model)}_${opts.date || 'latest'}${opts.limitTag ? '_limit' + opts.limitTag : ''}.md`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, L.join('\n').replace(/\n{3,}/g, '\n\n') + '\n', 'utf8');

  // 콘솔 요약
  console.log(`\n프롬프트 비교 (${opts.model}, ${SUITE})`);
  for (const r of rows) {
    const m = r.metrics;
    console.log(`  ${r.variant.padEnd(18)} 상태일치 ${pct(m.status_match).padStart(6)}`
      + ` · 부재F1 ${num(m.absence_f1, 3).padStart(5)}`
      + ` · 포맷 ${pct(m.format_success_rate).padStart(6)}`
      + ` · 지연 ${num(m.latency_avg_ms / 1000, 2, 's').padStart(7)}`
      + (r.diff ? `  (개선 +${r.diff.gained} / 퇴보 -${r.diff.lost} / 순증 ${r.diff.net})` : '  (대조군)'));
  }
  for (const m of missing) console.log('  [빠짐] ' + m);
  console.log(`\n-> ${path.relative(ROOT, outPath)}`);
}

main();
