import { useEffect, useState } from 'react'
import type { TranslateFn } from '@/hooks/useI18n'
import type { TeamId } from '@/types/index'
import { TEAM_COLORS, DEFAULT_TEAM_NAMES } from '@/types/index'

interface StateOverlayProps {
  t: TranslateFn
  type: 'correct' | 'error' | 'reveal' | 'vote_result' | 'red'
  points?: number
  revealImageUrl?: string
  voteWinnerName?: string
  respondingTeamId?: TeamId
  respondingTeamName?: string
}

// Haptic patterns
function vibrateCorrect() {
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100, 50, 200, 100, 300])
  }
}

function vibrateError() {
  if (navigator.vibrate) {
    navigator.vibrate(200)
  }
}

function vibrateRedLock() {
  if (navigator.vibrate) {
    navigator.vibrate(80)
  }
}

export function StateOverlay({
  t,
  type,
  points,
  revealImageUrl,
  voteWinnerName,
  respondingTeamId,
}: StateOverlayProps) {
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    if (type === 'correct') vibrateCorrect()
    if (type === 'error') vibrateError()
    if (type === 'red') vibrateRedLock()
  }, [type])

  // Red lock: shake on tap
  const handleRedTap = () => {
    if (type !== 'red') return
    setShaking(true)
    if (navigator.vibrate) navigator.vibrate([30, 20, 30, 20, 30])
    setTimeout(() => setShaking(false), 600)
  }

  if (type === 'correct') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6 text-center state-green-bg min-h-[50vh]">
        <div className="green-glow rounded-2xl p-8">
          <h2 className="text-4xl font-bold neon-green font-display tracking-widest">
            {t('correct.title')}
          </h2>
          <p className="text-white/70 text-lg mt-2">{t('correct.wellDone')}</p>
          {points !== undefined && (
            <p className="text-cyber-green text-2xl font-bold mt-4 font-display">
              {t('correct.points', { points })}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (type === 'error') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6 text-center state-red-bg min-h-[50vh]">
        <div className="red-lock rounded-2xl p-8">
          <h2 className="text-4xl font-bold text-cyber-red font-display tracking-widest">
            {t('error.title')}
          </h2>
          <p className="text-white/70 text-lg mt-2">{t('error.wrong')}</p>
          <p className="text-white/40 text-sm mt-4">{t('error.tryAgain')}</p>
        </div>
      </div>
    )
  }

  if (type === 'red') {
    const teamName = respondingTeamId
      ? DEFAULT_TEAM_NAMES[respondingTeamId]
      : '...'
    const teamColor = respondingTeamId ? TEAM_COLORS[respondingTeamId] : '#B22222'

    return (
      <div
        className="flex flex-col items-center justify-center gap-6 p-6 text-center state-red-bg min-h-[60vh]"
        onClick={handleRedTap}
      >
        <div
          className={`red-lock rounded-full w-32 h-32 flex items-center justify-center ${shaking ? '' : ''}`}
          style={shaking ? { animation: 'lockShake 0.5s ease-in-out' } : {}}
        >
          {/* Lock icon */}
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-cyber-red"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-cyber-red tracking-widest uppercase">
          {t('red.locked')}
        </h2>
        <p className="text-white/50 text-sm">
          {t('red.teamAnswering', { team: teamName })}
        </p>
        {respondingTeamId && (
          <div
            className="w-16 h-1 rounded-full"
            style={{ background: teamColor, boxShadow: `0 0 10px ${teamColor}` }}
          />
        )}
      </div>
    )
  }

  if (type === 'reveal' && revealImageUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-4 text-center min-h-[60vh]">
        <h2 className="text-xl font-bold neon-blue tracking-widest uppercase">
          {t('reveal.title')}
        </h2>
        <img
          src={revealImageUrl}
          alt="Reveal"
          className="w-full max-w-sm rounded-xl border-2 border-cyber-blue/30"
          style={{ boxShadow: 'var(--glow-blue)' }}
        />
      </div>
    )
  }

  if (type === 'vote_result' && voteWinnerName) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6 text-center min-h-[40vh]">
        <h2 className="text-lg font-bold neon-blue tracking-wider uppercase">
          {t('vote.result')}
        </h2>
        <p className="text-3xl font-bold text-cyber-pink font-display tracking-widest">
          {voteWinnerName}
        </p>
      </div>
    )
  }

  return null
}
