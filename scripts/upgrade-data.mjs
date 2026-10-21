import fs from 'node:fs';
import vm from 'node:vm';
const ctx = {window:{}};
vm.runInNewContext(fs.readFileSync('.upgrade-backup/game-data.js','utf8'),ctx);
const D = ctx.window.GAME_DIALOGUE;
function fact(id,en,yue,cmn){D[id].fact={en,yue,cmn};}
fact('lion','My fluffy mane is like a golden scarf.','我有毛茸茸嘅鬃毛，好似金色頸巾呀。','我的鬃毛毛茸茸，像一条金色围巾。');
fact('cheetah','I am the fastest animal on land.','我係陸地上跑得最快嘅動物呀。','我是陆地上跑得最快的动物。');
fact('elephant','Look at my long trunk and big ears!','你睇，我有長長嘅鼻同大大隻耳仔！','看，我有长长的鼻子和大大的耳朵！');
fact('whale','I am a big whale. I breathe air, just like you!','我係大大隻嘅鯨魚。我同你一樣，都要呼吸空氣呀！','我是一只大鲸鱼。我和你一样，都要呼吸空气！');
fact('lobster','My claws help me hold my food.','我用大大隻鉗捉住食物呀。','我的大钳子能夹住食物。');
fact('seal','I slide on ice and swim with my flippers.','我會喺冰上面滑，仲會用鰭游水呀。','我会在冰上滑，还会用鳍游泳。');
fact('seahorse','I swim upright. My curly tail holds on tight!','我會企直游水，用捲捲嘅尾巴捉實呀！','我会竖着游泳，用卷卷的尾巴抓牢！');
fact('tiger','I have orange fur and black stripes. Listen to my roar!','我有橙色嘅毛同黑色間條。聽吓我嘅吼聲！','我有橙色的毛和黑色条纹。听听我的吼声！');
D.otter.name={en:'River otter',yue:'水獺',cmn:'水獭'};
fact('otter','I swim and play in freshwater rivers. Splash, splash!','我喺淡水河入面游水同玩耍。潑潑水！','我在淡水河里游泳玩耍。哗啦，哗啦！');
const additions = {
  polarbear:['🐻‍❄️','Polar bear','北極熊','北极熊','My thick fur keeps me warm in the Arctic.','我有厚厚嘅毛，喺北極都暖笠笠。','我有厚厚的毛，在北极也暖暖的。'],
  penguin:['🐧','Emperor penguin','皇帝企鵝','帝企鹅','I live in Antarctica. Waddle, waddle!','我住喺南極。搖搖擺擺，行兩步！','我住在南极。摇摇摆摆，走两步！'],
  arcticfox:['🦊','Arctic fox','北極狐','北极狐','My fluffy tail keeps me warm.','我條毛茸茸嘅尾巴，令我暖笠笠。','我毛茸茸的尾巴，能让我暖暖的。'],
  walrus:['🦭','Walrus','海象','海象','Look at my whiskers and two long tusks!','你睇，我有鬍鬚，同兩隻長長嘅獠牙！','看，我有胡须，还有两根长长的獠牙！'],
  inuit:['👋','Inuit friend','因紐特小朋友','因纽特小朋友','I am an Inuit friend. Come explore the snowy Arctic with me!','我係因紐特小朋友。一齊嚟睇北極嘅雪啦！','我是因纽特小朋友。一起看看北极的雪吧！'],
  igloo:['❄️','Igloo','雪屋','雪屋','I am a snow house made from blocks of packed snow.','我係雪屋，用一塊塊壓實嘅雪砌成㗎。','我是雪屋，用一块块压实的雪搭成。'],
  lioness:['🦁','Lioness','母獅','母狮','I live with my lion family. I look after our little cubs.','我同獅子家人一齊住，仲會照顧小獅子呀。','我和狮子家人住在一起，还会照顾小狮子。'],
  lioncub:['🦁','Lion cub','小獅子','小狮子','I am a little lion cub. I like to play close to my family.','我係小獅子，鍾意喺屋企人身邊玩呀。','我是一只小狮子，喜欢在家人身边玩。'],
  elephantcalf:['🐘','Elephant calf','小象','小象','I stay close to my mum. My little trunk helps me explore!','我會跟住媽媽，用小小嘅鼻哥探索呀！','我会跟着妈妈，用小小的鼻子探索！']
};
for(const [id,[emoji,en,yue,cmn,fe,fy,fc]] of Object.entries(additions)){
  D[id]={emoji,name:{en,yue,cmn},fact:{en:fe,yue:fy,cmn:fc},kind:['inuit','igloo'].includes(id)?'discovery':'animal'};
}
const old=ctx.window.GAME_SCENES;
const byId = Object.fromEntries(Object.values(old).flatMap(s=>s.animals).map(a=>[a.id,a]));
// u is a continuous position across the whole panorama, never a panel-relative position.
function place(id,u,y,h,options={}){
  return {...byId[id],id,u,screen:Math.floor(u*3),x:(u*3)%1,feetY:y,h,flip:false,rotate:0,waterline:null,idle:'breathe',special:null,...options};
}
function scene(id,label,animals,ambience){
 const numScreens={savanna:8,rainforest:8,ocean:7.5,arctic:5,antarctic:4.5}[id];
 const preferred=['savanna','rainforest','ocean'].includes(id);
 return {id,label,numScreens,bgStrip:`assets/bg/${id}-panorama-v2.webp`,bgAspect:preferred?3:16/9,bgMirror:true,bgPanels:preferred?[`assets/bg/reference/${id}-preferred-v4.png`]:[`assets/bg/${id}-hd-v4.webp`],ambience,animals:animals.map(a=>({...a,screen:Math.floor(a.u*numScreens),x:(a.u*numScreens)%1}))};
}
const S={
  savanna:scene('savanna','草原',[
    place('lion',.040,.81,.25),place('lioness',.099,.84,.24),place('lioncub',.071,.94,.12),
    place('zebra',.175,.83,.27),place('ostrich',.245,.80,.33),
    place('giraffe',.310,.84,.43),place('meerkat',.435,.85,.17),place('cheetah',.580,.85,.19),
    place('elephant',.495,.85,.36),place('elephantcalf',.535,.89,.19),
    place('flamingo',.675,.565,.27,{habitatAnchor:.95}),place('hippo',.630,.575,.15,{habitatAnchor:.65}),
    place('crocodile',.748,.575,.115,{habitatAnchor:.88}),place('rhino',.807,.84,.27),place('gazelle',.950,.84,.24),
    place('buffalo',.867,.86,.28),place('warthog',.360,.87,.18)
  ],'assets/audio/savanna.mp3'),
  rainforest:scene('rainforest','雨林与河流',[
    place('toucan',.045,.36,.22,{special:'perch',support:'branch'}),place('sloth',.115,.49,.27,{special:'hanging',idle:'none',support:'canopy'}),
    place('monkey',.195,.50,.27,{special:'hanging',idle:'none',support:'vine'}),place('frog',.254,.91,.12,{support:'leaf'}),
    place('butterfly',.300,.52,.17,{idle:'flutter'}),place('hummingbird',.363,.39,.17,{idle:'flutter'}),
    place('capybara',.408,.85,.24),place('otter',.478,.67,.15,{idle:'bob'}),place('tapir',.553,.85,.27),
    place('macaw',.613,.39,.28,{special:'perch',support:'branch'}),place('jaguar',.680,.85,.26),place('leopard',.710,.43,.22,{idle:'none',special:'perch',support:'branch'}),
    place('boa',.750,.46,.26,{special:'perch',idle:'none',support:'branch'}),place('chameleon',.818,.42,.17,{special:'perch',support:'branch'}),
    place('gorilla',.862,.90,.31),place('tiger',.936,.85,.28),place('orangutan',.950,.43,.28,{special:'hanging',idle:'none',support:'canopy'})
  ],'assets/audio/rainforest.mp3'),
  ocean:scene('ocean','海洋',[
    place('clownfish',.065,.52,.17,{idle:'bob'}),place('seahorse',.164,.77,.24,{idle:'bob'}),
    place('starfish',.243,.94,.12),place('turtle',.294,.51,.25,{idle:'bob'}),place('pufferfish',.362,.74,.17,{idle:'bob'}),
    place('crab',.438,.91,.15),place('whale',.547,.53,.30,{idle:'bob'}),place('dolphin',.722,.35,.20,{idle:'bob'}),
    place('jellyfish',.474,.33,.23,{idle:'bob'}),place('octopus',.679,.90,.25),
    place('stingray',.812,.85,.24,{idle:'bob'}),place('shark',.894,.53,.23,{idle:'bob'}),place('lobster',.942,.93,.15)
  ],'assets/audio/ocean.mp3'),
  arctic:scene('arctic','北极',[
    place('igloo',.175,.78,.37,{kind:'discovery',idle:'none'}),place('inuit',.291,.85,.30,{kind:'discovery'}),
    place('polarbear',.473,.85,.36),place('arcticfox',.635,.81,.20),place('walrus',.825,.90,.30)
  ],'assets/audio/polar.mp3'),
  antarctic:scene('antarctic','南极',[
    place('penguin',.170,.82,.32),place('penguin',.303,.84,.22),place('penguin',.392,.78,.25),
    place('seal',.632,.85,.26,{idle:'breathe'}),place('penguin',.827,.80,.28)
  ],'assets/audio/polar.mp3')
};
const order=['savanna','rainforest','ocean','arctic','antarctic'];
for(const [id,dlg] of Object.entries(D)){
  if(id==='lioness')dlg.callId='lion';
  const en=dlg.name.en.toLowerCase();
  const article=/^[aeiou]/.test(en)?'an':'a';
  dlg.intro={
    en:id==='inuit'?`Hello, little friend! ${dlg.fact.en}`:id==='igloo'?`Hello, little friend! ${dlg.fact.en}`:`Hello, little friend! I'm ${article} ${en}. ${dlg.fact.en}`,
    yue:`你好呀，小朋友！${id==='inuit'||id==='igloo'?'':`我係${dlg.name.yue}。`}${dlg.fact.yue}`,
    cmn:`你好呀，小朋友！${id==='inuit'||id==='igloo'?'':`我是${dlg.name.cmn}。`}${dlg.fact.cmn}`
  };
  dlg.voice=Object.fromEntries(['en','yue','cmn'].map(lang=>[lang,`assets/voice/${id}-${lang}.mp3`]));
  dlg.voiceVariants=Object.fromEntries(['en','yue','cmn'].map(lang=>[lang,[
    {key:'original',role:lang==='en'?'child':'female',path:dlg.voice[lang]},
    {key:'male',role:'male',path:`assets/voice/${id}-${lang}-male.mp3`},
    {key:'alternate',role:lang==='en'?'female':'bright',path:`assets/voice/${id}-${lang}-${lang==='en'?'female':'bright'}.mp3`}
  ]]));
}
fs.writeFileSync('geo/assets/game-data.js',`/* Continuous panoramas; u is normalized across the entire habitat. */\nwindow.GAME_DIALOGUE = ${JSON.stringify(D,null,2)};\nwindow.GAME_SCENE_ORDER = ${JSON.stringify(order)};\nwindow.GAME_SCENES = ${JSON.stringify(S,null,2)};\n`);
fs.writeFileSync('geo/assets/placements.json',JSON.stringify({screenW:1180,screenH:820,sceneOrder:order,scenes:S},null,2));
fs.writeFileSync('geo/assets/voice/script.json',JSON.stringify(Object.fromEntries(Object.entries(D).map(([id,d])=>[id,d.intro])),null,2));
console.log(`${Object.keys(D).length} characters; ${order.length} habitats`);
