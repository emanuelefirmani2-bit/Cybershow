# CYBERSHOW INTERACTIVE 2026

**DOCUMENTO DI SPECIFICHE TECNICHE**
*Product Requirements Document (PRD) — v3.6*

> Piattaforma interattiva Real-Time per animatori turistici
> 500+ giocatori simultanei | WebSocket | Ledwall | Pannello Regia | MIDI/QLab

**Versione documento:** 3.6

---

## Indice

- **1. VISIONE GENERALE DEL PROGETTO**
  - 1.1 Concept
  - 1.2 Obiettivi Principali
  - 1.3 Struttura della Serata
- **2. ATTORI DEL SISTEMA**
  - 2.1 Smartphone (Giocatori)
  - 2.2 Ledwall — Maxischermo
  - 2.3 Regia — Pannello Admin
  - 2.4 QLab (Hardware Esterno)
- **3. ARCHITETTURA TECNICA**
  - 3.1 Stack Tecnologico
  - 3.2 Architettura di Rete e Deploy
  - 3.3 Architettura Media Server Locale
  - 3.4 Gestione Audio (Riproduzione)
  - 3.5 Requisiti di Performance
  - 3.6 Resilienza e Recovery
  - 3.7 Architettura Socket Rooms
  - 3.8 PWA e Ottimizzazione Mobile
  - 3.9 Sicurezza
- **4. FLUSSO DI ACCESSO (ONBOARDING)**
  - 4.1 Sequenza di Ingresso
  - 4.2 Bilanciamento Team
  - 4.3 Late Join e Riconnessione
  - 4.4 Configurazione Pre-Partita (Regia)
- **5. FASE LOBBY — LA DEMOCRAZIA DEL SUONO**
  - 5.1 Flusso di Votazione
  - 5.2 Libreria Suoni e Assegnazione
  - 5.3 Effetto in Gioco
- **6. MECCANICA DEL BUZZER (TRASVERSALE A TUTTI I ROUND)**
  - 6.1 Attivazione e Countdown
  - 6.2 Gestione della Priorità
  - 6.3 Stato degli Smartphone dopo il Buzzer
  - 6.4 Chat Privata di Squadra
  - 6.5 Timer di Risposta
  - 6.6 Validazione della Risposta
  - 6.7 Flusso Post-Buzzer: Risposta Corretta
  - 6.8 Flusso Post-Buzzer: Risposta Errata
  - 6.9 Gestione Fine Domanda senza Vincitore
- **7. MACCHINA A STATI SMARTPHONE**
  - 7.1 Diagramma degli Stati
  - 7.2 Flusso Standard di una Domanda
  - 7.3 Transizione tra Round
- **8. ROUND 1 — MUSIC QUIZ (INDOVINA LA CANZONE)**
  - 8.1 Descrizione
  - 8.2 Flusso Dettagliato
  - 8.3 Macchina a Stati Ledwall (Round 1)
  - 8.4 Ledwall durante Round 1
  - 8.5 Ultima Domanda del Round
- **9. ROUND 2 — CINEMA & SERIE TV (VIDEO ZOOM-OUT)**
  - 9.1 Descrizione
  - 9.2 Macchina a Stati Ledwall
  - 9.3 Flusso Dettagliato
  - 9.4 Note Tecniche
- **10. ROUND 3 — BRAND & PUBBLICITÀ (AD-DETECTOR)**
  - 10.1 Descrizione
  - 10.2 Macchina a Stati Ledwall (Round 3)
  - 10.3 Flusso Dettagliato
- **11. PANNELLO DI CONTROLLO REGIA (COMMAND CENTER)**
  - 11.1 Autenticazione
  - 11.2 Pagina: Configurazione Pre-Partita
  - 11.3 Pagina: Dashboard Live (Controller Gioco)
  - 11.4 Pagina: Monitoraggio
  - 11.5 Pagina: Gestione Media e Quiz
  - 11.6 Pagina: Mappa MIDI
  - 11.7 Setup PC Unico — Architettura a Route
  - 11.8 Modalità Demo/Test
- **12. LEDWALL — SPECIFICHE MAXISCHERMO**
  - 12.1 Contenuti e Layout
  - 12.2 Classifica e Transizioni tra Domande
  - 12.3 Sincronizzazione
  - 12.4 Transizioni tra Round
  - 12.5 Finale sul Ledwall
- **13. INTEGRAZIONE MIDI / QLAB**
  - 13.1 Protocollo
  - 13.2 Mappa MIDI Completa
  - 13.3 Resilienza
  - 13.4 Timing Invio Segnali MIDI
- **14. GRAN FINALE E CELEBRAZIONE**
  - 14.1 Sequenza Esatta
- **15. STILE GRAFICO E UX**
  - 15.1 Tema Principale — Cyberpunk
  - 15.2 Palette Colori
  - 15.3 Tipografia e Forme
  - 15.4 Elementi di Interfaccia Chiave
  - 15.5 Lingue
  - 15.6 Orientamento e Mobile
- **16. REQUISITI NON FUNZIONALI E DETTAGLI TECNICI**
  - 16.1 Performance e Ottimizzazione
  - 16.2 Gestione Dati e Log
  - 16.3 Gestione Stati Avanzata
  - 16.4 Disaster Recovery
  - 16.5 Pausa Automatica (Regia Disconnessa)
- **17. STRUTTURA DATABASE QUIZ E MEDIA**
  - 17.1 Schema Domande
  - 17.2 Struttura Cartella Media
  - 17.3 Workflow di Gestione Domande
  - 17.4 Selezione Domande per la Partita
  - 17.5 API REST Domande
- **18. SOMMARIO STATI SMARTPHONE**
- **19. GLOSSARIO EVENTI SOCKET.IO**
- **20. CHECKLIST DI SVILUPPO**

---

# 1. VISIONE GENERALE DEL PROGETTO

## 1.1 Concept

Cybershow Interactive 2026 è una piattaforma web real-time per la conduzione di show interattivi dal vivo. L'animatore turistico (la "Regia") dirige un quiz show a squadre in cui ogni spettatore partecipa con il proprio smartphone come telecomando. Il Ledwall (maxi-schermo) è il fulcro visivo della serata, mentre tutto il flusso è sincronizzato al millisecondo tra i dispositivi dei giocatori, il Ledwall e il sistema luci tramite MIDI/QLab.

## 1.2 Obiettivi Principali

- Immersività totale *— ogni telefono diventa parte della scenografia dello show*
- Scalabilità *— supporto a 500+ partecipanti simultanei senza degrado*
- Controllo assoluto della Regia *— l'animatore pilota ogni aspetto del gioco in tempo reale*
- Zero attrito per il pubblico *— ingresso via QR Code, nessun download, nessun account*
- Sincronizzazione hardware *— l'app invia segnali MIDI a QLab per luci ed effetti visivi*

## 1.3 Struttura della Serata

La partita è divisa in 3 Round, ciascuno corrispondente a una categoria. L'unica meccanica di risposta è il buzzer + risposta testuale aperta — non esistono modalità a scelta multipla.

- Round 1 — Music Quiz *— indovina la canzone (il titolo) dopo aver ascoltato la traccia audio*
- Round 2 — Cinema & Serie TV *— indovina il film da un video muto in zoom-out*
- Round 3 — Brand & Pubblicità (Ad-Detector) *— riconosci il brand da un'immagine statica con il logo oscurato*

Il numero di domande per round viene configurato dalla Regia prima dell'inizio della partita.

> La partita è una sessione unica. Non vengono salvati dati permanenti: al termine dello show, un comando KICK_ALL resetta tutto il sistema per l'evento successivo.

---

# 2. ATTORI DEL SISTEMA

## 2.1 Smartphone (Giocatori)

Funge esclusivamente da controller/telecomando. Ogni partecipante usa il proprio telefono per premere il buzzer, digitare risposte, scrivere nella chat di squadra e ricevere feedback visivi/aptici. Non è necessario alcun download: è una Progressive Web App (PWA) accessibile da browser.

## 2.2 Ledwall — Maxischermo

Secondo monitor collegato al Mac della Regia. Il browser del Mac ha la scheda `/ledwall` spostata sul secondo schermo in modalità fullscreen. Mostra QR Code, domande, video, classifiche, animazioni e tutto il contenuto visivo dello show. Il Ledwall **non emette mai audio** — è puramente visivo.

## 2.3 Regia — Pannello Admin

Il Mac dell'animatore. Ospita la dashboard di controllo completo (route `/regia`) in una scheda separata del browser. Da qui si gestisce ogni fase: avvio domande, validazione risposte, gestione punteggi, comandi MIDI, monitoraggio connessioni e override manuali. Il browser della Regia gestisce anche la riproduzione audio via Web Audio API — **tutto l'audio dello show esce dalle casse del Mac della Regia tramite la scheda `/regia`**.

## 2.4 QLab (Hardware Esterno)

Software di controllo luci installato sul Mac della Regia. Riceve segnali MIDI Note On tramite IAC Driver (bus MIDI virtuale interno a macOS). QLab gestisce **esclusivamente le luci e gli effetti visivi** — non gestisce l'audio dello show. Se QLab crasha, l'app mostra un avviso ma continua a funzionare autonomamente.

---

# 3. ARCHITETTURA TECNICA

## 3.1 Stack Tecnologico

- Backend *— Node.js con stato in-memory (Map/Object per sessioni, punteggi, stati) + autosave periodico su SQLite (ogni cambio domanda/punteggio). Nessun servizio esterno richiesto.*
- Real-Time Engine *— Socket.io (WebSocket) — latenza target < 100ms*
- Frontend Mobile *— React/Next.js — Single Page Application (SPA), nessun refresh*
- Frontend Ledwall *— Route `/ledwall` della stessa webapp — CSS 3D transforms + Framer Motion per classifica animata*
- Frontend Regia *— Route `/regia` della stessa webapp — dashboard admin con Web Audio API*
- Database Quiz *— **Drizzle ORM + SQLite** — database locale file-based, type-safe, migrazioni automatiche, zero overhead runtime (vedi §17)*
- Media Server *— endpoint HTTP `/media/` integrato nel backend Node.js locale*
- MIDI *— Libreria Node.js MIDI (`easymidi`) via IAC Driver (macOS) per comunicazione con QLab*
- Tunnel *— Cloudflare Tunnel (`cloudflared`) per esporre il server locale su URL pubblico stabile*

## 3.2 Architettura di Rete e Deploy

Il backend Node.js gira **interamente sul Mac della Regia**. Cloudflare Tunnel (`cloudflared`) crea un URL pubblico stabile (es. `cybershow.example.com`) che punta al server locale. Non è necessario un VPS cloud o un server remoto.

| Dispositivo | Connessione | Note |
|---|---|---|
| Server Node.js | Locale sul Mac | Esposto via Cloudflare Tunnel |
| Ledwall (/ledwall) | `http://localhost:PORT` | Stesso Mac, seconda scheda browser su secondo monitor, latenza zero |
| Regia (/regia) | `http://localhost:PORT` | Stesso Mac, scheda browser sul monitor principale, latenza zero |
| Giocatori (smartphone) | URL pubblico Cloudflare (4G/5G) | Connessione internet del giocatore |
| QLab | IAC Driver (interno al Mac) | Nessuna rete, MIDI virtuale |

> Il Mac della Regia deve avere una connessione internet stabile (Ethernet consigliata) per garantire la disponibilità del tunnel verso i 500 giocatori. Ledwall e Regia accedono direttamente a `localhost` — non dipendono da internet.

## 3.3 Architettura Media Server Locale

Il backend Node.js espone un endpoint `/media/` che serve i file multimediali da una cartella locale strutturata per ID domanda.

```
/media/
  /q001/          ← Round 1: audio.mp3 + ritornello.mp3 + reveal.jpg (opzionale)
  /q042/          ← Round 2: video.mp4 + reveal.jpg (obbligatorio)
  /q087/          ← Round 3: image.jpg + reveal.jpg (obbligatorio)
  /sounds/        ← Suoni squadra: sirena.mp3, papera.mp3, ... (min. 4 × squadre configurate)
  /system/        ← File di sistema (hype round, finale, suspense, spettrogramma)
```

