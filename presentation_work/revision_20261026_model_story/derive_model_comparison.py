"""Aggregate saved judgments on one common cohort. No external calls."""
from pathlib import Path
import json,hashlib
D=Path(__file__).resolve().parent
R=D.parents[1]
sources=[]
def rows(p):
 b=p.read_bytes();sources.append({'path':str(p),'sha256':hashlib.sha256(b).hexdigest()})
 return {r['id']:r for r in map(json.loads,b.decode('utf-8-sig').splitlines())}
def one(pattern):
 p=list(R.glob(pattern));assert len(p)==1,(pattern,len(p));return p[0]
m={}
m['OFF']=rows(one('model_test_v4/try1/results/raw/scored/*qwen3-4b_t0*n100*/llm_judge/v4-try1-n100/paths.jsonl'))
m['OFF_t1c']={**rows(R/'presentation_work/evidence_20261026/off_t1c_regular_paths.jsonl'),**rows(R/'presentation_work/evidence_20261026/off_t1c_focus_paths.jsonl')}
for k,p in [('Instruct_Q4','*qwen3-4b-instruct_t0*'),('Instruct_Q8','*qwen3-4b-instruct-2507-q8_0*'),('Gemma_QAT','*gemma3-4b-it-qat*')]:
 m[k]=rows(one('model_test_v5/try1/results/raw/scored/'+p+'/llm_judge/v5-try1-n100/paths.jsonl'))
ids=sorted(set.intersection(*(set(r) for r in m.values())))
assert len(ids)==404
metrics={}
for k,data in m.items():
 rs=[data[i] for i in ids]
 ev=[r for r in rs if r['evidence_applicable']]
 assert all(r['evidence_label_ok'] is None for r in rs if not r['evidence_applicable'])
 assert len(ev)==205
 assert all(r['status_label_ok']==(r['label_status']==r['expected_status']) for r in rs)
 assert all(r['evidence_label_ok']==(bool(r['cited_ids']) and set(r['cited_ids']).issubset(r['gold_ids'])) for r in ev)
 metrics[k]={'n':len(rs),'correct':sum(r['correct'] for r in rs),'hallucination':sum(r['flags']['hallucinated'] for r in rs),
 'status_correct':sum(r['status_label_ok'] for r in rs),'evidence_n':len(ev),'evidence_correct':sum(r['evidence_label_ok'] for r in ev)}
result={'models':metrics,'ids':ids,'sources':sources,'definitions':{
 'status':'Strict equality between output status and expected status. Not body correctness plus status.',
 'evidence':'On 205 evidence-applicable cases: cite one or more documents and every cited document belongs to gold. Not require every gold document, not all-case denominator.',
 'cohort':'404 common cases, including selected OFF errors. Not representative 1,300-case whole-suite rates.'}}
(D/'model_comparison_metrics.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(metrics,ensure_ascii=False))
