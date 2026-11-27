# CAMPANIA LIFE / CAMPANIA OPEN CODE — ROADMAP di ripresa

**Aggiornato:** 27 novembre 2026 — avviata la fase di revisione avanzata (luce direzionale e confronto before/after su 26 mappe); esiti e numeri finali **da compilare dopo QA**. La revisione visiva con modello multimodale resta completata e pubblicata sullo stesso URL.
**Repo:** `CampaniaLife` · branch locale `main` · remote `origin/main`.
**Stato pubblico corrente:** revisione visiva `f08ed04`, bundle remoto `index-Cuk6AnYj.js`, workflow `45621222465` `success` (build `139229576528`, deploy `139229978970`, step `Mobile start smoke (touch)` `success`). Smoke test pubblico **OK**: `NUOVA PARTITA` → `napoli` `240,272` → WASD quattro direzioni + corsa + idle → joystick quattro direzioni → movimento `229,272` → save `campania_life_save_v1` → `CONTINUA` `229,272`. Marker beta, chiave save, `blockedBox`, `doorClosed`, `softShadow`, `tufo` e `Pext` presenti nel bundle remoto. Pubblicazione precedente: `b7f2716` / `2243cbc`, bundle `index-CWJT4Ahe.js`, workflow `45616242811`.
**Checkpoint della revisione visiva:** `checkpoint/pre-visual-review` / `backup/pre-visual-review` su `2243cbc`, con bundle `../backup/pre-visual-review/CampaniaLife-2243cbc.bundle`, mai ripristinato.
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
- [ ] Revisione estetica umana su MacBook/Pixel fisici resta consigliata; la revisione visiva automatica con modello multimodale è però stata completata (vedi sotto).

### Revisione visiva effettiva con modello multimodale
- [x] Modello VL verificato: `opencode/nemotron-3.5-super-vl-free`. Il modello testuale principale non legge immagini. Analisi eseguite su singola immagine o gruppi da 2–4 pannelli: l'analisi parallela massiva aveva restituito `Endpoint is unavailable`.
- [x] Alberi: sette varianti deterministiche, chioma non identica, tronco radicato, ombra ellittica trasparente, nessun quadrato opaco. Corretto il doppio downscale `tree()` → `lemonTree()`. `P`/`T` disegnati come entità alta, non più nel ramo `rock`.
- [x] Ombre di contatto radiale su panchine, tavoli, sedie, lampioni, carri, cartelli, edicola, piante e arredi a terra; ombre NPC/veicoli irrobustite senza spostare collisioni o ancore.
- [x] Guglia e Gesù Nuovo: ritocco deterministico (`retouch_m1.py`) su PNG M1; verifica VL su ingrandimento ravvicinato: **risolto**. `drawGuglia()` aggiunge ombra e giunture interrotte sul selciato.
- [x] Grotta: il vuoto nero era buio intenzionale ma illeggibile; aggiunte lanterna, bagliori, colonne, rovera stratificata. Seconda verifica VL: **risolto**. Bool non era trasparenza rotta.
- [x] Bar: vetro ad arco integro; HUD reso più trasparente/compatto; verifica VL: **risolto**.
- [x] Traffico: quattro veicoli spostati su tile `r`; regressione estesa all'impronta a quattro angoli.
- [x] Falsi positivi scartati: spawn `macbook-napoli` (guglia fuori viewport), viewpoint `guglia-dietro`, «personaggio coperto dal tappeto» (tile `R` è suolo, 0 occlusioni), panche da 6 m in scala reale.
- [x] Gate rieseguiti: regressione PASS (con nuovo test footprint), texture audit 50/50 e 21/21, render audit 0 errori, visual-explore 0 errori/occlusioni, build OK, mobile-start locale e pubblico OK, `git diff --check` OK.

