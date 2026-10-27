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
    sheet_path = None
    for sheet in wb.find("a:sheets", NS):
        if "RAG" in sheet.attrib["name"]:
            target = relmap[sheet.attrib[f"{{{DOC_REL}}}id"]]
            sheet_path = target if target.startswith("xl/") else "xl/" + target
            break
    root = ET.fromstring(files[sheet_path])
    rows = root.find("a:sheetData", NS).findall("a:row", NS)
    ec_label = string_index("빈 컨텍스트")
    nc_label = string_index("정답+노이즈")

    def cell_text(cell):
        value = cell.find("a:v", NS)
        if value is None:
            return ""
        if cell.attrib.get("t") == "s":
            return values[int(value.text)]
        return value.text or ""

    for row in rows[1:]:
        cells = row.findall("a:c", NS)
        if len(cells) < 2:
            continue
        id_v = cells[0].find("a:v", NS)
        type_v = cells[1].find("a:v", NS)
        if id_v is None or type_v is None:
            continue
        id_value = cell_text(cells[0])
        if id_value.startswith("EC-"):
            cells[1].attrib["t"] = "s"
            type_v.text = str(ec_label)
        elif id_value.startswith("NC-"):
            cells[1].attrib["t"] = "s"
            type_v.text = str(nc_label)

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
