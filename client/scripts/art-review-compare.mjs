/* CAMPANIA OPEN CODE 1 — confronto before/after dell'art review.
 * Uso (dalla root del repo):
 *   node client/scripts/art-review-compare.mjs [beforeDir] [afterDir] [outDir]
 * Valori predefiniti: before/ after/ compare/ dentro qa/campania-open-code-1/art-review.
 * Env: CL_QA_BEFORE, CL_QA_AFTER, CL_QA_DIFF_OUT, CL_QA_TOL_PALETTE_PCT,
 *      CL_QA_TOL_EDGE_ABS, CL_QA_TOL_LUM_ABS, CL_QA_FAIL_ON_DELTA=1.
 *
 * Legge i report.json delle due cartelle (anche le under-dir h<hour>), affianca
 * le PNG per mappa/orario con Canvas nel browser Playwright e scrive solo in
 * outDir: sheets/<id>-h<hour>.png, contact-sheet.png, diff.json.
 * Non avvia server, non tocca i sorgenti di gioco né le cartelle before/after. */
import { chromium } from '@playwright/test';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DEFAULT_DIR = resolve(ROOT, 'qa', 'campania-open-code-1', 'art-review');

const USAGE = `Uso: node client/scripts/art-review-compare.mjs [beforeDir] [afterDir] [outDir]
Impliciti: ${join(DEFAULT_DIR, 'before')} ${join(DEFAULT_DIR, 'after')} ${join(DEFAULT_DIR, 'compare')}`;

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(USAGE);
  process.exit(0);
}

const input = (value, fallback) => value ? resolve(isAbsolute(value) ? value : resolve(process.cwd(), value)) : fallback;
const BEFORE = input(args[0] || process.env.CL_QA_BEFORE, join(DEFAULT_DIR, 'before'));
const AFTER = input(args[1] || process.env.CL_QA_AFTER, join(DEFAULT_DIR, 'after'));
const OUT = input(args[2] || process.env.CL_QA_DIFF_OUT, join(DEFAULT_DIR, 'compare'));
const SHEETS = join(OUT, 'sheets');

const tol = (name, fallback) => {
  const raw = process.env[name];
  if (raw === undefined || !String(raw).trim()) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`${name} deve essere un numero (ricevuto: ${raw})`);
  return value;
};

const THRESHOLDS = {
  paletteRelPct: tol('CL_QA_TOL_PALETTE_PCT', 5),
  edgeDensityAbs: tol('CL_QA_TOL_EDGE_ABS', 0.01),
  luminanceAbs: tol('CL_QA_TOL_LUM_ABS', 2)
};

function within(child, parent) {
  const rel = relative(parent, child);
  return rel === '' || (!rel.startsWith('..' + sep) && !isAbsolute(rel));
}
if (within(OUT, BEFORE) || within(OUT, AFTER)) {
  throw new Error('La cartella di output non può stare dentro before/ after: scegli un terzo percorso.');
}

async function exists(path) {
  try { await access(path); return true; }
  catch { return false; }
}

async function readJson(path) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

// Accetta sia report piatti (una sola ora) sia report con `captures` + h<hour>/.
async function collectRuns(dir, label) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch (error) { throw new Error(`${label}: impossibile leggere ${dir} (${error.code || error.message})`); }

  const runs = [];
  const root = await readJson(join(dir, 'report.json'));
  if (root) {
    if (Array.isArray(root.captures) && root.captures.length) {
      for (const cap of root.captures) {
        const dirName = !cap.dir || cap.dir === '.' ? '' : cap.dir;
        const sub = await readJson(join(dir, dirName, 'report.json'));
        const report = sub && Array.isArray(sub.maps) ? sub : cap;
        if (!Array.isArray(report.maps)) continue;
        const hour = Number(report.hour ?? cap.hour);
        if (!Number.isFinite(hour)) throw new Error(`${label}: orario non valido in ${dirName || 'report.json'}`);
        runs.push({ hour, dirName, report });
      }
    } else if (Array.isArray(root.maps)) {
      const hour = Number(root.hour ?? root.hours?.[0]);
      if (!Number.isFinite(hour)) throw new Error(`${label}: orario non valido in report.json`);
      runs.push({ hour, dirName: '', report: root });
    }
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || !/^h\d+$/.test(entry.name)) continue;
    if (runs.some(run => run.dirName === entry.name)) continue;
    const report = await readJson(join(dir, entry.name, 'report.json'));
    if (report && Array.isArray(report.maps)) {
      const hour = Number(report.hour ?? entry.name.slice(1));
      if (!Number.isFinite(hour)) throw new Error(`${label}: orario non valido in ${entry.name}`);
      runs.push({ hour, dirName: entry.name, report });
    }
  }
  if (!runs.length) throw new Error(`${label}: nessun report.json con "maps" trovato in ${dir}`);
  return runs;
}

