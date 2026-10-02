#!/usr/bin/env node
'use strict';
// The local HTTP completion exploration on one Linux T4. This is not the formal
// latency/quality benchmark, even when its stricter lifecycle checks pass.
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { execFile } = require('node:child_process');
const { isDeepStrictEqual } = require('node:util');
const { Runtime, run, jsonRequest, validateAppliedArgs } = require('../lib/runtime');
const { Monitor, gpuSnapshot } = require('../lib/monitor');
const { createClient } = require('../lib/transport');
const { loadCases } = require('../lib/cases');
const { runClosedLoop } = require('../lib/load_generator');
const { summarizeHttpCapacity } = require('../dev/http_capacity');
const { assertLinuxT4, fixedBaseline, strictRelease, MIN_DRIVER } = require('./gpu_observation');

const ROOT = path.resolve(__dirname, '../..');
const WORKLOAD_SHA = '67ca43b2b901360cefde705a872e52441edc107abb4c19b202f746d923ea4122';
const PROFILE = Object.freeze({ targetRps: 8, measureMs: 30000, minRequests: 20, timeoutMs: 120000, seed: 20261002 });
const CONFIG_PROFILE = Object.freeze({ target_rps: 8, measure_ms: 30000, min_requests: 20, timeout_ms: 120000, seed: 20261002 });
const TRANSPORT = Object.freeze({ streaming: true, keep_alive: true, timeout_ms: 120000, retries: 0 });
const GENERATION = Object.freeze({ context: 4096, max_tokens: 512, temperature: 0, thinking: false });
const DEFINITIONS = Object.freeze({
  ollama_p4: ['ollama', 4, [1, 4, 8, 16, 32]],
  llamacpp_p4: ['llama.cpp', 4, [4, 8, 16, 32]],
  vllm_s8: ['vllm', 8, [4, 8, 16, 32]],
  sglang_r8: ['sglang', 8, [4, 8, 16, 32]],
  vllm_s32: ['vllm', 32, [16, 32, 64]],
  sglang_r32: ['sglang', 32, [16, 32, 64]],
});
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const append = (file, value) => fs.appendFileSync(file, JSON.stringify(value) + '\n');
const emit = value => process.stdout.write(JSON.stringify(value) + '\n');

function options(argv) {
  const result = { dryRun: false };
  const names = { '--config': 'configPath', '--manifest': 'manifestPath', '--out': 'out', '--candidate': 'candidate' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dry-run') { if (result.dryRun) throw new Error('Duplicate --dry-run.'); result.dryRun = true; continue; }
    const key = names[argv[i]];
    if (!key || result[key] !== undefined || !argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error('Use --config FILE --manifest FILE [--out NEW_DIRECTORY] [--candidate ID] [--dry-run].');
    result[key] = argv[++i];
  }
  if (!result.configPath || !result.manifestPath) throw new Error('A prepared candidate config and frozen manifest are required.');
  result.configPath = path.resolve(result.configPath); result.manifestPath = path.resolve(result.manifestPath);
  result.out = path.resolve(result.out || path.join(ROOT, 'results', `cloud_http_8rps_${new Date().toISOString().replace(/[:.]/g, '-')}`));
  const base = path.join(ROOT, 'results'), relative = path.relative(base, result.out);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || fs.existsSync(result.out)) throw new Error('Use a new directory inside load_test_v2/results.');
  return result;
}

