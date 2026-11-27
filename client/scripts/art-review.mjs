/* CAMPANIA OPEN CODE 1 — revisione artistica ripetibile.
 * Acquisisce le 26 mappe con tempo/meteo/camera fissati, senza HUD, e salva
 * screenshot + metriche. Uso (dalla root del repo):
 *   CL_QA_OUT=qa/campania-open-code-1/art-review/after \
 *   CL_BASE_URL=http://127.0.0.1:4180/campania-life/ \
 *   CL_QA_HOUR=12 CL_QA_HOUR_EXTRA=18 \
 *   node client/scripts/art-review.mjs
 * CL_QA_HOUR2 è un alias di CL_QA_HOUR_EXTRA. CL_QA_FORCE=1 abilita la
 * sovrascrittura esplicita di file già presenti (per default non distruttivo).
 *
 * Output: ORARIO PRINCIPALE in CL_QA_OUT/*.png + report.json (forma identica
 * alla baseline); eventuali orari aggiuntivi in CL_QA_OUT/h<hour>/*.png con il
 * proprio report.json. Il report principale elenca `hours` e `captures`.
 * Non modifica salvataggi né sorgenti; è solo harness di confronto visivo. */
import { chromium } from '@playwright/test';
import { access, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const fromEnv = (value, fallback) => value ? resolve(process.cwd(), value) : fallback;
const OUT = fromEnv(process.env.CL_QA_OUT, resolve(ROOT, 'qa', 'campania-open-code-1', 'art-review'));
const BASE = process.env.CL_BASE_URL || 'http://127.0.0.1:3000/';
const FORCE = /^(1|true|yes)$/i.test(process.env.CL_QA_FORCE || '');
const VIEWPORT = { width: 1512, height: 982 };
const DPR = 2;

const MAPS = [
  'napoli', 'costiera', 'vesuvio', 'pompei', 'capri', 'bacoli', 'salerno', 'avellino', 'caserta',
  'fuorigrotta', 'pianura',
  'casa_nonna', 'casa_giocatore', 'appartamento', 'casa_amalfi', 'bottega', 'souvenir',
  'bar', 'pizzeria', 'metro', 'metro2', 'negozio', 'banca', 'clinica', 'ufficio', 'grotta'
];

const NO_HUD_CSS = [
  '#viewport-frame > *:not(canvas)',
  '.hud', '.mobile-controls', '.toasts', '#toasts', '#fade',
  '.screen', '.panel', '.dialogue', '.phone-menu', '.confirm'
].map(s => `${s}{display:none!important;visibility:hidden!important;opacity:0!important}`).join('\n');

function readHour(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || !String(raw).trim()) return fallback;
  const hour = Number(String(raw).trim());
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new Error(`${name} deve essere un'ora intera 0..23 (ricevuto: ${raw})`);
  }
  return hour;
}

function hoursFromEnv() {
  const primary = readHour('CL_QA_HOUR', 12);
  const hours = [primary];
  for (const name of ['CL_QA_HOUR_EXTRA', 'CL_QA_HOUR2']) {
    const extra = readHour(name, null);
    if (extra !== null && !hours.includes(extra)) hours.push(extra);
  }
  return hours;
}

const HOURS = hoursFromEnv();
const PRIMARY = HOURS[0];
const runDir = hour => hour === PRIMARY ? OUT : join(OUT, `h${hour}`);

async function exists(path) {
  try { await access(path); return true; }
  catch { return false; }
}

// Guardia anti-sovrascrittura: baseline e catture precedenti restano intatte.
const targets = [];
for (const hour of HOURS) {
  const dir = runDir(hour);
  targets.push(join(dir, 'report.json'), ...MAPS.map(id => join(dir, `${id}.png`)));
}
const conflicts = [];
for (const target of targets) if (await exists(target)) conflicts.push(target);
if (conflicts.length && !FORCE) {
  throw new Error(
    `Output già presente (${conflicts.length} file, es. ${conflicts.slice(0, 3).join(', ')}).\n` +
    'Scegli una nuova CL_QA_OUT oppure imposta CL_QA_FORCE=1 per sovrascrivere esplicitamente.'
  );
}

const captureInfo = {
  viewport: VIEWPORT,
  deviceScaleFactor: DPR,
  noHud: true,
  weather: 'sole',
  camera: 'fissata sullo spawn della mappa, animT=0'
};

