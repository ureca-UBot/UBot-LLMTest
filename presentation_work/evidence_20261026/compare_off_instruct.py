"""Compare saved OFF tuning results with untuned Instruct on shared IDs.
Reads t1c Judge blobs from the existing local commit; never switches branches.
"""
from pathlib import Path
from collections import Counter
import subprocess, json, hashlib, math

ROOT=Path(r'C:\Ureka\ureca_project2\LLM_Test')
OUT=ROOT/'presentation_work/evidence_20261026'
GIT=r'C:\Users\pc\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe'
manifest=[]

def decode(b):
    return [json.loads(s) for s in b.decode('utf-8-sig').splitlines() if s.strip()]
def load(pattern):
    d={}
    for p in sorted(ROOT.glob(pattern)):
        b=p.read_bytes(); manifest.append(dict(path=str(p),sha256=hashlib.sha256(b).hexdigest()))
        for r in decode(b):
            if r['id'] in d: raise ValueError(f'Duplicate {r["id"]}')
            d[r['id']]=r
    if not d: raise ValueError(pattern)
    return d
def git(*args):
    return subprocess.check_output([GIT,*args],cwd=ROOT)
commit=git('rev-parse','315fffe').decode().strip()
tree=git('ls-tree','-r','--name-only',commit,'--','prompts_test_v3').decode().splitlines()
t1c={}
for p in tree:
    if not p.endswith('/paths.jsonl'): continue
    b=git('show',f'{commit}:{p}')
    name='off_t1c_'+('focus' if 'ids-ncmc' in p else 'regular')+'_paths.jsonl'
    (OUT/name).write_bytes(b)
    manifest.append(dict(git_commit=commit,git_path=p,git_blob=git('rev-parse',f'{commit}:{p}').decode().strip(),sha256=hashlib.sha256(b).hexdigest(),snapshot=str(OUT/name)))
    for r in decode(b):
        if r['id'] in t1c: raise ValueError(r['id'])
        t1c[r['id']]=r
variants={
 'off_base':load('model_test_v4/try1/results/raw/scored/*qwen3-4b_t0*/llm_judge/v4-try1-n200/paths.jsonl'),
 'off_t1':load('prompts_test_v1/try1/results/raw/scored/*/llm_judge/pv1-try1/paths.jsonl'),
 'off_t1b':load('prompts_test_v2/try1/results/raw/scored/*/llm_judge/pv2-try1/paths.jsonl'),
 'off_t1c':t1c,
 'instruct_base':load('model_test_v5/try1/results/raw/scored/*qwen3-4b-instruct_t0*/llm_judge/v5-try1-n100/paths.jsonl'),
}
def stat(v,ids):
    rs=[v[i] for i in sorted(ids)]
    n=len(rs)
    return dict(n=n,correct=sum(r['correct'] for r in rs),hallucination=sum(r['flags']['hallucinated'] for r in rs),
                asks=sum(r.get('asks_user',False) for r in rs),strict=sum(r.get('strict_ok',False) for r in rs),
                missing_citation=sum(r.get('body_answered_without_citation',False) for r in rs),
                status_body_agree=sum(r.get('status_body_agree',False) for r in rs),
                expected_status_match=sum(r.get('status_label_ok',False) for r in rs),
                by_item={t:dict(n=sum(r['item']==t for r in rs),correct=sum(r['correct'] for r in rs if r['item']==t),
                               hallucination=sum(r['flags']['hallucinated'] for r in rs if r['item']==t)) for t in sorted({r['item'] for r in rs})})
def pval(b,c):
    n=b+c
    return min(1,2*sum(math.comb(n,i) for i in range(min(b,c)+1))/2**n) if n else 1
def pair(a,b,ids,fn):
    gain=[i for i in sorted(ids) if fn(b[i]) and not fn(a[i])]
    loss=[i for i in sorted(ids) if fn(a[i]) and not fn(b[i])]
    return dict(n=len(ids),gain=len(gain),loss=len(loss),p=pval(len(gain),len(loss)),gain_ids=gain,loss_ids=loss)
common=set.intersection(*(set(v) for v in variants.values()))
cohorts={
 'all_five_common':dict(ids=sorted(common),stats={k:stat(v,common) for k,v in variants.items()}),
 'regular_300_PI_HR_SR':dict(ids=sorted(i for i in t1c if t1c[i]['item'] in ['PI','HR','SR']),stats={}),
}
ids=set(t1c)&set(variants['instruct_base'])
cohorts['same_405_three_versions']=dict(ids=sorted(ids),stats={k:stat(variants[k],ids) for k in ['off_t1','off_t1c','instruct_base']})
ids={i for i,r in variants['off_t1'].items() if r['item'] not in ['NC','MC']}&set(variants['instruct_base'])
cohorts['regular_900_t1_vs_instruct']=dict(ids=sorted(ids),stats={k:stat(variants[k],ids) for k in ['off_t1','instruct_base']})
ids=set(cohorts['regular_300_PI_HR_SR']['ids'])
for k,v in variants.items():cohorts['regular_300_PI_HR_SR']['stats'][k]=stat(v,ids&set(v))
comparisons={}
for k in ['off_t1','off_t1b','off_t1c']:
    a,b=variants[k],variants['instruct_base'];ids=set(a)&set(b)
    comparisons[k+'__instruct_base']=dict(ids=sorted(ids),before=stat(a,ids),after=stat(b,ids),
      correct=pair(a,b,ids,lambda r:r['correct']),no_hallucination=pair(a,b,ids,lambda r:not r['flags']['hallucinated']),
      expected_label_differences=[i for i in ids if a[i]['expected_status']!=b[i]['expected_status']])