const beforeRuns = await collectRuns(BEFORE, 'before');
const afterRuns = await collectRuns(AFTER, 'after');
const beforeByHour = new Map(beforeRuns.map(run => [run.hour, run]));
const afterByHour = new Map(afterRuns.map(run => [run.hour, run]));
const hours = [...beforeByHour.keys()].filter(hour => afterByHour.has(hour)).sort((a, b) => a - b);
if (!hours.length) {
  throw new Error(`Nessun orario comune tra before [${[...beforeByHour.keys()].join(', ')}] e after [${[...afterByHour.keys()].join(', ')}]`);
}

const uniq = list => [...new Set(list)];
const errorList = value => uniq(Array.isArray(value) ? value.map(String) : []);
const numeric = value => Number.isFinite(value) ? value : null;

function delta(before, after) {
  if (numeric(before) === null || numeric(after) === null) return null;
  const b = numeric(before), a = numeric(after);
  return {
    before: b, after: a,
    abs: +(a - b).toFixed(3),
    pct: b === 0 ? null : +((a - b) / Math.abs(b) * 100).toFixed(2)
  };
}

const pairs = [];
for (const hour of hours) {
  const beforeRun = beforeByHour.get(hour), afterRun = afterByHour.get(hour);
  const beforeMaps = new Map(beforeRun.report.maps.map(map => [map.id, map]));
  const afterMaps = new Map(afterRun.report.maps.map(map => [map.id, map]));
  const ids = [...beforeMaps.keys()];
  for (const id of afterMaps.keys()) if (!beforeMaps.has(id)) ids.push(id);

  for (const id of ids) {
    const before = beforeMaps.get(id) || null, after = afterMaps.get(id) || null;
    const beforeFile = join(BEFORE, beforeRun.dirName, `${id}.png`);
    const afterFile = join(AFTER, afterRun.dirName, `${id}.png`);
    const hasImages = await exists(beforeFile) && await exists(afterFile);
    const beforeErrors = errorList(before?.errors ?? beforeRun.report.errors);
    const afterErrors = errorList(after?.errors ?? afterRun.report.errors);
    const added = afterErrors.filter(item => !beforeErrors.includes(item));
    const removed = beforeErrors.filter(item => !afterErrors.includes(item));

    const pair = {
      id, hour,
      status: before && after && hasImages ? 'ok' : 'missing',
      before: before ? {
        palette: numeric(before.palette), edgeDensity: numeric(before.edgeDensity),
        luminance: numeric(before.luminance), consoleErrors: beforeErrors
      } : null,
      after: after ? {
        palette: numeric(after.palette), edgeDensity: numeric(after.edgeDensity),
        luminance: numeric(after.luminance), consoleErrors: afterErrors
      } : null,
      delta: {
        palette: before && after ? delta(before.palette, after.palette) : null,
        edgeDensity: before && after ? delta(before.edgeDensity, after.edgeDensity) : null,
        luminance: before && after ? delta(before.luminance, after.luminance) : null,
        consoleErrors: {
          beforeCount: beforeErrors.length, afterCount: afterErrors.length,
          added, removed
        }
      },
      pixel: null,
      sheet: null,
      underThreshold: false,
      reasons: []
    };

    if (pair.status === 'missing') {
      pair.reasons.push('mappa o screenshot mancante in before/after');
    } else if (!pair.delta.palette || !pair.delta.edgeDensity || !pair.delta.luminance) {
      pair.reasons.push('metriche palette/edgeDensity/luminanza incomplete');
    } else {
      const palettePct = pair.delta.palette?.pct;
      if (palettePct !== null && palettePct !== undefined && Math.abs(palettePct) > THRESHOLDS.paletteRelPct) {
        pair.reasons.push(`palette ${palettePct}% oltre ${THRESHOLDS.paletteRelPct}%`);
      }
      if (Math.abs(pair.delta.edgeDensity.abs) > THRESHOLDS.edgeDensityAbs) {
        pair.reasons.push(`edgeDensity Δ${pair.delta.edgeDensity.abs} oltre ${THRESHOLDS.edgeDensityAbs}`);
      }
      if (Math.abs(pair.delta.luminance.abs) > THRESHOLDS.luminanceAbs) {
        pair.reasons.push(`luminanza Δ${pair.delta.luminance.abs} oltre ${THRESHOLDS.luminanceAbs}`);
      }
      if (added.length) pair.reasons.push(`${added.length} nuovi errori console/page`);
    }
    pair.underThreshold = pair.reasons.length === 0;
    pairs.push({ pair, beforeFile, afterFile });
  }
}

