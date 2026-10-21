import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium } = require('playwright');
const folder = path.resolve('screenshots/v4-12/savanna');
fs.mkdirSync(folder, { recursive: true });
const frozenHtml = fs.readFileSync('share/runtime-v4-11/index.html', 'utf8');
const html = frozenHtml.replace('<script src="assets/game.js"></script>', '<script src="/geo/assets/savanna-v4-12.js"></script><script src="assets/game.js"></script>');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = [];
try {
  for (const viewport of [{ width: 1920, height: 1080 }, { width: 844, height: 390 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/share/runtime-v4-11/index.html?savanna-v4-12-qa=1', route => route.fulfill({ contentType: 'text/html', body: html }));
    await page.goto('http://127.0.0.1:4173/share/runtime-v4-11/index.html?savanna-v4-12-qa=1');
    await page.waitForFunction(() => window.__Animals && window.SAVANNA_V4_12);
    await page.evaluate(() => { __Animals.dismissIntro(); __Animals.goScene('savanna'); });
    await page.waitForTimeout(800);
    await page.evaluate(async () => {
      const scene = [...document.querySelectorAll('.animal[data-id="elephant"]')].find(e => e.tabIndex === 0).closest('.panel');
      await Promise.all([...scene.querySelectorAll('img')].map(img => img.decode().catch(() => {})));
    });
    const centre = async instance => {
      await page.evaluate(instance => {
        const element = [...document.querySelectorAll(`.animal[data-instance="${instance}"]`)].find(e => e.tabIndex === 0);
        const rect = element.getBoundingClientRect();
        __Animals.camera += rect.left + rect.width / 2 - innerWidth / 2;
      }, instance);
      await page.waitForTimeout(100);
    };
    const frame = async name => { const file = path.join(folder, `${viewport.width}-${name}.png`); await page.screenshot({ path: file }); return file; };
    const row = await page.evaluate(() => {
      const savanna = GAME_SCENES.savanna;
      const actors = savanna.animals.filter(a => ['elephant', 'elephantcalf', 'crocodile'].includes(a.id)).map(a => {
        const el = [...document.querySelectorAll(`.animal[data-instance="${a.instance}"]`)].find(e => e.tabIndex === 0);
        const r = el.getBoundingClientRect();
        const o = el.querySelector('.orientation').getBoundingClientRect();
        return { ...a, rect: [r.left, r.top, r.width, r.height], orientation: [o.left, o.top, o.width, o.height], clip: getComputedStyle(el.querySelector('.orientation')).clipPath };
      });
      const panel = [...document.querySelectorAll('.animal[data-id="elephant"]')].find(e => e.tabIndex === 0).closest('.panel');
      const scenery = [...panel.querySelectorAll('.distant-animal')];
      return { metadata: SAVANNA_V4_12, sceneScreens: savanna.numScreens,
        removedEverywhere: !document.querySelector('.animal[data-instance="v4-10-crocodile-30"]'),
        farHerds: savanna.backgroundHerds.filter(d => d.herdRevision === '4.12'),
        sceneryCount: scenery.length, sceneryNonInteractive: scenery.every(e => getComputedStyle(e).pointerEvents === 'none' && e.getAttribute('aria-hidden') === 'true' && e.tabIndex === -1),
        actors };
    });
    const shots = [];
    await centre('savanna-elephant-13'); shots.push(await frame('elephant-clear'));
    await centre('v4-12-crocodile-halfwater'); shots.push(await frame('pond'));
    for (const [name, u] of [['herd-lion', .05], ['herd-giraffe', .296], ['herd-buffalo', .8]]) {
      await page.evaluate(u => {
        const elephant = [...document.querySelectorAll('.animal[data-id="elephant"]')].find(e => e.tabIndex === 0);
        const panel = elephant.closest('.panel'), r = panel.getBoundingClientRect();
        __Animals.camera += r.left + parseFloat(panel.style.width) * u - innerWidth / 2;
      }, u);
      await page.waitForTimeout(100); shots.push(await frame(name));
    }
    await centre('v4-12-crocodile-halfwater');
    const hit = await page.evaluate(() => {
      const el = [...document.querySelectorAll('.animal[data-instance="v4-12-crocodile-halfwater"]')].find(e => e.tabIndex === 0);
      const r = el.getBoundingClientRect(); return { x: r.left + r.width * .5, y: r.top + r.height * .3 };
    });
    await page.mouse.click(hit.x, hit.y);
    await page.waitForTimeout(350); shots.push(await frame('pond-activated-350'));
    const zoomClip = await page.evaluate(() => { const el = [...document.querySelectorAll('.animal[data-instance="v4-12-crocodile-halfwater"]')].find(e => e.tabIndex === 0); return { clip: getComputedStyle(el.querySelector('.orientation')).clipPath, canvasCount: el.querySelectorAll('canvas').length, class: el.className }; });
    await page.waitForTimeout(600); shots.push(await frame('pond-activated-950'));
    const checks = {
      removedHiddenCrocodile: row.removedEverywhere,
      farHerdCount: row.farHerds.length === 36,
      noNewForegroundTargets: row.sceneryNonInteractive,
      unchangedSceneLength: row.sceneScreens === 8,
      bankPlusHalfWaterPlusTwoEyes: row.actors.filter(a => a.id === 'crocodile').length === 4,
      submergedClipAllowsZoom: zoomClip.clip === 'inset(-25% -25% 42%)',
      halfWaterRespondsToRealTap: zoomClip.canvasCount > 0,
      noRuntimeErrors: errors.length === 0,
    };
    report.push({ viewport, ...row, zoomClip, checks, shots, errors });
    await page.close();
  }
} finally {
  await browser.close();
  fs.writeFileSync(path.join(folder, 'review-v4-12.json'), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report.map(row => ({ viewport: row.viewport, checks: row.checks,
  actors: row.actors.map(a => ({ id: a.id, instance: a.instance, renderU: a.renderU, rect: a.rect, clip: a.clip })), shots: row.shots })), null, 2));
if (report.some(row => Object.values(row.checks).some(value => !value))) process.exitCode = 1;
