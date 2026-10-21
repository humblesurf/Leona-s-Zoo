import json, re, pathlib
root = pathlib.Path(r"C:\Users\XTIA\OneDrive - AEDAS LTD\AI Project_Aedas\toddler-animals\geo\assets")
text = (root / "game-data.js").read_text(encoding="utf-8")
m = re.search(r"window\.GAME_SCENES = (\{.*\});", text, re.S)
scenes = json.loads(m.group(1))
print("BASE SCENES", len(scenes))
for sid, sc in scenes.items():
    bgs = sc.get("bgPanels") or sc.get("bgStrip")
    ids = sorted({a["id"] for a in sc.get("animals", [])})
    print(f"\n{sid} bg={bgs}")
    print(" ", ids)
