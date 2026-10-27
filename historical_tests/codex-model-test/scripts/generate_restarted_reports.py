import json
import os
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "results", "raw", "llm_answer_generation.jsonl")
OUT = os.path.join(ROOT, "results")
PARTS = [os.path.join(ROOT, "results", "raw", "llm_answer_judgement_manual.jsonl")]
NAMES = {"T01":"쉬운_답변_생성", "T02":"중간_답변_생성", "T03":"어려운_답변_생성", "T04":"무관_FAQ_대응", "T05":"빈_Context_대응", "T06":"모순_FAQ_대응", "T07":"부분_정보_대응", "T08":"유사하지만_답변_없음", "T09":"정답_FAQ_노이즈", "T10":"다중_FAQ_조합"}
RAG_CHECKS = {
    "T04": ["무관성 인식", "답변 보류", "환각 없음", "표현 자연스러움", "형식"],
    "T05": ["근거 부재 인식", "미확인 정보 보류", "환각 없음", "표현 자연스러움", "형식"],
    "T06": ["충돌 감지·불확실성 안내", "임의 선택 없음", "환각 없음", "표현 자연스러움", "형식"],
    "T07": ["확인 가능 정보만 답변", "미확인 정보 표시", "환각 없음", "표현 자연스러움", "형식"],
    "T08": ["유사 FAQ 오용 없음", "답변 보류", "환각 없음", "표현 자연스러움", "형식"],
    "T09": ["정답 FAQ 식별·노이즈 배제", "처리 의도 준수", "환각 없음", "표현 자연스러움", "형식"],
    "T10": ["필요 FAQ 모두 사용", "질문 요소·순서 준수", "환각 없음", "표현 자연스러움", "형식"],
}

def esc(v): return str(v or "").replace("|", "\\|").replace("\r", "").replace("\n", "<br>")
def answer(r): return (r.get("parsed") or {}).get("answer", r.get("raw_output", ""))
def expected_action(case):
    if case.get("expected_behavior"):
        return case["expected_behavior"]
    ref = case.get("primary_gt") or case.get("expected_ref")
    intent = str(case.get("intent", ""))
    if ref and ref not in ("None", "UNKNOWN", "미상", "불명"):
        return f"{ref} 기반으로 답변"
    if intent == "UNREGISTERED":
        return "정보 제공 안 함"
    return "질문 의도에 맞는 FAQ 근거로 답변"
def ratio(n, d): return f"{n}/{d}" if d else "-"
def mb(n): return f"{n / 1024 / 1024:.0f}" if n is not None else "-"

records = [json.loads(x) for x in open(RAW, encoding="utf-8") if x.strip()]
judgements = {}
for p in PARTS:
    if os.path.exists(p):
        for x in open(p, encoding="utf-8"):
            if x.strip():
                row = json.loads(x)
                for e in row.get("evaluations", []): judgements[(row["test"], row["case_id"], e["model"])] = e

for test, filename in NAMES.items():
    rows = [r for r in records if r["test"] == test]
    if not rows: continue
    models = sorted({r["model"] for r in rows})
    cases = sorted({r["case"]["id"]: r["case"] for r in rows}.items())
    path = os.path.join(OUT, f"{test}_{filename}.md")
    with open(path, "w", encoding="utf-8", newline="\n") as out:
        out.write(f"# {test} {filename.replace('_', ' ')}\n\n")
        out.write(f"- 테스트 케이스: {len(cases)}개\n- 모델: {len(models)}개\n- 전체 답변: {len(rows)}개\n\n")
        out.write("## 평가 기준\n\n")
        if test in RAG_CHECKS:
            out.write("RAG 안정성은 유형별 기대 행동과 실패 조건을 기준으로 판정합니다. FAQ에 없는 내용을 생성하면 모든 유형에서 `환각 없음=NO`입니다.\n\n")
            out.write("| 유형별 검증항목 | 판정 기준 |\n|---|---|\n")
            for check in RAG_CHECKS[test]: out.write(f"| {check} | 케이스의 기대 행동·실패 조건에 따라 YES/NO 판정 |\n")
        else:
            out.write("| 기준 | YES 기준 | NO 기준 |\n|---|---|---|\n| 정확성 | FAQ 핵심 사실과 결론이 일치 | 핵심 결론 오류 |\n| 완전성 | 필수 정보가 모두 포함 | 필수 정보 누락 |\n| 표현 자연스러움 | 자연스러운 상담 문장 | 부자연스럽거나 불명확함 |\n| 환각 없음 | FAQ에 없는 내용을 추가하지 않음 | FAQ 밖의 내용을 생성 |\n| 형식 | 요구 JSON 구조를 지킴 | JSON·필드·출력 형식 오류 |\n")
        out.write("\n## 실행 자원 및 모델 요약\n\n")
        out.write("RAM/VRAM은 Ollama `/api/ps`의 모델 로드 정보에서 기록했습니다. 단위는 MB이며, 수치는 실행 중 관측된 최대값입니다.\n\n")
        out.write("| 모델 | 정확성/기대행동 | 완전성 | 자연스러움 | 환각 없음 | 형식 | 평균 응답(ms) | 최대 RAM(MB) | 최대 VRAM(MB) |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|\n")
        for model in models:
            rs = [r for r in rows if r["model"] == model]; total = len(rs)
            es = [judgements.get((test, r["case"]["id"], model), {}) for r in rs]
            def count(k): return ratio(sum(int(bool(e.get(k))) for e in es), total)
            lat = [r.get("latency_ms", 0) for r in rs]; avg = round(sum(lat)/len(lat)) if lat else "-"
            res = [r.get("resource_after") or {} for r in rs]
            ram = max([x.get("ram_bytes", 0) for x in res] or [0]); vram = max([x.get("size_vram_bytes", 0) for x in res] or [0])
            out.write(f"| {esc(model)} | {count('accuracy')} | {count('completeness')} | {count('naturalness')} | {count('hallucination_free')} | {count('format')} | {avg} | {mb(ram)} | {mb(vram)} |\n")
        out.write("\n## 질문·답변 및 질문별 평가\n\n")
        for model in models:
            rs = sorted([r for r in rows if r["model"] == model], key=lambda r: r["case"]["id"])
            if test in RAG_CHECKS:
                cols = RAG_CHECKS[test]
                keys = ["accuracy", "completeness", "hallucination_free", "naturalness", "format"]
            else:
                cols = ["정확성", "완전성", "자연스러움", "환각 없음", "형식"]
                keys = ["accuracy", "completeness", "naturalness", "hallucination_free", "format"]
            out.write(f"### {esc(model)}\n\n<details>\n<summary>질문·답변 열기</summary>\n\n| 케이스 | 질문 | 기대 동작 | 모델 답변 | " + " | ".join(cols) + " |\n|---|---|---|---|" + "---|" * len(cols) + "\n")
            for r in rs:
                e = judgements.get((test, r["case"]["id"], model), {})
                vals = ["YES" if e.get(k) else "NO" for k in keys]
                out.write(f"| {r['case']['id']} | {esc(r['case'].get('query'))} | {esc(expected_action(r['case']))} | {esc(answer(r))} | {' | '.join(vals)} |\n")
            out.write("\n</details>\n\n")
            out.write("\n")
    print(f"saved={path}")
