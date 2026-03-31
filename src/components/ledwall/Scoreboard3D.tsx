import { motion, AnimatePresence } from 'framer-motion'
import { useMemo } from 'react'
import type { ScoreEntry, TeamId } from '@/types/index'
import { TEAM_COLORS, DEFAULT_TEAM_NAMES } from '@/types/index'

interface Scoreboard3DProps {
  scores: ScoreEntry[]
  compact?: boolean
}

interface RankedEntry extends ScoreEntry {
  rank: number
  barWidth: number
}

export function Scoreboard3D({ scores, compact = false }: Scoreboard3DProps) {
  const ranked = useMemo<RankedEntry[]>(() => {
    if (scores.length === 0) return []
    const sorted = [...scores].sort((a, b) => b.points - a.points)
    const maxPoints = Math.max(sorted[0].points, 1)
    return sorted.map((entry, i) => ({
      ...entry,
      rank: i + 1,
      barWidth: Math.max(10, (entry.points / maxPoints) * 100),
    }))
  }, [scores])

  if (ranked.length === 0) {
    return (
      <div className="text-white/30 text-lg tracking-widest">
        Nessun punteggio / No scores yet
      </div>
    )
  }

  return (
    <div className={`w-full ${compact ? 'max-w-lg px-4' : 'max-w-3xl px-8'}`}>
      <AnimatePresence mode="popLayout">
        {ranked.map((entry) => (
          <ScoreBar
            key={entry.teamId}
            entry={entry}
            compact={compact}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ScoreBar({ entry, compact }: { entry: RankedEntry; compact: boolean }) {
  const color = TEAM_COLORS[entry.teamId as TeamId] ?? '#00AEEF'
  const teamName = DEFAULT_TEAM_NAMES[entry.teamId as TeamId] ?? entry.teamId

  return (
    <motion.div
      layout
      className={`flex items-center gap-4 ${compact ? 'mb-3' : 'mb-5'}`}
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{
        layout: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
      }}
    >
      {/* Rank badge */}
      <motion.div
        className={`flex-shrink-0 flex items-center justify-center font-bold ${
          compact ? 'w-8 h-8 text-sm' : 'w-12 h-12 text-xl'
        }`}
        style={{
          fontFamily: "'Orbitron', sans-serif",
          color,
          border: `2px solid ${color}`,
          borderRadius: '0.5rem',
          textShadow: `0 0 10px ${color}`,
          boxShadow: `0 0 10px ${color}40`,
          transform: 'perspective(600px) rotateY(-5deg)',
        }}
        layout
      >
        {entry.rank}
      </motion.div>

      {/* Team name */}
      <div
        className={`flex-shrink-0 ${compact ? 'w-24 text-sm' : 'w-36 text-lg'} font-bold tracking-wider`}
        style={{
          fontFamily: "'Orbitron', sans-serif",
          color,
          textShadow: `0 0 8px ${color}80`,
        }}
      >
        {teamName}
      </div>

      {/* Bar container with 3D perspective */}
      <div className="flex-1 relative" style={{ perspective: '600px' }}>
        <motion.div
          className={`relative ${compact ? 'h-8' : 'h-12'} rounded-lg overflow-hidden`}
          style={{
            transform: 'rotateY(-2deg) rotateX(2deg)',
            transformStyle: 'preserve-3d',
          }}
          layout
        >
          {/* Background track */}
          <div
            className="absolute inset-0 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          />

          {/* Animated fill */}
          <motion.div
            className="absolute inset-y-0 left-0 rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${color} 0%, ${color}80 100%)`,
              boxShadow: `0 0 20px ${color}60, inset 0 1px 0 rgba(255,255,255,0.2)`,
            }}
            initial={{ width: '0%' }}
            animate={{ width: `${entry.barWidth}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            layout
          />

          {/* Top shine */}
          <div
            className="absolute inset-x-0 top-0 h-1/3 rounded-t-lg"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
            }}
          />
        </motion.div>
      </div>

      {/* Points */}
      <motion.div
        className={`flex-shrink-0 ${compact ? 'w-12 text-lg' : 'w-20 text-3xl'} font-bold text-right`}
        style={{
          fontFamily: "'Bangers', sans-serif",
          color,
          textShadow: `0 0 15px ${color}`,
          letterSpacing: '0.05em',
        }}
        layout
      >
        <motion.span
          key={entry.points}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {entry.points}
        </motion.span>
      </motion.div>
    </motion.div>
  )
}
