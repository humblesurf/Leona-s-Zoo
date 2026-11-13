/* Complete drawings on a timed exposure sheet. Poses are never blended,
   deformed or reconstructed from cut-out limbs during playback. */
(function(g){
'use strict';
const plans=new WeakMap();
const clamp=x=>Math.max(0,Math.min(1,x));
function prepare(def){
 if(!def?.cel||!def.frames?.length)return null;
 if(plans.has(def))return plans.get(def);
 const cel=def.cel,sequence=cel.sequence,holds=cel.holdsMs;
 if(!Array.isArray(sequence)||!sequence.length||!Array.isArray(holds)||holds.length!==sequence.length) return null;
 let duration=0;const ends=[];
 for(let i=0;i<sequence.length;i++){
  if(!Number.isInteger(sequence[i])||!def.frames[sequence[i]]||!Number.isFinite(holds[i])||holds[i]<=0)return null;
  duration+=holds[i];ends.push(duration);
 }
 let advance;
 if(Array.isArray(cel.advance)&&cel.advance.length===sequence.length){
  advance=[];let previous=0;
  for(const value of cel.advance){
   if(!Number.isFinite(value)||value<previous||value<0||value>1)return null;
   advance.push(value);previous=value;
  }
 }else{
  // Advancing on the same exposures as the drawings avoids a stationary paw
  // skating across the ground while its image is held. Authors can override
  // these positions to match the contact and recovery poses precisely.
  const span=duration-holds.at(-1);
  advance=sequence.map((_,i)=>span?clamp((i?ends[i-1]:0)/span):0);
 }
 const restFrame=Number.isInteger(cel.restFrame)&&def.frames[cel.restFrame]?cel.restFrame:sequence[0];
 const plan={sequence:sequence.slice(),holds:holds.slice(),ends,advance,duration,restFrame,motion:cel.motion||'walk',stages:cel.stages||null,continuousAdvance:cel.continuousAdvance===true};
 plans.set(def,plan);return plan;
}
function sample(plan,elapsedMs,reduced=false){
 if(reduced)return {frame:plan.restFrame,step:0,advance:0,stage:'rest',heldMs:0};
 const time=Math.max(0,Math.min(plan.duration,elapsedMs));
 let lo=0,hi=plan.ends.length-1;
 while(lo<hi){const mid=(lo+hi)>>1;if(time<plan.ends[mid])hi=mid;else lo=mid+1;}
 const heldMs=time-(lo?plan.ends[lo-1]:0),next=Math.min(lo+1,plan.advance.length-1);
 // New authored walks may request smooth whole-character travel. The drawing
 // remains a single intact cel; existing exposure-based motions are unchanged.
 const advance=plan.continuousAdvance?plan.advance[lo]+(plan.advance[next]-plan.advance[lo])*clamp(heldMs/plan.holds[lo]):plan.advance[lo];
 return {frame:plan.sequence[lo],step:lo,advance,stage:plan.stages?.[lo]||null,heldMs};
}
g.CelMotion={prepare,sample};
})(window);
