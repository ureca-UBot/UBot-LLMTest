import os
import tempfile
import zipfile
import xml.etree.ElementTree as ET

MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
DOC_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS = {"a": MAIN}
ET.register_namespace("", MAIN)


def main():
    path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "raw", "EmbeddingTestFAQ.xlsx")
    with zipfile.ZipFile(path, "r") as z:
        files = {name: z.read(name) for name in z.namelist()}

    ss_path = "xl/sharedStrings.xml"
    ss_root = ET.fromstring(files[ss_path])
    values = ["".join(t.text or "" for t in si.iterfind(".//a:t", NS)) for si in ss_root.findall("a:si", NS)]
    indexes = {value: i for i, value in enumerate(values)}

    def string_index(value):
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

    for sheet in wb.find("a:sheets", NS):
        name = sheet.attrib["name"]
        if name not in {"Retrieval Easy", "Retrieval Medium", "Retrieval Hard"}:
            continue
        target = relmap[sheet.attrib[f"{{{DOC_REL}}}id"]]
        sheet_path = target if target.startswith("xl/") else "xl/" + target
        root = ET.fromstring(files[sheet_path])
        rows = root.find("a:sheetData", NS).findall("a:row", NS)
        label = f"{name} 추가 테스트"
        for row in rows[1:]:
            cells = row.findall("a:c", NS)
            if len(cells) >= 7:
                continue
            # The appended rows have six cells: the last value is the detailed intent.
            # Restore the seventh, human-readable test-point column.
            row_number = row.attrib["r"]
            cell = ET.SubElement(row, f"{{{MAIN}}}c", {"r": f"G{row_number}", "t": "s"})
            value = ET.SubElement(cell, f"{{{MAIN}}}v")
            value.text = str(string_index(label))
            row.attrib["spans"] = "1:7"
        dimension = root.find("a:dimension", NS)
        if dimension is not None:
            dimension.attrib["ref"] = f"A1:G{len(rows)}"
        files[sheet_path] = ET.tostring(root, encoding="utf-8", xml_declaration=True)

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
