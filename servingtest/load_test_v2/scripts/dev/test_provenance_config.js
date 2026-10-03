'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { validate, loadConfig, identityHash } = require('../lib/config');
const { verifyProvenance, contractGate, semanticGate } = require('../lib/provenance');
const { validateOutput } = require('../lib/transport');

const sha = (raw) => createHash('sha256').update(raw).digest('hex');
const fixtureRoot = fs.mkdtempSync(path.join(__dirname, '.test-provenance-'));
function write(name, value, json = true) {
  const file = path.join(fixtureRoot, name);
  fs.writeFileSync(file, json ? JSON.stringify(value) : value);
  return { path: file, sha256: sha(fs.readFileSync(file)) };
}
const clone = (value) => JSON.parse(JSON.stringify(value));

function baseConfig() {
  const fingerprint = { path: 'fixture.bin', sha256: 'a'.repeat(64) };
  return {
    schema_version: 2, mock: false,
    comparison: { upstream_repository: 'Qwen/Qwen3-4B', upstream_revision: '1'.repeat(40) },
    workload: { file: 'prompts.jsonl', sha256: 'b'.repeat(64) },
    transport: { keep_alive: true, timeout_ms: 1000 },
    generation: { context: 4096, max_tokens: 512, temperature: 0, thinking: false },
    slo: { e2e_p95_ms: 5000, fail_rate: 0.01 },
    candidates: [{
      id: 'qwen-vllm', engine: 'vllm', enabled: true, engine_version: '0.30.0',
      api_model: 'qwen3-4b', host: 'http://127.0.0.1:8000', internal_limit: 4,
      settings: { context_per_request: 4096 }, runtime: { mode: 'external' },
      provenance: {
        upstream_repository: 'Qwen/Qwen3-4B', upstream_revision: '1'.repeat(40),
        artifact_repository: 'Qwen/Qwen3-4B-AWQ', artifact_revision: '2'.repeat(40),
        weight_format: 'Safetensors', quantization: 'AWQ',
        files: ['weight', 'tokenizer', 'chat_template'].map(role => ({ ...fingerprint, role })),
        lineage: { path: 'lineage.json', sha256: 'c'.repeat(64) },
      },
    }],
  };
}

