/* V4.9 instrument samples and cues. Metadata loads before runtime so offline builders can collect every path. */
(function(global){
'use strict';
global.CHAPTER_CALL_RECORDINGS={"musicpiano":{"id":"musicpiano","title":"Tuning a piano","author":"Pierre SIBANARCO","source":"https://bigsoundbank.com/tuning-a-piano-s2696.html","download":"https://bigsoundbank.com/UPLOAD/mp3/2696.mp3?v=d","license":"CC0 1.0","licenseUrl":"https://creativecommons.org/publicdomain/zero/1.0/","copyright":"Pierre SIBANARCO","extractStart":0.07,"modifications":"One complete isolated strike/shake excerpt; original pitch, gentle amplitude normalization, short edge fades.","type":"recording","playbackRates":[1,1.122462,1.259921,1.122462],"pitchPreservation":false,"runtimeNotes":"Four beats resample the original recorded A as A, B, C-sharp, B. Stored source pitch is retained. Pitch-preserving time stretch is disabled; light/heavy changes only volume.","path":"assets/calls/v4-9/musicpiano.mp3","duration":0.7,"rms":0.09387478977441788,"peak":0.5225321650505066},"musicdrum":{"id":"musicdrum","title":"Snare drum #5","author":"Joseph SARDIN","source":"https://bigsoundbank.com/snare-drum-5-s2308.html","download":"https://bigsoundbank.com/UPLOAD/mp3/2308.mp3?v=d","license":"CC0 1.0","licenseUrl":"https://creativecommons.org/publicdomain/zero/1.0/","copyright":"Joseph SARDIN","extractStart":0.015,"modifications":"One complete isolated strike/shake excerpt; original pitch, gentle amplitude normalization, short edge fades.","type":"recording","path":"assets/calls/v4-9/musicdrum.mp3","duration":0.48,"rms":0.054589200764894485,"peak":0.6200000047683716},"musictambourine":{"id":"musictambourine","title":"Tambourine","author":"Joseph SARDIN","source":"https://bigsoundbank.com/tambourine-s0463.html","download":"https://bigsoundbank.com/UPLOAD/mp3/0463.mp3?v=d","license":"CC0 1.0","licenseUrl":"https://creativecommons.org/publicdomain/zero/1.0/","copyright":"Joseph SARDIN","extractStart":1.255,"modifications":"One complete isolated strike/shake excerpt; original pitch, gentle amplitude normalization, short edge fades.","type":"recording","path":"assets/calls/v4-9/musictambourine.mp3","duration":0.56,"rms":0.04029510170221329,"peak":0.6200000047683716},"musicmaracas":{"id":"musicmaracas","title":"Maraca #1","author":"Joseph SARDIN","source":"https://bigsoundbank.com/maraca-1-s2527.html","download":"https://bigsoundbank.com/UPLOAD/mp3/2527.mp3?v=d","license":"CC0 1.0","licenseUrl":"https://creativecommons.org/publicdomain/zero/1.0/","copyright":"Joseph SARDIN","extractStart":0.01,"modifications":"One complete isolated strike/shake excerpt; original pitch, gentle amplitude normalization, short edge fades.","type":"recording","path":"assets/calls/v4-9/musicmaracas.mp3","duration":0.53,"rms":0.03216917812824249,"peak":0.6200000047683716},"musicxylophone":{"title":"Wooden xylophone C5, medium mallet, soft dynamic","author":"Versilian Studios LLC; FreePats bank assembled by roberto@zenvoid.org","source":"https://freepats.zenvoid.org/ChromaticPercussion/xylophone.html","download":"https://freepats.zenvoid.org/ChromaticPercussion/Xylophone1/Xylophone-MediumMallets-SFZ%2BFLAC-20200706.tar.gz","license":"CC0 1.0","licenseUrl":"https://creativecommons.org/publicdomain/zero/1.0/","copyright":"Versilian Studios LLC / FreePats","type":"recording","originalFile":"C5_pp.flac","modifications":"Single wood-bar C5 note; leading silence removed, gentle amplitude normalization and tail fade; original pitch.","playbackRates":[1,1.122462,1.259921,1.122462],"pitchPreservation":false,"runtimeNotes":"Four beats resample the original recorded C5 as C5, D5, E5, D5. Stored source pitch is retained. Pitch-preserving time stretch is disabled; light/heavy changes only volume.","id":"musicxylophone","path":"assets/calls/v4-9/musicxylophone.mp3","duration":0.72,"rms":0.09475533664226532,"peak":0.3975471258163452},"hktram":{"title":"Original gentle ding-ding tram bell cue","author":"Project-authored modal bell sound design","source":"scripts/prepare-chapter-audio-v4-9.py","license":"Project original","type":"original-sound-design","description":"Two clear chimes for the tram interaction; not a recording of a Hong Kong tram.","id":"hktram","path":"assets/calls/v4-9/hktram.mp3","duration":1.25,"rms":0.07999955470601625,"peak":0.40407246173403244},"beachwave":{"id":"beachwave","title":"Small wave and shore foam excerpt","author":"Joseph SARDIN","source":"https://bigsoundbank.com/petites-vagues-ecume-et-plage-s1447.html","download":"https://bigsoundbank.com/UPLOAD/mp3/1447.mp3?v=d","license":"CC0 1.0","licenseUrl":"https://creativecommons.org/publicdomain/zero/1.0/","copyright":"Joseph SARDIN","type":"recording","extractStart":17,"modifications":"Three-second original-pitch wave excerpt, gentle amplitude normalization and fades.","path":"assets/calls/v4-9/beachwave.mp3","duration":3.0,"rms":0.09340661764144897,"peak":0.48659399151802063}};
Object.assign(global.CHAPTER_CALL_RECORDINGS,global.REVISION_CALL_RECORDINGS||{});
global.CALL_RECORDINGS=global.CALL_RECORDINGS||{};
Object.assign(global.CALL_RECORDINGS,global.CHAPTER_CALL_RECORDINGS);
if(typeof global.Audio!=='function'||!global.AnimalCalls)return;
const original=global.AnimalCalls, instruments=new Set(['musicpiano','musicdrum','musicxylophone','musictambourine','musicmaracas','musicguitar','musicharp']);
const resolve=p=>global.resolveAsset?global.resolveAsset(p):p;
let generation=0,timers=new Set(),media=new Set(),complete=null,last=null;const clicks=new Map();
function interval(){const value=global.ChapterObjects?.tempo;return (value==='fast'||value===.32||value===320)? .32 : .68;}
function weight(){return global.ChapterObjects?.weight==='strong'?'strong':'soft';}
function duration(id){const rec=global.CHAPTER_CALL_RECORDINGS[id],step=interval();return instruments.has(id)?Math.max(4*step,3*step+(rec?.duration||.7)+.02):(rec?.duration||0);}
function cleanup(){for(const t of timers)clearTimeout(t);timers.clear();for(const a of media){a.onended=null;a.onerror=null;a.pause();a.remove();try{a.currentTime=0;}catch(e){}}media.clear();}
function stop(){generation++;cleanup();if(last)last.playing=false;const callback=complete;complete=null;original.stop();if(callback)callback();}
function schedule(fn,delay){const timer=setTimeout(()=>{timers.delete(timer);fn();},delay);timers.add(timer);}
function play(id,ctx,onEnded){
 stop();
 if(!instruments.has(id)){original.play(id,ctx,onEnded);return;}
 const gen=generation,rec=global.CHAPTER_CALL_RECORDINGS[id],step=interval(),strength=weight(),volume=strength==='strong'?.65:.30;
 const started=performance.now();last={id,tempo:step,weight:strength,volume,started,beats:[],duration:duration(id),playing:true};complete=onEnded;
 const done=()=>{if(gen!==generation)return;cleanup();if(last)last.playing=false;const cb=complete;complete=null;if(cb)cb();};
 if(global.__Animals?.muted){done();return;}
 const count=Math.min(5,(clicks.get(id)||0)+1);clicks.set(id,count);const song=count>=2&&count<=4?global.V83_SONGS?.[id]?.[count-2]:null;
 last.click=count;last.mode=song?'song':'sample';last.song=song?.title||null;
 if(song){
  const audio=new global.Audio(resolve(song.path));audio.preload='auto';audio.volume=strength==='strong'?.75:.55;audio.hidden=true;audio.dataset.instrument=id;audio.dataset.musicMode='song';audio.dataset.song=String(count-1);audio.dataset.click=String(count);
  document.getElementById('zooApp').append(audio);media.add(audio);last.duration=song.duration;
  audio.onended=done;audio.onerror=done;audio.play().catch(done);return;
 }
 const beat=index=>{
  if(gen!==generation||global.__Animals?.muted)return;
  const audio=new global.Audio(resolve(rec.path));audio.preload='auto';audio.volume=volume;
  audio.hidden=true;audio.dataset.instrument=id;document.getElementById('zooApp').append(audio);
  audio.dataset.musicMode='sample';audio.dataset.click=String(count);
  const playbackRate=rec.playbackRates?.[index]||1;audio.playbackRate=playbackRate;
  if(rec.pitchPreservation===false){audio.preservesPitch=false;audio.webkitPreservesPitch=false;}
  media.add(audio);
  audio.onended=()=>{audio.onended=null;audio.onerror=null;media.delete(audio);audio.remove();};
  audio.onerror=()=>{audio.onended=null;audio.onerror=null;media.delete(audio);audio.remove();};
  last.beats.push({index,time:(performance.now()-started)/1000,volume,playbackRate,preservesPitch:audio.preservesPitch});
  global.dispatchEvent(new CustomEvent('chapter-instrument-beat',{detail:{id,index,interval:step,weight:strength,playbackRate}}));
  audio.play().catch(()=>{media.delete(audio);});
 };
 beat(0);for(let i=1;i<4;i++)schedule(()=>beat(i),i*step*1000);
 schedule(done,duration(id)*1000+30);
}
global.ChapterSounds={beatDuration:interval,duration,stop,inspect:()=>last?{...last,beats:last.beats.map(b=>({...b})),activeMedia:media.size,pendingTimers:timers.size}:null};
global.AnimalCalls={
 ...original,play,stop,
 kind:id=>instruments.has(id)?'instrument-recording':original.kind(id),
 ids:()=>[...new Set([...original.ids(),...Object.keys(global.CHAPTER_CALL_RECORDINGS)])]
};
})(window);

