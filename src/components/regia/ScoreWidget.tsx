import { CyberPanel } from '@/components/ui/CyberPanel'
import type { ScoreEntry } from '@/types/index'
import { TEAM_COLORS, DEFAULT_TEAM_NAMES } from '@/types/index'

interface ScoreWidgetProps {
  scores: ScoreEntry[]
}

export function ScoreWidget({ scores }: ScoreWidgetProps) {
  const sorted = [...scores].sort((a, b) => b.points - a.points)
  const maxPoints = sorted.length > 0 ? (sorted[0]?.points ?? 0) : 0

  return (
    <CyberPanel title="SCOREBOARD" accent="blue">
      <div className="flex flex-col gap-2">
        {sorted.map((entry, idx) => {
          const isLeader = entry.points > 0 && entry.points === maxPoints
          const teamColor = TEAM_COLORS[entry.teamId]
          const teamName = DEFAULT_TEAM_NAMES[entry.teamId]

          return (
            <div
              key={entry.teamId}
              className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                isLeader ? 'ring-1 ring-cyber-yellow/50' : ''
              }`}
              style={{
                background: isLeader
                  ? `${teamColor}15`
                  : 'rgba(255,255,255,0.03)',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40 w-4 font-mono">{idx + 1}</span>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: teamColor }}
                />
                <span className="text-sm text-white/80">{teamName}</span>
              </div>
              <span
                className="font-bold font-mono text-lg"
                style={{ color: teamColor }}
              >
                {entry.points}
              </span>
            </div>
          )
        })}

        {scores.length === 0 && (
          <p className="text-white/30 text-xs text-center py-2">No scores yet</p>
        )}
      </div>
    </CyberPanel>
  )
}
