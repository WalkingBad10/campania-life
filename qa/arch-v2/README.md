# QA architettonico / visivo — arch-v2

Ciclo autonomo successivo a `living-world-v1`. Obiettivo: collisioni effettive, simmetria/proporzioni/prospettiva, densità, mondo vivo, fedeltà campana e fluidità.

## Verifiche eseguite

- Regressione deterministica: **28/28 PASS**.
- Build locale Vite: **index-Bz_GEfx8.js**; build equivalente CI con `GH_PAGES_BASE=/campania-life/`: **index-CWDVnPpH.js**.
- Browser in-app Chromium: **0 errori console**.
- Metriche canvas su 24 mappe in `metrics.json`, confrontate con `qa/living-world-v1/metrics.json`.
- Nessuna mappa scende sotto la baseline di oltre `0.01` di `edgeDensity`; scostamento peggiore `-0.010` su `metro2`, `-0.008` su `bar` e `pizzeria`.
- Rendering medio su 120 frame in Chromium: Napoli `1.069 ms`, Costiera `0.654 ms`, bar `0.434 ms`, pizzeria `0.427 ms`. Non sono misure su dispositivi reali.

## Difetti confermati e corretti

1. **Facciate M1 con buchi trasparenti**: le PNG venivano adattate con aspect-fit e le bande vuote mostravano il basolato sottostante. Ora ogni facciata passa dal compositore: base procedurale + overlay M1 ancorato in basso. Copertura alpha misurata: **0% vuoto** su tutte le sette facciate.
2. **`palazzo_e` copriva il corridoio della metro**: l'overlay era alto 192 px e finiva sopra il passaggio pedonale `x56, y21-28`. Ora è alto **80 px**, limitato al footprint solido `y16-20`; il corridoio è verificato camminabile.
3. **Edicola sfalsata**: sprite a `41,34`, blocco solido `K` a `38-40,34-36`. Sprite riallineata a `38,34`.
4. **Tende coperte dalle facciate**: `decorSortY` delle tende ora le disegna sopra gli overlay edilizi.
5. **Arco del portale duplicato e sfalsato**: rimosso; la porta del Gesù resta sui tile `Y` ufficiali.
6. **Guglia con tasca camminabile**: le due celle interne `D` sono diventate `O`, eliminando il rischio di intrappolamento per salvataggi vecchi.
7. **POI visibili ma irraggiungibili**: raggio prompt differenziato per `landmark` (56 px) e `furniture`/`scenery` (36 px); la Reggia di Caserta è marcata decorativa e non genera più prompt fuori portata.
8. **Grotta del Vesuvio isolata**: scavati i tile `30,11`, `30,12`, `31,12`, `32,12`; portale e POI non spostati. Il test BFS conferma il collegamento dallo spawn.
9. **Molo e barca della Costiera non raggiungibili**: `o` non è più solido; aggiunta passerella `x63, y24-32`. `pescatore` e `barcaiolo` ora spawnano su superfici camminabili.
10. **Densità architettonica e vita**: cornicioni, balconi, panni stesi, reti da pesca e colonne ancorati a facciate/muri; nuovi residenti ambientali in Capri, Vesuvio, Pompei, Bacoli, Salerno, Avellino e Caserta.

## Invarianti preservate

- Formato salvataggio `campania_life_save_v1` e wrapper `{ v:1, t, data }` invariati.
- Nessuno spawn, portale o POI esistente spostato.
- Marker beta esatto: `BETA PUBBLICA · Richiede verifica manuale su MacBook e smartphone`.
- `D`, `Y` e `G` restano attraversabili; `U` e `E` restano solidi.

## Screenshot

Salvati in questa cartella: `napoli-plaza.png`, `napoli-metro.png`, `costiera-molo.png`, `vesuvio-grotta.png`, `pompei-scavi.png`, `caserta-reggia.png`, `bar-interior.png`, `casa-nonna.png`.

Il modello non può leggere direttamente le immagini: la revisione automatica si è basata su metriche canvas, copertura alpha degli sprite, mappe semantiche dei tile e bounding box dei decor. La revisione visiva umana resta necessaria.

## Limite dichiarato

Questo ciclo non sostituisce la verifica manuale finale su **MacBook** e **Google Pixel 9 Pro XL**. Nessuna stabilità finale viene dichiarata prima del riscontro dell'utente su quei dispositivi.
