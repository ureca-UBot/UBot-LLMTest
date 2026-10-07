'use strict';
// Local WDDM recovery only. This never stops a process or container.
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { createHash, randomUUID } = require('node:crypto');
const { run } = require('../lib/runtime');
const { readLocalGpuObservation, waitForVramReturn } = require('./local_gpu_observation');

const ROOT = path.resolve(__dirname, '../..');
const RESULTS = path.join(ROOT, 'results');
const SCOPE = 'local_http_capacity_exploration';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const samePath = (a, b) => typeof a === 'string' && typeof b === 'string' && path.relative(path.resolve(a), path.resolve(b)) === '';
function within(base, target) {
  const relative = path.relative(base, target);
  return relative !== '' && !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative);
}
function boundedPath(base, input, label) {
  if (typeof input !== 'string' || !input) throw new Error(`${label} path is required.`);
  const target = path.resolve(input);
  if (!within(base, target)) throw new Error(`${label} must be inside ${base}.`);
  let ancestor = target;
  while (!fs.existsSync(ancestor)) ancestor = path.dirname(ancestor);
  const realBase = fs.realpathSync(base), realAncestor = fs.realpathSync(ancestor);
  if (realAncestor !== realBase && !within(realBase, realAncestor)) throw new Error(`${label} escapes its workspace through a link.`);
  return target;
}
function processAlive(pid) {
  try { process.kill(pid, 0); return true; }
  catch (error) { if (error.code === 'ESRCH') return false; throw new Error(`Cannot verify previous process exit: ${error.message}`); }
}
function loopbackPortAvailable(host, port) {
  return new Promise(resolve => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.listen({ host, port, exclusive: true }, () => server.close(error => resolve(!error)));
  });
}
function writeNew(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
}
async function recoverLocalHttpLock({ lockPath, sourceReportFile, outputDir, toleranceMiB = 64,
  commandRunner = run, snapshot = () => readLocalGpuObservation(), isProcessAlive = processAlive,
  portAvailable = loopbackPortAvailable, recoveryTimeoutMs = 60000, recoveryIntervalMs = 500 } = {}) {
  if (!Number.isInteger(toleranceMiB) || toleranceMiB < 0 || toleranceMiB > 64) throw new Error('Recovery tolerance must be an integer in 0..64 MiB.');
  for (const fn of [commandRunner, snapshot, isProcessAlive, portAvailable]) if (typeof fn !== 'function') throw new Error('Recovery probes must be functions.');
  const lockFile = boundedPath(ROOT, lockPath, 'Lock');
  if (path.basename(lockFile) !== '.benchmark.lock') throw new Error('Only a .benchmark.lock may be recovered.');
  const sourceFile = boundedPath(RESULTS, sourceReportFile, 'Source report');
  const out = boundedPath(RESULTS, outputDir, 'Recovery output');
  if (samePath(out, path.dirname(sourceFile))) throw new Error('Recovery output must differ from the original report directory.');
  if (fs.existsSync(out) && !fs.statSync(out).isDirectory()) throw new Error('Recovery output must be a directory.');
  const mutexFile = lockFile + '.recovery', mutexToken = randomUUID();
  writeNew(mutexFile, { token: mutexToken, pid: process.pid, source: sourceFile, output: out });
  try {
    const sourceBytes = fs.readFileSync(sourceFile), source = JSON.parse(sourceBytes.toString('utf8'));
    const lockBytes = fs.readFileSync(lockFile), previous = JSON.parse(lockBytes.toString('utf8'));
    if (source.scope !== SCOPE || source.mock !== false || source.gpu_baseline?.known !== true) throw new Error('Only a real local HTTP exploration with a known original GPU baseline can be recovered.');
    if (previous.scope !== SCOPE || !samePath(previous.out, path.dirname(sourceFile))
      || !Number.isInteger(previous.pid) || previous.pid <= 0 || typeof previous.token !== 'string' || !previous.token) throw new Error('Previous lock does not identify the source report.');
    if (!Array.isArray(source.candidates) || source.candidates.length === 0) throw new Error('Source has no measured engine cleanup evidence.');
    const ports = new Set([19551, 19552, 19553, 19554, 19555, 19556]);
    for (const candidate of source.candidates) {
      if (candidate.runtime_cleanup?.process_exit_confirmed !== true || candidate.runtime_cleanup?.port_released !== true
        || candidate.candidate?.runtime?.mode !== 'docker') throw new Error('Every previous engine must have confirmed Docker exit and port release.');
      let url; try { url = new URL(candidate.candidate.host); } catch { throw new Error('Previous engine endpoint is invalid.'); }
      const port = Number(url.port);
      if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Previous engine endpoint must be an explicit loopback HTTP port.');
      ports.add(port);
    }
    const checkProcess = async () => {
      if (await isProcessAlive(previous.pid) !== false) throw new Error('Previous lock process is alive or its exit is unknown.');
    };
    const checkResources = async () => {
      const response = await commandRunner('docker', ['ps', '--all', '--filter', 'label=llm.benchmark.session', '--format', '{{.ID}}']);
      if (response?.code !== 0 || typeof response.stdout !== 'string' || response.stdout.trim() !== '') throw new Error('Benchmark-owned containers are present or Docker inventory is unknown.');
      const checks = [];
      for (const port of [...ports].sort((a, b) => a - b)) {
        if (await portAvailable('127.0.0.1', port) !== true) throw new Error(`Experiment loopback port ${port} is occupied or unknown.`);
        checks.push({ host: '127.0.0.1', port, available: true });
      }
      return checks;
    };
    await checkProcess();
    let checkedPorts = await checkResources();
    const baseline = structuredClone(source.gpu_baseline);
    const vramReturn = await waitForVramReturn({ baseline, toleranceMiB, stableSamples: 3, snapshot,
      timeoutMs: recoveryTimeoutMs, intervalMs: recoveryIntervalMs });
    const proof = { status: vramReturn.status === 'observed_returned' ? 'recovered' : 'failed', scope: 'local_http_lock_recovery',
      recorded_at: new Date().toISOString(), formal_benchmark_eligible: false,
      source_report: { file: sourceFile, sha256: sha256(sourceBytes), bytes: sourceBytes.length },
      previous_lock: previous, previous_lock_sha256: sha256(lockBytes), baseline,
      policy: { tolerance_mib: toleranceMiB, original_max_mib: baseline.max_mib, limit_mib: baseline.max_mib + toleranceMiB, stable_samples: 3 },
      containers_absent: true, ports: checkedPorts, process_dead: true, vram_return: vramReturn, lock_removed: false };
    fs.mkdirSync(out, { recursive: true });
    const proofFile = path.join(out, 'recovery_proof.json'), previousFile = path.join(out, 'previous_lock.json');
    if (vramReturn.status !== 'observed_returned') {
      writeNew(previousFile, previous); writeNew(proofFile, proof);
      const error = new Error(`Recovery VRAM return unverified: ${vramReturn.reason}`); error.recovery_proof = proofFile; throw error;
    }
    // A successful memory observation never substitutes for fresh ownership checks.
    await checkProcess(); checkedPorts = await checkResources();
    if (!fs.readFileSync(sourceFile).equals(sourceBytes)) throw new Error('Original source report changed during recovery.');
    const currentLock = fs.readFileSync(lockFile);
    if (!currentLock.equals(lockBytes)) throw new Error('Previous lock changed during recovery.');
    await checkProcess();
    proof.ports = checkedPorts;
    writeNew(previousFile, previous); writeNew(proofFile, proof);
    // Recheck after persistence, immediately before removing this exact stale lock.
    await checkProcess();
    if (!fs.readFileSync(sourceFile).equals(sourceBytes)) throw new Error('Original source report changed before removal.');
    if (!fs.readFileSync(lockFile).equals(lockBytes)) throw new Error('Previous lock changed before removal.');
    fs.unlinkSync(lockFile);
    proof.lock_removed = true; proof.recovered_at = new Date().toISOString();
    fs.writeFileSync(proofFile, JSON.stringify(proof, null, 2) + '\n', { mode: 0o600 });
    return { ...proof, proof_file: proofFile, previous_lock_file: previousFile };
  } finally {
    // Do not delete a mutex replaced by another recovery owner.
    let mutex; try { mutex = JSON.parse(fs.readFileSync(mutexFile, 'utf8')); } catch { mutex = null; }
    if (mutex?.token === mutexToken) fs.unlinkSync(mutexFile);
  }
}
module.exports = { recoverLocalHttpLock };
