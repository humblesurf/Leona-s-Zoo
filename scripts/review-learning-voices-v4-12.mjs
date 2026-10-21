import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium } = require('playwright');
const folder = path.resolve('screenshots/v4-12/learning-voices');
fs.mkdirSync(folder, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const reports = [];
async function setup() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400 && /voice|audio/.test(r.url())) errors.push(`${r.status()} ${r.url()}`); });
  await page.addInitScript(() => {
    window.__qaMedia = []; window.__qaCalls = []; window.__qaLabels = []; window.__qaCues = [];
    const oscillatorStart = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (...args) { __qaCues.push({ at: performance.now(), frequency: this.frequency.value }); return oscillatorStart.apply(this, args); };
    const seen = new WeakSet(), play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...args) {
      if (!seen.has(this)) {
        seen.add(this);
        for (const type of ['playing', 'ended', 'error']) this.addEventListener(type, () => __qaMedia.push({ type, at: performance.now(), src: this.currentSrc || this.src, volume: this.volume, mode: this.dataset.mode || null, narrator: this.dataset.narrator || null, characterRole: this.dataset.characterRole || null, time: this.currentTime, duration: this.duration, error: this.error?.code || null }));
      }
      __qaMedia.push({ type: 'play-request', at: performance.now(), src: this.currentSrc || this.src, requestedSrc: this.src, volume: this.volume, mode: this.dataset.mode || null });
      return play.apply(this, args);
    };
  });
  await page.goto('http://127.0.0.1:4173/geo/?v=4.12-learning-private-qa');
  await page.waitForFunction(() => window.__Animals?.learningStatus && window.LEARNING_V4_12);
  await page.evaluate(() => {
    const play = AnimalCalls.play;
    AnimalCalls.play = function (id, ctx, done) {
      __qaCalls.push({ id, at: performance.now(), src: CALL_RECORDINGS[id]?.path, duration: CALL_RECORDINGS[id]?.duration });
      return play.call(this, id, ctx, done);
    };
    const observer = new MutationObserver(() => { const t = document.querySelector('.sub-text')?.textContent; if (t && __qaLabels.at(-1)?.text !== t) __qaLabels.push({ at: performance.now(), text: t }); });
    observer.observe(document.getElementById('subtitle'), { subtree: true, childList: true, characterData: true });
    __Animals.dismissIntro();
  });
  await page.waitForTimeout(650);
  return { page, errors };
}
async function language(page, lang) {
  await page.locator('#languageButton').click();
  await page.locator(`#languageMenu [data-language="${lang}"]`).click();
}
async function focusActor(page, id, position = 0) {
  const instance = await page.evaluate(({ id, position }) => {
    const list = [...document.querySelectorAll(`.animal[data-id="${id}"]`)].filter(e => e.tabIndex === 0), el = list[position];
    if (!el) throw new Error(`Missing ${id} instance ${position}`);
    const r = el.getBoundingClientRect(); __Animals.camera += r.left + r.width / 2 - innerWidth / 2;
    return el.dataset.instance;
  }, { id, position });
  await page.waitForTimeout(90);
  return instance;
}
async function tap(page, instance) {
  const point = await page.evaluate(instance => {
    const el = [...document.querySelectorAll(`.animal[data-instance="${instance}"]`)].find(e => { const r = e.getBoundingClientRect(); return r.right > 0 && r.left < innerWidth; });
    const r = el.getBoundingClientRect(); return { x: r.left + r.width * .5, y: r.top + r.height * .5 };
  }, instance);
  await page.mouse.click(point.x, point.y);
  await page.waitForFunction(instance => __Animals.learningStatus().instance === instance, instance);
}
async function complete(page, instance) {
  await page.waitForFunction(instance => { const s = __Animals.learningStatus(); return s.instance === instance && s.phase === 'complete'; }, instance, { timeout: 60000 });
}
async function snapshot(page) { return page.evaluate(() => ({ status: __Animals.learningStatus(), media: __qaMedia.slice(), calls: __qaCalls.slice(), labels: __qaLabels.slice(), cues: __qaCues.slice() })); }
function actualVoiceEvents(row, mode) { return row.media.filter(e => e.type === 'playing' && e.mode === mode && e.volume > 0); }
const cases = [
  { id: 'lion', role: 'male', firstLanguage: 'en', names: ['lion-en-male.mp3'], secondLanguage: 'yue', introSuffixes: ['lion-yue-male.mp3'], resize: true },
  { id: 'lioness', role: 'female', firstLanguage: 'en-yue', names: ['lioness-en-female.mp3', 'lioness-yue.mp3'], secondLanguage: 'en-yue', introSuffixes: ['lioness-en-female.mp3', 'lioness-yue.mp3'] },
  { id: 'lioncub', role: 'child', firstLanguage: 'all', names: ['lioncub-en.mp3', 'lioncub-yue-bright.mp3', 'lioncub-cmn-bright.mp3'], secondLanguage: 'cmn', introSuffixes: ['lioncub-cmn-bright.mp3'], resize: true },
  { id: 'macaw', role: 'female', firstLanguage: 'en', names: ['macaw-en-female.mp3'], secondLanguage: 'en', introSuffixes: ['macaw-en-female.mp3'], checkSecondInstance: true },
];
try {
  await Promise.all(cases.map(async test => {
    const { page, errors } = await setup();
    try {
      if (test.firstLanguage !== 'en') await language(page, test.firstLanguage);
      const instance = await focusActor(page, test.id);
      await tap(page, instance); await complete(page, instance);
      const first = await snapshot(page);
      const firstEnd = await page.evaluate(() => performance.now());
      if (test.resize) { await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(180); }
      if (test.secondLanguage !== test.firstLanguage) await language(page, test.secondLanguage);
      await focusActor(page, test.id); await tap(page, instance); await complete(page, instance);
      const second = await snapshot(page);
      let distinct = null;
      if (test.checkSecondInstance) {
        const secondInstance = await focusActor(page, test.id, 1); await tap(page, secondInstance);
        distinct = await page.evaluate(() => __Animals.learningStatus());
        await page.evaluate(() => __Animals.stopSpeech());
      }
      const firstVoices = actualVoiceEvents(first, 'name'), secondVoices = actualVoiceEvents(second, 'intro').filter(e => e.at > firstEnd);
      const fileMatches = (events, names) => events.length === names.length && events.every((e, i) => e.src.endsWith(names[i]));
      const checks = {
        firstNameOnly: first.status.mode === 'name' && actualVoiceEvents(first, 'intro').length === 0,
        firstNamesAndRolesCorrect: fileMatches(firstVoices, test.names) && firstVoices.every(e => e.characterRole === test.role),
        actualNamesFinished: firstVoices.every(e => first.media.some(f => f.type === 'ended' && f.src === e.src && f.mode === 'name' && f.time > 0)),
        callPlayedOnceBeforeName: first.calls.length === 1 && first.calls[0].at < firstVoices[0]?.at && (first.calls[0].src ? first.media.some(e => e.type === 'playing' && e.src.endsWith(first.calls[0].src) && e.volume > 0) : first.cues.some(e => e.at >= first.calls[0].at && e.at < firstVoices[0]?.at)),
        secondIsIntroWithCorrectRole: second.status.mode === 'intro' && fileMatches(secondVoices, test.introSuffixes) && secondVoices.every(e => e.characterRole === test.role),
        secondHasNoCall: second.calls.length === first.calls.length,
        rememberedSameInstance: second.status.completedInstances.includes(instance),
        independentNextInstance: !distinct || distinct.mode === 'name' && !distinct.completedInstances.includes(distinct.instance),
        noAudioOrRuntimeErrors: errors.length === 0 && second.media.every(e => e.type !== 'error'),
      };
      await page.screenshot({ path: path.join(folder, `${test.id}-${test.resize ? 'phone' : 'desktop'}.png`) });
      reports.push({ test, instance, first, second, distinct, checks, errors });
      console.log(JSON.stringify({ id: test.id, checks }));
    } catch (error) { reports.push({ test, error: error.stack, errors }); console.log(JSON.stringify({ id: test.id, error: error.message })); }
    finally { await page.close(); }
  }));
  const { page, errors } = await setup();
  try {
    const instance = await focusActor(page, 'lion');
    await tap(page, instance);
    await page.waitForTimeout(150); await page.evaluate(() => __Animals.stopSpeech());
    await page.waitForTimeout(1000); const cancelledCall = await snapshot(page);
    await focusActor(page, 'lion'); await tap(page, instance);
    await page.waitForFunction(() => __qaMedia.some(e => e.type === 'playing' && e.mode === 'name' && e.volume > 0));
    await page.waitForTimeout(100); await page.evaluate(() => __Animals.stopSpeech());
    await page.waitForTimeout(1000); const cancelledName = await snapshot(page);
    await focusActor(page, 'lion'); await tap(page, instance); await complete(page, instance);
    const final = await snapshot(page);
    const checks = {
      cancelDuringCallNotRecognized: !cancelledCall.status.completedInstances.includes(instance),
      cancelDuringNameNotRecognized: !cancelledName.status.completedInstances.includes(instance),
      retryStillName: final.status.mode === 'name',
      completedRetryRecognized: final.status.completedInstances.includes(instance),
      eachRetryHasCall: final.calls.length === 3,
      noAudioOrRuntimeErrors: errors.length === 0,
    };
    reports.push({ test: 'cancel-and-retry', instance, cancelledCall, cancelledName, final, checks, errors }); console.log(JSON.stringify({ id: 'cancel-and-retry', checks }));
    const staticRoles = await page.evaluate(() => LEARNING_V4_12.animalIds.map(id => ({ id, role: GAME_DIALOGUE[id].voiceRole,
      instances: Object.values(GAME_SCENES).flatMap(sc => sc.animals.filter(a => a.id === id).map(a => ({ instance: a.instance, role: a.voiceRole }))),
      name: GAME_DIALOGUE[id].nameVoiceVariants,
      intro: GAME_DIALOGUE[id].voiceVariants,
    })));
    const missing = [];
    for (const d of staticRoles) for (const role of new Set([d.role, ...d.instances.map(a => a.role)])) for (const lang of ['en', 'yue', 'cmn']) for (const kind of ['name', 'intro']) {
      const desired = role === 'child' ? lang === 'en' ? 'child' : 'bright' : role;
      const variants = d[kind]?.[lang] || [];
      const performer = v => v.role || (['male', 'female', 'child', 'bright'].includes(v.key) ? v.key : v.path?.includes('-male.') ? 'male' : v.path?.includes('-female.') ? 'female' : v.path?.includes('-bright.') ? 'bright' : lang === 'en' ? 'child' : 'female');
      const voice = variants.find(v => performer(v) === desired);
      if (!voice) missing.push({ id: d.id, role, lang, kind, reason: 'Missing cast' });
      else if (!fs.existsSync(path.resolve('geo', voice.path))) missing.push({ id: d.id, role, lang, kind, path: voice.path, reason: 'Missing file' });
    }
    reports.push({ test: 'static-all-character-casting', characters: staticRoles.length, missing, checks: { allNamesAndIntrosHaveMatchingPerformers: missing.length === 0 } });
    console.log(JSON.stringify({ id: 'static-all-character-casting', characters: staticRoles.length, missing }));
  } finally { await page.close(); }
} finally {
  await browser.close();
  fs.writeFileSync(path.join(folder, 'review-learning-voices-v4-12.json'), JSON.stringify(reports, null, 2));
}
if (reports.some(row => row.error || Object.values(row.checks || {}).some(value => !value))) process.exitCode = 1;
