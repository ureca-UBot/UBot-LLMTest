'use strict';

// Produces unmistakably synthetic, hashed fixtures for exercising the runner.
// Nothing generated here is a usable model, an official release, or a real
// semantic-quality approval. Real-mode config/provenance checks reject it.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { ENGINES, validate } = require('../lib/config');
const { loadCases } = require('../lib/cases');

const RESULTS = path.resolve(__dirname, '../../results');
const DEFAULT_WORKLOAD = path.resolve(__dirname, '../../data/benchmark_prompts.jsonl');
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function parseArgs(argv) {
  const flags = {};
  const allowed = new Set(['output-dir', 'workload', 'base-port', 'delay-ms']);
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index]?.replace(/^--/, '');
    if (!argv[index]?.startsWith('--') || !allowed.has(name) || Object.hasOwn(flags, name) || argv[index + 1] === undefined) throw new Error(`Invalid fixture flag: ${argv[index]}`);
    flags[name] = argv[index + 1];
  }
  if (!flags['output-dir']) throw new Error('--output-dir <new workspace directory> is required');
  return { outputDir: flags['output-dir'], workload: flags.workload || DEFAULT_WORKLOAD,
    basePort: Number(flags['base-port'] || 19441), delayMs: Number(flags['delay-ms'] || 12) };
}

function createMockConfig({ outputDir, workload = DEFAULT_WORKLOAD, basePort = 19441, delayMs = 12 }) {
  const output = path.resolve(outputDir);
  const relative = path.relative(RESULTS, output);
  if (!relative || relative.startsWith('..' + path.sep) || relative === '..' || path.isAbsolute(relative)) throw new Error('Mock output must be a new subdirectory of load_test_v2/results');
  if (!Number.isSafeInteger(basePort) || basePort < 1024 || basePort + ENGINES.length - 1 > 65535
    || !Number.isFinite(delayMs) || delayMs < 1 || delayMs > 30000) throw new Error('Invalid fixture port/delay');
  const configFile = path.join(output, 'config.json');
  if (fs.existsSync(configFile)) throw new Error('A fixture config already exists here; choose a new output directory');
  const cases = loadCases(workload, 20261002);
  if (cases.size !== 300) throw new Error('The mock integration uses the existing 300-question dataset');
  const upstreamRepository = 'Qwen/Qwen3-4B';
  const upstreamRevision = 'mock-upstream-qwen3-4b';
  const now = new Date().toISOString();
  const fixtureDir = path.join(output, 'fixtures');
  fs.mkdirSync(fixtureDir, { recursive: true });
  function write(name, value) {
    const file = path.join(fixtureDir, name);
    const data = typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n';
    fs.writeFileSync(file, data, { flag: 'wx' });
    return { path: file, sha256: sha256(Buffer.from(data)) };
  }
  const tokenizer = write('mock-tokenizer.json', { mock: true, limitation: 'Synthetic fixture; not a tokenizer.' });
  const chatTemplate = write('mock-template.jinja', '{# MOCK FIXTURE ONLY: not a usable model template #}\n{{ messages }}\n');
  const candidates = ENGINES.map((engine, index) => {
    const id = `mock-${engine.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
    const gguf = ['ollama', 'llama.cpp'].includes(engine);
    const model = `mock-qwen3-4b-${index + 1}`;
    const weight = write(`${id}.${gguf ? 'gguf' : 'safetensors'}`, `MOCK FIXTURE ONLY\nengine=${engine}\nNot a model artifact; never load this file into an inference server.\n`);
    const files = [{ ...weight, role: 'weight' }, { ...tokenizer, role: 'tokenizer' }, { ...chatTemplate, role: 'chat_template' }];
    const artifactRepository = `mock-fixture/${id}`;
    const artifactRevision = 'mock-artifact-v1';
    const lineage = write(`${id}-lineage.json`, {
      mock: true, method: 'mock_fixture', reviewed_by: 'automated_mock_fixture', reviewed_at: now,
      source_url: `mock://local-fixture/${id}`, upstream_repository: upstreamRepository,
      upstream_revision: upstreamRevision, artifact_repository: artifactRepository, artifact_revision: artifactRevision,
      files: files.map(({ role, sha256 }) => ({ role, sha256 })),
      limitation: 'Synthetic provenance to test hash/lineage checks, not proof of any real model ancestry.',
    });
    const port = basePort + index;
    const candidate = {
      id, enabled: true, engine, engine_version: 'mock-1.0', api_model: model,
      host: `http://127.0.0.1:${port}`, internal_limit: 4,
      settings: { context_per_request: 4096, mock_fixture: true },
      provenance: {
        upstream_repository: upstreamRepository, upstream_revision: upstreamRevision,
        artifact_repository: artifactRepository, artifact_revision: artifactRevision,
        weight_format: gguf ? 'GGUF' : 'Safetensors', quantization: gguf ? 'mock-Q4_K_M' : 'mock-AWQ',
        files, lineage,
      },
      runtime: {
        mode: 'process', ready_timeout_ms: 5000,
        command: [process.execPath, path.join(__dirname, 'mock_server.js'),
          '--port', String(port), '--engine', engine, '--model', model, '--engine-version', 'mock-1.0',
          '--internal-limit', '4', '--context', '4096', '--upstream-repository', upstreamRepository,
          '--upstream-revision', upstreamRevision, '--delay-ms', String(delayMs)],
        attestation: { kind: 'http', path: '/benchmark/runtime' },
      },
    };
    return candidate;
  });
  const config = {
    schema_version: 2, mock: true,
    comparison: { upstream_repository: upstreamRepository, upstream_revision: upstreamRevision },
    workload: { file: cases.source, sha256: cases.sha256, seed: cases.seed },
    transport: { keep_alive: true, timeout_ms: 2000 },
    generation: { context: 4096, max_tokens: 512, temperature: 0, thinking: false },
    slo: { e2e_p95_ms: 5000, fail_rate: 0.01, provisional: true },
    profiles: {
      smoke: { users: [1, 4, 8], measure_ms: 250, repeats: 1, min_valid_requests: 3, warmup_per_user: 1 },
      screen: { users: [1, 4, 8], measure_ms: 250, repeats: 1, min_valid_requests: 3, warmup_per_user: 1 },
      confirm: { users: [1, 4, 8], measure_ms: 250, repeats: 3, min_valid_requests: 3, warmup_per_user: 1 },
    },
    arrival: { duration_ms: 400, max_in_flight: 256 },
    candidates,
    limitation: 'Mock integration only. Times, token counts, GPU metadata, and lineage are synthetic; no semantic approval is supplied. Do not compare engine performance using these results.',
  };
  validate(config, { mock: true });
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2) + '\n', { flag: 'wx' });
  return { config: configFile, output_dir: output, mock: true, questions: cases.size, candidates: candidates.length };
}

if (require.main === module) {
  try { console.log(JSON.stringify(createMockConfig(parseArgs(process.argv.slice(2))))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = { createMockConfig, parseArgs };
