# Riferimenti visivi (solo studio QA)

Queste immagini **non sono asset di gioco**: sono state scaricate solo per confronto umano e non vengono copyate nei file distribuiti da `client/dist`.

| File | Fonte | Licenza | Uso |
|---|---|---|---|
| `satellite.jpg` | Esri World Imagery, `World_Imagery/MapServer/export`, bbox `14.2508,40.8463,14.2533,40.8481` | Servizio cartografico Esri; solo studio locale | Geometria della piazza |
| `naples_piazza_gesu_nuovo.jpg` | [Commons](https://commons.wikimedia.org/wiki/File:Naples_piazza_gesu_nuovo.JPG), Velvet | CC BY-SA 3.0 | Prospetto del Gesù e rapporto piazza/chiesa |
| `piazza_del_gesu.jpg` | [Commons](https://commons.wikimedia.org/wiki/File:Piazza_del_Ges%C3%B9.jpg), Mattia Luigi Nappi | CC BY-SA 3.0 | Palazzo Pandola e obelisco |
| `gesunuovo.jpg` | [Commons](https://commons.wikimedia.org/wiki/File:Ges%C3%B9nuovo.JPG), Pinotto992 | CC0 | Dettaglio facciata |
| `gesnuovo.jpg` | [Commons](https://commons.wikimedia.org/wiki/File:Gesnuovo.jpg) | Public domain | Dettaglio facciata |
| `obelisco_immacolata3.jpg` | [Commons](https://commons.wikimedia.org/wiki/File:Obelisco_Immacolata3.jpg) | Public domain | Guglia dell'Immacolata |

Dati vettoriali: OpenStreetMap API, way `563345000` (piazza), `261249895` (chiesa), `261256738` (guglia). Testo urbanistico: [Wikipedia it](https://it.wikipedia.org/wiki/Piazza_del_Ges%C3%B9_Nuovo).

## Fonti del consolidamento metrico e delle nuove zone

- Guglia, monumento completo «alto oltre trenta metri»: [Comune di Napoli / Art Bonus](https://artbonus.gov.it/guglia-dellimmacolata-concezione.html). Disegni di restauro 2026 con livelli fino a `+36 m`: [Portale Appalti Comune di Napoli](https://acquistitelematici.comune.napoli.it/PortaleAppalti/do/FrontEnd/DocDig/downloadDocumentoPubblico.action?id=61112). Misura storica 130 palmi ≈ 34 m: [Volpe / Degli Onofri, 1847](https://era-prod11.ethz.ch/download/pdf/28965709.pdf). I 22 m restano attribuiti al solo obelisco ([Wikipedia it](https://it.wikipedia.org/wiki/Obelisco_dell%27Immacolata)).
- Campanile di Santa Chiara, `height = 48 m`: [OSM way 150562144](https://www.openstreetmap.org/way/150562144).
- Bacoli / Baia: parco archeologico [OSM way 124092891](https://www.openstreetmap.org/way/124092891), castello aragonese [OSM way 144917231](https://www.openstreetmap.org/way/144917231), templi di Diana, Mercurio e Venere (impronte 39×30, 22×22, 34×33 m).
- Fuorigrotta: stadio [OSM way 22790881](https://www.openstreetmap.org/way/22790881), Piazzale Tecchio ≈ 231×198 m, Teatro Mediterraneo ≈ 99×79 m, griglia ENE-WSW e filari di palme.
- Pianura: Piazza San Giorgio [OSM way 580193824](https://www.openstreetmap.org/way/580193824) ≈ 85×94 m, chiesa 40×31 m, borgo in piperno e tufo sul versante di Camaldoli.

Queste fonti sono usate solo per misure e disposizione: nessuna immagine protetta è stata copiata negli asset distribuiti.

I fogli estratti locali e gli asset M1 non referenziati dal motore sono conservati in `qa/campania-open-code-1/_source-sheets/` (esclusi da Git e dal build). La cartella distribuita `client/public/assets/pixel/` contiene solo i 50 PNG effettivamente caricati da `art.js`; `texture-audit.mjs` verifica questo inventario e ricomposizione delle campate laterali delle facciate M1.
