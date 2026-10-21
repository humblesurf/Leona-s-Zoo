"""Cut new low-poly creatures out of the magenta plates and give each a short motion."""
import json
from pathlib import Path
import numpy as np
from PIL import Image
import cv2

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(r'C:\Users\XTIA\.cursor\projects\c-Users-XTIA-OneDrive-AEDAS-LTD-AI-Project-Aedas-toddler-animals\assets')
OUT = ROOT / 'v5' / 'assets' / 'creatures'
OUT.mkdir(parents=True, exist_ok=True)


def cutout(path):
    rgb = np.array(Image.open(path).convert('RGB'))
    h, w = rgb.shape[:2]
    corners = np.stack([
        rgb[1, 1], rgb[1, w // 2], rgb[1, -2],
        rgb[-2, 1], rgb[-2, -2], rgb[h // 2, 1], rgb[h // 2, -2],
    ]).astype(np.float32)
    bg = np.median(corners, axis=0)
    dist = np.linalg.norm(rgb.astype(np.float32) - bg, axis=2)
    red, green, blue = rgb[:, :, 0].astype(int), rgb[:, :, 1].astype(int), rgb[:, :, 2].astype(int)
    pink = (red > 140) & (red > green + 22) & (blue > green + 8)
    mask = ((dist > 48) & ~pink).astype(np.uint8) * 255
    mask = cv2.erode(mask, np.ones((3, 3), np.uint8), iterations=1)
    core = cv2.erode(mask, np.ones((3, 3), np.uint8), iterations=1)
    fringe = ((mask > 0) & (core == 0)).astype(np.uint8) * 255
    filled = cv2.inpaint(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), fringe, 3, cv2.INPAINT_TELEA)
    filled = cv2.cvtColor(filled, cv2.COLOR_BGR2RGB)
    soft = cv2.GaussianBlur(mask, (3, 3), 0)
    soft[mask == 0] = 0
    ys, xs = np.where(soft > 12)
    pad = 8
    y0, y1 = max(0, ys.min() - pad), min(h, ys.max() + pad + 1)
    x0, x1 = max(0, xs.min() - pad), min(w, xs.max() + pad + 1)
    rgba = np.dstack([filled[y0:y1, x0:x1], soft[y0:y1, x0:x1]])
    return rgba


def resize_max(rgba, longest):
    h, w = rgba.shape[:2]
    scale = longest / max(h, w)
    if scale >= 1:
        return rgba
    size = (max(1, int(round(w * scale))), max(1, int(round(h * scale))))
    return np.array(Image.fromarray(rgba, 'RGBA').resize(size, Image.Resampling.LANCZOS))


def remap(rgba, dx, dy):
    h, w = rgba.shape[:2]
    grid_x, grid_y = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    return cv2.remap(rgba, grid_x - dx, grid_y - dy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))


def loop_angles(count=12):
    return np.linspace(0, 2 * np.pi, count, endpoint=False)


def octopus_frames(rgba):
    h, w = rgba.shape[:2]
    alpha = rgba[:, :, 3]
    ys, xs = np.where(alpha > 20)
    cy, cx = ys.mean(), xs.mean()
    yy, xx = np.mgrid[0:h, 0:w]
    ang = np.arctan2(yy - cy, xx - cx)
    dist = np.hypot(yy - cy, xx - cx)
    amp = np.clip((dist - dist.max() * 0.22) / (dist.max() * 0.55), 0, 1) ** 1.15
    frames = []
    for t in loop_angles():
        dx = np.sin(ang * 3 + t) * amp * 9
        dy = np.cos(ang * 2.2 + t) * amp * 6
        frames.append(remap(rgba, dx.astype(np.float32), dy.astype(np.float32)))
    return frames


def spider_frames(rgba):
    h, w = rgba.shape[:2]
    ys, xs = np.where(rgba[:, :, 3] > 20)
    cy, cx = ys.mean(), xs.mean()
    yy, xx = np.mgrid[0:h, 0:w]
    ang = np.arctan2(yy - cy, xx - cx)
    dist = np.hypot(yy - cy, xx - cx)
    amp = np.clip((dist - min(h, w) * 0.16) / (min(h, w) * 0.45), 0, 1)
    frames = []
    for t in loop_angles(10):
        dx = np.cos(ang) * np.sin(t + ang * 5) * amp * 5
        dy = np.sin(ang) * np.cos(t + ang * 4) * amp * 4
        frames.append(remap(rgba, dx.astype(np.float32), dy.astype(np.float32)))
    return frames


