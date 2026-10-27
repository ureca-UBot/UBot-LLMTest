import json, urllib.request
rows = [json.loads(x) for x in open('results/raw/llm_answer_generation.jsonl', encoding='utf-8')][:8]
case = rows[0]['case']
user = {'cases': [{'test': case['test'], 'case_id': case['id'], 'question': case['query'], 'faq_context': case['context'], 'expected_behavior': case.get('test_point', ''), 'answers': [{'model': r['model'], 'answer': (r.get('parsed') or {}).get('answer', r.get('raw_output', '')), 'grounded': (r.get('parsed') or {}).get('grounded', ''), 'format_valid': r.get('format_valid', False)} for r in rows]}]}
system = 'Return only JSON with evaluations for every model. Fields: test, case_id, model, accuracy, completeness, relevance, grounding, naturalness, problem, issue.'
payload = {'model': 'qwen3:1.7b', 'messages': [{'role': 'system', 'content': system}, {'role': 'user', 'content': json.dumps(user, ensure_ascii=False)}], 'format': 'json', 'stream': False, 'think': False, 'options': {'temperature': 0, 'num_predict': 4096}}
req = urllib.request.Request('http://127.0.0.1:11434/api/chat', data=json.dumps(payload, ensure_ascii=False).encode('utf-8'), headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req, timeout=600) as res: print(res.read().decode('utf-8'))
