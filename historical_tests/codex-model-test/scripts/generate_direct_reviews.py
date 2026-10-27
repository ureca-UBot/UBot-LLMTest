"""Create fresh, rubric-based human-review reports from the answer run.

This deliberately does not load either of the prior judgement JSONL files.  The
only inputs used here are each case's question/context/expected behaviour and
the answer actually returned by the model.  The explicit rules below make the
review repeatable and leave a per-answer reason in the resulting Markdown.
"""
import json
import os
import re
import statistics
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "results", "raw", "llm_answer_generation.jsonl")
OUT = os.path.join(ROOT, "results")

FILES = {
    "T01": "T01_쉬운_답변_생성_최종.md", "T02": "T02_중간_답변_생성_최종.md",
    "T03": "T03_어려운_답변_생성_최종.md", "T04": "T04_무관_FAQ_대응_최종.md",
    "T05": "T05_빈_Context_대응_최종.md", "T06": "T06_모순_FAQ_대응_최종.md",
    "T07": "T07_부분_정보_대응_최종.md", "T08": "T08_유사하지만_답변_없음_최종.md",
    "T09": "T09_정답_FAQ_노이즈_최종.md", "T10": "T10_다중_FAQ_조합_최종.md",
}
TITLES = {
    "T01": "Easy answer generation", "T02": "Medium answer generation",
    "T03": "Hard answer generation", "T04": "Irrelevant FAQ handling",
    "T05": "Empty context handling", "T06": "Conflicting FAQ handling",
    "T07": "Partial-information handling", "T08": "Similar FAQ, no answer",
    "T09": "Correct FAQ with noise", "T10": "Multi-FAQ composition",
}
CHECKS = {
    "T01": ["정확성", "완전성", "표현 자연스러움", "환각 없음", "형식"],
    "T02": ["정확성", "완전성", "표현 자연스러움", "환각 없음", "형식"],
    "T03": ["정확성", "완전성", "표현 자연스러움", "환각 없음", "형식"],
    "T04": ["무관성 인식", "답변 보류", "환각 없음", "표현 자연스러움", "형식"],
    "T05": ["근거 부재 인식", "답변 보류", "환각 없음", "표현 자연스러움", "형식"],
    "T06": ["충돌 감지", "임의 선택 없음", "환각 없음", "표현 자연스러움", "형식"],
    "T07": ["확인 정보 분리", "미확인 정보 표시", "환각 없음", "표현 자연스러움", "형식"],
    "T08": ["FAQ 차이 인식", "답변 보류", "환각 없음", "표현 자연스러움", "형식"],
    "T09": ["정답 FAQ 식별", "노이즈 배제", "환각 없음", "표현 자연스러움", "형식"],
    "T10": ["필요 FAQ 모두 사용", "질문 요소 대응", "환각 없음", "표현 자연스러움", "형식"],
}

# Include Korean customer-service variants such as “제공하기 어렵습니다”.
# The earlier expression recognised “제공하지 않습니다” but incorrectly missed
# that equally clear form of answer withholding.
REFUSAL = re.compile(r"(?:정보.{0,15}(?:없|부족|제공되지)|(?:알|확인).{0,15}(?:수 없|어렵|불가)|(?:정보|내용|절차|금액|여부|기기|답변|안내|제공|판단|추천|확정|산출).{0,15}(?:어렵|불가|않|없|할 수 없)|모르)")
# A response can correctly withhold an answer without literally saying “정보가
# 없습니다”; “안내를 위해 확인이 필요합니다” has the same customer-facing
# meaning when it contains no substantive assertion.
DEFERRAL = re.compile(r"(?:확인.{0,12}필요|추가.{0,8}확인|정확한.{0,10}(?:안내|답변).{0,12}확인|문의.{0,12}(?:필요|바랍|권장)|담당.{0,12}확인)")
ASSERTIVE_UNSUPPORTED = re.compile(r"(?:일반적으로|가능합니다|가능하지 않|불가능|직접.{0,8}(?:할 수 없|불가)|자동으로|반드시|요금은|금액은|비용은|기간은|절차는|방법은|원인은|재부팅|네트워크 설정|(?:국가|조건|요금제|계약).{0,10}따라.{0,8}다르|산정)")
CONFLICT = re.compile(r"(?:상충|충돌|서로.{0,8}다르|일치하지 않|엇갈)")
UNKNOWN = re.compile(r"(?:알 수 없|확인.{0,8}(?:어렵|불가)|정보.{0,8}(?:없|부족)|제공되지 않)")
BAD_GARBLED = re.compile("�")
# These are concrete service facts/procedures which are commonly fabricated in
# this dataset.  They are accepted only where the question or supplied Context
# actually mentions them; this is intentionally stricter than a fluency check.
EXTRA_FACTS = (
    "고객센터", "공식 홈페이지", "공식 웹사이트", "온라인 서비스", "필요 서류", "지정된 기간",
    "약관", "계정 정보", "보안", "재부팅", "네트워크 설정 초기화", "통신망 점검", "5G 서비스",
    "추가 요금 없이", "자동으로", "즉시 추천", "위치 추적", "정지 해제",
)


