#!/usr/bin/env node
'use strict';
// Exploratory HTTP completion run for model families other than Qwen3-4B, on
// the local Windows RTX 3060 or on a Linux cloud GPU host (inside the runner image).
// It reuses the load_test_v2 libraries unchanged and keeps the same request
// contract, load steps and cleanup checks as run_local_http_exploration.js.
// Windows observations cannot replace the strict GPU cleanup gate; on Linux the
// run requires 0 MiB and no compute PID before and after every engine.
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID, createHash } = require('node:crypto');
const V2 = path.resolve(__dirname, '../load_test_v2');
const { Runtime, jsonRequest, validateAppliedArgs } = require(path.join(V2, 'scripts/lib/runtime'));
const { Monitor, gpuSnapshot } = require(path.join(V2, 'scripts/lib/monitor'));
const { createClient } = require(path.join(V2, 'scripts/lib/transport'));
const { loadCases } = require(path.join(V2, 'scripts/lib/cases'));
const { runClosedLoop } = require(path.join(V2, 'scripts/lib/load_generator'));
const { readLocalGpuObservation, baselineEnvelope, waitForVramReturn } = require(path.join(V2, 'scripts/dev/local_gpu_observation'));
const { evaluateGpuRelease, waitForGpuRelease } = require(path.join(V2, 'scripts/lib/gpu_cleanup'));
const { summarizeHttpCapacity } = require(path.join(V2, 'scripts/dev/http_capacity'));
const { warmHttpOnly, ownedCommandRunner } = require(path.join(V2, 'scripts/dev/run_local_http_exploration'));

const ASSETS = path.resolve(__dirname, '../model_assets/multimodel');
const RESULTS = path.resolve(__dirname, '../local/results/multimodel');
const WORKLOAD_SHA = '67ca43b2b901360cefde705a872e52441edc107abb4c19b202f746d923ea4122';
const LINUX = process.platform === 'linux';
// The cloud host keeps the frozen engine images from the earlier L4 runs.
const IMAGES = LINUX
  ? { ollama: 'ollama/ollama:0.34.0', llamacpp: 'llm-frozen/llamacpp:20261002-bb4015809bc5',
    vllm: 'vllm/vllm-openai:v0.30.0', sglang: 'llm-frozen/sglang:20261002-f784a3df9ec0' }
  : { ollama: 'ollama/ollama:0.34.0', llamacpp: 'ghcr.io/ggml-org/llama.cpp:server-cuda',
    vllm: 'vllm/vllm-openai:v0.30.0', sglang: 'llm-local-opt-sglang:0.4.6-post5' };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const append = (file, value) => fs.appendFileSync(file, JSON.stringify(value) + '\n');
const emit = value => process.stdout.write(JSON.stringify(value) + '\n');

