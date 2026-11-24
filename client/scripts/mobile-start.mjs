/* CAMPANIA OPEN CODE 1 — avvio mobile con input touch.
 *
 * Verifica il percorso reale dell'utente su Pixel 9 Pro XL emulato:
 * NUOVA PARTITA -> creazione -> ingresso nella prima mappa -> movimento
 * con joystick touch -> salvataggio -> CONTINUA dopo ricaricamento.
 *
 * Usa CL_BASE_URL per testare la build locale o il sito pubblicato.
 */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');
const OUT = resolve(ROOT, 'qa', 'campania-open-code-1');
const BASE = process.env.CL_BASE_URL || 'https://walkingbad10.github.io/campania-life/';
const SAVE_KEY = 'campania_life_save_v1';

const PIXEL = {
  viewport: { width: 448, height: 997 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 9 Pro XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
};

const launchArgs = { headless: true, args: ['--disable-dev-shm-usage'] };
let browser;
try {
  browser = await chromium.launch(launchArgs);
} catch {
  // Alcune installazioni locali hanno solo Chrome di sistema: la CI usa il
  // Chromium bundlato da Playwright.
  browser = await chromium.launch({ ...launchArgs, channel: 'chrome' });
}
const context = await browser.newContext(PIXEL);
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(`pageerror: ${e && e.message || e}`));
page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
page.on('response', r => { if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`); });
page.on('requestfailed', r => errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText || ''}`));

function readState() {
  return page.evaluate(key => {
    const CL = window.CL, G = CL && CL.game;
    let save = null;
    try {
      const raw = localStorage.getItem(key);
      save = raw ? JSON.parse(raw) : null;
    } catch (e) { save = { parseError: String(e) }; }
    return {
      hasGame: !!G,
      map: G && G.map && G.map.id,
      player: G && G.player && { x: Math.round(G.player.x), y: Math.round(G.player.y) },
      api: CL && { ready: CL.api.ready, token: CL.api.token },
      hud: !!document.querySelector('.hud'),
      screenCount: document.querySelectorAll('.screen').length,
      save: save && {
        v: save.v,
        t: save.t,
        map: save.data && save.data.pos && save.data.pos.map,
        x: save.data && save.data.pos && Math.round(save.data.pos.x),
        y: save.data && save.data.pos && Math.round(save.data.pos.y)
      }
    };
  }, SAVE_KEY);
}

async function touchDrag(selector, dx, dy, holdMs) {
  const box = await page.locator(selector).boundingBox();
  assert(box, `element ${selector} is not visible`);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.evaluate(({ x, y }) => {
    const el = document.querySelector('.mc-joy');
    const t = new Touch({ identifier: 7, target: el, clientX: x, clientY: y });
    el.dispatchEvent(new TouchEvent('touchstart', {
      touches: [t], targetTouches: [t], changedTouches: [t], bubbles: true, cancelable: true
    }));
  }, { x, y });
  if (dx || dy) {
    await page.evaluate(({ x, y, dx, dy }) => {
      const el = document.querySelector('.mc-joy');
      const t = new Touch({ identifier: 7, target: el, clientX: x + dx, clientY: y + dy });
      el.dispatchEvent(new TouchEvent('touchmove', {
        touches: [t], targetTouches: [t], changedTouches: [t], bubbles: true, cancelable: true
      }));
    }, { x, y, dx, dy });
  }
  await page.waitForTimeout(holdMs);
  await page.evaluate(({ x, y, dx, dy }) => {
    const el = document.querySelector('.mc-joy');
    const t = new Touch({ identifier: 7, target: el, clientX: x + dx, clientY: y + dy });
    el.dispatchEvent(new TouchEvent('touchend', {
      touches: [], targetTouches: [], changedTouches: [t], bubbles: true, cancelable: true
    }));
  }, { x, y, dx, dy });
}

