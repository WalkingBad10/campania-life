# CAMPANIA LIFE — Roadmap

## Release 1.0 — “Il primo giorno” ✅

- [x] Motore Canvas: loop a timestep variabile, camera, collisioni, depth sorting, particelle
- [x] Pixel art procedurale originale: tile, personaggi, creature, veicoli, ritratti, icone
- [x] 5 zone overworld + 12 interni
- [x] 12 PNG, dialoghi a scelta, affinità e regali
- [x] 5 lavori, 4 immobili, banca, negozi, vendita, rendite
- [x] 9 creature collezionabili con cattura e rarità
- [x] 5 missioni a stadi + 8 obiettivi
- [x] Meteo, ciclo giorno/notte, bisogni, sonno
- [x] UI React: HUD, minimappa, telefono, dialoghi, impostazioni
- [x] Backend FastAPI + PostgreSQL: JWT, salvataggi JSONB, classifica
- [x] Export/import salvataggi, fallback offline

## 1.1 — “Vita di quartiere” (prossima)

- [ ] Calendario eventi ricorrenti (fiere, sagre, temporali)
- [ ] Microminigiochi: barista, pesca a tempo, guida turistica
- [ ] Arredamento acquistabile e posizionabile negli interni
- [ ] Menù relazioni con appuntamenti e regali prefers per PNG
- [ ] Mezzi pubblici con linee bus e fermate orarie

## 1.2 — “Il questore” 

- [ ] Sistema di combattimento leggero tra creature (turni semplici)
- [ ] Tornei e leghe con classifica server
- [ ] Quest procedurali generate dal backend
- [ ] Statistiche e obiettivi sincronizzati via API

## 2.0 — “Campania estesa”

- [ ] Altre province: Salerno, Caserta, Benevento, Avellino
- [ ] Editor mappe in-app e contenuti Creator
- [ ] Multiplayer cooperativo leggero (visita la città di un amico)
- [ ] Audio DSP più ricco e colonna sonora adattiva per zona

## Note di qualità continue

- Test automatici frontend e backend (pytest, Vitest)
- Telemetria anonima opzionale per bilanciamento economico
- Localizzazione EN/IT
- Packaging desktop via Electron/Tauri (valutazione futura)
