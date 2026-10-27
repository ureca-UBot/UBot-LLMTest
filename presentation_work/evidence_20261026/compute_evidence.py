"""Read-only reaggregation of saved results. Never calls models or edits source data."""
from pathlib import Path
import json, math, hashlib, statistics
from collections import Counter

ROOT=Path(r'C:\Ureka\ureca_project2\LLM_Test')
OUT=ROOT/'presentation_work/evidence_20261026'
OUT.mkdir(exist_ok=True)
SOURCES=set()

def read(p):
    p=Path(p);SOURCES.add(p)
    return json.loads(p.read_text(encoding='utf-8-sig'))

def rows(p):
    p=Path(p);SOURCES.add(p)
    return [json.loads(s) for s in p.read_text(encoding='utf-8-sig').splitlines() if s.strip()]

def one(pattern):
    paths=list(ROOT.glob(pattern))
    if len(paths)!=1:raise ValueError((pattern,len(paths)))
    return paths[0]

def exact_p(b,c):
    n=b+c
    return min(1.,2*sum(math.comb(n,i) for i in range(min(b,c)+1))/2**n) if n else 1.

def pair(a,b,fn,ids=None):
    ids=sorted(set(a)&set(b)) if ids is None else sorted(ids)
    aok={i:bool(fn(a[i])) for i in ids};bok={i:bool(fn(b[i])) for i in ids}
    gain=[i for i in ids if bok[i] and not aok[i]]
    loss=[i for i in ids if aok[i] and not bok[i]]
    av=sum(aok.values());bv=sum(bok.values());n=len(ids)
    return dict(n=n,before=av,after=bv,before_pct=av/n*100 if n else None,after_pct=bv/n*100 if n else None,
                delta_pp=(bv-av)/n*100 if n else None,gain=len(gain),loss=len(loss),p=exact_p(len(gain),len(loss)),
                gain_ids=gain,loss_ids=loss)

def pipeline_stats(rs):
    js=[r['judge'] for r in rs if r.get('judge')]
    return dict(n=len(rs),judge_n=len(js),correct=sum(j['accuracy']=='CORRECT' for j in js),
                hallucination=sum(j['is_grounded'] is False for j in js),
                judge_notice=sum(bool(j['decline_notice']) for j in js),judge_asks=sum(bool(j['asks_user']) for j in js),
                pattern_leak=sum(bool((r.get('leak') or {}).get('any')) for r in rs),
                status_match=sum(r['status_match'] for r in rs),errors=sum(r['exec_error'] for r in rs),
                paths=dict(Counter(r['path'] for r in rs)),
                planner_called=sum(bool((r.get('planner') or {}).get('judge_called')) for r in rs),
                planner_sources=dict(Counter((r.get('planner') or {}).get('source') for r in rs)),
                latency_mean_ms=statistics.mean(r['latency_ms'] for r in rs if r.get('latency_ms') is not None))

PIPE_GLOBS={
 'single_v1':'pipeline_test_v1/try1/results/raw/scored/*single*/case_scores.jsonl',
 'sub_v1':'pipeline_test_v1/try1/results/raw/scored/*_sub_*/case_scores.jsonl',
 'subp_v1':'pipeline_test_v1/try1/results/raw/scored/*subp*/case_scores.jsonl',
 'sub_v4':'pipeline_test_v4/try2/results/raw/scored/*_sub_*/case_scores.jsonl',
 'slot_v4':'pipeline_test_v4/try2/results/raw/scored/*slot*/case_scores.jsonl'}
pipeline={}; pr={}
for k,g in PIPE_GLOBS.items():
    p=one(g);rs=rows(p);pr[k]={r['id']:r for r in rs}
    if len(pr[k])!=390:raise ValueError((k,'duplicate or missing case'))
    pipeline[k]=dict(source=str(p),overall=pipeline_stats(rs),by_type={t:pipeline_stats([r for r in rs if r['type']==t]) for t in sorted({r['type'] for r in rs})})
comparisons={}
for ak,bk in [('single_v1','sub_v1'),('sub_v4','slot_v4'),('single_v1','slot_v4')]:
    a,b=pr[ak],pr[bk]
    ids={i for i in set(a)&set(b) if a[i].get('judge') and b[i].get('judge')}
    ps={
      'correct':pair(a,b,lambda r:r['judge']['accuracy']=='CORRECT',ids),
      'no_hallucination':pair(a,b,lambda r:r['judge']['is_grounded'] is not False,ids),
      'no_judge_notice':pair(a,b,lambda r:not r['judge']['decline_notice'],ids),
      'status_match':pair(a,b,lambda r:r['status_match']),
      'no_execution_error':pair(a,b,lambda r:not r['exec_error']),
      'no_pattern_leak':pair(a,b,lambda r:not (r.get('leak') or {}).get('any'),ids)}
    ps['expected_label_differences']=[i for i in set(a)&set(b) if any(a[i].get(f)!=b[i].get(f) for f in ['expected_final','expected_final_strict','expected_final_partial','type'])]
    comparisons[f'{ak}__{bk}']=ps

