'use strict';
// 원본 xlsx -> 엔진이 읽는 CSV (test.config.js의 dataset 설정 기준).
//
//   <dataset.casesPath>            테스트 시트(결과 기록용 빈 칸 dataset.resultColumns 제외) + '포함 최소 규모' 컬럼
//   <dataset.faqPath>              FAQ 원문 시트
//   <casesPath 폴더>/dataset_manifest.json   원본·결과 해시, 항목×규모×난이도 건수
//
// '포함 최소 규모'는 그 행이 들어가는 가장 작은 서브셋 크기(항목당 건수)다.
// size=100으로 실행하면 이 값이 100 이하인 행만 쓴다. 뽑는 규칙:
//   - 항목마다 독립 추출. 추출 단위는 원본 질문 ID(반복 항목은 10회를 통째로).
//   - 층(strata: 난이도, 페르소나 하위 항목) 비율을 최대 잔여 방식으로 배분.
//   - 층 안의 순서는 sha256(seed + 원본 질문 ID) — 모든 규모가 같은 순서를 쓰므로
//     작은 서브셋이 큰 서브셋에 항상 포함된다. 포함 관계가 깨지면 중단한다.
//
// Usage: node scripts/run/prepare_dataset.js [--test v4] [--check]
//   --check  파일을 쓰지 않고 결과가 기존 CSV와 같은지만 확인

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const profile = require('../lib/profile');

const argv = profile.applyCliSelectors(process.argv.slice(2));
const { readWorkbook, sheetToObjects } = require('../lib/xlsx');
const { toCsv } = require('../lib/csv');

const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');

// 최대 잔여 방식: 합계 total을 weights 비율로 정수 배분.
function largestRemainder(weights, total) {
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (w / sum) * total);
  const base = raw.map(Math.floor);
  let left = total - base.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) { if (left-- <= 0) break; base[i]++; }
  return base;
}

function assignSubsets(rows, cols, subset) {
  const { sizes, full, seed, strata } = subset;
  const smaller = sizes.filter((s) => s < full).sort((a, b) => a - b);
  const subsetMin = new Map(); // originalId -> min size

  const byItem = new Map();
  for (const r of rows) {
    const item = r[cols.item];
    if (!byItem.has(item)) byItem.set(item, new Map());
    const units = byItem.get(item);
    const unitId = r[cols.originalId] || r[cols.id];
    if (!units.has(unitId)) units.set(unitId, r);
  }

  const report = {};
  for (const [item, units] of byItem) {
    const strataMap = new Map();
    for (const [unitId, r] of units) {
      const key = strata.map((f) => r[cols[f]] || '').join('|');
      if (!strataMap.has(key)) strataMap.set(key, []);
      strataMap.get(key).push(unitId);
    }
    const keys = [...strataMap.keys()].sort();
    for (const key of keys) strataMap.get(key).sort((a, b) => sha256(seed + a).localeCompare(sha256(seed + b)));

    const nUnits = units.size;
    let prev = null;
    report[item] = {};
    for (const size of smaller) {
      const target = Math.round((nUnits * size) / full);
      const alloc = largestRemainder(keys.map((k) => strataMap.get(k).length), target);
      if (prev && alloc.some((n, i) => n < prev[i])) {
        throw new Error(`${item}: 서브셋 포함 관계가 깨집니다(${size}). strata/seed를 확인하세요.`);
      }
      prev = alloc;
      keys.forEach((k, i) => {
        for (const unitId of strataMap.get(k).slice(0, alloc[i])) {
          if (!subsetMin.has(unitId)) subsetMin.set(unitId, size);
        }
      });
      report[item][size] = Object.fromEntries(keys.map((k, i) => [k || '(전체)', alloc[i]]));
    }
  }
  return { subsetMin, report };
}

