'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runOpenLoop, sleep } = require('../lib/load_generator');

function cursor() {
  let index = 0;
  return { next: () => ({ caseId: `probe-${++index}`, type: 'probe', inputChars: 4 }) };
}

test('arrival measurement keeps its full observation window when no requests arrive', async () => {
  const durationMs = 40;
  const result = await runOpenLoop({
    rate: 0.001, durationMs, cursor: cursor(), seed: 1, maxInFlight: 10,
    send: async () => { throw new Error('this seeded sparse interval has no arrivals'); },
  });
  assert.equal(result.records.length, 0);
  assert.ok(result.elapsedMs >= durationMs,
    `observation ended at ${result.elapsedMs}ms before its ${durationMs}ms boundary`);
  assert.ok(result.window.endMs <= result.elapsedMs + 1);
});

test('arrival measurement drains responses that finish after the observation window', async () => {
  const saved = [];
  const result = await runOpenLoop({
    rate: 100, durationMs: 40, cursor: cursor(), seed: 1, maxInFlight: 20,
    send: async () => { await sleep(70); return { ok: true, content: 'ok' }; },
    onRecord: (record) => saved.push(record),
  });
  assert.ok(result.records.length > 0);
  assert.equal(saved.length, result.records.length);
  assert.ok(result.drainMs > 0);
  assert.ok(result.elapsedMs > 40);
  assert.ok(result.window.endMs <= result.elapsedMs + 1);
});
