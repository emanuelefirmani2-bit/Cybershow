// =============================================================================
// CYBERSHOW 2026 — BotSimulator
// Simulates N bot players as real Socket.io clients for demo/testing.
// Owner: Agent 8
// =============================================================================

import { io, Socket } from 'socket.io-client'
import type {
  TeamId,
  PlayerState,
  BuzzerResultPayload,
  StateChangePayload,
} from '../../src/types/index.js'
import { SOCKET_EVENTS } from '../../src/types/index.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BotInstance {
  id: number
  name: string
  teamId: TeamId
  socket: Socket
  playerId: string | null
  state: string
  sessionToken: string | null
}

export interface BotStatus {
  id: number
  name: string
  teamId: TeamId
  playerId: string | null
  state: string
  connected: boolean
}

export type BotLogLevel = 'info' | 'warn' | 'error'

export interface BotLogEntry {
  timestamp: number
  level: BotLogLevel
  botName: string
  message: string
}

const MAX_LOG_ENTRIES = 500

// ---------------------------------------------------------------------------
// Timing constants (realistic human-like delays)
// ---------------------------------------------------------------------------

const VOTE_DELAY_MIN = 2000
const VOTE_DELAY_MAX = 5000
const BUZZER_DELAY_MIN = 1000
const BUZZER_DELAY_MAX = 3000
const ANSWER_DELAY_MIN = 3000
const ANSWER_DELAY_MAX = 5000

function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ---------------------------------------------------------------------------
// BotSimulator
// ---------------------------------------------------------------------------

const TEAM_IDS: TeamId[] = ['blue', 'red', 'green', 'yellow']

export class BotSimulator {
  private bots: BotInstance[] = []
  private running = false
  private serverUrl: string
  private timers: ReturnType<typeof setTimeout>[] = []
  private answerToggle = false
  private logs: BotLogEntry[] = []
  private stats = { joined: 0, votes: 0, buzzes: 0, answers: 0, errors: 0, disconnects: 0 }

  constructor(serverUrl?: string) {
    const port = process.env['PORT'] ?? '3000'
    this.serverUrl = serverUrl ?? `http://127.0.0.1:${port}`
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  get isRunning(): boolean {
    return this.running
  }

  start(numBots: number, teamCount: 2 | 3 | 4 = 4): void {
    if (this.running) {
      this.log('warn', 'SYSTEM', 'Already running — call stop() first')
      return
    }

    const clampedBots = Math.max(4, Math.min(50, numBots))
    const activeTeams = TEAM_IDS.slice(0, teamCount)

    this.logs = []
    this.stats = { joined: 0, votes: 0, buzzes: 0, answers: 0, errors: 0, disconnects: 0 }
    this.running = true
    this.answerToggle = false
    this.log('info', 'SYSTEM', `Starting ${clampedBots} bots across ${teamCount} teams`)

    for (let i = 0; i < clampedBots; i++) {
      const teamId = activeTeams[i % activeTeams.length]!
      const bot = this.createBot(i + 1, teamId)
      this.bots.push(bot)
    }
  }

  stop(): void {
    if (!this.running) return
    this.log('info', 'SYSTEM', `Stopping ${this.bots.length} bots`)

    for (const timer of this.timers) {
      clearTimeout(timer)
    }
    this.timers = []

    for (const bot of this.bots) {
      bot.socket.disconnect()
    }
    this.bots = []
    this.running = false

    this.log('info', 'SYSTEM', 'All bots stopped')
  }

  getStatus(): BotStatus[] {
    return this.bots.map(bot => ({
      id: bot.id,
      name: bot.name,
      teamId: bot.teamId,
      playerId: bot.playerId,
      state: bot.state,
      connected: bot.socket.connected,
    }))
  }

  getLogs(since?: number): BotLogEntry[] {
    if (since) {
      return this.logs.filter(e => e.timestamp > since)
    }
    return [...this.logs]
  }

  getReport(): {
    running: boolean
    botCount: number
    stats: typeof this.stats
    errors: BotLogEntry[]
    recentLogs: BotLogEntry[]
  } {
    return {
      running: this.running,
      botCount: this.bots.length,
      stats: { ...this.stats },
      errors: this.logs.filter(e => e.level === 'error'),
      recentLogs: this.logs.slice(-50),
    }
  }

  private log(level: BotLogLevel, botName: string, message: string): void {
    const entry: BotLogEntry = { timestamp: Date.now(), level, botName, message }
    this.logs.push(entry)
    if (this.logs.length > MAX_LOG_ENTRIES) {
      this.logs.splice(0, this.logs.length - MAX_LOG_ENTRIES)
    }
    const prefix = level === 'error' ? '!!!' : level === 'warn' ? '!' : ''
    console.log(`[BotSimulator] ${prefix}[${botName}] ${message}`)
  }

  simulateDisconnectReconnect(): void {
    if (!this.running || this.bots.length === 0) return
    const idx = Math.floor(Math.random() * this.bots.length)
    const bot = this.bots[idx]!
    console.log(`[BotSimulator] Simulating disconnect for ${bot.name}`)
    bot.socket.disconnect()
    // Reconnect after 3 seconds
    const timer = setTimeout(() => {
      if (!this.running) return
      console.log(`[BotSimulator] Reconnecting ${bot.name}`)
      bot.socket.connect()
    }, 3000)
    this.timers.push(timer)
  }

  // -------------------------------------------------------------------------
  // Bot creation & event wiring
  // -------------------------------------------------------------------------

  private createBot(index: number, teamId: TeamId): BotInstance {
    const name = `Bot-${String(index).padStart(2, '0')}`

    const socket = io(this.serverUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true,
    })

    const bot: BotInstance = {
      id: index,
      name,
      teamId,
      socket,
      playerId: null,
      state: 'CONNECTING',
      sessionToken: null,
    }

    socket.on('connect', () => {
      bot.state = 'CONNECTED'
      this.log('info', name, `Connected (socket ${socket.id})`)
      socket.emit(SOCKET_EVENTS.PLAYER_JOIN, { name, teamId })
    })

    socket.on('session', (data: { playerId: string; sessionToken: string }) => {
      bot.playerId = data.playerId
      bot.sessionToken = data.sessionToken
      bot.state = 'JOINED'
      this.stats.joined++
      this.log('info', name, `Joined team ${teamId} (playerId: ${data.playerId})`)
    })

    socket.on('error', (err: { message: string }) => {
      this.stats.errors++
      this.log('error', name, `Server error: ${err.message}`)
    })

    socket.on('connect_error', (err: Error) => {
      this.stats.errors++
      this.log('error', name, `Connection error: ${err.message}`)
    })

    socket.on('disconnect', (reason: string) => {
      bot.state = 'DISCONNECTED'
      this.stats.disconnects++
      this.log('warn', name, `Disconnected: ${reason}`)
    })

    // Track state changes and react accordingly
    socket.on(SOCKET_EVENTS.STATE_CHANGE, (payload: StateChangePayload) => {
      bot.state = payload.state
      this.handleStateChange(bot, payload.state as PlayerState)
    })

    // Track vote start
    socket.on(SOCKET_EVENTS.START_VOTE, (payload: { options: Record<TeamId, string[]> }) => {
      bot.state = 'VOTE_SOUND'
      const teamOptions = payload.options[teamId]
      if (teamOptions && teamOptions.length > 0) {
        this.scheduleVote(bot, teamOptions)
      }
    })

    // Track buzzer result — bot needs to know if it's the responder
    socket.on(SOCKET_EVENTS.BUZZER_RESULT, (payload: BuzzerResultPayload) => {
      if (payload.winnerPlayerId === bot.playerId) {
        bot.state = 'GREEN_RESPONDER'
        this.scheduleAnswer(bot)
      }
    })

    return bot
  }