async function main() {
  const config = baseConfig();
  assert.equal(validate(config), config);
  const movingArtifact = clone(config);
  movingArtifact.candidates[0].provenance.artifact_revision = 'main';
  assert.throws(() => validate(movingArtifact), /아티팩트 리비전/);
  const abbreviated = clone(config);
  abbreviated.candidates[0].provenance.artifact_revision = '2'.repeat(12);
  assert.throws(() => validate(abbreviated), /아티팩트 리비전/);
  const invalidHashLength = clone(config);
  invalidHashLength.comparison.upstream_revision = '1'.repeat(41);
  assert.throws(() => validate(invalidHashLength), /상위 모델 리비전/);
  const full256 = clone(config);
  full256.candidates[0].provenance.artifact_revision = '2'.repeat(64);
  assert.equal(validate(full256), full256);
  for (const field of ['quality_report', 'semantic_gate']) {
    const malformed = clone(config);
    malformed.candidates[0][field] = { path: 'report.json', sha256: 'bad' };
    assert.throws(() => validate(malformed), /SHA-256/);
  }
  const paths = clone(config);
  paths.candidates[0].quality_report = { path: 'quality.json', sha256: 'd'.repeat(64) };
  paths.candidates[0].semantic_gate = { path: 'semantic.json', sha256: 'e'.repeat(64) };
  const configFile = write('config.json', paths);
  const loaded = loadConfig(configFile.path, { mock: false });
  assert.equal(loaded.candidates[0].quality_report.path, path.join(fixtureRoot, 'quality.json'));
  assert.equal(loaded.candidates[0].semantic_gate.path, path.join(fixtureRoot, 'semantic.json'));
  assert.deepEqual(loaded.candidates[0].benchmark_generation, loaded.generation);
  const beforeGenerationChange = identityHash(loaded.candidates[0]);
  loaded.candidates[0].benchmark_generation.max_tokens = 256;
  assert.notEqual(identityHash(loaded.candidates[0]), beforeGenerationChange,
    'a changed generation contract must invalidate previous quality evidence');

  const candidate = clone(config.candidates[0]);
  candidate.benchmark_generation = clone(config.generation);
  candidate.provenance.files = ['weight', 'tokenizer', 'chat_template'].map(role => ({
    role, ...write(`${role}.bin`, `mock ${role}`, false),
  }));
  const lineage = {
    ...Object.fromEntries(['upstream_repository', 'upstream_revision', 'artifact_repository', 'artifact_revision']
      .map(key => [key, candidate.provenance[key]])),
    method: 'mock_fixture', reviewed_by: 'test reviewer', reviewed_at: '2026-10-02',
    source_url: 'https://example.invalid/test-lineage',
    files: candidate.provenance.files.map(({ role, sha256 }) => ({ role, sha256 })),
  };
  candidate.provenance.lineage = write('lineage.json', lineage);
  assert.equal((await verifyProvenance(candidate, { mock: true })).status, 'files_and_reviewed_lineage_verified');
  await assert.rejects(() => verifyProvenance(candidate, { mock: false }), /모의 계보/);

  const cases = Array.from({ length: 300 }, (_, i) => ({
    caseId: `case-${String(i + 1).padStart(3, '0')}`,
    messages: [{ role: 'user', content: '[참고 자료]\n[FAQ-001] 근거입니다.\n[사용자 질문]\n질문입니다.' }],
  }));
  const workloadHash = 'f'.repeat(64);
  const ids = cases.map(item => item.caseId);
  const content = JSON.stringify({ status: 'ANSWER', answer: '답변입니다 [FAQ-001]', evidence_ids: ['FAQ-001'] });
  const goodAnswers = cases.map(item => ({
    case_id: item.caseId, content, reasoning_content: '',
    transport_ok: true, terminal_received: true, truncated: false, input_truncated: null, input_budget_exceeded: false,
    valid: true, contract_valid: true, done_reason: 'stop', eval_count: 16, prompt_eval_count: 256,
    request_body: { messages: item.messages, stream: true, max_tokens: 512,
      temperature: 0, chat_template_kwargs: { enable_thinking: false } },
    ...validateOutput(content, item.messages),
  }));
  let answersFile;
  let quality;
  function saveAnswers(answers) {
    answersFile = write('answers.jsonl', answers.map(row => JSON.stringify(row)).join('\n') + '\n', false);
  }
  function saveQuality(overrides = {}) {
    quality = {
      schema_version: 2, mock: true, phase: 'quality',
      candidate_identity_sha256: identityHash(candidate), workload_sha256: workloadHash,
      case_count: 300, case_ids: ids.slice().reverse(), contract_pass: true,
      answers: { path: 'answers.jsonl', sha256: answersFile.sha256 },
      n_valid: 300, n_total: 300, criteria: { fail_rate: 0.01 },
      input_fit_status: 'checked_all_cases', input_fit_unknown: 0, input_fit_overflow: 0,
      cleanup_verified: true,
      cleanup: { status: 'passed', runtime: { process_exit_confirmed: true, port_released: true },
        gpu: { status: 'passed', scope: 'mock' } },
      ...overrides,
    };
    candidate.quality_report = write('quality.json', quality);
  }
  const options = { mock: true, expectedCaseIds: ids, expectedCases: cases, expectedFailRate: 0.01 };
  assert.equal((await contractGate(candidate, workloadHash, options)).status, 'pending');
  saveAnswers(goodAnswers);
  saveQuality();
  assert.equal((await contractGate(candidate, workloadHash, options)).status, 'passed');
  const cleanEvidence = clone(quality.cleanup);
  for (const badCleanup of [
    { cleanup_verified: undefined }, { cleanup_verified: false }, { cleanup: undefined },
    { cleanup: { ...cleanEvidence, status: 'failed' } },
    { cleanup: { ...cleanEvidence, runtime: { process_exit_confirmed: false, port_released: true } } },
    { cleanup: { ...cleanEvidence, runtime: { process_exit_confirmed: true, port_released: false } } },
    { cleanup: { ...cleanEvidence, gpu: { status: 'failed', scope: 'mock' } } },
    { cleanup: { ...cleanEvidence, gpu: { status: 'passed', scope: 'gpu' } } },
  ]) {
    saveQuality(badCleanup);
    await assert.rejects(() => contractGate(candidate, workloadHash, options), /메모리 정리 확인 증거/);
  }
  saveQuality({ mock: false });
  await assert.rejects(() => contractGate(candidate, workloadHash, { ...options, mock: false }), /메모리 정리 확인 증거/,
    'mock GPU cleanup cannot certify live quality evidence');
  saveQuality({ mock: false, cleanup: { ...cleanEvidence, gpu: { status: 'passed', scope: 'gpu' } } });
  assert.equal((await contractGate(candidate, workloadHash, { ...options, mock: false })).status, 'passed');
  saveQuality();
  await assert.rejects(() => contractGate(candidate, workloadHash, { ...options, expectedCases: cases.slice(0, 299) }), /현재 원본 문항/);
  await assert.rejects(() => contractGate(candidate, workloadHash, { ...options, mock: false }), /모의 상태/);
  await assert.rejects(() => contractGate(candidate, '0'.repeat(64), options), /문항·배포 구성/);
  fs.appendFileSync(candidate.quality_report.path, ' ');
  await assert.rejects(() => contractGate(candidate, workloadHash, options), /SHA-256 불일치/);
  saveQuality({ case_count: 299 });
  await assert.rejects(() => contractGate(candidate, workloadHash, options), /전체 문항 수/);
  saveQuality({ case_ids: [...ids.slice(0, 299), ids[0]] });
  await assert.rejects(() => contractGate(candidate, workloadHash, options), /고유 ID/);
  saveQuality({ n_valid: 299 });
  await assert.rejects(() => contractGate(candidate, workloadHash, options), /최종 판정 재계산/);
  saveQuality({ criteria: { fail_rate: 0.5 } });
  await assert.rejects(() => contractGate(candidate, workloadHash, options), /실패율 기준/);
  saveQuality();
  fs.appendFileSync(answersFile.path, ' ');
  await assert.rejects(() => contractGate(candidate, workloadHash, options), /SHA-256 불일치/);
  saveAnswers(goodAnswers.slice(0, 299));
  saveQuality();
  await assert.rejects(() => contractGate(candidate, workloadHash, options), /고유 ID/);
  const duplicate = clone(goodAnswers);
  duplicate[299].case_id = duplicate[0].case_id;
  saveAnswers(duplicate);
  saveQuality();
  await assert.rejects(() => contractGate(candidate, workloadHash, options), /고유 ID/);
  const forgedValidity = clone(goodAnswers);
  forgedValidity[0].content = 'broken JSON';
  saveAnswers(forgedValidity);
  saveQuality();
  await assert.rejects(() => contractGate(candidate, workloadHash, options), /계약 검증 판정 불일치/);
  const wrongPrompt = clone(goodAnswers);
  wrongPrompt[0].request_body.messages = [{ role: 'user', content: 'different input' }];
  saveAnswers(wrongPrompt);
  saveQuality();
  await assert.rejects(() => contractGate(candidate, workloadHash, options), /입력 메시지 불일치/);
  const wrongGeneration = clone(goodAnswers);
  wrongGeneration[0].request_body.max_tokens = 32;
  saveAnswers(wrongGeneration);
  saveQuality();
  await assert.rejects(() => contractGate(candidate, workloadHash, options), /공통 생성 조건 불일치/);
  const hiddenTruncation = clone(goodAnswers);
  hiddenTruncation[0].done_reason = 'length';
  saveAnswers(hiddenTruncation);
  saveQuality();
  await assert.rejects(() => contractGate(candidate, workloadHash, options), /출력 절단 판정 불일치/);
  const unknownInput = clone(goodAnswers);
  unknownInput[0].prompt_eval_count = null;
  unknownInput[0].input_budget_exceeded = null;
  saveAnswers(unknownInput);
  saveQuality();
  quality.input_fit_status = 'unknown_or_overflow';
  quality.input_fit_unknown = 1;
  candidate.quality_report = write('quality.json', quality);
  const unknownFitGate = await contractGate(candidate, workloadHash, options);
  assert.equal(unknownFitGate.status, 'pending');
  assert.equal(unknownFitGate.structural_status, 'passed');
  const oversizedInput = clone(goodAnswers);
  oversizedInput[0].prompt_eval_count = candidate.benchmark_generation.context;
  oversizedInput[0].input_budget_exceeded = true;
  oversizedInput[0].valid = false;
  oversizedInput[0].contract_valid = false;
  saveAnswers(oversizedInput);
  saveQuality({ n_valid: 299 });
  quality.input_fit_status = 'unknown_or_overflow';
  quality.input_fit_overflow = 1;
  candidate.quality_report = write('quality.json', quality);
  assert.equal((await contractGate(candidate, workloadHash, options)).status, 'failed');
  saveQuality({ n_valid: 299 });
  await assert.rejects(() => contractGate(candidate, workloadHash, options), /입력 길이 검증/);

  const failures = clone(goodAnswers);
  for (let i = 0; i < 4; i += 1) {
    failures[i].content = 'broken JSON';
    Object.assign(failures[i], validateOutput('broken JSON', cases[i].messages), { valid: false, contract_valid: false });
  }
  saveAnswers(failures);
  saveQuality({ n_valid: 296, contract_pass: false });
  assert.equal((await contractGate(candidate, workloadHash, options)).status, 'failed');
  saveQuality({ n_valid: 296, contract_pass: true });
  await assert.rejects(() => contractGate(candidate, workloadHash, options), /최종 판정 재계산/);

  saveAnswers(goodAnswers);
  saveQuality();
  const evaluationFile = write('evaluation.json', { case_count: 300, evaluation: 'mock grading fixture' });
  const gate = {
    candidate_identity_sha256: identityHash(candidate), workload_sha256: workloadHash,
    method: 'mock_fixture', reviewer: 'test reviewer', rubric: 'fixture only', passed: true,
    quality_report_sha256: candidate.quality_report.sha256,
    evaluation: { path: 'evaluation.json', sha256: evaluationFile.sha256 },
  };
  candidate.semantic_gate = write('semantic.json', gate);
  assert.equal((await semanticGate(candidate, workloadHash, { mock: true })).status, 'passed');
  saveQuality({ cleanup_verified: false });
  candidate.semantic_gate = write('semantic.json', { ...gate, quality_report_sha256: candidate.quality_report.sha256 });
  await assert.rejects(() => semanticGate(candidate, workloadHash, { mock: true }), /메모리 정리 확인 증거/,
    'semantic approval cannot bypass failed engine cleanup even with matching quality fingerprints');
  saveQuality();
  candidate.semantic_gate = write('semantic.json', gate);
  await assert.rejects(() => semanticGate(candidate, workloadHash, { mock: false }), /모의 품질/);
  candidate.semantic_gate = write('semantic.json', { ...gate, quality_report_sha256: '0'.repeat(64) });
  await assert.rejects(() => semanticGate(candidate, workloadHash, { mock: true }), /보고서 지문 불일치/);
  candidate.semantic_gate = write('semantic.json', gate);
  fs.appendFileSync(evaluationFile.path, ' ');
  await assert.rejects(() => semanticGate(candidate, workloadHash, { mock: true }), /SHA-256 불일치/);
  console.log('provenance/config tests: passed (immutable revisions, fingerprints, complete quality evidence, semantic linkage)');
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  const resolved = path.resolve(fixtureRoot);
  assert.equal(path.dirname(resolved), path.resolve(__dirname));
  assert(path.basename(resolved).startsWith('.test-provenance-'));
  fs.rmSync(resolved, { recursive: true, force: true });
});
