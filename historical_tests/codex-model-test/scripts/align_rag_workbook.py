import os
import tempfile
import zipfile
import xml.etree.ElementTree as ET

MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
DOC_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS = {"a": MAIN}
ET.register_namespace("", MAIN)


def main():
    path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "raw", "faq_rag_stability_expanded_63.xlsx")
    with zipfile.ZipFile(path, "r") as z:
        files = {name: z.read(name) for name in z.namelist()}

    ss_path = "xl/sharedStrings.xml"
    ss_root = ET.fromstring(files[ss_path])
    values = ["".join(t.text or "" for t in si.iterfind(".//a:t", NS)) for si in ss_root.findall("a:si", NS)]
    indexes = {value: i for i, value in enumerate(values)}

    def string_index(value):
        value = str(value)
        if value in indexes:
            return indexes[value]
        si = ET.SubElement(ss_root, f"{{{MAIN}}}si")
        t = ET.SubElement(si, f"{{{MAIN}}}t")
        t.text = value
        indexes[value] = len(values)
        values.append(value)
        ss_root.attrib["count"] = str(len(values))
        ss_root.attrib["uniqueCount"] = str(len(values))
        return indexes[value]

    wb = ET.fromstring(files["xl/workbook.xml"])
    rels = ET.fromstring(files["xl/_rels/workbook.xml.rels"])
    relmap = {x.attrib["Id"]: x.attrib["Target"].lstrip("/") for x in rels}
    paths = {}
    for sheet in wb.find("a:sheets", NS):
        target = relmap[sheet.attrib[f"{{{DOC_REL}}}id"]]
        paths[sheet.attrib["name"]] = target if target.startswith("xl/") else "xl/" + target

    def cell_text(cell):
        value = cell.find("a:v", NS)
        if value is None:
            return ""
        return values[int(value.text)] if cell.attrib.get("t") == "s" else (value.text or "")

    rag_root = ET.fromstring(files[paths[next(name for name in paths if "RAG" in name)]])
    rag_rows = rag_root.find("a:sheetData", NS).findall("a:row", NS)[1:]
    rag_records = []
    for row in rag_rows:
        cells = row.findall("a:c", NS)
        vals = [cell_text(c) for c in cells]
        if len(vals) >= 3:
            rag_records.append(vals[:3])

    template_path = paths[next(name for name in paths if "입력" in name)]
    template_root = ET.fromstring(files[template_path])
    sheet_data = template_root.find("a:sheetData", NS)
    template_rows = sheet_data.findall("a:row", NS)
    existing = {cell_text(row.findall("a:c", NS)[0]) for row in template_rows[1:] if row.findall("a:c", NS)}
    next_row = max((int(row.attrib.get("r", "0")) for row in template_rows), default=0) + 1
    for case_id, case_type, tier in rag_records:
        if case_id in existing:
            continue
        row = ET.SubElement(sheet_data, f"{{{MAIN}}}row", {"r": str(next_row)})
        values_for_row = [case_id, case_type, tier, "", "", "", "", "", "", ""]
        for col, value in enumerate(values_for_row, start=1):
            cell = ET.SubElement(row, f"{{{MAIN}}}c", {"r": f"{chr(64 + col)}{next_row}", "t": "s"})
            v = ET.SubElement(cell, f"{{{MAIN}}}v")
            v.text = str(string_index(value))
        next_row += 1
    dimension = template_root.find("a:dimension", NS)
    if dimension is not None:
        dimension.attrib["ref"] = f"A1:J{next_row - 1}"
    files[template_path] = ET.tostring(template_root, encoding="utf-8", xml_declaration=True)

    summary_path = paths[next(name for name in paths if name not in ["요약"] and False)] if False else None
    summary_name = next(name for name in paths if name == "요약") if "요약" in paths else list(paths)[4]
    summary_path = paths[summary_name]
    summary_root = ET.fromstring(files[summary_path])
    updates = {"B2": "420", "B5": "140", "B6": "140", "B7": "140"}
    for cell in summary_root.findall(".//a:c", NS):
        ref = cell.attrib.get("r")
        if ref in updates:
            cell.attrib["t"] = "s"
            value = cell.find("a:v", NS)
            if value is None:
                value = ET.SubElement(cell, f"{{{MAIN}}}v")
            value.text = str(string_index(updates[ref]))
    files[summary_path] = ET.tostring(summary_root, encoding="utf-8", xml_declaration=True)
    files[ss_path] = ET.tostring(ss_root, encoding="utf-8", xml_declaration=True)

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


if __name__ == "__main__":
    main()
