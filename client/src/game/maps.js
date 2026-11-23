/* CAMPANIA LIFE — maps.js
 * Mappe generate proceduralmente in modo deterministico (stessa mappa per tutti i giocatori).
 * Formato: griglia di caratteri, 16px per cella. Vedi art.js per la legenda dei tile.
 */
(function (w) {
  'use strict';
  const CL = w.CL, U = CL.util, T = CL.TILE;

  // Floor tiles A,M,R,h,Z,k are walkable; walls/furniture/props remain solid.
  const SOLID = { T: 1, W: 1, '~': 1, '#': 1, '=': 1, c: 1, o: 1, X: 1, B: 1, '^': 1, P: 1, C: 1, V: 1, O: 1, H: 1, L: 1, F: 1, K: 1, Q: 1, I: 1, J: 1, j: 1, l: 1, n: 1, q: 1, s: 1, u: 1, v: 1, w: 1, x: 1, y: 1, z: 1, '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1, '8': 1, '9': 1 };

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
    return { id, zone, w, h, g: ground, portals: [], pois: [], decors: [], spawn: { x: w * T / 2, y: h * T / 2 }, name: id };
  }
  function decor(m, x, y, type, data) { m.decors.push({ x: x * T, y: y * T, type, data: data || {} }); }
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
    // Area prioritaria fedele (scala gameplay): Piazza del Gesù Nuovo + inizio Via Benedetto Croce/Spaccanapoli.
    // Riferimenti: Chiesa del Gesù Nuovo sul lato ovest/nord della piazza, Guglia dell'Immacolata al centro,
    // Palazzo Pignatelli di Monteleone/Complesso a nord-est, palazzi storici e accesso a Spaccanapoli a sud-est.
    const m = makeMap('napoli', 'napoli', 72, 48, blank(72, 48, 'p'));
    m.name = 'Piazza del Gesù Nuovo';
    m.spawn = { x: 36 * T, y: 36 * T };
    const R = U.rng(7717), g = m.g;

    // Pavimentazione: basolato piazza, marciapiedi, sagrato
    rect(g, 10, 16, 44, 22, 'D'); // piazza principale
    rect(g, 14, 12, 18, 4, 'D');  // sagrato davanti Gesù Nuovo
    rect(g, 8, 15, 2, 24, 'p'); rect(g, 54, 15, 2, 24, 'p');
    rect(g, 10, 14, 44, 2, 'p'); rect(g, 10, 38, 44, 2, 'p');

    // Via Benedetto Croce / Spaccanapoli (est) e Calata Trinità Maggiore (ovest)
    hline(g, 54, 71, 31, 'r', 2); hline(g, 54, 71, 30, 'p'); hline(g, 54, 71, 33, 'p');
    hline(g, 0, 10, 31, 'r', 2);  hline(g, 0, 10, 30, 'p');  hline(g, 0, 10, 33, 'p');
    // Via San Sebastiano / connessione nord-sud laterale
    vline(g, 58, 34, 47, 'r', 2); vline(g, 57, 34, 47, 'p'); vline(g, 60, 34, 47, 'p');
    vline(g, 12, 39, 47, 'r', 2); vline(g, 11, 39, 47, 'p'); vline(g, 14, 39, 47, 'p');

    // Guglia dell'Immacolata: base solida 4x3
    rect(g, 34, 25, 4, 3, 'O');
    rect(g, 35, 26, 2, 1, 'D');

    // CHIESA DEL GESÙ NUOVO (lato ovest/nord, facciata bugnata immediatamente riconoscibile)
    rect(g, 8, 2, 24, 13, '#');
    for (let y = 3; y < 14; y++) for (let x = 9; x < 31; x++) g[y][x] = 'H';
    // portale centrale e dettagli
    rect(g, 19, 11, 2, 4, 'Y'); rect(g, 19, 10, 2, 1, '#');
    rect(g, 13, 5, 2, 3, 'I'); rect(g, 25, 5, 2, 3, 'I');
    rect(g, 9, 2, 22, 1, '='); rect(g, 8, 14, 24, 1, 'p');

    // Complesso/palazzi nord-est (massa storica)
    rect(g, 34, 2, 20, 12, '#');
    for (let y = 3; y < 13; y++) for (let x = 35; x < 53; x++) {
      if (y === 5 || y === 8 || y === 11) g[y][x] = (x % 4 < 2) ? 'L' : '#';
      else if ((x % 6 === 0) && y > 3) g[y][x] = 'F';
      else g[y][x] = '#';
    }
    rect(g, 43, 12, 2, 2, 'Y'); rect(g, 34, 13, 20, 1, 'p');

    // Palazzi lato sud di Via B. Croce (fronte continuo, accessi commerciali)
    rect(g, 10, 39, 16, 7, '#');
    for (let y = 40; y < 45; y++) for (let x = 11; x < 25; x++) { g[y][x] = (y === 41 || y === 43) ? ((x % 3 === 0) ? 'L' : '#') : '#'; }
    rect(g, 17, 44, 2, 2, 'Y'); // ingresso
    rect(g, 28, 39, 10, 7, '#');
    for (let y = 40; y < 45; y++) for (let x = 29; x < 37; x++) { g[y][x] = (y === 41 || y === 43) ? ((x % 3 === 1) ? 'L' : '#') : '#'; }
    rect(g, 31, 44, 2, 2, 'Y'); // banca ingresso
    rect(g, 40, 39, 8, 7, '#');
    for (let y = 40; y < 45; y++) for (let x = 41; x < 47; x++) { g[y][x] = (y === 41) ? ((x % 2 === 0) ? 'L' : '#') : '#'; }
    rect(g, 43, 44, 2, 2, 'Y'); // bar ingresso
    rect(g, 50, 39, 8, 7, '#');
    for (let y = 40; y < 45; y++) for (let x = 51; x < 57; x++) { g[y][x] = (y === 41 || y === 43) ? ((x % 3 === 0) ? 'L' : '#') : '#'; }
    rect(g, 53, 44, 2, 2, 'Y');

    // Lato est piazza - palazzi e ufficio
    rect(g, 55, 16, 10, 12, '#');
    for (let y = 17; y < 27; y++) for (let x = 56; x < 64; x++) { g[y][x] = (y === 18 || y === 21 || y === 24) ? ((x % 3 === 0) ? 'L' : '#') : '#'; }
    rect(g, 59, 26, 2, 2, 'Y');

    // Edicola/negozio piccolo sul bordo piazza
    rect(g, 38, 34, 3, 3, 'K'); g[36][39] = 'p';

    // Arredi urbani: piazza viva e proporzionata
    [[16, 19], [28, 19], [44, 19], [16, 36], [48, 36], [52, 24], [24, 28], [40, 28]].forEach(([x, y]) => { if (g[y] && g[y][x] === 'D') g[y][x] = 'U'; });
    [[22, 23], [46, 23], [22, 33], [46, 33], [30, 23], [38, 33]].forEach(([x, y]) => { if (g[y] && g[y][x] === 'D') g[y][x] = 'E'; });
    // Piccoli mercatini in piazza (decorativi, passaggio libero)
    scatter(g, ',', 30, c => c === 'D', R);
    // Fioriere/confini più leggibili
    [[13,16],[17,16],[29,16],[41,16],[47,16],[51,16],[13,37],[51,37]].forEach(([x,y])=>{ if(g[y]&&g[y][x]==='D') g[y][x]='P'; });

    // Overlay architettonici (sprite code-drawn, cacheati)
    decor(m, 9, 3, 'gesu_facade', { h: 12 * T });
    decor(m, 34, 2, 'palazzo_ne', { h: 12 * T });
    decor(m, 10, 39, 'palazzo_sw', { h: 7 * T });
    decor(m, 28, 39, 'palazzo_banca', { h: 7 * T });
    decor(m, 40, 39, 'palazzo_bar', { h: 7 * T });
    decor(m, 50, 39, 'palazzo_se', { h: 7 * T });
    decor(m, 55, 16, 'palazzo_e', { h: 12 * T });
    decor(m, 38, 34, 'edicola', { h: 48 });
    decor(m, 43, 44, 'awning', { w: 32, color: '#b94a3a', h: 12 });
    decor(m, 31, 44, 'awning', { w: 32, color: '#3f6f95', h: 12 });
    decor(m, 20, 10, 'portal_arch', { h: 24 });
    [[15,18],[27,18],[45,18],[15,35],[49,35],[53,23],[24,28],[40,28],[20,29],[44,29]].forEach(([x,y]) => decor(m, x, y, 'lamp', { h: 16 }));
    [[22,22],[46,22],[22,32],[46,32],[30,22],[38,32],[29,35],[43,35]].forEach(([x,y]) => decor(m, x, y, 'bench', { h: 10 }));
    [[18,16],[26,16],[42,16],[48,16],[18,37],[50,37],[13,16],[51,16],[13,37],[51,37],[21,37],[47,37]].forEach(([x,y]) => decor(m, x, y, 'plant', { h: 12 }));
    decor(m, 25, 35, 'cart', { h: 20 });
    decor(m, 47, 36, 'table_out', { h: 12 }); decor(m, 45, 36, 'chair_out', { h: 10 }); decor(m, 49, 36, 'chair_out', { h: 10 });
    decor(m, 33, 37, 'sign', { h: 20 });
    // Bancarelle mercato
    decor(m, 24, 30, 'awning', { w: 48, color: '#c95a3a', h: 12 });
    decor(m, 36, 30, 'awning', { w: 48, color: '#3f7a4a', h: 12 });
    decor(m, 25, 30, 'cart', { h: 20 }); decor(m, 39, 30, 'cart', { h: 20 });

    // Portali interni / servizi (ID preservati)
    portal(m, 19, 14, 2, 1, 'casa_nonna', { x: 8 * T, y: 10 * T }, 'Ingresso Gesù Nuovo');
    portal(m, 43, 45, 2, 1, 'bar', { x: 9 * T, y: 10 * T }, 'Caffè Vittoria');
    portal(m, 39, 36, 1, 1, 'negozio', { x: 9 * T, y: 10 * T }, 'Edicola');
    portal(m, 31, 45, 2, 1, 'banca', { x: 8 * T, y: 10 * T }, 'Banca');
    portal(m, 17, 45, 2, 1, 'clinica', { x: 9 * T, y: 10 * T }, 'Clinica');
    portal(m, 59, 27, 2, 1, 'ufficio', { x: 9 * T, y: 10 * T }, 'Ufficio');
    portal(m, 53, 45, 2, 1, 'casa_giocatore', { x: 9 * T, y: 10 * T }, 'Agenzia', 'realtor');

    // Collegamenti zona (placeholder sicuri)
    portal(m, 71, 31, 1, 2, 'costiera', { x: 3 * T, y: 14 * T }, 'Verso la Costiera');
    portal(m, 0, 31, 1, 2, 'pompei', { x: 54 * T, y: 30 * T }, 'Verso Toledo');
    portal(m, 12, 47, 2, 1, 'vesuvio', { x: 32 * T, y: 3 * T }, 'Verso sud');

    // POI / landmark
    poi(m, 36 * T, 26 * T, 'guglia', 'landmark', "Guglia dell'Immacolata", 'flavor');
    poi(m, 20 * T, 9 * T, 'gesu', 'landmark', 'Chiesa del Gesù Nuovo', 'flavor');
    poi(m, 63 * T, 32 * T, 'croce', 'landmark', 'Via Benedetto Croce', 'flavor');
    poi(m, 44 * T, 44 * T, 'bar_poi', 'service', 'Caffè Vittoria', 'shop', { shop: 'bar' });
    poi(m, 39 * T, 35 * T, 'edicola_poi', 'service', 'Edicola', 'shop', { shop: 'negozio' });
    poi(m, 32 * T, 44 * T, 'banca_poi', 'service', 'Banca', 'bank');
    poi(m, 62 * T, 42 * T, 'cantiere_job', 'service', 'Cantiere', 'job', { job: 'operaio' });
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
  function place(g, x, y, ch) { if (g[y] && g[y][x] !== undefined) g[y][x] = ch; }
  function fillRect(g, x, y, ww, hh, ch) { rect(g, x, y, ww, hh, ch); }

  function churchGesu() {
    const w = 28, h = 22;
    const m = makeMap('casa_nonna', 'interno', w, h, blank(w, h, 'A'));
    m.name = 'Chiesa del Gesù Nuovo';
    const g = m.g;
    // muri perimetrali
    for (let x = 0; x < w; x++) { g[0][x] = '#'; g[h - 1][x] = '#'; }
    for (let y = 0; y < h; y++) { g[y][0] = '#'; g[y][w - 1] = '#'; }
    // parete interna/abside
    for (let x = 1; x < w - 1; x++) g[1][x] = 'j';
    for (let x = 2; x < w - 2; x++) g[2][x] = 'j';
    // colonne navata
    for (const yy of [6, 10, 14]) { g[yy][5] = 'l'; g[yy][9] = 'l'; g[yy][18] = 'l'; g[yy][22] = 'l'; }
    // cappelle laterali (muri)
    for (let y = 4; y < 18; y++) { g[y][3] = (y % 4 === 0) ? 'A' : 'j'; g[y][w - 4] = (y % 4 === 0) ? 'A' : 'j'; }
    for (const yy of [5, 9, 13]) { g[yy][1] = '6'; g[yy][2] = '5'; g[yy][w - 2] = '6'; g[yy][w - 3] = '5'; }
    // navata centrale tappeto rosso (corridoio centrale continuo fino all'altare)
    for (let y = 4; y <= 20; y++) { g[y][13] = 'R'; g[y][14] = 'R'; }
    // tappeto ingresso/porta: zona libera garantita (ampia, davanti alla porta)
    for (let y = 18; y <= 20; y++) for (let x = 12; x <= 15; x++) g[y][x] = 'R';
    // panche (mai sul corridoio centrale 13-14)
    for (const yy of [7, 9, 11, 13, 15]) {
      for (let x = 6; x <= 8; x++) g[yy][x] = 'n';
      for (let x = 19; x <= 21; x++) g[yy][x] = 'n';
      g[yy][11] = 'n'; g[yy][12] = 'n'; g[yy][15] = 'n'; g[yy][16] = 'n';
    }
    // altare maggiore
    for (let x = 11; x <= 16; x++) g[3][x] = 'q';
    g[4][12] = '5'; g[4][15] = '5'; g[3][13] = '6'; g[3][14] = '6';
    // pavimento decorato presbiterio
    for (let y = 3; y <= 5; y++) for (let x = 10; x <= 17; x++) if (g[y][x] === 'A') g[y][x] = 'M';
    // ingressi laterali visivi / confessionali
    g[17][1] = '8'; g[17][w - 2] = '8';
    // candele e piante (fuori dal corridoio centrale ingresso)
    g[18][4] = '5'; g[18][23] = '5'; g[16][6] = '9'; g[16][21] = '9';
    // porta uscita sulla parete sud, tappeto davanti
    const dx = 14, dy = h - 1;
    g[dy][dx] = 'D'; g[dy][13] = '#'; g[dy][15] = '#';
    for (let y = 18; y <= 20; y++) for (let x = 12; x <= 15; x++) g[y][x] = 'R';
    // Portale uscita sul tappeto, in fondo vicino alla porta (riga 20), NON sulla riga spawn.
    portal(m, 13, 20, 2, 1, 'prev', { x: 20 * T, y: 16 * T }, 'Esci in piazza');
    poi(m, dx, 20, 'exit', 'door', 'Esci dalla chiesa', 'exit');
    poi(m, 13, 4, 'altar', 'scenery', 'Altare maggiore', 'flavor');
    poi(m, 7, 8, 'pew', 'scenery', 'Panca — siediti un momento', 'rest_pew');
    poi(m, 2, 6, 'chapel_l', 'scenery', 'Cappella laterale', 'flavor');
    poi(m, 25, 6, 'chapel_r', 'scenery', 'Cappella laterale', 'flavor');
    // decor estratti da reference sheet (M1) — dimensionati e posizionati, non sfondo fisso
    decor(m, 11, 2, 'church_altar', { w: 96, h: 118 });
    decor(m, 5, 10, 'church_pew', { w: 54, h: 24 }); decor(m, 9, 10, 'church_pew', { w: 54, h: 24 });
    decor(m, 16, 10, 'church_pew', { w: 54, h: 24 }); decor(m, 20, 10, 'church_pew', { w: 54, h: 24 });
    decor(m, 5, 13, 'church_pew', { w: 54, h: 24 }); decor(m, 9, 13, 'church_pew', { w: 54, h: 24 });
    decor(m, 16, 13, 'church_pew', { w: 54, h: 24 }); decor(m, 20, 13, 'church_pew', { w: 54, h: 24 });
    decor(m, 1, 5, 'church_statue', { w: 28, h: 78 }); decor(m, 25, 5, 'church_statue', { w: 28, h: 78 });
    decor(m, 3, 3, 'church_painting1', { w: 56, h: 40 }); decor(m, 22, 3, 'church_painting1', { w: 56, h: 40 });
    decor(m, 7, 4, 'church_candle', { w: 12, h: 26 }); decor(m, 20, 4, 'church_candle', { w: 12, h: 26 });
    // luci calde
    decor(m, 7, 4, 'candle_glow', { h: 8 }); decor(m, 20, 4, 'candle_glow', { h: 8 });
    decor(m, 4, 9, 'candle_glow', { h: 8 }); decor(m, 23, 9, 'candle_glow', { h: 8 });
    decor(m, 14, 2, 'window_light', { w: 16, h: 10, color: 'rgba(255,210,140,.22)' });
    // Spawn ESATTO: centro tappeto rosso, parte inferiore vicino ingresso, ma sopra portale uscita.
    // Tappeto centrale: colonne 13-14 (R). Riga 18 = 2 celle sopra portale uscita riga 20, libera.
    m.spawn = { x: 14 * T, y: 18 * T + 8 }; // centro tappeto rosso (tra tile 13-14), riga 18
    m.spawnDir = 'up';
    return m;
  }

  function barInterior() {
    const w = 20, h = 14;
    const m = makeMap('bar', 'interno', w, h, blank(w, h, 'h'));
    m.name = 'Caffè Vittoria';
    const g = m.g;
    for (let x = 0; x < w; x++) { g[0][x] = '#'; g[h - 1][x] = '#'; }
    for (let y = 0; y < h; y++) { g[y][0] = '#'; g[y][w - 1] = '#'; }
    for (let x = 1; x < w - 1; x++) { g[1][x] = 'j'; g[2][x] = 'j'; }
    // pavimento zona tavoli
    for (let y = 7; y <= 12; y++) for (let x = 2; x <= 17; x++) g[y][x] = 'Z';
    // bancone
    for (let x = 2; x <= 10; x++) g[4][x] = 'u';
    g[3][3] = '0'; g[3][5] = '3'; g[3][7] = 'y'; g[3][9] = '0';
    g[5][4] = 'w'; g[5][8] = 'w';
    // scaffali dietro
    g[2][2] = 's'; g[2][4] = 's'; g[2][6] = 's'; g[2][8] = 's'; g[2][10] = 's';
    // tavoli e sedie
    const tables = [[4,8],[8,8],[13,8],[15,5],[4,11],[9,11],[14,11]];
    tables.forEach(([tx,ty]) => { g[ty][tx] = 'v'; if (g[ty-1]) g[ty-1][tx] = 'w'; if (g[ty+1]) g[ty+1][tx] = 'w'; if (g[ty][tx-1]) g[ty][tx-1] = 'w'; if (g[ty][tx+1]) g[ty][tx+1] = 'w'; });
    // finestre/decor
    g[1][14] = '7'; g[1][16] = '7';
    g[2][17] = '9'; g[11][17] = '9'; g[11][2] = '9';
    const dx = 10, dy = h - 1;
    g[dy][dx] = 'D';
    portal(m, dx, dy, 1, 1, 'prev', { x: 44 * T, y: 46 * T }, 'Esci');
    poi(m, dx, dy, 'exit', 'door', 'Esci', 'exit');
    poi(m, 6, 5, 'bar_counter', 'service', 'Bancone — ordina', 'shop', { shop: 'bar' });
    poi(m, 4, 9, 'seat', 'furniture', 'Siediti e mangia', 'eat_bar');
    poi(m, 13, 9, 'seat2', 'furniture', 'Siediti e mangia', 'eat_bar');
    // M1 extracted bar decor
    decor(m, 2, 2, 'bar_shelf', { w: 132, h: 34 });
    decor(m, 2, 4, 'bar_counter', { w: 150, h: 38 });
    decor(m, 4, 8, 'bar_table', { w: 48, h: 20 }); decor(m, 13, 8, 'bar_table', { w: 48, h: 20 });
    decor(m, 14, 4, 'bar_detail', { w: 48, h: 62 });
    decor(m, 3, 3, 'warm_light', { r: 28, color: 'rgba(255,190,120,.16)' });
    decor(m, 15, 6, 'warm_light', { r: 24, color: 'rgba(255,190,120,.14)' });
    decor(m, 10, 10, 'warm_light', { r: 24, color: 'rgba(255,190,120,.12)' });
    decor(m, 6, 3, 'window_light', { w: 12, h: 8, color: 'rgba(255,220,160,.10)' });
    m.spawn = { x: dx * T, y: (h - 3) * T };
    m.spawnDir = 'up';
    return m;
  }

  function interior(id, kind, w, h, decorate) {
    if (id === 'casa_nonna') return churchGesu();
    if (id === 'bar') return barInterior();
    const m = makeMap(id, 'interno', w, h, blank(w, h, kind === 'cave' ? 'k' : 'h'));
    const g = m.g;
    for (let x = 0; x < w; x++) { g[0][x] = '#'; g[h - 1][x] = '#'; }
    for (let y = 0; y < h; y++) { g[y][0] = '#'; g[y][w - 1] = '#'; }
    for (let x = 1; x < w - 1; x++) { g[1][x] = 'j'; g[2][x] = kind === 'cave' ? 'k' : 'j'; }
    const dx = w >> 1, dy = h - 1;
    g[dy][dx] = 'D';
    portal(m, dx, dy, 1, 1, 'prev', { x: dx * T, y: (h - 2) * T }, 'Esci');
    poi(m, dx, dy, 'exit', 'door', 'Esci', 'exit');
    if (decorate) decorate(m, g);
    switch (kind) {
      case 'home':
        for (let y = 3; y < h - 2; y++) for (let x = 1; x < w - 1; x++) g[y][x] = 'h';
        rect(g, 2, 3, 4, 2, 'x'); rect(g, 2, 6, 2, 2, '4');
        rect(g, w - 5, 3, 3, 2, 'y'); rect(g, w - 4, 6, 2, 1, 'z');
        rect(g, 3, h - 5, 3, 2, 'v'); g[h - 6][4] = 'w'; g[h - 3][4] = 'w';
        rect(g, w - 6, h - 5, 3, 1, '1'); g[h - 6][w - 5] = '2'; g[h - 4][w - 5] = 'w';
        g[1][3] = '7'; g[1][w - 4] = '7'; g[3][w - 2] = '9';
        poi(m, 3, 4, 'bed', 'furniture', 'Letto — dormi', 'sleep');
        poi(m, w - 4, 4, 'stove', 'furniture', 'Cucina — prepara qualcosa', 'cook');
        poi(m, w - 5, h - 5, 'pc', 'furniture', 'Computer — cerca lavoro', 'jobs');
        poi(m, 4, h - 5, 'table', 'furniture', 'Tavolo — mangia', 'eat_home');
        decor(m, 4, 4, 'warm_light', { r: 26, color: 'rgba(255,200,140,.12)' });
        decor(m, w - 4, 4, 'warm_light', { r: 22, color: 'rgba(255,210,150,.12)' });
        break;
      case 'shop':
        for (let y = 3; y < h - 2; y++) for (let x = 1; x < w - 1; x++) g[y][x] = 'h';
        for (let x = 2; x < w - 2; x += 3) { g[3][x] = 's'; g[6][x] = 's'; }
        rect(g, 2, h - 5, w - 4, 1, 'u'); g[h - 6][dx] = '3';
        g[1][3] = '7'; g[1][w - 4] = '7';
        poi(m, dx, h - 5, 'counter', 'service', 'Bancone — acquista', 'shop', { shop: id === 'souvenir' ? 'pompei' : id });
        decor(m, dx, 5, 'warm_light', { r: 30, color: 'rgba(255,210,150,.12)' });
        break;
      case 'office':
        for (let y = 3; y < h - 2; y++) for (let x = 1; x < w - 1; x++) g[y][x] = 'h';
        rect(g, 3, 4, 4, 1, '1'); g[3][4] = '2'; g[5][4] = 'w';
        rect(g, w - 8, 4, 4, 1, '1'); g[3][w - 7] = '2'; g[5][w - 7] = 'w';
        rect(g, 3, 8, 4, 1, '1'); g[7][4] = '2'; g[9][4] = 'w';
        g[3][w - 3] = '4'; g[7][w - 3] = '4'; g[1][4] = '7'; g[1][w - 5] = '7';
        poi(m, 5, 5, 'desk', 'service', 'Sportello — lavori', 'jobs');
        decor(m, 8, 5, 'warm_light', { r: 34, color: 'rgba(255,220,170,.10)' });
        break;
      case 'bank':
        for (let y = 3; y < h - 2; y++) for (let x = 1; x < w - 1; x++) g[y][x] = 'M';
        rect(g, 2, h - 5, w - 4, 1, 'u'); g[h - 6][dx] = '3';
        g[4][3] = '1'; g[3][3] = '2'; g[4][w - 4] = '1'; g[3][w - 4] = '2';
        g[1][4] = '7'; g[1][w - 5] = '7';
        poi(m, dx, h - 5, 'bank_counter', 'service', 'Sportello bancario', 'bank', { mode: 'menu' });
        decor(m, dx, 5, 'warm_light', { r: 30, color: 'rgba(255,225,180,.10)' });
        break;
      case 'clinic':
        for (let y = 3; y < h - 2; y++) for (let x = 1; x < w - 1; x++) g[y][x] = 'h';
        rect(g, 2, 3, 4, 2, 'x'); rect(g, w - 6, 3, 4, 2, 'x'); rect(g, 2, h - 5, w - 4, 1, 'u');
        g[6][3] = '4'; g[6][w - 4] = '4'; g[1][5] = '7'; g[1][w - 6] = '7';
        poi(m, 4, 5, 'clinic_bed', 'service', 'Visita medica', 'heal');
        decor(m, 8, 5, 'warm_light', { r: 34, color: 'rgba(235,245,255,.10)' });
        break;
      case 'cave':
        g.forEach(row => row.forEach((c, i) => { if (c === 'h' || c === 'j') row[i] = 'k'; }));
        rect(g, 2, 2, 4, 2, '^'); rect(g, w - 6, 3, 4, 3, '^');
        poi(m, 4, 6, 'lava', 'scenery', 'Roccia incandescente', 'flavor');
        break;
    }
    m.spawn = { x: dx * T, y: (h - 3) * T };
    return m;
  }

  const MAPS = CL.maps = {
    cache: {},
    get(id) {
      if (!id) id = 'napoli';
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
        default:
          console.warn('[CL] Mappa sconosciuta:', id, '- fallback napoli');
          m = this.cache.napoli || napoli();
          this.cache.napoli = m;
          return m;
      }
      m.width = m.w * T; m.height = m.h * T;
      const defaultNames = { napoli: 'Piazza del Gesù Nuovo', costiera: 'Costiera Amalfitana', vesuvio: 'Falde del Vesuvio', pompei: 'Scavi di Pompei', capri: 'Capri', grotta: 'Grotta del Vesuvio', bar: 'Caffè Vittoria', negozio: 'Bottega di Sora Maria', banca: 'Banca di Napoli', clinica: 'Clinica', ufficio: 'Ufficio lavori', casa_nonna: 'Chiesa del Gesù Nuovo', casa_giocatore: 'Casa nuova', appartamento: 'Appartamento a Chiaia', casa_amalfi: 'Casetta ad Amalfi', bottega: 'Bottega di famiglia', souvenir: 'Souvenir degli scavi' };
      m.name = m.name || defaultNames[id] || id;
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
