"""Package share/runtime-v7 from the current geo app. V6 files are not replaced."""
import json
import pathlib
import shutil
import subprocess
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
GEO = ROOT / "geo"
OUT = ROOT / "share"
RUNTIME = OUT / "runtime-v7"

if RUNTIME.exists():
    subprocess.run(["cmd", "/c", "rmdir", "/s", "/q", str(RUNTIME)], check=True)
RUNTIME.mkdir(parents=True)
shutil.copy2(GEO / "index.html", RUNTIME / "index.html")

def skip_source(path, names):
    return [name for name in names if name == "source"]

shutil.copytree(GEO / "assets", RUNTIME / "assets", ignore=skip_source)

readme = """Leona's ZOO · V7

画面回到第一版：原来的动物图，以及草原、雨林、海底三张背景。
场景、分类、点按互动、配音、叫声和背景音乐仍用现在这一版。
四足走路的那套原画没有带回来。

第一版里没有的动物和后来新增的场景，仍用现在的图。
打开本文件夹的 index.html。对比第一版：../Leonas-Zoo.html
"""
(RUNTIME / "README.txt").write_text(readme, encoding="utf-8")

names = [p.relative_to(RUNTIME).as_posix() for p in RUNTIME.rglob("*") if p.is_file()]
zip_path = OUT / "Leonas-Zoo-v7.zip"
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for name in sorted(set(names)):
        zf.write(RUNTIME / name, name)

report = {
    "version": "V7",
    "base": "current app, V6 interaction and audio",
    "visual": "version 1 animals and savanna, rainforest, ocean backgrounds",
    "quadrupedWalk": "not restored",
    "zipBytes": zip_path.stat().st_size,
    "files": len(names),
}
(OUT / "build-v7.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps(report, indent=2))
