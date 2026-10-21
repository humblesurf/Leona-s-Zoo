# V4.11 illustrated animal originals

Production assets were generated with the built-in `image_gen.imagegen` tool. No AI video, mesh deformation, limb cutouts or pose morphing are used in these six characters. Complete drawings and their transparent silhouettes remain intact.

- `tiger`: eight staggered four-leg running drawings, repainted in broader matte low-poly facets. V4.7 gait sequence, holds, travel and orientation are inherited unchanged. Whole-source row registration restores the original shoulder height after the style edit.
- `gazelle` is the retained internal ID for the new **small deer**: a hornless fawn, with soft ivory spots and no antelope flank stripe or pointed horns. Six standing, anticipation, takeoff, flight, landing and standing drawings inherit the V4.10 leap plan. The first and last drawings have naturally extended legs.
- `boa`: four complete green low-poly originals with rest, neck lift, tongue flick and intermediate neck pose. The V4.10 observe cadence is retained.
- `crocodile`: four gentle adult sunbathing originals with a longer snout, modest eyes, simplified olive scutes and a few small teeth. The V4.10 basking cadence is retained. Calibrated lower-row camera origins keep planted feet level when the jaw opens.
- `crocodile-eyes.webp`: a matching calm submerged head and back, with soft waterline ripples.
- `lemur`: four black-and-white ruffed lemur drawings on a small fallen branch. It waves, places one hand forward and returns to its perch. Its black tail is not ringed. Lower-row camera registration keeps the branch near its resting level.
- `peacock`: four folded, partially spread, fully spread and returning-train originals. The full display is held for 1.3 seconds. The shared camera preserves bird size as the fan opens.

`source/selected.json` and `source/selected-new.json` retain generated-image provenance and production registration; `source/prompts.json` and the prompts inside `source/selected-new.json` contain the exact final prompt set. Original PNGs are saved beside them. `packaging.json` records component bounds, alpha margins, complete-pose hashes, viewport crops and exposure plans. Source crops are calibrated by whole atlas rows; no body part is altered by the packaging code.

`dialogue-new.json` supplies English, Cantonese and Mandarin text for lemur and peacock. Their facts and markings were checked against the Smithsonian National Zoo, linked in `sources.json`.

Private runtime evidence is in `review/runtime.json` and `review/rainforest-runtime.json`, together with desktop and mobile screenshots. The first checks real-time RAF playback of all eight tiger, six deer, four boa and four crocodile frames. The second checks all new lemur and peacock poses plus monkey, otter, butterfly and macaw placements on the live integrated source page. No intermediate artwork needs to be shown to the child or user.

Reproduce packaging with `node scripts/package-animal-styles-v4-11.mjs`. Runtime tests are `node scripts/review-animal-styles-v4-11.mjs` and `node scripts/review-rainforest-styles-v4-11.mjs` while the local preview server is running.
