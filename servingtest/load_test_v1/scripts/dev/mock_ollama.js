'use strict';
// 모의 Ollama 서버 — GPU 없는 PC에서 부하 테스트 스크립트가 끝까지 도는지 확인하는 용도.
// 숫자는 실제 T4와 무관하다. 절대 결과로 쓰지 않는다.
//
// 흉내 내는 것
//   - OLLAMA_NUM_PARALLEL 슬롯 + 대기열(OLLAMA_MAX_QUEUE 초과 시 503)
//   - 동시 처리 수가 늘수록 토큰 하나당 시간이 늘어나는 배치 효과
//   - 모델 크기 + (동시 처리 수 × 슬롯당 KV)가 VRAM을 넘으면 일부가 CPU로 밀림(size_vram < size)
//   - /api/chat 스트리밍(NDJSON), /api/ps, /api/tags, /api/version, /api/generate(keep_alive:0)
//
// 실행: OLLAMA_HOST=127.0.0.1:11500 node load_test_v1/scripts/dev/mock_ollama.js serve

const http = require('http');

const hostEnv = (process.env.OLLAMA_HOST || '127.0.0.1:11434').replace(/^https?:\/\//, '');
const [HOST, PORT] = [hostEnv.split(':')[0] || '127.0.0.1', Number(hostEnv.split(':')[1] || 11434)];
const PARALLEL = Number(process.env.OLLAMA_NUM_PARALLEL || 1);
const MAX_QUEUE = Number(process.env.OLLAMA_MAX_QUEUE || 512);
const CTX = Number(process.env.OLLAMA_CONTEXT_LENGTH || 4096);
const SPEED = Number(process.env.MOCK_SPEED || 1); // 1보다 작으면 빨라짐 (테스트 시간 단축)
const VRAM_MIB = Number(process.env.MOCK_VRAM_MIB || 15360);

const MODELS = {
  'gemma3:4b': { weightsMiB: 3300, kvMiBPerSlot: 560, tokMs: 16, prefillTokS: 2500 },
  'qwen3:4b': { weightsMiB: 2600, kvMiBPerSlot: 576, tokMs: 15, prefillTokS: 3000 },
  'qwen3:8b': { weightsMiB: 5000, kvMiBPerSlot: 576, tokMs: 28, prefillTokS: 1800 },
  'qwen3:14b': { weightsMiB: 9000, kvMiBPerSlot: 640, tokMs: 53, prefillTokS: 1000 },
  'bge-m3:latest': { weightsMiB: 1200, kvMiBPerSlot: 0, tokMs: 5, prefillTokS: 5000 },
};

let loaded = null; // { name, sizeMiB, vramMiB }
let active = 0;
const queue = [];

function modelSize(name) {
  const m = MODELS[name];
  const size = m.weightsMiB + (m.kvMiBPerSlot * PARALLEL * CTX) / 4096;
  return { size, vram: Math.min(size, VRAM_MIB - 400) };
}

function load(name) {
  if (!loaded || loaded.name !== name) {
    const { size, vram } = modelSize(name);
    loaded = { name, sizeMiB: size, vramMiB: vram };
  }
}

function acquire() {
  if (active < PARALLEL) {
    active += 1;
    return Promise.resolve();
  }
  if (queue.length >= MAX_QUEUE) return null;
  return new Promise((resolve) => queue.push(resolve));
}

function release() {
  const next = queue.shift();
  if (next) next();
  else active -= 1;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MiB = 1024 * 1024;

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function readBody(req) {
  return new Promise((resolve) => {
    let b = '';
    req.on('data', (d) => { b += d; });
    req.on('end', () => {
      try { resolve(JSON.parse(b || '{}')); } catch { resolve({}); }
    });
  });
}

function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

async function chat(req, res) {
  const body = await readBody(req);
  const name = body.model;
  if (!MODELS[name]) return json(res, 404, { error: `model '${name}' not found` });
  if (body.think !== undefined && name.startsWith('gemma3')) {
    return json(res, 400, { error: `"${name}" does not support thinking` });
  }
  load(name);
  const m = MODELS[name];
  const offload = loaded.vramMiB < loaded.sizeMiB ? 6 : 1;
  const prompt = (body.messages || []).map((x) => x.content).join('\n');
  const promptTokens = Math.max(1, Math.round(prompt.length / 1.6));

  if (body.stream === false) {
    return json(res, 200, { model: name, message: { role: 'assistant', content: '{}' }, done: true, total_duration: 1e6 });
  }

  let aborted = false;
  res.on('close', () => { aborted = true; });
  const t0 = process.hrtime.bigint();
  const slot = acquire();
  if (slot === null) return json(res, 503, { error: 'server busy, please try again. maximum pending requests exceeded' });
  await slot;
  try {
    const tStart = process.hrtime.bigint();
    const batch = () => 1 + 0.12 * (active - 1);
    const prefillMs = ((promptTokens / m.prefillTokS) * 1000 * batch() * offload) * SPEED;
    await sleep(prefillMs);
    if (aborted) return;
    res.writeHead(200, { 'Content-Type': 'application/x-ndjson' });
    const outTokens = 40 + (hash(prompt) % 140);
    const answer = `{"status":"ANSWER","answer":"${'가상 응답 '.repeat(Math.ceil(outTokens / 3)).slice(0, outTokens * 2)}","evidence_ids":[]}`;
    const pieces = answer.match(/.{1,2}/g);
    const tEval = process.hrtime.bigint();
    for (const piece of pieces) {
      if (aborted) return;
      await sleep(m.tokMs * batch() * offload * SPEED);
      res.write(JSON.stringify({ model: name, message: { role: 'assistant', content: piece }, done: false }) + '\n');
    }
    const tEnd = process.hrtime.bigint();
    res.end(JSON.stringify({
      model: name, message: { role: 'assistant', content: '' }, done: true, done_reason: 'stop',
      total_duration: Number(tEnd - t0), load_duration: 1e5,
      prompt_eval_count: promptTokens, prompt_eval_duration: Number(tEval - tStart),
      eval_count: pieces.length, eval_duration: Number(tEnd - tEval),
    }) + '\n');
  } finally {
    release();
  }
}

const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  if (req.method === 'GET' && url === '/api/version') return json(res, 200, { version: 'mock-0.1' });
  if (req.method === 'GET' && url === '/api/tags') return json(res, 200, { models: Object.keys(MODELS).map((name) => ({ name })) });
  if (req.method === 'GET' && url === '/api/ps') {
    return json(res, 200, {
      models: loaded ? [{
        name: loaded.name, size: Math.round(loaded.sizeMiB * MiB), size_vram: Math.round(loaded.vramMiB * MiB),
        context_length: CTX, expires_at: '2318-01-01T00:00:00Z',
      }] : [],
    });
  }
  if (req.method === 'POST' && url === '/api/generate') {
    const body = await readBody(req);
    if (body.keep_alive === 0 && loaded && loaded.name === body.model) loaded = null;
    return json(res, 200, { model: body.model, done: true, response: '' });
  }
  if (req.method === 'POST' && url === '/api/chat') return chat(req, res);
  json(res, 404, { error: 'not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`mock ollama on ${HOST}:${PORT} parallel=${PARALLEL} queue=${MAX_QUEUE} speed=${SPEED}`);
});
process.on('SIGTERM', () => server.close(() => process.exit(0)));
