import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { eq, asc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { questions } from '../db/schema.js'
import type { MediaType, Round } from '../../src/types/index.js'
import type { NewQuestionRow } from '../db/schema.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MEDIA_DIR = path.join(__dirname, '../../media')

// ---------------------------------------------------------------------------
// Multer — disk storage per question folder
// ---------------------------------------------------------------------------

const storage = multer.diskStorage({
  destination(req: Request, _file, cb) {
    const id = (req.params as { id: string }).id
    const dir = path.join(MEDIA_DIR, id)
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename(_req, file, cb) {
    cb(null, file.originalname)
  },
})

const upload = multer({ storage })

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateNextId(existingIds: string[]): string {
  const numbers = existingIds
    .filter(id => /^q\d{3,}$/.test(id))
    .map(id => parseInt(id.slice(1), 10))
  const max = numbers.length > 0 ? Math.max(...numbers) : 0
  return `q${String(max + 1).padStart(3, '0')}`
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const questionsRouter = Router()

// GET /api/questions — list all, filterable by ?round=
questionsRouter.get('/', (req: Request, res: Response) => {
  try {
    const roundParam = req.query['round']
    let rows: (typeof questions.$inferSelect)[]

    if (roundParam !== undefined) {
      const roundNum = parseInt(String(roundParam), 10)
      if (isNaN(roundNum) || ![1, 2, 3].includes(roundNum)) {
        res.status(400).json({ error: 'round must be 1, 2, or 3' })
        return
      }
      rows = db.select().from(questions).where(eq(questions.round, roundNum)).orderBy(asc(questions.order)).all()
    } else {
      rows = db.select().from(questions).orderBy(asc(questions.round), asc(questions.order)).all()
    }

    res.json(rows)
  } catch {
    res.status(500).json({ error: 'Failed to fetch questions' })
  }
})

// POST /api/questions — create with auto-generated ID
questionsRouter.post('/', (req: Request, res: Response) => {
  try {
    const body = req.body as {
      round?: unknown
      questionTextIt?: unknown
      questionTextEn?: unknown
      correctAnswer?: unknown
      acceptedAnswers?: unknown
      mediaType?: unknown
      hasReveal?: unknown
      order?: unknown
    }

    const { round, questionTextIt, questionTextEn, correctAnswer, mediaType } = body

    if (
      typeof round !== 'number' ||
      ![1, 2, 3].includes(round) ||
      typeof questionTextIt !== 'string' ||
      typeof questionTextEn !== 'string' ||
      typeof correctAnswer !== 'string' ||
      typeof mediaType !== 'string' ||
      !['audio', 'video', 'image'].includes(mediaType)
    ) {
      res.status(400).json({
        error: 'Required: round (1|2|3), questionTextIt, questionTextEn, correctAnswer, mediaType (audio|video|image)',
      })
      return
    }

    const acceptedAnswers = Array.isArray(body.acceptedAnswers)
      ? (body.acceptedAnswers as string[])
      : []

    const hasReveal = body.hasReveal === true || body.hasReveal === 1

    const allIds = db.select({ id: questions.id }).from(questions).all()
    const id = generateNextId(allIds.map(q => q.id))

    const roundOrders = db
      .select({ order: questions.order })
      .from(questions)
      .where(eq(questions.round, round as Round))
      .all()
    const nextOrder =
      typeof body.order === 'number'
        ? body.order
        : roundOrders.length > 0
          ? Math.max(...roundOrders.map(q => q.order)) + 1
          : 0

    const newQuestion: NewQuestionRow = {
      id,
      round: round as Round,
      questionTextIt: questionTextIt as string,
      questionTextEn: questionTextEn as string,
      correctAnswer: correctAnswer as string,
      acceptedAnswers,
      mediaType: mediaType as MediaType,
      hasReveal: hasReveal ? 1 : 0,
      order: nextOrder,
    }

    db.insert(questions).values(newQuestion).run()

    const created = db.select().from(questions).where(eq(questions.id, id)).get()
    res.status(201).json(created)
  } catch {
    res.status(500).json({ error: 'Failed to create question' })
  }
})

// PUT /api/questions/reorder — MUST be registered before /:id
questionsRouter.put('/reorder', (req: Request, res: Response) => {
  try {
    const body = req.body as { round?: unknown; questionIds?: unknown }

    if (
      typeof body.round !== 'number' ||
      ![1, 2, 3].includes(body.round) ||
      !Array.isArray(body.questionIds)
    ) {
      res.status(400).json({ error: 'Body must contain round (1|2|3) and questionIds (string[])' })
      return
    }

    const round = body.round as Round
    const questionIds = body.questionIds as string[]

    for (let i = 0; i < questionIds.length; i++) {
      const qId = questionIds[i]
      if (typeof qId === 'string') {
        db.update(questions).set({ order: i }).where(eq(questions.id, qId)).run()
      }
    }

    const updated = db
      .select()
      .from(questions)
      .where(eq(questions.round, round))
      .orderBy(asc(questions.order))
      .all()

    res.json(updated)
  } catch {
    res.status(500).json({ error: 'Failed to reorder questions' })
  }
})

// PUT /api/questions/:id — update text fields
questionsRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }
    const body = req.body as {
      questionTextIt?: unknown
      questionTextEn?: unknown
      correctAnswer?: unknown
      acceptedAnswers?: unknown
      hasReveal?: unknown
    }

    const existing = db.select().from(questions).where(eq(questions.id, id)).get()
    if (!existing) {
      res.status(404).json({ error: `Question ${id} not found` })
      return
    }

    const setParts: Partial<NewQuestionRow> = {}

    if (typeof body.questionTextIt === 'string') setParts.questionTextIt = body.questionTextIt
    if (typeof body.questionTextEn === 'string') setParts.questionTextEn = body.questionTextEn
    if (typeof body.correctAnswer === 'string') setParts.correctAnswer = body.correctAnswer
    if (Array.isArray(body.acceptedAnswers)) {
      setParts.acceptedAnswers = body.acceptedAnswers as string[]
    }
    if (body.hasReveal !== undefined) {
      setParts.hasReveal = body.hasReveal === true || body.hasReveal === 1 ? 1 : 0
    }

    if (Object.keys(setParts).length === 0) {
      res.status(400).json({ error: 'No updatable fields provided' })
      return
    }

    db.update(questions).set(setParts).where(eq(questions.id, id)).run()

    const updated = db.select().from(questions).where(eq(questions.id, id)).get()
    res.json(updated)
  } catch {
    res.status(500).json({ error: 'Failed to update question' })
  }
})