- Formati: `.MP4`, `.MOV` per video | `.MP3` per audio | `.JPG`, `.PNG` per immagini
- Risoluzione video: 1080p
- **I video del Round 2 sono sempre senza traccia audio (muti)**
- Il Ledwall (localhost) accede ai media a velocità disco locale — nessun buffering

## 3.4 Gestione Audio (Riproduzione)

**L'audio viene riprodotto dal client browser `/regia`**, non dal backend Node.js e non dal Ledwall.

Il client `/regia` gestisce **due canali audio separati**:

| Canale | Cosa riproduce | Pausabile? | Eventi |
|---|---|---|---|
| **trackChannel** | Traccia R1, ritornello | Sì (FREEZE/UNFREEZE) | `PLAY_TRACK`, `PLAY_SFX` con soundId `ritornello_*` |
| **sfxChannel** | Suoni squadra, SFX di sistema, musica finale | No (fire-and-forget) | `PLAY_SFX` (non-ritornello), `PLAY_TEAM_SOUND` |

- `FREEZE_MEDIA` → `trackChannel.pause()` (sfxChannel non toccato)
- `UNFREEZE_MEDIA` → `trackChannel.play()`
- `STOP_AUDIO` → ferma entrambi i canali

Flusso:
1. Il server identifica l'evento audio da riprodurre (es. buzzer squadra blu)
2. Il server invia `PLAY_TEAM_SOUND { teamId }`, `PLAY_TRACK { audioUrl }` o `PLAY_SFX { soundId }` via Socket.io al client `/regia`
3. Il browser della Regia usa `new Audio('http://localhost:PORT/media/...').play()` sul canale appropriato
4. L'audio esce dalle casse collegate al Mac della Regia

L'`AudioContext` viene sbloccato al momento del login della Regia (inserimento codice evento = gesto utente). Da quel momento tutti gli eventi audio si riproducono senza ulteriori interazioni.

**Convenzione soundId per `PLAY_SFX`:** SFX di sistema → `/media/system/{soundId}.mp3`. Ritornello domanda (formato `ritornello_qXXX`) → `/media/qXXX/ritornello.mp3`.

> Tutta l'audio dello show (musiche, suoni squadra, celebrazione, ritornelli) esce esclusivamente dalle casse collegate al Mac della Regia tramite il browser /regia. Gli smartphone non riproducono mai alcun audio. Il Ledwall non riproduce mai alcun audio. QLab gestisce SOLO le luci.

## 3.5 Requisiti di Performance

- 500+ connessioni simultanee *— Socket.io con clustering se necessario*
- Sincronizzazione Clock *— il server sincronizza i client per il buzzer al millisecondo*
- Ottimizzazione Banda *— scambio di soli ID tra client e server — no stringhe pesanti*
- Latenza MIDI *— inferiore a 10ms per sincronia con effetti luce*
- Video *— serviti da localhost — nessun buffering*

## 3.6 Resilienza e Recovery

- No-Refresh *— un refresh accidentale non fa perdere la sessione (session token/cookie)*
- Keep-Alive *— heartbeat ogni 2 secondi — riconnessione istantanea*
- Re-sync Auto *— se un telefono perde il segnale, al rientro si allinea allo stato attuale*
- Disaster Recovery *— autosave su ogni cambio domanda/punteggio*
- Resilienza QLab *— se QLab crasha, avviso in regia ma il gioco continua*
- Pausa automatica Regia *— se tutte le istanze Regia si disconnettono, il gioco va in pausa (vedi §16.5)*

## 3.7 Architettura Socket Rooms

Ogni squadra è una Room separata su Socket.io. I messaggi (chat, suoni, stati) vengono instradati solo ai membri del team corretto, ottimizzando il traffico di rete. Esiste una Room globale per i broadcast di sistema (cambio stato, countdown, reveal).

## 3.8 PWA e Ottimizzazione Mobile

- L'app può essere aggiunta alla home del telefono come PWA (eliminando le barre del browser)
- Durante la lobby, gli asset leggeri (loghi, animazioni CSS) vengono scaricati in cache
- Le immagini reveal vengono pre-caricate sugli smartphone via `new Image().src` solo per R2 e R3. Per R1, il pre-caricamento reveal avviene solo sul client Ledwall (se esiste reveal.jpg)
- I video della domanda successiva vengono pre-caricati solo sul client Ledwall (tag `<video preload="auto">`)
- Gli smartphone non pre-caricano mai video o audio

## 3.9 Sicurezza

- Accesso Regia *— protetto da codice evento (vedi §11.1)*
- Anti-spam *— debouncing sul tasto buzzer (500ms lato client + protezione server: un solo buzzer per giocatore per domanda)*
- Nomi duplicati *— suffisso automatico (es. Marco 1, Marco 2)*
- Lunghezza nome *— massimo 15 caratteri*
- Privacy *— nessun dato sensibile memorizzato — solo ID di sessione e punteggi*

---

# 4. FLUSSO DI ACCESSO (ONBOARDING)

## 4.1 Sequenza di Ingresso

Il Ledwall mostra un QR Code gigante con call-to-action impattante.

Step utente (sempre lo stesso, anche per late join):

1. Scansione QR Code con il telefono
2. Inserimento Nome (max 15 caratteri)
3. Scelta della Squadra (tra quelle attive configurate dalla Regia)
4. Arrivo in Lobby — schermata di attesa con grafica Cybershow

Il QR Code resta visibile sul Ledwall fino a quando la Regia preme **AVVIA PARTITA**. Da quel momento il QR scompare dal Ledwall. Le iscrizioni restano sempre aperte: chiunque abbia il link può entrare in qualsiasi momento, anche a partita in corso.

## 4.2 Bilanciamento Team

Il limite di giocatori per squadra viene impostato **manualmente dalla Regia** prima dell'inizio dalla pagina di configurazione. Quando una squadra raggiunge il limite, l'ingresso viene bloccato automaticamente. Il Ledwall mostra 4 barre animate con il conteggio in tempo reale. La Regia può bloccare/sbloccare manualmente singole squadre in qualsiasi momento.

## 4.3 Late Join e Riconnessione

- **Late Join**: un utente può entrare in qualsiasi momento (anche a partita in corso). Segue il flusso completo (nome + squadra). Se la votazione suoni è in corso, partecipa. Se è già completata, riceve il suono già scelto dalla squadra. Se la partita è in corso, entra in STATE_WAITING e partecipa dalla prossima domanda. I limiti di squadra si applicano sempre: se la squadra scelta è piena, deve sceglierne un'altra.
- **Riconnessione**: Session token/cookie → rientro istantaneo nella propria squadra senza ripetere il login.

Il session token è un cookie di sessione che dura fino al KICK_ALL. Non ha scadenza temporale — viene invalidato dal server al KICK_ALL/Reset Hard.

## 4.4 Configurazione Pre-Partita (Regia)

Prima di avviare la partita, la Regia imposta:

- Numero di Squadre *— da 2 a 4 team attivi (Blu e Rosso obbligatori; Verde e Giallo opzionali)*
- Nomi delle Squadre *— editabili; fissi per tutta la sessione una volta avviata*
- Limite giocatori per squadra *— impostato manualmente*
- Numero di domande per round *— quante domande usare dal database (vedi §17.4)*
- Punteggio risposta corretta *— default 10 punti, configurabile (range 1-100), uguale per tutte le domande della partita*
- Bonus manuali *— range -50 / +50 punti (permette sia bonus che penalità manuali)*

---

# 5. FASE LOBBY — LA DEMOCRAZIA DEL SUONO

## 5.1 Flusso di Votazione

La votazione dei suoni viene avviata dalla Regia dal pannello (pulsante **AVVIA VOTAZIONE**), in qualsiasi momento la Regia ritenga opportuno. Ogni squadra vota **per il proprio suono** in parallelo alle altre squadre.

1. La Regia avvia la votazione dal pannello (pulsante **AVVIA VOTAZIONE**)
2. Su ogni smartphone appaiono 4 pulsanti con il nome testuale dei suoni assegnati alla propria squadra
3. La Regia, dal pannello, può far sentire l'anteprima di ogni suono tramite le casse della sala
4. I giocatori di ogni squadra votano — i voti si aggiornano in tempo reale
5. Allo scadere del timer di 60 secondi (o su comando Regia anticipato), il suono con più voti per ogni squadra vince
6. In caso di parità tra due o più suoni nella stessa squadra, si assegna casualmente uno dei suoni a parità
7. Ogni telefono riceve un banner overlay per 5 secondi: "Il suono della vostra squadra è [Nome Suono]"
8. Gli smartphone transizionano da STATE_VOTE_SOUND a STATE_WAITING
9. Il Ledwall mostra i suoni vincenti per ogni squadra con grafica celebrativa. Il QR Code resta visibile. Questa schermata resta fino a quando la Regia preme AVVIA PARTITA

## 5.2 Libreria Suoni e Assegnazione

La cartella `/media/sounds/` contiene almeno **4 × N file audio** dove N è il numero massimo di squadre configurabili (16 per 4 squadre). Il minimo operativo per una partita è 4 × numero_squadre_configurate. Prima dell'inizio della votazione, il server assegna **4 suoni esclusivi a ciascuna squadra**. Nessun suono è condiviso tra squadre diverse — non sono possibili conflitti.

Esempio con 4 squadre:
- Squadra Blu: opzioni [sirena, papera, ambulanza, urlo]
- Squadra Rosso: opzioni [clacson, campana, fischietto, tuono]
- Squadra Verde: opzioni [esplosione, laser, tromba, campanello]
- Squadra Giallo: opzioni [corno, gong, risata, applauso]

Ogni suono ha lo stesso volume normalizzato. I nomi dei suoni sono mostrati solo in forma testuale sugli smartphone — nessun audio dai telefoni.

## 5.3 Effetto in Gioco

Ogni volta che una squadra vince il buzzer, il server invia `PLAY_TEAM_SOUND { teamId }` al client `/regia`, che riproduce il file audio corrispondente dalle casse. Simultaneamente viene inviato il segnale MIDI (C3/D3/E3/F3) a QLab per gli effetti luce.

---

# 6. MECCANICA DEL BUZZER (TRASVERSALE A TUTTI I ROUND)

## 6.1 Attivazione e Countdown

- Buzzer inizialmente disabilitato (grigio) su tutti i telefoni
- **Round 1 (Music Quiz)**: la Regia dispone di due pulsanti separati:
  - **PLAY TRACCIA** — avvia la riproduzione della traccia audio dalle casse (in qualsiasi momento, anche prima del countdown)
  - **START** — avvia il countdown 3-2-1 sovrapposto al Tappo (velo con classifica) sugli smartphone e sul Ledwall. Alla fine del countdown: il Tappo sparisce, il video spettrogramma parte e il buzzer si attiva su tutti i 500 telefoni nel medesimo millisecondo
  - La Regia controlla la tempistica in modo indipendente: può far partire l'audio prima, durante o dopo il countdown
  - PLAY TRACCIA resta indipendente: può partire prima, durante o dopo il countdown
- **Round 2/3 ("Il Tappo")**: la Regia preme **VIA** → il velo ("Il Tappo") sparisce con animazione → parte il countdown 3-2-1 (media visibile, buzzer ancora disabilitato) → al termine del countdown il buzzer si attiva su tutti i 500 telefoni
- Al termine del countdown (tutti i round), il buzzer diventa attivo contemporaneamente su tutti i 500 telefoni

## 6.2 Gestione della Priorità

- Il server identifica il primo pacchetto ricevuto con precisione al millisecondo
- Appena ricevuto il primo buzzer valido, il server invia il blocco a tutti gli altri client in < 100ms
- **Non esiste una coda di buzzer.** Il primo buzzer ricevuto vince, tutti gli altri vengono scartati
- Ogni squadra può buzzare **una sola volta per domanda**. Se la squadra che ha buzzato sbaglia, i buzzer vengono riaperti per tutte le squadre **che non hanno ancora buzzato in questa domanda**
- Il server mantiene una lista `buzzedTeams[]` per ogni domanda, che traccia quali squadre hanno già usato il loro tentativo

## 6.3 Stato degli Smartphone dopo il Buzzer

**Squadra vincitrice del buzzer → STATE_GREEN**

