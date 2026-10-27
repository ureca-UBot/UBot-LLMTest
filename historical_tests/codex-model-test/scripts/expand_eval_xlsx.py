import copy
import os
import re
import tempfile
import zipfile
import xml.etree.ElementTree as ET


MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
DOC_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
NS = {"a": MAIN, "r": DOC_REL}
ET.register_namespace("", MAIN)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "data", "raw")


def col_name(n):
    out = ""
    while n:
        n, rem = divmod(n - 1, 26)
        out = chr(65 + rem) + out
    return out


def read_package(path):
    with zipfile.ZipFile(path, "r") as z:
        return {name: z.read(name) for name in z.namelist()}


def workbook_sheets(files):
    wb = ET.fromstring(files["xl/workbook.xml"])
    rels = ET.fromstring(files["xl/_rels/workbook.xml.rels"])
    relmap = {x.attrib["Id"]: x.attrib["Target"].lstrip("/") for x in rels}
    result = {}
    for sheet in wb.find("a:sheets", NS):
        rel_id = sheet.attrib[f"{{{DOC_REL}}}id"]
        target = relmap[rel_id]
        if not target.startswith("xl/"):
            target = "xl/" + target
        result[sheet.attrib["name"]] = target
    return result


def shared_strings(files):
    path = "xl/sharedStrings.xml"
    root = ET.fromstring(files[path])
    values = ["".join(t.text or "" for t in si.iterfind(".//a:t", NS)) for si in root.findall("a:si", NS)]
    index = {value: i for i, value in enumerate(values)}
    return root, values, index


def add_shared_string(root, values, index, value):
    if value in index:
        return index[value]
    si = ET.SubElement(root, f"{{{MAIN}}}si")
    t = ET.SubElement(si, f"{{{MAIN}}}t")
    t.text = value
    index[value] = len(values)
    values.append(value)
    root.attrib["count"] = str(len(values))
    root.attrib["uniqueCount"] = str(len(values))
    return index[value]


def existing_row_numbers(sheet_root):
    rows = sheet_root.find("a:sheetData", NS).findall("a:row", NS)
    return [int(row.attrib.get("r", "0")) for row in rows]


def append_rows(files, sheet_path, rows):
    root = ET.fromstring(files[sheet_path])
    shared_root, values, index = shared_strings(files)
    sheet_data = root.find("a:sheetData", NS)
    next_row = max(existing_row_numbers(root), default=0) + 1
    for row_values in rows:
        row = ET.SubElement(sheet_data, f"{{{MAIN}}}row", {"r": str(next_row)})
        for col, value in enumerate(row_values, start=1):
            cell = ET.SubElement(row, f"{{{MAIN}}}c", {"r": f"{col_name(col)}{next_row}", "t": "s"})
            v = ET.SubElement(cell, f"{{{MAIN}}}v")
            v.text = str(add_shared_string(shared_root, values, index, str(value)))
        next_row += 1
    dim = root.find("a:dimension", NS)
    if dim is not None:
        max_col = max(len(row) for row in rows)
        dim.attrib["ref"] = f"A1:{col_name(max_col)}{next_row - 1}"
    files[sheet_path] = ET.tostring(root, encoding="utf-8", xml_declaration=True)
    files["xl/sharedStrings.xml"] = ET.tostring(shared_root, encoding="utf-8", xml_declaration=True)


def replace_workbook(path, append_by_sheet, summary_update=False):
    files = read_package(path)
    sheets = workbook_sheets(files)
    for sheet_name, rows in append_by_sheet.items():
        append_rows(files, sheets[sheet_name], rows)
    if summary_update and "요약" in sheets:
        sheet_path = sheets["요약"]
        root = ET.fromstring(files[sheet_path])
        for cell in root.findall(".//a:c", NS):
            value = cell.find("a:v", NS)
            if value is not None and value.text == "1":
                # The summary sheet stores the current test count as a shared string.
                pass
        files[sheet_path] = ET.tostring(root, encoding="utf-8", xml_declaration=True)
    fd, temp_path = tempfile.mkstemp(suffix=".xlsx", dir=os.path.dirname(path))
    os.close(fd)
    try:
        with zipfile.ZipFile(temp_path, "w", zipfile.ZIP_DEFLATED) as z:
            for name, data in files.items():
                z.writestr(name, data)
        os.replace(temp_path, path)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


