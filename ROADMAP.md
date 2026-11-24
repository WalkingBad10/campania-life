# CAMPANIA LIFE / CAMPANIA OPEN CODE — ROADMAP di ripresa

**Aggiornato:** 25 novembre 2026 — punto di spegnimento sicuro.
**Repo:** `CampaniaLife` · branch locale `main` · remote `origin/main`.
**Stato pubblico:** online la versione funzionante precedente, commit `3609be9`, bundle remoto `index-DnHhzGjX.js`. Smoke test touch pubblico **OK** (`NUOVA PARTITA` → `napoli` `240,272` → movimento `240,228` → save `campania_life_save_v1` → `CONTINUA`).
**Importante:** il commit di revisione strutturale `4cf9f88` è stato pushato su `origin/main`, ma il deploy della workflow `45513882269` è stato **annullato deliberatamente** prima della pubblicazione. Non ripubblicare finché non è completata la verifica visiva finale.

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

### Test e documentazione
- [x] Regressione deterministico: **34/34 PASS**. Nuovi test: quattro direzioni W/A/S/D + frecce + animazioni distinte, footprint della guglia e collisioni, continuità stradale su 11 mappe e coerenza OSM della piazza.
- [x] Texture audit: 50 PNG referenziati / 50 distribuiti, 18/18 facciate senza campate vuote, 0 errori.
- [x] Render audit: 0 dimensioni errate, ancoraggi documentati.
- [x] Visual explore Playwright: 2 dispositivi × 26 mappe, 0 errori console/page, 0 occlusioni giocatore, 0 errori profondità, 0 errori geometria metrica.
- [x] `npm run test:mobile-start` su build locale: OK.
- [x] Build Vite locale e CI-like (`GH_PAGES_BASE=/campania-life/`): OK.
- [x] `git diff --check`: OK.
- [x] Documentazione aggiornata: `qa/campania-open-code-1/README.md`, `PROPORTIONS.md`, `references/SOURCES.md`.

---

## 2. In corso / interrotto allo spegnimento

- [ ] **Verifica estetica finale non completata.** Il modello corrente non supporta input immagine: gli screenshot nuovi (`qa/campania-open-code-1/macbook-*.png`, `pixel9proxl-*.png`) sono stati rigenerati, ma il confronto visivo con fotografie/OSM richiede occhio umano o strumento multimodale esterno. **Non dichiarare superato il controllo grafico solo con metriche numeriche.**
- [ ] Workflow `45513882269` annullata (`cancelled`) per evitare il deploy del commit non ancora verificato visivamente. Non riavviare finché non si decide di pubblicare `4cf9f88`.
- [ ] `origin/main` è su `4cf9f88`; il sito pubblico resta però sulla build `3609be9` / `index-DnHhzGjX.js`. Il commit del `ROADMAP.md` è locale e nel branch/tag di backup: **non è stato pushato su `main`** per non innescare la workflow.

---

## 3. Da fare alla riapertura — riprendere esattamente da qui

1. Verificare che la workflow annullata sia ancora `cancelled` e che il sito pubblico mostri ancora `index-DnHhzGjX.js`.
2. Rivedere visivamente, su MacBook e Pixel 9 Pro XL reali, le nuove screenshot di Piazza del Gesù, Gesù/Guglia/Campanile, bar/metro e almeno due mappe per zona. Cercare specificamente:
   - rettangoli opachi sotto alberi, panchine o lampioni;
   - texture vecchie sovrapposte, muri in mattoni senza funzione, finestre isolate, muri interrotti, facciate duplicate, pavimentazioni incoerenti;
   - edifici usati come adesivi sopra strutture preesistenti;
   - personaggio che attraversa, sprofonda o scompare nelle strutture;
   - luci attenuate dalla velatura e salti di prospettiva.
3. Se la verifica visiva è positiva: pushare `main` (che include il commit del `ROADMAP.md`), attendere la nuova GitHub Actions, confermare build/deploy e ripetere `npm run test:mobile-start` sul sito pubblico. Aggiornare i run ID finali nel `qa/campania-open-code-1/README.md`.
4. Se la verifica visiva trova difetti: correggere partendo dal branch `backup/pre-shutdown-2026-11-25`, rieseguire tutti i gate e solo poi pubblicare. Non ripristinare il checkpoint `51a22c0` a meno che la revisione non risulti irreparabile.
5. Non ripristinare lo step CI `Install Playwright Chromium`: `mobile-start.mjs` usa il fallback al Chrome di sistema.
6. Aggiornare `README.md` / documentazione con il run di deploy finale effettivo, dopo la pubblicazione.

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
- Bundle di backup fuori dal repo: `../CampaniaLife-backup-2026-11-25.bundle`.
- Ripristino:
  ```bash
  git fetch --all --tags
  git checkout backup/pre-shutdown-2026-11-25
  # oppure, solo se serve davvero:
  git reset --hard checkpoint/pre-shutdown-2026-11-25
  ```
- Non usare `--force` su `main` e non cancellare il branch di backup.
