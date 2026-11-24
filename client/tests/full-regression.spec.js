import { test, expect } from '@playwright/test';

const SAVE_KEY = 'campania_life_save_v1';

async function attachErrors(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(`pageerror:${e.message}\n${e.stack||''}`));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(`console:${msg.text()}`); });
  page.on('requestfailed', r => { const u=r.url(); if(/localhost|127\.0\.0\.1/.test(u)) errors.push(`requestfailed:${u}:${r.failure()?.errorText}`); });
  return errors;
}
function critical(errors) {
  return errors.filter(e => !/favicon|DevTools|source map|Failed to load resource.*favicon/i.test(e));
}

async function boot(page, { reset=true } = {}) {
  if (reset) await page.addInitScript((k)=>{try{localStorage.removeItem(k)}catch{}}, SAVE_KEY);
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  if (reset) {
    await page.evaluate((k)=>{try{localStorage.removeItem(k)}catch{}}, SAVE_KEY);
    await page.reload({ waitUntil: 'domcontentloaded' });
  }
  const hasNew = await page.getByRole('button', { name: 'NUOVA PARTITA' }).isVisible().catch(()=>false);
  if (hasNew) {
    await page.getByRole('button', { name: 'NUOVA PARTITA' }).click();
    await page.getByRole('button', { name: "INIZIA L'AVVENTURA" }).click();
  } else {
    const cont = page.getByRole('button', { name: /CONTINUA|CARICA|RIPRENDI/i }).first();
    if (await cont.isVisible().catch(()=>false)) await cont.click();
  }
  await page.waitForFunction(() => !!(window.CL?.game?.player && window.CL?.game?.map && window.CL?.state));
  await page.waitForTimeout(500);
}

async function snap(page) {
  return page.evaluate(() => {
    const G=CL.game,p=G.player,m=G.map;
    const ok=(map,x,y,w=p?.w||10,h=p?.h||8)=>!CL.maps.solidAt(map,x-w/2,y-h/2)&&!CL.maps.solidAt(map,x+w/2,y-h/2)&&!CL.maps.solidAt(map,x-w/2,y+h/2)&&!CL.maps.solidAt(map,x+w/2,y+h/2);
    const toasts=(CL.ui?._toasts||[]).slice(-20).map(t=>({msg:String(t.msg||t.m||t.text||''), type:t.type, at:t.at||t.time||null}));
    return {
      map:m?.id, zone:m?.zone, name:m?.name, x:p?.x, y:p?.y, dir:p?.dir, w:p?.w, h:p?.h,
      walkable:!!(m&&p&&ok(m,p.x,p.y,p.w,p.h)),
      money:CL.state.money, inv:{...CL.state.inventory}, needs:{...CL.state.needs},
      prev:CL.state.pos.prev?{...CL.state.pos.prev}:null,
      toasts, modalOpen: !!document.querySelector('.modal-overlay,.modal.show,.phone-open,.dialogue-open'),
      bodyText: document.body.innerText.slice(0,4000),
    };
  });
}

async function dismissPlayerUI(page) {
  // player-like dismissals only
  for (let i=0;i<4;i++) {
    const btn = page.locator('button').filter({ hasText: /^(Chiudi|Continua|OK|Ok|Esci|Annulla|No|Indietro)$/ }).first();
    if (await btn.isVisible().catch(()=>false)) { await btn.click({timeout:1000}).catch(()=>{}); await page.waitForTimeout(180); }
    else { await page.keyboard.press('Escape').catch(()=>{}); await page.waitForTimeout(120); }
  }
}

async function walkTo(page, tx, ty, opts={}) {
  const timeout = opts.timeout ?? 25000;
  const tol = opts.tol ?? 12;
  const start = Date.now();
  let stuck=0, last=null;
  while (Date.now() - start < timeout) {
    await dismissPlayerUI(page);
    const s = await snap(page);
    const dx = tx-s.x, dy = ty-s.y;
    const d = Math.hypot(dx,dy);
    if (d <= tol) return { ok:true, ...s, dist:d };
    const key = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'ArrowLeft':'ArrowRight') : (dy < 0 ? 'ArrowUp':'ArrowDown');
    await page.keyboard.down(key);
    await page.waitForTimeout(opts.stepMs ?? 90);
    await page.keyboard.up(key);
    const s2 = await snap(page);
    if (last && Math.hypot(s2.x-last.x,s2.y-last.y) < 0.5) stuck++; else stuck=0;
    last = s2;
    if (stuck > 45) {
      // simple detour
      const detour = Math.abs(dx) > Math.abs(dy) ? (s2.y < ty ? 'ArrowDown':'ArrowUp') : (s2.x < tx ? 'ArrowRight':'ArrowLeft');
      await page.keyboard.down(detour); await page.waitForTimeout(180); await page.keyboard.up(detour);
      stuck = 0;
    }
  }
  const s = await snap(page);
  return { ok:false, ...s, tx, ty, dist:Math.hypot(tx-s.x,ty-s.y) };
}

async function walkRoute(page, points, opts={}) {
  const out=[];
  for (const [x,y] of points) {
    const r = await walkTo(page,x,y,opts);
    out.push(r);
    expect(r.ok, `route point ${x},${y} failed at ${r.x},${r.y} map=${r.map}`).toBeTruthy();
  }
  return out;
}

