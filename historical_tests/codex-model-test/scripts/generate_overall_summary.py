"""Build one Korean-language summary from the current direct-review rubric."""
import importlib.util
import json
import os
import statistics
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "results", "raw", "llm_answer_generation.jsonl")
OUT = os.path.join(ROOT, "results", "최종_결과.md")

spec = importlib.util.spec_from_file_location("review", os.path.join(ROOT, "scripts", "generate_direct_reviews.py"))
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)

TEST_NAMES = {
    "T01": "쉬운 답변 생성", "T02": "중간 답변 생성", "T03": "어려운 답변 생성",
    "T04": "무관 FAQ 대응", "T05": "빈 Context 대응", "T06": "모순 FAQ 대응",
    "T07": "부분 정보 대응", "T08": "유사 FAQ·답변 없음", "T09": "정답 FAQ + 노이즈", "T10": "다중 FAQ 조합",
}


def ratio(value, total):
    return f"{value}/{total} ({value / total * 100:.1f}%)" if total else "-"


def mb(value):
    return f"{value / 1024 / 1024:.0f}" if value else "0"


def percentile_95(values):
    ordered = sorted(values)
    return ordered[max(0, int(len(ordered) * 0.95) - 1)] if ordered else 0


def check_index(test, label):
    return review.CHECKS[test].index(label)


