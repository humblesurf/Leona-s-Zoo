import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:2560,height:1440}});await page.goto('http://127.0.0.1:4173/geo/?v=4.6.1');await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));
 const report=await page.evaluate(async()=>{
  __Animals.dismissIntro();const el=[...document.querySelectorAll('.animal[data-id="cheetah"]')].find(e=>e.tabIndex===0);AnimalAnims.play(el);
  let previous=null;const rows=[];await new Promise(resolve=>{function tick(t){const s=AnimalAnims.inspect(el);if(!s){resolve();return;}
   if(previous)for(let i=0;i<s.gait.length;i++){const l=s.gait[i],p=previous.gait[i],diff=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));rows.push({ms:t-previous.at,progress:s.progress,leg:l.name,phase:l.phase,upper:diff(l.upper,p.upper),lower:diff(l.lower,p.lower),envelope:s.walkState.envelope});}
   previous={...s,at:t};requestAnimationFrame(tick);
  }requestAnimationFrame(tick);});
  return rows.sort((a,b)=>Math.max(b.upper,b.lower)-Math.max(a.upper,a.lower)).slice(0,12);
 });console.log(report);fs.writeFileSync('screenshots/v4-6-1/cheetah-timing-diagnostic.json',JSON.stringify(report,null,2));
}finally{await browser.close();}
