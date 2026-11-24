/* CAMPANIA OPEN CODE 1 — visual exploration harness.
 * Playwright, emulazione dispositivi (NON dispositivi fisici).
 * Esegue: boot, visita di tutte le mappe, screenshot desktop/mobile,
 * metriche canvas e probe di visibilità del giocatore davanti alle facciate.
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');
const OUT = resolve(ROOT, 'qa', 'campania-open-code-1');
const BASE = process.env.CL_BASE_URL || 'http://127.0.0.1:3000/';

const DEVICES = [
  {
    id: 'macbook',
    label: 'MacBook Pro 14" (emulato)',
    viewport: { width: 1512, height: 982 },
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: false,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  },
  {
    id: 'pixel9proxl',
    label: 'Google Pixel 9 Pro XL (emulato — 448x997 @3x)',
    viewport: { width: 448, height: 997 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 9 Pro XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
  }
];

const MAPS = [
  'napoli', 'costiera', 'vesuvio', 'pompei', 'capri', 'bacoli', 'salerno', 'avellino', 'caserta',
  'casa_nonna', 'casa_giocatore', 'appartamento', 'casa_amalfi', 'bottega', 'souvenir',
  'bar', 'pizzeria', 'metro', 'metro2', 'negozio', 'banca', 'clinica', 'ufficio', 'grotta'
];

// Posizioni di probe: davanti a facciate/piani di lavoro dove prima il giocatore poteva essere coperto.
const PROBES = {
  napoli: [[20, 13], [18, 38], [58, 28], [44, 15], [15, 17], [36, 24], [36, 30]],
  bar: [[10, 10]],
  pizzeria: [[15, 11]],
  casa_nonna: [[12, 8]],
  negozio: [[12, 10]],
  banca: [[12, 10]]
};

const METRIC_SCRIPT = `(() => {
  const CL = window.CL, G = CL.game, T = CL.TILE;
  const cv = G.canvas, ctx = cv.getContext('2d');
  const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
  const colors = new Set(); let lum = 0, minL = 255, maxL = 0, edges = 0, n = 0;
  const L = i => 0.2126*d[i] + 0.7152*d[i+1] + 0.0722*d[i+2];
  const w = cv.width, h = cv.height;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y*w+x)*4;
    colors.add(((d[i]>>3)<<10)|((d[i+1]>>3)<<5)|(d[i+2]>>3));
    const l = L(i); lum += l; minL = Math.min(minL,l); maxL = Math.max(maxL,l); n++;
    if (x > 0 && Math.abs(l - L(i-4)) > 18) edges++;
    if (y > 0 && Math.abs(l - L(i-4*w)) > 18) edges++;
  }
  return {
    palette: colors.size,
    edgeDensity: +(edges/(n*2)).toFixed(3),
    contrast: Math.round(maxL-minL),
    luminance: +(lum/n).toFixed(1),
    map: { w: G.map.w, h: G.map.h, zone: G.map.zone },
    npcs: G.entities.filter(e => e instanceof CL.NPC).length,
    vehicles: G.entities.filter(e => e instanceof CL.Vehicle).length
  };
})()`;

async function prepare(page) {
  await page.addInitScript(() => {
    try { localStorage.removeItem('campania_life_save_v1'); } catch {}
  });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'NUOVA PARTITA' }).click();
  await page.getByRole('button', { name: "INIZIA L'AVVENTURA" }).click();
  await page.waitForFunction(() => window.CL && CL.game && CL.game.player && CL.game.map);
  await page.waitForTimeout(250);
  await page.evaluate(() => {
    const CL = window.CL, G = CL.game;
    G.stop();
    if (CL.ui.closeAll) CL.ui.closeAll();
    CL.state.time.day = 1;
    CL.state.time.min = 720;
    CL.state.time.total = 0;
    CL.state.weather = 'sole';
    CL.state.properties = ['monolocale', 'appartamento', 'casa_amalfi', 'bottega'];
    G.animT = 0;
  });
}

async function enterMap(page, id, tileX, tileY) {
  return page.evaluate(({ id, tileX, tileY }) => {
    const CL = window.CL, G = CL.game, T = CL.TILE;
    const m = CL.maps.get(id);
    const x = tileX !== null ? tileX * T + T / 2 : (m.spawn ? m.spawn.x : m.w * T / 2);
    const y = tileY !== null ? tileY * T + T / 2 : (m.spawn ? m.spawn.y : m.h * T / 2);
    G.enterMap(id, x, y, true);
    G.animT = 0;
    CL.camera.snap(G.player);
    G.render();
    return { id: G.map.id, x: G.player.x, y: G.player.y };
  }, { id, tileX: tileX ?? null, tileY: tileY ?? null });
}

async function playerVisibility(page, id, tileX, tileY) {
  return page.evaluate(({ id, tileX, tileY }) => {
    const CL = window.CL, G = CL.game, T = CL.TILE;
    const m = CL.maps.get(id);
    const x = tileX * T + T / 2, y = tileY * T + T / 2;
    G.enterMap(id, x, y, true);
    G.animT = 0;
    CL.camera.snap(G.player);
    const cv = G.canvas, ctx = cv.getContext('2d');
    const grab = () => ctx.getImageData(0, 0, cv.width, cv.height).data.slice();
    G.player.alive = true; G.render(); const shown = grab();
    G.player.alive = false; G.render(); const hidden = grab();
    G.player.alive = true; G.render();
    let diff = 0;
    for (let i = 0; i < shown.length; i += 4) {
      const delta = Math.abs(shown[i]-hidden[i]) + Math.abs(shown[i+1]-hidden[i+1]) + Math.abs(shown[i+2]-hidden[i+2]);
      if (delta > 12) diff++;
    }
    return { map: id, tile: [tileX, tileY], visiblePixels: diff, pass: diff >= 40 };
  }, { id, tileX, tileY });
}

async function runDevice(browser, device) {
  const context = await browser.newContext({
    viewport: device.viewport,
    deviceScaleFactor: device.deviceScaleFactor,
    isMobile: device.isMobile,
    hasTouch: device.hasTouch,
    userAgent: device.userAgent
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push({ type: 'pageerror', text: String(e && e.message || e) }));
  page.on('response', r => { if (r.status() >= 400) errors.push({ type: 'http', text: `${r.status()} ${r.url()}` }); });
  page.on('requestfailed', r => errors.push({ type: 'requestfailed', text: `${r.url()} ${r.failure()?.errorText || ''}` }));
  page.on('console', msg => { if (msg.type() === 'error') errors.push({ type: 'console', text: msg.text(), location: msg.location() }); });
  await prepare(page);
  const debugPanels = await page.locator('.hud-debug').count();

  // Schermata intera del layout responsive, per la revisione umana.
  await page.screenshot({ path: resolve(OUT, `${device.id}-layout.png`), fullPage: true, animations: 'disabled' });

  const metrics = {};
  for (const id of MAPS) {
    await enterMap(page, id);
    metrics[id] = await page.evaluate(METRIC_SCRIPT);
    await page.locator('canvas').screenshot({ path: resolve(OUT, `${device.id}-${id}.png`), animations: 'disabled' });
  }

  const visibility = [];
  for (const [id, spots] of Object.entries(PROBES)) {
    for (const [x, y] of spots) visibility.push(await playerVisibility(page, id, x, y));
  }
  // Dietro la guglia il giocatore deve essere parzialmente coperto; davanti no.
  const behind = visibility.find(v => v.map === 'napoli' && v.tile[0] === 36 && v.tile[1] === 24);
  const front = visibility.find(v => v.map === 'napoli' && v.tile[0] === 36 && v.tile[1] === 30);
  const depthOrder = behind && front ? {
    behind: behind.visiblePixels, front: front.visiblePixels,
    pass: behind.visiblePixels < front.visiblePixels
  } : null;
  await context.close();
  return { device: device.label, errors, debugPanels, metrics, visibility, depthOrder };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-dev-shm-usage'] });
  const results = [];
  try {
    for (const device of DEVICES) results.push(await runDevice(browser, device));
  } finally {
    await browser.close();
  }
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    scope: 'EMULAZIONE Playwright/Chromium. Non sostituisce test su MacBook e Pixel 9 Pro XL fisici.',
    devices: results
  };
  await writeFile(resolve(OUT, 'exploration.json'), JSON.stringify(report, null, 2) + '\n');
  const errors = results.flatMap(r => r.errors.map(e => `${r.device}: ${e.text}`));
  const hidden = results.flatMap(r => r.visibility.filter(v => !v.pass).map(v => `${r.device}: ${v.map} ${v.tile}`));
  const depthFailures = results.filter(r => r.depthOrder && !r.depthOrder.pass)
    .map(r => `${r.device}: guglia dietro ${r.depthOrder.behind} >= davanti ${r.depthOrder.front}`);
  const debugFailures = results.filter(r => r.debugPanels > 0).map(r => `${r.device}: ${r.debugPanels} pannelli debug visibili`);
  console.log(`Visual exploration: ${results.length} devices, ${MAPS.length} maps each`);
  console.log(`Console/page errors: ${errors.length}`);
  console.log(`Player-occlusion failures: ${hidden.length}`);
  console.log(`Natural depth failures: ${depthFailures.length}`);
  console.log(`Debug panel failures: ${debugFailures.length}`);
  if (errors.length) console.log(errors.join('\n'));
  if (hidden.length) console.log(hidden.join('\n'));
  if (depthFailures.length) console.log(depthFailures.join('\n'));
  if (debugFailures.length) console.log(debugFailures.join('\n'));
  if (errors.length || hidden.length || depthFailures.length || debugFailures.length) process.exitCode = 1;
}

main().catch(err => { console.error(err); process.exitCode = 1; });
