/* CAMPANIA LIFE — engine.js
 * Motore di gioco: loop, rendering Canvas, transizioni, interazioni, ponte con la UI React.
 */
(function (w) {
  'use strict';
  const CL = w.CL, U = CL.util, D = CL.data, G = CL.gfx, ART = CL.art, MAPS = CL.maps, T = CL.TILE;
  const S = CL.systems;

  /* Ponte UI: React sovrascrive questi metodi al mount. */
  CL.ui = {
    toast(msg, type) { (this._queue || (this._queue = [])).push({ msg, type, t: Date.now() }); },
    refresh() {},
    showDialogue() {},
    closeDialogue() {},
    closeMenu() {},
    closeAll() { try { this.closeDialogue(); } catch(e){} try { this.closeMenu(); } catch(e){} },
    openMenu() {},
    isModal() { return false; },
    fade(on) { const el = document.getElementById('fade'); if (el) el.classList.toggle('on', !!on); },
    takeToasts() { const q = this._queue || []; this._queue = []; return q; }
  };

  const TILE_COLOR = {
    '.': '#6e9d4e', ',': '#9d855d', r: '#555b60', p: '#b8b1a2', S: '#e3cd99',
    W: '#2c7a9c', '~': '#54a5b4', '#': '#bf7350', '=': '#ab4a39', f: '#d8c7a6',
    c: '#8b6244', o: '#65432e', X: '#6fa9b8', B: '#d9e0d4', '^': '#8b8a80',
    g: '#b9ae91', k: '#3b3640', P: '#4f8a4c', C: '#5b8fa6', V: '#24343f', G: '#2c2933', D: '#8f8a80',
    O: '#d7cfbf', H: '#656a6f', "'": '#c9a44a', L: '#7b623f', F: '#7b623f', K: '#2e6b4f',
    Q: '#5e402d', Y: '#7a5637', I: '#59616a', U: '#f3dd8a', E: '#7a5637', N: '#3f6f95', J: '#b94a3a',
    A: '#d9d2c3', M: '#d4ccbc', R: '#a53a3a', Z: '#7a5637', h: '#cdbd9d', j: '#ddd3c0',
    l: '#d8cebc', n: '#855f3d', q: '#ece3d1', s: '#7a5637', u: '#9b7349', v: '#8b6244',
    w: '#7a5637', x: '#8fb0c8', y: '#8a8f95', z: '#b8d0d8', '1': '#7a5637', '2': '#6fb0c8',
    '3': '#4a5560', '4': '#845e3d', '5': '#f3c44f', '6': '#5f7e96', '7': '#9fc3d8', '8': '#855f3d', '9': '#5f9a4e', '0': '#dceef3'
  };

  class Game {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;
      this.running = false; this.last = 0; this.lastRender = 0; this.acc = 0;
      this.entities = []; this.particles = new CL.Particles();
      this.map = null; this.player = null; this.prompt = null; this.promptTarget = null;
      this.refreshT = 0; this.fadeT = 0; this.rainT = 0; this.weatherT = 0;
      this.animT = 0;
      this.state = null;
      // I pannelli diagnostici non sono parte dell'esperienza giocatore:
      // riattivabili solo con ?debug=1 per QA e regressioni.
      const params = (typeof location !== 'undefined' && location.search) ? new URLSearchParams(location.search) : null;
      this.debug = !!(params && (params.has('debug') || params.get('dbg') === '1'));
      this.enterCooldown = 0;
      this.portalGrace = 0;
      this.entryPos = null;
      this.dbg = { blocked:'', axis:{x:0,y:0}, modal:false, keys:'', lastMap:'' };
      this.hooks();
    }

    hooks() {
      CL.events.on('respawn', () => { if (this.state) this.spawnCreatures(); });
      CL.events.on('money', () => this.particles.emit(this.player.x, this.player.y - 14, '#e9b84a', 6, 1.1));
    }

    /* ----------------------------------------------------------- ciclo vita */
    newGame(profile) {
      this.state = CL.createState(profile);
      CL.state = this.state;
      this.state.flags.visited = { napoli: true };
      // Crea il player sulla mappa iniziale PRIMA di qualsiasi autosave:
      // quests.start() può salvare, e un player vecchio riscriverebbe state.pos.
      this.enterMap('napoli', this.state.pos.x, this.state.pos.y, true);
      S.quests.start('primo_giorno');
      this.save();
      CL.audio.setTrack('town');
      return this.state;
    }

    load(data) {
      try {
        if (!data || typeof data !== 'object' || !data.pos) throw new Error('save invalido');
        CL.save.backup('pre_load');
        this.state = data; CL.state = data;
        this.state.inventory = this.state.inventory || {};
        this.state.properties = this.state.properties || [];
        this.state.flags = this.state.flags || {};
        this.state.stats = this.state.stats || {};
        this.state.quests = this.state.quests || {};
        this.state.creatures = this.state.creatures || {};
        this.state.relations = this.state.relations || {};
        this.state.achievements = this.state.achievements || [];
        this.state.needs = this.state.needs || { hunger: 80, thirst: 80, energy: 80, mood: 70, hygiene: 70 };
        this.state.profile = this.state.profile || CL.createState().profile;
        this.state.pos.map = this.state.pos.map || 'napoli';
        this.state.pos.x = Number.isFinite(this.state.pos.x) ? this.state.pos.x : 31 * T;
        this.state.pos.y = Number.isFinite(this.state.pos.y) ? this.state.pos.y : 35 * T;
        // Migrazione salvataggi vecchi: se posizione chiesa vecchia/bloccata, usa nuovo spawn sicuro sul tappeto.
        if (this.state.pos.map === 'casa_nonna') {
          const m = MAPS.get('casa_nonna');
          const oldSpawns = [{x:14*T,y:19*T},{x:14*T+8,y:19*T+8},{x:232,y:312}];
          const nearOld = oldSpawns.some(p => U.dist(this.state.pos.x, this.state.pos.y, p.x, p.y) < 28);
          let blocked = false;
          try { blocked = !MAPS.walkable(m, Math.floor(this.state.pos.x/T), Math.floor(this.state.pos.y/T)); } catch(e) {}
          if (nearOld || blocked) { this.state.pos.x = m.spawn.x; this.state.pos.y = m.spawn.y; this.state.pos.dir = m.spawnDir || 'up'; }
        }
        this.enterMap(this.state.pos.map, this.state.pos.x, this.state.pos.y, true);
        if (this.player) {
          this.player.dir = this.state.pos.dir || (this.map && this.map.spawnDir) || 'down';
          if (!this.canMove(this.player.x, this.player.y, this.player.w, this.player.h)) this.unstuckPlayer(true);
        }
        CL.audio.setTrack(MAPS.get(this.map.id).zone === 'interno' ? 'interior' : (D.zones[MAPS.get(this.map.id).zone] || {}).track || 'town');
        return true;
      } catch (err) {
        console.error('[CL] load failed', err);
        CL.ui.toast('Salvataggio danneggiato: avvio sicuro senza chiudere la sessione.', 'bad');
        return false;
      }
    }

    serialize() {
      if (!this.state) return null;
      const p = this.player && this.player.vehicle ? this.player.vehicle : this.player;
      this.state.pos = {
        x: Math.round(p ? p.x : this.state.pos.x), y: Math.round(p ? p.y : this.state.pos.y),
        map: this.map ? this.map.id : this.state.pos.map,
        dir: this.player ? this.player.dir : 'down',
        prev: this.state.pos.prev || null
      };
      return this.state;
    }

    save() {
      const data = this.serialize(); if (!data) return;
      CL.save.write(data);
      if (CL.api.ready && CL.api.token) {
        clearTimeout(this._pushT);
        this._pushT = setTimeout(() => { CL.api.push(CL.state).catch(() => {}); }, 2500);
      }
    }

    start() {
      if (this.running) return;
      this.running = true; this.last = performance.now();
      const loop = now => {
        if (!this.running) return;
        let dt = Math.min(.05, (now - this.last) / 1000); this.last = now;
        try {
          this.update(dt);
          // In risparmio energetico il mondo continua a 60 Hz ma il disegno resta a ~30 fps.
          if (!CL.settings.lowPower || now - this.lastRender >= 32) {
            this.render();
            this.lastRender = now;
          }
        } catch (err) {
          console.error('[CL] frame error', err);
          // Mai tornare al menu: mostra errore e continua al frame successivo.
          if (CL.ui && CL.ui.toast) CL.ui.toast('Errore recuperato: ' + (err && err.message ? err.message : 'sconosciuto'), 'bad');
        }
        try { CL.input.endFrame(); } catch (e) {}
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    }
    stop() { this.running = false; if (this.raf) cancelAnimationFrame(this.raf); }

    /* --------------------------------------------------------------- update */
    update(dt) {
      CL.audio.tick();
      this.animT += dt;
      CL.camera.update(dt);
      this.particles.update(dt);
      if (this.enterCooldown > 0) this.enterCooldown = Math.max(0, this.enterCooldown - dt);
      if (this.portalGrace > 0) this.portalGrace = Math.max(0, this.portalGrace - dt);
      if (!this.state || !this.player) return;
      const modal = !!CL.ui.isModal() && this.enterCooldown <= 0;
      this.dbg.modal = modal;
      this.dbg.axis = CL.input.axis();
      this.dbg.keys = ['up','down','left','right','run','interact'].filter(k => CL.input.down[k]).join('+');
      if (!modal) {
        S.time.advance(dt);
        try { CL.input.consume('interact') && this.player.interact(); } catch (e) { console.error(e); CL.ui.toast('Interazione non riuscita.', 'bad'); }
        try { CL.input.consume('ability') && this.useAbility(); } catch (e) { console.error(e); }
        CL.input.consume('menu') && CL.ui.openMenu('phone');
        CL.input.consume('pause') && CL.ui.openMenu('impostazioni');
        CL.input.consume('inventory') && CL.ui.openMenu('zaino');
        CL.input.consume('map') && CL.ui.openMenu('mappa');
        CL.input.consume('quests') && CL.ui.openMenu('diario');
        /* collezione rimossa */
        ['slot1', 'slot2', 'slot3', 'slot4', 'slot5'].forEach((k, i) => {
          if (CL.input.consume(k)) {
            const foods = D.foodOrder.filter(id => S.inventory.has(id));
            if (foods[i]) S.inventory.use(foods[i]);
          }
        });
      }
      for (let i = this.entities.length - 1; i >= 0; i--) {
        const e = this.entities[i];
        if (!e || !e.alive) continue;
        try { e.update(dt, { modal }); }
        catch (err) { console.error('[CL] entity update', e && e.id, err); }
      }
      if (!modal) {
        const focus = this.player.vehicle || this.player;
        CL.camera.follow(focus, dt, 1);
        this.updatePrompt();
        const zone = MAPS.get(this.map.id).zone;
        CL.audio.setTrack(S.time.isNight() ? 'night' : (D.zones[zone] || { track: zone === 'interno' ? 'interior' : 'town' }).track);
      } else {
        CL.audio.setTrack(null);
      }
      this.refreshT += dt;
      if (this.refreshT > .12) { this.refreshT = 0; CL.ui.refresh(); S.achievements.check(); }
      this.updateWeather(dt);
    }

    updateWeather(dt) {
      const wth = S.weather.info();
      this.weatherT += dt;
      if (wth.speed > 0 && this.weatherT > .035) {
        this.weatherT = 0;
        for (let i = 0; i < wth.speed * 2; i++) this.particles.rain(U.rand(-20, CL.VIEW_W), U.rand(-40, 0), wth.speed * (1 + (wth.id === 'temporale' ? .4 : 0)));
      }
    }

    useAbility() {
      CL.ui.toast('Nessuna azione speciale qui.', 'info');
    }

    updatePrompt() {
      const p = this.player;
      if (p.vehicle) { this.prompt = 'E · Scendi dal ' + p.vehicle.label(); this.promptTarget = p.vehicle; return; }
      let best = null, bd = 30;
      const cands = this.entities.filter(e => e !== p && e.alive && (e instanceof CL.NPC || e instanceof CL.Vehicle));
      for (const e of cands) {
        const d = U.dist(p.x, p.y, e.x, e.y);
        if (d < bd) { bd = d; best = e; }
      }
      if (!best) {
        for (const poi of this.map.pois) {
          if (poi.data && poi.data.decorative) continue;
          const radius = poi.type === 'landmark' ? 56 : (poi.type === 'furniture' || poi.type === 'scenery') ? 36 : 26;
          const d = U.dist(p.x, p.y, poi.x, poi.y + 8);
          if (d < radius && (!best || d < bd)) { best = poi; bd = d; }
        }
      }
      this.promptTarget = best;
      if (!best) { this.prompt = null; return; }
      if (best instanceof CL.NPC) this.prompt = 'E · Parla con ' + best.name;
      else if (best instanceof CL.Vehicle) this.prompt = 'E · Monta sul ' + best.label();
      else this.prompt = 'E · ' + best.label;
    }

    interactNear() {
      const t = this.promptTarget; if (!t) return;
      if (t.action) this.handleAction(t.action, t.data || {}, t);
      else t.interact(this.player);
    }

    /* ------------------------------------------------------------ vecino mappe */
    enterMap(id, x, y, silent) {
      if (!this.state) return;
      try {
        const prev = this.state.pos || {};
        const resolve = raw => {
          if (raw === 'prev') return this.state.pos.prev || { map: 'napoli', x: 31 * T, y: 35 * T };
          const m = MAPS.get(raw);
          if (!m) return { map: 'napoli', x: 31 * T, y: 35 * T };
          return { map: m.id, x: x !== undefined ? x : m.spawn.x, y: y !== undefined ? y : m.spawn.y };
        };
        const target = resolve(id);
        const targetMap = MAPS.get(target.map) || MAPS.get('napoli');
        const isInterior = targetMap.zone === 'interno';
        const ownedInteriors = ['casa_giocatore', 'appartamento', 'casa_amalfi', 'bottega'];
        if (ownedInteriors.indexOf(target.map) >= 0) {
          const propId = Object.keys(D.properties || {}).find(k => (D.properties[k].interior || k) === target.map) || target.map;
          if (!S.property.owns(propId) && !S.property.owns(target.map)) {
            CL.ui.toast('Questo immobile non è ancora tuo.', 'bad'); CL.audio.sfx('fail'); return;
          }
        }
        if (!silent && isInterior && (!this.map || MAPS.get(this.map.id).zone !== 'interno')) {
          let px = prev.x, py = prev.y;
          const pm = this.map;
          if (pm) {
            const ok = (ax,ay)=>!MAPS.solidAt(pm,ax-5,ay-4)&&!MAPS.solidAt(pm,ax+5,ay-4)&&!MAPS.solidAt(pm,ax-5,ay+4)&&!MAPS.solidAt(pm,ax+5,ay+4);
            if (!ok(px,py)) {
              const pts=[[0,0],[0,8],[0,-8],[8,0],[-8,0],[0,16],[0,-16],[16,0],[-16,0]];
              outer: for(let r=1;r<=12;r++) for(const [dx,dy] of pts){ const nx=px+dx*r,ny=py+dy*r; if(ok(nx,ny)){px=nx;py=ny;break outer;} }
            }
          }
          this.state.pos.prev = { map: this.map ? this.map.id : 'napoli', x: px, y: py };
        }
        try { CL.ui.closeAll && CL.ui.closeAll(); } catch (e) {}
        this.particles.clear();
        this.map = targetMap;
        this.applyFurniture(this.map);
        CL.camera.setBounds(this.map.width, this.map.height);
        this.entities = []; this.creatures = [];
        const tx = Number.isFinite(target.x) ? target.x : this.map.spawn.x;
        const ty = Number.isFinite(target.y) ? target.y : this.map.spawn.y;
        if (!this.player) this.player = new CL.Player(this, tx, ty);
        this.player.vehicle = null;
        this.player.x = tx; this.player.y = ty;
        this.player.vx = 0; this.player.vy = 0;
        this.player.dir = this.map.spawnDir || (id === 'prev' ? this.player.dir : 'down');
        this.entities.push(this.player);
        const interiorSpots = {
          bar: [[6*T+8,5*T+8],[4*T+8,9*T+8],[13*T+8,8*T+8],[15*T+8,5*T+8]],
          casa_nonna: [[7*T+8,17*T+8],[20*T+8,17*T+8],[7*T+8,8*T+8],[20*T+8,8*T+8]]
        };
        let iSpot = 0;
        for (const nid in D.npcs) {
          const def = D.npcs[nid];
          if (!def) continue;
          const inThisMap = def.home === target.map || (isInterior && def.role === 'shop' && target.map === 'bar' && nid === 'barista');
          if (inThisMap) {
            const n = new CL.NPC(this, nid, def);
            if (isInterior) {
              const spots = interiorSpots[target.map];
              let sx, sy;
              if (spots && spots[iSpot]) { [sx, sy] = spots[iSpot]; iSpot++; }
              else if (Number.isFinite(def.x) && Number.isFinite(def.y)) { sx = def.x * T + 8; sy = def.y * T + 8; }
              else { sx = this.map.width / 2; sy = this.map.height - 80; }
              if (!this.canMove(sx, sy, n.w, n.h) || MAPS.portalAt(this.map, sx, sy)) {
                let found = false;
                for (let r = 1; r <= 8 && !found; r++) {
                  for (let dy = -r; dy <= r && !found; dy++) for (let dx = -r; dx <= r; dx++) {
                    if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
                    const nx = sx + dx * T, ny = sy + dy * T;
                    if (this.canMove(nx, ny, n.w, n.h) && !MAPS.portalAt(this.map, nx, ny)) {
                      sx = nx; sy = ny; found = true; break;
                    }
                  }
                }
              }
              n.x = sx; n.y = sy; n.homeX = sx; n.homeY = sy;
            }
            this.entities.push(n);
          }
        }
        if (!isInterior) this.spawnCreatures();
        if (!isInterior) this.spawnAmbientVehicles();
        this.state.pos.map = target.map;
        this.state.pos.x = tx; this.state.pos.y = ty;
        this.fadeT = 0;
        this.enterCooldown = .25;
        this.portalGrace = .9;
        this.entryPos = { map: target.map, x: this.player.x, y: this.player.y };
        CL.camera.snap(this.player);
        // Ensure spawn not blocked (e.g. NPC/object overlap or bad map data)
        this.unstuckPlayer(true);
        if (target.map === 'casa_nonna') {
          const safeX = this.map.spawn.x, safeY = this.map.spawn.y;
          const tile = MAPS.tile(this.map, Math.floor(this.player.x/T), Math.floor(this.player.y/T));
          if (!this.canMove(this.player.x, this.player.y, this.player.w, this.player.h) || tile !== 'R') {
            this.player.x = safeX; this.player.y = safeY; this.player.dir = this.map.spawnDir || 'up';
          }
        }
        this.entryPos = { map: target.map, x: this.player.x, y: this.player.y };
        try { S.actions.visit(target.map); } catch (e) { console.error(e); }
        this.dbg.lastMap = target.map;
        this.dbg.blocked = '';
        if (!silent) {
          CL.audio.sfx('door');
          CL.ui.toast('📍 ' + this.map.name, 'info');
          this.save();
        }
        CL.ui.refresh();
      } catch (err) {
        console.error('[CL] enterMap failed', id, err);
        const now = performance.now ? performance.now() : Date.now();
        const sameErr = this._lastEnterErr && this._lastEnterErr.id === id && (now - this._lastEnterErr.at) < 2500;
        this._lastEnterErr = { id, at: now };
        if (!sameErr) CL.ui.toast('Cambio zona recuperato. Riprova.', 'bad');
        // Recover to a safe playable state without hiding the root cause in logs.
        try {
          if (!this.map) this.map = MAPS.get(this.state.pos.map || 'napoli');
          if (!this.player) this.player = new CL.Player(this, this.map.spawn.x, this.map.spawn.y);
          if (this.entities.indexOf(this.player) < 0) this.entities = [this.player, ...this.entities.filter(e => e !== this.player)];
          this.unstuckPlayer(true);
          this.portalGrace = Math.max(this.portalGrace || 0, .6);
        } catch (recoverErr) {
          console.error('[CL] enterMap recovery failed', recoverErr);
          const fallback = MAPS.get('napoli');
          this.map = fallback;
          const s = fallback.spawn;
          this.player = new CL.Player(this, s.x, s.y);
          this.entities = [this.player];
          this.state.pos.map = 'napoli'; this.state.pos.x = s.x; this.state.pos.y = s.y;
          this.portalGrace = .6;
        }
      }
    }

    safePoint(map, x, y, wid=10, hei=8, maxR=14) {
      const ok = (px,py)=>!MAPS.blockedBox(map,px,py,wid,hei);
      if (ok(x,y)) return { x, y };
      const dirs=[[0,0],[0,8],[0,-8],[8,0],[-8,0],[8,8],[-8,8],[8,-8],[-8,-8],[0,16],[0,-16],[16,0],[-16,0]];
      for(let r=1;r<=maxR;r++) for(const [dx,dy] of dirs){ const nx=x+dx*r, ny=y+dy*r; if(ok(nx,ny)) return {x:nx,y:ny}; }
      if (ok(map.spawn.x,map.spawn.y)) return {x:map.spawn.x,y:map.spawn.y};
      return {x:map.spawn.x,y:map.spawn.y};
    }

    unstuckPlayer(silent) {
      const p = this.player; if (!p || !this.map) return false;
      const f = p.vehicle || p; // da dentro un'auto va verificata l'auto, non il piede
      if (this.canMove(f.x, f.y, f.w, f.h)) return false;
      const s = this.safePoint(this.map, f.x, f.y, f.w, f.h);
      if (s.x !== f.x || s.y !== f.y) {
        f.x=s.x; f.y=s.y;
        if (p.vehicle) { p.x=s.x; p.y=s.y; }
        if(!silent) CL.ui.toast('Posizione corretta automaticamente.', 'info');
        this.dbg.blocked='unstuck'; return true;
      }
      return false;
    }

    spawnCreatures() { /* disabilitato: simulatore vita reale */ }

    spawnAmbientVehicles() {
      // Traffico leggero su corsie reali: modelli diversi, senso di marcia a
      // destra e impronta orientata. Mai su highway=pedestrian.
      const routes = {
        napoli: [
          // Solo vicoli residenziali: Spaccanapoli e Via Benedetto Croce sono pedonali.
          { type: 'taxi', tx: 58, ty: 36, dir: 'up' },
          { type: 'scooter', tx: 59, ty: 44, dir: 'down' },
          { type: 'bike', tx: 26, ty: 42, dir: 'up' }
        ],
        costiera: [
          { type: 'van', tx: 30, ty: 14, dir: 'right' },
          { type: 'scooter', tx: 55, ty: 15, dir: 'left' }
        ],
        bacoli: [{ type: 'taxi', tx: 20, ty: 11, dir: 'right' }],
        salerno: [{ type: 'scooter', tx: 30, ty: 18, dir: 'right' }],
        avellino: [{ type: 'car', tx: 24, ty: 24, dir: 'up' }],
        caserta: [{ type: 'taxi', tx: 28, ty: 32, dir: 'right' }],
        fuorigrotta: [
          { type: 'car', tx: 30, ty: 18, dir: 'right' },
          { type: 'scooter', tx: 50, ty: 36, dir: 'left' }
        ],
        pianura: [{ type: 'scooter', tx: 30, ty: 38, dir: 'right' }]
      };
      const list = routes[this.map.id] || [];
      for (const r of list) {
        const lane = CL.laneOffset(r.dir);
        const x = r.tx * T + T / 2 + lane.x, y = r.ty * T + T / 2 + lane.y;
        const fp = CL.vehicleFootprint(r.type, r.dir);
        // Rotte ambientali solo sulla carreggiata: angoli dell'impronta inclusi,
        // mai su marciapiedi, piazze pedonali o portali.
        const corners = [
          [x - fp.w / 2, y - fp.h / 2], [x + fp.w / 2, y - fp.h / 2],
          [x - fp.w / 2, y + fp.h / 2], [x + fp.w / 2, y + fp.h / 2]
        ];
        const onRoad = corners.every(p => MAPS.tile(this.map, Math.floor(p[0] / T), Math.floor(p[1] / T)) === 'r');
        if (!onRoad || !this.canMove(x, y, fp.w, fp.h) || MAPS.portalAt(this.map, x, y)) continue;
        const v = new CL.Vehicle(this, r.type, x, y, r.dir);
        v.ambient = true;
        v.speed *= .38;
        this.entities.push(v);
      }
    }
    removeEntity(e) { const i = this.entities.indexOf(e); if (i >= 0) this.entities.splice(i, 1); e.alive = false; }

    applyFurniture(map) {
      if (!map || !S.furniture) return;
      const items = [];
      for (const prop of S.furniture.propsFor(map.id)) {
        for (const id of S.furniture.owned(prop)) if (items.indexOf(id) < 0) items.push(id);
      }
      const sig = items.join('|');
      if (map._furnitureSig === sig) return;
      map.decors = (map.decors || []).filter(d => !d.fromFurniture);
      for (const id of items) {
        const def = D.furniture && D.furniture[id]; if (!def) continue;
        const spots = (def.spots && (def.spots[map.id] || def.spots.default)) || [];
        for (const [tx, ty] of spots) {
          map.decors.push({
            x: tx * T, y: ty * T, type: def.decor,
            data: { w: def.w, h: def.h, oy: def.oy }, fromFurniture: true
          });
          if (id === 'lampada') map.decors.push({
            x: tx * T + 8, y: ty * T - 8, type: 'warm_light',
            data: { r: 26, color: 'rgba(255,190,120,.15)' }, fromFurniture: true
          });
        }
      }
      map._furnitureSig = sig;
    }

    checkPortals(ent) {
      try {
        if (!this.map || !this.state) return;
        if (ent !== this.player && !(ent instanceof CL.Vehicle && ent.mounted)) return;
        if (this.fadeT > 0.2) return;
        const p = MAPS.portalAt(this.map, ent.x, ent.y);
        if (!p) return;
        if (MAPS.doorClosed(this.map, ent.x, ent.y)) {
          if (!(this.portalGrace > 0 && this.entryPos && this.entryPos.map === this.map.id)) {
            CL.ui.toast('La porta è chiusa.', 'bad');
            CL.audio.sfx('fail');
          }
          this.portalGrace = .6;
          this.entryPos = { map: this.map.id, x: ent.x, y: ent.y };
          return;
        }
        if (this.portalGrace > 0 && this.entryPos && this.entryPos.map === this.map.id) {
          const moved = U.dist(ent.x, ent.y, this.entryPos.x, this.entryPos.y);
          if (moved < 20) return; // evita uscita immediata allo spawn/ingresso
        }
        let to = p.to, x = p.spawn && p.spawn.x, y = p.spawn && p.spawn.y;
        if (to === 'prev') {
          const prev = this.state.pos.prev;
          const cur = this.map && this.map.exitSpawn;
          if (prev && prev.map) { to = prev.map; x = prev.x; y = prev.y; }
          else if (cur && cur.map) { to = cur.map; x = cur.x; y = cur.y; }
          else { to = 'napoli'; const tm = MAPS.get('napoli'); x = tm.spawn.x; y = tm.spawn.y; }
          // If the recorded prev position is blocked (old save / map change), prefer exitSpawn
          let tmPrev = MAPS.get(to);
          const okPt = (m,px,py)=>m&&!MAPS.solidAt(m,px-5,py-4)&&!MAPS.solidAt(m,px+5,py-4)&&!MAPS.solidAt(m,px-5,py+4)&&!MAPS.solidAt(m,px+5,py+4);
          if (!okPt(tmPrev,x,y) && cur && cur.map) { to = cur.map; x = cur.x; y = cur.y; tmPrev = MAPS.get(to); }
          if (!okPt(tmPrev,x,y) && tmPrev) { const sp=this.safePoint(tmPrev,tmPrev.spawn.x,tmPrev.spawn.y); x=sp.x; y=sp.y; }
          // Final guard: never keep a blocked destination.
          const tmFinal = MAPS.get(to);
          if (!okPt(tmFinal,x,y) && tmFinal) { const sp=this.safePoint(tmFinal,tmFinal.spawn.x,tmFinal.spawn.y); x=sp.x; y=sp.y; }
        } else if (p.spawn && p.spawn.__useTargetSpawn) {
          const tm = MAPS.get(to);
          x = tm.spawn.x; y = tm.spawn.y;
        }
        const tm = MAPS.get(to);
        if (!Number.isFinite(x) || !Number.isFinite(y)) { x = tm.spawn.x; y = tm.spawn.y; }
        // Ensure destination is walkable; find nearest safe tile if needed.
        if (tm) {
          const ok = (px,py)=>!MAPS.solidAt(tm,px-5,py-4)&&!MAPS.solidAt(tm,px+5,py-4)&&!MAPS.solidAt(tm,px-5,py+4)&&!MAPS.solidAt(tm,px+5,py+4);
          if (!ok(x,y)) {
            const pts=[[0,0],[0,8],[0,-8],[8,0],[-8,0],[0,16],[0,-16],[16,0],[-16,0],[8,8],[-8,8],[8,-8],[-8,-8]];
            let found=false;
            for(let r=1;r<=12&&!found;r++) for(const [dx,dy] of pts){ const nx=x+dx*r, ny=y+dy*r; if(ok(nx,ny)){x=nx;y=ny;found=true;break;} }
            if(!found){ x=tm.spawn.x; y=tm.spawn.y; }
          }
        }
        this.enterMap(to, x, y);
      } catch (e) { console.error('[CL] checkPortals', e); }
    }

    canMove(x, y, wid, hei) {
      if (!this.map) return false;
      return !MAPS.blockedBox(this.map, x, y, wid, hei);
    }
    // Oltre alla griglia, giocatore/NPC/veicoli non possono sovrapporsi.
    // Il veicolo montato e' una sola entita': il giocatore e' "a bordo".
    canStand(x, y, wid, hei, mover) {
      if (!this.canMove(x, y, wid, hei)) return false;
      const a = { x: x - wid / 2, y: y - hei / 2, w: wid, h: hei };
      for (const e of (this.entities || [])) {
        if (!e || !e.alive || e === mover) continue;
        if (mover && mover.vehicle === e) continue;
        if (mover && mover instanceof CL.Vehicle && mover.mounted && e === this.player) continue;
        if (e instanceof CL.Player && e.vehicle) continue;
        const b = { x: e.x - e.w / 2, y: e.y - e.h / 2, w: e.w, h: e.h };
        if (U.overlap(a, b)) return false;
      }
      return true;
    }
    blockedInfo(x, y, wid, hei) {
      if (!this.map) return { blocked: true, reason: 'no-map' };
      const hits = [];
      const x0 = Math.floor((x - wid / 2) / T), x1 = Math.floor((x + wid / 2) / T);
      const y0 = Math.floor((y - hei / 2) / T), y1 = Math.floor((y + hei / 2) / T);
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        const ch = MAPS.tile(this.map, tx, ty);
        if (MAPS.solidChar(ch)) hits.push({ name: 'cell', tx, ty, ch, solid: true });
      }
      if (MAPS.doorClosed(this.map, x, y)) hits.push({ name: 'door', ch: 'closed', solid: true });
      if (MAPS.propBlocks(this.map, x, y, wid, hei)) hits.push({ name: 'prop', ch: 'furniture', solid: true });
      return { blocked: hits.length > 0, hits };
    }

    /* --------------------------------------------------------- interazioni */
    handleAction(a, data, src) {
      switch (a) {
        case 'enter': case 'door':
          if (this.map && this.player && MAPS.doorClosed(this.map, this.player.x, this.player.y)) {
            CL.ui.toast('La porta è chiusa.', 'bad'); CL.audio.sfx('fail'); break;
          }
          if (data && data.to) this.enterMap(data.to);
          else if (src && src.data && src.data.to) this.enterMap(src.data.to);
          else this.enterMap('prev');
          break;
        case 'exit':
          this.enterMap('prev'); break;
        case 'travel':
          CL.ui.confirm('Vai a ' + (D.zones[data.to] ? D.zones[data.to].name : data.to) + '?',
            'Cammini per un po’ e raggiungi la zona.', () => {
              try {
                const sp = { costiera: { x: 3 * T, y: 14 * T }, napoli: { x: 62 * T, y: 28 * T }, vesuvio: { x: 32 * T, y: 45 * T }, pompei: { x: 5 * T, y: 30 * T } }[data.to] || (MAPS.get(data.to) || MAPS.get('napoli')).spawn;
                S.time.skip(.6); this.enterMap(data.to, sp.x, sp.y);
              } catch (e) { console.error(e); CL.ui.toast('Viaggio non riuscito.', 'bad'); }
            }); break;
        case 'shop': CL.ui.openShop(data.shop || 'negozio'); break;
        case 'sell': CL.ui.openMenu('vendi'); break;
        case 'job': S.jobs.work(data.job); break;
        case 'jobs': CL.ui.openMenu('lavori'); break;
        case 'jobsite': CL.ui.openMenu('lavori'); break;
        case 'bank': CL.ui.openMenu('banca'); break;
        case 'property': CL.ui.openMenu('immobili'); break;
        case 'realtor': CL.ui.openMenu('immobili'); break;
        case 'sleep': S.actions.sleep(); break;
        case 'cook': S.actions.cook(); break;
        case 'fish': S.actions.fish(); break;
        case 'boat': S.actions.boat(); break;
        case 'heal':
          CL.ui.confirm('Visita medica · 25 €', 'Ti senti subito meglio.', () => {
            if (S.economy.spend(25, 'Visita medica')) { S.needs.apply({ energy: 40, mood: 12, hygiene: 20 }); CL.audio.sfx('confirm'); }
          }); break;
        case 'status': CL.ui.openMenu('personaggio'); break;
        case 'quest_start': S.quests.give(data.id); break;
        case 'gift': CL.ui.openMenu('regalo', { npc: this.promptTarget && this.promptTarget.id }); break;
        case 'date': CL.ui.toast('Appuntamento al tramonto sul lungomare. Che romanticismo!', 'good'); S.relations.gift('giulia', 'fiore'); break;
        case 'close': CL.ui.closeDialogue(); break;
        case 'talk_family': CL.ui.dialogueText('Nonna Assunta', 'La famiglia è la cosa più importante. Tuo nonno faceva il pescatore, tua madre la maestra. Tu... puoi fare tutto quello che vuoi.'); break;
        case 'family_meal':
          if (S.family.meal()) CL.ui.dialogueText('Nonna Assunta', D.family.meal.text);
          else CL.ui.dialogueText('Nonna Assunta', 'La tavola è apparecchiata, ma oggi hai già mangiato. Torna domani, tesoro.');
          break;
        case 'talk_tip': CL.ui.dialogueText('Nonna Assunta', U.pick(D.tips)); break;
        case 'talk_neighborhood': CL.ui.dialogueText('Ciro', 'Qui vicino c’è tutto: il forno, la banca, il cantiere. Vai a Pompei se vuoi vedere la storia, o sul Vesuvio se vuoi stare bene.'); break;
        case 'talk_sea': CL.ui.dialogueText('Vecchio Pescatore', 'Il mare dà e il mare toglie. Io gli chiedo solo un pesce al giorno e un po’ di silenzio.'); break;
        case 'talk_coast': CL.ui.dialogueText('Turista', 'Grazie! Mi dicono che la costiera sia la cosa più bella d’Italia. Ci vado subito!'); break;
        case 'talk_vesuvio': CL.ui.dialogueText('Turista', 'Il Vesuvio! Wow! Speriamo non faccia casino... eh, scusa, non sono molto bravo in italiano.'); break;
        case 'talk_cave': CL.ui.dialogueText('Guardiano', 'Dentro c’è una luce che non viene da nessuna lampada. Porta una rete, se vuoi vedere chi la fa.'); break;
        case 'talk_social': CL.ui.dialogueText('Giulia', 'Mi piace come parli. Sembri uno che ha sempre qualcosa da raccontare.'); break;
        case 'eat_bar': CL.ui.confirm('Siediti al tavolo', 'Ordina qualcosa dal bancone.', () => CL.ui.openShop(data.shop || 'bar')); break;
        case 'eat_home': S.actions.cook(); break;
        case 'rest_pew': S.needs.apply({ mood: 8, energy: 4 }); CL.ui.toast('Ti siedi un momento in silenzio. Ti senti più calmo.', 'good'); CL.ui.refresh(); break;
        case 'order_pizza': CL.ui.confirm('Ordina pizza', 'Pizza margherita 8 €. Vuoi ordinarla?', () => { if (S.economy.spend(8, 'Pizza in pizzeria')) { S.needs.apply({ hunger: 48, mood: 10, thirst: -4 }); CL.ui.toast('Pizza servita! Buon appetito.', 'good'); CL.audio.sfx('confirm'); } }); break;
        case 'metro_ticket': CL.ui.openShop('metro'); break;
        case 'metro_travel': S.actions.metroTravel(data.to || 'metro2'); break;
        case 'flavor': case 'scenery': CL.ui.toast(src ? src.label : 'Un dettaglio del paesaggio.', 'info'); break;
        default: CL.ui.toast('Azione non disponibile: ' + a, 'info');
      }
    }

    dialogue(npcId) {
      const def = D.npcs[npcId]; if (!def) return;
      const maker = D.dialogue[npcId];
      let out;
      if (maker) {
        out = maker(this);
      } else {
        const place = this.map && this.map.name ? this.map.name : 'questa zona';
        const texts = {
          shop: `Benvenuto a ${place}: qui si lavora sodo, ma si fa sempre un sorriso.`,
          job: `A ${place} c’è sempre una mano in più che serve.`,
          family: `Sei di casa, a ${place}? Allora siediti un momento.`,
          ambient: `A ${place} passa di tutto: clienti, commercianti e gente del quartiere.`
        };
        const choices = [{ label: 'Arrivederci', action: 'close', data: {} }];
        const shopId = def.home === 'souvenir' ? 'pompei' : def.home;
        if (def.role === 'shop' && D.shops && D.shops[shopId]) {
          choices.unshift({ label: 'Compra qualcosa', action: 'shop', data: { shop: shopId } });
        } else if (def.role === 'job') {
          choices.unshift({ label: 'Cerca lavoro', action: 'jobs', data: {} });
        }
        out = { text: texts[def.role] || texts.ambient, choices };
      }
      CL.ui.showDialogue({
        name: def.name, look: def.look, text: out.text, choices: out.choices || [], npc: npcId
      });
    }

    /* Stato luce uniforme per ombre, facciate, dettagli e atmosfera.
     * hour e' frazionario (0..24); azimuth e' in radianti: -PI/4 = sole da NO,
     * 0 = zenit, +PI/4 = sole da NE. elevation e' in gradi (0..78, negativa di
     * notte), come si aspetta art.js. dirX/dirY sono la direzione dell'ombra in
     * screen-space (SE al mattino, SO nel pomeriggio), gia' normalizzata.
     * Nessun salto: i nodi sono continui e l'azimuth non avvolge mai (di notte
     * rientra da NE verso NO). */
    lightState() {
      const t = this.state && this.state.time;
      const fallback = (this.state && S.time && S.time.hour) ? S.time.hour() : 12;
      const raw = t && typeof t.hour === 'function' ? t.hour()
        : (t && Number.isFinite(t.min) ? t.min / 60 : fallback);
      const h = ((Number(raw) || 0) % 24 + 24) % 24;
      const key = Math.round(h * 100) + ':' + ((this.state && this.state.weather) || '');
      const cache = this._lightCache;
      if (cache && cache.key === key) return cache.value;

      const smooth = v => { const x = U.clamp(v, 0, 1); return x * x * (3 - 2 * x); };
      const ah = h < 6 ? h + 24 : h;
      const azKeys = [[6, -Math.PI / 4], [12, 0], [18, Math.PI / 4], [24, 0], [30, -Math.PI / 4]];
      let azimuth = -Math.PI / 4;
      for (let i = 0; i < azKeys.length - 1; i++) {
        if (ah <= azKeys[i + 1][0]) {
          const f = smooth((ah - azKeys[i][0]) / (azKeys[i + 1][0] - azKeys[i][0]));
          azimuth = U.lerp(azKeys[i][1], azKeys[i + 1][1], f);
          break;
        }
      }
      // +78° a mezzogiorno, 0 all'alba/tramonto, negativa di notte: continuo.
      const elevRad = Math.sin(Math.PI * (h - 6) / 12) * (78 * Math.PI / 180);
      const elevation = elevRad * 180 / Math.PI;
      const night = h >= 19 || h < 6;

      let dark;
      if (h < 5) dark = .48;
      else if (h < 7) dark = U.lerp(.48, .04, smooth((h - 5) / 2));
      else if (h < 17) dark = .02;
      else if (h < 19) dark = U.lerp(.02, .26, smooth((h - 17) / 2));
      else if (h < 21) dark = U.lerp(.26, .46, smooth((h - 19) / 2));
      else dark = U.lerp(.46, .48, smooth((h - 21) / 3));

      let warm = Math.max(0, 1 - Math.abs(h - 6) / 3) * .13
        + Math.max(0, 1 - Math.abs(h - 18) / 3) * .13;
      const wi = (this.state && S.weather && S.weather.info && S.weather.info()) || {};
      const overcast = wi.id === 'temporale' ? 1 : wi.id === 'pioggia' ? .8 : wi.id === 'nuvole' ? .45 : 0;
      dark = U.clamp(dark + (wi.dark || 0) * .85, 0, .56);
      warm *= (1 - overcast * .6);

      const tanE = Math.tan(Math.max(.12, Math.abs(elevRad)));
      // Fade continuo fra regime notturno e diurno: nessun salto all'alba.
      const dayMix = smooth((Math.sin(Math.PI * (h - 6) / 12) + .08) / .16);
      const base = U.lerp(9, 20, dayMix);
      const maxLen = U.lerp(26, 52, dayMix);
      const shadowLen = Math.round(U.clamp(base / tanE, 5, maxLen) * (1 - overcast * .22));

      const value = {
        hour: h,
        azimuth,
        elevation,
        dirX: -Math.sin(azimuth),
        dirY: Math.cos(azimuth),
        shadowLen,
        dark,
        warm,
        night
      };
      this._lightCache = { key, value };
      return value;
    }

    /* Gradienti cached in coordinate locali: il caller applica translate. */
    _cachedGradient(key, build) {
      if (!this._gradients) { this._gradients = Object.create(null); this._gradCount = 0; }
      let g = this._gradients[key];
      if (!g) {
        if (this._gradCount > 96) { this._gradients = Object.create(null); this._gradCount = 0; }
        g = this._gradients[key] = build();
        this._gradCount++;
      }
      return g;
    }
    _lightKey(light) {
      return [Math.round(light.azimuth * 80), Math.round(light.elevation * 80),
        light.shadowLen, Math.round(light.dark * 100), Math.round(light.warm * 100)].join(':');
    }
    _glow(c, key, x, y, r, inner, outer, alpha) {
      const rr = Math.max(2, Math.round(r));
      const g = this._cachedGradient('glow:' + key + ':' + rr, () => {
        const gr = c.createRadialGradient(0, 0, 1, 0, 0, rr);
        gr.addColorStop(0, inner); gr.addColorStop(1, outer); return gr;
      });
      c.save();
      if (alpha !== undefined) c.globalAlpha *= alpha;
      c.translate(Math.round(x), Math.round(y));
      c.fillStyle = g; c.fillRect(-rr, -rr, rr * 2, rr * 2);
      c.restore();
    }

    /* --------------------------------------------------------------- render */
    render() {
      const c = this.ctx;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, CL.VIEW_W, CL.VIEW_H);
      this.drawVoidBackdrop(c);
      if (!this.map) return;
      const m = this.map;
      c.save();
      CL.camera.apply(c);
      const x0 = Math.max(0, Math.floor(CL.camera.x / T) - 1);
      const y0 = Math.max(0, Math.floor(CL.camera.y / T) - 1);
      const x1 = Math.min(m.w - 1, Math.ceil((CL.camera.x + CL.VIEW_W) / T) + 1);
      const y1 = Math.min(m.h - 1, Math.ceil((CL.camera.y + CL.VIEW_H) / T) + 1);
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        const ch = m.g[ty][tx], img = ART.tileFor(ch, tx, ty, m);
        if (img) c.drawImage(img, tx * T, ty * T);
        if ((ch === 'W' || ch === '~') && (tx * 7 + ty * 3 + Math.floor(this.animT * 2)) % 9 === 0) {
          c.fillStyle = 'rgba(255,255,255,.13)';
          c.fillRect(tx * T + 2 + ((this.animT * 6) % 10), ty * T + 5, 7, 1);
        }
      }
      this.drawTileTransitions(c, m, x0, y0, x1, y1);
      this.drawCrosswalks(c, m);
      // Scene M1: non vengono più disegnate come rettangolo opaco sopra i tile.
      // La velatura viene mascherata con un gradiente radiale: nessun bordo
      // quadrato, tile e collisioni restano leggibili e allineati alla griglia.
      const bg = ART.backdropFor && ART.backdropFor(m.id);
      if (bg) this.drawScenicBackdrop(c, bg, m);
      // I prospetti non sono piu' uno sfondo fisso: entrano nello stesso sort
      // per profondita' di entita' e arredo. Con le impronte solide ripristinate
      // chi cammina davanti alla facciata resta visibile, chi la aggira a nord
      // viene correttamente coperto dall'edificio.
      const structureTypes = {
        gesu_facade: 1, palazzo_ne: 1, palazzo_sw: 1, palazzo_banca: 1,
        palazzo_bar: 1, palazzo_se: 1, palazzo_e: 1, campanile: 1,
        metric_facade: 1
      };
      // oggetti alti + entità, ordinati per profondità
      const items = [];
      for (const d of (m.decors || [])) {
        if (!structureTypes[d.type]) continue;
        if (d.x > CL.camera.x - 160 && d.x < CL.camera.x + CL.VIEW_W + 160 &&
            d.y > CL.camera.y - 260 && d.y < CL.camera.y + CL.VIEW_H + 120) {
          items.push({ y: this.decorSortY(d), decor: d });
        }
      }
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        const ch = m.g[ty][tx];
        // 'P' e' un albero nelle mappe esterne (nelle stanze resta una pianta
        // in vaso). Viene disegnato come entita' alta: niente sfondo quadrato.
        const treeTile = ch === 'T' || ch === '^' ||
          (ch === 'P' && m.zone && m.zone !== 'interno');
        if (treeTile) items.push({ y: ty * T + 16, kind: ch, tx, ty });
        if (ch === 'O') {
          const up = ty > 0 ? m.g[ty - 1][tx] : '';
          const left = tx > 0 ? m.g[ty][tx - 1] : '';
          if (up !== 'O' && left !== 'O') items.push({ y: ty * T + 3 * T, kind: 'O', tx, ty });
        }
      }
      for (const d of (m.decors || [])) {
        if (structureTypes[d.type]) continue; // già disegnati come sfondo
        const dy = this.decorSortY(d);
        if (d.x > CL.camera.x - 160 && d.x < CL.camera.x + CL.VIEW_W + 160 && d.y > CL.camera.y - 200 && d.y < CL.camera.y + CL.VIEW_H + 160) {
          items.push({ y: dy, decor: d });
        }
      }
      for (const e of this.entities) if (e.alive) {
        // Chi sta sulla soglia va davanti al prospetto: la porta e' un varco,
        // non un muro. Dietro l'edificio (senza portal) resta correttamente
        // coperto dalla facciata.
        const tile = MAPS.tile(m, Math.floor(e.x / T), Math.floor(e.y / T));
        const onThreshold = MAPS.portalAt(m, e.x, e.y) || MAPS.doorClosed(m, e.x, e.y) ||
          tile === 'Y' || tile === '7' || tile === '8';
        // La profondità è il punto di contatto a terra (fondo dei piedi),
        // non il centro della hitbox: con l'ancoraggio corretto l'ombra e i
        // piedi sono 4 px più in basso e un decor non deve coprirli a metà.
        items.push({ y: e.y + (e.h || 10) / 2 + (e.offsetY || 0) + (onThreshold ? 10000 : 0), ent: e });
      }
      items.sort((a, b) => a.y - b.y);
      for (const it of items) {
        if (it.ent) it.ent.draw(c);
        else if (it.decor) this.drawDecor(c, it.decor);
        else if (it.kind === 'T' || it.kind === 'P') {
          // Sette varianti deterministiche: la chioma non e' sempre la stessa
          // sagoma, e il tile sotto resta pavimento continuo con sola ombra.
          const variant = U.hash('tree:' + m.id + ':' + it.tx + ':' + it.ty) % 7;
          // Il filare di Viale Augusto e' documentato come Washingtonia:
          // usa palmTree, non la chioma sferica usata altrove.
          const img = m.id === 'fuorigrotta' ? ART.palmTree(variant)
            : m.zone === 'costiera' ? ART.lemonTree(variant) : ART.tree(variant);
          c.drawImage(img, it.tx * T - 8, it.ty * T - 24);
        } else if (it.kind === 'O') {
          this.drawGuglia(c, it.tx * T, it.ty * T);
        } else c.drawImage(ART.rock((it.tx + it.ty) % 3), it.tx * T - 2, it.ty * T - 8);
      }
      c.restore();
      // Layer coerenti: atmosfera (buio/calore/vignetta) → luci → HUD.
      // Le luci devono passare DOPRA la velatura scura, non essere attenuate da essa.
      this.drawAtmosphere(c);
      this.drawLights(c);
      this.drawHud(c);
    }

    drawScenicBackdrop(c, bg, m) {
      const key = 'bg:' + m.id;
      if (!this._backdrops) this._backdrops = {};
      let layer = this._backdrops[key];
      if (!layer) {
        const W = m.w * T, H = m.h * T;
        layer = document.createElement('canvas'); layer.width = W; layer.height = H;
        const lx = layer.getContext('2d');
        const scale = Math.max(W / bg.width, H / bg.height);
        const dw = bg.width * scale, dh = bg.height * scale;
        lx.imageSmoothingEnabled = true;
        lx.drawImage(bg, (W - dw) / 2, (H - dh) / 2, dw, dh);
        // Maschera radiale: il bordo del rettangolo non è mai visibile.
        lx.globalCompositeOperation = 'destination-in';
        const g = lx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .12,
          W / 2, H / 2, Math.max(W, H) * .52);
        g.addColorStop(0, 'rgba(0,0,0,1)');
        g.addColorStop(.6, 'rgba(0,0,0,.72)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        lx.fillStyle = g; lx.fillRect(0, 0, W, H);
        this._backdrops[key] = layer;
      }
      c.save(); c.globalAlpha = .14; c.drawImage(layer, 0, 0); c.restore();
    }

    drawLights(c) {
      if (!this.map) return;
      const m = this.map, cam = CL.camera;
      const light = this.lightState();
      const h = light.hour;
      const night = light.night;
      const dusk = h >= 17 && h < 20;
      const indoors = m.zone === 'interno';
      c.save();
      c.globalCompositeOperation = 'lighter';
      // decor lights
      for (const d of (m.decors || [])) {
        const sx = d.x - cam.x, sy = d.y - cam.y;
        if (sx < -60 || sy < -60 || sx > CL.VIEW_W + 60 || sy > CL.VIEW_H + 60) continue;
        // I nuovi dettagli portano il tipo funzionale in data.kind.
        const kind = (d.data && d.data.kind) || d.type;
        if (d.type === 'lamp' && (night || dusk)) {
          // La lanterna disegnata sta a sy-14…-4: il centro del bagliore deve
          // coincidere con essa, non con il vecchio sy-20 (6 px piu' in alto).
          const r = 29 * (.94 + Math.sin(this.animT * 3.1 + sx * .07) * .06);
          const g = c.createRadialGradient(sx + 8, sy - 10, 1, sx + 8, sy - 10, r);
          g.addColorStop(0, 'rgba(255,236,170,.30)'); g.addColorStop(1, 'rgba(255,220,120,0)');
          c.fillStyle = g; c.fillRect(sx + 8 - r, sy - 10 - r, r * 2, r * 2);
        }
        // Nuove sorgenti M1: lampade da muro/soffitto e insegne dei negozi.
        // Il bagliore e' un gradiente radiale cacheato, non un rettangolo opaco.
        if (kind === 'wall_lamp' && (night || dusk || indoors)) {
          const r = 25 * (.95 + Math.sin(this.animT * 2.8 + sx * .09) * .05);
          this._glow(c, 'wall', sx + (d.data.ox || 0) + 4, sy + (d.data.oy || 0) + 6, r, 'rgba(255,232,176,.28)', 'rgba(255,196,110,0)', .92);
        }
        if (kind === 'ceiling_lamp' && (indoors || night)) {
          const r = d.data.r || 28;
          this._glow(c, 'ceil', sx + (d.data.ox || 0) + 7, sy + (d.data.oy || 0) + 3, r, 'rgba(255,238,190,.24)', 'rgba(255,210,130,0)', indoors ? .78 : .9);
        }
        if (kind === 'shop_sign' && (night || dusk)) {
          const sw = d.data.w || 32, sh = d.data.h || 12;
          const r = Math.max(sw, sh) * .82;
          this._glow(c, 'sign', sx + (d.data.ox || 0) + sw / 2, sy + (d.data.oy || 0) + sh / 2, r, 'rgba(255,190,104,.24)', 'rgba(255,126,62,0)', .9);
        }
        if ((d.type === 'candle_glow') && (indoors || night || dusk)) {
          const r = 22 * (.93 + Math.sin(this.animT * 4.2 + sx * .11) * .07);
          const g = c.createRadialGradient(sx + 8, sy, 1, sx + 8, sy, r);
          g.addColorStop(0, 'rgba(255,170,70,.22)'); g.addColorStop(1, 'rgba(255,140,40,0)');
          c.fillStyle = g; c.fillRect(sx - r, sy - r, r * 2, r * 2);
        }
        if (d.type === 'warm_light') {
          const r = d.data.r || 24; const col = d.data.color || 'rgba(255,190,120,.14)';
          c.save();
          c.globalAlpha = .92 + Math.sin(this.animT * 2.4 + sx * .05) * .08;
          const g = c.createRadialGradient(sx, sy, 2, sx, sy, r);
          g.addColorStop(0, col); g.addColorStop(1, col.replace(/,[^,]+\)$/, ',0)'));
          c.fillStyle = g; c.fillRect(sx - r, sy - r, r * 2, r * 2);
          c.restore();
        }
        if (d.type === 'window_light' && (night || indoors || dusk)) {
          const ww = d.data.w || 16, wh = d.data.h || 10;
          const g = c.createLinearGradient(sx, sy, sx + ww, sy + wh);
          g.addColorStop(0, d.data.color || 'rgba(255,228,165,.24)');
          g.addColorStop(1, 'rgba(180,110,50,.10)');
          c.fillStyle = g; c.fillRect(sx, sy, ww, wh);
          c.strokeStyle = 'rgba(70,52,38,.55)'; c.lineWidth = 1;
          c.beginPath(); c.moveTo(sx + ww / 2, sy); c.lineTo(sx + ww / 2, sy + wh);
          c.moveTo(sx, sy + wh / 2); c.lineTo(sx + ww, sy + wh / 2); c.stroke();
        }
      }
      // Le finestre illuminate non sono rettangoli piatti: vetro caldo con
      // montanti e riflesso, coerente con le facciate M1.
      if (!indoors && (night || dusk)) {
        const x0 = Math.max(0, Math.floor(cam.x / T) - 1), y0 = Math.max(0, Math.floor(cam.y / T) - 1);
        const x1 = Math.min(m.w - 1, Math.ceil((cam.x + CL.VIEW_W) / T) + 1);
        const y1 = Math.min(m.h - 1, Math.ceil((cam.y + CL.VIEW_H) / T) + 1);
        for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
          const ch = m.g[ty][tx];
          if (ch === 'L' || ch === '7') {
            const sx = tx * T - cam.x + 3, sy = ty * T - cam.y + 3;
            const g = c.createLinearGradient(sx, sy, sx + 10, sy + 8);
            g.addColorStop(0, 'rgba(255,231,168,.26)'); g.addColorStop(1, 'rgba(150,92,48,.10)');
            c.fillStyle = g; c.fillRect(sx, sy, 10, 8);
            c.fillStyle = 'rgba(90,68,48,.55)'; c.fillRect(sx + 5, sy, 1, 8);
            c.fillStyle = 'rgba(255,245,210,.22)'; c.fillRect(sx + 1, sy + 1, 3, 1);
          }
        }
      }
      c.restore();
    }

    drawAtmosphere(c) {
      const light = this.lightState();
      const indoors = this.map && this.map.zone === 'interno';
      // Stessi valori di lightState: niente scale orarie diverse fra ombre e velo.
      const dark = U.clamp(indoors ? (light.night ? .18 : .08) : light.dark, 0, .48);
      const warm = indoors ? .06 : light.warm;
      if (dark > 0) { c.fillStyle = 'rgba(10,16,38,' + dark + ')'; c.fillRect(0, 0, CL.VIEW_W, CL.VIEW_H); }
      if (warm > 0) { c.fillStyle = 'rgba(255,170,90,' + warm + ')'; c.fillRect(0, 0, CL.VIEW_W, CL.VIEW_H); }
      // Velatura direzionale coerente con l'ombra: lato del sole più caldo,
      // lato dell'ombra più freddo. Semi-trasparente, non nasconde tile né HUD.
      const key = 'atmo:' + this._lightKey(light) + (indoors ? ':in' : '');
      const veil = this._cachedGradient(key, () => {
        const cx = CL.VIEW_W / 2, cy = CL.VIEW_H / 2;
        const R = Math.hypot(CL.VIEW_W, CL.VIEW_H) * .55;
        const gr = c.createLinearGradient(cx - light.dirX * R, cy - light.dirY * R,
          cx + light.dirX * R, cy + light.dirY * R);
        gr.addColorStop(0, 'rgba(255,236,196,' + (indoors ? .015 : .035) + ')');
        gr.addColorStop(.5, 'rgba(128,138,160,0)');
        gr.addColorStop(1, 'rgba(16,24,44,' + (.035 + dark * .075) + ')');
        return gr;
      });
      c.fillStyle = veil; c.fillRect(0, 0, CL.VIEW_W, CL.VIEW_H);
      const vig = this._cachedGradient('vignette:' + (indoors ? 'in' : 'out'), () => {
        const gr = c.createRadialGradient(240, 135, 80, 240, 135, 290);
        gr.addColorStop(0, 'rgba(0,0,0,0)');
        gr.addColorStop(1, 'rgba(4,8,14,' + (indoors ? '.22' : '.30') + ')');
        return gr;
      });
      c.fillStyle = vig; c.fillRect(0, 0, CL.VIEW_W, CL.VIEW_H);
    }

    drawHud(c) {
      this.particles.draw(c);
      // nome luogo (breve)
      G.panel(c, 6, 6, Math.min(180, 20 + this.map.name.length * 5), 16, { fill: 'rgba(12,20,28,.72)', border: '#e9b84a' });
      G.text(c, this.map.name, 12, 9, { size: 8, color: '#f6e8c8' });
      // prompt
      if (this.prompt && !CL.ui.isModal()) {
        const wd = Math.max(96, this.prompt.length * 4.6 + 16);
        G.panel(c, 240 - wd / 2, 232, wd, 20, { fill: 'rgba(12,20,28,.88)' });
        G.text(c, this.prompt, 240, 238, { size: 8, align: 'center', color: '#e9b84a' });
      }
      // guida contestuale all'inizio (non deve bloccare input; fadeT solo visivo)
      if (this.fadeT > 0) this.fadeT = Math.max(0, this.fadeT - 0.03);
      if (this.debug) this.drawDebug(c);
      this.drawMinimap(c);
    }

    drawVoidBackdrop(c) {
      // Le mappe interne più piccole della viewport non mostrano più un rettangolo piatto.
      c.fillStyle = '#1a2630'; c.fillRect(0, 0, CL.VIEW_W, CL.VIEW_H);
      for (let y = 0; y < CL.VIEW_H; y += 16) for (let x = 0; x < CL.VIEW_W; x += 16) {
        const odd = ((x / 16) + (y / 16)) % 2 === 0;
        c.fillStyle = odd ? 'rgba(255,255,255,.018)' : 'rgba(0,0,0,.055)';
        c.fillRect(x, y, 16, 16);
        c.fillStyle = 'rgba(255,255,255,.022)'; c.fillRect(x, y, 16, 1);
      }
    }

    drawTileTransitions(c, m, x0, y0, x1, y1) {
      const at = (tx, ty) => CL.maps.tile(m, tx, ty);
      const curb = 'rgba(18,20,24,.16)';
      const indoor = { A: 1, M: 1, R: 1, h: 1 }; // solo pavimenti calpestabili
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        const px = tx * T, py = ty * T, ch = at(tx, ty);
        if (ch === 'p') {
          // Giunti di basolato solo sul marciapiede esistente.
          c.fillStyle = 'rgba(86,80,70,.10)';
          c.fillRect(px, py + 8, T, 1); c.fillRect(px + 8, py, 1, 8);
          c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(px, py + 9, T, 1);
          if (at(tx, ty - 1) === 'r') { c.fillStyle = '#d8d0c0'; c.fillRect(px, py, T, 2); c.fillStyle = '#918a7c'; c.fillRect(px, py + 2, T, 1); }
          if (at(tx, ty + 1) === 'r') { c.fillStyle = '#9a9284'; c.fillRect(px, py + T - 2, T, 2); c.fillStyle = '#d8d0c0'; c.fillRect(px, py + T - 3, T, 1); }
          if (at(tx - 1, ty) === 'r') { c.fillStyle = '#d8d0c0'; c.fillRect(px, py, 2, T); c.fillStyle = '#918a7c'; c.fillRect(px + 2, py, 1, T); }
          if (at(tx + 1, ty) === 'r') { c.fillStyle = '#9a9284'; c.fillRect(px + T - 2, py, 2, T); c.fillStyle = '#d8d0c0'; c.fillRect(px + T - 3, py, 1, T); }
        } else if (ch === 'r') {
          // Ombra di cordolo lato strada, solo dove il marciapiede confina.
          if (at(tx, ty - 1) === 'p') { c.fillStyle = curb; c.fillRect(px, py, T, 3); c.fillStyle = '#6b7075'; c.fillRect(px, py, T, 1); }
          if (at(tx, ty + 1) === 'p') { c.fillStyle = curb; c.fillRect(px, py + T - 3, T, 3); c.fillStyle = '#6b7075'; c.fillRect(px, py + T - 1, T, 1); }
          if (at(tx - 1, ty) === 'p') { c.fillStyle = curb; c.fillRect(px, py, 3, T); c.fillStyle = '#6b7075'; c.fillRect(px, py, 1, T); }
          if (at(tx + 1, ty) === 'p') { c.fillStyle = curb; c.fillRect(px + T - 3, py, 3, T); c.fillStyle = '#6b7075'; c.fillRect(px + T - 1, py, 1, T); }
        } else if (indoor[ch]) {
          // Giunti di pavimento: solo superfici già calpestabili, niente porte.
          c.fillStyle = 'rgba(70,60,48,.07)';
          c.fillRect(px, py + T - 1, T, 1); c.fillRect(px + T - 1, py, 1, T);
        }
      }
    }

    drawCrosswalks(c, m) {
      const rules = {
        napoli: [
          { x: 58, y: 42, w: 2, h: 4, dir: 'v' },
          { x: 26, y: 46, w: 2, h: 2, dir: 'h' }
        ],
        costiera: [{ x: 20, y: 14, w: 5, h: 2, dir: 'h' }, { x: 50, y: 14, w: 5, h: 2, dir: 'h' }],
        bacoli: [{ x: 18, y: 12, w: 5, h: 2, dir: 'h' }],
        salerno: [{ x: 28, y: 18, w: 5, h: 2, dir: 'h' }],
        avellino: [{ x: 24, y: 21, w: 2, h: 4, dir: 'v' }],
        caserta: [{ x: 28, y: 32, w: 5, h: 2, dir: 'h' }],
        fuorigrotta: [
          { x: 19, y: 18, w: 4, h: 2, dir: 'v' },
          { x: 54, y: 18, w: 4, h: 2, dir: 'v' },
          { x: 19, y: 32, w: 4, h: 2, dir: 'v' },
          { x: 54, y: 35, w: 4, h: 2, dir: 'v' },
          { x: 30, y: 19, w: 4, h: 2, dir: 'h' },
          { x: 50, y: 36, w: 4, h: 2, dir: 'h' }
        ],
        pianura: [{ x: 30, y: 38, w: 5, h: 2, dir: 'h' }, { x: 48, y: 18, w: 2, h: 2, dir: 'h' }]
      };
      for (const r of (rules[m.id] || [])) {
        if (CL.maps.tile(m, r.x, r.y) !== 'r') continue;
        c.save();
        c.globalAlpha = .72;
        c.fillStyle = '#e8e2cf';
        if (r.dir === 'h') {
          for (let i = 0; i < r.w; i += 2) c.fillRect((r.x + i) * T + 2, r.y * T + 1, 2, r.h * T - 2);
        } else {
          for (let i = 0; i < r.h; i += 2) c.fillRect(r.x * T + 1, (r.y + i) * T + 2, r.w * T - 2, 2);
        }
        c.restore();
      }
    }

    decorSortY(d) {
      // I dettagli montati sulle facciate forzano la loro profondità: devono
      // passare davanti al prospetto senza spostare l'ancoraggio del sprite.
      if (d.data && d.data.sortY !== undefined) return d.data.sortY;
      if (d.type === 'lamp') return d.y + 16;
      if (d.type === 'bench') return d.y + 10;
      // Le tende dei negozi devono restare sopra le facciate M1 che le coprivano.
      if (d.type === 'awning') return d.y + 48;
      const h = d.data.h || 16;
      const oy = d.data.oy !== undefined ? d.data.oy : (16 - h);
      return d.y + oy + h;
    }

    drawGuglia(c, x, y) {
      const img = ART.gugliaSprite();
      if (!img) return;
      // L'impronta solida O e' 4x3 celle: la base dell'asset metrico coincide
      // con il bordo inferiore dell'impronta, lo sviluppo va verso l'alto.
      const fw = 4 * T, fh = 3 * T;
      const dx = x + Math.round((fw - img.width) / 2);
      const dy = y + fh - img.height;
      // Il basamento poggia sul selciato: ombra a contatto e due giunti di
      // pavimento interrotti dal piedistallo, non un rettangolo incollato.
      c.save();
      c.fillStyle = 'rgba(30,28,24,.20)';
      c.beginPath(); c.ellipse(x + fw / 2, y + fh - 2, fw * .40, 3, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(92,84,72,.34)'; c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x + 2, y + fh - 3); c.lineTo(dx + 5, y + fh - 3);
      c.moveTo(dx + img.width - 5, y + fh - 3); c.lineTo(x + fw - 2, y + fh - 3);
      c.stroke();
      c.restore();
      c.drawImage(img, dx, dy);
    }

    softShadow(c, x, y, rx, ry) {
      c.save();
      const r = Math.max(4, rx || 8), g = c.createRadialGradient(x, y, 1, x, y, r);
      g.addColorStop(0, 'rgba(28,26,22,.24)');
      g.addColorStop(1, 'rgba(28,26,22,0)');
      c.fillStyle = g;
      c.beginPath(); c.ellipse(x, y, r, Math.max(2, ry || 3), 0, 0, Math.PI * 2); c.fill();
      c.restore();
    }

    /* Ombra di appoggio per i corpi edilizi: radiale, non un rettangolo scuro.
     * È disegnata prima della facciata, quindi non copre porte o finestre. */
    groundShadow(c, x, y, rx, ry) {
      c.save();
      const r = Math.max(8, rx || 24), g = c.createRadialGradient(x, y, 2, x, y, r);
      g.addColorStop(0, 'rgba(24,22,20,.30)');
      g.addColorStop(.55, 'rgba(24,22,20,.13)');
      g.addColorStop(1, 'rgba(24,22,20,0)');
      c.fillStyle = g;
      c.beginPath(); c.ellipse(x, y, r, Math.max(3, ry || 5), 0, 0, Math.PI * 2); c.fill();
      c.restore();
    }

    /* Ombra di appoggio + facciata: un unico helpers tiene M1 e facciate
     * procedurali sulla stessa pipeline. Tutte le ombre sono disegnate prima
     * dell'asset; le occlusioni successive sono limitate a gronda e bordi,
     * quindi non coprono porte, finestre o balconi. */
    drawFacade(c, d, kind) {
      const light = this.lightState();
      const img = ART.buildingSprite(kind, light);
      if (!img) return;
      const dx = d.x + (d.data.ox || 0);
      const dy = d.y + (d.data.oy !== undefined ? d.data.oy : 0);
      const w = img.width, h = img.height;
      const baseY = dy + h;
      const rx = Math.min(w * 0.50, 120);
      const ry = Math.max(8, Math.min(16, Math.round(h * 0.075)));
      const L = light.shadowLen, vx = light.dirX, vy = light.dirY;
      const lk = this._lightKey(light);

      // Proiezione a terra: il poligono parte dal piede della facciata e segue
      // la direzione uniforme dell'ombra. Lunghezza e verso variano con l'ora,
      // alpha diminuisce verso l'esterno. Nessun rettangolo fisso.
      c.save();
      c.translate(dx, baseY - 1);
      c.fillStyle = this._cachedGradient('ground:' + kind + ':' + lk, () => {
        const gr = c.createLinearGradient(0, 0, vx * L, vy * L);
        const a = (light.night ? .14 : .32) * (1 - light.dark * .35);
        gr.addColorStop(0, 'rgba(20,18,16,' + a.toFixed(3) + ')');
        gr.addColorStop(.55, 'rgba(20,18,16,' + (a * .45).toFixed(3) + ')');
        gr.addColorStop(1, 'rgba(20,18,16,0)');
        return gr;
      });
      c.beginPath();
      c.moveTo(0, 0); c.lineTo(w, 0);
      c.lineTo(w + vx * L, vy * L);
      c.lineTo(vx * L, vy * L);
      c.closePath(); c.fill();
      c.restore();

      // Contatto radiale sotto il piede, non dentro il prospetto.
      this.groundShadow(c, dx + w * .5 + vx * 3, baseY + Math.max(2, vy * 3), rx, ry);
      c.drawImage(img, dx, dy);

      // Profondità 2D: ombreggiatura laterale del volume (lato in ombra in
      // base al segno di dirX) e occlusione ambientale sotto la gronda.
      // I gradienti sono trasparenti al centro: aperture e portali restano
      // leggibili. Tutto e' in coordinate locali, quindi riusabile.
      const sw = Math.max(4, Math.min(18, Math.round(w * .06)));
      const th = Math.max(4, Math.min(12, Math.round(h * .05)));
      const sidePower = .14 + light.dark * .18;
      const leftA = vx >= 0 ? sidePower * .35 : sidePower;
      const rightA = vx >= 0 ? sidePower : sidePower * .35;
      const sKey = 'facside:' + kind + ':' + lk + ':' + leftA.toFixed(2) + ':' + rightA.toFixed(2);
      const tKey = 'factop:' + kind + ':' + lk + ':' + th;
      const topA = (.10 + .12 * (1 - U.clamp(light.elevation / 78, 0, 1))) * (1 + light.dark * .4);
      c.save();
      c.translate(dx, dy);
      c.fillStyle = this._cachedGradient(sKey, () => {
        const gr = c.createLinearGradient(0, 0, w, 0);
        gr.addColorStop(0, 'rgba(12,16,24,' + leftA.toFixed(3) + ')');
        gr.addColorStop(sw / w, 'rgba(12,16,24,0)');
        gr.addColorStop(1 - sw / w, 'rgba(12,16,24,0)');
        gr.addColorStop(1, 'rgba(12,16,24,' + rightA.toFixed(3) + ')');
        return gr;
      });
      c.fillRect(0, 0, w, h);
      c.fillStyle = this._cachedGradient(tKey, () => {
        const gr = c.createLinearGradient(0, 0, 0, th);
        gr.addColorStop(0, 'rgba(10,14,22,' + topA.toFixed(3) + ')');
        gr.addColorStop(1, 'rgba(10,14,22,0)');
        return gr;
      });
      c.fillRect(0, 0, w, th);
      c.restore();
    }

    drawDecor(c, d) {
      const x = d.x, y = d.y;
      c.save();
      switch (d.type) {
        case 'gesu_facade': {
          this.drawFacade(c, d, 'gesu');
          break;
        }
        case 'palazzo_ne': case 'palazzo_sw': case 'palazzo_banca': case 'palazzo_bar': case 'palazzo_se': case 'palazzo_e': {
          this.drawFacade(c, d, d.type);
          break;
        }
        case 'metric_facade': {
          // Facciate metriche delle nuove zone: sfondo architettonico, non entità.
          // Il tipo architettonico e' in data.type (d.type e' il decor 'metric_facade').
          this.drawFacade(c, d, d.data.type);
          break;
        }
        case 'guglia_overlay': {
          this.drawGuglia(c, x, y);
          break;
        }
        case 'campanile': {
          const img = ART.campanileSprite();
          if (img) c.drawImage(img, x + (d.data.ox || 0), y + (d.data.oy || 0));
          break;
        }
        case 'edicola': {
          this.softShadow(c, x + 24, y + 50, 22, 3);
          const img = ART.propSprite('edicola'); if (img) c.drawImage(img, x, y);
          break;
        }
        case 'awning': {
          const img = ART.awningSprite(d.data.color || '#b94a3a', d.data.w || 32);
          if (img) c.drawImage(img, x, y);
          break;
        }
        case 'facade_cornice': {
          const img = ART.trimSprite('cornice', d.data.w || 32, d.data.color || '#b9b0a0', false);
          if (img) c.drawImage(img, x, y + (d.data.oy || 0));
          break;
        }
        case 'facade_balcony': {
          const img = ART.trimSprite('balcony', d.data.w || 40, '#b7ae9d', d.data.pots !== false);
          if (img) c.drawImage(img, x, y + (d.data.oy || 0) - 12);
          break;
        }
        /* Micro-dettagli non solidi M1: same anchor rule for all five families. */
        case 'street_detail': case 'facade_detail': case 'interior_detail':
        case 'rail_detail': case 'shop_sign':
        case 'wall_lamp': case 'ceiling_lamp': {
          const data = d.data || {};
          const img = ART.detailSprite
            ? ART.detailSprite(data.kind || d.type, data.variant || 0)
            : (ART.propSprite ? ART.propSprite(data.kind || d.type) : null);
          if (!img) break;
          const dw = data.w || img.width, dh = data.h || img.height;
          const px = x + (data.ox || 0), py = y + (data.oy || 0);
          if (data.shadow === true) this.softShadow(c, px + dw / 2, py + dh - 1, Math.min(dw * .42, 20), 3);
          c.drawImage(img, px, py, dw, dh);
          break;
        }
        case 'parked_vehicle': {
          const data = d.data || {};
          const img = ART.vehicle(data.type || 'car', data.dir || 'right');
          if (!img) break;
          const px = x + (data.ox || 0), py = y + (data.oy || 0);
          const dw = data.w || img.width, dh = data.h || img.height;
          this.softShadow(c, px + dw / 2, py + dh - 2, Math.max(6, dw * .4), 3);
          c.drawImage(img, px, py, dw, dh);
          break;
        }
        case 'laundry_line': {
          const x2 = d.data.x2 !== undefined ? d.data.x2 : x + 48;
          const y2 = d.data.y2 !== undefined ? d.data.y2 : y;
          const sag = d.data.sag || 8, colors = d.data.colors || ['#e9e2d0', '#b94a3a', '#6f93ad'];
          // Fase deterministica: dipende solo dalla posa, mai da Math.random.
          const phase = x * .013 + y * .007 + (d.data.phase || 0);
          const t = this.animT;
          const low = Math.max(y, y2) + sag + Math.sin(t * .8 + phase) * .8;
          const sway = Math.sin(t * 1.15 + phase) * 1.4;
          c.strokeStyle = 'rgba(60,55,50,.55)'; c.lineWidth = 1;
          c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo((x + x2) / 2, low, x2, y2); c.stroke();
          for (let i = 0; i < 3; i++) {
            const f = (i + 1) / 4;
            const bend = Math.sin(Math.PI * f);
            const cx = Math.round(x + (x2 - x) * f + sway * bend + Math.sin(t * 1.7 + phase + i) * .5);
            const cy = Math.round((1 - f) * (1 - f) * y + 2 * (1 - f) * f * low + f * f * y2
              + Math.sin(t * 1.9 + phase + i * 1.7) * .6);
            // Passata 0 = ombra del panno, passata 1 = panno: stessa sagoma.
            for (let pass = 0; pass < 2; pass++) {
              const ox = pass === 0 ? 1.5 : 0, oy = pass === 0 ? 2 : 0;
              c.fillStyle = pass === 0 ? 'rgba(24,22,20,.18)' : colors[i % colors.length];
              c.beginPath();
              c.moveTo(cx - 5 + ox, cy + oy); c.lineTo(cx + 5 + ox, cy + oy);
              c.lineTo(cx + 4 + ox, cy + 7 + oy); c.lineTo(cx + 2 + ox, cy + 6 + oy);
              c.lineTo(cx + ox, cy + 8 + oy); c.lineTo(cx - 2 + ox, cy + 6 + oy);
              c.lineTo(cx - 5 + ox, cy + 7 + oy);
              c.closePath(); c.fill();
              if (pass === 1) {
                c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(cx - 3, cy + 1, 2, 5);
                c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(cx + 2, cy + 1, 1, 5);
              }
            }
          }
          break;
        }
        case 'fishing_net': {
          const W = d.data.w || 24, H = d.data.h || 20;
          c.strokeStyle = 'rgba(74,66,52,.58)'; c.lineWidth = 1;
          for (let i = 0; i <= W; i += 5) { c.beginPath(); c.moveTo(x + i, y); c.lineTo(x + i, y + H); c.stroke(); }
          for (let j = 0; j <= H; j += 5) { c.beginPath(); c.moveTo(x, y + j); c.lineTo(x + W, y + j); c.stroke(); }
          c.fillStyle = '#c95a3a'; c.fillRect(x + W - 3, y + H - 6, 4, 4);
          c.fillStyle = '#e8dcc0'; c.fillRect(x - 1, y + H - 3, 5, 3);
          break;
        }
        case 'ruin_column': {
          // Fusto scanalato, capitello scheggiato e base: la colonna resta
          // ancorata a terra come le altre entità alte.
          const H = d.data.h || 18;
          c.fillStyle = '#a99c87'; c.fillRect(x, y - H + 4, 8, H - 4);
          c.fillStyle = '#c6b9a2'; c.fillRect(x + 1, y - H + 5, 2, H - 6);
          c.fillStyle = '#8f8371'; c.fillRect(x + 4, y - H + 5, 1, H - 6);
          c.fillStyle = 'rgba(40,32,24,.20)'; c.fillRect(x + 7, y - H + 5, 1, H - 6);
          c.fillStyle = '#d2c7b2'; c.fillRect(x - 2, y - H, 12, 4);
          c.fillStyle = '#e2d8c4'; c.fillRect(x - 1, y - H, 10, 1);
          c.fillStyle = '#9c907d'; c.fillRect(x - 1, y, 10, 3);
          c.fillStyle = '#b8ac97'; c.fillRect(x, y + 1, 8, 1);
          c.fillStyle = 'rgba(60,50,40,.26)'; c.fillRect(x + 3, y - H + 1, 2, 2);
          break;
        }
        case 'lamp': {
          this.softShadow(c, x + 8, y + 15, 12, 3);
          const img = ART.propSprite('lamp'); if (img) c.drawImage(img, x - 4, y - 36); break;
        }
        case 'bench': {
          this.softShadow(c, x + 12, y + 11, 18, 3);
          const img = ART.propSprite('bench'); if (img) c.drawImage(img, x - 6, y - 10); break;
        }
        case 'plant': {
          this.softShadow(c, x + 8, y + 2, 10, 2);
          const img = ART.propSprite('plant');
          if (img) {
            c.translate(x + 8, y);
            c.rotate(Math.sin(this.animT * 1.3 + x * .04) * .035);
            c.drawImage(img, -9, -18);
          }
          break;
        }
        case 'home_plant': {
          const img = ART.propSprite(d.type);
          if (img) {
            const dw = d.data.w || img.width, dh = d.data.h || img.height;
            const oy = d.data.oy !== undefined ? d.data.oy : (16 - dh);
            this.softShadow(c, x + (d.data.ox || 0) + dw / 2, y + oy + dh - 1, Math.min(dw * .42, 12), 3);
            c.translate(x + (d.data.ox || 0) + dw / 2, y + oy + dh);
            c.rotate(Math.sin(this.animT * 1.1 + x * .03) * .03);
            c.drawImage(img, -dw / 2, -dh, dw, dh);
          }
          break;
        }
        case 'cart': {
          this.softShadow(c, x + 16, y + 11, 19, 3);
          const img = ART.propSprite('cart'); if (img) c.drawImage(img, x - 4, y - 16); break;
        }
        case 'sign': {
          this.softShadow(c, x + 8, y + 11, 12, 3);
          const img = ART.propSprite('sign'); if (img) c.drawImage(img, x - 6, y - 22); break;
        }
        case 'table_out': {
          this.softShadow(c, x + 8, y + 9, 14, 3);
          const img = ART.propSprite('table_out'); if (img) c.drawImage(img, x - 6, y - 10); break;
        }
        case 'chair_out': {
          this.softShadow(c, x + 4, y + 7, 8, 2);
          const img = ART.propSprite('chair_out'); if (img) c.drawImage(img, x - 3, y - 10); break;
        }
        case 'church_pew': case 'church_column': case 'church_arch': case 'church_altar': case 'church_altar2':
        case 'church_painting1': case 'church_candle': case 'church_statue':
        case 'bar_counter': case 'bar_shelf': case 'bar_table': case 'bar_detail': case 'piazza_strip':
        case 'ns_palazzo1': case 'ns_palazzo2': case 'ns_palazzo3':
        case 'pizzeria_oven': case 'pizzeria_counter': case 'pizzeria_table':
        case 'metro_hall': case 'metro_platform': case 'metro_gate':
        case 'home_rug': case 'home_books': case 'home_lamp': case 'home_painting': {
          const img = ART.propSprite(d.type);
          if (img) {
            const dw = d.data.w || img.width;
            const dh = d.data.h || img.height;
            // Bottom-anchor by default for prop decor; data.oy/ox allow fine tuning.
            const ox = d.data.ox || 0;
            const oy = d.data.oy !== undefined ? d.data.oy : (16 - dh);
            // Solo gli arredi che poggiano a terra ricevono un'ombra di contatto:
            // quadri e tende restano privi di ombra, così non sembrano ritagli.
            const grounded = ['church_pew', 'church_column', 'church_altar', 'church_altar2',
              'church_statue', 'bar_counter', 'bar_table', 'pizzeria_oven',
              'pizzeria_counter', 'pizzeria_table', 'metro_gate', 'home_books', 'home_lamp'];
            if (grounded.includes(d.type)) {
              this.softShadow(c, x + ox + dw / 2, y + oy + dh - 1, Math.min(dw * .42, 26), 3);
            }
            c.drawImage(img, x + ox, y + oy, dw, dh);
          }
          break;
        }
        case 'portal_arch': {
          const img = ART.trimSprite('portal_arch', 36, '#7e858c', false);
          if (img) c.drawImage(img, x - 2, y - 6);
          break;
        }
        case 'candle_glow':
        case 'warm_light':
        case 'window_light':
          break; // drawn in light pass
      }
      c.restore();
    }

    drawDebug(c) {
      try {
        const p = this.player; if (!p) return;
        const ax = this.dbg.axis || {x:0,y:0};
        const info = this.blockedInfo(p.x, p.y, p.w, p.h);
        // Hitbox reali: celle solide, entità e footprint del giocatore.
        // Attivo solo con ?debug=1: la build pubblica non lo disegna.
        const ox = Math.round(CL.camera.x), oy = Math.round(CL.camera.y);
        c.save(); c.lineWidth = 1;
        if (this.map) for (let ty = 0; ty < this.map.h; ty++) for (let tx = 0; tx < this.map.w; tx++) {
          if (!MAPS.solidChar(this.map.g[ty][tx])) continue;
          const px = tx * T - ox, py = ty * T - oy;
          if (px < -T || px > CL.VIEW_W || py < -T || py > CL.VIEW_H) continue;
          c.strokeStyle = 'rgba(255,80,80,.32)'; c.strokeRect(px + .5, py + .5, T - 1, T - 1);
        }
        for (const e of (this.entities || [])) {
          if (!e || !e.alive) continue;
          c.strokeStyle = e instanceof CL.Vehicle ? '#6bd8ff' : '#ffd166';
          c.strokeRect(Math.round(e.x - e.w / 2 - ox) + .5, Math.round(e.y - e.h / 2 - oy) + .5, e.w, e.h);
        }
        c.strokeStyle = '#7dff8a'; c.lineWidth = 2;
        c.strokeRect(Math.round(p.x - p.w / 2 - ox) + .5, Math.round(p.y - p.h / 2 - oy) + .5, p.w, p.h);
        c.restore();
        const lines = [
          `map:${this.map ? this.map.id : '-'} x:${p.x.toFixed(1)} y:${p.y.toFixed(1)}`,
          `in:${this.dbg.keys||'none'} ax:${ax.x.toFixed(2)},${ax.y.toFixed(2)} m:${this.dbg.modal?'1':'0'}`,
          `blk:${this.dbg.blocked || (info.blocked ? 'spawn' : 'no')}`
        ];
        if (info.hits && info.hits.length) lines.push('hit:' + info.hits.map(h=>`${h.name}${h.tx},${h.ty}:${h.ch}`).join(' '));
        G.px(c, 4, 24, 236, 38, 'rgba(6,10,16,.75)');
        G.rect(c, 4, 24, 236, 38, '#6bb8ff', 1);
        lines.forEach((l,i)=>G.text(c, l, 7, 28 + i*9, { size: 7, color:'#dff3ff', shadow:false }));
        G.px(c, 4, 64, 86, 14, 'rgba(180,60,50,.85)');
        G.rect(c, 4, 64, 86, 14, '#fff', 1);
        G.text(c, 'SBLOCCA', 24, 68, { size: 7, color:'#fff', shadow:false });
      } catch(e) {}
    }

    drawMinimap(c) {
      const m = this.map, mw = 92, mh = 62, ox = CL.VIEW_W - mw - 8, oy = 8;
      c.globalAlpha = .88;
      G.panel(c, ox - 2, oy - 2, mw + 4, mh + 4, { fill: '#101b24', border: '#c9a44a' });
      const sx = mw / m.w, sy = mh / m.h;
      for (let ty = 0; ty < m.h; ty++) for (let tx = 0; tx < m.w; tx++) {
        const ch = m.g[ty][tx], col = TILE_COLOR[ch];
        if (col && (ch !== '.' || (tx + ty) % 2 === 0)) { c.fillStyle = col; c.fillRect(ox + tx * sx, oy + ty * sy, Math.ceil(sx), Math.ceil(sy)); }
      }
      for (const poi of m.pois) {
        c.fillStyle = poi.type === 'door' || poi.type === 'service' ? '#e9b84a' : '#e86b5a';
        c.fillRect(ox + (poi.x / T) * sx - 1, oy + (poi.y / T) * sy - 1, 3, 3);
      }
      const p = this.player.vehicle || this.player;
      c.fillStyle = '#ffffff'; c.fillRect(ox + (p.x / T) * sx - 1, oy + (p.y / T) * sy - 1, 3, 3);
      c.globalAlpha = 1;
    }

    /* --------------------------------------------------- snapshot per React */
    snapshot() {
      if (!this.state) return null;
      const st = this.state, q = [];
      for (const id of S.quests.active()) {
        const cur = S.quests.current(id);
        if (cur) q.push({ id, name: D.quests[id].name, text: cur.text, prog: st.quests[id].prog || 0, count: cur.count || 1 });
      }
      return {
        clock: S.time.clock(), day: st.time.day, period: S.time.period(),
        weather: S.weather.info(), location: this.map ? this.map.name : '',
        money: st.money, bank: st.bank, rep: st.rep, level: st.level, xp: st.xp,
        needs: Object.assign({}, st.needs), quests: q,
        riding: this.player && this.player.vehicle ? this.player.vehicle.label() : null,
        caught: S.creatures.total(), inventory: Object.assign({}, st.inventory),
        netCount: S.inventory.count('rete'), dayProgress: (st.time.min / 1440),
        debug: this.debug ? Object.assign({}, this.dbg) : null
      };
    }
  }

  CL.Game = Game;
})(window);
