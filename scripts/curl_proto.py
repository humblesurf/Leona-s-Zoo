from PIL import Image
im = Image.open(r"geo/assets/animation/v4-7/elephant-poster.webp").convert("RGBA")
w, h = im.size
px = im.load()
rows = []
for y in range(int(h * 0.50), int(h * 0.84)):
    xs = []
    for x in range(int(w * 0.28)):
        r, g, b, a = px[x, y]
        if a < 80:
            continue
        if r > 185 and g > 155 and b > 115:
            continue
        xs.append(x)
    if not xs:
        continue
    run = [xs[0]]
    for x in xs[1:]:
        if x - run[-1] > 3:
            break
        run.append(x)
    if len(run) < 8:
        continue
    rows.append((y, run[0], run[-1]))
print("rows", len(rows), "y", rows[0][0] / h, rows[-1][0] / h)

out = im.copy()
opx = out.load()
# Leave the top of the trunk untouched so it stays joined to the face.
start = len(rows) // 5
for y, x0, x1 in rows[start:]:
    for x in range(x0, x1 + 1):
        opx[x, y] = (0, 0, 0, 0)

def dest(i):
    t = max(0, (i - start) / (len(rows) - 1 - start))
    bend = t * t
    y, x0, x1 = rows[i]
    return x0 + int(bend * 0.05 * w), y - int(bend * 0.16 * h), x1 - x0 + 1

for i in range(start, len(rows)):
    y, x0, x1 = rows[i]
    dx, dy, width = dest(i)
    row = im.crop((x0, y, x1 + 1, y + 1))
    out.paste(row, (dx, dy), row)
    if i + 1 < len(rows):
        ny = dest(i + 1)[1]
        # Fill any gap between this row and the next so the trunk does not split.
        step = 1 if ny >= dy else -1
        for yy in range(dy, ny, step):
            out.paste(row, (dx, yy), row)

out.save(r"C:\Temp\elephant-curl-proto.png")
print("wrote", out.size)