const MODELS = {
  exaone: {
    family: 'LGAI-EXAONE/EXAONE-3.5-7.8B-Instruct', name: 'exaone35-7.8b',
    gguf: { repository: 'LGAI-EXAONE/EXAONE-3.5-7.8B-Instruct-GGUF', revision: 'c618bf67338171760c72c3f109f2900cb7d79855',
      dir: 'EXAONE-3.5-7.8B-Instruct-GGUF', file: 'EXAONE-3.5-7.8B-Instruct-Q4_K_M.gguf', format: 'GGUF Q4_K_M' },
    tensors: { repository: 'LGAI-EXAONE/EXAONE-3.5-7.8B-Instruct-AWQ', revision: 'e50260813863d02f6aafb889bb2820d447704c6c',
      dir: 'EXAONE-3.5-7.8B-Instruct-AWQ', format: 'Safetensors AWQ', vllm_dtype: 'half', sglang_dtype: 'float16',
      weights: ['model-00001-of-00002.safetensors', 'model-00002-of-00002.safetensors'], trust_remote_code: true },
    limitation: 'Official GGUF and AWQ releases declare the same base model; exact conversion lineage is not verified.',
  },
  gemma: {
    family: 'google/gemma-3-4b-it', name: 'gemma3-4b',
    gguf: { repository: 'ggml-org/gemma-3-4b-it-GGUF', revision: 'd0976223747697cb51e056d85c532013931fe52e',
      dir: 'gemma-3-4b-it-GGUF', file: 'gemma-3-4b-it-Q4_K_M.gguf', format: 'GGUF Q4_K_M' },
    tensors: { repository: 'unsloth/gemma-3-4b-it', revision: 'bf46152c47f5dd20b896357cb51abc4c03b8ee8c',
      dir: 'gemma-3-4b-it', format: 'Safetensors BF16 (unquantized)', vllm_dtype: 'bfloat16', sglang_dtype: 'bfloat16',
      weights: ['model-00001-of-00002.safetensors', 'model-00002-of-00002.safetensors'], trust_remote_code: false,
      sglang_attention_backend: 'flashinfer' },
    limitation: 'GGUF engines use Q4_K_M while vLLM/SGLang use unquantized BF16 from an ungated mirror whose weight hashes match google/gemma-3-4b-it; precision differs between engine groups.',
  },
  // Same family as the Qwen3-4B baseline; llama.cpp keeps the baseline's official
  // Qwen3 chat template file and reasoning-off flag.
  qwen14: {
    family: 'Qwen/Qwen3-14B', name: 'qwen3-14b', verify_thinking_off: true,
    gguf: { repository: 'Qwen/Qwen3-14B-GGUF', revision: '530227a7d994db8eca5ab5ced2fb692b614357fd',
      dir: 'Qwen3-14B-GGUF', file: 'Qwen3-14B-Q4_K_M.gguf', format: 'GGUF Q4_K_M',
      llamacpp_template: path.join(V2, 'docker/templates/qwen3_base.jinja') },
    tensors: { repository: 'Qwen/Qwen3-14B-AWQ', revision: '31c69efc29464b6bb0aee1398b5a7b50a99340c3',
      dir: 'Qwen3-14B-AWQ', format: 'Safetensors AWQ', vllm_dtype: 'half', sglang_dtype: 'float16',
      weights: ['model-00001-of-00002.safetensors', 'model-00002-of-00002.safetensors'], trust_remote_code: false },
    limitation: 'Official GGUF and AWQ releases declare the same base model; exact conversion lineage is not verified. The llama.cpp chat template file is the one extracted from Qwen3-4B-AWQ.',
  },
  qwen8: {
    family: 'Qwen/Qwen3-8B', name: 'qwen3-8b', verify_thinking_off: true,
    gguf: { repository: 'Qwen/Qwen3-8B-GGUF', revision: '7c41481f57cb95916b40956ab2f0b139b296d974',
      dir: 'Qwen3-8B-GGUF', file: 'Qwen3-8B-Q4_K_M.gguf', format: 'GGUF Q4_K_M',
      llamacpp_template: path.join(V2, 'docker/templates/qwen3_base.jinja') },
    tensors: { repository: 'Qwen/Qwen3-8B-AWQ', revision: '4da05a8edb55c6046cce958586c33b61da07bb79',
      dir: 'Qwen3-8B-AWQ', format: 'Safetensors AWQ', vllm_dtype: 'half', sglang_dtype: 'float16',
      weights: ['model-00001-of-00002.safetensors', 'model-00002-of-00002.safetensors'], trust_remote_code: false },
    limitation: 'Official GGUF and AWQ releases declare the same base model; exact conversion lineage is not verified. The llama.cpp chat template file is the one extracted from Qwen3-4B-AWQ.',
  },
  // Community conversion of Google's QAT INT4 checkpoint into AWQ layout; AWQ
  // calibration was not used, and it is not the checkpoint behind the Q4_K_M GGUF.
  gemma_awq: {
    family: 'google/gemma-3-4b-it', name: 'gemma3-4b',
    gguf: { repository: 'ggml-org/gemma-3-4b-it-GGUF', revision: 'd0976223747697cb51e056d85c532013931fe52e',
      dir: 'gemma-3-4b-it-GGUF', file: 'gemma-3-4b-it-Q4_K_M.gguf', format: 'GGUF Q4_K_M' },
    tensors: { repository: 'gaunernst/gemma-3-4b-it-int4-awq', revision: '8f28faf05c382a2dd81a471090acdb23156eb354',
      dir: 'gemma-3-4b-it-int4-awq', format: 'Safetensors AWQ layout (community, from QAT INT4)', vllm_dtype: 'bfloat16', sglang_dtype: 'bfloat16',
      // vLLM rejects float16 for gemma3; SGLang's triton backend lacks Gemma's window attention.
      sglang_attention_backend: 'flashinfer',
      weights: ['model.safetensors'], trust_remote_code: false },
    limitation: 'vLLM/SGLang weights are an unofficial community conversion of the QAT INT4 checkpoint; the Q4_K_M GGUF derives from the base checkpoint, so engine groups do not share one quantized artifact.',
  },
};

