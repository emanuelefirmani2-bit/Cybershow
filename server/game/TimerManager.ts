// =============================================================================
// CYBERSHOW 2026 — TimerManager
// 60s answer timer with grace period, teammate failover
// Owner: Agent 2
// =============================================================================

export interface TimerCallbacks {
  onTimerExpired: () => void
  onGraceExpired: (playerId: string) => void
  onTimerTick: (remainingMs: number) => void
}

export class TimerManager {
  private answerTimer: ReturnType<typeof setTimeout> | null = null
  private answerTimerInterval: ReturnType<typeof setInterval> | null = null
  private graceTimer: ReturnType<typeof setTimeout> | null = null
  private remainingMs: number = 60_000
  private startedAt: number = 0
  private callbacks: TimerCallbacks

  private static readonly ANSWER_DURATION_MS = 60_000
  private static readonly GRACE_DURATION_MS = 10_000
  private static readonly TICK_INTERVAL_MS = 1_000

  constructor(callbacks: TimerCallbacks) {
    this.callbacks = callbacks
  }

  /**
   * Start the 60s answer timer from scratch.
   */
  startAnswerTimer(): void {
    this.clearAnswerTimer()
    this.remainingMs = TimerManager.ANSWER_DURATION_MS
    this.startedAt = Date.now()
    this.scheduleAnswerTimer()
  }

  /**
   * Continue the timer from the current remaining value (same team pass).
   */
  continueAnswerTimer(): void {
    // Timer keeps running from current value
    // No-op if already running; restart schedule if paused
    if (!this.answerTimer) {
      this.scheduleAnswerTimer()
    }
  }

  /**
   * Restart the timer from 60s (different team gets the buzzer).
   */
  restartAnswerTimer(): void {
    this.clearAnswerTimer()
    this.remainingMs = TimerManager.ANSWER_DURATION_MS
    this.startedAt = Date.now()
    this.scheduleAnswerTimer()
  }

  /**
   * Stop the answer timer (answer submitted or question ended).
   */
  clearAnswerTimer(): void {
    if (this.answerTimer) {
      clearTimeout(this.answerTimer)
      this.answerTimer = null
    }
    if (this.answerTimerInterval) {
      clearInterval(this.answerTimerInterval)
      this.answerTimerInterval = null
    }
  }

  /**
   * Manually zero the timer (Regia override).
   */
  zeroTimer(): void {
    this.clearAnswerTimer()
    this.remainingMs = 0
    this.callbacks.onTimerExpired()
  }

  /**
   * Manually extend the timer by given milliseconds.
   */
  extendTimer(additionalMs: number): void {
    this.remainingMs += additionalMs
    // Restart the scheduling with the new remaining time
    this.clearAnswerTimer()
    this.scheduleAnswerTimer()
  }

  /**
   * Get remaining milliseconds on the answer timer.
   */
  getRemainingMs(): number {
    if (this.startedAt > 0 && this.answerTimer) {
      const elapsed = Date.now() - this.startedAt
      return Math.max(0, this.remainingMs - elapsed + (this.startedAt - this.startedAt))
    }
    return this.remainingMs
  }

  /**
   * Start the 10s grace countdown for a disconnected responder.
   */
  startGraceTimer(playerId: string): void {
    this.clearGraceTimer()
    // Answer timer continues during grace
    this.graceTimer = setTimeout(() => {
      this.graceTimer = null
      this.callbacks.onGraceExpired(playerId)
    }, TimerManager.GRACE_DURATION_MS)
    console.log(`[Timer] Grace 10s started for player ${playerId}`)
  }

  /**
   * Cancel grace timer (player reconnected).
   */
  clearGraceTimer(): void {
    if (this.graceTimer) {
      clearTimeout(this.graceTimer)
      this.graceTimer = null
    }
  }

  /**
   * Stop all timers.
   */
  clearAll(): void {
    this.clearAnswerTimer()
    this.clearGraceTimer()
  }

  private scheduleAnswerTimer(): void {
    this.startedAt = Date.now()

    // Fire ticks every second
    this.answerTimerInterval = setInterval(() => {
      const elapsed = Date.now() - this.startedAt
      const remaining = Math.max(0, this.remainingMs - elapsed)
      this.callbacks.onTimerTick(remaining)
    }, TimerManager.TICK_INTERVAL_MS)

    // Fire expiration
    this.answerTimer = setTimeout(() => {
      this.clearAnswerTimer()
      this.remainingMs = 0
      this.callbacks.onTimerExpired()
    }, this.remainingMs)
  }
}