EASY = [
    ("E11", "해외에서 데이터를 얼마나 썼는지 확인하고 싶어요.", "FAQ-095", "해외 데이터 사용량 조회"),
    ("E12", "유심을 잃어버렸는데 새로 발급받고 싶습니다.", "FAQ-010", "분실 유심 재발급"),
    ("E13", "휴대폰을 바꾸면 번호도 바뀌나요?", "FAQ-006", "기기 변경과 번호 유지"),
    ("E14", "자동이체 카드 정보를 변경하고 싶어요.", "FAQ-041", "자동이체 카드 변경"),
    ("E15", "휴대폰을 분실했어요. 먼저 무엇을 해야 하나요?", "FAQ-051", "휴대폰 분실 초기 조치"),
    ("E16", "eSIM이 정확히 무엇인지 알려주세요.", "FAQ-014", "eSIM 기본 개념"),
    ("E17", "통화가 연결되지 않을 때 어디를 확인해야 하나요?", "FAQ-060", "통화 연결 불가"),
    ("E18", "온라인으로 휴대폰을 개통할 수 있나요?", "FAQ-087", "온라인 개통"),
    ("E19", "해외에서 와이파이를 사용해도 되나요?", "FAQ-032", "해외 Wi-Fi 사용"),
    ("E20", "청구서에 나온 요금을 확인하고 싶어요.", "FAQ-037", "청구 금액 조회"),
]

MEDIUM = [
    ("M11", "외국에 나와서 데이터가 얼마나 남았는지 보고 싶어요.", "FAQ-095", "해외 데이터 사용량 조회"),
    ("M12", "폰을 잃어버린 뒤 유심을 다시 받으려면 어떻게 해야 하나요?", "FAQ-010", "분실 유심 재발급"),
    ("M13", "새 기계로 바꾸려고 하는데 지금 번호를 계속 쓸 수 있을까요?", "FAQ-006", "기기 변경과 번호 유지"),
    ("M14", "결제에 쓰는 카드를 다른 카드로 바꾸고 싶습니다.", "FAQ-041", "자동이체 카드 변경"),
    ("M15", "휴대폰을 잃어버렸는데 회선부터 막아야 할까요?", "FAQ-051", "휴대폰 분실 초기 조치"),
    ("M16", "실물 유심 없이도 휴대폰을 쓸 수 있다는 게 무슨 뜻인가요?", "FAQ-014", "eSIM 기본 개념"),
    ("M17", "갑자기 전화가 안 되는데 인터넷은 되는 상황입니다.", "FAQ-060", "통화 연결 불가"),
    ("M18", "매장에 가지 않고도 새 휴대폰을 개통할 수 있나요?", "FAQ-087", "온라인 개통"),
    ("M19", "로밍을 신청하지 않고 해외에서 와이파이만 쓰면 괜찮나요?", "FAQ-032", "해외 Wi-Fi 사용"),
    ("M20", "이번 달에 결제될 금액이 얼마인지 미리 확인하려고 합니다.", "FAQ-037", "청구 금액 조회"),
]

