'use strict';
const path = require('node:path');

// Model cache roots live separately from experiment outputs. Keep each cache's
// internal paths intact, including Hugging Face snapshot/blob links.
const ASSETS = path.resolve(__dirname, '../../../model_assets');
const HF_CACHE = path.join(ASSETS, 'huggingface');
const OLLAMA_THINKING_CACHE = path.join(ASSETS, 'ollama', 'thinking_2507');
const OLLAMA_CLASSIC_CACHE = path.join(ASSETS, 'ollama', 'qwen3_4b_classic');

module.exports = { HF_CACHE, OLLAMA_THINKING_CACHE, OLLAMA_CLASSIC_CACHE };
