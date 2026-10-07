'use strict';
// Ollama 서버 제어.
//
// OLLAMA_NUM_PARALLEL 같은 값은 요청 옵션이 아니라 서버 환경변수라서, 바꿀 때마다
// 서버를 재시작해야 한다. 세 가지 방식을 지원한다.
//
//   systemd : 설치 스크립트로 깐 기본 형태(systemd 서비스 'ollama').
//             /etc/systemd/system/ollama.service.d/zz-load-test.conf 에 환경변수를 쓰고
//             재시작한다. 팀이 따로 둔 override(예: OLLAMA_HOST)는 건드리지 않는다.
//             테스트가 끝나면 이 파일을 지우고 재시작해서 원래 설정으로 되돌린다.
//   process : systemd 없이 `ollama serve`를 직접 띄우는 환경. 기존 프로세스를 끄고
//             환경변수를 넣어 다시 띄운다.
//   none    : 서버를 건드리지 않는다(이미 원하는 설정으로 떠 있다고 가정). 개발용.
//
// sudo는 -n(비대화)으로만 호출한다. 비밀번호를 묻게 되면 바로 실패시킨다.

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { OLLAMA_HOST, requestJson, resetAgent } = require('./http_client');

const OVERRIDE_DIR = '/etc/systemd/system/ollama.service.d';
const OVERRIDE_FILE = path.join(OVERRIDE_DIR, 'zz-load-test.conf');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function run(cmd, args, { input, timeoutMs = 60_000, env } = {}) {
  return new Promise((resolve) => {
    let out = '';
    let err = '';
    let p;
    try {
      p = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, ...env } });
    } catch (e) {
      resolve({ code: -1, out: '', err: e.message });
      return;
    }
    const timer = setTimeout(() => { try { p.kill('SIGKILL'); } catch { /* */ } }, timeoutMs);
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err += d; });
    p.on('error', (e) => { clearTimeout(timer); resolve({ code: -1, out, err: e.message }); });
    p.on('close', (code) => { clearTimeout(timer); resolve({ code, out, err }); });
    if (input !== undefined) p.stdin.end(input); else p.stdin.end();
  });
}

function envFor(settings) {
  return {
    OLLAMA_NUM_PARALLEL: String(settings.parallel),
    OLLAMA_MAX_QUEUE: String(settings.maxQueue),
    OLLAMA_MAX_LOADED_MODELS: String(settings.maxLoadedModels),
    OLLAMA_FLASH_ATTENTION: String(settings.flashAttention),
    OLLAMA_KV_CACHE_TYPE: String(settings.kvCacheType),
    OLLAMA_KEEP_ALIVE: String(settings.keepAlive),
    // 버전에 따라 서버 기본 컨텍스트 길이 환경변수가 있다. 요청의 num_ctx와 맞춰 둔다.
    OLLAMA_CONTEXT_LENGTH: String(settings.numCtx),
  };
}

class OllamaServer {
  constructor({ mode = 'auto', logDir, host = OLLAMA_HOST } = {}) {
    this.requestedMode = mode;
    this.mode = null;
    this.logDir = logDir;
    this.host = host;
    this.child = null;
    this.applied = null;
  }

  async detectMode() {
    if (this.requestedMode !== 'auto') {
      this.mode = this.requestedMode;
      return this.mode;
    }
    const r = await run('systemctl', ['is-active', 'ollama'], { timeoutMs: 5000 });
    this.mode = r.code === 0 && r.out.trim() === 'active' ? 'systemd' : 'process';
    return this.mode;
  }

  // 매번 새 연결로 확인한다 (옛 서버와의 keep-alive 연결을 재사용하지 않도록).
  async isUp() {
    const r = await requestJson('GET', '/api/version', undefined, { host: this.host, timeoutMs: 2000 });
    if (!r.ok && process.env.LOADTEST_DEBUG) console.log(`  [debug] isUp: ${r.error || r.status}`);
    return r.ok;
  }

  async waitReady(timeoutMs = 90_000) {
    const until = Date.now() + timeoutMs;
    while (Date.now() < until) {
      if (await this.isUp()) return true;
      await sleep(500);
    }
    throw new Error(`Ollama 서버가 ${timeoutMs / 1000}초 안에 응답하지 않습니다 (${this.host})`);
  }

