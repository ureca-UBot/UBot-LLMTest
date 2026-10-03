'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { imageFingerprint, safePath, assertArtifactDirectory, verifyDockerImages, fingerprintFile,
  validateFrozenBundle, selectDependencies, hashFileSync } = require('./bundle');
const { verifyTransferFiles } = require('./export_images');
const RESULTS = path.resolve(__dirname, '../../results');
function inspection(id = `sha256:${'a'.repeat(64)}`) {
  return { Id: id, Os: 'linux', Architecture: 'amd64', Created: '2026-10-02T00:00:00Z',
    RootFS: { Type: 'layers', Layers: [`sha256:${'b'.repeat(64)}`] },
    Config: { Entrypoint: ['node'], Cmd: ['test'], Env: ['A=1', 'B=2'], WorkingDir: '/workspace' } };
}

function selectedFixture() {
  fs.mkdirSync(RESULTS, { recursive: true });
  const root = fs.mkdtempSync(path.join(RESULTS, 'selected_bundle_'));
  const contents = new Map();
  function write(relative, content) {
    const file = path.join(root, ...relative.split('/')); fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content); contents.set(relative, content);
    return { path: relative, bytes: fs.statSync(file).size, sha256: hashFileSync(file) };
  }
  const writeJSON = (relative, value) => write(relative, JSON.stringify(value, null, 2) + '\n');
  const template = write('model_assets/portable/qwen3_base.jinja', 'locked template fixture\n');
  const metadata = write('metadata.upstream.json', '{"fixture":true}\n');
  const source = write('scripts/common.js', '// frozen source fixture\n');
  const workload = write('data/workload.jsonl', Array.from({ length: 300 }, (_, i) => JSON.stringify({ case_id: `fixture-${i}`,
    type: 'fixture', messages: [{ role: 'user', content: `prompt ${i}` }] })).join('\n') + '\n');
  function file(subdir, name, content, role, embedded_roles) {
    const actual = write(`model_assets/portable/${subdir}/${name}`, content);
    return { path: name, bytes: actual.bytes, sha256: actual.sha256, role, ...(embedded_roles ? { embedded_roles } : {}) };
  }
  const modelManifest = { schema_version: 1, model_family: 'Qwen3-4B',
    upstream: { repository: 'Qwen/Qwen3-4B', revision: 'a'.repeat(40), conversion_commit_verified: false, metadata },
    lineage_status: 'pending_exact_upstream_conversion_commit', lineage_note: 'Mock artifact lineage is explicitly pending.',
    template: { workspace_relative_path: template.path, bytes: template.bytes, sha256: template.sha256,
      source: { repository: 'Qwen/Qwen3-4B', revision: 'a'.repeat(40), path: 'tokenizer_config.json', field: 'chat_template' } },
    models: [
      { id: 'qwen3_4b_gguf_q4km', repository: 'Qwen/Qwen3-4B-GGUF', revision: 'b'.repeat(40), portable_subdir: 'Qwen3-4B-GGUF',
        weight_format: 'GGUF', quantization: 'Q4_K_M', engines: ['ollama', 'llama.cpp'],
        files: [file('Qwen3-4B-GGUF', 'model.gguf', 'mock GGUF weight bytes\n', 'weight', ['tokenizer', 'chat_template', 'config'])] },
      { id: 'qwen3_4b_awq', repository: 'Qwen/Qwen3-4B-AWQ', revision: 'c'.repeat(40), portable_subdir: 'Qwen3-4B-AWQ',
        weight_format: 'Safetensors', quantization: 'AWQ', engines: ['vllm', 'sglang'],
        files: [file('Qwen3-4B-AWQ', 'model.safetensors', 'mock AWQ weight bytes\n', 'weight'),
          file('Qwen3-4B-AWQ', 'tokenizer_config.json', '{"chat_template":"fixture"}\n', 'tokenizer', ['chat_template'])] },
    ] };
  const modelLock = writeJSON('config/models.lock.json', modelManifest);
  const images = ['ollama', 'llamacpp', 'vllm', 'sglang', 'runner'].map((id, index) => {
    const info = inspection(`sha256:${'abcde'[index].repeat(64)}`); info.Config.Cmd = ['fixture', id];
    return { id, reference: `llm-frozen/${id}:fixture`, source_id: info.Id, config_fingerprint: imageFingerprint(info), info };
  });
  const imageEntries = images.map(({ info, ...lock }) => lock);
  const imagesLock = writeJSON('load_test_v2/config/images.lock.json', { schema_version: 1, platform: 'linux/amd64', images: imageEntries });
  const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../config/http.t4.json'), 'utf8'));
  const imageIds = { ollama: 'ollama', 'llama.cpp': 'llamacpp', vllm: 'vllm', sglang: 'sglang' };
  config.workload = { file: workload.path, sha256: workload.sha256, case_count: 300 };
  for (const candidate of config.candidates) {
    const subdir = ['ollama', 'llama.cpp'].includes(candidate.engine) ? 'Qwen3-4B-GGUF' : 'Qwen3-4B-AWQ';
    candidate.runtime.mounts = [{ source: `model_assets/portable/${subdir}`, target: '/artifacts', read_only: true }];
    if (candidate.engine === 'llama.cpp') candidate.runtime.mounts.push({ source: template.path, target: '/templates/qwen3_base.jinja', read_only: true });
    candidate.runtime.image = images.find(image => image.id === imageIds[candidate.engine]).reference;
  }
  const profile = writeJSON('config/http.json', config);
  const manifest = { schema_version: 1, platform: 'linux/amd64', node_version: process.version,
    profile_sha256: profile.sha256, files: [{ path: source.path, sha256: source.sha256 }, { path: template.path, sha256: template.sha256 },
      { path: imagesLock.path, sha256: imagesLock.sha256 }],
    models_file: modelLock.path, models_sha256: modelLock.sha256, images: imageEntries };
  writeJSON('config/cloud.lock.json', manifest);
  const parameters = { root, configPath: path.join(root, profile.path), manifestPath: path.join(root, 'config/cloud.lock.json') };
  function removeModel(id) {
    const model = modelManifest.models.find(value => value.id === id), directory = path.resolve(root, 'model_assets/portable', model.portable_subdir);
    if (!directory.startsWith(path.resolve(root, 'model_assets/portable') + path.sep)) throw new Error('Invalid fixture model deletion path');
    fs.rmSync(directory, { recursive: true, force: true });
  }
  function restore(relative) { write(relative, contents.get(relative)); }
  function close() {
    if (path.dirname(root) !== RESULTS || !path.basename(root).startsWith('selected_bundle_')) throw new Error('Invalid fixture cleanup path');
    fs.rmSync(root, { recursive: true, force: true });
  }
  return { root, parameters, images, config, manifest, modelManifest, write, writeJSON, removeModel, restore, close };
}

