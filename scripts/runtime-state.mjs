import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

// Data overlays are evaluated in the order used by each frozen release.
// Renderers are intentionally excluded; they require a live browser.
const dataFiles = new Set([
  'game-data.js', 'animation-data.js', 'authored-motion-data.js',
  'exploration-data.js', 'exploration-motion.js', 'chapters-data.js',
  'revisions-data.js', 'animal-fixes-v4-10.js', 'revisions-v4-11.js',
  'animal-styles-v4-11.js', 'ocean-styles-v4-11.js', 'farm-goose-v4-11.js',
  'motion-v4-11.js', 'hoof-motion-v4-12.js', 'walk-v4-13.js',
  'calls-data.js', 'exploration-calls.js', 'calls-v4-11.js',
  'chapter-sounds.js', 'savanna-v4-12.js', 'learning-v4-12.js',
]);

export function loadRuntimeState(directory) {
  const html = fs.readFileSync(path.join(directory, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  const styles = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(m => m[1]);
  const context = { window: {} };
  for (const file of scripts) {
    if (dataFiles.has(path.basename(file))) {
      vm.runInNewContext(fs.readFileSync(path.join(directory, file), 'utf8'), context, { filename: file });
    }
  }
  return { state: context.window, html, scripts, styles };
}

export const walkingIds = [
  'zebra', 'rhino', 'buffalo', 'warthog', 'elephant', 'elephantcalf',
  'lioness', 'lioncub', 'arcticfox', 'cow', 'sheep', 'pig', 'calf', 'lamb', 'piglet',
];

export function collectMedia(state) {
  const { GAME_SCENES: scenes, GAME_DIALOGUE: dialogue, ANIMAL_ANIMATIONS: animations } = state;
  const ids = new Set(Object.values(scenes).flatMap(s => s.animals.map(a => a.id)));
  const calls = new Set([...ids].map(id => dialogue[id].callId || id).filter(id => state.CALL_RECORDINGS[id]));
  const intros = new Set([...ids].flatMap(id => Object.values(dialogue[id].voiceVariants).flatMap(v => v.map(x => x.path))));
  const words = new Set([...ids].filter(id => dialogue[id].learningMode).flatMap(id => Object.values(dialogue[id].nameVoiceVariants).flatMap(v => v.map(x => x.path))));
  const media = new Set(['assets/fonts/fredoka.ttf', 'assets/animation/support-tree-v4.webp', 'assets/animation/v4-2/acacia.webp']);
  for (const scene of Object.values(scenes)) {
    for (const section of scene.sections || [scene]) for (const bg of section.bgPanels || [section.bgStrip]) media.add(bg);
    media.add(scene.ambience);
    for (const decor of [...(scene.decor || []), ...(scene.backgroundHerds || [])]) media.add(decor.sprite || animations[decor.id].poster);
    for (const animal of scene.animals) {
      media.add(animal.sprite || animations[animal.id].poster);
      if (animations[animal.id].sheet) media.add(animations[animal.id].sheet);
    }
    for (const school of scene.schools || []) for (const id of school.ids || ['reeffish']) media.add(animations[id].poster);
  }
  for (const [id, object] of Object.entries({ ...state.EXPLORATION_OBJECTS, ...state.CHAPTER_OBJECTS }).filter(([id]) => ids.has(id))) {
    for (const layer of Object.values(object.extraLayers || {})) media.add(typeof layer === 'string' ? layer : layer.path);
  }
  for (const file of [...intros, ...words]) media.add(file);
  for (const id of calls) media.add(state.CALL_RECORDINGS[id].path);
  return { ids, calls, intros, words, media };
}
