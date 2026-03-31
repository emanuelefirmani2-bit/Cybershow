// =============================================================================
// CYBERSHOW 2026 — Socket.io Room Management
// Room joining/leaving, Regia room
// Owner: Agent 2
// =============================================================================

import type { Socket } from 'socket.io'
import type { TeamId } from '../../src/types/index.js'
import { SOCKET_ROOMS, teamRoom } from '../../src/types/index.js'

/**
 * Join the global room and a team room.
 */
export function joinPlayerRooms(socket: Socket, teamId: TeamId): void {
  socket.join(SOCKET_ROOMS.GLOBAL)
  socket.join(teamRoom(teamId))
}

/**
 * Leave all player rooms.
 */
export function leavePlayerRooms(socket: Socket, teamId: TeamId): void {
  socket.leave(SOCKET_ROOMS.GLOBAL)
  socket.leave(teamRoom(teamId))
}

/**
 * Join the Regia room (for audio commands).
 */
export function joinRegiaRoom(socket: Socket): void {
  socket.join(SOCKET_ROOMS.GLOBAL)
  socket.join(SOCKET_ROOMS.REGIA)
}

/**
 * Leave the Regia room.
 */
export function leaveRegiaRoom(socket: Socket): void {
  socket.leave(SOCKET_ROOMS.GLOBAL)
  socket.leave(SOCKET_ROOMS.REGIA)
}

/**
 * Check if a socket is in the Regia room.
 */
export function isInRegiaRoom(socket: Socket): boolean {
  return socket.rooms.has(SOCKET_ROOMS.REGIA)
}
