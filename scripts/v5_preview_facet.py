"""Edge-aware triangular facets that keep stripes, eyes, and the original silhouette."""
import json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
from scipy.spatial import Delaunay

ROOT = Path(__file__).resolve().parents[1]
GEO = ROOT / 'geo'
OUT = ROOT / 'v5' / 'preview'
text = (GEO / 'assets' / 'animation-data.js').read_text(encoding='utf-8')
DATA = json.loads(text.split('=', 1)[1].strip().rstrip(';'))


def frame0(animal):
    spec = DATA[animal]
    sheet = Image.open(GEO / spec['sheet']).convert('RGBA')
    f = spec['frames'][0]
    return np.array(sheet.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h'])))


def facet(rgba, step):
    h, w = rgba.shape[:2]
    mask = rgba[:, :, 3] > 28
    gray = cv2.cvtColor(rgba[:, :, :3], cv2.COLOR_RGB2GRAY)
    edges = cv2.Canny(gray, 35, 110)
    edges[~mask] = 0
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
            if acc >= step * 0.85:
                pts.append([float(c[i, 0]), float(c[i, 1])])
                acc = 0
    for y in range(0, h, step):
        for x in range(0, w, step):
            sub = mask[y:y + step, x:x + step]
            if sub.size == 0 or sub.mean() < 0.45:
                continue
            e = edges[y:y + step, x:x + step]
            if e.any() and sub.mean() > 0.7:
                ey, ex = np.where(e)
                pts.append([x + float(ex.mean()), y + float(ey.mean())])
            else:
                pts.append([x + step * 0.5, y + step * 0.5])
    pts = np.unique(np.round(np.array(pts, np.float32), 1), axis=0)
    if len(pts) < 8:
        return rgba
    simplices = Delaunay(pts).simplices
    base = rgba.copy()
    color = rgba[:, :, :3].astype(np.float32)
    for tri in simplices:
        poly = np.round(pts[tri]).astype(np.int32)
        if cv2.contourArea(poly.astype(np.float32)) < 3:
            continue
        cx, cy = poly.mean(axis=0)
        xi, yi = int(np.clip(cx, 0, w - 1)), int(np.clip(cy, 0, h - 1))
        if not mask[yi, xi]:
            continue
        overlay = np.zeros((h, w), np.uint8)
        cv2.fillConvexPoly(overlay, poly, 255)
        sel = (overlay > 0) & mask
        if sel.sum() < 4:
            continue
        cols = color[sel]
        std = cols.std(axis=0).mean()
        if std > 18:
            continue
        mean = np.median(cols, axis=0)
        base[sel, :3] = mean
    # crisp facet seams on the flattened areas only
    seam = np.zeros((h, w), np.uint8)
    for tri in simplices:
        poly = np.round(pts[tri]).astype(np.int32)
        cv2.polylines(seam, [poly], True, 255, 1, cv2.LINE_AA)
    seam = (seam > 0) & mask
    base[seam, :3] = (base[seam, :3].astype(np.float32) * 0.86).astype(np.uint8)
    base[:, :, 3] = rgba[:, :, 3]
    return base


def side(animal, step):
    src = frame0(animal)
    out = facet(src, step)
    h = 280
    def fit(im):
        pic = Image.fromarray(im, 'RGBA')
        pic.thumbnail((360, h))
        canvas = Image.new('RGBA', (360, h), (255, 0, 255, 255))
        canvas.paste(pic, ((360 - pic.width) // 2, h - pic.height), pic)
        return canvas.convert('RGB')
    both = Image.new('RGB', (724, h), (40, 40, 40))
    both.paste(fit(src), (0, 0))
    both.paste(fit(out), (364, 0))
    both.save(OUT / f'{animal}-facet{step}.jpg', quality=90)
    print(animal, step)


if __name__ == '__main__':
    for animal, step in (('zebra', 9), ('elephant', 11), ('seahorse', 10), ('lion', 10), ('octopus', 10), ('butterfly', 8)):
        side(animal, step)
