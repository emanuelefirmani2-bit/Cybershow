import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { SOCKET_EVENTS } from '@/types/index'
import type { TeamId } from '@/types/index'

// Connect to same origin — Vite proxies /socket.io to the backend
const SERVER_URL = ''
const SESSION_KEY = 'cybershow-session'

interface SessionData {
  playerId: string
  sessionToken: string
  teamId: TeamId
  name: string
}

function getStoredSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) return JSON.parse(raw) as SessionData
  } catch {
    // ignore
  }
  return null
}

function storeSession(data: SessionData): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [session, setSession] = useState<SessionData | null>(getStoredSession)

  useEffect(() => {
    const storedSession = getStoredSession()

    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      auth: storedSession ? { sessionToken: storedSession.sessionToken } : {},
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)

      // If we have a stored session, re-join automatically
      const currentSession = getStoredSession()
      if (currentSession) {
        socket.emit(SOCKET_EVENTS.PLAYER_JOIN, {
          name: currentSession.name,
          teamId: currentSession.teamId,
        })
      }
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    // Debug: surface server errors
    socket.on('error', (err: { message?: string }) => {
      console.error('[Socket] Server error:', err)
    })

    socket.on('session', (data: SessionData & { reconnected: boolean }) => {
      const sessionData: SessionData = {
        playerId: data.playerId,
        sessionToken: data.sessionToken,
        teamId: data.teamId,
        name: data.name,
      }
      storeSession(sessionData)
      setSession(sessionData)
    })

    socket.on(SOCKET_EVENTS.KICK_PLAYER, () => {
      clearSession()
      setSession(null)
    })

    socket.on(SOCKET_EVENTS.KICK_ALL, () => {
      clearSession()
      setSession(null)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  const emit = useCallback(<T>(event: string, data?: T) => {
    socketRef.current?.emit(event, data)
  }, [])

  const on = useCallback(<T>(event: string, handler: (data: T) => void) => {
    socketRef.current?.on(event, handler as (...args: unknown[]) => void)
    return () => {
      socketRef.current?.off(event, handler as (...args: unknown[]) => void)
    }
  }, [])

  const join = useCallback((name: string, teamId: TeamId) => {
    socketRef.current?.emit(SOCKET_EVENTS.PLAYER_JOIN, { name, teamId })
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  return {
    socket: socketRef.current,
    connected,
    session,
    emit,
    on,
    join,
    logout,
  }
}
