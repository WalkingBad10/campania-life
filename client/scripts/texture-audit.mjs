/* CAMPANIA OPEN CODE 1 — texture audit.
 * Verifica che le facciate siano disegnate alla dimensione metrica attesa e
 * che nessuna facciata M1 lasci campate vuote ai lati. Controlla inoltre che
 * tutti i PNG distribuiti siano effettivamente referenziati dal motore.
 */
import { chromium } from '@playwright/test';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');
const QA = resolve(ROOT, 'qa', 'campania-open-code-1');
const PIXELS = resolve(ROOT, 'client', 'public', 'assets', 'pixel');
const BASE = process.env.CL_BASE_URL || 'http://127.0.0.1:3000/';

const EXPECTED = {
  gesu: [448, 248], palazzo_ne: [288, 160], palazzo_sw: [224, 128],
  palazzo_banca: [160, 128], palazzo_bar: [128, 128], palazzo_se: [128, 128],
  palazzo_e: [160, 80],
  fuorigrotta_blocco: [192, 144], fuorigrotta_torre: [160, 240],
  fuorigrotta_teatro: [560, 280], fuorigrotta_mostra: [320, 160],
  fuorigrotta_stadio: [208, 160],
  pianura_chiesa: [320, 248], pianura_borgo: [160, 112],
  pianura_municipio: [312, 200],
  bacoli_terme: [312, 144], bacoli_castello: [288, 176],
  bacoli_casa: [128, 96],
  caserta_reggia: [384, 224], salerno_arechi: [224, 128], salerno_palazzo: [160, 96]
};

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', e => errors.push(String(e && e.message || e)));
page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: 'NUOVA PARTITA' }).click();
await page.getByRole('button', { name: "INIZIA L'AVVENTURA" }).click();
await page.waitForFunction(() => window.CL && CL.art && CL.art.buildingSprite);
await page.waitForFunction(() => Object.keys(window.CL.art.images).length >= 50, null, { timeout: 15000 });

const facades = await page.evaluate((expected) => {
  const out = [];
  for (const [kind, [ew, eh]] of Object.entries(expected)) {
    const img = CL.art.buildingSprite(kind);
    if (!img) { out.push({ kind, error: 'sprite mancante', pass: false }); continue; }
    const w = img.width, h = img.height;
    const d = img.getContext('2d').getImageData(0, 0, w, h).data;
    const L = (x, y) => { const i = (y * w + x) * 4; return .2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2]; };
    const col = [];
    for (let x = 0; x < w; x++) {
      let n = 0;
      for (let y = 0; y < h; y++) {
        const l = L(x, y);
        if ((x + 1 < w && Math.abs(l - L(x + 1, y)) > 20) ||
            (y + 1 < h && Math.abs(l - L(x, y + 1)) > 20)) n++;
      }
      col.push(n);
    }
    const core = col.slice(Math.floor(w / 4), Math.ceil(3 * w / 4)).reduce((a, b) => a + b, 0) /
      (Math.ceil(3 * w / 4) - Math.floor(w / 4));
    const quiet = core * .35;
    let left = 0;
    for (let x = 1; x < w && col[x] < quiet; x++) left++;
    let right = 0;
    for (let x = w - 2; x > 0 && col[x] < quiet; x--) right++;
    out.push({
      kind, width: w, height: h, expected: [ew, eh],
      leftQuietPx: left, rightQuietPx: right,
      maxQuietPx: Math.max(12, Math.round(w * 0.12)),
      pass: w === ew && h === eh && left <= Math.max(12, w * 0.12) && right <= Math.max(12, w * 0.12)
    });
  }
  return {
    facades: out,
    loadedImages: Object.keys(CL.art.images).sort(),
    loadedFiles: Object.values(CL.art.images)
      .map(img => String(img.src || '').split('/').pop())
      .filter(Boolean)
      .sort(),
    worldScale: CL.WORLD_SCALE,
    pxPerM: CL.PX_PER_M
  };
}, EXPECTED);

await browser.close();

const artSource = await readFile(resolve(PIXELS, '..', '..', '..', 'src', 'game', 'art.js'), 'utf8');
const referenced = [...new Set([...artSource.matchAll(/'([^']+\.png)'/g)].map(m => m[1]))].sort();
const publicPngs = (await readdir(PIXELS)).filter(f => f.endsWith('.png')).sort();
const unreferenced = publicPngs.filter(f => !referenced.includes(f));
const missing = referenced.filter(f => !publicPngs.includes(f));
const missingLoaded = referenced.filter(f => !facades.loadedFiles.includes(f));

const report = {
  ok: errors.length === 0 && unreferenced.length === 0 && missing.length === 0 &&
      missingLoaded.length === 0 && facades.facades.every(f => f.pass),
  errors,
  referencedPngs: referenced.length,
  publicPngs: publicPngs.length,
  unreferencedPublicPngs: unreferenced,
  missingPublicPngs: missing,
  missingLoadedImages: missingLoaded,
  scale: { pxPerM: facades.pxPerM, worldScale: +facades.worldScale.toFixed(4) },
  facades: facades.facades
};

await mkdir(QA, { recursive: true });
await writeFile(resolve(QA, 'texture-audit.json'), JSON.stringify(report, null, 2));
console.log(`Texture audit — ${report.ok ? 'OK' : 'FAIL'}`);
console.log(`PNG distribuiti: ${report.publicPngs}, referenziati: ${report.referencedPngs}, inutilizzati: ${unreferenced.length}`);
console.log(`Facciate senza campate vuote: ${report.facades.filter(f => f.pass).length}/${report.facades.length}`);
console.log(`Errori: ${errors.length}`);
if (!report.ok) process.exitCode = 1;
