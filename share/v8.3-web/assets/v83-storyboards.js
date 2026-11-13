/* Only the two upright, near-identical giraffe poses participate in chewing.
   Frame 2 bends the head to the ground, so it is deliberately never played. */
window.V8_STORYBOARDS={giraffe:{order:[0,1,0,1,0,1,0],hold:430}};
window.GAME_SCENES.savanna.animals.filter(a=>a.id==='giraffe').forEach(a=>a.idle='none');
