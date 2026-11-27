# Geografia di Pianura — Piazza San Giorgio

Documentazione della mappa `pianura` (`client/src/game/maps.js`), basata sulle
geometrie OSM già incorporate in `client/src/game/osm-geometry.js` e sulle fonti
verificate in `qa/campania-open-code-1/references/SOURCES.md`.
Nessun edificio o asse viario è stato inventato per riempire la viewport.

## 1. Bbox, proiezione e griglia

- Dato grezzo: `qa/campania-open-code-1/osm-data/pianura.json`, bbox
  **40.860–40.866 N / 14.173–14.180 E** (OpenStreetMap, ODbL).
- `CL_OSM.maps.pianura.source` = `pianura.json`, integrato dai file
  `ways/580193824.json`, `ways/148046054.json`, `ways/262236201.json`.
- Ancoraggi: `way:580193824:centroid` → cella `[32,23]`;
  `way:148046054:centroid` → cella `[32,8]`. Base `p`, compressione
  `1.0037681832888004`.
- La piazza OSM (way `580193824`) misura ≈85×93 m; la viewport è 64×40 celle a
  2 m/cella (128×80 m logici), con compressione anamorfica dell'asse N–S.
  In questa griglia **alto = SUD** e **sinistra = OVEST**.
- Su 610 tile proiettate, 458 sono applicate dall'overlay; `props` è vuoto.
  L'overlay applica solo superfici camminabili e non tocca masse edilizie,
  spawn, portali, POI o NPC.

### Assi e punti reali dentro il bbox

| Elemento | OSM | Note |
| --- | --- | --- |
| Piazza San Giorgio | way `580193824`, `580193820`, `580202130` | lastrico e carreggiate proiettate |
| Chiesa di San Giorgio Martire | way `148046054` | 39,8×31,2 m |
| Municipio | way `262236201` | 38,6×25,2 m, fuori viewport (targa a ovest) |
| Via Don Vincenzo Simeoli | way `144838300` | asse reale a ovest |
| Corso Duca d'Aosta | way `580193823` | asse reale a sud/ovest |
| Via Giorgio De' Grassi | way `144838126` | marciapiede protetto (riga 37) |
| Via Comunale Napoli | way `144836104` | bordo ovest |
| Via Luigi Santamaria | way `144837383` | bordo est |
| Via dell'Avvenire | way `262236202` | nel bbox |
| Vico Carrozzieri | way `580186539` | nel bbox |
| Acqua potabile | node `12712820567` | unico servizio mappato in piazza |
| Commissariato | node `13081434980` | nel bbox |
| Ingresso principale | node `1611559223` | `entrance=main` |

Nell'area stretta della piazza OSM **non mappa negozi, bar, banchine, panchine
né lampioni**. Tutti i dettagli urbani aggiunti (tombini, griglie, panchine,
lampioni, cassonetti, fioriere, targhe, veicoli parcheggiati) sono **decor
originali non solidi**, non POI georeferenziati. Non entrano in
`PROP_FOOTPRINTS` né in `SOLID`; i dettagli sulle facciate usano
`sortY = base_facciata + 1`.

## 2. Impronte edilizie usate

`CL_OSM.maps.pianura.buildings` contiene **41 impronte**. Ne sono state usate
**14** (senza duplicazioni):

### Già facciate prima di questo intervento (6)

| Way OSM | Bbox proiettato [x0,y0,x1,y1] | Massa in griglia |
| --- | --- | --- |
| `148046054` (chiesa) | [22.39,0.95,41.61,15.05] | (22,1) 20×15 |
| `656057487` | [3.54,21.38,9.82,28.38] | (4,21) 6×7 |
| `656057490` | [12.96,16.05,20.51,30.46] | (13,16) 8×14 |
| `656057491` | [8.16,13.77,13.08,27.8] | (8,14) 5×14 |
| `624279817` | [49.05,25.69,53.56,33.84] | (49,26) 5×8 |
| `656237918` | [39.53,8.2,57.1,20.59] | (40,8) 17×13 |

### Condomini reali aggiunti (8)

