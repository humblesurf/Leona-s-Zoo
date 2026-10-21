import base64, json, re, pathlib
root = pathlib.Path(r"C:\Users\XTIA\OneDrive - AEDAS LTD\AI Project_Aedas\toddler-animals")
html = (root / "share" / "Leonas-Zoo.html").read_text(encoding="utf-8")
m = re.search(r"window\.ASSET = (\{.*?\});\s*", html)
raw = m.group(1)
# keys and data urls without loading the whole json if possible
# The object is valid JSON.
data = json.loads(raw)
out = root / "geo" / "assets" / "v1"
want = [
    "assets/bg/savanna-strip.webp",
    "assets/bg/rainforest-strip.webp",
    "assets/bg/ocean-strip.webp",
    "assets/fg/fg-strip.webp",
    "assets/animals/lion.webp",
    "assets/animals/zebra.webp",
    "assets/animals/cheetah.webp",
    "assets/animals/giraffe.webp",
    "assets/animals/toucan.webp",
    "assets/animals/elephant.webp",
    "assets/animals/hippo.webp",
]
for key, url in data.items():
    rel = key
    dest = out / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    b64 = url.split(",", 1)[1]
    dest.write_bytes(base64.b64decode(b64))
print("wrote", len(data), "files to", out)
for key in want:
    p = out / key
    print(key, p.stat().st_size if p.exists() else "MISSING")