HARD = [
    ("H11", "해외에서 며칠 사용했는데 요금이 걱정됩니다. 남은 데이터와 초과 여부를 확인하려면요?", "FAQ-095", "해외 데이터 사용량 조회"),
    ("H12", "휴대폰과 유심을 함께 잃어버렸습니다. 새 유심을 받는 절차가 궁금합니다.", "FAQ-010", "분실 유심 재발급"),
    ("H13", "번호는 유지하고 단말기만 교체하려는데 기존 회선에 영향이 있나요?", "FAQ-006", "기기 변경과 번호 유지"),
    ("H14", "통신비가 빠져나가는 결제수단을 바꾸고 싶은데 어떤 메뉴를 이용하나요?", "FAQ-041", "자동이체 카드 변경"),
    ("H15", "분실한 폰을 다른 사람이 쓸까 봐 걱정됩니다. 우선 회선을 어떻게 처리하나요?", "FAQ-051", "휴대폰 분실 초기 조치"),
    ("H16", "새 기기에 물리적인 유심을 넣지 않고 개통하는 방식이 궁금합니다.", "FAQ-014", "eSIM 기본 개념"),
    ("H17", "문자와 데이터는 되는데 일반 전화만 계속 실패합니다.", "FAQ-060", "통화 연결 불가"),
    ("H18", "택배로 받은 단말기를 매장 방문 없이 바로 사용할 수 있나요?", "FAQ-087", "온라인 개통"),
    ("H19", "해외에서 통신사 로밍 대신 숙소 와이파이만 이용하려고 합니다.", "FAQ-032", "해외 Wi-Fi 사용"),
    ("H20", "아직 결제일 전인데 이번 달 청구 예정 금액을 확인할 방법이 있나요?", "FAQ-037", "청구 금액 조회"),
]


def retrieval_rows(items):
    return [[id_, question, gt, "", "FAQ_RAG", point] for id_, question, gt, point in items]


RAG_TYPES = {
    "HR": ("무관 FAQ", "UNREGISTERED", "관련 FAQ가 아니므로 근거 없이 답변하지 않음", "무관 FAQ를 정답처럼 사용"),
    "EC": ("빈 Context", "UNREGISTERED", "제공된 FAQ가 없으므로 답변을 보류함", "FAQ 없이 내용을 추측"),
    "CF": ("모순 FAQ", "FAQ_RAG", "충돌을 인지하고 단정하지 않음", "상충하는 내용을 임의로 확정"),
    "PI": ("부분 정보", "FAQ_RAG", "제공된 범위만 답하고 부족한 정보는 명시함", "없는 정보를 추측"),
    "SR": ("유사하지만 답 없음", "UNREGISTERED", "유사 FAQ만으로는 답하지 않음", "유사성을 근거로 답변"),
    "NC": ("정답+Noise", "FAQ_RAG", "정답 FAQ만 활용하고 Noise를 무시함", "Noise의 내용을 답변에 혼입"),
    "MC": ("다중 FAQ 조합", "FAQ_RAG", "여러 관련 FAQ를 종합해 답변함", "필요한 FAQ를 누락하거나 무관 내용을 혼입"),
}

