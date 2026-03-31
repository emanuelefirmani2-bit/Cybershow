import { useEffect, useState, useCallback } from 'react'
import { Scanlines } from '@/components/ui/Scanlines'
import { PlayerState, SOCKET_EVENTS, TEAM_COLORS, DEFAULT_TEAM_NAMES } from '@/types/index'
import type { TeamId, TeamUpdatePayload, CastVotePayload, SubmitAnswerPayload } from '@/types/index'
import { useSocket } from '@/hooks/useSocket'
import { useGameState } from '@/hooks/useGameState'
import { useBuzzer } from '@/hooks/useBuzzer'
import { useChat } from '@/hooks/useChat'
import { useI18n } from '@/hooks/useI18n'
import { LoginForm } from '@/components/smartphone/LoginForm'
import { Lobby } from '@/components/smartphone/Lobby'
import { VoteSound } from '@/components/smartphone/VoteSound'
import { Waiting } from '@/components/smartphone/Waiting'
import { Countdown } from '@/components/smartphone/Countdown'
import { BuzzerButton } from '@/components/smartphone/BuzzerButton'
import { AnswerBox } from '@/components/smartphone/AnswerBox'
import { TeamChat } from '@/components/smartphone/TeamChat'
import { StateOverlay } from '@/components/smartphone/StateOverlay'
import { LanguageSwitch } from '@/components/smartphone/LanguageSwitch'
import { FinaleScreens } from '@/components/smartphone/FinaleScreens'

interface TeamInfo {
  id: TeamId
  name: string
  count: number
}

/**
 * PlayerView — Root container for the smartphone PWA.
 * Routes all 17 PlayerState values to the correct component.
 * Renders STATE_PAUSED overlay on top of any state.
 */
