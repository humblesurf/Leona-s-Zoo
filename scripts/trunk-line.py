from PIL import Image
im = Image.open(r"C:\Users\XTIA\OneDrive - AEDAS LTD\AI Project_Aedas\toddler-animals\geo\assets\animation\v4-7\elephant-poster.webp").convert("RGBA")
w, h = im.size
px = im.load()
print("elephant", w, h)
for yi in range(8, 40):
    y = int(h * yi / 40)
    xs = []
    for x in range(int(w * 0.55)):
        r, g, b, a = px[x, y]
        if a < 80:
            continue
        tusk = r > 185 and g > 155 and b > 115
        if tusk:
            continue
        xs.append(x)
    if not xs:
        print(f"y={y/h:.3f} empty")
        continue
    # first contiguous run from the left
    run = [xs[0]]
    for x in xs[1:]:
        if x - run[-1] > 4:
            break
        run.append(x)
    print(f"y={y/h:.3f} run {run[0]/w:.3f}-{run[-1]/w:.3f} mid {(run[0]+run[-1])/2/w:.3f} n={len(run)}")
