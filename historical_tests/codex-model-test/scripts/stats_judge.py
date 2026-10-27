import json
from collections import defaultdict
d = defaultdict(list)
for line in open('results/raw/llm_answer_judgement.jsonl', encoding='utf-8'):
    for e in json.loads(line)['evaluations']:
        d[e['model']].append(e)
for model, values in d.items():
    print(model, len(values), *(sum(e[k] for e in values) for k in ['accuracy','completeness','relevance','grounding','naturalness']), sum(not e['problem'] for e in values))
