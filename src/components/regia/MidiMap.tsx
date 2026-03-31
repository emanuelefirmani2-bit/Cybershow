import { CyberPanel } from '@/components/ui/CyberPanel'
import { MIDI_NOTES } from '@/types/index'

interface MidiEntry {
  note: number
  noteName: string
  action: string
  trigger: string
}

const MIDI_MAP: MidiEntry[] = [
  { note: MIDI_NOTES.BUZZER_BLUE, noteName: 'C3', action: 'Buzzer Team Blu', trigger: 'Team Blu wins buzzer race' },
  { note: MIDI_NOTES.BUZZER_RED, noteName: 'D3', action: 'Buzzer Team Rosso', trigger: 'Team Rosso wins buzzer race' },
  { note: MIDI_NOTES.BUZZER_GREEN, noteName: 'E3', action: 'Buzzer Team Verde', trigger: 'Team Verde wins buzzer race' },
  { note: MIDI_NOTES.BUZZER_YELLOW, noteName: 'F3', action: 'Buzzer Team Giallo', trigger: 'Team Giallo wins buzzer race' },
  { note: MIDI_NOTES.CORRECT, noteName: 'G3', action: 'Risposta Corretta', trigger: 'Answer validated as correct' },
  { note: MIDI_NOTES.ERROR, noteName: 'A3', action: 'Risposta Errata', trigger: 'Answer validated as wrong' },
  { note: MIDI_NOTES.BLACKOUT, noteName: 'B3', action: 'Blackout Luci', trigger: 'KICK_ALL / end of show' },
]

export function MidiMap() {
  return (
    <CyberPanel title="MIDI MAP — QLab Configuration" accent="blue">
      <p className="text-xs text-white/50 mb-3">
        Configure these MIDI notes in QLab to trigger lighting cues via IAC Driver.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-cyber-blue uppercase tracking-wider border-b border-white/10">
              <th className="py-2 px-2">Note</th>
              <th className="py-2 px-2">MIDI #</th>
              <th className="py-2 px-2">Action</th>
              <th className="py-2 px-2">Trigger</th>
            </tr>
          </thead>
          <tbody>
            {MIDI_MAP.map(entry => (
              <tr
                key={entry.note}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="py-2 px-2 font-mono font-bold text-cyber-blue">{entry.noteName}</td>
                <td className="py-2 px-2 font-mono text-white/60">{entry.note}</td>
                <td className="py-2 px-2 text-white/80">{entry.action}</td>
                <td className="py-2 px-2 text-white/50 text-xs">{entry.trigger}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CyberPanel>
  )
}
