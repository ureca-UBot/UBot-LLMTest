'use strict';
// Candidate model registry. `tier` is informational (local = 저급/경량,
// ec2 = 고급/대형) but the pipeline itself doesn't branch on it — you just
// pass whichever --model tag you want to scripts/run_generation.js on
// whichever machine you're on. This list is what a model-sweep helper
// script would iterate over once the final candidate set is decided.
//
// 최종 확정 (2026-09-16). local = 저사양 9개(Windows, Ollama), ec2 = 고사양
// 2개(EC2, Ollama). 태그는 ollama.com/library에서 실존 확인함
// (qwen3:14b — 9.3GB, gemma3:12b — 8.1GB).

module.exports = {
  local: [
    { tag: 'gemma3:270m', tier: 'local' },
    { tag: 'qwen3:0.6b', tier: 'local' },
    { tag: 'gemma3:1b', tier: 'local' },
    { tag: 'qwen3:1.7b', tier: 'local' },
    { tag: 'exaone3.5:2.4b', tier: 'local' },
    { tag: 'qwen3:4b', tier: 'local' },
    { tag: 'gemma3:4b', tier: 'local' },
    { tag: 'exaone3.5:7.8b', tier: 'local' },
    { tag: 'qwen3:8b', tier: 'local' },
  ],
  ec2: [
    { tag: 'gemma3:12b', tier: 'ec2' },
    { tag: 'qwen3:14b', tier: 'ec2' },
  ],
  // Shared, regardless of tier.
  embeddingModel: 'bge-m3:latest',
};
