# V4.9 chapter audio

Prepared with `scripts/prepare-chapter-audio-v4-9.py`. Runtime assets are 24 kHz mono MP3s with gentle gain normalization and short boundary fades. Original pitch is retained in the stored recorded samples. Piano and xylophone runtime playback resamples four beats into A–B–C♯–B and C5–D5–E5–D5 respectively (`playbackRate` 1, 1.122462, 1.259921, 1.122462; pitch preservation disabled). This gives real notes from the actual recorded instrument timbre. Light/heavy interaction changes playback volume only, without changing the selected notes or rhythmic intervals.

There are six 36-second chapter beds and seven interaction samples. Every finished MP3 is fully decoded and checked for finite, non-silent signal; results are in `validation.json`. Every sample's source, author, license, excerpt, and modifications are in `recordings.json` and the calls manifest.

## Real CC0 instrument samples

- Piano: [Tuning a piano](https://bigsoundbank.com/tuning-a-piano-s2696.html), Pierre SIBANARCO. An isolated upright-piano A strike from the initial correctly tuned first string.
- Small drum: [Snare drum #5](https://bigsoundbank.com/snare-drum-5-s2308.html), Joseph SARDIN. One wooden drumstick strike.
- Tambourine: [Tambourine](https://bigsoundbank.com/tambourine-s0463.html), Joseph SARDIN. One isolated action from a small wooden tambourine.
- Maracas: [Maraca #1](https://bigsoundbank.com/maraca-1-s2527.html), Joseph SARDIN. One shake.
- Xylophone: [FreePats Xylophone](https://freepats.zenvoid.org/ChromaticPercussion/xylophone.html), samples by Versilian Studios LLC; bank assembled by roberto@zenvoid.org. Actual wood-bar C5, medium mallet, soft dynamic (`C5_pp.flac`). It is not a glockenspiel, phone ringtone, or metal-bar imitation.

## Ambience and original cues

- Beach: [Small Waves, Froth and Beach](https://bigsoundbank.com/petites-vagues-ecume-et-plage-s1447.html), Joseph SARDIN, CC0. Used for the beach bed and `beachwave` short shoreline interaction.
- Weather: [Wind in a Tree](https://bigsoundbank.com/wind-in-a-tree-s0659.html), Joseph SARDIN, CC0.
- Hong Kong: existing verified [Gulls on the Harbor](https://bigsoundbank.com/gulls-on-the-harbor-s2573.html), Joseph SARDIN, CC0. A generic waterfront atmosphere, explicitly **not** represented as a field recording made in Hong Kong.
- Music room: project-original very quiet musical underscore, allowing the selected instrument to remain dominant.
- Planet exploration: project-original soft music, not described as the physical sound of the vacuum of space.
- Supermarket: project-original gentle interior ventilation and sparse, soft checkout beeps, with no human voices.
- Tram: project-original two-chime bell cue, not represented as a recording of a Hong Kong tram.

`chapter-sounds.js` loads after `animal-calls.js`. It adds metadata and wraps only the five musical instruments in four-beat playback. Slow has 680 ms between strikes, fast has 320 ms. Soft/strong volumes are 0.30/0.65, both below the existing 0.70 playback ceiling. Stop clears all pending beats and live audio before returning. Other objects and animals delegate to the existing caller. `resolveAsset` is honored for offline games.
