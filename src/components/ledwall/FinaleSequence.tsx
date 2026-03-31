import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ScoreEntry, TeamId } from '@/types/index'
import { TEAM_COLORS, DEFAULT_TEAM_NAMES } from '@/types/index'

interface FinaleSequenceProps {
  scores: ScoreEntry[]
}

type FinalePhase = 'video' | 'podium'

interface PodiumEntry {
  teamIds: TeamId[]
  points: number
  position: number
}

export function FinaleSequence({ scores }: FinaleSequenceProps) {
  const [phase, setPhase] = useState<FinalePhase>('video')
  const videoRef = useRef<HTMLVideoElement>(null)
  const [revealedPosition, setRevealedPosition] = useState(0)

  const podium = useMemo<PodiumEntry[]>(() => {
    const sorted = [...scores].sort((a, b) => b.points - a.points)
    const entries: PodiumEntry[] = []
    let currentPosition = 1

    for (let i = 0; i < sorted.length; i++) {
      const existing = entries.find((e) => e.points === sorted[i].points)
      if (existing) {
        existing.teamIds.push(sorted[i].teamId)
      } else {
        entries.push({
          teamIds: [sorted[i].teamId],
          points: sorted[i].points,
          position: currentPosition,
        })
        currentPosition++
      }
    }
    return entries
  }, [scores])

  // Reversed order for reveal: 4th → 3rd → 2nd → 1st
  const revealOrder = useMemo(() => [...podium].reverse(), [podium])

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const handleVideoEnd = useCallback(() => {
    setPhase('podium')
    // Reveal positions one by one with 2s intervals
    timersRef.current.forEach(clearTimeout)
    timersRef.current = revealOrder.map((_, i) =>
      setTimeout(() => setRevealedPosition(i + 1), (i + 1) * 2000)
    )
  }, [revealOrder])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout)
  }, [])

  const handleCanPlay = useCallback(() => {
    videoRef.current?.play().catch(() => {/* autoplay blocked */})
  }, [])

  return (
    <motion.div
      className="absolute inset-0 bg-black"
      style={{ zIndex: 50 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence mode="wait">
        {phase === 'video' && (
          <motion.div
            key="video"
            className="absolute inset-0"
            exit={{ opacity: 0 }}
          >
            <video
              ref={videoRef}
              src="/media/system/finale_celebration.mp4"
              muted
              playsInline
              preload="auto"
              onCanPlay={handleCanPlay}
              onEnded={handleVideoEnd}
              className="w-full h-full object-contain"
            />
          </motion.div>
        )}

        {phase === 'podium' && (
          <motion.div
            key="podium"
            className="absolute inset-0 flex flex-col items-center justify-center circuit-bg"
            style={{ background: 'var(--cyber-bg)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            {/* Title */}
            <motion.h1
              className="text-5xl font-bold neon-blue tracking-widest mb-12"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              CLASSIFICA FINALE / FINAL RANKING
            </motion.h1>

            {/* Podium entries revealed bottom-up */}
            <div className="w-full max-w-4xl px-8 space-y-6">
              {revealOrder.map((entry, i) => {
                const isRevealed = i < revealedPosition
                return (
                  <AnimatePresence key={entry.position}>
                    {isRevealed && (
                      <PodiumRow entry={entry} isWinner={entry.position === 1} />
                    )}
                  </AnimatePresence>
                )
              })}
            </div>

            {/* Gold particles for winner */}
            {revealedPosition >= revealOrder.length && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 30 }, (_, i) => (
                  <div
                    key={i}
                    className="gold-particle"
                    style={{
                      left: `${Math.random() * 100}%`,
                      animationDuration: `${2 + Math.random() * 3}s`,
                      animationDelay: `${Math.random() * 2}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function PodiumRow({ entry, isWinner }: { entry: PodiumEntry; isWinner: boolean }) {
  const positionLabels: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th' }
  const label = positionLabels[entry.position] ?? `${entry.position}th`

  return (
    <motion.div
      className={`flex items-center gap-6 p-6 rounded-xl ${isWinner ? 'ring-2 ring-yellow-400' : ''}`}
      style={{
        background: isWinner
          ? 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(26,26,46,0.9) 100%)'
          : 'rgba(22,33,62,0.8)',
        boxShadow: isWinner ? '0 0 40px rgba(255,215,0,0.3)' : '0 4px 20px rgba(0,0,0,0.3)',
      }}
      initial={{ opacity: 0, x: -100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      {/* Position */}
      <div
        className="text-4xl font-bold flex-shrink-0 w-20 text-center"
        style={{
          fontFamily: "'Bangers', sans-serif",
          color: isWinner ? '#FFD700' : '#ffffff80',
          textShadow: isWinner ? '0 0 20px #FFD700' : 'none',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>

      {/* Team names (tied teams shown side by side) */}
      <div className="flex-1 flex flex-wrap gap-4">
        {entry.teamIds.map((teamId) => {
          const color = TEAM_COLORS[teamId] ?? '#00AEEF'
          const name = DEFAULT_TEAM_NAMES[teamId] ?? teamId
          return (
            <motion.span
              key={teamId}
              className="text-3xl font-bold tracking-wider"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                color,
                textShadow: `0 0 15px ${color}`,
              }}
              animate={isWinner ? { scale: [1, 1.05, 1] } : {}}
              transition={isWinner ? { repeat: Infinity, duration: 1.5 } : {}}
            >
              {name}
            </motion.span>
          )
        })}
      </div>

      {/* Points */}
      <div
        className="text-5xl font-bold flex-shrink-0"
        style={{
          fontFamily: "'Bangers', sans-serif",
          color: isWinner ? '#FFD700' : '#ffffff',
          textShadow: isWinner ? '0 0 20px #FFD700' : '0 0 10px rgba(255,255,255,0.3)',
          letterSpacing: '0.05em',
        }}
      >
        {entry.points}
      </div>
    </motion.div>
  )
}
