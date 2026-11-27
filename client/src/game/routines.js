/* CAMPANIA LIFE — routines.js
 * Routine quotidiane deterministiche per PNG. Nessun dato viene salvato:
 * l'obiettivo viene ricalcolato dall'ora di gioco e dalla definizione statica in data.js.
 */
(function (w) {
  'use strict';
  const CL = w.CL, D = CL.data, T = CL.TILE;

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0);
  }

  const WORK_ROLES = { school: 1, shop: 1, bank: 1, clinic: 1, job: 1, transport: 1 };
  // Fasce orarie in ore di gioco: notte a casa, mattina lavoro/scuola,
  // giorno negozi e turismo, sera rientro con una breve passeggiata.
  // Nessun dato viene salvato: basta l'ora e la definizione statica in data.js.
  const SCHEDULES = {
    family: [[0,7,'home'],[7,9,'plaza'],[9,13,'home'],[13,17,'plaza'],[17,19,'home'],[19,21,'plaza'],[21,24,'home']],
    school: [[0,8,'home'],[8,14,'work'],[14,16,'plaza'],[16,19,'home'],[19,21,'plaza'],[21,24,'home']],
    shop:   [[0,7,'home'],[7,9,'work'],[9,13,'work'],[13,14,'plaza'],[14,19,'work'],[19,21,'plaza'],[21,24,'home']],
    bank:   [[0,8,'home'],[8,13,'work'],[13,14,'plaza'],[14,17,'work'],[17,19,'plaza'],[19,24,'home']],
    clinic: [[0,8,'home'],[8,14,'work'],[14,15,'plaza'],[15,19,'work'],[19,24,'home']],
    job:    [[0,7,'home'],[7,12,'work'],[12,13,'plaza'],[13,18,'work'],[18,20,'plaza'],[20,24,'home']],
    transport: [[0,6,'home'],[6,10,'work'],[10,11,'plaza'],[11,15,'work'],[15,16,'plaza'],[16,20,'work'],[20,24,'home']],
    quest:  [[0,8,'home'],[8,12,'plaza'],[12,16,'work'],[16,19,'plaza'],[19,24,'home']],
    social: [[0,9,'home'],[9,12,'plaza'],[12,16,'work'],[16,20,'plaza'],[20,24,'home']],
    ambient:[[0,7,'home'],[7,12,'plaza'],[12,14,'work'],[14,19,'plaza'],[19,21,'plaza'],[21,24,'home']]
  };

  function whereAt(npc, hour) {
    const def = D.npcs[npc.id] || {};
    let sched = null;
    if (Array.isArray(def.schedule)) sched = def.schedule;
    else if (typeof def.schedule === 'string') sched = SCHEDULES[def.schedule];
    sched = sched || SCHEDULES[npc.role] || SCHEDULES.ambient;
    for (const [from, to, where] of sched) if (hour >= from && hour < to) return where;
    return 'home';
  }

  function tileOf(x, y, map) {
    return {
      tx: Math.max(0, Math.min(map.w - 1, Math.floor(x / T))),
      ty: Math.max(0, Math.min(map.h - 1, Math.floor(y / T)))
    };
  }

  function anchorTile(npc, map, where) {
    const def = D.npcs[npc.id] || {};
    const home = tileOf(npc.homeX, npc.homeY, map);
    if (where === 'home') return home;
    if (where === 'work' && def.home === map.id && Number.isFinite(def.x) && Number.isFinite(def.y)) {
      return tileOf(def.x * T + 8, def.y * T + 8, map);
    }
    // "plaza" e "work" quando la definizione non è su questa mappa:
    // offset deterministico e locale, sempre vicino al punto di casa.
    const h = hash(npc.id + '|' + where);
    const dx = ((h & 7) - 3);
    const dy = (((h >> 3) & 5) - 2);
    return {
      tx: Math.max(1, Math.min(map.w - 2, home.tx + dx)),
      ty: Math.max(1, Math.min(map.h - 2, home.ty + dy))
    };
  }

  CL.routines = {
    schedules: SCHEDULES,
    whereAt,
    anchorTile,
    workRoles: WORK_ROLES,

    // Restituisce un punto mondo camminabile oppure null.
    goalFor(npc, map, hour) {
      if (!map || !CL.path) return null;
      const h = Number.isFinite(hour) ? hour : (CL.systems && CL.systems.time ? CL.systems.time.hour() : 12);
      const where = whereAt(npc, h);
      const a = anchorTile(npc, map, where);
      const tile = CL.path.nearestTile(map, a.tx * T + T / 2, a.ty * T + T / 2, {
        w: npc.w || 12, h: npc.h || 10, maxR: 7
      });
      return tile ? { x: tile.x, y: tile.y, tx: tile.tx, ty: tile.ty, where } : null;
    }
  };
})(window);
