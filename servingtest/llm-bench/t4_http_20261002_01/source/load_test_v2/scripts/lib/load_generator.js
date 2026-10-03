'use strict';

const { performance } = require('node:perf_hooks');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));

function requirePositive(value, name, integer = false) {
  if (!Number.isFinite(value) || value <= 0 || (integer && !Number.isInteger(value))) {
    throw new TypeError(`${name} must be a positive ${integer ? 'integer' : 'number'}`);
  }
}

function take(cursor) {
  if (!cursor || typeof cursor.next !== 'function') throw new TypeError('cursor.next() is required');
  const next = cursor.next();
  // Both cyclic benchmark cursors and standard JavaScript iterators are accepted.
  if (next && typeof next === 'object' && Object.hasOwn(next, 'done') && Object.hasOwn(next, 'value')) {
    if (next.done) throw new Error('prompt cursor exhausted');
    return next.value;
  }
  if (next === undefined) throw new Error('prompt cursor exhausted');
  return next;
}

function linkedAbort(signal) {
  const controller = new AbortController();
  const forward = () => controller.abort(signal.reason);
  if (signal?.aborted) forward();
  else signal?.addEventListener('abort', forward, { once: true });
  return { controller, unlink: () => signal?.removeEventListener('abort', forward) };
}

function makeMonitor(now, interval) {
  const samples = [{ at_ms: now(), pending: 0 }];
  let pending = 0;
  let peak = 0;
  const snapshot = () => samples.push({ at_ms: now(), pending });
  const timer = setInterval(snapshot, Math.max(1, interval));
  return {
    samples,
    get pending() { return pending; },
    get peak() { return peak; },
    // Queue trend calculations use regular observation intervals, rather than
    // sampling more often exactly when the server happens to complete quickly.
    enter() { pending += 1; peak = Math.max(peak, pending); },
    leave() { pending -= 1; },
    stop() { clearInterval(timer); snapshot(); },
  };
}

