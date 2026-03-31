// =============================================================================
// CYBERSHOW 2026 — StateStore
// In-memory state with SQLite persistence (autosave/loadState)
// Owner: Agent 2
// =============================================================================

import { v4 as uuidv4 } from 'uuid'
import type {
  GameState,
  GameConfig,
  Player,
  Team,
  TeamId,
  ScoreEntry,
  Round,
} from '../../src/types/index.js'
import {
  GamePhase,
  PlayerState,
  TEAM_COLORS,
  DEFAULT_TEAM_NAMES,
} from '../../src/types/index.js'
import { autosave, loadState } from '../db/index.js'

// ---------------------------------------------------------------------------
// Default configuration
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: GameConfig = {
  teamCount: 4,
  teams: [
    { id: 'blue', name: DEFAULT_TEAM_NAMES.blue, maxPlayers: 150 },
    { id: 'red', name: DEFAULT_TEAM_NAMES.red, maxPlayers: 150 },
    { id: 'green', name: DEFAULT_TEAM_NAMES.green, maxPlayers: 150 },
    { id: 'yellow', name: DEFAULT_TEAM_NAMES.yellow, maxPlayers: 150 },
  ],
  questionsPerRound: { 1: 5, 2: 5, 3: 5 },
  pointsPerCorrectAnswer: 10,
  isDemo: false,
}

// ---------------------------------------------------------------------------
// StateStore
// ---------------------------------------------------------------------------

export class StateStore {
  players: Map<string, Player> = new Map()
  teams: Map<TeamId, Team> = new Map()
  gameState: GameState

  constructor() {
    this.gameState = this.createInitialGameState()
    this.initTeams()
  }

  private createInitialGameState(): GameState {
    return {
      phase: GamePhase.SETUP,
      currentRound: null,
      currentQuestionId: null,
      currentQuestionNum: 0,
      totalQuestionsInRound: 0,
      scores: [],
      buzzedTeams: [],
      activeResponderId: null,
      activeResponderTeamId: null,
      answerTimerStartedAt: null,
      isLastQuestion: false,
      isSuspenseActive: false,
      config: { ...DEFAULT_CONFIG },
    }
  }

  private initTeams(): void {
    const config = this.gameState.config
    for (const teamDef of config.teams) {
      this.teams.set(teamDef.id, {
        id: teamDef.id,
        name: teamDef.name,
        color: TEAM_COLORS[teamDef.id],
        points: 0,
        playerCount: 0,
        maxPlayers: teamDef.maxPlayers,
        isLocked: false,
        soundId: null,
        soundName: null,
      })
    }
    this.gameState.scores = this.buildScores()
  }

  // ---- Team helpers ----

  getActiveTeamIds(): TeamId[] {
    return this.gameState.config.teams.map((t) => t.id)
  }

  getTeam(teamId: TeamId): Team | undefined {
    return this.teams.get(teamId)
  }

  getTeamPlayers(teamId: TeamId): Player[] {
    const result: Player[] = []
    for (const p of this.players.values()) {
      if (p.teamId === teamId) result.push(p)
    }
    return result
  }

  getConnectedTeamPlayers(teamId: TeamId): Player[] {
    return this.getTeamPlayers(teamId).filter((p) => p.socketId !== '')
  }

  // ---- Player helpers ----

  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId)
  }

  getPlayerBySocketId(socketId: string): Player | undefined {
    for (const p of this.players.values()) {
      if (p.socketId === socketId) return p
    }
    return undefined
  }

  getPlayerBySessionToken(token: string): Player | undefined {
    for (const p of this.players.values()) {
      if (p.sessionToken === token) return p
    }
    return undefined
  }

  addPlayer(name: string, teamId: TeamId, socketId: string, isBot: boolean = false): Player {
    const id = uuidv4()
    const sessionToken = uuidv4()
    const uniqueName = this.resolveUniqueName(name, teamId)

    const player: Player = {
      id,
      name: uniqueName,
      teamId,
      sessionToken,
      socketId,
      connectedAt: Date.now(),
      isBot,
      state: PlayerState.LOBBY,
    }

    this.players.set(id, player)

    const team = this.teams.get(teamId)
    if (team) {
      team.playerCount++
    }

    return player
  }

  removePlayer(playerId: string): void {
    const player = this.players.get(playerId)
    if (!player) return

    const team = this.teams.get(player.teamId)
    if (team) {
      team.playerCount = Math.max(0, team.playerCount - 1)
    }

    this.players.delete(playerId)
  }

  private resolveUniqueName(name: string, teamId: TeamId): string {
    const trimmed = name.trim().slice(0, 15)
    if (trimmed === '') return 'Player'

    const existing = new Set<string>()
    for (const p of this.players.values()) {
      if (p.teamId === teamId) existing.add(p.name.toLowerCase())
    }

    if (!existing.has(trimmed.toLowerCase())) return trimmed

    for (let i = 1; i <= 999; i++) {
      const suffix = ` ${i}`
      const candidate = trimmed.slice(0, 15 - suffix.length) + suffix
      if (!existing.has(candidate.toLowerCase())) return candidate
    }

    return trimmed
  }

  // ---- Score helpers ----

  buildScores(): ScoreEntry[] {
    return this.getActiveTeamIds().map((id) => ({
      teamId: id,
      points: this.teams.get(id)?.points ?? 0,
    }))
  }

  // ---- Config ----

  updateConfig(partial: Partial<GameConfig>): void {
    Object.assign(this.gameState.config, partial)
    if (partial.teams) {
      this.initTeams()
    }
  }

  // ---- Persistence ----

  save(): void {
    this.gameState.scores = this.buildScores()
    autosave(this.gameState)
  }

  load(): boolean {
    const saved = loadState()
    if (!saved) return false
    this.gameState = saved
    this.initTeams()
    // Restore team scores from saved state
    for (const entry of saved.scores) {
      const team = this.teams.get(entry.teamId)
      if (team) team.points = entry.points
    }
    return true
  }

  // ---- Reset ----

  reset(): void {
    this.players.clear()
    this.teams.clear()
    this.gameState = this.createInitialGameState()
    this.initTeams()
    this.save()
  }
}
