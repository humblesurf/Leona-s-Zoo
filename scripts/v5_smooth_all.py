"""Build real in-between frames so a tap plays as continuous motion.

Each authored pose gets two optical-flow frames before the next pose.
Where the two warps disagree, the nearer pose is kept so necks and legs
do not leave a ghost.
"""
import json
from pathlib import Path
import numpy as np
from PIL import Image
import cv2

ROOT = Path(__file__).resolve().parents[1]
GEO = ROOT / 'geo'
OUT = ROOT / 'v5' / 'assets' / 'motion'
PREVIEW = ROOT / 'v5' / 'preview'
OUT.mkdir(parents=True, exist_ok=True)
SKIP = {'octopus'}

text = (GEO / 'assets' / 'animation-data.js').read_text(encoding='utf-8')
DATA = json.loads(text.split('=', 1)[1].strip().rstrip(';'))


def gray(rgba):
    return cv2.cvtColor(rgba[:, :, :3], cv2.COLOR_RGB2GRAY)


def flow(a, b):
    return cv2.calcOpticalFlowFarneback(gray(a), gray(b), None, 0.5, 4, 21, 3, 5, 1.2, 0)


def warp(img, field, t):
    h, w = img.shape[:2]
    grid_x, grid_y = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    return cv2.remap(
        img,
        grid_x - field[:, :, 0] * t,
        grid_y - field[:, :, 1] * t,
        cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=(0, 0, 0, 0),
    )


def inbetween(a, b, t, forward, backward):
    wa, wb = warp(a, forward, t), warp(b, backward, 1 - t)
    diff = np.mean(np.abs(wa[:, :, :3].astype(np.int16) - wb[:, :, :3].astype(np.int16)), axis=2)
    agree = (diff < 14) & (wa[:, :, 3] > 40) & (wb[:, :, 3] > 40)
    blended = (1 - t) * wa.astype(np.float32) + t * wb.astype(np.float32)
    out = (wa if t < 0.5 else wb).copy()
    out[agree] = np.clip(blended[agree], 0, 255).astype(np.uint8)
    return out


def load_frames(spec):
    sheet = Image.open(GEO / spec['sheet']).convert('RGBA')
    frames = []
    for frame in spec['frames']:
        crop = sheet.crop((frame['x'], frame['y'], frame['x'] + frame['w'], frame['y'] + frame['h']))
        frames.append(np.array(crop))
    height, width = frames[0].shape[:2]
    fitted = []
    for frame in frames:
        if frame.shape[0] != height or frame.shape[1] != width:
            canvas = np.zeros((height, width, 4), np.uint8)
            canvas[:frame.shape[0], :frame.shape[1]] = frame
            frame = canvas
        fitted.append(frame)
    return fitted


def expand(frames, loop):
    sequence = list(frames)
    if loop and len(frames) > 1:
        sequence.append(frames[0])
    output = []
    for start, end in zip(sequence, sequence[1:]):
        forward, backward = flow(start, end), flow(end, start)
        output.append(start)
        output.append(inbetween(start, end, 1 / 3, forward, backward))
        output.append(inbetween(start, end, 2 / 3, forward, backward))
    if not loop:
        output.append(frames[-1])
    return output


def save_contact(animal, frames):
    thumbs = []
    for frame in frames[::2]:
        image = Image.fromarray(frame, 'RGBA')
        image.thumbnail((120, 90))
        plate = Image.new('RGB', (image.width + 2, 90), (246, 238, 220))
        plate.paste(image.convert('RGB'), (1, 90 - image.height), image)
        thumbs.append(plate)
    sheet = Image.new('RGB', (sum(item.width for item in thumbs), 90), (246, 238, 220))
    x = 0
    for item in thumbs:
        sheet.paste(item, (x, 0))
        x += item.width
    sheet.save(PREVIEW / f'{animal}-smooth.png')


def main():
    packs = {}
    for index, (animal, spec) in enumerate(DATA.items(), 1):
        if animal in SKIP or not spec.get('frames') or not spec.get('sheet'):
            print(f'skip {animal}', flush=True)
            continue
        frames = load_frames(spec)
        loop = bool(spec.get('loop'))
        smooth = expand(frames, loop)
        height, width = smooth[0].shape[:2]
        sheet = np.zeros((height, width * len(smooth), 4), np.uint8)
        meta = []
        for i, frame in enumerate(smooth):
            sheet[:, i * width:(i + 1) * width] = frame
            meta.append({'x': i * width, 'y': 0, 'w': width, 'h': height, 'dx': 0, 'dy': 0})
        sheet_name = f'assets/motion/{animal}.webp'
        poster_name = f'assets/motion/{animal}-poster.webp'
        Image.fromarray(sheet, 'RGBA').save(OUT / f'{animal}.webp', quality=82, method=4)
        Image.fromarray(smooth[0], 'RGBA').save(OUT / f'{animal}-poster.webp', quality=84, method=4)
        old_fps = spec.get('fps') or 8
        fps = round(old_fps * len(smooth) / max(1, len(frames)), 2) if loop else 13
        packs[animal] = {
            'sheet': sheet_name,
            'poster': poster_name,
            'frames': meta,
            'viewport': {'w': width, 'h': height},
            'fps': fps,
        }
        if animal in {'zebra', 'flamingo', 'hippo', 'elephant', 'jaguar'}:
            save_contact(animal, smooth)
        print(f'{index:02d}/{len(DATA)} {animal} {len(frames)}->{len(smooth)} fps {fps}', flush=True)
    body = '/* Generated in-between frames. Loaded after animation-data.js. */\n'
    body += '(function(){\nconst A=window.ANIMAL_ANIMATIONS||{};\nconst local=window.V5_LOCAL=window.V5_LOCAL||{};\n'
    body += 'const packs=' + json.dumps(packs, separators=(',', ':')) + ';\n'
    body += 'for(const [id,pack] of Object.entries(packs)){if(!A[id])continue;Object.assign(A[id],pack);local[pack.sheet]=true;local[pack.poster]=true;}\n'
    body += '})();\n'
    (ROOT / 'v5' / 'assets' / 'v5-motion.js').write_text(body, encoding='utf-8')
    print('wrote', len(packs), 'animals', flush=True)


if __name__ == '__main__':
    main()
