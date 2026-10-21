"""Extract animation cells without modifying the authored pixels.
Connected components locate real silhouettes when an atlas has uneven row margins.
Only cropping, transparent padding, format encoding and source metadata are performed.
"""
import json, hashlib
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'geo/assets/animation'
OUT.mkdir(parents=True,exist_ok=True)
SPEC=ROOT/'geo/assets/generation-v4.json'

def source_path(record):
    p=Path(record['source'])
    return p if p.is_absolute() else ROOT/p

def components(alpha):
    # Run-length connected-component analysis, avoiding optional native dependencies.
    parent=[];boxes=[];previous=[]
    def root(i):
        while parent[i]!=i:
            parent[i]=parent[parent[i]];i=parent[i]
        return i
    for y,row in enumerate(alpha>96):
        changes=np.flatnonzero(np.diff(np.r_[False,row,False]))
        runs=[];j=0
        for x,end in zip(changes[::2],changes[1::2]):
            n=len(parent);parent.append(n);boxes.append([int(x),y,int(end),y+1,int(end-x)])
            while j<len(previous) and previous[j][1]<x-1:j+=1
            k=j
            while k<len(previous) and previous[k][0]<=end:
                other=root(previous[k][2]);here=root(n)
                if other!=here:parent[here]=other
                k+=1
            runs.append((int(x),int(end),n))
        previous=runs
    merged={}
    for i,b in enumerate(boxes):
        r=root(i)
        if r not in merged:merged[r]=b.copy()
        else:
            q=merged[r];q[0]=min(q[0],b[0]);q[1]=min(q[1],b[1]);q[2]=max(q[2],b[2]);q[3]=max(q[3],b[3]);q[4]+=b[4]
    labels=np.full(alpha.shape,-1,dtype=np.int32)
    for i,b in enumerate(boxes):labels[b[1],b[0]:b[2]]=root(i)
    return sorted([b+[key] for key,b in merged.items()],key=lambda b:b[4],reverse=True),labels

WALK={'tiger':(-1,.63,8),'cheetah':(-1,.85,10),'zebra':(-1,.45,7),'rhino':(-1,.32,6),'buffalo':(-1,.35,6),'tapir':(-1,.40,6),'polarbear':(-1,.35,6),'arcticfox':(-1,.60,8),'warthog':(-1,.45,8),'jaguar':(-1,.55,7),'lioness':(-1,.32,6),'ostrich':(-1,.50,8),'penguin':(-1,.25,7),'turtle':(1,.45,6),'clownfish':(1,.45,8),'dolphin':(1,.65,7),'shark':(1,.50,7),'whale':(-1,.35,5),'otter':(-1,.40,7),'seal':(-1,.30,6),'walrus':(-1,.23,5),'crab':(1,.35,8)}
LABELS={'tiger':'四足交替向前迈步','cheetah':'四足轻快奔跑','zebra':'交替迈蹄','rhino':'四足沉稳前行','buffalo':'四蹄缓步','tapir':'四足缓步','polarbear':'宽掌交替踏雪','arcticfox':'四足轻跑','warthog':'短腿小跑','jaguar':'四爪前行','lioness':'母狮缓步','ostrich':'双腿交替迈步','penguin':'交替踏步、双鳍平衡','turtle':'四鳍划水','clownfish':'摆尾游泳','dolphin':'尾鳍上下划水','shark':'侧摆尾鳍游泳','whale':'摆动尾鳍缓游','otter':'前爪拨水','seal':'前鳍撑地滑行','walrus':'宽鳍撑地前行','crab':'横向迈步举螯','lion':'抬头张嘴低吼','lioncub':'举爪玩耍','elephant':'卷鼻扇耳','elephantcalf':'小象卷鼻扇耳','giraffe':'弯颈够叶、咀嚼','meerkat':'转头警戒、举爪','flamingo':'弯颈理羽','hippo':'张口打哈欠','crocodile':'张口晒太阳','capybara':'低头嗅探、咀嚼','leopard':'树上抬爪张望','gorilla':'抬手吃叶子','sloth':'抓稳树枝慢慢转头','monkey':'抓藤屈腿荡动','orangutan':'抓枝屈腿张望','boa':'抬头伸颈、吐信','chameleon':'伸舌探食','frog':'蹬腿跳跃','toucan':'点头展翅','macaw':'展翼理羽','hummingbird':'快速振翅悬停','seahorse':'背鳍轻振、卷尾','pufferfish':'鼓起圆肚子','stingray':'双侧胸鳍起伏','jellyfish':'收缩伞部推进','octopus':'八腕卷动','lobster':'交替举螯、触须探路','butterfly':'双翅开合','starfish':'五腕依次舒展','inuit':'挥手欢迎','igloo':'门口亮起暖光'}
ANCHOR_TOP={'sloth','monkey','orangutan'}
LABELS['gazelle']='后腿蹬地向前跃'

