'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { randomUUID, createHash } = require('node:crypto');
const { createMockConfig } = require('./create_mock_config');
const { loadConfig, identityHash } = require('../lib/config');
const { main, options, outputDirectory, trend } = require('../run_benchmark');
const { Runtime } = require('../lib/runtime');
const ROOT = path.resolve(__dirname, '../..');
const sha = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const cli = args => new Promise(resolve => execFile(process.execPath, [path.join(ROOT, 'scripts/run_benchmark.js'), ...args],
  { timeout: 90000, windowsHide: true, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => resolve({ code: error?.code || 0, stdout, stderr })));

test('CLI rejects ambiguous options and v1 output targets', () => {
  assert.throws(() => options(['--config', 'x', '--wat']), /옵션/);
  assert.throws(() => options(['--config', 'x', '--phase', 'foo']), /phase/);
  assert.throws(() => outputDirectory(path.join(ROOT, '../load_test_v1/try9')), /results/);
  assert.throws(() => outputDirectory(path.join(ROOT, 'results')), /results/);
});
test('arrival backlog trend uses regularly sampled in-flight points', () => {
  const result = trend([0, 1, 2, 3].map(x => ({ at_ms: x * 1000, pending: 2 * x })), { startMs: 0, endMs: 3000 });
  assert.equal(result.slope_requests_per_sec, 2);
  assert.equal(trend([], { startMs: 0, endMs: 100 }).status, 'insufficient_samples');
});
test('pending arrival explicitly preserves each expected rate factor', async () => {
  const base = path.join(ROOT, 'results', `pending_arrival_${randomUUID()}`);
  const fixture = createMockConfig({ outputDir: path.join(base, 'fixture'), basePort: 23441 });
  const result = await cli(['--config', fixture.config, '--mock', '--phase', 'arrival', '--out', path.join(base, 'pending')]);
  assert.equal(result.code, 1, result.stderr);
  const report = read(path.join(base, 'pending/report.json'));
  assert.equal(report.steps.length, 12);
  for (const candidate of read(fixture.config).candidates) assert.deepEqual(report.steps.filter(x => x.candidate_id === candidate.id).map(x => x.factor), [0.7, 0.9, 1.1]);
  assert.ok(report.steps.every(x => x.status === 'not_measured' && x.users === null));
});
test('cleanup failure invalidates the round, prevents the next engine and retains its lock', async t => {
  const base = path.join(ROOT, 'results', `cleanup_failure_${randomUUID()}`), out = path.join(base, 'smoke');
  const fixture = createMockConfig({ outputDir: path.join(base, 'fixture'), basePort: 24441, delayMs: 3 });
  const config = read(fixture.config); config.profiles.smoke = { users: [1], measure_ms: 80, repeats: 1, min_valid_requests: 1, warmup_per_user: 1 };
  write(fixture.config, config);
  const launched = [], runtimes = [];
  t.after(() => {
    assert.ok(runtimes.every(r => r.child === null && r.exited === true));
    const lock = path.join(ROOT, '.benchmark.lock');
    if (fs.existsSync(lock)) {
      const owner = read(lock); assert.equal(owner.out, out); assert.equal(owner.pid, process.pid);
      fs.unlinkSync(lock); // This test owns the lock; its only mock process has already exited.
    }
  });
  const code = await main(['--config', fixture.config, '--mock', '--phase', 'smoke', '--out', out], {
    runtimeFactory: (candidate, directory, settings) => {
      const runtime = new Runtime(candidate, directory, settings); runtimes.push(runtime);
      const start = runtime.start.bind(runtime), stop = runtime.stop.bind(runtime);
      runtime.start = () => { launched.push(candidate.id); return start(); };
      runtime.stop = async () => ({ ...await stop(), process_exit_confirmed: false });
      return runtime;
    },
  });
  assert.equal(code, 1);
  assert.deepEqual(launched, [config.candidates[0].id]);
  const report = read(path.join(out, 'report.json'));
  assert.equal(report.status, 'cleanup_failed');
  const first = report.steps.find(x => x.candidate_id === launched[0]);
  assert.equal(first.status, 'cleanup_failed'); assert.equal(first.cleanup_verified, false);
  assert.ok(report.steps.filter(x => x.candidate_id !== launched[0]).every(x => x.status === 'not_measured'));
  assert.equal(report.candidates[0].capacity.c_performance_candidate, null);
  assert.equal(fs.existsSync(path.join(ROOT, '.benchmark.lock')), true);
});

test('four mock engines: dry-run, fixed windows, full quality, gated repeats, arrival, cleanup', { timeout: 90000 }, async t => {
  const base = path.join(ROOT, 'results', `integration_${randomUUID()}`);
  const fixture = createMockConfig({ outputDir: path.join(base, 'fixture'), basePort: 22441, delayMs: 3 });
  const config = read(fixture.config);
  config.profiles = Object.fromEntries(['smoke', 'screen', 'confirm'].map(name => [name,
    { users: [1, 4], measure_ms: 120, repeats: name === 'confirm' ? 3 : 1, min_valid_requests: 3, warmup_per_user: 1 }]));
  config.arrival = { duration_ms: 150, max_in_flight: 500 };
  for (const c of config.candidates) delete c.semantic_gate;
  write(fixture.config, config);
  const args = ['--config', fixture.config, '--mock'];
  await t.test('dry-run executes no process and writes no result directory', async () => {
    const target = path.join(base, 'dry');
    const result = await cli([...args, '--dry-run', '--out', target]);
    assert.equal(result.code, 0, result.stderr);
    assert.equal(read(fixture.config).mock, true);
    assert.equal(fs.existsSync(target), false);
    const data = JSON.parse(result.stdout); assert.equal(data.commands_executed, false);
  });
  await t.test('mock config cannot run in real mode', async () => {
    const result = await cli(['--config', fixture.config, '--out', path.join(base, 'forbidden')]);
    assert.equal(result.code, 1); assert.match(result.stderr, /mock/);
    assert.equal(fs.existsSync(path.join(base, 'forbidden')), false);
  });
  await t.test('unreviewed quality blocks confirm before server launch', async () => {
    const result = await cli([...args, '--phase', 'confirm', '--out', path.join(base, 'pending')]);
    assert.equal(result.code, 1, result.stderr);
    const report = read(path.join(base, 'pending/report.json'));
    assert.equal(report.steps.length, 24);
    assert.ok(report.steps.every(x => x.status === 'not_measured'));
    assert.ok(report.candidates.every(x => x.capacity.c_slo === null));
  });
  await t.test('screen measures all requested U and keeps quality pending', async () => {
    const result = await cli([...args, '--phase', 'screen', '--out', path.join(base, 'screen')]);
    assert.equal(result.code, 0, result.stderr + result.stdout);
    const report = read(path.join(base, 'screen/report.json'));
    assert.equal(report.steps.length, 8);
    assert.ok(report.steps.every(x => x.status === 'completed' && x.window.endMs - x.window.startMs === 120));
    assert.ok(report.steps.every(x => x.summary.n_valid > 0 && x.warmup_reached === true));
    assert.ok(report.candidates.every(x => x.capacity.c_slo === null));
    assert.ok(report.steps.every(x => x.P === 4));
    assert.ok(report.steps.every(x => x.cleanup_verified === true && x.cleanup.runtime.process_exit_confirmed === true && x.cleanup.runtime.port_released === true));
    assert.ok(report.rounds.every(x => x.cleanup.status === 'passed' && x.cleanup.gpu.scope === 'mock'));
  });
  await t.test('all 300 quality answers are saved, hashed, and then synthetically reviewed', async () => {
    const result = await cli([...args, '--phase', 'quality', '--out', path.join(base, 'quality')]);
    assert.equal(result.code, 0, result.stderr + result.stdout);
    const report = read(path.join(base, 'quality/report.json'));
    const loaded = loadConfig(fixture.config, { mock: true });
    for (const candidate of config.candidates) {
      const step = report.steps.find(x => x.candidate_id === candidate.id);
      assert.equal(step.report.case_count, 300); assert.equal(step.report.n_valid, 300);
      assert.equal(step.report.semantic_quality_status, 'pending');
      assert.equal(step.report.cleanup_verified, true);
      assert.equal(step.quality_report.sha256, sha(step.quality_report.path));
      candidate.quality_report = step.quality_report;
      const evaluation = path.join(base, 'fixture', `${candidate.id}_evaluation.json`);
      write(evaluation, { mock: true, method: 'mock_fixture', passed: true,
        limitation: 'Synthetic gate plumbing only. No model semantic accuracy evaluated.' });
      const gateFile = path.join(base, 'fixture', `${candidate.id}_gate.json`);
      write(gateFile, { mock: true, method: 'mock_fixture', passed: true, reviewer: 'integration_mock',
        rubric: 'Synthetic approval for control flow testing only', workload_sha256: loaded.workload.sha256,
        candidate_identity_sha256: identityHash(loaded.candidates.find(c => c.id === candidate.id)),
        quality_report_sha256: candidate.quality_report.sha256, evaluation: { path: evaluation, sha256: sha(evaluation) } });
      candidate.semantic_gate = { path: gateFile, sha256: sha(gateFile) };
    }
    write(fixture.config, config);
  });
  await t.test('three independent repeats expose only simulated capacity', async () => {
    const result = await cli([...args, '--phase', 'confirm', '--out', path.join(base, 'confirm')]);
    assert.equal(result.code, 0, result.stderr + result.stdout);
    const report = read(path.join(base, 'confirm/report.json'));
    assert.equal(report.steps.length, 24);
    assert.ok(report.candidates.every(c => c.cleanup_verified === true));
    assert.ok(report.candidates.every(c => c.capacity.c_slo === null && c.capacity.simulated_c_slo === 4));
    assert.equal(report.steps[0].candidate_id, config.candidates[0].id);
    assert.equal(report.steps[8].candidate_id, config.candidates[1].id);
  });
  await t.test('open arrivals use all common factors without claiming sustainable lambda', async () => {
    const result = await cli([...args, '--phase', 'arrival', '--baseline', path.join(base, 'confirm/report.json'), '--out', path.join(base, 'arrival')]);
    assert.equal(result.code, 0, result.stderr + result.stdout);
    const report = read(path.join(base, 'arrival/report.json'));
    assert.equal(report.steps.length, 12);
    assert.deepEqual(report.steps.slice(0, 3).map(x => x.factor), [0.7, 0.9, 1.1]);
    assert.ok(report.steps.every(x => x.lambda_slo === null && x.baseline.valid_rps > 0));
  });
  await t.test('owned mock processes and suite lock are released', async () => {
    assert.equal(fs.existsSync(path.join(ROOT, '.benchmark.lock')), false);
    for (const c of config.candidates) {
      await assert.rejects(fetch(`${c.host}/v1/models`, { signal: AbortSignal.timeout(500) }));
    }
  });
});
