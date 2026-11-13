/* V7: the animals on screen are the first version's flat drawings.
   Species that V1 did not have use new drawings in that same style.
   Later restyle sheets stay on disk, but they are not the picture the child sees. */
(function (g) {
  const original = [
    "boa", "buffalo", "butterfly", "chameleon", "cheetah", "clownfish", "crab", "crocodile",
    "dolphin", "elephant", "flamingo", "frog", "gazelle", "giraffe", "gorilla", "hippo",
    "hummingbird", "jaguar", "jellyfish", "leopard", "lion", "lobster", "macaw", "meerkat",
    "monkey", "octopus", "orangutan", "otter", "pufferfish", "rhino", "seahorse", "seal",
    "shark", "sloth", "starfish", "stingray", "tiger", "toucan", "turtle", "warthog", "whale", "zebra"
  ];
  const drawn = [
    "arcticfox", "calf", "chick", "cow", "duck", "duckling", "elephantcalf", "farmgoose",
    "hen", "lamb", "lemur", "lioncub", "lioness", "peacock", "penguin", "pig", "piglet",
    "polarbear", "reeffish", "sheep", "walrus"
  ];
  const eyes = "assets/animals/v7/crocodile-eyes.webp";

  function useDrawing(id, poster) {
    const prev = g.ANIMAL_ANIMATIONS[id] || (g.ANIMAL_ANIMATIONS[id] = {});
    prev.poster = poster;
    prev.sheet = null;
    prev.cel = null;
    prev.rig = false;
    prev.walk = false;
    prev.object = false;
    prev.smoothMarine = false;
    prev.chapter = false;
    prev.exploration = false;
    prev.hop = 0.07;
    prev.face = 0;
    prev.travel = 0;
    prev.loop = false;
    prev.fps = 8;
    prev.duration = 900;
    prev.frames = [{ x: 0, y: 0, w: 8, h: 8, dx: 0, dy: 0 }];
    prev.viewport = { w: 8, h: 8 };
    prev.label = "V1 flat drawing";
  }

  original.forEach(id => useDrawing(id, "assets/animals/" + id + ".webp"));
  drawn.forEach(id => useDrawing(id, "assets/animals/v7/" + id + ".webp"));

  Object.values(g.GAME_SCENES || {}).forEach(scene => {
    (scene.animals || []).forEach(animal => {
      if (animal.sprite && String(animal.sprite).indexOf("crocodile-eyes") >= 0) animal.sprite = eyes;
    });
  });

  g.ANIMAL_STYLES_V7 = { version: "7", base: "4.12", original: original.length, drawn: drawn.length };
})(window);