def flower_frames(rgba):
    h, w = rgba.shape[:2]
    frames = []
    for t in loop_angles(10):
        angle = np.sin(t) * 3.2
        image = Image.fromarray(rgba, 'RGBA')
        turned = image.rotate(angle, resample=Image.Resampling.BICUBIC, center=(w / 2, h - 2), expand=False)
        frames.append(np.array(turned))
    return frames


def bee_frames(rgba):
    rgb = rgba[:, :, :3].astype(np.int16)
    alpha = rgba[:, :, 3]
    wing = (rgb[:, :, 0] > 185) & (rgb[:, :, 1] > 170) & (rgb[:, :, 2] > 145) & (alpha > 30)
    wing = cv2.morphologyEx(wing.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)) > 0
    body = rgba.copy()
    body[wing] = 0
    wing_layer = np.zeros_like(rgba)
    wing_layer[wing] = rgba[wing]
    ys, xs = np.where(wing)
    if len(xs) < 20:
        return flower_frames(rgba)
    pivot = (float(xs.min() + 4), float(np.median(ys)))
    frames = []
    for t in loop_angles():
        angle = np.sin(t) * 16
        turned = Image.fromarray(wing_layer, 'RGBA').rotate(angle, resample=Image.Resampling.BICUBIC, center=pivot, expand=False)
        out = body.copy()
        wing_img = np.array(turned)
        cover = wing_img[:, :, 3] > 20
        out[cover] = wing_img[cover]
        frames.append(out)
    return frames


def bird_frames(rgba):
    h, w = rgba.shape[:2]
    frames = []
    for t in loop_angles(10):
        lift = float(np.sin(t))
        turned = Image.fromarray(rgba, 'RGBA').rotate(
            lift * 3.5, resample=Image.Resampling.BICUBIC, center=(w * 0.45, h * 0.72), expand=False
        )
        frame = np.array(turned)
        bob = int(round(lift * -6))
        moved = np.zeros_like(frame)
        if bob < 0:
            moved[: h + bob] = frame[-bob:]
        elif bob > 0:
            moved[bob:] = frame[: h - bob]
        else:
            moved = frame
        frames.append(moved)
    return frames


def woodpecker_frames(rgba):
    h, w = rgba.shape[:2]
    rgb = rgba[:, :, :3].astype(int)
    trunk = (rgb[:, :, 0] > 90) & (rgb[:, :, 0] < 190) & (np.abs(rgb[:, :, 0] - rgb[:, :, 1]) < 35) & (rgb[:, :, 1] > rgb[:, :, 2] + 10) & (rgba[:, :, 3] > 20)
    trunk[:, int(w * 0.48):] = False
    bird = rgba.copy()
    bird[trunk] = 0
    trunk_layer = np.zeros_like(rgba)
    trunk_layer[trunk] = rgba[trunk]
    pecks = [0, -3, -8, -14, -8, -2, 1, 0, 0, 0]
    frames = []
    for dx in pecks:
        moved = remap(bird, np.full((h, w), dx, np.float32), np.zeros((h, w), np.float32))
        out = trunk_layer.copy()
        cover = moved[:, :, 3] > 16
        out[cover] = moved[cover]
        frames.append(out)
    return frames


def school_frames(rgba):
    alpha = (rgba[:, :, 3] > 30).astype(np.uint8)
    count, labels = cv2.connectedComponents(alpha)
    pieces = []
    for label in range(1, count):
        sel = labels == label
        if sel.sum() < 40:
            continue
        ys, xs = np.where(sel)
        pieces.append((sel, xs.mean()))
    frames = []
    for t in loop_angles():
        out = np.zeros_like(rgba)
        for i, (sel, cx) in enumerate(pieces):
            phase = cx * 0.01 + i
            dx = np.sin(t + phase) * 7
            dy = np.cos(t * 1.3 + phase) * 3.5
            layer = np.zeros_like(rgba)
            layer[sel] = rgba[sel]
            moved = remap(layer, np.full(sel.shape, dx, np.float32), np.full(sel.shape, dy, np.float32))
            cover = moved[:, :, 3] > 16
            out[cover] = moved[cover]
        frames.append(out)
    return frames


