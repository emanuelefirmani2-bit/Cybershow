// =============================================================================
// CYBERSHOW 2026 — GameEngine
// Main orchestrator: state machine, question flow, round transitions, finale
// Owner: Agent 2
// =============================================================================

import type { Server as SocketIOServer } from 'socket.io'
import { eq, asc } from 'drizzle-orm'
import type { TeamId, Round, Question } from '../../src/types/index.js'
import {
  GamePhase,
  PlayerState,
  SOCKET_EVENTS,
  SOCKET_ROOMS,
  teamRoom,
} from '../../src/types/index.js'
import { db } from '../db/index.js'
import { questions as questionsTable } from '../db/schema.js'
import { StateStore } from './StateStore.js'
import { SessionManager } from './SessionManager.js'
import { ScoreManager } from './ScoreManager.js'
import { BuzzerManager } from './BuzzerManager.js'
import { TimerManager } from './TimerManager.js'
import { VoteManager } from './VoteManager.js'
import { MidiController } from '../midi/MidiController.js'

// ---------------------------------------------------------------------------
// Answer validation helpers
// ---------------------------------------------------------------------------

function normalizeAnswer(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    // Remove accents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Remove punctuation
    .replace(/[^\w\s]/g, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[])

  for (let i = 0; i <= m; i++) dp[i]![0] = i
  for (let j = 0; j <= n; j++) dp[0]![j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost,
      )
    }
  }

  return dp[m]![n]!
}

function fuzzyMatch(submitted: string, correct: string, tolerance: number = 2): boolean {
  const a = normalizeAnswer(submitted)
  const b = normalizeAnswer(correct)
  if (a === b) return true
  return levenshtein(a, b) <= tolerance
}

// ---------------------------------------------------------------------------
// GameEngine
// ---------------------------------------------------------------------------

export class GameEngine {
  readonly store: StateStore
  readonly sessionManager: SessionManager
  readonly scoreManager: ScoreManager
  readonly buzzerManager: BuzzerManager
  readonly timerManager: TimerManager
  readonly voteManager: VoteManager
  readonly midi: MidiController

  private io: SocketIOServer

  /** Questions loaded per round */
  private questionsByRound: Map<Round, Question[]> = new Map()
  /** Current question data */
  private currentQuestion: Question | null = null

  /** Regia heartbeat tracking */
  private lastRegiaHeartbeat: number = 0
  private regiaCheckInterval: ReturnType<typeof setInterval> | null = null
  private isPaused: boolean = false
  private stateBeforePause: GamePhase | null = null

  /** Countdown timer */
  private countdownTimer: ReturnType<typeof setTimeout> | null = null

  /** Victory effect timer */
  private effectTimer: ReturnType<typeof setTimeout> | null = null

  /** "LAST QUESTION" animation timer */
  private lastQuestionAnimTimer: ReturnType<typeof setTimeout> | null = null

  constructor(io: SocketIOServer) {
    this.io = io
    this.store = new StateStore()
    this.sessionManager = new SessionManager(this.store, io)
    this.scoreManager = new ScoreManager(this.store, io)
    this.buzzerManager = new BuzzerManager(this.store, io)
    this.voteManager = new VoteManager(this.store, io)
    this.midi = MidiController.getInstance()

    this.timerManager = new TimerManager({
      onTimerExpired: () => this.handleAnswerTimerExpired(),
      onGraceExpired: (playerId: string) => this.handleGraceExpired(playerId),
      onTimerTick: (_remaining: number) => {
        // Tick events can be consumed by Regia via polling or dedicated event
      },
    })

    // Try to restore state from DB
    const restored = this.store.load()
    if (restored) {
      console.log('[GameEngine] State restored from database')
    }

    // Load questions
    this.loadQuestions()

    // Start Regia heartbeat checker
    this.startRegiaHeartbeatChecker()
  }

  // =========================================================================
  // QUESTION LOADING
  // =========================================================================

  private loadQuestions(): void {
    for (const round of [1, 2, 3] as Round[]) {
      const rows = db
        .select()
        .from(questionsTable)
        .where(eq(questionsTable.round, round))
        .orderBy(asc(questionsTable.order))
        .all()

      const mapped: Question[] = rows.map((r) => ({
        id: r.id,
        round: r.round as Round,
        questionTextIt: r.questionTextIt,
        questionTextEn: r.questionTextEn,
        correctAnswer: r.correctAnswer,
        acceptedAnswers: r.acceptedAnswers,
        mediaType: r.mediaType as 'audio' | 'video' | 'image',
        hasReveal: r.hasReveal === 1,
        order: r.order,
      }))

      this.questionsByRound.set(round, mapped)
    }

    console.log(
      `[GameEngine] Questions loaded: R1=${this.questionsByRound.get(1)?.length ?? 0}, R2=${this.questionsByRound.get(2)?.length ?? 0}, R3=${this.questionsByRound.get(3)?.length ?? 0}`,
    )
  }

