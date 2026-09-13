import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'quiz-reel-factory.html');
const questionsPath = path.join(root, 'output/questions.txt');
const outputMp4 = path.join(root, 'output/reel.mp4');

if (!fs.existsSync(questionsPath)) {
  console.error("output/questions.txt not found. Run npm run generate:questions first");
  process.exit(1);
}

const questions = fs.readFileSync(questionsPath, 'utf-8');
console.log("Launching browser...");

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ acceptDownloads: true });
const page = await context.newPage();

await page.goto(`file://${htmlPath}`);
await page.waitForSelector('#questionsInput', { timeout: 15000 });
console.log("Factory loaded");

await page.evaluate((q) => {
  const el = document.getElementById('questionsInput');
  el.value = q;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}, questions);

await page.waitForFunction(() => {
  const el = document.getElementById('countInfo');
  return el && el.textContent.includes('question');
}, { timeout: 10000 });

await page.waitForTimeout(3000);
console.log("Exporting...");

await page.click('#exportBtn');
await page.waitForSelector('#downloadBtn:not([hidden])', { timeout: 180000 });
await page.waitForFunction(() => {
  const el = document.getElementById('statusEl');
  return el && el.dataset.kind === 'ok';
}, { timeout: 180000 });

console.log("Downloading...");
const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 30000 }),
  page.click('#downloadBtn')
]);

const tmpPath = await download.path();
fs.copyFileSync(tmpPath, outputMp4);
console.log(`Saved to ${outputMp4} - ${(fs.statSync(outputMp4).size / 1024 / 1024).toFixed(2)} MB`);
await browser.close();
