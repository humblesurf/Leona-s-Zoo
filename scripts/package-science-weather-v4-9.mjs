import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp = require('sharp');
const root = path.resolve('geo/assets/chapters-v4-9');
const d = (en, cmn, yue, textEn, textCmn, textYue, emoji) => ({name:{en,cmn,yue},intro:{en:textEn,cmn:textCmn,yue:textYue},emoji,kind:'discovery'});
const planetsDialogue = {
  cosmossun:d('Sun','太阳','太陽',"I'm the Sun, our bright star. My light helps warm the Earth.",'我是太阳，是一颗明亮的恒星。我的阳光让地球暖暖的。','我係太陽，係一粒明亮嘅恆星。我嘅陽光令地球暖笠笠。','☀️'),
  cosmosearth:d('Earth','地球','地球',"I'm Earth, our home. I have blue oceans and land, and I travel around the Sun.",'我是地球，是我们的家。我的表面有海洋和陆地，我会绕着太阳转。','我係地球，係我哋嘅家。我有海洋同陸地，會繞住太陽轉。','🌍'),
  cosmosmars:d('Mars','火星','火星',"I'm Mars, the red planet. I travel around the Sun too.",'我是火星，红红的星球。我也会绕着太阳转。','我係火星，紅紅嘅星球。我都會繞住太陽轉。','🔴'),
  cosmosjupiter:d('Jupiter','木星','木星',"I'm Jupiter, the biggest planet in our solar system. Look at my cloudy stripes!",'我是木星，是太阳系里最大的行星。看，我的云层一条一条的！','我係木星，係太陽系最大嘅行星。睇，我嘅雲層一條一條㗎！','🟠'),
  cosmossaturn:d('Saturn','土星','土星',"I'm Saturn. My beautiful rings are made of many little pieces of ice and rock.",'我是土星。我的漂亮光环，是许多小小的冰块和石头组成的。','我係土星。我嘅靚靚光環，係好多細細嘅冰塊同石頭組成㗎。','🪐'),
  cosmosstars:d('Stars','星星','星星',"We're stars, shining far away. The Sun is a star too.",'我们是星星，在遥远的地方发光。太阳也是一颗恒星哦。','我哋係星星，喺好遠嘅地方發光。太陽都係一粒恆星呀。','✨'),
  cosmosgalaxy:d('Milky Way','银河','銀河',"I'm the Milky Way, a huge galaxy with so many stars. Our Sun belongs here too.",'我是银河，有好多好多恒星。我们的太阳，也是银河里的一颗恒星。','我係銀河，有好多好多恆星。我哋嘅太陽，都係銀河入面一粒恆星。','🌌'),
  cosmossatellite:d('Satellite','人造卫星','人造衛星',"I'm a satellite made by people. I travel around Earth and help us learn about our home.",'我是人造卫星，是人们做出来的。我绕着地球转，帮大家认识我们的家。','我係人造衛星，係人哋做出嚟嘅。我繞住地球轉，幫大家認識我哋嘅家。','🛰️')
};
const weatherDialogue = {
  wxsun:d('Sunshine','阳光','陽光',"I'm sunshine. Let's enjoy a bright, sunny day.",'我是阳光。今天晴朗又明亮，一起感受暖暖的太阳吧。','我係陽光。今日晴朗又光猛，一齊感受暖笠笠嘅太陽啦。','☀️'),
  wxcloud:d('Cloud','云朵','雲朵',"I'm a cloud. Lots of tiny water drops or ice crystals make me look fluffy.",'我是云朵。好多小小的水滴或冰晶，让我看起来软绵绵的。','我係雲朵。好多細細嘅水滴或者冰晶，令我睇落軟綿綿。','☁️'),
  wxrain:d('Rain','雨滴','雨滴',"We're raindrops, falling from a cloud. Pitter-patter on the ground!",'我们是雨滴，从云里落下来。滴答滴答，落到地上啦！','我哋係雨滴，喺雲入面跌落嚟。滴答滴答，落到地下啦！','🌧️'),
  wxwind:d('Wind','风','風',"I'm wind, moving air. See the leaves drifting along with me!",'我是风，是流动的空气。看，树叶跟着我飘起来啦！','我係風，係流動嘅空氣。睇，樹葉跟住我飄起嚟啦！','🍃'),
  wxrainbow:d('Rainbow','彩虹','彩虹',"I'm a rainbow. Sunlight and raindrops make my beautiful colors.",'我是彩虹。阳光遇到雨滴，就能出现我漂亮的颜色。','我係彩虹。陽光遇到雨滴，就可以出現我靚靚嘅顏色。','🌈'),
  wxumbrella:d('Umbrella','雨伞','雨傘',"I'm an umbrella. Open me up to help keep the rain off you.",'我是雨伞。把我打开，就能帮你挡住雨滴啦。','我係雨傘。打開我，就可以幫你擋住雨滴啦。','☂️'),
  wxleaves:d('Autumn leaves','秋天的树叶','秋天嘅樹葉',"We're autumn leaves. Some trees turn red or golden before their leaves fall.",'我们是秋天的树叶。有些树叶会变红、变黄，再轻轻飘落下来。','我哋係秋天嘅樹葉。有啲樹葉會變紅、變黃，再輕輕飄落嚟。','🍂'),
  wxsnow:d('Snow','雪花','雪花',"We're snowflakes, made of tiny ice crystals. We fall gently when it's cold enough.",'我们是雪花，是小小的冰晶。天气足够冷时，我们会轻轻飘下来。','我哋係雪花，係細細嘅冰晶。天氣夠凍嗰陣，我哋會輕輕飄落嚟。','❄️')
};
for(const [id, dialogue] of [['planets',planetsDialogue],['weather',weatherDialogue]]) {
  fs.mkdirSync(path.join(root,id,'source'),{recursive:true});
  fs.writeFileSync(path.join(root,id,'dialogue.json'),JSON.stringify(dialogue,null,2));
}
if(process.argv.includes('--dialogue-only')) { console.log('16 discovery dialogues ready'); process.exit(0); }

