'use strict';
// 채점 단계 공통: run 하나의 생성 결과를 데이터셋 케이스와 붙이고, 집계 범위를 나눈다.
//
// 집계 범위 (README 4-9절 · 데이터셋 실행 안내)
//   independent  반복 항목(config.repeatItem)을 뺀 행 — 전체 요약 지표의 분모
//   byItem       항목별 전 행(반복 항목은 10회 전부) — 항목별 표
// 결과론적 지표는 통과율 없이 평균·분포 같은 원래 값으로만 집계한다.

const fs = require('fs');
const path = require('path');
const profile = require('./profile');
const { readAll } = require('./jsonl');
const { loadCases, isRepeatCase, itemOrder } = require('./dataset');
const { groupBy } = require('./stats');

function loadRun(runId) {
  const { paths, repoRel } = profile.load();
  const genPath = paths.generationPath(runId);
  const generations = readAll(genPath);
  if (!generations.length) throw new Error(`generation.jsonl이 비어 있거나 없습니다: ${repoRel(genPath)}`);
  const infoPath = paths.runInfoPath(runId);
  const runInfo = fs.existsSync(infoPath) ? JSON.parse(fs.readFileSync(infoPath, 'utf8')) : null;
  const { byId } = loadCases();
  const rows = generations.map((g) => {
    const c = byId.get(g.id);
    if (!c) throw new Error(`데이터셋에 없는 케이스: ${g.id} (run ${runId})`);
    return { g, c };
  });
  return { runId, runInfo, rows, scoredDir: paths.scoredDir(runId) };
}

// 채점 행 배열 -> { independent: [...], byItem: Map(code -> [...]) }
function scopes(scored, caseOf) {
  const independent = scored.filter((r) => !isRepeatCase(caseOf(r)));
  const grouped = groupBy(scored, (r) => caseOf(r).item);
  const byItem = new Map(itemOrder().filter((code) => grouped.has(code)).map((code) => [code, grouped.get(code)]));
  return { independent, byItem };
}

// 요약 함수 fn(rows)를 전체 행·독립 표본·항목별로 적용한다.
function summarizeScopes(scored, caseOf, fn) {
  const { independent, byItem } = scopes(scored, caseOf);
  return {
    all_rows: fn(scored),
    independent: fn(independent),
    by_item: Object.fromEntries([...byItem].map(([code, rows]) => [code, fn(rows)])),
  };
}

// 콘솔 한 줄 요약용 범위: 독립 표본이 비어 있으면(반복 항목만 돌린 run) 전체 행.
function headlineScope(summary, countKey = 'n') {
  const ind = summary.independent;
  return ind && ind[countKey] > 0 ? { label: '독립 표본', s: ind } : { label: '전체 행', s: summary.all_rows };
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function writeJsonl(filePath, rows) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''), 'utf8');
}

function runIdArg(argv) {
  const runId = argv.find((a) => !a.startsWith('--'));
  if (!runId) {
    console.error(`usage: node ${path.relative(profile.ROOT, process.argv[1]).split(path.sep).join('/')} <run_id> [--test v4] [--try try1]`);
    process.exit(1);
  }
  return profile.assertSafe('run_id', runId);
}

module.exports = { loadRun, scopes, summarizeScopes, headlineScope, writeJson, writeJsonl, runIdArg };
