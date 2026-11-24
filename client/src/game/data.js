/* CAMPANIA LIFE — data.js
 * Contenuto originale del gioco: oggetti, lavori, immobili, creature, PNG, quest, negozi, dialoghi.
 * Tutti i nomi e le creature sono inventati per questo progetto.
 */
(function (w) {
  'use strict';
  const CL = w.CL, D = CL.data = {};

  /* ------------------------------------------------------------- oggetti */
  D.items = {
    biglietto_metro: { name: 'Biglietto metro', type: 'key', price: 2, icon: 'ticket', desc: 'Valido per un viaggio in metro.' },
    pane:        { name: 'Pane fresco',        desc: 'Crosta croccante, mollica morbida.',   type: 'food', price: 3,   effect: { hunger: 22 }, icon: 'bread' },
    caffe:       { name: 'Caffè napoletano',   desc: 'Nero, dolce, serve a svegliarsi.',     type: 'food', price: 2,   effect: { hunger: 8, energy: 16 }, icon: 'cup' },
    arancino:    { name: 'Arancino',           desc: 'Riso, ragù e mozzarella. Delizioso.',  type: 'food', price: 6,   effect: { hunger: 38, mood: 10 }, icon: 'arancino' },
    pizza:       { name: 'Pizza a portafoglio',desc: 'Piegata, calda, perfetta in piedi.',   type: 'food', price: 9,   effect: { hunger: 52, mood: 14 }, icon: 'pizza' },
    pesce:       { name: 'Pesce azzurro',      desc: 'Pescato con le tue mani.',             type: 'food', price: 12,  effect: { hunger: 44, energy: 8 }, icon: 'fish' },
    acqua:       { name: 'Acqua di sorrento',  desc: 'Disseta e rinfresca.',                 type: 'food', price: 1,   effect: { thirst: 40 }, icon: 'bottle' },
    fiore:       { name: 'Mazzolino di fiori', desc: 'Profumato. Piace a tutti.',            type: 'gift', price: 8,   gift: 6, icon: 'flower' },
    cioccolato:  { name: 'Cioccolato di Capri',desc: 'Dolce e avvolgente.',                  type: 'gift', price: 11,  gift: 9, icon: 'box' },
    vino:        { name: 'Falanghina',         desc: 'Un bicchiere di sole campano.',        type: 'gift', price: 16,  gift: 12, icon: 'bottle' },
    rete:        { name: 'Borsa della spesa',  desc: 'Utile per commissioni e lavoro.',       type: 'tool', price: 14,  stack: true, icon: 'net' },
    canna:       { name: 'Canna da pesca',     desc: 'Richiede il molo. Pressa E per pescare.', type: 'tool', price: 65, unique: true, icon: 'rod' },
    bicicletta:  { name: 'Bicicletta',         desc: 'Più veloce a piedi, niente carburante.', type: 'vehicle', price: 180, unique: true, icon: 'bike' },
    moto:        { name: 'Vespa 125',          desc: 'Simbolo di libertà. Consumo ridotto.', type: 'vehicle', price: 1450, unique: true, icon: 'scooter' },
    auto:        { name: 'Utilitaria',         desc: 'Quattro posti e un bagagliaio.',       type: 'vehicle', price: 8200, unique: true, icon: 'car' },
    mappa:       { name: 'Mappa della Campania',desc: 'Mostra tutte le zone e i luoghi.',     type: 'key', price: 20, unique: true, icon: 'map' },
    ombrello:    { name: 'Ombrello',           desc: 'Tiene asciutti sotto la pioggia.',     type: 'tool', price: 12, unique: true, icon: 'umbrella' },
    cappello:    { name: 'Cappello di paglia', desc: 'Protegge dal sole di mezzogiorno.',    type: 'outfit', price: 25, unique: true, icon: 'hat' },
    divisa:      { name: 'Divisa da lavoro',   desc: 'Ti fa sembrare un professionista.',    type: 'outfit', price: 40, unique: true, icon: 'shirt' },
    chiave_casa: { name: 'Chiavi di casa',     desc: 'Aprono la tua porta.',                 type: 'key', price: 0, unique: true, icon: 'key' },
    chiave_bottega:{ name:'Chiavi della bottega', desc:'Aprono la tua attività.',            type:'key', price:0, unique:true, icon:'key' },
    trofeo:      { name: 'Trofeo del Vulcano', desc: 'Un ricordo del tuo viaggio.',          type: 'quest', price: 0, unique: true, icon: 'trophy' }
  };
  D.foodOrder = ['pane', 'arancino', 'pizza', 'caffe', 'acqua', 'pesce'];

  /* -------------------------------------------------------------- lavori */
  D.jobs = {
    barista: {
      name: 'Barista', place: 'bar', hours: [9, 17], pay: 11, energy: 18, rep: 0,
      req: null, desc: 'Prepara caffè e chiacchiera con i clienti del Caffè Vittoria.',
      events: ['Un cliente ti lascia una mancia di 8 €.', 'Ti rovesci il caffè addosso: -4 energia.', 'Il proprietario ti offre un arancino.']
    },
    consegne: {
      name: 'Consegne', place: 'ufficio', hours: [10, 18], pay: 14, energy: 22, rep: 2,
      req: { item: 'bicicletta' }, desc: 'Porta pacchi per le strade di Napoli. Serve una bicicletta.',
      events: ['Scopri una scorciatoia: +6 €.', 'Una buca ti costa 6 energia.', 'Consegna doppia: +10 €.']
    },
    guida: {
      name: 'Guida turistica', place: 'pompei', hours: [8, 16], pay: 18, energy: 16, rep: 20,
      req: { rep: 20 }, desc: 'Racconta la storia degli scavi. Richiede 20 di reputazione.',
      events: ['Un turista ti lascia 12 € di mancia.', 'Un gruppo numeroso: +9 €.', 'Fa molto caldo: -5 energia.']
    },
    pescatore: {
      name: 'Pescatore', place: 'molo', hours: [6, 14], pay: 13, energy: 20, rep: 0,
      req: { item: 'canna' }, desc: 'Esci sul molo all’alba. Serve una canna da pesca.',
      events: ['Pesci 2 pesci extra.', 'Il sole ti brucia: -6 energia.', 'Un pesce grande: +15 €.']
    },
    operaio: {
      name: 'Operaio edile', place: 'cantiere', hours: [7, 15], pay: 16, energy: 28, rep: 0,
      req: null, desc: 'Lavoro duro ma ben pagato al cantiere del centro.',
      events: ['Trovi 20 € in un muro.', 'Turno pesante: -8 energia.', 'Il capo ti elogia: +3 reputazione.']
    },
    vignaiolo: {
      name: 'Vignaiolo irpino', place: 'vigneti_irpini', hours: [7, 15], pay: 17, energy: 24, rep: 5,
      req: null, desc: 'Vendemmia tra le colline di Avellino.',
      events: ['Un grappolo speciale: +8 €.', 'Sole intenso: -6 energia.', 'Il padrone ti offre un vino: +3 reputazione.']
    },
    guardia_reggia: {
      name: 'Guardia della Reggia', place: 'reggia', hours: [9, 17], pay: 19, energy: 18, rep: 10,
      req: null, desc: 'Passeggia tra i viali della Reggia di Caserta.',
      events: ['Turista riconoscente: +10 €.', 'Lungo turno in piedi: -5 energia.', 'Supervisore compiaciuto: +2 reputazione.']
    }
  };

  /* ------------------------------------------------------------ immobili */
  D.properties = {
    monolocale: { name: 'Monolocale a Napoli', price: 4500, income: 55, interior: 'casa_giocatore', zone: 'napoli', desc: 'Piccolo, luminoso, tutto tuo. Letto, cucina e una finestra sul cortile.' },
    appartamento: { name: 'Appartamento a Chiaia', price: 12000, income: 135, interior: 'appartamento', zone: 'napoli', desc: 'Due stanze, terrazzo e vista sui tetti. Il sogno di ogni napoletano.' },
    casa_amalfi: { name: 'Casetta ad Amalfi', price: 28000, income: 260, interior: 'casa_amalfi', zone: 'costiera', desc: 'Bianca, con gerani e vista mare. Si sente il profumo di limoni.' },
    bottega: { name: 'Bottega di famiglia', price: 19000, income: 310, interior: 'bottega', zone: 'napoli', desc: 'Un’attività commerciale tutta tua. Ogni giorno porta ricavi.' },
    villa_bacoli: { name: 'Villa a Bacoli', price: 34000, income: 290, interior: 'casa_amalfi', zone: 'bacoli', desc: 'Terrazza sul golfo di Baia, profumo di mirto.' },
    villetta_salerno: { name: 'Villetta sul mare', price: 26000, income: 220, interior: 'casa_amalfi', zone: 'salerno', desc: 'Vista lungomare, a due passi dal centro storico.' }
  };

  /* ------------------------------------------------------------- arredamento */
  // I pezzi sono visuali e danno un piccolo comfort quando si dorme nella casa che li contiene.
  // Nessun nuovo campo nel salvataggio: gli acquisti vivono in state.flags.furniture.
  D.furniture = {
    tappeto: {
      name: 'Tappeto persiano', price: 180, decor: 'home_rug', comfort: { mood: 3 },
      w: 56, h: 24, oy: -10, desc: 'Morbido sotto i piedi, scalda la stanza.',
      spots: { casa_giocatore: [[6,7]], appartamento: [[9,7]], casa_amalfi: [[8,6]], bottega: [[5,9]] }
    },
    libreria: {
      name: 'Libreria', price: 320, decor: 'home_books', comfort: { mood: 4 },
      w: 42, h: 52, oy: -36, desc: 'Storie, ricordi e un po’ di polvere napoletana.',
      spots: { casa_giocatore: [[12,7]], appartamento: [[16,6]], casa_amalfi: [[14,6]], bottega: [[14,4]] }
    },
    lampada: {
      name: 'Lampada da tavolo', price: 140, decor: 'home_lamp', comfort: { mood: 2 },
      w: 22, h: 52, oy: -36, desc: 'Luce calda per le sere lente.',
      spots: { casa_giocatore: [[2,8]], appartamento: [[3,11]], casa_amalfi: [[3,10]], bottega: [[3,9]] }
    },
    pianta: {
      name: 'Pianta in vaso', price: 90, decor: 'home_plant', comfort: { mood: 2 },
      w: 24, h: 30, oy: -18, desc: 'Verde che profuma di casa.',
      spots: { casa_giocatore: [[13,9]], appartamento: [[17,10]], casa_amalfi: [[15,10]], bottega: [[15,9]] }
    },
    quadro: {
      name: 'Quadro di famiglia', price: 220, decor: 'home_painting', comfort: { mood: 3 },
      w: 34, h: 26, oy: -22, desc: 'Un volto noto che ti aspetta sulla parete.',
      spots: { casa_giocatore: [[6,2]], appartamento: [[10,2]], casa_amalfi: [[9,2]], bottega: [[9,2]] }
    }
  };

  /* ------------------------------------------------------------- vita familiare */
  D.family = {
    meal: {
      npc: 'nonna', affinity: 3, label: 'Pranza con nonna',
      needs: { hunger: 32, mood: 12, energy: 8 },
      text: 'Nonna ti serve un piatto caldo. Per un momento, il vicolo sa di casa.'
    }
  };

  /* ----------------------------------------------------------- fauna locale (atmosfera, no cattura) */
  D.fauna = {
    gabbiano: { name: 'Gabbiano', zones: ['napoli', 'costiera'], color: '#f2efe2', accent: '#e9b84a' },
    piccione: { name: 'Piccione', zones: ['napoli', 'pompei'], color: '#9aa3ad', accent: '#7e8791' },
    gatto:    { name: 'Gatto', zones: ['napoli', 'pompei'], color: '#d7a86c', accent: '#8b6244' },
    farfalla: { name: 'Farfalla', zones: ['costiera', 'vesuvio'], color: '#8fd8df', accent: '#f2a7c0' },
    cicada:   { name: 'Cicala', zones: ['avellino', 'caserta'], color: '#b7c98f', accent: '#7f9a55' }
  };
  D.creatures = {}; D.creatureOrder = [];

  /* ------------------------------------------------------------ zone/mappe */
  D.zones = {
    napoli: { name: 'Napoli Centro', track: 'town', weather: true, tint: '#d8e2d0', desc: 'Tra vicoli, piazze e caffè.' },
    costiera: { name: 'Costiera Amalfitana', track: 'coast', weather: true, tint: '#cfe9e6', desc: 'Mare, limoni e mulattiere.' },
    vesuvio: { name: 'Falde del Vesuvio', track: 'mountain', weather: true, tint: '#cdd8bd', desc: 'Sentieri, grotte e vigneti.' },
    pompei: { name: 'Scavi di Pompei', track: 'town', weather: true, tint: '#e2d8bf', desc: 'Le rovine raccontano il passato.' },
    capri: { name: 'Capri', track: 'coast', weather: true, tint: '#d7eee7', desc: 'Faraglioni, limoni e mare cristallino.' },
    bacoli: { name: 'Bacoli e Baia', track: 'coast', weather: true, tint: '#d4e8e0', desc: 'Terme romane e porticcioli del golfo.' },
    salerno: { name: 'Salerno - Lungomare', track: 'town', weather: true, tint: '#dbe4e0', desc: 'Lungomare, castello e vicoli medievali.' },
    avellino: { name: 'Avellino - Colline Irpine', track: 'mountain', weather: true, tint: '#d6dec2', desc: 'Vigneti e colline dell’Irpinia.' },
    caserta: { name: 'Caserta - Reggia', track: 'town', weather: true, tint: '#dce3d2', desc: 'Viali reali e la maestosa Reggia.' }
  };

  /* --------------------------------------------------------------- PNG */
  D.npcs = {
    nonna:    { name: 'Nonna Assunta', look: { hair: '#d8d4cc', skin: '#e8b48a', shirt: '#7a4b6b', pants: '#4b4152' }, home: 'napoli', x: 20, y: 20, role: 'family' },
    barista:  { name: 'Ciro il barista', look: { hair: '#2d2622', skin: '#d79c74', shirt: '#f0ede2', pants: '#3a4650' }, home: 'bar', x: 6, y: 5, role: 'shop' },
    banchiere:{ name: 'Dott.ssa Rina', look: { hair: '#4a2c20', skin: '#e6b892', shirt: '#37556b', pants: '#283743' }, home: 'napoli', x: 32, y: 37, role: 'bank' },
    medico:   { name: 'Dott. Esposito', look: { hair: '#39332e', skin: '#dba67e', shirt: '#eef2ee', pants: '#58707c' }, home: 'napoli', x: 18, y: 37, role: 'clinic' },
    negoziante:{name: 'Sora Maria', look: { hair: '#6b3f2a', skin: '#d29a72', shirt: '#c5584a', pants: '#4e3b36' }, home: 'napoli', x: 39, y: 33, role: 'shop' },
    capo:     { name: 'Il capo cantiere', look: { hair: '#2b2624', skin: '#c98d64', shirt: '#e6a23c', pants: '#3d4146' }, home: 'napoli', x: 62, y: 42, role: 'job' },
    pescatore:{ name: 'Vecchio Pescatore', look: { hair: '#c9c4b6', skin: '#c58b63', shirt: '#4d8ea3', pants: '#394f59' }, home: 'costiera', x: 21, y: 27, role: 'job' },
    turista:  { name: 'Turista tedesco', look: { hair: '#d6b45c', skin: '#eec3a0', shirt: '#d8664c', pants: '#5b6d7a' }, home: 'costiera', x: 37, y: 19, role: 'quest' },
    barcaiolo:{ name: 'Gennaro il barcaiolo', look: { hair: '#241f1e', skin: '#b9794f', shirt: '#f2e2bd', pants: '#356079' }, home: 'costiera', x: 63, y: 32, role: 'transport' },
    guardiano:{ name: 'Guardiano del vulcano', look: { hair: '#8a8378', skin: '#b57755', shirt: '#6b7a4a', pants: '#3e4238' }, home: 'vesuvio', x: 17, y: 37, role: 'quest' },
    archeologo:{name: 'Prof. Rovelli', look: { hair: '#aaa39a', skin: '#dfa97f', shirt: '#8a6a4b', pants: '#3a3a35' }, home: 'pompei', x: 29, y: 23, role: 'job' },
    fidanzata:{name: 'Giulia', look: { hair: '#3a211a', skin: '#e8b389', shirt: '#d96f8b', pants: '#4c4358' }, home: 'napoli', x: 28, y: 31, role: 'social' },
    passante1:{name: 'Studente', look: { hair: '#2a2018', skin: '#dba67e', shirt: '#4a87b8', pants: '#3f4550' }, home: 'napoli', x: 25, y: 28, role: 'ambient' },
    passante2:{name: 'Signora Lucia', look: { hair: '#8b5a3c', skin: '#e0b088', shirt: '#7a9a5a', pants: '#5a4a58' }, home: 'napoli', x: 42, y: 29, role: 'ambient' },
    turista_piazza:{name:'Claire', look:{hair:'#d7b06a',skin:'#f0c8a0',shirt:'#5aa7d6',pants:'#6a6f7a'}, home:'napoli', x:33, y:27, role:'ambient'},
    studente: {name:'Luca', look:{hair:'#3a2f2a',skin:'#dcae84',shirt:'#3f7a5a',pants:'#404854'}, home:'napoli', x:47, y:29, role:'ambient'},
    fioraia:  {name:'Rosa la fioraia', look:{hair:'#7b3b3b',skin:'#e0b08a',shirt:'#d96b8b',pants:'#5a4b52'}, home:'napoli', x:27, y:35, role:'ambient'},
    vigile:   {name:'Agente Esposito', look:{hair:'#2b2b2b',skin:'#cf996e',shirt:'#2f4f7a',pants:'#2f3a4a'}, home:'napoli', x:52, y:32, role:'ambient'},
    cliente_bar1:{name:'Gennaro', look:{hair:'#5b4a3d',skin:'#d5a276',shirt:'#7a5b44',pants:'#4a4f58'}, home:'bar', x:4, y:9, role:'ambient'},
    cliente_bar2:{name:'Mirella', look:{hair:'#6b3a2a',skin:'#e3b289',shirt:'#c05858',pants:'#5a4a60'}, home:'bar', x:13, y:8, role:'ambient'},
    pizzaiolo:{name:'Gino il pizzaiolo', look:{hair:'#2b2320',skin:'#d8a178',shirt:'#efe8d8',pants:'#4a3d36'}, home:'pizzeria', x:4, y:5, role:'shop'},
    cameriere:{name:'Luca il cameriere', look:{hair:'#3a2f2a',skin:'#dcae84',shirt:'#1f1f1f',pants:'#4b5563'}, home:'pizzeria', x:12, y:9, role:'ambient'},
    bacoli_guide:{name:'Rosa di Baia', look:{hair:'#6b3a2a',skin:'#d9a77d',shirt:'#4f8f8a',pants:'#4a5563'}, home:'bacoli', x:10, y:14, role:'quest'},
    salerno_barista:{name:'Enzo il salernitano', look:{hair:'#2d2622',skin:'#dda97e',shirt:'#e8e2d2',pants:'#3b4650'}, home:'salerno', x:34, y:22, role:'shop'},
    avellino_contadino:{name:'Pasquale il vignaiolo', look:{hair:'#4a3325',skin:'#c98d64',shirt:'#7a9a5a',pants:'#4b4a3f'}, home:'avellino', x:28, y:22, role:'job'},
    caserta_guardia:{name:'Guardia della Reggia', look:{hair:'#2b2b2b',skin:'#cf996e',shirt:'#2f4f7a',pants:'#2f3a4a'}, home:'caserta', x:30, y:24, role:'ambient'},
    cliente_bar3:{name:'Pasquale', look:{hair:'#3a2b22',skin:'#d7a078',shirt:'#8a6b4a',pants:'#414a52'}, home:'bar', x:16, y:12, role:'ambient'},
    cliente_bar4:{name:'Assunta', look:{hair:'#8d8579',skin:'#e0b18b',shirt:'#a45f74',pants:'#514658'}, home:'bar', x:7, y:11, role:'ambient'},
    cliente_pizza1:{name:'Marco', look:{hair:'#342a24',skin:'#dba77f',shirt:'#5b8fa8',pants:'#404b55'}, home:'pizzeria', x:9, y:12, role:'ambient'},
    cliente_pizza2:{name:'Valeria', look:{hair:'#7a3d2a',skin:'#e6b48c',shirt:'#c96a72',pants:'#4d4556'}, home:'pizzeria', x:19, y:11, role:'ambient'},
    metro_user1:{name:'Passeggero', look:{hair:'#282522',skin:'#d2a078',shirt:'#4b647b',pants:'#353f49'}, home:'metro', x:8, y:10, role:'ambient'},
    metro_user2:{name:'Turista in metro', look:{hair:'#c9a75f',skin:'#efc49f',shirt:'#d26d55',pants:'#5a6672'}, home:'metro', x:19, y:12, role:'ambient'},
    negozio_venditore:{name:'Aiuto di Sora Maria', look:{hair:'#6b3f2a',skin:'#dba577',shirt:'#c0705e',pants:'#4e3b36'}, home:'negozio', x:8, y:9, role:'shop'},
    bottegaio:{name:'Vincenzo il bottegaio', look:{hair:'#4a3123',skin:'#d6a075',shirt:'#6f8a5a',pants:'#4a463e'}, home:'bottega', x:10, y:8, role:'shop'},
    cliente_bottega:{name:'Rita', look:{hair:'#6b432c',skin:'#dfae87',shirt:'#b76570',pants:'#4e4755'}, home:'bottega', x:5, y:10, role:'ambient'},
    venditore_souvenir:{name:'Ricordi di Pompei', look:{hair:'#2f2925',skin:'#d5a079',shirt:'#c98b4b',pants:'#4a4340'}, home:'souvenir', x:9, y:8, role:'shop'},
    impiegato_banca:{name:'Addetto allo sportello', look:{hair:'#3a2b25',skin:'#e0ad85',shirt:'#3f6076',pants:'#2f3b46'}, home:'banca', x:12, y:9, role:'shop'},
    medico_clinica:{name:'Dott.ssa Ferrara', look:{hair:'#5c4034',skin:'#e5b28c',shirt:'#eef2ee',pants:'#58707c'}, home:'clinica', x:12, y:8, role:'shop'},
    paziente_clinica:{name:'Paziente', look:{hair:'#8a8378',skin:'#d7a37d',shirt:'#8f9aa0',pants:'#4b4e52'}, home:'clinica', x:8, y:9, role:'ambient'},
    impiegato_ufficio:{name:'Impiegato comunale', look:{hair:'#332b27',skin:'#d9a57e',shirt:'#527a68',pants:'#3c454d'}, home:'ufficio', x:13, y:6, role:'job'},
    cliente_ufficio:{name:'Cittadino', look:{hair:'#6a4a34',skin:'#cf9a70',shirt:'#a06b58',pants:'#444b52'}, home:'ufficio', x:8, y:10, role:'ambient'},
    vicino_appartamento:{name:'Vicino di Chiaia', look:{hair:'#332a24',skin:'#d7a47c',shirt:'#5f7f9a',pants:'#3f4750'}, home:'appartamento', x:18, y:9, role:'ambient'},
    familiare_amalfi:{name:'Cugino di Amalfi', look:{hair:'#4a3225',skin:'#dfab81',shirt:'#d47d5a',pants:'#4c5259'}, home:'casa_amalfi', x:10, y:8, role:'family'},
    coinquilino:{name:'Compagno di casa', look:{hair:'#2e2824',skin:'#d5a17a',shirt:'#7a8f6a',pants:'#454c53'}, home:'casa_giocatore', x:24, y:8, role:'ambient'},
    capri_guide:{name:'Guida di Capri', look:{hair:'#3a2a22',skin:'#dfae86',shirt:'#5aa7c4',pants:'#46525e'}, home:'capri', x:15, y:12, role:'quest'},
    metro2_user:{name:'Passeggero verso Dante', look:{hair:'#5c5148',skin:'#d7a47c',shirt:'#7b6b8a',pants:'#3f4750'}, home:'metro2', x:8, y:10, role:'ambient'},
    chiesa_fedele:{name:'Fedele in preghiera', look:{hair:'#8a8176',skin:'#e0b08a',shirt:'#7a5a72',pants:'#4b4552'}, home:'casa_nonna', x:7, y:17, role:'ambient'},
    chiesa_sacerdote:{name:'Padre Raffaele', look:{hair:'#3a342e',skin:'#d9a67e',shirt:'#efe9dc',pants:'#3b4248'}, home:'casa_nonna', x:20, y:17, role:'ambient'}
  };

  /* --------------------------------------------------------------- quest */
  D.quests = {
    primo_giorno: {
      name: 'Il primo giorno', giver: 'nonna', reward: { money: 100, items: { rete: 3 } },
      desc: 'Nonna ti aspetta. Fai conoscenza con il quartiere e trova il tuo primo lavoro.',
      stages: [
        { text: 'Vai a trovare Nonna Assunta a casa', type: 'talk', target: 'nonna', count: 1 },
        { text: 'Prendi un caffè al Caffè Vittoria', type: 'visit', target: 'bar', count: 1 },
        { text: 'Guadagna 50 €', type: 'money', target: 50, count: 1 },
        { text: 'Racconta a nonna com’è andata', type: 'talk', target: 'nonna', count: 2 }
      ]
    },
    richiamo_mare: {
      name: 'Il richiamo del mare', giver: 'pescatore', reward: { money: 120, items: { canna: 1 } },
      desc: 'La costiera nasconde creature e storie. Il vecchio pescatore ti insegnerà.',
      stages: [
        { text: 'Raggiungi la Costiera Amalfitana', type: 'visit', target: 'costiera', count: 1 },
        { text: 'Pesca al molo', type: 'fish', target: 1, count: 1 },
        { text: 'Visita la Costiera al tramonto', type: 'visit', target: 'costiera', count: 1 }
      ]
    },
    casa_tua: {
      name: 'Una casa tutta tua', giver: 'banchiere', reward: { money: 200, rep: 5 },
      desc: 'La banca finanzia i tuoi sogni. Metti da parte abbastanza per un tetto.',
      stages: [
        { text: 'Abbiamo 500 € in tasca', type: 'wealth', target: 500, count: 1 },
        { text: 'Acquista un immobile', type: 'buyproperty', target: 1, count: 1 },
        { text: 'Dormi nella tua nuova casa', type: 'sleephome', target: 1, count: 1 }
      ]
    },
    vulcano_dorme: {
      name: 'Il vulcano dorme', giver: 'guardiano', reward: { money: 300, items: { trofeo: 1 }, rep: 10 },
      desc: 'Il guardiano ha visto qualcosa nella grotta. Chi si avvicina al fuoco?',
      stages: [
        { text: 'Esplora la grotta del Vesuvio', type: 'visit', target: 'grotta', count: 1 },
        { text: 'Raccogli 150 € per l’equipaggiamento', type: 'money', target: 150, count: 1 },
        { text: 'Parla con il Guardiano', type: 'talk', target: 'guardiano', count: 2 }
      ]
    },
    sapori: {
      name: 'Il tour dei sapori', giver: 'barista', reward: { money: 180, rep: 8 },
      desc: 'Ciro ha bisogno di qualcuno che porti i sapori del bar in giro per la città.',
      stages: [
        { text: 'Lavora come barista', type: 'work', target: 'barista', count: 1 },
        { text: 'Consegna 3 piatti', type: 'work', target: 'consegne', count: 3 },
        { text: 'Riporta il conto a Ciro', type: 'talk', target: 'barista', count: 2 }
      ]
    }
  };
  D.questOrder = ['primo_giorno', 'richiamo_mare', 'casa_tua', 'vulcano_dorme', 'sapori'];

  /* --------------------------------------------------------------- negozi */
  D.shops = {
    negozio: { name: 'Bottega di Sora Maria', stock: ['pane', 'acqua', 'arancino', 'pizza', 'rete', 'fiore', 'ombrello', 'cappello', 'mappa'] },
    bar: { name: 'Caffè Vittoria', stock: ['caffe', 'pane', 'arancino', 'pizza', 'acqua', 'cioccolato'] },
    pizzeria: { name: 'Pizzeria Da Michele', stock: ['pizza', 'acqua', 'caffe'] },
    metro: { name: 'Biglietteria Metro', stock: ['biglietto_metro'] },
    banca: { name: 'Banca di Napoli', stock: ['mappa'] },
    costiera: { name: 'Chiosco del mare', stock: ['acqua', 'pizza', 'pesce', 'rete', 'canna', 'fiore', 'vino', 'ombrello'] },
    pompei: { name: 'Souvenir degli scavi', stock: ['acqua', 'pane', 'vino', 'cioccolato', 'fiore', 'mappa'] },
    bottega: { name: 'La tua bottega', stock: ['pane', 'caffe', 'arancino', 'pizza', 'acqua', 'fiore', 'cioccolato', 'vino'] }
  };

  /* -------------------------------------------------------------- dialoghi */
  const line = (t, choices) => ({ text: t, choices: choices || null });
  const choice = (label, action, data) => ({ label, action, data: data || {} });
  D.dialogue = {
    nonna(g) {
      const q = g.state.quests.primo_giorno;
      const ready = CL.systems && CL.systems.family && CL.systems.family.mealReady();
      const mealChoice = ready && ready.ok ? [choice(D.family.meal.label, 'family_meal')] : [];
      if (!q || q.stage === 4) return line('Mi fa piacere vederti sorridere, ragazzo. La Campania è grande: girala, conoscila, innamoratene. E torna a trovare nonna.', [
        ...mealChoice,
        choice('Parlami della famiglia', 'talk_family'),
        choice('Mi dai un consiglio?', 'talk_tip'),
        choice('Arrivederci, nonna', 'close')
      ]);
      if (q.stage === 0) return line('Finalmente sei qui! Vai al Caffè Vittoria, prendi un caffè e poi trova un modo per guadagnare qualcosa. Il vicolo ti insegnerà.', [choice('Ci vado subito', 'close')]);
      if (q.stage === 3) return line('Hai già guadagnato qualcosa? Bravo! Ricorda: il denaro va e viene, ma le persone restano.', [choice('Grazie nonna', 'close')]);
      return line('Com’è andata al bar? Non fare il timido, chiedi pure informazioni a Ciro.', [choice('Lo farò', 'close')]);
    },
    barista(g) {
      return line('Benvenuto al Caffè Vittoria! Il caffè qui si beve in piedi, in due sorsi. Vuoi qualcosa?', [
        choice('Compra qualcosa', 'shop', { shop: 'bar' }),
        choice('Voglio lavorare qui', 'job', { job: 'barista' }),
        choice('Parlami del quartiere', 'talk_neighborhood'),
        choice('Esco', 'close')
      ]);
    },
    pizzaiolo(g) {
      return line('Benvenuto da Michele! La margherita esce dal forno a legna in un minuto. Che ti preparo?', [
        choice('Ordina pizza (8 €)', 'order_pizza'),
        choice('Menu pizzeria', 'shop', { shop: 'pizzeria' }),
        choice('Solo un saluto', 'close')
      ]);
    },
    banchiere(g) {
      return line('Buongiorno. Posso aiutarti con un conto, un prestito o... con i tuoi risparmi. Hai già pensato a una casa?', [
        choice('Apri il conto / deposita', 'bank', { mode: 'menu' }),
        choice('Mostrami gli immobili', 'property'),
        choice('Vattene', 'close')
      ]);
    },
    medico(g) {
      return line('Sei stanco? Il riposo è il miglior rimedio. Se hai bisogno, qui ti rimettiamo in sesto.', [
        choice('Riposati (25 €)', 'heal'),
        choice('Come sto?', 'status'),
        choice('Grazie, arrivederci', 'close')
      ]);
    },
    negoziante(g) {
      return line('Amore, entra, guarda, tocca. Se ti serve qualcosa per la tua avventura, ce l’ho.', [
        choice('Compra', 'shop', { shop: 'negozio' }),
        choice('Vendi oggetti', 'sell'),
        choice('Esco', 'close')
      ]);
    },
    capo(g) {
      return line('Ehi tu! Cerco braccia per il cantiere. Si lavora duro, si paga bene. Che dici?', [
        choice('Voglio lavorare', 'job', { job: 'operaio' }),
        choice('Ci penso', 'close')
      ]);
    },
    pescatore(g) {
      return line('Il mare non regala niente a chi non si sveglia presto. Hai una canna? Io ti insegnerei, ma...', [
        choice('Voglio imparare', 'job', { job: 'pescatore' }),
        choice('Compra una canna al chiosco', 'close'),
        choice('Mi racconti del mare?', 'talk_sea'),
        choice('Arrivederci', 'close')
      ]);
    },
    turista(g) {
      return line('Entschuldigung! I am looking for the most beautiful view. They tell me the mountain is magical...', [
        choice('Vai alla Costiera', 'talk_coast'),
        choice('Parlami del Vesuvio', 'talk_vesuvio'),
        choice('Ciao!', 'close')
      ]);
    },
    barcaiolo(g) {
      return line('Il battello fa la spola tra il molo e l’isola. Se hai fretta, ti ci porto io. 12 € a persona.', [
        choice('Vai a Capri (12 €)', 'boat'),
        choice('No, grazie', 'close')
      ]);
    },
    guardiano(g) {
      const q = g.state.quests.vulcano_dorme;
      if (q && q.stage === 2) return line('Hai visto il bagliore nella grotta, vero? Portami una prova e ti dirò tutto.', [choice('Ci provo', 'close')]);
      return line('Questo monte non dorme mai davvero. Se scendi nella grotta, porta una rete... e coraggio.', [
        choice('Inizio l’esplorazione', 'quest_start', { id: 'vulcano_dorme' }),
        choice('Mi spieghi la grotta', 'talk_cave'),
        choice('Arrivederci', 'close')
      ]);
    },
    archeologo(g) {
      return line('Le rovine parlano a chi sa ascoltare. Vuoi accompagnare i visitatori?', [
        choice('Lavora come guida', 'job', { job: 'guida' }),
        choice('Compra un ricordo', 'shop', { shop: 'pompei' }),
        choice('Esco', 'close')
      ]);
    },
    fidanzata(g) {
      const rel = g.state.relations.giulia || 0;
      if (rel >= 30) return line('Sai? Mi piace passare il tempo con te. Se vuoi, ci vediamo al tramonto sul lungomare.', [
        choice('Ti aspetto al molo', 'date'),
        choice('Porto un regalo', 'gift'),
        choice('A dopo', 'close')
      ]);
      return line('Ciao! Ho visto che giri per la città. Se ti serve una mano, chiedi pure.', [
        choice('Conosciamoci meglio', 'talk_social'),
        choice('Ti regalo qualcosa', 'gift'),
        choice('Arrivederci', 'close')
      ]);
    }
  };

  /* --------------------------------------------------------------- varie */
  D.weather = [
    { id: 'sole', name: 'Sole', icon: '☀', dark: 0, speed: 0 },
    { id: 'nuvole', name: 'Nuvoloso', icon: '☁', dark: .06, speed: 0 },
    { id: 'pioggia', name: 'Pioggia', icon: '☂', dark: .16, speed: 1 },
    { id: 'temporale', name: 'Temporale', icon: '⚡', dark: .26, speed: 2 }
  ];
  D.tips = [
    'Nonna Assunta ha sempre un consiglio. E un caffè.',
    'La reputazione apre porte: lavora bene e la gente ti noterà.',
    'Di notte alcuni negozi chiudono, ma la città resta viva.',
    'Se hai fame o sonno, le tue prestazioni calano. Mangiare e dormire non sono optional!',
    'La bicicletta non consume carburante: è il mezzo migliore per iniziare.',
    'Ogni immobile genera un piccolo ricavo quotidiano.',
    'Tab apre il telefono: lì trovi lavoro, banca, immobili e mappe.'
  ];
})(window);
