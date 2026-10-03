'use strict';

// Client-observed content chunks are not tokens. The adapter never infers token
// timing or server queue time from network chunks or server aggregate durations.
const http = require('node:http');
const https = require('node:https');
const { performance } = require('node:perf_hooks');
const { StringDecoder } = require('node:string_decoder');

const OUTPUT_SCHEMA = Object.freeze({
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['ANSWER', 'PARTIAL', 'CLARIFY', 'ABSTAIN', 'CONFLICT', 'OUT_OF_SCOPE'] },
    answer: { type: 'string' },
    evidence_ids: { type: 'array', items: { type: 'string' } },
  },
  required: ['status', 'answer', 'evidence_ids'],
  additionalProperties: false,
});

function schemaErrors(value, schema, path = '$') {
  const errors = [];
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return [`${path}: invalid schema`];
  const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  const expected = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  if (expected.length && !expected.includes(type) && !(expected.includes('integer') && Number.isInteger(value))) {
    return [`${path}: expected ${expected.join('|')}, got ${type}`];
  }
  if (schema.enum && !schema.enum.some((entry) => JSON.stringify(entry) === JSON.stringify(value))) errors.push(`${path}: invalid enum value`);
  if ('const' in schema && JSON.stringify(schema.const) !== JSON.stringify(value)) errors.push(`${path}: invalid constant`);
  if (type === 'object') {
    for (const key of schema.required || []) if (!Object.hasOwn(value, key)) errors.push(`${path}.${key}: required`);
    for (const [key, child] of Object.entries(value)) {
      if (schema.properties && Object.hasOwn(schema.properties, key)) errors.push(...schemaErrors(child, schema.properties[key], `${path}.${key}`));
      else if (schema.additionalProperties === false) errors.push(`${path}.${key}: unexpected property`);
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') errors.push(...schemaErrors(child, schema.additionalProperties, `${path}.${key}`));
    }
  }
  if (type === 'array') {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${path}: too few items`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${path}: too many items`);
    if (schema.items) value.forEach((child, index) => errors.push(...schemaErrors(child, schema.items, `${path}[${index}]`)));
  }
  if (type === 'string') {
    if (schema.minLength !== undefined && [...value].length < schema.minLength) errors.push(`${path}: string too short`);
    if (schema.maxLength !== undefined && [...value].length > schema.maxLength) errors.push(`${path}: string too long`);
  }
  return errors;
}

function bracketedIds(text) {
  // Match an entire identifier between brackets. Never search for an evidence
  // ID as a substring (FAQ-01 is not the document [FAQ-010]).
  return [...String(text).matchAll(/\[([A-Za-z][A-Za-z0-9]*(?:[-_][A-Za-z0-9]+)+)\]/g)].map((match) => match[1]);
}

function sourceIds(messages) {
  const ids = new Set();
  for (const message of messages || []) {
    if (!message || message.role !== 'user' || typeof message.content !== 'string') continue;
    let text = message.content;
    const marker = '[참고 자료]';
    const start = text.indexOf(marker);
    if (start >= 0) {
      text = text.slice(start + marker.length);
      const boundaries = ['[사용자 정보 / API 결과]', '[사용자 질문]'].map((label) => text.indexOf(label)).filter((index) => index >= 0);
      if (boundaries.length) text = text.slice(0, Math.min(...boundaries));
    }
    for (const id of bracketedIds(text)) ids.add(id);
  }
  return ids;
}

function validateOutput(content, messages, options = {}) {
  let parsed = null;
  let errors = [];
  try { parsed = JSON.parse(content); } catch { errors.push('response is not one JSON value'); }
  if (!errors.length) {
    // The shared application contract remains mandatory even if a caller adds
    // more restrictive constraints for structured decoding.
    errors = schemaErrors(parsed, OUTPUT_SCHEMA);
    if (!errors.length && options.schema) errors.push(...schemaErrors(parsed, options.schema));
  }
  const schemaValid = errors.length === 0;
  const known = sourceIds(messages);
  const references = schemaValid ? [...parsed.evidence_ids, ...bracketedIds(parsed.answer)] : [];
  const unknown = [...new Set(references.filter((id) => !known.has(id)))];
  const evidenceValid = schemaValid && unknown.length === 0;
  const reasoningLeak = Boolean(options.reasoningContent && options.reasoningContent.trim()) || /<\/?think(?:ing)?\b/i.test(content);
  return {
    schema_valid: schemaValid,
    evidence_valid: evidenceValid,
    reasoning_leak: reasoningLeak,
    schema_errors: errors,
    unknown_evidence_ids: unknown,
    evidence_validation_scope: 'reference_id_existence_only',
    semantic_quality: 'unknown',
    parsed_output: parsed,
  };
}

