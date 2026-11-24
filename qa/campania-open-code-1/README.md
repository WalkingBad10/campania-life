# CAMPANIA OPEN CODE 1 — qualità visiva e fedeltà geografica

## Obiettivo
Ricostruire Piazza del Gesù Nuovo come **stanza urbana coerente**, non come insieme di asset posizionati a caso, mantenendo giocabilità, salvataggi e ancoraggi esistenti. Il ciclo comprende un pass visivo e un pass di **proporzioni architettoniche documentate**, applicati a tutte le 24 mappe.

## Checkpoint ripristinabili
Prima delle modifiche dei due cicli sono stati creati:

- tag `checkpoint/pre-vision-pass`, branch `backup/pre-vision-pass` → `51a78de`
- tag `checkpoint/pre-proportion-pass`, branch `backup/pre-proportion-pass` → `13fefff`

`13fefff` è la baseline pubblicata prima del pass proporzioni.

## Fonti usate (studio, non copia negli asset di gioco)
- OpenStreetMap API:
  - piazza: way `563345000`, centro `40.8470181, 14.2517696`, bbox `40.8466809..40.8473692`, `14.2512228..14.2523350`.
  - Chiesa del Gesù Nuovo: way `261249895`.
  - Guglia dell'Immacolata: way `261256738`, centro `40.8470094, 14.2516038`, ingombro 15,71 × 15,58 m.
- Esri World Imagery: `references/satellite.jpg`, crop `references/satellite-guglia-crop.png`.
- Wikimedia Commons / Wikipedia: foto e descrizione urbanistica in `references/SOURCES.md`.
- Dimensioni reali, conflitti di fonti e conversione metrica: **`PROPORTIONS.md`**.
- Confronto affiancato pronto per revisione umana: `confronto-visivo.jpg`.

## Pass proporzioni — decisioni principali
La geometria reale non è più "adattata a occhio" alla griglia: esiste un unico sistema metrico (`PROPORTIONS.md`).

| Grandezza | Valore | Riscontro |
|---|---|---|
|`PX_PER_M`|8 px/m|vincolo: 56 × 31 m del Gesù devono stare in 480 × 270 px|
|1 cella (`TILE`)|16 px = 2,0 m|`CL.M_PER_TILE`|
|Adulto 1,70 m|13,6 px (14 px visibili)|`CL.ADULT_M`, `CL.ADULT_SRC_PX`|
|`WORLD_SCALE`|0,5914|applicato una sola volta a persona, veicoli, alberi, arredo|
|Guglia|176 × 128 px = 22 × 16 m|Wikipedia it (22 m) + OSM (15,7 m)|
|Gesù Nuovo|448 × 248 px = 56 × 31 m|Avvenire, 12/03/2023|
|Campanile Santa Chiara|400 × 112 px = 50 × 14 m|valore di lavoro, non verificato: vedi `PROPORTIONS.md`|

Correzioni applicate:

1. **Guglia** — l'asset M1 `guglia.png` (128 × 176, 8865 colori) era già proporzionato: veniva solo stampato a 64 × 88 px, cioè a metà altezza. Ora `drawGuglia()` lo disegna a dimensione naturale, centrato sull'impronta solida `rect(g,34,25,4,3,'O')`. Nessuno stiramento, dettagli M1 intatti. I gradini esterni fino a 15,7 m restano attraversabili, come nella realtà; il cuore solido resta 8 × 6 m.
2. **Gesù e palazzi** — facciata M1 a 448 × 248 px, massa allargata da 24 a 28 celle senza spostare portale `19,14` né le finestre storiche. `palazzo_ne` a 288 × 160 px, `palazzo_e` a 160 × 160 px. Nessun `facade_cornice` / `facade_balcony` generico.
3. **Campanile** — rigenerato da 40 × 112 a 112 × 400 px (`generate-monuments.py`) e riancorato sul bordo sud di Santa Chiara (riga 28): prima la cuspide finiva a y = −96, fuori mappa e mai inquadrabile.
4. **Scala uniforme** — `WORLD_SCALE` applicato tramite cache dedicate in `art.js`; i tile di suolo restano 16 × 16 px; ritratti UI usano il character originale non scalato.
5. **Collisioni e profondità** — aggiornate dopo ogni ridimensionamento; POI, spawn e portali invariati.

## Esito del confronto
Il testo di Wikipedia conferma l'impianto usato dalla graybox: obelisco al centro dello spiazzale, palazzi nobiliari a ovest (Pandola / Pignatelli di Monteleone), Gesù Nuovo e Santa Chiara sui lati opposti, Palazzo delle Congregazioni presso il Gesù. La facciata del Gesù è riconoscibile per il bugnato a punta di diamante in piperno; la guglia è in marmo bianco e bardiglio.

Il modello con capacità vision-language disponibile (`nemotron-3.5-super-vl-free`) ha raggiunto il limite gratuito e il modello corrente non legge immagini. Il confronto è quindi stato fatto con OSM/satellite, misure documentate e analisi programmatica dei canvas: `confronto-visivo.jpg` affianca quattro inquadrature di gioco (guglia davanti/dietro, prospetto del Gesù, campanile) alle foto reali e all'ortofoto. **La revisione estetica finale resta umana**.

## Invarianti preservate
- Save key `campania_life_save_v1`, forma `{ v:1, t, data }`, nessun nuovo campo top-level.
- Marker beta invariato: `BETA PUBBLICA · Richiede verifica manuale su MacBook e smartphone`.
- URL pubblico: `https://walkingbad10.github.io/campania-life/`.
- Spawn Napoli `240,272`; guglia base `34,25,4x3` e POI `36,26`; edicola `38,34`; `palazzo_e` altezza `5*T`; corridoio metro `56,21..28` percorribile.
- `U` lampione e `E` panchina solidi; `G`, `Y`, `D`, `d`, `e` attraversabili.
- Portali, POI, missioni, negozi, interazioni e formato salvataggi invariati.
- Debug player nascosto di default (`?debug=1` o `?dbg=1` per riattivarlo).

## Verifiche automatiche
- Regressione deterministico: **29/29 PASS** (il gate minimo richiesto era 28/28; il test aggiuntivo verifica la scala metrica).
- Build locale Vite: **OK**.
- Build CI-like `GH_PAGES_BASE=/campania-life/`: **OK**.
- `client/scripts/visual-explore.mjs` con Playwright/Chromium:
  - 2 dispositivi emulati × 24 mappe = 48 visite;
  - errori console/page/HTTP: **0**;
  - probe occlusione giocatore: **14 per dispositivo, 0 fallimenti**;
  - profondità naturale davanti/dietro la guglia: **0 fallimenti**;
  - geometria metrica della guglia: **0 fallimenti**;
  - pannelli debug visibili: **0**;
  - screenshot complete in questa cartella (`macbook-*.png`, `pixel9proxl-*.png`), incluse le 4 inquadrature di confronto per dispositivo.

## Limiti dichiarati
- Le schermate e le metriche sono **emulazione Playwright/Chromium**, non test su dispositivi fisici.
- Il confronto visivo automatico è limitato: il modello corrente non legge direttamente le immagini. `confronto-visivo.jpg` e le screenshot sono conservate per la revisione umana.
- I 50 m del campanile sono un valore di lavoro non verificato (PDF accademico non raggiungibile, HTTP 429); Wikipedia it dichiara l'altezza incerta. Il valore è esplicitamente marcato come tale in `PROPORTIONS.md`.
- La verifica manuale finale su **MacBook e Google Pixel 9 Pro XL fisici** resta richiesta all'utente. Nessuna stabilità finale viene dichiarata prima del suo riscontro.
