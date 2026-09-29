'use strict';
// Shared JSONL read/append helpers. The "append as you go + skip already-done
// IDs on restart" pattern here is what makes every pipeline stage resumable
// after a crash/timeout on a 1000-case run instead of starting over.

const fs = require('fs');
const path = require('path');

function readExistingIds(filePath, idField = 'id') {
  const ids = new Set();
  if (!fs.existsSync(filePath)) return ids;
  const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (obj[idField]) ids.add(obj[idField]);
    } catch {
      // ignore a truncated last line (e.g. process was killed mid-write)
    }
  }
  return ids;
}

function readAll(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(Boolean);
}

function makeAppender(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const fd = fs.openSync(filePath, 'a');
  return {
    append(obj) {
      fs.writeSync(fd, JSON.stringify(obj) + '\n');
    },
    close() {
      fs.closeSync(fd);
    },
  };
}

module.exports = { readExistingIds, readAll, makeAppender };
