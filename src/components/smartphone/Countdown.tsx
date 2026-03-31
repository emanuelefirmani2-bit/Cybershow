import { useEffect, useState } from 'react'
import type { TranslateFn } from '@/hooks/useI18n'

interface CountdownProps {
  t: TranslateFn
  seconds: number
}

export function Countdown({ t, seconds }: CountdownProps) {
  const [displayNum, setDisplayNum] = useState(seconds)
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    setDisplayNum(seconds)
    setAnimKey((k) => k + 1)
  }, [seconds])

  return (
    <div className="flex flex-col items-center justify-center gap-4 min-h-[60vh]">
      {displayNum > 0 ? (
        <span key={animKey} className="countdown-number">
          {displayNum}
        </span>
      ) : (
        <span className="text-4xl font-bold neon-blue tracking-widest uppercase font-display">
          {t('countdown.ready')}
        </span>
      )}
    </div>
  )
}
