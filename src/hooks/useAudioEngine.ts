import { useEffect, useRef, useCallback } from 'react'
import type { Socket } from 'socket.io-client'
import { SOCKET_EVENTS } from '@/types/index'
import type { PlayTrackPayload, PlaySfxPayload, PlayTeamSoundPayload, TeamId } from '@/types/index'

// Use relative path — Vite proxies /media to the Express server
const MEDIA_BASE = '/media'

/**
 * Two-channel audio engine for the Regia client.
 *
 * trackChannel: R1 track + ritornello — pausable via FREEZE/UNFREEZE
 * sfxChannel: team sounds, system SFX, finale music — fire-and-forget, not pausable
 */
export function useAudioEngine(socket: Socket | null) {
  // Map teamId → soundId, populated after vote results
  const teamSoundMap = useRef<Record<string, string>>({})

  const trackRef = useRef<HTMLAudioElement | null>(null)
  const sfxRef = useRef<HTMLAudioElement | null>(null)
  const audioContextUnlocked = useRef(false)

  // Unlock AudioContext on first user gesture (called from login)
  const unlockAudio = useCallback(() => {
    if (audioContextUnlocked.current) return
    // Create and immediately resume a silent audio context to unlock
    const ctx = new AudioContext()
    const buffer = ctx.createBuffer(1, 1, 22050)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start(0)
    audioContextUnlocked.current = true
    // Play a silent audio element to unlock HTMLAudioElement playback
    const silent = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=')
    silent.volume = 0
    silent.play().catch(() => { /* ignore */ })
  }, [])

  // Play on track channel (pausable)
  const playTrack = useCallback((url: string) => {
    if (trackRef.current) {
      trackRef.current.pause()
      trackRef.current.src = ''
    }
    const audio = new Audio(url)
    audio.volume = 1
    trackRef.current = audio
    audio.play().catch((err) => {
      console.error('[AudioEngine] trackChannel play error:', err)
    })
  }, [])

  // Play on SFX channel (fire-and-forget, not pausable)
  const playSfx = useCallback((url: string) => {
    // Stop previous SFX
    if (sfxRef.current) {
      sfxRef.current.pause()
      sfxRef.current.src = ''
    }
    const audio = new Audio(url)
    audio.volume = 1
    sfxRef.current = audio
    audio.play().catch((err) => {
      console.error('[AudioEngine] sfxChannel play error:', err)
    })
  }, [])

  // Pause track channel (FREEZE)
  const pauseTrack = useCallback(() => {
    if (trackRef.current && !trackRef.current.paused) {
      trackRef.current.pause()
    }
  }, [])

  // Resume track channel (UNFREEZE)
  const resumeTrack = useCallback(() => {
    if (trackRef.current && trackRef.current.paused && trackRef.current.src) {
      trackRef.current.play().catch((err) => {
        console.error('[AudioEngine] trackChannel resume error:', err)
      })
    }
  }, [])

  // Stop both channels
  const stopAll = useCallback(() => {
    if (trackRef.current) {
      trackRef.current.pause()
      trackRef.current.src = ''
      trackRef.current = null
    }
    if (sfxRef.current) {
      sfxRef.current.pause()
      sfxRef.current.src = ''
      sfxRef.current = null
    }
  }, [])

  // Listen for socket events
  useEffect(() => {
    if (!socket) return

    const handlePlayTrack = (payload: PlayTrackPayload) => {
      playTrack(payload.audioUrl)
    }

    const handlePlaySfx = (payload: PlaySfxPayload) => {
      const { soundId } = payload
      // Ritornello sounds go to trackChannel
      if (soundId.startsWith('ritornello_')) {
        const questionId = soundId.replace('ritornello_', '')
        playTrack(`${MEDIA_BASE}/${questionId}/ritornello.mp3`)
      } else {
        // System SFX go to sfxChannel
        playSfx(`${MEDIA_BASE}/system/${soundId}.mp3`)
      }
    }

    const handlePlayTeamSound = (payload: PlayTeamSoundPayload) => {
      const soundId = teamSoundMap.current[payload.teamId]
      if (soundId) {
        // Voted team sound lives in /media/sounds/{soundId}.mp3
        playSfx(`${MEDIA_BASE}/sounds/${soundId}.mp3`)
      } else {
        // Fallback: use teamId as filename
        playSfx(`${MEDIA_BASE}/sounds/${payload.teamId}.mp3`)
      }
    }

    // Populate team sound map from START_GAME (broadcast globally, includes team soundIds)
    // NOTE: VOTE_RESULT goes to team rooms only, regia won't receive it.
    // Team sound mapping comes from START_GAME payload instead.
    const handleStartGame = (payload: { teams: Array<{ id: TeamId; soundId: string | null }> }) => {
      // Populate team sound map from team data at game start
      for (const team of payload.teams) {
        if (team.soundId) {
          teamSoundMap.current[team.id] = team.soundId
        }
      }
    }

    const handleStopAudio = () => {
      stopAll()
    }

    const handleFreeze = () => {
      pauseTrack()
    }

    const handleUnfreeze = () => {
      resumeTrack()
    }

    socket.on(SOCKET_EVENTS.PLAY_TRACK, handlePlayTrack)
    socket.on(SOCKET_EVENTS.PLAY_SFX, handlePlaySfx)
    socket.on(SOCKET_EVENTS.PLAY_TEAM_SOUND, handlePlayTeamSound)
    socket.on(SOCKET_EVENTS.STOP_AUDIO, handleStopAudio)
    socket.on(SOCKET_EVENTS.FREEZE_MEDIA, handleFreeze)
    socket.on(SOCKET_EVENTS.UNFREEZE_MEDIA, handleUnfreeze)
    socket.on(SOCKET_EVENTS.START_GAME, handleStartGame)

    return () => {
      socket.off(SOCKET_EVENTS.PLAY_TRACK, handlePlayTrack)
      socket.off(SOCKET_EVENTS.PLAY_SFX, handlePlaySfx)
      socket.off(SOCKET_EVENTS.PLAY_TEAM_SOUND, handlePlayTeamSound)
      socket.off(SOCKET_EVENTS.STOP_AUDIO, handleStopAudio)
      socket.off(SOCKET_EVENTS.FREEZE_MEDIA, handleFreeze)
      socket.off(SOCKET_EVENTS.UNFREEZE_MEDIA, handleUnfreeze)
      socket.off(SOCKET_EVENTS.START_GAME, handleStartGame)
    }
  }, [socket, playTrack, playSfx, stopAll, pauseTrack, resumeTrack])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll()
    }
  }, [stopAll])

  return {
    unlockAudio,
    playTrack,
    playSfx,
    pauseTrack,
    resumeTrack,
    stopAll,
  }
}
