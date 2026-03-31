import { useState, useCallback, useEffect, useMemo } from 'react'
import { Scanlines } from '@/components/ui/Scanlines'
import { GlitchText } from '@/components/ui/GlitchText'
import { CyberButton } from '@/components/ui/CyberButton'
import { LoginRegia } from '@/components/regia/LoginRegia'
import { ConfigPanel } from '@/components/regia/ConfigPanel'
import { Dashboard } from '@/components/regia/Dashboard'
import { QuizManager } from '@/components/regia/QuizManager'
import { PlayerModeration } from '@/components/regia/PlayerModeration'
import { MidiMap } from '@/components/regia/MidiMap'
import { DebugPanel } from '@/components/regia/DebugPanel'
import { useRegia, type GameLogEntry } from '@/hooks/useRegia'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import { GamePhase } from '@/types/index'

const isDebugMode = new URLSearchParams(window.location.search).has('debug')

type Page = 'config' | 'dashboard' | 'monitoring' | 'quiz' | 'midi' | 'debug'

const ALL_PAGE_LABELS: Record<Page, string> = {
  config: 'Configuration',
  dashboard: 'Dashboard Live',
  monitoring: 'Monitoring',
  quiz: 'Quiz Manager',
  midi: 'MIDI Map',
  debug: 'Debug',
}

