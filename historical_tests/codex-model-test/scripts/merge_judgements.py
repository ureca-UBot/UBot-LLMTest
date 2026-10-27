import glob
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out_path = os.path.join(ROOT, "results", "raw", "llm_answer_judgement.jsonl")
parts = sorted(glob.glob(os.path.join(ROOT, "results", "raw", "llm_answer_judgement_part*.jsonl")))
rows = []
for path in parts:
    with open(path, encoding="utf-8") as f:
        rows.extend(json.loads(line) for line in f if line.strip())
rows.sort(key=lambda r: (r["test"], r["case_id"]))
with open(out_path, "w", encoding="utf-8") as f:
    for row in rows:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")
print(f"merged_parts={len(parts)} cases={len(rows)} evaluations={sum(len(r.get('evaluations', [])) for r in rows)}")