const DEFINITIONS = [
  ['ollama_p4', 'ollama', 4, [1, 4, 8, 16, 32]],
  ['llamacpp_p4', 'llama.cpp', 4, [4, 8, 16, 32]],
  ['vllm_s8', 'vllm', 8, [4, 8, 16, 32]],
  ['sglang_r8', 'sglang', 8, [4, 8, 16, 32]],
  ['vllm_s32', 'vllm', 32, [16, 32, 64]],
  ['sglang_r32', 'sglang', 32, [16, 32, 64]],
];
// Larger internal limits run only when named with --candidate.
const EXPANSION = [
  ['vllm_s64', 'vllm', 64, [32, 64, 128]],
  ['sglang_r64', 'sglang', 64, [32, 64, 128]],
  ['vllm_s16', 'vllm', 16, [8, 16, 32, 64]],
  ['sglang_r16', 'sglang', 16, [8, 16, 32, 64]],
];
const BASE_IDS = new Set(DEFINITIONS.map(([id]) => id));

function prepareCandidates(model, outputDir) {
  const ggufDir = path.join(ASSETS, model.gguf.dir), tensorDir = path.join(ASSETS, model.tensors.dir);
  const modelfile = path.join(outputDir, 'Modelfile');
  // FROM-only import into each owned container's private store, so the template
  // Ollama derives from the GGUF metadata can be inspected before measuring.
  fs.writeFileSync(modelfile, `FROM /artifacts/${model.gguf.file}\n`, { flag: 'wx' });
  return [...DEFINITIONS, ...EXPANSION].map(([id, engine, limit, users], index) => {
    const gguf = engine === 'ollama' || engine === 'llama.cpp', source = gguf ? model.gguf : model.tensors;
    const candidate = { id, engine, host: `http://127.0.0.1:${19561 + index}`, internal_limit: limit, users,
      model_family: model.family, cpu_offload: 'none', benchmark_eligible: false, format: source.format,
      weight_source_repository: source.repository, weight_source_revision: source.revision,
      lineage_limitation: model.limitation };
    if (engine === 'ollama') {
      candidate.api_model = `${model.name}-baseline:latest`;
      candidate.runtime = { mode: 'docker', image: IMAGES.ollama, container_port: 11434, ready_timeout_ms: 180000,
        args: ['serve'], mounts: [{ source: ggufDir, target: '/artifacts', read_only: true },
          { source: modelfile, target: '/benchmark/Modelfile', read_only: true }],
        env: { OLLAMA_MODELS: '/models', OLLAMA_HOST: '0.0.0.0:11434', OLLAMA_FLASH_ATTENTION: 'true',
          OLLAMA_KV_CACHE_TYPE: 'f16', OLLAMA_NUM_PARALLEL: String(limit), OLLAMA_MAX_LOADED_MODELS: '1', OLLAMA_KEEP_ALIVE: '-1' } };
      candidate.import_model = { command: ['ollama', 'create', candidate.api_model, '-f', '/benchmark/Modelfile'],
        timing: 'after_docker_start_before_model_readiness', modelfile, template_verification_required: true };
    } else if (engine === 'llama.cpp') {
      candidate.api_model = `${model.name}-q4km`;
      candidate.runtime = { mode: 'docker', image: IMAGES.llamacpp, container_port: 8080, ready_timeout_ms: 360000,
        mounts: [{ source: ggufDir, target: '/artifacts', read_only: true },
          ...(source.llamacpp_template ? [{ source: source.llamacpp_template, target: '/templates/chat_template.jinja', read_only: true }] : [])],
        args: ['--model', `/artifacts/${model.gguf.file}`, '--host', '0.0.0.0', '--port', '8080', '--alias', candidate.api_model,
          '--parallel', String(limit), '--ctx-size', String(4096 * limit), '--n-gpu-layers', '99', '--flash-attn', 'on',
          ...(source.llamacpp_template ? ['--chat-template-file', '/templates/chat_template.jinja', '--reasoning', 'off'] : ['--jinja'])] };
    } else if (engine === 'vllm') {
      candidate.api_model = `${model.name}-tensors`;
      candidate.runtime = { mode: 'docker', image: IMAGES.vllm, container_port: 8000, ready_timeout_ms: 900000,
        mounts: [{ source: tensorDir, target: '/models/weights', read_only: true }],
        args: ['/models/weights', '--dtype', source.vllm_dtype, '--max-model-len', '4096', '--served-model-name', candidate.api_model,
          '--gpu-memory-utilization', '0.8', '--max-num-seqs', String(limit), '--host', '0.0.0.0', '--port', '8000',
          ...(source.trust_remote_code ? ['--trust-remote-code'] : [])] };
    } else {
      candidate.api_model = `${model.name}-tensors`;
      candidate.runtime = { mode: 'docker', image: IMAGES.sglang, entrypoint: 'python3',
        container_port: 30000, ready_timeout_ms: 900000, mounts: [{ source: tensorDir, target: '/models/weights', read_only: true }],
        args: ['-m', 'sglang.launch_server', '--model-path', '/models/weights', '--dtype', source.sglang_dtype,
          '--context-length', '4096', '--served-model-name', candidate.api_model, '--mem-fraction-static', '0.7',
          '--max-running-requests', String(limit), '--attention-backend', source.sglang_attention_backend || 'triton', '--sampling-backend', 'pytorch',
          '--cuda-graph-max-bs', String(limit), '--host', '0.0.0.0', '--port', '30000',
          ...(source.trust_remote_code ? ['--trust-remote-code'] : [])] };
    }
    return candidate;
  });
}