# Score paths normalize the already completed accuracy Judge across prompt variants.
PROMPT_GLOBS={
 'base_local':'prompts_test_v5/try2/results/raw/scored/*n100_20261012_*/llm_judge/pv5-try2/paths.jsonl',
 'i2':'prompts_test_v5/try2/results/raw/scored/*n100_v5_i2_*/llm_judge/pv5-try2/paths.jsonl',
 'i3':'prompts_test_v6/try1/results/raw/scored/*/llm_judge/pv6-try1/paths.jsonl',
 'i4':'prompts_test_v7/try1/results/raw/scored/*/llm_judge/pv7-try1/paths.jsonl',
 'calc_answer':'prompts_test_v8/try2/results/raw/scored/*/llm_judge/pv8-try2/paths.jsonl'}
qr={}; prompt={}
for k,g in PROMPT_GLOBS.items():
    p=one(g);rs=rows(p);qr[k]={r['id']:r for r in rs}
    prompt[k]=dict(source=str(p),n=len(rs),correct=sum(r['correct'] for r in rs),hallucination=sum(r.get('flags',{}).get('hallucinated',False) for r in rs),asks=sum(r.get('asks_user',False) for r in rs))
pc={}
for ak,bk in [('base_local','i4'),('i2','i4'),('i3','i4'),('i4','calc_answer')]:
    a,b=qr[ak],qr[bk]
    pc[f'{ak}__{bk}']={
        'correct':pair(a,b,lambda r:r['correct']),
        'no_hallucination':pair(a,b,lambda r:not r['flags']['hallucinated']),
        'no_asking':pair(a,b,lambda r:not r.get('asks_user',False)),
        'by_item':{t:{'correct':pair(a,b,lambda r:r['correct'],{i for i in set(a)&set(b) if a[i]['item']==t}),
                      'no_hallucination':pair(a,b,lambda r:not r['flags']['hallucinated'],{i for i in set(a)&set(b) if a[i]['item']==t})}
                   for t in sorted({r['item'] for r in b.values()})}}

split_root=ROOT.parent/'eval_205_multiturn/docs-evaluation/2026-10-16-split'
split_data={k:read(split_root/k/'split-analysis.json') for k in ['base','v4','final/split']}
split={k:dict(n=len(rs),expected_intents=sum(len(r['gold']) for r in rs),
             expected_count_match=sum(len(r['search'])==r['expect'] for r in rs),
             old_expected_count_match=sum(len(r['old'])==r['expect'] for r in rs),
             retrieval_hits={name:sum(r['hits'][name] for r in rs) for name in rs[0]['hits']})
       for k,rs in split_data.items()}
final_split={r['id']:r for r in split_data['final/split']}
base_split={r['id']:r for r in split_data['base']}
split['paired_count_only_keep_vs_final']=pair(base_split,final_split,lambda r:len(r['search'])==r['expect'])
split['paired_count_only_old_vs_final']=pair(
    {i:dict(r,search=r['old']) for i,r in final_split.items()},final_split,
    lambda r:len(r['search'])==r['expect'])
split['limitations']='Count matching is not a full semantic split quality metric. Retrieval hits count gold FAQ intents in top 3 above 0.75; clustered intents are not independent samples. Base old retrieval hits=182 vs final old=181: use same-run final values and do not merge historical runs.'

DATA=dict(pipeline=pipeline,pipeline_pairs=comparisons,prompt=prompt,prompt_pairs=pc,split=split,
          note='p values are exploratory two-sided exact McNemar tests without multiplicity adjustment; cross-run confounders must be retained')
(OUT/'recomputed_metrics.json').write_text(json.dumps(DATA,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'metric_sources.json').write_text(json.dumps([dict(path=str(p),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),bytes=p.stat().st_size) for p in sorted(SOURCES)],ensure_ascii=False,indent=2),encoding='utf-8')
print('PIPELINE OVERALL')
for k,v in pipeline.items():print(k,v['overall'])
print('PAIRED METRICS')
for k,v in comparisons.items():
    print(k)
    for m,d in v.items():
        if isinstance(d,dict):print(m,{kk:vv for kk,vv in d.items() if not kk.endswith('_ids')})
print('PROMPT PAIRS')
for k,v in pc.items():
    print(k)
    for m,d in v.items():
        if m!='by_item':print(m,{kk:vv for kk,vv in d.items() if not kk.endswith('_ids')})

