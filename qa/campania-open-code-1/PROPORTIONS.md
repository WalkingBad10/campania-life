# CAMPANIA OPEN CODE 1 — Specifica proporzioni architettoniche

Stato: **specifica vincolante** per il consolidamento proporzioni. Ogni asset,
collisione e decor delle **26 mappe** (24 esistenti + Fuorigrotta e Pianura)
deve essere coerente con le regole qui definite.

## 1. Metodo

1. Le dimensioni reali vengono prese da fonti documentate (ministeri, enti di
   ricerca, Wikipedia italiana con bibliografia, testate, OpenStreetMap).
2. Le foto di riferimento e le immagini satellitari servono a verificare
   **rapporti** (altezza/persone, larghezza/ingombro, posa in opera), non a
   "pressionare" gli asset a occhio.
3. Un solo fattore `PX_PER_M` converte metri reali in pixel di gioco per
   **tutta** l'architettura. Non esistono fattori diversi per monumenti diversi.
4. Le distanze geografiche tra masse edilizie possono essere compresse in modo
   moderato. Le proporzioni **interne** degli edifici e i rapporti dimensionali
   tra edifici, monumenti e persona **non** vengono compressi.
5. Gli asset non vengono allungati: vengono rigenerati alla risoluzione
   corretta, oppure (solo per i raster M1 già autoritativi) ridimensionati in
   modo **uniforme** con la stessa scala metrica.

Limitazione dichiarata: questo modello non dispone di analisi vision-language,
quindi la misurazione fotografica è stata fatta su fonti documentate e su
geometria OSM/satellitare. Il confronto finale screenshot ↔ foto richiede
revisione umana (vedi §8).

## 2. Fonti e numeri reali

| Elemento | Misura documentata | Fonte |
|---|---|---|
|Adulto di riferimento|1,70 m|convenzione antropometrica, fissata qui|
|Guglia dell'Immacolata — **monumento completo**|**~30 m** (minimo documentato "oltre trenta metri"; 130 palmi storici ≈ 34 m)|Comune di Napoli / Art Bonus — https://artbonus.gov.it/guglia-dellimmacolata-concezione.html; disegni di restauro 2026 con livelli fino a +36 m — https://acquistitelematici.comune.napoli.it/PortaleAppalti/do/FrontEnd/DocDig/downloadDocumentoPubblico.action?id=61112; stampa 1847, 130 palmi — https://era-prod11.ethz.ch/download/pdf/28965709.pdf|
|Guglia — obelisco da solo|**22 m**|Wikipedia it, *Obelisco dell'Immacolata* (cita Touring Club Italiano, p. 152) — https://it.wikipedia.org/wiki/Obelisco_dell%27Immacolata; storienapoli.it definisce esplicitamente «sopra i 22 metri che costituiscono l'altezza dell'obelisco» la statua soprastante|
|Guglia — ingombro OSM|15,71 × 15,58 m (area monumento, comprende gradini/balaurstra)|OSM way `261256738`, misurato dall'API 0.6|
|Guglia — larghezza base|15,7 m (ingombro OSM, gradini inclusi) ⇒ 126 px|OSM way `261256738`, verificato sulla sagoma dell'asset M1|
|Gesù Nuovo — prospetto|**56 m largo × 31 m alto**|Avvenire, 12/03/2023 — https://www.avvenire.it/agora/cultura/napoli-restaurata-la-facciata-del-gesu-nuovo-e-il-suo-misterioso-bugnato-a-piramide_65918|
|Gesù Nuovo — ingombro OSM|75,8 × 82,4 m ( complesso, non solo prospetto)|OSM way `261249895`|
|Piazza del Gesù Nuovo — ingombro OSM|93,7 × 76,1 m|OSM way `563345000`|
|Santa Chiara — campanile|**48 m** (height tag OSM), pianta quadrata ~14 m, tre ordini|OSM way `150562144` — https://www.openstreetmap.org/way/150562144; struttura a tre ordini: Wikipedia it, *Basilica di Santa Chiara (Napoli)* — https://it.wikipedia.org/wiki/Basilica_di_Santa_Chiara_(Napoli). I 50 m precedentemente usati erano un valore di lavoro non verificato|
|Santa Chiara — basilica|~130 m lunga × ~40 m larga × 45 m alta|Wikipedia it (cita Touring Club), stessa voce|
|Interpiano residenziale storico|3,0–3,3 m; piano terra 3,5–4 m|pratica architettonica corrente|
|Vesuvio|1281 m s.l.m.|INGV — https://www.ingv.it/somma-vesuvio|

