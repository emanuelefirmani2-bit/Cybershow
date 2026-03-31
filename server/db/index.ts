import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { eq } from 'drizzle-orm'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { GameState } from '../../src/types/index.js'
import { gameStateSnapshot, questions } from './schema.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, '../../data/cybershow.db')
const MIGRATIONS_PATH = path.join(__dirname, '../../drizzle')

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

const sqlite = new Database(DB_PATH)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema: { questions, gameStateSnapshot } })

// Apply migrations if folder exists
if (fs.existsSync(MIGRATIONS_PATH)) {
  try {
    migrate(db, { migrationsFolder: MIGRATIONS_PATH })
  } catch (err) {
    console.error('[DB] Migration error:', err)
  }
}

/** Persist game state snapshot for disaster recovery. Always upserts row id=1. */
export function autosave(state: GameState): void {
  const now = new Date().toISOString()
  const stateJson = JSON.stringify(state)
  db.insert(gameStateSnapshot)
    .values({ id: 1, stateJson, updatedAt: now })
    .onConflictDoUpdate({
      target: gameStateSnapshot.id,
      set: { stateJson, updatedAt: now },
    })
    .run()
}

/** Load the last persisted game state. Returns null if no snapshot exists. */
export function loadState(): GameState | null {
  const row = db.select().from(gameStateSnapshot).where(eq(gameStateSnapshot.id, 1)).get()
  if (!row) return null
  try {
    return JSON.parse(row.stateJson) as GameState
  } catch {
    return null
  }
}

export { sqlite }