function mockImages(fixture, available) {
  const calls = [];
  return { calls, commandRunner: async (command, args) => {
    assert.equal(command, 'docker'); assert.deepEqual(args.slice(0, 2), ['image', 'inspect']);
    calls.push(args[2]);
    const image = fixture.images.find(entry => entry.reference === args[2]);
    return available.has(image?.id) ? { code: 0, stdout: JSON.stringify([image.info]) }
      : { code: 1, stdout: '', stderr: 'unavailable mock image' };
  } };
}

test('selected model verification allows missing unrelated weights and preserves strict default', async () => {
  const fixture = selectedFixture();
  try {
    const full = await validateFrozenBundle({ ...fixture.parameters, verifyModels: true });
    assert.deepEqual(full.selected_candidates.map(candidate => candidate.id), fixture.config.candidates.map(candidate => candidate.id));
    assert.deepEqual(full.required_models.map(model => model.id).sort(), ['qwen3_4b_awq', 'qwen3_4b_gguf_q4km']);
    assert.equal(full.model_readiness.sha256_verified, true);
    fixture.removeModel('qwen3_4b_awq');
    const ollama = await validateFrozenBundle({ ...fixture.parameters, candidateId: 'ollama_p4', verifyModels: true });
    assert.deepEqual(ollama.selected_candidates.map(candidate => candidate.id), ['ollama_p4']);
    assert.deepEqual(ollama.required_models.map(model => model.id), ['qwen3_4b_gguf_q4km']);
    assert(ollama.model_files.every(file => file.path.includes('Qwen3-4B-GGUF')));
    assert.equal(ollama.model_readiness.present, true); assert.equal(ollama.model_readiness.sha256_verified, true);
    await assert.rejects(validateFrozenBundle({ ...fixture.parameters, candidateId: 'vllm_s8', verifyModels: true }));
    await assert.rejects(validateFrozenBundle({ ...fixture.parameters, verifyModels: true }));
    await assert.rejects(validateFrozenBundle({ ...fixture.parameters, candidateId: 'unknown', verifyModels: false }), /Unknown candidate/);
    fixture.restore('model_assets/portable/Qwen3-4B-AWQ/model.safetensors'); fixture.restore('model_assets/portable/Qwen3-4B-AWQ/tokenizer_config.json');
    fixture.removeModel('qwen3_4b_gguf_q4km');
    const vllm = await validateFrozenBundle({ ...fixture.parameters, candidateId: 'vllm_s32', verifyModels: true });
    assert.deepEqual(vllm.required_models.map(model => model.id), ['qwen3_4b_awq']);
    assert(vllm.model_files.every(file => file.path.includes('Qwen3-4B-AWQ')));
    await assert.rejects(validateFrozenBundle({ ...fixture.parameters, candidateId: 'llamacpp_p4', verifyModels: true }));
  } finally { fixture.close(); }
});