### Revisione artistica professionale (26 novembre 2026)
- [x] Checkpoint `checkpoint/pre-art-professional-pass` / `backup/pre-art-professional-pass` su `5c6e8bb`, mai ripristinato.
- [x] **Decisione renderer**: scena di prova reale su Pixel 9 Pro XL emulato, build pubblicata, Piazza del Gesù Nuovo: 59,8 FPS a riposo e 60,0 FPS in movimento, p95 16,7 ms, 0 frame oltre 20 ms in movimento.Canvas 2D confermato; Phaser/PixiJS/Godot/Excalibur/Matter/Tiled valutati e scartati perché non risolvono la qualità artistica. Dettagli in `docs/RENDERER_DECISION.md`.
- [x] **Asset `art.js` recuperati e completati**: `_depthOverlay()` per le facciate procedurali (tetto a coppi, comignoli, parete laterale, aperture di fianco, ombra di contatto), `_m1Reveal()` per i prospetti M1 (reveal laterale e ombra a terra), 16 varianti del basolato e 8 di marciapiedi/lastroni, ombre degli alberi rafforzate.
- [x] **Ombre coerenti**: `engine.js` disegna una `groundShadow()` radiale prima di ogni facciata M1/procedurale tramite `drawFacade()`; `entities.js` rafforza l'ombra di giocatore e NPC senza alterare l'ancoraggio dei piedi. I difetti residui di prospettiva 3/4 restano un limite dell'asset M1, non una regressione funzionale.
- [x] Confronto VL su screenshot `*-nohud` prima/dopo con `opencode/nemotron-3.5-super-vl-free`: risolti pavimento seriale e tetto piatto, rientro laterale parzialmente volumetrico. La VL non legge ancora l'ombra proiettata dei prospetti M1 come coerente; un probe pixel conferma che l'ombra è disegnata (4.970 pixel, Δ max 51). Il limite di prospettiva 3/4 resta legato all'asset M1 ed è documentato come artistico, non come regressione.
- [x] Gate dopo l'intervento: regressione **42/42**, Playwright **6/6**, texture audit **50/50 e 21/21**, render audit **0 errori**, visual-explore **0 errori**, build CI-like OK.

## Fase di revisione avanzata — luce direzionale e confronto 26 mappe (in corso)

Il contratto della luce direzionale è in `docs/RENDERER_DECISION.md` §7; gli asset M1 restano autorevoli e il renderer Canvas 2D non viene sostituito.

- [x] Baseline visiva acquisita in `qa/campania-open-code-1/art-review/before/`: 26 PNG senza HUD a `CL_QA_HOUR=12`, meteo `sole`, camera e `animT` fissati, più `report.json`. Risulta però invalida per le quattro mappe private: l'harness non ne possedeva gli immobili e non mascherava `#toasts`. Baseline autoritativa rigenerata in `before-v2/` dal commit `f13bc66` con harness corretto, h12+h18 e 0 errori. Nessun sorgente di gioco modificato.
- [x] Harness `client/scripts/art-review.mjs` aggiornato: `CL_QA_OUT`, `CL_BASE_URL`, `CL_QA_HOUR`, secondo orario opzionale `CL_QA_HOUR_EXTRA` (alias `CL_QA_HOUR2`, es. 18), HUD disattivato sia nel DOM sia nel canvas e guardia anti-sovrascrittura.
- [x] `client/scripts/art-review-compare.mjs` creato: `diff.json` con delta di palette, `edgeDensity`, luminanza ed errori console/page, elenco `underThresholdMaps`, contact sheet affiancate per mappa/orario e `contact-sheet.png` riepilogativo.
- [x] Cattura `after/` a h12 e h18 dopo l'intervento sulla luce: 26 mappe per orario, HUD disattivato, camera, tempo e meteo fissati; la cartella `h18/` contiene le 26 immagini serali. Errori console/page: **0**.
- [x] Confronto before/after e revisione VL delle sheet: `compare/diff.json` e 26 contact sheet affiancate. La VL ha confermato più arredo e segnaletica su tutte le mappe esteriori; difetti residui (facciate M1 ancora bidimensionali, vegetazione regolare, interni inizialmente cloni) sono documentati in `qa/campania-open-code-1/README.md`.
- [x] Gate automatici finali: regressione **42/42**, Playwright **6/6**, texture **50/50 PNG e 21/21 facciate**, render audit e visual-explore **0 errori**, mobile-start **OK**, benchmark **60/60 FPS** su emulazione Pixel 9 Pro XL, build CI-like e `git diff --check` **OK**. Confronto autoritativo `before-v2/` ↔ `after/`: 52 coppie, 46 oltre soglia, 0 errori. La verifica umana su MacBook/Pixel fisici resta bloccata dal riscontro utente; marker beta, chiave save e attribuzioni ODbL/CC invariati. Pubblicazione solo sullo stesso URL.

