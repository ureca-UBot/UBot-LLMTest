'use strict';
// LLM 동시성(부하) 테스트 메인 실행기.
//
// 진행 순서 (모델은 절대 빠지지 않는다)
// 한 번에 한 모델만 실행한다. 모델별 A→B→C 측정을 마친 뒤 서버를 끄고 GPU 해제를
// 확인한 다음 다음 모델로 넘어간다.
//   A. 단계적 증가  : 모델마다 동시 처리 수(OLLAMA_NUM_PARALLEL) 2→4→8→16 라운드,
//                     라운드마다 동시 사용자 1→2→4→8→… 를 멈춤 조건까지
//   ─ 최적 설정 선택: P95 5초·실패율 5% 이내로 버틴 동시 사용자 수가 가장 큰 동시 처리 수
//   B. 스파이크     : 최적 설정에서 100명 동시 요청 1회
//      도착률       : 최적 설정 최대 처리량의 0.25~1.25배 속도로 1분씩
//   C. 반복         : 최적 설정의 단계적 증가를 2번 더 (1회차 포함 총 3회).
//                     계획 시간을 넘겨도 반복 측정은 생략하지 않는다.
//
// 모든 단계 결과는 raw/<run_id>/steps.jsonl에 바로 쓰므로, 중간에 끊겨도 같은 명령을
// 다시 실행하면 끝난 단계는 건너뛰고 이어서 진행한다.
//
// Usage (저장소 루트에서):
//   node load_test_v1/scripts/run_load_test.js [--dry-run]
//     [--profile full|quick] [--models qwen3:8b,qwen3:14b] [--phases A,B,C]
//     [--server-control auto|systemd|process|none] [--run-date YYYYMMDD]
//     [--budget-min 210] [--optimal qwen3:8b=4,qwen3:14b=2] [--no-restore]
//   node load_test_v1/scripts/run_load_test.js --restore-ollama

const fs = require('fs');
const os = require('os');
const path = require('path');
const { randomUUID } = require('crypto');
const { performance } = require('perf_hooks');

const { loadConfig } = require('./config/load_config');
const suite = require('./lib/suite');
const { PromptPool } = require('./lib/prompt_pool');
const { streamChat, OLLAMA_HOST } = require('./lib/stream_client');
const { runClosedLoop, runOpenLoop, runSpike, sleep } = require('./lib/load_generator');
const { summarizeRecords, round } = require('./lib/stats');
const { Monitor } = require('./lib/monitor');
const { OllamaServer, run } = require('./lib/ollama_admin');
const { makeAppender, readAll } = require('./lib/jsonl');

// ---------------------------------------------------------------- 인자

function parseArgs(argv) {
  const o = {
    dryRun: false, profile: 'full', models: null, phases: ['A', 'B', 'C'], serverControl: 'auto',
    runDate: null, budgetMin: null, optimal: {}, noRestore: false, restoreOnly: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) throw new Error(`${a} 뒤에 값이 필요합니다`);
      return argv[++i];
    };
    if (a === '--dry-run') o.dryRun = true;
    else if (a === '--profile') o.profile = next();
    else if (a === '--models') o.models = next().split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--phases') o.phases = next().toUpperCase().split(',').map((s) => s.trim());
    else if (a === '--server-control') o.serverControl = next();
    else if (a === '--run-date') o.runDate = next();
    else if (a === '--budget-min') o.budgetMin = Number(next());
    else if (a === '--optimal') {
      for (const pair of next().split(',')) {
        const [tag, p] = pair.split('=');
        o.optimal[tag.trim()] = Number(p);
      }
    } else if (a === '--no-restore') o.noRestore = true;
    else if (a === '--restore-ollama') o.restoreOnly = true;
    else throw new Error(`알 수 없는 옵션: ${a}`);
  }
  if (!['auto', 'systemd', 'process', 'none'].includes(o.serverControl)) {
    throw new Error(`--server-control 값이 올바르지 않습니다: ${o.serverControl}`);
  }
  if (o.runDate && !/^\d{8}$/.test(o.runDate)) throw new Error('--run-date는 YYYYMMDD 형식이어야 합니다');
  return o;
}

// ---------------------------------------------------------------- 공통 유틸

const todayStamp = (d = new Date()) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
const sanitizeTag = (tag) => tag.replace(/[:.]/g, '-');
const envTag = () => process.env.LLM_TEST_ENV || (process.platform === 'win32' ? 'local-win' : 'ec2-linux');
const sec = (ms) => (typeof ms === 'number' ? `${(ms / 1000).toFixed(2)}s` : '-');
const pct = (v) => (typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : '-');
const gb = (mib) => (typeof mib === 'number' ? `${(mib / 1024).toFixed(1)}GB` : '-');
const nowIso = () => new Date().toISOString();

function makeRunId(model, date, profile) {
  const suffix = profile === 'quick' ? '_quick' : '';
  return `${envTag()}_${sanitizeTag(model.tag)}_${model.cond}_${date}${suffix}`;
}

function log(msg) {
  const t = new Date().toTimeString().slice(0, 8);
  console.log(`[${t}] ${msg}`);
}

