/* V6: quadrupeds keep their complete walk drawings. The body is never cut
   apart from the legs. Hippo opens its mouth on the intact painting.
   Elephant keeps its complete drawings too: cutting the trunk out left a hole. */
(function(g){
const hippo=g.ANIMAL_ANIMATIONS.hippo;
if(hippo){
 hippo.walk=false;hippo.rig=true;hippo.cel=null;hippo.sheet=null;hippo.hop=0;
 hippo.travel=0;hippo.duration=2600;hippo.label='张大嘴打招呼';
}
g.WALK_V6={version:'6',mode:'whole-drawings',hippo:'mouth'};
})(window);
