import type { ScoreEntry, TeamId } from '@/types/index'
import { TEAM_COLORS } from '@/types/index'
import type { TranslateFn } from '@/hooks/useI18n'

interface WaitingProps {
  t: TranslateFn
  teamId: TeamId | null
  scores: ScoreEntry[]
}

export function Waiting({ t, teamId, scores }: WaitingProps) {
  const myScore = scores.find((s) => s.teamId === teamId)

  return (
    <div className="flex flex-col items-center justify-center gap-8 p-6 text-center state-waiting-bg">
      <h2 className="text-2xl font-bold neon-blue tracking-widest uppercase">
        {t('waiting.title')}
      </h2>

      {myScore !== undefined && teamId && (
        <div
          className="flex flex-col items-center gap-2 p-6 rounded-2xl"
          style={{
            border: `2px solid ${TEAM_COLORS[teamId]}`,
            boxShadow: `0 0 20px ${TEAM_COLORS[teamId]}30`,
            background: `${TEAM_COLORS[teamId]}10`,
          }}
        >
          <span className="text-sm text-white/60 uppercase tracking-wider">
            {t('waiting.score')}
          </span>
          <span
            className="text-5xl font-bold font-display"
            style={{ color: TEAM_COLORS[teamId] }}
          >
            {myScore.points}
          </span>
          <span className="text-xs text-white/40 uppercase">
            {t('waiting.points')}
          </span>
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-cyber-blue opacity-60"
              style={{
                animation: `buzzerPulse 1.5s ease-in-out infinite`,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>
        <p className="text-white/40 text-sm">{t('waiting.nextQuestion')}</p>
      </div>
    </div>
  )
}
