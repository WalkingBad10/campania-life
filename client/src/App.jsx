import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hud from './components/Hud.jsx';
import DialogueBox from './components/DialogueBox.jsx';
import PhoneMenu from './components/PhoneMenu.jsx';
import Toasts from './components/Toasts.jsx';
import TitleScreen from './components/TitleScreen.jsx';
import CharacterCreation from './components/CharacterCreation.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import MobileControls from './components/MobileControls.jsx';

export default function App() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const toastId = useRef(0);
  const modalRef = useRef(true);
  const screenRef = useRef('title');

  const [screen, setScreen] = useState('title');
  const [settingsFrom, setSettingsFrom] = useState('title');
  const [hasSave, setHasSave] = useState(false);
  const [snap, setSnap] = useState(null);
  const [dlg, setDlg] = useState(null);
  const [menu, setMenu] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => {
    modalRef.current = screen !== 'game' || !!dlg || !!menu || !!confirm;
  }, [screen, dlg, menu, confirm]);

  const pushToast = useCallback((msg, type) => {
    const id = ++toastId.current;
    setToasts(t => [...t.slice(-4), { id, msg, type: type || 'info' }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3400);
  }, []);

  /* Ponte motore → React */
  useEffect(() => {
    CL.ui.toast = pushToast;
    CL.ui.refresh = () => { const g = gameRef.current; if (g) setSnap(g.snapshot()); };
    CL.ui.showDialogue = p => { setMenu(null); setDlg(p); };
    CL.ui.closeDialogue = () => setDlg(null);
    CL.ui.dialogueText = (name, text) => setDlg({
      name, text, look: { hair: '#5a4030', skin: '#dfa97f', shirt: '#6b7f8c', pants: '#3a4650' },
      choices: [{ label: 'Continua', action: 'close' }]
    });
    CL.ui.openMenu = (tab, data) => { CL.audio.sfx('phone'); setDlg(null); setMenu({ tab, data: data || {} }); };
    CL.ui.openShop = id => setMenu({ tab: 'negozio', data: { shop: id } });
    CL.ui.closeMenu = () => setMenu(null);
    CL.ui.closeAll = () => { setDlg(null); setMenu(null); setConfirm(null); };
    CL.ui.confirm = (title, text, onOk) => setConfirm({ title, text, onOk });
    CL.ui.isModal = () => {
      const g = gameRef.current;
      if (g && g.enterCooldown > 0) return false;
      return modalRef.current;
    };

    CL.input.init();
    CL.loadSettings();
    CL.api.init();
    const g = new CL.Game(canvasRef.current);
    gameRef.current = g;
    CL.game = g;
    g.start();
    setHasSave(CL.save.has());
    const queued = CL.ui.takeToasts ? CL.ui.takeToasts() : [];
    queued.forEach(t => pushToast(t.msg, t.type));

    const onErr = e => {
      console.error('[CL] window error', e.error || e.message || e);
      pushToast('Errore imprevisto recuperato. La partita resta attiva.', 'bad');
      e.preventDefault?.();
    };
    const onRej = e => {
      console.error('[CL] unhandled rejection', e.reason);
      pushToast('Problema di rete/caricamento recuperato.', 'bad');
      e.preventDefault?.();
    };
    window.addEventListener('error', onErr);
    window.addEventListener('unhandledrejection', onRej);
    return () => {
      window.removeEventListener('error', onErr);
      window.removeEventListener('unhandledrejection', onRej);
      g.stop();
    };
  }, [pushToast]);

  /* Tasti globali di chiusura */
  useEffect(() => {
    const fn = (a, down) => {
      if (!down) return;
      if (confirm) {
        if (a === 'confirm' || a === 'interact') { setConfirm(null); }
        return;
      }
      if (menu && (a === 'pause' || a === 'menu')) { setMenu(null); CL.audio.sfx('cancel'); return; }
      if (screen === 'settings' && a === 'pause') { setScreen(settingsFrom); return; }
      if (screen === 'create' && a === 'pause') { setScreen('title'); return; }
    };
    CL.input.onKey(fn);
    return () => CL.input.offKey(fn);
  }, [confirm, menu, screen, settingsFrom]);

  const startGame = profile => {
    const g = gameRef.current;
    g.newGame(profile);
    CL.audio.resume(); CL.audio.setTrack('town');
    setSnap(g.snapshot()); setScreen('game'); setHasSave(true);
  };

  const continueGame = async () => {
    let data = CL.save.read();
    if (CL.api.ready && CL.api.token) {
      try {
        const remote = await CL.api.pull();
        const remoteTime = remote && remote.saved_at ? new Date(remote.saved_at).getTime() : 0;
        if (remote && remote.payload && (!data || remoteTime >= (data.t || 0))) {
          data = { data: remote.payload, t: remoteTime };
        }
      } catch (e) { /* offline: uso il salvataggio locale */ }
    }
    if (!data) { pushToast('Nessun salvataggio trovato. Inizia una nuova partita.', 'bad'); return; }
    if (gameRef.current.load(data.data)) {
      setSnap(gameRef.current.snapshot()); setScreen('game');
      CL.audio.resume(); pushToast('Partita caricata. Bentornato!', 'good');
    }
  };

  const openSettings = from => { setSettingsFrom(from || screen); setScreen('settings'); };
  const applyChoice = action => {
    const g = gameRef.current;
    if (!g) return;
    try { g.handleAction(action.action, action.data || {}, null); }
    catch (e) { console.error(e); pushToast('Azione non riuscita, la partita continua.', 'bad'); }
  };

  const handleCanvasTap = e => {
    const g = gameRef.current; if (!g || !g.debug) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 480 / rect.width, scaleY = 270 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    // SBLOCCA button: x 4..90, y 64..78
    if (x >= 4 && x <= 90 && y >= 64 && y <= 78) {
      try { CL.ui.closeAll && CL.ui.closeAll(); } catch(err) {}
      g.unstuckPlayer(false);
      g.dbg.blocked = 'manual-unstuck';
      setDlg(null); setMenu(null); setConfirm(null);
      pushToast('Diagnostica: sblocco forzato eseguito.', 'info');
    }
  };

  return (
    <div id="stage">
      <canvas id="game" ref={canvasRef} width="480" height="270" aria-label="Mondo di Campania Life" onPointerDown={handleCanvasTap} />
      <div id="fade" className={snap && screen === 'game' ? '' : 'on'} />

      {screen === 'game' && <Hud snap={snap} onMenu={tab => setMenu({ tab, data: {} })} />}

      {screen === 'title' && <TitleScreen
        hasSave={hasSave}
        onNew={() => setScreen('create')}
        onContinue={continueGame}
        onSettings={() => openSettings('title')}
        online={CL.api.ready}
      />}

      {screen === 'create' && <CharacterCreation onStart={startGame} onBack={() => setScreen('title')} />}

      {screen === 'settings' && <SettingsPanel onBack={() => setScreen(settingsFrom)} onToast={pushToast} />}

      {screen === 'credits' && (
        <div className="screen">
          <div className="panel">
            <h2>CREDITI</h2>
            <p><b>CAMPANIA LIFE — Avventure tra Mare e Montagna</b><br />
              Un progetto originale. Sprite, mappe, musiche e testi sono generati o scritti per questo gioco.</p>
            <p className="muted">Frontend React · Motore Canvas 2D · Backend Python FastAPI · Database PostgreSQL.</p>
            <p className="muted">Geometrie stradali: © OpenStreetMap contributors — <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noreferrer">ODbL</a> — retrieve 2026-11-25.</p>
            <div className="panel-actions"><button onClick={() => setScreen('title')}>INDIETRO</button></div>
          </div>
        </div>
      )}

      {dlg && <DialogueBox dlg={dlg} onChoice={applyChoice} />}
      {menu && <PhoneMenu tab={menu.tab} data={menu.data} game={gameRef.current} onTab={tab => setMenu({ tab, data: {} })} onClose={() => setMenu(null)} onToast={pushToast} />}
      {confirm && <ConfirmDialog data={confirm} onClose={() => setConfirm(null)} />}
      <MobileControls visible={screen === 'game' && !menu && !dlg && !confirm} />
      <Toasts items={toasts} />
    </div>
  );
}
