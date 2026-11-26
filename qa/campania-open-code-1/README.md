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
- **Risolto il limite del modello**: per questa tornata è stato usato il modello multimodale verificato `opencode/nemotron-3.5-super-vl-free`, che legge direttamente le immagini. Le analisi VL sono state eseguite su singola immagine o gruppi di 2–4 pannelli, non in parallelo massivo (che aveva restituito `Endpoint is unavailable`).
- Le facciate M1 di Napoli restano la fonte autorevole, ma **non più esenti da controllo**: la loro integrazione architettonica nella mappa e i dettagli fotografici sono stati verificati visivamente e ritoccati con lo script deterministico `retouch_m1.py` (nessuna texture estranea).

**Gate della revisione qualitativa** — regressione **37/37 PASS** (tre nuovi test: impronta completa/porte chiuse, veicoli orientati e corsie, profondità delle facciate); texture audit **50/50 PNG e 21/21 facciate**; render audit **0 errori**; visual-explore **52 visite, 0 errori, 0 occlusioni, 0 profondità naturali errate**; mobile-start **OK** su build locale, CI-like e pubblica; build Vite e CI-like **OK**; `git diff --check` **OK**.

**Pubblicazione** — commit `b7f2716` su `main`, workflow `45616242811` `success` (build `139212256590`, deploy `139212645019`), bundle remoto `index-CWJT4Ahe.js`, URL invariato `https://walkingbad10.github.io/campania-life/`. Marker beta e chiave save verificati nel bundle remoto; smoke test pubblico ripetuto con esito OK.

## Revisione visiva effettiva con modello multimodale (CAMPANIA OPEN CODE 1)

Checkpoint di ingresso `checkpoint/pre-visual-review` / `backup/pre-visual-review` su `2243cbc` (bundle `../backup/pre-visual-review/CampaniaLife-2243cbc.bundle`), mai ripristinato. Il modello testuale principale non legge immagini; la revisione è stata quindi affidata a `opencode/nemotron-3.5-super-vl-free`, verificato come disponibile e multimodale. Il tentativo di analizzare tutti i pannelli in parallelo ha fallito con `Endpoint is unavailable`: la revisione è stata ripetuta su **una sola immagine per volta** o in pannelli da quattro.

**Difetti confermati visivamente e corretti**
- **Alberi e vegetazione** — chiome identiche e basamento quadrato opaco. Invalidata la cache che riutilizzava il canvas di `tree()` per `lemonTree()` (doppio downscale, albero visibile 14 px). Ora `_treeRaw()` genera **sette varianti deterministiche** con chioma/rami/tones differenti, tronco radicato e **ombra ellittica trasparente**; niente quadrato agli angoli. In `engine.js` gli alberi esterni `T`/`P` sono disegnati come entità alta (prima finivano nel ramo `rock`), con variante hashata per mappa/coordinate.
- **Ombre di contatto** — panchine, tavolini, sedie, lampioni, carri, cartelli, edicola, piante e arredi a terra ricevono un'ombra radiale morbida (`Engine.softShadow`), ancorata senza spostare collisioni. NPC e veicoli usano ombre ellittiche coerenti in `entities.js`.
- **Guglia dell'Immacolata** — il ritocco M1 aggiunge nicchie/statue intermedie, cornici in rilievo, colonne tortili e balaustra sul basamento; `drawGuglia()` ora disegna un'ombra a contatto sul selciato e interrompe le giunture del pavimento sotto il piedistallo. Verifica VL: **risolto**.
- **Gesù Nuovo** — il bugnato in piperno è stato scurito in modo deterministico (`retouch_m1.py`) su `gesu-facade.png` e `m1-gesu_facade_ref.png`, preservando vetri, dorature e cornici chiare. Verifica VL: **risolto**.
- **Grotta** — il vuoto nero uniforme su metà schermo era buio intenzionale ma senza sorgente leggibile. Aggiunte lanterna visibile, bagliori caldi, colonne, rovera lavica stratificata e riflessi. Seconda verifica VL: **risolto**.
- **Bar / HUD** — il vetro ad arco è risultato integro (non un difetto). I pannelli HUD sono stati resi più trasparenti e compatti per non coprire la scena. Verifica VL: **risolto**.
- **Traffico ambientale** — quattro veicoli crossavano marciapiedi/corsie pedonali (`bacoli` taxi `20,10`, `napoli` scooter `58,44`, `costiera` scooter `55,14`, `fuorigrotta` auto `30,19`). Riposizionati su tile `r`; la regressione verifica ora l'**impronta completa a quattro angoli**, non solo il tile centrale.

