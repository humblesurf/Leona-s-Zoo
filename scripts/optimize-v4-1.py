"""High quality WebP delivery encoding; unchanged dimensions and exact alpha."""
import json,concurrent.futures
from pathlib import Path
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'geo/assets/animation/v4-1';rows=[]
assert json.loads((OUT/'audit.json').read_text(encoding='utf8'))['ready']==54
def encode(p):
    assert p.resolve().is_relative_to(OUT.resolve())
    im=Image.open(p).convert('RGBA');before=np.array(im);original=p.stat().st_size;temp=p.with_suffix('.delivery.webp')
    im.save(temp,'WEBP',quality=98,method=3,alpha_quality=100)
    after=np.array(Image.open(temp).convert('RGBA'))
    assert np.array_equal(before[:,:,3],after[:,:,3]),p.name+' alpha changed'
    visible=before[:,:,3]>128;difference=np.abs(before[:,:,:3].astype('int16')-after[:,:,:3].astype('int16'))[visible]
    error=float(difference.mean());assert error<3,p.name+' encoding quality'
    small=temp.stat().st_size
    if small<original:temp.replace(p)
    else:temp.unlink()
    return {'file':p.name,'size':list(im.size),'before':original,'after':p.stat().st_size,'alphaExact':True,'meanRgbError':round(error,3)}
paths=[p for p in sorted(OUT.glob('*.webp')) if p.name.endswith(('-poster.webp','-frames.webp'))]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for row in pool.map(encode,paths):
        rows.append(row)
        if len(rows)%18==0:print('Encoded',len(rows),'of',len(paths),flush=True)
(OUT/'encoding.json').write_text(json.dumps({'quality':98,'sourcePngsPreserved':True,'originalBackgroundsUnchanged':True,'files':rows},indent=2),encoding='utf8')
print(json.dumps({'files':len(rows),'before':sum(r['before'] for r in rows),'after':sum(r['after'] for r in rows),'alphaExact':True}))
