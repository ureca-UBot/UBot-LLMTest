'use strict';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// Calls Ollama /api/chat once (non-streaming) and returns parsed timing + content.
// forceJson=true asks Ollama to constrain output to valid JSON syntax (format: "json").
async function chatOnce(model, systemPrompt, userPrompt, { forceJson = true, timeoutMs = 120000 } = {}) {
  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    stream: false,
  };
  if (forceJson) body.format = 'json';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  let res;
  try {
    res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    return {
      ok: false,
      error: `request_failed: ${err.message}`,
      wallClockMs: Date.now() - startedAt,
    };
  }
  clearTimeout(timer);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { ok: false, error: `http_${res.status}: ${text.slice(0, 300)}`, wallClockMs: Date.now() - startedAt };
  }

  const data = await res.json();
  const rawContent = data.message && data.message.content ? data.message.content : '';

  // Ollama timing fields are nanoseconds.
  const totalDurationMs = data.total_duration ? data.total_duration / 1e6 : null;
  const loadDurationMs = data.load_duration ? data.load_duration / 1e6 : 0;
  const evalCount = data.eval_count || 0;
  const evalDurationMs = data.eval_duration ? data.eval_duration / 1e6 : null;

  const latencyMs = totalDurationMs !== null ? Math.round(totalDurationMs - loadDurationMs) : null;
  const tokensPerSec = evalDurationMs && evalCount ? Number((evalCount / (evalDurationMs / 1000)).toFixed(2)) : null;

  let parsed = null;
  let formatValid = false;
  try {
    parsed = JSON.parse(rawContent);
    formatValid = true;
  } catch (e) {
    formatValid = false;
  }

  return {
    ok: true,
    rawContent,
    parsed,
    formatValid,
    latencyMs,
    loadDurationMs: Math.round(loadDurationMs),
    tokensOut: evalCount,
    tokensPerSec,
    wallClockMs: Date.now() - startedAt,
  };
}

module.exports = { chatOnce, OLLAMA_URL };