test('selected model tampering fails while unrelated bytes are not read', async () => {
  const fixture = selectedFixture();
  try {
    const ggufFile = 'model_assets/portable/Qwen3-4B-GGUF/model.gguf';
    fs.writeFileSync(path.join(fixture.root, ggufFile), 'altered GGUF bytes');
    await validateFrozenBundle({ ...fixture.parameters, candidateId: 'sglang_r8', verifyModels: true });
    await assert.rejects(validateFrozenBundle({ ...fixture.parameters, candidateId: 'ollama_p4', verifyModels: true }), /Model artifact differs/);
    await assert.rejects(validateFrozenBundle({ ...fixture.parameters, verifyModels: true }), /Model artifact differs/);
    fixture.restore(ggufFile);
    const awqFile = 'model_assets/portable/Qwen3-4B-AWQ/model.safetensors';
    fs.writeFileSync(path.join(fixture.root, awqFile), 'altered AWQ bytes');
    await validateFrozenBundle({ ...fixture.parameters, candidateId: 'llamacpp_p4', verifyModels: true });
    await assert.rejects(validateFrozenBundle({ ...fixture.parameters, candidateId: 'vllm_s8', verifyModels: true }), /Model artifact differs/);
  } finally { fixture.close(); }
});

test('selection keeps global source, profile and model lock fingerprints strict', async () => {
  const fixture = selectedFixture();
  try {
    fixture.removeModel('qwen3_4b_awq');
    fs.writeFileSync(path.join(fixture.root, 'scripts/common.js'), '// changed source');
    await assert.rejects(validateFrozenBundle({ ...fixture.parameters, candidateId: 'ollama_p4', verifyModels: true }), /Frozen source changed/);
    fixture.restore('scripts/common.js');
    const changedProfile = structuredClone(fixture.config); changedProfile.candidates.find(candidate => candidate.id === 'vllm_s32').users = [1];
    fs.writeFileSync(fixture.parameters.configPath, JSON.stringify(changedProfile));
    await assert.rejects(validateFrozenBundle({ ...fixture.parameters, candidateId: 'ollama_p4', verifyModels: true }), /Invalid frozen candidate/);
    fixture.restore('config/http.json');
    const changedLock = structuredClone(fixture.modelManifest); changedLock.lineage_note += ' altered';
    fs.writeFileSync(path.join(fixture.root, 'config/models.lock.json'), JSON.stringify(changedLock));
    await assert.rejects(validateFrozenBundle({ ...fixture.parameters, candidateId: 'ollama_p4', verifyModels: true }), /Model lock fingerprint/);
  } finally { fixture.close(); }
});

