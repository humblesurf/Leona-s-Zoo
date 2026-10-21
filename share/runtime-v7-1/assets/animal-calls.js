/* Real species recordings, with a quiet musical tap cue when no verified recording is supplied. */
(function(global){
'use strict';
const media=new Audio();media.preload='auto';
let timer=null,complete=null,generation=0,nodes=[];
const resolve=p=>global.resolveAsset?global.resolveAsset(p):p;
function stop(){generation++;clearTimeout(timer);media.onended=null;media.onerror=null;media.pause();nodes.forEach(n=>{try{n.stop();}catch(e){}});nodes=[];const cb=complete;complete=null;if(cb)cb();}
function play(id,ctx,onEnded){
stop();const gen=generation;let ended=false;complete=onEnded;
const done=()=>{if(ended||gen!==generation)return;ended=true;clearTimeout(timer);media.onended=null;media.onerror=null;const cb=complete;complete=null;if(cb)cb();};
const rec=(global.CALL_RECORDINGS||{})[id];
if(rec){media.src=resolve(rec.path);media.volume=.7;media.onended=done;media.onerror=done;timer=setTimeout(()=>{media.pause();done();},(rec.duration+3)*1000);media.play().catch(done);return;}
// This is an interface cue, never an invented vocalization or another species' call.
if(ctx&&ctx.state==='running'){
const gain=ctx.createGain(),osc=ctx.createOscillator(),t=ctx.currentTime;osc.type='sine';osc.frequency.setValueAtTime(660,t);osc.frequency.exponentialRampToValueAtTime(880,t+.13);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.035,t+.025);gain.gain.exponentialRampToValueAtTime(.001,t+.18);osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+.2);nodes=[osc];osc.onended=()=>{gain.disconnect();osc.disconnect();};
}timer=setTimeout(done,230);
}
global.AnimalCalls={play,stop,ids:()=>Object.keys(global.GAME_DIALOGUE||{}),kind:id=>(global.CALL_RECORDINGS||{})[id]?'recording':'interaction'};
})(window);