async function hostInfo() {
  const gpu = await run('nvidia-smi', ['--query-gpu=name,driver_version,memory.total', '--format=csv,noheader'], { timeoutMs: 5000 });
  const git = await run('git', ['-C', suite.ROOT, 'rev-parse', '--short', 'HEAD'], { timeoutMs: 5000 });
  let instanceType = null;
  try {
    const tok = await fetch('http://169.254.169.254/latest/api/token', {
      method: 'PUT', headers: { 'X-aws-ec2-metadata-token-ttl-seconds': '60' }, signal: AbortSignal.timeout(1000),
    });
    const token = await tok.text();
    const it = await fetch('http://169.254.169.254/latest/meta-data/instance-type', {
      headers: { 'X-aws-ec2-metadata-token': token }, signal: AbortSignal.timeout(1000),
    });
    if (it.ok) instanceType = (await it.text()).trim();
  } catch { /* EC2가 아니면 null */ }
  return {
    hostname: os.hostname(),
    instance_type: instanceType,
    cpus: os.cpus().length,
    mem_gib: Math.round(os.totalmem() / 1024 ** 3),
    gpu: gpu.code === 0 ? gpu.out.trim() : null,
    node: process.version,
    git_commit: git.code === 0 ? git.out.trim() : null,
    ollama_host: OLLAMA_HOST,
  };
}

// ---------------------------------------------------------------- 모델별 저장소

class ModelStore {
  constructor(model, runId) {
    this.model = model;
    this.runId = runId;
    this.dir = suite.rawDir(runId);
    fs.mkdirSync(this.dir, { recursive: true });
    this.stepsPath = path.join(this.dir, 'steps.jsonl');
    this.requestsPath = path.join(this.dir, 'requests.jsonl');
    this.monitorPath = path.join(this.dir, 'monitor.jsonl');
    this.metaPath = path.join(this.dir, 'run_meta.json');
    this.records = new Map();
    for (const r of readAll(this.stepsPath)) if (r.key) this.records.set(r.key, r);
    this.stepsApp = makeAppender(this.stepsPath);
    this.requestsApp = makeAppender(this.requestsPath);
  }

  has(key) { return this.records.has(key); }
  get(key) { return this.records.get(key); }

  put(rec) {
    const full = { run_id: this.runId, model: this.model.tag, written_at: nowIso(), ...rec };
    // 중단 신호를 받은 뒤에는 기록하지 않는다. 원복 과정에서 서버를 끄면서 생긴 실패가
    // "VRAM 부족"이나 "로딩 실패"로 저장되면, 이어하기 때 그 라운드를 잘못 건너뛰게 된다.
    if (this.frozen) return full;
    this.records.set(full.key, full);
    this.stepsApp.append(full);
    return full;
  }

  writeMeta(extra) {
    let meta = {};
    try { meta = JSON.parse(fs.readFileSync(this.metaPath, 'utf8')); } catch { /* 처음 */ }
    if (meta.prompt_pool && extra.prompt_pool && meta.prompt_pool.sha256 && extra.prompt_pool.sha256
      && meta.prompt_pool.sha256 !== extra.prompt_pool.sha256) {
      throw new Error(`${this.runId}: 문항 파일이 이전 실행과 다릅니다. 다른 run-date 또는 LLM_TEST_TRY로 분리하세요.`);
    }
    meta = { ...meta, ...extra, run_id: this.runId, model: this.model.tag, updated_at: nowIso() };
    fs.writeFileSync(this.metaPath, JSON.stringify(meta, null, 2));
  }

  close() {
    this.stepsApp.close();
    this.requestsApp.close();
  }
}

// ---------------------------------------------------------------- 실행기

class LoadTest {
  constructor(cfg, opts) {
    this.cfg = cfg;
    this.opts = opts;
    this.sessionStart = performance.now();
    this.budgetMs = opts.budgetMin ? opts.budgetMin * 60_000 : cfg.budgetMs;
    this.pool = new PromptPool({ seed: cfg.seed });
    this.engine = opts.engine || 'ollama';
    this.server = opts.server || new OllamaServer({ mode: opts.serverControl, logDir: suite.logsDir() });
    this.monitor = new Monitor({ intervalMs: cfg.monitorIntervalMs, engine: this.engine,
      pidProvider: opts.server ? () => this.server.pids() : null,
      metricsProvider: opts.server ? () => this.server.metrics() : null });
    this.currentServer = null; // { model, parallel }
  }

  elapsedMs() { return performance.now() - this.sessionStart; }

  send(model) {
    const { generation, requestTimeoutMs } = this.cfg;
    if (this.opts.send) return (item) => this.opts.send(item, model, generation, requestTimeoutMs);
    return (item) => streamChat({
      model: model.tag, messages: item.messages, generation, think: model.think, timeoutMs: requestTimeoutMs,
    });
  }

