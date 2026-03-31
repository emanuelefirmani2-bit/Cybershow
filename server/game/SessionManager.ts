// =============================================================================
// CYBERSHOW 2026 — SessionManager
// Session tokens, reconnection, late join, duplicate names
// Owner: Agent 2
// =============================================================================

import type { Server as SocketIOServer, Socket } from 'socket.io'
import type { Player, TeamId, PlayerState } from '../../src/types/index.js'
import { SOCKET_EVENTS, SOCKET_ROOMS, teamRoom } from '../../src/types/index.js'
import { GamePhase, PlayerState as PS } from '../../src/types/index.js'
import type { StateStore } from './StateStore.js'

export class SessionManager {
  constructor(
    private store: StateStore,
    private io: SocketIOServer,
  ) {}

  /**
   * Handle PLAYER_JOIN: create player or reconnect via session token.
   * Returns the player and whether it was a reconnection.
   */
  handleJoin(
    socket: Socket,
    name: string,
    teamId: TeamId,
    sessionToken?: string,
  ): { player: Player; reconnected: boolean } | { error: string } {
    // Try reconnect first
    if (sessionToken) {
      const existing = this.store.getPlayerBySessionToken(sessionToken)
      if (existing) {
        return this.reconnectPlayer(socket, existing)
      }
    }

    // Validate team exists and is not full/locked
    const team = this.store.getTeam(teamId)
    if (!team) {
      return { error: 'Team does not exist' }
    }

    const activeTeamIds = this.store.getActiveTeamIds()
    if (!activeTeamIds.includes(teamId)) {
      return { error: 'Team is not active' }
    }

    if (team.isLocked) {
      return { error: 'Team is locked' }
    }

    if (team.playerCount >= team.maxPlayers) {
      return { error: 'Team is full' }
    }

    // Create new player
    const player = this.store.addPlayer(name, teamId, socket.id)

    // Join Socket rooms
    socket.join(SOCKET_ROOMS.GLOBAL)
    socket.join(teamRoom(teamId))

    // Determine correct initial state based on current game phase
    player.state = this.getInitialStateForPhase(this.store.gameState.phase)

    console.log(
      `[Session] New player: ${player.name} (${player.id}) → team ${teamId}`,
    )

    return { player, reconnected: false }
  }

  /**
   * Reconnect a disconnected player to a new socket.
   */
  private reconnectPlayer(
    socket: Socket,
    player: Player,
  ): { player: Player; reconnected: boolean } {
    player.socketId = socket.id

    socket.join(SOCKET_ROOMS.GLOBAL)
    socket.join(teamRoom(player.teamId))

    console.log(
      `[Session] Reconnected: ${player.name} (${player.id}) → socket ${socket.id}`,
    )

    return { player, reconnected: true }
  }

  /**
   * Handle socket disconnect — mark player as disconnected (empty socketId).
   * Does NOT remove player — they can reconnect.
   */
  handleDisconnect(socketId: string): Player | undefined {
    const player = this.store.getPlayerBySocketId(socketId)
    if (!player) return undefined

    player.socketId = ''
    console.log(
      `[Session] Disconnected: ${player.name} (${player.id})`,
    )

    return player
  }

  /**
   * Kick a specific player.
   */
  kickPlayer(playerId: string, reason: string): boolean {
    const player = this.store.getPlayer(playerId)
    if (!player) return false

    // Send kick event to their socket if connected
    if (player.socketId) {
      const socket = this.io.sockets.sockets.get(player.socketId)
      if (socket) {
        socket.emit(SOCKET_EVENTS.KICK_PLAYER, { reason })
        socket.leave(SOCKET_ROOMS.GLOBAL)
        socket.leave(teamRoom(player.teamId))
        socket.disconnect(true)
      }
    }

    this.store.removePlayer(playerId)
    console.log(`[Session] Kicked player: ${player.name} (${playerId}) — ${reason}`)
    return true
  }

  /**
   * Rename a player. Max 15 chars.
   */
  renamePlayer(playerId: string, newName: string): boolean {
    const player = this.store.getPlayer(playerId)
    if (!player) return false

    const trimmed = newName.trim().slice(0, 15)
    if (trimmed === '') return false

    player.name = trimmed
    console.log(`[Session] Renamed player ${playerId} → "${trimmed}"`)
    return true
  }

  /**
   * Kick all players and reset state.
   */
  kickAll(): void {
    // Disconnect all sockets
    for (const player of this.store.players.values()) {
      if (player.socketId) {
        const socket = this.io.sockets.sockets.get(player.socketId)
        if (socket) {
          socket.emit(SOCKET_EVENTS.KICK_ALL)
          socket.disconnect(true)
        }
      }
    }

    this.store.reset()
    console.log('[Session] KICK_ALL — all players removed, state reset')
  }

  /**
   * Determine the initial PlayerState for a late-joining player
   * based on the current GamePhase.
   */
  private getInitialStateForPhase(phase: GamePhase): PlayerState {
    switch (phase) {
      case GamePhase.SETUP:
      case GamePhase.LOBBY:
        return PS.LOBBY
      case GamePhase.VOTE:
        return PS.VOTE_SOUND
      case GamePhase.PLAYING:
      case GamePhase.BETWEEN_QUESTIONS:
      case GamePhase.BETWEEN_ROUNDS:
        return PS.WAITING
      case GamePhase.FINALE_LOBBY:
        return PS.FINALE_LOBBY
      case GamePhase.FINALE:
      case GamePhase.ENDED:
        return PS.END
      default:
        return PS.LOBBY
    }
  }

  /**
   * Set state for all players on a specific team.
   */
  setTeamPlayersState(teamId: TeamId, state: PlayerState): void {
    for (const player of this.store.getTeamPlayers(teamId)) {
      player.state = state
    }
  }

  /**
   * Set state for all connected players.
   */
  setAllPlayersState(state: PlayerState): void {
    for (const player of this.store.players.values()) {
      player.state = state
    }
  }

  /**
   * Find the longest-session connected teammate (for responder failover).
   */
  findOldestConnectedTeammate(teamId: TeamId, excludePlayerId: string): Player | undefined {
    const teammates = this.store.getConnectedTeamPlayers(teamId)
      .filter((p) => p.id !== excludePlayerId)
    if (teammates.length === 0) return undefined

    let oldest = teammates[0]
    for (let i = 1; i < teammates.length; i++) {
      const p = teammates[i]
      if (p && oldest && p.connectedAt < oldest.connectedAt) {
        oldest = p
      }
    }
    return oldest
  }
}
