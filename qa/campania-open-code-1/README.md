# CAMPANIA OPEN CODE 1 — qualità visiva e fedeltà geografica

## Obiettivo
Ricostruire Piazza del Gesù Nuovo come **stanza urbana coerente**, non come insieme di asset posizionati a caso, mantenendo giocabilità, salvataggi e ancoraggi esistenti. Il ciclo comprende un pass visivo, un pass di **proporzioni architettoniche documentate** e un pass di consolidamento geografico, applicati a tutte le **26 mappe** (24 esistenti + Fuorigrotta e Pianura).

## Checkpoint ripristinabili
Prima delle modifiche dei due cicli sono stati creati:

- tag `checkpoint/pre-vision-pass`, branch `backup/pre-vision-pass` → `51a78de`
- tag `checkpoint/pre-proportion-pass`, branch `backup/pre-proportion-pass` → `13fefff`

`13fefff` è la baseline pubblicata prima del pass proporzioni.

Prima del pass di consolidamento sono stati creati:

- tag `checkpoint/pre-consolidation-pass`, branch `backup/pre-consolidation-pass` → `1b59ff8`

`1b59ff8` è la baseline pubblicata prima del consolidamento (deploy verificato, workflow run `45498783501`, bundle `index-CNw081DB.js`).

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
|Guglia — monumento completo|240 × 126 px = 30 × 15,7 m|Comune di Napoli / Art Bonus («oltre trenta metri»), disegni restauro 2026, 130 palmi storici ≈ 34 m; OSM per l'ingombro|
|Guglia — solo obelisco|22 m|Wikipedia it / Touring Club: spiega l'asset M1 originale 128 × 176, che rappresentava il fusto senza statua|
|Gesù Nuovo|448 × 248 px = 56 × 31 m|Avvenire, 12/03/2023|
|Campanile Santa Chiara|384 × 112 px = 48 × 14 m|OSM way `150562144` (`height=48 m`)|
|Fuorigrotta|Piazzale Tecchio/Teatro 560 × 280 px, isolati 192 × 144 px, torre 160 × 240 px|OSM way `22790881` e griglia ENE-WSW|
|Pianura|San Giorgio 320 × 248 px, municipio 312 × 200 px, borgo 160 × 112 px|OSM way `580193824`, borgo agricolo in piperno|

Correzioni applicate:

1. **Guglia** — il conflitto 22 vs 30 m è stato risolto: 22 m è il solo obelisco, ~30 m il monumento completo. L'asset M1 (128 × 176) è stato **ricomposto architettonicamente** a 126 × 240 px con `generate-monuments.py --force-guglia`: statue, cornici, plinth e gradini mantengono le proporzioni fotografiche, mentre il **solo fusto** passa da 27 a 91 righe. Nessuno stiramento uniforme. `drawGuglia()` lo disegna a dimensione naturale, centrato sull'impronta solida `rect(g,34,25,4,3,'O')`. I gradini esterni fino a 15,7 m restano attraversabili; il cuore solido resta 8 × 6 m.
2. **Gesù e palazzi** — facciata M1 a 448 × 248 px, massa allargata da 24 a 28 celle senza spostare portale `19,14` né le finestre storiche. `palazzo_ne` a 288 × 160 px, `palazzo_e` a 160 × 160 px. Nessun `facade_cornice` / `facade_balcony` generico. Le facciate M1 non vengono più lasciate con ampie bande laterali vuote: le campate dei fianchi vengono ricomposte specchiando i lati dell'asset, senza stirarlo, e l'eventuale fascia superiore viene chiusa con cornice del tetto.
3. **Campanile** — l'altezza OSM `48 m` sostituisce il vecchio valore di lavoro 50 m: rigenerato a 112 × 384 px e riancorato sul bordo sud di Santa Chiara (riga 28, y=448, cuspide a y=64). Prima la cuspide finiva a y = −96, fuori mappa e mai inquadrabile.
4. **Scala uniforme** — `WORLD_SCALE` applicato una sola volta tramite `_world()` in `art.js`; i tile di suolo e le architetture metriche restano a 8 px/m; ritratti UI usano il character originale non scalato.
5. **Collisioni e profondità** — aggiornate dopo ogni ridimensionamento; POI, spawn e portali esistenti invariati.
6. **Nuove mappe** — Fuorigrotta (72 × 48 celle) e Pianura (64 × 40 celle) seguono le griglie OSM: assi ENE-WSW, palme, Teatro Mediterraneo e isolati razionalisti; borgo in piperno, chiesa, municipio e orlo verde di Camaldoli. Le facciate sono procedurali dedicate (`metric_facade`), disegnate come sfondo architettonico prima delle entità. Nuovi residenti e traffico leggero sulle strade.
7. **Metro** — `metroTravel(to)` ora accetta `fuorigrotta` e `pianura` oltre al toggle storico Toledo ↔ Dante; biglietto, tempo, quest progress e autosave invariati. I tornelli nuovi sono nelle due stazioni e nelle nuove zone, con spawn metrici fissi.
8. **Bacoli** — parco archeologico, tre templi documentati (Diana, Mercurio, Venere), castello aragonese e case in tufo; portali e POI storici invariati.

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
- Regressione deterministico: **31/31 PASS** (gate minimo richiesto 28/28; include scala metrica, nuove mappe, viaggi metro e anchoring).
- Build locale Vite: **OK**.
- Build CI-like `GH_PAGES_BASE=/campania-life/`: **OK**.
- `client/scripts/visual-explore.mjs` con Playwright/Chromium:
  - 2 dispositivi emulati × 26 mappe = 52 visite;
  - errori console/page/HTTP: **0**;
  - probe occlusione giocatore: **19 per dispositivo, 0 fallimenti**;
  - profondità naturale davanti/dietro la guglia: **0 fallimenti**;
  - geometria metrica della guglia: **0 fallimenti**;
  - pannelli debug visibili: **0**;
  - screenshot complete in questa cartella (`macbook-*.png`, `pixel9proxl-*.png`), incluse le 4 inquadrature di confronto per dispositivo.
- `client/scripts/render-audit.mjs`: dimensioni **effettivamente disegnate** dal motore — Guglia 126 × 240, campanile 112 × 384, Gesù 448 × 248, palazzo NE 288 × 160, facciate metriche delle nuove zone — **0 errori**. I 38 anchor volutamente fuori bounds (arredi a muro, riempimento viewport, gronda del Gesù) sono documentati in `render-audit.json` e non sono architetture tagliate.
- `client/scripts/texture-audit.mjs`: **50/50 PNG distribuiti referenziati**, 0 file inutilizzati, **17/17 facciate** alla dimensione metrica corretta e senza campate laterali vuote. I fogli estratti e gli asset M1 non usati sono stati spostati in `_source-sheets/` (esclusi dal build e da Git), non più nella cartella distribuita.

## Limiti dichiarati
- Le schermate e le metriche sono **emulazione Playwright/Chromium**, non test su dispositivi fisici.
- Il confronto visivo automatico è limitato: il modello corrente non legge direttamente le immagini. `confronto-visivo.jpg` (rigenerato con la Guglia a 30 m) e le screenshot sono conservate per la revisione umana.
- La distinzione finale tra 30 e 34 m per il monumento completo resta documentata in `PROPORTIONS.md`: il gioco usa 30 m, valore cauto e direttamente attestato dal Comune di Napoli.
- La verifica manuale finale su **MacBook e Google Pixel 9 Pro XL fisici** resta richiesta all'utente. Nessuna stabilità finale viene dichiarata prima del suo riscontro.
