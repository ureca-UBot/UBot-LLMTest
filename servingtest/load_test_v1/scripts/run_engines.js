'use strict';
// Linux EC2에서만 실제 실행. --dry-run은 기동·GPU 조회·결과 쓰기를 하지 않는다.
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { loadConfig } = require('./config/load_config');
const { LoadTest, makeRunId, todayStamp } = require('./run_load_test');
const { loadMatrix, configHash, launchSpec, ENGINES, apiModelName } = require('./lib/engine_config');
const { OpenAiServer } = require('./lib/openai_server');
const { streamChat } = require('./lib/openai_stream_client');
const suite = require('./lib/suite');

function parseArgs(argv) {
  const o = { config: path.join(__dirname, 'config', 'engines.example.json'), profile: 'full',
    engines: ENGINES, models: null, runDate: todayStamp(), dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = () => { if (!argv[i + 1]) throw new Error(`${arg} 뒤에 값이 필요합니다`); return argv[++i]; };
    if (arg === '--dry-run') o.dryRun = true;
    else if (arg === '--config') o.config = path.resolve(value());
    else if (arg === '--profile') o.profile = value();
    else if (arg === '--engines') o.engines = value().split(',');
    else if (arg === '--models') o.models = value().split(',');
    else if (arg === '--run-date') o.runDate = value();
    else throw new Error(`알 수 없는 옵션: ${arg}`);
  }
  if (!o.engines.length || o.engines.some((e) => !ENGINES.includes(e))) throw new Error('엔진: llama.cpp,vllm,sglang');
  if (!/^\d{8}$/.test(o.runDate)) throw new Error('run-date는 YYYYMMDD 형식입니다');
  return o;
}

function deploymentModel(base, entry) {
  return { ...base, cond: `${base.cond.replace(/_load$/, '')}_${entry.engine.replace('.', '-')}_${configHash(entry).slice(0, 12)}_load` };
}

function acquireLock(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'engine_benchmark.lock');
  const owner = JSON.stringify({ pid: process.pid, owner: randomUUID(), created_at: new Date().toISOString() });
  try { fs.writeFileSync(file, owner, { flag: 'wx' }); }
  catch (e) { if (e.code === 'EEXIST') throw new Error(`다른 실행의 잠금이 있습니다: ${file}. 종료된 실행의 PID와 GPU 해제를 확인한 뒤 잠금을 정리하세요.`); throw e; }
  return () => { if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === owner) fs.unlinkSync(file); };
}

