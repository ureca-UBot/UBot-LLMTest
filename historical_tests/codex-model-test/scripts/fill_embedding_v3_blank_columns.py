import os
import tempfile
import zipfile
import xml.etree.ElementTree as ET

MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
DOC_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS = {"a": MAIN}
ET.register_namespace("", MAIN)

MEDIUM = {
    "M11": "FAQ-028, FAQ-030",
    "M12": "FAQ-009, FAQ-011",
    "M13": "FAQ-007, FAQ-008",
    "M14": "FAQ-040",
    "M15": "FAQ-052, FAQ-054",
    "M16": "FAQ-015, FAQ-016",
    "M17": "FAQ-059, FAQ-061",
    "M18": "FAQ-086, FAQ-088",
    "M19": "FAQ-028, FAQ-030",
    "M20": "FAQ-039, FAQ-050",
}

HARD_ACCEPTABLE = {
    "H08": "FAQ-006",
    "H11": "FAQ-028",
    "H12": "FAQ-009",
    "H13": "FAQ-007",
    "H14": "FAQ-040",
    "H15": "FAQ-054",
    "H16": "FAQ-015",
    "H17": "FAQ-059",
    "H18": "FAQ-088",
    "H19": "FAQ-028",
    "H20": "FAQ-039",
}

HARD_NEGATIVE = {
    "H08": "FAQ-063, FAQ-064, FAQ-005",
    "H11": "FAQ-030, FAQ-031, FAQ-032",
    "H12": "FAQ-012, FAQ-013",
    "H13": "FAQ-002, FAQ-003, FAQ-008",
    "H14": "FAQ-043, FAQ-044",
    "H15": "FAQ-052, FAQ-057",
    "H16": "FAQ-010, FAQ-011, FAQ-016",
    "H17": "FAQ-061, FAQ-062",
    "H18": "FAQ-086, FAQ-090",
    "H19": "FAQ-030, FAQ-033",
    "H20": "FAQ-038, FAQ-050",
}


def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    source_path = os.path.join(root_dir, "data", "raw", "EmbeddingTestFAQ_v3.xlsx")
    output_path = os.path.join(root_dir, "data", "raw", "EmbeddingTestFAQ_v3_filled.xlsx")
    path = source_path
    with zipfile.ZipFile(source_path, "r") as z:
        files = {name: z.read(name) for name in z.namelist()}

    ss_path = "xl/sharedStrings.xml"
    ss_root = ET.fromstring(files[ss_path])
    strings = ["".join(t.text or "" for t in si.iterfind(".//a:t", NS)) for si in ss_root.findall("a:si", NS)]
    indexes = {value: i for i, value in enumerate(strings)}

    def string_index(value):
        if value in indexes:
            return indexes[value]
        si = ET.SubElement(ss_root, f"{{{MAIN}}}si")
        t = ET.SubElement(si, f"{{{MAIN}}}t")
        t.text = value
        indexes[value] = len(strings)
        strings.append(value)
        ss_root.attrib["uniqueCount"] = str(len(strings))
        return indexes[value]

    def cell_text(cell):
        value = cell.find("a:v", NS)
        if value is None:
            return ""
        if cell.attrib.get("t") == "s":
            return strings[int(value.text)]
        return value.text or ""

    wb = ET.fromstring(files["xl/workbook.xml"])
    rels = ET.fromstring(files["xl/_rels/workbook.xml.rels"])
    relmap = {x.attrib["Id"]: x.attrib["Target"].lstrip("/") for x in rels}

    for sheet in wb.find("a:sheets", NS):
        sheet_name = sheet.attrib["name"]
        if sheet_name not in {"Retrieval Medium", "Retrieval Hard"}:
            continue
        target = relmap[sheet.attrib[f"{{{DOC_REL}}}id"]]
        sheet_path = target if target.startswith("xl/") else "xl/" + target
        root = ET.fromstring(files[sheet_path])
        updates = MEDIUM if sheet_name == "Retrieval Medium" else None
        for row in root.find("a:sheetData", NS).findall("a:row", NS):
            cells = row.findall("a:c", NS)
            if not cells:
                continue
            row_id = cell_text(cells[0])
            if sheet_name == "Retrieval Medium" and row_id in MEDIUM:
                updates_for_row = {"D": MEDIUM[row_id]}
            elif sheet_name == "Retrieval Hard" and row_id in HARD_ACCEPTABLE:
                updates_for_row = {"D": HARD_ACCEPTABLE[row_id], "E": HARD_NEGATIVE[row_id]}
            else:
                continue
            by_ref = {cell.attrib.get("r", ""): cell for cell in cells}
            row_number = row.attrib["r"]
            for col, text in updates_for_row.items():
                ref = f"{col}{row_number}"
                cell = by_ref.get(ref)
                if cell is None:
                    cell = ET.SubElement(row, f"{{{MAIN}}}c", {"r": ref, "t": "s"})
                else:
                    cell.attrib["t"] = "s"
                value = cell.find("a:v", NS)
                if value is None:
                    value = ET.SubElement(cell, f"{{{MAIN}}}v")
                value.text = str(string_index(text))
        files[sheet_path] = ET.tostring(root, encoding="utf-8", xml_declaration=True)

    # Recalculate shared-string reference count for Excel compatibility.
    total_refs = 0
    for name, data in files.items():
        if name.startswith("xl/worksheets/") and name.endswith(".xml"):
            root = ET.fromstring(data)
            total_refs += sum(1 for cell in root.findall(".//a:c", NS) if cell.attrib.get("t") == "s")
    ss_root.attrib["count"] = str(total_refs)
    ss_root.attrib["uniqueCount"] = str(len(strings))
    files[ss_path] = ET.tostring(ss_root, encoding="utf-8", xml_declaration=True)

    fd, temp_path = tempfile.mkstemp(suffix=".xlsx", dir=os.path.dirname(path))
    os.close(fd)
    try:
        with zipfile.ZipFile(temp_path, "w", zipfile.ZIP_DEFLATED) as z:
            for name, data in files.items():
                z.writestr(name, data)
        os.replace(temp_path, output_path)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


if __name__ == "__main__":
    main()
