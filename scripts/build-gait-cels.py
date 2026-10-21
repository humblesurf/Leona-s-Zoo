"""Build 8-frame walk sheets where each pair exchanges which hoof is ahead."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import json

ROOT = Path(r"C:\Users\XTIA\OneDrive - AEDAS LTD\AI Project_Aedas\toddler-animals\geo")
OUT_DIR = ROOT / "assets" / "animation" / "v6-gait"
OUT_DIR.mkdir(parents=True, exist_ok=True)
PREVIEW = Path(r"C:\Temp\zoo-gait")
PREVIEW.mkdir(exist_ok=True)

# Rest frame of the current sheet, plus a lift frame if the sheet has one.
SHEETS = {
    "zebra": ("assets/animation/v4-12-gait/zebra-sheet.webp", 900, 682, 8, 0, 3),
    "rhino": ("assets/animation/v4-12-gait/rhino-sheet.webp", 1181, 682, 8, 0, 3),
    "buffalo": ("assets/animation/v4-12-gait/buffalo-sheet.webp", 1133, 682, 8, 0, 3),
    "lioness": ("assets/animation/v4-7/lioness-frames.webp", 680, 358, 4, 0, 2),
    "lioncub": ("assets/animation/v4-7/lioncub-frames.webp", 453, 305, 8, 0, 1),
    "warthog": ("assets/animation/v4-7/warthog-frames.webp", 439, 288, 8, 0, 1),
    "sheep": ("assets/animation/v4-7/sheep-frames.webp", 553, 432, 4, 0, 2),
    "cow": ("assets/animation/v4-7/cow-frames.webp", 692, 446, 4, 0, 1),
    "pig": ("assets/animation/v4-7/pig-frames.webp", 641, 389, 4, 0, 1),
    "lamb": ("assets/animation/v4-7/lamb-frames.webp", 481, 480, 4, 0, 1),
    "calf": ("assets/animation/v4-7/calf-frames.webp", 567, 491, 4, 0, 1),
    "piglet": ("assets/animation/v4-7/piglet-frames.webp", 557, 457, 4, 0, 1),
}


def frame_at(sheet, fw, fh, index):
    cols = sheet.width // fw
    x = (index % cols) * fw
    y = (index // cols) * fh
    return sheet.crop((x, y, x + fw, y + fh)).convert("RGBA")


def connected(px, w, h, seed, alpha=80, y_min=0):
    sx, sy = seed
    if not (0 <= sx < w and 0 <= sy < h) or px[sx, sy][3] <= alpha:
        return []
    seen = {seed}
    stack = [seed]
    while stack:
        x, y = stack.pop()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if (nx, ny) in seen or not (0 <= nx < w and 0 <= ny < h):
                continue
            if ny < y_min:
                continue
            if px[nx, ny][3] > alpha:
                seen.add((nx, ny))
                stack.append((nx, ny))
    return seen


def hoof_blobs(im):
    w, h = im.size
    px = im.load()
    seeds = []
    y0 = int(h * 0.78)
    visited = set()
    for y in range(h - 1, y0, -1):
        for x in range(0, w, max(1, w // 180)):
            if (x, y) in visited or px[x, y][3] <= 90:
                continue
            blob = connected(px, w, h, (x, y), 70, y_min=int(h * 0.74))
            visited |= blob
            if len(blob) < 40:
                continue
            xs = [p[0] for p in blob]
            ys = [p[1] for p in blob]
            if max(ys) < h * 0.82:
                continue
            cx = sum(xs) / len(xs)
            cy = sum(ys) / len(ys)
            seeds.append((cx / w, cy / h, blob))
    seeds.sort()
    # merge overlapping x
    merged = []
    for item in seeds:
        if merged and abs(item[0] - merged[-1][0]) < 0.08:
            if len(item[2]) > len(merged[-1][2]):
                merged[-1] = item
        else:
            merged.append(item)
    return merged[:4]


def crop_sprite(im, blob, pad=6):
    w, h = im.size
    xs = [p[0] for p in blob]
    ys = [p[1] for p in blob]
    x0, y0 = max(0, min(xs) - pad), max(0, min(ys) - pad)
    x1, y1 = min(w, max(xs) + pad + 1), min(h, max(ys) + pad + 1)
    sprite = Image.new("RGBA", (x1 - x0, y1 - y0), (0, 0, 0, 0))
    sp = sprite.load()
    src = im.load()
    blob_set = blob
    for x, y in blob_set:
        if x0 <= x < x1 and y0 <= y < y1:
            sp[x - x0, y - y0] = src[x, y]
    return sprite, x0, y0


def erase_blob(im, blob):
    out = im.copy()
    px = out.load()
    w, h = im.size
    for x, y in blob:
        # pull a body pixel from well above the hoof
        src_y = max(0, int(y - h * 0.16))
        src_x = min(w - 1, max(0, x))
        # prefer a fully opaque non-edge fill
        fill = im.getpixel((src_x, src_y))
        if fill[3] < 180:
            fill = (fill[0], fill[1], fill[2], 0)
            # try a few nearby body samples
            for dy in range(8, int(h * 0.28), 6):
                yy = max(0, y - dy)
                cand = im.getpixel((src_x, yy))
                if cand[3] > 200:
                    fill = cand
                    break
        px[x, y] = fill
    return out.filter(ImageFilter.MedianFilter(3))


def paste(base, sprite, x, y):
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    layer.paste(sprite, (int(x), int(y)), sprite)
    return Image.alpha_composite(base, layer)


def build(id, rel, fw, fh, n, rest_i, lift_i):
    sheet = Image.open(ROOT / rel).convert("RGBA")
    rest = frame_at(sheet, fw, fh, rest_i)
    lift = frame_at(sheet, fw, fh, min(lift_i, n - 1))
    rest_feet = hoof_blobs(rest)
    lift_feet = hoof_blobs(lift)
    if len(rest_feet) < 3:
        print(id, "skip rest feet", len(rest_feet))
        return None
    # Order: front-left, front-right, hind-left, hind-right in image x (facing left)
    while len(rest_feet) < 4:
        rest_feet.append(rest_feet[-1])
    names = ["ff", "nf", "fh", "nh"]
    sprites = {}
    for name, foot in zip(names, rest_feet[:4]):
        sprites[name] = crop_sprite(rest, foot[2])
    # lifted copies from the lift frame, matched by x
    lift_sprites = []
    for foot in lift_feet:
        lift_sprites.append((foot[0], crop_sprite(lift, foot[2])))

    body = rest.copy()
    for foot in rest_feet[:4]:
        body = erase_blob(body, foot[2])
    body = body.filter(ImageFilter.GaussianBlur(0.4))
    # keep a slightly sharper body
    body = Image.blend(erase_blob(rest, rest_feet[0][2]), body, 0.55)
    # rebuild body by erasing all four
    body = rest.copy()
    for foot in rest_feet[:4]:
        body = erase_blob(body, foot[2])

    w, h = rest.size
    rest_pos = {n: sprites[n][1:] for n in names}  # x0,y0

    def place(state):
        canvas = body.copy()
        # draw far legs first
        order = ["ff", "fh", "nf", "nh"]
        for n in order:
            spr, ox, oy = sprites[n]
            dx, dy, use_lift = state[n]
            img = spr
            if use_lift and lift_sprites:
                # pick the lift sprite whose rest x is closest to this hoof
                rest_x = rest_feet[names.index(n)][0]
                img = min(lift_sprites, key=lambda item: abs(item[0] - rest_x))[1][0]
                ox, oy = min(lift_sprites, key=lambda item: abs(item[0] - rest_x))[1][1:]
            canvas = paste(canvas, img, ox + dx * w, oy + dy * h)
        return canvas

    # Lateral walk: NH, FF, FH, NF. A swing tucks back then lands ahead of its pair.
    # Facing left: ahead is negative x.
    ahead, back, up = -0.11, 0.09, -0.07
    poses = []
    # 0 rest
    zero = {n: (0, 0, False) for n in names}
    poses.append(zero)
    # 1 NH swing tucked (hind cross: NH was trailing, tucks? actually trailing hind swings FORWARD)
    # User wants the BACK foot of a pair to swing past the front foot.
    # Rest: ff more left (ahead) than nf. To cross fronts, nf must get ahead of ff:
    #   lift nf and move it left, or tuck ff right so nf leads.
    # Warthog-1 tucks the leading front (ff) back/up so nf becomes the leader.
    p = dict(zero)
    p["ff"] = (back, up, True)
    poses.append(p)  # front cross A: leading front tucked, trailing front leads
    p = dict(zero)
    p["ff"] = (ahead * 0.3, 0, False)
    p["nf"] = (ahead * 0.15, 0, False)
    poses.append(p)  # contact after front pass
    p = dict(zero)
    p["nh"] = (back, up, True)
    poses.append(p)  # hind cross A: leading hind tucked
    p = dict(zero)
    p["nh"] = (ahead * 0.25, 0, False)
    poses.append(p)
    p = dict(zero)
    p["nf"] = (back, up, True)
    poses.append(p)  # front cross B
    p = dict(zero)
    p["fh"] = (back, up, True)
    poses.append(p)  # hind cross B
    poses.append(zero)

    frames = [place(st) for st in poses]
    for i, fr in enumerate(frames):
        fr.save(PREVIEW / f"{id}-{i}.png")
    packed = Image.new("RGBA", (fw * 4, fh * 2), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        packed.paste(fr, ((i % 4) * fw, (i // 4) * fh))
    dest = OUT_DIR / f"{id}-sheet.webp"
    packed.save(dest, "WEBP", quality=92, method=6)
    rest.save(OUT_DIR / f"{id}-poster.webp", "WEBP", quality=92, method=6)
    print("wrote", dest, packed.size)
    return dest


def main():
    for animal, spec in SHEETS.items():
        build(animal, *spec)


if __name__ == "__main__":
    main()