- Chi ha premuto (STATE_GREEN_RESPONDER): box input testo aperto, autofocus, timer 60 secondi visibile
- Compagni di squadra (STATE_GREEN_TEAMMATE): chat privata aperta per suggerire la risposta (sopra il box di chi risponde)
- Feedback aptico: vibrazione prolungata ("battito cardiaco") su tutti i telefoni del team
- Feedback audio: il server → `/regia` → riproduce il Suono di Squadra dalle casse + segnale MIDI per luci

**Squadre avversarie → STATE_RED**

- Sfondo rosso intenso, nessuna interazione possibile
- Icona lucchetto cyberpunk al centro (trema/vibra se si tenta di premere)
- Messaggio "Squadra [Nome] sta rispondendo..."
- Vibrazione singola secca al momento del blocco

## 6.4 Chat Privata di Squadra

- Attiva sui compagni di squadra (STATE_GREEN_TEAMMATE); visibile sopra il box di chi risponde (STATE_GREEN_RESPONDER)
- Max 40 caratteri per messaggio, buffer massimo 20 messaggi
- Isolata per Room Socket.io — nessuna squadra vede la chat altrui
- Auto-reset al termine di ogni domanda

## 6.5 Timer di Risposta

Dopo aver vinto il buzzer, il giocatore ha **60 secondi** per digitare e inviare la risposta. Il timer è visibile sullo smartphone del giocatore, nel pannello della Regia e sul Ledwall.

- Se il diritto passa a un compagno della stessa squadra (dopo grazia 10s), il timer 60s **continua dal valore corrente** — non riparte
- Il timer **riparte da 60 secondi** solo quando il buzzer viene riassegnato a una squadra diversa (dopo risposta errata e riapertura buzzer)
- Allo scadere: risposta sbagliata automatica → buzzer riaperti per le altre squadre
- La Regia può azzerare o estendere il timer manualmente

**Disconnessione del rispondente:**

- Se il giocatore che sta rispondendo si disconnette: countdown di grazia **10 secondi**. Il timer 60s continua a scorrere durante la grazia.
- Se si riconnette entro 10s: riprende a digitare (il box input mantiene il testo parziale).
- Se non si riconnette entro 10s: il diritto passa a un altro membro connesso della stessa squadra. Il server seleziona il membro connesso con la sessione attiva da più tempo. Il nuovo rispondente transiziona a STATE_GREEN_RESPONDER con box input vuoto. Il timer 60s continua dal valore corrente.
- Se non ci sono altri membri connessi della squadra: la risposta è automaticamente errata → buzzer riaperti per le altre squadre.

## 6.6 Validazione della Risposta

