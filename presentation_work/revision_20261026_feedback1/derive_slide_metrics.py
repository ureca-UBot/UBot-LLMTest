"""Read saved outputs only; no model or API execution."""
from pathlib import Path
import json,re,hashlib,itertools,math
ROOT=Path(r'C:\Ureka\ureca_project2\LLM_Test')
OUT=ROOT/'presentation_work/revision_20261026'
sources=[]
def readjson(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def rows(p):
 p=Path(p);b=p.read_bytes();sources.append(dict(path=str(p),sha256=hashlib.sha256(b).hexdigest()))
 return {r['id']:r for r in map(json.loads,b.decode('utf-8-sig').splitlines())}
def one(pat):
 p=list(ROOT.glob(pat));assert len(p)==1,(pat,len(p));return p[0]
M={}
M['OFF']=rows(one('model_test_v4/try1/results/raw/scored/*qwen3-4b_t0*n100*/llm_judge/v4-try1-n100/paths.jsonl'))
M['Gemma_Q4']=rows(one('model_test_v4/try1/results/raw/scored/*gemma3-4b_t0*n100*/llm_judge/v4-try1-n100/paths.jsonl'))
M['OFF_t1c']={**rows(ROOT/'presentation_work/evidence_20261026/off_t1c_regular_paths.jsonl'),**rows(ROOT/'presentation_work/evidence_20261026/off_t1c_focus_paths.jsonl')}
for name,pat in [('Instruct_Q4','*qwen3-4b-instruct_t0*'),('Instruct_Q8','*qwen3-4b-instruct-2507-q8_0*'),('Gemma_QAT','*gemma3-4b-it-qat*')]:
 M[name]=rows(one('model_test_v5/try1/results/raw/scored/'+pat+'/llm_judge/v5-try1-n100/paths.jsonl'))
ids=set.intersection(*(set(v) for v in M.values()))
models={k:dict(n=len(ids),correct=sum(v[i]['correct'] for i in ids),hallucination=sum(v[i]['flags']['hallucinated'] for i in ids)) for k,v in M.items()}

DOC_ID=re.compile(r'FAQ\s?-?\s?\d+|TEST-[A-Z]{2}-\d{4}(?:-[A-Z])?|FAQ\s?ID')
DECLINE=re.compile(r'확인할\s?수\s?없|확인이\s?(?:어렵|불가)|확인해\s?드리기\s?어렵|안내(?:해)?\s?드리기\s?어렵|답변(?:을)?\s?(?:드리기|해\s?드리기)\s?어렵|(?:답할|답변할|답변드릴|안내할|안내드릴)\s?수\s?없|제공(?:되지|하지)\s?않|(?:자료|정보|안내|FAQ)(?:에|에는|에서|에서는)\s?(?:없|포함되어\s?있지\s?않|나와\s?있지\s?않)|포함되어\s?있지\s?않|알\s?수\s?없|확정(?:할|하기)\s?(?:수\s?없|어렵)|정보가\s?없|범위\s?밖|명시되어\s?있지\s?않|언급되어\s?있지\s?않')
def sentence(s):return [x.strip() for x in re.split(r'(?<=[.!?])\s+',s or '') if x.strip()]
def repeated_decline(s):return sum(bool(DECLINE.search(x)) for x in sentence(s))>=2
def grams(s):
 s=re.sub(r'\s+','',s);return {s[i:i+2] for i in range(len(s)-1)}
def repeat_statement(s):
 ss=sentence(s)
 for a,b in itertools.combinations(ss,2):
  ga,gb=grams(a),grams(b)
  if min(len(ga),len(gb))>=12 and len(ga&gb)/min(len(ga),len(gb))>=.6:return True
 return False
pipe={};raw={};scored={}
patterns={'single':'pipeline_test_v1/try1/results/raw/*single*/results.jsonl','sub':'pipeline_test_v4/try2/results/raw/*_sub_*/results.jsonl','slot':'pipeline_test_v4/try2/results/raw/*slot*/results.jsonl'}
for key,pat in patterns.items():
 p=one(pat);raw[key]=rows(p);sp=p.parent.parent/'scored'/p.parent.name/'case_scores.jsonl';scored[key]=rows(sp)
 def body(r):return ((r.get('trace') or {}).get('answer_llm') or {}).get('answer') or ''
 def final(r):return ((r.get('trace') or {}).get('outcome') or {}).get('answer') or ''
 def stats(ids):
  rs=[raw[key][i] for i in ids]
  return dict(n=len(ids),model_id_mentions=sum(bool(DOC_ID.search(body(r))) for r in rs),final_id_mentions=sum(bool(DOC_ID.search(final(r))) for r in rs),
   model_repeated_decline=sum(len((scored[key][i].get('leak') or {}).get('notice_sentences',[]))>=2 for i in ids),final_repeated_decline=sum(repeated_decline(final(r)) for r in rs),
   model_sentence_overlap=sum(repeat_statement(body(r)) for r in rs),final_sentence_overlap=sum(repeat_statement(final(r)) for r in rs),
   model_empty=sum(not body(r) for r in rs),planner_called=sum(bool((scored[key][i].get('planner') or {}).get('judge_called')) for i in ids),
   correct=sum((scored[key][i].get('judge') or {}).get('accuracy')=='CORRECT' for i in ids),hallucination=sum((scored[key][i].get('judge') or {}).get('is_grounded') is False for i in ids))
 pipe[key]=dict(source=str(p),all=stats(set(raw[key])))
common={i for i in set.intersection(*(set(v) for v in scored.values())) if all(scored[k][i].get('judge') for k in scored)}
for key in patterns:
 rs=[raw[key][i] for i in common]
 def body(r):return ((r.get('trace') or {}).get('answer_llm') or {}).get('answer') or ''
 pipe[key]['common_three']=dict(n=len(common),correct=sum(scored[key][i]['judge']['accuracy']=='CORRECT' for i in common),hallucination=sum(scored[key][i]['judge']['is_grounded'] is False for i in common),
  id_mentions=sum(bool(DOC_ID.search(body(r))) for r in rs),repeated_decline=sum(len((scored[key][i].get('leak') or {}).get('notice_sentences',[]))>=2 for i in common),sentence_overlap=sum(repeat_statement(body(r)) for r in rs))

MT=readjson(ROOT/'presentation_work/evidence_20261026/multiturn_before_after.json')
P=ROOT.parent/'eval_205_multiturn/docs-evaluation/2026-10-15-keep-search'
analysis={r['id']:r for r in readjson(P/'analysis.json')['rows']}
mt_ids=[r['id'] for r in MT['retrieval_rows'] if r['has_history'] and r['gold']]
gold={r['id']:r['gold'] for r in MT['retrieval_rows']}
old_hit=0
for i in mt_ids:
 found={fid for tops in analysis[i]['oldTop'] for fid,score in tops[:3] if score>=.75}
 old_hit+=all(bool(found&set(g)) for g in gold[i])
data=dict(models_common=models,models_common_ids=sorted(ids),pipeline=pipe,multiturn_41_initial_planner_hits=old_hit,
 notes=['Model comparison uses common IDs, excludes one missing Gemma QAT Judge. Focus NC/MC selection is not a representative overall sample.',
 'New repetition measurements are explicitly labeled sentence-overlap or repeated-decline; they are not the prior four-category 303→234 metric.',
 'All three pipeline modes already use the classifier. single must never be labeled pre-planner or pre-classifier.'],sources=sources)
(OUT/'slide_metrics.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in data.items() if k not in ['sources','models_common_ids']},ensure_ascii=False,indent=2))
