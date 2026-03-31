import { useRef, useEffect } from 'react'
import { CyberPanel } from '@/components/ui/CyberPanel'
import type { TeamId, ChatMessage } from '@/types/index'
import { TEAM_COLORS, DEFAULT_TEAM_NAMES } from '@/types/index'

interface ChatMonitorProps {
  chatMessages: Record<TeamId, ChatMessage[]>
}

const TEAM_ORDER: TeamId[] = ['blue', 'red', 'green', 'yellow']

function TeamChatColumn({ teamId, messages }: { teamId: TeamId; messages: ChatMessage[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const color = TEAM_COLORS[teamId]
  const name = DEFAULT_TEAM_NAMES[teamId]

  return (
    <div className="flex flex-col min-w-0">
      <div
        className="text-xs font-bold uppercase tracking-wider py-1 px-2 rounded-t-lg"
        style={{ background: `${color}20`, color }}
      >
        {name}
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto max-h-40 p-2 bg-black/20 rounded-b-lg"
      >
        {messages.map((msg, idx) => (
          <div key={`${msg.timestamp}-${idx}`} className="text-xs mb-1">
            <span style={{ color }} className="font-semibold">{msg.playerName}: </span>
            <span className="text-white/70">{msg.message}</span>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-white/20 text-xs italic">No messages</p>
        )}
      </div>
    </div>
  )
}

export function ChatMonitor({ chatMessages }: ChatMonitorProps) {
  return (
    <CyberPanel title="TEAM CHAT MONITOR" accent="pink">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {TEAM_ORDER.map(teamId => (
          <TeamChatColumn
            key={teamId}
            teamId={teamId}
            messages={chatMessages[teamId] ?? []}
          />
        ))}
      </div>
    </CyberPanel>
  )
}