function gapStats(gaps) {
  if (!gaps.length) return { chunk_gap_mean_ms: null, chunk_gap_p95_ms: null, chunk_gap_max_ms: null };
  const sorted = [...gaps].sort((a, b) => a - b);
  return {
    chunk_gap_mean_ms: gaps.reduce((sum, value) => sum + value, 0) / gaps.length,
    chunk_gap_p95_ms: sorted[Math.ceil(sorted.length * 0.95) - 1],
    chunk_gap_max_ms: sorted.at(-1),
  };
}

function finiteCount(value) { return Number.isInteger(value) && value >= 0 ? value : null; }
function errText(error) { return String(error && error.message || error).slice(0, 500); }

function createClient({ engine, host, model, transport = {}, generation = {} }) {
  if (!['ollama', 'llama.cpp', 'llamacpp', 'vllm', 'sglang'].includes(engine)) throw new Error(`Unsupported engine: ${engine}`);
  const baseUrl = new URL(host);
  if (!['http:', 'https:'].includes(baseUrl.protocol)) throw new Error('host must use http or https');
  const native = engine === 'ollama';
  const url = new URL(native ? '/api/chat' : '/v1/chat/completions', baseUrl);
  const keepAlive = transport.keepAlive !== false;
  const timeoutMs = transport.timeoutMs ?? 30000;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('timeoutMs must be positive');
  const httpAgent = new http.Agent({ keepAlive });
  const httpsAgent = new https.Agent({ keepAlive });
  const agent = url.protocol === 'https:' ? httpsAgent : httpAgent;
  const library = url.protocol === 'https:' ? https : http;
  const schema = generation.outputSchema || OUTPUT_SCHEMA;
  let closed = false;
  const pending = new Set();

  function requestBody(item) {
    const temperature = generation.temperature ?? 0;
    const maxTokens = generation.maxTokens ?? 512;
    const thinking = generation.thinking ?? false;
    if (native) return {
      model, messages: item.messages, stream: true, think: thinking,
      format: schema,
      options: { temperature, num_ctx: generation.numCtx ?? 4096, num_predict: maxTokens },
    };
    return {
      model, messages: item.messages, stream: true,
      stream_options: { include_usage: true },
      temperature, max_tokens: maxTokens,
      chat_template_kwargs: { enable_thinking: thinking },
      response_format: { type: 'json_schema', json_schema: { name: 'faq_answer', strict: true, schema } },
    };
  }

  async function send(item, sendOptions = {}) {
    const signal = sendOptions && sendOptions.signal;
    const t0 = performance.now();
    const rec = {
      caseId: item && item.caseId || null, type: item && item.type || null,
      ok: false, transport_ok: false, valid: false, contract_valid: false,
      error_type: null, error_msg: null, http_status: null,
      content: '', reasoning_content: '', ttft_ms: null, ttft_basis: 'first_content_chunk',
      e2e_ms: null, first_content_ms: null, last_content_ms: null,
      prompt_eval_count: null, eval_count: null, done_reason: null,
      chunk_count: 0, itl_basis: 'content_chunk', tpot_ms: null, queue_ms: null,
      chunk_gap_mean_ms: null, chunk_gap_p95_ms: null, chunk_gap_max_ms: null,
      request_body: null, http_keep_alive: keepAlive, socket_reused: false,
      schema_valid: false, evidence_valid: false, reasoning_leak: false,
      truncated: false, input_truncated: null, input_budget_exceeded: null, terminal_received: false,
      semantic_quality: 'unknown',
    };
    const gaps = [];
    let lastAt = null;
    let timer;
    let req;
    let res;
    let settled = false;
    let abortHandler;
    let cancelHandler;
    let finishReasonReceived = false;

    return new Promise((resolve) => {
      function finish(errorType = null, errorMessage = null) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (signal && abortHandler) signal.removeEventListener('abort', abortHandler);
        if (cancelHandler) pending.delete(cancelHandler);
        rec.e2e_ms = performance.now() - t0;
        rec.socket_reused = Boolean(req && req.reusedSocket);
        rec.error_type = errorType;
        rec.error_msg = errorMessage;
        rec.transport_ok = !errorType && rec.terminal_received;
        rec.ok = rec.transport_ok;
        rec.truncated = ['length', 'max_tokens', 'max_token', 'limit', 'max_length'].includes(rec.done_reason)
          || (rec.done_reason === null && rec.eval_count !== null && rec.eval_count >= (generation.maxTokens ?? 512));
        rec.input_budget_exceeded = rec.prompt_eval_count === null ? null
          : rec.prompt_eval_count + (generation.maxTokens ?? 512) > (generation.numCtx ?? 4096);
        Object.assign(rec, gapStats(gaps));
        try {
          Object.assign(rec, validateOutput(rec.content, item && item.messages, { schema, reasoningContent: rec.reasoning_content }));
        } catch (error) {
          // Measurement callers receive a record even for malformed caller
          // input/schema objects; a rejected Promise would lose this request.
          rec.schema_errors = [`Validation failed: ${errText(error)}`];
          rec.unknown_evidence_ids = [];
          rec.error_type ||= 'request_invalid';
          rec.error_msg ||= rec.schema_errors[0];
        }
        rec.contract_valid = rec.schema_valid && rec.evidence_valid && !rec.reasoning_leak && !rec.truncated && rec.input_truncated !== true && rec.input_budget_exceeded !== true;
        rec.valid = rec.transport_ok && rec.contract_valid;
        if (rec.transport_ok && !rec.valid) {
          rec.error_type = !rec.schema_valid ? 'output_schema' : !rec.evidence_valid ? 'evidence_id' : rec.reasoning_leak ? 'reasoning_leak' : rec.input_truncated === true ? 'input_truncated' : rec.input_budget_exceeded === true ? 'input_budget_exceeded' : 'output_truncated';
          rec.error_msg = rec.schema_errors.join('; ') || (rec.unknown_evidence_ids.length ? `Unknown evidence IDs: ${rec.unknown_evidence_ids.join(', ')}` : rec.error_type);
        }
        resolve(rec);
        if (errorType) {
          if (res) res.destroy();
          if (req) req.destroy();
        }
      }

      function content(piece) {
        if (typeof piece !== 'string' || !piece.length) return;
        const now = performance.now();
        if (rec.first_content_ms === null) rec.first_content_ms = rec.ttft_ms = now - t0;
        if (lastAt !== null) gaps.push(now - lastAt);
        lastAt = now;
        rec.last_content_ms = now - t0;
        rec.chunk_count += 1;
        rec.content += piece;
      }

      function handleObject(obj) {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return finish('stream_parse', 'Stream event must be an object');
        if (obj.error) return finish('server_error', typeof obj.error === 'string' ? obj.error : JSON.stringify(obj.error));
        if (rec.terminal_received) return finish('stream_parse', 'Data appeared after terminal marker');
        if (native) {
          if (obj.message) {
            content(obj.message.content);
            if (typeof obj.message.thinking === 'string') rec.reasoning_content += obj.message.thinking;
            if (typeof obj.message.reasoning_content === 'string') rec.reasoning_content += obj.message.reasoning_content;
          }
          if (obj.done === true) {
            rec.terminal_received = true;
            rec.done_reason = obj.done_reason ?? null;
            rec.prompt_eval_count = finiteCount(obj.prompt_eval_count);
            rec.eval_count = finiteCount(obj.eval_count);
          }
        } else {
          if (obj.usage) {
            rec.prompt_eval_count = finiteCount(obj.usage.prompt_tokens);
            rec.eval_count = finiteCount(obj.usage.completion_tokens);
          }
          if (Array.isArray(obj.choices)) {
            for (const choice of obj.choices) {
              if (choice.index !== undefined && choice.index !== 0) continue;
              const delta = choice.delta || {};
              content(delta.content);
              if (typeof delta.reasoning_content === 'string') rec.reasoning_content += delta.reasoning_content;
              if (typeof delta.reasoning === 'string') rec.reasoning_content += delta.reasoning;
              if (choice.finish_reason !== undefined && choice.finish_reason !== null) {
                rec.done_reason = choice.finish_reason;
                finishReasonReceived = true;
              }
            }
          }
        }
        const inputFlag = obj.input_truncated ?? obj.prompt_truncated ?? obj.metadata?.input_truncated;
        if (typeof inputFlag === 'boolean') rec.input_truncated = inputFlag;
      }

      function parseJson(text) {
        try { handleObject(JSON.parse(text)); } catch (error) { finish('stream_parse', `Invalid stream JSON: ${errText(error)}`); }
      }

      try {
        if (closed) return finish('client_closed', 'Client is closed');
        if (signal && signal.aborted) return finish('aborted', 'Request was cancelled');
        if (!item || !Array.isArray(item.messages) || item.messages.some((message) => !message || typeof message.role !== 'string' || typeof message.content !== 'string')) {
          return finish('request_invalid', 'messages must contain role/content strings');
        }
        rec.request_body = requestBody(item);
        const payload = JSON.stringify(rec.request_body);
        rec.request_body = JSON.parse(payload); // Immutable-by-input copy of the bytes actually sent.
        req = library.request(url, {
          method: 'POST', agent,
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), Accept: native ? 'application/x-ndjson' : 'text/event-stream' },
        }, (response) => {
          res = response;
          rec.http_status = res.statusCode;
          rec.socket_reused = Boolean(req.reusedSocket);
          const decoder = new StringDecoder('utf8');
          let buffer = '';
          let dataLines = [];
          let httpErrorBody = '';
          const httpOk = res.statusCode >= 200 && res.statusCode < 300;
          function sseEvent() {
            if (!dataLines.length || settled) return;
            const event = dataLines.join('\n');
            dataLines = [];
            if (event === '[DONE]') {
              if (rec.terminal_received) return finish('stream_parse', 'Duplicate terminal marker');
              rec.terminal_received = true;
            } else parseJson(event);
          }
          function line(text) {
            if (settled) return;
            if (native) {
              if (text.trim()) parseJson(text);
              return;
            }
            if (!text) return sseEvent();
            if (text.startsWith(':')) return;
            const colon = text.indexOf(':');
            const field = colon < 0 ? text : text.slice(0, colon);
            let value = colon < 0 ? '' : text.slice(colon + 1);
            if (value.startsWith(' ')) value = value.slice(1);
            if (field === 'data') dataLines.push(value);
            else if (!['event', 'id', 'retry'].includes(field)) finish('stream_parse', 'Unexpected SSE line');
          }
          function decoded(text) {
            if (!httpOk) { httpErrorBody = (httpErrorBody + text).slice(0, 2000); return; }
            buffer += text;
            let newline;
            while (!settled && (newline = buffer.indexOf('\n')) >= 0) {
              let entry = buffer.slice(0, newline);
              buffer = buffer.slice(newline + 1);
              if (entry.endsWith('\r')) entry = entry.slice(0, -1);
              line(entry);
            }
          }
          res.on('data', (chunk) => decoded(decoder.write(chunk)));
          res.on('end', () => {
            decoded(decoder.end());
            if (settled) return;
            if (!httpOk) return finish(`http_${res.statusCode}`, httpErrorBody);
            if (buffer.length) line(buffer.endsWith('\r') ? buffer.slice(0, -1) : buffer);
            if (!native) sseEvent();
            const complete = rec.terminal_received && (native || finishReasonReceived);
            if (!settled) finish(complete ? null : 'incomplete_stream', complete ? null : 'Missing terminal marker or completion finish_reason');
          });
          res.on('error', (error) => finish('network', errText(error)));
          res.on('aborted', () => finish('network', 'Response connection was aborted'));
        });
        req.on('error', (error) => finish('network', errText(error)));
        cancelHandler = () => finish('client_closed', 'Client closed during request');
        pending.add(cancelHandler);
        abortHandler = () => finish('aborted', 'Request was cancelled');
        if (signal) {
          signal.addEventListener('abort', abortHandler, { once: true });
          if (signal.aborted) return abortHandler();
        }
        timer = setTimeout(() => finish('timeout', `Request exceeded ${timeoutMs}ms`), timeoutMs);
        req.end(payload);
      } catch (error) { finish('request_invalid', errText(error)); }
    });
  }

  function close() {
    closed = true;
    for (const cancel of [...pending]) cancel();
    httpAgent.destroy();
    httpsAgent.destroy();
  }
  return { send, close };
}

module.exports = { createClient, validateOutput, OUTPUT_SCHEMA };
