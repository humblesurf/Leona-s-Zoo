# V4.11 animal gesture originals

Generated with the built-in `image_gen` tool. Full prompts are saved in `prompts.json` and `goose/prompt.json`; unmodified generated PNGs are kept under `source/` and `goose/source/`.

- Male lion: six complete painted poses, seven timed exposures. The muzzle lifts, jaw opens into a gentle roar, then closes. Its planted paws remain on one ground line. No walking renderer or mesh deformation is involved.
- Polar bear: six complete painted poses, eight timed exposures. The bear sits, stands on its hind paws, then settles back. Whole-image registration keeps its hind-paw support point fixed.
- Giraffe: the existing shoulder/neck/head browsing gesture is retained. A small painted lower-jaw layer follows both parent joints and opens/closes at a steady 0.85 Hz during chewing. A dark interior closes the mouth seam; branch leaves remain supplied by the existing tree.
- Whale: the original faceted painting remains stable. Its tail uses small continuous rigid joint angles, with smooth forward gliding and gentle body drift over 5.2 seconds. The previous inconsistent 16-image rapid loop is no longer used.
- Jellyfish: the original painting remains stable. The tentacle group sways continuously under the bell; a subtle bell pulse accompanies slow vertical drifting. No mesh deformation is used.
- Arctic fox: the existing complete original contact drawings remain. Alternating moving exposures are equal in length, surrounded by prepare/settle holds.
- Farm goose: four complete floating originals, six timed exposures, continuously gliding between them. No legs appear above the waterline. English, Cantonese and Mandarin each have three saved neural voice variants.

The goose call is a real farm goose recording, [A squeaking goose by antique98](https://freesound.org/people/antique98/sounds/160686/), released under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). The public high-quality preview and source license page are retained in `goose/source/`. The shipped WAV preserves its original pitch and duration, mixes it to mono, normalizes gently and adds short edge fades.

`scripts/package-motion-v4-11.mjs` and `scripts/package-goose-motion-v4-11.mjs` reproduce the complete-image packaging. `scripts/review-motion-v4-11.mjs` checks 101 timeline samples for each of seven animals at desktop and mobile landscape sizes, verifies canvas clipping/empty frames and continuous joint movement, and decodes the ten goose audio assets. Internal contact sheets and the machine-readable report are saved in `qa/`. `scripts/review-pond-family-motion-v4-11.mjs` captures real scene placement and waterlines independently of the animation check.
