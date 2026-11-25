import React, { useState } from 'react';
/* CL è il namespace globale popolato dai moduli del motore */

const NEEDS = [
  { k: 'hunger', label: 'Fame', color: '#e0a24a' },
  { k: 'thirst', label: 'Sete', color: '#5fb7d6' },
  { k: 'energy', label: 'Energia', color: '#8fc45a' },
  { k: 'mood', label: 'Umore', color: '#e88fae' },
  { k: 'hygiene', label: 'Igiene', color: '#b6a5d8' }
];

export default function Hud({ snap, onMenu }) {
  const [compact, setCompact] = useState(!!CL.settings.compactHud);
  const [dock, setDock] = useState(null); // menu rapido a icone, chiuso di default
  if (!snap) return null;
  const st = CL.state;
  const foods = CL.data.foodOrder.filter(id => snap.inventory[id] > 0).slice(0, 5);
  const toggleCompact = () => {
    const next = !compact;
    setCompact(next);
    CL.settings.compactHud = next;
    CL.storeSettings();
  };
  return (
    <div className={'hud layer' + (compact ? ' compact' : '')}>
      <div className="hud-top">
        <div className="hud-place" title={snap.location + ' · ' + snap.period + ' · Giorno ' + snap.day}>
          <span className="pin">📍</span> <span className="place-name">{snap.location}</span>
          <small>{snap.period} · Giorno {snap.day}</small>
        </div>
        <div className="hud-clock">
          <b>{snap.clock}</b>
          <span>{snap.weather.icon} {snap.weather.name}</span>
        </div>
        <div className="hud-money">
          <b>{snap.money.toLocaleString('it-IT')} €</b>
          <small>Banca {snap.bank.toLocaleString('it-IT')} € · Rep {snap.rep}</small>
        </div>
        <div className="hud-top-actions">
          {dock && <div className="icon-dock" role="menu" aria-label="Menu rapido">
            {[
              ['🗺', 'mappa', 'Mappa'], ['🎒', 'zaino', 'Inventario'],
              ['📖', 'diario', 'Missioni'], ['📱', 'phone', 'Telefono'],
              ['👤', 'personaggio', 'Profilo'], ['💼', 'lavori', 'Lavori'],
              ['🏦', 'banca', 'Portafoglio'], ['⚙', 'impostazioni', 'Impostazioni'],
              ['💾', 'salvataggio', 'Salvataggio']
            ].map(([icon, tab, label]) => (
              <button key={tab} aria-label={label} title={label}
                onClick={() => { setDock(null); if (tab === 'impostazioni') onMenu('impostazioni'); else onMenu(tab); }}>
                {icon}
              </button>
            ))}
          </div>}
          <button className="hud-compact-btn" onClick={toggleCompact}
            aria-label={compact ? 'Mostra dettagli' : 'Compatta HUD'}
            title={compact ? 'Mostra tutti i dettagli del HUD' : 'Compatta il HUD'}>{compact ? '▣' : '▢'}</button>
          <button className="hud-menu-btn" aria-label="Apri menu" title="Menu"
            onClick={() => setDock(v => v ? null : true)}>{dock ? '✕' : '☰'}</button>
        </div>
      </div>

      <div className="hud-needs">
        {NEEDS.map(n => (
          <div className="need" key={n.k} title={n.label}>
            <span>{n.label.slice(0, 1)}</span>
            <div className="need-bar"><i style={{ width: Math.max(0, snap.needs[n.k]) + '%', background: n.color }} /></div>
          </div>
        ))}
        <div className="need"><span>LV</span><div className="need-bar"><i style={{ width: Math.min(100, (snap.xp / (st.level * 120)) * 100) + '%', background: '#e9b84a' }} /></div></div>
      </div>

      {snap.quests.length > 0 && (
        <div className="hud-quest">
          <div className="hq-title">📖 {snap.quests[0].name}</div>
          <div className="hq-text">{snap.quests[0].text}</div>
          {snap.quests[0].count > 1 && <div className="hq-prog">{snap.quests[0].prog}/{snap.quests[0].count}</div>}
        </div>
      )}

      {snap.riding && <div className="hud-ride">🛵 Stai guidando: {snap.riding}</div>}

      <div className="hud-hotbar">
        {foods.map((id, i) => (
          <div className="slot" key={id} title={CL.data.items[id].name}>
            <img src={CL.art.iconData(CL.data.items[id].icon)} alt="" />
            <em>{i + 1}</em>
          </div>
        ))}
        {!foods.length && <span className="hotbar-empty">1–5: cibo &nbsp;·&nbsp; Q: rete</span>}
      </div>

      <div className="hud-help">
        <span>Frecce/WASD muovi · E interagisci · Q cattura · Tab telefono</span>
        {snap.debug ? <span className="hud-debug">DBG {snap.location} | in:{snap.debug.keys||'-'} | ax:{(snap.debug.axis?.x||0).toFixed(1)},{(snap.debug.axis?.y||0).toFixed(1)} | blk:{snap.debug.blocked||'ok'} | modal:{snap.debug.modal?'1':'0'}</span> : null}
      </div>
    </div>
  );
}
