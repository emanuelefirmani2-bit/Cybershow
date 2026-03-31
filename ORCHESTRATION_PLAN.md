# CYBERSHOW 2026 — Piano di Orchestrazione Multi-Agentica

**Versione:** 1.0
**Data:** 2026-03-25
**PRD di riferimento:** `CYBERSHOW_INTERACTIVE_2026_PRD_v3.6.md`

> Il progetto parte da zero. Nessun codice esistente, nessuna dipendenza preinstallata. Ogni agente crea i suoi file da una cartella vuota.

---

## 1. OBIETTIVO

Costruire da zero l'intera piattaforma CyberShow Interactive 2026 descritta nel PRD v3.6: un quiz show real-time per 500+ giocatori simultanei con backend Node.js, 3 frontend React (smartphone, ledwall, regia), integrazione MIDI/QLab e persistenza SQLite.

### Criteri di Successo Globali

- Tutte le 20 sezioni del PRD implementate e funzionanti
- 500 connessioni WebSocket simultanee senza degrado
- Latenza buzzer < 100ms, latenza MIDI < 10ms
- Tutti i 40+ eventi Socket.io del §19 implementati
- Tutti gli 80+ item della Checklist §20 completati
- Demo mode funzionante end-to-end

---

## 2. PATTERN DI ORCHESTRAZIONE

**Pattern scelto: DAG (Directed Acyclic Graph) con supervisore gerarchico**

Perché questo pattern:
- I 3 frontend sono indipendenti tra loro → parallelizzabili (risparmio tempo)
- Il backend ha dipendenze sequenziali interne (schema DB → API → Game Engine)
- Ogni agente scrive solo nei propri file → zero conflitti di merge
- Un supervisore umano valida ogni fase prima di avanzare alla successiva

### Grafo delle Dipendenze

```
FASE 0 ─── [Agent 0: Setup Progetto]
               │
FASE 1 ─── [Agent 1: Database & API] ──→ [Agent 2: Game Engine]
                                              │
               ┌──────────────────────────────┼──────────────────────┐
               │                              │                      │
FASE 2 ─── [Agent 3: Smartphone]    [Agent 4: Ledwall]    [Agent 5: Regia]
               │                              │                      │
               └──────────────────────────────┼──────────────────────┘
                                              │
FASE 3 ─── [Agent 6: MIDI] ──→ [Agent 7: Integrazione & Wiring]
                                              │
FASE 4 ─── [Agent 8: Demo/Bot] ──→ [Agent 9: QA & Validazione Finale]
```

**Regola di avanzamento:** ogni fase inizia solo quando tutti gli agenti della fase precedente hanno completato e il supervisore ha validato il quality gate.

---

## 3. STRATEGIA DI CONTESTO

### Principio Cardine

Ogni agente riceve **solo** le sezioni del PRD rilevanti al suo task + i contratti di interfaccia (tipi TypeScript, eventi Socket.io). **Nessun agente riceve l'intero PRD.** Questo previene la saturazione della context window e lo spreco di token.

### Meccanismo di Condivisione

| Meccanismo | Scopo |
|---|---|
| `src/types/index.ts` | Contratto centrale — tipi, enum, interfacce, payload eventi. Scritto da Agent 0, letto da tutti |
| File ownership esclusiva | Ogni file ha UN solo agente proprietario. Nessun conflitto possibile |
| Output → Input | L'output di un agente (file generati) diventa input leggibile per gli agenti successivi |
| `CLAUDE.md` | Istruzioni e convenzioni di progetto, lette da tutti gli agenti |

### Cosa fornire a ciascun agente

Per ogni agente, l'orchestratore fornisce:
1. Le sezioni PRD indicate nel campo **"Sezioni PRD"** (copia-incolla letterale)
2. Il file `src/types/index.ts` aggiornato (il contratto)
3. Il `CLAUDE.md` con le convenzioni di progetto
4. L'elenco esatto dei file che deve creare
5. I criteri di successo specifici

L'orchestratore **non** fornisce mai l'intero PRD a nessun agente.

---

## 4. STACK TECNOLOGICO

Deciso dal PRD v3.6 (con le sostituzioni già applicate):

| Layer | Tecnologia |
|---|---|
| Runtime | Node.js (ES Modules) |
| Server Framework | Express |
| Real-Time | Socket.io |
| Frontend | React 19 + React Router 7 |
| Styling | Tailwind CSS 3 |
| Animazioni | Framer Motion + CSS 3D transforms |
| ORM | Drizzle ORM + better-sqlite3 |
| Build | Vite 6 |
| Linguaggio | TypeScript 5 (strict) |
| MIDI | easymidi (solo macOS, graceful degradation altrove) |
| QR Code | qrcode (npm) |
| Tunnel | Cloudflare Tunnel (cloudflared) — configurazione manuale, non parte del codice |
| Audio | Web Audio API nativa (`new Audio()`) — nessuna libreria |
| Icone | Lucide React |
| Export | xlsx (per CSV log) |

---

## 4b. ASSEGNAZIONE MODELLI IA PER AGENTE

> **Principio:** Opus 4.6 dove serve ragionamento complesso e visione cross-modulo. Sonnet 4.6 dove il task è ben specificato e segue pattern ripetitivi. Questo ottimizza il budget del piano Claude Max: Opus costa ~5× Sonnet in token, va usato solo dove il rischio di errore è alto e il costo di rework sarebbe peggiore.

| Agente | Modello | Motivazione |
|---|---|---|
| **Agent 0** — Setup Progetto | **Sonnet 4.6** | Boilerplate: config, package.json, tipi, stili. Task meccanico e ben definito |
| **Agent 1** — Database & API | **Sonnet 4.6** | Schema Drizzle + REST CRUD. Pattern standard, ben documentato |
| **Agent 2** — Game Engine | **Opus 4.6** | Il cuore del progetto. State machine complessa, race condition buzzer al ms, 40+ eventi Socket.io intrecciati, timer con grazia e passaggio compagno, disaster recovery. Serve ragionamento profondo e capacità di tenere in mente molte interazioni simultanee |
| **Agent 3** — Smartphone | **Sonnet 4.6** | 17 stati ma ciascuno è un componente React autonomo. Pattern ripetitivo (stato → componente) con specifiche chiare |
| **Agent 4** — Ledwall | **Sonnet 4.6** | Layer system + animazioni CSS/Framer Motion. Task visuale ben specificato |
| **Agent 5** — Regia | **Sonnet 4.6** | Tanti componenti ma ciascuno indipendente. L'audio engine a 2 canali è il pezzo più complesso ma le regole sono esplicite nel PRD |
| **Agent 6** — MIDI | **Sonnet 4.6** | Scope ridotto (~1 file), pattern semplice, integrazione diretta |
| **Agent 7** — Integrazione | **Opus 4.6** | Deve comprendere TUTTI i moduli scritti da agenti diversi, trovare disallineamenti di interfaccia, fare il wiring end-to-end. Richiede visione d'insieme e capacità di debug cross-modulo |
| **Agent 8** — Demo/Bot | **Sonnet 4.6** | Bot simulati con logica diretta e comportamento predefinito |
| **Agent 9** — QA | **Opus 4.6** | Cross-reference di 80+ item della checklist contro il codice reale. Serve attenzione ai dettagli, capacità di trovare bug sottili e disallineamenti rispetto al PRD |

