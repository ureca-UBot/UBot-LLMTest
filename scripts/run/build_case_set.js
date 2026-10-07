'use strict';
// 이전 run의 LLM Judge 결과로 "오답을 더 많이 넣은" 케이스 ID 목록을 만든다 -> --ids-file로 실행.
// 프롬프트 수정 전후를 같은 문항끼리 비교할 때, 고치려는 오답이 충분히 들어가게 하려는 용도다.
// 오답 비율을 일부러 높이므로 이 목록의 정답률은 전체 정답률이 아니다 — 전후 비교(짝 비교)에만 쓴다.
//
// Usage:
//   node scripts/run/build_case_set.js --from <test>/<try>/<run_id>/<batch> --items NC,MC --out <파일>
//     [--n 100] [--wrong-ratio 0.6] [--seed pv1]
// 예) node scripts/run/build_case_set.js --from model_test_v4/try1/ec2-linux_qwen3-4b_t0_nothink_fixed_n200_20261005/v4-try1-n200 \
//       --items NC,MC --out prompts_test_v1/try1/case_sets/ncmc-focus.txt
//
// 오답 = paths.jsonl의 correct=false(RT 제외 규칙과 무관하게 항목 단위). 오답이 모자라면 정답으로 채운다.
// 정답 쪽은 난이도 비율을 유지해 뽑는다. 뽑기는 seed로 고정된다(같은 입력이면 같은 목록).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..', '..');

function parse(argv) {
  const o = { n: 100, wrongRatio: 0.6, seed: 'pv1' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], v = argv[i + 1];
    if (a === '--from') { o.from = v; i++; }
    else if (a === '--items') { o.items = v.split(',').map((s) => s.trim().toUpperCase()); i++; }
    else if (a === '--out') { o.out = v; i++; }
    else if (a === '--n') { o.n = Number(v); i++; }
    else if (a === '--wrong-ratio') { o.wrongRatio = Number(v); i++; }
    else if (a === '--seed') { o.seed = v; i++; }
    else throw new Error(`알 수 없는 인자: ${a}`);
  }
  if (!o.from || !o.items || !o.out) throw new Error('usage: --from <test>/<try>/<run_id>/<batch> --items A,B --out <파일> [--n 100] [--wrong-ratio 0.6] [--seed s]');
  return o;
}

// seed 고정 정렬 키(셔플 대신) — 입력 순서와 무관하게 같은 결과
const key = (seed, id) => crypto.createHash('sha256').update(`${seed}:${id}`).digest('hex');
const pick = (rows, n, seed) => [...rows].sort((a, b) => key(seed, a.id).localeCompare(key(seed, b.id))).slice(0, n);

// 난이도 비율을 유지해 n건(최대 가능 수까지)
function pickStratified(rows, n, seed) {
  const groups = {};
  for (const r of rows) (groups[r.difficulty] ||= []).push(r);
  const out = [];
  const keys = Object.keys(groups).sort();
  for (const k of keys) out.push(...pick(groups[k], Math.floor((n * groups[k].length) / rows.length), seed));
  const rest = pick(rows.filter((r) => !out.includes(r)), n - out.length, seed);
  return [...out, ...rest];
}

function main() {
  const o = parse(process.argv.slice(2));
  const [test, tryTag, runId, batch] = o.from.split('/');
  const pathsFile = path.join(ROOT, test, tryTag, 'results', 'raw', 'scored', runId, 'llm_judge', batch, 'paths.jsonl');
  if (!fs.existsSync(pathsFile)) throw new Error(`paths.jsonl이 없습니다: ${pathsFile}`);
  const rows = fs.readFileSync(pathsFile, 'utf8').split('\n').filter(Boolean).map(JSON.parse);

  const lines = [
    `# build_case_set.js — 오답 비율을 높인 케이스 목록 (짝 비교 전용, 전체 정답률 아님)`,
    `# from: ${o.from}`,
    `# items: ${o.items.join(',')} · 항목당 ${o.n}건 · 오답 목표 ${Math.round(o.wrongRatio * 100)}% · seed ${o.seed}`,
  ];
  const ids = [];
  for (const item of o.items) {
    const all = rows.filter((r) => r.item === item);
    if (!all.length) throw new Error(`${item} 항목 결과가 없습니다.`);
    const wrong = all.filter((r) => !r.correct), right = all.filter((r) => r.correct);
    const nWrong = Math.min(wrong.length, Math.round(o.n * o.wrongRatio));
    const nRight = Math.min(right.length, o.n - nWrong);
    const chosen = [...pickStratified(wrong, nWrong, o.seed), ...pickStratified(right, nRight, o.seed)]
      .sort((a, b) => a.id.localeCompare(b.id));
    lines.push(`# ${item}: 오답 ${nWrong}/${wrong.length} + 정답 ${nRight}/${right.length} = ${chosen.length}건`);
    ids.push(...chosen.map((r) => `${r.id}${r.correct ? '' : '  # 이전 오답'}`));
  }
  const outPath = path.resolve(ROOT, o.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, [...lines, ...ids].join('\n') + '\n', 'utf8');
  console.log(lines.slice(3).join('\n'));
  console.log(`-> ${path.relative(ROOT, outPath).split(path.sep).join('/')} (${ids.length}건)`);
}

try { main(); } catch (e) { console.error(e.message); process.exit(1); }