  // =========================================================================
  // GAME PHASE TRANSITIONS
  // =========================================================================

  /**
   * Transition to LOBBY phase.
   */
  transitionToLobby(): void {
    this.store.gameState.phase = GamePhase.LOBBY
    this.sessionManager.setAllPlayersState(PlayerState.LOBBY)
    this.broadcastStateChange(PlayerState.LOBBY)
    console.log('[GameEngine] Phase → LOBBY')
  }

  /**
   * CMD_START_VOTE: Start sound voting phase.
   */
  startVote(): void {
    const { phase } = this.store.gameState
    if (phase !== GamePhase.LOBBY && phase !== GamePhase.SETUP) return

    this.store.gameState.phase = GamePhase.VOTE
    this.sessionManager.setAllPlayersState(PlayerState.VOTE_SOUND)
    this.broadcastStateChange(PlayerState.VOTE_SOUND)

    this.voteManager.startVote()
    console.log('[GameEngine] Phase → VOTE')
  }

  /**
   * CMD_END_VOTE: End voting early.
   */
  endVote(): void {
    if (this.store.gameState.phase !== GamePhase.VOTE) return
    this.voteManager.endVote()
    this.store.gameState.phase = GamePhase.LOBBY
    this.sessionManager.setAllPlayersState(PlayerState.WAITING)
    this.broadcastStateChange(PlayerState.WAITING)
    console.log('[GameEngine] Vote ended → LOBBY')
  }

  /**
   * CMD_START_GAME: Transition from LOBBY/VOTE to playing.
   */
  startGame(): void {
    const { phase } = this.store.gameState
    if (phase !== GamePhase.LOBBY && phase !== GamePhase.VOTE) return

    // End vote if still going
    if (this.voteManager.isVotingActive()) {
      this.voteManager.endVote()
    }

    this.store.gameState.phase = GamePhase.BETWEEN_ROUNDS
    this.store.gameState.currentRound = 1
    this.store.gameState.currentQuestionNum = 0

    const totalR1 = Math.min(
      this.store.gameState.config.questionsPerRound[1],
      this.questionsByRound.get(1)?.length ?? 0,
    )
    this.store.gameState.totalQuestionsInRound = totalR1

    // Broadcast START_GAME
    const teams = Array.from(this.store.teams.values())
    this.io.to(SOCKET_ROOMS.GLOBAL).emit(SOCKET_EVENTS.START_GAME, { teams })

    this.sessionManager.setAllPlayersState(PlayerState.WAITING)
    this.broadcastStateChange(PlayerState.WAITING)

    this.scoreManager.broadcastScores()
    this.store.save()

    console.log('[GameEngine] Phase → GAME STARTED (awaiting NEXT_ROUND)')
  }

  /**
   * CMD_NEXT_ROUND: Play hype video and transition to new round.
   */
  nextRound(): void {
    const { phase, currentRound } = this.store.gameState
    if (phase !== GamePhase.BETWEEN_ROUNDS && phase !== GamePhase.BETWEEN_QUESTIONS) return

    const round = currentRound ?? 1
    const hypeVideoUrl = `/media/system/hype_round${round}.mp4`

    this.io.to(SOCKET_ROOMS.GLOBAL).emit(SOCKET_EVENTS.NEXT_ROUND, {
      round,
      hypeVideoUrl,
    })

    // Update total questions for this round
    const totalQ = Math.min(
      this.store.gameState.config.questionsPerRound[round],
      this.questionsByRound.get(round)?.length ?? 0,
    )
    this.store.gameState.totalQuestionsInRound = totalQ
    this.store.gameState.currentQuestionNum = 0

    console.log(`[GameEngine] Hype video for Round ${round}`)
  }

