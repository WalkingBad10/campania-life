/* CAMPANIA OPEN CODE 1 — render audit.
 * Strumenta drawImage per misurare le dimensioni REALMENTE disegnate dal
 * motore (non quelle dei file sorgente) e verificare che nessun elemento alto
 * venga tagliato dai confini della mappa.
 */
import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');
const OUT = resolve(ROOT, 'qa', 'campania-open-code-1');
const BASE = process.env.CL_BASE_URL || 'http://127.0.0.1:3000/';
const MAPS = [
  'napoli', 'costiera', 'vesuvio', 'pompei', 'capri', 'bacoli', 'salerno', 'avellino', 'caserta',
  'fuorigrotta', 'pianura',
  'casa_nonna', 'casa_giocatore', 'appartamento', 'casa_amalfi', 'bottega', 'souvenir',
  'bar', 'pizzeria', 'metro', 'metro2', 'negozio', 'banca', 'clinica', 'ufficio', 'grotta'
];

const AUDIT = `(() => {
  const CL = window.CL, G = CL.game, T = CL.TILE;
  const cv = G.canvas, ctx = cv.getContext('2d');
  const orig = ctx.drawImage.bind(ctx);
  const draws = [];
  ctx.drawImage = function(img, a, b, c, d, e, f, g, h) {
    let dx, dy, dw, dh;
    if (c === undefined) { dx = a; dy = b; dw = img.width; dh = img.height; }
    else { dx = a; dy = b; dw = c; dh = d; }
    // Il motore applica la camera con ctx.translate: le coordinate passate a
    // drawImage sono GIA' coordinate mondo. Non aggiungere la camera.
    draws.push({
      kind: img.__clKind || 'unknown',
      sw: img.width, sh: img.height,
      dx, dy, dw, dh
    });
    return orig(img, a, b, c, d, e, f, g, h);
  };
  G.render();
  ctx.drawImage = orig;
  const out = {};
  for (const q of draws) {
    const k = q.kind;
    if (!out[k]) out[k] = { count: 0, dw: q.dw, dh: q.dh, sw: q.sw, sh: q.sh, minY: q.dy, maxY: q.dy + q.dh };
    out[k].count++;
    out[k].minY = Math.min(out[k].minY, q.dy);
    out[k].maxY = Math.max(out[k].maxY, q.dy + q.dh);
  }
  // Altezza VISIBILE (pixel alpha) degli sprite, non dimensione del canvas.
  const measure = img => {
    if (!img || !img.width) return null;
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const cx = c.getContext('2d'); cx.drawImage(img, 0, 0);
    const d = cx.getImageData(0, 0, c.width, c.height).data;
    let y0 = c.height, y1 = 0, x0 = c.width, x1 = 0;
    for (let y = 0; y < c.height; y++) for (let xx = 0; xx < c.width; xx++) {
      if (d[(y * c.width + xx) * 4 + 3] > 20) {
        y0 = Math.min(y0, y); y1 = Math.max(y1, y); x0 = Math.min(x0, xx); x1 = Math.max(x1, xx);
      }
    }
    const alpha = (xx, yy) => d[(yy * c.width + xx) * 4 + 3];
    return {
      canvasW: img.width, canvasH: img.height,
      visible: y1 - y0 + 1, visibleW: x1 - x0 + 1,
      // Nessuno sprite puo' avere uno sfondo quadrato opaco agli angoli.
      corners: [alpha(0, 0), alpha(c.width - 1, 0), alpha(0, c.height - 1), alpha(c.width - 1, c.height - 1)]
    };
  };
  const look = { hair: '#2d2622', skin: '#d79c74', shirt: '#c75b3b', pants: '#3a4650' };
  return {
    map: G.map.id, mapH: G.map.h * T, draws: out,
    visible: {
      character: measure(CL.art.character(look, 'down', 0)),
      guglia: measure(CL.art.gugliaSprite()),
      campanile: measure(CL.art.campanileSprite()),
      tree: measure(CL.art.tree(0)),
      lemonTree: measure(CL.art.lemonTree(0)),
      palmTree: measure(CL.art.palmTree(0)),
      carSide: measure(CL.art.vehicle('car', 'right')),
      carFront: measure(CL.art.vehicle('car', 'down')),
      scooter: measure(CL.art.vehicle('scooter', 'right')),
      bench: measure(CL.art.propSprite('bench')),
      lamp: measure(CL.art.propSprite('lamp')),
      plant: measure(CL.art.propSprite('plant')),
      awning: measure(CL.art.awningSprite('#b94a3a', 32)),
      cornice: measure(CL.art.trimSprite('cornice', 32, '#b9b0a0', false)),
      balcony: measure(CL.art.trimSprite('balcony', 40, '#b7ae9d', true)),
      portalArch: measure(CL.art.trimSprite('portal_arch', 36, '#7e858c', false))
    }
  };
})()`;

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1512, height: 982 }, deviceScaleFactor: 2 });
  await page.addInitScript(() => { try { localStorage.removeItem('campania_life_save_v1'); } catch {} });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'NUOVA PARTITA' }).click();
  await page.getByRole('button', { name: "INIZIA L'AVVENTURA" }).click();
  await page.waitForFunction(() => window.CL && CL.game && CL.game.player && CL.game.map);
  await page.evaluate(() => {
    const CL = window.CL, G = CL.game;
    G.stop();
    // Possedere tutti gli immobili serve per entrare nei 4 interni proprietari.
    CL.state.properties = ['monolocale', 'appartamento', 'casa_amalfi', 'bottega', 'casa_giocatore'];
    // Etichetta gli sprite per riconoscerli nel trace di drawImage.
    const tag = (fn, name) => { const f = CL.art[fn].bind(CL.art); CL.art[fn] = (...a) => { const im = f(...a); if (im) im.__clKind = typeof name === 'function' ? name(...a) : name; return im; }; };
    ['gugliaSprite', 'campanileSprite', 'character', 'creature', 'vehicle', 'tree', 'lemonTree',
      'palmTree', 'rock', 'flower', 'fountain'].forEach(n => tag(n, n));
    tag('propSprite', k => 'prop:' + k);
    const bs = CL.art.buildingSprite.bind(CL.art);
    CL.art.buildingSprite = k => { const im = bs(k); if (im) im.__clKind = 'building:' + k; return im; };
  });

  const results = [];
  for (const id of MAPS) {
    results.push(await page.evaluate(({ id, AUDIT }) => {
      const CL = window.CL, G = CL.game, T = CL.TILE;
      const m = CL.maps.get(id);
      G.enterMap(id, m.spawn.x, m.spawn.y, true);
      CL.camera.snap(G.player);
      return eval(AUDIT);
    }, { id, AUDIT }));
  }
  // Viste ravvicinate: qui entrano nel trace la Guglia e le facciate metriche.
  for (const [tx, ty, label] of [[36, 30, 'guglia'], [20, 12, 'facciate'], [50, 22, 'campanile']]) {
    results.push(await page.evaluate(({ AUDIT, tx, ty, label }) => {
      const CL = window.CL, G = CL.game, T = CL.TILE;
      G.enterMap('napoli', tx * T + 8, ty * T + 8, true);
      CL.camera.snap(G.player);
      const r = eval(AUDIT);
      r.view = label;
      return r;
    }, { AUDIT, tx, ty, label }));
  }
  // Viste ravvicinate delle architetture metriche delle due nuove zone e di Baia.
  for (const [id, tx, ty, label] of [
    ['fuorigrotta', 22, 25, 'fuorigrotta-facciate'],
    ['fuorigrotta', 19, 19, 'fuorigrotta-teatro'],
    ['fuorigrotta', 64, 31, 'fuorigrotta-stadio'],
    ['pianura', 25, 21, 'pianura-facciate'],
    ['bacoli', 24, 11, 'bacoli-templi']
  ]) {
    results.push(await page.evaluate(({ AUDIT, id, tx, ty, label }) => {
      const CL = window.CL, G = CL.game, T = CL.TILE;
      G.enterMap(id, tx * T + 8, ty * T + 8, true);
      CL.camera.snap(G.player);
      const r = eval(AUDIT);
      r.view = label;
      return r;
    }, { AUDIT, id, tx, ty, label }));
  }
  await browser.close();

  const nap = results.find(r => r.view === 'guglia') || results.find(r => r.map === 'napoli');
  const issues = [];
  const intentional = [];
  // Il controllo sui confini riguarda l'ARCHITETTURA: prospetti metrici,
  // Guglia e campanile. `unknown` e' il riempimento viewport (coordinate
  // schermo, non mondo); i `prop:*` sono arredi volutamente ancorati a muro
  // o sopra il piano (piante, altari, forni, ingressi metro): la loro
  // sporgenza e' documentata qui, non e' una facciata tagliata.
  for (const r of results) {
    for (const [k, q] of Object.entries(r.draws)) {
      const out = q.minY < 0 || q.maxY > r.mapH;
      if (!out) continue;
      if (k === 'unknown' || k.startsWith('prop:')) {
        intentional.push({ map: r.view || r.map, kind: k, minY: Math.round(q.minY), maxY: Math.round(q.maxY) });
        continue;
      }
      // Il prospetto del Gesu' e' ancorato 8 px sopra il bordo nord (base
      // sulla gronda, y=240): e' un anchor storico verificato, non un taglio.
      if (k === 'building:gesu' && q.minY >= -8) {
        intentional.push({ map: r.view || r.map, kind: k, minY: Math.round(q.minY), maxY: Math.round(q.maxY) });
        continue;
      }
      if (q.minY < 0) issues.push(`${r.view || r.map}: ${k} inizia a y=${q.minY.toFixed(0)} (fuori mappa)`);
      if (q.maxY > r.mapH) issues.push(`${r.view || r.map}: ${k} finisce a y=${q.maxY.toFixed(0)} > ${r.mapH}`);
    }
  }
  console.log('Render audit — dimensioni disegnate (Napoli)');
  for (const k of ['character', 'gugliaSprite', 'campanileSprite', 'building:gesu', 'building:palazzo_ne', 'vehicle']) {
    const q = nap.draws[k] || (results.find(r => r.view === 'facciate') || {}).draws?.[k] || {};
    console.log(`  ${k.padEnd(20)} ${q.dw || 0}x${q.dh || 0} px  (sorgente ${q.sw || 0}x${q.sh || 0})  n=${q.count || 0}`);
  }
  // Il controllo decisivo e' sulla dimensione EFFETTIVAMENTE disegnata: una
  // sorgente corretta ma stampata a meta' scala e' un difetto, non un successo.
  const expected = { gugliaSprite: [126, 240], campanileSprite: [112, 384] };
  for (const [k, [w, h]] of Object.entries(expected)) {
    const q = nap.draws[k] || {};
    if (q.dw !== w || q.dh !== h) issues.push(`${k} disegnato ${q.dw}x${q.dh}, atteso ${w}x${h}`);
  }
  // I quadri metrici finali, non i sorgenti legacy: il doppio downscale
  // produceva sprite sfocati e ancoraggi errati.
  const spriteDims = {
    character: [9, 14], tree: [19, 24], lemonTree: [19, 24], palmTree: [19, 24],
    carSide: [18, 12], carFront: [12, 18], scooter: [15, 12],
    bench: [21, 13], lamp: [14, 31], plant: [11, 13],
    awning: [19, 12], cornice: [19, 6], balcony: [24, 11], portalArch: [21, 14]
  };
  for (const [k, [w, h]] of Object.entries(spriteDims)) {
    const v = nap.visible[k] || {};
    if (v.canvasW !== w || v.canvasH !== h) issues.push(`${k} canvas ${v.canvasW}x${v.canvasH}, atteso ${w}x${h}`);
    // Il canvas include il margine necessario all'ancoraggio: il contenuto
    // utile puo' essere piu' corto, ma non meno di 3/4 dell'altezza.
    if (!v.visible || v.visible < Math.ceil(h * .75)) issues.push(`${k} altezza visibile ${v.visible} troppo piccola`);
  }
  // I quattro angoli devono essere trasparenti: nessuno sfondo quadrato
  // sotto alberi, panchine, lampioni o veicoli.
  for (const k of ['tree', 'lemonTree', 'palmTree', 'carSide', 'carFront', 'scooter', 'bench', 'lamp', 'plant', 'portalArch']) {
    const v = nap.visible[k] || {};
    if ((v.corners || []).some(a => a > 20)) issues.push(`${k} ha uno sfondo opaco agli angoli: ${v.corners}`);
  }
  for (const [view, k, w, h] of [
    ['fuorigrotta-facciate', 'building:fuorigrotta_blocco', 192, 144],
    ['fuorigrotta-facciate', 'building:fuorigrotta_torre', 160, 240],
    ['fuorigrotta-teatro', 'building:fuorigrotta_teatro', 560, 280],
    ['fuorigrotta-stadio', 'building:fuorigrotta_stadio', 208, 160],
    ['pianura-facciate', 'building:pianura_chiesa', 320, 248],
    ['bacoli-templi', 'building:bacoli_castello', 288, 176]
  ]) {
    const q = (results.find(r => r.view === view) || {}).draws?.[k] || {};
    if (q.dw !== w || q.dh !== h) issues.push(`${view}: ${k} disegnato ${q.dw}x${q.dh}, atteso ${w}x${h}`);
  }
  const report = {
    generatedAt: new Date().toISOString(), baseUrl: BASE, maps: results,
    intentionalAnchors: intentional, issues
  };
  await writeFile(resolve(OUT, 'render-audit.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`Anchor volutamente fuori bounds (documentati): ${intentional.length}`);
  console.log(`Fuori confini mappa / dimensioni errate: ${issues.length}`);
  if (issues.length) console.log(issues.slice(0, 20).join('\n'));
  if (issues.length) process.exitCode = 1;
}

main().catch(e => { console.error(e); process.exitCode = 1; });
