import os
import tempfile
import zipfile
import xml.etree.ElementTree as ET

MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS = {"a": MAIN}
ET.register_namespace("", MAIN)


def repair(path):
    with zipfile.ZipFile(path, "r") as z:
        files = {name: z.read(name) for name in z.namelist()}
    ss_path = "xl/sharedStrings.xml"
    ss_root = ET.fromstring(files[ss_path])
    total = 0
    for name, data in files.items():
        if not name.startswith("xl/worksheets/") or not name.endswith(".xml"):
            continue
        root = ET.fromstring(data)
        total += sum(1 for cell in root.findall(".//a:c", NS) if cell.attrib.get("t") == "s")
    ss_root.attrib["count"] = str(total)
    ss_root.attrib["uniqueCount"] = str(len(ss_root.findall("a:si", NS)))
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
    root = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "raw")
    repair(os.path.join(root, "EmbeddingTestFAQ.xlsx"))
    repair(os.path.join(root, "faq_rag_stability_expanded_63.xlsx"))