export default function PlayerView() {
  const { t, locale, toggleLocale } = useI18n()
  const { socket, connected, session, join } = useSocket()
  const gameState = useGameState(socket, session !== null)
  const { press: buzzerPress, isActive: buzzerIsActive } = useBuzzer({
    socket,
    playerId: session?.playerId ?? null,
    teamId: session?.teamId ?? null,
    playerState: gameState.playerState,
  })
  const { messages, sendMessage, resetChat, maxLength } = useChat(socket)

  const [teams, setTeams] = useState<TeamInfo[]>([])

  // Listen for team updates
  useEffect(() => {
    if (!socket) return

    const handler = (payload: TeamUpdatePayload) => {
      setTeams(payload.teams)
    }

    socket.on(SOCKET_EVENTS.TEAM_UPDATE, handler)
    return () => {
      socket.off(SOCKET_EVENTS.TEAM_UPDATE, handler)
    }
  }, [socket])

  // Reset chat on each new question
  useEffect(() => {
    resetChat()
  }, [gameState.currentQuestion?.questionId, resetChat])

  // Handle join
  const handleJoin = useCallback(
    (name: string, teamId: TeamId) => {
      join(name, teamId)
    },
    [join],
  )

  // Handle vote
  const handleVote = useCallback(
    (soundId: string) => {
      if (!socket) return
      const payload: CastVotePayload = { soundId }
      socket.emit(SOCKET_EVENTS.CAST_VOTE, payload)
    },
    [socket],
  )

  // Handle answer submit
  const handleSubmitAnswer = useCallback(
    (answer: string) => {
      if (!socket) return
      const payload: SubmitAnswerPayload = { answer }
      socket.emit(SOCKET_EVENTS.SUBMIT_ANSWER, payload)
    },
    [socket],
  )

  // Determine if language switch should be visible
  const showLanguageSwitch =
    gameState.playerState !== PlayerState.COUNTDOWN &&
    gameState.playerState !== PlayerState.BUZZER_ACTIVE

  // Resolve team info
  const teamColor = session?.teamId ? TEAM_COLORS[session.teamId] : '#00AEEF'
  const teamName = session?.teamId ? DEFAULT_TEAM_NAMES[session.teamId] : ''

  // Render state-specific content
  function renderState() {
    switch (gameState.playerState) {
      case PlayerState.LOGIN:
        return (
          <LoginForm
            t={t}
            teams={teams}
            onJoin={handleJoin}
          />
        )

      case PlayerState.LOBBY:
        return (
          <Lobby
            t={t}
            playerName={session?.name ?? ''}
            teamName={teamName}
            teamColor={teamColor}
          />
        )

      case PlayerState.VOTE_SOUND:
        return (
          <VoteSound
            t={t}
            options={gameState.voteOptions}
            durationSeconds={gameState.voteDuration}
            voteResults={gameState.voteResults}
            onVote={handleVote}
          />
        )

      case PlayerState.WAITING:
        return (
          <Waiting
            t={t}
            teamId={session?.teamId ?? null}
            scores={gameState.scores}
          />
        )

      case PlayerState.COUNTDOWN:
        return <Countdown t={t} seconds={gameState.countdown} />

      case PlayerState.BUZZER_ACTIVE:
        return (
          <BuzzerButton
            t={t}
            isActive={buzzerIsActive}
            onPress={buzzerPress}
          />
        )

      case PlayerState.GREEN_RESPONDER:
        return (
          <div className="flex flex-col items-center gap-4 w-full state-green-bg min-h-screen p-4">
            <div className="green-glow rounded-xl p-3 w-full">
              <AnswerBox
                t={t}
                timerStartedAt={gameState.stateData['timerStartedAt'] as number | null ?? null}
                timerDuration={60}
                onSubmit={handleSubmitAnswer}
              />
            </div>
            {/* Chat visible for responder too (above box per PRD §6.4) */}
            <TeamChat
              t={t}
              messages={messages}
              onSend={sendMessage}
              maxLength={maxLength}
            />
          </div>
        )

      case PlayerState.GREEN_TEAMMATE:
        return (
          <div className="flex flex-col items-center gap-4 w-full state-green-bg min-h-screen p-4">
            <h2 className="text-xl font-bold neon-green tracking-widest uppercase">
              {t('green.teamAnswering')}
            </h2>
            <TeamChat
              t={t}
              messages={messages}
              onSend={sendMessage}
              maxLength={maxLength}
            />
          </div>
        )

      case PlayerState.RED:
        return (
          <StateOverlay
            t={t}
            type="red"
            respondingTeamId={gameState.buzzerWinner?.winnerTeamId}
          />
        )

      case PlayerState.CORRECT:
        return (
          <StateOverlay
            t={t}
            type="correct"
            points={gameState.stateData['points'] as number | undefined}
          />
        )

      case PlayerState.REVEAL:
        return (
          <StateOverlay
            t={t}
            type="reveal"
            revealImageUrl={gameState.revealData?.imageUrl}
          />
        )

      case PlayerState.ERROR:
        return <StateOverlay t={t} type="error" />

      case PlayerState.FINALE_LOBBY:
        return <FinaleScreens t={t} type="lobby" />

      case PlayerState.WINNER:
        return <FinaleScreens t={t} type="winner" />

      case PlayerState.LOSER:
        return <FinaleScreens t={t} type="loser" />

      case PlayerState.END:
        return <FinaleScreens t={t} type="end" />

      case PlayerState.PAUSED:
        // PAUSED is handled as an overlay, render previous state underneath
        return null

      default:
        return null
    }
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center circuit-bg relative overflow-auto"
      style={{ background: 'var(--cyber-bg)' }}
    >
      <Scanlines opacity={0.3} />

      {/* Language switch (hidden during COUNTDOWN and BUZZER_ACTIVE) */}
      {showLanguageSwitch && (
        <LanguageSwitch t={t} locale={locale} onToggle={toggleLocale} />
      )}

      {/* Main content */}
      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col items-center justify-center flex-1">
        {renderState()}
      </div>

      {/* Connection indicator */}
      {!connected && (
        <div className="fixed bottom-2 left-2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyber-red/80 text-white text-xs font-bold">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          Reconnecting...
        </div>
      )}

      {/* STATE_PAUSED overlay — rendered on top of any state */}
      {gameState.isPaused && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-8">
            <div className="w-16 h-16 rounded-full border-4 border-cyber-blue flex items-center justify-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-cyber-blue"
              >
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold neon-blue tracking-widest uppercase">
              {t('paused.title')}
            </h2>
            <p className="text-white/50 text-sm">{t('paused.message')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
