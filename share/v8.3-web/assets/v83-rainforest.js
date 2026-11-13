/* Use the visible branch in each complete sprite as its real attachment point. */
(function(g){
 const sc=g.GAME_SCENES.rainforest;
 const grips={sloth:.47,monkey:.048,orangutan:.14,toucan:.72,macaw:.56,leopard:.65,boa:.67,chameleon:.74};
 sc.animals=sc.animals.map(a=>a.id==='lemur'?{...a,id:'orangutan',instance:'v8-rainforest-orangutan-2',h:.25,feetY:.46,idle:'none',support:'branch',special:'hanging',voiceRole:'female'}:a);
 sc.animals.forEach(a=>{
  if(a.id==='frog'){a.h*=1.5;a.feetY=Math.min(a.feetY,.92);}
  if(a.id==='chameleon')a.h=.205;
  if(a.id==='tiger'){a.h=.32;a.u=.932;}
  if(a.id==='orangutan'&&a.u>.9){a.u=.971;a.h=.27;a.feetY=.45;}
  if(grips[a.id]!==undefined){a.gripY=grips[a.id];a.gripX=.5;a.support='branch';a.idle='none';a.feetY=Math.max(a.feetY,a.h+.11);}
 });
 const extras=[
  ['frog',.065,.145,.88],['butterfly',.147,.09,.73],
  ['hummingbird',.353,.12,.63],['frog',.405,.13,.91],
  ['butterfly',.528,.10,.61],['frog',.724,.14,.90],
  ['butterfly',.816,.09,.63],['hummingbird',.902,.12,.49]
 ];
 extras.forEach(([id,u,h,feetY],i)=>sc.animals.push({id,u,h,feetY,instance:'v8-rainforest-extra-'+i,flip:i%2===0,idle:'none',...(id==='frog'?{support:'leaf'}:{})}));
})(window);
