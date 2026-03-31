# CYBERSHOW 2026 — Stato di Implementazione

**Data:** 2026-03-30
**Scopo:** Riferimento rapido per capire cosa è stato implementato, cosa manca, e quali test fare.

---

## 1. AGENTI COMPLETATI

### Agent 0 — Setup Progetto & Infrastruttura ✅ COMPLETATO

**File creati:**
- `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`
- `tailwind.config.js`, `postcss.config.js`, `.env.example`, `.gitignore`
- `src/types/index.ts` — contratto centrale con tutti i tipi, enum, payload, eventi
- `src/App.tsx` — routing React (`/app`, `/ledwall`, `/regia`)
- `src/main.tsx` — entry point
- `src/styles/globals.css` + `src/styles/cyberpunk.css` — tema cyberpunk
- `src/components/ui/*` — 6 componenti UI base (CyberButton, CyberInput, CyberPanel, GlitchText, ProgressBar, Scanlines)
- `public/manifest.json` — PWA manifest
- `CLAUDE.md` — convenzioni progetto

**Stato:** Tutto completo, nessun problema noto.

---

### Agent 1 — Database & API REST ✅ COMPLETATO

**File creati:**
- `server/db/schema.ts` — Schema Drizzle: tabelle `questions` e `gameStateSnapshot`
- `server/db/index.ts` — Istanza DB, `autosave()`, `loadState()`, WAL mode
- `server/db/seed.ts` — 3 domande di esempio (1 per round)
- `server/api/questions.ts` — Router Express con 7 endpoint REST completi
- `server/media/mediaServer.ts` — Serve `/media/` come file statici
- `drizzle.config.ts` — Configurazione Drizzle Kit
- `drizzle/` — Migrazioni generate

**Cosa implementa:**
- CRUD completo domande (GET, POST, PUT, DELETE)
- Upload media con multer (POST `/api/questions/:id/media`)
- Delete file specifici (DELETE `/api/questions/:id/media?file=...`)
- Reorder domande (PUT `/api/questions/reorder`)
- ID auto-generato formato `q001`, `q002`, ...
- Custom type `jsonStringArray` per campo `accepted_answers`
- Media server con cache 1h e CORS
- Autosave/loadState per disaster recovery

**Stato:** Tutto completo, nessun problema noto.

---

### Agent 2 — Game Engine & Socket.io ✅ COMPLETATO

**File creati:**
- `server/game/GameEngine.ts` (~1022 righe) — Orchestratore principale
- `server/game/BuzzerManager.ts` — Race condition handling al ms
- `server/game/TimerManager.ts` — Timer 60s + grazia 10s
- `server/game/ScoreManager.ts` — Punteggi, bonus, undo, podio
- `server/game/StateStore.ts` — Stato in-memory + persistenza SQLite
- `server/game/SessionManager.ts` — Sessioni, riconnessione, late join
- `server/game/VoteManager.ts` — Votazione suoni con tie-breaking
- `server/socket/handlers.ts` — 40+ handler Socket.io + JWT auth
- `server/socket/rooms.ts` — Gestione room Socket.io
- `server/index.ts` — Server Express + Socket.io assemblato

**Cosa implementa:**
- State machine completa: SETUP → LOBBY → VOTE → PLAYING → BETWEEN_QUESTIONS → BETWEEN_ROUNDS → FINALE_LOBBY → FINALE → ENDED
- Flusso domanda completo: tappo → countdown 3-2-1 → buzzer → green/red → risposta → correct/error → reveal → next
- Buzzer race condition atomico (primo pacchetto vince)
- `buzzedTeams[]` per domanda, riapertura dopo errore
- Timer 60s con grazia 10s, passaggio a compagno
- Validazione risposta: fuzzy matching (Levenshtein), case insensitive, normalizzazione accenti
- Override Regia (CORRETTO/SBAGLIATO)
- Votazione suoni: 4 opzioni esclusive per squadra, timer 60s, tie-break random
- Heartbeat Regia ogni 2s, pausa automatica dopo 6s
- JWT auth per Regia (codice evento → token 12h)
- Late join in qualsiasi fase
- Riconnessione istantanea via session token
- Autosave su ogni cambio domanda/punteggio
- Gran Finale: suspense → ok finale → video → podio → WINNER/LOSER → END
- Animazione "ULTIMA DOMANDA" automatica
- KICK_ALL con reset completo
- Reset Soft (mantiene giocatori, resetta stato domanda)
- Bonus manuali (-50/+50), undo singolo livello

