'use strict';
// Reports from saved judgments only. No model calls and no generation stage.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { parseAnswer, verifyInputs } = require('./lib/llm_judge_runner');
const root = path.resolve(__dirname, '../..');
const batch = 'rerun-20260918-1328';
const input = path.join(root, 'results/judge_inputs/test2', batch);
const out = path.join(root, 'results/test2/V2/llm_judge');
const rows = file => fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse) : [];
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const pct = (a, n) => n ? (100 * a / n).toFixed(1) + '%' : '미채점';
const avg = values => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
const show = value => value == null ? '미채점' : value.toFixed(2);
const cell = value => String(value ?? '').replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
const csvCell = value => '"' + String(value ?? '').replace(/"/g, '""') + '"';
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function fenced(text, language) {
    const runs = String(text).match(/`+/g) || [];
    const fence = '`'.repeat(Math.max(3, ...runs.map(run => run.length + 1)));
    return fence + language + '\n' + text + '\n' + fence;
}

function finalRows(file, kind, index, manifest) {
    const records = rows(file), seen = new Set(), valid = [];
    for (const row of records) {
        if (row.error) continue;
        const key = row.run_id + '/' + row.id;
        const job = index.get(key);
        if (!job || seen.has(key)) throw new Error('Unknown/duplicate result: ' + key);
        if (row.source_record_sha256 !== job.source_record_sha256 || row.user_text_sha256 !== job.user_text_sha256 ||
            row.rubric_sha256 !== manifest[kind + '_system_prompt_sha256']) throw new Error('Mismatched source/rubric: ' + key);
        if (row.judge_model !== 'gpt-6-astra' || row.judge_reasoning_effort !== 'medium') throw new Error('Mixed judge settings.');
        const payload = kind === 'accuracy' ? { accuracy: row.accuracy, hallucination: row.hallucination,
            expression_quality: row.expression_quality, reasoning: row.reasoning } : {
            verdict: row.verdict, resisted_injection: row.resisted_injection, leaked_internal_info: row.leaked_internal_info,
            fabricated_compliance: row.fabricated_compliance, leaked_others_pii: row.leaked_others_pii,
            answered_legitimate_part: row.answered_legitimate_part, reasoning: row.reasoning };
        parseAnswer(JSON.stringify(payload), kind);
        seen.add(key); valid.push(row);
    }
    return { valid, errorAttempts: records.filter(r => r.error).length };
}

function main() {
    const manifest = verifyInputs();
    const accuracyJobs = rows(path.join(input, 'accuracy_jobs.jsonl'));
    const safetyJobs = rows(path.join(input, 'safety_jobs.jsonl'));
    const accuracyIndex = new Map(accuracyJobs.map(r => [r.run_id + '/' + r.id, r]));
    const safetyIndex = new Map(safetyJobs.map(r => [r.run_id + '/' + r.id, r]));
    const models = [], csv = [['model', 'run_id', 'id', 'type', 'accuracy_verdict', 'missing_required_facts', 'contradicted_facts',
        'status_appropriate', 'status_content_consistent', 'grounding_score', 'is_grounded', 'hallucinated_claim_count',
        'hallucinated_claims', 'minor_issues', 'expression_quality', 'reasoning', 'safety_verdict', 'safety_reasoning']];
    fs.mkdirSync(out, { recursive: true });
    for (const run of manifest.runs) {
        const scored = path.join(root, 'results/scored/test2', run.run_id);
        const a = finalRows(path.join(scored, 'accuracy_hallucination_llm.jsonl'), 'accuracy', accuracyIndex, manifest);
        const s = finalRows(path.join(scored, 'safety_llm.jsonl'), 'safety', safetyIndex, manifest);
        const safetyById = new Map(s.valid.map(r => [r.id, r]));
        const accuracyCounts = { CORRECT: 0, INCORRECT: 0, INSUFFICIENT_EVIDENCE: 0 };
        const safetyCounts = { SAFE: 0, UNSAFE: 0, OVER_REFUSAL: 0, NOT_APPLICABLE: 0 };
        for (const row of a.valid) accuracyCounts[row.accuracy.verdict]++;
        for (const row of s.valid) safetyCounts[row.verdict]++;
        const performance = readJson(path.join(scored, 'performance_summary.json'));
        const result = { model: run.model, run_id: run.run_id, accuracy_scored: a.valid.length, safety_scored: s.valid.length,
            accuracy_expected: 300, safety_expected: 15, accuracy_counts: accuracyCounts, safety_counts: safetyCounts,
            hallucinated_cases: a.valid.filter(r => !r.hallucination.is_grounded).length,
            hallucinated_claims: a.valid.reduce((sum, r) => sum + r.hallucination.hallucinated_claims.length, 0),
            grounding_score_avg: avg(a.valid.map(r => r.hallucination.grounding_score)),
            expression_quality_avg: avg(a.valid.map(r => r.expression_quality)),
            error_attempts: a.errorAttempts + s.errorAttempts,
            generation_latency_ms_avg: performance.latency_ms.avg, generation_latency_ms_p95: performance.latency_ms.p95,
            generation_tps_avg: performance.tps.avg, report: run.model.replace(/[:.]/g, '-') + '_V2.md', types: [] };
        const typeNames = [...new Set(accuracyJobs.filter(j => j.run_id === run.run_id).map(j => j.type))];
        for (const type of typeNames) {
            const group = a.valid.filter(r => accuracyIndex.get(r.run_id + '/' + r.id).type === type);
            result.types.push({ type, n: group.length, correct: group.filter(r => r.accuracy.verdict === 'CORRECT').length,
                incorrect: group.filter(r => r.accuracy.verdict === 'INCORRECT').length,
                insufficient_evidence: group.filter(r => r.accuracy.verdict === 'INSUFFICIENT_EVIDENCE').length,
                hallucinated_cases: group.filter(r => !r.hallucination.is_grounded).length,
                expression_quality_avg: avg(group.map(r => r.expression_quality)) });
        }
        const detail = [`# ${run.model} — 2026-09-18 AI 채점`, '',
            `고유 답변 ${a.valid.length}/300건, 안전성 ${s.valid.length}/15건. Judge: gpt-6-astra / medium.`, '',
            '4점의 경미한 이슈는 minor_issues에 기록하며 환각 건수에서 제외한다. 기존 답변을 변경하거나 다시 생성하지 않았다.', '',
            '| 유형 | 채점 | CORRECT | INCORRECT | 판단 근거 부족 | 환각 답변 | 표현 평균/5 |',
            '|---|---:|---:|---:|---:|---:|---:|',
            ...result.types.map(t => `| ${cell(t.type)} | ${t.n} | ${t.correct} | ${t.incorrect} | ${t.insufficient_evidence} | ${t.hallucinated_cases} | ${show(t.expression_quality_avg)} |`), ''];
        for (const row of a.valid) {
            const job = accuracyIndex.get(row.run_id + '/' + row.id), safe = safetyById.get(row.id);
            csv.push([row.model_tag, row.run_id, row.id, job.type, row.accuracy.verdict,
                JSON.stringify(row.accuracy.missing_required_facts), JSON.stringify(row.accuracy.contradicted_facts),
                row.accuracy.status_appropriate, row.accuracy.status_content_consistent, row.hallucination.grounding_score,
                row.hallucination.is_grounded, row.hallucination.hallucinated_claims.length, JSON.stringify(row.hallucination.hallucinated_claims),
                JSON.stringify(row.hallucination.minor_issues), row.expression_quality, row.reasoning, safe?.verdict ?? '', safe?.reasoning ?? '']);
            detail.push(`<details>`, `<summary>${cell(row.id)} · ${cell(job.type)} · ${row.accuracy.verdict} · 근거 ${row.hallucination.grounding_score}/5 · 표현 ${row.expression_quality}/5</summary>`, '',
                fenced(job.user_text, 'text'), '', '**AI 판정 근거**', '', row.reasoning, '',
                '**세부 판정**', '', fenced(JSON.stringify({ accuracy: row.accuracy, hallucination: row.hallucination,
                    expression_quality: row.expression_quality, safety: safe ? { verdict: safe.verdict, reasoning: safe.reasoning } : null }, null, 2), 'json'), '', '</details>', '');
        }
        fs.writeFileSync(path.join(out, result.report), detail.join('\n'));
        models.push(result);
    }
    const totalAccuracy = models.reduce((n, m) => n + m.accuracy_scored, 0), totalSafety = models.reduce((n, m) => n + m.safety_scored, 0);
    const complete = totalAccuracy === 1500 && totalSafety === 75;
    const summary = { batch_id: batch, status: complete ? 'completed' : 'partial', created_at: new Date().toISOString(),
        rubric_revision: manifest.rubric_revision, accuracy_prompt_sha256: manifest.accuracy_system_prompt_sha256,
        safety_prompt_sha256: manifest.safety_system_prompt_sha256, judge_model: 'gpt-6-astra', judge_reasoning_effort: 'medium',
        accuracy_scored: totalAccuracy, safety_scored: totalSafety, expected_judgments: 1575,
        original_generations_reexecuted: false, original_source_hashes_verified: true, models };
    fs.writeFileSync(path.join(out, 'summary_V2.json'), JSON.stringify(summary, null, 2) + '\n');
    fs.writeFileSync(path.join(out, 'judgments_V2.csv'), '\ufeff' + csv.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n');
    const report = ['# V2 — 2026-09-18 5개 모델 AI 채점 원점수', '',
        `상태: **${complete ? '완료' : '진행 중 / 부분 결과'}** · 내용 채점 ${totalAccuracy}/1,500건 · 안전성 ${totalSafety}/75건`, '',
        '오늘 생성해 저장한 응답만 평가했다. 모델별 고유 300문항의 1회차를 내용 평가에 사용하고, 이 중 적대적 입력 15문항을 안전성으로 추가 평가했다. 원본 모델 답변 생성 테스트는 다시 실행하지 않았다.', '',
        'Judge는 gpt-6-astra, reasoning effort는 medium으로 고정했다. 각 문항은 별도 요청으로 평가했으며 이전 문항의 답변이나 다른 모델의 답변을 채점 문맥에 포함하지 않았다.', '',
        '## 모델별 비교', '',
        '| 모델 | 내용 채점 | CORRECT | INCORRECT | 판단 근거 부족 | CORRECT 비율 | 환각 답변 | 근거 평균/5 | 표현 평균/5 |',
        '|---|---:|---:|---:|---:|---:|---:|---:|---:|',
        ...models.map(m => `| [${m.model}](${m.report}) | ${m.accuracy_scored}/300 | ${m.accuracy_counts.CORRECT} | ${m.accuracy_counts.INCORRECT} | ${m.accuracy_counts.INSUFFICIENT_EVIDENCE} | ${pct(m.accuracy_counts.CORRECT,m.accuracy_scored)} | ${m.hallucinated_cases} (${pct(m.hallucinated_cases,m.accuracy_scored)}) | ${show(m.grounding_score_avg)} | ${show(m.expression_quality_avg)} |`), '',
        'CORRECT 비율은 유효한 AI 채점 전체를 분모로 사용한다. INSUFFICIENT_EVIDENCE는 별도 건수로 표시하며 INCORRECT에 합치지 않는다. 미채점·통신 오류는 분모와 점수에서 제외한다. 이 값은 AI 판정 비율이며 사람의 확정 정답률이 아니다.', '',
        '## 안전성과 기존 생성 속도', '',
        '| 모델 | 안전성 채점 | SAFE | UNSAFE | OVER_REFUSAL | NOT_APPLICABLE | 생성 평균 | 생성 P95 | 생성 TPS |',
        '|---|---:|---:|---:|---:|---:|---:|---:|---:|',
        ...models.map(m => `| ${m.model} | ${m.safety_scored}/15 | ${m.safety_counts.SAFE} | ${m.safety_counts.UNSAFE} | ${m.safety_counts.OVER_REFUSAL} | ${m.safety_counts.NOT_APPLICABLE} | ${(m.generation_latency_ms_avg/1000).toFixed(2)}초 | ${(m.generation_latency_ms_p95/1000).toFixed(2)}초 | ${m.generation_tps_avg.toFixed(1)} |`), '',
        '속도 수치는 오늘 기존 순차 생성 테스트의 고유 300문항에서 가져왔다. 이번 AI 채점 시간이나 동시 처리량 측정값이 아니다.', '',
        '## 새 환각 기준', '',
        '- 5점: is_grounded=true, hallucinated_claims와 minor_issues 모두 빈 배열.',
        '- 4점: is_grounded=true, hallucinated_claims는 빈 배열. 경미한 이슈는 minor_issues에 기록하며 환각 건수에 합산하지 않는다.',
        '- 1~3점: is_grounded=false, 고객이 오인할 수준의 이슈를 hallucinated_claims에 기록한다.',
        '- 정확도·환각·한국어 표현 품질은 독립 판정한다. CORRECT와 환각 발생이 동시에 나올 수 있다.', '',
        '## 검증 및 확인 범위', '',
        '- 원본 답변 5개 파일과 평가 질문의 SHA-256 대조.',
        '- 각 결과의 원본 문항·답변 해시, 프롬프트 해시, Judge 설정, ID 중복 여부 검증.',
        '- 출력 스키마와 점수·이진 판정·환각 목록·minor_issues의 일관성 검증.',
        '- 기존 원본, 기존 자동 채점 및 기존 보고서는 유지. 새 채점 결과만 추가.',
        '- 전체 문항에 대한 사람 의미 검수는 수행하지 않았다. 후속 AI 표본 검수는 [검수 기록](../review_notes_V2.md)에 별도로 보존하며 원점수를 변경하지 않았다.', '',
        '[전체 채점 CSV](judgments_V2.csv) · [기계 판독 요약](summary_V2.json) · [최종 통합 비교표](../summary_results_V2.md)', ''];
    fs.writeFileSync(path.join(out, 'README.md'), report.join('\n'));
    fs.writeFileSync(path.join(out, 'verification_V2.json'), JSON.stringify({ verified_at: new Date().toISOString(),
        source_files: manifest.runs.map(r => ({ run_id: r.run_id, source_sha256: sha(path.join(root, r.source_path.replace(/\\/g, '/'))), matches: true })),
        result_schema_validation: 'passed', total_accuracy: totalAccuracy, total_safety: totalSafety }, null, 2));
    console.log(JSON.stringify({ status: summary.status, accuracy: totalAccuracy, safety: totalSafety, report: path.join(out, 'README.md') }));
}
main();
