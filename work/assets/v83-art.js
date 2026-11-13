(function(g){
 const changed=['shark','hen','duck','duckling','hippo','crocodile'];
 g.ANIMAL_ANIMATIONS.tiger.poster='assets/animals/v83/tiger-0.png';g.V8_STORYBOARDS.tiger={frames:['assets/animals/v83/tiger-0.png','assets/animals/v83/tiger-paw.png'],order:[0,1,1,1,0],hold:340};
 for(const id of changed){g.ANIMAL_ANIMATIONS[id].poster=`assets/animals/v83/${id}.png`;g.V8_STORYBOARDS[id]={frames:[`assets/animals/v83/${id}.png`],order:[0,0,0,0],hold:480};}
 for(const sid of g.GAME_SCENE_ORDER)for(const a of g.GAME_SCENES[sid].animals){
  if(changed.includes(a.id)){a.sprite=`assets/animals/v83/${a.id}.png`;a.idle='none';}
  if(a.id==='tiger'){a.sprite='assets/animals/v83/tiger-0.png';a.h=.19;}
  if(a.id==='sloth'){a.gripX=.16;a.gripY=.46;}
  if(['hippo','crocodile'].includes(a.id)){
   a.habitat='auto';delete a.waterDepth;delete a.submerged;
   if(a.special==='water-eyes'){a.h=.06;delete a.special;}
   if(a.id==='hippo'){a.h*=.78;a.feetY=.548;}
   if(a.id==='crocodile'&&a.pondGroup){a.feetY=.552;a.h=.045;const shore={'v4-10-crocodile-31':.74,'v4-10-crocodile-32':.84,'v4-12-crocodile-halfwater':.94};a.shoreX=shore[a.instance]??a.shoreX;}if(a.id==='crocodile'&&a.dryShore)a.h=.065;
  }
 }
 g.V83Water={
  supports:id=>['hippo','crocodile','duck','duckling'].includes(id),
  state(a,sid,left,vh){
   if(!this.supports(a.id))return {wet:false,cut:0};
   const sc=g.GAME_SCENES[sid],y=a.feetY,x=g.V83Background.sourceX(sid,left,vh,y);
   const poly=sid==='savanna'?[[.553,.548],[.614,.526],[.695,.511],[.798,.504],[.883,.519],[.946,.542],[.945,.566],[.82,.58],[.68,.573],[.58,.563]]:sid==='farm'?[[.64,.534],[.72,.51],[.88,.513],[.965,.546],[.925,.575],[.75,.567]]:[];
   let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++)if((poly[i][1]>y)!==(poly[j][1]>y)&&x<(poly[j][0]-poly[i][0])*(y-poly[i][1])/(poly[j][1]-poly[i][1])+poly[i][0])inside=!inside;
   const wet=a.habitat==='water'||(a.habitat!=='land'&&inside);return {wet,cut:wet?(a.id==='crocodile'?.43:a.id==='hippo'?.45:.25):0};
  }
 };
})(window);
