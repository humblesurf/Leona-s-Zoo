from pathlib import Path
from PIL import Image
import json,sys
ROOT=Path(__file__).resolve().parents[1]
out=ROOT/'geo/assets/animation/v4-2';out.mkdir(parents=True,exist_ok=True)
source=Path(sys.argv[1]);im=Image.open(source).convert('RGBA')
im.save(out/'tiger-source.png')
# Mechanical transparent-margin crop only; original RGBA is preserved.
box=im.getchannel('A').point(lambda a:255 if a>64 else 0).getbbox()
pad=20;box=(max(0,box[0]-pad),max(0,box[1]-pad),min(im.width,box[2]+pad),min(im.height,box[3]+pad))
poster=im.crop(box);poster.thumbnail((1100,1100),Image.Resampling.LANCZOS)
poster.save(out/'tiger-poster.webp','WEBP',quality=98,method=4,alpha_quality=100)
p=ROOT/'geo/assets/animation-data.js';text=p.read_text(encoding='utf8');A=json.loads(text[text.index('{'):text.rindex('}')+1]);a=A['tiger'];a['poster']='assets/animation/v4-2/tiger-poster.webp';a['viewport']={'w':poster.width,'h':poster.height};a['frames']=[{'x':0,'y':0,'w':poster.width,'h':poster.height,'dx':0,'dy':0}]
p.write_text('/* V4.2 continuous rigid joint gestures. */\nwindow.ANIMAL_ANIMATIONS = '+json.dumps(A,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8')
print('Tiger packaged',poster.size)
