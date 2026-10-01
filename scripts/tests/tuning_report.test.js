'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const profile = require('../lib/profile');
const { tuningCodeOverview: tuningOverview } = require('../lib/tuning_report');
const { classifyTuning, tuningRule } = require('../lib/tuning_codes');
const config = require('../../model_test_v4/test.config');
const prevArgv = process.argv;
process.argv = ['node', 'judge_report.js', '--batch', 'fixture'];
const { analyzeRow, accuracyStats, commonErrorCandidates, main } = require('../docgen/judge_report');
process.argv = prevArgv;

function judgment(id, overrides = {}) {
  return {
    id, item: 'SF', difficulty: 'Easy', expected_status: 'ANSWER', response_status: 'ANSWER',
    accuracy: { verdict: 'CORRECT', missing_required_facts: [], contradicted_facts: [] },
    hallucination: { is_grounded: true, grounding_score: 5, silent_conflict_pick: false },
    behavior: { content_stance: 'ANSWER', content_sources: ['FAQ-1'], asks_user: false },
    evidence: { applicable: true, gold_ids: ['FAQ-1'], cited_ids: ['FAQ-1'] }, expression_quality: 5,
    ...overrides,
  };
}
const analyze = (r) => analyzeRow(r, config.tuning);

test('status가 기대와 같아도 본문 기준 과대·과소를 독립적으로 검출한다', () => {
  const over = analyze(judgment('SR-label-match', { expected_status: 'ABSTAIN', response_status: 'ABSTAIN',
    evidence: { applicable: false, cited_ids: [] },
    accuracy: { verdict: 'INCORRECT', missing_required_facts: [], contradicted_facts: [] } }));
  assert.equal(over.label_direction, 'MATCH');
  assert.equal(over.flags.direction, 'OVER');
  assert.equal(over.tuning_code, 'A4');
  const under = analyze(judgment('SF-label-match', {
    behavior: { content_stance: 'ABSTAIN', content_sources: [], asks_user: false },
    accuracy: { verdict: 'INCORRECT', missing_required_facts: ['필수 답변'], contradicted_facts: [] } }));
  assert.equal(under.label_direction, 'MATCH');
  assert.equal(under.flags.direction, 'UNDER');
  assert.equal(under.tuning_code, 'B3');
});

test('첫 경로에 가려진 환각·누락도 묶고 문항·수단별 중복은 한 번만 센다', () => {
  const r = judgment('SR-1', { item: 'SR', expected_status: 'ABSTAIN',
    accuracy: { verdict: 'INCORRECT', missing_required_facts: ['미확인 고지'], contradicted_facts: [] },
    hallucination: { is_grounded: false, grounding_score: 3 }, evidence: { applicable: false, cited_ids: [] } });
  const row = analyze(r);
  assert.equal(row.path, 'P1');
  const o = tuningOverview([row], config.tuning);
  assert.equal(o.n_with_issue, 1);
  assert.equal(o.groups[0].key, 'A');
  assert.equal(o.codes[0].code, 'A4');
  assert.equal(o.codes[0].hallucinated, 1);
  assert.equal(o.codes[0].missing, 1);
  assert.equal(o.methods.find((m) => m.key === 'PROMPT').count, 1);
  assert.equal(o.methods.find((m) => m.key === 'MODEL').count, 1);
});

test('P0 본문 오답을 라벨 개선으로 분류하지 않고 검토 대상으로 보존한다', () => {
  const row = analyze(judgment('SF-1', { response_status: 'ABSTAIN',
    accuracy: { verdict: 'INCORRECT', missing_required_facts: [], contradicted_facts: [] } }));
  assert.equal(row.path, 'P0');
  assert.equal(row.label_only_error, false);
  assert.equal(row.lever, 'REVIEW');
  const o = tuningOverview([row], config.tuning);
  assert.ok(o.groups.some((g) => g.key === 'F'));
  assert.equal(row.tuning_code, 'F1');
  assert.equal(o.n_with_issue, 1);
});

test('정답+환각도 정답 건수와 함께 심각 그룹에 표시한다', () => {
  const row = analyze(judgment('SF-1', { hallucination: { is_grounded: false, grounding_score: 3 } }));
  const o = tuningOverview([row], config.tuning);
  assert.equal(o.groups[0].key, 'D');
  assert.equal(o.codes[0].code, 'D4');
  assert.equal(o.groups[0].correct, 1);
  assert.equal(o.groups[0].incorrect, 0);
});

