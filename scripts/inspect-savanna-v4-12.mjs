import fs from 'node:fs';import path from 'node:path';import{createRequire}from'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright');
const dir=path.resolve('screenshots/v4-12/savanna');fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true}),report=[];
try{for(const vp of [{width:1920,height:1080},{width:844,height:390}]){
 const page=await browser.newPage({viewport:vp});await page.goto('http://127.0.0.1:4173/share/runtime-v4-11/index.html?scene=savanna');await page.waitForFunction(()=>window.__Animals&&window.GAME_SCENES);await page.evaluate(()=>__Animals.dismissIntro());await page.waitForTimeout(180);
 const rows=await page.evaluate(()=>{const animals=GAME_SCENES.savanna.animals;return{scene:JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(GAME_SCENES.savanna).filter(([k])=>k!=='animals')))),actors:animals.filter(a=>['elephant','elephantcalf','crocodile','hippo'].includes(a.id)).map(a=>{const e=[...document.querySelectorAll(`.animal[data-instance="${a.instance}"]`)].find(e=>e.tabIndex===0),r=e.getBoundingClientRect();return{...a,rect:[r.left,r.top,r.width,r.height],z:getComputedStyle(e).zIndex};})};});
 report.push({viewport:vp,...rows});
 for(const instance of rows.actors.filter(a=>a.id==='elephant'||a.id==='crocodile').map(a=>a.instance)){
  await page.evaluate(instance=>{const e=[...document.querySelectorAll(`.animal[data-instance="${instance}"]`)].find(e=>e.tabIndex===0),r=e.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth/2;},instance);await page.screenshot({path:path.join(dir,`${vp.width}-before-${instance}.png`)});
 }await page.close();
}}finally{await browser.close();fs.writeFileSync(path.join(dir,'baseline.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify(report.map(r=>({viewport:r.viewport,actors:r.actors.map(a=>({id:a.id,instance:a.instance,u:a.u,renderU:a.renderU,feetY:a.feetY,h:a.h,shoreX:a.shoreX,rect:a.rect}))})),null,2));