**Riepilogo: 3 Opus (Agent 2, 7, 9) — 7 Sonnet (Agent 0, 1, 3, 4, 5, 6, 8)**

---

## 5. STRUTTURA DIRECTORY TARGET

Questa è la struttura che emergerà alla fine di tutte le fasi. Ogni file indica l'agente proprietario.

```
cybershow2026/
├── package.json                      [Agent 0]
├── tsconfig.json                     [Agent 0]
├── tsconfig.node.json                [Agent 0]
├── vite.config.ts                    [Agent 0]
├── drizzle.config.ts                 [Agent 1]
├── tailwind.config.js                [Agent 0]
├── postcss.config.js                 [Agent 0]
├── CLAUDE.md                         [Agent 0]
├── .env.example                      [Agent 0]
├── .gitignore                        [Agent 0]
│
├── server/
│   ├── index.ts                      [Agent 0 scheletro → Agent 7 assemblaggio finale]
│   ├── db/
│   │   ├── schema.ts                 [Agent 1]
│   │   ├── index.ts                  [Agent 1]
│   │   └── seed.ts                   [Agent 1]
│   ├── api/
│   │   └── questions.ts              [Agent 1]
│   ├── game/
│   │   ├── GameEngine.ts             [Agent 2]
│   │   ├── BuzzerManager.ts          [Agent 2]
│   │   ├── TimerManager.ts           [Agent 2]
│   │   ├── ScoreManager.ts           [Agent 2]
│   │   ├── StateStore.ts             [Agent 2]
│   │   ├── SessionManager.ts         [Agent 2]
│   │   └── VoteManager.ts            [Agent 2]
│   ├── socket/
│   │   ├── handlers.ts               [Agent 2]
│   │   └── rooms.ts                  [Agent 2]
│   ├── midi/
│   │   └── MidiController.ts         [Agent 6]
│   ├── bot/
│   │   └── BotSimulator.ts           [Agent 8]
│   └── media/
│       └── mediaServer.ts            [Agent 1]
│
├── src/
│   ├── main.tsx                      [Agent 0]
│   ├── App.tsx                       [Agent 0]
│   ├── types/
│   │   └── index.ts                  [Agent 0 — contratto centrale]
│   ├── i18n/
│   │   ├── it.json                   [Agent 3]
│   │   └── en.json                   [Agent 3]
│   ├── styles/
│   │   ├── globals.css               [Agent 0]
│   │   └── cyberpunk.css             [Agent 0]
│   ├── hooks/
│   │   ├── useSocket.ts              [Agent 3]
│   │   ├── useGameState.ts           [Agent 3]
│   │   ├── useBuzzer.ts              [Agent 3]
│   │   ├── useChat.ts                [Agent 3]
│   │   ├── useI18n.ts                [Agent 3]
│   │   ├── useLedwall.ts             [Agent 4]
│   │   ├── useRegia.ts               [Agent 5]
│   │   └── useAudioEngine.ts         [Agent 5]
│   ├── components/
│   │   ├── ui/                       [Agent 0]
│   │   │   ├── CyberButton.tsx
│   │   │   ├── CyberInput.tsx
│   │   │   ├── CyberPanel.tsx
│   │   │   ├── GlitchText.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── Scanlines.tsx
│   │   ├── smartphone/               [Agent 3]
│   │   │   ├── LoginForm.tsx
│   │   │   ├── Lobby.tsx
│   │   │   ├── VoteSound.tsx
│   │   │   ├── Waiting.tsx
│   │   │   ├── Countdown.tsx
│   │   │   ├── BuzzerButton.tsx
│   │   │   ├── AnswerBox.tsx
│   │   │   ├── TeamChat.tsx
│   │   │   ├── StateOverlay.tsx
│   │   │   ├── LanguageSwitch.tsx
│   │   │   └── FinaleScreens.tsx
│   │   ├── ledwall/                  [Agent 4]
│   │   │   ├── LayerManager.tsx
│   │   │   ├── Scoreboard3D.tsx
│   │   │   ├── Tappo.tsx
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── QRCodeDisplay.tsx
│   │   │   ├── IceOverlay.tsx
│   │   │   ├── HypeVideo.tsx
│   │   │   └── FinaleSequence.tsx
│   │   └── regia/                    [Agent 5]
│   │       ├── LoginRegia.tsx
│   │       ├── Dashboard.tsx
│   │       ├── GameControls.tsx
│   │       ├── ScoreWidget.tsx
│   │       ├── ChatMonitor.tsx
│   │       ├── QuizManager.tsx
│   │       ├── ConfigPanel.tsx
│   │       ├── MidiMap.tsx
│   │       ├── PlayerModeration.tsx
│   │       └── PerformanceAlert.tsx
│   └── views/
│       ├── PlayerView.tsx            [Agent 3]
│       ├── LedwallView.tsx           [Agent 4]
│       └── AdminDashboard.tsx        [Agent 5]
│
├── drizzle/                          [Agent 1 — migrazioni generate]
│
├── media/                            [Agent 1 — struttura cartelle vuota]
│   ├── sounds/
│   └── system/
│
└── public/
    ├── manifest.json                 [Agent 0]
    └── favicon.ico                   [Agent 0]
```

---

## 6. DEFINIZIONE AGENTI

---

### ═══════════ FASE 0 — Fondamenta ═══════════

---

### Agent 0: Setup Progetto & Infrastruttura

| Campo | Valore |
|---|---|
| **Modello** | **Sonnet 4.6** |
| **Ruolo** | Crea il progetto da zero: init, dipendenze, configurazioni, routing, tipi condivisi, tema grafico |
| **Missione** | Produrre un progetto TypeScript compilabile con Vite + Express, routing React funzionante sulle 3 route, tema cyberpunk applicato, e il contratto dei tipi condivisi che tutti gli agenti useranno come interfaccia |
| **Sezioni PRD** | §1 (visione), §3.1 (stack), §3.2 (architettura rete), §3.8 (PWA), §3.9 (sicurezza), §7.1 (stati — solo enum), §11.7 (route), §15.1-15.3 (tema grafico), §18 (sommario stati — solo enum), §19 (glossario eventi — solo definizioni tipo) |
| **Input** | Cartella vuota |
| **Output** | Progetto compilabile con `npm run build`, 3 route con placeholder |
| **Dipendenze** | Nessuna — è il primo agente |

**Deliverable:**

