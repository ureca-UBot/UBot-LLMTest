'use strict';
// 준비된 cases CSV를 읽어 엔진 공통 필드 이름으로 정규화한다. 컬럼 이름 매핑은
// test.config.js의 dataset.columns 한 곳에서만 한다 — 채점·보고서 스크립트는 한글
// 컬럼 이름을 직접 쓰지 않는다.

const fs = require('fs');
const crypto = require('crypto');
const { parseCsvObjects } = require('./csv');
const profile = require('./profile');

let cache = null;

function normalize(row, columns) {
  const out = {};
  for (const [field, column] of Object.entries(columns)) out[field] = row[column] ?? '';
  out.round = Number(out.round || 1);
  out.repeatTotal = Number(out.repeatTotal || 1);
  out.subsetMin = out.subsetMin === '' ? null : Number(out.subsetMin);
  out.originalId = out.originalId || out.id;
  return out;
}

function loadCases() {
  if (cache) return cache;
  const { config, paths } = profile.load();
  if (!fs.existsSync(paths.casesPath)) {
    throw new Error(`데이터셋이 없습니다: ${paths.casesPath}\n먼저 실행하세요: node scripts/run/prepare_dataset.js`);
  }
  const bytes = fs.readFileSync(paths.casesPath);
  const cases = parseCsvObjects(bytes.toString('utf8')).map((row) => normalize(row, config.dataset.columns));
  const seen = new Set();
  for (const c of cases) {
    if (!c.id || seen.has(c.id)) throw new Error(`cases CSV에 빈/중복 ID가 있습니다: ${c.id}`);
    seen.add(c.id);
  }
  const knownItems = new Set(config.items.map((i) => i.code));
  const unknown = [...new Set(cases.map((c) => c.item))].filter((code) => !knownItems.has(code));
  if (unknown.length) throw new Error(`test.config.js items에 없는 항목 코드: ${unknown.join(', ')}`);
  cache = {
    cases,
    byId: new Map(cases.map((c) => [c.id, c])),
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  };
  return cache;
}

function isRepeatCase(c) {
  return c.item === profile.load().config.repeatItem;
}

// 선택 조건: size(항목당 건수) · items(항목 코드 배열) · difficulty · ids · limit
function selectCases({ size = null, items = null, difficulty = null, ids = null, limit = null } = {}) {
  const { config } = profile.load();
  const { cases } = loadCases();
  const full = config.dataset.subset.full;
  const targetSize = size || config.dataset.defaultSize;
  if (!config.dataset.subset.sizes.includes(targetSize)) {
    throw new Error(`지원하지 않는 규모: ${targetSize} (가능: ${config.dataset.subset.sizes.join(', ')})`);
  }
  let selected = cases.filter((c) => targetSize >= full || (c.subsetMin !== null && c.subsetMin <= targetSize));
  if (items && items.length) {
    const set = new Set(items);
    const unknown = items.filter((code) => !config.items.some((i) => i.code === code));
    if (unknown.length) throw new Error(`알 수 없는 항목 코드: ${unknown.join(', ')}`);
    selected = selected.filter((c) => set.has(c.item));
  }
  if (difficulty) selected = selected.filter((c) => c.difficulty === difficulty);
  if (ids && ids.length) {
    const set = new Set(ids);
    selected = selected.filter((c) => set.has(c.id));
  }
  if (limit) selected = selected.slice(0, limit);
  return selected;
}

// --ids-file 읽기: 한 줄에 케이스 ID 하나, 빈 줄과 # 뒤는 무시한다. 없는 ID가 있으면 멈춘다.
function readIdsFile(filePath) {
  const ids = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).map((l) => l.replace(/#.*/, '').trim()).filter(Boolean);
  const { byId } = loadCases();
  const unknown = ids.filter((id) => !byId.has(id));
  if (unknown.length) throw new Error(`--ids-file에 데이터셋에 없는 ID가 있습니다: ${unknown.slice(0, 5).join(', ')}${unknown.length > 5 ? ' …' : ''}`);
  return {
    ids,
    sha256: crypto.createHash('sha256').update(ids.join('\n')).digest('hex'),
    tag: require('path').basename(filePath).replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9-]/g, '-'),
  };
}

function itemOrder() {
  return profile.load().config.items.map((i) => i.code);
}

function itemName(code) {
  const item = profile.load().config.items.find((i) => i.code === code);
  return item ? item.name : code;
}

module.exports = { loadCases, selectCases, readIdsFile, isRepeatCase, itemOrder, itemName };