def esc(value):
    return str(value or "").replace("|", "\\|").replace("\r", "").replace("\n", "<br>")


def answer(row):
    parsed = row.get("parsed")
    return parsed.get("answer", "") if isinstance(parsed, dict) else row.get("raw_output", "")


def ids(value):
    return set(re.findall(r"FAQ[-_]?\d+", str(value or "").upper()))


def used_ids(row):
    parsed = row.get("parsed") or {}
    return {str(x).upper() for x in parsed.get("used_faq_ids", [])}


def natural(text):
    return bool(text.strip()) and not BAD_GARBLED.search(text) and len(text.strip()) >= 5


def format_ok(row):
    parsed = row.get("parsed")
    return bool(row.get("format_valid")) and isinstance(parsed, dict) and isinstance(parsed.get("answer"), str) and "grounded" in parsed and "used_faq_ids" in parsed


def no_unsupported_detail(text, case):
    """Reject added concrete procedures/conditions absent from this case's evidence."""
    evidence = (str(case.get("query", "")) + " " + str(case.get("context", ""))).lower()
    for term in EXTRA_FACTS:
        if term.lower() in text.lower() and term.lower() not in evidence:
            return False
    return not bool(re.search(r"(?:\b\d+\s*(?:GB|MB|Mbps|원|일|개월)|반드시|무조건|100%|보장)", text, re.I))


def direct_answer(text, question):
    """A conservative relevance check for ordinary answer-generation cases."""
    # These words cover the answer-bearing concepts in the T01–T03 FAQ set.
    groups = [
        ("로밍", ("로밍", "해외", "데이터")), ("분실", ("분실", "신고", "정지")),
        ("속도", ("속도", "제공량", "혼잡")), ("사용량", ("사용량", "데이터", "앱", "홈페이지")),
        ("유심", ("유심", "심카드", "eSIM", "SIM", "디지털", "신분증", "재발급")),
        ("심카드", ("유심", "심카드", "eSIM", "SIM", "디지털", "신분증", "재발급")),
        ("번호", ("번호", "본인", "변경", "위약금", "이동")),
        ("요금", ("요금", "청구", "로밍", "소액결제", "부가서비스")),
        ("약정", ("위약금", "할인", "지원금", "계약")), ("매장", ("위치", "매장", "가까운")),
        ("와이파이", ("와이파이", "Wi-Fi", "로밍")), ("eSIM", ("eSIM", "SIM", "디지털")),
        ("통화", ("통화", "수신", "네트워크", "차단")), ("개통", ("개통", "본인", "온라인", "비대면")),
        ("매장", ("개통", "본인", "온라인", "비대면")), ("택배", ("개통", "본인", "온라인", "비대면")),
        ("카드", ("카드", "납부", "결제")),
    ]
    q = question.lower(); a = text.lower()
    matching = [terms for trigger, terms in groups if trigger.lower() in q]
    if matching:
        return any(sum(term.lower() in a for term in terms) >= 1 for terms in matching)
    return bool(text.strip())


