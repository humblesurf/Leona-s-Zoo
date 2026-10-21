// Private independent QA. This injects an uncommitted overlay only into the
// browser response and never edits the game's HTML or shared renderer.
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright'),sharp=require('sharp');
const dir='screenshots/v4-12-private',overlayPath='geo/assets/hoof-motion-v4-12.js';
const url='http://127.0.0.1:4173/geo/?v=4.12-independent-gait';
if(!fs.existsSync(overlayPath))throw Error('V4.12 gait overlay has not been delivered');
fs.mkdirSync(dir,{recursive:true});
const report={url,views:[],errors:[],failed:[]},browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const viewport of [{width:1800,height:1000},{width:844,height:390}])for(const flip of [false,true]){
  const page=await browser.newPage({viewport});
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)report.failed.push({url:r.url(),status:r.status()});});
  await page.route(url,async route=>{
   let html=fs.readFileSync('geo/index.html','utf8');
   if(!html.includes('hoof-motion-v4-12.js'))html=html.replace('<script src="assets/chapter-motion.js">','<script>'+fs.readFileSync(overlayPath,'utf8')+'</script><script src="assets/chapter-motion.js">');
   await route.fulfill({status:200,contentType:'text/html',body:html});
  });
  await page.goto(url);await page.waitForFunction(()=>window.__Animals&&window.AnimalAnims&&[...document.images].every(i=>i.complete&&i.naturalWidth));
  await page.evaluate(()=>{__Animals.dismissIntro();__Animals.stopSpeech();});
  for(const id of ['zebra','rhino','buffalo']){
   const def=await page.evaluate(id=>ANIMAL_ANIMATIONS[id],id);
   if(!def.sheet.includes('v4-12-gait'))throw Error(id+' is still using the old sheet');
   await page.evaluate(async({id,flip})=>{
    AnimalAnims.stopAll();const e=[...document.querySelectorAll('.animal[data-id="'+id+'"]')].find(e=>e.tabIndex===0);
    e.dataset.flip=String(flip);e.querySelector('.orientation').style.transform=`scaleX(${flip?-1:1})`;
    const b=e.getBoundingClientRect();__Animals.camera+=b.left+b.width/2-innerWidth*.5;await AnimalAnims.preload(id);AnimalAnims.play(e,id);
   },{id,flip});
   await page.waitForFunction(id=>AnimalAnims.inspect([...document.querySelectorAll('.animal[data-id="'+id+'"]')].find(e=>e.tabIndex===0))?.ready,id);
   const samples=[],thumbs=[];let thumbH=0;
   for(let frame=0;frame<def.frames.length;frame++){
    const state=await page.evaluate(({id,frame})=>{
     const e=[...document.querySelectorAll('.animal[data-id="'+id+'"]')].find(e=>e.tabIndex===0),d=ANIMAL_ANIMATIONS[id],holds=d.cel.holdsMs;
     let elapsed=0,choices=[];for(let i=0;i<d.cel.sequence.length;i++){if(d.cel.sequence[i]===frame)choices.push(elapsed+holds[i]*.5);elapsed+=holds[i];}
     const t=choices.find(t=>t/d.duration>.16&&t/d.duration<.80)??choices[0];if(t===undefined)throw Error('Unexposed frame '+frame);
     AnimalAnims.seek(e,t/d.duration);const s=AnimalAnims.inspect(e),r=e.querySelector('.orientation').getBoundingClientRect();
     return{...s,box:{x:r.x,y:r.y,width:r.width,height:r.height}};
    },{id,frame});
    if(state.frame!==frame)throw Error(id+' exposed '+state.frame+' instead of requested '+frame);
    if(state.travel&&state.travel*state.face<=0)throw Error(id+' moves backwards');
    const b=state.box,pad=40,x=Math.max(0,Math.floor(b.x-pad)),y=Math.max(0,Math.floor(b.y-pad)),clip={x,y,width:Math.min(viewport.width-x,Math.ceil(b.width+pad*2)),height:Math.min(viewport.height-y,Math.ceil(b.height+pad*2))};
    const path=`${dir}/${id}-${viewport.width}-${flip?'right':'left'}-${frame}.png`;await page.screenshot({path,clip});
    const thumb=await sharp(path).resize({width:340}).png().toBuffer(),m=await sharp(thumb).metadata();thumbH=Math.max(thumbH,m.height+28);
    thumbs.push({frame,thumb,height:m.height});samples.push(state);
   }
   const overlays=[];for(const {frame,thumb}of thumbs){const left=frame%5*340,top=Math.floor(frame/5)*thumbH;overlays.push({input:thumb,left,top:top+28},{input:Buffer.from(`<svg width="340" height="28"><rect width="100%" height="100%" fill="#efe9db"/><text x="8" y="20" font-size="16" font-family="Arial">${id} ${frame}</text></svg>`),left,top});}
   await sharp({create:{width:1700,height:Math.ceil(thumbs.length/5)*thumbH,channels:3,background:'#efe9db'}}).composite(overlays).png().toFile(`${dir}/${id}-${viewport.width}-${flip?'right':'left'}-runtime.png`);
   report.views.push({id,viewport,flip,definition:def,samples});
  }
  await page.close();
 }
}finally{await browser.close();fs.writeFileSync(dir+'/hoof-runtime.json',JSON.stringify(report,null,2));}
console.log(JSON.stringify({errors:report.errors,failed:report.failed,views:report.views.map(v=>({id:v.id,width:v.viewport.width,flip:v.flip,frames:v.samples.length,face:v.samples[0].face,travel:v.samples[0].travel}))},null,2));
if(report.errors.length||report.failed.length)process.exitCode=1;
