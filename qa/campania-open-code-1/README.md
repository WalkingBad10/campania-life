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

Prima del pass artistico/geografico è stato creato:

- tag `checkpoint/pre-art-pass`, branch `backup/pre-art-pass` → `b71b3a8`

Il commit `3927e50` contiene il riordino delle texture distribuite; il pass sulle quattro zone prioritarie prosegue da quel checkpoint senza aggiungere mappe. Il suo deploy è stato verificato: workflow run `45507995565` `success`, bundle remoto `index-DEQAp2ru.js`, marker beta e chiave save `campania_life_save_v1` presenti nel bundle pubblicato.

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

## Pass artistico/geografico (26 mappe, nessuna nuova mappa)

1. **Texture, non solo Piazza del Gesù** — controllo generale di nomi, dimensioni, duplicati e mapping: le facciate M1 non lasciano più bande laterali vuote ma vengono ricomposte specchiando le campate dei fianchi, senza stirare l'asset. 50 PNG distribuiti = 50 PNG referenziati; i 1.570 fogli estratti e gli sprite M1 non usati sono fuori dalla cartella distribuita.
2. **Piazza del Gesù / centro storico** — basolato a gradoni regolari verso est, targhe per Spaccanapoli/Decumano Inferiore e per Via dei Tribunali/Decumano Maggiore (che non è Spaccanapoli). La distanza reale Guglia → campanile (129 m a 65°) resta coerente con gli ancoraggi `(36,26) → (60,16)`.
3. **Fuorigrotta** — aggiunti il lastrico di Piazzale Tecchio e l'ellisse dello Stadio Maradona (facciata metrica generata a runtime `fuorigrotta_stadio`, 208 × 160 px), con POI di L6 Mostra, Cumana Mostra-Stadio Maradona, L6 Augusto, Cumana Fuorigrotta EAV e FS Campi Flegrei. La macro-griglia resta dichiaratamente anamorfica: 144 × 96 m non possono contenere il solo stadio (232 × 287 m).
4. **Bacoli** — il Golfo di Baia è stato portato a nord del borgo, con pontile che conserva esattamente il portale `(4,0)`; Via Spiaggia scende N-S al porto; aggiunti i cartelli del Castello Aragonese e del Belvedere I Cento Passi.
5. **Pianura** — la griglia è letta con l'alto a sud (coerentemente con OSM), mantenendo chiesa, municipio, spawn `(10,30)` e metro `(11,36)` invariati; direttrici reali (Via Simeoli, Corso Duca d'Aosta, Via Santamaria), Piazza Municipio e Milite Ignoto come targhe. **Bar Etoile è a 1,82 km**, quindi non è stato inventato in piazza: è una targa direzionale sul bordo ovest verso Via Montagna Spaccata 449.
6. **Verifica visiva preparata** — `visual-explore.mjs` produce ora anche le inquadrazioni dedicate `fuorigrotta-stadio`, `fuorigrotta-tecchio`, `bacoli-golfo-nord` e `pianura-bar-etoile`, oltre alle quattro storiche del Gesù.

## Bug critico: «Nuova partita» su touch

**Riproduzione sulla versione pubblicata** (`index-DEQAp2ru.js`, Pixel 9 Pro XL emulato con `hasTouch: true`): il tap su «NUOVA PARTITA» non cambiava schermata; il click con mouse sulla stessa pagina funzionava. Nessun errore JS, nessun asset mancante e nessuna chiamata API in fase di avvio.

**Causa effettiva** — `MobileControls` registrava listener globali `touchmove`/`touchend` anche quando i controlli non erano visibili (titolo e creazione personaggio) e chiamava `e.preventDefault()` su ogni `touchend`. Il browser non sintetizzava quindi l'evento `click` dei pulsanti React. Il log confermava `window.touchend defaultPrevented=true` sul pulsante «NUOVA PARTITA». Inoltre alcuni `preventDefault()` dentro handler React touch, passivi per impostazione predefinita, producevano il messaggio «Unable to preventDefault inside passive event listener invocation».