// DELETE /api/questions/:id — delete question + media folder
questionsRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }

    const existing = db.select().from(questions).where(eq(questions.id, id)).get()
    if (!existing) {
      res.status(404).json({ error: `Question ${id} not found` })
      return
    }

    db.delete(questions).where(eq(questions.id, id)).run()

    const mediaQDir = path.join(MEDIA_DIR, id)
    if (fs.existsSync(mediaQDir)) {
      fs.rmSync(mediaQDir, { recursive: true, force: true })
    }

    res.json({ message: `Question ${id} deleted` })
  } catch {
    res.status(500).json({ error: 'Failed to delete question' })
  }
})

// POST /api/questions/:id/media — upload file via multer
questionsRouter.post('/:id/media', upload.single('file'), (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }

    const existing = db.select().from(questions).where(eq(questions.id, id)).get()
    if (!existing) {
      if (req.file) fs.unlinkSync(req.file.path)
      res.status(404).json({ error: `Question ${id} not found` })
      return
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded — use multipart/form-data with field "file"' })
      return
    }

    const filename = req.file.originalname

    // Auto-update has_reveal flag when reveal file is uploaded
    if (/^reveal\.(jpg|jpeg|png)$/i.test(filename)) {
      db.update(questions).set({ hasReveal: 1 }).where(eq(questions.id, id)).run()
    }

    res.status(201).json({
      filename,
      url: `/media/${id}/${filename}`,
    })
  } catch {
    res.status(500).json({ error: 'Failed to upload media' })
  }
})

// DELETE /api/questions/:id/media?file=<filename> — remove specific file
questionsRouter.delete('/:id/media', (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }
    const filename = req.query['file']

    if (typeof filename !== 'string' || filename.trim() === '') {
      res.status(400).json({ error: 'Query param "file" is required' })
      return
    }

    const existing = db.select().from(questions).where(eq(questions.id, id)).get()
    if (!existing) {
      res.status(404).json({ error: `Question ${id} not found` })
      return
    }

    // Prevent path traversal
    const safeFilename = path.basename(filename)
    const filePath = path.join(MEDIA_DIR, id, safeFilename)

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: `File ${safeFilename} not found in question ${id}` })
      return
    }

    fs.unlinkSync(filePath)

    // If reveal file was deleted, update has_reveal flag
    if (/^reveal\.(jpg|jpeg|png)$/i.test(safeFilename)) {
      const mediaQDir = path.join(MEDIA_DIR, id)
      const remaining = fs.existsSync(mediaQDir) ? fs.readdirSync(mediaQDir) : []
      const stillHasReveal = remaining.some(f => /^reveal\.(jpg|jpeg|png)$/i.test(f))
      if (!stillHasReveal) {
        db.update(questions).set({ hasReveal: 0 }).where(eq(questions.id, id)).run()
      }
    }

    res.json({ message: `File ${safeFilename} deleted from question ${id}` })
  } catch {
    res.status(500).json({ error: 'Failed to delete media file' })
  }
})
