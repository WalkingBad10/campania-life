# CAMPANIA OPEN CODE 1 — Specifica definitiva asset PNG
## Scope: Piazza del Gesù Nuovo, Chiesa, Bar, NPC, Arredi urbani

Questa specifica è **definitiva per il primo blocco di qualità**.  
Non usare la precedente tavola illustrativa; non incollare immagini intere come sfondo.  
Ogni file deve essere **originale**, **pixel art pulita**, con **sfondo trasparente** dove indicato, senza testo raster, senza cornici, senza alone/sporco di ritaglio.

## Regole globali

- **Formato:** PNG RGBA, 8 bit/canale.
- **Trasparenza:** reale (alpha), non finto sfondo azzurro/bianco.
- **Griglia:** multipli di 16 px per tile/building footprint; sprite personaggi su griglia pixel art coerente.
- **Anti-alias:** nessun blur; bordi pixel-perfect.
- **Pivot/logica:**
  - Tile: intero tile 16x16.
  - Overlay edifici/prop: ancoraggio **bottom-left** sulla coordinata tile di piazzamento già usata dal motore, salvo diversa indicazione nel manifest.
  - Personaggi: pivot al centro dei piedi (bottom-center del frame).
- **Palette:** coerente Napoli calda/mediterranea; evitare neon fuori contesto.
- **Nomi file:** esatti come sotto, dentro `client/public/assets/pixel/`.
- **Collisioni/interazioni:** non cambiano con gli asset; gli asset devono rispettare footprint e proporzioni indicate.

## 1) Edifici esterni / landmark

| Nome file | Dim. PNG (px) | Sprite/tile | Disposizione elementi | Sfondo trasparente | Animazioni |
|---|---:|---|---|---:|---|
| `gesu-facade.png` | 352x208 | Sprite singolo 352x208 | Facciata Chiesa del Gesù Nuovo: bugnato a punta di diamante, portale marmoreo centrale, cornici, finestre superiori; nessun cielo/strada. Baseline inferiore allineata al bordo edificio. | Sì | No |
| `guglia.png` | 128x176 | Sprite singolo 128x176 | Guglia dell’Immacolata: base marmorea, statue angolari, obelisco, decorazioni bronzee, Madonna/croce apicale. | Sì | No (opzionale futuro: nessuna) |
| `palazzo-ne.png` | 320x192 | Sprite singolo 320x192 | Palazzo storico nord-est: facciata ocra, persiane, balconi, cornicione, portone; stile distinto. | Sì | No |
| `palazzo-sw.png` | 256x128 | Sprite singolo 256x128 | Palazzo sud-ovest: facciata chiara, finestre/persiane, base in pietra. | Sì | No |
| `palazzo-banca.png` | 160x128 | Sprite singolo 160x128 | Edificio banca: ingresso sobrio, finestre regolari, insegna integrata nel pixel art (solo forma/colore, no testo leggibile esterno). | Sì | No |
| `palazzo-bar.png` | 128x128 | Sprite singolo 128x128 | Edificio bar: vetrina, tenda, ingresso; eventuale insegna come elemento grafico stilizzato, no testo raster. | Sì | No |
| `palazzo-se.png` | 128x128 | Sprite singolo 128x128 | Palazzo sud-est: variante facciata, persiane/verdi. | Sì | No |
| `palazzo-e.png` | 160x192 | Sprite singolo 160x192 | Palazzo est: facciata alta, balconi, cornicione. | Sì | No |

## 2) Pavimentazione / tile esterni

| Nome file | Dim. PNG (px) | Sprite/tile | Disposizione elementi | Sfondo trasparente | Animazioni |
|---|---:|---|---|---:|---|
| `piazza-tiles.png` | 128x64 | 8 col x 4 righe = 32 tile, ogni tile 16x16 | Ordine righe per righe (L->R, top->bottom): `basalto`, `basalto_var1`, `basalto_var2`, `sagrato`, `sagrato_bordo_n`, `sagrato_bordo_s`, `sagrato_bordo_e`, `sagrato_bordo_w`, `marciapiede`, `marciapiede_bordo`, `strada`, `strada_linea`, `attraversamento`, `cordolo`, `ombra_edificio`, `accento_pietra`, restanti 16 tile riservati/varianti (riempire con varianti coerenti o trasparenza). | No per tile pieni; alpha ammesso solo per overlay/ombra | No |

> Nota: finché non fornito, il motore continua a usare i tile procedurali attuali.

## 3) Arredi urbani / props esterni

