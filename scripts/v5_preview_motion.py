"""Preview optical-flow inbetweens and a tracked low-poly mesh on a few animals."""
import json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw
from scipy.spatial import Delaunay

ROOT = Path(__file__).resolve().parents[1]
GEO = ROOT / 'geo'
OUT = ROOT / 'v5' / 'preview'
OUT.mkdir(parents=True, exist_ok=True)

text = (GEO / 'assets' / 'animation-data.js').read_text(encoding='utf-8')
DATA = json.loads(text.split('=', 1)[1].strip().rstrip(';'))


def load_frames(spec):
    sheet = Image.open(GEO / spec['sheet']).convert('RGBA')
    frames = []
    for f in spec['frames']:
        frames.append(np.array(sheet.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h']))))
    return frames


def gray(rgba):
    return cv2.cvtColor(rgba[:, :, :3], cv2.COLOR_RGB2GRAY)


def flow(a, b):
    return cv2.calcOpticalFlowFarneback(gray(a), gray(b), None, 0.5, 4, 21, 3, 5, 1.2, 0)


def warp(img, fl, t):
    h, w = img.shape[:2]
    grid_x, grid_y = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    return cv2.remap(img, grid_x - fl[:, :, 0] * t, grid_y - fl[:, :, 1] * t, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)


def inbetween(a, b, t, fab, fba):
    wa, wb = warp(a, fab, t), warp(b, fba, 1 - t)
    aa, bb = wa[:, :, 3:4].astype(np.float32), wb[:, :, 3:4].astype(np.float32)
    weight = (1 - t) * aa + t * bb + 1e-3
    rgb = ((1 - t) * wa[:, :, :3] * aa + t * wb[:, :, :3] * bb) / weight
    alpha = np.clip(np.maximum(aa * (1 - t), bb * t) + np.minimum(aa, bb), 0, 255)
    out = np.zeros_like(a)
    out[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    out[:, :, 3] = alpha[:, :, 0].astype(np.uint8)
    return out


def mesh_points(mask, step):
    h, w = mask.shape
    pts = []
    contours, _ = cv2.findContours(mask.astype(np.uint8) * 255, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    for c in contours:
        if len(c) < 10:
            continue
        c = c[:, 0, :]
        acc = 1e9
        for i in range(len(c)):
            if i:
                acc += float(np.hypot(*(c[i] - c[i - 1])))
            if acc >= step:
                pts.append((float(c[i, 0]), float(c[i, 1])))
                acc = 0
    s = step * 1.05
    y, row = s * 0.45, 0
    while y < h - 1:
        x = (s * 0.5) if row % 2 else s * 0.15
        while x < w - 1:
            xi, yi = int(x), int(y)
            if mask[yi, xi]:
                pts.append((float(xi), float(yi)))
            x += s
        y += s * 0.866
        row += 1
    if len(pts) < 8:
        return np.zeros((0, 2), np.float32)
    return np.unique(np.round(np.array(pts, np.float32), 1), axis=0)


def sample_flow(fl, x, y):
    h, w = fl.shape[:2]
    xi, yi = int(np.clip(round(x), 1, w - 2)), int(np.clip(round(y), 1, h - 2))
    patch = fl[yi - 1:yi + 2, xi - 1:xi + 2].reshape(-1, 2)
    return np.median(patch, axis=0)


def render_mesh(shape, pts, simplices, colors):
    out = np.zeros(shape, np.uint8)
    for tri, color in zip(simplices, colors):
        if color is None:
            continue
        poly = np.round(pts[tri]).astype(np.int32)
        if cv2.contourArea(poly.astype(np.float32)) < 2:
            continue
        cv2.fillConvexPoly(out, poly, color)
    return out


def triangle_color(rgba, poly):
    h, w = rgba.shape[:2]
    samples = [poly.mean(axis=0)]
    samples.extend(poly)
    cols = []
    for p in samples:
        x, y = int(np.clip(p[0], 0, w - 1)), int(np.clip(p[1], 0, h - 1))
        if rgba[y, x, 3] > 40:
            cols.append(rgba[y, x])
    if not cols:
        return None
    c = np.median(np.array(cols), axis=0)
    return [int(c[0]), int(c[1]), int(c[2]), 255]


def tracked(frames, step):
    mask = frames[0][:, :, 3] > 24
    pts = mesh_points(mask, step)
    if len(pts) < 8:
        return []
    simplices = Delaunay(pts).simplices
    series = [pts.copy()]
    current = pts.copy()
    for a, b in zip(frames, frames[1:]):
        fl = flow(a, b)
        nxt = current.copy()
        for i, (x, y) in enumerate(current):
            nxt[i] += sample_flow(fl, x, y)
        series.append(nxt)
        current = nxt
    rendered = []
    for rgba, pts_i in zip(frames, series):
        colors = [triangle_color(rgba, pts_i[tri]) for tri in simplices]
        rendered.append(render_mesh(rgba.shape, pts_i, simplices, colors))
    # two inbetweens between each keyed pose, including colors and vertices
    smooth = []
    for i in range(len(frames) - 1):
        smooth.append(rendered[i])
        for t in (1 / 3, 2 / 3):
            pts_t = series[i] * (1 - t) + series[i + 1] * t
            colors = []
            for c0, c1 in zip(
                [triangle_color(frames[i], series[i][tri]) for tri in simplices],
                [triangle_color(frames[i + 1], series[i + 1][tri]) for tri in simplices],
            ):
                if c0 is None or c1 is None:
                    colors.append(c0 or c1)
                else:
                    colors.append([int(c0[k] * (1 - t) + c1[k] * t) for k in range(3)] + [255])
            smooth.append(render_mesh(frames[i].shape, pts_t, simplices, colors))
    smooth.append(rendered[-1])
    return smooth


def raster_smooth(frames, loop):
    pairs = list(zip(frames, frames[1:]))
    if loop and len(frames) > 2:
        pairs.append((frames[-1], frames[0]))
    out = []
    flows = []
    for a, b in pairs:
        flows.append((flow(a, b), flow(b, a)))
    for i, (a, b) in enumerate(pairs):
        if not loop or i < len(pairs) - 1 or not out:
            out.append(a)
        fab, fba = flows[i]
        out.append(inbetween(a, b, 1 / 3, fab, fba))
        out.append(inbetween(a, b, 2 / 3, fab, fba))
    if not loop:
        out.append(frames[-1])
    return out


def contact(frames, name, height=110):
    thumbs = []
    for f in frames:
        im = Image.fromarray(f, 'RGBA')
        im.thumbnail((180, height))
        canvas = Image.new('RGBA', (im.width + 4, height), (246, 238, 220, 255))
        canvas.paste(im, (2, height - im.height), im)
        thumbs.append(canvas.convert('RGB'))
    sheet = Image.new('RGB', (sum(t.width for t in thumbs), height), (246, 238, 220))
    x = 0
    for t in thumbs:
        sheet.paste(t, (x, 0))
        x += t.width
    sheet.save(OUT / name)
    print(name, len(frames), sheet.size)


def main():
    for animal in ('zebra', 'seahorse', 'elephant', 'hippo', 'flamingo'):
        spec = DATA[animal]
        frames = load_frames(spec)
        step = max(8, int(round(frames[0].shape[1] / 26)))
        contact(raster_smooth(frames, bool(spec.get('loop'))), f'{animal}-flow.png')
        contact(tracked(frames, step), f'{animal}-poly.png')
        print(animal, 'step', step, 'src', frames[0].shape)


if __name__ == '__main__':
    main()
