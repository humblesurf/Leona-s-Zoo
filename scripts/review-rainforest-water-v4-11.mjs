import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright');
const dir='geo/assets/animation/v4-11-style/review';
const browser=await chromium.launch({channel:'msedge',headless:true}),report={url:'http://127.0.0.1:4173/share/runtime-v4-11/index.html',views:[],errors:[],failed:[]};
try{
 const page=await browser.newPage({viewport:{width:1800,height:1000}});page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.failed.push({url:r.url(),status:r.status()});});
 await page.goto(report.url+'?scene=rainforest&qa=water');await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));
 await page.waitForTimeout(650);await page.evaluate(()=>{__Animals.swipe(80);__Animals.dismissIntro();__Animals.stopSpeech();});
 for(const size of [{width:1800,height:1000},{width:844,height:390}]){
  await page.setViewportSize(size);await page.waitForTimeout(220);
  const otters=await page.evaluate(()=>{AnimalAnims.stopAll();const actors=[...document.querySelectorAll('.animal[data-id="otter"]')].filter(e=>e.tabIndex===0),r=actors[0].getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth*.5;return GAME_SCENES.rainforest.animals.filter(a=>a.id==='otter').map(a=>({u:a.u,bgAnchorX:a.bgAnchorX,feetY:a.feetY,waterDepth:a.waterDepth,h:a.h}));});
  await page.screenshot({path:dir+'/otter-water-corrected-'+size.width+'.png'});report.views.push({id:'otter',size,placements:otters});
  const background=await page.evaluate(()=>{AnimalAnims.stopAll();const d=[...document.querySelectorAll('.distant-animal')].find(e=>e.src.includes('lemur-poster')&&e.getBoundingClientRect().left>__Animals.camera-innerWidth);const e=[...document.querySelectorAll('.animal[data-id="peacock"]')].find(e=>e.tabIndex===0),r=e.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth*.5;return GAME_SCENES.rainforest.backgroundHerds.find(a=>a.id==='lemur');});
  await page.screenshot({path:dir+'/lemur-bank-corrected-'+size.width+'.png'});report.views.push({id:'distant-lemur',size,placement:background});
 }
}finally{await browser.close();fs.writeFileSync(dir+'/water-correction-runtime.json',JSON.stringify(report,null,2));}
console.log(JSON.stringify({passed:!report.errors.length&&!report.failed.length,...report},null,2));if(report.errors.length||report.failed.length)process.exitCode=1;
