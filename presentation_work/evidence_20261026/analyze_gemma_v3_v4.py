"""Read-only audit of saved model judgments; never invokes a model or service."""
from pathlib import Path
from collections import Counter
import hashlib, json, re

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
sources = []
def read(path):
    p = ROOT / path
    b = p.read_bytes()
    sources.append({'path':str(p),'sha256':hashlib.sha256(b).hexdigest()})
    return json.loads(b.decode('utf-8-sig'))
def lines(path):
    p = ROOT / path
    b = p.read_bytes()
    sources.append({'path':str(p),'sha256':hashlib.sha256(b).hexdigest()})
    return [json.loads(s) for s in b.decode('utf-8-sig').splitlines() if s.strip()]

v3 = read('model_test_v3/try1/results/llm_judge/metrics.json')
v4 = read('model_test_v4/try1/results/llm_judge/v4-try1-n200_metrics.json')
a = next(r for r in v3['runs'] if r['model']=='gemma3:4b' and r['condition']=='t0_think')
b = next(r for r in v4['runs'] if r['model']=='gemma3:4b')
codes = ['SF','NC','MC','UI','CE','PI','SR','HR','EC','CF','MT','AD','AR']
types3 = dict(zip(codes,a['by_type']))
assert len(types3)==13 and types3['EC']['type']=='빈 컨텍스트'
common = [k for k in codes if k!='SF']
by_type = []
for k in common:
    x,y = types3[k],b['accuracy']['by_item'][k]
    by_type.append({'item':k,'name':x['type'],
        'v3':{'n':x['n'],'hallucinated':x['hallucinated'],'rate':x['hallucinated']/x['n']},
        'v4':{'n':y['n_scored'],'hallucinated':round(y['hallucination_rate']*y['n_scored']),'rate':y['hallucination_rate']}})
n3 = sum(types3[k]['n'] for k in common)
n4 = sum(b['accuracy']['by_item'][k]['n_scored'] for k in common)
weight_check = {
    'common_types':len(common),
    'v3_common_rate':sum(types3[k]['hallucinated'] for k in common)/n3,
    'v4_common_rate':sum(b['accuracy']['by_item'][k]['n_scored']*b['accuracy']['by_item'][k]['hallucination_rate'] for k in common)/n4,
    'v4_rates_with_v3_common_type_weights':sum(types3[k]['n']*b['accuracy']['by_item'][k]['hallucination_rate'] for k in common)/n3,
    'scope':'Aggregation sensitivity only. Different questions, prompts and evaluators remain; not a controlled causal estimate.'}

status_breakdown = {}
for model in ['qwen3','gemma3']:
    run=f'ec2-linux_{model}-4b_t0_nothink_fixed_n200_20261005'
    rows=lines(f'model_test_v4/try1/results/raw/scored/{run}/llm_judge/v4-try1-n200/paths.jsonl')
    rows=[r for r in rows if r['item']!='RT']
    hs=[r for r in rows if r['flags']['hallucinated']]
    item={'n':len(rows),'hallucinated':len(hs)}
    for key in ['label_status','content_stance']:
        total=Counter(r[key] for r in rows)
        h=Counter(r[key] for r in hs)
        item[key]={k:{'n':n,'hallucinated':h[k],'conditional_rate':h[k]/n,'share_of_all_hallucinated':h[k]/len(hs)} for k,n in total.items()}
    status_breakdown[model]=item

empty_status = {}
for ver,run in [('v3','ec2-linux_gemma3-4b_t0_think_20260920'),('v4','ec2-linux_gemma3-4b_t0_nothink_fixed_n200_20261005')]:
    rows=lines(f'model_test_{ver}/try1/results/raw/{run}/generation.jsonl')
    ec=[r for r in rows if re.fullmatch(r'EC-\d{4}',r['id'])]
    empty_status[ver]={'n':len(ec),'status_counts':dict(Counter(r['parsed']['status'] for r in ec))}
assert empty_status['v3']=={'n':30,'status_counts':{'CLARIFY':30}}
assert empty_status['v4']=={'n':200,'status_counts':{'ABSTAIN':200}}

result={'gemma_overall':{
    'v3':{'n':a['metrics']['n'],'hallucinated':a['metrics']['hallucinated'],'rate':a['metrics']['hallucinated']/a['metrics']['n']},
    'v4':{'n':b['accuracy']['independent']['n_scored'],'hallucinated':625,'rate':b['accuracy']['independent']['hallucination_rate']}},
    'by_common_type':by_type,'weight_check':weight_check,'v4_status_breakdown':status_breakdown,
    'empty_context_status':empty_status,'sources':sources,
    'limits':['No paired same-question v3/v4 generation and no common-evaluator rescoring was performed.',
    'Both use gemma3:4b with think=null. The run condition name is not an actual Gemma thinking ON/OFF toggle.',
    'V3 and V4 both broadly count grounding scores 1-3 as material hallucination; their detailed rubrics and judge models differ.',
    'V4 rubric explicitly separates incorrect arithmetic using supplied inputs from invented facts.']}
(OUT/'gemma_v3_v4_and_status.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'overall':result['gemma_overall'],'weights':weight_check,'empty_context':empty_status},ensure_ascii=False))
