import json,csv,sys,re,glob,os
sys.stdout.reconfigure(encoding='utf-8')
R='C:/Ureka/ureca_project2/LLM_Test/'
V5=R+'model_test_v5/try1/results/'
cases={r['실행 ID']:r for r in csv.DictReader(open(R+'data/eval_sets/test_set4/cases_fixed.csv',encoding='utf-8-sig'))}
faq={r['FAQ ID']:r for r in csv.DictReader(open(R+'data/eval_sets/test_set4/faq_master.csv',encoding='utf-8-sig'))}
MODELS={'q4':'ec2-linux_qwen3-4b-instruct_t0_nothink_fixed_n100_20261007','q8':'ec2-linux_qwen3-4b-instruct-2507-q8_0_t0_nothink_fixed_n100_20261007','qat':'ec2-linux_gemma3-4b-it-qat_t0_nothink_fixed_n100_20261007'}
gen={}
for k,run in MODELS.items():
    for l in open(V5+'raw/'+run+'/generation.jsonl',encoding='utf-8'):
        d=json.loads(l); gen[(k,d['id'])]=d
judge={}
inv={v:k for k,v in MODELS.items()}
def load_calls(path,store,runmap):
    for l in open(path,encoding='utf-8'):
        d=json.loads(l)
        if d.get('error') or d['run_id'] not in runmap: continue
        txt=None
        for e in d['events']:
            it=e.get('item') or {}
            if it.get('type')=='agent_message': txt=it['text']
        if not txt: continue
        try: store[(runmap[d['run_id']],d['id'])]=json.loads(txt)
        except: pass
load_calls(V5+'llm_judge/runs/v5-try1-n100/calls/accuracy.calls.jsonl',judge,inv)
def ans(k,i):
    g=gen.get((k,i)); return (g['parsed'] or {}) if g else {}
def verdict(k,i):
    j=judge.get((k,i)); return j['accuracy']['verdict'] if j else None
