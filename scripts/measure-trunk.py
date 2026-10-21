from PIL import Image

def bounds(name, pred):
    im = Image.open(name).convert("RGBA")
    w, h = im.size
    px = im.load()
    pts = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 40:
                continue
            if pred(x / w, y / h, r, g, b):
                pts.append((x, y))
    if not pts:
        print(name, "empty")
        return
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    print(name, im.size, "n", len(pts),
          f"x {min(xs)/w:.3f}-{max(xs)/w:.3f}",
          f"y {min(ys)/h:.3f}-{max(ys)/h:.3f}")

base = r"C:\Users\XTIA\OneDrive - AEDAS LTD\AI Project_Aedas\toddler-animals\geo\assets\animation\v4-1"
bounds(base + r"\elephant-poster.webp",
       lambda x, y, r, g, b: x < 0.28 and y > 0.42 and not (r > 180 and g > 150 and b > 110))
bounds(base + r"\elephant-poster.webp",
       lambda x, y, r, g, b: x < 0.34 and 0.50 < y < 0.78 and r > 190 and g > 160 and b > 120)
bounds(base + r"\hippo-poster.webp",
       lambda x, y, r, g, b: x < 0.32 and 0.48 < y < 0.75 and r > 140 and g > 90 and b > 70)
