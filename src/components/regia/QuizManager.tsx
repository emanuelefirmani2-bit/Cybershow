import { useState, useEffect, useCallback, useRef, type DragEvent, type FormEvent } from 'react'
import { CyberButton } from '@/components/ui/CyberButton'
import { CyberPanel } from '@/components/ui/CyberPanel'
import { CyberInput } from '@/components/ui/CyberInput'
import type { Question, Round, MediaType } from '@/types/index'

const API_BASE = '/api/questions'
const MEDIA_BASE = '/media'

interface QuestionRow {
  id: string
  round: number
  questionTextIt: string
  questionTextEn: string
  correctAnswer: string
  acceptedAnswers: string[]
  mediaType: string
  hasReveal: number
  order: number
}

function toQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    round: row.round as Round,
    questionTextIt: row.questionTextIt,
    questionTextEn: row.questionTextEn,
    correctAnswer: row.correctAnswer,
    acceptedAnswers: row.acceptedAnswers,
    mediaType: row.mediaType as MediaType,
    hasReveal: row.hasReveal === 1,
    order: row.order,
  }
}

export function QuizManager() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedRound, setSelectedRound] = useState<Round>(1)
  const [editing, setEditing] = useState<Question | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [formTextIt, setFormTextIt] = useState('')
  const [formTextEn, setFormTextEn] = useState('')
  const [formAnswer, setFormAnswer] = useState('')
  const [formAccepted, setFormAccepted] = useState('')
  const [formMediaType, setFormMediaType] = useState<MediaType>('audio')
  const [formHasReveal, setFormHasReveal] = useState(false)

  // Drag state for reorder
  const dragIdx = useRef<number | null>(null)

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}?round=${selectedRound}`)
      const rows = await res.json() as QuestionRow[]
      setQuestions(rows.map(toQuestion))
    } catch {
      setError('Failed to fetch questions')
    }
  }, [selectedRound])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const roundQuestions = questions.filter(q => q.round === selectedRound)

  const resetForm = () => {
    setFormTextIt('')
    setFormTextEn('')
    setFormAnswer('')
    setFormAccepted('')
    setFormMediaType(selectedRound === 1 ? 'audio' : selectedRound === 2 ? 'video' : 'image')
    setFormHasReveal(false)
    setEditing(null)
    setIsCreating(false)
    setError('')
  }

  const startCreate = () => {
    resetForm()
    setIsCreating(true)
    setFormMediaType(selectedRound === 1 ? 'audio' : selectedRound === 2 ? 'video' : 'image')
  }

  const startEdit = (q: Question) => {
    setEditing(q)
    setIsCreating(false)
    setFormTextIt(q.questionTextIt)
    setFormTextEn(q.questionTextEn)
    setFormAnswer(q.correctAnswer)
    setFormAccepted(q.acceptedAnswers.join(', '))
    setFormMediaType(q.mediaType)
    setFormHasReveal(q.hasReveal)
    setError('')
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const acceptedArr = formAccepted
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    if (isCreating) {
      try {
        const res = await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            round: selectedRound,
            questionTextIt: formTextIt,
            questionTextEn: formTextEn,
            correctAnswer: formAnswer,
            acceptedAnswers: acceptedArr,
            mediaType: formMediaType,
            hasReveal: formHasReveal,
          }),
        })
        if (!res.ok) {
          const err = await res.json() as { error: string }
          setError(err.error)
          return
        }
        resetForm()
        await fetchQuestions()
      } catch {
        setError('Failed to create question')
      }
    } else if (editing) {
      try {
        const res = await fetch(`${API_BASE}/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionTextIt: formTextIt,
            questionTextEn: formTextEn,
            correctAnswer: formAnswer,
            acceptedAnswers: acceptedArr,
            hasReveal: formHasReveal,
          }),
        })
        if (!res.ok) {
          const err = await res.json() as { error: string }
          setError(err.error)
          return
        }
        resetForm()
        await fetchQuestions()
      } catch {
        setError('Failed to update question')
      }
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_BASE}/${id}`, { method: 'DELETE' })
      await fetchQuestions()
      if (editing?.id === id) resetForm()
    } catch {
      setError('Failed to delete question')
    }
  }

  // File upload
  const handleFileUpload = async (questionId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_BASE}/${questionId}/media`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json() as { error: string }
        setError(err.error)
        return
      }
      await fetchQuestions()
    } catch {
      setError('Failed to upload file')
    }
  }

  // Drop zone
  const handleDrop = async (e: DragEvent, questionId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const files = e.dataTransfer.files
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file) {
        await handleFileUpload(questionId, file)
      }
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // Drag & drop reorder
  const handleReorderDragStart = (idx: number) => {
    dragIdx.current = idx
  }

  const handleReorderDrop = async (targetIdx: number) => {
    if (dragIdx.current === null || dragIdx.current === targetIdx) return
    const ordered = [...roundQuestions]
    const [moved] = ordered.splice(dragIdx.current, 1)
    if (moved) {
      ordered.splice(targetIdx, 0, moved)
    }
    dragIdx.current = null

    try {
      await fetch(`${API_BASE}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round: selectedRound,
          questionIds: ordered.map(q => q.id),
        }),
      })
      await fetchQuestions()
    } catch {
      setError('Failed to reorder')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Question list */}
      <CyberPanel title="QUESTIONS" accent="blue">
        <div className="flex gap-2 mb-3">
          {([1, 2, 3] as Round[]).map(r => (
            <CyberButton
              key={r}
              variant={selectedRound === r ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => { setSelectedRound(r); resetForm() }}
            >
              Round {r}
            </CyberButton>
          ))}
          <CyberButton variant="accent" size="sm" onClick={startCreate}>
            + NEW
          </CyberButton>
        </div>

        <div className="flex flex-col gap-1 max-h-96 overflow-y-auto">
          {roundQuestions.map((q, idx) => (
            <div
              key={q.id}
              draggable
              onDragStart={() => handleReorderDragStart(idx)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleReorderDrop(idx)}
              className={`flex items-center justify-between p-2 rounded-lg cursor-move hover:bg-white/5 transition-colors ${
                editing?.id === q.id ? 'ring-1 ring-cyber-blue' : ''
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-white/30 font-mono w-6">{idx + 1}</span>
                <span className="text-xs font-mono text-cyber-blue">{q.id}</span>
                <span className="text-sm text-white/70 truncate">{q.questionTextIt}</span>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <CyberButton
                  variant="ghost"
                  size="sm"
                  className="text-xs px-2 py-0.5"
                  onClick={() => startEdit(q)}
                >
                  Edit
                </CyberButton>
                <CyberButton
                  variant="danger"
                  size="sm"
                  className="text-xs px-2 py-0.5"
                  onClick={() => handleDelete(q.id)}
                >
                  Del
                </CyberButton>
              </div>
            </div>
          ))}

          {roundQuestions.length === 0 && (
            <p className="text-white/30 text-sm text-center py-4">
              No questions for Round {selectedRound}
            </p>
          )}
        </div>
      </CyberPanel>

      {/* Form */}
      {(isCreating || editing) && (
        <CyberPanel title={isCreating ? 'NEW QUESTION' : `EDIT ${editing?.id}`} accent="pink">
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <CyberInput
              label="Question (IT)"
              value={formTextIt}
              onChange={e => setFormTextIt(e.target.value)}
            />
            <CyberInput
              label="Question (EN)"
              value={formTextEn}
              onChange={e => setFormTextEn(e.target.value)}
            />
            <CyberInput
              label="Correct Answer"
              value={formAnswer}
              onChange={e => setFormAnswer(e.target.value)}
            />
            <CyberInput
              label="Accepted Answers (comma-separated)"
              value={formAccepted}
              onChange={e => setFormAccepted(e.target.value)}
              placeholder="variant1, variant2"
            />

            {isCreating && (
              <div>
                <label className="text-xs text-cyber-blue uppercase tracking-wider font-bold block mb-1">
                  Media Type
                </label>
                <select
                  value={formMediaType}
                  onChange={e => setFormMediaType(e.target.value as MediaType)}
                  className="w-full px-3 py-2 bg-cyber-dark border border-cyber-blue/40 rounded-lg text-white text-sm"
                >
                  <option value="audio">Audio (R1)</option>
                  <option value="video">Video (R2)</option>
                  <option value="image">Image (R3)</option>
                </select>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormHasReveal(prev => !prev)}
                className={`w-10 h-5 rounded-full transition-colors ${
                  formHasReveal ? 'bg-cyber-blue' : 'bg-white/20'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  formHasReveal ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
              <span className="text-sm text-white/70">Has Reveal Image</span>
            </div>

            {/* File upload zone */}
            {editing && (
              <div
                onDrop={e => handleDrop(e, editing.id)}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-cyber-blue/30 rounded-lg p-4 text-center hover:border-cyber-blue/60 transition-colors"
              >
                <p className="text-sm text-white/50 mb-2">
                  Drag & drop media files here
                </p>
                <input
                  type="file"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(editing.id, file)
                  }}
                  className="text-xs text-white/40"
                  accept=".mp3,.mp4,.mov,.jpg,.jpeg,.png"
                />
                {/* Media preview */}
                <div className="mt-3 text-xs text-white/30">
                  Files: {MEDIA_BASE}/{editing.id}/
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-cyber-red">{error}</p>
            )}

            <div className="flex gap-2">
              <CyberButton type="submit" variant="primary" size="sm">
                {isCreating ? 'CREATE' : 'SAVE'}
              </CyberButton>
              <CyberButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetForm}
              >
                CANCEL
              </CyberButton>
            </div>
          </form>
        </CyberPanel>
      )}
    </div>
  )
}