**Falsi positivi scartati con verifica puntuale**
- `macbook-napoli.png` mostra lo spawn `(15,17)`: la guglia `(34,25)` è fuori viewport, non un monumento mancante.
- `napoli-guglia-dietro` è un viewpoint volutamente dietro il monumento e può tagliarne la sommità.
- «Casa nonna: personaggio coperto dal tappeto» — il tile `R` è pavimento disegnato prima delle entità: non può coprire uno sprite; `visual-explore` conferma 0 occlusioni. Le panche da 48 px (6 m) sono arredo realistico a fronte di un adulto di 14 px.
- La grotta non era trasparenza rotta né overlay UI: il pattern di rovera era presente sotto il buio.

**Gate della revisione visiva** — regressione **37/37 PASS** (incluso il nuovo test footprint veicoli), texture audit **50/50 PNG e 21/21 facciate**, render audit **0 errori**, visual-explore **26 mappe × 2 dispositivi, 0 errori/occlusioni/profondità**, build Vite locale e CI-like **OK**, mobile-start locale e pubblico **OK**, `git diff --check` **OK**.

**Pubblicazione** — commit `f08ed04` su `main`, workflow `45621222465` `success` (build `139229576528`, deploy `139229978970`, step `Mobile start smoke (touch)` nella CI `success`), bundle remoto `index-Cuk6AnYj.js`, URL invariato `https://walkingbad10.github.io/campania-life/`. Marker beta, chiave save e nuove firme `softShadow`/`tufo`/`Pext` verificati nel bundle remoto; smoke test pubblico ripetuto con esito OK.

## Revisione professionale integrale (da `f5845de`)

**Checkpoint** — tag `checkpoint/pre-professional-review`, branch `backup/pre-professional-review`, bundle `../backup/CampaniaLife-f5845de.bundle`.

**Correzioni strutturali effettive**
- **Ancoraggio personaggio**: piedi e ombra ora coincidono con il fondo della hitbox (`y + h/2`), non 8–10 px sopra come nell'offset legacy `y-20`. Stesso ancoraggio per NPC. Profondità di sort basata sul punto di contatto, non sul centro del corpo.
- **Animazione sincronizzata**: `anim`, frame, SFX passo e contatore passi avanzano solo in base allo spazio effettivamente percorso. Contro un muro il personaggio passa alla posa idle invece di "correre sul posto".
- **Collisioni a sottopassi**: player, veicolo montato e traffico ambientale suddividono lo spostamento in step ≤ 4 px, impedendo tunneling con frame lunghi (`dt = 0.05`) e corsa.
- **Direzione e impronta veicoli**: la rotazione aggiorna sempre `dir`, `lane`, `w` e `h` insieme. Dismount validato con ricerca di un punto libero e controllo portali.
- **Hitbox debug**: `?debug=1` disegna celle solide, AABB di player/NPC/veicoli e offset camera; disattivato nella build pubblica.
- **Basolato**: le lastre quadrate 4×4 di Piazza del Gesù sono state sostituite da lastri irregolari sfalsati con giunti scuri e volume (`D`, `d`, `e` e `p`), mantenendo 4 varianti deterministiche e rimuovendo le righe continue a 16 px che ricreavano la griglia. L'ombra di contatto è stata resa più leggibile (ellisse 7×3 px, due strati).
- **Verifica cartografica OSM**: `osm_projection.py` proietta le way reali (piazza `563345000`, Guglia `261256738`, Gesù `261249895`, Via Benedetto Croce `27179695`) in metri/celle e documenta gli scarti. Semplificazioni dichiarate: viewport 60×34 m, compressione 0,64× sull'asse Guglia→Gesù e basolato stilizzato da `surface=sett`.

