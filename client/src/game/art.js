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
    P, ready: false, tiles: {}, cache: {},
    init() { if (this.ready) return; this.ready = true; this.buildTiles(); },
    px, shade, ell, cv, ctx,

    /* --------------------------------------------------------- tiles 16x16 */
    buildTiles() {
      for (const ch of ".TD,rpSW~#=fcoXBo^gkPCVXOH'") this.tiles[ch] = this.tile(ch);
    },
    tile(ch) {
      const c = cv(16, 16), x = ctx(c), R = U.rng(U.hash('tile' + ch));
      const dot = (col, n) => { for (let i = 0; i < n; i++) px(x, (R() * 16) | 0, (R() * 16) | 0, 1, 1, col); };
      switch (ch) {
        case '.': px(x, 0, 0, 16, 16, P.grass); dot(P.grassD, 14); dot(P.grassL, 8); break;
        case 'T': px(x, 0, 0, 16, 16, P.grass); dot(P.grassD, 6); break;
        case 'D': px(x, 0, 0, 16, 16, P.pave); dot(P.paveD, 10); break;
        case ',': px(x, 0, 0, 16, 16, '#a58b62'); dot('#8f764f', 16); dot('#bba272', 8); break;
        case 'r':
          px(x, 0, 0, 16, 16, P.road); px(x, 0, 0, 16, 1, P.roadL);
          for (let i = 0; i < 4; i++) px(x, i * 4, 7, 2, 2, P.line);
          dot('#4a4f53', 5); break;
        case 'p':
          px(x, 0, 0, 16, 16, P.pave); px(x, 0, 0, 16, 1, P.paveD); px(x, 0, 0, 1, 16, P.paveD);
          dot(P.paveL, 6); break;
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
        case 'O': // base guglia / monumento (solida)
          px(x, 0, 0, 16, 16, P.pave);
          ell(x, 8, 9, 7, 5, '#d7cfbf'); ell(x, 8, 9, 5, 3, '#ece6d7');
          px(x, 3, 12, 10, 2, '#b8ad97'); px(x, 7, 6, 2, 2, '#9f9480'); break;
        case 'H': // facciata storica
          px(x, 0, 0, 16, 16, '#b7aa95'); px(x, 0, 0, 16, 2, '#d2c7b2'); px(x, 0, 14, 16, 2, '#8a7f6f');
          for (let y = 3; y < 14; y += 4) for (let xx = 2; xx < 14; xx += 4) { px(x, xx, y, 2, 2, '#9d907d'); px(x, xx + 1, y + 1, 1, 1, '#cbbfa8'); }
          break;
        case "'": // dettaglio/accento
          px(x, 0, 0, 16, 16, P.pave); px(x, 7, 4, 2, 8, '#c9a44a'); break;
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
      const key = ['c', look.hair, look.skin, look.shirt, look.pants, dir, frame].join('|');
      if (this.cache[key]) return this.cache[key];
      const c = cv(16, 24), x = ctx(c), d = P.dark;
      const skinD = shade(look.skin, -26), shirtD = shade(look.shirt, -30), hairD = shade(look.hair, -28);
      const bob = frame === 1 ? 1 : frame === 3 ? -1 : 0;
      const legA = frame === 1 ? 1 : frame === 3 ? -1 : 0;
      // ombra
      px(x, 4, 22, 8, 1, 'rgba(20,24,28,.28)');
      // gambe
      px(x, 5, 17 + bob, 3, 5 + legA, look.pants); px(x, 9, 17 + bob, 3, 5 - legA, look.pants);
      px(x, 5, 21 + bob + legA, 3, 2, '#3a3130'); px(x, 9, 21 + bob - legA, 3, 2, '#3a3130');
      px(x, 5, 17 + bob, 3, 1, shade(look.pants, 20)); px(x, 9, 17 + bob, 3, 1, shade(look.pants, 20));
      // busto
      px(x, 4, 11 + bob, 8, 7, look.shirt); px(x, 3, 12 + bob, 2, 5, look.shirt); px(x, 11, 12 + bob, 2, 5, look.shirt);
      px(x, 4, 11 + bob, 8, 1, shirtD); px(x, 7, 11 + bob, 2, 6, shade(look.shirt, 14));
      px(x, 3, 16 + bob, 2, 1, look.skin); px(x, 11, 16 + bob, 2, 1, look.skin);
      // testa
      px(x, 4, 3 + bob, 8, 9, look.skin); px(x, 3, 5 + bob, 1, 6, look.skin); px(x, 12, 5 + bob, 1, 6, look.skin);
      px(x, 4, 11 + bob, 8, 1, skinD);
      // capelli
      px(x, 4, 2 + bob, 8, 3, look.hair); px(x, 3, 4 + bob, 1, 4, look.hair); px(x, 12, 4 + bob, 1, 4, look.hair);
      px(x, 5, 1 + bob, 6, 1, shade(look.hair, 22)); px(x, 4, 2 + bob, 8, 1, hairD);
      if (dir === 'up') {
        px(x, 4, 3 + bob, 8, 7, look.hair); px(x, 5, 5 + bob, 6, 4, hairD);
      } else if (dir === 'left') {
        px(x, 5, 7 + bob, 1, 2, d); px(x, 4, 4 + bob, 3, 4, look.hair);
      } else if (dir === 'right') {
        px(x, 10, 7 + bob, 1, 2, d); px(x, 9, 4 + bob, 3, 4, look.hair);
      } else {
        px(x, 6, 7 + bob, 1, 2, d); px(x, 10, 7 + bob, 1, 2, d);
        px(x, 6, 7 + bob, 1, 1, '#fff'); px(x, 10, 7 + bob, 1, 1, '#fff');
      }
      px(x, 7, 10 + bob, 3, 1, shade(look.skin, -40));
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
