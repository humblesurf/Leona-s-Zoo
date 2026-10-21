import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage({viewport:{width:1180,height:820}});
page.on('pageerror',e=>console.log('ERROR',e.message));
fs.mkdirSync('geo/screenshots/v2',{recursive:true});
await page.goto('http://127.0.0.1:4173/geo/');await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));
await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
await page.evaluate(()=>document.fonts.ready);
for(const viewport of [{width:1180,height:820},{width:390,height:844},{width:844,height:390},{width:320,height:568}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(400);
  await page.screenshot({path:`geo/screenshots/v2/intro-${viewport.width}.jpg`,quality:92});
}
await page.setViewportSize({width:1180,height:820});await page.evaluate(()=>__Animals.dismissIntro());
await page.waitForTimeout(700);
for(const id of ['savanna','rainforest','ocean','arctic','antarctic']){
  await page.evaluate(id=>window.__Animals.goScene(id),id);await page.waitForTimeout(750);
  for(let i=0;i<3;i++){
    if(i){await page.evaluate(()=>window.__Animals.camera+=window.__Animals.screenW());await page.waitForTimeout(350);}
    await page.screenshot({path:`geo/screenshots/v2/${id}-${i}.jpg`,quality:88});
  }
}
console.log(await page.evaluate(()=>({broken:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),animals:document.querySelectorAll('.animal').length})));
await browser.close();
