# CAMPANIA LIFE / CAMPANIA OPEN CODE — ROADMAP di ripresa

**Aggiornato:** 25 novembre 2026 — revisione qualitativa completata e pubblicata sullo stesso URL.
**Repo:** `CampaniaLife` · branch locale `main` · remote `origin/main`.
**Stato pubblico corrente:** revisione qualitativa `b7f2716`, bundle remoto `index-CWJT4Ahe.js`, workflow `45616242811` `success` (build `139212256590`, deploy `139212645019`). Smoke test pubblico **OK**: `NUOVA PARTITA` → `napoli` `240,272` → WASD quattro direzioni + corsa + idle → joystick quattro direzioni → movimento `229,272` → save `campania_life_save_v1` → `CONTINUA` `229,272`. Marker beta, chiave save, `blockedBox`, `doorClosed` e `awningSprite` presenti nel bundle remoto. Pubblicazione precedente: `c9fddbd`, bundle `index-BK9wvC9o.js`, workflow `45606128039`.
**Checkpoint della revisione qualitativa:** `checkpoint/pre-quality-review` / `backup/pre-quality-review` su `4cd0e35`, con bundle `../backup/pre-quality-review/CampaniaLife-4cd0e35.bundle`.
**Nota:** la workflow `45513882269` era stata annullata deliberatamente prima della revisione visiva; la pubblicazione finale precedente è avvenuta sullo stesso URL con la workflow `45606128039`.

---

## 1. Completato

### Revisione strutturale CAMPANIA OPEN CODE 1 — Piazza del Gesù Nuovo
- [x] Checkpoint precedente `checkpoint/pre-structural-review` / `backup/pre-structural-review` su `51a22c0` creato e mai ripristinato.
- [x] Geometria ricalibrata sui dati OSM/Overpass verificati:
  - piazza `way 563345000`, 93,8 × 76,4 m, asse 29,7°, `surface=sett`;
  - guglia `way 261256738`, 15,7 × 15,6 m, 12,6 m a ovest del centro;
  - Gesù `way 261249895`, prospetto 56 m;
  - Santa Chiara `way 261250167`, a ESE/sud della guglia, massa estesa fino alla riga 33;
  - campanile `way 150562144`, ingombro 17,6 × 17,3 m, impronta di gioco 9 × 9 celle;
  - Spaccanapoli/`way 27179692`, raccordo pedonale ENE da `(66,25)` a `(71,19)`;
  - `paving_stones` solo nei connettori, basolato nel centro storico.
- [x] Spawn `(240,272)`, POI guglia `(36,26)`, impronta guglia `34,25,4x3`, edicola `(38,34)`, portali, corridoio metro `56,21..28` e 26 mappe invariati.
- [x] Panni stesi ancorati ai balconi del fronte sud (riga 40), non attraverso la piazza.
- [x] Pavimentazione estesa solo dove non ci sono masse, portali o corsie; nessuna strada automotive nelle aree pedonali.

### Motore, asset e rendering
- [x] `CL.art.loadAssets()` espone `imagesReady` / `imagesLoaded`; cache `bld:*` e `w:p:*` invalidate quando tutti gli asset M1 sono pronti.
- [x] Pipeline separata: suolo → facciate/strutture → oggetti ed entità ordinati per profondità → `drawAtmosphere()` → `drawLights()` → `drawHud()`. Le luci non sono più attenuate dalla velatura notturna.
- [x] `drawScenicBackdrop(c, bg, m)`: maschera radiale (`globalAlpha = .14`) invece del rettangolo opaco degli sfondi M1 degli interni.
- [x] M1 restano fonte autorevole per Napoli; le zone nuove usano `metric_facade` con `d.data.type`.
- [x] Chiave di sort alberi invariata: `ty * T + 16` (corretta, perché `_tree()` è 32 × 40 e viene disegnato a `ty * T - 24`).