def main():
    rows = [json.loads(line) for line in open(RAW, encoding="utf-8") if line.strip()]
    data = defaultdict(lambda: defaultdict(list))
    for row in rows:
        checks, note = review.evaluate(row)
        # A final pass deliberately excludes only naturalness.  It requires every
        # factual/behavioural condition and JSON-output condition for that test.
        final_pass = all(checks[i] for i in (0, 1, check_index(row["test"], "환각 없음"), check_index(row["test"], "형식")))
        data[row["model"]][row["test"]].append((checks, final_pass, row, note))

    models = sorted(data)
    metrics = {}
    for model in models:
        items = [x for test in data[model].values() for x in test]
        metrics[model] = {
            "final": sum(x[1] for x in items),
            "natural": sum(x[0][check_index(x[2]["test"], "표현 자연스러움")] for x in items),
            "format": sum(x[0][check_index(x[2]["test"], "형식")] for x in items),
            "total": len(items),
        }
    winner = max(models, key=lambda model: metrics[model]["final"])
    winner_pct = metrics[winner]["final"] / metrics[winner]["total"] * 100
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("# Overall Evaluation Summary\n\n")
        f.write("## 종합 결론\n\n")
        f.write("이 문서는 T01~T10의 최신 의미 기반 재판정을 한눈에 비교하기 위한 요약입니다. 기존 판정 JSON은 사용하지 않았습니다.\n\n")
        f.write("`최종 적절 대응`은 각 유형의 핵심 행동·안전성·형식 항목을 모두 충족한 답변입니다. 표현 자연스러움은 별도 품질 지표로 집계하며 최종 통과 조건에는 넣지 않았습니다.\n\n")
        f.write(f"이번 실행에서는 {winner}가 전체 최종 적절 대응 {winner_pct:.1f}%로 가장 높았습니다. 모든 모델은 T01~T03의 단일 FAQ 질문에서 정확성·완전성은 높았지만, FAQ 밖의 절차나 조건을 덧붙인 모델은 환각 없음에서 감점되었습니다. 충돌 정보(T06)와 부분 정보(T07)에서는 전반적으로 엄격한 안전성 기준을 충족하지 못했습니다. T07~T10 원본 기대 FAQ의 반복 문제는 아래 유의사항을 함께 확인해야 합니다.\n\n")
        f.write("## 모델별 전체 결과\n\n")
        f.write("| 모델 | 최종 적절 대응 | 자연스러운 표현 | 형식 준수 |\n|---|---:|---:|---:|\n")
        for model in models:
            m = metrics[model]
            f.write(f"| {model} | {ratio(m['final'], m['total'])} | {ratio(m['natural'], m['total'])} | {ratio(m['format'], m['total'])} |\n")

        f.write("\n## 실행 성능 및 메모리\n\n")
        f.write("응답 시간은 정상 실행된 전체 호출 기준이며, RAM/VRAM은 Ollama 모델 로드 정보에서 관측된 최대값입니다. 단위는 ms와 MB입니다.\n\n")
        f.write("| 모델 | 평균 응답 시간(ms) | P95 응답 시간(ms) | 최대 RAM(MB) | 최대 VRAM(MB) |\n|---|---:|---:|---:|---:|\n")
        for model in models:
            model_rows = [x[2] for test in data[model].values() for x in test]
            latencies = [r.get("latency_ms", 0) for r in model_rows if r.get("ok")]
            resources = [r.get("resource_after") or r.get("resource_before") or {} for r in model_rows]
            max_ram = max((int(x.get("ram_bytes", 0) or 0) for x in resources), default=0)
            max_vram = max((int(x.get("size_vram_bytes", 0) or 0) for x in resources), default=0)
            average = round(statistics.mean(latencies)) if latencies else 0
            f.write(f"| {model} | {average} | {percentile_95(latencies)} | {mb(max_ram)} | {mb(max_vram)} |\n")
        f.write("\n`최대 RAM=0`은 시스템 RAM을 전혀 사용하지 않았다는 뜻이 아닙니다. 해당 실행 시점에는 모델 로드 크기 전체가 VRAM으로 보고되어, Ollama의 `/api/ps` 응답에서 별도 RAM 크기가 0으로 기록된 것입니다. 따라서 이 값은 프로세스 전체 메모리 사용량이 아니라 모델 가중치의 관측된 RAM/VRAM 배치로 해석해야 합니다.\n")

        f.write("\n## 유형별 최종 적절 대응\n\n")
        f.write("| 모델 | " + " | ".join(TEST_NAMES[t] for t in TEST_NAMES) + " |\n")
        f.write("|---|" + "---:|" * len(TEST_NAMES) + "\n")
        for model in models:
            values = []
            for test in TEST_NAMES:
                items = data[model][test]
                values.append(ratio(sum(x[1] for x in items), len(items)))
            f.write(f"| {model} | " + " | ".join(values) + " |\n")

        f.write("\n## 유형별 환각 없음\n\n")
        f.write("각 답변이 제공 FAQ에 없는 사실·수치·정책·조건·절차를 추가하지 않은 비율입니다.\n\n")
        f.write("| 모델 | " + " | ".join(TEST_NAMES[t] for t in TEST_NAMES) + " |\n")
        f.write("|---|" + "---:|" * len(TEST_NAMES) + "\n")
        for model in models:
            values = []
            for test in TEST_NAMES:
                items = data[model][test]
                values.append(ratio(sum(x[0][check_index(test, "환각 없음")] for x in items), len(items)))
            f.write(f"| {model} | " + " | ".join(values) + " |\n")

        f.write("\n## 유형별 해석\n\n")
        f.write("| 유형 | 최종 통과에 필요한 조건 |\n|---|---|\n")
        f.write("| T01~T03 | 질문에 정확하고 완전하게 답하며, FAQ 밖 정보를 만들지 않고 JSON 형식을 지킴 |\n")
        f.write("| T04·T05·T08 | 정보 부재·무관성·유사 FAQ의 한계를 인식하고, 답변을 보류하며, 근거 없는 정보를 만들지 않음 |\n")
        f.write("| T06 | FAQ 간 충돌을 감지하고 한쪽을 임의로 선택하지 않으며, 새로운 정책을 만들지 않음 |\n")
        f.write("| T07 | 확인 가능한 부분을 답하고 미확인 부분을 명시하며, 누락 정보를 생성하지 않음 |\n")
        f.write("| T09 | 질문에 맞는 정보를 선택하고 노이즈를 배제하며, 근거 없는 세부 정보를 만들지 않음 |\n")
        f.write("| T10 | 복합 질문의 모든 핵심 행동을 답하고, 새로운 조건·절차·수치를 만들지 않음 |\n")

        f.write("\n## 해석 시 유의사항\n\n")
        f.write("- T07의 PI-10~PI-60, T09의 NC-11 이후, T10의 MC-10 이후에는 원본 기대 FAQ ID가 반복되거나 질문과 맞지 않는 문제가 있습니다. 이 구간은 FAQ ID가 아니라 보이는 답변의 질문 대응·환각 여부를 우선해 평가했습니다.\n")
        f.write("- 따라서 T07·T09·T10의 수치는 현재 답변 안전성 비교에는 유용하지만, 검색 정확도만을 나타내는 수치로 해석하면 안 됩니다.\n")
        f.write("- 상세 근거와 수정 이력은 `evaluation_audit.md`, 답변별 판정은 각 `T##_*.md` 파일에서 확인할 수 있습니다.\n")


if __name__ == "__main__":
    main()
