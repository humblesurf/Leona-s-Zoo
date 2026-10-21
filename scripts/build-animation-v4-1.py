"""Package sixteen authored poses; preserve original RGB and alpha.
Mechanical connected-component extraction, padding and lossless WebP encoding.
No mesh, optical flow, limb slicing, repainting or deformation is performed.
"""
import json,hashlib,time,sys,importlib.util
from pathlib import Path
import numpy as np
from PIL import Image,ImageFilter,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'geo/assets/animation/v4-1'
spec=importlib.util.spec_from_file_location('old_packager',ROOT/'scripts/build-animation-v4.py')
old=importlib.util.module_from_spec(spec);spec.loader.exec_module(old)
plan=json.loads((OUT/'plan.json').read_text(encoding='utf-8-sig'))
baseline=(ROOT/'share/runtime-v4/assets/animation-data.js').read_text(encoding='utf-8-sig')
baseline=json.loads(baseline[baseline.index('{'):baseline.rindex('}')+1])
manifest={k:v for k,v in baseline.items() if k not in {'tapir','capybara'}}
report=[];done=set();errors={};top_ids={'sloth','monkey','orangutan'}
def extract(rec):
    id=rec['id'];images=[];cells=[];metadata=[]
    for part in 'ab':
        meta=json.loads((OUT/'source'/f'{id}-{part}.json').read_text(encoding='utf-8-sig'))
        im=Image.open(ROOT/meta['source']).convert('RGBA');alpha=np.array(im.getchannel('A'))
        # Some generated PNGs encode virtually transparent pixels as alpha 1–3.
        if np.mean(alpha<16)<.18:raise ValueError(f'{id}-{part}: transparency missing')
        boxes,labels=old.components(alpha)
        main=[b for b in boxes if b[4]>=max(500,boxes[0][4]*.13)]
        if len(main)!=8:raise ValueError(f'{id}-{part}: expected 8 whole poses, found {len(main)}; areas {[b[4] for b in main]}')
        # Chronological reading order for an authored two-column / four-row atlas.
        # Ordering each column independently also handles a leaping pose placed
        # higher in its cell than a neighbouring resting pose.
        columns=[[b for b in main if ((b[0]+b[2])/2<im.width/2)==left] for left in [True,False]]
        if [len(c) for c in columns]!=[4,4]:raise ValueError(f'{id}-{part}: expected two columns of four poses')
        for col in columns:col.sort(key=lambda b:(b[1]+b[3])/2)
        ordered=[columns[col][row] for row in range(4) for col in range(2)]
        images.append(im);metadata.append(meta)
        for b in ordered:
            x0=max(0,b[0]-2);y0=max(0,b[1]-2);x1=min(im.width,b[2]+2);y1=min(im.height,b[3]+2)
            cell=im.crop((x0,y0,x1,y1))
            mask=Image.fromarray(((labels[y0:y1,x0:x1]==b[5])*255).astype('uint8')).filter(ImageFilter.MaxFilter(5))
            aa=np.array(cell.getchannel('A'));aa[np.array(mask)==0]=0;cell.putalpha(Image.fromarray(aa))
            grip=None
            if id in top_ids:
                _,xs=np.nonzero(aa[:max(3,round(cell.height*.045))]>96)
                grip=int(np.median(xs))
            cells.append({'image':cell,'grip':grip,'area':b[4]})
    pad=8;vw=max(c['image'].width for c in cells)+pad*2;vh=max(c['image'].height for c in cells)+pad*2;anchor=None
    if id in top_ids:
        anchor=pad+max(c['grip'] for c in cells)
        vw=anchor+max(c['image'].width-c['grip'] for c in cells)+pad
    sheet=Image.new('RGBA',(vw*4,vh*4));frames=[];hashes=[]
    for n,c in enumerate(cells):
        cell=c['image'];dx=(vw-cell.width)//2 if anchor is None else anchor-c['grip'];dy=pad if id in top_ids else vh-cell.height-pad
        x=(n%4)*vw;y=(n//4)*vh;sheet.paste(cell,(x+dx,y+dy))
        frames.append({'x':x,'y':y,'w':vw,'h':vh,'dx':0,'dy':0});hashes.append(hashlib.sha256(cell.tobytes()).hexdigest())
    if len(set(hashes))!=16:raise ValueError(f'{id}: duplicated poses')
    sheet.save(OUT/f'{id}-frames.webp','WEBP',lossless=True,method=6)
    sheet.crop((0,0,vw,vh)).save(OUT/f'{id}-poster.webp','WEBP',lossless=True,method=6)
    d={'sheet':f'assets/animation/v4-1/{id}-frames.webp','poster':f'assets/animation/v4-1/{id}-poster.webp','viewport':{'w':vw,'h':vh},'frames':frames,'face':rec.get('face',0),'travel':rec.get('travel',0),'loop':rec.get('loop',False),'label':rec['motion'],'fps':18,'duration':1200}
    if d['loop']:d['duration']=round(16/18*3*1000)
    if id=='sloth':d['duration']=2000
    if id in {'monkey','orangutan','giraffe'}:d['duration']=1500
    if rec.get('hop'):d['hop']=rec['hop'];d['duration']=1200
    if anchor is not None:d['gripX']=anchor/vw
    manifest[id]=d
    row={'id':id,'poses':16,'distinctPoses':len(set(hashes)),'viewport':[vw,vh],'sourceSizes':[list(im.size) for im in images],'areas':[c['area'] for c in cells],'sourceParts':[m['source'] for m in metadata],'style':rec['style']}
    return row
def persist():
    (ROOT/'geo/assets/animation-data.js').write_text('/* V4.1: whole authored poses, no image warping. */\nwindow.ANIMAL_ANIMATIONS = '+json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    (OUT/'audit.json').write_text(json.dumps({'ready':len(done),'total':len(plan['records']),'characters':report,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
    records=[json.loads(p.read_text(encoding='utf-8-sig')) for p in sorted((OUT/'source').glob('*.json'))]
    (ROOT/'geo/assets/generation-v4-1.json').write_text(json.dumps({'base':'Version 4; V5 excluded','tool':'image_gen.imagegen','mode':'builtin','backgroundPolicy':'Unchanged preferred V4 savanna, rainforest and ocean images; approved V4 polar backgrounds reused','savedOutputs':'geo/assets/animation/v4-1','posesPerCharacter':16,'atlases':records},ensure_ascii=False,indent=2),encoding='utf-8')
def main():
    watch='--watch' in sys.argv
    while True:
        for r in plan['records']:
            id=r['id']
            if id in done or id in errors:continue
            if not all((OUT/'source'/f'{id}-{p}.json').exists() for p in 'ab'):continue
            try:
                row=extract(r);report.append(row);done.add(id);print(f'Packaged {id}: 16 poses ({len(done)}/{len(plan["records"])})',flush=True)
            except Exception as e:errors[id]=str(e);print('REPAIR NEEDED:',e,flush=True)
            persist()
        if not watch or len(done)+len(errors)==len(plan['records']):break
        time.sleep(5)
    # Visual QA contact sheets use the actual runtime posters, not substitutes.
    for offset in range(0,len(report),18):
        page=Image.new('RGB',(1440,900),'#e8e5dc');draw=ImageDraw.Draw(page)
        for i,r in enumerate(report[offset:offset+18]):
            im=Image.open(OUT/f'{r["id"]}-poster.webp');im.thumbnail((216,245),Image.Resampling.LANCZOS)
            x=(i%6)*240+(240-im.width)//2;y=(i//6)*300+10;page.paste(im,(x,y),im);draw.text(((i%6)*240+12,(i//6)*300+275),r['id'],fill='#344736')
        page.save(ROOT/f'screenshots/v4-1/posters-{offset//18+1}.jpg',quality=95)
    print(json.dumps({'ready':len(done),'total':len(plan['records']),'errors':errors}),flush=True)
    if errors:sys.exit(1)
if __name__=='__main__':main()
