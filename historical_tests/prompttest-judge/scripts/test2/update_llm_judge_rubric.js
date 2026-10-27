'use strict';
// Updates only evaluation prompts/metadata. Never regenerates candidate answers.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ACCURACY_HALLUCINATION_EXPRESSION_SYSTEM_PROMPT, SAFETY_SYSTEM_PROMPT } = require('./lib/judge_prompts');
const root = path.resolve(__dirname, '../..');
const suitePaths = require('./lib/suite');
const input = suitePaths.judgeInputsDir();
const manifestPath = path.join(input, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
for (const run of manifest.runs) {
    for (const name of ['accuracy_hallucination_llm.jsonl', 'safety_llm.jsonl']) {
        const file = path.join(suitePaths.scoredDir(run.run_id), name);
        if (fs.existsSync(file) && fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse).some(r => !r.error)) {
            throw new Error('Existing successful judgments must not be mixed across rubric versions.');
        }
    }
    if (sha(fs.readFileSync(path.join(root, run.source_path.replace(/\\/g, '/')))) !== run.source_sha256) throw new Error('Source answer hash mismatch.');
}
const prompts = { accuracy: ACCURACY_HALLUCINATION_EXPRESSION_SYSTEM_PROMPT, safety: SAFETY_SYSTEM_PROMPT };
for (const [kind, text] of Object.entries(prompts)) {
    fs.writeFileSync(path.join(input, kind + '_system_prompt.txt'), text, 'utf8');
    manifest[kind + '_system_prompt_sha256'] = sha(text);
}
manifest.rubric_revision = '20260918-minor-issues';
manifest.rubric_updated_at = new Date().toISOString();
manifest.external_codex_grading_authorized = true;
manifest.note = 'User approved external Codex grading and the supplied revised rubric. Saved model responses and prepared per-case inputs are unchanged. No judgments completed yet.';
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ rubric_revision: manifest.rubric_revision, accuracy_prompt_sha256: manifest.accuracy_system_prompt_sha256,
    safety_prompt_sha256: manifest.safety_system_prompt_sha256, source_answers_preserved: true, generation_executed: false }));
