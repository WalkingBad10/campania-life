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
    '.': '#6e9d4e', ',': '#9d855d', r: '#555b60', p: '#b8b1a2', S: '#e3cd99',
    W: '#2c7a9c', '~': '#54a5b4', '#': '#bf7350', '=': '#ab4a39', f: '#d8c7a6',
    c: '#8b6244', o: '#65432e', X: '#6fa9b8', B: '#d9e0d4', '^': '#8b8a80',
    g: '#b9ae91', k: '#3b3640', P: '#4f8a4c', C: '#5b8fa6', V: '#24343f', G: '#2c2933', D: '#8f8a80',
    O: '#d7cfbf', H: '#656a6f', "'": '#c9a44a', L: '#7b623f', F: '#7b623f', K: '#2e6b4f',
    Q: '#5e402d', Y: '#7a5637', I: '#59616a', U: '#f3dd8a', E: '#7a5637', N: '#3f6f95', J: '#b94a3a'
  };

  class Game {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;
      this.running = false; this.last = 0; this.acc = 0;
      this.entities = []; this.particles = new CL.Particles();
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
        /* collezione rimossa */
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
          const d = U.dist(p.x, p.y, poi.x, poi.y + 8);
          if (d < 26 && (!best || d < bd)) { best = poi; bd = d; }
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

    spawnCreatures() { /* disabilitato: simulatore vita reale */ }
    removeEntity(e) { const i = this.entities.indexOf(e); if (i >= 0) this.entities.splice(i, 1); e.alive = false; }

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
          if (up !== 'O' && left !== 'O') items.push({ y: ty * T + 3 * T, kind: 'O', tx, ty });
        }
      }
      for (const d of (m.decors || [])) {
        const dy = d.type === 'lamp' ? d.y + 16 : d.type === 'bench' ? d.y + 10 : d.y + (d.data.h || 0);
        if (d.x > CL.camera.x - 160 && d.x < CL.camera.x + CL.VIEW_W + 160 && d.y > CL.camera.y - 200 && d.y < CL.camera.y + CL.VIEW_H + 160) {
          items.push({ y: dy, decor: d });
        }
      }
      for (const e of this.entities) if (e.alive) items.push({ y: e.y + (e.offsetY || 0), ent: e });
      items.sort((a, b) => a.y - b.y);
      for (const it of items) {
        if (it.ent) it.ent.draw(c);
        else if (it.decor) this.drawDecor(c, it.decor);
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
      c.save();
      const cx = x + 32;
      const by = y + 48;
      c.fillStyle = 'rgba(0,0,0,.20)'; c.beginPath(); c.ellipse(cx, by - 2, 36, 9, 0, 0, Math.PI * 2); c.fill();
      // base scalonata
      c.fillStyle = '#cfc4b1'; c.fillRect(cx - 28, by - 24, 56, 22);
      c.fillStyle = '#ddd3c1'; c.fillRect(cx - 24, by - 22, 48, 18);
      c.fillStyle = '#b6aa95'; c.fillRect(cx - 28, by - 4, 56, 2);
      c.fillStyle = '#a89c87'; c.fillRect(cx - 30, by - 26, 60, 3);
      c.fillStyle = '#c5baa8'; c.fillRect(cx - 20, by - 20, 40, 14);
      for (let i = -1; i <= 1; i++) { c.fillStyle = '#a99d89'; c.fillRect(cx + i * 12 - 1, by - 20, 1, 14); }
      // statue base
      const statue = (sx, sy) => { c.fillStyle = '#d8cfbe'; c.fillRect(sx - 2, sy - 9, 4, 9); c.fillRect(sx - 3, sy - 11, 6, 3); c.fillStyle = '#c0b5a1'; c.fillRect(sx - 1, sy - 8, 2, 6); c.fillStyle = '#ece4d4'; c.fillRect(sx - 2, sy - 9, 1, 3); };
      statue(cx - 22, by - 24); statue(cx + 22, by - 24); statue(cx - 8, by - 24); statue(cx + 8, by - 24);
      // plinto
      c.fillStyle = '#d5cab8'; c.fillRect(cx - 15, by - 38, 30, 14);
      c.fillStyle = '#ebe3d2'; c.fillRect(cx - 12, by - 36, 24, 10);
      c.fillStyle = '#b0a48f'; c.fillRect(cx - 16, by - 39, 32, 2);
      c.fillStyle = '#9f9380'; c.fillRect(cx - 10, by - 30, 20, 1);
      // obelisco
      c.fillStyle = '#c9bea9'; c.fillRect(cx - 8, by - 98, 16, 62);
      c.fillStyle = '#e9e1d0'; c.fillRect(cx - 6, by - 96, 12, 58);
      c.fillStyle = '#b8ac97'; c.fillRect(cx - 9, by - 38, 18, 2);
      c.fillStyle = 'rgba(255,255,255,.10)'; c.fillRect(cx - 6, by - 96, 2, 58);
      // anelli/ornamenti
      c.fillStyle = '#a89d89'; c.fillRect(cx - 10, by - 62, 20, 2); c.fillRect(cx - 9, by - 78, 18, 2);
      c.fillStyle = '#c9a44a'; c.fillRect(cx - 11, by - 64, 2, 6); c.fillRect(cx + 9, by - 64, 2, 6);
      // punta e croce
      c.fillStyle = '#c9a44a'; c.fillRect(cx - 5, by - 108, 10, 12);
      c.fillStyle = '#f0d06a'; c.fillRect(cx - 3, by - 106, 6, 8);
      c.fillStyle = '#d4b04f'; c.fillRect(cx - 1, by - 120, 2, 12); c.fillRect(cx - 6, by - 115, 12, 2);
      c.fillStyle = '#fff2a0'; c.fillRect(cx - 1, by - 119, 2, 2);
      c.restore();
    }

    drawDecor(c, d) {
      const x = d.x, y = d.y;
      c.save();
      switch (d.type) {
        case 'gesu_facade': {
          // Facciata bugnata Gesù Nuovo: 22 tile wide x 11 high in map, overlay adds depth/portale
          const w = 22 * T, h = 12 * T;
          // ombra
          c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(x - 2, y + h - 2, w + 4, 6);
          // corpo
          c.fillStyle = '#686d72'; c.fillRect(x, y, w, h);
          // bugnato a punta di diamante
          for (let yy = 0; yy < h; yy += 8) for (let xx = 0; xx < w; xx += 8) {
            const dark = ((xx / 8 + yy / 8) % 2 === 0);
            c.fillStyle = dark ? '#50555a' : '#747a80';
            c.fillRect(x + xx, y + yy, 8, 8);
            c.fillStyle = dark ? '#5c6268' : '#82888e';
            c.beginPath();
            c.moveTo(x + xx + 4, y + yy + 1); c.lineTo(x + xx + 7, y + yy + 4);
            c.lineTo(x + xx + 4, y + yy + 7); c.lineTo(x + xx + 1, y + yy + 4); c.closePath(); c.fill();
          }
          // cornice superiore
          c.fillStyle = '#8b9096'; c.fillRect(x - 2, y - 4, w + 4, 6);
          c.fillStyle = '#5b6066'; c.fillRect(x - 2, y + 2, w + 4, 2);
          // portale monumentale
          const pxm = x + w / 2, py = y + h - 32;
          c.fillStyle = '#4a3a2a'; c.fillRect(pxm - 18, py - 28, 36, 60);
          c.fillStyle = '#6b523a'; c.fillRect(pxm - 14, py - 24, 28, 56);
          c.fillStyle = '#3f2f22'; c.fillRect(pxm - 1, py - 24, 2, 56);
          c.fillStyle = '#8a6a46'; c.fillRect(pxm - 14, py - 24, 28, 2);
          c.fillStyle = '#c9a44a'; c.fillRect(pxm - 4, py + 4, 2, 2); c.fillRect(pxm + 2, py + 4, 2, 2);
          // arco sopra portale
          c.fillStyle = '#7a8086'; c.fillRect(pxm - 20, py - 32, 40, 6);
          c.fillStyle = '#93999f'; c.fillRect(pxm - 16, py - 30, 32, 2);
          // finestre alte
          [x + 48, x + w - 64].forEach(wx => {
            c.fillStyle = '#3e444a'; c.fillRect(wx, y + 20, 20, 28);
            c.fillStyle = '#6d8fa8'; c.fillRect(wx + 2, y + 22, 16, 24);
            c.fillStyle = '#5a5f66'; c.fillRect(wx + 9, y + 22, 2, 24); c.fillRect(wx + 2, y + 33, 16, 2);
          });
          break;
        }
        case 'palazzo_ne': case 'palazzo_sw': case 'palazzo_banca': case 'palazzo_bar': case 'palazzo_se': case 'palazzo_e': {
          const specs = {
            palazzo_ne: { w: 20 * T, h: 12 * T, wall: '#d7c9ad', trim: '#8b6a45', win: '#7ea8bf' },
            palazzo_sw: { w: 16 * T, h: 7 * T, wall: '#e0d2b8', trim: '#7a5a3a', win: '#88afc4' },
            palazzo_banca: { w: 10 * T, h: 7 * T, wall: '#ddd0bc', trim: '#6b7d8f', win: '#90b5c8' },
            palazzo_bar: { w: 8 * T, h: 7 * T, wall: '#e4d6be', trim: '#7a4a32', win: '#87aec2' },
            palazzo_se: { w: 8 * T, h: 7 * T, wall: '#dccfb8', trim: '#7a6245', win: '#86acc1' },
            palazzo_e: { w: 10 * T, h: 12 * T, wall: '#d9ccb2', trim: '#80674a', win: '#82abc0' },
          }[d.type];
          const W = specs.w, H = specs.h;
          c.fillStyle = 'rgba(0,0,0,.10)'; c.fillRect(x + 2, y + H, W - 2, 4);
          c.fillStyle = specs.wall; c.fillRect(x, y, W, H);
          c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(x, y, W, 8);
          c.fillStyle = specs.trim; c.fillRect(x, y, W, 4); c.fillRect(x, y + H - 4, W, 4);
          // finestre con persiane/balconi
          for (let wy = y + 14; wy < y + H - 16; wy += 22) {
            for (let wx = x + 8; wx < x + W - 12; wx += 20) {
              c.fillStyle = '#5a452d'; c.fillRect(wx - 1, wy - 1, 14, 16);
              c.fillStyle = specs.win; c.fillRect(wx, wy, 12, 14);
              c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(wx, wy, 12, 3);
              c.fillStyle = specs.trim; c.fillRect(wx + 5, wy, 2, 14); c.fillRect(wx, wy + 6, 12, 2);
              // persiane
              c.fillStyle = '#6a5338'; c.fillRect(wx - 3, wy, 3, 14); c.fillRect(wx + 12, wy, 3, 14);
              // balcone ogni tanto
              if (((wx + wy) % 40) < 20) { c.fillStyle = '#4f5962'; c.fillRect(wx - 4, wy + 12, 20, 2); c.fillRect(wx - 4, wy + 14, 20, 3); }
            }
          }
          // portone
          const dx = x + W / 2 - 8; c.fillStyle = '#5a4028'; c.fillRect(dx, y + H - 20, 16, 20);
          c.fillStyle = '#775738'; c.fillRect(dx + 1, y + H - 19, 14, 18); c.fillStyle = '#c9a44a'; c.fillRect(dx + 11, y + H - 10, 2, 2);
          break;
        }
        case 'edicola': {
          c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(x + 2, y + 30, 28, 4);
          c.fillStyle = '#2f6a4d'; c.fillRect(x, y + 4, 32, 28);
          c.fillStyle = '#f3ecd8'; c.fillRect(x + 3, y + 8, 26, 18);
          c.fillStyle = '#c9564a'; c.fillRect(x + 5, y + 10, 8, 5); c.fillStyle = '#4a87b8'; c.fillRect(x + 15, y + 10, 12, 5);
          c.fillStyle = '#6b5632'; c.fillRect(x + 2, y + 26, 28, 4);
          c.fillStyle = '#8a7046'; c.fillRect(x - 1, y + 2, 34, 4);
          break;
        }
        case 'awning': {
          const W = d.data.w || 32; const col = d.data.color || '#b94a3a';
          for (let i = 0; i < W; i += 8) { c.fillStyle = (i / 8) % 2 === 0 ? col : '#efe2c6'; c.fillRect(x + i, y, 8, 10); }
          c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(x, y + 10, W, 2);
          break;
        }
        case 'lamp': {
          c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(x + 8, y + 16, 5, 2, 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#3b4248'; c.fillRect(x + 7, y - 16, 2, 32);
          c.fillStyle = '#2f353b'; c.fillRect(x + 5, y - 18, 6, 3);
          c.fillStyle = '#f6e7a2'; c.fillRect(x + 4, y - 24, 8, 7);
          c.fillStyle = 'rgba(255,240,170,.18)'; c.beginPath(); c.arc(x + 8, y - 20, 10, 0, Math.PI * 2); c.fill();
          break;
        }
        case 'bench': {
          c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(x + 2, y + 10, 20, 3);
          c.fillStyle = '#6d4a2f'; c.fillRect(x + 2, y + 2, 20, 3); c.fillRect(x + 3, y - 3, 18, 6);
          c.fillStyle = '#855d3b'; c.fillRect(x + 3, y - 2, 18, 2);
          c.fillStyle = '#4a382b'; c.fillRect(x + 4, y + 5, 2, 6); c.fillRect(x + 18, y + 5, 2, 6);
          break;
        }
        case 'portal_arch': {
          c.fillStyle = '#7e858c'; c.fillRect(x - 2, y, 36, 4); c.fillRect(x, y + 4, 4, 20); c.fillRect(x + 28, y + 4, 4, 20);
          break;
        }
      }
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
