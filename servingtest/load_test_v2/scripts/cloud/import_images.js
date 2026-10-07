#!/usr/bin/env node
'use strict';
const path = require('node:path');
const { run } = require('../lib/runtime');
const { ROOT, readJSON, hashFileSync, verifyDockerImages, safePath } = require('./bundle');
const { verifyTransferFiles } = require('./export_images');
async function main(argv = process.argv.slice(2)) {
  if (argv.length !== 2 || argv[0] !== '--bundle') throw new Error('usage: import_images.js --bundle PATH');
  const directory = path.resolve(argv[1]);
  const transfer = readJSON(path.join(directory, 'images.transfer.json'));
  const lock = readJSON(path.join(ROOT, 'load_test_v2/config/images.lock.json'));
  if (transfer.images?.some(item => !lock.images.some(expected => expected.reference === item.reference
    && expected.config_fingerprint === item.config_fingerprint))) throw new Error('Transferred image differs from the source image lock.');
  await verifyTransferFiles(directory, transfer, lock.images);
  // All archive fingerprints are checked before any Docker mutation.
  for (const item of transfer.images) {
    const loaded = await run('docker', ['image', 'load', '--input', safePath(directory, item.file)], { timeoutMs: 1200000 });
    if (loaded.code !== 0) throw new Error(`Image load failed: ${item.file}`);
    process.stdout.write(JSON.stringify({ event: 'loaded', image: item.id }) + '\n');
  }
  const actual = await verifyDockerImages({ manifest: lock });
  process.stdout.write(JSON.stringify({ ...actual, images_lock_sha256: hashFileSync(path.join(ROOT, 'load_test_v2/config/images.lock.json')) }) + '\n');
}
if (require.main === module) main().catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
