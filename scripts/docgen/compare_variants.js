'use strict';
// 프롬프트 안 전후 짝 비교: 같은 배치 안에서 같은 모델·같은 케이스 ID끼리 기준 안과 새 안을 맞대어 본다.
// judge_report.js를 먼저 실행해야 한다(paths.jsonl을 읽는다).
//
//   llm_judge/<batch>_variant_compare.md / .json
//
// 항목마다: 정답률(전/후), 바뀐 건수(정답→오답, 오답→정답)와 McNemar 정확검정 p값, 환각률, 출력 status 분포
// (ABSTAIN·PARTIAL), 본문 보류(content_stance ABSTAIN), 되묻기(asks_user), 본문 FAQ ID 노출, 빈 evidence_ids,
// AD 안전성 판정. --ids-file로 오답을 일부러 많이 넣은 run(selection.ids_file)은 표에 표시한다 — 그 항목의
// 정답률은 항목 정답률이 아니다.
//
// Usage: node scripts/docgen/compare_variants.js --batch <id> [--base <variant>] [--base-from <test>/<try>/<batch>]
//          [--test ...] [--try ...]
//   --base를 안 주면 test.config.js의 prompt.variant가 기준 안이다.
//   --base-from: 기준 안 run을 다른 테스트·try의 배치에서 가져온다(예: model_test_v4/try1/v4-try1-n200).
//   실행 환경(run_info.runtime·env)이 다르면 보고서에 경고를 남긴다 — 환경 차이도 전후 차이에 섞인다.

const fs = require('fs');
const path = require('path');
const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { readAll } = require('../lib/jsonl');
const { itemOrder, itemName } = require('../lib/dataset');
const { pct } = require('../lib/stats');

// 본문에 노출된 문서 ID — "문서 A/B"는 컨텍스트 본문의 문서 이름이고 CF 정답 예시도 쓰므로 세지 않는다.
const DOC_ID_RE = /FAQ\s?-?\s?\d+|TEST-[A-Z]{2}-\d{4}(?:-[A-Z])?|FAQ\s?ID/;

function parse(args) {
  const o = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--batch') o.batch = args[++i];
    else if (args[i] === '--base') o.base = args[++i];
    else if (args[i] === '--base-from') o.baseFrom = args[++i];
    else throw new Error(`알 수 없는 인자: ${args[i]}`);
  }
  if (!o.batch) throw new Error('--batch <id>가 필요합니다.');
  return o;
}

// McNemar 정확검정(양측): 불일치 쌍 b(정답→오답), c(오답→정답)에 대해 Binomial(b+c, 0.5)
function mcnemarP(b, c) {
  const n = b + c;
  if (!n) return null;
  const k = Math.min(b, c);
  let logC = 0, sum = 0;
  for (let i = 0; i <= n; i++) {
    if (i > 0) logC += Math.log(n - i + 1) - Math.log(i);
    if (i <= k) sum += Math.exp(logC - n * Math.LN2);
  }
  return Math.min(1, 2 * sum);
}

// 다른 테스트·try의 결과 경로(profile.load()는 지금 테스트 하나만 가리키므로 여기서 직접 만든다).
function pathsFor(test, tryTag) {
  for (const v of [test, tryTag]) profile.assertSafe('base-from', v);
  const results = path.join(profile.ROOT, test, tryTag, 'results');
  if (!fs.existsSync(results)) throw new Error(`결과 폴더가 없습니다: ${results}`);
  return {
    batchManifestPath: (b) => path.join(results, 'report', `${b}.json`),
    generationPath: (id) => path.join(results, 'raw', id, 'generation.jsonl'),
    runInfoPath: (id) => path.join(results, 'raw', id, 'run_info.json'),
    scoredDir: (id) => path.join(results, 'raw', 'scored', id),
    judgeResultPath: (id, b, kind) => path.join(results, 'raw', 'scored', id, 'llm_judge', b, `${kind}.jsonl`),
  };
}

function loadRun(paths, batch, run) {
  const gen = new Map(readAll(paths.generationPath(run.run_id)).map((g) => [g.id, g]));
  const read = (kind) => {
    const f = paths.judgeResultPath(run.run_id, batch, kind);
    return fs.existsSync(f) ? new Map(readAll(f).filter((r) => !r.error).map((r) => [r.id, r])) : new Map();
  };
  const pathsFile = path.join(paths.scoredDir(run.run_id), 'llm_judge', batch, 'paths.jsonl');
  if (!fs.existsSync(pathsFile)) throw new Error(`${run.run_id}: paths.jsonl이 없습니다 — judge_report.js --batch ${batch}를 먼저 실행하세요.`);
  const rows = new Map(readAll(pathsFile).map((p) => [p.id, p]));
  const info = JSON.parse(fs.readFileSync(paths.runInfoPath(run.run_id), 'utf8'));
  return { run, gen, rows, info, acc: read('accuracy'), safety: read('safety') };
}

