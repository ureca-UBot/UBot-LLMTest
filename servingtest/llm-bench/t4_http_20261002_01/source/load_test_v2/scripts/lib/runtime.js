'use strict';
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn, execFile } = require('node:child_process');
const { performance } = require('node:perf_hooks');
const { randomUUID } = require('node:crypto');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function run(command, args = [], { timeoutMs = 10000, env } = {}) {
  return new Promise(resolve => execFile(command, args, { timeout: timeoutMs, windowsHide: true,
    maxBuffer: 8 * 1024 * 1024, env: { ...process.env, ...env } }, (error, stdout, stderr) => {
    resolve({ code: error ? (typeof error.code === 'number' ? error.code : -1) : 0, stdout, stderr, error: error?.message });
  }));
}
async function jsonRequest(host, route, { method = 'GET', body, timeoutMs = 3000 } = {}) {
  try {
    const response = await fetch(new URL(route, host), { method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs) });
    const text = await response.text(); let json;
    try { json = JSON.parse(text); } catch { json = null; }
    return { ok: response.ok, status: response.status, json, text };
  } catch (error) { return { ok: false, error: error.message }; }
}
async function portFree(host) {
  const url = new URL(host);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('관리 서버는 로컬 loopback에만 기동합니다');
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', () => reject(new Error(`포트가 이미 사용 중입니다: ${url.port}`)));
    server.listen(Number(url.port), '127.0.0.1', () => server.close(resolve));
  });
}
function argumentValue(args, name) {
  const entries = args.flatMap((arg, i) => arg === name ? [args[i + 1]] : arg.startsWith(`${name}=`) ? [arg.slice(name.length + 1)] : []);
  if (entries.length !== 1) throw new Error(`${name}를 정확히 한 번 지정하세요`);
  return entries[0];
}
function validateAppliedArgs(candidate, generation, { mock = false } = {}) {
  if (mock || candidate.runtime.mode === 'external') return;
  const args = candidate.runtime.mode === 'process' ? candidate.runtime.command.slice(1) : candidate.runtime.args;
  const env = candidate.runtime.env || {};
  if (candidate.engine === 'ollama') {
    if (Number(env.OLLAMA_NUM_PARALLEL) !== candidate.internal_limit) throw new Error('Ollama 환경변수 P 불일치');
  } else {
    const parallel = { 'llama.cpp': '--parallel', vllm: '--max-num-seqs', sglang: '--max-running-requests' }[candidate.engine];
    const context = { 'llama.cpp': '--ctx-size', vllm: '--max-model-len', sglang: '--context-length' }[candidate.engine];
    if (Number(argumentValue(args, parallel)) !== candidate.internal_limit) throw new Error('실제 기동 인자의 P 불일치');
    const expectedContext = generation.context * (candidate.engine === 'llama.cpp' ? candidate.internal_limit : 1);
    if (Number(argumentValue(args, context)) !== expectedContext) throw new Error('실제 기동 인자의 context 불일치');
  }
  if (args.some(x => /^--(?:cpu-offload-gb|offload-backend)(?:=|$)/.test(x))) throw new Error('이번 GPU 비교의 CPU offload 기동 인자는 제외합니다');
}
class Runtime {
  constructor(candidate, outputDir, { mock = false, signal, commandRunner = run } = {}) {
    this.candidate = candidate; this.outputDir = outputDir; this.mock = mock; this.signal = signal;
    this.session = randomUUID(); this.child = null; this.container = null; this.started = false;
    this.commandRunner = commandRunner;
  }
  async start() {
    const c = this.candidate, runtime = c.runtime, start = performance.now();
    if (runtime.mode === 'process' && process.platform === 'win32' && !this.mock) {
      throw new Error('Windows 실제 native process는 자식 프로세스 소유권을 보장할 수 없어 제외합니다. 소유한 Docker를 사용하세요');
    }
    if (!this.mock && runtime.mode !== 'docker') throw new Error('실제 측정은 worker 전체 종료를 보장할 수 있는 소유한 Docker 컨테이너만 지원합니다');
    fs.mkdirSync(this.outputDir, { recursive: true });
    if (runtime.mode !== 'external') await portFree(c.host);
    if (runtime.mode === 'process') {
      const fd = fs.openSync(path.join(this.outputDir, 'server.log'), 'a');
      try {
        this.child = spawn(runtime.command[0], runtime.command.slice(1), { shell: false, windowsHide: true,
          detached: process.platform !== 'win32', env: { ...process.env, ...runtime.env,
            HF_HUB_OFFLINE: '1', TRANSFORMERS_OFFLINE: '1' }, stdio: ['ignore', fd, fd] });
        this.spawnError = null; this.exited = false;
        this.child.once('error', error => { this.spawnError = error; this.exited = true; });
        this.child.once('exit', (code, signal) => { this.exited = true; this.exitStatus = { code, signal }; });
      } finally { fs.closeSync(fd); }
      this.started = true;
    } else if (runtime.mode === 'docker') {
      this.container = `llm-benchmark-v2-${this.session}`;
      const port = new URL(c.host).port;
      const args = ['create', '--pull', 'never', '--name', this.container, '--label', `llm.benchmark.session=${this.session}`,
        '--gpus', 'device=0', '-p', `127.0.0.1:${port}:${runtime.container_port}`];
      for (const mount of runtime.mounts || []) {
        if (!path.isAbsolute(mount.source) || !mount.target?.startsWith('/') || mount.source.includes(',') || mount.target.includes(',')) throw new Error('Docker mount는 실제 절대 경로입니다');
        args.push('--mount', `type=bind,source=${mount.source},target=${mount.target}${mount.read_only ? ',readonly' : ''}`);
      }
      for (const [key, value] of Object.entries({ ...runtime.env, HF_HUB_OFFLINE: '1', TRANSFORMERS_OFFLINE: '1' })) args.push('-e', `${key}=${value}`);
      if (runtime.entrypoint) args.push('--entrypoint', runtime.entrypoint);
      args.push(runtime.image, ...runtime.args);
      const create = await this.commandRunner('docker', args, { timeoutMs: 30000 });
      // A timeout cannot prove that Docker did not create the container. Keep
      // our unique name so cleanup can inspect ownership and resolve that state.
      if (create.code !== 0) throw new Error(`Docker 생성 실패: ${create.stderr || create.error}`);
      this.started = true;
      const launch = await this.commandRunner('docker', ['start', this.container], { timeoutMs: 30000 });
      if (launch.code !== 0) throw new Error(`Docker 기동 실패: ${launch.stderr}`);
    }
    const until = performance.now() + (runtime.ready_timeout_ms || 600000);
    let ready;
    while (performance.now() < until) {
      if (this.signal?.aborted) throw new Error('사용자 중단');
      if (!(await this.alive())) throw new Error(`관리 서버 종료: ${this.spawnError?.message || JSON.stringify(this.exitStatus)}`);
      ready = await jsonRequest(c.host, c.engine === 'ollama' ? '/api/tags' : '/v1/models');
      const names = c.engine === 'ollama' ? (ready.json?.models || []).map(x => x.name || x.model) : (ready.json?.data || []).map(x => x.id);
      if (ready.ok && names.includes(c.api_model)) break;
      await sleep(100);
    }
    if (!ready?.ok) throw new Error('서버 readiness 시간 초과');
    const names = c.engine === 'ollama' ? (ready.json?.models || []).map(x => x.name || x.model) : (ready.json?.data || []).map(x => x.id);
    if (!names.includes(c.api_model)) throw new Error('실제 API 모델 이름 불일치');
    return { mode: runtime.mode, session: this.session, owned_pid: this.child?.pid || null,
      owned_container: this.container, load_ms: runtime.mode === 'external' ? null : performance.now() - start,
      load_basis: runtime.mode === 'external' ? 'external_server_already_running' : 'owned_launch_to_api_model_ready' };
  }
  async attest(config) {
    const probe = this.candidate.runtime.attestation;
    if (!probe) throw new Error('실제 버전·P·context·GPU 적재 확인을 위한 runtime.attestation이 필요합니다');
    let evidence;
    if (probe.kind === 'http') {
      const response = await jsonRequest(this.candidate.host, probe.path, { method: probe.method, body: probe.body });
      if (!response.ok || !response.json) throw new Error('runtime attestation HTTP 조회 실패');
      evidence = response.json;
    } else if (probe.kind === 'command' && Array.isArray(probe.command) && probe.command.length) {
      const command = probe.inside_container && this.container ? ['docker', 'exec', this.container, ...probe.command] : probe.command;
      const response = await this.commandRunner(command[0], command.slice(1), { timeoutMs: probe.timeout_ms || 30000 });
      if (response.code !== 0) throw new Error(`runtime attestation command 실패: ${response.stderr}`);
      evidence = JSON.parse(response.stdout);
    } else throw new Error('runtime.attestation.kind는 http 또는 command입니다');
    const expected = { engine: this.candidate.engine, engine_version: this.candidate.engine_version,
      api_model: this.candidate.api_model, internal_limit: this.candidate.internal_limit,
      context_per_request: config.generation.context, upstream_repository: config.comparison.upstream_repository,
      upstream_revision: config.comparison.upstream_revision, fully_on_gpu: true };
    for (const [key, value] of Object.entries(expected)) if (evidence[key] !== value) throw new Error(`실제 runtime ${key} 불일치`);
    if (!evidence.evidence_source || !evidence.observed_at) throw new Error('runtime 확인 원천·시각이 필요합니다');
    const observedAt = Date.parse(evidence.observed_at), age = Date.now() - observedAt;
    if (!Number.isFinite(observedAt) || age > 60000 || age < -5000) throw new Error('runtime 확인 시각이 유효하지 않거나 오래됨·미래 시각입니다');
    if (!this.mock && (evidence.evidence_source === 'mock_fixture' || evidence.mock === true)) throw new Error('모의 runtime 자료를 실제 측정에 사용할 수 없습니다');
    if (!this.mock || evidence.artifact_files !== undefined) {
      if (!Array.isArray(evidence.artifact_files) || evidence.artifact_files.some(file => !file
        || !['weight', 'tokenizer', 'chat_template', 'config'].includes(file.role)
        || !/^[a-f0-9]{64}$/i.test(file.sha256 || ''))) throw new Error('실제 적재한 artifact_files의 역할·SHA-256 증명이 필요합니다');
      const fingerprints = files => files.map(file => `${file.role}:${file.sha256.toLowerCase()}`).sort();
      if (JSON.stringify(fingerprints(evidence.artifact_files)) !== JSON.stringify(fingerprints(this.candidate.provenance.files))) {
        throw new Error('실제 적재 파일의 역할·SHA-256 목록 불일치');
      }
    }
    return { verified: true, expected, evidence,
      limitation: '엔진별 probe가 실제 프로세스·모델 메타데이터에서 값을 추출해야 함; 설정 선언만 반환하는 probe는 검증 근거가 아님' };
  }
  async alive() {
    if (this.child) return !this.exited;
    if (this.container) {
      const result = await this.commandRunner('docker', ['inspect', '--format', '{{.State.Running}}', this.container]);
      return result.code === 0 && result.stdout.trim() === 'true';
    }
    return true;
  }
  async stop() {
    if (this.stopping) return this.stopping;
    this.stopping = this.stopOwned();
    return this.stopping;
  }
  async stopOwned() {
    const result = { owned_only: true, stopped: false, mode: this.candidate.runtime.mode };
    if (this.container) {
      const ownership = await this.commandRunner('docker', ['inspect', '--format', '{{index .Config.Labels "llm.benchmark.session"}}', this.container]);
      if (ownership.code !== 0 && /No such (?:object|container)/i.test(ownership.stderr || '')) {
        this.container = null; result.stopped = true; result.already_absent = true;
        result.process_exit_confirmed = true; await portFree(this.candidate.host); result.port_released = true; return result;
      }
      if (ownership.code !== 0 || ownership.stdout.trim() !== this.session) throw new Error('Docker 소유권 확인 실패; 임의 컨테이너는 종료하지 않음');
      const logs = await this.commandRunner('docker', ['logs', this.container]);
      try { fs.writeFileSync(path.join(this.outputDir, 'server.log'), logs.stdout + logs.stderr); }
      catch (error) { result.log_error = error.message; }
      const stop = await this.commandRunner('docker', ['stop', '--time', '15', this.container], { timeoutMs: 30000 });
      if (stop.code !== 0) throw new Error('실험 컨테이너 종료 실패');
      const remove = await this.commandRunner('docker', ['rm', this.container]);
      if (remove.code !== 0) throw new Error('실험 컨테이너 정리 실패');
      const absent = await this.commandRunner('docker', ['inspect', this.container]);
      if (absent.code === 0 || !/No such (?:object|container)/i.test(absent.stderr || '')) throw new Error('실험 컨테이너와 worker의 제거 상태를 확인할 수 없습니다');
      this.container = null; result.stopped = true;
    } else if (this.child && this.child.pid) {
      if (process.platform === 'win32') {
        // Live native engines are rejected in start(). The only managed Windows
        // process is the foreground, single-process Node mock. Use its owned
        // ChildProcess handle and verify exit; taskkill can require elevation.
        if (!this.mock) throw new Error('Windows 실제 native process의 종료 소유권을 보장할 수 없습니다');
        if (!this.exited) {
          const exited = new Promise(resolve => this.child.once('exit', resolve));
          const killed = this.child.kill('SIGTERM');
          if (!killed && !this.exited) throw new Error('관리 mock 프로세스 종료 신호 실패');
          let timer;
          try { await Promise.race([exited, new Promise(resolve => { timer = setTimeout(resolve, 5000); })]); }
          finally { clearTimeout(timer); }
          if (!this.exited) throw new Error('관리 mock 프로세스 종료 확인 시간 초과');
        }
      } else {
        const group = -this.child.pid;
        const alive = () => { try { process.kill(group, 0); return true; } catch (e) { if (e.code === 'ESRCH') return false; throw e; } };
        if (alive()) process.kill(group, 'SIGTERM');
        let until = performance.now() + 15000;
        while (alive() && performance.now() < until) await sleep(100);
        if (alive()) process.kill(group, 'SIGKILL');
        until = performance.now() + 5000;
        while (alive() && performance.now() < until) await sleep(100);
        if (alive()) throw new Error('관리 프로세스 그룹 종료 실패');
      }
      this.child = null; result.stopped = true;
    }
    if (this.candidate.runtime.mode !== 'external') {
      result.process_exit_confirmed = true;
      await portFree(this.candidate.host); result.port_released = true;
    }
    return result;
  }
}
module.exports = { Runtime, run, jsonRequest, validateAppliedArgs, argumentValue };
