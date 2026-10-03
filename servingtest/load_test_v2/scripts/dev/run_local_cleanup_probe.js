#!/usr/bin/env node
'use strict';
// Windows lifecycle diagnostic only. It cannot certify the production GPU gate.
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { Runtime, run, jsonRequest } = require('../lib/runtime');
const { gpuSnapshot } = require('../lib/monitor');
const { readLocalGpuObservation, baselineEnvelope, waitForVramReturn } = require('./local_gpu_observation');
const { HF_CACHE, OLLAMA_THINKING_CACHE } = require('./model_assets');
const ROOT = path.resolve(__dirname, '../..');
const BLOB = 'sha256-3e4cb14174460404e7a233e531675303b2fbf7749c02f91864fe311ab6344e4f';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const emit = value => process.stdout.write(JSON.stringify(value) + '\n');

function candidates() {
  const hfMount = { source: HF_CACHE, target: '/root/.cache/huggingface', read_only: true };
  return [
    { id: 'ollama', engine: 'ollama', api_model: 'qwen3:4b', host: 'http://127.0.0.1:19541',
      checkpoint: 'Qwen3-4B-Thinking-2507 (existing Ollama artifact)', format: 'GGUF Q4_K_M', internal_limit: 4,
      runtime: { mode: 'docker', image: 'ollama/ollama:0.34.0', container_port: 11434, ready_timeout_ms: 180000,
        args: ['serve'], mounts: [{ source: path.join(OLLAMA_THINKING_CACHE, 'models'), target: '/models', read_only: true }],
        env: { OLLAMA_MODELS: '/models', OLLAMA_HOST: '0.0.0.0:11434', OLLAMA_FLASH_ATTENTION: 'true',
          OLLAMA_KV_CACHE_TYPE: 'f16', OLLAMA_NUM_PARALLEL: '4', OLLAMA_MAX_LOADED_MODELS: '1' } } },
    { id: 'llamacpp', engine: 'llama.cpp', api_model: 'qwen3-4b-q4km', host: 'http://127.0.0.1:19542',
      checkpoint: 'Qwen3-4B-Thinking-2507 (same existing GGUF)', format: 'GGUF Q4_K_M', internal_limit: 4,
      runtime: { mode: 'docker', image: 'ghcr.io/ggml-org/llama.cpp:server-cuda', container_port: 8080, ready_timeout_ms: 360000,
        mounts: [{ source: path.join(OLLAMA_THINKING_CACHE, 'models/blobs'), target: '/models', read_only: true },
          { source: path.join(HF_CACHE, 'qwen3_base.jinja'), target: '/templates/qwen3_base.jinja', read_only: true }],
        args: ['--model', `/models/${BLOB}`, '--host', '0.0.0.0', '--port', '8080', '--alias', 'qwen3-4b-q4km',
          '--parallel', '4', '--ctx-size', '16384', '--n-gpu-layers', '99', '--flash-attn', 'on',
          '--chat-template-file', '/templates/qwen3_base.jinja', '--reasoning', 'off'] } },
    { id: 'vllm', engine: 'vllm', api_model: 'qwen3-4b-awq', host: 'http://127.0.0.1:19543',
      checkpoint: 'Qwen/Qwen3-4B-AWQ@74d4bd2bd4bff9cafc9345221320bffb08b406a3', format: 'Safetensors AWQ', internal_limit: 8,
      runtime: { mode: 'docker', image: 'vllm/vllm-openai:v0.30.0', container_port: 8000, ready_timeout_ms: 600000,
        mounts: [hfMount], args: ['Qwen/Qwen3-4B-AWQ', '--dtype', 'half', '--max-model-len', '4096',
          '--served-model-name', 'qwen3-4b-awq', '--gpu-memory-utilization', '0.8', '--max-num-seqs', '8',
          '--host', '0.0.0.0', '--port', '8000'] } },
    { id: 'sglang', engine: 'sglang', api_model: 'qwen3-4b-awq', host: 'http://127.0.0.1:19544',
      checkpoint: 'Qwen/Qwen3-4B-AWQ@74d4bd2bd4bff9cafc9345221320bffb08b406a3', format: 'Safetensors AWQ', internal_limit: 8,
      runtime: { mode: 'docker', image: 'llm-local-opt-sglang:0.4.6-post5', entrypoint: 'python3',
        container_port: 30000, ready_timeout_ms: 600000, mounts: [hfMount],
        args: ['-m', 'sglang.launch_server', '--model-path', 'Qwen/Qwen3-4B-AWQ', '--dtype', 'float16',
          '--context-length', '4096', '--served-model-name', 'qwen3-4b-awq', '--mem-fraction-static', '0.7',
          '--max-running-requests', '8', '--attention-backend', 'triton', '--sampling-backend', 'pytorch',
          '--cuda-graph-max-bs', '8', '--host', '0.0.0.0', '--port', '30000'] } },
  ];
}

