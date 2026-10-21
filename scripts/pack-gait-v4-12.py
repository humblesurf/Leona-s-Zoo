"""Pack complete authored drawings with body-only rigid registration.

All frames share a single output scale and union canvas. No mesh, cut-out
limbs, axis scaling, rotation, blending or per-frame bounding-box resizing.
"""
from pathlib import Path
import json, math
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'geo/assets/animation/v4-12-gait'
SOURCE=OUT/'source'
ids=['zebra','rhino','buffalo']
manifest={'tool':'built-in image_gen','registration':'Whole complete-body uniform scale and translation using stable body landmarks. Shared union canvas and output scale.','animals':{}}
for id in ids:
    regfile=SOURCE/f'{id}-registration-v4-12.json'
    if not regfile.exists():
        print('Waiting for registration:',id,flush=True)
        continue
    reg=json.loads(regfile.read_text(encoding='utf8'))
    frames=reg['frames']
    if len(frames)!=8:raise ValueError((id,len(frames)))
    images=[];bounds=[]
    for r in frames:
        if 'REJECTED' in r.get('sourceReviewStatus','').upper():
            raise ValueError('Rejected source cannot be packed: '+r['source'])
        image=Image.open(SOURCE/r['source']).convert('RGBA')
        panel=r.get('panel')
        if panel:image=image.crop(tuple(panel))
        bounds0=image.getchannel('A').point(lambda v:255 if v>8 else 0).getbbox()
        if not bounds0:raise ValueError('Empty '+r['source'])
        scale=r['uniformScaleToMaster'];tx,ty=r['translationToMaster']
        if panel:tx+=panel[0]*scale;ty+=panel[1]*scale
        bounds.append([bounds0[0]*scale+tx,bounds0[1]*scale+ty,bounds0[2]*scale+tx,bounds0[3]*scale+ty])
        images.append((image,scale,tx,ty))
    left=min(b[0]for b in bounds);top=min(b[1]for b in bounds)
    right=max(b[2]for b in bounds);bottom=max(b[3]for b in bounds)
    output_scale=650/(bottom-top)
    margin=16
    w=math.ceil((right-left)*output_scale)+2*margin
    h=650+2*margin
    sheet=Image.new('RGBA',(w*4,h*2),(0,0,0,0));rendered=[]
    for i,(image,scale,tx,ty)in enumerate(images):
        total_scale=scale*output_scale
        dx=(tx-left)*output_scale+margin;dy=(ty-top)*output_scale+margin
        raster=image.transform((w,h),Image.Transform.AFFINE,(1/total_scale,0,-dx/total_scale,0,1/total_scale,-dy/total_scale),Image.Resampling.BICUBIC)
        sheet.alpha_composite(raster,((i%4)*w,(i//4)*h));rendered.append(raster)
        box=raster.getchannel('A').point(lambda v:255 if v>8 else 0).getbbox()
        if min(box[0],box[1],w-box[2],h-box[3])<8:raise ValueError('Clipped '+id+' '+str(i))
    sheet.save(OUT/f'{id}-sheet.webp',lossless=True,method=6)
    rendered[2].save(OUT/f'{id}-poster.webp',lossless=True,method=6)
    manifest['animals'][id]={'sheet':f'assets/animation/v4-12-gait/{id}-sheet.webp','poster':f'assets/animation/v4-12-gait/{id}-poster.webp','viewport':{'w':w,'h':h},'frames':[{'x':(i%4)*w,'y':(i//4)*h,'w':w,'h':h,'dx':0,'dy':0}for i in range(8)],'restFrame':2,'unionMaster':[left,top,right,bottom],'outputScale':output_scale,'margin':margin,'registration':reg,'sourceSelection':json.loads((SOURCE/f'{id}-source-selection-v4-12.json').read_text(encoding='utf8'))if(SOURCE/f'{id}-source-selection-v4-12.json').exists()else None}
    print('Packed',id,w,h,flush=True)
if len(manifest['animals'])==3:
    manifest['prompts']={f.name:json.loads(f.read_text(encoding='utf8'))for f in SOURCE.glob('*.json')if 'prompt' in f.name}
    (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
    (OUT/'partial-pack.json').unlink(missing_ok=True)
    print('All three packs ready',flush=True)
else:
    (OUT/'partial-pack.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
