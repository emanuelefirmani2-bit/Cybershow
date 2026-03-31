import { useState, useCallback, useEffect, useRef } from 'react'
import { SOCKET_EVENTS } from '@/types/index'
import type { ChatMessage, ChatMessagePayload } from '@/types/index'
import type { Socket } from 'socket.io-client'

const MAX_MESSAGE_LENGTH = 40
const MAX_BUFFER_SIZE = 20

export function useChat(socket: Socket | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const messagesRef = useRef<ChatMessage[]>([])

  useEffect(() => {
    if (!socket) return

    const handleBroadcast = (msg: ChatMessage) => {
      const updated = [...messagesRef.current, msg].slice(-MAX_BUFFER_SIZE)
      messagesRef.current = updated
      setMessages(updated)
    }

    socket.on(SOCKET_EVENTS.CHAT_BROADCAST, handleBroadcast)

    return () => {
      socket.off(SOCKET_EVENTS.CHAT_BROADCAST, handleBroadcast)
    }
  }, [socket])

  const sendMessage = useCallback(
    (message: string) => {
      if (!socket) return
      const trimmed = message.trim().slice(0, MAX_MESSAGE_LENGTH)
      if (!trimmed) return

      const payload: ChatMessagePayload = { message: trimmed }
      socket.emit(SOCKET_EVENTS.CHAT_MESSAGE, payload)
    },
    [socket],
  )

  const resetChat = useCallback(() => {
    messagesRef.current = []
    setMessages([])
  }, [])

  return { messages, sendMessage, resetChat, maxLength: MAX_MESSAGE_LENGTH }
}
