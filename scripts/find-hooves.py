from PIL import Image
import pathlib

def hooves(path):
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    px = im.load()
    dark = []
    for y in range(int(h * 0.72), h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 80:
                continue
            if r < 90 and g < 80 and b < 75:
                dark.append((x, y))
    if not dark:
        print(path, "no dark")
        return
    # cluster by x gaps
    dark.sort()
    groups = [[dark[0]]]
    for x, y in dark[1:]:
        if x - groups[-1][-1][0] > 18:
            groups.append([])
        groups[-1].append((x, y))
    print(pathlib.Path(path).name, im.size)
    for g in groups:
        xs = [p[0] for p in g]
        ys = [p[1] for p in g]
        cx, cy = sum(xs) / len(xs) / w, sum(ys) / len(ys) / h
        print(f"  n={len(g):5d}  x={min(xs)/w:.3f}-{max(xs)/w:.3f}  y={min(ys)/h:.3f}-{max(ys)/h:.3f}  c=[{cx:.3f},{cy:.3f}]")

base = pathlib.Path(r"C:\Users\XTIA\OneDrive - AEDAS LTD\AI Project_Aedas\toddler-animals\geo\assets\animation\v4-1")
for name in ("zebra-poster.webp", "lioness-poster.webp", "warthog-poster.webp"):
    hooves(base / name)