// Small astronomical and atmospheric diagrams are authored vector geometry,
// rasterized at high resolution for the existing image-based game renderer.
// Colors, cloud shading and transparency are dimensional rather than outlined stickers.
const svg = (w,h,body,defs='')=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;
const authored={};
const starDefs='<radialGradient id="star"><stop offset="0" stop-color="#fffdf1"/><stop offset=".12" stop-color="#fffdf1" stop-opacity=".98"/><stop offset=".25" stop-color="#c1d4ff" stop-opacity=".65"/><stop offset=".5" stop-color="#82aaff" stop-opacity=".18"/><stop offset="1" stop-color="#7b9dff" stop-opacity="0"/></radialGradient>';
let starPoints='';
for(const [x,y,r]of [[192,240,65],[455,149,79],[731,311,61],[315,496,95],[604,645,70],[800,528,55],[175,697,44]])starPoints+=`<circle cx="${x}" cy="${y}" r="${r}" fill="url(#star)"/><circle cx="${x}" cy="${y}" r="${r*.09}" fill="#fffbe9"/>`;
authored.cosmosstars=svg(980,860,starPoints,starDefs);
const dropletDefs='<linearGradient id="drop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bbecff"/><stop offset=".32" stop-color="#59bfeb"/><stop offset=".72" stop-color="#247ec0"/><stop offset="1" stop-color="#0a518e"/></linearGradient><linearGradient id="gleam"><stop stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#f0fbff" stop-opacity="0"/></linearGradient>';
let drops='';
for(const[x,y,s]of[[150,60,.82],[475,20,1.08],[815,105,.7],[115,410,.7],[425,440,.88],[760,450,.87]])drops+=`<g transform="translate(${x} ${y}) scale(${s})"><path d="M100 0 C77 56 0 128 0 189 C0 244 45 286 100 286 C155 286 200 244 200 189 C200 126 126 59 100 0Z" fill="url(#drop)"/><path d="M98 56 C72 110 30 143 30 184 C30 218 46 237 64 243 C42 212 42 174 68 137Z" fill="url(#gleam)"/></g>`;
authored.wxrain=svg(1000,800,drops,dropletDefs);
const leaf=(x,y,rot,color)=>`<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0 C85 -71 130 -37 130 0 C99 78 27 45 0 0Z" fill="${color}"/><path d="M-16 4 L113 -1" stroke="#467b35" stroke-width="3" opacity=".7"/></g>`;
authored.wxwind=svg(1240,760,`<g fill="none" stroke-linecap="round" stroke="url(#air)"><path d="M142 264 C328 238 663 280 766 252 C830 229 829 163 772 160" stroke-width="18"/><path d="M74 401 C369 370 868 453 1089 392" stroke-width="27"/><path d="M205 531 C373 519 637 559 765 526 C824 507 824 447 777 448" stroke-width="14"/></g>${leaf(650,95,-25,'url(#leafgreen)')}${leaf(243,591,8,'url(#leafgreen)')}${leaf(998,481,-38,'url(#leafgreen)')}`, '<linearGradient id="air"><stop stop-color="#cfebf4" stop-opacity=".3"/><stop offset=".35" stop-color="#ecfaff" stop-opacity=".95"/><stop offset=".72" stop-color="#a5d9ed" stop-opacity=".85"/><stop offset="1" stop-color="#5ab7cc" stop-opacity=".18"/></linearGradient><linearGradient id="leafgreen" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c9d86b"/><stop offset=".5" stop-color="#86b254"/><stop offset="1" stop-color="#527d40"/></linearGradient>');
const rainbowColors=['#ed7670','#efa162','#ead276','#82bc8b','#79b9d8','#929fe0','#baa1dc'];
authored.wxrainbow=svg(1340,840,`<g fill="none" stroke-linecap="round">${rainbowColors.map((c,i)=>`<path d="M${70+i*33} 742 A${600-i*33} ${600-i*33} 0 0 1 ${1270-i*33} 742" stroke="${c}" stroke-width="34" opacity=".78"/>`).join('')}<path d="M70 742 A600 600 0 0 1 1270 742" stroke="#fff6df" stroke-width="7" opacity=".26"/></g>`);
const crystal=(x,y,r,rot)=>`<g transform="translate(${x} ${y}) rotate(${rot})" stroke="url(#ice)" stroke-linecap="round" fill="none">${Array.from({length:6},(_,i)=>`<g transform="rotate(${i*60})"><path d="M0 0 L0 ${-r}" stroke-width="${r*.055}"/><path d="M${-r*.19} ${-r*.62} L0 ${-r*.42} L${r*.19} ${-r*.62} M${-r*.16} ${-r*.88} L0 ${-r*.70} L${r*.16} ${-r*.88}" stroke-width="${r*.044}"/></g>`).join('')}<circle r="${r*.08}" fill="#e8faff" stroke="none"/></g>`;
authored.wxsnow=svg(1000,840,crystal(298,265,196,10)+crystal(735,250,125,5)+crystal(667,620,163,24),'<linearGradient id="ice" gradientUnits="userSpaceOnUse" x1="-200" y1="-200" x2="200" y2="200"><stop stop-color="#fcffff"/><stop offset=".45" stop-color="#d5f5ff"/><stop offset="1" stop-color="#90cbdc"/></linearGradient>');
for(const [id,text]of Object.entries(authored)) {
  const chapter=id.startsWith('cosmos')?'planets':'weather';
  fs.writeFileSync(path.join(root,chapter,'source',`${id}.svg`),text);
  await sharp(Buffer.from(text)).webp({lossless:true}).toFile(path.join(root,chapter,`${id}.webp`));
}
// Reuse the existing complete painted Mars globe and the Sun drawing for
// the daytime Sun hotspot; reuse does not change the prior chapter assets.
fs.copyFileSync('geo/assets/exploration-v4-8/space/spacemars.webp',path.join(root,'planets','cosmosmars.webp'));
fs.copyFileSync(path.join(root,'planets','source','cosmossun.png'),path.join(root,'weather','source','wxsun.png'));

