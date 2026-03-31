import { useState, useEffect, useCallback } from 'react'
import { CyberButton } from '@/components/ui/CyberButton'
import { CyberPanel } from '@/components/ui/CyberPanel'
import type { TeamId } from '@/types/index'
import { MIDI_NOTES } from '@/types/index'
import type { Socket } from 'socket.io-client'

interface BotStatus {
  id: number
  name: string
  teamId: TeamId
  playerId: string | null
  state: string
  connected: boolean
}

interface BotLogEntry {
  timestamp: number
  level: 'info' | 'warn' | 'error'
  botName: string
  message: string
}

interface BotReport {
  running: boolean
  botCount: number
  stats: { joined: number; votes: number; buzzes: number; answers: number; errors: number; disconnects: number }
  errors: BotLogEntry[]
  recentLogs: BotLogEntry[]
}

interface DebugPanelProps {
  socket: Socket | null
}

const TEAM_COLORS: Record<TeamId, string> = {
  blue: '#00AEEF',
  red: '#B22222',
  green: '#2E8B57',
  yellow: '#FFD700',
}

const ALL_MIDI_NOTES = [
  { label: 'BUZZER BLUE', note: MIDI_NOTES.BUZZER_BLUE },
  { label: 'BUZZER RED', note: MIDI_NOTES.BUZZER_RED },
  { label: 'BUZZER GREEN', note: MIDI_NOTES.BUZZER_GREEN },
  { label: 'BUZZER YELLOW', note: MIDI_NOTES.BUZZER_YELLOW },
  { label: 'CORRECT', note: MIDI_NOTES.CORRECT },
  { label: 'ERROR', note: MIDI_NOTES.ERROR },
  { label: 'BLACKOUT', note: MIDI_NOTES.BLACKOUT },
]

const ALL_TEAM_SOUNDS: TeamId[] = ['blue', 'red', 'green', 'yellow']

