'use strict';
const { gpuSnapshot } = require('./monitor');
const { waitForGpuRelease, evaluateGpuRelease } = require('./gpu_cleanup');

function cleanupOptions(config = {}) {
  const source = config.cleanup || {};
  const result = { timeoutMs: source.timeout_ms ?? 30000, intervalMs: source.poll_interval_ms ?? 500,
    toleranceMiB: source.vram_tolerance_mib ?? 0, stableSamples: source.stable_samples ?? 3,
    maxIdleVramMiB: source.max_idle_vram_mib ?? 64 };
  for (const [name, value, min, max] of [
    ['timeoutMs', result.timeoutMs, 1, 60000], ['intervalMs', result.intervalMs, 1, 5000],
    ['toleranceMiB', result.toleranceMiB, 0, 64], ['stableSamples', result.stableSamples, 3, 20],
    ['maxIdleVramMiB', result.maxIdleVramMiB, 0, 1024],
  ]) if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`cleanup.${name} 범위 오류`);
  return result;
}
function assertBaseline(snapshot, { maxIdleVramMiB = 64 } = {}) {
  if (!evaluateGpuRelease(snapshot, snapshot).released || snapshot.scope === 'mock'
    || snapshot.gpus[0].memory_used_mib > maxIdleVramMiB) throw new Error('GPU 기준선 미확인·기존 작업 점유·유휴 VRAM 상한 초과; 엔진을 시작하지 않습니다');
  return snapshot;
}
async function cleanupOwnedEngine({ runtime, before, mock = false, gpuOptions = {}, snapshot = gpuSnapshot }) {
  const result = { status: 'failed', scope: mock ? 'mock' : 'gpu', runtime: null, gpu: null, errors: [] };
  try {
    result.runtime = await runtime.stop();
    if (result.runtime.process_exit_confirmed !== true || result.runtime.port_released !== true) result.errors.push('서버·worker 종료 또는 포트 해제 증거 부족');
  } catch (error) { result.errors.push(error.message); result.runtime = { process_exit_confirmed: false, error: error.message }; }
  if (mock) {
    result.gpu = { status: 'passed', scope: 'mock', limitation: '모의 프로세스는 GPU를 사용하지 않음; 실제 VRAM 해제를 검증하지 않음' };
  } else {
    try {
      result.gpu = await waitForGpuRelease({ before, snapshot, ...gpuOptions });
      result.gpu.scope = 'gpu';
      result.gpu.release_status = result.gpu.status;
      result.gpu.status = result.gpu.released === true ? 'passed' : 'failed';
      if (result.gpu.status !== 'passed') result.errors.push(`GPU 메모리 해제 실패: ${result.gpu.reason}`);
    } catch (error) { result.errors.push(error.message); result.gpu = { status: 'failed', reason: error.message }; }
  }
  result.status = result.errors.length ? 'failed' : 'passed';
  return result;
}
module.exports = { cleanupOptions, assertBaseline, cleanupOwnedEngine };
