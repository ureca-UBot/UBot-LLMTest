// 11436 -> 11435 기록 프록시: /api/chat 요청 본문과 응답 본문을 파일에 남긴다.
const http = require('http'); const fs = require('fs');
const OUT = __dirname + '/captured.jsonl';
http.createServer((req, res) => {
  const chunks = []; req.on('data', (c) => chunks.push(c)); req.on('end', () => {
    const body = Buffer.concat(chunks);
    const up = http.request({ host: '127.0.0.1', port: 11435, path: req.url, method: req.method, headers: { ...req.headers, host: 'localhost:11435' } }, (r) => {
      const out = []; r.on('data', (c) => out.push(c)); r.on('end', () => {
        const resp = Buffer.concat(out);
        if (req.url.startsWith('/api/chat')) fs.appendFileSync(OUT, JSON.stringify({ url: req.url, request: body.toString('utf8'), response: resp.toString('utf8') }) + '\n');
        res.writeHead(r.statusCode, r.headers); res.end(resp);
      });
    });
    up.on('error', (e) => { res.writeHead(502); res.end(String(e)); }); up.end(body);
  });
}).listen(11436, () => console.log('proxy on 11436'));