### Animazioni e input
- [x] `character(look, dir, frame, mode)` con cache `w:c2:` e `_character(..., mode)` con cache `c5`.
- [x] Tre set distinti per le quattro direzioni: `idle` (2 frame, respiro), `walk` (4 frame), `run` (falcata e braceggio ampliati, lean laterale).
- [x] `Player.mode`, `Player.idleT`, avanzamento frame idle e `run` da `CL.input.isDown('run')`.
- [x] Direzione conservata da fermo e quando il movimento è bloccato da collisione.
- [x] `CL.input.KEYMAP` esposto ai test; W/A/S/D e frecce producono gli stessi assi del joystick touch.
- [x] Bug touch «NUOVA PARTITA» già corretto in `MobileControls.jsx`: listener globali `touchend` con `preventDefault()` bloccavano il click React; ora gating su `visible` e rimozione dei `preventDefault()` passivi.

### Consolidamento finale sulle 26 mappe
- [x] Audit paralleli completati: texture/muri sovrapposti, geografia/strade, interni/proporzioni. Difetti concreti trasformati in patch minime.
- [x] Corpi edilizi sotto le facciate M1: nuovo tile solido neutro `b` e helper `mass()`, nessun laterizio o finestra finta affiora ai bordi degli sprite.
- [x] Reggia di Caserta, Castello di Arechi e palazzo del lungomare di Salerno usano facciate metriche dedicate invece di finestre random sul muro.
- [x] Viabilità OSM: Via Benedetto Croce/Spaccanapoli pedonali (`highway=pedestrian`, `surface=sett`), traffico ambientale solo sui vicoli residenziali; incroci restaurati a Fuorigrotta, Via Spiaggia e Via Ortensio a Bacoli, assi residenziali di Pianura, carreggiata continua a Caserta, spunti pedonali a Avellino.
- [x] Accessi e interni: portale della chiesa allineato alla porta, panche sulle collisioni, forno e tornelli allineati, nuove ali con fascia muraria e soglie `Y`, decor dell'appartamento/Casetta di Amalfi non più cancellati, passo di piano 26 px (3,25 m).
- [x] `mobile-start.mjs` verifica esplicitamente su build locale e CI-like: nuove partita, WASD quattro direzioni, corsa, idle, joystick quattro direzioni, salvataggio e «CONTINUA».

### Test e documentazione
- [x] Regressione deterministico: **34/34 PASS**. Nuovi test: quattro direzioni W/A/S/D + frecce + animazioni distinte, footprint della guglia e collisioni, continuità stradale su 11 mappe e coerenza OSM della piazza.
- [x] Texture audit: 50 PNG referenziati / 50 distribuiti, 21/21 facciate senza campate vuote, 0 errori.
- [x] Render audit: 0 dimensioni errate, ancoraggi documentati.
- [x] Visual explore Playwright: 2 dispositivi × 26 mappe, 0 errori console/page, 0 occlusioni giocatore, 0 errori profondità, 0 errori geometria metrica.
- [x] `npm run test:mobile-start` su build locale: OK.
- [x] Build Vite locale e CI-like (`GH_PAGES_BASE=/campania-life/`): OK.
- [x] `git diff --check`: OK.
- [x] Documentazione aggiornata: `qa/campania-open-code-1/README.md`, `PROPORTIONS.md`, `references/SOURCES.md`.

