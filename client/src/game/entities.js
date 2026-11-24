/* CAMPANIA LIFE — entities.js
 * Entità di gioco: giocatore, PNG, veicoli, creature, particelle.
 */
(function (w) {
  'use strict';
  const CL = w.CL, U = CL.util, D = CL.data, ART = CL.art, T = CL.TILE;

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
    }
    refreshLook() {
      const p = CL.state.profile; this.look = Object.assign({}, p.look);
      if (CL.state.outfit === 'divisa') this.look.shirt = '#e9b84a';
      if (CL.state.outfit === 'cappello') this.look.hair = '#c8a96a';
    }
    update(dt, opts) {
      this.refreshLook();
      const game = this.game;
      if (this.vehicle) { this.anim += dt * 6; return; }
      if (opts && opts.modal) { this.moving = false; if (game.dbg) game.dbg.blocked = 'modal'; return; }
      const ax = CL.input.axis();
      this.moving = !!(ax.x || ax.y);
      let sp = this.speed * CL.systems.needs.speedFactor();
      if (CL.input.isDown('run')) sp *= 1.3;
      if (ax.x || ax.y) {
        if (Math.abs(ax.x) > Math.abs(ax.y)) this.dir = ax.x < 0 ? 'left' : 'right';
        else this.dir = ax.y < 0 ? 'up' : 'down';
        const nx = this.x + ax.x * sp * dt, ny = this.y + ax.y * sp * dt;
        let moved = false, blocked = [];
        if (game.canMove(nx, this.y, this.w, this.h)) { this.x = nx; moved = true; } else if (ax.x) blocked.push('x');
        if (game.canMove(this.x, ny, this.w, this.h)) { this.y = ny; moved = true; } else if (ax.y) blocked.push('y');
        if (game.dbg) game.dbg.blocked = moved ? '' : ('collision:' + blocked.join(','));
        this.anim += dt * (sp / 22);
        this.frame = Math.floor(this.anim) % 4;
        this.stepT -= dt;
        if (this.stepT <= 0) { CL.audio.sfx('step'); this.stepT = .34; }
        CL.state.stats.steps += dt * sp / 16;
        game.checkPortals(this);
      } else { this.frame = 0; this.anim = 0; if (game.dbg && game.dbg.blocked !== 'modal') game.dbg.blocked = ''; }
    }
    draw(ctx) {
      if (this.vehicle) return;
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      ctx.beginPath(); ctx.ellipse(Math.round(this.x), Math.round(this.y + 2), 6, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      const img = ART.character(this.look, this.dir, this.frame);
      ctx.drawImage(img, Math.round(this.x - 8), Math.round(this.y - 20 + this.offsetY));
      if (CL.systems.time.isNight()) {
        ctx.fillStyle = 'rgba(10,18,36,.20)';
        ctx.fillRect(Math.round(this.x - 7), Math.round(this.y - 18), 14, 18);
      }
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
      this.homeX = this.x; this.homeY = this.y;
      this.wanderT = U.rand(0, 4); this.tx = this.x; this.ty = this.y;
      this.bob = U.rand(0, 6);
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

    _replan(hour) {
      this.path = []; this.pathIdx = 0;
      if (this.waitT > 0) return;
      const map = this.game.map;
      if (!map || !CL.path) { this.tx = this.homeX; this.ty = this.homeY; return; }
      let goal = CL.routines ? CL.routines.goalFor(this, map, hour) : null;
      if (!goal) {
        // fallback: vecchio vagare locale, compatibile con mappe senza routine
        const gx = this.homeX + U.randInt(-2, 2) * T, gy = this.homeY + U.randInt(-1, 1) * T;
        goal = CL.path.nearestTile(map, gx, gy, { w: this.w, h: this.h, maxR: 6 });
      }
      if (!goal) { this.tx = this.homeX; this.ty = this.homeY; return; }
      this.goal = goal;
      this.path = CL.path.route(map, { x: this.x, y: this.y }, goal, {
        w: this.w, h: this.h, blocked: this._dynamicBlocked(),
        allowPartial: true, maxNodes: 1400
      }) || [];
      this.pathIdx = 0;
      this.planT = U.rand(3.2, 6.5);
      if (!this.path.length) this.waitT = U.rand(.6, 1.4);
    }

    update(dt) {
      this.anim += dt * 1.4;
      this.bob += dt;
      this.offsetY = Math.sin(this.bob * 1.6) * .8;
      this._stuckT = this._stuckT || 0;
      this._lastPos = this._lastPos || { x: this.x, y: this.y };
      this.planT = (this.planT == null ? U.rand(0, 3) : this.planT - dt);
      this.waitT = Math.max(0, (this.waitT || 0) - dt);
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
          if (this.pathIdx >= this.path.length) { this.path = []; this.waitT = U.rand(1.2, 3.4); this.planT = 0.4; }
        }
      }

      if (U.dist(this.x, this.y, this.tx, this.ty) > 2) {
        const a = Math.atan2(this.ty - this.y, this.tx - this.x);
        const sp = 17;
        const stepX = Math.cos(a) * sp * dt, stepY = Math.sin(a) * sp * dt;
        let moved = false;
        const tryMove = (nx, ny) => {
          if (!this.game.canMove(nx, ny, this.w, this.h)) return false;
          const pl = this.game.player;
          if (pl && U.dist(nx, ny, pl.x, pl.y) < 14) return false;
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
          this.dir = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) < 0 ? 'left' : 'right') : (Math.sin(a) < 0 ? 'up' : 'down');
          this.frame = Math.floor(this.anim * 2) % 4;
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
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.beginPath(); ctx.ellipse(Math.round(this.x), Math.round(this.y + 2), 6, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      const img = ART.character(this.look, this.dir, this.frame);
      ctx.drawImage(img, Math.round(this.x - 8), Math.round(this.y - 20 + this.offsetY));
    }
    interact(player) {
      CL.systems.relations.talk(this.id);
      CL.audio.sfx('talk');
      this.game.dialogue(this.id);
    }
  }
  CL.NPC = NPC;

  /* ---------------------------------------------------------------- VEICOLI */
  const VEHICLE_SPEED = { bike: 138, scooter: 186, car: 232, bus: 150 };
  class Vehicle extends Entity {
    constructor(game, type, x, y, dir) {
      super(game, x, y);
      this.type = type; this.dir = dir || 'down';
      this.w = type === 'car' ? 22 : 16; this.h = 10;
      this.speed = VEHICLE_SPEED[type] || 130;
      this.fuel = 100; this.mounted = false; this.homeX = x; this.homeY = y;
    }
    update(dt) {
      if (this.ambient && !this.mounted) {
        const ax = this.dir === 'left' ? -1 : this.dir === 'right' ? 1 : 0;
        const ay = this.dir === 'up' ? -1 : this.dir === 'down' ? 1 : 0;
        const nx = this.x + ax * this.speed * dt, ny = this.y + ay * this.speed * dt;
        const blocked = !this.game.canMove(nx, ny, this.w, this.h) || CL.maps.portalAt(this.game.map, nx, ny);
        if (blocked) {
          this.dir = this.dir === 'left' ? 'right' : this.dir === 'right' ? 'left' : this.dir === 'up' ? 'down' : 'up';
        } else {
          this.x = nx; this.y = ny;
          this.offsetY = Math.sin(CL.state.time.total * .02) * .4;
        }
        return;
      }
      if (!this.mounted) { this.offsetY = Math.sin(CL.state.time.total * .02) * .4; return; }
      const ax = CL.input.axis();
      this.moving = !!(ax.x || ax.y);
      if (this.moving) {
        if (Math.abs(ax.x) > Math.abs(ax.y)) this.dir = ax.x < 0 ? 'left' : 'right';
        else this.dir = ax.y < 0 ? 'up' : 'down';
        const nx = this.x + ax.x * this.speed * dt, ny = this.y + ax.y * this.speed * dt;
        if (this.game.canMove(nx, this.y, this.w, this.h)) this.x = nx;
        if (this.game.canMove(this.x, ny, this.w, this.h)) this.y = ny;
        this.game.checkPortals(this);
        CL.state.stats.steps += dt * .2;
      }
    }
    draw(ctx) {
      const img = ART.vehicle(this.type, this.dir);
      const dx = this.type === 'car' ? 15 : this.type === 'bus' ? 17 : 12;
      ctx.drawImage(img, Math.round(this.x - dx), Math.round(this.y - 14 + this.offsetY));
      if (this.mounted) {
        const look = CL.state.profile.look;
        ctx.drawImage(ART.character(look, this.dir, 0), Math.round(this.x - 8), Math.round(this.y - 26 + this.offsetY));
      }
    }
    interact(player) {
      if (this.ambient && !this.mounted) { CL.ui.toast('Il traffico cittadino non si ferma.', 'info'); return; }
      if (this.mounted) {
        this.mounted = false; player.vehicle = null;
        player.x = this.x + 16; player.y = this.y + 6;
        CL.audio.sfx('door'); CL.ui.toast('Sei sceso dal ' + this.label(), 'info');
      } else {
        if (CL.state.needs.energy < 8) { CL.ui.toast('Sei troppo stanco per guidare.', 'bad'); return; }
        this.mounted = true; player.vehicle = this;
        CL.audio.sfx('door'); CL.ui.toast('Ora guidi il ' + this.label() + '. Premi E per scendere.', 'info');
      }
    }
    label() { return ({ bike: 'bicicletta', scooter: 'Vespa', car: 'utilitaria', bus: 'battello' })[this.type] || 'veicolo'; }
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
        if (this.game.canMove(nx, ny, this.w, this.h)) { this.tx = nx; this.ty = ny; }
      }
      if (U.dist(this.x, this.y, this.tx, this.ty) > 2) {
        const a = Math.atan2(this.ty - this.y, this.tx - this.x);
        const nx = this.x + Math.cos(a) * 10 * dt, ny = this.y + Math.sin(a) * 10 * dt;
        if (this.game.canMove(nx, ny, this.w, this.h)) { this.x = nx; this.y = ny; }
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
