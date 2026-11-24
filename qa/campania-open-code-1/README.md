# CAMPANIA OPEN CODE 1 — qualità visiva e fedeltà geografica

## Obiettivo
Ricostruire Piazza del Gesù Nuovo come **stanza urbana coerente**, non come insieme di asset posizionati a caso, mantenendo giocabilità, salvataggi e ancoraggi esistenti. In questo ciclo è stato applicato un pass visivo anche alle altre 23 mappe.

## Checkpoint ripristinabile
Prima delle modifiche di questo ciclo sono stati creati:

- tag `checkpoint/pre-vision-pass`
- branch `backup/pre-vision-pass`

Entrambi puntano a `51a78de` (ultimo ciclo pubblicato prima del pass visivo).

## Fonti usate (studio, non copia negli asset di gioco)
- OpenStreetMap API:
  - piazza: way `563345000`, centro `40.8470181, 14.2517696`, bbox `40.8466809..40.8473692`, `14.2512228..14.2523350`.
  - Chiesa del Gesù Nuovo: way `261249895`.
  - Guglia dell'Immacolata: way `261256738`, centro `40.8470094, 14.2516038`.
- Esri World Imagery: `references/satellite.jpg`.
- Wikimedia Commons / Wikipedia: foto e descrizione urbanistica in `references/SOURCES.md`.
- Confronto affiancato pronto per revisione umana: `confronto-visivo.jpg`.

La geometria reale è stata **semplificata alla griglia gameplay 16 px**, non replicata in scala metrica.

## Esito del confronto
Il testo di Wikipedia conferma l'impianto usato dalla graybox: obelisco al centro dello spiazzale, palazzi nobiliari a ovest (Pandola / Pignatelli di Monteleone), Gesù Nuovo e Santa Chiara sui lati opposti, Palazzo delle Congregazioni presso il Gesù. La facciata del Gesù è riconoscibile per il bugnato a punta di diamante in piperno; la guglia è in marmo bianco e bardiglio.

Il modello con capacità vision-language disponibile (`nemotron-3.5-super-vl-free`) è stato provato, ma ha raggiunto il limite gratuito. Di conseguenza il confronto è stato fatto con OSM/satellite, descrizioni delle fonti e analisi programmatica dei canvas. Le screenshot restano a disposizione per la **revisione umana**: le metriche numeriche non sono state trattate come prova di qualità estetica.

## Correzioni applicate in questo ciclo

### Napoli / Piazza del Gesù Nuovo
1. **Una sola facciata autorevole per massa edilizia**. Il compositore `ART.buildingSprite()` ora disegna l'asset M1 su uno sfondo opaco neutro; sono stati rimossi i vecchi strati procedurali con finestre, portoni e balconi generici. Nessuna facciata doppia, nessuna finestra fuori posto.
2. **Facciate allineate ai footprint**: Gesù `x8..47` della griglia (`384 px`) e fronte occidentale continuo `x0..13` (`224 px`). Rimossi i decor procedurali `facade_cornice` e `facade_balcony` che si sovrapponevano all'asset M1.
3. **Risoluzione e luce uniformi**: ogni facciata M1 viene rasterizzata a blocchi di 2 px con `imageSmoothingEnabled=false`, poi riceve cornice in cotto, basamento in piperno, texture minima e illuminazione coerente da sinistra/alto. Stessa palette e stessa direzione di luce su tutte le facciate.
4. **Arredo e flussi**: assi pedonali continui, filari laterali di lampioni/panchine, un solo banco di fiori, terrazza del caffè a sud-est. Spawn `240,272`, portali e POI esistenti invariati.
5. **Occlusione**: facciate e campanile restano sfondo architettonico, quindi il giocatore non sprofonda; monumenti, alberi e arredo restano nel sort per profondità. Probe dedicate davanti e dietro la guglia.

### Tutte le 24 mappe
- I pannelli diagnostici canvas e HUD sono disattivati di default: solo `?debug=1` li riattiva per QA.
- Le 14 mappe interne espanse ricevono ora la stessa finitura (pianta/lampada, o glow ambra nella grotta) senza nuove collisioni.
- Piccoli interventi geografici a basso rischio, tutti con tile a identica solidità o decor non solidi:
  - **Costiera**: piazzette pedonali fra le case e la strada, fioriere sui margini.
  - **Vesuvio**: cratere centrale aperto con anello roccioso, cartello sul sentiero.
  - **Pompei**: colonne sui muri solidi già esistenti, individuate deterministicamente.
  - **Capri**: piazzetta di imbarco, segnale e pianta.
  - **Bacoli/Baia**: pavimenti delle terme in lastre chiare, fioriere.
  - **Salerno**: roccia del Castello di Arechi e lungomare continuo con fioriere.
  - **Avellino**: terrazzamenti pedonali fra i vigneti.
  - **Caserta**: balconi della Reggia e asse prospettico del Viale del Re con fioriere simmetriche.
  - **Chiesa del Gesù (interno)**: pareti in bugnato `H`, due nuovi arredi sacri ancorati.

## Invarianti preservate
- Save key `campania_life_save_v1`, forma `{ v:1, t, data }`, nessun nuovo campo top-level.
- Marker beta invariato: `BETA PUBBLICA · Richiede verifica manuale su MacBook e smartphone`.
- URL pubblico: `https://walkingbad10.github.io/campania-life/`.
- Spawn Napoli `240,272`; guglia base `34,25,4x3`; edicola `38,34`; `palazzo_e` altezza `5*T`; corridoio metro `56,21..28` percorribile.
- `U` lampione e `E` panchina solidi; `G`, `Y`, `D`, `d`, `e` attraversabili.
- Portali, POI, missioni, negozi, interazioni e formato salvataggi invariati.

## Verifiche automatiche
- Regressione deterministico: **28/28 PASS**.
- Build locale Vite: **OK**.
- Build CI-like `GH_PAGES_BASE=/campania-life/`: **OK**.
- `client/scripts/visual-explore.mjs` con Playwright/Chromium:
  - 2 dispositivi emulati × 24 mappe = 48 visite;
  - errori console/page/HTTP: **0**;
  - probe occlusione giocatore: **12 per dispositivo, 0 fallimenti**;
  - profondità naturale davanti/dietro la guglia: **0 fallimenti**;
  - pannelli debug visibili: **0**;
  - screenshot complete in questa cartella (`macbook-*.png`, `pixel9proxl-*.png`).

## Limiti dichiarati
- Le schermate e le metriche sono **emulazione Playwright/Chromium**, non test su dispositivi fisici.
- Il confronto visivo automatico è limitato: il modello VL ha raggiunto il limite gratuito e il modello corrente non legge direttamente le immagini. `confronto-visivo.jpg` e le screenshot sono conservate per la revisione umana.
- La verifica manuale finale su **MacBook e Google Pixel 9 Pro XL fisici** resta richiesta all'utente. Nessuna stabilità finale viene dichiarata prima del suo riscontro.
