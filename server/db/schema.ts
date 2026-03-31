import { customType, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Custom type: string[] stored as JSON TEXT in SQLite
const jsonStringArray = customType<{ data: string[]; driverData: string }>({
  dataType() {
    return 'text'
  },
  fromDriver(value: string): string[] {
    try {
      const parsed: unknown = JSON.parse(value)
      return Array.isArray(parsed) ? (parsed as string[]) : []
    } catch {
      return []
    }
  },
  toDriver(value: string[]): string {
    return JSON.stringify(value)
  },
})

export const questions = sqliteTable('questions', {
  id: text('id').primaryKey(),
  round: integer('round').notNull(),
  questionTextIt: text('question_text_it').notNull(),
  questionTextEn: text('question_text_en').notNull(),
  correctAnswer: text('correct_answer').notNull(),
  acceptedAnswers: jsonStringArray('accepted_answers').notNull(),
  mediaType: text('media_type', { enum: ['audio', 'video', 'image'] }).notNull(),
  hasReveal: integer('has_reveal').notNull().default(0),
  order: integer('order').notNull().default(0),
})

export const gameStateSnapshot = sqliteTable('game_state_snapshot', {
  id: integer('id').primaryKey(),
  stateJson: text('state_json').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export type QuestionRow = typeof questions.$inferSelect
export type NewQuestionRow = typeof questions.$inferInsert
