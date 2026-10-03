'use strict';
const fs = require('node:fs');
const { createHash } = require('node:crypto');
const path = require('node:path');
const { identityHash } = require('./config');
const { validateOutput } = require('./transport');

async function hashFile(file) {
  const hash = createHash('sha256');
  for await (const chunk of fs.createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
async function verifiedFile(file) {
  if (!file || typeof file.path !== 'string' || !file.path.trim() || !/^[a-f0-9]{64}$/i.test(file.sha256 || '')) throw new Error('파일 경로와 SHA-256 지문이 필요합니다');
  const actual = await hashFile(file.path);
  if (actual !== file.sha256.toLowerCase()) throw new Error(`파일 SHA-256 불일치: ${file.path}`);
  return { ...file, actual_sha256: actual, bytes: (await fs.promises.stat(file.path)).size };
}
async function verifyProvenance(candidate, { mock = false } = {}) {
  const p = candidate.provenance, files = [];
  for (const file of p.files) files.push(await verifiedFile(file));
  const lineageFile = await verifiedFile(p.lineage);
  const lineage = JSON.parse(await fs.promises.readFile(p.lineage.path, 'utf8'));
  for (const key of ['upstream_repository', 'upstream_revision', 'artifact_repository', 'artifact_revision']) {
    if (lineage[key] !== p[key]) throw new Error(`계보 자료 ${key} 불일치`);
  }
  if (!['official_release', 'reproducible_conversion', 'mock_fixture'].includes(lineage.method)
    || !lineage.reviewed_by || !lineage.reviewed_at || !lineage.source_url) throw new Error('계보 검토자·일자·출처·변환 방법 누락');
  if (!mock && lineage.method === 'mock_fixture') throw new Error('모의 계보 자료를 실제 모델 검증에 사용할 수 없습니다');
  const expected = p.files.map(f => `${f.role}:${f.sha256.toLowerCase()}`).sort();
  const evidence = (lineage.files || []).map(f => `${f.role}:${f.sha256?.toLowerCase()}`).sort();
  if (JSON.stringify(expected) !== JSON.stringify(evidence)) throw new Error('계보 자료의 가중치·토크나이저·템플릿 지문 목록 불일치');
  if (p.weight_format === 'GGUF' && p.files.filter(f => f.role === 'weight').length !== 1) throw new Error('GGUF 후보에는 단일 가중치 파일을 지정하세요');
  return { identity_sha256: identityHash(candidate), status: 'files_and_reviewed_lineage_verified', files,
    lineage: { ...lineage, file: lineageFile }, limitation: '파일 일치와 검토 자료를 확인함; 양자화 상위 계보의 진실성을 자동 증명하지 않음' };
}
function requireQualityCleanup(report, { mock = false } = {}) {
  const cleanup = report.cleanup;
  if (report.cleanup_verified !== true || cleanup?.status !== 'passed'
    || cleanup.runtime?.process_exit_confirmed !== true || cleanup.runtime?.port_released !== true
    || cleanup.gpu?.status !== 'passed' || cleanup.gpu.scope !== (mock ? 'mock' : 'gpu')) {
    throw new Error('품질 보고서의 서버·worker 종료와 GPU 메모리 정리 확인 증거가 없거나 실패했습니다');
  }
}
async function semanticGate(candidate, workloadHash, { mock = false } = {}) {
  if (!candidate.semantic_gate) return { status: 'pending', reason: '의미적 정답 평가 자료 없음' };
  const gateFile = await verifiedFile(candidate.semantic_gate);
  const gate = JSON.parse(await fs.promises.readFile(gateFile.path, 'utf8'));
  if (gate.workload_sha256 !== workloadHash || gate.candidate_identity_sha256 !== identityHash(candidate)) throw new Error('품질 평가의 문항·배포 구성 불일치');
  if (!['human', 'gold_answers', 'mock_fixture'].includes(gate.method) || !gate.reviewer || !gate.rubric || typeof gate.passed !== 'boolean') throw new Error('의미적 품질 평가 방법·심사자·기준·결과 누락');
  if (!mock && gate.method === 'mock_fixture') throw new Error('모의 품질 평가를 실제 합격 자료로 사용할 수 없습니다');
  if (!candidate.quality_report || !/^[a-f0-9]{64}$/i.test(gate.quality_report_sha256 || '')
    || gate.quality_report_sha256.toLowerCase() !== candidate.quality_report.sha256.toLowerCase()) throw new Error('의미적 평가와 전체 품질 보고서 지문 불일치');
  const qualitySource = await verifiedFile(candidate.quality_report);
  const qualityReport = JSON.parse(await fs.promises.readFile(qualitySource.path, 'utf8'));
  if (qualityReport.mock !== mock || qualityReport.schema_version !== 2 || qualityReport.phase !== 'quality'
    || qualityReport.workload_sha256 !== workloadHash || qualityReport.candidate_identity_sha256 !== identityHash(candidate)) throw new Error('의미적 평가의 원본 품질 보고서 구성·문항·모의 상태 불일치');
  requireQualityCleanup(qualityReport, { mock });
  if (!gate.evaluation?.path || !gate.evaluation.sha256) throw new Error('의미적 품질 평가 원본 지문 필요');
  const evidence = await verifiedFile({ ...gate.evaluation, path: path.resolve(path.dirname(gateFile.path), gate.evaluation.path) });
  return { status: gate.passed ? 'passed' : 'failed', method: gate.method, reviewer: gate.reviewer,
    rubric: gate.rubric, source: gateFile, evaluation: evidence, quality_report: qualitySource };
}

function caseId(record) { return record.case_id ?? record.caseId; }
function exactCaseIds(ids, expected, label) {
  if (!Array.isArray(ids) || ids.length !== 300 || ids.some(id => typeof id !== 'string' || !id)
    || new Set(ids).size !== 300 || JSON.stringify(ids.slice().sort()) !== JSON.stringify(expected)) {
    throw new Error(`${label}: 전체 300문항의 고유 ID 목록 불일치`);
  }
}

async function contractGate(candidate, workloadHash, {
  mock = false, expectedCaseIds, expectedCases, expectedFailRate, expectedGeneration,
} = {}) {
  if (!candidate.quality_report) return { status: 'pending', reason: '전체 300문항 계약 검증 자료 없음' };
  const expected = Array.isArray(expectedCaseIds) ? expectedCaseIds.slice().sort()
    : Array.isArray(expectedCases) ? expectedCases.map(item => item.caseId ?? item.case_id).sort() : null;
  if (!expected || expected.length !== 300 || new Set(expected).size !== 300
    || expected.some(id => typeof id !== 'string' || !id)) throw new Error('품질 검증에는 현재 문항 풀의 고유 ID 300개가 필요합니다');
  const reportFile = await verifiedFile(candidate.quality_report);
  const report = JSON.parse(await fs.promises.readFile(reportFile.path, 'utf8'));
  if (report.schema_version !== 2 || report.phase !== 'quality' || report.mock !== mock) throw new Error('품질 보고서 버전·단계·모의 상태 불일치');
  if (report.workload_sha256 !== workloadHash || report.candidate_identity_sha256 !== identityHash(candidate)) throw new Error('계약 검증 보고서의 문항·배포 구성 불일치');
  requireQualityCleanup(report, { mock });
  if (report.case_count !== 300 || report.n_total !== 300 || !Number.isInteger(report.n_valid)
    || report.n_valid < 0 || report.n_valid > 300 || typeof report.contract_pass !== 'boolean') throw new Error('계약 검증 보고서의 전체 문항 수·유효 건수·판정 오류');
  const criterion = report.criteria?.fail_rate;
  if (!Number.isFinite(criterion) || criterion < 0 || criterion >= 1
    || expectedFailRate !== undefined && criterion !== expectedFailRate) throw new Error('계약 검증 보고서의 실패율 기준 불일치');
  exactCaseIds(report.case_ids, expected, '보고서');
  if (expectedCases !== undefined) {
    if (!Array.isArray(expectedCases)) throw new Error('현재 원본 문항 배열이 필요합니다');
    exactCaseIds(expectedCases.map(item => item.caseId ?? item.case_id), expected, '현재 원본 문항');
  }
  if (!report.answers || typeof report.answers.path !== 'string') throw new Error('계약 검증 원본 응답 파일이 필요합니다');
  const answersFile = await verifiedFile({ ...report.answers, path: path.resolve(path.dirname(reportFile.path), report.answers.path) });
  const raw = (await fs.promises.readFile(answersFile.path, 'utf8')).replace(/^\uFEFF/, '');
  const answers = raw.split(/\r?\n/).filter(line => line.trim()).map((line, index) => {
    try { return JSON.parse(line); } catch { throw new Error(`계약 검증 원본 응답 ${index + 1}행 JSON 오류`); }
  });
  exactCaseIds(answers.map(caseId), expected, '원본 응답');
  const caseMap = expectedCases && new Map(expectedCases.map(item => [item.caseId ?? item.case_id, item]));
  let nValid = 0;
  let inputFitUnknown = 0;
  let inputFitOverflow = 0;
  const generation = expectedGeneration ?? candidate.benchmark_generation;
  if (!generation || !Number.isInteger(generation.max_tokens) || !Number.isInteger(generation.context)) throw new Error('전체 문항 입력 길이 검증에는 공통 context·max_tokens가 필요합니다');
  for (const answer of answers) {
    if (typeof answer.content !== 'string' || typeof answer.transport_ok !== 'boolean'
      || typeof answer.terminal_received !== 'boolean' || typeof answer.truncated !== 'boolean'
      || typeof answer.valid !== 'boolean' || typeof answer.contract_valid !== 'boolean'
      || !Array.isArray(answer.request_body?.messages)) throw new Error(`원본 응답 ${caseId(answer)}의 내용·완료·검증 상태 누락`);
    const item = caseMap?.get(caseId(answer));
    if (item && JSON.stringify(answer.request_body.messages) !== JSON.stringify(item.messages)) throw new Error(`원본 응답 ${caseId(answer)}의 입력 메시지 불일치`);
    const body = answer.request_body;
    const native = candidate.engine === 'ollama';
    const maxTokens = native ? body.options?.num_predict : body.max_tokens;
    if (generation && (body.stream !== true || maxTokens !== generation.max_tokens
      || (native ? body.options?.temperature : body.temperature) !== generation.temperature
      || (native ? body.think : body.chat_template_kwargs?.enable_thinking) !== generation.thinking
      || native && body.options?.num_ctx !== generation.context)) throw new Error(`원본 응답 ${caseId(answer)}의 공통 생성 조건 불일치`);
    const truncated = ['length', 'max_tokens', 'max_token', 'limit', 'max_length'].includes(answer.done_reason)
      || answer.done_reason === null && Number.isInteger(answer.eval_count)
        && Number.isInteger(maxTokens) && answer.eval_count >= maxTokens;
    if (answer.truncated !== truncated) throw new Error(`원본 응답 ${caseId(answer)}의 출력 절단 판정 불일치`);
    const inputKnown = Number.isInteger(answer.prompt_eval_count) && answer.prompt_eval_count >= 0;
    const inputBudgetExceeded = inputKnown ? answer.prompt_eval_count + generation.max_tokens > generation.context : null;
    if (!inputKnown) inputFitUnknown += 1;
    else if (inputBudgetExceeded) inputFitOverflow += 1;
    if (answer.input_budget_exceeded !== undefined && answer.input_budget_exceeded !== inputBudgetExceeded) throw new Error(`원본 응답 ${caseId(answer)}의 입력 예산 초과 판정 불일치`);
    const checked = validateOutput(answer.content, item?.messages ?? answer.request_body.messages, {
      reasoningContent: answer.reasoning_content,
    });
    const contractValid = checked.schema_valid && checked.evidence_valid && !checked.reasoning_leak
      && !truncated && answer.input_truncated !== true && !inputBudgetExceeded;
    const responseValid = answer.transport_ok && answer.terminal_received && contractValid;
    if (answer.contract_valid !== contractValid || answer.valid !== responseValid
      || answer.schema_valid !== checked.schema_valid || answer.evidence_valid !== checked.evidence_valid
      || answer.reasoning_leak !== checked.reasoning_leak) throw new Error(`원본 응답 ${caseId(answer)}의 계약 검증 판정 불일치`);
    if (responseValid) nValid += 1;
  }
  const failRate = (answers.length - nValid) / answers.length;
  const passed = failRate <= criterion;
  if (report.n_valid !== nValid || report.contract_pass !== passed) throw new Error('계약 검증 보고서의 유효 건수·최종 판정 재계산 불일치');
  const inputFitStatus = inputFitUnknown || inputFitOverflow ? 'unknown_or_overflow' : 'checked_all_cases';
  if (report.input_fit_unknown !== inputFitUnknown || report.input_fit_overflow !== inputFitOverflow
    || report.input_fit_status !== inputFitStatus) throw new Error('계약 검증 보고서의 전체 문항 입력 길이 검증 재계산 불일치');
  const status = !passed || inputFitOverflow ? 'failed' : inputFitUnknown ? 'pending' : 'passed';
  return {
    status, source: reportFile, answers: answersFile, structural_status: passed ? 'passed' : 'failed',
    n_total: answers.length, n_valid: nValid, fail_rate: failRate, criteria: { fail_rate: criterion },
    input_fit_status: inputFitStatus, input_fit_unknown: inputFitUnknown, input_fit_overflow: inputFitOverflow,
    validation_scope: 'schema_reference_ids_reasoning_truncation_and_transport_only',
  };
}

module.exports = { hashFile, verifiedFile, verifyProvenance, contractGate, semanticGate };
