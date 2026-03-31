// =============================================================================
// CYBERSHOW 2026 — ScoreManager
// Points, bonuses, undo, podium with tie handling
// Owner: Agent 2
// =============================================================================

import type { Server as SocketIOServer } from 'socket.io'
import type { TeamId, ScoreEntry } from '../../src/types/index.js'
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../../src/types/index.js'
import type { StateStore } from './StateStore.js'

interface ScoreOperation {
  type: 'correct' | 'bonus'
  teamId: TeamId
  points: number
}

export class ScoreManager {
  private lastOperation: ScoreOperation | null = null

  constructor(
    private store: StateStore,
    private io: SocketIOServer,
  ) {}

  /**
   * Award points for a correct answer.
   */
  awardCorrectAnswer(teamId: TeamId): void {
    const points = this.store.gameState.config.pointsPerCorrectAnswer
    const team = this.store.getTeam(teamId)
    if (!team) return

    team.points += points
    this.lastOperation = { type: 'correct', teamId, points }
    this.broadcastScores()
    this.store.save()

    console.log(
      `[Score] +${points} to ${teamId} (correct answer) → total ${team.points}`,
    )
  }

  /**
   * Apply a manual bonus (positive or negative, range -50 to +50).
   */
  applyBonus(teamId: TeamId, points: number): boolean {
    const clamped = Math.max(-50, Math.min(50, Math.round(points)))
    const team = this.store.getTeam(teamId)
    if (!team) return false

    team.points += clamped
    this.lastOperation = { type: 'bonus', teamId, points: clamped }
    this.broadcastScores()
    this.store.save()

    console.log(
      `[Score] Bonus ${clamped > 0 ? '+' : ''}${clamped} to ${teamId} → total ${team.points}`,
    )
    return true
  }

  /**
   * Undo the last score operation (single level).
   */
  undoLastScore(): boolean {
    if (!this.lastOperation) return false

    const { teamId, points } = this.lastOperation
    const team = this.store.getTeam(teamId)
    if (!team) return false

    team.points -= points
    console.log(
      `[Score] Undo: ${-points} from ${teamId} → total ${team.points}`,
    )

    this.lastOperation = null
    this.broadcastScores()
    this.store.save()
    return true
  }

  /**
   * Get current scores sorted by points descending.
   */
  getScores(): ScoreEntry[] {
    return this.store.buildScores()
  }

  /**
   * Build podium with tie handling.
   * Teams with same score share the same position.
   */
  getPodium(): Array<{ position: number; teamId: TeamId; points: number }> {
    const scores = this.getScores().sort((a, b) => b.points - a.points)

    const podium: Array<{ position: number; teamId: TeamId; points: number }> = []
    let currentPosition = 1

    for (let i = 0; i < scores.length; i++) {
      const entry = scores[i]
      if (!entry) continue

      if (i > 0) {
        const prev = scores[i - 1]
        if (prev && entry.points < prev.points) {
          currentPosition = i + 1
        }
      }

      podium.push({
        position: currentPosition,
        teamId: entry.teamId,
        points: entry.points,
      })
    }

    return podium
  }

  /**
   * Broadcast SCORE_UPDATE to all clients.
   */
  broadcastScores(): void {
    this.store.gameState.scores = this.store.buildScores()
    this.io.to(SOCKET_ROOMS.GLOBAL).emit(SOCKET_EVENTS.SCORE_UPDATE, {
      scores: this.store.gameState.scores,
    })
  }

  /**
   * Reset scores for all teams.
   */
  resetScores(): void {
    for (const team of this.store.teams.values()) {
      team.points = 0
    }
    this.lastOperation = null
    this.broadcastScores()
  }
}
