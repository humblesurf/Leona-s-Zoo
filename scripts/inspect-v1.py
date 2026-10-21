import re, pathlib
p = pathlib.Path(r"C:\Users\XTIA\OneDrive - AEDAS LTD\AI Project_Aedas\toddler-animals\share\Leonas-Zoo.html")
text = p.read_text(encoding="utf-8", errors="replace")
print("bytes", p.stat().st_size)
# asset keys
m = re.search(r"window\.ASSET = (\{)", text)
print("asset at", m.start() if m else None)
# keys only
keys = re.findall(r'"(assets/[^"]+)"\s*:', text)
print("asset keys", len(keys))
for k in keys:
    if not k.endswith(".mp3") and "voice" not in k:
        print(" ", k)
print("--- audio/voice count", sum(1 for k in keys if k.endswith(".mp3") or "voice" in k))
# scenes
sm = re.search(r'window\.GAME_SCENES = (\{.*?\})\s*;\s*\n', text)
print("scenes match", bool(sm), "len", len(sm.group(1)) if sm else 0)
