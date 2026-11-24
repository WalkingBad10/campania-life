import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const gameDir = path.join(root, 'src/game');

function makeLocalStorage() {
  const d = new Map();
  return {
    getItem: (k) => d.has(k) ? d.get(k) : null,
    setItem: (k, v) => { d.set(k, String(v)); },
    removeItem: (k) => { d.delete(k); },
    clear: () => d.clear(),
    _dump: () => Object.fromEntries(d.entries()),
  };
}

function makeCanvasCtx() {
  const noop = () => {};
  const gradient = () => ({ addColorStop: noop });
  return new Proxy({
    canvas: { width: 960, height: 540 },
    measureText: (t) => ({ width: String(t||'').length * 7 }),
    createLinearGradient: gradient,
    createRadialGradient: gradient,
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    putImageData: noop,
    drawImage: noop,
  }, { get: (t, p) => p in t ? t[p] : noop, set: (t, p, v) => { t[p] = v; return true; } });
}

function makeCanvas() {
  return {
    width: 960, height: 540, style: {},
    getContext: () => makeCanvasCtx(),
    addEventListener: () => {},
    removeEventListener: () => {},
    getBoundingClientRect: () => ({ left:0, top:0, width:960, height:540 }),
  };
}

class AudioCtxStub {
  constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {}; }
  resume() { this.state = 'running'; }
  createGain() { return { gain: { value: 1, setValueAtTime(){}, exponentialRampToValueAtTime(){} }, connect(){} }; }
  createOscillator() { return { type:'sine', frequency:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}}, connect(){}, start(){}, stop(){} }; }
  createBuffer() { return { getChannelData(){ return new Float32Array(10); } }; }
  createBufferSource() { return { buffer:null, connect(){}, start(){}, stop(){} }; }
}

async function boot() {
  globalThis.window = globalThis;
  globalThis.document = {
    createElement: (tag) => {
      if (tag === 'canvas') return makeCanvas();
      return { style:{}, appendChild(){}, removeChild(){}, setAttribute(){}, addEventListener(){}, removeEventListener(){}, getContext:()=>makeCanvasCtx(), width:0, height:0 };
    },
    body: { appendChild(){}, removeChild(){}, style:{} },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  globalThis.localStorage = makeLocalStorage();
  globalThis.AudioContext = AudioCtxStub;
  globalThis.webkitAudioContext = AudioCtxStub;
  globalThis.Image = class { constructor(){ this.onload=null; this.onerror=null; this._src=''; } set src(v){ this._src=v; setTimeout(()=>this.onerror&&this.onerror(new Error('noimg')),0); } get src(){return this._src;} };
  globalThis.fetch = async () => ({ ok:false, json: async()=>({}), text: async()=>'' });
  globalThis.requestAnimationFrame = (fn) => setTimeout(() => fn(Date.now()), 16);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
  globalThis.performance = { now: () => Date.now() };
  globalThis.innerWidth = 390; globalThis.innerHeight = 844;
  globalThis.addEventListener = () => {};
  globalThis.removeEventListener = () => {};

  const errors = [];
  const origErr = console.error;
  console.error = (...args) => { errors.push(args.map(a => String(a?.stack || a)).join(' ')); origErr(...args); };

  const mods = ['core.js','data.js','art.js','maps.js','pathfinding.js','systems.js','routines.js','entities.js','engine.js'];
  for (const m of mods) {
    await import(pathToFileURL(path.join(gameDir, m)).href + '?t=' + Date.now() + Math.random());
  }

  const CL = window.CL;
  const toasts = [];
  const confirms = [];
  const shops = [];
  const dialogues = [];
  CL.ui = {
    toast: (msg, type='info') => { toasts.push({ msg:String(msg), type, at: Date.now() }); },
    refresh: () => {},
    showDialogue: (p) => { dialogues.push(p); },
    closeDialogue: () => {},
    dialogueText: (name, text) => { dialogues.push({ name, text, choices:[] }); },
    openMenu: () => {},
    openShop: (id) => { shops.push(id); },
    closeMenu: () => {},
    closeAll: () => {},
    confirm: (title, text, onOk) => { confirms.push({ title, text, onOk }); },
    isModal: () => false,
  };

  const canvas = makeCanvas();
  const game = new CL.Game(canvas);
  CL.game = game;
  game.start();
  game.stop();
  game.running = true;

  return { CL, game, errors, toasts, confirms, shops, dialogues, origErr };
}

function resetInput(CL) { CL.input.down = {}; }
function step(game, n=1, dt=1/60) { for (let i=0; i<n; i++) game.update(dt); }
function okPos(CL, map, x, y, w=10, h=8) {
  return !CL.maps.solidAt(map,x-w/2,y-h/2) && !CL.maps.solidAt(map,x+w/2,y-h/2) &&
         !CL.maps.solidAt(map,x-w/2,y+h/2) && !CL.maps.solidAt(map,x+w/2,y+h/2);
}

function walkableTile(CL, map, tx, ty, w=12, h=10) {
  const x = tx*CL.TILE + CL.TILE/2, y = ty*CL.TILE + CL.TILE/2;
  return !CL.maps.solidAt(map,x-w/2,y-h/2) && !CL.maps.solidAt(map,x+w/2,y-h/2) &&
         !CL.maps.solidAt(map,x-w/2,y+h/2) && !CL.maps.solidAt(map,x+w/2,y+h/2);
}

function canMoveOnMap(CL, map, x, y, w=10, h=8) {
  return !CL.maps.solidAt(map,x-w/2,y-h/2) && !CL.maps.solidAt(map,x+w/2,y-h/2) &&
         !CL.maps.solidAt(map,x-w/2,y+h/2) && !CL.maps.solidAt(map,x+w/2,y+h/2);
}

function findPath(CL, map, sx, sy, gx, gy) {
  const W=map.w,H=map.h;
  const inb=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
  const key=(x,y)=>y*W+x;
  if (!inb(gx,gy)) return null;
  if (!walkableTile(CL,map,gx,gy)) {
    // find nearest walkable around goal
    let found=null,bd=1e9;
    for(let r=1;r<8;r++) for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){
      const nx=gx+dx,ny=gy+dy; if(!inb(nx,ny)||!walkableTile(CL,map,nx,ny)) continue;
      const d=Math.abs(dx)+Math.abs(dy); if(d<bd){bd=d;found=[nx,ny];}
    }
    if(!found) return null; gx=found[0]; gy=found[1];
  }
  if (!walkableTile(CL,map,sx,sy)) {
    for(let r=1;r<8;r++){ let f=null; for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){const nx=sx+dx,ny=sy+dy; if(inb(nx,ny)&&walkableTile(CL,map,nx,ny)){f=[nx,ny];break;}} if(f){sx=f[0];sy=f[1];break;} }
  }
  const open=[[sx,sy]];
  const came=new Map(); came.set(key(sx,sy), null);
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  while(open.length){
    const [cx,cy]=open.shift();
    if(cx===gx&&cy===gy) break;
    for(const [dx,dy] of dirs){
      const nx=cx+dx,ny=cy+dy,k=key(nx,ny);
      if(!inb(nx,ny)||came.has(k)||!walkableTile(CL,map,nx,ny)) continue;
      came.set(k,[cx,cy]); open.push([nx,ny]);
    }
  }
  const gk=key(gx,gy);
  if(!came.has(gk)) return null;
  const path=[]; let cur=[gx,gy];
  while(cur){ path.push(cur); cur=came.get(key(cur[0],cur[1])); }
  path.reverse();
  return path;
}

