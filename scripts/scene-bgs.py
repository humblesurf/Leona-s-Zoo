import pathlib
import re

root = pathlib.Path(__file__).resolve().parents[1] / "geo" / "assets"
files = [
    "game-data.js",
    "exploration-data.js",
    "chapters-data.js",
    "revisions-data.js",
    "revisions-v4-11.js",
]
text = "\n".join((root / name).read_text(encoding="utf-8") for name in files)
wanted = ["savanna", "rainforest", "ocean", "polar", "farm", "market", "music", "supermarket", "hongkong", "beach", "weather", "planets", "harbor", "camp", "space"]
for sid in ["farm", "market", "polar"]:
    i = text.rfind(f'"{sid}":')
    print("\nRAW", sid, i)
    if i >= 0:
        print(text[i:i+650])
for sid in wanted:
    key = f'"{sid}":{{"id":"{sid}"'
    i = text.rfind(key)
    print("\n==", sid, "found" if i >= 0 else "MISSING", "==")
    if i < 0:
        continue
    chunk = text[i : i + 1200]
    for pat in ["numScreens", "bgAspect", "bgMirror", "sectionBlend", "panorama"]:
        m = re.search(rf'"{pat}":([^,}}]+)', chunk)
        if m:
            print(pat, m.group(1)[:80])
    panels = re.search(r'"bgPanels":\[(.*?)\]', chunk)
    if panels:
        print("panels", re.findall(r'assets/[^"]+', panels.group(1)))
    strip = re.search(r'"bgStrip":"([^"]+)"', chunk)
    if strip:
        print("strip", strip.group(1))
    if '"sections":[' in chunk:
        print("HAS sections in first 1200 chars")
