# PROJECT_STATUS — Campania Life

**Data aggiornamento:** 2026-11-23  
**Build:** 0.2.0-intermediate (non Release 1.0)  
**Stato:** avviabile e verificabile in locale; copertura molto parziale rispetto al documento master.

## Cosa è stato verificato in questa sessione

- **Client build**: `npm run build` (Vite/React) completato con successo.
- **Engine smoke (browser, file:// smoke.html)**: inizializzazione, 180 tick, render, cambio mappe (`napoli`, `costiera`, `vesuvio`, `pompei`, `capri`, interni), meteo temporale, economia, quest, cattura, export/import salvataggio — nessun errore console.
- **Backend FastAPI + PostgreSQL**: avvio con schema SQL idempotente; verificati `GET /health`, `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT/GET /api/saves/current`, `GET /api/profile/me`, `GET /api/leaderboard`.
- **Fix applicati**: typo meteo `temporale`, import React errato in `DialogueBox`, compatibilità Python 3.9 (`from __future__ import annotations`), rimozione dipendenza `citext` non disponibile nel Postgres embed usato nei test, sostituzione passlib/bcrypt con bcrypt diretto, serializzazione UUID in UserOut.

## Cosa esiste (intermedio)

- Frontend React + Canvas 2D con motore JS modulare (`window.CL`).
- 5 zone overworld + interni base, NPC, dialoghi, economia base, lavori, immobili, 9 creature originali, 5 missioni, 8 obiettivi, ciclo giorno/notte, meteo, bisogni.
- Salvataggio locale + API cloud opzionale (JWT, JSONB versionato).
- Documentazione iniziale in `docs/`.

## Gap principali rispetto al documento master 1.0

Il documento master richiede uno scope molto più ampio della build attuale. Mancano, tra gli altri:

- **Mondo reale Campania completo**: Piazza del Gesù Nuovo dettagliata, Spaccanapoli, Toledo, Quartieri Spagnoli, Plebiscito, Fuorigrotta, Pianura, Bacoli, Caserta, Avellino, Salerno, collegamenti geografici coerenti.
- **Scala/coerenza artistica**: sistema tile/unità mondo formalizzato, audit proporzioni, depth/collisioni per tutti gli oggetti alti (es. guglia).
- **Interni visitabili** completi e coerenti per edifici principali.
- **Simulazione vita** completa: salute, bollette, routine NPC evolute, eventi cittadini, conseguenze persistenti.
- **Economia/lavori** interattivi (non solo turni), stipendi/orari/compiti.
- **Immobili**: affitto, vendita, arredo posizionabile, inviti, famiglia.
- **Relazioni/famiglia**: fiducia, convivenza, matrimonio, figli, memoria eventi.
- **Veicoli**: fisica guida, parcheggio, manutenzione, proprietà persistente.
- **Trasporti pubblici**: treni, metro, bus, fermate reali, biglietti, attesa, salita/discesa, mezzi visibili.
- **Piattaforme**: packaging Android/iPhone/Windows/macOS, test reali su device.
- **QA completo**: test automatizzati, regressione, performance, recovery salvataggi, report evidenze.

## Decisione tecnica (da rivalutare)

- **Stack attuale**: React + Canvas JS + FastAPI + PostgreSQL. Soddisfa la richiesta iniziale dell’utente.
- **Master doc**: suggerisce TypeScript + Phaser/equivalente. Non ho migrato in questa sessione per non distruggere la build funzionante; la migrazione va pianificata come decisione esplicita con piano di compatibilità asset/salvataggi.

## Prossimi passi prioritari

1. Formalizzare Day Zero/continuità: git, CHANGELOG, TEST_REPORT, ARCHITECTURE, ART_STYLE_GUIDE, WORLD_MAP, ROADMAP aggiornata.
2. Definire sistema di scala/coordinata mondo e convenzioni mappe.
3. Implementare Fase 1 master: Piazza del Gesù Nuovo dettagliata, ingresso chiesa, bottega con transazione reale, NPC, salvataggio verificato.
4. Introdurre test automatici minimi (smoke engine, API, build) e CI locale.
5. Espandere a Napoli centro storico solo dopo criteri di qualità della piazza.