**⚠️ MIDI non integrato** — Le chiamate MIDI sono commentate nel codice (`// TODO: MIDI`). Questo è previsto: sarà compito dell'Agent 6.

---

### Agent 3 — Frontend Smartphone ✅ COMPLETATO

**File creati:**
- `src/views/PlayerView.tsx` — Container root con routing per 17 stati
- `src/hooks/useSocket.ts` — Connessione Socket.io con session token
- `src/hooks/useGameState.ts` — Sincronizzazione stato gioco
- `src/hooks/useBuzzer.ts` — Debounce 500ms + haptic feedback
- `src/hooks/useChat.ts` — Chat squadra (max 40 char, buffer 20 msg)
- `src/hooks/useI18n.ts` — Switch IT/EN con localStorage
- `src/components/smartphone/LoginForm.tsx` — Nome (max 15 char) + scelta squadra
- `src/components/smartphone/Lobby.tsx` — Attesa con animazione
- `src/components/smartphone/VoteSound.tsx` — Votazione suoni con barre in real-time
- `src/components/smartphone/Waiting.tsx` — Idle + punteggio squadra
- `src/components/smartphone/Countdown.tsx` — 3-2-1 a tutto schermo
- `src/components/smartphone/BuzzerButton.tsx` — Pulsante circolare enorme
- `src/components/smartphone/AnswerBox.tsx` — Input + timer 60s + progress bar
- `src/components/smartphone/TeamChat.tsx` — Chat compagni (GREEN_TEAMMATE)
- `src/components/smartphone/StateOverlay.tsx` — Overlay correct/error/red/reveal/vote_result
- `src/components/smartphone/LanguageSwitch.tsx` — Toggle IT/EN con bandiera
- `src/components/smartphone/FinaleScreens.tsx` — Lobby/winner/loser/end + pioggia d'oro
- `src/i18n/it.json` + `src/i18n/en.json` — Traduzioni complete

**Cosa implementa:**
- Tutti i 17 stati del §18 renderizzati
- STATE_PAUSED overlay sovrapposto a qualsiasi stato
- Feedback aptico differenziato (vittoria, blocco, errore)
- Portrait mode via CSS
- Pre-caricamento immagini reveal (R2/R3) via `new Image().src`
- Switch IT/EN persistito in localStorage
- Debounce buzzer 500ms client-side
- Chat con auto-scroll, max 40 char, buffer 20 msg
- Indicatore connessione in basso a sinistra

---

### Agent 4 — Frontend Ledwall ✅ COMPLETATO

**File creati:**
- `src/views/LedwallView.tsx` — Container fullscreen con state machine
- `src/hooks/useLedwall.ts` — Sincronizzazione stato Ledwall (read-only)
- `src/components/ledwall/LayerManager.tsx` — Sistema a 5 layer (L0-L4)
- `src/components/ledwall/Scoreboard3D.tsx` — Classifica animata CSS 3D + Framer Motion
- `src/components/ledwall/Tappo.tsx` — Velo con classifica sovrapposta
- `src/components/ledwall/VideoPlayer.tsx` — Player R1 spectrogram/R2 video/R3 immagine
- `src/components/ledwall/QRCodeDisplay.tsx` — QR Code + barre conteggio + call-to-action
- `src/components/ledwall/IceOverlay.tsx` — Bordi ghiacciati CSS celeste
- `src/components/ledwall/HypeVideo.tsx` — Video transizione tra round
- `src/components/ledwall/FinaleSequence.tsx` — Video celebrativo + podio 4°→3°→2°→1°