**Gate** — regressione **40/40 PASS** (3 nuovi test su ancoraggio/animazione bloccata, hitbox debug, impronta/dismount veicoli), texture audit **50/50 PNG e 21/21 facciate**, render audit **0 errori**, visual-explore **26 mappe × 2 dispositivi, 0 errori/occlusioni/profondità**, build Vite **OK**, `git diff --check` **OK**. La soglia di visibilità del probe è stata ritarata sullo sprite da 9×14 px con ombra a contatto (minimo 7 px misurati nei punti liberi, 6 px dietro la Guglia): non è stata indebolita per mascherare occlusioni, ma tarata sul nuovo anchor. **Verifica VL finale**: il modello conferma che i piedi poggiano a terra con ombra ellittica visibile e dà giudizio BUONO su ancoraggio e pavimentazione.

**Strumenti realmente disponibili e utilizzati**: Pillow 11.3.0, Python, API OpenStreetMap, Playwright/Chromium, modello VL `opencode/nemotron-3.5-super-vl-free`. **Non disponibili**: Aseprite/LibreSprite, QGIS, Tiled/LDtk, Blender, OpenCV, Matter.js. La pixel art resta procedurale e deterministica; le geometrie OSM sono verificate via proiezione metrica, non importate in un editor GIS.

## Fase cartografica operativa (dopo `06a801f`)

`osm_projection.py` non è più solo documentazione: è l'entry point che scarica/legge i bbox OSM reali, proietta way e nodi nel sistema metrico del gioco e genera `client/src/game/osm-geometry.js`. L'overlay è applicato dentro `MAPS.get()` subito dopo lo switch e prima di `expandInterior`/cache, con un layer protetto (`OSM_SURFACE`, `OSM_ALLOW`, `OSM_PASSAGE`, `OSM_STRIP`, `OSM_PROP_TYPES`, `osmLock()`, `osmProtectRoutes()`): spawn, portali, POI, door, checkpoint, decor e percorsi già giocabili non vengono cancellati. Solo le 11 mappe esterne ricevono geometrie OSM; i 15 interni restano invariati.

Le 22 fotografie Wikimedia in `photo-refs/` (2 per località) sono riferimenti QA con autore/licenza/sorgente in `refs.json`: non sono copiate nei pixel del gioco. Attribuzione dati: **© OpenStreetMap contributors — ODbL — retrieve 2026-11-25**, licenza `https://opendatacommons.org/licenses/odbl/1-0/`; il link è esposto anche nei crediti del gioco.

Difetti concreti corretti in questa fase: occlusioni residue su Fuorigrotta `(11,26)` e `(22,25)` senza abbassare le soglie; facciata Mostra rientrata nella propria impronta; angoli opachi degli sprite mondo eliminati; campata cieca di `pianura_borgo` chiusa con grondaia; cartello pedonale spostato dal centro della piazza al bordo est; palme Washingtonia dedicate per Viale Augusto; portico ad archi, balconi e panni sul blocco razionalista; battigia sfalsata a Positano.

Gate della fase: regressione **41/41 PASS** (nuovo test «OSM reconstruction never removes an existing outdoor route»), texture audit **50/50 PNG e 21/21 facciate**, render audit **0 errori**, visual-explore **2 dispositivi × 26 mappe, 0 errori/occlusioni/profondità/geometria**, build Vite `OK`, `git diff --check` `OK`. Le analisi VL sono state ripetute con `opencode/nemotron-3.5-super-vl-free` su immagini singole, usando anche inquadrature dedicate senza HUD (`vl-*-nohud.png`) per separare la minimappa dagli oggetti del mondo.

## Esito del confronto
Il testo di Wikipedia conferma l'impianto usato dalla graybox: obelisco al centro dello spiazzale, palazzi nobiliari a ovest (Pandola / Pignatelli di Monteleone), Gesù Nuovo e Santa Chiara sui lati opposti, Palazzo delle Congregazioni presso il Gesù. La facciata del Gesù è riconoscibile per il bugnato a punta di diamante in piperno; la guglia è in marmo bianco e bardiglio.

