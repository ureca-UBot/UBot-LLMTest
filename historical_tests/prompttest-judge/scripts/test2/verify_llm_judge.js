'use strict';
// Local validation only: no model, network or generation calls.
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { verifyInputs, parseAnswer } = require('./lib/llm_judge_runner');
const { accuracy, safety, validate } = require('./lib/llm_judge_schema');
const manifest = verifyInputs();
assert.equal(manifest.planned_total_jobs, 1575);
assert.equal(manifest.runs.length, 5);
const valid = {
    accuracy: { verdict: 'CORRECT', missing_required_facts: [], contradicted_facts: [], status_appropriate: true, status_content_consistent: true },
    hallucination: { grounding_score: 5, is_grounded: true, hallucinated_claims: [], minor_issues: [], silent_conflict_pick: false, evidence_ids_valid: true, evidence_ids_issue: null },
    expression_quality: 5, reasoning: '검증용 합성 결과. 실제 채점 결과가 아닙니다.',
};
validate(valid, accuracy);
assert.deepEqual(parseAnswer('```json\n' + JSON.stringify(valid) + '\n```', 'accuracy'), valid);
assert.throws(() => parseAnswer('{"accuracy":null}', 'accuracy'));
assert.throws(() => parseAnswer(JSON.stringify({ ...valid, expression_quality: 6 }), 'accuracy'));
assert.throws(() => parseAnswer(JSON.stringify({ ...valid, hallucination: { ...valid.hallucination, is_grounded: false } }), 'accuracy'));
const minor = { claim: '검증용 경미한 표현', reason: '고객의 판단이나 행동에는 영향이 없는 합성 예시' };
const major = { claim: '검증용 잘못된 금액', reason: '고객의 판단에 영향을 주는 합성 예시' };
assert.doesNotThrow(() => parseAnswer(JSON.stringify({ ...valid, hallucination: { ...valid.hallucination, grounding_score: 4, minor_issues: [minor] } }), 'accuracy'));
assert.doesNotThrow(() => parseAnswer(JSON.stringify({ ...valid, hallucination: { ...valid.hallucination, grounding_score: 3, is_grounded: false, hallucinated_claims: [major] } }), 'accuracy'));
assert.throws(() => parseAnswer(JSON.stringify({ ...valid, hallucination: { ...valid.hallucination, grounding_score: 4 } }), 'accuracy'));
assert.throws(() => parseAnswer(JSON.stringify({ ...valid, hallucination: { ...valid.hallucination, grounding_score: 4, is_grounded: false, hallucinated_claims: [major], minor_issues: [minor] } }), 'accuracy'));
assert.throws(() => parseAnswer(JSON.stringify({ ...valid, hallucination: { ...valid.hallucination, grounding_score: 3 } }), 'accuracy'));
assert.throws(() => parseAnswer(JSON.stringify({ ...valid, hallucination: { ...valid.hallucination, minor_issues: [minor] } }), 'accuracy'));
validate({ verdict: 'NOT_APPLICABLE', resisted_injection: null, leaked_internal_info: false, fabricated_compliance: false,
    leaked_others_pii: false, answered_legitimate_part: null, reasoning: '검증용 합성 결과.' }, safety);
const runner = fs.readFileSync(path.join(__dirname, 'lib/llm_judge_runner.js'), 'utf8');
assert.doesNotMatch(runner, /require\(['"]\.\/ollama['"]\)/);
assert.doesNotMatch(runner, /run\(['"]run_generation|run\(['"]run_pipeline|\/api\/chat/);
console.log(JSON.stringify({ local_validation: 'passed', expected_judgments: manifest.planned_total_jobs,
    source_hashes: '5/5 matched', generation_executed: false, llm_calls: 0, note: 'Only validation fixtures; no scores were created.' }));
