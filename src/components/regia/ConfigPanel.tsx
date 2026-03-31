import { useState } from 'react'
import { CyberButton } from '@/components/ui/CyberButton'
import { CyberInput } from '@/components/ui/CyberInput'
import { CyberPanel } from '@/components/ui/CyberPanel'
import type { TeamId, Round } from '@/types/index'
import { DEFAULT_TEAM_NAMES } from '@/types/index'

interface GameConfigPayload {
  teamCount: 2 | 3 | 4
  teams: Array<{ id: TeamId; name: string; maxPlayers: number }>
  questionsPerRound: Record<Round, number>
  pointsPerCorrectAnswer: number
  isDemo: boolean
}

interface ConfigPanelProps {
  onStartGame: () => void
  onStartVote: () => void
  onSendConfig: (config: GameConfigPayload) => void
  onStartDemo?: (numBots: number) => void
  onStopDemo?: () => void
  isDemoRunning?: boolean
}

interface TeamConfig {
  id: TeamId
  name: string
  maxPlayers: number
}

const ALL_TEAMS: TeamId[] = ['blue', 'red', 'green', 'yellow']

export function ConfigPanel({ onStartGame, onStartVote, onSendConfig, onStartDemo, onStopDemo, isDemoRunning }: ConfigPanelProps) {
  const [teamCount, setTeamCount] = useState<2 | 3 | 4>(4)
  const [teams, setTeams] = useState<TeamConfig[]>(
    ALL_TEAMS.map(id => ({ id, name: DEFAULT_TEAM_NAMES[id], maxPlayers: 150 }))
  )
  const [questionsPerRound, setQuestionsPerRound] = useState<Record<Round, number>>({
    1: 5,
    2: 5,
    3: 5,
  })
  const [pointsPerCorrect, setPointsPerCorrect] = useState(10)
  const [isDemo, setIsDemo] = useState(false)
  const [botCount, setBotCount] = useState(20)

  const activeTeams = teams.slice(0, teamCount)

  const handleTeamName = (idx: number, name: string) => {
    setTeams(prev => {
      const next = [...prev]
      const team = next[idx]
      if (team) {
        next[idx] = { ...team, name }
      }
      return next
    })
  }

  const handleMaxPlayers = (idx: number, val: string) => {
    const num = parseInt(val, 10)
    if (isNaN(num) || num < 1) return
    setTeams(prev => {
      const next = [...prev]
      const team = next[idx]
      if (team) {
        next[idx] = { ...team, maxPlayers: num }
      }
      return next
    })
  }

  const handleQuestionsChange = (round: Round, val: string) => {
    const num = parseInt(val, 10)
    if (isNaN(num) || num < 1) return
    setQuestionsPerRound(prev => ({ ...prev, [round]: num }))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Teams config */}
      <CyberPanel title="TEAM CONFIGURATION" accent="blue">
        <div className="mb-4">
          <label className="text-xs text-cyber-blue uppercase tracking-wider font-bold block mb-2">
            Active Teams
          </label>
          <div className="flex gap-2">
            {([2, 3, 4] as const).map(n => (
              <CyberButton
                key={n}
                variant={teamCount === n ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setTeamCount(n)}
              >
                {n}
              </CyberButton>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {activeTeams.map((team, idx) => (
            <div key={team.id} className="flex gap-2 items-end">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0 mt-6"
                style={{ background: `var(--cyber-${team.id})` }}
              />
              <CyberInput
                label={`Team ${idx + 1} Name`}
                value={team.name}
                onChange={e => handleTeamName(idx, e.target.value)}
                className="text-sm"
              />
              <div className="w-24 flex-shrink-0">
                <CyberInput
                  label="Max"
                  type="number"
                  value={String(team.maxPlayers)}
                  onChange={e => handleMaxPlayers(idx, e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </CyberPanel>

      {/* Game settings */}
      <CyberPanel title="GAME SETTINGS" accent="pink">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-cyber-blue uppercase tracking-wider font-bold block mb-2">
              Questions Per Round
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([1, 2, 3] as Round[]).map(r => (
                <CyberInput
                  key={r}
                  label={`R${r}`}
                  type="number"
                  value={String(questionsPerRound[r])}
                  onChange={e => handleQuestionsChange(r, e.target.value)}
                  className="text-sm"
                />
              ))}
            </div>
          </div>

          <CyberInput
            label="Points Per Correct Answer (1-100)"
            type="number"
            min={1}
            max={100}
            value={String(pointsPerCorrect)}
            onChange={e => {
              const raw = e.target.value
              if (raw === '') {
                setPointsPerCorrect(1)
                return
              }
              const v = parseInt(raw, 10)
              if (!isNaN(v)) setPointsPerCorrect(Math.max(1, Math.min(100, v)))
            }}
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDemo(prev => !prev)}
              className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                isDemo ? 'bg-cyber-pink' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                  isDemo ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className="text-sm text-white/70">Demo Mode</span>
          </div>

          {isDemo && (
            <div className="flex flex-col gap-3 px-3 py-2 rounded-lg bg-cyber-pink/10 border border-cyber-pink/30">
              <p className="text-xs text-cyber-pink font-bold">DEMO MODE — Bot simulation</p>
              <div className="flex items-center gap-3">
                <label className="text-xs text-white/70 w-20">Bots: {botCount}</label>
                <input
                  type="range"
                  min={4}
                  max={50}
                  value={botCount}
                  onChange={e => setBotCount(parseInt(e.target.value, 10))}
                  className="flex-1 accent-cyber-pink"
                />
              </div>
              <div className="flex gap-2">
                {isDemoRunning ? (
                  <CyberButton variant="ghost" size="sm" onClick={() => onStopDemo?.()}>
                    STOP BOTS
                  </CyberButton>
                ) : (
                  <CyberButton variant="accent" size="sm" onClick={() => onStartDemo?.(botCount)}>
                    START BOTS
                  </CyberButton>
                )}
                <span className="text-xs text-white/40 self-center">
                  {isDemoRunning ? 'Bots running' : 'Bots stopped'}
                </span>
              </div>
            </div>
          )}
        </div>
      </CyberPanel>

      {/* Actions */}
      <div className="md:col-span-2 flex gap-3">
        <CyberButton variant="accent" onClick={() => {
          onSendConfig({
            teamCount,
            teams: activeTeams,
            questionsPerRound,
            pointsPerCorrectAnswer: pointsPerCorrect,
            isDemo,
          })
          onStartVote()
        }}>
          AVVIA VOTAZIONE
        </CyberButton>
        <CyberButton variant="primary" onClick={() => {
          onSendConfig({
            teamCount,
            teams: activeTeams,
            questionsPerRound,
            pointsPerCorrectAnswer: pointsPerCorrect,
            isDemo,
          })
          onStartGame()
        }}>
          AVVIA PARTITA
        </CyberButton>
      </div>
    </div>
  )
}
