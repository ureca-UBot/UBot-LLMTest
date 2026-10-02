'use strict';
// 서버 상태 모니터. 측정 중 1초 간격으로 기록한다.
//
// - GPU: nvidia-smi를 반복 모드(-lms)로 한 번만 띄워 두고 줄 단위로 읽는다.
//   매초 새 프로세스를 띄우면 vCPU 4개짜리 EC2에서 측정에 끼어들기 때문이다.
//   (v3의 lib/vram.js는 spawnSync라서 이벤트 루프를 막는다 → 동시 요청 시간 측정에
//    영향을 주므로 여기서는 쓰지 않는다.)
// - CPU: /proc/stat(전체), /proc/<pid>/stat(ollama 프로세스), process.cpuUsage(부하 스크립트)
//   부하 스크립트를 같은 EC2에서 돌리므로, 스크립트 자신이 CPU를 얼마나 쓰는지 남겨서
//   측정 오염 여부를 확인할 수 있게 한다.
// - Ollama /api/ps: 5초 간격. 모델이 GPU에 전부 올라가 있는지(size_vram >= size).
//
// GPU·/proc이 없는 환경(로컬 개발 PC 등)에서는 해당 값만 null로 남기고 조용히 넘어간다.

const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const { makeAppender } = require('./jsonl');
const { requestJson } = require('./http_client');

const NCPU = os.cpus().length;
const CLK_TCK = 100; // 리눅스 기본 USER_HZ

async function readProcStat() {
  try {
    const text = await fs.promises.readFile('/proc/stat', 'utf8');
    const f = text.split('\n')[0].trim().split(/\s+/).slice(1).map(Number);
    const idle = f[3] + (f[4] || 0);
    const total = f.reduce((a, b) => a + b, 0);
    return { idle, total };
  } catch {
    return null;
  }
}

async function findOllamaPids() {
  try {
    const dirs = await fs.promises.readdir('/proc');
    const pids = [];
    for (const d of dirs) {
      if (!/^\d+$/.test(d)) continue;
      try {
        const comm = (await fs.promises.readFile(`/proc/${d}/comm`, 'utf8')).trim();
        if (comm.startsWith('ollama')) pids.push(Number(d));
      } catch { /* 프로세스가 사라짐 */ }
    }
    return pids;
  } catch {
    return null;
  }
}

async function readPidTicks(pids) {
  let ticks = 0;
  for (const pid of pids) {
    try {
      const s = await fs.promises.readFile(`/proc/${pid}/stat`, 'utf8');
      // comm에 공백이 있을 수 있으므로 마지막 ')' 뒤부터 자른다.
      const rest = s.slice(s.lastIndexOf(')') + 2).split(' ');
      ticks += Number(rest[11]) + Number(rest[12]); // utime + stime
    } catch { /* 사라진 프로세스 */ }
  }
  return ticks;
}

class Monitor {
  constructor({ intervalMs = 1000, engine = 'ollama', pidProvider = null, metricsProvider = null } = {}) {
    this.intervalMs = intervalMs;
    this.engine = engine; this.pidProvider = pidProvider; this.metricsProvider = metricsProvider;
    this.nativeMetrics = null; this.ticking = false;
    this.tag = null;
    this.appender = null;
    this.samples = new Map(); // tag -> [sample]
    this.lastGpu = null;
    this.lastPs = null;
    this.gpuProc = null;
    this.gpuWarned = false;
  }

  setOutput(filePath) {
    if (this.appender) this.appender.close();
    this.appender = filePath ? makeAppender(filePath) : null;
  }

  setTag(tag) {
    this.tag = tag;
  }

  start() {
    this.startGpu();
    this.prevStat = null;
    this.prevOllamaTicks = null;
    this.prevSelf = process.cpuUsage();
    this.prevAt = Date.now();
    this.ollamaPids = null;
    this.tickCount = 0;
    this.timer = setInterval(async () => {
      if (this.ticking) return;
      this.ticking = true;
      try { await this.tick(); } catch { /* 지표 미지원은 null로 남긴다 */ }
      finally { this.ticking = false; }
    }, this.intervalMs);
  }