  /**
   * CMD_NEXT_QUESTION: Advance to the next question.
   */
  nextQuestion(): void {
    const { phase, currentRound, currentQuestionNum, totalQuestionsInRound } = this.store.gameState
    if (
      phase !== GamePhase.BETWEEN_ROUNDS &&
      phase !== GamePhase.BETWEEN_QUESTIONS &&
      phase !== GamePhase.PLAYING
    ) return

    const round = currentRound ?? 1
    const questions = this.questionsByRound.get(round) ?? []
    const nextNum = currentQuestionNum + 1

    if (nextNum > totalQuestionsInRound || nextNum > questions.length) {
      // Round is over — move to between rounds or finale
      this.endCurrentRound()
      return
    }

    // Clean up any running timers/effects
    this.cleanupQuestion()

    const question = questions[nextNum - 1]
    if (!question) return

    this.currentQuestion = question
    this.store.gameState.currentQuestionId = question.id
    this.store.gameState.currentQuestionNum = nextNum
    this.store.gameState.phase = GamePhase.BETWEEN_QUESTIONS
    this.store.gameState.activeResponderId = null
    this.store.gameState.activeResponderTeamId = null
    this.store.gameState.answerTimerStartedAt = null
    this.store.gameState.buzzedTeams = []

    // Check if last question
    this.store.gameState.isLastQuestion = nextNum === totalQuestionsInRound

    // "LAST QUESTION" animation — 4 seconds before the question
    if (this.store.gameState.isLastQuestion) {
      this.io.to(SOCKET_ROOMS.GLOBAL).emit(SOCKET_EVENTS.LAST_QUESTION_ANIMATION)
      console.log('[GameEngine] LAST QUESTION animation (4s)')
    }

    // Broadcast next question info
    this.io.to(SOCKET_ROOMS.GLOBAL).emit(SOCKET_EVENTS.NEXT_QUESTION, {
      questionId: question.id,
      round,
      questionNum: nextNum,
      totalQuestions: totalQuestionsInRound,
    })

    this.sessionManager.setAllPlayersState(PlayerState.WAITING)
    this.broadcastStateChange(PlayerState.WAITING)

    this.buzzerManager.reset()
    this.scoreManager.broadcastScores()
    this.store.save()

    console.log(
      `[GameEngine] Question ${nextNum}/${totalQuestionsInRound} (R${round}): ${question.id}`,
    )
  }

  /**
   * CMD_START_QUESTION: Start countdown 3-2-1, then open buzzers.
   */
  startQuestion(): void {
    if (this.store.gameState.phase !== GamePhase.BETWEEN_QUESTIONS) return

    this.store.gameState.phase = GamePhase.PLAYING

    // Countdown 3-2-1
    this.sessionManager.setAllPlayersState(PlayerState.COUNTDOWN)
    this.broadcastStateChange(PlayerState.COUNTDOWN)

    let count = 3
    this.io.to(SOCKET_ROOMS.GLOBAL).emit(SOCKET_EVENTS.COUNTDOWN, { seconds: count })

    const tick = () => {
      count--
      if (count > 0) {
        this.io.to(SOCKET_ROOMS.GLOBAL).emit(SOCKET_EVENTS.COUNTDOWN, { seconds: count })
        this.countdownTimer = setTimeout(tick, 1000)
      } else {
        // Countdown finished — open buzzers
        this.countdownTimer = null
        this.buzzerManager.openBuzzers()
        this.sessionManager.setAllPlayersState(PlayerState.BUZZER_ACTIVE)
        this.broadcastStateChange(PlayerState.BUZZER_ACTIVE)
        console.log('[GameEngine] Buzzers ACTIVE')
      }
    }

    this.countdownTimer = setTimeout(tick, 1000)
  }

  /**
   * CMD_PLAY_TRACK: Forward to Regia for R1 audio playback.
   */
  playTrack(questionId: string): void {
    const audioUrl = `/media/${questionId}/track.mp3`
    this.io.to(SOCKET_ROOMS.REGIA).emit(SOCKET_EVENTS.PLAY_TRACK, { audioUrl })
    console.log(`[GameEngine] PLAY_TRACK: ${audioUrl}`)
  }

  /**
   * CMD_STOP_AUDIO: Stop all audio on Regia.
   */
  stopAudio(): void {
    this.io.to(SOCKET_ROOMS.REGIA).emit(SOCKET_EVENTS.STOP_AUDIO)
    console.log('[GameEngine] STOP_AUDIO')
  }

  // =========================================================================
  // BUZZER + ANSWER FLOW
  // =========================================================================