### Conflitto 22 vs 30 metri — RISOLTO
Le due misure non descrivono lo stesso oggetto:

| Misura | Cosa misura | Fonti |
|---|---|---|
|**22 m**|Il solo **obelisco marmoreo**, senza la statua in rame dorato|Wikipedia it / Touring Club 2007; storienapoli.it: «sopra i 22 metri che costituiscono l'altezza dell'obelisco… la statua»|
|**~30 m**|Il **monumento completo** da pavimento alla sommità|Comune di Napoli, Art Bonus: «alto oltre trenta metri»; ponteggio 2026 di ~37 m «a tutta altezza»; disegno ufficiale con livelli 0/+3,13/+9,85/+14,92/+22,81/+30,40/+36 m; vigili del fuoco che salgono «a 30 metri» per depositare i fiori nelle mani della Vergine|
|**~34 m**|Misura storica del 1847: **130 palmi** (1 palmo pre-1840 = 0,26333 m)|Volpe/Degli Onofri e *Napoli in miniatura* (1847), «una guglia alta 130 palmi… che si vede alla sua cima in rame dorato»|

Il 22 m non può essere l'altezza del monumento completo: un ponteggio di
~37 m costruito «a tutta altezza» e un disegno che arriva a +36 m non avrebbero
senso per un oggetto di 22 m. L'obiezione «22 m ha bibliografia, 30 m no» è
stata superata dalle fonti comunali e dai disegni di restauro del 2026.

**Decisione**: lo sprite rappresenta il monumento completo, quindi usa
**30 m = 240 px**, valore arrotondato per difetto rispetto alle fonti
(«oltre trenta metri», 34 m storici). I 22 m restano documentati come altezza
del solo obelisco e giustificano la nuova anatomia con fusto allungato.
Restano non verificati: l'identificazione esatta del livello +30,40 m con la
punta della statua e la distinzione finale tra 30 e 34 m.

### Riferimenti documentati per le altre mappe
La tabella seguente raccoglie le misure verificate per i luoghi delle altre
23 mappe. Servono come **vincolo di rapporto** quando un elemento visibile
deve essere ridimensionato; dove la misura non è verificabile non si inventa
un numero, si lascia la scala uniforme `PX_PER_M` sul solo ingombro noto.

| Mappa / elemento | Misura documentata | Fonte | Uso |
|---|---|---|---|
|Vesuvio|1281 m s.l.m.|INGV — https://www.ingv.it/somma-vesuvio|quota del cono; non altezza del decoro|
|Pompei — area|~66 ha (scavi ~44–45 ha)|Parco Archeologico — https://pompeiisites.org/parco-archeologico-di-pompei/press-kit/|estensione, non edificio singolo|
|Pompei — Basilica, colonne|~11 m|Wikipedia it, *Basilica (Pompei)*|scala delle colonne decor|
|Caserta — Reggia|247 × 190 m, 41 m alta, parco 123 ha|Wikipedia it — https://it.wikipedia.org/wiki/Reggia_di_Caserta; PDF ministeriale — https://reggiadicaserta.cultura.gov.it/wp-content/uploads/2023/08/CsA-Manutenzione-e-pulizia.pdf|facciata e corpo centrale|
|Salerno — Castello di Arechi|~300 m s.l.m. (quota del colle, **non** del castello)|Italia.it — https://www.italia.it/it/campania/salerno/il-castello-d-arechi|quota del sito|
|Costiera Amalfitana|11231 ha (property UNESCO), ~30 km di costa|UNESCO — https://whc.unesco.org/en/list/830/|estensione, non singoli edifici|
|Capri — Faraglioni|Stella 109 m, Mezzo 81/82 m, Scopolo 106 m|Wikipedia it/en — https://it.wikipedia.org/wiki/Faraglioni_di_Capri|altezza dei faraglioni|
|Capri — Grotta Azzurra|60 × 25 × 22 m (Treccani: 54 × 30 × 15 m)|Wikipedia it — https://it.wikipedia.org/wiki/Grotta_Azzurra; Treccani — https://www.treccani.it/enciclopedia/grotta-azzurra/|ingresso della grotta, conflitto registrato|
|Bacoli — Terme di Baia|~1700 m², 62,5 × 27,5 m, pavimento a 3,75 m|Wikipedia it — https://it.wikipedia.org/wiki/Terme_sommerse_di_Punta_Epitaffio|complesso sommerso|
|Avellino — Colline Irpine|nessuna misura di monumenti POI; Terminio 1806 m s.l.m. (fuori mappa)|Wikipedia it — https://it.wikipedia.org/wiki/Terminio|nessun numero inventato per i POI|

