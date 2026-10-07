#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { performance } = require('node:perf_hooks');
const { loadConfig, identityHash, hashObject } = require('./lib/config');
const { loadCases } = require('./lib/cases');
const { verifyProvenance, semanticGate, contractGate, hashFile } = require('./lib/provenance');
const { Runtime, validateAppliedArgs } = require('./lib/runtime');
const { Monitor, gpuSnapshot } = require('./lib/monitor');
const { createClient } = require('./lib/transport');
const { runClosedLoop, runOpenLoop } = require('./lib/load_generator');
const { summarizeRecords, capacityFromSteps, percentile } = require('./lib/stats');
const { assessArrival } = require('./lib/arrival');
const { waitForGpuRelease } = require('./lib/gpu_cleanup');
const { cleanupOptions, assertBaseline, cleanupOwnedEngine } = require('./lib/cleanup');
const ROOT = path.resolve(__dirname, '..');
const PHASES = ['smoke', 'screen', 'quality', 'confirm', 'arrival'];
const writeJSON = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const append = (file, value) => fs.appendFileSync(file, JSON.stringify(value) + '\n');

function options(args) {
  const out = { phase: 'smoke', seed: 20261001, mock: false, dryRun: false };
  const names = { '--config': 'config', '--phase': 'phase', '--out': 'out', '--candidate': 'candidate', '--seed': 'seed', '--baseline': 'baseline' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--mock') out.mock = true;
    else if (args[i] === '--dry-run') out.dryRun = true;
    else if (args[i] === '--help') out.help = true;
    else if (names[args[i]] && args[i + 1] && !args[i + 1].startsWith('--')) out[names[args[i]]] = args[++i];
    else throw new Error(`알 수 없거나 값이 없는 옵션: ${args[i]}`);
  }
  out.seed = Number(out.seed);
  if (!out.help && (!out.config || !PHASES.includes(out.phase) || !Number.isSafeInteger(out.seed))) throw new Error('--config, 올바른 --phase와 정수 seed가 필요합니다');
  return out;
}
function contained(base, target) {
  const rel = path.relative(base, target);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}