await mkdir(SHEETS, { recursive: true });
const renderable = pairs.filter(({ pair }) => pair.status === 'ok');
const METRICS = { width: 480, height: 270 };

let browser;
if (renderable.length) {
  try {
    const launch = { headless: true, args: ['--disable-dev-shm-usage'] };
    try { browser = await chromium.launch({ ...launch, channel: 'chrome' }); }
    catch { browser = await chromium.launch(launch); }
    const page = await browser.newPage();
    await page.goto('about:blank');

    // Overview tenuta nel contesto della pagina: evita di ritrasferire le PNG.
    await page.evaluate(({ rows }) => {
      const pad = 12, labelW = 118, gap = 8, thumbW = 240, thumbH = 135, rowH = 155;
      const canvas = document.createElement('canvas');
      canvas.width = pad * 2 + labelW + gap + thumbW * 2 + gap + 70;
      canvas.height = pad * 2 + rows * rowH;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0d1319';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      window.__clCompare = { canvas, ctx, pad, labelW, gap, thumbW, rowH, index: 0 };
    }, { rows: renderable.length });

    for (const { pair, beforeFile, afterFile } of renderable) {
      const beforeB64 = (await readFile(beforeFile)).toString('base64');
      const afterB64 = (await readFile(afterFile)).toString('base64');
      const summary = [
        `palette ${pair.delta.palette.pct ?? 'n/d'}%`,
        `edge Δ${pair.delta.edgeDensity.abs}`,
        `lum Δ${pair.delta.luminance.abs}`,
        pair.underThreshold ? 'SOTTO SOGLIA' : 'OLTRE SOGLIA'
      ].join('  |  ');

      const rendered = await page.evaluate(async ({ beforeB64, afterB64, id, hour, summary, under, metrics }) => {
        const load = src => new Promise((done, fail) => {
          const img = new Image();
          img.onload = () => done(img);
          img.onerror = () => fail(new Error(`PNG non decodificabile: ${id} h${hour}`));
          img.src = src;
        });
        const [before, after] = await Promise.all([
          load('data:image/png;base64,' + beforeB64),
          load('data:image/png;base64,' + afterB64)
        ]);

        // Normalizzazione a 480x270: la baseline contiene PNG a DPR 2 e DPR 1.
        const pixels = img => {
          const canvas = document.createElement('canvas');
          canvas.width = metrics.width; canvas.height = metrics.height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0, metrics.width, metrics.height);
          return ctx.getImageData(0, 0, metrics.width, metrics.height).data;
        };
        const bd = pixels(before), ad = pixels(after);
        let sum = 0, changed = 0;
        for (let i = 0; i < bd.length; i += 4) {
          const dr = Math.abs(bd[i] - ad[i]);
          const dg = Math.abs(bd[i + 1] - ad[i + 1]);
          const db = Math.abs(bd[i + 2] - ad[i + 2]);
          sum += (dr + dg + db) / 3;
          if (Math.max(dr, dg, db) > 8) changed++;
        }
        const n = metrics.width * metrics.height;
        const pixel = {
          mae: +(sum / n).toFixed(3),
          changedRatio: +(changed / n).toFixed(4),
          beforeSize: `${before.naturalWidth}x${before.naturalHeight}`,
          afterSize: `${after.naturalWidth}x${after.naturalHeight}`
        };

        const pad = 12, labelH = 34, panelW = 480, panelH = 270, gap = 10, foot = 30;
        const sheet = document.createElement('canvas');
        sheet.width = pad * 2 + panelW * 2 + gap;
        sheet.height = pad * 2 + labelH + panelH + foot;
        const s = sheet.getContext('2d');
        s.fillStyle = '#0d1319';
        s.fillRect(0, 0, sheet.width, sheet.height);
        s.fillStyle = '#f2e9d8';
        s.font = 'bold 16px sans-serif';
        s.fillText(`BEFORE · ${id} · h${hour}`, pad + 2, pad + 20);
        s.fillText(`AFTER · ${id} · h${hour}`, pad + panelW + gap + 2, pad + 20);
        s.imageSmoothingEnabled = false;
        s.drawImage(before, pad, pad + labelH, panelW, panelH);
        s.drawImage(after, pad + panelW + gap, pad + labelH, panelW, panelH);
        s.fillStyle = under ? '#9fd3a0' : '#f0a35e';
        s.font = '13px sans-serif';
        s.fillText(summary, pad + 2, pad + labelH + panelH + 18);

        const o = window.__clCompare;
        const row = o.index++;
        const y = o.pad + row * o.rowH;
        o.ctx.fillStyle = '#f2e9d8';
        o.ctx.font = '13px sans-serif';
        o.ctx.fillText(`${id} h${hour}`, o.pad, y + 13);
        o.ctx.imageSmoothingEnabled = false;
        o.ctx.drawImage(before, o.pad + o.labelW + o.gap, y + 18, o.thumbW, 135);
        o.ctx.drawImage(after, o.pad + o.labelW + o.gap + o.thumbW + o.gap, y + 18, o.thumbW, 135);
        o.ctx.fillStyle = under ? '#9fd3a0' : '#f0a35e';
        o.ctx.fillText(under ? 'OK' : 'DELTA', o.pad + o.labelW + o.gap + o.thumbW * 2 + o.gap + 4, y + 14);

        return { sheet: sheet.toDataURL('image/png'), pixel };
      }, {
        beforeB64, afterB64, id: pair.id, hour: pair.hour,
        summary, under: pair.underThreshold, metrics: METRICS
      });

      pair.pixel = rendered.pixel;
      const sheetPath = join(SHEETS, `${pair.id}-h${pair.hour}.png`);
      await writeFile(sheetPath, Buffer.from(rendered.sheet.split(',')[1], 'base64'));
      pair.sheet = relative(OUT, sheetPath);
    }

    const overview = await page.evaluate(() => window.__clCompare.canvas.toDataURL('image/png'));
    await writeFile(join(OUT, 'contact-sheet.png'), Buffer.from(overview.split(',')[1], 'base64'));
  } finally {
    if (browser) await browser.close();
  }
}

