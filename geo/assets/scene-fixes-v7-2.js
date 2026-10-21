/* V7-2 corrections that do not depend on a new walk cycle.
   The fruit market leaves the navigation. The grass hippo joins the pond.
   The whale uses the sharper original drawing at a smaller size.
   The gazelle is one drawing again, and the whole drawing jumps. */
(function (g) {
  "use strict";

  if (Array.isArray(g.GAME_SCENE_ORDER)) {
    g.GAME_SCENE_ORDER = g.GAME_SCENE_ORDER.filter(function (id) { return id !== "market"; });
  }

  const savanna = g.GAME_SCENES && g.GAME_SCENES.savanna;
  if (savanna && savanna.animals) {
    savanna.animals.forEach(function (animal) {
      if (animal.id !== "hippo") return;
      delete animal.dryShore;
      // The current drawing leaves the top half empty, so a deep clip
      // hides the whole animal. 0.2 covers the feet and leaves the head.
      animal.waterDepth = 0.2;
      if (animal.instance === "savanna-hippo-16") {
        animal.u = 0.602;
        animal.h = 0.145;
        animal.feetY = 0.583;
      } else if (animal.feetY > 0.6) {
        animal.feetY -= 0.04;
      }
    });
  }

  const ocean = g.GAME_SCENES && g.GAME_SCENES.ocean;
  if (ocean && ocean.animals) {
    ocean.animals.forEach(function (animal) {
      if (animal.id !== "whale") return;
      animal.h = 0.2;
      animal.maxWidth = 0.42;
    });
  }

  function whole(id, spec) {
    const def = g.ANIMAL_ANIMATIONS && g.ANIMAL_ANIMATIONS[id];
    if (!def) return;
    Object.assign(def, spec, {
      v72Whole: true,
      sheet: null,
      cel: null,
      rig: false,
      walk: false,
      smoothMarine: false,
      zoom: 0,
      stepCount: spec.stepCount || 0
    });
  }

  whole("whale", {
    poster: "assets/animals/whale.webp",
    hop: 0,
    wave: 0.02,
    waveCount: 2,
    travel: 0.16,
    face: -1,
    duration: 2800,
    label: "平稳向前游"
  });

  whole("gazelle", {
    poster: "assets/animals/gazelle.webp",
    hop: 0.28,
    wave: 0,
    travel: 0.36,
    face: 1,
    stepCount: 1,
    duration: 1100,
    label: "向前一跃"
  });

  g.SCENE_FIXES_V72 = { version: "7.2", market: false, whale: "original-700", gazelle: "single-leap" };
})(window);