  startGpu() {
    const fields = 'memory.used,memory.total,utilization.gpu,temperature.gpu,clocks.sm,power.draw,power.limit,utilization.memory';
    try {
      const p = spawn('nvidia-smi', [`--query-gpu=${fields}`, '--format=csv,noheader,nounits', '-lms', String(this.intervalMs)], {
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      this.gpuProc = p;
      let buf = '';
      p.stdout.on('data', (d) => {
        buf += d.toString();
        let nl;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          const v = line.split(',').map((x) => Number(x.trim()));
          this.lastGpu = {
            mem_used_mib: v[0], mem_total_mib: v[1], util_pct: v[2],
            temp_c: v[3], sm_clock_mhz: v[4], power_w: Number.isFinite(v[5]) ? v[5] : null,
            power_limit_w: Number.isFinite(v[6]) ? v[6] : null,
            memory_util_pct: Number.isFinite(v[7]) ? v[7] : null,
          };
        }
      });
      p.on('error', () => this.warnGpu());
      p.on('exit', (code) => { if (code) this.warnGpu(); });
    } catch {
      this.warnGpu();
    }
  }

  warnGpu() {
    if (!this.gpuWarned) {
      console.warn('  [monitor] nvidia-smi를 사용할 수 없어 GPU 지표를 건너뜁니다.');
      this.gpuWarned = true;
    }
    this.lastGpu = null;
  }

  async tick() {
    const now = Date.now();
    const dt = (now - this.prevAt) / 1000;
    this.prevAt = now;
    this.tickCount += 1;

    // 전체 CPU
    let cpuPct = null;
    const st = await readProcStat();
    if (st && this.prevStat) {
      const dTotal = st.total - this.prevStat.total;
      const dIdle = st.idle - this.prevStat.idle;
      if (dTotal > 0) cpuPct = (1 - dIdle / dTotal) * 100;
    }
    this.prevStat = st;

    // ollama 프로세스 CPU (pid 목록은 5초마다 갱신)
    if (this.ollamaPids === null || this.tickCount % 5 === 0) {
      this.ollamaPids = this.pidProvider ? await this.pidProvider() : await findOllamaPids();
      this.prevOllamaTicks = null;
    }
    let ollamaCpuPct = null;
    if (this.ollamaPids) {
      const ticks = await readPidTicks(this.ollamaPids);
      if (this.prevOllamaTicks !== null && dt > 0) {
        ollamaCpuPct = ((ticks - this.prevOllamaTicks) / CLK_TCK / dt / NCPU) * 100;
      }
      this.prevOllamaTicks = ticks;
    }

    // 부하 스크립트 자신
    const self = process.cpuUsage(this.prevSelf);
    this.prevSelf = process.cpuUsage();
    const loadgenCpuPct = dt > 0 ? ((self.user + self.system) / 1e6 / dt / NCPU) * 100 : null;

    // /api/ps (5초 간격)
    if (this.tickCount % 5 === 1 && this.engine === 'ollama') {
      const r = await requestJson('GET', '/api/ps', undefined, { timeoutMs: 3000 });
      try {
        if (!r.ok || !r.json) throw new Error('ps');
        this.lastPs = (r.json.models || []).map((m) => ({
          name: m.name,
          size: m.size ?? null,
          size_vram: m.size_vram ?? null,
          context_length: m.context_length ?? null,
        }));
      } catch {
        this.lastPs = null;
      }
    }
    if (this.tickCount % 5 === 1 && this.metricsProvider) this.nativeMetrics = await this.metricsProvider();

    const sample = {
      ts: new Date(now).toISOString(),
      tag: this.tag,
      gpu: this.lastGpu,
      cpu_pct: round1(cpuPct),
      ollama_cpu_pct: round1(ollamaCpuPct),
      engine: this.engine, engine_cpu_pct: round1(ollamaCpuPct),
      loadgen_cpu_pct: round1(loadgenCpuPct),
      system_ram_used_mib: round1((os.totalmem() - os.freemem()) / 1024 ** 2),
      running_requests: this.nativeMetrics ? this.nativeMetrics.running : null,
      queued_requests: this.nativeMetrics ? this.nativeMetrics.queued : null,
      native_metrics: this.tickCount % 5 === 1 ? this.nativeMetrics : undefined,
      loaded: this.tickCount % 5 === 1 ? this.lastPs : undefined,
    };
    if (this.appender) this.appender.append(sample);
    if (this.tag) {
      if (!this.samples.has(this.tag)) this.samples.set(this.tag, []);
      this.samples.get(this.tag).push(sample);
    }
  }

  // 단계(tag) 동안의 서버 상태 요약
  summarize(tag) {
    const s = this.samples.get(tag) || [];
    const pick = (fn) => s.map(fn).filter((v) => typeof v === 'number' && Number.isFinite(v));
    const avg = (a) => (a.length ? round1(a.reduce((x, y) => x + y, 0) / a.length) : null);
    const max = (a) => (a.length ? round1(Math.max(...a)) : null);
    const min = (a) => (a.length ? round1(Math.min(...a)) : null);
    return {
      samples: s.length,
      vram_max_mib: max(pick((x) => x.gpu && x.gpu.mem_used_mib)),
      vram_total_mib: max(pick((x) => x.gpu && x.gpu.mem_total_mib)),
      gpu_util_avg: avg(pick((x) => x.gpu && x.gpu.util_pct)),
      gpu_temp_max: max(pick((x) => x.gpu && x.gpu.temp_c)),
      sm_clock_min: min(pick((x) => x.gpu && x.gpu.sm_clock_mhz)),
      sm_clock_avg: avg(pick((x) => x.gpu && x.gpu.sm_clock_mhz)),
      cpu_avg: avg(pick((x) => x.cpu_pct)),
      cpu_max: max(pick((x) => x.cpu_pct)),
      ollama_cpu_avg: avg(pick((x) => x.ollama_cpu_pct)),
      engine_cpu_avg: avg(pick((x) => x.engine_cpu_pct)),
      system_ram_max_mib: max(pick((x) => x.system_ram_used_mib)),
      running_requests_max: max(pick((x) => x.running_requests)),
      queued_requests_max: max(pick((x) => x.queued_requests)),
      gpu_power_avg_w: avg(pick((x) => x.gpu && x.gpu.power_w)),
      gpu_power_max_w: max(pick((x) => x.gpu && x.gpu.power_w)),
      gpu_power_limit_w: max(pick((x) => x.gpu && x.gpu.power_limit_w)),
      loadgen_cpu_avg: avg(pick((x) => x.loadgen_cpu_pct)),
      loadgen_cpu_max: max(pick((x) => x.loadgen_cpu_pct)),
    };
  }

  clearTag(tag) {
    this.samples.delete(tag);
  }

  stop() {
    clearInterval(this.timer);
    if (this.gpuProc) {
      try { this.gpuProc.kill(); } catch { /* 이미 종료 */ }
    }
    if (this.appender) this.appender.close();
    this.appender = null;
  }
}

function round1(v) {
  return typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 10) / 10 : null;
}

module.exports = { Monitor };
