from pathlib import Path
from collections import defaultdict
from PIL import Image
import json

root = Path(r"C:\Users\XTIA\OneDrive - AEDAS LTD\AI Project_Aedas\toddler-animals\geo")
jobs = [
    ("zebra", "assets/animation/v4-12-gait/zebra-sheet.webp", 900, 682, 8),
    ("zebra7", "assets/animation/v4-7/zebra-frames.webp", 512, 385, 4),
    ("lioness", "assets/animation/v4-7/lioness-frames.webp", 680, 358, 4),
    ("lioncub", "assets/animation/v4-7/lioncub-frames.webp", 453, 305, 8),
    ("warthog", "assets/animation/v4-7/warthog-frames.webp", 439, 288, 8),
    ("cheetah", "assets/animation/v4-7/cheetah-frames.webp", 430, 243, 8),
    ("rhino", "assets/animation/v4-12-gait/rhino-sheet.webp", 1181, 682, 8),
    ("buffalo", "assets/animation/v4-12-gait/buffalo-sheet.webp", 1133, 682, 8),
    ("sheep", "assets/animation/v4-7/sheep-frames.webp", 553, 432, 4),
    ("cow", "assets/animation/v4-7/cow-frames.webp", 692, 446, 4),
    ("pig", "assets/animation/v4-7/pig-frames.webp", 641, 389, 4),
]


def clusters(xs, gap=18):
    xs = sorted(xs)
    groups = []
    for x in xs:
        if not groups or x - groups[-1][-1] > gap:
            groups.append([x])
        else:
            groups[-1].append(x)
    return [sum(g) / len(g) for g in groups]


def hooves(im):
    w, h = im.size
    px = im.load()
    ys = range(int(h * 0.78), h)
    hits = defaultdict(int)
    for y in ys:
        for x in range(w):
            if px[x, y][3] > 80:
                hits[x] += 1
    xs = [x for x, n in hits.items() if n >= 2]
    cents = clusters(xs, gap=max(12, w // 40))
    # keep lowest bands: re-scan each x-cluster for bottom y
    feet = []
    for cx in cents:
        x0, x1 = int(cx - w * 0.04), int(cx + w * 0.04)
        best = None
        for y in range(h - 1, int(h * 0.70), -1):
            for x in range(max(0, x0), min(w, x1)):
                if px[x, y][3] > 90:
                    best = (x / w, y / h)
                    break
            if best:
                break
        if best:
            feet.append(best)
    feet.sort()
    return feet


out = Path(r"C:\Temp\zoo-cels")
out.mkdir(exist_ok=True)
report = {}
for name, rel, fw, fh, n in jobs:
    img = Image.open(root / rel).convert("RGBA")
    cols = img.width // fw
    rows = []
    for i in range(n):
        x = (i % cols) * fw
        y = (i // cols) * fh
        frame = img.crop((x, y, x + fw, y + fh))
        feet = hooves(frame)
        xs = [round(f[0], 3) for f in feet]
        rows.append(xs)
        if i < 4:
            frame.save(out / f"{name}-{i}.png")
    report[name] = rows
    print(name, rows)

(out / "hooves.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
