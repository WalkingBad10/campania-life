/* CAMPANIA LIFE — pathfinding.js
 * A* leggero su griglia di tile per PNG/creature. La griglia statica è cached per mappa;
 * gli ostacoli dinamici (giocatore/PNG/veicoli) sono gestiti dal movimento locale delle entità.
 */
(function (w) {
  'use strict';
  const CL = w.CL, MAPS = CL.maps, T = CL.TILE;
  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];

  class MinHeap {
    constructor() { this.items = []; }
    get size() { return this.items.length; }
    push(idx, pri) {
      const a = this.items;
      a.push({ idx, pri });
      let i = a.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (a[p].pri <= a[i].pri) break;
        const t = a[p]; a[p] = a[i]; a[i] = t; i = p;
      }
    }
    pop() {
      const a = this.items;
      if (!a.length) return null;
      const top = a[0], last = a.pop();
      if (a.length) {
        a[0] = last;
        let i = 0;
        for (;;) {
          const l = i * 2 + 1, r = l + 1;
          let m = i;
          if (l < a.length && a[l].pri < a[m].pri) m = l;
          if (r < a.length && a[r].pri < a[m].pri) m = r;
          if (m === i) break;
          const t = a[m]; a[m] = a[i]; a[i] = t; i = m;
        }
      }
      return top;
    }
  }

  function footprint(opts) {
    return {
      w: Math.max(6, Math.min(28, (opts && opts.w) || 12)),
      h: Math.max(6, Math.min(28, (opts && opts.h) || 10))
    };
  }

  function tileCenter(tx, ty) { return { x: tx * T + T / 2, y: ty * T + T / 2 }; }
  function tileOf(x, y) { return { tx: Math.floor(x / T), ty: Math.floor(y / T) }; }

  function blockedAt(map, tx, ty, fw, fh) {
    if (tx < 0 || ty < 0 || tx >= map.w || ty >= map.h) return true;
    const x = tx * T + T / 2, y = ty * T + T / 2;
    return MAPS.solidAt(map, x - fw / 2, y - fh / 2) ||
      MAPS.solidAt(map, x + fw / 2, y - fh / 2) ||
      MAPS.solidAt(map, x - fw / 2, y + fh / 2) ||
      MAPS.solidAt(map, x + fw / 2, y + fh / 2);
  }

  const PATH = CL.path = {
    grids: new Map(),
    stats: { builds: 0, searches: 0, nodes: 0, smoothed: 0 },

    buildGrid(map, opts) {
      const fp = footprint(opts);
      const avoidPortals = !(opts && opts.avoidPortals === false);
      const key = map.id + '|' + fp.w + 'x' + fp.h + '|' + (avoidPortals ? 'p' : '-');
      if (this.grids.has(key)) return this.grids.get(key);
      const W = map.w, H = map.h, blocked = new Uint8Array(W * H);
      for (let ty = 0; ty < H; ty++) {
        for (let tx = 0; tx < W; tx++) {
          let b = blockedAt(map, tx, ty, fp.w, fp.h) || MAPS.tile(map, tx, ty) === 'D';
          if (!b && avoidPortals) {
            for (const p of (map.portals || [])) {
              const x0 = Math.floor(p.x / T), x1 = Math.floor((p.x + p.w - 0.01) / T);
              const y0 = Math.floor(p.y / T), y1 = Math.floor((p.y + p.h - 0.01) / T);
              if (tx >= x0 && tx <= x1 && ty >= y0 && ty <= y1) { b = true; break; }
            }
          }
          blocked[ty * W + tx] = b ? 1 : 0;
        }
      }
      const grid = {
        key, mapId: map.id, w: W, h: H, fw: fp.w, fh: fp.h, blocked,
        g: new Float32Array(W * H), f: new Float32Array(W * H),
        came: new Int32Array(W * H), closed: new Uint8Array(W * H)
      };
      this.grids.set(key, grid);
      this.stats.builds++;
      return grid;
    },

    clearCache(mapId) {
      if (!mapId) this.grids.clear();
      else for (const key of Array.from(this.grids.keys())) if (key.startsWith(mapId + '|')) this.grids.delete(key);
    },

    nearestTile(map, x, y, opts) {
      const grid = this.buildGrid(map, opts);
      const p = tileOf(x, y);
      const inb = (tx, ty) => tx >= 0 && ty >= 0 && tx < grid.w && ty < grid.h;
      const free = (tx, ty) => inb(tx, ty) && !grid.blocked[ty * grid.w + tx];
      if (free(p.tx, p.ty)) return { tx: p.tx, ty: p.ty, ...tileCenter(p.tx, p.ty) };
      const maxR = (opts && opts.maxR) || 8;
      let best = null, bestD = Infinity;
      for (let r = 1; r <= maxR; r++) {
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const tx = p.tx + dx, ty = p.ty + dy;
          if (!free(tx, ty)) continue;
          const d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; best = { tx, ty }; }
        }
        if (best) break;
      }
      if (!best) {
        const sp = tileOf(map.spawn.x, map.spawn.y);
        if (free(sp.tx, sp.ty)) best = sp;
      }
      return best ? { ...best, ...tileCenter(best.tx, best.ty) } : null;
    },

    _lineClear(grid, x0, y0, x1, y1, extra) {
      let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx - dy, x = x0, y = y0, guard = 0;
      while (guard++ < 256) {
        if (grid.blocked[y * grid.w + x] || (extra && extra(y * grid.w + x))) return false;
        if (x === x1 && y === y1) return true;
        const e2 = 2 * err;
        const stepX = e2 > -dy, stepY = e2 < dx;
        if (stepX && stepY && (grid.blocked[y * grid.w + (x + sx)] || grid.blocked[(y + sy) * grid.w + x])) return false;
        if (stepX) { err -= dy; x += sx; }
        if (stepY) { err += dx; y += sy; }
      }
      return false;
    },

    _smooth(grid, tiles, extra) {
      if (tiles.length <= 2) return tiles;
      const out = [tiles[0]];
      let i = 0;
      while (i < tiles.length - 1) {
        let j = tiles.length - 1;
        while (j > i + 1 && !this._lineClear(grid, tiles[i].tx, tiles[i].ty, tiles[j].tx, tiles[j].ty, extra)) j--;
        out.push(tiles[j]); i = j;
      }
      if (out.length !== tiles.length) this.stats.smoothed++;
      return out;
    },

    findTile(map, sx, sy, gx, gy, opts) {
      opts = opts || {};
      this.stats.searches++;
      const grid = this.buildGrid(map, opts);
      const start = this.nearestTile(map, sx * T + T / 2, sy * T + T / 2, opts);
      const goal = this.nearestTile(map, gx * T + T / 2, gy * T + T / 2, opts);
      if (!start || !goal) return [];
      const W = grid.w, N = W * grid.h;
      const si = start.ty * W + start.tx, gi = goal.ty * W + goal.tx;
      if (si === gi) return [{ ...start }];
      const extra = typeof opts.blocked === 'function' ? opts.blocked :
        (opts.blocked instanceof Set ? (idx => opts.blocked.has(idx)) : null);
      if (extra && extra(gi) && !opts.allowPartial) return [];
      const g = grid.g, f = grid.f, came = grid.came, closed = grid.closed;
      g.fill(Infinity); f.fill(Infinity); came.fill(-1); closed.fill(0);
      const heap = new MinHeap();
      const h = idx => Math.abs((idx % W) - goal.tx) + Math.abs(Math.floor(idx / W) - goal.ty);
      g[si] = 0; f[si] = h(si); heap.push(si, f[si]);
      let best = si, bestH = h(si), iterations = 0;
      const maxNodes = opts.maxNodes || N;
      while (heap.size && iterations++ < maxNodes) {
        const cur = heap.pop().idx;
        if (closed[cur]) continue;
        closed[cur] = 1;
        if (cur === gi) { best = gi; break; }
        const cx = cur % W, cy = (cur / W) | 0;
        for (const [dx, dy] of DIRS) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= grid.w || ny >= grid.h) continue;
          const ni = ny * W + nx;
          if (grid.blocked[ni] || closed[ni] || (extra && extra(ni))) continue;
          const ng = g[cur] + 1;
          if (ng < g[ni]) {
            came[ni] = cur; g[ni] = ng; f[ni] = ng + h(ni);
            heap.push(ni, f[ni]);
            if (h(ni) < bestH) { bestH = h(ni); best = ni; }
          }
        }
      }
      this.stats.nodes += iterations;
      if (best !== gi && !opts.allowPartial) return [];
      const tiles = [];
      let cur = best;
      let guard = 0;
      while (cur >= 0 && guard++ < N) {
        tiles.push({ tx: cur % W, ty: (cur / W) | 0, ...tileCenter(cur % W, (cur / W) | 0) });
        if (cur === si) break;
        cur = came[cur];
      }
      tiles.reverse();
      if (tiles[0].tx !== start.tx || tiles[0].ty !== start.ty) return [];
      const smoothed = opts.smooth === false ? tiles : this._smooth(grid, tiles, extra);
      return smoothed.map(t => ({ ...t }));
    },

    find(map, from, to, opts) {
      const a = tileOf(from.x, from.y), b = tileOf(to.x, to.y);
      return this.findTile(map, a.tx, a.ty, b.tx, b.ty, opts);
    },

    // Percorso in coordinate mondo, senza il punto di partenza.
    route(map, from, to, opts) {
      return this.find(map, from, to, opts).slice(1).map(t => ({ x: t.x, y: t.y, tx: t.tx, ty: t.ty }));
    }
  };
})(window);
