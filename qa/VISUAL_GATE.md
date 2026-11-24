# Gate visivo ripetibile

Questo gate integra i controlli deterministici di `client/scripts/regression.mjs` con le metriche del canvas lette nel browser in-app. Non sostituisce la verifica manuale su MacBook e Google Pixel 9 Pro XL.

## 1. Gate deterministico

Da `CampaniaLife/`:

```bash
PATH="/Users/armandosantucci/Library/Application Support/Codex/artifact-sessions/runtime-generations/generation-Nd2VFI/runtime/bin:$PATH" node client/scripts/regression.mjs
```

Deve stampare `RESULTS N/N passed`. L'ultima baseline verde è `26/26`.

## 2. Build

Da `CampaniaLife/client/`:

```bash
PATH="/Users/armandosantucci/Library/Application Support/Codex/artifact-sessions/runtime-generations/generation-Nd2VFI/runtime/bin:$PATH" node node_modules/vite/bin/vite.js build
```

## 3. Metriche canvas

Avviare il dev server su `127.0.0.1:3000`, aprire `?qa=visual-gate`, creare una nuova partita, poi eseguire nella pagina:

```js
(() => {
  const CL = window.CL, G = CL.game;
  G.stop();
  CL.ui.closeAll?.();
  CL.state.time.day = 1; CL.state.time.min = 720; CL.state.time.total = 0; CL.state.weather = 'sole';
  CL.state.properties = ['monolocale','appartamento','casa_amalfi','bottega'];
  const ids = ['napoli','costiera','vesuvio','pompei','capri','bacoli','salerno','avellino','caserta',
    'casa_nonna','casa_giocatore','appartamento','casa_amalfi','bottega','souvenir','bar','pizzeria',
    'metro','metro2','negozio','banca','clinica','ufficio','grotta'];
  const raw = (id) => {
    G.animT = 0;
    const m = CL.maps.get(id);
    G.enterMap(id, id === 'napoli' ? 30 * CL.TILE : undefined, id === 'napoli' ? 28 * CL.TILE : undefined, true);
    CL.camera.snap(G.player); G.render();
    const cv = G.canvas, ctx = cv.getContext('2d'), w = cv.width, h = cv.height;
    const d = ctx.getImageData(0,0,w,h).data;
    const colors = new Set(); let lum = 0, minL = 255, maxL = 0, edges = 0, n = 0;
    const L = i => 0.2126*d[i] + 0.7152*d[i+1] + 0.0722*d[i+2];
    for (let y=0; y<h; y++) for (let x=0; x<w; x++) {
      const i=(y*w+x)*4;
      colors.add(((d[i]>>3)<<10)|((d[i+1]>>3)<<5)|(d[i+2]>>3));
      const l=L(i); lum+=l; minL=Math.min(minL,l); maxL=Math.max(maxL,l); n++;
      if (x>0 && Math.abs(l-L(i-4))>18) edges++;
      if (y>0 && Math.abs(l-L(i-4*w))>18) edges++;
    }
    return { id, w:m.w, h:m.h, palette:colors.size,
      edgeDensity:+(edges/(n*2)).toFixed(3), contrast:Math.round(maxL-minL),
      luminance:+(lum/n).toFixed(1),
      npcs:G.entities.filter(e=>e instanceof CL.NPC).length,
      vehicles:G.entities.filter(e=>e instanceof CL.Vehicle).length };
  };
  return ids.map(raw);
})()
```

## 4. Criteri di accettazione

Confrontare l'output con `qa/living-world-v1/metrics.json`:

- regressione verde e build completata;
- zero errori console;
- nessuna mappa con `edgeDensity` inferiore alla baseline di oltre `0.01`;
- interni con `w >= 30` e `h >= 18` (grotta `h >= 20`);
- spawn degli interni invariati: vedi test `expanded interiors preserve saved anchors`;
- traffico solo su tile `r`: vedi test `ambient traffic stays on roads`;
- ogni mappa interna Abitata ha almeno un NPC, come nella baseline;
- screenshot delle mappe chiave salvati in `qa/<increment>/`.

I confronti automaticamente leggibili dal modello sono le metriche numeriche: gli screenshot sono conservati per la revisione manuale dell'utente.
