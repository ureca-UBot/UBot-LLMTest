'use strict';
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const { performance } = require('node:perf_hooks');
const { jsonRequest, run } = require('./runtime');
const { parseMetrics } = require('./engine_metrics');

class Monitor {
  constructor(candidate, file, { mock = false, intervalMs = 1000, onError, spawnGpu = spawn } = {}) {
    this.candidate = candidate; this.file = file; this.mock = mock; this.intervalMs = intervalMs;
    this.samples = []; this.gpu = null; this.startMs = performance.now(); this.busy = false;
    this.onError = onError; this.error = null; this.errorCallbackFailure = null;
    this.started = false; this.stopping = false;
    this.spawnGpu = spawnGpu;
  }
  async captureError(error) {
    if (this.error) return;
    this.error = error; clearInterval(this.timer);
    try { if (this.onError) await this.onError(error); }
    catch (callbackError) { this.errorCallbackFailure = callbackError; }
  }
  start() {
    if (this.started || this.stopping) throw new Error('Monitor는 한 번만 시작할 수 있습니다');
    this.started = true;
    if (!this.mock) {
      this.gpu = this.spawnGpu('nvidia-smi', ['--query-gpu=memory.used,memory.total,utilization.gpu,power.draw,power.limit,temperature.gpu',
        '--format=csv,noheader,nounits', '-lms', String(this.intervalMs)], { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });
      this.gpuExit = new Promise(resolve => this.gpu.once('close', resolve));
      this.gpu.on('exit', (code, signal) => {
        this.gpuExited = true;
        if (!this.stopping) void this.captureError(new Error(`GPU monitor가 예기치 않게 종료됨: code=${code}, signal=${signal}`));
      });
      let buffer = '';
      this.gpu.on('error', error => { this.lastGpu = null; this.gpuExited = true; void this.captureError(error); });
      this.gpu.stdout.on('data', chunk => {
        buffer += chunk.toString(); let end;
        while ((end = buffer.indexOf('\n')) >= 0) {
          const values = buffer.slice(0, end).trim().split(',').map(x => Number(x.trim())); buffer = buffer.slice(end + 1);
          if (values.length === 6) this.lastGpu = { memory_used_mib: values[0], memory_total_mib: values[1], utilization_pct: values[2],
            power_w: values[3], power_limit_w: values[4], temperature_c: values[5] };
        }
      });
    }
    this.timer = setInterval(() => { void this.tick(); }, this.intervalMs);
  }
  async tick() {
    if (this.busy || this.error) return;
    this.busy = true;
    const stage = this.stage ? { ...this.stage } : null;
    try {
      const response = this.candidate.engine === 'ollama' && !this.mock
        ? await jsonRequest(this.candidate.host, '/api/ps') : await jsonRequest(this.candidate.host, '/metrics');
      let metrics = null;
      if (response.ok) {
        if (this.candidate.engine === 'ollama' && this.mock) {
          const mockGauge = name => {
            const line = response.text.split('\n').find(entry => entry.startsWith(name + ' '));
            const value = Number(line?.split(/\s+/)[1]);
            return Number.isFinite(value) ? value : null;
          };
          metrics = { raw: response.text, running: mockGauge('mock:num_requests_running'),
            queued: mockGauge('mock:num_requests_waiting'), mock: true, scope: 'mock_fixture' };
        } else metrics = this.candidate.engine === 'ollama' ? response.json || null : parseMetrics(this.candidate.engine, response.text);
      }
      const sample = { at_ms: performance.now() - this.startMs, gpu: this.lastGpu || null,
        stage,
        mock: this.mock, engine_metrics: metrics };
      this.samples.push(sample); fs.appendFileSync(this.file, JSON.stringify(sample) + '\n');
    } catch (error) { await this.captureError(error); }
    finally { this.busy = false; }
  }
  async stop() {
    this.stopping = true;
    clearInterval(this.timer);
    if (this.gpu) {
      if (!this.gpuExited) this.gpu.kill();
      let timer;
      try {
        const exited = await Promise.race([this.gpuExit.then(() => true),
          new Promise(resolve => { timer = setTimeout(() => resolve(false), 5000); })]);
        if (!exited) await this.captureError(new Error('GPU monitor 종료 확인 시간 초과'));
      } finally { clearTimeout(timer); }
    }
    while (this.busy) await new Promise(r => setTimeout(r, 10));
    if (this.error) throw this.error;
  }
}
function csvFields(line) {
  const fields = []; let value = '', quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { value += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === ',' && !quoted) { fields.push(value.trim()); value = ''; }
    else value += ch;
  }
  if (quoted) throw new Error('nvidia-smi CSV 따옴표가 닫히지 않았습니다');
  fields.push(value.trim()); return fields;
}
function numericField(value, field, { integer = false, positive = false } = {}) {
  if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(value)) throw new Error(`nvidia-smi ${field} 측정값을 확인할 수 없습니다: ${value}`);
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || positive && number <= 0 || integer && !Number.isInteger(number)) {
    throw new Error(`nvidia-smi ${field} 측정값이 잘못되었습니다: ${value}`);
  }
  return number;
}
function textField(value, field) {
  if (!value || /^(?:N\/A|\[N\/A\]|unknown|not supported)$/i.test(value)) throw new Error(`nvidia-smi ${field}를 확인할 수 없습니다`);
  return value;
}
function parseGpuSnapshot(processText, gpuText) {
  const processLines = processText.trim().split(/\r?\n/).filter(Boolean);
  const gpuLines = gpuText.trim().split(/\r?\n/).filter(Boolean);
  const processes = processLines.map(line => {
    const values = csvFields(line);
    if (values.length !== 3) throw new Error('nvidia-smi GPU 프로세스 열 수 불일치');
    return { pid: numericField(values[0], 'pid', { integer: true, positive: true }),
      name: textField(values[1], 'process_name'), used_memory_mib: numericField(values[2], 'used_memory') };
  });
  const gpus = gpuLines.map(line => {
    const values = csvFields(line);
    if (values.length !== 6) throw new Error('nvidia-smi GPU 열 수 불일치');
    const gpu = { index: numericField(values[0], 'index', { integer: true }), uuid: textField(values[1], 'uuid'),
      name: textField(values[2], 'name'), memory_used_mib: numericField(values[3], 'memory.used'),
      memory_total_mib: numericField(values[4], 'memory.total', { positive: true }), driver_version: textField(values[5], 'driver_version') };
    if (gpu.memory_used_mib > gpu.memory_total_mib) throw new Error('nvidia-smi 사용 VRAM이 총 VRAM보다 큽니다');
    return gpu;
  });
  if (!gpus.length) throw new Error('nvidia-smi GPU 목록이 비어 있습니다');
  if (new Set(gpus.map(gpu => gpu.uuid)).size !== gpus.length || new Set(gpus.map(gpu => gpu.index)).size !== gpus.length) {
    throw new Error('nvidia-smi GPU 식별자가 중복됩니다');
  }
  if (new Set(processes.map(proc => proc.pid)).size !== processes.length) throw new Error('nvidia-smi GPU 프로세스 PID가 중복됩니다');
  return { processes, gpus };
}
async function gpuSnapshot({ mock = false, commandRunner = run, timeoutMs = 10000 } = {}) {
  if (mock) return { scope: 'mock', compute_processes: [], processes: [], gpus: [], known: true, gpu: '', errors: '' };
  const commands = [
    ['--query-compute-apps=pid,process_name,used_memory', '--format=csv,noheader,nounits'],
    ['--query-gpu=index,uuid,name,memory.used,memory.total,driver_version', '--format=csv,noheader,nounits'],
  ];
  const results = await Promise.allSettled(commands.map(args => commandRunner('nvidia-smi', args, { timeoutMs })));
  const errors = [];
  const readings = results.map(result => {
    if (result.status === 'rejected') { errors.push(result.reason?.message || String(result.reason)); return null; }
    const entry = result.value;
    if (!entry || entry.code !== 0) errors.push(entry?.error || entry?.stderr || 'nvidia-smi 실행 실패');
    return entry;
  });
  const processText = typeof readings[0]?.stdout === 'string' ? readings[0].stdout : '';
  const gpuText = typeof readings[1]?.stdout === 'string' ? readings[1].stdout : '';
  const output = { known: false, compute_processes: processText.trim().split(/\r?\n/).filter(Boolean),
    processes: [], gpus: [], gpu: gpuText.trim(), errors: '' };
  if (!errors.length) {
    try { Object.assign(output, parseGpuSnapshot(processText, gpuText), { known: true }); }
    catch (error) { errors.push(error.message); }
  }
  output.errors = errors.join('\n'); return output;
}
module.exports = { Monitor, gpuSnapshot, parseGpuSnapshot };
