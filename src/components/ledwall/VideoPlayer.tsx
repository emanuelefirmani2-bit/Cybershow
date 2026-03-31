import { useRef, useEffect, useCallback } from 'react'
import type { Round } from '@/types/index'

interface VideoPlayerProps {
  round: Round | null
  questionId?: string
  isFrozen: boolean
  visible: boolean
}

function getMediaUrl(round: Round | null, questionId?: string): string | null {
  if (!round) return null
  if (round === 1) return '/media/system/spectrogram_loop.mp4'
  if (round === 2 && questionId) return `/media/questions/${questionId}.mp4`
  return null
}

function getImageUrl(round: Round | null, questionId?: string): string | null {
  if (round === 3 && questionId) return `/media/questions/${questionId}.jpg`
  return null
}

export function VideoPlayer({ round, questionId, isFrozen, visible }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const prevFrozenRef = useRef(isFrozen)

  const videoUrl = getMediaUrl(round, questionId)
  const imageUrl = getImageUrl(round, questionId)

  // Handle freeze/unfreeze
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isFrozen && !prevFrozenRef.current) {
      video.pause()
    } else if (!isFrozen && prevFrozenRef.current) {
      video.play().catch(() => {/* autoplay blocked */})
    }
    prevFrozenRef.current = isFrozen
  }, [isFrozen])

  // Auto-play when visible and not frozen
  const handleCanPlay = useCallback(() => {
    const video = videoRef.current
    if (video && visible && !isFrozen) {
      video.play().catch(() => {/* autoplay blocked */})
    }
  }, [visible, isFrozen])

  if (!visible) return null

  // Round 3: static image
  if (imageUrl) {
    return (
      <div className="absolute inset-0" style={{ zIndex: 10 }}>
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    )
  }

  // Round 1 & 2: video
  if (videoUrl) {
    return (
      <div className="absolute inset-0" style={{ zIndex: 10 }}>
        <video
          ref={videoRef}
          src={videoUrl}
          muted
          loop={round === 1}
          playsInline
          preload="auto"
          onCanPlay={handleCanPlay}
          className="w-full h-full object-contain"
        />
      </div>
    )
  }

  return null
}
