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
    openMenu() {},
    isModal() { return false; },
    fade(on) { const el = document.getElementById('fade'); if (el) el.classList.toggle('on', !!on); },
    takeToasts() { const q = this._queue || []; this._queue = []; return q; }
  };

  const TILE_COLOR = {
    '.': '#6e9d4e', ',': '#9d855d', r: '#555b60', p: '#b8b1a0', S: '#e3cd99',
    W: '#2c7a9c', '~': '#54a5b4', '#': '#bf7350', '=': '#ab4a39', f: '#d8c7a6',
    c: '#8b6244', o: '#65432e', X: '#6fa9b8', B: '#d9e0d4', '^': '#8b8a80',
    g: '#b9ae91', k: '#3b3640', P: '#4f8a4c', C: '#5b8fa6', V: '#24343f', G: '#2c2933', D: '#e9b84a',
    O: '#d7cfbf', H: '#b7aa95', "'": '#c9a44a'
  };

  class Game {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;
      this.running = false; this.last = 0; this.acc = 0;
      this.entities = []; this.creatures = []; this.particles = new CL.Particles();
      this.map = null; this.player = null; this.prompt = null; this.promptTarget = null;
      this.refreshT = 0; this.fadeT = 0; this.rainT = 0; this.weatherT = 0;
      this.state = null;
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
      S.quests.start('primo_giorno');
      this.enterMap('napoli', this.state.pos.x, this.state.pos.y, true);
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
        this.enterMap(this.state.pos.map, this.state.pos.x, this.state.pos.y, true);
        if (this.player) this.player.dir = this.state.pos.dir || 'down';
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
          this.render();
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
      CL.camera.update(dt);
      this.particles.update(dt);
      if (!this.state || !this.player) return;
      if (!CL.ui.isModal()) {
        S.time.advance(dt);
        try { CL.input.consume('interact') && this.player.interact(); } catch (e) { console.error(e); CL.ui.toast('Interazione non riuscita.', 'bad'); }
        try { CL.input.consume('ability') && this.useAbility(); } catch (e) { console.error(e); }
        CL.input.consume('menu') && CL.ui.openMenu('phone');
        CL.input.consume('pause') && CL.ui.openMenu('impostazioni');
        CL.input.consume('inventory') && CL.ui.openMenu('zaino');
        CL.input.consume('map') && CL.ui.openMenu('mappa');
        CL.input.consume('quests') && CL.ui.openMenu('diario');
        CL.input.consume('collection') && CL.ui.openMenu('collezione');
        ['slot1', 'slot2', 'slot3', 'slot4', 'slot5'].forEach((k, i) => {
          if (CL.input.consume(k)) {
            const foods = D.foodOrder.filter(id => S.inventory.has(id));
            if (foods[i]) S.inventory.use(foods[i]);
          }
        });
        for (let i = this.entities.length - 1; i >= 0; i--) {
          const e = this.entities[i];
          if (!e || !e.alive) continue;
          try { e.update(dt); }
          catch (err) { console.error('[CL] entity update', e && e.id, err); }
        }
        const focus = this.player.vehicle || this.player;
        CL.camera.follow(focus, dt, 1);
        this.updatePrompt();
      } else {
        CL.audio.setTrack(null);
      }
      if (!CL.ui.isModal()) {
        const zone = MAPS.get(this.map.id).zone;
        CL.audio.setTrack(S.time.isNight() ? 'night' : (D.zones[zone] || { track: zone === 'interno' ? 'interior' : 'town' }).track);
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
      const p = this.player;
      let best = null, bd = 46;
      for (const c of this.creatures) {
        const d = U.dist(p.x, p.y, c.x, c.y);
        if (d < bd) { bd = d; best = c; }
      }
      if (!best) { CL.ui.toast('Nessuna creatura a portata di rete.', 'info'); return; }
      best.interact(p);
    }

    updatePrompt() {
      const p = this.player;
      if (p.vehicle) { this.prompt = 'E · Scendi dal ' + p.vehicle.label(); this.promptTarget = p.vehicle; return; }
      let best = null, bd = 30;
      const cands = this.entities.filter(e => e !== p && e.alive && (e instanceof CL.NPC || e instanceof CL.Creature || e instanceof CL.Vehicle));
      for (const e of cands) {
        const d = U.dist(p.x, p.y, e.x, e.y);
        if (d < bd) { bd = d; best = e; }
      }
      if (!best) {
        for (const poi of this.map.pois) {
          const d = U.dist(p.x, p.y, poi.x, poi.y + 8);
          if (d < 26 && (!best || d < bd)) { best = poi; bd = d; }
        }
      }
      this.promptTarget = best;
      if (!best) { this.prompt = null; return; }
      if (best instanceof CL.NPC) this.prompt = 'E · Parla con ' + best.name;
      else if (best instanceof CL.Creature) this.prompt = 'E / Q · Cattura ' + best.def.name;
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
        if (ownedInteriors.indexOf(target.map) >= 0 && !S.property.owns(target.map)) {
          CL.ui.toast('Questo immobile non è ancora tuo.', 'bad'); CL.audio.sfx('fail'); return;
        }
        if (!silent && isInterior && (!this.map || MAPS.get(this.map.id).zone !== 'interno')) {
          this.state.pos.prev = { map: this.map ? this.map.id : 'napoli', x: prev.x, y: prev.y };
        }
        this.particles.clear();
        this.map = targetMap;
        CL.camera.setBounds(this.map.width, this.map.height);
        this.entities = []; this.creatures = [];
        const tx = Number.isFinite(target.x) ? target.x : this.map.spawn.x;
        const ty = Number.isFinite(target.y) ? target.y : this.map.spawn.y;
        if (!this.player) this.player = new CL.Player(this, tx, ty);
        this.player.vehicle = null;
        this.player.x = tx; this.player.y = ty;
        this.player.vx = 0; this.player.vy = 0;
        this.entities.push(this.player);
        for (const nid in D.npcs) {
          const def = D.npcs[nid];
          if (!def) continue;
          const inThisMap = def.home === target.map || (isInterior && def.role === 'shop' && target.map === 'bar' && nid === 'barista');
          if (inThisMap) {
            const n = new CL.NPC(this, nid, def);
            if (isInterior) { n.x = this.map.width / 2; n.y = this.map.height - 80; n.homeX = n.x; n.homeY = n.y; }
            this.entities.push(n);
          }
        }
        if (!isInterior) this.spawnCreatures();
        this.state.pos.map = target.map;
        this.state.pos.x = tx; this.state.pos.y = ty;
        CL.camera.snap(this.player);
        try { S.actions.visit(target.map); } catch (e) { console.error(e); }
        if (!silent) {
          this.fadeT = .35;
          CL.audio.sfx('door');
          CL.ui.toast('📍 ' + this.map.name, 'info');
          this.save();
        }
        CL.ui.refresh();
      } catch (err) {
        console.error('[CL] enterMap failed', id, err);
        CL.ui.toast('Cambio zona recuperato. Riprova.', 'bad');
        if (!this.map) {
          this.map = MAPS.get('napoli');
          const s = this.map.spawn;
          if (!this.player) this.player = new CL.Player(this, s.x, s.y);
          this.entities = [this.player];
        }
      }
    }

    spawnCreatures() {
      this.creatures = [];
      if (!this.map || MAPS.get(this.map.id).zone === 'interno') return;
      try {
        const list = S.creatures.spawn(this.map.id) || [];
        for (const c of list) {
          try {
            const e = new CL.Creature(this, c);
            this.creatures.push(e); this.entities.push(e);
          } catch (e) { console.error('[CL] spawn creature', e); }
        }
      } catch (e) { console.error('[CL] spawnCreatures', e); }
    }

    removeEntity(e) {
      const i = this.entities.indexOf(e); if (i >= 0) this.entities.splice(i, 1);
      const j = this.creatures.indexOf(e); if (j >= 0) this.creatures.splice(j, 1);
    }

    checkPortals(ent) {
      try {
        if (!this.map || !this.state) return;
        if (ent !== this.player && !(ent instanceof CL.Vehicle && ent.mounted)) return;
        if (this.fadeT > 0) return;
        const p = MAPS.portalAt(this.map, ent.x, ent.y);
        if (!p) return;
        let to = p.to, x = p.spawn.x, y = p.spawn.y;
        if (to === 'prev') {
          const prev = this.state.pos.prev || { map: 'napoli', x: 31 * T, y: 35 * T };
          to = prev.map; x = prev.x; y = prev.y;
        }
        this.enterMap(to, x, y);
      } catch (e) { console.error('[CL] checkPortals', e); }
    }

    canMove(x, y, wid, hei) {
      if (!this.map) return false;
      const l = x - wid / 2, r = x + wid / 2, t = y - hei / 2, b = y + hei / 2;
      return !MAPS.solidAt(this.map, l, t) && !MAPS.solidAt(this.map, r, t) &&
        !MAPS.solidAt(this.map, l, b) && !MAPS.solidAt(this.map, r, b);
    }

    /* --------------------------------------------------------- interazioni */
    handleAction(a, data, src) {
      switch (a) {
        case 'enter':
          this.enterMap(data.to); break;
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
        case 'talk_tip': CL.ui.dialogueText('Nonna Assunta', U.pick(D.tips)); break;
        case 'talk_neighborhood': CL.ui.dialogueText('Ciro', 'Qui vicino c’è tutto: il forno, la banca, il cantiere. Vai a Pompei se vuoi vedere la storia, o sul Vesuvio se vuoi stare bene.'); break;
        case 'talk_sea': CL.ui.dialogueText('Vecchio Pescatore', 'Il mare dà e il mare toglie. Io gli chiedo solo un pesce al giorno e un po’ di silenzio.'); break;
        case 'talk_coast': CL.ui.dialogueText('Turista', 'Grazie! Mi dicono che la costiera sia la cosa più bella d’Italia. Ci vado subito!'); break;
        case 'talk_vesuvio': CL.ui.dialogueText('Turista', 'Il Vesuvio! Wow! Speriamo non faccia casino... eh, scusa, non sono molto bravo in italiano.'); break;
        case 'talk_cave': CL.ui.dialogueText('Guardiano', 'Dentro c’è una luce che non viene da nessuna lampada. Porta una rete, se vuoi vedere chi la fa.'); break;
        case 'talk_social': CL.ui.dialogueText('Giulia', 'Mi piace come parli. Sembri uno che ha sempre qualcosa da raccontare.'); break;
        case 'flavor': case 'scenery': CL.ui.toast(src ? src.label : 'Un dettaglio del paesaggio.', 'info'); break;
        default: CL.ui.toast('Azione non disponibile: ' + a, 'info');
      }
    }

    dialogue(npcId) {
      const def = D.npcs[npcId]; if (!def) return;
      const maker = D.dialogue[npcId];
      const out = maker ? maker(this) : { text: 'Ciao!', choices: [{ label: 'Arrivederci', action: 'close' }] };
      CL.ui.showDialogue({
        name: def.name, look: def.look, text: out.text, choices: out.choices || [], npc: npcId
      });
    }

    /* --------------------------------------------------------------- render */
    render() {
      const c = this.ctx;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, CL.VIEW_W, CL.VIEW_H);
      c.fillStyle = '#1a2630'; c.fillRect(0, 0, CL.VIEW_W, CL.VIEW_H);
      if (!this.map) return;
      const m = this.map;
      c.save();
      CL.camera.apply(c);
      const x0 = Math.max(0, Math.floor(CL.camera.x / T) - 1);
      const y0 = Math.max(0, Math.floor(CL.camera.y / T) - 1);
      const x1 = Math.min(m.w - 1, Math.ceil((CL.camera.x + CL.VIEW_W) / T) + 1);
      const y1 = Math.min(m.h - 1, Math.ceil((CL.camera.y + CL.VIEW_H) / T) + 1);
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        const ch = m.g[ty][tx], img = ART.tiles[ch];
        if (img) c.drawImage(img, tx * T, ty * T);
      }
      // oggetti alti + entità, ordinati per profondità
      const items = [];
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        const ch = m.g[ty][tx];
        if (ch === 'T' || ch === '^') items.push({ y: ty * T + 16, kind: ch, tx, ty });
        if (ch === 'O') {
          const up = ty > 0 ? m.g[ty - 1][tx] : '';
          const left = tx > 0 ? m.g[ty][tx - 1] : '';
          if (up !== 'O' && left !== 'O') items.push({ y: ty * T + 3 * T, kind: 'O', tx, ty }); // anchor bottom of base
        }
      }
      for (const e of this.entities) if (e.alive) items.push({ y: e.y + (e.offsetY || 0), ent: e });
      items.sort((a, b) => a.y - b.y);
      for (const it of items) {
        if (it.ent) it.ent.draw(c);
        else if (it.kind === 'T') {
          const variant = (it.tx * 13 + it.ty * 7) % 3;
          const img = m.zone === 'costiera' ? ART.lemonTree(variant) : ART.tree(variant);
          c.drawImage(img, it.tx * T - 8, it.ty * T - 24);
        } else if (it.kind === 'O') {
          this.drawGuglia(c, it.tx * T, it.ty * T);
        } else c.drawImage(ART.rock((it.tx + it.ty) % 3), it.tx * T - 2, it.ty * T - 8);
      }
      c.restore();
      this.drawOverlay(c);
    }

    drawOverlay(c) {
      const st = this.state;
      // illuminazione
      const h = S.time.hour();
      let dark = 0, warm = 0;
      if (h < 5) dark = .68;
      else if (h < 8) dark = .58 - (h - 5) * .19;
      else if (h < 17) dark = 0;
      else if (h < 20) { dark = (h - 17) * .15; warm = .10; }
      else dark = .52;
      const wi = S.weather.info(); dark += wi.dark;
      if (dark > 0) { c.fillStyle = 'rgba(10,16,38,' + U.clamp(dark, 0, .75) + ')'; c.fillRect(0, 0, CL.VIEW_W, CL.VIEW_H); }
      if (warm > 0) { c.fillStyle = 'rgba(240,150,80,' + warm + ')'; c.fillRect(0, 0, CL.VIEW_W, CL.VIEW_H); }
      // vignetta
      const gr = c.createRadialGradient(240, 135, 90, 240, 135, 290);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(4,8,14,.38)');
      c.fillStyle = gr; c.fillRect(0, 0, CL.VIEW_W, CL.VIEW_H);
      this.particles.draw(c);
      // nome luogo (breve)
      if (this.fadeT > 0) this.fadeT -= .016;
      G.panel(c, 6, 6, Math.min(180, 20 + this.map.name.length * 5), 16, { fill: 'rgba(12,20,28,.72)', border: '#e9b84a' });
      G.text(c, this.map.name, 12, 9, { size: 8, color: '#f6e8c8' });
      // prompt
      if (this.prompt && !CL.ui.isModal()) {
        const wd = Math.max(96, this.prompt.length * 4.6 + 16);
        G.panel(c, 240 - wd / 2, 232, wd, 20, { fill: 'rgba(12,20,28,.88)' });
        G.text(c, this.prompt, 240, 238, { size: 8, align: 'center', color: '#e9b84a' });
      }
      // guida contestuale all'inizio
      if (this.fadeT > 0 && !CL.ui.isModal()) {
        c.fillStyle = 'rgba(4,8,14,' + U.clamp(this.fadeT * .8, 0, .7) + ')';
        c.fillRect(0, 0, CL.VIEW_W, CL.VIEW_H);
      }
      this.drawMinimap(c);
    }

    drawGuglia(c, x, y) {
      // Base già nel tile O (collisione). Disegniamo il fusto sopra per profondità.
      c.save();
      c.fillStyle = 'rgba(0,0,0,.18)';
      c.fillRect(x + 4, y + 20, 24, 4);
      const cx = x + 16;
      // piedistallo
      c.fillStyle = '#d8d0c0'; c.fillRect(cx - 14, y + 10, 28, 12);
      c.fillStyle = '#bdb39f'; c.fillRect(cx - 14, y + 20, 28, 2);
      c.fillStyle = '#ece4d2'; c.fillRect(cx - 11, y + 12, 22, 7);
      // obelisco
      c.fillStyle = '#cfc5b1'; c.fillRect(cx - 5, y - 28, 10, 40);
      c.fillStyle = '#efe8d8'; c.fillRect(cx - 3, y - 26, 6, 36);
      // dettagli
      c.fillStyle = '#9e9483'; c.fillRect(cx - 7, y + 6, 14, 4);
      c.fillStyle = '#c9a44a'; c.fillRect(cx - 2, y - 36, 4, 8);
      c.fillStyle = '#f3d77a'; c.fillRect(cx - 1, y - 42, 2, 6);
      // statue stilizzate
      c.fillStyle = '#d7ccb8';
      c.fillRect(cx - 16, y + 2, 3, 8); c.fillRect(cx + 13, y + 2, 3, 8);
      c.fillRect(cx - 4, y + 2, 3, 8); c.fillRect(cx + 1, y + 2, 3, 8);
      c.restore();
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
        netCount: S.inventory.count('rete'), dayProgress: (st.time.min / 1440)
      };
    }
  }

  CL.Game = Game;
})(window);