**Correzione** — i listener globali sono attivi solo con i controlli di gioco visibili; il `preventDefault()` non viene più usato fuori dal joystick attivo; la gestione dello scorrimento è lasciata a `touch-action: none/manipulation` nel CSS. Nessuna mappa, proporzione, texture, collisione, salvataggio o POI è stato rimosso.

`client/scripts/mobile-start.mjs` (`npm run test:mobile-start`) usa veri tap e veri trascinamenti touch del joystick, poi verifica: ingresso effettivo in `napoli`, HUD e giocatore presenti, W/A/S/D nelle quattro direzioni con corsa e respiro idle, joystick nelle quattro direzioni, movimento delle coordinate, save `v1` con posizione aggiornata, «CONTINUA» dopo reload e backend opzionale offline. Il test è eseguito anche nella workflow Pages sulla build pubblicata.

I due workflow falliti notificati (`45510849895`, 24 s, e `45511020367`, 26 s) avevano la stessa annotazione sullo step `Install Playwright Chromium`: exit code 1. L'analisi degli artifact/run ha mostrato che il download/installazione del browser nella CI era l'unico passo in errore: build Vite e test locale erano già verdi. Non è stato disabilitato il test: è stata rimossa l'installazione esplicita di Chromium e `mobile-start.mjs` usa il Chromium bundlato quando presente, con fallback al Chrome di sistema dell'runner GitHub. Il run finale `45511188531` ha completato build e deploy con successo.

## Revisione strutturale CAMPANIA OPEN CODE 1

Eseguita a partire dal checkpoint `checkpoint/pre-structural-review` (`51a22c0`). Nessuna mappa o salvataggio è stato rimosso.

**Geometria da OSM/Overpass** — dati verificati: piazza `way 563345000` 93,8 × 76,4 m con asse 29,7°; guglia `way 261256738` 15,7 × 15,6 m decentrata 12,6 m a ovest del centro; Gesù `way 261249895` con prospetto documentato 56 m; Santa Chiara `way 261250167` a ESE della guglia; campanile `way 150562144` 17,6 × 17,3 m; Spaccanapoli/Croce `way 27179692` esce a 66,4° ENE; superficie `surface=sett` (basolato) nella piazza e `paving_stones` solo nei connettori. Di conseguenza:

- la pavimentazione pedonale è stata estesa a `x=19…66, y=15…38` più il braccio est `y=39…44`, senza cancellare masse, portali o corsie; la guglia resta ancorata a `34,25,4x3` e il POI a `36,26`;
- Santa Chiara è stata estesa a sud fino alla riga 33, coerentemente con la posizione ESE, mantenendo l'ingresso `59,26` e il corridoio metro `56,21..28`;
- il campanile usa un'impronta 9 × 9 celle (18 × 18 m) e la base sull'impronta, non più un rettangolo 3 × 8 celle;
- Spaccanapoli ha un raccordo pedonale ENE da `(66,25)` a `(71,19)` invece di terminare contro il bordo sud;
- i panni stesi pendono dai balconi del fronte sud (riga 40), non attraverso la piazza.

**Motore e asset** — le immagini M1 sono caricate in modo asincrono con una barriera reale (`CL.art.imagesReady`): le cache `bld:*` e `w:p:*` vengono invalidate quando tutti gli asset sono pronti, quindi una facciata non resta più bloccata sul fallback procedurale. Il rendering è stato separato in suolo → facciate/strutture → oggetti ed entità ordinati per profondità → atmosfera → luci → HUD: le luci non sono più attenuate dalla velatura notturna. Le scene M1 degli interni non sono più rettangoli opachi: una maschera radiale elimina ogni bordo quadrato mantenendo la decorazione e l'allineamento tile/collisioni.

**Personaggio** — tre set di sprite distinti per inattività (respiro a due fotogrammi), camminata (4 fotogrammi) e corsa (falcata e braceggio ampliati), per tutte e quattro le direzioni. W/A/S/D e frecce producono gli stessi assi del joystick touch; la direzione viene conservata da fermo e anche quando il movimento è bloccato da una collisione.

