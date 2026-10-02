#!/usr/bin/env node
'use strict';
// Explicit exploratory profile: HTTP completion target, no latency/quality gate.
// Windows observations cannot replace the strict benchmark's GPU cleanup gate.
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { randomUUID, createHash } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const { Runtime, run, jsonRequest, validateAppliedArgs } = require('../lib/runtime');
const { Monitor, gpuSnapshot } = require('../lib/monitor');
const { createClient } = require('../lib/transport');
const { loadCases } = require('../lib/cases');
const { runClosedLoop } = require('../lib/load_generator');
const { readLocalGpuObservation, baselineEnvelope, waitForVramReturn } = require('./local_gpu_observation');
const { summarizeHttpCapacity } = require('./http_capacity');
const { prepareCandidates } = require('./local_http_candidates');
const { HF_CACHE } = require('./model_assets');
const ROOT = path.resolve(__dirname, '../..');
const WORKLOAD_SHA = '67ca43b2b901360cefde705a872e52441edc107abb4c19b202f746d923ea4122';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const append = (file, value) => fs.appendFileSync(file, JSON.stringify(value) + '\n');
const emit = value => process.stdout.write(JSON.stringify(value) + '\n');
async function fileFingerprint(file) {
  const hash = createHash('sha256');
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
  return { source: file, bytes: fs.statSync(file).size, sha256: hash.digest('hex') };
}
async function inspectExistingOllama() {
  const api = await jsonRequest('http://127.0.0.1:11434', '/api/ps');
  if (api.ok && Array.isArray(api.json?.models)) return { api, available_for_experiment: api.json.models.length === 0, basis: 'model_list' };
  if (api.status !== undefined) return { api, available_for_experiment: false, basis: 'unknown_live_api' };
  const container = await run('docker', ['inspect', '--format', '{{json .State}}', 'ubot-be-ollama-1']);
  let state; try { state = JSON.parse(container.stdout); } catch { state = null; }
  const absent = container.code !== 0 && /No such (?:object|container)/i.test(container.stderr || '');
  const stopped = container.code === 0 && state?.Running === false && state?.Pid === 0;
  let portFree = false;
  if (stopped || absent) portFree = await new Promise(resolve => {
    const server = net.createServer(); server.once('error', () => resolve(false));
    server.listen(11434, '127.0.0.1', () => server.close(() => resolve(true)));
  });
  return { api, container, port_free: portFree, available_for_experiment: (stopped || absent) && portFree,
    basis: 'existing_container_stopped_or_absent_and_port_free', existing_service_modified: false };
}

function options(argv) {
  const opt = { targetRps: 8, measureMs: 30000, minRequests: 20, timeoutMs: 120000, seed: 20261002, vramToleranceMiB: 0 };
  const names = { '--out': 'out', '--candidate': 'candidate', '--resume-report': 'resumeReport', '--vram-tolerance-mib': 'vramToleranceMiB' };
  for (let i = 0; i < argv.length; i++) {
    if (!names[argv[i]] || !argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error('Use --out NEW_DIRECTORY [--candidate ID] [--resume-report FILE] [--vram-tolerance-mib 0..64].');
    opt[names[argv[i]]] = argv[++i];
  }
  const base = path.join(ROOT, 'results');
  opt.out = path.resolve(opt.out || path.join(base, `http_8rps_${new Date().toISOString().replace(/[:.]/g, '-')}`));
  const relative = path.relative(base, opt.out);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || fs.existsSync(opt.out)) throw new Error('Use a new directory within load_test_v2/results.');
  opt.vramToleranceMiB = Number(opt.vramToleranceMiB);
  if (!Number.isInteger(opt.vramToleranceMiB) || opt.vramToleranceMiB < 0 || opt.vramToleranceMiB > 64) throw new Error('Local VRAM tolerance must be an integer in 0..64 MiB.');
  if (opt.resumeReport) {
    opt.resumeReport = path.resolve(opt.resumeReport);
    const sourceRelative = path.relative(base, opt.resumeReport);
    if (sourceRelative.startsWith('..') || path.isAbsolute(sourceRelative) || path.basename(opt.resumeReport) !== 'report.json') throw new Error('Resume report must be a report.json within load_test_v2/results.');
  }
  return opt;
}

