import React from 'react';

export default function TitleScreen({ hasSave, onNew, onContinue, onSettings, online }) {
  return (
    <div className="screen title-screen">
      <div className="title-art">
        <div className="title-sun" />
        <div className="title-sea" />
        <div className="title-hill hill-a" />
        <div className="title-hill hill-b" />
        <div className="title-vesuvio" />
      </div>
      <div className="title-card">
        <h1>CAMPANIA <span>LIFE</span></h1>
        <p className="subtitle">AVVENTURE TRA MARE E MONTAGNA</p>
        <p className="cloud on" style={{marginTop:8, fontSize:12, letterSpacing:'.04em'}}>BETA PUBBLICA · Richiede verifica manuale su MacBook e smartphone</p>
        <div className="title-buttons">
          <button className="primary" onClick={onNew}>NUOVA PARTITA</button>
          <button onClick={onContinue} disabled={!hasSave}>CONTINUA</button>
          <button onClick={onSettings}>IMPOSTAZIONI</button>
        </div>
        <p className="hint">Frecce / WASD: muoviti &nbsp;·&nbsp; E: interagisci &nbsp;·&nbsp; Q: rete &nbsp;·&nbsp; Tab: telefono</p>
        <p className={"cloud " + (online ? 'on' : '')}>{online ? '☁ Salvataggio online attivo' : '♙ Modalità locale — puoi collegare un account dalle impostazioni'}</p>
      </div>
    </div>
  );
}
