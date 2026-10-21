import re
from pathlib import Path
root = Path(r"C:\Users\XTIA\OneDrive - AEDAS LTD\AI Project_Aedas\toddler-animals\geo\assets")
for fname in ("animation-data.js", "authored-motion-data.js", "animal-fixes-v4-10.js"):
    text = (root / fname).read_text(encoding="utf-8")
    for id in ("hippo", "toucan", "elephant", "crocodile"):
        m = re.search(rf'"{id}":(\{{(?:[^{{}}]|\\.)*?\}})(?=,"[a-z])', text)
        if not m:
            m = re.search(rf'"{id}":(\{{.*?\}})(?=,"[a-z])', text)
        print("==", fname, id)
        if m:
            s = m.group(1)
            print(s[:500])
        else:
            print("missing")
        print()