  requestWriter(store, ctx) {
    return (rec) => !store.frozen && store.requestsApp.append({
      run_id: store.runId, engine: this.engine || 'ollama', model: store.model.tag, recorded_at: nowIso(), ...ctx,
      case_id: rec.case_id, case_type: rec.case_type, user_idx: rec.user_idx ?? null,
      warmup: rec.warmup, in_window: rec.in_window,
      t_start_rel_ms: round(rec.t_start_rel, 1), t_end_rel_ms: round(rec.t_end_rel, 1),
      ok: rec.ok, error_type: rec.error_type, error_msg: rec.error_msg, http_status: rec.http_status,
      ttft_ms: round(rec.ttft_ms, 1), e2e_ms: round(rec.e2e_ms, 1),
      itl_mean_ms: round(rec.itl_mean_ms, 2), itl_p95_ms: round(rec.itl_p95_ms, 2), itl_max_ms: round(rec.itl_max_ms, 2),
      chunks: rec.chunks, input_chars: rec.input_chars,
      prompt_eval_count: rec.prompt_eval_count, eval_count: rec.eval_count,
      prompt_eval_ms: round(rec.prompt_eval_ms, 1), eval_ms: round(rec.eval_ms, 1),
      load_ms: round(rec.load_ms, 1), server_total_ms: round(rec.server_total_ms, 1),
      wait_est_ms: round(rec.wait_est_ms, 1), done_reason: rec.done_reason,
      content: rec.content, // 생성된 답변 원본. 품질 채점에는 사용하지 않는다.
      reasoning_content: rec.reasoning_content, request_body: rec.request_body,
      http_keep_alive: rec.http_keep_alive ?? null, socket_reused: rec.socket_reused ?? null,
      first_content_ms: rec.first_content_ms, last_content_ms: rec.last_content_ms,
      tpot_ms: rec.tpot_ms, user_tok_s: rec.user_tok_s, post_ttft_tok_s: rec.post_ttft_tok_s,
      queue_ms: rec.queue_ms ?? null, itl_basis: rec.itl_basis || 'content_chunk',
    });
  }

  // 서버를 (모델, 동시 처리 수) 설정으로 준비한다. 같은 설정이면 재시작하지 않는다.
  async prepareServer(store, parallel, label) {
    if (this.opts.signal && this.opts.signal.aborted) throw new Error('측정 중단 요청');
    const model = store.model;
    if (this.currentServer && this.currentServer.ready && this.currentServer.model === model.tag && this.currentServer.parallel === parallel) {
      return this.currentServer.fit;
    }
    this.currentServer = { model: model.tag, parallel, fit: null, ready: false };
    log(`서버 준비: ${model.tag} · NUM_PARALLEL=${parallel} (${label})`);
    const applied = await this.server.apply({ parallel, ...this.cfg.server, numCtx: this.cfg.generation.num_ctx });
    const version = await this.server.version();
    const unloaded = await this.server.unloadOthers(model.tag);
    if (unloaded.length) log(`  다른 모델을 내렸습니다: ${unloaded.join(', ')}`);
    let loadMs = null;
    let loadError = null;
    try {
      loadMs = await this.server.preload(model.tag, this.cfg.generation, model.think);
    } catch (e) {
      loadError = e.message;
    }
    // 모델 로딩과 실제 질문 워밍업 시간을 분리해서 기록한다.
    let warmup = null;
    if (!loadError) {
      const warm = this.pool.cursor(this.pool.size - 4);
      const warmupId = randomUUID();
      const warmupStartedAt = nowIso();
      const warmupT0 = performance.now();
      const write = this.requestWriter(store, { kind: 'model_warmup', parallel, label, warmup_id: warmupId });
      const records = await Promise.all(Array.from({ length: Math.min(parallel, 4) }, async (_, userIdx) => {
        const item = warm.next();
        const start = performance.now() - warmupT0;
        const rec = {
          ...await this.send(model)(item),
          case_id: item.caseId, case_type: item.type, input_chars: item.inputChars,
          user_idx: userIdx, warmup: true, in_window: false,
          t_start_rel: start, t_end_rel: performance.now() - warmupT0,
        };
        write(rec);
        return rec;
      }));
      warmup = {
        warmup_id: warmupId, started_at: warmupStartedAt, ended_at: nowIso(),
        duration_ms: Math.round(performance.now() - warmupT0),
        n_requests: records.length, n_ok: records.filter((r) => r.ok).length,
        n_fail: records.filter((r) => !r.ok).length,
        errors: records.filter((r) => !r.ok).map((r) => ({ type: r.error_type, message: r.error_msg })),
        ready: records.every((r) => r.ok),
      };
      store.put({ kind: 'warmup', key: `warmup|${warmupId}`, parallel, label, ...warmup });
      log(`  모델 워밍업 ${sec(warmup.duration_ms)} · ${warmup.n_ok}/${warmup.n_requests}건 성공`);
    }
    const stabilizationT0 = performance.now();
    await sleep(1500);
    const stabilizationMs = Math.round(performance.now() - stabilizationT0);
    const fit = loadError ? { known: true, loaded: false, load_error: loadError } : await this.server.fitStatus(model.tag);
    if (warmup && !warmup.ready) fit.warmup_error = `모델 워밍업 ${warmup.n_fail}/${warmup.n_requests}건 실패`;
    const gpuNow = this.monitor.lastGpu;
    store.put({
      kind: 'server', key: `server|${label}|p${parallel}|${Date.now()}`, parallel, label,
      engine: this.engine || 'ollama', applied, effective_env: await this.server.effectiveEnv(),
      engine_version: version, ollama_version: this.engine === 'ollama' || !this.engine ? version : null,
      load_ms: loadMs, warmup, stabilization_ms: stabilizationMs, fit, gpu_after_load: gpuNow,
    });
    const onGpu = fit.fully_on_gpu === false ? 'CPU로 일부 밀림' : fit.fully_on_gpu ? 'GPU에 전부 적재' : '확인 불가';
    log(`  ${this.engine || 'ollama'} ${version || '?'} · 로딩 ${sec(loadMs)} · ${onGpu}`
      + (fit.size_vram_bytes ? ` · 모델+KV ${(fit.size_vram_bytes / 1024 ** 3).toFixed(1)}GB` : '')
      + (gpuNow ? ` · GPU 메모리 ${gb(gpuNow.mem_used_mib)}/${gb(gpuNow.mem_total_mib)}` : ''));
    if (fit.others && fit.others.length) log(`  ⚠ 다른 모델도 올라가 있습니다: ${fit.others.join(', ')}`);
    this.currentServer = { model: model.tag, parallel, fit, ready: !loadError && (!warmup || warmup.ready) };
    return fit;
  }

