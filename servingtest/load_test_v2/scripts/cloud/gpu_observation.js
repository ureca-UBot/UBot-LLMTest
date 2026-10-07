'use strict';
const { gpuSnapshot } = require('../lib/monitor');
const { evaluateGpuRelease, waitForGpuRelease } = require('../lib/gpu_cleanup');
const MIN_DRIVER = '580.95.05';

function driverAtLeast(value, minimum = MIN_DRIVER) {
  if (typeof value !== 'string' || !/^\d+\.\d+\.\d+$/.test(value)) return false;
  const actual = value.split('.').map(Number), required = minimum.split('.').map(Number);
  for (let i = 0; i < required.length; i++) {
    if (actual[i] !== required[i]) return actual[i] > required[i];
  }
  return true;
}

function assertLinuxT4(snapshot, { platform = process.platform } = {}) {
  if (platform !== 'linux') throw new Error('Cloud HTTP exploration requires Linux.');
  const check = evaluateGpuRelease(snapshot, snapshot, { toleranceMiB: 0 });
  if (!check.released) throw new Error(`An observable idle GPU is required: ${check.reason}`);
  const gpu = snapshot.gpus[0];
  if (!/^(?:Tesla|NVIDIA)?\s*T4$/i.test(gpu.name.trim())) throw new Error('Cloud HTTP exploration requires exactly one NVIDIA T4.');
  if (!/^GPU-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(gpu.uuid)) throw new Error('A measured GPU UUID is required.');
  if (!driverAtLeast(gpu.driver_version)) throw new Error(`Linux NVIDIA driver ${MIN_DRIVER} or newer is required by the frozen CUDA 13 image.`);
  return { gpu_uuid: gpu.uuid, gpu_name: gpu.name, baseline_mib: gpu.memory_used_mib,
    memory_total_mib: gpu.memory_total_mib, driver_version: gpu.driver_version };
}

async function fixedBaseline({ platform = process.platform, snapshot = () => gpuSnapshot(), signal,
  release = waitForGpuRelease, timeoutMs = 60000, intervalMs = 500 } = {}) {
  const baseline = await snapshot();
  const identity = assertLinuxT4(baseline, { platform });
  const verification = await release({ before: baseline, snapshot, signal, timeoutMs, intervalMs,
    toleranceMiB: 0, stableSamples: 3 });
  if (!verification.released) throw new Error(`The fixed initial GPU baseline is unstable: ${verification.reason}`);
  return { baseline, identity, verification };
}

async function strictRelease(baseline, { snapshot = () => gpuSnapshot(), signal, release = waitForGpuRelease,
  timeoutMs = 60000, intervalMs = 500 } = {}) {
  return release({ before: baseline, snapshot, signal, timeoutMs, intervalMs, toleranceMiB: 0, stableSamples: 3 });
}

module.exports = { assertLinuxT4, fixedBaseline, strictRelease, driverAtLeast, MIN_DRIVER };
