import { chromium } from './node_modules/playwright-core/index.mjs';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const out = new URL('./results/', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
await mkdir(out, { recursive: true });
const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
const context = browser.contexts()[0];
const page = context.pages().find(p => p.url().startsWith('http://127.0.0.1:5173')) || await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.setViewportSize({ width: 1440, height: 1000 });
await page.goto('http://127.0.0.1:5173/');
await page.waitForFunction(() => document.querySelector('canvas')?.dataset.artwork === 'ready', { timeout: 60000 });
await page.getByRole('button', { name: 'Export 10s clip' }).waitFor();
await page.screenshot({ path: `${out}/desktop.png` });
console.log('Desktop artwork ready; captured screenshot.');
console.log('Font loaded:', await page.evaluate(() => document.fonts.check('400 76px "Recorded Newsreader"')));
const state = await page.evaluate(() => ({ artwork: document.querySelector('canvas').dataset.artwork, videoEncoder: typeof VideoEncoder, canvasSize: [document.querySelector('canvas').width, document.querySelector('canvas').height] }));
console.log(JSON.stringify(state));
for (const name of ['a', 'b']) {
  const watch = setInterval(async () => {
    try { console.log(name + ': ' + await page.getByRole('button').innerText()); } catch {}
  }, 15000);
  const downloadPromise = page.waitForEvent('download', { timeout: 300000 });
  await page.getByRole('button', { name: 'Export 10s clip' }).click();
  const download = await downloadPromise;
  await download.saveAs(`${out}/${name}.mp4`);
  clearInterval(watch);
  await page.getByText('Saved to your Downloads folder as', { exact: false }).waitFor();
  console.log(name + ': exported ' + download.suggestedFilename());
}
await copyFile(`${out}/a.mp4`, 'C:/Users/Lenovo/Downloads/build-sprint-passport-recording.mp4');
const sha = name => createHash('sha256').update(readFileSync(`${out}/${name}.mp4`)).digest('hex');
console.log('SHA256 a:', sha('a'));
console.log('SHA256 b:', sha('b'));
console.log('Files bit-identical:', sha('a') === sha('b'));
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: `${out}/mobile.png` });
const mobile = await page.getByRole('button', { name: 'Export 10s clip' }).boundingBox();
console.log('Mobile button bounds:', JSON.stringify(mobile));
await page.setViewportSize({ width: 1440, height: 1000 });
await page.screenshot({ path: `${out}/desktop-after.png` });
await writeFile(`${out}/report.json`, JSON.stringify({ state, errors, identical: sha('a') === sha('b'), shaA: sha('a'), shaB: sha('b'), mobile }, null, 2));
console.log('Browser errors:', JSON.stringify(errors));
await browser.close();
