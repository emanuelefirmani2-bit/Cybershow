import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LedwallState } from '@/types/index'
import { useLedwall } from '@/hooks/useLedwall'
import { Scanlines } from '@/components/ui/Scanlines'
import { LayerManager } from '@/components/ledwall/LayerManager'
import { QRCodeDisplay } from '@/components/ledwall/QRCodeDisplay'
import { HypeVideo } from '@/components/ledwall/HypeVideo'
import { FinaleSequence } from '@/components/ledwall/FinaleSequence'

/**
 * LedwallView — Fullscreen secondary display (maxischermo).
 * State machine: QR_LOBBY → TAPPO → PLAY → FREEZE → REVEAL → HYPE_ROUND → FINALE → PAUSED
 * Never plays audio. Never sends events to server.
 */
export default function LedwallView() {
  const { connected, data, socket } = useLedwall()
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    if (!socket) return
    const handleDemo = (active: boolean) => setIsDemoMode(active)
    socket.on('DEMO_MODE', handleDemo)
    return () => { socket.off('DEMO_MODE', handleDemo) }
  }, [socket])

  const handleHypeComplete = useCallback(() => {
    // After hype video ends, the server will send NEXT_QUESTION which transitions to TAPPO
    // Nothing to do here — the socket handler will update state
  }, [])

  // Reveal image overlay for LayerManager
  const revealOverlay = useMemo(() => {
    if (!data.revealImageUrl) return undefined
    return (
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <img
          src={data.revealImageUrl}
          alt=""
          className="max-w-full max-h-full object-contain"
          draggable={false}
        />
      </motion.div>
    )
  }, [data.revealImageUrl])

  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: 'var(--cyber-bg)', cursor: 'none' }}
    >
      {/* DEMO banner */}
      {isDemoMode && (
        <div
          className="absolute top-0 left-0 right-0 text-center py-1 text-sm font-bold tracking-widest"
          style={{
            zIndex: 100,
            background: 'rgba(255,0,100,0.85)',
            color: 'white',
            fontFamily: "'Orbitron', sans-serif",
          }}
        >
          DEMO
        </div>
      )}

      {/* Scanlines effect */}
      <Scanlines opacity={0.15} />

      {/* Connection indicator (dev only) */}
      {!connected && (
        <div
          className="absolute top-2 left-2 px-3 py-1 rounded text-xs font-bold tracking-wider"
          style={{
            zIndex: 100,
            background: 'rgba(178,34,34,0.8)',
            color: 'white',
            fontFamily: "'Orbitron', sans-serif",
          }}
        >
          DISCONNECTED
        </div>
      )}

      {/* Last question full-screen animation */}
      <AnimatePresence>
        {data.isLastQuestion && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            style={{ zIndex: 60, background: 'rgba(13,13,26,0.95)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.3, opacity: 0, rotateX: 90 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <h1
                className="text-7xl font-bold neon-pink tracking-widest"
                style={{ fontFamily: "'Bangers', sans-serif", letterSpacing: '0.15em' }}
              >
                ULTIMA DOMANDA!
              </h1>
              <p
                className="text-4xl text-white/60 mt-4 tracking-wider"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                LAST QUESTION!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main state machine */}
      <AnimatePresence mode="wait">
        {/* QR Lobby */}
        {data.state === LedwallState.QR_LOBBY && (
          <motion.div
            key="qr-lobby"
            className="absolute inset-0"
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
          >
            <QRCodeDisplay teamCounts={data.teamCounts} />
          </motion.div>
        )}

        {/* Game states: TAPPO, PLAY, FREEZE, UNFREEZE, REVEAL */}
        {(data.state === LedwallState.TAPPO ||
          data.state === LedwallState.PLAY ||
          data.state === LedwallState.FREEZE ||
          data.state === LedwallState.UNFREEZE ||
          data.state === LedwallState.REVEAL) && (
          <motion.div
            key="game"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LayerManager
              state={data.state}
              round={data.currentRound}
              isFrozen={data.isFrozen}
              scores={data.scores}
              questionNum={data.questionNum}
              totalQuestions={data.totalQuestions}
              buzzerWinner={data.buzzerWinner}
              countdown={data.countdown}
              answerTimerStart={data.answerTimerStart}
              overlayContent={revealOverlay}
            />

            {/* Bilingual text bar at bottom */}
            {data.currentRound && data.state !== LedwallState.TAPPO && (
              <div
                className="absolute bottom-0 left-0 right-0 py-2 px-6 flex justify-between items-center"
                style={{
                  zIndex: 35,
                  background: 'linear-gradient(0deg, rgba(13,13,26,0.8) 0%, transparent 100%)',
                }}
              >
                <span
                  className="text-sm text-white/40 tracking-wider"
                  style={{ fontFamily: "'Exo 2', sans-serif" }}
                >
                  Round {data.currentRound} — Domanda {data.questionNum}/{data.totalQuestions}
                </span>
                <span
                  className="text-sm text-white/40 tracking-wider"
                  style={{ fontFamily: "'Exo 2', sans-serif" }}
                >
                  Round {data.currentRound} — Question {data.questionNum}/{data.totalQuestions}
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* Hype video between rounds */}
        {data.state === LedwallState.HYPE_ROUND && data.hypeVideoUrl && (
          <HypeVideo
            key="hype"
            videoUrl={data.hypeVideoUrl}
            onComplete={handleHypeComplete}
          />
        )}

        {/* Finale */}
        {data.state === LedwallState.FINALE && (
          <motion.div
            key="finale"
            className="absolute inset-0"
          >
            <FinaleSequence scores={data.scores} />
          </motion.div>
        )}

        {/* Paused */}
        {data.state === LedwallState.PAUSED && (
          <motion.div
            key="paused"
            className="absolute inset-0 flex items-center justify-center circuit-bg"
            style={{ background: 'var(--cyber-bg)', zIndex: 50 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.h1
              className="text-6xl font-bold tracking-widest"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                color: 'var(--cyber-pink)',
                textShadow: '0 0 20px var(--cyber-pink)',
              }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              PAUSA / PAUSED
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
