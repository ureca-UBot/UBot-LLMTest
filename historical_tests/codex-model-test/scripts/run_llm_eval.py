import argparse
import json
import os
import re
import subprocess
import time
import urllib.request
import zipfile
import xml.etree.ElementTree as ET

MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
DOC_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS = {"a": MAIN}

SYSTEM_PROMPT = """당신은 통신사 고객센터 상담 챗봇입니다.

사용자의 질문과 아래에 제공된 FAQ Context를 읽고, FAQ 내용만 근거로 자연스럽고 정확한 한국어 존댓말 답변을 작성하세요.

규칙:
1. 제공된 FAQ Context에 있는 내용만 사용하세요.
2. FAQ에 없는 금액, 기간, 조건, 절차, 정책을 추측하거나 추가하지 마세요.
3. 여러 FAQ가 제공되면 사용자 질문과 직접 관련된 내용만 조합하세요.
4. 관련 없는 FAQ 내용은 답변에 포함하지 마세요.
5. FAQ Context가 비어 있거나 질문에 답할 정보가 부족하면 추측하지 말고, 정확한 안내가 어렵다고 답하세요.
6. FAQ 내용이 서로 충돌하면 어느 한쪽을 임의로 확정하지 말고, 정보가 상충되어 확인이 필요하다고 안내하세요.
7. FAQ에 있는 내용은 사용자가 이해하기 쉬운 상담 문장으로 재구성하세요. FAQ 문장을 단순히 나열하지 마세요.
8. 답변은 질문에 직접 답하고, 불필요하게 장황하게 설명하지 마세요.
9. 답변에 FAQ ID나 내부 평가 정보를 노출하지 마세요.
10. 반드시 아래 JSON 형식으로만 출력하세요. JSON 앞뒤에 설명이나 Markdown을 추가하지 마세요.

출력 형식:
{
  "answer": "사용자에게 보여줄 답변",
  "grounded": true,
  "used_faq_ids": ["FAQ-020"]
}

필드 규칙:
- answer: 사용자에게 전달할 자연스러운 한국어 답변
- grounded: FAQ Context만으로 질문에 충분히 답할 수 있으면 true, 정보가 없거나 부족하거나 충돌하면 false
- used_faq_ids: 답변에 실제로 사용한 FAQ ID 목록. 답변을 보류하면 빈 배열"""


def cell_text(cell, shared):
    value = cell.find("a:v", NS)
    if value is None:
        return ""
    raw = value.text or ""
    if cell.attrib.get("t") == "s":
        return shared[int(raw)]
    return raw


def load_xlsx(path):
    with zipfile.ZipFile(path) as z:
        shared_root = ET.fromstring(z.read("xl/sharedStrings.xml"))
        shared = ["".join(t.text or "" for t in si.iterfind(".//a:t", NS)) for si in shared_root.findall("a:si", NS)]
        wb = ET.fromstring(z.read("xl/workbook.xml"))
        rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
        relmap = {x.attrib["Id"]: x.attrib["Target"].lstrip("/") for x in rels}
        sheets = {}
        for sheet in wb.find("a:sheets", NS):
            target = relmap[sheet.attrib[f"{{{DOC_REL}}}id"]]
            if not target.startswith("xl/"):
                target = "xl/" + target
            root = ET.fromstring(z.read(target))
            rows = []
            for row in root.findall(".//a:sheetData/a:row", NS):
                vals = [cell_text(c, shared) for c in row.findall("a:c", NS)]
                rows.append(vals)
            sheets[sheet.attrib["name"]] = rows
        return sheets


def get_sheet(sheets, contains):
    for name, rows in sheets.items():
        if contains in name:
            return rows
    raise KeyError(f"sheet not found: {contains}")


def faq_map(sheets):
    rows = get_sheet(sheets, "FAQ")
    result = {}
    for row in rows[1:]:
        if len(row) >= 4 and row[0]:
            result[row[0]] = {"category": row[1], "question": row[2], "answer": row[3]}
    return result


def ids_from_field(value):
    return [x.strip() for x in re.split(r"[,;]", value or "") if x.strip()]


def faq_context(ids, faqs):
    if not ids:
        return "(제공된 FAQ 없음)"
    blocks = []
    for faq_id in ids:
        faq = faqs.get(faq_id)
        if faq:
            blocks.append(f"{faq_id}: Q: {faq['question']} A: {faq['answer']}")
        else:
            blocks.append(f"{faq_id}: (FAQ 원문 없음)")
    return "\n".join(blocks)


