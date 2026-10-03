'use strict';
const fs = require('fs');
const path = require('path');
const net = require('net');
const { spawn } = require('child_process');
const { performance } = require('perf_hooks');
const { randomUUID } = require('crypto');
const { run } = require('./ollama_admin');
const { requestJson, resetAgent } = require('./http_client');
const { launchSpec, apiModelName } = require('./engine_config');
const { parseMetrics } = require('./engine_metrics');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function coded(message, code) { return Object.assign(new Error(message), { code }); }

class OpenAiServer {
  constructor({ entry, logDir }, deps = {}) {
    this.entry = entry; this.logDir = logDir; this.mode = 'managed-process';
    this.host = `http://127.0.0.1:${entry.port}`;
    this.child = null; this.groupId = null; this.exited = true;
    this.deps = { run, spawn, kill: process.kill.bind(process), requestJson, platform: process.platform, ...deps };
  }
  async detectMode() { return this.mode; }
  async pids() {
    if (!this.groupId) return [];
    const out = [];
    try {
      for (const pid of await fs.promises.readdir('/proc')) {
        if (!/^\d+$/.test(pid)) continue;
        try {
          const stat = await fs.promises.readFile(`/proc/${pid}/stat`, 'utf8');
          if (Number(stat.slice(stat.lastIndexOf(')') + 2).split(' ')[2]) === this.groupId) out.push(Number(pid));
        } catch { /* 종료된 worker */ }
      }
    } catch { return null; }
    return out;
  }
  async gpuIdle(timeoutMs = 30000) {
    const until = Date.now() + timeoutMs;
    let last;
    do {
      last = await this.deps.run('nvidia-smi', ['--query-compute-apps=pid,process_name,used_memory', '--format=csv,noheader,nounits'], { timeoutMs: 5000 });
      if (last.code !== 0) throw coded(`GPU 해제 상태 확인 실패: ${last.err || last.out}`, 'CLEANUP_FAILED');
      if (!last.out.trim()) {
        const memory = await this.deps.run('nvidia-smi', ['--query-gpu=memory.used,memory.total', '--format=csv,noheader,nounits'], { timeoutMs: 5000 });
        if (memory.code !== 0) throw coded('GPU VRAM 상태 확인 실패', 'CLEANUP_FAILED');
        return { known: true, compute_processes: [], memory_after_stop: memory.out.trim() };
      }
      if (Date.now() < until) await sleep(500);
    } while (Date.now() < until);
    throw coded(`GPU compute 프로세스가 남아 다음 조합을 시작할 수 없습니다: ${last.out.trim()}`, 'CLEANUP_FAILED');
  }
  async portFree() {
    return new Promise((resolve, reject) => {
      const probe = net.createServer();
      probe.once('error', () => reject(coded(`${this.host} 포트가 이미 사용 중입니다`, 'CLEANUP_FAILED')));
      probe.listen(this.entry.port, '127.0.0.1', () => probe.close(resolve));
    });
  }
  async checkRuntime(spec) {
    const args = this.entry.engine === 'llama.cpp' ? ['--version']
      : ['-c', `import importlib.metadata; print(importlib.metadata.version('${this.entry.engine}'))`];
    const options = { timeoutMs: 30000, env: spec.env };
    const version = await this.deps.run(spec.command, args, options);
    const value = `${version.out}\n${version.err}`.trim();
    const matchesVersion = this.entry.engine === 'llama.cpp' ? value.includes(this.entry.version) : version.out.trim() === this.entry.version;
    if (version.code !== 0 || !matchesVersion) throw new Error(`실제 엔진 버전 불일치: 기대 ${this.entry.version}, 확인 ${value || version.code}`);
    this.actualVersion = value;
    const help = await this.deps.run(spec.command, [...this.entry.command.slice(1), '--help'], options);
    if (help.code !== 0) throw new Error(`서버 CLI 확인 실패: ${help.err}`);
    const helpText = help.out + help.err;
    for (const arg of spec.args.filter((a) => a.startsWith('--'))) {
      const flag = arg.split('=')[0];
      if (!helpText.includes(flag)) throw new Error(`${this.entry.engine} ${this.entry.version}: CLI ${flag} 미지원`);
    }
  }
  async isUp() {
    const health = await this.deps.requestJson('GET', '/health', undefined, { host: this.host, timeoutMs: 2000 });
    if (!health.ok) return false;
    const models = await this.deps.requestJson('GET', '/v1/models', undefined, { host: this.host, timeoutMs: 2000 });
    return models.ok && Array.isArray(models.json && models.json.data)
      && models.json.data.some((m) => m.id === apiModelName(this.entry));
  }
  async apply(settings) {
    if (this.deps.platform !== 'linux') throw new Error('실제 엔진 기동은 Linux EC2에서 실행하세요. 로컬에서는 --dry-run만 사용합니다.');
    if (this.groupId) await this.stop();
    await this.gpuIdle(0);
    await this.portFree();
    if (!fs.existsSync(this.entry.model_path)) throw new Error(`모델 파일 없음: ${this.entry.model_path}`);
    const spec = launchSpec(this.entry, settings);
    await this.checkRuntime(spec);
    fs.mkdirSync(this.logDir, { recursive: true });
    this.serveLog = path.join(this.logDir, `${this.entry.engine.replace('.', '-')}_${randomUUID()}.log`);
    const fd = fs.openSync(this.serveLog, 'a');
    const t0 = performance.now();
    this.loadStartedAt = new Date().toISOString();
    this.spawnError = null; this.exited = false;
    try {
      this.child = this.deps.spawn(spec.command, spec.args, { env: { ...process.env, ...spec.env },
        detached: true, stdio: ['ignore', fd, fd] });
      this.groupId = this.child.pid || null;
      this.child.on('error', (e) => { this.spawnError = e; this.exited = true; });
      this.child.on('exit', (code, signal) => { this.exited = true; this.exitResult = { code, signal }; });
    } finally { fs.closeSync(fd); }
    this.applied = { ...spec, pid: this.groupId, parallel: settings.parallel, context_per_request: settings.numCtx,
      engine: this.entry.engine, version: this.actualVersion, log: this.serveLog,
      load_measurement: 'process_spawn_to_model_ready' };
    const until = Date.now() + (this.entry.ready_timeout_ms || 600000);
    while (Date.now() < until) {
      if (this.spawnError || this.exited) throw new Error(`서버 시작 실패: ${this.spawnError ? this.spawnError.message : JSON.stringify(this.exitResult)}; 로그 ${this.serveLog}`);
      if (await this.isUp()) {
        this.loadMs = performance.now() - t0; this.loadEndedAt = new Date().toISOString();
        Object.assign(this.applied, { load_started_at: this.loadStartedAt, load_ended_at: this.loadEndedAt,
          load_ms: this.loadMs });
        resetAgent(); return this.applied;
      }
      await sleep(500);
    }
    throw new Error(`서버·모델 readiness 시간 초과; 로그 ${this.serveLog}`);
  }
  async version() { return this.actualVersion || null; }
  async unloadOthers() { return []; } // 기동부터 모델 하나만 로딩한다.
  async preload() { return this.loadMs; } // 로딩은 apply에서 완료; 애플리케이션 워밍업은 별도.
  async effectiveEnv() { return this.applied; }
  async fitStatus() {
    if (this.entry.engine === 'llama.cpp') {
      const log = fs.readFileSync(this.serveLog, 'utf8');
      const matches = [...log.matchAll(/offloaded\s+(\d+)\/(\d+)\s+layers to GPU/g)];
      const last = matches.pop();
      if (!last) return { known: false, loaded: true, fully_on_gpu: false, reason: 'GGUF GPU layer 적재 확인 로그 없음' };
      return { known: true, loaded: true, fully_on_gpu: Number(last[1]) === Number(last[2]),
        offloaded_layers: Number(last[1]), total_layers: Number(last[2]) };
    }
    const gpu = await this.deps.run('nvidia-smi', ['--query-compute-apps=pid,process_name,used_memory', '--format=csv,noheader,nounits'], { timeoutMs: 5000 });
    if (gpu.code !== 0) return { known: false, loaded: true, fully_on_gpu: false, reason: 'GPU context 확인 실패' };
    const gpuPids = gpu.out.split('\n').filter((line) => line.trim()).map((line) => Number(line.split(',')[0].trim()));
    const owned = await this.pids();
    if (!gpuPids.length || !owned) return { known: false, loaded: true, fully_on_gpu: false, reason: '관리 중인 GPU context 확인 불가' };
    if (gpuPids.some((pid) => !owned.includes(pid))) throw coded('관리 프로세스 그룹 밖의 GPU worker가 있어 전환을 중단합니다', 'CLEANUP_FAILED');
    return { known: true, loaded: true, fully_on_gpu: true, gpu_pids: gpuPids,
      evidence: '관리 프로세스의 GPU context 확인·CPU offload 인자 미사용·모델 readiness 성공', size_vram_bytes: null };
  }
  groupAlive() {
    if (!this.groupId) return false;
    try { this.deps.kill(-this.groupId, 0); return true; }
    catch (e) { if (e.code === 'ESRCH') return false; throw e; }
  }
  signalGroup(signal) {
    try { this.deps.kill(-this.groupId, signal); }
    catch (e) { if (e.code !== 'ESRCH') throw e; }
  }
  async stop() {
    if (this.stopping) return this.stopping;
    this.stopping = this.stopOwned();
    try { return await this.stopping; } finally { this.stopping = null; }
  }
  async stopOwned() {
    try {
      if (this.groupId) {
        // 관리 중인 detached 프로세스 그룹만 종료한다. 이름 검색·전체 GPU kill을 하지 않는다.
        if (this.groupAlive()) this.signalGroup('SIGTERM');
        let until = Date.now() + (this.entry.stop_timeout_ms || 15000);
        while (this.groupAlive() && Date.now() < until) await sleep(250);
        if (this.groupAlive()) this.signalGroup('SIGKILL');
        until = Date.now() + 5000;
        while (this.groupAlive() && Date.now() < until) await sleep(250);
        if (this.groupAlive()) throw new Error('서버 worker 프로세스 그룹 종료 실패');
      }
      const gpu_release = await this.gpuIdle();
      await this.portFree();
      this.child = null; this.groupId = null; resetAgent();
      return { engine: this.entry.engine, server_stopped: true, gpu_release };
    } catch (e) { throw coded(e.message, 'CLEANUP_FAILED'); }
  }
  async restore() { return '관리 중인 서버 종료'; }
  async metrics() {
    const r = await this.deps.requestJson('GET', '/metrics', undefined, { host: this.host, timeoutMs: 1000 });
    return r.ok ? parseMetrics(this.entry.engine, r.text) : null;
  }
}

module.exports = { OpenAiServer, coded };