  evalStop(summary, prev, users) {
    const s = this.cfg.stop;
    if (!summary || summary.n_total === 0) return 'no_data';
    if (summary.fail_rate > s.failRate) return 'fail_rate';
    if (summary.e2e_p95_ms !== null && summary.e2e_p95_ms > s.p95E2eMs) return 'p95_over';
    if (prev && prev.rps !== null && summary.rps !== null && summary.rps < prev.rps * (1 + s.minGain)) return 'throughput_plateau';
    if (users * 2 > s.maxUsers) return 'max_users';
    return null;
  }

  usersList() {
    return this.cfg.ladder.users.filter((u) => u <= this.cfg.stop.maxUsers);
  }

  // 저장된 단계만으로 이 라운드를 끝낼 수 있는지(=새로 돌릴 단계가 없는지) 확인한다.
  roundNeedsRun(store, phase, parallel, rep) {
    for (const users of this.usersList()) {
      const s = store.get(`${phase}|p${parallel}|u${users}|rep${rep}`);
      if (!s || s.warmup_reached === false) return true;
      if (s.stop_reason) return false;
    }
    return false;
  }

  async runLadderRound(store, parallel, rep, phase) {
    const model = store.model;
    const roundKey = `${phase}|p${parallel}|rep${rep}|round`;
    if (store.has(roundKey) && store.get(roundKey).status !== 'skipped_warmup_error') return store.get(roundKey);

    const t0 = performance.now();
    if (this.roundNeedsRun(store, phase, parallel, rep)) {
      const fit = await this.prepareServer(store, parallel, `${phase} rep${rep}`);
      if (fit.load_error || fit.warmup_error) {
        return store.put({ kind: 'round', key: roundKey, phase, rep, parallel,
          status: fit.warmup_error ? 'skipped_warmup_error' : 'skipped_load_error', fit });
      }
      if (fit.fully_on_gpu === false) {
        log(`  → VRAM 부족: NUM_PARALLEL=${parallel}은 측정하지 않고 건너뜁니다 (기록만 남김)`);
        return store.put({ kind: 'round', key: roundKey, phase, rep, parallel, status: 'skipped_vram', fit });
      }
    }

    let prev = null;
    const steps = [];
    for (const users of this.usersList()) {
      const key = `${phase}|p${parallel}|u${users}|rep${rep}`;
      let step = store.get(key);
      if (!step || step.warmup_reached === false) step = await this.runLadderStep(store, { phase, parallel, users, rep, key }, prev);
      steps.push(step);
      if (step.warmup_reached === false) {
        return store.put({ kind: 'round', key: roundKey, phase, rep, parallel,
          status: 'skipped_warmup_error', fit: { warmup_error: '사용자별 워밍업 미완료 또는 실패' } });
      }
      if (step.stop_reason) break;
      prev = step.summary;
    }

    const rounded = this.roundStats(steps);
    return store.put({
      kind: 'round', key: roundKey, phase, rep, parallel, status: 'done',
      duration_ms: Math.round(performance.now() - t0),
      last_users: steps.length ? steps[steps.length - 1].users : null,
      last_stop_reason: steps.length ? steps[steps.length - 1].stop_reason : null,
      ...rounded,
    });
  }

  sloOk(summary) {
    const { slo } = this.cfg;
    return summary && summary.n_ok > 0 && summary.fail_rate <= slo.failRate
      && summary.e2e_p95_ms !== null && summary.e2e_p95_ms <= slo.e2eP95Ms;
  }

  roundStats(steps) {
    let peak = null;
    let maxUsersSlo = 0;
    let rpsAtSlo = null;
    for (const s of steps) {
      if (s.summary.rps !== null && (peak === null || s.summary.rps > peak.rps)) peak = { rps: s.summary.rps, users: s.users };
      if (this.sloOk(s.summary) && s.users > maxUsersSlo) {
        maxUsersSlo = s.users;
        rpsAtSlo = s.summary.rps;
      }
    }
    return {
      peak_rps: peak ? peak.rps : null,
      peak_rps_users: peak ? peak.users : null,
      max_users_slo: maxUsersSlo,
      rps_at_max_users_slo: rpsAtSlo,
    };
  }

  async runLadderStep(store, { phase, parallel, users, rep, key }, prev) {
    const model = store.model;
    const attemptId = randomUUID();
    const tag = `${key}#${attemptId}`;
    const startedAt = nowIso();
    this.monitor.setTag(tag);
    const res = await runClosedLoop({
      users,
      cursor: this.pool.cursor(0),
      send: this.send(model),
      measureMs: this.cfg.ladder.measureMs,
      minRequests: this.cfg.ladder.minRequests,
      maxStepMs: this.cfg.ladder.maxStepMs,
      onRecord: this.requestWriter(store, { phase, rep, parallel, users, step_key: key, attempt_id: attemptId }),
    });
    this.monitor.setTag(null);
    const summary = summarizeRecords(res.records, res.window);
    const serverStats = this.monitor.summarize(tag);
    this.monitor.clearTag(tag);
    const stopReason = this.evalStop(summary, prev, users);
    const step = store.put({
      kind: 'step', key, phase, rep, parallel, users, attempt_id: attemptId,
      started_at: startedAt, ended_at: nowIso(), elapsed_ms: Math.round(res.elapsedMs),
      warmup_reached: res.warmupReached, warmup_failed: res.warmupFailed,
      warmup_ms: Math.round(res.warmupMs), warmup_summary: res.warmupSummary,
      measurement_window: res.window, capped: res.capped,
      min_requests_met: summary.n_total >= this.cfg.ladder.minRequests,
      summary, server: serverStats, stop_reason: stopReason,
    });
    this.printStep(model, `${phase} rep${rep} | P=${parallel} U=${users}`, summary, serverStats,
      stopReason ? `멈춤(${stopReasonKo(stopReason)})` : '계속', res.capped);
    return step;
  }