const VISIBLE_PAGES: Page[] = isDebugMode
  ? ['config', 'dashboard', 'monitoring', 'quiz', 'midi', 'debug']
  : ['config', 'dashboard', 'monitoring', 'quiz', 'midi']

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function generateCsvContent(log: GameLogEntry[]): string {
  const header = 'timestamp,questionId,round,team,player,answer,result,points,responseTimeMs'
  const rows = log.map(entry =>
    [
      entry.timestamp,
      entry.questionId,
      String(entry.round),
      entry.teamId,
      escapeCsvField(entry.playerName),
      escapeCsvField(entry.answer),
      entry.result,
      String(entry.points),
      String(entry.responseTimeMs),
    ].join(',')
  )
  return [header, ...rows].join('\n')
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminDashboard() {
  const regia = useRegia()
  const audioEngine = useAudioEngine(regia.socket)
  const [page, setPage] = useState<Page>('config')
  const [isDemoRunning, setIsDemoRunning] = useState(false)

  // Listen for demo mode status from server
  useEffect(() => {
    const s = regia.socket
    if (!s) return
    const handleDemoStatus = (data: { running: boolean }) => setIsDemoRunning(data.running)
    s.on('DEMO_STATUS', handleDemoStatus)
    return () => { s.off('DEMO_STATUS', handleDemoStatus) }
  }, [regia.socket])

  const handleStartDemo = useCallback((numBots: number) => {
    regia.socket?.emit('CMD_START_DEMO', { numBots })
  }, [regia.socket])

  const handleStopDemo = useCallback(() => {
    regia.socket?.emit('CMD_STOP_DEMO')
  }, [regia.socket])

  const isDemoMode = useMemo(() => regia.gameState?.config.isDemo ?? false, [regia.gameState])

  // Override globals.css overflow:hidden so the regia page can scroll
  useEffect(() => {
    const root = document.getElementById('root')
    const elems = [document.documentElement, document.body, root].filter(Boolean) as HTMLElement[]

    for (const el of elems) {
      el.style.overflow = 'auto'
      el.style.height = 'auto'
    }

    return () => {
      for (const el of elems) {
        el.style.overflow = ''
        el.style.height = ''
      }
    }
  }, [])

  const handleLogin = useCallback(async (eventCode: string): Promise<boolean> => {
    const success = await regia.authenticate(eventCode)
    if (success) {
      // Unlock AudioContext on login gesture
      audioEngine.unlockAudio()
    }
    return success
  }, [regia.authenticate, audioEngine.unlockAudio])

  const handleExportCsv = useCallback(() => {
    const csv = generateCsvContent(regia.gameLog)
    downloadCsv(csv, `cybershow-log-${Date.now()}.csv`)
  }, [regia.gameLog])

  const totalPlayers = regia.teams.reduce((sum, t) => sum + t.count, 0)

  const isFinaleOrEnded =
    regia.gameState?.phase === GamePhase.FINALE ||
    regia.gameState?.phase === GamePhase.ENDED

  // Show login if not authenticated
  if (!regia.authenticated) {
    return <LoginRegia onLogin={handleLogin} />
  }

  return (
    <div
      className="min-h-screen w-full circuit-bg overflow-auto"
      style={{ background: 'var(--cyber-bg)' }}
    >
      <Scanlines opacity={0.15} />

      {isDemoMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-cyber-pink/90 text-white text-center py-1 text-xs font-bold tracking-widest"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          DEMO MODE
        </div>
      )}

      {regia.isPaused && (
        <div className={`fixed ${isDemoMode ? 'top-6' : 'top-0'} left-0 right-0 z-50 bg-cyber-red/90 text-white text-center py-2 text-sm font-bold tracking-widest`}>
          GAME PAUSED — All regia connections lost
        </div>
      )}

      <div className={`relative z-10 max-w-7xl mx-auto px-2 sm:px-4 pb-8 ${isDemoMode && regia.isPaused ? 'pt-16' : isDemoMode ? 'pt-8' : regia.isPaused ? 'pt-10' : ''}`}>
        {/* Header / Nav */}
        <header className="flex flex-wrap items-center justify-between gap-2 px-2 py-3 border-b border-cyber-blue/20">
          <GlitchText
            text="REGIA — COMMAND CENTER"
            active
            tag="h1"
            className="text-xl font-bold neon-blue tracking-widest"
          />

          <nav className="flex flex-wrap items-center gap-1">
            {VISIBLE_PAGES.map(p => (
              <CyberButton
                key={p}
                variant={page === p ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setPage(p)}
                className="text-xs"
              >
                {ALL_PAGE_LABELS[p]}
              </CyberButton>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {isFinaleOrEnded && (
              <CyberButton
                variant="accent"
                size="sm"
                onClick={handleExportCsv}
                className="text-xs"
              >
                EXPORT CSV
              </CyberButton>
            )}
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${regia.connected ? 'bg-cyber-green' : 'bg-cyber-red animate-pulse'}`}
              />
              <span className="text-xs text-white/50 font-mono">
                {totalPlayers} players
              </span>
            </div>
            <CyberButton
              variant="ghost"
              size="sm"
              onClick={regia.logout}
              className="text-xs"
            >
              LOGOUT
            </CyberButton>
          </div>
        </header>

        {/* Page content */}
        <main className="mt-4">
          {page === 'config' && (
            <ConfigPanel
              onStartGame={regia.cmdStartGame}
              onStartVote={regia.cmdStartVote}
              onSendConfig={regia.cmdSendConfig}
              onStartDemo={handleStartDemo}
              onStopDemo={handleStopDemo}
              isDemoRunning={isDemoRunning}
            />
          )}

          {page === 'dashboard' && (
            <Dashboard
              gameState={regia.gameState}
              connected={regia.connected}
              chatMessages={regia.chatMessages}
              playerCount={totalPlayers}
              onStartVote={regia.cmdStartVote}
              onStartGame={regia.cmdStartGame}
              onPlayTrack={regia.cmdPlayTrack}
              onStopAudio={regia.cmdStopAudio}
              onStartQuestion={regia.cmdStartQuestion}
              onNextQuestion={regia.cmdNextQuestion}
              onNextRound={regia.cmdNextRound}
              onOverrideAnswer={regia.cmdOverrideAnswer}
              onSkipQuestion={regia.cmdSkipQuestion}
              onResetSoft={regia.cmdResetSoft}
              onBonus={regia.cmdBonus}
              onUndoScore={regia.cmdUndoScore}
              onSuspense={regia.cmdSuspense}
              onOkFinale={regia.cmdOkFinale}
              onKickAll={regia.cmdKickAll}
            />
          )}

          {page === 'monitoring' && (
            <PlayerModeration
              players={regia.players}
              teams={regia.teams}
              onKickPlayer={regia.cmdKickPlayer}
              onRenamePlayer={regia.cmdRenamePlayer}
            />
          )}

          {page === 'quiz' && (
            <QuizManager />
          )}

          {page === 'midi' && (
            <MidiMap />
          )}

          {page === 'debug' && (
            <DebugPanel socket={regia.socket} />
          )}
        </main>
      </div>
    </div>
  )
}