def save_pack(name, frames, loop=True, fps=12, travel=0, face=-1, hop=0):
    height, width = frames[0].shape[:2]
    sheet = np.zeros((height, width * len(frames), 4), np.uint8)
    meta = []
    for i, frame in enumerate(frames):
        if frame.shape[0] != height or frame.shape[1] != width:
            canvas = np.zeros((height, width, 4), np.uint8)
            canvas[:frame.shape[0], :frame.shape[1]] = frame[:height, :width]
            frame = canvas
        sheet[:, i * width:(i + 1) * width] = frame
        meta.append({'x': i * width, 'y': 0, 'w': width, 'h': height, 'dx': 0, 'dy': 0})
    Image.fromarray(sheet, 'RGBA').save(OUT / f'{name}.webp', quality=84, method=4)
    Image.fromarray(frames[0], 'RGBA').save(OUT / f'{name}-poster.webp', quality=86, method=4)
    Image.fromarray(frames[0], 'RGBA').save(ROOT / 'v5' / 'preview' / f'{name}-poster.png')
    return {
        'sheet': f'assets/creatures/{name}.webp',
        'poster': f'assets/creatures/{name}-poster.webp',
        'frames': meta,
        'viewport': {'w': width, 'h': height},
        'fps': fps,
        'loop': loop,
        'duration': int(round(1000 * len(frames) / fps)),
        'travel': travel,
        'face': face,
        'hop': hop,
        'label': name,
    }


def main():
    jobs = {
        'octopus': (SRC / 'octopus-angular.jpg', octopus_frames, dict(fps=10, travel=0, face=0, hop=0)),
        'spider': (SRC / 'spider-lowpoly.jpg', spider_frames, dict(fps=10, travel=0, face=0)),
        'heliconia': (SRC / 'flower-lowpoly.jpg', flower_frames, dict(fps=8, travel=0, face=0)),
        'bee': (SRC / 'bee-lowpoly.jpg', bee_frames, dict(fps=12, travel=0.18, face=-1, hop=0.06)),
        'songbird': (SRC / 'songbird-lowpoly.jpg', bird_frames, dict(fps=10, travel=0.12, face=-1, hop=0.04)),
        'woodpecker': (SRC / 'woodpecker-lowpoly.jpg', woodpecker_frames, dict(fps=10, travel=0, face=-1, loop=False)),
        'fishschool': (SRC / 'fishschool-lowpoly.jpg', school_frames, dict(fps=10, travel=0.22, face=-1)),
        'shoal': (SRC / 'fishschool-silver.jpg', school_frames, dict(fps=10, travel=0.2, face=-1)),
    }
    packs = {}
    for name, (path, builder, options) in jobs.items():
        plate = resize_max(cutout(path), 520 if name != 'octopus' else 640)
        frames = builder(plate)
        loop = options.pop('loop', True)
        packs[name] = save_pack(name, frames, loop=loop, **options)
        print(name, plate.shape, len(frames), flush=True)
    body = '/* New low-poly creatures and the redrawn octopus. */\n'
    body += '(function(){\nconst A=window.ANIMAL_ANIMATIONS=window.ANIMAL_ANIMATIONS||{};\nconst local=window.V5_LOCAL=window.V5_LOCAL||{};\n'
    body += 'const packs=' + json.dumps(packs, separators=(',', ':')) + ';\n'
    body += 'for(const [id,pack] of Object.entries(packs)){A[id]=Object.assign(A[id]||{},pack);local[pack.sheet]=true;local[pack.poster]=true;}\n})();\n'
    (ROOT / 'v5' / 'assets' / 'v5-creatures.js').write_text(body, encoding='utf-8')
    print('creatures ready', flush=True)


if __name__ == '__main__':
    main()