**Cosa implementa:**
- State machine: QR_LOBBY → TAPPO → PLAY → FREEZE → REVEAL → HYPE_ROUND → FINALE → PAUSED
- Layer system: background, video/immagine, tappo, overlay, bordi ghiacciati
- FREEZE/UNFREEZE: video.pause()/play() + bordi ghiacciati
- Nome + squadra vincitrice sovrapposti al buzzer
- Timer 60s visibile durante risposta
- QR Code generato dinamicamente (lib `qrcode`)
- Barre conteggio squadre animate
- Classifica 3D con animazioni sorpasso
- Animazione "ULTIMA DOMANDA" (4s)
- Hype video tra round
- Finale con podio progressivo (4°→3°→2°→1°, 2s intervallo)
- Parità: squadre affiancate nella stessa posizione
- Testi bilingui IT/EN nella barra inferiore
- Tutti i `<video>` con attributo `muted`
- Cursore nascosto
- Pre-caricamento video/immagini domanda successiva

---

### Agent 5 — Frontend Regia ✅ COMPLETATO

**File creati:**
- `src/views/AdminDashboard.tsx` — Layout multi-tab con CSV export
- `src/hooks/useRegia.ts` — Socket autenticato + 18 comandi + heartbeat 2s
- `src/hooks/useAudioEngine.ts` — Motore audio 2 canali (trackChannel + sfxChannel)
- `src/components/regia/LoginRegia.tsx` — Campo codice evento
- `src/components/regia/ConfigPanel.tsx` — Config pre-partita (team, domande, punti, demo)
- `src/components/regia/Dashboard.tsx` — Layout GameControls + ScoreWidget + ChatMonitor
- `src/components/regia/GameControls.tsx` — Tutti i pulsanti di gioco
- `src/components/regia/ScoreWidget.tsx` — Scoreboard laterale
- `src/components/regia/ChatMonitor.tsx` — Monitor chat 4 squadre
- `src/components/regia/QuizManager.tsx` — CRUD domande con upload
- `src/components/regia/PlayerModeration.tsx` — Kick/rinomina + distribuzione team
- `src/components/regia/MidiMap.tsx` — Tabella mappa MIDI
- `src/components/regia/PerformanceAlert.tsx` — Alert connessioni/performance

**Cosa implementa:**
- Login codice evento → JWT 12h
- Heartbeat ogni 2s
- Tutti i 18 comandi CMD_* dalla dashboard
- Audio a 2 canali: trackChannel (pausabile) + sfxChannel (fire-and-forget)
- PLAY_TRACK → trackChannel, PLAY_SFX (ritornello_*) → trackChannel, altri → sfxChannel
- PLAY_TEAM_SOUND → sfxChannel
- FREEZE → trackChannel.pause(), UNFREEZE → trackChannel.play()
- STOP_AUDIO → ferma entrambi
- AudioContext sbloccato al login (gesto utente)
- CRUD quiz completo con API REST
- Upload drag & drop per media
- Riordino domande
- Scoreboard aggiornato in real-time
- Chat monitor tutte le squadre
- Moderazione utenti (kick/rinomina inline)
- Bonus manuali (-50/+50)
- Annulla ultimo punto
- Timer 60s visibile con progress bar
- Pulsanti abilitati/disabilitati in base allo stato del gioco
- CSV export (timestamp, questionId, round, team, player, answer, result, points, responseTime)
- Alert performance (connessioni > 450)
- Toggle Demo mode nel ConfigPanel
- Pulsanti SUSPENSE e OK FINALE per il gran finale
- KICK_ALL con conferma

---

## 2. AGENTI NON ANCORA ESEGUITI

### Agent 6 — MIDI / QLab ❌ NON IMPLEMENTATO

**File mancante:** `server/midi/MidiController.ts`

