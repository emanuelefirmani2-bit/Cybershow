import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import {
  SOCKET_EVENTS,
  LedwallState,
} from '@/types/index'
import type {
  TeamId,
  Round,
  ScoreEntry,
  BuzzerResultPayload,
  CountdownPayload,
  NextQuestionPayload,
  NextRoundPayload,
  ScoreUpdatePayload,
  ShowRevealPayload,
  TeamUpdatePayload,
} from '@/types/index'

// Connect to same origin — Vite proxies /socket.io to the backend
const SERVER_URL = ''

export interface LedwallData {
  state: LedwallState
  scores: ScoreEntry[]
  currentRound: Round | null
  questionNum: number
  totalQuestions: number
  countdown: number | null
  buzzerWinner: BuzzerResultPayload | null
  revealImageUrl: string | null
  hypeVideoUrl: string | null
  isFrozen: boolean
  isLastQuestion: boolean
  teamCounts: Array<{ id: TeamId; name: string; count: number }>
  answerTimerStart: number | null
}

const INITIAL_DATA: LedwallData = {
  state: LedwallState.QR_LOBBY,
  scores: [],
  currentRound: null,
  questionNum: 0,
  totalQuestions: 0,
  countdown: null,
  buzzerWinner: null,
  revealImageUrl: null,
  hypeVideoUrl: null,
  isFrozen: false,
  isLastQuestion: false,
  teamCounts: [],
  answerTimerStart: null,
}

export function useLedwall() {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [data, setData] = useState<LedwallData>(INITIAL_DATA)

  // Pre-load refs for next question media
  const preloadVideoRef = useRef<HTMLVideoElement | null>(null)
  const preloadImageRef = useRef<HTMLImageElement | null>(null)

  const updateData = useCallback((partial: Partial<LedwallData>) => {
    setData(prev => ({ ...prev, ...partial }))
  }, [])

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    const safeTimeout = (fn: () => void, ms: number) => {
      const id = setTimeout(fn, ms)
      timers.push(id)
      return id
    }

    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    // Team count updates (lobby)
    socket.on(SOCKET_EVENTS.TEAM_UPDATE, (payload: TeamUpdatePayload) => {
      updateData({ teamCounts: payload.teams })
    })

    // State change from server — maps to LedwallState
    socket.on(SOCKET_EVENTS.STATE_CHANGE, (payload: { state: string; data?: Record<string, unknown> }) => {
      const stateData = payload.data ?? {}

      // Map PlayerState-based state changes to LedwallState where relevant
      if (payload.state === 'LOBBY') {
        updateData({ state: LedwallState.QR_LOBBY })
      } else if (payload.state === 'WAITING' || payload.state === 'COUNTDOWN') {
        updateData({
          state: LedwallState.TAPPO,
          buzzerWinner: null,
          revealImageUrl: null,
          isFrozen: false,
        })
      } else if (payload.state === 'BUZZER_ACTIVE') {
        updateData({ state: LedwallState.PLAY })
      } else if (payload.state === 'PAUSED') {
        updateData({ state: LedwallState.PAUSED })
      } else if (payload.state === 'FINALE_LOBBY') {
        updateData({ state: LedwallState.FINALE })
      }

      // Handle answer timer
      if (stateData['answerTimerStartedAt']) {
        updateData({ answerTimerStart: stateData['answerTimerStartedAt'] as number })
      }
    })

    // Countdown
    socket.on(SOCKET_EVENTS.COUNTDOWN, (payload: CountdownPayload) => {
      updateData({ countdown: payload.seconds })
      if (payload.seconds === 0) {
        // Countdown finished — transition to PLAY
        safeTimeout(() => updateData({ countdown: null, state: LedwallState.PLAY }), 500)
      }
    })

    // Buzzer result — freeze
    socket.on(SOCKET_EVENTS.BUZZER_RESULT, (payload: BuzzerResultPayload) => {
      updateData({
        buzzerWinner: payload,
        answerTimerStart: Date.now(),
      })
    })

    // Freeze media
    socket.on(SOCKET_EVENTS.FREEZE_MEDIA, () => {
      updateData({ state: LedwallState.FREEZE, isFrozen: true })
    })

    // Unfreeze media
    socket.on(SOCKET_EVENTS.UNFREEZE_MEDIA, () => {
      updateData({
        state: LedwallState.PLAY,
        isFrozen: false,
        buzzerWinner: null,
        answerTimerStart: null,
      })
    })

    // Show reveal
    socket.on(SOCKET_EVENTS.SHOW_REVEAL, (payload: ShowRevealPayload) => {
      updateData({
        state: LedwallState.REVEAL,
        revealImageUrl: payload.imageUrl,
      })
    })

    // Score update
    socket.on(SOCKET_EVENTS.SCORE_UPDATE, (payload: ScoreUpdatePayload) => {
      updateData({ scores: payload.scores })
    })

    // Next question
    socket.on(SOCKET_EVENTS.NEXT_QUESTION, (payload: NextQuestionPayload) => {
      updateData({
        state: LedwallState.TAPPO,
        currentRound: payload.round,
        questionNum: payload.questionNum,
        totalQuestions: payload.totalQuestions,
        buzzerWinner: null,
        revealImageUrl: null,
        isFrozen: false,
        countdown: null,
        answerTimerStart: null,
      })

      // FIX(Agent7): correct media paths — files live at /media/<questionId>/<filename>
      if (payload.round === 1) {
        preloadVideo('/media/system/spectrogram_loop.mp4')
      } else if (payload.round === 2) {
        preloadVideo(`/media/${payload.questionId}/video.mp4`)
      } else if (payload.round === 3) {
        preloadImage(`/media/${payload.questionId}/image.jpg`)
      }
    })

    // Next round — hype video
    socket.on(SOCKET_EVENTS.NEXT_ROUND, (payload: NextRoundPayload) => {
      updateData({
        state: LedwallState.HYPE_ROUND,
        currentRound: payload.round,
        hypeVideoUrl: payload.hypeVideoUrl,
        questionNum: 0,
        buzzerWinner: null,
        revealImageUrl: null,
        isFrozen: false,
      })
    })

    // Last question animation
    socket.on(SOCKET_EVENTS.LAST_QUESTION_ANIMATION, () => {
      updateData({ isLastQuestion: true })
      safeTimeout(() => updateData({ isLastQuestion: false }), 4000)
    })

    // Game paused/resumed
    socket.on(SOCKET_EVENTS.GAME_PAUSED, () => {
      updateData({ state: LedwallState.PAUSED })
    })

    socket.on(SOCKET_EVENTS.GAME_RESUMED, () => {
      // Return to TAPPO — the server will send proper state after
      updateData({ state: LedwallState.TAPPO })
    })

    // Start game — transition from lobby
    socket.on(SOCKET_EVENTS.START_GAME, () => {
      updateData({ state: LedwallState.TAPPO })
    })

    return () => {
      timers.forEach(clearTimeout)
      socket.disconnect()
      socketRef.current = null
    }
  }, [updateData])

  function preloadVideo(url: string): void {
    if (preloadVideoRef.current) {
      preloadVideoRef.current.remove()
    }
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.src = url
    video.style.display = 'none'
    document.body.appendChild(video)
    preloadVideoRef.current = video
  }

  function preloadImage(url: string): void {
    const img = new Image()
    img.src = url
    preloadImageRef.current = img
  }

  return { connected, data, socket: socketRef.current }
}
