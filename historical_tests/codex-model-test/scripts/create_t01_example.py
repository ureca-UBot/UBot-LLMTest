import json
import os
from collections import defaultdict

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
raw = [json.loads(x) for x in open(os.path.join(root, 'results/raw/llm_answer_generation.jsonl'), encoding='utf-8') if x.strip()]
rows = [r for r in raw if r['test'] == 'T01']
models = sorted({r['model'] for r in rows})
cases = {}
for r in rows:
    cases[r['case']['id']] = r['case']
by = defaultdict(dict)
for r in rows:
    by[r['case']['id']][r['model']] = r

def cell(v):
    return str(v or '').replace('|', '\\|').replace('\n', '<br>').replace('\r', '')

out = []
out += ['# T01 쉬운 답변 생성', '', '> 주의: 아래 품질·환각·문제없음·RAM/VRAM 값은 문서 형태를 확인하기 위한 임시 숫자입니다. 실제 테스트 재실행 후 교체합니다.', '']
out += ['## 1. 테스트 개요', '', '| 항목 | 내용 |', '|---|---|', '| 목적 | 정답 FAQ 1개가 제공된 상황에서 모델이 FAQ 내용을 정확하고 자연스럽게 재구성하는지 검증 |', '| 평가 단위 | 질문 20개 × 모델별 답변 |', '| 입력 | 사용자 질문 + 정답 FAQ Context |', '| 기대 동작 | FAQ의 핵심 답변을 빠짐없이 전달하고, Context에 없는 내용을 추가하지 않음 |', '| 제외/주의 | 검색(임베딩) 성능은 이 문서에서 평가하지 않음. 정답 FAQ가 이미 검색되었다고 가정 |', '']
out += ['## 2. 평가 기준', '', '| 기준 | YES 기준 | NO 기준 |', '|---|---|---|', '| 정확성 | FAQ 핵심 사실과 결론이 일치 | 핵심 결론 오류 또는 다른 FAQ 답변 |', '| 완전성 | 질문에 필요한 필수 정보가 모두 포함 | 필수 정보가 누락 |', '| 표현 자연스러움 | 자연스러운 한국어 상담 문장 | 이해하기 어렵거나 부자연스러움 |', '| 환각 없음 | FAQ에 없는 사실·수치·절차·조건을 전혀 추가하지 않음 | FAQ에 없는 내용을 하나라도 사실처럼 제시 |', '| 형식 | 요구한 JSON 구조와 필드를 지킴 | JSON 파싱 실패 또는 필드·출력 형식 오류 |', '', '모든 평가 기준은 YES/NO로 기록합니다. FAQ에 없는 내용을 만들어내면 항상 `환각 없음=NO`로 처리합니다. 이 문서는 레이아웃 확인용으로 임시값을 사용합니다.', '']
out += ['## 3. 실행 환경 및 자원 측정', '', '| 항목 | 기록 내용 |', '|---|---|', '| 실행일시 | YYYY-MM-DD HH:MM (KST) |', '| OS / CPU | 측정값 기입 |', '| Ollama 버전 | 측정값 기입 |', '| 동시성 | 1회 1모델·1질문 / 동시 요청 수 기입 |', '| 반복 횟수 | 모델·케이스당 반복 횟수 기입 |', '| 프롬프트 토큰 | 모델별 평균 또는 케이스별 기록 |', '| 생성 토큰 | 모델별 평균 또는 케이스별 기록 |', '| 측정 원칙 | 동일 조건에서 워밍업 여부와 측정 구간을 명시 |', '', '### 모델별 RAM / VRAM 측정', '', '측정은 모델을 로드한 뒤 안정화된 상태의 사용량과, 테스트 실행 중 관측된 최대 사용량을 분리합니다. Windows에서는 작업 전후 시스템 메모리와 GPU 전용/공유 메모리를 기록하고, 가능하면 Ollama 프로세스 단위 측정값도 함께 남깁니다.', '', '| 모델 | 모델 파일 크기 | 로드 후 RAM | 로드 후 VRAM | 실행 중 최대 RAM | 실행 중 최대 VRAM | GPU offload / 양자화 | 측정 상태 |', '|---|---:|---:|---:|---:|---:|---|---|']
for m in models:
    out.append(f'| {cell(m)} | 1600 | 4200 | 1800 | 4800 | 2100 | 1 | 1 |')
out += ['', '> 자원 수치는 반드시 같은 PC, 같은 Ollama 설정, 같은 모델 양자화 조건에서 비교합니다. 이 예시에서는 표의 형태를 보여주기 위해 임시값을 사용합니다.', '']
out += ['## 4. 모델별 요약', '', '| 모델 | 정확성 | 완전성 | 자연스러움 | 환각 없음 | 형식 | 평균 응답(ms) | 최대 RAM | 최대 VRAM |', '|---|---|---|---|---|---:|---:|---:|']
for m in models:
    lat = [by[c][m].get('latency_ms') for c in cases if by[c].get(m) and by[c][m].get('latency_ms') is not None]
    avg = round(sum(lat)/len(lat)) if lat else '-'
    out.append(f'| {cell(m)} | 20/20 | 20/20 | 20/20 | 20/20 | 20/20 | {avg} | 4800 | 2100 |')
out += ['', '현재 점수와 자원 수치는 문서 레이아웃 확인을 위한 임시값입니다. 실제 평가를 시작하면 이 위치에 확정 점수와 측정값을 입력합니다.', '']
out += ['## 5. 케이스별 상세 판정', '', '모델명을 열면 먼저 해당 모델의 질문·답변을 확인할 수 있고, 이어서 같은 모델의 질문별 평가표를 볼 수 있습니다. 아래 점수는 문서 모양을 확인하기 위한 임시값입니다.', '']
for m in models:
    out += [f'### {cell(m)}', '', '<details>', '<summary>질문·답변 열기</summary>', '', '| 케이스 | 질문 | 모델 답변 |', '|---|---|---|']
    for cid in sorted(cases):
        c = cases[cid]
        r = by[cid][m]
        a = (r.get('parsed') or {}).get('answer', r.get('raw_output', ''))
        out.append(f'| {cid} | {cell(c.get("query"))} | {cell(a)} |')
    out += ['', '</details>', '', '| 케이스 | 정확성 | 완전성 | 자연스러움 | 환각 없음 | 형식 | 판정 메모 |', '|---|---|---|---|---|---|---|---|']
    for cid in sorted(cases):
        c = cases[cid]
        if cid == 'E01' and m == models[0]:
            scores = 'YES | YES | YES | YES | YES'
            reason = '형식 예시: FAQ 핵심 내용과 일치'
        else:
            scores = 'YES | YES | YES | YES | YES'
            reason = '임시 판정'
        out.append(f'| {cid} | {scores} | {reason} |')
    out += ['']
out += ['## 6. 종합 판정 및 사람 검토', '', '| 항목 | 내용 |', '|---|---|', '| 최고 모델 | 점수·자원·속도·문제없음 종합 후 기입 |', '| 주요 실패 유형 | 누락 정보 / 근거 없는 추가 / FAQ 오인 / 표현 문제 등으로 분류 |', '| 사람 검토 범위 | 전체 케이스 또는 사전 합의한 calibration set 범위 기입 |', '| Judge-사람 불일치 | 케이스 ID, 쟁점, 최종 판정 기록 |', '| 최종 결론 | 실사용 후보 여부와 제한사항 기입 |', '']
path = os.path.join(root, 'results/T01_쉬운_답변_생성.md')
with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write('\n'.join(out))
print(path)
