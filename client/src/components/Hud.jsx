import React from 'react';
/* CL è il namespace globale popolato dai moduli del motore */

const NEEDS = [
  { k: 'hunger', label: 'Fame', color: '#e0a24a' },
  { k: 'thirst', label: 'Sete', color: '#5fb7d6' },
  { k: 'energy', label: 'Energia', color: '#8fc45a' },
  { k: 'mood', label: 'Umore', color: '#e88fae' },
  { k: 'hygiene', label: 'Igiene', color: '#b6a5d8' }
];

export default function Hud({ snap, onMenu }) {
  if (!snap) return null;
  const st = CL.state;
  const foods = CL.data.foodOrder.filter(id => snap.inventory[id] > 0).slice(0, 5);
  return (
    <div className="hud layer">
      <div className="hud-top">
        <div className="hud-place">
          <span className="pin">📍</span> {snap.location}
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
          <div className="hq-title">MISSIONE · {snap.quests[0].name}</div>
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
        <button onClick={() => onMenu('phone')}>☰ MENU</button>
      </div>
    </div>
  );
}