**Gate aggiuntivi** — la regressione include ora tre test: quattro direzioni W/A/S/D + frecce + animazioni distinte, footprint di collisione ancorato all'impronta della guglia, continuità delle superfici stradali su 11 mappe e coerenza OSM della piazza.

## Consolidamento finale (26 mappe, dopo la revisione strutturale)

Tre audit paralleli (texture sovrapposte/muri, geografia/strade, interni/proporzioni) hanno prodotto difetti concreti, corretti con patch minime:

- **Facciate e texture** — nuovo tile solido neutro `b` e helper `mass()` sotto le facciate M1: non affiorano più mattoni o finestre ai bordi degli sprite. Reggia di Caserta, Castello di Arechi e palazzo del lungomare di Salerno hanno facciate procedurali metriche dedicate (`caserta_reggia` 384 × 224, `salerno_arechi` 224 × 128, `salerno_palazzo` 160 × 96) invece di finestre random.
- **Strade da OSM** — Via Benedetto Croce/Spaccanapoli è `highway=pedestrian`, `surface=sett` (way `27179695`, verificato via API OSM): basolato pedonale e traffico ambientale solo sui vicoli residenziali. Ricomposti gli incroci di Fuorigrotta, Via Spiaggia/Via Ortensio a Bacoli, gli assi di Pianura, la carreggiata continua a Caserta e gli spunti pedonali a Avellino; aggiunti passaggi pedonali, ingressi dello stadio e targhe viarie.
- **Interni e proporzioni** — portale della chiesa allineato alla porta, panche sulle collisioni, forno e tornelli allineati, nuove ali con fascia muraria e soglie `Y`, decori specifici non cancellati dalla repaint, passo di piano 26 px (3,25 m) entro il limite documentato.

`client/scripts/mobile-start.mjs` verifica ora esplicitamente quattro direzioni WASD, corsa con Shift, respiro idle, quattro direzioni del joystick touch, salvataggio e «CONTINUA» sia sulla build locale sia su quella CI-like.

## Revisione qualitativa dopo il riscontro negativo (26 mappe)

Checkpoint di ingresso: `checkpoint/pre-quality-review` / `backup/pre-quality-review` (`4cd0e35`), mai ripristinato. Nessuna mappa, missione, POI, save o portal è stato rimosso. La revisione è partita da Piazza del Gesù Nuovo ed è stata estesa a tutte le mappe.

**Problemi risolti**
- Collisioni dall'impronta a terra: `MAPS.blockedBox()` scansiona tutte le celle coperte dal corpo, non solo i quattro angoli; `MAPS.propBlocks()` usa impronte dichiarate per lampioni, panchine, piante, tavoli, sedie, carri, cartelli e colonne; `MAPS.doorClosed()` rende le porte chiuse uno stato logico (flag `closed` o `hours`), non un tile statico. `engine.canStand()`, `safePoint()`, `unstuckPlayer()`, NPC, veicoli e pathfinding usano la stessa funzione.
- Righe murarie cancellate dal marciapiede ripristinate (Gesù riga 14 e Palazzo NE riga 13); Santa Chiara limitata alla riga 29; masse di `palazzo_sw`/`palazzo_banca` riallineate; piante, insegne e colonnoni con impronta reale; panni stesi riportati ai balconi di riga 40.
- Profondità: facciate e arredo non sono più fissi dietro le entità; porte e soglie (`portalAt`, `doorClosed`, tile `Y`/`7`/`8`) passano davanti al prospetto, mentre chi è dietro un edificio resta correttamente coperto.
- Personaggi e veicoli: idle/camminata/corsa distinti, quattro direzioni reali, modelli `car`/`taxi`/`van`/`bus`/`scooter`/`bike`, corsia destra, inversioni, ombre, impronta ruotata e traffico solo su strade `r`.
- Scala sprite: `ART` disegna gli sprite mondo direttamente a `CL.WORLD_SCALE` (`cvRaw`, `ctxRaw`, `worldDrawScale`): niente doppio downscale, sfocatura o ancoraggi errati. L'adulto metrico è 9 × 14 px; non è più coperto da un rettangolo scuro notturno, ma usa `ART.nightCharacter()` con ombreggiatura `source-atop`.
- Luci e finiture: alone del lampione centrato sulla lanterna, finestre notturne con vetro caldo/montanti, tende con pieghe e orlo dentellato, cornici con dentelli, balconi con ringhiera traforata e vasi, panni con pieghe, colonne scanalate, archi in pietra. Il `clearRect()` che bucava i muri è stato sostituito da mattoni incassati opachi.
- Audit: `render-audit.mjs` verifica dimensioni reali, quattro angoli trasparenti di alberi/veicoli/panchine/lampioni/piante/archi e nuove finiture architettoniche. `visual-explore.mjs` usa una soglia di visibilità coerente con l'adulto da 9 × 14 px.

