/* Opaque forward tiles. No reflected panoramas or broad alpha masks. */
(function(g){
 'use strict';
 document.documentElement?.classList.add('zoo-v8');
 for(const scene of Object.values(g.GAME_SCENES)){
   scene.bgMirror=false;
   scene.sectionBlend=0;
   for(const part of scene.sections||[])part.bgMirror=false;
 }
 for(const id of ['savanna','rainforest','farm','ocean']){
   const scene=g.GAME_SCENES[id];
   const map=g.V83_BACKGROUND_MAP[id];scene.bgAspect=map.width/map.height;
   scene.bgPanels=['assets/bg/v83/'+id+'-forward.png'];
   scene.bgFit='fill';
   scene.pondCentre=(scene.pondCentre??.65)*map.sourceWidth/map.width;
   for(const a of [...scene.animals,...(scene.decor||[])])for(const key of ['bgAnchorX','shoreX'])if(Number.isFinite(a[key]))a[key]=(a[key]*map.sourceWidth%map.width)/map.width;
 }
 g.V83Background={sourceX(sid,left,vh,y){const m=g.V83_BACKGROUND_MAP[sid];if(!m)return ((left/vh/3)%1+1)%1;let x=((left*m.height/vh)%m.width+m.width)%m.width;const row=Math.max(0,Math.min(m.height-1,Math.round(y*m.height)));if(x<m.seam[row])x+=m.width;return x/m.sourceWidth;}};
})(window);