Nota: per Amalfi NON usare il valore 36 m: esso si riferisce al campanile di
Vietri sul Mare, non al Duomo di Amalfi
(fonte: https://www.albadamare.it/it/i-campanili-della-costiera-amalfitana/).
Per Santa Chiara i 45 m sono l'altezza della basilica, non del campanile.

## 3. Il fattore di scala

`VIEW_W = 480 px`, `VIEW_H = 270 px`, `TILE = 16 px` (`core.js`).

Il vincolo che fissa la scala è il prospetto del Gesù Nuovo, l'elemento più
largo tra quelli che devono restare leggibili in un'unica inquadratura:

```
56 m × PX_PER_M ≤ 480 px   →  PX_PER_M ≤ 8,57
31 m × PX_PER_M ≤ 270 px   →  PX_PER_M ≤ 8,71
```

Si fissa **`PX_PER_M = 8`**, valore tondo che soddisfa entrambi i vincoli.

Conseguenze:

| Grandezza | Valore |
|---|---|
|`PX_PER_M`|8 px/m|
|1 cella di griglia (`TILE`)|16 px = **2,0 m** di suolo|
|Adulto 1,70 m|13,6 px (arrotondato a 14 px di sprite visibile)|
|Albero di sprite originale|23 px visibili ⇒ `SRC_PX_PER_M = 23/1,70 = 13,53`|
|Fattore uniforme sprite mondo|`WORLD_SCALE = 8 / 13,53 = 0,5914`|
|Guglia 30 × 15,7 m|**240 × 126 px** (asset M1 ricostruito con fusto allungato)|
|Gesù Nuovo 56 × 31 m|**448 × 248 px**|
|Campanile 48 m, base 14 m|**384 × 112 px**|
|Interpiano 3,2 m|25,6 px|
|Finestra ~6 m|48 px|

### Perché non 23 px/m (l'offset precedente)
Con l'adulto a 23 px, 1,70 m corrisponderebbero a 13,53 px/m e la Guglia
reale sarebbe 298 px: più alta dell'intero viewport (270 px), con la sommità
sempre fuori schermo. Inoltre il prospetto del Gesù sarebbe 758 px, quasi
due viewport, impossibile da ancorare al tessuto esistente senza riscrivere
l'intera piazza. La scala a 8 px/m mantiene **identici i rapporti** (30/1,70 =
17,6 volte l'adulto in entrambi i casi) rendendo però il monumento
effettivamente visibile e confrontabile con le fotografie. Con 22 m il
rapporto sarebbe 12,9, ma rappresenterebbe solo l'obelisco, non il monumento.

## 4. Politica di compressione

- **Non compressi**: rapporti interni di ogni singolo edificio/monumento
  (altezza/persone, larghezza/altezza, numero e proporzione degli ordini).
- **Compressi moderatamente**: solo le distanze tra masse edilizie e la
  superficie della piazza. La piazza reale è ~94 × 76 m; la mappa è
  72 × 48 celle = 144 × 96 m a 8 px/m: la griglia è già una "stanza urbana"
  schematizzata, con assi pedonali e ingombri semplificati.
- **Invarianti**: spawn, portali, POI già salvati non si spostano. Cambiano
  solo tile, decor, proprietà visive, collisioni e NPC.

## 5. Anatomia metrica della Guglia (30 m = 240 px)

Dal basso verso l'alto, in metri reali e pixel di gioco:

| Parte | Metri | Pixel (dal basso) | Note |
|---|---|---|---|
|Gradinata / basamento|0–4,0|0–32|Larghezza ~15,7 m = 126 px (OSM)|
|Plinth con 4 statue e rilievi|4,0–12,0|32–96|~8 m = 64 px|
|Fusto obelisco con fasce|12,0–25,0|96–200|**13 m = 104 px**: qui sta la differenza rispetto ai 22 m|
|Immacolata in rame e coronamento|25,0–30,0|200–240|~5 m = 40 px|

L'asset M1 originale (128 × 176 px) era corretto **per il solo obelisco**
(22 m): rapporto 128/176 = 0,73 contro 15,71/22 = 0,71. Con la misura
corretta del monumento completo serve un rapporto 15,71/30 = 0,52. L'asset
e' stato quindi **rigenerato** (`generate-monuments.py`) a 126 × 240 px
ricomponendo le regioni dell'M1: statue, cornici, plinth e gradini mantengono
le loro proporzioni, mentre il **solo fusto dell'obelisco** e' stato allungato
da 27 a 91 righe. Non e' stato applicato uno stiramento uniforme dell'immagine:
i dettagli fotografici M1 restano leggibili e la sagoma finale e' 126 px alla
gradinata, ~17 px sul fusto e ~15 px alla sommita'.

L'anchoring visivo resta l'area lapidea `rect(g,34,25,4,3,'O')` (8 × 6 m):
rappresenta il **cuore solido** del manufatto, mentre i gradini esterni (fino
a 15,7 m) restano attraversabili, come nella realtà. La base dell'asset
coincide con il bordo inferiore di quel rettangolo; lo sprite si sviluppa
verso l'alto e si allarga simmetricamente a sinistra/destra. Il POI `36,26`
resta invariato.

## 6. Impatto sulle 26 mappe

Il fattore `PX_PER_M` è globale (`core.js`) e la tabella delle facciate è
centrale (`art.js: buildingSprite()`). La correzione si applica quindi a
tutte le mappe che usano prospetti, senza duplicare livelli procedurali.
Le facciate M1 estratte restano l'unica fonte autorevole per Napoli: nessun
`facade_cornice` / `facade_balcony` generico. Le nuove zone usano facciate
procedurali metriche dedicate (`metric_facade` in `engine.js`) con dimensioni
derivate da OSM:

| Zona | Elemento | Dimensione reale | Sprite |
|---|---|---|---|
|Fuorigrotta|Teatro Mediterraneo|99 × 79 m|560 × 280 px (volume parziale)|
|Fuorigrotta|Isolato razionalista|24 × 18 m, 4-5 piani|192 × 144 px|
|Fuorigrotta|Torre Viale Augusto|20 × 30 m|160 × 240 px|
|Pianura|San Giorgio Martire|40 × 31 m|320 × 248 px|
|Pianura|Municipio|39 × 25 m|312 × 200 px|
|Pianura|Casa del borgo|20 × 14 m|160 × 112 px|
|Bacoli|Terme / templi|22–39 m di impronta|colonne e pavimenti metrici|
|Bacoli|Castello Aragonese|153 × 231 m (compresso)|288 × 176 px|

Gli elementi di piccola scala (personaggi, veicoli, alberi, arredo) vengono
portati alla stessa scala tramite `WORLD_SCALE`, applicato in modo uniforme
ai loro cache di sprite. I tile di suolo restano 16 × 16 px.

## 7. Regole di collisione e profondità

- Il rettangolo `O` della Guglia resta solido; la sua profondità di sort resta
  `ty*T + 3*T`. L'ingombro dell'ombra e del basamento deve stare dentro
  l'impronta solida o immediatamente adiacente.
- Facciate e campanile restano **sfondo architettonico** disegnato prima delle
  entità, per evitare il "sinking" del giocatore.
- Monumenti bassi, alberi e arredo restano nel depth sort.

## 8. Verifica prima della pubblicazione

1. `regression.mjs` con nuovi assert metrici (gate minimo 28/28).
2. `visual-explore.mjs` su 2 dispositivi × 26 mappe, 0 errori, 0 occlusioni.
3. `render-audit.mjs`: dimensioni **disegnate** dal motore, non solo sorgente.
4. Build locale Vite e build CI-like `GH_PAGES_BASE=/campania-life/`.
4. **Confronto umano** affiancato tra screenshot di gioco e
   `references/naples_piazza_gesu_nuovo.jpg`, `references/piazza_del_gesu.jpg`,
   `references/obelisco_immacolata3.jpg`, da prospettive comparabili.
5. Verifica fisica su MacBook e Google Pixel 9 Pro XL da parte dell'utente.

Fino al punto 5 il sito resta `BETA PUBBLICA · Richiede verifica manuale su
MacBook e smartphone`: non viene dichiarata stabilità finale.
