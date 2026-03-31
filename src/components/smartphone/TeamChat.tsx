import { useState, useCallback, useRef, useEffect } from 'react'
import type { ChatMessage } from '@/types/index'
import type { TranslateFn } from '@/hooks/useI18n'

interface TeamChatProps {
  t: TranslateFn
  messages: ChatMessage[]
  onSend: (message: string) => void
  maxLength: number
}

export function TeamChat({ t, messages, onSend, maxLength }: TeamChatProps) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed) return
    onSend(trimmed)
    setInput('')
  }, [input, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  return (
    <div className="flex flex-col w-full max-h-[40vh] rounded-xl overflow-hidden border border-cyber-green/30 bg-black/40">
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 min-h-[100px] max-h-[25vh]"
      >
        {messages.length === 0 && (
          <p className="text-white/30 text-xs text-center italic">
            {t('green.helpTeam')}
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={`${msg.timestamp}-${i}`} className="flex gap-2 text-sm">
            <span className="text-cyber-green font-bold shrink-0 text-xs">
              {msg.playerName}:
            </span>
            <span className="text-white/80 text-xs break-words">{msg.message}</span>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="flex gap-2 p-2 border-t border-white/10">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.placeholder')}
          maxLength={maxLength}
          className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white text-xs placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-cyber-green/50"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim()}
          className="px-3 py-2 rounded-lg bg-cyber-green/80 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-30 transition-opacity"
        >
          {t('chat.send')}
        </button>
      </div>
    </div>
  )
}
