import { InputHTMLAttributes, forwardRef } from 'react'

interface CyberInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const CyberInput = forwardRef<HTMLInputElement, CyberInputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-cyber-blue mb-1 tracking-wider uppercase">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={[
            'w-full px-4 py-3 rounded-cyber',
            'bg-cyber-dark border-2',
            error ? 'border-cyber-red' : 'border-cyber-blue/40 focus:border-cyber-blue',
            'text-white placeholder-white/30',
            'font-sans text-base',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-cyber-blue/30',
            'focus:shadow-cyber-blue',
            className,
          ].join(' ')}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-cyber-red font-medium">{error}</p>
        )}
      </div>
    )
  }
)

CyberInput.displayName = 'CyberInput'
