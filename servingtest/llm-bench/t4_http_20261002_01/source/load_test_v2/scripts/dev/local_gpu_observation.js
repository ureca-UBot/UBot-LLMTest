'use strict';
// Development diagnostics only. This cannot certify a benchmark GPU release.
const { performance } = require('node:perf_hooks');
const { run } = require('../lib/runtime');
const { parseGpuSnapshot } = require('../lib/monitor');

const DIAGNOSTIC = Object.freeze({ scope: 'windows_wddm_diagnostic',
  compute_process_verification: 'unsupported', strict_gpu_release: 'unsupported', benchmark_eligible: false });
function validGpu(gpu) {
  return gpu && Number.isInteger(gpu.index) && gpu.index >= 0 && typeof gpu.uuid === 'string' && gpu.uuid.length > 0
    && typeof gpu.name === 'string' && gpu.name.length > 0 && Number.isFinite(gpu.memory_used_mib) && gpu.memory_used_mib >= 0
    && Number.isFinite(gpu.memory_total_mib) && gpu.memory_total_mib > 0 && gpu.memory_used_mib <= gpu.memory_total_mib;
}
function sameGpu(a, b) { return a.uuid === b.uuid && a.name === b.name && a.memory_total_mib === b.memory_total_mib; }
async function readLocalGpuObservation({ commandRunner = run, timeoutMs = 10000 } = {}) {
  const output = { ...DIAGNOSTIC, known: false, gpu: null, observed_at: new Date().toISOString(), raw: '', errors: '' };
  try {
    const result = await commandRunner('nvidia-smi', ['--query-gpu=index,uuid,name,memory.used,memory.total,driver_version',
      '--format=csv,noheader,nounits'], { timeoutMs });
    output.raw = typeof result?.stdout === 'string' ? result.stdout.trim() : '';
    if (!result || result.code !== 0) throw new Error(result?.error || result?.stderr || 'nvidia-smi 실행 실패');
    const { gpus } = parseGpuSnapshot('', output.raw);
    if (gpus.length !== 1) throw new Error('로컬 GPU 관측은 단일 GPU만 지원합니다');
    output.gpu = gpus[0]; output.known = true;
  } catch (error) { output.errors = error.message; }
  return output;
}
function baselineEnvelope(samples, { maxRangeMiB = 256, minSamples = 3 } = {}) {
  if (!Number.isFinite(maxRangeMiB) || maxRangeMiB < 0 || !Number.isInteger(minSamples) || minSamples < 3) {
    throw new Error('기준선 범위는 0 이상의 MiB, 기준선 표본 수는 3 이상이어야 합니다');
  }
  const result = { ...DIAGNOSTIC, status: 'failed', known: false, min_mib: null, max_mib: null, range_mib: null,
    max_range_mib: maxRangeMiB, gpu: null, samples: Array.isArray(samples) ? structuredClone(samples) : [] };
  if (!Array.isArray(samples) || samples.length < minSamples) return { ...result, reason: 'baseline_insufficient_samples' };
  if (samples.some(sample => sample?.known !== true || !validGpu(sample.gpu))) return { ...result, reason: 'baseline_unknown' };
  const gpu = { ...samples[0].gpu };
  if (samples.some(sample => !sameGpu(gpu, sample.gpu))) return { ...result, reason: 'baseline_gpu_identity_changed' };
  const memories = samples.map(sample => sample.gpu.memory_used_mib), min = Math.min(...memories), max = Math.max(...memories);
  Object.assign(result, { gpu, min_mib: min, max_mib: max, range_mib: max - min });
  if (max - min > maxRangeMiB) return { ...result, reason: 'baseline_unstable' };
  return { ...result, status: 'recorded', known: true, reason: 'baseline_recorded' };
}
function delay(ms, signal) {
  return new Promise(resolve => {
    if (signal?.aborted) { resolve(); return; }
    const finish = () => { clearTimeout(timer); signal?.removeEventListener('abort', finish); resolve(); };
    const timer = setTimeout(finish, ms); signal?.addEventListener('abort', finish, { once: true });
  });
}
async function deadlineSnapshot(snapshot, timeoutMs, signal) {
  let timer, onAbort;
  try {
    const interrupted = new Promise((_, reject) => {
      timer = setTimeout(() => { const error = new Error('GPU 관측 시간 초과'); error.code = 'OBSERVATION_TIMEOUT'; reject(error); }, timeoutMs);
      onAbort = () => { const error = new Error('GPU 관측 중단'); error.code = 'OBSERVATION_ABORTED'; reject(error); };
      if (signal?.aborted) onAbort(); else signal?.addEventListener('abort', onAbort, { once: true });
    });
    return await Promise.race([Promise.resolve().then(snapshot), interrupted]);
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', onAbort); }
}
async function waitForVramReturn({ baseline, snapshot = () => readLocalGpuObservation(), timeoutMs = 60000,
  intervalMs = 500, stableSamples = 3, toleranceMiB = 0, signal } = {}) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 60000 || !Number.isFinite(intervalMs) || intervalMs <= 0
    || !Number.isInteger(stableSamples) || stableSamples < 3 || typeof snapshot !== 'function') throw new Error('로컬 GPU 관측 주기·시간·연속 표본 설정이 잘못되었습니다');
  if (!Number.isInteger(toleranceMiB) || toleranceMiB < 0 || toleranceMiB > 64) throw new Error('로컬 VRAM 허용 오차는 0..64 MiB 정수여야 합니다');
  const start = performance.now(), samples = []; let consecutive = 0, after = null;
  // Capture the original bound once. Later observations can never raise it.
  const target = { gpu: baseline?.gpu ? { ...baseline.gpu } : null, min_mib: baseline?.min_mib,
    max_mib: baseline?.max_mib, known: baseline?.known, status: baseline?.status };
  const limitMiB = Number.isFinite(target.max_mib) ? target.max_mib + toleranceMiB : null;
  const result = (status, reason) => ({ ...DIAGNOSTIC, status, reason, observed_returned: status === 'observed_returned',
    elapsed_ms: performance.now() - start, baseline: target, after, stable_samples_required: stableSamples,
    consecutive_stable_samples: consecutive, tolerance_mib: toleranceMiB, limit_mib: limitMiB, samples });
  if (target.known !== true || target.status !== 'recorded' || !validGpu(target.gpu)
    || !Number.isFinite(target.min_mib) || !Number.isFinite(target.max_mib) || target.min_mib < 0
    || target.max_mib < target.min_mib || target.max_mib > target.gpu.memory_total_mib) return result('failed', 'baseline_unknown');
  if (signal?.aborted) return result('failed', 'aborted');
  for (;;) {
    const remaining = timeoutMs - (performance.now() - start);
    if (remaining <= 0) return result('timeout', 'vram_return_timeout');
    try { after = await deadlineSnapshot(snapshot, remaining, signal); }
    catch (error) {
      if (error.code === 'OBSERVATION_TIMEOUT') return result('timeout', 'snapshot_timeout');
      if (error.code === 'OBSERVATION_ABORTED') return result('failed', 'aborted');
      after = { known: false, errors: error.message }; samples.push({ at_ms: performance.now() - start, observation: after,
        baseline_max_mib: target.max_mib, tolerance_mib: toleranceMiB, limit_mib: limitMiB });
      return result('failed', 'snapshot_error');
    }
    if (signal?.aborted) return result('failed', 'aborted');
    const reason = after?.known !== true || !validGpu(after.gpu) ? 'after_unknown'
      : !sameGpu(target.gpu, after.gpu) ? 'gpu_identity_changed'
        : after.gpu.memory_used_mib <= target.max_mib ? 'observed_at_baseline'
          : after.gpu.memory_used_mib <= limitMiB ? 'observed_within_tolerance' : 'vram_above_baseline';
    samples.push({ at_ms: performance.now() - start, observation: structuredClone(after), reason,
      baseline_max_mib: target.max_mib, tolerance_mib: toleranceMiB, limit_mib: limitMiB });
    if (reason === 'after_unknown' || reason === 'gpu_identity_changed') return result('failed', reason);
    consecutive = reason === 'observed_at_baseline' || reason === 'observed_within_tolerance' ? consecutive + 1 : 0;
    if (consecutive >= stableSamples) return result('observed_returned', 'observed_returned');
    if (performance.now() - start >= timeoutMs) return result('timeout', 'vram_above_baseline');
    await delay(Math.min(intervalMs, timeoutMs - (performance.now() - start)), signal);
    if (signal?.aborted) return result('failed', 'aborted');
  }
}
module.exports = { readLocalGpuObservation, baselineEnvelope, waitForVramReturn };