def extract(record,manifest,report):
    ids=record['animals'];source=source_path(record);image=Image.open(source).convert('RGBA')
    alpha=np.array(image.getchannel('A'));all_boxes,labels=components(alpha);count=len(ids)*6
    main=[b.copy() for b in all_boxes if b[4]>=max(600,all_boxes[0][4]*.15)]
    if len(main)<count:raise ValueError(f"{record['id']}: expected at least {count} separate poses, got {len(main)}")
    # Accept both 3-column / 6-row and 6-column / 3-row authored atlas layouts.
    xs=sorted((b[0]+b[2])/2 for b in main);clusters=[[xs[0]]]
    for x in xs[1:]:
        if x-clusters[-1][-1]>image.width/12:clusters.append([x])
        else:clusters[-1].append(x)
    cols=len(clusters)
    if cols not in {3,6}:raise ValueError(f"{record['id']}: ambiguous columns {cols}")
    if len(main)%len(ids) or len(main)%cols:raise ValueError(f"{record['id']}: ambiguous pose count {len(main)}")
    ordered=[]
    by_y=sorted(main,key=lambda b:(b[1]+b[3])/2)
    for n in range(0,len(main),cols):ordered.extend(sorted(by_y[n:n+cols],key=lambda b:(b[0]+b[2])/2))
    per_animal=len(ordered)//len(ids)
    chosen=[]
    for i in range(len(ids)):chosen.extend(ordered[i*per_animal:i*per_animal+6])
    ordered=chosen
    # Separate actual atlas subjects, rather than rectangular crops that can
    # include a neighbouring pose. Preserve the source colours and edge alpha.
    for index,id in enumerate(ids):
        cells=ordered[index*6:index*6+6]
        pad=5;vw=max(b[2]-b[0] for b in cells)+pad*2;vh=max(b[3]-b[1] for b in cells)+pad*2
        grips=[];anchor=None
        if id in ANCHOR_TOP:
            for b in cells:
                _,xs=np.nonzero(labels[b[1]:b[1]+max(3,round((b[3]-b[1])*.045)),b[0]:b[2]]==b[5])
                grips.append(b[0]+int(np.median(xs)))
            anchor=pad+max(grip-b[0] for grip,b in zip(grips,cells))
            vw=anchor+max(b[2]-grip for grip,b in zip(grips,cells))+pad
        frames=[];strip=Image.new('RGBA',(vw*6,vh));hashes=[]
        for b in cells:
            x0=max(0,b[0]-2);y0=max(0,b[1]-2);x1=min(image.width,b[2]+2);y1=min(image.height,b[3]+2)
            w=x1-x0;h=y1-y0;dx=(vw-w)//2;dy=pad-2 if id in ANCHOR_TOP else vh-h-(pad-2)
            if anchor is not None:dx=anchor-(grips[len(frames)]-x0)
            cell=image.crop((x0,y0,x1,y1))
            component=Image.fromarray(((labels[y0:y1,x0:x1]==b[5])*255).astype('uint8')).filter(ImageFilter.MaxFilter(5))
            cell_alpha=np.array(cell.getchannel('A'));cell_alpha[np.array(component)==0]=0
            cell.putalpha(Image.fromarray(cell_alpha))
            n=len(frames);strip.paste(cell,(n*vw+dx,dy))
            frames.append({'x':n*vw,'y':0,'w':vw,'h':vh,'dx':0,'dy':0})
            hashes.append(hashlib.sha256(cell.tobytes()).hexdigest())
        sheet_path=OUT/f'{id}-frames-v4.webp';strip.save(sheet_path,'WEBP',lossless=True,method=6)
        poster=strip.crop((0,0,vw,vh))
        poster_path=OUT/f'{id}-poster-v4.webp';poster.save(poster_path,'WEBP',lossless=True,method=6)
        defn={'sheet':f'assets/animation/{sheet_path.name}','poster':f'assets/animation/{poster_path.name}','frames':frames,'viewport':{'w':vw,'h':vh},'label':LABELS[id],'face':0,'travel':0,'fps':6,'loop':False,'duration':2400}
        if anchor is not None:defn['gripX']=anchor/vw
        if id in WALK:
            face,travel,fps=WALK[id];defn.update(face=face,travel=travel,fps=fps,loop=True,duration=round(6/fps*4*1000))
        if id in {'hummingbird','butterfly','jellyfish','stingray','octopus','starfish','seahorse'}:defn.update(loop=True,fps=12 if id=='hummingbird' else 8,duration=2400)
        if id in {'gazelle','frog'}:defn.update(face=-1,travel=.65 if id=='gazelle' else .30,hop=.24 if id=='gazelle' else .30,duration=1600)
        manifest[id]=defn
        distinct=len(set(hashes))
        report.append({'id':id,'viewport':[vw,vh],'distinctPoses':distinct,'areas':[b[4] for b in cells],'sourceColumns':cols,'sourcePosesPerAnimal':per_animal})

def main():
    spec=json.loads(SPEC.read_text(encoding='utf-8-sig'));manifest={};report=[]
    for r in spec['atlases']:
        if not source_path(r).exists():raise FileNotFoundError(r['source'])
        extract(r,manifest,report);print('Extracted',r['id'],flush=True)
    manifest['igloo']={'poster':'assets/animals/igloo.webp','sheet':None,'viewport':{'w':1,'h':1},'frames':[{}],'duration':2400,'fps':1,'face':0,'travel':0,'loop':False,'glow':True,'label':LABELS['igloo']}
    (ROOT/'geo/assets/animation-data.js').write_text('/* Authored sprite keyframes: no mesh deformation. */\nwindow.ANIMAL_ANIMATIONS = '+json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    (OUT/'audit-v4.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    for r in spec['backgrounds']:
        if r.get('active') is False:continue
        im=Image.open(source_path(r)).convert('RGB');im.save(ROOT/'geo/assets/bg'/f"{r['id']}-hd-v4.webp",'WEBP',quality=97,method=6)
    for r in spec.get('supports',[]):
        Image.open(source_path(r)).save(OUT/f"{r['id']}-v4.webp",'WEBP',lossless=True,method=6)
    print(f'{len(manifest)} characters, {len(report)*6} poses')

if __name__=='__main__':main()
