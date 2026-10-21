import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright');
const dir='geo/assets/animation/v4-11-style/review';
const browser=await chromium.launch({channel:'msedge',headless:true}),report={views:[],characters:[],errors:[]};
try{
 const page=await browser.newPage({viewport:{width:1800,height:1000}});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/geo/?v=4.11-rainforest-art');
 await page.waitForFunction(()=>window.__Animals&&window.ANIMAL_ANIMATIONS.lemur&&[...document.images].every(i=>i.complete&&i.naturalWidth));
 for(const size of [{width:1800,height:1000},{width:844,height:390}]){
  await page.setViewportSize(size);await page.waitForTimeout(180);
  for(const id of ['monkey','otter','butterfly','lemur','peacock','macaw','boa','tiger']){
   const view=await page.evaluate(async id=>{
    __Animals.dismissIntro();__Animals.stopSpeech();AnimalAnims.stopAll();const actors=[...document.querySelectorAll('.animal')].filter(e=>e.dataset.id===id&&e.tabIndex===0),e=actors[0];
    const r=e.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth*.5;await AnimalAnims.preload(id);
    return {id,count:actors.length,placements:actors.map(e=>{const b=e.getBoundingClientRect();return {x:b.left,y:b.top,w:b.width,h:b.height};})};
   },id);report.views.push({size,...view});
   await page.screenshot({path:dir+'/'+id+'-scene-'+size.width+'.png'});
   if(['lemur','peacock'].includes(id)&&size.width===1800){
    for(let frame=0;frame<4;frame++){
     await page.evaluate(id=>{AnimalAnims.stopAll();const e=[...document.querySelectorAll('.animal')].find(e=>e.dataset.id===id&&e.tabIndex===0);AnimalAnims.play(e,id);},id);
     await page.waitForFunction(id=>{const e=[...document.querySelectorAll('.animal')].find(e=>e.dataset.id===id&&e.tabIndex===0);return AnimalAnims.inspect(e)?.ready;},id);
     const state=await page.evaluate(({id,frame})=>{const e=[...document.querySelectorAll('.animal')].find(e=>e.dataset.id===id&&e.tabIndex===0),d=ANIMAL_ANIMATIONS[id],index=d.cel.sequence.indexOf(frame),elapsed=d.cel.holdsMs.slice(0,index).reduce((a,b)=>a+b,0)+d.cel.holdsMs[index]*.4;AnimalAnims.seek(e,elapsed/d.duration);return AnimalAnims.inspect(e);},{id,frame});
     report.characters.push({id,frame,actualFrame:state.frame,ready:state.ready,renderer:state.renderer});await page.screenshot({path:dir+'/'+id+'-actual-'+frame+'.png'});
    }
   }
  }
 }
}finally{await browser.close();fs.writeFileSync(dir+'/rainforest-runtime.json',JSON.stringify(report,null,2));}
const passed=!report.errors.length&&report.characters.every(c=>c.ready&&c.frame===c.actualFrame);
console.log(JSON.stringify({passed,errors:report.errors,characters:report.characters,views:report.views.map(v=>({id:v.id,count:v.count,width:v.size.width}))},null,2));
if(!passed)process.exitCode=1;
