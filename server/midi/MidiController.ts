// =============================================================================
// CYBERSHOW 2026 — MidiController
// Singleton MIDI controller for QLab integration via easymidi / IAC Driver
// Owner: Agent 6
// =============================================================================

import type { TeamId } from '../../src/types/index.js'
import { MIDI_NOTES, TEAM_MIDI_NOTE } from '../../src/types/index.js'

// easymidi types — imported dynamically for graceful degradation
interface MidiOutput {
  send(evt: 'noteon', param: { note: number; velocity: number; channel: 0 }): void
  close(): void
  isPortOpen(): boolean
}

// ---------------------------------------------------------------------------
// MidiController — Singleton
// ---------------------------------------------------------------------------

export class MidiController {
  private static instance: MidiController | null = null

  private output: MidiOutput | null = null
  private isMockMode: boolean = false
  private portName: string

  private constructor() {
    this.portName = process.env['MIDI_PORT_NAME'] ?? 'IAC Driver Bus 1'
  }

  static getInstance(): MidiController {
    if (!MidiController.instance) {
      MidiController.instance = new MidiController()
    }
    return MidiController.instance
  }

  /**
   * Initialize the MIDI output port.
   * Gracefully degrades to mock mode if easymidi is unavailable
   * or the MIDI port cannot be opened (e.g. Windows/Linux without IAC Driver).
   */
  async init(): Promise<void> {
    try {
      // Dynamic import — fails gracefully if native addon is missing
      const easymidi = await import('easymidi')

      // Check if the target port exists
      const outputs = easymidi.getOutputs()
      console.log(`[MIDI] Available outputs: ${outputs.length > 0 ? outputs.join(', ') : '(none)'}`)

      if (outputs.includes(this.portName)) {
        this.output = new easymidi.Output(this.portName)
        this.isMockMode = false
        console.log(`[MIDI] Connected to "${this.portName}"`)
      } else {
        this.isMockMode = true
        console.log(`[MIDI] Port "${this.portName}" not found — running in MOCK mode (log-only)`)
      }
    } catch (err: unknown) {
      this.isMockMode = true
      const message = err instanceof Error ? err.message : String(err)
      console.log(`[MIDI] easymidi unavailable (${message}) — running in MOCK mode (log-only)`)
    }
  }

  /**
   * Send a MIDI Note On message.
   * Channel 1 (index 0), default velocity 127.
   * Never throws — logs warning on failure.
   */
  sendNote(note: number, velocity: number = 127): void {
    const noteLabel = this.noteLabel(note)
    const timestamp = Date.now()

    if (this.isMockMode || !this.output) {
      console.log(`[MIDI] [MOCK] Note On: ${noteLabel} (${note}) vel=${velocity} t=${timestamp}`)
      return
    }

    try {
      this.output.send('noteon', { note, velocity, channel: 0 })
      console.log(`[MIDI] Note On: ${noteLabel} (${note}) vel=${velocity} t=${timestamp}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn(`[MIDI] Failed to send note ${noteLabel} (${note}): ${message}`)
    }
  }

  /**
   * Send the buzzer note for a team (C3/D3/E3/F3).
   */
  sendBuzzerNote(teamId: TeamId): void {
    const note = TEAM_MIDI_NOTE[teamId]
    this.sendNote(note)
  }

  /**
   * Send the correct answer note (G3).
   */
  sendCorrect(): void {
    this.sendNote(MIDI_NOTES.CORRECT)
  }

  /**
   * Send the wrong answer note (A3).
   */
  sendError(): void {
    this.sendNote(MIDI_NOTES.ERROR)
  }

  /**
   * Send the blackout/KICK_ALL note (B3).
   */
  sendBlackout(): void {
    this.sendNote(MIDI_NOTES.BLACKOUT)
  }

  /**
   * Close the MIDI port and release resources.
   */
  destroy(): void {
    if (this.output) {
      try {
        this.output.close()
        console.log('[MIDI] Port closed')
      } catch {
        // Ignore close errors
      }
      this.output = null
    }
    MidiController.instance = null
  }

  /**
   * Whether the controller is running in mock mode.
   */
  get mock(): boolean {
    return this.isMockMode
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private noteLabel(note: number): string {
    switch (note) {
      case MIDI_NOTES.BUZZER_BLUE: return 'C3 (Buzzer Blue)'
      case MIDI_NOTES.BUZZER_RED: return 'D3 (Buzzer Red)'
      case MIDI_NOTES.BUZZER_GREEN: return 'E3 (Buzzer Green)'
      case MIDI_NOTES.BUZZER_YELLOW: return 'F3 (Buzzer Yellow)'
      case MIDI_NOTES.CORRECT: return 'G3 (Correct)'
      case MIDI_NOTES.ERROR: return 'A3 (Error)'
      case MIDI_NOTES.BLACKOUT: return 'B3 (Blackout)'
      default: return `Unknown(${note})`
    }
  }
}