Il confronto geografico è stato fatto con OSM/satellite, misure documentate e analisi programmatica dei canvas: `confronto-visivo.jpg` affianca sette inquadrature di gioco (guglia davanti/dietro, prospetto del Gesù, campanile, stadio Maradona, golfo di Baia e San Giorgio) alle foto reali e all'ortofoto. La revisione estetica effettiva delle immagini è stata completata in questa tornata con `opencode/nemotron-3.5-super-vl-free` (vedi sezione «Revisione visiva effettiva»); resta consigliata, ma non bloccante, una conferma finale umana su dispositivi fisici.

## Invarianti preservate
- Save key `campania_life_save_v1`, forma `{ v:1, t, data }`, nessun nuovo campo top-level.
- Marker beta invariato: `BETA PUBBLICA · Richiede verifica manuale su MacBook e smartphone`.
- URL pubblico: `https://walkingbad10.github.io/campania-life/` (invariato).
- Deploy finale verificato: run `45698019779` `success` (build `139500425408` e deploy `139500803114`, step `Mobile start smoke (touch)` `success`), commit `328ff32`, bundle remoto `index-CuXWYgWz.js`. Sul sito pubblico `npm run test:mobile-start` entra in `napoli` a `240,272`, verifica WASD quattro direzioni con corsa e idle e joystick quattro direzioni, muove il giocatore a `229,272`, salva in `campania_life_save_v1` e ripristina con «CONTINUA». Marker beta, chiave save, tab `salvataggio` e 15 nuovi ID missione presenti nel bundle remoto. Deploy precedenti: `45621222465` / `index-Cuk6AnYj.js` (`f08ed04`), `45616242811` / `index-CWJT4Ahe.js` (`b7f2716`), `45606128039` / `index-BK9wvC9o.js` (`c9fddbd`).
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

## Fase missioni, UI responsive e Pianura OSM (dopo `eeb5a3c`)

- **Pianura OSM operativa**: generate 41 impronte reali, `tiles=610`, `props=0`, compressione 1,00 e ancoraggi `way:580193824:centroid->(32,23)` / `way:148046054:centroid->(32,8)`. Stazione Circumflegrea e Bar Etoile verificati fuori griglia: nessun edificio inventato in piazza, solo varco metro e targa direzionale.
- **20 missioni reali**: 5 storiche corrette + 15 nuove con NPC assegnante, dialoghi `quest_start`, obiettivi verificati, destinazioni raggiungibili, ricompense economiche e salvataggio. `casa_tua` usa `buyproperty.target: 'monolocale'`; `richiamo_mare` e `casa_tua` non hanno più target `fish`/`sleephome` errati. `S.quests` tollera salvataggi v1 senza `quests` o con dati parziali.
- **Rotazione**: canvas logico `480×270` invariato; portrait/landscape cambiano solo CSS, classi e safe-area, senza toccare camera, `gameRef`, `screen`, mappa, posizione, save o rimount. Test Playwright dedicato (`tests/rotation.spec.js`) verificava già l'equivalenza prima e dopo il tap sul menu.
- **Dock icone**: chiuso di default, in alto a destra (fuori dal joystick), con mappa, inventario, missioni, telefono, portafoglio, profilo, lavori, impostazioni e salvataggio. Tab `salvataggio` reale in `PhoneMenu` con `CL.game.save()` ed export/import.
- **Playwright aggiornato a 1.65.1**: con Node 26.13.1 il runner 1.52 non scopriva alcun test. I vecchi specs di camminata usavano coordinate di portali obsolete: ora leggono i portali dalla mappa viva e usano il pathfinding del gioco; church/bar camminano davvero dallo spawn, il test d'insieme sugli interni usa un fixture di posizionamento solo per le porte isolate dalla rete OSM (es. metro) e mantiene input reale per l'attraversamento.
- **Gate**: `regression.mjs` **42/42**, Playwright **6/6**, visual-explore **2 dispositivi × 26 mappe, 0 errori/occlusioni/profondità/geometria**, texture audit **50/50 PNG e 21/21 facciate**, render audit **0 errori**, mobile-start su build locale e pubblica **OK**, build Vite OK, `git diff --check` OK. Le analisi VL proseguono solo su singole immagini `*-nohud` generate da `vl-capture.mjs`.

