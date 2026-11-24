/* CAMPANIA LIFE — maps.js
 * Mappe generate proceduralmente in modo deterministico (stessa mappa per tutti i giocatori).
 * Formato: griglia di caratteri, 16px per cella. Vedi art.js per la legenda dei tile.
 */
(function (w) {
  'use strict';
  const CL = w.CL, U = CL.util, T = CL.TILE;

  // Floor tiles A,M,R,h,Z,k,' and gate/door tiles G,Y stay walkable (portals use them).
  // Walls, furniture and street props are solid: U = lampione, E = panchina.
  const SOLID = { T: 1, W: 1, '~': 1, '#': 1, '=': 1, c: 1, o: 1, X: 1, B: 1, '^': 1, P: 1, C: 1, V: 1, O: 1, H: 1, L: 1, F: 1, K: 1, Q: 1, I: 1, J: 1, U: 1, E: 1, j: 1, l: 1, n: 1, q: 1, s: 1, u: 1, v: 1, w: 1, x: 1, y: 1, z: 1, '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1, '8': 1, '9': 1 };

  function blank(x, y, ch) { return Array.from({ length: y }, () => new Array(x).fill(ch)); }
  function setTile(g, x, y, ch) { if (g[y] && g[y][x] !== undefined) g[y][x] = ch; }
  function rect(g, x, y, ww, hh, ch) {
    for (let j = y; j < y + hh; j++) {
      if (!g[j]) continue;
      for (let i = x; i < x + ww; i++) if (g[j][i] !== undefined) setTile(g, i, j, ch);
    }
  }
  function border(g, x, y, ww, hh, ch) {
    for (let i = x; i < x + ww; i++) {
      if (g[y] && g[y][i] !== undefined) setTile(g, i, y, ch);
      const by = y + hh - 1;
      if (g[by] && g[by][i] !== undefined) setTile(g, i, by, ch);
    }
    for (let j = y; j < y + hh; j++) {
      if (!g[j]) continue;
      if (g[j][x] !== undefined) setTile(g, x, j, ch);
      const bx = x + ww - 1;
      if (g[j][bx] !== undefined) setTile(g, bx, j, ch);
    }
  }
  function hline(g, x1, x2, y, ch, th) {
    for (let j = 0; j < (th || 1); j++) {
      const yy = y + j;
      if (!g[yy]) continue;
      for (let i = x1; i <= x2; i++) if (g[yy][i] !== undefined) setTile(g, i, yy, ch);
    }
  }
  function vline(g, x, y1, y2, ch, th) {
    for (let j = 0; j < (th || 1); j++) {
      const xx = x + j;
      for (let i = y1; i <= y2; i++) if (g[i] && g[i][xx] !== undefined) setTile(g, xx, i, ch);
    }
  }
  function scatter(g, ch, n, filter, rng) {
    let tries = 0;
    while (n > 0 && tries++ < 3000) {
      const x = (rng() * g[0].length) | 0, y = (rng() * g.length) | 0;
      if (filter(g[y][x])) { setTile(g, x, y, ch); n--; }
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
    setTile(m.g, dx, dy, 'D');
    portal(m, dx, dy, 1, 1, to, { __useTargetSpawn: true }, label);
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
    for (let y = 3; y < 14; y++) for (let x = 9; x < 31; x++) setTile(g, x, y, 'H');
    // portale centrale e dettagli
    rect(g, 19, 11, 2, 4, 'Y'); rect(g, 19, 10, 2, 1, '#');
    rect(g, 13, 5, 2, 3, 'I'); rect(g, 25, 5, 2, 3, 'I');
    rect(g, 9, 2, 22, 1, '='); rect(g, 8, 14, 24, 1, 'p');

    // Complesso/palazzi nord-est (massa storica)
    rect(g, 34, 2, 20, 12, '#');
    for (let y = 3; y < 13; y++) for (let x = 35; x < 53; x++) {
      if (y === 5 || y === 8 || y === 11) setTile(g, x, y, (x % 4 < 2) ? 'L' : '#');
      else if ((x % 6 === 0) && y > 3) setTile(g, x, y, 'F');
      else setTile(g, x, y, '#');
    }
    rect(g, 43, 12, 2, 2, 'Y'); rect(g, 34, 13, 20, 1, 'p');

    // Palazzi lato sud di Via B. Croce (fronte continuo, accessi commerciali)
    rect(g, 10, 39, 16, 7, '#');
    for (let y = 40; y < 45; y++) for (let x = 11; x < 25; x++) { setTile(g, x, y, (y === 41 || y === 43) ? ((x % 3 === 0) ? 'L' : '#') : '#'); }
    rect(g, 17, 44, 2, 2, 'Y'); // ingresso
    rect(g, 28, 39, 10, 7, '#');
    for (let y = 40; y < 45; y++) for (let x = 29; x < 37; x++) { setTile(g, x, y, (y === 41 || y === 43) ? ((x % 3 === 1) ? 'L' : '#') : '#'); }
    rect(g, 31, 44, 2, 2, 'Y'); // banca ingresso
    rect(g, 40, 39, 8, 7, '#');
    for (let y = 40; y < 45; y++) for (let x = 41; x < 47; x++) { setTile(g, x, y, (y === 41) ? ((x % 2 === 0) ? 'L' : '#') : '#'); }
    rect(g, 43, 44, 2, 2, 'Y'); // bar ingresso
    rect(g, 50, 39, 8, 7, '#');
    for (let y = 40; y < 45; y++) for (let x = 51; x < 57; x++) { setTile(g, x, y, (y === 41 || y === 43) ? ((x % 3 === 0) ? 'L' : '#') : '#'); }
    rect(g, 53, 44, 2, 2, 'Y');

    // Lato est piazza - palazzi e ufficio
    rect(g, 55, 16, 10, 12, '#');
    for (let y = 17; y < 27; y++) for (let x = 56; x < 64; x++) { setTile(g, x, y, (y === 18 || y === 21 || y === 24) ? ((x % 3 === 0) ? 'L' : '#') : '#'); }
    rect(g, 59, 26, 2, 2, 'Y');

    // Edicola/negozio piccolo sul bordo piazza
    rect(g, 38, 34, 3, 3, 'K'); setTile(g, 39, 36, 'p');

    // Arredi urbani: piazza viva e proporzionata
    [[16, 19], [28, 19], [44, 19], [16, 36], [48, 36], [52, 24], [24, 28], [40, 28]].forEach(([x, y]) => { if (g[y] && g[y][x] === 'D') setTile(g, x, y, 'U'); });
    [[22, 23], [46, 23], [22, 33], [46, 33], [30, 23], [38, 33]].forEach(([x, y]) => { if (g[y] && g[y][x] === 'D') setTile(g, x, y, 'E'); });
    // Piccoli mercatini in piazza (decorativi, passaggio libero)
    scatter(g, ',', 30, c => c === 'D', R);
    // Fioriere/confini più leggibili
    [[13,16],[17,16],[29,16],[41,16],[47,16],[51,16],[13,37],[51,37]].forEach(([x,y])=>{ if (g[y] && g[y][x] === 'D') setTile(g, x, y, 'P'); });

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
    decor(m, 23, 41, 'piazza_strip', { w: 120, h: 42, oy: -26 }); // M1 extracted decor
    decor(m, 7, 33, 'ns_palazzo2', { w: 96, h: 164, oy: -148 }); // extracted historic facade
    decor(m, 62, 33, 'ns_palazzo3', { w: 84, h: 168, oy: -152 }); // extracted historic facade

    // Portali interni / servizi (ID preservati)
    portal(m, 19, 14, 2, 1, 'casa_nonna', { x: 14 * T, y: 18 * T + 8 }, 'Ingresso Gesù Nuovo');
    portal(m, 43, 45, 2, 1, 'bar', { __useTargetSpawn: true }, 'Caffè Vittoria');
    portal(m, 39, 36, 1, 1, 'negozio', { __useTargetSpawn: true }, 'Edicola');
    portal(m, 31, 45, 2, 1, 'banca', { __useTargetSpawn: true }, 'Banca');
    portal(m, 17, 45, 2, 1, 'clinica', { __useTargetSpawn: true }, 'Clinica');
    portal(m, 59, 27, 2, 1, 'ufficio', { __useTargetSpawn: true }, 'Ufficio');
    portal(m, 53, 45, 2, 1, 'casa_giocatore', { __useTargetSpawn: true }, 'Agenzia', 'realtor');

    // Collegamenti zona (placeholder sicuri)
    portal(m, 71, 31, 1, 2, 'costiera', { x: 3 * T, y: 14 * T }, 'Verso la Costiera');
    portal(m, 0, 31, 1, 2, 'pompei', { x: 54 * T, y: 30 * T }, 'Verso Toledo');
    portal(m, 12, 47, 2, 1, 'vesuvio', { x: 32 * T, y: 44 * T }, 'Verso sud');

    // POI / landmark
    poi(m, 36 * T, 26 * T, 'guglia', 'landmark', "Guglia dell'Immacolata", 'flavor');
    poi(m, 20 * T, 9 * T, 'gesu', 'landmark', 'Chiesa del Gesù Nuovo', 'flavor');
    poi(m, 63 * T, 32 * T, 'croce', 'landmark', 'Via Benedetto Croce', 'flavor');
    poi(m, 44 * T, 44 * T, 'bar_poi', 'service', 'Caffè Vittoria', 'shop', { shop: 'bar' });
    poi(m, 39 * T, 35 * T, 'edicola_poi', 'service', 'Edicola', 'shop', { shop: 'negozio' });
    poi(m, 32 * T, 44 * T, 'banca_poi', 'service', 'Banca', 'bank');
    poi(m, 62 * T, 42 * T, 'cantiere_job', 'service', 'Cantiere', 'job', { job: 'operaio' });
    // Nuovi interni M1 (struttura base, accessibili)
    building(m, 36, 45, 5, 4, 'pizzeria', 'Entra in pizzeria', 'door');
    building(m, 54, 17, 5, 4, 'metro', 'Entra in metro', 'door');
    poi(m, 38, 49, 'pizzeria_sign', 'sign', 'Pizzeria', 'flavor');
    poi(m, 56, 21, 'metro_sign', 'sign', 'Metro Toledo', 'flavor');
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
    rect(g, 20, 23, 4, 11, 'o'); setTile(g, 21, 33, 'o'); setTile(g, 22, 33, 'o');
    poi(m, 21, 31, 'molo', 'service', 'Molo da pesca', 'fish');
    // scogli
    [[9, 27], [14, 30], [34, 28], [45, 31], [55, 27], [68, 30]].forEach(([x, y]) => { setTile(g, x, y, '^'); });
    // limoneti
    for (let i = 0; i < 30; i++) {
      const x = 2 + (R() * 68 | 0), y = 2 + (R() * 10 | 0);
      if (g[y] && g[y][x] === '.') setTile(g, x, y, 'T');
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
    portal(m, 60, 0, 2, 1, 'bacoli', { __useTargetSpawn: true }, 'Verso Bacoli');
    portal(m, 71, 14, 1, 2, 'salerno', { __useTargetSpawn: true }, 'Verso Salerno');
    poi(m, 0, 14, 'to_napoli', 'sign', '← Napoli', 'travel', { to: 'napoli' });
    poi(m, 60, 1, 'to_bacoli', 'sign', '↑ Bacoli', 'travel', { to: 'bacoli' });
    poi(m, 70, 14, 'to_salerno', 'sign', '→ Salerno', 'travel', { to: 'salerno' });
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
      for (let i = -1; i <= 1; i++) if (g[y][x + i] && g[y][x + i] !== '^') setTile(g, x + i, y, ',');
    }
    // vetta rocciosa
    for (let y = 0; y < 12; y++) for (let x = 0; x < 64; x++) {
      const d = Math.abs(x - 32) / (2 + y * 2.1);
      if (d < 1 && R() > .18) setTile(g, x, y, '^');
    }
    // vigneti
    for (let y = 30; y < 38; y += 2) for (let x = 42; x < 54; x += 2) setTile(g, x, y, 'T');
    // alberi e rocce
    scatter(g, 'T', 90, c => c === '.', R);
    scatter(g, '^', 35, c => c === '.', R);
    // grotta
    setTile(g, 30, 10, 'G');
    portal(m, 30, 10, 1, 1, 'grotta', { x: 8 * T, y: 18 * T }, 'Entra nella grotta');
    poi(m, 30, 10, 'grotta', 'cave', 'Grotta del Vesuvio', 'enter', { to: 'grotta' });
    // collegamenti
    portal(m, 32, 47, 2, 1, 'napoli', { x: 36 * T, y: 36 * T }, 'Scendi a Napoli');
    portal(m, 63, 20, 1, 2, 'costiera', { x: 70 * T, y: 15 * T }, 'Vai in Costiera');
    portal(m, 63, 44, 1, 2, 'caserta', { __useTargetSpawn: true }, 'Verso Caserta');
    poi(m, 32, 46, 'to_napoli', 'sign', 'Napoli ↓', 'travel', { to: 'napoli' });
    poi(m, 62, 44, 'to_caserta', 'sign', '→ Caserta', 'travel', { to: 'caserta' });
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
    setTile(g, 12, 29, 'G');
    // negozio souvenir
    building(m, 40, 20, 7, 4, 'souvenir', 'Entra nel negozio di souvenir', 'shop', { shop: 'pompei' });
    // collegamenti
    portal(m, 0, 30, 1, 2, 'napoli', { x: 60 * T, y: 31 * T }, 'Torna a Napoli');
    portal(m, 55, 20, 1, 2, 'avellino', { __useTargetSpawn: true }, 'Verso Avellino');
    poi(m, 1, 30, 'to_napoli', 'sign', '← Napoli', 'travel', { to: 'napoli' });
    poi(m, 54, 20, 'to_avellino', 'sign', '→ Avellino', 'travel', { to: 'avellino' });
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
    portal(m, 15, 19, 1, 2, 'costiera', { x: 4 * T, y: 18 * T }, 'Torna ad Amalfi');
    m.spawn = { x: 15 * T, y: 17 * T };
    return m;
  }

  /* -------------------------------------------------------------- BACOLI */
  function bacoli() {
    const w = 48, h = 30;
    const m = makeMap('bacoli', 'costiera', w, h, blank(w, h, '.'));
    m.name = 'Bacoli e Baia';
    const R = U.rng(8801), g = m.g;
    scatter(g, ',', 60, c => c === '.', R);
    hline(g, 0, w - 1, 10, 'r', 2); hline(g, 0, w - 1, 9, 'p'); hline(g, 0, w - 1, 12, 'p');
    hline(g, 0, w - 1, 22, 'S', 2); hline(g, 0, w - 1, 25, '~');
    for (let y = 26; y < h; y++) hline(g, 0, w - 1, y, 'W');
    rect(g, 8, 4, 9, 4, 'g'); rect(g, 30, 4, 10, 5, 'g');
    building(m, 18, 14, 6, 4, 'souvenir', 'Souvenir di Baia', 'shop', { shop: 'bacoli' });
    building(m, 36, 14, 6, 4, 'bar', 'Bar sul porto', 'shop', { shop: 'bacoli' });
    poi(m, 12, 7, 'terme_baia', 'landmark', 'Terme di Baia', 'flavor');
    poi(m, 24, 23, 'porto_bacoli', 'service', 'Porto di Bacoli', 'fish');
    portal(m, 4, 0, 2, 1, 'costiera', { __useTargetSpawn: true }, 'Torna in Costiera');
    portal(m, 44, 22, 2, 2, 'napoli', { __useTargetSpawn: true }, 'Battello per Napoli');
    m.spawn = { x: 5 * T, y: 14 * T };
    return m;
  }

  /* ------------------------------------------------------------- SALERNO */
  function salerno() {
    const w = 56, h = 36;
    const m = makeMap('salerno', 'napoli', w, h, blank(w, h, 'p'));
    m.name = 'Salerno - Lungomare';
    const R = U.rng(4410), g = m.g;
    scatter(g, ',', 50, c => c === 'p', R);
    hline(g, 0, w - 1, 18, 'r', 2); hline(g, 0, w - 1, 17, 'p'); hline(g, 0, w - 1, 20, 'p');
    hline(g, 0, w - 1, 30, 'S', 2); hline(g, 0, w - 1, 33, '~');
    for (let y = 34; y < h; y++) hline(g, 0, w - 1, y, 'W');
    rect(g, 6, 4, 14, 8, '#');
    for (let y = 5; y < 11; y++) for (let x = 7; x < 19; x++) if ((x + y) % 3 === 0) setTile(g, x, y, 'L');
    rect(g, 30, 6, 10, 6, '#');
    building(m, 38, 21, 6, 4, 'bar', 'Bar del lungomare', 'shop', { shop: 'salerno' });
    building(m, 12, 21, 6, 4, 'souvenir', 'Bottega salernitana', 'shop', { shop: 'salerno' });
    poi(m, 12, 9, 'arechi', 'landmark', 'Castello di Arechi', 'flavor');
    poi(m, 28, 31, 'lungomare_salerno', 'landmark', 'Lungomare di Salerno', 'flavor');
    portal(m, 54, 17, 2, 2, 'costiera', { __useTargetSpawn: true }, 'Torna in Costiera');
    portal(m, 2, 18, 2, 2, 'avellino', { __useTargetSpawn: true }, 'Verso Avellino');
    m.spawn = { x: 4 * T, y: 19 * T };
    return m;
  }

  /* ------------------------------------------------------------ AVELLINO */
  function avellino() {
    const w = 48, h = 32;
    const m = makeMap('avellino', 'vesuvio', w, h, blank(w, h, '.'));
    m.name = 'Avellino - Colline Irpine';
    const R = U.rng(7712), g = m.g;
    scatter(g, ',', 80, c => c === '.', R);
    scatter(g, 'T', 45, c => c === '.', R);
    hline(g, 0, w - 1, 16, 'r', 2); hline(g, 0, w - 1, 15, 'p'); hline(g, 0, w - 1, 18, 'p');
    vline(g, 24, 0, h - 1, 'r', 2);
    rect(g, 8, 5, 10, 5, '#'); rect(g, 32, 6, 9, 5, '#');
    building(m, 18, 20, 6, 4, 'negozio', 'Negozio di Avellino', 'shop', { shop: 'avellino' });
    poi(m, 13, 9, 'irpinia', 'landmark', 'Centro storico irpino', 'flavor');
    poi(m, 36, 9, 'vigneti_irpini', 'landmark', 'Vigneti irpini', 'flavor');
    portal(m, 0, 16, 2, 2, 'pompei', { __useTargetSpawn: true }, 'Torna a Pompei');
    portal(m, 46, 16, 2, 2, 'salerno', { __useTargetSpawn: true }, 'Verso Salerno');
    portal(m, 24, 30, 2, 2, 'caserta', { __useTargetSpawn: true }, 'Verso Caserta');
    m.spawn = { x: 3 * T, y: 17 * T };
    return m;
  }

  /* ------------------------------------------------------------- CASERTA */
  function caserta() {
    const w = 60, h = 40;
    const m = makeMap('caserta', 'napoli', w, h, blank(w, h, 'p'));
    m.name = 'Caserta - Reggia';
    const R = U.rng(2209), g = m.g;
    scatter(g, ',', 60, c => c === 'p', R);
    hline(g, 0, w - 1, 32, 'r', 2); hline(g, 0, w - 1, 31, 'p'); hline(g, 0, w - 1, 34, 'p');
    vline(g, 30, 0, h - 1, 'D', 2);
    rect(g, 18, 4, 24, 14, '#');
    for (let y = 5; y < 17; y++) for (let x = 19; x < 41; x++) if ((x + y) % 4 === 0) setTile(g, x, y, 'L');
    rect(g, 28, 18, 4, 2, 'Y');
    building(m, 8, 22, 6, 4, 'bar', 'Bar della Reggia', 'shop', { shop: 'caserta' });
    building(m, 46, 22, 6, 4, 'souvenir', 'Souvenir della Reggia', 'shop', { shop: 'caserta' });
    poi(m, 30, 10, 'reggia', 'landmark', 'Reggia di Caserta', 'flavor');
    poi(m, 30, 27, 'viale_re', 'landmark', 'Viale del Re', 'flavor');
    portal(m, 2, 32, 2, 2, 'vesuvio', { __useTargetSpawn: true }, 'Torna al Vesuvio');
    portal(m, 56, 32, 2, 2, 'avellino', { __useTargetSpawn: true }, 'Verso Avellino');
    m.spawn = { x: 30 * T, y: 36 * T };
    return m;
  }

  /* ---------------------------------------------------------- INTERNI */
  function place(g, x, y, ch) { setTile(g, x, y, ch); }
  function fillRect(g, x, y, ww, hh, ch) { rect(g, x, y, ww, hh, ch); }

  function churchGesu() {
    const w = 28, h = 22;
    const m = makeMap('casa_nonna', 'interno', w, h, blank(w, h, 'A'));
    m.name = 'Chiesa del Gesù Nuovo';
    const g = m.g;
    // muri perimetrali
    for (let x = 0; x < w; x++) { setTile(g, x, 0, '#'); setTile(g, x, h - 1, '#'); }
    for (let y = 0; y < h; y++) { setTile(g, 0, y, '#'); setTile(g, w - 1, y, '#'); }
    // parete interna/abside
    for (let x = 1; x < w - 1; x++) setTile(g, x, 1, 'j');
    for (let x = 2; x < w - 2; x++) setTile(g, x, 2, 'j');
    // colonne navata
    for (const yy of [6, 10, 14]) { setTile(g, 5, yy, 'l'); setTile(g, 9, yy, 'l'); setTile(g, 18, yy, 'l'); setTile(g, 22, yy, 'l'); }
    // cappelle laterali (muri)
    for (let y = 4; y < 18; y++) { setTile(g, 3, y, (y % 4 === 0) ? 'A' : 'j'); setTile(g, w - 4, y, (y % 4 === 0) ? 'A' : 'j'); }
    for (const yy of [5, 9, 13]) { setTile(g, 1, yy, '6'); setTile(g, 2, yy, '5'); setTile(g, w - 2, yy, '6'); setTile(g, w - 3, yy, '5'); }
    // navata centrale tappeto rosso (corridoio centrale continuo fino all'altare)
    for (let y = 4; y <= 20; y++) { setTile(g, 13, y, 'R'); setTile(g, 14, y, 'R'); }
    // tappeto ingresso/porta: zona libera garantita (ampia, davanti alla porta)
    for (let y = 18; y <= 20; y++) for (let x = 12; x <= 15; x++) setTile(g, x, y, 'R');
    // panche (mai sul corridoio centrale 13-14)
    for (const yy of [7, 9, 11, 13, 15]) {
      for (let x = 6; x <= 8; x++) setTile(g, x, yy, 'n');
      for (let x = 19; x <= 21; x++) setTile(g, x, yy, 'n');
      setTile(g, 11, yy, 'n'); setTile(g, 12, yy, 'n'); setTile(g, 15, yy, 'n'); setTile(g, 16, yy, 'n');
    }
    // altare maggiore
    for (let x = 11; x <= 16; x++) setTile(g, x, 3, 'q');
    setTile(g, 12, 4, '5'); setTile(g, 15, 4, '5'); setTile(g, 13, 3, '6'); setTile(g, 14, 3, '6');
    // pavimento decorato presbiterio
    for (let y = 3; y <= 5; y++) for (let x = 10; x <= 17; x++) if (g[y] && g[y][x] === 'A') setTile(g, x, y, 'M');
    // ingressi laterali visivi / confessionali
    setTile(g, 1, 17, '8'); setTile(g, w - 2, 17, '8');
    // candele e piante (fuori dal corridoio centrale ingresso)
    setTile(g, 4, 18, '5'); setTile(g, 23, 18, '5'); setTile(g, 6, 16, '9'); setTile(g, 21, 16, '9');
    // porta uscita sulla parete sud, tappeto davanti
    const dx = 14, dy = h - 1;
    setTile(g, dx, dy, 'D'); setTile(g, 13, dy, '#'); setTile(g, 15, dy, '#');
    for (let y = 18; y <= 20; y++) for (let x = 12; x <= 15; x++) setTile(g, x, y, 'R');
    // Portale uscita sul tappeto, in fondo vicino alla porta (riga 20), NON sulla riga spawn.
    portal(m, 13, 20, 2, 1, 'prev', { x: 20 * T, y: 16 * T }, 'Esci in piazza');
    poi(m, dx, 20, 'exit', 'door', 'Esci dalla chiesa', 'exit');
    poi(m, 13, 4, 'altar', 'scenery', 'Altare maggiore', 'flavor');
    poi(m, 7, 8, 'pew', 'scenery', 'Panca — siediti un momento', 'rest_pew');
    poi(m, 2, 6, 'chapel_l', 'scenery', 'Cappella laterale', 'flavor');
    poi(m, 25, 6, 'chapel_r', 'scenery', 'Cappella laterale', 'flavor');
    // decor estratti da reference sheet (M1) — dimensionati e posizionati, non sfondo fisso
    decor(m, 11, 4, 'church_altar', { w: 96, h: 118, oy: -102 });
    decor(m, 5, 11, 'church_pew', { w: 54, h: 24, oy: -8 }); decor(m, 9, 11, 'church_pew', { w: 54, h: 24, oy: -8 });
    decor(m, 16, 11, 'church_pew', { w: 54, h: 24, oy: -8 }); decor(m, 20, 11, 'church_pew', { w: 54, h: 24, oy: -8 });
    decor(m, 5, 14, 'church_pew', { w: 54, h: 24, oy: -8 }); decor(m, 9, 14, 'church_pew', { w: 54, h: 24, oy: -8 });
    decor(m, 16, 14, 'church_pew', { w: 54, h: 24, oy: -8 }); decor(m, 20, 14, 'church_pew', { w: 54, h: 24, oy: -8 });
    decor(m, 1, 9, 'church_statue', { w: 28, h: 78, oy: -62 }); decor(m, 25, 9, 'church_statue', { w: 28, h: 78, oy: -62 });
    decor(m, 3, 5, 'church_painting1', { w: 56, h: 40, oy: -24 }); decor(m, 22, 5, 'church_painting1', { w: 56, h: 40, oy: -24 });
    decor(m, 7, 5, 'church_candle', { w: 12, h: 26, oy: -10 }); decor(m, 20, 5, 'church_candle', { w: 12, h: 26, oy: -10 });
    // luci calde
    decor(m, 7, 4, 'candle_glow', { h: 8 }); decor(m, 20, 4, 'candle_glow', { h: 8 });
    decor(m, 4, 9, 'candle_glow', { h: 8 }); decor(m, 23, 9, 'candle_glow', { h: 8 });
    decor(m, 14, 2, 'window_light', { w: 16, h: 10, color: 'rgba(255,210,140,.22)' });
    // Spawn ESATTO: centro tappeto rosso, parte inferiore vicino ingresso, ma sopra portale uscita.
    // Tappeto centrale: colonne 13-14 (R). Riga 18 = 2 celle sopra portale uscita riga 20, libera.
    m.spawn = { x: 14 * T, y: 18 * T + 8 }; // centro tappeto rosso (tra tile 13-14), riga 18
    m.spawnDir = 'up';
    m.exitSpawn = { map:'napoli', x: 20 * T, y: 16 * T };
    return m;
  }

  function barInterior() {
    const w = 20, h = 14;
    const m = makeMap('bar', 'interno', w, h, blank(w, h, 'h'));
    m.name = 'Caffè Vittoria';
    const g = m.g;
    for (let x = 0; x < w; x++) { setTile(g, x, 0, '#'); setTile(g, x, h - 1, '#'); }
    for (let y = 0; y < h; y++) { setTile(g, 0, y, '#'); setTile(g, w - 1, y, '#'); }
    for (let x = 1; x < w - 1; x++) { setTile(g, x, 1, 'j'); setTile(g, x, 2, 'j'); }
    for (let y = 7; y <= 12; y++) for (let x = 2; x <= 17; x++) setTile(g, x, y, 'Z');
    for (let x = 2; x <= 10; x++) setTile(g, x, 4, 'u');
    setTile(g, 3, 3, '0'); setTile(g, 5, 3, '3'); setTile(g, 7, 3, 'y'); setTile(g, 9, 3, '0');
    setTile(g, 4, 5, 'w'); setTile(g, 8, 5, 'w');
    setTile(g, 2, 2, 's'); setTile(g, 4, 2, 's'); setTile(g, 6, 2, 's'); setTile(g, 8, 2, 's'); setTile(g, 10, 2, 's');
    const tables = [[4,8],[8,8],[13,8],[15,5],[4,11],[9,11],[14,11]];
    tables.forEach(([tx,ty]) => { setTile(g, tx, ty, 'v'); if (g[ty-1]) setTile(g, tx, ty-1, 'w'); if (g[ty+1]) setTile(g, tx, ty+1, 'w'); if (g[ty][tx-1]) setTile(g, tx-1, ty, 'w'); if (g[ty][tx+1]) setTile(g, tx+1, ty, 'w'); });
    setTile(g, 14, 1, '7'); setTile(g, 16, 1, '7'); setTile(g, 17, 2, '9'); setTile(g, 17, 11, '9'); setTile(g, 2, 11, '9');
    const dx = 10, dy = h - 1;
    setTile(g, dx, dy, 'D');
    portal(m, dx, dy, 1, 1, 'prev', { x: 44 * T, y: 46 * T }, 'Esci');
    poi(m, dx, dy, 'exit', 'door', 'Esci', 'exit');
    poi(m, 6, 5, 'bar_counter', 'service', 'Bancone — ordina', 'shop', { shop: 'bar' });
    poi(m, 4, 9, 'seat', 'furniture', 'Siediti e mangia', 'eat_bar');
    poi(m, 13, 9, 'seat2', 'furniture', 'Siediti e mangia', 'eat_bar');
    decor(m, 2, 2, 'bar_shelf', { w: 132, h: 34, oy: -18 });
    decor(m, 2, 5, 'bar_counter', { w: 150, h: 38, oy: -22 });
    decor(m, 4, 9, 'bar_table', { w: 48, h: 20, oy: -4 }); decor(m, 13, 9, 'bar_table', { w: 48, h: 20, oy: -4 });
    decor(m, 14, 6, 'bar_detail', { w: 48, h: 62, oy: -46 });
    decor(m, 3, 3, 'warm_light', { r: 28, color: 'rgba(255,190,120,.16)' });
    decor(m, 15, 6, 'warm_light', { r: 24, color: 'rgba(255,190,120,.14)' });
    decor(m, 10, 10, 'warm_light', { r: 24, color: 'rgba(255,190,120,.12)' });
    decor(m, 6, 3, 'window_light', { w: 12, h: 8, color: 'rgba(255,220,160,.10)' });
    for(let yy=h-5;yy<=h-2;yy++) for(let xx=dx-1;xx<=dx+1;xx++) setTile(g, xx, yy, 'Z');
    m.spawn = { x: dx * T, y: (h - 3) * T };
    m.spawnDir = 'up';
    m.exitSpawn = { map:'napoli', x: 44 * T, y: 46 * T };
    return m;
  }

  function pizzeriaInterior() {
    const w = 22, h = 15;
    const m = makeMap('pizzeria', 'interno', w, h, blank(w, h, 'h'));
    m.name = 'Pizzeria Da Michele';
    const g = m.g;
    for (let x=0;x<w;x++){ setTile(g, x, 0, '#'); setTile(g, x, h-1, '#'); }
    for (let y=0;y<h;y++){ setTile(g, 0, y, '#'); setTile(g, w-1, y, '#'); }
    for (let x=1;x<w-1;x++){ setTile(g, x, 1, 'j'); setTile(g, x, 2, 'j'); }
    // sala clienti
    for (let y=8;y<=13;y++) for (let x=2;x<=20;x++) setTile(g, x, y, 'Z');
    // cucina separata
    for (let y=3;y<=6;y++) for (let x=2;x<=9;x++) setTile(g, x, y, 'h');
    for (let y=3;y<=6;y++) setTile(g, 10, y, '#'); // parete divisoria
    setTile(g, 10, 6, 'M'); // passaggio cucina
    // forno / bancone cucina
    for (let x=2;x<=8;x++) setTile(g, x, 4, 'u');
    setTile(g, 3, 3, '0'); setTile(g, 5, 3, 'y'); setTile(g, 7, 3, '0');
    // tavoli sala
    [[4,10],[8,10],[13,10],[17,10],[6,12],[12,12],[17,12]].forEach(([tx,ty])=>{ setTile(g, tx, ty, 'v'); if(g[ty-1]) setTile(g, tx, ty-1, 'w'); if(g[ty+1]) setTile(g, tx, ty+1, 'w'); if(g[ty][tx-1]) setTile(g, tx-1, ty, 'w'); if(g[ty][tx+1]) setTile(g, tx+1, ty, 'w'); });
    setTile(g, 16, 1, '7'); setTile(g, 18, 1, '7'); setTile(g, 20, 2, '9');
    const dx=11, dy=h-1; setTile(g, dx, dy, 'D');
    portal(m, dx, dy, 1, 1, 'prev', { x: 38 * T, y: 47 * T }, 'Esci');
    poi(m, dx, dy, 'exit', 'door', 'Esci', 'exit');
    poi(m, 5, 5, 'pizza_counter', 'service', 'Bancone pizzeria — ordina', 'order_pizza');
    poi(m, 7, 5, 'pizza_shop', 'service', 'Menu pizzeria', 'shop', { shop: 'pizzeria' });
    poi(m, 4, 11, 'seat_p', 'furniture', 'Siediti e mangia', 'eat_bar');
    poi(m, 13, 11, 'seat_p2', 'furniture', 'Siediti e mangia', 'eat_bar');
    decor(m, 2, 5, 'pizzeria_oven', { w: 96, h: 110, oy: -94 });
    decor(m, 11, 6, 'pizzeria_counter', { w: 110, h: 52, oy: -36 });
    decor(m, 13, 10, 'pizzeria_table', { w: 60, h: 34, oy: -18 }); decor(m, 17, 10, 'pizzeria_table', { w: 60, h: 34, oy: -18 });
    decor(m, 4, 3, 'warm_light', { r: 32, color:'rgba(255,180,110,.16)' });
    decor(m, 15, 9, 'warm_light', { r: 28, color:'rgba(255,180,110,.12)' });
    for(let yy=h-5;yy<=h-2;yy++) for(let xx=dx-1;xx<=dx+1;xx++) setTile(g, xx, yy, 'Z');
    m.spawn = { x: dx*T, y:(h-3)*T }; m.spawnDir='up';
    m.exitSpawn = { map:'napoli', x: 38 * T, y: 47 * T };
    return m;
  }

  function metroInterior() {
    const w=24, h=16;
    const m=makeMap('metro','interno',w,h,blank(w,h,'M'));
    m.name='Metro Toledo - Atrio';
    const g=m.g;
    for(let x=0;x<w;x++){setTile(g, x, 0, '#'); setTile(g, x, h-1, '#');}
    for(let y=0;y<h;y++){setTile(g, 0, y, '#'); setTile(g, w-1, y, '#');}
    for(let x=1;x<w-1;x++){setTile(g, x, 1, 'j'); setTile(g, x, 2, 'j');}
    for(let y=3;y<=13;y++) for(let x=1;x<=22;x++) setTile(g, x, y, 'M');
    // biglietteria / tornelli / corridoio / banchina
    for(let x=3;x<=7;x++) setTile(g, x, 4, 'u');
    setTile(g, 4, 5, 'w'); setTile(g, 6, 5, 'w');
    for(let x=6;x<=17;x++) setTile(g, x, 7, (x===9||x===12||x===15)?'M':'u'); // tornelli
    for(let y=8;y<=11;y++){ setTile(g, 11, y, 'M'); setTile(g, 12, y, 'M'); }
    for(let x=2;x<=21;x++) setTile(g, x, 13, 'h'); // banchina
    for(let x=2;x<=21;x++) setTile(g, x, 12, 'M');
    setTile(g, 6, 1, '7'); setTile(g, 17, 1, '7');
    const dx=12, dy=h-1; setTile(g, dx, dy, 'D');
    portal(m,dx,dy,1,1,'prev',{x:56*T,y:29*T},'Esci');
    poi(m,dx,dy,'exit','door','Esci dalla metro','exit');
    poi(m,5,5,'metro_ticket','service','Biglietteria — compra biglietto','metro_ticket');
    poi(m,12,8,'metro_gate','service','Tornelli — viaggia','metro_travel',{to:'metro2'});
    poi(m,12,13,'metro_platform','service','Banchina linea 1','flavor');
    decor(m,2,4,'metro_hall',{w:180,h:90,oy:-74});
    decor(m,5,8,'metro_gate',{w:150,h:48,oy:-32});
    decor(m,2,13,'metro_platform',{w:320,h:44,oy:-28});
    decor(m,12,4,'window_light',{w:14,h:10,color:'rgba(180,220,255,.12)'});
    m.spawn={x:dx*T,y:(h-3)*T}; m.spawnDir='up';
    m.exitSpawn = { map:'napoli', x: 56 * T, y: 29 * T };
    return m;
  }

  function metro2Interior() {
    const w=24, h=16;
    const m=makeMap('metro2','interno',w,h,blank(w,h,'M'));
    m.name='Metro Dante - Banchina';
    const g=m.g;
    for(let x=0;x<w;x++){setTile(g, x, 0, '#'); setTile(g, x, h-1, '#');}
    for(let y=0;y<h;y++){setTile(g, 0, y, '#'); setTile(g, w-1, y, '#');}
    for(let x=1;x<w-1;x++){setTile(g, x, 1, 'j'); setTile(g, x, 2, 'j');}
    for(let y=3;y<=13;y++) for(let x=1;x<=22;x++) setTile(g, x, y, 'M');
    for(let x=3;x<=7;x++) setTile(g, x, 4, 'u');
    for(let x=6;x<=17;x++) setTile(g, x, 7, (x===9||x===12||x===15)?'M':'u');
    for(let y=8;y<=11;y++){ setTile(g, 11, y, 'M'); setTile(g, 12, y, 'M'); }
    for(let x=2;x<=21;x++) setTile(g, x, 13, 'h');
    for(let x=2;x<=21;x++) setTile(g, x, 12, 'M');
    const dx=12, dy=h-1; setTile(g, dx, dy, 'D');
    portal(m,dx,dy,1,1,'napoli',{x:40*T,y:30*T},'Esci in superficie');
    poi(m,dx,dy,'exit','door','Esci dalla metro','exit');
    poi(m,5,5,'metro_ticket2','service','Biglietteria','metro_ticket');
    poi(m,12,8,'metro_gate2','service','Tornelli — torna a Toledo','metro_travel',{to:'metro'});
    poi(m,12,13,'metro_platform2','service','Banchina linea 1','flavor');
    decor(m,2,4,'metro_hall',{w:180,h:90,oy:-74});
    decor(m,5,8,'metro_gate',{w:150,h:48,oy:-32});
    decor(m,2,13,'metro_platform',{w:320,h:44,oy:-28});
    m.spawn={x:dx*T,y:(h-3)*T}; m.spawnDir='up';
    m.exitSpawn = { map:'napoli', x: 40 * T, y: 30 * T };
    return m;
  }

  function interior(id, kind, w, h, decorate) {
    if (id === 'casa_nonna') return churchGesu();
    if (id === 'bar') return barInterior();
    if (id === 'pizzeria') return pizzeriaInterior();
    if (id === 'metro') return metroInterior();
    const m = makeMap(id, 'interno', w, h, blank(w, h, kind === 'cave' ? 'k' : 'h'));
    const g = m.g;
    for (let x = 0; x < w; x++) { setTile(g, x, 0, '#'); setTile(g, x, h - 1, '#'); }
    for (let y = 0; y < h; y++) { setTile(g, 0, y, '#'); setTile(g, w - 1, y, '#'); }
    for (let x = 1; x < w - 1; x++) { setTile(g, x, 1, 'j'); setTile(g, x, 2, kind === 'cave' ? 'k' : 'j'); }
    const dx = w >> 1, dy = h - 1;
    setTile(g, dx, dy, 'D');
    portal(m, dx, dy, 1, 1, 'prev', { x: dx * T, y: (h - 2) * T }, 'Esci');
    poi(m, dx, dy, 'exit', 'door', 'Esci', 'exit');
    if (decorate) decorate(m, g);
    switch (kind) {
      case 'home':
        for (let y = 3; y < h - 2; y++) for (let x = 1; x < w - 1; x++) setTile(g, x, y, 'h');
        rect(g, 2, 3, 4, 2, 'x'); rect(g, 2, 6, 2, 2, '4');
        rect(g, w - 5, 3, 3, 2, 'y'); rect(g, w - 4, 6, 2, 1, 'z');
        rect(g, 3, h - 5, 3, 2, 'v'); setTile(g, 4, h - 6, 'w'); setTile(g, 4, h - 3, 'w');
        rect(g, w - 6, h - 5, 3, 1, '1'); setTile(g, w - 5, h - 6, '2'); setTile(g, w - 5, h - 4, 'w');
        setTile(g, 3, 1, '7'); setTile(g, w - 4, 1, '7'); setTile(g, w - 2, 3, '9');
        poi(m, 3, 4, 'bed', 'furniture', 'Letto — dormi', 'sleep');
        poi(m, w - 4, 4, 'stove', 'furniture', 'Cucina — prepara qualcosa', 'cook');
        poi(m, w - 5, h - 5, 'pc', 'furniture', 'Computer — cerca lavoro', 'jobs');
        poi(m, 4, h - 5, 'table', 'furniture', 'Tavolo — mangia', 'eat_home');
        decor(m, 4, 4, 'warm_light', { r: 26, color: 'rgba(255,200,140,.12)' });
        decor(m, w - 4, 4, 'warm_light', { r: 22, color: 'rgba(255,210,150,.12)' });
        break;
      case 'shop':
        for (let y = 3; y < h - 2; y++) for (let x = 1; x < w - 1; x++) setTile(g, x, y, 'h');
        for (let x = 2; x < w - 2; x += 3) { setTile(g, x, 3, 's'); setTile(g, x, 6, 's'); }
        rect(g, 2, h - 5, w - 4, 1, 'u'); setTile(g, dx, h - 6, '3');
        setTile(g, 3, 1, '7'); setTile(g, w - 4, 1, '7');
        poi(m, dx, h - 5, 'counter', 'service', 'Bancone — acquista', 'shop', { shop: id === 'souvenir' ? 'pompei' : id });
        decor(m, dx, 5, 'warm_light', { r: 30, color: 'rgba(255,210,150,.12)' });
        break;
      case 'office':
        for (let y = 3; y < h - 2; y++) for (let x = 1; x < w - 1; x++) setTile(g, x, y, 'h');
        rect(g, 3, 4, 4, 1, '1'); setTile(g, 4, 3, '2'); setTile(g, 4, 5, 'w');
        rect(g, w - 8, 4, 4, 1, '1'); setTile(g, w - 7, 3, '2'); setTile(g, w - 7, 5, 'w');
        rect(g, 3, 8, 4, 1, '1'); setTile(g, 4, 7, '2'); setTile(g, 4, 9, 'w');
        setTile(g, w - 3, 3, '4'); setTile(g, w - 3, 7, '4'); setTile(g, 4, 1, '7'); setTile(g, w - 5, 1, '7');
        poi(m, 5, 5, 'desk', 'service', 'Sportello — lavori', 'jobs');
        decor(m, 8, 5, 'warm_light', { r: 34, color: 'rgba(255,220,170,.10)' });
        break;
      case 'bank':
        for (let y = 3; y < h - 2; y++) for (let x = 1; x < w - 1; x++) setTile(g, x, y, 'M');
        rect(g, 2, h - 5, w - 4, 1, 'u'); setTile(g, dx, h - 6, '3');
        setTile(g, 3, 4, '1'); setTile(g, 3, 3, '2'); setTile(g, w - 4, 4, '1'); setTile(g, w - 4, 3, '2');
        setTile(g, 4, 1, '7'); setTile(g, w - 5, 1, '7');
        poi(m, dx, h - 5, 'bank_counter', 'service', 'Sportello bancario', 'bank', { mode: 'menu' });
        decor(m, dx, 5, 'warm_light', { r: 30, color: 'rgba(255,225,180,.10)' });
        break;
      case 'clinic':
        for (let y = 3; y < h - 2; y++) for (let x = 1; x < w - 1; x++) setTile(g, x, y, 'h');
        rect(g, 2, 3, 4, 2, 'x'); rect(g, w - 6, 3, 4, 2, 'x'); rect(g, 2, h - 5, w - 4, 1, 'u');
        setTile(g, 3, 6, '4'); setTile(g, w - 4, 6, '4'); setTile(g, 5, 1, '7'); setTile(g, w - 6, 1, '7');
        poi(m, 4, 5, 'clinic_bed', 'service', 'Visita medica', 'heal');
        decor(m, 8, 5, 'warm_light', { r: 34, color: 'rgba(235,245,255,.10)' });
        break;
      case 'cave':
        g.forEach(row => row.forEach((c, i) => { if (c === 'h' || c === 'j') row[i] = 'k'; }));
        rect(g, 2, 2, 4, 2, '^'); rect(g, w - 6, 3, 4, 3, '^');
        poi(m, 4, 6, 'lava', 'scenery', 'Roccia incandescente', 'flavor');
        break;
    }
    for(let yy=h-4;yy<=h-2;yy++) for(let xx=dx-1;xx<=dx+1;xx++) setTile(g, xx, yy, kind==='cave'?'k':'h');
    m.spawn = { x: dx * T, y: (h - 3) * T };
    const exitSpawns = {
      negozio:{map:'napoli',x:39*T,y:38*T}, banca:{map:'napoli',x:31*T,y:47*T}, clinica:{map:'napoli',x:17*T,y:47*T},
      ufficio:{map:'napoli',x:59*T,y:29*T}, casa_giocatore:{map:'napoli',x:53*T,y:47*T},
      appartamento:{map:'napoli',x:53*T,y:47*T}, casa_amalfi:{map:'costiera',x:9*T,y:14*T},
      bottega:{map:'napoli',x:39*T,y:38*T}, souvenir:null, grotta:{map:'vesuvio',x:30*T,y:12*T}
    };
    if (exitSpawns[id]) m.exitSpawn = exitSpawns[id];
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
        case 'bacoli': m = bacoli(); break;
        case 'salerno': m = salerno(); break;
        case 'avellino': m = avellino(); break;
        case 'caserta': m = caserta(); break;
        case 'casa_nonna': m = interior(id, 'home', 16, 12); break;
        case 'casa_giocatore': m = interior(id, 'home', 16, 12); break;
        case 'appartamento': m = interior(id, 'home', 20, 14, mm => { setTile(mm.g, 10, 3, 'V'); setTile(mm.g, 15, 4, 'P'); setTile(mm.g, 4, 4, 'P'); }); break;
        case 'casa_amalfi': m = interior(id, 'home', 18, 13, mm => { setTile(mm.g, 3, 3, 'P'); setTile(mm.g, 14, 3, 'P'); }); break;
        case 'bottega': m = interior(id, 'shop', 18, 12); break;
        case 'souvenir': m = interior(id, 'shop', 16, 11); break;
        case 'bar': m = barInterior(); break;
        case 'pizzeria': m = pizzeriaInterior(); break;
        case 'metro': m = metroInterior(); break;
        case 'metro2': m = metro2Interior(); break;
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
      const defaultNames = { napoli: 'Piazza del Gesù Nuovo', costiera: 'Costiera Amalfitana', vesuvio: 'Falde del Vesuvio', pompei: 'Scavi di Pompei', capri: 'Capri', bacoli: 'Bacoli e Baia', salerno: 'Salerno - Lungomare', avellino: 'Avellino - Colline Irpine', caserta: 'Caserta - Reggia', grotta: 'Grotta del Vesuvio', bar: 'Caffè Vittoria', pizzeria:'Pizzeria Da Michele', metro:'Metro Toledo - Atrio', negozio: 'Bottega di Sora Maria', banca: 'Banca di Napoli', clinica: 'Clinica', ufficio: 'Ufficio lavori', casa_nonna: 'Chiesa del Gesù Nuovo', casa_giocatore: 'Casa nuova', appartamento: 'Appartamento a Chiaia', casa_amalfi: 'Casetta ad Amalfi', bottega: 'Bottega di famiglia', souvenir: 'Souvenir degli scavi' };
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
