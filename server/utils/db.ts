import Database from 'better-sqlite3'
import { resolve } from 'path'

let db: Database.Database | null = null

export function useDB(): Database.Database {
  if (db) return db

  const dbPath = resolve(process.cwd(), 'data', 'voice-linear.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      linear_issue_id TEXT,
      linear_issue_key TEXT,
      linear_issue_url TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS contexts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Idempotent migration: add task_status and assigned_to columns to entries
  const columns = db.pragma('table_info(entries)') as { name: string }[]
  const columnNames = columns.map(c => c.name)

  if (!columnNames.includes('task_status')) {
    db.exec(`ALTER TABLE entries ADD COLUMN task_status TEXT NOT NULL DEFAULT 'TRIAGE'`)
  }
  if (!columnNames.includes('assigned_to')) {
    db.exec(`ALTER TABLE entries ADD COLUMN assigned_to TEXT`)
  }
  if (!columnNames.includes('user_email')) {
    db.exec(`ALTER TABLE entries ADD COLUMN user_email TEXT DEFAULT ''`)
  }

  // Idempotent migration: add user_email column to contexts
  const contextColumns = db.pragma('table_info(contexts)') as { name: string }[]
  const contextColumnNames = contextColumns.map(c => c.name)
  if (!contextColumnNames.includes('user_email')) {
    db.exec(`ALTER TABLE contexts ADD COLUMN user_email TEXT DEFAULT ''`)
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_email TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      PRIMARY KEY (user_email, key)
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_api_keys (
      user_email TEXT NOT NULL,
      key_name TEXT NOT NULL,
      encrypted_value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_email, key_name)
    )
  `)

  return db
}