async function invoke(send, item, options) {
  try {
    const result = await send(item, options);
    if (!result || typeof result !== 'object') throw new TypeError('send must return a request record');
    return result;
  } catch (error) {
    return {
      transport_ok: false, ok: false, valid: false,
      error_type: options.signal?.aborted ? 'aborted' : 'send_exception',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function transportOK(record) { return (record.transport_ok ?? record.ok) === true; }

async function runClosedLoop({
  users, cursor, send, measureMs, warmupRequestsPerUser = 1, warmupTimeoutMs = 30000,
  minRequests = 0, maxStepMs = measureMs, signal, onRecord, monitorIntervalMs = 100,
}) {
  requirePositive(users, 'users', true);
  requirePositive(measureMs, 'measureMs');
  requirePositive(warmupTimeoutMs, 'warmupTimeoutMs');
  if (!Number.isInteger(warmupRequestsPerUser) || warmupRequestsPerUser < 0) {
    throw new TypeError('warmupRequestsPerUser must be a nonnegative integer');
  }
  if (typeof send !== 'function') throw new TypeError('send is required');
  // Kept as accepted options for callers migrating from v1. Neither can extend
  // or shorten the fixed observation window. Sufficiency belongs to statistics.
  void minRequests;
  void maxStepMs;
  const origin = performance.now();
  const now = () => performance.now() - origin;
  const linked = linkedAbort(signal);
  const monitor = makeMonitor(now, monitorIntervalMs);
  const records = [];
  const warmupSummary = Array.from({ length: users }, (_, user) => ({
    user, attempted: 0, completed: 0, transport_ok: 0, valid: 0, failures: 0,
  }));
  let warmupReached = false;
  let warmupFailed = false;
  let stopReason = 'completed';
  let window = { startMs: null, endMs: null };
  let drainMs = 0;
  let timeout;
  let abortListener;
  try {
    const warmupTasks = warmupSummary.map(async (summary) => {
      for (let i = 0; i < warmupRequestsPerUser && !linked.controller.signal.aborted; i += 1) {
        summary.attempted += 1;
        let item;
        try { item = take(cursor); } catch (error) {
          summary.failures += 1;
          return;
        }
        monitor.enter();
        const result = await invoke(send, item, { signal: linked.controller.signal, warmup: true });
        monitor.leave();
        summary.completed += 1;
        if (transportOK(result)) summary.transport_ok += 1;
        if (result.valid === true) summary.valid += 1;
        if (!transportOK(result) || result.valid !== true) summary.failures += 1;
      }
    });
    const timedOut = new Promise((resolve) => {
      timeout = setTimeout(() => resolve('warmup_timeout'), warmupTimeoutMs);
      abortListener = () => resolve('aborted');
      linked.controller.signal.addEventListener('abort', abortListener, { once: true });
      if (linked.controller.signal.aborted) resolve('aborted');
    });
    const warmupResult = await Promise.race([
      Promise.all(warmupTasks).then(() => 'finished'), timedOut,
    ]);
    clearTimeout(timeout);
    linked.controller.signal.removeEventListener('abort', abortListener);
    warmupFailed = warmupResult !== 'finished' || warmupSummary.some((s) => s.failures > 0);
    warmupReached = !warmupFailed && warmupSummary.every((s) => s.completed === warmupRequestsPerUser);
    if (!warmupReached) {
      stopReason = warmupResult === 'finished' ? 'warmup_failure' : warmupResult;
      // An uncooperative mock/send cannot hold the warmup barrier indefinitely.
      // Production adapters must honor this signal and release their requests.
      linked.controller.abort(new Error(stopReason));
      await Promise.race([Promise.all(warmupTasks), sleep(10)]);
    } else {
      window = { startMs: now(), endMs: 0 };
      window.endMs = window.startMs + measureMs;
      const workers = Array.from({ length: users }, (_, user) => (async () => {
        while (!linked.controller.signal.aborted && now() < window.endMs) {
          let item;
          try { item = take(cursor); } catch (error) {
            stopReason = 'cursor_exhausted';
            linked.controller.abort(error);
            break;
          }
          const started = now();
          if (started >= window.endMs) break;
          monitor.enter();
          const result = await invoke(send, item, { signal: linked.controller.signal });
          const ended = now();
          monitor.leave();
          const record = {
            ...result, user, case_id: result.case_id ?? item?.caseId ?? item?.case_id,
            t_start_rel: started, t_end_rel: ended, in_window: true,
            e2e_ms: Number.isFinite(result.e2e_ms) ? result.e2e_ms : ended - started,
          };
          records.push(record);
          if (onRecord) await onRecord(record);
          // Yield even if a broken mock returns immediately; timers and abort
          // handlers must remain able to run under saturated closed-loop load.
          await new Promise((resolve) => setImmediate(resolve));
        }
      })());
      await Promise.all(workers);
      // If a cursor or signal ended the run early, the intended fixed window
      // remains explicit; the aborted flag prevents this result from passing.
      if (!linked.controller.signal.aborted) await sleep(window.endMs - now());
      drainMs = Math.max(0, now() - window.endMs);
      if (signal?.aborted) stopReason = 'aborted';
    }
  } finally {
    clearTimeout(timeout);
    if (abortListener) linked.controller.signal.removeEventListener('abort', abortListener);
    monitor.stop();
    linked.unlink();
  }
  return {
    records, window, warmupReached, warmupFailed, warmupSummary, drainMs,
    elapsedMs: now(), maxInFlight: monitor.peak, inFlightSamples: monitor.samples,
    aborted: linked.controller.signal.aborted, stop_reason: stopReason,
  };
}

function seededRandom(seed = 1) {
  let state = typeof seed === 'number' ? seed >>> 0 : Array.from(String(seed))
    .reduce((n, ch) => Math.imul(n ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261);
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let n = state;
    n = Math.imul(n ^ n >>> 15, n | 1);
    n ^= n + Math.imul(n ^ n >>> 7, n | 61);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}

async function runOpenLoop({
  rate, durationMs, cursor, send, seed = 1, maxInFlight = 10000,
  signal, onRecord, monitorIntervalMs = 100,
}) {
  requirePositive(rate, 'rate');
  requirePositive(durationMs, 'durationMs');
  requirePositive(maxInFlight, 'maxInFlight', true);
  if (typeof send !== 'function') throw new TypeError('send is required');
  const rng = seededRandom(seed);
  const schedule = [];
  // The schedule is generated before any completions, so overload cannot lower
  // the intended offered rate by quietly slowing the arrival generator.
  for (let at = -Math.log(1 - rng()) * 1000 / rate; at < durationMs;
    at += -Math.log(1 - rng()) * 1000 / rate) schedule.push(at);
  const origin = performance.now();
  const now = () => performance.now() - origin;
  const linked = linkedAbort(signal);
  const monitor = makeMonitor(now, monitorIntervalMs);
  const records = [];
  const pending = new Set();
  const window = { startMs: 0, endMs: durationMs };
  let stopReason = 'completed';
  async function retain(record) {
    records.push(record);
    if (onRecord) await onRecord(record);
  }
  try {
    for (let sequence = 0; sequence < schedule.length; sequence += 1) {
      if (linked.controller.signal.aborted) { stopReason = 'aborted'; break; }
      const scheduled = schedule[sequence];
      while (now() < scheduled && !linked.controller.signal.aborted) {
        await sleep(Math.min(scheduled - now(), 25));
      }
      if (linked.controller.signal.aborted) { stopReason = 'aborted'; break; }
      let item;
      try { item = take(cursor); } catch (error) {
        stopReason = 'cursor_exhausted';
        linked.controller.abort(error);
        break;
      }
      const actual = now();
      const common = {
        sequence, case_id: item?.caseId ?? item?.case_id,
        t_scheduled_rel: scheduled, lateness_ms: Math.max(0, actual - scheduled), in_window: true,
      };
      if (actual >= durationMs || monitor.pending >= maxInFlight) {
        await retain({
          ...common, t_start_rel: null, t_send_rel: null, t_end_rel: actual,
          transport_ok: false, ok: false, valid: false, client_drop: true,
          error_type: actual >= durationMs ? 'client_deadline_miss' : 'client_inflight_limit',
          e2e_ms: null, e2e_from_scheduled_ms: actual - scheduled,
        });
        continue;
      }
      monitor.enter();
      const task = (async () => {
        const result = await invoke(send, item, { signal: linked.controller.signal });
        const ended = now();
        monitor.leave();
        await retain({
          ...result, ...common, t_start_rel: actual, t_send_rel: actual, t_end_rel: ended,
          e2e_ms: Number.isFinite(result.e2e_ms) ? result.e2e_ms : ended - actual,
          e2e_from_scheduled_ms: ended - scheduled,
        });
      })();
      pending.add(task);
      task.finally(() => pending.delete(task)).catch(() => {});
    }
    if (!linked.controller.signal.aborted) await sleep(durationMs - now());
    await Promise.all(pending);
  } finally {
    monitor.stop();
    linked.unlink();
  }
  return {
    records, window, scheduledArrivals: schedule.length,
    offeredArrivals: records.length, offered_rate: records.length * 1000 / durationMs,
    drainMs: Math.max(0, now() - durationMs), elapsedMs: now(),
    maxInFlight: monitor.peak, inFlightSamples: monitor.samples,
    aborted: linked.controller.signal.aborted, stop_reason: stopReason, seed,
  };
}

module.exports = { runClosedLoop, runOpenLoop, sleep, seededRandom };
