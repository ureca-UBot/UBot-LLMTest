'use strict';
// 실행 스크립트 공통 인자 파서. --test/--try는 profile.applyCliSelectors()가 먼저 뗀다.

const VALUE_FLAGS = {
  '--condition': 'condition',
  '--size': 'size',
  '--items': 'items',
  '--difficulty': 'difficulty',
  '--limit': 'limit',
  '--date': 'date',
  '--models': 'models',
  '--batch': 'batch',
  '--kinds': 'kinds',
  '--concurrency': 'concurrency',
  '--runs': 'runs',
  '--filter': 'filter',
  '--ids-file': 'idsFile', // 케이스 ID 목록 파일(한 줄에 하나, #은 주석) — --size 서브셋 안에서 다시 고른다
  '--from-test': 'fromTest', // import_run_subset.js — 가져올 run이 있는 테스트(예: v4)
  '--from-try': 'fromTry',
  '--from-batch': 'fromBatch', // reuse_judgments.js — 판정을 가져올 원래 배치
};
const BOOL_FLAGS = { '--dry-run': 'dryRun', '--skip-model-check': 'skipModelCheck', '--confirm-external': 'confirmExternal', '--write': 'write',
  '--keep-records': 'keepRecords' }; // import_run_subset.js — 원본 행을 바이트 그대로 둔다(run_id도 원본 값)
const LIST_OPTS = new Set(['items', 'models', 'kinds', 'runs']);
const INT_OPTS = new Set(['size', 'limit', 'concurrency']);

function parseRunArgs(argv) {
  const positional = [];
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (VALUE_FLAGS[a]) {
      const key = VALUE_FLAGS[a];
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} 값이 없습니다.`);
      if (LIST_OPTS.has(key)) opts[key] = v.split(',').map((s) => s.trim()).filter(Boolean);
      else if (INT_OPTS.has(key)) {
        opts[key] = Number(v);
        if (!Number.isInteger(opts[key]) || opts[key] <= 0) throw new Error(`${a} 값은 양의 정수여야 합니다: ${v}`);
      } else opts[key] = v;
    } else if (BOOL_FLAGS[a]) opts[BOOL_FLAGS[a]] = true;
    else if (a.startsWith('--')) throw new Error(`알 수 없는 옵션: ${a}`);
    else positional.push(a);
  }
  return { positional, opts };
}

// 하위 프로세스로 넘길 인자로 되돌린다(값이 있는 것만).
function toArgs(opts, keys) {
  const flagOf = Object.fromEntries([...Object.entries(VALUE_FLAGS), ...Object.entries(BOOL_FLAGS)].map(([f, k]) => [k, f]));
  const out = [];
  for (const key of keys) {
    const v = opts[key];
    if (v === undefined || v === null || v === false) continue;
    if (v === true) out.push(flagOf[key]);
    else out.push(flagOf[key], Array.isArray(v) ? v.join(',') : String(v));
  }
  return out;
}

module.exports = { parseRunArgs, toArgs };