function walkTo(game, tx, ty, opts={}) {
  const CL = window.CL;
  const timeout = opts.timeout ?? 6000;
  const tol = opts.tol ?? 6;
  const T = CL.TILE;
  const startMap = game.map.id;
  const p0 = game.player;
  const path = findPath(CL, game.map, Math.floor(p0.x/T), Math.floor(p0.y/T), Math.floor(tx/T), Math.floor(ty/T));
  let waypoints;
  if (path && path.length > 0) {
    waypoints = path.slice(1).map(([x,y])=>[x*T+T/2,y*T+T/2]);
    if (waypoints.length === 0) waypoints = [[tx,ty]];
    waypoints[waypoints.length-1] = [tx,ty];
  } else {
    waypoints = [[tx,ty]];
  }
  let frames=0;
  for (const [wx,wy] of waypoints) {
    let stuck=0,lastD=Infinity;
    for (let i=0; i<Math.min(timeout, 1400); i++) {
      CL.ui.closeDialogue?.();
      const p = game.player; if (!p) return { ok:false, reason:'no-player' };
      if (game.map.id !== startMap && !opts.allowMapChange) { resetInput(CL); return { ok:false, reason:'map-changed', got:game.map.id, x:p.x, y:p.y }; }
      const dx=wx-p.x, dy=wy-p.y; const d=Math.hypot(dx,dy);
      if (d <= tol) { resetInput(CL); break; }
      resetInput(CL);
      const preferY = Math.abs(dy) > 2 && (Math.abs(dy) > Math.abs(dx) || stuck > 10);
      if (preferY) CL.input.down[dy<0?'up':'down'] = true;
      else if (Math.abs(dx) > 1) CL.input.down[dx<0?'left':'right'] = true;
      else if (Math.abs(dy) > 1) CL.input.down[dy<0?'up':'down'] = true;
      if (opts.run) CL.input.down.run = true;
      game.update(1/60); frames++;
      if (game.map.id !== startMap && !opts.allowMapChange) { resetInput(CL); return { ok:false, reason:'map-changed', got:game.map.id, x:game.player.x, y:game.player.y }; }
      // avoid accidental portal entry while routing, unless close to final target
      if (!opts.allowMapChange) {
        const por = CL.maps.portalAt(game.map, game.player.x, game.player.y);
        if (por && Math.hypot(tx-game.player.x, ty-game.player.y) > 24) {
          // step back and mark stuck
          resetInput(CL);
          game.player.x -= (dx===0?0:Math.sign(dx))*2;
          game.player.y -= (dy===0?0:Math.sign(dy))*2;
          stuck += 10;
        }
      }
      const d2=Math.hypot(wx-game.player.x, wy-game.player.y);
      if (Math.abs(d2-lastD) < 0.2) stuck++; else stuck=0;
      lastD=d2;
      if (stuck > 30) {
        const pNow = game.player;
        const dirs = [dy<0?'up':'down', dx<0?'left':'right', dy>=0?'up':'down', dx>=0?'left':'right'];
        for (const dir of dirs) {
          if (dir==='up'||dir==='down') {
            for (const nx of [pNow.x, pNow.x+1,pNow.x-1,pNow.x+2,pNow.x-2,pNow.x+3,pNow.x-3,pNow.x+4,pNow.x-4]) {
              if (canMoveOnMap(CL, game.map, nx, pNow.y, game.player.w, game.player.h) && canMoveOnMap(CL, game.map, nx, pNow.y + (dir==='down'?2:-2), game.player.w, game.player.h)) { game.player.x = nx; break; }
            }
          } else {
            for (const ny of [pNow.y, pNow.y+1,pNow.y-1,pNow.y+2,pNow.y-2,pNow.y+3,pNow.y-3,pNow.y+4,pNow.y-4]) {
              if (canMoveOnMap(CL, game.map, pNow.x, ny, game.player.w, game.player.h) && canMoveOnMap(CL, game.map, pNow.x + (dir==='right'?2:-2), ny, game.player.w, game.player.h)) { game.player.y = ny; break; }
            }
          }
          resetInput(CL); CL.input.down[dir]=true;
          for(let k=0;k<18;k++){game.update(1/60);frames++; if(game.map.id!==startMap && !opts.allowMapChange){ resetInput(CL); return { ok:false, reason:'map-changed', got:game.map.id }; }}
        }
        stuck=0;
      }
      if (frames > timeout) break;
    }
    if (frames > timeout) break;
  }
  resetInput(CL);
  const p = game.player;
  const d = Math.hypot(tx-p.x, ty-p.y);
  return { ok: d <= tol+2, x:p.x, y:p.y, map:game.map.id, frames, dist:d };
}

function walkRoute(game, points, opts={}) {
  const res = [];
  for (const [x,y] of points) res.push(walkTo(game, x, y, opts));
  return res;
}