function main() {
  const { config, paths, repoRel } = profile.load();
  const ds = config.dataset;
  const cols = ds.columns;
  const sourcePath = path.join(paths.root, ds.source);
  const check = argv.includes('--check');

  console.log(`[${profile.load().label}] 원본: ${ds.source}`);
  const wb = readWorkbook(sourcePath, [ds.sheet, ds.faqSheet].filter(Boolean));
  const rows = sheetToObjects(wb.sheets[ds.sheet]);
  if (!rows.length) throw new Error(`시트가 비어 있습니다: ${ds.sheet}`);

  // 결과 기록용 빈 칸(dataset.resultColumns)은 버린다. 값이 하나라도 있으면 입력 데이터일 수 있으니 멈춘다.
  const rc = ds.resultColumns || {};
  const isResultColumn = (h) => (rc.names || []).includes(h) || (rc.prefixes || []).some((p) => h.startsWith(p));
  const dropped = Object.keys(rows[0]).filter(isResultColumn);
  for (const h of dropped) {
    const filled = rows.filter((r) => String(r[h] ?? '').trim() !== '').length;
    if (filled) throw new Error(`결과 칸으로 지정된 컬럼에 값이 있습니다(${filled}행): ${h}`);
  }
  const header = Object.keys(rows[0]).filter((h) => h !== cols.subsetMin && !isResultColumn(h));
  for (const [field, column] of Object.entries(cols)) {
    if (field !== 'subsetMin' && !header.includes(column)) throw new Error(`원본에 없는 컬럼(${field}): ${column}`);
  }
  const ids = new Set();
  for (const r of rows) {
    if (!r[cols.id] || ids.has(r[cols.id])) throw new Error(`빈/중복 ID: ${r[cols.id]}`);
    ids.add(r[cols.id]);
    for (const f of ['history', 'userInfo']) {
      const v = (r[cols[f]] || '').trim();
      if (v) { try { JSON.parse(v); } catch (e) { throw new Error(`${r[cols.id]} ${cols[f]} JSON 오류: ${e.message}`); } }
    }
  }

  const { subsetMin, report } = assignSubsets(rows, cols, ds.subset);
  const out = rows.map((r) => ({
    ...Object.fromEntries(header.map((h) => [h, r[h]])),
    [cols.subsetMin]: subsetMin.get(r[cols.originalId] || r[cols.id]) || ds.subset.full,
  }));
  const casesCsv = toCsv(out, [...header, cols.subsetMin]);

  let faqCsv = null;
  if (ds.faqSheet && ds.faqPath) {
    const faqRows = sheetToObjects(wb.sheets[ds.faqSheet]);
    faqCsv = toCsv(faqRows, Object.keys(faqRows[0]));
  }

  // 항목 × 규모 × 난이도 건수
  const counts = {};
  for (const size of ds.subset.sizes) {
    counts[size] = {};
    for (const r of out) {
      if (r[cols.subsetMin] > size) continue;
      const item = r[cols.item];
      counts[size][item] = counts[size][item] || { total: 0 };
      counts[size][item].total++;
      const d = r[cols.difficulty];
      counts[size][item][d] = (counts[size][item][d] || 0) + 1;
    }
  }

  const manifest = {
    dataset: ds.name,
    source: ds.source,
    source_sha256: sha256(fs.readFileSync(sourcePath)),
    sheet: ds.sheet,
    rows: out.length,
    dropped_result_columns: dropped,
    cases_path: ds.casesPath,
    cases_sha256: sha256(Buffer.from(casesCsv, 'utf8')),
    faq_path: ds.faqPath || null,
    faq_sha256: faqCsv ? sha256(Buffer.from(faqCsv, 'utf8')) : null,
    subset_rule: { ...ds.subset, unit: 'originalId', note: '작은 규모는 큰 규모에 포함된다' },
    subset_allocation: report,
    counts_by_size: counts,
  };

  if (check) {
    const same = fs.existsSync(paths.casesPath) && fs.readFileSync(paths.casesPath, 'utf8') === casesCsv;
    console.log(same ? '기존 CSV와 동일합니다.' : '기존 CSV와 다릅니다(또는 없음).');
    process.exitCode = same ? 0 : 1;
    return;
  }

  fs.mkdirSync(path.dirname(paths.casesPath), { recursive: true });
  fs.writeFileSync(paths.casesPath, casesCsv, 'utf8');
  if (faqCsv) fs.writeFileSync(paths.faqPath, faqCsv, 'utf8');
  fs.writeFileSync(paths.datasetManifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log(`cases: ${out.length}행 -> ${repoRel(paths.casesPath)}`);
  if (faqCsv) console.log(`faq: -> ${repoRel(paths.faqPath)}`);
  console.log(`manifest -> ${repoRel(paths.datasetManifestPath)}`);
  for (const size of ds.subset.sizes) {
    const total = Object.values(counts[size]).reduce((s, c) => s + c.total, 0);
    console.log(`  n${size}: 총 ${total}행 (${Object.entries(counts[size]).map(([k, v]) => `${k} ${v.total}`).join(' · ')})`);
  }
}

try { main(); } catch (e) { console.error(e.message); process.exit(1); }
