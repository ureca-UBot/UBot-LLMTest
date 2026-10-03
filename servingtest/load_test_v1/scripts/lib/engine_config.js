'use strict';
const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const { models } = require('../config/load_config');
const ENGINES = ['llama.cpp', 'vllm', 'sglang'];

function apiModelName(entry) {
  // SGLang reserves ':' for model:LoRA-adapter; retain the original tag in results.
  return entry.engine === 'sglang' ? entry.model.replace(/:/g, '-') : entry.model;
}

function validate(entry) {
  if (!ENGINES.includes(entry.engine) || !models.some((m) => m.tag === entry.model)) throw new Error('알 수 없는 엔진·모델');
  if (typeof entry.enabled !== 'boolean') throw new Error('enabled는 true/false여야 합니다');
  if (!entry.enabled) return;
  for (const key of ['model_path', 'revision', 'version', 'weight_format', 'quantization']) {
    if (typeof entry[key] !== 'string' || !entry[key] || entry[key].includes('REPLACE')) throw new Error(`${key}를 실제 EC2 구성으로 지정하세요`);
  }
  if (!path.posix.isAbsolute(entry.model_path)) throw new Error('model_path는 EC2의 로컬 절대 경로여야 합니다');
  if (!Array.isArray(entry.command) || !entry.command.length || entry.command.some((v) => typeof v !== 'string')) throw new Error('command는 실행 파일·기본 인자 배열이어야 합니다');
  if (entry.engine !== 'llama.cpp' && (entry.command.length !== 3 || entry.command[1] !== '-m'
    || entry.command[2] !== (entry.engine === 'vllm' ? 'vllm.entrypoints.openai.api_server' : 'sglang.launch_server'))) {
    throw new Error('Python 엔진 command는 [가상환경 python, -m, 서버 모듈]로 지정하세요');
  }
  if (!Number.isInteger(entry.port) || entry.port < 1024 || entry.port > 65535) throw new Error('port 범위: 1024~65535');
  if (entry.dtype !== undefined && entry.dtype !== 'half' && entry.dtype !== 'float16') throw new Error('T4 시험의 dtype은 half/float16으로 지정하세요');
  if (entry.engine !== 'llama.cpp' && entry.weight_format === 'GGUF'
    && (typeof entry.tokenizer_path !== 'string' || !path.posix.isAbsolute(entry.tokenizer_path))) {
    throw new Error('Python GGUF 엔진에는 로컬 절대 tokenizer_path가 필요합니다');
  }
  if (entry.memory_fraction !== undefined && !(entry.memory_fraction > 0 && entry.memory_fraction < 1)) throw new Error('memory_fraction 범위: 0~1 사이');
  if (entry.skip_server_warmup !== undefined && (entry.engine !== 'sglang' || typeof entry.skip_server_warmup !== 'boolean')) {
    throw new Error('skip_server_warmup은 SGLang의 true/false 설정입니다');
  }
  if (entry.extra_args && (!Array.isArray(entry.extra_args) || entry.extra_args.some((a) => typeof a !== 'string'))) throw new Error('extra_args는 문자열 배열이어야 합니다');
  // 모델·포트·context·병렬 수·기동 토폴로지를 덮어쓰면 비교와 프로세스 소유권이 깨진다.
  const reserved = /^(?:--(?:model|model-path|model-weights|tokenizer|tokenizer-path|hf-config-path|load-format|quantization|served-model-name|alias|host|port|ctx-size|parallel|max-model-len|context-length|max-num-seqs|max-running-requests|tensor-parallel-size|tp-size|tp|dp-size|dp|pp-size|data-parallel-size|pipeline-parallel-size|distributed-executor-backend|worker-executor-backend|cpu-offload-gb|offload-backend|n-gpu-layers|gpu-layers|dtype|device|config|chat-template-kwargs)|-m|-c|-np|-ngl)(?:=|$)/;
  if ((entry.extra_args || []).some((a) => reserved.test(a))) throw new Error('extra_args에서 모델·메모리 오프로딩·동시성·서버 토폴로지는 변경할 수 없습니다');
  if (entry.engine === 'llama.cpp' && entry.command.slice(1).some((a) => reserved.test(a))) throw new Error('command의 기본 인자에는 모델·서버 설정을 넣지 마세요');
}

function launchSpec(entry, { parallel, numCtx }) {
  const common = ['--host', '127.0.0.1', '--port', String(entry.port)];
  let args;
  if (entry.engine === 'llama.cpp') {
    args = ['--model', entry.model_path, '--alias', entry.model, ...common,
      '--parallel', String(parallel), '--ctx-size', String(numCtx * parallel),
      '--n-gpu-layers', '999', '--no-warmup', '--no-context-shift', '--metrics'];
    if (entry.model.startsWith('qwen')) args.push('--chat-template-kwargs', '{"enable_thinking":false}');
  } else if (entry.engine === 'vllm') {
    args = ['--model', entry.model_path, '--served-model-name', entry.model, ...common,
      '--dtype', entry.dtype || 'half', '--max-model-len', String(numCtx),
      '--max-num-seqs', String(parallel), '--gpu-memory-utilization', String(entry.memory_fraction || 0.85),
      '--tensor-parallel-size', '1', '--enforce-eager', '--generation-config', 'vllm'];
    if (entry.weight_format === 'GGUF') {
      args.push('--quantization', 'gguf', '--load-format', 'gguf', '--tokenizer', entry.tokenizer_path,
        '--hf-config-path', entry.tokenizer_path);
    } else if (entry.quantization !== 'none') args.push('--quantization', entry.quantization);
  } else {
    args = ['--model-path', entry.model_path, '--served-model-name', apiModelName(entry), ...common,
      '--dtype', entry.dtype || 'float16', '--context-length', String(numCtx),
      '--max-running-requests', String(parallel), '--mem-fraction-static', String(entry.memory_fraction || 0.85),
      '--tp-size', '1', '--disable-cuda-graph', '--enable-metrics'];
    if (entry.skip_server_warmup !== false) args.push('--skip-server-warmup');
    if (entry.weight_format === 'GGUF') {
      args.push('--quantization', 'gguf', '--load-format', 'gguf', '--tokenizer-path', entry.tokenizer_path);
    } else if (entry.quantization !== 'none') args.push('--quantization', entry.quantization);
  }
  return { ...(entry.engine === 'sglang' ? { server_warmup_disabled: entry.skip_server_warmup !== false } : {}),
    command: entry.command[0], args: [...entry.command.slice(1), ...args, ...(entry.extra_args || [])],
    env: { ...(entry.env || {}), CUDA_VISIBLE_DEVICES: '0', HF_HUB_OFFLINE: '1', TRANSFORMERS_OFFLINE: '1' }, host: `http://127.0.0.1:${entry.port}` };
}

function loadMatrix(file) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(data.combinations)) throw new Error('combinations 배열이 필요합니다');
  const seen = new Set();
  for (const entry of data.combinations) {
    const key = `${entry.engine}/${entry.model}`;
    if (seen.has(key)) throw new Error(`중복 조합: ${key}`);
    seen.add(key);
    try { validate(entry); } catch (e) { throw new Error(`${key}: ${e.message}`); }
  }
  return data.combinations;
}

function configHash(entry) {
  return createHash('sha256').update(JSON.stringify(entry)).digest('hex');
}

module.exports = { ENGINES, validate, launchSpec, loadMatrix, configHash, apiModelName };
