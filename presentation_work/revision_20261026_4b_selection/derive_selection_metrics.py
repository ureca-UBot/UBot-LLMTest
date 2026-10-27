"""Saved v4 judgments only. No new generation, embeddings or judging."""
from pathlib import Path
import json,hashlib

D=Path(__file__).resolve().parent
ROOT=D.parents[1]
out={}
sources=[]
for key,model in [('Qwen','qwen3'),('Gemma','gemma3')]:
    path=ROOT/f'model_test_v4/try1/results/raw/scored/ec2-linux_{model}-4b_t0_nothink_fixed_n200_20261005/llm_judge/v4-try1-n200/paths.jsonl'
    raw=path.read_bytes()
    sources.append({'path':str(path),'sha256':hashlib.sha256(raw).hexdigest()})
    rows=[r for r in map(json.loads,raw.decode('utf-8').splitlines()) if r['item']!='RT']
    incorrect=[r for r in rows if not r['correct']]
    over=[r for r in incorrect if r['expected_status'] in ['ANSWER','PARTIAL'] and r['content_stance']=='ABSTAIN']
    answered=[r for r in rows if r['expected_status']=='ANSWER' and r['content_stance']=='ANSWER']
    calc=[r for r in answered if r['item'] in ['CE','UI','AR']]
    decline=[r for r in rows if r['expected_status'] in ['ABSTAIN','CONFLICT','OUT_OF_SCOPE']]
    no_answer=[r for r in rows if r['expected_status']=='ABSTAIN']
    labeled_answer=[r for r in rows if r['label_status']=='ANSWER']
    def stat(n,d):return {'count':n,'n':d,'rate':n/d}
    out[key]={
        'total':len(rows),
        'over_abstain':stat(len(over),len(incorrect)),
        'over_abstain_without_hallucination':sum(not r['flags']['hallucinated'] for r in over),
        'answered_accuracy':stat(sum(r['correct'] for r in answered),len(answered)),
        'calculation_accuracy':stat(sum(r['correct'] for r in calc),len(calc)),
        'calculation_hallucination':stat(sum(r['flags']['hallucinated'] for r in calc),len(calc)),
        'decline_accuracy':stat(sum(r['correct'] for r in decline),len(decline)),
        'no_answer_error':stat(sum(not r['correct'] for r in no_answer),len(no_answer)),
        'no_answer_hallucination':stat(sum(r['flags']['hallucinated'] for r in no_answer),len(no_answer)),
        'labeled_answer_hallucination':stat(sum(r['flags']['hallucinated'] for r in labeled_answer),len(labeled_answer))}
assert out['Qwen']['over_abstain']['count']==352
assert out['Gemma']['over_abstain']['count']==32
assert out['Qwen']['no_answer_hallucination']['count']==143
assert out['Gemma']['no_answer_hallucination']['count']==214
assert out['Qwen']['no_answer_error']['count']==71
assert out['Gemma']['no_answer_error']['count']==123
assert out['Qwen']['answered_accuracy']['n']==1090
assert out['Gemma']['answered_accuracy']['n']==1319
decision=ROOT/'model_test_v4/try1/results/summary/tuning_target_decision.md'
sources.append({'path':str(decision),'sha256':hashlib.sha256(decision.read_bytes()).hexdigest()})
out['sources']=sources
out['definitions']={
    'answered':'Expected ANSWER and actual body stance ANSWER. Different selected populations; not an overall accuracy or causal improvement estimate.',
    'no_answer':'Expected ABSTAIN, 670 identical questions in each model.',
    'decline':'Expected ABSTAIN/CONFLICT/OUT_OF_SCOPE, 830 questions.',
    'labeled_answer':'Model output status ANSWER, distinct from body stance ANSWER.',
    'hallucination':'Independent of correctness; correct and hallucinated can overlap.'}
(D/'selection_metrics.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({m:{k:v for k,v in a.items() if k in ['over_abstain','answered_accuracy','no_answer_error','no_answer_hallucination']} for m,a in out.items() if m in ['Gemma','Qwen']},ensure_ascii=False))
