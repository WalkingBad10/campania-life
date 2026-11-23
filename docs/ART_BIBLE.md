# CAMPANIA LIFE — Art Bible

## 1. Obiettivo

Pixel art originale leggibile e profonda, ispirata alla **chiarezza compositiva** dei JRPG portatili, con identità campana: terracotta, mare, limoni, roccia vulcanica, intonaco bianco.

> Non vengono copiati sprite, creature, musiche o mappe di opere esistenti. Ogni pixel è generato da codice originale.

## 2. Griglia e dimensioni

| Elemento | Dimensione |
|---|---|
| Tile | 16 × 16 px |
| Personaggi | 16 × 24 px |
| Creature | 24 × 24 px (corpo ~16 × 14) |
| Alberi | 32 × 40 px |
| Rocce | 20 × 14 px |
| Veicoli | 24–34 × 20 px |
| Ritratti | 32 × 32 px (character 2×) |
| Risoluzione logica | 480 × 270 px (16:9) |

Scaling: `image-rendering: pixelated`, `imageSmoothingEnabled = false`. Nessun filtro anti-alias sui sprite.

## 3. Palette

| Ruolo | Colore | Hex |
|---|---|---|
| Cream (testo) | avorio | `#f6e8c8` |
| Oro (accenti/UI) | giallo sole | `#e9b84a` |
| Terra | terracotta | `#c75b3b` |
| Mare | azzurro profondo | `#2c7a9c` |
| Notte | blu notte | `#123044` |
| Erba | verde oliva | `#79a655` |
| Ulivo | verde scuro | `#5f7a45` |
| Roccia | grigio caldo | `#7c7b71` |
| Vulcano | rosso lava | `#e8613c` |
| Contorno | quasi nero | `#241f26` |

Regole:
- Contorno scuro consistente su personaggi e creature per leggibilità su qualsiasi sfondo.
- Ogni superficie ha almeno 2 toni (luce/ombra) + 1 dettaglio.
- Nessun gradiente sui sprite: solo dither e blocchi di colore.
- Le ombre sono ellissi semitrasparenti sotto le entità.

## 4. Animazioni

- Personaggi: 4 frame di camminata (2 reali + rimbalzo), 4 direzioni, 1,4 fps a riposo.
- Creature: 2 frame di bob verticale + micro-vagabondaggio.
- Alberi: statici con variazioni di palette per evitare ripetizioni.
- Acqua: 3 righe di schiuma generate con RNG deterministico per tile.
- Pioggia: particelle in screen-space, velocità legata al meteo.

## 5. Profondità e illuminazione

- Ordine di disegno: grounded → oggetti alti ed entità ordinati per coordinata Y → overlay → HUD.
- Alberi e rocce possono coprire il giocatore quando sono "davanti".
- Illuminazione: overlay blu notturno (fino al 68% alfa), tinta arancione al tramonto, vignettatura radiale.
- Interni usano pavimenti chiari e contorni caldi; esterni usano verde/azzurro saturi.

## 6. Architettura

I tile sono disegnati una volta in canvas offscreen e riusati (`CL.art.tiles`). I personaggi sono composti da rettangoli parametrici (capelli, pelle, vestito, pantaloni) con cache per colore+direzione+frame. Le creature usano primitive pixelate (ellissi rasterizzate) con dettagli specifici per specie.

Vantaggi: zero download, zero licensing, coerenza visiva e possibilità di aggiungere nuove creature scrivendo un solo `case` in `art.js`.
