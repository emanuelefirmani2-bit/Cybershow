// =============================================================================
// CYBERSHOW 2026 — VoteManager
// Sound voting: 4 exclusive sounds per team, timer, tie-breaking
// Owner: Agent 2
// =============================================================================

import type { Server as SocketIOServer } from 'socket.io'
import type { TeamId } from '../../src/types/index.js'
import { SOCKET_EVENTS, SOCKET_ROOMS, teamRoom } from '../../src/types/index.js'
import type { StateStore } from './StateStore.js'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SOUNDS_DIR = path.join(__dirname, '../../media/sounds')
const VOTE_DURATION_MS = 60_000

interface TeamSoundOptions {
  teamId: TeamId
  sounds: string[] // sound IDs (filenames without extension)
}

export class VoteManager {
  /** sound options assigned per team */
  private teamOptions: Map<TeamId, string[]> = new Map()
  /** votes: soundId → count */
  private votes: Map<string, number> = new Map()
  /** track which players have voted (one vote per player) */
  private votedPlayers: Set<string> = new Set()
  /** timer handle */
  private voteTimer: ReturnType<typeof setTimeout> | null = null
  /** whether voting is in progress */
  private isVoting: boolean = false

  constructor(
    private store: StateStore,
    private io: SocketIOServer,
  ) {}

  /**
   * Start sound voting. Assigns 4 exclusive sounds to each active team.
   */
  startVote(): boolean {
    if (this.isVoting) return false

    const activeTeams = this.store.getActiveTeamIds()
    const allSounds = this.loadAvailableSounds()
    const requiredCount = activeTeams.length * 4

    if (allSounds.length < requiredCount) {
      console.error(
        `[Vote] Not enough sounds: need ${requiredCount}, found ${allSounds.length}`,
      )
      // Use what we have, distributing evenly
    }

    // Shuffle and assign 4 exclusive sounds per team
    const shuffled = this.shuffle([...allSounds])
    const options: Record<string, string[]> = {}

    for (let i = 0; i < activeTeams.length; i++) {
      const teamId = activeTeams[i]
      if (!teamId) continue
      const start = i * 4
      const teamSounds = shuffled.slice(start, start + 4)
      this.teamOptions.set(teamId, teamSounds)
      options[teamId] = teamSounds

      // Initialize vote counts
      for (const soundId of teamSounds) {
        this.votes.set(soundId, 0)
      }
    }

    this.votedPlayers.clear()
    this.isVoting = true

    // Broadcast START_VOTE
    this.io.to(SOCKET_ROOMS.GLOBAL).emit(SOCKET_EVENTS.START_VOTE, {
      options,
      durationSeconds: VOTE_DURATION_MS / 1000,
    })

    // Start timer
    this.voteTimer = setTimeout(() => {
      this.endVote()
    }, VOTE_DURATION_MS)

    console.log('[Vote] Voting started')
    return true
  }

  /**
   * Handle a player's vote.
   */
  castVote(playerId: string, soundId: string): boolean {
    if (!this.isVoting) return false

    // One vote per player
    if (this.votedPlayers.has(playerId)) return false

    const player = this.store.getPlayer(playerId)
    if (!player) return false

    // Verify the sound belongs to this player's team
    const teamSounds = this.teamOptions.get(player.teamId)
    if (!teamSounds || !teamSounds.includes(soundId)) return false

    this.votedPlayers.add(playerId)
    const current = this.votes.get(soundId) ?? 0
    this.votes.set(soundId, current + 1)

    // Broadcast vote update to the team room
    const teamVotes: Record<string, number> = {}
    for (const s of teamSounds) {
      teamVotes[s] = this.votes.get(s) ?? 0
    }

    this.io.to(teamRoom(player.teamId)).emit(SOCKET_EVENTS.VOTE_UPDATE, {
      votes: teamVotes,
    })

    console.log(`[Vote] ${player.name} voted for ${soundId}`)
    return true
  }

