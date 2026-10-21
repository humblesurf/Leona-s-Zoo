from pathlib import Path
from PIL import Image,ImageFilter
import importlib.util,json,numpy as np
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'geo/assets/animation/v4-2';OUT.mkdir(parents=True,exist_ok=True)
spec=importlib.util.spec_from_file_location('packer',ROOT/'scripts/build-animation-v4.py');old=importlib.util.module_from_spec(spec);spec.loader.exec_module(old)
jobs=json.loads((ROOT/'geo/assets/new-assets-v4-2.json').read_text(encoding='utf8'));report=[]
for job in jobs:
 im=Image.open(job['path']).convert('RGBA');im.save(OUT/(job['id']+'-source.png'))
 if job['id'] in ['market','farm']:
  dest=ROOT/f'geo/assets/bg/{job["id"]}-v4-2.webp';im.convert('RGB').save(dest,'WEBP',quality=98,method=4);report.append({'id':job['id'],'poster':str(dest.relative_to(ROOT/'geo')).replace('\\','/'),'size':list(im.size)})
 elif job['id']=='acacia':
  box=im.getchannel('A').point(lambda a:255 if a>64 else 0).getbbox();poster=im.crop(box);poster.save(OUT/'acacia.webp','WEBP',quality=98,method=4,alpha_quality=100);report.append({'id':'acacia','poster':'assets/animation/v4-2/acacia.webp','size':list(poster.size)})
 else:
  alpha=np.array(im.getchannel('A'));boxes,labels=old.components(alpha);main=[b for b in boxes if b[4]>boxes[0][4]*.15]
  assert len(main)==6,[(b[4],b[:4]) for b in main]
  cols=[[b for b in main if ((b[0]+b[2])/2<im.width/2)==left] for left in [True,False]]
  assert [len(c) for c in cols]==[3,3]
  for col in cols:col.sort(key=lambda b:(b[1]+b[3])/2)
  ordered=[cols[col][row] for row in range(3) for col in range(2)]
  names=['calf','lamb','piglet','chick','duckling','nest'] if job['id']=='farm-babies' else ['cow','sheep','pig','hen','duck','tractor']
  for id,b in zip(names,ordered):
   x0=max(0,b[0]-12);y0=max(0,b[1]-12);x1=min(im.width,b[2]+12);y1=min(im.height,b[3]+12);poster=im.crop((x0,y0,x1,y1))
   mask=Image.fromarray(((labels[y0:y1,x0:x1]==b[5])*255).astype('uint8')).filter(ImageFilter.MaxFilter(7));aa=np.array(poster.getchannel('A'));aa[np.array(mask)==0]=0;poster.putalpha(Image.fromarray(aa));poster.save(OUT/f'{id}-poster.webp','WEBP',quality=98,method=4,alpha_quality=100)
   report.append({'id':id,'poster':f'assets/animation/v4-2/{id}-poster.webp','size':list(poster.size)})
(OUT/'chapter-assets.json').write_text(json.dumps(report,indent=2),encoding='utf8');print(report)