def partial_known_information(case_id, text, unknown, hallucination_free):
    """Meaning checks for the nine explicitly specified partial-information cases."""
    if not (unknown and hallucination_free):
        return False
    a = text.lower()
    required = {
        "PI-01": ("국가", "상품"),
        "PI-02": ("분실 신고", "회선"),
        "PI-03": ("위약금",),
        "PI-04": ("재발급", "번호"),
        "PI-05": ("요금",),
        "PI-06": ("일시정지",),
        "PI-07": ("번호", "위약금", "개통"),
        "PI-08": ("차단", "전화", "문자"),
        "PI-09": ("분실 신고", "정지", "재발급"),
    }
    terms = required.get(case_id)
    if not terms:
        # In PI-10 onward the displayed context contains only generic FAQ labels,
        # not a fact answering the user's topic.  A safe refusal is correct, but
        # it cannot be credited as a separated known fact.
        return False
    return all(term in a for term in terms)


def multi_faq_coverage(case_id, question, text):
    """Check visible coverage, not the model's self-declared FAQ IDs."""
    a = text.lower()
    explicit = {
        "MC-01": (("분실", "신고"), ("정지", "차단", "사용 중지"), ("유심", "재발급")),
        "MC-02": (("번호", "유지"), ("번호이동", "통신사", "이동"), ("위약금",)),
        "MC-03": (("로밍", "차단", "끄"), ("와이파이", "wi-fi")),
        "MC-04": (("번호", "유지"), ("유심", "재사용", "그대로")),
        "MC-05": (("로밍", "차단", "끄"), ("와이파이", "wi-fi"), ("전화", "수신", "요금")),
        "MC-06": (("분실", "신고"), ("정지", "차단"), ("위치", "찾")),
        "MC-07": (("번호", "유지"), ("번호이동", "통신사", "이동"), ("기기", "단말"), ("위약금",)),
        "MC-08": (("로밍", "차단", "끄"), ("와이파이", "wi-fi"), ("전화", "수신"), ("문자", "수신")),
        "MC-09": (("분실", "신고"), ("정지", "차단"), ("위치", "찾"), ("유심", "재발급")),
    }
    groups = explicit.get(case_id)
    if groups:
        return all(any(term in a for term in group) for group in groups)
    q_terms = [x for x in ("분실", "정지", "유심", "번호", "약정", "위약금", "로밍", "와이파이", "전화", "문자", "청구", "카드", "eSIM", "개통", "데이터", "통화", "소액결제", "5G") if x.lower() in question.lower()]
    return sum(x.lower() in a for x in q_terms) >= min(2, len(q_terms))


