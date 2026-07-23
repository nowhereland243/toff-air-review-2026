import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function capture() {
  console.log('Launching Puppeteer browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });

  const targetUrl = 'http://localhost:3000/2026?artist=akkaya-berk';
  console.log(`Navigating to ${targetUrl} ...`);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });

  await new Promise(r => setTimeout(r, 2000));

  const outPath = path.resolve(__dirname, '..', 'artist_modal_screenshot.png');
  await page.screenshot({ path: outPath, fullPage: false });
  console.log(`SUCCESS: Saved artist modal screenshot to ${outPath}`);
  await browser.close();
}

capture().catch(err => {
  console.error('Screenshot error:', err);
  process.exit(1);
});