async function waitForMap(page, id, timeout=15000) {
  await page.waitForFunction((m)=>window.CL?.game?.map?.id===m, id, {timeout});
}

async function ensureMoney(page, amount) {
  await page.evaluate((a)=>{ if(CL.state.money < a) CL.state.money = a; CL.ui.refresh?.(); }, amount);
}

function noRecoverToast(snapshots) {
  return snapshots.flatMap(s=>s.toasts||[]).filter(t=>/Cambio zona recuperato/i.test(t.msg));
}

test.describe('Campania Life regression', () => {
  test('boot creates save and walkable spawn', async ({ page }) => {
    const errs = await attachErrors(page);
    await boot(page);
    const s = await snap(page);
    expect(s.map).toBe('napoli');
    expect(s.walkable).toBe(true);
    expect(await page.evaluate(()=>!!localStorage.getItem('campania_life_save_v1'))).toBe(true);
    expect(critical(errs)).toEqual([]);
  });

  test('all known interior entrances/exits by real walking', async ({ page }) => {
    test.setTimeout(300000);
    const errs = await attachErrors(page);
    await boot(page);
    const targets = [
      { id:'casa_nonna', route:[[36*16,28*16],[20*16,28*16],[20*16,16*16]], enterKey:'ArrowUp', exitRoute:[[14*16,18*16],[14*16,20*16]], exitKey:'ArrowDown', expectOut:'napoli' },
      { id:'bar', route:[[36*16,36*16],[44*16,36*16],[44*16,44*16]], enterKey:'ArrowDown', exitRoute:[[10*16,11*16],[10*16,12*16]], exitKey:'ArrowDown', expectOut:'napoli' },
      { id:'pizzeria', route:[[36*16,36*16],[38*16,46*16]], enterKey:'ArrowUp', exitRoute:[[11*16,12*16],[11*16,13*16]], exitKey:'ArrowDown', expectOut:'napoli' },
      { id:'metro', route:[[36*16,28*16],[56*16,28*16],[56*16,22*16]], enterKey:'ArrowUp', exitRoute:[[12*16,13*16],[12*16,14*16]], exitKey:'ArrowDown', expectOut:'napoli' },
      { id:'negozio', route:[[36*16,36*16],[39*16,36*16]], enterKey:'ArrowUp', exitRoute:[[9*16,9*16],[9*16,10*16]], exitKey:'ArrowDown', expectOut:'napoli' },
      { id:'banca', route:[[36*16,36*16],[31*16,44*16]], enterKey:'ArrowDown', exitRoute:[[8*16,9*16],[8*16,10*16]], exitKey:'ArrowDown', expectOut:'napoli' },
      { id:'clinica', route:[[36*16,36*16],[17*16,44*16]], enterKey:'ArrowDown', exitRoute:[[9*16,9*16],[9*16,10*16]], exitKey:'ArrowDown', expectOut:'napoli' },
      { id:'ufficio', route:[[36*16,28*16],[59*16,28*16]], enterKey:'ArrowUp', exitRoute:[[9*16,9*16],[9*16,10*16]], exitKey:'ArrowDown', expectOut:'napoli' },
    ];

    for (const t of targets) {
      await page.goto('./', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(()=>!!window.CL?.game?.player);
      // go to napoli spawn by real walk from current pos? simpler: reload continue save
      await page.evaluate(()=>{ CL.maps.cache={}; });
      await page.reload({ waitUntil:'domcontentloaded' });
      await page.getByRole('button', { name: /CONTINUA|NUOVA PARTITA/i }).first().click();
      if (await page.getByRole('button', { name: "INIZIA L'AVVENTURA" }).isVisible().catch(()=>false)) await page.getByRole('button', { name: "INIZIA L'AVVENTURA" }).click();
      await page.waitForFunction(()=>!!window.CL?.game?.player);
      await page.waitForTimeout(400);
      // normalize to napoli spawn through natural path: if not napoli, try to exit
      let s = await snap(page);
      if (s.map !== 'napoli') {
        // best effort: continue from save in napoli by starting fresh for this subtest
        await page.evaluate((k)=>localStorage.removeItem(k), SAVE_KEY);
        await boot(page);
        s = await snap(page);
      }
      await walkRoute(page, t.route, { timeout:25000 });
      for(let i=0;i<50 && (await snap(page)).map!==t.id;i++){
        await dismissPlayerUI(page);
        await page.keyboard.down(t.enterKey); await page.waitForTimeout(90); await page.keyboard.up(t.enterKey);
      }
      s = await snap(page);
      expect(s.map, `enter ${t.id}`).toBe(t.id);
      expect(s.walkable, `walkable in ${t.id}`).toBe(true);
      await walkRoute(page, t.exitRoute, { timeout:25000 });
      for(let i=0;i<60 && (await snap(page)).map===t.id;i++){
        await dismissPlayerUI(page);
        await page.keyboard.down(t.exitKey); await page.waitForTimeout(90); await page.keyboard.up(t.exitKey);
      }
      s = await snap(page);
      expect(s.map, `exit ${t.id}`).toBe(t.expectOut);
      expect(s.walkable, `walkable after exit ${t.id}`).toBe(true);
    }
    expect(critical(errs)).toEqual([]);
  });
});
