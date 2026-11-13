/* V8: small, reviewable placement corrections. Original walk images are untouched. */
(function(g){
  'use strict';
  // These groups are temporarily outside the zoo, per the latest request.
  g.GAME_SCENE_ORDER=g.GAME_SCENE_ORDER.filter(id=>!['polar','space','planets'].includes(id));
  const scene=g.GAME_SCENES.savanna;
  const placements={
    'savanna-lion-0':{h:.31,feetY:.79,u:.041},
    'savanna-lioness-1':{h:.128,feetY:.72,u:.098},
    'savanna-lioncub-2':{h:.085,feetY:.81,u:.075},
    'savanna-cheetah-15':{h:.30,feetY:.87,u:.620},
    'v4-11-savanna-cheetah-30':{h:.16,feetY:.72,u:.594},
    'v4-11-savanna-cheetah-31':{h:.15,feetY:.81,u:.657},
    'savanna-buffalo-22':{u:.846,feetY:.78},
    'savanna-buffalo-23':{u:.887,feetY:.64},
    'v4-10-gazelle-26':{u:.926,feetY:.69},
    'savanna-gazelle-24':{u:.952,feetY:.84},
    'savanna-gazelle-25':{u:.978,feetY:.70},
    'savanna-crocodile-20':{u:.754,h:.14,feetY:.77,dryShore:true,pondGroup:null,shoreX:null},
    'v4-10-crocodile-31':{h:.022,sprite:'assets/animals/v8/crocodile-eyes-waterless.png'},
    'v4-10-crocodile-32':{h:.020,sprite:'assets/animals/v8/crocodile-eyes-waterless.png'},
    'v4-12-crocodile-halfwater':{h:.082}
  };
  scene.animals.forEach(a=>Object.assign(a,placements[a.instance]||{}));
  // These are all gazelles; the smaller animal is the same species.
  g.GAME_DIALOGUE.gazelle.name.cmn='羚羊';
})(window);
