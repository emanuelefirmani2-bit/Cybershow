import { useState, useEffect, useCallback, useRef } from 'react'
import { PlayerState, SOCKET_EVENTS } from '@/types/index'
import type {
  StateChangePayload,
  ScoreUpdatePayload,
  CountdownPayload,
  BuzzerResultPayload,
  AnswerResultPayload,
  ReopenBuzzersPayload,
  StartVotePayload,
  VoteUpdatePayload,
  VoteResultPayload,
  ShowRevealPayload,
  NextQuestionPayload,
  ScoreEntry,
  TeamId,
} from '@/types/index'
import type { Socket } from 'socket.io-client'

export interface GameStateData {
  playerState: PlayerState
  previousState: PlayerState | null
  isPaused: boolean
  scores: ScoreEntry[]
  countdown: number
  buzzerWinner: BuzzerResultPayload | null
  answerResult: AnswerResultPayload | null
  reopenedBuzzers: TeamId[]
  voteOptions: string[]
  voteDuration: number
  voteResults: Record<string, number>
  voteWinner: VoteResultPayload | null
  revealData: ShowRevealPayload | null
  currentQuestion: NextQuestionPayload | null
  stateData: Record<string, unknown>
}

const INITIAL_STATE: GameStateData = {
  playerState: PlayerState.LOGIN,
  previousState: null,
  isPaused: false,
  scores: [],
  countdown: 0,
  buzzerWinner: null,
  answerResult: null,
  reopenedBuzzers: [],
  voteOptions: [],
  voteDuration: 60,
  voteResults: {},
  voteWinner: null,
  revealData: null,
  currentQuestion: null,
  stateData: {},
}

export function useGameState(socket: Socket | null, hasSession: boolean) {
  const [state, setState] = useState<GameStateData>(INITIAL_STATE)
  const previousStateRef = useRef<PlayerState>(PlayerState.LOGIN)

  // Pre-load reveal images for R2/R3
  const preloadImage = useCallback((url: string) => {
    const img = new Image()
    img.src = url
  }, [])

  useEffect(() => {
    if (!socket) return

    const handlers: Array<() => void> = []

    const listen = <T>(event: string, handler: (data: T) => void) => {
      socket.on(event, handler as (...args: unknown[]) => void)
      handlers.push(() => socket.off(event, handler as (...args: unknown[]) => void))
    }

    listen<StateChangePayload>(SOCKET_EVENTS.STATE_CHANGE, (payload) => {
      setState((prev) => {
        previousStateRef.current = prev.playerState
        return {
          ...prev,
          playerState: payload.state,
          previousState: prev.playerState,
          stateData: payload.data ?? {},
          // Clear transient state on certain transitions
          ...(payload.state === PlayerState.BUZZER_ACTIVE
            ? { buzzerWinner: null, answerResult: null }
            : {}),
          ...(payload.state === PlayerState.WAITING
            ? { buzzerWinner: null, answerResult: null, revealData: null, voteWinner: null }
            : {}),
          ...(payload.state === PlayerState.VOTE_SOUND
            ? { voteResults: {}, voteWinner: null }
            : {}),
        }
      })
    })

    listen<CountdownPayload>(SOCKET_EVENTS.COUNTDOWN, (payload) => {
      setState((prev) => ({ ...prev, countdown: payload.seconds }))
    })

    listen<BuzzerResultPayload>(SOCKET_EVENTS.BUZZER_RESULT, (payload) => {
      setState((prev) => ({ ...prev, buzzerWinner: payload }))
    })

    listen<AnswerResultPayload>(SOCKET_EVENTS.ANSWER_RESULT, (payload) => {
      setState((prev) => ({ ...prev, answerResult: payload }))
    })

    listen<ReopenBuzzersPayload>(SOCKET_EVENTS.REOPEN_BUZZERS, (payload) => {
      setState((prev) => ({ ...prev, reopenedBuzzers: payload.buzzedTeams }))
    })

    listen<ScoreUpdatePayload>(SOCKET_EVENTS.SCORE_UPDATE, (payload) => {
      setState((prev) => ({ ...prev, scores: payload.scores }))
    })

    listen<StartVotePayload>(SOCKET_EVENTS.START_VOTE, (payload) => {
      // Flatten options for this player's team
      const allOptions: string[] = []
      for (const opts of Object.values(payload.options)) {
        allOptions.push(...opts)
      }
      setState((prev) => ({
        ...prev,
        voteOptions: allOptions,
        voteDuration: payload.durationSeconds,
        voteResults: {},
      }))
    })

    listen<VoteUpdatePayload>(SOCKET_EVENTS.VOTE_UPDATE, (payload) => {
      setState((prev) => ({ ...prev, voteResults: payload.votes }))
    })

    listen<VoteResultPayload>(SOCKET_EVENTS.VOTE_RESULT, (payload) => {
      setState((prev) => ({ ...prev, voteWinner: payload }))
    })

    listen<ShowRevealPayload>(SOCKET_EVENTS.SHOW_REVEAL, (payload) => {
      setState((prev) => ({ ...prev, revealData: payload }))
    })

    listen<NextQuestionPayload>(SOCKET_EVENTS.NEXT_QUESTION, (payload) => {
      setState((prev) => ({
        ...prev,
        currentQuestion: payload,
        buzzerWinner: null,
        answerResult: null,
        revealData: null,
      }))
    })

    // Pre-load reveal images when a new question arrives
    listen<NextQuestionPayload>(SOCKET_EVENTS.NEXT_QUESTION, (payload) => {
      if (payload.round === 2 || payload.round === 3) {
        // FIX(Agent7): correct path — media files live at /media/<questionId>/reveal.jpg
        preloadImage(`/media/${payload.questionId}/reveal.jpg`)
      }
    })

    listen(SOCKET_EVENTS.GAME_PAUSED, () => {
      setState((prev) => ({ ...prev, isPaused: true }))
    })

    listen(SOCKET_EVENTS.GAME_RESUMED, () => {
      setState((prev) => ({ ...prev, isPaused: false }))
    })

    return () => {
      handlers.forEach((cleanup) => cleanup())
    }
  }, [socket, preloadImage])

  // Set state to LOBBY once session is established (and currently LOGIN)
  useEffect(() => {
    if (hasSession && state.playerState === PlayerState.LOGIN) {
      setState((prev) => ({ ...prev, playerState: PlayerState.LOBBY }))
    }
  }, [hasSession, state.playerState])

  return state
}
