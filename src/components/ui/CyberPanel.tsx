import { HTMLAttributes, ReactNode } from 'react'

interface CyberPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  title?: string
  accent?: 'blue' | 'pink' | 'green' | 'red'
  noPadding?: boolean
}

const ACCENT_STYLES: Record<string, string> = {
  blue: 'border-cyber-blue/40',
  pink: 'border-cyber-pink/40',
  green: 'border-cyber-green/40',
  red: 'border-cyber-red/40',
}

export function CyberPanel({
  children,
  title,
  accent = 'blue',
  noPadding = false,
  className = '',
  ...props
}: CyberPanelProps) {
  return (
    <div
      className={[
        'cyber-panel',
        'border',
        ACCENT_STYLES[accent],
        noPadding ? '' : 'p-4',
        className,
      ].join(' ')}
      {...props}
    >
      {title && (
        <div className="mb-3 pb-2 border-b border-white/10">
          <h3 className="text-sm font-bold tracking-widest uppercase text-cyber-blue">
            {title}
          </h3>
        </div>
      )}
      {children}
    </div>
  )
}
