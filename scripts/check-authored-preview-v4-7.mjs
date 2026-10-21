import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true}),report={errors:[],selections:[],viewports:[]};
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/geo/authored-motion-review.html');await page.waitForFunction(()=>!document.querySelector('#replay').disabled);
 for(const id of ['cheetah','elephant','zebra','jaguar','cow','polarbear','lioncub']){
  await page.selectOption('#animal',id);await page.waitForTimeout(250);
  const item=await page.locator('#candidate').evaluate((frame,id)=>{const g=frame.contentWindow,el=[...g.document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>g.AnimalAnims.isActing(e)),s=g.AnimalAnims.inspect(el),r=el.getBoundingClientRect();return {id,renderer:s?.renderer,progress:s?.progress,visible:r.right>0&&r.left<g.innerWidth};},id);
  report.selections.push(item);assert(item.renderer==='authored-keyframes'&&item.progress>=0&&item.visible,id+': '+JSON.stringify(item));
 }
 await page.selectOption('#speed','.5');await page.selectOption('#animal','cheetah');await page.waitForTimeout(650);
 report.halfSpeed=await page.locator('#candidate').evaluate(frame=>{const g=frame.contentWindow,el=[...g.document.querySelectorAll('.animal[data-id="cheetah"]')].find(e=>g.AnimalAnims.isActing(e));return g.AnimalAnims.inspect(el).progress;});assert(report.halfSpeed>.1&&report.halfSpeed<.35);
 await page.click('#compare');await page.waitForTimeout(300);assert.equal(await page.locator('body').getAttribute('data-compare'),'true');
 report.comparison=await page.locator('#old').evaluate(frame=>{const g=frame.contentWindow,el=[...g.document.querySelectorAll('.animal[data-id="cheetah"]')].find(e=>g.AnimalAnims.isActing(e));return {renderer:g.AnimalAnims.inspect(el)?.renderer,width:g.innerWidth};});assert.equal(report.comparison.renderer,'continuous-ik-walk');assert(report.comparison.width>0);
 await page.click('#compare');await page.selectOption('#speed','1');
 for(const viewport of [{width:1440,height:900},{width:844,height:390}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(100);await page.click('#replay');await page.waitForTimeout(200);
  const item=await page.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,previewHeight:document.querySelector('#candidate').getBoundingClientRect().height}));assert.equal(item.scrollWidth,item.width);assert(item.previewHeight>220);report.viewports.push(item);
  await page.screenshot({path:`screenshots/v4-7/preview-${viewport.width}.png`});
 }
 assert.equal(report.errors.length,0);console.log(JSON.stringify(report,null,2));
}finally{fs.writeFileSync('screenshots/v4-7/preview-checks.json',JSON.stringify(report,null,2));await browser.close();}
