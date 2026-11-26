/* Benchmark scena reale: misura il loop Canvas2D sulla build pubblicata.
 * Uso: node scripts/perf-benchmark.mjs [url]
 * Non modifica salvataggi né screenshot; stampa solo metriche rAF. */
import { chromium } from '@playwright/test';

const BASE = process.argv[2] || 'https://walkingbad10.github.io/campania-life/';
const PIXEL = {
  viewport: { width: 448, height: 997 }, deviceScaleFactor: 3,
  isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 9 Pro XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
};

const measure = () => new Promise(resolve => {
  const d = []; let last = performance.now(), n = 0;
  const tick = now => {
    d.push(now - last); last = now;
    if (++n < 240) requestAnimationFrame(tick);
    else {
      const s = d.slice(2).sort((a, b) => a - b);
      const avg = s.reduce((a, b) => a + b, 0) / s.length;
      const p95 = s[Math.floor(s.length * 0.95)];
      resolve({
        frames: s.length,
        avgMs: +avg.toFixed(2),
        p95Ms: +p95.toFixed(2),
        maxMs: +s[s.length - 1].toFixed(2),
        fps: +(1000 / avg).toFixed(1),
        dropped: s.filter(x => x > 20).length,
        canvas: (() => { const c = document.querySelector('canvas'); return c ? `${c.width}x${c.height}` : 'none'; })(),
        map: window.CL && CL.game && CL.game.map && CL.game.map.id
      });
    }
  };
  requestAnimationFrame(tick);
});

let browser;
try {
  const args = { headless: true, args: ['--disable-dev-shm-usage'] };
  try { browser = await chromium.launch(args); }
  catch { browser = await chromium.launch({ ...args, channel: 'chrome' }); }
  const ctx = await browser.newContext(PIXEL);
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.CL && window.CL.game);
  await page.getByRole('button', { name: 'NUOVA PARTITA' }).tap();
  await page.getByRole('button', { name: "INIZIA L'AVVENTURA" }).tap();
  await page.locator('.hud').waitFor({ state: 'visible' });
  await page.waitForFunction(() => window.CL.game.player && CL.game.map);

  const idle = await page.evaluate(measure);
  await page.keyboard.down('ArrowRight');
  const moving = await page.evaluate(measure);
  await page.keyboard.up('ArrowRight');

  console.log(JSON.stringify({ base: BASE, idle, moving }, null, 2));
} finally {
  if (browser) await browser.close();
}
