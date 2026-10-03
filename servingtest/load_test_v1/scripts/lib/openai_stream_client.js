'use strict';
// llama.cpp / vLLM / SGLang의 SSE를 공통 요청 기록으로 변환한다.
const { performance } = require('perf_hooks');
const { libFor, getAgent, errText } = require('./http_client');
const { percentile, mean } = require('./stats');

function buildBody({ model, messages, generation, think, mergeSystem = false }) {
  const turns = messages.map((m) => ({ ...m }));
  if (mergeSystem) {
    const system = turns.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
    for (let i = turns.length - 1; i >= 0; i--) if (turns[i].role === 'system') turns.splice(i, 1);
    const user = turns.find((m) => m.role === 'user');
    if (system && user) user.content = `${system}\n\n${user.content}`;
  }
  const body = { model, messages: turns, stream: true, stream_options: { include_usage: true },
    temperature: generation.temperature, max_tokens: generation.num_predict };
  if (generation.format === 'json') body.response_format = { type: 'json_object' };
  if (think === false) body.chat_template_kwargs = { enable_thinking: false };
  return body;
}

function streamChat({ host, model, messages, generation, think, timeoutMs, mergeSystem, keepAlive = false }) {
  const body = buildBody({ model, messages, generation, think, mergeSystem });
  const payload = JSON.stringify(body);
  const url = new URL('/v1/chat/completions', host);
  const rec = { ok: false, error_type: null, error_msg: null, http_status: null,
    content: '', reasoning_content: '', chunks: 0, ttft_ms: null, e2e_ms: null,
    first_content_ms: null, last_content_ms: null, done_reason: null,
    prompt_eval_count: null, eval_count: null, prompt_eval_ms: null, eval_ms: null,
    load_ms: null, server_total_ms: null, wait_est_ms: null, queue_ms: null,
    itl_mean_ms: null, itl_p95_ms: null, itl_max_ms: null, itl_basis: 'content_chunk',
    tpot_ms: null, user_tok_s: null, post_ttft_tok_s: null, request_body: body,
    http_keep_alive: keepAlive, socket_reused: false };
  return new Promise((resolve) => {
    const t0 = performance.now();
    const parts = [], reasoning = [], gaps = [];
    let settled = false, terminal = false, done = false, buf = '', timer, req;
    const finish = (type, message) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      rec.e2e_ms = performance.now() - t0;
      rec.content = parts.join(''); rec.reasoning_content = reasoning.join('');
      if (type && !rec.error_type) { rec.error_type = type; rec.error_msg = message; }
      if (!rec.error_type && (!done || !terminal)) rec.error_type = 'incomplete_stream';
      // thinking OFF가 무시된 경우 결과를 정상 비교에 섞지 않는다.
      if (think === false && rec.reasoning_content && !rec.error_type) rec.error_type = 'thinking_not_disabled';
      rec.ok = !rec.error_type && done && terminal;
      rec.itl_mean_ms = mean(gaps); rec.itl_p95_ms = percentile(gaps, 0.95);
      rec.itl_max_ms = gaps.length ? Math.max(...gaps) : null;
      if (rec.eval_count > 1 && rec.last_content_ms > rec.first_content_ms) {
        rec.tpot_ms = (rec.last_content_ms - rec.first_content_ms) / (rec.eval_count - 1);
        rec.post_ttft_tok_s = (rec.eval_count - 1) * 1000 / (rec.last_content_ms - rec.first_content_ms);
      }
      if (rec.eval_count !== null && rec.e2e_ms > 0) rec.user_tok_s = rec.eval_count * 1000 / rec.e2e_ms;
      resolve(rec);
    };
    const event = (block) => {
      const data = block.split('\n').filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trimStart()).join('\n');
      if (!data) return; // SSE comment, id, event, keepalive
      if (data.trim() === '[DONE]') { done = true; return; }
      let obj;
      try { obj = JSON.parse(data); } catch { rec.error_type = 'stream_parse'; rec.error_msg = data.slice(0, 200); return; }
      if (obj.error) { rec.error_type = 'server_error'; rec.error_msg = JSON.stringify(obj.error).slice(0, 300); return; }
      if (obj.usage) {
        if (Number.isInteger(obj.usage.prompt_tokens)) rec.prompt_eval_count = obj.usage.prompt_tokens;
        if (Number.isInteger(obj.usage.completion_tokens)) rec.eval_count = obj.usage.completion_tokens;
      }
      const choice = (obj.choices || []).find((c) => c.index === 0) || (obj.choices || [])[0];
      if (!choice) return;
      const delta = choice.delta || {};
      if (typeof delta.reasoning_content === 'string') reasoning.push(delta.reasoning_content);
      if (typeof delta.content === 'string' && delta.content.length) {
        const at = performance.now() - t0;
        if (rec.first_content_ms === null) rec.first_content_ms = rec.ttft_ms = at;
        else gaps.push(at - rec.last_content_ms);
        rec.last_content_ms = at; rec.chunks++; parts.push(delta.content);
      }
      if (choice.finish_reason) { terminal = true; rec.done_reason = choice.finish_reason; }
    };
    const consume = () => {
      let boundary;
      while ((boundary = buf.indexOf('\n\n')) >= 0) {
        event(buf.slice(0, boundary)); buf = buf.slice(boundary + 2);
      }
    };
    try {
      req = libFor(url).request({ hostname: url.hostname, port: url.port, path: url.pathname, method: 'POST',
        // llama.cpp can close its SSE connection before a pooled socket is reused.
        // Use one connection per request for all native engines; never retry a failed measurement.
        agent: keepAlive ? getAgent() : false, headers: { 'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload), Connection: keepAlive ? 'keep-alive' : 'close' } }, (res) => {
        rec.socket_reused = req.reusedSocket === true;
        rec.http_status = res.statusCode; res.setEncoding('utf8');
        if (res.statusCode !== 200) {
          let text = '';
          res.on('data', (chunk) => { text = (text + chunk).slice(0, 300); });
          res.on('end', () => finish(`http_${res.statusCode}`, text));
        } else {
          // CRLF may be split between TCP chunks. Normalize only after concatenation.
          res.on('data', (chunk) => { buf = (buf + chunk).replace(/\r\n/g, '\n'); consume(); });
          res.on('end', () => { if (buf.trim()) event(buf); finish(); });
        }
        res.on('error', (e) => finish('network', errText(e)));
        res.on('aborted', () => finish('network', '응답 도중 연결 끊김'));
      });
      timer = setTimeout(() => { finish('timeout', `클라이언트 타임아웃 ${timeoutMs}ms`); req.destroy(); }, timeoutMs);
      req.on('error', (e) => { rec.socket_reused = req.reusedSocket === true; finish('network', errText(e)); });
      req.end(payload);
    } catch (e) { finish('network', errText(e)); }
  });
}

module.exports = { buildBody, streamChat };