**Cosa deve fare:**
- Implementare controller MIDI con `easymidi` via IAC Driver (macOS)
- Mappa note: C3-F3 (buzzer squadre), G3 (corretto), A3 (errore), B3 (blackout)
- `sendNote(note, velocity?)` — Note On
- Timing: stesso tick dell'evento corrispondente
- Graceful degradation su Windows/Linux (mock mode, log-only)
- Try/catch su ogni invio: QLab offline → warning, gioco continua
- Integrare le chiamate nei punti commentati del GameEngine e BuzzerManager

**Punti di integrazione nel codice esistente (TODO comments):**
- `GameEngine.ts` → risposta corretta (G3), risposta errata (A3), kickAll (B3)
- `BuzzerManager.ts` → buzzer vinto (C3/D3/E3/F3 per squadra)

---

### Agent 7 — Integrazione & Wiring End-to-End ❌ NON ESEGUITO

**Cosa deve fare:**
- Assemblaggio finale `server/index.ts` (potrebbe essere già sufficiente)
- Verifica flusso completo da 3 tab browser
- Cross-reference tutti i 40+ eventi Socket.io (emitter ↔ handler ↔ payload)
- Verifica sincronizzazione critica: FREEZE/UNFREEZE, SHOW_REVEAL, SCORE_UPDATE
- Fix disallineamenti tra moduli di agenti diversi
- Verifica `npm run build` produce build di produzione funzionante

---

### Agent 8 — Demo / Bot ❌ NON IMPLEMENTATO

**File mancante:** `server/bot/BotSimulator.ts`

**Cosa deve fare:**
- Bot simulati (4-50, default 20) distribuiti tra squadre
- Nomi "Bot-01", "Bot-02", ...
- Comportamento: votano dopo 2-5s, buzzano dopo 1-3s, rispondono dopo 3-5s (corretto/errato alternato)
- Non usano chat
- Banner "DEMO" su Regia e Ledwall
- Debug mode (`?debug=true` su `/regia`): trigger manuale MIDI, stato bot real-time

---

### Agent 9 — QA & Validazione Finale ❌ NON ESEGUITO

**Cosa deve fare:**
- Verificare checklist §20 (80+ item) contro codice reale
- Test con Demo mode (20+ bot)
- Build di produzione funzionante
- Fix bug residui
- Report finale

---

## 3. ANALISI GAP — COSA MANCA RISPETTO AL PRD

### Critico (blocca il funzionamento end-to-end)
| # | Gap | Agente responsabile |
|---|-----|---------------------|
| 1 | MIDI controller non implementato | Agent 6 |
| 2 | Bot/Demo mode non implementato | Agent 8 |
| 3 | Wiring end-to-end non verificato | Agent 7 |

### Da verificare (potenziali disallineamenti)
| # | Cosa verificare | Dettaglio |
|---|-----------------|-----------|
| 4 | `GAME_STATE_SYNC` — il hook `useRegia` lo ascolta ma il server potrebbe non emetterlo | Verificare che il GameEngine emetta un evento di sync completo alla connessione Regia |
| 5 | `CMD_START_VOTE` — il ConfigPanel ha pulsante "AVVIA VOTAZIONE" che chiama `onStartVote`, ma verificare che il wiring passi da AdminDashboard → useRegia → socket | Tracciare il flusso completo |
| 6 | Audio paths — `useAudioEngine` usa `/media/questions/{questionId}.mp3` ma la convenzione media è `/media/{questionId}/audio.mp3` | Potenziale mismatch URL audio |
| 7 | Video spectrogram — `VideoPlayer` cerca `spectrogram_loop.mp4` ma il path potrebbe non corrispondere | Verificare che il path corrisponda a `/media/system/spectrogram_loop.mp4` |
| 8 | Late join durante votazione — `useGameState` gestisce ricezione opzioni voto? | Verificare il flusso completo |
| 9 | Reveal R1 — smartphone dovrebbe ignorare SHOW_REVEAL se round === 1 | Verificare logica in useGameState |
| 10 | Banner "DEMO" — ConfigPanel ha toggle demo ma Ledwall e Regia non mostrano banner | Agent 8 deve aggiungerlo |
| 11 | Debug mode (`?debug=true`) non implementato | Agent 8 |

