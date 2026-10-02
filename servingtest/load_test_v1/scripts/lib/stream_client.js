'use strict';
// Ollama /api/chat 스트리밍 요청 1건을 보내고 시간을 잰다.
//
// 서비스가 SSE로 답변 조각을 보내는 구조라서, 사용자가 체감하는 "첫 응답 시간"은
// 첫 토큰 도착 시간(TTFT)이다. 그래서 v3(stream:false)와 달리 stream:true로 보낸다.
//
// 기록하는 시간 (모두 클라이언트 기준, performance.now() 단조 시계)
//   ttft_ms     : 요청 보낸 시점 → 내용이 있는 첫 조각 도착
//   e2e_ms      : 요청 보낸 시점 → 마지막 조각(done:true) 도착
//   itl_*       : 조각 사이 간격(토큰 간 간격). 요청 1건 안에서 평균·p95·최대
// 서버가 보고한 시간 (Ollama 마지막 조각의 *_duration, ns → ms)
//   prompt_eval_ms / eval_ms / load_ms / server_total_ms
//   wait_est_ms = e2e_ms − prompt_eval_ms − eval_ms
//     → 대기열 대기 + 네트워크·기타 오버헤드의 추정치. Ollama가 대기 시간을 따로
//       보고하지 않으므로 "추정"으로만 쓴다.
//
// 연결은 lib/http_client.js의 전용 풀을 쓴다(서버 재시작 때 초기화).
// 이 함수는 절대 throw하지 않는다. 실패도 하나의 측정 결과로 돌려준다.

const { performance } = require('perf_hooks');
const { OLLAMA_HOST, getAgent, errText, libFor } = require('./http_client');

const nsToMs = (ns) => (typeof ns === 'number' ? ns / 1e6 : null);

function gapStats(gaps) {
  if (gaps.length === 0) return { itl_mean_ms: null, itl_p95_ms: null, itl_max_ms: null };
  const sorted = gaps.slice().sort((a, b) => a - b);
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.ceil(0.95 * sorted.length) - 1));
  return {
    itl_mean_ms: gaps.reduce((a, b) => a + b, 0) / gaps.length,
    itl_p95_ms: sorted[idx],
    itl_max_ms: sorted[sorted.length - 1],
  };
}