// Packaging intentionally uses original transparent cutouts and rendered SVG
// scientific diagrams. There is no frame slicing, warp, or mesh animation.
const dirs = ['planets','weather'];
for(const id of dirs) {
  const dir=path.join(root,id);
  const src=path.join(dir,'source',`${id}-background.png`);
  if(fs.existsSync(src)) {
    const meta=await sharp(src).metadata();
    const width=meta.width, height=Math.round(width/3);
    await sharp(src).resize(width,height,{fit:'cover'}).webp({lossless:true}).toFile(path.join(dir,`${id}-background.webp`));
  }
  for(const file of fs.readdirSync(path.join(dir,'source'))) {
    if(file===`${id}-background.png`||!file.endsWith('.png'))continue;
    const stem=file.slice(0,-4);
    // Preserve real alpha; use an alpha-only common crop with generous 12px padding.
    const {data,info}=await sharp(path.join(dir,'source',file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let left=info.width, top=info.height, right=-1,bottom=-1;
    for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>7){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
    if(right<left)throw Error(`empty alpha: ${file}`);
    left=Math.max(0,left-12);top=Math.max(0,top-12);right=Math.min(info.width-1,right+12);bottom=Math.min(info.height-1,bottom+12);
    await sharp(path.join(dir,'source',file)).extract({left,top,width:right-left+1,height:bottom-top+1}).webp({lossless:true}).toFile(path.join(dir,`${stem}.webp`));
  }
}
const pDefs={cosmossun:['sun',7000],cosmosearth:['earth-orbit',9000],cosmosmars:['planet-orbit',9000],cosmosjupiter:['planet-orbit',9000],cosmossaturn:['planet-orbit',9000],cosmosstars:['stars',6000],cosmosgalaxy:['galaxy',8000],cosmossatellite:['satellite',9000]};
const wDefs={wxsun:['weather-sun',6500,'sun'],wxcloud:['weather-cloud',6500,'cloud'],wxrain:['weather-rain',6500,'rain'],wxwind:['weather-wind',6500,'wind'],wxrainbow:['weather-rainbow',6500,'rainbow'],wxumbrella:['weather-umbrella',6500,'rain'],wxleaves:['weather-autumn',6500,'autumn'],wxsnow:['weather-snow',6500,'snow']};
const placement = (id,u,feetY,h,extra={})=>({id,u,feetY,h,flip:false,idle:'none',instance:`${id}-main`,kind:'discovery',...extra});
const scenes={
  planets:{id:'planets',label:'行星与星空',numScreens:6,bgStrip:'assets/chapters-v4-9/planets/planets-background.webp',bgAspect:3,bgMirror:true,ambience:'assets/audio/v4-9/planets.mp3',animals:[placement('cosmossun',.061,.67,.40),placement('cosmosearth',.192,.66,.255),placement('cosmossatellite',.248,.38,.11),placement('cosmosmars',.34,.68,.22),placement('cosmosjupiter',.47,.73,.365),placement('cosmossaturn',.64,.65,.31),placement('cosmosstars',.775,.49,.22),placement('cosmosgalaxy',.912,.76,.42)]},
  weather:{id:'weather',label:'天气与四季',numScreens:5,bgStrip:'assets/chapters-v4-9/weather/weather-background.webp',bgAspect:3,bgMirror:true,ambience:'assets/audio/v4-9/weather.mp3',animals:[placement('wxsun',.065,.34,.18),placement('wxcloud',.195,.39,.145),placement('wxrain',.31,.43,.20),placement('wxwind',.405,.68,.19),placement('wxrainbow',.515,.49,.22),placement('wxumbrella',.645,.90,.32),placement('wxleaves',.78,.79,.24),placement('wxsnow',.92,.46,.20)]}
};
const qa={generated:new Date().toISOString(),assets:[],errors:[]};
for(const [chapter, defs,dialogue] of [['planets',pDefs,planetsDialogue],['weather',wDefs,weatherDialogue]]) {
  const objects={};
  for(const [id,[motion,duration,weather]]of Object.entries(defs)) {
    const dir=path.join(root,chapter);const file=path.join(dir,`${id}.webp`);
    if(!fs.existsSync(file))throw Error(`missing asset ${file}`);
    const meta=await sharp(file).metadata();
    objects[id]={poster:`assets/chapters-v4-9/${chapter}/${id}.webp`,width:meta.width,height:meta.height,motion,duration,...weather?{weather}:{}};
    const st=await sharp(file).ensureAlpha().stats();
    if(st.channels[3].min!==0)qa.errors.push(`nontransparent ${id}`);
    qa.assets.push({id,width:meta.width,height:meta.height,bytes:fs.statSync(file).size,alphaMin:st.channels[3].min,alphaMax:st.channels[3].max});
  }
  fs.writeFileSync(path.join(root,chapter,`${chapter}.json`),JSON.stringify({scene:scenes[chapter],objects,dialogue},null,2));
}
fs.writeFileSync(path.join(root,'planets','asset-qa.json'),JSON.stringify(qa,null,2));
fs.writeFileSync(path.join(root,'weather','asset-qa.json'),JSON.stringify(qa,null,2));
if(qa.errors.length)throw Error(qa.errors.join('\n'));
console.log(JSON.stringify({chapters:2,objects:16,placements:16,errors:qa.errors}));
