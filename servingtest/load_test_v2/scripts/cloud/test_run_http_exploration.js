#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { main, options, validatePlan, freezeRuntimeImages, ownedCommandRunner, prepareOllamaImport,
  CONFIG_PROFILE, PROFILE, GENERATION, TRANSPORT, WORKLOAD_SHA } = require('./run_http_exploration');
const { abortableRun } = require('./run_http_exploration');
const { assertLinuxT4, driverAtLeast, fixedBaseline, strictRelease } = require('./gpu_observation');
const { evaluateGpuRelease } = require('../lib/gpu_cleanup');
const { imageFingerprint } = require('./bundle');

const ROOT = path.resolve(__dirname, '../..'), RESULTS = path.join(ROOT, 'results');
const imageId = `sha256:${'a'.repeat(64)}`;
function idleGpu(overrides = {}) {
  return { known: true, compute_processes: [], processes: [],
    gpus: [{ index: 0, uuid: 'GPU-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', name: 'Tesla T4',
      memory_used_mib: 7, memory_total_mib: 15360, driver_version: '580.95.05', ...overrides }] };
}
function candidate(id = 'vllm_s8') {
  const high = id === 'vllm_s32', limit = high ? 32 : 8;
  return { id, engine: 'vllm', internal_limit: limit, users: high ? [16, 32, 64] : [4, 8, 16, 32],
    model_family: 'Qwen/Qwen3-4B', api_model: 'qwen3-4b-awq', host: `http://127.0.0.1:${high ? 19555 : 19553}`,
    runtime: { mode: 'docker', image: 'llm-frozen/vllm:20261002-aaaaaaaaaaaa', container_port: 8000, ready_timeout_ms: 600000,
      args: ['Qwen/Qwen3-4B-AWQ', '--max-model-len', '4096', '--max-num-seqs', String(limit)],
      mounts: [{ source: path.join(ROOT, 'data'), target: '/model-evidence', read_only: true }],
      env: { HF_HUB_OFFLINE: '1', TRANSFORMERS_OFFLINE: '1' } } };
}
function bundle(candidates = [candidate()]) {
  const workload = { path: path.join(ROOT, 'data/benchmark_prompts.jsonl'), sha256: WORKLOAD_SHA, case_count: 300 };
  return { config: { schema_version: 1, scope: 't4_http_capacity_exploration', profile: { ...CONFIG_PROFILE },
    generation: { ...GENERATION }, transport: { ...TRANSPORT }, candidates }, candidates, workload, manifest: { schema_version: 1 } };
}
function verification() {
  return { verified: true, images: [{ id: 'vllm', reference: candidate().runtime.image, image_id: imageId, verified: true }] };
}
function measuredResult(users) {
  const record = (i, drain = false) => ({ case_id: `fixture-${i}`, transport_ok: true, http_status: 200,
    schema_valid: false, evidence_valid: false, valid: false, t_start_rel: 10 + i,
    t_end_rel: drain ? 35010 + i : 10010 + i, e2e_ms: drain ? 35000 : 10000, eval_count: 9 });
  return { records: [...Array.from({ length: 240 }, (_, i) => record(i)), ...Array.from({ length: 5 }, (_, i) => record(i + 240, true))],
    window: { startMs: 10, endMs: 30010 }, elapsedMs: 35000, drainMs: 5000, maxInFlight: users,
    inFlightSamples: [{ at_ms: 10, pending: users }, { at_ms: 30010, pending: 5 }], aborted: false, stop_reason: 'completed' };
}

