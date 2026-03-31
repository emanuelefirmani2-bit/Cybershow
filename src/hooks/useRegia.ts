import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { SOCKET_EVENTS } from '@/types/index'
import type {
  GameState,
  TeamId,
  ChatMessage,
  Player,
  TeamUpdatePayload,
  ScoreUpdatePayload,
  NextQuestionPayload,
  NextRoundPayload,
  BuzzerResultPayload,
  AnswerResultPayload,
  CmdBonusPayload,
  CmdKickPlayerPayload,
  CmdRenamePlayerPayload,
  CmdPlayTrackPayload,
  CmdOverrideAnswerPayload,
} from '@/types/index'

const SERVER_URL = ''
const TOKEN_KEY = 'cybershow-regia-token'

export interface GameLogEntry {
  timestamp: string
  questionId: string
  round: number
  teamId: string
  playerName: string
  answer: string
  result: 'correct' | 'wrong' | 'skip' | 'interrupted'
  points: number
  responseTimeMs: number
}

interface RegiaState {
  authenticated: boolean
  connected: boolean
  isPaused: boolean
  gameState: GameState | null
  teams: Array<{ id: TeamId; name: string; count: number }>
  chatMessages: Record<TeamId, ChatMessage[]>
  players: Player[]
  lastScoreAction: string | null
  gameLog: GameLogEntry[]
}

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function storeToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // ignore
  }
}

function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore
  }
}

const INITIAL_STATE: RegiaState = {
  authenticated: false,
  connected: false,
  isPaused: false,
  gameState: null,
  teams: [],
  chatMessages: { blue: [], red: [], green: [], yellow: [] },
  players: [],
  lastScoreAction: null,
  gameLog: [],
}

