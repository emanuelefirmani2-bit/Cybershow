import { useState } from 'react'
import { CyberButton } from '@/components/ui/CyberButton'
import { CyberPanel } from '@/components/ui/CyberPanel'
import { CyberInput } from '@/components/ui/CyberInput'
import type { Player, TeamId } from '@/types/index'
import { TEAM_COLORS, DEFAULT_TEAM_NAMES } from '@/types/index'

interface PlayerModerationProps {
  players: Player[]
  teams: Array<{ id: TeamId; name: string; count: number }>
  onKickPlayer: (playerId: string) => void
  onRenamePlayer: (playerId: string, newName: string) => void
}

export function PlayerModeration({
  players,
  teams,
  onKickPlayer,
  onRenamePlayer,
}: PlayerModerationProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [filter, setFilter] = useState<TeamId | 'all'>('all')

  const totalConnected = teams.reduce((sum, t) => sum + t.count, 0)

  const filteredPlayers = filter === 'all'
    ? players
    : players.filter(p => p.teamId === filter)

  const handleRename = (playerId: string) => {
    if (newName.trim() && newName.trim().length <= 15) {
      onRenamePlayer(playerId, newName.trim())
      setRenamingId(null)
      setNewName('')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Connection stats */}
      <CyberPanel title="CONNECTIONS" accent="green">
        <div className="flex items-center justify-between mb-3">
          <span className="text-4xl font-mono font-bold neon-blue">{totalConnected}</span>
          <span className="text-white/40 text-sm">players connected</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {teams.map(team => {
            const color = TEAM_COLORS[team.id]
            return (
              <div
                key={team.id}
                className="p-2 rounded-lg text-center"
                style={{ background: `${color}15`, border: `1px solid ${color}40` }}
              >
                <div className="text-xl font-bold font-mono" style={{ color }}>
                  {team.count}
                </div>
                <div className="text-xs text-white/50">{team.name}</div>
              </div>
            )
          })}
        </div>
      </CyberPanel>

      {/* Player list */}
      <CyberPanel title="PLAYER LIST" accent="blue">
        <div className="flex gap-2 mb-3">
          <CyberButton
            variant={filter === 'all' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </CyberButton>
          {(['blue', 'red', 'green', 'yellow'] as TeamId[]).map(t => (
            <CyberButton
              key={t}
              variant={filter === t ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter(t)}
            >
              {DEFAULT_TEAM_NAMES[t]}
            </CyberButton>
          ))}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {filteredPlayers.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-4">No players</p>
          ) : (
            <div className="flex flex-col gap-1">
              {filteredPlayers.map(player => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: TEAM_COLORS[player.teamId] }}
                    />
                    {renamingId === player.id ? (
                      <div className="flex gap-1 items-center">
                        <CyberInput
                          value={newName}
                          onChange={e => setNewName(e.target.value)}
                          placeholder="New name"
                          className="text-xs py-1 px-2 w-28"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleRename(player.id)
                            if (e.key === 'Escape') setRenamingId(null)
                          }}
                        />
                        <CyberButton
                          variant="success"
                          size="sm"
                          onClick={() => handleRename(player.id)}
                          className="text-xs px-2 py-0.5"
                        >
                          OK
                        </CyberButton>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-white/80 truncate">{player.name}</span>
                        {player.isBot && (
                          <span className="text-xs text-cyber-pink/60 px-1 py-0.5 rounded bg-cyber-pink/10">BOT</span>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <span className="text-xs text-white/30 font-mono mr-2">{player.state}</span>
                    <CyberButton
                      variant="ghost"
                      size="sm"
                      className="text-xs px-2 py-0.5"
                      onClick={() => {
                        setRenamingId(player.id)
                        setNewName(player.name)
                      }}
                    >
                      Rename
                    </CyberButton>
                    <CyberButton
                      variant="danger"
                      size="sm"
                      className="text-xs px-2 py-0.5"
                      onClick={() => onKickPlayer(player.id)}
                    >
                      Kick
                    </CyberButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CyberPanel>
    </div>
  )
}