// 케이스 한 건의 비교용 값
function caseView(r, id) {
  const p = r.rows.get(id);
  if (!p) return null;
  const g = r.gen.get(id);
  const out = g && g.parsed ? g.parsed : {};
  return {
    correct: !!p.correct,
    hallucinated: !!p.flags?.hallucinated,
    status: out.status || null,
    stanceAbstain: p.content_stance === 'ABSTAIN',
    asks: !!p.asks_user,
    docId: DOC_ID_RE.test(out.answer || ''),
    emptyEvidence: Array.isArray(out.evidence_ids) && out.evidence_ids.length === 0,
    statusOk: !!p.status_label_ok,
    safety: r.safety.get(id)?.verdict || null,
  };
}

function summarize(pairs) {
  const n = pairs.length;
  const cnt = (side, fn) => pairs.filter((x) => fn(x[side])).length;
  const b = pairs.filter((x) => x.a.correct && !x.b.correct).length; // 정답→오답
  const c = pairs.filter((x) => !x.a.correct && x.b.correct).length; // 오답→정답
  const both = (fn) => ({ a: cnt('a', fn), b: cnt('b', fn) });
  return {
    n,
    correct: both((v) => v.correct),
    flips: { right_to_wrong: b, wrong_to_right: c, mcnemar_p: mcnemarP(b, c) },
    hallucinated: both((v) => v.hallucinated),
    status_ok: both((v) => v.statusOk),
    abstain_label: both((v) => v.status === 'ABSTAIN'),
    partial_label: both((v) => v.status === 'PARTIAL'),
    abstain_body: both((v) => v.stanceAbstain),
    asks_user: both((v) => v.asks),
    doc_id_exposed: both((v) => v.docId),
    empty_evidence: both((v) => v.emptyEvidence),
    safety: Object.fromEntries(['SAFE', 'UNSAFE', 'OVER_REFUSAL', 'NOT_APPLICABLE'].map((k) => [k, both((v) => v.safety === k)])),
  };
}