let browser;
try {
  const launch = { headless: true, args: ['--disable-dev-shm-usage'] };
  try { browser = await chromium.launch({ ...launch, channel: 'chrome' }); }
  catch { browser = await chromium.launch(launch); }

  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: DPR });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.addInitScript(() => { try { localStorage.removeItem('campania_life_save_v1'); } catch {} });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'NUOVA PARTITA' }).click();
  await page.getByRole('button', { name: "INIZIA L'AVVENTURA" }).click();
  await page.waitForFunction(() => window.CL && CL.game && CL.game.player && CL.game.map);
  await page.addStyleTag({ content: NO_HUD_CSS });

  const captures = [];
  for (const hour of HOURS) {
    const dir = runDir(hour);
    await mkdir(dir, { recursive: true });
    // Tempo/meteo/camera fissati e loop fermato: nessuna dipendenza dal frame reale.
    await page.evaluate(h => {
      const CL = window.CL, G = CL.game;
      G.stop();
      if (CL.ui.closeAll) CL.ui.closeAll();
      CL.state.time.day = 1; CL.state.time.min = h * 60; CL.state.time.total = h * 60;
      CL.state.weather = 'sole';
      // La verifica visiva deve poter entrare negli immobili non ancora
      // acquistati: il blocco e' una regola di gioco, non una limite grafico.
      for (const id of ['casa_giocatore', 'appartamento', 'casa_amalfi', 'bottega']) {
        if (CL.state.properties.indexOf(id) < 0) CL.state.properties.push(id);
      }
      if (CL.ui.takeToasts) CL.ui.takeToasts();
      G.animT = 0;
      G.drawHud = () => {};
      if (G.particles && G.particles.draw) G.particles.draw = () => {};
    }, hour);

    const maps = [];
    for (const id of MAPS) {
      const metrics = await page.evaluate(({ id, hour }) => {
        const CL = window.CL, G = CL.game;
        const m = CL.maps.get(id);
        G.enterMap(id, m.spawn.x, m.spawn.y, true);
        G.animT = 0;
        CL.camera.snap(G.player);
        G.render();
        const cv = G.canvas, x = cv.getContext('2d');
        const d = x.getImageData(0, 0, cv.width, cv.height).data;
        const colors = new Set(); let lum = 0, edges = 0, n = 0;
        const L = i => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
        for (let y = 0; y < cv.height; y++) for (let px = 0; px < cv.width; px++) {
          const i = (y * cv.width + px) * 4;
          colors.add(((d[i] >> 3) << 10) | ((d[i + 1] >> 3) << 5) | (d[i + 2] >> 3));
          const l = L(i); lum += l; n++;
          if (px > 0 && Math.abs(l - L(i - 4)) > 18) edges++;
          if (y > 0 && Math.abs(l - L(i - cv.width * 4)) > 18) edges++;
        }
        return {
          id, hour, zone: m.zone, size: `${m.w}x${m.h}`,
          npcs: G.entities.filter(e => e instanceof CL.NPC).length,
          vehicles: G.entities.filter(e => e instanceof CL.Vehicle).length,
          decors: (m.decors || []).length,
          facades: [...new Set((m.decors || []).filter(d => /facade|palazzo|metric/.test(d.type)).map(d => d.data?.type || d.type))],
          palette: colors.size,
          edgeDensity: +(edges / (n * 2)).toFixed(3),
          luminance: +(lum / n).toFixed(1)
        };
      }, { id, hour });
      await page.locator('canvas').screenshot({ path: join(dir, `${id}.png`), animations: 'disabled' });
      maps.push(metrics);
      console.log(`h${hour} ${id}: ${metrics.zone} ${metrics.size} NPC=${metrics.npcs} decor=${metrics.decors} palette=${metrics.palette}`);
    }

    const runReport = { base: BASE, hour, errors: [...errors], maps, capture: captureInfo };
    if (hour !== PRIMARY) await writeFile(join(dir, 'report.json'), JSON.stringify(runReport, null, 2));
    captures.push({ hour, dir: relative(OUT, dir) || '', maps, errors: [...errors] });
  }

  const report = { base: BASE, hour: PRIMARY, errors: [...errors], maps: captures[0].maps, capture: captureInfo };
  if (HOURS.length > 1) {
    report.hours = HOURS;
    report.captures = captures;
  }
  await writeFile(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
} finally {
  if (browser) await browser.close();
}
