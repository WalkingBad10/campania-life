import React, { useEffect, useState } from 'react';

const TABS = [
  ['phone', '📱 Telefono'], ['zaino', '🎒 Zaino'], ['lavori', '💼 Lavori'],
  ['banca', '🏦 Banca'], ['immobili', '🏠 Immobili'], ['mappa', '🗺 Mappa'],
  ['diario', '📖 Missioni'], ['personaggio', '👤 Profilo']
];

const SPAWNS = {
  napoli: [62 * 16, 28 * 16], costiera: [3 * 16, 14 * 16],
  vesuvio: [32 * 16, 45 * 16], pompei: [5 * 16, 30 * 16], capri: [15 * 16, 17 * 16],
  bacoli: [5 * 16, 14 * 16], salerno: [4 * 16, 19 * 16],
  avellino: [3 * 16, 17 * 16], caserta: [30 * 16, 36 * 16]
};

function Icon({ id }) {
  const item = CL.data.items[id];
  return <img className="item-icon" src={CL.art.iconData(item ? item.icon : 'box')} alt="" />;
}
function Bar({ v, color }) {
  return <div className="bar"><i style={{ width: Math.max(0, Math.min(100, v)) + '%', background: color }} /></div>;
}

export default function PhoneMenu({ tab, data, game, onTab, onClose, onToast }) {
  const [amount, setAmount] = useState('50');
  const [saveText, setSaveText] = useState('');
  const [giftNpc, setGiftNpc] = useState(Object.keys(CL.data.npcs)[0]);
  const st = CL.state;
  const S = CL.systems;

  useEffect(() => {
    const fn = (a, down) => { if (down && (a === 'pause' || a === 'menu')) onClose(); };
    CL.input.onKey(fn); return () => CL.input.offKey(fn);
  }, [onClose]);
  useEffect(() => { CL.ui.refresh(); }, [tab]);

  const go = id => game && game.enterMap(id, undefined, undefined);
  const travel = id => {
    const sp = SPAWNS[id] || [CL.maps.get(id).spawn.x, CL.maps.get(id).spawn.y];
    S.time.skip(.6);
    if (game) game.enterMap(id, sp[0], sp[1]);
    onToast('Viaggio verso ' + CL.maps.get(id).name, 'info');
    onClose();
  };
  const buy = id => {
    const it = CL.data.items[id];
    if (S.economy.spend(it.price, 'Acquisto ' + it.name)) S.inventory.add(id);
  };
  const refresh = () => CL.ui.refresh();

  let content = null;

  if (tab === 'phone') {
    const apps = [
      ['zaino', '🎒', 'Zaino'], ['lavori', '💼', 'Lavori'], ['banca', '🏦', 'Banca'],
      ['immobili', '🏠', 'Immobili'], ['mappa', '🗺', 'Mappa'],
      ['diario', '📖', 'Missioni'], ['personaggio', '👤', 'Profilo'], ['negozio', '🛒', 'Negozio']
    ];
    content = <>
      <div className="phone-head">
        <div><b>{st.profile.name} {st.profile.surname}</b><small>Livello {st.level} · Giorno {st.time.day} · {S.time.clock()}</small></div>
        <div className="phone-money">{st.money.toLocaleString('it-IT')} €</div>
      </div>
      <div className="app-grid">{apps.map(([id, ic, label]) => (
        <button key={id} className="app" onClick={() => onTab(id)}><span>{ic}</span>{label}</button>
      ))}</div>
      <div className="card"><b>Consiglio del giorno</b><div className="sub">{CL.data.tips[st.time.day % CL.data.tips.length]}</div></div>
      <div className="card"><b>Rendite giornaliere</b><div className="sub">Incassi immobili: {S.property.income()} € / giorno</div></div>
    </>;
  }

  else if (tab === 'zaino') {
    const ids = Object.keys(st.inventory).filter(id => st.inventory[id] > 0);
    content = ids.length ? <div className="grid">{ids.map(id => {
      const it = CL.data.items[id];
      return <div className="tile" key={id}>
        <Icon id={id} /><b>{it.name}</b><div className="sub">× {st.inventory[id]}</div>
        <div className="tile-actions">
          {it.type === 'food' && <button onClick={() => { S.inventory.use(id); refresh(); }}>Usa</button>}
          {it.type === 'outfit' && <button onClick={() => { S.inventory.use(id); refresh(); }}>Indossa</button>}
          {it.price > 0 && <button onClick={() => { S.inventory.sell(id, 1); refresh(); }}>Vendi</button>}
        </div>
      </div>;
    })}</div> : <p className="muted">Lo zaino è vuoto. Compra qualcosa in un negozio.</p>;
  }

  else if (tab === 'lavori') {
    content = <>
      <p className="muted">Scegli un'attività. Ogni turno dura 2 ore e consuma energia.</p>
      {S.jobs.list().map(j => <div className="card" key={j.id}>
        <div><b>{j.name}</b> <span className="tag">{j.pay * 2} € / turno</span>
          <div className="sub">{j.desc}</div>
          <div className="sub">{j.ok ? 'Disponibile ora' : '⛔ ' + j.why}</div>
        </div>
        <button className="primary" disabled={!j.ok} onClick={() => { S.jobs.work(j.id); refresh(); }}>LAVORA</button>
      </div>)}
    </>;
  }

  else if (tab === 'banca') {
    content = <>
      <div className="phone-head"><div><b>Conti</b><small>Contanti e risparmi</small></div>
        <div className="phone-money">{st.money.toLocaleString('it-IT')} €<small>Banca: {st.bank.toLocaleString('it-IT')} €</small></div></div>
      <div className="row">
        <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} />
        <button onClick={() => { S.economy.deposit(+amount); refresh(); }}>DEPOSITA</button>
        <button onClick={() => { S.economy.withdraw(+amount); refresh(); }}>PRELEVA</button>
      </div>
      <h3>Movimenti recenti</h3>
      {st.log.slice(0, 10).map((l, i) => <div className="logline" key={i}><span>{l.d}</span>{l.t}</div>)}
    </>;
  }

  else if (tab === 'immobili') {
    content = <>
      <p className="muted">Rendita totale: <b>{S.property.income()} € / giorno</b>. Possiedi {st.properties.length} immobili.</p>
      {S.property.list().map(p => <div className="card" key={p.id}>
        <div><b>{p.name}</b> <span className="tag">{p.income} €/giorno</span>
          <div className="sub">{p.desc}</div>
          <div className="sub">Prezzo: {p.price.toLocaleString('it-IT')} € · {p.zone}</div>
        </div>
        {p.owned
          ? <button onClick={() => { go(p.interior); onClose(); }}>ENTRA</button>
          : <button className="primary" onClick={() => { S.property.buy(p.id); refresh(); }}>ACQUISTA</button>}
      </div>)}
    </>;
  }

  else if (tab === 'mappa') {
    content = <>
      <p className="muted">Muoviti a piedi, in bicicletta o con il battello. I cartelli sulle strade portano da una zona all'altra.</p>
      <div className="grid">
        {['napoli', 'costiera', 'vesuvio', 'pompei', 'capri', 'bacoli', 'salerno', 'avellino', 'caserta'].map(id => {
          const z = CL.data.zones[id] || { name: 'Capri', desc: 'Isola nel golfo' };
          return <div className="tile" key={id}><b>{z.name}</b><div className="sub">{z.desc || ''}</div>
            <div className="tile-actions"><button onClick={() => travel(id)}>VIAGGIA</button></div>
          </div>;
        })}
      </div>
      {st.flags.visited && <p className="muted">Zone visitate: {Object.keys(st.flags.visited).length}/4</p>}
    </>;
  }

 

  else if (tab === 'diario') {
    const active = S.quests.active(), done = Object.keys(st.quests).filter(id => st.quests[id].done);
    content = <>
      <h3>Missioni attive</h3>
      {active.length ? active.map(id => {
        const q = CL.data.quests[id], cur = S.quests.current(id), qs = st.quests[id];
        return <div className="card" key={id}><div><b>{q.name}</b><div className="sub">{cur ? cur.text : ''}</div>
          <div className="sub">{q.desc}</div></div><span className="tag">{qs.prog}/{cur ? cur.count : 1}</span></div>;
      }) : <p className="muted">Nessuna missione attiva. Parla con la gente del paese!</p>}
      <h3>Completate</h3>
      {done.length ? done.map(id => <div className="logline" key={id}>✓ {CL.data.quests[id].name}</div>) : <p className="muted">Ancora nessuna.</p>}
    </>;
  }

  else if (tab === 'personaggio') {
    const needRows = [['Fame', st.needs.hunger, '#e0a24a'], ['Sete', st.needs.thirst, '#5fb7d6'],
      ['Energia', st.needs.energy, '#8fc45a'], ['Umore', st.needs.mood, '#e88fae'], ['Igiene', st.needs.hygiene, '#b6a5d8']];
    content = <>
      <div className="phone-head"><div><b>{st.profile.name} {st.profile.surname}</b><small>Livello {st.level} · XP {st.xp}/{st.level * 120}</small></div>
        <div className="phone-money">Rep {st.rep}</div></div>
      <h3>Bisogni</h3>
      {needRows.map(([l, v, c]) => <div className="needrow" key={l}><span>{l}</span><Bar v={v} color={c} /><b>{Math.round(v)}</b></div>)}
      <h3>Statistiche</h3>
      <p className="muted">Lavori: {st.stats.worked} · Pesche: {st.stats.fished} · Creature: {st.stats.caught} ·
        Immobili: {st.properties.length} · Guadagnati: {st.stats.earned.toLocaleString('it-IT')} €</p>
      <h3>Affinità</h3>
      {S.relations.best().length ? S.relations.best().map(([id, v]) => <div className="logline" key={id}>{CL.data.npcs[id] ? CL.data.npcs[id].name : id} <b>{v}</b></div>) : <p className="muted">Parla con gli abitanti per conoscerli.</p>}
      <h3>Obiettivi</h3>
      <div className="grid">{S.achievements.list().map(a => <div className={'tile ' + (a.got ? '' : 'locked')} key={a.id}>
        <b>{a.got ? '★ ' + a.name : '☆ ???'}</b><div className="sub tiny">{a.desc}</div></div>)}</div>
    </>;
  }

  else if (tab === 'negozio') {
    const shopId = data.shop || 'negozio', shop = CL.data.shops[shopId] || CL.data.shops.negozio;
    content = <>
      <p className="muted">{shop.name} — i prezzi sono fissi, gli incassi vanno al venditore.</p>
      <div className="grid">{shop.stock.map(id => {
        const it = CL.data.items[id]; if (!it) return null;
        return <div className="tile" key={id}><Icon id={id} /><b>{it.name}</b>
          <div className="sub tiny">{it.desc}</div><div className="sub">{it.price} €</div>
          <div className="tile-actions"><button disabled={st.money < it.price} onClick={() => { buy(id); refresh(); }}>COMPRA</button></div>
        </div>;
      })}</div>
      <div className="panel-actions"><button onClick={() => onTab('vendi')}>VENDI OGGETTI</button></div>
    </>;
  }

  else if (tab === 'vendi') {
    const ids = S.inventory.sellable();
    content = <>
      <p className="muted">I negozianti pagano il 55% del valore.</p>
      {ids.length ? <div className="grid">{ids.map(id => <div className="tile" key={id}><Icon id={id} /><b>{CL.data.items[id].name}</b>
        <div className="sub">× {st.inventory[id]} · {Math.floor(CL.data.items[id].price * .55)} €</div>
        <div className="tile-actions"><button onClick={() => { S.inventory.sell(id, 1); refresh(); }}>VENDI 1</button></div></div>)}</div>
        : <p className="muted">Niente da vendere.</p>}
    </>;
  }

  else if (tab === 'regalo') {
    const gifts = Object.keys(st.inventory).filter(id => CL.data.items[id] && CL.data.items[id].gift);
    content = <>
      <p className="muted">Un regalo aumenta l'affinità. Ogni PNG ha gusti diversi.</p>
      <label className="field">A chi?
        <select value={giftNpc} onChange={e => setGiftNpc(e.target.value)}>
          {Object.keys(CL.data.npcs).map(id => <option key={id} value={id}>{CL.data.npcs[id].name}</option>)}
        </select>
      </label>
      {gifts.length ? <div className="grid">{gifts.map(id => <div className="tile" key={id}><Icon id={id} />
        <b>{CL.data.items[id].name}</b><div className="sub">+{CL.data.items[id].gift} affinità</div>
        <div className="tile-actions"><button onClick={() => { S.relations.gift(giftNpc, id); refresh(); }}>REGALA</button></div></div>)}</div>
        : <p className="muted">Compra fiori, cioccolato o vino per fare un regalo.</p>}
    </>;
  }

  else if (tab === 'impostazioni') {
    content = <>
      <label className="slider">Musica <input type="range" min="0" max="100" value={Math.round(CL.settings.music * 100)}
        onChange={e => { CL.settings.music = e.target.value / 100; CL.storeSettings(); }} /></label>
      <label className="slider"> Effetti <input type="range" min="0" max="100" value={Math.round(CL.settings.sfx * 100)}
        onChange={e => { CL.settings.sfx = e.target.value / 100; CL.storeSettings(); }} /></label>
      <label className="slider">Velocità tempo <input type="range" min="1" max="8" value={CL.settings.timescale}
        onChange={e => { CL.settings.timescale = +e.target.value; CL.storeSettings(); }} /></label>
      <p className="muted">Account: {CL.api.ready ? 'collegato' : 'locale'} · Frecce/WASD muovi, E interagisci, Q cattura.</p>
      <h3>Copia di sicurezza</h3>
      <textarea className="save-area" rows="2" value={saveText} onChange={e => setSaveText(e.target.value)} placeholder="Codice salvataggio" />
      <div className="panel-actions">
        <button onClick={() => { setSaveText(CL.save.exportB64(CL.state)); onToast('Codice generato.', 'good'); }}>ESPORTA</button>
        <button onClick={() => { try { CL.game.load(CL.save.importB64(saveText)); onToast('Importato.', 'good'); } catch (e) { onToast('Codice non valido.', 'bad'); } }}>IMPORTA</button>
      </div>
    </>;
  }

  const showTabs = ['negozio', 'vendi', 'regalo', 'impostazioni'].indexOf(tab) < 0;
  return (
    <div className="screen menu-screen">
      <div className="panel wide menu-panel">
        <div id="menu-head"><h2>{TABS.find(t => t[0] === tab) ? TABS.find(t => t[0] === tab)[1] : 'TELEFONO'}</h2>
          <button id="menu-close" onClick={onClose}>✕</button></div>
        {showTabs && <div id="menu-tabs">{TABS.map(([id, label]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => onTab(id)}>{label}</button>
        ))}</div>}
        <div id="menu-content">{content}</div>
        <div id="menu-foot">Tab / Esc per chiudere · clicca per selezionare</div>
      </div>
    </div>
  );
}
