import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium } = require('playwright');
const folder = path.resolve('screenshots/v4-12/learning-voices');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = [];
try {
  await Promise.all([true, false].map(async failName => {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(({ failName }) => {
      window.__qaMedia = []; window.__qaCalls = [];
      if (failName) speechSynthesis.getVoices = () => [];
      const play = HTMLMediaElement.prototype.play, seen = new WeakSet();
      HTMLMediaElement.prototype.play = function (...args) {
        if (!seen.has(this)) { seen.add(this); for (const type of ['playing', 'ended', 'error']) this.addEventListener(type, () => __qaMedia.push({ type, src: this.currentSrc || this.src, at: performance.now(), time: this.currentTime, volume: this.volume, mode: this.dataset.mode || null, role: this.dataset.narrator || null })); }
        return play.apply(this, args);
      };
    }, { failName });
    if (failName) await page.route('**/voice/v4-12-names/lion-en-male.mp3', route => route.abort('failed'));
    await page.goto('http://127.0.0.1:4173/geo/?v=4.12-learning-failure-private-qa');
    await page.waitForFunction(() => window.__Animals?.learningStatus && window.LEARNING_V4_12);
    await page.evaluate(() => {
      const play = AnimalCalls.play;
      AnimalCalls.play = function (id, ctx, done) { __qaCalls.push({ id, at: performance.now() }); return play.call(this, id, ctx, done); };
      __Animals.dismissIntro();
    });
    await page.waitForTimeout(650);
    const centreAndTap = async () => {
      await page.evaluate(() => { const e = [...document.querySelectorAll('.animal[data-id="lion"]')].find(e => e.tabIndex === 0), r = e.getBoundingClientRect(); __Animals.camera += r.left + r.width / 2 - innerWidth / 2; });
      await page.waitForTimeout(90);
      const point = await page.evaluate(() => { const e = [...document.querySelectorAll('.animal[data-id="lion"]')].find(e => { const r = e.getBoundingClientRect(); return r.right > 0 && r.left < innerWidth; }), r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      await page.mouse.click(point.x, point.y);
      await page.waitForFunction(() => __Animals.learningStatus().id === 'lion');
    };
    await centreAndTap();
    await page.waitForFunction(() => __Animals.learningStatus().phase === 'complete', null, { timeout: 20000 });
    const first = await page.evaluate(() => ({ status: __Animals.learningStatus(), media: __qaMedia.slice(), calls: __qaCalls.slice(), systemVoices: speechSynthesis.getVoices().map(v => v.name) }));
    await centreAndTap();
    const secondMode = await page.evaluate(() => __Animals.learningStatus().mode);
    if (!failName) await page.waitForFunction(() => __Animals.learningStatus().phase === 'complete', null, { timeout: 30000 });
    else await page.waitForTimeout(120);
    const second = await page.evaluate(() => ({ status: __Animals.learningStatus(), media: __qaMedia.slice(), calls: __qaCalls.slice() }));
    const checks = failName ? {
      simulatedNameFailureReachedBrowser: first.media.some(e => e.type === 'error' && e.src.includes('v4-12-names/lion-en-male.mp3')),
      noMatchingSystemVoices: first.systemVoices.length === 0,
      noAudibleNamePlayback: !first.media.some(e => e.type === 'playing' && e.mode === 'name' && e.volume > 0),
      failedNameNotLearned: first.status.nameLearned === false && !first.status.completedInstances.includes(first.status.instance),
      nextTapRetriesNameAndCall: secondMode === 'name' && second.calls.length === 2,
      noRuntimeErrors: errors.length === 0,
    } : {
      normalNameActuallyPlayedAndEnded: first.media.some(e => e.type === 'playing' && e.mode === 'name' && e.volume > 0 && e.role === 'male') && first.media.some(e => e.type === 'ended' && e.mode === 'name' && e.time > 0),
      normalNameLearned: first.status.nameLearned === true && first.status.completedInstances.includes(first.status.instance),
      nextTapIsIntroduction: secondMode === 'intro' && second.media.some(e => e.type === 'playing' && e.mode === 'intro' && e.volume > 0 && e.role === 'male'),
      noRepeatedCall: second.calls.length === 1,
      noRuntimeErrors: errors.length === 0,
    };
    report.push({ case: failName ? 'failed-name-without-fallback' : 'normal-male-lion-two-taps', first, second, checks, errors });
    console.log(JSON.stringify({ case: report.at(-1).case, checks }));
    await page.screenshot({ path: path.join(folder, `${failName ? 'failed-name-retry' : 'normal-lion-two-taps'}.png`) });
    await page.evaluate(() => __Animals.stopSpeech());
    await page.close();
  }));
} finally {
  await browser.close();
  fs.writeFileSync(path.join(folder, 'review-learning-failure-v4-12.json'), JSON.stringify(report, null, 2));
}
if (report.some(row => Object.values(row.checks).some(value => !value))) process.exitCode = 1;
