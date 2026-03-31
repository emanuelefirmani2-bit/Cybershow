import { useState, useCallback } from 'react'
import { CyberButton } from '@/components/ui/CyberButton'
import { CyberInput } from '@/components/ui/CyberInput'
import { CyberPanel } from '@/components/ui/CyberPanel'
import { GlitchText } from '@/components/ui/GlitchText'
import type { TeamId } from '@/types/index'
import { TEAM_COLORS, DEFAULT_TEAM_NAMES } from '@/types/index'
import type { TranslateFn } from '@/hooks/useI18n'

interface TeamInfo {
  id: TeamId
  name: string
  count: number
  maxPlayers?: number
  isLocked?: boolean
}

interface LoginFormProps {
  t: TranslateFn
  teams: TeamInfo[]
  onJoin: (name: string, teamId: TeamId) => void
}

const MAX_NAME_LENGTH = 15

export function LoginForm({ t, teams, onJoin }: LoginFormProps) {
  const [name, setName] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<TeamId | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(() => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError(t('login.nameRequired'))
      return
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      setError(t('login.nameTooLong'))
      return
    }
    if (!selectedTeam) {
      setError(t('login.chooseTeam'))
      return
    }
    setError(null)
    onJoin(trimmed, selectedTeam)
  }, [name, selectedTeam, onJoin, t])

  return (
    <div className="flex flex-col items-center gap-6 p-6 w-full max-w-sm">
      <GlitchText
        text="CYBERSHOW"
        active
        tag="h1"
        className="text-4xl font-bold neon-blue tracking-widest"
      />
      <p className="text-cyber-pink text-xl font-bold tracking-wider">
        {t('app.subtitle')}
      </p>

      <CyberPanel className="w-full" accent="blue">
        <div className="flex flex-col gap-4">
          <CyberInput
            label={t('login.nameLabel')}
            placeholder={t('login.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, MAX_NAME_LENGTH))}
            maxLength={MAX_NAME_LENGTH}
            error={error ?? undefined}
            autoComplete="off"
          />

          <p className="text-sm font-semibold text-cyber-blue tracking-wider uppercase">
            {t('login.chooseTeam')}
          </p>

          <div className="grid grid-cols-2 gap-3">
            {teams.map((team) => {
              const isFull = team.maxPlayers !== undefined && team.count >= team.maxPlayers
              const isLocked = team.isLocked === true
              const isDisabled = isFull || isLocked
              const isSelected = selectedTeam === team.id

              return (
                <button
                  key={team.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => setSelectedTeam(team.id)}
                  className={[
                    'rounded-xl p-3 text-center transition-all duration-200 border-2',
                    isSelected
                      ? 'scale-105'
                      : 'opacity-80 hover:opacity-100',
                    isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                  ].join(' ')}
                  style={{
                    borderColor: isSelected ? TEAM_COLORS[team.id] : 'rgba(255,255,255,0.15)',
                    background: isSelected
                      ? `${TEAM_COLORS[team.id]}22`
                      : 'rgba(255,255,255,0.05)',
                    boxShadow: isSelected ? `0 0 20px ${TEAM_COLORS[team.id]}40` : 'none',
                  }}
                >
                  <span
                    className="block text-sm font-bold uppercase tracking-wider"
                    style={{ color: TEAM_COLORS[team.id] }}
                  >
                    {team.name || DEFAULT_TEAM_NAMES[team.id]}
                  </span>
                  <span className="block text-xs text-white/50 mt-1">
                    {team.count} {t('lobby.players')}
                    {isLocked ? ` - ${t('login.teamLocked')}` : ''}
                    {isFull && !isLocked ? ` - ${t('login.teamFull')}` : ''}
                  </span>
                </button>
              )
            })}
          </div>

          <CyberButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleSubmit}
            disabled={!name.trim() || !selectedTeam}
          >
            {t('login.join')}
          </CyberButton>
        </div>
      </CyberPanel>
    </div>
  )
}
