import json, re, pathlib
p = pathlib.Path(r"C:\Users\XTIA\OneDrive - AEDAS LTD\AI Project_Aedas\toddler-animals\geo\assets\game-data.js")
t = p.read_text(encoding="utf-8")
m = re.search(r"window\.GAME_SCENES = (\{.*\});", t, re.S)
d = json.loads(m.group(1))
for sid, sc in d.items():
    for a in sc.get("animals", []):
        if a.get("id") in ("toucan", "elephant", "hippo", "zebra", "macaw"):
            keys = ("id", "feetY", "h", "support", "special", "flip", "x", "screen", "gripY", "u")
            print(sid, {k: a.get(k) for k in keys})

rev = pathlib.Path(r"C:\Users\XTIA\OneDrive - AEDAS LTD\AI Project_Aedas\toddler-animals\geo\assets\revisions-v4-11.js")
rt = rev.read_text(encoding="utf-8")
print("--- revisions toucan ---")
for m in re.finditer(r"\{[^{}]*toucan[^{}]*\}", rt):
    print(m.group(0)[:500])
