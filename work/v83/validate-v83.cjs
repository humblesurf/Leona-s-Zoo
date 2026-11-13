const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),errors=[];
const data=JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'inspect-data.cjs'),'all'],{maxBuffer:20e6}));
function check(ok,message){if(!ok)errors.push(message);}
function exists(file){return fs.existsSync(path.join(root,file.split('?')[0]));}
for(const entry of ['Leonas-Zoo-v8.3.html','Leonas-Zoo-v8.3-editor.html']){
 const html=fs.readFileSync(path.join(root,entry),'utf8');
 for(const m of html.matchAll(/(?:src|href)="(assets\/[^"#]+)"/g))check(exists(m[1]),entry+' missing '+m[1]);
 for(const m of html.matchAll(/<script src="([^"?]+)(?:\?[^"]*)?"/g))try{new vm.Script(fs.readFileSync(path.join(root,m[1]),'utf8'),{filename:m[1]});}catch(e){errors.push(e.message);}
}
check(JSON.stringify(data.order)===JSON.stringify(['savanna','rainforest','ocean','farm','music']),'Wrong active scenes');
for(const sid of data.order){
 const scene=data.scenes[sid];check(!scene.bgMirror,'Mirrored '+sid);check(exists(scene.ambience),'Missing ambience '+sid);
 for(const source of scene.bgPanels||[scene.bgStrip])if(source)check(exists(source),'Missing background '+source);
 const instances=new Set();for(const a of scene.animals){check(!instances.has(a.instance),'Duplicate '+a.instance);instances.add(a.instance);check(exists(a.sprite||data.animations[a.id]?.poster||'assets/animals/'+a.id+'.webp'),'Missing sprite '+a.id);if(sid==='rainforest')check(a.feetY-a.h>=.05,'Animal above top '+a.instance);}
}
check(!data.scenes.rainforest.animals.some(a=>a.id==='lemur'),'Lemur still in rainforest');
for(const id of ['musicpiano','musicdrum','musicxylophone','musicharp','musictambourine','musicmaracas','musicguitar'])check(exists(data.recordings[id].path),'Missing instrument recording '+id);
const protectedImages=JSON.parse(fs.readFileSync(path.join(__dirname,'../v8/checkpoints/protected-walk-sha256.json'),'utf8').replace(/^\uFEFF/,''));
for(const image of protectedImages)check(crypto.createHash('sha256').update(fs.readFileSync(image.Path)).digest('hex').toUpperCase()===image.Hash,'Protected walk changed '+image.Path);
for(const file of ['Leonas-Zoo-v8.html','game.js','animal-motion-v7-1.js','chapter-sounds.js']){
 const before=fs.readFileSync(path.join(__dirname,'../v8/checkpoints/00-before-changes',file)),after=fs.readFileSync(path.join(root,file.endsWith('.html')?'':'assets',file));check(before.equals(after),'Original V8 changed '+file);
}
const baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'baseline-v82.json'),'utf8'));
for(const [file,hash] of Object.entries(baseline))check(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')===hash,'V8.2 modified '+file);
for(const sid of data.order){const sc=data.scenes[sid];check(!sc.backgroundHerds?.length&&!sc.decor?.length&&!sc.schools?.length,'Non-editable background creatures remain '+sid);}
const songs=JSON.parse(fs.readFileSync(path.join(root,'assets/audio/v83/songs.json'),'utf8'));
for(const [id,list] of Object.entries(songs)){check(list.length===3,'Missing songs '+id);for(const song of list){check(exists(song.path),'Missing '+song.path);check(song.duration>=10&&song.duration<=20,'Song duration '+song.path);check(song.peak<1&&song.rms>.01,'Song level '+song.path);}}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log('PASS: V8.3 entries and scripts, active assets, 21 songs, editable background objects, scene removal, rainforest bounds, V8.2 preservation, '+protectedImages.length+' protected walk files, and original V8 preservation.');
