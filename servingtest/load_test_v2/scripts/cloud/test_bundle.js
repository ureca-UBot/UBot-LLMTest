'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { imageFingerprint, safePath, assertArtifactDirectory, verifyDockerImages, fingerprintFile } = require('./bundle');
const { verifyTransferFiles } = require('./export_images');
const RESULTS = path.resolve(__dirname, '../../results');
function inspection(id = `sha256:${'a'.repeat(64)}`) {
  return { Id: id, Os: 'linux', Architecture: 'amd64', Created: '2026-10-02T00:00:00Z',
    RootFS: { Type: 'layers', Layers: [`sha256:${'b'.repeat(64)}`] },
    Config: { Entrypoint: ['node'], Cmd: ['test'], Env: ['A=1', 'B=2'], WorkingDir: '/workspace' } };
}
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
