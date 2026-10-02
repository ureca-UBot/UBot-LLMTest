'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { recoverLocalHttpLock } = require('./recover_local_http_lock');
const { baselineEnvelope } = require('./local_gpu_observation');
const RESULTS = path.resolve(__dirname, '../../results');
function observation(memory = 2275) {
  return { known: true, gpu: { index: 0, uuid: 'GPU-fixture', name: 'RTX fixture', memory_used_mib: memory,
    memory_total_mib: 12288, driver_version: 'fixture' } };
}
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(RESULTS, 'mock-recovery-'));
  t.after(() => {
    const relative = path.relative(RESULTS, path.resolve(dir));
    assert(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const originalDir = path.join(dir, 'original'); fs.mkdirSync(originalDir);
  const sourceReportFile = path.join(originalDir, 'report.json'), lockPath = path.join(dir, '.benchmark.lock');
  const source = { scope: 'local_http_capacity_exploration', mock: false,
    gpu_baseline: baselineEnvelope([observation(2237), observation(2241), observation(2252)]),
    candidates: [{ id: 'ollama_p4', candidate: { host: 'http://127.0.0.1:19551', runtime: { mode: 'docker' } },
      runtime_cleanup: { process_exit_confirmed: true, port_released: true } }] };
  fs.writeFileSync(sourceReportFile, JSON.stringify(source));
  fs.writeFileSync(lockPath, JSON.stringify({ scope: source.scope, out: originalDir, pid: 123456, token: 'old-token' }));
  const original = fs.readFileSync(sourceReportFile), lock = fs.readFileSync(lockPath);
  let snapshots = 0, commands = 0, portCalls = 0;
  return { dir, source, sourceReportFile, lockPath, original, lock,
    options: { lockPath, sourceReportFile, outputDir: path.join(dir, 'recovery'),
      commandRunner: async (command, args) => { commands++; assert.equal(command, 'docker');
        assert.deepEqual(args, ['ps', '--all', '--filter', 'label=llm.benchmark.session', '--format', '{{.ID}}']);
        assert(fs.existsSync(lockPath)); return { code: 0, stdout: '' }; },
      snapshot: async () => { snapshots++; assert(fs.existsSync(lockPath)); return observation(); },
      isProcessAlive: async () => false,
      portAvailable: async (host, port) => { portCalls++; assert.equal(host, '127.0.0.1'); assert(port >= 19551 && port <= 19556); return true; },
      recoveryIntervalMs: 1, recoveryTimeoutMs: 200 },
    counts: () => ({ snapshots, commands, portCalls }) };
}
function unchanged(f) {
  assert.deepEqual(fs.readFileSync(f.sourceReportFile), f.original);
  assert.deepEqual(fs.readFileSync(f.lockPath), f.lock);
  assert.equal(fs.existsSync(f.lockPath + '.recovery'), false);
}
test('successful injected recovery preserves the original report and fixed baseline', async t => {
  const f = fixture(t), proof = await recoverLocalHttpLock(f.options);
  assert.equal(proof.status, 'recovered'); assert.equal(proof.lock_removed, true); assert.equal(fs.existsSync(f.lockPath), false);
  assert.equal(fs.existsSync(f.lockPath + '.recovery'), false); assert.deepEqual(fs.readFileSync(f.sourceReportFile), f.original);
  assert.equal(proof.baseline.max_mib, 2252); assert.equal(proof.policy.limit_mib, 2316); assert.equal(proof.policy.tolerance_mib, 64);
  assert.equal(proof.vram_return.consecutive_stable_samples, 3); assert.equal(proof.vram_return.baseline.max_mib, 2252);
  assert.equal(proof.formal_benchmark_eligible, false); assert.match(proof.source_report.sha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(f.counts(), { snapshots: 3, commands: 2, portCalls: 12 });
  assert.deepEqual(JSON.parse(fs.readFileSync(proof.previous_lock_file)), JSON.parse(f.lock));
  assert.equal(JSON.parse(fs.readFileSync(proof.proof_file)).lock_removed, true);
});
for (const [label, change] of [
  ['live previous process', o => { o.isProcessAlive = async () => true; }],
  ['unknown process result', o => { o.isProcessAlive = async () => undefined; }],
  ['process query error', o => { o.isProcessAlive = async () => { throw new Error('permission denied'); }; }],
  ['remaining owned container', o => { o.commandRunner = async () => ({ code: 0, stdout: 'owned-container\n' }); }],
  ['Docker failure', o => { o.commandRunner = async () => ({ code: 1, stdout: '' }); }],
  ['unknown Docker output', o => { o.commandRunner = async () => ({ code: 0 }); }],
  ['occupied experiment port', o => { o.portAvailable = async () => false; }],
  ['unknown port result', o => { o.portAvailable = async () => undefined; }],
]) test(`recovery retains the exact old lock for ${label}`, async t => {
  const f = fixture(t); change(f.options); await assert.rejects(recoverLocalHttpLock(f.options)); unchanged(f);
});
for (const [label, change] of [
  ['wrong scope', s => { s.scope = 'benchmark'; }], ['mock report', s => { s.mock = true; }],
  ['missing baseline', s => { delete s.gpu_baseline; }], ['missing cleanup exit', s => { s.candidates[0].runtime_cleanup.process_exit_confirmed = false; }],
  ['missing port release', s => { s.candidates[0].runtime_cleanup.port_released = false; }],
  ['external engine', s => { s.candidates[0].candidate.runtime.mode = 'external'; }],
  ['nonloopback endpoint', s => { s.candidates[0].candidate.host = 'http://example.com:19551'; }],
]) test(`recovery rejects ${label} without resource probes`, async t => {
  const f = fixture(t); change(f.source); fs.writeFileSync(f.sourceReportFile, JSON.stringify(f.source)); f.original = fs.readFileSync(f.sourceReportFile);
  await assert.rejects(recoverLocalHttpLock(f.options)); unchanged(f); assert.equal(f.counts().commands, 0); assert.equal(f.counts().snapshots, 0);
});
test('VRAM above the approved fixed boundary keeps the old lock and records failure', async t => {
  const f = fixture(t); f.options.snapshot = async () => observation(2317); f.options.recoveryTimeoutMs = 15;
  await assert.rejects(recoverLocalHttpLock(f.options), /VRAM return unverified/); unchanged(f);
  const proof = JSON.parse(fs.readFileSync(path.join(f.options.outputDir, 'recovery_proof.json')));
  assert.equal(proof.status, 'failed'); assert.equal(proof.lock_removed, false); assert.equal(proof.policy.limit_mib, 2316);
});
test('unknown readings and changed GPU identity cannot recover', async t => {
  for (const current of [{ known: false }, { ...observation(), gpu: { ...observation().gpu, uuid: 'other' } }]) {
    const f = fixture(t); f.options.snapshot = async () => current;
    await assert.rejects(recoverLocalHttpLock(f.options), /VRAM return unverified/); unchanged(f);
  }
});
test('a concurrent recovery mutex is never removed', async t => {
  const f = fixture(t), mutex = f.lockPath + '.recovery'; fs.writeFileSync(mutex, '{"token":"other-owner"}');
  await assert.rejects(recoverLocalHttpLock(f.options), /EEXIST/);
  assert.equal(fs.readFileSync(mutex, 'utf8'), '{"token":"other-owner"}'); assert.deepEqual(fs.readFileSync(f.lockPath), f.lock);
});
test('changed old lock is never unlinked', async t => {
  const f = fixture(t), replacement = '{"token":"new-owner"}'; let calls = 0;
  f.options.snapshot = async () => { if (++calls === 3) fs.writeFileSync(f.lockPath, replacement); return observation(); };
  await assert.rejects(recoverLocalHttpLock(f.options), /lock changed/);
  assert.equal(fs.readFileSync(f.lockPath, 'utf8'), replacement); assert.equal(fs.existsSync(f.lockPath + '.recovery'), false);
  assert.deepEqual(fs.readFileSync(f.sourceReportFile), f.original);
});
test('process revival during recovery and late containers block removal', async t => {
  for (const resource of ['process', 'container', 'port']) {
    const f = fixture(t); let calls = 0;
    if (resource === 'process') f.options.isProcessAlive = async () => ++calls > 1;
    if (resource === 'container') f.options.commandRunner = async () => ({ code: 0, stdout: ++calls > 1 ? 'late-container' : '' });
    if (resource === 'port') f.options.portAvailable = async () => ++calls <= 6;
    await assert.rejects(recoverLocalHttpLock(f.options)); unchanged(f);
  }
});
test('source mutation is detected before old lock removal', async t => {
  const f = fixture(t); let calls = 0;
  f.options.snapshot = async () => { if (++calls === 3) fs.appendFileSync(f.sourceReportFile, '\n'); return observation(); };
  await assert.rejects(recoverLocalHttpLock(f.options), /source report changed/);
  assert.deepEqual(fs.readFileSync(f.lockPath), f.lock); assert.equal(fs.existsSync(f.lockPath + '.recovery'), false);
});
test('lock replacement during the final asynchronous process check is preserved', async t => {
  const f = fixture(t), replacement = '{"token":"final-new-owner"}'; let calls = 0;
  f.options.isProcessAlive = async () => { if (++calls === 4) fs.writeFileSync(f.lockPath, replacement); return false; };
  await assert.rejects(recoverLocalHttpLock(f.options), /lock changed before removal/);
  assert.equal(fs.readFileSync(f.lockPath, 'utf8'), replacement);
  assert.equal(fs.existsSync(f.lockPath + '.recovery'), false);
});
test('a mutex replaced by another owner is retained', async t => {
  const f = fixture(t); f.options.snapshot = async () => {
    fs.writeFileSync(f.lockPath + '.recovery', '{"token":"replacement-owner"}'); return { known: false };
  };
  await assert.rejects(recoverLocalHttpLock(f.options));
  assert.deepEqual(fs.readFileSync(f.lockPath), f.lock);
  assert.equal(fs.readFileSync(f.lockPath + '.recovery', 'utf8'), '{"token":"replacement-owner"}');
});
test('path and tolerance validation precede recovery probes', async t => {
  const f = fixture(t);
  for (const toleranceMiB of [65, -1, 0.5, '64', null]) await assert.rejects(recoverLocalHttpLock({ ...f.options, toleranceMiB }));
  await assert.rejects(recoverLocalHttpLock({ ...f.options, outputDir: path.resolve(RESULTS, '..', 'outside') }), /inside/);
  await assert.rejects(recoverLocalHttpLock({ ...f.options, outputDir: path.dirname(f.sourceReportFile) }), /differ/);
  await assert.rejects(recoverLocalHttpLock({ ...f.options, lockPath: path.join(f.dir, 'other.lock') }), /Only a/);
  unchanged(f); assert.deepEqual(f.counts(), { snapshots: 0, commands: 0, portCalls: 0 });
});
