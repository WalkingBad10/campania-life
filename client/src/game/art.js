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
      if (this._imgReady) return;
      const files = {
        gesu: 'gesu-facade.png', guglia: 'guglia.png',
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
      for (const [k, f] of Object.entries(files)) {
        const img = new Image(); img.decoding = 'async'; img.src = this.assetUrl(f);
        img.onload = () => { this.images[k] = img; }; img.onerror = () => { /* fallback code-drawn */ };
      }
      this._imgReady = true;
    },
    px, shade, ell, cv, ctx,

    /* --------------------------------------------------------- tiles 16x16 */
    buildTiles() {
      for (const ch of ".TD,rpSW~#=fcoXBo^gkPCVZOH'LFKQYIUENJAMRZhjlnqstuvwxyz1234567890") this.tiles[ch] = this.tile(ch);
      // Varianti deterministiche: la griglia resta invariata, cambia solo il disegno.
      for (let v = 0; v < 4; v++) {
        this.tiles['D' + v] = this.variantTile('D', v);
        this.tiles['p' + v] = this.variantTile('p', v);
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
      if ((ch === 'D' || ch === 'p') && this.tiles[ch + (U.hash(ch + ':' + tx + ':' + ty) % 4)]) {
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
    tree(variant) {
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
    lemonTree(variant) {
      const c = this.tree(variant), key = 'lemon' + variant;
      if (this.cache[key]) return this.cache[key];
      const n = cv(32, 40), x = ctx(n); x.drawImage(c, 0, 0);
      [[9, 16], [22, 21], [15, 10], [25, 13]].forEach(([a, b]) => { px(x, a, b, 2, 3, '#f2d24f'); px(x, a, b, 1, 1, '#fff0a0'); });
      return this.cache[key] = n;
    },
    rock(variant) {
      const key = 'rock' + variant; if (this.cache[key]) return this.cache[key];
      const c = cv(20, 14), x = ctx(c);
      ell(x, 10, 9, 9, 5, P.dark); ell(x, 10, 8, 8, 5, P.stone); ell(x, 7, 6, 4, 3, P.stoneL);
      px(x, 12, 9, 3, 1, P.stoneD);
      return this.cache[key] = c;
    },
    flower(variant) {
      const key = 'flower' + variant; if (this.cache[key]) return this.cache[key];
      const c = cv(8, 10), x = ctx(c), col = ['#f2d24f', '#e88fae', '#f3f0e0', '#c58fe0'][variant % 4];
      px(x, 3, 5, 1, 5, '#4f8a4c'); px(x, 3, 6, 3, 1, '#4f8a4c');
      px(x, 2, 2, 3, 2, col); px(x, 3, 1, 1, 4, col); px(x, 3, 3, 1, 1, '#e8a13c');
      return this.cache[key] = c;
    },
    fountain() {
      if (this.cache.fountain) return this.cache.fountain;
      const c = cv(32, 26), x = ctx(c);
      ell(x, 16, 19, 14, 6, P.dark); ell(x, 16, 18, 13, 5, P.stoneL); ell(x, 16, 18, 10, 3, '#6fa9b8');
      px(x, 14, 8, 4, 10, P.stone); px(x, 13, 7, 6, 2, P.stoneL);
      ell(x, 16, 6, 3, 3, '#8fcdd4'); px(x, 16, 9, 1, 3, '#bfe6e8');
      return this.cache.fountain = c;
    },

    /* ---------------------------------------------------------- personaggi */
    character(look, dir, frame) {
      const key = ['c4', look.hair, look.skin, look.shirt, look.pants, dir, frame].join('|');
      if (this.cache[key]) return this.cache[key];
      const c = cv(16, 24), x = ctx(c), d = P.dark;
      const skinD = shade(look.skin, -22), skinL = shade(look.skin, 12);
      const shirtD = shade(look.shirt, -28), shirtL = shade(look.shirt, 16);
      const hairD = shade(look.hair, -28), hairL = shade(look.hair, 18);
      const pantsD = shade(look.pants, -24), pantsL = shade(look.pants, 14);
      const shoe = '#4a3a32', shoeD = '#352922';
      const f = frame % 4;
      const bob = (f === 1 || f === 3) ? -1 : 0;
      const legA = f === 1 ? 2 : f === 3 ? -2 : 0;
      const armA = f === 1 ? -1 : f === 3 ? 1 : 0;
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
      const bx = isSide ? 5 : 4, bw = isSide ? 6 : 8;
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
      return this.cache[key] = c;
    },

    /* ------------------------------------------------------------- creature */
    creature(id, frame) {
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
    vehicle(type, dir) {
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
      const big = this.character(look, 'down', 0);
      x.imageSmoothingEnabled = false;
      x.drawImage(big, 3, -6, 16 * 2, 24 * 2);
      x.fillStyle = 'rgba(10,16,24,.15)'; x.fillRect(0, 25, 32, 7);
    },

    /* ------------------------------------------------------ asset pack Napoli */
    // Sprite originali generati a runtime (code-drawn). Non equivalenti a un asset pack
    // professionale disegnato a mano, ma coerenti, cacheati e sostituibili.
    _stamp(c, fn) { const x = ctx(c); fn(x, c.width, c.height); return c; },
    buildingSprite(kind) {
      // Le facciate devono passare dal compositore: le PNG M1 restano come overlay,
      // così le bande trasparenti non mostrano il basolato sottostante.
      const composed = ['gesu', 'palazzo_ne', 'palazzo_sw', 'palazzo_banca', 'palazzo_bar', 'palazzo_se', 'palazzo_e'];
      if (this.images[kind] && !composed.includes(kind)) return this.images[kind];
      const key = 'bld:' + kind; if (this.cache[key]) return this.cache[key];
      const S = {
        gesu:      { w: 352, h: 208, wall:'#6a6f74', trim:'#8f9499', roof:'#5a4a3a' },
        palazzo_ne:{ w: 320, h: 192, wall:'#dccba8', trim:'#8a6540', roof:'#8b4a3a', shutters:'#5e7a4a' },
        palazzo_sw:{ w: 256, h: 128, wall:'#e2d3b4', trim:'#7a5a38', roof:'#9a5540', shutters:'#6f8650' },
        palazzo_banca:{ w:160,h:128, wall:'#ddd0bc', trim:'#657a8e', roof:'#7a5842', shutters:'#708090' },
        palazzo_bar:{ w:128, h:128, wall:'#e4d5bd', trim:'#7a4a32', roof:'#8b4a3a', shutters:'#6b7a46' },
        palazzo_se:{ w:128, h:128, wall:'#daceb6', trim:'#7a6245', roof:'#8a5240', shutters:'#607848' },
        palazzo_e: { w:160, h:192, clipH:80, wall:'#d8c9af', trim:'#80674a', roof:'#8a4f3c', shutters:'#648050' },
      }[kind];
      if (!S) return null;
      const H = S.clipH || S.h;
      const c = cv(S.w, H), x = ctx(c), R = U.rng(U.hash(kind));
      const W=S.w;
      // shadow
      px(x,4,H-4,W-4,4,'rgba(20,16,12,.12)');
      // wall base
      px(x,0,8,W,H-8,S.wall);
      // subtle plaster texture
      for (let i=0;i<Math.floor(W*H/18);i++){ const pxl=(R()*W)|0, pyl=8+((R()*(H-8))|0); px(x,pxl,pyl,1,1, R()>.5?'rgba(255,255,255,.04)':'rgba(0,0,0,.04)'); }
      // roof/cornice
      px(x,-2,0,W+4,10,S.roof); px(x,-1,8,W+2,3,shade(S.roof,18)); px(x,0,10,W,2,shade(S.roof,-20));
      // base trim
      px(x,0,H-8,W,8,shade(S.trim,-10)); px(x,0,H-8,W,1,shade(S.trim,20));
      // M1 extracted facade reference: use as visual overlay when available, keep procedural fallback
      const m1Facade = {
        gesu:'m1_gesu_ref',
        palazzo_ne:'m1_piazza_a', palazzo_sw:'m1_piazza_b', palazzo_e:'m1_piazza_c',
        palazzo_se:'m1_piazza_d', palazzo_bar:'m1_piazza_e', palazzo_banca:'m1_piazza_f'
      };
      if (kind === 'gesu') this._drawGesuFacade(x, W, H);
      else this._drawPalazzoFacade(x, W, H, S, kind, R);
      const m1Key = m1Facade[kind];
      if (m1Key && this.images[m1Key]) {
        const img = this.images[m1Key];
        // Fit preserving aspect ratio, anchored to bottom. Il fallback procedurale
        // resta visibile nelle bande scoperte: niente buchi sul basolato sottostante.
        const scale = Math.min(W / img.width, H / img.height);
        const dw = Math.round(img.width * scale), dh = Math.round(img.height * scale);
        const dx = Math.floor((W - dw) / 2), dy = H - dh;
        x.drawImage(img, dx, dy, dw, dh);
      }
      return this.cache[key] = c;
    },
    _drawGesuFacade(x,W,H) {
      // Bugnato a punta di diamante - caratteristico
      for (let yy=10; yy<H-8; yy+=10) for (let xx=0; xx<W; xx+=10) {
        const dark = ((xx/10 + yy/10) % 2 === 0);
        const base = dark ? '#4f555b' : '#70767d';
        const face = dark ? '#5a6067' : '#7f868d';
        px(x,xx,yy,10,10,base);
        // diamond
        x.fillStyle = face;
        x.beginPath();
        x.moveTo(xx+5,yy+1); x.lineTo(xx+9,yy+5); x.lineTo(xx+5,yy+9); x.lineTo(xx+1,yy+5); x.closePath(); x.fill();
        px(x,xx+4,yy+2,2,1,'rgba(255,255,255,.10)');
        px(x,xx+2,yy+5,1,2,'rgba(0,0,0,.08)');
      }
      // cornice sommitale
      px(x,0,6,W,6,'#8d9399'); px(x,0,12,W,2,'#61676d');
      // portale monumentale
      const cx=W/2, py=H-8;
      px(x,cx-34,py-96,68,96,'#3f3125');
      px(x,cx-30,py-92,60,92,'#5f472f');
      px(x,cx-28,py-90,26,90,'#6f5338'); px(x,cx+2,py-90,26,90,'#6f5338');
      px(x,cx-1,py-90,2,90,'#3d2c1f');
      // pannelli porte
      for (const sx of [-22,8]) { px(x,cx+sx,py-78,14,28,'#7d6042'); px(x,cx+sx,py-44,14,28,'#7d6042'); px(x,cx+sx+1,py-77,12,1,'#93744f'); }
      px(x,cx-10,py-30,4,4,'#c9a44a'); px(x,cx+6,py-30,4,4,'#c9a44a');
      // architrave/tympan
      px(x,cx-40,py-104,80,10,'#858b91'); px(x,cx-36,py-102,72,3,'#9aa0a6');
      px(x,cx-44,py-110,88,8,'#747a80');
      // colonne/pilastri laterali portale
      px(x,cx-38,py-96,6,96,'#7f858b'); px(x,cx+32,py-96,6,96,'#7f858b');
      px(x,cx-37,py-96,2,96,'#989ea4');
      // finestre superiori
      [[cx-90,50],[cx+70,50]].forEach(([wx,wy])=>{
        px(x,wx,wy,24,34,'#40464c'); px(x,wx+2,wy+2,20,30,'#6f93ad');
        px(x,wx+11,wy+2,2,30,'#566067'); px(x,wx+2,wy+16,20,2,'#566067');
        px(x,wx+2,wy+2,20,4,'rgba(255,255,255,.15)');
        px(x,wx-2,wy+32,28,4,'#6a7076');
      });
      // rosoncino/oculo sopra portale
      px(x,cx-10,36,20,20,'#4a5056'); x.fillStyle='#7fa1b8'; x.beginPath(); x.arc(cx,46,8,0,Math.PI*2); x.fill();
      px(x,cx-1,38,2,16,'#596067'); px(x,cx-8,45,16,2,'#596067');
    },
    _drawPalazzoFacade(x,W,H,S,kind,R) {
      const wall=S.wall, trim=S.trim, shut=S.shutters||'#647a4a', win=S.win||'#86aec2';
      // cornice piani
      const floors = kind==='palazzo_ne'||kind==='palazzo_e' ? 3 : 2;
      const fh = Math.floor((H-28)/floors);
      for (let f=0; f<floors; f++) {
        const fy = 14 + f*fh;
        px(x,0,fy+fh-2,W,2,shade(trim,10));
        // finestre
        const cols = Math.max(2, Math.floor(W/44));
        const margin = Math.floor((W - cols*28)/(cols+1));
        for (let i=0;i<cols;i++) {
          const wx = margin + i*(28+margin);
          const wy = fy + 8;
          // cornice finestra
          px(x,wx-3,wy-3,34,28,'#6b5540');
          px(x,wx-2,wy-2,32,26,shade(wall,-8));
          // vetro
          px(x,wx,wy,28,22,win);
          px(x,wx,wy,28,4,'rgba(255,255,255,.20)');
          px(x,wx+13,wy,2,22,shade(trim,5)); px(x,wx,wy+10,28,2,shade(trim,5));
          // persiane
          px(x,wx-5,wy-1,5,24,shut); px(x,wx+28,wy-1,5,24,shut);
          px(x,wx-4,wy+2,3,1,shade(shut,20)); px(x,wx-4,wy+6,3,1,shade(shut,20)); px(x,wx-4,wy+10,3,1,shade(shut,20));
          px(x,wx+29,wy+2,3,1,shade(shut,20)); px(x,wx+29,wy+6,3,1,shade(shut,20)); px(x,wx+29,wy+10,3,1,shade(shut,20));
          // balcone al secondo piano
          if (f < floors-1 && (i%2===0 || kind.includes('banca'))) {
            px(x,wx-8,wy+20,44,3,'#505962');
            px(x,wx-8,wy+23,44,5,'#434b53');
            for(let bx=wx-6;bx<wx+36;bx+=4) px(x,bx,wy+23,1,5,'#5f6872');
            px(x,wx-6,wy+18,40,3,'#6f7d54'); // piante
          }
        }
      }
      // portone/insegna
      const dx = Math.floor(W/2)-14;
      if (kind === 'palazzo_bar') {
        px(x,dx-2,H-34,32,34,'#4a3524'); px(x,dx,H-32,28,32,'#6b4a30');
        px(x,dx+12,H-32,2,32,'#3f2c1f'); px(x,dx+20,H-18,3,3,'#c9a44a');
        // insegna
        px(x,dx-18,H-56,64,14,'#f0e4cf'); px(x,dx-18,H-56,64,2,'#7a4a32');
        px(x,dx-8,H-53,44,8,'#b44a3a');
      } else if (kind === 'palazzo_banca') {
        px(x,dx-4,H-34,36,34,'#4a5560'); px(x,dx-2,H-32,32,32,'#607080');
        px(x,dx+13,H-32,2,32,'#455260'); px(x,dx+24,H-18,3,3,'#c9a44a');
        px(x,dx-14,H-54,56,12,'#e8edf2'); px(x,dx-6,H-51,40,6,'#4a6f8e');
      } else {
        px(x,dx,H-32,28,32,'#5a4028'); px(x,dx+1,H-31,26,31,'#775738');
        px(x,dx+13,H-31,2,31,'#4a331f'); px(x,dx+20,H-16,3,3,'#c9a44a');
      }
      // dettagli intonaco
      px(x,2,14,2,H-22,'rgba(0,0,0,.05)'); px(x,W-4,14,2,H-22,'rgba(255,255,255,.04)');
    },
    gugliaSprite() {
      if (this.images.guglia) return this.images.guglia;
      const key = 'bld:guglia'; if (this.cache[key]) return this.cache[key];
      const W=128, H=176; const c=cv(W,H), x=ctx(c); const cx=W/2, by=H-8;
      // shadow
      x.fillStyle='rgba(0,0,0,.18)'; x.beginPath(); x.ellipse(cx,by,44,10,0,0,Math.PI*2); x.fill();
      // stepped base
      px(x,cx-38,by-28,76,28,'#cec3b0'); px(x,cx-34,by-26,68,24,'#ddd3c1');
      px(x,cx-30,by-24,60,20,'#c7bca9'); px(x,cx-38,by-4,76,3,'#b0a491');
      px(x,cx-42,by-32,84,5,'#b8ac98');
      // panels
      for(let i=-2;i<=2;i++){ px(x,cx+i*14-5,by-22,10,14,'#d6ccba'); px(x,cx+i*14-4,by-21,8,1,'#eae2d2'); }
      // statues
      const st=(sx,sy)=>{ px(x,sx-3,sy-14,6,14,'#d9d0c0'); px(x,sx-4,sy-16,8,4,'#ccc2b0'); px(x,sx-2,sy-12,4,8,'#beb3a0'); px(x,sx-3,sy-14,1,4,'#ebe3d4'); };
      st(cx-28,by-30); st(cx+28,by-30); st(cx-10,by-30); st(cx+10,by-30);
      // middle plinth
      px(x,cx-20,by-48,40,18,'#d4cab8'); px(x,cx-16,by-46,32,14,'#ebe3d2'); px(x,cx-22,by-50,44,3,'#b3a793');
      px(x,cx-14,by-36,28,2,'#a99d89');
      // obelisk
      px(x,cx-10,by-116,20,70,'#c8bea9'); px(x,cx-7,by-114,14,66,'#e8e0cf');
      px(x, cx-10,by-48,20,3,'#b7ab96'); px(x,cx-7,by-114,2,66,'rgba(255,255,255,.12)');
      // rings
      px(x,cx-12,by-74,24,3,'#a99d89'); px(x,cx-11,by-90,22,3,'#a99d89');
      // ornaments
      px(x,cx-13,by-76,3,8,'#c9a44a'); px(x,cx+10,by-76,3,8,'#c9a44a');
      // top
      px(x,cx-6,by-128,12,14,'#c9a44a'); px(x,cx-4,by-126,8,10,'#f0d06a');
      px(x,cx-2,by-146,4,20,'#d4b04f'); px(x,cx-8,by-140,16,3,'#d4b04f');
      px(x,cx-2,by-145,4,3,'#fff2a0');
      return this.cache[key] = c;
    },
    propSprite(kind) {
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