function validatePlan(bundle, candidateId, { requireMountsPresent = false } = {}) {
  const config = bundle?.config, candidates = bundle?.candidates || config?.candidates;
  if (config?.schema_version !== 1 || config.scope !== 't4_http_capacity_exploration' || !Array.isArray(candidates) || !candidates.length) throw new Error('Frozen bundle must contain prepared candidates.');
  if (!isDeepStrictEqual(config.profile, CONFIG_PROFILE) || !isDeepStrictEqual(config.generation, GENERATION)
    || !isDeepStrictEqual(config.transport, TRANSPORT)) throw new Error('Frozen HTTP profile/generation/transport differs from the local exploration.');
  const workload = bundle.workload || config.workload;
  if (!workload || typeof workload.path !== 'string' || !path.isAbsolute(workload.path)
    || workload.sha256 !== WORKLOAD_SHA || workload.case_count !== 300) throw new Error('The frozen 300-case workload/hash is required.');
  const seen = new Set();
  for (const candidate of candidates) {
    const expected = DEFINITIONS[candidate.id];
    if (!expected || seen.has(candidate.id) || candidate.engine !== expected[0] || candidate.internal_limit !== expected[1]
      || !isDeepStrictEqual(candidate.users, expected[2]) || candidate.model_family !== 'Qwen/Qwen3-4B') throw new Error(`Unexpected engine/U/P/model profile: ${candidate.id}`);
    seen.add(candidate.id);
    if (candidate.runtime?.mode !== 'docker' || typeof candidate.runtime.image !== 'string' || !candidate.runtime.image.trim()
      || /\s/.test(candidate.runtime.image)) throw new Error(`A locked Docker image reference is required: ${candidate.id}`);
    if (!Array.isArray(candidate.runtime.args) || candidate.runtime.args.some(arg => typeof arg !== 'string')) throw new Error('Docker args must be a string array.');
    const host = new URL(candidate.host);
    if (host.protocol !== 'http:' || host.hostname !== '127.0.0.1' || !host.port || host.username || host.password || host.pathname !== '/' || host.search || host.hash) throw new Error('Candidate endpoints must be plain loopback HTTP.');
    if (!Number.isInteger(candidate.runtime.container_port) || candidate.runtime.container_port < 1 || candidate.runtime.container_port > 65535) throw new Error('A valid container port is required.');
    if (!Number.isInteger(candidate.runtime.ready_timeout_ms) || candidate.runtime.ready_timeout_ms < 1 || candidate.runtime.ready_timeout_ms > 600000) throw new Error('A bounded model readiness timeout is required.');
    if ((candidate.runtime.mounts || []).some(mount => !path.isAbsolute(mount.source) || !mount.target?.startsWith('/')
      || mount.source.includes(',') || mount.target.includes(',') || mount.read_only !== true
      || requireMountsPresent && !fs.existsSync(mount.source))) throw new Error('All prepared artifact mounts must be read-only, absolute and present before execution.');
    if (candidate.runtime.env?.HF_HUB_OFFLINE !== '1' || candidate.runtime.env?.TRANSFORMERS_OFFLINE !== '1') throw new Error('The frozen runtime must disable model downloads.');
    if (candidate.engine === 'ollama' && (typeof candidate.import_model?.from !== 'string'
      || !candidate.import_model.from.startsWith('/') || /[\r\n]/.test(candidate.import_model.from))) throw new Error('A frozen Ollama GGUF import source is required.');
    validateAppliedArgs(candidate, GENERATION);
  }
  const selected = candidates.filter(candidate => !candidateId || candidate.id === candidateId);
  if (!selected.length) throw new Error('Unknown candidate ID.');
  return { config, candidates: selected, workload, manifest: bundle.manifest };
}

function freezeRuntimeImages(candidates, verification) {
  if (verification?.verified !== true || !Array.isArray(verification.images)) throw new Error('The frozen Docker images are unverified.');
  return candidates.map(original => {
    const image = verification.images.filter(entry => entry.reference === original.runtime.image);
    if (image.length !== 1 || image[0].verified !== true || !/^sha256:[a-f0-9]{64}$/.test(image[0].image_id || '')) throw new Error(`Verified image ID missing or ambiguous: ${original.id}`);
    const candidate = structuredClone(original); candidate.runtime.image_reference = candidate.runtime.image;
    candidate.runtime.image = image[0].image_id;
    return candidate;
  });
}

