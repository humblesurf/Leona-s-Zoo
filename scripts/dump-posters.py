import json, re, pathlib
root = pathlib.Path(r"C:\Users\XTIA\OneDrive - AEDAS LTD\AI Project_Aedas\toddler-animals\geo\assets")
auth = json.loads(re.search(r"Object\.assign\(window\.ANIMAL_ANIMATIONS, (\{.*\})\);", (root/"authored-motion-data.js").read_text(encoding="utf-8"), re.S).group(1))
for i in ("elephant", "hippo", "zebra", "warthog", "lioness"):
    d = auth.get(i, {})
    print(i, d.get("poster"), "sheet", d.get("sheet"))
