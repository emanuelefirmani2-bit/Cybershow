import { ReactNode } from 'react'
import { LedwallState } from '@/types/index'
import type { Round, ScoreEntry, BuzzerResultPayload } from '@/types/index'
import { VideoPlayer } from '@/components/ledwall/VideoPlayer'
import { Tappo } from '@/components/ledwall/Tappo'
import { IceOverlay } from '@/components/ledwall/IceOverlay'

interface LayerManagerProps {
  state: LedwallState
  round: Round | null
  questionId?: string
  isFrozen: boolean
  scores: ScoreEntry[]
  questionNum: number
  totalQuestions: number
  buzzerWinner: BuzzerResultPayload | null
  countdown: number | null
  answerTimerStart: number | null
  overlayContent?: ReactNode
}

export function LayerManager({
  state,
  round,
  questionId,
  isFrozen,
  scores,
  questionNum,
  totalQuestions,
  buzzerWinner,
  countdown,
  answerTimerStart,
  overlayContent,
}: LayerManagerProps) {
  const showMedia = state === LedwallState.PLAY ||
    state === LedwallState.FREEZE ||
    state === LedwallState.UNFREEZE ||
    state === LedwallState.REVEAL

  const showTappo = state === LedwallState.TAPPO

  const showIce = state === LedwallState.FREEZE ||
    state === LedwallState.REVEAL

  return (
    <div className="absolute inset-0">
      {/* L0 — Cyberpunk background */}
      <div
        className="absolute inset-0 circuit-bg"
        style={{
          zIndex: 0,
          background: 'var(--cyber-bg)',
        }}
      >
        {/* Subtle animated particles */}
        <div className="particles-bg">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${(i / 12) * 100}%`,
                animationDuration: `${8 + (i % 4) * 2}s`,
                animationDelay: `${(i % 5) * 1.5}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* L1 — Media (video/image) */}
      <VideoPlayer
        round={round}
        questionId={questionId}
        isFrozen={isFrozen}
        visible={showMedia}
      />

      {/* L2 — Tappo (veil) with scoreboard overlay */}
      <Tappo
        visible={showTappo}
        scores={scores}
        questionNum={questionNum}
        totalQuestions={totalQuestions}
      />

      {/* L3 — Overlay (winner name, countdown, timer) */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 30 }}>
        {/* Countdown display */}
        {countdown !== null && countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="countdown-number"
              key={countdown}
            >
              {countdown}
            </span>
          </div>
        )}

        {/* Buzzer winner overlay */}
        {buzzerWinner && (state === LedwallState.FREEZE || state === LedwallState.REVEAL) && (
          <BuzzerWinnerOverlay
            winnerName={buzzerWinner.winnerName}
            winnerTeamId={buzzerWinner.winnerTeamId}
          />
        )}

        {/* Answer timer (60s) */}
        {answerTimerStart && state === LedwallState.FREEZE && (
          <AnswerTimer startTime={answerTimerStart} />
        )}

        {/* Reveal image overlay */}
        {state === LedwallState.REVEAL && overlayContent}
      </div>

      {/* L4 — Ice overlay (borders) */}
      <IceOverlay visible={showIce} />
    </div>
  )
}

// -- Sub-components --

import { motion } from 'framer-motion'
import { TEAM_COLORS, DEFAULT_TEAM_NAMES } from '@/types/index'
import type { TeamId } from '@/types/index'
import { useState, useEffect } from 'react'

function BuzzerWinnerOverlay({ winnerName, winnerTeamId }: { winnerName: string; winnerTeamId: TeamId }) {
  const color = TEAM_COLORS[winnerTeamId] ?? '#00AEEF'
  const teamName = DEFAULT_TEAM_NAMES[winnerTeamId] ?? winnerTeamId

  return (
    <motion.div
      className="absolute bottom-16 left-0 right-0 flex flex-col items-center"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div
        className="px-8 py-4 rounded-xl"
        style={{
          background: `linear-gradient(135deg, ${color}30 0%, rgba(26,26,46,0.9) 100%)`,
          border: `2px solid ${color}`,
          boxShadow: `0 0 30px ${color}40`,
        }}
      >
        <p
          className="text-4xl font-bold tracking-wider text-center"
          style={{
            fontFamily: "'Bangers', sans-serif",
            color,
            textShadow: `0 0 15px ${color}`,
            letterSpacing: '0.1em',
          }}
        >
          {winnerName}
        </p>
        <p
          className="text-xl font-bold tracking-widest text-center mt-1"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            color: `${color}cc`,
          }}
        >
          {teamName}
        </p>
      </div>
    </motion.div>
  )
}

function AnswerTimer({ startTime }: { startTime: number }) {
  const [remaining, setRemaining] = useState(60)

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const left = Math.max(0, 60 - elapsed)
      setRemaining(left)
      if (left === 0) clearInterval(interval)
    }, 200)
    return () => clearInterval(interval)
  }, [startTime])

  const isDanger = remaining <= 10

  return (
    <motion.div
      className="absolute top-8 left-1/2 -translate-x-1/2"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div
        className="px-6 py-3 rounded-xl"
        style={{
          background: isDanger
            ? 'linear-gradient(135deg, rgba(178,34,34,0.3) 0%, rgba(26,26,46,0.9) 100%)'
            : 'rgba(22,33,62,0.8)',
          border: `2px solid ${isDanger ? 'var(--cyber-red)' : 'var(--cyber-blue)'}`,
          boxShadow: isDanger ? 'var(--glow-red)' : 'var(--glow-blue)',
        }}
      >
        <span
          className="text-5xl font-bold"
          style={{
            fontFamily: "'Bangers', sans-serif",
            color: isDanger ? 'var(--cyber-red)' : 'var(--cyber-blue)',
            textShadow: isDanger
              ? '0 0 15px var(--cyber-red)'
              : '0 0 15px var(--cyber-blue)',
            letterSpacing: '0.05em',
          }}
        >
          {remaining}s
        </span>
      </div>
    </motion.div>
  )
}
