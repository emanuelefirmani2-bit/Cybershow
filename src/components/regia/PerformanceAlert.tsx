interface PerformanceAlertProps {
  playerCount: number
  connected: boolean
}

export function PerformanceAlert({ playerCount, connected }: PerformanceAlertProps) {
  if (!connected) {
    return (
      <div className="px-3 py-2 rounded-lg bg-cyber-red/20 border border-cyber-red/40 text-xs text-cyber-red flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyber-red animate-pulse" />
        DISCONNECTED — Attempting reconnection...
      </div>
    )
  }

  if (playerCount > 450) {
    return (
      <div className="px-3 py-2 rounded-lg bg-cyber-yellow/20 border border-cyber-yellow/40 text-xs text-yellow-300 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        HIGH LOAD — {playerCount} connections. Monitor performance.
      </div>
    )
  }

  return null
}