  /**
   * Handle a buzzer press from a player.
   */
  handleBuzzerPress(payload: { playerId: string; teamId: TeamId; timestamp: number }): void {
    if (this.store.gameState.phase !== GamePhase.PLAYING) return

    const result = this.buzzerManager.handlePress(payload)
    if (!result) return

    // Set states
    const winnerTeamId = result.teamId
    for (const player of this.store.players.values()) {
      if (player.teamId === winnerTeamId) {
        player.state =
          player.id === result.playerId
            ? PlayerState.GREEN_RESPONDER
            : PlayerState.GREEN_TEAMMATE
      } else {
        player.state = PlayerState.RED
      }
    }

    this.store.gameState.activeResponderId = result.playerId
    this.store.gameState.activeResponderTeamId = winnerTeamId
    this.store.gameState.answerTimerStartedAt = Date.now()

    // Start 60s timer
    this.timerManager.startAnswerTimer()

    // Broadcast state changes
    this.broadcastStateChange(PlayerState.RED, {
      winnerTeamId,
      winnerPlayerId: result.playerId,
      winnerName: result.playerName,
    })

    console.log(`[GameEngine] Buzzer won by ${result.playerName} (${winnerTeamId})`)
  }

  /**
   * Handle answer submission from the active responder.
   */
  handleSubmitAnswer(playerId: string, answer: string): void {
    if (this.store.gameState.phase !== GamePhase.PLAYING) return
    if (this.store.gameState.activeResponderId !== playerId) return

    const isCorrect = this.validateAnswer(answer)
    this.processAnswer(isCorrect, answer)
  }

  /**
   * CMD_OVERRIDE_ANSWER: Regia forces correct/wrong.
   */
  overrideAnswer(correct: boolean): void {
    if (this.store.gameState.phase !== GamePhase.PLAYING) return
    if (!this.store.gameState.activeResponderId) return

    this.processAnswer(correct, '(override)')
  }

  /**
   * Process the answer result (correct or wrong).
   */
  private processAnswer(correct: boolean, answer: string): void {
    const teamId = this.store.gameState.activeResponderTeamId
    if (!teamId) return

    this.timerManager.clearAnswerTimer()
    this.timerManager.clearGraceTimer()

    // Broadcast result
    this.io.to(SOCKET_ROOMS.GLOBAL).emit(SOCKET_EVENTS.ANSWER_RESULT, {
      correct,
      teamId,
      answer,
    })

    if (correct) {
      this.handleCorrectAnswer(teamId)
    } else {
      this.handleWrongAnswer(teamId)
    }
  }

  private handleCorrectAnswer(teamId: TeamId): void {
    this.midi.sendCorrect()

    this.scoreManager.awardCorrectAnswer(teamId)

    // Victory effect — 5 seconds
    this.sessionManager.setAllPlayersState(PlayerState.CORRECT)
    this.broadcastStateChange(PlayerState.CORRECT)

    // Play victory SFX
    this.io.to(SOCKET_ROOMS.REGIA).emit(SOCKET_EVENTS.PLAY_SFX, { soundId: 'victory' })

    this.effectTimer = setTimeout(() => {
      this.effectTimer = null
      this.showReveal()
    }, 5000)

    console.log(`[GameEngine] CORRECT — ${teamId} awarded points`)
  }

  private handleWrongAnswer(teamId: TeamId): void {
    this.midi.sendError()

    // Error animation ~2 seconds
    this.sessionManager.setAllPlayersState(PlayerState.ERROR)
    this.broadcastStateChange(PlayerState.ERROR)

    this.store.gameState.activeResponderId = null
    this.store.gameState.activeResponderTeamId = null
    this.store.gameState.answerTimerStartedAt = null

    this.effectTimer = setTimeout(() => {
      this.effectTimer = null

      // Check if all teams have buzzed
      if (this.buzzerManager.allTeamsBuzzed()) {
        this.handleAllTeamsBuzzed()
        return
      }

      // Unfreeze media
      this.io.to(SOCKET_ROOMS.GLOBAL).emit(SOCKET_EVENTS.UNFREEZE_MEDIA)

      // Reopen buzzers for remaining teams
      this.buzzerManager.reopenBuzzers()

      // Set states: buzzed teams → RED, others → BUZZER_ACTIVE
      for (const player of this.store.players.values()) {
        const buzzedTeams = this.buzzerManager.getBuzzedTeams()
        if (buzzedTeams.includes(player.teamId)) {
          player.state = PlayerState.RED
        } else {
          player.state = PlayerState.BUZZER_ACTIVE
        }
      }

      this.broadcastStateChange(PlayerState.BUZZER_ACTIVE)
      console.log(`[GameEngine] WRONG — buzzers reopened (excluding ${teamId})`)
    }, 2000)
  }

