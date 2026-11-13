(function(g){
 const sprite='assets/animals/v8/pig-flat.png';
 for(const id of ['pig','piglet']){
   g.ANIMAL_ANIMATIONS[id].poster=sprite;
   g.V8_STORYBOARDS[id]={frames:[sprite],order:[0,0,0],hold:450};
 }
 g.GAME_SCENES.farm.animals.forEach(a=>{
  if(a.id==='pig'){a.h=.125;a.sprite=sprite;}
  if(a.id==='piglet'){a.h=a.h>.1?.08:.06;a.sprite=sprite;}
 });
})(window);
