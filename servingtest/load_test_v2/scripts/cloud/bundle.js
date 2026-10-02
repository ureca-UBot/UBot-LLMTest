'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { hashObject } = require('../lib/config');
const { run, validateAppliedArgs } = require('../lib/runtime');
const { loadModelManifest, portablePaths, verifyPinnedTemplate } = require('./model_manifest');
const ROOT = path.resolve(__dirname, '../../..');
const SHA = /^[a-f0-9]{64}$/;
const imageFields = ['User', 'Env', 'Entrypoint', 'Cmd', 'WorkingDir', 'ExposedPorts',
  'Volumes', 'Labels', 'Healthcheck', 'StopSignal', 'Shell', 'OnBuild', 'ArgsEscaped'];
function imageIdentity(value) {
  if (value?.Os !== 'linux' || value?.Architecture !== 'amd64' || value.RootFS?.Type !== 'layers'
    || !Array.isArray(value.RootFS.Layers) || !value.RootFS.Layers.length
    || value.RootFS.Layers.some(x => !/^sha256:[a-f0-9]{64}$/.test(x))) throw new Error('A complete linux/amd64 image inspection is required.');
  const config = Object.fromEntries(imageFields.map(key => [key, value.Config?.[key] ?? null]));
  return { os: value.Os, architecture: value.Architecture, variant: value.Variant || '',
    created: value.Created, rootfs: { type: value.RootFS.Type, layers: value.RootFS.Layers }, config };
}
function imageFingerprint(value) { return hashObject(imageIdentity(value)); }
function safePath(root, relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\') || path.isAbsolute(relative)
    || /^[a-zA-Z]:/.test(relative) || relative.split('/').some(x => !x || x === '.' || x === '..')) throw new Error('Use a clean workspace-relative path.');
  const absolute = path.resolve(root, relative), relation = path.relative(root, absolute);
  if (!relation || relation.startsWith('..') || path.isAbsolute(relation)) throw new Error('Path escapes the workspace.');
  return absolute;
}
function readJSON(file) { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); }
function hashFileSync(file) { return createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function assertArtifactDirectory(model) {
  const expected = new Set(model.files.map(file => file.relative_path));
  if (!fs.lstatSync(model.directory).isDirectory() || fs.lstatSync(model.directory).isSymbolicLink()) throw new Error('Prepared model directories must be ordinary directories.');
  function walk(directory, prefix = '') {
    for (const name of fs.readdirSync(directory)) {
      const relative = prefix ? `${prefix}/${name}` : name;
      const absolute = path.join(directory, name), info = fs.lstatSync(absolute);
      if (info.isSymbolicLink()) throw new Error(`Unpinned model link: ${relative}`);
      const metadata = relative === '.cache' || relative === '.cache/huggingface' || relative.startsWith('.cache/huggingface/');
      if (info.isDirectory()) {
        if (!metadata && ![...expected].some(file => file.startsWith(`${relative}/`))) throw new Error(`Unpinned model directory: ${relative}`);
        walk(absolute, relative);
      } else if (!info.isFile() || !expected.has(relative) && relative !== '.prepared.json' && !metadata) {
        throw new Error(`Unpinned model file could change loading behavior: ${relative}`);
      }
    }
  }
  walk(model.directory);
}
async function fingerprintFile(file) {
  const hash = createHash('sha256');
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
  return { path: file, bytes: fs.statSync(file).size, sha256: hash.digest('hex') };
}
function validateProfile(config) {
  const fixed = { target_rps: 8, measure_ms: 30000, min_requests: 20, timeout_ms: 120000, seed: 20261002 };
  if (config?.schema_version !== 1 || config.scope !== 't4_http_capacity_exploration'
    || hashObject(config.profile) !== hashObject(fixed)
    || hashObject(config.generation) !== hashObject({ context: 4096, max_tokens: 512, temperature: 0, thinking: false })
    || hashObject(config.transport) !== hashObject({ streaming: true, keep_alive: true, timeout_ms: 120000, retries: 0 })
    || config.workload?.case_count !== 300 || !SHA.test(config.workload?.sha256 || '')) throw new Error('The frozen HTTP 8 RPS exploration profile differs.');
  const limits = { ollama_p4: [4, [1, 4, 8, 16, 32]], llamacpp_p4: [4, [4, 8, 16, 32]],
    vllm_s8: [8, [4, 8, 16, 32]], sglang_r8: [8, [4, 8, 16, 32]], vllm_s32: [32, [16, 32, 64]], sglang_r32: [32, [16, 32, 64]] };
  if (!Array.isArray(config.candidates) || config.candidates.length !== 6) throw new Error('All six frozen candidates are required.');
  const seen = new Set();
  for (const c of config.candidates) {
    const expected = limits[c.id];
    if (!expected || seen.has(c.id) || c.internal_limit !== expected[0] || hashObject(c.users) !== hashObject(expected[1])
      || c.runtime?.mode !== 'docker' || c.cpu_offload !== 'none' || !Array.isArray(c.runtime.args)
      || !/^llm-frozen\/[a-z]+:[a-z0-9-]+$/.test(c.runtime.image || '')) throw new Error(`Invalid frozen candidate: ${c.id}`);
    const url = new URL(c.host);
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('The experiment API must remain on loopback.');
    if (Object.keys(c.runtime.env || {}).some(key => /TOKEN|SECRET|PASSWORD|CREDENTIAL|API_KEY/i.test(key))) throw new Error('Credentials cannot be included in frozen runtime settings.');
    validateAppliedArgs(c, config.generation); seen.add(c.id);
  }
  return config;
}
async function validateFrozenBundle({ configPath = path.join(ROOT, 'load_test_v2/config/http.t4.json'),
  manifestPath = path.join(ROOT, 'load_test_v2/config/cloud.lock.json'), verifyModels = false, root = ROOT } = {}) {
  const manifest = readJSON(manifestPath), config = validateProfile(readJSON(configPath));
  if (manifest.schema_version !== 1 || manifest.platform !== 'linux/amd64' || !Array.isArray(manifest.files)
    || !Array.isArray(manifest.images) || manifest.images.length !== 5) throw new Error('Invalid frozen bundle manifest.');
  if (manifest.node_version !== process.version) throw new Error(`Use the frozen Node runtime ${manifest.node_version}; observed ${process.version}.`);
  if (hashFileSync(configPath) !== manifest.profile_sha256) throw new Error('Candidate configuration fingerprint differs.');
  for (const item of manifest.files) {
    if (!SHA.test(item.sha256 || '') || hashFileSync(safePath(root, item.path)) !== item.sha256) throw new Error(`Frozen source changed: ${item.path}`);
  }
  const modelsPath = safePath(root, manifest.models_file);
  if (hashFileSync(modelsPath) !== manifest.models_sha256) throw new Error('Model lock fingerprint differs.');
  const modelManifest = loadModelManifest(modelsPath), locations = portablePaths(root, modelManifest);
  verifyPinnedTemplate(root, modelManifest);
  const modelFiles = Object.values(locations.models).flatMap(model => model.files);
  const readiness = { present: modelFiles.every(f => fs.existsSync(f.path)), sha256_verified: false };
  if (verifyModels) {
    for (const model of Object.values(locations.models)) assertArtifactDirectory(model);
    for (const file of modelFiles) {
      const actual = await fingerprintFile(file.path);
      if (actual.bytes !== file.bytes || actual.sha256 !== file.sha256) throw new Error(`Model artifact differs: ${file.path}`);
    }
    readiness.sha256_verified = true;
  }
  const workloadPath = safePath(root, config.workload.file);
  if (hashFileSync(workloadPath) !== config.workload.sha256) throw new Error('Workload fingerprint differs.');
  const imageRefs = new Set(manifest.images.map(x => x.reference));
  const candidates = config.candidates.map(c => {
    if (!imageRefs.has(c.runtime.image)) throw new Error(`Image missing from lock: ${c.id}`);
    const resolved = structuredClone(c);
    resolved.runtime.mounts = c.runtime.mounts.map(m => ({ ...m, source: safePath(root, m.source) }));
    return resolved;
  });
  return { root, config, candidates, manifest, model_files: modelFiles, model_readiness: readiness,
    workload: { path: workloadPath, sha256: config.workload.sha256, case_count: 300 } };
}
async function verifyDockerImages(bundle, { commandRunner = run } = {}) {
  const images = [];
  for (const lock of bundle.manifest.images) {
    const result = await commandRunner('docker', ['image', 'inspect', lock.reference]);
    if (result.code !== 0) throw new Error(`Load the frozen image first: ${lock.reference}`);
    const info = JSON.parse(result.stdout)[0];
    if (imageFingerprint(info) !== lock.config_fingerprint) throw new Error(`Image content differs: ${lock.reference}`);
    images.push({ id: lock.id, reference: lock.reference, image_id: info.Id,
      source_id: lock.source_id, config_fingerprint: lock.config_fingerprint, verified: true });
  }
  return { verified: true, images };
}
module.exports = { ROOT, imageIdentity, imageFingerprint, safePath, readJSON, hashFileSync,
  fingerprintFile, assertArtifactDirectory, validateProfile, validateFrozenBundle, verifyDockerImages };
