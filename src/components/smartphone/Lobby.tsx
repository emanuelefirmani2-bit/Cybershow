import { GlitchText } from '@/components/ui/GlitchText'
import type { TranslateFn } from '@/hooks/useI18n'

interface LobbyProps {
  t: TranslateFn
  playerName: string
  teamName: string
  teamColor: string
}

export function Lobby({ t, playerName, teamName, teamColor }: LobbyProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 p-6 text-center">
      <GlitchText
        text="CYBERSHOW"
        active
        tag="h1"
        className="text-4xl font-bold neon-blue tracking-widest"
      />
      <p className="text-cyber-pink text-xl font-bold tracking-wider">
        {t('app.subtitle')}
      </p>

      <div className="flex flex-col items-center gap-3">
        <p className="text-white/70 text-lg">{playerName}</p>
        <div
          className="px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest"
          style={{
            border: `2px solid ${teamColor}`,
            color: teamColor,
            boxShadow: `0 0 15px ${teamColor}40`,
          }}
        >
          {teamName}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 mt-4">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-cyber-blue"
              style={{
                animation: `buzzerPulse 1.5s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
        <p className="text-white/50 text-sm tracking-wider uppercase">
          {t('lobby.waiting')}
        </p>
      </div>
    </div>
  )
}
