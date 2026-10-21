/* Local, continuous deformation fields. Coordinates are normalized to each original sprite.
   Limbs blend into shoulders/hips; the source image is never cut into detached pieces. */
(function(g){
'use strict';
const TAU=Math.PI*2,clamp=v=>Math.max(0,Math.min(1,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
const rigs={};
function def(id,label,pose,options={}){rigs[id]={label,pose,duration:3400,...options};}
function bone(p,x,y,rx,ry,tx,ty,width,angle,stretch=0){
 const dx=tx-rx,dy=ty-ry,len=dx*dx+dy*dy;
 const t=((x-rx)*dx+(y-ry)*dy)/len;
 const distance=Math.abs((x-rx)*dy-(y-ry)*dx)/Math.sqrt(len);
 const w=(1-smooth(width*.8,width*1.6,distance))*smooth(0,.42,t);
 if(!w)return;
 const vx=(x-rx)*p.aspect,vy=y-ry,c=Math.cos(angle),s=Math.sin(angle);
 p.x+=((vx*c-vy*s-vx)/p.aspect+dx*stretch*t)*w;
 p.y+=(vx*s+vy*c-vy+dy*stretch*t)*w;
}
function zone(p,x,y,cx,cy,rx,ry,dx,dy){const d=Math.pow((x-cx)/rx,2)+Math.pow((y-cy)/ry,2),w=1-smooth(.15,1,d);p.x+=dx*w;p.y+=dy*w;}
function head(p,x,y,box,angle){const [rx,ry,tx,ty,w]=box;bone(p,x,y,rx,ry,tx,ty,w,angle);}
function gait(id,label,face,legs,tail,options={}){
 def(id,label,(p,x,y,t,e)=>{
  const phase=t*TAU*(options.speed||1.7),amp=(options.angle||.32)*e;
  for(let i=0;i<legs.length;i++){
   const b=legs[i],q=phase+(i===1||i===2?Math.PI:0);
   bone(p,x,y,...b,Math.sin(q)*amp);
   // Flex the knee during the forward swing; hips stay fixed and paws lift.
   const lift=Math.max(0,Math.cos(q))*.055*e;
   zone(p,x,y,b[2],b[3],b[4]*1.1,.18,0,-lift);
  }
  if(tail)bone(p,x,y,...tail,Math.sin(phase*.55)*.17*e);
  p.y-=Math.pow(Math.sin(phase),2)*.012*e*smooth(.9,.4,y);
 },{travel:face*(options.travel||.65),duration:options.duration||3500,...options});
}
gait('tiger','四足交替小跑、抬爪、摆尾',-1,[[.22,.43,.075,.96,.11],[.34,.44,.37,.96,.085],[.57,.44,.54,.96,.09],[.7,.45,.82,.96,.08]],[.76,.22,.97,.70,.10],{speed:2,angle:.37,travel:.8});
gait('cheetah','轻快奔跑、脊背起伏',-1,[[.24,.45,.03,.97,.08],[.34,.43,.20,.97,.08],[.54,.45,.60,.95,.08],[.67,.35,.90,.90,.09]],[.67,.18,.98,.55,.10],{speed:2.4,angle:.29,travel:.95});
gait('zebra','低头觅食后轻轻踏步',-1,[[.34,.48,.28,.97,.055],[.42,.48,.48,.97,.06],[.78,.43,.76,.96,.06],[.85,.42,.90,.97,.06]],[.91,.17,.98,.62,.065],{speed:1.3,angle:.26,travel:.38});
gait('rhino','沉稳迈步、轻摆头部',-1,[[.38,.60,.39,.97,.06],[.43,.61,.48,.97,.07],[.80,.59,.79,.95,.07],[.87,.57,.91,.98,.07]],[.95,.40,.99,.64,.04],{speed:1.25,angle:.21,travel:.45});
gait('buffalo','四蹄慢行、尾巴驱虫',1,[[.13,.56,.07,.99,.06],[.22,.57,.22,.98,.06],[.57,.51,.57,.98,.055],[.66,.54,.69,.97,.055]],[.07,.32,.02,.69,.04],{speed:1.2,angle:.24,travel:.42});
def('gazelle','后腿蹬地、前腿收起向前跃',(p,x,y,t,e)=>{bone(p,x,y,.74,.57,.78,.82,.12,Math.sin(t*5)*.23*e);bone(p,x,y,.29,.58,.08,.90,.12,-Math.sin(t*5)*.24*e);},{travel:.8,hop:.17,duration:3000});
gait('warthog','迈着短腿向前拱食',-1,[[.34,.64,.33,.93,.065],[.40,.59,.45,.97,.085],[.76,.63,.74,.96,.05],[.87,.63,.91,.96,.05]],[.84,.34,.96,.04,.06],{speed:1.8,angle:.25,travel:.48});
gait('tapir','低头嗅探、四足慢走',-1,[[.32,.52,.25,.96,.08],[.43,.50,.46,.96,.075],[.70,.50,.65,.96,.08],[.80,.50,.88,.96,.07]],null,{speed:1.3,angle:.26,travel:.5});
gait('polarbear','宽大脚掌交替走过雪地',1,[[.16,.54,.09,.89,.10],[.30,.55,.30,.92,.10],[.62,.50,.66,.93,.11],[.76,.51,.89,.88,.10]],null,{speed:1.2,angle:.22,travel:.5});
gait('arcticfox','抬爪轻跑、蓬松尾巴摆动',-1,[[.32,.4,.21,.91,.065],[.39,.48,.38,.91,.06],[.58,.58,.53,.89,.07],[.69,.58,.75,.93,.07]],[.78,.64,.83,.30,.19],{speed:2,angle:.24,travel:.65});
def('turtle','前鳍交替划水、后鳍掌舵',(p,x,y,t,e)=>{
 const q=t*TAU*.9;
 bone(p,x,y,.74,.36,.61,.91,.145,Math.sin(q)*.48*e);
 bone(p,x,y,.82,.30,.88,.64,.085,Math.sin(q+Math.PI)*.33*e);
 bone(p,x,y,.24,.59,.07,.77,.10,Math.sin(q+.8)*.25*e);
 bone(p,x,y,.35,.59,.24,.83,.09,Math.sin(q+2)*.22*e);
 head(p,x,y,[.77,.34,.90,.12,.12],Math.sin(q*.5)*.04*e);
 const shell=smooth(.8,1.25,Math.pow((x-.47)/.34,2)+Math.pow((y-.32)/.25,2));
 p.x=x+(p.x-x)*shell;p.y=y+(p.y-y)*shell;
},{travel:.64,duration:4100,water:true});
def('boa','盘绕保持固定、连续伸颈探头',(p,x,y,t,e)=>{
 const upper=1-smooth(.28,.62,y),neck=(1-smooth(.19,.36,Math.abs(x-.51)));
 // The same displacement field covers the head AND neck, fading to zero at the coils.
 p.y-=.17*e*upper*neck;p.x+=.035*Math.sin(t*2.3)*e*upper*neck;
 bone(p,x,y,.19,.73,.07,.64,.055,Math.sin(t*4)*.23*e);
},{duration:3900,tongue:{x:.34,y:.19,face:-1}});
def('elephant','扇耳朵、卷起长鼻打招呼',(p,x,y,t,e)=>{
 bone(p,x,y,.68,.13,.54,.30,.14,Math.sin(t*4.8)*.25*e);
 const w=smooth(.78,.88,x)*smooth(.34,.56,y);
 p.x+=Math.sin(t*2)*.08*e*w;p.y-=.16*e*w*smooth(.43,.8,y);
 
},{duration:3700});
def('giraffe','弯长颈够树叶、咀嚼',(p,x,y,t,e)=>{
 const w=(1-smooth(.26,.56,y))*(1-smooth(.68,.80,x));
 p.x+=.07*e*w;p.y+=.075*e*w;
 zone(p,x,y,.68,.20,.10,.08,0,Math.sin(t*14)*.01*e);
});
def('lion','抬头低吼、鬃毛起伏、轻甩尾',(p,x,y,t,e)=>{
 head(p,x,y,[.63,.65,.80,.27,.24],-.12*e);
 zone(p,x,y,.88,.43,.12,.08,0,.033*e*(.65+.35*Math.sin(t*12)));
 bone(p,x,y,.22,.71,.03,.47,.06,Math.sin(t*4)*.35*e);
});
def('jaguar','伏地伸前爪、抬头张望',(p,x,y,t,e)=>{
 bone(p,x,y,.52,.60,.80,.88,.11,-.22*e);
 head(p,x,y,[.64,.50,.81,.25,.17],-.10*e);
 bone(p,x,y,.22,.55,.03,.84,.09,Math.sin(t*4)*.30*e);
});
def('leopard','树枝上晃尾、垂爪探头',(p,x,y,t,e)=>{
 bone(p,x,y,.89,.54,.93,.91,.07,Math.sin(t*3.2)*.42*e);
 bone(p,x,y,.25,.51,.22,.88,.075,Math.sin(t*3)*.20*e);
 head(p,x,y,[.26,.36,.17,.16,.13],Math.sin(t*2)*.1*e);
});
def('meerkat','直起身子、左右转头警戒',(p,x,y,t,e)=>{head(p,x,y,[.66,.24,.71,.08,.23],Math.sin(t*2.8)*.20*e);zone(p,x,y,.58,.47,.21,.3,0,-.055*e);});
def('ostrich','两条长腿轮流迈步',(p,x,y,t,e)=>{
 bone(p,x,y,.36,.60,.12,.96,.13,Math.sin(t*10)*.27*e);
 bone(p,x,y,.50,.62,.81,.98,.13,-Math.sin(t*10)*.27*e);
 head(p,x,y,[.10,.35,.16,.07,.11],Math.sin(t*5)*.05*e);
},{travel:-.6});
def('flamingo','弯颈理羽、站稳轻振羽毛',(p,x,y,t,e)=>{
 head(p,x,y,[.80,.45,.85,.16,.16],.25*e);
 zone(p,x,y,.43,.39,.20,.13,0,Math.sin(t*6)*.015*e);
});
def('hippo','抖耳朵、在水面打招呼',(p,x,y,t,e)=>{
 zone(p,x,y,.67,.54,.24,.30,0,.08*e);zone(p,x,y,.79,.12,.09,.11,Math.sin(t*12)*.014*e,0);
},{water:true});
def('crocodile','长尾左右扫水、张合下颚',(p,x,y,t,e)=>{
 bone(p,x,y,.38,.52,.05,.60,.16,Math.sin(t*3)*.17*e);
 zone(p,x,y,.85,.61,.18,.12,0,.04*e);bone(p,x,y,.49,.58,.53,.91,.08,Math.sin(t*5)*.23*e);
},{travel:.28,water:true});
def('capybara','低头闻草、耳朵抖动',(p,x,y,t,e)=>{head(p,x,y,[.62,.43,.83,.24,.22],.13*e);zone(p,x,y,.66,.12,.075,.1,Math.sin(t*12)*.014*e,0);});
def('otter','前爪拨水、尾巴轻摆',(p,x,y,t,e)=>{
 bone(p,x,y,.53,.54,.69,.79,.1,Math.sin(t*7)*.38*e);
 bone(p,x,y,.41,.56,.50,.83,.08,-Math.sin(t*7)*.30*e);
 bone(p,x,y,.36,.59,.04,.76,.11,Math.sin(t*4)*.25*e);
},{travel:.42,water:true});
for(const [id,face,tail] of [['clownfish',1,[.29,.51,.08,.50,.26]],['shark',1,[.24,.56,.10,.54,.29]],['whale',-1,[.81,.42,.97,.39,.28]],['dolphin',1,[.28,.62,.13,.86,.22]]]){
 def(id,({clownfish:'摆尾、胸鳍划动',shark:'尾鳍有节奏地侧摆',whale:'尾柄上下摆动、胸鳍缓划',dolphin:'摆尾游出轻柔弧线'})[id],(p,x,y,t,e)=>{
  bone(p,x,y,...tail,Math.sin(t*(id==='clownfish'?11:5))*.24*e);
  bone(p,x,y,.46,.53,.55,.83,.13,Math.sin(t*4+1)*.20*e);
 },{travel:face*(id==='dolphin'?.8:.55),water:true,arc:id==='dolphin'?.13:.025,duration:3900});
}
def('seahorse','卷尾舒展、背鳍轻振',(p,x,y,t,e)=>{bone(p,x,y,.47,.62,.48,.91,.18,Math.sin(t*3.8)*.25*e);zone(p,x,y,.68,.42,.14,.17,Math.sin(t*30)*.025*e,0);},{water:true,arc:.1});
def('pufferfish','鼓起圆肚子、胸鳍扑动',(p,x,y,t,e)=>{
 const w=1-smooth(.24,.44,Math.hypot(x-.48,(y-.49)*.85));p.x+=(x-.48)*.25*e*w;p.y+=(y-.49)*.25*e*w;
 bone(p,x,y,.76,.49,.98,.47,.24,Math.sin(t*13)*.20*e);
},{water:true});
def('stingray','两侧胸鳍像波浪一样起伏',(p,x,y,t,e)=>{const w=Math.pow(Math.abs(x-.5)*2,1.5);p.y+=Math.sin(t*5-y*4)*.09*e*w;bone(p,x,y,.55,.53,.95,.95,.09,Math.sin(t*3)*.13*e);},{travel:.35,water:true});
def('jellyfish','伞部收缩推进、触手依次飘动',(p,x,y,t,e)=>{
 const q=t*5,top=1-smooth(.35,.5,y);p.x+=(x-.5)*.12*Math.sin(q)*e*top;p.y+=Math.sin(q)*.035*e*top;
 p.x+=Math.sin(q-y*7+x*5)*.06*e*smooth(.4,.9,y);
},{water:true,arc:.16,duration:3800});
def('octopus','八条腕足轮流弯卷',(p,x,y,t,e)=>{const w=smooth(.40,.83,y);p.x+=Math.sin(t*4+x*17-y*5)*.055*e*w;p.y+=Math.cos(t*4+x*17)*.045*e*w;},{water:true});
def('starfish','五条腕足依次舒展',(p,x,y,t,e)=>{const dx=x-.5,dy=y-.5,a=Math.atan2(dy,dx),w=smooth(.18,.45,Math.hypot(dx,dy)),s=Math.sin(t*3+a*2)*.08*e*w;p.x+=dx*s;p.y+=dy*s;});
for(const id of ['crab','lobster'])def(id,id==='crab'?'横着走、双螯交替举起':'举螯探路、长触须摆动',(p,x,y,t,e)=>{
 bone(p,x,y,.30,.53,.15,.21,.19,Math.sin(t*4)*.32*e);bone(p,x,y,.70,.53,.85,.21,.19,-Math.sin(t*4+1)*.32*e);
 p.y+=Math.sin(t*14+x*30)*.027*e*smooth(.65,.88,y);
},{travel:.45});
def('frog','后腿蓄力蹬地、落地收腿',(p,x,y,t,e)=>{
 bone(p,x,y,.34,.58,.08,.84,.15,-.25*e*Math.sin(t*4));bone(p,x,y,.67,.58,.94,.84,.15,.25*e*Math.sin(t*4));
},{hop:.23,duration:2400});
for(const [id,wing] of [['toucan',[.52,.35,.66,.61,.16]],['macaw',[.42,.26,.85,.51,.17]]])def(id,id==='toucan'?'扇翅、点头、轻敲大嘴':'展开翅膀、收翼点头',(p,x,y,t,e)=>{
 bone(p,x,y,...wing,Math.sin(t*5)*.48*e);head(p,x,y,[.40,.30,.23,.12,.15],Math.sin(t*3)*.09*e);
});
def('butterfly','左右翅膀开合、轻盈飞舞',(p,x,y,t,e)=>{p.x+=(x-.5)*(Math.cos(t*19)*.30-.10)*e;p.y+=Math.sin(t*4)*.015*e;},{travel:.30,arc:.17});
def('hummingbird','快速振翅、悬停探花',(p,x,y,t,e)=>{bone(p,x,y,.51,.43,.55,.12,.20,Math.sin(t*58)*.58*e);bone(p,x,y,.47,.48,.15,.83,.1,Math.sin(t*4)*.10*e);},{travel:.15,arc:.08});
def('sloth','抓稳树枝、慢慢转头',(p,x,y,t,e)=>{e*=smooth(.23,.38,y);bone(p,x,y,.49,.44,.75,.28,.16,-.27*e);head(p,x,y,[.44,.55,.59,.62,.19],Math.sin(t*1.6)*.12*e);},{duration:4300});
for(const id of ['monkey','orangutan'])def(id,id==='monkey'?'抓稳树枝、屈腿荡动':'抓住树枝、轮流踢腿',(p,x,y,t,e)=>{
 const w=smooth(.14,.66,y);p.x+=Math.sin(t*3.4)*.07*e*w;
 bone(p,x,y,.42,.66,.24,.91,.11,Math.sin(t*4.5)*.32*e);bone(p,x,y,.60,.65,.78,.89,.12,-Math.sin(t*4.5)*.32*e);
},{duration:3600});
def('gorilla','抬手吃叶子、轻轻咀嚼',(p,x,y,t,e)=>{bone(p,x,y,.62,.70,.88,.48,.15,-.12*e);zone(p,x,y,.74,.34,.14,.10,0,Math.sin(t*12)*.018*e);head(p,x,y,[.60,.39,.65,.24,.17],-.045*e);});
def('chameleon','伸舌探食、卷尾微动',(p,x,y,t,e)=>{bone(p,x,y,.64,.52,.88,.67,.21,Math.sin(t*3)*.15*e);head(p,x,y,[.31,.35,.12,.25,.15],-.07*e);},{tongue:{x:.06,y:.27,face:-1},duration:2600});
def('penguin','左右脚交替踏雪、双鳍保持平衡',(p,x,y,t,e)=>{
 bone(p,x,y,.32,.87,.31,.97,.14,Math.sin(t*9)*.24*e);bone(p,x,y,.67,.87,.66,.97,.14,-Math.sin(t*9)*.24*e);
 bone(p,x,y,.27,.35,.07,.68,.12,Math.sin(t*4.5)*.24*e);bone(p,x,y,.65,.32,.91,.66,.15,-Math.sin(t*4.5)*.24*e);
 p.x+=Math.sin(t*4.5)*.018*e*(1-y);
},{travel:-.36});
for(const id of ['seal','walrus'])def(id,id==='seal'?'前鳍撑地、肚皮向前滑行':'宽鳍撑地、抬头晃胡须',(p,x,y,t,e)=>{
 bone(p,x,y,.46,.62,.30,.88,.15,Math.sin(t*5)*.35*e);bone(p,x,y,.68,.60,.83,.85,.14,-Math.sin(t*5)*.25*e);
 head(p,x,y,[.34,.52,.27,.24,.22],Math.sin(t*2.5)*.08*e);
},{travel:id==='seal'?-.6:.25});
def('inuit','挥手欢迎小朋友',(p,x,y,t,e)=>{bone(p,x,y,.32,.40,.09,.31,.17,(.25+Math.sin(t*8)*.22)*e);});
def('igloo','雪屋门口亮起温暖灯光',(p)=>{}, {duration:2500,glow:true});
g.ANIMAL_RIGS=rigs;
g.poseAnimal=(id,x,y,time,aspect=1)=>{
 const rig=rigs[id],seconds=time*rig.duration/1000,e=smooth(0,.15,time)*(1-smooth(.80,1,time));
 // Integrate a smooth local flow. Directly displacing a narrow leg can fold the
 // textured surface; small flow steps keep the foot and shoulder connected.
 const p={x,y,aspect},steps=8;
 for(let i=0;i<steps;i++){const v={x:p.x,y:p.y,aspect};rig.pose(v,p.x,p.y,seconds,e);p.x+=(v.x-p.x)/steps;p.y+=(v.y-p.y)/steps;}
 return p;
};
})(window);
