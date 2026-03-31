// =============================================================================
// CYBERSHOW 2026 — Socket.io Event Handlers
// All 40+ events from §19, JWT auth for Regia, heartbeat
// Owner: Agent 2
// =============================================================================

import type { Server as SocketIOServer, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import type {
  PlayerJoinPayload,
  CastVotePayload,
  BuzzerPressPayload,
  SubmitAnswerPayload,
  ChatMessagePayload,
  CmdOverrideAnswerPayload,
  CmdBonusPayload,
  CmdKickPlayerPayload,
  CmdRenamePlayerPayload,
  CmdPlayTrackPayload,
  TeamId,
} from '../../src/types/index.js'
import { SOCKET_EVENTS, SOCKET_ROOMS, PlayerState, teamRoom } from '../../src/types/index.js'
import type { GameEngine } from '../game/GameEngine.js'
import { joinPlayerRooms, joinRegiaRoom, isInRegiaRoom } from './rooms.js'

// ---------------------------------------------------------------------------
// JWT config
// ---------------------------------------------------------------------------

const JWT_SECRET = process.env['JWT_SECRET'] ?? 'cybershow-default-secret-change-me'
// FIX(Agent7): align env var name with .env.example (EVENT_SECRET_KEY), fallback to EVENT_CODE for compat
const EVENT_CODE = process.env['EVENT_SECRET_KEY'] ?? process.env['EVENT_CODE'] ?? 'CYBER2026'
const JWT_EXPIRY = '12h'

interface JwtPayload {
  role: 'regia'
  iat: number
  exp: number
}

function verifyRegiaToken(token: string): boolean {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    return decoded.role === 'regia'
  } catch {
    return false
  }
}

function createRegiaToken(): string {
  return jwt.sign({ role: 'regia' }, JWT_SECRET, { expiresIn: JWT_EXPIRY })
}

// ---------------------------------------------------------------------------
// Register all handlers
// ---------------------------------------------------------------------------