  /**
   * Show reveal image after correct answer.
   */
  private showReveal(): void {
    if (!this.currentQuestion) return

    const round = this.store.gameState.currentRound ?? 1
    const questionId = this.currentQuestion.id

    // Send reveal
    if (this.currentQuestion.hasReveal) {
      const imageUrl = `/media/${questionId}/reveal.jpg`
      this.io.to(SOCKET_ROOMS.GLOBAL).emit(SOCKET_EVENTS.SHOW_REVEAL, {
        imageUrl,
        round,
      })
    }

    // For R1, play the chorus
    if (round === 1) {
      this.io.to(SOCKET_ROOMS.REGIA).emit(SOCKET_EVENTS.PLAY_SFX, {
        soundId: `ritornello_${questionId}`,
      })
    }

    // Transition to REVEAL state for R2/R3
    if (round !== 1) {
      this.sessionManager.setAllPlayersState(PlayerState.REVEAL)
      this.broadcastStateChange(PlayerState.REVEAL)
    }

    // Stay in PLAYING phase — Regia presses NEXT QUESTION to advance
    this.store.gameState.phase = GamePhase.BETWEEN_QUESTIONS
    console.log('[GameEngine] Reveal shown — awaiting NEXT_QUESTION')
  }

  /**
   * Handle all teams having buzzed with no correct answer.
   */
  private handleAllTeamsBuzzed(): void {
    this.sessionManager.setAllPlayersState(PlayerState.WAITING)
    this.broadcastStateChange(PlayerState.WAITING)
    this.store.gameState.phase = GamePhase.BETWEEN_QUESTIONS
    this.store.gameState.activeResponderId = null
    this.store.gameState.activeResponderTeamId = null
    console.log('[GameEngine] All teams buzzed wrong — no points, awaiting NEXT_QUESTION')
  }

  /**
   * CMD_SKIP_QUESTION: Skip the current question.
   */
  skipQuestion(): void {
    if (this.store.gameState.phase !== GamePhase.PLAYING) return

    this.cleanupQuestion()

    this.store.gameState.phase = GamePhase.BETWEEN_QUESTIONS
    this.store.gameState.activeResponderId = null
    this.store.gameState.activeResponderTeamId = null
    this.store.gameState.answerTimerStartedAt = null

    // Unfreeze media
    this.io.to(SOCKET_ROOMS.GLOBAL).emit(SOCKET_EVENTS.UNFREEZE_MEDIA)

    this.sessionManager.setAllPlayersState(PlayerState.WAITING)
    this.broadcastStateChange(PlayerState.WAITING)

    console.log('[GameEngine] Question skipped')
  }

  // =========================================================================
  // TIMER CALLBACKS
  // =========================================================================

  private handleAnswerTimerExpired(): void {
    console.log('[GameEngine] 60s timer expired — automatic wrong answer')
    const teamId = this.store.gameState.activeResponderTeamId
    if (!teamId) return
    this.processAnswer(false, '(timer expired)')
  }

  private handleGraceExpired(playerId: string): void {
    console.log(`[GameEngine] Grace 10s expired for ${playerId}`)

    const player = this.store.getPlayer(playerId)
    if (!player) return

    const teamId = player.teamId

    // Find a connected teammate
    const teammate = this.sessionManager.findOldestConnectedTeammate(teamId, playerId)

    if (teammate) {
      // Pass to teammate — timer continues
      this.store.gameState.activeResponderId = teammate.id
      teammate.state = PlayerState.GREEN_RESPONDER
      player.state = PlayerState.GREEN_TEAMMATE

      this.timerManager.continueAnswerTimer()

      console.log(
        `[GameEngine] Responder passed to teammate: ${teammate.name} (${teammate.id})`,
      )
    } else {
      // No teammates available — automatic wrong answer
      this.processAnswer(false, '(no connected teammates)')
    }
  }

  // =========================================================================
  // ROUND TRANSITIONS
  // =========================================================================