**Asset esterni valutati ma non integrati** — Kenney *RPG Urban Pack* e *Tiny Town* (CC0, 486 + 132 tile 16 × 16) sono stati scaricati e ispezionati: contengono principalmente tile di terreno/muratura e non forniscono veicoli top-down a quattro direzioni né arredo urbano coerente con il sistema metrico 8 px/m e con le facciate M1 già autorevoli. Mescolarli avrebbe introdotto esattamente la stilistica incoerente segnalata. Le grafiche mancanti sono quindi state **generate ex novo** nel pipeline `ART` (sprite originali, deterministiche, con licenza di progetto), non assemblate da texture casuali.

**Problemi residui / verifica ancora necessaria**
- Le prestazioni e la resa finale su **MacBook e Pixel 9 Pro XL fisici** non sono state misurate in questa sessione: le evidenze sono emulazione Playwright/Chromium.
- Il confronto estetico con fotografie reali resta una **revisione umana**: il modello corrente non può leggere le immagini. `confronto-visivo.jpg` e le screenshot aggiornate sono il materiale da rivedere.
- Le facciate M1 di Napoli restano deliberatamente invariate perché sono la fonte autorevole; le loro imperfezioni fotografiche originali non sono state "riparate" con texture estranee.

**Gate della revisione qualitativa** — regressione **37/37 PASS** (tre nuovi test: impronta completa/porte chiuse, veicoli orientati e corsie, profondità delle facciate); texture audit **50/50 PNG e 21/21 facciate**; render audit **0 errori**; visual-explore **52 visite, 0 errori, 0 occlusioni, 0 profondità naturali errate**; mobile-start **OK** su build locale e pubblica; build Vite **OK**; `git diff --check` **OK**.

## Esito del confronto
Il testo di Wikipedia conferma l'impianto usato dalla graybox: obelisco al centro dello spiazzale, palazzi nobiliari a ovest (Pandola / Pignatelli di Monteleone), Gesù Nuovo e Santa Chiara sui lati opposti, Palazzo delle Congregazioni presso il Gesù. La facciata del Gesù è riconoscibile per il bugnato a punta di diamante in piperno; la guglia è in marmo bianco e bardiglio.

Il modello con capacità vision-language disponibile (`nemotron-3.5-super-vl-free`) ha raggiunto il limite gratuito e il modello corrente non legge immagini. Il confronto è quindi stato fatto con OSM/satellite, misure documentate e analisi programmatica dei canvas: `confronto-visivo.jpg` affianca sette inquadrature di gioco (guglia davanti/dietro, prospetto del Gesù, campanile, stadio Maradona, golfo di Baia e San Giorgio) alle foto reali e all'ortofoto. **La revisione estetica finale resta umana**.