| Nome file | Dim. PNG (px) | Sprite/tile | Disposizione elementi | Sfondo trasparente | Animazioni |
|---|---:|---|---|---:|---|
| `urban-props.png` | 256x128 | 8 col x 4 righe, cella 32x32; ogni prop centrato nella cella con pivot bottom-center | R1: `lampione_off`, `lampione_on`, `panchina`, `fioriera`, `cartello`, `carretto`, `tavolino_bar`, `sedia_bar`; R2: `edicola`, `ombrellone`, `cestino`, `segnale_piazza`, `pianta_alta`, `pianta_piccola`, `colonnina`, `riservato`; R3-R4: varianti/riserva. | Sì | `lampione_on` può avere 2 frame opzionali futuri; per ora statico |
| `urban-props-shadow.png` | 256x128 | Stessa griglia 32x32 di `urban-props.png` | Ombre a terra morbide corrispondenti ai prop (stesso indice/cella). | Sì (alpha morbida) | No |

## 4) Chiesa - interni

| Nome file | Dim. PNG (px) | Sprite/tile | Disposizione elementi | Sfondo trasparente | Animazioni |
|---|---:|---|---|---:|---|
| `church-tiles.png` | 128x128 | 8x8 tile, 16x16 ciascuno | R1: `marmo`, `marmo_decor`, `tappeto_rosso`, `tappeto_bordo`, `muro_interno`, `muro_affresco`, `colonna`, `arco`; R2: `altare_base`, `altare_top`, `panca`, `inginocchiatoio`, `cappella_sx`, `cappella_dx`, `porta_interna`, `finestra`; R3: `candela_off`, `candela_on1`, `candela_on2`, `dipinto`, `statua_base`, `statua_top`, `oro_trim`, `pavimento_presbiterio`; R4-R8: varianti/riserva. | No per tile pieni; alpha solo dove necessario | Candele: 2 frame (`candela_on1/on2`) |
| `church-props.png` | 256x256 | 8x8 celle, 32x32; prop multi-tile composti da più celle/ancoraggi indicati in manifest | Altare maggiore, pulpito, confessionale, croce, lampadario, banchi, statue, candelabri, fiori, leggio. Ogni elemento con ID in manifest. | Sì | `lampadario_glow`/`candela` opzionali 2 frame |

## 5) Bar - interni

| Nome file | Dim. PNG (px) | Sprite/tile | Disposizione elementi | Sfondo trasparente | Animazioni |
|---|---:|---|---|---:|---|
| `bar-tiles.png` | 128x128 | 8x8 tile, 16x16 | R1: `pavimento_bar`, `muro_bar`, `zoccolino`, `bancone_top`, `bancone_front`, `scaffale`, `vetrina`, `porta`; R2: `tavolo`, `sedia`, `sgabello`, `cassa`, `macchina_caffe`, `lavandino`, `menu_board`, `finestra`; R3-R8: varianti. | No per tile pieni; alpha dove necessario | `macchina_caffe` opzionale 2 frame vapore |
| `bar-props.png` | 256x192 | 8x6 celle, 32x32 | Bancone lungo, retrobanco bottiglie, vetrina dolci, macchina espresso, tavoli, sedie, lampade calde, pianta. | Sì | `macchina_caffe_steam` opzionale 2 frame |

## 6) NPC / personaggi

| Nome file | Dim. PNG (px) | Sprite/tile | Disposizione elementi | Sfondo trasparente | Animazioni |
|---|---:|---|---|---:|---|
| `npc-sheet.png` | 512x384 | Frame 16x24; 32 colonne x 16 righe | 8 NPC x 2 righe ciascuno (4 dir x 4 frame = 16 frame/NPC), oppure blocchi 4x4 per NPC. Ordine NPC: `nonna`, `barista`, `prete`, `turista`, `studente`, `venditore`, `signora`, `musicista`. Direzioni per blocco: `down`, `left`, `right`, `up`. Frame: `idle`, `walk1`, `walk2`, `walk3`. | Sì | Sì, camminata 4 frame/direzione |
| `npc-portraits.png` | 256x64 | 8 ritratti, 32x32 ciascuno | Stesso ordine NPC di `npc-sheet.png`, una riga 8x2 o 8x1; usare 8x2 con espressione neutra/felice opzionale. | Sì | No |

## 7) UI/FX luce opzionali (non bloccanti)

| Nome file | Dim. PNG (px) | Sprite/tile | Disposizione elementi | Sfondo trasparente | Animazioni |
|---|---:|---|---|---:|---|
| `light-fx.png` | 128x64 | 4x2 celle, 32x32 | `lampione_glow`, `window_glow_warm`, `candle_glow`, `interior_ambient`, restanti riserva. | Sì | No |

## Vincoli di consegna

- Nessun elemento deve contenere testo leggibile, watermark, firma, cornice o sfondo di presentazione.
- Nessuna deformazione per riempire box: se proporzione diversa, usare canvas trasparente e asset centrato.
- Se un asset non è pulito, **non consegnarlo**: meglio mancante; il motore mantiene fallback attuale.
- Dopo consegna asset, l’integrazione dovrà preservare: salvataggi `campania_life_save_v1`, collisioni, POI, interazioni, controlli touch/tastiera, stesso URL GitHub Pages.

