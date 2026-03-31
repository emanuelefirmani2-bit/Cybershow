import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import QRCode from 'qrcode'
import type { TeamId } from '@/types/index'
import { TEAM_COLORS, DEFAULT_TEAM_NAMES } from '@/types/index'
import { GlitchText } from '@/components/ui/GlitchText'

interface TeamCount {
  id: TeamId
  name: string
  count: number
}

interface QRCodeDisplayProps {
  teamCounts: TeamCount[]
}

// VITE_PUBLIC_URL from .env, fallback to current origin (works if Ledwall is opened via LAN IP)
const envMeta = (import.meta as unknown as Record<string, Record<string, string>>)['env'] ?? {}
const QR_URL = envMeta['VITE_PUBLIC_URL']
  || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5274')

export function QRCodeDisplay({ teamCounts }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrReady, setQrReady] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    QRCode.toCanvas(canvas, QR_URL, {
      width: 280,
      margin: 2,
      color: { dark: '#00AEEF', light: '#1A1A2E' },
      errorCorrectionLevel: 'M',
    })
      .then(() => setQrReady(true))
      .catch(() => {/* QR generation failed */})
  }, [])

  const maxCount = Math.max(...teamCounts.map((t) => t.count), 1)

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center circuit-bg"
      style={{ zIndex: 10, background: 'var(--cyber-bg)' }}
    >
      {/* Particles background decoration */}
      <div className="particles-bg">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDuration: `${6 + Math.random() * 8}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-6"
      >
        <GlitchText
          text="CYBERSHOW INTERACTIVE 2026"
          active
          tag="h1"
          className="text-5xl font-bold neon-blue tracking-widest text-center"
        />
      </motion.div>

      {/* Main content: QR + CTA */}
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {/* QR Code */}
        <div
          className="p-4 rounded-xl"
          style={{
            background: '#1A1A2E',
            border: '2px solid var(--cyber-blue)',
            boxShadow: 'var(--glow-blue)',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{ display: qrReady ? 'block' : 'none' }}
          />
          {!qrReady && (
            <div className="w-[280px] h-[280px] flex items-center justify-center text-white/30">
              Loading...
            </div>
          )}
        </div>

        {/* CTA */}
        <motion.div
          className="text-center"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
        >
          <p
            className="text-2xl font-bold tracking-widest neon-pink"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            SCANSIONA E UNISCITI!
          </p>
          <p
            className="text-lg text-white/60 tracking-wider mt-1"
            style={{ fontFamily: "'Exo 2', sans-serif" }}
          >
            Scan & Join the Cybershow!
          </p>
        </motion.div>
      </motion.div>

      {/* Team count bars */}
      <motion.div
        className="absolute bottom-8 left-8 right-8"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <div className="grid grid-cols-4 gap-4">
          {teamCounts.map((team) => {
            const color = TEAM_COLORS[team.id] ?? '#00AEEF'
            const name = team.name || DEFAULT_TEAM_NAMES[team.id] || team.id
            const barHeight = Math.max(5, (team.count / maxCount) * 100)

            return (
              <div key={team.id} className="flex flex-col items-center">
                {/* Count */}
                <motion.span
                  className="text-3xl font-bold mb-2"
                  style={{
                    fontFamily: "'Bangers', sans-serif",
                    color,
                    textShadow: `0 0 10px ${color}`,
                    letterSpacing: '0.05em',
                  }}
                  key={team.count}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                >
                  {team.count}
                </motion.span>

                {/* Bar */}
                <div
                  className="w-full rounded-lg overflow-hidden relative"
                  style={{
                    height: '120px',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${color}30`,
                  }}
                >
                  <motion.div
                    className="w-full rounded-lg absolute bottom-0 left-0 right-0"
                    style={{
                      background: `linear-gradient(0deg, ${color} 0%, ${color}60 100%)`,
                      boxShadow: `0 0 15px ${color}40`,
                    }}
                    initial={{ height: '0%' }}
                    animate={{ height: `${barHeight}%` }}
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  />
                </div>

                {/* Team name */}
                <span
                  className="mt-2 text-sm font-bold tracking-wider uppercase"
                  style={{ color, fontFamily: "'Orbitron', sans-serif" }}
                >
                  {name}
                </span>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
