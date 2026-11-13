/* Every animal and decorative sprite is an editable, persistent scene object. */
(function(g){
 'use strict';const S=g.GAME_SCENES,D=g.GAME_DIALOGUE;
 const decorNames={nest:'小鸟与鸟窝',flower:'花朵'};
 for(const sid of g.GAME_SCENE_ORDER){const sc=S[sid];
  for(const [i,d]of [...(sc.backgroundHerds||[]),...(sc.decor||[])].entries()){
   const a={...d,instance:`v83-background-${sid}-${i}`,backgroundObject:true,idle:'none',opacity:1};
   if(!a.id){const name=(a.sprite.match(/([^/]+)\.[^.]+$/)||[])[1]||'decoration';a.id='decor-'+name;D[a.id]={name:{cmn:decorNames[name]||'背景物件',en:decorNames[name]||name,yue:decorNames[name]||name},kind:'decoration'};}
   if(sid==='rainforest'&&a.id==='lemur')a.id='orangutan';
   if(sid==='savanna'&&!a.sprite){a.feetY=Math.max(.65,a.feetY+.13);a.depth=undefined;}
   if(a.id==='decor-nest'){a.bgAnchorX=.289;a.u=.30;a.h=.09;a.feetY=.40;}
   sc.animals.push(a);
  }
  sc.backgroundHerds=[];sc.decor=[];
  for(const [j,school]of (sc.schools||[]).entries())for(let i=0;i<school.count;i++)sc.animals.push({
   id:school.ids?.[i%school.ids.length]||'reeffish',instance:`v83-school-${j}-${i}`,backgroundObject:true,idle:'none',
   u:school.u+(i%4)*.10/(sc.numScreens*1180/820),h:school.scale*(.82+(i%3)*.15),feetY:school.y+Math.floor(i/4)*.075+(i%2)*.025+school.scale,flip:school.direction<0
  });
  sc.schools=[];
  for(const a of sc.animals){a.template=a.instance;if(['duck','duckling'].includes(a.id)){delete a.waterDepth;delete a.pondGroup;delete a.shoreX;a.dryShore=true;a.feetY=.78;a.backgroundObject=true;}}
 }
 // Painted pond birds are now separate objects too, including wrapped tile edges.
 const farm=S.farm,map=g.V83_BACKGROUND_MAP.farm,worldH=farm.numScreens*1180/820,tileH=map.width/map.height;
 for(let tile=0;tile*tileH<worldH;tile++)for(const [i,sourceX]of [1563,1816,1949].entries()){
  const x=tile*tileH+(sourceX%map.width)/map.height;if(x>worldH)continue;
  const instance='v83-pond-bird-'+tile+'-'+i;
  farm.animals.push({id:i===1?'duckling':'duck',instance,template:instance,u:x/worldH,h:i===1?.03:.035,feetY:i===0?.535:.55,flip:i%2===0,backgroundObject:true,idle:'none',habitat:'auto'});
 }
})(window);