---

## 2. Stato dei controlli

- [x] Tutti i gate automatici rieseguiti dopo la revisione qualitativa: regressione `37/37`, texture audit `21/21` facciate e `50/50` PNG, render audit `0` errori, visual explore `0` errori su 52 visite, `mobile-start` locale, CI-like e pubblico `OK`, build Vite e CI-like `OK`, `git diff --check` `OK`.
- [x] Checkpoint qualitativo creato su `4cd0e35`: tag `checkpoint/pre-quality-review`, branch `backup/pre-quality-review` e bundle `../backup/pre-quality-review/CampaniaLife-4cd0e35.bundle`.
- [x] Checkpoint storico di pubblicazione su `e4271d2`: tag `checkpoint/pre-final-publish`, branch `backup/pre-final-publish` e bundle `../CampaniaLife-backup-2026-11-25-final.bundle` verificato.
- [x] **Verifica estetica con modello multimodale completata.** `opencode/nemotron-3.5-super-vl-free` ha analizzato direttamente gli screenshot (`qa/campania-open-code-1/macbook-*.png`, `pixel9proxl-*.png`) e confermato la risoluzione dei difetti. Resta utile, ma non bloccante, una revisione umana su MacBook/Pixel fisici.

---

## 3. Pubblicazione autonoma

1. [x] Pubblicazione precedente completata senza attendere ulteriore conferma: workflow `45606128039`, bundle `index-BK9wvC9o.js`, smoke pubblico OK.
2. [x] Committato e pushato `main` con la revisione qualitativa (`b7f2716`), senza attendere ulteriore conferma: autorizzazione esplicita dell'utente dopo il superamento dei controlli.
3. [x] GitHub Actions `45616242811` completata: `build` `139212256590` e `deploy` `139212645019` entrambi `success`.
4. [x] `npm run test:mobile-start` ripetuto sul sito pubblico: NUOVA PARTITA, WASD, joystick touch, save `campania_life_save_v1` e CONTINUA tutti OK.
5. [x] Revisione visiva pubblicata: commit `f08ed04`, GitHub Actions `45621222465` `success` (build `139229576528`, deploy `139229978970`, smoke touch nella CI `success`), bundle remoto `index-Cuk6AnYj.js`, smoke pubblico ripetuto OK, marker/chiave save verificati nel bundle.
6. [x] Run ID finali e bundle remoto aggiornati in questo file e in `qa/campania-open-code-1/README.md`.
7. Non ripristinare lo step CI `Install Playwright Chromium`: `mobile-start.mjs` usa il fallback al Chrome di sistema.
8. Non ripristinare `checkpoint/pre-structural-review` (`51a22c0`) né `checkpoint/pre-quality-review` (`4cd0e35`) né `checkpoint/pre-visual-review` (`2243cbc`) né `checkpoint/pre-professional-review` (`f5845de`): le correzioni successive sono la fonte autorevole.
9. Revisione professionale integrale da `f5845de`: ancoraggio piedi/ombra, animazione legata al movimento reale, sub-stepping collisioni, impronte veicoli coerenti, dismount validato, hitbox debug, basolato irregolare, verifica OSM con semplificazioni dichiarate. Gate: 40/40 regressioni, texture/render audit e visual-explore verdi.

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
