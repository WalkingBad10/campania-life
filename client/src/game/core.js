/* CAMPania LIFE — core.js
 * Motore: namespace, utility, eventi, input, camera, grafica, audio, salvataggio.
 * Nessuna dipendenza esterna. Caricato per primo.
 */
(function (w) {
  'use strict';
  const CL = w.CL = w.CL || {};
  CL.VERSION = '1.0.0';
  CL.TILE = 16;
  CL.VIEW_W = 480;
  CL.VIEW_H = 270;

  /* ---------------------------------------------------------------- util */
  const U = CL.util = {};
  U.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  U.rand = (a, b) => b === undefined ? Math.random() * (a === undefined ? 1 : a) : a + Math.random() * (b - a);
  U.randInt = (a, b) => Math.floor(U.rand(a, b + 1));
  U.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  U.chance = p => Math.random() < p;
  U.pad2 = n => String(n).padStart(2, '0');
  U.money = n => Math.floor(n).toLocaleString('it-IT') + ' €';
  U.clone = o => JSON.parse(JSON.stringify(o));
  U.overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  U.rng = function (seed) {
    let s = (seed >>> 0) || 1;
    return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  };
  U.hash = function (str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  U.wrap = (v, min, max) => v < min ? max : v > max ? min : v;
  U.approach = (v, t, step) => v < t ? Math.min(v + step, t) : Math.max(v - step, t);
  U.esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* --------------------------------------------------------------- events */
  CL.events = (function () {
    const map = {};
    return {
      on(k, fn) { (map[k] || (map[k] = [])).push(fn); return fn; },
      off(k, fn) { const a = map[k]; if (a) { const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); } },
      emit(k, data) { const a = map[k]; if (a) for (let i = a.length - 1; i >= 0; i--) a[i](data); },
      clear() { for (const k in map) delete map[k]; }
    };
  })();

  /* ---------------------------------------------------------------- input */
  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyE: 'interact', Enter: 'confirm', Space: 'action',
    KeyQ: 'ability', KeyF: 'ability', Tab: 'menu', Escape: 'pause',
    KeyI: 'inventory', KeyM: 'map', KeyJ: 'quests', KeyP: 'phone', KeyC: 'collection',
    Digit1: 'slot1', Digit2: 'slot2', Digit3: 'slot3', Digit4: 'slot4', Digit5: 'slot5',
    KeyR: 'reset', ShiftLeft: 'run', ShiftRight: 'run'
  };
  const INPUT = CL.input = {
    down: {}, pressed: {}, released: {}, listeners: [], enabled: true,
    init() {
      w.addEventListener('keydown', e => {
        const a = KEYMAP[e.code];
        if (a && (a === 'menu' || a === 'action' || a === 'up' || a === 'down' || a === 'left' || a === 'right' || a === 'confirm')) e.preventDefault();
        if (!a) return;
        if (!this.down[a]) { this.pressed[a] = true; this.listeners.forEach(fn => fn(a, true)); }
        this.down[a] = true;
      });
      w.addEventListener('keyup', e => {
        const a = KEYMAP[e.code]; if (!a) return;
        this.down[a] = false; this.released[a] = true;
        this.listeners.forEach(fn => fn(a, false));
      });
      w.addEventListener('blur', () => { this.down = {}; });
      // mobile
      document.querySelectorAll('#mobile-controls button').forEach(b => {
        const a = b.dataset.m;
        const on = e => { e.preventDefault(); if (!this.down[a]) { this.pressed[a] = true; this.listeners.forEach(fn => fn(a, true)); } this.down[a] = true; };
        const off = e => { e.preventDefault(); this.down[a] = false; this.released[a] = true; this.listeners.forEach(fn => fn(a, false)); };
        b.addEventListener('touchstart', on, { passive: false });
        b.addEventListener('touchend', off, { passive: false });
        b.addEventListener('mousedown', on); b.addEventListener('mouseup', off);
      });
      const mob = document.getElementById('mobile-controls');
      if (mob && 'ontouchstart' in w) mob.classList.remove('hidden');
    },
    onKey(fn) { this.listeners.push(fn); return fn; },
    offKey(fn) { const i = this.listeners.indexOf(fn); if (i >= 0) this.listeners.splice(i, 1); },
    isDown(a) { return !!this.down[a]; },
    hit(a) { return !!this.pressed[a]; },
    consume(a) { const v = !!this.pressed[a]; this.pressed[a] = false; return v; },
    axis() {
      let x = 0, y = 0;
      if (this.down.left) x--; if (this.down.right) x++;
      if (this.down.up) y--; if (this.down.down) y++;
      if (x && y) { x *= 0.7071; y *= 0.7071; }
      return { x, y };
    },
    endFrame() { this.pressed = {}; this.released = {}; }
  };

  /* --------------------------------------------------------------- camera */
  CL.camera = {
    x: 0, y: 0, shakeT: 0, shakeMag: 0, w: CL.VIEW_W, h: CL.VIEW_H,
    bounds: { w: 0, h: 0 },
    setBounds(w, h) { this.bounds.w = w; this.bounds.h = h; },
    snap(t) {
      this.x = U.clamp(t.x - this.w / 2, 0, Math.max(0, this.bounds.w - this.w));
      this.y = U.clamp(t.y - this.h / 2, 0, Math.max(0, this.bounds.h - this.h));
    },
    follow(t, dt, speed) {
      const tx = U.clamp(t.x - this.w / 2, 0, Math.max(0, this.bounds.w - this.w));
      const ty = U.clamp(t.y - this.h / 2, 0, Math.max(0, this.bounds.h - this.h));
      const k = 1 - Math.pow(0.0015, dt * (speed || 1));
      this.x = U.lerp(this.x, tx, k); this.y = U.lerp(this.y, ty, k);
    },
    shake(mag, time) { if (CL.settings.shake) { this.shakeMag = Math.max(this.shakeMag, mag); this.shakeT = Math.max(this.shakeT, time || .25); } },
    update(dt) { if (this.shakeT > 0) { this.shakeT -= dt; if (this.shakeT <= 0) this.shakeMag = 0; } },
    apply(ctx) {
      let sx = 0, sy = 0;
      if (this.shakeT > 0) { sx = U.rand(-this.shakeMag, this.shakeMag); sy = U.rand(-this.shakeMag, this.shakeMag); }
      ctx.translate(-Math.round(this.x + sx), -Math.round(this.y + sy));
    },
    toWorld(sx, sy) { return { x: sx + this.x, y: sy + this.y }; }
  };

  /* --------------------------------------------------------------- gfx */
  const G = CL.gfx = {
    ctx: null,
    px(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); },
    rect(c, x, y, w, h, col, lw) { c.strokeStyle = col; c.lineWidth = lw || 1; c.strokeRect(Math.round(x) + .5, Math.round(y) + .5, Math.round(w) - 1, Math.round(h) - 1); },
    circle(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(Math.round(x), Math.round(y), r, 0, Math.PI * 2); c.fill(); },
    text(c, str, x, y, opts) {
      opts = opts || {};
      c.font = (opts.bold ? 'bold ' : '') + (opts.size || 8) + 'px "Trebuchet MS",Verdana,sans-serif';
      c.textAlign = opts.align || 'left'; c.textBaseline = opts.baseline || 'top';
      if (opts.shadow !== false) { c.fillStyle = opts.shadowColor || 'rgba(6,10,16,.85)'; c.fillText(str, Math.round(x) + 1, Math.round(y) + 1); }
      c.fillStyle = opts.color || '#f6e8c8'; c.fillText(str, Math.round(x), Math.round(y));
    },
    panel(c, x, y, w, h, opts) {
      opts = opts || {};
      G.px(c, x + 2, y + 2, w, h, 'rgba(4,8,14,.55)');
      G.px(c, x, y, w, h, opts.fill || '#16222c');
      G.rect(c, x, y, w, h, opts.border || '#e9b84a', 1);
      G.px(c, x + 2, y + 2, w - 4, 1, 'rgba(255,255,255,.12)');
    },
    bar(c, x, y, w, h, pct, col, bg) {
      G.px(c, x, y, w, h, bg || '#0e161e');
      G.px(c, x + 1, y + 1, Math.max(0, Math.floor((w - 2) * U.clamp(pct, 0, 1))), h - 2, col);
    },
    sprite(c, img, x, y, scale) {
      if (!img) return;
      c.imageSmoothingEnabled = false;
      c.drawImage(img, Math.round(x), Math.round(y), img.width * (scale || 1), img.height * (scale || 1));
    }
  };

  /* --------------------------------------------------------------- audio */
  const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
  const TRACKS = {
    title: { bpm: 96, wave: 'triangle', notes: [69, 72, 76, 79, 76, 72, 74, 77, 81, 77, 74, 72, 69, 72, 74, 76], bass: [45, 45, 50, 50, 43, 43, 47, 47] },
    town: { bpm: 132, wave: 'square', notes: [64, 67, 71, 72, 71, 67, 69, 67, 64, 67, 71, 74, 72, 71, 67, 64], bass: [40, 40, 45, 45, 38, 38, 43, 43] },
    coast: { bpm: 110, wave: 'sine', notes: [67, 71, 74, 79, 76, 74, 71, 67, 69, 72, 76, 79, 76, 72, 69, 67], bass: [43, 43, 48, 48, 41, 41, 46, 46] },
    mountain: { bpm: 88, wave: 'triangle', notes: [57, 60, 64, 67, 64, 60, 62, 65, 69, 65, 62, 60, 57, 60, 62, 64], bass: [33, 33, 38, 38, 36, 36, 40, 40] },
    interior: { bpm: 120, wave: 'sine', notes: [60, 64, 67, 64, 62, 65, 69, 65, 60, 64, 67, 72, 69, 67, 64, 60], bass: [36, 36, 41, 41, 38, 38, 43, 43] },
    night: { bpm: 72, wave: 'sine', notes: [57, 60, 64, 60, 55, 59, 62, 59, 57, 60, 64, 67, 64, 60, 59, 57], bass: [33, 33, 36, 36, 31, 31, 35, 35] }
  };
  const A = CL.audio = {
    ctx: null, master: null, musicGain: null, sfxGain: null,
    volMusic: .55, volSfx: .75, track: null, step: 0, nextTime: 0, playing: false,
    init() {
      if (this.ctx) return;
      try {
        const AC = w.AudioContext || w.webkitAudioContext; if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain(); this.master.gain.value = .9; this.master.connect(this.ctx.destination);
        this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = this.volMusic; this.musicGain.connect(this.master);
        this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = this.volSfx; this.sfxGain.connect(this.master);
      } catch (e) { this.ctx = null; }
    },
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
    setVolumes() { if (this.musicGain) this.musicGain.gain.value = this.volMusic; if (this.sfxGain) this.sfxGain.gain.value = this.volSfx; },
    tone(freq, dur, type, vol, dest, when) {
      if (!this.ctx) return;
      const t = when || this.ctx.currentTime;
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type || 'square'; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(.0002, vol || .15), t + .012);
      g.gain.exponentialRampToValueAtTime(.0001, t + (dur || .15));
      o.connect(g); g.connect(dest || this.sfxGain); o.start(t); o.stop(t + (dur || .15) + .02);
    },
    noise(dur, vol, dest) {
      if (!this.ctx) return;
      const n = Math.floor(this.ctx.sampleRate * (dur || .1));
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource(), g = this.ctx.createGain();
      src.buffer = buf; g.gain.value = vol || .12; src.connect(g); g.connect(dest || this.sfxGain); src.start();
    },
    sfx(name) {
      if (!this.ctx) return; this.resume();
      const T = (f, d, ty, v, when) => this.tone(f, d, ty, v, this.sfxGain, when);
      switch (name) {
        case 'step': this.noise(.045, .035); break;
        case 'talk': T(520, .05, 'square', .05); T(660, .05, 'square', .035, this.ctx.currentTime + .05); break;
        case 'coin': T(880, .08, 'square', .10); T(1320, .14, 'square', .08, this.ctx.currentTime + .07); break;
        case 'confirm': T(523, .07, 'square', .09); T(784, .11, 'square', .08, this.ctx.currentTime + .06); break;
        case 'menu': T(420, .05, 'triangle', .07); break;
        case 'cancel': T(400, .09, 'triangle', .08); T(300, .12, 'triangle', .07, this.ctx.currentTime + .06); break;
        case 'door': this.noise(.13, .09); T(220, .12, 'triangle', .08); break;
        case 'catch': T(440, .08, 'square', .1); T(660, .08, 'square', .1, this.ctx.currentTime + .08); T(990, .2, 'square', .1, this.ctx.currentTime + .16); break;
        case 'fail': T(300, .12, 'sawtooth', .07); T(220, .18, 'sawtooth', .06, this.ctx.currentTime + .1); break;
        case 'hit': this.noise(.1, .14); T(160, .12, 'sawtooth', .1); break;
        case 'level': [523, 659, 784, 1047].forEach((f, i) => T(f, .18, 'square', .09, this.ctx.currentTime + i * .1)); break;
        case 'sleep': [392, 330, 262].forEach((f, i) => T(f, .3, 'sine', .09, this.ctx.currentTime + i * .14)); break;
        case 'phone': T(1200, .06, 'square', .06); T(900, .06, 'square', .06, this.ctx.currentTime + .1); break;
        case 'alert': T(880, .1, 'square', .08); T(660, .1, 'square', .08, this.ctx.currentTime + .12); break;
      }
    },
    setTrack(name) {
      if (this.track === name) return;
      this.track = name; this.step = 0; this.playing = !!name;
      if (this.ctx) this.nextTime = this.ctx.currentTime + .06;
    },
    stop() { this.track = null; this.playing = false; },
    tick() {
      if (!this.ctx || !this.playing || !this.track) return;
      const tr = TRACKS[this.track]; if (!tr) return;
      const spb = 60 / tr.bpm / 2;
      this.resume();
      if (this.nextTime < this.ctx.currentTime - .5) this.nextTime = this.ctx.currentTime + .05;
      while (this.nextTime < this.ctx.currentTime + .18) {
        const i = this.step % tr.notes.length;
        this.tone(NOTE(tr.notes[i]), spb * .85, tr.wave, .055, this.musicGain, this.nextTime);
        if (i % 2 === 0) this.tone(NOTE(tr.bass[(i / 2) % tr.bass.length]), spb * 1.7, 'triangle', .085, this.musicGain, this.nextTime);
        if (this.track === 'coast' && i % 4 === 0) this.noise(.22, .018, this.musicGain);
        this.step++; this.nextTime += spb;
      }
    }
  };

  /* ---------------------------------------------------------- save system */
  let memFallback = null;
  const LS = (function () {
    try { const k = '__cl_test__'; w.localStorage.setItem(k, '1'); w.localStorage.removeItem(k); return w.localStorage; }
    catch (e) { return null; }
  })();
  CL.save = {
    KEY: 'campania_life_save_v1',
    has() { return !!(LS ? LS.getItem(this.KEY) : memFallback); },
    write(obj) {
      const s = JSON.stringify({ v: 1, t: Date.now(), data: obj });
      try { if (LS) LS.setItem(this.KEY, s); else memFallback = s; return true; } catch (e) { memFallback = s; return false; }
    },
    read() {
      try {
        const s = LS ? LS.getItem(this.KEY) : memFallback; if (!s) return null;
        const o = JSON.parse(s); return o && o.data ? o : null;
      } catch (e) { return null; }
    },
    clear() { try { if (LS) LS.removeItem(this.KEY); } catch (e) {} memFallback = null; },
    exportB64(obj) { return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))); },
    importB64(s) { return JSON.parse(decodeURIComponent(escape(atob(s.trim())))); }
  };

  /* ------------------------------------------------------------- settings */
  CL.settings = { music: .55, sfx: .75, timescale: 3, pixelPerfect: true, shake: true };
  CL.loadSettings = function () {
    try {
      const s = LS && JSON.parse(LS.getItem('campania_life_settings') || 'null');
      if (s) Object.assign(CL.settings, s);
    } catch (e) {}
    A.volMusic = CL.settings.music; A.volSfx = CL.settings.sfx;
  };
  CL.storeSettings = function () {
    A.volMusic = CL.settings.music; A.volSfx = CL.settings.sfx; A.setVolumes();
    try { if (LS) LS.setItem('campania_life_settings', JSON.stringify(CL.settings)); } catch (e) {}
  };
})(window);
