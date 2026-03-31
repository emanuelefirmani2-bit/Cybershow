/**
 * CyberShow Interactive 2026 — Express + Socket.io Server
 * FINAL ASSEMBLY — Agent 7: Integration & Wiring End-to-End
 *
 * Initialization order: DB → StateStore.loadState() → Express routes → Socket.io → MIDI → listen
 */

import express from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import { questionsRouter } from './api/questions.js'
import { mediaRouter } from './media/mediaServer.js'
import { GameEngine } from './game/GameEngine.js'
import { registerSocketHandlers, createRegiaToken, EVENT_CODE } from './socket/handlers.js'
import { BotSimulator } from './bot/BotSimulator.js'
import { isInRegiaRoom } from './socket/rooms.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = parseInt(process.env['PORT'] ?? '3000', 10)
const NODE_ENV = process.env['NODE_ENV'] ?? 'development'

// ---------------------------------------------------------------------------
// 1. DB is initialized at import time (server/db/index.ts runs on first import)
//    StateStore.load() is called inside GameEngine constructor
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 2. Express app
// ---------------------------------------------------------------------------

const app = express()

app.use(cors({
  origin: NODE_ENV === 'development' ? true : false,
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// FIX(Agent7): Wire dedicated mediaRouter with proper cache/CORS headers (was raw express.static)
app.use('/media', mediaRouter)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: Date.now() })
})

// API routes
app.use('/api/questions', questionsRouter)

// Regia authentication endpoint
app.post('/api/regia/auth', (req, res) => {
  const body = req.body as { eventCode?: string }
  if (body.eventCode === EVENT_CODE) {
    const token = createRegiaToken()
    res.json({ success: true, token })
  } else {
    res.status(401).json({ success: false, error: 'Invalid event code' })
  }
})

// FIX(Agent7): Serve Vite production build in production mode
if (NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist')
  app.use(express.static(distPath))

  // SPA catch-all — all non-API routes serve index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

// ---------------------------------------------------------------------------
// 3. HTTP server + Socket.io
// ---------------------------------------------------------------------------

const httpServer = createServer(app)

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: NODE_ENV === 'development' ? true : false,
    credentials: true,
  },
  pingTimeout: 10000,
  pingInterval: 2000,
})

// ---------------------------------------------------------------------------
// 4. Game Engine (StateStore.load() happens in constructor)
// ---------------------------------------------------------------------------

const engine = new GameEngine(io)

// Transition to LOBBY on startup (if not restoring a different phase)
if (engine.store.gameState.phase === 'SETUP') {
  engine.transitionToLobby()
}

// ---------------------------------------------------------------------------
// 5. Socket.io Handlers — Register all 40+ event handlers
// ---------------------------------------------------------------------------

registerSocketHandlers(io, engine)

// ---------------------------------------------------------------------------
// 5b. Bot Simulator — Demo mode (Agent 8)
// ---------------------------------------------------------------------------

const botSimulator = new BotSimulator()

io.on('connection', (socket) => {
  // Demo bot commands — Regia only
  socket.on('CMD_START_DEMO', (payload: { numBots: number }) => {
    if (!isInRegiaRoom(socket)) return
    const teamCount = engine.store.gameState.config.teamCount
    botSimulator.start(payload.numBots, teamCount)
    // Notify all clients about demo mode
    io.emit('DEMO_MODE', true)
    io.to('regia').emit('DEMO_STATUS', { running: true })
  })

  socket.on('CMD_STOP_DEMO', () => {
    if (!isInRegiaRoom(socket)) return
    botSimulator.stop()
    io.emit('DEMO_MODE', false)
    io.to('regia').emit('DEMO_STATUS', { running: false })
  })

  socket.on('CMD_GET_BOT_STATUS', () => {
    if (!isInRegiaRoom(socket)) return
    socket.emit('BOT_STATUS', botSimulator.getStatus())
  })

  socket.on('CMD_GET_BOT_REPORT', () => {
    if (!isInRegiaRoom(socket)) return
    socket.emit('BOT_REPORT', botSimulator.getReport())
  })

  // Debug: trigger a MIDI note manually
  socket.on('DEBUG_MIDI_TRIGGER', (payload: { note: number }) => {
    if (!isInRegiaRoom(socket)) return
    engine.midi.sendNote(payload.note)
  })

  // Debug: play a specific team sound
  socket.on('DEBUG_PLAY_TEAM_SOUND', (payload: { teamId: string }) => {
    if (!isInRegiaRoom(socket)) return
    io.to('regia').emit('PLAY_TEAM_SOUND', { teamId: payload.teamId })
  })

  // Debug: disconnect a random bot then reconnect
  socket.on('DEBUG_BOT_DISCONNECT', () => {
    if (!isInRegiaRoom(socket)) return
    botSimulator.simulateDisconnectReconnect()
  })
})

// Bot status endpoint for debug mode
app.get('/api/bots/status', (_req, res) => {
  res.json({
    running: botSimulator.isRunning,
    bots: botSimulator.getStatus(),
  })
})

// Bot report with logs, errors, and stats
app.get('/api/bots/report', (_req, res) => {
  res.json(botSimulator.getReport())
})

// Bot logs (supports ?since=<timestamp> for incremental fetch)
app.get('/api/bots/logs', (req, res) => {
  const since = req.query['since'] ? parseInt(req.query['since'] as string, 10) : undefined
  res.json(botSimulator.getLogs(since))
})

// ---------------------------------------------------------------------------
// 6. MIDI controller — graceful degradation, never blocks startup
// ---------------------------------------------------------------------------

engine.midi.init().catch((err: unknown) => {
  console.warn('[Server] MIDI init warning:', err)
})

// ---------------------------------------------------------------------------
// 7. Graceful shutdown (SIGINT/SIGTERM)
// ---------------------------------------------------------------------------

function gracefulShutdown(): void {
  console.log('\n[Server] Shutting down gracefully...')
  botSimulator.stop()
  engine.shutdown()
  httpServer.close(() => {
    console.log('[Server] HTTP server closed')
    process.exit(0)
  })
  // Force exit after 5s if shutdown hangs
  setTimeout(() => {
    console.warn('[Server] Forced exit after 5s timeout')
    process.exit(1)
  }, 5000)
}

process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)

// ---------------------------------------------------------------------------
// 8. Start server
// ---------------------------------------------------------------------------

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n[Server] CyberShow Server running on http://0.0.0.0:${PORT}`)
  console.log(`   Environment: ${NODE_ENV}`)
  console.log(`   MIDI: ${engine.midi.mock ? 'MOCK mode' : 'Connected'}`)
  console.log(`   Health: http://localhost:${PORT}/health\n`)
})

export { io, app, engine }
