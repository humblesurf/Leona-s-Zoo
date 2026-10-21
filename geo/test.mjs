import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'screenshots');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1180, height: 820 } });
await page.goto('file://' + path.join(__dirname, 'index.html'));
await page.waitForTimeout(900);

const broken = await page.evaluate(() =>
  [...document.querySelectorAll('img')].filter(i => !i.complete || i.naturalWidth===0).map(i => i.src)
);
console.log('broken', broken.length, broken.slice(0,8));

async function shot(name) {
  await page.screenshot({ path: path.join(OUT, name), type: 'jpeg', quality: 85 });
  console.log('shot', name);
}

// savanna s4
await page.evaluate(() => { window.__Animals.goScene('savanna'); window.__Animals.camera = 3 * window.__Animals.screenW(); });
await page.waitForTimeout(400);
await shot('fix-s4.jpg');
await page.evaluate(() => window.__Animals.activate('rhino'));
await page.waitForTimeout(800);
await shot('fix-s4-tap-rhino.jpg');

// ocean o3
await page.evaluate(() => { window.__Animals.goScene('ocean'); window.__Animals.camera = window.__Animals.camera + 2 * window.__Animals.screenW(); });
// goScene sets to start; then add 2 screens
await page.evaluate(() => {
  window.__Animals.goScene('ocean');
  const sw = window.__Animals.screenW();
  // find ocean start then +2
  let acc=0; const order=['savanna','ocean','rainforest'];
  // simpler:
  window.__Animals.goScene('ocean');
});
await page.evaluate(() => {
  // set camera to ocean screen 2 (0-index)
  const sw = window.__Animals.screenW();
  // savanna is 5 screens first
  window.__Animals.camera = 5*sw + 2*sw;
});
await page.waitForTimeout(400);
await shot('fix-o3.jpg');
await page.evaluate(() => window.__Animals.activate('jellyfish'));
await page.waitForTimeout(800);
await shot('fix-o3-tap-jelly.jpg');

// rainforest r4, r5
await page.evaluate(() => {
  const sw = window.__Animals.screenW();
  window.__Animals.camera = 10*sw + 3*sw; // rainforest screen 3 = r4
});
await page.waitForTimeout(400);
await shot('fix-r4.jpg');
await page.evaluate(() => window.__Animals.activate('jaguar'));
await page.waitForTimeout(800);
await shot('fix-r4-tap-jaguar.jpg');

await page.evaluate(() => {
  const sw = window.__Animals.screenW();
  window.__Animals.camera = 10*sw + 4*sw;
});
await page.waitForTimeout(400);
await shot('fix-r5.jpg');
await page.evaluate(() => window.__Animals.activate('tiger'));
await page.waitForTimeout(800);
await shot('fix-r5-tap-tiger.jpg');

const counts = await page.evaluate(() => ({
  panels: document.querySelectorAll('.panel').length,
  animals: document.querySelectorAll('.animal').length,
  scene: window.__Animals.sceneAt(),
}));
console.log(counts);
await browser.close();
console.log('PLAYWRIGHT OK');
