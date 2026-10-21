import fs from 'node:fs';import vm from 'node:vm';import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright'),w={};
for(const f of ['game-data','animation-data','calls-data'])vm.runInNewContext(fs.readFileSync(`geo/assets/${f}.js`,'utf8'),{window:w});
const {GAME_DIALOGUE:D,GAME_SCENES:S,ANIMAL_ANIMATIONS:A,CALL_RECORDINGS:C}=w;
const lines={
 apple:['Apple','苹果','蘋果','🍎',"I'm an apple. I am round and red. Look inside and find my little seeds!",'我係蘋果！我圓碌碌、紅卜卜。打開睇吓，入面有細細粒種子！','我是苹果！我圆圆的、红红的。打开看看，里面有小小的种子！'],
 banana:['Banana','香蕉','香蕉','🍌',"I'm a banana. My yellow peel opens to show the soft fruit inside!",'我係香蕉！我有黃色嘅皮。剝開蕉皮，就見到入面軟綿綿嘅果肉！','我是香蕉！我有黄色的皮。剥开香蕉皮，就能看到软软的果肉！'],
 orange:['Orange','橙子','橙','🍊',"I'm an orange. I am round and orange. Inside, I have juicy little segments!",'我係橙！我圓碌碌、橙色嘅。打開之後，入面有一瓣瓣果肉！','我是橙子！我圆圆的、橙色的。打开以后，里面有一瓣瓣果肉！'],
 pear:['Pear','梨','梨','🍐',"I'm a pear. My top is small and my bottom is round. Let's look at my seeds!",'我係梨！我上面細細，下面圓碌碌。一齊睇吓入面嘅種子啦！','我是梨！我上面小小的，下面圆圆的。一起来看看里面的种子吧！'],
 watermelon:['Watermelon','西瓜','西瓜','🍉',"I'm a watermelon. My rind is green and my fruit is red. Can you spot my little seeds?",'我係西瓜！我嘅皮係綠色，果肉係紅色。你搵唔搵到細細粒種子呀？','我是西瓜！我的皮是绿色的，果肉是红色的。你能找到小小的种子吗？'],
 tomato:['Tomato','番茄','番茄','🍅',"I'm a tomato. I'm red and round, with a little green crown. Look inside my juicy chambers!",'我係番茄！我紅卜卜、圓碌碌，頭頂有綠色小葉。一齊睇吓入面嘅果肉啦！','我是番茄！我红红的、圆圆的，头顶有绿色的小叶子。一起来看看里面的果肉吧！'],
 carrot:['Carrot','胡萝卜','紅蘿蔔','🥕',"I'm a carrot. I am orange and long, with green leaves on top. I grow under the soil!",'我係紅蘿蔔！我橙色、長長哋，頭頂有綠葉。我喺泥土下面生長！','我是胡萝卜！我橙橙的、长长的，头顶有绿叶。我生长在泥土下面！'],
 cow:['Cow','奶牛','乳牛','🐄',"I'm a cow. My little calf stays close to me. Listen to my deep moo!",'我係乳牛！牛仔鍾意跟住我。一齊聽吓我嘅哞哞聲啦！','我是奶牛！小牛喜欢跟着我。一起来听听我的哞哞声吧！'],
 sheep:['Sheep','绵羊','綿羊','🐑',"I'm a sheep. My wool is soft and fluffy. My little lamb likes to nibble grass with me!",'我係綿羊！我嘅羊毛軟綿綿。小羊鍾意同我一齊食草！','我是绵羊！我的羊毛软软的。小羊喜欢和我一起吃草！'],
 pig:['Pig','小猪','豬仔','🐖',"I'm a pig. My nose helps me sniff and root in the soil. Listen to my little oink!",'我係豬仔！我用鼻哥聞吓、拱吓泥土。聽吓我嘅哼哼聲啦！','我是小猪！我用鼻子闻一闻、拱一拱泥土。听听我的哼哼声吧！'],
 hen:['Hen','母鸡','母雞','🐔',"I'm a hen. I scratch the ground with my feet, and I lay eggs in my cozy nest!",'我係母雞！我用腳仔扒吓地，仲會喺舒服嘅雞窩度生蛋！','我是母鸡！我用小脚刨一刨地，还会在舒服的鸡窝里下蛋！'],
 duck:['Duck','鸭子','鴨仔','🦆',"I'm a duck. My webbed feet help me paddle in the pond. Quack, quack!",'我係鴨仔！我隻腳有蹼，幫我喺池塘度划水。呱呱！','我是鸭子！我的脚有蹼，帮我在池塘里划水。嘎嘎！'],
 tractor:['Tractor','拖拉机','拖拉機','🚜',"I'm a tractor. My big wheels roll around the farm. I help the farmer carry things!",'我係拖拉機！我嘅大車輪喺農場度轉呀轉，幫農夫搬嘢！','我是拖拉机！我的大车轮在农场里转呀转，帮助农夫搬东西！']
};
Object.assign(lines,{
 calf:['Calf','小牛','牛仔','🐄',"I'm a calf, a baby cow. I stay close to my mother and explore the soft grass!",'我係牛仔！我係乳牛嘅寶寶。我跟住媽媽，一齊睇吓軟綿綿嘅草地！','我是小牛，是奶牛的宝宝。我跟着妈妈，一起看看软软的草地！'],
 lamb:['Lamb','小羊','羊仔','🐑',"I'm a lamb, a baby sheep. My wool is soft, and I like to stay close to my mother!",'我係羊仔！我係綿羊嘅寶寶。我嘅毛軟綿綿，我鍾意跟住媽媽！','我是小羊，是绵羊的宝宝。我的毛软软的，我喜欢跟着妈妈！'],
 piglet:['Piglet','小猪宝宝','豬仔寶寶','🐷',"I'm a piglet. My little nose sniffs the ground. Oink, oink! Where is my mother?",'我係豬仔寶寶！我用小鼻哥聞吓地。哼哼！媽媽喺邊呀？','我是小猪宝宝！我用小鼻子闻闻地面。哼哼！妈妈在哪里呀？'],
 chick:['Chick','小鸡','雞仔','🐥',"I'm a chick. I have fluffy yellow feathers and tiny feet. Peep, peep! I follow my mother!",'我係雞仔！我有黃色絨毛同細細隻腳。吱吱！我跟住媽媽行！','我是小鸡！我有黄色的绒毛和小小的脚。叽叽！我跟着妈妈走！'],
 duckling:['Duckling','小鸭','鴨仔寶寶','🐤',"I'm a duckling, a baby duck. My little webbed feet help me paddle. I stay close to my mother!",'我係鴨仔寶寶！我隻腳仔有蹼，幫我划水。我鍾意跟住媽媽！','我是小鸭，是鸭子的宝宝。我的小脚有蹼，帮助我划水。我喜欢跟着妈妈！']
});
const out='geo/assets/voice/v4-2';fs.mkdirSync(out,{recursive:true});const script={};
const cast={en:[['child',''],['male','-male'],['female','-female']],yue:[['female',''],['male','-male'],['bright','-bright']],cmn:[['female',''],['male','-male'],['bright','-bright']]};
const greetingIds=['cow','watermelon','duck'];
for(const [id,[en,cmn,yue,emoji,english,cantonese,mandarin]]of Object.entries(lines)){
 const intro={en:(greetingIds.includes(id)?'Hi, little friend! ':'')+english,yue:cantonese,cmn:mandarin};script[id]=intro;
 const variants=Object.fromEntries(Object.entries(cast).map(([lang,roles])=>[lang,roles.map(([key,suffix])=>({key,path:`assets/voice/v4-2/${id}-${lang}${suffix}.mp3`}))]));
 D[id]={name:{en,cmn,yue},emoji,intro,fact:intro,kind:(id==='tractor'||['apple','banana','orange','pear','watermelon','tomato','carrot'].includes(id))?'discovery':'animal',voice:Object.fromEntries(Object.entries(variants).map(([lang,v])=>[lang,v[0].path])),voiceVariants:variants};
}
for(const [id,callId] of Object.entries({calf:'cow',lamb:'sheep',piglet:'pig',duckling:'duck'}))D[id].callId=callId;
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage();await page.setContent('<body></body>');await page.addScriptTag({path:'geo/assets/story-objects.js'});
for(const id of ['apple','banana','orange','pear','watermelon','tomato','carrot']){const url=await page.evaluate(id=>StoryObjects.poster(id),id);fs.writeFileSync(`geo/assets/animation/v4-2/${id}-poster.png`,Buffer.from(url.split(',')[1],'base64'));A[id]={object:true,poster:`assets/animation/v4-2/${id}-poster.png`,sheet:null,viewport:{w:720,h:720},frames:[{x:0,y:0,w:720,h:720,dx:0,dy:0}],duration:5200,face:0,travel:0,label:id==='banana'?'慢慢剥开香蕉皮':'打开看看果肉和种子'};}
await browser.close();
for(const asset of JSON.parse(fs.readFileSync('geo/assets/animation/v4-2/chapter-assets.json','utf8')).filter(a=>['cow','sheep','pig','hen','duck','tractor','calf','lamb','piglet','chick','duckling'].includes(a.id))){const [width,height]=asset.size;A[asset.id]={rig:true,poster:asset.poster,sheet:null,viewport:{w:width,h:height},frames:[{x:0,y:0,w:width,h:height,dx:0,dy:0}],duration:4200,face:-1,travel:asset.id==='tractor'?.50:0,label:{cow:'低头吃草、摆尾',sheep:'低头吃草',pig:'鼻子闻闻、拱一拱',hen:'轻轻扒地、鸡窝里下蛋',duck:'池边探头、轻摆翅膀',tractor:'车轮慢慢转、向前行驶',calf:'探头看看、摆摆小耳朵',lamb:'轻轻低头闻草',piglet:'小鼻子嗅一嗅',chick:'点点头、轻摆小翅膀',duckling:'探头看看、轻摆小翅膀'}[asset.id]};}
const place=(id,u,feetY,h,i,flip=false,extra={})=>({id,u,feetY,h,flip,idle:'breathe',special:null,rotate:0,instance:`v4-2-${id}-${i}`,facing:flip?1:-1,...extra});
S.market={label:'可爱菜市场',numScreens:4.2,bgStrip:'assets/bg/market-v4-2.webp',bgAspect:3,bgMirror:true,ambience:'assets/audio/v4-2/market.mp3',animals:['apple','banana','orange','pear','watermelon','tomato','carrot'].map((id,i)=>place(id,.07+i*.13,.535,id==='watermelon'?.23:.19,i,false))};
S.farm={label:'快乐农场',numScreens:4.8,pondCentre:.80,pondAnchor:.71,bgStrip:'assets/bg/farm-v4-2.webp',bgAspect:3,bgMirror:true,ambience:'assets/audio/v4-2/farm.mp3',animals:[place('cow',.07,.82,.28,0),place('calf',.13,.90,.17,1,true),place('sheep',.25,.84,.225,2,true),place('lamb',.30,.93,.14,3),place('pig',.40,.85,.20,4),place('piglet',.45,.93,.13,5,true),place('hen',.53,.91,.175,6),place('chick',.57,.94,.085,7,true),place('duck',.70,.563,.12,8,false,{pondGroup:'ducks',shoreX:.79}),place('duckling',.74,.566,.08,9,true,{pondGroup:'ducks',shoreX:.86}),place('tractor',.90,.86,.30,10)]};
const rows=JSON.parse(fs.readFileSync('geo/assets/calls/v4-2/recordings.json','utf8'));for(const r of rows.filter(r=>!r.ambient))C[r.id]=r;
fs.writeFileSync(out+'/script.json',JSON.stringify(script,null,2));
fs.writeFileSync('geo/assets/game-data.js','/* V4.2: original V4 scenes, two new priority chapters. */\nwindow.GAME_DIALOGUE = '+JSON.stringify(D)+';\nwindow.GAME_SCENES = '+JSON.stringify(S)+';\nwindow.GAME_SCENE_ORDER = '+JSON.stringify(['savanna','rainforest','ocean','polar','market','farm'])+';\n');
fs.writeFileSync('geo/assets/animation-data.js','window.ANIMAL_ANIMATIONS = '+JSON.stringify(A)+';\n');fs.writeFileSync('geo/assets/calls-data.js','window.CALL_RECORDINGS = '+JSON.stringify(C)+';\n');fs.writeFileSync('geo/assets/placements.json',JSON.stringify(S,null,2));
console.log('Added seven produce items and six farm characters; 162 new narrations prepared.');
