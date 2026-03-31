import { useCallback } from 'react'
import type { TranslateFn } from '@/hooks/useI18n'

interface BuzzerButtonProps {
  t: TranslateFn
  isActive: boolean
  onPress: () => void
}

export function BuzzerButton({ t, isActive, onPress }: BuzzerButtonProps) {
  const handlePress = useCallback(() => {
    if (!isActive) return
    onPress()
  }, [isActive, onPress])

  return (
    <div className="flex flex-col items-center justify-center gap-6 min-h-[60vh]">
      <button
        type="button"
        disabled={!isActive}
        onClick={handlePress}
        className={`buzzer-btn ${!isActive ? 'disabled' : ''}`}
        aria-label={t('buzzer.buzz')}
      >
        {t('buzzer.buzz')}
      </button>
      {isActive && (
        <p className="text-cyber-blue text-sm font-bold tracking-widest uppercase animate-pulse">
          {t('buzzer.press')}
        </p>
      )}
    </div>
  )
}
