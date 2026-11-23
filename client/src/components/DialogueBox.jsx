import React, { useEffect, useRef, useState } from 'react';
/* CL è il namespace globale creato dai moduli del motore */

export default function DialogueBox({ dlg, onChoice }) {
  const [shown, setShown] = useState('');
  const canvasRef = useRef(null);
  const shownRef = useRef('');
  useEffect(() => { shownRef.current = shown; }, [shown]);

  useEffect(() => {
    if (canvasRef.current && dlg.look) CL.art.portrait(dlg.look, canvasRef.current);
  }, [dlg]);

  useEffect(() => {
    let i = 0;
    setShown('');
    const id = setInterval(() => {
      i = Math.min(dlg.text.length, i + 2);
      setShown(dlg.text.slice(0, i));
      if (i >= dlg.text.length) clearInterval(id);
    }, 14);
    return () => clearInterval(id);
  }, [dlg.text]);

  useEffect(() => {
    const fn = (a, down) => {
      if (!down) return;
      const full = shownRef.current.length >= dlg.text.length;
      if (!full) { setShown(dlg.text); return; }
      if (dlg.choices && dlg.choices.length) {
        const m = /^slot([1-9])$/.exec(a);
        if (m) { const i = +m[1] - 1; if (dlg.choices[i]) { CL.audio.sfx('confirm'); onChoice(dlg.choices[i]); } return; }
        if (a === 'confirm' || a === 'interact') { CL.audio.sfx('confirm'); onChoice(dlg.choices[0]); }
        return;
      }
      if (a === 'confirm' || a === 'interact' || a === 'action') CL.ui.closeDialogue();
    };
    CL.input.onKey(fn);
    return () => CL.input.offKey(fn);
  }, [dlg, onChoice]);

  return (
    <div id="dialogue">
      <canvas id="dialogue-portrait" ref={canvasRef} width="32" height="32" />
      <div className="dialogue-body">
        <div id="dialogue-name">{dlg.name}</div>
        <div id="dialogue-text">{shown}{shown.length < dlg.text.length && <span className="cursor">▌</span>}</div>
        {dlg.choices && dlg.choices.length > 0 && shown.length >= dlg.text.length && (
          <div id="dialogue-choices">
            {dlg.choices.map((c, i) => (
              <button key={i} onClick={() => { CL.audio.sfx('confirm'); onChoice(c); }}>
                <span className="keycap">{i + 1}</span> {c.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {(!dlg.choices || !dlg.choices.length) && <div id="dialogue-more">▼</div>}
    </div>
  );
}
