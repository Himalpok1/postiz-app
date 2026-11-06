import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'chrome' });
let failed = false;
try {
  for (const width of [320, 390, 768, 1440, 1920]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      deviceScaleFactor: 1,
    });
    await page.goto('http://localhost:8088', { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      for (const img of document.images) img.loading = 'eager';
      await Promise.all(
        [...document.images].map((i) => i.decode().catch(() => {}))
      );
      await document.fonts.ready;
    });
    const result = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      missing: [...document.images]
        .filter((i) => !i.naturalWidth)
        .map((i) => i.src),
      headings: [...document.querySelectorAll('h2')].map((e) => e.textContent),
      overflow: [...document.querySelectorAll('main *')]
        .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
        .slice(0, 8)
        .map((e) => e.className),
    }));
    if (
      result.scrollWidth > width ||
      result.missing.length ||
      result.overflow.length
    )
      failed = true;
    console.log(JSON.stringify(result));
    if (width === 390 || width === 1440) {
      await fs.mkdir('/tmp/postvix-homepage-review', { recursive: true });
      await page.screenshot({
        path: `/tmp/postvix-homepage-review/home-${width}.png`,
        fullPage: true,
      });
    }
    await page.close();
  }
} finally {
  await browser.close();
}
if (failed) process.exitCode = 1;
