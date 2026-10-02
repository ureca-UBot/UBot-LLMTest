'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function shuffle(items, seed) {
  const copy = items.slice(), rand = mulberry32(seed);
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
function loadCases(file, seed = 20261001, expectedHash) {
  const source = path.resolve(file), raw = fs.readFileSync(source);
  const sha256 = createHash('sha256').update(raw).digest('hex');
  if (expectedHash && sha256 !== expectedHash.toLowerCase()) throw new Error('문항 SHA-256 불일치');
  const seen = new Set(), groups = new Map();
  for (const [index, line] of raw.toString('utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(x => x.trim()).entries()) {
    const row = JSON.parse(line);
    if (!row.case_id || seen.has(row.case_id) || !row.type || !Array.isArray(row.messages) || !row.messages.length
      || !row.messages.some(x => x.role === 'user') || row.messages.some(x => !['system', 'user', 'assistant'].includes(x.role) || typeof x.content !== 'string')) {
      throw new Error(`문항 ${index + 1}행 ID·messages 오류`);
    }
    seen.add(row.case_id);
    const item = { caseId: row.case_id, type: row.type, messages: row.messages,
      inputChars: row.messages.reduce((sum, x) => sum + x.content.length, 0) };
    if (!groups.has(item.type)) groups.set(item.type, []);
    groups.get(item.type).push(item);
  }
  if (!seen.size) throw new Error('문항 풀이 비었습니다');
  const categories = Object.fromEntries([...groups].map(([type, items]) => [type, items.length]));
  let offset = 0;
  for (const [type, items] of groups) groups.set(type, shuffle(items, seed + ++offset));
  const items = [], rand = mulberry32(seed);
  while (groups.size) for (const type of shuffle([...groups.keys()], Math.floor(rand() * 2 ** 32))) {
    const group = groups.get(type); items.push(group.pop()); if (!group.length) groups.delete(type);
  }
  return { source, sha256, categories, items, seed, size: items.length,
    cursor(start = 0) { let next = start; return { next: () => items[next++ % items.length] }; } };
}
module.exports = { loadCases, mulberry32, shuffle };
