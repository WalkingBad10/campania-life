/* CAMPANIA LIFE — maps.js
 * Mappe generate proceduralmente in modo deterministico (stessa mappa per tutti i giocatori).
 * Formato: griglia di caratteri, 16px per cella. Vedi art.js per la legenda dei tile.
 */
(function (w) {
  'use strict';
  const CL = w.CL, U = CL.util, T = CL.TILE;

  const SOLID = { T: 1, W: 1, '~': 1, '#': 1, '=': 1, c: 1, o: 1, X: 1, B: 1, '^': 1, P: 1, C: 1, V: 1 };

  function blank(x, y, ch) { return Array.from({ length: y }, () => new Array(x).fill(ch)); }
  function rect(g, x, y, ww, hh, ch) {
    for (let j = y; j < y + hh; j++) for (let i = x; i < x + ww; i++) if (g[j] && g[j][i] !== undefined) g[j][i] = ch;
  }
  function border(g, x, y, ww, hh, ch) {
    for (let i = x; i < x + ww; i++) { g[y][i] = ch; g[y + hh - 1][i] = ch; }
    for (let j = y; j < y + hh; j++) { g[j][x] = ch; g[j][x + ww - 1] = ch; }
  }
  function hline(g, x1, x2, y, ch, th) {
    for (let j = 0; j < (th || 1); j++) for (let i = x1; i <= x2; i++) if (g[y + j]) g[y + j][i] = ch;
  }
  function vline(g, x, y1, y2, ch, th) {
    for (let j = 0; j < (th || 1); j++) for (let i = y1; i <= y2; i++) if (g[i]) g[i][x + j] = ch;
  }
  function scatter(g, ch, n, filter, rng) {
    let tries = 0;
    while (n > 0 && tries++ < 3000) {
      const x = (rng() * g[0].length) | 0, y = (rng() * g.length) | 0;
      if (filter(g[y][x])) { g[y][x] = ch; n--; }
    }
  }

  function makeMap(id, zone, w, h, ground) {
    return { id, zone, w, h, g: ground, portals: [], pois: [], spawn: { x: w * T / 2, y: h * T / 2 }, name: id };
  }
  function portal(m, x, y, ww, hh, to, spawn, label) {
    m.portals.push({ x: x * T, y: y * T, w: (ww || 1) * T, h: (hh || 1) * T, to, spawn: spawn || { x: 0, y: 0 }, label: label || 'Vai' });
  }
  function poi(m, x, y, id, type, label, action, data) {
    m.pois.push({ x: x * T, y: y * T, id, type, label, action: action || 'interact', data: data || {} });
  }
  function building(m, x, y, ww, hh, to, label, action) {
    rect(m.g, x, y, ww, hh, '='); border(m.g, x, y, ww, hh, '#');
    const dx = x + (ww >> 1), dy = y + hh - 1;
    m.g[dy][dx] = 'D';
    portal(m, dx, dy, 1, 1, to, { x: (x + (ww >> 1)) * T, y: (y + hh - 1) * T + 20 }, label);
    poi(m, dx, dy, to, 'door', label, action || 'enter', { to });
    return { x: dx, y: dy };
  }

  /* ------------------------------------------------------------- NAPOLI */
  function napoli() {
    const m = makeMap('napoli', 'napoli', 64, 44, blank(64, 44, '.'));
    const R = U.rng(7717), g = m.g;
    scatter(g, ',', 90, c => c === '.', R);
    // strade
    [8, 18, 28, 38].forEach(y => { hline(g, 0, 63, y, 'r', 2); hline(g, 0, 63, y - 1, 'p'); hline(g, 0, 63, y + 2, 'p'); });
    [12, 26, 40, 54].forEach(x => { vline(g, x, 0, 43, 'r', 2); vline(g, x - 1, 0, 43, 'p'); vline(g, x + 2, 0, 43, 'p'); });
    // piazza
    rect(g, 28, 22, 9, 7, 'p'); g[25][32] = 'X';
    poi(m, 32, 26, 'fontana', ' scenery', 'Fontana della Piazza', 'flavor');
    // parco
    for (let i = 0; i < 22; i++) {
      const x = 3 + (R() * 9 | 0), y = 30 + (R() * 12 | 0);
      if (g[y][x] === '.') g[y][x] = 'T';
    }
    // edifici
    building(m, 12, 10, 5, 4, 'casa_nonna', 'Entra a casa di nonna');
    building(m, 21, 16, 6, 4, 'bar', 'Entra al Caffè Vittoria');
    building(m, 39, 12, 6, 5, 'banca', 'Entra in banca');
    building(m, 43, 27, 7, 5, 'clinica', 'Entra in clinica');
    building(m, 17, 31, 6, 4, 'negozio', 'Entra nella bottega');
    building(m, 32, 33, 6, 4, 'ufficio', 'Entra nell’ufficio lavori');
    building(m, 49, 15, 7, 5, 'casa_giocatore', 'Parla con l’agente immobiliare', 'realtor');
    building(m, 45, 34, 8, 4, 'cantiere', 'Entra al cantiere', 'jobsite');
    // collegamenti tra zone
    portal(m, 0, 18, 1, 2, 'costiera', { x: 3 * T, y: 14 * T }, 'Vai in Costiera');
    portal(m, 54, 0, 2, 1, 'vesuvio', { x: 54 * T, y: 46 * T }, 'Vai al Vesuvio');
    portal(m, 63, 27, 1, 2, 'pompei', { x: 5 * T, y: 30 * T }, 'Vai a Pompei');
    poi(m, 0, 18, 'to_costiera', 'sign', 'Costiera Amalfitana →', 'travel', { to: 'costiera' });
    poi(m, 54, 0, 'to_vesuvio', 'sign', 'Vesuvio ↑', 'travel', { to: 'vesuvio' });
    poi(m, 63, 27, 'to_pompei', 'sign', 'Scavi di Pompei →', 'travel', { to: 'pompei' });
    // punti di interazione
    poi(m, 32, 25, 'fontana2', 'flavor', 'Fontana antica', 'flavor');
    poi(m, 49, 21, 'realtor', 'service', 'Agenzia immobiliare', 'property');
    poi(m, 49, 39, 'cantiere_job', 'service', 'Cantiere', 'job', { job: 'operaio' });
    poi(m, 35, 38, 'ufficio_job', 'service', 'Ufficio lavori', 'jobs');
    // panchine e lampioni (decorativi, non bloccanti)
    [[16, 20], [30, 13], [44, 20], [22, 40]].forEach(([x, y]) => { if (g[y][x] === '.') g[y][x] = ','; });
    m.spawn = { x: 15 * T, y: 17 * T };
    return m;
  }

  /* ----------------------------------------------------------- COSTIERA */
  function costiera() {
    const m = makeMap('costiera', 'costiera', 72, 40, blank(72, 40, '.'));
    const R = U.rng(3312), g = m.g;
    scatter(g, ',', 80, c => c === '.', R);
    hline(g, 0, 71, 14, 'r', 2); hline(g, 0, 71, 13, 'p'); hline(g, 0, 71, 16, 'p');
    hline(g, 0, 71, 22, 'S', 2); hline(g, 0, 71, 25, '~');
    for (let y = 26; y < 40; y++) hline(g, 0, 71, y, 'W');
    // molo
    rect(g, 20, 23, 4, 11, 'o'); g[33][21] = 'o'; g[33][22] = 'o';
    poi(m, 21, 31, 'molo', 'service', 'Molo da pesca', 'fish');
    // scogli
    [[9, 27], [14, 30], [34, 28], [45, 31], [55, 27], [68, 30]].forEach(([x, y]) => { g[y][x] = '^'; });
    // limoneti
    for (let i = 0; i < 30; i++) {
      const x = 2 + (R() * 68 | 0), y = 2 + (R() * 10 | 0);
      if (g[y][x] === '.') g[y][x] = 'T';
    }
    // edifici
    building(m, 34, 8, 7, 4, 'souvenir', 'Entra al chiosco turistico', 'shop', { shop: 'costiera' });
    building(m, 57, 8, 6, 4, 'bar', 'Entra al bar sul mare', 'shop', { shop: 'costiera' });
    building(m, 7, 8, 6, 4, 'casa_amalfi', 'Casetta con vista mare', 'realtor');
    // barca
    poi(m, 63, 30, 'barca', 'service', 'Battello per Capri', 'boat');
    // collegamenti
    portal(m, 0, 14, 1, 2, 'napoli', { x: 3 * T, y: 19 * T }, 'Torna a Napoli');
    portal(m, 36, 0, 2, 1, 'vesuvio', { x: 36 * T, y: 46 * T }, 'Vai al Vesuvio');
    poi(m, 0, 14, 'to_napoli', 'sign', '← Napoli', 'travel', { to: 'napoli' });
    m.spawn = { x: 4 * T, y: 18 * T };
    return m;
  }

  /* ------------------------------------------------------------ VESUVIO */
  function vesuvio() {
    const m = makeMap('vesuvio', 'vesuvio', 64, 48, blank(64, 48, '.'));
    const R = U.rng(9921), g = m.g;
    scatter(g, ',', 150, c => c === '.', R);
    // sentiero
    for (let y = 46; y >= 12; y--) {
      const x = 32 + Math.round(Math.sin(y / 6) * 5);
      for (let i = -1; i <= 1; i++) if (g[y][x + i] && g[y][x + i] !== '^') g[y][x + i] = ',';
    }
    // vetta rocciosa
    for (let y = 0; y < 12; y++) for (let x = 0; x < 64; x++) {
      const d = Math.abs(x - 32) / (2 + y * 2.1);
      if (d < 1 && R() > .18) g[y][x] = '^';
    }
    // vigneti
    for (let y = 30; y < 38; y += 2) for (let x = 42; x < 54; x += 2) g[y][x] = 'T';
    // alberi e rocce
    scatter(g, 'T', 90, c => c === '.', R);
    scatter(g, '^', 35, c => c === '.', R);
    // grotta
    g[10][30] = 'G';
    portal(m, 30, 10, 1, 1, 'grotta', { x: 8 * T, y: 18 * T }, 'Entra nella grotta');
    poi(m, 30, 10, 'grotta', 'cave', 'Grotta del Vesuvio', 'enter', { to: 'grotta' });
    // collegamenti
    portal(m, 32, 47, 2, 1, 'napoli', { x: 54 * T, y: 2 * T }, 'Scendi a Napoli');
    portal(m, 63, 20, 1, 2, 'costiera', { x: 70 * T, y: 15 * T }, 'Vai in Costiera');
    poi(m, 32, 46, 'to_napoli', 'sign', 'Napoli ↓', 'travel', { to: 'napoli' });
    m.spawn = { x: 32 * T, y: 45 * T };
    return m;
  }

  /* ------------------------------------------------------------- POMPEI */
  function pompei() {
    const m = makeMap('pompei', 'pompei', 56, 40, blank(56, 40, 'g'));
    const R = U.rng(5510), g = m.g;
    // muri delle rovine
    for (let i = 0; i < 46; i++) {
      const x = 6 + (R() * 45 | 0), y = 4 + (R() * 32 | 0), len = 2 + (R() * 5 | 0);
      if (R() > .45) hline(g, x, Math.min(55, x + len), y, '#'); else vline(g, x, y, Math.min(39, y + len), '#');
    }
    hline(g, 8, 48, 30, 'p');
    vline(g, 12, 24, 39, 'p');
    g[29][12] = 'G';
    // negozio souvenir
    building(m, 40, 20, 7, 4, 'souvenir', 'Entra nel negozio di souvenir', 'shop', { shop: 'pompei' });
    // collegamenti
    portal(m, 0, 30, 1, 2, 'napoli', { x: 62 * T, y: 28 * T }, 'Torna a Napoli');
    poi(m, 1, 30, 'to_napoli', 'sign', '← Napoli', 'travel', { to: 'napoli' });
    m.spawn = { x: 5 * T, y: 30 * T };
    return m;
  }

  /* --------------------------------------------------------------- CAPRI */
  function capri() {
    const m = makeMap('capri', 'costiera', 30, 24, blank(30, 24, '.'));
    const R = U.rng(1234), g = m.g;
    scatter(g, ',', 40, c => c === '.', R);
    scatter(g, 'T', 18, c => c === '.', R);
    hline(g, 0, 29, 18, 'S', 2); hline(g, 0, 29, 21, '~');
    for (let y = 22; y < 24; y++) hline(g, 0, 29, y, 'W');
    poi(m, 15, 19, 'barca_capri', 'service', 'Battello per Amalfi', 'boat');
    portal(m, 15, 19, 1, 2, 'costiera', { x: 63 * T, y: 30 * T }, 'Torna ad Amalfi');
    m.spawn = { x: 15 * T, y: 17 * T };
    return m;
  }

  /* ---------------------------------------------------------- INTERNI */
  function interior(id, kind, w, h, decorate) {
    const m = makeMap(id, 'interno', w, h, blank(w, h, 'f'));
    const g = m.g;
    border(g, 0, 0, w, h, '#');
    const dx = w >> 1, dy = h - 1;
    g[dy][dx] = 'D';
    portal(m, dx, dy, 1, 1, 'prev', { x: dx * T, y: (h - 2) * T }, 'Esci');
    poi(m, dx, dy, 'exit', 'door', 'Esci', 'exit');
    if (decorate) decorate(m, g);
    switch (kind) {
      case 'home':
        rect(g, 2, 2, 5, 2, 'B'); rect(g, w - 7, 2, 4, 2, 'o'); rect(g, 2, h - 5, 4, 1, 'o');
        poi(m, 3, 3, 'bed', 'furniture', 'Letto — dormi', 'sleep');
        poi(m, w - 6, 3, 'stove', 'furniture', 'Cucina — cucina qualcosa', 'cook');
        poi(m, 3, h - 6, 'pc', 'furniture', 'Computer — cerca lavoro', 'jobs');
        break;
      case 'shop':
        rect(g, 2, 2, w - 4, 1, 'o'); rect(g, 2, 5, w - 4, 1, 'o');
        rect(g, 2, h - 5, w - 4, 1, 'c');
        poi(m, dx, h - 6, 'counter', 'service', 'Bancone — acquista', 'shop', { shop: id === 'souvenir' ? 'pompei' : id });
        break;
      case 'bar':
        rect(g, 2, h - 6, w - 4, 2, 'c');
        for (let x = 3; x < w - 3; x += 3) g[h - 8][x] = 'o';
        poi(m, dx, h - 8, 'bar_counter', 'service', 'Bancone — acquista', 'shop', { shop: 'bar' });
        break;
      case 'office':
        rect(g, 3, 3, 4, 1, 'c'); rect(g, w - 7, 3, 4, 1, 'c'); rect(g, 3, 7, 4, 1, 'c');
        poi(m, 5, 5, 'desk', 'service', 'Sportello — lavori', 'jobs');
        break;
      case 'bank':
        rect(g, 2, h - 6, w - 4, 2, 'c');
        poi(m, dx, h - 8, 'bank_counter', 'service', 'Sportello bancario', 'bank', { mode: 'menu' });
        break;
      case 'clinic':
        rect(g, 2, 3, 4, 2, 'B'); rect(g, w - 6, 3, 4, 2, 'B'); rect(g, 2, h - 5, w - 4, 1, 'c');
        poi(m, 4, 6, 'clinic_bed', 'service', 'Visita medica', 'heal');
        break;
      case 'cave':
        g.forEach(row => row.forEach((c, i) => { if (c === 'f') row[i] = 'k'; }));
        rect(g, 2, 2, 4, 2, '^'); rect(g, w - 6, 3, 4, 3, '^');
        poi(m, 4, 6, 'lava', 'scenery', 'Roccia incandescente', 'flavor');
        break;
    }
    m.spawn = { x: dx * T, y: (h - 2) * T };
    return m;
  }

  const MAPS = CL.maps = {
    cache: {},
    get(id) {
      if (this.cache[id]) return this.cache[id];
      let m;
      switch (id) {
        case 'napoli': m = napoli(); break;
        case 'costiera': m = costiera(); break;
        case 'vesuvio': m = vesuvio(); break;
        case 'pompei': m = pompei(); break;
        case 'capri': m = capri(); break;
        case 'casa_nonna': m = interior(id, 'home', 16, 12); break;
        case 'casa_giocatore': m = interior(id, 'home', 16, 12); break;
        case 'appartamento': m = interior(id, 'home', 20, 14, mm => { mm.g[3][10] = 'V'; mm.g[4][15] = 'P'; mm.g[4][4] = 'P'; }); break;
        case 'casa_amalfi': m = interior(id, 'home', 18, 13, mm => { mm.g[3][3] = 'P'; mm.g[3][14] = 'P'; }); break;
        case 'bottega': m = interior(id, 'shop', 18, 12); break;
        case 'souvenir': m = interior(id, 'shop', 16, 11); break;
        case 'bar': m = interior(id, 'bar', 18, 12); break;
        case 'negozio': m = interior(id, 'shop', 18, 12); break;
        case 'banca': m = interior(id, 'bank', 16, 12); break;
        case 'clinica': m = interior(id, 'clinic', 18, 12); break;
        case 'ufficio': m = interior(id, 'office', 18, 12); break;
        case 'grotta': m = interior(id, 'cave', 18, 20); break;
        default: m = interior(id, 'home', 16, 12);
      }
      m.width = m.w * T; m.height = m.h * T;
      m.name = ({ napoli: 'Napoli Centro', costiera: 'Costiera Amalfitana', vesuvio: 'Falde del Vesuvio', pompei: 'Scavi di Pompei', capri: 'Capri', grotta: 'Grotta del Vesuvio', bar: 'Caffè Vittoria', negozio: 'Bottega di Sora Maria', banca: 'Banca di Napoli', clinica: 'Clinica', ufficio: 'Ufficio lavori', casa_nonna: 'Casa di nonna', casa_giocatore: 'Casa nuova', appartamento: 'Appartamento a Chiaia', casa_amalfi: 'Casetta ad Amalfi', bottega: 'Bottega di famiglia', souvenir: 'Souvenir degli scavi' })[id] || id;
      this.cache[id] = m;
      return m;
    },
    tile(m, tx, ty) { return (m.g[ty] && m.g[ty][tx]) || '#'; },
    solidChar(ch) { return !!SOLID[ch]; },
    solidAt(m, x, y) {
      const tx = Math.floor(x / T), ty = Math.floor(y / T);
      return SOLID[this.tile(m, tx, ty)] || false;
    },
    walkable(m, tx, ty) { return !SOLID[this.tile(m, tx, ty)]; },
    portalAt(m, x, y) { return m.portals.find(p => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h) || null; },
    randomWalkable(m, rng) {
      for (let i = 0; i < 200; i++) {
        const x = (rng() * m.w) | 0, y = (rng() * m.h) | 0;
        if (this.walkable(m, x, y) && this.tile(m, x, y) !== 'r' && this.tile(m, x, y) !== 'p') return { x: x * T + 8, y: y * T + 10, tx: x, ty: y };
      }
      return { x: m.spawn.x + 32, y: m.spawn.y + 16 };
    },
    findPoi(m, id) { return m.pois.find(p => p.id === id) || null; }
  };
})(window);
