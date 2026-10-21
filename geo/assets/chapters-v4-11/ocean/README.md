# V4.11 ocean artwork

Three transparent complete original pose sequences replace the previous styles:

- Octopus: gentle eyes, a natural rounded mantle, attached curling arms, no cartoon grin. Three complete drawings with timed rests and an arm wave.
- Stingray: an oblique side view, both wings and its complete tail visible. Four complete drawings cycle through a gentle fin stroke.
- Lobster: recognizable segmented shell, ordinary small eyes, attached walking legs, two claws and antennae. Three complete drawings with a small claw lift. No exaggerated smiling face.

No image mesh or separated-limb reconstruction is used. Each frame uses the same crop rectangle and genuine source alpha. Source octopus frame 2 is omitted because its mantle crossed a cell boundary; source lobster frame 3 is omitted because its tail anatomy was inconsistent. These unapproved drawings are never referenced by the animation definition. Generated source PNGs are retained only for provenance.

The exact built-in imagegen prompt set is in `prompts.json`, and `manifest.json` records selected source cells, transparent ratios, common crop and timing. `qa.json` records clear poster edges and genuine alpha. Drawings were privately reviewed on an opaque blue background.

`nest.webp` (bird, two eggs and a branch pointing left) and `flower.webp` (tropical flowers with broad leaves) are new decoration sprites for the parent scene integration. `decoration-prompts.json` contains their final built-in prompts.
