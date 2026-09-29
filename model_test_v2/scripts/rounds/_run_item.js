'use strict';
// 항목(유형)별 라운드 공통 실행기. rounds/NN_<코드>_*.js 가 이걸 호출한다.
//
// 전체 380행 대신 한 유형만(또는 반복 40문항×3회차만) 골라 ../run_pipeline.js 를
// 돌린다. 생성 → 결정론 채점 → 리포트까지 전체 파이프라인과 같은 단계를 거친다.
//
// 결과는 전체 라운드와 섞이지 않도록 run_id 끝에 항목 코드를 붙인다
//   <run_id>_<코드>   예) local-win_qwen3-4b_20260928_SF
// (--run-id-as-is 를 주면 붙이지 않는다.)
//
// Usage:
//   node model_test_v2/scripts/rounds/01_SF_single_faq.js <run_id> <model_tag> [--dry-run]
//     [--limit N] [--temperature N] [--seed N] [--think true|false] [--run-id-as-is]
// 결과 위치는 LLM_TEST_TRY(기본: 이 버전의 최신 try)로 정해진다 — ../lib/suite.js 참고.

const path = require('path');
const { spawnSync } = require('child_process');
const suitePaths = require('../lib/suite');

const PIPELINE = path.join(__dirname, '..', 'run_pipeline.js');

// 이 버전에서 기본으로 붙일 생성 파라미터 (v2는 없음 = Ollama 기본값).
function defaultParams(/* modelTag */) {
  return [];
}

function runItem(item, defaults = defaultParams) {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const asIs = argv.includes('--run-id-as-is');
  const rest = argv.filter((a) => a !== '--dry-run' && a !== '--run-id-as-is');
  const [baseRunId, modelTag, ...passthrough] = rest;
  if (!baseRunId || !modelTag || baseRunId.startsWith('--')) {
    console.error(`usage: node ${path.relative(suitePaths.ROOT, process.argv[1]).split(path.sep).join('/')} <run_id> <model_tag> [--dry-run] [--limit N] [--temperature N] [--seed N] [--think true|false] [--run-id-as-is]`);
    process.exit(1);
  }
  const runId = asIs ? baseRunId : `${baseRunId}_${item.code}`;
  const given = new Set(passthrough.filter((a) => a.startsWith('--')));
  const extra = [];
  const d = defaults(modelTag);
  for (let i = 0; i < d.length; i += 2) if (!given.has(d[i])) extra.push(d[i], d[i + 1]);

  const args = [PIPELINE, runId, modelTag];
  if (item.repeatOnly) args.push('--repeat-only');
  else args.push('--type', item.type, '--skip-repeat');
  args.push(...extra, ...passthrough);

  console.log(`[${item.code}] ${item.label} — ${item.cases} · 결과: ${suitePaths.suiteTag()} · run_id=${runId}`);
  console.log(`  node ${args.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' ')}`);
  if (dryRun) { console.log('[--dry-run] 모델 호출 없이 종료합니다.'); return; }
  const res = spawnSync(process.execPath, args, { stdio: 'inherit' });
  process.exit(res.status === null ? 1 : res.status);
}

module.exports = { runItem, defaultParams };
