"""Fit flat restyle paintings to the exact size of the backgrounds they replace."""
from PIL import Image
from pathlib import Path

root = Path(__file__).resolve().parents[1]
gen = Path(r"C:\Users\XTIA\.cursor\projects\c-Users-XTIA-OneDrive-AEDAS-LTD-AI-Project-Aedas-toddler-animals\assets")
out = root / "geo" / "assets" / "v1" / "restyle"
out.mkdir(parents=True, exist_ok=True)

jobs = [
    # name, source, target size (w, h), crop: bottom | center | top
    ("farm", gen / "farm-v1-style.jpg", (2172, 724), "bottom"),
    ("arctic", gen / "arctic-v1-style.jpg", (1672, 941), "center"),
    ("antarctic", gen / "antarctic-v1-style.jpg", (1672, 941), "center"),
    ("music", gen / "music-room-v1-style.jpg", (2172, 724), "center"),
    ("market", gen / "market-empty-v1-style.jpg", (2172, 724), "bottom"),
    ("beach", gen / "beach-v1-style.jpg", (2172, 724), "center"),
    ("supermarket", gen / "supermarket-v1-style.jpg", (2172, 724), "center"),
    ("hongkong", gen / "hongkong-v1-style.jpg", (4134, 724), "lower"),
    ("camp", gen / "camp-v1-style.jpg", (2172, 724), "bottom"),
    ("planets", gen / "planets-v1-style.jpg", (2172, 724), "center"),
    ("weather", gen / "weather-v1-style.jpg", (2170, 723), "bottom"),
    ("harbor", gen / "harbor-v1-style.jpg", (2172, 724), "center"),
    ("moon", gen / "moon-v1-style.jpg", (2172, 724), "bottom"),
]

def fit(im, size, mode):
    im = im.convert("RGB")
    tw, th = size
    sw, sh = im.size
    target = tw / th
    src = sw / sh
    if abs(src - target) < 0.04:
        return im.resize((tw, th), Image.Resampling.LANCZOS)
    if src < target:
        nh = int(round(sw / target))
        nh = min(nh, sh)
        extra = sh - nh
        if mode == "bottom":
            top = extra
        elif mode == "top":
            top = 0
        elif mode == "lower":
            top = int(extra * 0.72)
        else:
            top = extra // 2
        im = im.crop((0, top, sw, top + nh))
    else:
        nw = int(round(sh * target))
        nw = min(nw, sw)
        left = (sw - nw) // 2
        im = im.crop((left, 0, left + nw, sh))
    return im.resize((tw, th), Image.Resampling.LANCZOS)

for name, src, size, mode in jobs:
    image = fit(Image.open(src), size, mode)
    dest = out / f"{name}.webp"
    image.save(dest, "WEBP", quality=82, method=6)
    thumb = image.copy()
    thumb.thumbnail((1200, 420))
    thumb.save(Path(r"C:\Temp") / f"restyle-{name}.jpg", quality=85)
    print(name, image.size, dest.stat().st_size)
