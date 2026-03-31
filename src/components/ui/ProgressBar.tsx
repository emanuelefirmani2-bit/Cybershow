interface ProgressBarProps {
  value: number
  max: number
  danger?: boolean
  label?: string
  className?: string
  showPercent?: boolean
}

export function ProgressBar({
  value,
  max,
  danger = false,
  label,
  className = '',
  showPercent = false,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const isDanger = danger || pct <= 20

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-xs text-white/60 font-semibold uppercase tracking-wider">
              {label}
            </span>
          )}
          {showPercent && (
            <span className={`text-xs font-bold ${isDanger ? 'text-cyber-red' : 'text-cyber-blue'}`}>
              {Math.round(pct)}%
            </span>
          )}
        </div>
      )}
      <div className="progress-track">
        <div
          className={`progress-fill ${isDanger ? 'danger' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