export function useRegia() {
  const socketRef = useRef<Socket | null>(null)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [state, setState] = useState<RegiaState>(INITIAL_STATE)
  // Track socket instance in state so consumers re-render when it changes
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null)

  const connectSocket = useCallback((token: string) => {
    if (socketRef.current) {
      socketRef.current.disconnect()
    }

    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    socketRef.current = socket
    setSocketInstance(socket)

    socket.on('connect', () => {
      console.log('[useRegia] Authenticated socket connected:', socket.id)
      setState(prev => ({ ...prev, connected: true, authenticated: true }))

      // Start heartbeat every 2s
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      heartbeatRef.current = setInterval(() => {
        socket.emit(SOCKET_EVENTS.REGIA_HEARTBEAT)
      }, 2000)
    })

    socket.on('disconnect', () => {
      setState(prev => ({ ...prev, connected: false }))
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
    })

    // Game state sync
    socket.on('GAME_STATE_SYNC', (gs: GameState) => {
      setState(prev => ({ ...prev, gameState: gs }))
    })

    socket.on(SOCKET_EVENTS.TEAM_UPDATE, (payload: TeamUpdatePayload) => {
      setState(prev => ({ ...prev, teams: payload.teams }))
    })

    socket.on(SOCKET_EVENTS.SCORE_UPDATE, (payload: ScoreUpdatePayload) => {
      setState(prev => {
        if (!prev.gameState) return prev
        return {
          ...prev,
          gameState: { ...prev.gameState, scores: payload.scores },
        }
      })
    })

    socket.on(SOCKET_EVENTS.NEXT_QUESTION, (payload: NextQuestionPayload) => {
      setState(prev => {
        if (!prev.gameState) return prev
        return {
          ...prev,
          gameState: {
            ...prev.gameState,
            currentQuestionId: payload.questionId,
            currentQuestionNum: payload.questionNum,
            totalQuestionsInRound: payload.totalQuestions,
            currentRound: payload.round,
          },
          chatMessages: { blue: [], red: [], green: [], yellow: [] },
        }
      })
    })

    socket.on(SOCKET_EVENTS.NEXT_ROUND, (payload: NextRoundPayload) => {
      setState(prev => {
        if (!prev.gameState) return prev
        return {
          ...prev,
          gameState: {
            ...prev.gameState,
            currentRound: payload.round,
            currentQuestionNum: 0,
            buzzedTeams: [],
          },
        }
      })
    })

    socket.on(SOCKET_EVENTS.BUZZER_RESULT, (payload: BuzzerResultPayload) => {
      setState(prev => {
        if (!prev.gameState) return prev
        return {
          ...prev,
          gameState: {
            ...prev.gameState,
            activeResponderId: payload.winnerPlayerId,
            activeResponderTeamId: payload.winnerTeamId,
            buzzedTeams: [...prev.gameState.buzzedTeams, payload.winnerTeamId],
          },
        }
      })
    })

    socket.on(SOCKET_EVENTS.ANSWER_RESULT, (payload: AnswerResultPayload) => {
      setState(prev => {
        if (!prev.gameState) return prev

        // Find player name from active responder before clearing
        const responderId = prev.gameState.activeResponderId
        const responderPlayer = responderId
          ? prev.players.find(p => p.id === responderId)
          : null

        const logEntry: GameLogEntry = {
          timestamp: new Date().toISOString(),
          questionId: prev.gameState.currentQuestionId ?? '',
          round: prev.gameState.currentRound ?? 0,
          teamId: payload.teamId,
          playerName: responderPlayer?.name ?? 'unknown',
          answer: payload.answer,
          result: payload.correct ? 'correct' : 'wrong',
          points: payload.correct ? (prev.gameState.config.pointsPerCorrectAnswer ?? 10) : 0,
          responseTimeMs: prev.gameState.answerTimerStartedAt
            ? Date.now() - prev.gameState.answerTimerStartedAt
            : 0,
        }

        return {
          ...prev,
          gameState: {
            ...prev.gameState,
            activeResponderId: null,
            activeResponderTeamId: null,
          },
          lastScoreAction: payload.correct
            ? `+pts to ${payload.teamId}`
            : `Wrong by ${payload.teamId}`,
          gameLog: [...prev.gameLog, logEntry],
        }
      })
    })

    socket.on(SOCKET_EVENTS.GAME_PAUSED, () => {
      setState(prev => ({ ...prev, isPaused: true }))
    })

    socket.on(SOCKET_EVENTS.GAME_RESUMED, () => {
      setState(prev => ({ ...prev, isPaused: false }))
    })

    socket.on(SOCKET_EVENTS.STATE_CHANGE, (_payload: { state: string; data?: Record<string, unknown> }) => {
      // State changes for regia are handled via GAME_STATE_SYNC
    })

    // Chat messages from all teams
    socket.on(SOCKET_EVENTS.CHAT_BROADCAST, (payload: ChatMessage & { teamId: TeamId }) => {
      setState(prev => {
        const teamId = payload.teamId
        const existing = prev.chatMessages[teamId] ?? []
        const updated = [...existing, payload].slice(-20)
        return {
          ...prev,
          chatMessages: { ...prev.chatMessages, [teamId]: updated },
        }
      })
    })

    // Player list sync
    socket.on('PLAYER_LIST_SYNC', (players: Player[]) => {
      setState(prev => ({ ...prev, players }))
    })

    // FIX(Agent7): Listen for RENAME_PLAYER to update local player list in real-time
    socket.on(SOCKET_EVENTS.RENAME_PLAYER, (payload: { playerId: string; newName: string }) => {
      setState(prev => ({
        ...prev,
        players: prev.players.map(p =>
          p.id === payload.playerId ? { ...p, name: payload.newName } : p
        ),
      }))
    })

    return socket
  }, [])

  // Try to reconnect with stored token on mount
  useEffect(() => {
    const stored = getStoredToken()
    if (stored) {
      connectSocket(stored)
    }

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [connectSocket])

  // Auth: send event code, get JWT
  const authenticate = useCallback((eventCode: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // Create a temporary socket for auth
      const tempSocket = socketRef.current ?? io(SERVER_URL, {
        transports: ['websocket', 'polling'],
      })

      if (!socketRef.current) {
        socketRef.current = tempSocket
      }

      const doAuth = () => {
        console.log('[useRegia] Sending REGIA_AUTH...')
        tempSocket.emit('REGIA_AUTH', { eventCode }, (response: { success: boolean; token?: string; error?: string }) => {
          console.log('[useRegia] REGIA_AUTH response:', response)
          if (response.success && response.token) {
            storeToken(response.token)
            // Reconnect with the token in auth header
            tempSocket.disconnect()
            connectSocket(response.token)
            resolve(true)
          } else {
            // Disconnect the unauthenticated socket to avoid zombie connections
            tempSocket.disconnect()
            socketRef.current = null
            resolve(false)
          }
        })
      }

      tempSocket.on('connect_error', (err) => {
        console.error('[useRegia] Socket connect error:', err.message)
      })

      if (tempSocket.connected) {
        console.log('[useRegia] Socket already connected, calling doAuth')
        doAuth()
      } else {
        console.log('[useRegia] Socket not connected, waiting...')
        tempSocket.once('connect', () => {
          console.log('[useRegia] Socket connected, calling doAuth')
          doAuth()
        })
      }
    })
  }, [connectSocket])

  const logout = useCallback(() => {
    clearToken()
    if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    if (socketRef.current) socketRef.current.disconnect()
    socketRef.current = null
    setSocketInstance(null)
    setState(INITIAL_STATE)
  }, [])

  // ---- All 18 CMD_* commands ----

  const emit = useCallback((event: string, data?: unknown) => {
    console.log(`[useRegia] emit ${event}`, data ?? '', `connected=${socketRef.current?.connected}`)
    socketRef.current?.emit(event, data)
  }, [])

  const cmdSendConfig = useCallback((config: unknown) => {
    emit('GAME_CONFIG', config)
  }, [emit])

  const cmdStartVote = useCallback(() => {
    emit(SOCKET_EVENTS.CMD_START_VOTE)
  }, [emit])

  const cmdEndVote = useCallback(() => {
    emit(SOCKET_EVENTS.CMD_END_VOTE)
  }, [emit])

  const cmdStartGame = useCallback(() => {
    emit(SOCKET_EVENTS.CMD_START_GAME)
  }, [emit])

  const cmdPlayTrack = useCallback((questionId: string) => {
    const payload: CmdPlayTrackPayload = { questionId }
    emit(SOCKET_EVENTS.CMD_PLAY_TRACK, payload)
  }, [emit])

  const cmdStopAudio = useCallback(() => {
    emit(SOCKET_EVENTS.CMD_STOP_AUDIO)
  }, [emit])

  const cmdStartQuestion = useCallback(() => {
    emit(SOCKET_EVENTS.CMD_START_QUESTION)
  }, [emit])

  const cmdNextQuestion = useCallback(() => {
    emit(SOCKET_EVENTS.CMD_NEXT_QUESTION)
  }, [emit])

  const cmdNextRound = useCallback(() => {
    emit(SOCKET_EVENTS.CMD_NEXT_ROUND)
  }, [emit])

  const cmdOverrideAnswer = useCallback((correct: boolean) => {
    const payload: CmdOverrideAnswerPayload = { correct }
    emit(SOCKET_EVENTS.CMD_OVERRIDE_ANSWER, payload)
  }, [emit])

  const cmdSkipQuestion = useCallback(() => {
    emit(SOCKET_EVENTS.CMD_SKIP_QUESTION)
  }, [emit])

  const cmdResetSoft = useCallback(() => {
    emit(SOCKET_EVENTS.CMD_RESET_SOFT)
  }, [emit])

  const cmdBonus = useCallback((teamId: TeamId, points: number) => {
    const payload: CmdBonusPayload = { teamId, points }
    emit(SOCKET_EVENTS.CMD_BONUS, payload)
  }, [emit])

  const cmdUndoScore = useCallback(() => {
    emit(SOCKET_EVENTS.CMD_UNDO_SCORE)
  }, [emit])

  const cmdKickPlayer = useCallback((playerId: string) => {
    const payload: CmdKickPlayerPayload = { playerId }
    emit(SOCKET_EVENTS.CMD_KICK_PLAYER, payload)
  }, [emit])

  const cmdRenamePlayer = useCallback((playerId: string, newName: string) => {
    const payload: CmdRenamePlayerPayload = { playerId, newName }
    emit(SOCKET_EVENTS.CMD_RENAME_PLAYER, payload)
  }, [emit])

  const cmdSuspense = useCallback(() => {
    emit(SOCKET_EVENTS.CMD_SUSPENSE)
  }, [emit])

  const cmdOkFinale = useCallback(() => {
    emit(SOCKET_EVENTS.CMD_OK_FINALE)
  }, [emit])

  const cmdKickAll = useCallback(() => {
    emit(SOCKET_EVENTS.CMD_KICK_ALL)
  }, [emit])

  return {
    ...state,
    authenticate,
    logout,
    emit,
    socket: socketInstance,
    cmdSendConfig,
    cmdStartVote,
    cmdEndVote,
    cmdStartGame,
    cmdPlayTrack,
    cmdStopAudio,
    cmdStartQuestion,
    cmdNextQuestion,
    cmdNextRound,
    cmdOverrideAnswer,
    cmdSkipQuestion,
    cmdResetSoft,
    cmdBonus,
    cmdUndoScore,
    cmdKickPlayer,
    cmdRenamePlayer,
    cmdSuspense,
    cmdOkFinale,
    cmdKickAll,
  }
}
