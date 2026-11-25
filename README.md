# CAMPANIA LIFE — Avventure tra Mare e Montagna

Open world 2D in pixel art, giocabile nel browser. Simulatore di vita, esplorazione della Campania, lavori, economia, immobili, trasporti, relazioni, attività commerciali, missioni e creature collezionabili originali.

**Stack:** React 18 + Vite (frontend) · motore Canvas 2D scritto in JavaScript vanilla (gioco) · Python FastAPI (backend) · PostgreSQL (database).

> Tutti i contenuti (sprite, creature, nomi, mappe, musiche procedurali, testi) sono originali e generati a runtime. Nessun asset o codice di terze parti protetto.

---

## Struttura

```
CampaniaLife/
├── client/
│   ├── index.html                 # entry Vite
│   ├── package.json
│   ├── vite.config.js             # proxy /api → backend
│   └── src/
│       ├── main.jsx               # bootstrap React + caricamento motore
│       ├── App.jsx                # orchestrazione schermate e ponte UI↔motore
│       ├── styles.css
│       ├── components/            # HUD, dialoghi, telefono, menu, title…
│       └── game/                  # motore autonomo (window.CL)
│           ├── core.js            # utility, input, camera, gfx, audio, save
│           ├── data.js            # contenuti originali
│           ├── art.js             # pixel art procedurale
│           ├── maps.js            # mappe generate deterministicamente
│           ├── systems.js         # tempo, bisogni, economia, quest, API
│           ├── entities.js        # giocatore, PNG, veicoli, creature
│           └── engine.js          # loop, rendering, interazioni
├── server/
│   ├── requirements.txt
│   ├── .env.example
│   ├── sql/001_init.sql           # schema PostgreSQL canonico
│   └── app/
│       ├── main.py                # FastAPI, CORS, lifespan, static
│       ├── config.py              # impostazioni da .env
│       ├── database.py            # engine async + init schema
│       ├── models.py              # ORM SQLAlchemy
│       ├── schemas.py             # validazione Pydantic
│       ├── security.py            # JWT + bcrypt
│       └── routers/               # auth, saves, profile
└── docs/                          # game design, art bible, roadmap, API
```

---

## Avvio

### 1. PostgreSQL

Crea un database (es. `campania_life`) e copia `server/.env.example` in `server/.env`, impostando `DATABASE_URL` e una `SECRET_KEY` casuale. Lo schema viene creato automaticamente all'avvio dell'API.

```sql
CREATE DATABASE campania_life;
```

### 2. Backend

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Verifica: `curl http://localhost:8000/health`.

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

Apri <http://localhost:5173>. Vite inoltra `/api` al backend. Il gioco funziona anche **senza backend**: in quel caso usa il salvataggio locale (`localStorage`) e l'account risulta opzionale.

### Build di produzione

```bash
cd client && npm run build
cd ../server && uvicorn app.main:app --port 8000
```

Se `client/dist` esiste, FastAPI serve direttamente il client su <http://localhost:8000>.

---

## Comandi

| Tasto | Azione |
|---|---|
| Frecce / WASD | Movimento |
| Shift | Corsa |
| E | Interagisci / parla / entra / monta veicolo |
| Q | Lancia la rete alla creatura più vicina |
| Space / Invio | Conferma |
| 1–5 | Usa cibo dalla barra rapida |
| Tab | Telefono (lavori, banca, immobili, mappa, collezione…) |
| I / M / J / C | Zaino / mappa / missioni / collezione |
| Esc | Menu / chiudi |

---

## Cosa c'è già in 1.0

