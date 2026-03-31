import { useState, useEffect, useCallback } from 'react'
import { CyberPanel } from '@/components/ui/CyberPanel'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { TranslateFn } from '@/hooks/useI18n'

interface VoteSoundProps {
  t: TranslateFn
  options: string[]
  durationSeconds: number
  voteResults: Record<string, number>
  onVote: (soundId: string) => void
}

export function VoteSound({ t, options, durationSeconds, voteResults, onVote }: VoteSoundProps) {
  const [votedFor, setVotedFor] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(durationSeconds)

  useEffect(() => {
    setTimeLeft(durationSeconds)
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [durationSeconds])

  const handleVote = useCallback(
    (soundId: string) => {
      if (votedFor) return
      setVotedFor(soundId)
      onVote(soundId)
    },
    [votedFor, onVote],
  )

  const totalVotes = Object.values(voteResults).reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-col items-center gap-4 p-6 w-full max-w-sm">
      <h2 className="text-2xl font-bold neon-blue tracking-widest uppercase">
        {t('vote.title')}
      </h2>
      <p className="text-white/60 text-sm">{t('vote.subtitle')}</p>

      <div className="w-full flex items-center justify-between text-sm text-white/60">
        <span>{t('vote.timeLeft')}</span>
        <span
          className={`font-bold text-lg ${timeLeft <= 10 ? 'text-cyber-red' : 'text-cyber-blue'}`}
        >
          {timeLeft}s
        </span>
      </div>
      <ProgressBar value={timeLeft} max={durationSeconds} className="w-full" />

      <CyberPanel className="w-full" accent="blue" noPadding>
        <div className="flex flex-col gap-2 p-3">
          {options.map((soundId) => {
            const votes = voteResults[soundId] ?? 0
            const isVoted = votedFor === soundId
            const maxVotes = Math.max(1, ...Object.values(voteResults))
            const barWidth = totalVotes > 0 ? (votes / maxVotes) * 100 : 0

            return (
              <button
                key={soundId}
                type="button"
                disabled={votedFor !== null}
                onClick={() => handleVote(soundId)}
                className={[
                  'relative w-full text-left p-3 rounded-lg transition-all duration-200 overflow-hidden',
                  isVoted
                    ? 'border-2 border-cyber-blue'
                    : 'border border-white/10 hover:border-white/30',
                  votedFor !== null && !isVoted ? 'opacity-50' : '',
                ].join(' ')}
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                {/* Vote bar background */}
                <div
                  className="absolute inset-0 opacity-20 transition-all duration-500"
                  style={{
                    width: `${barWidth}%`,
                    background: 'linear-gradient(90deg, var(--cyber-blue), transparent)',
                  }}
                />
                <div className="relative flex items-center justify-between">
                  <span className="text-sm font-semibold text-white truncate">
                    {soundId}
                  </span>
                  <span className="text-xs text-white/50 ml-2 shrink-0">
                    {votes} {t('vote.votes')}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </CyberPanel>

      {votedFor && (
        <p className="text-cyber-green text-sm font-bold tracking-wider uppercase">
          {t('vote.voted')}
        </p>
      )}
    </div>
  )
}
