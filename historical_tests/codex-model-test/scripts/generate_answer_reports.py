import json
import os
import statistics
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_PATH = os.path.join(ROOT, "results", "raw", "llm_answer_generation.jsonl")
JUDGE_PATH = os.path.join(ROOT, "results", "raw", "llm_answer_judgement.jsonl")
OUT_DIR = os.path.join(ROOT, "results")
TEST_NAMES = {
    "T01": "쉬운_답변_생성", "T02": "중간_답변_생성",
    "T03": "어려운_답변_생성", "T04": "무관_FAQ_대응",
    "T05": "빈_Context_대응", "T06": "모순_FAQ_대응",
    "T07": "부분_정보_대응", "T08": "유사하지만_답변_없음",
    "T09": "정답_FAQ_노이즈", "T10": "다중_FAQ_조합",
}

def answer_of(record):
    parsed = record.get("parsed")
    return parsed.get("answer", "") if isinstance(parsed, dict) else record.get("raw_output", "")

def auto_flags(record):
    flags = []
    if not record.get("ok"): flags.append("execution_error")
    if not record.get("format_valid"): flags.append("json_format_error")
    if not answer_of(record).strip(): flags.append("empty_answer")
    return flags

def load_judgements():
    result = {}
    if not os.path.exists(JUDGE_PATH): return result
    for line in open(JUDGE_PATH, encoding="utf-8"):
        if not line.strip(): continue
        item = json.loads(line)
        for evaluation in item.get("evaluations", []):
            result[(item["test"], item["case_id"], evaluation["model"])] = evaluation
    return result

def pct(count, total):
    return f"{round(count * 100 / total, 1):g}%({count}/{total})" if total else "0%(0/0)"

def quality_cell(evaluations, key):
    values = [e[key] for e in evaluations if key in e and not e.get("unreviewed")]
    return pct(sum(values), len(values)) if values else ""

def write_test_report(test_id, records, judgements):
    records.sort(key=lambda x: (x["model"], x["case"]["id"]))
    by_model = defaultdict(list)
    for record in records: by_model[record["model"]].append(record)
    case_lookup = {record["case"]["id"]: record["case"] for record in records}
    path = os.path.join(OUT_DIR, f"{test_id}_{TEST_NAMES[test_id]}.md")
    with open(path, "w", encoding="utf-8") as out:
        out.write(f"# {test_id} {TEST_NAMES[test_id]}\n\n")
        out.write(f"- 테스트 케이스: {len(case_lookup)}개\n- 모델 수: {len(by_model)}개\n- 전체 답변: {len(records)}개\n")
        out.write("\n## 평가 요약\n\n")
        out.write("각 답변을 질문과 FAQ Context에 대조하여 평가했습니다. 값은 `통과율%(통과건수/전체건수)` 형식입니다.\n\n")
        out.write("| 모델 | 정확성 | 완전성 | 관련성 | 근거성 | 표현 자연스러움 | 문제 없음 | JSON 형식 | 평균 응답(ms) |\n")
        out.write("|---|---|---|---|---|---|---|---:|---:|\n")
        for model, model_records in by_model.items():
            valid_json = sum(1 for record in model_records if record.get("format_valid"))
            latencies = [record.get("latency_ms", 0) for record in model_records if record.get("ok")]
            avg_latency = round(statistics.mean(latencies)) if latencies else ""
            evs = [judgements.get((test_id, r["case"]["id"], model), {}) for r in model_records]
            total = len(evs)
            quality = [quality_cell(evs, key) for key in ("accuracy", "completeness", "relevance", "grounding", "naturalness")]
            problem_values = [not e["problem"] for e in evs if "problem" in e and not e.get("unreviewed")]
            problem_cell = pct(sum(problem_values), len(problem_values)) if problem_values else ""
            out.write(f"| {model} | {quality[0]} | {quality[1]} | {quality[2]} | {quality[3]} | {quality[4]} | {problem_cell} | {valid_json}/{len(model_records)} | {avg_latency} |\n")
        out.write("\n- 평가 기준: 정확성=사실 오류 없음, 완전성=필요한 답변 요소 포함, 관련성=질문에 직접 답함, 근거성=FAQ Context로 뒷받침됨, 표현 자연스러움=자연스러운 한국어 상담 문장, 문제 없음=환각·무관 내용·잘못된 확정·형식 문제 없음.\n\n")
        out.write("## 질문·답변 상세\n\n")
        out.write("모델별 영역을 열면 해당 모델의 질문과 답변을 확인할 수 있습니다.\n\n")
        out.write("<details>\n<summary><strong>Test case reference: questions and FAQ Context</strong></summary>\n\n")
        out.write("| 케이스 | 질문 | FAQ Context | 기대 동작 |\n|---|---|---|---|\n")
        for case_id, case in sorted(case_lookup.items()):
            question = str(case.get("query", "")).replace("|", "\\|").replace("\n", "<br>")
            context = str(case.get("context", "")).replace("|", "\\|").replace("\n", "<br>")
            expected = str(case.get("expected_behavior", "")).replace("|", "\\|").replace("\n", "<br>")
            out.write(f"| {case_id} | {question} | {context} | {expected} |\n")
        out.write("\n</details>\n\n")
        for model, model_records in by_model.items():
            out.write(f"<details>\n<summary><strong>{model}</strong> ({len(model_records)}개 답변)</summary>\n\n")
            out.write("| 케이스 | 질문 | 답변 | 근거성 | 사용 FAQ ID | 응답(ms) | 자동 플래그 | 평가 메모 |\n")
            out.write("|---|---|---|---|---|---:|---|---|\n")
            for record in model_records:
                parsed = record.get("parsed") if isinstance(record.get("parsed"), dict) else {}
                flags = auto_flags(record)
                case = record["case"]
                question = str(case.get("query", "")).replace("|", "\\|").replace("\n", "<br>")
                answer = str(answer_of(record)).replace("|", "\\|").replace("\n", "<br>")
                used_ids = str(parsed.get("used_faq_ids", "")).replace("|", "\\|")
                flag_text = ", ".join(flags) if flags else "none"
                issue = ""
                out.write(f"| {record['case']['id']} | {question} | {answer} | {parsed.get('grounded', '')} | {used_ids} | {record.get('latency_ms', '')} | {flag_text} | {issue} |\n")
            out.write("\n</details>\n\n")