  /**
   * End voting early (Regia command) or when timer expires.
   */
  endVote(): void {
    if (!this.isVoting) return

    if (this.voteTimer) {
      clearTimeout(this.voteTimer)
      this.voteTimer = null
    }

    this.isVoting = false

    // Determine winner for each team
    const activeTeams = this.store.getActiveTeamIds()
    for (const teamId of activeTeams) {
      const sounds = this.teamOptions.get(teamId) ?? []
      if (sounds.length === 0) continue

      let maxVotes = -1
      const candidates: string[] = []

      for (const soundId of sounds) {
        const count = this.votes.get(soundId) ?? 0
        if (count > maxVotes) {
          maxVotes = count
          candidates.length = 0
          candidates.push(soundId)
        } else if (count === maxVotes) {
          candidates.push(soundId)
        }
      }

      // Tie-break: random pick
      const winner =
        candidates.length === 1
          ? candidates[0]!
          : candidates[Math.floor(Math.random() * candidates.length)]!

      // Assign sound to team
      const team = this.store.getTeam(teamId)
      if (team) {
        team.soundId = winner
        team.soundName = this.soundDisplayName(winner)
      }

      // Broadcast result to team room
      this.io.to(teamRoom(teamId)).emit(SOCKET_EVENTS.VOTE_RESULT, {
        winningSoundId: winner,
        soundName: this.soundDisplayName(winner),
      })

      console.log(`[Vote] ${teamId} sound: ${winner}`)
    }

    console.log('[Vote] Voting ended')
  }

  /**
   * Check if voting is currently active.
   */
  isVotingActive(): boolean {
    return this.isVoting
  }

  /**
   * Get the winning sound for a team (for late joiners).
   */
  getTeamSound(teamId: TeamId): { soundId: string; soundName: string } | null {
    const team = this.store.getTeam(teamId)
    if (!team || !team.soundId) return null
    return { soundId: team.soundId, soundName: team.soundName ?? team.soundId }
  }

  /**
   * Get sound options for a specific team (for late joiners during voting).
   */
  getTeamOptions(teamId: TeamId): string[] {
    return this.teamOptions.get(teamId) ?? []
  }

  // ---- Private helpers ----

  private loadAvailableSounds(): string[] {
    try {
      if (!fs.existsSync(SOUNDS_DIR)) {
        console.warn(`[Vote] Sounds directory not found: ${SOUNDS_DIR}`)
        return this.generatePlaceholderSounds()
      }

      const files = fs.readdirSync(SOUNDS_DIR)
      const sounds = files
        .filter((f) => /\.(mp3|wav|ogg)$/i.test(f))
        .map((f) => f.replace(/\.[^.]+$/, ''))

      if (sounds.length < 16) {
        console.warn(
          `[Vote] Only ${sounds.length} sounds found, need 16+ for 4 teams. Adding placeholders.`,
        )
        while (sounds.length < 16) {
          sounds.push(`placeholder_${sounds.length + 1}`)
        }
      }

      return sounds
    } catch {
      console.warn('[Vote] Error reading sounds directory, using placeholders')
      return this.generatePlaceholderSounds()
    }
  }

  private generatePlaceholderSounds(): string[] {
    const names = [
      'siren', 'duck', 'ambulance', 'scream',
      'horn', 'bell', 'whistle', 'thunder',
      'explosion', 'laser', 'trumpet', 'doorbell',
      'klaxon', 'gong', 'laughter', 'applause',
    ]
    return names
  }

  private soundDisplayName(soundId: string): string {
    return soundId
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = arr[i]!
      arr[i] = arr[j]!
      arr[j] = tmp
    }
    return arr
  }

  /**
   * Reset vote state.
   */
  reset(): void {
    if (this.voteTimer) {
      clearTimeout(this.voteTimer)
      this.voteTimer = null
    }
    this.teamOptions.clear()
    this.votes.clear()
    this.votedPlayers.clear()
    this.isVoting = false
  }
}
