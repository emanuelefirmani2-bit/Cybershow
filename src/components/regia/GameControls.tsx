import { useState, useEffect, useRef } from 'react'
import { CyberButton } from '@/components/ui/CyberButton'
import { CyberPanel } from '@/components/ui/CyberPanel'
import { CyberInput } from '@/components/ui/CyberInput'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { GameState, TeamId } from '@/types/index'
import { GamePhase as GP, DEFAULT_TEAM_NAMES } from '@/types/index'

interface GameControlsProps {
  gameState: GameState | null
  onStartVote: () => void
  onStartGame: () => void
  onPlayTrack: (questionId: string) => void
  onStopAudio: () => void
  onStartQuestion: () => void
  onNextQuestion: () => void
  onNextRound: () => void
  onOverrideAnswer: (correct: boolean) => void
  onSkipQuestion: () => void
  onResetSoft: () => void
  onBonus: (teamId: TeamId, points: number) => void
  onUndoScore: () => void
  onSuspense: () => void
  onOkFinale: () => void
  onKickAll: () => void
}

const TIMER_DURATION = 60

export function GameControls({
  gameState,
  onStartVote,
  onStartGame,
  onPlayTrack,
  onStopAudio,
  onStartQuestion,
  onNextQuestion,
  onNextRound,
  onOverrideAnswer,
  onSkipQuestion,
  onResetSoft,
  onBonus,
  onUndoScore,
  onSuspense,
  onOkFinale,
  onKickAll,
}: GameControlsProps) {
  const phase = gameState?.phase ?? GP.SETUP
  const currentRound = gameState?.currentRound ?? null
  const isR1 = currentRound === 1
  const questionId = gameState?.currentQuestionId ?? null
  const hasResponder = !!gameState?.activeResponderId
  const isSuspenseActive = gameState?.isSuspenseActive ?? false

  // Answer timer
  const [timerSeconds, setTimerSeconds] = useState(TIMER_DURATION)
  const [timerRunning, setTimerRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (hasResponder && gameState?.answerTimerStartedAt) {
      setTimerSeconds(TIMER_DURATION)
      setTimerRunning(true)
    } else {
      setTimerRunning(false)
      setTimerSeconds(TIMER_DURATION)
    }
  }, [hasResponder, gameState?.answerTimerStartedAt])

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setTimerRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timerRunning])

  // Bonus state
  const [bonusTeam, setBonusTeam] = useState<TeamId>('blue')
  const [bonusPoints, setBonusPoints] = useState('0')

  // Kick all confirm
  const [kickAllConfirm, setKickAllConfirm] = useState(false)

  const isPlaying = phase === GP.PLAYING
  const isBetweenQuestions = phase === GP.BETWEEN_QUESTIONS
  const isBetweenRounds = phase === GP.BETWEEN_ROUNDS
  const isFinale = phase === GP.FINALE || phase === GP.FINALE_LOBBY
  const isSetup = phase === GP.SETUP
  const isLobby = phase === GP.LOBBY
  const isVote = phase === GP.VOTE

  // Button enable/disable logic
  const canStartVote = isSetup || isLobby
  const canStartGame = isLobby || isVote || isSetup
  const canPlayTrack = isR1 && (isPlaying || isBetweenQuestions) && questionId !== null
  const canStopAudio = isR1 && (isPlaying || isBetweenQuestions)
  const canStartQuestion = isPlaying || isBetweenQuestions
  const canNextQuestion = isBetweenQuestions || isPlaying
  const canNextRound = isBetweenRounds
  const canOverride = hasResponder && isPlaying
  const canSkip = isPlaying
  const canResetSoft = isPlaying
  const canSuspense = isFinale && !isSuspenseActive
  const canOkFinale = isFinale && isSuspenseActive

  const questionLabel = gameState
    ? `Q${gameState.currentQuestionNum}/${gameState.totalQuestionsInRound}`
    : '—'
  const roundLabel = currentRound ? `Round ${currentRound}` : '—'
  const responderLabel = gameState?.activeResponderId
    ? `Responder: ${gameState.activeResponderTeamId}`
    : 'No responder'

  return (
    <div className="flex flex-col gap-3">
      {/* Status bar */}
      <div className="flex items-center gap-4 text-sm">
        <span className="px-2 py-1 rounded bg-cyber-blue/20 text-cyber-blue font-mono text-xs">
          {phase}
        </span>
        <span className="text-white/60">{roundLabel}</span>
        <span className="text-white/60">{questionLabel}</span>
        <span className="text-white/40 text-xs">{responderLabel}</span>
      </div>

      {/* Main controls */}
      <CyberPanel title="GAME CONTROLS" accent="blue" className="overflow-visible">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          <CyberButton
            variant="accent"
            size="sm"
            disabled={!canStartVote}
            onClick={onStartVote}
          >
            AVVIA VOTAZIONE
          </CyberButton>

          <CyberButton
            variant="primary"
            size="sm"
            disabled={!canStartGame}
            onClick={onStartGame}
          >
            AVVIA PARTITA
          </CyberButton>

          <CyberButton
            variant="primary"
            size="sm"
            disabled={!canPlayTrack}
            onClick={() => { if (questionId) onPlayTrack(questionId) }}
          >
            PLAY TRACCIA
          </CyberButton>

          <CyberButton
            variant="danger"
            size="sm"
            disabled={!canStopAudio}
            onClick={onStopAudio}
          >
            STOP MUSICA
          </CyberButton>

          <CyberButton
            variant="success"
            size="sm"
            disabled={!canStartQuestion}
            onClick={onStartQuestion}
          >
            {isR1 ? 'START' : 'VIA'}
          </CyberButton>

          <CyberButton
            variant="primary"
            size="sm"
            disabled={!canNextRound}
            onClick={onNextRound}
          >
            PROSSIMO ROUND
          </CyberButton>

          <CyberButton
            variant="primary"
            size="sm"
            disabled={!canNextQuestion}
            onClick={onNextQuestion}
          >
            PROSSIMA DOMANDA
          </CyberButton>

          <CyberButton
            variant="ghost"
            size="sm"
            disabled={!canSkip}
            onClick={onSkipQuestion}
          >
            SKIP
          </CyberButton>
        </div>
      </CyberPanel>

      {/* Answer controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <CyberPanel title="ANSWER OVERRIDE" accent="green">
          <div className="flex gap-2 mb-3">
            <CyberButton
              variant="success"
              size="sm"
              disabled={!canOverride}
              onClick={() => onOverrideAnswer(true)}
              className="flex-1"
            >
              CORRETTO
            </CyberButton>
            <CyberButton
              variant="danger"
              size="sm"
              disabled={!canOverride}
              onClick={() => onOverrideAnswer(false)}
              className="flex-1"
            >
              SBAGLIATO
            </CyberButton>
          </div>

          <div className="flex gap-2">
            <CyberButton
              variant="ghost"
              size="sm"
              onClick={onUndoScore}
            >
              Annulla Punto
            </CyberButton>
            <CyberButton
              variant="ghost"
              size="sm"
              disabled={!canResetSoft}
              onClick={onResetSoft}
            >
              Reset Soft
            </CyberButton>
          </div>
        </CyberPanel>

        {/* Timer */}
        <CyberPanel title="ANSWER TIMER" accent="pink">
          {timerRunning ? (
            <>
              <div className="text-3xl font-mono font-bold text-center mb-2" style={{
                color: timerSeconds <= 10 ? 'var(--cyber-red)' : 'var(--cyber-blue)',
              }}>
                {timerSeconds}s
              </div>
              <ProgressBar
                value={timerSeconds}
                max={TIMER_DURATION}
                danger={timerSeconds <= 10}
              />
            </>
          ) : (
            <div className="text-center text-white/30 text-sm py-4">
              Timer inactive
            </div>
          )}
        </CyberPanel>
      </div>

      {/* Bonus & Finale */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <CyberPanel title="BONUS" accent="blue">
          <div className="flex gap-2 items-end mb-2">
            <div className="flex-1">
              <label className="text-xs text-cyber-blue uppercase tracking-wider font-bold block mb-1">Team</label>
              <select
                value={bonusTeam}
                onChange={e => setBonusTeam(e.target.value as TeamId)}
                className="w-full px-3 py-2 bg-cyber-dark border border-cyber-blue/40 rounded-lg text-white text-sm"
              >
                {(['blue', 'red', 'green', 'yellow'] as TeamId[]).map(t => (
                  <option key={t} value={t}>{DEFAULT_TEAM_NAMES[t]}</option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <CyberInput
                label="Points"
                type="number"
                value={bonusPoints}
                onChange={e => setBonusPoints(e.target.value)}
                className="text-sm"
              />
            </div>
            <CyberButton
              variant="primary"
              size="sm"
              onClick={() => {
                const pts = parseInt(bonusPoints, 10)
                if (!isNaN(pts) && pts >= -50 && pts <= 50) {
                  onBonus(bonusTeam, pts)
                  setBonusPoints('0')
                }
              }}
            >
              APPLY
            </CyberButton>
          </div>
          <p className="text-xs text-white/30">Range: -50 to +50</p>
        </CyberPanel>

        <CyberPanel title="FINALE & TERMINATION" accent="red">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <CyberButton
                variant="accent"
                size="sm"
                disabled={!canSuspense}
                onClick={onSuspense}
                className="flex-1"
              >
                SUSPENSE
              </CyberButton>
              <CyberButton
                variant="success"
                size="sm"
                disabled={!canOkFinale}
                onClick={onOkFinale}
                className="flex-1"
              >
                OK FINALE
              </CyberButton>
            </div>

            {!kickAllConfirm ? (
              <CyberButton
                variant="danger"
                size="sm"
                onClick={() => setKickAllConfirm(true)}
              >
                KICK ALL
              </CyberButton>
            ) : (
              <div className="flex gap-2">
                <CyberButton
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    onKickAll()
                    setKickAllConfirm(false)
                  }}
                >
                  CONFIRM KICK ALL
                </CyberButton>
                <CyberButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setKickAllConfirm(false)}
                >
                  CANCEL
                </CyberButton>
              </div>
            )}
          </div>
        </CyberPanel>
      </div>
    </div>
  )
}