function validateResumeSource(source, expected) {
  if (source?.scope !== 'local_http_capacity_exploration' || source.mock !== false
    || source.formal_benchmark_eligible !== false || source.gpu_baseline?.known !== true
    || source.gpu_baseline.status !== 'recorded') throw new Error('Resume source is not a verified local exploratory report.');
  for (const field of ['target', 'generation', 'transport', 'model_family', 'workload']) {
    if (!isDeepStrictEqual(source[field], expected[field])) throw new Error(`Resume ${field} differs from the current experiment.`);
  }
  for (const field of ['targetRps', 'measureMs', 'minRequests', 'timeoutMs', 'seed']) {
    if (source.profile?.[field] !== expected.profile[field]) throw new Error(`Resume profile ${field} differs.`);
  }
  const fingerprints = value => value?.map(({ bytes, sha256 }) => ({ bytes, sha256 }));
  if (!isDeepStrictEqual(fingerprints(source.weight_fingerprints), fingerprints(expected.weight_fingerprints))) throw new Error('Resume weight hashes differ.');
  if (source.candidates?.length !== 1) throw new Error('Resume expects only the measured Ollama baseline.');
  const baseline = source.candidates[0];
  if (baseline.id !== 'ollama_p4' || baseline.measurement_status !== 'completed' || baseline.status !== 'cleanup_unverified'
    || baseline.lifecycle_verified !== true || baseline.runtime_cleanup?.process_exit_confirmed !== true
    || baseline.runtime_cleanup?.port_released !== true || !baseline.steps?.length
    || baseline.steps.some(s => s.status !== 'completed')) throw new Error('Resume baseline measurement or process cleanup is unverified.');
  return baseline;
}

function recoveredBaseline(original, recovery) {
  if (recovery?.status !== 'recovered' || recovery.vram_return?.status !== 'observed_returned') throw new Error('Fresh approved recovery evidence is required.');
  const baseline = structuredClone(original);
  baseline.original_cleanup_failure = { status: baseline.status, vram_return_observed: baseline.vram_return_observed,
    vram_return: baseline.vram_return, cleanup_errors: baseline.cleanup_errors };
  baseline.approved_recovery = recovery;
  baseline.status = baseline.measurement_status;
  baseline.vram_return = recovery.vram_return; baseline.vram_return_observed = true;
  baseline.measurements_reused_without_modification = true;
  return baseline;
}