- Case Insensitive
- Fuzzy Matching: tolleranza 1-2 caratteri
- Normalizzazione: accenti, spazi extra, punteggiatura ignorati
- Auto-Correction: varianti comuni (es. McDonald vs McDonald's)
- Override Regia: la risposta è sempre visibile in real-time al pannello; la Regia può forzare CORRETTO / SBAGLIATO in qualsiasi momento

## 6.7 Flusso Post-Buzzer: Risposta Corretta

Questo flusso si applica identicamente in ogni round:

1. Buzzer premuto → **FREEZE**: il server invia `FREEZE_MEDIA` — media congelato (video spettrogramma in pausa / video fermo / immagine statica), audio in pausa, bordi ghiacciati attivati su Ledwall e smartphone della squadra verde
2. Il nome e la squadra del giocatore che ha buzzato appaiono sovrapposti sul Ledwall
3. Il giocatore risponde (60s timer)
4. Risposta **CORRETTA** → il server invia il segnale MIDI G3 (risposta corretta) nello stesso tick
5. Effetto Vittoria automatico (5 secondi):
   - Ledwall: grafica "RISPOSTA CORRETTA" con animazione celebrativa
   - Smartphone: tutti i 500 telefoni mostrano schermata celebrativa + vibrazione
   - Audio: il server invia `PLAY_SFX { soundId: "victory" }` al client `/regia` → effetto sonoro vittoria dalle casse
6. Al termine dei 5 secondi, il server invia `SHOW_REVEAL { imageUrl, round }` a tutti i client. Simultaneamente parte la **Controprova**:
   - **Round 1**: il server invia `PLAY_SFX { soundId: "ritornello_qXXX" }` al client `/regia` → il ritornello della canzone corretta parte dalle casse (`/media/qXXX/ritornello.mp3`). Sul Ledwall: se esiste `reveal.jpg`, viene mostrata sovrapposta allo spettrogramma congelato. Il client smartphone ignora SHOW_REVEAL se `round === 1` (resta in STATE_CORRECT). Il ritornello suona fino alla fine del file o fino a quando la Regia preme STOP MUSICA
   - **Round 2**: l'immagine reveal (locandina/poster del film) sostituisce il video congelato — su Ledwall e su tutti i 500 smartphone
   - **Round 3**: l'immagine reveal (prodotto con logo visibile) sostituisce l'immagine con logo oscurato — su Ledwall e su tutti i 500 smartphone
   - I bordi ghiacciati restano durante tutta la controprova
   - La controprova (reveal) resta visibile a tempo indeterminato fino a PROSSIMA DOMANDA. Per R1, la Regia può interrompere il ritornello con STOP MUSICA ma la reveal.jpg (se presente) resta visibile
7. La Regia preme "PROSSIMA DOMANDA" → I bordi ghiacciati si rimuovono automaticamente alla ricezione di NEXT_QUESTION. Transizione alla domanda successiva (vedi §12.2)

## 6.8 Flusso Post-Buzzer: Risposta Errata

1. Risposta **ERRATA** → il server invia il segnale MIDI A3 (risposta errata) nello stesso tick
2. Animazione errore breve (~2 secondi) su Ledwall e smartphone. Il media resta congelato durante l'animazione
3. La squadra che ha sbagliato viene aggiunta a `buzzedTeams[]` → **non può più buzzare per questa domanda** → resta in STATE_RED bloccata
4. Al termine dei ~2 secondi, il server invia `UNFREEZE_MEDIA` — il media **si sblocca** (video spettrogramma riprende / video riprende / immagine resta visibile), audio riprende, e i bordi ghiacciati si rimuovono
5. I buzzer vengono **immediatamente riaperti** per tutte le squadre che non hanno ancora buzzato in questa domanda → tornano a STATE_BUZZER_ACTIVE
6. La Regia può interrompere in qualsiasi momento con Skip

> Nessuna penalità punti per risposta sbagliata.

## 6.9 Gestione Fine Domanda senza Vincitore

Se tutte le squadre attive hanno buzzato e sbagliato, oppure se la Regia preme Skip:

- Nessun punto assegnato a nessuna squadra
- Tutti i client → STATE_WAITING
- Il Tappo con classifica appare sul Ledwall
- La domanda viene marcata come "skippata/non risolta" nel log (non nel database domande)
- Il contatore domande del round avanza normalmente — la domanda non viene riproposta
- La Regia preme **PROSSIMA DOMANDA** per avanzare

> Non esiste un timer automatico che chiude la domanda. La Regia ha controllo manuale assoluto.

---

# 7. MACCHINA A STATI SMARTPHONE

## 7.1 Diagramma degli Stati

Ogni transizione è comandata dal server via Socket.io. Lo smartphone non decide mai autonomamente.

```
STATE_LOGIN ──→ STATE_LOBBY ──→ STATE_VOTE_SOUND ──→ STATE_WAITING
                                                          │
                                          [Regia: START/VIA]
                                                          ▼
                                                   STATE_COUNTDOWN (3-2-1)
                                                          │
                                                          ▼
                                                   STATE_BUZZER_ACTIVE
                                                     ┌────┴────┐
                                            [vinco buzzer]   [altra squadra]
                                                 │                │
                                                 ▼                ▼
                                          STATE_GREEN       STATE_RED
                                    ┌────────┴────────┐    (lucchetto)
                              RESPONDER          TEAMMATE
                           (box input 60s)     (chat team)
                                    │
                         ┌──────────┴──────────┐
                    [corretta]             [sbagliata]
                         │                      │
                         ▼                      ▼
                   STATE_CORRECT          STATE_ERROR (~2s)
                         │                      │
                    [R2/R3?]                    ▼
                    ┌────┴────┐      [buzzer riaperti per
                 [sì]       [no]      squadre rimanenti]
                  │           │              │
                  ▼           │              ▼
            STATE_REVEAL      │      STATE_BUZZER_ACTIVE
                  │           │      (esclusa questa squadra)
                  └─────┬─────┘
                        ▼
          STATE_WAITING (Velo + Classifica sul Ledwall)
                       ...
              [fine Round 3]
                        ▼
              STATE_FINALE_LOBBY
                ┌───────┴───────┐
          STATE_WINNER    STATE_LOSER
                        ▼
                   STATE_END
```

> **Stato ortogonale: STATE_PAUSED** — raggiungibile da qualsiasi stato quando tutte le istanze Regia si disconnettono per 6+ secondi. Alla riconnessione Regia, il client torna allo stato precedente. È un overlay temporaneo, non una transizione sequenziale del diagramma sopra.

## 7.2 Flusso Standard di una Domanda

Sequenza completa di una singola domanda (interamente gestita dalla Regia):

1. Regia preme "Prossima Domanda" → Ledwall: il Tappo (velo) appare con classifica sovrapposta. Smartphone: STATE_WAITING
2. Regia preme START (R1) o VIA (R2/R3) → il Tappo e la classifica spariscono → Ledwall mostra il media → countdown 3-2-1 su Ledwall e smartphone
3. Fine countdown → STATE_BUZZER_ACTIVE
4. Primo buzzer → squadra vincitrice: STATE_GREEN / altre: STATE_RED
5. Giocatore risponde entro 60s → validazione automatica + override Regia disponibile
6. Se corretta → STATE_CORRECT → effetto vittoria 5s → controprova → eventuale STATE_REVEAL (R2/R3)
7. Se sbagliata → STATE_ERROR (~2s) → squadra che ha sbagliato resta in STATE_RED (bloccata) → buzzer riaperti per squadre rimanenti → ritorno a STATE_BUZZER_ACTIVE
8. Regia preme "Prossima Domanda" → ciclo (Tappo + classifica → START/VIA → countdown → ...)

> **Nota:** Il buzzer è abilitato/disabilitato implicitamente dallo stato dello smartphone. È attivo solo in STATE_BUZZER_ACTIVE. I client determinano lo stato del buzzer dalla transizione `STATE_CHANGE { state }`.

## 7.3 Transizione tra Round

**Dalla Lobby al Round 1:**

1. Votazione completata → Ledwall mostra risultati votazione + QR. Regia preme **AVVIA PARTITA** → QR scompare → Tappo con classifica 0-0 (lista squadre)
2. Regia preme **PROSSIMO ROUND** → Ledwall mostra `hype_round1.mp4`. Al termine del video (o su comando Regia), torna al Tappo
3. Regia preme **PROSSIMA DOMANDA** → prima domanda del Round 1

**Tra round (R1→R2, R2→R3):**

Dopo l'ultima domanda di un round:

1. La Regia preme "PROSSIMO ROUND" dal pannello
2. Il Ledwall mostra il video Hype Round (Motion Graphic con titolo e grafica del round successivo) da `/media/system/hype_roundN.mp4`
3. Gli smartphone mostrano un'animazione coordinata di attesa
4. Al termine del video (o su comando Regia), si passa alla prima domanda del nuovo round con il flusso standard (Tappo + classifica → START/VIA → countdown)

---

# 8. ROUND 1 — MUSIC QUIZ (INDOVINA LA CANZONE)

## 8.1 Descrizione

La Regia avvia la riproduzione di una traccia audio dalle casse della sala. I giocatori ascoltano e, appena riconoscono la canzone, premono il buzzer. Chi vince la priorità digita il titolo.

## 8.2 Flusso Dettagliato

| FASE | LEDWALL | SMARTPHONE | LOGICA |
|---|---|---|---|
| Tappo + Classifica | Velo con classifica sovrapposta | STATE_WAITING (punteggio propria squadra) | Regia ha premuto "Prossima Domanda" |
| Avvio Traccia | Nessun cambiamento — il Tappo con classifica resta visibile | Buzzer disabilitato (grigio) | Regia preme PLAY TRACCIA — l'audio parte, il buzzer è ancora chiuso |
| Countdown | Countdown 3-2-1 sovrapposto al Tappo (velo ancora visibile) | Countdown 3-2-1 a tutto schermo | Regia preme START (separato da PLAY TRACCIA) |
| Fine Countdown | Tappo sparisce → video spettrogramma parte + grafica cyberpunk | Buzzer attivo al centro | Fine countdown — buzzer si apre su tutti i 500 telefoni, spettrogramma video parte |
| Buzzer premuto | Video spettrogramma in pausa (frame congelato). Nome+squadra vincitrice sovrapposti. Bordi ghiacciati | Verde + vibrazione. Altri: Rosso + lucchetto | FREEZE_MEDIA: video.pause(), audio.pause() |
| Risposta & Chat | Video spettrogramma congelato con bordi ghiacciati. Nome giocatore visibile. Timer 60s visibile | Chi risponde: box input (60s). Compagni: chat aperta | Max 40 char/msg |
| Risposta CORRETTA | Effetto vittoria 5s → poi ritornello dalle casse. Se esiste reveal.jpg: mostrata sul Ledwall (sovrapposta allo spettrogramma congelato). Smartphone restano in STATE_CORRECT. Bordi ghiacciati restano | Tutti: schermata celebrativa + vibrazione | Il ritornello suona fino a fine file o STOP MUSICA. Reveal solo su Ledwall |
| Risposta ERRATA | Bordi ghiacciati rimossi. Video spettrogramma riprende (video.play()). Audio riprende | Squadra che ha sbagliato: STATE_RED bloccata definitivamente per questa domanda. Altre squadre: buzzer riattivati | UNFREEZE_MEDIA: video.play(), audio.play(). Buzzer riaperti |
| Tutte sbagliate / Skip | Skip immediato + reset interfaccia | Tutti: STATE_WAITING | Nessun punto assegnato |

## 8.3 Macchina a Stati Ledwall (Round 1)

> **STATO_VELO ("Il Tappo")** Tappo con classifica sovrapposta. Spettrogramma non visibile.

> **STATO_PLAY** Fine countdown → Tappo sparisce → spettrogramma decorativo in loop + grafica cyberpunk.

> **STATO_FREEZE** Buzzer premuto: video.pause(), bordi ghiacciati, nome+squadra sovrapposti.

> **STATO_UNFREEZE** Risposta errata: video.play(), bordi rimossi, buzzer riaperti.

> **STATO_REVEAL** Risposta corretta: effetto vittoria 5s → ritornello dalle casse. Se reveal.jpg esiste: sovrapposta allo spettrogramma congelato.

## 8.4 Ledwall durante Round 1

Il Ledwall riproduce un **video decorativo pre-registrato dello spettrogramma** (`/media/system/spectrogram_loop.mp4`) in loop durante la riproduzione audio. Il video è puramente decorativo e non è sincronizzato con l'audio reale. Grafica cyberpunk: barre neon, particelle glow. Al buzzer (FREEZE_MEDIA): `video.pause()` — il frame dello spettrogramma si congela istantaneamente. Alla risposta errata (UNFREEZE_MEDIA): `video.play()` — lo spettrogramma riprende.

## 8.5 Ultima Domanda del Round

Prima dell'ultima domanda di **ogni round** (1, 2 e 3), viene lanciata automaticamente un'animazione "ULTIMA DOMANDA" (durata: 4 secondi) a tutto schermo sia sul Ledwall che su tutti i 500 smartphone. Il server rileva automaticamente che la prossima domanda è l'ultima del round e invia l'evento `LAST_QUESTION_ANIMATION`. Durante l'animazione, i pulsanti START/VIA della Regia sono disabilitati. Solo dopo la fine dell'animazione il flusso standard riprende.

---

# 9. ROUND 2 — CINEMA & SERIE TV (VIDEO ZOOM-OUT)

## 9.1 Descrizione

Un video muto di una scena cinematografica parte coperto da un velo/sipario, poi si apre e il video (che contiene già l'effetto zoom-out nella regia video) viene riprodotto. I giocatori devono riconoscere il film/serie e premere il buzzer.

> I video del Round 2 sono sempre **muti** (nessuna traccia audio). L'effetto zoom-out è già presente nel file video — l'app non applica alcuna trasformazione al video.

## 9.2 Macchina a Stati Ledwall

> **STATO_VELO ("Il Tappo")** Il video è caricato ma invisibile — un velo/sipario grafico copre tutto il Ledwall, con la classifica aggiornata sovrapposta. Serve a mostrare i punteggi tra una domanda e l'altra. Il buzzer è disabilitato.

> **STATO_PLAY** La Regia preme VIA → il velo e la classifica spariscono con animazione → countdown 3-2-1 (il video è ora visibile ma fermo, il buzzer è ancora disabilitato) → fine countdown: il video parte e il buzzer si attiva su tutti i 500 telefoni.

> **STATO_FREEZE** Al primo buzzer: `video.pause()` immediato. Bordi ghiacciati sui bordi del frame. Nome+squadra vincitrice sovrapposti.

> **STATO_UNFREEZE** Risposta errata: i bordi ghiacciati si rimuovono, `video.play()` riprende, buzzer riaperti per squadre rimanenti.

> **STATO_REVEAL** Risposta corretta: effetto vittoria 5s, poi i bordi ghiacciati restano, il frame congelato viene sostituito dall'immagine reveal a tutto schermo — sia sul Ledwall che su tutti i 500 telefoni.

## 9.3 Flusso Dettagliato

| FASE | LEDWALL | SMARTPHONE | LOGICA |
|---|---|---|---|
| Tappo + Classifica | Velo/sipario copre il video al frame 0 + classifica sovrapposta | STATE_WAITING (punteggio propria squadra) | Layer CSS sopra il video già caricato |
| Regia preme VIA | Velo + classifica spariscono con animazione → video visibile ma fermo + Countdown 3-2-1 sovrapposto | Countdown 3-2-1 a tutto schermo — Buzzer ancora disabilitato | Il countdown parte DOPO la scomparsa del velo |
| Fine Countdown | Video parte (muto, effetto zoom-out già nel file) | Buzzer attivo su tutti i 500 telefoni | Sincronizzazione server-side al ms |
| Buzzer (Freeze) | video.pause(). Bordi ghiacciati. Nome+squadra vincitrice sovrapposti | Verde + vibrazione. Altri: Rosso + lucchetto. Suono team + MIDI luci | FREEZE_MEDIA gestito server-side |
| Risposta & Chat | Video congelato + bordi ghiacciati + nome giocatore. Timer 60s visibile | box input (60s). Compagni: chat | Fuzzy matching |
| Risposta CORRETTA | Effetto vittoria 5s → immagine reveal a tutto schermo. Bordi ghiacciati restano | Stessa immagine reveal su tutti i 500 telefoni + schermata celebrativa | Broadcast push |
| Risposta ERRATA | Bordi ghiacciati rimossi. video.play() riprende | Squadra: STATE_RED bloccata. Altre: buzzer riattivati | UNFREEZE_MEDIA. Buzzer riaperti per squadre rimanenti |
| Tutte sbagliate / Skip | Skip immediato + reset interfaccia | Tutti: STATE_WAITING | Nessun punto assegnato |

## 9.4 Note Tecniche

- Layer Ledwall: Layer 0 = sfondo round, Layer 1 = video player (muto), Layer 2 = velo CSS, Layer 3 = classifica overlay
- I video contengono già l'effetto zoom-out nel file — l'app li riproduce normalmente con `<video>`
- Freeze sincrono: gestito server-side, inviato a tutti i client — non affidato al singolo browser
- Unfreeze: il server invia `UNFREEZE_MEDIA`, il Ledwall riprende `video.play()`, buzzer riaperti per squadre rimanenti
- Effetto ghiaccio: overlay CSS (border-ice-effect) sopra il video; bordi ghiacciati anche sugli smartphone della squadra verde
- Pre-caricamento: immagine reveal pre-caricata sugli smartphone via `new Image().src` durante la riproduzione del video (solo R2/R3). Video domanda successiva pre-caricato solo sul client Ledwall

---

# 10. ROUND 3 — BRAND & PUBBLICITÀ (AD-DETECTOR)

## 10.1 Descrizione

**Immagini statiche** di spot pubblicitari con il logo/marchio del brand oscurato (bollino nero o blur). I giocatori devono riconoscere il brand e premere il buzzer.

## 10.2 Macchina a Stati Ledwall (Round 3)

> **STATO_VELO ("Il Tappo")** L'immagine è caricata ma invisibile — un velo/sipario grafico copre tutto il Ledwall, con la classifica aggiornata sovrapposta. Il buzzer è disabilitato.

> **STATO_PLAY** La Regia preme VIA → il velo e la classifica spariscono con animazione → countdown 3-2-1 (l'immagine con logo oscurato è ora visibile, il buzzer è ancora disabilitato) → fine countdown: il buzzer si attiva su tutti i 500 telefoni.

> **STATO_FREEZE** Al primo buzzer: l'immagine resta visibile (statica). I bordi del frame assumono l'effetto ghiacciato. Nome+squadra vincitrice sovrapposti. Il buzzer si blocca per tutti.

> **STATO_UNFREEZE** Risposta errata: i bordi ghiacciati si rimuovono, l'immagine con logo oscurato resta visibile, buzzer riaperti per squadre rimanenti.

> **STATO_REVEAL** Risposta corretta: effetto vittoria 5s, poi l'immagine con logo oscurato viene sostituita dall'immagine reveal (prodotto con logo visibile) — su Ledwall e su tutti i 500 telefoni. Bordi ghiacciati restano.

## 10.3 Flusso Dettagliato

| FASE | LEDWALL | SMARTPHONE | LOGICA |
|---|---|---|---|
| Tappo + Classifica | Velo/sipario copre l'immagine + classifica sovrapposta | STATE_WAITING (punteggio propria squadra) | Layer CSS sopra l'immagine già caricata |
| Regia preme VIA | Velo + classifica spariscono con animazione → immagine con logo oscurato visibile + Countdown 3-2-1 sovrapposto | Countdown 3-2-1 a tutto schermo — Buzzer ancora disabilitato | Il countdown parte DOPO la scomparsa del velo |
| Fine Countdown | Immagine visibile a tutto schermo | Buzzer attivo su tutti i 500 telefoni | Sincronizzazione server-side al ms |
| Buzzer (Freeze) | Immagine resta visibile. Bordi ghiacciati attivati. Nome+squadra vincitrice sovrapposti | Verde + vibrazione. Altri: Rosso + lucchetto. Suono team + MIDI luci | Nessun "freeze" necessario (immagine statica) |
| Risposta & Chat | Immagine con logo oscurato + bordi ghiacciati + nome giocatore. Timer 60s visibile | box input (60s). Compagni: chat | Fuzzy matching |
| Risposta CORRETTA | Effetto vittoria 5s → immagine reveal (logo visibile) a tutto schermo. Bordi ghiacciati restano | Stessa immagine reveal su tutti i 500 telefoni + schermata celebrativa | Broadcast push |
| Risposta ERRATA | Bordi ghiacciati rimossi. Immagine oscurata resta visibile | Squadra: STATE_RED bloccata. Altre: buzzer riattivati | UNFREEZE_MEDIA. Buzzer riaperti per squadre rimanenti |
| Tutte sbagliate / Skip | Skip immediato + reset interfaccia | Tutti: STATE_WAITING | Nessun punto assegnato |

---

# 11. PANNELLO DI CONTROLLO REGIA (COMMAND CENTER)

## 11.1 Autenticazione

L'accesso alla Regia avviene tramite **codice evento** (Secret Key):

- Prima dell'evento, viene configurato un codice segreto (es. `SHOW-7X4K`) in variabile d'ambiente sul server
- La Regia accede a `/regia` e inserisce solo questo codice → JWT 12h
- Un unico JWT è valido alla volta, ma **più tab/browser possono condividere la stessa sessione** (vedi §16.5)
- Al rientro (stesso browser, JWT ancora valido) il gioco riprende

## 11.2 Pagina: Configurazione Pre-Partita

- Numero team attivi (2-4)
- Nomi squadre
- Limite giocatori per squadra (manuale)
- Numero domande per round
- Punteggio risposta corretta (default 10, range 1-100)
- Bonus manuali (range -50 / +50)
- Accesso a Gestione Media e Quiz (§11.5)

## 11.3 Pagina: Dashboard Live (Controller Gioco)

Tutti i controlli in una schermata unica:

- **AVVIA VOTAZIONE** — avvia la fase di votazione suoni (avviabile in qualsiasi momento)
- **AVVIA PARTITA** — avvia la partita dopo la configurazione. Mostra il Tappo con la classifica a 0-0 (lista squadre) sul Ledwall
- **PLAY TRACCIA** *(solo Round 1)* — avvia la riproduzione della traccia audio dalle casse (indipendente dal countdown)
- **STOP MUSICA** *(solo Round 1)* — interrompe manualmente la traccia o il ritornello di controprova in qualsiasi momento. (Il pulsante STOP MUSICA genera l'evento `STOP_AUDIO` via Socket.io)
- **START** *(Round 1)* / **VIA** *(Round 2/3)* — Round 1: avvia il countdown. Round 2/3: rimuove il Tappo (velo) e la classifica → poi parte il countdown. Disabilitato durante animazione "ULTIMA DOMANDA"
- **PROSSIMO ROUND** — passa al round successivo dopo l'ultima domanda
- **PROSSIMA DOMANDA** — carica la domanda successiva e mostra il Tappo con classifica sul Ledwall
- **CORRETTO / SBAGLIATO** — override manuale della validazione automatica. Se la Regia fa override, il segnale MIDI corrispondente (G3 o A3) viene inviato in quel momento
- **Annulla ultimo punto** — annulla l'ultima operazione di punteggio (automatica o bonus manuale, qualsiasi squadra). Singolo livello di undo. Il pannello mostra cosa verrà annullato (es. "+10 a Squadra Blu, domanda q007")
- **Bonus manuali** — assegnazione straordinaria di punti (range -50 / +50)
- **Skip domanda** — termina la domanda corrente senza assegnare punti. Tutti i client → STATE_WAITING. Loggata come "skippata". La domanda non è recuperabile. La Regia deve premere PROSSIMA DOMANDA per avanzare
- **Reset Soft** — riporta tutti i client a STATE_WAITING senza avanzare. Azzera `buzzedTeams[]`. Il timer 60s si annulla immediatamente. Il giocatore in STATE_GREEN_RESPONDER torna a STATE_WAITING come tutti gli altri. L'eventuale audio in riproduzione viene fermato (STOP_AUDIO su entrambi i canali). Loggata come "interrotta". La Regia può riprovare (START/VIA) o passare avanti (PROSSIMA DOMANDA)
- **Reset Hard / KICK_ALL** — disconnette tutti, svuota DB, invia segnale MIDI B3 (blackout luci), termina la sessione (solo a fine show)
- **Timer risposta** — timer 60s visibile + azzeramento/estensione manuale
- **Monitor Chat** — tutte le chat di squadra in tempo reale su un'unica schermata
- **Moderazione utenti** — kick (espulsione istantanea) o rinomina utenti. Un utente kikkato può rientrare scansionando nuovamente il QR Code (nuovo session token, nuovo nome)
- **Scoreboard** — widget laterale sempre visibile che mostra i punteggi correnti di tutte le squadre in tempo reale. Aggiornato ad ogni SCORE_UPDATE. Evidenzia la squadra in testa
- **Alert Performance** — notifica se le connessioni compromettono la fluidità server
- **SUSPENSE** *(solo Finale)* — avvia musica di tensione dalle casse (vedi §14.1)
- **OK FINALE** *(solo Finale, disponibile solo dopo SUSPENSE)* — invia `STOP_AUDIO` (la musica suspense si ferma), poi avvia il Video Celebrativo Epico sul Ledwall (vedi §14.1)

> Per verificare il Ledwall, l'animatore può aprire un'ulteriore scheda `/ledwall` in miniatura sul proprio monitor.

## 11.4 Pagina: Monitoraggio

- Contatore connessioni real-time
- Distribuzione team (barre con numero giocatori per squadra)
- Stato client (connesso / disconnesso / riconnessioni frequenti)
- Blocco/sblocco ingresso per singola squadra

## 11.5 Pagina: Gestione Media e Quiz

La Regia gestisce le domande con un CRUD completo:

**Inserimento:**

1. **Seleziona Round** (1, 2 o 3)
2. **Compila testo**: domanda IT, domanda EN, risposta corretta, risposte alternative accettabili
3. **Carica media principale** (drag & drop):
   - R1: `audio.mp3` + `ritornello.mp3` (entrambi obbligatori)
   - R2: `video.mp4` / `video.mov` (muto, con effetto zoom-out già incluso)
   - R3: `image.jpg` / `image.png` (con logo oscurato)
4. **Carica reveal** (drag & drop): `reveal.jpg` / `reveal.png` (obbligatorio per R2 e R3, opzionale per R1)
5. **Anteprima** del media e del reveal dal pannello
6. **Salva** — sistema crea cartella `/media/qXXX/` e aggiunge la voce al database. L'ID viene generato automaticamente dal sistema in formato `q` + numero incrementale a 3 cifre con zero-padding (q001, q002, ..., q999). La validazione al salvataggio impedisce di salvare una domanda R1 senza `ritornello.mp3`
7. **Ordina** — drag & drop per riordinare le domande nel round

**Modifica:**

- Selezionare una domanda esistente dalla lista del round
- Modificare qualsiasi campo testo (domanda IT/EN, risposta corretta, risposte alternative)
- Sostituire i file media (upload sovrascrive il file esistente)
- Salvare le modifiche

**Cancellazione:**

- Eliminare una domanda dalla lista del round
- Il sistema rimuove la voce dal database e la cartella `/media/qXXX/` corrispondente
- L'ordine delle domande rimanenti viene ricalcolato automaticamente

## 11.6 Pagina: Mappa MIDI

Mappa completa di tutti i segnali MIDI generati per ogni azione — fondamentale per configurare QLab prima dello show.

## 11.7 Setup PC Unico — Architettura a Route

Il backend Node.js gira sul Mac. Tre route, ciascuna in una finestra/tab separata:

- `/ledwall` — vista fullscreen proiettata sul secondo monitor (Ledwall). **Non emette mai audio.**
- `/regia` — dashboard admin (autenticazione codice evento). **Gestisce tutta la riproduzione audio.**
- `/app` (o dominio pubblico Cloudflare) — vista mobile giocatori

QLab gira in background sullo stesso Mac, riceve MIDI via IAC Driver.

## 11.8 Modalità Demo/Test

La Regia può avviare una modalità Demo/Test dalla pagina di configurazione pre-partita per verificare l'intero flusso prima dell'evento reale.

**Attivazione:** Toggle "Modalità Demo" nella pagina Configurazione Pre-Partita (§11.2). La modalità Demo è visivamente distinguibile (banner "DEMO" fisso in alto nella dashboard Regia e sul Ledwall).

**Bot simulati:**
- La Regia configura il numero di bot (da 4 a 50, default 20) distribuiti uniformemente tra le squadre attive
- I bot si iscrivono automaticamente con nomi generati (es. "Bot-01", "Bot-02", ...)
- Durante la votazione suoni: i bot votano casualmente dopo 2-5 secondi
- Durante il gioco: un bot casuale preme il buzzer dopo 1-3 secondi dall'attivazione, poi invia una risposta (corretta o errata in modo alternato) dopo 3-5 secondi
- I bot non usano la chat di squadra

**Verifica completa:** La Demo attraversa tutte le fasi — lobby, votazione, tutti i round con almeno 2 domande ciascuno, finale — permettendo di verificare MIDI, video, transizioni Ledwall e audio.

**Debug Mode:** Accessibile aggiungendo `?debug=true` alla route `/regia`. Mostra un pannello aggiuntivo con: riproduzione simultanea di tutti i suoni squadra, trigger manuale di ogni singolo segnale MIDI, simulazione di disconnessione/riconnessione client, visualizzazione real-time dello stato di ogni bot.

---

# 12. LEDWALL — SPECIFICHE MAXISCHERMO

## 12.1 Contenuti e Layout

**Layout durante l'Onboarding (iscrizioni aperte):**
- QR Code in alto a destra (visibile e scannerizzabile da vicino al Ledwall)
- Call-to-action testuale al centro (es. "Scansiona e unisciti al Cybershow!")
- Barre conteggio squadre in basso (4 barre animate con nome squadra e numero giocatori)
- Sfondo cyberpunk animato (particelle, circuiti neon)
- Il QR Code scompare quando la Regia preme AVVIA PARTITA — non è più visibile durante il gioco

**Layout durante il Gioco:**
- Testi bilingui (IT/EN) sempre visibili come sottotitoli
- Media di gioco al centro (video spettrogramma decorativo R1 / video R2 / immagine R3)
- Stato del gioco con indicatori visivi per ogni fase (velo, play, freeze, reveal)
- Grafiche e animazioni cyberpunk in tutte le fasi
- Tutti i tag `<video>` sul Ledwall devono avere l'attributo `muted` — il Ledwall non emette mai audio

## 12.2 Classifica e Transizioni tra Domande

La classifica appare **sovrapposta al Tappo (velo)** tra una domanda e l'altra. Non è una schermata separata: è un overlay sul velo che copre il media della domanda successiva.

**Sequenza tra domande:**
1. Risposta corretta → effetto vittoria 5s → controprova (reveal)
2. Regia preme "PROSSIMA DOMANDA" → il Ledwall mostra il Tappo (velo) con la classifica aggiornata sovrapposta. Smartphone: STATE_WAITING (punteggio propria squadra)
3. Regia preme START (R1) o VIA (R2/R3) → il Tappo e la classifica spariscono → countdown 3-2-1 → domanda successiva

Barre volumetriche animate via CSS 3D transforms + Framer Motion con effetti di sorpasso. Gli smartphone mostrano solo il punteggio della propria squadra in piccolo (STATE_WAITING) — non vedono la classifica comparativa.

## 12.3 Sincronizzazione

Il client Ledwall è sullo stesso Mac del server Node.js → accede a `localhost` → latenza quasi zero. La sincronia con gli smartphone avviene tramite Socket.io. Lo spettrogramma R1 è un video decorativo pre-registrato riprodotto localmente dal client Ledwall — non richiede comunicazione inter-tab.

## 12.4 Transizioni tra Round

- Tra domande: Tappo con classifica sovrapposta → START/VIA → countdown
- Tra round: video Hype Round (Motion Graphic con titolo e grafica del nuovo round) da `/media/system/hype_roundN.mp4`
- Inizio evento: QR Code con barre equalizzatore animate (conteggio iscritti)

## 12.5 Finale sul Ledwall

- Video celebrativo epico (`/media/system/finale_celebration.mp4`) → rivelazione podio 4°→3°→2°→1° con animazioni
- "We Are The Champions" (`/media/system/champions.mp3`) dalle casse in sincrono con la classifica finale
- Effetti speciali, logo vincitore, fuochi d'artificio digitali

---

# 13. INTEGRAZIONE MIDI / QLAB

## 13.1 Protocollo

Il server Node.js invia segnali MIDI direttamente tramite libreria `easymidi` → IAC Driver (bus MIDI virtuale macOS) → QLab. Nessuna API browser coinvolta. Comunicazione interna al Mac. QLab controlla **esclusivamente le luci e gli effetti visivi** — tutto l'audio è gestito dal client `/regia`.

## 13.2 Mappa MIDI Completa

| Nota MIDI | Trigger | Descrizione |
|---|---|---|
| **C3** | Buzzer Squadra Blu | Un membro del team Blu vince il buzzer — effetto luci |
| **D3** | Buzzer Squadra Rosso | Un membro del team Rosso vince il buzzer — effetto luci |
| **E3** | Buzzer Squadra Verde | Un membro del team Verde vince il buzzer — effetto luci |
| **F3** | Buzzer Squadra Giallo | Un membro del team Giallo vince il buzzer — effetto luci |
| **G3** | Risposta CORRETTA | Show luci celebrativo |
| **A3** | Risposta ERRATA | Flash negativo luci |
| **B3** | Blackout Finale | Fine show: blackout luci — inviato con KICK_ALL |

> C3-F3 triggerano SOLO effetti luce in QLab. Il suono della squadra è riprodotto dal client /regia via Web Audio API — NON da QLab.

## 13.3 Resilienza

Se QLab crasha, avviso nel pannello Regia ma il gioco non si interrompe.

## 13.4 Timing Invio Segnali MIDI

I segnali MIDI vengono inviati dal server **nello stesso tick** dell'evento corrispondente:

- C3/D3/E3/F3: inviati nel momento in cui il server valida il primo buzzer (stessa operazione che notifica i client)
- G3: inviato nel momento in cui la risposta viene validata come corretta (automaticamente o via override Regia)
- A3: inviato nel momento in cui la risposta viene validata come errata (automaticamente o via override Regia)
- B3: inviato quando la Regia preme KICK_ALL

Se la Regia fa override (es. il sistema dice "errata" ma la Regia preme "CORRETTO"), viene inviato G3 al momento dell'override, sovrascrivendo l'A3 precedente.

---

# 14. GRAN FINALE E CELEBRAZIONE

## 14.1 Sequenza Esatta

1. Fine Round 3 — tutti i telefoni → STATE_FINALE_LOBBY (schermata neutra, classifica nascosta)
2. Regia preme **SUSPENSE** — il server invia `PLAY_SFX { soundId: "suspense_music" }` al client `/regia` → musica di tensione dalle casse (`/media/system/suspense_music.mp3`)
3. Regia preme **OK FINALE** (disponibile solo dopo aver attivato Suspense) — il server invia `STOP_AUDIO` al client `/regia` (la musica suspense si ferma) → parte il Video Celebrativo Epico sul Ledwall (`/media/system/finale_celebration.mp4`)
4. Al termine del video: rivelazione podio (4°→3°→2°→1°) con animazioni sul Ledwall. In caso di parità, le squadre con lo stesso punteggio condividono la stessa posizione nel podio (mostrate affiancate)
5. In sincrono: il server invia `PLAY_SFX { soundId: "champions" }` → "We Are The Champions" dalle casse (`/media/system/champions.mp3`) — i telefoni mostrano animazione celebrativa
6. Telefoni Squadra Vincitrice: STATE_WINNER — Verde + Pioggia d'Oro + vibrazione battito cardiaco
7. Telefoni Squadre Sconfitte: STATE_LOSER — Rosso + scritta "PERDITA"
8. Tutti i telefoni: "Grazie per aver partecipato!" → STATE_END (app disabilitata)
9. Regia preme **Reset Hard / KICK_ALL** → segnale MIDI B3 (blackout luci) → database svuotato, pronto per evento successivo

---

# 15. STILE GRAFICO E UX

## 15.1 Tema Principale — Cyberpunk

Estetica Cyberpunk pura: circuiti in background, neon blu/viola/verde acido, bordi luminosi, particelle fluttuanti. Futuristico, ad alto contrasto, immersivo.

## 15.2 Palette Colori

| Colore | Hex | Uso |
|---|---|---|
| Blu elettrico | #00AEEF | Colore dominante, pulsanti, bordi attivi |
| Rosa shocking | #ED008C | Accenti, stati di allerta |
| Azzurro Tiffany | #B2EBF2 | Effetti ghiaccio, stati secondari |
| Verde vittoria | #2E8B57 | STATE_GREEN squadra attiva |
| Rosso blocco | #B22222 | STATE_RED squadre bloccate |
| Sfondo scuro | #1A1A2E | Fondo principale smartphone e Ledwall |

## 15.3 Tipografia e Forme

- Font: carattere cartoonesco ma leggibile (tipo Burbank o simile)
- Forme: solo angoli arrotondati (border-radius alto) — stile gommoso e morbido
- Iconografia: tocco alieno/spaziale su tutte le icone
- Background: micro-animazioni (particelle, stelle) senza appesantire

## 15.4 Elementi di Interfaccia Chiave

- **Buzzer**: pulsante centrale circolare enorme, texture aliena, glow pulsante quando attivo
- **STATE_GREEN**: sfondo verde pulsante con glow animato
- **STATE_RED**: sfondo rosso fisso — lucchetto cyberpunk che trema se si tenta di premere
- **Box risposta**: campo testo bianco, autofocus, timer 60s visibile
- **Classifica Ledwall**: barre volumetriche animate con CSS 3D transforms + Framer Motion, sovrapposta al Tappo
- **Spettrogramma R1**: video decorativo pre-registrato con barre neon (si congela al buzzer tramite `video.pause()`)
- **Bordi ghiacciati**: overlay CSS celeste/ghiaccio, presenti in tutti i round dal momento del buzzer fino alla fine della controprova. Rimossi in caso di risposta errata (buzzer riaperti). Rimossi automaticamente alla ricezione di NEXT_QUESTION

## 15.5 Lingue

- Italiano e Inglese — uniche lingue supportate
- Ledwall: testi bilingui sempre visibili (IT + EN come sottotitoli)
- Smartphone: switch individuale lingua via icona bandiera (IT/EN) nell'angolo superiore, visibile in tutti gli stati tranne STATE_COUNTDOWN e STATE_BUZZER_ACTIVE. La scelta è persistita in `localStorage` del device. Default: italiano
- Etichette buzzer (BUZZ!, LOCKED, SUBMIT) in lingua unica predefinita

## 15.6 Orientamento e Mobile

Solo portrait mode. Rotazione bloccata via CSS. Layout ottimizzato per uso con una mano, pulsanti sovradimensionati, leggibile in condizioni di luce scarsa.

---

# 16. REQUISITI NON FUNZIONALI E DETTAGLI TECNICI

## 16.1 Performance e Ottimizzazione

- Battery Saver: animazioni ottimizzate per 2h di utilizzo senza svuotare la batteria
- Sound Normalization: tutti i suoni di squadra hanno lo stesso volume
- Video Locale: serviti da localhost — zero buffering
- Pre-fetch Images: reveal pre-caricato sugli smartphone solo per R2/R3 durante la domanda in corso; R1 reveal pre-caricato solo sul Ledwall
- Pre-load Video: solo sul client Ledwall per la domanda successiva

## 16.2 Gestione Dati e Log

- Log Esportabile: file CSV scaricabile dal pannello Regia con: timestamp, ID domanda, round, squadra, giocatore, risposta data, esito (corretto/errato/skip/interrotta), punti assegnati, tempo di risposta in ms. Disponibile dopo il Gran Finale e prima del KICK_ALL
- No storico permanente: KICK_ALL svuota completamente il database
- Auto-Correction: varianti comuni (es. McDonald vs McDonald's)

## 16.3 Gestione Stati Avanzata

- Socket Rooms per squadra (max 4 room + 1 room globale)
- Re-sync Auto: al rientro dopo disconnessione, il telefono si allinea allo stato corrente
- Countdown 3-2-1 prima di ogni domanda
- Lock Animation: il lucchetto vibra se toccato durante STATE_RED
- Anti-Cheat: debouncing sul buzzer (500ms lato client + protezione server: un solo buzzer per giocatore per domanda)
- Lista `buzzedTeams[]` per domanda: traccia le squadre che hanno già usato il loro tentativo

## 16.4 Disaster Recovery

Autosave garantito da scrittura periodica su SQLite — ogni cambio domanda/punteggio viene persistito automaticamente su disco. In caso di crash, al riavvio il server ricarica lo stato dall'ultimo salvataggio: stessi punteggi, stessa domanda, utenti nelle proprie squadre. La partita si chiude SOLO con KICK_ALL esplicito.

## 16.5 Pausa Automatica (Regia Disconnessa)

Il server Regia invia un heartbeat specifico ogni 2 secondi. Se **nessun heartbeat** arriva da **nessuna istanza** Regia per 6 secondi (3 battiti consecutivi persi), il server attiva la pausa automatica:

- Il server invia `GAME_PAUSED` a tutti i client
- Se tutte le istanze /regia si disconnettono, l'audio in riproduzione si interrompe automaticamente (il browser perde la connessione Socket.io)
- Il server invia `GAME_PAUSED` ai client rimanenti: il Ledwall mette in pausa il video e mostra la schermata di pausa
- Smartphone: schermata "GIOCO IN PAUSA — riprenderà tra poco" con animazione di attesa (sovrapposta allo stato attuale)
- Ledwall: stessa schermata di pausa (sovrapposta al frame congelato)
- Punteggi e stato del gioco preservati in memoria e persistiti su SQLite
- Alla riconnessione di almeno una istanza Regia (JWT ancora valido, durata 12h): il server invia `GAME_RESUMED` → tutti i client tornano allo stato precedente. L'audio NON riprende automaticamente — la Regia deve premere PLAY TRACCIA o riavviare manualmente

**Istanze multiple della Regia**: un unico JWT è valido alla volta, ma più tab/browser possono condividere la stessa sessione. Tutte le istanze coesistono e sono sincronizzate in tempo reale. Tutti i comandi sono idempotenti e propagati a tutti i client. Il gioco va in pausa solo se TUTTE le istanze smettono di inviare heartbeat per 6+ secondi.

---

# 17. STRUTTURA DATABASE QUIZ E MEDIA

## 17.1 Schema Domande

**Tecnologia:** Drizzle ORM + SQLite. Il database è un file locale (`quiz.db`) nella directory del progetto. Lo schema Drizzle definisce i tipi TypeScript direttamente nel codice (zero codegen) e gestisce le migrazioni tramite `drizzle-kit`.

| Campo | Tipo | Obbligatorio | Descrizione |
|---|---|---|---|
| `id` | string | Sì | ID univoco autogenerato (formato: `q` + 3 cifre zero-padded, es. `q001`, `q042`, `q999`) |
| `round` | number (1/2/3) | Sì | Round di appartenenza |
| `question_text_it` | string | Sì | Testo domanda in italiano |
| `question_text_en` | string | Sì | Testo domanda in inglese |
| `correct_answer` | string | Sì | Risposta corretta principale |
| `accepted_answers` | string[] | No | Risposte alternative accettabili |
| `media_type` | string | Sì | `audio` (R1) / `video` (R2) / `image` (R3) |
| `has_reveal` | boolean | Sì | `true` se esiste un file reveal nella cartella media. Default: `true` per R2/R3, `false` per R1 |
| `order` | number | Sì | Ordine di presentazione nel round (drag & drop) |

Il campo `accepted_answers` è serializzato come stringa JSON in un campo `TEXT` di SQLite. Drizzle gestisce la serializzazione/deserializzazione tramite un custom type.

## 17.2 Struttura Cartella Media

```
/media/
  /q001/              ← Round 1: Music Quiz
    audio.mp3         (obbligatorio)
    ritornello.mp3    (obbligatorio per R1 — file audio separato del ritornello)
    reveal.jpg        (opzionale — es. copertina album)

  /q042/              ← Round 2: Cinema
    video.mp4         (obbligatorio — muto, con effetto zoom-out già incluso)
    reveal.jpg        (obbligatorio — locandina/poster del film)

  /q087/              ← Round 3: Brand
    image.jpg         (obbligatorio — con logo oscurato)
    reveal.jpg        (obbligatorio — con logo visibile)

  /sounds/            ← Libreria suoni squadra (minimo 4 × squadre configurate, max 16 per 4 squadre)
    sirena.mp3
    papera.mp3
    ambulanza.mp3
    urlo.mp3
    clacson.mp3
    campana.mp3
    fischietto.mp3
    tuono.mp3
    esplosione.mp3
    laser.mp3
    tromba.mp3
    campanello.mp3
    corno.mp3
    gong.mp3
    risata.mp3
    applauso.mp3

  /system/            ← File di sistema (non gestiti dal CRUD domande)
    hype_round1.mp4   (video transizione prima del Round 1)
    hype_round2.mp4   (video transizione prima del Round 2)
    hype_round3.mp4   (video transizione prima del Round 3)
    spectrogram_loop.mp4  (video decorativo spettrogramma per Round 1 — in loop)
    finale_celebration.mp4  (video celebrativo finale)
    suspense_music.mp3      (musica suspense pre-finale)
    champions.mp3           (musica celebrativa finale)
    victory.mp3             (effetto sonoro vittoria — 5 secondi)
```

**Convenzione nomi file:**
- `audio.mp3` — traccia musicale (Round 1)
- `ritornello.mp3` — file audio separato del ritornello (Round 1, obbligatorio)
- `video.mp4` o `video.mov` — clip video muto (Round 2)
- `image.jpg` o `image.png` — immagine statica (Round 3, logo oscurato)
- `reveal.jpg` o `reveal.png` — immagine soluzione (R2 obbligatorio, R3 obbligatorio, R1 opzionale)

## 17.3 Workflow di Gestione Domande

**Inserimento:**

1. **Seleziona Round** (1, 2 o 3)
2. **Compila i campi testo** (domanda IT, EN, risposta corretta, risposte alternative)
3. **Carica il file media principale** (drag & drop). Per R1: carica `audio.mp3` + `ritornello.mp3` (entrambi obbligatori)
4. **Carica il file reveal** (drag & drop — obbligatorio per R2 e R3, opzionale per R1)
5. **Anteprima** del media e del reveal nel pannello
6. **Salva** — il sistema genera un ID automatico (q001, q002, ...), crea `/media/qXXX/`, salva i file, aggiunge al database
7. **Ordina** — drag & drop nella lista del round per definire l'ordine di presentazione

**Modifica:**

1. Selezionare una domanda esistente dalla lista del round
2. Modificare qualsiasi campo testo o sostituire i file media
3. Salvare le modifiche

**Cancellazione:**

1. Eliminare una domanda dalla lista del round
2. Il sistema rimuove la voce dal database e la cartella `/media/qXXX/` corrispondente
3. L'ordine delle domande rimanenti viene ricalcolato automaticamente

## 17.4 Selezione Domande per la Partita

Le domande vengono riprodotte **nell'ordine configurato** dalla Regia via drag & drop. La Regia imposta quante domande usare per round — il sistema prende le prime N dall'ordine configurato. Le domande rimanenti nel database vengono ignorate per quella partita.

Se il database ha meno domande di quelle configurate per un round, il sistema usa tutte le domande disponibili e avvisa la Regia con una notifica nel pannello.

## 17.5 API REST Domande

| Metodo | Endpoint | Descrizione |
|---|---|---|
| `GET` | `/api/questions` | Lista tutte le domande (filtrabile per round) |
| `POST` | `/api/questions` | Crea una nuova domanda |
| `PUT` | `/api/questions/:id` | Modifica una domanda esistente |
| `DELETE` | `/api/questions/:id` | Elimina una domanda e la sua cartella media |
| `POST` | `/api/questions/:id/media` | Upload/sostituzione file media per una domanda |
| `DELETE` | `/api/questions/:id/media?file=<filename>` | Rimuove un file media specifico da una domanda. Query param `file` obbligatorio (es. `?file=ritornello.mp3`, `?file=reveal.jpg`) |
| `PUT` | `/api/questions/reorder` | Riordina le domande di un round. Body: `{ round: number, questionIds: string[] }` — l'ordine dell'array definisce il nuovo ordine |

---

# 18. SOMMARIO STATI SMARTPHONE

| Stato | Trigger | Cosa vede l'utente |
|---|---|---|
| STATE_LOGIN | Prima connessione via QR | Campo nome + scelta squadra |
| STATE_LOBBY | Dopo scelta squadra | Logo Cybershow + grafica primo gioco |
| STATE_VOTE_SOUND | Comando Regia | 4 opzioni suono esclusive per la propria squadra — barra voti in real-time |
| STATE_WAITING | In attesa domanda | Animazione idle + punteggio propria squadra |
| STATE_COUNTDOWN | Regia preme START/VIA | Countdown 3-2-1 a tutto schermo |
| STATE_BUZZER_ACTIVE | Fine countdown | Grande pulsante buzzer circolare luminoso |
| STATE_GREEN_RESPONDER | Vince il buzzer (chi ha premuto) | Verde + box input risposta + timer 60s |
| STATE_GREEN_TEAMMATE | Vince il buzzer (compagni) | Verde + chat squadra aperta |
| STATE_RED | Altra squadra ha buzzato | Rosso + lucchetto cyberpunk |
| STATE_CORRECT | Risposta esatta | Schermata celebrativa + vibrazione (5s). Per R1: smartphone restano in STATE_CORRECT (reveal solo su Ledwall) |
| STATE_REVEAL | Controprova attivata | Immagine reveal a tutto schermo. Solo R2 e R3. R1: smartphone restano in STATE_CORRECT |
| STATE_ERROR | Risposta sbagliata | Flash rosso (~2s) + vibrazione + messaggio errore → la squadra che ha sbagliato transiziona a STATE_RED (bloccata per questa domanda). Le altre squadre tornano a STATE_BUZZER_ACTIVE |
| STATE_PAUSED | Tutte le istanze Regia disconnesse per 6+ secondi | "Gioco in pausa — riprenderà tra poco" |
| STATE_FINALE_LOBBY | Fine Round 3 | Schermata neutra di attesa |
| STATE_WINNER | Podio: squadra 1a | Verde + Pioggia d'Oro + vibrazione |
| STATE_LOSER | Podio: squadre 2-4 | Rosso + scritta PERDITA |
| STATE_END | KICK_ALL | "Grazie per aver partecipato!" — app disabilitata |

---

# 19. GLOSSARIO EVENTI SOCKET.IO

Elenco degli eventi WebSocket principali usati nel sistema:

| Evento | Direzione | Payload | Descrizione |
|---|---|---|---|
| `PLAYER_JOIN` | Client → Server | `{ name, teamId }` | Giocatore entra nella partita |
| `TEAM_UPDATE` | Server → All | `{ teams: [{id, name, count}] }` | Aggiornamento conteggio squadre |
| `START_VOTE` | Server → All | `{ options: {teamId: [sounds]} }` | Avvio votazione suoni |
| `CAST_VOTE` | Client → Server | `{ soundId }` | Voto per un suono |
| `VOTE_UPDATE` | Server → Team Room | `{ votes: {soundId: count} }` | Aggiornamento voti in tempo reale |
| `VOTE_RESULT` | Server → Team Room | `{ winningSoundId, soundName }` | Risultato votazione |
| `START_GAME` | Server → All | `{ teams }` | Avvia la partita — Ledwall mostra Tappo con classifica iniziale |
| `STATE_CHANGE` | Server → All | `{ state, data }` | Cambio di stato globale |
| `COUNTDOWN` | Server → All | `{ seconds }` | Tick countdown (3, 2, 1) |
| `BUZZER_PRESS` | Client → Server | `{ playerId, teamId, timestamp }` | Giocatore preme il buzzer |
| `BUZZER_RESULT` | Server → All | `{ winnerTeamId, winnerPlayerId, winnerName }` | Risultato buzzer — chi ha vinto |
| `FREEZE_MEDIA` | Server → All | `{}` | Congela media attivi e attiva bordi ghiacciati. Ledwall: R1 video.pause(), R2 video.pause(), R3 solo bordi ghiacciati. Client /regia: trackChannel.pause() (sfxChannel non toccato) |
| `UNFREEZE_MEDIA` | Server → All | `{}` | Riprende media attivi e rimuove bordi ghiacciati. Ledwall: R1 video.play(), R2 video.play(), R3 solo rimuove bordi ghiacciati. Client /regia: trackChannel.play() |
| `SUBMIT_ANSWER` | Client → Server | `{ answer }` | Giocatore invia risposta |
| `ANSWER_RESULT` | Server → All | `{ correct, teamId, answer }` | Risultato validazione risposta |
| `REOPEN_BUZZERS` | Server → All | `{ buzzedTeams[] }` | Riapertura buzzer per tutte le squadre non presenti in buzzedTeams[] |
| `PLAY_TEAM_SOUND` | Server → Regia | `{ teamId }` | Riproduci suono squadra dalle casse |
| `PLAY_TRACK` | Server → Regia | `{ audioUrl }` | Riproduce traccia audio su trackChannel (solo R1). Flusso: Regia preme PLAY TRACCIA → server invia PLAY_TRACK → /regia riproduce su trackChannel |
| `PLAY_SFX` | Server → Regia | `{ soundId }` | Riproduci effetto sonoro (victory, suspense, champions, ritornello). Ritornello (`ritornello_*`) → trackChannel; altri → sfxChannel |
| `STOP_AUDIO` | Server → Regia | `{}` | Interrompi audio in riproduzione |
| `SHOW_REVEAL` | Server → All | `{ imageUrl, round }` | Mostra immagine reveal su Ledwall e smartphone (R2/R3) o solo Ledwall (R1). Smartphone ignora se `round === 1` |
| `NEXT_QUESTION` | Server → All | `{ questionId, round, questionNum, totalQuestions }` | Carica domanda successiva + mostra Tappo con classifica. Rimuove bordi ghiacciati |
| `NEXT_ROUND` | Server → All | `{ round, hypeVideoUrl }` | Transizione al round successivo |
| `LAST_QUESTION_ANIMATION` | Server → All | `{}` | Avvia animazione "ULTIMA DOMANDA" (4 secondi) |
| `SCORE_UPDATE` | Server → All | `{ scores: [{teamId, points}] }` | Aggiornamento punteggi |
| `GAME_PAUSED` | Server → All | `{}` | Gioco in pausa (Regia disconnessa) |
| `GAME_RESUMED` | Server → All | `{}` | Gioco ripreso (Regia riconnessa) |
| `CHAT_MESSAGE` | Client → Server | `{ message }` | Messaggio chat squadra (max 40 char) |
| `CHAT_BROADCAST` | Server → Team Room | `{ playerId, playerName, message }` | Messaggio chat distribuito al team |
| `KICK_PLAYER` | Server → Client | `{ reason }` | Espulsione giocatore |
| `KICK_ALL` | Server → All | `{}` | Fine show — disconnetti tutti |
| `MIDI_SEND` | Server → MIDI | `{ note }` | Invia nota MIDI a QLab via IAC Driver |
| `REGIA_HEARTBEAT` | Regia → Server | `{}` | Heartbeat ogni 2 secondi per monitoraggio connessione Regia |
| `CMD_START_VOTE` | Regia → Server | `{}` | Regia avvia la votazione suoni |
| `CMD_END_VOTE` | Regia → Server | `{}` | Regia chiude anticipatamente la votazione suoni |
| `CMD_START_GAME` | Regia → Server | `{}` | Regia preme AVVIA PARTITA |
| `CMD_PLAY_TRACK` | Regia → Server | `{ questionId }` | Regia preme PLAY TRACCIA (solo R1) |
| `CMD_STOP_AUDIO` | Regia → Server | `{}` | Regia preme STOP MUSICA |
| `CMD_START_QUESTION` | Regia → Server | `{}` | Regia preme START (R1) o VIA (R2/R3) — avvia countdown |
| `CMD_NEXT_QUESTION` | Regia → Server | `{}` | Regia preme PROSSIMA DOMANDA |
| `CMD_NEXT_ROUND` | Regia → Server | `{}` | Regia preme PROSSIMO ROUND |
| `CMD_OVERRIDE_ANSWER` | Regia → Server | `{ correct: boolean }` | Regia preme CORRETTO o SBAGLIATO (override validazione) |
| `CMD_SKIP_QUESTION` | Regia → Server | `{}` | Regia preme Skip domanda |
| `CMD_RESET_SOFT` | Regia → Server | `{}` | Regia preme Reset Soft |
| `CMD_BONUS` | Regia → Server | `{ teamId, points }` | Regia assegna bonus/penalità manuale (range -50/+50) |
| `CMD_UNDO_SCORE` | Regia → Server | `{}` | Regia preme Annulla ultimo punto |
| `CMD_KICK_PLAYER` | Regia → Server | `{ playerId }` | Regia espelle un giocatore |
| `CMD_RENAME_PLAYER` | Regia → Server | `{ playerId, newName }` | Regia rinomina un giocatore |
| `CMD_SUSPENSE` | Regia → Server | `{}` | Regia preme SUSPENSE (solo finale) |
| `CMD_OK_FINALE` | Regia → Server | `{}` | Regia preme OK FINALE (solo dopo SUSPENSE) |
| `CMD_KICK_ALL` | Regia → Server | `{}` | Regia preme Reset Hard / KICK_ALL (fine show) |
| `RENAME_PLAYER` | Server → Client | `{ playerId, newName }` | Notifica rinomina giocatore a tutti i client |

---

# 20. CHECKLIST DI SVILUPPO

**Core / Real-Time**
- [ ] WebSocket (Socket.io) — latenza < 100ms
- [ ] Stato in-memory (Map/Object) per sessioni, punteggi, stati di gioco
- [ ] Race condition handling sul buzzer (precisione al ms)
- [ ] Lista `buzzedTeams[]` per domanda — traccia squadre che hanno già buzzato
- [ ] Riapertura buzzer dopo risposta errata (escluse squadre già sbagliate)
- [ ] Socket Rooms per squadra (max 4) + Room globale per broadcast
- [ ] Heartbeat / Keep-Alive ogni 2 secondi
- [ ] Session token / cookie per riconnessione senza re-login (invalidato solo da KICK_ALL)
- [ ] Autosave su SQLite ad ogni cambio domanda/punteggio — disaster recovery
- [ ] Timer risposta 60 secondi dopo il buzzer (continua se passa a compagno, riparte solo su nuova squadra)
- [ ] Pausa automatica basata su heartbeat Regia (6s senza heartbeat da nessuna istanza)
- [ ] Cloudflare Tunnel (`cloudflared`) per URL pubblico stabile
- [ ] Disconnessione rispondente: grazia 10s, passaggio a compagno (sessione più vecchia, timer continua) o risposta errata automatica

**Smartphone App**
- [ ] PWA (aggiungibile alla home)
- [ ] SPA (no refresh = no perdita sessione)
- [ ] Feedback aptico (Vibration API) differenziato vittoria/sconfitta
- [ ] Solo portrait mode (CSS)
- [ ] Fuzzy matching + case insensitive + auto-correction
- [ ] Chat privata squadra (max 40 char/msg, buffer 20 msg, reset ogni domanda)
- [ ] Countdown 3-2-1 prima di ogni domanda
- [ ] Timer 60s visibile nel box risposta
- [ ] STATE_PAUSED (schermata pausa automatica — overlay su qualsiasi stato)
- [ ] State machine completa (§7) con tutti gli stati (§18)
- [ ] STATE_GREEN split: RESPONDER (box input) e TEAMMATE (chat)
- [ ] STATE_ERROR transitorio (~2s) poi STATE_RED (bloccata per la domanda)
- [ ] Pre-load immagini reveal via `new Image().src` (solo R2/R3 sugli smartphone; R1 solo sul Ledwall)
- [ ] Switch lingua IT/EN con icona bandiera (localStorage)
- [ ] Debouncing buzzer 500ms lato client
- [ ] Buzzer abilitato/disabilitato implicitamente dallo stato (attivo solo in STATE_BUZZER_ACTIVE)

**Ledwall**
- [ ] Layer manager (sfondo / video spettrogramma o VideoPlayer / velo / classifica overlay) per tutti i round
- [ ] Tappo (velo) con classifica sovrapposta tra le domande
- [ ] Freeze frame sincrono server-side (FREEZE_MEDIA)
- [ ] Unfreeze (ripresa video/spettrogramma) dopo risposta errata (UNFREEZE_MEDIA)
- [ ] Bordi ghiacciati (CSS overlay) dal momento del buzzer — rimossi in caso di errore o alla ricezione di NEXT_QUESTION
- [ ] Nome+squadra vincitrice sovrapposti al momento del buzzer (tutti i round)
- [ ] Video spettrogramma decorativo R1 (`spectrogram_loop.mp4` in loop, pause/play al freeze/unfreeze)
- [ ] Display immagine statica per R3 (nessun video)
- [ ] Classifica animata via CSS 3D transforms + Framer Motion — mostrata sovrapposta al Tappo tra le domande
- [ ] Timer 60s visibile sul Ledwall durante la risposta
- [ ] Broadcast reveal a tutti i 500 client in sincrono
- [ ] Animazione "ULTIMA DOMANDA" (4 secondi, automatica, disabilita START/VIA)
- [ ] Video Hype Round tra i round (`/media/system/hype_roundN.mp4`, incluso hype_round1 — video obbligatorio)
- [ ] Schermate pausa e ripresa
- [ ] Ledwall non emette mai audio (tag video muted)

**Pannello Regia**
- [ ] Autenticazione con codice evento (JWT 12h, multi-tab consentito)
- [ ] Dashboard live unica con tutti i comandi
- [ ] Pulsante AVVIA VOTAZIONE (avviabile in qualsiasi momento)
- [ ] Pulsante AVVIA PARTITA (QR Code scompare, mostra Tappo con classifica 0-0)
- [ ] Pulsante PROSSIMO ROUND
- [ ] Pulsante PLAY TRACCIA (solo R1 — avvia traccia audio, indipendente dal countdown)
- [ ] Pulsante STOP MUSICA (solo R1 — interrompe traccia o ritornello, genera STOP_AUDIO)
- [ ] Pulsante START (R1) / VIA (R2/R3) — avvia countdown. Disabilitato durante animazione "ULTIMA DOMANDA"
- [ ] Pulsante PROSSIMA DOMANDA (mostra Tappo + classifica)
- [ ] Pulsanti CORRETTO / SBAGLIATO (override manuale validazione — invia segnale MIDI G3 o A3 al momento dell'override)
- [ ] Pulsante SUSPENSE (solo finale)
- [ ] Pulsante OK FINALE (solo dopo SUSPENSE — invia STOP_AUDIO poi parte video celebrativo)
- [ ] Scoreboard laterale sempre visibile (aggiornato ad ogni SCORE_UPDATE)
- [ ] Monitor tutte le chat squadra in real-time
- [ ] Timer risposta visibile + controlli (azzeramento/estensione)
- [ ] Gestione Media e Quiz con CRUD completo, drag & drop e anteprima (§11.5)
- [ ] Pagina Mappa MIDI
- [ ] Skip domanda (termina senza punti, tutti → STATE_WAITING, loggata "skippata", non recuperabile, Regia deve premere PROSSIMA DOMANDA per avanzare)
- [ ] Reset Soft (STATE_WAITING senza avanzare, azzera buzzedTeams[], annulla timer 60s, ferma audio tramite STOP_AUDIO, loggata "interrotta", Regia può riprovare)
- [ ] Reset Hard / KICK_ALL (fine show, invia MIDI B3)
- [ ] Moderazione utenti (kick/rinomina — utente kikkato può rientrare)
- [ ] Annulla ultimo punto (singolo livello di undo, mostra anteprima)
- [ ] Bonus manuali (range -50 / +50)
- [ ] Alert Performance
- [ ] Nota: per verificare il Ledwall, aprire una scheda `/ledwall` in miniatura sul monitor della Regia

**Media Server**
- [ ] Endpoint `/media/` integrato in Node.js — solo localhost
- [ ] Struttura cartelle per ID domanda (vedi §17.2)
- [ ] Cartella `/media/system/` per file di sistema (hype round 1/2/3, spettrogramma loop, finale, suspense, champions, victory)
- [ ] Formati: MP4, MOV, MP3, JPG, PNG — video 1080p, muti per R2
- [ ] Cartella `/media/sounds/` con minimo 4 × squadre configurate file audio normalizzati
- [ ] Pre-caricamento video domanda successiva solo sul client Ledwall

**Audio (Client /regia — Due canali)**
- [ ] Web Audio API (`new Audio().play()`) sul browser `/regia`
- [ ] AudioContext sbloccato al login (codice evento = gesto utente)
- [ ] Due canali audio separati: trackChannel (traccia R1, ritornello — pausabile) e sfxChannel (suoni squadra, SFX sistema, musica finale — fire-and-forget)
- [ ] Gestione eventi `PLAY_TRACK`, `PLAY_TEAM_SOUND` e `PLAY_SFX` separati
- [ ] `PLAY_TRACK { audioUrl }` → riproduce su trackChannel (solo R1)
- [ ] `PLAY_SFX` con soundId `ritornello_*` → trackChannel; altri soundId → sfxChannel
- [ ] `PLAY_TEAM_SOUND` → sfxChannel
- [ ] `FREEZE_MEDIA` → trackChannel.pause() (sfxChannel non toccato)
- [ ] `UNFREEZE_MEDIA` → trackChannel.play()
- [ ] `STOP_AUDIO` → ferma entrambi i canali
- [ ] Suoni squadra riprodotti automaticamente al buzzer vincente
- [ ] Effetto vittoria 5 secondi automatico dopo risposta corretta
- [ ] Ritornello R1 sempre riprodotto dopo i 5 secondi di vittoria (`/media/qXXX/ritornello.mp3`)
- [ ] STOP MUSICA per interruzione manuale (genera evento STOP_AUDIO)
- [ ] Tutti i suoni serviti da `http://localhost:PORT/media/sounds/` e `http://localhost:PORT/media/system/`
- [ ] Convenzione soundId: sistema → `/media/system/{soundId}.mp3`, ritornello → `/media/qXXX/ritornello.mp3`

**MIDI / QLab**
- [ ] easymidi (Node.js) via IAC Driver (macOS) — nessuna API browser
- [ ] Note On: C3/D3/E3/F3 (buzzer squadre — luci), G3 (corretto), A3 (errore), B3 (blackout con KICK_ALL)
- [ ] Latenza MIDI < 10ms
- [ ] Timing: segnale MIDI inviato nello stesso tick dell'evento corrispondente
- [ ] Override Regia: nuovo segnale MIDI sovrascrive il precedente
- [ ] Resilienza: il gioco continua se QLab è offline
- [ ] QLab gestisce SOLO luci

**Database Quiz (§17)**
- [ ] Drizzle ORM + SQLite (`quiz.db` locale) — schema type-safe e migrazioni via drizzle-kit
- [ ] Schema domande con campo `has_reveal` (§17.1) — ritornello.mp3 sempre obbligatorio per R1 (nessun flag DB)
- [ ] ID autogenerato: formato `q` + 3 cifre zero-padded (q001...q999)
- [ ] CRUD completo: inserimento, modifica, cancellazione domande (§11.5)
- [ ] API REST: GET/POST/PUT/DELETE `/api/questions`, media upload/delete, reorder (§17.5)
- [ ] Selezione domande per ordine configurato — prime N dell'ordine (§17.4)
- [ ] Validazione: se domande disponibili < configurate, usa tutte e avvisa la Regia
- [ ] Validazione: R1 non salvabile senza `ritornello.mp3`

**Lobby / Suoni Squadra**
- [ ] Pulsante AVVIA VOTAZIONE (avviabile in qualsiasi momento)
- [ ] QR Code scompare con AVVIA PARTITA (START_GAME)
- [ ] Votazione suoni per squadra in parallelo (ogni squadra vota il proprio suono)
- [ ] Timer votazione 60 secondi (o chiusura anticipata da Regia)
- [ ] 4 opzioni esclusive per ogni squadra (nessun conflitto possibile)
- [ ] Pool di 4 × squadre configurate suoni (min 4 × N)
- [ ] Libreria `/media/sounds/` con min 4 × squadre configurate file
- [ ] Late join durante votazione: il giocatore partecipa alla votazione in corso
- [ ] Banner risultato votazione (5 secondi) prima di transizionare a STATE_WAITING

**Finale**
- [ ] Parità punteggio: squadre con lo stesso punteggio condividono la stessa posizione nel podio (affiancate)
- [ ] OK FINALE invia STOP_AUDIO (suspense si ferma) poi parte video celebrativo

**Sicurezza e Gestione**
- [ ] Debouncing anti-cheat sul buzzer (500ms client + protezione server)
- [ ] Bilanciamento team con limite manuale + blocco automatico
- [ ] KICK_ALL / Reset Hard a fine show (con segnale MIDI B3)
- [ ] Log esportabile CSV con tempi di risposta (scaricabile prima di KICK_ALL)
- [ ] Nomi duplicati gestiti con suffisso automatico (max 15 char)

**Lingue**
- [ ] Italiano e Inglese — switch individuale sullo smartphone (icona bandiera, localStorage)
- [ ] Ledwall bilingue (IT + EN come sottotitoli)
- [ ] Etichette buzzer in lingua unica predefinita

---

*Fine del Documento — CYBERSHOW INTERACTIVE 2026 — PRD v3.6*
