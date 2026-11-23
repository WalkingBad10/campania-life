import React, { useEffect, useRef, useState } from 'react';

const HAIR = ['#2d2622', '#5d3a26', '#a96b35', '#d8d4cc', '#6b3e5b', '#3d4a55'];
const SKIN = ['#f0c9a0', '#e8b48a', '#d79c74', '#b9794f', '#8c5a3d'];
const SHIRT = ['#c75b3b', '#2c7a9c', '#5f7a45', '#6b3e5b', '#e9b84a', '#eef0e6'];
const PANTS = ['#3a4650', '#4b4152', '#5a4a35', '#2f3a44'];

function Swatches({ colors, value, onChange }) {
  return <div className="look-row">{colors.map((c, i) => (
    <button key={i} className={'look-chip ' + (value === c ? 'active' : '')}
      style={{ background: c }} onClick={() => onChange(c)} aria-label={'Colore ' + (i + 1)} />
  ))}</div>;
}

export default function CharacterCreation({ onStart, onBack }) {
  const [name, setName] = useState('Antonio');
  const [surname, setSurname] = useState('Esposito');
  const [look, setLook] = useState({ hair: HAIR[0], skin: SKIN[1], shirt: SHIRT[0], pants: PANTS[0] });
  const [perk, setPerk] = useState('nativo');
  const canvasRef = useRef(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    x.clearRect(0, 0, 16, 24); x.drawImage(CL.art.character(look, 'down', 0), 0, 0);
  }, [look]);

  const start = () => onStart({
    name: name.trim() || 'Antonio',
    surname: surname.trim() || 'Esposito',
    look: { ...look }, perk
  });

  return (
    <div className="screen">
      <div className="panel wide create-panel">
        <h2>CREA IL TUO PERSONAGGIO</h2>
        <div className="create-grid">
          <div className="create-preview">
            <canvas ref={canvasRef} width="16" height="24" />
            <p className="muted">Il tuo alter ego campano</p>
          </div>
          <div className="create-fields">
            <label className="field">Nome<input type="text" maxLength="14" value={name} onChange={e => setName(e.target.value)} /></label>
            <label className="field">Cognome<input type="text" maxLength="14" value={surname} onChange={e => setSurname(e.target.value)} /></label>
            <div className="field"><span>Capelli</span><Swatches colors={HAIR} value={look.hair} onChange={v => setLook({ ...look, hair: v })} /></div>
            <div className="field"><span>Incarnato</span><Swatches colors={SKIN} value={look.skin} onChange={v => setLook({ ...look, skin: v })} /></div>
            <div className="field"><span>Vestito</span><Swatches colors={SHIRT} value={look.shirt} onChange={v => setLook({ ...look, shirt: v })} /></div>
            <div className="field"><span>Pantaloni</span><Swatches colors={PANTS} value={look.pants} onChange={v => setLook({ ...look, pants: v })} /></div>
          </div>
        </div>
        <div className="field"><span>Dote iniziale</span>
          <div className="choice-row">
            {[
              ['nativo', 'Nativo Campano', '+10% guadagni'],
              ['intraprendente', 'Intraprendente', '+150 € in tasca'],
              ['sportivo', 'Sportivo', '+energia e attributi']
            ].map(([id, title, sub]) => (
              <button key={id} className={'choice ' + (perk === id ? 'active' : '')} onClick={() => setPerk(id)}>
                {title}<small>{sub}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="panel-actions">
          <button onClick={onBack}>INDIETRO</button>
          <button className="primary" onClick={start}>INIZIA L'AVVENTURA</button>
        </div>
      </div>
    </div>
  );
}