try {
  await mkdir(OUT, { recursive: true });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.CL && window.CL.game);
  await page.screenshot({ path: resolve(OUT, 'mobile-start-1-title.png'), fullPage: true });

  const before = await readState();
  assert.equal(before.hasGame, true, 'engine is initialised on the title screen');
  assert.equal(before.api.ready, false, 'optional backend is offline in a fresh mobile session');
  assert.equal(before.api.token, null, 'no backend token is required to start');
  assert.equal(before.save, null, 'fresh emulated device has no save');

  // Il bug era qui: un touchend globale con preventDefault impediva la
  // sintesi del click React su tutti i pulsanti dei menu mobile.
  await page.getByRole('button', { name: 'NUOVA PARTITA' }).tap();
  await page.getByText('CREA IL TUO PERSONAGGIO').waitFor({ state: 'visible' });
  await page.screenshot({ path: resolve(OUT, 'mobile-start-2-create.png'), fullPage: true });

  await page.getByRole('button', { name: "INIZIA L'AVVENTURA" }).tap();
  await page.locator('.hud').waitFor({ state: 'visible' });
  await page.locator('.mc-joy').waitFor({ state: 'visible' });
  await page.waitForFunction(() => window.CL && CL.game && CL.game.player && CL.game.map);

  const started = await readState();
  assert.equal(started.map, 'napoli', 'new game enters the first map');
  assert.equal(started.hud, true, 'HUD is visible after starting');
  assert.equal(started.screenCount, 0, 'all title/creation screens are closed');
  assert(started.player, 'player exists in the first map');
  assert.equal(started.save && started.save.v, 1, 'save v1 is written on new game');
  assert.equal(started.save && started.save.map, 'napoli', 'save points to the first map');
  await page.screenshot({ path: resolve(OUT, 'mobile-start-3-game.png'), fullPage: true });

  // Movimento con vero joystick touch: prova le quattro direzioni perché
  // lo spawn può essere vicino a un muro o a una porta.
  let moved = null;
  for (const [dx, dy] of [[0, -34], [34, 0], [0, 34], [-34, 0]]) {
    await touchDrag('.mc-joy', dx, dy, 900);
    const s = await readState();
    if (Math.abs(s.player.x - started.player.x) + Math.abs(s.player.y - started.player.y) > 4) {
      moved = s;
      break;
    }
  }
  assert(moved, 'touch joystick moves the character in the first map');

  await page.evaluate(() => CL.game.save());
  const saved = await readState();
  assert.equal(saved.save && saved.save.v, 1, 'saved object keeps format v1');
  assert.equal(saved.save && saved.save.map, 'napoli', 'saved map is still Napoli');
  assert(Math.abs(saved.save.x - saved.player.x) <= 2 && Math.abs(saved.save.y - saved.player.y) <= 2,
    'saved position matches the moved character');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.CL && window.CL.game);
  await page.screenshot({ path: resolve(OUT, 'mobile-start-4-reload.png'), fullPage: true });
  const continueBtn = page.getByRole('button', { name: 'CONTINUA' });
  assert.equal(await continueBtn.isEnabled(), true, 'CONTINUA is enabled after a saved game');
  await continueBtn.tap();
  await page.locator('.hud').waitFor({ state: 'visible' });
  await page.waitForFunction(() => window.CL && CL.game && CL.game.player && CL.game.map);
  const resumed = await readState();
  assert.equal(resumed.map, saved.save.map, 'CONTINUA returns to the saved map');
  assert(Math.abs(resumed.player.x - saved.player.x) <= 6 && Math.abs(resumed.player.y - saved.player.y) <= 6,
    'CONTINUA restores the saved position');
  await page.screenshot({ path: resolve(OUT, 'mobile-start-5-continue.png'), fullPage: true });

  assert.deepEqual(errors, [], 'no JS, asset, console or network errors during mobile start');
  console.log('Mobile start (Pixel 9 Pro XL emulato): OK');
  console.log(`  base: ${BASE}`);
  console.log(`  ingresso: ${started.map}, giocatore ${started.player.x},${started.player.y}`);
  console.log(`  movimento touch: ${moved.player.x},${moved.player.y}`);
  console.log(`  salvataggio v1: ${saved.save.map} ${saved.save.x},${saved.save.y}`);
  console.log(`  continua: ${resumed.map} ${resumed.player.x},${resumed.player.y}`);
  console.log('  backend opzionale: offline, partita locale giocabile');
} finally {
  await browser.close();
}