  private endCurrentRound(): void {
    const round = this.store.gameState.currentRound ?? 1

    if (round < 3) {
      // Move to next round
      const nextRound = (round + 1) as Round
      this.store.gameState.currentRound = nextRound
      this.store.gameState.currentQuestionNum = 0
      this.store.gameState.phase = GamePhase.BETWEEN_ROUNDS

      const totalQ = Math.min(
        this.store.gameState.config.questionsPerRound[nextRound],
        this.questionsByRound.get(nextRound)?.length ?? 0,
      )
      this.store.gameState.totalQuestionsInRound = totalQ

      this.sessionManager.setAllPlayersState(PlayerState.WAITING)
      this.broadcastStateChange(PlayerState.WAITING)

      console.log(`[GameEngine] Round ${round} ended → BETWEEN_ROUNDS (next: R${nextRound})`)
    } else {
      // Round 3 ended → Finale
      this.store.gameState.phase = GamePhase.FINALE_LOBBY
      this.sessionManager.setAllPlayersState(PlayerState.FINALE_LOBBY)
      this.broadcastStateChange(PlayerState.FINALE_LOBBY)

      console.log('[GameEngine] Round 3 ended → FINALE_LOBBY')
    }

    this.store.save()
  }

  // =========================================================================
  // GRAND FINALE (§14.1)
  // =========================================================================

  /**
   * CMD_SUSPENSE: Start suspense music.
   */
  startSuspense(): void {
    if (this.store.gameState.phase !== GamePhase.FINALE_LOBBY) return

    this.store.gameState.isSuspenseActive = true
    this.io.to(SOCKET_ROOMS.REGIA).emit(SOCKET_EVENTS.PLAY_SFX, {
      soundId: 'suspense_music',
    })

    console.log('[GameEngine] SUSPENSE activated')
  }

  /**
   * CMD_OK_FINALE: Start the finale celebration sequence.
   */
  startFinale(): void {
    if (this.store.gameState.phase !== GamePhase.FINALE_LOBBY) return
    if (!this.store.gameState.isSuspenseActive) return

    this.store.gameState.phase = GamePhase.FINALE
    this.store.gameState.isSuspenseActive = false

    // Stop suspense music
    this.io.to(SOCKET_ROOMS.REGIA).emit(SOCKET_EVENTS.STOP_AUDIO)

    // Send finale state
    this.broadcastStateChange(PlayerState.FINALE_LOBBY, {
      finale: true,
      podium: this.scoreManager.getPodium(),
    })

    // Play champions music
    this.io.to(SOCKET_ROOMS.REGIA).emit(SOCKET_EVENTS.PLAY_SFX, {
      soundId: 'champions',
    })

    // Determine winners/losers
    const podium = this.scoreManager.getPodium()
    const winnerTeams = podium.filter((p) => p.position === 1).map((p) => p.teamId)

    for (const player of this.store.players.values()) {
      player.state = winnerTeams.includes(player.teamId)
        ? PlayerState.WINNER
        : PlayerState.LOSER
    }

    // Broadcast winner/loser states
    for (const teamId of this.store.getActiveTeamIds()) {
      const state = winnerTeams.includes(teamId) ? PlayerState.WINNER : PlayerState.LOSER
      this.io.to(teamRoom(teamId)).emit(SOCKET_EVENTS.STATE_CHANGE, {
        state,
        data: { podium },
      })
    }

    console.log(`[GameEngine] FINALE — Winners: ${winnerTeams.join(', ')}`)

    // After some time, transition to END
    this.effectTimer = setTimeout(() => {
      this.store.gameState.phase = GamePhase.ENDED
      this.sessionManager.setAllPlayersState(PlayerState.END)
      this.broadcastStateChange(PlayerState.END)
      this.store.save()
      console.log('[GameEngine] Phase → ENDED')
    }, 30_000) // 30s for celebration
  }

  // =========================================================================
  // KICK ALL / RESET
  // =========================================================================

  /**
   * CMD_KICK_ALL: End show, reset everything.
   */
  kickAll(): void {
    this.cleanupQuestion()

    this.midi.sendBlackout()

    this.io.to(SOCKET_ROOMS.GLOBAL).emit(SOCKET_EVENTS.KICK_ALL)
    this.sessionManager.kickAll()
    this.voteManager.reset()
    this.scoreManager.resetScores()

    console.log('[GameEngine] KICK_ALL — full reset')
  }