function prepareOllamaImport(candidate, directory) {
  if (candidate.engine !== 'ollama') return;
  const from = candidate.import_model?.from;
  if (typeof from !== 'string' || !from.startsWith('/') || /[\r\n]/.test(from)) throw new Error('A frozen Ollama GGUF import source is required.');
  const modelfile = path.join(directory, 'Modelfile');
  fs.writeFileSync(modelfile, `FROM ${from}\n`, { flag: 'wx' });
  const target = '/benchmark/Modelfile';
  if ((candidate.runtime.mounts || []).some(mount => mount.target === target)) throw new Error('Duplicate generated Ollama Modelfile mount.');
  candidate.runtime.mounts = [...(candidate.runtime.mounts || []), { source: modelfile, target, read_only: true }];
  candidate.import_model = { ...candidate.import_model, modelfile,
    command: ['ollama', 'create', candidate.api_model, '-f', target], timing: 'after_owned_docker_start_before_readiness' };
}

function comparison(report) {
  const usable = candidate => candidate.lifecycle_verified && candidate.gpu_released
    ? candidate.steps.filter(step => step.status === 'completed' && step.summary?.sample_sufficient) : [];
  const best = candidate => usable(candidate).reduce((chosen, step) => !chosen || step.summary.transport_rps > chosen.summary.transport_rps ? step : chosen, null);
  const baseline = report.candidates.find(candidate => candidate.id === 'ollama_p4'), reference = baseline && best(baseline);
  return { target_rps: PROFILE.targetRps, baseline_candidate: 'ollama_p4', baseline_best_http_rps: reference?.summary.transport_rps ?? null,
    rows: report.candidates.map(candidate => {
      const peak = best(candidate), reached = usable(candidate).filter(step => step.summary.target_reached === true);
      return { candidate_id: candidate.id, internal_limit: candidate.candidate.internal_limit,
        best_http_rps: peak?.summary.transport_rps ?? null, best_users: peak?.users ?? null,
        ratio_to_ollama: reference?.summary.transport_rps > 0 && peak ? peak.summary.transport_rps / reference.summary.transport_rps : null,
        target_8rps_observed: reached.length > 0, minimum_tested_users_at_target: reached.length ? Math.min(...reached.map(step => step.users)) : null,
        latency_gate_applied: false, quality_gate_applied: false, formal_benchmark_eligible: false };
    }), limitation: 'Single 30-second closed-loop exploration; sustainable arrival capacity and quality/SLO capacity are not certified.' };
}

function abortableRun(command, args, { timeoutMs = 10000, env } = {}, signal) {
  return new Promise(resolve => execFile(command, args, { timeout: timeoutMs, signal, windowsHide: true,
    maxBuffer: 8 * 1024 * 1024, env: { ...process.env, ...env } }, (error, stdout, stderr) => {
    resolve({ code: error ? (typeof error.code === 'number' ? error.code : -1) : 0,
      stdout: stdout || '', stderr: stderr || '', error: error?.message });
  }));
}

function ownedCommandRunner(candidate, directory, gpuUuid, { commandRunner = run, request = jsonRequest, pause = sleep, signal } = {}) {
  if (!/^sha256:[a-f0-9]{64}$/.test(candidate.runtime.image || '')) throw new Error('Only an immutable verified image ID may launch.');
  const execute = (command, args, opts) => {
    // Interrupt launch/import clients promptly, leaving cleanup commands usable
    // after cancellation. The daemon may already have created an owned container.
    const cancellable = ['create', 'start', 'exec'].includes(args[0]);
    return cancellable && signal && commandRunner === run
      ? abortableRun(command, args, opts, signal) : commandRunner(command, args, opts);
  };
  return async (command, args, opts) => {
    if (command !== 'docker') throw new Error('The cloud runtime only executes owned Docker commands.');
    if (args[0] === 'create') {
      args = args.slice(); const index = args.indexOf('--gpus');
      if (index < 0 || args[index + 1] !== 'device=0') throw new Error('Unexpected Runtime GPU selector.');
      args[index + 1] = `device=${gpuUuid}`;
      if (!args.includes(candidate.runtime.image) || !args.includes('never') || !args.includes('--label')) throw new Error('The owned runtime must use its locked image without pulling.');
    }
    const response = await execute(command, args, opts);
    if (args[0] === 'start' && response.code === 0 && candidate.import_model) {
      const deadline = Date.now() + 60000; let ready = false;
      while (Date.now() < deadline) {
        if (signal?.aborted) return { code: -1, stdout: '', stderr: 'Owned Ollama import interrupted.' };
        if ((await request(candidate.host, '/api/tags')).ok) { ready = true; break; }
        await pause(200);
      }
      if (!ready) return { code: 1, stdout: '', stderr: 'Owned Ollama API did not become ready for import.' };
      const imported = await execute('docker', ['exec', args[1], ...candidate.import_model.command], { timeoutMs: 300000 });
      write(path.join(directory, 'model_import.json'), { scope: 'owned_ephemeral_container_only', command: candidate.import_model.command, result: imported });
      if (imported.code !== 0) return imported;
    }
    return response;
  };
}