  async version() {
    const r = await requestJson('GET', '/api/version', undefined, { host: this.host, timeoutMs: 3000 });
    return r.ok && r.json ? r.json.version || null : null;
  }

  async installedModels() {
    const r = await requestJson('GET', '/api/tags', undefined, { host: this.host, timeoutMs: 5000 });
    if (!r.ok) throw new Error(`/api/tags 실패: ${r.error || r.status}`);
    return ((r.json && r.json.models) || []).map((m) => m.name);
  }

  // settings: { parallel, maxQueue, maxLoadedModels, flashAttention, kvCacheType, keepAlive, numCtx }
  async apply(settings) {
    if (!this.mode) await this.detectMode();
    const env = envFor(settings);
    if (this.mode === 'systemd') await this.applySystemd(env);
    else if (this.mode === 'process') await this.applyProcess(env);
    else if (this.mode !== 'none') throw new Error(`알 수 없는 서버 제어 방식: ${this.mode}`);
    await this.waitReady();
    resetAgent(); // 측정 요청용 연결 풀을 비운다 — 옛 서버와의 연결이 남지 않게
    this.applied = { ...env, mode: this.mode };
    return this.applied;
  }

  async applySystemd(env) {
    const content = ['# load_test_v1이 자동으로 만든 파일 — 테스트가 끝나면 지워진다.', '[Service]']
      .concat(Object.entries(env).map(([k, v]) => `Environment="${k}=${v}"`))
      .join('\n') + '\n';
    const steps = [
      ['sudo', ['-n', 'mkdir', '-p', OVERRIDE_DIR]],
      ['sudo', ['-n', 'tee', OVERRIDE_FILE], content],
      ['sudo', ['-n', 'systemctl', 'daemon-reload']],
      ['sudo', ['-n', 'systemctl', 'restart', 'ollama']],
    ];
    for (const [cmd, args, input] of steps) {
      const r = await run(cmd, args, { input });
      if (r.code !== 0) {
        throw new Error(`${cmd} ${args.join(' ')} 실패 (code ${r.code}): ${r.err.trim() || r.out.trim()}\n`
          + '  → sudo 비밀번호 없이 실행할 수 있어야 합니다. 또는 --server-control process 로 실행하세요.');
      }
    }
  }

  async applyProcess(env) {
    await this.stopProcess();
    const bin = process.env.OLLAMA_BIN || 'ollama';
    fs.mkdirSync(this.logDir, { recursive: true });
    const logPath = path.join(this.logDir, `ollama_serve_${Date.now()}.log`);
    const fd = fs.openSync(logPath, 'a');
    this.child = spawn(bin, ['serve'], {
      env: { ...process.env, ...env },
      detached: true,
      stdio: ['ignore', fd, fd],
    });
    this.child.unref();
    fs.closeSync(fd);
    this.serveLog = logPath;
  }

  // 옛 서버가 "응답하는지"가 아니라 프로세스가 실제로 없어졌는지로 판단한다.
  async stopProcess() {
    const pattern = process.env.OLLAMA_SERVE_PATTERN || 'ollama serve';
    const list = await run('pgrep', ['-f', pattern], { timeoutMs: 5000 });
    const shells = new Set(['sh', 'bash', 'zsh', 'dash', 'tmux', 'screen', 'sudo']);
    const pids = list.out.split('\n').map((x) => Number(x.trim()))
      .filter((n) => n && n !== process.pid && n !== process.ppid)
      .filter((n) => {
        // 명령줄에 "ollama serve"라는 글자가 들어간 셸(예: 이 테스트를 띄운 셸)까지 죽이지 않도록 거른다.
        try { return !shells.has(fs.readFileSync(`/proc/${n}/comm`, 'utf8').trim()); } catch { return true; }
      });
    const alive = (pid) => {
      try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
    };
    const waitGone = async (ms) => {
      const until = Date.now() + ms;
      while (Date.now() < until && pids.some(alive)) await sleep(200);
      return !pids.some(alive);
    };
    for (const pid of pids) {
      try { process.kill(pid, 'SIGTERM'); } catch { /* 이미 종료 */ }
    }
    if (!(await waitGone(15_000))) {
      for (const pid of pids.filter(alive)) {
        try { process.kill(pid, 'SIGKILL'); } catch { /* */ }
      }
      await waitGone(5_000);
    }
    if (pids.some(alive)) throw new Error(`기존 ollama serve 프로세스를 끌 수 없습니다 (pid ${pids.filter(alive).join(', ')})`);
    resetAgent();
    // 프로세스는 없어졌는데 주소가 아직 대답하면, 다른 방식(systemd 등)으로 떠 있는 서버다.
    const until = Date.now() + 10_000;
    while (Date.now() < until && (await this.isUp())) await sleep(300);
    if (await this.isUp()) {
      throw new Error(`${this.host}에서 다른 Ollama 서버가 응답합니다. systemd 서비스라면 --server-control systemd 로 실행하세요.`);
    }
  }