function main() {
  const o = parse(argv);
  const { config, paths, label } = profile.load();
  profile.assertSafe('batch', o.batch);
  const manifestPath = paths.batchManifestPath(o.batch);
  if (!fs.existsSync(manifestPath)) throw new Error(`배치 매니페스트가 없습니다: ${manifestPath}`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const baseVariant = o.base || config.prompt.variant;

  // 모델 × 안 별로 run들을 모은다(한 안이 항목별로 여러 run에 나뉘어 있어도 케이스 ID로 합친다).
  const loaded = manifest.runs.map((run) => loadRun(paths, o.batch, run));
  if (o.baseFrom) {
    const [test, tryTag, batch] = o.baseFrom.split('/');
    if (!batch) throw new Error('--base-from은 <test>/<try>/<batch> 형식입니다.');
    const bp = pathsFor(test, tryTag);
    const bm = JSON.parse(fs.readFileSync(bp.batchManifestPath(batch), 'utf8'));
    const models = new Set(loaded.map((r) => r.run.model));
    for (const run of bm.runs.filter((x) => models.has(x.model) && x.prompt_variant === baseVariant)) {
      loaded.push({ ...loadRun(bp, batch, run), external: o.baseFrom });
    }
  }
  const byModel = {};
  for (const r of loaded) ((byModel[r.run.model] ||= {})[r.run.prompt_variant] ||= []).push(r);

  const results = [];
  for (const [model, variants] of Object.entries(byModel)) {
    const baseRuns = variants[baseVariant];
    if (!baseRuns) { console.warn(`${model}: 기준 안 ${baseVariant} run이 없어 건너뜁니다.`); continue; }
    for (const [variant, newRuns] of Object.entries(variants)) {
      if (variant === baseVariant) continue;
      const find = (runs, id) => runs.find((r) => r.rows.has(id));
      const ids = [...new Set(newRuns.flatMap((r) => [...r.rows.keys()]))].filter((id) => find(baseRuns, id));
      const pairs = ids.map((id) => {
        const ra = find(baseRuns, id), rb = find(newRuns, id);
        const a = caseView(ra, id), b = caseView(rb, id);
        return a && b ? { id, item: ra.rows.get(id).item, a, b, focus: !!(ra.run.selection?.ids_file || rb.run.selection?.ids_file) } : null;
      }).filter(Boolean);
      const items = itemOrder().filter((code) => pairs.some((x) => x.item === code));
      const focusItems = items.filter((code) => pairs.some((x) => x.item === code && x.focus));
      const envOf = (runs) => [...new Set(runs.map((r) => {
        const rt = r.info.runtime;
        return `${r.info.env}${rt ? ` · Ollama ${rt.ollama_version} · ${rt.quantization} · digest ${String(rt.model_digest).slice(0, 12)}` : ' · 실행 환경 기록 없음'}${r.external ? ` (${r.external})` : ''}`;
      }))];
      results.push({
        model, base: baseVariant, variant,
        env: { base: envOf(baseRuns), new: envOf(newRuns) },
        focus_items: focusItems,
        total: summarize(pairs.filter((x) => x.item !== config.repeatItem)),
        by_item: Object.fromEntries(items.map((code) => [code, summarize(pairs.filter((x) => x.item === code))])),
        flipped: {
          right_to_wrong: pairs.filter((x) => x.a.correct && !x.b.correct).map((x) => x.id),
          wrong_to_right: pairs.filter((x) => !x.a.correct && x.b.correct).map((x) => x.id),
        },
      });
    }
  }
  if (!results.length) throw new Error(`비교할 안이 없습니다(기준 안 ${baseVariant}와 다른 안이 같은 모델로 배치에 있어야 합니다).`);

  const L = [`# 프롬프트 안 짝 비교 — ${o.batch} (${label})`, ''];
  L.push('같은 모델·같은 케이스 ID끼리 기준 안(앞)과 새 안(뒤)을 비교한다. "전→후"는 건수 또는 비율. McNemar p는 정답/오답이 바뀐 쌍만으로 계산한 정확검정(양측)이다.');
  L.push('본문 FAQ ID 노출은 정규식으로 센 값이다("문서 A/B"는 세지 않음). 되묻기·본문 보류는 Judge 판정(asks_user·content_stance)이다.', '');
  const ab = (x, n) => `${x.a}→${x.b}${n ? ` (${pct(x.a / n)}→${pct(x.b / n)})` : ''}`;
  const pv = (p) => (p === null ? '-' : p < 0.001 ? '<0.001' : p.toFixed(3));
  for (const r of results) {
    L.push(`## ${r.model}: ${r.base} → ${r.variant}`, '');
    L.push(`- 기준 안 환경: ${r.env.base.join(' / ')}`, `- 새 안 환경: ${r.env.new.join(' / ')}`);
    if (JSON.stringify(r.env.base.map((e) => e.replace(/ \(.*\)$/, ''))) !== JSON.stringify(r.env.new)) {
      L.push('- **실행 환경이 다르다 — 전후 차이에 환경 차이가 섞여 있다.** 같은 프롬프트(v4_base)로 로컬과 EC2를 비교한 399건에서 답변 문장 완전 일치 27.6%, status 일치 93.5%였다(2026-10-07).');
    }
    L.push('');
    if (r.focus_items.length) L.push(`- **${r.focus_items.join('·')}는 오답을 일부러 많이 넣은 목록(--ids-file)이다 — 정답률은 항목 정답률이 아니며 전체 합계에서도 섞여 있다.** 바뀐 건수로 본다.`, '');
    L.push('| 항목 | n | 정답 전→후 | 정답→오답 | 오답→정답 | p | 환각 전→후 | ABSTAIN 라벨 | PARTIAL 라벨 | 본문 보류 | 되묻기 | FAQ ID 노출 | 빈 evidence |');
    L.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
    const row = (name, s) => `| ${name} | ${s.n} | ${ab(s.correct, s.n)} | ${s.flips.right_to_wrong} | ${s.flips.wrong_to_right} | ${pv(s.flips.mcnemar_p)} | ${ab(s.hallucinated)} | ${ab(s.abstain_label)} | ${ab(s.partial_label)} | ${ab(s.abstain_body)} | ${ab(s.asks_user)} | ${ab(s.doc_id_exposed)} | ${ab(s.empty_evidence)} |`;
    for (const [code, s] of Object.entries(r.by_item)) L.push(row(`${code}${r.focus_items.includes(code) ? '*' : ''} ${itemName(code)}`, s));
    L.push(row(`**합계(${config.repeatItem} 제외)**`, r.total), '');
    const saf = r.by_item[config.safetyItems?.[0]];
    if (saf && (saf.safety.SAFE.a + saf.safety.SAFE.b)) {
      L.push(`### 안전성 (${config.safetyItems.join(',')})`, '', '| 판정 | 전→후 |', '|---|---|');
      for (const [k, v] of Object.entries(saf.safety)) L.push(`| ${k} | ${v.a}→${v.b} |`);
      L.push('');
    }
    L.push(`### 바뀐 케이스`, '', `- 정답→오답 ${r.flipped.right_to_wrong.length}건: ${r.flipped.right_to_wrong.join(', ') || '-'}`,
      `- 오답→정답 ${r.flipped.wrong_to_right.length}건: ${r.flipped.wrong_to_right.join(', ') || '-'}`, '');
  }

  fs.mkdirSync(paths.llmJudgeDir, { recursive: true });
  const base = path.join(paths.llmJudgeDir, `${o.batch}_variant_compare`);
  fs.writeFileSync(`${base}.json`, JSON.stringify({ batch_id: o.batch, results }, null, 2) + '\n', 'utf8');
  fs.writeFileSync(`${base}.md`, L.join('\n') + '\n', 'utf8');
  console.log(`-> ${profile.load().repoRel(base)}.md / .json`);
}

try { main(); } catch (e) { console.error(e.message); process.exit(1); }
