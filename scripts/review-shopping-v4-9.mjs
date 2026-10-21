import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright');
const dir='screenshots/v4-9/shop';fs.mkdirSync(dir,{recursive:true});
const base=process.argv[2]||'http://127.0.0.1:4173/geo/';
const browser=await chromium.launch({channel:'msedge',headless:true});
const report={errors:[],failedAssets:[],objects:[],persistence:[],alpha:[]};
const check=(ok,message)=>{if(!ok)report.errors.push(message);};
try{
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.failedAssets.push({url:r.url(),status:r.status()});});
 for(const viewport of [{width:2560,height:1440},{width:844,height:390}]){
  await page.setViewportSize(viewport);await page.goto(base+'?scene=supermarket&v=4.9');
  await page.waitForFunction(()=>window.__Animals&&window.ChapterObjects&&[...document.images].every(i=>i.complete&&i.naturalWidth));
  await page.evaluate(()=>{__Animals.dismissIntro();__Animals.goScene('supermarket');});await page.waitForTimeout(500);
  const dock=page.locator('.shopping-dock');check(await dock.isVisible(),viewport.width+': dock missing');await dock.click({timeout:5000});
  check(await page.evaluate(()=>ChapterObjects.basket.length===0),viewport.width+': dock clear');
  await page.screenshot({path:dir+'/'+viewport.width+'-entry.png'});
  const ids=['shopmilk','shopbread','shopeggs','shopyogurt','shoptissue','shopcart','shopbasket'];
  for(const id of ids){
   await page.evaluate(id=>{AnimalAnims.stopAll();__Animals.stopSpeech();const e=[...document.querySelectorAll('.animal[data-id="'+id+'"]')].find(e=>e.tabIndex===0),r=e.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth*.5;},id);
   await page.evaluate(id=>AnimalAnims.preload(id),id);await page.waitForTimeout(60);
   const button=page.locator('.animal[data-id="'+id+'"][tabindex="0"]').first();
   const resting=await button.evaluate(e=>{const r=e.querySelector('.orientation').getBoundingClientRect(),a=GAME_SCENES.supermarket.animals.find(a=>a.id===e.dataset.id),im=e.querySelector('.idle-layer img');return {top:r.top,bottom:r.bottom,feet:a.feetY,height:r.height,imageLoaded:im.complete&&im.naturalWidth>0,sourceAspect:im.naturalWidth/im.naturalHeight,renderAspect:r.width/r.height};});
   if(id!=='shopcart'&&id!=='shopbasket')check(Math.abs(resting.bottom/viewport.height-.445)<.005,id+': not on counter');
   check(resting.imageLoaded&&Math.abs(resting.renderAspect-resting.sourceAspect)<.03,id+': resting image aspect');
   const beforeCount=await page.evaluate(()=>ChapterObjects.basket.length);await button.click();await page.waitForTimeout(90);
   const started=await button.evaluate(e=>AnimalAnims.inspect(e));check(started?.renderer==='chapter-originals',id+': missing animation');
   await button.evaluate(e=>AnimalAnims.seek(e,.5));
   const mid=await button.evaluate(e=>{const state=AnimalAnims.inspect(e),r=e.querySelector('.chapter-visual').getBoundingClientRect(),s=document.querySelector('#subtitle.show')?.getBoundingClientRect();return {...state,top:r.top,bottom:r.bottom,subtitleOverlap:!!s&&s.bottom>r.top&&s.top<r.bottom};});
   check(mid.top>=0&&mid.bottom<=viewport.height,id+': vertical clipping');check(!mid.subtitleOverlap,id+': subtitle over object');
   if(mid.motion==='shop-product'){
    check(mid.flight,id+': missing shopping flight');
    await page.screenshot({path:dir+'/'+viewport.width+'-'+id+'-flight-mid.png'});
    await button.evaluate(e=>AnimalAnims.seek(e,.8));
    const end=await page.evaluate(()=>{const f=document.querySelector('.shopping-flight').getBoundingClientRect(),d=document.querySelector('.shopping-dock').getBoundingClientRect();return {count:ChapterObjects.basket.length,label:Number(document.querySelector('.shopping-count').textContent),flight:{x:f.left+f.width/2,y:f.top+f.height/2,width:f.width,height:f.height},dock:{x:d.left+d.width/2,y:d.top+d.height/2},dx:Math.abs(f.left+f.width/2-d.left-d.width/2),dy:Math.abs(f.top+f.height/2-d.top-d.height/2)};});
    check(end.count===beforeCount+1&&end.label===end.count,id+': basket count');
    check(end.dx<28&&end.dy<28,id+': flight misses basket ('+end.dx.toFixed(1)+','+end.dy.toFixed(1)+')');
    await button.evaluate(e=>AnimalAnims.seek(e,.8));check(await page.evaluate(()=>ChapterObjects.basket.length)===end.count,id+': duplicate count for same flight');
    report.objects.push({viewport:viewport.width,id,resting,mid,end});
   }else{
    if(mid.motion==='shop-cart'){check(mid.travel*mid.face>0,id+': moving backwards');check(mid.wheels===4,id+': incomplete four wheels');}
    if(mid.motion==='shop-basket')check(await page.evaluate(()=>ChapterObjects.basket.length===0),id+': did not empty basket');
    report.objects.push({viewport:viewport.width,id,resting,mid});
   }
   await page.screenshot({path:dir+'/'+viewport.width+'-'+id+'-active.png'});await button.evaluate(e=>AnimalAnims.stop(e));
   check(await page.locator('.shopping-flight').count()===0,id+': lingering flight on stop');
  }
  // Exercise one product's natural timeline, then persist the collection through scene and size changes.
  await page.evaluate(()=>{AnimalAnims.stopAll();__Animals.stopSpeech();const e=[...document.querySelectorAll('.animal[data-id="shopmilk"]')].find(e=>e.tabIndex===0),r=e.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth*.5;});
  await page.locator('.animal[data-id="shopmilk"][tabindex="0"]').first().click();await page.waitForTimeout(3300);
  const collected=await page.evaluate(()=>ChapterObjects.basket.length);check(collected===1,viewport.width+': natural timeline did not collect');
  await page.evaluate(()=>{__Animals.goScene('beach');});await page.waitForTimeout(500);check(!await dock.isVisible(),viewport.width+': dock visible in another scene');
  await page.evaluate(()=>__Animals.goScene('supermarket'));await page.waitForTimeout(500);check(await page.evaluate(()=>ChapterObjects.basket.length)===collected,viewport.width+': lost count on scene change');
  const resize={width:viewport.width===844?896:1920,height:viewport.height===390?414:1080};await page.setViewportSize(resize);await page.waitForTimeout(350);
  check(await page.evaluate(()=>ChapterObjects.basket.length)===collected&&await dock.isVisible(),viewport.width+': lost basket on resize');
  await dock.click();check(await page.evaluate(()=>ChapterObjects.basket.length===0),viewport.width+': persisted basket did not clear');
  report.persistence.push({viewport:viewport.width,count:collected,scene:true,resize:true,clear:true});
 }
 const assetReport=JSON.parse(fs.readFileSync('geo/assets/chapters-v4-9/supermarket/manifest.json','utf8'));
 for(const asset of assetReport.assets.filter(a=>a.id!=='background')){check(asset.hasAlpha&&asset.transparentRatio>.05&&asset.edgeAlphaPixels===0,asset.id+': alpha/boundary');report.alpha.push({id:asset.id,hasAlpha:asset.hasAlpha,transparentRatio:asset.transparentRatio,edgePixels:asset.edgeAlphaPixels});}
 check(report.failedAssets.length===0,'Missing assets');
 console.log(JSON.stringify({objects:report.objects.length,viewports:2,persistence:report.persistence.length,alpha:report.alpha.length,errors:report.errors,failedAssets:report.failedAssets},null,2));
}finally{fs.writeFileSync(dir+'/runtime-checks.json',JSON.stringify(report,null,2));await browser.close();}
if(report.errors.length||report.failedAssets.length)process.exitCode=1;
