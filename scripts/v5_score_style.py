"""Score how faceted each animal poster already is. Low score = smooth shading."""
import json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
text = (ROOT / 'geo/assets/animation-data.js').read_text(encoding='utf-8')
DATA = json.loads(text.split('=', 1)[1].strip().rstrip(';'))
rows = []
for animal, spec in DATA.items():
    poster = ROOT / 'geo' / spec['poster']
    if not poster.exists():
        continue
    rgba = np.array(Image.open(poster).convert('RGBA'))
    mask = rgba[:, :, 3] > 40
    if mask.sum() < 50:
        continue
    gray = cv2.cvtColor(rgba[:, :, :3], cv2.COLOR_RGB2GRAY)
    mag = cv2.Laplacian(gray, cv2.CV_32F)
    mag = np.abs(mag)
    inside = mag[mask]
    flat = (inside < 2.5).mean()
    rows.append((flat, animal, rgba.shape[1], rgba.shape[0]))
rows.sort()
for flat, animal, w, h in rows:
    print(f'{flat:5.2f}  {animal:16} {w}x{h}')
