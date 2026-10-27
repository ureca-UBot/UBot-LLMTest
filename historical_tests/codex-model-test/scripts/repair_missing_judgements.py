import json
import os
import urllib.request
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_PATH = os.path.join(ROOT, "results", "raw", "llm_answer_generation.jsonl")
JUDGEMENT_PATH = os.path.join(ROOT, "results", "raw", "llm_answer_judgement.jsonl")
PART = int(os.environ.get("JUDGE_PART", "0"))
PARTS = int(os.environ.get("JUDGE_PARTS", "1"))
OUT_PATH = os.path.join(ROOT, "results", "raw", f"llm_answer_repair_part{PART}.jsonl")

SYSTEM = """Evaluate every model answer in the case. Compare the question and FAQ Context.
Return only JSON in this exact shape: {\"evaluations\":[{\"model\":\"exact model name\",\"accuracy\":1,\"completeness\":1,\"relevance\":1,\"grounding\":1,\"naturalness\":1,\"problem\":false,\"issue\":\"\"}]}.
Use 0 for a failed criterion and 1 for a passed criterion. Set problem true for hallucination, unsupported facts, irrelevant content, wrong combination, unsafe certainty, empty answer, or invalid format. Include all models exactly once. Keep issue short in Korean.
"""

def call(payload):
    req = urllib.request.Request("http://127.0.0.1:11434/api/chat", data=json.dumps(payload, ensure_ascii=False).encode("utf-8"), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=600) as res: return json.loads(res.read().decode("utf-8"))

def parse(text):
    try: return json.loads(text)
    except Exception:
        a, b = text.find("{"), text.rfind("}")
        if a >= 0 and b > a:
            try: return json.loads(text[a:b+1])
            except Exception: return {}
    return {}

def main():
    raw = [json.loads(x) for x in open(RAW_PATH, encoding="utf-8") if x.strip()]
    grouped = defaultdict(list)
    for row in raw: grouped[(row["test"], row["case"]["id"])].append(row)
    old = {(r["test"], r["case_id"]): r for r in (json.loads(x) for x in open(JUDGEMENT_PATH, encoding="utf-8") if x.strip())}
    missing = [(key, items) for key, items in sorted(grouped.items()) if any(e.get("issue") == "평가 결과 누락" for e in old.get(key, {}).get("evaluations", []))]
    missing = missing[PART::PARTS]
    out = open(OUT_PATH, "w", encoding="utf-8")
    for index, ((test, case_id), items) in enumerate(missing, 1):
        case = items[0]["case"]
        user = {"test": test, "case_id": case_id, "question": case.get("query", ""), "faq_context": case.get("context", ""), "answers": [{"model": r["model"], "answer": (r.get("parsed") or {}).get("answer", r.get("raw_output", "")), "format_valid": r.get("format_valid", False)} for r in items]}
        try:
            response = call({"model": "qwen3:1.7b", "messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": json.dumps(user, ensure_ascii=False)}], "format": "json", "stream": False, "think": False, "options": {"temperature": 0, "num_predict": 8192}})
            parsed = parse(response.get("message", {}).get("content", ""))
            evaluations = parsed.get("evaluations", [])
            by_model = {e.get("model"): e for e in evaluations if isinstance(e, dict)}
            normalized = []
            for r in items:
                e = by_model.get(r["model"])
                if e is None:
                    normalized.append({"model": r["model"], "unreviewed": True, "issue": "평가 불가"})
                else:
                    normalized.append({"model": r["model"], "accuracy": int(bool(e.get("accuracy"))), "completeness": int(bool(e.get("completeness"))), "relevance": int(bool(e.get("relevance"))), "grounding": int(bool(e.get("grounding"))), "naturalness": int(bool(e.get("naturalness"))), "problem": bool(e.get("problem")), "issue": str(e.get("issue", ""))})
        except Exception:
            normalized = [{"model": r["model"], "unreviewed": True, "issue": "평가 불가"} for r in items]
        out.write(json.dumps({"test": test, "case_id": case_id, "evaluations": normalized}, ensure_ascii=False) + "\n"); out.flush()
        if index % 10 == 0: print(f"repaired={index}/{len(missing)}")
    out.close(); print(f"saved={OUT_PATH} cases={len(missing)}")

if __name__ == "__main__": main()
