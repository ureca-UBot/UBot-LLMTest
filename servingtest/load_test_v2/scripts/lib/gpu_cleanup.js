'use strict';
const { performance } = require('node:perf_hooks');
const { gpuSnapshot } = require('./monitor');

function validGpu(gpu) {
  return gpu && typeof gpu.uuid === 'string' && gpu.uuid.length > 0 && typeof gpu.name === 'string' && gpu.name.length > 0
    && Number.isFinite(gpu.memory_used_mib) && gpu.memory_used_mib >= 0
    && Number.isFinite(gpu.memory_total_mib) && gpu.memory_total_mib > 0 && gpu.memory_used_mib <= gpu.memory_total_mib;
}
function inspectSnapshot(value, prefix) {
  if (!value || value.known !== true || !Array.isArray(value.gpus) || !Array.isArray(value.processes)
    || !Array.isArray(value.compute_processes)) return `${prefix}_unknown`;
  if (value.gpus.length !== 1) return `${prefix}_gpu_count`;
  if (!validGpu(value.gpus[0])) return `${prefix}_invalid_gpu`;
  if (value.processes.length !== value.compute_processes.length || value.processes.some(proc =>
    !Number.isInteger(proc?.pid) || proc.pid <= 0 || !Number.isFinite(proc.used_memory_mib) || proc.used_memory_mib < 0)) {
    return `${prefix}_invalid_processes`;
  }
  return null;
}
function evaluateGpuRelease(before, after, { toleranceMiB = 0 } = {}) {
  if (!Number.isFinite(toleranceMiB) || toleranceMiB < 0) throw new Error('GPU VRAM 허용 오차는 0 이상의 유한한 MiB 값이어야 합니다');
  const baselineError = inspectSnapshot(before, 'baseline');
  if (baselineError) return { released: false, known: false, reason: baselineError };
  if (before.processes.length) return { released: false, known: true, reason: 'baseline_processes_present' };
  const afterError = inspectSnapshot(after, 'after');
  if (afterError) return { released: false, known: false, reason: afterError };
  const baseline = before.gpus[0], current = after.gpus[0];
  if (current.uuid !== baseline.uuid || current.name !== baseline.name || current.memory_total_mib !== baseline.memory_total_mib) {
    return { released: false, known: true, reason: 'gpu_identity_changed' };
  }
  const limitMiB = baseline.memory_used_mib + toleranceMiB;
  const checks = { same_gpu: true, no_compute_processes: after.processes.length === 0,
    memory_at_baseline: current.memory_used_mib <= limitMiB, baseline_mib: baseline.memory_used_mib,
    after_mib: current.memory_used_mib, limit_mib: limitMiB, tolerance_mib: toleranceMiB };
  const reason = !checks.no_compute_processes ? 'compute_processes_present'
    : !checks.memory_at_baseline ? 'vram_above_baseline' : 'released';
  return { released: reason === 'released', known: true, reason, checks };
}
function wait(ms, signal) {
  return new Promise(resolve => {
    if (signal?.aborted) { resolve(); return; }
    const finish = () => { clearTimeout(timer); signal?.removeEventListener('abort', finish); resolve(); };
    const timer = setTimeout(finish, ms); signal?.addEventListener('abort', finish, { once: true });
  });
}
async function boundedSnapshot(snapshot, timeoutMs, signal) {
  let timer, abort;
  try {
    const interrupted = new Promise((_, reject) => {
      timer = setTimeout(() => { const error = new Error('GPU 종료 검증 시간 초과'); error.code = 'GPU_SNAPSHOT_TIMEOUT'; reject(error); }, timeoutMs);
      abort = () => { const error = new Error('GPU 종료 검증 중단'); error.code = 'GPU_SNAPSHOT_ABORTED'; reject(error); };
      if (signal?.aborted) abort(); else signal?.addEventListener('abort', abort, { once: true });
    });
    return await Promise.race([Promise.resolve().then(snapshot), interrupted]);
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}
async function waitForGpuRelease({ before, snapshot = () => gpuSnapshot(), timeoutMs = 30000,
  intervalMs = 500, toleranceMiB = 0, stableSamples = 3, signal } = {}) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 60000) throw new Error('GPU 종료 검증 시간은 0 초과 60000ms 이하여야 합니다');
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) throw new Error('GPU 종료 검증 주기는 0보다 커야 합니다');
  if (!Number.isInteger(stableSamples) || stableSamples < 2) throw new Error('GPU 종료 확인은 2회 이상 연속 측정해야 합니다');
  if (typeof snapshot !== 'function') throw new Error('GPU snapshot 함수가 필요합니다');
  const start = performance.now(), samples = []; let consecutive = 0, after = null, lastCheck = null;
  const result = (status, reason) => ({ status, released: status === 'released', reason,
    elapsed_ms: performance.now() - start, stable_samples_required: stableSamples, consecutive_stable_samples: consecutive,
    tolerance_mib: toleranceMiB, baseline: before, after, checks: lastCheck?.checks || null, samples });
  // A dirty or unobservable initial GPU is never a valid release baseline.
  const baselineCheck = evaluateGpuRelease(before, before, { toleranceMiB });
  if (!baselineCheck.released) return result('failed', baselineCheck.reason);
  if (signal?.aborted) return result('aborted', 'aborted');
  for (;;) {
    const remaining = timeoutMs - (performance.now() - start);
    if (remaining <= 0) return result('timeout', lastCheck?.reason || 'release_timeout');
    try { after = await boundedSnapshot(snapshot, remaining, signal); }
    catch (error) {
      if (error.code === 'GPU_SNAPSHOT_ABORTED') return result('aborted', 'aborted');
      if (error.code === 'GPU_SNAPSHOT_TIMEOUT') return result('timeout', 'snapshot_timeout');
      after = { known: false, errors: error.message }; samples.push({ at_ms: performance.now() - start, snapshot: after });
      return result('failed', 'snapshot_error');
    }
    if (signal?.aborted) return result('aborted', 'aborted');
    lastCheck = evaluateGpuRelease(before, after, { toleranceMiB });
    samples.push({ at_ms: performance.now() - start, snapshot: after, check: lastCheck });
    if (!lastCheck.known || lastCheck.reason === 'gpu_identity_changed') return result('failed', lastCheck.reason);
    consecutive = lastCheck.released ? consecutive + 1 : 0;
    if (consecutive >= stableSamples) return result('released', 'released');
    if (performance.now() - start >= timeoutMs) return result('timeout', lastCheck.reason);
    await wait(Math.min(intervalMs, timeoutMs - (performance.now() - start)), signal);
    if (signal?.aborted) return result('aborted', 'aborted');
  }
}
module.exports = { evaluateGpuRelease, waitForGpuRelease };
