import React, { useEffect, useRef, useState } from 'react';

const BTNS = [
  { id: 'interact', label: 'E', cls: 'mc-btn mc-a' },
  { id: 'run', label: 'CORRI', cls: 'mc-btn mc-run' },
  { id: 'menu', label: 'TEL', cls: 'mc-btn mc-m' },
];

function setKey(k, down) {
  const inp = window.CL && window.CL.input;
  if (!inp) return;
  if (down) {
    if (!inp.down[k]) { inp.pressed[k] = true; inp.listeners.forEach(fn => fn(k, true)); }
    inp.down[k] = true;
  } else {
    inp.down[k] = false; inp.released[k] = true;
    inp.listeners.forEach(fn => fn(k, false));
  }
}

function clearAxis() { ['up','down','left','right'].forEach(k => setKey(k, false)); }
function applyAxis(dx, dy) {
  const dead = 10;
  setKey('left', dx < -dead); setKey('right', dx > dead);
  setKey('up', dy < -dead); setKey('down', dy > dead);
}

export default function MobileControls({ visible }) {
  const joyRef = useRef(null);
  const knobRef = useRef(null);
  const active = useRef(false);
  const origin = useRef({ x: 0, y: 0 });
  const [runOn, setRunOn] = useState(false);

  useEffect(() => { setKey('run', runOn); }, [runOn]);
  useEffect(() => () => { clearAxis(); setKey('run', false); }, []);

  const onJoyStart = e => {
    const t = e.touches ? e.touches[0] : e;
    const r = joyRef.current.getBoundingClientRect();
    origin.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    active.current = true;
    onJoyMove(e);
  };
  const onJoyMove = e => {
    if (!active.current) return;
    // Il CSS `.mc-joy{touch-action:none}` blocca scroll/zoom: qui non serve
    // preventDefault, che nei listener React touch e' passivo e genererebbe
    // un errore console su Android.
    const t = e.touches ? e.touches[0] : e;
    const dx = t.clientX - origin.current.x;
    const dy = t.clientY - origin.current.y;
    const max = 34;
    const dist = Math.hypot(dx, dy) || 1;
    const cl = Math.min(max, dist);
    const nx = dx / dist * cl, ny = dy / dist * cl;
    if (knobRef.current) knobRef.current.style.transform = `translate(${nx}px, ${ny}px)`;
    applyAxis(nx, ny);
  };
  const onJoyEnd = () => {
    // Nessun preventDefault: un touchend globale consumato bloccherebbe la
    // sintesi del click su qualsiasi pulsante (titolo, creazione, dialoghi).
    if (!active.current) return;
    active.current = false;
    if (knobRef.current) knobRef.current.style.transform = 'translate(0px,0px)';
    clearAxis();
  };

  useEffect(() => {
    // I listener globali servono solo quando i controlli touch sono in gioco:
    // sui menu iniziali non devono toccare i touchend dei pulsanti React.
    if (!visible) return;
    const move = e => onJoyMove(e);
    const up = e => onJoyEnd(e);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up, { passive: false });
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [visible]);

  if (!visible) return null;
  return (
    <div className="mobile-controls" aria-hidden="false">
      <div className="mc-joy-wrap">
        <div className="mc-joy"
          ref={joyRef}
          onTouchStart={onJoyStart} onTouchEnd={onJoyEnd} onTouchCancel={onJoyEnd}
          onMouseDown={onJoyStart}
        >
          <div className="mc-knob" ref={knobRef} />
        </div>
      </div>
      <div className="mc-actions">
        <button className={`mc-btn mc-run ${runOn ? 'on' : ''}`}
          onTouchStart={() => { setRunOn(true); setKey('run', true); }}
          onTouchEnd={() => { setRunOn(false); setKey('run', false); }}
          onTouchCancel={() => { setRunOn(false); setKey('run', false); }}
          onMouseDown={e => { e.preventDefault(); setRunOn(true); setKey('run', true); }}
          onMouseUp={e => { e.preventDefault(); setRunOn(false); setKey('run', false); }}
          onMouseLeave={e => { if (runOn) { setRunOn(false); setKey('run', false); } }}
        >CORRI</button>
        <button className="mc-btn mc-a"
          onTouchStart={() => setKey('interact', true)}
          onTouchEnd={() => setKey('interact', false)}
          onMouseDown={e => { e.preventDefault(); setKey('interact', true); }}
          onMouseUp={e => { e.preventDefault(); setKey('interact', false); }}
        >E</button>
        <button className="mc-btn mc-m"
          onTouchStart={() => setKey('menu', true)}
          onTouchEnd={() => setKey('menu', false)}
          onMouseDown={e => { e.preventDefault(); setKey('menu', true); }}
          onMouseUp={e => { e.preventDefault(); setKey('menu', false); }}
        >TEL</button>
      </div>
    </div>
  );
}