test('안전성만 채점된 문항도 최우선에 포함하며 오답을 추정하지 않는다', () => {
  const o = tuningOverview([analyze(judgment('SF-1'))], config.tuning,
    [{ id: 'AD-1', item: 'AD', verdict: 'UNSAFE' }]);
  assert.equal(o.groups[0].key, 'S');
  assert.equal(o.groups[0].accuracy_unscored, 1);
  assert.equal(o.groups[0].incorrect, 0);
});

test('과소 판단에 환각이 동반되면 코드 B1을 유지하면서 심각도를 높인다', () => {
  const row = analyze(judgment('PI-1', { item: 'PI',
    accuracy: { verdict: 'INCORRECT', missing_required_facts: [], contradicted_facts: [] },
    behavior: { content_stance: 'PARTIAL', content_sources: ['FAQ-1'], asks_user: false },
    hallucination: { is_grounded: false, grounding_score: 3 } }));
  const code = tuningOverview([row], config.tuning).codes[0];
  assert.equal(code.code, 'B1');
  assert.equal(code.severity, 3);
  assert.equal(code.hallucinated, 1);
});

test('평가 자료 부족은 모델 오답·공통 오답 후보로 간주하지 않는다', () => {
  const row = analyze(judgment('SF-1', { accuracy: { verdict: 'INSUFFICIENT_EVIDENCE', missing_required_facts: [], contradicted_facts: [] } }));
  const o = tuningOverview([row], config.tuning);
  assert.deepEqual(o.groups.map((g) => g.key), ['F']);
  assert.equal(o.groups[0].undetermined, 1);
  assert.equal(o.groups[0].incorrect, 0);
  assert.equal(commonErrorCandidates([{ model: 'a', rows: [row] }, { model: 'b', rows: [row] }]).candidates.length, 0);
  assert.equal(accuracyStats([{ id: row.id }], [judgment(row.id, {
    accuracy: { verdict: 'INSUFFICIENT_EVIDENCE' } })], [row]).p0_but_incorrect, 0);
});

test('과대·과소 × 근거 정오를 구분하며 근거 미사용과 대상 외를 섞지 않는다', () => {
  const row = analyze(judgment('case'));
  const variant = (direction, sourceOk, applicable) => ({ ...row,
    evidence_applicable: applicable, flags: { ...row.flags, direction, source_ok: sourceOk } });
  assert.equal(classifyTuning(variant('OVER', true, true)), 'A1');
  assert.equal(classifyTuning(variant('OVER', false, true)), 'A2');
  assert.equal(classifyTuning(variant('UNDER', true, true)), 'B1');
  assert.equal(classifyTuning(variant('UNDER', false, true)), 'B2');
  assert.equal(classifyTuning(variant('UNDER', null, true)), 'B3');
  assert.equal(classifyTuning(variant('UNDER', null, false)), 'B4');
  assert.equal(classifyTuning(variant('CROSS', false, true)), 'C2');
  assert.equal(classifyTuning(variant('MATCH', false, true)), 'D1');
});

test('같은 판단 경계 코드도 근거 정오·항목별로 대응 방법과 난이도가 달라진다', () => {
  assert.deepEqual(tuningRule('A1', 'PI', config.tuning).methods, ['PROMPT']);
  assert.deepEqual(tuningRule('A2', 'PI', config.tuning).methods, ['PROMPT', 'MODEL']);
  assert.equal(tuningRule('A2', 'PI', config.tuning).difficulty, 'HIGH');
  assert.deepEqual(tuningRule('A4', 'EC', config.tuning).methods, ['CODE']);
  assert.equal(tuningRule('A4', 'EC', config.tuning).difficulty, 'LOW');
  assert.deepEqual(tuningRule('A4', 'SR', config.tuning).methods, ['PROMPT', 'MODEL']);
  assert.equal(tuningRule('A4', 'SR', config.tuning).difficulty, 'HIGH');
});

test('생성 실패·Judge 누락을 정답률과 별개로 드러낸다', () => {
  const r = judgment('SF-1');
  const stats = accuracyStats([{ id: 'SF-1' }, { id: 'SF-2', unscored_reason: 'TIMEOUT' }, { id: 'SF-3' }], [r], [analyze(r)]);
  assert.equal(stats.correct_rate, 1);
  assert.equal(stats.confirmed_correct_rate_all_requests, 1 / 3);
  assert.equal(stats.scoring_coverage, 1 / 3);
  assert.equal(stats.n_pending_or_failed, 1);
  assert.deepEqual(stats.unscorable_reasons, { TIMEOUT: 1 });
});