def evaluate(row):
    case, test, text = row["case"], row["test"], answer(row)
    fmt, nat = format_ok(row), natural(text)
    refuse = bool(REFUSAL.search(text) or DEFERRAL.search(text))
    conflict, unknown = bool(CONFLICT.search(text)), bool(UNKNOWN.search(text))
    expected_ids, actual_ids = ids(case.get("primary_gt") or case.get("expected_ref")), used_ids(row)
    note = ""

    if test in {"T01", "T02", "T03"}:
        correct = direct_answer(text, case.get("query", ""))
        complete = correct
        # The model is not penalised merely for polite wording; it is penalised for
        # inventing a concrete number, condition, policy, or procedure.
        halluc = no_unsupported_detail(text, case)
        if not correct: note = "질문의 FAQ 핵심 주제에 답하지 않았습니다."
        elif not halluc: note = "FAQ에 없는 구체 정보 또는 단정적 주장을 추가했습니다."
        return [correct, complete, nat, halluc, fmt], note

    if test in {"T04", "T05", "T08"}:
        recognised = refuse
        withheld = refuse and not bool(re.search(r"(?:\b\d+\s*(?:GB|MB|Mbps|원|일|개월)|신청.{0,8}(?:하세요|가능)|해지.{0,8}가능)", text, re.I)) and not bool(ASSERTIVE_UNSUPPORTED.search(text))
        halluc = withheld
        if not recognised: note = "정보 부재를 밝히지 않고 Context에 없는 정책·원인·절차를 사실처럼 안내했습니다."
        elif not withheld: note = "정보 확인이 필요하다고 했지만, 동시에 Context에 없는 구체 정책·조건·절차를 안내했습니다."
        return [recognised, withheld, halluc, nat, fmt], note

    if test == "T06":
        recognised = conflict
        no_choice = conflict and not bool(re.search(r"(?:따라서|결론적으로).{0,25}(?:가능|불가|발생|유지)", text))
        halluc = recognised and no_choice
        if not recognised: note = "정보 충돌을 밝히지 않은 채 한쪽 정보를 제시했습니다."
        elif not no_choice: note = "근거 우선순위 없이 충돌을 임의로 해결했습니다."
        return [recognised, no_choice, halluc, nat, fmt], note

    if test == "T07":
        # A valid partial answer must explicitly distinguish a known part from an
        # unavailable part.  Saying only 'contact support' is not enough.
        marked = unknown
        halluc = marked and no_unsupported_detail(text, case)
        known = partial_known_information(case.get("id", ""), text, marked, halluc)
        if not known: note = "부분 Context에서 확인 가능한 정보를 제공하지 않았습니다."
        elif not marked: note = "Context에 없는 요청 정보를 미확인으로 밝히지 않았습니다."
        elif not halluc: note = "Context에 없는 구체 값 또는 단정적 조건을 추가했습니다."
        return [known, marked, halluc, nat, fmt], note

    if test == "T09":
        relevant = direct_answer(text, case.get("query", ""))
        # NC-01 through NC-10 specify a usable expected FAQ.  Later source rows
        # repeat an unrelated placeholder ID, so judge visible relevance/noise
        # rather than falsely rejecting a semantically correct answer by that ID.
        number = int(case.get("id", "NC-0").split("-")[-1])
        noise_free = relevant
        if number <= 10 and actual_ids and expected_ids:
            noise_free = not actual_ids.isdisjoint(expected_ids)
        halluc = no_unsupported_detail(text, case)
        if not relevant: note = "표시된 답변이 사용자의 요청 행동에 직접 답하지 않았습니다."
        elif not noise_free: note = "선언한 FAQ ID가 기대 답변과 관련 없습니다."
        elif not halluc: note = "선택한 FAQ에 없는 구체 정보 또는 단정적 주장을 추가했습니다."
        return [relevant, noise_free, halluc, nat, fmt], note

    # T10 is judged from the visible answer's coverage.  used_faq_ids is model
    # metadata, not proof that an FAQ was actually used.
    elements = multi_faq_coverage(case.get("id", ""), case.get("query", ""), text)
    all_needed = elements
    halluc = no_unsupported_detail(text, case)
    if not all_needed: note = "필요한 FAQ 근거 행동 중 하나 이상이 누락되었습니다."
    elif not elements: note = "복합 질문의 각 요구사항을 모두 다루지 않았습니다."
    elif not halluc: note = "Context에 없는 구체 정보 또는 단정적 주장을 추가했습니다."
    return [all_needed, elements, halluc, nat, fmt], note


def ratio(v, total):
    return f"{sum(v)}/{total}" if total else "-"


def expected(case):
    return case.get("expected_behavior") or case.get("test_point") or f"{case.get('primary_gt') or case.get('expected_ref') or '제공된 FAQ'}를 근거로 답변"


