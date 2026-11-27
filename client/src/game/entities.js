/* CAMPANIA LIFE — entities.js
 * Entità di gioco: giocatore, PNG, veicoli, creature, particelle.
 */
(function (w) {
  'use strict';
  const CL = w.CL, U = CL.util, D = CL.data, ART = CL.art, T = CL.TILE;
  const TAU = Math.PI * 2;
  // Ciclo passo/appoggio/passoopposto/appoggio: il fotogramma neutro fra i due
  // contatti rende più leggibile l'oscillazione di braccia e gambe.
  const WALK_CYCLE = [1, 0, 3, 0];
  const TURN_TIME = .14;

  function hash32(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function unitHash(id, salt) { return (hash32(id + '|' + salt) % 10000) / 10000; }
  function posedFrame(step) { return WALK_CYCLE[step % WALK_CYCLE.length]; }

  // Luce da NO: l'ombra cade sempre a SE, qualunque sia la direzione del
  // personaggio. Si accorcia appena il piede si solleva, senza mai cambiare
  // l'ancoraggio (footY resta il fondo della hitbox).
  function drawContactShadow(ctx, x, footY, base, lift) {
    const sx = Math.round(x) + 2, sy = footY + 1;
    const a = base - lift * .10, rx = 9 - lift * 1.2, ry = 5 - lift * .8;
    ctx.fillStyle = 'rgba(18,15,13,' + a.toFixed(3) + ')';
    ctx.beginPath(); ctx.ellipse(sx, sy, rx, ry, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(18,15,13,' + (a * .62).toFixed(3) + ')';
    ctx.beginPath(); ctx.ellipse(sx, sy, rx * .56, Math.max(1, ry * .4), 0, 0, TAU); ctx.fill();
  }

  function drawFigure(ctx, look, dir, frame, mode, x, footY, night, bob) {
    const img = night ? ART.nightCharacter(look, dir, frame, mode)
                      : ART.character(look, dir, frame, mode);
    ctx.drawImage(img, Math.round(x - img.width / 2), footY - img.height + 1 - Math.round(bob));
  }

  // Breve dissolvenza tra due facing: nessuna collisione o hitbox coinvolta.
  function drawFacing(ctx, look, dir, prevDir, turnT, frame, mode, x, footY, night, bob) {
    if (prevDir && prevDir !== dir && turnT > 0) {
      const t = Math.min(1, turnT / TURN_TIME);
      ctx.globalAlpha = t;
      drawFigure(ctx, look, prevDir, frame, mode, x, footY, night, bob);
      ctx.globalAlpha = 1 - t;
      drawFigure(ctx, look, dir, frame, mode, x, footY, night, bob);
      ctx.globalAlpha = 1;
      return;
    }
    drawFigure(ctx, look, dir, frame, mode, x, footY, night, bob);
  }

  function drawProps(ctx, npc, x, footY) {
    const p = npc.props;
    if (!p) return;
    const dir = npc.dir;
    const side = dir === 'left' ? -1 : dir === 'right' ? 1
      : (unitHash(npc.id, 'propSide') < .5 ? -1 : 1);
    const fx = Math.round(x), fy = Math.round(footY);
    ctx.save();
    if (p.dog) {
      const dx = fx + side * 12;
      ctx.fillStyle = 'rgba(18,15,13,.30)';
      ctx.beginPath(); ctx.ellipse(dx, fy + 1, 7, 2, 0, 0, TAU); ctx.fill();
      // Guinzaglio: dalla mano all'altezza del collare, non dal centro del corpo.
      ctx.strokeStyle = '#8a6a4d'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(fx + side * 3, fy - 9);
      ctx.quadraticCurveTo(fx + side * 8, fy - 5, dx - side * 3, fy - 5); ctx.stroke();
      ctx.fillStyle = '#8a6a4d'; ctx.fillRect(dx - 4, fy - 6, 8, 4);
      ctx.fillStyle = '#a07c58'; ctx.fillRect(dx + side * 3, fy - 8, 4, 4);
      ctx.fillStyle = '#5e4935';
      ctx.fillRect(dx + side * 3, fy - 9, 1, 2);
      ctx.fillRect(dx + side * 5, fy - 9, 1, 2);
      ctx.fillRect(dx - 3, fy - 2, 2, 2);
      ctx.fillRect(dx + 2, fy - 2, 2, 2);
      ctx.fillStyle = '#c8a37a'; ctx.fillRect(dx + side * 6, fy - 6, 2, 1);
      ctx.beginPath(); ctx.moveTo(dx - side * 4, fy - 5);
      ctx.lineTo(dx - side * 6, fy - 8); ctx.stroke();
    }
    if (p.bag) {
      const bx = fx + side * 7, by = fy - 8;
      ctx.fillStyle = 'rgba(18,15,13,.24)'; ctx.fillRect(bx, by + 6, 6, 2);
      ctx.strokeStyle = '#6f573f'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(bx + 1, by); ctx.lineTo(bx + 1, by - 3);
      ctx.lineTo(bx + 5, by - 3); ctx.lineTo(bx + 5, by); ctx.stroke();
      ctx.fillStyle = '#b08a5c'; ctx.fillRect(bx, by, 6, 6);
      ctx.fillStyle = '#8a6a4d'; ctx.fillRect(bx + 1, by + 1, 4, 2);
    }
    if (p.umbrella) {
      const ux = fx + side * 8, uy = fy - 12;
      ctx.fillStyle = 'rgba(18,15,13,.22)'; ctx.fillRect(ux, uy + 12, 3, 1);
      ctx.strokeStyle = '#39434b'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(ux + 1, uy + 12); ctx.stroke();
      ctx.fillStyle = '#4b6274';
      ctx.beginPath(); ctx.moveTo(ux - 2, uy + 2); ctx.lineTo(ux + 1, uy - 1);
      ctx.lineTo(ux + 3, uy + 3); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#8a6a4d';
      ctx.beginPath(); ctx.moveTo(ux + 1, uy + 6); ctx.lineTo(ux + 2, uy + 7); ctx.stroke();
    }
    if (p.coffee) {
      const cx = fx + side * 7, cy = fy - 12;
      ctx.fillStyle = 'rgba(18,15,13,.20)'; ctx.fillRect(cx, cy + 5, 5, 1);
      ctx.fillStyle = '#f2efe6'; ctx.fillRect(cx, cy, 5, 4);
      ctx.fillStyle = '#8b5a3c'; ctx.fillRect(cx + 1, cy, 3, 1);
      ctx.strokeStyle = '#f2efe6'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx + 5, cy + 2, 2, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    }
    ctx.restore();
  }

  class Entity {
    constructor(game, x, y) {
      this.game = game; this.x = x; this.y = y;
      this.w = 12; this.h = 10; this.dir = 'down';
      this.frame = 0; this.anim = 0; this.moving = false;
      this.alive = true; this.offsetY = 0;
    }
    get cx() { return this.x; }
    get cy() { return this.y + this.offsetY; }
    update(dt) {}
    draw(ctx) {}
    interact() {}
    near(px, py, dist) { return U.dist(this.x, this.y, px, py) <= (dist || 28); }
  }
  CL.Entity = Entity;

  /* -------------------------------------------------------------- GIOCATORE */
  class Player extends Entity {
    constructor(game, x, y) {
      super(game, x, y);
      this.w = 10; this.h = 8;
      this.stepT = 0; this.speed = 82;
      this.vehicle = null;
      this.look = null;
      this.mode = 'idle'; this.idleT = 0;
      this.prevDir = null; this.turnT = 0;
    }
    refreshLook() {
      const p = CL.state.profile; this.look = Object.assign({}, p.look);
      if (CL.state.outfit === 'divisa') this.look.shirt = '#e9b84a';
      if (CL.state.outfit === 'cappello') this.look.hair = '#c8a96a';
    }
    update(dt, opts) {
      this.refreshLook();
      this.turnT = Math.max(0, (this.turnT || 0) - dt);
      const game = this.game;
      if (this.vehicle) { this.anim += dt * 6; return; }
      if (opts && opts.modal) { this.moving = false; if (game.dbg) game.dbg.blocked = 'modal'; return; }
      const ax = CL.input.axis();
      this.moving = !!(ax.x || ax.y);
      let sp = this.speed * CL.systems.needs.speedFactor();
      if (CL.input.isDown('run')) sp *= 1.3;
      if (ax.x || ax.y) {
        const next = Math.abs(ax.x) > Math.abs(ax.y) ? (ax.x < 0 ? 'left' : 'right')
                                                     : (ax.y < 0 ? 'up' : 'down');
        if (next !== this.dir) { this.prevDir = this.dir; this.dir = next; this.turnT = TURN_TIME; }
        const x0 = this.x, y0 = this.y;
        let moved = false, blocked = [];
        // Sottopassi: anche con dt elevato o Corsa il passo resta < 4 px,
        // quindi non si può saltare una cella solida (16 px) né un'auto.
        const dist = sp * dt, steps = Math.max(1, Math.ceil(dist / 4));
        const sx = ax.x * dist / steps, sy = ax.y * dist / steps;
        for (let s = 0; s < steps; s++) {
          if (sx && game.canStand(this.x + sx, this.y, this.w, this.h, this)) { this.x += sx; moved = true; }
          else if (sx && !blocked.includes('x')) blocked.push('x');
          if (sy && game.canStand(this.x, this.y + sy, this.w, this.h, this)) { this.y += sy; moved = true; }
          else if (sy && !blocked.includes('y')) blocked.push('y');
        }
        if (game.dbg) game.dbg.blocked = moved ? '' : ('collision:' + blocked.join(','));
        // Corsa e camminata hanno animazioni diverse; la direzione resta
        // sempre quella dell'ultimo input, anche se il movimento è bloccato.
        this.mode = CL.input.isDown('run') ? 'run' : 'walk';
        // L'animazione avanza in base allo spazio REALMENTE percorso: quando
        // un muro blocca il passo il personaggio non "scivola" sul posto.
        const walked = Math.hypot(this.x - x0, this.y - y0);
        this.anim += walked / 6.2;
        this.frame = posedFrame(Math.floor(this.anim));
        if (!moved) {
          // Fermo davanti a un ostacolo: respiroidtà, ultima direzione conservata.
          this.idleT += dt;
          this.frame = Math.floor(this.idleT * 1.5) % 2;
        } else {
          this.idleT = 0;
          this.stepT -= dt;
          if (this.stepT <= 0) { CL.audio.sfx('step'); this.stepT = this.mode === 'run' ? .22 : .32; }
          CL.state.stats.steps += walked / 16;
        }
        game.checkPortals(this);
      } else {
        // Inattività: respiro a due fotogrammi, ultima direzione conservata.
        this.mode = 'idle';
        this.idleT += dt;
        this.frame = Math.floor(this.idleT * 1.5) % 2;
        this.anim = 0;
        if (game.dbg && game.dbg.blocked !== 'modal') game.dbg.blocked = '';
      }
    }
    draw(ctx) {
      if (this.vehicle) return;
      const night = CL.systems.time.isNight();
      // y e' il CENTRO della hitbox (canStand usa y-h/2 .. y+h/2): i piedi
      // devono coincidere con il fondo della hitbox, non 10 px sopra.
      const footY = Math.round(this.y + this.h / 2 + this.offsetY) - 1;
      const lift = this.moving ? Math.abs(Math.sin(this.anim * Math.PI / 2)) : 0;
      const bob = this.moving ? lift * .6
        : (Math.floor(this.idleT * 1.5) % 2 ? .4 : 0);
      drawContactShadow(ctx, this.x, footY, .55, lift);
      drawFacing(ctx, this.look, this.dir, this.prevDir, this.turnT, this.frame,
        this.mode, this.x, footY, night, bob);
    }
    interact() { this.game.interactNear(this); }
  }
  CL.Player = Player;

  /* -------------------------------------------------------------------- PNG */
  function hashTick(v) { return (Math.floor(v * 2) & 1) === 0; }

  class NPC extends Entity {
    constructor(game, id, def) {
      super(game, def.x * T + 8, def.y * T + 10);
      this.id = id; this.name = def.name; this.look = def.look; this.role = def.role;
      this.props = def.props || null;
      this.homeX = this.x; this.homeY = this.y;
      // Fasi derivate dall'id: stessa ora di gioco => stessa posa e stessa
      // sequenza di decisioni, senza rand() fra sessioni diverse.
      this.wanderT = unitHash(id, 'wander') * 4;
      this.tx = this.x; this.ty = this.y;
      this.bob = unitHash(id, 'bob') * 6;
      this.planT = unitHash(id, 'plan') * 3;
      this.prevDir = null; this.turnT = 0; this._walked = 0;
    }
    _dynamicBlocked() {
      const set = new Set(), map = this.game.map;
      if (!map) return set;
      const add = (e) => {
        if (!e || e === this || e.alive === false) return;
        const tx = Math.floor(e.x / T), ty = Math.floor(e.y / T);
        if (tx >= 0 && ty >= 0 && tx < map.w && ty < map.h) set.add(ty * map.w + tx);
      };
      add(this.game.player);
      const ents = this.game.entities || [];
      for (let i = 0; i < ents.length; i++) if (ents[i] !== this) add(ents[i]);
      return set;
    }

    _nearReserved(x, y) {
      const map = this.game.map;
      if (!map) return false;
      const portals = map.portals || [];
      for (const p of portals) {
        if (x > p.x - 10 && x < p.x + (p.w || 16) + 10 && y > p.y - 10 && y < p.y + (p.h || 16) + 10) return true;
      }
      const pois = map.pois || [];
      for (const poi of pois) {
        if (poi.type !== 'door') continue;
        const px = poi.x || 0, py = poi.y || 0;
        if (U.dist(x, y, px, py) < 26) return true;
      }
      return false;
    }

    // Un PNG che occupa l'ingresso si scosta: le collisioni restano reali,
    // ma le porte non vengono mai chiuse da un corpo fermo davanti alla soglia.
    _yieldToPlayer() {
      const pl = this.game.player;
      if (!pl || !pl.alive || pl.vehicle) return false;
      const d = U.dist(this.x, this.y, pl.x, pl.y);
      if (d > 18 || d < .01) return false;
      const ax = (this.x - pl.x) / d, ay = (this.y - pl.y) / d;
      const dirs = [[ax, ay], [-ay, ax], [ay, -ax]];
      for (const [dx, dy] of dirs) for (const step of [4, 8, 12]) {
        const nx = this.x + dx * step, ny = this.y + dy * step;
        if (!this.game.canStand(nx, ny, this.w, this.h, this)) continue;
        if (this._nearReserved(nx, ny) && !this._nearReserved(this.x, this.y)) continue;
        this.x = nx; this.y = ny; return true;
      }
      return false;
    }

    _replan(hour) {
      this.path = []; this.pathIdx = 0;
      if (this.waitT > 0) return;
      const map = this.game.map;
      if (!map || !CL.path) { this.tx = this.homeX; this.ty = this.homeY; return; }
      const h = Number.isFinite(hour) ? hour : 12;
      let goal = CL.routines ? CL.routines.goalFor(this, map, h) : null;
      if (!goal) {
        // fallback: vagare locale, compatibile con mappe senza routine.
        // Gli offset vengono dall'hash dell'id e dell'ora, non da rand().
        const gx = this.homeX + (Math.floor(unitHash(this.id + '|' + Math.floor(h), 'gx') * 5) - 2) * T;
        const gy = this.homeY + (Math.floor(unitHash(this.id + '|' + Math.floor(h), 'gy') * 3) - 1) * T;
        goal = CL.path.nearestTile(map, gx, gy, { w: this.w, h: this.h, maxR: 6 });
      }
      if (!goal) { this.tx = this.homeX; this.ty = this.homeY; return; }
      this.goal = goal;
      this.path = CL.path.route(map, { x: this.x, y: this.y }, goal, {
        w: this.w, h: this.h, blocked: this._dynamicBlocked(),
        allowPartial: true, maxNodes: 1400
      }) || [];
      this.pathIdx = 0;
      // Stessa ora + stesso obiettivo => stessi timer di ripianificazione.
      const key = this.id + '|' + Math.floor(h) + '|' + goal.tx + ',' + goal.ty;
      this.planT = 3.2 + unitHash(key, 'plan') * 3.3;
      if (!this.path.length) this.waitT = .6 + unitHash(key, 'wait') * .8;
    }

    update(dt) {
      this.anim += dt * 1.4;
      this.moving = false;
      this.turnT = Math.max(0, (this.turnT || 0) - dt);
      this.bob += dt;
      this.offsetY = Math.sin(this.bob * 1.6) * .8;
      this._stuckT = this._stuckT || 0;
      this._lastPos = this._lastPos || { x: this.x, y: this.y };
      this.planT = (this.planT == null ? unitHash(this.id, 'plan') * 3 : this.planT - dt);
      this.waitT = Math.max(0, (this.waitT || 0) - dt);
      this._yieldToPlayer();
      this._replans = this._replans || 0;
      const hour = CL.systems && CL.systems.time ? CL.systems.time.hour() : 12;
      const night = CL.systems && CL.systems.time ? CL.systems.time.isNight() : false;
      if (this.planT <= 0 || (!this.path || this.pathIdx >= this.path.length)) this._replan(night ? 2 : hour);

      // waypoint corrente del percorso A*
      if (this.path && this.pathIdx < this.path.length) {
        const wp = this.path[this.pathIdx];
        this.tx = wp.x; this.ty = wp.y;
        if (U.dist(this.x, this.y, wp.x, wp.y) < 5) {
          this.pathIdx++;
          if (this.pathIdx >= this.path.length) {
            this.path = [];
            this.waitT = 1.2 + unitHash(this.id + '|' + Math.floor(hour) + '|arrive', 'wait') * 2.2;
            this.planT = 0.4;
          }
        }
      }

      if (U.dist(this.x, this.y, this.tx, this.ty) > 2) {
        const stepX0 = this.x, stepY0 = this.y;
        const a = Math.atan2(this.ty - this.y, this.tx - this.x);
        const sp = 17;
        const stepX = Math.cos(a) * sp * dt, stepY = Math.sin(a) * sp * dt;
        let moved = false;
        const tryMove = (nx, ny) => {
          if (!this.game.canStand(nx, ny, this.w, this.h, this)) return false;
          if (this._nearReserved(nx, ny) && !this._nearReserved(this.x, this.y)) return false;
          this.x = nx; this.y = ny; return true;
        };
        if (tryMove(this.x + stepX, this.y + stepY)) moved = true;
        else if (tryMove(this.x + stepX, this.y)) moved = true;
        else if (tryMove(this.x, this.y + stepY)) moved = true;
        else {
          const pa = a + Math.PI / 2 * (hashTick(this.bob) ? 1 : -1);
          moved = tryMove(this.x + Math.cos(pa) * sp * dt, this.y + Math.sin(pa) * sp * dt);
        }
        if (moved) {
          this.moving = true;
          const next = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a))
            ? (Math.cos(a) < 0 ? 'left' : 'right')
            : (Math.sin(a) < 0 ? 'up' : 'down');
          if (next !== this.dir) { this.prevDir = this.dir; this.dir = next; this.turnT = TURN_TIME; }
          // Il passo segue la distanza reale percorsa: più leggibile e non
          // legato al frame rate, senza toccare la velocità (sp = 17).
          this._walked += Math.hypot(this.x - stepX0, this.y - stepY0);
          this.frame = posedFrame(Math.floor(this._walked / 6));
        } else {
          this.frame = 0;
          this._stuckT += dt;
          if (this._stuckT > 1) {
            this._stuckT = 0; this._replans++;
            this.waitT = 0;
            if (this._replans >= 3) {
              const cand = this.game.safePoint ? this.game.safePoint(this.game.map, this.homeX, this.homeY, this.w, this.h) : { x: this.homeX, y: this.homeY };
              if (cand) { this.x = cand.x; this.y = cand.y; }
              this.tx = this.homeX; this.ty = this.homeY; this._replans = 0;
            }
            this.planT = 0;
          }
        }
      } else { this.frame = 0; this._stuckT = 0; }
      if (U.dist(this.x, this.y, this._lastPos.x, this._lastPos.y) > 0.5) { this._stuckT = 0; this._lastPos.x = this.x; this._lastPos.y = this.y; }
    }
    draw(ctx) {
      // Stesso ancoraggio del giocatore: piedi sul fondo della hitbox.
      const footY = Math.round(this.y + this.h / 2 + this.offsetY) - 1;
      const lift = this.moving ? Math.abs(Math.sin(this._walked ? this._walked / 6 * Math.PI / 2 : this.anim)) : 0;
      const bob = this.moving ? lift * .5 : (Math.floor(this.anim * 1.5) % 2 ? .4 : 0);
      const night = this.game.map && this.game.map.zone === 'interno' ? false
        : !!(CL.systems && CL.systems.time && CL.systems.time.isNight());
      drawContactShadow(ctx, this.x, footY, .48, lift);
      drawFacing(ctx, this.look, this.dir, this.prevDir, this.turnT, this.frame,
        this.moving ? 'walk' : 'idle', this.x, footY, night, bob);
      drawProps(ctx, this, this.x, footY);
    }
    interact(player) {
      CL.systems.relations.talk(this.id);
      CL.audio.sfx('talk');
      this.game.dialogue(this.id);
    }
  }
  CL.NPC = NPC;

  /* ---------------------------------------------------------------- VEICOLI */
  const VEHICLE_SPEED = { bike: 138, scooter: 186, car: 232, taxi: 220, van: 190, bus: 150 };
  // Impronta reale: un'auto vista dal davanti e' stretta e lunga, non un
  // rettangolo 22x10 ruotato. Usata da motore, pathfinding e test.
  CL.vehicleFootprint = (type, dir) => {
    const v = dir === 'up' || dir === 'down';
    if (type === 'car' || type === 'taxi' || type === 'van') return v ? { w: 12, h: 22 } : { w: 22, h: 12 };
    if (type === 'bus') return v ? { w: 12, h: 26 } : { w: 26, h: 12 };
    return v ? { w: 10, h: 16 } : { w: 16, h: 10 };
  };
  // Senso di marcia a destra: chi va a destra usa la meta inferiore della
  // carreggiata, chi torna indietro la superiore (e viceversa in verticale).
  CL.laneOffset = dir => ({
    right: { x: 0, y: 4 }, left: { x: 0, y: -4 },
    down: { x: -4, y: 0 }, up: { x: 4, y: 0 }
  })[dir] || { x: 0, y: 0 };
  const OPPOSITE = { left: 'right', right: 'left', up: 'down', down: 'up' };
  class Vehicle extends Entity {
    constructor(game, type, x, y, dir) {
      super(game, x, y);
      this.type = type; this.dir = dir || 'down';
      const fp = CL.vehicleFootprint(type, this.dir);
      this.w = fp.w; this.h = fp.h;
      this.lane = CL.laneOffset(this.dir);
      this.speed = VEHICLE_SPEED[type] || 130;
      this.fuel = 100; this.mounted = false; this.homeX = x; this.homeY = y;
      this._turnCooldown = 0;
    }
    _face(dir) {
      const old = this.lane, next = CL.laneOffset(dir);
      const nx = this.x + next.x - old.x, ny = this.y + next.y - old.y;
      const fp = CL.vehicleFootprint(this.type, dir);
      if (!this.game.canStand(nx, ny, fp.w, fp.h, this)) return false;
      this.dir = dir; this.lane = next; this.x = nx; this.y = ny;
      this.w = fp.w; this.h = fp.h;
      return true;
    }
    update(dt) {
      if (this.ambient && !this.mounted) {
        this._turnCooldown = Math.max(0, (this._turnCooldown || 0) - dt);
        const ax = this.dir === 'left' ? -1 : this.dir === 'right' ? 1 : 0;
        const ay = this.dir === 'up' ? -1 : this.dir === 'down' ? 1 : 0;
        const vd = this.speed * dt, vn = Math.max(1, Math.ceil(vd / 4));
        const nx = this.x + ax * vd, ny = this.y + ay * vd;
        const tileAt = (px, py) => CL.maps.tile(this.game.map, Math.floor(px / T), Math.floor(py / T));
        const usable = (px, py) => tileAt(px, py) === 'r' &&
          this.game.canStand(px, py, this.w, this.h, this) && !CL.maps.portalAt(this.game.map, px, py);
        // In prossimita' di un incrocio, svolta a destra quando la corsia
        // perpendicolare e' libera: non asymptotes a muri invisibili.
        if (this._turnCooldown <= 0) {
          const ahead = ax ? nx + ax * T : ny + ay * T;
          const crossRoad = ax ? tileAt(this.x, ahead) === 'r' : tileAt(ahead, this.y) === 'r';
          if (crossRoad) {
            const right = { right: 'down', down: 'left', left: 'up', up: 'right' }[this.dir];
            const bx = ax ? nx + ax * T : this.x, by = ay ? ny + ay * T : this.y;
            const lo = CL.laneOffset(right);
            if (usable(bx + lo.x, by + lo.y) &&
                (this.x % T < 3 || this.y % T < 3)) {
              this._face(right); this._turnCooldown = 2.5;
              return;
            }
          }
        }
        if (!usable(nx, ny)) {
          // Fine corsia: inversione a U, ma solo se l'impronta ruotata è libera.
          // Cambiare dir senza aggiornare lane/w/h lascerebbe il veicolo fuori corsia.
          const back = OPPOSITE[this.dir];
          this._face(back);
          this._turnCooldown = .6;
        } else {
          // Avanzamento a sottopassi: la collisione non può essere saltata.
          const sx = ax * vd / vn, sy = ay * vd / vn;
          for (let i = 0; i < vn; i++) {
            if (ax && usable(this.x + sx, this.y)) this.x += sx; else break;
            if (ay && usable(this.x, this.y + sy)) this.y += sy; else break;
          }
          this.offsetY = Math.sin(CL.state.time.total * .02) * .4;
        }
        return;
      }
      if (!this.mounted) { this.offsetY = Math.sin(CL.state.time.total * .02) * .4; return; }
      const ax = CL.input.axis();
      this.moving = !!(ax.x || ax.y);
      if (this.moving) {
        const next = Math.abs(ax.x) > Math.abs(ax.y) ? (ax.x < 0 ? 'left' : 'right')
                                                     : (ax.y < 0 ? 'up' : 'down');
        // Rouotazione in loco: impronta e corsia devono sempre seguire la
        // direzione, altrimenti l'auto viaggia con il lato sbagliato del muro.
        if (next !== this.dir) {
          const fp = CL.vehicleFootprint(this.type, next);
          if (this.game.canStand(this.x, this.y, fp.w, fp.h, this)) {
            this.dir = next; this.w = fp.w; this.h = fp.h; this.lane = CL.laneOffset(next);
          }
        }
        const vd = this.speed * dt, vn = Math.max(1, Math.ceil(vd / 4));
        const sx = ax.x * vd / vn, sy = ay * vd / vn;
        for (let i = 0; i < vn; i++) {
          if (sx && this.game.canStand(this.x + sx, this.y, this.w, this.h, this)) this.x += sx;
          if (sy && this.game.canStand(this.x, this.y + sy, this.w, this.h, this)) this.y += sy;
        }
        this.game.checkPortals(this);
        CL.state.stats.steps += dt * .2;
      }
    }
    draw(ctx) {
      const img = ART.vehicle(this.type, this.dir);
      const vertical = this.dir === 'up' || this.dir === 'down';
      const shadowW = Math.max(5, Math.round(this.w * .45));
      ctx.fillStyle = 'rgba(0,0,0,.2)';
      ctx.beginPath();
      ctx.ellipse(Math.round(this.x), Math.round(this.y + 2), shadowW, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // L'ancora resta il centro dell'impronta a terra: l'immagine sale solo
      // in altezza, senza spostare collisioni o portali.
      const dx = Math.round(this.x - img.width / 2);
      const dy = Math.round(this.y - img.height + (vertical ? 1 : -2) + this.offsetY);
      ctx.drawImage(img, dx, dy);
      if (this.mounted) {
        const look = CL.state.profile.look;
        ctx.drawImage(ART.character(look, this.dir, 0, 'idle'),
          Math.round(this.x - img.width / 2), Math.round(this.y - img.height - 6 + this.offsetY));
      }
    }
    interact(player) {
      if (this.ambient && !this.mounted) { CL.ui.toast('Il traffico cittadino non si ferma.', 'info'); return; }
      if (this.mounted) {
        // Dismount validato: cerca un punto libero vicino all'auto, non un
        // offset fisso che può finire dentro un muro, un NPC o un portale.
        const map = this.game.map;
        const tryOff = [[16,6],[-16,6],[16,-6],[-16,-6],[0,18],[0,-18],[24,0],[-24,0]];
        let spot = null;
        for (const [dx,dy] of tryOff) {
          const px = this.x + dx, py = this.y + dy;
          if (this.game.canStand(px, py, player.w, player.h, player) &&
              !CL.maps.portalAt(map, px, py)) { spot = {x:px,y:py}; break; }
        }
        if (!spot) { CL.ui.toast('Non c’è spazio per scendere qui.', 'bad'); return; }
        this.mounted = false; player.vehicle = null;
        player.x = spot.x; player.y = spot.y;
        CL.audio.sfx('door'); CL.ui.toast('Sei sceso dal ' + this.label(), 'info');
      } else {
        if (CL.state.needs.energy < 8) { CL.ui.toast('Sei troppo stanco per guidare.', 'bad'); return; }
        this.mounted = true; player.vehicle = this;
        CL.audio.sfx('door'); CL.ui.toast('Ora guidi il ' + this.label() + '. Premi E per scendere.', 'info');
      }
    }
    label() { return ({ bike: 'bicicletta', scooter: 'Vespa', car: 'utilitaria', taxi: 'taxi', van: 'furgone', bus: 'battello' })[this.type] || 'veicolo'; }
  }
  CL.Vehicle = Vehicle;

  /* --------------------------------------------------------------- CREATURE */
  class Creature extends Entity {
    constructor(game, def) {
      super(game, def.x, def.y);
      this.id = def.id; this.def = D.creatures[def.id];
      this.w = 12; this.h = 10;
      this.bob = def.bob || 0;
      this.wanderT = def.wander || 0;
      this.tx = this.x; this.ty = this.y;
      this.calm = 0;
    }
    update(dt) {
      this.bob += dt * 3;
      this.anim = Math.floor(this.bob / .7) % 2;
      this.offsetY = Math.sin(this.bob) * 1.3;
      this.wanderT -= dt;
      if (this.wanderT <= 0) {
        this.wanderT = U.rand(2.5, 6);
        const nx = this.x + U.randInt(-2, 2) * 12, ny = this.y + U.randInt(-1, 1) * 12;
        if (this.game.canStand(nx, ny, this.w, this.h, this)) { this.tx = nx; this.ty = ny; }
      }
      if (U.dist(this.x, this.y, this.tx, this.ty) > 2) {
        const a = Math.atan2(this.ty - this.y, this.tx - this.x);
        const nx = this.x + Math.cos(a) * 10 * dt, ny = this.y + Math.sin(a) * 10 * dt;
        if (this.game.canStand(nx, ny, this.w, this.h, this)) { this.x = nx; this.y = ny; }
      }
    }
    draw(ctx) {
      const img = ART.creature(this.id, this.anim);
      ctx.drawImage(img, Math.round(this.x - 12), Math.round(this.y - 18 + this.offsetY));
      const p = this.game.player;
      if (p && U.dist(p.x, p.y, this.x, this.y) < 34) {
        const t = CL.systems.time.total;
        ctx.globalAlpha = .55 + Math.sin(t * .15) * .3;
        CL.gfx.text(ctx, '!', this.x, this.y - 26, { color: '#e9b84a', size: 10, bold: true, align: 'center' });
        ctx.globalAlpha = 1;
      }
    }
    interact(player) {
      const ok = CL.systems.creatures.tryCatch(this);
      if (ok) this.game.removeEntity(this);
    }
  }
  CL.Creature = Creature;

  /* -------------------------------------------------------------- PARTICELLE */
  class Particles {
    constructor() { this.list = []; }
    emit(x, y, color, n, spd) {
      n = n || 8;
      for (let i = 0; i < n; i++) {
        const a = U.rand(0, Math.PI * 2), s = U.rand(.3, spd || 1.4);
        this.list.push({ x, y, vx: Math.cos(a) * s * 30, vy: Math.sin(a) * s * 30 - 18, life: U.rand(.4, .9), max: .9, color });
      }
    }
    rain(x, y, speed) { this.list.push({ x, y, vx: -speed * 12, vy: speed * 95, life: .6, max: .6, color: '#a6d9dc' }); }
    update(dt) {
      for (let i = this.list.length - 1; i >= 0; i--) {
        const p = this.list[i]; p.life -= dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.life <= 0) this.list.splice(i, 1);
      }
    }
    draw(ctx) {
      for (const p of this.list) {
        ctx.globalAlpha = U.clamp(p.life / p.max, 0, 1);
        CL.gfx.px(ctx, p.x, p.y, p.color === '#a6d9dc' ? 1 : 2, p.color === '#a6d9dc' ? 5 : 2, p.color);
      }
      ctx.globalAlpha = 1;
    }
    clear() { this.list.length = 0; }
  }
  CL.Particles = Particles;
})(window);