### Revisione qualitativa CAMPANIA OPEN CODE 1 (dopo il riscontro negativo)
- [x] Prese in carico le lamentele senza ripristinare checkpoint: corrette collisioni dall'impronta a terra, porte chiuse, profondità delle facciate, arredo, veicoli, edifici, luci e sprite.
- [x] `MAPS.blockedBox()`, `MAPS.doorClosed()`, `MAPS.propBlocks()` e `engine.canStand()` usati da giocatore, NPC, veicoli, `safePoint()`, `unstuckPlayer()` e pathfinding.
- [x] Righe murarie cancellate ripristinate, masse riallineate, Santa Chiara limitata alla riga 29, panni ancorati ai balconi, impronte dichiarate per arredo e cartelli.
- [x] Traffico riscritto: sei modelli, quattro direzioni, corsia destra, impronta ruotata, ombre, solo su strade `r`.
- [x] Pipeline `ART` riscritta per disegnare gli sprite mondo alla scala metrica finale: nessun doppio downscale, trasparenza verificata, nessun rettangolo scuro sul giocatore di notte.
- [x] Finiture generate ex novo (tende pieghettate, cornici con dentelli, balconi traforati, colonne scanalate, archi, panni, luci notturne) invece di rettangoli piatti.
- [x] Pacchetti CC0 Kenney *RPG Urban Pack* e *Tiny Town* valutati e scartati: tile di terreno/muratura, nessun veicolo top-down a quattro direzioni, stile incompatibile con le facciate M1 e il sistema 8 px/m.
- [x] Regressione estesa a **37/37 PASS**: impronta completa e porte chiuse, veicoli orientati/corsie, profondità delle facciate.
- [x] Render audit esteso a dimensioni metriche, angoli trasparenti e nuove finiture: **0 errori**.
- [ ] Revisione estetica umana su MacBook/Pixel fisici: il modello corrente non legge immagini; le screenshot aggiornate restano il materiale per il riscontro finale.

---

## 2. Stato dei controlli

- [x] Tutti i gate automatici rieseguiti dopo la revisione qualitativa: regressione `37/37`, texture audit `21/21` facciate e `50/50` PNG, render audit `0` errori, visual explore `0` errori su 52 visite, `mobile-start` locale, CI-like e pubblico `OK`, build Vite e CI-like `OK`, `git diff --check` `OK`.
- [x] Checkpoint qualitativo creato su `4cd0e35`: tag `checkpoint/pre-quality-review`, branch `backup/pre-quality-review` e bundle `../backup/pre-quality-review/CampaniaLife-4cd0e35.bundle`.
- [x] Checkpoint storico di pubblicazione su `e4271d2`: tag `checkpoint/pre-final-publish`, branch `backup/pre-final-publish` e bundle `../CampaniaLife-backup-2026-11-25-final.bundle` verificato.
- [ ] **Verifica estetica fisica non sostituibile dal modello.** Il modello corrente non supporta input immagine: gli screenshot (`qa/campania-open-code-1/macbook-*.png`, `pixel9proxl-*.png`) e le analisi programmatiche non equivalgono all'occhio umano. La pubblicazione procede su autorizzazione esplicita dell'utente; resta utile una revisione umana su MacBook/Pixel fisici.

---

## 3. Pubblicazione autonoma

1. [x] Pubblicazione precedente completata senza attendere ulteriore conferma: workflow `45606128039`, bundle `index-BK9wvC9o.js`, smoke pubblico OK.
2. [x] Committato e pushato `main` con la revisione qualitativa (`b7f2716`), senza attendere ulteriore conferma: autorizzazione esplicita dell'utente dopo il superamento dei controlli.
3. [x] GitHub Actions `45616242811` completata: `build` `139212256590` e `deploy` `139212645019` entrambi `success`.
4. [x] `npm run test:mobile-start` ripetuto sul sito pubblico: NUOVA PARTITA, WASD, joystick touch, save `campania_life_save_v1` e CONTINUA tutti OK.
5. [x] Run ID finali e bundle remoto aggiornati in questo file e in `qa/campania-open-code-1/README.md`.
6. Non ripristinare lo step CI `Install Playwright Chromium`: `mobile-start.mjs` usa il fallback al Chrome di sistema.
7. Non ripristinare `checkpoint/pre-structural-review` (`51a22c0`) né `checkpoint/pre-quality-review` (`4cd0e35`): le correzioni successive sono la fonte autorevole.

---

## 4. Istruzioni da conservare integralmente

> «Non voglio più mappe assemblate con texture casuali. Voglio ambienti progettati professionalmente, proporzionati, dettagliati e fedeli alla Campania reale.»