  // 조합을 마친 뒤 서버를 내려 다음 조합과 GPU 자원이 겹치지 않게 한다.
  async stop() {
    if (!this.mode) await this.detectMode();
    if (this.mode === 'none') {
      const models = await this.loadedModels();
      if (!models) throw new Error('모델 unload 전에 /api/ps를 확인할 수 없습니다');
      for (const m of models) {
        const r = await requestJson('POST', '/api/generate', { model: m.name, keep_alive: 0 },
          { host: this.host, timeoutMs: 30_000 });
        if (!r.ok) throw new Error('모델 unload 실패: ' + m.name);
      }
      const until = Date.now() + 30_000;
      while (true) {
        const loaded = await this.loadedModels();
        if (!loaded) throw new Error('모델 unload 결과를 확인할 수 없습니다');
        if (!loaded.length) break;
        if (Date.now() >= until) throw new Error('30초 안에 모델 unload가 완료되지 않았습니다');
        await sleep(500);
      }
      resetAgent();
      this.applied = null;
      return { mode: this.mode, server_stopped: false, models_unloaded: true,
        gpu_release: { known: false, reason: 'none 모드는 모델 unload만 수행. 엔진 전환 전 서버 수동 종료 필요' } };
    }
    if (this.mode === 'systemd') {
      const r = await run('sudo', ['-n', 'systemctl', 'stop', 'ollama']);
      if (r.code !== 0) throw new Error('Ollama 서비스 종료 실패: ' + r.err.trim());
    } else if (this.mode === 'process') {
      await this.stopProcess();
    } else {
      throw new Error('알 수 없는 서버 제어 방식: ' + this.mode);
    }
    const until = Date.now() + 15_000;
    while (await this.isUp()) {
      if (Date.now() >= until) throw new Error('서버 종료 후에도 Ollama 주소가 응답합니다: ' + this.host);
      await sleep(500);
    }
    resetAgent();
    this.applied = null;
    this.child = null;
    const gpuRelease = await this.waitGpuReleased();
    return { mode: this.mode, server_stopped: true, gpu_release: gpuRelease };
  }

  async waitGpuReleased(timeoutMs = 30_000) {
    if (/mock[-_]ollama/.test(process.env.OLLAMA_BIN || '')) {
      return { known: false, reason: '개발용 모의 서버는 GPU를 사용하지 않음' };
    }
    const until = Date.now() + timeoutMs;
    let remaining = '';
    do {
      const r = await run('nvidia-smi',
        ['--query-compute-apps=pid,process_name,used_memory', '--format=csv,noheader,nounits'],
        { timeoutMs: 5000 });
      if (r.code !== 0) {
        throw new Error('GPU 해제 상태를 확인할 수 없어 다음 조합을 시작하지 않습니다: ' + r.err.trim());
      }
      remaining = r.out.trim();
      if (!remaining) {
        const memory = await run('nvidia-smi',
          ['--query-gpu=memory.used,memory.total', '--format=csv,noheader,nounits'],
          { timeoutMs: 5000 });
        if (memory.code !== 0) throw new Error('서버 종료 후 VRAM 상태 조회 실패: ' + memory.err.trim());
        return { known: true, compute_processes: [], memory_after_stop_mib: memory.out.trim() };
      }
      await sleep(500);
    } while (Date.now() < until);
    throw new Error('GPU compute 프로세스가 남아 있어 다음 조합을 시작하지 않습니다: ' + remaining);
  }

