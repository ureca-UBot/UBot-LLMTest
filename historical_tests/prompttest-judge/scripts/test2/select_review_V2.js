'use strict';
// Select saved judgments for a targeted semantic review. No model calls.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const suitePaths = require('./lib/suite');
const out = suitePaths.v2Dir();
const input = suitePaths.judgeInputsDir();
const jsonl = file => fs.readFileSync(file, 'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const manifest = JSON.parse(fs.readFileSync(path.join(input, 'manifest.json'), 'utf8'));
const inputs = Object.fromEntries(['accuracy', 'safety'].map(kind => [kind,
    new Map(jsonl(path.join(input, kind + '_jobs.jsonl')).map(j => [j.run_id + '/' + j.id, j]))]));
const selected = [];
for (const run of manifest.runs) {
    const dir = suitePaths.scoredDir(run.run_id);
    const accuracy = jsonl(path.join(dir, 'accuracy_hallucination_llm.jsonl')).filter(r => !r.error).sort((a, b) => a.id.localeCompare(b.id));
    const safety = jsonl(path.join(dir, 'safety_llm.jsonl')).filter(r => !r.error).sort((a, b) => a.id.localeCompare(b.id));
    const used = new Set();
    function pick(kind, category, predicate) {
        const row = (kind === 'accuracy' ? accuracy : safety).find(r => !used.has(kind + '/' + r.id) && predicate(r));
        if (!row) throw new Error('No sample for ' + run.model + '/' + category);
        used.add(kind + '/' + row.id);
        const job = inputs[kind].get(run.run_id + '/' + row.id);
        selected.push({ model: run.model, run_id: run.run_id, id: row.id, kind, category, type: job.type,
            source_record_sha256: job.source_record_sha256, user_text: job.user_text, judgment: row });
    }
    pick('accuracy', '정답·근거충실', r => r.accuracy.verdict === 'CORRECT' && r.hallucination.grounding_score === 5 && !r.id.startsWith('AD-'));
    pick('accuracy', '오답·근거충실', r => r.accuracy.verdict === 'INCORRECT' && r.hallucination.grounding_score === 5 && r.accuracy.missing_required_facts.length > 0);
    pick('accuracy', '정답·환각 동시 판정', r => r.accuracy.verdict === 'CORRECT' && !r.hallucination.is_grounded && !r.id.startsWith('AD-'));
    pick('accuracy', '오답·환각 동시 판정', r => r.accuracy.verdict === 'INCORRECT' && !r.hallucination.is_grounded && !r.id.startsWith('AD-'));
    pick('accuracy', '경미한 이슈 4점', r => r.hallucination.grounding_score === 4);
    pick('accuracy', '내용 누락·모순 없이 상태로 오답', r => r.accuracy.verdict === 'INCORRECT' && !r.accuracy.missing_required_facts.length && !r.accuracy.contradicted_facts.length);
    for (const id of ['AD-0019', 'AD-0043', 'AD-0049']) pick('safety', '모델 간 판정 차이 ' + id, r => r.id === id);
    pick('safety', 'UNSAFE 판정', r => r.verdict === 'UNSAFE');
}
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'review_sample_inputs_V2.jsonl'), selected.map(r => JSON.stringify(r)).join('\n') + '\n');
console.log(JSON.stringify({ selected: selected.length, accuracy: selected.filter(r => r.kind === 'accuracy').length,
    safety: selected.filter(r => r.kind === 'safety').length, selection: 'purposeful, not a statistical random sample', model_calls: 0 }));
