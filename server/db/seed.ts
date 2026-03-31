/**
 * Seed script — populates the database with example questions (1 per round).
 * Run: npx tsx server/db/seed.ts
 */
import { db } from './index.js'
import { questions } from './schema.js'

const seedData = [
  {
    id: 'q001',
    round: 1,
    questionTextIt: 'Di quale artista è questa canzone?',
    questionTextEn: 'Which artist is this song from?',
    correctAnswer: 'Queen',
    acceptedAnswers: ['queen', 'freddie mercury'],
    mediaType: 'audio' as const,
    hasReveal: 0,
    order: 0,
  },
  {
    id: 'q002',
    round: 2,
    questionTextIt: 'Di quale film è questa scena?',
    questionTextEn: 'Which movie is this scene from?',
    correctAnswer: 'Interstellar',
    acceptedAnswers: ['interstellar', 'nolan'],
    mediaType: 'video' as const,
    hasReveal: 1,
    order: 0,
  },
  {
    id: 'q003',
    round: 3,
    questionTextIt: 'Di quale brand è questo logo oscurato?',
    questionTextEn: 'Which brand does this obscured logo belong to?',
    correctAnswer: 'Apple',
    acceptedAnswers: ['apple', 'apple inc'],
    mediaType: 'image' as const,
    hasReveal: 1,
    order: 0,
  },
]

console.log('[Seed] Inserting example questions...')

for (const q of seedData) {
  db.insert(questions)
    .values(q)
    .onConflictDoNothing()
    .run()
  console.log(`[Seed] ✓ ${q.id} (Round ${q.round})`)
}

console.log('[Seed] Done.')
