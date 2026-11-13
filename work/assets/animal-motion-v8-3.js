/* V7-1 plays drawn storyboard frames. Each frame is a complete picture.
   Nothing is rotated, scaled, cross-faded, or cut apart at playback. */
(function (g) {
  "use strict";
  if (!g.AnimalAnims) throw new Error("Load animal-motion-v7-1.js after anims.js.");

  const drawn = {
    arcticfox: 3, boa: 3, buffalo: 3, butterfly: 3, calf: 3, chameleon: 3,
    cheetah: 3, chick: 3, clownfish: 3, cow: 3, crab: 3, crocodile: 2,
    dolphin: 3, duck: 3, duckling: 3, elephant: 3, elephantcalf: 3, farmgoose: 3,
    flamingo: 3, frog: 3, gazelle: 3, giraffe: 3, gorilla: 3, hen: 3, hippo: 2,
    hummingbird: 3, jaguar: 3, jellyfish: 3, lamb: 3, lemur: 3, leopard: 3,
    lion: 2, lioncub: 3, lioness: 3, lobster: 3, macaw: 3, meerkat: 3, monkey: 3,
    octopus: 3, orangutan: 3, otter: 3, peacock: 3, penguin: 3, pig: 3, piglet: 3,
    polarbear: 3, pufferfish: 3, reeffish: 3, rhino: 3, seahorse: 3, seal: 3,
    shark: 3, sheep: 3, sloth: 3, starfish: 3, stingray: 3, tiger: 3, toucan: 3,
    turtle: 3, walrus: 3, warthog: 3, whale: 3, zebra: 3
  };
  const blocked = new Set([
    "boa", "buffalo", "butterfly", "chameleon", "cheetah", "clownfish", "crab", "crocodile",
    "dolphin", "elephant", "flamingo", "frog", "gazelle", "giraffe", "gorilla", "hippo",
    "hummingbird", "jaguar", "jellyfish", "leopard", "lion", "lobster", "macaw", "meerkat",
    "monkey", "octopus", "orangutan", "otter", "pufferfish", "rhino", "seahorse", "seal",
    "shark", "sloth", "starfish", "stingray", "tiger", "toucan", "turtle", "warthog", "whale", "zebra",
    "arcticfox", "calf", "chick", "cow", "duck", "duckling", "elephantcalf", "farmgoose",
    "hen", "lamb", "lemur", "lioncub", "lioness", "peacock", "penguin", "pig", "piglet",
    "polarbear", "reeffish", "sheep", "walrus"
  ]);

  Object.keys(drawn).forEach(id => {
    const poster = "assets/animals/v7-1/" + id + "/0.webp?v=steps6";
    const prev = g.ANIMAL_ANIMATIONS[id] || (g.ANIMAL_ANIMATIONS[id] = {});
    prev.poster = poster;
    prev.sheet = null;
    prev.cel = null;
    prev.rig = false;
    prev.walk = false;
    prev.smoothMarine = false;
    for (let i = 0; i < drawn[id]; i++) {
      const img = new Image();
      img.src = "assets/animals/v7-1/" + id + "/" + i + ".webp?v=steps6";
    }
  });

  const active = new Map();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function framesOf(id) {
    const list = [];
    for (let i = 0; i < drawn[id]; i++) list.push("assets/animals/v7-1/" + id + "/" + i + ".webp?v=steps6");
    return list;
  }
  function orderOf(id, n) {
    if (n <= 1) return [0];
    if (n === 2) return [1, 1, 1, 1, 0];
    return [1, 2, 1, 2, 1, 0];
  }
  function stop(el) {
    const run = active.get(el);
    if (!run) return;
    clearTimeout(run.timer);
    run.img.src = run.home;
    run.img.style.filter = run.homeFilter;
    el.classList.remove("acting");
    active.delete(el);
  }
  function play(el, id) {
    if (g.ANIMAL_ANIMATIONS[id] && g.ANIMAL_ANIMATIONS[id].v72Whole) return false;
    if (!el || el.dataset.special === "water-eyes") return blocked.has(id);
    const n = drawn[id];
    if (!n) return blocked.has(id);
    stop(el);
    const img = el.querySelector(".sprite img");
    if (!img) return true;
    const spec = g.V8_STORYBOARDS?.[id];
    const frames = spec?.frames || framesOf(id);
    const order = spec?.order || orderOf(id, n);
    const home = img.getAttribute('src');
    el.classList.add("acting");
    const run = { img, home, homeFilter:img.style.filter, timer: 0 };
    active.set(el, run);
    let step = 0;
    const hold = reduced ? 180 : (spec?.hold || 620);
    const tick = () => {
      if (active.get(el) !== run) return;
      img.src = frames[order[step]];
      const exposure = g.V8_FRAME_EXPOSURE?.[id]?.[order[step]];
      if(exposure !== undefined)img.style.filter = exposure < 1 ? `brightness(${exposure})` : run.homeFilter;
      step += 1;
      if (step < order.length) run.timer = setTimeout(tick, hold);
      else stop(el);
    };
    tick();
    return true;
  }

  const api = g.AnimalAnims;
  const origPlay = api.play.bind(api);
  const origStop = api.stop.bind(api);
  const origStopAll = api.stopAll.bind(api);
  const origIs = api.isActing.bind(api);
  api.play = (el, id) => play(el, id || el?.dataset?.id) ? true : origPlay(el, id);
  api.stop = el => { stop(el); origStop(el); };
  api.stopAll = () => { [...active.keys()].forEach(stop); origStopAll(); };
  api.isActing = el => active.has(el) || origIs(el);
  g.MotionV71 = { version: "7.1-steps6", drawn, stop };
})(window);
