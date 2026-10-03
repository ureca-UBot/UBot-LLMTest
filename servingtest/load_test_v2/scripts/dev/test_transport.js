'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const { createClient, validateOutput, OUTPUT_SCHEMA } = require('../lib/transport');

const OUTPUT = { status: 'ANSWER', answer: '안내된 자료를 확인하세요. [FAQ-010]', evidence_ids: ['FAQ-010'] };
const ITEM = {
  caseId: 'mock-1', type: 'SF',
  messages: [
    { role: 'system', content: 'Return the shared JSON contract.' },
    { role: 'user', content: '[참고 자료]\n[FAQ-010] 참고 자료입니다.\n[FAQ-011] 추가 자료입니다.\n[사용자 질문]\n설명해주세요. [FAQ-999]' },
  ],
};
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function mock(t, handler) {
  const requests = [];
  const sockets = new Map();
  let nextSocket = 0;
  const server = http.createServer(async (req, res) => {
    const buffers = [];
    for await (const buffer of req) buffers.push(buffer);
    if (!sockets.has(req.socket)) sockets.set(req.socket, ++nextSocket);
    const record = { path: req.url, headers: req.headers, socket: sockets.get(req.socket), body: JSON.parse(Buffer.concat(buffers).toString('utf8')) };
    requests.push(record);
    try { await handler(req, res, record, requests.length); } catch (error) { res.destroy(error); }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  return { host: `http://127.0.0.1:${server.address().port}`, requests };
}

function packet(engine, text, { reasoning = '', doneReason = 'stop', terminal = true, usage = true } = {}) {
  // Deliberately split JSON across logical content chunks, independently of TCP.
  const parts = [text.slice(0, 18), text.slice(18, 43), text.slice(43)];
  if (engine === 'ollama') {
    const chunks = parts.map((content, index) => ({ message: { content, ...(index === 0 && reasoning ? { thinking: reasoning } : {}) }, done: false }));
    if (terminal) chunks.push({ message: { content: '' }, done: true, done_reason: doneReason, ...(usage ? { prompt_eval_count: 101, eval_count: 27 } : {}) });
    return chunks.map((chunk) => JSON.stringify(chunk) + '\r\n').join('');
  }
  const events = parts.map((content, index) => ({ choices: [{ index: 0, delta: { content, ...(index === 0 && reasoning ? { reasoning_content: reasoning } : {}) }, finish_reason: null }] }));
  events.push({ choices: [{ index: 0, delta: {}, finish_reason: doneReason }] });
  if (usage) events.push({ choices: [], usage: { prompt_tokens: 101, completion_tokens: 27 } });
  return ': heartbeat\r\n\r\n' + events.map((event) => 'data: ' + JSON.stringify(event) + '\r\n\r\n').join('') + (terminal ? 'data: [DONE]\r\n\r\n' : '');
}

async function fragmented(res, text) {
  const bytes = Buffer.from(text, 'utf8');
  for (let offset = 0; offset < bytes.length; offset += 3) {
    if (res.destroyed) return;
    res.write(bytes.subarray(offset, offset + 3));
    await new Promise((resolve) => setImmediate(resolve));
  }
  res.end();
}

function clientFor(t, engine, host, extra = {}) {
  const client = createClient({
    engine, host, model: 'qwen3-classic-4b',
    transport: { keepAlive: true, timeoutMs: 2000, ...extra.transport },
    generation: { temperature: 0, numCtx: 4096, maxTokens: 512, thinking: false, outputSchema: OUTPUT_SCHEMA },
  });
  t.after(() => client.close());
  return client;
}

for (const engine of ['ollama', 'llama.cpp', 'vllm', 'sglang']) {
  test(`${engine}: fragmented UTF8/CRLF stream preserves content and uses one request contract`, async (t) => {
    const fixture = await mock(t, async (req, res) => {
      res.setHeader('Content-Type', engine === 'ollama' ? 'application/x-ndjson' : 'text/event-stream');
      await fragmented(res, packet(engine, JSON.stringify(OUTPUT)));
    });
    const client = clientFor(t, engine, fixture.host);
    const rec = await client.send(ITEM);
    assert.equal(rec.ok, true);
    assert.equal(rec.transport_ok, true);
    assert.equal(rec.valid, true);
    assert.equal(rec.content, JSON.stringify(OUTPUT));
    assert.equal(rec.schema_valid, true);
    assert.equal(rec.evidence_valid, true);
    assert.equal(rec.terminal_received, true);
    assert.equal(rec.semantic_quality, 'unknown');
    assert.equal(rec.prompt_eval_count, 101);
    assert.equal(rec.eval_count, 27);
    assert.equal(rec.chunk_count, 3);
    assert.equal(rec.ttft_basis, 'first_content_chunk');
    assert.equal(rec.itl_basis, 'content_chunk');
    assert.equal(rec.tpot_ms, null);
    assert.equal(rec.queue_ms, null);
    assert.equal(rec.input_truncated, null);
    assert.ok(rec.ttft_ms >= 0 && rec.e2e_ms >= rec.ttft_ms);
    assert.ok(rec.chunk_gap_p95_ms >= 0);
    const request = fixture.requests[0];
    assert.equal(request.path, engine === 'ollama' ? '/api/chat' : '/v1/chat/completions');
    assert.equal(request.body.stream, true);
    assert.deepEqual(request.body.messages, ITEM.messages);
    assert.deepEqual(rec.request_body, request.body);
    if (engine === 'ollama') {
      assert.equal(request.body.think, false);
      assert.deepEqual(request.body.format, OUTPUT_SCHEMA);
      assert.deepEqual(request.body.options, { temperature: 0, num_ctx: 4096, num_predict: 512 });
    } else {
      assert.equal(request.body.chat_template_kwargs.enable_thinking, false);
      assert.equal(request.body.max_tokens, 512);
      assert.equal(request.body.temperature, 0);
      assert.deepEqual(request.body.response_format.json_schema.schema, OUTPUT_SCHEMA);
      assert.equal(request.body.response_format.json_schema.strict, true);
    }
  });
}

for (const engine of ['ollama', 'vllm']) {
  for (const keepAlive of [true, false]) {
    test(`${engine}: keepAlive=${keepAlive} has observed matching socket policy`, async (t) => {
      const fixture = await mock(t, (req, res) => res.end(packet(engine, JSON.stringify(OUTPUT))));
      const client = clientFor(t, engine, fixture.host, { transport: { keepAlive } });
      const first = await client.send(ITEM);
      const second = await client.send(ITEM);
      assert.equal(first.valid, true);
      assert.equal(second.valid, true);
      assert.equal(first.socket_reused, false);
      assert.equal(second.socket_reused, keepAlive);
      assert.equal(second.http_keep_alive, keepAlive);
      assert.equal(fixture.requests[0].socket === fixture.requests[1].socket, keepAlive);
    });
  }

  const invalidCases = [
    ['non-JSON output', 'not JSON', {}, 'output_schema'],
    ['missing output field', JSON.stringify({ status: 'ANSWER', answer: '설명' }), {}, 'output_schema'],
    ['unexpected output field', JSON.stringify({ ...OUTPUT, extra: true }), {}, 'output_schema'],
    ['unknown status', JSON.stringify({ ...OUTPUT, status: 'OK' }), {}, 'output_schema'],
    ['unknown evidence array ID', JSON.stringify({ ...OUTPUT, evidence_ids: ['FAQ-01'] }), {}, 'evidence_id'],
    ['unknown inline evidence ID', JSON.stringify({ ...OUTPUT, answer: '없는 자료 [FAQ-999]' }), {}, 'evidence_id'],
    ['reasoning field', JSON.stringify(OUTPUT), { reasoning: 'internal thought' }, 'reasoning_leak'],
    ['reasoning tag', JSON.stringify({ ...OUTPUT, answer: '<think>비공개 생각</think>' }), {}, 'reasoning_leak'],
    ['length truncation', JSON.stringify(OUTPUT), { doneReason: 'length' }, 'output_truncated'],
  ];
  for (const [name, output, options, error] of invalidCases) {
    test(`${engine}: HTTP 200 ${name} is excluded from valid throughput`, async (t) => {
      const fixture = await mock(t, (req, res) => res.end(packet(engine, output, options)));
      const rec = await clientFor(t, engine, fixture.host).send(ITEM);
      assert.equal(rec.transport_ok, true);
      assert.equal(rec.ok, true);
      assert.equal(rec.valid, false);
      assert.equal(rec.error_type, error);
      assert.equal(rec.content, output);
      if (name === 'reasoning field') assert.equal(rec.reasoning_content, 'internal thought');
      if (name === 'length truncation') assert.equal(rec.truncated, true);
    });
  }

  test(`${engine}: missing terminal marker is a transport failure even with valid output`, async (t) => {
    const fixture = await mock(t, (req, res) => res.end(packet(engine, JSON.stringify(OUTPUT), { terminal: false })));
    const rec = await clientFor(t, engine, fixture.host).send(ITEM);
    assert.equal(rec.transport_ok, false);
    assert.equal(rec.schema_valid, true);
    assert.equal(rec.valid, false);
    assert.equal(rec.error_type, 'incomplete_stream');
    assert.equal(rec.content, JSON.stringify(OUTPUT));
  });

  test(`${engine}: malformed stream JSON is a transport failure`, async (t) => {
    const fixture = await mock(t, (req, res) => res.end(engine === 'ollama' ? '{not JSON}\n' : 'data: {not JSON}\n\n'));
    const rec = await clientFor(t, engine, fixture.host).send(ITEM);
    assert.equal(rec.transport_ok, false);
    assert.equal(rec.error_type, 'stream_parse');
  });

  test(`${engine}: HTTP failure does not retry`, async (t) => {
    const fixture = await mock(t, (req, res) => { res.statusCode = 503; res.end('queue full'); });
    const rec = await clientFor(t, engine, fixture.host).send(ITEM);
    assert.equal(rec.http_status, 503);
    assert.equal(rec.error_type, 'http_503');
    assert.equal(rec.transport_ok, false);
    assert.equal(fixture.requests.length, 1);
  });

  test(`${engine}: server error event is a transport failure`, async (t) => {
    const fixture = await mock(t, (req, res) => res.end(engine === 'ollama' ? '{"error":"bad model"}\n' : 'data: {"error":{"message":"bad model"}}\n\n'));
    const rec = await clientFor(t, engine, fixture.host).send(ITEM);
    assert.equal(rec.error_type, 'server_error');
    assert.equal(rec.transport_ok, false);
  });

  for (const cancellation of ['timeout', 'aborted', 'client_closed']) {
    test(`${engine}: ${cancellation} retains partial content and resolves once`, async (t) => {
      let started;
      const ready = new Promise((resolve) => { started = resolve; });
      const fixture = await mock(t, (req, res) => {
        res.write(engine === 'ollama' ? '{"message":{"content":"partial"},"done":false}\n' : 'data: {"choices":[{"delta":{"content":"partial"}}]}\n\n');
        started();
      });
      const client = clientFor(t, engine, fixture.host, { transport: { timeoutMs: cancellation === 'timeout' ? 60 : 2000 } });
      const abort = new AbortController();
      const pending = client.send(ITEM, { signal: abort.signal });
      await ready;
      await delay(10);
      if (cancellation === 'aborted') abort.abort();
      if (cancellation === 'client_closed') client.close();
      const rec = await pending;
      assert.equal(rec.error_type, cancellation);
      assert.equal(rec.content, 'partial');
      assert.equal(rec.transport_ok, false);
      assert.equal(rec.valid, false);
      assert.equal(fixture.requests.length, 1);
    });
  }

  test(`${engine}: pre-aborted request and invalid item resolve without sending`, async (t) => {
    const fixture = await mock(t, (req, res) => res.end(packet(engine, JSON.stringify(OUTPUT))));
    const client = clientFor(t, engine, fixture.host);
    const abort = new AbortController();
    abort.abort();
    assert.equal((await client.send(ITEM, { signal: abort.signal })).error_type, 'aborted');
    assert.equal((await client.send(null)).error_type, 'request_invalid');
    assert.equal((await client.send({ messages: [null] }, null)).error_type, 'request_invalid');
    client.close();
    assert.equal((await client.send(ITEM)).error_type, 'client_closed');
    assert.equal(fixture.requests.length, 0);
  });

  test(`${engine}: absent engine usage remains null rather than chunk-derived token counts`, async (t) => {
    const fixture = await mock(t, (req, res) => res.end(packet(engine, JSON.stringify(OUTPUT), { usage: false })));
    const rec = await clientFor(t, engine, fixture.host).send(ITEM);
    assert.equal(rec.valid, true);
    assert.equal(rec.eval_count, null);
    assert.equal(rec.prompt_eval_count, null);
    assert.equal(rec.tpot_ms, null);
  });
}

test('validator uses exact source IDs, excludes question-only IDs, and does not claim semantic quality', () => {
  const good = validateOutput(JSON.stringify(OUTPUT), ITEM.messages);
  assert.equal(good.evidence_valid, true);
  assert.equal(good.semantic_quality, 'unknown');
  const questionOnly = validateOutput(JSON.stringify({ ...OUTPUT, evidence_ids: ['FAQ-999'] }), ITEM.messages);
  assert.deepEqual(questionOnly.unknown_evidence_ids, ['FAQ-999']);
  const substring = validateOutput(JSON.stringify({ ...OUTPUT, evidence_ids: ['FAQ-01'] }), ITEM.messages);
  assert.equal(substring.evidence_valid, false);
  const systemOnly = validateOutput(JSON.stringify({ ...OUTPUT, evidence_ids: ['FAQ-012'] }), [
    { role: 'system', content: '[FAQ-012]' }, ...ITEM.messages,
  ]);
  assert.equal(systemOnly.evidence_valid, false);
});

test('SSE handles multiline data and final event without trailing newline', async (t) => {
  const fixture = await mock(t, (req, res) => {
    res.end('data: {"choices":\r\ndata: [{"delta":{"content":' + JSON.stringify(JSON.stringify(OUTPUT)) + '},"finish_reason":"stop"}]}\r\n\r\ndata: [DONE]');
  });
  const rec = await clientFor(t, 'vllm', fixture.host).send(ITEM);
  assert.equal(rec.valid, true);
  assert.equal(rec.chunk_count, 1);
});

test('HTTP 200 non-SSE JSON does not become a successful OpenAI response', async (t) => {
  const fixture = await mock(t, (req, res) => res.end(JSON.stringify({ choices: [] })));
  const rec = await clientFor(t, 'vllm', fixture.host).send(ITEM);
  assert.equal(rec.error_type, 'stream_parse');
  assert.equal(rec.transport_ok, false);
});

test('SSE DONE without choice finish_reason cannot conceal an incomplete generation', async (t) => {
  const fixture = await mock(t, (req, res) => res.end('data: {"choices":[{"delta":{"content":' + JSON.stringify(JSON.stringify(OUTPUT)) + '}}]}\n\ndata: [DONE]\n\n'));
  const rec = await clientFor(t, 'vllm', fixture.host).send(ITEM);
  assert.equal(rec.schema_valid, true);
  assert.equal(rec.terminal_received, true);
  assert.equal(rec.transport_ok, false);
  assert.equal(rec.valid, false);
  assert.equal(rec.error_type, 'incomplete_stream');
});

for (const engine of ['ollama', 'vllm']) {
  test(`${engine}: explicit server input truncation fails the request contract`, async (t) => {
    const fixture = await mock(t, (req, res) => {
      const text = packet(engine, JSON.stringify(OUTPUT));
      const flag = engine === 'ollama' ? '{"input_truncated":true}\n' : 'data: {"input_truncated":true}\n\n';
      res.end(flag + text);
    });
    const rec = await clientFor(t, engine, fixture.host).send(ITEM);
    assert.equal(rec.transport_ok, true);
    assert.equal(rec.input_truncated, true);
    assert.equal(rec.valid, false);
    assert.equal(rec.error_type, 'input_truncated');
  });
  test(`${engine}: actual prompt usage exceeding the common context/output budget fails every request`, async (t) => {
    const fixture = await mock(t, (req, res) => res.end(packet(engine, JSON.stringify(OUTPUT)).replace(engine === 'ollama' ? '"prompt_eval_count":101' : '"prompt_tokens":101', engine === 'ollama' ? '"prompt_eval_count":3900' : '"prompt_tokens":3900')));
    const rec = await clientFor(t, engine, fixture.host).send(ITEM);
    assert.equal(rec.transport_ok, true);
    assert.equal(rec.prompt_eval_count, 3900);
    assert.equal(rec.input_budget_exceeded, true);
    assert.equal(rec.valid, false);
    assert.equal(rec.error_type, 'input_budget_exceeded');
  });
}