export function registerSocketHandlers(io: SocketIOServer, engine: GameEngine): void {
  // --- REST endpoint for Regia auth (mounted on express in server/index.ts) ---
  // Exposed as a function so server/index.ts can wire it

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`)

    // Check for Regia auth token in handshake
    const authToken = socket.handshake.auth['token'] as string | undefined
    console.log(`[Socket] Auth token present: ${!!authToken}`)
    const isRegia = authToken ? verifyRegiaToken(authToken) : false
    console.log(`[Socket] isRegia: ${isRegia}`)

    if (isRegia) {
      joinRegiaRoom(socket)
      console.log(`[Socket] Regia client connected: ${socket.id}`)
      // FIX(Agent7): Send full game state + player list to Regia on connect
      socket.emit('GAME_STATE_SYNC', engine.getRegiaState())
      socket.emit('PLAYER_LIST_SYNC', engine.getPlayerList())
    }

    // Send team list immediately so LoginForm can render team buttons
    engine.emitTeamUpdate(socket)

    // Check for session token (reconnection)
    const sessionToken = socket.handshake.auth['sessionToken'] as string | undefined

    // ==================================================================
    // CLIENT → SERVER: Player events
    // ==================================================================

    socket.on(SOCKET_EVENTS.PLAYER_JOIN, (payload: PlayerJoinPayload) => {
      const { name, teamId } = payload

      if (!name || !teamId) {
        socket.emit('error', { message: 'Name and teamId are required' })
        return
      }

      const result = engine.sessionManager.handleJoin(socket, name, teamId, sessionToken)

      if ('error' in result) {
        socket.emit('error', { message: result.error })
        return
      }

      const { player, reconnected } = result

      // Send session token to client via acknowledgement
      socket.emit('session', {
        playerId: player.id,
        sessionToken: player.sessionToken,
        teamId: player.teamId,
        name: player.name,
        reconnected,
      })

      // Join rooms
      joinPlayerRooms(socket, player.teamId)

      // Broadcast team count update
      engine.broadcastTeamUpdate()

      // If reconnected, send full state sync
      if (reconnected) {
        engine.emitFullState(socket.id)

        // If this is the active responder reconnecting, cancel grace
        engine.handleResponderReconnect(player.id)
      } else {
        // New player — send current game state
        engine.emitFullState(socket.id)
      }

      // If voting is active and player just joined, send vote options
      if (engine.voteManager.isVotingActive()) {
        const options = engine.voteManager.getTeamOptions(player.teamId)
        if (options.length > 0) {
          socket.emit(SOCKET_EVENTS.START_VOTE, {
            options: { [player.teamId]: options },
            durationSeconds: 60,
          })
        }
      }

      // FIX(Agent7): Sync player list to Regia after join/reconnect
      engine.broadcastRegiaSync()
    })

    socket.on(SOCKET_EVENTS.CAST_VOTE, (payload: CastVotePayload) => {
      const player = engine.store.getPlayerBySocketId(socket.id)
      if (!player) return

      engine.voteManager.castVote(player.id, payload.soundId)
    })

    socket.on(SOCKET_EVENTS.BUZZER_PRESS, (payload: BuzzerPressPayload) => {
      const player = engine.store.getPlayerBySocketId(socket.id)
      if (!player) return

      // Anti-spam: server validates playerId matches socket
      if (payload.playerId !== player.id) return
      if (payload.teamId !== player.teamId) return
      if (player.state !== PlayerState.BUZZER_ACTIVE) return

      engine.handleBuzzerPress({
        playerId: player.id,
        teamId: player.teamId,
        timestamp: payload.timestamp,
      })
    })

    socket.on(SOCKET_EVENTS.SUBMIT_ANSWER, (payload: SubmitAnswerPayload) => {
      const player = engine.store.getPlayerBySocketId(socket.id)
      if (!player) return

      if (player.state !== PlayerState.GREEN_RESPONDER) return

      engine.handleSubmitAnswer(player.id, payload.answer)
    })

    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (payload: ChatMessagePayload) => {
      const player = engine.store.getPlayerBySocketId(socket.id)
      if (!player) return

      engine.handleChatMessage(player.id, payload.message)
    })

    // ==================================================================
    // REGIA → SERVER: Command events (JWT-authenticated)
    // ==================================================================

    // Regia authentication via event code
    socket.on('REGIA_AUTH', (payload: { eventCode: string }, callback?: (response: { success: boolean; token?: string; error?: string }) => void) => {
      if (payload.eventCode === EVENT_CODE) {
        const token = createRegiaToken()
        joinRegiaRoom(socket)
        console.log(`[Socket] Regia authenticated: ${socket.id}`)
        if (callback) {
          callback({ success: true, token })
        }
      } else {
        console.log(`[Socket] Regia auth failed: ${socket.id}`)
        if (callback) {
          callback({ success: false, error: 'Invalid event code' })
        }
      }
    })

    socket.on(SOCKET_EVENTS.REGIA_HEARTBEAT, () => {
      if (!isInRegiaRoom(socket)) return
      engine.handleRegiaHeartbeat()
    })

    // FIX(Agent7): Handle GAME_CONFIG from Regia ConfigPanel
    socket.on('GAME_CONFIG', (config: Record<string, unknown>) => {
      if (!isInRegiaRoom(socket)) return
      engine.updateConfig(config as Partial<import('../../src/types/index.js').GameConfig>)
    })

    socket.on(SOCKET_EVENTS.CMD_START_VOTE, () => {
      console.log(`[Socket] CMD_START_VOTE received, inRegia=${isInRegiaRoom(socket)}, rooms=`, Array.from(socket.rooms))
      if (!isInRegiaRoom(socket)) return
      engine.startVote()
    })

    socket.on(SOCKET_EVENTS.CMD_END_VOTE, () => {
      console.log(`[Socket] CMD_END_VOTE received, inRegia=${isInRegiaRoom(socket)}`)
      if (!isInRegiaRoom(socket)) return
      engine.endVote()
    })

    socket.on(SOCKET_EVENTS.CMD_START_GAME, () => {
      console.log(`[Socket] CMD_START_GAME received, inRegia=${isInRegiaRoom(socket)}, rooms=`, Array.from(socket.rooms))
      if (!isInRegiaRoom(socket)) return
      engine.startGame()
    })

    socket.on(SOCKET_EVENTS.CMD_PLAY_TRACK, (payload: CmdPlayTrackPayload) => {
      if (!isInRegiaRoom(socket)) return
      engine.playTrack(payload.questionId)
    })

    socket.on(SOCKET_EVENTS.CMD_STOP_AUDIO, () => {
      if (!isInRegiaRoom(socket)) return
      engine.stopAudio()
    })

    socket.on(SOCKET_EVENTS.CMD_START_QUESTION, () => {
      if (!isInRegiaRoom(socket)) return
      engine.startQuestion()
    })

    socket.on(SOCKET_EVENTS.CMD_NEXT_QUESTION, () => {
      if (!isInRegiaRoom(socket)) return
      engine.nextQuestion()
    })

    socket.on(SOCKET_EVENTS.CMD_NEXT_ROUND, () => {
      if (!isInRegiaRoom(socket)) return
      engine.nextRound()
    })

    socket.on(SOCKET_EVENTS.CMD_OVERRIDE_ANSWER, (payload: CmdOverrideAnswerPayload) => {
      if (!isInRegiaRoom(socket)) return
      engine.overrideAnswer(payload.correct)
    })

    socket.on(SOCKET_EVENTS.CMD_SKIP_QUESTION, () => {
      if (!isInRegiaRoom(socket)) return
      engine.skipQuestion()
    })

    socket.on(SOCKET_EVENTS.CMD_RESET_SOFT, () => {
      if (!isInRegiaRoom(socket)) return
      engine.resetSoft()
    })

    socket.on(SOCKET_EVENTS.CMD_BONUS, (payload: CmdBonusPayload) => {
      if (!isInRegiaRoom(socket)) return
      engine.scoreManager.applyBonus(payload.teamId, payload.points)
    })

    socket.on(SOCKET_EVENTS.CMD_UNDO_SCORE, () => {
      if (!isInRegiaRoom(socket)) return
      engine.scoreManager.undoLastScore()
    })

    socket.on(SOCKET_EVENTS.CMD_KICK_PLAYER, (payload: CmdKickPlayerPayload) => {
      if (!isInRegiaRoom(socket)) return
      engine.sessionManager.kickPlayer(payload.playerId, 'Kicked by Regia')
      engine.broadcastTeamUpdate()
      // FIX(Agent7): Sync player list to Regia after kick
      engine.broadcastRegiaSync()
    })

    socket.on(SOCKET_EVENTS.CMD_RENAME_PLAYER, (payload: CmdRenamePlayerPayload) => {
      if (!isInRegiaRoom(socket)) return
      const success = engine.sessionManager.renamePlayer(payload.playerId, payload.newName)
      if (success) {
        io.to(SOCKET_ROOMS.GLOBAL).emit(SOCKET_EVENTS.RENAME_PLAYER, {
          playerId: payload.playerId,
          newName: payload.newName,
        })
        // FIX(Agent7): Sync player list to Regia after rename
        engine.broadcastRegiaSync()
      }
    })

    socket.on(SOCKET_EVENTS.CMD_SUSPENSE, () => {
      if (!isInRegiaRoom(socket)) return
      engine.startSuspense()
    })

    socket.on(SOCKET_EVENTS.CMD_OK_FINALE, () => {
      if (!isInRegiaRoom(socket)) return
      engine.startFinale()
    })

    socket.on(SOCKET_EVENTS.CMD_KICK_ALL, () => {
      if (!isInRegiaRoom(socket)) return
      engine.kickAll()
    })

    // ==================================================================
    // DISCONNECT
    // ==================================================================

    socket.on('disconnect', (reason: string) => {
      console.log(`[Socket] Client disconnected: ${socket.id} — ${reason}`)

      const player = engine.sessionManager.handleDisconnect(socket.id)
      if (player) {
        engine.broadcastTeamUpdate()

        // Check if this was the active responder
        engine.handleResponderDisconnect(player.id)

        // FIX(Agent7): Sync player list to Regia after disconnect
        engine.broadcastRegiaSync()
      }
    })
  })
}

export { createRegiaToken, verifyRegiaToken, EVENT_CODE }
