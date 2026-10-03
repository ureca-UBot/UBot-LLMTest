#!/usr/bin/env node
'use strict';
// Run after reviewing source changes. Explicitly refreshes the source lock only;
// it cannot silently adopt changed engine/model/profile locks.
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, readJSON, hashFileSync } = require('./bundle');
function main(argv = process.argv.slice(2)) {
  const file = path.join(ROOT, 'load_test_v2/config/cloud.lock.json');
  if (argv.length && (argv.length !== 1 || argv[0] !== '--refresh-source-lock')) throw new Error('usage: freeze_sources.js [--refresh-source-lock]');
  if (fs.existsSync(file) && !argv.length) throw new Error('Source lock exists; review changes and explicitly use --refresh-source-lock.');
  const images = readJSON(path.join(ROOT, 'load_test_v2/config/images.lock.json'));
  const files = [];
  function collect(relative) {
    const absolute = path.join(ROOT, relative);
    if (fs.statSync(absolute).isDirectory()) {
      for (const name of fs.readdirSync(absolute).sort()) {
        if (name === '__pycache__' || name.startsWith('test_') || name.endsWith('.pyc')) continue;
        collect(`${relative}/${name}`);
      }
    } else files.push({ path: relative, sha256: hashFileSync(absolute) });
  }
  for (const p of ['.gitattributes', 'load_test_v2/scripts', 'load_test_v2/docker',
    'load_test_v2/README.cloud.md', 'load_test_v2/data/benchmark_prompts.jsonl',
    'load_test_v2/config/images.lock.json', 'load_test_v2/config/models.lock.json', 'load_test_v2/config/http.t4.json']) collect(p);
  const profileSha = hashFileSync(path.join(ROOT, 'load_test_v2/config/http.t4.json'));
  const modelsSha = hashFileSync(path.join(ROOT, 'load_test_v2/config/models.lock.json'));
  if (fs.existsSync(file)) {
    const previous = readJSON(file);
    if (profileSha !== previous.profile_sha256 || modelsSha !== previous.models_sha256
      || JSON.stringify(images.images) !== JSON.stringify(previous.images)) throw new Error('Engine/model/profile lock changed; create and review a new bundle identity.');
  }
  const manifest = { schema_version: 1, captured_at: new Date().toISOString(), platform: 'linux/amd64',
    node_version: 'v24.17.0', docker_cli_version: '29.7.2', profile_file: 'load_test_v2/config/http.t4.json',
    profile_sha256: profileSha, models_file: 'load_test_v2/config/models.lock.json', models_sha256: modelsSha,
    images: images.images, files: files.sort((a, b) => a.path.localeCompare(b.path)),
    limitations: ['GPU and host driver are outside the image. Effective kernels may differ on T4.',
      'Exact upstream GGUF/AWQ conversion lineage is unverified. This is HTTP exploration, not formal SLO capacity.'] };
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
  process.stdout.write(JSON.stringify({ manifest: file, files: files.length, sha256: hashFileSync(file) }) + '\n');
}
if (require.main === module) { try { main(); } catch (error) { process.stderr.write(error.message + '\n'); process.exitCode = 1; } }