## Invarianti preservate
- Save key `campania_life_save_v1`, forma `{ v:1, t, data }`, nessun nuovo campo top-level.
- Marker beta invariato: `BETA PUBBLICA · Richiede verifica manuale su MacBook e smartphone`.
- URL pubblico: `https://walkingbad10.github.io/campania-life/` (invariato).
- Deploy finale verificato: run `45606128039` `success` (build `139177320188` e deploy `139177739108` entrambi `success`), commit `c9fddbd`, bundle remoto `index-BK9wvC9o.js`. Sul sito pubblico `npm run test:mobile-start` entra in `napoli` a `240,272`, verifica WASD quattro direzioni con corsa e idle e joystick quattro direzioni, muove il giocatore a `229,272`, salva in `campania_life_save_v1` e ripristina con «CONTINUA». Marker beta e chiave save presenti nel bundle remoto.
- Spawn Napoli `240,272`; guglia base `34,25,4x3` e POI `36,26`; edicola `38,34`; `palazzo_e` altezza `5*T`; corridoio metro `56,21..28` percorribile.
- `U` lampione e `E` panchina solidi; `G`, `Y`, `D`, `d`, `e` attraversabili.
- Portali, POI, missioni, negozi, interazioni e formato salvataggi invariati.
- Debug player nascosto di default (`?debug=1` o `?dbg=1` per riattivarlo).

## Verifiche automatiche
- Regressione deterministico: **37/37 PASS** (gate minimo richiesto 28/28; include scala metrica, nuove mappe, viaggi metro, ancoraggi, targhe geografiche, direzioni WASD, collisioni, impronte complete, porte chiuse, veicoli, profondità e continuità stradale).
- Avvio mobile touch (`npm run test:mobile-start`, Pixel 9 Pro XL emulato): **OK** su build locale e CI-like; riproduce il percorso reale «NUOVA PARTITA» → ingresso in mappa → movimento → save → «CONTINUA».
- Build locale Vite: **OK**.
- Build CI-like `GH_PAGES_BASE=/campania-life/`: **OK**.
- `client/scripts/visual-explore.mjs` con Playwright/Chromium:
  - 2 dispositivi emulati × 26 mappe = 52 visite;
  - errori console/page/HTTP: **0**;
  - probe occlusione giocatore: **19 per dispositivo, 0 fallimenti** (soglia ricalibrata sull'adulto 9 × 14 px);
  - profondità naturale davanti/dietro la guglia: **0 fallimenti**;
  - geometria metrica della guglia: **0 fallimenti**;
  - pannelli debug visibili: **0**;
  - screenshot complete in questa cartella (`macbook-*.png`, `pixel9proxl-*.png`), incluse le 8 inquadrature dedicate per dispositivo (4 storiche del Gesù + stadio, Tecchio, golfo nord di Baia, targa Etoile).
- `client/scripts/render-audit.mjs`: dimensioni **effettivamente disegnate** dal motore — Guglia 126 × 240, campanile 112 × 384, Gesù 448 × 248, palazzo NE 288 × 160, facciate metriche delle nuove zone e stadio 208 × 160 — **0 errori**. I 34 anchor volutamente fuori bounds (arredi a muro, riempimento viewport, gronda del Gesù) sono documentati in `render-audit.json` e non sono architetture tagliate.
- `client/scripts/texture-audit.mjs`: **50/50 PNG distribuiti referenziati**, 0 file inutilizzati, **21/21 facciate** alla dimensione metrica corretta e senza campate laterali vuote. I fogli estratti e gli asset M1 non usati sono stati spostati in `_source-sheets/` (esclusi dal build e da Git), non più nella cartella distribuita.

## Limiti dichiarati
- Le schermate e le metriche sono **emulazione Playwright/Chromium**, non test su dispositivi fisici.
- Il confronto visivo automatico è limitato: il modello corrente non legge direttamente le immagini. `confronto-visivo.jpg` (rigenerato con la Guglia a 30 m) e le screenshot sono conservate per la revisione umana.
- La distinzione finale tra 30 e 34 m per il monumento completo resta documentata in `PROPORTIONS.md`: il gioco usa 30 m, valore cauto e direttamente attestato dal Comune di Napoli.
- La verifica manuale finale su **MacBook e Google Pixel 9 Pro XL fisici** resta richiesta all'utente. Nessuna stabilità finale viene dichiarata prima del suo riscontro.
