import fs from 'node:fs';
import vm from 'node:vm';
const ctx={window:{}};
for(const f of ['game-data.js','animation-data.js'])vm.runInNewContext(fs.readFileSync('share/runtime-v4/assets/'+f,'utf8'),ctx);
const D=ctx.window.GAME_DIALOGUE,A=ctx.window.ANIMAL_ANIMATIONS;
const newObjects={
 coral:{name:{en:'Coral',yue:'珊瑚',cmn:'珊瑚'},emoji:'🪸',kind:'discovery',fact:{en:'Tiny animals called polyps live together to make a coral colony.',yue:'好多細細隻嘅珊瑚蟲一齊住，變成一叢珊瑚呀。',cmn:'许多小小的珊瑚虫住在一起，组成一丛珊瑚。'}},
 shell:{name:{en:'Clam',yue:'蛤蜊',cmn:'蛤蜊'},emoji:'🐚',kind:'animal',fact:{en:'My two shells open and close. They help protect my soft body.',yue:'我有兩片殼，會打開同合埋，保護軟軟嘅身體呀。',cmn:'我的两片壳会打开和合上，保护软软的身体。'}},
 reeffish:{name:{en:'Reef fish',yue:'小魚',cmn:'小鱼'},emoji:'🐟',kind:'animal',fact:{en:'I swim with my fish friends near the coral reef.',yue:'我同小魚朋友喺珊瑚礁附近一齊游水呀。',cmn:'我和小鱼朋友在珊瑚礁附近一起游泳。'}}
};
const skip=new Set(['capybara','tapir','igloo']);
const records=Object.entries({...D,...newObjects}).filter(([id])=>!skip.has(id)).map(([id,d])=>{
 const a=A[id],isNew=!!newObjects[id];
 let reference='geo/'+(a?.poster||A.dolphin.poster),style='Match the reference character exactly: its softly sculpted shaded volumes or geometric low-poly facets, colours, proportions and small natural eyes. Do not introduce a flat paper-cut style or a new art style.';
 if(id==='tiger'){reference='geo/assets/animation/macaw-poster-v4.webp';style='The macaw reference is STYLE ONLY. Use softly sculpted shaded 3D fur volumes for a Bengal tiger with orange fur, black stripes and white cheeks. No flat paper-cut polygons. Small natural eyes, friendly calm expression.';}
 if(id==='octopus'){reference='geo/assets/animation/dolphin-poster-v4.webp';style='The dolphin reference is STYLE ONLY. Make a natural reddish-brown octopus with softly shaded low-poly 3D volumes, eight muscular tapering arms with suckers, a rounded mantle and small realistic side eyes. No smiling human mouth, no giant eyes, no baby-toy mascot look.';}
 if(isNew)style='The dolphin reference is STYLE ONLY. Use the same softly shaded 3D low-poly material and crisp geometric details. '+({coral:'A rooted peach/pink branching coral colony with visible tiny polyps.',shell:'A natural cream-and-lavender clam with two ribbed shell halves joined at their hinge; never a smiling cartoon face.',reeffish:'One elegant small blue-green reef fish with natural eyes, tail and fins. Side view facing RIGHT.'}[id]);
 const face=id==='reeffish'?1:a?.face||0;
 const motion=isNew?({coral:'Tiny polyps gently extend from the fixed rooted coral branches and then retract. The coral base remains stationary.',shell:'The two hinged shell halves slowly open to reveal the soft mantle, then smoothly close. Both halves stay connected at the hinge in every pose.',reeffish:'A continuous gentle tail-and-fin swimming cycle, side view facing RIGHT.'}[id]):a.label;
 return {id,name:d.name.en,reference,style,motion,face,travel:id==='reeffish'?.38:a?.travel||0,hop:a?.hop||0,loop:a?.loop||id==='reeffish',gripX:a?.gripX,parts:[]};
});
fs.writeFileSync('geo/assets/animation/v4-1/plan.json',JSON.stringify({base:'Version 4, verified against share/runtime-v4',tool:'built-in image_gen',posesPerCharacter:16,records,newObjects},null,2));
console.log(records.length+' characters to animate; 16 authored poses each.');
