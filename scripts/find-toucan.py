import json, re
from pathlib import Path
text = Path(r"C:\Users\XTIA\OneDrive - AEDAS LTD\AI Project_Aedas\toddler-animals\geo\assets\revisions-v4-11.js").read_text(encoding="utf-8")
# pull GAME_SCENES object
m = re.search(r"Object\.assign\(g\.GAME_SCENES,(\{.*\})\);", text)
raw = m.group(1)
# JS to JSON-ish: already double quoted
data = json.loads(raw)
for sid, sc in data.items():
    for a in sc.get("animals", []):
        if a.get("id") in ("toucan", "macaw", "hippo", "elephant"):
            print(sid, {k: a.get(k) for k in ("id", "u", "feetY", "h", "support", "special", "flip", "idle")})
