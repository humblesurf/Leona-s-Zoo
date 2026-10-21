"""Read-only alpha and source integrity checks for the generated buffalo gait art."""
from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'geo/assets/animation/v4-12-gait/source'
SELECTED = {
    0: ('buffalo-pair-01.png', 'left'),
    2: ('buffalo-pose-2-repair-a.png', None),
    3: ('buffalo-pose-3.png', None),
    4: ('buffalo-pose-4.png', None),
    5: ('buffalo-pose-5.png', None),
    7: ('buffalo-pose-7.png', None),
    8: ('buffalo-pose-8-repair-a.png', None),
    9: ('buffalo-pose-9.png', None),
}

records = []
for frame, (name, panel) in SELECTED.items():
    path = SOURCE / name
    if not path.exists():
        records.append({'frame': frame, 'source': name, 'exists': False})
        continue
    with Image.open(path) as raw:
        image = raw.convert('RGBA')
        if panel == 'left':
            # The left buffalo's tail crosses the geometric center (1068).
            # The original alpha has an empty inter-animal gap at x1090..1110.
            image = image.crop((0, 0, 1100, image.height))
        alpha = image.getchannel('A')
        counts = alpha.histogram()
        total = image.width * image.height
        bbox = alpha.point(lambda a: 255 if a >= 16 else 0).getbbox()
        corners = [alpha.getpixel(p) for p in [(0, 0), (image.width - 1, 0), (0, image.height - 1), (image.width - 1, image.height - 1)]]
        records.append({
            'frame': frame,
            'source': name,
            'panel': panel,
            'exists': True,
            'original_mode': raw.mode,
            'original_size': list(raw.size),
            'qa_panel_size': list(image.size),
            'visible_alpha_bbox': list(bbox) if bbox else None,
            'transparent_pixel_fraction': round(counts[0] / total, 5),
            'partial_alpha_pixel_fraction': round(sum(counts[1:255]) / total, 5),
            'corner_alpha': corners,
            'has_actual_alpha': counts[0] > 0 and max(corners) == 0,
        })

report = {'scope': 'Generated art alpha integrity; does not certify anatomical identity.', 'frames': records}
out = SOURCE / 'buffalo-alpha-qa-v4-12.json'
out.write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
