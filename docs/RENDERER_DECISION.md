# Decisione tecnica: renderer e qualità artistica

Data: 26 novembre 2026 · Checkpoint ripristinabile: `checkpoint/pre-art-professional-pass` / `backup/pre-art-professional-pass` su `5c6e8bb`.

## 1. Architettura attuale

- **Runtime**: React 18 only come shell UI; motore autonomo `window.CL` in JavaScript vanilla, canvas logico `480 × 270`.
- **Rendering**: Canvas 2D con `imageSmoothingEnabled = false`, pipeline separata suolo → facciate/strutture → entità ordinate per profondità → atmosfera → luci → HUD.
- **Asset**: 50 PNG distribuiti, generati/estratti una volta e caricati con barriera `CL.art.imagesReady`; tutto il resto è pixel art disegnata a runtime in `art.js`.
- **Geografia**: `osm_projection.py` genera `osm-geometry.js`; 11 mappe esterne ricevono geometria OSM reale, 15 interni restano invariati.
- **Interazione**: hitbox indipendenti dalla grafica, `blockedBox`, `doorClosed`, `propBlocks`, pathfinding sub-step, collisioni su giocatore/NPC/veicoli.
- **Persistenza**: `campania_life_save_v1`, wrapper `{ v:1, t, data }`, 20 missioni, economia e immobili già verificati.

## 2. Scena di prova prima di qualsiasi migrazione

`client/scripts/perf-benchmark.mjs` misura il loop reale della build pubblicata con emulazione **Google Pixel 9 Pro XL** (viewport `448 × 997`, DPR 3, Chrome headless), sulla scena di riferimento **Piazza del Gesù Nuovo**:

| Stato | Frame | Medio | p95 | Max | FPS | Frame >20 ms |
|---|---:|---:|---:|---:|---:|---:|
| Idle | 238 | 16,74 ms | 16,70 ms | 33,30 ms | 59,8 | 1 |
| Movimento reale (`ArrowRight`) | 238 | 16,67 ms | 16,70 ms | 16,80 ms | 60,0 | 0 |

Canvas confermato `480 × 270`, mappa `napoli`. Non è stato necessario migrare: il collo di bottiglia non è l'API di disegno, ma la **progettazione degli asset**.

## 3. Valutazione alternative

| Opzione | Giudizio | Decisione |
|---|---|---|
| **Phaser** | Ottimo per scene/game object, ma duplicherebbe loop, input, camera e mappe già implementati; non migliora la pixel art. | Non adottato |
| **PixiJS** | WebGL darebbe batching, ma a 60 FPS già raggiunti aggiungerebbe bundle e riscrittura di layer/ancore/salvataggi senza guadagno visivo. | Non adottato |
| **Godot** | Web export pesante, non compatibile con l'attuale motore JS e con i salvataggi esistenti. | Non adottato |
| **Excalibur.js** | API 2D valida, ma nessun vantaggio misurato sulla scena reale. | Non adottato |
| **Matter.js** | Solo fisica: risolve un problema già coperto da hitbox/sub-step e non gestisce rendering. | Non adottato |
| **Tiled / LDtk** | Editor di mappe, non runtime; la fonte autorevole resta il generatore OSM + griglie `maps.js`. | Non adottato |

**Conclusione**: renderer Canvas 2D confermato. La qualità percepita viene migliorata intervenendo su `art.js`, non sostituendo il motore.

## 4. Intervento asset recuperato

L'attività interrotta sul miglioramento degli asset è stata ripresa e completata:

1. **Facciate procedurali** (`_depthOverlay`): tetto a coppi con comignoli e antenna, cornice, ombra sotto la gronda, parete laterale in ombra con aperture in scala, ombra di contatto al basamento. Nessuna modifica a dimensioni, ancore o collisioni.
2. **Prospetti M1** (`_m1Reveal`): reveal laterale stretto e ombra a terra; le immagini estratte restano l'unica fonte di finestre, portali e decorazioni.
3. **Basolato**: 16 varianti deterministiche per `D`, 8 per marciapiedi/lastroni, contro le 4 precedenti. Nessun PNG aggiunto.
4. **Alberi**: ombra di contatto rafforzata (ellissi più larghe e opacity `.24`/`.32`).
5. **Corpi edilizi** (`engine.js`): `drawFacade()` centralizza M1 e facciate procedurali, disegnando prima dell'asset una proiezione SE e una `groundShadow()` radiale proporzionali alla larghezza dell'edificio; non coprono mai finestre o portali.
6. **Personaggi** (`entities.js`): ombre di giocatore e NPC rese più leggibili (ellissi `9×5`, opacity `.55`/`.34` per il giocatore, `.48` per gli NPC) senza spostare l'ancoraggio dei piedi.
7. **Verifica strumentale dell'ombra**: con scena congelata, `groundShadow()` attiva/disattiva modifica 4.970 pixel del canvas `480×270` (Δ massimo 51). L'ombra è quindi effettivamente disegnata; resta una questione di leggibilità percepita, non di assenza nel codice.

Gli screenshot `*-nohud` sono stati acquisiti prima e dopo con `client/scripts/vl-capture.mjs` e analizzati singolarmente con `opencode/nemotron-3.5-super-vl-free`. Napoli M1, fuorigrotta, costiera e Pianura sono state confrontate con le fotografie di riferimento in `qa/campania-open-code-1/photo-refs/`.

## 5. Esito VL finale e limiti dichiarati

Il ciclo VL (`opencode/nemotron-3.5-super-vl-free`) è stato ripetuto su screenshot `*-nohud` prima/dopo e su immagini singole, non su gruppi:

- **Risolti e confermati**: basolato non più seriale (variazioni di tono e usura), tetto a coppi leggibile su Fuorigrotta, rientro laterale dell'edificio centrale parzialmente letto come volume.
- **Migliorati ma non chiusi**: ombre di personaggi e alberi ora visibili; ombra a terra delle facciate procedurali presente ma debole in alcuni punti.
- **Residuo dichiarato**: su Piazza del Gesù Nuovo la VL non legge ancora l'ombra proiettata degli edifici come un'ombra architettonica coerente, e il fronte M1 resta bidimensionale. Non è stato inventato un nuovo tetto sopra i prospetti M1, perché l'asset estratto resta l'unica fonte autorevole: il limite è dichiarato come artistico, non come regressione funzionale.
- **Non ripetute**: migrazioni di renderer o collisioni. Nessun PNG, hitbox, portale, missione o salvataggio è stato aggiunto o alterato.

## 6. Invarianti preservate

- Canvas logico `480 × 270`; `PX_PER_M = 8`, `TILE = 16 px`.
- Save key `campania_life_save_v1`, marker beta, 26 mappe, 20 missioni, economia, veicoli e immobili.
- Portrait/landscape senza rimount del canvas né perdita di posizione.
- Pubblicazione sullo stesso URL: `https://walkingbad10.github.io/campania-life/`.
