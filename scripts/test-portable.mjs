import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1180,height:820},offline:true});
const page=await context.newPage(),errors=[],externalRequests=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('request',r=>{if(/^https?:/.test(r.url()))externalRequests.push(r.url());});
await page.addInitScript(()=>{window.__played=[];window.__media=new Set();const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){__media.add(this);if(this.volume>0)__played.push(this.src);return play.call(this);};});
const version=process.env.ANIMAL_PORTABLE_VERSION||'v4',build=JSON.parse(fs.readFileSync(`share/build-${version}.json`));
const url=pathToFileURL(path.resolve(`share/Leonas-Zoo-${version}.html`)).href;
await page.goto(url);await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));
const assets=await page.evaluate(()=>({count:Object.keys(ASSET).length,narrations:Object.keys(ASSET).filter(k=>k.startsWith('assets/voice/')).length}));
assert.equal(assets.count,build.mediaAssets);assert.equal(assets.narrations,build.narrationFiles);
await page.evaluate(()=>document.fonts.ready);assert.ok(await page.evaluate(()=>document.fonts.check('700 80px "Zoo Candy"')));
await page.locator('#languageButton').click();await page.locator('[data-language="cmn"]').click();
await page.evaluate(()=>__Animals.camera=0);
await page.locator('.animal[data-id="lion"]').nth(1).click();
await page.waitForFunction(()=>document.querySelector('.sub-label').textContent.includes('普通话'),{},{timeout:8000});
await page.waitForFunction(()=>[...__media].some(a=>a.src.startsWith('data:audio/')&&!a.paused&&a.currentTime>.2),{},{timeout:8000});
await page.locator('#soundButton').click();await page.waitForTimeout(950);assert.equal(await page.evaluate(()=>[...__media].filter(a=>!a.paused).length),0);
if(await page.locator('#habitats').getAttribute('aria-hidden')==='true')await page.locator('#navToggle').click();
await page.locator('#habitats [data-scene="arctic"]').click();await page.waitForTimeout(750);assert.equal(await page.evaluate(()=>__Animals.sceneAt().id),'arctic');
if(version==='v4'){
 await page.evaluate(()=>{const e=[...document.querySelectorAll('.animal[data-id="polarbear"]')].find(e=>{const r=e.getBoundingClientRect();return r.right>0&&r.left<innerWidth;})||document.querySelector('.animal[data-id="polarbear"]');window.__portableEl=e;AnimalAnims.play(e,'polarbear');});
 await page.waitForFunction(()=>AnimalAnims.inspect(__portableEl)?.ready);
 assert.equal(await page.evaluate(()=>AnimalAnims.inspect(__portableEl).renderer),'sprite-keyframes');
 await page.evaluate(()=>{AnimalAnims.seek(__portableEl,.5);AnimalAnims.stopAll();});
}
await page.locator('#languageButton').click();await page.locator('#creditsButton').click();assert.equal(await page.locator('.credit-row').count(),await page.evaluate(()=>Object.keys(CALL_RECORDINGS).length));await page.locator('#closeCredits').click();
assert.deepEqual(errors,[]);assert.deepEqual(externalRequests,[]);
if(version==='v4'){await page.waitForFunction(()=>!document.body.classList.contains('nav-open'),{},{timeout:4000});await page.waitForTimeout(320);}
await page.screenshot({path:`geo/screenshots/${version==='v4'?'v4':'v2'}/portable-arctic.jpg`,quality:90});
const report={offline:true,...assets,errors,externalRequests};fs.writeFileSync(`share/test-${version}.json`,JSON.stringify(report,null,2));console.log(report);
await browser.close();