function outputDirectory(value) {
  const base = path.join(ROOT, 'results');
  const target = path.resolve(value || path.join(base, `${new Date().toISOString().replace(/[:.]/g, '-')}_${randomUUID().slice(0, 8)}`));
  if (!contained(base, target)) throw new Error('--out은 load_test_v2/results 아래의 새 디렉터리여야 합니다');
  return target;
}
function mockOnly(candidate) {
  const server = path.join(__dirname, 'dev', 'mock_server.js');
  if (candidate.runtime.mode !== 'process' || path.resolve(candidate.runtime.command[0]).toLowerCase() !== process.execPath.toLowerCase()
    || path.resolve(candidate.runtime.command[1]).toLowerCase() !== server.toLowerCase()
    || !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(candidate.host).hostname)) throw new Error('--mock에서는 제공된 로컬 mock_server.js만 실행할 수 있습니다');
}
function clientFor(candidate, config) {
  return createClient({ engine: candidate.engine, host: candidate.host, model: candidate.api_model,
    transport: { keepAlive: config.transport.keep_alive, timeoutMs: config.transport.timeout_ms },
    generation: { temperature: 0, numCtx: config.generation.context, maxTokens: config.generation.max_tokens, thinking: false } });
}
function profileFor(config, phase) { return config.profiles[phase] || config.profiles.smoke; }
function safetyThreshold(config) {
  const value = config.safety?.consecutive_timeouts ?? 8;
  if (!Number.isInteger(value) || value < 2 || value > 1000) throw new Error('safety.consecutive_timeouts는 2..1000입니다');
  return value;
}
async function preflight(client, config, pool, directory, signal) {
  const count = config.preflight_requests ?? (config.mock ? 4 : 100);
  if (!Number.isInteger(count) || count < (config.mock ? 2 : 100)) throw new Error('순차 preflight는 실제 100건, 모의 2건 이상입니다');
  const cursor = pool.cursor(); let reused = 0, unknownInput = 0, invalidOutput = 0;
  for (let i = 0; i < count; i++) {
    if (signal.aborted) throw new Error('preflight 중단');
    const record = await client.send(cursor.next(), { signal });
    append(path.join(directory, 'preflight.jsonl'), { ...record, phase: 'preflight', sequence: i });
    if (!record.transport_ok) throw new Error(`preflight 전송 실패: ${record.error_type || 'incomplete_response'}`);
    if (!record.valid) invalidOutput++;
    if (record.socket_reused) reused++;
    if (Number.isFinite(record.prompt_eval_count)) {
      if (record.prompt_eval_count + config.generation.max_tokens > config.generation.context) throw new Error('입력 토큰과 출력 상한이 context를 넘습니다');
    } else unknownInput++;
  }
  if (config.transport.keep_alive && !reused) throw new Error('preflight에서 실제 keep-alive 소켓 재사용이 확인되지 않았습니다');
  return { count, reused_connections: reused, unknown_input_tokens: unknownInput, invalid_outputs: invalidOutput,
    input_fit_status: unknownInput ? 'partially_unknown' : 'checked_for_preflight_cases', all_cases_checked: false };
}
function abortLinked(signal) {
  const controller = new AbortController();
  const forward = () => controller.abort(signal.reason);
  if (signal.aborted) forward(); else signal.addEventListener('abort', forward, { once: true });
  return { controller, release: () => signal.removeEventListener('abort', forward) };
}
async function quality(client, candidate, config, pool, directory, signal) {
  const answers = path.join(directory, 'quality_answers.jsonl');
  const records = [];
  for (const item of pool.items) {
    if (signal.aborted) break;
    const record = await client.send(item, { signal });
    const row = { ...record, case_id: item.caseId, case_type: item.type };
    records.push(row); append(answers, row);
  }
  const nValid = records.filter(x => x.valid === true).length;
  const inputUnknown = records.filter(x => !Number.isFinite(x.prompt_eval_count)).length;
  const inputOverflow = records.filter(x => Number.isFinite(x.prompt_eval_count)
    && x.prompt_eval_count + config.generation.max_tokens > config.generation.context).length;
  const report = { schema_version: 2, phase: 'quality', mock: config.mock === true,
    candidate_identity_sha256: identityHash(candidate), workload_sha256: pool.sha256,
    case_count: records.length, case_ids: records.map(x => x.case_id), n_total: records.length, n_valid: nValid,
    criteria: { fail_rate: config.slo.fail_rate },
    contract_pass: records.length === pool.size && (pool.size - nValid) / pool.size <= config.slo.fail_rate,
    input_fit_status: inputUnknown || inputOverflow ? 'unknown_or_overflow' : 'checked_all_cases',
    input_fit_unknown: inputUnknown, input_fit_overflow: inputOverflow,
    semantic_quality_status: 'pending', answers: { path: 'quality_answers.jsonl', sha256: fs.existsSync(answers) ? await hashFile(answers) : null },
    failures: records.filter(x => !x.valid).map(x => ({ case_id: x.case_id, error_type: x.error_type,
      schema_valid: x.schema_valid, evidence_valid: x.evidence_valid, truncated: x.truncated })) };
  const reportFile = path.join(directory, 'quality_report.json'); writeJSON(reportFile, report);
  return { status: signal.aborted ? 'aborted' : report.contract_pass ? 'contract_pass_semantic_pending' : 'contract_failed',
    quality_report: { path: reportFile, sha256: await hashFile(reportFile) }, report };
}
function trend(samples, window) {
  const points = samples.filter(x => x.at_ms >= window.startMs && x.at_ms <= window.endMs);
  if (points.length < 4) return { status: 'insufficient_samples', slope_requests_per_sec: null };
  const mx = points.reduce((n, p) => n + p.at_ms / 1000, 0) / points.length;
  const my = points.reduce((n, p) => n + p.pending, 0) / points.length;
  const numerator = points.reduce((n, p) => n + (p.at_ms / 1000 - mx) * (p.pending - my), 0);
  const denominator = points.reduce((n, p) => n + (p.at_ms / 1000 - mx) ** 2, 0);
  return { status: 'diagnostic', slope_requests_per_sec: denominator ? numerator / denominator : null,
    first_pending: points[0].pending, last_pending: points.at(-1).pending,
    limitation: '클라이언트 미완료 요청 추세; 엔진 큐의 안정성을 단독 입증하지 않음' };
}
function arrivalBaseline(file, candidate, config, pool, mock, seed) {
  if (!file) throw new Error('arrival에는 --baseline <confirm report.json>이 필요합니다');
  const report = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (report.status !== 'completed' || report.phase !== 'confirm' || report.mock !== mock || report.workload_sha256 !== pool.sha256 || seed !== undefined && report.seed !== seed
    || hashObject(report.transport) !== hashObject(config.transport) || hashObject(report.generation) !== hashObject(config.generation)
    || hashObject(report.slo) !== hashObject(config.slo)) throw new Error('arrival 기준의 문항·전송·생성·SLO·실제/모의 구분 불일치');
  const previous = report.candidates.find(x => x.id === candidate.id);
  if (previous?.identity_sha256 !== identityHash(candidate) || previous.cleanup_verified !== true) throw new Error('arrival 기준의 배포 구성 불일치 또는 메모리 정리 증거 부족');
  const capacity = mock ? previous.capacity?.simulated_c_slo : previous.capacity?.c_slo;
  if (!(capacity > 0)) throw new Error('arrival 기준에는 품질·반복 검증을 통과한 confirm C_SLO가 필요합니다');
  const rates = report.steps.filter(x => x.candidate_id === candidate.id && x.users === capacity && x.status === 'completed' && x.cleanup_verified === true).map(x => x.summary.valid_rps);
  if (rates.length < config.profiles.confirm.repeats || rates.some(x => !(x > 0))) throw new Error('arrival 기준 처리량 반복 자료 부족');
  return { capacity, valid_rps: percentile(rates, 0.5), source: path.resolve(file) };
}
async function main(argv = process.argv.slice(2), { runtimeFactory = (candidate, directory, options) => new Runtime(candidate, directory, options) } = {}) {
  const opt = options(argv);
  if (opt.help) { console.log('node scripts/run_benchmark.js --config config.json --phase smoke|screen|quality|confirm|arrival [--candidate ID] [--dry-run] [--mock] [--out load_test_v2/results/새폴더] [--baseline report.json]'); return 0; }
  const config = loadConfig(opt.config, { mock: opt.mock });
  const pool = loadCases(config.workload.file, opt.seed, config.workload.sha256);
  if (pool.size !== 300) throw new Error('이번 v2 문항 풀은 고정된 300문항입니다');
  const selected = config.candidates.filter(c => c.enabled && (!opt.candidate || c.id === opt.candidate));
  if (opt.candidate && !selected.length) throw new Error('선택한 후보가 없거나 enabled=false입니다');
  if (opt.mock) selected.forEach(mockOnly);
  const profile = profileFor(config, opt.phase), threshold = safetyThreshold(config), gpuOptions = cleanupOptions(config);
  const out = outputDirectory(opt.out);
  if (opt.dryRun) {
    console.log(JSON.stringify({ dry_run: true, mock: opt.mock, phase: opt.phase, output: out, profile,
      workload: { sha256: pool.sha256, count: pool.size, categories: pool.categories }, transport: config.transport,
      candidates: config.candidates.map(c => ({ id: c.id, engine: c.engine, status: selected.includes(c) ? 'selected' : 'disabled_or_unselected', P: c.internal_limit })),
      commands_executed: false, files_written: false }, null, 2)); return 0;
  }
  if (!selected.length) throw new Error('enabled=true인 검증 가능한 후보가 없습니다');
  if (!opt.mock && selected.some(c => c.runtime.mode !== 'docker')) throw new Error('엔진별 worker 메모리를 정리하기 위해 실제 측정은 소유한 Docker 컨테이너만 지원합니다');
  if (!opt.mock && ['confirm', 'arrival'].includes(opt.phase)
    && (process.platform !== 'linux' || config.environment?.scope !== 't4' || selected.some(c => c.runtime.mode === 'external'))) throw new Error('실제 정식 검증은 Linux T4 전용 환경과 소유한 서버로 실행합니다');
  const controller = new AbortController();
  const interrupted = () => controller.abort(new Error('user_interrupt'));
  process.on('SIGINT', interrupted); process.on('SIGTERM', interrupted);
  const token = randomUUID(), lock = path.join(ROOT, '.benchmark.lock'); let locked = false;
  const report = { schema_version: 2, mock: opt.mock, phase: opt.phase, started_at: new Date().toISOString(),
    config_sha256: hashObject(config), seed: opt.seed, workload_sha256: pool.sha256, categories: pool.categories,
    transport: config.transport, generation: config.generation, slo: config.slo, profile,
    candidates: [], steps: [], rounds: [], cleanup_policy: gpuOptions, status: 'running', output: out,
    limitation: opt.mock ? '모의 HTTP 서버 검증; GPU·실제 엔진 성능을 의미하지 않음' : '잠정 SLO를 사용한 지정 U 구간의 측정' };
  const save = () => writeJSON(path.join(out, 'report.json'), report);
  let cleanupFailure = false;
  try {
    fs.writeFileSync(lock, JSON.stringify({ token, pid: process.pid, started_at: report.started_at, out }), { flag: 'wx' }); locked = true;
    fs.mkdirSync(path.dirname(out), { recursive: true }); fs.mkdirSync(out);
    for (const candidate of selected) {
      validateAppliedArgs(candidate, config.generation, { mock: opt.mock });
      const provenance = await verifyProvenance(candidate, { mock: opt.mock });
      const contract = await contractGate(candidate, pool.sha256, { mock: opt.mock, expectedCaseIds: pool.items.map(x => x.caseId),
        expectedCases: pool.items, expectedFailRate: config.slo.fail_rate, expectedGeneration: config.generation });
      const semantic = await semanticGate(candidate, pool.sha256, { mock: opt.mock });
      report.candidates.push({ id: candidate.id, engine: candidate.engine, P: candidate.internal_limit,
        identity_sha256: identityHash(candidate), provenance, contract, semantic });
    }
    if (!opt.mock) {
      report.gpu_baseline = assertBaseline(await gpuSnapshot(), gpuOptions);
      const initial = await waitForGpuRelease({ before: report.gpu_baseline, snapshot: gpuSnapshot, ...gpuOptions, signal: controller.signal });
      if (initial.released !== true) throw new Error(`실험 전 GPU 기준선 안정화 실패: ${initial.reason}`);
      report.gpu_baseline_verification = initial;
    } else report.gpu_baseline = { known: true, scope: 'mock', compute_processes: [], gpus: [] };
    save();
    const repeats = ['quality', 'arrival'].includes(opt.phase) ? 1 : profile.repeats;
    for (let repeat = 1; repeat <= repeats && !controller.signal.aborted && !cleanupFailure; repeat++) {
      const order = [...selected.slice((repeat - 1) % selected.length), ...selected.slice(0, (repeat - 1) % selected.length)];
      for (const candidate of order) {
        if (controller.signal.aborted || cleanupFailure) break;
        const metadata = report.candidates.find(x => x.id === candidate.id);
        const directory = path.join(out, `${candidate.id}_r${repeat}`); fs.mkdirSync(directory);
        const round = { candidate_id: candidate.id, repeat, phase: opt.phase, P: candidate.internal_limit, status: 'running' };
        const formal = ['confirm', 'arrival'].includes(opt.phase);
        if (formal && (metadata.contract.status !== 'passed' || metadata.semantic.status !== 'passed')) {
          const levels = opt.phase === 'arrival' ? [0.7, 0.9, 1.1] : profile.users;
          for (const level of levels) report.steps.push({ ...round, users: opt.phase === 'arrival' ? null : level,
            factor: opt.phase === 'arrival' ? level : undefined, status: 'not_measured', reason: 'quality_gate_pending_or_failed' });
          save(); continue;
        }
        const linked = abortLinked(controller.signal), signal = linked.controller.signal;
        const runtime = runtimeFactory(candidate, directory, { mock: opt.mock, signal });
        const client = clientFor(candidate, config);
        const monitor = new Monitor(candidate, path.join(directory, 'metrics.jsonl'), { mock: opt.mock, intervalMs: opt.mock ? 10 : 1000,
          onError: error => linked.controller.abort(error) });
        let timer, preGPU;
        try {
          preGPU = await gpuSnapshot({ mock: opt.mock }); round.gpu_before = preGPU;
          if (!opt.mock) {
            assertBaseline(preGPU, gpuOptions);
            const idle = await waitForGpuRelease({ before: report.gpu_baseline, snapshot: gpuSnapshot, ...gpuOptions, signal });
            round.gpu_before_verification = idle;
            if (idle.released !== true) throw new Error(`엔진 전환 전 GPU 메모리 미해제: ${idle.reason}`);
          }
          if (!opt.mock && formal && !/Tesla T4|NVIDIA T4/.test(preGPU.gpu)) throw new Error('정식 검증 장비가 T4가 아닙니다');
          round.runtime = await runtime.start();
          // Ollama tags readiness does not load weights. This request belongs to preload, outside all measurements.
          const preloadStart = performance.now();
          const preload = await client.send(pool.cursor().next(), { signal });
          append(path.join(directory, 'preload.jsonl'), preload);
          round.preload_ms = performance.now() - preloadStart;
          if (!preload.transport_ok) throw new Error(`preload 전송 실패: ${preload.error_type || 'incomplete_response'}`);
          round.attestation = await runtime.attest(config);
          round.preflight = await preflight(client, config, pool, directory, signal);
          monitor.start();
          let checking = false;
          timer = setInterval(async () => {
            if (checking) return; checking = true;
            try { if (!(await runtime.alive())) linked.controller.abort(new Error('owned_server_exit')); }
            catch (error) { linked.controller.abort(error); } finally { checking = false; }
          }, 1000);
          let timeouts = 0, persistenceError;
          const send = async (item, options) => {
            const record = await client.send(item, options);
            timeouts = record.error_type === 'timeout' ? timeouts + 1 : 0;
            if (timeouts >= threshold) linked.controller.abort(new Error('repeated_timeouts_safety_stop'));
            return record;
          };
          if (opt.phase === 'quality') {
            Object.assign(round, await quality(client, candidate, config, pool, directory, signal));
            report.steps.push(round);
          } else {
            const baseline = opt.phase === 'arrival' ? arrivalBaseline(opt.baseline, candidate, config, pool, opt.mock, opt.seed) : null;
            const levels = baseline ? [0.7, 0.9, 1.1] : profile.users;
            for (const level of levels) {
              if (signal.aborted) { report.steps.push({ ...round, users: baseline ? null : level, factor: baseline ? level : undefined,
                status: controller.signal.aborted ? 'aborted' : 'not_measured', reason: signal.reason?.message }); continue; }
              const label = baseline ? `arrival_${level}` : `u${level}`, raw = path.join(directory, `${label}_requests.jsonl`);
              const onRecord = record => {
                try { append(raw, record); } catch (error) { persistenceError = error; linked.controller.abort(error); }
              };
              monitor.stage = { repeat, phase: opt.phase, users: baseline ? null : level, factor: baseline ? level : undefined };
              const duration = config.arrival?.duration_ms ?? (opt.mock ? 400 : 300000);
              if (baseline && (!Number.isSafeInteger(duration) || duration < (opt.mock ? 1 : 300000))) throw new Error('arrival 실측은 5분 이상입니다');
              const metricsOffset = performance.now() - monitor.startMs;
              const minimum = baseline ? (opt.mock ? profile.min_valid_requests : 100) : profile.min_valid_requests;
              const result = baseline ? await runOpenLoop({ rate: baseline.valid_rps * level, durationMs: duration,
                cursor: pool.cursor(), send, seed: opt.seed + Math.round(level * 10), signal,
                maxInFlight: config.arrival?.max_in_flight ?? 10000, onRecord, monitorIntervalMs: opt.mock ? 10 : 1000 })
                : await runClosedLoop({ users: level, measureMs: profile.measure_ms, warmupRequestsPerUser: profile.warmup_per_user,
                  warmupTimeoutMs: Math.max(config.transport.timeout_ms * 2, 30000), cursor: pool.cursor(), send,
                  signal, onRecord, monitorIntervalMs: opt.mock ? 10 : 1000 });
              if (persistenceError) throw persistenceError;
              const summary = result.window.startMs === null ? null : summarizeRecords(result.records, result.window,
                { minValidRequests: minimum, slo: { e2eP95Ms: config.slo.e2e_p95_ms, failRate: config.slo.fail_rate } });
              const backend = baseline ? monitor.samples.filter(x => x.stage?.factor === level && x.stage?.repeat === repeat)
                .map(x => ({ at_ms: x.at_ms - metricsOffset, queued: x.engine_metrics?.queued ?? null })) : [];
              const stability = baseline ? assessArrival(result, summary, { measureMs: duration, minSamples: minimum, slo: config.slo,
                backendSamples: backend, clientTolerancePerSec: config.arrival?.client_growth_tolerance_per_sec ?? 0.01,
                queueTolerancePerSec: config.arrival?.queue_growth_tolerance_per_sec ?? 0.01,
                maxLatenessP95Ms: config.arrival?.lateness_p95_ms ?? 50 }) : undefined;
              const step = { ...round, users: baseline ? null : level, factor: baseline ? level : undefined,
                status: result.aborted ? controller.signal.aborted ? 'aborted' : 'safety_stop' : result.stop_reason,
                reason: signal.reason?.message, summary, raw_file: raw, window: result.window, elapsed_ms: result.elapsedMs,
                drain_ms: result.drainMs, peak_inflight: result.maxInFlight, warmup: result.warmupSummary,
                warmup_reached: result.warmupReached, in_flight_samples: result.inFlightSamples,
                baseline, offered_rate: result.offered_rate,
                arrival_assessment: stability,
                queue_trend: baseline ? stability.backend_queue_trend : undefined,
                lambda_slo: baseline ? opt.mock ? null : stability.lambda_slo : undefined,
                simulated_lambda_slo: baseline && opt.mock ? stability.lambda_slo : undefined };
              writeJSON(path.join(directory, `${label}_step.json`), step); report.steps.push(step); save();
              if (result.warmupFailed) linked.controller.abort(new Error(result.stop_reason));
            }
          }
        } catch (error) {
          report.steps.push({ ...round, status: controller.signal.aborted ? 'aborted' : 'preparation_failed', error: error.message });
        } finally {
          clearInterval(timer); linked.controller.abort(new Error('round_cleanup'));
          const current = report.steps.filter(x => x.candidate_id === candidate.id && x.repeat === repeat);
          round.status = current.length && current.every(x => ['completed', 'contract_pass_semantic_pending'].includes(x.status)) ? 'completed'
            : controller.signal.aborted ? 'aborted' : 'incomplete';
          const shutdownErrors = [];
          try { client.close(); } catch (error) { shutdownErrors.push(`client_close: ${error.message}`); }
          try { await monitor.stop(); } catch (error) {
            shutdownErrors.push(`monitor_stop: ${error.message}`);
            round.monitor_error = error.message;
            round.status = 'safety_stop';
            for (const step of report.steps.filter(x => x.candidate_id === candidate.id && x.repeat === repeat)) {
              step.status = 'safety_stop'; step.reason = `monitor_failed: ${error.message}`;
            }
          }
          // User cancellation ends requests; memory release still gets its own bounded cleanup interval.
          round.cleanup = await cleanupOwnedEngine({ runtime, before: report.gpu_baseline, mock: opt.mock, gpuOptions });
          round.cleanup.client_and_monitor_closed = shutdownErrors.length === 0;
          if (shutdownErrors.length) { round.cleanup.errors.push(...shutdownErrors); round.cleanup.status = 'failed'; }
          round.cleanup_verified = round.cleanup.status === 'passed';
          round.gpu_after = round.cleanup.gpu.after ?? null;
          if (!round.cleanup_verified) { cleanupFailure = true; round.status = 'cleanup_failed'; }
          for (const step of current) {
            step.cleanup = round.cleanup; step.cleanup_verified = round.cleanup_verified;
            if (!round.cleanup_verified) {
              step.measurement_status = step.status; step.status = 'cleanup_failed'; step.reason = round.cleanup.errors.join('; ');
              step.lambda_slo = null; step.simulated_lambda_slo = null;
            }
            if (step.report?.phase === 'quality') {
              step.report.cleanup = round.cleanup; step.report.cleanup_verified = round.cleanup_verified;
              writeJSON(step.quality_report.path, step.report);
              step.quality_report.sha256 = await hashFile(step.quality_report.path);
            }
            if (step.raw_file) writeJSON(step.raw_file.replace(/_requests\.jsonl$/, '_step.json'), step);
          }
          metadata.rounds = (metadata.rounds || []).concat({ repeat, status: round.status, cleanup_verified: round.cleanup_verified,
            cleanup: round.cleanup, round_file: path.join(directory, 'round.json') });
          report.rounds.push({ candidate_id: candidate.id, ...metadata.rounds.at(-1) });
          writeJSON(path.join(directory, 'round.json'), round); linked.release(); save();
        }
      }
    }
    for (const metadata of report.candidates) {
      const steps = report.steps.filter(x => x.candidate_id === metadata.id && x.summary);
      metadata.cleanup_verified = !!metadata.rounds?.length && metadata.rounds.every(x => x.cleanup_verified === true);
      if (opt.phase === 'confirm') {
        const capacity = capacityFromSteps(steps, { requiredRepeats: profile.repeats, expectedUsers: profile.users,
          semanticQualityStatus: metadata.semantic.status === 'failed' || metadata.contract.status === 'failed' ? 'failed'
            : metadata.semantic.status === 'passed' && metadata.contract.status === 'passed' ? 'passed' : 'pending' });
        if (opt.mock) { capacity.simulated_c_slo = capacity.c_slo; capacity.simulated_c_slo_lower_bound = capacity.c_slo_lower_bound;
          capacity.c_slo = null; capacity.c_slo_lower_bound = null; capacity.status = 'mock_validation'; }
        metadata.capacity = capacity;
      } else {
        const passing = steps.filter(x => x.status === 'completed' && x.cleanup_verified === true && x.summary?.performance_pass === true).map(x => x.users).filter(Number.isFinite);
        metadata.capacity = { c_slo: null, c_performance_candidate: passing.length ? Math.max(...passing) : null,
          status: opt.mock ? 'mock_validation' : opt.phase === 'quality' ? 'semantic_quality_pending' : 'screening_or_diagnostic', lambda_slo: null };
        if (opt.phase === 'arrival') {
          const observed = steps.filter(x => x.status === 'completed' && x.cleanup_verified === true);
          const passed = observed.filter(x => x.arrival_assessment?.status === 'passed').map(x => x.arrival_assessment.lambda_slo);
          const lower = passed.length ? Math.max(...passed) : null;
          const allKnown = observed.length === 3 && observed.every(x => ['passed', 'failed'].includes(x.arrival_assessment?.status));
          const exact = allKnown ? lower : null;
          Object.assign(metadata.capacity, opt.mock ? { simulated_lambda_slo: exact, simulated_lambda_lower_bound: lower,
            lambda_slo: null, lambda_lower_bound: null } : { lambda_slo: exact, lambda_lower_bound: lower });
          metadata.capacity.arrival_status = !allKnown ? 'pending' : passed.length ? 'measured_provisional_pass' : 'no_pass';
        }
      }
    }
    // Missing stages remain explicit even when a safety stop ends the suite.
    if (!['quality', 'arrival'].includes(opt.phase)) for (const candidate of selected) for (let repeat = 1; repeat <= profile.repeats; repeat++) for (const users of profile.users) {
      if (!report.steps.some(x => x.candidate_id === candidate.id && x.repeat === repeat && x.users === users)) report.steps.push({ candidate_id: candidate.id, repeat, users,
        phase: opt.phase, P: candidate.internal_limit, status: 'not_measured', reason: cleanupFailure ? 'cleanup_failed' : 'preparation_failed_or_interrupted' });
    }
    if (opt.phase === 'arrival') for (const candidate of selected) for (const factor of [0.7, 0.9, 1.1]) {
      if (!report.steps.some(x => x.candidate_id === candidate.id && x.factor === factor)) report.steps.push({ candidate_id: candidate.id,
        repeat: 1, users: null, factor, phase: opt.phase, P: candidate.internal_limit, status: 'not_measured',
        reason: cleanupFailure ? 'cleanup_failed' : 'preparation_failed_or_interrupted' });
    }
    if (opt.phase === 'quality') for (const candidate of selected) {
      if (!report.steps.some(x => x.candidate_id === candidate.id)) report.steps.push({ candidate_id: candidate.id, repeat: 1,
        phase: opt.phase, P: candidate.internal_limit, status: 'not_measured', reason: cleanupFailure ? 'cleanup_failed' : 'interrupted' });
    }
    report.status = cleanupFailure ? 'cleanup_failed' : controller.signal.aborted ? 'aborted'
      : report.steps.some(x => !['completed', 'contract_pass_semantic_pending'].includes(x.status)) ? 'incomplete' : 'completed';
    report.finished_at = new Date().toISOString(); save();
    console.log(JSON.stringify({ status: report.status, mock: opt.mock, report: path.join(out, 'report.json') }));
    return controller.signal.aborted ? 130 : report.status === 'completed' ? 0 : 1;
  } finally {
    process.removeListener('SIGINT', interrupted); process.removeListener('SIGTERM', interrupted);
    if (locked && !cleanupFailure && JSON.parse(fs.readFileSync(lock, 'utf8')).token === token) fs.unlinkSync(lock);
  }
}
if (require.main === module) main().then(code => { process.exitCode = code; }).catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { main, options, outputDirectory, trend, preflight, arrivalBaseline };