function streamChat({ model, messages, generation, think, timeoutMs, host = OLLAMA_HOST }) {
  const body = {
    model,
    messages,
    stream: true,
    format: generation.format,
    keep_alive: generation.keepAlive,
    options: { temperature: generation.temperature, num_ctx: generation.num_ctx, num_predict: generation.num_predict },
  };
  if (think !== undefined) body.think = think;
  const payload = JSON.stringify(body);
  const url = new URL('/api/chat', host);

  const rec = {
    ok: false, error_type: null, error_msg: null, http_status: null,
    ttft_ms: null, e2e_ms: null, chunks: 0, content: '', done_reason: null,
    prompt_eval_count: null, eval_count: null, prompt_eval_ms: null, eval_ms: null,
    load_ms: null, server_total_ms: null, wait_est_ms: null,
    itl_mean_ms: null, itl_p95_ms: null, itl_max_ms: null,
    first_content_ms: null, last_content_ms: null, tpot_ms: null,
    user_tok_s: null, post_ttft_tok_s: null, request_body: body,
  };
  const gaps = [];
  const parts = [];
  let lastChunkAt = null;
  let finalChunk = null;
  let timedOut = false;

  return new Promise((resolve) => {
    const t0 = performance.now();
    let settled = false;

    const handleLine = (line) => {
      if (!line) return;
      let obj;
      try {
        obj = JSON.parse(line);
      } catch {
        rec.error_type = 'stream_parse';
        rec.error_msg = line.slice(0, 200);
        return;
      }
      if (obj.error) {
        rec.error_type = 'server_error';
        rec.error_msg = String(obj.error).slice(0, 300);
        return;
      }
      const piece = obj.message && typeof obj.message.content === 'string' ? obj.message.content : '';
      if (piece.length > 0) {
        const now = performance.now();
        if (rec.ttft_ms === null) rec.ttft_ms = now - t0;
        else if (lastChunkAt !== null) gaps.push(now - lastChunkAt);
        lastChunkAt = now;
        rec.chunks += 1;
        parts.push(piece);
      }
      if (obj.done) finalChunk = obj;
    };

    const finish = (errType, errMsg) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      rec.e2e_ms = performance.now() - t0;
      rec.content = parts.join(''); // 타임아웃이어도 받은 데까지는 남긴다
      if (errType && !rec.error_type) {
        rec.error_type = errType;
        rec.error_msg = errMsg;
      }
      if (finalChunk) {
        rec.done_reason = finalChunk.done_reason || null;
        rec.prompt_eval_count = finalChunk.prompt_eval_count ?? null;
        rec.eval_count = finalChunk.eval_count ?? null;
        rec.prompt_eval_ms = nsToMs(finalChunk.prompt_eval_duration);
        rec.eval_ms = nsToMs(finalChunk.eval_duration);
        rec.load_ms = nsToMs(finalChunk.load_duration);
        rec.server_total_ms = nsToMs(finalChunk.total_duration);
        if (rec.prompt_eval_ms !== null && rec.eval_ms !== null) {
          rec.wait_est_ms = Math.max(0, rec.e2e_ms - rec.prompt_eval_ms - rec.eval_ms);
        }
      } else if (!rec.error_type) {
        rec.error_type = 'no_final_chunk';
      }
      rec.ok = !rec.error_type && !!finalChunk;
      rec.first_content_ms = rec.ttft_ms;
      rec.last_content_ms = lastChunkAt === null ? null : lastChunkAt - t0;
      if (rec.eval_count > 1 && rec.last_content_ms > rec.first_content_ms) {
        rec.tpot_ms = (rec.last_content_ms - rec.first_content_ms) / (rec.eval_count - 1);
        rec.post_ttft_tok_s = (rec.eval_count - 1) * 1000 / (rec.last_content_ms - rec.first_content_ms);
      }
      if (rec.eval_count !== null && rec.e2e_ms > 0) rec.user_tok_s = rec.eval_count * 1000 / rec.e2e_ms;
      Object.assign(rec, gapStats(gaps));
      resolve(rec);
    };

    const req = libFor(url).request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      agent: getAgent(),
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    }, (res) => {
      rec.http_status = res.statusCode;
      res.setEncoding('utf8');
      if (res.statusCode !== 200) {
        let text = '';
        res.on('data', (d) => { text += d; });
        res.on('end', () => finish(res.statusCode === 503 ? 'http_503_queue_full' : `http_${res.statusCode}`, text.slice(0, 300)));
        res.on('error', (e) => finish(`http_${res.statusCode}`, errText(e)));
        return;
      }
      let buf = '';
      res.on('data', (d) => {
        buf += d;
        let nl;
        while ((nl = buf.indexOf('\n')) >= 0) {
          handleLine(buf.slice(0, nl).trim());
          buf = buf.slice(nl + 1);
        }
      });
      res.on('end', () => {
        handleLine(buf.trim());
        finish(null, null);
      });
      res.on('error', (e) => finish(timedOut ? 'timeout' : 'network', timedOut ? `클라이언트 타임아웃 ${timeoutMs}ms` : errText(e)));
      res.on('aborted', () => finish(timedOut ? 'timeout' : 'network', timedOut ? `클라이언트 타임아웃 ${timeoutMs}ms` : '응답 도중 연결 끊김'));
    });

    const timer = setTimeout(() => {
      timedOut = true;
      req.destroy(new Error('client timeout'));
    }, timeoutMs);

    req.on('error', (e) => finish(timedOut ? 'timeout' : 'network', timedOut ? `클라이언트 타임아웃 ${timeoutMs}ms` : errText(e)));
    req.end(payload);
  });
}

module.exports = { streamChat, OLLAMA_HOST };
