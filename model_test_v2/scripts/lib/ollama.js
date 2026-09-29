'use strict';
// Thin REST client over the local Ollama server. Used for both (a) candidate
// LLM generation calls and (b) bge-m3 embedding calls — same server, same
// client, so local vs EC2 is purely "which OLLAMA_HOST/models are configured
// there", not a code difference.

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

// `options`는 Ollama의 생성 파라미터(temperature/seed/top_p 등)를 그대로
// 전달한다. `think`는 options가 아니라 요청 body 최상위 필드라서(= Modelfile
// PARAMETER로는 설정 불가) 따로 받는다 — Qwen3 계열의 추론 모드 on/off용.
// think가 undefined면 body에 아예 넣지 않으므로 기존 호출의 동작은 그대로다.
async function chat(model, messages, { format = 'json', options = {}, think } = {}) {
  const started = Date.now();
  const body = { model, messages, format, stream: false, options };
  if (think !== undefined) body.think = think;
  const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const wallMs = Date.now() - started;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Ollama /api/chat ${res.status}: ${text}`);
  }
  const data = await res.json();
  return {
    content: data.message ? data.message.content : '',
    model: data.model,
    wallMs,
    // Timing/token fields straight from the API (ms/ns as Ollama reports them)
    totalDurationNs: data.total_duration,
    loadDurationNs: data.load_duration,
    promptEvalCount: data.prompt_eval_count,
    promptEvalDurationNs: data.prompt_eval_duration,
    evalCount: data.eval_count,
    evalDurationNs: data.eval_duration,
    raw: data,
  };
}

async function embed(model, input) {
  const res = await fetch(`${OLLAMA_HOST}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Ollama /api/embed ${res.status}: ${text}`);
  }
  const data = await res.json();
  // data.embeddings is an array (one vector per input item); we accept a
  // single string or an array of strings.
  return Array.isArray(input) ? data.embeddings : data.embeddings[0];
}

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

// 스케일(1000건대) 리뷰에서 지적된 문제 대응: 임베딩/생성 호출 하나가
// 일시적 오류(타임아웃, 서버 재시작 등)로 실패하면 그 즉시 스테이지 전체가
// 죽던 문제 — 짧은 지수 백오프로 몇 번 재시도한 뒤에도 안 되면 그때
// 던진다. run_generation.js의 케이스별 try/catch와는 별개 계층(그건 재시도
// 다 실패한 뒤 최종 실패를 "그 케이스만" 기록하는 역할).
async function withRetry(fn, { retries = 3, baseDelayMs = 1000, label = 'ollama call' } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt < retries) {
        const delay = baseDelayMs * 2 ** attempt;
        console.warn(`  [재시도 ${attempt + 1}/${retries}] ${label} 실패, ${delay}ms 후 재시도: ${e.message}`);
        await sleep(delay);
      }
    }
  }
  throw lastErr;
}

async function ensureModelAvailable(model) {
  const res = await fetch(`${OLLAMA_HOST}/api/tags`);
  if (!res.ok) throw new Error(`Ollama /api/tags ${res.status}`);
  const data = await res.json();
  const names = (data.models || []).map((m) => m.name);
  return names.includes(model) || names.some((n) => n.startsWith(model.split(':')[0] + ':'));
}

module.exports = { chat, embed, ensureModelAvailable, withRetry, OLLAMA_HOST };
