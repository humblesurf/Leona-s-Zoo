import fs from 'node:fs';import {createRequire}from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const out='reviews/v4-13/zebra-user-preview';fs.mkdirSync(out,{recursive:true});const results=[];
for(const [label,viewport]of Object.entries({desktop:{width:1920,height:1080},laptop:{width:1280,height:800},phoneLandscape:{width:844,height:390},phonePortrait:{width:390,height:844}})){
 const context=await browser.newContext({viewport});const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto('http://127.0.0.1:4174/v4-13/preview-zebra.html');await page.waitForFunction(()=>window.__ZebraPreview?.inspect()?.ready);
 const state=await page.evaluate(()=>({mode:__ZebraPreview.mode,animalCount:document.querySelectorAll('.animal').length,def:AnimalAnims.defs.zebra.cel.poses,acting:__ZebraPreview.inspect()}));
 await page.screenshot({path:`${out}/${label}.png`});
 // Replay during a walk must keep its existing phase rather than restart it.
 const before=await page.evaluate(()=>__ZebraPreview.inspect()?.time);await page.click('#replay');const after=await page.evaluate(()=>__ZebraPreview.inspect()?.time);
 await page.click('#turn');await page.waitForFunction(()=>__ZebraPreview.inspect()?.ready&&__ZebraPreview.inspect().orientation===-1);
 const turned=await page.evaluate(()=>({orientation:__ZebraPreview.inspect().orientation,travel:__ZebraPreview.inspect().travel}));
 await page.click('[data-mode="baseline"]');await page.waitForFunction(()=>__ZebraPreview.mode==='baseline'&&__ZebraPreview.inspect()?.ready);
 const old=await page.evaluate(()=>AnimalAnims.defs.zebra.frames.length);
 await page.click('[data-mode="candidate"]');await page.waitForFunction(()=>__ZebraPreview.mode==='candidate'&&__ZebraPreview.inspect()?.ready);
 const rect=await page.locator('.preview-animal').boundingBox();
 const row={label,viewport,errors,oneAnimal:state.animalCount===1,poses:state.def,renderer:state.acting.renderer,forwardLeft:state.acting.travel<0,forwardRight:turned.travel>0,repeatedTapKeepsPhase:after>=before,oldPoses:old,bounds:rect,controlsVisible:await page.locator('#replay').isVisible()};
 if(errors.length||!row.oneAnimal||row.poses!==16||!row.forwardLeft||!row.forwardRight||!row.repeatedTapKeepsPhase||rect.x<0||rect.x+rect.width>viewport.width)throw Error(JSON.stringify(row));
 results.push(row);await context.close();
}
const context=await browser.newContext({viewport:{width:844,height:390},reducedMotion:'reduce'});const page=await context.newPage();await page.goto('http://127.0.0.1:4174/v4-13/preview-zebra.html');await page.waitForFunction(()=>document.getElementById('loadState').hidden);const reducedIdle=await page.evaluate(()=>__ZebraPreview.inspect()===null);await page.click('#replay');await page.waitForFunction(()=>__ZebraPreview.inspect()?.ready);const reducedTravel=await page.evaluate(()=>__ZebraPreview.inspect().travel);if(!reducedIdle||reducedTravel!==0)throw Error('Reduced motion behavior changed');await context.close();
await browser.close();const report={preview:'http://127.0.0.1:4174/v4-13/preview-zebra.html',scope:'One zebra for user visual approval only, not a completed quadruped release.',results,reducedMotion:{idleUntilClick:reducedIdle,travel:reducedTravel}};fs.writeFileSync(`${out}/checks.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({views:results.length,errors:results.flatMap(x=>x.errors),allInteractionsPassed:true,reducedMotionPassed:true,preview:report.preview}));