async function inference(candidate, signal) {
  const messages = [{ role: 'user', content: 'Reply with the word OK only. /no_think' }];
  const body = candidate.engine === 'ollama'
    ? { model: candidate.api_model, messages, stream: false, think: false, keep_alive: -1,
      options: { temperature: 0, num_ctx: 4096, num_predict: 64 } }
    : { model: candidate.api_model, messages, stream: false, temperature: 0, max_tokens: 64,
      chat_template_kwargs: { enable_thinking: false } };
  const route = candidate.engine === 'ollama' ? '/api/chat' : '/v1/chat/completions';
  const started = Date.now();
  const response = await fetch(new URL(route, candidate.host), { method: 'POST',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(120000)]) : AbortSignal.timeout(120000) });
  const text = await response.text(); let data;
  try { data = JSON.parse(text); } catch { data = null; }
  const tokens = candidate.engine === 'ollama' ? data?.eval_count : data?.usage?.completion_tokens;
  const done = candidate.engine === 'ollama' ? data?.done === true : data?.choices?.[0]?.finish_reason != null;
  return { request: { route, body }, response: data || text, http_status: response.status,
    elapsed_ms: Date.now() - started, output_tokens: tokens,
    inference_completed: response.ok && done && Number.isFinite(tokens) && tokens > 0 };
}

async function containerEvidence(container) {
  const [state, processes, stats, cgroup] = await Promise.all([
    run('docker', ['inspect', '--format', '{{json .State}}', container]),
    run('docker', ['top', container, '-eo', 'pid,ppid,comm']),
    run('docker', ['stats', '--no-stream', '--format', '{{json .}}', container]),
    run('docker', ['exec', container, 'cat', '/sys/fs/cgroup/memory.current', '/sys/fs/cgroup/memory.stat']),
  ]);
  return { state, processes, stats, cgroup,
    limitation: 'Container RAM includes file cache; removal proves its processes exited, not host page cache eviction.' };
}

