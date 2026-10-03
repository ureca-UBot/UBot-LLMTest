'use strict';
// Ollama HTTP 연결 관리.
//
// Node 내장 fetch는 전역 연결 풀(keep-alive)을 쓴다. 동시 처리 수를 바꾸려고 Ollama를
// 재시작하면, 풀에 남은 "옛 서버와의 연결"로 요청이 가서 실패하거나(소켓 에러), 꺼지는
// 중인 옛 서버가 대답해 버리는 일이 생긴다. 모의 서버 점검에서 실제로 재현됐다.
//
// 그래서 두 종류로 나눈다.
//   - 측정 요청(스트리밍): 이 모듈의 전용 연결 풀(agent)을 쓰고, 서버를 재시작할 때마다
//     resetAgent()로 풀을 통째로 비운다.
//   - 관리 요청(상태 확인·모델 로딩·/api/ps): 매번 새 연결(agent: false). 연결 재사용이 없어서
//     "지금 이 주소에서 누가 대답하는지"를 정확히 본다.

const http = require('http');
const https = require('https');

const OLLAMA_HOST = process.env.OLLAMA_HOST
  ? (process.env.OLLAMA_HOST.startsWith('http') ? process.env.OLLAMA_HOST : `http://${process.env.OLLAMA_HOST}`)
  : 'http://127.0.0.1:11434';

const libFor = (url) => (url.protocol === 'https:' ? https : http);

let agent = new http.Agent({ keepAlive: true, maxSockets: Infinity });

function getAgent() {
  return agent;
}

// 서버 재시작 직후 반드시 호출한다. 옛 서버와 맺은 연결을 모두 끊는다.
function resetAgent() {
  agent.destroy();
  agent = new http.Agent({ keepAlive: true, maxSockets: Infinity });
}

function errText(e) {
  if (!e) return 'unknown';
  return e.code ? `${e.message} (${e.code})` : e.message;
}

// 관리용 JSON 요청 — 매번 새 연결. throw하지 않고 { ok, status, json, text, error }를 돌려준다.
function requestJson(method, pathName, body, { host = OLLAMA_HOST, timeoutMs = 10_000 } = {}) {
  return new Promise((resolve) => {
    const url = new URL(pathName, host);
    const payload = body === undefined ? null : JSON.stringify(body);
    let settled = false;
    const finish = (r) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(r);
    };
    const req = libFor(url).request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      agent: false,
      headers: payload
        ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
        : {},
    }, (res) => {
      let text = '';
      res.setEncoding('utf8');
      res.on('data', (d) => { text += d; });
      res.on('end', () => {
        let json = null;
        try { json = text ? JSON.parse(text) : null; } catch { /* JSON 아님 */ }
        finish({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, json, text, error: null });
      });
      res.on('error', (e) => finish({ ok: false, status: res.statusCode, json: null, text, error: errText(e) }));
    });
    const timer = setTimeout(() => {
      req.destroy(new Error(`timeout ${timeoutMs}ms`));
    }, timeoutMs);
    req.on('error', (e) => finish({ ok: false, status: null, json: null, text: '', error: errText(e) }));
    if (payload) req.end(payload); else req.end();
  });
}

module.exports = { OLLAMA_HOST, getAgent, resetAgent, requestJson, errText, libFor };