async function fileFingerprint(file) {
  const hash = createHash('sha256');
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
  return { source: file, bytes: fs.statSync(file).size, sha256: hash.digest('hex') };
}

async function existingOllamaIdle() {
  const api = await jsonRequest('http://127.0.0.1:11434', '/api/ps');
  if (api.ok && Array.isArray(api.json?.models)) return { api, available_for_experiment: api.json.models.length === 0, basis: 'model_list' };
  if (api.status !== undefined) return { api, available_for_experiment: false, basis: 'unknown_live_api' };
  return { api, available_for_experiment: true, basis: 'no_service_listening_on_11434', existing_service_modified: false };
}

async function observeGpu() {
  if (!LINUX) return readLocalGpuObservation();
  const snapshot = await gpuSnapshot();
  return { scope: 'linux_nvidia_smi', known: snapshot.known, gpu: snapshot.gpus?.[0], compute_processes: snapshot.processes };
}

async function recordBaseline() {
  if (!LINUX) {
    const samples = [];
    for (let i = 0; i < 10; i++) { samples.push(await readLocalGpuObservation()); await sleep(500); }
    return baselineEnvelope(samples);
  }
  const snapshot = await gpuSnapshot(), check = evaluateGpuRelease(snapshot, snapshot, { toleranceMiB: 0 });
  if (!check.released) return { known: false, reason: check.reason, snapshot };
  const gpu = snapshot.gpus[0];
  return { known: true, status: 'recorded', scope: 'linux_strict', snapshot, gpu, min_mib: gpu.memory_used_mib, max_mib: gpu.memory_used_mib };
}

async function waitForGpuReturn(baseline, toleranceMiB, signal) {
  if (!LINUX) return waitForVramReturn({ baseline, toleranceMiB, signal });
  const release = await waitForGpuRelease({ before: baseline.snapshot, timeoutMs: 60000, toleranceMiB: 0, stableSamples: 3, signal });
  return { scope: 'linux_strict', status: release.released ? 'observed_returned' : release.status, reason: release.reason,
    checks: release.checks, elapsed_ms: release.elapsed_ms, after: { gpu: release.after?.gpus?.[0], compute_processes: release.after?.processes } };
}