  printStep(model, label, s, srv, tail, capped) {
    log(`[${model.tag} | ${label}] n=${s.n_total} 실패 ${pct(s.fail_rate)} | TTFT p95 ${sec(s.ttft_p95_ms)}`
      + ` | 응답 p50 ${sec(s.e2e_p50_ms)} p95 ${sec(s.e2e_p95_ms)} | ${s.rps ?? '-'} req/s · ${s.tok_s ?? '-'} tok/s`
      + ` | GPU ${srv.gpu_util_avg ?? '-'}% VRAM ${gb(srv.vram_max_mib)} CPU ${srv.cpu_avg ?? '-'}% (스크립트 ${srv.loadgen_cpu_avg ?? '-'}%)`
      + `${capped ? ' | ⚠ 최대 단계 시간 도달' : ''} → ${tail}`);
  }

  // ---------------------------------------------------------- A. 단계적 증가

  async phaseA(store) {
    let prevRound = null;
    for (const parallel of this.cfg.ladder.parallels) {
      const r = await this.runLadderRound(store, parallel, 1, 'A');
      if (r.status !== 'done') break; // 더 큰 동시 처리 수는 VRAM이 더 필요하므로 멈춘다
      if (prevRound && prevRound.peak_rps && r.peak_rps !== null
        && r.peak_rps < prevRound.peak_rps * (1 + this.cfg.parallelMinGain)) {
        if (!store.has('A|parallel_stop')) {
          store.put({
            kind: 'parallel_stop', key: 'A|parallel_stop', after_parallel: parallel,
            reason: `처리량 증가 ${pct(r.peak_rps / prevRound.peak_rps - 1)} < ${pct(this.cfg.parallelMinGain)}`,
          });
        }
        log(`  → NUM_PARALLEL=${parallel}에서 처리량이 거의 안 늘어 더 큰 값은 재지 않습니다`);
        break;
      }
      prevRound = r;
    }
    return this.chooseOptimal(store);
  }

  chooseOptimal(store) {
    const model = store.model;
    const override = this.opts.optimal[model.tag];
    const rounds = this.cfg.ladder.parallels
      .map((p) => store.get(`A|p${p}|rep1|round`))
      .filter((r) => r && r.status === 'done');
    if (rounds.length === 0) {
      log(`  ⚠ ${model.tag}: 측정된 라운드가 없어 최적 설정을 정할 수 없습니다`);
      return null;
    }
    let pick;
    let reason;
    if (override) {
      pick = rounds.find((r) => r.parallel === override) || { parallel: override };
      reason = `--optimal로 지정 (${override})`;
    } else if (rounds.some((r) => r.max_users_slo > 0)) {
      pick = rounds.slice().sort((a, b) => b.max_users_slo - a.max_users_slo
        || (b.rps_at_max_users_slo || 0) - (a.rps_at_max_users_slo || 0))[0];
      reason = `P95 ${this.cfg.slo.e2eP95Ms / 1000}초·실패율 ${pct(this.cfg.slo.failRate)} 이내로 버틴 동시 사용자 수가 가장 큼 (${pick.max_users_slo}명)`;
    } else {
      pick = rounds.slice().sort((a, b) => (b.peak_rps || 0) - (a.peak_rps || 0))[0];
      reason = `목표(P95 ${this.cfg.slo.e2eP95Ms / 1000}초)를 만족한 설정이 없어 최대 처리량 기준으로 선택`;
    }
    const prev = store.get('optimal');
    if (!prev || prev.parallel !== pick.parallel) {
      store.put({
        kind: 'optimal', key: 'optimal', parallel: pick.parallel, reason,
        candidates: rounds.map((r) => ({ parallel: r.parallel, max_users_slo: r.max_users_slo, peak_rps: r.peak_rps })),
      });
    }
    log(`최적 설정 ${model.tag}: NUM_PARALLEL=${pick.parallel} — ${reason}`);
    return pick.parallel;
  }

  // ---------------------------------------------------------- B. 스파이크 · 도착률

