import { expect } from '@playwright/test';

export const SAVE_KEY = 'campania_life_save_v1';

export async function bootNewGame(page, opts = {}) {
  await page.addInitScript((key) => { try { localStorage.removeItem(key); } catch {} }, SAVE_KEY);
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'NUOVA PARTITA' }).click();
  if (opts.name) await page.locator('input[placeholder="Antonio"]').fill(opts.name);
  if (opts.surname) await page.locator('input[placeholder="Esposito"]').fill(opts.surname);
  await page.getByRole('button', { name: "INIZIA L'AVVENTURA" }).click();
  await page.waitForFunction(() => !!(window.CL && CL.game && CL.game.player && CL.game.map));
  // Let initial frame settle; do not clear modals artificially.
  await page.waitForTimeout(300);
}

export async function attachErrorCollectors(page) {
  const errors = [];
  page.on('pageerror', e => errors.push({ type: 'pageerror', text: String(e && e.message || e) }));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push({ type: 'console', text: msg.text() });
  });
  return errors;
}

export function criticalErrors(errors) {
  return errors.filter(e => !/favicon|Failed to load resource|net::ERR|404/i.test(e.text));
}

export async function gameSnapshot(page) {
  return page.evaluate(() => {
    const G = CL.game, p = G.player, m = G.map;
    const ok = (map,x,y,w=p?.w||10,h=p?.h||8)=>!CL.maps.solidAt(map,x-w/2,y-h/2)&&!CL.maps.solidAt(map,x+w/2,y-h/2)&&!CL.maps.solidAt(map,x-w/2,y+h/2)&&!CL.maps.solidAt(map,x+w/2,y+h/2);
    return {
      map: m?.id, zone: m?.zone, x: p?.x, y: p?.y, dir: p?.dir,
      walkable: !!(m && p && ok(m,p.x,p.y,p.w,p.h)),
      money: CL.state.money,
      inventory: { ...CL.state.inventory },
      needs: { ...CL.state.needs },
      prev: CL.state.pos.prev ? { ...CL.state.pos.prev } : null,
      toasts: (CL.ui?._toasts||[]).map(t => ({ msg: t.msg||t.m||t.text||'', type: t.type })),
      modalOpen: !!CL.ui?.modalOpen || !!document.querySelector('.modal.show,.modal-backdrop.show'),
      dialogueOpen: !!CL.ui?.dialogueOpen || !!document.querySelector('.dialogue,.dialogue-box,.dlg'),
    };
  });
}

export async function tick(page, frames = 1) {
  await page.evaluate((n) => { for (let i = 0; i < n; i++) CL.game.update(1/60); }, frames);
}

export async function pressKey(page, key, ms = 120) {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
}

export async function walkTo(page, tx, ty, opts = {}) {
  const timeout = opts.timeout ?? 15000;
  const tol = opts.tol ?? 10;
  const start = Date.now();
  let lastDist = Infinity;
  let stuck = 0;
  while (Date.now() - start < timeout) {
    const st = await page.evaluate(({ tx, ty, tol }) => {
      const G = CL.game, p = G.player;
      const dx = tx - p.x, dy = ty - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= tol) return { done: true, dist, x: p.x, y: p.y, map: G.map.id };
      // Prefer axis movement like keyboard
      CL.input.down = {};
      if (Math.abs(dx) > Math.abs(dy)) CL.input.down[dx < 0 ? 'ArrowLeft' : 'ArrowRight'] = true;
      else CL.input.down[dy < 0 ? 'ArrowUp' : 'ArrowDown'] = true;
      // also set WASD aliases used by engine if any
      if (CL.input.down.ArrowLeft) CL.input.down.left = true;
      if (CL.input.down.ArrowRight) CL.input.down.right = true;
      if (CL.input.down.ArrowUp) CL.input.down.up = true;
      if (CL.input.down.ArrowDown) CL.input.down.down = true;
      for (let i = 0; i < 6; i++) G.update(1/60);
      CL.input.down = {};
      return { done: false, dist, x: p.x, y: p.y, map: G.map.id };
    }, { tx, ty, tol });
    if (st.done) return st;
    if (Math.abs(st.dist - lastDist) < 0.5) stuck++; else stuck = 0;
    lastDist = st.dist;
    if (stuck > 60) {
      // small detour attempt
      await page.evaluate(() => {
        const G=CL.game,p=G.player; const dirs=[['left','ArrowLeft'],['right','ArrowRight'],['up','ArrowUp'],['down','ArrowDown']];
        const d=dirs[Math.floor(Math.random()*dirs.length)];
        CL.input.down={}; CL.input.down[d[0]]=true; CL.input.down[d[1]]=true;
        for(let i=0;i<20;i++) G.update(1/60); CL.input.down={};
      });
      stuck = 0;
    }
  }
  return page.evaluate(({ tx, ty }) => ({ done:false, x:CL.game.player.x,y:CL.game.player.y,tx,ty,map:CL.game.map.id }), { tx, ty });
}

export async function walkPath(page, points, opts) {
  const res = [];
  for (const [x,y] of points) res.push(await walkTo(page, x, y, opts));
  return res;
}

export async function waitForMap(page, mapId, timeout = 10000) {
  await page.waitForFunction((id) => window.CL?.game?.map?.id === id, mapId, { timeout });
}

export async function clickByText(page, text, opts = {}) {
  const loc = page.getByText(text, { exact: opts.exact ?? false }).last();
  await loc.click({ timeout: opts.timeout ?? 5000 });
}