def write_resource_report(records):
    by_model = defaultdict(list)
    for record in records: by_model[record["model"]].append(record)
    path = os.path.join(OUT_DIR, "resource_benchmark.md")
    with open(path, "w", encoding="utf-8") as out:
        out.write("# 자원 및 실행 성능\n\n| 모델 | 호출 수 | 실행 오류 | JSON 형식 성공 | 평균 응답(ms) | P95 응답(ms) | 평균 출력 토큰 |\n|---|---:|---:|---:|---:|---:|---:|\n")
        for model, rows in by_model.items():
            latencies = sorted(r["latency_ms"] for r in rows if r.get("ok"))
            counts = [r["eval_count"] for r in rows if isinstance(r.get("eval_count"), int)]
            p95 = latencies[max(0, int(len(latencies) * 0.95) - 1)] if latencies else ""
            avg = round(statistics.mean(latencies)) if latencies else ""
            avg_tokens = round(statistics.mean(counts), 1) if counts else ""
            errors = sum(1 for r in rows if not r.get("ok"))
            formats = sum(1 for r in rows if r.get("format_valid"))
            out.write(f"| {model} | {len(rows)} | {errors} | {formats}/{len(rows)} | {avg} | {p95} | {avg_tokens} |\n")
        out.write("\nRAM/VRAM 최대 사용량은 이번 실행에서 수집하지 않았습니다.\n")

def main():
    with open(RAW_PATH, encoding="utf-8") as f: records = [json.loads(line) for line in f if line.strip()]
    # Local-LLM judgement output is intentionally excluded from the report.
    # Quality cells and answer-level judgement notes remain blank until direct review.
    judgements = {}
    by_test = defaultdict(list)
    for record in records: by_test[record["test"]].append(record)
    for test_id in sorted(by_test): write_test_report(test_id, by_test[test_id], judgements)
    write_resource_report(records)
    print(f"generated_reports={len(by_test)} records={len(records)}")

if __name__ == "__main__": main()
