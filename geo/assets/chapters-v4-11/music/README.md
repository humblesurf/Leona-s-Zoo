# V4.11 music room

The V4.10 classroom is retained through a precise built-in imagegen edit. The xylophone is approximately 25% smaller. A harp stands on the stage and a six-string guitar has its own secure stand. The five original instruments remain in the environment.

`scene.json` supplies seven embedded hit targets, updated bounds, local string lines and pluck locations. The guitar's `hitPolygon` prevents its high neck's rectangular bounds from intercepting clicks on the maracas behind it. The original instrument positions and beat definitions are preserved where possible.

New introductions are in `dialogue.json`; the root integration generates the usual English, Mandarin and Cantonese voice variants.

`audio-recordings.json` lists two **real recorded instruments**, under CC0:

- [FreePats concert harp](https://freepats.zenvoid.org/OrchestralStrings/harp.html), Versilian Studios LLC, performed by K. Smith, assembled by Roberto. Original D4 soft pluck.
- [FreePats Spanish classical guitar](https://freepats.zenvoid.org/Guitar/acoustic-guitar.html), recorded and assembled by Roberto. Original C4 nylon-string pluck.

Source banks and official license pages are preserved under `audio/source`. Only the short MP3s are used by the game. Four recorded plucks are pitch-resampled as D–F#–A–D (harp) or C–E–G–C (guitar), with pitch-preserving stretching disabled. Slow/fast selects beat spacing and soft/strong selects volume.

Artwork uses built-in imagegen mode. `prompts.json` preserves the exact final edit prompt and reference; the source PNG is in `source/background.png`.
