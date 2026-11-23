import React, { useState } from 'react';

export default function SettingsPanel({ onBack, onToast }) {
  const [music, setMusic] = useState(Math.round(CL.settings.music * 100));
  const [sfx, setSfx] = useState(Math.round(CL.settings.sfx * 100));
  const [speed, setSpeed] = useState(CL.settings.timescale);
  const [shake, setShake] = useState(CL.settings.shake);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [saveText, setSaveText] = useState('');

  const change = (key, value) => {
    CL.settings[key] = value; CL.storeSettings();
  };

  const auth = async mode => {
    if (!email || !pw) { onToast('Inserisci email e password.', 'bad'); return; }
    setBusy(true);
    try {
      if (mode === 'register') await CL.api.register(name || email.split('@')[0], email, pw);
      else await CL.api.login(email, pw);
      onToast('Account collegato: il salvataggio si sincronizza con il server.', 'good');
      if (CL.game) CL.game.save();
    } catch (e) { onToast(e.message || 'Accesso non riuscito', 'bad'); }
    setBusy(false);
  };

  const doExport = () => {
    if (!CL.state) { onToast('Avvia una partita per esportare.', 'bad'); return; }
    setSaveText(CL.save.exportB64(CL.state));
    onToast('Codice di salvataggio generato.', 'good');
  };
  const doImport = () => {
    if (!saveText.trim()) return;
    try {
      const data = CL.save.importB64(saveText);
      CL.game.load(data); CL.save.write(data);
      onToast('Partita importata.', 'good');
    } catch (e) { onToast('Codice non valido.', 'bad'); }
  };

  return (
    <div className="screen">
      <div className="panel wide settings-panel">
        <h2>IMPOSTAZIONI</h2>
        <div className="settings-grid">
          <div>
            <h3>Audio e gioco</h3>
            <label className="slider">Musica <input type="range" min="0" max="100" value={music}
              onChange={e => { setMusic(+e.target.value); change('music', +e.target.value / 100); }} /> <b>{music}%</b></label>
            <label className="slider">Effetti <input type="range" min="0" max="100" value={sfx}
              onChange={e => { setSfx(+e.target.value); change('sfx', +e.target.value / 100); }} /> <b>{sfx}%</b></label>
            <label className="slider">Velocità tempo <input type="range" min="1" max="8" value={speed}
              onChange={e => { setSpeed(+e.target.value); change('timescale', +e.target.value); }} /> <b>×{speed}</b></label>
            <label className="check"><input type="checkbox" checked={shake} onChange={e => { setShake(e.target.checked); change('shake', e.target.checked); }} /> Effetti schermo</label>
            <h3>Controlli</h3>
            <p className="muted">Frecce / WASD: movimento · E: interagisci · Q: cattura · Space: conferma · Tab: telefono · I: zaino · M: mappa · J: missioni · C: collezione · Esc: menu</p>
          </div>
          <div>
            <h3>{CL.api.ready ? '☁ Account collegato' : '☁ Account (opzionale)'}</h3>
            {CL.api.ready ? (
              <div>
                <p className="muted">Accesso come <b>{CL.api.user && (CL.api.user.name || CL.api.user.email)}</b>. Il salvataggio viene sincronizzato con PostgreSQL.</p>
                <button onClick={() => { CL.api.logout(); onToast('Account scollegato. Il gioco continua in locale.', 'info'); }}>SCOLLEGA</button>
              </div>
            ) : (
              <div className="auth-form">
                <label className="field">Nome<input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Il tuo nome" /></label>
                <label className="field">Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.it" /></label>
                <label className="field">Password<input type="password" value={pw} onChange={e => setPw(e.target.value)} /></label>
                <div className="panel-actions">
                  <button disabled={busy} onClick={() => auth('login')}>ACCEDI</button>
                  <button className="primary" disabled={busy} onClick={() => auth('register')}>REGISTRATI</button>
                </div>
                <p className="muted">Serve il backend attivo. Senza account il gioco funziona comunque con salvataggio locale.</p>
              </div>
            )}
            <h3>Esporta / importa partita</h3>
            <textarea className="save-area" rows="3" value={saveText} onChange={e => setSaveText(e.target.value)} placeholder="Incolla qui un codice di salvataggio" />
            <div className="panel-actions">
              <button onClick={doExport}>ESPORTA</button>
              <button onClick={doImport}>IMPORTA</button>
            </div>
          </div>
        </div>
        <div className="panel-actions">
          <button className="primary" onClick={onBack}>INDIETRO</button>
        </div>
      </div>
    </div>
  );
}
