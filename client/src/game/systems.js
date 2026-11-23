/* CAMPANIA LIFE — systems.js
 * Stato di gioco e sistemi: tempo, bisogni, economia, inventario, lavori, quest,
 * relazioni, immobili, creature, obiettivi, meteo, API di persistenza.
 */
(function (w) {
  'use strict';
  const CL = w.CL, U = CL.util, D = CL.data, EV = CL.events;
  const S = CL.systems = {};

  function toast(msg, type) { if (CL.ui && CL.ui.toast) CL.ui.toast(msg, type); }
  function sfx(n) { CL.audio.sfx(n); }
  function refresh() { if (CL.ui && CL.ui.refresh) CL.ui.refresh(); }
  function autosave() { if (CL.game) CL.game.save(); }

  /* ------------------------------------------------------------ API layer */
  const API = CL.api = {
    base: (w.__CL_API_URL__ || '/api').replace(/\/$/, ''),
    token: null,
    ready: false,
    user: null,
    init() {
      try { this.token = localStorage.getItem('cl_token') || null; } catch (e) {}
      if (this.token) this.me().then(() => { this.ready = true; }).catch(() => { this.token = null; this.ready = false; });
    },
    async request(path, opts) {
      opts = opts || {};
      const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
      if (this.token) headers.Authorization = 'Bearer ' + this.token;
      let res;
      try { res = await fetch(this.base + path, Object.assign({}, opts, { headers })); }
      catch (e) { throw new Error('Server non raggiungibile'); }
      let body = null;
      try { body = await res.json(); } catch (e) {}
      if (!res.ok) throw new Error((body && (body.detail || body.error)) || ('Errore ' + res.status));
      return body;
    },
    async register(name, email, password) {
      const b = await this.request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
      this.token = b.access_token; localStorage.setItem('cl_token', b.access_token); this.ready = true; this.user = b.user; return b;
    },
    async login(email, password) {
      const b = await this.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      this.token = b.access_token; localStorage.setItem('cl_token', b.access_token); this.ready = true; this.user = b.user; return b;
    },
    async me() { this.user = await this.request('/auth/me'); return this.user; },
    logout() { this.token = null; this.user = null; this.ready = false; try { localStorage.removeItem('cl_token'); } catch (e) {} },
    async pull() { return this.request('/saves/current'); },
    async push(data) { return this.request('/saves/current', { method: 'PUT', body: JSON.stringify({ payload: data }) }); },
    async leaderboard() { return this.request('/leaderboard'); }
  };

  /* --------------------------------------------------------------- stato */
  CL.createState = function (profile) {
    return {
      v: 1,
      profile: profile || { name: 'Antonio', surname: 'Esposito', look: { hair: '#2d2622', skin: '#d79c74', shirt: '#c75b3b', pants: '#3a4650' }, perk: 'nativo' },
      pos: { x: 240, y: 272, map: 'napoli', dir: 'down', prev: null },
      time: { day: 1, min: 8 * 60, total: 0 },
      weather: 'sole',
      money: profile && profile.perk === 'intraprendente' ? 270 : 120,
      bank: 0, rep: 0, xp: 0, level: 1,
      needs: { hunger: 78, thirst: 82, energy: profile && profile.perk === 'sportivo' ? 100 : 88, mood: 76, hygiene: 80 },
      inventory: { pane: 2, caffe: 1, rete: 3, acqua: 1 },
      outfit: null,
      properties: [],
      creatures: {},
      quests: {},
      relations: {},
      flags: { tutorial: false, firstShop: false },
      stats: { earned: 0, spent: 0, caught: 0, fished: 0, worked: 0, slept: 0, steps: 0, travel: 0, bought: 0 },
      achievements: [],
      lastTalk: {},
      log: []
    };
  };

  /* ---------------------------------------------------------------- tempo */
  S.time = {
    hour() { return Math.floor(CL.state.time.min / 60); },
    minute() { return Math.floor(CL.state.time.min % 60); },
    clock() { return U.pad2(this.hour()) + ':' + U.pad2(this.minute()); },
    isNight() { const h = this.hour(); return h < 6 || h >= 20; },
    isDay() { const h = this.hour(); return h >= 7 && h < 19; },
    period() {
      const h = this.hour();
      return h < 6 ? 'Notte fonda' : h < 12 ? 'Mattina' : h < 18 ? 'Pomeriggio' : h < 21 ? 'Sera' : 'Notte';
    },
    advance(dt) {
      const mult = CL.settings.timescale || 3;
      this.addMinutes(dt * mult);
    },
    addMinutes(m) {
      const st = CL.state, t = st.time;
      t.total += m; t.min += m;
      while (t.min >= 1440) { t.min -= 1440; t.day++; this.newDay(); }
      S.needs.decay(m);
    },
    skip(hours) { this.addMinutes(hours * 60); },
    newDay() {
      const st = CL.state;
      st.weather = S.weather.roll();
      S.property.dailyIncome();
      st.lastTalk = {};
      st.needs.energy = U.clamp(st.needs.energy + 30, 0, 100);
      st.needs.mood = U.clamp(st.needs.mood + 8, 0, 100);
      S.creatures.respawn();
      S.achievements.check();
      EV.emit('newday', { day: st.time.day, weather: st.weather });
      toast('Giorno ' + st.time.day + ' · ' + S.weather.info().name + ' · ' + U.money(S.property.income()) + ' di rendite', 'info');
      autosave();
    }
  };

  /* --------------------------------------------------------------- meteo */
  S.weather = {
    info() { return D.weather.find(x => x.id === CL.state.weather) || D.weather[0]; },
    roll() {
      const r = Math.random();
      if (r < .52) return 'sole';
      if (r < .80) return 'nuvole';
      if (r < .96) return 'pioggia';
      return 'temporale';
    },
    catchBonus() { return CL.state.weather === 'pioggia' ? .08 : CL.state.weather === 'temporale' ? .12 : 0; }
  };

  /* -------------------------------------------------------------- bisogni */
  S.needs = {
    decay(m) {
      const n = CL.state.needs, night = S.time.isNight();
      n.hunger = U.clamp(n.hunger - m * .030, 0, 100);
      n.thirst = U.clamp(n.thirst - m * .042, 0, 100);
      n.energy = U.clamp(n.energy - m * (night ? .045 : .026), 0, 100);
      n.mood = U.clamp(n.mood - m * .012, 0, 100);
      n.hygiene = U.clamp(n.hygiene - m * .010, 0, 100);
      if (n.hunger <= 0 || n.thirst <= 0) n.mood = U.clamp(n.mood - m * .02, 0, 100);
      if (n.energy <= 0) this.faint();
    },
    apply(eff) {
      const n = CL.state.needs;
      for (const k in eff) if (n[k] !== undefined) n[k] = U.clamp(n[k] + eff[k], 0, 100);
      refresh();
    },
    faint() {
      const st = CL.state;
      if (st.flags && st.flags.fainting) return;
      st.flags = st.flags || {};
      st.flags.fainting = true;
      try {
        toast('Sei svenuto per la stanchezza! Ti risvegli in clinica.', 'bad');
        st.pos.prev = st.pos.map || 'napoli';
        st.pos.map = 'clinica';
        st.pos.x = 9 * CL.TILE; st.pos.y = 9 * CL.TILE;
        st.money = Math.max(0, st.money - 20);
        st.needs.energy = 45; st.needs.hunger = Math.max(st.needs.hunger, 30); st.needs.thirst = Math.max(st.needs.thirst, 30);
        S.time.skip(3); sfx('fail');
        if (CL.game) CL.game.enterMap('clinica', st.pos.x, st.pos.y);
        autosave();
      } finally {
        st.flags.fainting = false;
      }
    },
    speedFactor() {
      const n = CL.state.needs;
      let f = 1;
      if (n.energy < 25) f *= .72;
      if (n.hunger < 20) f *= .82;
      if (n.thirst < 20) f *= .85;
      if (S.weather.info().id === 'pioggia') f *= .94;
      return f;
    }
  };

  /* -------------------------------------------------------------- economia */
  S.economy = {
    earn(n, reason) {
      n = Math.round(n); if (n <= 0) return 0;
      const st = CL.state, mult = st.profile.perk === 'nativo' ? 1.1 : 1;
      n = Math.round(n * mult);
      st.money += n; st.stats.earned += n;
      st.log.unshift({ d: S.time.clock(), t: '+' + U.money(n) + ' · ' + (reason || 'Entrata') });
      if (st.log.length > 40) st.log.pop();
      S.quests.checkWealth(); S.achievements.check();
      EV.emit('money', { amount: n }); sfx('coin'); refresh(); autosave();
      return n;
    },
    spend(n, reason) {
      n = Math.round(n);
      if (CL.state.money < n) { toast('Non hai abbastanza denaro.', 'bad'); sfx('fail'); return false; }
      CL.state.money -= n; CL.state.stats.spent += n;
      CL.state.log.unshift({ d: S.time.clock(), t: '−' + U.money(n) + ' · ' + (reason || 'Uscita') });
      if (CL.state.log.length > 40) CL.state.log.pop();
      refresh(); autosave(); return true;
    },
    deposit(n) {
      n = Math.round(n); if (n <= 0 || CL.state.money < n) return false;
      CL.state.money -= n; CL.state.bank += n; toast('Depositati ' + U.money(n), 'good'); sfx('coin'); refresh(); autosave(); return true;
    },
    withdraw(n) {
      n = Math.round(n); if (n <= 0 || CL.state.bank < n) return false;
      CL.state.bank -= n; CL.state.money += n; toast('Prelevati ' + U.money(n), 'good'); sfx('coin'); refresh(); autosave(); return true;
    },
    wealth() { return CL.state.money + CL.state.bank; }
  };

  /* ------------------------------------------------------------- inventario */
  S.inventory = {
    count(id) { return CL.state.inventory[id] || 0; },
    has(id, n) { return this.count(id) >= (n || 1); },
    add(id, n) {
      n = n || 1; const st = CL.state, def = D.items[id]; if (!def) return;
      st.inventory[id] = (st.inventory[id] || 0) + n;
      toast('+ ' + n + ' × ' + def.name, 'good'); sfx('coin'); refresh(); autosave();
    },
    remove(id, n) {
      n = n || 1; const st = CL.state;
      if (!this.has(id, n)) return false;
      st.inventory[id] -= n; if (st.inventory[id] <= 0) delete st.inventory[id];
      refresh(); autosave(); return true;
    },
    use(id) {
      const def = D.items[id]; if (!def || !this.has(id)) return false;
      if (def.type === 'food') {
        this.remove(id); S.needs.apply(def.effect || {}); toast('Hai mangiato ' + def.name, 'good'); sfx('confirm'); return true;
      }
      if (def.type === 'outfit') { this.remove(id); CL.state.outfit = id; toast('Hai indossato ' + def.name, 'good'); return true; }
      if (def.type === 'vehicle') { toast('Usa il veicolo dal telefono o vicino al mezzo.', 'info'); return false; }
      toast(def.name + ' non è utilizzabile direttamente.', 'info'); return false;
    },
    sell(id, n) {
      const def = D.items[id]; if (!def || !this.has(id, n || 1)) return false;
      const price = Math.max(1, Math.floor(def.price * .55)) * (n || 1);
      this.remove(id, n || 1); S.economy.earn(price, 'Vendita ' + def.name);
      toast('Venduto ' + def.name + ' per ' + U.money(price), 'good'); return true;
    },
    sellable() { return Object.keys(CL.state.inventory).filter(id => D.items[id] && D.items[id].price > 0); }
  };

  /* ---------------------------------------------------------------- lavori */
  S.jobs = {
    req(jobId) {
      const job = D.jobs[jobId]; if (!job) return { ok: false, why: 'Lavoro sconosciuto' };
      if (CL.state.rep < job.rep) return { ok: false, why: 'Serve ' + job.rep + ' di reputazione' };
      if (job.req && job.req.item && !S.inventory.has(job.req.item)) return { ok: false, why: 'Serve: ' + D.items[job.req.item].name };
      if (CL.state.needs.energy < job.energy + 4) return { ok: false, why: 'Sei troppo stanco (serve ' + (job.energy + 4) + ' energia)' };
      const h = S.time.hour();
      if (h < job.hours[0] || h >= job.hours[1]) return { ok: false, why: 'Orario: ' + job.hours[0] + '–' + job.hours[1] };
      return { ok: true };
    },
    work(jobId) {
      const r = this.req(jobId), job = D.jobs[jobId];
      if (!r.ok) { toast(r.why, 'bad'); sfx('fail'); return false; }
      const st = CL.state;
      S.time.skip(2);
      S.needs.apply({ energy: -job.energy, hunger: -8, thirst: -10, mood: jobId === 'operaio' ? -4 : 3 });
      let pay = job.pay * 2;
      if (U.chance(.35)) {
        const ev = U.pick(job.events || []);
        toast(ev, 'info');
        if (ev.includes('mancia') || ev.includes('+')) pay += U.randInt(5, 14);
        if (ev.includes('energia') || ev.includes('caldo') || ev.includes('pesante')) S.needs.apply({ energy: -6 });
        if (ev.includes('reputazione')) st.rep += 3;
        if (ev.includes('arancino')) S.inventory.add('arancino');
        if (ev.includes('pesci')) { S.inventory.add('pesce', 2); }
      }
      S.economy.earn(pay, 'Lavoro: ' + job.name);
      st.rep += job.rep > 0 ? 2 : 1;
      st.stats.worked++;
      S.quests.progress('work', jobId);
      S.achievements.check();
      toast('Turno finito: +' + U.money(pay) + ' · reputazione ' + st.rep, 'good');
      sfx('confirm'); refresh(); autosave(); return true;
    },
    list() { return Object.keys(D.jobs).map(id => ({ id, ...D.jobs[id], ok: this.req(id).ok, why: this.req(id).why })); }
  };

  /* ----------------------------------------------------------------- quest */
  S.quests = {
    start(id) {
      const st = CL.state, q = D.quests[id];
      if (!q || st.quests[id]) return false;
      st.quests[id] = { stage: 0, prog: 0, active: true, done: false };
      toast('Nuova missione: ' + q.name, 'info'); sfx('alert'); refresh(); autosave(); return true;
    },
    active() { return Object.keys(CL.state.quests).filter(id => CL.state.quests[id].active && !CL.state.quests[id].done); },
    current(id) { const st = CL.state.quests[id]; return st && !st.done ? D.quests[id].stages[st.stage] : null; },
    progress(type, target, n) {
      n = n || 1; let changed = false;
      for (const id of S.quests.active()) {
        const st = CL.state.quests[id], stage = D.quests[id].stages[st.stage];
        if (!stage || stage.type !== type) continue;
        if (stage.target !== undefined && stage.target !== target) continue;
        st.prog = (st.prog || 0) + n; changed = true;
        if (st.prog >= (stage.count || 1)) {
          st.stage++; st.prog = 0;
          toast('Obiettivo completato: ' + stage.text, 'good'); sfx('confirm');
          if (st.stage >= D.quests[id].stages.length) this.complete(id);
        }
      }
      if (changed) { refresh(); autosave(); }
      return changed;
    },
    checkWealth() {
      const v = S.economy.wealth();
      for (const id of S.quests.active()) {
        const st = CL.state.quests[id], stage = D.quests[id].stages[st.stage];
        if (!stage || (stage.type !== 'money' && stage.type !== 'wealth')) continue;
        if (v >= stage.target) {
          st.prog = stage.count || 1; st.stage++; st.prog = 0;
          toast('Obiettivo completato: ' + stage.text, 'good'); sfx('confirm');
          if (st.stage >= D.quests[id].stages.length) this.complete(id);
        }
      }
      refresh();
    },
    complete(id) {
      const st = CL.state, q = D.quests[id]; if (!q) return;
      const qs = st.quests[id]; qs.active = false; qs.done = true; qs.stage = q.stages.length;
      const r = q.reward || {};
      if (r.money) S.economy.earn(r.money, 'Missione: ' + q.name);
      if (r.rep) st.rep += r.rep;
      if (r.items) for (const it in r.items) S.inventory.add(it, r.items[it]);
      toast('MISSIONE COMPLETATA: ' + q.name, 'good'); sfx('level');
      S.achievements.check(); refresh(); autosave();
    },
    give(id) {
      const st = CL.state;
      if (!st.quests[id]) { this.start(id); toast(D.quests[id].desc, 'info'); return; }
      const q = st.quests[id];
      if (q.active) toast('Obiettivo attuale: ' + this.current(id).text, 'info');
      else toast('Missione già completata.', 'info');
    }
  };

  /* ------------------------------------------------------------- relazioni */
  S.relations = {
    level(id) { return CL.state.relations[id] || 0; },
    talk(id) {
      const st = CL.state;
      if (st.lastTalk[id] !== st.time.day) {
        st.relations[id] = this.level(id) + 1;
        st.lastTalk[id] = st.time.day;
        const def = D.npcs[id];
        toast('+1 affinità con ' + (def ? def.name : id), 'good');
        S.quests.progress('talk', id);
      }
      refresh();
    },
    gift(id, item) {
      const def = D.items[item]; if (!def || !def.gift || !S.inventory.has(item)) return false;
      S.inventory.remove(item);
      CL.state.relations[id] = this.level(id) + def.gift;
      toast(D.npcs[id].name + ' apprezza il regalo! +' + def.gift + ' affinità', 'good');
      sfx('confirm'); S.achievements.check(); refresh(); autosave(); return true;
    },
    best() { return Object.entries(CL.state.relations).sort((a, b) => b[1] - a[1]).slice(0, 5); }
  };

  /* -------------------------------------------------------------- immobili */
  S.property = {
    owns(id) { return CL.state.properties.indexOf(id) >= 0; },
    income() { return CL.state.properties.reduce((s, id) => s + (D.properties[id] ? D.properties[id].income : 0), 0); },
    buy(id) {
      const p = D.properties[id]; if (!p) return false;
      if (this.owns(id)) { toast('Hai già questo immobile.', 'info'); return false; }
      if (!S.economy.spend(p.price, 'Acquisto ' + p.name)) return false;
      CL.state.properties.push(id);
      S.inventory.add(id === 'bottega' ? 'chiave_bottega' : 'chiave_casa');
      CL.state.stats.bought++;
      S.quests.progress('buyproperty', id);
      toast('Hai acquistato: ' + p.name + '! Ora puoi entrarci.', 'good');
      sfx('level'); S.achievements.check(); refresh(); autosave(); return true;
    },
    dailyIncome() {
      const inc = this.income(); if (inc > 0) S.economy.earn(inc, 'Rendite immobiliari');
    },
    list() { return Object.keys(D.properties).map(id => ({ id, ...D.properties[id], owned: this.owns(id) })); }
  };

  /* --------------------------------------------------------------- creature */
  S.creatures = {
    spawn(mapId) {
      const st = CL.state, map = CL.maps.get(mapId), zone = map.zone;
      const rng = U.rng(U.hash(mapId + ':' + st.time.day));
      const ids = Object.keys(D.creatures).filter(id => D.creatures[id].zones.indexOf(mapId) >= 0);
      if (!ids.length) return [];
      const n = Math.min(9, 4 + (zone === 'vesuvio' ? 2 : 0));
      const out = [];
      for (let i = 0; i < n; i++) {
        const id = ids[(rng() * ids.length) | 0];
        const p = CL.maps.randomWalkable(map, rng);
        out.push({ id, x: p.x, y: p.y, map: mapId, bob: rng() * 6, wander: rng() * 6 });
      }
      return out;
    },
    respawn() { EV.emit('respawn'); },
    caught(id) { return CL.state.creatures[id] || 0; },
    total() { return Object.values(CL.state.creatures).reduce((a, b) => a + b, 0); },
    chance(creature) {
      const def = D.creatures[creature.id]; if (!def) return 0;
      let c = .72 - def.rare * .075;
      if (S.time.isNight()) c += .10;
      c += S.weather.catchBonus();
      if (S.needs.speedFactor() < .9) c -= .06;
      return U.clamp(c, .12, .95);
    },
    tryCatch(creature) {
      const st = CL.state;
      if (!S.inventory.has('rete')) { toast('Ti serve una reta da cattura! (Negozio o bar)', 'bad'); sfx('fail'); return false; }
      S.inventory.remove('rete');
      const c = this.chance(creature), ok = U.chance(c), def = D.creatures[creature.id];
      if (ok) {
        st.creatures[creature.id] = (st.creatures[creature.id] || 0) + 1;
        st.stats.caught++;
        st.xp += 10 + def.rare * 6;
        S.quests.progress('catch', creature.id);
        S.quests.progress('catchzone', CL.maps.get(creature.map).zone);
        toast('Catturato ' + def.name + '! (+' + (10 + def.rare * 6) + ' XP)', 'good');
        sfx('catch');
      } else {
        toast(def.name + ' è scappato via...', 'bad'); sfx('fail');
      }
      this.levelCheck(); refresh(); autosave(); return ok;
    },
    levelCheck() {
      const st = CL.state;
      while (st.xp >= st.level * 120) {
        st.level++; st.needs.energy = U.clamp(st.needs.energy + 15, 0, 100);
        toast('Livello ' + st.level + '! +15 energia', 'good'); sfx('level');
      }
    }
  };

  /* ------------------------------------------------------------- obiettivi */
  const ACH = {
    primo_passo: { name: 'Primo passo', desc: 'Fai il tuo primo lavoro', test: s => s.stats.worked >= 1 },
    ricco: { name: 'Tenuta di famiglia', desc: 'Possiedi 3 immobili', test: s => s.properties.length >= 3 },
    collezionista: { name: 'Collezionista', desc: 'Cattura 5 creature diverse', test: s => Object.keys(s.creatures).length >= 5 },
    pescatore: { name: 'Pescatore provetto', desc: 'Pesca 10 volte', test: s => s.stats.fished >= 10 },
    viaggiatore: { name: 'Viaggiatore', desc: 'Visita tutte le zone', test: s => ['napoli', 'costiera', 'vesuvio', 'pompei'].every(z => (s.flags.visited || {})[z]) },
    milionario: { name: 'Milionario campano', desc: 'Raggiungi 10.000 €', test: s => S.economy.wealth() >= 10000 },
    popolare: { name: 'Benvoluto', desc: 'Raggiungi 50 reputazione', test: s => s.rep >= 50 },
    nottambulo: { name: 'Nottambulo', desc: 'Esplori dopo le 23', test: s => S.time.hour() >= 23 }
  };
  S.achievements = {
    defs: ACH,
    check() {
      const st = CL.state; let changed = false;
      for (const id in ACH) if (st.achievements.indexOf(id) < 0 && ACH[id].test(st)) {
        st.achievements.push(id); toast('Obiettivo sbloccato: ' + ACH[id].name, 'good'); sfx('level'); changed = true;
      }
      if (changed) autosave();
    },
    list() { return Object.keys(ACH).map(id => ({ id, ...ACH[id], got: CL.state.achievements.indexOf(id) >= 0 })); }
  };

  /* ------------------------------------------------------------ varie azioni */
  S.actions = {
    visit(mapId) {
      const st = CL.state;
      st.flags.visited = st.flags.visited || {};
      st.flags.visited[mapId] = true;
      if (CL.maps.get(mapId).zone !== 'interno') {
        S.quests.progress('visit', mapId);
        S.quests.progress('visit', CL.maps.get(mapId).zone);
        st.stats.travel++;
      } else S.quests.progress('visit', mapId);
      S.achievements.check();
    },
    sleep() {
      const st = CL.state;
      if (S.time.hour() >= 22 || S.time.hour() < 6) { toast('È troppo presto per andare a letto.', 'info'); return false; }
      sfx('sleep');
      S.time.addMinutes((24 - S.time.hour()) * 60 - S.time.minute() + 7 * 60);
      st.needs.energy = 100; st.needs.mood = U.clamp(st.needs.mood + 18, 0, 100);
      st.stats.slept++;
      S.quests.progress('sleephome');
      toast('Buongiorno! Sei riposato.', 'good');
      S.achievements.check(); refresh(); autosave(); return true;
    },
    fish() {
      const st = CL.state;
      if (!S.inventory.has('canna')) { toast('Serve una canna da pesca (65 € al chiosco).', 'bad'); return false; }
      const ok = U.chance(.55 + (S.time.isNight() ? .12 : 0));
      S.needs.apply({ energy: -6, mood: 4 });
      S.time.skip(.3);
      if (ok) {
        S.inventory.add('pesce'); st.stats.fished++;
        S.quests.progress('fish');
        S.achievements.check();
        toast('Hai pescato un pesce azzurro!', 'good'); sfx('catch');
      } else { toast('Nessun pesce questa volta...', 'info'); sfx('fail'); }
      autosave(); return ok;
    },
    boat() {
      if (!S.economy.spend(12, 'Battello')) return false;
      const st = CL.state;
      const to = st.pos.map === 'capri' ? 'costiera' : 'capri';
      const spawn = to === 'capri' ? { x: 15 * CL.TILE, y: 17 * CL.TILE } : { x: 63 * CL.TILE, y: 28 * CL.TILE };
      S.time.skip(.4);
      toast(to === 'capri' ? 'Il battello salpa per Capri...' : 'Rientro ad Amalfi...', 'info');
      sfx('confirm');
      if (CL.game) CL.game.enterMap(to, spawn.x, spawn.y);
      return true;
    },
    cook() {
      if (!S.inventory.has('pane')) { toast('Serve del pane.', 'bad'); return false; }
      if (!S.inventory.has('pesce') && !S.inventory.has('arancino')) { toast('Servono ingredienti: pesce o arancino.', 'bad'); return false; }
      S.inventory.remove('pane');
      if (S.inventory.has('pesce')) S.inventory.remove('pesce'); else S.inventory.remove('arancino');
      S.inventory.add('pizza'); S.needs.apply({ energy: -4, mood: 8 });
      toast('Hai preparato una pizza!', 'good'); sfx('confirm'); return true;
    }
  };

  EV.on('newday', () => refresh());
})(window);
