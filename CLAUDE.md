# CYBERSHOW INTERACTIVE 2026 — Project Conventions

**PRD Reference:** `CYBERSHOW_INTERACTIVE_2026_PRD_v3.6.md`
**Orchestration:** `ORCHESTRATION_PLAN.md`
**Stack:** Node.js + Express + Socket.io + React 19 + TypeScript 5 + Drizzle ORM + SQLite + Vite 6 + Tailwind CSS 3

---

## 1. Language & Module System

- **TypeScript strict mode** everywhere — no `any`, no `@ts-ignore`
- **ES Modules only** — `import`/`export`, never `require`/`module.exports`
- All server files use `.ts` extension, run via `tsx`

## 2. Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| React components | PascalCase | `BuzzerButton.tsx` |
| Classes | PascalCase | `GameEngine`, `BuzzerManager` |
| Variables / functions | camelCase | `currentRound`, `handleBuzzerPress` |
| Enum values | UPPER_SNAKE | `PlayerState.BUZZER_ACTIVE` |
| Constants | UPPER_SNAKE | `SOCKET_EVENTS.BUZZER_PRESS` |
| Files (non-component) | camelCase | `handlers.ts`, `buzzerManager.ts` |

## 3. Exports

- **Named exports** for all modules: `export function`, `export interface`, `export const`
- **Default export** only for React components (required by React Router)
- Never mix both in the same file

## 4. Path Alias

- `@/` maps to `src/` — configured in `tsconfig.json` and `vite.config.ts`
- Always use `@/` for imports within `src/`

## 5. Comments

- All code comments in **English**
- Prefer self-documenting code over comments
- Add comments only for non-obvious logic (race conditions, timing, MIDI)

## 6. File Ownership

Each file has ONE owner agent. Never modify another agent's files directly.

| File | Owner |
|---|---|
| `src/types/index.ts` | Agent 0 (read-only for others) |
| `server/db/*` | Agent 1 |
| `server/api/*` | Agent 1 |
| `server/game/*` | Agent 2 |
| `server/socket/*` | Agent 2 |
| `server/midi/*` | Agent 6 |
| `server/bot/*` | Agent 8 |
| `src/components/smartphone/*` | Agent 3 |
| `src/hooks/useSocket.ts` etc. | Agent 3 |
| `src/components/ledwall/*` | Agent 4 |
| `src/components/regia/*` | Agent 5 |
| `src/views/*` | Agents 3/4/5 |

## 7. Socket.io Conventions

- All event names are defined in `SOCKET_EVENTS` constant in `src/types/index.ts`
- **Never hardcode event name strings** — always use `SOCKET_EVENTS.*`
- Room names: `global`, `regia`, `team:blue`, `team:red`, `team:green`, `team:yellow`
- Helper: `teamRoom(teamId)` from `src/types/index.ts`

## 8. State Machine

- `PlayerState` enum → smartphone UI states (17 total, §18)
- `LedwallState` enum → ledwall visual states
- `GamePhase` enum → server-side game phase

## 9. Ports

| Service | Port |
|---|---|
| Express + Socket.io | 3000 |
| Vite dev server | 5173 |

## 10. Audio Architecture

- **All audio** is played by the `/regia` client via Web Audio API
- Server sends `PLAY_TRACK`, `PLAY_SFX`, `PLAY_TEAM_SOUND`, `STOP_AUDIO`
- **Ledwall never plays audio** — all `<video>` tags must have `muted` attribute
- **Smartphones never play audio**
- Two channels: `trackChannel` (pauseable) and `sfxChannel` (fire-and-forget)

## 11. Security

- Regia protected by Event Code → JWT 12h
- Anti-spam: 500ms debounce client-side + 1 buzzer/player/question server-side
- Max name length: 15 characters
- No sensitive data stored — only session IDs and scores

## 12. Performance Targets

- Buzzer latency: < 100ms
- MIDI latency: < 10ms
- 500+ simultaneous WebSocket connections supported

## 13. Environment Variables

Always read from `process.env.*` with fallbacks. Never hardcode secrets.
Copy `.env.example` to `.env` before running.

## 14. Development Commands

```bash
npm run dev       # Start both server (port 3000) and client (port 5173)
npm run server    # Server only
npm run client    # Client only
npm run build     # TypeScript compile + Vite build
```
