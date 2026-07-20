import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const themeArg = process.argv.find((arg) => arg.startsWith('--theme='));
const theme = themeArg?.split('=')[1] === 'dark' ? 'dark' : 'light';
const OUT_DIR = path.join(os.homedir(), 'Downloads', `keegan-fave-1-stamps-${theme}`);
const PAGE_URL = `http://localhost:5173/stamp-svg-batch-export?theme=${theme}`;

fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
});

const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
page.setDefaultTimeout(120_000);

console.log('Opening', PAGE_URL);
await page.goto(PAGE_URL, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__stampBatchExportReady === true);

console.log(`Exporting ${theme} stamps…`);
const results = await page.evaluate(async () => {
  if (typeof window.__runStampBatchExport !== 'function') {
    throw new Error('Batch export runner missing');
  }
  return window.__runStampBatchExport();
});

for (const item of results) {
  const base64 = item.dataUrl.split(',')[1];
  if (!base64) throw new Error(`Missing data for ${item.filename}`);
  const filePath = path.join(OUT_DIR, item.filename);
  fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
  console.log('Wrote', filePath, `(${item.title})`);
}

await browser.close();
console.log(`\nDone — ${results.length} PNGs in ${OUT_DIR}`);