### Non critico (funzionalità minori)
| # | Gap | Note |
|---|-----|------|
| 12 | CSV export — il log viene costruito lato client in `useRegia`, potenzialmente incompleto se il browser si ricarica | Potrebbe servire log lato server |
| 13 | Pre-caricamento video successivo su Ledwall — implementato ma da verificare il timing | Verificare con media reali |
| 14 | Validazione R1 senza `ritornello.mp3` — l'API la impedisce ma QuizManager UI potrebbe non mostrare l'errore chiaramente | UX da verificare |

---

## 4. CONSIGLIO: QUANDO FARE I TEST?

### Raccomandazione: Eseguire Agent 6 (MIDI) e Agent 7 (Integrazione) PRIMA dei test manuali

**Motivazione:**
1. **Agent 6 (MIDI)** è un task isolato e veloce (~1 file). Non cambia la logica di gioco, aggiunge solo le chiamate MIDI nei punti già predisposti (TODO comments). Può essere fatto senza rischi.

2. **Agent 7 (Integrazione)** è ESSENZIALE prima dei test. Il suo compito principale è:
   - Verificare che tutti gli eventi Socket.io siano correttamente wired (emitter → handler)
   - Fixare disallineamenti di payload/path tra i moduli dei diversi agenti
   - Assicurarsi che `npm run dev` e `npm run build` funzionino
   - Senza questo passaggio, è molto probabile che i test manuali falliscano per problemi di integrazione, non per bug di logica

3. **Agent 8 (Bot/Demo)** è utile ma NON bloccante per i test manuali. I test si possono fare manualmente senza bot. Tuttavia, per un test completo con 20+ connessioni simultanee, serve il bot.

### Ordine suggerito:
```
1. Agent 6 (MIDI)         — 30-60 min, isolato
2. Agent 7 (Integrazione) — il più importante, fix cross-module
3. TEST MANUALI           — dopo Agent 7, con il sistema integrato
4. Agent 8 (Bot/Demo)     — per stress test e verifica automatizzata
5. Agent 9 (QA)           — validazione finale
```

---

## 5. TEST MANUALI DA ESEGUIRE (dopo Agent 7)

### Prerequisiti
```bash
npm install
npm run dev    # Avvia server (3000) + client (5173)
```

Aprire 3 tab browser:
- Tab 1: `http://localhost:5173/app` (smartphone)
- Tab 2: `http://localhost:5173/ledwall` (ledwall)
- Tab 3: `http://localhost:5173/regia` (regia)

### Test 1 — Avvio e Routing Base
- [ ] `npm run dev` parte senza errori
- [ ] `/app` mostra schermata login
- [ ] `/ledwall` mostra QR code + barre conteggio
- [ ] `/regia` mostra login con campo codice evento

### Test 2 — Login Regia
- [ ] Inserire codice evento (vedi `.env` → `EVENT_CODE`) → accesso alla dashboard
- [ ] Verifica: tabs visibili (Configurazione, Dashboard, Monitoraggio, Quiz, MIDI)
- [ ] Verifica: scoreboard laterale visibile

### Test 3 — Configurazione Pre-Partita
- [ ] Modificare numero squadre (2/3/4)
- [ ] Modificare nomi squadre
- [ ] Modificare domande per round
- [ ] Modificare punti per risposta corretta

### Test 4 — Onboarding Giocatore
- [ ] Da `/app`: inserire nome (verificare max 15 char)
- [ ] Scegliere squadra → arrivare in Lobby
- [ ] Verificare che il Ledwall aggiorni il conteggio nella barra della squadra
- [ ] Aprire altra tab `/app` con secondo giocatore, stessa squadra → verificare conteggio
- [ ] Aprire altra tab `/app` con terzo giocatore, squadra diversa

