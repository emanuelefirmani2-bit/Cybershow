import { useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

interface HypeVideoProps {
  videoUrl: string
  onComplete: () => void
}

export function HypeVideo({ videoUrl, onComplete }: HypeVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleCanPlay = useCallback(() => {
    videoRef.current?.play().catch(() => {/* autoplay blocked */})
  }, [])

  return (
    <motion.div
      className="absolute inset-0 bg-black flex items-center justify-center"
      style={{ zIndex: 50 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        muted
        playsInline
        preload="auto"
        onCanPlay={handleCanPlay}
        onEnded={onComplete}
        className="w-full h-full object-contain"
      />
    </motion.div>
  )
}