async function warmHttpOnly(client, pool, users, directory, label, signal) {
  const cursor = pool.cursor();
  const records = await Promise.all(Array.from({ length: users }, async (_, user) => {
    const record = await client.send(cursor.next(), { signal });
    append(path.join(directory, `${label}_warmup.jsonl`), { ...record, user, phase: 'warmup', warmup: true,
      admission_criterion: 'complete_2xx_http_stream', quality_gate_applied: false });
    return record;
  }));
  const completed = record => record.transport_ok === true && Number.isInteger(record.http_status) && record.http_status >= 200 && record.http_status < 300;
  return { attempted: users, completed: records.filter(completed).length, reused: records.filter(record => record.socket_reused).length,
    quality_valid_reference: records.filter(record => record.valid).length, passed: records.length === users && records.every(completed) };
}

async function verifyOllama(candidate, pool, request) {
  const model_show = await request(candidate.host, '/api/show', { method: 'POST', body: { model: candidate.api_model } });
  if (!model_show.ok || !model_show.json?.template || /Thinking.?2507/i.test(model_show.json.model_info?.['general.name'] || '')) throw new Error('Actual classic Ollama model/template is unverified.');
  const thinking_off_render = await request(candidate.host, '/api/chat', { method: 'POST', timeoutMs: PROFILE.timeoutMs,
    body: { model: candidate.api_model, messages: pool.items[0].messages, stream: false, think: false, _debug_render_only: true,
      options: { num_ctx: GENERATION.context, num_predict: GENERATION.max_tokens } } });
  const rendered = thinking_off_render.json?._debug_info?.rendered_template;
  const suffix = typeof rendered === 'string' ? rendered.slice(rendered.lastIndexOf('<|im_start|>assistant')) : null;
  if (!thinking_off_render.ok || suffix === null || !suffix.includes('<|im_start|>assistant') || suffix.lastIndexOf('<think>') > suffix.lastIndexOf('</think>')) throw new Error('Actual Ollama thinking-off prompt rendering is unverified.');
  return { model_show, thinking_off_render };
}