- **Mondo**: 26 mappe — 11 zone esterne ricostruite con geometria OpenStreetMap reale (Napoli, Costiera, Vesuvio, Pompei, Capri, Bacoli, Salerno, Avellino, Caserta, Fuorigrotta, Pianura) e 15 interni esplorabili.
- **Ciclo di vita**: orologio, giorni, meteo, bisogni (fame, sete, energia, umore, igiene), sonno, svenimento.
- **Economia**: contanti, banca, 5 lavori con turni e requisiti, negozi, vendita, rendite immobiliari, 4 immobili acquistabili.
- **Mezzi**: bicicletta, Vespa, utilitaria, battello per Capri.
- **Sociale**: 12 PNG con affinità, regali, consigli, appuntamenti.
- **Creature**: 9 specie originali con habitat, rarità, cattura con reti e collezione.
- **Missioni**: 20 quest reali con NPC assegnante, dialoghi introduttivi, obiettivi verificati, destinazioni raggiungibili, ricompense economiche, diario (disponibili/attive/completate) e incarichi ripetibili integrati con l'economia. Nessun completamento automatico.
- **UI React**: HUD, minimappa, dialoghi a scelta, telefono con 12 sezioni, impostazioni, salvataggio esportabile/importabile.
- **Backend**: registrazione/login JWT, salvataggio JSONB versionato, sincronizzazione personaggio/obiettivi, classifica, health check.

Dettagli in [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md), [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md), [`docs/API.md`](docs/API.md) e [`docs/ROADMAP.md`](docs/ROADMAP.md).

---

## Geografia OSM e attribuzione

`qa/campania-open-code-1/osm_projection.py` è l'entry point operativo: legge i bbox OpenStreetMap reali, li proietta nel sistema metrico del gioco e genera `client/src/game/osm-geometry.js`. `MAPS.get()` applica l'overlay dopo lo switch e prima di `expandInterior`/cache, con layer protetto: spawn, portali, POI, porte, checkpoint, decori e percorsi già giocabili non vengono cancellati. Solo le 11 mappe esterne ricevono geometrie OSM; i 15 interni restano invariati.

Pianura è stata riscritta sulle way verificate (Piazza San Giorgio `580193824`, chiesa `148046054`, municipio `262236201`, Via Cannavino `79304873`, Via Comunale Napoli `144836104`, Via Vicinale Campanile `93858449`, Via Provinciale Napoli `506980149`, Via Montagna Spaccata `413715585`). La stazione Circumflegrea (node `4936292644`) è fuori bbox e **non** è stata inventata in piazza; restano solo il varco metro e la targa direzionale per Bar Etoile, verificato su way `4243839` a 1,82 km.

Dati: **© OpenStreetMap contributors — ODbL — retrieve 2026-11-25**; licenza `https://opendatacommons.org/licenses/odbl/1-0/`. Le foto Wikimedia in `qa/campania-open-code-1/photo-refs/` sono solo riferimento QA, mai copiate nei pixel.

## UI responsive e rotazione

Il canvas logico resta **480 × 270**: portrait/landscape cambiano solo layout CSS, classi `is-portrait`/`is-landscape` e safe-area. Non vengono toccati `VIEW_W/VIEW_H`, camera, `gameRef`, `screen`, mappa, posizione del giocatore, salvataggi né rimontaggi del canvas. Il dock a icone (mappa, inventario, missioni, telefono, portafoglio, profilo, lavori, impostazioni, salvataggio) è chiuso di default in alto a destra, lontano dallo joystick touch.

## Gate automatici

- `node client/scripts/regression.mjs`: **42/42** (motore, collisioni, OSM, 20 missioni, economia, migrazione salvataggi v1).
- Playwright **1.65.1** (con Node 26 il runner 1.52 non scopriva alcun test): boot, Portali/camminata reale, rotazione portrait↔landscape con stesso game e save, touch, menu, console.
- `visual-explore.mjs`, `texture-audit.mjs`, `render-audit.mjs`, `npm run test:mobile-start`, build Vite e `git diff --check`.

**Limite dichiarato**: fin qui le evidenze sono emulazione Playwright/Chromium, non dispositivi fisici. La verifica finale su MacBook e Google Pixel 9 Pro XL resta richiesta; il marker `BETA PUBBLICA · Richiede verifica manuale su MacBook e smartphone` rimane finché non arriva il riscontro.
