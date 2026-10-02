#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { run } = require('../lib/runtime');
const { ROOT, readJSON, verifyDockerImages, imageFingerprint, fingerprintFile, safePath } = require('./bundle');
const emit = value => process.stdout.write(JSON.stringify(value) + '\n');
async function main(argv = process.argv.slice(2)) {
  if (argv.length !== 2 || argv[0] !== '--out') throw new Error('usage: export_images.js --out docker_artifacts/NEW_BUNDLE');
  const out = path.resolve(argv[1]), base = path.join(ROOT, 'docker_artifacts');
  const relation = path.relative(base, out);
  if (!relation || relation.startsWith('..') || path.isAbsolute(relation) || fs.existsSync(out)) throw new Error('Use a new subdirectory of docker_artifacts.');
  const lock = readJSON(path.join(ROOT, 'load_test_v2/config/images.lock.json'));
  const verified = await verifyDockerImages({ manifest: lock });
  fs.mkdirSync(out, { recursive: true });
  const report = { schema_version: 1, status: 'exporting', platform: 'linux/amd64',
    created_at: new Date().toISOString(), images: [], model_included: false, inference_run: false };
  const save = () => fs.writeFileSync(path.join(out, 'images.transfer.json'), JSON.stringify(report, null, 2) + '\n');
  save();
  try {
    for (const item of verified.images) {
      const name = `${item.id}.tar`, partial = path.join(out, name + '.partial'), file = path.join(out, name);
      emit({ event: 'export_start', image: item.id });
      const exported = await run('docker', ['image', 'save', '--platform', 'linux/amd64', '--output', partial, item.reference], { timeoutMs: 1200000 });
      if (exported.code !== 0) throw new Error(`Image export failed: ${item.id}: ${exported.stderr || exported.error}`);
      const again = await run('docker', ['image', 'inspect', item.reference]);
      if (again.code !== 0 || imageFingerprint(JSON.parse(again.stdout)[0]) !== item.config_fingerprint) throw new Error('Image alias changed during export.');
      const artifact = await fingerprintFile(partial);
      fs.renameSync(partial, file);
      report.images.push({ ...item, file: name, bytes: artifact.bytes, sha256: artifact.sha256 });
      save(); emit({ event: 'exported', image: item.id, bytes: artifact.bytes, sha256: artifact.sha256 });
    }
    report.status = 'completed'; report.finished_at = new Date().toISOString(); save();
    emit({ event: 'complete', out, bytes: report.images.reduce((sum, x) => sum + x.bytes, 0) });
  } catch (error) { report.status = 'failed'; report.error = error.message; save(); throw error; }
}
async function verifyTransferFiles(directory, transfer, expectedImages) {
  if (transfer.schema_version !== 1 || transfer.status !== 'completed' || transfer.platform !== 'linux/amd64'
    || !Array.isArray(transfer.images) || transfer.images.length !== 5) throw new Error('A completed image transfer manifest is required.');
  for (const key of ['id', 'reference', 'file']) {
    if (transfer.images.some(item => typeof item[key] !== 'string' || !item[key])
      || new Set(transfer.images.map(item => item[key])).size !== transfer.images.length) throw new Error(`Transfer ${key} entries must be unique.`);
  }
  if (expectedImages) {
    const identity = items => items.map(x => `${x.id}:${x.reference}:${x.config_fingerprint}`).sort();
    if (JSON.stringify(identity(transfer.images)) !== JSON.stringify(identity(expectedImages))) throw new Error('Transfer images must match every locked image exactly once.');
  }
  for (const item of transfer.images) {
    if (!Number.isSafeInteger(item.bytes) || item.bytes <= 0 || !/^[a-f0-9]{64}$/.test(item.sha256 || '')) throw new Error('Archive size and SHA-256 are required.');
    const file = safePath(directory, item.file), actual = await fingerprintFile(file);
    if (actual.bytes !== item.bytes || actual.sha256 !== item.sha256) throw new Error(`Transfer archive differs: ${item.file}`);
  }
}
module.exports = { verifyTransferFiles };
if (require.main === module) main().catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
