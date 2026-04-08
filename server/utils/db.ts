import { createClient, type Client } from '@libsql/client'

let client: Client | null = null
let initialized = false

export function useDB(): Client {
  if (client) return client
  const config = useRuntimeConfig()
  client = createClient({
    url: config.turso.url,
    authToken: config.turso.authToken || undefined,
  })
  return client
}

export async function ensureDB(): Promise<Client> {
  const db = useDB()
  if (initialized) return db
  initialized = true

  await db.batch([
    `CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      linear_issue_id TEXT,
      linear_issue_key TEXT,
      linear_issue_url TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS contexts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS user_settings (
      user_email TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      PRIMARY KEY (user_email, key)
    )`,
    `CREATE TABLE IF NOT EXISTS user_api_keys (
      user_email TEXT NOT NULL,
      key_name TEXT NOT NULL,
      encrypted_value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_email, key_name)
    )`,
    `CREATE TABLE IF NOT EXISTS api_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      token_hash TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME
    )`,
    `CREATE TABLE IF NOT EXISTS usage_counts (
      user_email TEXT NOT NULL,
      month TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_email, month)
    )`,
  ])

  // Idempotent column migrations via try/catch
  for (const stmt of [
    "ALTER TABLE entries ADD COLUMN task_status TEXT NOT NULL DEFAULT 'TRIAGE'",
    "ALTER TABLE entries ADD COLUMN assigned_to TEXT",
    "ALTER TABLE entries ADD COLUMN user_email TEXT DEFAULT ''",
    "ALTER TABLE entries ADD COLUMN conversation_summary TEXT DEFAULT ''",
    "ALTER TABLE contexts ADD COLUMN user_email TEXT DEFAULT ''",
  ]) {
    try { await db.execute(stmt) } catch { /* column already exists */ }
  }

  return db
}
