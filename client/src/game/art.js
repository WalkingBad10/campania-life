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
    cave: '#56505e', caveL: '#6d6575', lava: '#e8613c', lavaL: '#f7a33d',
    dark: '#241f26', white: '#f5f0df', ink: '#1b2730'
  };

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = U.clamp(r, 0, 255); g = U.clamp(g, 0, 255); b = U.clamp(b, 0, 255);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  // I sprite "mondo" vengono disegnati direttamente alla scala metrica finale:
  // niente downscale con smoothing che sfoca i dettagli a 1 px. Il canvas
  // pubblico conserva pero' le dimensioni legacy, cosi' gli offset di disegno
  // e i test sulle ancore restano invariati.
  let worldDrawScale = 1;
  function cvRaw(wid, hei) { const c = document.createElement('canvas'); c.width = Math.max(1, wid); c.height = Math.max(1, hei); return c; }
  function ctxRaw(c) { const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return x; }
  function cv(wid, hei) {
    if (worldDrawScale === 1) return cvRaw(wid, hei);
    const c = cvRaw(Math.round(wid * worldDrawScale), Math.round(hei * worldDrawScale));
    c._legacyW = wid; c._legacyH = hei;
    return c;
  }
  function ctx(c) {
    const x = ctxRaw(c);
    if (c._legacyW) x.setTransform(worldDrawScale, 0, 0, worldDrawScale, 0, 0);
    return x;
  }
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
  // Poligoni e linee a pixel interi: servono per i piani inclinati di tetti,
  // parabrezza e telai, senza anti-aliasing e senza dipendenze esterne.
  function poly(x, pts, col) {
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(Math.round(pts[0][0]), Math.round(pts[0][1]));
    for (let i = 1; i < pts.length; i++) x.lineTo(Math.round(pts[i][0]), Math.round(pts[i][1]));
    x.closePath(); x.fill();
  }
  function line(x, x0, y0, x1, y1, col, thick) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, t = 0;
    for (;;) {
      px(x, x0, y0, thick || 1, thick || 1, col);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
      if (++t > 256) break;
    }
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
            if (key.startsWith('bld:') || key.startsWith('w:p:') || key.startsWith('prop:')) delete this.cache[key];
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
      // I costruttori disegnano direttamente nella griglia finale: i dettagli
      // a 1 px non vengono piu' sfocati da un doppio passaggio di scala.
      let src;
      worldDrawScale = CL.WORLD_SCALE;
      try { src = make(); } finally { worldDrawScale = 1; }
      if (!src || !src.width || !src.height) return src;
      if (src._legacyW) {
        // Il disegno diretto in scala metrica può lasciare antialiasing agli
        // angoli del canvas. Gli sprite mondo devono avere angoli trasparenti:
        // nessuno sfondo quadrato deve apparire sotto ruote, chiome o ombre.
        const raw = ctxRaw(src);
        raw.setTransform(1, 0, 0, 1, 0, 0);
        raw.clearRect(0, 0, 1, 1);
        raw.clearRect(src.width - 1, 0, 1, 1);
        raw.clearRect(0, src.height - 1, 1, 1);
        raw.clearRect(src.width - 1, src.height - 1, 1, 1);
        return this.cache[key] = src; // già in scala metrica
      }
      // Le PNG M1 arrivano ancora in risoluzione legacy: vengono adattate
      // con nearest-neighbor, senza anti-aliasing.
      const w = Math.max(1, Math.round(src.width * CL.WORLD_SCALE));
      const h = Math.max(1, Math.round(src.height * CL.WORLD_SCALE));
      const c = cvRaw(w, h), x = ctxRaw(c);
      x.drawImage(src, 0, 0, w, h);
      return this.cache[key] = c;
    },
    tree(v) { return this._world('w:tree:' + v, () => this._tree(v)); },
    lemonTree(v) { return this._world('w:lemon:' + v, () => this._lemonTree(v)); },
    palmTree(v) { return this._world('w:palm:' + v, () => this._palmTree(v)); },
    rock(v) { return this._world('w:rock:' + v, () => this._rock(v)); },
    flower(v) { return this._world('w:flower:' + v, () => this._flower(v)); },
    fountain() { return this._world('w:fountain', () => this._fountain()); },
    character(look, dir, frame, mode) {
      const anim = mode || 'walk';
      return this._world('w:c2:' + [look.hair, look.skin, look.shirt, look.pants, dir, frame, anim].join('|'),
        () => this._character(look, dir, frame, anim));
    },
    creature(id, frame) { return this._world('w:cr:' + id + ':' + frame, () => this._creature(id, frame)); },
    // Versione notturna pre-ombreggiata: nessun rettangolo scuro sopra il
    // giocatore, che prima copriva il sprite e lo faceva sembrare un blocco.
    nightCharacter(look, dir, frame, mode) {
      const key = 'w:cn:' + [look.hair, look.skin, look.shirt, look.pants, dir, frame, mode || 'walk'].join('|');
      if (this.cache[key]) return this.cache[key];
      const src = this.character(look, dir, frame, mode);
      const c = cvRaw(src.width, src.height), x = ctxRaw(c);
      x.drawImage(src, 0, 0);
      x.globalCompositeOperation = 'source-atop';
      x.fillStyle = 'rgba(12,20,42,.22)'; x.fillRect(0, 0, c.width, c.height);
      return this.cache[key] = c;
    },
    vehicle(type, dir) { return this._world('w:v:' + type + ':' + dir, () => this._vehicle(type, dir)); },
    propSprite(kind) { return this._world('w:p:' + kind, () => this._propSprite(kind)); },
    /* Micro-arredi originali, in scala metrica (CL.PX_PER_M = 8): ogni canvas e'
     * trasparente e viene creato una sola volta per kind+variant. Nessun
     * drawImage per frame e nessun clearRect su superfici opache. */
    detailSprite(kind, variant = 0) {
      const v = Math.abs(Math.trunc(Number(variant) || 0)) % 4;
      const key = 'detail:' + kind + ':' + v;
      if (this.cache[key]) return this.cache[key];
      let c = null, x = null;
      const make = (w, h) => { c = cvRaw(w, h); x = ctxRaw(c); };
      const sh = (cx, cy, rx, ry) => ell(x, cx, cy, rx, ry, 'rgba(20,22,24,.20)');
      const pal = arr => arr[v % arr.length];
      const text = (s, tx, ty, col) => this._tinyText(x, s, tx, ty, col);
      switch (kind) {
        case 'manhole': {
          make(10, 10); sh(5, 7, 4, 2);
          ell(x, 5, 5, 4, 4, '#4c5152'); ell(x, 5, 5, 3, 3, '#727775');
          px(x, 4, 2, 1, 6, '#4c5152'); px(x, 2, 4, 6, 1, '#4c5152');
          px(x, 3, 2, 2, 1, '#a5aaa6'); px(x, 2, 4, 1, 1, '#a5aaa6');
          break;
        }
        case 'drain': {
          make(12, 8); sh(6, 6, 6, 2);
          px(x, 0, 2, 12, 5, '#4c5152'); px(x, 1, 3, 10, 3, '#2d3336');
          for (let i = 2; i < 11; i += 2) { px(x, i, 3, 1, 3, '#848b8a'); px(x, i + 1, 3, 1, 3, '#4c5152'); }
          px(x, 1, 2, 10, 1, '#a5aaa6');
          break;
        }
        case 'trash_bin': {
          make(10, 14); sh(5, 13, 5, 2);
          const body = pal(['#4f6d5a', '#586b78', '#7a5a44', '#6b6470']);
          poly(x, [[2, 4], [8, 4], [9, 12], [1, 12]], shade(body, -22));
          px(x, 2, 4, 6, 8, body); px(x, 3, 5, 1, 7, shade(body, 22));
          px(x, 1, 3, 8, 2, shade(body, 18)); px(x, 2, 1, 6, 2, shade(body, -16));
          for (let i = 3; i < 9; i += 2) px(x, i, 6, 1, 5, 'rgba(20,26,22,.22)');
          px(x, 4, 7, 2, 3, '#d8d2bb');
          break;
        }
        case 'planter_box': {
          make(16, 10); sh(8, 9, 8, 2);
          px(x, 0, 4, 16, 5, '#8b6244'); px(x, 0, 4, 16, 1, '#b78a5c');
          px(x, 0, 8, 16, 1, '#5e4028');
          for (let i = 2; i < 16; i += 5) px(x, i, 5, 1, 3, 'rgba(60,40,26,.30)');
          px(x, 0, 3, 16, 2, '#5e4028'); px(x, 1, 3, 14, 1, '#3f3529');
          const leaf = pal(['#4f8a4c', '#4f7c58', '#5e9145', '#477f6a']);
          for (let i = 2; i < 15; i += 4) {
            ell(x, i, 2, 3, 3, leaf); px(x, i, 1, 1, 1, shade(leaf, 30));
            if ((i + v) % 3 === 0) px(x, i + 1, 0, 1, 1, '#d95e52');
          }
          break;
        }
        case 'flower_box': {
          make(12, 8); sh(6, 7, 6, 2);
          px(x, 1, 4, 10, 3, '#a45b45'); px(x, 1, 4, 10, 1, '#c27455');
          px(x, 2, 7, 8, 1, '#7a4930'); px(x, 1, 3, 10, 1, '#5e4028');
          const bloom = pal(['#e88fae', '#f2d24f', '#f3f0e0', '#c58fe0']);
          for (let i = 2; i < 11; i += 3) {
            px(x, i, 2, 1, 3, '#4f8a4c'); ell(x, i, 1, 2, 2, bloom);
            px(x, i, 1, 1, 1, '#fff4c8');
          }
          break;
        }
        case 'bollard': {
          make(8, 14); sh(4, 13, 4, 2);
          px(x, 2, 11, 4, 2, '#4a5154'); px(x, 3, 3, 2, 9, '#585f62');
          px(x, 3, 3, 1, 9, '#8a9294'); px(x, 2, 1, 4, 2, '#6b7375');
          const band = pal(['#e8d778', '#d8564a', '#e8e4d4', '#d8564a']);
          px(x, 3, 6, 2, 3, band); px(x, 3, 6, 1, 3, shade(band, 30));
          break;
        }
        case 'traffic_sign': {
          make(12, 26); sh(6, 25, 5, 2);
          px(x, 5, 9, 2, 16, '#666f72'); px(x, 5, 9, 1, 16, '#9aa3a3');
          px(x, 4, 24, 4, 2, '#4c5456');
          poly(x, [[6, 1], [11, 9], [1, 9]], '#b94338');
          poly(x, [[6, 3], [9, 8], [3, 8]], '#f0e7d0');
          px(x, 5, 5, 2, 2, '#b94338'); px(x, 5, 7, 2, 1, '#b94338');
          break;
        }
        case 'parking_sign': {
          make(12, 26); sh(6, 25, 5, 2);
          px(x, 5, 10, 2, 15, '#666f72'); px(x, 5, 10, 1, 15, '#9aa3a3');
          px(x, 4, 24, 4, 2, '#4c5456');
          px(x, 1, 1, 10, 9, '#315f9c'); px(x, 1, 1, 10, 1, '#6f9bc5');
          px(x, 1, 9, 10, 1, '#254875'); text('P', 4, 3, '#f5f0df');
          break;
        }
        case 'shop_sign': {
          make(24, 10); sh(12, 9, 12, 2);
          const word = pal(['BAR', 'PIZZA', 'CAFFE']);
          const col = pal(['#b44a3a', '#2f6a4d', '#7a5637', '#3f6f8a']);
          px(x, 11, 0, 2, 2, '#4a5154'); px(x, 0, 2, 24, 7, '#efe7d2');
          px(x, 0, 2, 24, 2, col); px(x, 0, 8, 24, 1, '#a2937a');
          text(word, 3, 4, '#39434a');
          for (let i = 2; i < 24; i += 5) px(x, i, 9, 1, 1, '#e6c779');
          break;
        }
        case 'awning_sign': {
          make(28, 12); sh(14, 11, 13, 2);
          const col = pal(['#b94a3a', '#2f6a4d', '#3f6f8a', '#8b6244']);
          for (let i = 0; i < 28; i += 7) {
            px(x, i, 1, 7, 6, i % 14 ? shade(col, -14) : col);
            x.fillStyle = i % 14 ? shade(col, -22) : shade(col, -8);
            x.beginPath(); x.arc(i + 3, 7, 3, 0, Math.PI); x.fill();
          }
          px(x, 0, 0, 28, 1, shade(col, 28)); px(x, 0, 7, 28, 2, '#efe7d2');
          text(pal(['CAFFE', 'BAR', 'PIZZA']), 8, 8, '#5a4638');
          break;
        }
        case 'ac_unit': {
          make(14, 10); sh(7, 9, 7, 2);
          px(x, 1, 2, 12, 7, '#d6d5cc'); px(x, 1, 2, 12, 1, '#f0efe6');
          px(x, 1, 8, 12, 1, '#92918a'); px(x, 3, 4, 8, 4, '#a6b1b1');
          for (let i = 4; i < 11; i += 2) px(x, i, 5, 1, 2, '#6d787a');
          px(x, 11, 5, 1, 2, '#6d787a'); px(x, 2, 9, 2, 1, '#8d8b82');
          break;
        }
        case 'tv_antenna': {
          make(18, 16); sh(9, 15, 5, 1);
          px(x, 8, 3, 1, 12, '#5e6669'); px(x, 8, 3, 1, 12, '#9aa3a3');
          px(x, 7, 14, 3, 2, '#4a5255');
          for (let i = 0; i < 5; i++) px(x, 3 + i * 3, 1 + (i % 2), 8, 1, '#929b9b');
          px(x, 7, 1, 3, 2, '#c9d0cd');
          line(x, 9, 13, 14, 15, '#6a7375', 1);
          break;
        }
        case 'intercom': {
          make(6, 12); sh(3, 11, 3, 1);
          px(x, 0, 0, 6, 11, '#3b4145'); px(x, 0, 0, 6, 1, '#6a7375');
          px(x, 1, 1, 4, 3, '#d8c27a'); px(x, 1, 1, 4, 1, '#f6e6a8');
          for (let i = 1; i < 5; i += 2) for (let j = 5; j < 10; j += 2) px(x, i, j, 1, 1, '#9aa3a3');
          px(x, 2, 10, 2, 1, '#24292c');
          break;
        }
        case 'satellite': {
          make(14, 14); sh(7, 13, 6, 2);
          poly(x, [[2, 2], [11, 1], [8, 8], [4, 8]], '#d8d9cf');
          px(x, 3, 2, 7, 2, '#f0efe4'); px(x, 5, 4, 4, 3, '#9aa3a3');
          line(x, 7, 5, 10, 9, '#6d7577', 1);
          px(x, 9, 9, 3, 2, '#4c5456'); px(x, 6, 11, 2, 3, '#666f72');
          px(x, 5, 13, 4, 1, '#4c5456');
          break;
        }
        case 'pigeon': {
          make(12, 10); sh(6, 9, 5, 1);
          const feather = pal(['#6f7980', '#7d7168', '#5f6b74', '#8a837c']);
          ell(x, 5, 6, 5, 3, feather); ell(x, 9, 3, 2, 2, shade(feather, -18));
          px(x, 11, 3, 1, 1, '#d99a4c'); px(x, 9, 2, 1, 1, '#20262a');
          poly(x, [[2, 5], [6, 4], [7, 7], [3, 8]], shade(feather, -20));
          px(x, 2, 8, 1, 2, '#c98a4b'); px(x, 4, 8, 1, 2, '#c98a4b');
          px(x, 7, 9, 1, 1, 'rgba(20,22,24,.30)');
          break;
        }
        case 'parked_scooter': {
          make(22, 14); sh(11, 12, 10, 2);
          ell(x, 5, 11, 3, 3, '#2b3034'); ell(x, 17, 11, 3, 3, '#2b3034');
          ell(x, 5, 11, 1, 1, '#a5aaa6'); ell(x, 17, 11, 1, 1, '#a5aaa6');
          const body = pal(['#c94f43', '#3f6f8a', '#4f8f6a', '#d8a94f']);
          poly(x, [[5, 9], [17, 9], [15, 5], [8, 5]], body);
          px(x, 8, 5, 7, 1, shade(body, 28)); px(x, 16, 6, 4, 4, shade(body, -18));
          line(x, 17, 8, 19, 2, '#666f72', 1); px(x, 17, 2, 4, 1, '#8b9496');
          px(x, 6, 4, 6, 2, '#3b3f42'); px(x, 18, 8, 2, 2, '#ffe9a8');
          break;
        }
        case 'bench_wood': {
          make(24, 12); sh(12, 11, 11, 2);
          for (const by of [2, 5]) { px(x, 2, by, 20, 2, '#8b6244'); px(x, 3, by, 18, 1, '#b78a5c'); }
          px(x, 2, 8, 20, 3, '#a07050'); px(x, 3, 8, 18, 1, '#c09466');
          for (let i = 4; i < 22; i += 5) px(x, i, 9, 1, 2, '#65432e');
          px(x, 1, 3, 2, 7, '#3b4248'); px(x, 21, 3, 2, 7, '#3b4248');
          for (const lx of [4, 18]) px(x, lx, 10, 2, 2, '#4a382b');
          break;
        }
        case 'lamp_post': {
          make(12, 32); sh(6, 31, 5, 2);
          x.fillStyle = 'rgba(255,238,168,.12)';
          x.beginPath(); x.arc(6, 7, 8, 0, Math.PI * 2); x.fill();
          px(x, 4, 29, 4, 2, '#3d444b'); px(x, 5, 12, 2, 17, '#4a5158');
          px(x, 5, 12, 1, 17, '#737a80'); px(x, 4, 11, 4, 2, '#5b6268');
          px(x, 3, 3, 6, 8, '#f6e7a2'); px(x, 4, 4, 4, 6, '#fff3c8');
          px(x, 2, 2, 1, 9, '#394047'); px(x, 9, 2, 1, 9, '#394047');
          poly(x, [[2, 2], [10, 2], [8, 0], [4, 0]], '#4a5158');
          break;
        }
        case 'rail_fence': {
          make(18, 14); sh(9, 13, 9, 1);
          for (const yy of [4, 9]) { px(x, 0, yy, 18, 2, '#6a7375'); px(x, 0, yy, 18, 1, '#a5aaa6'); }
          for (let i = 2; i < 18; i += 5) { px(x, i, 1, 2, 12, '#4c5456'); px(x, i, 1, 1, 12, '#848b8a'); }
          break;
        }
        case 'platform_edge': {
          make(24, 8); sh(12, 7, 12, 1);
          px(x, 0, 2, 24, 5, '#8f8b7d'); px(x, 0, 2, 24, 1, '#c9c4b2');
          px(x, 0, 5, 24, 2, '#d8a94f');
          for (let i = 2; i < 24; i += 4) { ell(x, i, 4, 2, 2, '#f2d24f'); px(x, i, 3, 1, 1, '#fff0b8'); }
          px(x, 0, 6, 24, 1, '#5d5a52');
          break;
        }
        case 'street_line': {
          make(16, 4); sh(8, 3, 8, 1);
          px(x, 0, 1, 13, 2, '#ded7bd'); px(x, 1, 1, 11, 1, '#f6efd8');
          px(x, 11, 1, 2, 1, 'rgba(90,88,80,.35)');
          break;
        }
        case 'mosaic_step': {
          make(16, 6); sh(8, 5, 8, 1);
          px(x, 0, 1, 16, 4, '#8f8b7d'); px(x, 0, 1, 16, 1, '#d8d2bf');
          for (let i = 0; i < 16; i += 4) {
            px(x, i, 2, 3, 2, i % 8 ? '#5f7d8c' : '#9a6250');
            px(x, i + 1, 2, 1, 1, '#c8d5d2');
          }
          px(x, 0, 5, 16, 1, '#57544e');
          break;
        }
        case 'wall_lamp': {
          make(10, 14); sh(5, 13, 4, 1);
          px(x, 0, 1, 3, 10, '#4a5154'); px(x, 0, 1, 3, 1, '#848b8a');
          px(x, 3, 5, 4, 1, '#666f72'); poly(x, [[5, 6], [9, 6], [8, 11], [6, 11]], '#f2dfa0');
          px(x, 6, 7, 2, 3, '#fff4c8'); px(x, 5, 12, 4, 1, '#3b4248');
          break;
        }
        case 'ceiling_lamp': {
          make(14, 10); sh(7, 9, 6, 1);
          px(x, 6, 0, 2, 3, '#5e6669');
          poly(x, [[2, 3], [12, 3], [9, 7], [5, 7]], '#d8d9cf');
          px(x, 4, 3, 6, 1, '#f0efe4'); ell(x, 7, 7, 2, 2, '#fff3c8');
          break;
        }
        case 'menu_board': {
          make(16, 20); sh(8, 19, 8, 1);
          px(x, 0, 0, 16, 19, '#6b4b33'); px(x, 1, 1, 14, 17, '#2e3b3a');
          px(x, 1, 1, 14, 1, '#a88958'); px(x, 1, 17, 14, 1, '#4a3526');
          text('MENU', 2, 3, '#f3ecd8');
          for (let i = 0; i < 4; i++) { px(x, 2, 10 + i * 2, 8, 1, '#c9d2c7'); px(x, 12, 10 + i * 2, 2, 1, '#e9c978'); }
          break;
        }
        case 'espresso_machine': {
          make(18, 18); sh(9, 17, 9, 1);
          px(x, 1, 4, 16, 12, '#9aa3a3'); px(x, 1, 4, 16, 2, '#c9d0cd');
          px(x, 1, 14, 16, 2, '#666f72'); px(x, 2, 1, 14, 3, '#b44a3a');
          px(x, 3, 2, 12, 1, '#e87d68'); px(x, 4, 7, 10, 5, '#3b4248');
          px(x, 5, 8, 8, 3, '#24292c'); px(x, 7, 12, 4, 3, '#6d7577');
          px(x, 8, 15, 2, 2, '#f0e4cf'); px(x, 15, 8, 1, 6, '#c9d0cd');
          break;
        }
        case 'sack_flour': {
          make(10, 14); sh(5, 13, 5, 1);
          const label = pal(['#b44a3a', '#2f6a4d', '#3f6f8a', '#8b6244']);
          poly(x, [[2, 3], [8, 3], [9, 12], [1, 12]], '#d8c9a8');
          poly(x, [[2, 3], [5, 3], [5, 12], [1, 12]], '#e8dcc0');
          px(x, 3, 1, 4, 3, '#c9b994'); px(x, 4, 0, 2, 2, '#9c8b6e');
          px(x, 3, 6, 4, 4, label); px(x, 4, 7, 2, 1, '#f0e4cf');
          px(x, 2, 11, 6, 1, 'rgba(90,74,52,.30)');
          break;
        }
        case 'bar_glass': {
          make(8, 12); sh(4, 11, 3, 1);
          px(x, 1, 1, 6, 10, 'rgba(210,232,232,.30)');
          px(x, 1, 1, 1, 10, '#dfeaea'); px(x, 6, 1, 1, 10, '#b9c7c7');
          px(x, 2, 5, 4, 5, pal(['#c98a4b', '#b44a3a', '#d8a94f', '#8b6244']));
          ell(x, 4, 5, 3, 1, '#f3ecd8'); px(x, 2, 2, 4, 1, '#f5f0df');
          break;
        }
        case 'flower_vase': {
          make(10, 12); sh(5, 11, 5, 1);
          const bloom = pal(['#e88fae', '#f2d24f', '#f3f0e0', '#c58fe0']);
          poly(x, [[3, 6], [7, 6], [6, 11], [4, 11]], '#8fa7b0');
          px(x, 3, 6, 4, 1, '#c9dadd');
          for (let i = 0; i < 3; i++) {
            const fx = 2 + i * 3;
            px(x, fx + 1, 2, 1, 5, '#4f8a4c');
            ell(x, fx, 1 + (i % 2), 2, 2, bloom); px(x, fx, 1, 1, 1, '#fff4c8');
          }
          break;
        }
        case 'desk_lamp': {
          make(14, 16); sh(7, 15, 6, 1);
          x.fillStyle = 'rgba(255,220,150,.12)';
          x.beginPath(); x.arc(7, 6, 7, 0, Math.PI * 2); x.fill();
          px(x, 3, 13, 8, 2, '#5e4a30'); px(x, 4, 13, 6, 1, '#a88958');
          line(x, 7, 13, 5, 6, '#8b7048', 1);
          poly(x, [[1, 6], [9, 6], [7, 3], [3, 3]], '#d8a94f');
          px(x, 3, 6, 4, 1, '#a87c3c'); ell(x, 5, 7, 2, 1, '#fff0b8');
          break;
        }
        case 'file_stack': {
          make(14, 10); sh(7, 9, 7, 1);
          const tabs = ['#b44a3a', '#4a87b8', '#e9b84a', '#7a9a5a'];
          for (let i = 0; i < 4; i++) {
            const yy = 7 - i * 2;
            px(x, 1, yy, 12, 2, '#f0e4cf'); px(x, 1, yy, 12, 1, '#fff7e4');
            px(x, 2 + i * 2, yy, 3, 1, tabs[(i + v) % tabs.length]);
          }
          break;
        }
        case 'exam_bed': {
          make(24, 14); sh(12, 13, 11, 1);
          px(x, 1, 6, 22, 5, '#8b9496'); px(x, 1, 6, 22, 1, '#c9d0cd');
          px(x, 1, 10, 22, 1, '#5e6669');
          px(x, 2, 5, 7, 3, '#f3ecd8'); px(x, 3, 5, 5, 1, '#fff7e4');
          px(x, 10, 6, 12, 4, pal(['#5b8fa6', '#7a9a5a', '#b98d70', '#8a6fa8']));
          px(x, 10, 6, 12, 1, 'rgba(255,255,255,.26)');
          for (const lx of [3, 20]) px(x, lx, 11, 2, 2, '#4c5456');
          break;
        }
        case 'bank_counter': {
          make(32, 16); sh(16, 15, 15, 1);
          px(x, 0, 7, 32, 8, '#8b6244'); px(x, 0, 7, 32, 1, '#c09466');
          px(x, 0, 13, 32, 2, '#5e4028'); px(x, 1, 8, 30, 1, 'rgba(255,235,200,.20)');
          px(x, 3, 8, 8, 5, '#7d9aa3'); px(x, 4, 9, 6, 3, '#39434a');
          px(x, 14, 9, 6, 4, '#e8e3cf'); px(x, 15, 10, 4, 1, '#8b9496');
          px(x, 23, 8, 7, 4, '#d8d2bb'); px(x, 24, 9, 5, 1, '#a5aaa6');
          text('BANCA', 10, 2, '#5a4638');
          break;
        }
        case 'metro_poster': {
          make(16, 22); sh(8, 21, 8, 1);
          px(x, 0, 0, 16, 21, '#4a5154'); px(x, 1, 1, 14, 19, '#f0e4cf');
          px(x, 1, 1, 14, 4, '#3f6f8a'); text('METRO', 2, 2, '#f5f0df');
          line(x, 3, 16, 7, 8, '#c9564a', 2); line(x, 7, 8, 12, 14, '#4a87b8', 2);
          px(x, 3, 15, 2, 2, '#f2d24f'); px(x, 6, 7, 2, 2, '#f2d24f'); px(x, 11, 13, 2, 2, '#f2d24f');
          break;
        }
        case 'metro_column': {
          make(14, 26); sh(7, 25, 7, 1);
          px(x, 2, 2, 10, 22, '#c9c4b2'); px(x, 2, 2, 2, 22, '#e6e0cd');
          px(x, 10, 2, 2, 22, '#a09b8c'); px(x, 1, 1, 12, 2, '#e6e0cd');
          px(x, 1, 23, 12, 3, '#8f8b7d');
          for (let yy = 6; yy < 22; yy += 4) px(x, 2, yy, 10, 1, 'rgba(90,88,80,.22)');
          px(x, 3, 8, 8, 6, '#3f6f8a'); text('M', 5, 9, '#f5f0df');
          break;
        }
        case 'stair_rail': {
          make(24, 16); sh(12, 15, 12, 1);
          line(x, 1, 13, 22, 2, '#6a7375', 2); line(x, 1, 12, 22, 1, '#a5aaa6', 1);
          for (const px0 of [3, 9, 15, 21]) {
            const py0 = 13 - Math.round((px0 - 1) * 11 / 21);
            px(x, px0, py0, 2, 13 - py0, '#4c5456'); px(x, px0, py0, 1, 13 - py0, '#848b8a');
          }
          break;
        }
        case 'guide_strip': {
          make(16, 4); sh(8, 3, 8, 1);
          px(x, 0, 1, 16, 2, '#c8a94f');
          for (let i = 1; i < 16; i += 3) { ell(x, i, 2, 1, 1, '#f2d24f'); px(x, i, 1, 1, 1, '#fff0b8'); }
          break;
        }
        case 'dog': {
          make(18, 12); sh(9, 11, 8, 1);
          const coat = pal(['#b08a5e', '#7d7168', '#5f6b74', '#d8c9a8']);
          ell(x, 8, 7, 6, 3, coat); ell(x, 14, 5, 3, 3, shade(coat, -14));
          poly(x, [[12, 3], [14, 1], [15, 4]], shade(coat, -24));
          px(x, 16, 5, 1, 1, '#20262a'); px(x, 17, 6, 1, 1, '#20262a');
          line(x, 2, 6, 0, 3, shade(coat, -10), 1);
          for (const lx of [4, 7, 11, 14]) px(x, lx, 9, 2, 3, shade(coat, -8));
          px(x, 11, 7, 1, 2, '#b44a3a');
          break;
        }
        case 'laundry_bundle': {
          make(14, 10); sh(7, 9, 6, 1);
          const cloth = pal(['#f3ecd8', '#8fa7b0', '#b98d70', '#c9a44a']);
          poly(x, [[2, 3], [11, 2], [13, 8], [3, 9]], shade(cloth, -20));
          poly(x, [[2, 3], [7, 2], [8, 9], [3, 9]], cloth);
          px(x, 6, 4, 2, 5, shade(cloth, 24)); px(x, 9, 3, 1, 5, shade(cloth, -14));
          px(x, 6, 2, 4, 1, '#8b6244');
          break;
        }
        default: {
          make(8, 8);
          ell(x, 4, 4, 3, 3, pal(['#b44a3a', '#4a87b8', '#e9b84a', '#7a9a5a']));
          px(x, 3, 3, 2, 2, '#f0e4cf');
        }
      }
      return this.cache[key] = c;
    },
    /* Micro-font 3x5 usato solo da insegne, menu e cartelli: originale,
     * deterministico e disegnato a pixel interi senza Anti-aliasing. */
    _tinyText(x, str, tx, ty, col) {
      const G = {
        A: ['010', '101', '111', '101', '101'], B: ['110', '101', '110', '101', '110'],
        C: ['011', '100', '100', '100', '011'], D: ['110', '101', '101', '101', '110'],
        E: ['111', '100', '110', '100', '111'], F: ['111', '100', '110', '100', '100'],
        G: ['011', '100', '101', '101', '011'], I: ['111', '010', '010', '010', '111'],
        L: ['100', '100', '100', '100', '111'], M: ['101', '111', '111', '101', '101'],
        N: ['101', '111', '111', '111', '101'], O: ['010', '101', '101', '101', '010'],
        P: ['110', '101', '110', '100', '100'], R: ['110', '101', '110', '101', '101'],
        S: ['011', '100', '010', '001', '110'], T: ['111', '010', '010', '010', '010'],
        U: ['101', '101', '101', '101', '111'], V: ['101', '101', '101', '101', '010'],
        Z: ['111', '001', '010', '100', '111'], ' ': ['000', '000', '000', '000', '000'],
        '?': ['010', '000', '010', '000', '010']
      };
      const s = String(str || '').toUpperCase();
      for (let i = 0; i < s.length; i++) {
        const g = G[s[i]] || G['?'];
        for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) {
          if (g[r][c] === '1') px(x, tx + i * 4 + c, ty + r, 1, 1, col);
        }
      }
    },
    // Finiture architettoniche precedentemente disegnate come rettangoli nel
    // motore: ora sono sprite con pieghe, dentelli e trafori, ritagliati con
    // trasparenza e nella stessa scala metrica del resto del mondo.
    awningSprite(color, wid) {
      const w = Math.max(8, wid || 32), col = color || '#b94a3a';
      return this._world('w:aw:' + col + ':' + w, () => this._awning(col, w));
    },
    trimSprite(kind, wid, color, pots) {
      const w = Math.max(8, wid || 32), col = color || '#b9b0a0';
      return this._world('w:tr:' + kind + ':' + col + ':' + w + ':' + (pots ? 1 : 0),
        () => this._trim(kind, w, col, pots !== false));
    },

    px, shade, ell, cv, ctx,

    /* --------------------------------------------------------- tiles 16x16 */
    buildTiles() {
      for (const ch of ".TDderpSW~#b=fcoXBo^gkPCVZOH'LFKQYIUENJAMRZhjlnqstuvwxyz1234567890") this.tiles[ch] = this.tile(ch);
      // Varianti di suolo: il marker albero non disegna piu' un quadrato verde
      // sotto la chioma; le zone urbane mostrano la pavimentazione reale e le
      // rovine di Pompei usano tufo instead of laterizio.
      this.tiles.Pext = this.tile('Pext');
      this.tiles.Turban = this.tile('Turban');
      this.tiles.tufo = this.tile('tufo');
      // Varianti deterministiche: la griglia resta invariata, cambia solo il disegno.
      // Sedici varianti per il basolato del centro storico, otto per marciapiedi
      // e lastroni: la ripetizione della cella non è più leggibile a colpo d'occhio.
      for (let v = 0; v < 16; v++) this.tiles['D' + v] = this.variantTile('D', v);
      for (let v = 0; v < 8; v++) {
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
      if (ch === 'D' || ch === 'd' || ch === 'e') {
        // Niente linee rette a 16 px: formavano colonne e righe perfette.
        // Ogni variante ha tono e usura propri, oltre ai giunti sfalsati:
        // anche su grandi piazze la cella non si legge più come un clone.
        const wash = ['rgba(255,248,235,.07)', 'rgba(30,28,25,.06)',
                      'rgba(255,250,240,.04)', 'rgba(40,38,34,.08)'][variant % 4];
        x.fillStyle = wash; x.fillRect(0, 0, 16, 16);
        for (let i = 0; i < 4; i++) {
          const wx = (R() * 14) | 0, wy = (R() * 14) | 0;
          const ww = 2 + ((R() * 4) | 0), hh = 1 + ((R() * 3) | 0);
          px(x, wx, wy, ww, hh, variant % 2 ? 'rgba(35,32,28,.08)' : 'rgba(255,252,245,.09)');
        }
        const dark = ch === 'd' ? 'rgba(74,74,72,.30)' : 'rgba(45,42,38,.30)';
        for (let i = 0; i < 7; i++) {
          const yy = (i * 4 + variant * 3 + (R() * 3 | 0)) % 16;
          const xx = (R() * 12) | 0, ww = 3 + ((R() * 5) | 0);
          px(x, xx, yy, ww, 1, dark);
          px(x, xx + ww, yy + 1, 2 + ((R() * 3) | 0), 1, dark);
        }
        for (let i = 0; i < 5; i++) {
          const xx = (i * 4 + variant * 2 + (R() * 3 | 0)) % 16;
          const yy = (R() * 12) | 0, hh = 2 + ((R() * 3) | 0);
          px(x, xx, yy, 1, hh, dark);
        }
        px(x, 1 + variant, 2 + variant * 2, 5, 2, 'rgba(255,255,255,.10)');
      } else if (ch === 'p') {
        // Marciapiede: solo giunti corti e venature, senza righe continue.
        for (let i = 0; i < 6; i++) {
          const xx = (R() * 16) | 0, yy = (R() * 16) | 0;
          px(x, xx, yy, 1 + ((R() * 3) | 0), 1, i % 2 ? 'rgba(255,255,255,.17)' : 'rgba(78,72,64,.24)');
          px(x, (xx + 3) % 16, yy + 1, 2, 1, 'rgba(78,72,64,.14)');
        }
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
      const urban = map && map.zone && map.zone !== 'interno' && !['costiera', 'vesuvio', 'napoli'].includes(map.zone);
      // I marcatori albero non devono lasciare un quadrato verde sul selciato:
      // il suolo resta continuo e la chioma e' un'entita' con trasparenza.
      if (ch === 'P' && map && map.zone !== 'interno') return this.tiles.Pext || this.tiles.P;
      if (ch === 'T' && urban) return this.tiles.Turban || this.tiles.T;
      // Le rovine pompeiane sono in tufo, non in mattone rosso da palazzo.
      if (ch === '#' && map && map.zone === 'pompei') return this.tiles.tufo || this.tiles['#'];
      if (ch === 'D' || ch === 'p' || ch === 'd' || ch === 'e') {
        const n = ch === 'D' ? 16 : 8;
        const key = ch + (U.hash(ch + ':' + tx + ':' + ty) % n);
        if (this.tiles[key]) return this.tiles[key];
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
        // Suolo urbano sotto un albero: non piu' un quadrato verde incollato
        // sul marciapiede. La chioma viene disegnata come entita' alta.
        case 'Turban':
          px(x, 0, 0, 16, 16, '#b8b1a2');
          for (let xx = 0; xx < 16; xx += 4) px(x, xx, 0, 1, 16, '#a9a293');
          for (let yy = 0; yy < 16; yy += 8) px(x, 0, yy, 16, 1, '#a9a293');
          ell(x, 8, 10, 6, 3, '#8f887b'); ell(x, 8, 9, 5, 2, '#a29784');
          dot('#ccc5b5', 4); break;
        case 'D': {
          // Basolato del centro storico: lastri di piperno arrotondati e
          // sfalsati, non una griglia di quadratini. Giunti scuri continui,
          // luce dall'alto a sinistra, usura deterministica per variante.
          px(x, 0, 0, 16, 16, '#6c685f');
          const rows = [[0, 0, 4, 5, 9, 4, 13, 3],
                        [2, 0, 6, 4, 11, 5, 15, 4],
                        [0, 5, 5, 5, 10, 4, 14, 5],
                        [3, 5, 7, 6, 12, 5, 16, 6],
                        [0, 11, 4, 5, 9, 5, 13, 4]];
          const tones = ['#8e897f', '#999489', '#858177', '#a09b90', '#8c877d'];
          for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            for (let j = 0; j < r.length; j += 4) {
              const sx = r[j], sy = r[j + 1], sw = r[j + 2], sh = r[j + 3];
              const tone = tones[(i * 3 + j) % tones.length];
              ell(x, sx + sw / 2, sy + sh / 2 + .5, sw / 2 - .5, sh / 2 - .5, '#5d5a53');
              ell(x, sx + sw / 2, sy + sh / 2, sw / 2 - .8, sh / 2 - .8, tone);
              px(x, Math.round(sx + sw * .28), sy + 1, Math.max(2, sw - 3), 1, 'rgba(255,255,255,.13)');
              px(x, Math.round(sx + sw * .3), sy + sh - 2, Math.max(2, sw - 4), 1, 'rgba(50,47,43,.18)');
            }
          }
          dot('#58554f', 3); dot('#b0aa9e', 3); break;
        }
        case 'd': { // sagrato: lastre di tufa chiara, sfalsate e con giunti scuri
          px(x, 0, 0, 16, 16, '#a89d86');
          const rows = [[0,0,5,6],[5,0,6,5],[11,0,5,6],[0,6,4,5],[4,6,7,5],[11,6,5,5],[0,11,6,5],[6,11,5,5],[11,11,5,5]];
          const tones = ['#e3dac6','#d8cdb8','#d1c5ae','#ded4bd'];
          for (let i=0;i<rows.length;i++){ const [sx,sy,sw,sh]=rows[i];
            ell(x,sx+sw/2,sy+sh/2+.5,sw/2-.4,sh/2-.4,'#8f846e');
            ell(x,sx+sw/2,sy+sh/2,sw/2-.8,sh/2-.8,tones[i%tones.length]);
            px(x,sx+1,sy+1,Math.max(2,sw-3),1,'rgba(255,255,255,.17)');
          }
          dot('#b6a98f', 3); break;
        }
        case 'e': { // asse pedonale: basolato compatto ma irregolare, non griglia 4x4
          px(x, 0, 0, 16, 16, '#6f6b63');
          const rows = [[0,0,4,5],[4,0,5,4],[9,0,4,5],[13,0,3,4],
                        [0,5,5,5],[5,5,4,5],[9,5,6,4],[0,10,4,6],[4,10,5,5],[9,10,3,5],[12,10,4,6],[0,15,6,1],[7,15,7,1]];
          const tones = ['#a19b90','#969187','#858078','#9d978c'];
          for (let i=0;i<rows.length;i++){ const [sx,sy,sw,sh]=rows[i];
            if (sh<2) continue;
            ell(x,sx+sw/2,sy+sh/2+.5,sw/2-.4,sh/2-.4,'#635f59');
            ell(x,sx+sw/2,sy+sh/2,sw/2-.8,sh/2-.8,tones[i%tones.length]);
            px(x,sx+1,sy+1,Math.max(2,sw-3),1,'rgba(255,255,255,.10)');
          }
          dot('#6f6a62', 3); break;
        }
        case ',': px(x, 0, 0, 16, 16, '#a58b62'); dot('#8f764f', 16); dot('#bba272', 8); break;
        case 'r':
          px(x, 0, 0, 16, 16, P.road); px(x, 0, 0, 16, 1, P.roadL);
          for (let i = 0; i < 4; i++) px(x, i * 4, 7, 2, 2, P.line);
          dot('#4a4f53', 5); break;
        case 'p': { // marciapiede: lastre lunghe e sfalsate, non griglia 4x8
          px(x, 0, 0, 16, 16, '#a9a293');
          const rows = [[0,0,7,4],[7,0,5,4],[12,0,4,4],
                        [0,4,5,5],[5,4,8,5],[13,4,3,5],
                        [0,9,6,4],[6,9,4,4],[10,9,6,4],
                        [0,13,4,3],[4,13,8,3],[12,13,4,3]];
          const tones = ['#b8b1a2','#c0b9aa','#b1aa9b','#bcb5a6'];
          for (let i=0;i<rows.length;i++){ const [sx,sy,sw,sh]=rows[i];
            px(x,sx,sy,sw,sh,tones[i%tones.length]);
            px(x,sx,sy,Math.max(2,sw-1),1,'rgba(255,255,255,.10)');
            px(x,sx,sy+sh-1,sw,1,'rgba(78,72,64,.16)');
          }
          dot('#ccc5b5', 4); break;
        }
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
          // Rovera lavica leggibile: non un rettangolo nero, ma stratificazione
          // e riflessi caldi che rendono visibile l'ala della grotta.
          px(x, 0, 0, 16, 16, P.cave);
          for (let yy = 3; yy < 16; yy += 5) {
            px(x, 0, yy, 16, 1, 'rgba(24,20,28,.24)');
            px(x, 2 + (yy % 3), yy + 1, 9, 1, 'rgba(150,132,118,.16)');
          }
          dot(P.caveL, 20); dot('#8b765f', 5);
          px(x, 0, 0, 16, 1, '#37333e'); px(x, 0, 15, 16, 1, '#403a46'); break;
        case 'P':
          px(x, 0, 0, 16, 16, P.floor); px(x, 6, 9, 4, 6, P.woodD);
          ell(x, 8, 6, 5, 5, '#4f8a4c'); ell(x, 5, 5, 3, 3, '#6fa85a'); ell(x, 11, 6, 3, 3, '#3f7843'); break;
        case 'Pext': // albero urbano: pavimento continuo + sola conca d'ombra
          px(x, 0, 0, 16, 16, '#b8b1a2');
          for (let xx = 0; xx < 16; xx += 4) px(x, xx, 0, 1, 16, '#a9a293');
          for (let yy = 0; yy < 16; yy += 8) px(x, 0, yy, 16, 1, '#a9a293');
          ell(x, 8, 11, 6, 3, '#8e877a'); ell(x, 8, 10, 5, 2, '#a49b8a'); break;
        case 'tufo': // Pompei: tufo grigio irregolare, non laterizio rosso
          px(x, 0, 0, 16, 16, '#9d9a8d');
          px(x, 0, 0, 16, 2, '#b3afa1'); px(x, 0, 14, 16, 2, '#77756c');
          for (let y = 3; y < 14; y += 5) {
            px(x, 0, y, 16, 1, '#7f7d73');
            for (let xx = (y / 5 % 2) * 5; xx < 16; xx += 10) px(x, xx, y, 1, 5, '#858278');
          }
          dot('#c2beb0', 6); break;
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
        // Ogni tile e' una porzione di arredo o di pavimento: giunti sfalsati,
        // ombre di contatto e piccoli oggetti riconoscibili (tazze, bottiglie,
        // libri, candele). I motivi restano dentro la cella 16x16 e si ripetono
        // senza cuciture visibili.
        case 'A': { // marmo a lastre con venature diagonali
          px(x,0,0,16,16,'#ded7c7');
          for (let yy=0;yy<16;yy+=8) for (let xx=0;xx<16;xx+=8) {
            px(x,xx,yy,8,8,(xx+yy)%16===0?'#d5cdbd':'#e6dfd0');
            px(x,xx,yy,8,1,'rgba(255,255,255,.22)');
            px(x,xx,yy+7,8,1,'rgba(110,100,86,.18)');
            line(x,xx+2,yy+5,xx+6,yy+2,'rgba(150,140,122,.22)',1);
          }
          px(x,0,0,1,16,'#c9c0af'); px(x,8,0,1,16,'#c9c0af');
          px(x,0,8,16,1,'#c9c0af'); break;
        }
        case 'M': { // pavimento in pietra chiara con commessi a spina
          px(x,0,0,16,16,'#d4ccbc');
          for (let yy=0;yy<16;yy+=8) for (let xx=0;xx<16;xx+=8) {
            px(x,xx,yy,8,8,(xx+yy)%16===0?'#c8beac':'#ddd5c5');
            px(x,xx+1,yy+1,6,1,'rgba(255,255,255,.26)');
            px(x,xx+3,yy+4,2,2,'#b8ae9c');
          }
          px(x,0,7,16,1,'rgba(110,100,84,.14)'); break;
        }
        case 'R': { // tappeto rosso con doppio bordo e rombo centrale
          px(x,0,0,16,16,'#7a2525'); px(x,1,0,14,16,'#a53a3a');
          px(x,2,0,1,16,'#c9a44a'); px(x,13,0,1,16,'#c9a44a');
          px(x,3,0,10,16,'#963030');
          poly(x,[[8,2],[14,8],[8,14],[2,8]],'#b84440');
          poly(x,[[8,4],[12,8],[8,12],[4,8]],'#c96752');
          px(x,7,7,2,2,'#e0b95e'); dot('#7a2525',4); break;
        }
        case 'Z': { // parquet: liste sfalsate, venature e nodi
          px(x,0,0,16,16,'#7a5637');
          const planks=[[0,0,7,4],[7,0,9,4],[0,4,10,4],[10,4,6,4],[0,8,5,4],[5,8,11,4],[0,12,12,4],[12,12,4,4]];
          planks.forEach((p,i)=>{ px(x,p[0],p[1],p[2],p[3],i%2?'#8b6542':'#7d5839');
            px(x,p[0],p[1],p[2],1,'rgba(255,230,180,.12)');
            px(x,p[0],p[1]+p[3]-1,p[2],1,'rgba(50,32,20,.24)');
            px(x,p[0]+2,p[1]+2,Math.max(2,p[2]-4),1,'rgba(60,40,24,.16)');
          });
          ell(x,4,10,2,1,'#5e4028'); ell(x,13,5,1,1,'#5e4028'); break;
        }
        case 'h': { // piastrelle di ceramica con stucco e riflesso
          px(x,0,0,16,16,'#a89b7f');
          for (let yy=0;yy<16;yy+=4) for (let xx=0;xx<16;xx+=4) {
            px(x,xx,yy,3,3,(xx+yy)%8===0?'#d8cab0':'#c4b492');
            px(x,xx,yy,3,1,'rgba(255,255,255,.18)');
            px(x,xx,yy+2,3,1,'rgba(90,76,56,.14)');
          }
          dot('#eee0c2',4); break;
        }
        case 'j': { // parete intonacata: velatura verticale, patch, crepe e zoccolino
          px(x,0,0,16,16,'#ddd3c0');
          // La luce cala verso il basso: la parete acquista spessore senza
          // coprire i decori, che vengono disegnati dopo il livello dei tile.
          for (let yy=0;yy<13;yy++) px(x,0,yy,16,1,'rgba(70,58,44,'+(.10*yy/13).toFixed(3)+')');
          px(x,0,0,16,1,'#c5bcaa'); px(x,0,1,16,1,'rgba(255,255,255,.24)');
          x.fillStyle='rgba(255,250,236,.16)';
          x.fillRect(2,4,5,3); x.fillRect(10,7,4,2); x.fillRect(5,10,3,2);
          x.fillStyle='rgba(120,104,84,.12)';
          x.fillRect(7,3,3,1); x.fillRect(1,8,4,1); x.fillRect(12,11,3,1);
          px(x,3,5,1,4,'rgba(120,104,84,.16)'); px(x,4,8,2,1,'rgba(120,104,84,.12)');
          px(x,11,3,1,5,'rgba(120,104,84,.14)'); px(x,12,7,2,1,'rgba(120,104,84,.10)');
          px(x,0,12,16,1,'rgba(88,76,60,.26)');
          px(x,0,13,16,1,'#cbbfa9'); px(x,0,14,16,2,'#b9ad98');
          px(x,0,14,16,1,'#e2d8c4'); px(x,0,15,16,1,'rgba(70,58,44,.22)'); break;
        }
        case 'l': { // colonna scanalata con capitello e base
          px(x,0,0,16,16,'#cfc5b3'); px(x,3,0,10,16,'#ddd3c2');
          px(x,4,0,2,16,'#efe6d6'); px(x,7,0,2,16,'#c5bbaa');
          px(x,11,0,2,16,'#bdb3a1'); px(x,2,0,12,3,'#e8dfcf');
          px(x,2,3,12,1,'#b8ae9c'); px(x,2,13,12,2,'#e8dfcf');
          px(x,2,15,12,1,'#a89e8d'); break;
        }
        case 'n': { // panca di chiesa: schienale, sedile a liste e gambe
          px(x,0,0,16,16,'#d9d2c3');
          px(x,1,5,14,3,'#6f4f34'); px(x,2,6,12,1,'#9a7048');
          for (let yy=8;yy<=11;yy+=2) { px(x,2,yy,12,1,'#855f3d'); px(x,2,yy+1,12,1,'#6b4a31'); }
          px(x,2,12,12,1,'#4a382b'); px(x,3,13,3,2,'#5a4028'); px(x,11,13,3,2,'#5a4028');
          px(x,1,15,14,1,'rgba(30,24,20,.16)'); break;
        }
        case 'q': { // altare con gradini, paliotto e candelieri
          px(x,0,0,16,16,'#d4ccbc');
          px(x,0,12,16,4,'#b9ad98'); px(x,1,10,14,2,'#e6dcc8');
          px(x,2,4,12,7,'#ece3d1'); px(x,2,4,12,1,'#c9a44a');
          px(x,3,5,10,5,'#f3ecdd'); px(x,6,6,4,3,'#c9a44a');
          line(x,8,6,8,9,'#f5f0df',1); line(x,7,7,9,7,'#f5f0df',1);
          for (const cx0 of [3,12]) { px(x,cx0,2,1,3,'#efe2c6'); px(x,cx0,1,1,1,'#f3c44f'); }
          break;
        }
        case 's': { // scansia: tre ripiani con bottiglie e bicchieri
          px(x,0,0,16,16,'#ddd3c0'); px(x,1,1,14,14,'#6b4b33');
          for (const sy of [2,6,10]) {
            px(x,2,sy,12,4,'#87613f'); px(x,2,sy+3,12,1,'#4f3725');
            px(x,3,sy+1,2,2,'#c9564a'); px(x,6,sy+1,2,2,'#4a87b8');
            px(x,9,sy+1,2,2,'#7a9a5a'); px(x,12,sy+1,2,2,'#e9b84a');
            px(x,2,sy,12,1,'rgba(255,235,200,.24)');
          }
          px(x,1,14,14,2,'#4f3725'); break;
        }
        case 'u': { // bancone: piano in marmo, cassetti, predella ottonata
          px(x,0,0,16,16,'#7a5637'); px(x,0,0,16,3,'#9b7349');
          px(x,0,3,16,2,'#ece3d1'); px(x,0,3,16,1,'#fff7e4');
          px(x,0,5,16,1,'#5e4028'); px(x,1,6,14,7,'#68472d');
          for (let i=3;i<15;i+=4) { px(x,i,7,3,4,'#7d5839'); px(x,i,8,3,1,'#9b7349'); px(x,i+1,9,1,1,'#c9a44a'); }
          px(x,0,13,16,2,'#4a3526'); px(x,1,15,14,1,'#c9a44a'); break;
        }
        case 'v': { // tavolino tondo visto dall'alto: tovaglia, piatto, tazza
          px(x,0,0,16,16,'#d8ccb4');
          ell(x,8,7,7,5,'#65432e'); ell(x,8,6,7,5,'#a07050');
          ell(x,8,6,5,3,'#e3d7bd'); ell(x,8,6,3,2,'#f3ecdd');
          px(x,10,4,2,2,'#c9564a'); px(x,7,8,2,1,'#8b6244');
          px(x,4,13,2,3,'#65432e'); px(x,10,13,2,3,'#65432e');
          px(x,3,15,10,1,'rgba(30,24,20,.14)'); break;
        }
        case 'w': { // sedia impagliata con schienale a liste
          px(x,0,0,16,16,'#d8ccb4'); px(x,3,2,10,6,'#7a5637');
          for (let i=4;i<13;i+=2) px(x,i,3,1,4,'#a87c52');
          px(x,3,8,10,3,'#986d48'); px(x,3,8,10,1,'#b78a5c');
          px(x,4,11,2,4,'#65432e'); px(x,10,11,2,4,'#65432e');
          px(x,3,15,10,1,'rgba(30,24,20,.16)'); break;
        }
        case 'x': { // finestra con vetri, traversa e davanzale
          px(x,0,0,16,16,'#d8ccb4'); px(x,1,2,14,12,'#6b4b33');
          px(x,2,3,12,10,'#a9ccd8'); px(x,2,3,12,4,'#dfeef0');
          px(x,2,9,12,4,'#8fb0c8'); px(x,7,3,2,10,'#6b4b33');
          px(x,2,7,12,2,'#6b4b33'); px(x,3,4,3,2,'rgba(255,255,255,.32)');
          px(x,0,14,16,2,'#b08a45'); break;
        }
        case 'y': { // macchina da caffe' in acciaio: manometro, erogatore, tazze
          px(x,0,0,16,16,'#d6cbb6'); px(x,1,2,14,12,'#8a8f95');
          px(x,2,3,12,4,'#5d6670'); ell(x,6,5,2,2,'#e8e2cf');
          px(x,6,5,1,1,'#c9564a'); px(x,10,4,3,1,'#c9a44a');
          px(x,3,8,10,2,'#b6bcc0'); px(x,4,10,2,3,'#3f4750');
          px(x,10,10,2,3,'#3f4750'); px(x,4,13,3,2,'#f0e4cf');
          px(x,9,13,3,2,'#f0e4cf'); px(x,1,2,14,1,'#d7dcdc'); break;
        }
        case 'z': { // lavello con rubinetto e riflesso
          px(x,0,0,16,16,'#d7ccb8'); px(x,2,5,12,7,'#b6bab8');
          px(x,3,6,10,5,'#8fa9b2'); px(x,4,7,8,3,'#bcd6dc');
          px(x,7,2,2,4,'#9aa3ad'); px(x,6,2,4,1,'#c3cad0');
          px(x,7,11,2,2,'#8b6244'); px(x,2,12,12,1,'#a29783'); break;
        }
        case '1': { // divanetto di legno con cuscino
          px(x,0,0,16,16,'#d8ccb4'); px(x,1,4,14,5,'#7a5637');
          px(x,2,5,12,3,'#986d48'); px(x,3,6,10,1,'#b78a5c');
          px(x,2,9,12,2,'#68472d'); px(x,2,11,2,4,'#65432e');
          px(x,12,11,2,4,'#65432e'); px(x,2,15,12,1,'rgba(30,24,20,.14)'); break;
        }
        case '2': { // monitor / display con riflesso e base
          px(x,0,0,16,16,'#d8ccb4'); px(x,2,2,12,8,'#2f3c46');
          px(x,3,3,10,6,'#6fb0c8'); px(x,4,4,4,2,'rgba(255,255,255,.34)');
          px(x,8,6,4,1,'#a9d5de'); px(x,7,10,2,3,'#59636d');
          px(x,4,13,8,2,'#4a545c'); break;
        }
        case '3': { // registratore di cassa con tastierino e display
          px(x,0,0,16,16,'#d8ccb4'); px(x,3,4,10,8,'#4a5560');
          px(x,4,5,8,3,'#9fc3d8'); px(x,5,6,4,1,'#e9f5f3');
          for (let i=4;i<12;i+=2) px(x,i,9,1,1,'#d8ccb4');
          px(x,5,12,6,1,'#c9a44a'); px(x,2,13,12,2,'#3f4750'); break;
        }
        case '4': { // libreria con tre ripiani e libri di altezze diverse
          px(x,0,0,16,16,'#ddd3c0'); px(x,1,1,14,14,'#6b4b33');
          const cols=['#c9564a','#4a87b8','#e9b84a','#7a9a5a','#f0e4cf','#8a6fa8'];
          for (let sh=0;sh<3;sh++) {
            const by=2+sh*4;
            px(x,2,by+3,12,1,'#4f3725');
            for (let i=0;i<6;i++) px(x,2+i*2,by+1+(i%2),1,2,cols[(i+sh)%cols.length]);
          }
          px(x,1,14,14,2,'#4f3725'); break;
        }
        case '5': { // candela con fiamma, cera colante e porta-candela
          px(x,0,0,16,16,'#d4ccbc'); px(x,7,8,2,5,'#efe2c6');
          px(x,7,6,2,2,'#f3c44f'); px(x,8,5,1,2,'#e8843c');
          px(x,6,7,1,3,'#f8eed2'); px(x,6,10,4,1,'#c9a44a');
          px(x,5,11,6,2,'#8a7048'); px(x,4,13,8,1,'rgba(30,24,20,.14)'); break;
        }
        case '6': { // vaso con pianta e foglie a livelli
          px(x,0,0,16,16,'#ddd3c0'); px(x,6,10,4,4,'#7a5637');
          px(x,5,9,6,2,'#a07050'); ell(x,8,7,5,4,'#5f7e96');
          ell(x,6,6,3,2,'#7a9a5a'); ell(x,11,5,3,2,'#4f8a4c');
          px(x,8,4,1,4,'#3f6f3b'); px(x,7,2,2,2,'#e9b84a');
          px(x,4,14,8,1,'rgba(30,24,20,.14)'); break;
        }
        case '7': { // finestra con tenda, montanti e davanzale in legno
          px(x,0,0,16,16,'#d8cdb7'); px(x,1,2,14,12,'#6b5540');
          px(x,2,3,12,10,'#9fc3d8'); px(x,2,3,12,3,'#dcecef');
          px(x,3,6,4,7,'#e8dcc0'); px(x,10,6,4,7,'#e8dcc0');
          px(x,7,3,2,10,'#6b5540'); px(x,2,8,12,2,'#6b5540');
          px(x,3,4,3,2,'rgba(255,255,255,.32)'); px(x,1,14,14,2,'#a97c52');
          break;
        }
        case '8': { // porta con pannelli, maniglia e ombra sotto la soglia
          px(x,0,0,16,16,'#ddd3c0'); px(x,2,1,12,15,'#5a4028');
          px(x,3,2,10,13,'#855f3d'); px(x,4,3,8,4,'#9b7349');
          px(x,4,8,8,4,'#9b7349'); px(x,4,3,8,1,'#b78a5c');
          px(x,4,8,8,1,'#b78a5c'); px(x,10,10,1,1,'#c9a44a');
          px(x,2,15,12,1,'rgba(30,24,20,.22)'); break;
        }
        case '9': { // pianta in vaso con foglie a più livelli
          px(x,0,0,16,16,'#d8ccb4'); px(x,6,10,4,4,'#8b6244');
          px(x,5,9,6,2,'#a07050'); ell(x,8,7,5,4,'#5f9a4e');
          ell(x,6,6,3,2,'#7ab868'); ell(x,11,5,2,2,'#4f8a4c');
          px(x,8,3,1,4,'#3f6f3b'); px(x,4,14,8,1,'rgba(30,24,20,.16)'); break;
        }
        case '0': { // vetrina con tre prodotti e riflesso sul vetro
          px(x,0,0,16,16,'#d8ccb4'); px(x,1,3,14,10,'#8b6244');
          px(x,2,4,12,6,'#dceef3'); px(x,3,5,3,3,'#e0ab69');
          px(x,7,5,3,3,'#d9543f'); px(x,11,5,2,3,'#f2d24f');
          px(x,3,5,3,1,'rgba(255,255,255,.34)');
          px(x,2,10,12,2,'#6b4b33'); px(x,2,12,12,1,'#a07050');
          px(x,1,13,14,1,'rgba(30,24,20,.18)'); break;
        }
        default: px(x, 0, 0, 16, 16, '#d44d9a');
      }
      return c;
    },

    /* ------------------------------------------------------- oggetti alti */
    _treeRaw(variant) {
      const key = 'raw:tree' + variant; if (this.cache[key]) return this.cache[key];
      const v = variant % 7, c = cvRaw(32, 40), x = ctxRaw(c), R = U.rng(v * 977 + 13);
      const palette = ['#4d8146', '#5d944f', '#437a45', '#6b914b', '#3f7a52', '#578a43', '#487f57'];
      const base = palette[v];
      const lean = [0, 1, -1, 0, 2, -1, 1][v];
      const crownX = 16 + lean, crownY = [17, 18, 16, 19, 17, 16, 18][v];
      const rx = [12, 13, 11, 12, 13, 11, 12][v], ry = [10, 11, 10, 9, 11, 10, 12][v];
      // Ombra di contatto: due ellissi e piccoli ciuffi d'erba, mai un quadrato.
      // Più marcata del passaggio precedente: l'albero poggia sul selciato.
      ell(x, 16 + lean / 2, 37, 13, 4, 'rgba(28,26,22,.24)');
      ell(x, 16 + lean / 2, 36, 10, 2, 'rgba(28,26,22,.32)');
      px(x, 8 + lean, 36, 2, 1, '#668f46'); px(x, 22 + lean, 37, 3, 1, '#6f994c');
      // Fusto rastremato con corteccia e biforcazioni: la chioma non e' un pallone piatto.
      poly(x, [[13 + lean, 38], [19 + lean, 38], [18 + lean, 25], [14 + lean, 25]], '#5e442f');
      px(x, 14 + lean, 26, 4, 12, P.woodD); px(x, 15 + lean, 26, 2, 12, P.wood);
      px(x, 15 + lean, 29, 1, 5, '#9a704b'); px(x, 18 + lean, 31, 1, 4, '#3e2d20');
      line(x, 15 + lean, 28, 10 + lean, 23, '#6b4d33', 1);
      line(x, 18 + lean, 27, 22 + lean, 22, '#6b4d33', 1);
      px(x, 12 + lean, 37, 4, 2, '#7a5738'); px(x, 17 + lean, 37, 4, 2, '#6a4931');
      // Volumi sovrapposti: faccia in ombra a destra, luce alta a sinistra.
      ell(x, crownX, crownY + 2, rx + 1, ry, '#2f3f2d');
      ell(x, crownX, crownY, rx, ry - 1, shade(base, -18));
      ell(x, crownX - 5, crownY - 4, rx - 4, ry - 3, shade(base, 16));
      ell(x, crownX + 5, crownY - 1, rx - 6, ry - 3, shade(base, -28));
      ell(x, crownX + (v % 2 ? 2 : -2), crownY - 8, 6, 4, shade(base, 30));
      ell(x, crownX - 8, crownY + 2, 4, 3, shade(base, -10));
      // Ciuffi di foglie disposti lungo i contorni, non texture casuale uniforme.
      for (let i = 0; i < 28; i++) {
        const a = R() * Math.PI * 2, rr = .55 + R() * .42;
        const lx = crownX + Math.round(Math.cos(a) * rx * rr);
        const ly = crownY + Math.round(Math.sin(a) * (ry - 1) * rr);
        px(x, lx, ly, 2, 1, Math.cos(a) < -.15 ? shade(base, 34) : shade(base, -34));
        if (i % 3 === 0) px(x, lx, ly - 1, 1, 1, shade(base, 22));
      }
      // Ombre di rimbalzo sul fusto e ciuffi lungo il bordo inferiore: la
      // chioma ha volume e poggia sul tronco, senza cambiare l'ancoraggio.
      px(x, 17 + lean, 30, 2, 6, 'rgba(20,26,18,.18)');
      for (let i = 0; i < 5; i++) {
        const lx = crownX - rx + 3 + i * Math.round((rx * 2 - 6) / 4);
        px(x, lx, crownY + ry - 1, 2, 1, shade(base, -24));
      }
      return this.cache[key] = c;
    },
    _tree(variant) {
      const key = 'tree' + variant; if (this.cache[key]) return this.cache[key];
      const c = cv(32, 40), x = ctx(c); x.drawImage(this._treeRaw(variant), 0, 0);
      return this.cache[key] = c;
    },
    _lemonTree(variant) {
      // Parte sempre dal grezzo: riusare il canvas di tree() dopo che era
      // stato cacheato produceva un doppio downscale (albero visibile 14 px).
      const key = 'lemon' + variant;
      if (this.cache[key]) return this.cache[key];
      const n = cv(32, 40), x = ctx(n); x.drawImage(this._treeRaw(variant), 0, 0);
      const v = variant % 7;
      [[9, 16], [22, 21], [15, 10], [25, 13], [12, 24], [20, 8]].forEach(([a, b], i) => {
        const ax = a + [0, 1, -1, 2, 0, -2, 1][v], by = b + (i % 2 ? v % 2 : -(v % 2));
        // Limone con peduncolo, foglia e riflesso: leggibile anche a 8 px/m.
        px(x, ax, by + 1, 3, 3, '#c99a2f'); px(x, ax, by + 2, 2, 2, '#f2d24f');
        px(x, ax, by + 2, 1, 1, '#fff3b0'); px(x, ax + 1, by, 1, 1, '#6f8d43');
        if (i % 2 === 0) px(x, ax - 1, by - 1, 2, 1, '#4f8a4c');
      });
      // Fiori d'arancio: pochi punti chiari tra le foglie, non texture casuale.
      const blooms = [[7, 13], [18, 18], [24, 10]];
      blooms.forEach(([bx, by], i) => {
        px(x, bx + [0, 1, -1][v % 3], by, 2, 2, '#f6efd4');
        px(x, bx + 1, by + 1, 1, 1, '#e0a94c');
      });
      // Ombra dei frutti sulle foglie adiacenti, coerente con la luce alta.
      [[10, 18], [23, 23], [16, 12]].forEach(([sx, sy], i) => {
        px(x, sx + (i % 2 ? 3 : -1), sy + 3, 3, 1, 'rgba(20,28,16,.20)');
      });
      return this.cache[key] = n;
    },
    _palmTree(variant) {
      // Washingtonia del Viale Augusto: tronco alto, chioma a ventaglio e
      // ombra di contatto. Nessuna chioma sferica da albero da frutto.
      const key = 'palm' + variant; if (this.cache[key]) return this.cache[key];
      const v = variant % 7, c = cv(32, 40), x = ctx(c), R = U.rng(v * 421 + 7);
      const lean = [0, 1, -1, 1, 0, -2, 2][v];
      const topY = [14, 12, 15, 13, 16, 12, 14][v];
      ell(x, 16 + lean, 37, 11, 3, 'rgba(28,26,22,.15)');
      ell(x, 16 + lean, 36, 8, 2, 'rgba(28,26,22,.22)');
      // Fusto: segmente corti e ombra longitudinale, non un rettangolo piatto.
      poly(x, [[14 + lean, 38], [18 + lean, 38], [17 + lean, topY + 4], [15 + lean, topY + 4]], '#6b5137');
      px(x, 15 + lean, topY + 4, 2, 34 - topY, '#9a7650');
      px(x, 17 + lean, topY + 5, 1, 31 - topY, '#4d3727');
      for (let yy = topY + 7; yy < 37; yy += 3) px(x, 15 + lean, yy, 3, 1, 'rgba(60,42,28,.42)');
      // Fronde radiali: linee spesse con foglioline ai lati, lunghezze diverse.
      const cx = 16 + lean;
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + (v % 3) * .12;
        const len = 10 + (i % 3) * 2 + (v % 2);
        const ex = cx + Math.round(Math.cos(a) * len);
        const ey = topY + 3 + Math.round(Math.sin(a) * (len * .52));
        const col = Math.sin(a) > .25 ? '#2f5c35' : (Math.cos(a) < -.2 ? '#5e9347' : '#427a3d');
        line(x, cx, topY + 3, ex, ey, col, 2);
        // penne lungo la fronda, disposte solo sul lato esterno
        for (let s = 3; s < len; s += 2) {
          const px0 = cx + Math.round(Math.cos(a) * s);
          const py0 = topY + 3 + Math.round(Math.sin(a) * s * .52);
          const tip = Math.sin(a) > 0 ? 1 : -1;
          px(x, px0, py0 + tip, 2, 1, shade(col, R() > .5 ? 16 : -14));
        }
        px(x, ex, ey, 2, 1, shade(col, 24));
      }
      // Cuore della chioma e qualche fronda caduta, per non lasciare un buco.
      ell(x, cx, topY + 3, 4, 3, '#537f40');
      px(x, cx - 2, topY + 1, 3, 1, '#76a352');
      px(x, cx + 11, topY + 8, 3, 1, '#6a8f49');
      // Falda di fibre secche sotto la chioma e ombra delle fronde sul fusto.
      for (let i = 0; i < 5; i++) px(x, cx - 3 + i * 2, topY + 6 + (i % 2), 1, 2, '#9a7650');
      px(x, 16 + lean, topY + 8, 1, 5, 'rgba(20,26,18,.22)');
      return this.cache[key] = c;
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
      px(x, 5, 7, 2, 1, '#3f6f3b'); px(x, 4, 4, 1, 1, 'rgba(20,26,18,.24)');
      px(x, 2, 2, 3, 2, col); px(x, 3, 1, 1, 4, col); px(x, 3, 3, 1, 1, '#e8a13c');
      px(x, 2, 2, 1, 1, '#fff4c8');
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
    /* La sagoma e l'ancoraggio dei piedi restano identici: cambiano solo le
     * finiture a 1 px (collo, pieghe, scarpe, sopracciglia, riflessi sui capelli)
     * in modo che il personaggio legga come figura a tre quarti e non a blocchi. */
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
      // Ombra di contatto con nucleo piu' scuro sotto i piedi.
      px(x, 3, 22, 10, 2, 'rgba(18,22,28,.20)');
      px(x, 5, 23, 6, 1, 'rgba(18,22,28,.16)');
      if (isSide) {
        const lx = 6 + (f === 1 ? 1 : f === 3 ? -1 : 0);
        px(x, lx, 17 + bob, 3, 4, look.pants); px(x, lx, 17 + bob, 1, 3, pantsL);
        px(x, lx + 2, 18 + bob, 1, 3, pantsD);
        px(x, lx + 1, 21 + bob, 3, 2, shoe); px(x, lx + 1, 22 + bob, 3, 1, shoeD);
        px(x, lx + 1, 21 + bob, 2, 1, '#8a7160'); // laccio
      } else {
        px(x, 5, 17 + bob, 3, 4 + Math.max(0, legA), look.pants);
        px(x, 9, 17 + bob, 3, 4 + Math.max(0, -legA), look.pants);
        px(x, 5, 17 + bob, 1, 3, pantsL); px(x, 9, 17 + bob, 1, 3, pantsL);
        px(x, 7, 18 + bob, 1, 3, pantsD); px(x, 11, 18 + bob, 1, 3, pantsD);
        px(x, 4, 21 + bob + legA, 4, 2, shoe); px(x, 9, 21 + bob - legA, 4, 2, shoe);
        px(x, 4, 22 + bob + legA, 4, 1, shoeD); px(x, 9, 22 + bob - legA, 4, 1, shoeD);
        px(x, 5, 21 + bob + legA, 2, 1, '#8a7160'); px(x, 10, 21 + bob - legA, 2, 1, '#8a7160');
      }
      const bx = isSide ? 5 + (anim === 'run' ? (dir === 'left' ? -1 : 1) : 0) : 4, bw = isSide ? 6 : 8;
      px(x, bx, 11 + bob, bw, 7, look.shirt);
      px(x, bx, 11 + bob, bw, 1, shirtD); px(x, bx, 17 + bob, bw, 1, shirtD);
      px(x, bx + 1, 12 + bob, 2, 4, shirtL);
      px(x, bx + bw - 1, 12 + bob, 1, 5, shirtD);
      px(x, bx + 2, 16 + bob, bw - 4, 1, pantsD); // cintura
      px(x, bx + bw / 2 - 1 | 0, 16 + bob, 2, 1, '#c9a44a'); // fibbia
      if (!isSide) {
        px(x, bx + 3, 11 + bob, 2, 2, skinD); // scollo a V
        px(x, bx + 3, 11 + bob, 1, 1, skinL);
        px(x, bx + 1, 14 + bob, 2, 1, shirtD); // piega della manica
      }
      if (isSide) {
        const ax = dir === 'left' ? 4 : 10;
        px(x, ax, 12 + bob + armA, 2, 4, look.shirt);
        px(x, ax, 15 + bob + armA, 2, 1, shirtD);
        px(x, ax, 16 + bob + armA, 2, 2, look.skin);
        px(x, ax, 17 + bob + armA, 1, 1, skinD);
      } else {
        px(x, 2, 12 + bob + armA, 2, 4, look.shirt); px(x, 12, 12 + bob - armA, 2, 4, look.shirt);
        px(x, 2, 15 + bob + armA, 2, 1, shirtD); px(x, 12, 15 + bob - armA, 2, 1, shirtD);
        px(x, 2, 16 + bob + armA, 2, 2, look.skin); px(x, 12, 16 + bob - armA, 2, 2, look.skin);
        px(x, 2, 17 + bob + armA, 1, 1, skinD); px(x, 13, 17 + bob - armA, 1, 1, skinD);
      }
      px(x, 7, 10 + bob, 2, 2, skinD);
      const hx = 4;
      px(x, hx, 3 + bob, 8, 8, look.skin);
      px(x, hx - 1, 5 + bob, 1, 5, skinD); px(x, hx + 8, 5 + bob, 1, 5, skinL);
      px(x, hx, 4 + bob, 1, 5, skinL); px(x, hx + 7, 4 + bob, 1, 5, skinD);
      px(x, hx, 10 + bob, 8, 1, skinD);
      px(x, hx - 1, 2 + bob, 10, 3, look.hair); px(x, hx - 1, 4 + bob, 1, 4, look.hair); px(x, hx + 8, 4 + bob, 1, 4, look.hair);
      px(x, hx, 1 + bob, 8, 1, hairL); px(x, hx, 2 + bob, 8, 1, hairD);
      if (dir === 'up') {
        // Nuca: ciuffi e volume, nessun volto visibile.
        px(x, hx - 1, 3 + bob, 10, 8, look.hair);
        px(x, hx + 1, 5 + bob, 6, 4, hairD);
        px(x, hx + 2, 4 + bob, 3, 1, hairL);
        px(x, hx, 2 + bob, 8, 1, hairL);
        px(x, hx - 1, 8 + bob, 2, 3, hairD);
      } else if (dir === 'left' || dir === 'right') {
        const front = dir === 'left' ? hx : hx + 5;
        px(x, front, 4 + bob, 3, 6, look.hair);
        px(x, dir === 'left' ? hx + 1 : hx + 6, 6 + bob, 2, 1, hairL);
        const ex = dir === 'left' ? hx + 1 : hx + 6;
        px(x, ex, 7 + bob, 1, 2, d); px(x, ex, 7 + bob, 1, 1, '#fff');
        px(x, ex - (dir === 'left' ? 1 : -1), 6 + bob, 1, 1, hairD); // sopracciglio
        px(x, dir === 'left' ? hx - 1 : hx + 8, 8 + bob, 1, 2, skinL); // naso di profilo
        px(x, dir === 'left' ? hx + 1 : hx + 5, 9 + bob, 2, 1, shade(look.skin, -30));
        px(x, dir === 'left' ? hx + 8 : hx, 4 + bob, 1, 5, hairD);
      } else {
        // Fronte: sopracciglia, occhi con bianco, naso e bocca.
        px(x, hx + 2, 6 + bob, 1, 1, hairD); px(x, hx + 6, 6 + bob, 1, 1, hairD);
        px(x, hx + 2, 7 + bob, 1, 2, d); px(x, hx + 6, 7 + bob, 1, 2, d);
        px(x, hx + 2, 7 + bob, 1, 1, '#fff'); px(x, hx + 6, 7 + bob, 1, 1, '#fff');
        px(x, hx + 4, 8 + bob, 1, 1, skinD);
        px(x, hx + 4, 9 + bob, 1, 1, shade(look.skin, -30));
        px(x, hx + 3, 10 + bob, 3, 1, 'rgba(120,60,50,.20)');
        px(x, hx + 2, 4 + bob, 2, 1, hairL);
        px(x, hx + 8, 5 + bob, 1, 3, hairD);
      }
      // L'ammiccamento dell'idle chiude gli occhi con la stessa tonalita' dei capelli.
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
    /* Vista dall'alto a tre quarti: parabrezza inclinato, passaruota, riflessi
     * sui vetri e ombre di contatto. Le dimensioni dei canvas restano quelle
     * storiche (30x20 / 20x30 px sorgente), così gli offset del motore e le
     * impronte a terra non cambiano. */
    _vehicle(type, dir) {
      const key = ['veh', type, dir].join('|'); if (this.cache[key]) return this.cache[key];
      const vertical = dir === 'up' || dir === 'down';
      const W = type === 'bus' ? 34 : type === 'car' || type === 'taxi' || type === 'van' ? 30 : type === 'scooter' ? 26 : 24;
      const c = cv(vertical ? 20 : W, vertical ? 30 : 20), x = ctx(c);
      const body = {
        car: '#3f8fae', taxi: '#e8b635', van: '#e6e7dd', bus: '#d9a63c',
        scooter: '#c94f43', bike: '#4f8f6a'
      }[type] || '#3f8fae';
      const dark = '#24272c', glass = '#9fd0dd', light = '#ffe9a8', red = '#e8613c';
      const rim = '#b9c0c1';
      const wheel = (wx, wy, r) => {
        ell(x, wx, wy, r + 1, r + 1, 'rgba(20,23,26,.20)');
        ell(x, wx, wy, r, r, dark);
        ell(x, wx, wy, r - 1, r - 1, '#545b61');
        ell(x, wx, wy, r - 2, r - 2, rim);
        px(x, wx - 1, wy - 1, 2, 2, '#e6eae6');
        for (let a = 0; a < 360; a += 90) {
          const rad = a * Math.PI / 180;
          px(x, wx + Math.round(Math.cos(rad) * (r - 1)) - 1,
                wy + Math.round(Math.sin(rad) * (r - 1)) - 1, 2, 2, '#727a7e');
        }
      };
      const arch = (wx, wy) => {
        ell(x, wx, wy + 1, 6, 5, shade(body, -58));
        ell(x, wx, wy + 1, 5, 4, '#34393d');
      };
      const lamp = (lx, ly, head) => {
        px(x, lx, ly, 3, 2, head ? light : red);
        px(x, lx, ly, 2, 1, head ? '#fffbe2' : '#ff9a73');
        if (head) px(x, lx + (dir === 'left' || dir === 'up' ? -1 : 3), ly, 1, 2, 'rgba(255,232,160,.30)');
      };

      if (!vertical) {
        const frontRight = dir === 'right';
        // MX rispecchia i dettagli direzionali: il lato "avanti" e' sempre a destra.
        const MX = a => frontRight ? a : W - a;
        ell(x, W / 2, 17, W / 2 - 3, 2, 'rgba(0,0,0,.20)');
        if (type === 'bike') {
          wheel(6, 15, 4); wheel(W - 6, 15, 4);
          // Telaio a triangolo, forcella, catena e sella: non una barra piatta.
          line(x, 6, 15, 11, 10, shade(body, 18), 2);
          line(x, 11, 10, W - 6, 15, shade(body, -12), 2);
          line(x, 6, 15, W - 6, 15, shade(body, -26), 1);
          line(x, 11, 10, 9, 15, body, 2);
          line(x, W - 6, 8, W - 6, 15, '#9aa2a4', 1);
          px(x, 8, 8, 6, 2, dark); px(x, 9, 7, 4, 1, shade(body, 26));
          px(x, MX(W - 10), 7, 6, 2, dark); px(x, MX(W - 9), 6, 4, 1, '#cdd3d0');
          px(x, 10, 12, 4, 2, '#2f6a4d'); px(x, 11, 13, 3, 1, '#8b6a3f');
          px(x, 6, 11, 7, 1, shade(body, -20)); px(x, W - 11, 11, 6, 1, shade(body, -20));
          lamp(MX(W - 8), 8, true); px(x, MX(3), 10, 2, 2, red);
          px(x, 12, 16, 2, 1, '#d7c98f'); // pedale
        } else if (type === 'scooter') {
          const ax = 6, bx = W - 6;
          wheel(ax, 15, 4); wheel(bx, 15, 4);
          px(x, ax, 10, bx - ax, 5, shade(body, -16));
          poly(x, [[ax + 1, 10], [bx - 2, 10], [bx - 3, 8], [ax + 3, 8]], body);
          px(x, ax + 2, 10, bx - ax - 5, 1, shade(body, 30));
          px(x, ax + 2, 13, bx - ax - 5, 1, 'rgba(20,18,16,.24)');
          // Scudo anteriore inclinato, faro, specchio e parafango posteriore.
          poly(x, [[bx - 4, 12], [bx - 1, 12], [bx + 1, 4], [bx - 2, 4]], shade(body, 12));
          px(x, bx - 2, 5, 3, 2, light); px(x, bx - 2, 5, 1, 1, '#fffbe2');
          line(x, bx - 1, 4, bx - 3, 1, '#666f72', 1);
          px(x, bx - 6, 1, 4, 1, '#8b9496');
          px(x, ax + 1, 6, 7, 3, '#3b3f42'); px(x, ax + 2, 6, 5, 1, shade(body, 24));
          px(x, ax - 1, 12, 6, 1, shade(body, -28));
          px(x, ax + 4, 13, 3, 3, '#585f62'); // scarico
          px(x, MX(9), 9, 3, 2, '#f0d58a'); // cassetto portaoggetti
          lamp(MX(W - 5), 8, true); px(x, MX(3), 9, 2, 2, red);
        } else if (type === 'bus') {
          const wheels = [7, W - 7];
          px(x, 1, 4, W - 2, 13, body);
          px(x, 2, 5, W - 4, 2, shade(body, 26));
          px(x, 2, 14, W - 4, 2, shade(body, -40));
          for (let wx = 4; wx < W - 7; wx += 8) {
            px(x, wx, 7, 6, 5, glass);
            px(x, wx, 7, 6, 1, 'rgba(255,255,255,.30)');
            px(x, wx, 11, 6, 1, '#5d6e70');
            px(x, wx + 6, 7, 1, 5, shade(body, -20));
          }
          // Porta anteriore, corsia e insegna della linea.
          px(x, MX(W - 9), 7, 5, 7, '#6f7674');
          px(x, MX(W - 8), 8, 3, 5, glass);
          px(x, MX(W - 9), 7, 1, 7, '#e9e2cb');
          px(x, MX(W - 7), 3, 6, 2, '#3d4147');
          px(x, MX(W - 6), 3, 4, 1, '#f6e27a');
          for (let i = 3; i < W - 3; i += 6) px(x, i, 16, 2, 1, 'rgba(20,20,18,.24)');
          for (const wx of wheels) { arch(wx, 16); wheel(wx, 16, 4); }
          lamp(MX(W - 4), 11, true); px(x, MX(1), 11, 2, 2, red);
          px(x, 6, 2, 10, 2, shade(body, -30)); // botola sul tetto
          px(x, 2, 18, W - 4, 1, 'rgba(20,22,24,.12)'); // ombra sotto il corpo
        } else {
          const wheels = [7, W - 7];
          px(x, 2, 11, W - 4, 6, body);
          px(x, 3, 11, W - 6, 1, shade(body, 28));
          px(x, 2, 16, W - 4, 1, shade(body, -48));
          if (type === 'van') {
            poly(x, [[3, 12], [4, 5], [W - 5, 5], [W - 4, 12]], body);
            px(x, 4, 5, W - 8, 1, shade(body, 32));
            px(x, MX(W - 11), 6, 8, 4, glass);
            px(x, MX(W - 11), 6, 4, 1, 'rgba(255,255,255,.34)');
            line(x, MX(13), 6, MX(13), 16, shade(body, -34), 1); // porta scorrevole
            px(x, MX(15), 12, 3, 1, '#d7d3c2');
            for (let i = 5; i < 12; i += 3) px(x, MX(5), i, 6, 1, shade(body, -16));
          } else {
            poly(x, [[6, 12], [9, 6], [W - 10, 6], [W - 6, 12]], shade(body, 14));
            poly(x, [[8, 11], [10, 7], [W - 12, 7], [W - 8, 11]], glass);
            px(x, MX(10), 7, 5, 1, 'rgba(255,255,255,.36)');
            px(x, MX(W - 12), 7, 3, 4, shade(glass, -26));
            line(x, MX(W / 2), 7, MX(W / 2), 12, shade(body, -34), 1);
            px(x, MX(W / 2 - 5), 13, 3, 1, '#efe4c2'); // maniglia
            px(x, MX(W - 8), 11, 3, 1, '#666f72'); // specchietto
            line(x, MX(12), 9, MX(16), 11, 'rgba(40,50,54,.55)', 1); // tergicristallo
            px(x, MX(W - 7), 12, 2, 1, 'rgba(255,255,255,.22)');
            if (type === 'taxi') {
              px(x, W / 2 - 3, 1, 6, 3, '#f6e27a');
              px(x, W / 2 - 2, 2, 4, 1, dark);
              px(x, W / 2 - 3, 3, 6, 1, shade('#f6e27a', -30));
              for (let i = 5; i < W - 5; i += 4) {
                px(x, i, 14, 2, 2, (i / 4 | 0) % 2 ? dark : '#f5f0df');
              }
              px(x, W / 2 - 1, 10, 2, 2, '#f6e27a'); // medaglione
            }
          }
          for (const wx of wheels) { arch(wx, 15); wheel(wx, 15, 4); }
          lamp(MX(W - 3), 10, true); px(x, MX(1), 11, 2, 2, red);
          px(x, MX(W - 2), 13, 2, 1, '#d7c98f'); // targa
        }
      } else {
        const front = dir === 'down';
        ell(x, 10, 27, 8, 2, 'rgba(0,0,0,.20)');
        if (type === 'bike' || type === 'scooter') {
          wheel(10, 24, 4);
          poly(x, [[8, 22], [12, 22], [11, 10], [9, 10]], body);
          px(x, 7, 9, 6, 3, dark); px(x, 8, 9, 4, 1, shade(body, 26));
          px(x, 4, 10, 12, 2, '#9aa2a4'); // manubrio
          px(x, 4, 9, 2, 2, '#6f7779'); px(x, 14, 9, 2, 2, '#6f7779');
          px(x, 7, 14, 6, 5, front ? glass : shade(body, -20));
          px(x, 8, 14, 2, 2, 'rgba(255,255,255,.30)');
          px(x, 8, 20, 4, 2, shade(body, -30)); // pedana
          lamp(8, 22, front); lamp(11, 22, front);
          if (type === 'scooter') {
            px(x, 6, 6, 8, 3, shade(body, 18));
            px(x, 8, 5, 4, 1, '#f0d58a');
            px(x, 5, 17, 2, 4, shade(body, -24)); px(x, 13, 17, 2, 4, shade(body, -24));
          } else {
            px(x, 9, 11, 2, 10, '#4a5154'); // telaio
            px(x, 7, 16, 6, 1, shade(body, -20));
          }
        } else {
          const wheels = [2, 18];
          poly(x, [[5, 8], [15, 8], [18, 22], [2, 22]], body);
          px(x, 5, 8, 10, 1, shade(body, 30));
          poly(x, [[7, 8], [13, 8], [15, 14], [5, 14]], shade(body, 16));
          px(x, 6, 9, 8, 5, front ? glass : shade(glass, -35));
          px(x, 6, 9, 3, 2, 'rgba(255,255,255,.34)');
          px(x, 4, 15, 12, 5, shade(body, -14));
          px(x, 4, 19, 12, 2, shade(body, -35));
          px(x, 1, 12, 3, 3, shade(body, -28)); // specchietti
          px(x, 16, 12, 3, 3, shade(body, -28));
          px(x, 5, 17, 10, 1, shade(body, -46));
          px(x, 7, 17, 6, 2, dark); px(x, 8, 21, 4, 2, '#e9e3cf'); // targa
          for (const wx of wheels) { arch(wx, 21); wheel(wx, 21, 4); }
          lamp(4, 20, front); lamp(13, 20, front);
          px(x, 8, 6, 4, 1, 'rgba(255,255,255,.24)'); // riflesso sul tetto
          line(x, 6, 13, 10, 11, 'rgba(40,50,54,.50)', 1);
          line(x, 14, 13, 10, 11, 'rgba(40,50,54,.50)', 1);
          if (type === 'taxi') {
            px(x, 7, 2, 6, 4, '#f6e27a');
            px(x, 8, 3, 4, 1, dark);
            px(x, 7, 5, 6, 1, shade('#f6e27a', -28));
          }
          if (type === 'van') {
            px(x, 6, 9, 8, 5, shade(glass, -15));
            px(x, 6, 15, 8, 2, '#4a87b8');
            px(x, 9, 10, 2, 4, shade(body, -22)); // linee del cofano
          }
          if (type === 'bus') {
            px(x, 4, 4, 12, 4, dark); px(x, 6, 5, 8, 2, '#f6e27a');
            px(x, 5, 9, 10, 6, glass);
            px(x, 9, 9, 2, 6, '#d8ddd4'); px(x, 6, 13, 8, 1, 'rgba(255,255,255,.24)');
            px(x, 3, 16, 14, 4, shade(body, -35));
            px(x, 7, 3, 6, 1, 'rgba(255,255,255,.30)');
          }
        }
      }
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
    /* Luce solare per le facciate, nella stessa semantica di engine.lightState():
     * azimuth in RADIANTI, elevation in GRADI, dirX/dirY vettore ombra
     * unitario screen-space. La direzione e' quantizzata in 8 settori e
     * l'intensita' in 2 livelli: al massimo 16 bucket per kind, cache limitata
     * e nessuna rasterizzazione per frame. Senza light: mezzogiorno sereno. */
    _lightVector(light) {
      const l = light || {};
      let dx = Number.isFinite(l.dirX) ? l.dirX : NaN;
      let dy = Number.isFinite(l.dirY) ? l.dirY : NaN;
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
        const az = Number.isFinite(l.azimuth) ? l.azimuth : 0;
        dx = -Math.sin(az);
        dy = Math.cos(az);
      }
      return { dx, dy };
    },
    /* Bucket = 8 settori direzionali x 3 toni. Il tono quantizza le tre
     * componenti che incidono sulla velatura (dark, warm, lunghezza ombra):
     * senza questo, facciate con luce diversa condividerebbero la stessa cache. */
    _lightBucket(light) {
      const l = light || {}, v = this._lightVector(l);
      const a = Math.atan2(v.dy, v.dx);
      const sector = ((Math.round((a + Math.PI) / (Math.PI / 4)) % 8) + 8) % 8;
      const h = Number(l.hour);
      const dark = Number(l.dark) || 0, warm = Number(l.warm) || 0;
      const len = Number(l.shadowLen) || 0;
      const night = !!l.night || (Number.isFinite(h) && (h < 6 || h >= 20)) ||
        (Number.isFinite(l.elevation) && l.elevation < 0);
      const tone = night || dark >= .32 ? 2
        : (dark >= .12 || warm >= .07 || len >= 30 ? 1 : 0);
      return sector + ':' + tone;
    },
    /* Velatura dentro i pixel gia' disegnati (source-atop): nessun tetto,
     * finestra o balcone nuovo sulle facciate M1, solo ombra laterale,
     * highlight sottile e passata calda/fredda coerente con l'orario. */
    _applyLighting(S, x, W, H, light) {
      const l = light || {}, v = this._lightVector(l);
      const fromLeft = v.dx >= 0;
      const hh = Number(l.hour);
      const dark = U.clamp(Number(l.dark) || 0, 0, 1);
      const weak = !!l.night || dark > .3 || (Number.isFinite(hh) && (hh < 6 || hh >= 20)) ||
        (Number.isFinite(l.elevation) && l.elevation < 16);
      const night = !!l.night || (Number.isFinite(hh) && (hh < 6 || hh >= 20));
      const strength = U.clamp((weak ? .06 : .11) + (1 - dark) * .05, .05, .17);
      x.save();
      x.globalCompositeOperation = 'source-atop';
      const g = x.createLinearGradient(0, 0, W, 0);
      const hi = 'rgba(255,246,218,' + (strength * .8).toFixed(3) + ')';
      const lo = 'rgba(16,22,34,' + strength.toFixed(3) + ')';
      g.addColorStop(0, fromLeft ? hi : lo);
      g.addColorStop(.45, 'rgba(255,246,218,0)');
      g.addColorStop(1, fromLeft ? lo : hi);
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      const len = U.clamp(Number(l.shadowLen) || 0, 0, 16);
      const gv = x.createLinearGradient(0, 0, 0, H);
      gv.addColorStop(0, night ? 'rgba(30,42,74,.05)' : 'rgba(255,255,255,.035)');
      gv.addColorStop(1, 'rgba(14,18,26,' + (weak ? .14 : (.06 + len * .004)).toFixed(3) + ')');
      x.fillStyle = gv; x.fillRect(0, 0, W, H);
      const hour = Number(l.hour);
      const warm = Number.isFinite(l.warm) ? U.clamp(l.warm, 0, 1)
        : (night ? 0 : (Number.isFinite(hour) ? (hour >= 16 && hour < 20 ? .7 : .12) : .12));
      if (warm > .05) {
        x.fillStyle = 'rgba(255,176,96,' + (warm * (night ? .06 : .18)).toFixed(3) + ')';
        x.fillRect(0, 0, W, H);
      } else if (night || weak) {
        x.fillStyle = 'rgba(38,56,104,.09)'; x.fillRect(0, 0, W, H);
      }
      x.restore();
    },
    buildingSprite(kind, light) {
      // Per i palazzi di Napoli l'asset M1 estratto e' l'unica facciata autorevole:
      // il vecchio livello procedurale generico e' stato rimosso per evitare
      // duplicazioni sopra le aperture. I nuovi contesti, senza M1, usano
      // facciate procedurali dedicate (_facadeProcedural).
      const bucket = this._lightBucket(light);
      const key = 'bld:' + kind + ':' + bucket; if (this.cache[key]) return this.cache[key];
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
        // Reveal laterale minimo: l'asset M1 resta autorevole, ma il corpo non
        // finisce a filo quadrato. Nessun tetto inventato sopra il prospetto.
        this._m1Reveal(S, x, W, H, light);
      } else if (S.proc) {
        // Nuove zone senza asset M1: facciata procedurale con architettura regolare,
        // poi tetto/parete laterale/ombra di contatto nella stessa immagine.
        this._facadeProcedural(kind, S, x, W, H, R);
        this._depthOverlay(S, x, W, H);
        this._facadeMicroDetails(kind, S, x, W, H, light);
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
      this._applyLighting(S, x, W, H, light);
      return this.cache[key] = c;
    },
    /* Facciate dei nuovi contesti: senza asset M1 dedicati l'architettura viene
     * ricostruita con giunti regolari, aperture incassate e profili in rilievo.
     * Niente texture casuale: ogni motivo e' una corsa di rivestimento o un
     * elemento architettonico ripetuto con passo costante. */
    _facadeProcedural(kind, S, x, W, H, R) {
      // Corsi di muratura sfalsati: danno profondita' senza rumore casuale.
      const courses = (course, joint, col, y0, y1) => {
        for (let yy = y0; yy < y1; yy += course) {
          px(x, 0, yy, W, 1, col);
          const off = ((yy - y0) / course % 2) * (joint / 2 | 0);
          for (let xx = off; xx < W; xx += joint) px(x, xx, yy + 1, 1, course - 1, col);
        }
      };
      const cornice = (y, h, col) => {
        px(x, 0, y, W, h, col); px(x, 0, y, W, 1, shade(col, 26));
        px(x, 0, y + h - 1, W, 1, shade(col, -28));
        for (let i = 3; i < W - 2; i += 8) px(x, i, y + h, 3, 2, shade(col, -16));
      };
      const plinth = (h, col) => {
        px(x, 0, H - h, W, h, col); px(x, 0, H - h, W, 2, shade(col, 26));
        px(x, 0, H - h + 3, W, 1, shade(col, -22));
        px(x, 0, H - 2, W, 2, shade(col, -32));
        for (let i = 8; i < W; i += 24) px(x, i, H - h + 4, 1, h - 6, 'rgba(20,20,18,.14)');
      };
      const roofTiles = (y, h, col) => {
        px(x, 0, y, W, h, col);
        for (let i = 0; i < W; i += 8) {
          ell(x, i + 4, y + h - 4, 4, 3, shade(col, 18));
          px(x, i + 3, y + h - 5, 2, 2, shade(col, -24));
        }
      };
      // Finestra con risega, architrave, vetro diviso e davanzale in ombra.
      const win = (wx, wy, ww, wh, frame, glass, sill) => {
        frame = frame || '#6e6a60'; glass = glass || '#7597a4';
        px(x, wx - 2, wy - 2, ww + 4, wh + 4, 'rgba(20,22,20,.13)');
        px(x, wx - 1, wy - 2, ww + 2, 2, shade(frame, 20));
        px(x, wx, wy, ww, wh, frame);
        px(x, wx + 2, wy + 2, ww - 4, wh - 4, '#3b4448');
        px(x, wx + 3, wy + 3, ww - 6, wh - 6, glass);
        px(x, wx + 3, wy + 3, ww - 6, 2, 'rgba(255,255,255,.32)');
        px(x, wx + 3, wy + wh - 6, ww - 6, 3, 'rgba(18,26,30,.34)');
        px(x, wx + ww / 2 - 1 | 0, wy + 3, 2, wh - 6, shade(frame, 18));
        px(x, wx + 3, wy + wh / 2 | 0, ww - 6, 1, shade(frame, 12));
        px(x, wx - 2, wy + wh, ww + 4, 2, sill || S.trim);
        px(x, wx - 2, wy + wh + 2, ww + 4, 1, 'rgba(20,20,18,.24)');
      };
      const shutters = (wx, wy, ww, wh, col) => {
        col = col || '#4f6f5a';
        for (const sx of [wx - 5, wx + ww + 1]) {
          px(x, sx, wy + 1, 4, wh - 2, shade(col, -26));
          px(x, sx + 1, wy + 2, 2, wh - 4, col);
          for (let yy = wy + 4; yy < wy + wh - 2; yy += 3) px(x, sx + 1, yy, 2, 1, shade(col, 22));
          px(x, sx, wy + 1, 4, 1, shade(col, 24));
        }
      };
      const balcony = (wx, wy, ww) => {
        px(x, wx - 3, wy + 14, ww + 6, 3, shade(S.trim, -24));
        px(x, wx - 3, wy + 12, ww + 6, 2, S.trim);
        px(x, wx - 3, wy + 17, ww + 6, 1, 'rgba(20,20,18,.26)');
        for (let i = wx - 2; i < wx + ww + 2; i += 3) {
          px(x, i, wy + 5, 1, 8, '#4f595e');
          px(x, i + 1, wy + 5, 1, 8, 'rgba(210,220,220,.24)');
        }
        px(x, wx - 3, wy + 4, ww + 6, 1, '#59636a');
        px(x, wx - 3, wy + 12, ww + 6, 1, '#59636a');
        px(x, wx + 2, wy + 8, 4, 4, '#a45b45');
        px(x, wx + 2, wy + 5, 3, 3, '#4e8b50'); px(x, wx + 3, wy + 4, 1, 1, '#d95e52');
      };
      const grid = (cols, rows, x0, y0, sx, sy, ww, wh, fn) => {
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const wx = x0 + c * sx, wy = y0 + r * sy;
          if (fn) fn(wx, wy, ww, wh, r, c);
          else win(wx, wy, ww, wh);
        }
      };
      const arch = (ax, ay, aw, ah, frame, glass) => {
        frame = frame || '#8e7c62'; glass = glass || '#4b463f';
        px(x, ax - 3, ay + aw / 2 - 2, aw + 6, ah - aw / 2 + 4, 'rgba(20,20,18,.14)');
        x.fillStyle = frame; x.beginPath();
        x.arc(ax + aw / 2, ay + aw / 2, aw / 2, Math.PI, 0); x.fill();
        px(x, ax, ay + aw / 2, aw, ah - aw / 2, frame);
        x.fillStyle = '#3b4144'; x.beginPath();
        x.arc(ax + aw / 2, ay + aw / 2, aw / 2 - 3, Math.PI, 0); x.fill();
        px(x, ax + 3, ay + aw / 2, aw - 6, ah - aw / 2 - 2, '#3b4144');
        x.fillStyle = glass; x.beginPath();
        x.arc(ax + aw / 2, ay + aw / 2, aw / 2 - 5, Math.PI, 0); x.fill();
        px(x, ax + 5, ay + aw / 2, aw - 10, ah - aw / 2 - 4, glass);
        px(x, ax + aw / 2 - 1 | 0, ay + aw / 2, 2, ah - aw / 2 - 2, '#9b8f78');
        for (let a = -150; a <= -30; a += 30) {
          const rad = a * Math.PI / 180;
          px(x, ax + aw / 2 + Math.round(Math.cos(rad) * (aw / 2 - 1)) - 1,
                ay + aw / 2 + Math.round(Math.sin(rad) * (aw / 2 - 1)) - 1, 3, 2, shade(frame, 26));
        }
        px(x, ax + aw / 2 - 2, ay - 3, 4, 5, shade(frame, 30)); // chiave di volta
        px(x, ax - 3, ay + ah, aw + 6, 2, shade(frame, -18));
      };
      const door = (dx, dy, dw, dh, leaf) => {
        leaf = leaf || '#6f5237';
        px(x, dx - 4, dy - 4, dw + 8, 3, shade(S.trim, -12));
        px(x, dx - 3, dy - 2, dw + 6, 2, S.trim);
        px(x, dx, dy, dw, dh, '#3d352c');
        px(x, dx + 2, dy + 2, dw - 4, dh - 3, leaf);
        px(x, dx + 3, dy + 3, dw / 2 - 4 | 0, 5, shade(leaf, 18));
        px(x, dx + dw / 2 + 1 | 0, dy + 3, dw / 2 - 4 | 0, 5, shade(leaf, 12));
        px(x, dx + dw / 2 - 1 | 0, dy + 3, 2, dh - 3, shade(leaf, -30));
        px(x, dx + 4, dy + 11, dw - 8, dh - 14, shade(leaf, -14));
        px(x, dx + 5, dy + 12, dw - 10, 1, shade(leaf, 20));
        px(x, dx + dw - 6, dy + dh / 2 | 0, 2, 2, '#d4b04f');
        px(x, dx - 5, dy + dh, dw + 10, 2, shade(S.trim, -26));
      };
      switch (kind) {
        case 'fuorigrotta_blocco': {
          // Blocco razionalista di Luigi Cosenza: cinque piani, balconi a
          // sbalzo, portico ad archi al piano terra e panni stesi ai balconi.
          courses(12, 16, 'rgba(70,66,58,.07)', 8, H - 12);
          grid(9, 5, 12, 18, 20, 24, 11, 14, (wx, wy, ww, wh, r, c) => {
            if (r === 4) return; // il piano terra e' il portico, non una griglia di finestre
            win(wx, wy, ww, wh, '#7a7569', '#708c99');
            if (r >= 1 && r <= 3) balcony(wx, wy, ww);
            if ((r === 1 && c % 3 === 1) || (r === 3 && c % 3 === 0)) {
              // Panni tra due balconi: geometria fissa, non texture casuale.
              px(x, wx + ww + 1, wy + 7, 7, 1, '#ddd8cb');
              px(x, wx + ww + 2, wy + 8, 5, 3, c % 2 ? '#8a9fb0' : '#b36b55');
              px(x, wx + ww + 3, wy + 9, 3, 1, 'rgba(255,255,255,.24)');
            }
          });
          for (let c = 0; c < 9; c++) {
            if (c === 4) continue; // varco d'ingresso
            arch(16 + c * 20, 112, 13, 20, '#b6b1a3', '#4f5558');
          }
          for (const yy of [38, 62, 86, 104]) cornice(yy, 2, '#c3c0b5');
          px(x, 78, 106, 36, 5, '#a9a69b'); // aggetto sopra l'ingresso
          door(88, 112, 16, 20);
          cornice(0, 8, S.roof);
          plinth(12, '#8f8c82');
          break;
        }
        case 'fuorigrotta_torre': {
          // Torre razionalista: 8 piani, finestre più alte e marcapiani stretti.
          // Passo di piano 26 px = 3,25 m: dentro il limite documentato di 3,3 m.
          courses(13, 12, 'rgba(70,66,58,.06)', 8, H - 12);
          grid(6, 8, 8, 16, 24, 26, 13, 17, (wx, wy, ww, wh, r, c) => {
            if (r === 7 && (c === 2 || c === 3)) return;
            win(wx, wy, ww, wh, '#78746a', '#6f8a97');
            // Pinne verticali in cemento: ritmo della torre, non righe piatte.
            px(x, wx - 3, wy - 2, 2, wh + 5, '#c6c3b8');
            px(x, wx - 3, wy - 2, 1, wh + 5, '#e0ddd2');
          });
          for (const yy of [38, 64, 90, 116, 142, 168, 194]) cornice(yy, 2, '#c1beb3');
          door(72, 196, 16, 25);
          cornice(0, 8, S.roof);
          px(x, 58, 2, 44, 5, '#8d8a80'); px(x, 64, 4, 32, 2, '#b5b1a6'); // cassonetto sul tetto
          plinth(12, '#8b887f');
          break;
        }
        case 'fuorigrotta_teatro': {
          // Teatro Mediterraneo: volume basso, ali a ritmo verticale e baia vetrata.
          cornice(0, 12, S.roof); px(x, 0, 12, W, 4, '#c6c8bf');
          for (let wx = 18; wx < 180; wx += 22) {
            px(x, wx, 40, 13, 168, '#9fa9a6'); px(x, wx + 2, 44, 9, 160, '#7fa7b3');
            px(x, wx + 2, 44, 9, 3, 'rgba(255,255,255,.28)'); px(x, wx, 208, 13, 3, '#b6b5aa');
            for (let my = 60; my < 204; my += 24) px(x, wx + 2, my, 9, 1, 'rgba(220,232,228,.34)');
            px(x, wx + 5, 44, 1, 160, '#c3c7c0');
          }
          for (let wx = 380; wx < 545; wx += 22) {
            px(x, wx, 40, 13, 168, '#9fa9a6'); px(x, wx + 2, 44, 9, 160, '#7fa7b3');
            px(x, wx + 2, 44, 9, 3, 'rgba(255,255,255,.28)'); px(x, wx, 208, 13, 3, '#b6b5aa');
            for (let my = 60; my < 204; my += 24) px(x, wx + 2, my, 9, 1, 'rgba(220,232,228,.34)');
            px(x, wx + 5, 44, 1, 160, '#c3c7c0');
          }
          px(x, 182, 36, 196, 180, '#8d948e'); px(x, 186, 40, 188, 172, '#79a8b6');
          for (let mx = 186; mx < 374; mx += 14) px(x, mx, 40, 2, 172, '#c3c7c0');
          for (const my of [80, 120, 160]) px(x, 186, my, 188, 2, '#c3c7c0');
          px(x, 186, 40, 188, 3, 'rgba(255,255,255,.24)');
          // Aggetto della marquee con lampadine e ombra proiettata sul vetro.
          px(x, 178, 212, 204, 6, '#e3e0d2'); px(x, 178, 218, 204, 2, '#8f9188');
          for (let lx = 186; lx < 376; lx += 12) { px(x, lx, 214, 2, 2, '#f4d98a'); px(x, lx, 216, 1, 1, '#fff4c8'); }
          cornice(216, 5, '#c1c0b5'); door(260, 221, 40, 51, '#5d6b70');
          px(x, 236, H - 8, 88, 8, '#a9a79c');
          px(x, 240, H - 8, 80, 1, '#d3d0c4');
          break;
        }
        case 'fuorigrotta_stadio': {
          // Stadio Maradona: ellisse di cemento, corsia in mattone e prato.
          // La vista dall'alto e' coerente con la pianta OSM way 22790881.
          ell(x, W / 2, H / 2 + 4, 101, 71, '#8e948e');
          ell(x, W / 2, H / 2 + 2, 98, 68, '#d4d5cd');
          ell(x, W / 2, H / 2 + 2, 94, 64, '#bcbfb6');
          ell(x, W / 2, H / 2 + 2, 88, 59, '#b56d55');
          ell(x, W / 2, H / 2 + 2, 82, 53, '#7d9b6d');
          const fx = W / 2, fy = H / 2 + 1;
          // Gradoni a fasce concentriche e corsia con corsie interne.
          for (let rr = 0; rr < 3; rr++) {
            x.strokeStyle = rr % 2 ? 'rgba(90,96,90,.20)' : 'rgba(235,235,220,.16)';
            x.lineWidth = 2; x.beginPath();
            x.ellipse(fx, fy + 2, 96 - rr * 4, 66 - rr * 3, 0, 0, Math.PI * 2); x.stroke();
          }
          px(x, fx - 54, fy - 23, 108, 46, '#e7e5d6');
          px(x, fx - 51, fy - 20, 102, 40, '#628d54');
          for (let gy = fy - 17; gy < fy + 20; gy += 10) px(x, fx - 51, gy, 102, 3, '#6d9a5c');
          px(x, fx - 51, fy - 20, 102, 3, '#77a365');
          px(x, fx - 1, fy - 20, 2, 40, '#e9e8d8');
          px(x, fx - 49, fy - 18, 2, 36, 'rgba(233,232,216,.60)');
          px(x, fx + 47, fy - 18, 2, 36, 'rgba(233,232,216,.60)');
          ell(x, fx, fy, 9, 9, 'rgba(233,232,216,.85)');
          ell(x, fx, fy, 6, 6, '#628d54'); ell(x, fx, fy, 3, 3, '#e9e8d8');
          // Porte e ripe del settore sud.
          for (const ex of [44, 96, 148]) {
            px(x, ex, H - 18, 16, 18, '#8f9490');
            px(x, ex + 2, H - 14, 12, 14, '#5f6663');
            px(x, ex + 6, H - 14, 4, 14, '#404745');
            px(x, ex + 2, H - 16, 12, 2, '#bcc0b7');
          }
          // Ali laterali: gradoni e servizi leggibili anche ai margini.
          for (let sy = 12; sy < H - 12; sy += 10) {
            px(x, 0, sy, 18, 2, '#aeb2aa'); px(x, W - 18, sy, 18, 2, '#aeb2aa');
            px(x, 0, sy + 5, 12, 1, '#c4c7bd'); px(x, W - 12, sy + 5, 12, 1, '#c4c7bd');
            px(x, 4, sy + 2, 1, 4, '#8d938d'); px(x, W - 5, sy + 2, 1, 4, '#8d938d');
          }
          for (let sx = 0; sx < 18; sx += 4) {
            px(x, sx, 8, 2, H - 16, '#767e78');
            px(x, W - 2 - sx, 8, 2, H - 16, '#767e78');
          }
          // Torri faro: due pali con corpi illuminanti e riflesso.
          for (const lx of [14, W - 18]) {
            px(x, lx, 6, 2, 26, '#9fa49c'); px(x, lx - 3, 5, 8, 5, '#d8dcd2');
            px(x, lx - 2, 6, 6, 3, '#f0e9b8'); px(x, lx - 1, 5, 4, 1, '#fdf3cf');
          }
          px(x, 0, 0, W, 4, S.roof); px(x, 0, H - 4, W, 4, S.roof);
          px(x, 0, 0, 3, H, S.roof); px(x, W - 3, 0, 3, H, S.roof);
          break;
        }
        case 'fuorigrotta_mostra': {
          // Padiglione espositivo: campate vetrate continue tra pilastri in cemento.
          cornice(0, 10, S.roof); px(x, 0, 10, W, 6, '#d9d6ca');
          px(x, 8, 20, W - 16, 108, '#8ba7ac'); px(x, 10, 22, W - 20, 104, '#a8c8d0');
          for (let mx = 10; mx < W - 10; mx += 12) {
            px(x, mx, 22, 2, 104, '#d7d8cf');
            px(x, mx + 3, 24, 4, 2, 'rgba(255,255,255,.30)');
          }
          px(x, 10, 70, W - 20, 2, '#d7d8cf');
          for (let px0 = 0; px0 <= W - 12; px0 += 40) {
            px(x, px0, 16, 12, 120, '#dcd9cf');
            px(x, px0, 16, 2, 120, '#f0ede2'); px(x, px0 + 10, 16, 2, 120, '#b4b0a4');
            px(x, px0 + 2, 136, 8, 2, 'rgba(30,30,26,.18)');
          }
          px(x, 8, 18, W - 16, 2, '#e6e3d7'); // trave di coronamento
          cornice(136, 6, '#cecabf'); plinth(12, '#9b978c');
          door(146, 118, 28, 30, '#788a8c');
          break;
        }
        case 'pianura_chiesa': {
          // San Giorgio Martire: facciata a capanna in tufo e campanile a destra.
          const fw = 244;
          poly(x, [[0, 76], [122, 14], [fw, 76]], '#9a8262');
          poly(x, [[6, 76], [122, 22], [fw - 6, 76]], S.wall);
          poly(x, [[30, 68], [122, 24], [214, 68]], '#c7b797');
          // Corsi di tufo e coppi sullo spiovente.
          courses(10, 14, 'rgba(110,92,66,.13)', 78, H - 12);
          for (let i = 8; i < fw - 8; i += 10) px(x, i, 74 - Math.abs(i - 122) / 5 | 0, 6, 2, '#ad9574');
          px(x, 0, 74, fw, 6, '#b6a488'); px(x, 0, 80, fw, H - 92, S.wall);
          for (const bx of [6, fw - 18]) {
            px(x, bx, 82, 12, H - 94, '#c7b797');
            px(x, bx + 2, 84, 1, H - 98, '#e0d1b2');
          }
          // Rosone con tracce radiali e vetrata.
          ell(x, 122, 54, 11, 11, '#8e7c62'); ell(x, 122, 54, 8, 8, '#3f4547');
          ell(x, 122, 54, 6, 6, '#6f97a4');
          line(x, 122, 48, 122, 60, '#c8bc9e', 1); line(x, 116, 54, 128, 54, '#c8bc9e', 1);
          ell(x, 122, 54, 2, 2, '#d9cfae');
          arch(96, 158, 52, 78, '#8e7c62', '#4b463f'); door(104, 190, 36, 46);
          arch(28, 120, 36, 50, '#9a8262', '#6d8f9c');
          arch(180, 120, 36, 50, '#9a8262', '#6d8f9c');
          plinth(12, '#8f7d61');
          const tx = 252;
          px(x, tx, 76, 64, H - 88, '#c7b797');
          px(x, tx, 76, 5, H - 88, '#a08d6e'); px(x, tx + 59, 76, 5, H - 88, '#a08d6e');
          courses(11, 12, 'rgba(130,108,76,.14)', 78, H - 12);
          poly(x, [[tx - 4, 48], [tx + 32, 16], [tx + 68, 48]], '#9a8262');
          poly(x, [[tx + 2, 48], [tx + 32, 22], [tx + 62, 48]], '#c7b797');
          px(x, tx - 4, 48, 72, 6, '#b6a488');
          for (let i = tx + 2; i < tx + 66; i += 8) px(x, i, 44, 5, 2, '#ad9574');
          arch(tx + 20, 52, 24, 30, '#8e7c62', '#4b463f');
          px(x, tx + 30, 64, 4, 12, '#d4b04f');
          break;
        }
        case 'pianura_borgo': {
          // Casa di borgo: tre piani, basamento in piperno e persiane verdi.
          roofTiles(0, 12, '#9b6b4b'); px(x, 0, 12, W, 4, '#b39b78');
          courses(9, 12, 'rgba(100,78,54,.10)', 16, H - 16);
          grid(4, 3, 12, 24, 36, 28, 14, 16, (wx, wy, ww, wh, r, c) => {
            if (r === 2 && c === 2) return;
            win(wx, wy, ww, wh, '#6b5540', '#5c7881');
            shutters(wx, wy, ww, wh, '#4f6f5a');
            if (r === 1) balcony(wx, wy, ww);
          });
          // Pigmento dei cantoni in pietra e ombra sotto il tetto.
          for (const cx0 of [2, W - 8]) px(x, cx0, 16, 6, H - 32, '#c3ad8a');
          // Grondaia scura sul cantone destro: evita una campata cieca e
          // mantiene il ritmo delle facciate di borgo anche sul bordo.
          px(x, W - 14, 20, 3, H - 40, '#6f5f48');
          px(x, W - 13, 20, 1, H - 40, '#a08b68');
          px(x, 0, 16, W, 1, 'rgba(30,24,18,.20)');
          door(70, 80, 20, 18, '#6b4b33'); plinth(16, '#414446');
          break;
        }
        case 'pianura_municipio': {
          // Municipio sobrio: undici assi di finestre e portale centrale.
          // Anche qui il passo di piano e' 26 px = 3,25 m.
          courses(13, 16, 'rgba(90,80,62,.07)', 10, H - 14);
          grid(11, 6, 15, 18, 27, 26, 14, 16, (wx, wy, ww, wh, r, c) => {
            if (r === 5 && (c === 5 || c === 6)) return;
            win(wx, wy, ww, wh, '#8c887c', '#718994');
            if (r === 3 && (c === 4 || c === 6)) balcony(wx, wy, ww);
          });
          for (const yy of [39, 65, 91, 117, 143]) cornice(yy, 3, '#bdb6a6');
          // Lesene e frontone del portale.
          for (const lx of [124, 172]) px(x, lx, 140, 5, 48, '#c9c1b1');
          px(x, 130, 132, 52, 5, '#d8d1c0');
          px(x, 142, 128, 28, 4, '#e7e0cf');
          door(142, 144, 28, 36, '#6d6250');
          cornice(0, 10, S.roof); px(x, 112, 4, 88, 6, '#e6dfcd');
          px(x, 146, 2, 20, 3, '#b7ae9d'); // orologio / iscrizione
          plinth(14, '#868277');
          break;
        }
        case 'bacoli_terme': {
          // Ruderi romani: laterizio e cemento a vista, arcate e coronamento spezzato.
          courses(10, 16, 'rgba(88,58,44,.24)', 20, H);
          for (let i = 0; i < 5; i++) {
            const nx = 12 + i * 58, ny = 18 + (i % 2) * 5;
            // Finestre cieche incassate: mai clearRect, che bucherebbe il muro.
            px(x, nx, ny, 18, 14, '#6f6052'); px(x, nx + 2, ny + 2, 14, 10, '#4c433a');
            px(x, nx + 2, ny + 2, 14, 1, '#a2927e');
            px(x, nx - 2, ny + 14, 22, 2, '#a88b72');
          }
          for (let ax = 18; ax < W - 30; ax += 58) {
            arch(ax, 62, 38, 62, '#8f6a55', '#51483f');
            px(x, ax + 6, 92, 26, 30, 'rgba(226,205,170,.12)'); // luce filtrata dalle arcate
            px(x, ax - 3, 124, 44, 3, '#a88b72');
          }
          for (let i = 0; i < 4; i++) {
            const bx = 18 + i * 74, by = 34 + (i % 2) * 14;
            px(x, bx, by, 30, 7, '#a8a396');
            px(x, bx, by, 30, 1, '#c3bfb3');
            px(x, bx + 3, by + 2, 4, 4, '#7c776c'); // conco spezzato
          }
          plinth(12, '#8a7d6c');
          break;
        }
        case 'bacoli_castello': {
          // Castello aragonese: tufo bugnato, merli e monofore strette.
          px(x, 0, 32, W, H - 44, S.wall);
          courses(12, 24, 'rgba(110,92,66,.26)', 44, H - 12);
          // Bugnato: ogni blocco ha luce in alto e ombra in basso.
          for (let yy = 44; yy < H - 12; yy += 12) for (let bx = (yy / 12 % 2) * 12; bx < W; bx += 24) {
            px(x, bx + 1, yy + 1, 21, 1, 'rgba(240,224,190,.16)');
            px(x, bx + 1, yy + 10, 21, 1, 'rgba(70,56,38,.18)');
          }
          px(x, 0, 28, W, 6, '#b6a07c');
          for (let mx = 4; mx < W - 12; mx += 24) {
            px(x, mx, 10, 16, 18, '#c8b592'); px(x, mx, 10, 16, 2, '#dfcfae');
            px(x, mx, 26, 16, 2, '#8e7b60');
            px(x, mx + 7, 12, 2, 3, '#8e7b60'); // merlo con feritoia
          }
          for (const tx of [0, W - 32]) {
            px(x, tx, 22, 32, H - 34, '#c2ae8b');
            px(x, tx, 22, 4, H - 34, '#9b8768'); px(x, tx + 28, 22, 4, H - 34, '#9b8768');
            for (let mx = tx + 2; mx < tx + 30; mx += 14) {
              px(x, mx, 14, 10, 8, '#c8b592'); px(x, mx + 4, 16, 2, 3, '#8e7b60');
            }
          }
          for (const yy of [64, 108]) for (let wx = 44; wx < W - 40; wx += 36) {
            px(x, wx, yy, 8, 12, '#5e5548'); px(x, wx + 1, yy + 1, 6, 10, '#3b3630');
            px(x, wx + 3, yy + 2, 2, 6, '#756b59');
            px(x, wx - 1, yy + 12, 10, 2, '#a08d6e');
          }
          arch(132, 112, 24, 52, '#8e7b60', '#3b3630'); plinth(12, '#7d6a52');
          break;
        }
        case 'caserta_reggia': {
          // Reggia di Caserta: 14 assi regolari, cornicioni continui e portale.
          // Stesso passo di piano metrico del municipio (26 px = 3,25 m).
          courses(13, 13, 'rgba(90,82,66,.06)', 10, H - 14);
          grid(14, 6, 14, 18, 26, 26, 16, 16, (wx, wy, ww, wh, r, c) => {
            if (r === 5 && (c === 6 || c === 7)) return;
            win(wx, wy, ww, wh, '#a8a094', '#7894a1');
            if (r === 4 && c % 2 === 0) balcony(wx, wy, ww);
          });
          for (const yy of [39, 65, 91, 117, 143]) cornice(yy, 3, '#bdb5a6');
          for (const lx of [164, 222]) px(x, lx, 140, 6, 48, '#cfc7b7');
          door(178, 144, 28, 36, '#6d6250');
          cornice(0, 10, S.roof); px(x, 132, 4, 120, 6, '#e6dfcd');
          plinth(14, '#8f887b');
          break;
        }
        case 'salerno_arechi': {
          // Castello di Arechi: tufo, merli guelfi e monofore strette.
          px(x, 0, 26, W, H - 38, S.wall);
          courses(11, 20, 'rgba(110,92,66,.24)', 38, H - 10);
          for (let mx = 2; mx < W - 10; mx += 20) {
            px(x, mx, 8, 14, 18, S.wall); px(x, mx, 8, 14, 2, '#dfcfae');
            px(x, mx + 6, 10, 2, 4, '#8e7b60');
          }
          px(x, 0, 24, W, 5, '#b6a07c');
          for (const ax of [38, 108, 178]) {
            px(x, ax, 52, 10, 16, '#5e5548'); px(x, ax + 1, 53, 8, 14, '#3b3630');
            px(x, ax + 4, 55, 2, 8, '#877c68');
            px(x, ax - 2, 68, 14, 2, '#b6a07c');
          }
          arch(94, 60, 36, 58, S.trim, '#3b3630'); plinth(12, '#7d6a52');
          break;
        }
        case 'salerno_palazzo': {
          // Palazzo del lungomare: tre piani, persiane e coronamento continuo.
          cornice(0, 8, S.roof);
          courses(8, 14, 'rgba(110,86,60,.08)', 10, H - 12);
          grid(5, 3, 12, 16, 28, 24, 14, 16, (wx, wy, ww, wh, r, c) => {
            if (r === 2 && c === 2) return;
            win(wx, wy, ww, wh, '#8d6f52', '#5f8291');
            shutters(wx, wy, ww, wh, '#4f6f5a');
            if (r === 1 && c === 1) balcony(wx, wy, ww);
          });
          for (const yy of [38, 62]) cornice(yy, 2, S.trim);
          door(70, 62, 20, 26, '#6b4b33'); plinth(12, '#7c6b54');
          break;
        }
        case 'bacoli_casa': {
          // Casa di pescatori: tufo chiaro, tetto a coppi e due finestre con persiane.
          px(x, 0, 12, W, H - 24, S.wall);
          courses(9, 12, 'rgba(120,98,70,.16)', 24, H - 12);
          roofTiles(0, 14, '#8e6b4d');
          px(x, 0, 12, W, 3, '#b39b78');
          for (const wx of [18, 94]) {
            win(wx, 44, 16, 18, '#6b5540', '#5c7881');
            shutters(wx, 44, 16, 18, '#4f6f5a');
          }
          door(54, 62, 20, 24, '#6b4b33'); plinth(12, '#7c6b54');
          // Rete e galleggianti appesi alla parete: richiamo al borgo marinaro.
          for (let i = 0; i < 5; i++) line(x, 108 + i * 4, 40, 112 + i * 4, 56, 'rgba(90,112,110,.50)', 1);
          ell(x, 112, 60, 4, 2, '#c9564a');
          break;
        }
      }
    },
    /* Prospetti M1: solo un reveal laterale e l'ombra a terra. L'immagine
     * estratta resta l'unica fonte di finestre, portali e decorazioni. */
    _m1Reveal(S, x, W, H, light) {
      // Solo la direzione del reveal cambia: nessun elemento nuovo sopra
      // l'asset M1. Con luce da est il fianco in ombra passa a sinistra.
      const fromLeft = this._lightVector(light || {}).dx >= 0;
      x.save();
      if (!fromLeft) { x.translate(W, 0); x.scale(-1, 1); }
      const side = Math.max(4, Math.min(10, Math.round(W * 0.022)));
      const sx = W - side;
      px(x, sx, 0, side, H, shade(S.wall, -26));
      px(x, sx, 0, 1, H, shade(S.wall, -42));
      for (let yy = 16; yy < H - 10; yy += 24) {
        px(x, sx + 1, yy, side - 2, 1, 'rgba(20,20,18,.18)');
        px(x, sx + 2, yy + 4, Math.max(2, side - 4), 6, 'rgba(20,20,18,.22)');
      }
      px(x, 0, H - 3, W, 3, 'rgba(20,20,18,.16)');
      x.restore();
    },
    /* Profondità architettonica per le facciate senza asset M1: la facciata
     * resta l'autorità, ma il corpo non è più un'immagine piatta incollata.
     * La parete laterale è in ombra, il tetto ha coppi e comignoli, e il
     * basamento riceve un'ombra di contatto. Dimensioni e ancore invariate. */
    _depthOverlay(S, x, W, H) {
      // 2,5–4,5 m di rientro e 1,2–2,2 m di copertura: a 8 px/m sono valori
      // leggibili sulla scena, non una rifinitura sub-pixel.
      const side = Math.max(32, Math.min(56, Math.round(W * 0.14)));
      const roofH = Math.max(10, Math.min(18, Math.round(H * 0.07)));
      const sx = W - side;
      // Rientro laterale inclinato: il bordo destro arretra di 4 px, così lo
      // spessore si legge come volume e non come banda piatta in ombra.
      poly(x, [[sx, roofH + 2], [W, roofH + 6], [W, H - 10], [sx, H - 12]], shade(S.wall, -52));
      poly(x, [[sx, roofH + 2], [sx + 2, roofH + 3], [sx + 2, H - 11], [sx, H - 12]], shade(S.wall, -70));
      px(x, sx, H - 12, side, 2, shade(S.wall, -62));
      for (let yy = roofH + 14; yy < H - 16; yy += 24) {
        px(x, sx, yy, side, 1, 'rgba(20,20,18,.20)');
        px(x, sx + 2, yy + 4, Math.max(3, side - 5), 7, 'rgba(20,20,18,.34)');
        px(x, sx + 3, yy + 5, Math.max(2, side - 7), 5, '#6a8490');
        px(x, sx + 3, yy + 5, Math.max(2, side - 7), 1, 'rgba(255,255,255,.24)');
      }
      // Tetto a coppi, cornice e ombra sotto la gronda.
      px(x, 0, 0, W, roofH, S.roof);
      poly(x, [[sx, roofH], [W, roofH + 4], [W, roofH + 10], [sx, roofH + 3]], shade(S.roof, -26));
      for (let i = 2; i < W - 2; i += 10) {
        px(x, i, 2, 2, roofH - 3, shade(S.roof, -32));
        px(x, i + 4, roofH - 4, 4, 2, shade(S.roof, 28));
      }
      px(x, 0, roofH, W, 2, shade(S.roof, 22));
      px(x, 0, roofH + 2, W, 2, 'rgba(20,20,18,.16)');
      for (const cxp of [Math.round(W * 0.18), Math.round(W * 0.72)]) {
        px(x, cxp, 2, 6, Math.max(3, roofH - 3), shade(S.wall, -18));
        px(x, cxp - 1, 2, 8, 2, shade(S.wall, -34));
        px(x, cxp + 2, 4, 2, Math.max(2, roofH - 5), 'rgba(20,20,18,.26)');
      }
      const ax = Math.round(W * 0.46);
      px(x, ax, 1, 1, Math.max(3, roofH - 2), '#55585a');
      px(x, ax - 2, 3, 5, 1, '#7d8285');
      // Contatto a terra: il palazzo poggia, non galleggia sul marciapiede.
      px(x, 0, H - 3, W, 3, 'rgba(20,20,18,.18)');
      px(x, 0, H - 3, W, 1, 'rgba(20,20,18,.24)');
    },
    /* Micro-dettagli delle facciate procedurali: condizionatori, citofoni,
     * pluviali, tapparelle, vasi, insegne, tombini, pietre d'angolo, antenne
     * e ombre sotto i cornicioni. Tutto deterministico e dentro S (PX_PER_M=8).
     * Le facciate M1 non passano da qui: restano autorevoli e intatte. */
    _facadeMicroDetails(kind, S, x, W, H, light) {
      const lv = this._lightVector(light || {});
      // Vettore ombra screen-space: a mezzogiorno dx=0 quindi solo ombra
      // verticale; al mattino/pomeriggio l'offset laterale segue dirX.
      const dir = lv.dx > .08 ? 1 : (lv.dx < -.08 ? -1 : 0);
      const len = U.clamp(Math.round(Number(light && light.shadowLen) || 2), 1, 5);
      const roofH = U.clamp(Math.round(H * .07), 10, 18);
      const side = U.clamp(Math.round(W * .14), 32, 56);
      const safe = W - side - 6;
      const sh = (a, b, w, h) => px(x, a + dir * len, b + 1, w, h, 'rgba(18,20,22,.18)');
      const ac = (a, b) => {
        sh(a, b, 12, 7);
        px(x, a, b, 12, 7, '#d6d5cc'); px(x, a, b, 12, 1, '#f0efe6');
        px(x, a, b + 6, 12, 1, '#92918a'); px(x, a + 2, b + 2, 8, 4, '#a6b1b1');
        for (let i = a + 3; i < a + 10; i += 2) px(x, i, b + 3, 1, 2, '#6d787a');
        px(x, a + 1, b + 7, 2, 1, '#8d8b82');
      };
      const intercom = (a, b) => {
        sh(a, b, 4, 8);
        px(x, a, b, 4, 8, '#3b4145'); px(x, a, b, 4, 1, '#6a7375');
        px(x, a + 1, b + 1, 2, 2, '#d8c27a');
        for (let i = 0; i < 3; i++) px(x, a + 1 + (i % 2), b + 4 + (i >> 1), 1, 1, '#9aa3a3');
      };
      const pipe = (a, b0, b1) => {
        px(x, a + dir * 2, b0 + 1, 2, b1 - b0, 'rgba(18,20,22,.22)');
        px(x, a, b0, 2, b1 - b0, '#6e6a60'); px(x, a, b0, 1, b1 - b0, '#a9a596');
        px(x, a - 1, b0, 4, 2, '#8e8a7e'); px(x, a - 1, b1 - 2, 4, 3, 'rgba(18,20,22,.24)');
      };
      const shutter = (a, b, w, h) => {
        px(x, a + dir, b + 1, w, h, 'rgba(18,20,22,.16)');
        px(x, a, b, w, h, '#5d7b70');
        for (let yy = b + 2; yy < b + h - 1; yy += 3) {
          px(x, a + 1, yy, w - 2, 1, '#87a292'); px(x, a + 1, yy + 1, w - 2, 1, 'rgba(20,26,22,.24)');
        }
        px(x, a, b, w, 2, '#475e55'); px(x, a, b + h - 2, w, 2, '#475e55');
      };
      const pot = (a, b) => {
        sh(a, b, 5, 4);
        px(x, a, b, 5, 4, '#a45b45'); px(x, a + 1, b + 1, 3, 2, '#c27455');
        ell(x, a + 2, b - 1, 3, 2, '#4e8b50'); px(x, a + 3, b - 2, 1, 1, '#d95e52');
      };
      const sign = (a, b, word, col) => {
        const w = word.length * 4 + 6;
        if (a + w > safe) return;
        sh(a, b, w, 9);
        px(x, a, b, w, 9, '#efe7d2'); px(x, a, b, w, 2, col || '#b44a3a');
        px(x, a, b + 8, w, 1, '#a2937a');
        this._tinyText(x, word, a + 3, b + 3, '#39434a');
      };
      const antenna = (a, b) => {
        if (a < 10 || a + 8 > safe) return;
        px(x, a, b + 2, 1, 13, '#5e6669'); px(x, a, b + 2, 1, 13, '#9aa3a3');
        for (let i = 0; i < 5; i++) px(x, a - 5 + i * 2, b + (i % 2), 8, 1, '#929b9b');
        px(x, a - 1, b + 14, 3, 2, '#4a5255');
      };
      const manhole = (a, b) => {
        ell(x, a, b + 1, 5, 2, 'rgba(18,20,22,.22)');
        ell(x, a, b, 5, 2, '#5d5d58'); ell(x, a, b, 3, 1, '#7e7d74');
        px(x, a - 1, b, 2, 1, '#a5a399');
      };
      const corner = (a, b0, b1) => {
        for (let yy = b0; yy < b1; yy += 8) {
          px(x, a, yy, 6, 4, 'rgba(255,255,255,.10)');
          px(x, a, yy + 4, 6, 4, 'rgba(20,20,18,.10)');
          px(x, a + 5, yy, 1, 8, 'rgba(20,20,18,.16)');
        }
      };
      const corniceShade = by => {
        px(x, dir > 0 ? 1 : 0, by + 2, W - 1, 1, 'rgba(20,20,18,.20)');
        px(x, dir > 0 ? 2 : 0, by + 3, W - 2, 1, 'rgba(20,20,18,.09)');
      };
      const vent = (a, b, w) => {
        sh(a, b, w, 7); px(x, a, b, w, 7, '#8b9496');
        for (let i = a + 2; i < a + w - 1; i += 3) px(x, i, b + 2, 1, 4, '#4c5456');
        px(x, a, b, w, 1, '#c9d0cd');
      };
      const G = {
        fuorigrotta_blocco: { x0: 12, y0: 18, sx: 20, sy: 24, cols: 9, rows: 5, w: 11, h: 14, door: [106, 120], skip: r => r === 4 },
        fuorigrotta_torre: { x0: 8, y0: 16, sx: 24, sy: 26, cols: 6, rows: 8, w: 13, h: 17, door: [90, 205], skip: (r, c) => r === 7 && (c === 2 || c === 3) },
        pianura_municipio: { x0: 15, y0: 18, sx: 27, sy: 26, cols: 11, rows: 6, w: 14, h: 16, door: [174, 156], skip: (r, c) => r === 5 && (c === 5 || c === 6) },
        caserta_reggia: { x0: 14, y0: 18, sx: 26, sy: 26, cols: 14, rows: 6, w: 16, h: 16, door: [210, 156], skip: (r, c) => r === 5 && (c === 6 || c === 7) },
        pianura_borgo: { x0: 12, y0: 24, sx: 36, sy: 28, cols: 4, rows: 3, w: 14, h: 16, door: [92, 88], skip: (r, c) => r === 2 && c === 2 },
        salerno_palazzo: { x0: 12, y0: 16, sx: 28, sy: 24, cols: 5, rows: 3, w: 14, h: 16, door: [92, 72], skip: (r, c) => r === 2 && c === 2 }
      };
      const COR = {
        fuorigrotta_blocco: [38, 62, 86, 104], fuorigrotta_torre: [38, 64, 90, 116, 142, 168, 194],
        fuorigrotta_teatro: [12, 216], fuorigrotta_mostra: [10, 136], fuorigrotta_stadio: [0, H - 4],
        pianura_chiesa: [74, 80], pianura_borgo: [12], pianura_municipio: [39, 65, 91, 117, 143],
        bacoli_terme: [18], bacoli_castello: [28], bacoli_casa: [12], caserta_reggia: [39, 65, 91, 117, 143],
        salerno_arechi: [24], salerno_palazzo: [38, 62]
      };
      for (const cy of COR[kind] || []) corniceShade(cy);
      corner(2, roofH + 6, H - 14); corner(safe - 8, roofH + 6, H - 14);
      const g = G[kind];
      if (g) {
        for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) {
          if (g.skip && g.skip(r, c)) continue;
          const wx = g.x0 + c * g.sx, wy = g.y0 + r * g.sy;
          if (wx + g.w + 2 > safe) continue;
          if ((r * 3 + c * 5) % 7 === 0 && wy + g.h + 8 < wy + g.sy) ac(wx + 1, wy + g.h + 3);
          else if ((r + c) % 4 === 2) shutter(wx + 2, wy + 2, g.w - 4, g.h - 4);
          if (r > 0 && (r + c) % 3 === 0 && wy + g.h + 6 < wy + g.sy) pot(wx + g.w - 5, wy + g.h + 2);
        }
        pipe(9, roofH + 6, H - 12); pipe(safe - 3, roofH + 8, H - 12);
        intercom(g.door[0], g.door[1]);
        manhole(Math.round(W * .34), H - 6);
      }
      switch (kind) {
        case 'fuorigrotta_blocco': sign(22, H - 30, 'CAFFE', '#b44a3a'); antenna(Math.round(W * .22), Math.max(10, roofH - 4)); break;
        case 'fuorigrotta_torre': antenna(Math.round(W * .30), Math.max(10, roofH - 4)); break;
        case 'pianura_borgo': sign(18, H - 28, 'TRATTORIA', '#b44a3a'); antenna(Math.round(W * .62), Math.max(10, roofH - 4)); break;
        case 'salerno_palazzo': sign(16, H - 28, 'PIZZA', '#b44a3a'); antenna(Math.round(W * .72), Math.max(10, roofH - 4)); break;
        case 'fuorigrotta_teatro':
          sign(28, 62, 'MOSTRA', '#b44a3a'); sign(458, 62, 'TEATRO', '#2f6a4d');
          vent(30, 226, 22); vent(W - 60, 226, 22); manhole(Math.round(W * .5), H - 6);
          break;
        case 'fuorigrotta_mostra':
          sign(18, 26, 'MOSTRA', '#3f6f8a'); sign(226, 146, 'PAVILLON', '#b44a3a');
          vent(270, 24, 20); manhole(Math.round(W * .5), H - 6);
          break;
        case 'fuorigrotta_stadio': {
          const bx = Math.round(W / 2) - 22;
          sh(bx, 8, 44, 16); px(x, bx, 8, 44, 16, '#39434a');
          px(x, bx + 1, 9, 42, 14, '#24292c');
          this._tinyText(x, 'MARADONA', bx + 6, 13, '#f2d24f');
          sign(22, 28, 'STADIO', '#2f6a4d');
          break;
        }
        case 'pianura_chiesa': pipe(238, 80, H - 14); sign(150, 214, 'PARROCCHIA', '#8e7c62'); break;
        case 'bacoli_terme': sign(20, 118, 'TERME', '#8f6a55'); pipe(290, 26, H - 12); manhole(Math.round(W * .6), H - 6); break;
        case 'bacoli_castello': sign(24, H - 34, 'CASTELLO', '#8e7b60'); break;
        case 'salerno_arechi': sign(16, H - 32, 'CASTELLO', '#8e7b60'); break;
        case 'caserta_reggia': sign(18, H - 30, 'REGGIA', '#9a9285'); break;
        case 'bacoli_casa':
          ac(28, 64); intercom(76, 72); pot(110, 62);
          sign(16, 74, 'PESCE', '#3f6f8a');
          antenna(Math.round(W * .68), Math.max(10, roofH - 4));
          manhole(Math.round(W * .5), H - 6);
          break;
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
    _awning(col, w) {
      // Tenda da negozio: telo a pieghe, orlo dentellato, staffe laterali e
      // ombra portata. Nessun rettangolo piatto a due colori.
      const c = cv(w, 20), x = ctx(c), dark = shade(col, -42), light = shade(col, 28);
      for (let i = 0; i < w; i += 8) {
        const fold = ((i / 8) | 0) % 2 === 0 ? col : shade(col, -12);
        px(x, i, 0, 8, 13, fold);
        px(x, i, 0, 1, 13, 'rgba(24,20,18,.20)');
        px(x, i + 6, 0, 2, 13, 'rgba(24,20,18,.16)');
        px(x, i + 2, 1, 1, 11, 'rgba(255,245,220,.20)');
        x.fillStyle = shade(fold, -18);
        x.beginPath(); x.arc(i + 4, 13, 4, 0, Math.PI); x.fill();
        px(x, i + 3, 15, 2, 2, 'rgba(20,16,14,.22)');
      }
      px(x, 0, 11, w, 2, 'rgba(20,16,14,.18)');
      px(x, 0, 0, w, 2, light);
      px(x, 0, 2, w, 1, 'rgba(255,250,232,.22)');
      px(x, 0, 18, w, 2, dark);
      px(x, 2, 3, 2, 7, '#554d43'); px(x, w - 4, 3, 2, 7, '#554d43');
      px(x, 1, 3, 4, 1, '#8a8072'); px(x, w - 5, 3, 4, 1, '#8a8072');
      return c;
    },

    _trim(kind, w, col, pots) {
      if (kind === 'cornice') {
        const c = cv(w, 10), x = ctx(c);
        px(x, 0, 3, w, 7, 'rgba(22,20,18,.20)');
        px(x, 0, 0, w, 4, col);
        px(x, 0, 0, w, 1, shade(col, 30));
        px(x, 0, 4, w, 2, shade(col, -28));
        px(x, 0, 6, w, 1, shade(col, -48));
        for (let i = 2; i < w - 1; i += 6) px(x, i, 4, 3, 2, shade(col, -38));
        return c;
      }
      if (kind === 'balcony') {
        const c = cv(w, 18), x = ctx(c);
        px(x, 2, 15, w - 4, 3, 'rgba(20,20,18,.24)');
        px(x, 0, 12, w, 5, '#aca393');
        px(x, 0, 12, w, 1, '#d3c9b6');
        px(x, 0, 16, w, 2, '#6f6b62');
        px(x, 1, 2, w - 2, 2, '#616b70');
        px(x, 1, 4, w - 2, 1, '#9aa4a6');
        for (let i = 2; i < w - 2; i += 4) {
          px(x, i, 5, 1, 8, '#4f595e');
          px(x, i + 1, 5, 1, 8, 'rgba(210,220,220,.22)');
        }
        px(x, 1, 11, w - 2, 2, '#59636a');
        if (pots) for (let i = 5; i < w - 5; i += 13) {
          px(x, i, 8, 5, 4, '#a45b45'); px(x, i + 1, 9, 3, 2, '#c27455');
          px(x, i + 1, 5, 2, 3, '#3f7746'); px(x, i + 3, 4, 2, 4, '#4e8b50');
          px(x, i + 2, 3, 1, 1, '#d95e52'); px(x, i + 4, 3, 1, 1, '#e4bd59');
        }
        return c;
      }
      const c = cv(w, 24), x = ctx(c);
      // Margine di 3 px: anche con la scala metrica frazionaria gli angoli
      // restano trasparenti e non appare il consueto sfondo quadrato.
      px(x, 3, 18, w - 6, 6, shade(col, -32));
      px(x, 4, 0, 4, 20, col); px(x, w - 8, 0, 4, 20, col);
      px(x, 5, 0, 1, 20, shade(col, 24)); px(x, w - 7, 0, 1, 20, shade(col, 24));
      x.fillStyle = shade(col, -18);
      x.beginPath(); x.moveTo(4, 8); x.quadraticCurveTo(w / 2, -8, w - 6, 8);
      x.lineTo(w - 6, 13); x.quadraticCurveTo(w / 2, -2, 4, 13); x.closePath(); x.fill();
      return c;
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
      /* Tutti i props conservano le dimensioni legacy: gli offset di disegno
       * del motore (lamp -36, bench -10, cart -16, ...) e le ombre a terra
       * restano quindi esattamente dove erano. */
      const shadeBase = (cx, cy, rx, ry) => ell(x, cx, cy, rx, ry, 'rgba(24,22,20,.20)');
      if(kind==='lamp'){
        // Lampione in ghisa:(base con ombra, fusto rastremato, lanterna a vetri.
        c=cv(24,52); x=ctx(c);
        x.fillStyle='rgba(255,238,168,.13)'; x.beginPath(); x.arc(12,13,14,0,Math.PI*2); x.fill();
        shadeBase(12,50,8,2);
        poly(x,[[9,48],[15,48],[14,36],[10,36]],'#2f353b');
        px(x,10,20,4,16,'#3b4248'); px(x,10,20,1,16,'#6a7176'); px(x,13,20,1,16,'#242a30');
        px(x,8,35,8,3,'#4a5158'); px(x,9,34,6,1,'#737a80');
        px(x,7,47,10,4,'#3d444b'); px(x,8,47,8,1,'#676e74'); px(x,8,50,8,2,'#292f34');
        px(x,8,18,8,3,'#2f353b'); px(x,6,17,12,2,'#4a5158');
        px(x,7,8,10,9,'#f6e7a2'); px(x,8,9,8,7,'#fff3c8');
        px(x,6,7,2,11,'#394047'); px(x,16,7,2,11,'#394047');
        px(x,8,13,8,1,'#8d9092'); px(x,11,8,2,9,'#6f7679');
        poly(x,[[5,8],[19,8],[16,5],[8,5]],'#4a5158');
        px(x,7,4,10,2,'#5b6268'); px(x,10,2,4,3,'#3d444b'); px(x,11,0,2,3,'#6a7176');
        px(x,8,9,2,2,'rgba(255,255,255,.65)');
        // Bulloni alla base e riflesso sul vetro: finiture coerenti col lampione.
        px(x,8,51,1,1,'#8d9496'); px(x,15,51,1,1,'#8d9496');
        px(x,14,10,1,4,'rgba(255,255,255,.34)');
      }
      else if(kind==='bench'){
        // Panchina da piazza: tre liste sullo schienale, tre sul sedile,
        // braccioli in ghisa e gambe con ombra di contatto.
        c=cv(36,22); x=ctx(c);
        shadeBase(18,20,16,2);
        for (const by of [3,6,9]) {
          px(x,4,by,28,2,'#704d31'); px(x,5,by,26,1,'#9a7048');
          px(x,5,by+1,26,1,'#5a3d27');
        }
        px(x,3,2,2,10,'#3b4248'); px(x,31,2,2,10,'#3b4248');
        px(x,4,11,28,3,'#6d4a2f'); px(x,5,11,26,1,'#a97a53');
        for (let sx=6;sx<32;sx+=4) { px(x,sx,12,1,2,'#5a3d27'); px(x,sx+2,11,1,1,'#c29466'); }
        px(x,3,12,3,1,'#4a5158'); px(x,30,12,3,1,'#4a5158');
        poly(x,[[2,13],[6,13],[5,14],[3,14]],'#3b4248');
        poly(x,[[30,13],[34,13],[33,14],[31,14]],'#3b4248');
        for (const lx of [6,27]) {
          px(x,lx,14,3,5,'#4a382b'); px(x,lx,17,4,2,'#352922');
          px(x,lx+1,14,1,3,'#8a6240');
        }
        for (const sx0 of [7,17,27]) px(x,sx0,3,1,1,'rgba(40,30,22,.40)');
        px(x,5,19,26,1,'rgba(24,22,20,.18)');
      }
      else if(kind==='edicola'){
        // Edicola: tetto a falda, vetrina con riviste, tendina a righe e zoccolo.
        c=cv(48,52); x=ctx(c);
        shadeBase(24,48,22,3);
        poly(x,[[0,10],[6,4],[42,4],[48,10]],'#8a7046');
        px(x,0,8,48,6,'#9a8052'); px(x,0,8,48,1,'#c0a776'); px(x,0,13,48,1,'#5a4528');
        for (let sx=0;sx<48;sx+=8) px(x,sx,6,4,2,'#ad9161');
        px(x,2,14,44,30,'#2f6a4d'); px(x,4,17,40,23,'#f3ecd8');
        px(x,5,18,38,2,'#fff7e2'); px(x,5,39,38,2,'#cdbfa5');
        for (let mx=6;mx<42;mx+=12) {
          px(x,mx,21,10,6,'#c9564a'); px(x,mx+1,22,8,4,'#f0e4cf');
          px(x,mx,29,10,6,'#4a87b8'); px(x,mx+1,30,8,4,'#dceef3');
          px(x,mx,37,10,2,'#e0ab69');
        }
        px(x,20,17,2,23,'#2f6a4d'); px(x,32,17,2,23,'#2f6a4d');
        px(x,4,16,40,2,'#c9564a'); px(x,4,20,40,2,'#f0e4cf');
        for (let ax=4;ax<44;ax+=8) px(x,ax,16,4,2,'#c9564a');
        px(x,4,44,40,4,'#6b5632'); px(x,6,45,36,1,'#a07c4c');
        px(x,2,47,44,3,'#5a4528'); px(x,6,48,36,1,'#7a5c34');
      }
      else if(kind==='plant'){
        c=cv(18,22); x=ctx(c);
        shadeBase(9,20,7,2);
        px(x,6,13,6,6,'#8b6244'); px(x,7,14,4,4,'#a07050'); px(x,6,13,6,2,'#a87552');
        px(x,5,12,8,2,'#5e4028');
        ell(x,9,8,7,6,'#5f9a4e'); ell(x,6,7,4,4,'#7ab868');
        ell(x,12,6,3,3,'#4f8a4c'); ell(x,9,4,3,2,'#87c06e');
        px(x,9,3,1,7,'#3f6f3b'); px(x,11,6,2,2,'#d96f8b'); px(x,5,9,2,1,'#a8d47a');
        px(x,7,6,2,1,'rgba(255,255,255,.24)'); px(x,12,5,1,2,'#3f6f3b');
      }
      else if(kind==='cart'){
        // Carretto da mercato: cassetta in legno, merce colorata, ruote a raggi.
        c=cv(40,28); x=ctx(c);
        shadeBase(20,26,17,2);
        poly(x,[[4,10],[34,10],[32,19],[6,19]],'#7a5637');
        px(x,5,11,28,7,'#986d48'); px(x,5,11,28,1,'#c09466');
        for (let bx=6;bx<32;bx+=6) { px(x,bx,11,1,7,'#65432e'); px(x,bx,12,5,1,'rgba(255,225,180,.18)'); }
        px(x,5,18,28,2,'#5e4028');
        poly(x,[[6,10],[9,4],[31,4],[34,10]],'#c9564a');
        px(x,8,4,22,1,'#e87d68');
        ell(x,11,6,3,2,'#f2d24f'); ell(x,17,6,3,2,'#e8843c'); ell(x,24,6,3,2,'#7a9a5a'); ell(x,29,6,2,2,'#e9b84a');
        for (const wx of [9,28]) {
          ell(x,wx,22,5,5,'#3a3430'); ell(x,wx,22,3,3,'#8b8f95');
          px(x,wx,20,1,5,'#d8dcd8'); px(x,wx-2,22,5,1,'#d8dcd8');
          px(x,wx,22,1,1,'#4a5158');
        }
        px(x,34,12,4,2,'#65432e'); px(x,36,8,2,5,'#8b6244');
      }
      else if(kind==='sign'){
        // Segnavia: due tabelle sfalsate, palo con base e ombra.
        c=cv(28,34); x=ctx(c);
        shadeBase(14,32,10,2);
        px(x,12,12,4,18,'#65432e'); px(x,13,13,1,16,'#8b6244');
        px(x,10,29,8,3,'#4a382b');
        px(x,2,2,24,12,'#f0e4cf'); px(x,2,2,24,2,'#7a5637');
        px(x,2,12,24,2,'#b08a45'); px(x,3,5,18,2,'#b44a3a'); px(x,3,9,14,2,'#5a7a8f');
        px(x,6,15,20,8,'#e8d7a8'); px(x,6,15,20,1,'#8b6244'); px(x,6,22,20,1,'#b08a45');
        px(x,8,18,15,2,'#7a5637');
        px(x,10,31,8,1,'rgba(24,22,20,.18)');
      }
      else if(kind==='table_out'){
        // Tavolino da bar: piano a tre quarti, tovagliolo, tazza, gambe.
        c=cv(28,20); x=ctx(c);
        shadeBase(14,18,12,2);
        poly(x,[[3,7],[24,7],[27,10],[1,10]],'#8b6244');
        poly(x,[[2,8],[25,8],[26,10],[2,10]],'#a07050');
        px(x,3,7,22,1,'#c09466'); px(x,5,8,18,1,'rgba(255,235,200,.24)');
        for (const lx of [4,21]) { px(x,lx,11,3,6,'#65432e'); px(x,lx,15,4,2,'#4a382b'); }
        px(x,11,4,6,3,'#f0e4cf'); px(x,12,5,4,2,'#fff7e4');
        ell(x,22,7,2,1,'#f0ead6'); px(x,20,5,4,1,'#c9a44a');
      }
      else if(kind==='chair_out'){
        // Sedia da tavolo: schienale a liste, sedile, gambe e ombra.
        c=cv(14,18); x=ctx(c);
        shadeBase(7,16,6,2);
        px(x,3,2,8,6,'#7a5637'); px(x,4,3,6,4,'#986d48');
        for (let sy=3;sy<7;sy+=2) px(x,5,sy,4,1,'#b78a5c');
        px(x,3,8,8,3,'#986d48'); px(x,3,8,8,1,'#c09466');
        px(x,2,11,10,1,'#65432e');
        for (const lx of [3,9]) { px(x,lx,12,2,4,'#65432e'); px(x,lx,15,3,1,'#4a382b'); }
      }
      else if(kind==='home_rug'){
        // Tappeto orientale: doppio bordo, motivi a rombo simmetrici e frange.
        c=cv(56,24); x=ctx(c);
        px(x,0,0,56,24,'#7a2f38'); px(x,2,2,52,20,'#e0b95e');
        px(x,4,4,48,16,'#b8444a'); px(x,6,6,44,12,'#2f6070');
        px(x,8,8,40,8,'#8e3340');
        for (let i=10;i<46;i+=8) {
          poly(x,[[i,12],[i+4,9],[i+8,12],[i+4,15]],'#d8a94f');
          poly(x,[[i+1,12],[i+4,10],[i+7,12],[i+4,14]],'#e8d7a8');
          px(x,i+3,12,2,1,'#8e3340');
        }
        for (let f=1;f<56;f+=4) { px(x,f,0,1,2,'#f0e4cf'); px(x,f,22,1,2,'#f0e4cf'); }
        px(x,0,2,56,1,'#c9564a'); px(x,0,21,56,1,'#c9564a');
      }
      else if(kind==='home_books'){
        // Libreria a tre ripiani: libri di altezze diverse, ombre e coronamento.
        c=cv(42,52); x=ctx(c);
        px(x,0,0,42,52,'#5e4028'); px(x,2,2,38,48,'#8b6244');
        px(x,3,3,36,1,'rgba(255,230,190,.24)');
        const cols=['#c9564a','#4a87b8','#e9b84a','#7a9a5a','#f0e4cf','#8a6fa8'];
        for (let s=0;s<3;s++) {
          const by=5+s*15;
          px(x,4,by+11,34,4,'#5e4028'); px(x,4,by+11,34,1,'#b78a5c');
          for (let i=0;i<7;i++) {
            const bx=5+i*5, h=8+(i+s)%3;
            px(x,bx,by+12-h,4,h,cols[(i+s)%cols.length]);
            px(x,bx,by+12-h,4,1,'#f3efe6');
            px(x,bx+3,by+13-h,1,h-1,'rgba(30,20,14,.24)');
            if(i%3===0) px(x,bx+1,by+9-h,2,1,'#c9a44a');
          }
          px(x,4,by+15,34,1,'rgba(30,20,14,.20)');
        }
        for (const sx of [1,38]) px(x,sx,2,3,50,'#6b4b33');
        px(x,0,0,42,3,'#9b7349'); px(x,0,3,42,1,'#c09466');
        px(x,0,49,42,3,'#4a3526');
      }
      else if(kind==='home_lamp'){
        // Lampada da tavolo: stelo, base, paralume conico e bagliore.
        c=cv(22,52); x=ctx(c);
        x.fillStyle='rgba(255,220,150,.14)'; x.beginPath(); x.arc(11,15,15,0,Math.PI*2); x.fill();
        shadeBase(11,49,10,2);
        px(x,10,20,3,25,'#8b7048'); px(x,10,20,1,25,'#c1a26c');
        px(x,6,46,10,4,'#5e4a30'); px(x,7,46,8,1,'#a88958');
        px(x,8,43,6,2,'#8b7048');
        poly(x,[[3,20],[19,20],[15,5],[7,5]],'#d8a94f');
        poly(x,[[4,19],[18,19],[15,6],[8,6]],'#f0d58a');
        px(x,7,6,2,13,'rgba(255,255,255,.42)');
        px(x,3,19,16,2,'#a87c3c'); px(x,6,9,10,7,'#fff0b8');
        px(x,9,2,4,4,'#8b7048'); px(x,10,0,2,3,'#c1a26c');
      }
      else if(kind==='home_plant'){
        // Vaso da interno: terra, fusto e chioma a tre livelli di luce.
        c=cv(24,30); x=ctx(c);
        shadeBase(12,28,9,2);
        px(x,7,20,10,8,'#a05f3f'); px(x,8,21,8,6,'#c07a52');
        px(x,6,18,12,3,'#7a4930'); px(x,7,18,10,1,'#d09165');
        px(x,8,23,8,1,'rgba(60,36,24,.24)'); px(x,9,27,6,2,'#7a4930');
        ell(x,12,13,8,6,'#4f8a4c'); ell(x,8,11,4,4,'#6faa5c');
        ell(x,16,10,4,4,'#8fbe70'); ell(x,12,7,4,3,'#a8d47a');
        px(x,11,7,2,10,'#3f6f3b'); px(x,7,9,3,1,'#b8dc8a');
        px(x,17,12,2,2,'#d96f8b');
      }
      else if(kind==='home_painting'){
        // Quadro: cornice dorata, cielo, colline, casa e albero in miniatura.
        c=cv(34,26); x=ctx(c);
        px(x,0,0,34,26,'#8b6244'); px(x,1,1,32,24,'#d8b86a');
        px(x,3,3,28,20,'#8fc3d8'); px(x,3,3,28,5,'#c9e5ef');
        ell(x,24,8,3,3,'#f4e7a8');
        poly(x,[[3,17],[11,10],[18,17],[25,12],[31,17],[31,23],[3,23]],'#6f9a5c');
        px(x,12,14,8,7,'#f0e4cf'); poly(x,[[11,14],[16,10],[21,14]],'#c9564a');
        px(x,15,17,2,4,'#7a5637');
        px(x,6,16,2,7,'#3f6f3b'); ell(x,7,14,3,3,'#4f8a4c');
        px(x,3,21,28,2,'#5f7e96');
        px(x,0,0,34,2,'#b08a45'); px(x,0,24,34,2,'#8a6a32');
        px(x,0,0,2,26,'#b08a45'); px(x,32,0,2,26,'#8a6a32');
      }
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
