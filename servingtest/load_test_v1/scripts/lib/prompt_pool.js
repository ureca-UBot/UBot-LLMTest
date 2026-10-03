'use strict';
// 항목 비율을 유지한 부하 문항 풀. 기본 JSONL에는 모델 입력만 포함한다.
// seed와 15항목 묶음 순서를 고정해 모든 모델에 같은 요청을 보낸다.

const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const { parseCsvObjects } = require('./csv');
const { buildMessages } = require('./prompts');
const suitePaths = require('./suite');

function loadUniqueCases(csvPath = suitePaths.casesPath()) {
  const rows = parseCsvObjects(fs.readFileSync(csvPath, 'utf8'));
  const seen = new Set();
  const unique = [];
  for (const row of rows) {
    const key = row['원본 ID'] || row['ID'];
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
  }
  return unique;
}

// 작고 빠른 시드 고정 난수 (mulberry32)
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(arr, seed) {
  const out = arr.slice();
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}


function loadJsonlItems(text) {
  const seen = new Set();
  return text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim()).map((line, index) => {
    const row = JSON.parse(line);
    if (typeof row.case_id !== 'string' || !row.case_id || seen.has(row.case_id)
      || typeof row.type !== 'string' || !row.type || !Array.isArray(row.messages) || !row.messages.length
      || !row.messages.some((m) => m.role === 'user')
      || row.messages.some((m) => !['system', 'user', 'assistant'].includes(m.role) || typeof m.content !== 'string')) {
      throw new Error(`부하 문항 JSONL ${index + 1}행: ID·항목·messages 형식 또는 중복 ID를 확인하세요`);
    }
    seen.add(row.case_id);
    return { caseId: row.case_id, type: row.type, messages: row.messages,
      inputChars: row.messages.reduce((n, m) => n + m.content.length, 0) };
  });
}

// 각 묶음에서 항목마다 한 문항씩 뽑는다. 묶음 내 항목 순서와 항목 내 문항 순서는 seed 고정.
function shuffledByType(items, seed) {
  const groups = new Map();
  for (const item of items) {
    if (!groups.has(item.type)) groups.set(item.type, []);
    groups.get(item.type).push(item);
  }
  let offset = 0;
  for (const [type, group] of groups) groups.set(type, shuffled(group, (seed + ++offset) >>> 0));
  const rand = mulberry32(seed);
  const out = [];
  while (groups.size) {
    const types = shuffled([...groups.keys()], Math.floor(rand() * 4294967296));
    for (const type of types) {
      const group = groups.get(type);
      out.push(group.pop());
      if (!group.length) groups.delete(type);
    }
  }
  return out;
}

class PromptPool {
  constructor({ seed = 20261001, csvPath = suitePaths.casesPath() } = {}) {
    this.source = path.resolve(csvPath);
    const raw = fs.readFileSync(this.source, 'utf8');
    this.sha256 = createHash('sha256').update(raw).digest('hex');
    const isJsonl = path.extname(this.source).toLowerCase() === '.jsonl';
    const items = isJsonl ? loadJsonlItems(raw) : loadUniqueCases(this.source).map((row) => {
      const messages = buildMessages(row);
      return { caseId: row['ID'], type: row['유형'], difficulty: row['난이도'], messages,
        inputChars: messages.reduce((n, m) => n + m.content.length, 0) };
    });
    if (!items.length) throw new Error('질문 풀이 비어 있습니다 (문항 파일 확인)');
    this.categories = {};
    for (const item of items) this.categories[item.type] = (this.categories[item.type] || 0) + 1;
    this.items = isJsonl ? shuffledByType(items, seed) : shuffled(items, seed);
  }

  get size() {
    return this.items.length;
  }

  // 단계마다 새 커서를 만든다. 여러 가상 사용자가 하나의 커서를 공유하므로
  // "보낸 순서"는 항상 풀의 순서와 같다. 풀을 다 쓰면 처음으로 돌아간다.
  cursor(start = 0) {
    let i = start;
    const items = this.items;
    return {
      next() {
        const item = items[i % items.length];
        i += 1;
        return item;
      },
      get dispatched() {
        return i - start;
      },
    };
  }
}

module.exports = { PromptPool, loadUniqueCases, loadJsonlItems, mulberry32, shuffled, shuffledByType };
