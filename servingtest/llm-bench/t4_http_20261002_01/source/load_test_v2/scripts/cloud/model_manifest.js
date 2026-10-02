'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const DEFAULT_LOCK = path.resolve(__dirname, '../../config/models.lock.json');
const COMMIT = /^[a-f0-9]{40}$/;
const SHA = /^[a-f0-9]{64}$/;
const ROLES = ['weight', 'tokenizer', 'chat_template', 'config'];

function relativePath(value, label) {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.startsWith('/')
    || /^[A-Za-z]:/.test(value) || value.split('/').some((part) => !part || part === '.' || part === '..')) {
    throw new Error(`${label}: portable relative path required`);
  }
}
function fingerprint(value, label) {
  if (!SHA.test(value?.sha256 || '') || !Number.isSafeInteger(value.bytes) || value.bytes < 1) throw new Error(`${label}: SHA-256 and positive bytes required`);
}
function repositoryRevision(value, label) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value?.repository || '') || !COMMIT.test(value?.revision || '')) throw new Error(`${label}: repository and fixed full revision required`);
}
function validateModelManifest(manifest) {
  if (!manifest || manifest.schema_version !== 1 || manifest.model_family !== 'Qwen3-4B') throw new Error('Unsupported model lock schema/family');
  repositoryRevision(manifest.upstream, 'upstream');
  // A frozen artifact fingerprint cannot silently upgrade the pending exact
  // conversion lineage into a formal reviewed model-equivalence approval.
  if (manifest.upstream.conversion_commit_verified !== false || manifest.lineage_status !== 'pending_exact_upstream_conversion_commit'
    || typeof manifest.lineage_note !== 'string' || !manifest.lineage_note.trim()) throw new Error('Exact conversion lineage must remain explicitly unverified');
  relativePath(manifest.upstream.metadata?.path, 'upstream metadata');
  fingerprint(manifest.upstream.metadata, 'upstream metadata');
  relativePath(manifest.template?.workspace_relative_path, 'template');
  fingerprint(manifest.template, 'template');
  repositoryRevision(manifest.template.source, 'template source');
  relativePath(manifest.template.source.path, 'template source');
  if (manifest.template.source.field !== 'chat_template') throw new Error('Pinned template must come from the official chat_template JSON field');
  if (!Array.isArray(manifest.models) || !manifest.models.length) throw new Error('Model entries required');
  const ids = new Set(), directories = new Set();
  for (const model of manifest.models) {
    if (!/^[a-z0-9_]+$/.test(model.id || '') || ids.has(model.id)) throw new Error('Unique model ID required');
    ids.add(model.id);
    repositoryRevision(model, model.id);
    if (!/^[A-Za-z0-9_.-]+$/.test(model.portable_subdir || '') || ['.', '..'].includes(model.portable_subdir) || directories.has(model.portable_subdir)) throw new Error('Unique portable model subdirectory required');
    directories.add(model.portable_subdir);
    if (!['GGUF', 'Safetensors'].includes(model.weight_format) || typeof model.quantization !== 'string' || !model.quantization) throw new Error(`${model.id}: format/quantization required`);
    if (!Array.isArray(model.engines) || !model.engines.length || model.engines.some((engine) => !['ollama', 'llama.cpp', 'vllm', 'sglang'].includes(engine))) throw new Error(`${model.id}: serving engines required`);
    if (!Array.isArray(model.files) || !model.files.length) throw new Error(`${model.id}: files required`);
    const files = new Set();
    for (const file of model.files) {
      relativePath(file.path, `${model.id} file`);
      fingerprint(file, `${model.id}/${file.path}`);
      if (!ROLES.includes(file.role) || files.has(file.path) || (file.embedded_roles && (!Array.isArray(file.embedded_roles) || file.embedded_roles.some((role) => !ROLES.includes(role))))) throw new Error(`${model.id}: unique role-bearing file entries required`);
      files.add(file.path);
    }
    if (!model.files.some((file) => file.role === 'weight')) throw new Error(`${model.id}: weight required`);
    if (model.weight_format === 'GGUF' && model.files.filter((file) => file.role === 'weight').length !== 1) throw new Error(`${model.id}: single GGUF weight required`);
    for (const role of ['tokenizer', 'chat_template']) {
      if (!model.files.some((file) => file.role === role || file.embedded_roles?.includes(role))) throw new Error(`${model.id}: ${role} fingerprint required`);
    }
  }
  return manifest;
}

function loadModelManifest(file = DEFAULT_LOCK) {
  return validateModelManifest(JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')));
}
function modelById(manifest, id) {
  validateModelManifest(manifest);
  const model = manifest.models.find((entry) => entry.id === id);
  if (!model) throw new Error(`Unknown locked model: ${id}`);
  return model;
}
function portablePaths(root, manifest = loadModelManifest()) {
  validateModelManifest(manifest);
  const workspace = path.resolve(root);
  const portableRoot = path.join(workspace, 'model_assets', 'portable');
  const models = Object.fromEntries(manifest.models.map((model) => {
    const directory = path.join(portableRoot, model.portable_subdir);
    const files = model.files.map((file) => ({ ...file, relative_path: file.path, path: path.join(directory, ...file.path.split('/')) }));
    return [model.id, { id: model.id, directory,
      model_path: model.weight_format === 'GGUF' ? files.find((file) => file.role === 'weight').path : directory, files }];
  }));
  return { workspace, portable_root: portableRoot, models,
    template: { ...manifest.template, path: path.join(workspace, ...manifest.template.workspace_relative_path.split('/')) } };
}
function verifyPinnedTemplate(root, manifest = loadModelManifest()) {
  const location = portablePaths(root, manifest).template;
  const bytes = fs.readFileSync(location.path);
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (bytes.length !== location.bytes || actual !== location.sha256) throw new Error('Pinned chat template byte/hash mismatch');
  return { ...location, actual_sha256: actual, verified: true };
}

module.exports = { DEFAULT_LOCK, loadModelManifest, validateModelManifest, modelById, portablePaths, verifyPinnedTemplate };
