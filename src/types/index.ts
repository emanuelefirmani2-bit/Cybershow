// =============================================================================
// CYBERSHOW INTERACTIVE 2026 — Central Type Contract
// This file is the single source of truth for all shared types.
// Written by Agent 0. Read by all agents.
// =============================================================================

// ---------------------------------------------------------------------------
// Primitive types
// ---------------------------------------------------------------------------

export type Round = 1 | 2 | 3
export type MediaType = 'audio' | 'video' | 'image'
export type TeamId = 'blue' | 'red' | 'green' | 'yellow'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** All 17 smartphone states from §18 */
export enum PlayerState {
  LOGIN = 'LOGIN',
  LOBBY = 'LOBBY',
  VOTE_SOUND = 'VOTE_SOUND',
  WAITING = 'WAITING',
  COUNTDOWN = 'COUNTDOWN',
  BUZZER_ACTIVE = 'BUZZER_ACTIVE',
  GREEN_RESPONDER = 'GREEN_RESPONDER',
  GREEN_TEAMMATE = 'GREEN_TEAMMATE',
  RED = 'RED',
  CORRECT = 'CORRECT',
  REVEAL = 'REVEAL',
  ERROR = 'ERROR',
  PAUSED = 'PAUSED',
  FINALE_LOBBY = 'FINALE_LOBBY',
  WINNER = 'WINNER',
  LOSER = 'LOSER',
  END = 'END',
}

/** Ledwall visual states */
export enum LedwallState {
  QR_LOBBY = 'QR_LOBBY',
  TAPPO = 'TAPPO',
  PLAY = 'PLAY',
  FREEZE = 'FREEZE',
  UNFREEZE = 'UNFREEZE',
  REVEAL = 'REVEAL',
  HYPE_ROUND = 'HYPE_ROUND',
  FINALE = 'FINALE',
  PAUSED = 'PAUSED',
}

/** Server-side game phase state machine */
export enum GamePhase {
  SETUP = 'SETUP',
  LOBBY = 'LOBBY',
  VOTE = 'VOTE',
  PLAYING = 'PLAYING',
  BETWEEN_QUESTIONS = 'BETWEEN_QUESTIONS',
  BETWEEN_ROUNDS = 'BETWEEN_ROUNDS',
  FINALE_LOBBY = 'FINALE_LOBBY',
  FINALE = 'FINALE',
  ENDED = 'ENDED',
}

// ---------------------------------------------------------------------------
// Data interfaces
// ---------------------------------------------------------------------------

export interface Team {
  id: TeamId
  name: string
  color: string
  points: number
  playerCount: number
  maxPlayers: number
  isLocked: boolean
  soundId: string | null
  soundName: string | null
}

export interface Player {
  id: string
  name: string
  teamId: TeamId
  sessionToken: string
  socketId: string
  connectedAt: number
  isBot: boolean
  state: PlayerState
}

export interface Question {
  id: string
  round: Round
  questionTextIt: string
  questionTextEn: string
  correctAnswer: string
  acceptedAnswers: string[]
  mediaType: MediaType
  hasReveal: boolean
  order: number
}

export interface ScoreEntry {
  teamId: TeamId
  points: number
}

export interface GameConfig {
  teamCount: 2 | 3 | 4
  teams: Pick<Team, 'id' | 'name' | 'maxPlayers'>[]
  questionsPerRound: Record<Round, number>
  pointsPerCorrectAnswer: number
  isDemo: boolean
}

export interface GameState {
  phase: GamePhase
  currentRound: Round | null
  currentQuestionId: string | null
  currentQuestionNum: number
  totalQuestionsInRound: number
  scores: ScoreEntry[]
  buzzedTeams: TeamId[]
  activeResponderId: string | null
  activeResponderTeamId: TeamId | null
  answerTimerStartedAt: number | null
  isLastQuestion: boolean
  isSuspenseActive: boolean
  config: GameConfig
}

export interface ChatMessage {
  playerId: string
  playerName: string
  message: string
  timestamp: number
}

