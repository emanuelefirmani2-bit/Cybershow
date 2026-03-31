import { useEffect, useMemo } from 'react'
import { GlitchText } from '@/components/ui/GlitchText'
import type { TranslateFn } from '@/hooks/useI18n'

type FinaleType = 'lobby' | 'winner' | 'loser' | 'end'

interface FinaleScreensProps {
  t: TranslateFn
  type: FinaleType
}

// Haptic patterns for finale
function vibrateWinner() {
  if (navigator.vibrate) {
    // Heartbeat pattern — prolonged celebratory
    navigator.vibrate([200, 100, 200, 100, 400, 200, 200, 100, 200, 100, 400])
  }
}

function vibrateLoser() {
  if (navigator.vibrate) {
    navigator.vibrate([300, 200, 600])
  }
}

function GoldRain() {
  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 3}s`,
        duration: `${2 + Math.random() * 3}s`,
        size: `${4 + Math.random() * 8}px`,
      })),
    [],
  )

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="gold-particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  )
}

export function FinaleScreens({ t, type }: FinaleScreensProps) {
  useEffect(() => {
    if (type === 'winner') vibrateWinner()
    if (type === 'loser') vibrateLoser()
  }, [type])

  if (type === 'lobby') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-6 text-center min-h-[60vh]">
        <GlitchText
          text={t('finale.lobby')}
          active
          tag="h1"
          className="text-3xl font-bold neon-blue tracking-widest"
        />
        <p className="text-white/50 text-sm">{t('finale.wait')}</p>
        <div className="flex gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-cyber-pink"
              style={{
                animation: 'buzzerPulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (type === 'winner') {
    return (
      <div className="relative flex flex-col items-center justify-center gap-6 p-6 text-center min-h-[80vh] state-green-bg overflow-hidden">
        <GoldRain />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="green-glow rounded-3xl p-10">
            <h1 className="text-5xl font-bold neon-green font-display tracking-widest">
              {t('finale.winner')}
            </h1>
          </div>
          <p className="text-white/70 text-xl mt-4">{t('finale.winnerMsg')}</p>
        </div>
      </div>
    )
  }

  if (type === 'loser') {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-6 text-center min-h-[80vh] state-red-bg">
        <div className="red-lock rounded-3xl p-10">
          <h1 className="text-5xl font-bold text-cyber-red font-display tracking-widest">
            {t('finale.loser')}
          </h1>
        </div>
        <p className="text-white/50 text-lg mt-4">{t('finale.loserMsg')}</p>
      </div>
    )
  }

  // type === 'end'
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-6 text-center min-h-[80vh]">
      <GlitchText
        text={t('finale.end')}
        active
        tag="h1"
        className="text-4xl font-bold neon-blue tracking-widest"
      />
      <p className="text-white/60 text-lg">{t('finale.endMsg')}</p>
      <p className="text-white/30 text-sm mt-8">{t('finale.seeYou')}</p>
    </div>
  )
}
