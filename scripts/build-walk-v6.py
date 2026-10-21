"""Standing pose (four hooves down) and an eight-frame lateral walk.

Each pair of feet shares a shoulder or hip and swaps which hoof is ahead,
so the step reads as a walk instead of one hoof bobbing in place.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "geo" / "assets" / "animation" / "v6-walk"
PREVIEW = ROOT / "screenshots" / "v6-gait"

# kind tunes step length and how high the hoof clears the ground.
ANIMALS = [
    ("sheep", "geo/assets/animation/v4-7/sheep-poster.webp", "sheep"),
    ("lamb", "geo/assets/animation/v4-7/lamb-poster.webp", "baby"),
    ("cow", "geo/assets/animation/v4-7/cow-poster.webp", "heavy"),
    ("calf", "geo/assets/animation/v4-7/calf-poster.webp", "baby"),
    ("pig", "geo/assets/animation/v4-7/pig-poster.webp", "stock"),
    ("piglet", "geo/assets/animation/v4-7/piglet-poster.webp", "baby"),
    ("zebra", "geo/assets/animation/v4-12-gait/zebra-poster.webp", "stock"),
    ("rhino", "geo/assets/animation/v4-12-gait/rhino-poster.webp", "heavy"),
    ("buffalo", "geo/assets/animation/v4-12-gait/buffalo-poster.webp", "heavy"),
    ("elephant", "geo/assets/animation/v4-7/elephant-poster.webp", "heavy"),
    ("elephantcalf", "geo/assets/animation/v4-7/elephantcalf-poster.webp", "baby"),
    ("warthog", "geo/assets/animation/v4-7/warthog-poster.webp", "stock"),
    ("lioness", "geo/assets/animation/v4-7/lioness-poster.webp", "cat"),
    ("lioncub", "geo/assets/animation/v4-7/lioncub-poster.webp", "cat"),
]

TUNE = {
    "heavy": {"stride": 0.42, "lift": 0.10, "duty": 0.70, "travel": 0.28, "hold": 170},
    "stock": {"stride": 0.55, "lift": 0.16, "duty": 0.64, "travel": 0.36, "hold": 145},
    "sheep": {"stride": 0.50, "lift": 0.14, "duty": 0.66, "travel": 0.34, "hold": 155},
    "cat": {"stride": 0.62, "lift": 0.20, "duty": 0.60, "travel": 0.42, "hold": 120},
    "baby": {"stride": 0.58, "lift": 0.18, "duty": 0.62, "travel": 0.38, "hold": 125},
}


def bbox(mask):
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def trace_column(mask, x, y, max_half):
    """Walk one leg upward from a hoof. Returns row slices (y, x0, x1)."""
    h, w = mask.shape
    rows = []
    cx = float(x)
    y = int(y)
    while y > h * 0.42:
        lo = max(0, int(cx) - max_half * 3)
        hi = min(w, int(cx) + max_half * 3 + 1)
        segment = mask[y, lo:hi]
        xs = np.where(segment)[0]
        if len(xs) == 0:
            break
        # contiguous run nearest to cx
        runs = []
        start = xs[0]
        prev = xs[0]
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
        if rows and width > max(max_half * 4.2, 18) and y < rows[0][0] - 8:
            break
        rows.append((y, int(x0), int(x1)))
        cx = (x0 + x1) / 2
        y -= 1
        if len(rows) > h * 0.55:
            break
    rows.reverse()
    return rows


def hoof_seeds(mask, rgb):
    h, w = mask.shape
    ys, xs = np.where(mask)
    y0, y1 = int(ys.min()), int(ys.max())
    H = y1 - y0 + 1
    ground = int(np.percentile(ys, 99))
    lum = rgb.astype(np.float32).mean(axis=2)
    # hoof-like: low in the body, darker than the coat, or simply the lowest tip
    dark = mask & (lum < 145) & (np.arange(h)[:, None] > y0 + H * 0.55)
    seeds = []
    seen = np.zeros_like(dark)
    yy, xx = np.where(dark)
    for y, x in zip(yy, xx):
        if seen[y, x]:
            continue
        stack = [(y, x)]
        seen[y, x] = True
        pts = []
        while stack:
            cy, cx = stack.pop()
            pts.append((cy, cx))
            for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
                ny, nx = cy + dy, cx + dx
                if 0 <= ny < h and 0 <= nx < w and dark[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))
        if len(pts) < 18:
            continue
        arr = np.array(pts)
        seeds.append(
            {
                "x": float(arr[:, 1].mean()),
                "y": float(arr[:, 0].max()),
                "n": len(pts),
                "top": float(arr[:, 0].min()),
            }
        )
    # also the lowest tip of any column that reaches the ground, in case a hoof is pale
    bottom = np.full(w, -1)
    for x in range(w):
        col = np.where(mask[:, x])[0]
        if len(col):
            bottom[x] = col[-1]
    on = np.where(bottom >= ground - max(2, H * 0.02))[0]
    if len(on):
        splits = np.where(np.diff(on) > 4)[0]
        spans = []
        start = 0
        for s in list(splits) + [len(on) - 1]:
            chunk = on[start : s + 1]
            start = s + 1
            if len(chunk) < 3:
                continue
            spans.append(chunk)
        for chunk in spans:
            x = float(np.median(chunk))
            seeds.append({"x": x, "y": float(bottom[int(x)]), "n": len(chunk) * 4, "top": float(bottom[int(x)])})
    seeds.sort(key=lambda s: s["x"])
    merged = []
    for s in seeds:
        if merged and s["x"] - merged[-1]["x"] < w * 0.045:
            a, b = merged[-1], s
            # keep the lower hoof
            merged[-1] = a if a["y"] >= b["y"] else b
        else:
            merged.append(s)
    # drop a trunk or tail: extreme seeds that sit well above the ground
    planted = [s for s in merged if ground - s["y"] < H * 0.08]
    lifted = [s for s in merged if H * 0.08 <= ground - s["y"] < H * 0.42]
    chosen = planted + lifted
    chosen.sort(key=lambda s: s["x"])
    return chosen, ground, H


def straighten(rows, rgba):
    """Stack each traced row on a common center so a bent leg hangs straight."""
    if len(rows) < 6:
        return None
    width = max(x1 - x0 + 1 for _, x0, x1 in rows) + 4
    sprite = np.zeros((len(rows), width, 4), np.uint8)
    cx = width // 2
    for i, (y, x0, x1) in enumerate(rows):
        strip = rgba[y, x0 : x1 + 1]
        sw = strip.shape[0]
        left = cx - sw // 2
        sprite[i, left : left + sw] = strip
    return sprite, cx


def split_animal(path):
    im = Image.open(ROOT / path).convert("RGBA")
    rgba = np.array(im)
    mask = rgba[:, :, 3] > 40
    seeds, ground, H = hoof_seeds(mask, rgba[:, :, :3])
    legs = []
    used = np.zeros_like(mask)
    for seed in seeds:
        half = max(6, int(H * 0.035))
        rows = trace_column(mask, seed["x"], seed["y"], half)
        if len(rows) < 8:
            continue
        # don't reuse pixels already claimed by another leg
        rows = [r for r in rows if not used[r[0], (r[1] + r[2]) // 2]]
        if len(rows) < 8:
            continue
        for y, x0, x1 in rows:
            used[y, x0 : x1 + 1] = True
        built = straighten(rows, rgba)
        if built is None:
            continue
        sprite, pivot = built
        hip_x = (rows[0][1] + rows[0][2]) / 2
        bright = float(sprite[:, :, :3][sprite[:, :, 3] > 40].mean()) if np.any(sprite[:, :, 3] > 40) else 0
        legs.append(
            {
                "sprite": sprite,
                "pivot": pivot,
                "hip_x": hip_x,
                "hip_y": rows[0][0],
                "bright": bright,
                "length": sprite.shape[0],
            }
        )
    legs.sort(key=lambda L: L["hip_x"])
    # four legs: if extras remain, keep the four whose hips sit lowest (real legs)
    if len(legs) > 4:
        legs.sort(key=lambda L: L["hip_y"], reverse=True)
        legs = legs[:4]
        legs.sort(key=lambda L: L["hip_x"])
    body = rgba.copy()
    body[used, 3] = 0
    return im, body, legs, ground


def assign_pairs(legs):
    """Left-facing animal: two front hooves, then two hind hooves."""
    if len(legs) != 4:
        return None
    front, hind = legs[:2], legs[2:]
    def near_far(pair):
        pair = sorted(pair, key=lambda L: L["bright"], reverse=True)
        return pair[0], pair[1]  # near, far
    nf, ff = near_far(front)
    nh, fh = near_far(hind)
    # phase is the moment the hoof lands. Lateral sequence:
    # near hind, far front, far hind, near front.
    nf["name"], nf["phase"] = "near-front", 0.75
    ff["name"], ff["phase"] = "far-front", 0.25
    nh["name"], nh["phase"] = "near-hind", 0.0
    fh["name"], fh["phase"] = "far-hind", 0.5
    for leg in (nf, ff, nh, fh):
        leg["far"] = leg["name"].startswith("far")
        # both feet of a pair step around the midpoint of their hips
    for pair in ((nf, ff), (nh, fh)):
        mid = (pair[0]["hip_x"] + pair[1]["hip_x"]) / 2
        pair[0]["center"] = mid
        pair[1]["center"] = mid
    return [ff, fh, nf, nh]


def ik(hip, target, L1, L2):
    dx = target[0] - hip[0]
    dy = target[1] - hip[1]
    dist = math.hypot(dx, dy)
    dist = min(L1 + L2 - 0.5, max(abs(L1 - L2) + 0.5, dist))
    ux, uy = dx / (dist or 1), dy / (dist or 1)
    a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist)
    # Bulge the joint backward (image +x) for a left-facing animal.
    b = -math.sqrt(max(0, L1 * L1 - a * a))
    knee = (hip[0] + ux * a - uy * b, hip[1] + uy * a + ux * b)
    foot = (hip[0] + ux * dist, hip[1] + uy * dist)
    return knee, foot


def blit(canvas, sprite, src_pivot, dst_pivot, angle):
    """Rotate sprite so its +y axis points along `angle` radians from straight down."""
    im = Image.fromarray(sprite, "RGBA")
    sw, sh = im.size
    big = Image.new("RGBA", (sw * 3, sh * 3), (0, 0, 0, 0))
    big.paste(im, (sw - int(src_pivot[0]), sh - int(src_pivot[1])), im)
    rot = big.rotate(math.degrees(angle), resample=Image.Resampling.BICUBIC, center=(sw, sh))
    canvas.alpha_composite(rot, (int(round(dst_pivot[0] - sw)), int(round(dst_pivot[1] - sh))))


def pose_leg(leg, phase, duty, stride, lift, ground):
    if phase < duty:
        u = phase / duty
        horizontal = 0.5 - u  # forward (+) to back (-)
        height = 0.0
        fold = 0.15 * max(0, (u - 0.82) / 0.18)
    else:
        u = (phase - duty) / (1 - duty)
        # smooth swing, foot passes close to the hip rather than in a straight line
        horizontal = -0.5 * math.cos(math.pi * u)
        height = math.sin(math.pi * u) ** 1.2
        fold = math.sin(math.pi * u)
    # left-facing: forward is -x
    x = leg["center"] - horizontal * stride
    y = ground - height * lift
    L = leg["length"]
    L1, L2 = L * 0.48, L * 0.52
    knee, foot = ik((leg["center"], leg["hip_y"]), (x, y), L1, L2)
    # extra fold pulls the hoof up along the joint when the step is aerial
    if fold:
        foot = (foot[0], foot[1] - fold * lift * 0.15)
        knee, foot = ik((leg["center"], leg["hip_y"]), foot, L1, L2)
    return knee, foot, L1


def draw_leg(canvas, leg, knee, foot, L1):
    sprite = leg["sprite"]
    knee_row = max(2, min(sprite.shape[0] - 3, int(round(L1))))
    upper = sprite[:knee_row]
    lower = sprite[knee_row - 2 :]
    hip = (leg["center"], leg["hip_y"])
    ang_u = math.atan2(knee[0] - hip[0], knee[1] - hip[1])
    ang_l = math.atan2(foot[0] - knee[0], foot[1] - knee[1])
    blit(canvas, upper, (leg["pivot"], 0), hip, ang_u)
    blit(canvas, lower, (leg["pivot"], 2), knee, ang_l)


def render_frame(body, legs, ground, phase0, tune, size):
    duty = tune["duty"]
    lengths = [L["length"] for L in legs]
    leg_len = float(np.median(lengths))
    stride = tune["stride"] * leg_len
    lift = tune["lift"] * leg_len
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    # far legs, then the torso, then the near legs
    for leg in legs:
        if not leg["far"]:
            continue
        phase = (phase0 + leg["phase"]) % 1
        knee, foot, L1 = pose_leg(leg, phase, duty, stride, lift, ground)
        draw_leg(canvas, leg, knee, foot, L1)
    canvas.alpha_composite(Image.fromarray(body, "RGBA"))
    for leg in legs:
        if leg["far"]:
            continue
        phase = (phase0 + leg["phase"]) % 1
        knee, foot, L1 = pose_leg(leg, phase, duty, stride, lift, ground)
        draw_leg(canvas, leg, knee, foot, L1)
    return canvas


def standing(body, legs, ground, size):
    """All four hooves on the ground, under the shoulder and hip."""
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    for leg in legs:
        if not leg["far"]:
            continue
        sprite = leg["sprite"]
        hip = (int(round(leg["center"])), int(round(leg["hip_y"])))
        blit(canvas, sprite, (leg["pivot"], 0), hip, 0)
    canvas.alpha_composite(Image.fromarray(body, "RGBA"))
    for leg in legs:
        if leg["far"]:
            continue
        sprite = leg["sprite"]
        hip = (int(round(leg["center"])), int(round(leg["hip_y"])))
        blit(canvas, sprite, (leg["pivot"], 0), hip, 0)
    return canvas


def trim_union(frames):
    boxes = [f.getbbox() for f in frames]
    boxes = [b for b in boxes if b]
    x0 = min(b[0] for b in boxes)
    y0 = min(b[1] for b in boxes)
    x1 = max(b[2] for b in boxes)
    y1 = max(b[3] for b in boxes)
    pad = 8
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(frames[0].width, x1 + pad)
    y1 = min(frames[0].height, y1 + pad)
    return [f.crop((x0, y0, x1, y1)) for f in frames]


def save_webp(im, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "WEBP", quality=90, method=6)


def build_one(animal_id, rel, kind):
    im, body, legs, ground = split_animal(rel)
    paired = assign_pairs(legs)
    if paired is None:
        print("SKIP", animal_id, "legs", len(legs))
        return None
    tune = TUNE[kind]
    # room to swing past the body
    pad = int(max(L["length"] for L in paired) * 0.45)
    size = (im.width + pad * 2, im.height + pad)
    body_img = Image.fromarray(body, "RGBA")
    shifted = Image.new("RGBA", size, (0, 0, 0, 0))
    shifted.paste(body_img, (pad, pad // 2))
    body = np.array(shifted)
    for leg in paired:
        leg["center"] += pad
        leg["hip_x"] += pad
        leg["hip_y"] += pad // 2
    ground = ground + pad // 2
    stand = standing(body, paired, ground, size)
    frames = [stand]
    for i in range(8):
        frames.append(render_frame(body, paired, ground, i / 8, tune, size))
    frames = trim_union(frames)
    stand, cycle = frames[0], frames[1:]
    fw, fh = cycle[0].size
    sheet = Image.new("RGBA", (fw * 4, fh * 2), (0, 0, 0, 0))
    for i, fr in enumerate(cycle):
        sheet.paste(fr, ((i % 4) * fw, (i // 4) * fh))
    folder = OUT
    save_webp(stand, folder / f"{animal_id}-poster.webp")
    save_webp(sheet, folder / f"{animal_id}-sheet.webp")
    # preview
    PREVIEW.mkdir(parents=True, exist_ok=True)
    preview = Image.new("RGB", (fw, fh * 9), (236, 232, 224))
    for i, fr in enumerate([stand] + cycle):
        bg = Image.new("RGB", fr.size, (236, 232, 224))
        bg.paste(fr, mask=fr.split()[-1])
        preview.paste(bg, (0, i * fh))
    preview.save(PREVIEW / f"{animal_id}-v6.png")
    print(animal_id, "ok", fw, fh, "legs", [L["name"] for L in paired])
    return {
        "id": animal_id,
        "w": fw,
        "h": fh,
        "tune": tune,
        "poster": f"assets/animation/v6-walk/{animal_id}-poster.webp",
        "sheet": f"assets/animation/v6-walk/{animal_id}-sheet.webp",
    }


def write_js(built):
    parts = []
    for item in built:
        t = item["tune"]
        w, h = item["w"], item["h"]
        frames = []
        for i in range(8):
            frames.append(
                '{"x":%d,"y":%d,"w":%d,"h":%d,"dx":0,"dy":0}'
                % ((i % 4) * w, (i // 4) * h, w, h)
            )
        # two full steps, starting and ending on the four-foot stand via rest
        holds = [t["hold"]] * 8 + [t["hold"]] * 8 + [t["hold"] + 80]
        seq = list(range(8)) + list(range(8)) + [0]
        # travel lands with each new drawing so a planted hoof does not skate
        advance = []
        for i in range(len(seq)):
            advance.append(round(i / (len(seq) - 1), 4))
        label = "四脚依次迈步，前后脚交错"
        parts.append(
            '"%s":{"poster":"%s","sheet":"%s","viewport":{"w":%d,"h":%d},"frames":[%s],'
            '"fps":8,"loop":false,"duration":%d,"face":-1,"travel":%s,"rig":false,"walk":false,"hop":0,'
            '"label":"%s","cel":{"sequence":%s,"holdsMs":%s,"advance":%s,"motion":"walk","restFrame":0}}'
            % (
                item["id"],
                item["poster"],
                item["sheet"],
                w,
                h,
                ",".join(frames),
                sum(holds),
                t["travel"],
                label,
                json.dumps(seq),
                json.dumps(holds),
                json.dumps(advance),
            )
        )
    js = (
        "/* V6 walk: four hooves down at rest, lateral sequence while stepping. */\n"
        "(function(g){const defs={%s};for(const[id,d]of Object.entries(defs))"
        "g.ANIMAL_ANIMATIONS[id]=Object.assign({},g.ANIMAL_ANIMATIONS[id]||{},d);"
        "g.WALK_V6={version:'6',ids:Object.keys(defs)};})(window);\n"
        % ",".join(parts)
    )
    target = ROOT / "geo" / "assets" / "walk-v6.js"
    target.write_text(js, encoding="utf-8")
    print("wrote", target, "animals", len(built))


def main():
    built = []
    for animal_id, rel, kind in ANIMALS:
        item = build_one(animal_id, rel, kind)
        if item:
            built.append(item)
    write_js(built)


if __name__ == "__main__":
    main()
