import { motion, AnimatePresence } from 'framer-motion'
import type { ScoreEntry } from '@/types/index'
import { Scoreboard3D } from '@/components/ledwall/Scoreboard3D'

interface TappoProps {
  visible: boolean
  scores: ScoreEntry[]
  questionNum: number
  totalQuestions: number
}

export function Tappo({ visible, scores, questionNum, totalQuestions }: TappoProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{
            zIndex: 20,
            background: 'radial-gradient(ellipse at center, rgba(26,26,46,0.97) 0%, rgba(13,13,26,0.99) 100%)',
            backdropFilter: 'blur(8px)',
          }}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.6 } }}
          transition={{ duration: 0.4 }}
        >
          {/* Decorative circuit lines */}
          <div className="absolute inset-0 circuit-bg opacity-30" />

          {/* Question counter */}
          {questionNum > 0 && (
            <motion.div
              className="absolute top-8 right-8 text-white/40 font-bold tracking-widest"
              style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1.2rem' }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {questionNum} / {totalQuestions}
            </motion.div>
          )}

          {/* Title */}
          <motion.h2
            className="text-4xl font-bold tracking-widest neon-blue mb-8"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            CLASSIFICA / LEADERBOARD
          </motion.h2>

          {/* Scoreboard */}
          <Scoreboard3D scores={scores} />

          {/* Waiting indicator */}
          <motion.p
            className="mt-8 text-white/30 text-sm tracking-widest uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            In attesa della prossima domanda... / Waiting for next question...
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
