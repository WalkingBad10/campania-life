/* CAMPANIA LIFE — art.js
 * Pixel art originale generata a runtime: zero asset esterni, nessun copyright di terze parti.
 * Ogni sprite è disegnato su canvas 1x e scalato con imageSmoothingEnabled=false.
 */
(function (w) {
  'use strict';
  const CL = w.CL, U = CL.util, D = CL.data;
  const P = {
    grass: '#79a655', grassD: '#668f46', grassL: '#93bd63',
    road: '#555b60', roadL: '#676d70', line: '#ded7bd',
    pave: '#b8b1a0', paveD: '#9c9585', paveL: '#cec7b5',
    water: '#2c7a9c', waterL: '#3d94b2', foam: '#a6d9dc',
    sand: '#e3cd99', sandD: '#d2b982',
    wall: '#bf7350', wallD: '#96583c', wallL: '#d99068',
    roof: '#ab4a39', roofD: '#87392d', roofL: '#c85c42',
    floor: '#d8c7a6', floorD: '#c4b190', floorL: '#e6d8b9',
    wood: '#8b6244', woodD: '#65432e', woodL: '#a97a53',
    stone: '#7c7b71', stoneL: '#96958a', stoneD: '#5e5e57',
    cave: '#3b3640', caveL: '#4b4550', lava: '#e8613c', lavaL: '#f7a33d',
    dark: '#241f26', white: '#f5f0df', ink: '#1b2730'
  };

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = U.clamp(r, 0, 255); g = U.clamp(g, 0, 255); b = U.clamp(b, 0, 255);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  function cv(wid, hei) { const c = document.createElement('canvas'); c.width = wid; c.height = hei; return c; }
  function ctx(c) { const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return x; }
  function px(x, a, b, wid, hei, col) { x.fillStyle = col; x.fillRect(a | 0, b | 0, wid | 0, hei | 0); }
  function ell(x, cx, cy, rx, ry, col) {
    x.fillStyle = col;
    for (let yy = -Math.ceil(ry); yy <= ry; yy++) for (let xx = -Math.ceil(rx); xx <= rx; xx++) {
      if ((xx * xx) / (rx * rx) + (yy * yy) / (ry * ry) <= 1) x.fillRect(Math.round(cx + xx), Math.round(cy + yy), 1, 1);
    }
  }
  function outline(x, cx, cy, rx, ry, col) {
    ell(x, cx, cy, rx + 1, ry + 1, col || P.dark);
  }

  const ART = CL.art = {
    P, ready: false, tiles: {}, cache: {}, images: {}, _imgReady: false,
    init() { if (this.ready) return; this.ready = true; this.buildTiles(); this.loadAssets(); },
    assetUrl(name) {
      const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '/';
      return base.replace(/\/?$/, '/') + 'assets/pixel/' + name;
    },
    backdropFor(mapId) {
      const key = {
        bar: 'm1_bg_bar', casa_nonna: 'm1_bg_church',
        pizzeria: 'm1_bg_pizzeria', metro: 'm1_bg_metro', metro2: 'm1_bg_metro'
      }[mapId];
      return key ? this.images[key] : null;
    },
    loadAssets() {
      if (this._imgReady) return this.imagesReady;
      this.imagesLoaded = false;
      const files = {
        gesu: 'gesu-facade.png', guglia: 'guglia.png', campanile: 'campanile.png',
        palazzo_ne: 'palazzo-ne.png', palazzo_sw: 'palazzo-sw.png', palazzo_banca: 'palazzo-banca.png',
        palazzo_bar: 'palazzo-bar.png', palazzo_se: 'palazzo-se.png', palazzo_e: 'palazzo-e.png',
        lamp: 'prop-lamp.png', bench: 'prop-bench.png', edicola: 'prop-edicola.png', plant: 'prop-plant.png',
        cart: 'prop-cart.png', sign: 'prop-sign.png', table_out: 'prop-table.png', chair_out: 'prop-chair.png',
        // M1 extracted assets (from user-provided reference sheets)
        m1_gesu_ref: 'm1-gesu_facade_ref.png',
        m1_piazza_a: 'm1-piazza_palazzo_a.png', m1_piazza_b: 'm1-piazza_palazzo_b.png', m1_piazza_c: 'm1-piazza_palazzo_c.png',
        m1_piazza_d: 'm1-piazza_building_d.png', m1_piazza_e: 'm1-piazza_building_e.png', m1_piazza_f: 'm1-piazza_building_f.png',
        m1_piazza_strip: 'm1-piazza_strip.png',
        m1_church_altar: 'm1-church_altar.png', m1_church_altar2: 'm1-church_altar2.png',
        m1_church_painting1: 'm1-church_painting1.png', m1_church_column: 'm1-church_column.png',
        m1_church_arch: 'm1-church_arch.png', m1_church_pew: 'm1-church_pew.png',
        m1_church_candle: 'm1-church_candle.png', m1_church_statue: 'm1-church_statue.png',
        m1_bar_counter: 'm1-bar_counter.png', m1_bar_shelf: 'm1-bar_shelf.png', m1_bar_table: 'm1-bar_table.png', m1_bar_detail: 'm1-bar_detail.png',
        m1_ns_palazzo1: 'm1-ns-palazzo1.png', m1_ns_palazzo2: 'm1-ns-palazzo2.png', m1_ns_palazzo3: 'm1-ns-palazzo3.png',
        m1_pizzeria_oven:'m1-pizzeria-oven.png', m1_pizzeria_counter:'m1-pizzeria-counter.png', m1_pizzeria_table:'m1-pizzeria-table.png',
        m1_metro_hall:'m1-metro-hall.png', m1_metro_platform:'m1-metro-platform.png', m1_metro_gate:'m1-metro-gate.png',
        // Scene di sfondo per interni: usate come velatura a bassa opacità sopra i tile,
        // così la collisione resta allineata alla grafica dei tile stessi.
        m1_bg_bar:'m1-bar-room.png', m1_bg_church:'m1-church-hall.png',
        m1_bg_pizzeria:'m1-pz-hall.png', m1_bg_metro:'m1-mt-hall.png',
      };
      let pending = Object.keys(files).length;
      this.imagesReady = new Promise(resolve => {
        const settled = () => {
          if (--pending > 0) return;
          this.imagesLoaded = true;
          // I prospetti e i prop vengono cacheati al primo accesso. Se l'accesso
          // avviene prima del caricamento M1, la cache conterrebbe il fallback
          // procedurale per sempre: la si invalida quando tutti gli asset sono
          // pronti, così la grafica finale non dipende dall'ordine dei frame.
          for (const key of Object.keys(this.cache)) {
            if (key.startsWith('bld:') || key.startsWith('w:p:')) delete this.cache[key];
          }
          resolve();
        };
        for (const [k, f] of Object.entries(files)) {
          const img = new Image(); img.decoding = 'async';
          img.onload = () => { this.images[k] = img; settled(); };
          img.onerror = () => { settled(); }; // fallback code-drawn
          img.src = this.assetUrl(f);
        }
        if (!pending) settled();
      });
      this._imgReady = true;
      return this.imagesReady;
    },
    /* Scala uniforme del mondo (WORLD_SCALE = 8 px/m). Il canvas originale resta
     * delle dimensioni originarie e lo sprite ridotto viene ancorato in basso
     * al centro: tutti gli offset di disegno esistenti restano validi.
     * I tile di suolo e le architetture metriche NON passano da qui.
     */
    _world(key, make) {
      if (this.cache[key]) return this.cache[key];
      const src = make(); if (!src || !src.width || !src.height) return src;
      const w = Math.max(1, Math.round(src.width * CL.WORLD_SCALE));
      const h = Math.max(1, Math.round(src.height * CL.WORLD_SCALE));
      const c = cv(src.width, src.height), x = ctx(c);
      x.imageSmoothingEnabled = true;
      x.drawImage(src, Math.floor((src.width - w) / 2), src.height - h, w, h);
      return this.cache[key] = c;
    },
    tree(v) { return this._world('w:tree:' + v, () => this._tree(v)); },
    lemonTree(v) { return this._world('w:lemon:' + v, () => this._lemonTree(v)); },
    rock(v) { return this._world('w:rock:' + v, () => this._rock(v)); },
    flower(v) { return this._world('w:flower:' + v, () => this._flower(v)); },
    fountain() { return this._world('w:fountain', () => this._fountain()); },
    character(look, dir, frame, mode) {
      const anim = mode || 'walk';
      return this._world('w:c2:' + [look.hair, look.skin, look.shirt, look.pants, dir, frame, anim].join('|'),
        () => this._character(look, dir, frame, anim));
    },
    creature(id, frame) { return this._world('w:cr:' + id + ':' + frame, () => this._creature(id, frame)); },
    vehicle(type, dir) { return this._world('w:v:' + type + ':' + dir, () => this._vehicle(type, dir)); },
    propSprite(kind) { return this._world('w:p:' + kind, () => this._propSprite(kind)); },

    px, shade, ell, cv, ctx,

    /* --------------------------------------------------------- tiles 16x16 */
    buildTiles() {
      for (const ch of ".TDderpSW~#b=fcoXBo^gkPCVZOH'LFKQYIUENJAMRZhjlnqstuvwxyz1234567890") this.tiles[ch] = this.tile(ch);
      // Varianti deterministiche: la griglia resta invariata, cambia solo il disegno.
      for (let v = 0; v < 4; v++) {
        this.tiles['D' + v] = this.variantTile('D', v);
        this.tiles['p' + v] = this.variantTile('p', v);
        this.tiles['d' + v] = this.variantTile('d', v);
        this.tiles['e' + v] = this.variantTile('e', v);
      }
      for (let v = 0; v < 2; v++) {
        this.tiles['r_h' + v] = this.variantTile('r', v, 'h');
        this.tiles['r_v' + v] = this.variantTile('r', v, 'v');
      }
    },
    variantTile(ch, variant, orient) {
      const c = cv(16, 16), x = ctx(c);
      x.drawImage(this.tiles[ch], 0, 0);
      const R = U.rng(U.hash('tile-variant:' + ch + ':' + variant + ':' + (orient || '')));
      if (ch === 'D') {
        // Basolato: giunti e usura leggermente diversi per evitare la copia identica.
        for (let i = 0; i < 5; i++) {
          const xx = (R() * 16) | 0, yy = (R() * 16) | 0;
          px(x, xx, yy, 3 + ((R() * 2) | 0), 1, i % 2 ? 'rgba(255,255,255,.16)' : 'rgba(52,49,45,.28)');
          if (i % 2 === 0) px(x, xx, yy + 1, 1, 2, 'rgba(52,49,45,.20)');
        }
        px(x, variant * 3, 0, 1, 16, 'rgba(52,49,45,.22)');
        px(x, 0, variant * 4, 16, 1, 'rgba(52,49,45,.18)');
      } else if (ch === 'p') {
        // Marciapiede: venature e giunti sfalsati, sempre su griglia 16x16.
        for (let i = 0; i < 6; i++) {
          const xx = (R() * 16) | 0, yy = (R() * 16) | 0;
          px(x, xx, yy, 1 + ((R() * 3) | 0), 1, i % 2 ? 'rgba(255,255,255,.17)' : 'rgba(78,72,64,.24)');
        }
        px(x, (variant * 4 + 1) % 16, 0, 1, 16, 'rgba(78,72,64,.22)');
        px(x, 0, (variant * 3 + 2) % 16, 16, 1, 'rgba(78,72,64,.18)');
      } else if (ch === 'd') {
        // Sagrato: lastre chiare e giunti in piperno, non basolato ripetuto.
        px(x, 0, variant % 2, 16, 1, 'rgba(74,74,72,.35)');
        px(x, variant * 3, 0, 1, 16, 'rgba(74,74,72,.25)');
        px(x, 1, 1 + variant, 6, 5, 'rgba(255,255,255,.10)');
      } else if (ch === 'e') {
        // Asse pedonale: basolato compatto con corsia di marcia leggibile.
        px(x, 0, variant * 2, 16, 1, 'rgba(74,74,72,.22)');
        px(x, variant * 4, 0, 1, 16, 'rgba(74,74,72,.16)');
        for (let i = 0; i < 3; i++) px(x, (i * 5 + variant) % 16, 6 + i * 2, 3, 1, 'rgba(255,255,255,.12)');
      } else if (ch === 'r') {
        if (orient === 'v') {
          // La stessa griglia 'r' viene orientata in base ai vicini: nessun nuovo tile solido.
          px(x, 0, 6, 16, 4, P.road);
          for (let yy = 0; yy < 16; yy += 4) px(x, 7, yy, 2, 2, P.line);
          px(x, 7, 0, 1, 16, '#4a4f53');
        } else {
          for (let yy = 0; yy < 16; yy += 8) px(x, 0, yy + 3, 16, 1, 'rgba(20,24,26,.10)');
        }
        for (let i = 0; i < 4; i++) px(x, (R() * 16) | 0, (R() * 16) | 0, 2, 1, 'rgba(20,24,26,.08)');
      }
      return c;
    },
    tileFor(ch, tx, ty, map) {
      if ((ch === 'D' || ch === 'p' || ch === 'd' || ch === 'e') && this.tiles[ch + (U.hash(ch + ':' + tx + ':' + ty) % 4)]) {
        return this.tiles[ch + (U.hash(ch + ':' + tx + ':' + ty) % 4)];
      }
      if (ch === 'r' && map && CL.maps && CL.maps.tile) {
        const at = (xx, yy) => CL.maps.tile(map, xx, yy) === 'r';
        const hor = (at(tx - 1, ty) ? 1 : 0) + (at(tx + 1, ty) ? 1 : 0);
        const ver = (at(tx, ty - 1) ? 1 : 0) + (at(tx, ty + 1) ? 1 : 0);
        const orient = ver > hor ? 'v' : 'h';
        const key = 'r_' + orient + (U.hash('rv:' + tx + ':' + ty) % 2);
        return this.tiles[key] || this.tiles.r;
      }
      return this.tiles[ch];
    },
    tile(ch) {
      const c = cv(16, 16), x = ctx(c), R = U.rng(U.hash('tile' + ch));
      const dot = (col, n) => { for (let i = 0; i < n; i++) px(x, (R() * 16) | 0, (R() * 16) | 0, 1, 1, col); };
      switch (ch) {
        case '.': px(x, 0, 0, 16, 16, P.grass); dot(P.grassD, 14); dot(P.grassL, 8); break;
        case 'T': px(x, 0, 0, 16, 16, P.grass); dot(P.grassD, 6); break;
        case 'D': // basolato piazza
          px(x, 0, 0, 16, 16, '#8f8a80');
          for (let yy = 0; yy < 16; yy += 4) for (let xx = (yy % 8 === 0 ? 0 : 2); xx < 16; xx += 4) {
            px(x, xx, yy, 3, 3, (xx + yy) % 8 === 0 ? '#7f7a71' : '#969187');
            px(x, xx, yy, 3, 1, 'rgba(255,255,255,.06)');
          }
          dot('#6f6a62', 4); break;
        case 'd': // sagrato / piazzetta: lastre di tufa chiara e giunti scuri
          px(x, 0, 0, 16, 16, '#d8cdb8');
          for (let yy = 0; yy < 16; yy += 8) for (let xx = 0; xx < 16; xx += 8) {
            px(x, xx, yy, 8, 8, (xx + yy) % 16 === 0 ? '#e3dac6' : '#d1c5ae');
            px(x, xx, yy, 8, 1, 'rgba(74,74,72,.42)');
            px(x, xx, yy, 1, 8, 'rgba(74,74,72,.34)');
            px(x, xx + 1, yy + 1, 5, 1, 'rgba(255,255,255,.12)');
          }
          dot('#b6a98f', 3); break;
        case 'e': // asse pedonale principale: basolato compatto, direzione leggibile
          px(x, 0, 0, 16, 16, '#969187');
          for (let yy = 0; yy < 16; yy += 4) for (let xx = (yy % 8 === 0 ? 0 : 2); xx < 16; xx += 4) {
            px(x, xx, yy, 3, 3, (xx + yy) % 8 === 0 ? '#858078' : '#a19b90');
            px(x, xx, yy, 3, 1, 'rgba(255,255,255,.09)');
          }
          px(x, 7, 0, 2, 16, 'rgba(74,74,72,.18)');
          dot('#6f6a62', 3); break;
        case ',': px(x, 0, 0, 16, 16, '#a58b62'); dot('#8f764f', 16); dot('#bba272', 8); break;
        case 'r':
          px(x, 0, 0, 16, 16, P.road); px(x, 0, 0, 16, 1, P.roadL);
          for (let i = 0; i < 4; i++) px(x, i * 4, 7, 2, 2, P.line);
          dot('#4a4f53', 5); break;
        case 'p': // marciapiede
          px(x, 0, 0, 16, 16, '#b8b1a2');
          for (let xx = 0; xx < 16; xx += 4) px(x, xx, 0, 1, 16, '#a9a293');
          for (let yy = 0; yy < 16; yy += 8) px(x, 0, yy, 16, 1, '#a9a293');
          dot('#ccc5b5', 5); dot('#989184', 4); break;
        case 'S': px(x, 0, 0, 16, 16, P.sand); dot(P.sandD, 16); dot('#f1dfb5', 6); break;
        case 'W':
          px(x, 0, 0, 16, 16, P.water);
          for (let i = 0; i < 3; i++) { px(x, (i * 6 + (R() * 3 | 0)) % 16, 3 + i * 4, 4, 1, P.waterL); px(x, (i * 5 + 7) % 16, 6 + i * 3, 2, 1, P.foam); }
          break;
        case '~':
          px(x, 0, 0, 16, 16, '#54a5b4');
          for (let i = 0; i < 4; i++) px(x, (i * 4) % 16, 4 + (i % 2) * 6, 3, 1, P.foam);
          break;
        case '#':
          px(x, 0, 0, 16, 16, P.wall);
          px(x, 0, 0, 16, 2, P.wallL); px(x, 0, 14, 16, 2, P.wallD);
          for (let y = 3; y < 14; y += 5) { px(x, 0, y, 16, 1, P.wallD); for (let xx = (y / 5 % 2) * 4; xx < 16; xx += 8) px(x, xx, y, 1, 5, P.wallD); }
          break;
        case 'b': // muro neutro sotto le facciate: nessun laterizio o finestra finti
          px(x, 0, 0, 16, 16, P.wall);
          px(x, 0, 0, 16, 2, P.wallL); px(x, 0, 14, 16, 2, P.wallD);
          break;
        case '=':
          px(x, 0, 0, 16, 16, P.roof);
          for (let y = 0; y < 16; y += 4) { px(x, 0, y, 16, 1, P.roofD); for (let xx = (y / 4 % 2) * 4; xx < 16; xx += 8) px(x, xx, y + 1, 1, 3, P.roofD); px(x, 2, y + 2, 3, 1, P.roofL); }
          break;
        case 'f':
          px(x, 0, 0, 16, 16, P.floor); px(x, 0, 0, 16, 1, P.floorD); px(x, 0, 0, 1, 16, P.floorD);
          dot(P.floorL, 5); break;
        case 'c':
          px(x, 0, 0, 16, 16, P.wood); px(x, 0, 0, 16, 3, P.woodL); px(x, 0, 13, 16, 3, P.woodD);
          for (let i = 0; i < 4; i++) px(x, i * 4 + 1, 5, 1, 7, P.woodD);
          break;
        case 'o':
          px(x, 2, 2, 12, 12, P.woodD); px(x, 3, 3, 10, 10, P.wood);
          px(x, 3, 7, 10, 1, P.woodL); px(x, 7, 3, 1, 10, P.woodL); break;
        case 'X':
          px(x, 0, 0, 16, 16, P.pave); ell(x, 8, 8, 6, 6, P.stone); ell(x, 8, 8, 4, 4, '#6fa9b8');
          px(x, 7, 3, 2, 4, P.stoneL); px(x, 7, 9, 2, 4, P.stoneL); break;
        case 'B':
          px(x, 0, 0, 16, 16, P.floor); px(x, 1, 2, 14, 12, P.woodD); px(x, 2, 3, 12, 9, '#d9e0d4');
          px(x, 2, 3, 12, 3, '#f0f1e4'); px(x, 2, 10, 12, 2, '#b7c2b6'); break;
        case '^':
          px(x, 0, 0, 16, 16, P.stone); ell(x, 8, 10, 8, 6, P.stoneL); ell(x, 8, 6, 5, 5, P.stone);
          px(x, 7, 2, 3, 3, '#ded9cc'); dot(P.stoneD, 8); break;
        case 'g':
          px(x, 0, 0, 16, 16, '#b9ae91'); dot('#a99c7e', 12); px(x, 3, 4, 10, 1, '#9c8f72'); px(x, 4, 4, 1, 8, '#9c8f72'); break;
        case 'k':
          px(x, 0, 0, 16, 16, P.cave); dot(P.caveL, 18); px(x, 0, 0, 16, 1, '#2a2630'); break;
        case 'P':
          px(x, 0, 0, 16, 16, P.floor); px(x, 6, 9, 4, 6, P.woodD);
          ell(x, 8, 6, 5, 5, '#4f8a4c'); ell(x, 5, 5, 3, 3, '#6fa85a'); ell(x, 11, 6, 3, 3, '#3f7843'); break;
        case 'C':
          px(x, 0, 0, 16, 16, P.floor); px(x, 2, 3, 12, 9, P.woodD); px(x, 3, 4, 10, 7, '#5b8fa6');
          px(x, 4, 5, 4, 1, '#bfe0e4'); px(x, 5, 11, 6, 2, P.woodD); break;
        case 'V':
          px(x, 0, 0, 16, 16, P.floor); px(x, 1, 4, 14, 9, P.woodD); px(x, 2, 5, 12, 7, '#24343f');
          px(x, 3, 6, 10, 4, '#4c93a8'); break;
        case 'G':
          px(x, 0, 0, 16, 16, P.pave); px(x, 2, 3, 3, 13, P.stone); px(x, 11, 3, 3, 13, P.stone);
          px(x, 2, 2, 12, 3, P.stoneL); px(x, 6, 5, 4, 11, '#2c2933'); break;
        case 'O': // base guglia / monumento (solida) - si integra col basolato
          px(x, 0, 0, 16, 16, '#8f8a80');
          for (let yy = 0; yy < 16; yy += 4) for (let xx = (yy % 8 === 0 ? 0 : 2); xx < 16; xx += 4) {
            px(x, xx, yy, 3, 3, (xx + yy) % 8 === 0 ? '#7f7a71' : '#969187');
          }
          px(x, 1, 1, 14, 14, '#d5ccbc'); px(x, 2, 2, 12, 12, '#e2dacc');
          px(x, 1, 13, 14, 2, '#b0a593'); px(x, 1, 1, 14, 1, '#ece5d6');
          break;
        case 'H': // bugnato Gesù Nuovo (grigio scuro)
          px(x, 0, 0, 16, 16, '#656a6f');
          for (let yy = 0; yy < 16; yy += 4) for (let xx = 0; xx < 16; xx += 4) {
            const dark = (xx/4 + yy/4) % 2 === 0;
            px(x, xx, yy, 4, 4, dark ? '#4f5459' : '#72787d');
            px(x, xx + 1, yy + 1, 2, 2, dark ? '#5a6066' : '#848b91');
            px(x, xx, yy, 1, 1, 'rgba(255,255,255,.08)');
          }
          break;
        case 'L': // finestra palazzo
          px(x, 0, 0, 16, 16, '#d8cdb7');
          px(x, 2, 2, 12, 12, '#7b623f'); px(x, 3, 3, 10, 10, '#5a8ca8');
          px(x, 7, 3, 2, 10, '#d7ccb8'); px(x, 3, 7, 10, 2, '#d7ccb8');
          px(x, 3, 3, 10, 2, 'rgba(255,255,255,.18)'); break;
        case 'F': // balcone
          px(x, 0, 0, 16, 16, '#d8cdb7');
          px(x, 1, 6, 14, 2, '#7b623f'); px(x, 2, 8, 12, 6, '#4f6f47');
          for (let xx=3; xx<13; xx+=2) px(x, xx, 8, 1, 4, '#6f8a58');
          px(x, 2, 4, 12, 2, '#2f3f4f'); break;
        case 'K': // edicola
          px(x, 0, 0, 16, 16, '#b8b1a2');
          px(x, 1, 2, 14, 12, '#2e6b4f'); px(x, 2, 4, 12, 8, '#f2ead8');
          px(x, 3, 5, 4, 3, '#c9564a'); px(x, 8, 5, 5, 3, '#4a87b8');
          px(x, 2, 12, 12, 2, '#7b623f'); break;
        case 'Q': // bar/insegna
          px(x, 0, 0, 16, 16, '#d8cdb7');
          px(x, 2, 3, 12, 10, '#5e402d'); px(x, 3, 4, 10, 8, '#f0e4cf');
          px(x, 4, 5, 8, 2, '#b44a3a'); px(x, 5, 8, 6, 2, '#7b623f'); break;
        case 'Y': // porta legno
          px(x, 0, 0, 16, 16, '#b8b1a2');
          px(x, 3, 1, 10, 15, '#5a3e2a'); px(x, 4, 2, 8, 13, '#7a5637');
          px(x, 7, 2, 2, 13, '#65452c'); px(x, 10, 9, 1, 1, '#e9b84a'); break;
        case 'I': // ringhiera/ferro
          px(x, 0, 0, 16, 16, '#d8cdb7');
          for (let xx=2; xx<14; xx+=2) px(x, xx, 4, 1, 10, '#454b52');
          px(x, 1, 4, 14, 1, '#59616a'); px(x, 1, 13, 14, 1, '#59616a'); break;
        case 'U': // lampione base
          px(x, 0, 0, 16, 16, P.pave); px(x, 7, 4, 2, 10, '#3d444b'); px(x, 6, 3, 4, 2, '#2f353b');
          px(x, 6, 2, 4, 2, '#f3dd8a'); break;
        case 'E': // panchina
          px(x, 0, 0, 16, 16, P.pave); px(x, 2, 8, 12, 2, '#7a5637'); px(x, 3, 6, 10, 2, '#8b6542');
          px(x, 3, 10, 2, 4, '#4a382b'); px(x, 11, 10, 2, 4, '#4a382b'); break;
        case 'N': // insegna/bar tabacchi generica
          px(x, 0, 0, 16, 16, '#b8b1a2'); px(x, 1, 3, 14, 10, '#3f6f95'); px(x, 2, 4, 12, 8, '#ecf2f6');
          px(x, 3, 6, 10, 2, '#2f5575'); break;
        case 'J': // tenda bar
          px(x, 0, 0, 16, 16, '#d8cdb7');
          for (let xx=0; xx<16; xx+=4) { px(x, xx, 2, 2, 6, '#b94a3a'); px(x, xx+2, 2, 2, 6, '#efe2c6'); }
          px(x, 0, 8, 16, 1, '#7b623f'); break;
        case "'": // dettaglio/accento
          px(x, 0, 0, 16, 16, P.pave); px(x, 7, 4, 2, 8, '#c9a44a'); break;
        /* ----------------------------- interni ricchi ----------------------------- */
        case 'A':
          px(x,0,0,16,16,'#d9d2c3'); px(x,0,0,16,1,'#cfc7b7'); px(x,0,0,1,16,'#cfc7b7');
          px(x,8,0,1,16,'#c9c0af'); px(x,0,8,16,1,'#c9c0af'); dot('#ece5d7',5); dot('#c4bba9',4); break;
        case 'M':
          px(x,0,0,16,16,'#d4ccbc'); for(let yy=0;yy<16;yy+=8)for(let xx=0;xx<16;xx+=8){ px(x,xx,yy,8,8,(xx+yy)%16===0?'#c8beac':'#ddd5c5'); px(x,xx+3,yy+3,2,2,'#b2a692'); } dot('#eee6d6',4); break;
        case 'R':
          px(x,0,0,16,16,'#8f2f2f'); px(x,1,0,14,16,'#a53a3a'); px(x,2,0,2,16,'#c9a44a'); px(x,12,0,2,16,'#c9a44a'); dot('#7a2525',6); break;
        case 'Z':
          px(x,0,0,16,16,'#7a5637'); for(let yy=0;yy<16;yy+=4) px(x,0,yy,16,1,'#68472d'); dot('#8b6542',6); dot('#5e4028',4); break;
        case 'h':
          px(x,0,0,16,16,'#cdbd9d'); for(let yy=0;yy<16;yy+=4)for(let xx=0;xx<16;xx+=4){ px(x,xx,yy,4,4,(xx+yy)%8===0?'#d8cab0':'#c4b492'); px(x,xx,yy,4,1,'rgba(255,255,255,.08)'); } break;
        case 'j':
          px(x,0,0,16,16,'#ddd3c0'); px(x,0,14,16,2,'#b9ad98'); dot('#e8dfcf',8); dot('#cfc4b0',4); break;
        case 'l':
          px(x,0,0,16,16,'#cfc5b3'); px(x,2,0,12,16,'#ddd3c2'); px(x,4,0,2,16,'#efe6d6'); px(x,10,0,2,16,'#bdb3a1'); px(x,0,0,16,2,'#b8ae9c'); px(x,0,14,16,2,'#b8ae9c'); break;
        case 'n':
          px(x,0,0,16,16,'#d9d2c3'); px(x,2,4,12,4,'#6f4f34'); px(x,2,8,12,2,'#855f3d'); px(x,3,10,2,4,'#5a4028'); px(x,11,10,2,4,'#5a4028'); break;
        case 'q':
          px(x,0,0,16,16,'#d4ccbc'); px(x,1,3,14,10,'#ece3d1'); px(x,1,3,14,2,'#c9a44a'); px(x,3,6,10,5,'#d9cfbe'); px(x,7,7,2,3,'#b08a45'); break;
        case 's':
          px(x,0,0,16,16,'#ddd3c0'); px(x,1,1,14,14,'#7a5637'); px(x,2,2,12,3,'#f0e4cf'); px(x,2,6,12,3,'#d9c7a5'); px(x,2,10,12,3,'#c7d8c0'); px(x,3,3,2,1,'#c9564a'); px(x,6,3,2,1,'#4a87b8'); px(x,9,7,2,1,'#e9b84a'); break;
        case 'u':
          px(x,0,0,16,16,'#7a5637'); px(x,0,0,16,4,'#9b7349'); px(x,0,4,16,1,'#5e4028'); px(x,1,6,14,8,'#68472d'); px(x,2,7,3,2,'#c9a44a'); break;
        case 'v':
          px(x,0,0,16,16,'#d8ccb4'); px(x,2,4,12,7,'#8b6244'); px(x,3,5,10,5,'#a07050'); px(x,3,11,2,3,'#65432e'); px(x,11,11,2,3,'#65432e'); break;
        case 'w':
          px(x,0,0,16,16,'#d8ccb4'); px(x,4,3,8,4,'#7a5637'); px(x,4,7,8,3,'#986d48'); px(x,4,10,2,4,'#65432e'); px(x,10,10,2,4,'#65432e'); break;
        case 'x':
          px(x,0,0,16,16,'#d8ccb4'); px(x,1,2,14,12,'#6b4b33'); px(x,2,3,12,10,'#e8e1d4'); px(x,2,3,12,4,'#f3efe6'); px(x,2,9,12,4,'#8fb0c8'); break;
        case 'y':
          px(x,0,0,16,16,'#d6cbb6'); px(x,1,2,14,12,'#8a8f95'); px(x,2,3,12,4,'#5d6670'); px(x,3,9,4,3,'#3f4750'); px(x,9,9,4,3,'#3f4750'); px(x,6,5,4,1,'#c9a44a'); break;
        case 'z':
          px(x,0,0,16,16,'#d7ccb8'); px(x,2,5,12,7,'#dfe6eb'); px(x,3,6,10,5,'#b8d0d8'); px(x,7,2,2,3,'#9aa3ad'); px(x,7,11,2,3,'#8b6244'); break;
        case '1':
          px(x,0,0,16,16,'#d8ccb4'); px(x,1,5,14,4,'#7a5637'); px(x,2,6,12,2,'#986d48'); px(x,2,9,2,5,'#65432e'); px(x,12,9,2,5,'#65432e'); break;
        case '2':
          px(x,0,0,16,16,'#d8ccb4'); px(x,3,3,10,7,'#2f3c46'); px(x,4,4,8,5,'#6fb0c8'); px(x,7,10,2,2,'#59636d'); px(x,5,12,6,1,'#59636d'); break;
        case '3':
          px(x,0,0,16,16,'#d8ccb4'); px(x,3,5,10,7,'#4a5560'); px(x,4,6,8,3,'#9fc3d8'); px(x,5,10,6,1,'#c9a44a'); break;
        case '4':
          px(x,0,0,16,16,'#ddd3c0'); px(x,1,1,14,14,'#6b4b33'); px(x,2,2,12,12,'#845e3d'); px(x,3,3,4,4,'#c9564a'); px(x,9,3,4,4,'#4a87b8'); px(x,3,9,4,4,'#7a9a5a'); px(x,9,9,4,4,'#e9b84a'); break;
        case '5':
          px(x,0,0,16,16,'#d4ccbc'); px(x,7,8,2,5,'#efe2c6'); px(x,7,6,2,2,'#f3c44f'); px(x,6,10,4,1,'#c9a44a'); break;
        case '6':
          px(x,0,0,16,16,'#ddd3c0'); px(x,2,2,12,12,'#7a5637'); px(x,3,3,10,10,'#5f7e96'); px(x,4,8,8,4,'#7a9a5a'); px(x,6,5,3,3,'#e9b84a'); break;
        case '7':
          px(x,0,0,16,16,'#d8cdb7'); px(x,2,2,12,12,'#6b5540'); px(x,3,3,10,10,'#9fc3d8'); px(x,7,3,2,10,'#6b5540'); px(x,3,7,10,2,'#6b5540'); px(x,3,3,10,3,'rgba(255,255,255,.25)'); break;
        case '8':
          px(x,0,0,16,16,'#ddd3c0'); px(x,3,1,10,15,'#6b4b33'); px(x,4,2,8,13,'#855f3d'); px(x,10,9,1,1,'#c9a44a'); break;
        case '9':
          px(x,0,0,16,16,'#d8ccb4'); px(x,6,10,4,4,'#8b6244'); ell(x,8,7,4,4,'#5f9a4e'); ell(x,6,6,2,2,'#7ab868'); break;
        case '0':
          px(x,0,0,16,16,'#d8ccb4'); px(x,1,3,14,10,'#8b6244'); px(x,2,4,12,5,'#dceef3'); px(x,3,6,3,2,'#e0ab69'); px(x,7,6,3,2,'#d9543f'); px(x,11,6,2,2,'#f2d24f'); px(x,2,9,12,3,'#6b4b33'); break;
        default: px(x, 0, 0, 16, 16, '#d44d9a');
      }
      return c;
    },

    /* ------------------------------------------------------- oggetti alti */
    _tree(variant) {
      const key = 'tree' + variant; if (this.cache[key]) return this.cache[key];
      const c = cv(32, 40), x = ctx(c), R = U.rng(variant * 977 + 13);
      px(x, 14, 28, 5, 12, P.woodD); px(x, 15, 28, 3, 12, P.wood);
      const base = variant % 3 === 0 ? '#4d8146' : variant % 3 === 1 ? '#5d944f' : '#437a45';
      ell(x, 16, 18, 13, 11, P.dark); ell(x, 16, 17, 12, 10, base);
      ell(x, 10, 14, 6, 6, shade(base, 18)); ell(x, 22, 16, 6, 6, shade(base, -14));
      ell(x, 16, 10, 7, 5, shade(base, 26));
      for (let i = 0; i < 26; i++) px(x, 5 + (R() * 22 | 0), 8 + (R() * 19 | 0), 1, 1, R() > .5 ? shade(base, 32) : shade(base, -22));
      return this.cache[key] = c;
    },
    _lemonTree(variant) {
      // Usa il disegno grezzo: il wrapping di scala avviene una sola volta,
      // in lemonTree(), altrimenti l'albero verrebbe scalato due volte.
      const c = this._tree(variant), key = 'lemon' + variant;
      if (this.cache[key]) return this.cache[key];
      const n = cv(32, 40), x = ctx(n); x.drawImage(c, 0, 0);
      [[9, 16], [22, 21], [15, 10], [25, 13]].forEach(([a, b]) => { px(x, a, b, 2, 3, '#f2d24f'); px(x, a, b, 1, 1, '#fff0a0'); });
      return this.cache[key] = n;
    },
    _rock(variant) {
      const key = 'rock' + variant; if (this.cache[key]) return this.cache[key];
      const c = cv(20, 14), x = ctx(c);
      ell(x, 10, 9, 9, 5, P.dark); ell(x, 10, 8, 8, 5, P.stone); ell(x, 7, 6, 4, 3, P.stoneL);
      px(x, 12, 9, 3, 1, P.stoneD);
      return this.cache[key] = c;
    },
    _flower(variant) {
      const key = 'flower' + variant; if (this.cache[key]) return this.cache[key];
      const c = cv(8, 10), x = ctx(c), col = ['#f2d24f', '#e88fae', '#f3f0e0', '#c58fe0'][variant % 4];
      px(x, 3, 5, 1, 5, '#4f8a4c'); px(x, 3, 6, 3, 1, '#4f8a4c');
      px(x, 2, 2, 3, 2, col); px(x, 3, 1, 1, 4, col); px(x, 3, 3, 1, 1, '#e8a13c');
      return this.cache[key] = c;
    },
    _fountain() {
      if (this.cache.fountain) return this.cache.fountain;
      const c = cv(32, 26), x = ctx(c);
      ell(x, 16, 19, 14, 6, P.dark); ell(x, 16, 18, 13, 5, P.stoneL); ell(x, 16, 18, 10, 3, '#6fa9b8');
      px(x, 14, 8, 4, 10, P.stone); px(x, 13, 7, 6, 2, P.stoneL);
      ell(x, 16, 6, 3, 3, '#8fcdd4'); px(x, 16, 9, 1, 3, '#bfe6e8');
      return this.cache.fountain = c;
    },

    /* ---------------------------------------------------------- personaggi */
    _character(look, dir, frame, mode) {
      const anim = mode || 'walk';
      const key = ['c5', look.hair, look.skin, look.shirt, look.pants, dir, frame, anim].join('|');
      if (this.cache[key]) return this.cache[key];
      const c = cv(16, 24), x = ctx(c), d = P.dark;
      const skinD = shade(look.skin, -22), skinL = shade(look.skin, 12);
      const shirtD = shade(look.shirt, -28), shirtL = shade(look.shirt, 16);
      const hairD = shade(look.hair, -28), hairL = shade(look.hair, 18);
      const pantsD = shade(look.pants, -24), pantsL = shade(look.pants, 14);
      const shoe = '#4a3a32', shoeD = '#352922';
      // Tre animazioni distinte ma con la stessa silhouette e lo stesso ancoraggio:
      // idle respira, walk ha passo normale, run ha falcata e braceggio ampliati.
      const f = frame % (anim === 'idle' ? 2 : 4);
      const bob = anim === 'idle' ? (f === 1 ? -1 : 0) : (f === 1 || f === 3 ? -1 : 0);
      const stride = anim === 'run' ? 3 : 2;
      const legA = anim === 'idle' ? 0 : (f === 1 ? stride : f === 3 ? -stride : 0);
      const armA = anim === 'idle' ? 0 : anim === 'run' ? (f === 1 ? -2 : f === 3 ? 2 : 0) : (f === 1 ? -1 : f === 3 ? 1 : 0);
      const isSide = dir === 'left' || dir === 'right';
      px(x, 3, 22, 10, 2, 'rgba(18,22,28,.22)');
      if (isSide) {
        const lx = 6 + (f===1?1:f===3?-1:0);
        px(x, lx, 17 + bob, 3, 4, look.pants); px(x, lx, 17+bob, 1, 3, pantsL);
        px(x, lx+1, 21 + bob, 3, 2, shoe); px(x, lx+1, 22+bob, 3, 1, shoeD);
      } else {
        px(x, 5, 17 + bob, 3, 4 + Math.max(0, legA), look.pants);
        px(x, 9, 17 + bob, 3, 4 + Math.max(0, -legA), look.pants);
        px(x, 5, 17 + bob, 1, 3, pantsL); px(x, 9, 17 + bob, 1, 3, pantsL);
        px(x, 4, 21 + bob + legA, 4, 2, shoe); px(x, 9, 21 + bob - legA, 4, 2, shoe);
        px(x, 4, 22 + bob + legA, 4, 1, shoeD); px(x, 9, 22 + bob - legA, 4, 1, shoeD);
      }
      const bx = isSide ? 5 + (anim === 'run' ? (dir === 'left' ? -1 : 1) : 0) : 4, bw = isSide ? 6 : 8;
      px(x, bx, 11 + bob, bw, 7, look.shirt);
      px(x, bx, 11 + bob, bw, 1, shirtD); px(x, bx, 17 + bob, bw, 1, shirtD);
      px(x, bx+1, 12 + bob, 2, 4, shirtL);
      px(x, bx+2, 16 + bob, bw-4, 1, pantsD);
      if (isSide) {
        const ax = dir === 'left' ? 4 : 10;
        px(x, ax, 12 + bob + armA, 2, 4, look.shirt);
        px(x, ax, 16 + bob + armA, 2, 2, look.skin);
      } else {
        px(x, 2, 12 + bob + armA, 2, 4, look.shirt); px(x, 12, 12 + bob - armA, 2, 4, look.shirt);
        px(x, 2, 16 + bob + armA, 2, 2, look.skin); px(x, 12, 16 + bob - armA, 2, 2, look.skin);
      }
      px(x, 7, 10 + bob, 2, 2, skinD);
      const hx = 4;
      px(x, hx, 3 + bob, 8, 8, look.skin);
      px(x, hx-1, 5 + bob, 1, 5, look.skin); px(x, hx+8, 5 + bob, 1, 5, look.skin);
      px(x, hx, 4 + bob, 1, 5, skinL); px(x, hx, 10 + bob, 8, 1, skinD);
      px(x, hx-1, 2 + bob, 10, 3, look.hair); px(x, hx-1, 4 + bob, 1, 4, look.hair); px(x, hx+8, 4 + bob, 1, 4, look.hair);
      px(x, hx, 1 + bob, 8, 1, hairL); px(x, hx, 2 + bob, 8, 1, hairD);
      if (dir === 'up') {
        px(x, hx-1, 3 + bob, 10, 8, look.hair); px(x, hx+1, 5 + bob, 6, 4, hairD); px(x, hx, 2 + bob, 8, 1, hairL);
      } else if (dir === 'left') {
        px(x, hx, 4 + bob, 3, 6, look.hair);
        px(x, hx+1, 7 + bob, 1, 2, d); px(x, hx+1, 7 + bob, 1, 1, '#fff');
        px(x, hx+2, 9 + bob, 2, 1, shade(look.skin, -30));
      } else if (dir === 'right') {
        px(x, hx+5, 4 + bob, 3, 6, look.hair);
        px(x, hx+6, 7 + bob, 1, 2, d); px(x, hx+6, 7 + bob, 1, 1, '#fff');
        px(x, hx+4, 9 + bob, 2, 1, shade(look.skin, -30));
      } else {
        px(x, hx+2, 7 + bob, 1, 2, d); px(x, hx+6, 7 + bob, 1, 2, d);
        px(x, hx+2, 7 + bob, 1, 1, '#fff'); px(x, hx+6, 7 + bob, 1, 1, '#fff');
        px(x, hx+4, 9 + bob, 1, 1, shade(look.skin, -30));
        px(x, hx+3, 10 + bob, 3, 1, 'rgba(120,60,50,.18)');
      }
      if (anim === 'idle' && f === 1 && !isSide) {
        px(x, hx + 2, 7 + bob, 1, 2, look.hair); px(x, hx + 6, 7 + bob, 1, 2, look.hair);
      }
      return this.cache[key] = c;
    },

    /* ------------------------------------------------------------- creature */
    _creature(id, frame) {
      const def = D.creatures[id]; if (!def) return null;
      const key = ['cr', id, frame].join('|'); if (this.cache[key]) return this.cache[key];
      const c = cv(24, 24), x = ctx(c), a = def.color, b = def.accent, e = def.eye;
      const bob = frame === 1 ? 1 : 0;
      outline(x, 12, 13 + bob, 8, 7);
      switch (def.shape) {
        case 'gull':
          ell(x, 11, 14 + bob, 8, 6, a); ell(x, 17, 8 + bob, 5, 5, a);
          px(x, 21, 8 + bob, 3, 2, b); px(x, 20, 10 + bob, 2, 1, shade(b, -30));
          ell(x, 9, 13 + bob, 4, 3, shade(a, -22)); ell(x, 17, 7 + bob, 1, 1, e);
          px(x, 7, 19 + bob, 1, 2, b); px(x, 11, 19 + bob, 1, 2, b);
          break;
        case 'snail':
          ell(x, 10, 16 + bob, 8, 4, a); ell(x, 16, 13 + bob, 6, 6, b);
          ell(x, 16, 13 + bob, 3, 3, shade(b, -26)); ell(x, 16, 13 + bob, 1, 1, b);
          px(x, 6, 12 + bob, 1, 3, a); px(x, 6, 11 + bob, 1, 1, e); px(x, 4, 13 + bob, 1, 2, a);
          ell(x, 11, 15 + bob, 1, 1, e);
          break;
        case 'cicada':
          ell(x, 12, 14 + bob, 5, 8, a); ell(x, 8, 12 + bob, 4, 6, shade(a, 30)); ell(x, 16, 12 + bob, 4, 6, shade(a, 30));
          ell(x, 12, 7 + bob, 5, 4, a); px(x, 9, 6 + bob, 2, 2, e); px(x, 14, 6 + bob, 2, 2, e);
          px(x, 11, 4 + bob, 1, 2, b); px(x, 14, 4 + bob, 1, 2, b);
          for (let i = 0; i < 3; i++) px(x, 9 + i * 3, 11 + i * 3, 5, 1, b);
          break;
        case 'meatball':
          ell(x, 12, 13 + bob, 9, 8, a); ell(x, 9, 10 + bob, 4, 3, shade(a, 26));
          ell(x, 9, 14 + bob, 2, 2, e); ell(x, 16, 14 + bob, 2, 2, e);
          px(x, 9, 14 + bob, 1, 1, '#fff'); px(x, 16, 14 + bob, 1, 1, '#fff');
          ell(x, 12, 6 + bob, 4, 2, b); px(x, 12, 7 + bob, 1, 3, shade(b, -20));
          px(x, 13, 9 + bob, 3, 1, '#f0d9a0');
          break;
        case 'fish':
          ell(x, 12, 13 + bob, 8, 6, a); ell(x, 4, 13 + bob, 4, 5, b);
          px(x, 3, 9 + bob, 2, 3, b); px(x, 3, 15 + bob, 2, 3, b);
          ell(x, 16, 11 + bob, 2, 2, e); px(x, 16, 11 + bob, 1, 1, '#fff');
          px(x, 12, 8 + bob, 4, 2, shade(b, 16)); px(x, 11, 17 + bob, 4, 2, shade(b, -12));
          break;
        case 'sheep':
          ell(x, 9, 10 + bob, 4, 4, a); ell(x, 15, 9 + bob, 4, 4, a); ell(x, 12, 13 + bob, 7, 5, a);
          ell(x, 18, 14 + bob, 4, 4, b); ell(x, 17, 13 + bob, 1, 1, e); ell(x, 20, 13 + bob, 1, 1, e);
          px(x, 8, 18 + bob, 2, 3, b); px(x, 14, 18 + bob, 2, 3, b);
          ell(x, 9, 9 + bob, 1, 1, '#fff');
          break;
        case 'butterfly':
          ell(x, 7, 9 + bob, 5, 6, a); ell(x, 17, 9 + bob, 5, 6, b);
          ell(x, 8, 16 + bob, 4, 4, b); ell(x, 16, 16 + bob, 4, 4, a);
          px(x, 11, 7 + bob, 2, 12, e); px(x, 11, 5 + bob, 1, 3, e); px(x, 13, 5 + bob, 1, 3, e);
          px(x, 6, 8 + bob, 1, 1, '#fff'); px(x, 18, 8 + bob, 1, 1, '#fff');
          break;
        case 'lava':
          ell(x, 12, 14 + bob, 9, 7, a); ell(x, 12, 9 + bob, 6, 4, shade(a, -22));
          ell(x, 12, 14 + bob, 6, 4, b); ell(x, 12, 14 + bob, 3, 2, '#ffe6a0');
          ell(x, 9, 9 + bob, 2, 2, e); ell(x, 16, 9 + bob, 2, 2, e);
          px(x, 6, 4 + bob, 2, 3, '#e8a37c'); px(x, 17, 3 + bob, 2, 4, '#e8a37c');
          break;
        case 'siren':
          ell(x, 12, 16 + bob, 6, 6, a); ell(x, 11, 8 + bob, 5, 5, '#f4c9a0');
          ell(x, 10, 5 + bob, 6, 4, b); px(x, 14, 7 + bob, 5, 2, b);
          ell(x, 9, 8 + bob, 1, 1, e); ell(x, 13, 8 + bob, 1, 1, e);
          px(x, 18, 17 + bob, 4, 5, a); px(x, 19, 15 + bob, 3, 4, shade(a, 26));
          break;
      }
      // riflesso comune
      px(x, 8, 6 + bob, 2, 1, 'rgba(255,255,255,.6)');
      return this.cache[key] = c;
    },

    /* ------------------------------------------------------------- veicoli */
    _vehicle(type, dir) {
      const key = ['veh', type, dir].join('|'); if (this.cache[key]) return this.cache[key];
      const c = cv(type === 'bus' ? 34 : type === 'car' ? 30 : type === 'scooter' ? 26 : 24, 20), x = ctx(c);
      const ty = type === 'bus' ? '#d9a63c' : type === 'car' ? '#3f8fae' : type === 'scooter' ? '#c94f43' : '#4f8f6a';
      const wheel = '#24272c';
      if (type === 'bike') {
        ell(x, 6, 15, 4, 4, wheel); ell(x, 18, 15, 4, 4, wheel);
        px(x, 7, 14, 2, 2, '#cfd4d4'); px(x, 17, 14, 2, 2, '#cfd4d4');
        px(x, 8, 10, 8, 2, ty); px(x, 10, 7, 2, 4, ty); px(x, 15, 11, 4, 1, '#b8bcc0');
        px(x, 7, 8, 5, 2, dir === 'left' ? '#2b3036' : ty);
      } else if (type === 'scooter') {
        ell(x, 6, 15, 4, 4, wheel); ell(x, 20, 15, 4, 4, wheel);
        ell(x, 6, 14, 2, 2, '#cfd4d4'); ell(x, 20, 14, 2, 2, '#cfd4d4');
        px(x, 7, 9, 13, 5, ty); px(x, 9, 7, 7, 3, shade(ty, 24));
        px(x, 17, 5, 2, 6, '#3b4045'); px(x, 15, 4, 6, 2, '#3b4045');
        px(x, 8, 13, 12, 1, shade(ty, -40));
      } else if (type === 'car') {
        ell(x, 7, 15, 4, 4, wheel); ell(x, 23, 15, 4, 4, wheel);
        px(x, 3, 8, 24, 7, ty); px(x, 7, 5, 16, 4, ty); px(x, 9, 6, 12, 3, '#8fc9d6');
        px(x, 3, 13, 24, 2, shade(ty, -45)); px(x, 5, 9, 3, 2, '#ffe9a8'); px(x, 22, 9, 3, 2, '#e8613c');
      } else {
        ell(x, 7, 16, 4, 4, wheel); ell(x, 27, 16, 4, 4, wheel);
        px(x, 2, 5, 30, 11, ty); px(x, 4, 6, 7, 5, '#8fc9d6'); px(x, 13, 6, 7, 5, '#8fc9d6'); px(x, 22, 6, 7, 5, '#8fc9d6');
        px(x, 2, 13, 30, 3, shade(ty, -42)); px(x, 3, 16, 4, 2, '#eee6c8'); px(x, 28, 16, 4, 2, '#e8613c');
      }
      if (dir === 'up' || dir === 'left') { x.save(); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); x.restore(); }
      return this.cache[key] = c;
    },

    /* -------------------------------------------------------------- ritratti */
    portrait(look, canvas) {
      const x = canvas.getContext('2d'); x.imageSmoothingEnabled = false;
      x.clearRect(0, 0, 32, 32);
      x.fillStyle = '#2b3944'; x.fillRect(0, 0, 32, 32);
      x.fillStyle = 'rgba(255,255,255,.05)'; x.fillRect(0, 0, 32, 14);
      const big = this._character(look, 'down', 0);
      x.imageSmoothingEnabled = false;
      x.drawImage(big, 3, -6, 16 * 2, 24 * 2);
      x.fillStyle = 'rgba(10,16,24,.15)'; x.fillRect(0, 25, 32, 7);
    },

    /* ------------------------------------------------------ asset pack Napoli */
    // Sprite originali generati a runtime (code-drawn). Non equivalenti a un asset pack
    // professionale disegnato a mano, ma coerenti, cacheati e sostituibili.
    _stamp(c, fn) { const x = ctx(c); fn(x, c.width, c.height); return c; },
    buildingSprite(kind) {
      // Per i palazzi di Napoli l'asset M1 estratto e' l'unica facciata autorevole:
      // il vecchio livello procedurale generico e' stato rimosso per evitare
      // duplicazioni sopra le aperture. I nuovi contesti, senza M1, usano
      // facciate procedurali dedicate (_facadeProcedural).
      const key = 'bld:' + kind; if (this.cache[key]) return this.cache[key];
      const S = {
        // Dimensioni metriche (PX_PER_M = 8): 56x31 m e 36x20 m.
        gesu:      { w: 448, h: 248, wall:'#6a6f74', trim:'#8f9499', roof:'#5a4a3a' },
        palazzo_ne:{ w: 288, h: 160, wall:'#dccba8', trim:'#8a6540', roof:'#8b4a3a' },
        palazzo_sw:{ w: 224, h: 128, wall:'#e2d3b4', trim:'#7a5a38', roof:'#9a5540' },
        palazzo_banca:{ w:160,h:128, wall:'#ddd0bc', trim:'#657a8e', roof:'#7a5842' },
        palazzo_bar:{ w:128, h:128, wall:'#e4d5bd', trim:'#7a4a32', roof:'#8b4a3a' },
        palazzo_se:{ w:128, h:128, wall:'#daceb6', trim:'#7a6245', roof:'#8a5240' },
        palazzo_e: { w:160, h:160, clipH:80, wall:'#d8c9af', trim:'#80674a', roof:'#8a4f3c' },
        // Nuovi contesti: nessun asset M1 dedicato, facciata procedurale (PX_PER_M = 8).
        fuorigrotta_blocco:{ w:192, h:144, wall:'#d8d6cb', trim:'#b6b1a3', roof:'#a9a69c', proc:'blocco' },
        fuorigrotta_torre:{ w:160, h:240, wall:'#d9d7cc', trim:'#ada99d', roof:'#9d9a91', proc:'torre' },
        fuorigrotta_teatro:{ w:560, h:280, wall:'#d5d3c9', trim:'#a7a89f', roof:'#8e9696', proc:'teatro' },
        fuorigrotta_mostra:{ w:320, h:160, wall:'#dedbd0', trim:'#b2b0a4', roof:'#9aa09d', proc:'mostra' },
        // Stadio Diego Armando Maradona: ellisse 26x20 m nella griglia logica.
        fuorigrotta_stadio:{ w:208, h:160, wall:'#d3d4cd', trim:'#a6a79f', roof:'#818981', proc:'stadio' },
        pianura_chiesa:{ w:320, h:248, wall:'#d8c9ad', trim:'#b6a488', roof:'#9a8262', proc:'chiesa' },
        pianura_borgo:{ w:160, h:112, wall:'#d2c1a0', trim:'#8e7c62', roof:'#9b6b4b', proc:'borgo' },
        pianura_municipio:{ w:312, h:200, wall:'#ddd5c2', trim:'#9b9384', roof:'#7f7668', proc:'municipio' },
        bacoli_terme:{ w:312, h:144, wall:'#b98d70', trim:'#8f6a55', roof:'#8a6450', proc:'terme' },
        bacoli_castello:{ w:288, h:176, wall:'#c8b592', trim:'#8e7b60', roof:'#7d6a52', proc:'castello' },
        bacoli_casa:{ w:128, h:96, wall:'#cbb895', trim:'#8d7758', roof:'#8e6b4d', proc:'casa' },
        caserta_reggia:{ w:384, h:224, wall:'#d8cdb7', trim:'#9a9285', roof:'#7d7569', proc:'reggia' },
        salerno_arechi:{ w:224, h:128, wall:'#c9b69b', trim:'#8d765b', roof:'#7f6d55', proc:'arechi' },
        salerno_palazzo:{ w:160, h:96, wall:'#ddd0b8', trim:'#8d6f52', roof:'#8a5840', proc:'palazzo' },
      }[kind];
      if (!S) return null;
      const H = S.clipH || S.h, W = S.w;
      const c = cv(W, H), x = ctx(c), R = U.rng(U.hash('facade-grade:' + kind));
      // Fondo opaco neutro: riempie le bande dell'aspect-fit senza generare finestre finte.
      px(x, 0, 0, W, H, S.wall);
      for (let i = 0; i < Math.floor(W * H / 22); i++) {
        px(x, (R() * W) | 0, (R() * H) | 0, 1, 1,
          R() > .5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.035)');
      }
      const m1Facade = {
        gesu:'m1_gesu_ref',
        palazzo_ne:'m1_piazza_a', palazzo_sw:'m1_piazza_b', palazzo_e:'m1_piazza_c',
        palazzo_se:'m1_piazza_d', palazzo_bar:'m1_piazza_e', palazzo_banca:'m1_piazza_f'
      };
      const img = this.images[m1Facade[kind]];
      if (img && img.width && img.height) {
        // Rasterizzazione a 2 px per uploaded M1: risoluzione e pixel art uniformi.
        // L'aspect-fit non deforma l'asset; le bande laterali/create dal diverso
        // rapporto vengono ricomposte con le campate laterali dell'edificio, non
        // lasciate vuote. Così le facciate non sembrano sprite incollati a caso.
        const PIX = 2;
        const low = cv(Math.ceil(W / PIX), Math.ceil(H / PIX));
        const lx = ctx(low); lx.imageSmoothingEnabled = true;
        const scale = Math.min(low.width / img.width, low.height / img.height);
        const dw = Math.max(1, Math.round(img.width * scale));
        const dh = Math.max(1, Math.round(img.height * scale));
        const dx = Math.floor((low.width - dw) / 2), dy = low.height - dh;
        lx.drawImage(img, dx, dy, dw, dh);
        // Ricomposizione architettonica dei vuoti laterali: specchia le ali
        // dell'edificio senza ripetere il portale centrale.
        const strip = Math.max(6, Math.min(20, Math.floor(dw * 0.18)));
        for (let out = 0; out < dx; ) {
          const sw = Math.min(strip, dx - out);
          lx.save();
          lx.translate(out + sw, 0); lx.scale(-1, 1);
          lx.drawImage(low, dx, 0, sw, low.height, 0, 0, sw, low.height);
          lx.restore();
          if (out + sw < dx) px(lx, out + sw, 0, 1, low.height, 'rgba(0,0,0,.10)');
          out += sw;
        }
        const rightStart = dx + dw;
        for (let out = 0; out < low.width - rightStart; ) {
          const sw = Math.min(strip, low.width - rightStart - out);
          lx.save();
          lx.translate(rightStart + out + sw, 0); lx.scale(-1, 1);
          lx.drawImage(low, rightStart - sw, 0, sw, low.height, 0, 0, sw, low.height);
          lx.restore();
          if (out > 0) px(lx, rightStart + out, 0, 1, low.height, 'rgba(0,0,0,.10)');
          out += sw;
        }
        // Colmare l'eventuale fascia superiore con cornice/colori del tetto.
        if (dy > 0) {
          px(lx, 0, 0, low.width, dy, S.roof);
          px(lx, 0, dy - 1, low.width, 1, shade(S.roof, 18));
        }
        x.imageSmoothingEnabled = false;
        x.drawImage(low, 0, 0, W, H);
      } else if (S.proc) {
        // Nuove zone senza asset M1: facciata procedurale con architettura regolare.
        this._facadeProcedural(kind, S, x, W, H, R);
      } else {
        // Fallback senza duplicazioni: solo portone in scala, nessuna finestra generated.
        const dx = Math.floor(W / 2) - 9;
        px(x, dx, H - 40, 18, 40, '#5a4028');
        px(x, dx + 8, H - 39, 2, 39, '#3f2c1f');
      }
      // Finiture comuni: cornice, basamento in piperno e luce da sinistra/alto.
      // Le nuove facciate disegnano cornici e plinti propri, coerenti col materiale.
      if (!S.proc) {
        px(x, -2, 0, W + 4, 8, S.roof); px(x, -1, 8, W + 2, 2, shade(S.roof, 16));
        px(x, 0, H - 10, W, 10, '#4a4a48'); px(x, 0, H - 10, W, 2, '#6a6c68');
        px(x, 0, H - 2, W, 2, '#2f3130');
      }
      const light = x.createLinearGradient(0, 0, W, 0);
      light.addColorStop(0, 'rgba(255,244,214,.10)');
      light.addColorStop(.55, 'rgba(255,244,214,0)');
      light.addColorStop(1, 'rgba(18,22,28,.16)');
      x.fillStyle = light; x.fillRect(0, 0, W, H);
      const falloff = x.createLinearGradient(0, 0, 0, H);
      falloff.addColorStop(0, 'rgba(255,255,255,.03)');
      falloff.addColorStop(1, 'rgba(0,0,0,.08)');
      x.fillStyle = falloff; x.fillRect(0, 0, W, H);
      return this.cache[key] = c;
    },
    /* Facciate dei nuovi contesti: senza asset M1 dedicati l'architettura viene
     * ricostruita (finestre regolari, cornici, plinti, materiali) con RNG per kind. */
    _facadeProcedural(kind, S, x, W, H, R) {
      const poly = (pts, col) => {
        x.fillStyle = col; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]);
        x.closePath(); x.fill();
      };
      const noise = n => {
        for (let i = 0; i < n; i++) px(x, (R() * W) | 0, (R() * H) | 0, 1, 1,
          R() > .5 ? 'rgba(255,255,255,.055)' : 'rgba(0,0,0,.055)');
      };
      const cornice = (y, h, col) => {
        px(x, 0, y, W, h, col); px(x, 0, y, W, 1, shade(col, 22));
        px(x, 0, y + h - 1, W, 1, shade(col, -24));
      };
      const plinth = (h, col) => {
        px(x, 0, H - h, W, h, col); px(x, 0, H - h, W, 2, shade(col, 24));
        px(x, 0, H - 2, W, 2, shade(col, -28));
      };
      const win = (wx, wy, ww, wh, frame, glass, sill) => {
        px(x, wx, wy, ww, wh, frame || '#6e6a60');
        px(x, wx + 2, wy + 2, ww - 4, wh - 4, glass || '#7597a4');
        px(x, wx + 2, wy + 2, ww - 4, 2, 'rgba(255,255,255,.28)');
        px(x, wx + 2, wy + wh - 5, ww - 4, 3, 'rgba(20,28,34,.32)');
        px(x, wx - 1, wy + wh, ww + 2, 2, sill || S.trim);
      };
      const grid = (cols, rows, x0, y0, sx, sy, ww, wh, fn) => {
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const wx = x0 + c * sx, wy = y0 + r * sy;
          if (fn) fn(wx, wy, ww, wh, r, c);
          else win(wx, wy, ww, wh);
        }
      };
      const arch = (ax, ay, aw, ah, frame, glass) => {
        x.fillStyle = frame; x.beginPath();
        x.arc(ax + aw / 2, ay + aw / 2, aw / 2, Math.PI, 0); x.fill();
        px(x, ax, ay + aw / 2, aw, ah - aw / 2, frame);
        x.fillStyle = glass; x.beginPath();
        x.arc(ax + aw / 2, ay + aw / 2, aw / 2 - 3, Math.PI, 0); x.fill();
        px(x, ax + 3, ay + aw / 2, aw - 6, ah - aw / 2 - 2, glass);
      };
      const door = (dx, dy, dw, dh, leaf) => {
        leaf = leaf || '#6f5237';
        px(x, dx - 3, dy - 3, dw + 6, 3, S.trim);
        px(x, dx, dy, dw, dh, '#4a3a2c');
        px(x, dx + 2, dy + 2, dw - 4, dh - 2, leaf);
        px(x, dx + dw / 2 - 1, dy + 3, 2, dh - 3, shade(leaf, -26));
        px(x, dx + dw - 5, dy + dh / 2, 2, 2, '#d4b04f');
      };
      noise((W * H / 26) | 0);
      switch (kind) {
        case 'fuorigrotta_blocco': {
          // Blocco razionalista: 5 piani, griglia regolare, tetto piano.
          grid(9, 5, 12, 18, 20, 24, 11, 14, (wx, wy, ww, wh, r, c) => {
            if (r === 4 && c === 4) return;
            win(wx, wy, ww, wh, '#7a7569', '#708c99');
          });
          for (const yy of [38, 62, 86, 110]) cornice(yy, 2, '#c3c0b5');
          door(88, 114, 16, 18);
          cornice(0, 8, S.roof);
          plinth(12, '#8f8c82');
          break;
        }
        case 'fuorigrotta_torre': {
          // Torre razionalista: 8 piani, finestre più alte e marcapiani stretti.
          // Passo di piano 26 px = 3,25 m: dentro il limite documentato di 3,3 m.
          grid(6, 8, 8, 16, 24, 26, 13, 17, (wx, wy, ww, wh, r, c) => {
            if (r === 7 && (c === 2 || c === 3)) return;
            win(wx, wy, ww, wh, '#78746a', '#6f8a97');
          });
          for (const yy of [38, 64, 90, 116, 142, 168, 194]) cornice(yy, 2, '#c1beb3');
          door(72, 196, 16, 25);
          cornice(0, 8, S.roof);
          plinth(12, '#8b887f');
          break;
        }
        case 'fuorigrotta_teatro': {
          // Teatro Mediterraneo: volume basso, ali a ritmo verticale e baia vetrata.
          cornice(0, 12, S.roof); px(x, 0, 12, W, 4, '#c6c8bf');
          for (let wx = 18; wx < 180; wx += 22) {
            px(x, wx, 40, 13, 168, '#9fa9a6'); px(x, wx + 2, 44, 9, 160, '#7fa7b3');
            px(x, wx + 2, 44, 9, 3, 'rgba(255,255,255,.28)'); px(x, wx, 208, 13, 3, '#b6b5aa');
          }
          for (let wx = 380; wx < 545; wx += 22) {
            px(x, wx, 40, 13, 168, '#9fa9a6'); px(x, wx + 2, 44, 9, 160, '#7fa7b3');
            px(x, wx + 2, 44, 9, 3, 'rgba(255,255,255,.28)'); px(x, wx, 208, 13, 3, '#b6b5aa');
          }
          px(x, 182, 36, 196, 180, '#8d948e'); px(x, 186, 40, 188, 172, '#79a8b6');
          for (let mx = 186; mx < 374; mx += 14) px(x, mx, 40, 2, 172, '#c3c7c0');
          for (const my of [80, 120, 160]) px(x, 186, my, 188, 2, '#c3c7c0');
          px(x, 186, 40, 188, 3, 'rgba(255,255,255,.24)');
          cornice(216, 5, '#c1c0b5'); door(260, 221, 40, 51, '#5d6b70');
          px(x, 236, H - 8, 88, 8, '#a9a79c');
          break;
        }
        case 'fuorigrotta_stadio': {
          // Stadio Maradona: ellisse di cemento, corsia in mattone e prato
          // rettangolare. La vista dall'alto è coerente con la camera del gioco
          // e con la pianta ellittica documentata da OSM way 22790881.
          ell(x, W / 2, H / 2 + 4, 101, 71, '#8e948e');
          ell(x, W / 2, H / 2 + 2, 98, 68, '#d4d5cd');
          ell(x, W / 2, H / 2 + 2, 88, 59, '#b56d55');
          ell(x, W / 2, H / 2 + 2, 82, 53, '#7d9b6d');
          const fx = W / 2, fy = H / 2 + 1;
          px(x, fx - 54, fy - 23, 108, 46, '#e7e5d6');
          px(x, fx - 51, fy - 20, 102, 40, '#628d54');
          px(x, fx - 51, fy - 20, 102, 3, '#77a365');
          px(x, fx - 1, fy - 20, 2, 40, '#e9e8d8');
          ell(x, fx, fy, 9, 9, 'rgba(233,232,216,.85)');
          for (let a = 0; a < 360; a += 15) {
            const rad = a * Math.PI / 180;
            px(x, fx + Math.round(Math.cos(rad) * 93), fy + 2 + Math.round(Math.sin(rad) * 63), 2, 2, '#a8aaa1');
          }
          for (const ex of [44, 96, 148]) {
            px(x, ex, H - 18, 16, 18, '#8f9490');
            px(x, ex + 2, H - 14, 12, 14, '#5f6663');
            px(x, ex + 6, H - 14, 4, 14, '#404745');
          }
          // Ali laterali: gradoni e servizi leggibili anche ai margini, non
          // semplici bande piatte create dall'aspect-fit.
          for (let sy = 12; sy < H - 12; sy += 10) {
            px(x, 0, sy, 18, 2, '#aeb2aa'); px(x, W - 18, sy, 18, 2, '#aeb2aa');
            px(x, 0, sy + 5, 12, 1, '#c4c7bd'); px(x, W - 12, sy + 5, 12, 1, '#c4c7bd');
            px(x, 4, sy + 2, 1, 4, '#8d938d'); px(x, W - 5, sy + 2, 1, 4, '#8d938d');
          }
          for (let sx = 0; sx < 18; sx += 4) {
            px(x, sx, 8, 2, H - 16, '#767e78');
            px(x, W - 2 - sx, 8, 2, H - 16, '#767e78');
          }
          px(x, 0, 0, W, 4, S.roof); px(x, 0, H - 4, W, 4, S.roof);
          px(x, 0, 0, 3, H, S.roof); px(x, W - 3, 0, 3, H, S.roof);
          break;
        }
        case 'fuorigrotta_mostra': {
          // Padiglione espositivo: campate vetrate continue tra pilastri in cemento.
          cornice(0, 10, S.roof); px(x, 0, 10, W, 6, '#d9d6ca');
          px(x, 8, 20, W - 16, 108, '#8ba7ac'); px(x, 10, 22, W - 20, 104, '#a8c8d0');
          for (let mx = 10; mx < W - 10; mx += 12) px(x, mx, 22, 2, 104, '#d7d8cf');
          px(x, 10, 70, W - 20, 2, '#d7d8cf');
          for (let px0 = 0; px0 <= W - 12; px0 += 40) {
            px(x, px0, 16, 12, 120, '#dcd9cf');
            px(x, px0, 16, 2, 120, '#f0ede2'); px(x, px0 + 10, 16, 2, 120, '#b4b0a4');
          }
          cornice(136, 6, '#cecabf'); plinth(12, '#9b978c');
          door(146, 118, 28, 30, '#788a8c');
          break;
        }
        case 'pianura_chiesa': {
          // San Giorgio Martire: facciata a capanna in tufo e campanile a destra.
          const fw = 244;
          poly([[0, 76], [122, 14], [fw, 76]], '#9a8262');
          poly([[6, 76], [122, 22], [fw - 6, 76]], S.wall);
          px(x, 0, 74, fw, 6, '#b6a488'); px(x, 0, 80, fw, H - 92, S.wall);
          for (const bx of [6, fw - 18]) px(x, bx, 82, 12, H - 94, '#c7b797');
          ell(x, 122, 54, 10, 10, '#9a8262'); ell(x, 122, 54, 7, 7, '#3f4547');
          ell(x, 122, 54, 5, 5, '#6f97a4');
          arch(96, 158, 52, 78, '#8e7c62', '#4b463f'); door(104, 190, 36, 46);
          arch(28, 120, 36, 50, '#9a8262', '#6d8f9c');
          arch(180, 120, 36, 50, '#9a8262', '#6d8f9c');
          plinth(12, '#8f7d61');
          const tx = 252;
          px(x, tx, 76, 64, H - 88, '#c7b797');
          px(x, tx, 76, 5, H - 88, '#a08d6e'); px(x, tx + 59, 76, 5, H - 88, '#a08d6e');
          poly([[tx - 4, 48], [tx + 32, 16], [tx + 68, 48]], '#9a8262');
          poly([[tx + 2, 48], [tx + 32, 22], [tx + 62, 48]], '#c7b797');
          px(x, tx - 4, 48, 72, 6, '#b6a488');
          arch(tx + 20, 52, 24, 30, '#8e7c62', '#4b463f');
          px(x, tx + 30, 64, 4, 12, '#d4b04f');
          break;
        }
        case 'pianura_borgo': {
          // Casa di borgo: tre piani, basamento in piperno e persiane verdi.
          px(x, 0, 0, W, 12, '#9b6b4b');
          for (let rx = 0; rx < W; rx += 8) px(x, rx, 2, 6, 2, '#b9815f');
          px(x, 0, 12, W, 4, '#b39b78');
          grid(4, 3, 12, 24, 36, 28, 14, 16, (wx, wy, ww, wh, r, c) => {
            if (r === 2 && c === 2) return;
            win(wx, wy, ww, wh, '#6b5540', '#5c7881');
            px(x, wx - 4, wy + 2, 4, 12, '#4f6f5a'); px(x, wx + ww, wy + 2, 4, 12, '#4f6f5a');
            px(x, wx - 4, wy + 2, 4, 1, '#6f8d76'); px(x, wx + ww, wy + 2, 4, 1, '#6f8d76');
          });
          door(70, 80, 20, 18, '#6b4b33'); plinth(16, '#414446');
          break;
        }
        case 'pianura_municipio': {
          // Municipio sobrio: sei assi di finestre e portale centrale.
          // Anche qui il passo di piano e' 26 px = 3,25 m.
          grid(11, 6, 15, 18, 27, 26, 14, 16, (wx, wy, ww, wh, r, c) => {
            if (r === 5 && (c === 5 || c === 6)) return;
            win(wx, wy, ww, wh, '#8c887c', '#718994');
          });
          for (const yy of [39, 65, 91, 117, 143]) cornice(yy, 3, '#bdb6a6');
          door(142, 144, 28, 36, '#6d6250');
          cornice(0, 10, S.roof); px(x, 112, 4, 88, 6, '#e6dfcd');
          plinth(14, '#868277');
          break;
        }
        case 'bacoli_terme': {
          // Ruderi romani: laterizio e cemento a vista, arcate e coronamento spezzato.
          for (let yy = 20; yy < H; yy += 10) {
            px(x, 0, yy, W, 1, 'rgba(88,58,44,.26)');
            for (let bx = (yy / 10 % 2) * 8; bx < W; bx += 16) px(x, bx, yy, 1, 9, 'rgba(88,58,44,.20)');
          }
          for (let i = 0; i < 6; i++) {
            const nx = 8 + i * 50 + ((R() * 9) | 0), ny = 16 + ((R() * 12) | 0);
            x.clearRect(nx, ny, 12 + ((R() * 14) | 0), 12 + ((R() * 8) | 0));
          }
          for (let ax = 18; ax < W - 30; ax += 58) {
            arch(ax, 62, 38, 62, '#8f6a55', '#51483f'); px(x, ax - 3, 124, 44, 3, '#a88b72');
          }
          for (let i = 0; i < 8; i++) {
            const bx = (R() * (W - 40)) | 0, by = 28 + ((R() * 90) | 0);
            px(x, bx, by, 20 + ((R() * 26) | 0), 6 + ((R() * 10) | 0), '#a8a396');
            px(x, bx, by, 20, 1, '#c3bfb3');
          }
          plinth(12, '#8a7d6c');
          break;
        }
        case 'bacoli_castello': {
          // Castello aragonese: tufo bugnato, merli e monofore strette.
          px(x, 0, 32, W, H - 44, S.wall);
          for (let yy = 44; yy < H - 12; yy += 12) {
            px(x, 0, yy, W, 1, 'rgba(110,92,66,.28)');
            for (let bx = (yy / 12 % 2) * 12; bx < W; bx += 24) px(x, bx, yy, 1, 11, 'rgba(110,92,66,.18)');
          }
          px(x, 0, 28, W, 6, '#b6a07c');
          for (let mx = 4; mx < W - 12; mx += 24) {
            px(x, mx, 10, 16, 18, '#c8b592'); px(x, mx, 10, 16, 2, '#dfcfae');
            px(x, mx, 26, 16, 2, '#8e7b60');
          }
          for (const tx of [0, W - 32]) {
            px(x, tx, 22, 32, H - 34, '#c2ae8b');
            px(x, tx, 22, 4, H - 34, '#9b8768'); px(x, tx + 28, 22, 4, H - 34, '#9b8768');
            for (let mx = tx + 2; mx < tx + 30; mx += 14) px(x, mx, 14, 10, 8, '#c8b592');
          }
          for (const yy of [64, 108]) for (let wx = 44; wx < W - 40; wx += 36) {
            px(x, wx, yy, 8, 12, '#5e5548'); px(x, wx + 1, yy + 1, 6, 10, '#3b3630');
            px(x, wx - 1, yy + 12, 10, 2, '#a08d6e');
          }
          arch(132, 112, 24, 52, '#8e7b60', '#3b3630'); plinth(12, '#7d6a52');
          break;
        }
        case 'caserta_reggia': {
          // Reggia di Caserta: 14 assi regolari, cornicioni continui e portale
          // centrale. Stesso passo di piano metrico del municipio (26 px = 3,25 m).
          grid(14, 6, 14, 18, 26, 26, 16, 16, (wx, wy, ww, wh, r, c) => {
            if (r === 5 && (c === 6 || c === 7)) return;
            win(wx, wy, ww, wh, '#a8a094', '#7894a1');
          });
          for (const yy of [39, 65, 91, 117, 143]) cornice(yy, 3, '#bdb5a6');
          door(178, 144, 28, 36, '#6d6250');
          cornice(0, 10, S.roof); px(x, 132, 4, 120, 6, '#e6dfcd');
          plinth(14, '#8f887b');
          break;
        }
        case 'salerno_arechi': {
          // Castello di Arechi: tufo, merli guelfi e monofore strette.
          px(x, 0, 26, W, H - 38, S.wall);
          for (let yy = 38; yy < H - 10; yy += 11) {
            px(x, 0, yy, W, 1, 'rgba(110,92,66,.26)');
            for (let bx = (yy / 11 % 2) * 10; bx < W; bx += 20) px(x, bx, yy, 1, 10, 'rgba(110,92,66,.18)');
          }
          for (let mx = 2; mx < W - 10; mx += 20) {
            px(x, mx, 8, 14, 18, S.wall); px(x, mx, 8, 14, 2, '#dfcfae');
          }
          px(x, 0, 24, W, 5, '#b6a07c');
          for (const ax of [38, 108, 178]) {
            px(x, ax, 52, 10, 16, '#5e5548'); px(x, ax + 1, 53, 8, 14, '#3b3630');
          }
          arch(94, 60, 36, 58, S.trim, '#3b3630'); plinth(12, '#7d6a52');
          break;
        }
        case 'salerno_palazzo': {
          // Palazzo del lungomare: tre piani, persiane e coronamento continuo.
          cornice(0, 8, S.roof);
          grid(5, 3, 12, 16, 28, 24, 14, 16, (wx, wy, ww, wh, r, c) => {
            if (r === 2 && c === 2) return;
            win(wx, wy, ww, wh, '#8d6f52', '#5f8291');
            px(x, wx - 3, wy + 2, 3, 12, '#4f6f5a'); px(x, wx + ww, wy + 2, 3, 12, '#4f6f5a');
          });
          for (const yy of [38, 62]) cornice(yy, 2, S.trim);
          door(70, 62, 20, 26, '#6b4b33'); plinth(12, '#7c6b54');
          break;
        }
        case 'bacoli_casa': {
          // Casa di pescatori: tufo chiaro, tetto a coppi e due finestre con persiane.
          px(x, 0, 12, W, H - 24, S.wall);
          for (let yy = 24; yy < H - 12; yy += 9) px(x, 0, yy, W, 1, 'rgba(120,98,70,.20)');
          px(x, 0, 0, W, 14, '#8e6b4d');
          for (let rx = 0; rx < W; rx += 8) {
            px(x, rx, 2, 6, 3, '#a97d59'); px(x, rx, 8, 6, 2, '#6f5237');
          }
          px(x, 0, 12, W, 3, '#b39b78');
          for (const wx of [18, 94]) {
            win(wx, 44, 16, 18, '#6b5540', '#5c7881');
            px(x, wx - 4, 46, 4, 14, '#4f6f5a'); px(x, wx + 16, 46, 4, 14, '#4f6f5a');
          }
          door(54, 62, 20, 24, '#6b4b33'); plinth(12, '#7c6b54');
          break;
        }
      }
    },
    gugliaSprite() {
      // I 22 m documentati riguardavano solo l'obelisco: l'intera Guglia
      // dell'Immacolata (gradinata, basamento, statua e coronamento) e' ~30 m.
      // L'asset M1 `guglia.png` resta autorevole (126x240 a 8 px/m); il fallback
      // code-drawn riproduce le stesse proporzioni senza caricare immagini.
      if (this.images.guglia) return this.images.guglia;
      const key = 'bld:guglia'; if (this.cache[key]) return this.cache[key];
      const W = CL.mpx(15.7), H = CL.mpx(30), c = cv(W, H), x = ctx(c), cx = W / 2;
      const poly = (pts, col) => {
        x.fillStyle = col; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]);
        x.closePath(); x.fill();
      };
      x.fillStyle = 'rgba(18,22,28,.18)';
      x.beginPath(); x.ellipse(cx, H - 5, 58, 5, 0, 0, Math.PI * 2); x.fill();
      // Gradinata: 4 m (32 px), larghezza massima 15,7 m (126 px).
      px(x, 0, 232, 126, 8, '#b8ac98'); px(x, 0, 232, 126, 2, '#e2d9c7');
      px(x, 0, 238, 126, 2, '#958a78');
      px(x, 6, 222, 114, 10, '#cec3b0'); px(x, 6, 222, 114, 2, '#ece3d1');
      px(x, 12, 212, 102, 10, '#c3b7a4'); px(x, 12, 212, 102, 2, '#ded4c2');
      px(x, 18, 208, 90, 4, '#d5ccbc'); px(x, 18, 208, 90, 2, '#efe7d7');
      // Basamento a gradoni con quattro statue: 8 m (64 px), marmo e bardiglio.
      px(x, 19, 196, 88, 12, '#d5ccbc'); px(x, 19, 196, 88, 2, '#e2dacc');
      px(x, 19, 206, 88, 2, '#7c7f86');
      px(x, 22, 184, 82, 12, '#e2dacc'); px(x, 22, 184, 82, 2, '#efe7d7');
      for (const bx of [26, 48, 70, 92]) px(x, bx, 187, 14, 6, '#7c7f86');
      px(x, 19, 156, 88, 28, '#d5ccbc'); px(x, 19, 156, 88, 2, '#efe7d7');
      for (const sx of [28, 52, 76, 100]) {
        px(x, sx - 8, 160, 16, 22, '#e2dacc'); px(x, sx - 6, 162, 12, 18, '#b8ac98');
        px(x, sx - 3, 166, 6, 11, '#cfc5b2'); px(x, sx - 2, 163, 4, 4, '#dcd2bf');
        px(x, sx - 7, 180, 14, 2, '#7c7f86');
      }
      px(x, 13, 150, 100, 6, '#d5ccbc'); px(x, 13, 150, 100, 2, '#efe7d7');
      px(x, 13, 154, 100, 2, '#7c7f86');
      px(x, 35, 144, 56, 6, '#e2dacc'); px(x, 35, 144, 56, 2, '#efe7d7');
      px(x, 35, 148, 56, 2, '#a49a88');
      // Fusto: 13 m (104 px), rastremato 24 -> 18 px, con inserti in bardiglio.
      poly([[51, 143], [75, 143], [72, 40], [54, 40]], '#d5ccbc');
      poly([[51, 143], [62, 143], [61, 40], [54, 40]], '#e2dacc');
      poly([[62, 143], [75, 143], [72, 40], [61, 40]], '#bfb4a2');
      poly([[71, 143], [75, 143], [72, 40], [70, 40]], '#7c7f86');
      for (const yy of [122, 92, 62]) px(x, 52, yy, 22, 2, '#7c7f86');
      for (const yy of [108, 78]) { px(x, 49, yy, 3, 6, '#d4b04f'); px(x, 74, yy, 3, 6, '#d4b04f'); }
      // Immacolata e coronamento in rame verde/dorato: 5 m (40 px).
      px(x, 51, 36, 24, 4, '#d5ccbc'); px(x, 53, 36, 20, 2, '#e2dacc');
      ell(x, 63, 10, 8, 8, '#d4b04f'); ell(x, 63, 10, 6, 6, '#e2dacc');
      poly([[55, 36], [71, 36], [68, 16], [58, 16]], '#4f9a86');
      poly([[55, 36], [61, 36], [60, 16], [58, 16]], '#79bca7');
      px(x, 61, 13, 4, 4, '#63ad97'); ell(x, 63, 10, 3, 3, '#a9d6c4');
      px(x, 57, 20, 3, 14, '#4f9a86'); px(x, 66, 20, 3, 14, '#4f9a86');
      px(x, 62, 0, 2, 8, '#d4b04f'); px(x, 59, 2, 8, 2, '#f2d66b');
      return this.cache[key] = c;
    },
    campanileSprite() {
      // Campanile di Santa Chiara: 48 m (tag OSM `height=48 m`), 14 m di pianta.
      // A 8 px/m il fallback e' 112x384: tre ordini in laterizio, cella campanaria
      // e cuspide in maioliche; il PNG resta prioritario quando disponibile.
      if (this.images.campanile) return this.images.campanile;
      const key = 'bld:campanile'; if (this.cache[key]) return this.cache[key];
      const W = CL.mpx(14), H = CL.mpx(48), c = cv(W, H), x = ctx(c), cx = W / 2;
      const poly = (pts, col) => {
        x.fillStyle = col; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]);
        x.closePath(); x.fill();
      };
      // Base scarpata: 8 m (64 px), da 112 a 80 px.
      poly([[18, 320], [94, 320], [112, 383], [0, 383]], '#8d7259');
      poly([[18, 320], [56, 320], [56, 383], [0, 383]], '#a08469');
      px(x, 0, 383, 112, 1, '#6f5b48'); px(x, 16, 316, 80, 4, '#d6cbb7');
      px(x, 16, 316, 80, 1, '#eee5d3');
      // Primo ordine: 12 m (96 px), tre assi di monofore.
      px(x, 18, 224, 76, 92, '#a85b46'); px(x, 18, 224, 5, 92, '#8d4938'); px(x, 89, 224, 5, 92, '#8d4938');
      for (const yy of [236, 266, 296]) {
        px(x, 18, yy, 76, 2, '#8d4938');
        for (const xx of [30, 52, 74]) { px(x, xx, yy + 4, 9, 16, '#3d4147'); px(x, xx + 1, yy + 5, 7, 14, '#e7dfcf'); }
      }
      // Secondo ordine: 11 m (88 px), due assi.
      px(x, 14, 216, 84, 8, '#d6cbb7'); px(x, 16, 216, 80, 2, '#eee5d3');
      px(x, 18, 136, 76, 80, '#a85b46'); px(x, 18, 136, 5, 80, '#8d4938'); px(x, 89, 136, 5, 80, '#8d4938');
      for (const yy of [148, 180]) {
        px(x, 18, yy, 76, 2, '#8d4938');
        for (const xx of [34, 62]) { px(x, xx, yy + 4, 10, 18, '#3d4147'); px(x, xx + 1, yy + 5, 8, 16, '#e7dfcf'); }
      }
      // Terzo ordine: 8 m (64 px), monofore più strette.
      px(x, 14, 128, 84, 8, '#d6cbb7'); px(x, 16, 128, 80, 2, '#eee5d3');
      px(x, 20, 72, 72, 56, '#a85b46'); px(x, 20, 72, 5, 56, '#8d4938'); px(x, 87, 72, 5, 56, '#8d4938');
      for (const xx of [32, 56, 80]) { px(x, xx, 88, 8, 20, '#3d4147'); px(x, xx + 1, 89, 6, 18, '#e7dfcf'); }
      // Cella campanaria: 6 m (48 px), tre archetti con campane in bronzo.
      px(x, 16, 68, 80, 4, '#d6cbb7');
      px(x, 18, 24, 76, 44, '#c4b7a0'); px(x, 20, 26, 72, 40, '#d8cdb8');
      for (const ax of [26, 50, 74]) {
        x.fillStyle = '#3d4147'; x.beginPath(); x.arc(ax + 6, 40, 7, Math.PI, 0); x.fill();
        px(x, ax, 40, 12, 18, '#3d4147');
        px(x, ax + 4, 42, 4, 14, '#c9a44a'); px(x, ax + 2, 32, 8, 2, '#e7dfcf');
      }
      // Cuspide a maioliche: 3 m (24 px).
      px(x, 14, 22, 84, 4, '#6b5540');
      poly([[10, 22], [56, 0], [102, 22]], '#8b4a3a');
      poly([[18, 22], [56, 4], [94, 22]], '#3f8f86');
      poly([[30, 22], [56, 8], [82, 22]], '#d9b24f');
      px(x, 55, 0, 3, 4, '#d4b04f');
      return this.cache[key] = c;
    },
    _propSprite(kind) {
      if (this.images[kind]) return this.images[kind];
      // M1 extracted image props mapped to generic kinds
      const m1 = {
        church_pew:'m1_church_pew', church_column:'m1_church_column', church_arch:'m1_church_arch',
        church_altar:'m1_church_altar', church_altar2:'m1_church_altar2', church_painting1:'m1_church_painting1',
        church_candle:'m1_church_candle', church_statue:'m1_church_statue',
        bar_counter:'m1_bar_counter', bar_shelf:'m1_bar_shelf', bar_table:'m1_bar_table', bar_detail:'m1_bar_detail',
        piazza_strip:'m1_piazza_strip',
        ns_palazzo1:'m1_ns_palazzo1', ns_palazzo2:'m1_ns_palazzo2', ns_palazzo3:'m1_ns_palazzo3',
        pizzeria_oven:'m1_pizzeria_oven', pizzeria_counter:'m1_pizzeria_counter', pizzeria_table:'m1_pizzeria_table',
        metro_hall:'m1_metro_hall', metro_platform:'m1_metro_platform', metro_gate:'m1_metro_gate'
      };
      if (m1[kind] && this.images[m1[kind]]) return this.images[m1[kind]];
      const key='prop:'+kind; if(this.cache[key]) return this.cache[key];
      let c,x;
      if(kind==='lamp'){ c=cv(24,52); x=ctx(c); px(x,10,20,4,30,'#3b4248'); px(x,8,18,8,4,'#2f353b'); px(x,7,8,10,11,'#f6e7a2'); px(x,6,6,12,3,'#4a5158'); px(x,9,2,6,5,'#3d444b'); x.fillStyle='rgba(255,240,170,.14)'; x.beginPath(); x.arc(12,13,14,0,Math.PI*2); x.fill(); px(x,8,48,8,3,'#4a5158'); }
      else if(kind==='bench'){ c=cv(36,22); x=ctx(c); px(x,2,9,32,4,'#6d4a2f'); px(x,3,4,30,6,'#855d3b'); px(x,3,5,30,1,'#9a7048'); px(x,5,13,3,7,'#4a382b'); px(x,28,13,3,7,'#4a382b'); px(x,4,3,28,2,'#704d31'); }
      else if(kind==='edicola'){ c=cv(48,52); x=ctx(c); px(x,2,12,44,34,'#2f6a4d'); px(x,4,16,40,24,'#f3ecd8'); px(x,6,18,12,7,'#c9564a'); px(x,20,18,10,7,'#4a87b8'); px(x,32,18,8,7,'#7a9a5a'); px(x,6,27,10,6,'#e0ab69'); px(x,18,27,10,6,'#d9c7a5'); px(x,4,40,40,4,'#6b5632'); px(x,0,8,48,6,'#8a7046'); px(x,2,44,44,4,'#5a4528'); px(x,-1,6,50,4,'#9a8052'); }
      else if(kind==='plant'){ c=cv(18,22); x=ctx(c); px(x,6,13,6,7,'#8b6244'); px(x,5,12,8,2,'#a07050'); x.fillStyle='#5f9a4e'; x.beginPath(); x.arc(9,8,7,0,Math.PI*2); x.fill(); x.fillStyle='#7ab868'; x.beginPath(); x.arc(7,7,3,0,Math.PI*2); x.fill(); x.fillStyle='#d96f8b'; px(x,11,6,2,2,'#d96f8b'); }
      else if(kind==='cart'){ c=cv(40,28); x=ctx(c); px(x,4,10,28,10,'#7a5637'); px(x,5,11,26,8,'#986d48'); px(x,6,4,24,8,'#c9564a'); px(x,8,6,4,4,'#f2d24f'); px(x,14,6,4,4,'#e0ab69'); px(x,20,6,4,4,'#f0e4cf'); px(x,6,20,6,6,'#4a382b'); px(x,24,20,6,6,'#4a382b'); px(x,7,21,4,4,'#8b8f95'); px(x,25,21,4,4,'#8b8f95'); }
      else if(kind==='sign'){ c=cv(28,34); x=ctx(c); px(x,12,14,4,18,'#65432e'); px(x,2,2,24,14,'#f0e4cf'); px(x,2,2,24,2,'#7a5637'); px(x,4,6,20,2,'#b44a3a'); px(x,6,10,16,2,'#5a7a8f'); }
      else if(kind==='table_out'){ c=cv(28,20); x=ctx(c); px(x,2,8,24,4,'#8b6244'); px(x,3,6,22,3,'#a07050'); px(x,4,12,3,6,'#65432e'); px(x,21,12,3,6,'#65432e'); px(x,12,4,4,3,'#f0e4cf'); }
      else if(kind==='chair_out'){ c=cv(14,18); x=ctx(c); px(x,3,2,8,6,'#7a5637'); px(x,3,8,8,3,'#986d48'); px(x,3,11,2,5,'#65432e'); px(x,9,11,2,5,'#65432e'); }
      else if(kind==='home_rug'){ c=cv(56,24); x=ctx(c); px(x,0,0,56,24,'#7a2f38'); px(x,3,3,50,18,'#b8444a'); px(x,6,6,44,12,'#2f6070'); px(x,9,9,38,6,'#d8a94f'); for(let i=12;i<44;i+=8){ px(x,i,9,2,6,'#8e3340'); px(x,i+2,11,4,2,'#e8d7a8'); } px(x,0,0,56,2,'#e0b95e'); px(x,0,22,56,2,'#e0b95e'); }
      else if(kind==='home_books'){ c=cv(42,52); x=ctx(c); px(x,0,0,42,52,'#6b4b33'); px(x,2,2,38,48,'#8b6244'); const cols=['#c9564a','#4a87b8','#e9b84a','#7a9a5a','#f0e4cf','#8a6fa8']; for(let s=0;s<3;s++){ const by=5+s*15; px(x,4,by+11,34,3,'#5e4028'); for(let i=0;i<7;i++){ px(x,5+i*5,by+2+(i%2),4,9,cols[(i+s)%cols.length]); px(x,5+i*5,by+2+(i%2),4,1,'#f3efe6'); } } px(x,0,0,42,3,'#9b7349'); }
      else if(kind==='home_lamp'){ c=cv(22,52); x=ctx(c); x.fillStyle='rgba(255,220,150,.15)'; x.beginPath(); x.arc(11,15,15,0,Math.PI*2); x.fill(); px(x,9,20,4,24,'#8b7048'); px(x,6,44,10,4,'#5e4a30'); px(x,3,6,16,15,'#d8a94f'); px(x,5,4,12,4,'#f0d58a'); px(x,3,19,16,3,'#a87c3c'); px(x,6,9,10,7,'#fff0b8'); }
      else if(kind==='home_plant'){ c=cv(24,30); x=ctx(c); px(x,7,20,10,9,'#a05f3f'); px(x,6,18,12,3,'#c07a52'); px(x,9,27,6,3,'#7a4930'); x.fillStyle='#4f8a4c'; x.beginPath(); x.arc(12,12,8,0,Math.PI*2); x.fill(); x.fillStyle='#6faa5c'; x.beginPath(); x.arc(8,10,4,0,Math.PI*2); x.fill(); x.fillStyle='#8fbe70'; x.beginPath(); x.arc(16,9,4,0,Math.PI*2); x.fill(); px(x,11,8,2,8,'#3f6f3b'); }
      else if(kind==='home_painting'){ c=cv(34,26); x=ctx(c); px(x,0,0,34,26,'#8b6244'); px(x,2,2,30,22,'#d8b86a'); px(x,4,4,26,18,'#8fc3d8'); px(x,4,15,26,7,'#6f9a5c'); px(x,12,8,10,10,'#f0e4cf'); px(x,14,6,6,5,'#c9564a'); px(x,0,0,34,2,'#b08a45'); px(x,0,24,34,2,'#b08a45'); }
      else { c=cv(16,16); x=ctx(c); px(x,0,0,16,16,'#d44d9a'); }
      return this.cache[key]=c;
    },

    /* ----------------------------------------------------------- icone UI */
    iconData(name) {
      const key = 'icon' + name; if (this.cache[key]) return this.cache[key];
      const c = cv(12, 12), x = ctx(c), wood = '#8b6244';
      const set = (a, b, w, h, col) => px(x, a, b, w, h, col);
      switch (name) {
        case 'bread': set(1, 4, 10, 6, '#c98a4b'); set(2, 3, 8, 2, '#e0ab69'); set(2, 9, 8, 1, '#a06a35'); break;
        case 'cup': set(2, 4, 7, 6, '#f0ead6'); set(3, 3, 5, 2, '#6b4534'); set(9, 5, 2, 3, '#f0ead6'); break;
        case 'arancino': ell(x, 6, 7, 4, 4, '#e8a13c'); ell(x, 5, 6, 2, 2, '#f4c45d'); break;
        case 'pizza': set(1, 3, 10, 7, '#e8bf72'); set(2, 4, 8, 5, '#d9543f'); set(4, 5, 2, 2, '#f2e2a0'); set(7, 6, 2, 2, '#f2e2a0'); break;
        case 'fish': ell(x, 6, 6, 4, 3, '#5fa8b8'); set(1, 5, 3, 3, '#3f8ba0'); set(8, 5, 1, 1, '#1c2830'); break;
        case 'bottle': set(5, 1, 3, 3, '#7fb8c4'); set(4, 4, 5, 7, '#3f8fae'); set(5, 6, 3, 3, '#cde8e8'); break;
        case 'flower': set(5, 5, 2, 6, '#4f8a4c'); ell(x, 6, 4, 3, 3, '#e88fae'); set(6, 4, 1, 1, '#f2d24f'); break;
        case 'box': set(2, 4, 8, 6, '#6b3e5b'); set(5, 4, 2, 6, '#e9b84a'); set(2, 6, 8, 1, '#e9b84a'); break;
        case 'net': set(2, 3, 8, 7, '#8fa7a0'); for (let i = 0; i < 4; i++) { set(2 + i * 2, 3, 1, 7, '#d8e2d8'); set(2, 3 + i * 2, 8, 1, '#d8e2d8'); } set(9, 2, 1, 9, wood); break;
        case 'rod': set(9, 1, 1, 10, wood); set(3, 1, 6, 1, '#d8d2b8'); set(3, 1, 1, 4, '#d8d2b8'); break;
        case 'bike': ell(x, 2, 8, 2, 2, '#2b3036'); ell(x, 10, 8, 2, 2, '#2b3036'); set(3, 6, 6, 1, '#4f8f6a'); set(5, 4, 4, 1, '#4f8f6a'); break;
        case 'scooter': ell(x, 3, 9, 2, 2, '#2b3036'); ell(x, 10, 9, 2, 2, '#2b3036'); set(3, 5, 7, 4, '#c94f43'); set(9, 3, 1, 4, '#3b4045'); break;
        case 'car': ell(x, 3, 9, 2, 2, '#2b3036'); ell(x, 10, 9, 2, 2, '#2b3036'); set(1, 5, 10, 4, '#3f8fae'); set(3, 4, 6, 2, '#8fc9d6'); break;
        case 'map': set(1, 2, 10, 8, '#e8d7a8'); set(2, 3, 1, 6, '#b96b42'); set(6, 4, 1, 5, '#b96b42'); set(2, 6, 8, 1, '#b96b42'); break;
        case 'umbrella': ell(x, 6, 5, 5, 3, '#c94f43'); set(5, 7, 2, 4, wood); break;
        case 'hat': ell(x, 6, 7, 5, 2, '#e8cf8a'); set(3, 5, 6, 3, '#e8cf8a'); set(3, 7, 6, 1, '#a3834d'); break;
        case 'shirt': set(3, 3, 6, 8, '#5b8fa6'); set(1, 4, 2, 4, '#5b8fa6'); set(9, 4, 2, 4, '#5b8fa6'); break;
        case 'key': ell(x, 4, 4, 2, 2, '#e9b84a'); set(5, 5, 5, 2, '#e9b84a'); set(8, 7, 2, 2, '#e9b84a'); break;
        case 'trophy': set(4, 2, 4, 5, '#e9b84a'); set(3, 7, 6, 2, '#c9962c'); set(5, 9, 2, 2, '#c9962c'); break;
        default: ell(x, 6, 6, 4, 4, '#9fb3b8');
      }
      return this.cache[key] = c.toDataURL();
    }
  };
})(window);