  // 테스트 설정을 걷어내고 원래 상태로 되돌린다.
  async restore() {
    if (!this.mode) await this.detectMode();
    if (this.mode === 'systemd') {
      await run('sudo', ['-n', 'rm', '-f', OVERRIDE_FILE]);
      await run('sudo', ['-n', 'systemctl', 'daemon-reload']);
      const r = await run('sudo', ['-n', 'systemctl', 'restart', 'ollama']);
      return r.code === 0 ? 'systemd 테스트 설정 제거 후 재시작 완료' : `systemd 재시작 실패: ${r.err.trim()}`;
    }
    if (this.mode === 'process') {
      try { await this.stopProcess(); } catch { /* */ }
      return '테스트용으로 띄운 ollama serve를 종료했습니다. 평소 설정으로 다시 띄워 주세요.';
    }
    return '서버 제어 없음(none) — 되돌릴 설정이 없습니다.';
  }

  async effectiveEnv() {
    if (this.mode !== 'systemd') return this.applied;
    const r = await run('systemctl', ['show', 'ollama', '--property=Environment'], { timeoutMs: 5000 });
    return r.code === 0 ? r.out.trim() : null;
  }

  async loadedModels() {
    const r = await requestJson('GET', '/api/ps', undefined, { host: this.host, timeoutMs: 5000 });
    return r.ok && r.json ? r.json.models || [] : null;
  }

  // 대상 외 모델(예: bge-m3)이 올라가 있으면 내린다.
  async unloadOthers(targetTag) {
    const loaded = (await this.loadedModels()) || [];
    const unloaded = [];
    for (const m of loaded) {
      if (m.name === targetTag) continue;
      const r = await requestJson('POST', '/api/generate', { model: m.name, keep_alive: 0 }, { host: this.host, timeoutMs: 30_000 });
      if (r.ok) unloaded.push(m.name);
    }
    return unloaded;
  }

  // 측정과 같은 옵션(num_ctx 등)으로 모델을 미리 올린다. 옵션이 다르면 첫 측정 요청에서
  // 모델을 다시 불러와 결과가 튀므로 반드시 같은 값을 쓴다.
  async preload(model, generation, think) {
    const started = Date.now();
    const body = {
      model,
      messages: [{ role: 'user', content: '준비' }],
      stream: false,
      keep_alive: generation.keepAlive,
      options: { temperature: generation.temperature, num_ctx: generation.num_ctx, num_predict: 1 },
    };
    if (think !== undefined) body.think = think;
    // 재시작 직후에는 연결이 한두 번 실패할 수 있어 짧게 재시도한다.
    let r;
    for (let attempt = 1; attempt <= 3; attempt++) {
      r = await requestJson('POST', '/api/chat', body, { host: this.host, timeoutMs: 300_000 });
      if (r.ok || r.status) break; // HTTP 응답을 받았으면(성공이든 에러든) 재시도하지 않는다
      await sleep(1000 * attempt);
    }
    if (!r.ok) throw new Error(`모델 로딩 실패 ${model}: ${r.status || ''} ${r.error || (r.text || '').slice(0, 200)}`.trim());
    return Date.now() - started;
  }

  // 모델이 GPU에 전부 올라갔는지 확인한다. 일부가 CPU로 밀리면 측정값이 "동시 사용자"가
  // 아니라 "CPU 오프로딩" 때문에 느려진 값이 되므로 그 조합은 건너뛴다.
  async fitStatus(model) {
    const loaded = await this.loadedModels();
    if (!loaded) return { known: false };
    const m = loaded.find((x) => x.name === model) || loaded.find((x) => x.name.startsWith(model.split(':')[0] + ':'));
    if (!m) return { known: true, loaded: false, others: loaded.map((x) => x.name) };
    return {
      known: true,
      loaded: true,
      size_bytes: m.size ?? null,
      size_vram_bytes: m.size_vram ?? null,
      context_length: m.context_length ?? null,
      fully_on_gpu: m.size != null && m.size_vram != null ? m.size_vram >= m.size : null,
      others: loaded.filter((x) => x !== m).map((x) => x.name),
    };
  }
}

module.exports = { OllamaServer, envFor, run };