function ownedCommandRunner(candidate, directory) {
  return async (command, args, opts) => {
    const response = await run(command, args, opts);
    if (command === 'docker' && args[0] === 'start' && response.code === 0 && candidate.import_model) {
      const deadline = Date.now() + 60000;
      let ready = false;
      while (Date.now() < deadline) {
        if ((await jsonRequest(candidate.host, '/api/tags')).ok) { ready = true; break; }
        await sleep(200);
      }
      if (!ready) return { code: 1, stdout: '', stderr: 'Owned Ollama API did not become ready for import.' };
      const imported = await run('docker', ['exec', args[1], ...candidate.import_model.command], { timeoutMs: 300000 });
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
  const completed = r => r.transport_ok === true && Number.isInteger(r.http_status) && r.http_status >= 200 && r.http_status < 300;
  return { attempted: users, completed: records.filter(completed).length,
    reused: records.filter(r => r.socket_reused).length, quality_valid_reference: records.filter(r => r.valid).length,
    passed: records.length === users && records.every(completed) };
}

function comparison(report) {
  const baseline = report.candidates.find(c => c.id === 'ollama_p4');
  const usable = c => c.lifecycle_verified && c.vram_return_observed
    ? c.steps.filter(s => s.status === 'completed' && s.summary?.sample_sufficient) : [];
  const best = c => usable(c).reduce((chosen, step) => !chosen || step.summary.transport_rps > chosen.summary.transport_rps ? step : chosen, null);
  const reference = baseline ? best(baseline) : null;
  return { baseline_candidate: 'ollama_p4', baseline_best_http_rps: reference?.summary.transport_rps ?? null,
    target_rps: report.target.http_completion_rps,
    rows: report.candidates.map(c => {
      const peak = best(c), achieved = usable(c).filter(s => s.summary.target_reached === true);
      return { candidate_id: c.id, internal_limit: c.candidate.internal_limit,
        best_http_rps: peak?.summary.transport_rps ?? null, best_users: peak?.users ?? null,
        ratio_to_ollama: reference && peak && reference.summary.transport_rps > 0 ? peak.summary.transport_rps / reference.summary.transport_rps : null,
        target_8rps_observed: achieved.length > 0, minimum_tested_users_at_target: achieved.length ? Math.min(...achieved.map(s => s.users)) : null,
        latency_gate_applied: false, quality_gate_applied: false, formal_benchmark_eligible: false };
    }), limitation: 'Single local exploratory windows. Exact source commit equivalence, strict GPU release, quality and sustained arrival capacity are not certified.' };
}

async function main(argv = process.argv.slice(2)) {
  if (process.platform !== 'win32') throw new Error('This local diagnostic profile is scoped to Windows WDDM.');
  const opt = options(argv), lock = path.join(ROOT, '.benchmark.lock'), token = randomUUID(), controller = new AbortController();
  const interrupt = () => controller.abort(new Error('user_interrupted'));
  const report = { schema_version: 2, scope: 'local_http_capacity_exploration', mock: false,
    started_at: new Date().toISOString(), status: 'running', target: { http_completion_rps: opt.targetRps,
      latency_limit_ms: null, quality_gate_applied: false, success_basis: 'complete_2xx_http_stream_inside_fixed_window' },
    profile: opt, generation: { context: 4096, max_tokens: 512, temperature: 0, thinking: false },
    transport: { streaming: true, http_keep_alive: true, timeout_ms: opt.timeoutMs, retries: 0 },
    strict_gpu_release: 'unsupported', formal_benchmark_eligible: false, c_slo: null, lambda_slo: null,
    model_family: 'Qwen/Qwen3-4B', candidates: [], limitations: [
      'Official GGUF/AWQ releases declare the same base model; exact upstream source commit equivalence remains unverified.',
      'Windows total VRAM return is observational evidence; per-process GPU memory release is unsupported.',
      'No latency, quality or failure-rate threshold is applied to the HTTP 8 RPS target.',
      '30-second single exploratory windows do not establish sustainable open-loop arrival capacity.' ] };
  let locked = false, cleanupFailure = false, outputCreated = false;
  const save = () => { report.comparison = comparison(report); write(path.join(opt.out, 'report.json'), report); };
  try {
    if (fs.existsSync(lock) && !opt.resumeReport) throw new Error('Existing benchmark lock requires an explicit recovery report.');
    fs.mkdirSync(opt.out); outputCreated = true;
    const pool = loadCases(path.join(ROOT, 'data/benchmark_prompts.jsonl'), opt.seed, WORKLOAD_SHA);
    report.workload = { source: pool.source, sha256: pool.sha256, case_count: pool.size, categories: pool.categories,
      seed: opt.seed, ordering: 'balanced_seeded_300_case_cyclic_pool' };
    let configs = prepareCandidates(opt.out).filter(c => !opt.candidate || c.id === opt.candidate);
    if (!configs.length) throw new Error('Unknown candidate ID.');
    const blobs = path.join(HF_CACHE, 'hub/blobs');
    report.weight_fingerprints = await Promise.all([
      fileFingerprint(path.join(blobs, '93/9375c1fd02b321abc3f51b69ff7fcdd187af17f0d694c5b05000b54664292e17')),
      fileFingerprint(path.join(blobs, '13/130af9342340b123d37f9e1df8c77258407c93d7137c4869df72dd7e32c908ef')),
    ]);
    let recovery;
    if (opt.resumeReport) {
      const source = JSON.parse(fs.readFileSync(opt.resumeReport, 'utf8'));
      const original = validateResumeSource(source, report);
      const { recoverLocalHttpLock } = require('./recover_local_http_lock');
      recovery = await recoverLocalHttpLock({ lockPath: lock, sourceReportFile: opt.resumeReport,
        outputDir: opt.out, toleranceMiB: opt.vramToleranceMiB });
      report.resume_source = recovery.source_report;
      report.gpu_baseline = structuredClone(source.gpu_baseline);
      report.candidates.push(recoveredBaseline(original, recovery));
      configs = configs.filter(c => c.id !== original.id);
      if (!configs.length) throw new Error('No remaining candidate selected after baseline recovery.');
      emit({ event: 'recovery', status: recovery.status, baseline_max_mib: report.gpu_baseline.max_mib,
        tolerance_mib: opt.vramToleranceMiB, limit_mib: recovery.policy.limit_mib,
        after_mib: recovery.vram_return.after?.gpu?.memory_used_mib });
    }
    fs.writeFileSync(lock, JSON.stringify({ token, pid: process.pid, started_at: report.started_at, out: opt.out, scope: report.scope }), { flag: 'wx' }); locked = true;
    process.on('SIGINT', interrupt); process.on('SIGTERM', interrupt);
    report.existing_ollama_before = await inspectExistingOllama();
    if (!report.existing_ollama_before.available_for_experiment) throw new Error('Existing Ollama residency is occupied or unknown.');
    report.strict_initial_snapshot = await gpuSnapshot();
    if (!recovery) {
      const samples = [];
      for (let i = 0; i < 10; i++) { samples.push(await readLocalGpuObservation()); await sleep(500); }
      report.gpu_baseline = baselineEnvelope(samples);
    }
    if (!report.gpu_baseline.known) throw new Error(`Unusable fixed GPU envelope: ${report.gpu_baseline.reason}`);
    report.cleanup_policy = { scope: 'local_windows_exploration_only', original_baseline_max_mib: report.gpu_baseline.max_mib,
      vram_tolerance_mib: opt.vramToleranceMiB, fixed_acceptance_upper_mib: report.gpu_baseline.max_mib + opt.vramToleranceMiB,
      consecutive_samples_required: 3, lifecycle_cleanup_required: true,
      strict_gpu_release: 'unsupported', formal_benchmark_eligible: false };
    save(); emit({ event: 'baseline', min_mib: report.gpu_baseline.min_mib, max_mib: report.gpu_baseline.max_mib,
      target_rps: opt.targetRps, latency_limit_ms: null, candidate_count: configs.length, out: opt.out });
    for (const candidate of configs) {
      if (controller.signal.aborted) throw new Error('User interrupted');
      validateAppliedArgs(candidate, report.generation);
      const directory = path.join(opt.out, candidate.id); fs.mkdirSync(directory);
      const round = { id: candidate.id, candidate, status: 'preparing', steps: [], strict_gpu_release: 'unsupported', formal_benchmark_eligible: false };
      report.candidates.push(round); save();
      round.before = await waitForVramReturn({ baseline: report.gpu_baseline, toleranceMiB: opt.vramToleranceMiB, signal: controller.signal });
      if (controller.signal.aborted) throw new Error('User interrupted before launch');
      if (round.before.status !== 'observed_returned') { cleanupFailure = true; throw new Error('Fixed GPU baseline return failed before launch.'); }
      const runtime = new Runtime(candidate, directory, { signal: controller.signal, commandRunner: ownedCommandRunner(candidate, directory) });
      const linked = new AbortController(), forward = () => linked.abort(controller.signal.reason);
      controller.signal.addEventListener('abort', forward, { once: true });
      let client, monitor, heartbeat, aliveTimer, phase = 'loading', checking = false, timeouts = 0, persistenceError;
      try {
        emit({ event: 'starting', candidate: candidate.id, users: candidate.users });
        heartbeat = setInterval(() => emit({ event: 'progress', candidate: candidate.id, phase, container: runtime.container }), 20000);
        round.launch = await runtime.start();
        if (candidate.engine === 'ollama') {
          round.model_show = await jsonRequest(candidate.host, '/api/show', { method: 'POST', body: { model: candidate.api_model } });
          if (!round.model_show.ok || !round.model_show.json?.template) throw new Error('Actual imported Ollama chat template missing.');
          if (/Thinking.?2507/i.test(round.model_show.json.model_info?.['general.name'] || '')) throw new Error('Wrong Thinking-2507 checkpoint loaded.');
          round.thinking_off_render = await jsonRequest(candidate.host, '/api/chat', { method: 'POST', timeoutMs: 120000,
            body: { model: candidate.api_model, messages: pool.items[0].messages, stream: false, think: false,
              _debug_render_only: true, options: { num_ctx: 4096, num_predict: 512 } } });
          const rendered = round.thinking_off_render.json?._debug_info?.rendered_template;
          const suffix = typeof rendered === 'string' ? rendered.slice(rendered.lastIndexOf('<|im_start|>assistant')) : null;
          if (!round.thinking_off_render.ok || suffix === null || !suffix.includes('<|im_start|>assistant')
            || suffix.lastIndexOf('<think>') > suffix.lastIndexOf('</think>')) throw new Error('Actual Ollama thinking-off prompt rendering is unverified or leaves an open think prefix.');
        }
        client = createClient({ engine: candidate.engine, host: candidate.host, model: candidate.api_model,
          transport: { keepAlive: true, timeoutMs: opt.timeoutMs },
          generation: { temperature: 0, numCtx: 4096, maxTokens: 512, thinking: false } });
        phase = 'preload'; round.preload = await warmHttpOnly(client, pool, 2, directory, 'preload', linked.signal);
        if (!round.preload.passed) throw new Error('HTTP-only preload failed.');
        round.loaded_gpu = await readLocalGpuObservation();
        if (candidate.engine === 'ollama') {
          round.ollama_resident = await jsonRequest(candidate.host, '/api/ps');
          const model = round.ollama_resident.json?.models?.find(m => (m.name || m.model) === candidate.api_model);
          if (!model || !(model.size_vram > 0) || model.size_vram < model.size) throw new Error('Ollama model is not fully resident on GPU.');
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
        round.vram_return = await waitForVramReturn({ baseline: report.gpu_baseline, toleranceMiB: opt.vramToleranceMiB });
        round.lifecycle_verified = !errors.length && round.runtime_cleanup?.process_exit_confirmed === true && round.runtime_cleanup?.port_released === true;
        round.vram_return_observed = round.vram_return.status === 'observed_returned'; round.cleanup_errors = errors;
        cleanupFailure = !round.lifecycle_verified || !round.vram_return_observed;
        if (cleanupFailure) { round.measurement_status = round.status; round.status = 'cleanup_unverified'; }
        write(path.join(directory, 'round.json'), round); save(); controller.signal.removeEventListener('abort', forward);
        emit({ event: 'candidate_finished', candidate: candidate.id, status: round.status, lifecycle_verified: round.lifecycle_verified,
          vram_return_observed: round.vram_return_observed, after_mib: round.vram_return.after?.gpu?.memory_used_mib, error: round.error });
      }
      if (cleanupFailure) throw new Error('Cleanup evidence failed; next engine is blocked.');
      if (candidate.id === 'ollama_p4' && round.status === 'engine_failed') throw new Error('Ollama baseline preparation failed; comparisons require a working baseline.');
    }
    report.existing_ollama_after = await inspectExistingOllama();
    report.status = report.candidates.every(c => c.status === 'completed') ? 'completed_exploration' : 'completed_with_failures';
  } catch (error) { report.status = cleanupFailure ? 'cleanup_unverified' : controller.signal.aborted ? 'aborted' : 'failed'; report.error = error.message; }
  finally {
    process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
    report.finished_at = new Date().toISOString(); report.lock_retained = cleanupFailure;
    if (outputCreated) save();
    if (locked && !cleanupFailure && JSON.parse(fs.readFileSync(lock, 'utf8')).token === token) fs.unlinkSync(lock);
  }
  emit({ event: 'report', status: report.status, report: path.join(opt.out, 'report.json'), comparison: report.comparison });
  if (report.status !== 'completed_exploration') process.exitCode = 1;
  return report;
}
if (require.main === module) main().catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
module.exports = { main, options, comparison, warmHttpOnly, ownedCommandRunner, validateResumeSource, recoveredBaseline };