// ---------------------------------------------------------------------------
// Socket.io Event Payloads (§19)
// ---------------------------------------------------------------------------

// Client → Server
export interface PlayerJoinPayload {
  name: string
  teamId: TeamId
}

export interface CastVotePayload {
  soundId: string
}

export interface BuzzerPressPayload {
  playerId: string
  teamId: TeamId
  timestamp: number
}

export interface SubmitAnswerPayload {
  answer: string
}

export interface ChatMessagePayload {
  message: string
}

export interface CmdOverrideAnswerPayload {
  correct: boolean
}

export interface CmdBonusPayload {
  teamId: TeamId
  points: number
}

export interface CmdKickPlayerPayload {
  playerId: string
}

export interface CmdRenamePlayerPayload {
  playerId: string
  newName: string
}

export interface CmdPlayTrackPayload {
  questionId: string
}

// Server → Client
export interface TeamUpdatePayload {
  teams: Array<{ id: TeamId; name: string; count: number }>
}

export interface StartVotePayload {
  options: Record<TeamId, string[]>
  durationSeconds: number
}

export interface VoteUpdatePayload {
  votes: Record<string, number>
}

export interface VoteResultPayload {
  winningSoundId: string
  soundName: string
}

export interface StartGamePayload {
  teams: Team[]
}

export interface StateChangePayload {
  state: PlayerState
  data?: Record<string, unknown>
}

export interface CountdownPayload {
  seconds: number
}

export interface BuzzerResultPayload {
  winnerTeamId: TeamId
  winnerPlayerId: string
  winnerName: string
}

export interface AnswerResultPayload {
  correct: boolean
  teamId: TeamId
  answer: string
}

export interface ReopenBuzzersPayload {
  buzzedTeams: TeamId[]
}

export interface PlayTeamSoundPayload {
  teamId: TeamId
}

export interface PlayTrackPayload {
  audioUrl: string
}

export interface PlaySfxPayload {
  soundId: string
}

export interface ShowRevealPayload {
  imageUrl: string
  round: Round
}

export interface NextQuestionPayload {
  questionId: string
  round: Round
  questionNum: number
  totalQuestions: number
}

export interface NextRoundPayload {
  round: Round
  hypeVideoUrl: string
}

export interface ScoreUpdatePayload {
  scores: ScoreEntry[]
}

export interface KickPlayerPayload {
  reason: string
}

export interface RenamePlayerPayload {
  playerId: string
  newName: string
}

// ---------------------------------------------------------------------------
// Socket Event name constants (§19)
// ---------------------------------------------------------------------------