function StatBadge({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-white/40 uppercase">{label}</span>
      <span className={`text-sm font-bold font-mono ${color ?? 'text-white/80'}`}>{value}</span>
    </div>
  )
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const LOG_LEVEL_COLORS: Record<string, string> = {
  info: 'text-white/50',
  warn: 'text-yellow-400',
  error: 'text-red-400 font-bold',
}

export function DebugPanel({ socket }: DebugPanelProps) {
  const [botStatuses, setBotStatuses] = useState<BotStatus[]>([])
  const [report, setReport] = useState<BotReport | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Poll bot status + report
  useEffect(() => {
    if (!socket || !autoRefresh) return

    const poll = () => {
      socket.emit('CMD_GET_BOT_STATUS')
      socket.emit('CMD_GET_BOT_REPORT')
    }

    poll()
    const interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [socket, autoRefresh])

  useEffect(() => {
    if (!socket) return
    const statusHandler = (statuses: BotStatus[]) => setBotStatuses(statuses)
    const reportHandler = (r: BotReport) => setReport(r)
    socket.on('BOT_STATUS', statusHandler)
    socket.on('BOT_REPORT', reportHandler)
    return () => {
      socket.off('BOT_STATUS', statusHandler)
      socket.off('BOT_REPORT', reportHandler)
    }
  }, [socket])

  // MIDI trigger
  const triggerMidi = useCallback((note: number) => {
    socket?.emit('DEBUG_MIDI_TRIGGER', { note })
  }, [socket])

  // Play all team sounds simultaneously
  const playAllTeamSounds = useCallback(() => {
    for (const teamId of ALL_TEAM_SOUNDS) {
      socket?.emit('DEBUG_PLAY_TEAM_SOUND', { teamId })
    }
  }, [socket])

  // Simulate disconnect/reconnect of a random bot
  const simulateDisconnect = useCallback(() => {
    socket?.emit('DEBUG_BOT_DISCONNECT')
  }, [socket])

  const groupedBots: Record<TeamId, BotStatus[]> = { blue: [], red: [], green: [], yellow: [] }
  for (const bot of botStatuses) {
    groupedBots[bot.teamId].push(bot)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stats bar */}
      {report && (
        <div className="flex flex-wrap gap-4 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
          <StatBadge label="Bots" value={report.botCount} />
          <StatBadge label="Joined" value={report.stats.joined} />
          <StatBadge label="Votes" value={report.stats.votes} />
          <StatBadge label="Buzzes" value={report.stats.buzzes} />
          <StatBadge label="Answers" value={report.stats.answers} />
          <StatBadge label="Disconnects" value={report.stats.disconnects} color="text-yellow-400" />
          <StatBadge label="Errors" value={report.stats.errors} color={report.stats.errors > 0 ? 'text-red-400' : undefined} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* MIDI Triggers */}
        <CyberPanel title="MIDI TRIGGER" accent="blue">
          <div className="flex flex-wrap gap-2">
            {ALL_MIDI_NOTES.map(({ label, note }) => (
              <CyberButton
                key={note}
                variant="ghost"
                size="sm"
                onClick={() => triggerMidi(note)}
              >
                {label} (Note {note})
              </CyberButton>
            ))}
          </div>
        </CyberPanel>

        {/* Audio Debug */}
        <CyberPanel title="AUDIO DEBUG" accent="pink">
          <div className="flex flex-col gap-2">
            <CyberButton variant="accent" size="sm" onClick={playAllTeamSounds}>
              PLAY ALL TEAM SOUNDS
            </CyberButton>
            <p className="text-xs text-white/40">
              Triggers all 4 team sounds simultaneously on the Regia audio engine.
            </p>
          </div>
        </CyberPanel>

        {/* Connection Debug */}
        <CyberPanel title="CONNECTION DEBUG" accent="blue">
          <div className="flex flex-col gap-2">
            <CyberButton variant="ghost" size="sm" onClick={simulateDisconnect}>
              SIMULATE BOT DISCONNECT/RECONNECT
            </CyberButton>
            <p className="text-xs text-white/40">
              Disconnects a random bot, then reconnects after 3s.
            </p>
          </div>
        </CyberPanel>

        {/* Bot Status */}
        <CyberPanel title="BOT STATUS" accent="pink">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs text-white/60">{botStatuses.length} bots</span>
            <button
              type="button"
              onClick={() => setAutoRefresh(prev => !prev)}
              className={`text-xs px-2 py-1 rounded ${autoRefresh ? 'bg-cyber-green/20 text-cyber-green' : 'bg-white/10 text-white/40'}`}
            >
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </button>
          </div>

          {botStatuses.length === 0 ? (
            <p className="text-xs text-white/30">No bots running. Start demo mode first.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(groupedBots) as TeamId[]).map(teamId => {
                const bots = groupedBots[teamId]
                if (bots.length === 0) return null
                return (
                  <div key={teamId}>
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: TEAM_COLORS[teamId] }}
                      />
                      <span className="text-xs font-bold text-white/80 uppercase">{teamId} ({bots.length})</span>
                    </div>
                    <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
                      {bots.map(bot => (
                        <div key={bot.id} className="flex items-center gap-2 text-xs">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${bot.connected ? 'bg-cyber-green' : 'bg-cyber-red'}`}
                          />
                          <span className="text-white/60 font-mono">{bot.name}</span>
                          <span className="text-white/30">{bot.state}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CyberPanel>
      </div>

      {/* Error Log */}
      {report && report.errors.length > 0 && (
        <CyberPanel title={`ERRORS (${report.errors.length})`} accent="pink">
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto font-mono text-xs">
            {report.errors.map((entry, i) => (
              <div key={i} className="flex gap-2 text-red-400">
                <span className="text-white/30 flex-shrink-0">{formatTime(entry.timestamp)}</span>
                <span className="text-red-300 flex-shrink-0">[{entry.botName}]</span>
                <span>{entry.message}</span>
              </div>
            ))}
          </div>
        </CyberPanel>
      )}

      {/* Full Activity Log */}
      {report && report.recentLogs.length > 0 && (
        <CyberPanel title="ACTIVITY LOG (last 50)" accent="blue">
          <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto font-mono text-xs">
            {[...report.recentLogs].reverse().map((entry, i) => (
              <div key={i} className={`flex gap-2 ${LOG_LEVEL_COLORS[entry.level] ?? 'text-white/50'}`}>
                <span className="text-white/30 flex-shrink-0">{formatTime(entry.timestamp)}</span>
                <span className="text-cyber-blue/60 flex-shrink-0 w-16 truncate">[{entry.botName}]</span>
                <span>{entry.message}</span>
              </div>
            ))}
          </div>
        </CyberPanel>
      )}
    </div>
  )
}
