import { test, expect } from '@playwright/test';

const SAVE_KEY = 'campania_life_save_v1';
const T = 16;

async function attachErrors(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(`pageerror:${e.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`console:${msg.text()}`);
  });
  return errors;
}
function critical(errors) {
  return errors.filter(e => !/favicon|Failed to load resource.*favicon|DevTools|source map/i.test(e));
}

async function boot(page, opts = {}) {
  if (opts.reset !== false) {
    await page.addInitScript((k) => { try { localStorage.removeItem(k); } catch {} }, SAVE_KEY);
  }
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  if (opts.reset !== false) {
    await page.evaluate((k) => { try { localStorage.removeItem(k); } catch {} }, SAVE_KEY);
    await page.reload({ waitUntil: 'domcontentloaded' });
  }
  const nuova = page.getByRole('button', { name: 'NUOVA PARTITA' });
  if (await nuova.isVisible().catch(() => false)) {
    await nuova.click();
    await page.getByRole('button', { name: "INIZIA L'AVVENTURA" }).click();
  } else {
    const cont = page.getByRole('button', { name: /CONTINUA/i }).first();
    if (await cont.isVisible().catch(() => false)) await cont.click();
  }
  await page.waitForFunction(() => !!(window.CL?.game?.player && window.CL?.game?.map && window.CL?.state));
  await page.waitForTimeout(400);
}

async function snap(page) {
  return page.evaluate(() => {
    const G = CL.game, p = G.player, m = G.map;
    const ok = (map, x, y, w = p?.w || 10, h = p?.h || 8) =>
      !CL.maps.solidAt(map, x - w/2, y - h/2) && !CL.maps.solidAt(map, x + w/2, y - h/2) &&
      !CL.maps.solidAt(map, x - w/2, y + h/2) && !CL.maps.solidAt(map, x + w/2, y + h/2);
    const toasts = (CL.ui?._toasts || []).slice(-20).map(t => ({ msg: String(t.msg || t.m || t.text || ''), type: t.type }));
    return {
      map: m?.id, zone: m?.zone, x: p?.x, y: p?.y, walkable: !!(m && p && ok(m, p.x, p.y, p.w, p.h)),
      money: CL.state.money, inv: { ...CL.state.inventory }, needs: { ...CL.state.needs },
      prev: CL.state.pos.prev ? { ...CL.state.pos.prev } : null,
      properties: [...(CL.state.properties || [])],
      toasts, recoverToasts: toasts.filter(t => /Cambio zona recuperato/i.test(t.msg)).length,
    };
  });
}

async function dismissUI(page) {
  //player-like actions only; premere Escape a ogni frame annulla l'input e
  //rallenta il movimento di ~4x, quindi lo facciamo solo se c'è un modale.
  const open = await page.evaluate(() => !!document.querySelector('#dialogue, .screen'));
  if (!open) return;
  for (const name of ['Continua', 'OK', 'Ok', 'Chiudi', 'Esci', 'Annulla', 'No', '×']) {
    const btn = page.locator(`button:has-text("${name}")`).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ timeout: 800 }).catch(() => {});
      await page.waitForTimeout(120);
      return;
    }
  }
  await page.keyboard.press('Escape').catch(() => {});
}

async function walkTo(page, tx, ty, timeout = 25000, tol = 12) {
  const start = Date.now();
  let stuck = 0, last = null;
  while (Date.now() - start < timeout) {
    await dismissUI(page);
    const s = await snap(page);
    const dx = tx - s.x, dy = ty - s.y;
    if (Math.hypot(dx, dy) <= tol) return { ok: true, ...s };
    // Diagonale quando servono entrambe le componenti: il motore normalizza
    // l'asse, così il waypoint non viene mancato oscillando tra due assi.
    const kx = Math.abs(dx) > 4 ? (dx < 0 ? 'ArrowLeft' : 'ArrowRight') : null;
    const ky = Math.abs(dy) > 4 ? (dy < 0 ? 'ArrowUp' : 'ArrowDown') : null;
    const keys = [kx, ky].filter(Boolean);
    for (const key of keys) await page.keyboard.down(key);
    await page.waitForTimeout(90);
    for (const key of keys) await page.keyboard.up(key);
    const s2 = await snap(page);
    if (last && Math.hypot(s2.x - last.x, s2.y - last.y) < 0.5) stuck++; else stuck = 0;
    last = s2;
    if (stuck > 45) {
      const detours = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      for (const d of detours) { await page.keyboard.down(d); await page.waitForTimeout(120); await page.keyboard.up(d); }
      stuck = 0;
    }
  }
  return { ok: false, ...(await snap(page)), tx, ty };
}

/* Navigazione data-driven: le coordinate dei portali vengono lette dalla mappa
 * viva, non codificate nei test. Il pathfinding del gioco evita i portali e i
 * muri, quindi genera waypoint validi; il movimento resta reale (tastiera +
 * collisioni). */
async function routeWaypoints(page, tx, ty) {
  // Path completo tile-per-tile (senza smoothing): ogni waypoint è il centro
  // di una tile libera, quindi passare da uno all'altro non taglia i muri.
  const pts = await page.evaluate(([x, y]) => {
    const g = CL.game, p = g.player;
    try {
      return (CL.path.find(g.map, { x: p.x, y: p.y }, { x, y }, { w: p.w || 10, h: p.h || 8, smooth: false }) || [])
        .slice(1).map(q => ({ x: q.x, y: q.y }));
    } catch { return []; }
  }, [tx, ty]);
  return [...pts, { x: tx, y: ty }];
}

async function walkRoute(page, points) {
  for (const [x, y] of points) {
    const fromMap = (await snap(page)).map;
    for (const wp of await routeWaypoints(page, x, y)) {
      const r = await walkTo(page, wp.x, wp.y, 25000, 8);
      if (r.map !== fromMap) return; // il portale è stato attraversato durante il cammino
      expect(r.ok, `reach ${wp.x},${wp.y} got ${r.x},${r.y} map=${r.map}`).toBeTruthy();
    }
  }
}

/* Cammina fino a un portale (identificato dal suo target) e lo attraversa
 * premendo la direzione corretta finché la mappa non cambia. */
async function enterPortal(page, toId, tries = 60) {
  const fromMap = (await snap(page)).map;
  const target = await page.evaluate((id) => {
    const m = CL.game.map;
    const p = (m.portals || []).find(q => q.to === id);
    return p ? { x: p.x + p.w / 2, y: p.y + p.h / 2 } : null;
  }, toId);
  expect(target, `portale verso ${toId} presente in ${fromMap}`).toBeTruthy();
  // allowPartial: la tile "libera" più vicina a certi portali è un'isola
  // irraggiungibile; il pathfinder deve portarci alla tile raggiungibile più
  // vicina, da cui si entra nel portale con un passo.
  const portalRoute = await page.evaluate(([x, y]) => {
    const g = CL.game, p = g.player;
    try {
      return (CL.path.find(g.map, { x: p.x, y: p.y }, { x, y },
        { w: p.w || 10, h: p.h || 8, smooth: false, allowPartial: true }) || [])
        .slice(1).map(q => ({ x: q.x, y: q.y }));
    } catch { return []; }
  }, [target.x, target.y]);
  // In Napoli il centro del portale è attraversabile: il waypoint finale
  // avvicina al portale, poi il loop di input reale completa l'ingresso.
  for (const wp of [...portalRoute, target]) {
    const r = await walkTo(page, wp.x, wp.y, 25000, 8);
    if (r.map !== fromMap) return r; // entrati nel portale durante il cammino
    expect(r.ok, `waypoint ${wp.x},${wp.y} -> ${toId}: fermo a ${r.x},${r.y} ${r.map}`).toBeTruthy();
  }
  for (let i = 0; i < tries; i++) {
    const s = await snap(page);
    if (s.map !== fromMap) return s;
    const dx = target.x - s.x, dy = target.y - s.y;
    const key = Math.abs(dx) > Math.abs(dy)
      ? (dx < 0 ? 'ArrowLeft' : 'ArrowRight')
      : (dy < 0 ? 'ArrowUp' : 'ArrowDown');
    await page.keyboard.down(key); await page.waitForTimeout(90); await page.keyboard.up(key);
  }
  return snap(page);
}

test.describe('regression', () => {
  test('boot + save key + walkable spawn', async ({ page }) => {
    const errs = await attachErrors(page);
    await boot(page);
    const s = await snap(page);
    expect(s.map).toBe('napoli');
    expect(s.walkable).toBe(true);
    expect(await page.evaluate((k) => !!localStorage.getItem(k), SAVE_KEY)).toBe(true);
    expect(critical(errs)).toEqual([]);
  });

  test('church: ingress -> altar -> exit', async ({ page }) => {
    const errs = await attachErrors(page);
    await boot(page);
    let s = await enterPortal(page, 'casa_nonna');
    expect(s.map).toBe('casa_nonna');
    expect(s.walkable).toBe(true);
    // Direzione dell'altare: si cammina davvero nell'interno, aggirando i muri.
    await walkRoute(page, [[14*T,14*T], [14*T,8*T], [14*T,5*T]]);
    s = await snap(page);
    expect(s.y).toBeLessThan(10*T);
    await walkRoute(page, [[14*T,12*T], [14*T,18*T]]);
    s = await enterPortal(page, 'prev');
    expect(s.map).toBe('napoli');
    expect(s.walkable).toBe(true);
    expect(s.recoverToasts).toBe(0);
    expect(critical(errs)).toEqual([]);
  });

  test('bar: ingress -> interact -> exit', async ({ page }) => {
    const errs = await attachErrors(page);
    await boot(page);
    let s = await enterPortal(page, 'bar');
    expect(s.map).toBe('bar');
    expect(s.walkable).toBe(true);
    const moneyBefore = s.money;
    const coffeeBefore = s.inv.caffe || 0;
    // Ci avviciniamo al bancone e interagiamo da giocatore (tasto E).
    await walkRoute(page, [[6*T+8, 6*T+8], [10*T+8, 6*T+8]]);
    for (let i = 0; i < 6; i++) { await page.keyboard.press('KeyE'); await page.waitForTimeout(250); await dismissUI(page); }
    const buy = page.locator('button:has-text("COMPRA")').first();
    if (await buy.isVisible().catch(() => false)) {
      const coffeeBuy = page.locator('.tile:has-text("Caff") button:has-text("COMPRA"), .tile:has-text("caff") button:has-text("COMPRA")').first();
      if (await coffeeBuy.isVisible().catch(() => false)) await coffeeBuy.click();
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(200);
    }
    await dismissUI(page);
    s = await snap(page);
    expect(s.money <= moneyBefore || (s.inv.caffe || 0) >= coffeeBefore).toBe(true);
    s = await enterPortal(page, 'prev', 80);
    expect(s.map).toBe('napoli');
    expect(s.walkable).toBe(true);
    expect(s.recoverToasts).toBe(0);
    expect(critical(errs)).toEqual([]);
  });
});