test('selected preflight rejects altered cloud image metadata against the full frozen image lock', async () => {
  const fixture = selectedFixture();
  try {
    const altered = structuredClone(fixture.manifest);
    altered.images.find(image => image.id === 'vllm').config_fingerprint = '0'.repeat(64);
    fs.writeFileSync(fixture.parameters.manifestPath, JSON.stringify(altered));
    await assert.rejects(validateFrozenBundle({ ...fixture.parameters, candidateId: 'ollama_p4', verifyModels: true }), /image lock|image metadata|image.*differ/i);
  } finally { fixture.close(); }
});

test('selected engine and common runner images are required but absent unrelated images are allowed', async () => {
  const fixture = selectedFixture();
  try {
    const selected = await validateFrozenBundle({ ...fixture.parameters, candidateId: 'ollama_p4' });
    assert.deepEqual(selected.required_images.map(image => image.id).sort(), ['ollama', 'runner']);
    const partial = mockImages(fixture, new Set(['ollama', 'runner']));
    const verified = await verifyDockerImages(selected, partial);
    assert.deepEqual(verified.images.map(image => image.id).sort(), ['ollama', 'runner']);
    assert.deepEqual(partial.calls.sort(), selected.required_images.map(image => image.reference).sort());
    await assert.rejects(verifyDockerImages(selected, mockImages(fixture, new Set(['ollama']))), /Load the frozen image/);
    await assert.rejects(verifyDockerImages(selected, mockImages(fixture, new Set(['runner']))), /Load the frozen image/);
    const complete = await validateFrozenBundle(fixture.parameters);
    assert.equal(complete.required_images.length, 5);
    await assert.rejects(verifyDockerImages(complete, mockImages(fixture, new Set(['ollama', 'runner']))), /Load the frozen image/);
    const available = mockImages(fixture, new Set(fixture.images.map(image => image.id)));
    await verifyDockerImages(complete, available); assert.equal(available.calls.length, 5);
    fixture.images.find(image => image.id === 'vllm').info.Config.Cmd.push('altered');
    await verifyDockerImages(selected, mockImages(fixture, new Set(['ollama', 'runner'])));
    const vllm = await validateFrozenBundle({ ...fixture.parameters, candidateId: 'vllm_s8' });
    assert.deepEqual(vllm.required_images.map(image => image.id).sort(), ['runner', 'vllm']);
    await assert.rejects(verifyDockerImages(vllm, mockImages(fixture, new Set(['vllm', 'runner']))), /content differs/);
  } finally { fixture.close(); }
});

