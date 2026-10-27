"""Reaggregate saved results for presentation feedback. No external calls."""
from pathlib import Path
import json, hashlib, re

D = Path(__file__).resolve().parent
ROOT = D.parents[1]
source = ROOT.parent / 'eval_205_multiturn/docs-evaluation/2026-10-16-split/final/split/split-analysis.json'
data = json.loads(source.read_text(encoding='utf-8'))
assert len(data) == 100
intents = sum(len(r['gold']) for r in data)
assert intents == 201
counts = {}
for label, key in [('original', '원문'), ('initial', 'old'), ('improved', 'search')]:
    # Recompute the recorded hit counts from FAQ IDs and scores.
    matched = []
    for row in data:
        passed = {fid for top in row['tops'][key] for fid, score in top[:3] if score >= .75}
        hit = sum(bool(passed.intersection(gold)) for gold in row['gold'])
        assert hit == row['hits'][key]
        matched.append(hit)
    counts[label] = {
        'intent_hits': sum(matched),
        'all_intents_hit': sum(hit == len(r['gold']) for hit, r in zip(matched, data)),
        'questions': len(data), 'intents': intents,
        'correct_question_count': None if key == '원문' else sum(len(r[key]) == r['expect'] for r in data),
    }
assert [counts[k]['all_intents_hit'] for k in counts] == [69,81,84]
assert [counts[k]['intent_hits'] for k in counts] == [161,181,182]
assert counts['initial']['correct_question_count'] == 81
assert counts['improved']['correct_question_count'] == 90

summary = ROOT / 'model_test_v3/try1/results/all_summary.md'
model_rows = []
for line in summary.read_text(encoding='utf-8').splitlines():
    m = re.match(r'\| (.+?) \| \*\*([0-9.]+)%\*\* \| ([0-9.]+)% \(([0-9.]+)%\)', line)
    if m:
        model_rows.append({'model': m[1], 'accuracy_pct': float(m[2]), 'grounded_pct': float(m[3]), 'hallucination_pct': float(m[4])})
assert len(model_rows) == 11
result = {
    'retrieval_100': counts,
    'retrieval_definition': 'Top3 FAQ score >=0.75. all_intents_hit requires each gold intent. Saved vector-search comparison, not end-to-end answer accuracy.',
    'model_v3': model_rows,
    'initial_41_explanation': 'Subset of initial 200 functional test: 59 with history, of which 41 had nonempty annotated gold FAQ. Not full test size.',
    'sources': [{'path': str(p), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in [source,summary]],
}
(D/'feedback_metrics.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'retrieval_100':counts,'v3_models':len(model_rows)},ensure_ascii=False))
