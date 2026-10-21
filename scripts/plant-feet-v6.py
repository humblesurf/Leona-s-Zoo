"""Lower a raised hoof onto the ground without rebuilding the animal.

Only the lifted lower leg rotates about its hock. The body and the other
three planted hooves stay as painted.
"""
from __future__ import annotations

import math
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "geo" / "assets" / "animation" / "v6-stand"
PREVIEW = ROOT / "screenshots" / "v6-gait"

SOURCES = [
    ("sheep", "geo/assets/animation/v4-7/sheep-poster.webp"),
    ("lamb", "geo/assets/animation/v4-7/lamb-poster.webp"),
    ("cow", "geo/assets/animation/v4-7/cow-poster.webp"),
    ("calf", "geo/assets/animation/v4-7/calf-poster.webp"),
    ("pig", "geo/assets/animation/v4-7/pig-poster.webp"),
    ("piglet", "geo/assets/animation/v4-7/piglet-poster.webp"),
    ("zebra", "geo/assets/animation/v4-12-gait/zebra-poster.webp"),
    ("rhino", "geo/assets/animation/v4-12-gait/rhino-poster.webp"),
    ("buffalo", "geo/assets/animation/v4-12-gait/buffalo-poster.webp"),
    ("elephant", "geo/assets/animation/v4-7/elephant-poster.webp"),
    ("elephantcalf", "geo/assets/animation/v4-7/elephantcalf-poster.webp"),
    ("warthog", "geo/assets/animation/v4-7/warthog-poster.webp"),
    ("lioness", "geo/assets/animation/v4-7/lioness-poster.webp"),
    ("lioncub", "geo/assets/animation/v4-7/lioncub-poster.webp"),
]


def components(mask, min_n=12):
    h, w = mask.shape
    seen = np.zeros_like(mask, bool)
    out = []
    ys, xs = np.where(mask)
    for y, x in zip(ys, xs):
        if seen[y, x]:
            continue
        stack = [(int(y), int(x))]
        seen[y, x] = True
        pts = []
        while stack:
            cy, cx = stack.pop()
            pts.append((cy, cx))
            for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
                ny, nx = cy + dy, cx + dx
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))
        if len(pts) >= min_n:
            out.append(np.array(pts))
    return out


def trace_up(mask, x, y, max_half):
    h, w = mask.shape
    rows = []
    cx = float(x)
    y = int(y)
    while y > 0:
        lo = max(0, int(cx) - max_half * 3)
        hi = min(w, int(cx) + max_half * 3 + 1)
        xs = np.where(mask[y, lo:hi])[0]
        if len(xs) == 0:
            break
        runs = []
        start = prev = xs[0]
        for v in xs[1:]:
            if v == prev + 1:
                prev = v
            else:
                runs.append((start, prev))
                start = prev = v
        runs.append((start, prev))
        run = min(runs, key=lambda r: abs((r[0] + r[1]) / 2 + lo - cx))
        x0, x1 = lo + run[0], lo + run[1]
        width = x1 - x0 + 1
        if rows and width > max(max_half * 3.6, 16) and len(rows) > 6:
            break
        rows.append((y, x0, x1, (x0 + x1) / 2))
        cx = (x0 + x1) / 2
        y -= 1
        if len(rows) > h * 0.5:
            break
    return rows


