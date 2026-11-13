/* V6.2: quadrupeds no longer use reconstructed legs or IK.
   Their complete-body authored cel plans are loaded after legacy motion data
   and are the only locomotion path used by anims.js. Keep this compatibility
   marker so older diagnostics can report the intentional architecture. */
(function(g){
  'use strict';
  g.QuadrupedWalkV6Disabled = true;
  g.QuadrupedMotionMode = 'authored-whole-body';
})(window);
