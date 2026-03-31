import { useState, useCallback, useEffect, useRef } from 'react'
import { CyberButton } from '@/components/ui/CyberButton'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { TranslateFn } from '@/hooks/useI18n'

interface AnswerBoxProps {
  t: TranslateFn
  timerStartedAt: number | null
  timerDuration: number
  onSubmit: (answer: string) => void
}

const TIMER_SECONDS = 60

export function AnswerBox({ t, timerStartedAt, timerDuration = TIMER_SECONDS, onSubmit }: AnswerBoxProps) {
  const [answer, setAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(timerDuration)
  const inputRef = useRef<HTMLInputElement>(null)

  // Autofocus on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      if (timerStartedAt) {
        const elapsed = Math.floor((Date.now() - timerStartedAt) / 1000)
        const remaining = Math.max(0, timerDuration - elapsed)
        setTimeLeft(remaining)
      }
    }, 200)
    return () => clearInterval(interval)
  }, [timerStartedAt, timerDuration])

  const handleSubmit = useCallback(() => {
    const trimmed = answer.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }, [answer, onSubmit])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  return (
    <div className="flex flex-col items-center gap-4 w-full p-4">
      <h2 className="text-xl font-bold neon-green tracking-widest uppercase">
        {t('green.yourTurn')}
      </h2>

      <div className="w-full flex items-center justify-between text-sm">
        <span className="text-white/60">{t('green.timeLeft')}</span>
        <span className={`font-bold text-lg ${timeLeft <= 10 ? 'text-cyber-red' : 'text-cyber-green'}`}>
          {timeLeft}s
        </span>
      </div>
      <ProgressBar value={timeLeft} max={timerDuration} className="w-full" />

      <div className="w-full flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('green.typeAnswer')}
          className="flex-1 px-4 py-3 rounded-xl bg-white text-black text-base font-semibold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyber-green"
          autoComplete="off"
          autoCapitalize="off"
        />
        <CyberButton
          variant="success"
          size="lg"
          onClick={handleSubmit}
          disabled={!answer.trim()}
        >
          {t('green.submit')}
        </CyberButton>
      </div>
    </div>
  )
}