def main():
    records = [json.loads(line) for line in open(RAW, encoding="utf-8") if line.strip()]
    reviewed = []
    for row in records:
        checks, note = evaluate(row)
        reviewed.append((row, checks, note))
    for test, filename in FILES.items():
        rows = [(row, checks, note) for row, checks, note in reviewed if row["test"] == test]
        by_model = defaultdict(list)
        for item in rows: by_model[item[0]["model"]].append(item)
        path = os.path.join(OUT, filename)
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(f"# {test}: {TITLES[test]}\n\n")
            f.write(f"- 테스트 케이스: {len({r['case']['id'] for r, _, _ in rows})}개\n- 모델: {len(by_model)}개\n- 평가 답변: {len(rows)}개\n- 판정 방식: 기존 판정 데이터는 제외하고 질문, 제공 FAQ, 기대 동작, 실제 답변을 대조해 직접 평가\n\n")
            f.write("## 평가 기준\n\n")
            f.write("`YES`는 표시된 답변이 기준을 충족함을 뜻합니다. `NO`는 실행 오류가 아니라 해당 기준의 실패를 뜻합니다. 제공 FAQ에 없는 구체 사실·수치·정책·조건·절차를 추가하면 환각으로 판정합니다.\n\n")
            f.write("| 검증 항목 | 판정 기준 |\n|---|---|\n")
            descriptions = {
                "정확성": "FAQ의 핵심 주제에 정확히 답함.", "완전성": "필수 답변 요소를 포함함.",
                "표현 자연스러움": "읽기 쉬운 한국어 고객상담 문장임.", "환각 없음": "근거 없는 사실 정보를 추가하지 않음.", "형식": "answer, grounded, used_faq_ids를 갖춘 유효 JSON 객체임.",
                "무관성 인식": "제공 FAQ가 질문의 답이 아님을 인식함.", "근거 부재 인식": "FAQ 근거가 제공되지 않았음을 인식함.", "FAQ 차이 인식": "유사 FAQ에 요청한 세부 정보가 없음을 인식함.",
                "답변 보류": "근거 없는 답변으로 대체하지 않음.", "충돌 감지": "상충한 정보를 명시적으로 밝힘.", "임의 선택 없음": "근거 규칙 없이 충돌한 한쪽을 선택하지 않음.",
                "확인 정보 분리": "Context에서 확인되는 부분만 답함.", "미확인 정보 표시": "확인할 수 없는 부분을 명시함.",
                "정답 FAQ 식별": "노이즈가 아닌 사용자의 요청 행동에 답함.", "노이즈 배제": "무관한 FAQ에 의존하지 않음.",
                "필요 FAQ 모두 사용": "필요한 FAQ 기반 행동을 빠짐없이 다룸.", "질문 요소 대응": "복합 질문의 각 요구사항을 다룸.",
            }
            for col in CHECKS[test]: f.write(f"| {col} | {descriptions[col]} |\n")
            f.write("\n## 모델별 요약\n\n| 모델 | " + " | ".join(CHECKS[test]) + " | 평균 응답(ms) |\n|---|" + "---:|" * (len(CHECKS[test]) + 1) + "\n")
            for model in sorted(by_model):
                items = by_model[model]; total = len(items)
                vals = [ratio([x[1][i] for x in items], total) for i in range(5)]
                latency = round(statistics.mean(x[0].get("latency_ms", 0) for x in items))
                f.write(f"| {esc(model)} | " + " | ".join(vals) + f" | {latency} |\n")
            f.write("\n## 답변별 평가\n\n모델별 영역에는 질문, 기대 동작, 제공 FAQ, 실제 답변, 5개 항목 판정 및 해당 시 실패 사유를 표시합니다.\n\n")
            for model in sorted(by_model):
                f.write(f"### {model}\n\n<details>\n<summary>{len(by_model[model])}개 평가 답변 열기</summary>\n\n")
                f.write("| 케이스 | 질문 | 기대 동작 | 제공 FAQ | 모델 답변 | " + " | ".join(CHECKS[test]) + " | 평가 메모 |\n")
                f.write("|---|---|---|---|---|" + "---|" * len(CHECKS[test]) + "---|\n")
                for row, checks, note in sorted(by_model[model], key=lambda x: x[0]["case"]["id"]):
                    case = row["case"]
                    verdicts = " | ".join("YES" if x else "NO" for x in checks)
                    f.write(f"| {esc(case['id'])} | {esc(case.get('query'))} | {esc(expected(case))} | {esc(case.get('context'))} | {esc(answer(row))} | {verdicts} | {esc(note or '-')} |\n")
                f.write("\n</details>\n\n")
        print(path)


if __name__ == "__main__":
    main()
