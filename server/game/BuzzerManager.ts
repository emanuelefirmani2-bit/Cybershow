// =============================================================================
// CYBERSHOW 2026 — BuzzerManager
// Race condition handling, buzzedTeams tracking, one-buzzer-per-player
// Owner: Agent 2
// =============================================================================

import type { Server as SocketIOServer } from 'socket.io'
import type { TeamId, BuzzerPressPayload } from '../../src/types/index.js'
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../../src/types/index.js'
import type { StateStore } from './StateStore.js'
import { MidiController } from '../midi/MidiController.js'

export class BuzzerManager {
  /** Teams that have already buzzed for the current question */
  private buzzedTeams: Set<TeamId> = new Set()
  /** Players who have buzzed for the current question (anti-spam) */
  private buzzedPlayers: Set<string> = new Set()
  /** Whether the buzzer is currently open */
  private isOpen: boolean = false
  /** Lock to prevent race conditions */
  private locked: boolean = false

  constructor(
    private store: StateStore,
    private io: SocketIOServer,
  ) {}

  /**
   * Open buzzers for a new question. Resets all tracking.
   */
  openBuzzers(): void {
    this.buzzedTeams.clear()
    this.buzzedPlayers.clear()
    this.isOpen = true
    this.locked = false

    this.store.gameState.buzzedTeams = []
    console.log('[Buzzer] Buzzers opened for new question')
  }

  /**
   * Reopen buzzers after a wrong answer, excluding teams that already buzzed.
   */
  reopenBuzzers(): void {
    this.isOpen = true
    this.locked = false

    // Broadcast which teams are excluded
    this.io.to(SOCKET_ROOMS.GLOBAL).emit(SOCKET_EVENTS.REOPEN_BUZZERS, {
      buzzedTeams: Array.from(this.buzzedTeams),
    })

    console.log(
      `[Buzzer] Buzzers reopened. Excluded teams: ${Array.from(this.buzzedTeams).join(', ')}`,
    )
  }

  /**
   * Close all buzzers (question ended or buzzer won).
   */
  closeBuzzers(): void {
    this.isOpen = false
    this.locked = true
  }

  /**
   * Handle an incoming buzzer press. Returns the winning player info
   * or null if the press was rejected.
   */
  handlePress(
    payload: BuzzerPressPayload,
  ): { playerId: string; teamId: TeamId; playerName: string } | null {
    // Quick reject if buzzers are not open
    if (!this.isOpen || this.locked) return null

    const { playerId, teamId } = payload

    // Reject if this team already buzzed
    if (this.buzzedTeams.has(teamId)) return null

    // Reject if this player already buzzed (one per player per question)
    if (this.buzzedPlayers.has(playerId)) return null

    // Atomic lock — first one through wins
    if (this.locked) return null
    this.locked = true
    this.isOpen = false

    // Record the buzzer
    this.buzzedPlayers.add(playerId)
    this.buzzedTeams.add(teamId)
    this.store.gameState.buzzedTeams = Array.from(this.buzzedTeams)

    const player = this.store.getPlayer(playerId)
    if (!player) {
      // Should not happen, but release lock
      this.locked = false
      this.isOpen = true
      return null
    }

    const result = {
      playerId: player.id,
      teamId: player.teamId,
      playerName: player.name,
    }

    // Broadcast buzzer result
    this.io.to(SOCKET_ROOMS.GLOBAL).emit(SOCKET_EVENTS.BUZZER_RESULT, {
      winnerTeamId: result.teamId,
      winnerPlayerId: result.playerId,
      winnerName: result.playerName,
    })

    // Freeze media
    this.io.to(SOCKET_ROOMS.GLOBAL).emit(SOCKET_EVENTS.FREEZE_MEDIA)

    // Play team sound via Regia
    this.io.to(SOCKET_ROOMS.REGIA).emit(SOCKET_EVENTS.PLAY_TEAM_SOUND, {
      teamId: result.teamId,
    })

    // MIDI — send team buzzer note (C3/D3/E3/F3)
    MidiController.getInstance().sendBuzzerNote(result.teamId)

    console.log(
      `[Buzzer] Winner: ${result.playerName} (${result.teamId}) — latency ref: ${Date.now() - payload.timestamp}ms`,
    )

    return result
  }

  /**
   * Check if all active teams have buzzed (no more teams can attempt).
   */
  allTeamsBuzzed(): boolean {
    const activeTeams = this.store.getActiveTeamIds()
    return activeTeams.every((t) => this.buzzedTeams.has(t))
  }

  /**
   * Get the list of teams that have already buzzed.
   */
  getBuzzedTeams(): TeamId[] {
    return Array.from(this.buzzedTeams)
  }

  /**
   * Reset for a new question.
   */
  reset(): void {
    this.buzzedTeams.clear()
    this.buzzedPlayers.clear()
    this.isOpen = false
    this.locked = false
    this.store.gameState.buzzedTeams = []
  }
}