  async phaseB(store, parallel) {
    const model = store.model;
    const factors = this.cfg.arrival.factors;
    const arrivalDone = (f) => store.has(`B|arrival|f${f}`);
    if (store.has('B|spike') && (store.has('B|arrival|stop') || factors.every(arrivalDone))) return;

    const fit = await this.prepareServer(store, parallel, 'B');
    if (fit.load_error || fit.warmup_error || fit.fully_on_gpu === false) {
      throw new Error(`${model.tag}: 서버 준비·워밍업을 통과하지 못해 B 측정을 시작하지 않습니다 (${fit.load_error || fit.warmup_error || 'GPU 적재 부족'})`);
    }

    if (!store.has('B|spike')) {
      const key = 'B|spike';
      const attemptId = randomUUID();
      const tag = `${key}#${attemptId}`;
      this.monitor.setTag(tag);
      const res = await runSpike({
        users: this.cfg.spike.users,
        cursor: this.pool.cursor(0),
        send: this.send(model),
        onRecord: this.requestWriter(store, { phase: 'B', kind: 'spike', parallel, users: this.cfg.spike.users, step_key: key, attempt_id: attemptId }),
      });
      this.monitor.setTag(null);
      const summary = summarizeRecords(res.records, res.window);
      const srv = this.monitor.summarize(tag);
      this.monitor.clearTag(tag);
      store.put({
        kind: 'spike', key, parallel, users: this.cfg.spike.users, attempt_id: attemptId,
        drain_ms: Math.round(res.elapsedMs), summary, server: srv,
      });
      this.printStep(model, `B 스파이크 | P=${parallel} ${this.cfg.spike.users}명 동시`, summary, srv,
        `전부 끝날 때까지 ${sec(res.elapsedMs)}`);
      await sleep(3000); // 대기열이 비도록 잠깐 쉰다
    }

    const optimalRound = store.get(`A|p${parallel}|rep1|round`);
    const capacity = optimalRound && optimalRound.peak_rps;
    if (!capacity) {
      log(`  ⚠ ${model.tag}: 최대 처리량을 알 수 없어 도착률 테스트를 건너뜁니다`);
      return;
    }
    for (const f of factors) {
      const key = `B|arrival|f${f}`;
      if (store.has('B|arrival|stop')) break;
      if (store.has(key)) continue;
      const rate = Math.max(0.02, round(capacity * f, 3));
      const attemptId = randomUUID();
      const tag = `${key}#${attemptId}`;
      this.monitor.setTag(tag);
      const res = await runOpenLoop({
        rate,
        durationMs: this.cfg.arrival.durationMs,
        cursor: this.pool.cursor(0),
        send: this.send(model),
        seed: this.cfg.seed + Math.round(f * 1000),
        maxInFlight: this.cfg.arrival.maxInFlight,
        onRecord: this.requestWriter(store, { phase: 'B', kind: 'arrival', parallel, rate, factor: f, step_key: key, attempt_id: attemptId }),
      });
      this.monitor.setTag(null);
      const summary = summarizeRecords(res.records, res.window);
      const srv = this.monitor.summarize(tag);
      this.monitor.clearTag(tag);
      store.put({
        kind: 'arrival', key, parallel, factor: f, offered_rps: rate, capacity_rps: capacity, attempt_id: attemptId,
        dropped: res.dropped, max_in_flight: res.maxInFlight, drain_ms: Math.round(res.drainMs), summary, server: srv,
      });
      this.printStep(model, `B 도착률 | P=${parallel} 초당 ${rate}건 (최대 처리량의 ${f}배)`, summary, srv,
        `미완료 요청 최대 ${res.maxInFlight}건 (처리·대기 합계)`);
      if (summary.fail_rate !== null && summary.fail_rate > this.cfg.arrival.abortFailRate) {
        store.put({ kind: 'arrival_stop', key: 'B|arrival|stop', after_factor: f, reason: `실패율 ${pct(summary.fail_rate)}` });
        log('  → 실패율이 50%를 넘어 더 빠른 도착률은 생략합니다');
        break;
      }
      await sleep(2000);
    }
  }

  // ---------------------------------------------------------- C. 반복

  async phaseC(stores, optimalOf) {
    const extra = this.cfg.repeats.extra;
    for (let rep = 2; rep <= 1 + extra; rep++) {
      for (const store of stores) {
        const parallel = optimalOf.get(store.model.tag);
        if (!parallel) continue;
        const roundKey = `C|p${parallel}|rep${rep}|round`;
        if (store.has(roundKey) && store.get(roundKey).status !== 'skipped_warmup_error') continue;
        const ref = store.get(`A|p${parallel}|rep1|round`);
        const estimate = (ref && ref.duration_ms ? ref.duration_ms : 10 * 60_000) + this.cfg.restartOverheadMs;
        const remain = this.budgetMs - this.elapsedMs();
        if (estimate > remain) {
          log(`반복 ${rep}회차 ${store.model.tag}: 계획 시간 초과 예상 — 측정은 계속합니다`);
        }
        log(`반복 ${rep}회차: ${store.model.tag} · NUM_PARALLEL=${parallel}`);
        // 현재 모델의 반복 측정도 같은 기록 파일에 이어 쓴다.
        this.monitor.setOutput(store.monitorPath);
        await this.runLadderRound(store, parallel, rep, 'C');
      }
    }
  }

  // ---------------------------------------------------------- 전체