test('dependency selection rejects missing or ambiguous selected model, engine image and runner locks', () => {
  const fixture = selectedFixture();
  try {
    for (const mutate of [
      value => { value.images = value.images.filter(image => image.id !== 'runner'); },
      value => { value.images.push(structuredClone(value.images.find(image => image.id === 'runner'))); },
      value => { value.images = value.images.filter(image => image.id !== 'vllm'); },
      value => { value.images.push(structuredClone(value.images.find(image => image.id === 'vllm'))); },
    ]) {
      const changed = structuredClone(fixture.manifest); mutate(changed);
      assert.throws(() => selectDependencies(fixture.config, changed, fixture.modelManifest, 'vllm_s8'), /missing or ambiguous/);
    }
    const model = structuredClone(fixture.modelManifest);
    model.models.push({ ...structuredClone(model.models.find(entry => entry.id === 'qwen3_4b_awq')), id: 'second_awq' });
    assert.throws(() => selectDependencies(fixture.config, fixture.manifest, model, 'vllm_s8'), /model missing or ambiguous/);
  } finally { fixture.close(); }
});
test('image identity survives daemon ID differences and rejects changed filesystem/settings', async () => {
  const original = inspection(), changedStore = inspection(`sha256:${'c'.repeat(64)}`);
  assert.equal(imageFingerprint(original), imageFingerprint(changedStore));
  for (const mutate of [x => x.Config.Env.reverse(), x => x.Config.Entrypoint.push('--inspect'),
    x => x.RootFS.Layers[0] = `sha256:${'d'.repeat(64)}`, x => x.Config.Volumes = { '/models': {} }]) {
    const changed = structuredClone(original); mutate(changed); assert.notEqual(imageFingerprint(original), imageFingerprint(changed));
  }
  const lock = { id: 'runner', reference: 'llm-frozen/runner:test', source_id: original.Id, config_fingerprint: imageFingerprint(original) };
  const verified = await verifyDockerImages({ manifest: { images: [lock] } }, { commandRunner: async () => ({ code: 0, stdout: JSON.stringify([changedStore]) }) });
  assert.equal(verified.images[0].image_id, changedStore.Id);
  changedStore.Config.Cmd = ['changed'];
  await assert.rejects(verifyDockerImages({ manifest: { images: [lock] } }, { commandRunner: async () => ({ code: 0, stdout: JSON.stringify([changedStore]) }) }), /content differs/);
});
test('artifact allow-list blocks a template that overrides the pinned tokenizer configuration', () => {
  fs.mkdirSync(RESULTS, { recursive: true }); const directory = fs.mkdtempSync(path.join(RESULTS, 'bundle_files_'));
  try {
    fs.writeFileSync(path.join(directory, 'config.json'), '{}');
    const model = { directory, files: [{ relative_path: 'config.json' }] };
    assertArtifactDirectory(model);
    fs.writeFileSync(path.join(directory, 'chat_template.jinja'), 'unlocked override');
    assert.throws(() => assertArtifactDirectory(model), /Unpinned model file/);
    fs.unlinkSync(path.join(directory, 'chat_template.jinja'));
    fs.mkdirSync(path.join(directory, '.cache/huggingface'), { recursive: true });
    fs.writeFileSync(path.join(directory, '.cache/huggingface/config.metadata'), 'cache metadata');
    assertArtifactDirectory(model);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
test('image transfer requires exact unique locked images and verifies archive bytes', async () => {
  fs.mkdirSync(RESULTS, { recursive: true }); const directory = fs.mkdtempSync(path.join(RESULTS, 'bundle_transfer_'));
  try {
    const images = [];
    for (let i = 0; i < 5; i++) {
      const file = `image${i}.tar`; fs.writeFileSync(path.join(directory, file), `fixture${i}`);
      const fingerprint = await fingerprintFile(path.join(directory, file));
      images.push({ id: `image${i}`, reference: `ref${i}`, config_fingerprint: 'a'.repeat(64), file, bytes: fingerprint.bytes, sha256: fingerprint.sha256 });
    }
    const transfer = { schema_version: 1, status: 'completed', platform: 'linux/amd64', images };
    await verifyTransferFiles(directory, transfer, images);
    await assert.rejects(verifyTransferFiles(directory, { ...transfer, images: Array(5).fill(images[0]) }, images), /unique/);
    await assert.rejects(verifyTransferFiles(directory, transfer, images.slice(1)), /exactly once/);
    fs.writeFileSync(path.join(directory, images[0].file), 'tampered');
    await assert.rejects(verifyTransferFiles(directory, transfer, images), /differs/);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
test('transfer paths cannot escape their intended directory', () => {
  for (const name of ['../secret', 'a/../../secret', 'C:/secret', '/secret', 'a\\secret']) assert.throws(() => safePath(RESULTS, name));
});
