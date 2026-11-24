import React from 'react';
import { createRoot } from 'react-dom/client';

// Motore di gioco (moduli plain JS che popolano window.CL).
import './game/core.js';
import './game/data.js';
import './game/art.js';
import './game/maps.js';
import './game/pathfinding.js';
import './game/systems.js';
import './game/routines.js';
import './game/entities.js';
import './game/engine.js';

import './styles.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

window.addEventListener('error', (e) => {
  console.error('[CL] global error', e.error || e.message, e);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[CL] unhandled rejection', e.reason);
});

CL.art.init();
createRoot(document.getElementById('root')).render(<ErrorBoundary><App /></ErrorBoundary>);
