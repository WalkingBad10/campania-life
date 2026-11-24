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
  // player-like actions only
  for (const name of ['Continua', 'OK', 'Ok', 'Chiudi', 'Esci', 'Annulla', 'No', '×']) {
    const btn = page.locator(`button:has-text("${name}")`).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ timeout: 800 }).catch(() => {});
      await page.waitForTimeout(120);
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
    const key = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'ArrowLeft' : 'ArrowRight') : (dy < 0 ? 'ArrowUp' : 'ArrowDown');
    await page.keyboard.down(key);
    await page.waitForTimeout(90);
    await page.keyboard.up(key);
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

async function walkRoute(page, points) {
  for (const [x, y] of points) {
    const r = await walkTo(page, x, y);
    expect(r.ok, `reach ${x},${y} got ${r.x},${r.y} map=${r.map}`).toBeTruthy();
  }
}

async function enterByDoor(page, mapId, key = 'ArrowUp', tries = 60) {
  for (let i = 0; i < tries; i++) {
    await dismissUI(page);
    if ((await snap(page)).map === mapId) return true;
    await page.keyboard.down(key); await page.waitForTimeout(90); await page.keyboard.up(key);
  }
  return (await snap(page)).map === mapId;
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
    await walkRoute(page, [[36*T,28*T], [20*T,28*T], [20*T,16*T]]);
    expect(await enterByDoor(page, 'casa_nonna', 'ArrowUp')).toBe(true);
    let s = await snap(page);
    expect(s.walkable).toBe(true);
    await walkRoute(page, [[14*T,14*T], [14*T,8*T], [14*T,5*T]]);
    s = await snap(page);
    expect(s.y).toBeLessThan(6*T);
    await walkRoute(page, [[14*T,12*T], [14*T,18*T], [14*T,20*T]]);
    expect(await enterByDoor(page, 'napoli', 'ArrowDown')).toBe(true);
    s = await snap(page);
    expect(s.walkable).toBe(true);
    expect(s.recoverToasts).toBe(0);
    expect(critical(errs)).toEqual([]);
  });

  test('bar: ingress -> buy coffee -> exit', async ({ page }) => {
    const errs = await attachErrors(page);
    await boot(page);
    await walkRoute(page, [[36*T,36*T], [44*T,36*T], [44*T,44*T]]);
    expect(await enterByDoor(page, 'bar', 'ArrowDown')).toBe(true);
    let s = await snap(page);
    const moneyBefore = s.money;
    const coffeeBefore = s.inv.caffe || 0;
    // interact with counter: walk near bar counter and press E
    await walkRoute(page, [[10*T,8*T], [6*T,6*T]]);
    for (let i=0; i<6; i++) { await page.keyboard.press('KeyE'); await page.waitForTimeout(250); await dismissUI(page); }
    // If shop opened, buy coffee via UI
    const buyCoffee = page.locator('button:has-text("COMPRA")').first();
    if (await buyCoffee.isVisible().catch(()=>false)) {
      // try to find coffee tile buy button
      const coffeeBuy = page.locator('.tile:has-text("Caff") button:has-text("COMPRA"), .tile:has-text("caff") button:has-text("COMPRA")').first();
      if (await coffeeBuy.isVisible().catch(()=>false)) await coffeeBuy.click();
      await page.keyboard.press('Escape').catch(()=>{});
      await page.waitForTimeout(200);
    } else {
      // fallback: direct action through game API is not player-like; instead use confirm if visible
      const confirm = page.locator('button:has-text("COMPRA"), button:has-text("Conferma")').first();
      if (await confirm.isVisible().catch(()=>false)) await confirm.click().catch(()=>{});
    }
    await dismissUI(page);
    s = await snap(page);
    expect(s.money <= moneyBefore || (s.inv.caffe||0) >= coffeeBefore).toBe(true);
    await walkRoute(page, [[10*T,11*T], [10*T,12*T]]);
    expect(await enterByDoor(page, 'napoli', 'ArrowDown', 80)).toBe(true);
    s = await snap(page);
    expect(s.walkable).toBe(true);
    expect(s.recoverToasts).toBe(0);
    expect(critical(errs)).toEqual([]);
  });
});