  /**
   * CMD_RESET_SOFT: Soft reset — keep players, reset scores and game state.
   */
  resetSoft(): void {
    this.cleanupQuestion()
    this.store.gameState.phase = GamePhase.LOBBY
    this.store.gameState.currentRound = null
    this.store.gameState.currentQuestionId = null
    this.store.gameState.currentQuestionNum = 0
    this.store.gameState.buzzedTeams = []
    this.store.gameState.activeResponderId = null
    this.store.gameState.activeResponderTeamId = null
    this.store.gameState.answerTimerStartedAt = null
    this.store.gameState.isLastQuestion = false
    this.store.gameState.isSuspenseActive = false

    this.scoreManager.resetScores()
    this.voteManager.reset()
    this.sessionManager.setAllPlayersState(PlayerState.LOBBY)
    this.broadcastStateChange(PlayerState.LOBBY)
    this.store.save()

    console.log('[GameEngine] Soft reset — players kept, scores reset')
  }

  // =========================================================================
  // REGIA HEARTBEAT & PAUSE (§16.5)
  // =========================================================================

  /**
   * Record a heartbeat from a Regia client.
   */
  handleRegiaHeartbeat(): void {
    this.lastRegiaHeartbeat = Date.now()

    // Resume if paused
    if (this.isPaused) {
      this.isPaused = false
      this.io.to(SOCKET_ROOMS.GLOBAL).emit(SOCKET_EVENTS.GAME_RESUMED)

      if (this.stateBeforePause) {
        this.store.gameState.phase = this.stateBeforePause
        this.stateBeforePause = null
      }

      console.log('[GameEngine] GAME RESUMED — Regia reconnected')
    }
  }

  private startRegiaHeartbeatChecker(): void {
    this.regiaCheckInterval = setInterval(() => {
      if (this.lastRegiaHeartbeat === 0) return // No Regia has connected yet
      if (this.isPaused) return

      const elapsed = Date.now() - this.lastRegiaHeartbeat
      if (elapsed > 6000) {
        // 6s without heartbeat → pause
        this.isPaused = true
        this.stateBeforePause = this.store.gameState.phase

        this.io.to(SOCKET_ROOMS.GLOBAL).emit(SOCKET_EVENTS.GAME_PAUSED)
        this.store.save()

        console.log('[GameEngine] GAME PAUSED — no Regia heartbeat for 6s')
      }
    }, 2000)
  }

  // =========================================================================
  // ANSWER VALIDATION (§6.6)
  // =========================================================================

  private validateAnswer(submitted: string): boolean {
    if (!this.currentQuestion) return false

    const correct = this.currentQuestion.correctAnswer
    const accepted = this.currentQuestion.acceptedAnswers

    // Check against correct answer
    if (fuzzyMatch(submitted, correct)) return true

    // Check against accepted answers
    for (const alt of accepted) {
      if (fuzzyMatch(submitted, alt)) return true
    }

    return false
  }

  // =========================================================================
  // RESPONDER DISCONNECT HANDLING
  // =========================================================================

  /**
   * Called when the active responder disconnects.
   */
  handleResponderDisconnect(playerId: string): void {
    if (this.store.gameState.activeResponderId !== playerId) return

    // Start 10s grace timer
    this.timerManager.startGraceTimer(playerId)
    console.log(`[GameEngine] Active responder ${playerId} disconnected — 10s grace`)
  }

  /**
   * Called when the active responder reconnects.
   */
  handleResponderReconnect(playerId: string): void {
    if (this.store.gameState.activeResponderId !== playerId) return

    // Cancel grace timer
    this.timerManager.clearGraceTimer()
    console.log(`[GameEngine] Active responder ${playerId} reconnected — grace cancelled`)
  }

  // =========================================================================
  // BROADCAST HELPERS
  // =========================================================================

  private broadcastStateChange(
    state: PlayerState,
    data?: Record<string, unknown>,
  ): void {
    this.io.to(SOCKET_ROOMS.GLOBAL).emit(SOCKET_EVENTS.STATE_CHANGE, {
      state,
      data,
    })
  }

  /**
   * Emit the full current state to a specific socket (for reconnection/sync).
   */
  emitFullState(socketId: string): void {
    const socket = this.io.sockets.sockets.get(socketId)
    if (!socket) return

    const player = this.store.getPlayerBySocketId(socketId)
    if (!player) return

    // Send current state
    socket.emit(SOCKET_EVENTS.STATE_CHANGE, {
      state: player.state,
      data: {
        gameState: this.store.gameState,
      },
    })

    // Send scores
    socket.emit(SOCKET_EVENTS.SCORE_UPDATE, {
      scores: this.store.buildScores(),
    })

    // Send team update
    const teams = Array.from(this.store.teams.values()).map((t) => ({
      id: t.id,
      name: t.name,
      count: t.playerCount,
    }))
    socket.emit(SOCKET_EVENTS.TEAM_UPDATE, { teams })
  }

