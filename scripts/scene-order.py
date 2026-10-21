import pathlib
root = pathlib.Path(__file__).resolve().parents[1] / "geo" / "assets"
for name in ["game-data.js", "exploration-data.js", "chapters-data.js", "revisions-data.js", "revisions-v4-11.js"]:
    text = (root / name).read_text(encoding="utf-8")
    i = text.rfind("GAME_SCENE_ORDER")
    print(name, text[i:i+400].replace("\n", " ") if i >= 0 else "none")
