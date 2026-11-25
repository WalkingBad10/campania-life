import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const OUT = resolve('..', 'qa', 'campania-open-code-1');
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 1512, height: 982 }, deviceScaleFactor: 2 });
await page.addInitScript(() => { try { localStorage.removeItem('campania_life_save_v1'); } catch {} });
await page.goto(process.env.CL_BASE_URL || 'http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: 'NUOVA PARTITA' }).click();
await page.getByRole('button', { name: "INIZIA L'AVVENTURA" }).click();
await page.waitForFunction(() => window.CL && CL.game && CL.game.player && CL.game.map);
// Lo screenshot dell'elemento canvas include gli overlay DOM sovrapposti:
// per il confronto con le foto li nascondiamo esplicitamente.
await page.addStyleTag({ content: '.hud,.mobile-controls,.toasts,#fade{display:none!important}' });
await page.evaluate(() => {
  const CL = window.CL, G = CL.game;
  G.stop();
  if (CL.ui.closeAll) CL.ui.closeAll();
  CL.state.time.day = 1; CL.state.time.min = 720; CL.state.time.total = 0;
  CL.state.weather = 'sole';
  G.drawHud = () => {};
});

const views = [
  ['vl-napoli-guglia-nohud', 'napoli', 36, 30],
  ['vl-napoli-gesu-nohud', 'napoli', 20, 18],
  ['vl-fuorigrotta-nohud', 'fuorigrotta', 26, 25],
  ['vl-fuorigrotta-palme-nohud', 'fuorigrotta', 20, 36],
  ['vl-costiera-nohud', 'costiera', 20, 20]
];
for (const [name, id, tx, ty] of views) {
  await page.evaluate(({ id, tx, ty }) => {
    const CL = window.CL, G = CL.game, T = CL.TILE;
    G.enterMap(id, tx * T + T / 2, ty * T + T / 2, true);
    G.animT = 0;
    CL.camera.snap(G.player);
    G.render();
  }, { id, tx, ty });
  await page.locator('canvas').screenshot({ path: resolve(OUT, `${name}.png`), animations: 'disabled' });
  console.log(name);
}
await browser.close();