test('로컬 합성 배치 보고서 생성: 새 묶음·RT 제외·안전성·완료율·접기', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'llm-tuning-report-'));
  const input = path.join(root, 'inputs');
  const scored = path.join(root, 'scored');
  const output = path.join(root, 'output');
  const write = (p, obj) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(obj)); };
  const jsonl = (p, rows) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, rows.map((r) => JSON.stringify(r)).join('\n')); };
  const rows = [judgment('SF-1', { expected_status: 'PARTIAL', response_status: 'PARTIAL',
    accuracy: { verdict: 'INCORRECT', missing_required_facts: [], contradicted_facts: [] } }),
    judgment('AD-1', { item: 'AD' }), judgment('RT-1', { item: 'RT', hallucination: { is_grounded: false, grounding_score: 3 } })];
  write(path.join(input, 'manifest.json'), { rubric_version: 'fixture-only', judge: { model: 'fixture', reasoning_effort: null },
    runs: [{ run_id: 'run1', model: 'fixture-model' }], kinds: { accuracy: {}, safety: {} } });
  jsonl(path.join(input, 'accuracy_jobs.jsonl'), [...rows.map((r) => ({ ...r, run_id: 'run1' })),
    { id: 'SF-timeout', run_id: 'run1', item: 'SF', unscored_reason: 'TIMEOUT' }, { id: 'SF-pending', run_id: 'run1', item: 'SF' }]);
  jsonl(path.join(input, 'safety_jobs.jsonl'), [{ id: 'AD-1', item: 'AD', run_id: 'run1' }]);
  jsonl(path.join(scored, 'accuracy.jsonl'), rows);
  jsonl(path.join(scored, 'safety.jsonl'), [{ id: 'AD-1', item: 'AD', verdict: 'UNSAFE', resisted_injection: false }]);
  jsonl(path.join(scored, 'evidence.jsonl'), rows.map((r) => ({ id: r.id, ...r.evidence })));
  const originalLoad = profile.load;
  profile.load = () => ({ config, label: 'fixture-only', repoRel: (p) => path.relative(root, p), paths: {
    judgeInputsDir: () => input, scoredDir: () => scored, judgeResultPath: (_run, _batch, kind) => path.join(scored, `${kind}.jsonl`), llmJudgeDir: output,
  } });
  try {
    main();
    const md = fs.readFileSync(path.join(output, 'fixture_report.md'), 'utf8');
    const m = JSON.parse(fs.readFileSync(path.join(output, 'fixture_metrics.json'), 'utf8'));
    assert.match(md, /최우선 · 안전성 확인/);
    assert.match(md, /A1 — 과대 판단/);
    assert.match(md, /가장 많은 튜닝 코드/);
    assert.match(md, /같은 튜닝 방법으로 묶어 보기/);
    assert.match(md, /튜닝 방법별 문항 수/);
    assert.match(md, /본문 기준 과대\/과소\/교차/);
    assert.match(md, /방향 불일치 대표 문항: SF-1/);
    assert.match(md, /Judge 미완료·오류 1/);
    assert.match(md, /TIMEOUT 1/);
    assert.equal(m.runs[0].accuracy.independent.n_expected, 4);
    assert.equal(m.runs[0].accuracy.by_item.SF.tuning_codes.A1, 1);
    const bodyVsLabel = m.runs[0].accuracy.independent.consistency.status_body;
    assert.equal(bodyVsLabel.label_direction.MATCH, 2);
    assert.equal(bodyVsLabel.body_direction.OVER, 1);
    assert.equal(bodyVsLabel.direction_mismatch_count, 1);
    assert.equal(bodyVsLabel.matrix_label_x_body.MATCH.OVER, 1);
    assert.equal(m.runs[0].tuning_overview.groups[0].key, 'S');
    assert.ok(!m.runs[0].tuning_overview.codes.some((g) => g.code === 'D4'));
    assert.equal((md.match(/<details>/g) || []).length, (md.match(/<\/details>/g) || []).length);
  } finally {
    profile.load = originalLoad;
    assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep));
    fs.rmSync(root, { recursive: true });
  }
});
