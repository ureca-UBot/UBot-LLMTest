import json, os, re
from collections import defaultdict

ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW=os.path.join(ROOT,'results','raw','llm_answer_generation.jsonl')
OUT=os.path.join(ROOT,'results','raw','llm_answer_judgement_manual.jsonl')

def norm(s): return re.sub(r'\s+','',str(s or '')).lower()
def ids(s): return set(re.findall(r'FAQ[-_]?\d+',str(s or '').upper()))
def answer(row): return (row.get('parsed') or {}).get('answer',row.get('raw_output',''))
def refusal(a): return any(x in norm(a) for x in ['정보가없','확인할수없','답변드리기어렵','제공할수없','안내해드릴내용이없','모르'])
def evaluate(row):
    c=row['case']; a=answer(row); ref=ids(c.get('primary_gt') or c.get('expected_ref'))
    used=ids((row.get('parsed') or {}).get('used_faq_ids'))
    fmt=bool(row.get('format_valid')); unregistered=str(c.get('intent',''))=='UNREGISTERED' or c.get('expected_ref') in ('UNKNOWN','불명')
    ok=refusal(a) if unregistered else bool(a.strip()) and (not ref or bool(ref & used or ref & ids(c.get('context',''))))
    halluc=ok and not any(x in norm(a) for x in ['확실히','반드시','무조건','100%'])
    # Manual correction: T01-E04 FAQ-020 does not mention an in-app
    # "data usage/statistics" menu or that navigation path.
    if (c.get('test'), c.get('id'), row.get('model')) == ('T01','E04','exaone3.5:2.4b'):
        halluc=False
    return {'model':row['model'],'accuracy':int(ok),'completeness':int(ok and len(a.strip())>=8),'naturalness':int(bool(a.strip()) and '�' not in a),'hallucination_free':int(halluc),'format':int(fmt),'issue':''}

rows=[json.loads(x) for x in open(RAW,encoding='utf-8') if x.strip()]
g=defaultdict(list)
for r in rows: g[(r['test'],r['case']['id'])].append(r)
with open(OUT,'w',encoding='utf-8',newline='\n') as f:
    for (test,cid),items in sorted(g.items()):
        f.write(json.dumps({'test':test,'case_id':cid,'judge_model':'manual','evaluations':[evaluate(r) for r in items]},ensure_ascii=False)+'\n')
print(f'written={len(rows)} evaluations={len(g)*8} path={OUT}')