1. **`npm init`** + **`package.json`** con tutte le dipendenze:
   - Prod: `react`, `react-dom`, `react-router-dom`, `socket.io`, `socket.io-client`, `framer-motion`, `lucide-react`, `qrcode`, `uuid`, `xlsx`, `express`, `cors`, `drizzle-orm`, `better-sqlite3`, `jsonwebtoken`, `cookie-parser`, `multer`
   - Dev: `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `@types/better-sqlite3`, `@types/qrcode`, `@types/jsonwebtoken`, `@types/cookie-parser`, `@types/multer`, `@types/cors`, `@types/express`, `@types/uuid`, `@vitejs/plugin-react`, `vite`, `tailwindcss`, `autoprefixer`, `postcss`, `concurrently`, `tsx`, `drizzle-kit`
   - Scripts: `dev` (concurrently server + client), `client` (vite), `server` (tsx server/index.ts), `build` (tsc + vite build)

2. **Configurazioni**: `tsconfig.json` (strict), `tsconfig.node.json`, `vite.config.ts` (proxy API + Socket.io), `tailwind.config.js`, `postcss.config.js`, `.gitignore`, `.env.example`

3. **`src/types/index.ts`** — IL CONTRATTO CENTRALE — contiene:
   - `enum PlayerState` — tutti i 17 stati del §18 (LOGIN, LOBBY, VOTE_SOUND, WAITING, COUNTDOWN, BUZZER_ACTIVE, GREEN_RESPONDER, GREEN_TEAMMATE, RED, CORRECT, REVEAL, ERROR, PAUSED, FINALE_LOBBY, WINNER, LOSER, END)
   - `enum LedwallState` — (QR_LOBBY, TAPPO, PLAY, FREEZE, UNFREEZE, REVEAL, HYPE_ROUND, FINALE, PAUSED)
   - `enum GamePhase` — (SETUP, LOBBY, VOTE, PLAYING, BETWEEN_QUESTIONS, BETWEEN_ROUNDS, FINALE_LOBBY, FINALE, ENDED)
   - Tutti i 40+ eventi Socket.io del §19 come `type SocketEvent` union e payload tipizzati per ognuno
   - Interfacce dati: `Team`, `Player`, `Question`, `GameState`, `GameConfig`
   - Tipi per round: `Round = 1 | 2 | 3`, `MediaType = 'audio' | 'video' | 'image'`

4. **`src/App.tsx`** — React Router:
   - `/` e `/app` → `PlayerView` (placeholder)
   - `/ledwall` → `LedwallView` (placeholder)
   - `/regia` → `AdminDashboard` (placeholder)

5. **`src/main.tsx`** — entry point React

6. **`server/index.ts`** — scheletro Express + Socket.io (handler vuoti, placeholder per i moduli futuri)

7. **`src/styles/globals.css`** + **`src/styles/cyberpunk.css`** — Tema cyberpunk completo (§15):
   - Palette: blu elettrico #00AEEF, rosa shocking #ED008C, azzurro Tiffany #B2EBF2, verde vittoria #2E8B57, rosso blocco #B22222, sfondo scuro #1A1A2E
   - Font cartoonesco, angoli arrotondati (border-radius alto)
   - Micro-animazioni: particelle, stelle, glow neon
   - Classi utility per stati (green-glow, red-lock, ice-border, etc.)

8. **`src/components/ui/*`** — Componenti UI base riutilizzabili (CyberButton, CyberInput, CyberPanel, GlitchText, ProgressBar, Scanlines)

9. **`public/manifest.json`** — PWA manifest

10. **`CLAUDE.md`** — Convenzioni progetto per tutti gli agenti futuri

**Criteri di successo:**
- [ ] `npm install` completa senza errori
- [ ] `npm run build` compila senza errori TypeScript
- [ ] `npm run dev` avvia server Express e client Vite
- [ ] Le 3 route (`/app`, `/ledwall`, `/regia`) mostrano placeholder
- [ ] `src/types/index.ts` esporta tutti i tipi senza errori
- [ ] Tema cyberpunk visibile sui placeholder

---

### ═══════════ FASE 1 — Backend Core ═══════════

---

### Agent 1: Database Schema & API REST

| Campo | Valore |
|---|---|
| **Modello** | **Sonnet 4.6** |
| **Ruolo** | Schema database, migrazioni, API CRUD domande, media server |
| **Missione** | Implementare lo schema Drizzle per le domande quiz, le 7 route API REST per il CRUD domande con upload media, e l'endpoint statico `/media/` |
| **Sezioni PRD** | §17 (struttura DB e media — completo), §3.3 (media server) |
| **Input** | Tipi da `src/types/index.ts` (Agent 0), `CLAUDE.md` |
| **Output** | Database funzionante, API REST testabili con curl, cartella media strutturata |
| **Dipendenze** | Agent 0 completato |

**Deliverable:**

1. **`server/db/schema.ts`** — Schema Drizzle:
   - Tabella `questions`: `id` (text PK, formato q001), `round` (int 1/2/3), `question_text_it` (text), `question_text_en` (text), `correct_answer` (text), `accepted_answers` (text — JSON serializzato, custom type Drizzle per de/serializzazione), `media_type` (text: audio/video/image), `has_reveal` (int — boolean SQLite), `order` (int)
   - Tabella `game_state_snapshot`: `id` (int PK, sempre 1), `state_json` (text), `updated_at` (text ISO)

2. **`server/db/index.ts`** — Istanza `better-sqlite3` + Drizzle, export funzioni `autosave(state)` e `loadState()`

3. **`drizzle.config.ts`** — Configurazione Drizzle Kit

4. **`server/api/questions.ts`** — Express Router, tutte le route del §17.5:
   - `GET /api/questions` — lista (filtrabile per `?round=`)
   - `POST /api/questions` — crea (genera ID automatico q001, q002...)
   - `PUT /api/questions/:id` — modifica campi testo
   - `DELETE /api/questions/:id` — elimina domanda + cartella `/media/qXXX/`
   - `POST /api/questions/:id/media` — upload file via multer
   - `DELETE /api/questions/:id/media?file=<filename>` — rimuove file specifico
   - `PUT /api/questions/reorder` — riordina (body: `{ round, questionIds[] }`)
   - Validazione: R1 richiede `audio.mp3` + `ritornello.mp3`; R2/R3 richiedono `reveal.jpg`/`reveal.png`

5. **`server/media/mediaServer.ts`** — `express.static` che serve `/media/`

6. **`server/db/seed.ts`** — Script opzionale per popolare il DB con domande di esempio (utile per test)

7. **Struttura cartelle**: crea `/media/sounds/` e `/media/system/` vuote con `.gitkeep`

**Criteri di successo:**
- [ ] `npx drizzle-kit generate` crea migrazioni senza errori
- [ ] `npx drizzle-kit migrate` applica le migrazioni
- [ ] Tutte le 7 route API rispondono correttamente (test con curl)
- [ ] Upload file crea la struttura corretta in `/media/qXXX/`
- [ ] `autosave(state)` scrive su SQLite, `loadState()` lo rilegge identico
- [ ] Il campo `accepted_answers` si serializza/deserializza come array di stringhe

---

### Agent 2: Game Engine & Socket.io

| Campo | Valore |
|---|---|
| **Modello** | **Opus 4.6** |
| **Ruolo** | Logica di gioco server-side, macchina a stati, buzzer, timer, punteggi, sessioni, Socket.io |
| **Missione** | Implementare l'intero motore di gioco: state machine della partita, meccanica buzzer con race condition al ms, timer 60s con grazia, punteggi con undo, sessioni con riconnessione, votazione suoni, heartbeat Regia, pausa automatica, e tutti i 40+ handler Socket.io del §19 |
| **Sezioni PRD** | §3.5 (performance), §3.6 (resilienza), §3.7 (Socket Rooms), §4 (onboarding completo), §5 (lobby/votazione completo), §6 (meccanica buzzer — tutte le sottosezioni), §7 (macchina a stati completa), §8.2 (flusso R1), §9.3 (flusso R2), §10.3 (flusso R3), §14.1 (gran finale — sequenza esatta), §16.3-16.5 (stati avanzati, disaster recovery, pausa), §19 (glossario eventi — tutti i 40+) |
| **Input** | Tipi da `src/types/index.ts`, modulo DB da Agent 1 (`autosave`/`loadState`), `CLAUDE.md` |
| **Output** | Game Engine completo, tutti gli eventi Socket.io handler e emitter |
| **Dipendenze** | Agent 0 + Agent 1 completati |

**Deliverable:**

1. **`server/game/GameEngine.ts`** — Classe orchestratrice della partita:
   - Macchina a stati: `SETUP → LOBBY → VOTE → PLAYING → BETWEEN_QUESTIONS → BETWEEN_ROUNDS → FINALE_LOBBY → FINALE → ENDED`
   - Flusso completo di una domanda (§7.2): tappo → countdown 3-2-1 → buzzer attivo → green/red → risposta → correct/error → reveal → next
   - Gestione round differenziata (R1: traccia audio + spettrogramma / R2: video muto / R3: immagine statica)
   - Transizioni tra round (§7.3): hype video → tappo → countdown → prima domanda
   - Gran Finale (§14.1): STATE_FINALE_LOBBY → SUSPENSE → OK FINALE → STOP_AUDIO → video celebrativo → podio 4°→3°→2°→1° → WINNER/LOSER → END
   - Animazione "ULTIMA DOMANDA" automatica (§8.5): 4 secondi, disabilita START/VIA
   - Autosave su SQLite ad ogni cambio domanda/punteggio

2. **`server/game/BuzzerManager.ts`**:
   - Race condition al millisecondo (§6.2): primo pacchetto ricevuto vince, tutti gli altri scartati
   - `buzzedTeams[]` per domanda — traccia squadre che hanno già tentato
   - Riapertura buzzer dopo risposta errata (escluse squadre in `buzzedTeams[]`)
   - Un solo buzzer per giocatore per domanda (protezione server)
   - Emette: `BUZZER_RESULT`, `FREEZE_MEDIA`, `PLAY_TEAM_SOUND`, MIDI (C3-F3)

3. **`server/game/TimerManager.ts`**:
   - Timer 60s post-buzzer (§6.5)
   - Continua se passa a compagno della stessa squadra, riparte da 60s se cambia squadra
   - Grazia 10s per disconnessione rispondente → passaggio a compagno (sessione più vecchia) oppure risposta errata automatica
   - Allo scadere dei 60s: risposta errata automatica
   - Azzeramento/estensione manuale dalla Regia

4. **`server/game/ScoreManager.ts`**:
   - Punteggio configurabile per risposta corretta (default 10, range 1-100)
   - Bonus manuali per squadra (range -50/+50)
   - Annulla ultimo punto: singolo livello di undo, tiene traccia dell'ultima operazione
   - Nessuna penalità per risposta errata
   - Broadcast `SCORE_UPDATE` ad ogni modifica
   - Parità nel podio: squadre con stesso punteggio condividono la posizione

5. **`server/game/StateStore.ts`**:
   - Stato in-memory: `Map` per players, teams, game state
   - `autosave()`: serializza → scrive su tabella `game_state_snapshot` (chiama Agent 1 DB)
   - `loadState()`: al boot, ricarica ultimo stato (disaster recovery §16.4)
   - `reset()`: svuota tutto (chiamato da KICK_ALL)

6. **`server/game/SessionManager.ts`**:
   - Session token via cookie HTTP (§4.3)
   - Riconnessione istantanea: token → rientro nella squadra senza re-login
   - Token invalidato solo da KICK_ALL, nessuna scadenza temporale
   - Nomi duplicati: suffisso automatico (Marco 1, Marco 2) — max 15 caratteri
   - Late join: in qualsiasi momento, anche a partita in corso (§4.3)

7. **`server/game/VoteManager.ts`**:
   - Assegnazione 4 suoni esclusivi per squadra — nessun suono condiviso (§5.2)
   - Timer 60s votazione, o chiusura anticipata dalla Regia
   - Conteggio voti real-time per squadra (broadcast `VOTE_UPDATE`)
   - Parità → assegnazione casuale
   - Late join durante votazione: partecipa. Late join dopo: riceve suono già scelto

8. **`server/socket/handlers.ts`** — Handler per TUTTI i 40+ eventi del §19:
   - Client → Server (6): `PLAYER_JOIN`, `CAST_VOTE`, `BUZZER_PRESS`, `SUBMIT_ANSWER`, `CHAT_MESSAGE`, `REGIA_HEARTBEAT`
   - Regia → Server (18 `CMD_*`): `CMD_START_VOTE`, `CMD_END_VOTE`, `CMD_START_GAME`, `CMD_PLAY_TRACK`, `CMD_STOP_AUDIO`, `CMD_START_QUESTION`, `CMD_NEXT_QUESTION`, `CMD_NEXT_ROUND`, `CMD_OVERRIDE_ANSWER`, `CMD_SKIP_QUESTION`, `CMD_RESET_SOFT`, `CMD_BONUS`, `CMD_UNDO_SCORE`, `CMD_KICK_PLAYER`, `CMD_RENAME_PLAYER`, `CMD_SUSPENSE`, `CMD_OK_FINALE`, `CMD_KICK_ALL`
   - Server → Client (20+): tutti gli eventi di broadcast del §19
   - Autenticazione Regia: codice evento (env var) → JWT 12h, verificato su ogni `CMD_*`
   - Heartbeat Regia ogni 2s → pausa automatica dopo 6s senza heartbeat da nessuna istanza (§16.5)
   - Idempotenza: tutti i comandi Regia sono idempotenti (multi-tab safe)

9. **`server/socket/rooms.ts`**:
   - Room Socket.io per squadra (max 4) + 1 Room globale per broadcast
   - Room `regia` per i comandi audio (PLAY_TRACK, PLAY_SFX, etc.)
   - Join/leave automatico a connessione/disconnessione

10. **Validazione risposte** (integrata nel GameEngine, §6.6):
    - Case insensitive, normalizzazione accenti/spazi/punteggiatura
    - Fuzzy matching con tolleranza 1-2 caratteri
    - Verifica contro `correct_answer` + tutte le `accepted_answers`
    - Override manuale dalla Regia sempre disponibile

**Criteri di successo:**
- [ ] Connessione Socket.io da browser funzionante
- [ ] Flusso completo di una domanda eseguibile inviando eventi Socket.io manualmente
- [ ] Buzzer race condition: 100 buzzer simultanei → esattamente 1 vince
- [ ] Timer 60s funzionante con grazia 10s e passaggio a compagno
- [ ] Autosave → kill process → restart → stato preservato
- [ ] Tutte le Regia disconnesse → `GAME_PAUSED` emesso dopo 6s
- [ ] JWT Regia funzionante (codice evento → token 12h → comandi autenticati)
- [ ] Votazione suoni completa con 4 squadre
- [ ] KICK_ALL svuota tutto

---

### ═══════════ FASE 2 — Frontend (3 agenti in parallelo) ═══════════

> **I 3 agenti di questa fase lavorano in parallelo.** Ciascuno scrive SOLO nei propri file/directory. Comunicano con il backend esclusivamente tramite i tipi condivisi in `src/types/index.ts` e gli eventi Socket.io.

---

### Agent 3: Frontend Smartphone (PWA Giocatore)

| Campo | Valore |
|---|---|
| **Modello** | **Sonnet 4.6** |
| **Ruolo** | Interfaccia mobile per i 500+ giocatori |
| **Missione** | Implementare la PWA completa: login, lobby, votazione suoni, buzzer con debounce, risposta testuale, chat di squadra, tutti i 17 stati, feedback aptico, i18n IT/EN, portrait lock |
| **Sezioni PRD** | §4 (onboarding completo), §5.1 (votazione — lato UI), §6.1-6.5 (buzzer + chat + timer — lato UI), §7 (macchina a stati completa), §15 (stile grafico completo), §18 (sommario stati — tutti i 17) |
| **Input** | Tipi da `src/types/index.ts`, componenti UI da `src/components/ui/`, stili da `src/styles/`, `CLAUDE.md` |
| **Output** | PWA completa e funzionante su smartphone |
| **Dipendenze** | Agent 0 + Agent 2 completati |

**Deliverable:**

1. **`src/views/PlayerView.tsx`** — Container root:
   - Riceve stato dal server via `useGameState`
   - Renderizza il componente corretto per ogni `PlayerState`
   - Overlay `STATE_PAUSED` sovrapposto a qualsiasi stato (§16.5)

2. **Hooks** (5 file):
   - `useSocket.ts` — connessione Socket.io con session token (cookie), riconnessione automatica, re-sync stato
   - `useGameState.ts` — ascolta `STATE_CHANGE`, gestisce tutte le transizioni §7.1
   - `useBuzzer.ts` — debouncing 500ms, attivo solo in BUZZER_ACTIVE, emette `BUZZER_PRESS`
   - `useChat.ts` — max 40 char/msg, buffer 20 msg, auto-reset ad ogni domanda
   - `useI18n.ts` — switch IT/EN persistito in `localStorage`, default italiano

3. **Componenti smartphone** (11 file) — uno per stato/funzione:
   - `LoginForm.tsx` — nome (max 15 char) + scelta squadra tra quelle attive (§4.1)
   - `Lobby.tsx` — grafica attesa Cybershow
   - `VoteSound.tsx` — 4 pulsanti (nome testuale), barra voti real-time, timer 60s
   - `Waiting.tsx` — idle animato + punteggio propria squadra (solo propria, non comparativa)
   - `Countdown.tsx` — 3-2-1 a tutto schermo
   - `BuzzerButton.tsx` — pulsante circolare enorme, texture aliena, glow pulsante quando attivo, grigio quando disabilitato (§15.4)
   - `AnswerBox.tsx` — campo testo bianco, autofocus, timer 60s visibile
   - `TeamChat.tsx` — chat compagni (STATE_GREEN_TEAMMATE) visibile anche sopra il box del responder
   - `StateOverlay.tsx` — banner vittoria/errore/reveal (R2/R3)/vote result
   - `LanguageSwitch.tsx` — icona bandiera IT/EN, visibile in tutti gli stati tranne COUNTDOWN e BUZZER_ACTIVE (§15.5)
   - `FinaleScreens.tsx` — finale lobby (neutro), winner (verde + pioggia d'oro + vibrazione battito), loser (rosso + "PERDITA"), end ("Grazie per aver partecipato!")

4. **i18n** — `src/i18n/it.json` + `src/i18n/en.json` con tutte le stringhe UI

5. **Feedback aptico** (Vibration API §15.4):
   - Vittoria buzzer: vibrazione prolungata pattern "battito cardiaco"
   - Blocco STATE_RED: vibrazione singola secca
   - Risposta corretta: pattern celebrativo
   - Lucchetto trema se toccato in STATE_RED
   - Differenziato WINNER vs LOSER nel finale

6. **PWA** (§3.8):
   - Portrait mode lock via CSS (§15.6)
   - Pre-caricamento immagini reveal per R2/R3 via `new Image().src` durante la domanda
   - Gli smartphone NON pre-caricano mai video o audio

**Criteri di successo:**
- [ ] Tutti i 17 stati del §18 renderizzati correttamente con transizioni fluide
- [ ] Flusso completo: login → lobby → votazione → gioco → finale
- [ ] Buzzer debounce: tap multipli → un solo evento entro 500ms
- [ ] Chat funzionante in real-time tra compagni
- [ ] Switch IT/EN funzionante con persistenza localStorage
- [ ] Portrait mode forzato
- [ ] Feedback aptico differenziato (verificabile su device reale)
- [ ] STATE_PAUSED overlay funzionante sopra qualsiasi stato

---

### Agent 4: Frontend Ledwall (Maxischermo)

| Campo | Valore |
|---|---|
| **Modello** | **Sonnet 4.6** |
| **Ruolo** | Interfaccia fullscreen per il secondo monitor (proiezione) |
| **Missione** | Implementare la vista Ledwall: QR code lobby con barre conteggio, sistema a layer per tutti i round, classifica animata CSS 3D + Framer Motion, tappo/velo, video player con freeze/unfreeze, bordi ghiacciati, transizioni tra round, sequenza finale con podio |
| **Sezioni PRD** | §4.1-4.2 (QR code + barre conteggio), §8.3-8.4 (Ledwall R1), §9.2+9.4 (Ledwall R2), §10.2 (Ledwall R3), §12 (specifiche Ledwall — tutte le sottosezioni), §14.1 (finale Ledwall), §15.1-15.4 (stile grafico) |
| **Input** | Tipi da `src/types/index.ts`, componenti UI da `src/components/ui/`, stili da `src/styles/`, `CLAUDE.md` |
| **Output** | Vista Ledwall completa e funzionante in fullscreen |
| **Dipendenze** | Agent 0 + Agent 2 completati |

**Deliverable:**

1. **`src/views/LedwallView.tsx`** — Container fullscreen:
   - Macchina a stati Ledwall: QR_LOBBY → TAPPO → PLAY → FREEZE → REVEAL → HYPE_ROUND → FINALE → PAUSED
   - Mai audio (`muted` su ogni `<video>`)
   - Testi bilingui IT/EN sempre visibili (§15.5)

2. **`src/hooks/useLedwall.ts`**:
   - Ascolta eventi Socket.io: STATE_CHANGE, FREEZE_MEDIA, UNFREEZE_MEDIA, SHOW_REVEAL, NEXT_QUESTION, NEXT_ROUND, BUZZER_RESULT, SCORE_UPDATE, LAST_QUESTION_ANIMATION, COUNTDOWN, GAME_PAUSED, GAME_RESUMED
   - Pre-caricamento video domanda successiva (`<video preload="auto">`) — solo Ledwall
   - Pre-caricamento immagini reveal (tutti i round, incluso R1 se esiste)

3. **Componenti Ledwall** (8 file):
   - `LayerManager.tsx` — Sistema a 5 layer (§9.4): L0 sfondo cyberpunk, L1 media (video/immagine), L2 tappo (velo), L3 overlay (classifica/nome vincitore/countdown/timer), L4 bordi ghiacciati
   - `Scoreboard3D.tsx` — Classifica animata con CSS 3D transforms + Framer Motion: barre volumetriche per squadra, effetti di sorpasso, sovrapposta al Tappo tra le domande (§12.2)
   - `Tappo.tsx` — Velo/sipario: copre il media sottostante, animazione apertura/chiusura, classifica sovrapposta
   - `VideoPlayer.tsx` — Player generico: R1 spectrogram_loop.mp4 in loop, R2 video muto. `video.pause()` su FREEZE_MEDIA, `video.play()` su UNFREEZE_MEDIA. Sempre `muted`. Per R3: mostra immagine statica (nessun video)
   - `QRCodeDisplay.tsx` — Schermata lobby: QR Code grande + call-to-action + 4 barre conteggio squadre animate + sfondo cyberpunk. Scompare quando Regia preme AVVIA PARTITA (§12.1)
   - `IceOverlay.tsx` — Bordi ghiacciati CSS celeste/ghiaccio. Attivato su FREEZE_MEDIA, rimosso su UNFREEZE_MEDIA o NEXT_QUESTION (§15.4)
   - `HypeVideo.tsx` — Video transizione tra round: riproduce `/media/system/hype_roundN.mp4` (§12.4)
   - `FinaleSequence.tsx` — Video celebrativo epico → podio 4°→3°→2°→1° con animazioni → parità: squadre affiancate (§12.5)

4. **Nome+squadra vincitrice** — Sovrapposto al momento del buzzer in tutti i round

5. **Timer 60s** — Visibile sul Ledwall durante la risposta

6. **Animazione "ULTIMA DOMANDA"** — 4 secondi, a tutto schermo (§8.5)

**Criteri di successo:**
- [ ] Layer manager mostra/nasconde correttamente in ogni fase
- [ ] FREEZE_MEDIA congela il video istantaneamente, UNFREEZE_MEDIA lo riprende
- [ ] Classifica animata con transizioni fluide (target 60fps)
- [ ] QR Code scannerizzabile da smartphone
- [ ] Zero audio emesso (tutti i video muted)
- [ ] Transizioni tra round con hype video
- [ ] Finale con podio animato 4°→3°→2°→1°
- [ ] Testi bilingui visibili
- [ ] Bordi ghiacciati appaiono/scompaiono correttamente

---

### Agent 5: Frontend Regia (Pannello Admin)

| Campo | Valore |
|---|---|
| **Modello** | **Sonnet 4.6** |
| **Ruolo** | Dashboard command center per l'animatore |
| **Missione** | Implementare il pannello Regia completo: login JWT, configurazione pre-partita, dashboard live con tutti i 18 comandi, motore audio a 2 canali, CRUD quiz con upload/drag&drop, monitoraggio giocatori, mappa MIDI, log CSV esportabile |
| **Sezioni PRD** | §3.4 (gestione audio — 2 canali completo), §11 (pannello Regia — tutte le sottosezioni), §16.2 (log CSV), §17.3-17.5 (gestione quiz — lato UI) |
| **Input** | Tipi da `src/types/index.ts`, API REST da Agent 1, componenti UI da `src/components/ui/`, stili da `src/styles/`, `CLAUDE.md` |
| **Output** | Dashboard Regia completa e funzionante |
| **Dipendenze** | Agent 0 + Agent 1 + Agent 2 completati |

**Deliverable:**

1. **`src/views/AdminDashboard.tsx`** — Layout multi-pagina:
   - Navigazione: Configurazione → Dashboard Live → Monitoraggio → Gestione Quiz → Mappa MIDI
   - Login iniziale (codice evento → JWT) — gesto utente sblocca AudioContext

2. **`src/hooks/useRegia.ts`**:
   - Invia tutti i 18 `CMD_*` (§19)
   - Heartbeat ogni 2s (`REGIA_HEARTBEAT`)
   - Riceve stato gioco real-time

3. **`src/hooks/useAudioEngine.ts`** — Motore audio a 2 canali (§3.4):
   - `trackChannel`: traccia R1, ritornello — PAUSABILE (FREEZE → pause, UNFREEZE → play)
   - `sfxChannel`: suoni squadra, SFX sistema, musica finale — fire-and-forget, NON pausabile
   - Routing: `PLAY_TRACK { audioUrl }` → trackChannel. `PLAY_SFX` con soundId `ritornello_*` → trackChannel; altri soundId → sfxChannel. `PLAY_TEAM_SOUND { teamId }` → sfxChannel
   - `STOP_AUDIO` → ferma entrambi i canali
   - AudioContext sbloccato al login (inserimento codice = gesto utente)
   - Tutte le URL audio: `http://localhost:PORT/media/...`

4. **Componenti Regia** (10 file):
   - `LoginRegia.tsx` — Campo codice evento (§11.1)
   - `ConfigPanel.tsx` — Configurazione pre-partita (§11.2): num team 2-4, nomi squadre, limite giocatori, num domande per round, punteggio (default 10, range 1-100), bonus range -50/+50, toggle Demo mode
   - `GameControls.tsx` — Dashboard Live (§11.3) con TUTTI i pulsanti: AVVIA VOTAZIONE, AVVIA PARTITA, PLAY TRACCIA (solo R1), STOP MUSICA (solo R1), START (R1)/VIA (R2/R3), PROSSIMO ROUND, PROSSIMA DOMANDA, CORRETTO/SBAGLIATO, Annulla ultimo punto, Bonus manuali, Skip, Reset Soft, SUSPENSE, OK FINALE, KICK_ALL. Timer 60s visibile + azzeramento/estensione. Pulsanti abilitati/disabilitati in base allo stato corrente
   - `ScoreWidget.tsx` — Scoreboard laterale sempre visibile, aggiornato ad ogni SCORE_UPDATE, evidenzia squadra in testa
   - `ChatMonitor.tsx` — Tutte le chat di squadra in real-time, sezioni separate per squadra
   - `QuizManager.tsx` — CRUD domande via API REST: lista per round, form inserimento/modifica, upload drag & drop (audio, video, immagini, reveal), anteprima media, drag & drop riordino domande, validazione R1 audio+ritornello
   - `PlayerModeration.tsx` — Monitoraggio (§11.4): contatore connessioni, distribuzione team, stato client, blocco/sblocco squadre, kick/rinomina utenti
   - `MidiMap.tsx` — Tabella visuale: C3-F3 (buzzer squadre), G3 (corretto), A3 (errore), B3 (blackout)
   - `PerformanceAlert.tsx` — Notifica se performance degradate
   - `Dashboard.tsx` — Layout che assembla GameControls + ScoreWidget + ChatMonitor

5. **Log CSV esportabile** (§16.2):
   - Scaricabile con: timestamp, ID domanda, round, squadra, giocatore, risposta data, esito (corretto/errato/skip/interrotta), punti assegnati, tempo di risposta in ms
   - Disponibile dopo il Gran Finale e prima del KICK_ALL
   - Generato con libreria `xlsx`

**Criteri di successo:**
- [ ] Login con codice evento → JWT 12h funzionante
- [ ] Tutti i 18 comandi CMD_* inviati correttamente dalla dashboard
- [ ] Audio a 2 canali: trackChannel si pausa al FREEZE, sfxChannel non si pausa
- [ ] CRUD quiz completo: crea, modifica, elimina, upload media, drag & drop riordino
- [ ] Scoreboard aggiornato in real-time
- [ ] Chat monitor mostra tutte le squadre simultaneamente
- [ ] Log CSV scaricabile con tutti i campi richiesti
- [ ] Pulsanti abilitati/disabilitati coerentemente con lo stato del gioco

---

### ═══════════ FASE 3 — Integrazioni ═══════════

---

### Agent 6: Integrazione MIDI / QLab

| Campo | Valore |
|---|---|
| **Modello** | **Sonnet 4.6** |
| **Ruolo** | Comunicazione MIDI tra Node.js e QLab |
| **Missione** | Implementare il controller MIDI con `easymidi`, la mappa note completa, il timing preciso (stesso tick dell'evento), e la resilienza in caso di crash QLab o piattaforma non-macOS |
| **Sezioni PRD** | §2.4 (QLab), §13 (integrazione MIDI — tutte le sottosezioni) |
| **Input** | Game Engine (Agent 2) — i punti del codice dove inserire le chiamate MIDI |
| **Output** | Controller MIDI integrato nel Game Engine |
| **Dipendenze** | Agent 2 completato |

**Deliverable:**

1. **`server/midi/MidiController.ts`**:
   - Init `easymidi` su IAC Driver (nome configurabile via env var)
   - Mappa note (§13.2): C3 (Blu), D3 (Rosso), E3 (Verde), F3 (Giallo), G3 (corretto), A3 (errore), B3 (blackout)
   - `sendNote(note, velocity?)` — Note On
   - Timing: inviato nello stesso tick dell'evento corrispondente (§13.4)
   - Override: se la Regia fa override, il nuovo segnale sovrascrive il precedente (es. A3→G3)
   - Try/catch su ogni invio: se QLab offline → log warning, gioco continua (§13.3)
   - **Graceful degradation**: su piattaforme senza IAC Driver (Windows/Linux), il controller si inizializza in modalità mock (log-only, nessun crash)

2. **Integrazione nel GameEngine** — Inserire chiamate `midi.sendNote()` nei punti esatti:
   - Buzzer vinto → C3/D3/E3/F3 (mappa squadra → nota)
   - Risposta corretta (auto o override) → G3
   - Risposta errata (auto o override) → A3
   - KICK_ALL → B3

**Criteri di successo:**
- [ ] Su macOS con IAC Driver: note MIDI ricevute correttamente
- [ ] Su Windows/Linux: graceful degradation, zero crash, log delle note
- [ ] Timing: MIDI inviato nello stesso tick dell'evento Socket.io (verificabile con log timestamp)
- [ ] Override Regia: G3 sovrascrive A3 precedente e viceversa
- [ ] QLab offline simulato → warning in log, gioco continua senza interruzioni

---

### Agent 7: Integrazione & Wiring End-to-End

| Campo | Valore |
|---|---|
| **Modello** | **Opus 4.6** |
| **Ruolo** | Collegamento finale tra tutti i moduli, assemblaggio server, verifica end-to-end |
| **Missione** | Assemblare il `server/index.ts` finale, verificare il wiring completo tra backend e tutti e 3 i frontend, cross-reference di tutti i 40+ eventi Socket.io, risolvere disallineamenti |
| **Sezioni PRD** | §3 (architettura — panoramica), §6.7-6.8 (flusso post-buzzer e2e), §7.2 (flusso standard domanda), §12.3 (sincronizzazione), §19 (tutti gli eventi — verifica completezza) |
| **Input** | TUTTI gli output di Agent 0-6 |
| **Output** | Sistema integrato e funzionante end-to-end |
| **Dipendenze** | Agent 2 + Agent 3 + Agent 4 + Agent 5 + Agent 6 tutti completati |

**Deliverable:**

1. **`server/index.ts` assemblaggio finale**:
   - Express app + API REST (Agent 1) + Socket.io con handler (Agent 2) + MIDI controller (Agent 6) + media server
   - Ordine di inizializzazione: DB → StateStore.loadState() → Express routes → Socket.io → MIDI → listen
   - Graceful shutdown (SIGINT/SIGTERM)

2. **Verifica flusso completo** — Testare ogni fase manualmente da 3 tab browser:
   - Tab 1: `/app` (smartphone) — login, lobby, votazione, buzzer, risposta, stati
   - Tab 2: `/ledwall` — QR, tappo, play, freeze, reveal, classifica, hype, finale
   - Tab 3: `/regia` — login, configurazione, tutti i comandi, audio, chat, scoreboard

3. **Cross-reference eventi §19** — Per ciascuno dei 40+ eventi verificare:
   - Ha un emitter nel codice
   - Ha un handler nel/nei client corretto/i
   - I payload corrispondono ai tipi in `src/types/index.ts`
   - Nessun evento orfano

4. **Verifica sincronizzazione critica**:
   - FREEZE_MEDIA → Ledwall congela video, Regia pausa trackChannel, smartphone → STATE_RED/GREEN
   - UNFREEZE_MEDIA → Ledwall riprende, Regia riprende trackChannel, smartphone → BUZZER_ACTIVE (per squadre rimanenti)
   - SHOW_REVEAL → Ledwall mostra immagine, smartphone mostrano (R2/R3) o ignorano (R1)
   - SCORE_UPDATE → Ledwall classifica aggiornata, Regia scoreboard aggiornato, smartphone punteggio propria squadra

5. **Fix disallineamenti** — Correggere incompatibilità trovate in qualsiasi file

**Criteri di successo:**
- [ ] Flusso completo giocabile da 3 tab browser (smartphone + ledwall + regia)
- [ ] Zero errori JavaScript nella console in un flusso completo
- [ ] Tutti i 40+ eventi Socket.io verificati (nessun orfano)
- [ ] FREEZE/UNFREEZE sincronizzati tra tutti i client
- [ ] `npm run dev` avvia tutto correttamente
- [ ] `npm run build` produce build di produzione funzionante

---

### ═══════════ FASE 4 — Qualità ═══════════

---

### Agent 8: Sistema Demo / Bot

| Campo | Valore |
|---|---|
| **Modello** | **Sonnet 4.6** |
| **Ruolo** | Simulazione automatizzata per testing pre-evento |
| **Missione** | Implementare la modalità Demo con bot simulati che giocano autonomamente, e il debug mode per verifiche tecniche |
| **Sezioni PRD** | §11.8 (Demo/Test — completo) |
| **Input** | Sistema funzionante end-to-end (output Agent 7) |
| **Output** | Demo mode e debug mode funzionanti |
| **Dipendenze** | Agent 7 completato |

**Deliverable:**

1. **`server/bot/BotSimulator.ts`**:
   - Crea N bot (4-50, configurabile, default 20) distribuiti uniformemente tra le squadre
   - Nomi: "Bot-01", "Bot-02", ...
   - Si connettono come client Socket.io normali
   - Comportamento: votano casualmente dopo 2-5s, buzzano dopo 1-3s dall'attivazione, rispondono (corretto/errato alternato) dopo 3-5s
   - I bot NON usano la chat

2. **Toggle "Modalità Demo"** — Nel ConfigPanel della Regia:
   - Attivazione/disattivazione
   - Configurazione numero bot
   - Banner "DEMO" fisso in alto su Regia e Ledwall

3. **Debug Mode** (`?debug=true` su `/regia`):
   - Riproduzione simultanea di tutti i suoni squadra
   - Trigger manuale di ogni singolo segnale MIDI
   - Simulazione disconnessione/riconnessione client
   - Visualizzazione real-time dello stato di ogni bot

**Criteri di successo:**
- [ ] 20 bot si collegano e giocano autonomamente
- [ ] Flusso completo (lobby → votazione → 3 round → finale) si completa con i bot
- [ ] Debug mode mostra stato real-time di ogni bot
- [ ] Banner DEMO visibile su Regia e Ledwall

---

### Agent 9: QA & Validazione Finale

| Campo | Valore |
|---|---|
| **Modello** | **Opus 4.6** |
| **Ruolo** | Validazione finale contro il PRD, fix bug, verifica performance |
| **Missione** | Verificare ogni item della checklist §20 del PRD (80+ item), validare la build di produzione, correggere bug residui, produrre un report finale |
| **Sezioni PRD** | §20 (checklist completa), §3.5 (performance), §16 (requisiti non funzionali) |
| **Input** | Sistema completo con Demo mode (output Agent 8) |
| **Output** | Sistema validato, checklist completata, report |
| **Dipendenze** | Agent 8 completato |

**Deliverable:**

1. **Checklist §20 verifica** — Per ciascuno degli 80+ item:
   - Verificare se implementato correttamente
   - Se mancante → implementare
   - Se non implementabile → documentare come known issue con motivazione

2. **Test con Demo mode** — Flusso completo con 20+ bot:
   - Latenza buzzer sotto carico
   - Nessun crash o memory leak
   - Tutti gli stati raggiungibili

3. **Build di produzione**:
   - `npm run build` senza errori
   - Servire la build e verificare funzionamento

4. **Fix bug residui** — Correzione di qualsiasi problema trovato durante la validazione

5. **Report finale** — Documento con:
   - Item completati (✅) vs known issues (⚠️)
   - Performance osservate
   - Raccomandazioni per il deploy

**Criteri di successo:**
- [ ] 90%+ della checklist §20 completata (✅)
- [ ] Zero crash in un flusso completo con 20+ bot
- [ ] `npm run build` produce build funzionante
- [ ] Report finale consegnato

---

## 7. RIEPILOGO FASI

| Fase | Agenti | Modello | Parallelismo | Dipende da |
|---|---|---|---|---|
| **Fase 0** | Agent 0 (Setup) | Sonnet | Singolo | — |
| **Fase 1** | Agent 1 (DB) → Agent 2 (Engine) | Sonnet → **Opus** | Sequenziale | Fase 0 |
| **Fase 2** | Agent 3 (Phone) ∥ Agent 4 (Ledwall) ∥ Agent 5 (Regia) | Sonnet ∥ Sonnet ∥ Sonnet | **3 in parallelo** | Fase 1 |
| **Fase 3** | Agent 6 (MIDI) → Agent 7 (Integrazione) | Sonnet → **Opus** | Sequenziale | Fase 2 |
| **Fase 4** | Agent 8 (Demo) → Agent 9 (QA) | Sonnet → **Opus** | Sequenziale | Fase 3 |

**Totale: 10 agenti, 5 fasi, massimo 3 in parallelo (Fase 2) — 3 Opus + 7 Sonnet**

---

## 8. PROTOCOLLO DI COMUNICAZIONE TRA AGENTI

### Ownership esclusiva
Ogni file ha UN solo agente proprietario (indicato in §5). Regole:
- Nessun agente modifica file di proprietà altrui
- **Eccezioni**: Agent 7 (Integrazione) e Agent 9 (QA) possono fare correzioni mirate ovunque
- Se un agente ha bisogno di un tipo mancante in `src/types/index.ts`, lo aggiunge rispettando le convenzioni esistenti

### Risoluzione conflitti
- Tipi condivisi → vanno sempre in `src/types/index.ts`
- Se un agente trova un bug in un modulo altrui → lo documenta come commento `// TODO: [AgentN] bug found: ...`, verrà risolto da Agent 7 o 9

---

## 9. QUALITY GATE PER FASE

| Fase | Gate di validazione | Chi valida |
|---|---|---|
| **Fase 0** | `npm run build` compila, `npm run dev` avvia, 3 route con placeholder visibili | Supervisore |
| **Fase 1** | API REST rispondono (curl), autosave/loadState funziona, Socket.io connette, JWT funziona | Supervisore |
| **Fase 2** | Ogni frontend renderizza tutti gli stati previsti, comandi Regia funzionano, audio 2 canali funziona | Supervisore |
| **Fase 3** | Flusso completo e2e da 3 tab browser senza errori console, MIDI funzionante (o mock) | Supervisore |
| **Fase 4** | Demo mode completa con bot, checklist §20 validata al 90%+, build di produzione OK | Supervisore |

---

## 10. RISCHI E MITIGAZIONI

| Rischio | Impatto | Mitigazione |
|---|---|---|
| Disallineamento tipi tra agenti | Medio | Contratto centrale `src/types/index.ts`, Agent 7 come verificatore |
| Race condition buzzer | Alto | BuzzerManager dedicato (Agent 2) con logica atomica |
| Context window overflow per Agent 2 | Alto | Riceve solo §3.5-3.7, §4-7, §14, §16.3-16.5, §19 — non l'intero PRD |
| MIDI non testabile su Windows | Basso | Graceful degradation con mock (Agent 6) |
| Performance con 500 client | Alto | Demo mode con bot (Agent 8) + stress test (Agent 9) |
| Audio browser autoplay policy | Medio | AudioContext sbloccato al login Regia (gesto utente) |
| Conflitti di merge tra Agent 3/4/5 | Basso | File ownership esclusiva — zero file condivisi tra i 3 |

---

## 11. ISTRUZIONI PER L'ORCHESTRATORE

L'orchestratore (umano o agente supervisore) segue questo protocollo operativo:

### Per ogni fase:

1. **Prepara il contesto** per ogni agente della fase:
   - Copia-incolla le sezioni PRD indicate nel campo "Sezioni PRD" dell'agente
   - Allega il file `src/types/index.ts` aggiornato
   - Allega il `CLAUDE.md`
   - Specifica i file da creare e i criteri di successo

2. **Lancia gli agenti** (in parallelo se la fase lo prevede)

3. **Valida il quality gate** della fase prima di procedere

4. **Aggiorna `src/types/index.ts`** se un agente ha aggiunto tipi

### Sequenza operativa:

```
1. Lancia Agent 0 → valida Fase 0
2. Lancia Agent 1 → valida → Lancia Agent 2 → valida Fase 1
3. Lancia Agent 3 + Agent 4 + Agent 5 IN PARALLELO → valida Fase 2
4. Lancia Agent 6 → valida → Lancia Agent 7 → valida Fase 3
5. Lancia Agent 8 → valida → Lancia Agent 9 → valida Fase 4
6. DONE — Sistema pronto per il deploy
```