  // -------------------------------------------------------------------------
  // Autonomous behavior
  // -------------------------------------------------------------------------

  private handleStateChange(bot: BotInstance, state: PlayerState): void {
    switch (state) {
      case 'BUZZER_ACTIVE':
        this.scheduleBuzzerPress(bot)
        break
      // Other states don't need autonomous action
    }
  }

  private scheduleVote(bot: BotInstance, options: string[]): void {
    if (!this.running) return
    const delay = randomDelay(VOTE_DELAY_MIN, VOTE_DELAY_MAX)
    const timer = setTimeout(() => {
      if (!this.running || !bot.socket.connected) return
      const soundId = options[Math.floor(Math.random() * options.length)]!
      bot.socket.emit(SOCKET_EVENTS.CAST_VOTE, { soundId })
      bot.state = 'VOTED'
      this.stats.votes++
      this.log('info', bot.name, `Voted for ${soundId}`)
    }, delay)
    this.timers.push(timer)
  }

  private scheduleBuzzerPress(bot: BotInstance): void {
    if (!this.running) return
    const delay = randomDelay(BUZZER_DELAY_MIN, BUZZER_DELAY_MAX)
    const timer = setTimeout(() => {
      if (!this.running || !bot.socket.connected || !bot.playerId) return
      // Only press if still in BUZZER_ACTIVE state
      if (bot.state !== 'BUZZER_ACTIVE') return
      bot.socket.emit(SOCKET_EVENTS.BUZZER_PRESS, {
        playerId: bot.playerId,
        teamId: bot.teamId,
        timestamp: Date.now(),
      })
      this.stats.buzzes++
      this.log('info', bot.name, 'Pressed buzzer')
    }, delay)
    this.timers.push(timer)
  }

  private scheduleAnswer(bot: BotInstance): void {
    if (!this.running) return
    const delay = randomDelay(ANSWER_DELAY_MIN, ANSWER_DELAY_MAX)
    const timer = setTimeout(() => {
      if (!this.running || !bot.socket.connected) return
      // Alternate correct/wrong answers
      this.answerToggle = !this.answerToggle
      const answer = this.answerToggle ? 'correct-answer-placeholder' : 'wrong-answer-bot'
      bot.socket.emit(SOCKET_EVENTS.SUBMIT_ANSWER, { answer })
      this.stats.answers++
      this.log('info', bot.name, `Submitted answer: "${answer}"`)
    }, delay)
    this.timers.push(timer)
  }
}
