from PIL import Image
im = Image.open(r"C:\Users\XTIA\OneDrive - AEDAS LTD\AI Project_Aedas\toddler-animals\geo\assets\animation\v4-1\hippo-poster.webp").convert("RGBA")
w, h = im.size
px = im.load()
print(w, h)
for yi in range(18, 32):
    y = int(h * yi / 40)
    xs = []
    for x in range(int(w * 0.40)):
        r, g, b, a = px[x, y]
        if a < 80:
            continue
        pink = r > 150 and g > 100 and r > b + 30
        if pink:
            xs.append(x)
    if not xs:
        print(f"y={y/h:.3f} no pink")
        continue
    print(f"y={y/h:.3f} pink {xs[0]/w:.3f}-{xs[-1]/w:.3f}")