### Test 5 — Votazione Suoni
- [ ] Dalla Regia: premere "AVVIA VOTAZIONE"
- [ ] Smartphone: verificare che appaiano 4 opzioni suono
- [ ] Votare da ogni smartphone → verificare barre voti in real-time
- [ ] Attendere fine timer o chiudere dalla Regia
- [ ] Verificare: banner risultato appare sugli smartphone
- [ ] Verificare: stato torna a WAITING

### Test 6 — Avvio Partita
- [ ] Dalla Regia: premere "AVVIA PARTITA"
- [ ] Verificare: QR Code scompare dal Ledwall
- [ ] Verificare: Tappo con classifica 0-0 appare sul Ledwall
- [ ] Smartphone: STATE_WAITING

### Test 7 — Flusso Round 1 (Music Quiz)
- [ ] Regia: "PROSSIMO ROUND" → Hype video R1 sul Ledwall
- [ ] Regia: "PROSSIMA DOMANDA" → Tappo con classifica
- [ ] Regia: "PLAY TRACCIA" → verificare audio dalle casse (Regia)
- [ ] Regia: "START" → Countdown 3-2-1 su Ledwall e smartphone
- [ ] Fine countdown: buzzer attivo su tutti gli smartphone
- [ ] Ledwall: spettrogramma in loop
- [ ] Premere buzzer da uno smartphone → GREEN (responder) + RED (altri)
- [ ] Ledwall: spettrogramma freeze + bordi ghiacciati + nome vincitore
- [ ] Audio in pausa (trackChannel)
- [ ] Scrivere risposta → inviare
- [ ] Se corretta: effetto vittoria 5s → reveal/ritornello → STATE_CORRECT
- [ ] Se errata: errore 2s → buzzer riaperti per altre squadre
- [ ] Regia: "PROSSIMA DOMANDA" → Tappo con classifica aggiornata

### Test 8 — Chat di Squadra
- [ ] Quando una squadra è in GREEN: compagni vedono chat
- [ ] Scrivere messaggi (max 40 char)
- [ ] Verificare che la chat appaia solo ai compagni
- [ ] Verificare che il responder veda i messaggi sopra il box input
- [ ] Verificare nel ChatMonitor della Regia

### Test 9 — Override Regia
- [ ] Un giocatore risponde (anche sbagliando)
- [ ] Regia preme "CORRETTO" → override a risposta corretta
- [ ] Verificare: punti assegnati, effetto vittoria
- [ ] Testare anche "SBAGLIATO" su risposta automaticamente corretta

### Test 10 — Flusso Round 2 (Video Zoom-Out)
- [ ] Passare a Round 2 ("PROSSIMO ROUND")
- [ ] Verificare hype video R2
- [ ] "PROSSIMA DOMANDA" → Tappo + classifica
- [ ] "VIA" → Tappo sparisce → countdown → video parte (muto su Ledwall)
- [ ] Buzzer → freeze video → bordi ghiacciati
- [ ] Risposta corretta → reveal (immagine su Ledwall + smartphone)

### Test 11 — Flusso Round 3 (Brand)
- [ ] Passare a Round 3
- [ ] "VIA" → immagine statica (logo oscurato)
- [ ] Buzzer → bordi ghiacciati (immagine resta visibile)
- [ ] Risposta corretta → reveal (logo visibile) su Ledwall + smartphone

### Test 12 — Funzionalità Avanzate
- [ ] Skip domanda → tutti tornano a WAITING, nessun punto
- [ ] Reset Soft → tutti a WAITING, buzzedTeams azzerato
- [ ] Bonus manuale → verificare punteggio aggiornato
- [ ] Annulla ultimo punto → punteggio ripristinato
- [ ] Kick giocatore → giocatore espulso, può rientrare

### Test 13 — Animazione Ultima Domanda
- [ ] Arrivare all'ultima domanda di un round
- [ ] Verificare: animazione "ULTIMA DOMANDA" 4s su Ledwall e smartphone
- [ ] Verificare: START/VIA disabilitato durante animazione