async function runMatrix(entries, opts, deps = {}) {
  const createTest = deps.createTest || ((cfg, entry, model) => {
    const server = new OpenAiServer({ entry, logDir: suite.logsDir() });
    return new LoadTest(cfg, { engine: entry.engine, server, deployment: entry,
      transport: { http_keep_alive: false, automatic_retries: 0,
        request_deadline_includes_connection: true },
      phases: ['A', 'B', 'C'], optimal: {}, serverControl: 'managed-process', signal: opts.signal,
      send: (item, m, generation, timeoutMs) => streamChat({ host: server.host, model: apiModelName(entry),
        messages: item.messages, generation, think: m.think, timeoutMs,
        mergeSystem: entry.merge_system_to_user === true }) });
  });
  const results = [];
  for (const [entryIndex, entry] of entries.entries()) {
    if (opts.signal && opts.signal.aborted) break;
    const row = { engine: entry.engine, model: entry.model, config_sha256: configHash(entry),
      started_at: new Date().toISOString(), status: entry.enabled ? 'running' : 'unconfigured' };
    if (!entry.enabled) { row.reason = entry.reason || 'EC2 모델 파일·엔진 버전 설정 필요'; results.push(row); continue; }
    const cfg = loadConfig(opts.profile);
    const model = deploymentModel(cfg.models.find((m) => m.tag === entry.model), entry);
    cfg.models = [model]; cfg.engine = entry.engine;
    row.run_id = makeRunId(model, opts.runDate, cfg.profile);
    const test = createTest(cfg, entry, model);
    if (deps.setActive) deps.setActive(test);
    let failure;
    try {
      await test.runAll([model], opts.runDate);
      const store = test.stores && test.stores[0];
      row.status = store && store.has('optimal') ? 'done' : 'unavailable';
      if (row.status === 'done') {
        const parallel = store.get('optimal').parallel;
        const repeatsDone = Array.from({ length: cfg.repeats.extra }, (_, i) => store.get(`C|p${parallel}|rep${i + 2}|round`))
          .every((r) => r && r.status === 'done');
        const arrivalDone = store.has('B|arrival|stop') || cfg.arrival.factors.every((f) => store.has(`B|arrival|f${f}`));
        if (!store.has('B|spike') || !arrivalDone || !repeatsDone) {
          row.status = 'incomplete'; row.reason = 'B/C 측정 미완료 또는 반복 워밍업 실패; 원본 단계 기록 확인';
        }
      }
      if (row.status === 'unavailable') row.reason = '로딩·GPU 적재·워밍업 등 준비 조건 미충족; 원본 단계 기록 확인';
    } catch (e) { failure = e; row.status = 'failed'; row.reason = e.message; }
    finally {
      try { row.cleanup = await test.server.stop(); }
      catch (e) { failure = Object.assign(e, { code: 'CLEANUP_FAILED' }); row.status = 'cleanup_failed'; row.reason = e.message; }
      await test.shutdown({ restore: false });
      if (deps.setActive) deps.setActive(null);
    }
    row.ended_at = new Date().toISOString(); results.push(row);
    if (deps.onResult) deps.onResult(results);
    if (failure && failure.code === 'CLEANUP_FAILED') {
      failure.results = results.concat(entries.slice(entryIndex + 1).map((remaining) => ({
        engine: remaining.engine, model: remaining.model, status: 'not_run', reason: '이전 조합 정리 실패로 전환 중단' })));
      throw failure; // 다음 엔진 기동을 반드시 막는다.
    }
  }
  return results;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const cfg = loadConfig(opts.profile);
  if (opts.models && opts.models.some((m) => !cfg.models.some((x) => x.tag === m))) throw new Error('config에 없는 모델');
  const matrix = loadMatrix(opts.config);
  // 누락된 조합도 결과에서 사라지지 않게 명시적으로 채운다.
  const entries = opts.engines.flatMap((engine) => cfg.models.filter((m) => !opts.models || opts.models.includes(m.tag)).map((model) =>
    matrix.find((entry) => entry.engine === engine && entry.model === model.tag)
      || { engine, model: model.tag, enabled: false, reason: '설정 파일에 조합 없음' }));
  for (const entry of entries) {
    console.log(`${entry.engine}/${entry.model}: ${entry.enabled ? '실행 대상' : '미설정'}${entry.reason ? ` (${entry.reason})` : ''}`);
    if (entry.enabled && opts.dryRun) console.log(JSON.stringify(launchSpec(entry, { parallel: cfg.ladder.parallels[0], numCtx: cfg.generation.num_ctx })));
  }
  if (opts.dryRun) { console.log('계획 확인 완료. 서버 기동·GPU 조회·측정은 수행하지 않았습니다.'); return; }
  require('./lib/automation_guard').assertAutomationLease();
  if (process.platform !== 'linux') throw new Error('실제 측정은 Linux EC2에서 실행하세요. 이 PC에서는 --dry-run만 사용합니다.');
  const release = acquireLock(suite.logsDir());
  const controller = new AbortController(); opts.signal = controller.signal;
  let active = null, stopping = false;
  const report = path.join(suite.summaryDir(), `engine_matrix_${opts.runDate}${opts.profile === 'quick' ? '_quick' : ''}.json`);
  const save = (results) => {
    fs.mkdirSync(path.dirname(report), { recursive: true });
    fs.writeFileSync(report, JSON.stringify({ config: opts.config, profile: opts.profile, combinations: results }, null, 2));
  };
  const interrupt = async () => {
    if (stopping) return;
    stopping = true; controller.abort();
    try { if (active) { active.freeze(); await active.server.stop(); await active.shutdown({ restore: false }); } }
    catch (e) { console.error(`중단 정리 실패: ${e.message}`); }
    finally { release(); process.exit(130); }
  };
  process.on('SIGINT', interrupt); process.on('SIGTERM', interrupt);
  try {
    const results = await runMatrix(entries, opts, { setActive: (test) => { active = test; }, onResult: save });
    save(results);
    console.log(`조합 결과: ${report}`);
    if (!results.some((r) => r.status === 'done') || results.some((r) => !['done', 'unconfigured'].includes(r.status))) process.exitCode = 1;
  } catch (e) { if (e.results) save(e.results); throw e; }
  finally { process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt); release(); }
}

module.exports = { parseArgs, deploymentModel, acquireLock, runMatrix };
if (require.main === module) main().catch((e) => { console.error(`실패: ${e.message}`); process.exitCode = 1; });
