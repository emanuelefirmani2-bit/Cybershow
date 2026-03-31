import { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'danger' | 'success' | 'accent' | 'ghost'
type Size = 'sm' | 'md' | 'lg' | 'xl'

interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
  fullWidth?: boolean
  glow?: boolean
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'cyber-btn-primary',
  danger: 'cyber-btn-danger',
  success: 'cyber-btn-success',
  accent: 'cyber-btn-accent',
  ghost: 'bg-transparent border border-cyber-blue/50 text-cyber-blue hover:bg-cyber-blue/10',
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
  xl: 'px-10 py-5 text-2xl',
}

export function CyberButton({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  className = '',
  ...props
}: CyberButtonProps) {
  return (
    <button
      className={[
        'cyber-btn',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