def plant(path):
    im = Image.open(ROOT / path).convert("RGBA")
    rgba = np.array(im)
    mask = rgba[:, :, 3] > 40
    lum = rgba[:, :, :3].astype(np.float32).mean(axis=2)
    h, w = mask.shape
    ys, xs = np.where(mask)
    y0, y1 = int(ys.min()), int(ys.max())
    H = y1 - y0 + 1
    ground = int(np.percentile(ys, 99.2))
    dark = mask & (lum < 150) & (np.arange(h)[:, None] > y0 + H * 0.50)
    hooves = []
    for pts in components(dark, 16):
        hooves.append(
            {
                "x": float(np.median(pts[:, 1])),
                "y": int(pts[:, 0].max()),
                "n": len(pts),
            }
        )
    hooves.sort(key=lambda s: s["x"])
    merged = []
    for s in hooves:
        if merged and s["x"] - merged[-1]["x"] < w * 0.04:
            merged[-1] = s if s["y"] >= merged[-1]["y"] else merged[-1]
        else:
            merged.append(s)
    lifted = [s for s in merged if ground - s["y"] > max(6, H * 0.035)]
    if not lifted:
        return im, 0, ground
    out = rgba.copy()
    planted = 0
    for hoof in lifted:
        rows = trace_up(mask, hoof["x"], hoof["y"], max(5, int(H * 0.03)))
        if len(rows) < 8:
            continue
        # hock: the sharpest turn in the upper half of this column
        centers = np.array([r[3] for r in rows])
        if len(centers) < 10:
            pivot_i = len(rows) // 3
        else:
            d = np.diff(centers)
            turn = np.abs(np.diff(d))
            pivot_i = int(np.argmax(turn[: max(3, len(turn) // 2)])) + 1
            pivot_i = max(3, min(pivot_i, len(rows) - 4))
        pivot = rows[pivot_i]
        px, py = pivot[3], pivot[0]
        # pixels of the column from the hoof up to just below the pivot
        sel = np.zeros_like(mask)
        for y, x0, x1, _ in rows[:pivot_i]:
            sel[y, x0 : x1 + 1] = mask[y, x0 : x1 + 1]
        # include the hoof blob so the whole foot moves
        hoof_r = max(8, int(H * 0.04))
        yy, xx = np.ogrid[:h, :w]
        near = (yy - hoof["y"]) ** 2 + (xx - hoof["x"]) ** 2 <= hoof_r ** 2
        sel |= near & mask & (yy >= pivot[0])
        pts = np.argwhere(sel)
        if len(pts) < 10:
            continue
        # rotate about the hock until the lowest pixel sits on the ground
        hy = pts[:, 0].max()
        hx = pts[pts[:, 0] == hy][:, 1].mean()
        # vector from pivot to hoof. We want the hoof's y to become `ground`.
        vx, vy = hx - px, hy - py
        target_dy = ground - py
        # keep the leg length; solve angle whose downward component matches
        length = math.hypot(vx, vy) or 1
        # can't plant farther than the leg can reach
        if target_dy > length:
            target_dy = length * 0.98
        # current angle from downward
        # image +y is down. angle 0 = straight down.
        current = math.atan2(vx, vy)
        # new hoof should be nearly under the pivot, y = py+target_dy
        # prefer the side the hoof is already on
        span = math.sqrt(max(0, length * length - target_dy * target_dy))
        sign = 1 if vx >= 0 else -1
        nx = sign * span
        target = math.atan2(nx, target_dy)
        delta = target - current
        # rotate sel pixels
        cos, sin = math.cos(delta), math.sin(delta)
        moved = np.zeros_like(out)
        written = np.zeros(mask.shape, bool)
        for y, x in pts:
            dx, dy = x - px, y - py
            rx = px + dx * cos - dy * sin
            ry = py + dx * sin + dy * cos
            ix, iy = int(round(rx)), int(round(ry))
            if 0 <= ix < w and 0 <= iy < h:
                moved[iy, ix] = out[y, x]
                written[iy, ix] = True
        # clear the old lower leg, but keep a cap at the pivot so it stays joined
        clear = sel.copy()
        clear[int(py) - 2 : int(py) + 3, :] = False
        out[clear, 3] = 0
        # paint the moved leg
        out[written] = moved[written]
        planted += 1
    return Image.fromarray(out, "RGBA"), planted, ground


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    PREVIEW.mkdir(parents=True, exist_ok=True)
    for animal_id, rel in SOURCES:
        im, n, ground = plant(rel)
        bg = Image.new("RGB", im.size, (236, 232, 224))
        bg.paste(im, mask=im.split()[-1])
        scale = min(1, 640 / bg.width)
        if scale < 1:
            bg = bg.resize((int(bg.width * scale), int(bg.height * scale)), Image.Resampling.LANCZOS)
        bg.save(PREVIEW / f"{animal_id}-stand.png")
        if n:
            im.save(OUT / f"{animal_id}.webp", "WEBP", quality=92, method=6)
        print(f"{animal_id}: planted {n}")


if __name__ == "__main__":
    main()
