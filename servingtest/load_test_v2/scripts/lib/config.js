'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const ENGINES = ['ollama', 'llama.cpp', 'vllm', 'sglang'];
const DEFAULT_PROFILES = {
  smoke: { users: [1, 4], measure_ms: 500, repeats: 1, min_valid_requests: 1, warmup_per_user: 1 },
  screen: { users: [1, 4, 8, 12, 16], measure_ms: 60000, repeats: 1, min_valid_requests: 20, warmup_per_user: 1 },
  confirm: { users: [1, 2, 4, 8, 12, 16, 24, 32], measure_ms: 180000, repeats: 3, min_valid_requests: 100, warmup_per_user: 1 },
};
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]));
  return value;
}
const hashObject = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
const integer = (v, min, max) => Number.isSafeInteger(v) && v >= min && v <= max;
function required(value, label) {
  if (typeof value !== 'string' || !value.trim() || /REPLACE|TODO/i.test(value)) throw new Error(`${label}를 실제 값으로 지정하세요`);
}
function resolveFile(base, file) { return typeof file === 'string' ? path.resolve(base, file) : file; }
function fingerprint(file, label) {
  if (!file || typeof file.path !== 'string' || !file.path.trim()
      || !/^[a-f0-9]{64}$/i.test(file.sha256 || '')) throw new Error(`${label}: 파일 경로와 SHA-256 지문이 필요합니다`);
}
function validate(config, { mock = false } = {}) {
  if (!config || config.schema_version !== 2) throw new Error('schema_version: 2가 필요합니다');
  if (!!config.mock !== mock) throw new Error('모의 구성에는 --mock이 필요하며 실제 구성에 --mock을 쓸 수 없습니다');
  required(config.comparison?.upstream_repository, 'comparison.upstream_repository');
  required(config.comparison?.upstream_revision, 'comparison.upstream_revision');
  if (!mock && !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(config.comparison.upstream_revision)) throw new Error('상위 모델 리비전은 고정된 전체 commit/hash여야 합니다');
  if (typeof config.workload?.file !== 'string' || !config.workload.file.trim()
    || !/^[a-f0-9]{64}$/i.test(config.workload.sha256 || '')) throw new Error('workload.file과 sha256이 필요합니다');
  if (typeof config.transport?.keep_alive !== 'boolean' || !integer(config.transport.timeout_ms, 1, 3600000)) throw new Error('공통 keep_alive·timeout_ms 오류');
  if (!integer(config.generation?.context, 1, 131072) || !integer(config.generation.max_tokens, 1, config.generation.context)
    || config.generation.temperature !== 0 || config.generation.thinking !== false) throw new Error('공통 생성 조건은 context·max_tokens, temperature=0, thinking=false입니다');
  if (!(config.slo?.e2e_p95_ms > 0) || !(config.slo.fail_rate >= 0 && config.slo.fail_rate < 1)) throw new Error('잠정 SLO 오류');
  if (!Array.isArray(config.candidates) || !config.candidates.length) throw new Error('candidates 배열이 필요합니다');
  const seen = new Set();
  for (const c of config.candidates) {
    if (!/^[a-zA-Z0-9_-]+$/.test(c.id || '') || seen.has(c.id) || !ENGINES.includes(c.engine) || typeof c.enabled !== 'boolean') throw new Error('후보 ID·엔진·enabled 오류');
    seen.add(c.id);
    for (const forbidden of ['transport', 'generation', 'http_keep_alive', 'timeout_ms']) if (forbidden in c) throw new Error(`${c.id}: 전송·생성 조건은 공통 설정으로만 지정합니다`);
    if (!c.enabled) continue;
    required(c.engine_version, `${c.id}.engine_version`); required(c.api_model, `${c.id}.api_model`);
    const url = new URL(c.host);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search) throw new Error(`${c.id}: host는 인증정보 없는 HTTP 원점입니다`);
    if (!integer(c.internal_limit, 1, 256) || c.settings?.context_per_request !== config.generation.context) throw new Error(`${c.id}: P와 공통 context 설정을 명시하세요`);
    const p = c.provenance;
    if (!p || p.upstream_repository !== config.comparison.upstream_repository || p.upstream_revision !== config.comparison.upstream_revision) throw new Error(`${c.id}: 상위 체크포인트 불일치`);
    for (const key of ['artifact_repository', 'artifact_revision', 'weight_format', 'quantization']) required(p[key], `${c.id}.${key}`);
    if (!mock && !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(p.artifact_revision)) throw new Error(`${c.id}: 배포 아티팩트 리비전은 고정된 전체 commit/hash여야 합니다`);
    if (!['GGUF', 'Safetensors'].includes(p.weight_format)) throw new Error(`${c.id}: 지원 가중치 형식 오류`);
    if (!Array.isArray(p.files) || !p.files.length || p.files.some(x => !x || !['weight', 'tokenizer', 'chat_template', 'config'].includes(x.role))) throw new Error(`${c.id}: 파일 지문·역할이 필요합니다`);
    for (const file of p.files) fingerprint(file, `${c.id}.${file.role}`);
    for (const role of ['weight', 'tokenizer', 'chat_template']) if (!p.files.some(x => x.role === role)) throw new Error(`${c.id}: ${role} 지문 누락`);
    fingerprint(p.lineage, `${c.id}.lineage`);
    for (const field of ['quality_report', 'semantic_gate']) if (c[field] !== undefined) fingerprint(c[field], `${c.id}.${field}`);
    if (!['external', 'process', 'docker'].includes(c.runtime?.mode)) throw new Error(`${c.id}: runtime.mode 오류`);
    if (c.runtime.mode === 'process' && (!Array.isArray(c.runtime.command) || !c.runtime.command.length || c.runtime.command.some(x => typeof x !== 'string'))) throw new Error(`${c.id}: 구조화된 process command가 필요합니다`);
    if (c.runtime.mode === 'docker' && (!c.runtime.image || !Array.isArray(c.runtime.args))) throw new Error(`${c.id}: Docker image·args가 필요합니다`);
    for (const k of Object.keys(c.runtime.env || {})) if (/TOKEN|SECRET|PASSWORD|CREDENTIAL|API_KEY/i.test(k)) throw new Error(`${c.id}: 기록할 runtime.env에 자격 증명을 넣지 마세요`);
  }
  for (const [name, profile] of Object.entries({ ...DEFAULT_PROFILES, ...config.profiles })) {
    if (!Array.isArray(profile.users) || !profile.users.length || profile.users.some((u, i) => !integer(u, 1, 256) || (i && u <= profile.users[i - 1]))
      || !integer(profile.measure_ms, 1, 3600000) || !integer(profile.repeats, 1, 20) || !integer(profile.min_valid_requests, 1, 1000000)
      || !integer(profile.warmup_per_user, 0, 100)) throw new Error(`${name}: 측정 프로파일 오류`);
    if (!mock && name === 'confirm' && (profile.measure_ms < 180000 || profile.repeats < 3 || profile.min_valid_requests < 100)) throw new Error('정식 확인은 180초·3회·100 유효 응답 이상입니다');
  }
  return config;
}
function loadConfig(file, options) {
  const base = path.dirname(path.resolve(file)), c = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  validate(c, options);
  c.workload.file = resolveFile(base, c.workload.file);
  for (const candidate of c.candidates) if (candidate.enabled) {
    // A quality report belongs to one complete generation contract. Changes to
    // output length, thinking, context or decoding constraints invalidate it.
    candidate.benchmark_generation = { ...c.generation };
    candidate.provenance.files = candidate.provenance.files.map(f => ({ ...f, path: resolveFile(base, f.path) }));
    candidate.provenance.lineage.path = resolveFile(base, candidate.provenance.lineage.path);
    if (candidate.quality_report) candidate.quality_report.path = resolveFile(base, candidate.quality_report.path);
    if (candidate.semantic_gate) candidate.semantic_gate.path = resolveFile(base, candidate.semantic_gate.path);
  }
  c.profiles = { ...DEFAULT_PROFILES, ...c.profiles };
  return c;
}
function identityHash(candidate) {
  const { id, engine, engine_version, api_model, internal_limit, settings, provenance, runtime, benchmark_generation } = candidate;
  const files = provenance.files.map(({ role, sha256 }) => ({ role, sha256 })).sort((a, b) => `${a.role}${a.sha256}`.localeCompare(`${b.role}${b.sha256}`));
  return hashObject({ id, engine, engine_version, api_model, internal_limit, settings, runtime, benchmark_generation,
    provenance: { ...provenance, files, lineage: { sha256: provenance.lineage.sha256 } } });
}
module.exports = { ENGINES, DEFAULT_PROFILES, validate, loadConfig, hashObject, identityHash };