async function main(argv = process.argv.slice(2), dependencies = {}) {
  const opt = options(argv);
  const platform = dependencies.platform || process.platform;
  if (!opt.dryRun && platform !== 'linux') throw new Error('Real cloud HTTP exploration requires Linux.');
  const bundleLibrary = dependencies.bundleLibrary || require('./bundle');
  const bundle = await bundleLibrary.validateFrozenBundle({ configPath: opt.configPath, manifestPath: opt.manifestPath, verifyModels: !opt.dryRun });
  const plan = validatePlan(bundle, opt.candidate, { requireMountsPresent: !opt.dryRun });
  const pool = (dependencies.loadCases || loadCases)(plan.workload.path, PROFILE.seed, WORKLOAD_SHA);
  if (pool.size !== 300 || pool.sha256 !== WORKLOAD_SHA) throw new Error('The fixed 300-case workload is unverified.');
  const output = dependencies.emit || emit;
  if (opt.dryRun) {
    const result = { status: 'dry_run_validated', scope: 'cloud_http_capacity_exploration', dry_run: true,
      profile: PROFILE, generation: GENERATION, candidates: plan.candidates.map(candidate => ({ id: candidate.id,
        image: candidate.runtime.image, users: candidate.users, internal_limit: candidate.internal_limit })),
      workload: { sha256: pool.sha256, case_count: pool.size }, docker_gpu_http_calls: 0,
      external_call_count_scope: 'this_node_process_only; the_optional_launcher_starts_its_frozen_wrapper', files_written: 0,
      model_readiness: { present: bundle.model_readiness?.present ?? null, sha256_verified: false,
        status: 'full_model_hashes_required_at_real_preflight' },
      formal_benchmark_eligible: false };
    output(result); return result;
  }
  const commandRunner = dependencies.commandRunner || run, request = dependencies.request || jsonRequest;
  const snapshot = dependencies.snapshot || (() => gpuSnapshot({ commandRunner }));
  const getBaseline = dependencies.fixedBaseline || fixedBaseline, release = dependencies.strictRelease || strictRelease;
  const lock = dependencies.lockPath || path.join(ROOT, '.benchmark.lock'), token = randomUUID(), controller = new AbortController();
  const interrupt = () => controller.abort(new Error('user_interrupted'));
  const report = { schema_version: 2, scope: 'cloud_http_capacity_exploration', mock: dependencies.mock === true,
    started_at: new Date().toISOString(), status: 'running', config: opt.configPath, frozen_manifest: opt.manifestPath,
    profile: PROFILE, generation: GENERATION, transport: { streaming: true, http_keep_alive: true, timeout_ms: PROFILE.timeoutMs, retries: 0 },
    target: { http_completion_rps: PROFILE.targetRps, latency_limit_ms: null, quality_gate_applied: false,
      success_basis: 'complete_2xx_http_stream_inside_fixed_window' },
    workload: { source: pool.source, sha256: pool.sha256, case_count: pool.size, categories: pool.categories,
      seed: PROFILE.seed, ordering: 'balanced_seeded_300_case_cyclic_pool' },
    model_family: 'Qwen/Qwen3-4B', strict_gpu_release: 'required', formal_benchmark_eligible: false,
    c_slo: null, lambda_slo: null, candidates: [], limitations: [
      'No latency, quality or failure-rate threshold is applied to the HTTP 8 RPS target.',
      '30-second single exploratory windows do not establish sustainable open-loop arrival capacity.',
      'GGUF/AWQ source conversion equivalence is not certified by Docker image or file fingerprints.' ] };
  let locked = false, cleanupFailure = false, outputCreated = false;
  const save = () => { report.comparison = comparison(report); write(path.join(opt.out, 'report.json'), report); };
  try {
    fs.writeFileSync(lock, JSON.stringify({ token, pid: process.pid, started_at: report.started_at, out: opt.out, scope: report.scope }), { flag: 'wx' }); locked = true;
    fs.mkdirSync(opt.out, { recursive: true }); outputCreated = true;
    process.on('SIGINT', interrupt); process.on('SIGTERM', interrupt);
    report.docker_images = await bundleLibrary.verifyDockerImages(bundle, { commandRunner });
    const candidates = freezeRuntimeImages(plan.candidates, report.docker_images);
    const initial = await getBaseline({ platform, snapshot, signal: controller.signal });
    assertLinuxT4(initial.baseline, { platform }); report.gpu_baseline = initial.baseline; report.gpu_identity = initial.identity;
    report.initial_baseline_verification = initial.verification;
    report.cleanup_policy = { fixed_baseline_mib: initial.baseline.gpus[0].memory_used_mib, tolerance_mib: 0,
      gpu_uuid: initial.baseline.gpus[0].uuid, consecutive_samples_required: 3, compute_processes_required: 0,
      lifecycle_cleanup_required: true };
    report.hardware_policy = { platform: 'linux', gpu_count: 1, gpu_model: 'NVIDIA T4', minimum_driver_version: MIN_DRIVER };
    save(); output({ event: 'baseline', ...report.gpu_identity, candidate_count: plan.candidates.length });
    for (const original of candidates) {
      if (controller.signal.aborted) throw new Error('User interrupted');
      const candidate = structuredClone(original), directory = path.join(opt.out, candidate.id);
      fs.mkdirSync(directory);
      prepareOllamaImport(candidate, directory);
      const round = { id: candidate.id, candidate, status: 'preparing', steps: [], formal_benchmark_eligible: false };
      report.candidates.push(round); save();
      round.before = await release(report.gpu_baseline, { snapshot, signal: controller.signal });
      if (!round.before.released) { cleanupFailure = true; throw new Error('Fixed GPU baseline return failed before launch.'); }
      if (controller.signal.aborted) throw new Error('User interrupted before launch');
      const linked = new AbortController(), forward = () => linked.abort(controller.signal.reason);
      controller.signal.addEventListener('abort', forward, { once: true });
      const runtime = dependencies.createRuntime ? dependencies.createRuntime(candidate, directory, linked.signal)
        : new Runtime(candidate, directory, { signal: linked.signal,
          commandRunner: ownedCommandRunner(candidate, directory, report.gpu_identity.gpu_uuid, { commandRunner, request, signal: linked.signal }) });
      let client, monitor, heartbeat, aliveTimer, checking = false, phase = 'loading', timeouts = 0, persistenceError;
      try {
        output({ event: 'starting', candidate: candidate.id, users: candidate.users });
        heartbeat = setInterval(() => output({ event: 'progress', candidate: candidate.id, phase, container: runtime.container }), 20000);
        round.launch = await runtime.start();
        if (candidate.engine === 'ollama') Object.assign(round, await verifyOllama(candidate, pool, request));
        const clientOptions = { engine: candidate.engine, host: candidate.host, model: candidate.api_model,
          transport: { keepAlive: true, timeoutMs: PROFILE.timeoutMs },
          generation: { temperature: 0, numCtx: GENERATION.context, maxTokens: GENERATION.max_tokens, thinking: false } };
        client = (dependencies.createClient || createClient)(clientOptions);
        phase = 'preload'; round.preload = await warmHttpOnly(client, pool, 2, directory, 'preload', linked.signal);
        if (!round.preload.passed) throw new Error('HTTP-only preload failed.');
        round.loaded_gpu = await snapshot();
        if (candidate.engine === 'ollama') {
          round.ollama_resident = await request(candidate.host, '/api/ps');
          const model = round.ollama_resident.json?.models?.find(item => (item.name || item.model) === candidate.api_model);
          if (!model || !(model.size_vram > 0) || model.size_vram < model.size) throw new Error('Ollama model is not fully resident on GPU.');
        }
        monitor = dependencies.createMonitor ? dependencies.createMonitor(candidate, path.join(directory, 'metrics.jsonl'), error => linked.abort(error))
          : new Monitor(candidate, path.join(directory, 'metrics.jsonl'), { intervalMs: 1000, onError: error => linked.abort(error) });
        monitor.start();
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
          phase = `U${users}_warmup`; output({ event: 'stage', candidate: candidate.id, users, phase: 'warmup' });
          const warmup = await warmHttpOnly(client, pool, users, directory, `u${users}`, linked.signal);
          if (!warmup.passed) { round.steps.push({ users, status: 'warmup_http_failure', warmup }); linked.abort(new Error('HTTP warmup failed')); continue; }
          phase = `U${users}_measure_and_drain`; monitor.stage = { users };
          const raw = path.join(directory, `u${users}_requests.jsonl`);
          const result = await (dependencies.runClosedLoop || runClosedLoop)({ users, cursor: pool.cursor(users), send,
            measureMs: PROFILE.measureMs, warmupRequestsPerUser: 0, signal: linked.signal, monitorIntervalMs: 1000,
            onRecord: record => { try { append(raw, record); } catch (error) { persistenceError = error; linked.abort(error); } } });
          if (persistenceError) throw persistenceError;
          const summary = result.window.startMs === null ? null : summarizeHttpCapacity(result.records, result.window,
            { targetRps: PROFILE.targetRps, minRequests: PROFILE.minRequests });
          const tokens = result.records.filter(record => record.transport_ok && record.t_end_rel <= result.window.endMs && Number.isFinite(record.eval_count)).map(record => record.eval_count);
          const step = { users, status: result.aborted ? 'safety_stop' : result.stop_reason, window: result.window,
            warmup, raw_file: raw, elapsed_ms: result.elapsedMs, drain_ms: result.drainMs, peak_inflight: result.maxInFlight,
            in_flight_samples: result.inFlightSamples, summary,
            output_tokens_avg_in_window: tokens.length ? tokens.reduce((a, b) => a + b, 0) / tokens.length : null };
          round.steps.push(step); write(path.join(directory, `u${users}_step.json`), step); save();
          output({ event: 'stage_finished', candidate: candidate.id, users, http_rps: summary?.transport_rps,
            target_status: summary?.target_status, p95_ms_reference: summary?.e2e_p95_ms, drain_ms: result.drainMs,
            n_complete: summary?.n_http_complete_in_window, quality_valid_rps_reference: summary?.quality_reference.valid_rps });
        }
        round.status = round.steps.every(step => step.status === 'completed') ? 'completed' : 'incomplete';
      } catch (error) { round.status = controller.signal.aborted ? 'aborted' : 'engine_failed'; round.error = error.message; }
      finally {
        clearInterval(heartbeat); clearInterval(aliveTimer); linked.abort(new Error('candidate_cleanup'));
        const errors = [];
        try { client?.close(); } catch (error) { errors.push(`client: ${error.message}`); }
        try { if (monitor) await monitor.stop(); } catch (error) { errors.push(`monitor: ${error.message}`); }
        try { round.runtime_cleanup = await runtime.stop(); } catch (error) { errors.push(`runtime: ${error.message}`); }
        try { round.gpu_release = await release(report.gpu_baseline, { snapshot }); }
        catch (error) { round.gpu_release = { released: false, reason: error.message }; }
        round.lifecycle_verified = !errors.length && round.runtime_cleanup?.process_exit_confirmed === true && round.runtime_cleanup?.port_released === true;
        round.gpu_released = round.gpu_release.released === true; round.cleanup_errors = errors;
        cleanupFailure = !round.lifecycle_verified || !round.gpu_released;
        if (cleanupFailure) { round.measurement_status = round.status; round.status = 'cleanup_unverified'; }
        write(path.join(directory, 'round.json'), round); save(); controller.signal.removeEventListener('abort', forward);
        output({ event: 'candidate_finished', candidate: candidate.id, status: round.status,
          lifecycle_verified: round.lifecycle_verified, gpu_released: round.gpu_released, error: round.error });
      }
      if (cleanupFailure) throw new Error('Cleanup verification failed; the next engine is blocked.');
      if (candidate.id === 'ollama_p4' && round.status === 'engine_failed') throw new Error('Ollama baseline preparation failed.');
    }
    report.status = report.candidates.every(candidate => candidate.status === 'completed') ? 'completed_exploration' : 'completed_with_failures';
  } catch (error) { report.status = cleanupFailure ? 'cleanup_unverified' : controller.signal.aborted ? 'aborted' : 'failed'; report.error = error.message; }
  finally {
    process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
    report.finished_at = new Date().toISOString(); report.lock_retained = locked && cleanupFailure;
    if (outputCreated) save();
    if (locked && !cleanupFailure && JSON.parse(fs.readFileSync(lock, 'utf8')).token === token) fs.unlinkSync(lock);
  }
  output({ event: 'report', status: report.status, report: outputCreated ? path.join(opt.out, 'report.json') : null, comparison: report.comparison });
  if (report.status !== 'completed_exploration' && !dependencies.mock) process.exitCode = 1;
  return report;
}

if (require.main === module) main().catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
module.exports = { main, options, validatePlan, comparison, ownedCommandRunner, warmHttpOnly, verifyOllama,
  freezeRuntimeImages, prepareOllamaImport, abortableRun, PROFILE, CONFIG_PROFILE, TRANSPORT, GENERATION, DEFINITIONS, WORKLOAD_SHA };
