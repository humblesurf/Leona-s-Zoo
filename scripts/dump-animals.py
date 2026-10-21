import re, json
from pathlib import Path
root = Path(r"C:\Users\XTIA\OneDrive - AEDAS LTD\AI Project_Aedas\toddler-animals\geo\assets")
# toucan from revisions by string search
text = (root / "revisions-v4-11.js").read_text(encoding="utf-8")
for m in re.finditer(r'\{"id":"(toucan|macaw|hippo|elephant)"[^}]+\}', text):
    print("rev", m.group(0)[:400])
print("--- game-data ---")
gd = (root / "game-data.js").read_text(encoding="utf-8")
for m in re.finditer(r'\{"id":"(toucan|macaw|hippo|elephant)"[^}]+\}', gd):
    print("gd", m.group(0)[:400])
print("--- anim keys ---")
auth = (root / "authored-motion-data.js").read_text(encoding="utf-8")
for id in ("hippo", "elephant", "elephantcalf", "toucan"):
    m = re.search(rf'"{id}":\{{(.*?)\n', auth)
    print("authored", id, "found" if f'"{id}":' in auth else "no")
anim = (root / "animation-data.js").read_text(encoding="utf-8")
for id in ("hippo", "elephant", "toucan"):
    m = re.search(rf'"{id}":\{{"sheet":(.*?),', anim)
    print("anim-data", id, m.group(0)[:220] if m else "no")