| Way OSM | Bbox proiettato | Parte visibile usata |
| --- | --- | --- |
| `656237875` | [12.36,-0.14,20.91,8.22] | (13,1) 5×6 |
| `656237919` | [46.21,2.83,50.52,12.26] | (47,3) 4×5 |
| `656237916` | [45.63,-2.36,62.87,6.18] | (51,0) 6×6 (settore NE) |
| `656057486` | [1.93,31.87,9.39,38.66] | (2,32) 7×5 (riga 37 esclusa) |
| `656057488` | [10.41,31.47,19.95,37.83] | (14,32) 7×5 (varco metro libero) |
| `656057489` | [17.76,33.62,28.22,41.49] | (21,33) 8×4 (riga 37 esclusa) |
| `624279820` | [33.2,27.45,41.32,39.71] | (34,32) 7×5 (asse x41 libero) |
| `624279818` | [50.6,22.39,57.13,26.92] | (54,23) 4×3 |

**Criterio.** Un volume viene disegnato solo se il way è presente in `buildings` (guardia
esplicita: senza fonte non si disegna nulla); si prende solo la porzione di
bbox dentro la griglia 64×40, ritagliata per non coprire portali, POI, NPC, il
marciapiede di Via De' Grassi (riga 37) o le carreggiate OSM. La chiesa e le
cinque case non vengono duplicate. Verifica sull'overlay: le uniche differenze
di griglia rispetto alla versione senza condomini sono 235 celle `.` → `#`
**dentro** questi otto rettangoli; nessuna altra tile è cambiata e la
raggiungibilità di spawn/portali/POI/NPC è invariata.

## 3. Riferimenti fuori bbox (solo targhe)

Nessuno di questi elementi è stato trasformato in edificio, negozio o POI
georeferenziato dentro la piazza. Le distanze sono calcolate dal centroide del
way `580193824` (40.8633467 N, 14.1774873 E).

| Luogo | OSM | Coordinate | Distanza | Trattamento |
| --- | --- | --- | --- | --- |
| Stazione Pianura (Circumflegrea, EAV) | node `4936292644`, wikidata `Q3970470` | 40.8560001 N, 14.1624307 E | ≈1,5 km a WSW | targa `traffic_sign` al bordo ovest (3,20) |
| La Trencia (Circumflegrea, EAV) | node `325241710`, wikidata `Q3969897`; fermata `8754083182`; vie `580054672`, `522836380` | 40.8540341 N, 14.1719378 E | ≈1,1 km a SSW | targa `traffic_sign` al bordo ovest (3,30) |
| Bar Etoile | node `11832545501` (`amenity=fast_food`, `fast_food=cafeteria`) | 40.8556796 N, 14.1583237 E | ≈1,82 km a WSW | targa direzionale esistente (1,27) |
| Milite Ignoto | non georeferenziato | — | — | targa storica qualitativa (14,27) |

Per Bar Etoile coesistono due fonti: il node OSM `11832545501`, Via Montagna
Spaccata 449 (~1,82 km), e la vecchia citazione di directory in Via Montagna
Spaccata 23, Pozzuoli (~3,6 km). Il testo della targa conserva la seconda
dicitura per continuità con la mappa storica; la posizione reale resta fuori
bbox in entrambi i casi.

## 4. Verifica

- `node --check client/src/game/maps.js` (node bundled in `.tools/node/bin`).
- Nessun duplicato `(type,x,y)` tra i 26 mappe; in particolare `fuorigrotta`
  conserva un solo `street_detail` in (52,26) (`mosaic_step`), con la panchina
  spostata in (48,26).
- `sortY` dei dettagli di facciata = base sprite + 1; dettagli su più finestre
  della stessa facciata condividono legittimamente lo stesso `sortY`.
- Nessuna modifica a `spawn`, `portal`, `poi` esistenti, `exitSpawn`,
  `PROP_FOOTPRINTS`, `OSM_STRIP`, `OSM_ALLOW`, `applyOsmGeometry`,
  `expandInterior` o alle dimensioni delle griglie.
- Generazione deterministica: due caricamenti con lo stesso seed producono
  hash identico di decors, griglia, spawn, portali e POI.
