# CAMPANIA LIFE — Game Design Document (1.0)

## 1. Visione

Open world 2D dall'alto in cui il giocatore sceglie liberamente il proprio ritmo: lavorare, esplorare, comprare casa, costruire relazioni, collezionare creature. Nessuna trama lineare obbligatoria; le missioni sono opportunità, non catene.

Pilastri: **libertà**, **ritmo quotidiano**, **luoghi riconoscibili**, **progressione tangibile**.

## 2. Loop di gioco

```
Esplora → incontra persone/luoghi → ottieni opportunità →
lavora/crea/compra/cattura → migliora risorse e relazioni →
nuove zone, immobili, creature, missioni
```

### Ciclo temporale
- 1 secondo reale = 3 minuti di gioco (regolabile 1–8).
- Giornata da 00:00 a 23:59; alba ~06:00, tramonto ~19:00.
- Meteo giornaliero: sole / nuvoloso / pioggia / temporale. Influisce su visibilità, catture e velocità.
- Dormire salta alla mattina successiva; lo svenimento porta in clinica con penale.

### Bisogni
Fame, sete, energia, umore, igiene. Decadono col tempo; influenzano velocità, probabilità di cattura e disponibilità al lavoro. Mangiare, bere, dormire e curarsi li ripristinano.

## 3. Sistemi

| Sistema | Regole sintetiche |
|---|---|
| Economia | Guadagni con many coefficiente nativo (+10%). Spese, banca, prelievi, log movimenti. |
| Lavori | 5 professioni, turni da 2h, fascia oraria, requisiti (attrezzo/reputazione/energia), eventi casuali. |
| Immobili | 4 proprietà con prezzo, rendita giornaliera e interno proprio. Il bottèga produce incassi. |
| Trasporti | Piedi, bici, Vespa, auto, battello a pagamento. I cartelli collegano le zone; la mappa permette viaggi rapidi. |
| Relazioni | +1 affinità al giorno per chiacchierata, regali +6…+12. Sbloccano battute, appuntamenti, consigli. |
| Creature | 9 specie, rarità 1–4, habitat per zona. Rete consumabile; probabilità maggiore di notte e con pioggia. |
| Missioni | 5 quest a stadi; il progresso è guidato da eventi di sistema (parla, visita, lavora, cattura, compra, dormi). |
| Obiettivi | 8 traguardi globali (collezione, ricchezza, viaggi, lavoro, reputazione). |
| Livello | XP da catture; ogni livello richiede `120 × livello` XP e restituisce energia. |

## 4. Zone

| Zona | Tema | Contenuti |
|---|---|---|
| Napoli Centro | Città, piazza, parco | Casa di nonna, bar, banca, clinica, negozio, ufficio lavori, cantiere, agenzia immobiliare |
| Costiera Amalfitana | Mare, limoneti, spiaggia | Molo da pesca, chiosco, bar, scogli, battello |
| Falde del Vesuvio | Sentieri, vigneti, vetta | Grotta, guardiano, creature di fuoco e lana |
| Scavi di Pompei | Rovine | Guida turistica, negozio souvenir |
| Capri | Isola | Gita in battello, creature rare |

Interni: casa di nonna, casa del giocatore, appartamento, casa ad Amalfi, bottega, bar, negozio, banca, clinica, ufficio, grotta, souvenir.

## 5. Contenuti originali

Creature: Gabbiotto, Lumacara, Cicalone, Polpettone, Scorfano, Pastorello, Ali di Capri, Vesuviano, Sirenetta. Ognuna ha forma, palette e descrizione propria, disegnata a runtime.

PNG: Nonna Assunta, Ciro, Dott.ssa Rina, Dott. Esposito, Sora Maria, capo cantiere, vecchio pescatore, turista, Gennaro, guardiano del vulcano, Prof. Rovelli, Giulia.

## 6. Progressione consigliata (non obbligatoria)

1. **Giorno 1** — parla con nonna, caffè al bar, primo lavoro da barista.
2. **Giorni 2–3** — compra una bici, apri la quest del mare, pesca e cattura creature costiere.
3. **Settimana 1** — accumula 500 €, compra il monolocale, dormi a casa.
4. **Settimana 2** — esplora il Vesuvio, cattura il Vesuviano, completa la quest del guardiano.
5. **Fine** — bottega, appartamento, casa ad Amalfi, collezione completa, livelli e obiettivi.

## 7. Persistenza

- Salvataggio locale automatico ogni azione significativa e cambio di mappa.
- Con account: `PUT /api/saves/current` con payload JSONB versionato; all'avvio si carica il più recente tra locale e remoto.
- Export/import tramite codice Base64 dalle impostazioni.

## 8. Accessibilità e qualità

- Controlli completamente da tastiera, pulsanti UI con etichette.
- Scalatura pixelated, effetti schermo disattivabili, velocità temporale regolabile.
- Nessuna dipendenza da asset esterni o servizi di terze parti.