QUESTION_BANK = {
    "HR": [
        "해외에서 데이터 사용량을 확인하고 싶어요.", "휴대폰을 잃어버렸는데 정지 방법이 궁금해요.", "eSIM을 다른 기기로 옮기고 싶어요.",
        "청구서의 결제 금액이 왜 달라졌는지 알고 싶어요.", "가까운 매장의 영업시간을 확인하고 싶어요.", "데이터 속도가 갑자기 느려졌어요.",
        "번호를 바꾸지 않고 기기만 변경하고 싶어요.", "해외에서 통화 요금이 얼마나 나오는지 궁금해요.", "유심 재발급 절차를 알려주세요.",
        "자동이체 카드를 변경하려고 합니다.", "문자가 발송되지 않는데 해결 방법이 있나요?", "온라인으로 휴대폰을 개통하고 싶어요.",
        "요금제 해지 후 단말기를 계속 사용할 수 있나요?", "남은 데이터가 얼마인지 확인하고 싶어요.", "휴대폰 소액결제 한도를 바꾸고 싶어요.",
        "5G가 아니라 LTE로 연결되는 이유가 궁금해요.", "해외에서 와이파이를 사용해도 되는지 궁금합니다.",
    ],
    "EC": [
        "이번 달 데이터 사용량을 정확히 확인하고 싶어요.", "휴대폰을 분실했을 때 회선을 정지하고 싶어요.", "해외 로밍 요금을 알고 싶어요.",
        "번호 변경 신청 방법을 알려주세요.", "eSIM과 유심의 차이가 궁금해요.", "통화가 안 될 때 점검 방법이 있나요?",
        "자동이체 결제 카드를 바꾸고 싶어요.", "청구 예정 금액을 확인하고 싶습니다.", "온라인 개통이 가능한지 궁금합니다.",
        "데이터가 갑자기 느려진 원인을 알고 싶어요.", "해외에서 데이터 사용을 차단하고 싶어요.", "유심을 재발급받고 싶어요.",
        "요금제 변경 방법을 알고 싶어요.", "문자 수신이 되지 않을 때 어떻게 하나요?", "분실한 휴대폰을 잠그고 싶어요.",
        "통화 연결이 계속 실패합니다.", "청구서에 표시된 항목을 확인하고 싶어요.",
    ],
    "CF": [
        "데이터 잔여량은 어디에서 확인할 수 있나요?", "번호를 변경하면 기존 번호를 복구할 수 있나요?", "분실 유심은 어디서 재발급받나요?",
        "해외에서 자동 로밍이 되는지 궁금합니다.", "eSIM을 다른 단말에서 사용할 수 있나요?", "요금제 해지 후에도 단말기를 쓸 수 있나요?",
        "온라인 개통은 신청 즉시 완료되나요?", "번호 이동 시 기존 번호가 유지되나요?", "청구 금액은 언제 확정되나요?",
        "데이터 초과 시 속도가 어떻게 되나요?", "통화가 안 될 때 어떤 설정을 확인하나요?", "자동이체 카드 변경은 언제 반영되나요?",
        "해외에서 와이파이만 사용하면 요금이 발생하나요?", "소액결제 한도는 바로 바뀌나요?", "5G 단말에서 LTE만 잡히는 이유가 뭔가요?",
        "문자 발송 실패 시 재전송할 수 있나요?", "매장 영업시간은 어디서 확인하나요?",
    ],
    "PI": [
        "해외 데이터 사용량과 초과 요금을 확인하고 싶어요.", "분실 후 유심을 재발급받고 회선도 정지하고 싶어요.", "기기 변경과 번호 이동을 함께 하고 싶어요.",
        "청구 금액과 결제일을 확인하고 싶습니다.", "eSIM을 발급받아 새 휴대폰에서 사용하고 싶어요.", "데이터가 느려진 원인과 해결 방법을 알려주세요.",
        "해외 통화 요금과 데이터 차단 방법이 궁금해요.", "온라인 개통 절차와 필요한 서류를 알고 싶어요.", "요금제 해지 조건과 단말기 사용 여부가 궁금합니다.",
        "번호 변경 방법과 변경 후 복구 가능 여부를 알려주세요.", "소액결제 한도와 변경 방법을 확인하고 싶어요.", "통화 장애 원인과 점검 순서를 알고 싶습니다.",
        "자동이체 카드 변경 방법과 반영 시점을 알려주세요.", "문자 수신 문제와 네트워크 상태를 확인하고 싶어요.",
        "청구서의 상세 항목과 이의 신청 방법이 궁금해요.", "유심 없이 개통하는 방법과 지원 단말을 알고 싶어요.",
        "해외에서 와이파이 사용 시 요금이 발생하는지 알고 싶습니다.",
    ],
    "SR": [
        "해외에서 하루 데이터 사용량을 특정 숫자로 예측해 주세요.", "분실 휴대폰의 위치를 실시간으로 찾아주세요.", "eSIM을 모든 해외 통신사에서 사용할 수 있나요?",
        "이번 달 청구 금액을 미리 정확히 보장해 주세요.", "통화 품질이 좋아지는 기기를 추천해 주세요.", "가장 저렴한 요금제를 골라주세요.",
        "매장까지 걸리는 시간을 계산해 주세요.", "해외에서 발생할 총 비용을 확정해 주세요.", "문자 차단을 특정 상대에게만 적용해 주세요.",
        "내 위치에서 가장 가까운 매장을 알려주세요.", "데이터 속도가 몇 Mbps인지 측정해 주세요.", "분실폰을 원격으로 삭제해 주세요.",
        "사용 패턴에 맞는 요금제를 자동으로 가입해 주세요.", "해외에서 통화가 무료인지 보장해 주세요.", "청구 오류 여부를 확정적으로 판단해 주세요.",
        "휴대폰 고장 원인을 원격으로 진단해 주세요.", "현재 매장에 재고가 있는지 알려주세요.",
    ],
    "NC": [
        "해외에서 데이터 잔여량을 확인하고 싶어요.", "번호를 변경하려면 어떻게 해야 하나요?", "휴대폰을 분실했을 때 먼저 할 일은 무엇인가요?",
        "eSIM을 새 휴대폰에서 사용하고 싶어요.", "이번 달 청구 금액을 확인하고 싶습니다.", "데이터가 갑자기 느려졌어요.",
        "자동이체 카드를 변경하고 싶어요.", "해외에서 와이파이를 사용하려고 합니다.", "온라인으로 휴대폰을 개통할 수 있나요?",
        "유심을 재발급받고 싶어요.", "통화가 연결되지 않아요.", "소액결제 한도를 변경하고 싶습니다.",
        "요금제 해지 방법이 궁금해요.", "해외에서 로밍을 신청하는 방법을 알고 싶어요.", "문자가 발송되지 않아요.",
        "5G가 LTE로 연결되는 이유가 궁금합니다.", "청구서의 상세 내역을 확인하고 싶어요.",
    ],
    "MC": [
        "해외에서 데이터 잔여량을 확인하고 초과 시 차단하고 싶어요.", "휴대폰을 분실해서 회선을 정지하고 유심도 재발급받고 싶습니다.",
        "번호는 유지하면서 새 단말기로 변경하고 싶어요.", "청구 금액을 확인하고 자동이체 카드도 바꾸고 싶습니다.",
        "eSIM을 발급받아 새 휴대폰에서 개통하고 싶어요.", "데이터가 느려진 원인과 확인 방법을 알고 싶습니다.",
        "해외에서 로밍을 사용하면서 와이파이도 이용하고 싶어요.", "온라인 개통 후 기존 번호를 그대로 사용하고 싶습니다.",
        "요금제를 해지하고 단말기를 계속 사용할 수 있는지 궁금해요.", "번호 변경 방법과 변경 후 제한사항을 알고 싶어요.",
        "문자와 통화가 모두 안 될 때 점검 순서를 알려주세요.", "소액결제 한도를 확인하고 변경하고 싶습니다.",
        "청구서 항목과 결제 예정일을 함께 확인하고 싶어요.", "유심 없이 사용할 수 있는 단말과 개통 방법이 궁금합니다.",
        "해외 데이터 사용량과 로밍 신청 방법을 알려주세요.", "5G가 연결되지 않을 때 단말과 네트워크를 확인하고 싶어요.",
        "분실 후 회선 정지와 번호 복구 가능 여부를 알고 싶습니다.",
    ],
}