async function main(argv = process.argv.slice(2)) {
  if (process.platform !== 'win32') throw new Error('This diagnostic is scoped to Windows WDDM, not the formal Linux benchmark.');
  let out;
  if (argv.length === 0) out = path.join(ROOT, 'results', `local_cleanup_${new Date().toISOString().replace(/[:.]/g, '-')}`);
  else if (argv.length === 2 && argv[0] === '--out') out = path.resolve(argv[1]);
  else throw new Error('usage: node scripts/dev/run_local_cleanup_probe.js [--out load_test_v2/results/NEW_DIRECTORY]');
  const relative = path.relative(path.join(ROOT, 'results'), out);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || fs.existsSync(out)) throw new Error('Use a new directory within load_test_v2/results.');
  const lock = path.join(ROOT, '.benchmark.lock'), token = randomUUID(), controller = new AbortController();
  const interrupt = () => controller.abort();
  const report = { schema_version: 2, scope: 'local_windows_lifecycle_diagnostic', mock: false,
    started_at: new Date().toISOString(), status: 'running', strict_gpu_release: 'unsupported',
    benchmark_eligible: false, c_slo: null, candidates: [],
    limitations: ['WDDM/WSL does not provide complete per-process VRAM evidence.',
      'Desktop GPU usage can vary and mask engine residuals; total VRAM return is observational evidence.',
      'Existing GGUF and AWQ use different checkpoints; these runs do not compare engine performance.'] };
  let locked = false, cleanupFailure = false;
  try {
    fs.writeFileSync(lock, JSON.stringify({ token, pid: process.pid, started_at: report.started_at, out,
      scope: report.scope }), { flag: 'wx' }); locked = true;
    fs.mkdirSync(out, { recursive: true });
    process.on('SIGINT', interrupt); process.on('SIGTERM', interrupt);
    report.strict_initial_snapshot = await gpuSnapshot();
    report.existing_local_ollama_before = await jsonRequest('http://127.0.0.1:11434', '/api/ps');
    if (!report.existing_local_ollama_before.ok || !Array.isArray(report.existing_local_ollama_before.json?.models)
      || report.existing_local_ollama_before.json.models.length) throw new Error('Existing local Ollama model residency is occupied or unknown; do not start experiments.');
    const before = [];
    for (let i = 0; i < 10; i++) { before.push(await readLocalGpuObservation()); await sleep(500); }
    report.baseline = baselineEnvelope(before);
    if (!report.baseline.known) throw new Error(`Unusable initial GPU envelope: ${report.baseline.reason}`);
    write(path.join(out, 'report.json'), report); emit({ event: 'baseline', min_mib: report.baseline.min_mib, max_mib: report.baseline.max_mib, out });
    for (const candidate of candidates()) {
      if (controller.signal.aborted) throw new Error('User interrupted');
      const directory = path.join(out, candidate.id), result = { id: candidate.id, candidate,
        strict_gpu_release: 'unsupported', benchmark_eligible: false, status: 'running' };
      report.candidates.push(result); fs.mkdirSync(directory);
      result.before = await waitForVramReturn({ baseline: report.baseline, timeoutMs: 60000, signal: controller.signal });
      if (controller.signal.aborted) throw new Error('User interrupted before engine launch');
      if (result.before.status !== 'observed_returned') { cleanupFailure = true; throw new Error(`Before ${candidate.id}: GPU did not return to the fixed baseline envelope`); }
      const runtime = new Runtime(candidate, directory, { signal: controller.signal });
      emit({ event: 'starting', engine: candidate.id });
      let heartbeat;
      try {
        heartbeat = setInterval(() => emit({ event: 'loading', engine: candidate.id, container: runtime.container }), 20000);
        result.launch = await runtime.start(); clearInterval(heartbeat);
        result.loaded_gpu = await readLocalGpuObservation();
        result.inferences = [];
        for (let i = 0; i < 2; i++) {
          result.inferences.push(await inference(candidate, controller.signal));
          if (!result.inferences.at(-1).inference_completed) throw new Error('Inference did not complete with output tokens');
        }
        result.resident_gpu = await readLocalGpuObservation();
        result.live_container = await containerEvidence(runtime.container);
        if (candidate.engine === 'ollama') {
          result.ollama_resident = await jsonRequest(candidate.host, '/api/ps');
          result.ollama_unload = await jsonRequest(candidate.host, '/api/generate', { method: 'POST',
            body: { model: candidate.api_model, keep_alive: 0, stream: false }, timeoutMs: 30000 });
          result.ollama_after_unload = await jsonRequest(candidate.host, '/api/ps');
          result.ollama_unload_verified = result.ollama_unload.ok && result.ollama_after_unload.ok
            && Array.isArray(result.ollama_after_unload.json?.models) && result.ollama_after_unload.json.models.length === 0;
          result.after_unload_gpu = await readLocalGpuObservation();
        }
        result.status = 'inference_completed';
      } catch (error) { result.status = 'engine_failed'; result.error = error.message; }
      finally {
        clearInterval(heartbeat);
        try { result.runtime_cleanup = await runtime.stop(); }
        catch (error) { result.runtime_cleanup = { process_exit_confirmed: false, error: error.message }; }
        result.lifecycle_verified = result.runtime_cleanup.process_exit_confirmed === true && result.runtime_cleanup.port_released === true;
        result.vram_return = await waitForVramReturn({ baseline: report.baseline, timeoutMs: 60000 });
        result.vram_return_observed = result.vram_return.status === 'observed_returned';
        result.after_endpoint = await jsonRequest(candidate.host, candidate.engine === 'ollama' ? '/api/tags' : '/v1/models');
        result.lifecycle_verified = result.lifecycle_verified && result.after_endpoint.status === undefined;
        cleanupFailure = !result.lifecycle_verified || !result.vram_return_observed;
        result.status = cleanupFailure ? 'cleanup_unverified' : result.status === 'inference_completed' ? 'lifecycle_observed' : result.status;
        write(path.join(directory, 'round.json'), result); write(path.join(out, 'report.json'), report);
        emit({ event: 'finished', engine: candidate.id, status: result.status, lifecycle_verified: result.lifecycle_verified,
          vram_return_observed: result.vram_return_observed, resident_mib: result.resident_gpu?.gpu?.memory_used_mib,
          after_mib: result.vram_return.after?.gpu?.memory_used_mib, error: result.error });
      }
      if (cleanupFailure) throw new Error('Cleanup evidence failed; do not start the next engine.');
    }
    report.existing_local_ollama_after = await jsonRequest('http://127.0.0.1:11434', '/api/ps');
    report.status = report.candidates.every(c => c.status === 'lifecycle_observed') ? 'completed_diagnostic' : 'completed_with_engine_failures';
  } catch (error) { report.status = cleanupFailure ? 'cleanup_unverified' : 'failed'; report.error = error.message; }
  finally {
    process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
    report.finished_at = new Date().toISOString(); report.lock_retained = cleanupFailure;
    if (locked) {
      if (fs.existsSync(out)) write(path.join(out, 'report.json'), report);
      if (!cleanupFailure && JSON.parse(fs.readFileSync(lock, 'utf8')).token === token) fs.unlinkSync(lock);
    }
  }
  emit({ event: 'report', status: report.status, report: path.join(out, 'report.json'), strict_gpu_release: 'unsupported', lock_retained: cleanupFailure });
  if (report.status !== 'completed_diagnostic') process.exitCode = 1;
  return report;
}
if (require.main === module) main().catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
module.exports = { main, candidates, inference };
