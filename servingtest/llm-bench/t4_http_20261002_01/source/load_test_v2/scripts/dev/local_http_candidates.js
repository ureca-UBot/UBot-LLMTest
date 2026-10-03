'use strict';
// Exploratory local HTTP completion tests only. These definitions do not certify
// artifact lineage or semantic quality for the formal benchmark.
const fs = require('node:fs');
const path = require('node:path');
const { candidates: lifecycleCandidates } = require('./run_local_cleanup_probe');
const { HF_CACHE } = require('./model_assets');

const ROOT = path.resolve(__dirname, '../..');
const GGUF_REVISION = 'bc640142c66e1fdd12af0bd68f40445458f3869b';
const AWQ_REVISION = '74d4bd2bd4bff9cafc9345221320bffb08b406a3';
const GGUF_RELATIVE = `hub/models--Qwen--Qwen3-4B-GGUF/snapshots/${GGUF_REVISION}/Qwen3-4B-Q4_K_M.gguf`;

function setArgument(args, name, value) {
  const index = args.indexOf(name);
  if (index < 0) throw new Error(`Missing candidate argument: ${name}`);
  args[index + 1] = String(value);
}

function prepareCandidates(outputDir) {
  if (typeof outputDir !== 'string' || !path.isAbsolute(outputDir)) throw new Error('Candidate output directory must be absolute.');
  const directory = path.resolve(outputDir), results = path.join(ROOT, 'results');
  const relative = path.relative(results, directory);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Candidate output must be within load_test_v2/results.');
  fs.mkdirSync(directory, { recursive: true });
  const modelfile = path.join(directory, 'Modelfile');
  // Import only into each owned, temporary container's private Ollama store.
  // The initial FROM-only definition lets the probe inspect automatic template
  // selection before accepting thinking-off behavior; no old template is copied.
  fs.writeFileSync(modelfile, `FROM /hf/${GGUF_RELATIVE}\n`, { flag: 'wx' });

  const original = lifecycleCandidates();
  const definitions = [
    ['ollama_p4', 'ollama', 4, [1, 4, 8, 16, 32]],
    ['llamacpp_p4', 'llamacpp', 4, [4, 8, 16, 32]],
    ['vllm_s8', 'vllm', 8, [4, 8, 16, 32]],
    ['sglang_r8', 'sglang', 8, [4, 8, 16, 32]],
    ['vllm_s32', 'vllm', 32, [16, 32, 64]],
    ['sglang_r32', 'sglang', 32, [16, 32, 64]],
  ];
  return definitions.map(([id, sourceId, limit, users], index) => {
    const candidate = structuredClone(original.find(item => item.id === sourceId));
    if (!candidate) throw new Error(`Unknown source candidate: ${sourceId}`);
    Object.assign(candidate, { id, host: `http://127.0.0.1:${19551 + index}`, internal_limit: limit, users,
      model_family: 'Qwen/Qwen3-4B', cpu_offload: 'none',
      checkpoint: 'Qwen/Qwen3-4B (official GGUF or AWQ artifact)',
      benchmark_eligible: false,
      lineage_limitation: 'Official model cards declare Qwen/Qwen3-4B as base_model; exact upstream conversion revision is not automatically proven.' });
    const gguf = candidate.engine === 'ollama' || candidate.engine === 'llama.cpp';
    candidate.weight_source_repository = gguf ? 'Qwen/Qwen3-4B-GGUF' : 'Qwen/Qwen3-4B-AWQ';
    candidate.weight_source_revision = gguf ? GGUF_REVISION : AWQ_REVISION;
    candidate.format = gguf ? 'GGUF Q4_K_M' : 'Safetensors AWQ';
    candidate.runtime.env = { ...candidate.runtime.env, HF_HUB_OFFLINE: '1', TRANSFORMERS_OFFLINE: '1' };

    if (candidate.engine === 'ollama') {
      candidate.api_model = 'qwen3-baseline:4b';
      candidate.runtime.mounts = [
        { source: HF_CACHE, target: '/hf', read_only: true },
        { source: modelfile, target: '/benchmark/Modelfile', read_only: true },
      ];
      candidate.runtime.env.OLLAMA_NUM_PARALLEL = String(limit);
      candidate.runtime.env.OLLAMA_MODELS = '/models';
      candidate.runtime.env.OLLAMA_KEEP_ALIVE = '-1';
      candidate.import_model = { command: ['ollama', 'create', candidate.api_model, '-f', '/benchmark/Modelfile'],
        timing: 'after_docker_start_before_model_readiness', modelfile,
        template_verification_required: true };
    } else if (candidate.engine === 'llama.cpp') {
      candidate.runtime.mounts = [
        { source: HF_CACHE, target: '/root/.cache/huggingface', read_only: true },
        { source: path.join(HF_CACHE, 'qwen3_base.jinja'), target: '/templates/qwen3_base.jinja', read_only: true },
      ];
      setArgument(candidate.runtime.args, '--model', `/root/.cache/huggingface/${GGUF_RELATIVE}`);
      setArgument(candidate.runtime.args, '--parallel', limit);
      setArgument(candidate.runtime.args, '--ctx-size', 4096 * limit);
    } else if (candidate.engine === 'vllm') {
      setArgument(candidate.runtime.args, '--max-num-seqs', limit);
      candidate.runtime.args.push('--revision', AWQ_REVISION);
    } else {
      setArgument(candidate.runtime.args, '--max-running-requests', limit);
      setArgument(candidate.runtime.args, '--cuda-graph-max-bs', limit);
      candidate.runtime.args.push('--revision', AWQ_REVISION);
    }
    return candidate;
  });
}

module.exports = { prepareCandidates };
