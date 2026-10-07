#!/usr/bin/env node
'use strict';
// Capture already prepared images. No pull, server launch, model registration,
// or cloud access is performed here.
const fs = require('node:fs');
const path = require('node:path');
const { run } = require('../lib/runtime');
const { candidates: recipes } = require('../dev/run_local_cleanup_probe');
const { ROOT, imageFingerprint } = require('./bundle');
const { loadModelManifest, portablePaths } = require('./model_manifest');
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
async function main() {
  const imageFile = path.join(ROOT, 'load_test_v2/config/images.lock.json');
  const profileFile = path.join(ROOT, 'load_test_v2/config/http.t4.json');
  if (fs.existsSync(imageFile) || fs.existsSync(profileFile)) throw new Error('Image/profile locks already exist; review an explicit new snapshot instead of overwriting them.');
  const sources = [
    ['ollama', 'ollama/ollama:0.34.0', true],
    ['llamacpp', 'ghcr.io/ggml-org/llama.cpp:server-cuda', true],
    ['vllm', 'vllm/vllm-openai:v0.30.0', true],
    ['sglang', 'llm-local-opt-sglang:0.4.6-post5', false],
    ['runner', 'llm-frozen/runner:20261002-node24.17.0', false],
  ];
  const images = [];
  for (const [id, source, registry] of sources) {
    const inspected = await run('docker', ['image', 'inspect', source]);
    if (inspected.code !== 0) throw new Error(`Image inspection failed: ${source}`);
    const info = JSON.parse(inspected.stdout)[0], fingerprint = imageFingerprint(info);
    const reference = `llm-frozen/${id}:20261002-${fingerprint.slice(0, 12)}`;
    const tag = await run('docker', ['image', 'tag', info.Id, reference]);
    if (tag.code !== 0) throw new Error(`Frozen alias could not be created: ${id}`);
    images.push({ id, reference, source_reference: source, source_id: info.Id,
      source_digest: registry ? (info.RepoDigests || [])[0] || null : null,
      transfer_method: 'archive', platform: 'linux/amd64', config_fingerprint: fingerprint,
      created: info.Created, size_bytes: info.Size,
      rootfs_layers: info.RootFS.Layers,
      source_identity_limitation: 'Captured current daemon image. Earlier benchmark reports did not record image IDs.' });
  }
  const locations = portablePaths(ROOT, loadModelManifest());
  const relative = value => path.relative(ROOT, value).split(path.sep).join('/');
  const gguf = locations.models.qwen3_4b_gguf_q4km, awq = locations.models.qwen3_4b_awq;
  const definitions = [
    ['ollama_p4', 'ollama', 4, [1, 4, 8, 16, 32]], ['llamacpp_p4', 'llamacpp', 4, [4, 8, 16, 32]],
    ['vllm_s8', 'vllm', 8, [4, 8, 16, 32]], ['sglang_r8', 'sglang', 8, [4, 8, 16, 32]],
    ['vllm_s32', 'vllm', 32, [16, 32, 64]], ['sglang_r32', 'sglang', 32, [16, 32, 64]],
  ];
  const setArg = (args, name, value) => { const index = args.indexOf(name); if (index < 0) throw new Error(name); args[index + 1] = String(value); };
  const candidates = definitions.map(([id, recipe, limit, users], index) => {
    const candidate = structuredClone(recipes().find(x => x.id === recipe));
    Object.assign(candidate, { id, users, internal_limit: limit, host: `http://127.0.0.1:${19551 + index}`,
      checkpoint: 'Qwen/Qwen3-4B official GGUF/AWQ release', model_family: 'Qwen/Qwen3-4B', cpu_offload: 'none',
      benchmark_eligible: false, lineage_limitation: 'Exact source conversion commit equivalence remains unverified.' });
    candidate.runtime.image = images.find(x => x.id === recipe).reference;
    candidate.runtime.env = { ...candidate.runtime.env, HF_HUB_OFFLINE: '1', TRANSFORMERS_OFFLINE: '1' };
    if (recipe === 'ollama') {
      candidate.api_model = 'qwen3-baseline:4b';
      candidate.format = 'GGUF Q4_K_M';
      candidate.runtime.mounts = [{ source: relative(gguf.directory), target: '/artifacts/gguf', read_only: true }];
      Object.assign(candidate.runtime.env, { OLLAMA_MODELS: '/models', OLLAMA_NUM_PARALLEL: String(limit), OLLAMA_KEEP_ALIVE: '-1' });
      candidate.import_model = { from: '/artifacts/gguf/Qwen3-4B-Q4_K_M.gguf' };
    } else if (recipe === 'llamacpp') {
      candidate.format = 'GGUF Q4_K_M';
      candidate.runtime.mounts = [{ source: relative(gguf.directory), target: '/artifacts/gguf', read_only: true },
        { source: relative(locations.template.path), target: '/templates/qwen3_base.jinja', read_only: true }];
      setArg(candidate.runtime.args, '--model', '/artifacts/gguf/Qwen3-4B-Q4_K_M.gguf');
      setArg(candidate.runtime.args, '--parallel', limit); setArg(candidate.runtime.args, '--ctx-size', limit * 4096);
    } else {
      candidate.runtime.mounts = [{ source: relative(awq.directory), target: '/artifacts/awq', read_only: true }];
      if (recipe === 'vllm') { candidate.runtime.args[0] = '/artifacts/awq'; setArg(candidate.runtime.args, '--max-num-seqs', limit); }
      else { setArg(candidate.runtime.args, '--model-path', '/artifacts/awq'); setArg(candidate.runtime.args, '--max-running-requests', limit); setArg(candidate.runtime.args, '--cuda-graph-max-bs', limit); }
      candidate.runtime.args.push('--revision', '74d4bd2bd4bff9cafc9345221320bffb08b406a3');
    }
    return candidate;
  });
  const profile = { schema_version: 1, scope: 't4_http_capacity_exploration',
    hardware: { gpu_count: 1, gpu: 'Tesla T4', min_linux_driver: '580.95.05',
      backend_policy: 'Keep image/settings fixed; inspect actual backend on target GPU. Local FlashAttention2 is not T4 compatible.' },
    profile: { target_rps: 8, measure_ms: 30000, min_requests: 20, timeout_ms: 120000, seed: 20261002 },
    generation: { context: 4096, max_tokens: 512, temperature: 0, thinking: false },
    transport: { streaming: true, keep_alive: true, timeout_ms: 120000, retries: 0 },
    workload: { file: 'load_test_v2/data/benchmark_prompts.jsonl', sha256: '67ca43b2b901360cefde705a872e52441edc107abb4c19b202f746d923ea4122', case_count: 300 },
    candidates };
  write(imageFile, { schema_version: 1, captured_at: new Date().toISOString(), platform: 'linux/amd64', images });
  write(profileFile, profile);
  process.stdout.write(JSON.stringify({ images: images.map(({ id, reference, size_bytes }) => ({ id, reference, size_bytes })), imageFile, profileFile }) + '\n');
}
if (require.main === module) main().catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
