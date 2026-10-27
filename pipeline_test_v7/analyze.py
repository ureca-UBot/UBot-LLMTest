"""pipeline_test_v7: v6(스키마 미강제) vs always vs on-broken 비교 집계. 같은 172문항, Judge pipeline-judge-2."""
import glob
import json
import math
import re
import statistics
import sys
from collections import Counter

ROOT = 'C:/Ureka/ureca_project2/LLM_Test'
RUNS = {
    'v6(기준)': ('pipeline_test_v6/try1/results/raw/*n172*/results.jsonl',
                 'pipeline_test_v6/try1/results/llm_judge/pv6-lines-try1/*.judgments.jsonl'),
    'always': ('pipeline_test_v7/try1/results/raw/*always_n172*/results.jsonl',
               'pipeline_test_v7/try1/results/llm_judge/pv7-always-try1/*.judgments.jsonl'),
    'on-broken': ('pipeline_test_v7/try1/results/raw/*onbroken_n172*/results.jsonl',
                  'pipeline_test_v7/try1/results/llm_judge/pv7-onbroken-try1/*.judgments.jsonl'),
}
CODE_BLOCK = re.compile(r'(?s)^```(?:json)?\s*(.*?)\s*```$')


def load(pattern):
    files = glob.glob(f'{ROOT}/{pattern}')
    if not files:
        return None
    return [json.loads(line) for line in open(files[0], encoding='utf-8')]


def fmt(answer_llm):
    raw = (answer_llm.get('raw') or '').strip()
    match = CODE_BLOCK.match(raw)
    if match:
        raw = match.group(1).strip()
    if not raw.startswith('{'):
        return 'broken'
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return 'broken'
    answers = parsed.get('answers')
    if not isinstance(answers, list):
        return 'broken'
    expected = len(answer_llm.get('prompt_sub_questions') or []) or 1
    return 'ok' if len(answers) == expected else 'mismatch'


def traces(row):
    return [t for t in [row.get('trace')] + (row.get('turn_traces') or []) if isinstance(t, dict)]


def mcnemar(b, c):
    n = b + c
    if n == 0:
        return 1.0
    k = min(b, c)
    p = sum(math.comb(n, i) for i in range(k + 1)) / 2 ** n
    return min(1.0, 2 * p)


data = {}
for name, (raw_pattern, judge_pattern) in RUNS.items():
    rows = load(raw_pattern)
    judged = load(judge_pattern)
    if rows is None:
        print(f'[{name}] 결과 없음')
        continue
    judgments = {j['id']: j for j in (judged or []) if j.get('error') is None}
    data[name] = (rows, judgments)

print('## 실행·형식·호출')
for name, (rows, judgments) in data.items():
    counter = Counter()
    elapsed = []
    for row in rows:
        final = row.get('trace') or {}
        if final.get('elapsed_ms') is not None and final.get('answer_llm'):
            elapsed.append(final['elapsed_ms'])
        for trace in traces(row):
            answer_llm = trace.get('answer_llm')
            if not answer_llm:
                continue
            counter['answer_calls'] += 1
            if not answer_llm.get('tools'):
                continue
            counter['tool_path'] += 1
            called = bool(trace.get('tool_calls'))
            counter['tool_called' if called else 'tool_not_called'] += 1
            counter['fmt_' + fmt(answer_llm)] += 1
            final_schema = answer_llm.get('final_schema') or {}
            if final_schema.get('recalled'):
                counter['recalled'] += 1
                counter['recalled_' + ('called' if called else 'not_called')] += 1
            if final_schema.get('draft_violation'):
                counter['draft_broken'] += 1
    paths = Counter(row.get('response', {}).get('final', {}).get('status') for row in rows)
    print(f"[{name}] 문항 {len(rows)} · Judge {len(judgments)} · 작업상태 {dict(paths)}")
    print(f"  답변 LLM 호출(턴) {counter['answer_calls']} · 도구 경로 {counter['tool_path']}"
          f" (호출 {counter['tool_called']} / 안 부름 {counter['tool_not_called']})")
    print(f"  최종 형식: 정상 {counter['fmt_ok']} · 칸수불일치 {counter['fmt_mismatch']} · 깨짐 {counter['fmt_broken']}")
    if counter['recalled'] or counter['draft_broken']:
        print(f"  스키마 재호출 {counter['recalled']} (도구호출 {counter['recalled_called']} / 안 부름 {counter['recalled_not_called']})"
              f" · 초안 위반 {counter['draft_broken']}")
    if elapsed:
        print(f"  마지막 턴 처리시간 평균 {statistics.mean(elapsed):.0f}ms · 중앙값 {statistics.median(elapsed):.0f}ms")

print('\n## Judge (같은 문항 공통 분모)')
common = set.intersection(*(set(j) for _, j in data.values())) if data else set()
print(f'공통 판정 문항 {len(common)}')
for name, (rows, judgments) in data.items():
    js = [judgments[i] for i in common]
    n = len(js) or 1
    correct = sum(j['accuracy'] == 'CORRECT' for j in js)
    halluc = sum(j['is_grounded'] is False for j in js)
    notice = sum(bool(j.get('decline_notice')) for j in js)
    ask = sum(bool(j.get('asks_user')) for j in js)
    print(f"[{name}] 정답 {correct} ({correct / n:.1%}) · 환각 {halluc} ({halluc / n:.1%}) · 고지 {notice} · 되묻기 {ask}")

base_name = 'v6(기준)'
if base_name in data:
    base = data[base_name][1]
    for name, (rows, judgments) in data.items():
        if name == base_name:
            continue
        ids = sorted(set(base) & set(judgments))
        for label, good in (('정답', lambda j: j['accuracy'] == 'CORRECT'), ('환각없음', lambda j: j['is_grounded'] is not False)):
            gain = sum(good(judgments[i]) and not good(base[i]) for i in ids)
            loss = sum(good(base[i]) and not good(judgments[i]) for i in ids)
            print(f"  {name} vs v6 {label}: 새로 좋아짐 {gain} / 나빠짐 {loss} (McNemar p={mcnemar(gain, loss):.3f}, n={len(ids)})")

if len(sys.argv) > 1 and sys.argv[1] == '--cases':
    for name, (rows, judgments) in data.items():
        print(f'\n### {name} 환각 문항')
        for row in rows:
            j = judgments.get(row['id'])
            if j and j['is_grounded'] is False:
                claims = ' / '.join(c if isinstance(c, str) else json.dumps(c, ensure_ascii=False)
                                    for c in j.get('hallucinated_claims') or [])
                print(f"  {row['id']} g{j['grounding_score']} {claims[:120]}")