function options(argv) {
  const opt = { targetRps: 8, measureMs: 30000, minRequests: 20, timeoutMs: 120000, seed: 20261002, vramToleranceMiB: 64 };
  const names = { '--model': 'model', '--out': 'out', '--candidate': 'candidate', '--vram-tolerance-mib': 'vramToleranceMiB' };
  for (let i = 0; i < argv.length; i++) {
    if (!names[argv[i]] || !argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error('Use --model exaone|gemma|gemma_awq --out NEW_DIRECTORY_NAME [--candidate ID[,ID...]] [--vram-tolerance-mib 0..64].');
    opt[names[argv[i]]] = argv[++i];
  }
  if (!MODELS[opt.model]) throw new Error('Unknown --model. Use exaone, gemma, gemma_awq, qwen14 or qwen8.');
  if (!opt.out || /[\\/]/.test(opt.out)) throw new Error('--out is a new directory name under local/results/multimodel.');
  opt.out = path.join(RESULTS, opt.out);
  if (fs.existsSync(opt.out)) throw new Error('Output directory already exists.');
  opt.vramToleranceMiB = Number(opt.vramToleranceMiB);
  if (!Number.isInteger(opt.vramToleranceMiB) || opt.vramToleranceMiB < 0 || opt.vramToleranceMiB > 64) throw new Error('Local VRAM tolerance must be an integer in 0..64 MiB.');
  return opt;
}

function comparison(report) {
  const usable = c => c.lifecycle_verified && c.vram_return_observed
    ? c.steps.filter(s => s.status === 'completed' && s.summary?.sample_sufficient) : [];
  const best = c => usable(c).reduce((chosen, step) => !chosen || step.summary.transport_rps > chosen.summary.transport_rps ? step : chosen, null);
  const baseline = report.candidates.find(c => c.id === 'ollama_p4'), reference = baseline ? best(baseline) : null;
  return { baseline_candidate: 'ollama_p4', baseline_best_http_rps: reference?.summary.transport_rps ?? null,
    target_rps: report.target.http_completion_rps,
    rows: report.candidates.map(c => {
      const peak = best(c), achieved = usable(c).filter(s => s.summary.target_reached === true);
      return { candidate_id: c.id, internal_limit: c.candidate.internal_limit, status: c.status, error: c.error ?? null,
        best_http_rps: peak?.summary.transport_rps ?? null, best_users: peak?.users ?? null,
        best_p95_ms_reference: peak?.summary.e2e_p95_ms ?? null,
        ratio_to_ollama: reference && peak && reference.summary.transport_rps > 0 ? peak.summary.transport_rps / reference.summary.transport_rps : null,
        target_8rps_observed: achieved.length > 0, latency_gate_applied: false, quality_gate_applied: false, formal_benchmark_eligible: false };
    }), limitation: 'Single local exploratory windows. Lineage, strict GPU release, quality and sustained arrival capacity are not certified.' };
}

async function main(argv = process.argv.slice(2)) {
  if (!['win32', 'linux'].includes(process.platform)) throw new Error('Supported hosts are local Windows (WDDM) and Linux.');
  const opt = options(argv), model = MODELS[opt.model];
  if (LINUX) opt.vramToleranceMiB = 0;
  const lock = path.join(V2, '.benchmark.lock'), token = randomUUID(), controller = new AbortController();
  const interrupt = () => controller.abort(new Error('user_interrupted'));
  const report = { schema_version: 2, scope: LINUX ? 'cloud_http_capacity_exploration_multimodel' : 'local_http_capacity_exploration_multimodel', mock: false, platform: process.platform,
    started_at: new Date().toISOString(), status: 'running', target: { http_completion_rps: opt.targetRps,
      latency_limit_ms: null, quality_gate_applied: false, success_basis: 'complete_2xx_http_stream_inside_fixed_window' },
    profile: opt, generation: { context: 4096, max_tokens: 512, temperature: 0, thinking: false },
    transport: { streaming: true, http_keep_alive: true, timeout_ms: opt.timeoutMs, retries: 0 },
    strict_gpu_release: LINUX ? 'required_0mib_no_compute_pid_3_samples' : 'unsupported', formal_benchmark_eligible: false, c_slo: null, lambda_slo: null,
    model_family: model.family, model, candidates: [], limitations: [model.limitation,
      LINUX ? 'Engine images are the frozen cloud images; existing host services stay running and are not modified.'
        : 'Windows total VRAM return is observational evidence; per-process GPU memory release is unsupported.',
      'No latency, quality or failure-rate threshold is applied to the HTTP 8 RPS target.',
      '30-second single exploratory windows do not establish sustainable open-loop arrival capacity.',
      'Results for this model family are not a same-condition comparison with the Qwen3-4B runs.'] };
  let locked = false, cleanupFailure = false, outputCreated = false;
  const save = () => { report.comparison = comparison(report); write(path.join(opt.out, 'report.json'), report); };
  try {
    if (fs.existsSync(lock)) throw new Error('Existing benchmark lock; another run is active or needs recovery.');
    fs.mkdirSync(opt.out, { recursive: true }); outputCreated = true;
    const pool = loadCases(path.join(V2, 'data/benchmark_prompts.jsonl'), opt.seed, WORKLOAD_SHA);
    report.workload = { source: pool.source, sha256: pool.sha256, case_count: pool.size, categories: pool.categories,
      seed: opt.seed, ordering: 'balanced_seeded_300_case_cyclic_pool' };
    const configs = prepareCandidates(model, opt.out).filter(c => opt.candidate ? opt.candidate.split(',').includes(c.id) : BASE_IDS.has(c.id));
    if (!configs.length) throw new Error('Unknown candidate ID.');
    report.weight_fingerprints = [];
    // Fingerprint only the weights the selected candidates load.
    const needsGguf = configs.some(c => c.engine === 'ollama' || c.engine === 'llama.cpp');
    const needsTensors = configs.some(c => c.engine === 'vllm' || c.engine === 'sglang');
    for (const file of [...(needsGguf ? [path.join(ASSETS, model.gguf.dir, model.gguf.file)] : []),
      ...(needsTensors ? model.tensors.weights.map(name => path.join(ASSETS, model.tensors.dir, name)) : [])]) report.weight_fingerprints.push(await fileFingerprint(file));
    fs.writeFileSync(lock, JSON.stringify({ token, pid: process.pid, started_at: report.started_at, out: opt.out, scope: report.scope }), { flag: 'wx' }); locked = true;
    process.on('SIGINT', interrupt); process.on('SIGTERM', interrupt);
    report.existing_ollama_before = await existingOllamaIdle();
    if (!report.existing_ollama_before.available_for_experiment) throw new Error('Existing Ollama residency is occupied or unknown.');
    report.strict_initial_snapshot = await gpuSnapshot();
    report.gpu_baseline = await recordBaseline();
    if (!report.gpu_baseline.known) throw new Error(`Unusable fixed GPU envelope: ${report.gpu_baseline.reason}`);
    report.cleanup_policy = { scope: LINUX ? 'linux_strict' : 'local_windows_exploration_only', original_baseline_max_mib: report.gpu_baseline.max_mib,
      vram_tolerance_mib: opt.vramToleranceMiB, fixed_acceptance_upper_mib: report.gpu_baseline.max_mib + opt.vramToleranceMiB,
      consecutive_samples_required: 3, lifecycle_cleanup_required: true };
    save(); emit({ event: 'baseline', model: opt.model, min_mib: report.gpu_baseline.min_mib, max_mib: report.gpu_baseline.max_mib,
      candidate_count: configs.length, out: opt.out });
    for (const candidate of configs) {
      if (controller.signal.aborted) throw new Error('User interrupted');
      validateAppliedArgs(candidate, report.generation);
      const directory = path.join(opt.out, candidate.id); fs.mkdirSync(directory);
      const round = { id: candidate.id, candidate, status: 'preparing', steps: [], strict_gpu_release: report.strict_gpu_release, formal_benchmark_eligible: false };
      report.candidates.push(round); save();
      round.before = await waitForGpuReturn(report.gpu_baseline, opt.vramToleranceMiB, controller.signal);
      if (controller.signal.aborted) throw new Error('User interrupted before launch');
      if (round.before.status !== 'observed_returned') { cleanupFailure = true; throw new Error('Fixed GPU baseline return failed before launch.'); }
      const runtime = new Runtime(candidate, directory, { signal: controller.signal, commandRunner: ownedCommandRunner(candidate, directory) });
      const linked = new AbortController(), forward = () => linked.abort(controller.signal.reason);
      controller.signal.addEventListener('abort', forward, { once: true });
      let client, monitor, heartbeat, aliveTimer, phase = 'loading', checking = false, timeouts = 0, persistenceError;
      try {
        emit({ event: 'starting', candidate: candidate.id, users: candidate.users });
        heartbeat = setInterval(() => emit({ event: 'progress', candidate: candidate.id, phase, container: runtime.container }), 30000);
        round.launch = await runtime.start();
        if (candidate.engine === 'ollama') {
          round.model_show = await jsonRequest(candidate.host, '/api/show', { method: 'POST', body: { model: candidate.api_model } });
          const template = round.model_show.json?.template;
          if (!round.model_show.ok || !template) throw new Error('Actual imported Ollama chat template missing.');
          if (template.replace(/\s+/g, '') === '{{.Prompt}}') throw new Error('Ollama did not derive a chat template from the GGUF; prompt-only fallback is not comparable.');
          if (model.verify_thinking_off) {
            round.thinking_off_render = await jsonRequest(candidate.host, '/api/chat', { method: 'POST', timeoutMs: 120000,
              body: { model: candidate.api_model, messages: pool.items[0].messages, stream: false, think: false,
                _debug_render_only: true, options: { num_ctx: 4096, num_predict: 512 } } });
            const rendered = round.thinking_off_render.json?._debug_info?.rendered_template;
            const suffix = typeof rendered === 'string' ? rendered.slice(rendered.lastIndexOf('<|im_start|>assistant')) : null;
            if (!round.thinking_off_render.ok || suffix === null || !suffix.includes('<|im_start|>assistant')
              || suffix.lastIndexOf('<think>') > suffix.lastIndexOf('</think>')) throw new Error('Actual Ollama thinking-off prompt rendering is unverified or leaves an open think prefix.');
          }
        }
        client = createClient({ engine: candidate.engine, host: candidate.host, model: candidate.api_model,
          transport: { keepAlive: true, timeoutMs: opt.timeoutMs },
          generation: { temperature: 0, numCtx: 4096, maxTokens: 512, thinking: false } });
        phase = 'preload'; round.preload = await warmHttpOnly(client, pool, 2, directory, 'preload', linked.signal);
        if (!round.preload.passed) throw new Error('HTTP-only preload failed.');
        round.loaded_gpu = await observeGpu();
        if (candidate.engine === 'ollama') {
          round.ollama_resident = await jsonRequest(candidate.host, '/api/ps');
          const resident = round.ollama_resident.json?.models?.find(m => (m.name || m.model) === candidate.api_model);
          if (!resident || !(resident.size_vram > 0) || resident.size_vram < resident.size) throw new Error('Ollama model is not fully resident on GPU.');
        }
        monitor = new Monitor(candidate, path.join(directory, 'metrics.jsonl'), { intervalMs: 1000, onError: error => linked.abort(error) }); monitor.start();
        aliveTimer = setInterval(async () => {
          if (checking) return; checking = true;
          try { if (!(await runtime.alive())) linked.abort(new Error('owned_server_exit')); }
          catch (error) { linked.abort(error); } finally { checking = false; }
        }, 1000);
        const send = async (item, opts) => {
          const record = await client.send(item, opts);
          timeouts = record.error_type === 'timeout' ? timeouts + 1 : 0;
          if (timeouts >= 8) linked.abort(new Error('repeated_timeout_safety_stop'));
          return record;
        };
        for (const users of candidate.users) {
          if (linked.signal.aborted) { round.steps.push({ users, status: 'not_measured', reason: linked.signal.reason?.message }); continue; }
          phase = `U${users}_warmup`; emit({ event: 'stage', candidate: candidate.id, users, phase: 'warmup' });
          const warmup = await warmHttpOnly(client, pool, users, directory, `u${users}`, linked.signal);
          if (!warmup.passed) { round.steps.push({ users, status: 'warmup_http_failure', warmup }); linked.abort(new Error('HTTP warmup failed')); continue; }
          phase = `U${users}_measure_and_drain`; monitor.stage = { users };
          const raw = path.join(directory, `u${users}_requests.jsonl`);
          const result = await runClosedLoop({ users, cursor: pool.cursor(users), send, measureMs: opt.measureMs,
            warmupRequestsPerUser: 0, signal: linked.signal, monitorIntervalMs: 1000,
            onRecord: record => { try { append(raw, record); } catch (error) { persistenceError = error; linked.abort(error); } } });
          if (persistenceError) throw persistenceError;
          const summary = result.window.startMs === null ? null : summarizeHttpCapacity(result.records, result.window, { targetRps: opt.targetRps, minRequests: opt.minRequests });
          const tokens = result.records.filter(r => r.transport_ok && r.t_end_rel <= result.window.endMs && Number.isFinite(r.eval_count)).map(r => r.eval_count);
          const step = { users, status: result.aborted ? 'safety_stop' : result.stop_reason, window: result.window,
            warmup, raw_file: raw, elapsed_ms: result.elapsedMs, drain_ms: result.drainMs, peak_inflight: result.maxInFlight,
            in_flight_samples: result.inFlightSamples, summary, output_tokens_avg_in_window: tokens.length ? tokens.reduce((a, b) => a + b, 0) / tokens.length : null };
          round.steps.push(step); write(path.join(directory, `u${users}_step.json`), step); save();
          emit({ event: 'stage_finished', candidate: candidate.id, users, http_rps: summary?.transport_rps,
            target_status: summary?.target_status, p95_ms_reference: summary?.e2e_p95_ms, drain_ms: result.drainMs,
            n_complete: summary?.n_http_complete_in_window, quality_valid_rps_reference: summary?.quality_reference.valid_rps });
        }
        round.status = round.steps.every(s => s.status === 'completed') ? 'completed' : 'incomplete';
      } catch (error) { round.status = controller.signal.aborted ? 'aborted' : 'engine_failed'; round.error = error.message; }
      finally {
        clearInterval(heartbeat); clearInterval(aliveTimer); linked.abort(new Error('candidate_cleanup'));
        const errors = [];
        try { client?.close(); } catch (error) { errors.push(`client: ${error.message}`); }
        try { if (monitor) await monitor.stop(); } catch (error) { errors.push(`monitor: ${error.message}`); }
        try { round.runtime_cleanup = await runtime.stop(); } catch (error) { errors.push(`runtime: ${error.message}`); }
        round.vram_return = await waitForGpuReturn(report.gpu_baseline, opt.vramToleranceMiB);
        round.lifecycle_verified = !errors.length && round.runtime_cleanup?.process_exit_confirmed === true && round.runtime_cleanup?.port_released === true;
        round.vram_return_observed = round.vram_return.status === 'observed_returned'; round.cleanup_errors = errors;
        cleanupFailure = !round.lifecycle_verified || !round.vram_return_observed;
        if (cleanupFailure) { round.measurement_status = round.status; round.status = 'cleanup_unverified'; }
        write(path.join(directory, 'round.json'), round); save(); controller.signal.removeEventListener('abort', forward);
        emit({ event: 'candidate_finished', candidate: candidate.id, status: round.status, lifecycle_verified: round.lifecycle_verified,
          vram_return_observed: round.vram_return_observed, after_mib: round.vram_return.after?.gpu?.memory_used_mib, error: round.error });
      }
      // An engine that fails to load is recorded and the next engine still runs;
      // only unverified cleanup blocks the remaining candidates.
      if (cleanupFailure) throw new Error('Cleanup evidence failed; next engine is blocked.');
    }
    report.status = report.candidates.every(c => c.status === 'completed') ? 'completed_exploration' : 'completed_with_failures';
  } catch (error) { report.status = cleanupFailure ? 'cleanup_unverified' : controller.signal.aborted ? 'aborted' : 'failed'; report.error = error.message; }
  finally {
    process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
    report.finished_at = new Date().toISOString(); report.lock_retained = cleanupFailure;
    if (outputCreated) save();
    if (locked && !cleanupFailure && JSON.parse(fs.readFileSync(lock, 'utf8')).token === token) fs.unlinkSync(lock);
  }
  emit({ event: 'report', status: report.status, error: report.error, report: path.join(opt.out, 'report.json'), comparison: report.comparison });
  if (report.status !== 'completed_exploration') process.exitCode = 1;
  return report;
}
if (require.main === module) main().catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
module.exports = { main, options, comparison, prepareCandidates, MODELS };