  /**
   * Send team counts to a single socket (used on initial connection).
   */
  emitTeamUpdate(socket: import('socket.io').Socket): void {
    const teams = Array.from(this.store.teams.values()).map((t) => ({
      id: t.id,
      name: t.name,
      count: t.playerCount,
    }))
    socket.emit(SOCKET_EVENTS.TEAM_UPDATE, { teams })
  }

  /**
   * Broadcast team counts to all clients.
   */
  broadcastTeamUpdate(): void {
    const teams = Array.from(this.store.teams.values()).map((t) => ({
      id: t.id,
      name: t.name,
      count: t.playerCount,
    }))
    this.io.to(SOCKET_ROOMS.GLOBAL).emit(SOCKET_EVENTS.TEAM_UPDATE, { teams })
  }

  // =========================================================================
  // CHAT
  // =========================================================================

  /**
   * Handle team chat message.
   */
  handleChatMessage(playerId: string, message: string): void {
    const player = this.store.getPlayer(playerId)
    if (!player) return

    // Only allow during GREEN state (team chat for suggestions)
    if (
      player.state !== PlayerState.GREEN_TEAMMATE &&
      player.state !== PlayerState.GREEN_RESPONDER
    ) {
      return
    }

    const trimmed = message.slice(0, 40)
    const chatPayload = {
      playerId: player.id,
      playerName: player.name,
      message: trimmed,
      timestamp: Date.now(),
      teamId: player.teamId, // FIX(Agent7): include teamId for Regia ChatMonitor
    }
    this.io.to(teamRoom(player.teamId)).emit(SOCKET_EVENTS.CHAT_BROADCAST, chatPayload)
    // FIX(Agent7): also send to REGIA room so ChatMonitor can display all team chats
    this.io.to(SOCKET_ROOMS.REGIA).emit(SOCKET_EVENTS.CHAT_BROADCAST, chatPayload)
  }

  // =========================================================================
  // CLEANUP
  // =========================================================================

  private cleanupQuestion(): void {
    this.timerManager.clearAll()
    this.buzzerManager.closeBuzzers()

    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer)
      this.countdownTimer = null
    }
    if (this.effectTimer) {
      clearTimeout(this.effectTimer)
      this.effectTimer = null
    }
    if (this.lastQuestionAnimTimer) {
      clearTimeout(this.lastQuestionAnimTimer)
      this.lastQuestionAnimTimer = null
    }
  }

  /**
   * Cleanup on server shutdown.
   */
  shutdown(): void {
    this.cleanupQuestion()
    if (this.regiaCheckInterval) {
      clearInterval(this.regiaCheckInterval)
    }
    this.midi.destroy()
    this.store.save()
  }

  // =========================================================================
  // FIX(Agent7): REGIA STATE SYNC — methods for GAME_STATE_SYNC + PLAYER_LIST_SYNC
  // =========================================================================

  /**
   * Get the full game state for Regia synchronization.
   */
  getRegiaState(): import('../../src/types/index.js').GameState {
    return {
      ...this.store.gameState,
      scores: this.store.buildScores(),
    }
  }

  /**
   * Get the full player list for Regia PlayerModeration.
   */
  getPlayerList(): import('../../src/types/index.js').Player[] {
    return Array.from(this.store.players.values())
  }

  /**
   * Send full state sync to all Regia clients.
   */
  broadcastRegiaSync(): void {
    this.io.to(SOCKET_ROOMS.REGIA).emit('GAME_STATE_SYNC', this.getRegiaState())
    this.io.to(SOCKET_ROOMS.REGIA).emit('PLAYER_LIST_SYNC', this.getPlayerList())
  }

  /**
   * FIX(Agent7): Handle GAME_CONFIG from Regia ConfigPanel.
   * Updates the game configuration before the game starts.
   */
  updateConfig(config: Partial<import('../../src/types/index.js').GameConfig>): void {
    const { phase } = this.store.gameState
    // Only allow config changes during SETUP or LOBBY
    if (phase !== GamePhase.SETUP && phase !== GamePhase.LOBBY) {
      console.warn('[GameEngine] Config update rejected — game already in progress')
      return
    }

    this.store.updateConfig(config)

    // Reload questions if questionsPerRound changed
    this.loadQuestions()

    // Broadcast updated team list
    this.broadcastTeamUpdate()

    // Sync state to Regia
    this.broadcastRegiaSync()

    console.log('[GameEngine] Config updated:', JSON.stringify(config))
  }
}
