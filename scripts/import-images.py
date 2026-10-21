import json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
records=json.loads((ROOT/'geo/assets/generated-manifest.json').read_text(encoding='utf-8'))
scenes=['savanna','rainforest','ocean','arctic','antarctic']
for r in records:
    im=Image.open(r['path']).convert('RGBA')
    if r['id'] in scenes:
        dest=ROOT/f"geo/assets/bg/{r['id']}-panorama-v2.webp"
        im.convert('RGB').save(dest,quality=90,method=6)
    else:
        alpha=im.getchannel('A');bbox=alpha.getbbox()
        if alpha.getextrema()[0]==255:
            raise ValueError(f"Missing transparent background: {r['id']}")
        im=im.crop(bbox)
        im.thumbnail((1100,900),Image.Resampling.LANCZOS)
        name='otter-v2' if r['id']=='otter' else r['id']
        dest=ROOT/f'geo/assets/animals/{name}.webp'
        im.save(dest,quality=92,method=6)
    print(r['id'],im.size,dest.name)