export const SOCKET_EVENTS = {
  // Client → Server (player)
  PLAYER_JOIN: 'PLAYER_JOIN',
  CAST_VOTE: 'CAST_VOTE',
  BUZZER_PRESS: 'BUZZER_PRESS',
  SUBMIT_ANSWER: 'SUBMIT_ANSWER',
  CHAT_MESSAGE: 'CHAT_MESSAGE',

  // Client → Server (regia commands)
  REGIA_HEARTBEAT: 'REGIA_HEARTBEAT',
  CMD_START_VOTE: 'CMD_START_VOTE',
  CMD_END_VOTE: 'CMD_END_VOTE',
  CMD_START_GAME: 'CMD_START_GAME',
  CMD_PLAY_TRACK: 'CMD_PLAY_TRACK',
  CMD_STOP_AUDIO: 'CMD_STOP_AUDIO',
  CMD_START_QUESTION: 'CMD_START_QUESTION',
  CMD_NEXT_QUESTION: 'CMD_NEXT_QUESTION',
  CMD_NEXT_ROUND: 'CMD_NEXT_ROUND',
  CMD_OVERRIDE_ANSWER: 'CMD_OVERRIDE_ANSWER',
  CMD_SKIP_QUESTION: 'CMD_SKIP_QUESTION',
  CMD_RESET_SOFT: 'CMD_RESET_SOFT',
  CMD_BONUS: 'CMD_BONUS',
  CMD_UNDO_SCORE: 'CMD_UNDO_SCORE',
  CMD_KICK_PLAYER: 'CMD_KICK_PLAYER',
  CMD_RENAME_PLAYER: 'CMD_RENAME_PLAYER',
  CMD_SUSPENSE: 'CMD_SUSPENSE',
  CMD_OK_FINALE: 'CMD_OK_FINALE',
  CMD_KICK_ALL: 'CMD_KICK_ALL',

  // Server → All
  TEAM_UPDATE: 'TEAM_UPDATE',
  START_VOTE: 'START_VOTE',
  START_GAME: 'START_GAME',
  STATE_CHANGE: 'STATE_CHANGE',
  COUNTDOWN: 'COUNTDOWN',
  BUZZER_RESULT: 'BUZZER_RESULT',
  FREEZE_MEDIA: 'FREEZE_MEDIA',
  UNFREEZE_MEDIA: 'UNFREEZE_MEDIA',
  ANSWER_RESULT: 'ANSWER_RESULT',
  REOPEN_BUZZERS: 'REOPEN_BUZZERS',
  SHOW_REVEAL: 'SHOW_REVEAL',
  NEXT_QUESTION: 'NEXT_QUESTION',
  NEXT_ROUND: 'NEXT_ROUND',
  LAST_QUESTION_ANIMATION: 'LAST_QUESTION_ANIMATION',
  SCORE_UPDATE: 'SCORE_UPDATE',
  GAME_PAUSED: 'GAME_PAUSED',
  GAME_RESUMED: 'GAME_RESUMED',
  KICK_PLAYER: 'KICK_PLAYER',
  KICK_ALL: 'KICK_ALL',
  RENAME_PLAYER: 'RENAME_PLAYER',

  // Server → Team Room
  VOTE_UPDATE: 'VOTE_UPDATE',
  VOTE_RESULT: 'VOTE_RESULT',
  CHAT_BROADCAST: 'CHAT_BROADCAST',

  // Server → Regia
  PLAY_TEAM_SOUND: 'PLAY_TEAM_SOUND',
  PLAY_TRACK: 'PLAY_TRACK',
  PLAY_SFX: 'PLAY_SFX',
  STOP_AUDIO: 'STOP_AUDIO',

  // Server → MIDI (internal)
  MIDI_SEND: 'MIDI_SEND',
} as const

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS]

// ---------------------------------------------------------------------------
// Socket Room constants
// ---------------------------------------------------------------------------

export const SOCKET_ROOMS = {
  GLOBAL: 'global',
  REGIA: 'regia',
  TEAM_BLUE: 'team:blue',
  TEAM_RED: 'team:red',
  TEAM_GREEN: 'team:green',
  TEAM_YELLOW: 'team:yellow',
} as const

export function teamRoom(teamId: TeamId): string {
  return `team:${teamId}`
}

// ---------------------------------------------------------------------------
// MIDI note constants (§13.2)
// ---------------------------------------------------------------------------

export const MIDI_NOTES = {
  BUZZER_BLUE: 48,   // C3
  BUZZER_RED: 50,    // D3
  BUZZER_GREEN: 52,  // E3
  BUZZER_YELLOW: 53, // F3
  CORRECT: 55,       // G3
  ERROR: 57,         // A3
  BLACKOUT: 59,      // B3
} as const

export const TEAM_MIDI_NOTE: Record<TeamId, number> = {
  blue: MIDI_NOTES.BUZZER_BLUE,
  red: MIDI_NOTES.BUZZER_RED,
  green: MIDI_NOTES.BUZZER_GREEN,
  yellow: MIDI_NOTES.BUZZER_YELLOW,
}

// ---------------------------------------------------------------------------
// Team color constants
// ---------------------------------------------------------------------------

export const TEAM_COLORS: Record<TeamId, string> = {
  blue: '#00AEEF',
  red: '#B22222',
  green: '#2E8B57',
  yellow: '#FFD700',
}

export const DEFAULT_TEAM_NAMES: Record<TeamId, string> = {
  blue: 'Team Blu',
  red: 'Team Rosso',
  green: 'Team Verde',
  yellow: 'Team Giallo',
}
