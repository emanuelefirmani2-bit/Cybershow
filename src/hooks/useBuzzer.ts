import { useCallback, useRef } from 'react'
import { SOCKET_EVENTS, PlayerState } from '@/types/index'
import type { BuzzerPressPayload, TeamId } from '@/types/index'
import type { Socket } from 'socket.io-client'

const DEBOUNCE_MS = 500

interface UseBuzzerOptions {
  socket: Socket | null
  playerId: string | null
  teamId: TeamId | null
  playerState: PlayerState
}

export function useBuzzer({ socket, playerId, teamId, playerState }: UseBuzzerOptions) {
  const lastPressRef = useRef<number>(0)

  const press = useCallback(() => {
    if (!socket || !playerId || !teamId) return
    if (playerState !== PlayerState.BUZZER_ACTIVE) return

    const now = Date.now()
    if (now - lastPressRef.current < DEBOUNCE_MS) return

    lastPressRef.current = now

    const payload: BuzzerPressPayload = {
      playerId,
      teamId,
      timestamp: now,
    }

    socket.emit(SOCKET_EVENTS.BUZZER_PRESS, payload)

    // Haptic feedback on press
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }, [socket, playerId, teamId, playerState])

  const isActive = playerState === PlayerState.BUZZER_ACTIVE

  return { press, isActive }
}