  async runAll(models, date) {
    const info = await hostInfo();
    const stores = models.map((m) => new ModelStore(m, makeRunId(m, date, this.cfg.profile)));
    this.stores = stores;
    for (const s of stores) {
      s.writeMeta({
        profile: this.cfg.profile, env: envTag(), host: info, config: this.cfg,
        engine: this.engine || 'ollama', endpoint: this.server.host || OLLAMA_HOST,
        deployment: this.opts.deployment || null,
        transport: this.opts.transport || { http_keep_alive: true, automatic_retries: 0,
          request_deadline_includes_connection: true },
        think: s.model.think === undefined ? null : s.model.think, started_at: nowIso(),
        prompt_pool: { unique_cases: this.pool.size, seed: this.cfg.seed,
          source: this.pool.source, sha256: this.pool.sha256, categories: this.pool.categories },
        server_control: await this.server.detectMode(),
      });
    }
    log(`서버 제어 방식: ${this.server.mode} · 질문 ${this.pool.size}건 · 시간 예산 ${Math.round(this.budgetMs / 60000)}분`);
    this.monitor.start();

    const optimalOf = new Map();
    for (const store of stores) {
      if (this.opts.signal && this.opts.signal.aborted) throw new Error('측정 중단 요청');
      this.monitor.setOutput(store.monitorPath);
      try {
        let p;
        if (this.opts.phases.includes('A')) {
          log(`===== A. 단계적 증가: ${store.model.tag} (${store.runId}) =====`);
          p = await this.phaseA(store);
        } else {
          p = this.chooseOptimal(store);
        }
        optimalOf.set(store.model.tag, p);

        if (p && this.opts.phases.includes('B')) {
          log(`===== B. 스파이크·도착률: ${store.model.tag} (NUM_PARALLEL=${p}) =====`);
          await this.phaseB(store, p);
        }
        if (p && this.opts.phases.includes('C')) {
          log(`===== C. 반복 측정: ${store.model.tag} =====`);
          await this.phaseC([store], optimalOf);
        }
      } finally {
        this.monitor.setTag(null);
        try {
          if (this.currentServer) {
            log(`조합 정리: ${store.model.tag} — 다음 모델 전에 GPU 해제를 확인합니다`);
            const stopped = await this.server.stop();
            store.put({ kind: 'server_stop', key: `server_stop|${Date.now()}`, ...stopped });
            if (!stopped.gpu_release.known) log(`  GPU 해제 미확인: ${stopped.gpu_release.reason}`);
            this.currentServer = null;
          }
        } finally {
          this.monitor.setOutput(null);
        }
      }
    }

    for (const s of stores) s.writeMeta({ finished_at: nowIso(), elapsed_min: Math.round(this.elapsedMs() / 60000) });
    log(`전체 완료 · ${Math.round(this.elapsedMs() / 60000)}분 소요`);
  }

  freeze() {
    if (this.stores) for (const s of this.stores) s.frozen = true;
  }

  async shutdown({ restore }) {
    this.freeze();
    this.monitor.stop();
    if (this.stores) for (const s of this.stores) s.close();
    if (restore) {
      try {
        log(`Ollama 설정 원복: ${await this.server.restore()}`);
      } catch (e) {
        log(`⚠ Ollama 원복 실패: ${e.message} — 'node load_test_v1/scripts/run_load_test.js --restore-ollama'로 다시 시도하세요`);
      }
    }
  }
}

function stopReasonKo(r) {
  return {
    no_data: '측정 데이터 없음', fail_rate: '실패율 초과', p95_over: 'P95 10초 초과',
    throughput_plateau: '처리량 정체', max_users: '최대 사용자 도달',
  }[r] || r;
}

// ---------------------------------------------------------------- 사전 점검 · 계획 출력

function estimatePlan(cfg, models) {
  // 대략적인 추정 — v3 순차 p50을 기준으로 단계당 시간을 어림한다.
  let totalMs = 0;
  const lines = [];
  for (const m of models) {
    const e2e = m.baselineP50Sec * 1000;
    let modelMs = 0;
    // 가정: T4에서는 동시 처리 8 부근에서 처리량이 정체되고(16은 생략),
    //       각 라운드는 사용자 수가 동시 처리 수의 2배쯤에서 처리량 정체로 멈춘다.
    const parallels = cfg.ladder.parallels.slice(0, 3);
    for (const p of parallels) {
      let roundMs = cfg.restartOverheadMs;
      for (const u of cfg.ladder.users.filter((x) => x <= 2 * p)) {
        const slow = 1 + 0.15 * (Math.min(u, p) - 1);
        const perReq = e2e * slow;
        const warm = Math.min(cfg.requestTimeoutMs, perReq * Math.ceil(u / p));
        const measure = Math.min(cfg.ladder.maxStepMs, Math.max(cfg.ladder.measureMs, (cfg.ladder.minRequests * perReq) / Math.min(u, p)));
        roundMs += warm + measure + perReq;
      }
      modelMs += roundMs;
    }
    const bMs = cfg.restartOverheadMs + cfg.requestTimeoutMs + cfg.arrival.factors.length * (cfg.arrival.durationMs + 10_000);
    const cMs = cfg.repeats.extra * (modelMs / parallels.length);
    lines.push(`  ${m.tag.padEnd(10)} A 약 ${Math.round(modelMs / 60000)}분 · B 약 ${Math.round(bMs / 60000)}분 · C 약 ${Math.round(cMs / 60000)}분`);
    totalMs += modelMs + bMs + cMs;
  }
  return { totalMs, lines };
}

