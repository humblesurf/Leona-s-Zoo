"""Print placements and background bands used to seat new animals."""
import json
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
text = (ROOT / 'geo/assets/game-data.js').read_text(encoding='utf-8')
data = json.loads(text.split('GAME_SCENES = ', 1)[1].split(';\n', 1)[0])
for scene in ('savanna', 'rainforest', 'ocean'):
    print('\n==', scene, 'screens', data[scene]['numScreens'])
    for a in data[scene]['animals']:
        print(f"  {a['id']:16} u={a['u']:.3f} feet={a.get('feetY')} h={a.get('h')} idle={a.get('idle')} support={a.get('support')}")

dialogue = json.loads(text.split('GAME_DIALOGUE = ', 1)[1].split(';\n', 1)[0])
sample = dialogue['butterfly']
print('\nDIALOGUE KEYS', list(sample.keys()))
print('voice', sample.get('voice'))
print('variants en', sample.get('voiceVariants', {}).get('en'))
print('name', sample['name'])
print('intro en', sample['intro']['en'][:180])

def band(path, label):
    im = np.array(Image.open(path).convert('RGB'))
    h, w = im.shape[:2]
    r, g, b = im[:, :, 0].astype(int), im[:, :, 1].astype(int), im[:, :, 2].astype(int)
    water = (b > r + 15) & (g > r) & (b > 70)
    flower = (r > 150) & (r > g + 40) & (r > b + 30)
    print(f'\n{label} {w}x{h}')
    rows = np.where(water.any(axis=1))[0]
    if len(rows):
        print(' water y', rows[0] / h, rows[-1] / h, 'densest', (np.argmax(water.sum(axis=1)) / h))
    cols = np.where(water.sum(axis=0) > h * 0.04)[0]
    if len(cols):
        print(' water x', cols[0] / w, cols[-1] / w)
    frows = np.where(flower.sum(axis=1) > w * 0.005)[0]
    if len(frows):
        print(' flower y', frows[0] / h, frows[-1] / h)
        # x clusters
        xs = np.where(flower.any(axis=0))[0]
        if len(xs):
            splits = np.where(np.diff(xs) > 20)[0]
            starts = [xs[0]] + [xs[i + 1] for i in splits]
            ends = [xs[i] for i in splits] + [xs[-1]]
            print(' flower x bands', [(round(s / w, 3), round(e / w, 3)) for s, e in zip(starts, ends)])

band(ROOT / 'geo/assets/bg/reference/rainforest-preferred-v4.png', 'rainforest')
band(ROOT / 'geo/assets/bg/reference/ocean-preferred-v4.png', 'ocean')
band(ROOT / 'geo/assets/bg/reference/savanna-preferred-v4.png', 'savanna')