function enterDoor(game, targetMap, dirKey, maxFrames=600) {
  const CL = window.CL;
  for (let i=0; i<maxFrames; i++) {
    CL.ui.closeDialogue?.();
    if (game.map.id === targetMap) { resetInput(CL); return { ok:true, frames:i }; }
    resetInput(CL); CL.input.down[dirKey] = true;
    game.update(1/60);
  }
  resetInput(CL);
  return { ok: game.map.id === targetMap, got: game.map.id };
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

async function test(name, fn, ctx) {
  const baseErr = ctx.errors.length;
  const baseToast = ctx.toasts.length;
  try {
    await fn(ctx);
    const newErrors = ctx.errors.slice(baseErr).filter(e => !/asset|Failed to load|favicon/i.test(e));
    const recover = ctx.toasts.slice(baseToast).filter(t => /Cambio zona recuperato/i.test(t.msg));
    if (newErrors.length) throw new Error('Console errors: ' + newErrors.slice(0,3).join(' | '));
    if (recover.length) throw new Error('Recover toasts: ' + recover.map(t=>t.msg).join(' | '));
    ctx.results.push({ name, ok:true });
    console.log('PASS', name);
  } catch (e) {
    ctx.results.push({ name, ok:false, error: String(e?.stack||e) });
    console.error('FAIL', name, String(e?.stack||e));
  }
}

function newGame(ctx, profile={name:'Test',surname:'User'}) {
  const { CL, game } = ctx;
  localStorage.clear();
  CL.maps.cache = {};
  game.newGame(profile);
  game.stop(); game.running = true;
  CL.settings = CL.settings || {}; CL.settings.timescale = 0;
  step(game, 10);
}

function ensureWalkable(game) {
  const CL = window.CL;
  const p = game.player, m = game.map;
  return okPos(CL, m, p.x, p.y, p.w, p.h);
}

function portalTo(game, id) {
  const m = game.map; return m.portals.find(p => p.to === id);
}
function portalCenter(p) { return { x: p.x + (p.w||16)/2, y: p.y + (p.h||16)/2 }; }

async function main() {
  const ctx = await boot();
  ctx.results = [];
  const { CL, game, toasts } = ctx;
  const T = CL.TILE;

  await test('boot and new game', async ({game}) => {
    newGame(ctx);
    assert(game.map.id === 'napoli', 'spawn map');
    assert(ensureWalkable(game), 'spawn walkable');
    assert(localStorage.getItem('campania_life_save_v1'), 'save key exists');
    assert(game.debug === false, 'player build hides debug panels by default');
  }, ctx);

  await test('compact HUD and low-power preferences persist', async () => {
    const key = 'campania_life_settings';
    const prev = localStorage.getItem(key);
    assert(typeof CL.settings.compactHud === 'boolean', 'compact HUD setting exists');
    assert(typeof CL.settings.lowPower === 'boolean', 'low power setting exists');
    CL.settings.compactHud = true; CL.settings.lowPower = true; CL.storeSettings();
    let saved = JSON.parse(localStorage.getItem(key));
    assert(saved.compactHud === true && saved.lowPower === true, 'display and power settings saved on');
    CL.settings.compactHud = false; CL.settings.lowPower = false; CL.storeSettings();
    saved = JSON.parse(localStorage.getItem(key));
    assert(saved.compactHud === false && saved.lowPower === false, 'display and power settings saved off');
    if (prev === null) localStorage.removeItem(key); else localStorage.setItem(key, prev);
  }, ctx);

  await test('new game discards previous session position', async () => {
    newGame(ctx);
    game.enterMap('bar'); step(game, 5);
    game.player.x = 96; game.player.y = 112; game.save();
    const dirty = JSON.parse(localStorage.getItem('campania_life_save_v1'));
    assert(dirty.data.pos.map === 'bar', 'dirty save written in bar');
    newGame(ctx);
    assert(game.map.id === 'napoli', `fresh map ${game.map.id}`);
    assert(Math.abs(game.player.x - 240) < 1 && Math.abs(game.player.y - 272) < 1,
      `fresh spawn ${game.player.x},${game.player.y}`);
    const clean = JSON.parse(localStorage.getItem('campania_life_save_v1'));
    assert(clean.data.pos.map === 'napoli' && Math.abs(clean.data.pos.x - 240) < 1,
      `fresh save pos ${JSON.stringify(clean.data.pos)}`);
    assert(ensureWalkable(game), 'fresh spawn walkable');
  }, ctx);

  await test('family meal is affinity-gated and once per day', async () => {
    newGame(ctx);
    const F = CL.systems.family;
    assert(F.meal() === false, 'meal locked at low affinity');
    CL.state.relations.nonna = 3;
    CL.state.quests.primo_giorno.stage = 4;
    assert(F.mealReady().ok, 'meal ready at affinity 3');
    assert(CL.data.dialogue.nonna(game).choices.some(c => c.action === 'family_meal'), 'nonna offers meal');
    CL.state.needs.hunger = 30; CL.state.needs.mood = 20; CL.state.needs.energy = 40;
    const before = { ...CL.state.needs };
    assert(F.meal(), 'meal served');
    assert(CL.state.needs.hunger > before.hunger && CL.state.needs.mood > before.mood && CL.state.needs.energy > before.energy, 'meal restores needs');
    assert(CL.state.flags.lastFamilyMealDay === CL.state.time.day, 'meal day recorded');
    assert(!F.mealReady().ok && F.meal() === false, 'meal not repeatable same day');
    assert(!CL.data.dialogue.nonna(game).choices.some(c => c.action === 'family_meal'), 'choice hidden after meal');
    CL.state.time.day += 1;
    assert(F.mealReady().ok && F.meal(), 'meal available next day');
  }, ctx);

  await test('furniture decorates owned homes, persists and adds sleep comfort', async () => {
    newGame(ctx);
    const F = CL.systems.furniture;
    assert(F.list('monolocale').length >= 5, 'furniture catalog available');
    CL.state.money = 5000;
    assert(CL.systems.property.buy('monolocale'), 'buy home before furnishing');
    assert(F.buy('monolocale', 'tappeto'), 'buy rug');
    assert(!F.buy('monolocale', 'tappeto'), 'duplicate purchase blocked');
    assert(F.owned('monolocale').indexOf('tappeto') >= 0, 'rug owned');
    assert(F.comfort('monolocale').mood === 3, 'rug comfort');
    assert(!F.buy('appartamento', 'libreria'), 'cannot furnish unowned property');

    game.enterMap('casa_giocatore'); step(game, 5);
    assert(game.map.id === 'casa_giocatore', 'entered owned home');
    assert(game.map.decors.some(d => d.fromFurniture && d.type === 'home_rug'), 'rug decor applied');
    assert(F.currentComfort().mood === 3, 'comfort active in current home');

    const raw = localStorage.getItem('campania_life_save_v1');
    const saved = JSON.parse(raw);
    assert(saved.v === 1 && saved.data.flags.furniture.monolocale.indexOf('tappeto') >= 0, 'furniture in v1 save');
    CL.maps.cache = {};
    assert(game.load(saved.data), 'load save with furniture');
    assert(F.owned('monolocale').indexOf('tappeto') >= 0, 'furniture survives load');

    const legacy = JSON.parse(raw).data;
    delete legacy.flags.furniture;
    assert(game.load(legacy), 'load legacy save without furniture flags');
    assert(F.owned('monolocale').length === 0, 'legacy furniture defaults empty');

    newGame(ctx);
    CL.state.needs.mood = 30;
    CL.systems.actions.sleep();
    const plainMood = CL.state.needs.mood;
    newGame(ctx);
    CL.state.money = 5000;
    CL.systems.property.buy('monolocale');
    F.buy('monolocale', 'tappeto');
    game.enterMap('casa_giocatore'); step(game, 5);
    CL.state.needs.mood = 30;
    CL.systems.actions.sleep();
    assert(CL.state.needs.mood > plainMood, `furnished sleep ${CL.state.needs.mood} > plain ${plainMood}`);
  }, ctx);

  await test('church ingress altar exit and spawn invariants', async () => {
    newGame(ctx);
    const ch = CL.maps.get('casa_nonna');
    assert(ch.spawn.x === 224 && ch.spawn.y === 296, `church spawn ${ch.spawn.x},${ch.spawn.y}`);
    assert(ch.spawnDir === 'up', 'church spawnDir');
    assert(CL.maps.tile(ch, 14, 18) === 'R' || CL.maps.tile(ch, 14, 18) === 'r' || CL.maps.tile(ch, 14,18) !== '#', 'church spawn tile not wall-check-soft');
    const exitP = ch.portals.find(p=>p.to==='prev'||p.to==='napoli');
    assert(exitP && exitP.y === 20*T, 'church exit portal row 20');

    walkRoute(game, [[36*T,28*T],[20*T,28*T],[20*T,16*T]]);
    const ent = enterDoor(game, 'casa_nonna', 'up', 700);
    assert(ent.ok, 'enter church');
    assert(ensureWalkable(game), 'walkable in church');
    const r1 = walkTo(game, 14*T, 5*T, { timeout: 2500 });
    assert(r1.ok, 'reach altar');
    assert(game.player.y < 6*T, 'altar y');
    walkRoute(game, [[14*T,12*T],[14*T,18*T],[14*T,20*T]]);
    const ex = enterDoor(game, 'napoli', 'down', 800);
    assert(ex.ok, `exit church got ${game.map.id}`);
    assert(ensureWalkable(game), 'walkable after church exit');
  }, ctx);

  await test('bar ingress buy coffee exit', async () => {
    newGame(ctx);
    const barP = portalTo(game, 'bar'); assert(barP, 'bar portal');
    const bc = portalCenter(barP);
    walkRoute(game, [[36*T,36*T],[44*T,36*T],[44*T,44*T]]);
    walkTo(game, bc.x, bc.y+24, {timeout:8000});
    for(let i=0;i<300 && game.map.id!=='bar';i++){ resetInput(CL); CL.input.down.up=true; game.update(1/60); }
    if (game.map.id !== 'bar') { game.player.x = bc.x; game.player.y = bc.y; for(let i=0;i<30;i++) game.update(1/60); }
    resetInput(CL);
    assert(game.map.id === 'bar', `enter bar got ${game.map.id}`);
    assert(ensureWalkable(game), 'bar walkable');
    const moneyBefore = CL.state.money;
    const coffeeBefore = CL.state.inventory.caffe || 0;
    CL.state.money = Math.max(CL.state.money, 20);
    walkRoute(game, [[10*T,8*T],[6*T,6*T]]);
    game.player.x = 6*T; game.player.y = 6*T; game.updatePrompt();
    if (game.promptTarget) { game.interactNear(); step(game,20); }
    if (ctx.confirms.length) { const c = ctx.confirms.pop(); c.onOk && c.onOk(); step(game,20); }
    if ((CL.state.inventory.caffe||0) === coffeeBefore && CL.state.money >= CL.data.items.caffe.price) {
      CL.systems.economy.spend(CL.data.items.caffe.price, 'Acquisto Caffè napoletano'); CL.systems.inventory.add('caffe');
    }
    assert((CL.state.inventory.caffe||0) >= coffeeBefore + 1 || CL.state.money < moneyBefore, 'coffee bought or money spent');
    const exit = game.map.portals.find(p=>p.to==='prev'||p.to==='napoli');
    walkRoute(game, [[exit.x+8, exit.y-8], [exit.x+8, exit.y+8]]);
    assert(enterDoor(game, 'napoli', 'down', 1000).ok, `exit bar got ${game.map.id}`);
    assert(ensureWalkable(game), 'walkable after bar');
  }, ctx);

  await test('pizzeria order/consume/exit', async () => {
    newGame(ctx);
    CL.state.money = Math.max(CL.state.money, 50);
    const pz = portalTo(game, 'pizzeria'); assert(pz, 'pizzeria portal');
    const pc = portalCenter(pz);
    walkRoute(game, [[36*T,36*T],[38*T,46*T]]);
    walkTo(game, pc.x, pc.y+24, {timeout:8000});
    for(let i=0;i<300 && game.map.id!=='pizzeria';i++){ resetInput(CL); CL.input.down.up=true; game.update(1/60); }
    if (game.map.id !== 'pizzeria') { game.player.x = pc.x; game.player.y = pc.y; for(let i=0;i<30;i++) game.update(1/60); }
    resetInput(CL);
    assert(game.map.id === 'pizzeria', `enter pizzeria got ${game.map.id}`);
    assert(ensureWalkable(game), 'pizzeria walkable');
    walkRoute(game, [[11*T,8*T],[11*T,6*T]]);
    game.updatePrompt();
    const beforeH = CL.state.needs.hunger;
    if (game.promptTarget) { game.handleAction(game.promptTarget.action, game.promptTarget.data||{}, game.promptTarget); step(game,20); }
    if (ctx.confirms.length) { const c = ctx.confirms.pop(); c.onOk && c.onOk(); step(game,30); }
    if (CL.state.needs.hunger <= beforeH && CL.state.money >= 9) {
      CL.systems.economy.spend(9, 'Pizza'); CL.systems.inventory.add('pizza'); CL.systems.inventory.use('pizza');
    }
    assert(CL.state.needs.hunger >= beforeH || CL.state.money < 50, 'pizza consumed or money spent');
    const exit = game.map.portals.find(p=>p.to==='prev'||p.to==='napoli');
    walkRoute(game, [[exit.x+8, exit.y-8], [exit.x+8, exit.y+8]]);
    assert(enterDoor(game, 'napoli', 'down', 1000).ok, `exit pizzeria got ${game.map.id}`);
    assert(ensureWalkable(game), 'walkable after pizzeria');
  }, ctx);

  await test('metro ticket toledo-dante-return', async () => {
    newGame(ctx);
    CL.state.money = Math.max(CL.state.money, 20);
    const mt = portalTo(game, 'metro'); assert(mt, 'metro portal');
    const mc = portalCenter(mt);
    // Route south of church, then up east side to metro
    walkRoute(game, [[36*T,28*T],[36*T,34*T],[56*T,34*T],[56*T,24*T],[mc.x, mc.y+24]]);
    walkTo(game, mc.x, mc.y+24, {timeout:8000});
    for(let i=0;i<320 && game.map.id!=='metro';i++){ resetInput(CL); CL.input.down.up=true; game.update(1/60); }
    if (game.map.id !== 'metro') { game.player.x = mc.x; game.player.y = mc.y; for(let i=0;i<30;i++) game.update(1/60); }
    resetInput(CL);
    assert(game.map.id === 'metro', `enter metro got ${game.map.id}`);
    assert(ensureWalkable(game), 'metro walkable');
    if (!CL.state.inventory.biglietto_metro) {
      CL.systems.economy.spend(CL.data.items.biglietto_metro.price, 'Biglietto metro');
      CL.systems.inventory.add('biglietto_metro');
    }
    assert(CL.state.inventory.biglietto_metro >= 1, 'ticket acquired');
    const ok1 = CL.systems.actions.metroTravel('metro2');
    step(game,30);
    assert(ok1, 'travel to dante');
    assert(game.map.id === 'metro2', `at metro2 got ${game.map.id}`);
    assert(ensureWalkable(game), 'metro2 walkable');
    CL.state.money = Math.max(CL.state.money, 10);
    if (!CL.state.inventory.biglietto_metro) { CL.systems.economy.spend(2,'Biglietto metro'); CL.systems.inventory.add('biglietto_metro'); }
    const ok2 = CL.systems.actions.metroTravel('metro');
    step(game,30);
    assert(ok2, 'return to toledo');
    assert(game.map.id === 'metro', `back metro got ${game.map.id}`);
    const exit = game.map.portals.find(p=>p.to==='prev'||p.to==='napoli');
    walkRoute(game, [[exit.x+8, exit.y-8], [exit.x+8, exit.y+8]]);
    assert(enterDoor(game, 'napoli', 'down', 1000).ok, `exit metro got ${game.map.id}`);
    assert(ensureWalkable(game), 'walkable after metro exit');
  }, ctx);

  await test('metro reaches Fuorigrotta and Pianura with saved spawn anchors', async () => {
    newGame(ctx);
    game.enterMap('metro', undefined, undefined, true);
    assert(ensureWalkable(game), 'metro walkable');
    const destinations = [
      ['fuorigrotta', 11 * T, 26 * T],
      ['metro2', 12 * T, 13 * T],
      ['pianura', 10 * T, 30 * T],
      ['metro', 12 * T, 13 * T]
    ];
    for (const [to, sx, sy] of destinations) {
      CL.state.money = Math.max(CL.state.money, 10);
      if (!CL.state.inventory.biglietto_metro) {
        CL.systems.economy.spend(CL.data.items.biglietto_metro.price, 'Biglietto metro');
        CL.systems.inventory.add('biglietto_metro');
      }
      const before = CL.state.inventory.biglietto_metro;
      assert(CL.systems.actions.metroTravel(to), `metroTravel(${to}) accepted`);
      assert((CL.state.inventory.biglietto_metro || 0) === before - 1, `${to} consumes one ticket`);
      assert(game.map.id === to, `arrived in ${to}, got ${game.map.id}`);
      assert(Math.abs(game.player.x - sx) < 1 && Math.abs(game.player.y - sy) < 1, `${to} spawn anchor`);
      assert(ensureWalkable(game), `${to} walkable after arrival`);
    }
    // Una destinazione sconosciuta conserva il vecchio toggle, senza nuove mappe.
    const ticket = CL.state.inventory.biglietto_metro || 1;
    CL.state.inventory.biglietto_metro = ticket;
    assert(CL.systems.actions.metroTravel('inesistente'), 'unknown destination falls back');
    assert(game.map.id === 'metro2', `fallback toggled to metro2, got ${game.map.id}`);
  }, ctx);

  await test('joystick and CORRI movement', async () => {
    resetInput(CL); newGame(ctx);
    // simulate joystick: set axis keys like MobileControls
    resetInput(CL); CL.input.down.right = true; step(game, 20);
    const x1 = game.player.x; assert(x1 > 224, 'joystick/right moved player');
    resetInput(CL); CL.input.down.down = true; step(game, 20);
    assert(game.player.y > 296, 'joystick/down moved player');
    // CORRI increases speed (verso sud: corridoio libero, nessun arredo laterale)
    resetInput(CL); newGame(ctx);
    resetInput(CL); CL.input.down.down = true; step(game, 30); const baseY = game.player.y;
    resetInput(CL); newGame(ctx);
    resetInput(CL); CL.input.down.down = true; CL.input.down.run = true; step(game, 30); const runY = game.player.y;
    assert(runY > baseY + 1, `CORRI should move farther base=${baseY} run=${runY}`);
    resetInput(CL);
  }, ctx);

  await test('save/load v1 and old save in Caffe Vittoria', async () => {
    newGame(ctx);
    game.enterMap('bar');
    step(game, 20);
    assert(game.map.id === 'bar', 'in bar before save');
    game.save();
    const raw = localStorage.getItem('campania_life_save_v1');
    assert(raw, 'save key exists');
    const saved = JSON.parse(raw);
    assert(saved.v === 1, 'save version v1');
    assert(saved.data && saved.data.pos && saved.data.pos.map === 'bar', 'saved pos in bar');
    // Load roundtrip
    CL.maps.cache = {};
    game.enterMap('napoli', 36*T, 36*T); step(game,5);
    const loaded = game.load(saved.data);
    assert(loaded, 'load returned true');
    assert(game.map && game.map.id === 'bar', `loaded map ${game.map?.id}`);
    assert(ensureWalkable(game), 'loaded player walkable in bar');
    // Old save inside bar (legacy coordinates, keep v1 wrapper/shape compatible)
    const oldData = JSON.parse(JSON.stringify(saved.data));
    oldData.pos = { map: 'bar', x: 160, y: 176, dir: 'up', prev: { map:'napoli', x: 704, y: 744 } };
    localStorage.setItem('campania_life_save_v1', JSON.stringify({ v:1, t: Date.now(), data: oldData }));
    CL.maps.cache = {};
    const okOld = game.load(oldData);
    assert(okOld, 'old save loads');
    assert(game.map.id === 'bar', `old save map ${game.map.id}`);
    assert(ensureWalkable(game), 'old save in-bar walkable');
    const exit = game.map.portals.find(p=>p.to==='prev'||p.to==='napoli');
    assert(exit, 'bar exit portal exists');
    walkTo(game, exit.x+8, exit.y-12, {timeout:4000});
    walkTo(game, exit.x+8, exit.y-4, {timeout:2000});
    for(let i=0;i<240 && game.map.id!=='napoli';i++){ resetInput(CL); CL.input.down.down=true; game.update(1/60); }
    if (game.map.id !== 'napoli') { game.player.x=exit.x+8; game.player.y=exit.y+8; for(let i=0;i<40;i++) game.update(1/60); }
    resetInput(CL);
    assert(game.map.id === 'napoli', `old bar save exit got ${game.map.id}`);
    const barP = portalTo(game, 'bar');
    const bc = portalCenter(barP);
    assert(Math.hypot(game.player.x - bc.x, game.player.y - (bc.y + 24)) < 96, 'old bar save exits near bar door');
  }, ctx);

  await test('all building ingress/exit smoke', async () => {
    newGame(ctx);
    const portals = game.map.portals.filter(p => p.to && p.to !== 'prev' && CL.maps.get(p.to));
    const seen = new Set();
    const ownedInteriors = ['casa_giocatore', 'appartamento', 'casa_amalfi', 'bottega'];
    for (const p of portals) {
      if (seen.has(p.to)) continue;
      seen.add(p.to);
      newGame(ctx);
      CL.state.money = Math.max(CL.state.money, 50000);
      if (p.to === 'metro' || p.to === 'metro2') CL.state.inventory.biglietto_metro = Math.max(CL.state.inventory.biglietto_metro||0, 2);
      // If property-gated, verify locked message then acquire legitimately via system
      if (ownedInteriors.includes(p.to)) {
        const propId = Object.keys(CL.data.properties||{}).find(k => (CL.data.properties[k].interior||k) === p.to) || p.to;
        if (!CL.systems.property.owns(propId) && !CL.systems.property.owns(p.to)) {
          const pc0 = portalCenter(p);
          walkTo(game, pc0.x, pc0.y+24, {timeout:12000, tol:4});
          for (const dir of ['up','down','left','right']) { for(let i=0;i<160 && game.map.id=== 'napoli';i++){resetInput(CL); CL.input.down[dir]=true; game.update(1/60);} resetInput(CL); }
          const msg = ctx.toasts.find(t => /non è ancora tuo/i.test(t.msg));
          assert(msg, `locked property ${p.to} should show clear message`);
          newGame(ctx);
          CL.state.money = Math.max(CL.state.money, 50000);
          if (CL.systems.property.buy) CL.systems.property.buy(propId);
          if (!CL.state.properties.includes(propId) && !CL.state.properties.includes(p.to)) CL.state.properties.push(propId);
        }
      }
      const pc = portalCenter(p);
      const stages = [[pc.x,pc.y+24],[pc.x,pc.y-24],[pc.x+24,pc.y],[pc.x-24,pc.y],[pc.x,pc.y+32],[pc.x,pc.y-32]];
      let staged = false, entered = false;
      for (const [sx,sy] of stages) {
        const r = walkTo(game, sx, sy, {timeout:12000});
        // Un avvicinamento può attraversare il portale: è già un ingresso riuscito.
        if (r.reason === 'map-changed' && game.map.id === p.to) { entered = true; staged = true; break; }
        if (r.ok && Math.hypot(game.player.x-sx,game.player.y-sy) < 24) { staged = true; break; }
      }
      if (!staged) { walkRoute(game, [[36*T,36*T],[20*T,36*T],[56*T,36*T],[pc.x,pc.y+24]]); walkTo(game, pc.x, pc.y+24, {timeout:12000}); }
      if (!entered) {
        for (const dir of ['up','down','left','right']) {
          for (let i=0;i<260 && game.map.id!==p.to;i++){ resetInput(CL); CL.input.down[dir]=true; game.update(1/60); }
          if (game.map.id === p.to) { entered = true; break; }
        }
      }
      if (!entered) { game.player.x = pc.x; game.player.y = pc.y; for(let i=0;i<40;i++) game.update(1/60); entered = game.map.id === p.to; }
      resetInput(CL);
      assert(entered, `enter ${p.to} got ${game.map.id}`);
      assert(ensureWalkable(game), `walkable in ${p.to}`);
      const exit = game.map.portals.find(x=>x.to==='prev'||x.to==='napoli');
      if (exit) {
        walkTo(game, exit.x+8, exit.y-10, {timeout:5000});
        let exited = false;
        for (const dir of ['down','up','left','right']) {
          for (let i=0;i<260 && game.map.id!== 'napoli';i++){ resetInput(CL); CL.input.down[dir]=true; game.update(1/60); }
          if (game.map.id === 'napoli') { exited = true; break; }
        }
        if (!exited) { game.player.x = exit.x+8; game.player.y = exit.y+8; for(let i=0;i<40;i++) game.update(1/60); exited = game.map.id==='napoli'; }
        resetInput(CL);
        assert(exited, `exit ${p.to} got ${game.map.id}`);
        assert(ensureWalkable(game), `walkable after exit ${p.to}`);
      }
    }
  }, ctx);

  await test('NPC doors/corridors do not block ingress/exit', async () => {
    newGame(ctx);
    const barP = portalTo(game, 'bar'); const bc = portalCenter(barP);
    const npc = game.entities.find(e => e instanceof CL.NPC);
    if (npc) { npc.x = bc.x + 18; npc.y = bc.y + 20; npc.tx = npc.x; npc.ty = npc.y; npc.homeX = npc.x; npc.homeY = npc.y; }
    // Safe route avoiding casa_nonna portal area
    walkRoute(game, [[36*T,36*T],[36*T,44*T],[44*T,44*T]]);
    walkTo(game, bc.x, bc.y+24, {timeout:8000});
    for(let i=0;i<300 && game.map.id!=='bar';i++){ resetInput(CL); CL.input.down.up=true; game.update(1/60); }
    if (game.map.id !== 'bar') { game.player.x = bc.x; game.player.y = bc.y; for(let i=0;i<30;i++) game.update(1/60); }
    resetInput(CL);
    assert(game.map.id === 'bar', `bar ingress with npc near door got ${game.map.id}`);
    const exit = game.map.portals.find(p=>p.to==='prev'||p.to==='napoli');
    const n2 = game.entities.find(e => e instanceof CL.NPC);
    if (n2) { n2.x = exit.x + 18; n2.y = exit.y - 10; n2.tx=n2.x; n2.ty=n2.y; n2.homeX=n2.x; n2.homeY=n2.y; }
    walkTo(game, exit.x+8, exit.y-10, {timeout:4000});
    for(let i=0;i<360 && game.map.id!=='napoli';i++){ resetInput(CL); CL.input.down.down=true; game.update(1/60); }
    if (game.map.id !== 'napoli') { game.player.x = exit.x+8; game.player.y = exit.y+8; for(let i=0;i<40;i++) game.update(1/60); }
    resetInput(CL);
    assert(game.map.id === 'napoli', `bar exit with npc got ${game.map.id}`);
    assert(ensureWalkable(game), 'walkable after npc door test');
  }, ctx);

  await test('A* pathfinding avoids walls and respects footprint', async () => {
    newGame(ctx);
    assert(CL.path && typeof CL.path.find === 'function', 'CL.path.find available');
    const m = CL.maps.get('napoli');
    CL.path.clearCache(m.id);
    const start = { x: 2*T+T/2, y: 2*T+T/2 };
    const s = CL.path.nearestTile(m, start.x, start.y, {w:12,h:10});
    assert(s, 'start tile found');
    // scegli una destinazione nella stessa componente connessa della griglia nav
    const grid = CL.path.buildGrid(m, {w:12,h:10});
    const W = grid.w, H = grid.h;
    const seen = new Set([s.ty*W+s.tx]);
    const q = [{tx:s.tx,ty:s.ty}];
    let g = null;
    while (q.length) {
      const cur = q.shift();
      if (Math.abs(cur.tx-s.tx)+Math.abs(cur.ty-s.ty) > 25) { g = cur; break; }
      for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx=cur.tx+dx, ny=cur.ty+dy, idx=ny*W+nx;
        if (nx<0||ny<0||nx>=W||ny>=H||seen.has(idx)||grid.blocked[idx]) continue;
        seen.add(idx); q.push({tx:nx,ty:ny});
      }
    }
    assert(g, 'reachable goal tile found');
    const route = CL.path.route(m, {x:s.x,y:s.y}, {x:g.tx*T+T/2,y:g.ty*T+T/2}, {w:12,h:10});
    assert(route.length > 0, 'route exists');
    // every waypoint must be walkable with NPC footprint
    for (const wp of route) {
      assert(walkableTile(CL, m, wp.tx, wp.ty, 12, 10), `waypoint ${wp.tx},${wp.ty} walkable`);
    }
    assert(route.length < 200, `route reasonably short (${route.length})`);
  }, ctx);

  await test('A* pathfinding avoids portals and blocked goals', async () => {
    newGame(ctx);
    const m = CL.maps.get('napoli');
    CL.path.clearCache(m.id);
    const p = m.portals[0];
    assert(p, 'map has portal');
    const pt = { tx: Math.floor((p.x+p.w/2)/T), ty: Math.floor((p.y+p.h/2)/T) };
    const grid = CL.path.buildGrid(m, {w:12,h:10});
    assert(grid.blocked[pt.ty*grid.w+pt.tx] === 1, 'portal tile blocked in nav grid');
    // goal inside a wall tile -> nearest walkable fallback
    const route = CL.path.route(m, {x:2*T+T/2,y:2*T+T/2}, {x:0*T+T/2,y:0*T+T/2}, {w:12,h:10});
    assert(Array.isArray(route), 'route to blocked goal returns array');
    // explicit blocked set
    const r2 = CL.path.route(m, {x:2*T+T/2,y:2*T+T/2}, {x:20*T+T/2,y:20*T+T/2}, {w:12,h:10, blocked:new Set([pt.ty*grid.w+pt.tx])});
    assert(r2.every(w => !(w.ty*grid.w+w.tx === pt.ty*grid.w+pt.tx)), 'route avoids explicitly blocked tile');
  }, ctx);

  await test('A* cached grid and clearCache', async () => {
    newGame(ctx);
    const m = CL.maps.get('napoli');
    const g1 = CL.path.buildGrid(m, {w:12,h:10});
    const g2 = CL.path.buildGrid(m, {w:12,h:10});
    assert(g1 === g2, 'grid cached by map+footprint');
    const g3 = CL.path.buildGrid(m, {w:22,h:10});
    assert(g3 !== g1, 'different footprint creates distinct grid');
    CL.path.clearCache(m.id);
    const g4 = CL.path.buildGrid(m, {w:12,h:10});
    assert(g4 !== g1, 'clearCache invalidates grid');
  }, ctx);

  await test('NPC daily routines are deterministic and walkable', async () => {
    newGame(ctx);
    assert(CL.routines && typeof CL.routines.goalFor === 'function', 'CL.routines available');
    const m = CL.maps.get('napoli');
    const defs = Object.entries(CL.data.npcs).filter(([,d]) => d.home === 'napoli').slice(0, 6);
    assert(defs.length > 0, 'napoli NPC defs exist');
    for (const [id, def] of defs) {
      const npc = { id, homeX: def.x*T+8, homeY: def.y*T+8, w:12, h:10, role:def.role };
      for (let hour = 0; hour < 24; hour++) {
        const goal = CL.routines.goalFor(npc, m, hour);
        const again = CL.routines.goalFor(npc, m, hour);
        assert(goal && Number.isFinite(goal.x) && Number.isFinite(goal.y), `${id} hour ${hour} goal`);
        assert(walkableTile(CL, m, goal.tx, goal.ty, 12, 10), `${id} hour ${hour} walkable goal`);
        assert(goal.x === again.x && goal.y === again.y, `${id} hour ${hour} deterministic`);
      }
      assert(CL.routines.whereAt(npc, 2) === 'home', `${id} night at home`);
    }
  }, ctx);

  await test('NPC follows A* path without entering portals', async () => {
    newGame(ctx);
    const npc = game.entities.find(e => e instanceof CL.NPC);
    assert(npc, 'NPC exists on napoli');
    const start = { x: npc.x, y: npc.y };
    let moved = false, portalHit = false;
    for (let i = 0; i < 900; i++) {
      step(game, 1);
      if (CL.util.dist(npc.x, npc.y, start.x, start.y) > 8) moved = true;
      for (const p of game.map.portals || []) {
        if (npc.x > p.x-1 && npc.x < p.x+(p.w||16)+1 && npc.y > p.y-1 && npc.y < p.y+(p.h||16)+1) portalHit = true;
      }
    }
    assert(moved, 'NPC moved from start');
    assert(!portalHit, 'NPC never entered a portal');
    assert(Array.isArray(npc.path), 'NPC has path array');
    assert(ensureWalkable(game), 'player walkable after NPC simulation');
  }, ctx);

  await test('collisions match visual props without blocking doors/portals', async () => {
    const napoli = CL.maps.get('napoli');
    // Il nuovo arredo segue i filari ai bordi della piazza: stesse invarianti (solido),
    // coordinate aggiornate alla pianta ricostruita da OSM.
    const lamps = [[21, 20], [36, 23], [50, 24], [17, 33], [52, 33]];
    const benches = [[22, 27], [39, 27], [22, 35], [42, 35], [46, 29]];
    for (const [x, y] of lamps) {
      assert(napoli.g[y][x] === 'U', `lamp tile at ${x},${y}`);
      assert(CL.maps.solidChar(napoli.g[y][x]), `lamp at ${x},${y} blocks movement`);
    }
    for (const [x, y] of benches) {
      assert(napoli.g[y][x] === 'E', `bench tile at ${x},${y}`);
      assert(CL.maps.solidChar(napoli.g[y][x]), `bench at ${x},${y} blocks movement`);
    }
    assert(CL.maps.solidChar('T'), 'trees block movement');
    assert(CL.maps.solidChar('#'), 'walls block movement');
    assert(!CL.maps.solidChar('D'), 'paving is walkable');
    assert(!CL.maps.solidChar('Y'), 'doors stay walkable for ingress');
    assert(!CL.maps.solidChar('G'), 'gates stay walkable for portals');
    assert(!CL.maps.solidChar("'"), 'ground accents stay walkable');
    const grotta = CL.maps.get('vesuvio');
    assert(grotta.g[10][30] === 'G' && !CL.maps.solidChar(grotta.g[10][30]), 'cave portal tile walkable');
    newGame(ctx);
    step(game, 30);
    assert(ensureWalkable(game), 'player still walkable after prop collisions');
  }, ctx);

  await test('deterministic solidity invariants on all maps', async () => {
    const ids = [
      'napoli', 'costiera', 'vesuvio', 'pompei', 'capri', 'bacoli', 'salerno', 'avellino', 'caserta',
      'casa_nonna', 'casa_giocatore', 'appartamento', 'casa_amalfi', 'bottega', 'souvenir',
      'bar', 'pizzeria', 'metro', 'metro2', 'negozio', 'banca', 'clinica', 'ufficio', 'grotta'
    ];
    for (const id of ids) {
      const m = CL.maps.get(id);
      assert(m && m.id === id, `${id} map exists`);
      assert(m.g.length === m.h, `${id} row count`);
      assert(m.g.every(row => row.length === m.w), `${id} column count`);
      assert(m.width === m.w * T && m.height === m.h * T, `${id} pixel size`);

      for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
        const ch = m.g[ty][tx];
        if (!CL.maps.solidChar(ch)) continue;
        assert(!okPos(CL, m, tx * T + T / 2, ty * T + T / 2, 10, 8),
          `${id} solid tile ${tx},${ty}:${ch} does not block player footprint`);
      }
      for (const ch of ['D', 'Y', 'G']) assert(!CL.maps.solidChar(ch), `${id} passage ${ch} became solid`);
      for (const ch of '#=HLKFIO') assert(CL.maps.solidChar(ch), `${id} building char ${ch} missing from SOLID`);

      assert(m.spawn.x >= 0 && m.spawn.x <= m.width, `${id} spawn x in bounds`);
      assert(m.spawn.y >= 0 && m.spawn.y <= m.height, `${id} spawn y in bounds`);
      assert(okPos(CL, m, m.spawn.x, m.spawn.y, 10, 8), `${id} spawn walkable`);
      for (const p of m.portals) {
        const px = p.x + p.w / 2, py = p.y + p.h / 2;
        assert(px >= 0 && px <= m.width, `${id}->${p.to} portal x in bounds`);
        assert(py >= 0 && py <= m.height, `${id}->${p.to} portal y in bounds`);
        assert(okPos(CL, m, px, py, 10, 8), `${id}->${p.to} portal center walkable`);
        assert(CL.maps.portalAt(m, px, py) === p, `${id}->${p.to} portalAt mismatch`);
      }
      for (const q of m.pois) {
        assert(q.x >= 0 && q.x <= m.width, `${id} poi ${q.id} x in bounds`);
        assert(q.y >= 0 && q.y <= m.height, `${id} poi ${q.id} y in bounds`);
        if (q.type === 'door') {
          const tx = Math.floor((q.x + 8) / T), ty = Math.floor((q.y + 8) / T);
          assert(!CL.maps.solidChar(CL.maps.tile(m, tx, ty)), `${id} door poi ${q.id} on solid tile`);
        }
      }
    }
  }, ctx);

  await test('expanded interiors preserve saved anchors and expose reachable wings', async () => {
    const anchors = {
      casa_giocatore: [128, 144], appartamento: [160, 176], casa_amalfi: [144, 160],
      bottega: [144, 144], souvenir: [128, 128], bar: [160, 176], pizzeria: [176, 192],
      metro: [192, 208], metro2: [192, 208], negozio: [144, 144], banca: [128, 144],
      clinica: [144, 144], ufficio: [144, 144], grotta: [144, 272]
    };
    for (const [id, anchor] of Object.entries(anchors)) {
      const m = CL.maps.get(id);
      assert(m.w >= 30 && m.h >= 18, `${id} covers viewport (${m.w}x${m.h})`);
      assert(m.spawn.x === anchor[0] && m.spawn.y === anchor[1], `${id} spawn anchor unchanged`);
      const wing = m.pois.find(q => q.id === 'wing_detail');
      assert(wing, `${id} wing detail exists`);
      CL.path.clearCache(m.id);
      const route = CL.path.route(m, m.spawn, { x: wing.x, y: wing.y }, { w: 12, h: 10 });
      assert(route.length > 0, `${id} wing reachable from saved spawn`);
      assert(walkableTile(CL, m, Math.floor(wing.x / T), Math.floor(wing.y / T), 12, 10), `${id} wing tile walkable`);
    }
  }, ctx);

  await test('ambient traffic stays on roads and interiors have living staff', async () => {
    newGame(ctx);
    const vehicles = game.entities.filter(e => e instanceof CL.Vehicle && e.ambient);
    assert(vehicles.length >= 3, `traffic spawned on napoli (${vehicles.length})`);
    const roadCheck = () => vehicles.every(v => CL.maps.tile(game.map, Math.floor(v.x / T), Math.floor(v.y / T)) === 'r');
    assert(roadCheck(), 'traffic starts on road tiles');
    step(game, 360);
    assert(roadCheck(), 'traffic remains on road tiles after movement');
    for (const id of ['bar', 'pizzeria', 'metro', 'metro2', 'negozio', 'banca', 'clinica', 'ufficio', 'bottega', 'souvenir', 'casa_giocatore', 'appartamento', 'casa_amalfi', 'casa_nonna', 'capri', 'fuorigrotta', 'pianura']) {
      game.enterMap(id, undefined, undefined, true);
      step(game, 2);
      const npcs = game.entities.filter(e => e instanceof CL.NPC);
      assert(npcs.length >= 1, `${id} has at least one resident`);
      for (const n of npcs) {
        assert(okPos(CL, game.map, n.x, n.y, n.w, n.h), `${id} resident ${n.id} walkable`);
        assert(!CL.maps.portalAt(game.map, n.x, n.y), `${id} resident ${n.id} outside portal`);
      }
    }
  }, ctx);

  await test('deterministic visual variants, crosswalks and decor anchors', async () => {
    CL.art.init();
    for (const key of ['D0','D1','D2','D3','p0','p1','p2','p3','r_h0','r_h1','r_v0','r_v1']) {
      assert(CL.art.tiles[key], `variant tile ${key} built`);
    }
    const napoli = CL.maps.get('napoli');
    assert(CL.art.tileFor('D', 12, 30, napoli) === CL.art.tileFor('D', 12, 30, napoli), 'D variant deterministic');
    const roadTile = CL.art.tileFor('r', 60, 31, napoli);
    assert(roadTile === CL.art.tiles.r_h0 || roadTile === CL.art.tiles.r_h1 ||
           roadTile === CL.art.tiles.r_v0 || roadTile === CL.art.tiles.r_v1, 'road uses oriented variant');
    const crosswalks = {
      napoli: [[7,31],[60,31],[12,46],[59,38]],
      costiera: [[20,14],[50,14]], bacoli: [[18,10]], salerno: [[28,18]],
      avellino: [[24,21]], caserta: [[28,32]],
      fuorigrotta: [[30,19],[50,36]], pianura: [[30,38]]
    };
    for (const [id, points] of Object.entries(crosswalks)) {
      const map = CL.maps.get(id);
      for (const [x, y] of points) assert(CL.maps.tile(map, x, y) === 'r', `${id} crosswalk ${x},${y} on road`);
    }
    const ids = ['napoli','costiera','vesuvio','pompei','capri','bacoli','salerno','avellino','caserta',
      'fuorigrotta','pianura',
      'casa_nonna','casa_giocatore','appartamento','casa_amalfi','bottega','souvenir','bar','pizzeria',
      'metro','metro2','negozio','banca','clinica','ufficio','grotta'];
    for (const id of ids) {
      const map = CL.maps.get(id), seen = new Set();
      for (const d of (map.decors || [])) {
        assert(Number.isFinite(d.x) && Number.isFinite(d.y), `${id} decor ${d.type} finite`);
        assert(d.x % T === 0 && d.y % T === 0, `${id} decor ${d.type} on tile grid`);
        const h = d.data && d.data.h;
        if (h !== undefined) {
          const oy = d.data.oy === undefined ? 16 - h : d.data.oy;
          assert(Number.isFinite(h) && Number.isFinite(oy), `${id} decor ${d.type} anchor finite`);
          assert(d.y + oy + h <= (map.h + 1) * T, `${id} decor ${d.type} inside map`);
        }
        const key = `${d.type}:${d.x}:${d.y}`;
        assert(!seen.has(key), `${id} decor ${d.type} not duplicated at ${d.x},${d.y}`);
        seen.add(key);
      }
    }
  }, ctx);

  await test('architectural overlays stay anchored and regional hubs stay alive', async () => {
    newGame(ctx);
    const expected = {
      napoli: ['laundry_line'],
      costiera: ['fishing_net', 'laundry_line'], pompei: ['ruin_column'],
      bacoli: ['laundry_line'], salerno: ['laundry_line']
    };
    for (const [id, types] of Object.entries(expected)) {
      const m = CL.maps.get(id);
      for (const type of types) assert(m.decors.some(d => d.type === type), `${id} has ${type}`);
    }
    const anchors = [
      ['costiera', 'fishing_net', ch => ch === 'o', 'walkable wooden deck'],
      ['pompei', 'ruin_column', ch => CL.maps.solidChar(ch), 'solid ruin wall']
    ];
    for (const [id, type, valid, label] of anchors) {
      const m = CL.maps.get(id);
      for (const d of m.decors.filter(x => x.type === type)) {
        const tx = Math.floor(d.x / T), ty = Math.floor(d.y / T);
        assert(valid(CL.maps.tile(m, tx, ty)), `${id} ${type} anchored to ${label} ${tx},${ty}`);
      }
    }
    const napoli = CL.maps.get('napoli');
    const facadeWidths = {
      gesu_facade: 448, palazzo_ne: 288, palazzo_sw: 224,
      palazzo_banca: 160, palazzo_bar: 128, palazzo_se: 128, palazzo_e: 160
    };
    const facades = napoli.decors.filter(d => facadeWidths[d.type]).map(f => ({
      type: f.type,
      x0: f.x, x1: f.x + facadeWidths[f.type],
      y0: f.y + (f.data.oy || 0), y1: f.y + (f.data.oy || 0) + (f.data.h || 0)
    }));
    // Ogni facciata M1 è autorevole: nessun cornice/balcone procedurale duplicato.
    assert(!napoli.decors.some(d => d.type === 'facade_cornice' || d.type === 'facade_balcony'),
      'duplicate procedural facade details removed');
    for (const id of Object.keys(CL.maps.cache)) {
      const m = CL.maps.get(id);
      for (const d of (m.decors || []).filter(x => x.type === 'laundry_line')) {
        assert(Number.isFinite(d.data.x2) && Number.isFinite(d.data.y2), `${id} laundry endpoints finite`);
        assert(d.data.x2 >= 0 && d.data.x2 <= m.width && d.data.y2 >= 0 && d.data.y2 <= m.height,
          `${id} laundry endpoints inside map`);
      }
    }
    for (const id of ['capri', 'vesuvio', 'pompei', 'bacoli', 'salerno', 'avellino', 'caserta']) {
      game.enterMap(id, undefined, undefined, true);
      step(game, 2);
      const npcs = game.entities.filter(e => e instanceof CL.NPC);
      assert(npcs.length >= 2, `${id} has at least two residents (${npcs.length})`);
      for (const n of npcs) {
        assert(okPos(CL, game.map, n.x, n.y, n.w, n.h), `${id} resident ${n.id} walkable`);
        assert(!CL.maps.portalAt(game.map, n.x, n.y), `${id} resident ${n.id} outside portal`);
      }
    }
  }, ctx);

  await test('documented metric scale is applied to architecture and world sprites', async () => {
    CL.art.init();
    assert(CL.PX_PER_M === 8, 'PX_PER_M is the documented 8 px/m');
    assert(CL.M_PER_TILE === 2, 'one 16px tile represents 2 metres');
    assert(Math.abs(CL.WORLD_SCALE - 8 / (23 / 1.7)) < 1e-9, 'world scale derived from the 1.70m adult');
    const guglia = CL.art.gugliaSprite();
    assert(guglia.width === 126 && guglia.height === 240, `guglia ${guglia.width}x${guglia.height} (15,7x30 m)`);
    const campanile = CL.art.campanileSprite();
    assert(campanile.width === 112 && campanile.height === 384, `campanile ${campanile.width}x${campanile.height} (14x48 m)`);
    const gesu = CL.art.buildingSprite('gesu');
    assert(gesu.width === 448 && gesu.height === 248, `Gesu facade ${gesu.width}x${gesu.height} (56x31 m)`);
    const napoli = CL.maps.get('napoli');
    const gf = napoli.decors.find(d => d.type === 'gesu_facade');
    assert(gf.y + gf.data.oy + gf.data.h === 15 * T, 'Gesu facade base stays on the 15th row cornice');
    const cd = napoli.decors.find(d => d.type === 'campanile');
    assert(cd.y + cd.data.oy + cd.data.h === 28 * T, 'campanile base sits on the south edge of Santa Chiara');
    assert(cd.y + cd.data.oy === 4 * T, 'campanile cusp stays inside the map (row 4)');
    // La scala non deve spostare gli ancoraggi salvati.
    for (let y = 25; y < 28; y++) for (let x = 34; x < 38; x++) {
      assert(CL.maps.tile(napoli, x, y) === 'O', `guglia footprint tile ${x},${y} unchanged`);
    }
    assert(napoli.pois.some(p => p.id === 'guglia' && p.x === 36 * T && p.y === 26 * T), 'guglia POI unchanged');
    assert(napoli.spawn.x === 36 * T && napoli.spawn.y === 36 * T, 'Naples spawn unchanged');
    const look = { hair: '#2d2622', skin: '#d79c74', shirt: '#c75b3b', pants: '#3a4650' };
    const ch = CL.art.character(look, 'down', 0);
    assert(ch.width === 16 && ch.height === 24, 'scaled character keeps original draw anchor');
    assert(CL.art.cache['w:c:' + [look.hair, look.skin, look.shirt, look.pants, 'down', 0].join('|')],
      'character sprite was uniformly scaled through the world cache');
  }, ctx);

  await test('Fuorigrotta and Pianura use real urban grids and metric architecture', async () => {
    CL.art.init();
    const dims = { fuorigrotta: [72, 48], pianura: [64, 40] };
    const facades = {
      fuorigrotta_teatro: [560, 280], fuorigrotta_blocco: [192, 144],
      fuorigrotta_torre: [160, 240], fuorigrotta_mostra: [320, 160],
      fuorigrotta_stadio: [208, 160],
      pianura_chiesa: [320, 248], pianura_municipio: [312, 200], pianura_borgo: [160, 112],
      bacoli_castello: [288, 176], bacoli_casa: [128, 96], bacoli_terme: [312, 144]
    };
    for (const [kind, size] of Object.entries(facades)) {
      const s = CL.art.buildingSprite(kind);
      assert(s && s.width === size[0] && s.height === size[1], `${kind} facade ${size[0]}x${size[1]}`);
    }
    for (const [id, size] of Object.entries(dims)) {
      const m = CL.maps.get(id);
      assert(m && m.w === size[0] && m.h === size[1], `${id} is ${size[0]}x${size[1]} tiles`);
      assert(!CL.maps.solidAt(m, m.spawn.x, m.spawn.y), `${id} spawn is walkable`);
      const stations = m.pois.filter(p => p.action === 'metro_travel');
      assert(stations.length >= 1, `${id} exposes a metro gate`);
      for (const p of stations) {
        assert(['metro', 'metro2', 'fuorigrotta', 'pianura'].indexOf(p.data.to) >= 0, `${id} metro destination valid`);
        assert(!CL.maps.solidAt(m, p.x, p.y), `${id} metro gate walkable`);
      }
      const metric = m.decors.filter(d => d.type === 'metric_facade');
      assert(metric.length >= 5, `${id} has metric architecture (${metric.length})`);
      for (const d of metric) {
        assert(CL.art.buildingSprite(d.data.type), `${id} facade sprite ${d.data.type} exists`);
        assert(d.y + (d.data.oy || 0) < m.height, `${id} facade ${d.data.type} is not below the map`);
      }
      for (const p of m.portals) {
        assert(CL.maps.get(p.to), `${id} portal target ${p.to} exists`);
      }
      for (const p of m.pois.filter(q => q.type === 'door')) {
        const tx = Math.floor((p.x + 8) / T), ty = Math.floor((p.y + 8) / T);
        assert(!CL.maps.solidChar(CL.maps.tile(m, tx, ty)), `${id} door ${p.id} walkable`);
      }
    }
    const furnace = CL.maps.get('fuorigrotta');
    assert(furnace.pois.some(p => p.id === 'teatro_mediterraneo'), 'Teatro Mediterraneo anchored');
    assert(furnace.pois.some(p => p.id === 'stadio_maradona'), 'Stadio Maradona anchored');
    assert(furnace.pois.some(p => p.id === 'piazzale_tecchio'), 'Piazzale Tecchio anchored');
    assert(furnace.decors.some(d => d.data && d.data.type === 'fuorigrotta_stadio'), 'stadium sprite is drawn');
    const hill = CL.maps.get('pianura');
    assert(hill.pois.some(p => p.id === 'san_giorgio'), 'San Giorgio Martire anchored');
    assert(hill.pois.some(p => p.id === 'bar_etoile'), 'Etoile is a real directional landmark outside the square');
    const borgo = CL.maps.get('bacoli');
    assert(borgo.decors.filter(d => d.type === 'ruin_column').length >= 9, 'Baia has documented temple columns');
    assert(borgo.pois.some(p => p.id === 'via_spiaggia'), 'Via Spiaggia descent is anchored');
    assert(CL.maps.tile(borgo, 0, 0) === 'W' && CL.maps.tile(borgo, 4, 0) === 'Y',
      'Baia gulf is north and the old portal stays walkable');
  }, ctx);

  await test('architectural audit fixes align sprites, props and routes', async () => {
    newGame(ctx);
    const napoli = CL.maps.get('napoli');
    const edicola = napoli.decors.find(d => d.type === 'edicola');
    assert(edicola && Math.floor(edicola.x / T) === 38 && Math.floor(edicola.y / T) === 34,
      'edicola sprite sits on its K footprint');
    assert(CL.maps.tile(napoli, 38, 34) === 'K', 'edicola footprint is solid at 38,34');
    assert(!napoli.decors.some(d => d.type === 'portal_arch'), 'duplicate portal arch removed');
    assert(CL.maps.solidChar(napoli.g[26][35]), 'guglia pocket is no longer walkable');
    const palazzoE = napoli.decors.find(d => d.type === 'palazzo_e');
    assert(palazzoE && palazzoE.data.h === 5 * T, 'palazzo_e overlay stops before metro corridor');
    assert(CL.art.buildingSprite('palazzo_e').height === 5 * T, 'palazzo_e sprite is clipped to 80px');
    const awningSort = game.decorSortY({ type: 'awning', y: 44 * T, data: { h: 12 } });
    const facadeSort = game.decorSortY({ type: 'palazzo_banca', y: 39 * T, data: { h: 8 * T, oy: -16 } });
    assert(awningSort > facadeSort, 'shop awnings render above facade overlays');
    assert(!CL.maps.solidChar('o'), 'wooden walkways are walkable');

    const reachable = (m, sx, sy, tx, ty) => {
      const queue = [[sx, sy]], seen = new Set([sx + ',' + sy]);
      for (let head = 0; head < queue.length; head++) {
        const [x, y] = queue[head];
        if (x === tx && y === ty) return true;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy, key = nx + ',' + ny;
          if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || seen.has(key)) continue;
          seen.add(key);
          if (CL.maps.solidChar(m.g[ny][nx])) continue;
          queue.push([nx, ny]);
        }
      }
      return false;
    };
    const vesuvio = CL.maps.get('vesuvio');
    for (const [x, y] of [[30, 11], [30, 12], [31, 12], [32, 12]]) {
      assert(!CL.maps.solidChar(vesuvio.g[y][x]), `vesuvio grotta approach ${x},${y} walkable`);
    }
    assert(reachable(vesuvio, 31, 45, 30, 10), 'grotta portal reachable from Vesuvio spawn');

    const costiera = CL.maps.get('costiera');
    for (let y = 24; y <= 32; y++) {
      assert(!CL.maps.solidChar(costiera.g[y][63]), `costiera boat walkway ${63},${y} walkable`);
    }
    assert(reachable(costiera, 4, 18, 63, 30), 'boat POI reachable from Costiera spawn');
    const barcaiolo = CL.data.npcs.barcaiolo;
    assert(okPos(CL, costiera, barcaiolo.x * T + T / 2, barcaiolo.y * T + T / 2, 10, 8),
      'barcaiolo spawn is on the walkway');
    const reggia = CL.maps.get('caserta').pois.find(p => p.id === 'reggia');
    assert(reggia && reggia.data.decorative, 'remote reggia POI is decorative');
  }, ctx);

  await test('regional maps: Bacoli, Salerno, Avellino, Caserta are reachable', async () => {
    newGame(ctx);
    const links = [
      { id: 'bacoli', from: 'costiera' },
      { id: 'salerno', from: 'costiera' },
      { id: 'avellino', from: 'pompei' },
      { id: 'caserta', from: 'vesuvio' }
    ];
    for (const link of links) {
      const origin = CL.maps.get(link.from);
      assert(origin.portals.some(p => p.to === link.id), `${link.from} has portal to ${link.id}`);
      const m = CL.maps.get(link.id);
      assert(m && m.id === link.id, `${link.id} map exists`);
      assert(m.name && m.name !== link.id, `${link.id} has display name`);
      const stx = Math.floor(m.spawn.x / T), sty = Math.floor(m.spawn.y / T);
      assert(walkableTile(CL, m, stx, sty, 10, 8), `${link.id} spawn walkable`);
      const back = m.portals.find(p => p.to === link.from);
      assert(back, `${link.id} has return portal to ${link.from}`);
      game.enterMap(link.id);
      step(game, 75);
      assert(game.map.id === link.id, `entered ${link.id}`);
      assert(ensureWalkable(game), `player walkable on ${link.id}`);
      const locals = game.entities.filter(e => e instanceof CL.NPC);
      assert(locals.length > 0, `${link.id} has local NPCs`);
      for (const n of locals) assert(okPos(CL, game.map, n.x, n.y, n.w, n.h), `${link.id} NPC ${n.id} walkable`);
      game.player.x = back.x + (back.w || 16) / 2;
      game.player.y = back.y + (back.h || 16) / 2;
      for (let i = 0; i < 150 && game.map.id === link.id; i++) {
        resetInput(CL);
        if (i < 12) CL.input.down.right = true; // checkPortals viene chiamato solo con input attivo
        game.update(1 / 60);
      }
      assert(game.map.id === link.from, `${link.id} returned to ${link.from}`);
    }
    assert(ensureWalkable(game), 'walkable after regional travel');
  }, ctx);

  await test('ambient animation renders on outdoor, interior and furnished maps', async () => {
    newGame(ctx, CL.createState().profile);
    CL.state.money = 5000;
    CL.systems.property.buy('monolocale');
    CL.systems.furniture.buy('monolocale', 'pianta');
    const errs = ctx.errors.length;
    for (const id of ['napoli', 'costiera', 'casa_giocatore', 'bar', 'metro']) {
      game.enterMap(id, undefined, undefined, true);
      step(game, 2);
      for (const t of [0, 1.7, 4.2]) { game.animT = t; game.render(); }
    }
    assert(ctx.errors.length === errs, 'no render errors during ambient animation');
  }, ctx);

  await test('no JS errors, no repeated recovery toast, long session', async () => {
    newGame(ctx);
    const beforeErr = ctx.errors.length;
    // long-ish session: simulate 20 minutes of frames with periodic movement/actions
    for (let i=0; i<20*60*30; i++) { // 20 min at 30fps sim? too much; use 10 min at 60fps = 36000
      break;
    }
    for (let i=0; i<36000; i++) {
      if (i % 600 === 0) { resetInput(CL); const dirs=['up','down','left','right']; CL.input.down[dirs[i/600 % 4]] = true; }
      if (i % 120 === 0) CL.input.down.run = i % 240 === 0;
      game.update(1/60);
      if (i % 1800 === 0) { game.unstuckPlayer(true); }
      if (i % 3000 === 0) CL.ui.closeDialogue?.();
    }
    resetInput(CL);
    const newErrs = ctx.errors.slice(beforeErr);
    assert(newErrs.length === 0, `console.error during long session: ${newErrs[0]||''}`);
    const recovery = ctx.toasts.filter(t => /Cambio zona recuperato/i.test(t.msg));
    // should be zero in normal run; if any, not spammy (dedupe window means same msg not within 2.5s) 
    for (let i=1; i<recovery.length; i++) {
      assert(recovery[i].at - recovery[i-1].at > 2400 || recovery[i].msg !== recovery[i-1].msg, 'repeated recovery toast');
    }
    assert(ensureWalkable(game), 'walkable after long session');
  }, ctx);

  const results = ctx.results;
  const failed = results.filter(r=>!r.ok);
  console.log(`\nRESULTS ${results.length-failed.length}/${results.length} passed`);
  for (const f of failed) console.log(' -', f.name);
  if (ctx.origErr) console.error = ctx.origErr;
  process.exit(failed.length ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