for cohort,key in [('regular_900_t1_vs_instruct','off_t1'),('regular_300_PI_HR_SR','off_t1c'),('same_405_three_versions','off_t1')]:
    a,b=variants[key],variants['instruct_base'];ids=set(cohorts[cohort]['ids'])&set(a)&set(b)
    comparisons[cohort]=dict(ids=sorted(ids),before=stat(a,ids),after=stat(b,ids),
        correct=pair(a,b,ids,lambda r:r['correct']),no_hallucination=pair(a,b,ids,lambda r:not r['flags']['hallucinated']))
selection={}
for k in ['off_base','off_t1','off_t1b']:
    ids=set(variants[k])&set(t1c)
    selection[k+'__off_t1c']=dict(before=stat(variants[k],ids),after=stat(t1c,ids),
      correct=pair(variants[k],t1c,ids,lambda r:r['correct']),
      no_hallucination=pair(variants[k],t1c,ids,lambda r:not r['flags']['hallucinated']))
full_ids={i for i,r in variants['instruct_base'].items() if r['item']!='RT'}
assert len(full_ids)==1300 and full_ids<=set(variants['off_base'])
counterfactual={}
for name,replace_ids in [
    ('measured_405_replace',full_ids&set(t1c)),
    ('regular_300_replace',{i for i in full_ids&set(t1c) if t1c[i]['item'] in ['PI','HR','SR']})]:
    hybrid={i:(t1c[i] if i in replace_ids else variants['off_base'][i]) for i in full_ids}
    counterfactual[name]=dict(
        n=len(full_ids),replaced=len(replace_ids),unchanged=len(full_ids-replace_ids),
        baseline=stat(variants['off_base'],full_ids),hypothetical=stat(hybrid,full_ids),
        instruct=stat(variants['instruct_base'],full_ids),
        replaced_baseline=stat(variants['off_base'],replace_ids),replaced_t1c=stat(t1c,replace_ids),
        replacement_ids=sorted(replace_ids),unchanged_ids=sorted(full_ids-replace_ids),
        note='Synthetic result under the explicit assumption that every unmeasured case retains the untuned OFF outcome. Not an observed full t1c run or a causal prediction. No extrapolation of the NC/MC focus-set rates.')
result=dict(git_commit=commit,cohorts=cohorts,comparisons=comparisons,off_selection=selection,counterfactual=counterfactual,
 limitations=['t1c is the last OFF version, not uniformly best: accuracy and hallucination trade off.',
 'NC/MC focus lists intentionally oversample OFF baseline errors; mixed overall rates are matched-cohort diagnostics, not representative full-suite accuracy.',
 'OFF tuning ran on local RTX4060Ti/Ollama0.35.1, initial Instruct on EC2 T4/Ollama0.34.2; output key order differs.',
 'Tuning versions have different evaluated coverage; do not combine per-item best variants into a fictitious single prompt.',
 'Exact McNemar p values are exploratory without multiplicity correction.'])
(OUT/'off_tuned_vs_instruct.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'off_tuned_vs_instruct_sources.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
for k,c in cohorts.items():
    print('COHORT',k)
    for name,s in c['stats'].items():print(name,{kk:vv for kk,vv in s.items() if kk!='by_item'})
for k,c in comparisons.items():
    print('PAIR',k)
    for side in ['before','after']:print(side,{kk:vv for kk,vv in c[side].items() if kk!='by_item'})
    for name in ['correct','no_hallucination']:print(name,{kk:vv for kk,vv in c[name].items() if not kk.endswith('_ids')})
    print('by_item',json.dumps({'before':c['before']['by_item'],'after':c['after']['by_item']},ensure_ascii=False))
print('OFF SELECTION')
for k,c in selection.items():print(k,c['before']['n'],c['before']['correct'],c['after']['correct'],c['before']['hallucination'],c['after']['hallucination'],c['correct']['p'])
print('COUNTERFACTUAL')
for k,c in counterfactual.items():
    print(k,'replaced',c['replaced'],'unchanged',c['unchanged'])
    for variant in ['baseline','hypothetical','instruct','replaced_baseline','replaced_t1c']:
        d=c[variant];print(variant,'n',d['n'],'correct',d['correct'],f"{d['correct']/d['n']*100:.4f}%",'hallucination',d['hallucination'],f"{d['hallucination']/d['n']*100:.4f}%")