const diff = {
  before: { dir: BEFORE, hours: [...beforeByHour.keys()].sort((a, b) => a - b) },
  after: { dir: AFTER, hours: [...afterByHour.keys()].sort((a, b) => a - b) },
  hours,
  hoursMissing: {
    before: [...afterByHour.keys()].filter(hour => !beforeByHour.has(hour)).sort((a, b) => a - b),
    after: [...beforeByHour.keys()].filter(hour => !afterByHour.has(hour)).sort((a, b) => a - b)
  },
  thresholds: THRESHOLDS,
  notes: [
    'Sotto soglia = palette/variazione relativa, edgeDensity e luminanza entro le tolleranze e zero nuovi errori console/page.',
    'pixel.mae e pixel.changedRatio sono informativi, calcolati dopo normalizzazione a 480x270; non entrano nella classificazione.',
    'Gli errori console/page sono quelli del report di corsa quando la singola mappa non ne dichiara di propri.'
  ],
  maps: pairs.map(({ pair }) => pair),
  underThresholdMaps: pairs.filter(({ pair }) => pair.underThreshold).map(({ pair }) => ({ id: pair.id, hour: pair.hour })),
  changedMaps: pairs.filter(({ pair }) => !pair.underThreshold).map(({ pair }) => ({ id: pair.id, hour: pair.hour, reasons: pair.reasons })),
  missingMaps: pairs.filter(({ pair }) => pair.status === 'missing').map(({ pair }) => ({ id: pair.id, hour: pair.hour })),
  sheets: { dir: relative(OUT, SHEETS) || '', overview: renderable.length ? 'contact-sheet.png' : null }
};

await writeFile(join(OUT, 'diff.json'), JSON.stringify(diff, null, 2));
console.log(`diff.json: ${join(OUT, 'diff.json')}`);
console.log(`ore confrontate: ${hours.join(', ')} · mappe: ${diff.maps.length} · sotto soglia: ${diff.underThresholdMaps.length} · oltre soglia: ${diff.changedMaps.length}`);
if (renderable.length) console.log(`sheet: ${SHEETS} · ${join(OUT, 'contact-sheet.png')}`);
if (/^(1|true|yes)$/i.test(process.env.CL_QA_FAIL_ON_DELTA || '') && diff.changedMaps.length) process.exitCode = 1;