function testLauncher(directory) {
  const source = fs.readFileSync(path.join(__dirname, 'run_t4.sh'), 'utf8');
  if (process.env.CLOUD_TEST_BASH) {
    execFileSync(process.env.CLOUD_TEST_BASH, ['-n', path.join(__dirname, 'run_t4.sh')]);
    const sandbox = path.join(directory, 'launcher'), scripts = path.join(sandbox, 'scripts/cloud'), bin = path.join(sandbox, 'mockbin');
    fs.mkdirSync(scripts, { recursive: true }); fs.mkdirSync(bin);
    const socketPredicate = '[[ -S /var/run/docker.sock ]]'; assert.equal(source.split(socketPredicate).length, 2);
    // Simulate only the host socket predicate in this temporary script copy.
    // Python/Docker/uname below are mocks; no Docker command reaches a daemon.
    const script = path.join(scripts, 'run_t4.sh');
    fs.writeFileSync(script, source.replace(socketPredicate, '[[ "${CLOUD_MOCK_SOCKET:-}" == yes ]]'));
    fs.writeFileSync(path.join(bin, 'uname'), '#!/bin/sh\ncase "$1" in -s) printf "Linux\\n";; -m) printf "x86_64\\n";; esac\n', { mode: 0o755 });
    fs.writeFileSync(path.join(bin, 'python3'), `#!/bin/sh\ncat >/dev/null\nprintf '%s\\n' '${imageId}'\n`, { mode: 0o755 });
    fs.writeFileSync(path.join(bin, 'docker'), '#!/bin/sh\nprintf "%s\\n" "$@" > "$CLOUD_LAUNCH_CAPTURE"\n', { mode: 0o755 });
    const capture = path.join(sandbox, 'arguments.txt');
    const environment = { ...process.env,
      CLOUD_LAUNCH_CAPTURE: capture.replace(/\\/g, '/'), CLOUD_MOCK_SOCKET: 'yes', MSYS_NO_PATHCONV: '1' };
    const shellBin = bin.replace(/\\/g, '/').replace(/^([A-Za-z]):\//, (_, drive) => `/${drive.toLowerCase()}/`);
    for (const dry of [true, false]) {
      execFileSync(process.env.CLOUD_TEST_BASH, ['-c', 'export PATH="$1:$PATH"; shift; exec bash "$@"', 'fixture', shellBin,
        script, ...(dry ? ['--dry-run'] : []), '--candidate', 'vllm_s8'], { env: environment });
      const args = fs.readFileSync(capture, 'utf8').trim().split(/\r?\n/);
      assert(args.includes(imageId)); assert(args.includes('--init')); assert.equal(args[args.indexOf('--stop-timeout') + 1], '180');
      assert.equal(args[args.indexOf('--network') + 1], dry ? 'none' : 'host');
      assert(args.includes('vllm_s8')); assert(args.includes('--config')); assert(args.includes('--manifest'));
      const mounts = args.filter((_, index) => args[index - 1] === '--mount');
      const rootMount = mounts.find(mount => mount.includes(`target=${args[args.indexOf('--workdir') + 1]}`));
      assert(rootMount); const values = Object.fromEntries(rootMount.split(',').filter(part => part.includes('=')).map(part => part.split('=')));
      assert.equal(values.source, values.target);
      if (dry) { assert(rootMount.endsWith(',readonly')); assert(args.includes('NVIDIA_VISIBLE_DEVICES=void'));
        assert(!args.includes('--gpus')); assert(!mounts.some(mount => mount.includes('docker.sock'))); }
      else { assert.equal(args[args.indexOf('--pid') + 1], 'host'); assert.equal(args[args.indexOf('--gpus') + 1], 'all');
        assert(args.includes('NVIDIA_DRIVER_CAPABILITIES=utility')); assert(mounts.some(mount => mount.includes('docker.sock'))); }
    }
  }
  if (process.env.CLOUD_TEST_PYTHON) {
    const python = source.match(/<<'PY'\n([\s\S]*?)\nPY\n/)[1];
    const info = { Id: imageId, Os: 'linux', Architecture: 'amd64', Created: '2026-10-02T00:00:00Z',
      RootFS: { Type: 'layers', Layers: [`sha256:${'b'.repeat(64)}`] }, Config: { Env: ['LANG=C.UTF-8'], Cmd: ['node'] } };
    const lockDir = path.join(directory, 'python_lock/load_test_v2/config'); fs.mkdirSync(lockDir, { recursive: true });
    const lock = { images: [{ id: 'runner', reference: 'llm-frozen/runner:20261002-fixture', config_fingerprint: imageFingerprint(info) }] };
    fs.writeFileSync(path.join(lockDir, 'images.lock.json'), JSON.stringify(lock));
    const prefix = `import subprocess,sys,types\nsubprocess.run=lambda *a,**k:types.SimpleNamespace(stdout=${JSON.stringify(JSON.stringify(info ? [info] : []))})\nsys.argv=['-',${JSON.stringify(path.join(directory, 'python_lock'))}]\n`;
    assert.equal(execFileSync(process.env.CLOUD_TEST_PYTHON, ['-c', prefix + python], { encoding: 'utf8' }).trim(), imageId);
    lock.images[0].config_fingerprint = '0'.repeat(64); fs.writeFileSync(path.join(lockDir, 'images.lock.json'), JSON.stringify(lock));
    assert.throws(() => execFileSync(process.env.CLOUD_TEST_PYTHON, ['-c', prefix + python], { stdio: 'pipe' }), /Command failed/);
  }
}

async function test() {
  assert.throws(() => options(['--config', 'x']), /manifest/);
  assert.throws(() => options(['--config', 'x', '--manifest', 'y', '--dry-run', '--dry-run']), /Duplicate/);
  assert.throws(() => options(['--config', 'x', '--manifest', 'y', '--measure-ms', '1']), /Use/);
  const prepared = bundle(); validatePlan(prepared);
  const launchController = new AbortController();
  const pendingClient = abortableRun(process.execPath, ['-e', 'setTimeout(() => {}, 10000)'], { timeoutMs: 15000 }, launchController.signal);
  launchController.abort(new Error('mock launch cancellation'));
  assert.notEqual((await pendingClient).code, 0);
  for (const mutate of [
    value => { value.config.profile.measure_ms = 31000; },
    value => { value.config.generation.thinking = true; },
    value => { value.config.transport.retries = 1; },
    value => { value.candidates[0].users = [4, 8]; },
    value => { value.candidates[0].runtime.mode = 'process'; },
    value => { value.candidates[0].runtime.mounts[0].read_only = false; },
    value => { value.candidates[0].host = 'http://example.com:8000'; },
  ]) { const modified = structuredClone(prepared); mutate(modified); assert.throws(() => validatePlan(modified)); }
  assert.equal(freezeRuntimeImages(prepared.candidates, verification())[0].runtime.image, imageId);
  assert.throws(() => freezeRuntimeImages(prepared.candidates, { verified: true, images: [] }), /missing/);
  assert.throws(() => freezeRuntimeImages(prepared.candidates, { verified: true, images: [{ ...verification().images[0], image_id: 'latest' }] }), /missing/);

  assert.equal(driverAtLeast('580.95.05'), true); assert.equal(driverAtLeast('580.95.04'), false);
  assert.equal(driverAtLeast('581.0.0'), true); assert.equal(driverAtLeast('N/A'), false);
  const baseline = idleGpu(); assertLinuxT4(baseline, { platform: 'linux' });
  assert.throws(() => assertLinuxT4(baseline, { platform: 'win32' }), /Linux/);
  assert.throws(() => assertLinuxT4(idleGpu({ name: 'NVIDIA A10' }), { platform: 'linux' }), /T4/);
  assert.throws(() => assertLinuxT4(idleGpu({ uuid: 'unknown' }), { platform: 'linux' }), /UUID/);
  assert.throws(() => assertLinuxT4(idleGpu({ driver_version: '535.104.12' }), { platform: 'linux' }), /driver/);
  const occupied = idleGpu(); occupied.processes = [{ pid: 123, used_memory_mib: 100 }]; occupied.compute_processes = ['123'];
  assert.throws(() => assertLinuxT4(occupied, { platform: 'linux' }), /idle GPU/);
  assert.equal(evaluateGpuRelease(baseline, idleGpu({ memory_used_mib: 8 })).released, false);
  assert.equal(evaluateGpuRelease(baseline, idleGpu({ uuid: 'GPU-11111111-bbbb-cccc-dddd-eeeeeeeeeeee' })).released, false);
  const releaseArguments = [];
  const fakeRelease = async args => { releaseArguments.push(args); return { released: true, reason: 'released' }; };
  await fixedBaseline({ platform: 'linux', snapshot: async () => baseline, release: fakeRelease });
  await strictRelease(baseline, { snapshot: async () => baseline, release: fakeRelease });
  assert(releaseArguments.every(args => args.before === baseline && args.toleranceMiB === 0 && args.stableSamples === 3));

  fs.mkdirSync(RESULTS, { recursive: true });
  const directory = fs.mkdtempSync(path.join(RESULTS, 'cloud_runner_test_'));
  try {
    testLauncher(directory);
    const argv = out => ['--config', path.join(directory, 'prepared.json'), '--manifest', path.join(directory, 'manifest.json'), '--out', path.join(directory, out)];
    let modelVerification;
    const failExternal = async () => { throw new Error('Dry run called an external operation'); };
    const dry = await main([...argv('dry'), '--dry-run'], {
      bundleLibrary: { validateFrozenBundle: async args => { modelVerification = args.verifyModels; return bundle(); }, verifyDockerImages: failExternal },
      commandRunner: failExternal, snapshot: failExternal, request: failExternal, fixedBaseline: failExternal,
      createRuntime: failExternal, emit() {}, lockPath: path.join(directory, '.unused.lock'), mock: true,
    });
    assert.equal(modelVerification, false); assert.equal(dry.status, 'dry_run_validated');
    assert.equal(fs.existsSync(path.join(directory, 'dry')), false); assert.equal(fs.existsSync(path.join(directory, '.unused.lock')), false);
    assert.equal(dry.docker_gpu_http_calls, 0); assert.equal(dry.files_written, 0);
    assert.equal(dry.model_readiness.sha256_verified, false); assert.match(dry.model_readiness.status, /real_preflight/);

    const createCalls = [];
    const effective = freezeRuntimeImages([candidate()], verification())[0];
    assert.throws(() => ownedCommandRunner(candidate(), directory, baseline.gpus[0].uuid), /immutable/);
    const wrapper = ownedCommandRunner(effective, directory, baseline.gpus[0].uuid, {
      commandRunner: async (command, args) => { createCalls.push({ command, args }); return { code: 0 }; },
    });
    await wrapper('docker', ['create', '--pull', 'never', '--label', 'llm.benchmark.session=fixture', '--gpus', 'device=0', imageId]);
    assert(createCalls[0].args.includes(`device=${baseline.gpus[0].uuid}`));
    await assert.rejects(wrapper('bash', ['-c', 'echo invalid']), /Docker/);
    const ollama = { engine: 'ollama', api_model: 'fixture:4b', runtime: { mounts: [] }, import_model: { from: '/weights/model.gguf' } };
    prepareOllamaImport(ollama, directory);
    assert.equal(fs.readFileSync(path.join(directory, 'Modelfile'), 'utf8'), 'FROM /weights/model.gguf\n');
    assert.deepEqual(ollama.import_model.command, ['ollama', 'create', 'fixture:4b', '-f', '/benchmark/Modelfile']);
    assert.equal(ollama.runtime.mounts[0].read_only, true);

    async function runScenario(out, failCleanup) {
      let launched = 0, stopped = 0, releaseCalls = 0, measured = 0, closed = 0;
      const lockPath = path.join(directory, `${out}.lock`), firstBaseline = idleGpu();
      const report = await main(argv(out), {
        mock: true, platform: 'linux', lockPath, emit() {},
        bundleLibrary: { validateFrozenBundle: async args => { assert.equal(args.verifyModels, true); return bundle([candidate(), candidate('vllm_s32')]); },
          verifyDockerImages: async () => verification() },
        snapshot: async () => firstBaseline,
        fixedBaseline: async () => ({ baseline: firstBaseline, identity: assertLinuxT4(firstBaseline, { platform: 'linux' }), verification: { released: true } }),
        strictRelease: async before => { assert.equal(before, firstBaseline); releaseCalls++;
          return { released: !(failCleanup && releaseCalls === 2), reason: failCleanup && releaseCalls === 2 ? 'vram_above_baseline' : 'released' }; },
        createRuntime: effective => { assert.equal(effective.runtime.image, imageId); launched++;
          return { container: 'owned-fixture', start: async () => ({ owned_container: 'owned-fixture' }), alive: async () => true,
            stop: async () => { stopped++; return { owned_only: true, process_exit_confirmed: true, port_released: true }; } }; },
        createClient: config => { assert.deepEqual(config.generation, { temperature: 0, numCtx: 4096, maxTokens: 512, thinking: false });
          return { send: async () => ({ transport_ok: true, http_status: 200, valid: false }), close() { closed++; } }; },
        createMonitor: () => ({ start() {}, stop: async () => {} }),
        runClosedLoop: async args => { measured++; assert.equal(args.measureMs, 30000); assert.equal(args.warmupRequestsPerUser, 0);
          assert.equal(args.monitorIntervalMs, 1000); assert(args.cursor.next().caseId);
          const result = measuredResult(args.users); result.records.forEach(args.onRecord); return result; },
      });
      assert.equal(report.formal_benchmark_eligible, false); assert.equal(report.c_slo, null);
      if (failCleanup) {
        assert.equal(report.status, 'cleanup_unverified'); assert.equal(launched, 1); assert.equal(stopped, 1);
        assert.equal(measured, 4); assert.equal(report.lock_retained, true); assert.equal(fs.existsSync(lockPath), true);
        assert.equal(report.candidates.length, 1); assert.equal(report.comparison.rows[0].best_http_rps, null);
      } else {
        assert.equal(report.status, 'completed_exploration'); assert.equal(launched, 2); assert.equal(stopped, 2);
        assert.equal(measured, 7); assert.equal(closed, 2); assert.equal(releaseCalls, 4);
        assert.equal(fs.existsSync(lockPath), false); assert.equal(report.lock_retained, false);
        for (const step of report.candidates.flatMap(value => value.steps)) {
          assert.equal(step.summary.transport_rps, 8); assert.equal(step.summary.target_reached, true);
          assert.equal(step.summary.n_http_complete_drain, 5); assert.equal(step.summary.quality_reference.valid_rps, 0);
          assert.equal(step.drain_ms, 5000); assert.equal(step.window.endMs - step.window.startMs, 30000);
        }
      }
    }
    await runScenario('success', false); await runScenario('cleanup_failure', true);
  } finally {
    // Remove only the known temporary fixture tree created above.
    if (path.dirname(directory) !== RESULTS || !path.basename(directory).startsWith('cloud_runner_test_')) throw new Error('Invalid test cleanup path');
    fs.rmSync(directory, { recursive: true, force: true });
  }
  process.stdout.write('cloud HTTP exploration mock tests passed\n');
}

if (require.main === module) test().catch(error => { process.stderr.write(error.stack + '\n'); process.exitCode = 1; });
module.exports = { test };
