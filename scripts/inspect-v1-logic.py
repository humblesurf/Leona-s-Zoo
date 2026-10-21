import json, re, pathlib
p = pathlib.Path(r"C:\Users\XTIA\OneDrive - AEDAS LTD\AI Project_Aedas\toddler-animals\share\Leonas-Zoo.html")
text = p.read_text(encoding="utf-8", errors="replace")
# scenes
m = re.search(r"window\.GAME_SCENES = (\{.*?\});\s*", text)
scenes = json.loads(m.group(1))
print("SCENES")
for sid, sc in scenes.items():
    ids = [a["id"] for a in sc.get("animals", [])]
    print(sid, "screens", sc.get("numScreens"), "bg", sc.get("bgStrip") or sc.get("bgPanels"), "n", len(ids))
    print(" ", ids)
# dialogue keys
m = re.search(r"window\.GAME_DIALOGUE = (\{.*?\});\s*", text)
if m:
    d = json.loads(m.group(1))
    print("DIALOGUE", len(d), sorted(d)[:8])
# animation
for name in ("ANIMAL_ANIMATIONS", "ANIMATIONS", "GAME_ANIMS"):
    if name in text:
        print("found", name)
# find script src vs inline
print("script tags", len(re.findall(r"<script", text)))
# polar?
print("polar" in text, "farm" in text, "market" in text)