### Test 14 — Gran Finale
- [ ] Fine Round 3 → STATE_FINALE_LOBBY su tutti gli smartphone
- [ ] Regia: "SUSPENSE" → musica suspense dalle casse
- [ ] Regia: "OK FINALE" → musica si ferma → video celebrativo su Ledwall
- [ ] Podio: 4°→3°→2°→1° con animazioni
- [ ] Smartphone: WINNER (verde + pioggia d'oro) / LOSER (rosso)
- [ ] Dopo il finale: tutti → STATE_END

### Test 15 — Resilienza
- [ ] Ricaricare una tab smartphone → riconnessione automatica (session token)
- [ ] Chiudere tutte le tab Regia → dopo 6s verificare GAME_PAUSED
- [ ] Riaprire Regia → GAME_RESUMED
- [ ] Testare disconnessione del responder durante risposta → grazia 10s → passaggio a compagno

### Test 16 — KICK_ALL e Reset
- [ ] Regia: "KICK_ALL" → tutti disconnessi, DB svuotato
- [ ] Verificare: tutto il sistema pronto per nuovo evento

### Test 17 — Lingue
- [ ] Switch IT/EN su smartphone → verificare traduzione
- [ ] Ricaricare pagina → lingua persistita
- [ ] Ledwall: testi bilingui sempre visibili

### Test 18 — CSV Export
- [ ] Dopo il finale, prima di KICK_ALL
- [ ] Dalla Regia: esportare CSV
- [ ] Verificare: contiene timestamp, questionId, round, team, player, answer, result, points, responseTime

---

## 6. RIEPILOGO FILE DEL PROGETTO

### File per agente

| Agente | File | Stato |
|--------|------|-------|
| Agent 0 | package.json, tsconfig.json, vite.config.ts, tailwind.config.js, postcss.config.js, .env.example, CLAUDE.md, src/types/index.ts, src/App.tsx, src/main.tsx, src/styles/*, src/components/ui/*, public/manifest.json | ✅ |
| Agent 1 | server/db/schema.ts, server/db/index.ts, server/db/seed.ts, server/api/questions.ts, server/media/mediaServer.ts, drizzle.config.ts, drizzle/* | ✅ |
| Agent 2 | server/game/*, server/socket/*, server/index.ts | ✅ |
| Agent 3 | src/views/PlayerView.tsx, src/hooks/useSocket.ts, src/hooks/useGameState.ts, src/hooks/useBuzzer.ts, src/hooks/useChat.ts, src/hooks/useI18n.ts, src/components/smartphone/*, src/i18n/* | ✅ |
| Agent 4 | src/views/LedwallView.tsx, src/hooks/useLedwall.ts, src/components/ledwall/* | ✅ |
| Agent 5 | src/views/AdminDashboard.tsx, src/hooks/useRegia.ts, src/hooks/useAudioEngine.ts, src/components/regia/* | ✅ |
| Agent 6 | server/midi/MidiController.ts | ❌ Mancante |
| Agent 7 | (verifica/fix cross-module) | ❌ Non eseguito |
| Agent 8 | server/bot/BotSimulator.ts | ❌ Mancante |
| Agent 9 | (QA/validazione) | ❌ Non eseguito |

### Media necessari per il test (da creare manualmente o con seed)
```
media/
  system/
    spectrogram_loop.mp4    ← video decorativo R1 (necessario)
    hype_round1.mp4         ← video transizione R1 (necessario)
    hype_round2.mp4         ← video transizione R2
    hype_round3.mp4         ← video transizione R3
    finale_celebration.mp4  ← video finale
    suspense_music.mp3      ← musica suspense
    champions.mp3           ← musica finale
    victory.mp3             ← effetto vittoria 5s
  sounds/
    (almeno 16 file .mp3 per 4 squadre × 4 opzioni)
  q001/
    audio.mp3 + ritornello.mp3 (R1)
  q002/
    video.mp4 + reveal.jpg (R2)
  q003/
    image.jpg + reveal.jpg (R3)
```

---

*Documento generato il 2026-03-30 — Aggiornare dopo ogni fase completata.*