function printPlan(cfg, models, opts, date) {
  const { totalMs, lines } = estimatePlan(cfg, models);
  console.log(`\n=== 부하 테스트 계획 (${cfg.profile}) ===`);
  console.log(`결과 위치: ${suite.repoRel(suite.resultsDir())}`);
  console.log(`Ollama: ${OLLAMA_HOST} · 서버 제어: ${opts.serverControl}`);
  console.log('모델 / run_id:');
  for (const m of models) console.log(`  ${m.tag.padEnd(10)} think=${m.think === undefined ? '(보내지 않음)' : m.think} → ${makeRunId(m, date, cfg.profile)}`);
  console.log(`고정 설정: temperature ${cfg.generation.temperature} · num_ctx ${cfg.generation.num_ctx} · num_predict ${cfg.generation.num_predict} · format ${cfg.generation.format} · stream true · keep_alive ${cfg.generation.keepAlive}`);
  console.log(`서버 설정: FLASH_ATTENTION=${cfg.server.flashAttention} · KV_CACHE_TYPE=${cfg.server.kvCacheType} · MAX_QUEUE=${cfg.server.maxQueue} · MAX_LOADED_MODELS=${cfg.server.maxLoadedModels}`);
  console.log(`A. 동시 처리 수 ${cfg.ladder.parallels.join('→')} × 동시 사용자 ${cfg.ladder.users.filter((u) => u <= cfg.stop.maxUsers).join('→')}`);
  console.log(`   단계: 워밍업 후 ${cfg.ladder.measureMs / 1000}초 · 최소 ${cfg.ladder.minRequests}건 · 최대 ${cfg.ladder.maxStepMs / 1000}초`);
  console.log(`   멈춤: P95>${cfg.stop.p95E2eMs / 1000}초 · 실패율>${pct(cfg.stop.failRate)} · 처리량 증가<${pct(cfg.stop.minGain)} · VRAM 부족 · 최대 ${cfg.stop.maxUsers}명`);
  console.log(`B. 스파이크 ${cfg.spike.users}명 · 도착률 최대 처리량 × ${cfg.arrival.factors.join('/')} 각 ${cfg.arrival.durationMs / 1000}초`);
  console.log(`C. 최적 설정 반복 ${cfg.repeats.extra}회 추가 (계획 시간 초과 시에도 측정)`);
  console.log(`타임아웃 ${cfg.requestTimeoutMs / 1000}초 · 판단 기준 P95 ${cfg.slo.e2eP95SoftMs / 1000}~${cfg.slo.e2eP95Ms / 1000}초 · 시간 예산 ${Math.round((opts.budgetMin ? opts.budgetMin * 60000 : cfg.budgetMs) / 60000)}분`);
  console.log('예상 시간 (대략, 실제는 모델이 얼마나 빨리 멈춤 조건에 걸리느냐에 따라 달라짐):');
  for (const l of lines) console.log(l);
  console.log(`  합계 약 ${Math.round(totalMs / 60000)}분\n`);
}

async function preflight(server, models, cfg) {
  const major = Number(process.versions.node.split('.')[0]);
  if (major < 20) throw new Error(`Node.js 20 이상이 필요합니다 (현재 ${process.version})`);
  if (!(await server.isUp())) {
    if (server.mode !== 'process') throw new Error(`Ollama 서버가 응답하지 않습니다: ${OLLAMA_HOST}`);
    log('Ollama 서버가 꺼져 있어 먼저 띄웁니다');
    await server.apply({ parallel: cfg.ladder.parallels[0], ...cfg.server, numCtx: cfg.generation.num_ctx });
  }
  const installed = await server.installedModels();
  const missing = models.filter((m) => !installed.includes(m.tag)).map((m) => m.tag);
  if (missing.length) {
    throw new Error(`설치되지 않은 모델이 있습니다: ${missing.join(', ')}\n  → ${missing.map((t) => `ollama pull ${t}`).join(' && ')}`);
  }
  const gpu = await run('nvidia-smi', ['-L'], { timeoutMs: 5000 });
  if (gpu.code !== 0) log('⚠ nvidia-smi가 없습니다. GPU 지표 없이 진행합니다 (EC2라면 드라이버를 확인하세요).');
}

// ---------------------------------------------------------------- main

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const cfg = loadConfig(opts.profile);
  const date = opts.runDate || todayStamp();

  let models = cfg.models;
  if (opts.models) {
    const unknown = opts.models.filter((t) => !cfg.models.some((m) => m.tag === t));
    if (unknown.length) throw new Error(`config에 없는 모델: ${unknown.join(', ')}`);
    models = cfg.models.filter((m) => opts.models.includes(m.tag));
    log(`⚠ --models로 ${models.map((m) => m.tag).join(', ')}만 실행합니다 (디버깅용). 정식 측정은 네 모델 모두 돌려야 합니다.`);
  }

  if (!opts.dryRun) require('./lib/automation_guard').assertAutomationLease();
  if (opts.restoreOnly) {
    const server = new OllamaServer({ mode: opts.serverControl, logDir: suite.logsDir() });
    log(await server.restore());
    return;
  }

  printPlan(cfg, models, opts, date);
  if (opts.dryRun) return;

  const test = new LoadTest(cfg, opts);
  await test.server.detectMode();
  await preflight(test.server, models, cfg);

  let interrupted = false;
  const onSignal = async (sig) => {
    if (interrupted) return;
    interrupted = true;
    log(`${sig} 수신 — 중단합니다. 같은 명령을 다시 실행하면 끝난 단계는 건너뛰고 이어서 진행합니다.`);
    await test.shutdown({ restore: !opts.noRestore });
    process.exit(130);
  };
  process.on('SIGINT', () => onSignal('SIGINT'));
  process.on('SIGTERM', () => onSignal('SIGTERM'));

  try {
    await test.runAll(models, date);
  } finally {
    if (!interrupted) await test.shutdown({ restore: !opts.noRestore });
  }
  console.log(`\n다음: node load_test_v1/scripts/summarize.js --run-date ${date}${cfg.profile === 'quick' ? ' --profile quick' : ''}`);
}

module.exports = { LoadTest, ModelStore, makeRunId, todayStamp, parseArgs };
if (require.main === module) main().catch((e) => {
  console.error(`\n실패: ${e.message}`);
  process.exit(1);
});
