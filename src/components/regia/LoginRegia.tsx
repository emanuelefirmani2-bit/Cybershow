import { useState, type FormEvent } from 'react'
import { CyberButton } from '@/components/ui/CyberButton'
import { CyberInput } from '@/components/ui/CyberInput'
import { CyberPanel } from '@/components/ui/CyberPanel'
import { GlitchText } from '@/components/ui/GlitchText'

interface LoginRegiaProps {
  onLogin: (eventCode: string) => Promise<boolean>
}

export function LoginRegia({ onLogin }: LoginRegiaProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      setError('Enter the event code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const success = await onLogin(code.trim())
      if (!success) {
        setError('Invalid event code')
      }
    } catch {
      setError('Connection failed. Please retry.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cyber-bg)' }}>
      <CyberPanel title="REGIA ACCESS" accent="pink" className="w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <GlitchText
            text="CYBERSHOW 2026"
            active
            tag="h1"
            className="text-3xl font-bold neon-blue tracking-widest mb-2"
          />
          <p className="text-white/50 text-sm">Enter event code to access Command Center</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <CyberInput
            label="Event Code"
            placeholder="SHOW-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            error={error}
            autoFocus
            autoComplete="off"
          />

          <CyberButton
            type="submit"
            variant="accent"
            fullWidth
            disabled={loading}
          >
            {loading ? 'AUTHENTICATING...' : 'ENTER'}
          </CyberButton>
        </form>
      </CyberPanel>
    </div>
  )
}
