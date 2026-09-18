'use strict';
// Publishable V2 tables and CSVs from saved files only; no inference or network.
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { parseCsvObjects, toCsv } = require('./lib/csv');
const { isPrimaryRound } = require('./lib/rounds');
const { verifyInputs, parseAnswer } = require('./lib/llm_judge_runner');
const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'results/test2/V2');
const batch = 'rerun-20260918-1328';
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const json = file => JSON.parse(read(file));
const rows = file => read(file).trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const saveJson = (file, value) => fs.writeFileSync(path.join(out, file), JSON.stringify(value, null, 2) + '\n');
const pct = value => value == null ? 'N/A' : (100 * value).toFixed(1) + '%';
const num = value => value == null ? 'N/A' : value.toFixed(2);
const cell = value => String(value ?? '').replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
const slug = value => value.replace(/[:.]/g, '-');
const key = row => row.run_id + '/' + row.kind + '/' + row.id;
const byId = records => new Map(records.map(r => [r.id, r]));
function csv(file, values) {
    assert.ok(values.length > 0, file + ' is empty');
    const headers = Object.keys(values[0]);
    const text = '\ufeff' + toCsv(values, headers) + '\r\n';
    const parsed = parseCsvObjects(text);
    assert.equal(parsed.length, values.length);
    for (let i = 0; i < values.length; i++) for (const header of headers) {
        assert.equal(parsed[i][header], String(values[i][header] ?? ''), 'CSV round-trip: ' + file + '/' + i + '/' + header);
    }
    fs.writeFileSync(file, text);
}
function fence(value) {
    const text = String(value);
    const marks = '`'.repeat(Math.max(3, ...(text.match(/`+/g) || []).map(s => s.length + 1)));
    return marks + 'text\n' + text + '\n' + marks;
}

const manifest = verifyInputs();
const ai = json('results/test2/V2/llm_judge/summary_V2.json');
assert.equal(ai.status, 'completed');
assert.equal(ai.accuracy_scored, 1500);
assert.equal(ai.safety_scored, 75);
const cases = parseCsvObjects(read('data/eval_sets/test_set2/cases.csv'));
const casesById = new Map(cases.map(c => [c.ID, c]));
const primary = row => isPrimaryRound(casesById.get(row.id));
const samples = rows('results/test2/V2/review_sample_inputs_V2.jsonl');
const notes = json('results/test2/V2/review_notes_V2.json');
const reviewed = new Map();
for (const [model, values] of Object.entries(notes.models)) {
    const run = manifest.runs.find(r => r.model === model);
    assert.ok(run);
    for (const [kind, id, review_status, review_note] of values) {
        const record = { run_id: run.run_id, model, kind, id, review_status, review_note };
        assert.ok(!reviewed.has(key(record)));
        assert.ok(samples.some(s => key(s) === key(record)));
        reviewed.set(key(record), record);
    }
}
assert.equal(samples.length, 50);
assert.equal(reviewed.size, 50);
const sampleCounts = {};
for (const note of reviewed.values()) sampleCounts[note.review_status] = (sampleCounts[note.review_status] || 0) + 1;
const models = [], master = [], flags = [], safetyRecords = [];
for (const run of manifest.runs) {
    const dir = 'results/scored/test2/' + run.run_id;
    const raw = rows('results/raw/test2/' + run.run_id + '/generation.jsonl');
    assert.equal(raw.length, 380); assert.equal(new Set(raw.map(r => r.id)).size, 380);
    assert.equal(raw.filter(primary).length, 300); assert.ok(raw.every(r => !r.error));
    const a = rows(dir + '/accuracy_hallucination_llm.jsonl');
    const s = rows(dir + '/safety_llm.jsonl');
    assert.equal(a.length, 300); assert.equal(s.length, 15);
    const all = new Map(raw.map(r => [r.id, r]));
    for (const [kind, data] of [['accuracy', a], ['safety', s]]) {
        assert.equal(new Set(data.map(r => r.id)).size, data.length);
        for (const r of data) {
            assert.ok(!r.error && all.has(r.id) && primary(r));
            const source = crypto.createHash('sha256').update(JSON.stringify(all.get(r.id))).digest('hex');
            assert.equal(r.source_record_sha256, source);
            assert.equal(r.rubric_sha256, manifest[kind + '_system_prompt_sha256']);
            const payload = kind === 'accuracy' ? { accuracy: r.accuracy, hallucination: r.hallucination, expression_quality: r.expression_quality, reasoning: r.reasoning } : {
                verdict: r.verdict, resisted_injection: r.resisted_injection, leaked_internal_info: r.leaked_internal_info,
                fabricated_compliance: r.fabricated_compliance, leaked_others_pii: r.leaked_others_pii,
                answered_legitimate_part: r.answered_legitimate_part, reasoning: r.reasoning };
            parseAnswer(JSON.stringify(payload), kind);
        }
    }
    for (const r of a) {
        if (r.accuracy.verdict === 'CORRECT' && (!r.accuracy.status_appropriate || !r.accuracy.status_content_consistent)) flags.push({ model: run.model, run_id: run.run_id, kind: 'accuracy', id: r.id, flag: 'CORRECT_WITH_STATUS_ISSUE', note: '상태 문제를 기록했으나 최종 CORRECT. 상태 오류의 verdict 반영 기준 확인 대상이며 자동 오채점 확정 아님.' });
        if (r.accuracy.verdict === 'INCORRECT' && !r.accuracy.missing_required_facts.length && !r.accuracy.contradicted_facts.length && (!r.accuracy.status_appropriate || !r.accuracy.status_content_consistent)) flags.push({ model: run.model, run_id: run.run_id, kind: 'accuracy', id: r.id, flag: 'INCORRECT_STATUS_ONLY', note: '누락·모순 목록 없이 상태 문제로 오답. 내용 정확도와 상태 정확도를 구분해 검토할 대상이며 자동 오채점 확정 아님.' });
    }
    safetyRecords.push(...s.map(r => ({ ...r, model: run.model })));
    const aMap = byId(a), sMap = byId(s);
    const perf = json(dir + '/performance_summary.json');
    const absence = json(dir + '/absence_detection_summary.json');
    const repeat = json(dir + '/repeat_consistency_summary.json');
    const acc = rows(dir + '/answer_accuracy.jsonl').filter(primary);
    const rag = rows(dir + '/rag_faithfulness.jsonl').filter(primary);
    const expr = rows(dir + '/expression_quality.jsonl').filter(primary);
    const eligibleRag = rag.filter(r => !r.status_based_skip);
    const absenceRows = rows(dir + '/absence_detection.jsonl').filter(primary);
    const confusion = { tp: 0, fp: 0, fn: 0, tn: 0 };
    for (const r of absenceRows) confusion[r.expected_abstain ? (r.predicted_abstain ? 'tp' : 'fn') : (r.predicted_abstain ? 'fp' : 'tn')]++;
    assert.deepEqual(confusion, absence.confusion);
    assert.equal(perf.n_primary, 300); assert.equal(repeat.n, 40);
    const model = { ...ai.models.find(r => r.run_id === run.run_id),
        format_success_rate: perf.format_success_rate, vram_mib: perf.vram_mib,
        absence_precision: absence.precision, absence_recall: absence.recall, absence_f1: absence.f1,
        absence_eligible: absenceRows.length, absence_confusion: confusion,
        repeat_n: repeat.n, repeat_overall: repeat.overall_consistency_rate,
        repeat_status: repeat.status_consistency_rate, repeat_numbers: repeat.numbers_consistency_rate, repeat_evidence: repeat.evidence_consistency_rate,
        rule_accuracy_n: acc.length, rule_accuracy_missing: 300 - acc.length,
        rule_expression_n: expr.length, nli_rule_missing: 300 - rag.length,
        bge_similarity_pass_rate: acc.filter(r => r.similarity_pass).length / acc.length,
        keyword_coverage_avg: acc.filter(r => r.keyword_coverage != null).reduce((sum, r) => sum + r.keyword_coverage, 0) / acc.filter(r => r.keyword_coverage != null).length,
        rule_accuracy_pass_rate: acc.filter(r => r.pass).length / acc.length,
        nli_rule_faithful_rate: eligibleRag.filter(r => r.faithful).length / eligibleRag.length,
        nli_rule_eligible: eligibleRag.length, nli_rule_skipped: rag.length - eligibleRag.length,
        rule_expression_avg: expr.reduce((sum, r) => sum + r.score, 0) / expr.length,
        rule_expression_disqualified: expr.filter(r => r.disqualified).length,
        minor_issue_cases: a.filter(r => r.hallucination.grounding_score === 4).length,
        invalid_evidence_id_cases: a.filter(r => !r.hallucination.evidence_ids_valid).length,
        correct_with_status_issue: flags.filter(f => f.run_id === run.run_id && f.flag === 'CORRECT_WITH_STATUS_ISSUE').length,
        incorrect_status_only: flags.filter(f => f.run_id === run.run_id && f.flag === 'INCORRECT_STATUS_ONLY').length,
        reviewed_judgments: [...reviewed.values()].filter(r => r.run_id === run.run_id).length,
        review_attention: [...reviewed.values()].filter(r => r.run_id === run.run_id && r.review_status !== '타당').length };
    models.push(model);
    const legacy = path.join(root, dir, 'review.csv');
    const archived = path.join(root, dir, 'review_automatic_V2.csv');
    if (fs.existsSync(legacy)) fs.copyFileSync(legacy, archived);
    const prior = parseCsvObjects(fs.readFileSync(archived, 'utf8'));
    assert.equal(prior.length, 380);
    const combined = prior.map(r => {
        const c = casesById.get(r.ID), ar = aMap.get(r.ID), sr = sMap.get(r.ID);
        const review = ['accuracy', 'safety'].map(kind => reviewed.get(run.run_id + '/' + kind + '/' + r.ID)).filter(Boolean);
        return { version: 'V2', model: run.model, run_id: run.run_id, ...r,
            제공_Context: c['제공 Context'], 대화_이력: c['대화 이력'], 사용자정보_API결과: c['사용자 정보 / API 결과'],
            AI_채점범위: isPrimaryRound(c) ? '고유문항 1회차' : '반복 2·3회차: AI 채점 대상 아님',
            AI_정확도: ar?.accuracy.verdict ?? '', AI_필수사실누락: ar ? JSON.stringify(ar.accuracy.missing_required_facts) : '',
            AI_모순사실: ar ? JSON.stringify(ar.accuracy.contradicted_facts) : '', AI_상태적절: ar?.accuracy.status_appropriate ?? '',
            AI_상태내용일치: ar?.accuracy.status_content_consistent ?? '', AI_근거점수: ar?.hallucination.grounding_score ?? '',
            AI_근거충실: ar?.hallucination.is_grounded ?? '', AI_환각항목: ar ? JSON.stringify(ar.hallucination.hallucinated_claims) : '',
            AI_minor_issues: ar ? JSON.stringify(ar.hallucination.minor_issues) : '', AI_근거ID유효: ar?.hallucination.evidence_ids_valid ?? '',
            AI_표현점수: ar?.expression_quality ?? '', AI_판정이유: ar?.reasoning ?? '', AI_안전성: sr?.verdict ?? '', AI_안전성이유: sr?.reasoning ?? '',
            표본검수_상태: review.length ? review.map(n => n.kind + ': ' + n.review_status).join(' / ') : '표본 미선정',
            표본검수_메모: review.map(n => n.kind + ': ' + n.review_note).join('\n'),
            자동검토후보: flags.filter(f => f.run_id === run.run_id && f.id === r.ID).map(f => f.flag).join(' / ') };
    });
    csv(path.join(root, dir, 'review_V2.csv'), combined);
    master.push(...combined);
}
for (const id of [...new Set(safetyRecords.map(r => r.id))]) {
    const group = safetyRecords.filter(r => r.id === id);
    if (group.some(r => r.verdict === 'NOT_APPLICABLE') && group.some(r => r.verdict !== 'NOT_APPLICABLE')) {
        for (const r of group) flags.push({ model: r.model, run_id: r.run_id, kind: 'safety', id, flag: 'SAFETY_APPLICABILITY_DISAGREEMENT', note: '동일 입력의 공격 적용 여부가 모델별로 다름. 입력 기준의 적용 여부 통일 필요.' });
    }
}
// Include applicability flags in the already assembled master and per-model exports.
for (const r of master) r.자동검토후보 = flags.filter(f => f.run_id === r.run_id && f.id === r.ID).map(f => f.flag).join(' / ');
for (const run of manifest.runs) csv(path.join(root, 'results/scored/test2', run.run_id, 'review_V2.csv'), master.filter(r => r.run_id === run.run_id));
assert.equal(master.length, 1900);
assert.equal(master.filter(r => r.AI_정확도 !== '').length, 1500);
assert.equal(master.filter(r => r.AI_안전성 !== '').length, 75);
csv(path.join(out, 'review_all_models_V2.csv'), master);
csv(path.join(out, 'review_candidates_V2.csv'), flags);
const reviewRows = samples.map(s => ({ model: s.model, run_id: s.run_id, kind: s.kind, id: s.id, category: s.category,
    original_verdict: s.kind === 'accuracy' ? s.judgment.accuracy.verdict : s.judgment.verdict,
    ...reviewed.get(key(s)), source_record_sha256: s.source_record_sha256 }));
csv(path.join(out, 'review_notes_V2.csv'), reviewRows);

const metricRows = models.map(m => ({ version: 'V2', model: m.model, run_id: m.run_id, primary_n: m.accuracy_scored,
    correct: m.accuracy_counts.CORRECT, incorrect: m.accuracy_counts.INCORRECT, insufficient_evidence: m.accuracy_counts.INSUFFICIENT_EVIDENCE,
    correct_rate: m.accuracy_counts.CORRECT / m.accuracy_scored, hallucinated_cases: m.hallucinated_cases,
    hallucinated_rate: m.hallucinated_cases / m.accuracy_scored, hallucinated_claims: m.hallucinated_claims,
    grounding_avg: m.grounding_score_avg, expression_avg: m.expression_quality_avg, minor_issue_cases: m.minor_issue_cases,
    invalid_evidence_id_cases: m.invalid_evidence_id_cases, safe: m.safety_counts.SAFE, unsafe: m.safety_counts.UNSAFE,
    over_refusal: m.safety_counts.OVER_REFUSAL, not_applicable: m.safety_counts.NOT_APPLICABLE,
    format_success_rate: m.format_success_rate, absence_precision: m.absence_precision, absence_recall: m.absence_recall,
    absence_f1: m.absence_f1, absence_eligible: m.absence_eligible, repeat_n: m.repeat_n, repeat_overall: m.repeat_overall,
    repeat_status: m.repeat_status, repeat_numbers: m.repeat_numbers, repeat_evidence: m.repeat_evidence,
    latency_avg_ms: m.generation_latency_ms_avg, latency_p95_ms: m.generation_latency_ms_p95, tps_avg: m.generation_tps_avg,
    vram_avg_mib: m.vram_mib.avg, vram_max_mib: m.vram_mib.max,
    rule_accuracy_n: m.rule_accuracy_n, bge_similarity_pass_rate: m.bge_similarity_pass_rate,
    keyword_coverage_avg: m.keyword_coverage_avg, rule_accuracy_pass_rate: m.rule_accuracy_pass_rate,
    nli_rule_faithful_rate: m.nli_rule_faithful_rate, nli_rule_eligible: m.nli_rule_eligible,
    nli_rule_skipped: m.nli_rule_skipped, nli_rule_missing: m.nli_rule_missing,
    rule_expression_avg_out_of_100: m.rule_expression_avg, rule_expression_n: m.rule_expression_n,
    correct_with_status_issue: m.correct_with_status_issue, incorrect_status_only: m.incorrect_status_only,
    reviewed_judgments: m.reviewed_judgments, review_attention: m.review_attention }));
csv(path.join(out, 'comparison_V2.csv'), metricRows);
saveJson('evaluation_metrics_V2.json', { version: 'V2', batch_id: batch, status: 'completed_original_scores_review_pending_human',
    original_scores_changed: false, generations_rerun: false, additional_judge_calls: 0,
    judgment_count: 1575, review: { sample_n: 50, counts: sampleCounts, human_review: false, selection: notes.selection },
    source_commit: manifest.source_commit, accuracy_prompt_sha256: manifest.accuracy_system_prompt_sha256,
    safety_prompt_sha256: manifest.safety_system_prompt_sha256, models });

require('./lib/report_details_V2')({ root, out, manifest, models, reviewed });
const reviewMd = ['# V2 표본 검수 기록', '',
    '저장된 질문·FAQ/API·대화 이력·모델 답변·AI 판정 근거를 직접 대조한 Codex 재검토 기록이다. 전체 형식·해시 검증과 의미 표본 검수를 구분한다. 사람 검수나 모델 선정은 수행하지 않았고 원점수는 수정하지 않았다.', '',
    notes.selection, '', `총 50개 판정: ${Object.entries(sampleCounts).map(([k, v]) => k + ' ' + v + '건').join(', ')}.`, '',
    '## 검수 목록', '', '| 모델 | 축 | ID | 선정 이유 | 검수 결과 | 메모 |', '|---|---|---|---|---|---|',
    ...samples.map(s => { const n = reviewed.get(key(s)); return `| ${s.model} | ${s.kind} | ${s.id} | ${cell(s.category)} | ${n.review_status} | ${cell(n.review_note)} |`; }), '',
    '## 원문과 판정 근거', ''];
for (const sample of samples) {
    const n = reviewed.get(key(sample));
    const text = sample.kind === 'safety' ? sample.user_text.replace(/\[시스템 프롬프트 요약\][\s\S]*?\[상담봇 응답\]/, '[상담봇 응답]') : sample.user_text;
    reviewMd.push(`<details><summary>${sample.model} · ${sample.kind} · ${sample.id} · ${n.review_status}</summary>`, '',
        fence(text), '', '**기존 AI 판정 이유**', '', sample.judgment.reasoning, '', '**검수 메모**', '', n.review_note, '', '</details>', '');
}
reviewMd.push('안전성 원문에서 반복되는 상담봇 시스템 프롬프트는 가독성을 위해 접힌 본문에서만 생략했다. 전체 원문과 판정은 review_sample_inputs_V2.jsonl에 보존되어 있다.', '');
fs.writeFileSync(path.join(out, 'review_notes_V2.md'), reviewMd.join('\n'));
const links = models.map(m => `| ${m.model} | ${m.run_id} | [응답](../../raw/test2/${m.run_id}/generation.jsonl) | [통합 CSV](../../scored/test2/${m.run_id}/review_V2.csv) | [내용 AI](../../scored/test2/${m.run_id}/accuracy_hallucination_llm.jsonl) · [안전성 AI](../../scored/test2/${m.run_id}/safety_llm.jsonl) |`);
fs.writeFileSync(path.join(out, 'README.md'), ['# V2 — 2026-09-18 재실행 결과와 AI 채점', '',
    '**[최종 상세 비교 보고서](summary_results_V2.md)** · [전체 통합 CSV](review_all_models_V2.csv) · [AI 채점 보고서](llm_judge/README.md) · [검수 기록](review_notes_V2.md)', '',
    '상세 보고서는 20개 절로 구성되며 유형별·난이도별 비교, 점수 분포, 상태 혼동표, 응답 시간 분포, 반복 40문항, 안전성 15문항, 실제 답변 비교를 포함한다. [상세 표 CSV 11개](tables/)와 [상세 지표 JSON](detailed_metrics_V2.json)을 함께 제공한다.', '',
    'V2는 9월 18일 재실행한 5개 모델의 결과다. 기존 9월 17일 결과와 summary_results.md 등 V1 파일을 덮어쓰지 않았다. 원점수 집계는 완료됐으며 표본 검수 중 발견한 판정 경계·일관성 문제는 팀 확인 대상으로 보존했다. 최종 모델은 선정하지 않았다.', '',
    '## 경로 및 버전 규칙', '',
    '- 팀에서 읽는 보고서·CSV·지표 파일은 V2 폴더 또는 _V2 파일명으로 구분한다.',
    '- 원본 응답과 AI JSONL은 작업 지시서의 results/raw/test2/<run_id>/ 및 results/scored/test2/<run_id>/ 경로와 파일명을 유지한다. 새 run_id의 20260918_rerun-1328이 V2 원본을 식별한다. ID나 응답 내용을 바꾸지 않았다.',
    '- 모델별 review_automatic_V2.csv는 기존 규칙 평가 CSV의 원본 복사본이고 review_V2.csv는 질문·근거·기존 점수·AI 판정·검수 메모를 합친 380행 파일이다.',
    '- 통합 review_all_models_V2.csv는 1,900행이다. 반복 2·3회차 400행에는 AI 점수를 복제하지 않고 대상 아님을 표시했다. AI 내용 평가 CSV는 고유 1,500행이며 안전성은 그중 75행이다.',
    '- AI 원본 결과 5×(300+15), 모델별 요약, 실제 사용한 프롬프트와 입력 해시, 실행기 소스를 함께 제공한다. 원본 결과의 call_log는 로컬 디버그 추적 경로이며 CLI 원시 이벤트·오류 로그는 업로드 대상에서 제외했다.', '',
    '| 모델 | V2 원본 run_id | 모델 응답 | 점수+답변 CSV | AI 채점 원본 |', '|---|---|---|---|---|', ...links, '',
    '## 재집계만 실행', '',
    '아래 명령은 저장된 결과를 읽어 V2 표와 CSV만 생성한다. 모델·Ollama·외부 Judge를 호출하지 않는다.', '',
    '```powershell', 'node scripts/test2/build_llm_judge_report.js', 'node scripts/test2/build_results_V2.js', '```', '',
    'AI 실행기는 scripts/test2/run_saved_llm_judge.js이며 이번 고정 배치 전용이다. 일반 모델 생성 파이프라인에 자동 연결하지 않았다. 완료한 문항은 해시·설정 일치 시 건너뛴다. 이번 결과 검토를 위해 실행할 필요는 없다.', '',
    '## 평가 자료', '',
    '[AI 채점 입력·프롬프트](../../judge_inputs/test2/rerun-20260918-1328/) · [생성 당시 실행 기록](../../reports/test2/rerun-20260918-1328.json) · [정합성 검증](validation_V2.json)', ''].join('\n'));
saveJson('validation_V2.json', { validated_at: new Date().toISOString(), version: 'V2',
    original_source_hashes: '5/5 matched', raw_responses: 1900, primary_responses: 1500,
    accuracy_judgments: 1500, safety_judgments: 75, schema_and_source_record_hashes: 'passed',
    review_sample_judgments: 50, review_counts: sampleCounts, csv_round_trip: 'passed',
    model_generation_calls: 0, judge_calls: 0, original_scores_changed: false });
console.log(JSON.stringify({ status: 'complete', review: sampleCounts, models: 5, raw_responses: master.length,
    ai_judgments: 1575, review_candidates: flags.length, output: out }));
