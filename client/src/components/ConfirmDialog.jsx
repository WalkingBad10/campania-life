import React from 'react';

export default function ConfirmDialog({ data, onClose }) {
  return (
    <div className="screen confirm-screen" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="panel small">
        <h2>{data.title || 'Conferma'}</h2>
        <p>{data.text}</p>
        <div className="panel-actions">
          <button onClick={onClose}>ANNULLA</button>
          <button className="primary" onClick={() => { const f = data.onOk; onClose(); if (f) f(); }}>CONFERMA</button>
        </div>
      </div>
    </div>
  );
}