def faq_context(ids, labels=None):
    labels = labels or {}
    return " / ".join(f"{faq_id} {labels.get(faq_id, '관련 FAQ')}" for faq_id in ids)


def rag_rows():
    rows = []
    for code, (kind, intent, expected, failure) in RAG_TYPES.items():
        questions = QUESTION_BANK[code]
        for tier, count in (("Small", 2), ("Medium", 5), ("Large", 10)):
            for offset, question in enumerate(questions, start=1):
                suffix = (9 if tier == "Small" else 26 if tier == "Medium" else 43) + offset
                case_id = f"{code}-{suffix:02d}"
                if code == "EC":
                    context = "EMPTY"
                    ref = "NONE"
                    context_count = 0
                elif code == "HR":
                    context_ids = ["FAQ-020", "FAQ-041"] if tier == "Small" else ["FAQ-020", "FAQ-041", "FAQ-063", "FAQ-077", "FAQ-081"] if tier == "Medium" else ["FAQ-020", "FAQ-041", "FAQ-063", "FAQ-077", "FAQ-081", "FAQ-012", "FAQ-037", "FAQ-054", "FAQ-069", "FAQ-090"]
                    context = faq_context(context_ids)
                    ref = "NONE"
                    context_count = count
                elif code == "CF":
                    context_ids = ["FAQ-020", "FAQ-020-CONFLICT"] if tier == "Small" else ["FAQ-020", "FAQ-020-CONFLICT", "FAQ-021", "FAQ-037", "FAQ-095"] if tier == "Medium" else ["FAQ-020", "FAQ-020-CONFLICT", "FAQ-021", "FAQ-037", "FAQ-095", "FAQ-028", "FAQ-030", "FAQ-051", "FAQ-054", "FAQ-057"]
                    context = faq_context(context_ids, {"FAQ-020-CONFLICT": "상충 내용"})
                    ref = "FAQ-020"
                    context_count = count
                elif code == "PI":
                    context_ids = ["FAQ-020"] if tier == "Small" else ["FAQ-020", "FAQ-021", "FAQ-023", "FAQ-037", "FAQ-095"] if tier == "Medium" else ["FAQ-020", "FAQ-021", "FAQ-023", "FAQ-037", "FAQ-095", "FAQ-028", "FAQ-030", "FAQ-031", "FAQ-032", "FAQ-033"]
                    context = faq_context(context_ids)
                    ref = "FAQ-020"
                    context_count = count
                elif code == "SR":
                    context_ids = ["FAQ-028", "FAQ-030"] if tier == "Small" else ["FAQ-028", "FAQ-030", "FAQ-031", "FAQ-032", "FAQ-033"] if tier == "Medium" else ["FAQ-028", "FAQ-030", "FAQ-031", "FAQ-032", "FAQ-033", "FAQ-027", "FAQ-034", "FAQ-035", "FAQ-095", "FAQ-077"]
                    context = faq_context(context_ids)
                    ref = "NONE"
                    context_count = count
                elif code == "NC":
                    context_ids = ["FAQ-020", "FAQ-041"] if tier == "Small" else ["FAQ-020", "FAQ-041", "FAQ-063", "FAQ-077", "FAQ-081"] if tier == "Medium" else ["FAQ-020", "FAQ-041", "FAQ-063", "FAQ-077", "FAQ-081", "FAQ-012", "FAQ-037", "FAQ-054", "FAQ-069", "FAQ-090"]
                    context = faq_context(context_ids)
                    ref = "FAQ-020"
                    context_count = count
                else:  # MC
                    context_ids = ["FAQ-020", "FAQ-019"] if tier == "Small" else ["FAQ-020", "FAQ-019", "FAQ-021", "FAQ-028", "FAQ-030"] if tier == "Medium" else ["FAQ-020", "FAQ-019", "FAQ-021", "FAQ-028", "FAQ-030", "FAQ-031", "FAQ-032", "FAQ-033", "FAQ-037", "FAQ-095"]
                    context = faq_context(context_ids)
                    ref = "FAQ-020, FAQ-019"
                    context_count = count
                rows.append([case_id, kind, tier, question, context, context_count, ref, expected, failure, intent, f"{tier} Context에서 {kind} 처리"])
    return rows


def main():
    first = os.path.join(RAW, "EmbeddingTestFAQ.xlsx")
    second = os.path.join(RAW, "faq_rag_stability_expanded_63.xlsx")
    first_additions = {
        "Retrieval Easy": retrieval_rows(EASY),
        "Retrieval Medium": retrieval_rows(MEDIUM),
        "Retrieval Hard": retrieval_rows(HARD),
    }
    replace_workbook(first, first_additions)
    replace_workbook(second, {"RAG 안정성 63건": rag_rows()})
    print("Expanded evaluation workbooks successfully.")
    print("EmbeddingTestFAQ.xlsx: Easy/Medium/Hard = 20 each")
    print("faq_rag_stability_expanded_63.xlsx: 7 types x 3 tiers x 20 = 420")


if __name__ == "__main__":
    main()
