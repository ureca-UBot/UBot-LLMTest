'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { loadModelManifest, validateModelManifest, modelById, portablePaths, verifyPinnedTemplate } = require('./model_manifest');

const ROOT = path.resolve(__dirname, '../../..');
const manifest = loadModelManifest();
const clone = (value) => JSON.parse(JSON.stringify(value));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const script = path.join(__dirname, 'prepare_models.py');
const pythonCandidates = [process.env.BENCHMARK_PYTHON, 'python3', 'python',
  process.platform === 'win32' && process.env.USERPROFILE
    ? path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe') : null].filter(Boolean);
const python = pythonCandidates.find((command) => spawnSync(command, ['--version'], { windowsHide: true, encoding: 'utf8' }).status === 0);

function temporary(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'serving-model-lock-'));
  t.after(() => {
    const resolved = path.resolve(directory);
    const base = path.resolve(os.tmpdir());
    const relative = path.relative(base, resolved);
    assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  return directory;
}

function syntheticFixture(t) {
  const root = temporary(t);
  const lock = clone(manifest);
  lock.models = [lock.models[0]];
  const bytes = Buffer.from('GGUF synthetic offline test fixture only\n');
  lock.models[0].files[0].sha256 = sha(bytes);
  lock.models[0].files[0].bytes = bytes.length;
  const template = path.join(root, ...lock.template.workspace_relative_path.split('/'));
  fs.mkdirSync(path.dirname(template), { recursive: true });
  fs.copyFileSync(verifyPinnedTemplate(ROOT, manifest).path, template);
  const lockFile = path.join(root, 'models.lock.json');
  fs.writeFileSync(lockFile, JSON.stringify(lock));
  const cache = path.join(root, 'cache');
  const model = lock.models[0];
  const source = path.join(cache, 'models--' + model.repository.replace('/', '--'), 'snapshots', model.revision, model.files[0].path);
  fs.mkdirSync(path.dirname(source), { recursive: true });
  fs.writeFileSync(source, bytes);
  return { root, lock, lockFile, cache, source, bytes,
    destination: portablePaths(root, lock).models[model.id].directory,
    args: ['-B', script, '--root', root, '--lock', lockFile, '--cache-dir', cache, '--offline'] };
}

test('fixed manifest has two real artifacts and keeps exact conversion lineage pending', () => {
  assert.equal(manifest.upstream.revision, '1cfa9a7208912126459214e8b04321603b3df60c');
  assert.equal(manifest.upstream.conversion_commit_verified, false);
  assert.equal(manifest.lineage_status, 'pending_exact_upstream_conversion_commit');
  assert.deepEqual(manifest.models.map((model) => model.id), ['qwen3_4b_gguf_q4km', 'qwen3_4b_awq']);
  assert.equal(modelById(manifest, 'qwen3_4b_gguf_q4km').files[0].sha256, '7485fe6f11af29433bc51cab58009521f205840f5b4ae3a32fa7f92e8534fdf5');
  assert.equal(modelById(manifest, 'qwen3_4b_awq').files.find((file) => file.role === 'weight').sha256, 'a7043493ebd993f5fea18794ad7b5b3e064a52023f392a7fcce7ce0984c341f0');
  assert.equal(manifest.upstream.metadata.hidden_size, modelById(manifest, 'qwen3_4b_awq').metadata.hidden_size);
});

test('paths are portable model directories and do not depend on HF/Xet cache addresses', () => {
  const locations = portablePaths(ROOT, manifest);
  assert.equal(locations.models.qwen3_4b_awq.model_path, path.join(ROOT, 'model_assets', 'portable', 'Qwen3-4B-AWQ'));
  assert.equal(locations.models.qwen3_4b_gguf_q4km.model_path, path.join(ROOT, 'model_assets', 'portable', 'Qwen3-4B-GGUF', 'Qwen3-4B-Q4_K_M.gguf'));
  for (const model of Object.values(locations.models)) for (const file of model.files) {
    assert.ok(path.isAbsolute(file.path));
    assert.ok(!file.path.includes('snapshots') && !file.path.includes('blobs'));
    assert.ok(file.relative_path && file.sha256);
  }
  assert.equal(verifyPinnedTemplate(ROOT, manifest).verified, true);
});

for (const [name, mutation] of [
  ['moving revision', (lock) => { lock.models[0].revision = 'main'; }],
  ['unverified lineage promoted', (lock) => { lock.upstream.conversion_commit_verified = true; }],
  ['file traversal', (lock) => { lock.models[0].files[0].path = '../secret'; }],
  ['absolute file', (lock) => { lock.models[0].files[0].path = 'C:/secret'; }],
  ['directory traversal', (lock) => { lock.models[0].portable_subdir = '../escape'; }],
  ['template traversal', (lock) => { lock.template.workspace_relative_path = '../escape'; }],
  ['missing token fingerprint', (lock) => { lock.models[0].files[0].embedded_roles = []; }],
  ['missing SHA', (lock) => { lock.models[0].files[0].sha256 = ''; }],
]) {
  test(`manifest rejects ${name}`, () => {
    const lock = clone(manifest); mutation(lock);
    assert.throws(() => validateModelManifest(lock));
  });
}

test('Python preparation source compiles without writing bytecode', { skip: !python }, () => {
  const compiled = spawnSync(python, ['-B', '-c', 'import pathlib,sys; compile(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"),sys.argv[1],"exec")', script], { windowsHide: true, encoding: 'utf8' });
  assert.equal(compiled.status, 0, compiled.stderr);
});

test('offline fixture materializes ordinary files, validates hashes and refuses existing path replacement', { skip: !python }, (t) => {
  const fixture = syntheticFixture(t);
  const run = spawnSync(python, fixture.args, { windowsHide: true, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const reported = JSON.parse(run.stdout);
  assert.equal(reported.status, 'prepared');
  assert.equal(reported.lineage_status, 'pending_exact_upstream_conversion_commit');
  const modelFile = path.join(fixture.destination, fixture.lock.models[0].files[0].path);
  assert.equal(fs.lstatSync(modelFile).isSymbolicLink(), false);
  assert.deepEqual(fs.readFileSync(modelFile), fixture.bytes);
  const repeat = spawnSync(python, fixture.args, { windowsHide: true, encoding: 'utf8' });
  assert.notEqual(repeat.status, 0);
  assert.match(repeat.stderr, /already exists/);
  const validated = spawnSync(python, [...fixture.args, '--validate-only'], { windowsHide: true, encoding: 'utf8' });
  assert.equal(validated.status, 0, validated.stderr);
  assert.equal(JSON.parse(validated.stdout).status, 'validated');
  fs.writeFileSync(modelFile, Buffer.from(fixture.bytes.toString().replace('GGUF', 'BAD!')));
  const tampered = spawnSync(python, [...fixture.args, '--validate-only'], { windowsHide: true, encoding: 'utf8' });
  assert.notEqual(tampered.status, 0);
  assert.match(tampered.stderr, /SHA-256 mismatch/);
});

test('offline mismatched cache cannot publish a ready model directory', { skip: !python }, (t) => {
  const fixture = syntheticFixture(t);
  fs.writeFileSync(fixture.source, 'wrong model bytes');
  const run = spawnSync(python, fixture.args, { windowsHide: true, encoding: 'utf8' });
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /Offline cache file missing\/mismatched/);
  assert.equal(fs.existsSync(fixture.destination), false);
  const portable = path.dirname(fixture.destination);
  const stages = fs.readdirSync(portable).filter((name) => name.includes('.prepare-'));
  assert.equal(stages.length, 1);
  assert.equal(JSON.parse(fs.readFileSync(path.join(portable, stages[0], '.failed.json'))).ready, false);
});

test('tampered template is rejected before any portable preparation writes', { skip: !python }, (t) => {
  const fixture = syntheticFixture(t);
  fs.writeFileSync(path.join(fixture.root, ...fixture.lock.template.workspace_relative_path.split('/')), 'not the pinned template');
  const run = spawnSync(python, fixture.args, { windowsHide: true, encoding: 'utf8' });
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /template byte\/hash mismatch/);
  assert.equal(fs.existsSync(path.dirname(fixture.destination)), false);
});

test('synthetic model archive roundtrip, overwrite refusal, byte corruption and traversal rejection', { skip: !python }, (t) => {
  const fixture = syntheticFixture(t);
  const archiveScript = path.join(__dirname, 'archive_models.py');
  const bundle = path.join(fixture.root, 'bundle');
  const common = ['-B', archiveScript, '--bundle', bundle, '--lock', fixture.lockFile];
  const run = (args) => spawnSync(python, [...common, ...args], { windowsHide: true, encoding: 'utf8' });
  const exported = run(['--export', '--root', fixture.root, '--cache-dir', fixture.cache]);
  assert.equal(exported.status, 0, exported.stderr);
  assert.equal(JSON.parse(exported.stdout).member_count, 2);
  assert.equal(run(['--verify']).status, 0);
  assert.notEqual(run(['--export', '--root', fixture.root, '--cache-dir', fixture.cache]).status, 0);
  const receiver = path.join(fixture.root, 'receiver');
  const receiverTemplate = path.join(receiver, ...fixture.lock.template.workspace_relative_path.split('/'));
  fs.mkdirSync(path.dirname(receiverTemplate), { recursive: true });
  fs.copyFileSync(verifyPinnedTemplate(ROOT, manifest).path, receiverTemplate);
  const imported = run(['--import', '--root', receiver]);
  assert.equal(imported.status, 0, imported.stderr);
  assert.equal(JSON.parse(imported.stdout).status, 'imported');
  const validation = spawnSync(python, ['-B', script, '--root', receiver, '--lock', fixture.lockFile, '--validate-only'], { windowsHide: true, encoding: 'utf8' });
  assert.equal(validation.status, 0, validation.stderr);
  assert.match(run(['--import', '--root', receiver]).stderr, /already exists/);
  const archiveFile = path.join(bundle, 'models.tar');
  fs.appendFileSync(archiveFile, 'corrupt');
  assert.match(run(['--verify']).stderr, /byte\/hash mismatch/);
  // Recompute the outer checksum for an intentionally malicious inner tar.
  // The fixed exact member allow-list must still reject it before any writes.
  const malicious = spawnSync(python, ['-B', '-c',
    'import hashlib,io,json,pathlib,sys,tarfile; b=pathlib.Path(sys.argv[1]); p=b/"models.tar"; a=tarfile.open(p,"w"); m=tarfile.TarInfo("../../escaped"); m.size=3; a.addfile(m,io.BytesIO(b"bad")); a.close(); f=b/"models.transfer.json"; j=json.loads(f.read_text()); j["archive"]["bytes"]=p.stat().st_size; j["archive"]["sha256"]=hashlib.sha256(p.read_bytes()).hexdigest(); f.write_text(json.dumps(j))', bundle], { windowsHide: true, encoding: 'utf8' });
  assert.equal(malicious.status, 0, malicious.stderr);
  const blocked = run(['--import', '--root', receiver]);
  assert.notEqual(blocked.status, 0);
  assert.match(blocked.stderr, /Unsafe manifest path/);
  assert.equal(fs.existsSync(path.join(fixture.root, 'escaped')), false);
});
