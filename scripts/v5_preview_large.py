"""Large flat triangles, original silhouette, no wireframe."""
import json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
from scipy.spatial import Delaunay

ROOT = Path(__file__).resolve().parents[1]
text = (ROOT / 'geo/assets/animation-data.js').read_text(encoding='utf-8')
DATA = json.loads(text.split('=', 1)[1].strip().rstrip(';'))
OUT = ROOT / 'v5' / 'preview'


def frame0(animal):
    spec = DATA[animal]
    sheet = Image.open(ROOT / 'geo' / spec['sheet']).convert('RGBA')
    f = spec['frames'][0]
    return np.array(sheet.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h'])))


def facet_keep(rgba, div):
    """Flatten only smooth shading. Eyes, spots and stripes stay."""
    h, w = rgba.shape[:2]
    step = max(10, int(round(w / div)))
    mask = rgba[:, :, 3] > 30
    pts = []
    contours, _ = cv2.findContours(mask.astype(np.uint8) * 255, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    for c in contours:
        if len(c) < 8:
            continue
        c = c[:, 0, :]
        acc = 1e9
        for i in range(len(c)):
            if i:
                acc += float(np.hypot(*(c[i] - c[i - 1])))
            if acc >= step:
                pts.append([float(c[i, 0]), float(c[i, 1])])
                acc = 0
    y, row = step * 0.5, 0
    while y < h:
        x = step * 0.5 if row % 2 else step * 0.2
        while x < w:
            xi, yi = int(np.clip(x, 0, w - 1)), int(np.clip(y, 0, h - 1))
            if mask[yi, xi]:
                pts.append([float(xi), float(yi)])
            x += step
        y += step * 0.866
        row += 1
    pts = np.array(pts, np.float32)
    out = rgba.copy()
    for tri in Delaunay(pts).simplices:
        poly = np.round(pts[tri]).astype(np.int32)
        if cv2.contourArea(poly.astype(np.float32)) < 4:
            continue
        overlay = np.zeros((h, w), np.uint8)
        cv2.fillConvexPoly(overlay, poly, 255)
        sel = (overlay > 0) & mask
        if sel.sum() < 6:
            continue
        cols = rgba[sel][:, :3].astype(np.float32)
        if cols.std(axis=0).mean() > 14:
            continue
        out[sel, :3] = np.median(cols, axis=0)
    return out


def facet(rgba, div):
    h, w = rgba.shape[:2]
    step = max(12, int(round(w / div)))
    mask = rgba[:, :, 3] > 30
    pts = []
    contours, _ = cv2.findContours(mask.astype(np.uint8) * 255, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    for c in contours:
        if len(c) < 8:
            continue
        c = c[:, 0, :]
        acc = 1e9
        for i in range(len(c)):
            if i:
                acc += float(np.hypot(*(c[i] - c[i - 1])))
            if acc >= step * 0.9:
                pts.append([float(c[i, 0]), float(c[i, 1])])
                acc = 0
    y, row = step * 0.5, 0
    while y < h:
        x = step * 0.5 if row % 2 else step * 0.2
        while x < w:
            xi, yi = int(x), int(y)
            if 0 <= xi < w and 0 <= yi < h and mask[yi, xi]:
                pts.append([x, y])
            x += step
        y += step * 0.866
        row += 1
    pts = np.array(pts, np.float32)
    simplices = Delaunay(pts).simplices
    color = np.zeros_like(rgba)
    for tri in simplices:
        poly = np.round(pts[tri]).astype(np.int32)
        if cv2.contourArea(poly.astype(np.float32)) < 4:
            continue
        overlay = np.zeros((h, w), np.uint8)
        cv2.fillConvexPoly(overlay, poly, 255)
        sel = (overlay > 0) & mask
        if sel.sum() < 3:
            continue
        mean = np.median(rgba[sel], axis=0)
        color[overlay > 0, :3] = mean[:3]
        color[overlay > 0, 3] = 255
    color[:, :, 3] = rgba[:, :, 3]
    color[rgba[:, :, 3] < 20] = 0
    return color


def save(animal, div):
    src, out = frame0(animal), facet(frame0(animal), div)
    h = 320
    def fit(im):
        pic = Image.fromarray(im, 'RGBA')
        pic.thumbnail((420, h))
        canvas = Image.new('RGBA', (420, h), (255, 0, 255, 255))
        canvas.paste(pic, ((420 - pic.width) // 2, h - pic.height), pic)
        return canvas.convert('RGB')
    both = Image.new('RGB', (844, h))
    both.paste(fit(src), (0, 0))
    both.paste(fit(out), (424, 0))
    both.save(OUT / f'{animal}-large{div}.jpg', quality=90)
    print(animal, div)

def save_keep(animal, div):
    src = frame0(animal)
    out = facet_keep(src, div)
    h = 320
    def fit(im):
        pic = Image.fromarray(im, 'RGBA')
        pic.thumbnail((420, h))
        canvas = Image.new('RGBA', (420, h), (255, 0, 255, 255))
        canvas.paste(pic, ((420 - pic.width) // 2, h - pic.height), pic)
        return canvas.convert('RGB')
    both = Image.new('RGB', (844, h))
    both.paste(fit(src), (0, 0))
    both.paste(fit(out), (424, 0))
    both.save(OUT / f'{animal}-keep{div}.jpg', quality=90)
    print('keep', animal, div)

if __name__ == '__main__':
    for animal in ('jaguar', 'cheetah', 'giraffe'):
        save_keep(animal, 14)
