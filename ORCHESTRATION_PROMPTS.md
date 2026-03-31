# CYBERSHOW 2026 — Prompt per Orchestrazione Multi-Agentica

**Versione:** 1.0
**Data:** 2026-03-25

> Ogni sezione contiene un prompt autosufficiente da copiare-incollare in una nuova sessione Claude Code.
> L'agente leggerà i file referenziati autonomamente con il tool Read — non serve allegare nulla.

---

## Indice Rapido

| Fase | Agente | Modello | Dipendenze |
|------|--------|---------|------------|
| 0 | [Agent 0: Setup Progetto](#agent-0-setup-progetto--infrastruttura) | Sonnet 4.6 | Nessuna |
| 1 | [Agent 1: Database & API](#agent-1-database-schema--api-rest) | Sonnet 4.6 | Agent 0 |
| 1 | [Agent 2: Game Engine](#agent-2-game-engine--socketio) | Opus 4.6 | Agent 0 + Agent 1 |
| 2 | [Agent 3: Smartphone](#agent-3-frontend-smartphone) | Sonnet 4.6 | Agent 0 + Agent 2 |
| 2 | [Agent 4: Ledwall](#agent-4-frontend-ledwall) | Sonnet 4.6 | Agent 0 + Agent 2 |
| 2 | [Agent 5: Regia](#agent-5-frontend-regia) | Sonnet 4.6 | Agent 0 + Agent 1 + Agent 2 |
| 3 | [Agent 6: MIDI](#agent-6-integrazione-midi) | Sonnet 4.6 | Agent 2 |
| 3 | [Agent 7: Integrazione](#agent-7-integrazione--wiring-end-to-end) | Opus 4.6 | Agent 0–6 tutti |
| 4 | [Agent 8: Demo/Bot](#agent-8-sistema-demo--bot) | Sonnet 4.6 | Agent 7 |
| 4 | [Agent 9: QA](#agent-9-qa--validazione-finale) | Opus 4.6 | Agent 8 |

---

## Agent 0: Setup Progetto & Infrastruttura

```
Sei Agent 0 — Setup Progetto & Infrastruttura.
Modello: Sonnet 4.6

═══ MISSIONE ═══

Devi creare da zero l'intero progetto CyberShow Interactive 2026: init npm, tutte le dipendenze, configurazioni TypeScript/Vite/Tailwind, routing React sulle 3 route, tema cyberpunk, componenti UI base, e soprattutto il CONTRATTO CENTRALE dei tipi condivisi (src/types/index.ts) che tutti gli agenti futuri useranno come interfaccia.

═══ CONTESTO DA LEGGERE ═══

Leggi il file CYBERSHOW_INTERACTIVE_2026_PRD_v3.6.md — le seguenti sezioni:
- §1 (Visione Generale) — per capire il progetto
- §3.1 (Stack Tecnologico) — per le dipendenze
- §3.2 (Architettura di Rete e Deploy) — per la configurazione server
- §3.8 (PWA e Ottimizzazione Mobile) — per il manifest
- §3.9 (Sicurezza) — per le regole di sicurezza
- §7.1 (Diagramma degli Stati smartphone) — per gli enum PlayerState
- §11.7 (Setup PC Unico — Architettura a Route) — per il routing React
- §15.1-15.3 (Stile Grafico: tema, palette, tipografia) — per il CSS cyberpunk
- §18 (Sommario Stati Smartphone) — per tutti i 17 stati come enum
- §19 (Glossario Eventi Socket.io) — per i tipi degli eventi (solo definizioni tipo)

Leggi anche il file ORCHESTRATION_PLAN.md — sezione "Agent 0" per i dettagli completi dei deliverable.

═══ FILE DA CREARE ═══

1.  package.json — con TUTTE le dipendenze:
    - Prod: react, react-dom, react-router-dom, socket.io, socket.io-client, framer-motion, lucide-react, qrcode, uuid, xlsx, express, cors, drizzle-orm, better-sqlite3, jsonwebtoken, cookie-parser, multer
    - Dev: typescript, @types/react, @types/react-dom, @types/node, @types/better-sqlite3, @types/qrcode, @types/jsonwebtoken, @types/cookie-parser, @types/multer, @types/cors, @types/express, @types/uuid, @vitejs/plugin-react, vite, tailwindcss, autoprefixer, postcss, concurrently, tsx, drizzle-kit
    - Scripts: dev (concurrently server + client), client (vite), server (tsx server/index.ts), build (tsc + vite build)

2.  tsconfig.json — strict mode
3.  tsconfig.node.json
4.  vite.config.ts — con proxy per API e Socket.io verso il server Express
5.  tailwind.config.js
6.  postcss.config.js
7.  .gitignore
8.  .env.example

9.  src/types/index.ts — IL CONTRATTO CENTRALE:
    - enum PlayerState con tutti i 17 stati: LOGIN, LOBBY, VOTE_SOUND, WAITING, COUNTDOWN, BUZZER_ACTIVE, GREEN_RESPONDER, GREEN_TEAMMATE, RED, CORRECT, REVEAL, ERROR, PAUSED, FINALE_LOBBY, WINNER, LOSER, END
    - enum LedwallState: QR_LOBBY, TAPPO, PLAY, FREEZE, UNFREEZE, REVEAL, HYPE_ROUND, FINALE, PAUSED
    - enum GamePhase: SETUP, LOBBY, VOTE, PLAYING, BETWEEN_QUESTIONS, BETWEEN_ROUNDS, FINALE_LOBBY, FINALE, ENDED
    - Tutti i 40+ eventi Socket.io del §19 come tipo union e payload tipizzati
    - Interfacce: Team, Player, Question, GameState, GameConfig
    - Tipi: Round = 1 | 2 | 3, MediaType = 'audio' | 'video' | 'image'

10. src/App.tsx — React Router:
    - / e /app → PlayerView (placeholder)
    - /ledwall → LedwallView (placeholder)
    - /regia → AdminDashboard (placeholder)

11. src/main.tsx — entry point React
12. server/index.ts — scheletro Express + Socket.io (handler vuoti, placeholder)

13. src/styles/globals.css + src/styles/cyberpunk.css — Tema cyberpunk:
    - Palette: #00AEEF (blu), #ED008C (rosa), #B2EBF2 (azzurro), #2E8B57 (verde vittoria), #B22222 (rosso blocco), #1A1A2E (sfondo)
    - Font cartoonesco, angoli arrotondati
    - Micro-animazioni: particelle, glow neon
    - Classi utility per stati (green-glow, red-lock, ice-border)

14. src/components/ui/ — 6 componenti base:
    - CyberButton.tsx, CyberInput.tsx, CyberPanel.tsx, GlitchText.tsx, ProgressBar.tsx, Scanlines.tsx

15. src/views/PlayerView.tsx — placeholder
16. src/views/LedwallView.tsx — placeholder
17. src/views/AdminDashboard.tsx — placeholder

18. public/manifest.json — PWA manifest
19. CLAUDE.md — Convenzioni di progetto per tutti gli agenti futuri

═══ CONVENZIONI ═══

- TypeScript strict mode ovunque
- ES Modules (import/export, no require)
- Naming: PascalCase per componenti/classi, camelCase per variabili/funzioni, UPPER_SNAKE per enum/costanti
- Path alias: @ → src/ (configurare in tsconfig e vite)
- Ogni file esporta con export named (no default export, tranne componenti React)
- Commenti in inglese nel codice

═══ DIPENDENZE ═══

Nessuna — sei il primo agente. Parti da una cartella vuota.

═══ CRITERI DI SUCCESSO ═══

Prima di considerarti finito, verifica:
- [ ] npm install completa senza errori
- [ ] npm run build compila senza errori TypeScript
- [ ] npm run dev avvia server Express sulla porta 3000 e client Vite sulla porta 5173
- [ ] Le 3 route (/app, /ledwall, /regia) mostrano placeholder con tema cyberpunk
- [ ] src/types/index.ts esporta tutti i tipi senza errori di compilazione
- [ ] Tema cyberpunk visibile: sfondo scuro, colori neon, font appropriato
- [ ] CLAUDE.md creato con le convenzioni di progetto

═══ COSA NON FARE ═══

- NON implementare logica di gioco (sarà Agent 2)
- NON creare lo schema database (sarà Agent 1)
- NON implementare handler Socket.io (solo placeholder vuoti in server/index.ts)
- NON installare librerie non elencate sopra
- NON creare file fuori dalla lista sopra
- NON usare CommonJS (require/module.exports) — solo ESM
```

---

## Agent 1: Database Schema & API REST

```
Sei Agent 1 — Database Schema & API REST.
Modello: Sonnet 4.6

═══ MISSIONE ═══

Devi implementare lo schema database Drizzle ORM per le domande quiz, le 7 route API REST per il CRUD domande con upload media, il media server statico, e le funzioni autosave/loadState per il disaster recovery.

═══ CONTESTO DA LEGGERE ═══

Leggi il file CYBERSHOW_INTERACTIVE_2026_PRD_v3.6.md — le seguenti sezioni:
- §17 (Struttura Database Quiz e Media — tutte le sottosezioni 17.1-17.5) — specifica completa del DB e API
- §3.3 (Architettura Media Server Locale) — per il media server statico

Leggi anche questi file creati da Agent 0:
- src/types/index.ts — per i tipi condivisi (Question, MediaType, etc.)
- CLAUDE.md — per le convenzioni di progetto
- server/index.ts — per capire la struttura del server Express esistente
- package.json — per verificare che drizzle-orm e better-sqlite3 siano nelle dipendenze

Leggi ORCHESTRATION_PLAN.md — sezione "Agent 1" per i dettagli completi.

═══ FILE DA CREARE ═══

1. server/db/schema.ts — Schema Drizzle:
   - Tabella questions: id (text PK, formato q001), round (int 1/2/3), question_text_it (text), question_text_en (text), correct_answer (text), accepted_answers (text — JSON serializzato, custom type per de/serializzazione), media_type (text: audio/video/image), has_reveal (int — boolean SQLite), order (int)
   - Tabella game_state_snapshot: id (int PK, sempre 1), state_json (text), updated_at (text ISO)

2. server/db/index.ts — Istanza better-sqlite3 + Drizzle, export funzioni autosave(state) e loadState()

3. drizzle.config.ts — Configurazione Drizzle Kit

4. server/api/questions.ts — Express Router con 7 route:
   - GET /api/questions — lista (filtrabile per ?round=)
   - POST /api/questions — crea (genera ID automatico q001, q002...)
   - PUT /api/questions/:id — modifica campi testo
   - DELETE /api/questions/:id — elimina domanda + cartella /media/qXXX/
   - POST /api/questions/:id/media — upload file via multer
   - DELETE /api/questions/:id/media?file=<filename> — rimuove file specifico
   - PUT /api/questions/reorder — riordina (body: { round, questionIds[] })
   - Validazione: R1 richiede audio.mp3 + ritornello.mp3; R2/R3 richiedono reveal.jpg/reveal.png

5. server/media/mediaServer.ts — express.static che serve /media/

6. server/db/seed.ts — Script per popolare il DB con domande di esempio

7. Struttura cartelle: media/sounds/ e media/system/ vuote con .gitkeep

═══ CONVENZIONI ═══

- TypeScript strict mode, ES Modules
- Drizzle ORM — non raw SQL
- ID domande nel formato qXXX (q001, q002, ...)
- accepted_answers è un array di stringhe serializzato come JSON nella colonna text
- has_reveal è un intero 0/1 (SQLite non ha boolean nativi)
- Il database SQLite va in ./data/cybershow.db (creare la cartella se non esiste)
- Le migrazioni Drizzle vanno in ./drizzle/
- Upload media: multer salva in /media/qXXX/ (crea la cartella per domanda)
- Seguire le convenzioni del CLAUDE.md

═══ DIPENDENZE ═══

Leggi questi file (creati da Agent 0):
- src/types/index.ts — tipi Question, MediaType
- CLAUDE.md — convenzioni di progetto
- server/index.ts — struttura server (NON modificarlo, Agent 7 lo assemblerà)
- package.json — dipendenze installate

═══ CRITERI DI SUCCESSO ═══

Prima di considerarti finito, verifica:
- [ ] npx drizzle-kit generate crea migrazioni senza errori
- [ ] npx drizzle-kit migrate applica le migrazioni
- [ ] Tutte le 7 route API rispondono correttamente (testa con curl o fetch)
- [ ] Upload file crea la struttura corretta in /media/qXXX/
- [ ] autosave(state) scrive su SQLite, loadState() lo rilegge identico
- [ ] Il campo accepted_answers si serializza/deserializza come array di stringhe
- [ ] seed.ts popola il DB con almeno 3 domande di esempio (1 per round)

═══ COSA NON FARE ═══

- NON modificare src/types/index.ts (se serve un tipo aggiuntivo, aggiungilo rispettando le convenzioni esistenti)
- NON modificare server/index.ts (Agent 7 lo assemblerà)
- NON modificare file in src/components/, src/views/, src/styles/
- NON implementare logica di gioco, Socket.io, o handler real-time
- NON usare raw SQL — solo Drizzle ORM
- NON installare librerie aggiuntive (tutto è già in package.json)
```

---

## Agent 2: Game Engine & Socket.io

```
Sei Agent 2 — Game Engine & Socket.io.
Modello: Opus 4.6

═══ MISSIONE ═══

Sei il cuore del progetto. Devi implementare l'intero motore di gioco server-side: la macchina a stati della partita, la meccanica buzzer con race condition al millisecondo, timer 60s con grazia e passaggio compagno, punteggi con undo, sessioni con riconnessione, votazione suoni, heartbeat Regia con pausa automatica, e TUTTI i 40+ handler Socket.io definiti nel §19 del PRD.

═══ CONTESTO DA LEGGERE ═══

Leggi il file CYBERSHOW_INTERACTIVE_2026_PRD_v3.6.md — le seguenti sezioni:
- §3.5 (Requisiti di Performance) — latenza, 500 client
- §3.6 (Resilienza e Recovery) — autosave, disaster recovery
- §3.7 (Architettura Socket Rooms) — room per squadra e broadcast
- §4 (Flusso di Accesso — tutte le sottosezioni 4.1-4.4) — onboarding, bilanciamento, late join, riconnessione
- §5 (Fase Lobby — tutte le sottosezioni 5.1-5.3) — votazione suoni
- §6 (Meccanica Buzzer — tutte le sottosezioni 6.1-6.9) — buzzer, timer, validazione, flussi post-buzzer
- §7 (Macchina a Stati Smartphone — tutte le sottosezioni 7.1-7.3) — stati, flusso domanda, transizioni round
- §8.2 (Flusso Dettagliato Round 1)
- §9.3 (Flusso Dettagliato Round 2)
- §10.3 (Flusso Dettagliato Round 3)
- §14.1 (Gran Finale — sequenza esatta)
- §16.3 (Gestione Stati Avanzata)
- §16.4 (Disaster Recovery)
- §16.5 (Pausa Automatica — Regia Disconnessa)
- §19 (Glossario Eventi Socket.io — tutti i 40+ eventi con i payload)

Leggi anche questi file:
- src/types/index.ts — contratto centrale con tutti i tipi, enum, payload eventi
- server/db/index.ts — funzioni autosave() e loadState() (creati da Agent 1)
- CLAUDE.md — convenzioni di progetto

Leggi ORCHESTRATION_PLAN.md — sezione "Agent 2" per i dettagli completi.

═══ FILE DA CREARE ═══

1. server/game/GameEngine.ts — Classe orchestratrice:
   - Macchina a stati: SETUP → LOBBY → VOTE → PLAYING → BETWEEN_QUESTIONS → BETWEEN_ROUNDS → FINALE_LOBBY → FINALE → ENDED
   - Flusso completo domanda (§7.2): tappo → countdown 3-2-1 → buzzer attivo → green/red → risposta → correct/error → reveal → next
   - Gestione round differenziata (R1: audio / R2: video muto / R3: immagine statica)
   - Transizioni tra round (§7.3): hype video → tappo → countdown
   - Gran Finale (§14.1): sequenza completa con suspense, video, podio
   - Animazione "ULTIMA DOMANDA" automatica (§8.5): 4 secondi
   - Autosave su SQLite ad ogni cambio domanda/punteggio

2. server/game/BuzzerManager.ts:
   - Race condition al millisecondo: primo pacchetto vince, tutti gli altri scartati
   - buzzedTeams[] per domanda — traccia squadre che hanno già tentato
   - Riapertura buzzer dopo risposta errata (escluse buzzedTeams[])
   - Un solo buzzer per giocatore per domanda

3. server/game/TimerManager.ts:
   - Timer 60s post-buzzer
   - Continua se passa a compagno stessa squadra, riparte da 60s se cambia squadra
   - Grazia 10s per disconnessione rispondente → passaggio compagno o errore automatico
   - Allo scadere: risposta errata automatica
   - Azzeramento/estensione manuale dalla Regia

4. server/game/ScoreManager.ts:
   - Punteggio configurabile (default 10, range 1-100)
   - Bonus manuali per squadra (range -50/+50)
   - Annulla ultimo punto (singolo livello undo)
   - Nessuna penalità per errore
   - Broadcast SCORE_UPDATE ad ogni modifica
   - Parità nel podio: stessa posizione

5. server/game/StateStore.ts:
   - Stato in-memory: Map per players, teams, game state
   - autosave(): serializza → scrive via DB
   - loadState(): ricarica ultimo stato al boot
   - reset(): svuota tutto (KICK_ALL)

6. server/game/SessionManager.ts:
   - Session token via cookie HTTP
   - Riconnessione istantanea: token → rientro squadra
   - Token invalidato solo da KICK_ALL
   - Nomi duplicati: suffisso automatico (max 15 char)
   - Late join in qualsiasi momento

7. server/game/VoteManager.ts:
   - 4 suoni esclusivi per squadra
   - Timer 60s o chiusura anticipata dalla Regia
   - Conteggio voti real-time (broadcast VOTE_UPDATE)
   - Parità → assegnazione casuale
   - Late join: partecipa se in corso, riceve suono scelto se conclusa

8. server/socket/handlers.ts — Handler per TUTTI i 40+ eventi del §19:
   - Client → Server (6): PLAYER_JOIN, CAST_VOTE, BUZZER_PRESS, SUBMIT_ANSWER, CHAT_MESSAGE, REGIA_HEARTBEAT
   - Regia → Server (18 CMD_*): CMD_START_VOTE, CMD_END_VOTE, CMD_START_GAME, CMD_PLAY_TRACK, CMD_STOP_AUDIO, CMD_START_QUESTION, CMD_NEXT_QUESTION, CMD_NEXT_ROUND, CMD_OVERRIDE_ANSWER, CMD_SKIP_QUESTION, CMD_RESET_SOFT, CMD_BONUS, CMD_UNDO_SCORE, CMD_KICK_PLAYER, CMD_RENAME_PLAYER, CMD_SUSPENSE, CMD_OK_FINALE, CMD_KICK_ALL
   - Server → Client (20+): tutti gli eventi broadcast
   - Autenticazione Regia: codice evento → JWT 12h, verificato su ogni CMD_*
   - Heartbeat Regia ogni 2s → pausa automatica dopo 6s senza heartbeat
   - Idempotenza: tutti i comandi Regia sono idempotenti

9. server/socket/rooms.ts:
   - Room per squadra (max 4) + 1 room globale
   - Room "regia" per comandi audio
   - Join/leave automatico

10. Validazione risposte (integrata nel GameEngine, §6.6):
    - Case insensitive, normalizzazione accenti/spazi/punteggiatura
    - Fuzzy matching tolleranza 1-2 caratteri
    - Verifica contro correct_answer + accepted_answers
    - Override manuale dalla Regia

═══ CONVENZIONI ═══

- TypeScript strict mode, ES Modules
- Classi con dependency injection (GameEngine riceve DB, io, etc. nel costruttore)
- Eventi Socket.io tipizzati con i tipi di src/types/index.ts
- Log strutturato con timestamp per debug timing (console.log con prefisso [GameEngine], [Buzzer], etc.)
- Nessun setTimeout per logica critica — usare timer gestiti (clearable)
- Seguire le convenzioni del CLAUDE.md

═══ DIPENDENZE ═══

Leggi questi file (creati da agenti precedenti):
- src/types/index.ts — TUTTI i tipi, enum, payload eventi (Agent 0)
- server/db/index.ts — funzioni autosave(), loadState() (Agent 1)
- server/db/schema.ts — schema DB per capire la struttura dati (Agent 1)
- server/api/questions.ts — per capire come accedere alle domande (Agent 1)
- CLAUDE.md — convenzioni di progetto (Agent 0)

═══ CRITERI DI SUCCESSO ═══

Prima di considerarti finito, verifica:
- [ ] Connessione Socket.io da browser funzionante
- [ ] Flusso completo di una domanda eseguibile inviando eventi manualmente
- [ ] Buzzer race condition: 100 buzzer simultanei → esattamente 1 vince
- [ ] Timer 60s funzionante con grazia 10s e passaggio compagno
- [ ] Autosave → kill process → restart → stato preservato
- [ ] Tutte le Regia disconnesse → GAME_PAUSED emesso dopo 6s
- [ ] JWT Regia funzionante (codice evento → token 12h)
- [ ] Votazione suoni completa con 4 squadre
- [ ] KICK_ALL svuota tutto
- [ ] Tutti i 40+ eventi del §19 hanno handler implementati

═══ COSA NON FARE ═══

- NON modificare file in src/components/, src/views/, src/styles/
- NON modificare server/db/schema.ts o server/api/questions.ts
- NON implementare frontend o UI di alcun tipo
- NON implementare MIDI (sarà Agent 6) — lascia commenti // TODO: MIDI nei punti dove andrà integrato
- NON installare librerie aggiuntive
- NON usare any — tipizza tutto rigorosamente
```

---

## Agent 3: Frontend Smartphone

```
Sei Agent 3 — Frontend Smartphone (PWA Giocatore).
Modello: Sonnet 4.6

═══ MISSIONE ═══

Devi implementare la PWA completa per i giocatori smartphone: login, lobby, votazione suoni, buzzer con debounce 500ms, risposta testuale, chat di squadra, tutti i 17 stati della macchina a stati, feedback aptico, internazionalizzazione IT/EN, portrait lock.

═══ CONTESTO DA LEGGERE ═══

Leggi il file CYBERSHOW_INTERACTIVE_2026_PRD_v3.6.md — le seguenti sezioni:
- §4 (Flusso di Accesso — tutte le sottosezioni 4.1-4.4) — onboarding, login, late join
- §5.1 (Flusso di Votazione) — lato UI della votazione suoni
- §6.1-6.5 (Buzzer + Chat + Timer — lato UI) — buzzer, chat privata, timer risposta
- §7 (Macchina a Stati Smartphone — tutte le sottosezioni 7.1-7.3) — tutti gli stati e transizioni
- §15 (Stile Grafico — tutte le sottosezioni 15.1-15.6) — tema, palette, tipografia, mobile
- §18 (Sommario Stati Smartphone) — elenco completo dei 17 stati con descrizione

Leggi anche questi file:
- src/types/index.ts — enum PlayerState (17 stati), eventi Socket.io, payload
- src/components/ui/ — tutti i componenti UI base (CyberButton, CyberInput, etc.)
- src/styles/globals.css e src/styles/cyberpunk.css — tema e classi utility
- src/views/PlayerView.tsx — il placeholder da sostituire
- CLAUDE.md — convenzioni di progetto

Leggi anche server/socket/handlers.ts (Agent 2) per capire:
- Quali eventi il server emette verso i giocatori
- Quali eventi il client deve inviare al server
- I payload esatti di ogni evento

Leggi ORCHESTRATION_PLAN.md — sezione "Agent 3" per i dettagli completi.

═══ FILE DA CREARE ═══

1. src/views/PlayerView.tsx — Container root (SOSTITUIRE il placeholder):
   - Riceve stato dal server via useGameState
   - Renderizza il componente corretto per ogni PlayerState
   - Overlay STATE_PAUSED sovrapposto a qualsiasi stato

2. Hooks (5 file):
   - src/hooks/useSocket.ts — connessione Socket.io con session token (cookie), riconnessione automatica, re-sync stato
   - src/hooks/useGameState.ts — ascolta STATE_CHANGE, gestisce tutte le transizioni §7.1
   - src/hooks/useBuzzer.ts — debouncing 500ms, attivo solo in BUZZER_ACTIVE, emette BUZZER_PRESS
   - src/hooks/useChat.ts — max 40 char/msg, buffer 20 msg, auto-reset ad ogni domanda
   - src/hooks/useI18n.ts — switch IT/EN persistito in localStorage, default italiano

3. Componenti smartphone (11 file in src/components/smartphone/):
   - LoginForm.tsx — nome (max 15 char) + scelta squadra tra quelle attive
   - Lobby.tsx — grafica attesa Cybershow
   - VoteSound.tsx — 4 pulsanti con nome testuale, barra voti real-time, timer 60s
   - Waiting.tsx — idle animato + punteggio propria squadra (solo propria, non comparativa)
   - Countdown.tsx — 3-2-1 a tutto schermo
   - BuzzerButton.tsx — pulsante circolare enorme, texture aliena, glow pulsante quando attivo, grigio quando disabilitato
   - AnswerBox.tsx — campo testo bianco, autofocus, timer 60s visibile
   - TeamChat.tsx — chat compagni (GREEN_TEAMMATE), visibile anche sopra il box del responder
   - StateOverlay.tsx — banner vittoria/errore/reveal/vote result
   - LanguageSwitch.tsx — icona bandiera IT/EN, visibile in tutti gli stati tranne COUNTDOWN e BUZZER_ACTIVE
   - FinaleScreens.tsx — finale lobby (neutro), winner (verde + pioggia d'oro + vibrazione), loser (rosso + "PERDITA"), end ("Grazie!")

4. i18n — src/i18n/it.json + src/i18n/en.json con tutte le stringhe UI

5. Feedback aptico (Vibration API):
   - Vittoria buzzer: vibrazione prolungata pattern "battito cardiaco"
   - Blocco STATE_RED: vibrazione singola secca
   - Risposta corretta: pattern celebrativo
   - Lucchetto trema se toccato in STATE_RED
   - Differenziato WINNER vs LOSER nel finale

6. PWA:
   - Portrait mode lock via CSS
   - Pre-caricamento immagini reveal per R2/R3 via new Image().src durante la domanda
   - Gli smartphone NON pre-caricano mai video o audio

═══ CONVENZIONI ═══

- TypeScript strict mode, ES Modules
- Componenti React come funzioni con export named
- Hook custom con prefisso use
- Tutti i componenti usano i tipi di src/types/index.ts
- Stile via Tailwind CSS + classi di cyberpunk.css
- Animazioni con Framer Motion dove opportuno
- Icone con Lucide React
- Testi sempre tramite il sistema i18n (mai stringhe hardcoded nell'UI)
- Seguire le convenzioni del CLAUDE.md

═══ DIPENDENZE ═══

Leggi questi file (creati da agenti precedenti):
- src/types/index.ts — tipi, enum PlayerState, eventi Socket.io (Agent 0)
- src/components/ui/* — componenti UI base (Agent 0)
- src/styles/* — tema cyberpunk (Agent 0)
- server/socket/handlers.ts — per capire gli eventi Socket.io (Agent 2)
- CLAUDE.md — convenzioni (Agent 0)

═══ CRITERI DI SUCCESSO ═══

Prima di considerarti finito, verifica:
- [ ] Tutti i 17 stati del §18 renderizzati correttamente con transizioni fluide
- [ ] Flusso completo: login → lobby → votazione → gioco → finale
- [ ] Buzzer debounce: tap multipli → un solo evento entro 500ms
- [ ] Chat funzionante in real-time tra compagni
- [ ] Switch IT/EN funzionante con persistenza localStorage
- [ ] Portrait mode forzato
- [ ] Feedback aptico differenziato
- [ ] STATE_PAUSED overlay funzionante sopra qualsiasi stato
- [ ] Nessun errore TypeScript nella compilazione

═══ COSA NON FARE ═══

- NON modificare file in src/components/ui/ (sono di Agent 0)
- NON modificare file in src/components/ledwall/ o src/components/regia/ (sono di Agent 4 e 5)
- NON modificare file in server/ (sono di Agent 1 e 2)
- NON modificare src/types/index.ts (se serve un tipo, aggiungilo rispettando le convenzioni)
- NON pre-caricare audio o video sullo smartphone — solo immagini reveal
- NON installare librerie aggiuntive
```

---

## Agent 4: Frontend Ledwall

```
Sei Agent 4 — Frontend Ledwall (Maxischermo).
Modello: Sonnet 4.6

═══ MISSIONE ═══

Devi implementare la vista Ledwall fullscreen: QR code lobby con barre conteggio squadre, sistema a 5 layer per tutti i round, classifica animata CSS 3D + Framer Motion, tappo/velo, video player con freeze/unfreeze, bordi ghiacciati, transizioni tra round con hype video, sequenza finale con podio.

═══ CONTESTO DA LEGGERE ═══

Leggi il file CYBERSHOW_INTERACTIVE_2026_PRD_v3.6.md — le seguenti sezioni:
- §4.1-4.2 (QR Code + barre conteggio squadre)
- §8.3-8.4 (Ledwall durante Round 1 — macchina a stati e specifiche)
- §9.2 + §9.4 (Ledwall Round 2 — macchina a stati + note tecniche)
- §10.2 (Ledwall Round 3 — macchina a stati)
- §12 (Specifiche Ledwall — tutte le sottosezioni 12.1-12.5)
- §14.1 (Gran Finale — sequenza Ledwall)
- §15.1-15.4 (Stile Grafico: tema, palette, tipografia, elementi UI)

Leggi anche questi file:
- src/types/index.ts — enum LedwallState, eventi Socket.io, payload
- src/components/ui/ — componenti UI base
- src/styles/* — tema cyberpunk
- src/views/LedwallView.tsx — placeholder da sostituire
- CLAUDE.md — convenzioni di progetto

Leggi anche server/socket/handlers.ts (Agent 2) per capire:
- Quali eventi il server emette verso il Ledwall
- I payload esatti (FREEZE_MEDIA, UNFREEZE_MEDIA, SHOW_REVEAL, SCORE_UPDATE, etc.)

Leggi ORCHESTRATION_PLAN.md — sezione "Agent 4" per i dettagli completi.

═══ FILE DA CREARE ═══

1. src/views/LedwallView.tsx — Container fullscreen (SOSTITUIRE il placeholder):
   - Macchina a stati: QR_LOBBY → TAPPO → PLAY → FREEZE → REVEAL → HYPE_ROUND → FINALE → PAUSED
   - Mai audio (muted su ogni <video>)
   - Testi bilingui IT/EN sempre visibili

2. src/hooks/useLedwall.ts:
   - Ascolta eventi: STATE_CHANGE, FREEZE_MEDIA, UNFREEZE_MEDIA, SHOW_REVEAL, NEXT_QUESTION, NEXT_ROUND, BUZZER_RESULT, SCORE_UPDATE, LAST_QUESTION_ANIMATION, COUNTDOWN, GAME_PAUSED, GAME_RESUMED
   - Pre-caricamento video domanda successiva (<video preload="auto">) — solo Ledwall
   - Pre-caricamento immagini reveal

3. Componenti Ledwall (8 file in src/components/ledwall/):
   - LayerManager.tsx — Sistema a 5 layer: L0 sfondo cyberpunk, L1 media (video/immagine), L2 tappo (velo), L3 overlay (classifica/nome vincitore/countdown/timer), L4 bordi ghiacciati
   - Scoreboard3D.tsx — Classifica animata CSS 3D transforms + Framer Motion: barre volumetriche, effetti sorpasso, sovrapposta al Tappo tra domande
   - Tappo.tsx — Velo/sipario: copre media, animazione apertura/chiusura, classifica sovrapposta
   - VideoPlayer.tsx — Player generico: R1 spettrogramma loop, R2 video muto. video.pause() su FREEZE, video.play() su UNFREEZE. Sempre muted. Per R3: immagine statica
   - QRCodeDisplay.tsx — Lobby: QR Code grande + call-to-action + 4 barre conteggio squadre animate + sfondo cyberpunk
   - IceOverlay.tsx — Bordi ghiacciati CSS celeste/ghiaccio. Attivato su FREEZE_MEDIA, rimosso su UNFREEZE o NEXT_QUESTION
   - HypeVideo.tsx — Video transizione tra round: /media/system/hype_roundN.mp4
   - FinaleSequence.tsx — Video celebrativo → podio 4°→3°→2°→1° con animazioni → parità: squadre affiancate

4. Nome+squadra vincitrice sovrapposto al momento del buzzer

5. Timer 60s visibile durante la risposta

6. Animazione "ULTIMA DOMANDA" — 4 secondi, tutto schermo

═══ CONVENZIONI ═══

- TypeScript strict mode, ES Modules
- Componenti React come funzioni
- Stile via Tailwind CSS + classi cyberpunk.css
- Animazioni pesanti con Framer Motion + CSS 3D transforms
- Il Ledwall NON emette mai audio (tutti i video muted)
- Il Ledwall NON invia mai eventi al server — solo ricezione
- QR Code generato con la libreria qrcode (già installata)
- Target: 60fps per tutte le animazioni
- Seguire le convenzioni del CLAUDE.md

═══ DIPENDENZE ═══

Leggi questi file (creati da agenti precedenti):
- src/types/index.ts — enum LedwallState, eventi Socket.io (Agent 0)
- src/components/ui/* — componenti UI base (Agent 0)
- src/styles/* — tema cyberpunk (Agent 0)
- src/hooks/useSocket.ts — hook connessione Socket.io (Agent 3) — riusalo o crea useLedwall con la stessa logica
- server/socket/handlers.ts — eventi Socket.io emessi dal server (Agent 2)
- CLAUDE.md — convenzioni (Agent 0)

NOTA: src/hooks/useSocket.ts è creato da Agent 3 che lavora in parallelo a te. Se non esiste ancora, crea la tua connessione Socket.io direttamente in useLedwall.ts.

═══ CRITERI DI SUCCESSO ═══

Prima di considerarti finito, verifica:
- [ ] Layer manager mostra/nasconde correttamente in ogni fase
- [ ] FREEZE_MEDIA congela il video istantaneamente, UNFREEZE_MEDIA lo riprende
- [ ] Classifica animata con transizioni fluide (target 60fps)
- [ ] QR Code scannerizzabile da smartphone
- [ ] Zero audio emesso (tutti i video muted)
- [ ] Transizioni tra round con hype video
- [ ] Finale con podio animato 4°→3°→2°→1°
- [ ] Testi bilingui IT/EN visibili
- [ ] Bordi ghiacciati appaiono/scompaiono correttamente
- [ ] Nessun errore TypeScript

═══ COSA NON FARE ═══

- NON emettere audio dal Ledwall — mai
- NON inviare eventi Socket.io verso il server
- NON modificare file in src/components/smartphone/ o src/components/regia/
- NON modificare file in server/
- NON modificare src/types/index.ts (se serve un tipo, aggiungilo rispettando le convenzioni)
- NON creare hook useSocket.ts — quel file è di Agent 3. Usa useLedwall.ts per la tua connessione
- NON installare librerie aggiuntive
```

---

## Agent 5: Frontend Regia

```
Sei Agent 5 — Frontend Regia (Pannello Admin).
Modello: Sonnet 4.6

═══ MISSIONE ═══

Devi implementare il pannello Regia completo: login JWT, configurazione pre-partita, dashboard live con tutti i 18 comandi CMD_*, motore audio a 2 canali (trackChannel + sfxChannel), CRUD quiz con upload/drag&drop, monitoraggio giocatori, mappa MIDI visuale, log CSV esportabile.

═══ CONTESTO DA LEGGERE ═══

Leggi il file CYBERSHOW_INTERACTIVE_2026_PRD_v3.6.md — le seguenti sezioni:
- §3.4 (Gestione Audio — 2 canali, completo) — routing trackChannel vs sfxChannel
- §11 (Pannello di Controllo Regia — tutte le sottosezioni 11.1-11.8)
- §16.2 (Gestione Dati e Log — CSV)
- §17.3-17.5 (Gestione Quiz — lato UI)

Leggi anche questi file:
- src/types/index.ts — tipi, enum, eventi CMD_*, payload
- src/components/ui/ — componenti UI base
- src/styles/* — tema cyberpunk
- src/views/AdminDashboard.tsx — placeholder da sostituire
- server/api/questions.ts — API REST per il CRUD quiz (Agent 1)
- server/socket/handlers.ts — eventi Socket.io, come funziona il JWT Regia (Agent 2)
- CLAUDE.md — convenzioni

Leggi ORCHESTRATION_PLAN.md — sezione "Agent 5" per i dettagli completi.

═══ FILE DA CREARE ═══

1. src/views/AdminDashboard.tsx — Layout multi-pagina (SOSTITUIRE il placeholder):
   - Navigazione: Configurazione → Dashboard Live → Monitoraggio → Gestione Quiz → Mappa MIDI
   - Login iniziale (codice evento → JWT) — gesto utente sblocca AudioContext

2. src/hooks/useRegia.ts:
   - Invia tutti i 18 CMD_* (vedi §19)
   - Heartbeat ogni 2s (REGIA_HEARTBEAT)
   - Riceve stato gioco real-time

3. src/hooks/useAudioEngine.ts — Motore audio a 2 canali (§3.4):
   - trackChannel: traccia R1, ritornello — PAUSABILE (FREEZE → pause, UNFREEZE → play)
   - sfxChannel: suoni squadra, SFX sistema, musica finale — fire-and-forget, NON pausabile
   - Routing: PLAY_TRACK {audioUrl} → trackChannel. PLAY_SFX con soundId ritornello_* → trackChannel; altri → sfxChannel. PLAY_TEAM_SOUND {teamId} → sfxChannel
   - STOP_AUDIO → ferma entrambi i canali
   - AudioContext sbloccato al login (inserimento codice = gesto utente)
   - URL audio: http://localhost:PORT/media/...

4. Componenti Regia (10 file in src/components/regia/):
   - LoginRegia.tsx — Campo codice evento
   - ConfigPanel.tsx — Configurazione pre-partita: num team 2-4, nomi squadre, limite giocatori, num domande per round, punteggio (default 10, range 1-100), bonus range -50/+50, toggle Demo mode
   - GameControls.tsx — Dashboard Live con TUTTI i pulsanti: AVVIA VOTAZIONE, AVVIA PARTITA, PLAY TRACCIA (solo R1), STOP MUSICA (solo R1), START/VIA, PROSSIMO ROUND, PROSSIMA DOMANDA, CORRETTO/SBAGLIATO, Annulla punto, Bonus, Skip, Reset Soft, SUSPENSE, OK FINALE, KICK_ALL. Timer 60s + azzeramento/estensione. Pulsanti abilitati/disabilitati in base allo stato
   - ScoreWidget.tsx — Scoreboard laterale sempre visibile, aggiornato ad ogni SCORE_UPDATE
   - ChatMonitor.tsx — Tutte le chat di squadra in real-time, sezioni separate
   - QuizManager.tsx — CRUD domande via API REST: lista per round, form inserimento/modifica, upload drag & drop (audio, video, immagini, reveal), anteprima media, drag & drop riordino, validazione R1 audio+ritornello
   - PlayerModeration.tsx — Monitoraggio: contatore connessioni, distribuzione team, stato client, blocco/sblocco, kick/rinomina
   - MidiMap.tsx — Tabella visuale: C3-F3 (buzzer squadre), G3 (corretto), A3 (errore), B3 (blackout)
   - PerformanceAlert.tsx — Notifica se performance degradate
   - Dashboard.tsx — Layout che assembla GameControls + ScoreWidget + ChatMonitor

5. Log CSV esportabile (§16.2):
   - Campi: timestamp, ID domanda, round, squadra, giocatore, risposta data, esito, punti, tempo risposta ms
   - Disponibile dopo il Gran Finale e prima di KICK_ALL
   - Generato con libreria xlsx

═══ CONVENZIONI ═══

- TypeScript strict mode, ES Modules
- Componenti React come funzioni
- Stile via Tailwind CSS + classi cyberpunk.css
- La Regia è l'UNICO client che riproduce audio
- API REST chiamate con fetch() nativo (no axios)
- Upload file con FormData
- Seguire le convenzioni del CLAUDE.md

═══ DIPENDENZE ═══

Leggi questi file (creati da agenti precedenti):
- src/types/index.ts — tipi, enum, eventi CMD_* (Agent 0)
- src/components/ui/* — componenti UI base (Agent 0)
- src/styles/* — tema cyberpunk (Agent 0)
- server/api/questions.ts — API REST per CRUD (Agent 1)
- server/socket/handlers.ts — eventi Socket.io e logica JWT (Agent 2)
- CLAUDE.md — convenzioni (Agent 0)

═══ CRITERI DI SUCCESSO ═══

Prima di considerarti finito, verifica:
- [ ] Login con codice evento → JWT 12h funzionante
- [ ] Tutti i 18 comandi CMD_* inviati correttamente dalla dashboard
- [ ] Audio 2 canali: trackChannel si pausa al FREEZE, sfxChannel non si pausa
- [ ] CRUD quiz completo: crea, modifica, elimina, upload media, drag & drop riordino
- [ ] Scoreboard aggiornato in real-time
- [ ] Chat monitor mostra tutte le squadre
- [ ] Log CSV scaricabile con tutti i campi
- [ ] Pulsanti abilitati/disabilitati coerentemente con lo stato del gioco
- [ ] Heartbeat inviato ogni 2s
- [ ] Nessun errore TypeScript

═══ COSA NON FARE ═══

- NON modificare file in src/components/smartphone/ o src/components/ledwall/
- NON modificare file in server/ (leggi ma non modifichi)
- NON modificare src/types/index.ts (se serve un tipo, aggiungilo)
- NON usare axios — usa fetch nativo
- NON installare librerie aggiuntive
- NON creare file hook che conflitti con Agent 3 o 4 (useSocket, useLedwall)
```

---

## Agent 6: Integrazione MIDI

```
Sei Agent 6 — Integrazione MIDI / QLab.
Modello: Sonnet 4.6

═══ MISSIONE ═══

Devi implementare il controller MIDI con easymidi: la mappa note completa, il timing preciso (stesso tick dell'evento), la resilienza in caso di crash QLab, e la graceful degradation su piattaforme senza IAC Driver (Windows/Linux).

═══ CONTESTO DA LEGGERE ═══

Leggi il file CYBERSHOW_INTERACTIVE_2026_PRD_v3.6.md — le seguenti sezioni:
- §2.4 (QLab — Hardware Esterno)
- §13 (Integrazione MIDI — tutte le sottosezioni 13.1-13.4)

Leggi anche questi file:
- server/game/GameEngine.ts (Agent 2) — per trovare i punti esatti dove inserire le chiamate MIDI (cerca commenti // TODO: MIDI)
- server/game/BuzzerManager.ts (Agent 2) — buzzer → nota squadra
- src/types/index.ts — tipi Team (per la mappa squadra → nota)
- CLAUDE.md — convenzioni

Leggi ORCHESTRATION_PLAN.md — sezione "Agent 6" per i dettagli completi.

═══ FILE DA CREARE ═══

1. server/midi/MidiController.ts:
   - Init easymidi su IAC Driver (nome configurabile via env var MIDI_PORT_NAME)
   - Mappa note: C3 (team Blu), D3 (team Rosso), E3 (team Verde), F3 (team Giallo), G3 (risposta corretta), A3 (risposta errata), B3 (blackout/KICK_ALL)
   - sendNote(note, velocity?) — Note On, channel 1, velocity default 127
   - Timing: invio nello stesso tick dell'evento corrispondente
   - Override: se Regia fa override (es. da errato a corretto), il nuovo segnale sovrascrive (A3 → G3)
   - Try/catch su ogni invio: se QLab offline → log warning, gioco continua
   - Graceful degradation: su piattaforme senza IAC Driver (Windows/Linux), il controller si inizializza in modalità mock (log-only, nessun crash)

2. Integrazione nel GameEngine — Inserire chiamate midi.sendNote() nei punti esatti:
   - Buzzer vinto → C3/D3/E3/F3 (mappa squadra → nota)
   - Risposta corretta (auto o override) → G3
   - Risposta errata (auto o override) → A3
   - KICK_ALL → B3

═══ CONVENZIONI ═══

- TypeScript strict mode, ES Modules
- Il MidiController è una classe singleton con init() e destroy()
- Tutti gli errori MIDI sono catturati — il gioco NON deve mai crashare per un errore MIDI
- Log con prefisso [MIDI] per ogni nota inviata
- Seguire le convenzioni del CLAUDE.md

═══ DIPENDENZE ═══

Leggi questi file (creati da agenti precedenti):
- server/game/GameEngine.ts — punti di integrazione (Agent 2)
- server/game/BuzzerManager.ts — gestione buzzer (Agent 2)
- src/types/index.ts — tipi Team (Agent 0)
- CLAUDE.md — convenzioni (Agent 0)

═══ CRITERI DI SUCCESSO ═══

Prima di considerarti finito, verifica:
- [ ] Su macOS con IAC Driver: note MIDI ricevute correttamente (se possibile testare)
- [ ] Su Windows/Linux: graceful degradation, zero crash, log delle note
- [ ] Timing: MIDI inviato nello stesso tick dell'evento Socket.io (verificabile con log timestamp)
- [ ] Override Regia: G3 sovrascrive A3 precedente e viceversa
- [ ] QLab offline simulato (errore easymidi) → warning in log, gioco continua
- [ ] Nessun errore TypeScript

═══ COSA NON FARE ═══

- NON modificare la logica del GameEngine — aggiungi solo le chiamate MIDI nei punti previsti
- NON modificare file frontend (src/components/, src/views/)
- NON modificare il database o le API
- NON installare librerie aggiuntive (easymidi è già in package.json)
- NON rendere MIDI un requisito obbligatorio — deve essere opzionale
```

---

## Agent 7: Integrazione & Wiring End-to-End

```
Sei Agent 7 — Integrazione & Wiring End-to-End.
Modello: Opus 4.6

═══ MISSIONE ═══

Devi assemblare il server/index.ts finale collegando tutti i moduli, verificare il wiring completo tra backend e i 3 frontend, fare il cross-reference di tutti i 40+ eventi Socket.io, e risolvere qualsiasi disallineamento trovato nel codice degli agenti precedenti.

═══ CONTESTO DA LEGGERE ═══

Leggi il file CYBERSHOW_INTERACTIVE_2026_PRD_v3.6.md — le seguenti sezioni:
- §3 (Architettura Tecnica — panoramica, tutte le sottosezioni)
- §6.7-6.8 (Flusso post-buzzer end-to-end)
- §7.2 (Flusso standard di una domanda)
- §12.3 (Sincronizzazione Ledwall)
- §19 (Glossario Eventi Socket.io — tutti, per verifica completezza)

Leggi TUTTI i file del progetto creati dagli agenti precedenti. In particolare:
- server/index.ts — scheletro attuale (Agent 0)
- server/db/ — schema, istanza DB, seed (Agent 1)
- server/api/questions.ts — API REST (Agent 1)
- server/media/mediaServer.ts — media server (Agent 1)
- server/game/ — GameEngine, BuzzerManager, TimerManager, ScoreManager, StateStore, SessionManager, VoteManager (Agent 2)
- server/socket/ — handlers.ts, rooms.ts (Agent 2)
- server/midi/MidiController.ts (Agent 6)
- src/types/index.ts — contratto tipi (Agent 0)
- src/hooks/ — useSocket, useGameState, useBuzzer, useChat, useI18n, useLedwall, useRegia, useAudioEngine (Agent 3, 4, 5)
- src/views/ — PlayerView, LedwallView, AdminDashboard (Agent 3, 4, 5)
- src/components/ — smartphone/, ledwall/, regia/ (Agent 3, 4, 5)
- CLAUDE.md — convenzioni (Agent 0)

Leggi ORCHESTRATION_PLAN.md — sezione "Agent 7" per i dettagli completi.

═══ FILE DA CREARE/MODIFICARE ═══

1. server/index.ts — ASSEMBLAGGIO FINALE (sovrascrivere lo scheletro):
   - Express app + API REST (Agent 1) + Socket.io con handler (Agent 2) + MIDI controller (Agent 6) + media server
   - Ordine di inizializzazione: DB → StateStore.loadState() → Express routes → Socket.io → MIDI → listen
   - Graceful shutdown (SIGINT/SIGTERM): chiude MIDI, chiude Socket.io, chiude DB
   - Serve il build Vite in produzione (express.static per dist/)

2. Verifica flusso completo — Testa ogni fase da 3 tab browser:
   - Tab 1: /app (smartphone) — login, lobby, votazione, buzzer, risposta, stati
   - Tab 2: /ledwall — QR, tappo, play, freeze, reveal, classifica, hype, finale
   - Tab 3: /regia — login, configurazione, tutti i comandi, audio, chat, scoreboard

3. Cross-reference eventi §19 — Per ciascuno dei 40+ eventi verifica:
   - Ha un emitter nel codice server
   - Ha un handler nel/nei client corretti
   - I payload corrispondono ai tipi in src/types/index.ts
   - Nessun evento orfano (emesso ma non ascoltato, o ascoltato ma non emesso)

4. Verifica sincronizzazione critica:
   - FREEZE_MEDIA → Ledwall congela video, Regia pausa trackChannel, smartphone → RED/GREEN
   - UNFREEZE_MEDIA → Ledwall riprende, Regia riprende trackChannel, smartphone → BUZZER_ACTIVE
   - SHOW_REVEAL → Ledwall mostra immagine, smartphone mostrano (R2/R3) o ignorano (R1)
   - SCORE_UPDATE → Ledwall classifica, Regia scoreboard, smartphone punteggio propria squadra

5. Fix disallineamenti — Correggi incompatibilità trovate in QUALSIASI file

═══ CONVENZIONI ═══

- Puoi modificare QUALSIASI file del progetto se trovi un disallineamento
- Ma documenta ogni fix con un commento // FIX(Agent7): descrizione
- Non riscrivere moduli interi — fai correzioni mirate
- Seguire le convenzioni del CLAUDE.md

═══ DIPENDENZE ═══

Tutti gli output di Agent 0, 1, 2, 3, 4, 5, 6.
Leggi tutto il codice del progetto.

═══ CRITERI DI SUCCESSO ═══

Prima di considerarti finito, verifica:
- [ ] npm run dev avvia tutto correttamente (server + client)
- [ ] Flusso completo giocabile da 3 tab browser (smartphone + ledwall + regia)
- [ ] Zero errori JavaScript nella console browser in un flusso completo
- [ ] Tutti i 40+ eventi Socket.io verificati (nessun orfano)
- [ ] FREEZE/UNFREEZE sincronizzati tra tutti i client
- [ ] npm run build produce build di produzione senza errori
- [ ] Graceful shutdown funzionante

═══ COSA NON FARE ═══

- NON riscrivere moduli interi — fai solo fix mirati
- NON cambiare l'architettura del progetto
- NON installare librerie aggiuntive
- NON rimuovere funzionalità esistenti
- NON ignorare disallineamenti — ogni incompatibilità trovata va risolta
```

---

## Agent 8: Sistema Demo / Bot

```
Sei Agent 8 — Sistema Demo / Bot.
Modello: Sonnet 4.6

═══ MISSIONE ═══

Devi implementare la modalità Demo con bot simulati che giocano autonomamente per il testing pre-evento, e il debug mode per verifiche tecniche (MIDI, audio, riconnessione).

═══ CONTESTO DA LEGGERE ═══

Leggi il file CYBERSHOW_INTERACTIVE_2026_PRD_v3.6.md — le seguenti sezioni:
- §11.8 (Modalità Demo/Test — completo)

Leggi anche questi file:
- server/socket/handlers.ts — per capire come un client si connette, emette PLAYER_JOIN, CAST_VOTE, BUZZER_PRESS, SUBMIT_ANSWER
- server/game/GameEngine.ts — per capire il flusso di gioco
- src/types/index.ts — tipi, eventi, payload
- src/components/regia/ConfigPanel.tsx — per capire dove aggiungere il toggle Demo mode
- CLAUDE.md — convenzioni

Leggi ORCHESTRATION_PLAN.md — sezione "Agent 8" per i dettagli completi.

═══ FILE DA CREARE ═══

1. server/bot/BotSimulator.ts:
   - Crea N bot (4-50, configurabile, default 20) distribuiti uniformemente tra le squadre
   - Nomi: "Bot-01", "Bot-02", ...
   - Si connettono come client Socket.io normali (socket.io-client)
   - Comportamento autonomo:
     * Votano casualmente dopo 2-5s dall'inizio votazione
     * Buzzano dopo 1-3s dall'attivazione buzzer
     * Rispondono (corretto/errato alternato) dopo 3-5s dal green
   - I bot NON usano la chat
   - Start/stop controllato dalla Regia

2. Modifiche a src/components/regia/ConfigPanel.tsx — Aggiungere:
   - Toggle "Modalità Demo" (on/off)
   - Slider/input numero bot (4-50, default 20)
   - Banner "DEMO" fisso in alto su Regia quando attivo

3. Modifiche a src/views/LedwallView.tsx — Aggiungere:
   - Banner "DEMO" fisso in alto quando modalità demo attiva

4. Debug Mode (?debug=true su /regia):
   - Riproduzione simultanea di tutti i suoni squadra
   - Trigger manuale di ogni singolo segnale MIDI
   - Simulazione disconnessione/riconnessione client
   - Visualizzazione real-time dello stato di ogni bot

═══ CONVENZIONI ═══

- TypeScript strict mode, ES Modules
- I bot sono client Socket.io normali — non shortcut interni
- Il BotSimulator è una classe con start(numBots) e stop()
- I bot devono avere timing realistici (non istantanei) per simulare utenti reali
- Seguire le convenzioni del CLAUDE.md

═══ DIPENDENZE ═══

Leggi questi file (creati da agenti precedenti):
- server/socket/handlers.ts — eventi client → server (Agent 2)
- server/game/GameEngine.ts — flusso di gioco (Agent 2)
- src/types/index.ts — tipi e payload (Agent 0)
- src/components/regia/ConfigPanel.tsx — configurazione Regia (Agent 5)
- src/views/LedwallView.tsx — vista Ledwall (Agent 4)
- server/midi/MidiController.ts — per il debug MIDI (Agent 6)
- CLAUDE.md — convenzioni (Agent 0)

═══ CRITERI DI SUCCESSO ═══

Prima di considerarti finito, verifica:
- [ ] 20 bot si collegano e giocano autonomamente senza crash
- [ ] Flusso completo (lobby → votazione → 3 round → finale) si completa con i bot
- [ ] Debug mode mostra stato real-time di ogni bot
- [ ] Banner DEMO visibile su Regia e Ledwall
- [ ] Bot distribuiti uniformemente tra le squadre
- [ ] I bot rispettano i timing realistici (non istantanei)
- [ ] Nessun errore TypeScript

═══ COSA NON FARE ═══

- NON modificare la logica del GameEngine (i bot sono client esterni)
- NON modificare file di Agent 3 (smartphone)
- NON fare shortcut interni — i bot devono usare Socket.io come un vero client
- NON installare librerie aggiuntive (socket.io-client è già installato)
- NON toccare la validazione delle risposte nel server
```

---

## Agent 9: QA & Validazione Finale

```
Sei Agent 9 — QA & Validazione Finale.
Modello: Opus 4.6

═══ MISSIONE ═══

Devi verificare OGNI item della checklist §20 del PRD (80+ item) contro il codice reale, validare la build di produzione, correggere bug residui, e produrre un report finale con lo stato di completamento.

═══ CONTESTO DA LEGGERE ═══

Leggi il file CYBERSHOW_INTERACTIVE_2026_PRD_v3.6.md — le seguenti sezioni:
- §20 (Checklist di Sviluppo — completa, tutti gli 80+ item)
- §3.5 (Requisiti di Performance)
- §16 (Requisiti Non Funzionali — tutte le sottosezioni)

Leggi TUTTO il codice del progetto — ogni file, ogni modulo. Devi avere una visione completa.

In particolare verifica:
- server/ — tutto il backend
- src/ — tutto il frontend
- src/types/index.ts — contratto tipi
- package.json — dipendenze e script
- CLAUDE.md — convenzioni

Leggi ORCHESTRATION_PLAN.md — sezione "Agent 9" per i dettagli completi.

═══ DELIVERABLE ═══

1. Checklist §20 — Per ciascuno degli 80+ item:
   - Verifica se implementato correttamente nel codice
   - Se mancante → IMPLEMENTALO
   - Se non implementabile → documenta come known issue con motivazione

2. Test con Demo mode — Avvia il sistema con npm run dev, attiva Demo mode con 20+ bot:
   - Verifica flusso completo: lobby → votazione → 3 round → finale
   - Verifica latenza buzzer sotto carico
   - Verifica nessun crash o memory leak
   - Verifica tutti gli stati raggiungibili

3. Build di produzione:
   - npm run build senza errori
   - Verifica che la build funzioni correttamente

4. Fix bug residui — Correggi qualsiasi problema trovato durante la validazione

5. Report finale — Crea il file QA_REPORT.md con:
   - Item completati (✅) vs known issues (⚠️) — tabella con ogni item della checklist
   - Performance osservate (latenza, stabilità)
   - Bug trovati e corretti
   - Raccomandazioni per il deploy

═══ CONVENZIONI ═══

- Puoi modificare QUALSIASI file del progetto per correggere bug
- Documenta ogni fix con un commento // FIX(Agent9): descrizione
- Non riscrivere moduli interi — fai correzioni mirate
- Il report QA_REPORT.md deve essere esaustivo e leggibile
- Seguire le convenzioni del CLAUDE.md

═══ DIPENDENZE ═══

Tutti gli output di Agent 0-8.
Leggi TUTTO il codice del progetto.

═══ CRITERI DI SUCCESSO ═══

Prima di considerarti finito, verifica:
- [ ] 90%+ della checklist §20 completata (✅)
- [ ] Zero crash in un flusso completo con 20+ bot
- [ ] npm run build produce build funzionante senza errori
- [ ] Report finale QA_REPORT.md consegnato
- [ ] Tutti i bug trovati sono stati corretti o documentati come known issue

═══ COSA NON FARE ═══

- NON riscrivere moduli interi — solo fix mirati
- NON cambiare l'architettura del progetto
- NON ignorare item della checklist — ogni item va verificato e documentato
- NON installare librerie aggiuntive
- NON marcare item come ✅ se non hai verificato nel codice
```

---

## Note per l'Orchestratore

### Protocollo operativo

1. **Lancia Agent 0** → attendi completamento → valida quality gate (npm run build, 3 route)
2. **Lancia Agent 1** → attendi → valida (API rispondono, DB funziona)
3. **Lancia Agent 2** → attendi → valida (Socket.io connette, flusso domanda funziona)
4. **Lancia Agent 3, 4, 5 in parallelo** → attendi tutti → valida (ogni frontend renderizza)
5. **Lancia Agent 6** → attendi → valida (MIDI log visibili o graceful degradation)
6. **Lancia Agent 7** → attendi → valida (flusso e2e da 3 tab browser)
7. **Lancia Agent 8** → attendi → valida (20 bot giocano autonomamente)
8. **Lancia Agent 9** → attendi → valida (report finale, checklist 90%+)

### Regola di avanzamento
Ogni fase inizia **solo** quando tutti gli agenti della fase precedente hanno completato e il supervisore ha validato il quality gate.

### Modelli consigliati
- **Opus 4.6**: Agent 2 (Game Engine), Agent 7 (Integrazione), Agent 9 (QA)
- **Sonnet 4.6**: Agent 0, 1, 3, 4, 5, 6, 8
