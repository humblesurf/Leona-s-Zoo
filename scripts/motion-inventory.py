import pathlib
import re

root = pathlib.Path(__file__).resolve().parents[1] / "geo" / "assets"
files = [
    "animation-data.js",
    "animal-fixes-v4-10.js",
    "animal-styles-v4-11.js",
    "ocean-styles-v4-11.js",
    "farm-goose-v4-11.js",
    "motion-v4-11.js",
    "hoof-motion-v4-12.js",
    "authored-motion-data.js",
    "walk-v6.js",
]
text = "\n".join((root / name).read_text(encoding="utf-8") for name in files)
# Last assignment of each animal object that contains a label.
found = {}
for match in re.finditer(r'"([a-z0-9]+)":\{', text):
    ident = match.group(1)
    start = match.end() - 1
    depth = 0
    for i, ch in enumerate(text[start:start + 200000], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                blob = text[start:i + 1]
                if '"label"' in blob or '"motion"' in blob or '"walk"' in blob:
                    label = re.search(r'"label":"([^"]*)"', blob)
                    motion = re.search(r'"motion":"([^"]*)"', blob)
                    walk = '"walk":true' in blob
                    rig = '"walk":false' not in blob and '"rig":true' in blob
                    cel = '"cel":{' in blob
                    found[ident] = {
                        "label": label.group(1) if label else "",
                        "motion": motion.group(1) if motion else "",
                        "walk": walk,
                        "rig": rig and not cel,
                        "cel": cel,
                    }
                break
for ident, info in sorted(found.items()):
    print(f"{ident:18} cel={int(info['cel'])} walk={int(info['walk'])} rig={int(info['rig'])} motion={info['motion']:8} {info['label']}")