**Pubblicazione finale di questa fase** — commit `328ff32` su `main`, workflow `45698019779` `success` (build `139500425408`, deploy `139500803114`, step `Mobile start smoke (touch)` nella CI `success`), bundle remoto `index-CuXWYgWz.js`, URL invariato `https://walkingbad10.github.io/campania-life/`. Verificati nel bundle pubblico: marker beta, chiave save `campania_life_save_v1`, tab `salvataggio` e tutti i 15 ID missione nuovi. Smoke test touch ripetuto sul sito pubblico con esito OK.

## Revisione artistica professionale — 26 novembre 2026

- **Renderer confermato**: `client/scripts/perf-benchmark.mjs` misura la build pubblicata su Pixel 9 Pro XL emulato nella scena di Piazza del Gesù Nuovo: idle `59,8 FPS` (16,74 ms medi, p95 16,70), movimento `60,0 FPS` (16,67 ms medi, 0 frame >20 ms), canvas `480 × 270`. Phaser, PixiJS, Godot, Excalibur, Matter.js, Tiled e LDtk sono stati valutati ma non adottati: il limite non è l'API grafica bensì la progettazione degli asset. Decisione completa in `docs/RENDERER_DECISION.md`.
- **Asset recuperati in `art.js`**: attività interrotta ripresa e completata con `_depthOverlay()` (tetti a coppi, comignoli, pareti laterali in ombra, finestre di fianco, ombra al basamento) per le facciate procedurali, `_m1Reveal()` (reveal laterale e ombra a terra) per i prospetti M1, 16 varianti deterministiche del basolato e 8 di marciapiedi/lastroni, ombre di contatto degli alberi rafforzate. Nessuna dimensione, ancoraggio o collisione modificata.
- **VL dedicata**: screenshot `*-nohud` acquisiti prima/dopo con `CL_QA_OUT` e analizzati singolarmente con `opencode/nemotron-3.5-super-vl-free`, confrontando con `photo-refs/`. Il confronto conferma minore ripetitività del selciato (tono/usura per variante), tetto a coppi leggibile e rientro laterale parzialmente volumetrico. La VL non legge ancora l'ombra proiettata dei prospetti M1 a Piazza del Gesù come coerente: un probe pixel conferma che l'ombra è disegnata (4.970 pixel, Δ massimo 51), quindi il residuo è di leggibilità artistica, non di assenza nel renderer. La prospettiva 3/4 resta limitata dalla natura sprite dell'asset M1 ed è dichiarata come limite, non come difetto funzionale.
- **Gate**: regressione `42/42`, Playwright `6/6`, texture audit `50/50` PNG e `21/21` facciate, render audit `0 errori`, visual-explore `0 errori`, build CI-like OK. Checkpoint `checkpoint/pre-art-professional-pass` / `backup/pre-art-professional-pass` su `5c6e8bb`.

## Limiti dichiarati
- Le schermate e le metriche sono **emulazione Playwright/Chromium**, non test su dispositivi fisici.
- Il confronto visivo automatico di questa tornata usa `opencode/nemotron-3.5-super-vl-free`, che legge direttamente le immagini. `confronto-visivo.jpg` (rigenerato con la Guglia a 30 m) e le screenshot sono conservate anche per l'eventuale revisione umana.
- La distinzione finale tra 30 e 34 m per il monumento completo resta documentata in `PROPORTIONS.md`: il gioco usa 30 m, valore cauto e direttamente attestato dal Comune di Napoli.
- La verifica manuale finale su **MacBook e Google Pixel 9 Pro XL fisici** resta richiesta all'utente. Nessuna stabilità finale viene dichiarata prima del suo riscontro.