def build_cases(raw_dir):
    first = load_xlsx(os.path.join(raw_dir, "EmbeddingTestFAQ_v3.xlsx"))
    second_path = os.path.join(raw_dir, "faq_rag_stability.xlsx")
    second = load_xlsx(second_path)
    faqs = faq_map(first)
    cases = []

    for sheet_name, test_id in [("Retrieval Easy", "T01"), ("Retrieval Medium", "T02"), ("Retrieval Hard", "T03")]:
        rows = first[sheet_name]
        for row in rows[1:]:
            if not row or not row[0]:
                continue
            ids = ids_from_field(row[2])
            cases.append({
                "test": test_id,
                "id": row[0],
                "query": row[1],
                "context": faq_context(ids, faqs),
                "primary_gt": row[2],
                "intent": row[4] if len(row) > 4 else "",
                "test_point": row[-1] if row else "",
            })

    rag = get_sheet(second, "RAG")
    type_map = {
        "HR": ("T04", "무관 FAQ"), "EC": ("T05", "빈 Context"), "CF": ("T06", "모순 FAQ"),
        "PI": ("T07", "부분 정보"), "SR": ("T08", "유사하지만 답 없음"),
        "NC": ("T09", "정답 FAQ + Noise"), "MC": ("T10", "다중 FAQ 조합"),
    }
    for row in rag[1:]:
        if len(row) < 11 or not row[0]:
            continue
        prefix = row[0].split("-")[0]
        test_id, test_name = type_map.get(prefix, ("T04", row[1]))
        raw_context = (row[4] or "").strip()
        if not raw_context or raw_context.upper() == "EMPTY":
            context = "(제공된 FAQ 없음)"
        else:
            context = "\n".join(x.strip() for x in raw_context.split("/") if x.strip())
        cases.append({
            "test": test_id,
            "test_name": test_name,
            "id": row[0],
            "tier": row[2],
            "query": row[3],
            "context": context,
            "context_count": row[5],
            "expected_ref": row[6],
            "expected_behavior": row[7],
            "failure_condition": row[8],
            "intent": row[9],
            "test_point": row[10],
        })
    return cases


def installed_models():
    output = subprocess.check_output(["ollama", "list"], text=True, encoding="utf-8")
    models = []
    for line in output.splitlines()[1:]:
        parts = line.split()
        if parts:
            models.append(parts[0])
    return models


def ollama_ps(model=None):
    try:
        with urllib.request.urlopen("http://127.0.0.1:11434/api/ps", timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
        for item in payload.get("models", []):
            if model is None or item.get("name") == model:
                size = int(item.get("size", 0) or 0)
                size_vram = int(item.get("size_vram", 0) or 0)
                return {
                    "name": item.get("name", model),
                    "size_bytes": size,
                    "size_vram_bytes": size_vram,
                    "ram_bytes": max(size - size_vram, 0),
                    "processor": item.get("processor", ""),
                }
        return None
    except Exception:
        return None


def call_ollama(model, user_prompt):
    payload = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "stream": False,
        "format": "json",
        "think": False,
        "options": {"temperature": 0, "num_predict": 1024},
    }).encode("utf-8")
    request = urllib.request.Request(
        "http://127.0.0.1:11434/api/chat",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    started = time.perf_counter()
    try:
        resource_before = ollama_ps(model)
        with urllib.request.urlopen(request, timeout=180) as response:
            data = json.loads(response.read().decode("utf-8"))
        resource_after = ollama_ps(model)
        latency_ms = round((time.perf_counter() - started) * 1000)
        raw = data.get("message", {}).get("content", "")
        parsed = None
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", raw, re.S)
            if match:
                try:
                    parsed = json.loads(match.group(0))
                except json.JSONDecodeError:
                    pass
        return {
            "ok": True,
            "latency_ms": latency_ms,
            "raw_output": raw,
            "parsed": parsed,
            "format_valid": isinstance(parsed, dict) and isinstance(parsed.get("answer"), str),
            "eval_count": data.get("eval_count"),
            "eval_duration_ns": data.get("eval_duration"),
            "prompt_eval_count": data.get("prompt_eval_count"),
            "resource_before": resource_before,
            "resource_after": resource_after,
        }
    except Exception as exc:
        return {"ok": False, "latency_ms": round((time.perf_counter() - started) * 1000), "error": repr(exc), "resource_before": locals().get("resource_before"), "resource_after": locals().get("resource_after")}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--smoke", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--repeat", type=int, default=1)
    args = parser.parse_args()
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    raw_dir = os.path.join(root, "data", "raw")
    out_dir = os.path.join(root, "results", "raw")
    os.makedirs(out_dir, exist_ok=True)
    cases = build_cases(raw_dir)
    models = installed_models()
    if args.smoke:
        cases = [next(c for c in cases if c["id"] == "E01")]
    elif args.limit:
        cases = cases[:args.limit]
    output_path = os.path.join(out_dir, "llm_answer_generation.jsonl")
    mode = "w" if args.smoke or args.limit else "w"
    total = len(cases) * len(models) * args.repeat
    print(f"cases={len(cases)} models={len(models)} repeat={args.repeat} calls={total}")
    with open(output_path, mode, encoding="utf-8") as out:
        for model in models:
            for case in cases:
                user_prompt = f"[사용자 질문]\n{case['query']}\n\n[참고 FAQ Context]\n{case['context']}"
                for repeat_index in range(1, args.repeat + 1):
                    print(f"{model} {case['id']} r{repeat_index}", flush=True)
                    result = call_ollama(model, user_prompt)
                    record = {
                        "model": model,
                        "repeat": repeat_index,
                        "test": case["test"],
                        "case": case,
                        **result,
                    }
                    out.write(json.dumps(record, ensure_ascii=False) + "\n")
                    out.flush()
    print(f"saved={output_path}")


if __name__ == "__main__":
    main()
