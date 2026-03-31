import { motion, AnimatePresence } from 'framer-motion'

interface IceOverlayProps {
  visible: boolean
}

export function IceOverlay({ visible }: IceOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 40 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Top border */}
          <div
            className="absolute top-0 left-0 right-0 h-4"
            style={{
              background: 'linear-gradient(180deg, rgba(178,235,242,0.6) 0%, transparent 100%)',
              boxShadow: '0 0 30px rgba(178,235,242,0.4), 0 0 60px rgba(178,235,242,0.2)',
            }}
          />
          {/* Bottom border */}
          <div
            className="absolute bottom-0 left-0 right-0 h-4"
            style={{
              background: 'linear-gradient(0deg, rgba(178,235,242,0.6) 0%, transparent 100%)',
              boxShadow: '0 0 30px rgba(178,235,242,0.4), 0 0 60px rgba(178,235,242,0.2)',
            }}
          />
          {/* Left border */}
          <div
            className="absolute top-0 bottom-0 left-0 w-4"
            style={{
              background: 'linear-gradient(90deg, rgba(178,235,242,0.6) 0%, transparent 100%)',
              boxShadow: '0 0 30px rgba(178,235,242,0.4), 0 0 60px rgba(178,235,242,0.2)',
            }}
          />
          {/* Right border */}
          <div
            className="absolute top-0 bottom-0 right-0 w-4"
            style={{
              background: 'linear-gradient(270deg, rgba(178,235,242,0.6) 0%, transparent 100%)',
              boxShadow: '0 0 30px rgba(178,235,242,0.4), 0 0 60px rgba(178,235,242,0.2)',
            }}
          />
          {/* Corner glow effects */}
          {(['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'] as const).map(
            (pos) => (
              <div
                key={pos}
                className={`absolute ${pos} w-16 h-16`}
                style={{
                  background: 'radial-gradient(circle, rgba(178,235,242,0.5) 0%, transparent 70%)',
                  animation: 'iceGlow 1.5s ease-in-out infinite alternate',
                }}
              />
            ),
          )}
          {/* Full border outline */}
          <div
            className="absolute inset-0 border-4 rounded-sm"
            style={{
              borderColor: 'var(--cyber-tiffany)',
              boxShadow: 'inset 0 0 40px rgba(178,235,242,0.15), 0 0 20px rgba(178,235,242,0.3)',
              animation: 'iceGlow 1s ease-in-out infinite alternate',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
