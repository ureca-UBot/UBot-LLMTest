'use strict';

// Minimal read-only .xlsx sheet reader. Zero external dependencies: an .xlsx
// file is a zip of XML parts, so this shells out to the platform's `unzip`
// (present on Windows via Git Bash / WSL and on Linux/EC2 by default) to pull
// individual worksheet XML parts out, then parses SpreadsheetML with regexes
// (good enough for the well-formed, machine-generated XML Excel produces —
// this is not a general-purpose XML parser).
//
// Only handles inline strings (t="inlineStr"/<is><t>) and plain numeric/str
// values (<v>) — i.e. cells saved with "Save As" from a normal spreadsheet
// tool where text isn't deduplicated into sharedStrings.xml. If a workbook
// uses sharedStrings, extend `resolveSharedStrings` accordingly.

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function colToIndex(col) {
  let idx = 0;
  for (const ch of col) idx = idx * 26 + (ch.charCodeAt(0) - 64);
  return idx - 1;
}

function decodeXmlEntities(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function parseSheetXml(xml, sharedStrings) {
  const rows = [];
  const rowRe = /<(?:x:)?row r="(\d+)"[^>]*>([\s\S]*?)<\/(?:x:)?row>/g;
  let rowMatch;
  while ((rowMatch = rowRe.exec(xml))) {
    const rowNum = parseInt(rowMatch[1], 10);
    const rowContent = rowMatch[2];
    const cells = [];
    const cellRe = /<(?:x:)?c r="([A-Z]+)(\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:x:)?c>)/g;
    let cellMatch;
    while ((cellMatch = cellRe.exec(rowContent))) {
      const col = cellMatch[1];
      const attrs = cellMatch[3] || '';
      const inner = cellMatch[4] || '';
      let value = '';
      const isMatch = inner.match(/<(?:x:)?is>([\s\S]*?)<\/(?:x:)?is>/);
      if (isMatch) {
        const tRe = /<(?:x:)?t[^>]*>([\s\S]*?)<\/(?:x:)?t>/g;
        let tMatch, buf = '';
        while ((tMatch = tRe.exec(isMatch[1]))) buf += tMatch[1];
        value = decodeXmlEntities(buf);
      } else {
        const vMatch = inner.match(/<(?:x:)?v>([\s\S]*?)<\/(?:x:)?v>/);
        if (vMatch) {
          const raw = decodeXmlEntities(vMatch[1]);
          const isSharedString = /\bt="s"/.test(attrs);
          value = isSharedString ? (sharedStrings[parseInt(raw, 10)] || '') : raw;
        }
      }
      const idx = colToIndex(col);
      cells[idx] = value;
    }
    rows[rowNum] = cells;
  }
  const out = [];
  for (let r = 0; r < rows.length; r++) out.push(rows[r] || []);
  return out;
}

function parseSharedStrings(xml) {
  if (!xml) return [];
  const out = [];
  const siRe = /<(?:x:)?si>([\s\S]*?)<\/(?:x:)?si>/g;
  let siMatch;
  while ((siMatch = siRe.exec(xml))) {
    const tRe = /<(?:x:)?t[^>]*>([\s\S]*?)<\/(?:x:)?t>/g;
    let tMatch, buf = '';
    while ((tMatch = tRe.exec(siMatch[1]))) buf += tMatch[1];
    out.push(decodeXmlEntities(buf));
  }
  return out;
}

// Reads one workbook, returns { sheetNames: string[], sheets: { [name]: string[][] } }
function readWorkbook(xlsxPath, sheetNamesWanted) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xlsx-read-'));
  try {
    execFileSync('unzip', ['-o', '-q', xlsxPath, '-d', tmpDir]);

    const workbookXml = fs.readFileSync(path.join(tmpDir, 'xl', 'workbook.xml'), 'utf8');
    const relsPath = path.join(tmpDir, 'xl', '_rels', 'workbook.xml.rels');
    const relsXml = fs.readFileSync(relsPath, 'utf8');

    // sheet name -> r:id
    const nameToRid = {};
    const sheetRe = /<(?:x:)?sheet name="([^"]+)"[^>]*r:id="([^"]+)"/g;
    let m;
    while ((m = sheetRe.exec(workbookXml))) nameToRid[m[1]] = m[2];

    // r:id -> target xml file
    const ridToTarget = {};
    const relRe = /<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"[^>]*\/>|<Relationship[^>]*Target="([^"]+)"[^>]*Id="([^"]+)"[^>]*\/>/g;
    let rm;
    while ((rm = relRe.exec(relsXml))) {
      if (rm[1]) ridToTarget[rm[1]] = rm[2];
      else ridToTarget[rm[4]] = rm[3];
    }

    let sharedStrings = [];
    const sstPath = path.join(tmpDir, 'xl', 'sharedStrings.xml');
    if (fs.existsSync(sstPath)) {
      sharedStrings = parseSharedStrings(fs.readFileSync(sstPath, 'utf8'));
    }

    const wanted = sheetNamesWanted || Object.keys(nameToRid);
    const sheets = {};
    for (const name of wanted) {
      const rid = nameToRid[name];
      if (!rid) throw new Error(`sheet not found: ${name} (available: ${Object.keys(nameToRid).join(', ')})`);
      let target = ridToTarget[rid];
      target = target.replace(/^\/?xl\//, '').replace(/^\//, '');
      const sheetPath = target.startsWith('xl' + path.sep) || target.includes('/')
        ? path.join(tmpDir, 'xl', target.replace(/^xl\//, ''))
        : path.join(tmpDir, 'xl', target);
      const xml = fs.readFileSync(sheetPath, 'utf8');
      sheets[name] = parseSheetXml(xml, sharedStrings);
    }
    return { sheetNames: Object.keys(nameToRid), sheets };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// Convenience: first row = header, returns array of objects. `skipBlankFirstRow`
// handles workbooks where row 1 is empty and the real header is row 2.
function sheetToObjects(rows, { skipBlankFirstRow = true } = {}) {
  let dataRows = rows;
  if (skipBlankFirstRow && rows.length > 0 && rows[0].every((c) => !c)) {
    dataRows = rows.slice(1);
  }
  const header = dataRows[0] || [];
  return dataRows.slice(1)
    .filter((r) => r.some((c) => c !== undefined && c !== ''))
    .map((r) => {
      const obj = {};
      header.forEach((h, idx) => { obj[h] = r[idx] !== undefined ? r[idx] : ''; });
      return obj;
    });
}

module.exports = { readWorkbook, sheetToObjects };
