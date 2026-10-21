import pathlib
import re

root = pathlib.Path(__file__).resolve().parents[1] / "geo" / "assets"
files = [
    "game-data.js",
    "revisions-data.js",
    "revisions-v4-11.js",
    "exploration-data.js",
    "chapters-data.js",
]
text = "\n".join((root / name).read_text(encoding="utf-8") for name in files)
ids = list(dict.fromkeys(re.findall(r'\{"id":"([a-z0-9]+)"', text)))
print("scene ids", ids)
for sid in ids:
    positions = [m.start() for m in re.finditer(rf'\{{"id":"{sid}"', text)]
    i = positions[-1]
    chunk = text[i : i + 2500]
    def grab(key):
        m = re.search(rf'"{key}":("[^"]+"|\d+|true|false)', chunk)
        return m.group(1) if m else None
    has_sections = '"sections":' in chunk[:1800]
    panels = re.search(r'"bgPanels":\[(.*?)\]', chunk)
    panel_n = panels.group(1).count("assets/") if panels else 0
    print(
        f"{sid:16} screens={grab('numScreens')} aspect={grab('bgAspect')} "
        f"mirror={grab('bgMirror')} sections={has_sections} panels={panel_n} "
        f"strip={grab('bgStrip')}"
    )