- Rimuovere texture vecchie sovrapposte, muri in mattoni senza funzione, finestre isolate, muri interrotti, facciate duplicate, pavimentazioni incoerenti e sfondi quadrati sotto alberi/panchine/lampioni.
- Non usare sprite di edifici come adesivi sopra strutture preesistenti: ogni edificio deve avere tetto, facciata, pareti laterali, ingressi e balconi collegati, proporzioni reali e prospettiva RPG dall’alto a tre quarti uniforme.
- Ricostruire strade da OSM/Overpass, fotografie e satellitari: incroci, marciapiedi, vicoli, attraversamenti, accessi. Rispettare il basolato del centro storico; nessuna strada automotive dove esistono aree pedonali.
- Separare impronta a terra, collisioni, altezza grafica e profondità. Evitare che il personaggio attraversi, sprofondi o scompaia nelle strutture.
- WASD: `W` alto, `A` sinistra, `S` basso, `D` destra. Sprite direzionali originali per quattro direzioni con camminata, corsa e inattività; cambiamento direzione da fermo e conservazione dell’ultima direzione; stesso comportamento per frecce e joystick touch.
- Aumentare dettaglio di personaggi/NPC, auto/moto, palazzi, bar/pizzerie, monumenti/chiese, balconi/persiane/panni stesi, tavolini/sedie/insegne, alberi/fioriere/vegetazione e interni visitabili.
- Aggiungere test specifici per quattro direzioni WASD, collisioni, sovrapposizioni e continuità delle strade. Non dichiarare superato il controllo grafico solo con metriche numeriche.
- Preservare funzionalità, salvataggi, 26 mappe, «Nuova partita» e pubblicazione sullo stesso URL.
- Mantenere checkpoint ripristinabile, eseguire tutti i test, verificare GitHub Actions e pubblicare solo su `https://walkingbad10.github.io/campania-life/`.

---

## 5. Invarianti tecniche da non rompere

- `PX_PER_M = 8`; `TILE = 16 px = 2,0 m`; adulto `1,70 m = 13,6 px`; `WORLD_SCALE = 8 / (23/1,70)` applicato una sola volta via `_world()` in `art.js`.
- Save key esatta: `campania_life_save_v1`, forma `{ v:1, t, data }`.
- Marker esatto: `BETA PUBBLICA · Richiede verifica manuale su MacBook e smartphone`.
- Spawn Napoli `240,272`; guglia base `34,25,4x3`, POI `36,26`; edicola `38,34`; `palazzo_e` altezza `5*T`; corridoio metro `56,21..28` percorribile.
- `U` lampione e `E` panchina solidi; `G`, `Y`, `D`, `d`, `e` attraversabili.
- Portali, POI, missioni, negozi, interazioni e formato salvataggi invariati.
- Debug player nascosto di default (`?debug=1` o `?dbg=1`).
- `render-audit.mjs` esclude deliberatamente `unknown`, `prop:*` e `building:gesu` con `minY >= -8`: non ripristinare falsi positivi.

---

## 6. Checkpoint e backup

- Checkpoint storico: tag `checkpoint/pre-structural-review`, branch `backup/pre-structural-review`, commit `51a22c0`.
- Checkpoint di spegnimento: tag `checkpoint/pre-shutdown-2026-11-25`, branch `backup/pre-shutdown-2026-11-25`.
- Checkpoint pre-pubblicazione finale: tag `checkpoint/pre-final-publish`, branch `backup/pre-final-publish`, entrambi su `e4271d2`.
- Checkpoint pre-revisione qualitativa: tag `checkpoint/pre-quality-review`, branch `backup/pre-quality-review`, entrambi su `4cd0e35`, con bundle `../backup/pre-quality-review/CampaniaLife-4cd0e35.bundle`.
- Bundle di backup fuori dal repo: `../CampaniaLife-backup-2026-11-25.bundle` e `../CampaniaLife-backup-2026-11-25-final.bundle` (verificato).
- Ripristino:
  ```bash
  git fetch --all --tags
  git checkout backup/pre-shutdown-2026-11-25
  # oppure, solo se serve davvero:
  git reset --hard checkpoint/pre-shutdown-2026-11-25
  ```
- Non usare `--force` su `main` e non cancellare il branch di backup.
